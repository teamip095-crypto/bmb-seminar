import { z } from "zod";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  whatsapp_number?: string;
  password_hash: string;
  role: "superadmin" | "admin" | "counselor";
  status: "active" | "inactive";
  reset_otp?: string;
  reset_otp_expires_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SeminarEvent {
  id: string;
  event_date: string; // YYYY-MM-DD (Asia/Kolkata)
  start_time: string; // e.g. "11:00"
  end_time: string;   // e.g. "16:00"
  timezone: string;   // "Asia/Kolkata"
  title: string;
  description: string;
  status: "scheduled" | "active" | "completed" | "cancelled" | "rescheduled";
  registration_open: boolean;
  registration_close?: string;
  created_at: string;
  updated_at: string;
}

export interface SeminarRegistration {
  id: string;
  seminar_event_id: string;
  registration_id: string; // e.g. BMB-20260904-A94F
  seat_number?: string; // e.g. BMB-SEAT-001
  name: string;
  full_address: string;
  whatsapp_number: string;
  email?: string;
  education?: string;
  occupation?: string;
  age_group?: string;
  city?: string;
  district?: string;
  whatsapp_consent: boolean;
  display_name: string;
  secure_token_hash: string; // SHA-256 hash of participant token
  created_at: string;
  updated_at: string;
}

export interface QuestionBankItem {
  id: string;
  question: string;
  options: string[]; // exactly 4 options
  correct_option: number; // 0, 1, 2, 3
  category: string;
  difficulty: "easy" | "medium" | "hard";
  language: "hi";
  bmb_grounded: boolean;
  active: boolean;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  seminar_event_id: string;
  participant_id: string;
  attempt_token_hash: string;
  started_at: string;
  expires_at: string;
  submitted_at?: string;
  duration_seconds?: number;
  score?: number;
  status: "in_progress" | "submitted" | "expired" | "timeout_auto_submitted";
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  attempt_id: string;
  question_id: string;
  question_order: number;
  question_snapshot: string;
  options_snapshot: string[];
  correct_option_server_only: number;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  quiz_question_id: string;
  selected_option: number; // 0, 1, 2, 3
  answered_at: string;
}

export interface QuizResult {
  id: string;
  attempt_id: string;
  participant_id: string;
  seminar_event_id: string;
  score: number; // 0 to 4
  duration_seconds: number;
  ranking_position?: number;
  result_status: "passed" | "participated" | "time_out";
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  participant_id: string;
  phone_number: string;
  message_type: "registration_confirmation" | "quiz_link" | "leaderboard_update" | "admission_followup" | "admin_otp_recovery" | "admin_password_updated";
  provider_message_id?: string;
  status: "queued" | "sent" | "delivered" | "read" | "failed" | "pending_configuration";
  error_code?: string;
  error_message?: string;
  message_content: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
}

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Interested"
  | "Follow-up"
  | "Demo/Seminar Attended"
  | "Admission Discussion"
  | "Converted"
  | "Not Interested";

export interface AdmissionLead {
  id: string;
  participant_id: string;
  status: LeadStatus;
  interest: "high" | "medium" | "low" | "general";
  follow_up_date?: string;
  notes: string;
  assigned_to?: string;
  quiz_score?: number;
  created_at: string;
  updated_at: string;
}

export interface BMBKnowledgeBaseItem {
  id: string;
  category: "courses" | "mentorship" | "certifications" | "practical_labs" | "general_info" | "rules";
  title: string;
  content: string;
  verified: boolean;
  active: boolean;
  updated_by: string;
  updated_at: string;
}

export interface SeminarContentScene {
  id: string;
  seminar_event_id?: string;
  scene_number: number;
  title: string;
  narration_script_hi: string;
  captions_hi: string;
  key_takeaways: string[];
  animation_type: "neural_network" | "agent_flow" | "creative_studio" | "robotics_lab" | "code_matrix" | "career_path" | "bmb_hub";
  visual_description: string;
  duration_seconds: number;
  display_order: number;
  active: boolean;
}

