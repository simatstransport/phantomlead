import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { license_key } = await req.json()

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

    // Get license and package details
    const { data: licenseData, error: licenseError } = await supabaseClient
      .from('licenses')
      .select(`
        *,
        packages (
          id, package_code, version, sha256
        )
      `)
      .eq('license_key_hash', license_key_hash)
      .eq('status', 'ACTIVE')
      .single()

    if (licenseError || !licenseData) {
      return new Response(JSON.stringify({ error: 'Unauthorized or invalid license' }), { headers: { 'Content-Type': 'application/json' }, status: 403 })
    }

    // Get authorized extensions
    const { data: extensionsData, error: extError } = await supabaseClient
      .from('package_extensions')
      .select('extension_name')
      .eq('package_id', licenseData.packages.id)
      .eq('active', true)

    if (extError) throw extError

    const extensions = extensionsData.map(e => e.extension_name)

    return new Response(
      JSON.stringify({ 
        package_code: licenseData.packages.package_code,
        version: licenseData.packages.version,
        sha256: licenseData.packages.sha256,
        extensions: extensions
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { 'Content-Type': 'application/json' }, status: 500 })
  }
})
