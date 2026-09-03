import React, { useEffect, useState } from "react";
import { Trophy, Award, Sparkles, Gift, IndianRupee } from "lucide-react";
import { QuizWinner, ScholarshipWinnerEntry } from "../types";

type TickerItem =
  | { kind: "seminar"; winner: QuizWinner }
  | { kind: "scholarship"; winner: ScholarshipWinnerEntry };

export const WinnerTicker: React.FC = () => {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWinners = async () => {
    try {
      // Fetch both seminar quiz winner (top 1) AND scholarship winners (top 10)
      const [seminarRes, scholarshipRes] = await Promise.all([
        fetch("/api/quiz/winners"),
        fetch("/api/scholarship-quiz/winners?limit=10")
      ]);

      const newItems: TickerItem[] = [];

      if (seminarRes.ok) {
        const data = await seminarRes.json();
        if (data.winners && Array.isArray(data.winners) && data.winners.length > 0) {
          newItems.push({ kind: "seminar", winner: data.winners[0] });
        }
      }

      if (scholarshipRes.ok) {
        const data = await scholarshipRes.json();
        if (data.winners && Array.isArray(data.winners)) {
          for (const w of data.winners.slice(0, 10)) {
            newItems.push({ kind: "scholarship", winner: w });
          }
        }
      }

      setItems(newItems);
    } catch (err) {
      console.error("Error fetching winners for ticker:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners();
    const interval = setInterval(fetchWinners, 15000); // Poll every 15s for live winners
    return () => clearInterval(interval);
  }, []);

  const renderWinnerPill = (item: TickerItem, keyPrefix: string) => {
    if (item.kind === "seminar") {
      const w = item.winner;
      return (
        <span key={`${keyPrefix}-sem`} className="inline-flex items-center gap-2 mx-4 sm:mx-8 text-[11px] sm:text-xs">
          <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-200 px-2.5 py-0.5 rounded-full font-bold shadow-sm">
            <Award className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
            <strong className="text-amber-300">2-Min Quiz Winner:</strong> {w.displayName} {w.city ? `(${w.city})` : ""}
          </span>
          <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full text-[10px] sm:text-xs border border-emerald-500/40">
            ★ Score: {w.score}/4 ({w.durationSeconds}s)
          </span>
          <span className="text-amber-300/80 text-[11px] sm:text-xs font-medium">🎉 BMB Educom AI Masterclass Winner!</span>
          <span className="text-amber-400/50">✦</span>
        </span>
      );
    }

    // Scholarship winner
    const w = item.winner;
    const isCash = w.prize_type === "cash";
    const rankBadge = w.rank === 1 ? "🥇" : w.rank === 2 ? "🥈" : w.rank === 3 ? "🥉" : `#${w.rank}`;
    return (
      <span key={`${keyPrefix}-sch-${w.id}`} className="inline-flex items-center gap-2 mx-4 sm:mx-8 text-[11px] sm:text-xs">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold shadow-sm border ${
          isCash
            ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-200"
            : "bg-purple-500/20 border-purple-500/50 text-purple-200"
        }`}>
          {isCash ? (
            <IndianRupee className="w-3.5 h-3.5 text-yellow-400" />
          ) : (
            <Gift className="w-3.5 h-3.5 text-purple-400" />
          )}
          <strong className={isCash ? "text-yellow-300" : "text-purple-300"}>
            {rankBadge} Scholarship Winner:
          </strong>{" "}
          {w.participant_name} {w.participant_city ? `(${w.participant_city})` : ""}
        </span>
        <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] sm:text-xs border ${
          isCash
            ? "text-yellow-400 bg-yellow-950/80 border-yellow-500/40"
            : "text-purple-400 bg-purple-950/80 border-purple-500/40"
        }`}>
          ★ Score: {w.score}/20 ({w.duration_seconds || 0}s) — {w.prize_label}
        </span>
        <span className="text-amber-300/80 text-[11px] sm:text-xs font-medium">🎓 BMB AI Scholarship Quiz Champion!</span>
        <span className="text-amber-400/50">✦</span>
      </span>
    );
  };

  // Build ticker content — if no winners, show promo
  const hasAnyWinner = items.length > 0;
  const tickerSpans = items.map((it, i) => renderWinnerPill(it, `a${i}`));
  const tickerSpans2 = items.map((it, i) => renderWinnerPill(it, `b${i}`)); // duplicate for marquee continuity

  return (
    <div id="quiz-winner-ticker" className="relative w-full max-w-full bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950 border-y border-amber-500/30 overflow-hidden py-1.5 sm:py-2 shadow-inner z-30">
      <div className="flex items-center w-full max-w-full overflow-hidden">
        {/* Fixed Left Badge */}
        <div className="flex-shrink-0 z-10 bg-amber-500 text-neutral-950 px-2 sm:px-3.5 py-0.5 sm:py-1 flex items-center gap-1 sm:gap-1.5 font-black text-[10px] sm:text-xs tracking-wide shadow-md uppercase">
          <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-950 fill-neutral-950 animate-bounce" />
          <span className="whitespace-nowrap">Winners</span>
        </div>

        {/* Marquee Content */}
        <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap relative">
          {hasAnyWinner ? (
            <>
              <div className="inline-block animate-marquee hover:[animation-play-state:paused] py-0.5">
                {tickerSpans}
              </div>
              <div className="inline-block animate-marquee2 hover:[animation-play-state:paused] py-0.5" aria-hidden="true">
                {tickerSpans2}
              </div>
            </>
          ) : (
            <div className="inline-block animate-marquee hover:[animation-play-state:paused] py-0.5">
              <span className="inline-flex items-center gap-2 mx-4 sm:mx-8 text-[11px] sm:text-xs text-neutral-300">
                <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-medium text-[10px] sm:text-xs">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  2-मिनट AI क्विज़ जीतें + ₹1000 स्कॉलरशिप क्विज़ खेलें!
                </span>
                <span className="text-neutral-400 text-[10px] sm:text-xs">• स्कॉलरशिप क्विज़: 20 प्रश्न • 10 मिनट • 1st: ₹1000 • 2nd: ₹500 • 3rd: ₹200 • 7 आकर्षक उपहार •</span>
                <span className="text-amber-400/50">✦</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
