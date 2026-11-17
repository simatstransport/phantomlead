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
    const { license_key, fingerprint, device_info } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Hash license key
    const encoder = new TextEncoder()
    const data = encoder.encode(license_key)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const license_key_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Get license
    const { data: licenseData, error: licenseError } = await supabaseClient
      .from('licenses')
      .select('*')
      .eq('license_key_hash', license_key_hash)
      .eq('status', 'ACTIVE')
      .single()

    if (licenseError || !licenseData) {
      return new Response(JSON.stringify({ activated: false, error: 'Unauthorized or invalid license' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    if (licenseData.expires_at && new Date(licenseData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ activated: false, error: 'License has expired.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    // Resolve or register the device by its unique hardware fingerprint
    let deviceId: string;
    const { data: existingDevice } = await supabaseClient
      .from('devices')
      .select('id, customer_id, fingerprint, hostname')
      .eq('fingerprint', fingerprint)
      .maybeSingle()

    if (existingDevice) {
      deviceId = existingDevice.id;
      // Refresh hardware metadata & touch last_active_at
      await supabaseClient
        .from('devices')
        .update({
          customer_id: licenseData.customer_id,
          hostname: device_info?.hostname || existingDevice.hostname,
          os_info: device_info?.os_info,
          last_active_at: new Date().toISOString()
        })
        .eq('id', deviceId);
    } else {
      // Register new device row
      const { data: newDevice, error: devError } = await supabaseClient
        .from('devices')
        .insert({
          customer_id: licenseData.customer_id,
          fingerprint: fingerprint,
          hostname: device_info?.hostname,
          os_info: device_info?.os_info,
          last_active_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (devError) throw devError
      deviceId = newDevice.id;
    }

    // Verify 1-PC device binding lock
    if (licenseData.device_id && licenseData.device_id !== deviceId) {
      const { data: boundDevice } = await supabaseClient
        .from('devices')
        .select('fingerprint, hostname')
        .eq('id', licenseData.device_id)
        .maybeSingle()

      const isSameHost = boundDevice && device_info?.hostname && boundDevice.hostname === device_info.hostname;
      const isAllowedRebind = !!licenseData.uninstalled_at || isSameHost;

      if (!isAllowedRebind) {
        return new Response(
          JSON.stringify({ activated: false, error: 'License already bound to another device' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }
    }

    // Bind device to license and clear uninstalled_at flag
    const updatePayload: Record<string, any> = { device_id: deviceId, uninstalled_at: null };

    // If 10-minute demo trial (-10), trigger 10-minute countdown on first activation
    if (licenseData.duration_months === -10 && !licenseData.expires_at) {
      updatePayload.expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    }

    const { error: updateError } = await supabaseClient
      .from('licenses')
      .update(updatePayload)
      .eq('id', licenseData.id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ activated: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
