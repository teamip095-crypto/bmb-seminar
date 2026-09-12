import React, { useState, useEffect } from "react";
import { ParticipantProfile } from "../types";
import { fetchJson } from "../lib/api";
import {
  CheckCircle2,
  Play,
  ExternalLink,
  BookOpen,
  MonitorPlay
} from "lucide-react";

interface LearningPlayerViewProps {
  participant: ParticipantProfile | null;
  onProceedToQuiz?: () => void;
}

export const LearningPlayerView: React.FC<LearningPlayerViewProps> = () => {
  const [streamUrl, setStreamUrl] = useState<string>(
    "https://drive.google.com/file/d/1lxitztPNHlEyRCzR720OVvbn_QoHXn12/preview"
  );
  const [selectedModule, setSelectedModule] = useState<number>(0);
  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);

  useEffect(() => {
    fetchJson<any>("/api/seminar/settings").then(res => {
      if (res.ok && res.data?.live_stream_url) {
        setStreamUrl(res.data.live_stream_url);
      }
    });
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
                जाने BMB Educom के बारे में
              </h2>
              <span className="text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex-shrink-0">
                BMB EDUCOM
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
              BMB Educom • संस्थान, मिशन व आधुनिक तकनीकी शिक्षा
            </p>
          </div>
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
            4 प्रमुख टॉपिक्स
          </span>
        </div>

        {/* Modules List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
        </div>
      </div>
    </div>
  );
};
