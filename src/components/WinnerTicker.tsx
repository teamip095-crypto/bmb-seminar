import React, { useEffect, useState } from "react";
import { Trophy, Gift, Sparkles } from "lucide-react";
import { ScholarshipWinner } from "../types";
import { fetchJson } from "../lib/api";

export const WinnerTicker: React.FC = () => {
  const [scholarshipWinners, setScholarshipWinners] = useState<ScholarshipWinner[]>([]);
  const [cashPrizes, setCashPrizes] = useState<{
    first: string;
    second: string;
    third: string;
    consolation: string;
  }>({
    first: "₹1,000/- नकद",
    second: "₹500/- नकद",
    third: "₹200/- नकद",
    consolation: "आकर्षक उपहार (Top 7 Winners)"
  });

  const fetchWinners = async () => {
    const res = await fetchJson<any>("/api/quiz/winners");
    if (res.ok && res.data) {
      const data = res.data;
      if (data.scholarshipWinners && Array.isArray(data.scholarshipWinners)) {
        setScholarshipWinners(data.scholarshipWinners);
      }
      if (data.scholarshipSummary) {
        setCashPrizes({
          first: data.scholarshipSummary.firstPrize?.amount || "₹1,000/- नकद",
          second: data.scholarshipSummary.secondPrize?.amount || "₹500/- नकद",
          third: data.scholarshipSummary.thirdPrize?.amount || "₹200/- नकद",
          consolation: data.scholarshipSummary.consolationPrize?.item || "आकर्षक उपहार"
        });
      }
    }
  };

  useEffect(() => {
    fetchWinners();
    const interval = setInterval(fetchWinners, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const top1 = scholarshipWinners.find(w => w.rank === 1);
  const top2 = scholarshipWinners.find(w => w.rank === 2);
  const top3 = scholarshipWinners.find(w => w.rank === 3);
  const topGifts = scholarshipWinners.filter(w => w.rank >= 4 && w.rank <= 10);

  const renderTickerContent = () => {
    if (scholarshipWinners.length > 0) {
      return (
        <span className="inline-flex items-center gap-2 sm:gap-3 mx-3 sm:mx-6 text-[11px] sm:text-xs">
          {/* Top 1 */}
          {top1 && (
            <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-200 px-2.5 py-0.5 rounded-full font-bold shadow-sm">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>🥇 1st Prize ({cashPrizes.first}): <strong>{top1.displayName}</strong> {top1.city ? `(${top1.city})` : ""} - {top1.score}/20 ({top1.durationSeconds}s)</span>
            </span>
          )}

          {/* Top 2 */}
          {top2 && (
            <span className="inline-flex items-center gap-1 bg-slate-400/20 border border-slate-300/40 text-slate-200 px-2.5 py-0.5 rounded-full font-bold shadow-sm">
              <span>🥈 2nd Prize ({cashPrizes.second}): <strong>{top2.displayName}</strong> - {top2.score}/20</span>
            </span>
          )}

          {/* Top 3 */}
          {top3 && (
            <span className="inline-flex items-center gap-1 bg-amber-700/20 border border-amber-700/40 text-amber-300 px-2.5 py-0.5 rounded-full font-bold shadow-sm">
              <span>🥉 3rd Prize ({cashPrizes.third}): <strong>{top3.displayName}</strong> - {top3.score}/20</span>
            </span>
          )}

          {/* Attractive Gifts */}
          {topGifts.length > 0 && (
            <span className="inline-flex items-center gap-1 bg-purple-950/70 border border-purple-500/40 text-purple-200 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold">
              <Gift className="w-3 h-3 text-purple-300" />
              <span>🎁 उपहार (Top 7): {topGifts.map(g => g.displayName).join(", ")}</span>
            </span>
          )}

          <span className="text-amber-400 font-extrabold">•</span>
          <span className="text-amber-300/90 font-medium">⭐ 10 मिनट में 20 AI प्रश्न हल करें और {cashPrizes.first} नकद जीतें!</span>
          <span className="text-amber-400 font-extrabold">•</span>
        </span>
      );
    }

    // Default announcement if no scholarship submissions yet
    return (
      <span className="inline-flex items-center gap-2 sm:gap-3 mx-3 sm:mx-6 text-[11px] sm:text-xs text-neutral-200">
        <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
          <Trophy className="w-3 h-3 text-amber-400 animate-pulse" />
          <span>AI स्कॉलरशिप टेस्ट (10 मिनट / 20 प्रश्न): 🥇 1st: {cashPrizes.first} | 🥈 2nd: {cashPrizes.second} | 🥉 3rd: {cashPrizes.third} | 🎁 7 शीर्ष विजेताओं को {cashPrizes.consolation}!</span>
        </span>
        <span className="text-neutral-400 text-[10px] sm:text-xs">• अभी रजिस्ट्रेशन करें और 20-प्रश्न स्कॉलरशिप टेस्ट दें! •</span>
        <span className="text-amber-400/50">✦</span>
      </span>
    );
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950 border-y border-amber-500/30 py-1.5 overflow-hidden flex items-center shadow-md relative z-20">
      <div className="flex-shrink-0 px-3 bg-amber-500 text-neutral-950 text-[10px] sm:text-xs font-black uppercase tracking-wider py-0.5 rounded-r-md flex items-center gap-1 z-10 shadow">
        <Trophy className="w-3 h-3" />
        <span>विजेता अलर्ट</span>
      </div>

      <div className="flex-1 overflow-hidden whitespace-nowrap relative">
        <div className="inline-block animate-marquee hover:pause">
          {renderTickerContent()}
          {renderTickerContent()}
          {renderTickerContent()}
        </div>
      </div>
    </div>
  );
};
