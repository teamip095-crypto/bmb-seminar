export interface SeminarEventInfo {
  id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  title: string;
  description: string;
  status: "scheduled" | "active" | "completed" | "cancelled" | "rescheduled";
  registration_open: boolean;
}

export interface SeminarEventWithStats extends SeminarEventInfo {
  created_at?: string;
  updated_at?: string;
  registrationsCount: number;
  leadsCount: number;
  quizAttemptsCount: number;
  scholarshipSubmissionsCount: number;
  isCurrent: boolean;
}

export interface SeminarSettings {
  seminar_date_hi: string;
  seminar_date_en: string;
  seminar_time: string;
  venue_location: string;
  reporting_time: string;
  live_stream_url?: string;
  is_registration_open: boolean;
  is_stage2_active?: boolean;
  stage2_activated_at?: string;
  cash_prize_1st: number;
  cash_prize_2nd: number;
  cash_prize_3rd: number;
  cash_prize_consolation?: string;
  scholarship_1st: number;
  scholarship_2nd: number;
  scholarship_3rd: number;
  scholarship_4_to_20: number;
  scholarship_participation: number;
  upi_id: string;
  upi_phone: string;
  pass_price_discounted: number;
  pass_price_original: number;
  round1_questions_count: number;
  round1_duration_seconds: number;
  round2_questions_count: number;
  round2_duration_seconds: number;
  round1_free_pass_winners_count: number;
  round2_winners_count: number;
  updated_at: string;
}

export interface FridaySeminarStatusResponse {
  event: SeminarEventInfo;
  isToday: boolean;
  isActiveNow: boolean;
  isRegistrationOpen: boolean;
  formattedDateHi: string;
  formattedDateEn: string;
  seminarTime?: string;
  venueLocation?: string;
  reportingTime?: string;
  countdownSeconds: number;
  serverTimeIST: string;
  settings?: SeminarSettings;
}

export interface QuizWinner {
  id: string;
  displayName: string;
  city?: string;
  score: number;
  totalQuestions?: number;
  durationSeconds: number;
  submittedAt: string;
  rank: number;
  isFreePassWinner?: boolean;
}

export interface Round1LeaderboardEntry {
  rank: number;
  id: string;
  participantId: string;
  displayName: string;
  whatsappNumber?: string;
  city: string;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  submittedAt: string;
  isQualified: boolean;
  isFreePassWinner: boolean;
  prizeText: string;
}

export interface ScholarshipWinner {
  rank: number;
  id: string;
  participantId?: string;
  displayName: string;
  city?: string;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  submittedAt: string;
  prizeText: string;
  prizeType: string;
  cashPrize?: number;
  scholarshipAmount?: number;
}

export interface SeminarPassPurchase {
  id: string;
  participant_id: string;
  registration_id: string;
  participant_name: string;
  whatsapp_number: string;
  amount_paid: number;
  original_amount: number;
  payment_method: "upi_qr" | "free_pass";
  upi_id: string;
  utr_number: string;
  screenshot_url?: string;
  screenshot_filename?: string;
  verification_status: "verified" | "pending" | "rejected";
  verified_at?: string;
  invoice_number: string;
  pass_type: "round1_winner_free" | "discounted_199";
  notes?: string;
  whatsapp_sent: boolean;
  created_at: string;
}

export interface ScholarshipQuizQuestionDTO {
  id: string;
  order: number;
  question: string;
  options: string[];
}

export interface ScholarshipSubmissionReviewItem {
  id: string;
  order: number;
  question: string;
  options: string[];
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  explanation: string;
  topic: string;
}

export interface ParticipantProfile {
  id: string;
  registration_id: string;
  name: string;
  display_name: string;
  city?: string;
  district?: string;
  education?: string;
  occupation?: string;
  seminar_event_id: string;
}

export interface SeminarSceneItem {
  id: string;
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

export interface KnowledgeBaseItem {
  id: string;
  category: string;
  title: string;
  content: string;
  verified: boolean;
}

export interface QuizQuestionDTO {
  id: string;
  question_order: number;
  question: string;
  options: string[];
}

export interface QuizAttemptStartResponse {
  attemptId: string;
  startedAt: string;
  expiresAt: string;
  durationSecondsLimit: number;
  remainingSeconds: number;
  totalQuestions: number;
  questions: QuizQuestionDTO[];
}

export interface QuizSubmissionReviewItem {
  id: string;
  question: string;
  options: string[];
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
}

export interface QuizSubmissionResponse {
  message: string;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  resultStatus: "passed" | "participated" | "time_out";
  submittedAt: string;
  timedOut?: boolean;
  review?: QuizSubmissionReviewItem[];
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  score: number;
  durationSeconds: number;
  submittedAt: string;
  resultStatus: string;
}

export interface AdmissionLeadItem {
  id: string;
  participant_id: string;
  status: string;
  assigned_to?: string;
  notes?: string;
  follow_up_date?: string;
  interest: "high" | "medium" | "low";
  quiz_score?: number;
  created_at: string;
  updated_at: string;
  participant?: {
    id: string;
    registration_id: string;
    name: string;
    whatsapp_number: string;
    email?: string;
    city: string;
    district: string;
    education: string;
    occupation: string;
    full_address: string;
  };
}

export interface WhatsAppLogItem {
  id: string;
  participant_id: string;
  participantName?: string;
  phone_number: string;
  message_type: string;
  message_content: string;
  status: "queued" | "sent" | "delivered" | "read" | "failed" | "pending_configuration";
  error_message?: string;
  created_at: string;
  sent_at?: string;
}

export interface TestResultItem {
  id: string;
  category: string;
  test: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL";
  evidence: string;
}

export interface QATestSuiteResponse {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  timestamp: string;
  categoryBreakdown: Record<string, { total: number; passed: number; failed: number }>;
  results: TestResultItem[];
}
