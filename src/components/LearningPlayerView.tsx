import React, { useState, useEffect } from "react";
import { ParticipantProfile } from "../types";
import {
  Sparkles,
  ExternalLink,
  Award,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Maximize2,
  Tv,
  CheckCircle2,
  Video
} from "lucide-react";

interface LearningPlayerViewProps {
  participant: ParticipantProfile | null;
  onProceedToQuiz: () => void;
}

export const LearningPlayerView: React.FC<LearningPlayerViewProps> = ({
  participant,
  onProceedToQuiz
}) => {
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);
  const [streamUrl, setStreamUrl] = useState<string>("https://drive.google.com/file/d/1lxitztPNHlEyRCzR720OVvbn_QoHXn12/preview?autoplay=1&loop=1");

  // Official short link provided by user
  const OFFICIAL_VIDEO_LINK = "https://l1nk.dev/3hak199";

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

  const handleReload = () => {
    setIsIframeLoaded(false);
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-amber-500/20">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                About AI (AI के बारे में)
              </h2>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                HD DIRECT STREAM
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              BMB Educom AI Friday Masterclass • Official Video Session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-reload-video"
            onClick={handleReload}
            title="Reload Video Stream"
            className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">रीलोड करें</span>
          </button>

          <a
            id="btn-direct-video-link"
            href={OFFICIAL_VIDEO_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>डायरेक्ट लिंक (l1nk.dev)</span>
          </a>

          <button
            id="btn-about-ai-proceed-quiz"
            onClick={onProceedToQuiz}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>2-Min Quiz दें</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Cinema Container - Zero Lag, Instant Embed */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-3 sm:p-5 shadow-2xl space-y-4">
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-inner">
          {/* Loading placeholder before iframe finishes mounting */}
          {!isIframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 text-neutral-400 z-10 gap-3">
              <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-amber-200 animate-pulse">
                About AI वीडियो लोड हो रहा है (Direct Stream)...
              </p>
            </div>
          )}

          <iframe
            key={iframeKey}
            src={streamUrl}
            title="BMB Educom About AI Video"
            className="w-full h-full border-0 relative z-20"
            allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *; accelerometer; gyroscope"
            allowFullScreen
            onLoad={() => setIsIframeLoaded(true)}
          />
        </div>

        {/* Video Footer Info & Next Step CTA */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-xs text-neutral-300">
              <span className="font-semibold text-white">स्मूथ ऑटोप्ले:</span> यदि वीडियो ऑटोप्ले में कोई रुकावट आए तो ऊपर दिए गए{" "}
              <a
                href={OFFICIAL_VIDEO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 underline font-semibold hover:text-amber-300"
              >
                डायरेक्ट लिंक
              </a>{" "}
              पर क्लिक करें।
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {participant && (
              <div className="hidden sm:flex items-center gap-2 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-neutral-400">लॉगिन:</span>
                <span className="text-amber-300 font-bold">{participant.name}</span>
              </div>
            )}

            <button
              id="btn-quiz-cta-bottom"
              onClick={onProceedToQuiz}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all cursor-pointer active:scale-98"
            >
              <Award className="w-4 h-4" />
              <span>वीडियो देख लिया? 2-मिनट क्विज़ में भाग लें</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 space-y-1.5">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            प्रैक्टिकल AI प्रोजेक्ट्स
          </h4>
          <p className="text-neutral-400 leading-relaxed">
            आर्टिफिशियल इंटेलिजेंस, जेनरेटिव AI टूल्स, और ऑटोमेशन वर्कफ़्लो को सीधे प्रैक्टिकल प्रोजेक्ट्स के माध्यम से समझें।
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 space-y-1.5">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            2-Min लाइव क्विज़ & लीडरबोर्ड
          </h4>
          <p className="text-neutral-400 leading-relaxed">
            वीडियो देखने के तुरंत बाद 2-मिनट का AI क्विज़ दें और अपनी ऑल-इंडिया रैंक व स्कोर कार्ड प्राप्त करें।
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 space-y-1.5">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            BMB Educom सर्टिफिकेशन
          </h4>
          <p className="text-neutral-400 leading-relaxed">
            क्विज़ पूरा करने वाले प्रतिभागियों को आधिकारिक BMB Educom AI सर्टिफिकेशन और स्पेशल स्कॉलरशिप दी जाएगी।
          </p>
        </div>
      </div>
    </div>
  );
};
