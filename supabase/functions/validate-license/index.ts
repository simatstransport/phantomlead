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
      await supabaseClient.from('licenses').update({ uninstalled_at: new Date().toISOString() }).eq('license_key_hash', license_key_hash);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // Find license
    const { data: licenseData, error: licenseError } = await supabaseClient
      .from('licenses')
      .select('*, packages(package_code), devices(fingerprint, hostname)')
      .eq('license_key_hash', license_key_hash)
      .single()

    if (licenseError || !licenseData) {
      return new Response(JSON.stringify({ valid: false, status: 'INVALID', error: 'Invalid license key' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    if (licenseData.status !== 'ACTIVE') {
      return new Response(JSON.stringify({ valid: false, status: licenseData.status || 'REVOKED', error: 'License is not active' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    if (licenseData.expires_at && new Date(licenseData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, status: 'EXPIRED', error: 'License expired' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
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
