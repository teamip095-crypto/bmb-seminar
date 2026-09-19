import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import {
  AdminUser,
  SeminarEvent,
  SeminarRegistration,
  QuestionBankItem,
  QuizAttempt,
  QuizQuestion,
  QuizAnswer,
  QuizResult,
  ScholarshipAttempt,
  ScholarshipSubmission,
  WhatsAppMessage,
  AdmissionLead,
  BMBKnowledgeBaseItem,
  SeminarContentScene,
  QuestionGenerationLog,
  AuditLog,
  SeminarSettings,
  SeminarPassPurchase
} from "./schema";
import { SEED_QUESTION_BANK } from "../ai/question-bank-seed";
import { VERIFIED_BMB_KNOWLEDGE_BASE, SEMINAR_27_SCENES_SEED } from "../content/seminar-content-seed";
import { query, ensureSchema, isPostgresConfigured } from "./supabase-client";
import { SCHOLARSHIP_20_QUESTIONS, ScholarshipQuestion } from "../ai/scholarship-question-seed";
import { generateRandomizedScholarshipQuestions, ScholarshipAttemptQuestion } from "../ai/scholarship-question-bank";

export interface DatabaseState {
  admin_users: AdminUser[];
  seminar_events: SeminarEvent[];
  seminar_registrations: SeminarRegistration[];
  seminar_settings?: SeminarSettings;
  pass_purchases?: SeminarPassPurchase[];
  question_bank: QuestionBankItem[];
  quiz_attempts: QuizAttempt[];
  quiz_questions: QuizQuestion[];
  quiz_answers: QuizAnswer[];
  quiz_results: QuizResult[];
  scholarship_attempts: ScholarshipAttempt[];
  scholarship_submissions: ScholarshipSubmission[];
  whatsapp_messages: WhatsAppMessage[];
  admission_leads: AdmissionLead[];
  bmb_knowledge_base: BMBKnowledgeBaseItem[];
  seminar_content: SeminarContentScene[];
  question_generation_logs: QuestionGenerationLog[];
  audit_logs: AuditLog[];
}

class DatabaseService {
  private data: DatabaseState;
  private dbFilePath: string;
  private isInitialized = false;

