export interface ToolGuide {
  id: string;
  name: string;
  icon: string;
  badge: string;
  shortcut: string;
  secondaryShortcut?: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
  instructionTitle: string;
  instructions: string[];
  tips: string;
}

export const ALL_TOOLS: Record<string, ToolGuide> = {
  mcq: {
    id: 'mcq',
    name: 'LMS MCQ Helper',
    icon: '🎯',
    badge: 'MCQ & Online Tests',
    shortcut: 'Ctrl + J',
    secondaryShortcut: 'Ctrl + I / F8',
    colorBorder: 'border-blue-500/40',
    colorBg: 'bg-blue-500/10',
    colorText: 'text-blue-400',
    instructionTitle: 'How to use LMS MCQ Helper:',
    instructions: [
      'After attempting a quiz or question in Safe Exam Browser, press Ctrl + J (or Ctrl + I).',
      'The assistant will automatically analyze the question options and select the correct answer for you.',
      'When you click "Next", you do NOT need to press Ctrl + J again! It runs continuously once triggered.'
    ],
    tips: 'Continuous Mode: Press Ctrl + J once at the start of the quiz section and navigate smoothly.'
  },
  reasoning: {
    id: 'reasoning',
    name: 'LMS Reasoning MCQ Helper',
    icon: '🧩',
    badge: 'Analytical & Visual Aptitude',
    shortcut: 'Ctrl + I',
    colorBorder: 'border-cyan-500/40',
    colorBg: 'bg-cyan-500/10',
    colorText: 'text-cyan-400',
    instructionTitle: 'How to use Reasoning MCQ Helper:',
    instructions: [
      'For analytical, visual, or complex diagram-based questions, press Ctrl + I.',
      'The reasoning engine verifies radio options and deduction sequences.',
      'Auto-selects optimal deductions and persists across consecutive questions.'
    ],
    tips: 'Ideal for aptitude assessment rounds and visual pattern matching.'
  },
  java: {
    id: 'java',
    name: 'Java Coding Helper',
    icon: '☕',
    badge: 'Java Core & Algorithms',
    shortcut: 'Ctrl + K',
    secondaryShortcut: 'F10',
    colorBorder: 'border-purple-500/40',
    colorBg: 'bg-purple-500/10',
    colorText: 'text-purple-400',
    instructionTitle: 'How to use Java Coding Helper:',
    instructions: [
      'Place your mouse cursor inside the Question area (NOT inside the code sandbox editor).',
      'Press Ctrl + K (or F10). A pop-up HUD overlay will appear in the bottom-right corner.',
      'The AI generates the complete verified Java solution. Click "Replace Code" to automatically inject the code into the sandbox editor.',
      'If any compiler error or runtime test case failure occurs, press Ctrl + K again and click "Regenerate Code" to receive the corrected code.'
    ],
    tips: 'Always place cursor in the problem statement text before pressing Ctrl + K.'
  },
  viva: {
    id: 'viva',
    name: 'Viva Paragraph Explainer Helper',
    icon: '📝',
    badge: 'Theory & Oral Viva Voce',
    shortcut: 'Ctrl + L',
    colorBorder: 'border-pink-500/40',
    colorBg: 'bg-pink-500/10',
    colorText: 'text-pink-400',
    instructionTitle: 'How to use Viva & Paragraph Explainer:',
    instructions: [
      'Similar to the coding helper: highlight or position cursor on the topic/question.',
      'Press Ctrl + L. A pop-up HUD overlay will appear in the top-right corner.',
      'Comprehensive technical answers and explanations will generate. Click "Push to Sandbox" to insert the answer directly.'
    ],
    tips: 'Provides concise, high-scoring technical viva definitions and structured paragraph answers.'
  },
  c_code: {
    id: 'c_code',
    name: 'C Coding Helper',
    icon: '⚙️',
    badge: 'C Programming & Pointers',
    shortcut: 'Ctrl + Y',
    colorBorder: 'border-emerald-500/40',
    colorBg: 'bg-emerald-500/10',
    colorText: 'text-emerald-400',
    instructionTitle: 'How to use C Coding Helper:',
    instructions: [
      'Works identically to Java coding: place cursor in question description (outside sandbox).',
      'Press Ctrl + Y. An overlay pop-up appears in the bottom-right.',
      'Click "Replace Code" to inject the verified C program into the editor. Press Ctrl + Y again and click "Regenerate" if compiler flags an error.'
    ],
    tips: 'Pre-configured with standard POSIX headers, memory allocation safeguards, and pointer syntax.'
  },
  python: {
    id: 'python',
    name: 'Python 3 Coding Helper',
    icon: '🐍',
    badge: 'Python 3 & Scripts',
    shortcut: 'Ctrl + T',
    colorBorder: 'border-emerald-500/40',
    colorBg: 'bg-emerald-500/10',
    colorText: 'text-emerald-400',
    instructionTitle: 'How to use Python 3 Coding Helper:',
    instructions: [
      'Works identically to Java coding: place cursor in question description (outside sandbox).',
      'Press Ctrl + T. An overlay pop-up appears in the bottom-right.',
      'Click "Replace Code" to inject the Python 3 solution with clean indentation. Press Ctrl + T again to regenerate if needed.'
    ],
    tips: 'Zero indentation errors. Resolves data structure logic and test inputs cleanly.'
  }
};

/**
 * Returns the exact list of tools included in a customer's package code.
 */
export const getToolsForPackage = (packageCode?: string | null): ToolGuide[] => {
  const code = (packageCode || '').toUpperCase();

  if (code.includes('FULL') || code === 'FULL_ACCESS') {
    return [ALL_TOOLS.mcq, ALL_TOOLS.reasoning, ALL_TOOLS.java, ALL_TOOLS.viva, ALL_TOOLS.c_code, ALL_TOOLS.python];
  }
  if (code.includes('JAVA_QA') || (code.includes('JAVA') && code.includes('QA'))) {
    return [ALL_TOOLS.java, ALL_TOOLS.viva, ALL_TOOLS.mcq];
  }
  if (code.includes('QA') || code.includes('PLACEMENT')) {
    return [ALL_TOOLS.mcq, ALL_TOOLS.reasoning];
  }
  if (code.includes('PYTHON') && code.includes('C')) {
    return [ALL_TOOLS.python, ALL_TOOLS.c_code];
  }
  if (code.includes('JAVA') && code.includes('VIVA')) {
    return [ALL_TOOLS.java, ALL_TOOLS.viva];
  }
  if (code.includes('JAVA')) {
    return [ALL_TOOLS.java, ALL_TOOLS.viva];
  }
  if (code.includes('PYTHON')) {
    return [ALL_TOOLS.python];
  }
  if (code.includes('C_') || code === 'C') {
    return [ALL_TOOLS.c_code];
  }

  // Fallback to full suite if general or custom
  return [ALL_TOOLS.mcq, ALL_TOOLS.java, ALL_TOOLS.viva, ALL_TOOLS.python, ALL_TOOLS.c_code];
};
