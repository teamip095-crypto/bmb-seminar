import React from "react";
import { FridaySeminarStatusResponse, ParticipantProfile } from "../types";
import { Sparkles, Calendar, Clock, Trophy, BookOpen, UserCheck, Shield, Award } from "lucide-react";
import { BMBLogo } from "./BMBLogo";

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
    <>
      <header className="sticky top-0 z-50 bg-neutral-900/98 backdrop-blur-md border-b border-neutral-800 text-white shadow-lg w-full max-w-full">
        {/* Top Mini Status Bar with dynamic seminar status */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-amber-50 text-[10px] sm:text-xs py-1 px-3 sm:px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap min-w-0">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold flex-shrink-0 ${
                seminarStatus?.isActiveNow
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-amber-950/90 text-amber-200 border border-amber-400/40"
              }`}>
                {seminarStatus?.isActiveNow ? "🔴 LIVE SEMINAR" : "⏳ UPCOMING SEMINAR"}
              </span>
              <span className="font-semibold text-[10px] sm:text-xs truncate text-amber-100">
                {seminarStatus?.formattedDateHi || seminarStatus?.formattedDateEn || "AI सेमिनार"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[9px] sm:text-[11px] font-mono flex-shrink-0">
              <span className="flex items-center gap-1 text-amber-200">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300" />
                <span>{seminarStatus?.seminarTime || "11 AM – 4 PM"}</span>
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
          <div className="flex items-center justify-between h-14 sm:h-20">
            {/* Logo & Brand */}
            <div
              id="brand-logo-button"
              onClick={() => onTabChange("registration")}
              className="flex items-center gap-3 sm:gap-4 cursor-pointer group min-w-0 py-1"
            >
              {/* Actual BMB Educom Logo - Large, Authentic & Prominently placed to the left of BMB Educom */}
              <div className="h-12 sm:h-18 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-white border border-neutral-200/90 flex items-center justify-center shadow-xl shadow-black/30 group-hover:scale-105 transition-all flex-shrink-0">
                <BMBLogo className="h-10 sm:h-15 w-auto object-contain" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors truncate">
                    BMB Educom
                  </h1>
                  <span className="text-[10px] sm:text-xs font-bold bg-neutral-800 text-amber-400 px-2 py-0.5 rounded-md border border-neutral-700 flex-shrink-0">
                    AI SEMINAR
                  </span>
                </div>
                <p className="text-xs text-neutral-400 hidden sm:block font-medium">
                  BMB AI Seminar, 2-Stage Quiz, Leaderboard & About BMB Educom
                </p>
              </div>
            </div>

            {/* Desktop Navigation Items (md and up) */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
              {/* 1. Registration */}
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

              {/* 2. Quiz */}
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
                  Quiz
                  <span className="inline-block absolute -top-2 -right-2.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </span>
              </button>

              {/* 3. Leadership Board / Leaderboard */}
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

              {/* 4. About BMB Educom */}
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
                <span>About BMB Educom</span>
              </button>

              {/* 5. Super Admin (Admin Control Only) */}
              <button
                id="nav-tab-admin"
                onClick={() => onTabChange("admin")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all cursor-pointer ${
                  activeTab === "admin"
                    ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
                    : "text-amber-400/90 hover:text-amber-300 hover:bg-neutral-800 border border-amber-500/30"
                }`}
                title="Super Admin - केवल एडमिन नियंत्रण (Protected Access)"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="font-bold flex items-center gap-1">
                  <span>Super Admin</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-mono">
                    Admin
                  </span>
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Mobile Dedicated 5-Tab Navigation Strip (Order: Registration -> Quiz -> Leaderboard -> About BMB Educom -> Super Admin) */}
        <div className="md:hidden w-full bg-neutral-950/95 border-t border-neutral-800/90 px-1 py-1">
          <div className="grid grid-cols-5 gap-1 max-w-full">
            {/* 1. Register */}
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

            {/* 2. Quiz */}
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
              <span className="absolute top-0.5 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            </button>

            {/* 3. Leadership / Leaderboard */}
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
              <span className="text-[9px] font-semibold leading-tight mt-0.5">Leaders</span>
            </button>

            {/* 4. About BMB Educom */}
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
              <span className="text-[9px] font-semibold leading-tight mt-0.5">About BMB</span>
            </button>

            {/* 5. Super Admin */}
            <button
              id="mob-nav-admin"
              onClick={() => onTabChange("admin")}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                  : "text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30"
              }`}
              title="Super Admin - केवल एडमिन"
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
