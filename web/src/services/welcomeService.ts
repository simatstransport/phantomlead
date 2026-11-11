const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? '/api/send-invoice'
  : 'http://localhost:3001/api/send-invoice';

/**
 * Dispatches an automated welcome notification to customer upon login
 */
export const dispatchWelcomeEmail = async (email: string, fullName?: string) => {
  if (!email) return;

  const sessionKey = `welcome_dispatched_${email}`;
  if (sessionStorage.getItem(sessionKey)) return; // Only dispatch once per login session

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: email,
        toName: fullName || email.split('@')[0],
        invoiceNumber: `PL-WELCOME-${Date.now().toString().slice(-4)}`,
        packageName: 'PhantomLead Candidate Workstation',
        amount: 0,
        transactionRef: 'SESSION_INITIALIZED',
        isWelcome: true,
      }),
    });

    if (res.ok) {
      sessionStorage.setItem(sessionKey, 'true');
      console.log(`[Welcome Email Dispatched] Delivered to ${email}`);
    }
  } catch (err) {
    console.warn('[Welcome email notice]:', err);
  }
};
