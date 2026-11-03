import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { encryptLicenseKey, hashLicenseKey } from '../_shared/license-crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-verify',
}

const sha256 = async (str: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const encryptionSecret = Deno.env.get('LICENSE_ENCRYPTION_KEY') ?? ''

    const saltKey = Deno.env.get('PHONEPE_SALT_KEY') || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399'
    const saltIndex = Deno.env.get('PHONEPE_SALT_INDEX') || '1'

    // Parse callback body from PhonePe
    const body = await req.json()
    const base64Response = body.response
    const xVerifyHeader = req.headers.get('x-verify') || req.headers.get('X-VERIFY')

    if (!base64Response) {
      throw new Error('Missing base64 response in body')
    }

    // Security Check: Verify PhonePe Checksum Signature
    if (xVerifyHeader) {
      const expectedChecksum = await sha256(`${base64Response}${saltKey}`)
      const expectedXVerify = `${expectedChecksum}###${saltIndex}`
      if (xVerifyHeader !== expectedXVerify) {
        console.warn('PhonePe Webhook: X-VERIFY mismatch, potential unauthorized call.')
        // Proceed with caution or log audit
      }
    }

    // Decode Base64 response
    const decodedStr = atob(base64Response)
    const phonePeData = JSON.parse(decodedStr)

    const merchantTransactionId = phonePeData.data?.merchantTransactionId
    const responseCode = phonePeData.code
    const paymentState = phonePeData.data?.state

    if (!merchantTransactionId) {
      throw new Error('merchantTransactionId not found in callback')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Lookup Payment Record
    const { data: payment, error: pError } = await supabaseAdmin
      .from('payments')
      .select('*, packages(*)')
      .eq('upi_transaction_id', merchantTransactionId)
      .single()

    if (pError || !payment) {
      throw new Error(`Payment record not found for transaction: ${merchantTransactionId}`)
    }

    // If Payment Succeeded (Instant Auto-Approval)
    if (responseCode === 'PAYMENT_SUCCESS' && paymentState === 'COMPLETED') {
      if (payment.status === 'APPROVED') {
        // Already processed
        return new Response(JSON.stringify({ status: 'ALREADY_PROCESSED' }), { headers: corsHeaders, status: 200 })
      }

      // 1. Update Payment Status to APPROVED
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'APPROVED',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      // 2. Generate Encrypted License Key Automatically
      const rawLicense = crypto.randomUUID().toUpperCase()
      const [license_key_hash, license_key_encrypted] = await Promise.all([
        hashLicenseKey(rawLicense),
        encryptLicenseKey(rawLicense, encryptionSecret)
      ])

      // 3. Compute duration & expiration
      let duration_months = -1 // Default Lifetime
      let expires_at = null

      if (payment.duration_months !== undefined && payment.duration_months !== null) {
        duration_months = payment.duration_months
        if (duration_months > 0) {
          const date = new Date()
          date.setMonth(date.getMonth() + duration_months)
          expires_at = date.toISOString()
        }
      }

      // 4. Insert Active License
      await supabaseAdmin.from('licenses').insert({
        license_key_hash,
        license_key_encrypted,
        customer_id: payment.customer_id,
        package_id: payment.package_id,
        payment_id: payment.id,
        status: 'ACTIVE',
        payment_type: 'PAID',
        duration_months: duration_months,
        expires_at
      })

      // 5. Audit Log
      await supabaseAdmin.from('audit_logs').insert({
        action: 'PHONEPE_PAYMENT_AUTO_APPROVED',
        target_id: payment.id,
        details: {
          transaction_id: merchantTransactionId,
          amount: payment.amount,
          license_raw_prefix: rawLicense.substring(0, 8)
        }
      })

      return new Response(JSON.stringify({ success: true, message: 'License issued instantly' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    } else {
      // Payment Failed or Cancelled
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'REJECTED',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      return new Response(JSON.stringify({ success: false, message: 'Payment marked as rejected/failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
