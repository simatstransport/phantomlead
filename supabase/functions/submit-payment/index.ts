import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { package_id, amount, upi_transaction_id } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: userData, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !userData.user) throw new Error('Unauthorized')

    // Find customer ID
    const { data: customerData } = await supabaseClient
      .from('customers')
      .select('id')
      .eq('user_id', userData.user.id)
      .single()
      
    if (!customerData) throw new Error('Customer profile not found')

    // Insert payment
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        customer_id: customerData.id,
        package_id,
        amount,
        upi_transaction_id,
        status: 'PENDING'
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    return new Response(JSON.stringify(payment), { headers: { 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { 'Content-Type': 'application/json' }, status: 500 })
  }
})
