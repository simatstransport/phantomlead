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
      .select(`*, packages (package_code, version)`)
      .eq('license_key_hash', license_key_hash)
      .eq('status', 'ACTIVE')
      .single()

    if (licenseError || !licenseData) {
      return new Response(JSON.stringify({ error: 'Unauthorized or invalid license' }), { headers: { 'Content-Type': 'application/json' }, status: 403 })
    }

    // Determine zip path based on package code and version
    const zipPath = `${licenseData.packages.package_code}/version-${licenseData.packages.version}.zip`

    // Generate signed URL (e.g., valid for 15 minutes)
    const { data: storageData, error: storageError } = await supabaseClient
      .storage
      .from('packages')
      .createSignedUrl(zipPath, 15 * 60)

    if (storageError) throw storageError

    return new Response(
      JSON.stringify({ url: storageData.signedUrl }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { 'Content-Type': 'application/json' }, status: 500 })
  }
})
