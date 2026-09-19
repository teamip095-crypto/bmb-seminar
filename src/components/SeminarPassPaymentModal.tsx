import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  X,
  QrCode,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  Download,
  ExternalLink,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  Info
} from "lucide-react";
import confetti from "canvas-confetti";
import { ParticipantProfile, SeminarPassPurchase } from "../types";

interface SeminarPassPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: ParticipantProfile;
  participantToken: string;
  onPassGranted: (pass: SeminarPassPurchase) => void;
  totalPassHoldersCount?: number;
}

export const SeminarPassPaymentModal: React.FC<SeminarPassPaymentModalProps> = ({
  isOpen,
  onClose,
  participant,
  participantToken,
  onPassGranted,
  totalPassHoldersCount = 0
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [screenshotBase64, setScreenshotBase64] = useState<string>("");
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [verifiedPass, setVerifiedPass] = useState<SeminarPassPurchase | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const upiId = "himanchal310@okaxis";
  const upiPhone = "9301056006";
  const payeeName = "Himanchal";
  const amount = 199;
  const originalPrice = 500;
  const savings = originalPrice - amount;

  // Deep-link standard for NPCI UPI URI
  const upiDeepLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=BMB_AI_Seminar_Pass_${participant.id}`;

  // Generate crisp QR code on mount / when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(upiDeepLink, {
      width: 320,
      margin: 1.5,
      color: {
        dark: "#0a0a0a",
        light: "#ffffff"
      },
      errorCorrectionLevel: "H"
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error("Error generating UPI QR code:", err));
  }, [isOpen, upiDeepLink]);

  if (!isOpen) return null;

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorReason(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorReason("कृपया केवल इमेज फाइल (PNG, JPG, JPEG) अपलोड करें।");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorReason("फाइल साइज 10MB से कम होना चाहिए।");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setScreenshotBase64(result);
      setScreenshotPreview(result);
    };
    reader.readAsDataURL(file);
  };

  // Submit payment & trigger AI verification
  const handleVerifyPayment = async () => {
    if (!utrNumber || utrNumber.trim().length < 6) {
      setErrorReason("कृपया सही 12-अंकीय UPI UTR / Transaction Ref No दर्ज करें।");
      return;
    }

    if (!screenshotBase64) {
      setErrorReason("कृपया भुगतान का स्क्रीनशॉट अपलोड करें।");
      return;
    }

    setIsVerifying(true);
    setErrorReason(null);

    try {
      const response = await fetch("/api/pass/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_token: participantToken,
          utr_number: utrNumber.trim(),
          screenshot_base64: screenshotBase64
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "स्क्रीनशॉट सत्यापन विफल। कृपया वैध UPI रसीद अपलोड करें।");
      }

      setVerifiedPass(data.pass);
      setWhatsappLink(data.whatsappStudentLink || null);
      onPassGranted(data.pass);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error("Verification error:", err);
      setErrorReason(err.message || "सत्यापन में त्रुटि हुई।");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-auto text-white">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 p-4 text-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-neutral-950 text-amber-400 flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-neutral-950/20 px-2 py-0.5 rounded text-neutral-900">
                विशेष रियायती पास ऑफर
              </span>
              <h2 className="text-lg sm:text-xl font-black leading-tight">
                BMB EDUCOM AI SEMINAR PASS
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-950/20 hover:bg-neutral-950/30 flex items-center justify-center text-neutral-950 font-bold transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* If already verified, show success screen */}
          {verifiedPass ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-full mb-2">
                  ✓ भुगतान व स्क्रीनशॉट सत्यापित
                </span>
                <h3 className="text-2xl font-black text-white">
                  बधाई हो, {participant.name}!
                </h3>
                <p className="text-sm text-neutral-300 mt-1 max-w-md mx-auto">
                  आपका BMB AI Seminar Pass सफलतापूर्वक जारी कर दिया गया है।
                </p>
              </div>

              {/* Pass Card Preview */}
              <div className="bg-gradient-to-br from-neutral-800 to-neutral-950 border border-amber-500/40 rounded-xl p-5 text-left shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-neutral-950 text-[10px] font-black px-3 py-1 rounded-bl-lg">
                  VERIFIED PASS
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl">
                    AI
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">BMB EDUCOM AI SEMINAR PASS</h4>
                    <p className="text-xs text-neutral-400">Pass No: {verifiedPass.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-t border-neutral-800 pt-3">
                  <div>
                    <span className="text-neutral-400 block">छात्र का नाम:</span>
                    <span className="font-semibold text-white">{verifiedPass.participant_name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">WhatsApp नंबर:</span>
                    <span className="font-semibold text-white">{verifiedPass.whatsapp_number}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">वास्तविक पास मूल्य:</span>
                    <span className="line-through text-neutral-500 font-bold">₹{verifiedPass.original_amount}/-</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">भुगतान किया गया शुल्क:</span>
                    <span className="text-emerald-400 font-black text-sm">₹{verifiedPass.amount_paid}/- (बचत: ₹{verifiedPass.original_amount - verifiedPass.amount_paid}/-)</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">UPI UTR Ref:</span>
                    <span className="font-mono text-neutral-300">{verifiedPass.utr_number}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">सेमिनार पात्रता:</span>
                    <span className="text-amber-400 font-semibold">Stage 2 Mega Quiz Unlocked ✓</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>यह पास और आधिकारिक इनवॉइस आपके WhatsApp पर भेज दिया गया है। एडमिन (9301056006) को भी सूचित कर दिया गया है।</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    <span>WhatsApp पर इनवॉइस देखें</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <span>Mega AI Seminar Quiz शुरू करें</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Value Proposition & Offer Banner */}
              <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="line-through text-neutral-400 font-semibold text-sm">
                      मूल पास शुल्क: ₹{originalPrice}/-
                    </span>
                    <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/30">
                      ₹{savings}/- की सीधी छूट
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                    केवल ₹{amount}/- मात्र
                  </div>
                  <p className="text-xs text-neutral-300 mt-1">
                    BMB AI Seminar Entry + Stage 2 Mega Quiz + सर्टिफिकेट + स्कॉलरशिप पात्रता
                  </p>
                </div>

                {/* Real-time Pass Holders Count */}
                <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-xl px-3.5 py-2 text-right self-stretch sm:self-auto flex sm:flex-col justify-between items-center sm:items-end">
                  <span className="text-[11px] text-neutral-400">पास धारक छात्र:</span>
                  <span className="text-lg font-black text-amber-300 flex items-center gap-1">
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {totalPassHoldersCount > 0 ? totalPassHoldersCount : 12}+ छात्र
                  </span>
                </div>
              </div>

              {/* Payment Section: QR & UPI details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Left: QR Code Box */}
                <div className="bg-white rounded-2xl p-4 text-neutral-900 flex flex-col items-center justify-center text-center shadow-lg border border-neutral-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Scan with any UPI App
                  </span>
                  <div className="text-xs font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mb-2">
                    GPay • PhonePe • Paytm • BHIM • Cred
                  </div>

                  {qrDataUrl ? (
                    <div className="relative p-2 bg-white rounded-xl border border-neutral-200 shadow-inner">
                      <img
                        src={qrDataUrl}
                        alt="BMB Educom UPI QR Code"
                        className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-9 h-9 rounded-lg bg-neutral-900 border-2 border-white text-amber-400 flex items-center justify-center font-black text-xs shadow-md">
                          ₹199
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-48 h-48 flex flex-col items-center justify-center bg-neutral-100 rounded-xl space-y-2">
                      <Clock className="w-8 h-8 text-neutral-400 animate-spin" />
                      <span className="text-[10px] text-neutral-500">QR लोड हो रहा है...</span>
                      {/* Fallback: online QR generator API in case local QRCode lib fails */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiDeepLink)}&color=0a0a0a&bgcolor=ffffff&qzone=1`}
                        alt="UPI QR Fallback"
                        className="w-40 h-40 object-contain"
                        onLoad={() => console.log("Fallback QR loaded")}
                        onError={() => console.error("Fallback QR also failed")}
                      />
                    </div>
                  )}

                  {/* Direct Mobile UPI Intent Button */}
                  <a
                    href={upiDeepLink}
                    className="mt-3 w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span>किसी भी UPI ऐप से सीधे भुगतान करें</span>
                  </a>

                  <div className="mt-2 text-[11px] text-neutral-500 font-mono">
                    UPI ID: <span className="font-bold text-neutral-800">{upiId}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Phone / WhatsApp: <span className="font-bold text-neutral-800">{upiPhone}</span>
                  </div>
                </div>

                {/* Right: Upload Screenshot & UTR */}
                <div className="space-y-4">
                  <div className="bg-neutral-800/70 border border-neutral-700/70 rounded-xl p-3.5 text-xs text-neutral-300 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400">
                      <Info className="w-4 h-4 flex-shrink-0" />
                      <span>भुगतान निर्देश (3 आसान स्टेप्स):</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-300">
                      <li>QR कोड स्कैन करके ₹199/- का भुगतान करें।</li>
                      <li>UPI ऐप से 12-अंकीय <strong>UTR / Ref No</strong> कॉपी करें।</li>
                      <li>सफल ट्रांजेक्शन का स्क्रीनशॉट यहाँ अपलोड करें।</li>
                    </ol>
                  </div>

                  {/* UTR Input */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      12-अंकीय UPI UTR / Transaction Ref No <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={e => setUtrNumber(e.target.value)}
                      placeholder="उदा. 423589123456"
                      className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 font-mono tracking-wider focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Screenshot Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      UPI ट्रांजेक्शन स्क्रीनशॉट अपलोड करें <span className="text-red-400">*</span>
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {screenshotPreview ? (
                      <div className="relative border border-amber-500/40 rounded-xl p-2 bg-neutral-950 flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <img
                            src={screenshotPreview}
                            alt="Receipt Preview"
                            className="w-12 h-12 rounded object-cover border border-neutral-700 flex-shrink-0"
                          />
                          <div className="truncate text-xs">
                            <span className="text-emerald-400 font-medium block truncate">✓ रसीद चुनी गई</span>
                            <span className="text-[10px] text-neutral-500 font-mono">इमेज तैयार है</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-1 bg-neutral-800 rounded cursor-pointer"
                        >
                          बदलें
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-neutral-700 hover:border-amber-500/70 bg-neutral-950/60 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                      >
                        <Upload className="w-7 h-7 text-amber-400 mb-1" />
                        <span className="text-xs font-semibold text-neutral-200">
                          स्क्रीनशॉट चुनने के लिए क्लिक करें
                        </span>
                        <span className="text-[10px] text-neutral-500 mt-0.5">
                          PNG, JPG या JPEG (अधिकतम 10MB)
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Anti-Fake Warning */}
                  <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-2.5 text-[11px] text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>सख्त चेतावनी:</strong> नकली, एडिटेड या पुराना स्क्रीनशॉट होने पर सिस्टम सत्यापन अस्वीकार कर देगा। असली रसीद होने पर ही एडमिन (9301056006) और आपके WhatsApp पर इनवॉइस भेजा जाएगा।
                    </span>
                  </div>

                  {/* Error Notification */}
                  {errorReason && (
                    <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-xl text-xs flex items-start gap-2 animate-shake">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{errorReason}</span>
                    </div>
                  )}

                  {/* Verification Submit Button */}
                  <button
                    onClick={handleVerifyPayment}
                    disabled={isVerifying || !utrNumber || !screenshotBase64}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-neutral-700 disabled:to-neutral-800 disabled:text-neutral-500 text-neutral-950 font-black py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all"
                  >
                    {isVerifying ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin text-neutral-950" />
                        <span>AI द्वारा स्क्रीनशॉट सत्यापित हो रहा है...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-neutral-950" />
                        <span>स्क्रीनशॉट सत्यापित करें और पास प्राप्त करें (₹199)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
