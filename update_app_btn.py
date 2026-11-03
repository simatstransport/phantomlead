import os

with open('web/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard/licenses" className="inline-flex px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium">View my licenses</Link>"""

replacement = """          <div className="flex flex-col items-start gap-6">
            <Link to="/dashboard/licenses" className="inline-flex items-center px-6 py-2 bg-[#00ff00]/10 border border-[#00ff00] text-[#00ff00] hover:bg-[#00ff00]/20 hover:shadow-[0_0_15px_rgba(0,255,0,0.5)] rounded-full font-bold uppercase tracking-wider text-xs transition-all w-max">
              View my licenses
            </Link>"""

if target in content:
    content = content.replace(target, replacement)
    with open('web/src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated App.tsx View my licenses button UI")
else:
    print("Target not found.")
