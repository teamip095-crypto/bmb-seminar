import React, { useState, useEffect } from "react";
import { LeaderboardEntry, FridaySeminarStatusResponse } from "../types";
import {
  Trophy,
  Medal,
  Award,
  Search,
  RefreshCw,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2
} from "lucide-react";

interface LeaderboardViewProps {
  seminarStatus: FridaySeminarStatusResponse | null;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ seminarStatus }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = () => {
    if (!seminarStatus?.event?.id) return;
    setLoading(true);

    fetch(`/api/leaderboard/${seminarStatus.event.id}`)
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data.leaderboard || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Leaderboard fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [seminarStatus?.event?.id]);

  const filtered = leaderboard.filter(entry =>
    entry.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 mb-8 text-center shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full text-amber-400 text-xs font-semibold mb-3">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Official Friday Leaderboard</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          शुक्रवार AI सेमिनार लीडरबोर्ड
        </h2>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto mb-4">
          रैंकिंग का निर्धारण: उच्चतम अंक (4/4) एवं न्यूनतम समय (सेकंड)।
        </p>

        <div className="inline-flex items-center gap-2 text-xs bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl text-neutral-300">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>{seminarStatus?.formattedDateHi || "Current Friday"} ({seminarStatus?.formattedDateEn || "Current Friday"})</span>
        </div>
      </div>

      {/* Podium for Top 3 Performers */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Rank 2 (Silver) */}
          {topThree[1] && (
            <div className="bg-neutral-900 border border-neutral-700/60 rounded-3xl p-5 text-center flex flex-col items-center justify-center order-2 md:order-1">
              <div className="w-12 h-12 rounded-full bg-slate-300/20 text-slate-200 flex items-center justify-center mb-2 font-black text-lg">
                🥈
              </div>
              <span className="text-xs font-bold text-slate-400">Rank #2</span>
              <h4 className="text-sm font-bold text-white mt-1 mb-2">{topThree[1].displayName}</h4>
              <div className="bg-neutral-950 border border-neutral-800 px-3 py-1 rounded-xl text-xs font-mono text-amber-400 font-bold">
                {topThree[1].score}/4 • {topThree[1].durationSeconds}s
              </div>
            </div>
          )}

          {/* Rank 1 (Gold) */}
          {topThree[0] && (
            <div className="bg-gradient-to-b from-amber-950/40 via-neutral-900 to-neutral-900 border-2 border-amber-500 rounded-3xl p-6 text-center flex flex-col items-center justify-center order-1 md:order-2 shadow-xl shadow-amber-500/10">
              <div className="w-16 h-16 rounded-full bg-amber-500/30 border border-amber-400 text-amber-300 flex items-center justify-center mb-2 font-black text-2xl shadow-lg">
                🥇
              </div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">Champion #1</span>
              <h4 className="text-base font-extrabold text-white mt-1 mb-2">{topThree[0].displayName}</h4>
              <div className="bg-neutral-950 border border-amber-500/30 px-4 py-1.5 rounded-xl text-sm font-mono text-amber-300 font-black">
                {topThree[0].score}/4 • {topThree[0].durationSeconds}s
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {topThree[2] && (
            <div className="bg-neutral-900 border border-neutral-700/60 rounded-3xl p-5 text-center flex flex-col items-center justify-center order-3">
              <div className="w-12 h-12 rounded-full bg-amber-700/20 text-amber-600 flex items-center justify-center mb-2 font-black text-lg">
                🥉
              </div>
              <span className="text-xs font-bold text-amber-600">Rank #3</span>
              <h4 className="text-sm font-bold text-white mt-1 mb-2">{topThree[2].displayName}</h4>
              <div className="bg-neutral-950 border border-neutral-800 px-3 py-1 rounded-xl text-xs font-mono text-amber-400 font-bold">
                {topThree[2].score}/4 • {topThree[2].durationSeconds}s
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-500" />
          <input
            id="input-search-leaderboard"
            type="text"
            placeholder="नाम या शहर खोजें (Search participant or city)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 pl-10 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={fetchLeaderboard}
          className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>रिफ्रेश (Refresh Rankings)</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-neutral-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            <span>लीडरबोर्ड रैंकिंग लोड हो रही है...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-sm">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
            <p>अभी तक कोई क्विज परिणाम दर्ज नहीं हुआ है।</p>
            <span className="text-xs text-neutral-500">पहले प्रतिभागी बनें और लीडरबोर्ड पर टॉप रैंक प्राप्त करें!</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">रैंक (Rank)</th>
                  <th className="py-3.5 px-4">प्रतिभागी (Participant)</th>
                  <th className="py-3.5 px-4 text-center">स्कोर (Score)</th>
                  <th className="py-3.5 px-4 text-center">समय (Duration)</th>
                  <th className="py-3.5 px-4 text-center">दर्ज समय</th>
                  <th className="py-3.5 px-4 text-right">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filtered.map((entry) => {
                  const isTop3 = entry.rank <= 3;
                  const rankBadge =
                    entry.rank === 1 ? "🥇 1" :
                    entry.rank === 2 ? "🥈 2" :
                    entry.rank === 3 ? "🥉 3" :
                    `#${entry.rank}`;

                  return (
                    <tr
                      key={entry.rank}
                      className={`hover:bg-neutral-850/50 transition-colors ${
                        isTop3 ? "bg-amber-500/5 font-semibold" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                        {rankBadge}
                      </td>
                      <td className="py-3.5 px-4 text-white font-medium">
                        {entry.displayName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-amber-300 font-bold">
                        {entry.score} / 4
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-neutral-300">
                        {entry.durationSeconds}s
                      </td>
                      <td className="py-3.5 px-4 text-center text-neutral-400 text-[11px]">
                        {new Date(entry.submittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.resultStatus === "passed"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-neutral-800 text-neutral-400"
                        }`}>
                          {entry.resultStatus === "passed" ? "Passed" : "Participated"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
