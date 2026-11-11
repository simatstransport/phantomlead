import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { license_key, action } = body
    const fingerprint = body.fingerprint || body.device_id
    const clientHostname = body.hostname || body.device_info?.hostname

    // Needs service role to bypass RLS to validate device and license
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Hash the license key for DB lookup
    const encoder = new TextEncoder()
    const data = encoder.encode(license_key)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const license_key_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (action === 'REPORT_DELETED') {
      const { data: updateData } = await supabaseClient.from('licenses').select('id, device_id').eq('license_key_hash', license_key_hash);
      if (updateData && updateData.length > 0) {
        const lic = updateData[0];
        const licId = lic.id;
        await supabaseClient.from('audit_logs').insert({
          action: 'HOST_WIPE_SUCCESS',
          target_id: licId,
          details: { message: 'All application folders and extensions wiped successfully. Hardware binding cleared.', device_id: fingerprint, timestamp: new Date().toISOString() }
        });
        
        // Clear the hardware binding and mark uninstalled_at so user can bind new key
        if (lic.device_id) {
          await supabaseClient.from('devices').delete().eq('id', lic.device_id);
        }
        await supabaseClient.from('licenses').update({ 
          status: 'REVOKED', 
          device_id: null, 
          uninstalled_at: new Date().toISOString() 
        }).eq('id', licId);
      }
      return new Response(JSON.stringify({ success: true, message: 'Wiped and hardware binding cleared' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    if (action === 'REPORT_ERROR') {
      const errorMsg = body.error || 'Failed to wipe files on host';
      const { data: lic } = await supabaseClient.from('licenses').select('id').eq('license_key_hash', license_key_hash).single();
      if (lic) {
        await supabaseClient.from('audit_logs').insert({
          action: 'HOST_WIPE_ERROR',
          target_id: lic.id,
          details: { error: errorMsg, device_id: fingerprint, timestamp: new Date().toISOString() }
        });
      }
      return new Response(JSON.stringify({ success: true, reported_error: errorMsg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // Check if the current machine / fingerprint is blacklisted
    if (fingerprint) {
      const { data: blacklistedDev } = await supabaseClient
        .from('devices')
        .select('id, is_blacklisted, blacklist_reason')
        .eq('fingerprint', fingerprint)
        .maybeSingle()

      if (blacklistedDev && blacklistedDev.is_blacklisted) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            status: 'DEVICE_BLACKLISTED', 
            error: `Hardware device has been blackmarked by Admin: ${blacklistedDev.blacklist_reason || 'Security Violation'}. Execution halted.` 
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
    }

    // Find license
    const { data: licenseData, error: licenseError } = await supabaseClient
      .from('licenses')
      .select('*, packages(package_code), devices(fingerprint, hostname, is_blacklisted, blacklist_reason)')
      .eq('license_key_hash', license_key_hash)
      .single()

    if (licenseError || !licenseData) {
      return new Response(JSON.stringify({ valid: false, status: 'INVALID', error: 'Invalid license key' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    if (licenseData.devices && licenseData.devices.is_blacklisted) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          status: 'DEVICE_BLACKLISTED', 
          error: `Bound machine is blacklisted: ${licenseData.devices.blacklist_reason || 'Prohibited Device HWID'}` 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    if (licenseData.status !== 'ACTIVE') {
      return new Response(JSON.stringify({ valid: false, status: licenseData.status || 'REVOKED', error: 'License is not active' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    if (licenseData.expires_at && new Date(licenseData.expires_at) < new Date()) {
      // Mark license EXPIRED and trigger remote wipe command flag
      await supabaseClient
        .from('licenses')
        .update({ status: 'EXPIRED', device_id: null, expired_at: new Date().toISOString() })
        .eq('id', licenseData.id)

      if (licenseData.device_id) {
        await supabaseClient.from('devices').delete().eq('id', licenseData.device_id)
      }

      return new Response(
        JSON.stringify({ 
          valid: false, 
          status: 'EXPIRED', 
          execute_wipe: true, 
          error: 'License validity period expired. Client session self-destruct engaged.' 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // If license was wiped/uninstalled, allow reinstall on the same or new device
    if (!licenseData.uninstalled_at && licenseData.devices && fingerprint) {
      const boundFp = licenseData.devices.fingerprint;
      const boundHost = licenseData.devices.hostname;
      
      const isMatch = (boundFp === fingerprint) || (boundHost && clientHostname && boundHost === clientHostname);
      if (!isMatch) {
        return new Response(JSON.stringify({ valid: false, error: 'This license is already registered to another device.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
      }
    }

    return new Response(
      JSON.stringify({ 
        valid: true,
        status: licenseData.status,
        expires_at: licenseData.expires_at,
        license_id: licenseData.id,
        package_code: licenseData.packages?.package_code
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
