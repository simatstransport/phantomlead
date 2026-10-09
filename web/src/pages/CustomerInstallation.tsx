import { Key, Shield, Download, BookOpen } from 'lucide-react';

export const CustomerInstallation = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-[#0a0a0a] border border-green-500/30 rounded-xl p-8 shadow-[0_0_15px_rgba(34,197,94,0.05)]">
        <h2 className="text-2xl font-bold mb-8 flex items-center text-green-50">
          <BookOpen className="w-6 h-6 mr-3 text-green-400" /> User Manual & Complete Installation Guide
        </h2>
        
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
              <BookOpen className="w-5 h-5 mr-2" /> Step 5: Using the Software
            </h3>
            <ol className="list-decimal pl-6 text-sm text-gray-300 space-y-3">
              <li>Launch <strong>Safe Exam Browser</strong> from your desktop or start menu.</li>
              <li>For Java coding practice, press <kbd className="rounded border border-gray-700 bg-black px-1.5 py-0.5 font-mono text-white">Ctrl + K</kbd>.</li>
              <li>For the viva quiz, press <kbd className="rounded border border-gray-700 bg-black px-1.5 py-0.5 font-mono text-white">Ctrl + L</kbd>.</li>
              <li>For QA, reasoning, or Java MCQ quizzes, press <kbd className="rounded border border-gray-700 bg-black px-1.5 py-0.5 font-mono text-white">Ctrl + J</kbd>.</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
};
