import React, { useState, useEffect, useRef } from "react";
import {
  Award, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight, ArrowLeft,
  Trophy, Sparkles, Zap, RotateCcw, ShieldAlert, Gift, IndianRupee, Medal
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  ParticipantProfile,
  ScholarshipAttemptStartResponse,
  ScholarshipSubmissionResponse,
  ScholarshipQuestionClient
} from "../types";

interface ScholarshipQuizViewProps {
  participant: ParticipantProfile | null;
  participantToken: string | null;
  onGoToRegistration: () => void;
  onGoToLeaderboard: () => void;
}

export const ScholarshipQuizView: React.FC<ScholarshipQuizViewProps> = ({
  participant,
  participantToken,
  onGoToRegistration,
  onGoToLeaderboard
}) => {
  const [attemptData, setAttemptData] = useState<ScholarshipAttemptStartResponse | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(10 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ScholarshipSubmissionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [alreadyCompletedScore, setAlreadyCompletedScore] = useState<number | null>(null);

  // Start scholarship quiz attempt
  const handleStartQuiz = async () => {
    if (!participantToken) {
      setErrorMessage("कृपया स्कॉलरशिप क्विज़ शुरू करने से पहले सेमिनार के लिए पंजीकरण करें।");
      return;
    }

    setIsStarting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/scholarship-quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_token: participantToken })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.alreadyCompleted) {
          setAlreadyCompletedScore(data.score ?? 0);
          setErrorMessage(`आप स्कॉलरशिप क्विज़ पहले ही पूरा कर चुके हैं। आपका स्कोर: ${data.score}/20. लीडरबोर्ड देखें।`);
        } else {
          throw new Error(data.error || "स्कॉलरशिप क्विज़ शुरू करने में त्रुटि हुई।");
        }
        return;
      }

      setAttemptData(data);
      setRemainingSeconds(data.remainingSeconds || 600);
    } catch (err: any) {
      setErrorMessage(err.message || "स्कॉलरशिप क्विज़ शुरू करने में विफलता।");
    } finally {
      setIsStarting(false);
    }
  };

  // Synchronized 10-minute countdown timer
  useEffect(() => {
    if (!attemptData || submissionResult) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attemptData, submissionResult, selectedAnswers]);

  const handleAutoSubmit = async () => {
    if (!attemptData || !participantToken || isSubmitting) return;
    setIsSubmitting(true);

    const answersPayload = attemptData.questions.map(q => ({
      question_id: q.id,
      selected_option: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1
    }));

    try {
      const res = await fetch("/api/scholarship-quiz/submit", {
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
      if (data.prizeWon) {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      } else if (data.score >= 12) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error("Scholarship auto-submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!attemptData || !participantToken) return;
    setIsSubmitting(true);

    const answersPayload = attemptData.questions.map(q => ({
      question_id: q.id,
      selected_option: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1
    }));

    try {
      const res = await fetch("/api/scholarship-quiz/submit", {
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
        throw new Error(data.error || "स्कॉलरशिप क्विज़ सबमिशन विफल रहा।");
      }

      setSubmissionResult(data);
      if (data.prizeWon) {
        confetti({ particleCount: 250, spread: 120, origin: { y: 0.6 } });
      } else if (data.score >= 12) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Not registered state
  if (!participant) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center mx-auto mb-4 text-purple-400">
          <Gift className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          ₹1000 स्कॉलरशिप क्विज़
        </h2>
        <p className="text-sm text-neutral-300 mb-6">
          20 AI प्रश्न • 10 मिनट • ₹1000 + ₹500 + ₹200 + 7 आकर्षक उपहार
        </p>
        <p className="text-sm text-neutral-400 mb-6">
          स्कॉलरशिप क्विज़ खेलने के लिए कृपया पहले सेमिनार रजिस्ट्रेशन करें।
        </p>
        <button
          onClick={onGoToRegistration}
          className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-6 rounded-xl inline-flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
        >
          <span>निःशुल्क रजिस्ट्रेशन करें</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Already completed
  if (alreadyCompletedScore !== null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto mb-4 text-amber-400">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          स्कॉलरशिप क्विज़ पूरा हो चुका है
        </h2>
        <p className="text-sm text-neutral-300 mb-6">
          आपका स्कोर: <strong className="text-amber-300">{alreadyCompletedScore}/20</strong>
        </p>
        <button
          onClick={onGoToLeaderboard}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold py-3.5 px-6 rounded-xl inline-flex items-center justify-center gap-2 shadow-lg cursor-pointer text-sm"
        >
          <Trophy className="w-5 h-5" />
          <span>लीडरबोर्ड देखें</span>
        </button>
      </div>
    );
  }

  // Pre-Quiz intro screen
  if (!attemptData && !submissionResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-gradient-to-br from-purple-950/40 via-neutral-900 to-amber-950/40 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              ₹1000 स्कॉलरशिप क्विज़
            </h2>
            <p className="text-xs text-purple-300/80 mb-4">
              BMB Educom AI Scholarship Quiz — 20 Questions • 10 Minutes
            </p>
          </div>

          {/* Prize Tier Card */}
          <div className="bg-neutral-950/80 border border-purple-500/30 rounded-2xl p-4 sm:p-6 mb-6">
            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Medal className="w-4 h-4" />
              इनाम राशि (Prize Tiers)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-yellow-950/40 border border-yellow-500/40 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">🥇</div>
                <div className="text-xs font-bold text-yellow-400 uppercase">1st Prize</div>
                <div className="text-xl font-black text-yellow-300 flex items-center justify-center gap-1 mt-1">
                  <IndianRupee className="w-4 h-4" />1000
                </div>
                <div className="text-[10px] text-yellow-200/70 mt-1">Cash Prize</div>
              </div>
              <div className="bg-gray-950/40 border border-gray-400/40 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">🥈</div>
                <div className="text-xs font-bold text-gray-300 uppercase">2nd Prize</div>
                <div className="text-xl font-black text-gray-200 flex items-center justify-center gap-1 mt-1">
                  <IndianRupee className="w-4 h-4" />500
                </div>
                <div className="text-[10px] text-gray-300/70 mt-1">Cash Prize</div>
              </div>
              <div className="bg-orange-950/40 border border-orange-700/40 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">🥉</div>
                <div className="text-xs font-bold text-orange-400 uppercase">3rd Prize</div>
                <div className="text-xl font-black text-orange-300 flex items-center justify-center gap-1 mt-1">
                  <IndianRupee className="w-4 h-4" />200
                </div>
                <div className="text-[10px] text-orange-200/70 mt-1">Cash Prize</div>
              </div>
            </div>
            <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 text-center">
              <div className="text-xs text-purple-300 font-semibold flex items-center justify-center gap-2">
                <Gift className="w-4 h-4 text-purple-400" />
                Rank 4 से 10 तक: आकर्षक उपहार (Attractive Gift)
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4 mb-6 space-y-2 text-xs text-neutral-300">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">20 प्रश्न</strong> AI, ML, Deep Learning, Generative AI, NLP, Computer Vision व अन्य AI विषयों पर आधारित</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">10 मिनट</strong> का समय सीमित — टाइमर 00:00 पर ऑटो-सबमिट</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">केवल 1 प्रयास</strong> प्रति प्रतिभागी — पहले से पंजीकृत होना आवश्यक</span>
            </div>
            <div className="flex items-start gap-2">
              <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">रैंकिंग:</strong> अधिकांश सही उत्तर → कम समय (Tie-breaker)</span>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3 mb-4 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            onClick={handleStartQuiz}
            disabled={isStarting}
            className="w-full bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-white font-extrabold py-4 px-6 rounded-xl inline-flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? (
              <span className="animate-pulse">स्कॉलरशिप क्विज़ शुरू हो रहा है...</span>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>₹1000 स्कॉलरशिप क्विज़ शुरू करें</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Post-Quiz Submission Review Screen
  if (submissionResult) {
    const wonPrize = !!submissionResult.prizeWon;
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            wonPrize ? "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/40" : "bg-amber-500/20 border border-amber-500/50 text-amber-400"
          }`}>
            {wonPrize ? <Trophy className="w-10 h-10 text-neutral-950" /> : <Trophy className="w-9 h-9" />}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
            स्कॉलरशिप क्विज़ रिपोर्ट
          </h2>
          <p className="text-xs text-neutral-400 mb-6">
            BMB Educom AI Scholarship Quiz — Official Evaluation
          </p>

          {/* Prize Won Banner */}
          {wonPrize && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/60 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Medal className="w-8 h-8 text-yellow-400" />
                <span className="text-lg font-black text-yellow-300 uppercase tracking-wider">
                  बधाई हो! 🎉
                </span>
              </div>
              <div className="text-2xl font-black text-white mb-1">
                Rank #{submissionResult.rank} • {submissionResult.prizeWon?.label}
              </div>
              <div className="text-xs text-yellow-200/80">
                आप टॉप 10 विजेताओं में शामिल हैं!
              </div>
            </div>
          )}

          {/* Score Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 mb-6 inline-block w-full max-w-sm">
            <div className="text-5xl font-black text-amber-400 font-mono mb-1">
              {submissionResult.score} / {submissionResult.totalQuestions}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              {submissionResult.score >= 12 ? "🌟 उत्कृष्ट प्रदर्शन (Passed)" : "👍 सक्रिय सहभागिता (Participated)"}
            </div>
            <div className="text-[11px] text-neutral-400 mt-2">
              कुल समय: <strong>{submissionResult.durationSeconds} सेकंड</strong>
              {submissionResult.rank && (
                <span className="ml-2">| रैंक: <strong className="text-amber-300">#{submissionResult.rank}</strong></span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
            <button
              onClick={onGoToLeaderboard}
              className="bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-white font-extrabold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 text-sm cursor-pointer"
            >
              <Trophy className="w-5 h-5" />
              <span>स्कॉलरशिप लीडरबोर्ड देखें</span>
            </button>
          </div>

          {/* Question-by-Question Review */}
          {submissionResult.review && (
            <div className="text-left border-t border-neutral-800 pt-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                स्कॉलरशिप क्विज़ समीक्षा (Detailed Review — {submissionResult.review.length} प्रश्न)
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {submissionResult.review.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border ${
                      item.isCorrect
                        ? "bg-emerald-950/20 border-emerald-500/40"
                        : "bg-red-950/20 border-red-500/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-purple-400">
                        प्रश्न {idx + 1} / {submissionResult.totalQuestions}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.isCorrect ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                      }`}>
                        {item.isCorrect ? "सही" : "गलत"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white mb-2">
                      {item.question}
                    </p>
                    <div className="space-y-1 text-xs">
                      {item.options.map((opt, oIdx) => {
                        const isCorrectOption = oIdx === item.correctOption;
                        const isUserSelected = oIdx === item.selectedOption;
                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg border flex items-center justify-between ${
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
                    {item.explanation && (
                      <p className="text-[11px] text-neutral-400 mt-2 italic">
                        💡 {item.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active Quiz Taking UI
  if (!attemptData) return null;

  const currentQuestion: ScholarshipQuestionClient | undefined = attemptData.questions[currentQIndex];
  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-400">प्रश्न लोड नहीं हो सका।</p>
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const isLastQuestion = currentQIndex === attemptData.questions.length - 1;
  const progressPercent = Math.round((answeredCount / attemptData.questions.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Bar — Timer + Progress */}
      <div className="bg-neutral-900 border border-purple-500/30 rounded-2xl p-4 mb-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
            <Gift className="w-4 h-4 text-purple-400" />
            <span>स्कॉलरशिप क्विज़ ₹1000</span>
          </div>
          <div className={`flex items-center gap-1.5 font-mono font-bold text-base sm:text-lg ${
            remainingSeconds < 60 ? "text-red-400 animate-pulse" : remainingSeconds < 180 ? "text-amber-400" : "text-emerald-400"
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
          <span>प्रश्न {currentQIndex + 1} / {attemptData.questions.length}</span>
          <span>उत्तर दिए: {answeredCount} / {attemptData.questions.length} ({progressPercent}%)</span>
        </div>
        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-amber-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Current Question */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 mb-4 shadow-2xl">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {currentQIndex + 1}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
            {currentQuestion.question}
          </h2>
        </div>

        <div className="space-y-2">
          {currentQuestion.options.map((opt, oIdx) => {
            const isSelected = selectedAnswers[currentQuestion.id] === oIdx;
            return (
              <button
                key={oIdx}
                onClick={() => handleSelectOption(currentQuestion.id, oIdx)}
                className={`w-full p-3 sm:p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-purple-500/20 border-purple-500 text-purple-100 font-semibold shadow-md"
                    : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-purple-500/40 hover:bg-neutral-900"
                }`}
              >
                <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
          disabled={currentQIndex === 0}
          className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold py-3 px-5 rounded-xl inline-flex items-center gap-2 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>पिछला</span>
        </button>

        {!isLastQuestion ? (
          <button
            onClick={() => setCurrentQIndex(Math.min(attemptData.questions.length - 1, currentQIndex + 1))}
            className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-5 rounded-xl inline-flex items-center gap-2 text-sm cursor-pointer"
          >
            <span>अगला</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleManualSubmit}
            disabled={isSubmitting || answeredCount === 0}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold py-3 px-6 rounded-xl inline-flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            {isSubmitting ? (
              <span className="animate-pulse">जमा हो रहा है...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>अंतिम सबमिट करें</span>
              </>
            )}
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mt-4 bg-red-950/40 border border-red-500/40 rounded-xl p-3 text-xs text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
