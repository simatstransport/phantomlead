import re

with open('web/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'AlertTriangle' not in content:
    content = content.replace("} from 'lucide-react';", ", AlertTriangle } from 'lucide-react';")

download_block = """            return (
              <a href={`https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/${installerName}`} download className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-medium">
                <Download className="w-4 h-4" /> Download Installer
              </a>
            );"""

new_download_block = """            return (
              <div className="flex flex-col gap-4">
                <div>
                  <a href={`https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/${installerName}`} download className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all">
                    <Download className="w-5 h-5" /> Download Secure Installer
                  </a>
                </div>
                {(installerName === 'SecureInstaller_T.exe' || installerName === 'SecureInstaller_A.exe') && (
                  <div className="mt-2 p-4 border border-red-900/50 bg-red-950/20 rounded-lg max-w-xl">
                    <h4 className="text-red-400 font-bold mb-1 flex items-center text-sm"><AlertTriangle className="w-4 h-4 mr-2" /> DRM Security Notice</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {installerName === 'SecureInstaller_T.exe' 
                        ? 'This software contains an automated Time-Bomb. Upon your license expiry date, or if your license is revoked by an admin, the system will automatically and permanently delete the configuration files from your host machine to prevent unauthorized access.'
                        : 'This software is actively monitored. If your access is revoked by an administrator, the remote kill-switch will automatically and permanently delete the configuration files from your host machine.'}
                    </p>
                  </div>
                )}
              </div>
            );"""

if download_block in content:
    content = content.replace(download_block, new_download_block)
else:
    print("Could not find download_block")

with open('web/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated App.tsx with warning box')
