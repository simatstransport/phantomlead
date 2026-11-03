import os

with open('web/src/pages/admin/AdminWipeFolders.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('../../../supabaseClient', '../../supabaseClient')
with open('web/src/pages/admin/AdminWipeFolders.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

with open('web/src/pages/admin/AdminLicenses.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
if 'Trash2' not in c[:1000]:
    c = c.replace("} from 'lucide-react';", ", Trash2 } from 'lucide-react';")
with open('web/src/pages/admin/AdminLicenses.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
    
with open('web/src/App.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
if '<AdminWipeFolders />' not in c:
    c = c.replace('<AdminCustomers /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />', '<AdminCustomers /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />\n            <Route path="/admin/wipe-folders" element={session ? (isAdmin ? <DashboardLayout title="Delete User Folders" isAdmin={true}><AdminWipeFolders /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />')
with open('web/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
