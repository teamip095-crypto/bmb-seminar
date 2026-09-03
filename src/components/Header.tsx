import React from "react";
import { FridaySeminarStatusResponse, ParticipantProfile } from "../types";
import { Sparkles, Calendar, Clock, Trophy, BookOpen, UserCheck, Shield, Award } from "lucide-react";

interface HeaderProps {
  activeTab: "registration" | "learning" | "quiz" | "scholarship" | "leaderboard" | "admin";
  onTabChange: (tab: "registration" | "learning" | "quiz" | "scholarship" | "leaderboard" | "admin") => void;
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
    <>
      <header className="sticky top-0 z-50 bg-neutral-900/98 backdrop-blur-md border-b border-neutral-800 text-white shadow-lg w-full max-w-full">
        {/* Top Mini Status Bar with Friday status */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-amber-50 text-[10px] sm:text-xs py-1 px-3 sm:px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap min-w-0">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold flex-shrink-0 ${
                seminarStatus?.isActiveNow
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-amber-950/90 text-amber-200 border border-amber-400/40"
              }`}>
                {seminarStatus?.isActiveNow ? "🔴 LIVE FRIDAY" : "⏳ UPCOMING FRIDAY"}
              </span>
              <span className="font-semibold text-[10px] sm:text-xs truncate text-amber-100">
                {seminarStatus?.formattedDateHi || "शुक्रवार सेमिनार"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[9px] sm:text-[11px] font-mono flex-shrink-0">
              <span className="flex items-center gap-1 text-amber-200">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300" />
                <span>11 AM – 4 PM</span>
              </span>
              {participant && (
                <span className="hidden xs:inline-flex items-center gap-1 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-400/30 text-amber-200 truncate max-w-[100px] sm:max-w-[150px]">
                  <UserCheck className="w-2.5 h-2.5 text-amber-300 flex-shrink-0" />
                  <span className="truncate">{participant.name}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Brand Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11 sm:h-16">
            {/* Logo & Brand */}
            <div
              id="brand-logo-button"
              onClick={() => onTabChange("registration")}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0"
            >
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-neutral-950" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors truncate">
                    BMB Educom
                  </h1>
                  <span className="text-[8px] sm:text-[10px] font-semibold bg-neutral-800 text-amber-400 px-1 sm:px-1.5 py-0.5 rounded border border-neutral-700 flex-shrink-0">
                    AI SEMINAR
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 hidden sm:block">
                  Friday About AI, 2-Min Quiz & Admission CRM
                </p>
              </div>
            </div>

            {/* Desktop Navigation Items (md and up) */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
              <button
                id="nav-tab-registration"
                onClick={() => onTabChange("registration")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all cursor-pointer ${
                  activeTab === "quiz"
                    ? "bg-amber-500 text-neutral-950 shadow-md font-semibold"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <Award className="w-4 h-4" />
                <span className="relative">
                  2-Min Quiz
                  <span className="inline-block absolute -top-2 -right-3 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </span>
              </button>

              <button
                id="nav-tab-leaderboard"
                onClick={() => onTabChange("leaderboard")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all cursor-pointer ${
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

        {/* Mobile Dedicated 5-Tab Navigation Strip (Always visible on mobile & tablet) */}
        <div className="md:hidden w-full bg-neutral-950/95 border-t border-neutral-800/90 px-1 py-1">
          <div className="grid grid-cols-5 gap-1 max-w-full">
            <button
              id="mob-nav-reg"
              onClick={() => onTabChange("registration")}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === "registration"
                  ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                  : "text-neutral-300 hover:text-white bg-neutral-900/50"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[9px] font-semibold leading-tight mt-0.5">Register</span>
            </button>

            <button
              id="mob-nav-learn"
              onClick={() => onTabChange("learning")}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === "learning"
                  ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                  : "text-neutral-300 hover:text-white bg-neutral-900/50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-[9px] font-semibold leading-tight mt-0.5">About AI</span>
            </button>

            <button
              id="mob-nav-quiz"
              onClick={() => onTabChange("quiz")}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-center transition-all cursor-pointer relative ${
                activeTab === "quiz"
                  ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                  : "text-neutral-300 hover:text-white bg-neutral-900/50 border border-amber-500/30"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span className="text-[9px] font-semibold leading-tight mt-0.5">Quiz</span>
              <span className="absolute 0 top-0.5 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            </button>

            <button
              id="mob-nav-ranks"
              onClick={() => onTabChange("leaderboard")}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === "leaderboard"
                  ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                  : "text-neutral-300 hover:text-white bg-neutral-900/50"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="text-[9px] font-semibold leading-tight mt-0.5">Ranks</span>
            </button>

            <button
              id="mob-nav-admin"
              onClick={() => onTabChange("admin")}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                  : "text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[9px] font-semibold leading-tight mt-0.5">Admin</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
