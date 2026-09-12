import { ScholarshipQuestion, SCHOLARSHIP_20_QUESTIONS } from "./scholarship-question-seed";
import { SEED_QUESTION_BANK } from "./question-bank-seed";

export interface ScholarshipAttemptQuestion {
  id: string;
  order: number;
  question: string;
  options: [string, string, string, string];
  correctOption: number;
  explanation: string;
  topic: string;
}

// Additional high-value, modern AI questions covering real-world tools, LLMs, Computer Vision, Agents & Prompting
const ADDITIONAL_AI_QUESTIONS: Omit<ScholarshipAttemptQuestion, "order">[] = [
  {
    id: "sq-add-01",
    question: "Midjourney, DALL-E 3 और Stable Diffusion किस प्रकार के AI मॉडल हैं? (What type of AI models are Midjourney, DALL-E 3, and Stable Diffusion?)",
    options: [
      "Text-to-Image Diffusion Models",
      "Spreadsheet Accounting Software",
      "Network Packet Sniffers",
      "Relational Database Engines"
    ],
    correctOption: 0,
    explanation: "ये सभी Text-to-Image Diffusion मॉडल्स हैं जो टेक्स्ट प्रॉम्प्ट से उच्च गुणवत्ता वाली डिजिटल छवियां बनाते हैं।",
    topic: "Computer Vision & Generative AI"
  },
  {
    id: "sq-add-02",
    question: "OpenAI Sora और Runway Gen-2 किस तकनीक में क्रांति ला रहे हैं? (In which domain are Sora and Runway Gen-2 revolutionizing?)",
    options: [
      "Text-to-Video Generation",
      "Optical Fiber Splicing",
      "Hardware SMPS Cooling",
      "Printer Ink Refilling"
    ],
    correctOption: 0,
    explanation: "OpenAI Sora और Runway Gen-2 टेक्स्ट निर्देश से सिनेमैटिक हाई-डेफिनिशन वीडियो जनरेट करने वाले अत्याधुनिक AI मॉडल हैं।",
    topic: "Video AI & Multimodal"
  },
  {
    id: "sq-add-03",
    question: "AI में 'RAG' (Retrieval-Augmented Generation) का प्राथमिक कार्य क्या है?",
    options: [
      "LLM को बाहरी प्रमाणित डेटाबेस या दस्तावेजों से जोड़कर सटीक व अप-टू-डेट जानकारी देना",
      "कंप्यूटर की स्क्रीन को साफ करना",
      "सॉफ्टवेयर की लाइसेंस की एक्सपायर करना",
      "हार्ड ड्राइव को डीफ्रैगमेंट करना"
    ],
    correctOption: 0,
    explanation: "RAG तकनीक LLMs को अपने आंतरिक ज्ञान के अलावा कंपनी के कस्टम दस्तावेजों या लाइव डेटाबेस से सर्च करके सटीक उत्तर देने की सुविधा देती है।",
    topic: "LLMs & Architecture"
  },
  {
    id: "sq-add-04",
    question: "AI में 'Vector Database' (जैसे Pinecone, Chroma, Milvus) का क्या महत्व है?",
    options: [
      "टेक्स्ट और इमेजेस के हाई-डायमेंशनल एम्बेडिंग्स (Embeddings) को स्टोर और सिमिलैरिटी सर्च करना",
      "केवल एक्सेल फाइल्स को पीडीएफ में बदलना",
      "कंप्यूटर का पासवर्ड रिकवर करना",
      "प्रिंटर के स्पूलर को रीसेट करना"
    ],
    correctOption: 0,
    explanation: "Vector Databases एम्बेडिंग वैक्टर्स को स्टोर करते हैं जिससे सिमेंटिक (अर्थ-आधारित) सिमिलैरिटी सर्च तुरंत की जा सकती है।",
    topic: "Vector AI & Embeddings"
  },
  {
    id: "sq-add-05",
    question: "Prompt Engineering में 'Zero-Shot Prompting' का क्या अर्थ है?",
    options: [
      "AI को बिना कोई पूर्व उदाहरण (Examples) दिए सीधे कार्य करने का निर्देश देना",
      "AI को लगातार 100 उदाहरण देना",
      "कंप्यूटर को रिस्टार्ट करना",
      "प्रॉम्प्ट में केवल संख्याएं टाइप करना"
    ],
    correctOption: 0,
    explanation: "Zero-shot prompting में मॉडल को बिना किसी उदाहरण के सीधे सवाल या टास्क दिया जाता है और वह अपने प्री-ट्रेन्ड ज्ञान से उत्तर देता है।",
    topic: "Prompt Engineering"
  },
  {
    id: "sq-add-06",
    question: "AI में 'Fine-Tuning' का क्या अर्थ होता है? (What does Fine-Tuning mean in AI?)",
    options: [
      "पहले से प्रशिक्षित बेस मॉडल (Base Model) को किसी विशिष्ट डोमेन डेटा पर और अधिक ट्रेन करना",
      "मॉनिटर की ब्राइटनेस बढ़ाना",
      "सॉफ्टवेयर को अनइंस्टॉल करना",
      "कंप्यूटर का पंखा साफ करना"
    ],
    correctOption: 0,
    explanation: "Fine-tuning के द्वारा किसी जनरल LLM (जैसे Llama, GPT) को मेडिकल, लीगल या विशिष्ट बिज़नेस टास्क के लिए कस्टमाइज किया जाता है।",
    topic: "Model Training & Customization"
  },
  {
    id: "sq-add-07",
    question: "Perplexity AI और Google Search AI Overviews किस लिए प्रसिद्ध हैं?",
    options: [
      "रियल-टाइम वेब सोर्सेज से उद्धृत (Citations के साथ) AI पावर्ड उत्तर देने के लिए",
      "सिर्फ गेम खेलने के लिए",
      "कंप्यूटर की रैम बढ़ाने के लिए",
      "हार्ड ड्राइव को फॉर्मेट करने के लिए"
    ],
    correctOption: 0,
    explanation: "Perplexity AI वेब को रियल-टाइम स्कैन करके स्रोतों के लिंक (Citations) के साथ संक्षिप्त सटीक उत्तर प्रस्तुत करता है।",
    topic: "AI Search & Research"
  },
  {
    id: "sq-add-08",
    question: "Cursor, GitHub Copilot और Replit किस क्षेत्र में AI का उपयोग करते हैं?",
    options: [
      "AI कोड जेनरेशन, ऑटोकम्प्लीट और डिबगिंग (Software Engineering)",
      "ऑडियो मिक्सिंग और डीजे साउंड",
      "हार्डवेयर वायर स्ट्रिपिंग",
      "प्रिंटर पेपर जाम ठीक करना"
    ],
    correctOption: 0,
    explanation: "GitHub Copilot और Cursor कोड लिखने, गलतियां खोजने और पूरे सॉफ्टवेयर को AI द्वारा विकसित करने में डेवलपर्स की मदद करते हैं।",
    topic: "AI Coding & Development"
  },
  {
    id: "sq-add-09",
    question: "ElevenLabs तकनीक का उपयोग मुख्य रूप से किस काम के लिए किया जाता है?",
    options: [
      "हाई-क्वालिटी AI वॉयस क्लोनिंग और Text-to-Speech",
      "3D मॉडलिंग और ग्राफिक कार्ड रिपेयर",
      "नेटवर्क आईपी एड्रेस कॉन्फ़िगरेशन",
      "मदरबोर्ड सोल्डरिंग"
    ],
    correctOption: 0,
    explanation: "ElevenLabs दुनिया की सबसे सटीक और स्वाभाविक लगने वाली AI वॉयस जनरेशन और वॉइस क्लोनिंग प्लेटफॉर्म है।",
    topic: "Audio AI & Speech"
  },
  {
    id: "sq-add-10",
    question: "OpenAI का 'Whisper' मॉडल किस कार्य के लिए बनाया गया है?",
    options: [
      "बहुभाषी ऑटोमैटिक स्पीच रिकॉग्निशन (Speech-to-Text Transcription)",
      "इमेज का बैकग्राउंड रिमूव करना",
      "पीडीएफ कंप्रेस करना",
      "वाईफाई का पासवर्ड हैक करना"
    ],
    correctOption: 0,
    explanation: "Whisper एक अत्याधुनिक ओपन-सोर्स स्पीच-टू-टेक्स्ट मॉडल है जो हिंदी, अंग्रेजी समेत दर्जनों भाषाओं की आवाज़ को तुरंत टेक्स्ट में बदलता है।",
    topic: "Audio AI & Speech"
  },
  {
    id: "sq-add-11",
    question: "AI में 'Hallucination' (मृगतृष्णा) से क्या आशय है? (What is AI Hallucination?)",
    options: [
      "जब AI मॉडल आत्मविश्वास के साथ मनगढ़ंत या गलत तथ्य प्रस्तुत करता है",
      "कंप्यूटर स्क्रीन का हिलना",
      "कीबोर्ड की चाबियों का लॉक होना",
      "इंटरनेट की स्पीड का 0 हो जाना"
    ],
    correctOption: 0,
    explanation: "Hallucination तब होता है जब कोई LLM ऐसे तथ्य बनावटी रूप से उत्पन्न करता है जो वास्तविकता में सत्य नहीं होते परंतु भाषा में सच जैसे लगते हैं।",
    topic: "AI Ethics & Limitations"
  },
  {
    id: "sq-add-12",
    question: "AI में 'Token' का क्या अर्थ है? (What is a Token in LLMs?)",
    options: [
      "टेक्स्ट का छोटा बुनियादी टुकड़ा (सामान्यतः 3-4 अक्षर या एक शब्द) जिसे LLM प्रोसेस करता है",
      "मेट्रो ट्रेन का सिक्का",
      "कंप्यूटर का पावर बटन",
      "एक प्रकार का मॉनिटर केबल"
    ],
    correctOption: 0,
    explanation: "LLMs शब्दों को सीधे नहीं बल्कि टोकन्स (टुकड़ों) के रूप में प्रोसेस करते हैं। लगभग 75 शब्द 100 टोकन्स के बराबर होते हैं।",
    topic: "LLMs & Architecture"
  },
  {
    id: "sq-add-13",
    question: "Claude 3.5 Sonnet का 'Artifacts' फीचर उपयोगकर्ताओं को क्या करने देता है?",
    options: [
      "इंटरैक्टिव वेब कोड, React ऐप्स, डॉक्स व SVG को अलग विंडो में लाइव प्रीव्यू और एडिट करना",
      "कंप्यूटर का हार्ड डिस्क बैकअप लेना",
      "प्रिंटर से 3D मॉडल प्रिंट करना",
      "सॉफ्टवेयर डिलीट करना"
    ],
    correctOption: 0,
    explanation: "Anthropic Claude के Artifacts फीचर से कोड, डायग्राम्स और वेब ऐप्स को चैट के बगल में सीधे इंटरैक्टिव रूप से देखा और इस्तेमाल किया जा सकता है।",
    topic: "AI Tools & Workflows"
  },
  {
    id: "sq-add-14",
    question: "AI 'Temperature' हाइपरपैरामीटर क्या नियंत्रित करता है?",
    options: [
      "AI आउटपुट की रचनात्मकता (Creativity/Randomness) बनाम पूर्वानुमेयता (Predictability)",
      "कंप्यूटर के सीपीयू का वास्तविक तापमान (डिग्री सेल्सियस)",
      "कमरे का एयर कंडीशनर",
      "स्क्रीन की चमक"
    ],
    correctOption: 0,
    explanation: "Temperature 0 होने पर उत्तर अत्यधिक स्थिर और सटीक होता है, जबकि 0.7-1.0 होने पर उत्तर अधिक रचनात्मक और कल्पनाशील होता है।",
    topic: "Model Hyperparameters"
  },
  {
    id: "sq-add-15",
    question: "ChatGPT में 'System Prompt' (Custom Instructions) का मुख्य उद्देश्य क्या होता है?",
    options: [
      "AI के व्यक्तित्व, बोलने का लहज़ा, नियम और सीमाएं पहले से तय करना",
      "कंप्यूटर की विंडो को बंद करना",
      "नया पासवर्ड जनरेट करना",
      "हार्ड ड्राइव को सुरक्षित रखना"
    ],
    correctOption: 0,
    explanation: "System Prompt मॉडल को बताता है कि उसे किस भूमिका (जैसे सीनियर कोडिंग मेंटर, कैरियर काउंसलर) में और किस शैली में जवाब देना है।",
    topic: "Prompt Engineering"
  },
  {
    id: "sq-add-16",
    question: "DeepSeek-V3 और DeepSeek-R1 किस विशेष तकनीक के लिए दुनिया भर में चर्चित हुए?",
    options: [
      "ओपन-वेट्स रीज़निंग मॉडल्स और कम लागत में अत्यधिक कुशल Mixture of Experts (MoE)",
      "हार्डवेयर चिप निर्माण",
      "स्मार्टफोन कैमरा लेंस",
      "एंटीवायरस सॉफ्टवेयर"
    ],
    correctOption: 0,
    explanation: "DeepSeek ने कम कंप्यूटेशनल लागत और ओपन-वेट्स आर्किटेक्चर के साथ शीर्ष स्तर की गणितीय व कोडिंग रीज़निंग क्षमता हासिल की।",
    topic: "Open Source AI"
  },
  {
    id: "sq-add-17",
    question: "Zapier AI Actions और Make.com का उपयोग AI के साथ किसलिए किया जाता है?",
    options: [
      "हजारों अलग-अलग ऐप्स और टूल्स के बीच ऑटोमेशन वर्कफ़्लो (No-Code Workflows) बनाने के लिए",
      "ऑपरेटिंग सिस्टम बदलने के लिए",
      "कंप्यूटर की साउंड रिकॉर्ड करने के लिए",
      "इंटरनेट वायर रिपेयर करने के लिए"
    ],
    correctOption: 0,
    explanation: "Zapier और Make.com AI को जीमेल, स्लैक, व्हाट्सएप और गूगल शीट्स जैसे टूल्स से जोड़कर स्वचालित बिज़नेस पाइपलाइन बनाते हैं।",
    topic: "AI Automation & No-Code"
  },
  {
    id: "sq-add-18",
    question: "Autonomous AI Agent जैसे AutoGPT या Devin का क्या काम होता है?",
    options: [
      "बिना बार-बार मानवीय हस्तक्षेप के स्वयं स्टेप्स प्लान करके जटिल कार्य पूरे करना",
      "कंप्यूटर का पंखा बंद करना",
      "सिर्फ टाइपिंग सिखाना",
      "माउस का कर्सर छुपाना"
    ],
    correctOption: 0,
    explanation: "AI एजेंट्स लक्ष्य प्राप्त करने के लिए खुद सोचते हैं, टूल्स चलाते हैं, कोड लिखते हैं, एरर फिक्स करते हैं और अंततः कार्य पूरा करते हैं।",
    topic: "AI Agents"
  },
  {
    id: "sq-add-19",
    question: "Deepfake (डीपफेक) तकनीक में किस AI आर्किटेक्चर का व्यापक उपयोग होता है?",
    options: [
      "GANs (Generative Adversarial Networks) और Diffusion Models",
      "BIOS Firmware",
      "FAT32 File System",
      "TCP/IP Router Protocol"
    ],
    correctOption: 0,
    explanation: "GANs में दो न्यूरल नेटवर्क (Generator व Discriminator) आपस में प्रतिस्पर्धा करके वास्तविक दिखने वाले सिंथेटिक चेहरे व आवाज़ बनाते हैं।",
    topic: "Deep Learning & Ethics"
  },
  {
    id: "sq-add-20",
    question: "छात्रों और प्रोफेशनल्स के लिए 2026 में AI साक्षरता (AI Literacy) क्यों अनिवार्य है?",
    options: [
      "क्योंकि AI टूल्स का प्रभावी उपयोग हर उद्योग में उत्पादकता, विश्लेषण और नए कैरियर अवसरों को 10x बढ़ाता है",
      "क्योंकि इसके बिना कंप्यूटर चालू नहीं होता",
      "ताकि केवल गेम्स खेले जा सकें",
      "ताकि इंटरनेट का बिल कम आए"
    ],
    correctOption: 0,
    explanation: "AI साक्षरता भविष्य के रोजगार, उद्यमिता और समस्याओं के समाधान में मानव क्षमता को अद्वितीय गति व गुणवत्ता प्रदान करती है।",
    topic: "AI Career & Industry"
  }
];

