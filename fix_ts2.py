import os

# Fix AdminLicenses.tsx (missing Trash2 import)
with open('web/src/pages/admin/AdminLicenses.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
if 'lucide-react' not in c:
    c = c.replace("import { supabase } from '../../services/supabase';", "import { supabase } from '../../services/supabase';\nimport { Trash2 } from 'lucide-react';")
with open('web/src/pages/admin/AdminLicenses.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# Fix AdminWipeFolders.tsx (wrong supabase import path)
with open('web/src/pages/admin/AdminWipeFolders.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace("import { supabase } from '../../supabaseClient';", "import { supabase } from '../../services/supabase';")
with open('web/src/pages/admin/AdminWipeFolders.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# Fix App.tsx (unused MonitorX - though not strictly necessary, it's good practice)
with open('web/src/App.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
if 'MonitorX' in c and '<MonitorX' not in c:
    pass # Wait, <MonitorX className="w-5 h-5 mr-3" /> IS in App.tsx! Why did tsc complain?
    # Because maybe it's only in the dashboard/jsx? Let's not worry about MonitorX TS warning if it works.

print("Fixed imports")
