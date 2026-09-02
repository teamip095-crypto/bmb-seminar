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
  WhatsAppMessage,
  AdmissionLead,
  BMBKnowledgeBaseItem,
  SeminarContentScene,
  QuestionGenerationLog,
  AuditLog,
  SeminarSettings
} from "./schema";
import { SEED_QUESTION_BANK } from "../ai/question-bank-seed";
import { VERIFIED_BMB_KNOWLEDGE_BASE, SEMINAR_27_SCENES_SEED } from "../content/seminar-content-seed";
import { query, ensureSchema, isPostgresConfigured } from "./supabase-client";

export interface DatabaseState {
  admin_users: AdminUser[];
  seminar_events: SeminarEvent[];
  seminar_registrations: SeminarRegistration[];
  seminar_settings?: SeminarSettings;
  question_bank: QuestionBankItem[];
  quiz_attempts: QuizAttempt[];
  quiz_questions: QuizQuestion[];
  quiz_answers: QuizAnswer[];
  quiz_results: QuizResult[];
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
    this.dbFilePath = path.resolve(process.cwd(), ".data", "bmb_production_store.json");
    this.data = {
      admin_users: [],
      seminar_events: [],
      seminar_registrations: [],
      question_bank: [],
      quiz_attempts: [],
      quiz_questions: [],
      quiz_answers: [],
      quiz_results: [],
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

    // Try Postgres first — if available, ensure schema and load admins from there.
    if (isPostgresConfigured()) {
      try {
        await ensureSchema();
        await this.loadAdminsFromPostgres();
        await this.seedAdminsIfEmpty();
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
          this.data = merged;
        }
      }
    } catch (err) {
      console.warn("Could not read stored DB file, starting clean with seeds:", err);
    }

