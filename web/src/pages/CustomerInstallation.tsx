import { Key, Shield, Download, BookOpen, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';

export const CustomerInstallation = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 px-1 sm:px-2">
      <div className="bg-[#0a0a0a] border border-green-500/30 rounded-xl p-4 sm:p-8 shadow-[0_0_15px_rgba(34,197,94,0.05)]">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 flex items-center text-green-50">
          <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3 text-green-400 shrink-0" /> User Manual & Installation Guide
        </h2>

          <div className="mt-8 mb-8 bg-red-950/30 border border-red-900/50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2" /> CRITICAL: Anti-Piracy & Auto-Deletion Warning
            </h3>
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              PhantomLead uses military-grade DRM (Digital Rights Management) to protect our exam environments. Please be fully aware of the following protocols before installing:
            </p>
            <ul className="list-disc pl-5 space-y-3 text-sm text-gray-400">
              <li>
                <strong className="text-red-300">Time-Bomb Expiry (Temporary Licenses):</strong> If you purchased a temporary package (1, 2, or 3 months), your installer contains an automated time-bomb. On the exact date of your expiry, it will automatically and permanently delete the exam configuration files from your computer.
              </li>
              <li>
                <strong className="text-red-300">Admin Kill-Switch (All Monitored Licenses):</strong> Any suspicious activity, sharing of license keys, or violation of our terms will result in an immediate Admin Revoke. If revoked, a remote kill-switch will trigger the next time your computer turns on, instantly wiping the software and configurations from your host machine.
              </li>
            </ul>
          </div>

        
        <div className="space-y-10">
          <section>
            <h3 className="text-lg font-semibold mb-3 text-red-400 flex items-center">
              <Shield className="w-5 h-5 mr-2" /> Step 1: Before Installation (Disable Real-Time Protection)
            </h3>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-5 text-sm text-gray-200 space-y-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-red-300 block text-base font-bold mb-1">
                    CRITICAL REQUIREMENT: Turn Off Windows Real-Time Protection
                  </strong>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    Before downloading or running SecureInstaller, you must turn off <strong>Real-time protection</strong> in Windows Defender. Secure tools and custom background extensions get falsely flagged and blocked by Windows heuristic scanners.
                  </p>
                </div>
              </div>

              <div className="bg-black/60 border border-red-900/40 rounded-lg p-4 space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-red-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-red-400" /> Follow these exact steps in Windows:
                </h4>
                <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-gray-200">
                  <li>
                    Open <strong>Windows Security</strong> (search for <em>"Windows Security"</em> in your Windows Start menu or taskbar).
                  </li>
                  <li>
                    Click on <strong>Virus &amp; threat protection</strong>.
                  </li>
                  <li>
                    Under <strong>Virus &amp; threat protection settings</strong>, click on <span className="text-red-300 font-semibold underline underline-offset-2">Manage settings</span>.
                  </li>
                  <li>
                    Toggle <strong>Real-time protection</strong> to <strong className="text-red-400 font-extrabold bg-red-950/60 px-2 py-0.5 rounded border border-red-800">OFF</strong>!
                  </li>
                </ol>
                <div className="mt-2 pt-2 border-t border-gray-800 text-[11px] text-gray-400 flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">⚠️ Note:</span> If you have third-party antivirus installed (e.g., McAfee, Quick Heal, Avast, Kaspersky, Norton), temporarily pause or disable its real-time protection shield as well.
                </div>
              </div>
            </div>
          </section>
    
          <section>
            <h3 className="text-lg font-semibold mb-3 text-green-400 flex items-center">
              <Key className="w-5 h-5 mr-2" /> Step 2: Get Your Google Gemini API Key
            </h3>
            <ol className="list-decimal pl-6 text-sm text-gray-300 space-y-2">
              <li>Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-green-400 font-medium underline underline-offset-2 hover:text-green-300">Google AI Studio API keys</a> and sign in with your Google account.</li>
              <li>Select an existing Google Cloud project, or create a new one if Google AI Studio prompts you to.</li>
              <li>Select <strong>Create API key</strong>, copy the generated key, and keep it private.</li>
            </ol>
          </section>
    
          <section>
            <h3 className="text-lg font-semibold mb-3 text-orange-400 flex items-center">
              <Shield className="w-5 h-5 mr-2" /> Step 3: Close Background Processes
            </h3>
            <ol className="list-decimal pl-6 text-sm text-gray-300 space-y-2">
              <li>Press <kbd className="rounded bg-black border border-gray-700 px-1.5 py-0.5 font-mono">Ctrl + Shift + Esc</kbd> to open <strong>Task Manager</strong>.</li>
              <li>Search for <strong>Safe Exam Browser</strong> in the processes list.</li>
              <li>Right-click and select <strong>End Task</strong> for all running SEB tasks.</li>
            </ol>
          </section>
    
          <section>
            <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center">
              <Download className="w-5 h-5 mr-2" /> Step 4: How to run SecureInstaller
            </h3>
            <ol className="list-decimal pl-6 text-sm text-gray-300 space-y-3">
              <li>Download the SecureInstaller file from the Dashboard or My Licenses page.</li>
              <li>Run the downloaded `.exe` file. If a SmartScreen warning appears, click <strong>"More info"</strong> and then <strong>"Run anyway"</strong>.</li>
              <li>When prompted by the installer, paste your <strong>Gemini API Key</strong> and your <strong>License Key</strong> (found in the My Licenses tab).</li>
              <li>Wait patiently for SecureInstaller to completely finish the setup process. Do not interrupt it.</li>
            </ol>
          </section>
    
          <section>
            <h3 className="text-lg font-semibold mb-3 text-purple-400 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" /> Step 5: Running Safe Exam Browser (SEB) & Shortcuts
            </h3>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-5 text-sm text-gray-200">
              <strong>How it runs:</strong> Launch <strong>Safe Exam Browser</strong> from your desktop or start menu. SEB will immediately launch in a secure, full-screen kiosk mode that locks down your computer to prevent cheating or outside access. Once the secure browser is open, you must use the following keyboard shortcuts to access your different exams and practice modules.
            </div>
            
            <div className="overflow-x-auto border border-gray-800 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/60 border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-gray-300">Extension Folder</th>
                    <th className="py-3 px-4 font-semibold text-gray-300">Language / Purpose</th>
                    <th className="py-3 px-4 font-semibold text-gray-300">Shortcut to Open/Close Popup Card</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-black/30">
                  <tr className="hover:bg-gray-900/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-purple-300 font-semibold">java_coding</td>
                    <td className="py-3 px-4 text-gray-200">☕ Java Coding Helper</td>
                    <td className="py-3 px-4"><kbd className="rounded border border-purple-700/50 bg-purple-900/20 px-2.5 py-1 font-mono text-purple-400 font-bold tracking-widest shadow-[0_0_10px_rgba(168,85,247,0.2)]">Ctrl + K</kbd> <span className="text-gray-400 text-xs ml-1">(or F10)</span></td>
                  </tr>
                  <tr className="hover:bg-gray-900/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-yellow-300 font-semibold">python_coding</td>
                    <td className="py-3 px-4 text-gray-200">🐍 Python 3 Coding Helper</td>
                    <td className="py-3 px-4"><kbd className="rounded border border-yellow-700/50 bg-yellow-900/20 px-2.5 py-1 font-mono text-yellow-400 font-bold tracking-widest shadow-[0_0_10px_rgba(234,179,8,0.2)]">Ctrl + T</kbd></td>
                  </tr>
                  <tr className="hover:bg-gray-900/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-cyan-300 font-semibold">c_coding</td>
                    <td className="py-3 px-4 text-gray-200">⚙️ C Coding Helper</td>
                    <td className="py-3 px-4"><kbd className="rounded border border-cyan-700/50 bg-cyan-900/20 px-2.5 py-1 font-mono text-cyan-400 font-bold tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.2)]">Ctrl + Y</kbd></td>
                  </tr>
                  <tr className="hover:bg-gray-900/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-blue-300 font-semibold">lms_mcq</td>
                    <td className="py-3 px-4 text-gray-200">MCQ Helper</td>
                    <td className="py-3 px-4"><kbd className="rounded border border-blue-700/50 bg-blue-900/20 px-2.5 py-1 font-mono text-blue-400 font-bold tracking-widest shadow-[0_0_10px_rgba(59,130,246,0.2)]">Ctrl + J</kbd> <span className="text-gray-400 text-xs ml-1">(or F8)</span></td>
                  </tr>
                  <tr className="hover:bg-gray-900/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-green-300 font-semibold">viva_paragraph</td>
                    <td className="py-3 px-4 text-gray-200">Viva Paragraph Helper</td>
                    <td className="py-3 px-4"><kbd className="rounded border border-green-700/50 bg-green-900/20 px-2.5 py-1 font-mono text-green-400 font-bold tracking-widest shadow-[0_0_10px_rgba(34,197,94,0.2)]">Ctrl + L</kbd></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Pro Tips / Troubleshooting */}
          <section className="mt-8 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent rounded-xl p-5 sm:p-6 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
            <h3 className="text-lg font-bold mb-3 text-amber-400 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-amber-400" /> Pro Tip: Error While Loading Answers? (API Key Quota Limit)
            </h3>
            
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              If you get an error while loading answers inside Safe Exam Browser, it is due to your <strong>Google Gemini API key daily request limit being exhausted</strong>. Free-tier API keys automatically reset after <strong>8 to 18 hours</strong>.
            </p>

            <div className="bg-black/60 border border-amber-500/20 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-amber-300 flex items-center text-xs uppercase tracking-wider">
                <RefreshCw className="w-4 h-4 mr-1.5 text-amber-400" /> Need it working immediately? Follow these steps:
              </h4>
              <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-gray-300">
                <li>
                  Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-amber-400 underline underline-offset-2 hover:text-amber-300 font-medium">Google AI Studio API Keys</a>, delete your old API key, and create a <strong>new API key</strong> (or sign in with a different Google account).
                </li>
                <li>
                  Launch your <strong>SecureInstaller.exe</strong> on your computer again.
                </li>
                <li>
                  Enter your <strong>same License Key</strong> (from the My Licenses tab) and paste the <strong>new API key</strong> there.
                </li>
                <li>
                  Click Install and let it finish setup.
                </li>
                <li>
                  Relaunch <strong>Safe Exam Browser</strong> — your extensions will run smoothly with fast answer generation again!
                </li>
              </ol>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
