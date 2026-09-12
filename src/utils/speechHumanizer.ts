/**
 * Speech Humanizer & Realistic Hindi Phonetics Engine
 * Cleans punctuation, handles English-Hindi loan words, inserts micro-breathing pauses,
 * and ensures 100% realistic, natural human female voice narration.
 */

// Comprehensive phonetic map for natural Hindi pronunciation
const PHONETIC_MAP: Array<[RegExp, string]> = [
  // Brand & Platform Names
  [/\bBMB\s+Educom\b/gi, "बी.एम.बी. एडुकॉम"],
  [/\bBMB\b/gi, "बी.एम.बी."],
  [/\bEducom\b/gi, "एडुकॉम"],
  
  // AI Tech Terms & Acronyms
  [/\bAI\b/g, "ए.आई."],
  [/\bएआई\b/g, "ए.आई."],
  [/\bANI\b/g, "नैरो ए.आई."],
  [/\bAGI\b/g, "आर्टिफिशियल जनरल इंटेलिजेंस"],
  [/\bASI\b/g, "आर्टिफिशियल सुपर इंटेलिजेंस"],
  [/\bLLMs?\b/gi, "लार्ज लैंग्वेज मॉडल्स"],
  [/\bNLP\b/gi, "नेचुरल लैंग्वेज प्रोसेसिंग"],
  [/\bRPA\b/gi, "रोबोटिक प्रोसेस ऑटोमेशन"],
  [/\bROI\b/gi, "रिटर्न ऑन इन्वेस्टमेंट"],
  [/\bAPI\b/gi, "ए.पी.आई."],
  [/\bAPIs\b/gi, "ए.पी.आई."],
  [/\bHUD\b/gi, "हेड्स अप डिस्प्ले"],
  [/\bVFX\b/gi, "विजुअल इफेक्ट्स"],
  [/\bCRM\b/gi, "सी.आर.एम."],
  [/\bQA\b/gi, "क्वालिटी अश्योरेंस"],
  [/\bChatGPT\b/gi, "चैट जी.पी.टी."],
  [/\bGPT-4\b/gi, "जी.पी.टी. फोर"],
  [/\bGPT\b/gi, "जी.पी.टी."],
  [/\bPrompt\b/gi, "प्रॉम्प्ट"],
  [/\bPrompts\b/gi, "प्रॉम्प्ट्स"],
  [/\bMachine Learning\b/gi, "मशीन लर्निंग"],
  [/\bDeep Learning\b/gi, "डीप लर्निंग"],
  [/\bComputer Vision\b/gi, "कंप्यूटर विज़न"],
  [/\bData Science\b/gi, "डेटा साइंस"],
  [/\bNeural Networks?\b/gi, "न्यूरल नेटवर्क्स"],
  [/\bUpwork\b/gi, "अपवर्क"],
  [/\bFiverr\b/gi, "फाइवर"],
  [/\b2D\b/gi, "टू-डी"],
  [/\b3D\b/gi, "थ्री-डी"],
  [/\b24x7\b/gi, "चौबीसों घंटे"],
  [/\b24\/7\b/gi, "चौबीसों घंटे"],
  [/\b10th\b/gi, "दसवीं"],
  [/\b12th\b/gi, "बारहवीं"],

  // Punctuation & Speech Flow Humanization (avoids robotic stuttering)
  [/—/g, ", "],
  [/–/g, ", "],
  [/\//g, " अथवा "],
  [/&/g, " और "],
  [/\+/g, " और "],
  [/\(\s*What is Artificial Intelligence\?\s*\)/gi, ""],
  [/\(\s*How AI Works\s*\)/gi, ""],
  [/\(\s*Narrow, General & Super\s*\)/gi, ""],
  [/\(\s*NLP\s*\)/gi, ""],
  [/\(\s*RPA\s*\)/gi, ""],
  [/\(\s*2D & 3D एनिमेशन\s*\)/gi, ""],
  [/\(([^)]+)\)/g, ", $1, "], // Convert brackets into natural orator pauses
  [/\s{2,}/g, " "] // Clean extra whitespace
];

/**
 * Transforms raw text into realistic, clear, humanized Hindi speech
 */
export function humanizeHindiSpeech(rawText: string): string {
  if (!rawText) return "";
  let text = rawText;

  for (const [pattern, replacement] of PHONETIC_MAP) {
    text = text.replace(pattern, replacement);
  }

  // Remove markdown symbols and quotes that confuse speech synthesizers
  text = text
    .replace(/[#*_~`]/g, "")
    .replace(/[""']/g, "")
    .replace(/:\s*/g, ", ")
    .replace(/;\s*/g, ", ")
    .replace(/\.{2,}/g, ".")
    .trim();

  return text;
}

/**
 * Finds the most realistic natural female Hindi voice available
 */
export function findBestFemaleHindiVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // 1. Specific top-tier premium neural female Hindi voices
  const topFemaleHindiNames = [
    "swara", // Microsoft Swara Online (Natural) - Hindi
    "heera", // Microsoft Heera
    "kalpana", // Microsoft Kalpana
    "lekha", // Apple macOS/iOS Hindi Female
    "google हिन्दी", // Chrome Google Hindi (Female)
    "google hindi",
    "kavya",
    "aditi",
    "kajal",
    "veena"
  ];

  for (const name of topFemaleHindiNames) {
    const found = voices.find(v => 
      (v.lang.toLowerCase().includes("hi") || v.lang.toLowerCase().includes("in")) &&
      v.name.toLowerCase().includes(name)
    );
    if (found) return found;
  }

  // 2. Any Hindi female voice
  const femaleHindi = voices.find(v => 
    v.lang.toLowerCase().startsWith("hi") && 
    (v.name.toLowerCase().includes("female") || 
     v.name.toLowerCase().includes("woman") || 
     (!v.name.toLowerCase().includes("male") && !v.name.toLowerCase().includes("hemant") && !v.name.toLowerCase().includes("madhav")))
  );
  if (femaleHindi) return femaleHindi;

  // 3. Any available Hindi voice
  const anyHindi = voices.find(v => v.lang.toLowerCase().startsWith("hi") || v.name.toLowerCase().includes("hindi"));
  if (anyHindi) return anyHindi;

  // 4. Indian English female voice fallback
  const indianFemale = voices.find(v => 
    (v.lang.toLowerCase().includes("en-in") || v.lang.toLowerCase().includes("en_in")) &&
    (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("neerja") || v.name.toLowerCase().includes("heera") || v.name.toLowerCase().includes("priya"))
  );
  if (indianFemale) return indianFemale;

  return voices[0] || null;
}
