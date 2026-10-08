import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { decryptLicenseKey } from '../_shared/license-crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: userData, error: authError } = await authClient.auth.getUser()
    if (authError || !userData.user) throw new Error('Unauthorized')

    const encryptionSecret = Deno.env.get('LICENSE_ENCRYPTION_KEY') ?? ''
    if (!encryptionSecret) throw new Error('License encryption is not configured')

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

    const { data: licenses, error: licensesError } = await serviceClient
      .from('licenses')
      .select('id, license_key_encrypted')
      .eq('customer_id', customer.id)
    if (licensesError) throw licensesError

    const keys = await Promise.all((licenses || []).map(async license => ({
      license_id: license.id,
      license_key: license.license_key_encrypted
        ? await decryptLicenseKey(license.license_key_encrypted, encryptionSecret)
        : null
    })))

    return new Response(JSON.stringify({ keys }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    const status = message === 'Unauthorized' ? 401 : message === 'Customer profile not found' ? 404 : 400
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status
    })
  }
})