import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
    if (profile?.role !== 'admin' && profile?.role !== 'co_admin') throw new Error('Forbidden')

    const { action, package_id, package_data, pricing_matrix } = await req.json()

    if (action === 'UPDATE_PACKAGE') {
      const { error } = await serviceClient
        .from('packages')
        .update(package_data)
        .eq('id', package_id)

      if (error) throw error

      return new Response(JSON.stringify({ success: true, message: 'Package updated successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'CREATE_PACKAGE') {
      const { data, error } = await serviceClient
        .from('packages')
        .insert(package_data)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ success: true, package: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'SAVE_PRICING_MATRIX') {
      // Save full pricing matrix into admin_settings
      const { error } = await serviceClient
        .from('admin_settings')
        .upsert({
          key: 'custom_package_pricing',
          value: pricing_matrix,
          description: 'Dynamic month-wise pricing matrix (1 Mo, 2 Mos, 3 Mos, Lifetime)',
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })

      if (error) throw error

      return new Response(JSON.stringify({ success: true, message: 'Pricing matrix saved successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    throw new Error('Unknown action')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status
    })
  }
})
