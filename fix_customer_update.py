import re

with open('web/src/pages/CustomerPackages.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    const { error: custError } = await supabase.from('customers').upsert({
      user_id: user.id,
      email: user.email,
      full_name: formData.fullName,
      phone: formData.phone,
      college_name: formData.collegeName,
      academic_year: formData.academicYear
    }, { onConflict: 'user_id' });"""

replacement = """    const { error: custError } = await supabase.from('customers').update({
      full_name: formData.fullName,
      phone: formData.phone,
      college_name: formData.collegeName,
      academic_year: formData.academicYear
    }).eq('user_id', user.id);"""

if target in content:
    content = content.replace(target, replacement)
    print("Updated exactly!")
else:
    # regex fallback
    regex = r"const\s*\{\s*error:\s*custError\s*\}\s*=\s*await\s*supabase\.from\('customers'\)\.upsert\(\{[^}]+\},\s*\{\s*onConflict:\s*'user_id'\s*\}\);"
    content = re.sub(regex, replacement, content)
    print("Updated via regex")

with open('web/src/pages/CustomerPackages.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
