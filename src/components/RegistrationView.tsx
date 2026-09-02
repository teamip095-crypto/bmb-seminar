import React, { useState, useEffect } from "react";
import { FridaySeminarStatusResponse, ParticipantProfile } from "../types";
import {
  Sparkles,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  Zap,
  MapPin,
  GraduationCap,
  User,
  Phone,
  Download,
  FileText,
  BookOpen,
  ExternalLink
} from "lucide-react";
import confetti from "canvas-confetti";

const OFFICIAL_BROCHURE_URL = "https://acesse.one/bq9atwd";

interface RegistrationViewProps {
  seminarStatus: FridaySeminarStatusResponse | null;
  onRegistrationSuccess: (participant: ParticipantProfile, token: string) => void;
  onProceedToLearning: () => void;
  participant: ParticipantProfile | null;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  seminarStatus,
  onRegistrationSuccess,
  onProceedToLearning,
  participant
}) => {
  const [formData, setFormData] = useState({
    name: "",
    whatsapp_number: "",
    full_address: "",
    whatsapp_consent: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    registrationId: string;
    seatNumber: string;
    name: string;
    whatsappNumber: string;
    fullAddress: string;
    seminarDateHi: string;
    seminarDateEn: string;
    seminarTime: string;
    seminarVenue?: string;
    reportingTime?: string;
    secureLink: string;
    pdfDownloadUrl: string;
    token: string;
    whatsappStatus: string;
    directWhatsAppLink: string;
  } | null>(null);

  // Countdown timer in state
  const [countdown, setCountdown] = useState<{ d: number; h: number; m: number; s: number }>({
    d: 0,
    h: 0,
    m: 0,
    s: 0
  });

  useEffect(() => {
    if (!seminarStatus) return;
    let secondsLeft = seminarStatus.countdownSeconds;

    const interval = setInterval(() => {
      if (secondsLeft > 0) {
        secondsLeft--;
        const d = Math.floor(secondsLeft / (3600 * 24));
        const h = Math.floor((secondsLeft % (3600 * 24)) / 3600);
        const m = Math.floor((secondsLeft % 3600) / 60);
        const s = Math.floor(secondsLeft % 60);
        setCountdown({ d, h, m, s });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [seminarStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side quick validation
    const cleanPhone = formData.whatsapp_number.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setErrorMessage("कृपया 10 अंकों का वैध व्हाट्सएप नंबर दर्ज करें (Please enter a valid 10-digit WhatsApp number).");
      return;
    }

    if (!formData.name.trim() || formData.name.length < 2) {
      setErrorMessage("कृपया अपना पूरा नाम दर्ज करें (Please enter your full name).");
      return;
    }

    if (!formData.full_address.trim() || formData.full_address.length < 5) {
      setErrorMessage("कृपया अपना पूरा पता दर्ज करें (Please enter your full address).");
      return;
    }

    if (!formData.whatsapp_consent) {
      setErrorMessage("सेमिनार लिंक और क्विज डिटेल्स प्राप्त करने के लिए व्हाट्सएप सहमति आवश्यक है।");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          full_address: formData.full_address.trim(),
          whatsapp_number: cleanPhone,
          whatsapp_consent: formData.whatsapp_consent
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "पंजीकरण विफल रहा। कृपया पुनः प्रयास करें।");
      }

      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (err) {}

      if (data.isExisting) {
        setErrorMessage("आप इस शुक्रवार सेमिनार के लिए पहले से पंजीकृत हैं! सीधे लर्निंग शुरू करें।");
        // Create participant profile
        onRegistrationSuccess({
          id: data.registration.id,
          registration_id: data.registration.registration_id,
          name: data.registration.name,
          display_name: data.registration.name,
          city: data.registration.city || "",
          district: data.registration.district || "",
          education: data.registration.education || "Registered Attendee",
          occupation: data.registration.occupation || "Attendee",
          seminar_event_id: data.registration.seminar_event_id
        }, "existing-session");
        return;
      }

      const passPayload = {
        registrationId: data.registration.registration_id,
        seatNumber: data.seatNumber || data.registration.seat_number || "BMB-SEAT-001",
        name: data.registration.name,
        whatsappNumber: data.registration.whatsapp_number,
        fullAddress: formData.full_address,
        seminarDateHi: data.seminar?.dateHi || seminarStatus?.formattedDateHi || "आगामी शुक्रवार",
        seminarDateEn: data.seminar?.dateEn || seminarStatus?.formattedDateEn || "Upcoming Friday",
        seminarTime: data.seminar?.time || seminarStatus?.seminarTime || "11:00 AM – 4:00 PM IST",
        seminarVenue: data.seminar?.venue || seminarStatus?.venueLocation || "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)",
        reportingTime: data.seminar?.reportingTime || seminarStatus?.reportingTime || "10:45 AM",
        secureLink: data.secureLink,
        pdfDownloadUrl: data.pdfDownloadUrl || `/api/brochure/download-pdf?token=${data.token}`,
        token: data.token,
        whatsappStatus: data.whatsapp?.status || "ready",
        directWhatsAppLink: data.whatsapp?.directLink
      };

      setSuccessData(passPayload);

      // Auto-trigger WhatsApp share window or notification
      if (data.whatsapp?.directLink) {
        try {
          window.open(data.whatsapp.directLink, "_blank", "noopener,noreferrer");
        } catch (e) {
          // Popup blocker fallback
        }
      }

      // Update parent participant state
      onRegistrationSuccess({
        id: data.registration.id,
        registration_id: data.registration.registration_id,
        name: data.registration.name,
        display_name: data.registration.name,
        city: data.registration.city || "",
        district: data.registration.district || "",
        education: data.registration.education || "Attendee",
        occupation: data.registration.occupation || "Attendee",
        seminar_event_id: data.registration.seminar_event_id
      }, data.token);

    } catch (err: any) {
      setErrorMessage(err.message || "पंजीकरण में त्रुटि हुई।");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDownloadPDF = () => {
    window.open(OFFICIAL_BROCHURE_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero & Countdown Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 shadow-2xl p-6 sm:p-10">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full text-amber-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Official BMB Educom Weekly AI Seminar</span>
              </div>
              <a
                id="btn-hero-download-brochure"
                href={OFFICIAL_BROCHURE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-3.5 py-1.5 rounded-full text-amber-300 hover:text-amber-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>ऑफिशियल PDF ब्रोशर डाउनलोड करें</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              FROM ZERO TO <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                AI EXPERT SEMINAR
              </span>
            </h1>

            <p className="text-sm text-neutral-300">
              Professional Artificial Intelligence Training Program • Learn • Build • Innovate • Get Hired
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs sm:text-sm text-neutral-300">
              <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 px-3 py-2 rounded-xl">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-white">
                  {seminarStatus?.formattedDateHi || "आगामी शुक्रवार"}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 px-3 py-2 rounded-xl">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-white">{seminarStatus?.seminarTime || "11:00 AM – 4:00 PM IST"}</span>
              </div>
              <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 px-3 py-2 rounded-xl">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-white">{seminarStatus?.venueLocation || "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)"}</span>
              </div>
            </div>
          </div>

          {/* Countdown Clock Widget */}
          <div className="lg:col-span-5 bg-neutral-900/80 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-center text-xs font-bold uppercase tracking-widest text-amber-400 mb-4 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              आगामी सेमिनार काउंटडाउन
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3">
                <span className="block text-2xl sm:text-3xl font-black text-white font-mono">
                  {String(countdown.d).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">दिन (Days)</span>
              </div>
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3">
                <span className="block text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                  {String(countdown.h).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">घंटे (Hrs)</span>
              </div>
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3">
                <span className="block text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                  {String(countdown.m).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">मिनट (Mins)</span>
              </div>
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3">
                <span className="block text-2xl sm:text-3xl font-black text-red-400 font-mono">
                  {String(countdown.s).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">सेकंड (Secs)</span>
              </div>
            </div>

            {participant ? (
              <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                <p className="text-xs text-amber-200 mb-2">
                  स्वागत है <strong>{participant.name}</strong>! आपका पंजीकरण सक्रिय है।
                </p>
                <button
                  id="btn-resume-learning"
                  onClick={onProceedToLearning}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <span>About AI शुरू करें</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-center text-[11px] text-neutral-400 mt-4">
                नीचे फॉर्म भरकर तुरंत अपनी सीट नंबर, व्हाट्सएप कन्फर्मेशन और 6-पेज का AI सिलेबस PDF प्राप्त करें।
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Form or Success Modal */}
      {successData ? (
        <div className="max-w-3xl mx-auto bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white">
              बधाई हो! आपका रजिस्ट्रेशन कन्फर्म हो गया 🎉
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto">
              आपके व्हाट्सएप नंबर पर कन्फर्मेशन, सीट नंबर और 6-पेज का आधिकारिक AI सिलेबस ब्रोशर PDF लिंक भेज दिया गया है।
            </p>
          </div>

          {/* Official Pass Badge */}
          <div className="bg-gradient-to-br from-neutral-950 via-slate-900 to-neutral-950 border-2 border-amber-500/50 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">OFFICIAL FRIDAY SEMINAR ADMISSION PASS</span>
                <h3 className="text-2xl font-black text-white">{successData.name}</h3>
                <p className="text-xs text-neutral-400">Registration ID: <span className="font-mono text-amber-300 font-bold">{successData.registrationId}</span></p>
              </div>

              {/* Highlighted Seat Number */}
              <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-2 border-amber-500 rounded-2xl px-5 py-3 text-center shadow-lg">
                <div className="text-[10px] text-amber-300 uppercase font-black tracking-widest">RESERVED SEAT NO.</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">{successData.seatNumber}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
              <div className="space-y-1 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
                <div className="text-neutral-400">📅 सेमिनार दिनांक:</div>
                <div className="font-bold text-sky-400 text-sm">{successData.seminarDateHi} ({successData.seminarDateEn})</div>
              </div>
              <div className="space-y-1 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
                <div className="text-neutral-400">⏰ समय:</div>
                <div className="font-bold text-amber-400 text-sm">{successData.seminarTime}</div>
              </div>
              <div className="space-y-1 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
                <div className="text-neutral-400">📍 स्थान:</div>
                <div className="font-bold text-emerald-400 text-sm">{successData.seminarVenue || "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)"}</div>
              </div>
              <div className="space-y-1 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
                <div className="text-neutral-400">📱 व्हाट्सएप नंबर:</div>
                <div className="font-mono text-amber-300 font-bold text-sm">+91 {successData.whatsappNumber}</div>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
              <p className="font-medium">
                💡 <strong>कृपया ध्यान दें:</strong> सेमिनार में {successData.reportingTime || "10:45 AM"} तक रिपोर्ट करें या ऐप पर लाइव जुड़ें। सेमिनार के बाद 2-मिनट का AI क्विज़ होगा जिसमें आपको मिलेगा आकर्षक उपहार।
              </p>
              <p className="text-right text-[11px] text-amber-400 font-bold mt-1">— BMB Educom</p>
            </div>
          </div>

          {/* WhatsApp Confirmation & PDF Action Hub */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">WHATSAPP AUTO-CONFIRMATION</h4>
                  <p className="text-xs text-neutral-400">सीट नंबर और PDF ब्रोशर व्हाट्सएप पर भेजा गया है</p>
                </div>
              </div>

              <a
                id="btn-open-whatsapp-link"
                href={successData.directWhatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>व्हाट्सएप पर खोलें / भेजें (WhatsApp Direct)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>

            {/* 6-Page PDF Syllabus Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">OFFICIAL AI SYLLABUS & BROCHURE (PDF)</h4>
                  <p className="text-xs text-neutral-400">Starter, Beginner, Intermediate और Advanced कोर्स का पूरा आधिकारिक विवरण</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  id="btn-success-download-pdf"
                  href={OFFICIAL_BROCHURE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ऑफिशियल PDF डाउनलोड करें</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>
          </div>

          {/* Next Step Action */}
          <div className="pt-2">
            <button
              id="btn-start-learning-now"
              onClick={onProceedToLearning}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 transition-all text-base cursor-pointer active:scale-98"
            >
              <span>About AI वीडियो देखें</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left info column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-400" />
                  सेमिनार में आप क्या सीखेंगे?
                </h2>
                <a
                  href={OFFICIAL_BROCHURE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>ऑफिशियल PDF</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <ul className="space-y-3.5 text-sm text-neutral-300">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">1</div>
                  <span><strong>AI & Generative AI का आधार:</strong> LLMs, प्रॉम्प्ट इंजीनियरिंग और टूल्स की सटीक समझ।</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">2</div>
                  <span><strong>रचनात्मक और कोडिंग टूल्स:</strong> ग्राफिक डिजाइन, वीडियो एडिटिंग, एनिमेशन और AI कोडिंग।</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">3</div>
                  <span><strong>बिजनेस व करियर मार्गदर्शन:</strong> फ्रीलांसिंग, क्लाइंट वर्क और वास्तविक प्रोजेक्ट्स।</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">4</div>
                  <span><strong>2-Minute लाइव AI क्विज:</strong> 4 प्रश्न और तुरंत आधिकारिक शुक्रवार रैंकिंग।</span>
                </li>
              </ul>

              {/* 6-Page Syllabus Quick Preview Card */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    BMB AI ट्रेनिंग 4 लेवल्स:
                  </span>
                  <span className="text-neutral-400">1 से 6 माह</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                    <span className="font-bold text-sky-400">Level 1: Starter</span>
                    <span className="block text-neutral-400 text-[10px]">ChatGPT, Gemini (1 Mo)</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                    <span className="font-bold text-amber-400">Level 2: Beginner</span>
                    <span className="block text-neutral-400 text-[10px]">Video & Voice AI (2 Mo)</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                    <span className="font-bold text-emerald-400">Level 3: Inter</span>
                    <span className="block text-neutral-400 text-[10px]">Python & APIs (4 Mo)</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                    <span className="font-bold text-purple-400">Level 4: Advanced</span>
                    <span className="block text-neutral-400 text-[10px]">Agents & RAG (6 Mo)</span>
                  </div>
                </div>
                <a
                  href={OFFICIAL_BROCHURE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>ऑफिशियल AI सिलेबस PDF डाउनलोड करें</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/30 rounded-3xl p-6">
              <h3 className="text-base font-bold text-amber-300 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                BMB Educom का पारदर्शी संकल्प
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                हम फर्जी जॉब गारंटी या भ्रामक पैकेज के दावे नहीं करते। हमारा मुख्य उद्देश्य आपको उद्योग-मानक प्रैक्टिकल स्किल्स और आत्मविश्वास प्रदान करना है।
              </p>
            </div>
          </div>

          {/* Right: Registration Form */}
          <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white">
                सेमिनार रजिस्ट्रेशन फॉर्म
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                100% निःशुल्क
              </span>
            </div>
            <p className="text-xs text-neutral-400 mb-6">
              फॉर्म भरते ही आपको तुरंत आपका <strong>सीट नंबर</strong>, <strong>व्हाट्सएप कन्फर्मेशन</strong> और <strong>6-पेज का AI सिलेबस PDF</strong> प्राप्त होगा।
            </p>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-200 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    पूरा नाम (Full Name) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                    <input
                      id="input-full-name"
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    व्हाट्सएप नंबर (10-Digit WhatsApp) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                    <input
                      id="input-whatsapp-number"
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={formData.whatsapp_number}
                      onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    इसी नंबर पर सीट नंबर और PDF ब्रोशर ऑटोमैटिक भेजा जाएगा।
                  </span>
                </div>
              </div>

              {/* Full Address */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  पूरा पता (Full Address & District) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                  <textarea
                    id="input-full-address"
                    required
                    rows={3}
                    placeholder="House/Plot No, Colony/Street, City, Bhilai / Rajnandgaon / Chhattisgarh"
                    value={formData.full_address}
                    onChange={e => setFormData({ ...formData, full_address: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* WhatsApp Consent */}
              <div className="flex items-start gap-3 pt-2 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80">
                <input
                  id="checkbox-whatsapp-consent"
                  type="checkbox"
                  checked={formData.whatsapp_consent}
                  onChange={e => setFormData({ ...formData, whatsapp_consent: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="checkbox-whatsapp-consent" className="text-xs text-neutral-300 leading-relaxed cursor-pointer">
                  हाँ, मैं BMB Educom द्वारा सेमिनार कन्फर्मेशन, सीट नंबर, 6-पेज का AI सिलेबस ब्रोशर PDF और क्विज लिंक व्हाट्सएप पर प्राप्त करने की सहमति देता/देती हूँ।
                </label>
              </div>

              <button
                id="btn-submit-registration"
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 disabled:opacity-50 transition-all text-sm sm:text-base cursor-pointer active:scale-98"
              >
                {isLoading ? (
                  <span>सीट आरक्षित की जा रही है...</span>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>निःशुल्क पंजीकरण करें और सीट नंबर + PDF पाएं</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
