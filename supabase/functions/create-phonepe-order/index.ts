import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { package_id, duration_months, amount, redirect_url } = await req.json()
    if (!package_id || !amount) {
      throw new Error('package_id and amount are required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    // Authenticate Student
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    })
    const jwt = authHeader.replace('Bearer ', '')
    const { data: userData } = await authClient.auth.getUser(jwt)
    if (!userData.user) throw new Error('Unauthorized')

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Lookup customer record
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, full_name, email, phone')
      .eq('user_id', userData.user.id)
      .single()

    if (!customer) throw new Error('Customer profile not found. Please complete profile details first.')

    // Generate unique merchant transaction ID
    const merchantTransactionId = `PL_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Insert pending payment record into Supabase
    const { data: paymentRecord, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        customer_id: customer.id,
        package_id,
        amount: Number(amount),
        duration_months: duration_months === null ? -1 : Number(duration_months),
        upi_transaction_id: merchantTransactionId,
        status: 'PENDING'
      })
      .select('id')
      .single()

    if (paymentError) throw new Error(`Database error: ${paymentError.message}`)

    // PhonePe Configuration (reads from Supabase Secrets or falls back to PhonePe official UAT Simulator)
    const merchantId = Deno.env.get('PHONEPE_MERCHANT_ID') || 'PGTESTPAYUAT'
    const saltKey = Deno.env.get('PHONEPE_SALT_KEY') || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399'
    const saltIndex = Deno.env.get('PHONEPE_SALT_INDEX') || '1'
    const isProd = Deno.env.get('PHONEPE_ENV') === 'PRODUCTION'

    const phonePeHost = isProd 
      ? 'https://api.phonepe.com/apis/hermes' 
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox'

    const callbackUrl = `${supabaseUrl}/functions/v1/phonepe-webhook`
    const returnUrl = redirect_url || 'https://phantomlead.vercel.app/dashboard/licenses'

    // Amount in Paise (e.g. ₹2000 = 200000 paise)
    const amountInPaise = Math.round(Number(amount) * 100)

    const payload = {
      merchantId,
      merchantTransactionId,
      merchantUserId: `CUST_${customer.id.substring(0, 12)}`,
      amount: amountInPaise,
      redirectUrl: returnUrl,
      redirectMode: 'REDIRECT',
      callbackUrl,
      mobileNumber: customer.phone ? customer.phone.replace(/\D/g, '').slice(-10) : '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    }

    const base64Payload = btoa(JSON.stringify(payload))
    const verificationString = `${base64Payload}/pg/v1/pay${saltKey}`
    const sha = await sha256(verificationString)
    const xVerify = `${sha}###${saltIndex}`

    // Call PhonePe PG
    const phonePeRes = await fetch(`${phonePeHost}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify
      },
      body: JSON.stringify({
        request: base64Payload
      })
    })

    const phonePeData = await phonePeRes.json()

    if (phonePeData.success && phonePeData.data?.instrumentResponse?.redirectInfo?.url) {
      const checkoutUrl = phonePeData.data.instrumentResponse.redirectInfo.url
      return new Response(JSON.stringify({
        success: true,
        checkout_url: checkoutUrl,
        transaction_id: merchantTransactionId,
        payment_id: paymentRecord.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    } else {
      throw new Error(phonePeData.message || 'Failed to initiate PhonePe payment.')
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
