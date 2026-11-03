import os

with open('web/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'AdminWipeFolders' not in content:
    content = content.replace("import { AdminSettings } from './pages/admin/AdminSettings';", "import { AdminSettings } from './pages/admin/AdminSettings';\nimport { AdminWipeFolders } from './pages/admin/AdminWipeFolders';")
    
    if 'MonitorX' not in content:
        content = content.replace("} from 'lucide-react';", ", MonitorX } from 'lucide-react';")
        
    sidebar_link = """                <Link to="/admin/customers" className="flex items-center px-4 py-2.5 text-gray-300 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"><Users className="w-5 h-5 mr-3" /> Customers</Link>
                <Link to="/admin/wipe-folders" className="flex items-center px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors mt-2 border border-red-900/30"><MonitorX className="w-5 h-5 mr-3" /> Delete User Folders</Link>"""
    
    content = content.replace('                <Link to="/admin/customers" className="flex items-center px-4 py-2.5 text-gray-300 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"><Users className="w-5 h-5 mr-3" /> Customers</Link>', sidebar_link)
    
    route_def = """            <Route path="/admin/customers" element={session ? (isAdmin ? <DashboardLayout title="Customers" isAdmin={true}><AdminCustomers /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/wipe-folders" element={session ? (isAdmin ? <DashboardLayout title="Delete User Folders" isAdmin={true}><AdminWipeFolders /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />"""
            
    content = content.replace('            <Route path="/admin/customers" element={session ? (isAdmin ? <DashboardLayout title="Customers" isAdmin={true}><AdminCustomers /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />', route_def)
    
    card_def = """              <Link to="/admin/customers" className="p-4 bg-black border border-gray-800 rounded-lg hover:border-green-500 transition-colors group">
                <Users className="w-6 h-6 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                <div className="font-medium text-white mb-1">Manage Users</div>
                <div className="text-xs text-gray-500">Block, delete, or view registered customers</div>
              </Link>

              <Link to="/admin/wipe-folders" className="p-4 bg-black border border-red-900/50 rounded-lg hover:border-red-500 transition-colors group shadow-lg shadow-red-900/10">
                <MonitorX className="w-6 h-6 text-red-500 mb-3 group-hover:scale-110 transition-transform" />
                <div className="font-medium text-white mb-1">Delete User Folders</div>
                <div className="text-xs text-gray-500">Remotely wipe SEB files from user host</div>
              </Link>"""
    
    content = content.replace("""              <Link to="/admin/customers" className="p-4 bg-black border border-gray-800 rounded-lg hover:border-green-500 transition-colors group">
                <Users className="w-6 h-6 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                <div className="font-medium text-white mb-1">Manage Users</div>
                <div className="text-xs text-gray-500">Block, delete, or view registered customers</div>
              </Link>""", card_def)

    with open('web/src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added AdminWipeFolders to App.tsx")
else:
    print("AdminWipeFolders already in App.tsx")
