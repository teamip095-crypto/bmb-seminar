import React, { useState, useEffect } from "react";
import {
  AdmissionLeadItem,
  WhatsAppLogItem,
  QATestSuiteResponse,
  TestResultItem,
  FridaySeminarStatusResponse
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
  ArrowLeft
} from "lucide-react";

interface AdminCRMViewProps {
  seminarStatus: FridaySeminarStatusResponse | null;
}

export const AdminCRMView: React.FC<AdminCRMViewProps> = ({ seminarStatus }) => {
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

  // Active Sub-Tab: "crm" | "settings" | "account" | "whatsapp" | "qa_tests" | "backup"
  const [activeSubTab, setActiveSubTab] = useState<"crm" | "settings" | "account" | "whatsapp" | "qa_tests" | "backup">("crm");

  // Seminar Settings State
  const [seminarSettings, setSeminarSettings] = useState({
    seminar_date_hi: "आगामी शुक्रवार",
    seminar_date_en: "Upcoming Friday",
    seminar_time: "11:00 AM – 4:00 PM IST",
    venue_location: "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)",
    reporting_time: "10:45 AM",
    live_stream_url: "https://drive.google.com/file/d/1lxitztPNHlEyRCzR720OVvbn_QoHXn12/preview?autoplay=1&loop=1",
    is_registration_open: true
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsStatusMessage, setSettingsStatusMessage] = useState<string | null>(null);

  // Admin Account Profile & Password State
  const [profileName, setProfileName] = useState(adminUser?.name || "BMB Super Admin");
  const [profileEmail, setProfileEmail] = useState(adminUser?.email || "ipgroup2002@gmail.com");
  const [profileWhatsApp, setProfileWhatsApp] = useState(adminUser?.whatsapp_number || "9301056006");
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
    events?: any[];
    whatsAppMessages?: WhatsAppLogItem[];
    auditLogs?: any[];
    driveStatus?: any;
  }>({});
  const [loadingDashboard, setLoadingDashboard] = useState(false);

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
      setProfileWhatsApp(data.admin?.whatsapp_number || "9301056006");
      localStorage.setItem("bmb_admin_token", data.token);
      localStorage.setItem("bmb_admin_user", JSON.stringify(data.admin));
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials");
    } finally {
      setIsLoggingIn(false);
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
      setForgotSimulatedOtp(data.simulatedOtp || null);
      setForgotStep("verify");
      setForgotStatusMessage(`✓ 6-अंकों का OTP कोड आपके पंजीकृत WhatsApp नंबर (${data.whatsapp_masked || ""}) पर भेज दिया गया है!`);
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
        setProfileWhatsApp(data.admin.whatsapp_number || "9301056006");
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
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSeminarSettings({
            seminar_date_hi: data.settings.seminar_date_hi || "आगामी शुक्रवार",
            seminar_date_en: data.settings.seminar_date_en || "Upcoming Friday",
            seminar_time: data.settings.seminar_time || "11:00 AM – 4:00 PM IST",
            venue_location: data.settings.venue_location || "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)",
            reporting_time: data.settings.reporting_time || "10:45 AM",
            is_registration_open: data.settings.is_registration_open !== false
          });
        }
      }
    } catch (err) {
      console.error("Error fetching seminar settings:", err);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchDashboard();
      fetchSeminarSettings();
    }
  }, [authToken]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setIsSavingSettings(true);
    setSettingsStatusMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(seminarSettings)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update seminar settings");
      }

      setSettingsStatusMessage("✓ सेमिनार सेटिंग्स सफलतापूर्वक अपडेट हो गई हैं!");
      setTimeout(() => setSettingsStatusMessage(null), 4000);
      fetchSeminarSettings();
    } catch (err: any) {
      setSettingsStatusMessage("❌ त्रुटि: " + (err.message || "सेटिंग्स अपडेट नहीं हो सकी"));
    } finally {
      setIsSavingSettings(false);
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

  // Unauthenticated Login Modal & WhatsApp Password Recovery
  if (!authToken) {
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
            Authorized Personnel & Super Admin Sign In
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
                  placeholder="उदा. 9301056006"
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
                        placeholder="उदा. 9301056006"
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
                  {/* WhatsApp Direct Open Helper */}
                  {forgotDirectWhatsAppLink && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-2">
                      <div className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp पर OTP मैसेज आ गया है:</span>
                      </div>
                      <a
                        href={forgotDirectWhatsAppLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>WhatsApp ओपन करें (Open WhatsApp)</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}

                  {/* Simulated OTP Display for Sandbox / Dev testing */}
                  {forgotSimulatedOtp && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-center justify-between">
                      <span>परीक्षण OTP कोड: <strong>{forgotSimulatedOtp}</strong></span>
                      <button
                        type="button"
                        onClick={() => setForgotOTP(forgotSimulatedOtp)}
                        className="text-[10px] bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 px-2 py-0.5 rounded cursor-pointer"
                      >
                        Auto-fill OTP
                      </button>
                    </div>
                  )}

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
            <span className="text-[9px] sm:text-[10px] text-amber-400 uppercase font-bold tracking-wider">Friday Event</span>
            <div className="text-lg sm:text-xl font-bold text-amber-400 mt-0.5 sm:mt-1 font-mono">{m.activeEventRegistrations}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5">
            <span className="text-[9px] sm:text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Quizzes Taken</span>
            <div className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5 sm:mt-1 font-mono">{m.quizCompleted}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5">
            <span className="text-[9px] sm:text-[10px] text-sky-400 uppercase font-bold tracking-wider">Avg Score</span>
            <div className="text-lg sm:text-xl font-bold text-sky-400 mt-0.5 sm:mt-1 font-mono">{m.averageScore} / 4</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5">
            <span className="text-[9px] sm:text-[10px] text-amber-300 uppercase font-bold tracking-wider">4/4 Scorers</span>
            <div className="text-lg sm:text-xl font-bold text-amber-300 mt-0.5 sm:mt-1 font-mono">{m.topPerformersCount}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5">
            <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold tracking-wider">WhatsApp Sent</span>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5 sm:mt-1 font-mono">{m.whatsAppStats?.sent || 0}</div>
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
          onClick={() => setActiveSubTab("whatsapp")}
          className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
            activeSubTab === "whatsapp"
              ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
              : "bg-neutral-900 text-neutral-300 hover:text-white"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp Logs</span>
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
              id="btn-crm-export-excel"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isExportingExcel ? "Downloading..." : "Export Marketing Excel"}</span>
            </button>
          </div>

          {/* CRM Leads Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Lead / Participant</th>
                    <th className="py-3 px-4">Phone & Address</th>
                    <th className="py-3 px-4">Details / Source</th>
                    <th className="py-3 px-4 text-center">Quiz Score</th>
                    <th className="py-3 px-4">Pipeline Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-4 text-center">
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

                    return (
                      <tr key={lead.id} className="hover:bg-neutral-850/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{p?.name || "Participant"}</div>
                          <div className="text-[11px] font-mono text-neutral-400">{p?.registration_id}</div>
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="text-white font-mono">{p?.whatsapp_number}</div>
                          <div className="text-[11px] text-neutral-400 truncate" title={p?.full_address || p?.city || ""}>
                            {p?.full_address || p?.city || "Registered"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-neutral-200">{p?.education || "Friday Seminar"}</div>
                          <div className="text-[11px] text-amber-400">{p?.occupation || "AI Learner"}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {lead.quiz_score !== undefined ? (
                            <span className="text-amber-400">{lead.quiz_score}/4</span>
                          ) : (
                            <span className="text-neutral-500">—</span>
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
                  placeholder="e.g. आगामी शुक्रवार / 12 सितंबर 2026"
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
                  placeholder="e.g. Upcoming Friday / September 12, 2026"
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
                यह URL 'About AI' टैब में सभी लाइव छात्रों के लिए सीधे स्ट्रीम होगा।
              </span>
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
                    placeholder="उदा. 9301056006"
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

      {/* VIEW: WHATSAPP DISPATCH MONITOR */}
      {activeSubTab === "whatsapp" && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            WhatsApp Cloud API Outbound Monitor
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {(dashboardData.whatsAppMessages || []).map(msg => (
                  <tr key={msg.id} className="hover:bg-neutral-850/40">
                    <td className="py-3 px-4 text-white font-medium">{msg.participantName || "Participant"}</td>
                    <td className="py-3 px-4 font-mono text-neutral-300">{msg.phone_number}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        msg.status === "sent" || msg.status === "delivered"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                      {new Date(msg.created_at).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: DATA EXPORT & CLOUD BACKUP */}
      {activeSubTab === "backup" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                MARKETING READY
              </span>
            </div>
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Complete Excel / CSV (Marketing Leads)
            </h4>
            <p className="text-xs text-neutral-300 mb-4">
              Microsoft Excel में सीधे खुलने योग्य (UTF-8 BOM)। सभी छात्र विवरण, WhatsApp नंबर, शहर, पता, एजुकेशन, लीड स्टेज, डिस्काउंट कूपन कोड, क्विज़ स्कोर और काउंसलिंग नोट्स शामिल हैं।
            </p>
            <button
              id="btn-export-marketing-excel"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingExcel ? "Excel फ़ाइल तैयार हो रही है..." : "Download Marketing Excel Sheet"}</span>
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" />
              Full System Backup Snapshot
            </h4>
            <p className="text-xs text-neutral-300 mb-4">
              Export complete transactional state including events, question banks, quiz attempts, and audit logs into a portable JSON archive.
            </p>
            <button
              id="btn-export-json-backup"
              onClick={handleExportBackup}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download Full JSON Backup</span>
            </button>
          </div>

          <div className="bg-neutral-900 border border-red-500/20 rounded-3xl p-6 shadow-xl">
            <h4 className="text-base font-bold text-red-400 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Fresh Database Reset (Clean CRM)
            </h4>
            <p className="text-xs text-neutral-300 mb-4">
              Clears all dummy/test registration records and CRM leads. Leaves system 100% fresh and ready for live participants.
            </p>
            <button
              id="btn-fresh-database-reset"
              onClick={async () => {
                if (!window.confirm("क्या आप वाकई सभी टेस्ट डेटा को रीसेट करना चाहते हैं?")) return;
                try {
                  const res = await fetch("/api/admin/maintenance/clear-data", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${authToken}` }
                  });
                  if (res.ok) {
                    fetchDashboard();
                  }
                } catch (err) {
                  console.error(err);
                }
              }}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-red-400" />
              <span>Reset to Fresh CRM Data</span>
            </button>
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
