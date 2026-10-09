import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { encryptLicenseKey, hashLicenseKey } from '../_shared/license-crypto.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { payment_id, action } = await req.json() // action = 'APPROVE' or 'REJECT'

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify Admin
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    )
    const jwt = authHeader.replace('Bearer ', '')
    const { data: userData } = await authClient.auth.getUser(jwt)
    if (!userData.user) throw new Error('Unauthorized')

    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', userData.user.id).single()
    if (!profile || profile.role !== 'admin') throw new Error('Forbidden')

    if (action === 'REJECT') {
      await supabaseClient.from('payments').update({ status: 'REJECTED', reviewed_at: new Date(), reviewed_by: userData.user.id }).eq('id', payment_id)
      return new Response(JSON.stringify({ message: 'Payment rejected' }), { status: 200 })
    }

    if (action === 'APPROVE') {
      const { data: payment } = await supabaseClient.from('payments').select('*').eq('id', payment_id).single()
      if (!payment) throw new Error('Payment not found')
      if (payment.status !== 'PENDING') throw new Error('Payment has already been reviewed')

      // Generate License
      const rawLicense = crypto.randomUUID().toUpperCase()
      const encryptionSecret = Deno.env.get('LICENSE_ENCRYPTION_KEY') ?? ''
      if (!encryptionSecret) throw new Error('License encryption is not configured')
      const [license_key_hash, license_key_encrypted] = await Promise.all([
        hashLicenseKey(rawLicense),
        encryptLicenseKey(rawLicense, encryptionSecret)
      ])

      let expires_at = null
      if (payment.duration_months) {
        const date = new Date()
        date.setMonth(date.getMonth() + payment.duration_months)
        expires_at = date.toISOString()
      }

      const { data: license, error: licenseError } = await supabaseClient.from('licenses').insert({
        license_key_hash,
        license_key_encrypted,
        customer_id: payment.customer_id,
        package_id: payment.package_id,
        payment_id: payment.id,
        status: 'ACTIVE',
        payment_type: 'PAID',
        duration_months: payment.duration_months,
        expires_at: expires_at
      }).select().single()
      if (licenseError) throw licenseError

      const { error: paymentUpdateError } = await supabaseClient.from('payments').update({ status: 'APPROVED', reviewed_at: new Date(), reviewed_by: userData.user.id }).eq('id', payment_id)
      if (paymentUpdateError) throw paymentUpdateError

      // Log it
      await supabaseClient.from('audit_logs').insert({
        action: 'PAYMENT_APPROVED',
        actor_id: userData.user.id,
        target_id: payment.id,
        details: { license_id: license.id }
      })

      return new Response(JSON.stringify({ message: 'Payment approved and license generated' }), { status: 200 })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { 'Content-Type': 'application/json' }, status: 500 })
  }
})
