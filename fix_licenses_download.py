import re

with open('web/src/pages/CustomerLicenses.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """      {licenses.some(license => license.status === 'ACTIVE') && (
        <a href="https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/SecureInstaller_v1.0.exe" download className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-medium">
          <Download className="w-4 h-4" /> Download SecureInstaller.exe
        </a>
      )}"""

replacement = """      {(() => {
        const activeLicense = licenses.find(license => license.status === 'ACTIVE');
        if (!activeLicense) return null;
        
        let installerName = 'SecureInstaller_L.exe';
        if (activeLicense.expires_at) {
          installerName = 'SecureInstaller_T.exe';
        } else if (activeLicense.payment_type === 'FREE') {
          installerName = 'SecureInstaller_A.exe';
        } else {
          installerName = 'SecureInstaller_L.exe';
        }
        
        return (
          <a href={`https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/${installerName}?v=${new Date().getTime()}`} download className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-medium">
            <Download className="w-4 h-4" /> Download SecureInstaller.exe
          </a>
        );
      })()}"""

if target in content:
    content = content.replace(target, replacement)
    print("Updated exactly!")
else:
    print("Target not found")

with open('web/src/pages/CustomerLicenses.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
