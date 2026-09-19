import React, { useState, useEffect } from "react";
import {
  Trophy,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  HelpCircle,
  XCircle,
  Share2,
  RefreshCw,
  Gift,
  Lock,
  QrCode,
  ShieldCheck,
  Flame,
  Star,
  Users
} from "lucide-react";
import confetti from "canvas-confetti";
import { ParticipantProfile, SeminarPassPurchase } from "../types";
import { SeminarPassPaymentModal } from "./SeminarPassPaymentModal";

interface QuizArenaViewProps {
  participant: ParticipantProfile | null;
  participantToken: string | null;
  onGoToRegistration: () => void;
  onGoToLeaderboard: () => void;
}

// Stage 1 (Round 1) Interfaces: 5 Qs, 2 Mins
interface Round1StartResponse {
  attemptId: string;
  totalQuestions: number;
  durationSecondsLimit: number;
  startedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  questions: {
    id: string;
    question_order: number;
    question: string;
    options: string[];
  }[];
}

interface Round1SubmitResponse {
  message: string;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  rank: number;
  isQualified?: boolean;
  isFreePassWinner: boolean;
  pass?: SeminarPassPurchase | null;
  offerDetails?: {
    originalPrice: number;
    offerPrice: number;
    savings: number;
    upiId: string;
    upiPhone: string;
    payeeName: string;
  };
  review: {
    id: string;
    question: string;
    options: string[];
    selectedOption: number;
    correctOption: number;
    isCorrect: boolean;
  }[];
}

// Stage 2 (Mega Seminar AI Quiz) Interfaces: 10 Qs, 5 Mins
interface Stage2StartResponse {
  attemptId: string;
  totalQuestions: number;
  durationSecondsLimit: number;
  startedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  questions: {
    id: string;
    order: number;
    question: string;
    options: string[];
  }[];
  prizes: {
    first: string;
    second: string;
    third: string;
    ranks4to20: string;
    allParticipants: string;
  };
  terms: {
    validityDays: number;
    validityNote: string;
    conditionNote: string;
  };
}

interface Stage2SubmitResponse {
  message: string;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  rank: number;
  prizeText: string;
  prizeType: string;
  cashPrize?: number;
  scholarshipAmount?: number;
  submittedAt: string;
  review: {
    id: string;
    order: number;
    question: string;
    options: string[];
    selectedOption: number;
    correctOption: number;
    isCorrect: boolean;
    explanation: string;
    topic: string;
  }[];
  terms?: {
    validityNote: string;
    conditionNote: string;
  };
}

