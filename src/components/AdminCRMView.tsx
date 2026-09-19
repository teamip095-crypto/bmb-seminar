import React, { useState, useEffect } from "react";
import {
  AdmissionLeadItem,
  WhatsAppLogItem,
  QATestSuiteResponse,
  TestResultItem,
  FridaySeminarStatusResponse,
  SeminarEventWithStats,
  SeminarPassPurchase
} from "../types";
import {
  Shield,
  Users,
  Award,
  Calendar,
  MessageSquare,
  Download,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Save,
  Lock,
  LogOut,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Database,
  Phone,
  FileText,
  Key,
  Radio,
  Tv,
  Video,
  UserCheck,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Sparkles,
  HelpCircle,
  Send,
  Smartphone,
  ArrowLeft,
  Trophy,
  Loader2,
  RotateCcw,
  Gift,
  Trash2,
  Plus,
  Ticket,
  QrCode,
  Power
} from "lucide-react";

interface AdminCRMViewProps {
  seminarStatus: FridaySeminarStatusResponse | null;
  onSeminarStatusRefresh?: () => void;
}

export const AdminCRMView: React.FC<AdminCRMViewProps> = ({ seminarStatus, onSeminarStatusRefresh }) => {
  // Auth State
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem("bmb_admin_token"));
  const [adminUser, setAdminUser] = useState<{ id: string; name: string; email: string; whatsapp_number?: string; role: string } | null>(() => {
    const raw = localStorage.getItem("bmb_admin_user");
    return raw ? JSON.parse(raw) : null;
  });

  const [loginWhatsApp, setLoginWhatsApp] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dynamic Admin Presence & Setup State
  const [hasExistingAdmin, setHasExistingAdmin] = useState<boolean | null>(null);
  const [isCheckingAuthStatus, setIsCheckingAuthStatus] = useState<boolean>(true);

  // Super Admin Setup Form State (when no admin exists)
  const [setupName, setSetupName] = useState("");
  const [setupWhatsApp, setSetupWhatsApp] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [showSetupConfirmPassword, setShowSetupConfirmPassword] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSubmittingSetup, setIsSubmittingSetup] = useState(false);

  // Forgot Password / WhatsApp OTP Recovery Modal State
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<"request" | "verify">("request");
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotOTP, setForgotOTP] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotStatusMessage, setForgotStatusMessage] = useState<string | null>(null);
  const [forgotMaskedPhone, setForgotMaskedPhone] = useState<string | null>(null);
  const [forgotDirectWhatsAppLink, setForgotDirectWhatsAppLink] = useState<string | null>(null);
  const [forgotSimulatedOtp, setForgotSimulatedOtp] = useState<string | null>(null);
  const [isSendingForgotOTP, setIsSendingForgotOTP] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Active Sub-Tab: "crm" | "passes" | "scholarship" | "settings" | "account" | "qa_tests" | "backup"
  const [activeSubTab, setActiveSubTab] = useState<"crm" | "passes" | "scholarship" | "settings" | "account" | "qa_tests" | "backup">("crm");

  // Scholarship Management State
  const [scholarshipList, setScholarshipList] = useState<any[]>([]);
  const [loadingScholarship, setLoadingScholarship] = useState(false);
  const [scholarshipSearch, setScholarshipSearch] = useState("");

  // Seminar Settings State & Stage 2 Admin Control
  const [seminarSettings, setSeminarSettings] = useState({
    seminar_date_hi: "आगामी सेमिनार",
    seminar_date_en: "Upcoming Seminar",
    seminar_time: "11:00 AM – 4:00 PM IST",
    venue_location: "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)",
    reporting_time: "10:45 AM",
    live_stream_url: "https://drive.google.com/file/d/1lxitztPNHlEyRCzR720OVvbn_QoHXn12/preview?autoplay=1&loop=1",
    is_registration_open: true,
    is_stage2_active: false,
    stage2_activated_at: null as string | null,
    cash_prize_1st: 1000,
    cash_prize_2nd: 500,
    cash_prize_3rd: 200,
    cash_prize_consolation: "आकर्षक उपहार (Attractive Gifts)"
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsStatusMessage, setSettingsStatusMessage] = useState<string | null>(null);

  // Stage 2 Mega Quiz Admin Live Toggle State
  const [isTogglingStage2, setIsTogglingStage2] = useState(false);
  const [stage2ToggleStatus, setStage2ToggleStatus] = useState<string | null>(null);

  // Seminar Passes & QR Payment Verification State
  const [passFilter, setPassFilter] = useState<"all" | "free" | "paid" | "pending" | "verified">("all");
  const [passSearch, setPassSearch] = useState("");
  const [isVerifyingPassId, setIsVerifyingPassId] = useState<string | null>(null);
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);

  // Admin Account Profile & Password State (No hardcoded credentials)
  const [profileName, setProfileName] = useState(adminUser?.name || "");
  const [profileEmail, setProfileEmail] = useState(adminUser?.email || "");
  const [profileWhatsApp, setProfileWhatsApp] = useState(adminUser?.whatsapp_number || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileStatusMessage, setProfileStatusMessage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Excel Export State
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<{
    metrics?: any;
    leads?: AdmissionLeadItem[];
    registrations?: any[];
    events?: SeminarEventWithStats[];
    whatsAppMessages?: WhatsAppLogItem[];
    auditLogs?: any[];
    driveStatus?: any;
  }>({});
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Old Seminar Data Cleanup State
  const [seminarDeleteStatus, setSeminarDeleteStatus] = useState<string | null>(null);
  const [isDeletingSeminar, setIsDeletingSeminar] = useState(false);
  const [seminarToDelete, setSeminarToDelete] = useState<SeminarEventWithStats | null>(null);
  const [isClearOnlyConfirm, setIsClearOnlyConfirm] = useState(false);
  const [showBatchClearOldModal, setShowBatchClearOldModal] = useState(false);
  const [showCreateNewSeminarModal, setShowCreateNewSeminarModal] = useState(false);
  const [newSeminarDate, setNewSeminarDate] = useState("");
  const [newSeminarTitle, setNewSeminarTitle] = useState("");
  const [newSeminarDesc, setNewSeminarDesc] = useState("");
  const [isCreatingSeminar, setIsCreatingSeminar] = useState(false);

  // Test Data Reset States (In-App Modals, Reliable in iFrame)
  const [showClearScholarshipModal, setShowClearScholarshipModal] = useState(false);
  const [isClearingScholarship, setIsClearingScholarship] = useState(false);
  const [scholarshipActionStatus, setScholarshipActionStatus] = useState<string | null>(null);

  const [showClearQuizModal, setShowClearQuizModal] = useState(false);
  const [isClearingQuiz, setIsClearingQuiz] = useState(false);
  const [quizActionStatus, setQuizActionStatus] = useState<string | null>(null);

  const [showFreshResetModal, setShowFreshResetModal] = useState(false);
  const [isExecutingFreshReset, setIsExecutingFreshReset] = useState(false);
  const [freshResetStatus, setFreshResetStatus] = useState<string | null>(null);

  const [studentToResetScholarship, setStudentToResetScholarship] = useState<{ id: string; name: string } | null>(null);
  const [isResettingStudentScholarship, setIsResettingStudentScholarship] = useState(false);

  const [studentToResetQuiz, setStudentToResetQuiz] = useState<{ id: string; name: string } | null>(null);
  const [isResettingStudentQuiz, setIsResettingStudentQuiz] = useState(false);

  // CRM Filters
  const [crmStatusFilter, setCrmStatusFilter] = useState("all");
  const [crmSearchQuery, setCrmSearchQuery] = useState("");
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<AdmissionLeadItem | null>(null);

  // QA Test Suite State
  const [qaReport, setQaReport] = useState<QATestSuiteResponse | null>(null);
  const [isRunningQA, setIsRunningQA] = useState(false);
  const [qaFilterCategory, setQaFilterCategory] = useState("all");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginWhatsApp.trim()) {
      setLoginError("कृपया अपना पंजीकृत एडमिन WhatsApp नंबर दर्ज करें।");
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginWhatsApp.trim(), password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setAuthToken(data.token);
      setAdminUser(data.admin);
      setProfileName(data.admin?.name || "");
      setProfileEmail(data.admin?.email || "");
      setProfileWhatsApp(data.admin?.whatsapp_number || "");
      localStorage.setItem("bmb_admin_token", data.token);
      localStorage.setItem("bmb_admin_user", JSON.stringify(data.admin));
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Check whether any admin user exists in DB
  const checkAuthStatus = async () => {
    try {
      setIsCheckingAuthStatus(true);
      const res = await fetch("/api/admin/auth-status");
      const data = await res.json();
      setHasExistingAdmin(data.hasAdmin === true);
    } catch (err) {
      console.error("Auth status error:", err);
      setHasExistingAdmin(true);
    } finally {
      setIsCheckingAuthStatus(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // First-Time Super Admin Account Setup Handler (Admin defines their own credentials)
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);

    const cleanName = setupName.trim();
    if (!cleanName || cleanName.length < 2) {
      setSetupError("कृपया एडमिन का पूरा नाम दर्ज करें (कम से कम 2 अक्षर)।");
      return;
    }

    const cleanPhone = setupWhatsApp.replace(/\D/g, "");
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setSetupError("कृपया 10 अंकों का मान्य भारतीय WhatsApp नंबर दर्ज करें (शुरुआत 6-9 से)।");
      return;
    }

    if (!setupPassword || setupPassword.length < 6) {
      setSetupError("पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।");
      return;
    }

    if (setupPassword !== setupConfirmPassword) {
      setSetupError("पासवर्ड और पुष्टि पासवर्ड मेल नहीं खा रहे हैं। कृपया दोबारा जांचें।");
      return;
    }

    setIsSubmittingSetup(true);

    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          whatsapp_number: cleanPhone,
          email: setupEmail.trim() || undefined,
          password: setupPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "सुपर एडमिन सेटअप विफल रहा");
      }

      setAuthToken(data.token);
      setAdminUser(data.admin);
      setProfileName(data.admin?.name || "");
      setProfileEmail(data.admin?.email || "");
      setProfileWhatsApp(data.admin?.whatsapp_number || "");
      localStorage.setItem("bmb_admin_token", data.token);
      localStorage.setItem("bmb_admin_user", JSON.stringify(data.admin));
      setHasExistingAdmin(true);
    } catch (err: any) {
      setSetupError(err.message || "अकाउंट सेटअप करने में त्रुटि हुई");
    } finally {
      setIsSubmittingSetup(false);
    }
  };

  // 1. Forgot Password - Request WhatsApp OTP
  const handleRequestForgotOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotStatusMessage("❌ कृपया अपना पंजीकृत WhatsApp नंबर दर्ज करें।");
      return;
    }

    setIsSendingForgotOTP(true);
    setForgotStatusMessage(null);

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "OTP भेजने में विफल");
      }

      setForgotMaskedPhone(data.whatsapp_masked || null);
      setForgotDirectWhatsAppLink(data.directWhatsAppLink || null);
      setForgotSimulatedOtp(null); // Never trust simulatedOtp — backend no longer returns it
      setForgotStep("verify");
      // Show honest message based on whether WhatsApp API is configured
      if (data.whatsappConfigured === false) {
        setForgotStatusMessage(`⚠️ WhatsApp API अभी कॉन्फ़िगर नहीं है। OTP देखने के लिए नीचे दिए गए "Open WhatsApp Chat" बटन पर क्लिक करें — आपके WhatsApp में OTP के साथ एक संदेश खुलेगा। संदेश भेजने के बाद उस OTP को नीचे दर्ज करें। (वैकल्पिक: WhatsApp Business API क्रेडेंशियल्स सेट करने के लिए Vercel env vars WHATSAPP_API_TOKEN और WHATSAPP_PHONE_NUMBER_ID भरें)`);
      } else {
        setForgotStatusMessage(`✓ 6-अंकों का OTP कोड आपके पंजीकृत WhatsApp नंबर (${data.whatsapp_masked || ""}) पर भेज दिया गया है!`);
      }
    } catch (err: any) {
      setForgotStatusMessage("❌ " + (err.message || "OTP भेजने में विफल"));
    } finally {
      setIsSendingForgotOTP(false);
    }
  };

  // 2. Reset Password with WhatsApp OTP
  const handleResetPasswordWithOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOTP.trim() || forgotOTP.trim().length !== 6) {
      setForgotStatusMessage("❌ कृपया 6-अंकों का सही OTP कोड दर्ज करें।");
      return;
    }

    if (!forgotNewPassword) {
      setForgotStatusMessage("❌ कृपया नया पासवर्ड दर्ज करें।");
      return;
    }

    if (forgotNewPassword.length < 6) {
      setForgotStatusMessage("❌ नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotStatusMessage("❌ नया पासवर्ड और कन्फर्म पासवर्ड मेल नहीं खाते।");
      return;
    }

    setIsResettingPassword(true);
    setForgotStatusMessage(null);

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: forgotIdentifier.trim(),
          otp: forgotOTP.trim(),
          new_password: forgotNewPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "पासवर्ड रीसेट विफल");
      }

      // Automatically login with new token
      if (data.token && data.admin) {
        setAuthToken(data.token);
        setAdminUser(data.admin);
        localStorage.setItem("bmb_admin_token", data.token);
        localStorage.setItem("bmb_admin_user", JSON.stringify(data.admin));
        setProfileName(data.admin.name || "");
        setProfileEmail(data.admin.email || "");
        setProfileWhatsApp(data.admin.whatsapp_number || "");
        setShowForgotPasswordModal(false);
        setLoginWhatsApp("");
        setLoginPassword("");
      }
    } catch (err: any) {
      setForgotStatusMessage("❌ " + (err.message || "पासवर्ड रीसेट विफल"));
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setAdminUser(null);
    localStorage.removeItem("bmb_admin_token");
    localStorage.removeItem("bmb_admin_user");
    setLoginPassword("");
    checkAuthStatus();
  };

  const fetchDashboard = () => {
    if (!authToken) return;
    setLoadingDashboard(true);

    fetch("/api/admin/dashboard", {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then(res => {
        if (res.status === 401) {
          handleLogout();
          throw new Error("Session expired");
        }
        return res.json();
      })
      .then(data => {
        setDashboardData(data);
        setLoadingDashboard(false);
      })
      .catch(err => {
        console.error("Dashboard error:", err);
        setLoadingDashboard(false);
      });
  };

  const fetchSeminarSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSeminarSettings({
            seminar_date_hi: data.settings.seminar_date_hi || "आगामी सेमिनार",
            seminar_date_en: data.settings.seminar_date_en || "Upcoming Seminar",
            seminar_time: data.settings.seminar_time || "11:00 AM – 4:00 PM IST",
            venue_location: data.settings.venue_location || "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)",
            reporting_time: data.settings.reporting_time || "10:45 AM",
            live_stream_url: data.settings.live_stream_url || "https://drive.google.com/file/d/1lxitztPNHlEyRCzR720OVvbn_QoHXn12/preview?autoplay=1&loop=1",
            is_registration_open: data.settings.is_registration_open !== false,
            is_stage2_active: Boolean(data.settings.is_stage2_active),
            stage2_activated_at: data.settings.stage2_activated_at || null,
            cash_prize_1st: Number(data.settings.cash_prize_1st ?? 1000),
            cash_prize_2nd: Number(data.settings.cash_prize_2nd ?? 500),
            cash_prize_3rd: Number(data.settings.cash_prize_3rd ?? 200),
            cash_prize_consolation: data.settings.cash_prize_consolation || "आकर्षक उपहार (Attractive Gifts)"
          });
        }
      }
    } catch (err) {
      console.error("Error fetching seminar settings:", err);
    }
  };

  // Stage 2 Mega Quiz Live Admin Toggle Handler
  const handleToggleStage2 = async (targetActiveState?: boolean) => {
    if (!authToken) return;
    setIsTogglingStage2(true);
    setStage2ToggleStatus(null);
    try {
      const nextActive = typeof targetActiveState === "boolean" ? targetActiveState : !seminarSettings.is_stage2_active;
      const res = await fetch("/api/admin/stage2/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ is_active: nextActive })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to toggle Stage 2 Quiz");
      }

      setSeminarSettings(prev => ({
        ...prev,
        is_stage2_active: data.is_stage2_active,
        stage2_activated_at: data.stage2_activated_at
      }));

      setStage2ToggleStatus(
        data.is_stage2_active
          ? "🟢 Stage 2 Mega Quiz सेमिनार में सफलतापूर्वक लाइव चालू कर दिया गया है! सभी पात्र पास धारक परीक्षा दे सकते हैं।"
          : "🔒 Stage 2 Mega Quiz को एडमिन द्वारा रोक दिया गया है (Locked)।"
      );
      setTimeout(() => setStage2ToggleStatus(null), 8000);
      fetchDashboard();
      if (onSeminarStatusRefresh) onSeminarStatusRefresh();
    } catch (err: any) {
      setStage2ToggleStatus("❌ त्रुटि: " + (err.message || "Stage 2 स्थिति नहीं बदल सकी"));
    } finally {
      setIsTogglingStage2(false);
    }
  };

  // Seminar Pass Manual Verification Handler
  const handleVerifyPass = async (passId: string, status: "verified" | "rejected") => {
    if (!authToken) return;
    setIsVerifyingPassId(passId);
    try {
      const res = await fetch(`/api/admin/passes/${passId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) {
        alert("पास सत्यापन विफल: " + (data.error || "त्रुटि"));
        return;
      }
      fetchDashboard();
    } catch (err: any) {
      alert("पास सत्यापन त्रुटि: " + err.message);
    } finally {
      setIsVerifyingPassId(null);
    }
  };

  const fetchScholarshipData = async () => {
    if (!authToken) return;
    setLoadingScholarship(true);
    try {
      const res = await fetch("/api/admin/scholarship/submissions", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setScholarshipList(data.submissions || []);
      }
    } catch (err) {
      console.error("Scholarship fetch error:", err);
    } finally {
      setLoadingScholarship(false);
    }
  };

  const handleResetSeminarQuiz = (participantId: string, name: string) => {
    setStudentToResetQuiz({ id: participantId, name });
  };

  const handleConfirmResetStudentQuiz = async () => {
    if (!authToken || !studentToResetQuiz) return;
    setIsResettingStudentQuiz(true);
    try {
      const res = await fetch("/api/admin/quiz/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ participant_id: studentToResetQuiz.id })
      });
      if (res.ok) {
        await fetchDashboard();
        setQuizActionStatus(`✓ ${studentToResetQuiz.name} का सेमिनार क्विज सफलतापूर्वक रीसेट हो गया!`);
        setStudentToResetQuiz(null);
        setTimeout(() => setQuizActionStatus(null), 5000);
      } else {
        const err = await res.json();
        setQuizActionStatus("त्रुटि: " + (err.error || "रीसेट नहीं हो सका"));
      }
    } catch (err: any) {
      setQuizActionStatus("त्रुटि: " + err.message);
    } finally {
      setIsResettingStudentQuiz(false);
    }
  };

  const handleResetScholarship = (participantId: string, name: string) => {
    setStudentToResetScholarship({ id: participantId, name });
  };

  const handleConfirmResetStudentScholarship = async () => {
    if (!authToken || !studentToResetScholarship) return;
    setIsResettingStudentScholarship(true);
    try {
      const res = await fetch("/api/admin/scholarship/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ participant_id: studentToResetScholarship.id })
      });
      if (res.ok) {
        await fetchScholarshipData();
        await fetchDashboard();
        setScholarshipActionStatus(`✓ ${studentToResetScholarship.name} का AI स्कॉलरशिप टेस्ट सफलतापूर्वक रीसेट हो गया!`);
        setStudentToResetScholarship(null);
        setTimeout(() => setScholarshipActionStatus(null), 5000);
      } else {
        const err = await res.json();
        setScholarshipActionStatus("त्रुटि: " + (err.error || "रीसेट नहीं हो सका"));
      }
    } catch (err: any) {
      setScholarshipActionStatus("त्रुटि: " + err.message);
    } finally {
      setIsResettingStudentScholarship(false);
    }
  };

  const handleClearAllScholarshipData = async () => {
    if (!authToken) return;
    setIsClearingScholarship(true);
    try {
      const res = await fetch("/api/admin/scholarship/clear-all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchScholarshipData();
        await fetchDashboard();
        if (onSeminarStatusRefresh) onSeminarStatusRefresh();
        setScholarshipActionStatus(data.message || "✓ सभी AI स्कॉलरशिप टेस्ट सबमिशन और स्कोर 0 कर दिए गए!");
        setShowClearScholarshipModal(false);
        setTimeout(() => setScholarshipActionStatus(null), 6000);
      } else {
        setScholarshipActionStatus("त्रुटि: " + (data.error || "डेटा रीसेट नहीं हो सका"));
      }
    } catch (err: any) {
      setScholarshipActionStatus("त्रुटि: " + err.message);
    } finally {
      setIsClearingScholarship(false);
    }
  };

  const handleClearAllQuizData = async () => {
    if (!authToken) return;
    setIsClearingQuiz(true);
    try {
      const res = await fetch("/api/admin/quiz/clear-all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchDashboard();
        if (onSeminarStatusRefresh) onSeminarStatusRefresh();
        setQuizActionStatus(data.message || "✓ सभी सेमिनार क्विज टेस्ट डेटा 0 कर दिए गए!");
        setShowClearQuizModal(false);
        setTimeout(() => setQuizActionStatus(null), 6000);
      } else {
        setQuizActionStatus("त्रुटि: " + (data.error || "डेटा रीसेट नहीं हो सका"));
      }
    } catch (err: any) {
      setQuizActionStatus("त्रुटि: " + err.message);
    } finally {
      setIsClearingQuiz(false);
    }
  };

  const handleExecuteFreshReset = async () => {
    if (!authToken) return;
    setIsExecutingFreshReset(true);
    try {
      const res = await fetch("/api/admin/maintenance/clear-data", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchDashboard();
        await fetchScholarshipData();
        if (onSeminarStatusRefresh) onSeminarStatusRefresh();
        setFreshResetStatus(data.message || "✓ सभी टेस्ट व डमी डेटा 0 कर दिया गया! सिस्टम 100% फ्रेश है।");
        setShowFreshResetModal(false);
        setTimeout(() => setFreshResetStatus(null), 8000);
      } else {
        setFreshResetStatus("त्रुटि: " + (data.error || "डेटा रीसेट नहीं हो सका"));
      }
    } catch (err: any) {
      setFreshResetStatus("त्रुटि: " + err.message);
    } finally {
      setIsExecutingFreshReset(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchDashboard();
      fetchSeminarSettings();
      fetchScholarshipData();
    }
  }, [authToken]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      setSettingsStatusMessage("❌ कृपया पहले एडमिन लॉगिन करें (Please login as admin first)");
      return;
    }
    setIsSavingSettings(true);
    setSettingsStatusMessage(null);

    try {
      const payload = {
        seminar_date_hi: seminarSettings.seminar_date_hi?.trim() || "आगामी सेमिनार",
        seminar_date_en: seminarSettings.seminar_date_en?.trim() || "Upcoming Seminar",
        seminar_time: seminarSettings.seminar_time?.trim() || "11:00 AM – 4:00 PM IST",
        venue_location: seminarSettings.venue_location?.trim() || "BMB Educom टेक हब",
        reporting_time: seminarSettings.reporting_time?.trim() || "10:45 AM",
        live_stream_url: seminarSettings.live_stream_url || "",
        is_registration_open: Boolean(seminarSettings.is_registration_open),
        cash_prize_1st: Number(seminarSettings.cash_prize_1st) || 1000,
        cash_prize_2nd: Number(seminarSettings.cash_prize_2nd) || 500,
        cash_prize_3rd: Number(seminarSettings.cash_prize_3rd) || 200,
        cash_prize_consolation: seminarSettings.cash_prize_consolation?.trim() || "आकर्षक उपहार"
      };

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update seminar settings");
      }

      setSettingsStatusMessage("✓ सेमिनार सेटिंग्स व नकद पुरस्कार सफलतापूर्वक सुरक्षित हो गए!");
      setTimeout(() => setSettingsStatusMessage(null), 5000);
      fetchSeminarSettings();
      onSeminarStatusRefresh?.();
    } catch (err: any) {
      setSettingsStatusMessage("❌ त्रुटि: " + (err.message || "सेटिंग्स अपडेट नहीं हो सकी"));
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Dedicated handler for saving Quiz Prize Amounts from Scholarship view
  const [isSavingPrizes, setIsSavingPrizes] = useState(false);
  const [prizeStatusMessage, setPrizeStatusMessage] = useState<string | null>(null);

  const handleSavePrizeAmounts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authToken) {
      setPrizeStatusMessage("❌ कृपया पहले एडमिन लॉगिन करें");
      return;
    }
    setIsSavingPrizes(true);
    setPrizeStatusMessage(null);

    try {
      const payload = {
        ...seminarSettings,
        cash_prize_1st: Number(seminarSettings.cash_prize_1st) || 1000,
        cash_prize_2nd: Number(seminarSettings.cash_prize_2nd) || 500,
        cash_prize_3rd: Number(seminarSettings.cash_prize_3rd) || 200,
        cash_prize_consolation: seminarSettings.cash_prize_consolation?.trim() || "आकर्षक उपहार"
      };

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update quiz prizes");
      }

      setPrizeStatusMessage("✓ क्विज़ नकद पुरस्कार राशि सुरक्षित हो गई और पूरे ऐप में लाइव रिफ्लेक्ट हो गई!");
      setTimeout(() => setPrizeStatusMessage(null), 5000);
      fetchSeminarSettings();
      onSeminarStatusRefresh?.();
    } catch (err: any) {
      setPrizeStatusMessage("❌ त्रुटि: " + (err.message || "पुरस्कार राशि अपडेट नहीं हो सकी"));
    } finally {
      setIsSavingPrizes(false);
    }
  };

  // Update Admin Account Profile & Credentials (Name, Email, New Password)
  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    if (newPassword && newPassword !== confirmPassword) {
      setProfileStatusMessage("❌ नया पासवर्ड और कन्फर्म पासवर्ड मेल नहीं खा रहे हैं (Passwords do not match)");
      return;
    }

    setIsSavingProfile(true);
    setProfileStatusMessage(null);

    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: profileName.trim(),
          email: profileEmail.trim(),
          whatsapp_number: profileWhatsApp.trim(),
          ...(currentPassword && { current_password: currentPassword }),
          ...(newPassword && { new_password: newPassword })
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update admin credentials");
      }

      setAdminUser(data.admin);
      localStorage.setItem("bmb_admin_user", JSON.stringify(data.admin));
      if (data.token) {
        setAuthToken(data.token);
        localStorage.setItem("bmb_admin_token", data.token);
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setProfileStatusMessage("✓ सुपर एडमिन क्रेडेंशियल्स व पासवर्ड सफलतापूर्वक सुरक्षित हो गए!");
      setTimeout(() => setProfileStatusMessage(null), 5000);
    } catch (err: any) {
      setProfileStatusMessage("❌ त्रुटि: " + (err.message || "प्रोफाइल अपडेट नहीं हो सका"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Old Seminar Deletion & Management Handlers
  const handleDeleteSeminar = async (eventId: string, clearOnly: boolean = false) => {
    if (!authToken) return;
    setIsDeletingSeminar(true);
    setSeminarDeleteStatus(null);

    try {
      const res = await fetch(`/api/admin/seminar/${eventId}${clearOnly ? "?clearOnly=true" : ""}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "सेमिनार डेटा हटाने में विफलता");
      }

      setSeminarDeleteStatus(`✓ ${data.message || "सेमिनार डेटा सफलतापूर्वक हटा दिया गया!"}`);
      setSeminarToDelete(null);
      fetchDashboard();
      if (onSeminarStatusRefresh) {
        onSeminarStatusRefresh();
      }
      setTimeout(() => setSeminarDeleteStatus(null), 7000);
    } catch (err: any) {
      setSeminarDeleteStatus(`❌ त्रुटि: ${err.message || "सेमिनार डेटा हटाया नहीं जा सका"}`);
    } finally {
      setIsDeletingSeminar(false);
    }
  };

  const handleBatchClearOldSeminars = async () => {
    if (!authToken) return;
    setIsDeletingSeminar(true);
    setSeminarDeleteStatus(null);

    try {
      const res = await fetch("/api/admin/seminars/clear-old", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "पुराने सेमिनार डेटा हटाने में विफलता");
      }

      setSeminarDeleteStatus(`✓ ${data.message || "पुराने सेमिनारों का डेटा सफलतापूर्वक हटा दिया गया!"}`);
      setShowBatchClearOldModal(false);
      fetchDashboard();
      if (onSeminarStatusRefresh) {
        onSeminarStatusRefresh();
      }
      setTimeout(() => setSeminarDeleteStatus(null), 7000);
    } catch (err: any) {
      setSeminarDeleteStatus(`❌ त्रुटि: ${err.message || "पुराना सेमिनार डेटा हटाया नहीं जा सका"}`);
    } finally {
      setIsDeletingSeminar(false);
    }
  };

  const handleCreateNewSeminar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    if (!newSeminarDate || !newSeminarTitle.trim()) {
      alert("कृपया सेमिनार की तारीख और शीर्षक भरें।");
      return;
    }

    setIsCreatingSeminar(true);
    try {
      const res = await fetch("/api/admin/seminars/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          event_date: newSeminarDate,
          title: newSeminarTitle.trim(),
          description: newSeminarDesc.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "नया सेमिनार सत्र बनाने में विफलता");
      }

      setSeminarDeleteStatus(`✓ ${data.message || "नया सेमिनार सत्र सफलतापूर्वक शुरू हो गया!"}`);
      setShowCreateNewSeminarModal(false);
      setNewSeminarDate("");
      setNewSeminarTitle("");
      setNewSeminarDesc("");
      fetchDashboard();
      if (onSeminarStatusRefresh) {
        onSeminarStatusRefresh();
      }
      setTimeout(() => setSeminarDeleteStatus(null), 7000);
    } catch (err: any) {
      alert("त्रुटि: " + (err.message || "नया सेमिनार सत्र नहीं बन सका"));
    } finally {
      setIsCreatingSeminar(false);
    }
  };

  // Update CRM Lead Status
  const handleUpdateLead = async (leadId: string, updates: Partial<AdmissionLeadItem>) => {
    if (!authToken) return;

    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        fetchDashboard();
        setSelectedLeadForEdit(null);
      }
    } catch (err) {
      console.error("Lead update error:", err);
    }
  };

  // Run 100+ Production QA Tests
  const handleRunQATests = async () => {
    if (!authToken) return;
    setIsRunningQA(true);

    try {
      const res = await fetch("/api/admin/run-qa-tests", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      setQaReport(data);
    } catch (err) {
      console.error("QA tests error:", err);
    } finally {
      setIsRunningQA(false);
    }
  };

  // Complete Excel / CSV Export Trigger (Direct Blob Download for Excel with UTF-8 BOM)
  const handleExportExcel = async () => {
    if (!authToken) return;
    setIsExportingExcel(true);
    try {
      const res = await fetch(`/api/admin/export/excel?token=${authToken}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error("Excel export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BMB_Student_Marketing_Leads_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Excel download error:", err);
      // Fallback
      window.open(`/api/admin/export/excel?token=${authToken}`, "_blank");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportCSV = handleExportExcel;

  // System Backup Download Trigger
  const handleExportBackup = () => {
    if (!authToken) return;
    window.open(`/api/admin/export/backup?token=${authToken}`, "_blank");
  };

  // Unauthenticated: Check if Admin exists, else show Initial Setup or Sign In
  if (!authToken) {
    if (isCheckingAuthStatus) {
      return (
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs text-neutral-400">एडमिन सिस्टम स्थिति जांची जा रही है...</p>
        </div>
      );
    }

    // CASE 1: No Admin Exists -> Initial Setup Screen (Admin defines their own credentials)
    if (hasExistingAdmin === false) {
      return (
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-lg shadow-amber-500/10">
              <Shield className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold mx-auto mb-3 flex justify-center w-fit">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>प्रारंभिक सेटअप • Super Admin Setup</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-1.5">
              सुपर एडमिन क्रेडेंशियल बनाएं
            </h2>
            <p className="text-xs text-neutral-400 text-center mb-6 leading-relaxed">
              सिस्टम में कोई पूर्वनिर्धारित (predefined) या हार्डकोडेड पासवर्ड नहीं है। आप स्वयं अपना एडमिन खाता, मोबाइल नंबर और पासवर्ड सेट करें।
            </p>

            {setupError && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{setupError}</span>
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  एडमिन का पूरा नाम (Full Name) *
                </label>
                <input
                  id="input-setup-admin-name"
                  type="text"
                  required
                  placeholder="उदा. BMB एडमिन / संचालक का नाम"
                  value={setupName}
                  onChange={e => setSetupName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  आधिकारिक WhatsApp नंबर (10 अंक) *
                </label>
                <div className="relative">
                  <input
                    id="input-setup-admin-whatsapp"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="उदा. 98XXXXXXXX"
                    value={setupWhatsApp}
                    onChange={e => setSetupWhatsApp(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none font-mono"
                  />
                  <Smartphone className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  भविष्य में लॉगिन, पासवर्ड रिकवरी OTP व सिस्टम अलर्ट्स इसी नंबर पर आएंगे।
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  ईमेल पता (Email Address) <span className="text-neutral-500">(वैकल्पिक / Optional)</span>
                </label>
                <input
                  id="input-setup-admin-email"
                  type="email"
                  placeholder="उदा. admin@bmbeducom.com"
                  value={setupEmail}
                  onChange={e => setSetupEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    पासवर्ड बनाएं (Create Password) *
                  </label>
                  <div className="relative">
                    <input
                      id="input-setup-admin-password"
                      type={showSetupPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="कम से कम 6 अक्षर"
                      value={setupPassword}
                      onChange={e => setSetupPassword(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 pl-3 pr-9 text-xs text-white focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPassword(!showSetupPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      {showSetupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    पासवर्ड पुष्टि (Confirm Password) *
                  </label>
                  <div className="relative">
                    <input
                      id="input-setup-admin-confirm-password"
                      type={showSetupConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="पासवर्ड दोबारा दर्ज करें"
                      value={setupConfirmPassword}
                      onChange={e => setSetupConfirmPassword(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 pl-3 pr-9 text-xs text-white focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupConfirmPassword(!showSetupConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      {showSetupConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                id="btn-admin-setup-submit"
                type="submit"
                disabled={isSubmittingSetup}
                className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 disabled:opacity-50 cursor-pointer transition-all"
              >
                {isSubmittingSetup ? (
                  <>
                    <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>क्रेडेंशियल बनाए जा रहे हैं...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>सुपर एडमिन क्रेडेंशियल बनाएं और लॉगिन करें</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
              <p className="text-[11px] text-neutral-500">
                100% सुरक्षित • पासवर्ड उद्योग मानक Bcrypt से एन्क्रिप्ट होता है • BMB Educom
              </p>
            </div>
          </div>
        </div>
      );
    }

    // CASE 2: Admin Exists -> Sign In Screen (No hardcoded credentials, no auto-fill)
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold text-white text-center mb-1">
            BMB Super Admin & CRM
          </h2>
          <p className="text-xs text-neutral-400 text-center mb-6">
            अपने पंजीकृत WhatsApp नंबर और पासवर्ड से लॉगिन करें
          </p>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Admin WhatsApp Number (एडमिन व्हाट्सएप नंबर)
              </label>
              <div className="relative">
                <input
                  id="input-admin-whatsapp"
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-अंकीय पंजीकृत WhatsApp नंबर"
                  value={loginWhatsApp}
                  onChange={e => setLoginWhatsApp(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none font-mono"
                />
                <Smartphone className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Password (पासवर्ड)
              </label>
              <div className="relative">
                <input
                  id="input-admin-password"
                  type={showLoginPassword ? "text" : "password"}
                  required
                  placeholder="अपना एडमिन पासवर्ड दर्ज करें"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 pl-3 pr-10 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-0.5">
              <button
                id="btn-admin-forgot-password-trigger"
                type="button"
                onClick={() => {
                  setShowForgotPasswordModal(true);
                  setForgotStep("request");
                  setForgotIdentifier(loginWhatsApp.trim() || "");
                  setForgotStatusMessage(null);
                  setForgotDirectWhatsAppLink(null);
                  setForgotSimulatedOtp(null);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold hover:underline flex items-center gap-1.5 cursor-pointer py-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>पासवर्ड भूल गए? (Forgot Password via WhatsApp)</span>
              </button>
            </div>

            <button
              id="btn-admin-login-submit"
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? "Authenticating..." : "Sign In to Super Admin Center"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
            <p className="text-[11px] text-neutral-500">
              सुरक्षित सुपर एडमिन व CRM एक्सेस • BMB Educom
            </p>
          </div>
        </div>

        {/* FORGOT PASSWORD MODAL VIA WHATSAPP OTP */}
        {showForgotPasswordModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {forgotStep === "request" ? "पासवर्ड रिकवरी (WhatsApp OTP)" : "OTP सत्यापन व नया पासवर्ड"}
                    </h3>
                    <p className="text-[10px] text-neutral-400">Super Admin Password Reset</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Status Banner */}
              {forgotStatusMessage && (
                <div className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                  forgotStatusMessage.startsWith("✓")
                    ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-300"
                    : "bg-red-500/10 border border-red-500/40 text-red-300"
                }`}>
                  {forgotStatusMessage.startsWith("✓") ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{forgotStatusMessage}</span>
                </div>
              )}

              {/* STEP 1: REQUEST OTP VIA WHATSAPP */}
              {forgotStep === "request" && (
                <form onSubmit={handleRequestForgotOTP} className="space-y-4">
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    अपना पंजीकृत <strong>WhatsApp नंबर</strong> दर्ज करें। आपके WhatsApp पर 6-अंकों का वेरिफिकेशन OTP भेजा जाएगा।
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      पंजीकृत WhatsApp नंबर (Registered WhatsApp Number) *
                    </label>
                    <div className="relative">
                      <input
                        id="input-forgot-identifier"
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="10-अंकीय पंजीकृत WhatsApp नंबर"
                        value={forgotIdentifier}
                        onChange={e => setForgotIdentifier(e.target.value.replace(/\D/g, ""))}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none font-mono"
                      />
                      <Smartphone className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      id="btn-send-whatsapp-otp"
                      type="submit"
                      disabled={isSendingForgotOTP}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSendingForgotOTP ? "OTP भेजा जा रहा है..." : "WhatsApp पर OTP भेजें (Send OTP)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(false)}
                      className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 px-4 rounded-xl text-xs cursor-pointer"
                    >
                      वापस लॉगिन पर जाएं (Cancel)
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: VERIFY OTP AND SET NEW PASSWORD */}
              {forgotStep === "verify" && (
                <form onSubmit={handleResetPasswordWithOTP} className="space-y-4">
                  {/* WhatsApp Direct Open Helper — fallback when WhatsApp API not configured.
                      User clicks this → opens WhatsApp chat prefilled with OTP message →
                      user sends the message to themselves → reads OTP from chat → enters it below. */}
                  {forgotDirectWhatsAppLink && (
                    <div className="p-3 bg-amber-950/40 border-2 border-amber-700/70 rounded-xl space-y-2">
                      <div className="text-[11px] text-amber-300 font-bold flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>OTP देखने के लिए नीचे दिए गए बटन पर क्लिक करें:</span>
                      </div>
                      <p className="text-[10px] text-amber-200/70 leading-snug">
                        बटन पर क्लिक करें → आपके WhatsApp में OTP के साथ एक संदेश खुलेगा → "Send" बटन दबाएं → आपको OTP अपने चैट में दिखेगा।
                      </p>
                      <a
                        href={forgotDirectWhatsAppLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] px-4 py-2 rounded-lg shadow-sm"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>WhatsApp में OTP देखें (Open WhatsApp)</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}

                  {/* Simulated OTP Display — DISABLED (security hole). Backend no longer returns it. */}
                  {forgotSimulatedOtp && null}

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      6-अंकों का WhatsApp OTP कोड *
                    </label>
                    <input
                      id="input-forgot-otp"
                      type="text"
                      required
                      maxLength={6}
                      placeholder="उदा. 482915"
                      value={forgotOTP}
                      onChange={e => setForgotOTP(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-sm tracking-widest text-center font-mono font-bold text-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      नया पासवर्ड (New Password - न्यूनतम 6 अक्षर) *
                    </label>
                    <div className="relative">
                      <input
                        id="input-forgot-new-password"
                        type={showForgotNewPassword ? "text" : "password"}
                        required
                        placeholder="अपना नया पासवर्ड दर्ज करें"
                        value={forgotNewPassword}
                        onChange={e => setForgotNewPassword(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 pl-3 pr-10 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                      >
                        {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      नया पासवर्ड दोबारा दर्ज करें (Confirm Password) *
                    </label>
                    <div className="relative">
                      <input
                        id="input-forgot-confirm-password"
                        type={showForgotConfirmPassword ? "text" : "password"}
                        required
                        placeholder="नया पासवर्ड कन्फर्म करें"
                        value={forgotConfirmPassword}
                        onChange={e => setForgotConfirmPassword(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 pl-3 pr-10 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                      >
                        {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      id="btn-submit-reset-password"
                      type="submit"
                      disabled={isResettingPassword}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      <span>{isResettingPassword ? "पासवर्ड अपडेट हो रहा है..." : "नया पासवर्ड सुरक्षित करें व लॉगिन करें"}</span>
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => setForgotStep("request")}
                        className="text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>OTP दोबारा भेजें (Resend)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForgotPasswordModal(false)}
                        className="text-neutral-400 hover:text-white cursor-pointer"
                      >
                        रद्द करें (Cancel)
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const leadsList = dashboardData.leads || [];
  // Build a lookup map of registrations (by participant_id) so we can show full quiz result
  // (score, duration, status) instead of just the lead's quiz_score field.
  const registrationsById = new Map<string, any>();
  (dashboardData.registrations || []).forEach((r: any) => {
    if (r.id) registrationsById.set(r.id, r);
  });

  // Build a lookup map of scholarship submissions (by participant_id) for rank/prize info.
  const scholarshipByParticipantId = new Map<string, any>();
  (dashboardData.scholarshipSubmissions || []).forEach((s: any) => {
    if (s.participantId) scholarshipByParticipantId.set(s.participantId, s);
  });

  const filteredLeads = leadsList.filter(l => {
    const matchesStatus = crmStatusFilter === "all" || l.status === crmStatusFilter;
    const q = crmSearchQuery.toLowerCase();
    const matchesSearch = !q ||
      (l.participant?.name.toLowerCase().includes(q) ||
       l.participant?.whatsapp_number.includes(q) ||
       (l.participant?.city && l.participant.city.toLowerCase().includes(q)) ||
       (l.participant?.full_address && l.participant.full_address.toLowerCase().includes(q)));
    return matchesStatus && matchesSearch;
  });

  const m = dashboardData.metrics;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Header & Admin Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 sm:p-4 mb-4 sm:mb-6 shadow-xl">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-base font-bold text-white">
              BMB Super Admin & CRM Command Center
            </h2>
            <p className="text-[10px] sm:text-[11px] text-neutral-400">
              Logged in: <strong className="text-amber-400">{adminUser?.name}</strong> ({adminUser?.role})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="p-1.5 sm:p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loadingDashboard ? "animate-spin" : ""}`} />
          </button>

          <button
            id="btn-admin-logout"
            onClick={handleLogout}
            className="flex items-center gap-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 px-2.5 py-1.5 sm:px-3 rounded-xl text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {m && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Total Leads</span>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5 sm:mt-1 font-mono">{m.totalRegistrations}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5">
            <span className="text-[9px] sm:text-[10px] text-amber-400 uppercase font-bold tracking-wider">Seminar Event</span>
            <div className="text-lg sm:text-xl font-bold text-amber-400 mt-0.5 sm:mt-1 font-mono">{m.activeEventRegistrations}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5">
            <span className="text-[9px] sm:text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Quizzes Taken</span>
            <div className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5 sm:mt-1 font-mono">{m.quizCompleted}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5">
            <span className="text-[9px] sm:text-[10px] text-sky-400 uppercase font-bold tracking-wider">Avg Score</span>
            <div className="text-lg sm:text-xl font-bold text-sky-400 mt-0.5 sm:mt-1 font-mono">{m.averageScore} / 20</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5">
            <span className="text-[9px] sm:text-[10px] text-amber-300 uppercase font-bold tracking-wider">20/20 Scorers</span>
            <div className="text-lg sm:text-xl font-bold text-amber-300 mt-0.5 sm:mt-1 font-mono">{m.topPerformersCount}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5">
            <span className="text-[9px] sm:text-[10px] text-purple-400 uppercase font-bold tracking-wider">Scholarship Tests</span>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5 sm:mt-1 font-mono">{scholarshipList.length}</div>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 border-b border-neutral-800 pb-2.5 sm:pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab("crm")}
          className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
            activeSubTab === "crm"
              ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
              : "bg-neutral-900 text-neutral-300 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Admission CRM ({leadsList.length})</span>
        </button>

        <button
          id="tab-admin-passes-stage2"
          onClick={() => setActiveSubTab("passes")}
          className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
            activeSubTab === "passes"
              ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
              : "bg-neutral-900 text-neutral-300 hover:text-white"
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>🎟️ सेमिनार पास व स्टेज 2 नियंत्रण ({dashboardData?.passPurchases?.length || 0})</span>
        </button>

        <button
          id="tab-admin-scholarship"
          onClick={() => setActiveSubTab("scholarship")}
          className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
            activeSubTab === "scholarship"
              ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
              : "bg-neutral-900 text-neutral-300 hover:text-white"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>AI स्कॉलरशिप टेस्ट ({scholarshipList.length})</span>
        </button>

        <button
          id="tab-admin-seminar-settings"
          onClick={() => setActiveSubTab("settings")}
          className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
            activeSubTab === "settings"
              ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
              : "bg-neutral-900 text-neutral-300 hover:text-white"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>सेमिनार दिनांक व लाइव स्ट्रीम</span>
        </button>

        <button
          id="tab-admin-account-security"
          onClick={() => setActiveSubTab("account")}
          className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
            activeSubTab === "account"
              ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
              : "bg-neutral-900 text-neutral-300 hover:text-white"
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>एडमिन पासवर्ड बदलें</span>
        </button>

        <button
          onClick={() => setActiveSubTab("qa_tests")}
          className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
            activeSubTab === "qa_tests"
              ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
              : "bg-neutral-900 text-neutral-300 hover:text-white"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>100+ QA Tests</span>
        </button>

        <button
          onClick={() => setActiveSubTab("backup")}
          className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
            activeSubTab === "backup"
              ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
              : "bg-neutral-900 text-neutral-300 hover:text-white"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Backup & Export</span>
        </button>
      </div>

      {/* VIEW: CRM LEADS PIPELINE */}
      {activeSubTab === "crm" && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search name, phone, city..."
                  value={crmSearchQuery}
                  onChange={e => setCrmSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={crmStatusFilter}
                onChange={e => setCrmStatusFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-2.5 text-xs text-white focus:outline-none"
              >
                <option value="all">All Stages</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Demo/Seminar Attended">Demo/Seminar Attended</option>
                <option value="Admission Discussion">Admission Discussion</option>
                <option value="Converted">Converted</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>

            <button
              id="btn-crm-clear-quiz"
              onClick={() => setShowClearQuizModal(true)}
              className="bg-red-950/50 hover:bg-red-900/70 text-red-300 border border-red-500/30 text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer font-semibold"
              title="सभी छात्रों के सेमिनार क्विज स्कोर 0 करें"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>क्विज स्कोर 0 करें</span>
            </button>

            <button
              id="btn-crm-export-excel"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isExportingExcel ? "Downloading..." : "Export Marketing Excel"}</span>
            </button>
          </div>

          {quizActionStatus && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
              <span>{quizActionStatus}</span>
              <button onClick={() => setQuizActionStatus(null)} className="text-emerald-400 hover:text-white ml-2 text-sm font-bold">✕</button>
            </div>
          )}

          {/* CRM Leads Table — shows full participant + quiz + scholarship details */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Lead / Participant</th>
                    <th className="py-3 px-4">Phone & Address</th>
                    <th className="py-3 px-4">Details / Source</th>
                    <th className="py-3 px-4 text-center">2-Min Quiz<br/>(Score/Time/Status)</th>
                    <th className="py-3 px-4 text-center">Scholarship Quiz<br/>(Score/Time/Rank/Prize)</th>
                    <th className="py-3 px-4">Pipeline Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 px-4 text-center">
                        <div className="max-w-md mx-auto space-y-2">
                          <Users className="w-8 h-8 text-neutral-600 mx-auto" />
                          <p className="text-sm font-bold text-white">कोई फेक डेटा या डमी लीड नहीं है (100% Clean CRM)</p>
                          <p className="text-xs text-neutral-400">
                            सिस्टम पूरी तरह फ्रेश और लाइव उपयोग के लिए तैयार है। जैसे ही कोई प्रतिभागी रजिस्ट्रेशन फॉर्म भरेगा, उसका विवरण यहाँ तुरंत दिखेगा।
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map(lead => {
                    const p = lead.participant;
                    const cleanPhone = p?.whatsapp_number.replace(/\D/g, "") || "";
                    const waChatLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`नमस्ते ${p?.name || ""} जी, BMB Educom AI सेमिनार में भाग लेने के लिए धन्यवाद। एडमिशन और प्रैक्टिकल कोर्स के बारे में अधिक जानकारी के लिए हम आपसे संपर्क कर रहे हैं।`)}`;

                    // Look up full registration record to get the quizResult object (score + duration + status)
                    const fullReg = p?.id ? registrationsById.get(p.id) : undefined;
                    const quizResult = fullReg?.quizResult; // {score, total_questions, duration_seconds, result_status}
                    const scholarship = p?.id ? scholarshipByParticipantId.get(p.id) : undefined;

                    return (
                      <tr key={lead.id} className="hover:bg-neutral-850/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{p?.name || "Participant"}</div>
                          <div className="text-[11px] font-mono text-neutral-400">{p?.registration_id}</div>
                          <div className="text-[10px] text-neutral-500 mt-0.5">Seat: {p?.seat_number || "—"}</div>
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="text-white font-mono">{p?.whatsapp_number}</div>
                          <div className="text-[11px] text-neutral-400 truncate" title={p?.full_address || p?.city || ""}>
                            {p?.full_address || p?.city || "Registered"}
                          </div>
                          {p?.email && <div className="text-[10px] text-neutral-500 truncate">{p.email}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-neutral-200">{p?.education || "AI Seminar"}</div>
                          <div className="text-[11px] text-amber-400">{p?.occupation || "AI Learner"}</div>
                          {p?.age_group && <div className="text-[10px] text-neutral-500">Age: {p.age_group}</div>}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {quizResult ? (
                            <div className="space-y-1">
                              <div className={`text-base font-black ${quizResult.score >= 3 ? "text-emerald-400" : "text-amber-400"}`}>
                                {quizResult.score}<span className="text-neutral-500 text-xs">/{quizResult.total_questions || 5}</span>
                              </div>
                              <div className="text-[10px] text-neutral-400 font-mono">
                                {quizResult.duration_seconds}s
                              </div>
                              <div className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded inline-block ${
                                quizResult.result_status === "passed" ? "bg-emerald-500/20 text-emerald-300" :
                                quizResult.result_status === "time_out" ? "bg-orange-500/20 text-orange-300" :
                                "bg-neutral-700/40 text-neutral-300"
                              }`}>
                                {quizResult.result_status === "passed" ? "Passed" :
                                 quizResult.result_status === "time_out" ? "Timeout" : "Participated"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-neutral-500 text-[11px]">Not Attempted</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {scholarship ? (
                            <div className="space-y-1">
                              <div className={`text-base font-black ${scholarship.rank <= 3 ? "text-yellow-400" : "text-purple-400"}`}>
                                {scholarship.score}<span className="text-neutral-500 text-xs">/{scholarship.totalQuestions}</span>
                              </div>
                              <div className="text-[10px] text-neutral-400 font-mono">
                                {scholarship.durationSeconds}s
                              </div>
                              <div className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block ${
                                scholarship.rank <= 3
                                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                                  : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                              }`}>
                                Rank #{scholarship.rank}
                              </div>
                              {scholarship.prizeText && (
                                <div className="text-[9px] text-amber-300 leading-tight max-w-[120px] mx-auto mt-1">
                                  {scholarship.prizeText}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-500 text-[11px]">Not Attempted</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={lead.status}
                            onChange={e => handleUpdateLead(lead.id, { status: e.target.value as any })}
                            className="bg-neutral-950 border border-neutral-700 rounded-lg py-1 px-2 text-[11px] text-amber-300 font-medium focus:outline-none"
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Interested">Interested</option>
                            <option value="Follow-up">Follow-up</option>
                            <option value="Demo/Seminar Attended">Demo/Seminar Attended</option>
                            <option value="Admission Discussion">Admission Discussion</option>
                            <option value="Converted">Converted</option>
                            <option value="Not Interested">Not Interested</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={waChatLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/40"
                              title="Direct WhatsApp Counseling Chat"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>

                            <button
                              onClick={() => setSelectedLeadForEdit(lead)}
                              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700"
                              title="Edit Notes & Schedule"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {quizResult && (
                              <button
                                onClick={() => handleResetSeminarQuiz(lead.participant_id, p?.name || "Participant")}
                                className="p-1.5 rounded-lg bg-red-950/40 text-red-300 border border-red-500/30 hover:bg-red-900/50"
                                title="सेमिनार क्विज रीसेट करें (Allow Re-test)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: 10-MINUTE AI SCHOLARSHIP MANAGEMENT */}
      {activeSubTab === "scholarship" && (
        <div className="space-y-4 sm:space-y-6">
          {/* MANUAL QUIZ PRIZE AMOUNT CONTROLLER */}
          <div className="bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>AI स्कॉलरशिप क्विज़ नकद पुरस्कार राशि (Manual Prize Amount Setup)</span>
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  यहाँ एडमिन द्वारा भरी गई राशि पूरे ऐप में (होम पेज, स्कॉलरशिप टेस्ट, लाइव पोस्टर व रिजल्ट्स) तुरंत लाइव रिफ्लेक्ट होगी।
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSavePrizeAmounts()}
                disabled={isSavingPrizes}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                {isSavingPrizes ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>सेव हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>पुरस्कार राशि सुरक्षित करें (Save Live)</span>
                  </>
                )}
              </button>
            </div>

            {prizeStatusMessage && (
              <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${
                prizeStatusMessage.startsWith("✓")
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}>
                {prizeStatusMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-amber-400 mb-1">
                  🥇 1st Rank Champion (₹ नकद)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={seminarSettings.cash_prize_1st ?? ""}
                    onChange={e => setSeminarSettings(prev => ({ ...prev, cash_prize_1st: Number(e.target.value) || 0 }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl py-2 pl-7 pr-3 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                    placeholder="1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  🥈 2nd Rank Winner (₹ नकद)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={seminarSettings.cash_prize_2nd ?? ""}
                    onChange={e => setSeminarSettings(prev => ({ ...prev, cash_prize_2nd: Number(e.target.value) || 0 }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl py-2 pl-7 pr-3 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                    placeholder="500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-600 mb-1">
                  🥉 3rd Rank Winner (₹ नकद)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={seminarSettings.cash_prize_3rd ?? ""}
                    onChange={e => setSeminarSettings(prev => ({ ...prev, cash_prize_3rd: Number(e.target.value) || 0 }))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl py-2 pl-7 pr-3 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                    placeholder="200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                  🎁 टॉप 7 उपहार (Ranks 4-10 Gifts)
                </label>
                <input
                  type="text"
                  value={seminarSettings.cash_prize_consolation || ""}
                  onChange={e => setSeminarSettings(prev => ({ ...prev, cash_prize_consolation: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="आकर्षक उपहार (Attractive Gifts)"
                />
              </div>
            </div>
          </div>

          {/* Top Scholarship Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">कुल टेस्ट सबमिशन</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">{scholarshipList.length}</div>
            </div>
            <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-4">
              <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">🥇 1st Prize (₹{Number(seminarSettings.cash_prize_1st ?? 1000).toLocaleString("en-IN")})</span>
              <div className="text-xs sm:text-sm font-bold text-amber-300 mt-1 truncate">
                {scholarshipList.find(s => s.rank === 1)?.participantName || "लंबित (Pending)"}
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4">
              <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">🥈 2nd Prize (₹{Number(seminarSettings.cash_prize_2nd ?? 500).toLocaleString("en-IN")})</span>
              <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1 truncate">
                {scholarshipList.find(s => s.rank === 2)?.participantName || "लंबित (Pending)"}
              </div>
            </div>
            <div className="bg-neutral-900 border border-amber-800/40 rounded-2xl p-4">
              <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">🥉 3rd Prize (₹{Number(seminarSettings.cash_prize_3rd ?? 200).toLocaleString("en-IN")})</span>
              <div className="text-xs sm:text-sm font-bold text-amber-500 mt-1 truncate">
                {scholarshipList.find(s => s.rank === 3)?.participantName || "लंबित (Pending)"}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
            {scholarshipActionStatus && (
              <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
                <span>{scholarshipActionStatus}</span>
                <button onClick={() => setScholarshipActionStatus(null)} className="text-emerald-400 hover:text-white ml-2 text-sm font-bold">✕</button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>AI स्कॉलरशिप टेस्ट लीडरबोर्ड व विजेता कंट्रोल</span>
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  1st: ₹{Number(seminarSettings.cash_prize_1st ?? 1000).toLocaleString("en-IN")} नकद • 2nd: ₹{Number(seminarSettings.cash_prize_2nd ?? 500).toLocaleString("en-IN")} • 3rd: ₹{Number(seminarSettings.cash_prize_3rd ?? 200).toLocaleString("en-IN")} • Top 7: {seminarSettings.cash_prize_consolation || "आकर्षक उपहार"}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={scholarshipSearch}
                    onChange={e => setScholarshipSearch(e.target.value)}
                    placeholder="नाम, शहर या मोबाइल नंबर खोजें..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  id="btn-clear-scholarship-test-data"
                  onClick={() => setShowClearScholarshipModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="सभी AI स्कॉलरशिप टेस्ट डेटा शून्य (0) करें"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span className="whitespace-nowrap">टेस्ट डेटा 0 करें</span>
                </button>
                <button
                  onClick={fetchScholarshipData}
                  className="p-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                  title="Refresh Scholarship"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingScholarship ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Submissions List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-[10px] uppercase text-neutral-400">
                    <th className="py-2.5 px-3">रैंक (Rank)</th>
                    <th className="py-2.5 px-3">छात्र का नाम (Student)</th>
                    <th className="py-2.5 px-3">मोबाइल (WhatsApp)</th>
                    <th className="py-2.5 px-3">शहर (City)</th>
                    <th className="py-2.5 px-3 text-center">स्कोर (Score /20)</th>
                    <th className="py-2.5 px-3 text-center">समय (Time Taken)</th>
                    <th className="py-2.5 px-3">पुरस्कार (Award)</th>
                    <th className="py-2.5 px-3 text-right">कार्रवाई (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {scholarshipList
                    .filter(s => {
                      if (!scholarshipSearch.trim()) return true;
                      const q = scholarshipSearch.toLowerCase();
                      return (
                        s.participantName?.toLowerCase().includes(q) ||
                        s.whatsappNumber?.includes(q) ||
                        s.city?.toLowerCase().includes(q)
                      );
                    })
                    .map(item => {
                      const cleanPhone = item.whatsappNumber?.replace(/\D/g, "") || "";
                      const congratMsg = `नमस्ते ${item.participantName} जी, BMB Educom AI स्कॉलरशिप टेस्ट में Rank #${item.rank} हासिल करने और "${item.prizeText}" जीतने पर हार्दिक बधाई! नकद पुरस्कार/गिफ्ट वितरण के संबंध में आपसे संपर्क किया जा रहा है।`;
                      const waChatLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(congratMsg)}`;

                      const isCash1 = item.rank === 1;
                      const isCash2 = item.rank === 2;
                      const isCash3 = item.rank === 3;
                      const isGift = item.rank >= 4 && item.rank <= 10;

                      return (
                        <tr key={item.id} className="hover:bg-neutral-850/50 transition-colors">
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${
                              isCash1 ? "bg-amber-500 text-neutral-950 shadow-md" :
                              isCash2 ? "bg-slate-300 text-neutral-950 font-bold" :
                              isCash3 ? "bg-amber-700 text-white font-bold" :
                              isGift ? "bg-purple-900/60 text-purple-300 border border-purple-500/30" :
                              "bg-neutral-800 text-neutral-400"
                            }`}>
                              #{item.rank}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-white text-xs sm:text-sm">{item.participantName}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">ID: {item.participantId?.substring(0, 10)}...</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-neutral-200">
                            {item.whatsappNumber}
                          </td>
                          <td className="py-3 px-3 text-neutral-300">
                            {item.city}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-black text-amber-400 text-sm font-mono">{item.score}</span>
                            <span className="text-[10px] text-neutral-500"> / {item.totalQuestions || 20}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-neutral-300">
                            {item.durationSeconds}s
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isCash1 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                              isCash2 ? "bg-slate-300/20 text-slate-200 border border-slate-400/40" :
                              isCash3 ? "bg-amber-700/20 text-amber-400 border border-amber-600/40" :
                              isGift ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" :
                              "bg-neutral-800 text-neutral-400"
                            }`}>
                              {item.prizeText}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {cleanPhone && (
                                <a
                                  href={waChatLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/40 transition-colors"
                                  title="WhatsApp पर बधाई संदेश भेजें"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => handleResetScholarship(item.participantId, item.participantName)}
                                className="p-1.5 rounded-lg bg-red-950/40 text-red-300 border border-red-500/30 hover:bg-red-900/50 transition-colors"
                                title="स्कॉलरशिप टेस्ट रीसेट करें (Allow Re-take)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {scholarshipList.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-neutral-500 text-xs">
                        अभी तक किसी छात्र ने AI स्कॉलरशिप टेस्ट पूरा नहीं किया है।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SEMINAR PASSES & STAGE 2 MANAGEMENT */}
      {activeSubTab === "passes" && (() => {
        const passList: SeminarPassPurchase[] = (dashboardData?.passPurchases as SeminarPassPurchase[]) || [];
        const freePassesCount = passList.filter(p => p.payment_method === "free_pass" || p.pass_type === "round1_winner_free").length;
        const paidPassesCount = passList.filter(p => p.payment_method !== "free_pass" && p.pass_type !== "round1_winner_free").length;
        const verifiedPassesCount = passList.filter(p => p.verification_status === "verified").length;
        const pendingPassesCount = passList.filter(p => p.verification_status === "pending").length;
        const totalPassRevenue = passList.reduce((acc, p) => acc + (p.amount_paid || 0), 0);

        const filteredPasses = passList.filter(p => {
          if (passFilter === "free") {
            if (p.payment_method !== "free_pass" && p.pass_type !== "round1_winner_free") return false;
          } else if (passFilter === "paid") {
            if (p.payment_method === "free_pass" || p.pass_type === "round1_winner_free") return false;
          } else if (passFilter === "pending") {
            if (p.verification_status !== "pending") return false;
          } else if (passFilter === "verified") {
            if (p.verification_status !== "verified") return false;
          }

          if (passSearch.trim()) {
            const q = passSearch.toLowerCase();
            const matchName = p.participant_name?.toLowerCase().includes(q);
            const matchPhone = p.whatsapp_number?.includes(q);
            const matchUtr = p.utr_number?.toLowerCase().includes(q);
            const matchInv = p.invoice_number?.toLowerCase().includes(q);
            return matchName || matchPhone || matchUtr || matchInv;
          }
          return true;
        });

        return (
          <div className="space-y-6">
            {/* TOP BAR: STAGE 2 MEGA QUIZ ADMIN LIVE CONTROL (CORE REQUIREMENT) */}
            <div className={`p-6 rounded-3xl border transition-all ${
              seminarSettings.is_stage2_active
                ? "bg-gradient-to-br from-emerald-950/80 via-neutral-900 to-neutral-950 border-emerald-500/60 shadow-2xl shadow-emerald-950/50"
                : "bg-gradient-to-br from-purple-950/50 via-neutral-900 to-neutral-950 border-purple-500/40"
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      seminarSettings.is_stage2_active
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                        : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                    }`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${seminarSettings.is_stage2_active ? "bg-emerald-400 animate-ping" : "bg-purple-400"}`} />
                      {seminarSettings.is_stage2_active ? "🟢 स्टेज 2 क्विज लाइव चालू है (STAGE 2 LIVE NOW)" : "🔒 स्टेज 2 क्विज अभी लॉक है (ADMIN LOCKED)"}
                    </span>

                    {seminarSettings.stage2_activated_at && seminarSettings.is_stage2_active && (
                      <span className="text-xs text-neutral-300 bg-neutral-900/80 px-2.5 py-1 rounded-lg border border-neutral-700">
                        लाइव चालू समय: {new Date(seminarSettings.stage2_activated_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-white flex items-center gap-2.5">
                    <Trophy className="w-6 h-6 text-amber-400" />
                    <span>Stage 2 Mega Quiz एडमिन नियंत्रण (Live Seminar Control)</span>
                  </h3>

                  <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
                    <strong>एडमिन का पूरा नियंत्रण:</strong> जब आप सेमिनार के दौरान नीचे दिए गए बटन से स्टेज 2 को लाइव चालू करेंगे, तभी सभी पात्र सेमिनार पास धारक (स्टेज 1 के <strong>शीर्ष 10 फ्री पास विजेता</strong> तथा <strong>₹199/- भुगतान पास धारक</strong>) अपनी स्क्रीन पर स्टेज 2 क्विज शुरू कर पाएंगे।
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <button
                    id="btn-admin-stage2-live-toggle"
                    type="button"
                    onClick={() => handleToggleStage2()}
                    disabled={isTogglingStage2}
                    className={`w-full sm:w-auto px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 cursor-pointer shadow-xl transition-all ${
                      seminarSettings.is_stage2_active
                        ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border-2 border-red-500/50 shadow-red-950/50"
                        : "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 shadow-emerald-500/30 ring-4 ring-emerald-500/20"
                    }`}
                  >
                    <Power className={`w-5 h-5 ${seminarSettings.is_stage2_active ? "text-red-400" : "text-neutral-950"}`} />
                    <span>
                      {isTogglingStage2
                        ? "प्रोसेस हो रहा है..."
                        : seminarSettings.is_stage2_active
                        ? "⏸️ स्टेज 2 क्विज रोकें / बंद करें (Lock Quiz)"
                        : "🚀 सेमिनार में स्टेज 2 क्विज लाइव चालू करें (Launch Live)"}
                    </span>
                  </button>
                </div>
              </div>

              {stage2ToggleStatus && (
                <div className="mt-4 p-3 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-semibold text-amber-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{stage2ToggleStatus}</span>
                </div>
              )}
            </div>

            {/* STATS OVERVIEW CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                  <span>कुल पास धारक (Total Eligible)</span>
                  <Ticket className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">{passList.length}</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                  {verifiedPassesCount} सत्यापित ({freePassesCount + paidPassesCount} पात्र)
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                  <span>शीर्ष 10 फ्री पास (Round 1)</span>
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">{freePassesCount} / 10</div>
                <div className="text-[10px] text-neutral-400 mt-1">
                  120s में 3-4 सही + न्यूनतम समय
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                  <span>₹199/- पेड पास (UPI QR)</span>
                  <QrCode className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono">{paidPassesCount}</div>
                <div className="text-[10px] text-neutral-400 mt-1">
                  {pendingPassesCount > 0 ? `${pendingPassesCount} सत्यापन लंबित` : "सभी सत्यापित"}
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                  <span>कुल संकलित राशि</span>
                  <span className="text-xs font-bold text-emerald-400">₹ INR</span>
                </div>
                <div className="text-2xl font-black text-white font-mono">₹{totalPassRevenue.toLocaleString("en-IN")}</div>
                <div className="text-[10px] text-neutral-400 mt-1">
                  UPI 9301056006 के माध्यम से
                </div>
              </div>
            </div>

            {/* BUSINESS LOGIC & RULES CALLOUT */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 text-xs text-neutral-300 space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>BMB EDUCOM सेमिनार पास व स्टेज 2 नियम (Business Rules)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] text-neutral-400 leading-relaxed">
                <div>
                  • <strong>Stage 1 क्विज:</strong> 120 सेकंड की समय-सीमा में 5 में से 3 या 4 प्रश्न सही करने वाले छात्र पास के लिए क्वालिफाई होते हैं।
                </div>
                <div>
                  • <strong>Top 10 Free Passes:</strong> क्वालिफाइड छात्रों में से सबसे कम समय में उत्तर देने वाले शीर्ष 10 को ₹500/- का सेमिनार पास बिल्कुल मुफ्त मिलता है।
                </div>
                <div>
                  • <strong>₹199/- Special Pass:</strong> बाकी सभी छात्रों को ₹500/- का पास मात्र ₹199/- में UPI QR (9301056006) से प्राप्त होता है।
                </div>
                <div>
                  • <strong>Stage 2 Mega Quiz:</strong> दोनों वर्ग (Top 10 Free + ₹199 Paid) सेमिनार व स्टेज 2 के लिए पात्र हैं, जिसे एडमिन सेमिनार में खुद लाइव चालू करेंगे।
                </div>
              </div>
            </div>

            {/* PASSES TABLE & FILTER CONTROLS */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-amber-400" />
                    <span>सेमिनार पास धारकों की सूची व भुगतान सत्यापन</span>
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    कुल {filteredPasses.length} पास प्रदर्शित • UPI स्क्रीनशॉट व UTR जाँचें
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      value={passSearch}
                      onChange={e => setPassSearch(e.target.value)}
                      placeholder="नाम / व्हाट्सएप / UTR खोजें..."
                      className="bg-neutral-950 border border-neutral-700 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-[11px]">
                    <button
                      onClick={() => setPassFilter("all")}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        passFilter === "all" ? "bg-amber-500 text-neutral-950 font-bold" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      सभी ({passList.length})
                    </button>
                    <button
                      onClick={() => setPassFilter("free")}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        passFilter === "free" ? "bg-emerald-500 text-neutral-950 font-bold" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      फ्री पास ({freePassesCount})
                    </button>
                    <button
                      onClick={() => setPassFilter("paid")}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        passFilter === "paid" ? "bg-amber-500 text-neutral-950 font-bold" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      ₹199 पेड ({paidPassesCount})
                    </button>
                    <button
                      onClick={() => setPassFilter("pending")}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        passFilter === "pending" ? "bg-red-500 text-white font-bold" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      लंबित ({pendingPassesCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* TABLE */}
              <div className="overflow-x-auto border border-neutral-800 rounded-2xl">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-neutral-950 text-neutral-400 text-[10px] uppercase font-bold tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-3">प्रतिभागी (Student)</th>
                      <th className="py-3 px-3">पास प्रकार (Pass Type)</th>
                      <th className="py-3 px-3">भुगतान विवरण (Payment Details)</th>
                      <th className="py-3 px-3">रसीद / स्क्रीनशॉट</th>
                      <th className="py-3 px-3">स्थिति (Status)</th>
                      <th className="py-3 px-3 text-right">कार्रवाई (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {filteredPasses.map((p, idx) => {
                      const isFree = p.payment_method === "free_pass" || p.pass_type === "round1_winner_free";
                      const cleanPhone = (p.whatsapp_number || "").replace(/\D/g, "").slice(-10);

                      return (
                        <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                          <td className="py-3 px-3 font-mono text-neutral-500 text-[11px]">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-white text-xs">{p.participant_name}</div>
                            <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{cleanPhone}</span>
                            </div>
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">Inv: {p.invoice_number}</div>
                          </td>
                          <td className="py-3 px-3">
                            {isFree ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                                <Award className="w-3 h-3" />
                                <span>Top 10 Free Pass (₹0)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                                <QrCode className="w-3 h-3" />
                                <span>₹199/- Discounted Pass</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-mono text-xs text-white">
                              {isFree ? "मुफ्त पास (₹500/- छूट)" : `₹${p.amount_paid}/-`}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                              UTR: {p.utr_number || "N/A"}
                            </div>
                            {p.upi_id && p.upi_id !== "N/A" && (
                              <div className="text-[10px] text-neutral-500 font-mono">UPI: {p.upi_id}</div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {p.screenshot_url ? (
                              <button
                                onClick={() => setPreviewScreenshotUrl(p.screenshot_url || null)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sky-400 text-[11px] font-semibold cursor-pointer border border-neutral-700"
                              >
                                <Eye className="w-3 h-3" />
                                <span>देखें (View Receipt)</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-neutral-500 italic">
                                {isFree ? "लागू नहीं (Free Pass)" : "कोई अपलोड नहीं"}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {p.verification_status === "verified" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>सत्यापित (Verified)</span>
                              </span>
                            ) : p.verification_status === "rejected" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold">
                                <XCircle className="w-3 h-3" />
                                <span>अस्वीकृत (Rejected)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                <Clock className="w-3 h-3" />
                                <span>लंबित (Pending)</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {p.verification_status !== "verified" && (
                                <button
                                  onClick={() => handleVerifyPass(p.id, "verified")}
                                  disabled={isVerifyingPassId === p.id}
                                  className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-[11px] cursor-pointer"
                                  title="पास सत्यापित करें"
                                >
                                  {isVerifyingPassId === p.id ? "..." : "✓ पास मान्य करें"}
                                </button>
                              )}
                              {p.verification_status !== "rejected" && !isFree && (
                                <button
                                  onClick={() => handleVerifyPass(p.id, "rejected")}
                                  disabled={isVerifyingPassId === p.id}
                                  className="p-1 rounded bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-[11px] cursor-pointer"
                                  title="अस्वीकृत करें"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <a
                                href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                                  `नमस्ते ${p.participant_name} जी!\nBMB Educom AI Seminar में आपका पास स्वीकृत हो गया है।\nइनवॉइस: ${p.invoice_number}\nपास प्रकार: ${isFree ? "Top 10 Free Winner Pass" : "₹199/- Paid Pass"}\nआप सेमिनार व Stage 2 Mega Quiz के लिए पूरी तरह पात्र हैं!`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-400 border border-emerald-500/30"
                                title="व्हाट्सएप पर पास भेजें"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredPasses.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-neutral-500 text-xs">
                          कोई सेमिनार पास रिकॉर्ड नहीं मिला।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SCREENSHOT PREVIEW MODAL */}
            {previewScreenshotUrl && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-amber-400" />
                      <span>छात्र द्वारा अपलोड की गई भुगतान रसीद (UPI Screenshot)</span>
                    </h4>
                    <button
                      onClick={() => setPreviewScreenshotUrl(null)}
                      className="text-neutral-400 hover:text-white text-lg font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-96 overflow-auto rounded-xl border border-neutral-800 bg-neutral-950 p-2 flex items-center justify-center">
                    <img
                      src={previewScreenshotUrl}
                      alt="Payment Screenshot"
                      className="max-h-80 w-auto rounded-lg object-contain"
                    />
                  </div>
                  <button
                    onClick={() => setPreviewScreenshotUrl(null)}
                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer"
                  >
                    बंद करें (Close)
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* VIEW: SEMINAR SETTINGS & ADMIN CONTROLS */}
      {activeSubTab === "settings" && (
        <div className="max-w-4xl mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                सेमिनार दिनांक, समय व स्थान कंट्रोल (Live Admin Configuration)
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                यहाँ से आप सेमिनार की दिनांक, समय, स्थान और रिपोर्टिंग टाइम बदल सकते हैं। यह जानकारी ऐप, रजिस्ट्रेशन पास और व्हाट्सएप पर रियल-टाइम अपडेट होगी।
              </p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Admin Exclusive
            </span>
          </div>

          {/* STAGE 2 MEGA QUIZ LIVE CONTROL CARD (IN SEMINAR SETTINGS) */}
          <div className={`p-5 rounded-2xl border transition-all ${
            seminarSettings.is_stage2_active
              ? "bg-gradient-to-br from-emerald-950/60 to-neutral-950 border-emerald-500/50 shadow-lg shadow-emerald-950/40"
              : "bg-gradient-to-br from-purple-950/40 via-neutral-950 to-neutral-950 border-purple-500/40"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    seminarSettings.is_stage2_active
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${seminarSettings.is_stage2_active ? "bg-emerald-400 animate-ping" : "bg-purple-400"}`} />
                    {seminarSettings.is_stage2_active ? "🟢 स्टेज 2 क्विज लाइव चालू है (STAGE 2 LIVE NOW)" : "🔒 स्टेज 2 क्विज अभी लॉक है (ADMIN CONTROLLED)"}
                  </span>
                  {seminarSettings.stage2_activated_at && seminarSettings.is_stage2_active && (
                    <span className="text-[10px] text-neutral-400">
                      चालू समय: {new Date(seminarSettings.stage2_activated_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Stage 2 Mega Quiz लाइव नियंत्रण (Admin Stage Control)</span>
                </h4>
                <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">
                  उपयोगकर्ता निर्देश: स्टेज 2 क्विज का नियंत्रण आपके पास है। सेमिनार के दौरान जब आप 'लाइव चालू करें' बटन दबाएंगे, तभी सेमिनार पास धारक छात्र (Top 10 Free Pass + ₹199/- वाले पास धारक) इसे शुरू कर सकेंगे।
                </p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                <button
                  id="btn-toggle-stage2-settings"
                  type="button"
                  onClick={() => handleToggleStage2()}
                  disabled={isTogglingStage2}
                  className={`px-5 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-lg transition-all ${
                    seminarSettings.is_stage2_active
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 shadow-emerald-500/20 font-black"
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>
                    {isTogglingStage2
                      ? "अपडेट हो रहा है..."
                      : seminarSettings.is_stage2_active
                      ? "रोकें / लॉक करें (Stop Stage 2)"
                      : "🚀 सेमिनार में स्टेज 2 चालू करें (Launch Stage 2 Live)"}
                  </span>
                </button>
              </div>
            </div>

            {stage2ToggleStatus && (
              <div className="mt-3 p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-700 text-xs text-amber-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{stage2ToggleStatus}</span>
              </div>
            )}
          </div>

          {settingsStatusMessage && (
            <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              settingsStatusMessage.startsWith("✓")
                ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-300"
                : "bg-red-500/10 border border-red-500/40 text-red-300"
            }`}>
              {settingsStatusMessage.startsWith("✓") ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span>{settingsStatusMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Seminar Date Hindi */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  सेमिनार दिनांक (हिंदी में) *
                </label>
                <input
                  type="text"
                  required
                  value={seminarSettings.seminar_date_hi}
                  onChange={e => setSeminarSettings({ ...seminarSettings, seminar_date_hi: e.target.value })}
                  placeholder="e.g. आगामी सेमिनार / रविवार, 12 सितंबर 2026"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  व्हाट्सएप और रजिस्ट्रेशन स्क्रीन पर यही दिनांक दिखेगी।
                </span>
              </div>

              {/* Seminar Date English */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Seminar Date (in English) *
                </label>
                <input
                  type="text"
                  required
                  value={seminarSettings.seminar_date_en}
                  onChange={e => setSeminarSettings({ ...seminarSettings, seminar_date_en: e.target.value })}
                  placeholder="e.g. Upcoming Seminar / Sunday, September 12, 2026"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {/* Seminar Time */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  सेमिनार का समय (Seminar Time) *
                </label>
                <input
                  type="text"
                  required
                  value={seminarSettings.seminar_time}
                  onChange={e => setSeminarSettings({ ...seminarSettings, seminar_time: e.target.value })}
                  placeholder="e.g. 11:00 AM – 4:00 PM IST"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {/* Reporting Time */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  रिपोर्टिंग समय (Reporting / Check-in Time) *
                </label>
                <input
                  type="text"
                  required
                  value={seminarSettings.reporting_time}
                  onChange={e => setSeminarSettings({ ...seminarSettings, reporting_time: e.target.value })}
                  placeholder="e.g. 10:45 AM"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            {/* Venue Location */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                स्थान / Venue Location *
              </label>
              <input
                type="text"
                required
                value={seminarSettings.venue_location}
                onChange={e => setSeminarSettings({ ...seminarSettings, venue_location: e.target.value })}
                placeholder="e.g. BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                स्थान विवरण व्हाट्सएप संदेश और आधिकारिक पास में सम्मिलित किया जाएगा।
              </span>
            </div>

            {/* Live Stream URL / Video Stream Embed */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span>लाइव स्ट्रीम / वीडियो एम्बेड URL (Live Stream URL)</span>
              </label>
              <input
                type="url"
                value={seminarSettings.live_stream_url || ""}
                onChange={e => setSeminarSettings({ ...seminarSettings, live_stream_url: e.target.value })}
                placeholder="e.g. https://www.youtube.com/embed/YOUR_STREAM_ID or https://drive.google.com/..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                यह URL 'About BMB Educom' टैब में सभी लाइव छात्रों के लिए सीधे स्ट्रीम होगा।
              </span>
            </div>

            {/* Cash Prize Control (Admin Can Increase or Decrease Prize Amounts) */}
            <div className="bg-neutral-950 p-5 rounded-2xl border border-amber-500/30 space-y-4">
              <div className="border-b border-neutral-800 pb-3">
                <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>20-प्रश्न AI स्कॉलरशिप नकद पुरस्कार कंट्रोल (Dynamic Cash Prizes)</span>
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  यहाँ से एडमिन नकद पुरस्कार राशि बढ़ा या घटा सकते हैं। यह टिकर, क्विज़ व लीडरबोर्ड पर तुरंत रियल-टाइम अपडेट होगी।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1st Prize */}
                <div className="bg-neutral-900/90 p-3.5 rounded-xl border border-neutral-800">
                  <label className="block text-xs font-bold text-amber-400 mb-1">
                    🥇 1st Rank Champion (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={seminarSettings.cash_prize_1st}
                    onChange={e => setSeminarSettings({ ...seminarSettings, cash_prize_1st: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-1.5 px-2.5 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setSeminarSettings(prev => ({ ...prev, cash_prize_1st: Math.max(0, Number(prev.cash_prize_1st) - 500) }))}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-300 font-semibold cursor-pointer"
                    >
                      -₹500
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeminarSettings(prev => ({ ...prev, cash_prize_1st: Number(prev.cash_prize_1st) + 500 }))}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-amber-300 font-semibold cursor-pointer"
                    >
                      +₹500
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeminarSettings(prev => ({ ...prev, cash_prize_1st: Number(prev.cash_prize_1st) + 1000 }))}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-amber-300 font-semibold cursor-pointer"
                    >
                      +₹1000
                    </button>
                  </div>
                </div>

                {/* 2nd Prize */}
                <div className="bg-neutral-900/90 p-3.5 rounded-xl border border-neutral-800">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    🥈 2nd Rank Winner (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={seminarSettings.cash_prize_2nd}
                    onChange={e => setSeminarSettings({ ...seminarSettings, cash_prize_2nd: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-1.5 px-2.5 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setSeminarSettings(prev => ({ ...prev, cash_prize_2nd: Math.max(0, Number(prev.cash_prize_2nd) - 250) }))}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-300 font-semibold cursor-pointer"
                    >
                      -₹250
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeminarSettings(prev => ({ ...prev, cash_prize_2nd: Number(prev.cash_prize_2nd) + 250 }))}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-slate-300 font-semibold cursor-pointer"
                    >
                      +₹250
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeminarSettings(prev => ({ ...prev, cash_prize_2nd: Number(prev.cash_prize_2nd) + 500 }))}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-slate-300 font-semibold cursor-pointer"
                    >
                      +₹500
                    </button>
                  </div>
                </div>

                {/* 3rd Prize */}
                <div className="bg-neutral-900/90 p-3.5 rounded-xl border border-neutral-800">
                  <label className="block text-xs font-bold text-amber-600 mb-1">
                    🥉 3rd Rank Winner (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={seminarSettings.cash_prize_3rd}
                    onChange={e => setSeminarSettings({ ...seminarSettings, cash_prize_3rd: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-1.5 px-2.5 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setSeminarSettings(prev => ({ ...prev, cash_prize_3rd: Math.max(0, Number(prev.cash_prize_3rd) - 100) }))}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-300 font-semibold cursor-pointer"
                    >
                      -₹100
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeminarSettings(prev => ({ ...prev, cash_prize_3rd: Number(prev.cash_prize_3rd) + 100 }))}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-amber-400 font-semibold cursor-pointer"
                    >
                      +₹100
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeminarSettings(prev => ({ ...prev, cash_prize_3rd: Number(prev.cash_prize_3rd) + 200 }))}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-amber-400 font-semibold cursor-pointer"
                    >
                      +₹200
                    </button>
                  </div>
                </div>
              </div>

              {/* Consolation Prize Text */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  🎁 रैंक 4 से 10 (शीर्ष 7 प्रतिभागी) उपहार विवरण:
                </label>
                <input
                  type="text"
                  value={seminarSettings.cash_prize_consolation}
                  onChange={e => setSeminarSettings({ ...seminarSettings, cash_prize_consolation: e.target.value })}
                  placeholder="e.g. आकर्षक उपहार (Attractive Gifts) व डिजिटल प्रमाण पत्र"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            {/* Registration Open Toggle */}
            <div className="flex items-center gap-3 bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
              <input
                id="checkbox-registration-open"
                type="checkbox"
                checked={seminarSettings.is_registration_open}
                onChange={e => setSeminarSettings({ ...seminarSettings, is_registration_open: e.target.checked })}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="checkbox-registration-open" className="text-xs font-semibold text-white cursor-pointer">
                सेमिनार रजिस्ट्रेशन सक्रिय रखें (Registration Open for New Students)
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                id="btn-save-seminar-settings"
                type="submit"
                disabled={isSavingSettings}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold px-6 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSettings ? "सेटिंग्स सेव हो रही हैं..." : "सेमिनार सेटिंग्स सुरक्षित करें (Save Settings)"}</span>
              </button>
            </div>
          </form>

          {/* FREE LIVE STREAMING GUIDE */}
          <div className="border-t border-neutral-800 pt-6 mt-6">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Tv className="w-4 h-4 text-amber-400" />
              <span>💡 सेमिनार को 100% मुफ्त में लाइव कैसे करें? (Free Live Streaming Guide)</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl space-y-2">
                <div className="font-bold text-red-400 flex items-center gap-1.5">
                  <Radio className="w-4 h-4" />
                  <span>1. YouTube Live (Best & Free)</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  YouTube Studio खोलें ➔ <strong>Create ➔ Go Live</strong> पर जाएं ➔ Visibility को <strong>Unlisted</strong> (केवल पास धारकों के लिए) रखें ➔ Embed URL कॉपी कर ऊपर पेस्ट करें।
                </p>
                <div className="text-[10px] text-amber-400 font-semibold">✓ असीमित दर्शक व जीरो लैग</div>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl space-y-2">
                <div className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Video className="w-4 h-4" />
                  <span>2. Google Meet</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  <strong>meet.google.com</strong> पर जाएं ➔ <strong>New Meeting</strong> बनाएं ➔ लिंक कॉपी करें और छात्रों के साथ साझा करें।
                </p>
                <div className="text-[10px] text-sky-300 font-semibold">✓ 100 प्रतिभागियों तक 100% फ्री</div>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4" />
                  <span>3. OBS Studio (फ्री सॉफ्टवेयर)</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  लैपटॉप स्क्रीन, PPT और कैमरा को एक साथ YouTube Live पर ब्रॉडकास्ट करने के लिए <strong>OBS Studio</strong> (Free Open Source) का उपयोग करें।
                </p>
                <div className="text-[10px] text-emerald-300 font-semibold">✓ प्रोफेशनल स्टूडियो क्वालिटी</div>
              </div>
            </div>
          </div>

          {/* OLD SEMINAR DATA MANAGEMENT & CLEANUP */}
          <div className="border-t border-neutral-800 pt-6 mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>पुराने सेमिनार डेटा प्रबंधन (Old Seminar Data Management & Cleanup)</span>
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  यहाँ से एडमिन पुराने या पिछले संपन्न सेमिनारों के छात्र पंजीकरण, लीड्स और क्विज़ टेस्ट रिकॉर्ड्स को सुरक्षित रूप से हटा सकते हैं।
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowCreateNewSeminarModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>नया सेमिनार सत्र जोड़ें</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBatchClearOldModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold flex items-center gap-1.5 border border-red-500/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>पिछले सभी पुराने सेमिनार हटाएं</span>
                </button>
              </div>
            </div>

            {seminarDeleteStatus && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                seminarDeleteStatus.startsWith("✓") || seminarDeleteStatus.includes("सफलतापूर्वक")
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border border-red-500/30 text-red-300"
              }`}>
                {seminarDeleteStatus.startsWith("✓") || seminarDeleteStatus.includes("सफलतापूर्वक") ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span>{seminarDeleteStatus}</span>
              </div>
            )}

            {/* List of Seminars */}
            <div className="space-y-2.5">
              {(!dashboardData.events || dashboardData.events.length === 0) ? (
                <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl text-center text-xs text-neutral-400">
                  कोई सेमिनार रिकॉर्ड उपलब्ध नहीं है।
                </div>
              ) : (
                dashboardData.events.map((ev: SeminarEventWithStats) => {
                  const isCurrent = ev.isCurrent || ev.status === "active";
                  return (
                    <div
                      key={ev.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? "bg-neutral-950 border-amber-500/40 shadow-lg shadow-amber-500/5"
                          : "bg-neutral-950/70 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">{ev.title}</span>
                            {isCurrent ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                ● वर्तमान सक्रिय सेमिनार
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                                पुराना सेमिनार / आर्काइव
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-amber-400/90 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                              📅 {ev.event_date}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-neutral-400 pt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 font-medium text-neutral-300">
                              <Users className="w-3.5 h-3.5 text-amber-400" />
                              <span>{ev.registrationsCount} छात्र पंजीकृत</span>
                            </span>
                            <span className="flex items-center gap-1 font-medium text-neutral-300">
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{ev.leadsCount} CRM लीड्स</span>
                            </span>
                            <span className="flex items-center gap-1 font-medium text-neutral-300">
                              <Trophy className="w-3.5 h-3.5 text-sky-400" />
                              <span>{ev.scholarshipSubmissionsCount} टेस्ट सबमिशन</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isCurrent ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSeminarToDelete(ev);
                                setIsClearOnlyConfirm(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                              title="वर्तमान सेमिनार के छात्र रिकॉर्ड्स को 0 पर रीसेट करें"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>डेटा खाली करें (Clear to 0)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSeminarToDelete(ev);
                                setIsClearOnlyConfirm(false);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                              title="यह सेमिनार व इसका सारा डेटा हमेशा के लिए हटाएं"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>डेटा हटाएं (Delete)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ADMIN ACCOUNT PROFILE & CUSTOM CREDENTIALS */}
      {activeSubTab === "account" && (
        <div className="max-w-2xl mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <span>सुपर एडमिन सुरक्षा व कस्टम पासवर्ड (Super Admin Security)</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                यहाँ से आप अपना नाम, लॉगिन ईमेल और अपना मनपसंद नया सुरक्षित पासवर्ड सेट कर सकते हैं।
              </p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              SUPER ADMIN
            </span>
          </div>

          {profileStatusMessage && (
            <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              profileStatusMessage.startsWith("✓")
                ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-300"
                : "bg-red-500/10 border border-red-500/40 text-red-300"
            }`}>
              {profileStatusMessage.startsWith("✓") ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span>{profileStatusMessage}</span>
            </div>
          )}

          <form onSubmit={handleUpdateAdminProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  सुपर एडमिन का नाम (Admin Full Name) *
                </label>
                <input
                  id="input-admin-profile-name"
                  type="text"
                  required
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="उदा. BMB Super Admin / BMB Educom"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  WhatsApp नंबर (पासवर्ड रिकवरी व OTP के लिए) *
                </label>
                <div className="relative">
                  <input
                    id="input-admin-profile-whatsapp"
                    type="tel"
                    required
                    maxLength={10}
                    value={profileWhatsApp}
                    onChange={e => setProfileWhatsApp(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-अंकीय WhatsApp नंबर"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <Smartphone className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                एडमिन लॉगिन ईमेल (Admin Login Email) *
              </label>
              <input
                id="input-admin-profile-email"
                type="email"
                required
                value={profileEmail}
                onChange={e => setProfileEmail(e.target.value)}
                placeholder="उदा. admin@bmbeducom.com"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="border-t border-neutral-800 pt-4 mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>नया कस्टम पासवर्ड सेट करें (Set Custom Password)</span>
                </h4>
                <span className="text-[10px] text-neutral-400">वैकल्पिक (Optional)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  वर्तमान पासवर्ड (Current Password - यदि पासवर्ड बदल रहे हैं)
                </label>
                <div className="relative">
                  <input
                    id="input-admin-current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="वर्तमान पासवर्ड दर्ज करें (डिफ़ॉल्ट: admin123)"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-3 pr-10 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  नया पासवर्ड (New Custom Password - न्यूनतम 6 अक्षर)
                </label>
                <div className="relative">
                  <input
                    id="input-admin-new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="अपना नया सुरक्षित पासवर्ड बनाएं"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-3 pr-10 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {newPassword && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    नया पासवर्ड कन्फर्म करें (Confirm New Password) *
                  </label>
                  <div className="relative">
                    <input
                      id="input-admin-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="नया पासवर्ड दोबारा दर्ज करें"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-3 pr-10 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3">
              <button
                id="btn-save-admin-account"
                type="submit"
                disabled={isSavingProfile}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold px-6 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? "सुरक्षित किया जा रहा है..." : "सुपर एडमिन क्रेडेंशियल्स अपडेट करें (Save Credentials)"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: 100+ PRODUCTION QA TEST SUITE RUNNER */}
      {activeSubTab === "qa_tests" && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  100+ Automated Production QA Test Suite
                </h3>
                <p className="text-xs text-neutral-400">
                  Runs real-time cryptographic, algorithmic, database, concurrency, and adversarial validation tests.
                </p>
              </div>

              <button
                id="btn-run-all-qa-tests"
                onClick={handleRunQATests}
                disabled={isRunningQA}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>{isRunningQA ? "Running 100+ Tests..." : "Run All QA Tests"}</span>
              </button>
            </div>

            {/* QA Summary Bar */}
            {qaReport && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold">Total Tests</span>
                  <div className="text-xl font-bold text-white font-mono">{qaReport.total}</div>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase font-bold">Passed</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono">{qaReport.passed}</div>
                </div>
                <div>
                  <span className="text-[10px] text-red-400 uppercase font-bold">Failed</span>
                  <div className="text-xl font-bold text-red-400 font-mono">{qaReport.failed}</div>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 uppercase font-bold">Duration</span>
                  <div className="text-xl font-bold text-amber-400 font-mono">{qaReport.durationMs}ms</div>
                </div>
              </div>
            )}
          </div>

          {/* Test Results Table */}
          {qaReport && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-white">Verified Test Cases</span>
                <select
                  value={qaFilterCategory}
                  onChange={e => setQaFilterCategory(e.target.value)}
                  className="bg-neutral-950 border border-neutral-700 rounded-lg py-1 px-2.5 text-xs text-white"
                >
                  <option value="all">All Categories ({qaReport.results.length})</option>
                  {Object.keys(qaReport.categoryBreakdown).map(cat => (
                    <option key={cat} value={cat}>
                      {cat} ({qaReport.categoryBreakdown[cat].total})
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4 w-24">ID</th>
                      <th className="py-2.5 px-4 w-32">Category</th>
                      <th className="py-2.5 px-4">Test Description</th>
                      <th className="py-2.5 px-4">Evidence</th>
                      <th className="py-2.5 px-4 text-center w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {qaReport.results
                      .filter(t => qaFilterCategory === "all" || t.category === qaFilterCategory)
                      .map(test => (
                        <tr key={test.id} className="hover:bg-neutral-850/40 font-mono text-[11px]">
                          <td className="py-2.5 px-4 font-bold text-amber-400">{test.id}</td>
                          <td className="py-2.5 px-4 text-neutral-300 font-sans">{test.category}</td>
                          <td className="py-2.5 px-4 text-white font-sans">{test.test}</td>
                          <td className="py-2.5 px-4 text-neutral-400 font-sans text-[11px] max-w-xs truncate" title={test.evidence}>
                            {test.evidence}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              test.status === "PASS"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-red-500/20 text-red-300"
                            }`}>
                              {test.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: DATA EXPORT & CLOUD BACKUP */}
      {activeSubTab === "backup" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex justify-end mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  MARKETING READY
                </span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                Complete Excel (Marketing Leads)
              </h4>
              <p className="text-xs text-neutral-300 mb-4">
                Microsoft Excel में सीधे खुलने योग्य (UTF-8 BOM)। सभी छात्र विवरण, WhatsApp नंबर, शहर, एजुकेशन व डिस्काउंट कूपन शामिल हैं।
              </p>
            </div>
            <button
              id="btn-export-marketing-excel"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingExcel ? "Excel तैयार हो रही है..." : "Download Excel"}</span>
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2 pt-2">
                <Database className="w-5 h-5 text-amber-400" />
                Full System Backup Snapshot
              </h4>
              <p className="text-xs text-neutral-300 mb-4">
                Export complete transactional state including events, question banks, quiz attempts, and audit logs into a portable JSON archive.
              </p>
            </div>
            <button
              id="btn-export-json-backup"
              onClick={handleExportBackup}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Purge Old Seminar Records Card */}
          <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-base font-bold text-amber-300 mb-2 flex items-center gap-2 pt-2">
                <Trash2 className="w-5 h-5 text-amber-400" />
                पुराने सेमिनार का डेटा हटाएं
              </h4>
              <p className="text-xs text-neutral-300 mb-4">
                वर्तमान सक्रिय सेमिनार को सुरक्षित रखते हुए, पिछले सभी पुराने सेमिनारों के पंजीकरण, टेस्ट परिणाम व लीड्स को साफ़ करें।
              </p>
            </div>
            <button
              id="btn-purge-old-seminars"
              type="button"
              onClick={() => setShowBatchClearOldModal(true)}
              className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-amber-400" />
              <span>पुराने सेमिनार डेटा साफ़ करें</span>
            </button>
          </div>

          <div className="bg-neutral-900 border border-red-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-base font-bold text-red-400 mb-2 flex items-center gap-2 pt-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Fresh Database Reset (सभी टेस्ट डेटा 0 करें)
              </h4>
              <p className="text-xs text-neutral-300 mb-4">
                Clears all dummy/test registration records, CRM leads, and test scores. Leaves system 100% fresh and ready for live participants.
              </p>
              {freshResetStatus && (
                <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
                  <span>{freshResetStatus}</span>
                  <button onClick={() => setFreshResetStatus(null)} className="text-emerald-400 hover:text-white ml-2 text-sm font-bold">✕</button>
                </div>
              )}
            </div>
            <button
              id="btn-fresh-database-reset"
              onClick={() => setShowFreshResetModal(true)}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-red-400" />
              <span>सभी टेस्ट डेटा 0 करें (Reset CRM to 0)</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Single Seminar Delete / Clear Records Confirmation */}
      {seminarToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isClearOnlyConfirm ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
              }`}>
                {isClearOnlyConfirm ? <RotateCcw className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isClearOnlyConfirm ? "सेमिनार डेटा खाली करें (Clear Records)" : "पुराना सेमिनार व डेटा हटाएं (Delete Seminar)"}
                </h3>
                <p className="text-xs text-neutral-400">
                  {isClearOnlyConfirm
                    ? "वर्तमान सेमिनार की सेटिंग्स सुरक्षित रहेंगी, केवल छात्रों के रिकॉर्ड्स रीसेट होंगे।"
                    : "यह सेमिनार और इसके सारे छात्र व टेस्ट रिकॉर्ड्स स्थायी रूप से हटा दिए जाएंगे।"}
                </p>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">सेमिनार शीर्षक:</span>
                <span className="text-white font-semibold">{seminarToDelete.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">आयोजन दिनांक:</span>
                <span className="text-amber-400 font-mono font-bold">{seminarToDelete.event_date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">हटाए जाने वाले छात्र पंजीकरण:</span>
                <span className="text-red-400 font-bold">{seminarToDelete.registrationsCount} छात्र</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-900">
                <span className="text-neutral-400">हटाए जाने वाले CRM लीड्स:</span>
                <span className="text-red-400 font-bold">{seminarToDelete.leadsCount} लीड्स</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">हटाए जाने वाले टेस्ट सबमिशन:</span>
                <span className="text-red-400 font-bold">{seminarToDelete.scholarshipSubmissionsCount} टेस्ट</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingSeminar}
                onClick={() => setSeminarToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 font-semibold cursor-pointer disabled:opacity-50"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                disabled={isDeletingSeminar}
                onClick={() => handleDeleteSeminar(seminarToDelete.id, isClearOnlyConfirm)}
                className={`font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 ${
                  isClearOnlyConfirm
                    ? "bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/20"
                    : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/20"
                }`}
              >
                {isDeletingSeminar ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>हटाया जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{isClearOnlyConfirm ? "हाँ, डेटा खाली करें" : "हाँ, हमेशा के लिए हटाएं"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Batch Clear All Old Seminars Confirmation */}
      {showBatchClearOldModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-red-500/20 text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  पिछले सभी पुराने सेमिनारों का डेटा हटाएं?
                </h3>
                <p className="text-xs text-neutral-400">
                  Bulk Cleanup of All Completed & Past Seminar Records
                </p>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-xs text-neutral-300 space-y-2">
              <p className="text-amber-400 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>सावधानी (Warning):</span>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-300 text-[11px] leading-relaxed">
                <li>वर्तमान सक्रिय सेमिनार और उसकी सेटिंग्स पूर्णतः सुरक्षित रहेंगी।</li>
                <li>पिछले सभी पुराने सेमिनार, उनके छात्र पंजीकरण, लीड्स और क्विज़ स्कोर हटा दिए जाएंगे।</li>
                <li>यदि आपको पुराना डेटा चाहिए, तो कृपया पहले <strong>Download JSON Backup</strong> या <strong>Download Excel</strong> कर लें।</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingSeminar}
                onClick={() => setShowBatchClearOldModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 font-semibold cursor-pointer disabled:opacity-50"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                disabled={isDeletingSeminar}
                onClick={handleBatchClearOldSeminars}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isDeletingSeminar ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>साफ़ किया जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>हाँ, सभी पुराने सेमिनार हटाएं</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create New Seminar Session */}
      {showCreateNewSeminarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-500/20 text-amber-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  नया सेमिनार सत्र शुरू करें (New Seminar Session)
                </h3>
                <p className="text-xs text-neutral-400">
                  वर्तमान सेमिनार को आर्काइव कर एक नया फ्रेश सेमिनार सत्र तैयार करें।
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateNewSeminar} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  सेमिनार की तारीख (Event Date) *
                </label>
                <input
                  type="date"
                  required
                  value={newSeminarDate}
                  onChange={e => setNewSeminarDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  सेमिनार का शीर्षक (Seminar Title) *
                </label>
                <input
                  type="text"
                  required
                  value={newSeminarTitle}
                  onChange={e => setNewSeminarTitle(e.target.value)}
                  placeholder="e.g. BMB Educom AI Masterclass & Scholarship Seminar"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  विवरण (Description - Optional)
                </label>
                <textarea
                  rows={2}
                  value={newSeminarDesc}
                  onChange={e => setNewSeminarDesc(e.target.value)}
                  placeholder="सेमिनार का विवरण या विशेष निर्देश..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isCreatingSeminar}
                  onClick={() => setShowCreateNewSeminarModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 font-semibold cursor-pointer disabled:opacity-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSeminar}
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isCreatingSeminar ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>तैयार हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>सत्र शुरू करें</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Clear All Scholarship Submissions & Scores */}
      {showClearScholarshipModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/30 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-red-500/20 text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  AI स्कॉलरशिप टेस्ट डेटा 0 करें
                </h3>
                <p className="text-xs text-neutral-400">
                  Reset All Scholarship Test Submissions & Rankings
                </p>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-xs text-neutral-300 space-y-2">
              <p className="text-red-400 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>सावधानी (Warning):</span>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-300 text-[11px] leading-relaxed">
                <li>सभी छात्रों के AI स्कॉलरशिप टेस्ट सबमिशन, टाइमिंग, स्कोर और लीडरबोर्ड रैंकिंग मिटाकर शून्य (0) कर दी जाएगी।</li>
                <li>छात्रों के पंजीकरण विवरण (CRM Leads) सुरक्षित रहेंगे, परंतु वे दोबारा टेस्ट देने के पात्र हो जाएंगे।</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isClearingScholarship}
                onClick={() => setShowClearScholarshipModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 font-semibold cursor-pointer disabled:opacity-50"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                disabled={isClearingScholarship}
                onClick={handleClearAllScholarshipData}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isClearingScholarship ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>डेटा 0 किया जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>हाँ, टेस्ट डेटा 0 करें</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Clear All Seminar Quiz Data */}
      {showClearQuizModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/30 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-red-500/20 text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  सभी सेमिनार क्विज स्कोर 0 करें
                </h3>
                <p className="text-xs text-neutral-400">
                  Reset All Seminar Live Quiz Results to 0
                </p>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-xs text-neutral-300 space-y-2">
              <p className="text-amber-400 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>सावधानी (Warning):</span>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-300 text-[11px] leading-relaxed">
                <li>सभी छात्रों के लाइव सेमिनार क्विज स्कोर साफ़ हो जाएंगे।</li>
                <li>छात्र दोबारा लाइव सेमिनार क्विज में भाग ले सकेंगे।</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isClearingQuiz}
                onClick={() => setShowClearQuizModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 font-semibold cursor-pointer disabled:opacity-50"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                disabled={isClearingQuiz}
                onClick={handleClearAllQuizData}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isClearingQuiz ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>क्विज 0 किया जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>हाँ, क्विज स्कोर 0 करें</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Fresh Database Reset */}
      {showFreshResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/30 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-red-500/20 text-red-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Fresh Database Reset — सभी टेस्ट डेटा 0 करें
                </h3>
                <p className="text-xs text-neutral-400">
                  Clean All Test / Dummy Registrations & Scores
                </p>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-xs text-neutral-300 space-y-2">
              <p className="text-red-400 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>अंतिम पुष्टि (Final Confirmation):</span>
              </p>
              <p className="text-[11px] leading-relaxed text-neutral-300">
                क्या आप वाकई सभी छात्र पंजीकरण, CRM लीड्स, क्विज़ परिणाम और स्कॉलरशिप टेस्ट स्कोर को साफ़ कर शून्य (0) करना चाहते हैं? इसके बाद सिस्टम केवल नए वास्तविक छात्रों के लिए 100% फ्रेश रहेगा।
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isExecutingFreshReset}
                onClick={() => setShowFreshResetModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 font-semibold cursor-pointer disabled:opacity-50"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                disabled={isExecutingFreshReset}
                onClick={handleExecuteFreshReset}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isExecutingFreshReset ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>डेटा साफ़ हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>हाँ, पूरा टेस्ट डेटा 0 करें</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reset Individual Student Scholarship */}
      {studentToResetScholarship && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/20 text-amber-400">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">छात्र टेस्ट रीसेट करें</h3>
                <p className="text-xs text-neutral-400">{studentToResetScholarship.name}</p>
              </div>
            </div>
            <p className="text-xs text-neutral-300">
              क्या आप <strong>{studentToResetScholarship.name}</strong> का AI स्कॉलरशिप टेस्ट स्कोर रीसेट करना चाहते हैं ताकि वे दोबारा टेस्ट दे सकें?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={isResettingStudentScholarship}
                onClick={() => setStudentToResetScholarship(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white bg-neutral-800"
              >
                रद्द करें
              </button>
              <button
                disabled={isResettingStudentScholarship}
                onClick={handleConfirmResetStudentScholarship}
                className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5"
              >
                {isResettingStudentScholarship ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>हाँ, रीसेट करें</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reset Individual Student Quiz */}
      {studentToResetQuiz && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/20 text-amber-400">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">क्विज स्कोर रीसेट करें</h3>
                <p className="text-xs text-neutral-400">{studentToResetQuiz.name}</p>
              </div>
            </div>
            <p className="text-xs text-neutral-300">
              क्या आप <strong>{studentToResetQuiz.name}</strong> का सेमिनार क्विज रीसेट करना चाहते हैं ताकि वे दोबारा क्विज दे सकें?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={isResettingStudentQuiz}
                onClick={() => setStudentToResetQuiz(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white bg-neutral-800"
              >
                रद्द करें
              </button>
              <button
                disabled={isResettingStudentQuiz}
                onClick={handleConfirmResetStudentQuiz}
                className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5"
              >
                {isResettingStudentQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>हाँ, रीसेट करें</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {selectedLeadForEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Counselor Lead Note & Follow-up
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Lead: {selectedLeadForEdit.participant?.name} ({selectedLeadForEdit.participant?.whatsapp_number})
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={selectedLeadForEdit.follow_up_date || ""}
                  onChange={e => setSelectedLeadForEdit({ ...selectedLeadForEdit, follow_up_date: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Counselor Notes</label>
                <textarea
                  rows={3}
                  value={selectedLeadForEdit.notes || ""}
                  onChange={e => setSelectedLeadForEdit({ ...selectedLeadForEdit, notes: e.target.value })}
                  placeholder="Student interest, discussion points, callback times..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedLeadForEdit(null)}
                className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateLead(selectedLeadForEdit.id, {
                  notes: selectedLeadForEdit.notes,
                  follow_up_date: selectedLeadForEdit.follow_up_date
                })}
                className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
