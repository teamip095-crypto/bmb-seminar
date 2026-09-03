/**
 * Scholarship Quiz Service
 * 20-question AI scholarship quiz with 10-min timer.
 * Prizes: Rank 1 = ₹1000, Rank 2 = ₹500, Rank 3 = ₹200, Ranks 4-10 = attractive gift.
 * State persisted to Supabase Postgres (scholarship_attempts + scholarship_winners tables).
 */
import { query, isPostgresConfigured } from "../db/supabase-client";
import { SEED_SCHOLARSHIP_QUESTION_BANK } from "../ai/scholarship-question-bank-seed";
import {
  ScholarshipAttempt,
  ScholarshipWinner,
  ScholarshipQuestionClient,
  ScholarshipSubmissionResponse
} from "../db/schema";

const QUIZ_DURATION_SECONDS = 10 * 60; // 10 minutes
const TOTAL_QUESTIONS = 20;
const WINNER_COUNT = 10; // Top 10 are winners (1st/2nd/3rd cash, 4-10 attractive gift)

// Prize tiers — 1-indexed ranks
const PRIZE_TIERS: Record<number, { type: "cash" | "gift"; amount: number; label: string }> = {
  1: { type: "cash", amount: 1000, label: "₹1000 Cash Prize" },
  2: { type: "cash", amount: 500, label: "₹500 Cash Prize" },
  3: { type: "cash", amount: 200, label: "₹200 Cash Prize" },
  4: { type: "gift", amount: 0, label: "आकर्षक उपहार (Attractive Gift)" },
  5: { type: "gift", amount: 0, label: "आकर्षक उपहार (Attractive Gift)" },
  6: { type: "gift", amount: 0, label: "आकर्षक उपहार (Attractive Gift)" },
  7: { type: "gift", amount: 0, label: "आकर्षक उपहार (Attractive Gift)" },
  8: { type: "gift", amount: 0, label: "आकर्षक उपहार (Attractive Gift)" },
  9: { type: "gift", amount: 0, label: "आकर्षक उपहार (Attractive Gift)" },
  10: { type: "gift", amount: 0, label: "आकर्षक उपहार (Attractive Gift)" }
};

