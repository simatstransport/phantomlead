import os
import re

with open('web/src/pages/admin/AdminLicenses.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'Trash2' not in content:
    content = content.replace("from 'lucide-react';", ", Trash2 } from 'lucide-react';")

# Replace exactly this part:
#                 <td className="py-4">
#                   <span className={`px-2 py-1 rounded text-xs ${l.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
#                     {l.status}
#                   </span>
#                 </td>

target = """                <td className="py-4">
                  <span className={`px-2 py-1 rounded text-xs ${l.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {l.status}
                  </span>
                </td>"""

new_status_cell = """                <td className="py-4">
                  <div className="flex flex-col gap-1 items-start">
                    <span className={`px-2 py-1 rounded text-xs ${l.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {l.status}
                    </span>
                    {l.uninstalled_at && (
                      <span className="text-xs text-red-500 flex items-center font-bold bg-red-950/40 px-2 py-1 rounded border border-red-900 mt-1">
                        <Trash2 className="w-3 h-3 mr-1" /> Host Folders Wiped
                      </span>
                    )}
                  </div>
                </td>"""

if target in content:
    content = content.replace(target, new_status_cell)
else:
    print("WARNING: Could not find strict target string!")
    # regex fallback
    content = re.sub(
        r'<td className="py-4">\s*<span className=\{`px-2 py-1 rounded text-xs \$\{l\.status === \'ACTIVE\' \? \'bg-green-500/20 text-green-400\' : \'bg-red-500/20 text-red-400\'\}`\}>\s*\{l\.status\}\s*</span>\s*</td>',
        new_status_cell,
        content
    )

if 'uninstalled_at?: string;' not in content:
    content = content.replace('status: string;', 'status: string;\n  uninstalled_at?: string;')

with open('web/src/pages/admin/AdminLicenses.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated AdminLicenses.tsx")
