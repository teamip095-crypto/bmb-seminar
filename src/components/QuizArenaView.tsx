import React, { useState, useEffect } from "react";
import { ParticipantProfile, QuizAttemptStartResponse, QuizSubmissionResponse } from "../types";
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Sparkles,
  Zap,
  RotateCcw,
  ShieldAlert
} from "lucide-react";
import confetti from "canvas-confetti";

interface QuizArenaViewProps {
  participant: ParticipantProfile | null;
  participantToken: string | null;
  onGoToRegistration: () => void;
  onGoToLeaderboard: () => void;
}

export const QuizArenaView: React.FC<QuizArenaViewProps> = ({
  participant,
  participantToken,
  onGoToRegistration,
  onGoToLeaderboard
}) => {
  const [attemptData, setAttemptData] = useState<QuizAttemptStartResponse | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(120);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Start quiz attempt
  const handleStartQuiz = async () => {
    if (!participantToken) {
      setErrorMessage("कृपया क्विज शुरू करने से पहले सेमिनार के लिए पंजीकरण करें।");
      return;
    }

    setIsStarting(true);
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
          setErrorMessage(`आप इस सेमिनार का क्विज पहले ही पूरा कर चुके हैं। आपका स्कोर: ${data.score}/4. लीडरबोर्ड देखें।`);
        } else {
          throw new Error(data.error || "क्विज शुरू करने में त्रुटि हुई।");
        }
        return;
      }

      setAttemptData(data);
      setRemainingSeconds(data.remainingSeconds || 120);
    } catch (err: any) {
      setErrorMessage(err.message || "क्विज शुरू करने में विफलता।");
    } finally {
      setIsStarting(false);
    }
  };

  // Synchronized 120-second Countdown Timer
  useEffect(() => {
    if (!attemptData || submissionResult) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit on 00:00 timeout
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attemptData, submissionResult, selectedAnswers]);

  // Auto-submit on timeout
  const handleAutoSubmit = async () => {
    if (!attemptData || !participantToken || isSubmitting) return;
    setIsSubmitting(true);

    const answersPayload = attemptData.questions.map(q => ({
      quiz_question_id: q.id,
      selected_option: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1
    }));

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: attemptData.attemptId,
          participant_token: participantToken,
          answers: answersPayload,
          is_auto_submit: true
        })
      });
      const data = await res.json();
      setSubmissionResult(data);
      if (data.score >= 3) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error("Auto-submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual submit
  const handleManualSubmit = async () => {
    if (!attemptData || !participantToken) return;
    setIsSubmitting(true);

    const answersPayload = attemptData.questions.map(q => ({
      quiz_question_id: q.id,
      selected_option: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : 0
    }));

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: attemptData.attemptId,
          participant_token: participantToken,
          answers: answersPayload,
          is_auto_submit: false
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "क्विज सबमिशन विफल रहा।");
      }

      setSubmissionResult(data);
      if (data.score >= 3) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      setErrorMessage(err.message || "सबमिशन में त्रुटि हुई।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Format timer MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Not registered state
  if (!participant) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto mb-4 text-amber-400">
          <Award className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          आधिकारिक AI क्विज एरेना
        </h2>
        <p className="text-sm text-neutral-300 mb-6">
          क्विज शुरू करने और लाइव शुक्रवार लीडरबोर्ड पर अपनी रैंक दर्ज करने के लिए कृपया पहले पंजीकरण करें।
        </p>
        <button
          onClick={onGoToRegistration}
          className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-3 px-6 rounded-xl inline-flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <span>निःशुल्क रजिस्ट्रेशन करें</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Post-Quiz Submission Review Screen
  if (submissionResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Trophy className="w-9 h-9" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
            क्विज स्कोर रिपोर्ट
          </h2>
          <p className="text-xs text-neutral-400 mb-6">
            BMB Educom AI Seminar Official Evaluation
          </p>

          {/* Big Score Callout */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 mb-6 inline-block w-full max-w-sm">
            <div className="text-5xl font-black text-amber-400 font-mono mb-1">
              {submissionResult.score} / {submissionResult.totalQuestions}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              {submissionResult.score >= 3 ? "🌟 उत्कृष्ट प्रदर्शन (Passed)" : "👍 सक्रिय सहभागिता (Participated)"}
            </div>
            <div className="text-[11px] text-neutral-400 mt-2">
              कुल समय: <strong>{submissionResult.durationSeconds} सेकंड</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
            <button
              id="btn-view-leaderboard-after-quiz"
              onClick={onGoToLeaderboard}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 text-sm cursor-pointer"
            >
              <Trophy className="w-5 h-5" />
              <span>लाइव शुक्रवार लीडरबोर्ड देखें</span>
            </button>
          </div>

          {/* Question-by-Question Review Breakdown */}
          {submissionResult.review && (
            <div className="text-left border-t border-neutral-800 pt-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                प्रश्नोत्तरी समीक्षा (Detailed Review)
              </h3>

              <div className="space-y-4">
                {submissionResult.review.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border ${
                      item.isCorrect
                        ? "bg-emerald-950/20 border-emerald-500/40"
                        : "bg-red-950/20 border-red-500/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-amber-400">
                        प्रश्न {idx + 1}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.isCorrect ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                      }`}>
                        {item.isCorrect ? "सही (Correct)" : "गलत (Incorrect)"}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-white mb-3">
                      {item.question}
                    </p>

                    <div className="space-y-1.5 text-xs">
                      {item.options.map((opt, oIdx) => {
                        const isCorrectOption = oIdx === item.correctOption;
                        const isUserSelected = oIdx === item.selectedOption;

                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between ${
                              isCorrectOption
                                ? "bg-emerald-900/30 border-emerald-500 text-emerald-200 font-medium"
                                : isUserSelected && !isCorrectOption
                                ? "bg-red-900/30 border-red-500 text-red-200"
                                : "bg-neutral-950 border-neutral-800 text-neutral-400"
                            }`}
                          >
                            <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                            {isCorrectOption && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            {isUserSelected && !isCorrectOption && <XCircle className="w-4 h-4 text-red-400" />}
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

  // Pre-Quiz Introduction Screen
  if (!attemptData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Zap className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            2-Minute AI क्विज चुनौती
          </h2>
          <p className="text-sm text-neutral-300 mb-6">
            प्रतिभागी: <strong className="text-amber-400">{participant.name}</strong> ({participant.registration_id})
          </p>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 text-left mb-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              क्विज के नियम (Quiz Rules)
            </h4>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>कुल प्रश्न: <strong>4 बहुविकल्पीय प्रश्न (MCQs)</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>कुल समय सीमा: <strong>ठीक 2 मिनट (120 सेकंड)</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>00:00 होते ही क्विज स्वतः सबमिट हो जाएगा।</span>
              </li>
              <li className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>स्कोर और गति के आधार पर तुरंत लीडरबोर्ड रैंकिंग तय होगी।</span>
              </li>
            </ul>
          </div>

          <button
            id="btn-start-timed-quiz"
            onClick={handleStartQuiz}
            disabled={isStarting}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-sm sm:text-base shadow-xl shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isStarting ? (
              <span>प्रश्न तैयार किए जा रहे हैं...</span>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>क्विज अभी शुरू करें (Start 120s Timer)</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Active Quiz In-Progress Screen
  const currentQ = attemptData.questions[currentQIndex];
  const isTimeUrgent = remainingSeconds <= 30;
  const isTimeCritical = remainingSeconds <= 10;

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Top Floating Timer Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-neutral-300">
            प्रश्न {currentQIndex + 1} / {attemptData.questions.length}
          </span>
        </div>

        {/* 120s Timer Display */}
        <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl border font-mono font-black text-base sm:text-xl transition-all ${
          isTimeCritical
            ? "bg-red-500/30 border-red-500 text-red-400 animate-bounce"
            : isTimeUrgent
            ? "bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse"
            : "bg-neutral-950 border-neutral-700 text-amber-400"
        }`}>
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>{formatTime(remainingSeconds)}</span>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl mb-4 sm:mb-6">
        <h3 className="text-base sm:text-xl font-bold text-white mb-4 sm:mb-6 leading-snug">
          {currentQ.question}
        </h3>

        {/* 4 Option Cards */}
        <div className="space-y-2.5 sm:space-y-3">
          {currentQ.options.map((optionText, optIdx) => {
            const isSelected = selectedAnswers[currentQ.id] === optIdx;

            return (
              <button
                key={optIdx}
                id={`btn-option-${currentQ.id}-${optIdx}`}
                onClick={() => handleSelectOption(currentQ.id, optIdx)}
                className={`w-full text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-500 text-white font-bold shadow-lg shadow-amber-500/10"
                    : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-850"
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isSelected ? "bg-amber-500 text-neutral-950" : "bg-neutral-800 text-neutral-400"
                  }`}>
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="text-xs sm:text-base leading-snug">{optionText}</span>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation & Submit Bar */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <button
          onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQIndex === 0}
          className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-1.5 disabled:opacity-30 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>पिछला</span>
        </button>

        {currentQIndex < attemptData.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQIndex(prev => Math.min(attemptData.questions.length - 1, prev + 1))}
            className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-1.5 cursor-pointer"
          >
            <span>अगला</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        ) : (
          <button
            id="btn-submit-final-quiz"
            onClick={handleManualSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span>सबमिट हो रहा है...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>सबमिट करें</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
