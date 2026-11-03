import os

with open('web/src/pages/admin/AdminLicenses.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '<button onClick={() => handleRevoke(l.id)} className="text-red-400 hover:text-red-300 text-sm">Revoke</button>'
new_btn = """<button onClick={() => handleRevoke(l.id)} className="bg-red-900/50 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 shadow-lg shadow-red-900/20">
                      <Trash2 className="w-3 h-3" /> Trigger Host Wipe
                    </button>"""

if target in content:
    content = content.replace(target, new_btn)
    content = content.replace(
        "if (!window.confirm('Are you sure you want to revoke this license? The customer software will lock out immediately.')) return;",
        "if (!window.confirm('WARNING: Are you sure you want to WIPE this customer\\'s folders? Within the next 30 minutes (or on their next restart), their Safe Exam Browser files will be permanently deleted from their host machine.')) return;"
    )
    with open('web/src/pages/admin/AdminLicenses.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated button successfully")
else:
    print("Target button not found. Regex fallback needed.")