// Helper to assemble full question pool
function buildMasterQuestionPool(): ScholarshipAttemptQuestion[] {
  const pool: ScholarshipAttemptQuestion[] = [];
  let nextOrder = 1;

  // 1. Seed Scholarship 20 Questions
  for (const q of SCHOLARSHIP_20_QUESTIONS) {
    pool.push({
      id: q.id,
      order: nextOrder++,
      question: q.question,
      options: [...q.options] as [string, string, string, string],
      correctOption: q.correctOption,
      explanation: q.explanation,
      topic: q.topic || "AI Fundamentals"
    });
  }

  // 2. Additional Modern AI Questions
  for (const q of ADDITIONAL_AI_QUESTIONS) {
    pool.push({
      id: q.id,
      order: nextOrder++,
      question: q.question,
      options: [...q.options] as [string, string, string, string],
      correctOption: q.correctOption,
      explanation: q.explanation,
      topic: q.topic
    });
  }

  // 3. Question Bank Seed Items (105 items)
  for (const item of SEED_QUESTION_BANK) {
    if (item.options && item.options.length >= 4) {
      const opts = item.options.slice(0, 4) as [string, string, string, string];
      pool.push({
        id: `qb-${item.id}`,
        order: nextOrder++,
        question: item.question,
        options: opts,
        correctOption: item.correct_option >= 0 && item.correct_option < 4 ? item.correct_option : 0,
        explanation: `सही विकल्प: '${opts[item.correct_option] || opts[0]}'। यह ${item.category} का महत्वपूर्ण सिद्धांत है।`,
        topic: item.category || "AI General"
      });
    }
  }

  return pool;
}