export const QuizArenaView: React.FC<QuizArenaViewProps> = ({
  participant,
  participantToken,
  onGoToRegistration,
  onGoToLeaderboard
}) => {
  // Active Stage Tab: "stage1" (2-min AI Awareness) or "stage2" (5-min Mega Seminar AI Quiz)
  const [currentStage, setCurrentStage] = useState<"stage1" | "stage2">("stage1");

  // Pass Status from Server
  const [passStatus, setPassStatus] = useState<{
    hasPass: boolean;
    isTop10Winner: boolean;
    isQualified: boolean;
    eligibleForRound2: boolean;
    isStage2Active: boolean;
    stage2ActivatedAt: string | null;
    totalPassHoldersCount: number;
    pass: SeminarPassPurchase | null;
  }>({
    hasPass: false,
    isTop10Winner: false,
    isQualified: false,
    eligibleForRound2: false,
    isStage2Active: false,
    stage2ActivatedAt: null,
    totalPassHoldersCount: 0,
    pass: null
  });

  // Modal State for ₹199 Payment & Screenshot Upload
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // -------------------------
  // STAGE 1 (Round 1) STATE
  // -------------------------
  const [r1Attempt, setR1Attempt] = useState<Round1StartResponse | null>(null);
  const [r1CurrentIndex, setR1CurrentIndex] = useState(0);
  const [r1Answers, setR1Answers] = useState<Record<string, number>>({});
  const [r1RemainingSeconds, setR1RemainingSeconds] = useState<number>(120);
  const [r1Submission, setR1Submission] = useState<Round1SubmitResponse | null>(null);

  // -------------------------
  // STAGE 2 (Round 2) STATE
  // -------------------------
  const [r2Attempt, setR2Attempt] = useState<Stage2StartResponse | null>(null);
  const [r2CurrentIndex, setR2CurrentIndex] = useState(0);
  const [r2Answers, setR2Answers] = useState<Record<string, number>>({});
  const [r2RemainingSeconds, setR2RemainingSeconds] = useState<number>(300);
  const [r2Submission, setR2Submission] = useState<Stage2SubmitResponse | null>(null);

  // Loading and Error States
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch participant pass status helper
  const refreshPassStatus = async (showLoadingIndicator = false) => {
    if (!participantToken) return;
    if (showLoadingIndicator) setIsCheckingStatus(true);
    try {
      const res = await fetch(`/api/pass/status/${participantToken}`);
      const data = await res.json();
      if (data.participantId) {
        setPassStatus({
          hasPass: data.hasPass,
          isTop10Winner: data.isTop10Winner,
          isQualified: Boolean(data.isQualified),
          eligibleForRound2: data.eligibleForRound2,
          isStage2Active: Boolean(data.isStage2Active),
          stage2ActivatedAt: data.stage2ActivatedAt || null,
          totalPassHoldersCount: data.totalPassHoldersCount || 0,
          pass: data.pass || null
        });
      }
    } catch (err) {
      console.error("Error fetching pass status:", err);
    } finally {
      if (showLoadingIndicator) setIsCheckingStatus(false);
    }
  };

  // Fetch participant pass status on mount & set up polling when in Stage 2
  useEffect(() => {
    refreshPassStatus();
    // Auto-poll every 7 seconds when student is in Stage 2 to detect Admin Live Activation
    const interval = setInterval(() => {
      if (currentStage === "stage2" && !r2Attempt && !r2Submission) {
        refreshPassStatus();
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [participantToken, currentStage, r2Attempt, r2Submission]);

  // -----------------------------------------------------------
  // TIMER HOOK: Stage 1 (120s Countdown)
  // -----------------------------------------------------------
  useEffect(() => {
    if (!r1Attempt || r1Submission) return;

    const timer = setInterval(() => {
      setR1RemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleR1Submit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [r1Attempt, r1Submission, r1Answers]);

  // -----------------------------------------------------------
  // TIMER HOOK: Stage 2 (300s Countdown)
  // -----------------------------------------------------------
  useEffect(() => {
    if (!r2Attempt || r2Submission) return;

    const timer = setInterval(() => {
      setR2RemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleR2Submit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [r2Attempt, r2Submission, r2Answers]);

  // -----------------------------------------------------------
  // STAGE 1: Start 2-Minute AI Awareness Quiz (5 Questions)
  // -----------------------------------------------------------
  const handleStartRound1 = async () => {
    if (!participantToken) {
      setErrorMessage("कृपया क्विज शुरू करने से पहले रजिस्ट्रेशन करें।");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_token: participantToken })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.alreadyCompleted) {
          setErrorMessage("आप पहले ही Stage 1 क्विज पूरा कर चुके हैं।");
        } else {
          throw new Error(data.error || "क्विज शुरू करने में त्रुटि।");
        }
        return;
      }

      setR1Attempt(data);
      setR1RemainingSeconds(data.remainingSeconds || 120);
      setR1CurrentIndex(0);
      setR1Answers({});
    } catch (err: any) {
      setErrorMessage(err.message || "क्विज शुरू करने में विफलता।");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------------
  // STAGE 1: Submit Answers
  // -----------------------------------------------------------
  const handleR1Submit = async (isAuto = false) => {
    if (!r1Attempt || !participantToken || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const answersPayload = r1Attempt.questions.map(q => ({
      quiz_question_id: q.id,
      selected_option: r1Answers[q.id] !== undefined ? r1Answers[q.id] : -1
    }));

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: r1Attempt.attemptId,
          participant_token: participantToken,
          answers: answersPayload,
          is_auto_submit: isAuto
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "क्विज सबमिशन विफल।");

      setR1Submission(data);

      if (data.isFreePassWinner) {
        setPassStatus(prev => ({
          ...prev,
          hasPass: true,
          isTop10Winner: true,
          eligibleForRound2: true,
          pass: data.pass || null
        }));
      }

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      setErrorMessage(err.message || "क्विज सबमिट करने में त्रुटि।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -----------------------------------------------------------
  // STAGE 2: Start 5-Minute Mega Seminar AI Quiz (10 Questions)
  // -----------------------------------------------------------
  const handleStartRound2 = async () => {
    if (!participantToken) {
      setErrorMessage("कृपया पहले रजिस्ट्रेशन करें।");
      return;
    }

    if (!passStatus.eligibleForRound2) {
      setIsPaymentModalOpen(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/scholarship/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_token: participantToken })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.stage2LockedByAdmin) {
          setPassStatus(prev => ({ ...prev, isStage2Active: false }));
          setErrorMessage(data.message || "Stage 2 Mega Quiz अभी एडमिन नियंत्रण में लॉक है। सेमिनार के दौरान लाइव शुरू किया जाएगा।");
        } else if (data.passRequired) {
          setIsPaymentModalOpen(true);
          setErrorMessage(data.error || "यह क्विज केवल BMB AI Seminar Pass धारकों के लिए है।");
        } else {
          throw new Error(data.error || "Stage 2 क्विज लोड करने में त्रुटि।");
        }
        return;
      }

      if (data.alreadyCompleted) {
        setR2Submission({
          message: "आप पहले ही Mega AI Seminar Quiz पूरा कर चुके हैं।",
          score: data.score,
          totalQuestions: data.totalQuestions || 10,
          durationSeconds: data.durationSeconds,
          rank: data.rank,
          prizeText: data.prizeText,
          prizeType: data.prizeType,
          cashPrize: data.cashPrize,
          scholarshipAmount: data.scholarshipAmount,
          submittedAt: data.submittedAt,
          review: []
        });
        return;
      }

      setR2Attempt(data);
      setR2RemainingSeconds(data.remainingSeconds || 300);
      setR2CurrentIndex(0);
      setR2Answers({});
    } catch (err: any) {
      setErrorMessage(err.message || "Stage 2 क्विज शुरू करने में विफलता।");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------------
  // STAGE 2: Submit Answers
  // -----------------------------------------------------------
  const handleR2Submit = async (isAuto = false) => {
    if (!r2Attempt || !participantToken || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const answersPayload = r2Attempt.questions.map(q => ({
      question_id: q.id,
      selected_option: r2Answers[q.id] !== undefined ? r2Answers[q.id] : -1
    }));

    try {
      const res = await fetch("/api/scholarship/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: r2Attempt.attemptId,
          participant_token: participantToken,
          answers: answersPayload,
          is_auto_submit: isAuto
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mega Quiz सबमिशन विफल रहा।");

      setR2Submission(data);
      confetti({ particleCount: 160, spread: 100, origin: { y: 0.55 } });
    } catch (err: any) {
      setErrorMessage(err.message || "क्विज सबमिट करने में त्रुटि।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Screen: Not Registered
  if (!participant) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black mb-2">
          रजिस्ट्रेशन आवश्यक है
        </h2>
        <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
          BMB Educom AI Seminar 2-Stage Quiz और स्कॉलरशिप में भाग लेने के लिए कृपया पहले पंजीकरण पूरा करें।
        </p>
        <button
          onClick={onGoToRegistration}
          className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-lg shadow-amber-500/20"
        >
          <span>पंजीकरण फॉर्म पर जाएं</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // =========================================================================
  // VIEW: STAGE 1 ACTIVE 2-MINUTE QUIZ (5 QUESTIONS)
  // =========================================================================
  if (r1Attempt && !r1Submission) {
    const qList = r1Attempt.questions;
    const currentQ = qList[r1CurrentIndex];
    const isUrgent = r1RemainingSeconds <= 30;

    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3 bg-neutral-900 border border-neutral-800 p-3 sm:p-4 rounded-2xl shadow-md">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-lg uppercase">
              Stage 1: AI Awareness Quiz
            </span>
            <span className="text-xs sm:text-sm font-bold text-neutral-300">
              प्रश्न {r1CurrentIndex + 1} / {qList.length}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm sm:text-base font-black border ${
              isUrgent
                ? "bg-red-500/20 border-red-500 text-red-300 animate-pulse"
                : "bg-neutral-950 border-neutral-700 text-amber-400"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(r1RemainingSeconds)}</span>
          </div>
        </div>

        {/* Prize Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-transparent border border-amber-500/30 rounded-xl px-3.5 py-2 mb-3 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Top 10 विजेताओं (कम समय + सही उत्तर) को <strong>₹500/- का BMB Seminar Pass मुफ्त</strong> मिलेगा!</span>
          </div>
          <span className="font-mono text-[11px] text-amber-400 bg-neutral-900 px-2 py-0.5 rounded border border-amber-500/30">
            2 Min Fast Quiz
          </span>
        </div>

        {/* Question Palette (1 to 5) */}
        <div className="flex items-center gap-2 mb-4">
          {qList.map((q, idx) => {
            const isAnswered = r1Answers[q.id] !== undefined;
            const isCurrent = idx === r1CurrentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setR1CurrentIndex(idx)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-amber-500 text-neutral-950 ring-2 ring-amber-400 font-black"
                    : isAnswered
                    ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                Q{idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl mb-4">
          <h3 className="text-base sm:text-xl font-bold text-white mb-5 leading-relaxed">
            {currentQ.question}
          </h3>

          <div className="space-y-3">
            {currentQ.options.map((optionText, optIdx) => {
              const isSelected = r1Answers[currentQ.id] === optIdx;
              return (
                <button
                  key={optIdx}
                  id={`btn-r1-opt-${currentQ.id}-${optIdx}`}
                  onClick={() => {
                    setR1Answers(prev => ({
                      ...prev,
                      [currentQ.id]: optIdx
                    }));
                  }}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-500 text-white font-bold shadow-lg shadow-amber-500/10"
                      : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-850"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isSelected ? "bg-amber-500 text-neutral-950" : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="text-xs sm:text-sm leading-snug">{optionText}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setR1CurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={r1CurrentIndex === 0}
            className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1 disabled:opacity-30 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>पिछला</span>
          </button>

          {r1CurrentIndex < qList.length - 1 ? (
            <button
              onClick={() => setR1CurrentIndex(prev => Math.min(qList.length - 1, prev + 1))}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1 cursor-pointer"
            >
              <span>अगला प्रश्न</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="btn-r1-final-submit"
              onClick={() => handleR1Submit(false)}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              {isSubmitting ? "जांच हो रही है..." : "5-प्रश्न क्विज सबमिट करें"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: STAGE 1 SUBMISSION RESULT (Top 10 Winner or ₹199 Pass Offer)
  // =========================================================================
  if (r1Submission) {
    const isWinner = r1Submission.isFreePassWinner;
    const isQualified = r1Submission.isQualified ?? (r1Submission.durationSeconds <= 120 && r1Submission.score >= 3);

    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-10 text-white">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center mb-6">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 ${
              isWinner
                ? "bg-amber-500/20 border-amber-500 text-amber-400"
                : isQualified
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                : "bg-red-500/20 border-red-500 text-red-400"
            }`}
          >
            {isWinner ? <Trophy className="w-10 h-10" /> : isQualified ? <CheckCircle2 className="w-10 h-10" /> : <Award className="w-10 h-10" />}
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider inline-block">
              Stage 1: 2-Minute AI Awareness Result
            </span>
            <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider inline-block ${
              isWinner
                ? "bg-amber-500/30 text-amber-300 border border-amber-500/40"
                : isQualified
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-red-500/20 text-red-300 border border-red-500/30"
            }`}>
              {isWinner ? "🏆 Top 10 फ्री पास विजेता" : isQualified ? "✓ क्वालिफाइड (Qualified)" : "✗ डिस्क्वालिफाइड (Not Qualified)"}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            {isWinner
              ? "🎉 बधाई! आप Top 10 विजेता हैं!"
              : isQualified
              ? "🎯 शानदार! आप सेमिनार पास के लिए क्वालिफाई हुए हैं!"
              : "⚡ क्विज संपन्न! आपका परिणाम तैयार है"}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 mb-6 max-w-lg mx-auto leading-relaxed">
            {isWinner
              ? "आपने 120 सेकंड से पहले 5 में से 3+ सही उत्तर देकर सबसे तेज समय में Top 10 में रैंक प्राप्त किया है। आपको ₹500/- का BMB EDUCOM AI SEMINAR PASS बिल्कुल मुफ्त प्रदान किया गया है!"
              : isQualified
              ? `आपने 120 सेकंड के भीतर ${r1Submission.score}/5 सही उत्तर दिए हैं (रैंक #${r1Submission.rank})। चूंकि Top 10 फ्री पास अन्य तेज प्रतिभागियों द्वारा प्राप्त किए गए हैं, आप मात्र ₹199/- में सेमिनार पास प्राप्त कर सकते हैं!`
              : "क्वालिफाई होने के लिए 120 सेकंड के अंदर न्यूनतम 3 या 4 प्रश्न सही हल करना आवश्यक था। फिर भी आप ₹500/- का सेमिनार पास मात्र ₹199/- में प्राप्त कर सेमिनार व Stage 2 दोनों में भाग ले सकते हैं!"}
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 mb-6 max-w-lg mx-auto text-left">
            <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl">
              <span className="text-[10px] text-neutral-400 block mb-1">स्कोर (5 प्रश्न)</span>
              <span className={`text-xl font-black font-mono ${r1Submission.score >= 3 ? "text-emerald-400" : "text-amber-400"}`}>
                {r1Submission.score} / {r1Submission.totalQuestions}
              </span>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl">
              <span className="text-[10px] text-neutral-400 block mb-1">लीडरबोर्ड रैंक</span>
              <span className="text-xl font-black text-white font-mono">
                #{r1Submission.rank}
              </span>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl">
              <span className="text-[10px] text-neutral-400 block mb-1">समय लगा (120s मैक्स)</span>
              <span className={`text-xl font-black font-mono ${r1Submission.durationSeconds <= 120 ? "text-white" : "text-red-400"}`}>
                {r1Submission.durationSeconds}s
              </span>
            </div>
          </div>

          {/* Special Result Outcome Card */}
          {isWinner ? (
            <div className="bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-2 border-amber-500/50 rounded-2xl p-5 mb-6 text-left shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                <div>
                  <h4 className="text-base font-black text-amber-300">
                    मुफ्त BMB AI Seminar Pass अनलॉक हो गया!
                  </h4>
                  <p className="text-xs text-neutral-300">
                    मूल्य: <span className="line-through text-neutral-500">₹500/-</span> ➔ <strong>निःशुल्क (FREE PASS)</strong>
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                आप BMB EDUCOM सेमिनार और <strong>Stage 2: Mega AI Seminar Scholarship Quiz</strong> (₹3,000 नकद + ₹10,000 स्कॉलरशिप) दोनों के लिए पूर्णतः पात्र हैं। (Stage 2 सेमिनार के दौरान एडमिन द्वारा लाइव चालू किया जाएगा)
              </p>
              <button
                onClick={() => {
                  setR1Submission(null);
                  setCurrentStage("stage2");
                }}
                className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <span>Stage 2 Mega Quiz स्टेटस देखें</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 border-2 border-amber-500/40 rounded-2xl p-5 mb-6 text-left shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    BMB EDUCOM सेमिनार पास विशेष ऑफर
                  </span>
                  <h4 className="text-lg font-black text-white mt-1">
                    BMB EDUCOM AI SEMINAR PASS (मूल्य ₹500/-)
                  </h4>
                  <p className="text-xs text-neutral-300">
                    क्विज प्रतिभागियों के लिए केवल <strong>₹199/-</strong> (₹301/- की फ्लैट छूट!)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-neutral-400 line-through block">₹500/-</span>
                  <span className="text-2xl font-black text-emerald-400">₹199/-</span>
                </div>
              </div>

              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 mb-4 text-xs text-neutral-300 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>₹199/- पास के साथ आपको मिलेगा:</span>
                </div>
                <div>• BMB Educom AI Seminar में पूर्ण प्रवेश (मूल्य ₹500/-)</div>
                <div>• <strong>Stage 2 Mega Quiz (₹3000 नकद पुरस्कार)</strong> में भाग लेने की पात्रता</div>
                <div>• सभी प्रतिभागियों के लिए ₹500/- स्कॉलरशिप + ई-सर्टिफिकेट</div>
              </div>

              <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                9301056006 पर UPI QR कोड से ₹199/- का भुगतान करें। स्क्रीनशॉट अपलोड करने पर आपका पास सत्यापित कर दिया जाएगा।
              </p>

              <button
                id="btn-claim-pass-offer"
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <QrCode className="w-4 h-4 text-neutral-950" />
                <span>UPI QR से ₹199/- में पास प्राप्त करें (Scan with Any UPI)</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            </div>
          )}

          {/* Detailed Question Review */}
          {r1Submission.review && r1Submission.review.length > 0 && (
            <div className="mt-8 text-left border-t border-neutral-800 pt-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>5 प्रश्नों की उत्तर समीक्षा (Answer Review)</span>
              </h3>

              <div className="space-y-3">
                {r1Submission.review.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border ${
                      item.isCorrect
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : "bg-red-950/20 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-neutral-400">प्रश्न {idx + 1}</span>
                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                          item.isCorrect ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {item.isCorrect ? "✓ सही उत्तर" : "✗ गलत उत्तर"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-white mb-2">{item.question}</p>
                    <div className="space-y-1 text-xs">
                      {item.options.map((opt, oIdx) => {
                        const isCorrect = oIdx === item.correctOption;
                        const isSel = oIdx === item.selectedOption;
                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-xl border flex items-center justify-between ${
                              isCorrect
                                ? "bg-emerald-900/30 border-emerald-500 text-emerald-200 font-semibold"
                                : isSel
                                ? "bg-red-900/30 border-red-500 text-red-200"
                                : "bg-neutral-950 border-neutral-800 text-neutral-400"
                            }`}
                          >
                            <span>
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </span>
                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                            {isSel && !isCorrect && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: STAGE 2 ACTIVE 5-MINUTE MEGA SEMINAR QUIZ (10 QUESTIONS)
  // =========================================================================
  if (r2Attempt && !r2Submission) {
    const qList = r2Attempt.questions;
    const currentQ = qList[r2CurrentIndex];
    const isUrgent = r2RemainingSeconds <= 45;

    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3 bg-neutral-900 border border-neutral-800 p-3 sm:p-4 rounded-2xl shadow-md">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-lg uppercase">
              Stage 2: Mega Seminar AI Quiz
            </span>
            <span className="text-xs sm:text-sm font-bold text-neutral-300">
              प्रश्न {r2CurrentIndex + 1} / {qList.length}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm sm:text-base font-black border ${
              isUrgent
                ? "bg-red-500/20 border-red-500 text-red-300 animate-pulse"
                : "bg-neutral-950 border-neutral-700 text-amber-400"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(r2RemainingSeconds)}</span>
          </div>
        </div>

        {/* Prize Banner Reminder */}
        <div className="bg-neutral-900 border border-amber-500/30 rounded-xl px-3 py-2 mb-3 text-xs text-amber-200 flex items-center justify-between">
          <span>🏆 1st: ₹3,000 Cash + ₹10,000 Scholarship • 2nd: ₹2,000 Cash • 3rd: ₹1,500 Cash (Top 20 Winners)</span>
          <span className="font-mono text-neutral-400 hidden sm:inline">5 Min Limit</span>
        </div>

        {/* Question Palette (1 to 10) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-thin">
          {qList.map((q, idx) => {
            const isAnswered = r2Answers[q.id] !== undefined;
            const isCurrent = idx === r2CurrentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setR2CurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-amber-500 text-neutral-950 ring-2 ring-amber-400 font-black"
                    : isAnswered
                    ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl mb-4">
          <h3 className="text-base sm:text-xl font-bold text-white mb-5 leading-relaxed">
            {currentQ.question}
          </h3>

          <div className="space-y-3">
            {currentQ.options.map((optionText, optIdx) => {
              const isSelected = r2Answers[currentQ.id] === optIdx;
              return (
                <button
                  key={optIdx}
                  id={`btn-r2-opt-${currentQ.id}-${optIdx}`}
                  onClick={() => {
                    setR2Answers(prev => ({
                      ...prev,
                      [currentQ.id]: optIdx
                    }));
                  }}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-500 text-white font-bold shadow-lg shadow-amber-500/10"
                      : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-850"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isSelected ? "bg-amber-500 text-neutral-950" : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="text-xs sm:text-sm leading-snug">{optionText}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setR2CurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={r2CurrentIndex === 0}
            className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1 disabled:opacity-30 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>पिछला</span>
          </button>

          {r2CurrentIndex < qList.length - 1 ? (
            <button
              onClick={() => setR2CurrentIndex(prev => Math.min(qList.length - 1, prev + 1))}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1 cursor-pointer"
            >
              <span>अगला प्रश्न</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="btn-r2-final-submit"
              onClick={() => handleR2Submit(false)}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              {isSubmitting ? "सबमिट हो रहा है..." : "Mega Quiz सबमिट करें"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: STAGE 2 SUBMISSION RESULT (20 Winners, Cash & Scholarships)
  // =========================================================================
  if (r2Submission) {
    const isTop3 = r2Submission.rank <= 3;
    const isTop20 = r2Submission.rank > 3 && r2Submission.rank <= 20;

    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-10 text-white">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-500 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10" />
          </div>

          <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider inline-block mb-3">
            Mega Seminar AI Quiz Results (Top 20 Winners)
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            {isTop3
              ? "🎉 बधाई! आप Mega Cash Prize विजेता हैं!"
              : isTop20
              ? "🎁 बधाई! आप Top 20 स्कॉलरशिप विजेता हैं!"
              : "प्रतिभागिता सफलतापूर्वक दर्ज!"}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 mb-6 max-w-lg mx-auto leading-relaxed">
            {r2Submission.message}
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-left">
            <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl">
              <span className="text-[10px] text-neutral-400 block mb-1">स्कोर</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {r2Submission.score} / {r2Submission.totalQuestions}
              </span>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl">
              <span className="text-[10px] text-neutral-400 block mb-1">रैंक</span>
              <span className="text-xl font-black text-white font-mono">
                #{r2Submission.rank}
              </span>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl">
              <span className="text-[10px] text-neutral-400 block mb-1">नकद पुरस्कार</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {r2Submission.cashPrize ? `₹${r2Submission.cashPrize}/-` : "—"}
              </span>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl">
              <span className="text-[10px] text-neutral-400 block mb-1">स्कॉलरशिप राशि</span>
              <span className="text-xl font-black text-purple-400 font-mono">
                {r2Submission.scholarshipAmount ? `₹${r2Submission.scholarshipAmount}/-` : "₹500/-"}
              </span>
            </div>
          </div>

          {/* Terms Note */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 mb-6 text-left text-xs text-neutral-400 space-y-1">
            <div className="text-amber-400 font-bold">📜 स्कॉलरशिप नियम व शर्तें:</div>
            <div>• स्कॉलरशिप BMB EDUCOM AI SEMINAR की तारीख से <strong>15 दिनों तक मान्य</strong> होगी।</div>
            <div>• नियम व शर्तें लागू: कोर्स का कुल शुल्क डिस्काउंट राशि के बराबर नहीं होगा।</div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={onGoToLeaderboard}
              className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Trophy className="w-4 h-4" />
              <span>लाइव सेमिनार लीडरबोर्ड देखें</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DEFAULT VIEW: STAGE 1 & STAGE 2 DUAL SELECTION DASHBOARD
  // =========================================================================
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10 text-white">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full text-amber-400 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>BMB Educom AI Seminar Official Examination Arena</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black mb-2">
          BMB AI सेमिनार: 2-स्टेज क्विज व स्कॉलरशिप
        </h2>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto">
          प्रतिभागी: <strong className="text-amber-400">{participant.name}</strong> • फोन: {participant.whatsapp_number}
        </p>

        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 max-w-lg mx-auto text-left">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Stage Selector Tabs */}
      <div className="flex bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl mb-6 max-w-md mx-auto">
        <button
          onClick={() => setCurrentStage("stage1")}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentStage === "stage1"
              ? "bg-amber-500 text-neutral-950 shadow-md font-black"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Stage 1: 2-Min Quiz</span>
        </button>

        <button
          onClick={() => setCurrentStage("stage2")}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentStage === "stage2"
              ? "bg-amber-500 text-neutral-950 shadow-md font-black"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Stage 2: Mega Quiz</span>
          {!passStatus.eligibleForRound2 && (
            <Lock className="w-3.5 h-3.5 text-neutral-400" />
          )}
        </button>
      </div>

      {/* STAGE 1 CARD: 2-MINUTE POST-REGISTRATION QUIZ */}
      {currentStage === "stage1" && (
        <div className="bg-gradient-to-b from-amber-950/40 via-neutral-900 to-neutral-900 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-lg">
            पोस्ट-रजिस्ट्रेशन क्विज (5 आसान प्रश्न)
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  Stage 1: 2-Minute AI Awareness Quiz
                </h3>
                <p className="text-xs text-amber-300/90 font-medium">
                  5 सरल प्रश्न • AI जागरूकता व BMB Educom के बारे में
                </p>
              </div>
            </div>

            <div className="text-right flex items-center sm:block gap-3">
              <span className="text-xs text-neutral-400 block">समय सीमा:</span>
              <span className="text-base font-black text-amber-400 font-mono">2 मिनट (120s)</span>
            </div>
          </div>

          {/* Rules & Rewards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-xs text-neutral-300">
            <div className="bg-neutral-950/70 border border-neutral-800 p-3.5 rounded-xl flex items-start gap-2.5">
              <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block text-sm">Top 10 विजेताओं को फ्री पास:</strong>
                <span>कम से कम समय में अधिकतम सही उत्तर देने वाले 10 छात्रों को <strong>₹500/- का AI Seminar Pass बिल्कुल मुफ्त</strong> मिलेगा।</span>
              </div>
            </div>

            <div className="bg-neutral-950/70 border border-neutral-800 p-3.5 rounded-xl flex items-start gap-2.5">
              <Gift className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block text-sm">अन्य सभी के लिए विशेष ऑफर:</strong>
                <span>क्विज में न जीतने वाले छात्रों को ₹500/- का पास <strong>मात्र ₹199/- में</strong> मिलेगा (₹301/- की छूट)।</span>
              </div>
            </div>
          </div>

          {/* Real-time Pass Counter */}
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl p-3 mb-6 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <Users className="w-4 h-4 text-amber-400" />
              <span>कुल पास धारक छात्र (2-Minute Pass Holders):</span>
            </div>
            <span className="font-black text-amber-400 text-sm">
              {passStatus.totalPassHoldersCount > 0 ? passStatus.totalPassHoldersCount : 12}+ छात्र
            </span>
          </div>

          {/* Start Stage 1 Button */}
          <button
            id="btn-start-stage1-quiz"
            onClick={handleStartRound1}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 text-sm sm:text-base cursor-pointer transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span>क्विज लोड हो रहा है...</span>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-neutral-950" />
                <span>2-मिनट AI अवेयरनेस क्विज शुरू करें (Start 5 Qs Quiz)</span>
                <ArrowRight className="w-5 h-5 ml-auto" />
              </>
            )}
          </button>
        </div>
      )}

      {/* STAGE 2 CARD: 5-MINUTE MEGA SEMINAR QUIZ */}
      {currentStage === "stage2" && (
        <div className="bg-gradient-to-b from-purple-950/40 via-neutral-900 to-neutral-900 border-2 border-purple-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          <div className="absolute -top-3 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-lg">
            20 नकद व स्कॉलरशिप विजेता (Stage 2)
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  Stage 2: Mega AI Seminar Scholarship Quiz
                </h3>
                <p className="text-xs text-purple-300/90 font-medium">
                  10 उन्नत AI प्रश्न • 5 मिनट • BMB AI Seminar Pass धारकों के लिए
                </p>
              </div>
            </div>

            <div className="text-right flex items-center sm:block gap-3">
              <span className="text-xs text-neutral-400 block">अवधि:</span>
              <span className="text-base font-black text-purple-400 font-mono">5 मिनट (300s)</span>
            </div>
          </div>

          {/* 20 Winners Prize Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-neutral-950/80 border border-neutral-800 p-4 rounded-2xl mb-6 text-left">
            <div className="bg-neutral-900/60 p-3 rounded-xl border border-amber-500/40">
              <div className="text-[11px] text-amber-400 font-bold mb-1">🥇 1st Rank Champion</div>
              <div className="text-sm font-black text-emerald-400">₹3,000/- नकद</div>
              <div className="text-xs text-purple-300">+ ₹10,000/- स्कॉलरशिप</div>
            </div>

            <div className="bg-neutral-900/60 p-3 rounded-xl border border-slate-500/40">
              <div className="text-[11px] text-slate-300 font-bold mb-1">🥈 2nd Rank Winner</div>
              <div className="text-sm font-black text-emerald-400">₹2,000/- नकद</div>
              <div className="text-xs text-purple-300">+ ₹8,000/- स्कॉलरशिप</div>
            </div>

            <div className="bg-neutral-900/60 p-3 rounded-xl border border-amber-700/40">
              <div className="text-[11px] text-amber-600 font-bold mb-1">🥉 3rd Rank Winner</div>
              <div className="text-sm font-black text-emerald-400">₹1,500/- नकद</div>
              <div className="text-xs text-purple-300">+ ₹5,000/- स्कॉलरशिप</div>
            </div>

            <div className="bg-neutral-900/60 p-3 rounded-xl border border-purple-500/40">
              <div className="text-[11px] text-purple-300 font-bold mb-1">🎁 Ranks 4-20 (17 छात्र)</div>
              <div className="text-xs font-bold text-white">आकर्षक उपहार</div>
              <div className="text-xs text-purple-300">+ ₹1,000/- स्कॉलरशिप</div>
            </div>
          </div>

          {/* Terms & Validity Box */}
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl p-3.5 mb-6 text-xs text-neutral-300 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>नियम व वैधता (Strict Rules):</span>
            </div>
            <div>• स्कॉलरशिप केवल <strong>15 दिनों तक मान्य</strong> होगी (From Date of BMB EDUCOM AI SEMINAR)।</div>
            <div>• नियम व शर्तें लागू: कोर्स का शुल्क डिस्काउंट राशि के बराबर नहीं होगा।</div>
            <div>• सभी अन्य प्रतिभागियों को <strong>₹500/- स्कॉलरशिप + ई-सर्टिफिकेट</strong> मिलेगा।</div>
          </div>

          {/* Unlocked / Locked State Check */}
          {passStatus.eligibleForRound2 ? (
            passStatus.isStage2Active ? (
              <div>
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 mb-4 flex items-center justify-between gap-2 text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold">
                      ✓ सेमिनार पास सत्यापित ({passStatus.isTop10Winner ? "Top 10 Free Pass विजेता" : "₹199 Paid Pass"}) • स्टेज 2 लाइव है!
                    </span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-black border border-emerald-500/40">
                    ● LIVE NOW
                  </span>
                </div>

                <button
                  id="btn-start-stage2-quiz"
                  onClick={handleStartRound2}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-purple-600/30 text-sm sm:text-base cursor-pointer transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>क्विज लोड हो रहा है...</span>
                  ) : (
                    <>
                      <Trophy className="w-5 h-5 text-amber-300 animate-bounce" />
                      <span>Stage 2 Mega Quiz शुरू करें (10 Questions | 5 Mins)</span>
                      <ArrowRight className="w-5 h-5 ml-auto" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-neutral-950/90 border border-purple-500/40 rounded-2xl p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto ring-4 ring-purple-500/10">
                  <Lock className="w-6 h-6" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold mb-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>एडमिन नियंत्रण (Admin Controlled Stage 2)</span>
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Stage 2 Mega Quiz अभी एडमिन नियंत्रण में लॉक है
                  </h4>
                  <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed mt-1">
                    BMB EDUCOM सेमिनार के दौरान मुख्य मंच से एडमिन द्वारा Stage 2 को लाइव चालू किया जाएगा। आपका सेमिनार पास सत्यापित है!
                  </p>
                </div>

                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 max-w-sm mx-auto flex items-center justify-center gap-2 text-xs text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    ✓ सेमिनार पास मान्य ({passStatus.isTop10Winner ? "Top 10 Free Pass" : "₹199 Paid Pass"})
                  </span>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => refreshPassStatus(true)}
                    disabled={isCheckingStatus}
                    className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center justify-center gap-2 cursor-pointer border border-neutral-700"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isCheckingStatus ? "animate-spin" : ""}`} />
                    <span>{isCheckingStatus ? "जाँच हो रही है..." : "लाइव स्थिति रिफ्रेश करें (Check If Live)"}</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="bg-neutral-950/90 border border-amber-500/30 rounded-2xl p-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                BMB AI Seminar Pass आवश्यक है
              </h4>
              <p className="text-xs text-neutral-400 mb-4 max-w-md mx-auto leading-relaxed">
                Stage 2 Mega Quiz केवल सेमिनार पास धारकों के लिए है। Stage 1 के Top 10 विजेताओं को पास मुफ्त मिला है, अथवा आप मात्र ₹199/- (₹500/- की जगह) में पास प्राप्त कर सकते हैं।
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentStage("stage1")}
                  className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Stage 1 (2-Min Quiz) देकर फ्री पास जीतें</span>
                </button>

                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <QrCode className="w-4 h-4" />
                  <span>सीधे ₹199 में पास प्राप्त करें (UPI QR)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment & Screenshot Modal */}
      {participantToken && (
        <SeminarPassPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          participant={participant}
          participantToken={participantToken}
          totalPassHoldersCount={passStatus.totalPassHoldersCount}
          onPassGranted={pass => {
            setPassStatus(prev => ({
              ...prev,
              hasPass: true,
              eligibleForRound2: true,
              pass,
              totalPassHoldersCount: prev.totalPassHoldersCount + 1
            }));
          }}
        />
      )}
    </div>
  );
};
