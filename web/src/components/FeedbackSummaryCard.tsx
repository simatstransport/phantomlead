import React from 'react';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';

interface FeedbackSummaryCardProps {
  onOpenFeedback: () => void;
  hasRated?: boolean;
}

export const FeedbackSummaryCard: React.FC<FeedbackSummaryCardProps> = ({
  onOpenFeedback,
  hasRated = false,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-black/80 border border-cyan-500/30 p-5 sm:p-6 shadow-xl backdrop-blur-xl transition-all hover:border-cyan-400/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                Student Satisfaction
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
                <span className="text-xs font-mono font-bold text-white ml-1.5">4.9 / 5.0</span>
              </div>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white">
              {hasRated ? 'Thank You for Rating PhantomLead!' : 'How was your experience with your license?'}
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              {hasRated
                ? 'Your feedback helps optimize the examination assistant suite and system integrity.'
                : 'Help us improve! Rate your installation experience, AI assistant speed, and exam performance.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={onOpenFeedback}
            className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {hasRated ? (
              <>
                <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Update Rating</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Rate &amp; Review</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