    // Seed Admin if not present
    if (this.data.admin_users.length === 0) {
      const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD || "ipgroup@9301056006";
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(defaultPassword, salt);
      const now = new Date().toISOString();

      this.data.admin_users.push({
        id: "admin-root-001",
        name: "BMB Super Admin",
        email: "ipgroup2002@gmail.com",
        whatsapp_number: "9301056006",
        password_hash: hash,
        role: "superadmin",
        status: "active",
        created_at: now,
        updated_at: now
      });

      // Counselor account
      const counselorHash = await bcrypt.hash("ipgroup@9301056006", salt);
      this.data.admin_users.push({
        id: "counselor-001",
        name: "Admission Lead Counselor",
        email: "counselor@bmbeducom.com",
        whatsapp_number: "9301056006",
        password_hash: counselorHash,
        role: "counselor",
        status: "active",
        created_at: now,
        updated_at: now
      });
    } else {
      // Ensure superadmin has a whatsapp_number if missing
      for (const admin of this.data.admin_users) {
        if (!admin.whatsapp_number) {
          admin.whatsapp_number = admin.role === "superadmin" ? "9301056006" : "9301056006";
        }
      }
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
        seminar_date_hi: "आगामी शुक्रवार",
        seminar_date_en: "Upcoming Friday",
        seminar_time: "11:00 AM – 4:00 PM IST",
        venue_location: "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)",
        reporting_time: "10:45 AM",
        is_registration_open: true,
        updated_at: new Date().toISOString()
      };
    }

    this.persist();
    this.isInitialized = true;
  }

  // ==========================================
  // POSTGRES-BACKED ADMIN METHODS (Vercel stateless-safe)
  // These override the in-memory versions so that admin credentials
  // persist across Vercel cold starts.
  // ==========================================

  /** Load admins from Postgres into in-memory cache. */
  private async loadAdminsFromPostgres(): Promise<void> {
    if (!isPostgresConfigured()) return;
    const result = await query(`
      SELECT id, name, email, whatsapp_number, password_hash, role, status,
             reset_otp, reset_otp_expires_at, last_login_at, created_at, updated_at
      FROM admin_users
      ORDER BY created_at ASC
    `);
    if (!result) return;

    const rows = result.rows as any[];
    if (rows.length > 0) {
      this.data.admin_users = rows.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        whatsapp_number: r.whatsapp_number || undefined,
        password_hash: r.password_hash,
        role: r.role,
        status: r.status,
        reset_otp: r.reset_otp || undefined,
        reset_otp_expires_at: r.reset_otp_expires_at ? new Date(r.reset_otp_expires_at).toISOString() : undefined,
        last_login_at: r.last_login_at ? new Date(r.last_login_at).toISOString() : undefined,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString()
      }));
      console.log(`[db] loaded ${rows.length} admin users from Postgres`);
    }
  }

  /** Seed superadmin into Postgres if no admin_users exist there. */
  private async seedAdminsIfEmpty(): Promise<void> {
    if (!isPostgresConfigured()) return;
    if (this.data.admin_users.length > 0) return;

    const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD || "ipgroup@9301056006";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(defaultPassword, salt);

    const admin: AdminUser = {
      id: "admin-root-001",
      name: "BMB Super Admin",
      email: "ipgroup2002@gmail.com",
      whatsapp_number: "9301056006",
      password_hash: hash,
      role: "superadmin",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = await query(`
      INSERT INTO admin_users (id, name, email, whatsapp_number, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        whatsapp_number = EXCLUDED.whatsapp_number,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW()
    `, [admin.id, admin.name, admin.email, admin.whatsapp_number, admin.password_hash, admin.role, admin.status]);

    if (result !== null) {
      this.data.admin_users.push(admin);
      console.log(`[db] seeded superadmin into Postgres: ${admin.email}`);
    }
  }


  // --- SEMINAR SETTINGS (ADMIN CONTROLLED) ---
  public getSeminarSettings(): SeminarSettings {
    if (!this.data.seminar_settings) {
      this.data.seminar_settings = {
        seminar_date_hi: "आगामी शुक्रवार",
        seminar_date_en: "Upcoming Friday",
        seminar_time: "11:00 AM – 4:00 PM IST",
        venue_location: "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)",
        reporting_time: "10:45 AM",
        is_registration_open: true,
        updated_at: new Date().toISOString()
      };
      this.persist();
    }
    return this.data.seminar_settings;
  }

  public updateSeminarSettings(updates: Partial<SeminarSettings>): SeminarSettings {
    const current = this.getSeminarSettings();
    this.data.seminar_settings = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString()
    };
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

  private persist(): void {
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

    // Automatically create corresponding CRM Lead
    const extraInfo = [reg.education, reg.occupation].filter(Boolean).join(", ");
    this.createAdmissionLead({
      participant_id: newReg.id,
      status: "New",
      interest: "high",
      notes: `Registered for Friday Seminar: ${reg.seminar_event_id}${extraInfo ? ` (${extraInfo})` : ""}. Seat: ${seatNumber}. Address: ${reg.full_address}.`,
      quiz_score: undefined
    });

    this.persist();
    return newReg;
  }

  public getRegistrationByTokenHash(tokenHash: string): SeminarRegistration | undefined {
    return this.data.seminar_registrations.find(r => r.secure_token_hash === tokenHash);
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
      duration_seconds: duration,
      result_status: resultStatus,
      created_at: submittedAt
    };
    this.data.quiz_results.push(newResult);

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

    // Persist to Postgres if available
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

    // Persist to Postgres if available
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

    // Persist to Postgres if available
    if (isPostgresConfigured()) {
      // Build dynamic SET clause based on which fields were provided
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

      // Persist to Postgres (fire-and-forget since the method signature is sync)
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
    const eventResults = this.data.quiz_results.filter(r => r.seminar_event_id === eventId);

    const quizCompleted = eventResults.length;
    const totalScore = eventResults.reduce((acc, r) => acc + r.score, 0);
    const totalDuration = eventResults.reduce((acc, r) => acc + r.duration_seconds, 0);
    const averageScore = quizCompleted > 0 ? Number((totalScore / quizCompleted).toFixed(1)) : 0;
    const averageDuration = quizCompleted > 0 ? Math.round(totalDuration / quizCompleted) : 0;
    const topPerformersCount = eventResults.filter(r => r.score === 4).length;

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
    this.data.whatsapp_messages = [];
    this.data.admission_leads = [];
    this.data.question_generation_logs = [];
    this.data.audit_logs = [];
    this.persist();
  }
}

export const db = new DatabaseService();
