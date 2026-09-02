import React from "react";
import { FridaySeminarStatusResponse, ParticipantProfile } from "../types";
import { Sparkles, Calendar, Clock, Trophy, BookOpen, UserCheck, Shield, Award } from "lucide-react";

interface HeaderProps {
  activeTab: "registration" | "learning" | "quiz" | "leaderboard" | "admin";
  onTabChange: (tab: "registration" | "learning" | "quiz" | "leaderboard" | "admin") => void;
  seminarStatus: FridaySeminarStatusResponse | null;
  participant: ParticipantProfile | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  seminarStatus,
  participant
}) => {
  return (
    <header className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 text-white">
      {/* Top Banner with Friday status and IST server time */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-amber-50 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
              seminarStatus?.isActiveNow
                ? "bg-red-500 text-white animate-pulse"
                : "bg-amber-950/80 text-amber-200 border border-amber-400/40"
            }`}>
              {seminarStatus?.isActiveNow ? "🔴 LIVE FRIDAY SEMINAR (11 AM – 4 PM IST)" : "⏳ UPCOMING FRIDAY SEMINAR"}
            </span>
            <span className="hidden sm:inline font-medium">
              {seminarStatus?.formattedDateHi || "शुक्रवार सेमिनार"} ({seminarStatus?.formattedDateEn || "Friday Seminar"})
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {seminarStatus?.serverTimeIST || "11:00 AM – 4:00 PM IST"}
            </span>
            {participant && (
              <span className="hidden md:inline-flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-400/30">
                <UserCheck className="w-3 h-3 text-amber-300" />
                <span className="text-amber-200">{participant.name} ({participant.registration_id})</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            id="brand-logo-button"
            onClick={() => onTabChange("registration")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 text-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  BMB Educom
                </h1>
                <span className="text-[10px] font-semibold bg-neutral-800 text-amber-400 px-2 py-0.5 rounded border border-neutral-700">
                  AI SEMINAR
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Friday About AI, 2-Min Quiz & Admission CRM
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-tab-registration"
              onClick={() => onTabChange("registration")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "registration"
                  ? "bg-amber-500 text-neutral-950 shadow-md font-semibold"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Registration</span>
            </button>

            <button
              id="nav-tab-learning"
              onClick={() => onTabChange("learning")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "learning"
                  ? "bg-amber-500 text-neutral-950 shadow-md font-semibold"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>About AI</span>
            </button>

            <button
              id="nav-tab-quiz"
              onClick={() => onTabChange("quiz")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "quiz"
                  ? "bg-amber-500 text-neutral-950 shadow-md font-semibold"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <Award className="w-4 h-4" />
              <span className="relative">
                2-Min Quiz
                <span className="hidden sm:inline-block absolute -top-2 -right-3 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              </span>
            </button>

            <button
              id="nav-tab-leaderboard"
              onClick={() => onTabChange("leaderboard")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "leaderboard"
                  ? "bg-amber-500 text-neutral-950 shadow-md font-semibold"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </button>

            <button
              id="nav-tab-admin"
              onClick={() => onTabChange("admin")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "admin"
                  ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
                  : "text-amber-400/90 hover:text-amber-300 hover:bg-neutral-800 border border-amber-500/30"
              }`}
              title="Super Admin Master Control & Marketing Backup"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="font-bold">Super Admin</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