export interface QuestionGenerationLog {
  id: string;
  attempt_id: string;
  generation_provider: "gemini-3.7-flash" | "fallback_bank";
  prompt_version: string;
  response_status: "success" | "invalid_schema" | "api_error" | "rate_limited";
  validation_status: "passed" | "rejected";
  fallback_used: boolean;
  generation_time_ms: number;
  error?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id?: string;
  admin_name?: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

// Zod validation schemas
export const RegistrationInputSchema = z.object({
  name: z.string().min(2, "नाम कम से कम 2 अक्षर का होना चाहिए").max(100),
  full_address: z.string().min(5, "पूरा पता अनिवार्य है").max(300),
  whatsapp_number: z.string().regex(/^(?:(?:\+|0{0,2})91[\s-]?)?[6-9]\d{9}$/, "मान्य 10 अंकों का WhatsApp नंबर दर्ज करें"),
  email: z.string().email("मान्य ईमेल पता दर्ज करें").optional().or(z.literal("")),
  education: z.string().optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  age_group: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  district: z.string().optional().or(z.literal("")),
  whatsapp_consent: z.boolean().refine(val => val === true, "WhatsApp पर सूचना प्राप्त करने की सहमति आवश्यक है"),
});

export const QuizAnswerSubmissionSchema = z.object({
  attempt_id: z.string().min(1),
  participant_token: z.string().min(1),
  answers: z.array(
    z.object({
      quiz_question_id: z.string().min(1),
      selected_option: z.number().int().min(-1).max(3),
    })
  ),
  is_auto_submit: z.boolean().optional(),
});

export const AdminLoginInputSchema = z.object({
  email: z.string().optional(),
  identifier: z.string().optional(),
  password: z.string().min(1, "Password is required"),
}).refine(data => !!(data.email || data.identifier), {
  message: "Email or WhatsApp number is required",
  path: ["identifier"]
});

export const AdminForgotPasswordSchema = z.object({
  identifier: z.string().min(3, "Please enter your registered WhatsApp Number or Admin Email"),
});

export const AdminResetPasswordWithOTPSchema = z.object({
  identifier: z.string().min(3, "Please enter your registered WhatsApp Number or Admin Email"),
  otp: z.string().length(6, "Security OTP must be 6 digits"),
  new_password: z.string().min(6, "New password must be at least 6 characters"),
});

export interface SeminarSettings {
  seminar_date_hi: string;
  seminar_date_en: string;
  seminar_time: string;
  venue_location: string;
  reporting_time: string;
  live_stream_url?: string;
  is_registration_open: boolean;
  updated_at: string;
}

export const AdmissionLeadUpdateSchema = z.object({
  status: z.enum([
    "New",
    "Contacted",
    "Interested",
    "Follow-up",
    "Demo/Seminar Attended",
    "Admission Discussion",
    "Converted",
    "Not Interested"
  ]).optional(),
  interest: z.enum(["high", "medium", "low", "general"]).optional(),
  follow_up_date: z.string().optional(),
  notes: z.string().optional(),
  assigned_to: z.string().optional(),
});

export const SeminarSettingsUpdateSchema = z.object({
  seminar_date_hi: z.string().min(1).optional(),
  seminar_date_en: z.string().min(1).optional(),
  seminar_time: z.string().min(1).optional(),
  venue_location: z.string().min(1).optional(),
  reporting_time: z.string().min(1).optional(),
  live_stream_url: z.string().optional(),
  is_registration_open: z.boolean().optional(),
});

export const AdminAccountUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  whatsapp_number: z.string().optional(),
  current_password: z.string().min(1).optional(),
  new_password: z.string().min(6).optional(),
});

// ==========================================
// SCHOLARSHIP QUIZ SCHEMAS
// 20-question AI scholarship quiz, 10-min timer
// Prizes: Rank 1 = ₹1000, Rank 2 = ₹500, Rank 3 = ₹200, Ranks 4-10 = attractive gift
// ==========================================

export interface ScholarshipAttempt {
  id: string;
  participant_id: string;
  participant_name?: string;
  participant_phone?: string;
  participant_city?: string;
  started_at: string;       // ISO
  expires_at: string;       // ISO — 10 minutes after started_at
  submitted_at?: string;
  duration_seconds?: number;
  score: number;            // 0 to 20
  total_questions: number;  // 20
  status: "in_progress" | "submitted" | "expired" | "timeout_auto_submitted";
  answers: { questionId: string; selectedOption: number; isCorrect: boolean }[];
  created_at: string;
  updated_at: string;
}

export interface ScholarshipWinner {
  id: string;
  attempt_id: string;
  participant_id: string;
  participant_name: string;
  participant_phone?: string;
  participant_city?: string;
  rank: number;             // 1, 2, 3, or 4-10
  prize_type: "cash" | "gift";
  prize_amount: number;     // 1000, 500, 200, or 0 for gift
  prize_label: string;      // "₹1000 Cash Prize" or "Attractive Gift"
  score: number;
  duration_seconds?: number;
  awarded_at: string;
  created_at: string;
}

export interface ScholarshipQuestionClient {
  id: string;
  question: string;
  options: string[];
  questionNumber: number;
  totalQuestions: number;
}

export interface ScholarshipAttemptStartResponse {
  attemptId: string;
  questions: ScholarshipQuestionClient[];
  startedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  totalQuestions: number;
}

export interface ScholarshipSubmissionResponse {
  attemptId: string;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  resultStatus: "passed" | "participated";
  rank?: number;            // 1-based rank (only top 10 are recorded)
  prizeWon?: {
    type: "cash" | "gift";
    amount: number;
    label: string;
  };
  review: {
    id: string;
    question: string;
    options: string[];
    correctOption: number;
    selectedOption: number;
    isCorrect: boolean;
    explanation?: string;
  }[];
}

export const ScholarshipStartSchema = z.object({
  participant_token: z.string().min(10, "Valid participant token required")
});

export const ScholarshipSubmissionSchema = z.object({
  attempt_id: z.string().min(1, "Attempt ID required"),
  participant_token: z.string().min(10, "Valid participant token required"),
  answers: z.array(
    z.object({
      question_id: z.string().min(1),
      selected_option: z.number().int().min(-1).max(3) // -1 = unanswered
    })
  ).min(1, "At least one answer required"),
  is_auto_submit: z.boolean().optional().default(false)
});
