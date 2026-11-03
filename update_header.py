import re

with open('web/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Logo and S_PLATFORM -> PhantomLead
old_logo = '''          <div className="flex items-center">
            <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)] mr-2 object-cover" />
            <span className="font-bold text-lg tracking-wider text-green-50">S_PLATFORM</span>
          </div>'''

new_logo = '''          <div className="flex items-center">
            <div className="relative w-8 h-8 mr-3">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full rounded-full border-2 border-green-500/50 object-cover relative z-10" />
              <div className="absolute inset-[-4px] rounded-full border border-transparent border-t-green-400 border-l-green-400/30 animate-spin z-0"></div>
              <div className="absolute inset-[-6px] rounded-full border border-green-900/50 animate-[spin_3s_linear_reverse_infinite] z-0"></div>
            </div>
            <span className="font-bold text-lg tracking-wider text-green-50">PhantomLead</span>
          </div>'''

content = content.replace(old_logo, new_logo)

# 2. Add userName state and fetch logic to DashboardLayout
# Find: const [sidebarOpen, setSidebarOpen] = useState(false);
state_injection = '''  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('customers').select('full_name').eq('user_id', user.id).single().then(({ data }) => {
          if (data && data.full_name) {
            setUserName(data.full_name);
          } else {
            setUserName(user.email?.split('@')[0] || 'User');
          }
        });
      }
    });
  }, []);'''

content = content.replace('  const [sidebarOpen, setSidebarOpen] = useState(false);', state_injection)

# 3. Add userName to the header
old_header_user = '''          <div className="ml-auto flex items-center gap-4">
            <div className="w-8 h-8 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]"><User className="w-4 h-4 text-green-400" /></div>
          </div>'''

new_header_user = '''          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm font-medium text-green-400 hidden sm:block">{userName}</span>
            <div className="w-8 h-8 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]"><User className="w-4 h-4 text-green-400" /></div>
          </div>'''

content = content.replace(old_header_user, new_header_user)

with open('web/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated App.tsx with PhantomLead and user name.")
