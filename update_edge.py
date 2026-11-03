import os

with open('supabase/functions/validate-license/index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """    const { license_key, device_id, action } = await req.json()
    const fingerprint = device_id;

    // Needs service role to bypass RLS to validate device and license
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Hash the license key for DB lookup
    const encoder = new TextEncoder()
    const data = encoder.encode(license_key)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const license_key_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (action === 'REPORT_DELETED') {
      await supabaseClient.from('licenses').update({ uninstalled_at: new Date().toISOString() }).eq('license_key_hash', license_key_hash);
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }, status: 200 })
    }
"""

content = content.replace("    const { license_key, device_id } = await req.json()\n    const fingerprint = device_id;\n\n    // Needs service role to bypass RLS to validate device and license\n    const supabaseClient = createClient(\n      Deno.env.get('SUPABASE_URL') ?? '',\n      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''\n    )\n\n    // Hash the license key for DB lookup\n    const encoder = new TextEncoder()\n    const data = encoder.encode(license_key)\n    const hashBuffer = await crypto.subtle.digest('SHA-256', data)\n    const hashArray = Array.from(new Uint8Array(hashBuffer))\n    const license_key_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')", replacement)

with open('supabase/functions/validate-license/index.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated!")
