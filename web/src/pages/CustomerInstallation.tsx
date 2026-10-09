import { Key, Shield, Download, BookOpen , AlertTriangle } from 'lucide-react';

export const CustomerInstallation = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-[#0a0a0a] border border-green-500/30 rounded-xl p-8 shadow-[0_0_15px_rgba(34,197,94,0.05)]">
        <h2 className="text-2xl font-bold mb-8 flex items-center text-green-50">
          <BookOpen className="w-6 h-6 mr-3 text-green-400" /> User Manual & Complete Installation Guide
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
              <Shield className="w-5 h-5 mr-2" /> Step 1: Before Installation
            </h3>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-gray-200">
              <strong>CRITICAL REQUIREMENT:</strong> You must completely turn off your Antivirus software and Windows Device Protections (Windows Defender) before downloading or running the installer. Secure tools often get incorrectly flagged by aggressive heuristic scanners.
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
            
            <div className="overflow-hidden border border-gray-800 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/60 border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-gray-300">Keyboard Shortcut</th>
                    <th className="py-3 px-4 font-semibold text-gray-300">What it is used for</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-black/30">
                  <tr className="hover:bg-gray-900/50 transition-colors">
                    <td className="py-3 px-4"><kbd className="rounded border border-green-700/50 bg-green-900/20 px-2.5 py-1 font-mono text-green-400 font-bold tracking-widest shadow-[0_0_10px_rgba(34,197,94,0.2)]">Ctrl + L</kbd></td>
                    <td className="py-3 px-4 text-gray-300">Launch the <strong>Viva Quiz</strong> module.</td>
                  </tr>
                  <tr className="hover:bg-gray-900/50 transition-colors">
                    <td className="py-3 px-4"><kbd className="rounded border border-blue-700/50 bg-blue-900/20 px-2.5 py-1 font-mono text-blue-400 font-bold tracking-widest shadow-[0_0_10px_rgba(59,130,246,0.2)]">Ctrl + J</kbd></td>
                    <td className="py-3 px-4 text-gray-300">Access <strong>QA, Reasoning, or Java MCQ</strong> quizzes.</td>
                  </tr>
                  <tr className="hover:bg-gray-900/50 transition-colors">
                    <td className="py-3 px-4"><kbd className="rounded border border-purple-700/50 bg-purple-900/20 px-2.5 py-1 font-mono text-purple-400 font-bold tracking-widest shadow-[0_0_10px_rgba(168,85,247,0.2)]">Ctrl + K</kbd></td>
                    <td className="py-3 px-4 text-gray-300">Open the <strong>Java Coding Practice</strong> environment.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