export class ScholarshipService {
  /** Start a new attempt — participant must already have a registration. */
  public static async startAttempt(params: {
    participantId: string;
    participantName?: string;
    participantPhone?: string;
    participantCity?: string;
  }): Promise<{
    attemptId: string;
    questions: ScholarshipQuestionClient[];
    startedAt: string;
    expiresAt: string;
    remainingSeconds: number;
    totalQuestions: number;
  }> {
    const attemptId = `satt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + QUIZ_DURATION_SECONDS * 1000);

    // Check if participant already has a submitted attempt — only one attempt per participant
    if (isPostgresConfigured()) {
      const existing = await query(
        `SELECT id, score FROM scholarship_attempts
         WHERE participant_id = $1 AND status IN ('submitted', 'timeout_auto_submitted')
         ORDER BY submitted_at DESC LIMIT 1`,
        [params.participantId]
      );
      if (existing && existing.rows.length > 0) {
        const row = existing.rows[0] as any;
        throw new Error(`ALREADY_COMPLETED:${row.score}`);
      }
    }

    // Insert attempt row
    if (isPostgresConfigured()) {
      const result = await query(
        `INSERT INTO scholarship_attempts
          (id, participant_id, participant_name, participant_phone, participant_city,
           started_at, expires_at, score, total_questions, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, 'in_progress')
         RETURNING id`,
        [
          attemptId, params.participantId, params.participantName, params.participantPhone, params.participantCity,
          startedAt.toISOString(), expiresAt.toISOString(), TOTAL_QUESTIONS
        ]
      );
      if (result === null) {
        throw new Error("Failed to create scholarship attempt — Postgres unavailable");
      }
    }

    // Build question list (same 20 for every participant — no randomization since questions are fixed)
    const questions: ScholarshipQuestionClient[] = SEED_SCHOLARSHIP_QUESTION_BANK.map((q, idx) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      questionNumber: idx + 1,
      totalQuestions: TOTAL_QUESTIONS
    }));

    return {
      attemptId,
      questions,
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      remainingSeconds: QUIZ_DURATION_SECONDS,
      totalQuestions: TOTAL_QUESTIONS
    };
  }

  /** Submit attempt — score, persist, compute rank/prize. */
  public static async submitAttempt(params: {
    attemptId: string;
    participantId: string;
    answers: { question_id: string; selected_option: number }[];
    isAutoSubmit: boolean;
  }): Promise<ScholarshipSubmissionResponse> {
    // Fetch attempt to validate
    if (!isPostgresConfigured()) {
      throw new Error("Scholarship quiz requires Postgres (not available)");
    }

    const attemptRes = await query(
      `SELECT id, participant_id, started_at, expires_at, status FROM scholarship_attempts WHERE id = $1`,
      [params.attemptId]
    );
    if (!attemptRes || attemptRes.rows.length === 0) {
      throw new Error("Attempt not found");
    }
    const attemptRow = attemptRes.rows[0] as any;

    if (attemptRow.participant_id !== params.participantId) {
      throw new Error("Attempt does not belong to this participant");
    }
    if (attemptRow.status === "submitted" || attemptRow.status === "timeout_auto_submitted") {
      throw new Error(`ALREADY_SUBMITTED`);
    }

    // Score the answers server-side
    const questionMap = new Map(SEED_SCHOLARSHIP_QUESTION_BANK.map(q => [q.id, q]));
    let score = 0;
    const review: ScholarshipSubmissionResponse["review"] = [];
    const answersJson: { questionId: string; selectedOption: number; isCorrect: boolean }[] = [];

    for (const ans of params.answers) {
      const q = questionMap.get(ans.question_id);
      if (!q) {
        // Unknown question — skip but mark incorrect
        review.push({
          id: ans.question_id,
          question: "(unknown question)",
          options: [],
          correctOption: -1,
          selectedOption: ans.selected_option,
          isCorrect: false,
          explanation: "Question not found in scholarship bank"
        });
        answersJson.push({ questionId: ans.question_id, selectedOption: ans.selected_option, isCorrect: false });
        continue;
      }
      const isCorrect = ans.selected_option === q.correct_option;
      if (isCorrect) score += 1;
      review.push({
        id: q.id,
        question: q.question,
        options: q.options,
        correctOption: q.correct_option,
        selectedOption: ans.selected_option,
        isCorrect,
        explanation: q.explanation
      });
      answersJson.push({ questionId: q.id, selectedOption: ans.selected_option, isCorrect });
    }

    // Cap duration at QUIZ_DURATION_SECONDS (server-authoritative)
    const submittedAt = new Date();
    const startedAt = new Date(attemptRow.started_at);
    const rawDuration = Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000);
    const durationSeconds = Math.max(1, Math.min(rawDuration, QUIZ_DURATION_SECONDS));

    const newStatus = params.isAutoSubmit ? "timeout_auto_submitted" : "submitted";

    // Persist submission
    await query(
      `UPDATE scholarship_attempts
       SET submitted_at = $1, duration_seconds = $2, score = $3, status = $4,
           answers_json = $5, updated_at = NOW()
       WHERE id = $6`,
      [submittedAt.toISOString(), durationSeconds, score, newStatus, JSON.stringify(answersJson), params.attemptId]
    );

    // Compute rank — count how many attempts have higher score (or same score with faster time)
    const rankRes = await query(
      `SELECT COUNT(*) + 1 AS rank
       FROM scholarship_attempts a
       WHERE a.status IN ('submitted', 'timeout_auto_submitted')
         AND a.participant_id != $1
         AND (
           a.score > $2
           OR (a.score = $2 AND a.duration_seconds < $3)
         )`,
      [params.participantId, score, durationSeconds]
    );
    const rank = rankRes && rankRes.rows.length > 0
      ? parseInt((rankRes.rows[0] as any).rank, 10)
      : 1;

    // If rank is 1-10, record the winner
    let prizeWon: { type: "cash" | "gift"; amount: number; label: string } | undefined;
    if (rank >= 1 && rank <= WINNER_COUNT) {
      const tier = PRIZE_TIERS[rank];
      const winnerId = `sw-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      // Get participant info
      const partRes = await query(
        `SELECT participant_name, participant_phone, participant_city FROM scholarship_attempts WHERE id = $1`,
        [params.attemptId]
      );
      const partRow = partRes && partRes.rows.length > 0 ? partRes.rows[0] as any : {};

      // Insert winner (ON CONFLICT in case of duplicate ranking race)
      await query(
        `INSERT INTO scholarship_winners
          (id, attempt_id, participant_id, participant_name, participant_phone, participant_city,
           rank, prize_type, prize_amount, prize_label, score, duration_seconds, awarded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         ON CONFLICT (attempt_id, rank) DO NOTHING`,
        [
          winnerId, params.attemptId, params.participantId,
          partRow.participant_name, partRow.participant_phone, partRow.participant_city,
          rank, tier.type, tier.amount, tier.label, score, durationSeconds
        ]
      );
      prizeWon = tier;
    }

