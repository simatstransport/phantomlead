import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { encryptLicenseKey, hashLicenseKey } from '../_shared/license-crypto.ts'

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
    if (!authHeader) throw new Error('Missing authorization header')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const encryptionSecret = Deno.env.get('LICENSE_ENCRYPTION_KEY') ?? ''
    if (!encryptionSecret) throw new Error('License encryption is not configured')

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    })
    const jwt = authHeader.replace('Bearer ', '')
    const { data: userData, error: authError } = await authClient.auth.getUser(jwt)
    if (authError || !userData.user) throw new Error('Unauthorized')

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()
    if (profile?.role !== 'admin') throw new Error('Forbidden')

    const { customer_email, package_code, duration_months } = await req.json()
    if (typeof customer_email !== 'string' || typeof package_code !== 'string') {
      throw new Error('Customer email and package code are required')
    }

    const { data: customer, error: customerError } = await serviceClient
      .from('customers')
      .select('id')
      .eq('email', customer_email.trim().toLowerCase())
      .single()
    if (customerError || !customer) throw new Error('Customer not found')

    const { data: pkg, error: packageError } = await serviceClient
      .from('packages')
      .select('id')
      .eq('package_code', package_code.trim())
      .single()
    if (packageError || !pkg) throw new Error('Package not found')

    const licenseKey = crypto.randomUUID().toUpperCase()
    const [licenseKeyHash, encryptedLicenseKey] = await Promise.all([
      hashLicenseKey(licenseKey),
      encryptLicenseKey(licenseKey, encryptionSecret)
    ])

    let expires_at = null
    if (typeof duration_months === 'number' && duration_months > 0) {
      const date = new Date()
      date.setMonth(date.getMonth() + duration_months)
      expires_at = date.toISOString()
    }

    let finalDuration = duration_months;
    if (finalDuration === null || finalDuration === undefined) {
      finalDuration = -1; // Default to Lifetime
    }

    const { error: insertError } = await serviceClient.from('licenses').insert({
      license_key_hash: licenseKeyHash,
      license_key_encrypted: encryptedLicenseKey,
      customer_id: customer.id,
      package_id: pkg.id,
      status: 'ACTIVE',
      payment_type: 'FREE',
      duration_months: finalDuration,
      expires_at: expires_at,
      max_devices: 1
    })
    if (insertError) throw insertError

    return new Response(JSON.stringify({ license_key: licenseKey }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status
    })
  }
})