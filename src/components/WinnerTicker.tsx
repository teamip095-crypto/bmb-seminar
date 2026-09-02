import React, { useEffect, useState } from "react";
import { Trophy, Award, Sparkles } from "lucide-react";
import { QuizWinner } from "../types";

export const WinnerTicker: React.FC = () => {
  const [winner, setWinner] = useState<QuizWinner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWinner = async () => {
    try {
      const res = await fetch("/api/quiz/winners");
      if (res.ok) {
        const data = await res.json();
        if (data.winners && Array.isArray(data.winners) && data.winners.length > 0) {
          setWinner(data.winners[0]); // Strictly 1 single top winner
        } else {
          setWinner(null);
        }
      }
    } catch (err) {
      console.error("Error fetching quiz winner for ticker:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWinner();
    const interval = setInterval(fetchWinner, 15000); // Poll every 15s for live winner
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="quiz-winner-ticker" className="relative w-full bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950 border-y border-amber-500/30 overflow-hidden py-2 shadow-inner z-40">
      <div className="flex items-center">
        {/* Fixed Left Badge */}
        <div className="flex-shrink-0 z-10 bg-amber-500 text-neutral-950 px-3 sm:px-4 py-1 flex items-center gap-1.5 font-black text-xs sm:text-sm tracking-wide shadow-md uppercase">
          <Trophy className="w-4 h-4 text-neutral-950 fill-neutral-950 animate-bounce" />
          <span className="whitespace-nowrap">Winner of Quiz</span>
        </div>

        {/* Marquee Content */}
        <div className="flex-1 overflow-hidden whitespace-nowrap relative">
          {winner ? (
            <>
              <div className="inline-block animate-marquee hover:[animation-play-state:paused] py-0.5">
                <span className="inline-flex items-center gap-2 mx-8 text-xs sm:text-sm">
                  <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-200 px-3 py-1 rounded-full font-bold shadow-sm">
                    <Award className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                    <strong className="text-amber-300">Winner of Quiz:</strong> {winner.displayName} {winner.city ? `(${winner.city})` : ""}
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full text-xs border border-emerald-500/40">
                    ★ Score: {winner.score}/4 ({winner.durationSeconds}s)
                  </span>
                  <span className="text-amber-300/80 text-xs font-medium">🎉 BMB Educom AI Masterclass Winner!</span>
                  <span className="text-amber-400/50">✦</span>
                </span>
              </div>
              <div className="inline-block animate-marquee2 hover:[animation-play-state:paused] py-0.5" aria-hidden="true">
                <span className="inline-flex items-center gap-2 mx-8 text-xs sm:text-sm">
                  <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-200 px-3 py-1 rounded-full font-bold shadow-sm">
                    <Award className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                    <strong className="text-amber-300">Winner of Quiz:</strong> {winner.displayName} {winner.city ? `(${winner.city})` : ""}
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full text-xs border border-emerald-500/40">
                    ★ Score: {winner.score}/4 ({winner.durationSeconds}s)
                  </span>
                  <span className="text-amber-300/80 text-xs font-medium">🎉 BMB Educom AI Masterclass Winner!</span>
                  <span className="text-amber-400/50">✦</span>
                </span>
              </div>
            </>
          ) : (
            <div className="inline-block animate-marquee hover:[animation-play-state:paused] py-0.5">
              <span className="inline-flex items-center gap-2 mx-8 text-xs sm:text-sm text-neutral-300">
                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-3 py-0.5 rounded-full font-medium text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  2-मिनट का AI क्विज़ पूरा करके पहले विनर बनें और BMB Educom से आकर्षक उपहार पाएं!
                </span>
                <span className="text-neutral-400 text-xs">• सभी प्रश्न BMB AI सेमिनार और सिलेबस पर आधारित हैं •</span>
                <span className="text-amber-400/50">✦</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
