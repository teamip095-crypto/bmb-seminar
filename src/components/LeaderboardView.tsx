import React, { useEffect, useState } from "react";
import { Trophy, Award, Sparkles, RefreshCw, Gift, Search, Medal, CheckCircle2 } from "lucide-react";
import { FridaySeminarStatusResponse, ScholarshipWinner } from "../types";
import { fetchJson } from "../lib/api";

interface LeaderboardViewProps {
  seminarStatus: FridaySeminarStatusResponse | null;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ seminarStatus }) => {
  const [scholarshipWinners, setScholarshipWinners] = useState<ScholarshipWinner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Dynamic Cash Prizes from Server
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

  const fetchScholarshipLeaderboard = async () => {
    setLoading(true);
    try {
      // 1. Fetch live winners & dynamic prizes
      const pRes = await fetchJson<any>("/api/quiz/winners");
      if (pRes.ok && pRes.data?.scholarshipSummary) {
        setCashPrizes({
          first: pRes.data.scholarshipSummary.firstPrize?.amount || "₹1,000/- नकद",
          second: pRes.data.scholarshipSummary.secondPrize?.amount || "₹500/- नकद",
          third: pRes.data.scholarshipSummary.thirdPrize?.amount || "₹200/- नकद",
          consolation: pRes.data.scholarshipSummary.consolationPrize?.item || "आकर्षक उपहार"
        });
      }

      // 2. Fetch full scholarship rankings
      const sRes = await fetchJson<{ winners: ScholarshipWinner[] }>("/api/scholarship/leaderboard");
      if (sRes.ok && sRes.data?.winners) {
        setScholarshipWinners(sRes.data.winners);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScholarshipLeaderboard();
    const interval = setInterval(fetchScholarshipLeaderboard, 20000); // 20s auto poll
    return () => clearInterval(interval);
  }, []);

  const filteredScholarship = scholarshipWinners.filter(w =>
    w.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.city && w.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const topThree = scholarshipWinners.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
      {/* Header Banner */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full text-amber-400 text-xs font-bold mb-2">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>20-Question AI Cash Scholarship Rankings</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          लाइव AI स्कॉलरशिप लीडरबोर्ड (Cash Prizes)
        </h2>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto">
          20 प्रश्नों के सही उत्तर और सबसे तेज समय के आधार पर सत्यापित रैंकिंग
        </p>

        {/* Dynamic Cash Prize Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto mt-4 text-center">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5">
            <span className="text-[10px] sm:text-xs text-amber-300 font-bold block">🥇 1st Prize</span>
            <span className="text-sm sm:text-lg font-black text-amber-400">{cashPrizes.first}</span>
            <span className="text-[9px] sm:text-[10px] text-neutral-400 block">चैंपियन विनर</span>
          </div>
          <div className="bg-slate-500/10 border border-slate-500/30 rounded-xl p-2.5">
            <span className="text-[10px] sm:text-xs text-slate-300 font-bold block">🥈 2nd Prize</span>
            <span className="text-sm sm:text-lg font-black text-slate-200">{cashPrizes.second}</span>
            <span className="text-[9px] sm:text-[10px] text-neutral-400 block">द्वितीय स्थान</span>
          </div>
          <div className="bg-amber-700/10 border border-amber-700/30 rounded-xl p-2.5">
            <span className="text-[10px] sm:text-xs text-amber-600 font-bold block">🥉 3rd Prize</span>
            <span className="text-sm sm:text-lg font-black text-amber-400">{cashPrizes.third}</span>
            <span className="text-[9px] sm:text-[10px] text-neutral-400 block">तृतीय स्थान</span>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-2.5">
            <span className="text-[10px] sm:text-xs text-purple-400 font-bold block">🎁 Top 7 Winners</span>
            <span className="text-sm sm:text-base font-black text-purple-200">{cashPrizes.consolation}</span>
            <span className="text-[9px] sm:text-[10px] text-neutral-400 block">रैंक #4 से #10</span>
          </div>
        </div>
      </div>

      {/* Top 3 Champions Podium */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Rank 2 (Silver) */}
          {topThree[1] && (
            <div className="bg-neutral-900 border border-neutral-700/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-center flex flex-col items-center justify-center order-2 sm:order-1">
              <div className="w-12 h-12 rounded-full bg-slate-300/20 text-slate-200 flex items-center justify-center mb-2 font-black text-xl">
                🥈
              </div>
              <span className="text-xs font-bold text-slate-400">2nd Prize Winner</span>
              <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">{topThree[1].displayName}</h4>
              <div className="text-emerald-400 font-extrabold text-sm mt-1">{cashPrizes.second}</div>
              <div className="bg-neutral-950 border border-neutral-800 px-3 py-1 rounded-xl text-xs font-mono text-amber-400 font-bold mt-2">
                Score: {topThree[1].score}/20 • {topThree[1].durationSeconds}s
              </div>
            </div>
          )}

          {/* Rank 1 (Gold) */}
          {topThree[0] && (
            <div className="bg-gradient-to-b from-amber-950/50 via-neutral-900 to-neutral-900 border-2 border-amber-500 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-center flex flex-col items-center justify-center order-1 sm:order-2 shadow-xl shadow-amber-500/10">
              <div className="w-16 h-16 rounded-full bg-amber-500/30 border border-amber-400 text-amber-300 flex items-center justify-center mb-2 font-black text-2xl shadow-lg">
                🥇
              </div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">1st Champion</span>
              <h4 className="text-base sm:text-lg font-black text-white mt-0.5">{topThree[0].displayName}</h4>
              <div className="text-emerald-400 font-black text-lg mt-1">{cashPrizes.first}</div>
              <div className="bg-neutral-950 border border-amber-500/40 px-3 py-1 rounded-xl text-xs font-mono text-amber-300 font-black mt-2">
                Score: {topThree[0].score}/20 • {topThree[0].durationSeconds}s
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {topThree[2] && (
            <div className="bg-neutral-900 border border-neutral-700/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-center flex flex-col items-center justify-center order-3">
              <div className="w-12 h-12 rounded-full bg-amber-700/20 text-amber-600 flex items-center justify-center mb-2 font-black text-xl">
                🥉
              </div>
              <span className="text-xs font-bold text-amber-600">3rd Prize Winner</span>
              <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">{topThree[2].displayName}</h4>
              <div className="text-emerald-400 font-extrabold text-sm mt-1">{cashPrizes.third}</div>
              <div className="bg-neutral-950 border border-neutral-800 px-3 py-1 rounded-xl text-xs font-mono text-amber-400 font-bold mt-2">
                Score: {topThree[2].score}/20 • {topThree[2].durationSeconds}s
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & Refresh Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="नाम या शहर द्वारा खोजें..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={fetchScholarshipLeaderboard}
          className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 px-4 py-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>रिफ्रेश (Refresh Rankings)</span>
        </button>
      </div>

      {/* Main Table / Card Container */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 sm:py-16 text-center text-neutral-400 text-xs sm:text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            <span>लीडरबोर्ड रैंकिंग लोड हो रही है...</span>
          </div>
        ) : filteredScholarship.length === 0 ? (
          <div className="py-12 sm:py-16 text-center text-neutral-400 text-xs sm:text-sm px-4">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-amber-500/40" />
            <p className="font-semibold text-white">अभी तक कोई स्कॉलरशिप टेस्ट सबमिशन दर्ज नहीं हुआ है।</p>
            <p className="text-xs text-neutral-400 mt-1">20-प्रश्न AI स्कॉलरशिप टेस्ट दें और 1st प्राइज {cashPrizes.first} जीतें!</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block sm:hidden divide-y divide-neutral-800">
              {filteredScholarship.map(w => {
                const isTop3 = w.rank <= 3;
                const isGift = w.rank >= 4 && w.rank <= 10;
                return (
                  <div key={w.id} className={`p-3.5 flex items-center justify-between gap-2 ${isTop3 ? "bg-amber-500/5" : ""}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center font-bold font-mono text-xs text-amber-400 flex-shrink-0">
                        {w.rank === 1 ? "🥇 #1" : w.rank === 2 ? "🥈 #2" : w.rank === 3 ? "🥉 #3" : `#${w.rank}`}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white leading-snug">{w.displayName}</div>
                        <div className="text-[10px] text-neutral-400">
                          {w.city ? `${w.city} • ` : ""}{new Date(w.submittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-mono font-bold text-amber-300">{w.score}/20 ({w.durationSeconds}s)</div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        w.rank === 1 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                        w.rank === 2 ? "bg-slate-300/20 text-slate-200 border border-slate-300/40" :
                        w.rank === 3 ? "bg-amber-700/20 text-amber-400 border border-amber-700/40" :
                        isGift ? "bg-purple-900/40 text-purple-300 border border-purple-500/40" :
                        "bg-neutral-800 text-neutral-400"
                      }`}>
                        {w.prizeText || (w.rank === 1 ? cashPrizes.first : w.rank === 2 ? cashPrizes.second : w.rank === 3 ? cashPrizes.third : isGift ? "🎁 Gift Winner" : "Certificate")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-16">रैंक</th>
                    <th className="py-3.5 px-4">प्रतिभागी (Participant)</th>
                    <th className="py-3.5 px-4 text-center">स्कोर (Score)</th>
                    <th className="py-3.5 px-4 text-center">समय (Duration)</th>
                    <th className="py-3.5 px-4">पुरस्कार (Award / Prize)</th>
                    <th className="py-3.5 px-4 text-right">सबमिशन समय</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredScholarship.map(w => {
                    const isTop3 = w.rank <= 3;
                    const isGift = w.rank >= 4 && w.rank <= 10;
                    return (
                      <tr key={w.id} className={`hover:bg-neutral-850/50 transition-colors ${isTop3 ? "bg-amber-500/5 font-semibold" : ""}`}>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                          {w.rank === 1 ? "🥇 1" : w.rank === 2 ? "🥈 2" : w.rank === 3 ? "🥉 3" : `#${w.rank}`}
                        </td>
                        <td className="py-3.5 px-4 text-white font-medium">
                          {w.displayName} {w.city ? <span className="text-neutral-400 text-[11px]">({w.city})</span> : ""}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-amber-300 font-bold">
                          {w.score} / 20
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-neutral-300">
                          {w.durationSeconds}s
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            w.rank === 1 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                            w.rank === 2 ? "bg-slate-300/20 text-slate-200 border border-slate-300/40" :
                            w.rank === 3 ? "bg-amber-700/20 text-amber-400 border border-amber-700/40" :
                            isGift ? "bg-purple-950/60 text-purple-300 border border-purple-500/40" :
                            "bg-neutral-800 text-neutral-300"
                          }`}>
                            {w.rank <= 3 && <Trophy className="w-3 h-3 text-amber-400" />}
                            {isGift && <Gift className="w-3 h-3 text-purple-300" />}
                            {w.prizeText || (w.rank === 1 ? cashPrizes.first : w.rank === 2 ? cashPrizes.second : w.rank === 3 ? cashPrizes.third : isGift ? "🎁 Gift Winner" : "Certificate")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-neutral-400 text-[11px]">
                          {new Date(w.submittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
