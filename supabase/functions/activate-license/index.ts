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

    if (licenseData.device_id) {
       // Already bound to a device, check if it's the same device or wiped
       const { data: deviceData } = await supabaseClient
         .from('devices')
         .select('fingerprint, hostname')
         .eq('id', licenseData.device_id)
         .single()
         
       const isSameDevice = (deviceData && (deviceData.fingerprint === fingerprint || (deviceData.hostname && device_info?.hostname && deviceData.hostname === device_info.hostname))) || !!licenseData.uninstalled_at;

       if (!isSameDevice) {
         return new Response(JSON.stringify({ activated: false, error: 'License already bound to another device' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
       }
       
       // Update fingerprint and reset uninstalled_at
       await supabaseClient.from('devices').update({ fingerprint: fingerprint, last_active_at: new Date().toISOString() }).eq('id', licenseData.device_id)
       if (licenseData.uninstalled_at) {
         await supabaseClient.from('licenses').update({ uninstalled_at: null }).eq('id', licenseData.id)
       }

       return new Response(JSON.stringify({ activated: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // Register new device
    const { data: newDevice, error: devError } = await supabaseClient
      .from('devices')
      .insert({
        customer_id: licenseData.customer_id,
        fingerprint: fingerprint,
        hostname: device_info?.hostname,
        os_info: device_info?.os_info
      })
      .select('id')
      .single()

    if (devError) throw devError

    // Bind device to license and clear uninstalled_at
    const updatePayload: Record<string, any> = { device_id: newDevice.id, uninstalled_at: null };
    // If this is a 10-minute demo trial (-10), trigger the exact 10-minute countdown right from the moment of activation!
    if (licenseData.duration_months === -10) {
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
