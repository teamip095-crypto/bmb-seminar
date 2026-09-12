import React, { useState } from "react";
import { FridaySeminarStatusResponse, ParticipantProfile } from "../types";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  MapPin,
  User,
  Phone,
  UserCheck,
  PlusCircle,
  Sparkles,
  Award
} from "lucide-react";
import confetti from "canvas-confetti";

interface RegistrationViewProps {
  seminarStatus: FridaySeminarStatusResponse | null;
  onRegistrationSuccess: (participant: ParticipantProfile, token: string) => void;
  onProceedToQuiz: () => void;
  onProceedToLearning: () => void;
  participant: ParticipantProfile | null;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  seminarStatus,
  onRegistrationSuccess,
  onProceedToQuiz,
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
    token: string;
    whatsappStatus: string;
    directWhatsAppLink: string;
  } | null>(null);

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
        setErrorMessage("आप इस सेमिनार के लिए पहले से पंजीकृत हैं! सीधे क्विज शुरू करें।");
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
        seminarDateHi: data.seminar?.dateHi || seminarStatus?.formattedDateHi || "आगामी सेमिनार",
        seminarDateEn: data.seminar?.dateEn || seminarStatus?.formattedDateEn || "Upcoming Seminar",
        seminarTime: data.seminar?.time || seminarStatus?.seminarTime || "11:00 AM – 4:00 PM IST",
        seminarVenue: data.seminar?.venue || seminarStatus?.venueLocation || "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)",
        reportingTime: data.seminar?.reportingTime || seminarStatus?.reportingTime || "10:45 AM",
        secureLink: data.secureLink,
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

  const handleResetForNewStudent = () => {
    setSuccessData(null);
    setFormData({
      name: "",
      whatsapp_number: "",
      full_address: "",
      whatsapp_consent: true
    });
    setErrorMessage(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Existing Registered Participant Notification Banner (if any) */}
      {participant && !successData && (
        <div className="mb-6 p-4 rounded-2xl bg-neutral-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">वर्तमान सक्रिय प्रतिभागी:</p>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{participant.name}</span>
                <span className="text-[10px] font-mono text-amber-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                  ID: {participant.registration_id}
                </span>
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-goto-quiz"
              type="button"
              onClick={onProceedToQuiz}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all cursor-pointer shadow"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Quiz शुरू करें</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-goto-learning"
              type="button"
              onClick={onProceedToLearning}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-all cursor-pointer border border-neutral-700"
            >
              <span>About BMB Educom</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Registration Form or Success Pass */}
      {successData ? (
        <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-white">
              रजिस्ट्रेशन सफल रहा 🎉
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto">
              आपकी सीट आरक्षित हो चुकी है। नीचे दिए गए सीट नंबर और विवरण को सुरक्षित रखें।
            </p>
          </div>

          {/* Official Pass Badge */}
          <div className="bg-gradient-to-br from-neutral-950 via-slate-900 to-neutral-950 border-2 border-amber-500/50 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">OFFICIAL AI SEMINAR ADMISSION PASS</span>
                <h3 className="text-xl sm:text-2xl font-black text-white">{successData.name}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Registration ID: <span className="font-mono text-amber-300 font-bold">{successData.registrationId}</span>
                </p>
              </div>

              {/* Highlighted Seat Number */}
              <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-2 border-amber-500 rounded-2xl px-5 py-3 text-center shadow-lg w-full sm:w-auto">
                <div className="text-[10px] text-amber-300 uppercase font-black tracking-widest">RESERVED SEAT NO.</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">{successData.seatNumber}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-xs">
              <div className="space-y-0.5 bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800">
                <div className="text-neutral-400 text-[11px]">📅 सेमिनार दिनांक:</div>
                <div className="font-bold text-sky-400">{successData.seminarDateHi}</div>
              </div>
              <div className="space-y-0.5 bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800">
                <div className="text-neutral-400 text-[11px]">⏰ समय:</div>
                <div className="font-bold text-amber-400">{successData.seminarTime}</div>
              </div>
              <div className="space-y-0.5 bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800">
                <div className="text-neutral-400 text-[11px]">📍 स्थान:</div>
                <div className="font-bold text-emerald-400">{successData.seminarVenue || "BMB Educom टेक हब"}</div>
              </div>
              <div className="space-y-0.5 bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800">
                <div className="text-neutral-400 text-[11px]">📱 व्हाट्सएप नंबर:</div>
                <div className="font-mono text-amber-300 font-bold">+91 {successData.whatsappNumber}</div>
              </div>
            </div>
          </div>

          {/* Action Hub */}
          <div className="space-y-3 pt-2">
            {successData.directWhatsAppLink && (
              <a
                id="btn-open-whatsapp-link"
                href={successData.directWhatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>व्हाट्सएप पर कन्फर्मेशन विवरण खोलें</span>
              </a>
            )}

            {/* Primary Action: Go to Quiz (Registration ke baad Quiz) */}
            <button
              id="btn-start-quiz-now"
              type="button"
              onClick={onProceedToQuiz}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black py-3.5 px-6 rounded-xl flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 transition-all text-sm sm:text-base cursor-pointer active:scale-98"
            >
              <Award className="w-5 h-5 text-neutral-950" />
              <span>Quiz शुरू करें (Start Quiz)</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            {/* Secondary Action: About BMB Educom Video */}
            <button
              id="btn-view-about-ai"
              type="button"
              onClick={onProceedToLearning}
              className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>जानें BMB Educom के बारे में</span>
            </button>

            <button
              id="btn-register-another"
              type="button"
              onClick={handleResetForNewStudent}
              className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-medium border border-neutral-900 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-neutral-500" />
              <span>अन्य प्रतिभागी का नया रजिस्ट्रेशन करें</span>
            </button>
          </div>
        </div>
      ) : (
        /* The Sole Registration Form Card */
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              रजिस्ट्रेशन फॉर्म
            </h2>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                पूरा नाम (Full Name) <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                <input
                  id="input-full-name"
                  type="text"
                  required
                  placeholder="उदा. राहुल शर्मा (Rahul Sharma)"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                व्हाट्सएप नंबर (10-Digit WhatsApp) <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                <input
                  id="input-whatsapp-number"
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="उदा. 9876543210"
                  value={formData.whatsapp_number}
                  onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors font-mono"
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                इसी नंबर पर आपका सीट नंबर और सेमिनार एक्सेस विवरण भेजा जाएगा।
              </span>
            </div>

            {/* Full Address */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                पूरा पता व शहर / जिला (Full Address & City/District) <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                <textarea
                  id="input-full-address"
                  required
                  rows={3}
                  placeholder="मकान / वार्ड नं., कॉलोनी या गांव, शहर, जिला (उदा. भिलाई, दुर्ग / रायपुर)"
                  value={formData.full_address}
                  onChange={e => setFormData({ ...formData, full_address: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* WhatsApp Consent */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
              <input
                id="checkbox-whatsapp-consent"
                type="checkbox"
                checked={formData.whatsapp_consent}
                onChange={e => setFormData({ ...formData, whatsapp_consent: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="checkbox-whatsapp-consent" className="text-xs text-neutral-300 leading-relaxed cursor-pointer select-none">
                हाँ, मैं BMB Educom द्वारा सेमिनार कन्फर्मेशन, सीट नंबर और क्विज लिंक व्हाट्सएप पर प्राप्त करने की सहमति देता/देती हूँ।
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-registration"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 disabled:opacity-50 transition-all text-sm sm:text-base cursor-pointer active:scale-98"
            >
              {isLoading ? (
                <span>सीट आरक्षित की जा रही है...</span>
              ) : (
                <>
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>पंजीकरण करें</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