    return {
      attemptId: params.attemptId,
      score,
      totalQuestions: TOTAL_QUESTIONS,
      durationSeconds,
      resultStatus: score >= 12 ? "passed" : "participated", // 60% passing
      rank,
      prizeWon,
      review
    };
  }

  /** Get all submitted attempts ranked by score (desc) then duration (asc). */
  public static async getLeaderboard(limit: number = 50): Promise<ScholarshipAttempt[]> {
    if (!isPostgresConfigured()) return [];
    const res = await query(
      `SELECT id, participant_id, participant_name, participant_phone, participant_city,
              started_at, expires_at, submitted_at, duration_seconds, score, total_questions, status
       FROM scholarship_attempts
       WHERE status IN ('submitted', 'timeout_auto_submitted')
       ORDER BY score DESC, duration_seconds ASC
       LIMIT $1`,
      [limit]
    );
    if (!res) return [];
    return res.rows.map((r: any) => ({
      id: r.id,
      participant_id: r.participant_id,
      participant_name: r.participant_name || undefined,
      participant_phone: r.participant_phone || undefined,
      participant_city: r.participant_city || undefined,
      started_at: new Date(r.started_at).toISOString(),
      expires_at: new Date(r.expires_at).toISOString(),
      submitted_at: r.submitted_at ? new Date(r.submitted_at).toISOString() : undefined,
      duration_seconds: r.duration_seconds || undefined,
      score: r.score,
      total_questions: r.total_questions,
      status: r.status,
      answers: [],
      created_at: new Date(r.started_at).toISOString(),
      updated_at: (r.submitted_at ? new Date(r.submitted_at) : new Date(r.started_at)).toISOString()
    }));
  }

  /** Get all winners ranked 1-10 for ticker / display. */
  public static async getWinners(limit: number = 10): Promise<ScholarshipWinner[]> {
    if (!isPostgresConfigured()) return [];
    const res = await query(
      `SELECT id, attempt_id, participant_id, participant_name, participant_phone, participant_city,
              rank, prize_type, prize_amount, prize_label, score, duration_seconds, awarded_at, created_at
       FROM scholarship_winners
       ORDER BY rank ASC, awarded_at DESC
       LIMIT $1`,
      [limit]
    );
    if (!res) return [];
    return res.rows.map((r: any) => ({
      id: r.id,
      attempt_id: r.attempt_id,
      participant_id: r.participant_id,
      participant_name: r.participant_name || "",
      participant_phone: r.participant_phone || undefined,
      participant_city: r.participant_city || undefined,
      rank: r.rank,
      prize_type: r.prize_type,
      prize_amount: r.prize_amount,
      prize_label: r.prize_label,
      score: r.score,
      duration_seconds: r.duration_seconds || undefined,
      awarded_at: new Date(r.awarded_at).toISOString(),
      created_at: new Date(r.created_at).toISOString()
    }));
  }

  /** Check if a participant already submitted (used for front-end guard). */
  public static async hasParticipantSubmitted(participantId: string): Promise<{ submitted: boolean; score?: number }> {
    if (!isPostgresConfigured()) return { submitted: false };
    const res = await query(
      `SELECT score FROM scholarship_attempts
       WHERE participant_id = $1 AND status IN ('submitted', 'timeout_auto_submitted')
       ORDER BY submitted_at DESC LIMIT 1`,
      [participantId]
    );
    if (!res || res.rows.length === 0) return { submitted: false };
    return { submitted: true, score: (res.rows[0] as any).score };
  }
}
