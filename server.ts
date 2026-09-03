import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./server/db/database";
import { FridayEngine } from "./server/friday-engine";
import { QuizGenerationService } from "./server/ai/gemini-service";
import { WhatsAppService } from "./server/services/whatsapp-service";
import { GoogleDriveService } from "./server/services/google-drive-service";
import { AntiCheatService } from "./server/services/anti-cheat";
import { ServerPdfService } from "./server/services/pdf-service";
import { ProductionTestSuiteRunner } from "./server/test-suite";
import { ScholarshipService } from "./server/services/scholarship-service";
import {
  RegistrationInputSchema,
  QuizAnswerSubmissionSchema,
  AdminLoginInputSchema,
  AdminForgotPasswordSchema,
  AdminResetPasswordWithOTPSchema,
  AdmissionLeadUpdateSchema,
  SeminarSettingsUpdateSchema,
  AdminAccountUpdateSchema,
  ScholarshipStartSchema,
  ScholarshipSubmissionSchema
} from "./server/db/schema";
import type { IncomingMessage, ServerResponse } from "http";

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "bmb-educom-ai-seminar-secret-jwt-key-2026";

interface AuthRequest extends Request {
  adminUser?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// Module-level Express app — synchronous so Vercel can attach handlers immediately
const app = express();
let initPromise: Promise<void>;

async function startServer(): Promise<void> {
  // Basic Middlewares
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Initialize DB & Seed Data
  try {
    await db.initialize();
  } catch (err) {
    console.error("DB initialization failed (continuing in-memory):", err);
  }

  // Auth Middleware (supports both Authorization header and query token for direct file downloads)
  const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query.token && typeof req.query.token === "string") {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.adminUser = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
  };

  // ==========================================
  // PUBLIC SEMINAR & REGISTRATION API ROUTES
  // ==========================================

