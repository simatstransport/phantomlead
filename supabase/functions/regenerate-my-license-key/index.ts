import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { decryptLicenseKey, encryptLicenseKey, hashLicenseKey } from '../_shared/license-crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: userData, error: authError } = await authClient.auth.getUser()
    if (authError || !userData.user) throw new Error('Unauthorized')

    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { data: customer, error: customerError } = await serviceClient
      .from('customers')
      .select('id')
      .eq('user_id', userData.user.id)
      .single()
    if (customerError || !customer) throw new Error('Customer profile not found')

    const { license_id } = await req.json()
    if (typeof license_id !== 'string') throw new Error('License ID is required')

    const { data: license, error: licenseError } = await serviceClient
      .from('licenses')
      .select('id, status, license_key_encrypted')
      .eq('id', license_id)
      .eq('customer_id', customer.id)
      .single()
    if (licenseError || !license) throw new Error('License not found for this account')
    if (license.status !== 'ACTIVE') throw new Error('Only active licenses can receive a replacement key')

    const encryptionSecret = Deno.env.get('LICENSE_ENCRYPTION_KEY') ?? ''
    if (!encryptionSecret) throw new Error('License encryption is not configured')

    if (license.license_key_encrypted) {
      const existingKey = await decryptLicenseKey(license.license_key_encrypted, encryptionSecret)
      return new Response(JSON.stringify({ license_key: existingKey }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    const licenseKey = crypto.randomUUID().toUpperCase()
    const [licenseKeyHash, encryptedLicenseKey] = await Promise.all([
      hashLicenseKey(licenseKey),
      encryptLicenseKey(licenseKey, encryptionSecret)
    ])

    const { data: updatedLicense, error: updateError } = await serviceClient
      .from('licenses')
      .update({ license_key_hash: licenseKeyHash, license_key_encrypted: encryptedLicenseKey })
      .eq('id', license.id)
      .eq('customer_id', customer.id)
      .eq('status', 'ACTIVE')
      .is('license_key_encrypted', null)
      .select('id')
      .maybeSingle()
    if (updateError) throw updateError

    if (!updatedLicense) {
      const { data: latestLicense, error: latestError } = await serviceClient
        .from('licenses')
        .select('license_key_encrypted')
        .eq('id', license.id)
        .eq('customer_id', customer.id)
        .single()
      if (latestError || !latestLicense?.license_key_encrypted) throw new Error('Could not save a replacement key')
      const existingKey = await decryptLicenseKey(latestLicense.license_key_encrypted, encryptionSecret)
      return new Response(JSON.stringify({ license_key: existingKey }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    return new Response(JSON.stringify({ license_key: licenseKey }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    const status = message === 'Unauthorized' ? 401 : message === 'License not found for this account' ? 404 : 400
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status
    })
  }
})