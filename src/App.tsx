import React, { useState, useEffect } from "react";
import { FridaySeminarStatusResponse, ParticipantProfile } from "./types";
import { Header } from "./components/Header";
import { WinnerTicker } from "./components/WinnerTicker";
import { RegistrationView } from "./components/RegistrationView";
import { LearningPlayerView } from "./components/LearningPlayerView";
import { QuizArenaView } from "./components/QuizArenaView";
import { ScholarshipQuizView } from "./components/ScholarshipQuizView";
import { LeaderboardView } from "./components/LeaderboardView";
import { AdminCRMView } from "./components/AdminCRMView";
import { Sparkles, Shield, Heart, GraduationCap } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"registration" | "learning" | "quiz" | "scholarship" | "leaderboard" | "admin">("registration");
  const [seminarStatus, setSeminarStatus] = useState<FridaySeminarStatusResponse | null>(null);
  const [participant, setParticipant] = useState<ParticipantProfile | null>(null);
  const [participantToken, setParticipantToken] = useState<string | null>(() => localStorage.getItem("bmb_participant_token"));

  // Fetch live seminar status
  const fetchStatus = () => {
    fetch("/api/seminar/status")
      .then(async res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => setSeminarStatus(data))
      .catch(err => console.error("Error loading seminar status:", err));
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // 30s status polling
    return () => clearInterval(interval);
  }, []);

  // Parse token from URL if provided (e.g. /learn/:token or ?token=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");

    const pathname = window.location.pathname;
    let pathToken = "";
    if (pathname.startsWith("/learn/")) {
      pathToken = pathname.replace("/learn/", "").trim();
    }

    const effectiveToken = urlToken || pathToken || participantToken;
    if (effectiveToken && effectiveToken !== "existing-session") {
      fetch(`/api/participant/${effectiveToken}`)
        .then(res => res.json())
        .then(data => {
          if (data.participant) {
            setParticipant(data.participant);
            setParticipantToken(effectiveToken);
            localStorage.setItem("bmb_participant_token", effectiveToken);
            // If coming directly from a learn link, switch to learning tab
            if (pathToken || urlToken) {
              setActiveTab("learning");
            }
          }
        })
        .catch(err => console.error("Error fetching participant profile:", err));
    }
  }, []);

  const handleRegistrationSuccess = (p: ParticipantProfile, token: string) => {
    setParticipant(p);
    if (token) {
      setParticipantToken(token);
      localStorage.setItem("bmb_participant_token", token);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-neutral-950">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        seminarStatus={seminarStatus}
        participant={participant}
      />

      {/* Live Quiz Winner Running Ticker */}
      <WinnerTicker />

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden pb-24 md:pb-8">
        {activeTab === "registration" && (
          <RegistrationView
            seminarStatus={seminarStatus}
            onRegistrationSuccess={handleRegistrationSuccess}
            onProceedToLearning={() => setActiveTab("learning")}
            participant={participant}
          />
        )}

        {activeTab === "learning" && (
          <LearningPlayerView
            participant={participant}
            onProceedToQuiz={() => setActiveTab("quiz")}
          />
        )}

        {activeTab === "quiz" && (
          <QuizArenaView
            participant={participant}
            participantToken={participantToken}
            onGoToRegistration={() => setActiveTab("registration")}
            onGoToLeaderboard={() => setActiveTab("leaderboard")}
            onProceedToScholarship={() => setActiveTab("scholarship")}
          />
        )}

        {activeTab === "scholarship" && (
          <ScholarshipQuizView
            participant={participant}
            participantToken={participantToken}
            onGoToRegistration={() => setActiveTab("registration")}
            onGoToLeaderboard={() => setActiveTab("leaderboard")}
          />
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardView seminarStatus={seminarStatus} />
        )}

        {activeTab === "admin" && (
          <AdminCRMView seminarStatus={seminarStatus} />
        )}
      </main>

      {/* Modern Footer */}
      <footer className="bg-neutral-900 border-t border-neutral-800 text-neutral-400 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 mt-8 sm:mt-16 text-xs mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              B
            </div>
            <span className="font-semibold text-white">BMB Educom AI Seminar</span>
            <span className="text-neutral-500">|</span>
            <span>Empowering Students & Professionals with Practical AI Skills</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Verified Knowledge Base
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-neutral-800/80 text-[11px] text-neutral-500 text-center sm:text-left flex flex-col sm:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} BMB Educom. All rights reserved. Zero fake placement claims.</p>
          <p>Friday Timings: 11:00 AM – 4:00 PM IST | Official AI Seminar</p>
        </div>
      </footer>
    </div>
  );
}