  // 1. Get Current Friday Seminar Status (support both /api/seminar/status and /api/seminar/current)
  const getSeminarStatusHandler = async (req: Request, res: Response) => {
    try {
      const seminar = await FridayEngine.getOrCreateCurrentSeminar();
      const settings = db.getSeminarSettings();
      res.json({
        ...seminar,
        formattedDateHi: settings.seminar_date_hi || seminar.formattedDateHi,
        formattedDateEn: settings.seminar_date_en || seminar.formattedDateEn,
        seminarTime: settings.seminar_time || "11:00 AM – 4:00 PM IST",
        venueLocation: settings.venue_location || "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)",
        reportingTime: settings.reporting_time || "10:45 AM",
        isRegistrationOpen: settings.is_registration_open !== undefined ? settings.is_registration_open : seminar.isRegistrationOpen,
        settings
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch current seminar status", details: err?.message });
    }
  };
  app.get("/api/seminar/status", getSeminarStatusHandler);
  app.get("/api/seminar/current", getSeminarStatusHandler);
  app.get("/api/seminar/settings", (req: Request, res: Response) => {
    try {
      const settings = db.getSeminarSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch seminar settings", details: err?.message });
    }
  });

  // 1.1 Live Quiz Winner (Strictly 1 Winner, zero fake records)
  app.get("/api/quiz/winners", (req: Request, res: Response) => {
    try {
      const winners = db.getQuizWinners(1);
      res.json({ winners });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch quiz winner", details: err?.message });
    }
  });

  // 2. Participant Registration
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const parseResult = RegistrationInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors
        });
      }

      const input = parseResult.data;
      const seminar = await FridayEngine.getOrCreateCurrentSeminar();
      const settings = db.getSeminarSettings();

      if (settings.is_registration_open === false) {
        return res.status(400).json({
          error: "Registration is currently closed for this seminar event."
        });
      }

      // Check duplicate registration
      const existing = await db.findRegistrationByPhoneAndEventAsync(input.whatsapp_number, seminar.event.id);
      if (existing) {
        // Return existing registration link securely
        return res.status(200).json({
          message: "You are already registered for this Friday seminar event.",
          isExisting: true,
          registration: {
            id: existing.id,
            registration_id: existing.registration_id,
            name: existing.name,
            whatsapp_number: existing.whatsapp_number,
            city: existing.city,
            seminar_event_id: existing.seminar_event_id,
            created_at: existing.created_at
          },
          seminar: {
            dateEn: settings.seminar_date_en || seminar.formattedDateEn,
            dateHi: settings.seminar_date_hi || seminar.formattedDateHi,
            time: settings.seminar_time || "11:00 AM – 4:00 PM IST",
            venue: settings.venue_location || "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)",
            reportingTime: settings.reporting_time || "10:45 AM"
          }
        });
      }

      // Generate Secure Token & Registration ID
      const rawToken = AntiCheatService.generateSecureToken();
      const tokenHash = AntiCheatService.hashToken(rawToken);
      const registrationId = AntiCheatService.generateRegistrationId(seminar.event.event_date);
      const displayName = AntiCheatService.createDisplayName(input.name, input.city);

      const newRegistration = db.createRegistration({
        seminar_event_id: seminar.event.id,
        registration_id: registrationId,
        name: input.name,
        full_address: input.full_address,
        whatsapp_number: input.whatsapp_number,
        email: input.email,
        education: input.education,
        occupation: input.occupation,
        age_group: input.age_group,
        city: input.city,
        district: input.district,
        whatsapp_consent: input.whatsapp_consent,
        display_name: displayName,
        secure_token_hash: tokenHash
      });

      // Construct Participant Secure Learning Link & Official Brochure Link
      const host = req.get("host") || "localhost:3000";
      const protocol = req.protocol;
      const secureLink = `${protocol}://${host}/learn/${rawToken}`;
      const pdfDownloadUrl = "https://acesse.one/bq9atwd";
      const seatNumber = newRegistration.seat_number || "BMB-SEAT-001";
      const seminarTime = settings.seminar_time || "11:00 AM – 4:00 PM IST";
      const seminarVenue = settings.venue_location || "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)";
      const reportingTime = settings.reporting_time || "10:45 AM";
      const seminarDateHi = settings.seminar_date_hi || seminar.formattedDateHi;
      const seminarDateEn = settings.seminar_date_en || seminar.formattedDateEn;

      // Send / Queue WhatsApp Confirmation
      const waResult = await WhatsAppService.sendRegistrationConfirmation({
        participantId: newRegistration.id,
        phoneNumber: input.whatsapp_number,
        name: input.name,
        registrationId: registrationId,
        seatNumber: seatNumber,
        seminarDateEn,
        seminarDateHi,
        seminarTime,
        seminarVenue,
        reportingTime,
        secureLink,
        pdfDownloadUrl
      });

      res.status(201).json({
        message: "Registration successful!",
        token: rawToken, // Exchanged once upon registration
        secureLink,
        pdfDownloadUrl,
        seatNumber,
        registration: {
          id: newRegistration.id,
          registration_id: newRegistration.registration_id,
          seat_number: seatNumber,
          name: newRegistration.name,
          whatsapp_number: newRegistration.whatsapp_number,
          city: newRegistration.city,
          district: newRegistration.district,
          education: newRegistration.education,
          occupation: newRegistration.occupation,
          seminar_event_id: newRegistration.seminar_event_id
        },
        seminar: {
          dateEn: seminarDateEn,
          dateHi: seminarDateHi,
          time: seminarTime,
          venue: seminarVenue,
          reportingTime: reportingTime
        },
        whatsapp: {
          status: waResult.status,
          directLink: waResult.directWhatsAppLink,
          renderedText: waResult.renderedText,
          error: waResult.error
        }
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      res.status(500).json({ error: "Failed to process registration", details: err?.message });
    }
  });

  // 2.1 Download/View BMB AI Training Brochure Official Link
  const OFFICIAL_BROCHURE_URL = "https://acesse.one/bq9atwd";

  app.get("/api/brochure/download-pdf", async (req: Request, res: Response) => {
    res.redirect(OFFICIAL_BROCHURE_URL);
  });

  app.get("/api/brochure/view-pdf", async (req: Request, res: Response) => {
    res.redirect(OFFICIAL_BROCHURE_URL);
  });

  // 2.2 Direct Mobile-Friendly Video Stream Endpoint
  const GOOGLE_DRIVE_VIDEO_ID = "1lxitztPNHlEyRCzR720OVvbn_QoHXn12";
  app.get("/api/video/stream", async (req: Request, res: Response) => {
    try {
      const driveDownloadUrl = `https://drive.usercontent.google.com/download?id=${GOOGLE_DRIVE_VIDEO_ID}&export=download&confirm=t`;
      
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      };
      if (req.headers.range) {
        headers["Range"] = req.headers.range;
      }

      const response = await fetch(driveDownloadUrl, { headers });
      
      if (!response.ok && response.status !== 206) {
        // Fallback to alternative Google Drive direct link redirect
        return res.redirect(`https://drive.google.com/uc?export=download&id=${GOOGLE_DRIVE_VIDEO_ID}`);
      }

      res.status(response.status);
      response.headers.forEach((val, key) => {
        if (["content-type", "content-length", "content-range", "accept-ranges"].includes(key.toLowerCase())) {
          res.setHeader(key, val);
        }
      });
      res.setHeader("Content-Type", response.headers.get("content-type") || "video/mp4");
      res.setHeader("Accept-Ranges", "bytes");

      if (response.body) {
        // @ts-ignore
        const reader = response.body.getReader();
        const stream = new ReadableStream({
          start(controller) {
            function push() {
              reader.read().then(({ done, value }: any) => {
                if (done) {
                  controller.close();
                  res.end();
                  return;
                }
                res.write(Buffer.from(value));
                push();
              }).catch((err: any) => {
                controller.error(err);
                res.end();
              });
            }
            push();
          }
        });
      } else {
        res.redirect(`https://drive.google.com/uc?export=download&id=${GOOGLE_DRIVE_VIDEO_ID}`);
      }
    } catch (err) {
      console.warn("Direct stream proxy fallback to redirect:", err);
      res.redirect(`https://drive.google.com/uc?export=download&id=${GOOGLE_DRIVE_VIDEO_ID}`);
    }
  });

  // 3. Authenticate Participant by Token
  app.get("/api/participant/:token", async (req: Request, res: Response) => {
    try {
      const rawToken = req.params.token;
      if (!rawToken || rawToken.length < 32) {
        return res.status(400).json({ error: "Invalid secure token format" });
      }

      const tokenHash = AntiCheatService.hashToken(rawToken);
      const participant = await db.findRegistrationByTokenHashAsync(tokenHash);

      if (!participant) {
        return res.status(404).json({ error: "Participant registration not found. Please register first." });
      }

      const seminar = await FridayEngine.getOrCreateCurrentSeminar();
      const existingAttempt = db.getActiveAttemptForParticipant(participant.id, participant.seminar_event_id);
      const allRegistrations = db.getAllRegistrations({ eventId: participant.seminar_event_id });
      const myResult = allRegistrations.find(r => r.id === participant.id)?.quizResult;

      res.json({
        participant: {
          id: participant.id,
          registration_id: participant.registration_id,
          name: participant.name,
          display_name: participant.display_name,
          city: participant.city,
          district: participant.district,
          education: participant.education,
          occupation: participant.occupation,
          seminar_event_id: participant.seminar_event_id
        },
        seminar,
        activeAttemptId: existingAttempt?.id,
        quizResult: myResult || null
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to verify participant", details: err?.message });
    }
  });

  // 4. Get Seminar Content & 27 Scenes for Learning Player
  app.get("/api/seminar/content", (req: Request, res: Response) => {
    try {
      const scenes = db.getAllSeminarScenes();
      const knowledgeBase = db.getKnowledgeBase();
      res.json({
        scenes,
        knowledgeBase,
        totalScenes: scenes.length
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load seminar content", details: err?.message });
    }
  });

  // 5. Start 2-Minute Server-Authoritative Quiz Attempt
  app.post("/api/quiz/start", async (req: Request, res: Response) => {
    try {
      const { participant_token } = req.body;
      if (!participant_token) {
        return res.status(400).json({ error: "Participant token is required" });
      }

      const tokenHash = AntiCheatService.hashToken(participant_token);
      const participant = await db.findRegistrationByTokenHashAsync(tokenHash);
      if (!participant) {
        return res.status(401).json({ error: "Invalid or unauthorized participant token" });
      }

      const eventId = participant.seminar_event_id;

      // Check if participant already has a completed quiz result
      const allResults = db.getLeaderboardForEvent(eventId);
      const alreadyCompleted = allResults.find(r => r.displayName === participant.display_name);
      if (alreadyCompleted) {
        return res.status(400).json({
          error: "You have already completed the quiz for this Friday seminar event.",
          alreadyCompleted: true,
          score: alreadyCompleted.score
        });
      }

      // Check if there is an in-progress attempt
      let attempt = db.getActiveAttemptForParticipant(participant.id, eventId);
      let questionsList: any[] = [];

      if (attempt) {
        // If existing attempt is already expired (> 125s), auto-close it
        if (AntiCheatService.isAttemptExpired(attempt.started_at)) {
          db.recordSubmissionAndScoring({
            attemptId: attempt.id,
            answers: [],
            isAutoSubmit: true
          });
          return res.status(400).json({
            error: "Your previous quiz attempt timed out (2 minutes exceeded).",
            expired: true
          });
        }
        // Return existing attempt questions
        const stored = db.getQuizQuestionsForAttempt(attempt.id);
        questionsList = stored.map(q => ({
          id: q.id,
          question_order: q.question_order,
          question: q.question_snapshot,
          options: q.options_snapshot
        }));
      } else {
        // Generate new 4-question set
        const tempAttemptId = `temp-${Date.now()}`;
        const seedString = `${participant.id}-${eventId}-${Date.now()}`;
        const genResult = await QuizGenerationService.generateQuizForAttempt({
          attemptId: tempAttemptId,
          participantId: participant.id,
          participantName: participant.name,
          seedString
        });

        const now = new Date();
        const startedAt = now.toISOString();
        const expiresAt = new Date(now.getTime() + 120000).toISOString(); // exactly 120s

        const created = db.createQuizAttempt(
          {
            seminar_event_id: eventId,
            participant_id: participant.id,
            attempt_token_hash: tokenHash,
            started_at: startedAt,
            expires_at: expiresAt,
            status: "in_progress"
          },
          genResult.questions.map(q => ({
            questionId: q.questionId,
            question: q.question,
            options: q.options,
            correctOption: q.correctOption
          }))
        );

        attempt = created.attempt;
        questionsList = created.questions.map(q => ({
          id: q.id,
          question_order: q.question_order,
          question: q.question_snapshot,
          options: q.options_snapshot
        }));
      }

      const startedMs = new Date(attempt.started_at).getTime();
      const nowMs = Date.now();
      const elapsedSeconds = Math.max(0, Math.floor((nowMs - startedMs) / 1000));
      const remainingSeconds = Math.max(0, 120 - elapsedSeconds);

      res.status(200).json({
        attemptId: attempt.id,
        startedAt: attempt.started_at,
        expiresAt: attempt.expires_at,
        durationSecondsLimit: 120,
        remainingSeconds,
        totalQuestions: questionsList.length,
        questions: questionsList // strictly without answer keys!
      });
    } catch (err: any) {
      console.error("Quiz start error:", err);
      res.status(500).json({ error: "Failed to initialize quiz attempt", details: err?.message });
    }
  });

  // 6. Submit Quiz Answers & Server-Side Scoring
  app.post("/api/quiz/submit", async (req: Request, res: Response) => {
    try {
      const parseResult = QuizAnswerSubmissionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid submission payload",
          details: parseResult.error.flatten().fieldErrors
        });
      }

      const { attempt_id, participant_token, answers, is_auto_submit } = parseResult.data;
      const tokenHash = AntiCheatService.hashToken(participant_token);
      const participant = await db.findRegistrationByTokenHashAsync(tokenHash);

      if (!participant) {
        return res.status(401).json({ error: "Unauthorized participant token" });
      }

      const attempt = db.getAttemptById(attempt_id);
      if (!attempt) {
        return res.status(404).json({ error: "Quiz attempt not found" });
      }

      if (attempt.participant_id !== participant.id) {
        return res.status(403).json({ error: "Forbidden: Attempt does not belong to this participant" });
      }

      // Check anti-cheat expiration
      if (!is_auto_submit && AntiCheatService.isAttemptExpired(attempt.started_at, 5)) {
        // If expired beyond grace period, force auto-submit
        const autoScored = db.recordSubmissionAndScoring({
          attemptId: attempt_id,
          answers: answers.map(a => ({ quizQuestionId: a.quiz_question_id, selectedOption: a.selected_option })),
          isAutoSubmit: true
        });
        return res.status(200).json({
          message: "Quiz auto-submitted due to time limit expiration.",
          result: autoScored?.result,
          score: autoScored?.score,
          duration: autoScored?.duration,
          timedOut: true
        });
      }

      const scored = db.recordSubmissionAndScoring({
        attemptId: attempt_id,
        answers: answers.map(a => ({ quizQuestionId: a.quiz_question_id, selectedOption: a.selected_option })),
        isAutoSubmit: Boolean(is_auto_submit)
      });

      if (!scored) {
        return res.status(400).json({ error: "Failed to score quiz submission" });
      }

      // Fetch questions with explanations for post-submission review
      const questions = db.getQuizQuestionsForAttempt(attempt_id);
      const reviewData = questions.map(q => {
        const userAns = answers.find(a => a.quiz_question_id === q.id);
        const selected = userAns !== undefined ? userAns.selected_option : -1;
        const isCorrect = selected === q.correct_option_server_only;
        return {
          id: q.id,
          question: q.question_snapshot,
          options: q.options_snapshot,
          selectedOption: selected,
          correctOption: q.correct_option_server_only,
          isCorrect
        };
      });

      res.status(200).json({
        message: "Quiz submitted and evaluated successfully!",
        score: scored.score,
        totalQuestions: 4,
        durationSeconds: scored.duration,
        resultStatus: scored.result.result_status,
        submittedAt: scored.result.created_at,
        review: reviewData
      });
    } catch (err: any) {
      console.error("Quiz submission error:", err);
      res.status(500).json({ error: "Failed to process quiz submission", details: err?.message });
    }
  });

  // 7. Get Official Friday Seminar Leaderboard
  app.get("/api/leaderboard/:eventId", (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const leaderboard = db.getLeaderboardForEvent(eventId);
      res.json({
        eventId,
        count: leaderboard.length,
        leaderboard
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch leaderboard", details: err?.message });
    }
  });

  // ==========================================
  // SCHOLARSHIP QUIZ API ROUTES (₹1000/₹500/₹200 + 7 attractive gift prizes)
  // 20 AI questions, 10-min timer, separate leaderboard, persisted in Supabase
  // ==========================================

  // 6.1 Scholarship Quiz Status (does the participant already have a submission?)
  app.get("/api/scholarship-quiz/status", async (req: Request, res: Response) => {
    try {
      const participantToken = req.query.participant_token as string;
      if (!participantToken || participantToken.length < 10) {
        return res.json({ submitted: false });
      }

      // Resolve participant from token hash
      const tokenHash = AntiCheatService.hashToken(participantToken);
      const participant = await db.findRegistrationByTokenHashAsync(tokenHash);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      const result = await ScholarshipService.hasParticipantSubmitted(participant.id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch scholarship status", details: err?.message });
    }
  });

  // 6.2 Start Scholarship Quiz Attempt (requires participant_token)
  app.post("/api/scholarship-quiz/start", async (req: Request, res: Response) => {
    try {
      const parseResult = ScholarshipStartSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid input", details: parseResult.error.flatten() });
      }

      const { participant_token } = parseResult.data;
      const tokenHash = AntiCheatService.hashToken(participant_token);
      const participant = await db.findRegistrationByTokenHashAsync(tokenHash);

      if (!participant) {
        return res.status(404).json({ error: "प्रतिभागी पंजीकरण नहीं मिला। कृपया पहले सेमिनार रजिस्ट्रेशन करें।" });
      }

      // Check if already submitted
      const existing = await ScholarshipService.hasParticipantSubmitted(participant.id);
      if (existing.submitted) {
        return res.status(409).json({
          error: "आप स्कॉलरशिप क्विज पहले ही पूरा कर चुके हैं।",
          alreadyCompleted: true,
          score: existing.score
        });
      }

      const result = await ScholarshipService.startAttempt({
        participantId: participant.id,
        participantName: participant.display_name,
        participantPhone: participant.whatsapp_number,
        participantCity: participant.city
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to start scholarship quiz", details: err?.message });
    }
  });

  // 6.3 Submit Scholarship Quiz Attempt
  app.post("/api/scholarship-quiz/submit", async (req: Request, res: Response) => {
    try {
      const parseResult = ScholarshipSubmissionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid submission", details: parseResult.error.flatten() });
      }

      const { attempt_id, participant_token, answers, is_auto_submit } = parseResult.data;
      const tokenHash = AntiCheatService.hashToken(participant_token);
      const participant = await db.findRegistrationByTokenHashAsync(tokenHash);

      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      const result = await ScholarshipService.submitAttempt({
        attemptId: attempt_id,
        participantId: participant.id,
        answers,
        isAutoSubmit: is_auto_submit
      });

      res.json(result);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg === "ALREADY_SUBMITTED") {
        return res.status(409).json({ error: "Attempt already submitted" });
      }
      res.status(500).json({ error: "Failed to submit scholarship quiz", details: msg });
    }
  });

  // 6.4 Scholarship Quiz Leaderboard
  app.get("/api/scholarship-quiz/leaderboard", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const leaderboard = await ScholarshipService.getLeaderboard(Math.min(limit, 200));
      res.json({ count: leaderboard.length, leaderboard });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch scholarship leaderboard", details: err?.message });
    }
  });

  // 6.5 Scholarship Quiz Winners (top 10: ranks 1-3 cash, 4-10 attractive gift)
  app.get("/api/scholarship-quiz/winners", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const winners = await ScholarshipService.getWinners(Math.min(limit, 10));
      res.json({ count: winners.length, winners });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch scholarship winners", details: err?.message });
    }
  });

  // ==========================================
  // ADMIN AUTHENTICATION & CRM API ROUTES
  // ==========================================

  // 8. Admin Login (Supports Email or Registered WhatsApp Number)
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const parseResult = AdminLoginInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid credentials format", details: parseResult.error.flatten() });
      }

      const { email, identifier, password } = parseResult.data;
      const lookupTarget = (identifier || email || "").trim();
      const admin = db.findAdminByIdentifier(lookupTarget) || db.getAdminByEmail(lookupTarget);

      if (!admin || admin.status !== "active") {
        return res.status(401).json({ error: "अमान्य ईमेल/व्हाट्सएप या पासवर्ड। (Invalid email/WhatsApp or password)" });
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "अमान्य ईमेल/व्हाट्सएप या पासवर्ड। (Invalid email/WhatsApp or password)" });
      }

      db.updateAdminLastLogin(admin.id);
      db.logAudit({
        admin_id: admin.id,
        admin_name: admin.name,
        action: "ADMIN_LOGIN_SUCCESS",
        entity: "admin_users",
        entity_id: admin.id
      });

      const token = jwt.sign(
        {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          whatsapp_number: admin.whatsapp_number
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          whatsapp_number: admin.whatsapp_number,
          role: admin.role
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "Login failed", details: err?.message });
    }
  });

  // 8.1 Admin Forgot Password - Request 6-digit WhatsApp OTP
  app.post("/api/admin/forgot-password", async (req: Request, res: Response) => {
    try {
      const parseResult = AdminForgotPasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "कृपया मान्य ईमेल या व्हाट्सएप नंबर दर्ज करें।" });
      }

      const { identifier } = parseResult.data;
      const admin = db.findAdminByIdentifier(identifier);

      if (!admin || admin.status !== "active") {
        return res.status(404).json({
          error: "इस विवरण से कोई सक्रिय सुपर एडमिन अकाउंट नहीं मिला। कृपया अपना पंजीकृत WhatsApp नंबर या ईमेल जांचें।"
        });
      }

      const adminPhone = admin.whatsapp_number || "9301056006";
      // Generate secure 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await db.setAdminResetOTP(admin.id, otp, 15);

      // Dispatch OTP via WhatsApp service
      const waResult = await WhatsAppService.sendAdminPasswordResetOTP({
        adminId: admin.id,
        adminName: admin.name,
        phoneNumber: adminPhone,
        otp,
        expiresInMinutes: 15
      });

      db.logAudit({
        admin_id: admin.id,
        admin_name: admin.name,
        action: "ADMIN_FORGOT_PASSWORD_REQUEST",
        entity: "admin_users",
        entity_id: admin.id,
        metadata: { phone: adminPhone, status: waResult.status }
      });

      // Mask phone for security e.g. "98****2345"
      const clean = adminPhone.replace(/\D/g, "");
      const maskedPhone = clean.length >= 10
        ? `${clean.slice(0, 2)}******${clean.slice(-4)}`
        : clean;

      res.json({
        message: `✓ 6-अंकों का पासवर्ड रीसेट OTP आपके पंजीकृत WhatsApp नंबर (${maskedPhone}) पर भेज दिया गया है!`,
        whatsapp_masked: maskedPhone,
        identifier: admin.email,
        directWhatsAppLink: waResult.directWhatsAppLink,
        simulatedOtp: waResult.status === "pending_configuration" ? otp : undefined
      });
    } catch (err: any) {
      res.status(500).json({ error: "पासवर्ड रीसेट कोड भेजने में विफल", details: err?.message });
    }
  });

  // 8.2 Admin Reset Password With WhatsApp OTP
  app.post("/api/admin/reset-password", async (req: Request, res: Response) => {
    try {
      const parseResult = AdminResetPasswordWithOTPSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "अमान्य इनपुट", details: parseResult.error.flatten() });
      }

      const { identifier, otp, new_password } = parseResult.data;
      const admin = db.findAdminByIdentifier(identifier);

      if (!admin) {
        return res.status(404).json({ error: "सुपर एडमिन अकाउंट नहीं मिला।" });
      }

      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(new_password, salt);

      const resetResult = await db.verifyAndResetAdminPassword(identifier, otp, newPasswordHash);
      if (!resetResult.success || !resetResult.admin) {
        return res.status(400).json({ error: resetResult.error || "पासवर्ड रीसेट करने में विफल" });
      }

      const updatedAdmin = resetResult.admin;

      // Send confirmation notification on WhatsApp
      if (updatedAdmin.whatsapp_number) {
        await WhatsAppService.sendAdminPasswordChangeConfirmation({
          adminId: updatedAdmin.id,
          adminName: updatedAdmin.name,
          phoneNumber: updatedAdmin.whatsapp_number
        });
      }

      db.logAudit({
        admin_id: updatedAdmin.id,
        admin_name: updatedAdmin.name,
        action: "ADMIN_PASSWORD_RESET_SUCCESS",
        entity: "admin_users",
        entity_id: updatedAdmin.id
      });

      const token = jwt.sign(
        {
          id: updatedAdmin.id,
          email: updatedAdmin.email,
          name: updatedAdmin.name,
          role: updatedAdmin.role,
          whatsapp_number: updatedAdmin.whatsapp_number
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        message: "✓ आपका नया सुपर एडमिन पासवर्ड सफलतापूर्वक सेट हो गया है! आप अब लॉगिन हैं।",
        token,
        admin: {
          id: updatedAdmin.id,
          name: updatedAdmin.name,
          email: updatedAdmin.email,
          whatsapp_number: updatedAdmin.whatsapp_number,
          role: updatedAdmin.role
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "पासवर्ड अपडेट विफल", details: err?.message });
    }
  });

  // 9. Admin Dashboard Metrics & Overview
  app.get("/api/admin/dashboard", authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const currentSeminar = await FridayEngine.getOrCreateCurrentSeminar();
      const eventId = (req.query.eventId as string) || currentSeminar.event.id;
      const metrics = db.getDashboardMetrics(eventId);
      const events = db.getAllSeminarEvents();
      const leads = db.getAllAdmissionLeads();
      const registrations = db.getAllRegistrations({ eventId });
      const whatsAppMessages = db.getAllWhatsAppMessages().slice(0, 50);
      const auditLogs = db.getAllAuditLogs().slice(0, 30);
      const driveStatus = GoogleDriveService.getIntegrationStatus();

      res.json({
        metrics,
        currentSeminar,
        events,
        leads,
        registrations,
        whatsAppMessages,
        auditLogs,
        driveStatus
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load dashboard data", details: err?.message });
    }
  });

  // 10. Update Admission Lead CRM Record
  app.patch("/api/admin/leads/:leadId", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const { leadId } = req.params;
      const parseResult = AdmissionLeadUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid lead update payload", details: parseResult.error.flatten() });
      }

      const updated = db.updateAdmissionLead(leadId, parseResult.data);
      if (!updated) {
        return res.status(404).json({ error: "Lead record not found" });
      }

      db.logAudit({
        admin_id: req.adminUser?.id,
        admin_name: req.adminUser?.name,
        action: "UPDATE_CRM_LEAD",
        entity: "admission_leads",
        entity_id: leadId,
        metadata: parseResult.data
      });

      res.json({ message: "Lead updated successfully", lead: updated });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update lead", details: err?.message });
    }
  });

  // 10.1 Admin Update Seminar Settings (Date, Time, Location/Venue, Reporting Time, Registration Status)
  app.patch("/api/admin/settings", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const parseResult = SeminarSettingsUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid seminar settings format", details: parseResult.error.flatten() });
      }

      const updated = db.updateSeminarSettings(parseResult.data);
      db.logAudit({
        admin_id: req.adminUser?.id,
        admin_name: req.adminUser?.name,
        action: "UPDATE_SEMINAR_SETTINGS",
        entity: "seminar_settings",
        entity_id: "global",
        metadata: parseResult.data
      });

      res.json({ message: "Seminar settings updated successfully", settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update seminar settings", details: err?.message });
    }
  });

  app.get("/api/admin/settings", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const settings = db.getSeminarSettings();
      res.json({ settings });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to get seminar settings", details: err?.message });
    }
  });

  // 10.2 Admin Profile / Credentials Update (Name, Email, Custom Password)
  app.patch("/api/admin/account", authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const parseResult = AdminAccountUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid account update data", details: parseResult.error.flatten() });
      }

      const { name, email, whatsapp_number, new_password, current_password } = parseResult.data;
      const adminId = req.adminUser?.id;
      if (!adminId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const admin = db.getAdminById(adminId) || db.getAdminByEmail(req.adminUser.email);
      if (!admin) {
        return res.status(404).json({ error: "Admin user not found" });
      }

      if (new_password) {
        if (!current_password) {
          return res.status(400).json({ error: "वर्तमान पासवर्ड दर्ज करना आवश्यक है (Current password required to set new password)" });
        }
        const isValid = await bcrypt.compare(current_password, admin.password_hash);
        if (!isValid) {
          return res.status(400).json({ error: "गलत वर्तमान पासवर्ड (Current password is incorrect)" });
        }
      }

      const updated = await db.updateAdminProfile(adminId, {
        name,
        email,
        whatsapp_number,
        newPassword: new_password
      });

      if (!updated) {
        return res.status(400).json({ error: "Failed to update admin account" });
      }

      db.logAudit({
        admin_id: adminId,
        admin_name: updated.name,
        action: "UPDATE_ADMIN_CREDENTIALS",
        entity: "admin_users",
        entity_id: adminId,
        metadata: { name: updated.name, email: updated.email, whatsapp_number: updated.whatsapp_number, passwordChanged: !!new_password }
      });

      // Issue fresh JWT token with updated email/name/whatsapp
      const newToken = jwt.sign(
        {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          role: updated.role,
          whatsapp_number: updated.whatsapp_number
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        message: "Admin credentials updated successfully",
        token: newToken,
        admin: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          whatsapp_number: updated.whatsapp_number,
          role: updated.role
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update admin credentials", details: err?.message });
    }
  });

  // 11. Update Seminar Event (Reschedule / Open-Close Registrations)
  app.patch("/api/admin/seminar/:eventId", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      const { status, registration_open, title, description } = req.body;

      const updated = db.updateSeminarEvent(eventId, {
        ...(status && { status }),
        ...(registration_open !== undefined && { registration_open }),
        ...(title && { title }),
        ...(description && { description })
      });

      if (!updated) {
        return res.status(404).json({ error: "Seminar event not found" });
      }

      db.logAudit({
        admin_id: req.adminUser?.id,
        admin_name: req.adminUser?.name,
        action: "UPDATE_SEMINAR_EVENT",
        entity: "seminar_events",
        entity_id: eventId,
        metadata: req.body
      });

      res.json({ message: "Seminar event updated successfully", event: updated });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update seminar event", details: err?.message });
    }
  });

  // 12. Export Registrations to Excel / CSV (Full Student Marketing Leads with UTF-8 BOM)
  const exportExcelCSVHandler = (req: AuthRequest, res: Response) => {
    try {
      const eventId = req.query.eventId as string;
      const csv = GoogleDriveService.generateRegistrationsCSV(eventId);
      const filename = `BMB_Student_Marketing_Leads_${eventId || "All"}_${Date.now()}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to export Excel/CSV student leads", details: err?.message });
    }
  };

  app.get("/api/admin/export/csv", authenticateAdmin, exportExcelCSVHandler);
  app.get("/api/admin/export/excel", authenticateAdmin, exportExcelCSVHandler);

  // 13. Create & Download System Backup Snapshot
  app.get("/api/admin/export/backup", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const backup = GoogleDriveService.createBackupArchive();
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${backup.filename}"`);
      res.send(backup.jsonData);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create backup", details: err?.message });
    }
  });

  // 14. Run Full 100+ Production QA Test Suite
  app.post("/api/admin/run-qa-tests", authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const testReport = await ProductionTestSuiteRunner.runAllTests();
      db.logAudit({
        admin_id: req.adminUser?.id,
        admin_name: req.adminUser?.name,
        action: "EXECUTE_100_QA_TESTS",
        entity: "system_test_suite",
        entity_id: "qa_suite_run",
        metadata: { passed: testReport.passed, failed: testReport.failed, total: testReport.total }
      });
      res.json(testReport);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to run QA test suite", details: err?.message });
    }
  });

  // 14.1 Maintenance: Clear all fake / test registrations and leads (Make CRM 100% Fresh)
  app.post("/api/admin/maintenance/clear-data", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      db.clearAllRegistrationAndLeadData();
      db.logAudit({
        admin_id: req.adminUser?.id,
        admin_name: req.adminUser?.name,
        action: "RESET_FRESH_DATABASE",
        entity: "system",
        entity_id: "all_leads_registrations",
        metadata: { timestamp: new Date().toISOString() }
      });
      res.json({ message: "All test and demo registration records cleared. Database is 100% fresh and clean for live use." });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to reset database", details: err?.message });
    }
  });

  // 14.2 Admin: View all scholarship attempts (for admin dashboard)
  app.get("/api/admin/scholarship/attempts", authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const leaderboard = await ScholarshipService.getLeaderboard(200);
      res.json({ count: leaderboard.length, attempts: leaderboard });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch scholarship attempts", details: err?.message });
    }
  });

  // 14.3 Admin: View all scholarship winners (rank 1-10)
  app.get("/api/admin/scholarship/winners", authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const winners = await ScholarshipService.getWinners(10);
      res.json({ count: winners.length, winners });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch scholarship winners", details: err?.message });
    }
  });

  // 14.4 Admin: Clear all scholarship data (for testing / reset between events)
  app.post("/api/admin/scholarship/clear", authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { query: dbQuery } = await import("./server/db/supabase-client");
      if (!dbQuery) {
        return res.status(500).json({ error: "Postgres not configured" });
      }
      // Delete winners first (FK constraint), then attempts
      await dbQuery("DELETE FROM scholarship_winners");
      await dbQuery("DELETE FROM scholarship_attempts");
      db.logAudit({
        admin_id: req.adminUser?.id,
        admin_name: req.adminUser?.name,
        action: "CLEAR_SCHOLARSHIP_DATA",
        entity: "scholarship",
        entity_id: "all_attempts_winners",
        metadata: { timestamp: new Date().toISOString() }
      });
      res.json({ message: "All scholarship attempts and winners cleared. Quiz ready for fresh event." });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to clear scholarship data", details: err?.message });
    }
  });

  // 15. System Health Check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "healthy",
      service: "BMB Educom AI Seminar Platform",
      timestamp: new Date().toISOString(),
      timezone: "Asia/Kolkata",
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      whatsAppConfigured: Boolean(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      driveConfigured: Boolean(process.env.GOOGLE_DRIVE_CLIENT_ID)
    });
  });

  // ==========================================
  // VITE DEVELOPMENT & PRODUCTION MIDDLEWARES
  // ==========================================
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    // Lazy-load Vite only in local dev (Vite crashes on import in serverless).
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    // Only needed for traditional Node hosting (npm start).
    // On Vercel, static assets are served by the platform via outputDirectory: dist.
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`BMB Educom AI Seminar Platform running on http://localhost:${PORT}`);
    });
  }
}

// Kick off async server initialization at module load (works for both Vercel cold-starts and local dev)
// Capture errors so the function still responds with a diagnostic message
initPromise = startServer()
  .then(() => {
    console.log("[bmb-seminar] startServer() completed successfully");
  })
  .catch(err => {
    console.error("[bmb-seminar] Failed to start server:", err);
    if (!process.env.VERCEL) process.exit(1);
  });

// Vercel serverless handler — waits for async setup, then forwards request to Express app
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await initPromise;
    if (!app) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Express app not initialized", stage: "after-init-promise" }));
      return;
    }
    (app as unknown as (r: IncomingMessage, s: ServerResponse) => void)(req, res);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Function invocation error",
      message: err?.message,
      stack: err?.stack?.split("\n").slice(0, 8)
    }));
  }
}
