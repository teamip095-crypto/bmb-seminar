import React, { useState, useEffect } from "react";
import { ParticipantProfile } from "../types";
import {
  Sparkles,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Video,
  Play,
  ExternalLink,
  BookOpen,
  Zap,
  Briefcase,
  Layers,
  MonitorPlay,
  Share2
} from "lucide-react";

interface LearningPlayerViewProps {
  participant: ParticipantProfile | null;
  onProceedToQuiz: () => void;
}

export const LearningPlayerView: React.FC<LearningPlayerViewProps> = ({
  participant,
  onProceedToQuiz
}) => {
  const [streamUrl, setStreamUrl] = useState<string>(
    "https://drive.google.com/file/d/1lxitztPNHlEyRCzR720OVvbn_QoHXn12/preview"
  );
  const [selectedModule, setSelectedModule] = useState<number>(0);
  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/seminar/settings")
      .then(res => res.json())
      .then(data => {
        if (data.live_stream_url) {
          setStreamUrl(data.live_stream_url);
        }
      })
      .catch(() => {});
  }, []);

  // Format video URL to mobile-friendly embed
  const getCleanEmbedUrl = (rawUrl: string): { type: "youtube" | "drive" | "direct" | "generic"; url: string; directOpenUrl: string } => {
    if (!rawUrl) {
      return {
        type: "drive",
        url: "https://drive.google.com/file/d/1lxitztPNHlEyRCzR720OVvbn_QoHXn12/preview",
        directOpenUrl: "https://drive.google.com/file/d/1lxitztPNHlEyRCzR720OVvbn_QoHXn12/view?usp=sharing"
      };
    }

    // YouTube handling
    if (rawUrl.includes("youtube.com") || rawUrl.includes("youtu.be")) {
      let videoId = "";
      if (rawUrl.includes("youtu.be/")) {
        videoId = rawUrl.split("youtu.be/")[1]?.split("?")[0] || "";
      } else if (rawUrl.includes("v=")) {
        videoId = new URLSearchParams(rawUrl.split("?")[1] || "").get("v") || "";
      } else if (rawUrl.includes("embed/")) {
        videoId = rawUrl.split("embed/")[1]?.split("?")[0] || "";
      }
      if (videoId) {
        return {
          type: "youtube",
          url: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`,
          directOpenUrl: `https://www.youtube.com/watch?v=${videoId}`
        };
      }
    }

    // Google Drive handling
    if (rawUrl.includes("drive.google.com")) {
      const match = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const driveId = match ? match[1] : "1lxitztPNHlEyRCzR720OVvbn_QoHXn12";
      return {
        type: "drive",
        url: `https://drive.google.com/file/d/${driveId}/preview`,
        directOpenUrl: `https://drive.google.com/file/d/${driveId}/view?usp=sharing`
      };
    }

    return {
      type: "generic",
      url: rawUrl,
      directOpenUrl: rawUrl
    };
  };

  const parsedVideo = getCleanEmbedUrl(streamUrl);

  const seminarCurriculum = [
    {
      title: "1. Artificial Intelligence और GenAI का परिचय",
      desc: "ChatGPT, Gemini, और Claude जैसे आधुनिक AI मॉडल्स कैसे काम करते हैं और रोज़मर्रा के कार्यों को 10x तेज़ कैसे करें।",
      tags: ["AI Basics", "Prompt Engineering", "GenAI"]
    },
    {
      title: "2. टॉप AI टूल्स व प्रैक्टिकल वर्कफ़्लो",
      desc: "कंटेंट राइटिंग, कोडिंग, ग्राफिक डिज़ाइनिंग और डेटा एनालिसिस के लिए टॉप 20+ जरूरी टूल्स का लाइव डेमो।",
      tags: ["ChatGPT 4o", "Midjourney", "Claude 3.7", "Automation"]
    },
    {
      title: "3. AI ऑटोमेशन और बिज़नेस एजेंट्स",
      desc: "बिना कोडिंग के WhatsApp AI बॉट्स, कस्टम CRM ऑटोमेशन और ईमेल सिस्टम्स बनाना सीखें।",
      tags: ["No-Code AI", "Zapier", "Make.com", "AI Agents"]
    },
    {
      title: "4. हाई-पेइंग AI करियर व फ्रीलांसिंग 2025-2026",
      desc: "AI प्रॉम्प्ट इंजीनियर, AI कंसलटेंट और रिमोट फ्रीलांसिंग में प्रति माह ₹50,000 से ₹2,50,000+ कमाने का स्पष्ट रोडमैप।",
      tags: ["Career Roadmap", "Freelancing", "High Income Skills"]
    },
    {
      title: "5. BMB Educom सर्टिफिकेशन व इंटर्नशिप",
      desc: "सेमिनार के बाद 2-मिनट का क्विज़ देकर ऑफिशियल BMB AI सर्टिफ़िकेट और लाइव प्रोजेक्ट इंटर्नशिप प्राप्त करें।",
      tags: ["BMB Certificate", "Live Internship", "Govt Recognized"]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-6 py-3 sm:py-8 space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-amber-500/20 flex-shrink-0">
            <MonitorPlay className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-xl font-black text-white tracking-tight truncate">
                About AI (AI मास्टरक्लास वीडियो)
              </h2>
              <span className="text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex-shrink-0">
                HD SEMINAR
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
              BMB Educom AI Masterclass • सीखें, समझें और क्विज़ दें
            </p>
          </div>
        </div>

        {/* Top CTA to Quiz */}
        <div className="flex items-center gap-2 justify-end">
          <button
            id="btn-top-about-ai-quiz"
            onClick={onProceedToQuiz}
            className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>2-Min Quiz दें</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Cinema Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-2 sm:p-5 shadow-2xl space-y-3">
        {/* Responsive Video Frame */}
        <div className="relative w-full aspect-video min-h-[220px] sm:min-h-[440px] rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-neutral-800 shadow-inner">
          
          {/* Loading Indicator */}
          {!isIframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/95 text-neutral-400 z-10 gap-2 p-4 text-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-amber-300">
                वीडियो लोड हो रहा है... कृपया 2 सेकंड प्रतीक्षा करें
              </p>
            </div>
          )}

          {/* Clean Frame Embed */}
          <iframe
            key={parsedVideo.url}
            src={parsedVideo.url}
            title="BMB Educom AI Seminar Video"
            onLoad={() => setIsIframeLoaded(true)}
            className="w-full h-full border-0 absolute inset-0 z-20 bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
          />
        </div>

        {/* Mobile-Friendly Player Utility Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2 bg-neutral-950 rounded-xl border border-neutral-800/80 text-xs">
          <div className="flex items-center gap-2 text-neutral-300 text-[11px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span>यदि वीडियो चलने में समस्या हो, तो सीधे HD में खोलें:</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <a
              id="btn-open-direct-hd-video"
              href={parsedVideo.directOpenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded-lg text-amber-300 hover:text-amber-200 text-[11px] sm:text-xs font-bold transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>HD प्लेयर में देखें (Full Screen)</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>

            <button
              id="btn-quiz-cta-video-bottom"
              onClick={onProceedToQuiz}
              className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-black shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>क्विज़ शुरू करें</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive AI Masterclass Modules & Topics (Curriculum) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-base font-bold text-white">
              सेमिनार में क्या-क्या सिखाया जाएगा? (Seminar Modules)
            </h3>
          </div>
          <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            5 प्रमुख टॉपिक्स
          </span>
        </div>

        {/* Modules List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {seminarCurriculum.map((mod, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedModule === idx
                  ? "bg-amber-500/10 border-amber-500/50 shadow-md"
                  : "bg-neutral-950/60 border-neutral-800 hover:border-neutral-700"
              }`}
              onClick={() => setSelectedModule(idx)}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold text-amber-400">
                  MODULE 0{idx + 1}
                </span>
                {selectedModule === idx && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <h4 className="text-xs font-bold text-white mb-1 leading-snug">
                {mod.title}
              </h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                {mod.desc}
              </p>
              <div className="flex flex-wrap gap-1 mt-2.5">
                {mod.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Quiz Callout Box */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-600/20 via-neutral-950 to-neutral-950 border border-amber-500/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>2-मिनट क्विज़ व ऑल-इंडिया रैंक</span>
              </div>
              <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                5 सरल प्रश्नों के उत्तर देकर 100 अंक प्राप्त करें और लीडरबोर्ड पर अपनी रैंक देखें।
              </p>
            </div>
            <button
              id="btn-curriculum-take-quiz"
              onClick={onProceedToQuiz}
              className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-transform active:scale-95 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>क्विज़ शुरू करें (Start Quiz)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Certification & Career Assurance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-white text-xs">मान्यता प्राप्त सर्टिफिकेशन</h5>
            <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">
              BMB Educom AI Seminar का आधिकारिक सर्टिफिकेट हर प्रतिभागी को दिया जाएगा।
            </p>
          </div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 flex items-start gap-2.5">
          <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-white text-xs">लाइव प्रोजेक्ट्स व असाइनमेंट्स</h5>
            <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">
              रियल-वर्ल्ड AI ऑटोमेशन और प्रॉम्प्ट्स की हैंड-ऑन ट्रेनिंग।
            </p>
          </div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 flex items-start gap-2.5">
          <Briefcase className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-white text-xs">जॉब व प्लेसमेंट असिस्टेंस</h5>
            <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">
              टॉप परफॉर्मर्स को BMB Educom पार्टनर नेटवर्क में इंटर्नशिप अवसर।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