  constructor() {
    // On Vercel serverless (read-only FS), use /tmp for the in-memory JSON store.
    // Note: this file is ephemeral on Vercel — real persistence goes through Supabase Postgres.
    const baseDir = process.env.VERCEL ? "/tmp" : process.cwd();
    this.dbFilePath = path.resolve(baseDir, ".data", "bmb_production_store.json");
    this.data = {
      admin_users: [],
      seminar_events: [],
      seminar_registrations: [],
      pass_purchases: [],
      question_bank: [],
      quiz_attempts: [],
      quiz_questions: [],
      quiz_answers: [],
      quiz_results: [],
      scholarship_attempts: [],
      scholarship_submissions: [],
      whatsapp_messages: [],
      admission_leads: [],
      bmb_knowledge_base: [],
      seminar_content: [],
      question_generation_logs: [],
      audit_logs: []
    };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Try Postgres first — ensure schema and load stateful data
    if (isPostgresConfigured()) {
      try {
        await ensureSchema();
        await this.loadStatefulDataFromPostgres();
      } catch (err) {
        console.warn("[db] Postgres init failed, falling back to in-memory:", err);
      }
    }

    try {
      const dataDir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, "utf-8");
        const parsed = JSON.parse(raw);
        // Don't overwrite admins if already loaded from Postgres
        if (this.data.admin_users.length === 0) {
          this.data = { ...this.data, ...parsed };
        } else {
          const merged = { ...this.data, ...parsed };
          merged.admin_users = this.data.admin_users;
          merged.seminar_registrations = this.data.seminar_registrations.length > 0
            ? this.data.seminar_registrations
            : parsed.seminar_registrations || [];
          merged.scholarship_attempts = this.data.scholarship_attempts.length > 0
            ? this.data.scholarship_attempts
            : parsed.scholarship_attempts || [];
          merged.scholarship_submissions = this.data.scholarship_submissions.length > 0
            ? this.data.scholarship_submissions
            : parsed.scholarship_submissions || [];
          this.data = merged;
        }
      }
      this.data.scholarship_attempts = this.data.scholarship_attempts || [];
      this.data.scholarship_submissions = this.data.scholarship_submissions || [];
    } catch (err) {
      console.warn("Could not read stored DB file, starting clean with seeds:", err);
    }

    // Admin accounts: Admin defines their own credentials dynamically (No hardcoded credentials)
    if (!this.data.admin_users) {
      this.data.admin_users = [];
    }

    // Seed Question Bank if empty or less than 100
    if (this.data.question_bank.length < 100) {
      const now = new Date().toISOString();
      this.data.question_bank = SEED_QUESTION_BANK.map(q => ({
        ...q,
        created_at: now
      }));
    }

    // Seed BMB Knowledge Base if empty
    if (this.data.bmb_knowledge_base.length === 0) {
      const now = new Date().toISOString();
      this.data.bmb_knowledge_base = VERIFIED_BMB_KNOWLEDGE_BASE.map(item => ({
        ...item,
        updated_at: now
      }));
    }

    // Seed 27 Seminar Scenes if empty
    if (this.data.seminar_content.length === 0) {
      this.data.seminar_content = SEMINAR_27_SCENES_SEED.map((scene, idx) => ({
        id: `scene-${String(idx + 1).padStart(3, "0")}`,
        ...scene
      }));
    }

    // Initialize Admin Seminar Settings if not present
    if (!this.data.seminar_settings) {
      this.data.seminar_settings = {
        seminar_date_hi: "आगामी सेमिनार",
        seminar_date_en: "Upcoming Seminar",
        seminar_time: "11:00 AM – 4:00 PM IST",
        venue_location: "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)",
        reporting_time: "10:45 AM",
        is_registration_open: true,
        is_stage2_active: false,
        stage2_activated_at: undefined,
        cash_prize_1st: 3000,
        cash_prize_2nd: 2000,
        cash_prize_3rd: 1500,
        cash_prize_consolation: "आकर्षक उपहार (Top 20 Winners)",
        scholarship_1st: 10000,
        scholarship_2nd: 8000,
        scholarship_3rd: 5000,
        scholarship_4_to_20: 1000,
        scholarship_participation: 500,
        upi_id: "himanchal310@okaxis",
        upi_phone: "9301056006",
        pass_price_discounted: 199,
        pass_price_original: 500,
        round1_questions_count: 5,
        round1_duration_seconds: 120,
        round2_questions_count: 10,
        round2_duration_seconds: 300,
        round1_free_pass_winners_count: 10,
        round2_winners_count: 20,
        updated_at: new Date().toISOString()
      };
    }

    if (!this.data.pass_purchases) {
      this.data.pass_purchases = [];
    }

    this.persist();
    this.isInitialized = true;
  }

  // ==========================================
  // POSTGRES LOAD (read-through cache for cold-start persistence)
  // ==========================================

  private async loadStatefulDataFromPostgres(): Promise<void> {
    if (!isPostgresConfigured()) return;

    // Load admins
    const adminRes = await query(`
      SELECT id, name, email, whatsapp_number, password_hash, role, status,
             reset_otp, reset_otp_expires_at, last_login_at, created_at, updated_at
      FROM admin_users
      ORDER BY created_at ASC
    `);
    if (adminRes && adminRes.rows.length > 0) {
      this.data.admin_users = adminRes.rows.map((r: any) => ({
        id: r.id, name: r.name, email: r.email,
        whatsapp_number: r.whatsapp_number || undefined,
        password_hash: r.password_hash, role: r.role, status: r.status,
        reset_otp: r.reset_otp || undefined,
        reset_otp_expires_at: r.reset_otp_expires_at ? new Date(r.reset_otp_expires_at).toISOString() : undefined,
        last_login_at: r.last_login_at ? new Date(r.last_login_at).toISOString() : undefined,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString()
      }));
      console.log(`[db] loaded ${adminRes.rows.length} admin users from Postgres`);
    }

    // Load registrations
    const regRes = await query(`
      SELECT id, seminar_event_id, registration_id, seat_number, name, full_address,
             whatsapp_number, email, education, occupation, age_group, city, district,
             whatsapp_consent, display_name, secure_token_hash, created_at, updated_at
      FROM seminar_registrations
      ORDER BY created_at ASC
      LIMIT 1000
    `);
    if (regRes && regRes.rows.length > 0) {
      this.data.seminar_registrations = regRes.rows.map((r: any) => ({
        id: r.id, seminar_event_id: r.seminar_event_id, registration_id: r.registration_id,
        seat_number: r.seat_number || undefined, name: r.name, full_address: r.full_address,
        whatsapp_number: r.whatsapp_number, email: r.email || undefined,
        education: r.education || undefined, occupation: r.occupation || undefined,
        age_group: r.age_group || undefined, city: r.city || undefined, district: r.district || undefined,
        whatsapp_consent: r.whatsapp_consent, display_name: r.display_name,
        secure_token_hash: r.secure_token_hash,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString()
      }));
      console.log(`[db] loaded ${regRes.rows.length} registrations from Postgres`);
    }

    // Load scholarship submissions (we don't load attempts because questions_json is large
    // and attempts are short-lived)
    const subRes = await query(`
      SELECT id, attempt_id, participant_id, seminar_event_id, score, total_questions,
             duration_seconds, rank, prize_text, prize_type, cash_prize, scholarship_amount,
             answers_json, created_at
      FROM scholarship_submissions
      ORDER BY created_at DESC
      LIMIT 200
    `);
    if (subRes && subRes.rows.length > 0) {
      this.data.scholarship_submissions = subRes.rows.map((r: any) => ({
        id: r.id, attempt_id: r.attempt_id, participant_id: r.participant_id,
        seminar_event_id: r.seminar_event_id, score: r.score,
        total_questions: r.total_questions, duration_seconds: r.duration_seconds,
        rank: r.rank || undefined, prize_text: r.prize_text || undefined,
        prize_type: r.prize_type || undefined, cash_prize: r.cash_prize || undefined,
        scholarship_amount: r.scholarship_amount || undefined,
        answers: Array.isArray(r.answers_json) ? r.answers_json : [],
        created_at: new Date(r.created_at).toISOString()
      }));
      console.log(`[db] loaded ${subRes.rows.length} scholarship submissions from Postgres`);
    }

    // Load quiz results (2-min seminar quiz — persisted)
    const qrRes = await query(`
      SELECT id, attempt_id, participant_id, seminar_event_id, score, total_questions,
             duration_seconds, result_status, created_at
      FROM quiz_results
      ORDER BY created_at DESC
      LIMIT 500
    `);
    if (qrRes && qrRes.rows.length > 0) {
      this.data.quiz_results = qrRes.rows.map((r: any) => ({
        id: r.id, attempt_id: r.attempt_id, participant_id: r.participant_id,
        seminar_event_id: r.seminar_event_id, score: r.score,
        total_questions: r.total_questions, duration_seconds: r.duration_seconds,
        result_status: r.result_status,
        created_at: new Date(r.created_at).toISOString()
      }));
      console.log(`[db] loaded ${qrRes.rows.length} quiz results from Postgres`);
    }
  }

  // --- SEMINAR SETTINGS (ADMIN CONTROLLED) ---
  public getSeminarSettings(): SeminarSettings {
    if (!this.data.seminar_settings) {
      this.data.seminar_settings = {
        seminar_date_hi: "आगामी सेमिनार",
        seminar_date_en: "Upcoming Seminar",
        seminar_time: "11:00 AM – 4:00 PM IST",
        venue_location: "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)",
        reporting_time: "10:45 AM",
        is_registration_open: true,
        is_stage2_active: false,
        stage2_activated_at: undefined,
        cash_prize_1st: 3000,
        cash_prize_2nd: 2000,
        cash_prize_3rd: 1500,
        cash_prize_consolation: "आकर्षक उपहार (Top 20 Winners)",
        scholarship_1st: 10000,
        scholarship_2nd: 8000,
        scholarship_3rd: 5000,
        scholarship_4_to_20: 1000,
        scholarship_participation: 500,
        upi_id: "himanchal310@okaxis",
        upi_phone: "9301056006",
        pass_price_discounted: 199,
        pass_price_original: 500,
        round1_questions_count: 5,
        round1_duration_seconds: 120,
        round2_questions_count: 10,
        round2_duration_seconds: 300,
        round1_free_pass_winners_count: 10,
        round2_winners_count: 20,
        updated_at: new Date().toISOString()
      };
      this.persist();
    }
    // Upgrade existing store if missing or old values
    if (this.data.seminar_settings.cash_prize_1st === undefined || this.data.seminar_settings.cash_prize_1st === 1000) {
      this.data.seminar_settings.cash_prize_1st = 3000;
    }
    if (this.data.seminar_settings.cash_prize_2nd === undefined || this.data.seminar_settings.cash_prize_2nd === 500) {
      this.data.seminar_settings.cash_prize_2nd = 2000;
    }
    if (this.data.seminar_settings.cash_prize_3rd === undefined || this.data.seminar_settings.cash_prize_3rd === 200) {
      this.data.seminar_settings.cash_prize_3rd = 1500;
    }
    if (!this.data.seminar_settings.cash_prize_consolation || this.data.seminar_settings.cash_prize_consolation.includes("Top 7")) {
      this.data.seminar_settings.cash_prize_consolation = "आकर्षक उपहार (Top 20 Winners)";
    }
    if (!this.data.seminar_settings.scholarship_1st) this.data.seminar_settings.scholarship_1st = 10000;
    if (!this.data.seminar_settings.scholarship_2nd) this.data.seminar_settings.scholarship_2nd = 8000;
    if (!this.data.seminar_settings.scholarship_3rd) this.data.seminar_settings.scholarship_3rd = 5000;
    if (!this.data.seminar_settings.scholarship_4_to_20) this.data.seminar_settings.scholarship_4_to_20 = 1000;
    if (!this.data.seminar_settings.scholarship_participation) this.data.seminar_settings.scholarship_participation = 500;
    if (!this.data.seminar_settings.upi_id) this.data.seminar_settings.upi_id = "himanchal310@okaxis";
    if (!this.data.seminar_settings.upi_phone) this.data.seminar_settings.upi_phone = "9301056006";
    if (!this.data.seminar_settings.pass_price_discounted) this.data.seminar_settings.pass_price_discounted = 199;
    if (!this.data.seminar_settings.pass_price_original) this.data.seminar_settings.pass_price_original = 500;
    if (!this.data.seminar_settings.round1_questions_count) this.data.seminar_settings.round1_questions_count = 5;
    if (!this.data.seminar_settings.round1_duration_seconds) this.data.seminar_settings.round1_duration_seconds = 120;
    if (!this.data.seminar_settings.round2_questions_count) this.data.seminar_settings.round2_questions_count = 10;
    if (!this.data.seminar_settings.round2_duration_seconds) this.data.seminar_settings.round2_duration_seconds = 300;
    if (!this.data.seminar_settings.round1_free_pass_winners_count) this.data.seminar_settings.round1_free_pass_winners_count = 10;
    if (!this.data.seminar_settings.round2_winners_count) this.data.seminar_settings.round2_winners_count = 20;
    if (this.data.seminar_settings.is_stage2_active === undefined) this.data.seminar_settings.is_stage2_active = false;

    return this.data.seminar_settings;
  }

  public updateSeminarSettings(updates: Partial<SeminarSettings>): SeminarSettings {
    const current = this.getSeminarSettings();
    this.data.seminar_settings = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString()
    };
    if (this.data.seminar_events && this.data.seminar_events.length > 0) {
      const activeEvent = this.data.seminar_events[0];
      if (updates.is_registration_open !== undefined) {
        activeEvent.registration_open = updates.is_registration_open;
      }
      activeEvent.updated_at = new Date().toISOString();
    }
    this.persist();
    return this.data.seminar_settings;
  }

  // --- QUIZ WINNER (FOR LIVE RUNNING MARQUEE TICKER - STRICTLY 1 REAL WINNER) ---
  public getQuizWinners(limit: number = 1): {
    id: string;
    displayName: string;
    score: number;
    durationSeconds: number;
    submittedAt: string;
    rank: number;
    city?: string;
  }[] {
    if (!this.data.quiz_results || this.data.quiz_results.length === 0) {
      return [];
    }

    // Sort real results: highest score first, then fastest completion duration
    const sorted = [...this.data.quiz_results].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.duration_seconds !== b.duration_seconds) return a.duration_seconds - b.duration_seconds;
      return a.created_at.localeCompare(b.created_at);
    });

    const top = sorted.slice(0, 1);
    return top.map((r) => {
      const p = this.getRegistrationById(r.participant_id);
      return {
        id: r.id,
        displayName: p?.name || p?.display_name || "BMB Student",
        city: p?.city || p?.district || "",
        score: r.score,
        durationSeconds: r.duration_seconds,
        submittedAt: r.created_at,
        rank: 1
      };
    });
  }

  public persist(): void {
    try {
      const dataDir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to persist database state:", err);
    }
  }

  // --- SEMINAR EVENTS ---
  public getSeminarEventByDate(dateStr: string): SeminarEvent | undefined {
    return this.data.seminar_events.find(e => e.event_date === dateStr);
  }

  public getSeminarEventById(id: string): SeminarEvent | undefined {
    return this.data.seminar_events.find(e => e.id === id);
  }

  public getAllSeminarEvents(): SeminarEvent[] {
    return [...this.data.seminar_events].sort((a, b) => b.event_date.localeCompare(a.event_date));
  }

  public createSeminarEvent(event: Omit<SeminarEvent, "id" | "created_at" | "updated_at">): SeminarEvent {
    const existing = this.getSeminarEventByDate(event.event_date);
    if (existing) {
      return existing;
    }
    const now = new Date().toISOString();
    const newEvent: SeminarEvent = {
      id: `evt-${event.event_date.replace(/-/g, "")}`,
      ...event,
      created_at: now,
      updated_at: now
    };
    this.data.seminar_events.push(newEvent);
    this.persist();
    return newEvent;
  }

  public updateSeminarEvent(id: string, updates: Partial<SeminarEvent>): SeminarEvent | null {
    const idx = this.data.seminar_events.findIndex(e => e.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.data.seminar_events[idx] = {
      ...this.data.seminar_events[idx],
      ...updates,
      updated_at: now
    };
    this.persist();
    return this.data.seminar_events[idx];
  }

  public getSeminarEventsWithStats(): Array<SeminarEvent & {
    registrationsCount: number;
    leadsCount: number;
    quizAttemptsCount: number;
    scholarshipSubmissionsCount: number;
    isCurrent: boolean;
  }> {
    const active = this.data.seminar_events.find(e => e.status === "active") || this.data.seminar_events[0];
    return this.data.seminar_events.map(ev => {
      const regs = this.data.seminar_registrations.filter(r => r.seminar_event_id === ev.id);
      const regIds = new Set(regs.map(r => r.id));
      const leadsCount = this.data.admission_leads.filter(l => regIds.has(l.participant_id)).length;
      const quizAttemptsCount = this.data.quiz_attempts.filter(q => q.seminar_event_id === ev.id || regIds.has(q.participant_id)).length;
      const scholarshipSubmissionsCount = this.data.scholarship_submissions.filter(s => s.seminar_event_id === ev.id || regIds.has(s.participant_id)).length;

      return {
        ...ev,
        registrationsCount: regs.length,
        leadsCount,
        quizAttemptsCount,
        scholarshipSubmissionsCount,
        isCurrent: Boolean(active && active.id === ev.id)
      };
    }).sort((a, b) => b.event_date.localeCompare(a.event_date));
  }

  public deleteSeminarEventAndData(eventId: string, clearRecordsOnly: boolean = false): {
    success: boolean;
    deletedRegistrations: number;
    deletedLeads: number;
    deletedQuizAttempts: number;
    deletedScholarshipSubmissions: number;
    eventDeleted: boolean;
  } {
    const regsToDelete = this.data.seminar_registrations.filter(r => r.seminar_event_id === eventId);
    const participantIds = new Set(regsToDelete.map(r => r.id));
    const deletedRegistrations = regsToDelete.length;

    // Filter registrations
    this.data.seminar_registrations = this.data.seminar_registrations.filter(r => r.seminar_event_id !== eventId);

    // Filter leads
    const initialLeadsCount = this.data.admission_leads.length;
    this.data.admission_leads = this.data.admission_leads.filter(l => !participantIds.has(l.participant_id));
    const deletedLeads = initialLeadsCount - this.data.admission_leads.length;

    // Filter quiz
    const initialQuiz = this.data.quiz_attempts.length;
    const removedAttempts = this.data.quiz_attempts.filter(q => q.seminar_event_id === eventId || participantIds.has(q.participant_id));
    const removedAttemptIds = new Set(removedAttempts.map(q => q.id));

    this.data.quiz_attempts = this.data.quiz_attempts.filter(q => !removedAttemptIds.has(q.id));
    const deletedQuizAttempts = initialQuiz - this.data.quiz_attempts.length;

    this.data.quiz_answers = this.data.quiz_answers.filter(a => !removedAttemptIds.has(a.attempt_id));
    this.data.quiz_results = this.data.quiz_results.filter(r => !removedAttemptIds.has(r.attempt_id) && r.seminar_event_id !== eventId && !participantIds.has(r.participant_id));

    // Filter scholarship
    const initialSch = this.data.scholarship_submissions.length;
    this.data.scholarship_attempts = this.data.scholarship_attempts.filter(s => s.seminar_event_id !== eventId && !participantIds.has(s.participant_id));
    this.data.scholarship_submissions = this.data.scholarship_submissions.filter(s => s.seminar_event_id !== eventId && !participantIds.has(s.participant_id));
    const deletedScholarshipSubmissions = initialSch - this.data.scholarship_submissions.length;

    // Filter WhatsApp messages
    this.data.whatsapp_messages = this.data.whatsapp_messages.filter(m => !participantIds.has(m.participant_id));

    let eventDeleted = false;
    if (!clearRecordsOnly) {
      this.data.seminar_events = this.data.seminar_events.filter(e => e.id !== eventId);
      eventDeleted = true;
    }

    this.persist();

    return {
      success: true,
      deletedRegistrations,
      deletedLeads,
      deletedQuizAttempts,
      deletedScholarshipSubmissions,
      eventDeleted
    };
  }

  public deleteOldSeminarsData(keepEventId?: string): {
    deletedEventsCount: number;
    deletedRegistrations: number;
    deletedLeads: number;
    deletedQuizAttempts: number;
    deletedScholarshipSubmissions: number;
  } {
    let activeId = keepEventId;
    if (!activeId) {
      const active = this.data.seminar_events.find(e => e.status === "active");
      activeId = active ? active.id : (this.data.seminar_events[0]?.id || "");
    }

    const oldEvents = this.data.seminar_events.filter(e => e.id !== activeId);
    let totalRegs = 0;
    let totalLeads = 0;
    let totalQuiz = 0;
    let totalSch = 0;

    for (const ev of oldEvents) {
      const res = this.deleteSeminarEventAndData(ev.id, false);
      totalRegs += res.deletedRegistrations;
      totalLeads += res.deletedLeads;
      totalQuiz += res.deletedQuizAttempts;
      totalSch += res.deletedScholarshipSubmissions;
    }

    // Clean any orphan registrations not linked to active seminar
    if (activeId) {
      const orphanRegs = this.data.seminar_registrations.filter(r => r.seminar_event_id !== activeId);
      if (orphanRegs.length > 0) {
        const orphanIds = new Set(orphanRegs.map(r => r.id));
        totalRegs += orphanRegs.length;
        this.data.seminar_registrations = this.data.seminar_registrations.filter(r => r.seminar_event_id === activeId);

        const initialLeads = this.data.admission_leads.length;
        this.data.admission_leads = this.data.admission_leads.filter(l => !orphanIds.has(l.participant_id));
        totalLeads += (initialLeads - this.data.admission_leads.length);

        this.data.quiz_attempts = this.data.quiz_attempts.filter(q => q.seminar_event_id === activeId && !orphanIds.has(q.participant_id));
        this.data.quiz_results = this.data.quiz_results.filter(r => r.seminar_event_id === activeId && !orphanIds.has(r.participant_id));
        this.data.scholarship_attempts = this.data.scholarship_attempts.filter(s => s.seminar_event_id === activeId && !orphanIds.has(s.participant_id));
        this.data.scholarship_submissions = this.data.scholarship_submissions.filter(s => s.seminar_event_id === activeId && !orphanIds.has(s.participant_id));
        this.persist();
      }
    }

    return {
      deletedEventsCount: oldEvents.length,
      deletedRegistrations: totalRegs,
      deletedLeads: totalLeads,
      deletedQuizAttempts: totalQuiz,
      deletedScholarshipSubmissions: totalSch
    };
  }

  public archiveAndCreateNewSeminar(data: {
    event_date: string;
    title: string;
    description?: string;
    start_time?: string;
    end_time?: string;
  }): SeminarEvent {
    // Archive all previous active events to completed
    this.data.seminar_events.forEach(e => {
      if (e.status === "active") {
        e.status = "completed";
        e.updated_at = new Date().toISOString();
      }
    });

    const now = new Date().toISOString();
    const newEvent: SeminarEvent = {
      id: `evt-${data.event_date.replace(/-/g, "")}-${Date.now().toString(36).substring(4)}`,
      event_date: data.event_date,
      start_time: data.start_time || "11:00",
      end_time: data.end_time || "16:00",
      timezone: "Asia/Kolkata",
      title: data.title,
      description: data.description || "Official BMB Educom AI Seminar",
      status: "active",
      registration_open: true,
      created_at: now,
      updated_at: now
    };

    this.data.seminar_events.unshift(newEvent);
    this.persist();
    return newEvent;
  }

  // --- REGISTRATIONS ---
  public createRegistration(reg: Omit<SeminarRegistration, "id" | "created_at" | "updated_at">): SeminarRegistration {
    const now = new Date().toISOString();
    const eventRegistrations = this.data.seminar_registrations.filter(r => r.seminar_event_id === reg.seminar_event_id);
    const seatNumber = reg.seat_number || `BMB-SEAT-${String(eventRegistrations.length + 1).padStart(3, "0")}`;

    const newReg: SeminarRegistration = {
      id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...reg,
      seat_number: seatNumber,
      created_at: now,
      updated_at: now
    };
    this.data.seminar_registrations.push(newReg);

    // Persist to Postgres
    if (isPostgresConfigured()) {
      query(
        `INSERT INTO seminar_registrations
          (id, seminar_event_id, registration_id, seat_number, name, full_address,
           whatsapp_number, email, education, occupation, age_group, city, district,
           whatsapp_consent, display_name, secure_token_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [
          newReg.id, newReg.seminar_event_id, newReg.registration_id, newReg.seat_number,
          newReg.name, newReg.full_address, newReg.whatsapp_number, newReg.email || null,
          newReg.education || null, newReg.occupation || null, newReg.age_group || null,
          newReg.city || null, newReg.district || null, newReg.whatsapp_consent,
          newReg.display_name, newReg.secure_token_hash
        ]
      ).catch(err => console.error("[db] Failed to persist registration to Postgres:", err));
    }

    // Automatically create corresponding CRM Lead
    const extraInfo = [reg.education, reg.occupation].filter(Boolean).join(", ");
    this.createAdmissionLead({
      participant_id: newReg.id,
      status: "New",
      interest: "high",
      notes: `Registered for AI Seminar: ${reg.seminar_event_id}${extraInfo ? ` (${extraInfo})` : ""}. Seat: ${seatNumber}. Address: ${reg.full_address}.`,
      quiz_score: undefined
    });

    this.persist();
    return newReg;
  }

  public getRegistrationByTokenHash(tokenHash: string): SeminarRegistration | undefined {
    return this.data.seminar_registrations.find(r => r.secure_token_hash === tokenHash);
  }

  /** Async version — falls back to Postgres if not in cache. Use this for quiz start. */
  public async findRegistrationByTokenHashAsync(tokenHash: string): Promise<SeminarRegistration | undefined> {
    const cached = this.getRegistrationByTokenHash(tokenHash);
    if (cached) return cached;

    if (isPostgresConfigured()) {
      const result = await query(
        `SELECT id, seminar_event_id, registration_id, seat_number, name, full_address,
                whatsapp_number, email, education, occupation, age_group, city, district,
                whatsapp_consent, display_name, secure_token_hash, created_at, updated_at
         FROM seminar_registrations
         WHERE secure_token_hash = $1
         LIMIT 1`,
        [tokenHash]
      );
      if (result && result.rows.length > 0) {
        const r = result.rows[0] as any;
        const reg: SeminarRegistration = {
          id: r.id, seminar_event_id: r.seminar_event_id, registration_id: r.registration_id,
          seat_number: r.seat_number || undefined, name: r.name, full_address: r.full_address,
          whatsapp_number: r.whatsapp_number, email: r.email || undefined,
          education: r.education || undefined, occupation: r.occupation || undefined,
          age_group: r.age_group || undefined, city: r.city || undefined, district: r.district || undefined,
          whatsapp_consent: r.whatsapp_consent, display_name: r.display_name,
          secure_token_hash: r.secure_token_hash,
          created_at: new Date(r.created_at).toISOString(),
          updated_at: new Date(r.updated_at).toISOString()
        };
        if (!this.data.seminar_registrations.find(x => x.id === reg.id)) {
          this.data.seminar_registrations.push(reg);
        }
        return reg;
      }
    }
    return undefined;
  }

  public getRegistrationByToken(token: string): SeminarRegistration | undefined {
    return this.data.seminar_registrations.find(
      r => r.registration_id === token || r.id === token || r.secure_token_hash === token
    );
  }

  public getRegistrationById(id: string): SeminarRegistration | undefined {
    return this.data.seminar_registrations.find(r => r.id === id);
  }

  public getRegistrationByPhoneAndEvent(phone: string, eventId: string): SeminarRegistration | undefined {
    return this.data.seminar_registrations.find(
      r => r.whatsapp_number.replace(/\D/g, "").slice(-10) === phone.replace(/\D/g, "").slice(-10) &&
           r.seminar_event_id === eventId
    );
  }

  /** Async version — falls back to Postgres for duplicate-check. */
  public async findRegistrationByPhoneAndEventAsync(phone: string, eventId: string): Promise<SeminarRegistration | undefined> {
    const cached = this.getRegistrationByPhoneAndEvent(phone, eventId);
    if (cached) return cached;

    if (isPostgresConfigured()) {
      const result = await query(
        `SELECT id, seminar_event_id, registration_id, seat_number, name, full_address,
                whatsapp_number, email, education, occupation, age_group, city, district,
                whatsapp_consent, display_name, secure_token_hash, created_at, updated_at
         FROM seminar_registrations
         WHERE whatsapp_number = $1 AND seminar_event_id = $2
         LIMIT 1`,
        [phone, eventId]
      );
      if (result && result.rows.length > 0) {
        const r = result.rows[0] as any;
        const reg: SeminarRegistration = {
          id: r.id, seminar_event_id: r.seminar_event_id, registration_id: r.registration_id,
          seat_number: r.seat_number || undefined, name: r.name, full_address: r.full_address,
          whatsapp_number: r.whatsapp_number, email: r.email || undefined,
          education: r.education || undefined, occupation: r.occupation || undefined,
          age_group: r.age_group || undefined, city: r.city || undefined, district: r.district || undefined,
          whatsapp_consent: r.whatsapp_consent, display_name: r.display_name,
          secure_token_hash: r.secure_token_hash,
          created_at: new Date(r.created_at).toISOString(),
          updated_at: new Date(r.updated_at).toISOString()
        };
        if (!this.data.seminar_registrations.find(x => x.id === reg.id)) {
          this.data.seminar_registrations.push(reg);
        }
        return reg;
      }
    }
    return undefined;
  }

  public getAllRegistrations(filter?: { eventId?: string; search?: string }): (SeminarRegistration & { quizResult?: QuizResult; leadStatus?: string })[] {
    let list = [...this.data.seminar_registrations];

    if (filter?.eventId) {
      list = list.filter(r => r.seminar_event_id === filter.eventId);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.whatsapp_number.includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        r.registration_id.toLowerCase().includes(q)
      );
    }

    return list.map(reg => {
      const quizResult = this.data.quiz_results.find(qr => qr.participant_id === reg.id);
      const lead = this.data.admission_leads.find(l => l.participant_id === reg.id);
      return {
        ...reg,
        quizResult,
        leadStatus: lead?.status || "New"
      };
    }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  // --- QUESTION BANK ---
  public getActiveQuestionBank(): QuestionBankItem[] {
    return this.data.question_bank.filter(q => q.active);
  }

  public addQuestionBankItem(item: Omit<QuestionBankItem, "id" | "created_at">): QuestionBankItem {
    const now = new Date().toISOString();
    const newQ: QuestionBankItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...item,
      created_at: now
    };
    this.data.question_bank.push(newQ);
    this.persist();
    return newQ;
  }

  // --- QUIZ ATTEMPTS ---
  public getActiveAttemptForParticipant(participantId: string, eventId: string): QuizAttempt | undefined {
    return this.data.quiz_attempts.find(
      a => a.participant_id === participantId &&
           a.seminar_event_id === eventId &&
           a.status === "in_progress"
    );
  }

  public getAttemptById(attemptId: string): QuizAttempt | undefined {
    return this.data.quiz_attempts.find(a => a.id === attemptId);
  }

  public createQuizAttempt(
    attempt: Omit<QuizAttempt, "id" | "created_at">,
    questions: { questionId: string; question: string; options: string[]; correctOption: number }[]
  ): { attempt: QuizAttempt; questions: QuizQuestion[] } {
    const now = new Date().toISOString();
    const attemptId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newAttempt: QuizAttempt = {
      id: attemptId,
      ...attempt,
      created_at: now
    };
    this.data.quiz_attempts.push(newAttempt);

    const createdQuestions: QuizQuestion[] = questions.map((q, idx) => {
      const qEntity: QuizQuestion = {
        id: `qq-${attemptId}-${idx + 1}`,
        attempt_id: attemptId,
        question_id: q.questionId,
        question_order: idx + 1,
        question_snapshot: q.question,
        options_snapshot: q.options,
        correct_option_server_only: q.correctOption
      };
      this.data.quiz_questions.push(qEntity);
      return qEntity;
    });

    this.persist();
    return { attempt: newAttempt, questions: createdQuestions };
  }

  public getQuizQuestionsForAttempt(attemptId: string): QuizQuestion[] {
    return this.data.quiz_questions
      .filter(qq => qq.attempt_id === attemptId)
      .sort((a, b) => a.question_order - b.question_order);
  }

  public recordSubmissionAndScoring(params: {
    attemptId: string;
    answers: { quizQuestionId: string; selectedOption: number }[];
    isAutoSubmit?: boolean;
  }): { result: QuizResult; score: number; duration: number } | null {
    const attempt = this.getAttemptById(params.attemptId);
    if (!attempt) return null;

    if (attempt.status === "submitted" || attempt.status === "timeout_auto_submitted") {
      // Return existing result
      const existing = this.data.quiz_results.find(r => r.attempt_id === params.attemptId);
      if (existing) {
        return { result: existing, score: existing.score, duration: existing.duration_seconds };
      }
    }

    const questions = this.getQuizQuestionsForAttempt(params.attemptId);
    if (questions.length === 0) return null;

    const now = new Date();
    const submittedAt = now.toISOString();
    const startedTime = new Date(attempt.started_at).getTime();
    const submittedTime = now.getTime();
    const rawDuration = Math.max(1, Math.round((submittedTime - startedTime) / 1000));
    const duration = Math.min(rawDuration, 120); // capped at 120s

    // Calculate score
    let score = 0;
    const answerEntities: QuizAnswer[] = [];

    for (const ans of params.answers) {
      const q = questions.find(item => item.id === ans.quizQuestionId);
      if (q) {
        if (q.correct_option_server_only === ans.selectedOption) {
          score += 1;
        }
        answerEntities.push({
          id: `ans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          attempt_id: params.attemptId,
          quiz_question_id: ans.quizQuestionId,
          selected_option: ans.selectedOption,
          answered_at: submittedAt
        });
      }
    }

    // Save answers
    this.data.quiz_answers.push(...answerEntities);

    // Update attempt
    attempt.status = params.isAutoSubmit ? "timeout_auto_submitted" : "submitted";
    attempt.submitted_at = submittedAt;
    attempt.duration_seconds = duration;
    attempt.score = score;

    // Create Result
    const resultStatus = score >= 3 ? "passed" : (params.isAutoSubmit ? "time_out" : "participated");
    const newResult: QuizResult = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      attempt_id: params.attemptId,
      participant_id: attempt.participant_id,
      seminar_event_id: attempt.seminar_event_id,
      score,
      total_questions: 5,
      duration_seconds: duration,
      result_status: resultStatus,
      created_at: submittedAt
    };
    this.data.quiz_results.push(newResult);

    // Persist quiz result to Postgres — survives Vercel cold starts
    if (isPostgresConfigured()) {
      // Look up registration for display_name, whatsapp, city, registration_id
      const reg = this.data.seminar_registrations.find(r => r.id === attempt.participant_id);
      const regId = reg?.registration_id || null;
      const pName = reg?.name || null;
      const pPhone = reg?.whatsapp_number || null;
      const pCity = reg?.city || null;
      const dName = reg?.display_name || null;

      query(
        `INSERT INTO quiz_results
          (id, attempt_id, participant_id, seminar_event_id, registration_id,
           participant_name, whatsapp_number, city, display_name,
           score, total_questions, duration_seconds, result_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
         ON CONFLICT (participant_id, seminar_event_id) DO UPDATE SET
           attempt_id = EXCLUDED.attempt_id,
           score = EXCLUDED.score,
           total_questions = EXCLUDED.total_questions,
           duration_seconds = EXCLUDED.duration_seconds,
           result_status = EXCLUDED.result_status,
           created_at = NOW()`,
        [
          newResult.id, newResult.attempt_id, newResult.participant_id, newResult.seminar_event_id,
          regId, pName, pPhone, pCity, dName,
          newResult.score, newResult.total_questions, newResult.duration_seconds, newResult.result_status
        ]
      ).catch(err => console.error("[db] Failed to persist quiz result to Postgres:", err));
    }

    // Update CRM Lead with score
    const lead = this.data.admission_leads.find(l => l.participant_id === attempt.participant_id);
    if (lead) {
      lead.quiz_score = score;
      lead.status = "Demo/Seminar Attended";
      lead.interest = score >= 3 ? "high" : "medium";
      lead.updated_at = submittedAt;
    }

    this.persist();
    return { result: newResult, score, duration };
  }

  // --- LEADERBOARD ---
  public getLeaderboardForEvent(eventId: string): {
    rank: number;
    displayName: string;
    score: number;
    durationSeconds: number;
    submittedAt: string;
    resultStatus: string;
  }[] {
    const results = this.data.quiz_results
      .filter(r => r.seminar_event_id === eventId)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score; // Highest score first
        }
        if (a.duration_seconds !== b.duration_seconds) {
          return a.duration_seconds - b.duration_seconds; // Fastest completion first
        }
        return a.created_at.localeCompare(b.created_at); // Earliest submission first
      });

    return results.map((res, idx) => {
      const participant = this.getRegistrationById(res.participant_id);
      return {
        rank: idx + 1,
        displayName: participant?.display_name || "BMB Participant",
        score: res.score,
        durationSeconds: res.duration_seconds,
        submittedAt: res.created_at,
        resultStatus: res.result_status
      };
    });
  }

  // --- 10-MINUTE AI SCHOLARSHIP QUIZ (20 QUESTIONS, DYNAMIC CASH PRIZES) ---
  public getScholarshipQuestions(): { id: string; order: number; question: string; options: string[] }[] {
    return generateRandomizedScholarshipQuestions(20).map(q => ({
      id: q.id,
      order: q.order,
      question: q.question,
      options: q.options
    }));
  }

  public getScholarshipAttemptQuestions(attemptId: string): { id: string; order: number; question: string; options: string[] }[] {
    const attempt = this.getScholarshipAttemptById(attemptId);
    if (attempt && attempt.questions && attempt.questions.length > 0) {
      return attempt.questions.map(q => ({
        id: q.id,
        order: q.order,
        question: q.question,
        options: q.options
      }));
    }

    // Fallback if attempt exists without questions
    const generated = generateRandomizedScholarshipQuestions(20);
    if (attempt) {
      attempt.questions = generated;
      this.persist();
    }
    return generated.map(q => ({
      id: q.id,
      order: q.order,
      question: q.question,
      options: q.options
    }));
  }

  public getScholarshipQuestionById(id: string): ScholarshipQuestion | undefined {
    return SCHOLARSHIP_20_QUESTIONS.find(q => q.id === id);
  }

  public getActiveScholarshipAttempt(participantId: string, eventId: string): ScholarshipAttempt | undefined {
    return this.data.scholarship_attempts?.find(
      a => a.participant_id === participantId &&
           a.seminar_event_id === eventId &&
           a.status === "in_progress"
    );
  }

  public getScholarshipAttemptById(attemptId: string): ScholarshipAttempt | undefined {
    return this.data.scholarship_attempts?.find(a => a.id === attemptId);
  }

  public getScholarshipSubmissionByParticipant(participantId: string): ScholarshipSubmission | undefined {
    return this.data.scholarship_submissions?.find(s => s.participant_id === participantId);
  }

  public getScholarshipSubmissionByAttempt(attemptId: string): ScholarshipSubmission | undefined {
    return this.data.scholarship_submissions?.find(s => s.attempt_id === attemptId);
  }

  public createScholarshipAttempt(participantId: string, eventId: string, tokenHash: string): ScholarshipAttempt {
    if (!this.data.scholarship_attempts) this.data.scholarship_attempts = [];
    
    // Check existing in_progress attempt
    const existing = this.getActiveScholarshipAttempt(participantId, eventId);
    if (existing) {
      if (!existing.questions || existing.questions.length === 0) {
        existing.questions = generateRandomizedScholarshipQuestions(10);
        this.persist();
      }
      return existing;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 300 * 1000).toISOString(); // 5 minutes = 300s
    const attemptId = `s-att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Generate unique set of 10 randomized questions with shuffled options for this specific student
    const assignedQuestions = generateRandomizedScholarshipQuestions(10);

    const newAttempt: ScholarshipAttempt = {
      id: attemptId,
      participant_id: participantId,
      seminar_event_id: eventId,
      attempt_token_hash: tokenHash,
      started_at: now.toISOString(),
      expires_at: expiresAt,
      duration_seconds_limit: 300,
      status: "in_progress",
      created_at: now.toISOString(),
      questions: assignedQuestions
    };

    this.data.scholarship_attempts.push(newAttempt);
    this.persist();
    return newAttempt;
  }

  public async recordScholarshipSubmission(params: {
    attemptId: string;
    answers: { question_id: string; selected_option: number }[];
    isAutoSubmit?: boolean;
  }): Promise<{
    submission: ScholarshipSubmission;
    score: number;
    totalQuestions: number;
    duration: number;
    rank: number;
    prizeText: string;
    prizeType: string;
    cashPrize: number;
    scholarshipAmount: number;
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
  } | null> {
    if (!this.data.scholarship_attempts) this.data.scholarship_attempts = [];
    if (!this.data.scholarship_submissions) this.data.scholarship_submissions = [];

    const attempt = this.getScholarshipAttemptById(params.attemptId);
    if (!attempt) return null;

    // Use the exact questions assigned to this student attempt
    const attemptQuestions = (attempt.questions && attempt.questions.length > 0)
      ? attempt.questions
      : generateRandomizedScholarshipQuestions(10);

    let submission = this.getScholarshipSubmissionByAttempt(params.attemptId);
    if (!submission) {
      const now = new Date();
      const submittedAt = now.toISOString();
      const startedTime = new Date(attempt.started_at).getTime();
      const rawDuration = Math.max(1, Math.round((now.getTime() - startedTime) / 1000));
      const duration = Math.min(rawDuration, 300); // max 300 seconds (5 min)

      let score = 0;
      const gradedAnswers = params.answers.map(ans => {
        const q = attemptQuestions.find(item => item.id === ans.question_id);
        const isCorrect = q ? q.correctOption === ans.selected_option : false;
        if (isCorrect) score += 1;
        return {
          question_id: ans.question_id,
          selected_option: ans.selected_option,
          is_correct: isCorrect
        };
      });

      attempt.status = params.isAutoSubmit ? "timeout_auto_submitted" : "submitted";

      submission = {
        id: `s-sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        attempt_id: params.attemptId,
        participant_id: attempt.participant_id,
        seminar_event_id: attempt.seminar_event_id,
        score,
        total_questions: 10,
        duration_seconds: duration,
        answers: gradedAnswers,
        created_at: submittedAt
      };

      this.data.scholarship_submissions.push(submission);

      // Update CRM lead
      const lead = this.data.admission_leads.find(l => l.participant_id === attempt.participant_id);
      if (lead) {
        lead.notes = `${lead.notes || ""} [Mega Seminar AI Quiz: ${score}/10 in ${duration}s]`;
        if (score >= 7) lead.interest = "high";
        lead.updated_at = submittedAt;
      }

      // Persist scholarship attempt status + submission to Postgres
      if (isPostgresConfigured()) {
        // Update attempt status
        await query(
          `UPDATE scholarship_attempts
           SET status = $1, updated_at = NOW()
           WHERE id = $2`,
          [attempt.status, attempt.id]
        );

        // Insert submission (idempotent)
        await query(
          `INSERT INTO scholarship_submissions
            (id, attempt_id, participant_id, seminar_event_id, score, total_questions,
             duration_seconds, answers_json, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (id) DO NOTHING`,
          [
            submission.id, submission.attempt_id, submission.participant_id,
            submission.seminar_event_id, submission.score, submission.total_questions,
            submission.duration_seconds, JSON.stringify(submission.answers)
          ]
        );
      }

      this.persist();
    }

    const winners = this.getScholarshipWinners();
    const myWinnerEntry = winners.find(w => w.id === submission!.id);
    const rank = myWinnerEntry ? myWinnerEntry.rank : winners.length;
    const prizeText = myWinnerEntry ? myWinnerEntry.prizeText : "प्रतिभागिता प्रमाण-पत्र";
    const prizeType = myWinnerEntry ? myWinnerEntry.prizeType : "participated";
    const cashPrize = myWinnerEntry ? myWinnerEntry.cashPrize : 0;
    const scholarshipAmount = myWinnerEntry ? myWinnerEntry.scholarshipAmount : 500;

    const review = attemptQuestions.map(q => {
      const ans = submission!.answers.find(a => a.question_id === q.id);
      const sel = ans !== undefined ? ans.selected_option : -1;
      return {
        id: q.id,
        order: q.order,
        question: q.question,
        options: q.options,
        selectedOption: sel,
        correctOption: q.correctOption,
        isCorrect: sel === q.correctOption,
        explanation: q.explanation,
        topic: q.topic
      };
    });

    return {
      submission,
      score: submission.score,
      totalQuestions: 10,
      duration: submission.duration_seconds,
      rank,
      prizeText,
      prizeType,
      cashPrize,
      scholarshipAmount,
      review
    };
  }

  public getScholarshipWinners(): {
    rank: number;
    id: string;
    participantId: string;
    displayName: string;
    city: string;
    score: number;
    totalQuestions: number;
    durationSeconds: number;
    submittedAt: string;
    prizeText: string;
    prizeType: string;
    cashPrize: number;
    scholarshipAmount: number;
  }[] {
    if (!this.data.scholarship_submissions || this.data.scholarship_submissions.length === 0) {
      return [];
    }

    const sorted = [...this.data.scholarship_submissions].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.duration_seconds !== b.duration_seconds) return a.duration_seconds - b.duration_seconds;
      return a.created_at.localeCompare(b.created_at);
    });

    const settings = this.getSeminarSettings();
    const p1Cash = Number(settings.cash_prize_1st ?? 3000);
    const p2Cash = Number(settings.cash_prize_2nd ?? 2000);
    const p3Cash = Number(settings.cash_prize_3rd ?? 1500);

    const s1 = Number(settings.scholarship_1st ?? 10000);
    const s2 = Number(settings.scholarship_2nd ?? 8000);
    const s3 = Number(settings.scholarship_3rd ?? 5000);
    const s4To20 = Number(settings.scholarship_4_to_20 ?? 1000);
    const sPart = Number(settings.scholarship_participation ?? 500);

    const giftLabel = settings.cash_prize_consolation || "आकर्षक उपहार (Top 20 Winners)";

    return sorted.map((sub, index) => {
      const p = this.getRegistrationById(sub.participant_id);
      const rank = index + 1;
      let prizeText = `📜 ₹${sPart}/- BMB कोर्स स्कॉलरशिप व प्रमाण-पत्र`;
      let prizeType = "scholarship_500";
      let cashPrize = 0;
      let scholarshipAmount = sPart;

      if (rank === 1) {
        cashPrize = p1Cash;
        scholarshipAmount = s1;
        prizeText = `🥇 1st Prize: ₹${p1Cash.toLocaleString("en-IN")}/- नकद + ₹${s1.toLocaleString("en-IN")}/- BMB कोर्स स्कॉलरशिप`;
        prizeType = "cash_3000";
      } else if (rank === 2) {
        cashPrize = p2Cash;
        scholarshipAmount = s2;
        prizeText = `🥈 2nd Prize: ₹${p2Cash.toLocaleString("en-IN")}/- नकद + ₹${s2.toLocaleString("en-IN")}/- BMB कोर्स स्कॉलरशिप`;
        prizeType = "cash_2000";
      } else if (rank === 3) {
        cashPrize = p3Cash;
        scholarshipAmount = s3;
        prizeText = `🥉 3rd Prize: ₹${p3Cash.toLocaleString("en-IN")}/- नकद + ₹${s3.toLocaleString("en-IN")}/- BMB कोर्स स्कॉलरशिप`;
        prizeType = "cash_1500";
      } else if (rank >= 4 && rank <= 20) {
        cashPrize = 0;
        scholarshipAmount = s4To20;
        prizeText = `🎁 ${giftLabel} + ₹${s4To20.toLocaleString("en-IN")}/- BMB स्कॉलरशिप (Rank #${rank})`;
        prizeType = "gift_scholarship_1000";
      }

      return {
        rank,
        id: sub.id,
        participantId: sub.participant_id,
        displayName: p?.name || p?.display_name || "BMB Scholar",
        city: p?.city || p?.district || "",
        score: sub.score,
        totalQuestions: sub.total_questions || 10,
        durationSeconds: sub.duration_seconds,
        submittedAt: sub.created_at,
        prizeText,
        prizeType,
        cashPrize,
        scholarshipAmount
      };
    });
  }

  public getAllScholarshipSubmissions(): {
    id: string;
    attemptId: string;
    participantId: string;
    participantName: string;
    whatsappNumber: string;
    city: string;
    score: number;
    totalQuestions: number;
    durationSeconds: number;
    rank: number;
    prizeText: string;
    prizeType: string;
    submittedAt: string;
  }[] {
    const winners = this.getScholarshipWinners();
    return winners.map(w => {
      const sub = this.data.scholarship_submissions?.find(s => s.id === w.id);
      const p = this.getRegistrationById(w.participantId);
      return {
        id: w.id,
        attemptId: sub?.attempt_id || "",
        participantId: w.participantId,
        participantName: p?.name || w.displayName,
        whatsappNumber: p?.whatsapp_number || "N/A",
        city: p?.city || w.city || "N/A",
        score: w.score,
        totalQuestions: w.totalQuestions,
        durationSeconds: w.durationSeconds,
        rank: w.rank,
        prizeText: w.prizeText,
        prizeType: w.prizeType,
        submittedAt: w.submittedAt
      };
    });
  }

  public resetScholarshipAttempt(participantId: string): boolean {
    if (!this.data.scholarship_attempts) return false;
    this.data.scholarship_attempts = this.data.scholarship_attempts.filter(a => a.participant_id !== participantId);
    this.data.scholarship_submissions = this.data.scholarship_submissions.filter(s => s.participant_id !== participantId);
    this.persist();
    return true;
  }

  public clearAllScholarshipData(): { clearedAttempts: number; clearedSubmissions: number } {
    const clearedAttempts = this.data.scholarship_attempts ? this.data.scholarship_attempts.length : 0;
    const clearedSubmissions = this.data.scholarship_submissions ? this.data.scholarship_submissions.length : 0;
    this.data.scholarship_attempts = [];
    this.data.scholarship_submissions = [];

    if (this.data.admission_leads) {
      for (const lead of this.data.admission_leads) {
        if (lead.notes && lead.notes.includes("[Scholarship Quiz:")) {
          lead.notes = lead.notes.replace(/\s*\[Scholarship Quiz:[^\]]*\]/g, "").trim();
        }
      }
    }
    this.persist();
    return { clearedAttempts, clearedSubmissions };
  }

  public clearAllQuizData(): { clearedAttempts: number; clearedResults: number } {
    const clearedAttempts = this.data.quiz_attempts ? this.data.quiz_attempts.length : 0;
    const clearedResults = this.data.quiz_results ? this.data.quiz_results.length : 0;
    this.data.quiz_attempts = [];
    this.data.quiz_questions = [];
    this.data.quiz_answers = [];
    this.data.quiz_results = [];

    if (this.data.admission_leads) {
      for (const lead of this.data.admission_leads) {
        lead.quiz_score = undefined;
      }
    }
    this.persist();
    return { clearedAttempts, clearedResults };
  }

  public resetQuizAttempt(participantId: string): boolean {
    if (!this.data.quiz_attempts) return false;
    const attempts = this.data.quiz_attempts.filter(a => a.participant_id === participantId);
    const attemptIds = new Set(attempts.map(a => a.id));
    this.data.quiz_attempts = this.data.quiz_attempts.filter(a => a.participant_id !== participantId);
    if (this.data.quiz_results) {
      this.data.quiz_results = this.data.quiz_results.filter(r => !attemptIds.has(r.attempt_id));
    }
    if (this.data.quiz_answers) {
      this.data.quiz_answers = this.data.quiz_answers.filter(ans => !attemptIds.has(ans.attempt_id));
    }
    if (this.data.admission_leads) {
      const lead = this.data.admission_leads.find(l => l.participant_id === participantId);
      if (lead) {
        lead.quiz_score = undefined;
      }
    }
    this.persist();
    return true;
  }

  // --- ROUND 1 LEADERBOARD & PASS MANAGEMENT ---
  public getRound1Leaderboard(eventId?: string): {
    rank: number;
    id: string;
    participantId: string;
    displayName: string;
    whatsappNumber: string;
    city: string;
    score: number;
    totalQuestions: number;
    durationSeconds: number;
    submittedAt: string;
    isQualified: boolean;
    isFreePassWinner: boolean;
    prizeText: string;
  }[] {
    let results = [...(this.data.quiz_results || [])];
    if (eventId) {
      results = results.filter(r => r.seminar_event_id === eventId);
    }

    // Qualification rules as specified:
    // 1. Must complete in <= 120 seconds
    // 2. Must score at least 3 correct out of 5
    const qualified = results.filter(r => (r.duration_seconds || 0) <= 120 && (r.score || 0) >= 3);
    const disqualified = results.filter(r => !((r.duration_seconds || 0) <= 120 && (r.score || 0) >= 3));

    // Sort qualified: highest score first, then least time taken, then earliest submission
    qualified.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.duration_seconds !== b.duration_seconds) return a.duration_seconds - b.duration_seconds;
      return a.created_at.localeCompare(b.created_at);
    });

    // Sort disqualified: highest score, then lowest time, then earliest submission
    disqualified.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.duration_seconds !== b.duration_seconds) return a.duration_seconds - b.duration_seconds;
      return a.created_at.localeCompare(b.created_at);
    });

    const combined = [...qualified, ...disqualified];

    const settings = this.getSeminarSettings();
    const freePassLimit = settings.round1_free_pass_winners_count || 10;

    return combined.map((res, index) => {
      const p = this.getRegistrationById(res.participant_id);
      const isQualified = (res.duration_seconds || 0) <= 120 && (res.score || 0) >= 3;
      // ONLY qualified participants who are ranked within top 10 get the 100% free pass!
      const isFreePassWinner = isQualified && (index < qualified.length) && (index < freePassLimit);
      const rank = index + 1;
      const prizeText = isFreePassWinner
        ? `🎟️ BMB AI Seminar Free Pass (मूल्य ₹500/- बिल्कुल मुफ्त) - Top 10 Winner`
        : `विशेष सेमिनार ऑफर: ₹199/- में ₹500/- का पास (₹301/- छूट)`;

      return {
        rank,
        id: res.id,
        participantId: res.participant_id,
        displayName: p?.name || p?.display_name || "BMB Student",
        whatsappNumber: p?.whatsapp_number || "",
        city: p?.city || p?.district || "",
        score: res.score,
        totalQuestions: 5,
        durationSeconds: res.duration_seconds,
        submittedAt: res.created_at,
        isQualified,
        isFreePassWinner,
        prizeText
      };
    });
  }

  public grantFreePassIfEligible(participantId: string): SeminarPassPurchase | null {
    if (!this.data.pass_purchases) this.data.pass_purchases = [];
    const existing = this.data.pass_purchases.find(p => p.participant_id === participantId);
    if (existing) return existing;

    const leaderboard = this.getRound1Leaderboard();
    const entry = leaderboard.find(l => l.participantId === participantId);
    if (entry && entry.isFreePassWinner) {
      const participant = this.getRegistrationById(participantId);
      const now = new Date().toISOString();
      const invoiceNumber = `INV-FREE-${Date.now().toString().slice(-6)}`;
      const newPass: SeminarPassPurchase = {
        id: `pass-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        participant_id: participantId,
        registration_id: participantId,
        participant_name: participant?.name || entry.displayName,
        whatsapp_number: participant?.whatsapp_number || entry.whatsappNumber,
        amount_paid: 0,
        original_amount: 500,
        payment_method: "free_pass",
        upi_id: "N/A",
        utr_number: "FREE-PASS-ROUND1-WINNER",
        verification_status: "verified",
        verified_at: now,
        invoice_number: invoiceNumber,
        pass_type: "round1_winner_free",
        notes: "Round 1 Top 10 Winner - 100% Free Pass",
        whatsapp_sent: true,
        created_at: now
      };
      this.data.pass_purchases.push(newPass);
      this.persist();
      return newPass;
    }
    return null;
  }

  public createPassPurchase(purchase: {
    participant_id: string;
    registration_id: string;
    participant_name: string;
    whatsapp_number: string;
    amount_paid: number;
    original_amount?: number;
    payment_method: "upi_qr" | "free_pass";
    upi_id: string;
    utr_number: string;
    screenshot_url?: string;
    screenshot_filename?: string;
    verification_status?: "verified" | "pending" | "rejected";
    notes?: string;
  }): SeminarPassPurchase {
    if (!this.data.pass_purchases) this.data.pass_purchases = [];
    const now = new Date().toISOString();
    const invoiceNumber = `INV-BMB-${Date.now().toString().slice(-6)}`;

    const newPass: SeminarPassPurchase = {
      id: `pass-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      participant_id: purchase.participant_id,
      registration_id: purchase.registration_id,
      participant_name: purchase.participant_name,
      whatsapp_number: purchase.whatsapp_number,
      amount_paid: purchase.amount_paid,
      original_amount: purchase.original_amount ?? 500,
      payment_method: purchase.payment_method,
      upi_id: purchase.upi_id,
      utr_number: purchase.utr_number,
      screenshot_url: purchase.screenshot_url,
      screenshot_filename: purchase.screenshot_filename,
      verification_status: purchase.verification_status || "verified",
      verified_at: now,
      invoice_number: invoiceNumber,
      pass_type: purchase.payment_method === "free_pass" ? "round1_winner_free" : "discounted_199",
      notes: purchase.notes || "BMB Educom AI Seminar Official Pass",
      whatsapp_sent: false,
      created_at: now
    };

    this.data.pass_purchases.push(newPass);
    this.persist();
    return newPass;
  }

  public getAllPassPurchases(): SeminarPassPurchase[] {
    if (!this.data.pass_purchases) this.data.pass_purchases = [];
    return [...this.data.pass_purchases].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  public getPassPurchaseByParticipant(participantId: string): SeminarPassPurchase | undefined {
    if (!this.data.pass_purchases) return undefined;
    return this.data.pass_purchases.find(p => p.participant_id === participantId && p.verification_status === "verified");
  }

  public isParticipantEligibleForRound2(participantId: string): {
    eligible: boolean;
    reason: "free_pass_winner" | "paid_pass" | "not_eligible";
    pass?: SeminarPassPurchase;
  } {
    const pass = this.getPassPurchaseByParticipant(participantId);
    if (pass && pass.verification_status === "verified") {
      return {
        eligible: true,
        reason: (pass.payment_method === "free_pass" || pass.pass_type === "round1_winner_free") ? "free_pass_winner" : "paid_pass",
        pass
      };
    }

    const freePass = this.grantFreePassIfEligible(participantId);
    if (freePass) {
      return {
        eligible: true,
        reason: "free_pass_winner",
        pass: freePass
      };
    }

    return {
      eligible: false,
      reason: "not_eligible"
    };
  }

  public updatePassPurchase(id: string, updates: Partial<SeminarPassPurchase>): SeminarPassPurchase | null {
    if (!this.data.pass_purchases) return null;
    const item = this.data.pass_purchases.find(p => p.id === id);
    if (!item) return null;
    Object.assign(item, updates);
    this.persist();
    return item;
  }

  // --- CRM LEADS ---
  public createAdmissionLead(lead: Omit<AdmissionLead, "id" | "created_at" | "updated_at">): AdmissionLead {
    const now = new Date().toISOString();
    const newLead: AdmissionLead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...lead,
      created_at: now,
      updated_at: now
    };
    this.data.admission_leads.push(newLead);
    this.persist();
    return newLead;
  }

  public getAllAdmissionLeads(): (AdmissionLead & { participant?: SeminarRegistration })[] {
    return this.data.admission_leads.map(lead => {
      const participant = this.getRegistrationById(lead.participant_id);
      return {
        ...lead,
        participant
      };
    }).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  public updateAdmissionLead(id: string, updates: Partial<AdmissionLead>): AdmissionLead | null {
    const idx = this.data.admission_leads.findIndex(l => l.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.data.admission_leads[idx] = {
      ...this.data.admission_leads[idx],
      ...updates,
      updated_at: now
    };
    this.persist();
    return this.data.admission_leads[idx];
  }

  // --- WHATSAPP MESSAGES ---
  public logWhatsAppMessage(msg: Omit<WhatsAppMessage, "id" | "created_at">): WhatsAppMessage {
    const now = new Date().toISOString();
    const newMsg: WhatsAppMessage = {
      id: `wa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...msg,
      created_at: now
    };
    this.data.whatsapp_messages.push(newMsg);
    this.persist();
    return newMsg;
  }

  public updateWhatsAppMessageStatus(id: string, status: WhatsAppMessage["status"], error?: string): void {
    const msg = this.data.whatsapp_messages.find(m => m.id === id);
    if (msg) {
      msg.status = status;
      if (status === "sent") msg.sent_at = new Date().toISOString();
      if (status === "delivered") msg.delivered_at = new Date().toISOString();
      if (status === "read") msg.read_at = new Date().toISOString();
      if (error) msg.error_message = error;
      this.persist();
    }
  }

  public getAllWhatsAppMessages(): (WhatsAppMessage & { participantName?: string })[] {
    return this.data.whatsapp_messages.map(m => {
      const p = this.getRegistrationById(m.participant_id);
      return {
        ...m,
        participantName: p?.name || "Participant"
      };
    }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  // --- BMB KNOWLEDGE BASE ---
  public getKnowledgeBase(): BMBKnowledgeBaseItem[] {
    return this.data.bmb_knowledge_base.filter(k => k.active);
  }

  public updateKnowledgeBaseItem(id: string, updates: Partial<BMBKnowledgeBaseItem>): BMBKnowledgeBaseItem | null {
    const idx = this.data.bmb_knowledge_base.findIndex(k => k.id === id);
    if (idx === -1) return null;
    this.data.bmb_knowledge_base[idx] = {
      ...this.data.bmb_knowledge_base[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.persist();
    return this.data.bmb_knowledge_base[idx];
  }

  // --- SEMINAR CONTENT SCENES ---
  public getAllSeminarScenes(): SeminarContentScene[] {
    return [...this.data.seminar_content].sort((a, b) => a.display_order - b.display_order);
  }

  public updateSeminarScene(id: string, updates: Partial<SeminarContentScene>): SeminarContentScene | null {
    const idx = this.data.seminar_content.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.seminar_content[idx] = {
      ...this.data.seminar_content[idx],
      ...updates
    };
    this.persist();
    return this.data.seminar_content[idx];
  }

  // --- AUDIT LOGS ---
  public logAudit(log: Omit<AuditLog, "id" | "created_at">): void {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...log,
      created_at: new Date().toISOString()
    };
    this.data.audit_logs.push(newLog);
    this.persist();
  }

  public getAllAuditLogs(): AuditLog[] {
    return [...this.data.audit_logs].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  // --- QUESTION GENERATION LOGS ---
  public logQuestionGeneration(log: Omit<QuestionGenerationLog, "id" | "created_at">): void {
    const newLog: QuestionGenerationLog = {
      id: `qlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...log,
      created_at: new Date().toISOString()
    };
    this.data.question_generation_logs.push(newLog);
    this.persist();
  }

  public getAllQuestionGenLogs(): QuestionGenerationLog[] {
    return [...this.data.question_generation_logs].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  // --- ADMIN AUTH & RECOVERY ---
  public hasAdminUsers(): boolean {
    return Array.isArray(this.data.admin_users) && this.data.admin_users.length > 0;
  }

  public getAllAdminUsers(): AdminUser[] {
    return this.data.admin_users || [];
  }

  public async createSuperAdminUser(admin: {
    name: string;
    email?: string;
    whatsapp_number: string;
    password_hash: string;
  }): Promise<AdminUser> {
    const now = new Date().toISOString();
    const newAdmin: AdminUser = {
      id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: admin.name.trim(),
      email: (admin.email || "").trim().toLowerCase(),
      whatsapp_number: admin.whatsapp_number.trim(),
      password_hash: admin.password_hash,
      role: "superadmin",
      status: "active",
      created_at: now,
      updated_at: now
    };
    if (!this.data.admin_users) {
      this.data.admin_users = [];
    }
    this.data.admin_users.push(newAdmin);

    // Persist to Postgres (idempotent via ON CONFLICT)
    if (isPostgresConfigured()) {
      const result = await query(
        `INSERT INTO admin_users
          (id, name, email, whatsapp_number, password_hash, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           whatsapp_number = EXCLUDED.whatsapp_number,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           status = EXCLUDED.status,
           updated_at = NOW()`,
        [
          newAdmin.id, newAdmin.name, newAdmin.email || null,
          newAdmin.whatsapp_number, newAdmin.password_hash,
          newAdmin.role, newAdmin.status
        ]
      );
      if (result === null) {
        console.warn("[db] Postgres createSuperAdminUser failed — in-memory only");
      } else {
        console.log(`[db] persisted superadmin ${newAdmin.id} to Postgres`);
      }
    }

    this.persist();
    return newAdmin;
  }

  public getAdminByEmail(email: string): AdminUser | undefined {
    return this.data.admin_users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getAdminById(id: string): AdminUser | undefined {
    return this.data.admin_users.find(u => u.id === id);
  }

  public findAdminByIdentifier(identifier: string): AdminUser | undefined {
    const raw = identifier.trim();
    const cleanDigits = raw.replace(/\D/g, "");
    
    return this.data.admin_users.find(u => {
      // Check email match
      if (u.email.toLowerCase() === raw.toLowerCase()) return true;

      // Check name match
      if (u.name.toLowerCase() === raw.toLowerCase()) return true;

      // Check whatsapp number match (support 10-digit, 91 prefix, etc.)
      if (cleanDigits.length >= 10 && u.whatsapp_number) {
        const uDigits = u.whatsapp_number.replace(/\D/g, "");
        if (uDigits === cleanDigits) return true;
        if (uDigits.endsWith(cleanDigits) || cleanDigits.endsWith(uDigits)) return true;
      }

      return false;
    });
  }

  public async setAdminResetOTP(adminId: string, otp: string, expiresInMinutes: number = 15): Promise<boolean> {
    const admin = this.data.admin_users.find(u => u.id === adminId);
    if (!admin) return false;

    admin.reset_otp = otp;
    admin.reset_otp_expires_at = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
    admin.updated_at = new Date().toISOString();

    if (isPostgresConfigured()) {
      await query(`
        UPDATE admin_users
        SET reset_otp = $1, reset_otp_expires_at = NOW() + ($2 * INTERVAL '1 minute'), updated_at = NOW()
        WHERE id = $3
      `, [otp, expiresInMinutes, adminId]);
    }

    this.persist();
    return true;
  }

  public async verifyAndResetAdminPassword(
    identifier: string,
    otp: string,
    newPasswordHash: string
  ): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
    const admin = this.findAdminByIdentifier(identifier);
    if (!admin) {
      return { success: false, error: "एडमिन अकाउंट नहीं मिला (Admin user not found)" };
    }

    if (!admin.reset_otp || admin.reset_otp !== otp.trim()) {
      return { success: false, error: "अमान्य OTP कोड। कृपया सही 6-अंकों का OTP दर्ज करें। (Invalid OTP code)" };
    }

    if (admin.reset_otp_expires_at && new Date(admin.reset_otp_expires_at).getTime() < Date.now()) {
      return { success: false, error: "OTP की समय सीमा समाप्त हो चुकी है। कृपया नया OTP मंगवाएं। (OTP has expired)" };
    }

    // Success - update password and clear OTP
    admin.password_hash = newPasswordHash;
    admin.reset_otp = undefined;
    admin.reset_otp_expires_at = undefined;
    admin.updated_at = new Date().toISOString();

    if (isPostgresConfigured()) {
      await query(`
        UPDATE admin_users
        SET password_hash = $1, reset_otp = NULL, reset_otp_expires_at = NULL, updated_at = NOW()
        WHERE id = $2
      `, [newPasswordHash, admin.id]);
    }

    this.persist();

    return { success: true, admin };
  }

  public async updateAdminProfile(
    id: string,
    updates: { name?: string; email?: string; whatsapp_number?: string; newPassword?: string }
  ): Promise<AdminUser | null> {
    const admin = this.data.admin_users.find(u => u.id === id);
    if (!admin) return null;

    if (updates.name) admin.name = updates.name.trim();
    if (updates.email) admin.email = updates.email.trim();
    if (updates.whatsapp_number) admin.whatsapp_number = updates.whatsapp_number.trim();

    if (updates.newPassword) {
      const salt = await bcrypt.genSalt(10);
      admin.password_hash = await bcrypt.hash(updates.newPassword, salt);
    }

    admin.updated_at = new Date().toISOString();

    if (isPostgresConfigured()) {
      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      if (updates.name) { setClauses.push(`name = $${paramIdx++}`); params.push(admin.name); }
      if (updates.email) { setClauses.push(`email = $${paramIdx++}`); params.push(admin.email); }
      if (updates.whatsapp_number) { setClauses.push(`whatsapp_number = $${paramIdx++}`); params.push(admin.whatsapp_number); }
      if (updates.newPassword) { setClauses.push(`password_hash = $${paramIdx++}`); params.push(admin.password_hash); }

      if (setClauses.length > 0) {
        params.push(id);
        const sql = `UPDATE admin_users SET ${setClauses.join(", ")}, updated_at = NOW() WHERE id = $${paramIdx}`;
        const result = await query(sql, params);
        if (result === null) {
          console.warn("[db] Postgres updateAdminProfile failed — in-memory only");
        } else {
          console.log(`[db] updated admin ${id} in Postgres`);
        }
      }
    }

    this.persist();
    return admin;
  }

  public updateAdminLastLogin(id: string): void {
    const admin = this.data.admin_users.find(u => u.id === id);
    if (admin) {
      admin.last_login_at = new Date().toISOString();

      if (isPostgresConfigured()) {
        query(`UPDATE admin_users SET last_login_at = NOW() WHERE id = $1`, [id])
          .catch(err => console.error("[db] Postgres updateAdminLastLogin failed:", err));
      }

      this.persist();
    }
  }

  // --- DASHBOARD AGGREGATES ---
  public getDashboardMetrics(eventId: string): {
    totalRegistrations: number;
    activeEventRegistrations: number;
    quizCompleted: number;
    averageScore: number;
    averageDuration: number;
    topPerformersCount: number;
    leadsByStatus: Record<string, number>;
    whatsAppStats: { total: number; sent: number; pending: number; failed: number };
  } {
    const allRegs = this.data.seminar_registrations;
    const eventRegs = allRegs.filter(r => r.seminar_event_id === eventId);
    const scholarshipSubs = this.data.scholarship_submissions || [];

    const quizCompleted = scholarshipSubs.length;
    const totalScore = scholarshipSubs.reduce((acc, r) => acc + r.score, 0);
    const totalDuration = scholarshipSubs.reduce((acc, r) => acc + r.duration_seconds, 0);
    const averageScore = quizCompleted > 0 ? Number((totalScore / quizCompleted).toFixed(1)) : 0;
    const averageDuration = quizCompleted > 0 ? Math.round(totalDuration / quizCompleted) : 0;
    const topPerformersCount = scholarshipSubs.filter(r => r.score === 20).length;

    const leadsByStatus: Record<string, number> = {};
    for (const lead of this.data.admission_leads) {
      leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
    }

    const whatsAppStats = {
      total: this.data.whatsapp_messages.length,
      sent: this.data.whatsapp_messages.filter(m => m.status === "sent" || m.status === "delivered" || m.status === "read").length,
      pending: this.data.whatsapp_messages.filter(m => m.status === "queued" || m.status === "pending_configuration").length,
      failed: this.data.whatsapp_messages.filter(m => m.status === "failed").length
    };

    return {
      totalRegistrations: allRegs.length,
      activeEventRegistrations: eventRegs.length,
      quizCompleted,
      averageScore,
      averageDuration,
      topPerformersCount,
      leadsByStatus,
      whatsAppStats
    };
  }

  // --- EXPORT DATABASE BACKUP ---
  public getFullBackupJSON(): string {
    return JSON.stringify(this.data, null, 2);
  }

  // --- STATE INSPECTION & RESTORATION (FOR TEST ISOLATION & MAINTENANCE) ---
  public getDataState(): DatabaseState {
    return JSON.parse(JSON.stringify(this.data));
  }

  public restoreDataState(state: DatabaseState): void {
    this.data = JSON.parse(JSON.stringify(state));
    this.persist();
  }

  public clearAllRegistrationAndLeadData(): void {
    this.data.seminar_registrations = [];
    this.data.quiz_attempts = [];
    this.data.quiz_questions = [];
    this.data.quiz_answers = [];
    this.data.quiz_results = [];
    this.data.scholarship_attempts = [];
    this.data.scholarship_submissions = [];
    this.data.whatsapp_messages = [];
    this.data.admission_leads = [];
    this.data.question_generation_logs = [];
    this.data.audit_logs = [];
    this.persist();
  }

  public async resetDatabaseToZero(): Promise<void> {
    const now = new Date().toISOString();
    this.data.seminar_registrations = [];
    this.data.quiz_attempts = [];
    this.data.quiz_questions = [];
    this.data.quiz_answers = [];
    this.data.quiz_results = [];
    this.data.scholarship_attempts = [];
    this.data.scholarship_submissions = [];
    this.data.whatsapp_messages = [];
    this.data.admission_leads = [];
    this.data.question_generation_logs = [];
    this.data.audit_logs = [];
    this.data.seminar_events = [];

    // Reset Admin Users to 0 (No hardcoded credentials, admin registers their own)
    this.data.admin_users = [];

    // Reset Seminar Settings with no hardcoded Friday
    this.data.seminar_settings = {
      seminar_date_hi: "आगामी सेमिनार",
      seminar_date_en: "Upcoming Seminar",
      seminar_time: "11:00 AM – 4:00 PM IST",
      venue_location: "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)",
      reporting_time: "10:45 AM",
      live_stream_url: "https://drive.google.com/file/d/1lxitztPNHlEyRCzR720OVvbn_QoHXn12/preview?autoplay=1&loop=1",
      is_registration_open: true,
      is_stage2_active: false,
      stage2_activated_at: undefined,
      cash_prize_1st: 1000,
      cash_prize_2nd: 500,
      cash_prize_3rd: 200,
      cash_prize_consolation: "आकर्षक उपहार (Top 7 Participants)",
      scholarship_1st: 10000,
      scholarship_2nd: 8000,
      scholarship_3rd: 5000,
      scholarship_4_to_20: 1000,
      scholarship_participation: 500,
      upi_id: "himanchal310@okaxis",
      upi_phone: "9301056006",
      pass_price_discounted: 199,
      pass_price_original: 500,
      round1_questions_count: 5,
      round1_duration_seconds: 120,
      round2_questions_count: 10,
      round2_duration_seconds: 300,
      round1_free_pass_winners_count: 10,
      round2_winners_count: 20,
      updated_at: now
    };

    // Create initial clean active event
    this.data.seminar_events = [
      {
        id: "seminar-main-event",
        event_date: new Date().toISOString().split("T")[0],
        start_time: "11:00 AM – 4:00 PM IST",
        end_time: "16:00",
        timezone: "Asia/Kolkata",
        title: "BMB Educom AI Seminar — Upcoming Seminar",
        description: "Official AI Learning, Quiz & Admission Event (आगामी सेमिनार)",
        status: "active",
        registration_open: true,
        created_at: now,
        updated_at: now
      }
    ];

    this.persist();
  }
}

export const db = new DatabaseService();