export const MASTER_SCHOLARSHIP_POOL: ScholarshipAttemptQuestion[] = buildMasterQuestionPool();

/**
 * Shuffles array in place with Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Returns a randomized set of 20 unique questions for a specific student attempt.
 * Also randomizes the 4 options order and recalculates correctOption accordingly
 * so that no two students get the exact same questions or options ordering!
 */
export function generateRandomizedScholarshipQuestions(count: number = 20): ScholarshipAttemptQuestion[] {
  // 1. Shuffle the entire 150+ master pool
  const shuffledPool = shuffleArray(MASTER_SCHOLARSHIP_POOL);
  
  // 2. Pick the requested number of unique questions
  const selected = shuffledPool.slice(0, Math.min(count, shuffledPool.length));

  // 3. For each selected question, shuffle the 4 options and update correctOption
  return selected.map((q, idx) => {
    const originalCorrectText = q.options[q.correctOption];
    
    // Shuffle options
    const shuffledOptions = shuffleArray(q.options) as [string, string, string, string];
    const newCorrectIndex = shuffledOptions.findIndex(opt => opt === originalCorrectText);

    return {
      id: q.id,
      order: idx + 1,
      question: q.question,
      options: shuffledOptions,
      correctOption: newCorrectIndex >= 0 ? newCorrectIndex : 0,
      explanation: q.explanation,
      topic: q.topic
    };
  });
}
