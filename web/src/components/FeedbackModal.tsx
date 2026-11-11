import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle2, X, Sparkles, Send, Clock } from 'lucide-react';
import { supabase } from '../services/supabase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  licenseId?: string;
  packageName?: string;
  onSubmitted?: (rating: number, text: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerEmail,
  customerName,
  licenseId,
  packageName,
  onSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setRating(5);
      setFeedbackText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRateLater = () => {
    try {
      // Postpone prompt for 48 hours in localStorage
      const postponeUntil = Date.now() + 48 * 60 * 60 * 1000;
      localStorage.setItem('phantomlead_feedback_postponed_until', postponeUntil.toString());
    } catch {
      // Fallback
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);

    try {
      const payload = {
        customer_id: customerId || null,
        customer_email: customerEmail || 'unknown@user.com',
        customer_name: customerName || 'Candidate',
        license_id: licenseId || null,
        package_name: packageName || 'Software Package',
        rating,
        feedback_text: feedbackText.trim() || null,
        created_at: new Date().toISOString()
      };

      // Try inserting into Supabase customer_feedbacks
      const { error } = await supabase
        .from('customer_feedbacks')
        .insert([payload]);

      if (error) {
        console.warn('Supabase feedback insert warning (table might be initializing):', error.message);
      }

      // Mark local storage as completed so user isn't annoyed again
      try {
        localStorage.setItem(`phantomlead_feedback_submitted_${licenseId || 'general'}`, 'true');
        localStorage.setItem('phantomlead_feedback_completed', 'true');
      } catch {
        // Ignore
      }

      setSubmitted(true);
      if (onSubmitted) {
        onSubmitted(rating, feedbackText);
      }

      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      // Still gracefully conclude UI
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1600);
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels: Record<number, string> = {
    1: 'Needs Major Improvements',
    2: 'Fair Experience',
    3: 'Good & Working',
    4: 'Very Impressive',
    5: 'Outstanding & Highly Recommended! 🚀'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#09090b] border border-cyan-500/30 p-6 shadow-2xl shadow-cyan-500/10 space-y-5 text-white">
        
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
                Verified Experience
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Rate Your Purchase
              </h3>
            </div>
          </div>
          <button
            onClick={handleRateLater}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Close / Rate Later"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Thank You for Your Feedback!</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Your rating helps us continually harden and optimize the PhantomLead system for everyone.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {packageName && (
              <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs flex items-center justify-between">
                <span className="text-slate-400">Package:</span>
                <span className="text-cyan-300 font-bold font-mono">{packageName}</span>
              </div>
            )}

            {/* Interactive Star Rating */}
            <div className="text-center space-y-2 py-1">
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">
                Select Your Rating
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeStar = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                          activeStar
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-medium text-cyan-400/90 font-mono min-h-[18px]">
                {ratingLabels[hoverRating || rating]}
              </p>
            </div>

            {/* Optional Comment Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Share your thoughts (Optional):</span>
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="What did you like about the installation and assistants? Any suggestions?"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-none"
              />
            </div>

            {/* Dual Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleRateLater}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Rate Later</span>
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Rating</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
