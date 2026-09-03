import React, { useState } from "react";
import { BMB_BROCHURE_DATA } from "../data/brochureData";
import { generateBmbBrochurePDF, ParticipantPassData } from "../utils/pdfGenerator";
import {
  X,
  Download,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Briefcase,
  Award,
  TrendingUp,
  MapPin,
  Phone,
  CheckCircle2,
  Layers,
  FileText,
  Share2
} from "lucide-react";

interface BrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
  passData?: ParticipantPassData;
}

export const BrochureModal: React.FC<BrochureModalProps> = ({
  isOpen,
  onClose,
  passData
}) => {
  const [activePage, setActivePage] = useState<number>(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    try {
      const link = document.createElement("a");
      link.href = "/bmb_ai_expert_brochure.pdf";
      link.download = "BMB_Educom_AI_Expert_Brochure.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("PDF download failed:", err);
      window.location.href = "/api/brochure/download-pdf";
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400 text-base">BMB EDUCOM</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  OFFICIAL 6-PAGE AI SYLLABUS
                </span>
              </div>
              <p className="text-xs text-neutral-400">FROM ZERO TO AI EXPERT • Professional AI Training Program</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? "PDF तैयार हो रहा है..." : "डाउनलोड PDF (6 Pages)"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page Selector Tabs */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-950/80 border-b border-neutral-800 overflow-x-auto gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            {[
              { num: 1, label: "Cover & Pass" },
              { num: 2, label: "Starter (1 Mo)" },
              { num: 3, label: "Beginner (2 Mo)" },
              { num: 4, label: "Intermediate (4 Mo)" },
              { num: 5, label: "Advanced (6 Mo)" },
              { num: 6, label: "Career & Campuses" }
            ].map(tab => (
              <button
                key={tab.num}
                onClick={() => setActivePage(tab.num)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activePage === tab.num
                    ? "bg-amber-500 text-neutral-950 font-bold shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                Page {tab.num}: {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0 text-neutral-400 font-mono text-xs">
            <button
              onClick={() => setActivePage(p => Math.max(1, p - 1))}
              disabled={activePage === 1}
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>{activePage} / 6</span>
            <button
              onClick={() => setActivePage(p => Math.min(6, p + 1))}
              disabled={activePage === 6}
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Active Page Content Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-neutral-200">
          {/* PAGE 1: COVER & PASS */}
          {activePage === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2 py-4 border-b border-neutral-800">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  ADMISSION OPEN 2026 • PROFESSIONAL AI TRAINING PROGRAM
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  FROM ZERO TO <span className="text-amber-400">AI EXPERT</span>
                </h2>
                <p className="text-sm text-neutral-400 font-medium">
                  {BMB_BROCHURE_DATA.tagline}
                </p>
              </div>

              {/* Seminar Pass Card if PassData exists */}
              {passData && (
                <div className="bg-gradient-to-br from-neutral-950 via-slate-900 to-neutral-950 border-2 border-amber-500/50 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                    <div>
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">OFFICIAL FRIDAY ADMISSION PASS</span>
                      <h3 className="text-xl font-bold text-white">{passData.name}</h3>
                      <p className="text-xs text-neutral-400">Registration ID: <span className="font-mono text-amber-300">{passData.registrationId}</span></p>
                    </div>

                    <div className="bg-neutral-900/90 border border-amber-500/40 rounded-xl px-4 py-2.5 text-center shadow-md">
                      <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Reserved Seat No.</div>
                      <div className="text-xl font-black text-amber-400 font-mono">{passData.seatNumber}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-xs text-neutral-300">
                    <div className="space-y-1">
                      <div className="text-neutral-400">📅 सेमिनार दिनांक:</div>
                      <div className="font-semibold text-sky-400">{passData.seminarDateHi} ({passData.seminarDateEn})</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-neutral-400">⏰ समय:</div>
                      <div className="font-semibold text-amber-400">{passData.seminarTime || "11:00 AM – 04:00 PM IST"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-neutral-400">📱 व्हाट्सएप नंबर:</div>
                      <div className="font-mono text-emerald-400">+91 {passData.whatsappNumber}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-neutral-400">📍 पता:</div>
                      <div className="truncate text-neutral-300">{passData.fullAddress}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4 Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 text-center space-y-1">
                  <GraduationCap className="w-5 h-5 text-amber-400 mx-auto" />
                  <div className="text-xs font-bold text-white">Industry Oriented</div>
                  <div className="text-[11px] text-neutral-400">Live AI Real Projects</div>
                </div>
                <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 text-center space-y-1">
                  <Briefcase className="w-5 h-5 text-sky-400 mx-auto" />
                  <div className="text-xs font-bold text-white">Placement Support</div>
                  <div className="text-[11px] text-neutral-400">100% Career Assistance</div>
                </div>
                <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 text-center space-y-1">
                  <Award className="w-5 h-5 text-emerald-400 mx-auto" />
                  <div className="text-xs font-bold text-white">Govt & BMB Cert</div>
                  <div className="text-[11px] text-neutral-400">Verified Credentials</div>
                </div>
                <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 text-center space-y-1">
                  <TrendingUp className="w-5 h-5 text-purple-400 mx-auto" />
                  <div className="text-xs font-bold text-white">Better Future</div>
                  <div className="text-[11px] text-neutral-400">High-Salary Pathways</div>
                </div>
              </div>

              {/* Campus Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-neutral-950 border border-amber-500/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    BHILAI CAMPUS
                  </div>
                  <p className="text-xs text-neutral-400">GE Road, Karma Bhawan, Supela, Bhilai, Chhattisgarh</p>
                  <div className="flex items-center gap-2 text-xs font-mono text-sky-400 font-bold">
                    <Phone className="w-3.5 h-3.5" />
                    940 795 5315, 940 795 5318
                  </div>
                </div>

                <div className="bg-neutral-950 border border-amber-500/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    RAJNANDGAON CAMPUS
                  </div>
                  <p className="text-xs text-neutral-400">1st Floor, Above Tathagat Coaching, GE Road, Bhadoriya Chowk</p>
                  <div className="flex items-center gap-2 text-xs font-mono text-sky-400 font-bold">
                    <Phone className="w-3.5 h-3.5" />
                    790 990 9903, 790 990 9906
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGES 2 - 5: COURSE LEVELS */}
          {activePage >= 2 && activePage <= 5 && (() => {
            const lvl = BMB_BROCHURE_DATA.levels[activePage - 2];
            return (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                  <div>
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">{lvl.badge}</div>
                    <h2 className="text-2xl font-black text-white">{lvl.level}</h2>
                    <p className="text-xs text-neutral-400 mt-1">{lvl.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs">
                      अवधि: {lvl.duration}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-neutral-800 text-sky-400 font-semibold text-xs border border-neutral-700">
                      {lvl.mode}
                    </span>
                  </div>
                </div>

                {/* Topics Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {lvl.topics.map((tGroup, gIdx) => (
                    <div key={gIdx} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2.5">
                      {tGroup.category && (
                        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-neutral-850 pb-1 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          {tGroup.category}
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-1.5">
                        {tGroup.items.map((item, iIdx) => (
                          <div key={iIdx} className="flex items-center gap-2 text-xs text-neutral-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Highlights */}
                <div className="bg-neutral-950/80 border border-sky-500/30 rounded-xl p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span className="font-bold text-sky-400 shrink-0">प्रमुख विशेषताएं (Key Highlights):</span>
                  <span className="text-neutral-300">{lvl.highlights.join(" • ")}</span>
                </div>
              </div>
            );
          })()}

          {/* PAGE 6: CAREER & CONTACT */}
          {activePage === 6 && (
            <div className="space-y-6">
              <div className="text-center space-y-1.5 pb-4 border-b border-neutral-800">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">CAREER OPPORTUNITIES & LIFETIME SUPPORT</span>
                <h2 className="text-2xl font-black text-white">BUILD YOUR AI FUTURE</h2>
                <p className="text-xs text-neutral-400">Learn Today, Build Tomorrow, Lead the AI World.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Career Opportunities */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <div className="font-bold text-amber-400 text-sm flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    CAREER OPPORTUNITIES
                  </div>
                  <div className="space-y-2">
                    {BMB_BROCHURE_DATA.careerOpportunities.map((career, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-2 text-xs text-neutral-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{career}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lifetime Support */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <div className="font-bold text-sky-400 text-sm flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    LIFETIME SUPPORT
                  </div>
                  <div className="space-y-2.5">
                    {BMB_BROCHURE_DATA.lifetimeSupport.map((supp, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-2 text-xs text-neutral-200">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{supp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tools Cloud */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center space-y-2">
                <div className="text-xs font-bold text-amber-400">TOOLS & TECHNOLOGIES TAUGHT</div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {BMB_BROCHURE_DATA.toolsAndTech.map((tool, tIdx) => (
                    <span key={tIdx} className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-mono">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-gradient-to-r from-amber-500/10 via-neutral-950 to-amber-500/10 border border-amber-500/40 rounded-xl p-4 text-center space-y-2">
                <div className="font-bold text-amber-400 text-sm">प्रवेश एवं परामर्श हेल्पलाइन (Admissions Desk)</div>
                <div className="text-xs text-neutral-300">📞 भिलाई: 940 795 5315, 940 795 5318 | राजनांदगांव: 790 990 9903 / 6</div>
                <div className="text-[11px] text-neutral-400">वेबसाइट: www.bmbeducom.com | ईमेल: admissions@bmbeducom.com</div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-neutral-950 border-t border-neutral-800 text-xs shrink-0">
          <div className="text-neutral-400">
            {passData ? (
              <span>सीट नंबर: <strong className="text-amber-400 font-mono">{passData.seatNumber}</strong></span>
            ) : (
              <span>BMB Educom Verified AI Syllabus (6 Pages)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? "तैयार हो रहा है..." : "ऑफिशियल PDF डाउनलोड करें"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
