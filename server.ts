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
import { PaymentVerificationService } from "./server/services/payment-verification-service";
import { ProductionTestSuiteRunner } from "./server/test-suite";
import { query, isPostgresConfigured } from "./server/db/supabase-client";
import {
  RegistrationInputSchema,
  QuizAnswerSubmissionSchema,
  ScholarshipSubmissionSchema,
  AdminSetupInputSchema,
  AdminLoginInputSchema,
  AdminForgotPasswordSchema,
  AdminResetPasswordWithOTPSchema,
  AdmissionLeadUpdateSchema,
  SeminarSettingsUpdateSchema,
  AdminAccountUpdateSchema
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
    console.error("[bmb-seminar] DB initialization failed (continuing in-memory):", err);
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

  // 1.1 Live Quiz Winner & Scholarship Mega Winners (Dynamic Cash Prize amounts configurable by Admin)
  app.get(["/api/quiz/winners", "/api/scholarship/winners"], (req: Request, res: Response) => {
    try {
      const winners = db.getQuizWinners(1);
      const scholarshipWinners = db.getScholarshipWinners();
      const settings = db.getSeminarSettings();
      const p1 = Number(settings.cash_prize_1st ?? 1000);
      const p2 = Number(settings.cash_prize_2nd ?? 500);
      const p3 = Number(settings.cash_prize_3rd ?? 200);
      const consolation = settings.cash_prize_consolation || "आकर्षक उपहार (Attractive Gifts)";

      res.json({
        winners,
        scholarshipWinners,
        scholarshipSummary: {
          firstPrize: { label: "1st Rank", amount: `₹${p1.toLocaleString("en-IN")}/- नकद`, cashAmount: p1 },
          secondPrize: { label: "2nd Rank", amount: `₹${p2.toLocaleString("en-IN")}/- नकद`, cashAmount: p2 },
          thirdPrize: { label: "3rd Rank", amount: `₹${p3.toLocaleString("en-IN")}/- नकद`, cashAmount: p3 },
          consolationPrize: { label: "7 Participants (Ranks 4-10)", item: consolation }
        },
        cashPrizes: {
          first: p1,
          second: p2,
          third: p3,
          consolation
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch quiz winners", details: err?.message });
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

      // Check duplicate registration — block ALL re-registration by phone+event.
      // Even if quiz is incomplete, return existing registration so the same
      // user can continue their quiz attempt instead of creating a duplicate.
      const existing = await db.findRegistrationByPhoneAndEventAsync(input.whatsapp_number, seminar.event.id);
      if (existing) {
        // Generate a fresh secure token for the existing registration so the
        // user can immediately resume their learning/quiz journey.
        const rawTokenResume = AntiCheatService.generateSecureToken();
        const newTokenHash = AntiCheatService.hashToken(rawTokenResume);
        // Update existing registration's token hash (in-memory + Postgres)
        existing.secure_token_hash = newTokenHash;
        existing.updated_at = new Date().toISOString();
        if (isPostgresConfigured()) {
          await query(
            `UPDATE seminar_registrations SET secure_token_hash = $1, updated_at = NOW() WHERE id = $2`,
            [newTokenHash, existing.id]
          ).catch((err: any) => console.error("[register] Failed to refresh token in Postgres:", err));
        }
        db.persist();

        // Check if quiz already completed — show different message
        const quizResults = db.getLeaderboardForEvent(seminar.event.id);
        const quizAlreadyCompleted = quizResults.find(r => r.displayName === existing.display_name);

        return res.status(200).json({
          message: quizAlreadyCompleted
            ? "आप इस सेमिनार के लिए पहले ही पंजीकृत हैं और क्विज़ पूरा कर चुके हैं। डुप्लिकेट पंजीकरण की अनुमति नहीं है।"
            : "आप इस सेमिनार के लिए पहले ही पंजीकृत हैं। अपना सीखना जारी रखने के लिए नीचे दिए गए लिंक का उपयोग करें।",
          isExisting: true,
          quizAlreadyCompleted: !!quizAlreadyCompleted,
          quizScore: quizAlreadyCompleted?.score,
          registration: {
            id: existing.id,
            registration_id: existing.registration_id,
            name: existing.name,
            whatsapp_number: existing.whatsapp_number,
            city: existing.city,
            seminar_event_id: existing.seminar_event_id,
            created_at: existing.created_at
          },
          token: rawTokenResume,
          secureLink: `/learn/${rawTokenResume}`,
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
          error: "You have already completed the quiz for this seminar event.",
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

      // Check Round 1 leaderboard rank and free pass eligibility
      const leaderboard = db.getRound1Leaderboard(attempt.seminar_event_id);
      const myRankEntry = leaderboard.find(l => l.participantId === participant.id);
      const isFreePassWinner = Boolean(myRankEntry?.isFreePassWinner);

      let myPass = db.getPassPurchaseByParticipant(participant.id);
      if (isFreePassWinner && !myPass) {
        myPass = db.grantFreePassIfEligible(participant.id) || undefined;
      }

      res.status(200).json({
        message: "Quiz submitted and evaluated successfully!",
        score: scored.score,
        totalQuestions: 5,
        durationSeconds: scored.duration,
        resultStatus: scored.result.result_status,
        submittedAt: scored.result.created_at,
        rank: myRankEntry ? myRankEntry.rank : 1,
        isQualified: Boolean(myRankEntry?.isQualified),
        isFreePassWinner,
        pass: myPass || null,
        review: reviewData,
        offerDetails: {
          originalPrice: 500,
          offerPrice: 199,
          savings: 301,
          upiId: "himanchal310@okaxis",
          upiPhone: "9301056006",
          payeeName: "Himanchal"
        }
      });
    } catch (err: any) {
      console.error("Quiz submission error:", err);
      res.status(500).json({ error: "Failed to process quiz submission", details: err?.message });
    }
  });

  // 7. Get Official Friday Seminar Leaderboard (Round 1)
  app.get("/api/leaderboard/:eventId", (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const leaderboard = db.getRound1Leaderboard(eventId);
      res.json({
        eventId,
        count: leaderboard.length,
        leaderboard
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch leaderboard", details: err?.message });
    }
  });

  // 7.0 Round 1 Full Public Leaderboard
  app.get("/api/round1/leaderboard", (req: Request, res: Response) => {
    try {
      const leaderboard = db.getRound1Leaderboard();
      const allPasses = db.getAllPassPurchases();
      res.json({
        count: leaderboard.length,
        totalPassHolders: allPasses.filter(p => p.verification_status === "verified").length,
        leaderboard
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch round 1 leaderboard", details: err?.message });
    }
  });

  // ==========================================
  // SEMINAR PASS PURCHASE & VERIFICATION ROUTES
  // (UPI: himanchal310@okaxis | Phone: 9301056006 | Offer: ₹199)
  // ==========================================

  // 7.0.1 Get Pass Status & Pricing Details for Student
  app.get("/api/pass/status/:token", async (req: Request, res: Response) => {
    try {
      const rawToken = req.params.token;
      if (!rawToken) {
        return res.status(400).json({ error: "Participant token is required" });
      }

      const tokenHash = AntiCheatService.hashToken(rawToken);
      const participant = await db.findRegistrationByTokenHashAsync(tokenHash);
      if (!participant) {
        return res.status(401).json({ error: "Invalid participant token" });
      }

      const leaderboard = db.getRound1Leaderboard(participant.seminar_event_id);
      const myRank = leaderboard.find(l => l.participantId === participant.id);
      const isRound1Completed = Boolean(myRank);
      const isTop10Winner = Boolean(myRank?.isFreePassWinner);

      const eligibility = await db.isParticipantEligibleForRound2Async(participant.id);
      const pass = eligibility.pass || await db.findPassPurchaseByParticipantAsync(participant.id) || null;
      const allPasses = db.getAllPassPurchases().filter(p => p.verification_status === "verified");
      const settings = db.getSeminarSettings();

      res.json({
        participantId: participant.id,
        name: participant.name,
        whatsappNumber: participant.whatsapp_number,
        isRound1Completed,
        round1Score: myRank?.score ?? null,
        round1Duration: myRank?.durationSeconds ?? null,
        round1Rank: myRank?.rank ?? null,
        isQualified: Boolean(myRank?.isQualified),
        isTop10Winner,
        hasPass: eligibility.eligible,
        pass,
        eligibleForRound2: eligibility.eligible,
        isStage2Active: Boolean(settings.is_stage2_active),
        stage2ActivatedAt: settings.stage2_activated_at || null,
        totalPassHoldersCount: allPasses.length,
        upiConfig: {
          upiId: settings.upi_id || "himanchal310@okaxis",
          upiPhone: settings.upi_phone || "9301056006",
          payeeName: "Himanchal",
          originalAmount: settings.pass_price_original || 500,
          discountedAmount: settings.pass_price_discounted || 199,
          savings: (settings.pass_price_original || 500) - (settings.pass_price_discounted || 199),
          qrScanAnyUpiSupported: true
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to get pass status", details: err?.message });
    }
  });

  // 7.0.2 Verify UPI Payment Screenshot & Trigger WhatsApp Invoice
  app.post("/api/pass/verify-payment", async (req: Request, res: Response) => {
    try {
      const { participant_token, utr_number, screenshot_base64 } = req.body;

      if (!participant_token) {
        return res.status(400).json({ error: "Participant token is required" });
      }

      if (!utr_number || typeof utr_number !== "string") {
        return res.status(400).json({ error: "कृपया सही 12-अंकीय UPI UTR / Transaction Ref No दर्ज करें।" });
      }

      if (!screenshot_base64 || typeof screenshot_base64 !== "string") {
        return res.status(400).json({ error: "कृपया UPI ट्रांजेक्शन स्क्रीनशॉट अपलोड करें।" });
      }

      const tokenHash = AntiCheatService.hashToken(participant_token);
      const participant = await db.findRegistrationByTokenHashAsync(tokenHash);
      if (!participant) {
        return res.status(401).json({ error: "अमान्य या अनधिकृत छात्र टोकन।" });
      }

      // Check if participant already has a verified pass
      const existing = db.getPassPurchaseByParticipant(participant.id);
      if (existing) {
        return res.status(200).json({
          message: "आपका BMB सेमिनार पास पहले से सत्यापित है!",
          pass: existing,
          alreadyPurchased: true
        });
      }

      // Check duplicate UTR among existing purchases
      const allPurchases = db.getAllPassPurchases();
      const duplicateUtr = allPurchases.find(p => p.utr_number.toLowerCase() === utr_number.trim().toLowerCase() && p.verification_status === "verified");
      if (duplicateUtr && duplicateUtr.participant_id !== participant.id) {
        return res.status(400).json({
          error: "यह UTR नंबर पहले से किसी अन्य पास के लिए इस्तेमाल किया जा चुका है। कृपया अपनी वास्तविक ट्रांजेक्शन रसीद का UTR दर्ज करें।"
        });
      }

      // Verify screenshot authenticity using AI / Multimodal & rule engine
      const verification = await PaymentVerificationService.verifyTransactionScreenshot({
        imageBase64: screenshot_base64,
        utrNumber: utr_number,
        participantName: participant.name,
        whatsappNumber: participant.whatsapp_number,
        expectedAmount: 199
      });

      if (!verification.isValid) {
        return res.status(400).json({
          error: verification.reason || "अमान्य या नकली स्क्रीनशॉट। कृपया वैध UPI ट्रांजेक्शन रसीद अपलोड करें।",
          isFake: true
        });
      }

      // Create verified pass purchase record
      const newPass = db.createPassPurchase({
        participant_id: participant.id,
        registration_id: participant.registration_id || participant.id,
        participant_name: participant.name,
        whatsapp_number: participant.whatsapp_number,
        amount_paid: 199,
        original_amount: 500,
        payment_method: "upi_qr",
        upi_id: "himanchal310@okaxis",
        utr_number: verification.utrFound || utr_number.trim(),
        screenshot_url: verification.url,
        screenshot_filename: verification.filename,
        verification_status: "verified",
        notes: "Verified ₹199 Discounted Seminar Pass"
      });

      // Send WhatsApp Invoice to Student + Alert to Admin 9301056006
      const waResults = await WhatsAppService.sendPassInvoiceNotification(newPass);

      // Update lead CRM
      const lead = db.getAllAdmissionLeads().find(l => l.participant_id === participant.id);
      if (lead) {
        db.updateAdmissionLead(lead.id, {
          status: "Converted",
          interest: "high",
          notes: `${lead.notes || ""} [BMB Pass Purchased: ₹199, UTR: ${newPass.utr_number}]`
        });
      }

      res.status(201).json({
        message: "UPI भुगतान स्क्रीनशॉट सफलतापूर्वक सत्यापित हो गया! आपका सेमिनार पास जारी कर दिया गया है।",
        pass: newPass,
        whatsappStudentLink: waResults.studentResult.directWhatsAppLink,
        whatsappAdminLink: waResults.adminResult.directWhatsAppLink,
        verified: true
      });
    } catch (err: any) {
      console.error("Pass verification error:", err);
      res.status(500).json({ error: "Failed to process pass verification", details: err?.message });
    }
  });

  // Serve static uploaded screenshots securely
  // (PaymentVerificationService.ensureDirectory already handles Vercel's read-only FS gracefully.)
  PaymentVerificationService.ensureDirectory();
  // On Vercel, screenshots live in /tmp/.data/screenshots — match the dir used by ensureDirectory.
  const screenshotsPath = process.env.VERCEL
    ? path.resolve("/tmp", ".data", "screenshots")
    : path.resolve(process.cwd(), ".data", "screenshots");
  app.use("/api/admin/screenshots", express.static(screenshotsPath));

  // ==========================================
  // 5-MINUTE MEGA AI SEMINAR SCHOLARSHIP QUIZ (STAGE 2)
  // (10 Questions | 5 Mins | 20 Winners: ₹3000, ₹2000, ₹1500 Cash + Scholarships)
  // ==========================================

  // 7.1 Start 5-Minute AI Mega Seminar Quiz Attempt (Only for Pass Holders!)
  app.post("/api/scholarship/start", async (req: Request, res: Response) => {
    try {
      const participant_token = req.body.participant_token || req.body.participantToken;
      if (!participant_token) {
        return res.status(400).json({ error: "Participant token is required" });
      }

      const tokenHash = AntiCheatService.hashToken(participant_token);
      const participant = await db.findRegistrationByTokenHashAsync(tokenHash);
      if (!participant) {
        return res.status(401).json({ error: "Invalid or unauthorized participant token" });
      }

      // Check Pass Eligibility (Must be Top 10 winner or have purchased ₹199 pass)
      const eligibility = db.isParticipantEligibleForRound2(participant.id);
      if (!eligibility.eligible) {
        return res.status(403).json({
          passRequired: true,
          error: "मेगा AI सेमिनार क्विज (Stage 2) केवल BMB AI Seminar Pass धारकों के लिए है।",
          message: "Top 10 विजेताओं को पास मुफ्त मिला है, अन्य छात्र ₹199/- में पास प्राप्त करके सेमिनार व क्विज के लिए पात्र हो सकते हैं।",
          upiConfig: {
            upiId: "himanchal310@okaxis",
            upiPhone: "9301056006",
            amount: 199,
            originalAmount: 500
          }
        });
      }

      // Check Admin Live Control for Stage 2 (Must be started by Admin in Seminar)
      const currentSeminarSettings = db.getSeminarSettings();
      if (!currentSeminarSettings.is_stage2_active) {
        return res.status(403).json({
          stage2LockedByAdmin: true,
          error: "Stage 2 Mega Quiz अभी एडमिन नियंत्रण में लॉक है।",
          message: "BMB Educom Stage 2 Mega Quiz को सेमिनार के दौरान मुख्य मंच से एडमिन द्वारा लाइव शुरू किया जाएगा। आपका पास सत्यापित है, कृपया सेमिनार में लाइव घोषणा की प्रतीक्षा करें!",
          isStage2Active: false
        });
      }

      const eventId = participant.seminar_event_id;

      // Check if participant already has a completed scholarship submission
      const existingSubmission = db.getScholarshipSubmissionByParticipant(participant.id);
      if (existingSubmission) {
        const winners = db.getScholarshipWinners();
        const myRank = winners.find(w => w.id === existingSubmission.id);
        return res.status(200).json({
          alreadyCompleted: true,
          score: existingSubmission.score,
          totalQuestions: 10,
          durationSeconds: existingSubmission.duration_seconds,
          rank: myRank ? myRank.rank : 1,
          prizeText: myRank ? myRank.prizeText : "प्रतिभागिता प्रमाण-पत्र (Participation Certificate)",
          prizeType: myRank ? myRank.prizeType : "scholarship_500",
          cashPrize: myRank ? myRank.cashPrize : 0,
          scholarshipAmount: myRank ? myRank.scholarshipAmount : 500,
          submittedAt: existingSubmission.created_at
        });
      }

      // Check or create attempt
      let attempt = db.getActiveScholarshipAttempt(participant.id, eventId);
      if (!attempt) {
        attempt = db.createScholarshipAttempt(participant.id, eventId, tokenHash);
      }

      const now = Date.now();
      const expires = new Date(attempt.expires_at).getTime();
      const remainingSeconds = Math.max(0, Math.round((expires - now) / 1000));

      const questions = db.getScholarshipAttemptQuestions(attempt.id);
      const settings = db.getSeminarSettings();

      const p1 = Number(settings.cash_prize_1st ?? 3000);
      const p2 = Number(settings.cash_prize_2nd ?? 2000);
      const p3 = Number(settings.cash_prize_3rd ?? 1500);
      const s1 = Number(settings.scholarship_1st ?? 10000);
      const s2 = Number(settings.scholarship_2nd ?? 8000);
      const s3 = Number(settings.scholarship_3rd ?? 5000);
      const s4_20 = Number(settings.scholarship_4_to_20 ?? 1000);
      const sPart = Number(settings.scholarship_participation ?? 500);

      res.json({
        attemptId: attempt.id,
        startedAt: attempt.started_at,
        expiresAt: attempt.expires_at,
        durationSecondsLimit: 300, // 5 minutes = 300s
        remainingSeconds,
        totalQuestions: questions.length,
        questions,
        prizes: {
          first: `🥇 ₹${p1.toLocaleString("en-IN")}/- नकद + ₹${s1.toLocaleString("en-IN")}/- BMB स्कॉलरशिप (1st Winner)`,
          second: `🥈 ₹${p2.toLocaleString("en-IN")}/- नकद + ₹${s2.toLocaleString("en-IN")}/- BMB स्कॉलरशिप (2nd Winner)`,
          third: `🥉 ₹${p3.toLocaleString("en-IN")}/- नकद + ₹${s3.toLocaleString("en-IN")}/- BMB स्कॉलरशिप (3rd Winner)`,
          ranks4to20: `🎁 17 विजेताओं (Rank 4-20) को आकर्षक उपहार + ₹${s4_20.toLocaleString("en-IN")}/- BMB स्कॉलरशिप`,
          allParticipants: `📜 सभी शेष प्रतिभागियों को ₹${sPart.toLocaleString("en-IN")}/- स्कॉलरशिप + ई-प्रमाण-पत्र`
        },
        terms: {
          validityDays: 15,
          validityNote: "स्कॉलरशिप BMB EDUCOM AI SEMINAR की तारीख से केवल 15 दिनों तक मान्य होगी।",
          conditionNote: "कोर्स का शुल्क डिस्काउंट राशि के बराबर नहीं होगा।"
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to start scholarship quiz", details: err?.message });
    }
  });

  // 7.2 Submit 5-Minute AI Mega Seminar Quiz
  app.post("/api/scholarship/submit", async (req: Request, res: Response) => {
    try {
      const parseResult = ScholarshipSubmissionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors
        });
      }

      const { attempt_id, participant_token, answers, is_auto_submit } = parseResult.data;
      const tokenHash = AntiCheatService.hashToken(participant_token);
      const participant = await db.findRegistrationByTokenHashAsync(tokenHash);
      if (!participant) {
        return res.status(401).json({ error: "Unauthorized participant submission" });
      }

      const attempt = db.getScholarshipAttemptById(attempt_id);
      if (!attempt) {
        return res.status(404).json({ error: "Scholarship attempt not found" });
      }

      const scored = await db.recordScholarshipSubmission({
        attemptId: attempt_id,
        answers,
        isAutoSubmit: Boolean(is_auto_submit)
      });

      if (!scored) {
        return res.status(400).json({ error: "Failed to score scholarship submission" });
      }

      res.status(200).json({
        message: "Mega AI Seminar Quiz successfully submitted!",
        score: scored.score,
        totalQuestions: scored.totalQuestions,
        durationSeconds: scored.duration,
        rank: scored.rank,
        prizeText: scored.prizeText,
        prizeType: scored.prizeType,
        cashPrize: scored.cashPrize,
        scholarshipAmount: scored.scholarshipAmount,
        submittedAt: scored.submission.created_at,
        review: scored.review,
        terms: {
          validityNote: "स्कॉलरशिप BMB EDUCOM AI SEMINAR की तारीख से 15 दिनों तक मान्य होगी।",
          conditionNote: "कोर्स का शुल्क डिस्काउंट राशि के बराबर नहीं होगा।"
        }
      });
    } catch (err: any) {
      console.error("Scholarship submission error:", err);
      res.status(500).json({ error: "Failed to submit scholarship quiz", details: err?.message });
    }
  });

  // 7.3 Get Official AI Seminar Mega Quiz Leaderboard & Prize Winners (Top 20 Winners)
  app.get("/api/scholarship/leaderboard", (req: Request, res: Response) => {
    try {
      const winners = db.getScholarshipWinners();
      const settings = db.getSeminarSettings();
      const p1 = Number(settings.cash_prize_1st ?? 3000);
      const p2 = Number(settings.cash_prize_2nd ?? 2000);
      const p3 = Number(settings.cash_prize_3rd ?? 1500);
      const s1 = Number(settings.scholarship_1st ?? 10000);
      const s2 = Number(settings.scholarship_2nd ?? 8000);
      const s3 = Number(settings.scholarship_3rd ?? 5000);
      const s4_20 = Number(settings.scholarship_4_to_20 ?? 1000);
      const sPart = Number(settings.scholarship_participation ?? 500);

      res.json({
        totalParticipants: winners.length,
        winners,
        prizes: {
          first: `🥇 1st Prize: ₹${p1.toLocaleString("en-IN")}/- नकद + ₹${s1.toLocaleString("en-IN")}/- BMB स्कॉलरशिप`,
          second: `🥈 2nd Prize: ₹${p2.toLocaleString("en-IN")}/- नकद + ₹${s2.toLocaleString("en-IN")}/- BMB स्कॉलरशिप`,
          third: `🥉 3rd Prize: ₹${p3.toLocaleString("en-IN")}/- नकद + ₹${s3.toLocaleString("en-IN")}/- BMB स्कॉलरशिप`,
          ranks4to20: `🎁 Ranks 4-20 (17 Winners): आकर्षक उपहार + ₹${s4_20.toLocaleString("en-IN")}/- BMB स्कॉलरशिप`,
          allParticipants: `📜 सभी शेष प्रतिभागी: ₹${sPart.toLocaleString("en-IN")}/- BMB स्कॉलरशिप + प्रमाण-पत्र`
        },
        terms: {
          validityDays: 15,
          validityText: "स्कॉलरशिप BMB EDUCOM AI SEMINAR की तारीख से केवल 15 दिनों तक मान्य होगी।",
          conditionText: "कोर्स का शुल्क डिस्काउंट राशि के बराबर नहीं होगा।"
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch scholarship leaderboard", details: err?.message });
    }
  });

  // ==========================================
  // ADMIN AUTHENTICATION & CRM API ROUTES
  // ==========================================

  // 7.9 Check whether an Admin account exists (Dynamic setup check)
  app.get("/api/admin/auth-status", (req: Request, res: Response) => {
    try {
      const hasAdmin = db.hasAdminUsers();
      const totalAdmins = db.getAllAdminUsers().length;
      res.json({
        hasAdmin,
        totalAdmins
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to check admin status", details: err?.message });
    }
  });

  // 7.10 Super Admin Initial Setup (Admin fills their own credentials - No hardcoding)
  app.post("/api/admin/setup", async (req: Request, res: Response) => {
    try {
      if (db.hasAdminUsers()) {
        return res.status(400).json({
          error: "सुपर एडमिन अकाउंट पहले से पंजीकृत है। कृपया अपने क्रेडेंशियल से लॉगिन करें।"
        });
      }

      const parseResult = AdminSetupInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.issues[0]?.message || "अमान्य इनपुट विवरण";
        return res.status(400).json({ error: errorMsg, details: parseResult.error.flatten() });
      }

      const { name, whatsapp_number, email, password } = parseResult.data;

      // Hash password using bcrypt
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newAdmin = await db.createSuperAdminUser({
        name: name.trim(),
        whatsapp_number: whatsapp_number.trim(),
        email: (email || "").trim(),
        password_hash: passwordHash
      });

      db.logAudit({
        admin_id: newAdmin.id,
        admin_name: newAdmin.name,
        action: "INITIAL_SUPERADMIN_SETUP",
        entity: "admin_users",
        entity_id: newAdmin.id,
        metadata: { whatsapp: newAdmin.whatsapp_number, email: newAdmin.email }
      });

      // Issue JWT token so admin is logged in immediately upon creating credentials
      const token = jwt.sign(
        {
          id: newAdmin.id,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role,
          whatsapp_number: newAdmin.whatsapp_number
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        success: true,
        message: "सुपर एडमिन क्रेडेंशियल सफलतापूर्वक सेट हो गए!",
        token,
        admin: {
          id: newAdmin.id,
          name: newAdmin.name,
          email: newAdmin.email,
          whatsapp_number: newAdmin.whatsapp_number,
          role: newAdmin.role
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to setup admin account", details: err?.message });
    }
  });

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

      const adminPhone = admin.whatsapp_number;
      if (!adminPhone) {
        return res.status(400).json({
          error: "इस एडमिन खाते से कोई वैध WhatsApp नंबर लिंक नहीं है।"
        });
      }
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

      // When WhatsApp API is NOT configured, be honest with the user —
      // DO NOT pretend the OTP was sent. Show the directWhatsAppLink as the
      // actual recovery method (user clicks it, opens WhatsApp chat prefilled
      // with OTP, sends to themselves, then enters OTP in the form).
      // When WhatsApp API IS configured, OTP is sent automatically — user just
      // enters the OTP received in their WhatsApp chat.
      const isWhatsAppConfigured = waResult.status !== "pending_configuration";

      res.json({
        message: isWhatsAppConfigured
          ? `✓ 6-अंकों का पासवर्ड रीसेट OTP आपके पंजीकृत WhatsApp नंबर (${maskedPhone}) पर भेज दिया गया है!`
          : `⚠️ WhatsApp API अभी कॉन्फ़िगर नहीं है। OTP प्राप्त करने के लिए नीचे दिए गए "Open WhatsApp" बटन पर क्लिक करें — यह आपके WhatsApp में OTP के साथ एक संदेश खोलेगा। संदेश भेजने के बाद आप उस OTP को नीचे दर्ज कर सकते हैं।`,
        whatsapp_masked: maskedPhone,
        identifier: admin.email,
        directWhatsAppLink: waResult.directWhatsAppLink,
        whatsappConfigured: isWhatsAppConfigured,
        // SECURITY: Never expose the OTP in API response.
        // User gets OTP only via WhatsApp (configured API) OR via directWhatsAppLink (fallback).
        // NO simulatedOtp field — that was a security hole.
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
      const events = db.getSeminarEventsWithStats();
      const leads = db.getAllAdmissionLeads();
      const registrations = db.getAllRegistrations({ eventId });
      const whatsAppMessages = db.getAllWhatsAppMessages().slice(0, 50);
      const auditLogs = db.getAllAuditLogs().slice(0, 30);
      const driveStatus = GoogleDriveService.getIntegrationStatus();
      const passPurchases = db.getAllPassPurchases();
      const scholarshipSubmissions = db.getAllScholarshipSubmissions();
      const scholarshipWinners = db.getScholarshipWinners();

      res.json({
        metrics,
        currentSeminar,
        events,
        leads,
        registrations,
        whatsAppMessages,
        auditLogs,
        driveStatus,
        passPurchases,
        scholarshipSubmissions,
        scholarshipWinners
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

  // 11.0.1 Get All Seminars with Full Record Statistics
  app.get("/api/admin/seminars", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const seminars = db.getSeminarEventsWithStats();
      res.json({ seminars });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load seminars list", details: err?.message });
    }
  });

  // 11.0.2 Delete / Purge Specific Seminar Event and all its Data
  app.delete("/api/admin/seminar/:eventId", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      const clearOnly = req.query.clearOnly === "true";
      const result = db.deleteSeminarEventAndData(eventId, clearOnly);

      db.logAudit({
        admin_id: req.adminUser?.id,
        admin_name: req.adminUser?.name,
        action: clearOnly ? "CLEAR_SEMINAR_RECORDS" : "DELETE_SEMINAR_EVENT",
        entity: "seminar_events",
        entity_id: eventId,
        metadata: result
      });

      res.json({
        message: clearOnly
          ? `सेमिनार का डेटा सफलतापूर्वक रीसेट किया गया (${result.deletedRegistrations} रजिस्ट्रेशन, ${result.deletedLeads} लीड्स, ${result.deletedScholarshipSubmissions} टेस्ट हटाए गए)`
          : `सेमिनार और उसका सारा डेटा सफलतापूर्वक हटा दिया गया (${result.deletedRegistrations} रजिस्ट्रेशन, ${result.deletedLeads} लीड्स, ${result.deletedScholarshipSubmissions} टेस्ट हटाए गए)`,
        result
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete seminar data", details: err?.message });
    }
  });

  // 11.0.3 Delete / Purge All Old Seminars Data
  app.post("/api/admin/seminars/clear-old", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const { keepEventId } = req.body || {};
      const result = db.deleteOldSeminarsData(keepEventId);

      db.logAudit({
        admin_id: req.adminUser?.id,
        admin_name: req.adminUser?.name,
        action: "PURGE_ALL_OLD_SEMINARS",
        entity: "seminar_events",
        entity_id: "all_past_events",
        metadata: result
      });

      res.json({
        message: `सभी पुराने सेमिनारों का डेटा सफलतापूर्वक हटा दिया गया (${result.deletedEventsCount} सेमिनार, ${result.deletedRegistrations} रजिस्ट्रेशन, ${result.deletedLeads} लीड्स, ${result.deletedScholarshipSubmissions} टेस्ट रिकॉर्ड्स हटाए गए)`,
        result
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to purge old seminars data", details: err?.message });
    }
  });

  // 11.0.4 Start New Seminar Session (Archive Previous)
  app.post("/api/admin/seminars/new", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const { event_date, title, description, start_time, end_time } = req.body || {};
      if (!event_date || !title) {
        return res.status(400).json({ error: "सेमिनार की तारीख (event_date) और शीर्षक (title) आवश्यक हैं।" });
      }

      const newEvent = db.archiveAndCreateNewSeminar({
        event_date,
        title,
        description,
        start_time,
        end_time
      });

      db.logAudit({
        admin_id: req.adminUser?.id,
        admin_name: req.adminUser?.name,
        action: "START_NEW_SEMINAR_SESSION",
        entity: "seminar_events",
        entity_id: newEvent.id,
        metadata: newEvent
      });

      res.json({
        message: `नया सेमिनार सत्र '${newEvent.title}' सफलतापूर्वक तैयार हो गया है! पिछला सेमिनार आर्काइव कर दिया गया है।`,
        event: newEvent
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create new seminar session", details: err?.message });
    }
  });

  // 11.1 Admin Scholarship Submissions & Reset
  app.get("/api/admin/scholarship/submissions", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const submissions = db.getAllScholarshipSubmissions();
      res.json({ submissions });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load scholarship records", details: err?.message });
    }
  });

  app.post("/api/admin/scholarship/reset", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const { participant_id, participant_token } = req.body;
      let targetId = participant_id;
      if (!targetId && participant_token) {
        const p = db.getRegistrationByToken(participant_token);
        if (p) targetId = p.id;
      }
      if (!targetId) {
        return res.status(400).json({ error: "participant_id or participant_token is required" });
      }
      db.resetScholarshipAttempt(targetId);
      db.logAudit({
        admin_id: req.adminUser?.id,
        admin_name: req.adminUser?.name,
        action: "RESET_SCHOLARSHIP_ATTEMPT",
        entity: "scholarship_attempts",
        entity_id: targetId
      });
      res.json({ success: true, message: "Scholarship attempt has been reset successfully" });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to reset scholarship attempt", details: err?.message });
    }
  });

  // 11.2 Clear ALL Scholarship Submissions & Attempts (Reset Scholarship Leaderboard to 0)
  app.post("/api/admin/scholarship/clear-all", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const result = db.clearAllScholarshipData();
      db.logAudit({
        admin_id: req.adminUser?.id,
        admin_name: req.adminUser?.name,
        action: "CLEAR_ALL_SCHOLARSHIP_TEST_DATA",
        entity: "scholarship_submissions",
        entity_id: "all",
        metadata: result
      });
      res.json({
        success: true,
        message: `सभी AI स्कॉलरशिप टेस्ट सबमिशन और स्कोर सफलतापूर्वक 0 कर दिए गए (${result.clearedSubmissions} सबमिशन हटाए गए)।`,
        result
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to clear all scholarship test data", details: err?.message });
    }
  });

  app.post("/api/admin/quiz/reset", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const { participant_id, participant_token } = req.body;
      let targetId = participant_id;
      if (!targetId && participant_token) {
        const p = db.getRegistrationByToken(participant_token);
        if (p) targetId = p.id;
      }
      if (!targetId) {
        return res.status(400).json({ error: "participant_id or participant_token is required" });
      }
      db.resetQuizAttempt(targetId);
      db.logAudit({
        admin_id: req.adminUser?.id,
        admin_name: req.adminUser?.name,
        action: "RESET_SEMINAR_QUIZ_ATTEMPT",
        entity: "quiz_attempts",
        entity_id: targetId
      });
      res.json({ success: true, message: "Seminar quiz attempt has been reset successfully" });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to reset seminar quiz attempt", details: err?.message });
    }
  });

  // 11.3 Clear ALL Seminar Quiz Attempts (Reset Quiz Leaderboard to 0)
  app.post("/api/admin/quiz/clear-all", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const result = db.clearAllQuizData();
      db.logAudit({
        admin_id: req.adminUser?.id,
        admin_name: req.adminUser?.name,
        action: "CLEAR_ALL_SEMINAR_QUIZ_TEST_DATA",
        entity: "quiz_attempts",
        entity_id: "all",
        metadata: result
      });
      res.json({
        success: true,
        message: `सभी सेमिनार क्विज टेस्ट डेटा सफलतापूर्वक 0 कर दिए गए (${result.clearedAttempts} अटेम्प्ट्स हटाए गए)।`,
        result
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to clear all quiz test data", details: err?.message });
    }
  });

  // 11.4 Admin Pass Management & Marketing Leads
  app.get("/api/admin/passes", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const passes = db.getAllPassPurchases();
      const verifiedPasses = passes.filter(p => p.verification_status === "verified");
      const totalRevenue = verifiedPasses.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
      const freePasses = passes.filter(p => p.payment_method === "free_pass" || p.pass_type === "round1_winner_free");
      const paidPasses = passes.filter(p => p.payment_method === "upi_qr");

      res.json({
        passes,
        stats: {
          totalPasses: passes.length,
          verifiedPassesCount: verifiedPasses.length,
          freePassesCount: freePasses.length,
          paidPassesCount: paidPasses.length,
          totalRevenueRs: totalRevenue
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch pass purchases", details: err?.message });
    }
  });

  app.get("/api/admin/passes/export-leads", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const passes = db.getAllPassPurchases();
      const registrations = db.getAllRegistrations();
      
      const rows = [
        ["Pass ID", "Participant Name", "WhatsApp Number", "Amount Paid", "Original Amount", "Payment Type", "UTR Number", "Status", "Screenshot File", "Date & Time"].join(",")
      ];

      for (const p of passes) {
        rows.push([
          `"${p.id}"`,
          `"${(p.participant_name || "").replace(/"/g, '""')}"`,
          `"${p.whatsapp_number}"`,
          `"${p.amount_paid}"`,
          `"${p.original_amount}"`,
          `"${p.payment_method}"`,
          `"${p.utr_number || ""}"`,
          `"${p.verification_status}"`,
          `"${p.screenshot_filename || ""}"`,
          `"${p.created_at}"`
        ].join(","));
      }

      const csvContent = "\uFEFF" + rows.join("\r\n");
      const filename = `BMB_AI_Seminar_Pass_Marketing_Leads_${Date.now()}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to export pass leads", details: err?.message });
    }
  });

  // 11.5 Stage 2 Mega AI Quiz Live Toggle (Admin Control during seminar)
  app.post("/api/admin/stage2/toggle", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const { active } = req.body;
      const current = db.getSeminarSettings();
      const nextState = typeof active === "boolean" ? active : !current.is_stage2_active;
      const updated = db.updateSeminarSettings({
        is_stage2_active: nextState,
        stage2_activated_at: nextState ? new Date().toISOString() : undefined
      });
      res.json({
        success: true,
        is_stage2_active: updated.is_stage2_active,
        stage2_activated_at: updated.stage2_activated_at,
        message: updated.is_stage2_active
          ? "🟢 Stage 2 Mega Quiz सेमिनार में लाइव शुरू कर दिया गया है! सभी पात्र पास धारक छात्र अब परीक्षा दे सकते हैं।"
          : "🔴 Stage 2 Mega Quiz को लॉक कर दिया गया है।"
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to toggle Stage 2 status", details: err?.message });
    }
  });

  // 11.6 Admin Pass Verification & Approval (Approve / Reject UPI Payments)
  app.post("/api/admin/passes/:id/verify", authenticateAdmin, (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body; // "verified" | "rejected" | "pending"
      const currentPass = db.getAllPassPurchases().find(p => p.id === id);
      if (!currentPass) {
        return res.status(404).json({ error: "Pass record not found" });
      }

      const updated = db.updatePassPurchase(id, {
        verification_status: status === "rejected" ? "rejected" : status === "pending" ? "pending" : "verified",
        verified_at: status === "verified" || !status ? new Date().toISOString() : undefined,
        notes: notes !== undefined ? notes : currentPass.notes
      });

      res.json({
        success: true,
        pass: updated,
        message: status === "rejected"
          ? "पास अनुरोध अस्वीकृत (Rejected) कर दिया गया है।"
          : "पास सफलतापूर्वक सत्यापित (Verified) कर दिया गया है! छात्र अब सेमिनार व Stage 2 के लिए पात्र है।"
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update pass verification status", details: err?.message });
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

  // 16. Fallback 404 for unhandled API routes (prevents falling through to Vite/SPA index.html)
  app.all("/api/*", (req: Request, res: Response) => {
    res.status(404).json({
      error: `API endpoint not found: ${req.method} ${req.path}`,
      timestamp: new Date().toISOString()
    });
  });

  // ==========================================
  // VITE DEVELOPMENT & PRODUCTION MIDDLEWARES
  // ==========================================
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    // Lazy-load Vite only in local dev (Vite crashes on top-level import in serverless).
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
