// Scholarship Question Bank — 20 AI-focused questions for the 10-minute scholarship quiz.
// Prize structure: Rank 1 = ₹1000, Rank 2 = ₹500, Rank 3 = ₹200, Ranks 4-10 = attractive gift.
// All questions are in Hindi (Devanagari), 4-option MCQs, AI-themed.
// Difficulty calibrated higher than the 2-min seminar quiz (mix of medium/hard).

export interface ScholarshipQuestionSeed {
  id: string;
  question: string;
  options: string[]; // exactly 4 options
  correct_option: number; // 0-3
  category: string;
  difficulty: "easy" | "medium" | "hard";
  explanation?: string;
}

export const SEED_SCHOLARSHIP_QUESTION_BANK: ScholarshipQuestionSeed[] = [
  {
    id: "sq-001",
    question: "आर्टिफिशियल इंटेलिजेंस (AI) का सबसे सटीक सरल परिचय क्या है?",
    options: [
      "ऐसी मशीनें जो केवल गणितीय गणनाएँ तेज़ी से करती हैं",
      "ऐसे कंप्यूटर सिस्टम जो इंसानों जैसी सोच, सीखने और निर्णय लेने की क्षमता दिखाते हैं",
      "केवल रोबोट बनाने वाली तकनीक",
      "इंटरनेट पर डेटा स्टोर करने की प्रक्रिया"
    ],
    correct_option: 1,
    category: "AI Fundamentals",
    difficulty: "easy",
    explanation: "AI वह कंप्यूटर सिस्टम है जो इंसानी सोच, सीखने और निर्णय क्षमता का अनुकरण करता है।"
  },
  {
    id: "sq-002",
    question: "मशीन लर्निंग (Machine Learning) और पारंपरिक प्रोग्रामिंग के बीच मुख्य अंतर क्या है?",
    options: [
      "ML तेज़ गणना करता है, प्रोग्रामिंग धीमी",
      "ML में सिस्टम डेटा से खुद सीखता है, प्रोग्रामिंग में नियम हाथ से लिखने पड़ते हैं",
      "ML सिर्फ इंटरनेट पर चलता है, प्रोग्रामिंग ऑफ़लाइन",
      "दोनों एक ही चीज़ हैं, कोई अंतर नहीं"
    ],
    correct_option: 1,
    category: "Machine Learning",
    difficulty: "medium",
    explanation: "ML में एल्गोरिथ्म डेटा से पैटर्न सीखता है; पारंपरिक प्रोग्रामिंग में नियम कोड में लिखे जाते हैं।"
  },
  {
    id: "sq-003",
    question: "न्यूरल नेटवर्क (Neural Network) किस जीव विज्ञान संरचना से प्रेरित है?",
    options: [
      "मानव मस्तिष्क के न्यूरॉन्स से",
      "पौधों की जड़ों से",
      "मधुमक्खी के छत्ते से",
      "मछली के पंखों से"
    ],
    correct_option: 0,
    category: "Deep Learning",
    difficulty: "easy",
    explanation: "न्यूरल नेटवर्क मानव मस्तिष्क के न्यूरॉन्स और उनके कनेक्शन से प्रेरित है।"
  },
  {
    id: "sq-004",
    question: "डीप लर्निंग (Deep Learning) और मशीन लर्निंग में मुख्य अंतर क्या है?",
    options: [
      "DL इंटरनेट पर चलता है, ML ऑफ़लाइन",
      "DL में कई हिडन लेयर्स वाले न्यूरल नेटवर्क होते हैं; ML में अक्सर शैलो एल्गोरिथ्म",
      "DL सिर्फ रोबोटिक्स में इस्तेमाल होता है",
      "दोनों बिल्कुल एक जैसे हैं"
    ],
    correct_option: 1,
    category: "Deep Learning",
    difficulty: "medium",
    explanation: "DL मल्टी-लेयर न्यूरल नेटवर्क का उपयोग करता है; पारंपरिक ML अक्सर शैलो एल्गोरिथ्म जैसे डिसीजन ट्री का उपयोग करता है।"
  },
  {
    id: "sq-005",
    question: "जनरेटिव AI (Generative AI) किस प्रकार का आउटपुट बना सकता है?",
    options: [
      "केवल संख्यात्मक रिपोर्ट",
      "टेक्स्ट, इमेज, ऑडियो, और वीडियो जैसे नए डेटा का सृजन",
      "केवल डेटाबेस क्वेरीज़",
      "सिर्फ हार्डवेयर कंट्रोल सिग्नल"
    ],
    correct_option: 1,
    category: "Generative AI",
    difficulty: "easy",
    explanation: "जनरेटिव AI टेक्स्ट, इमेज, ऑडियो, वीडियो जैसे नए डेटा का सृजन कर सकता है (जैसे ChatGPT, DALL-E)।"
  },
  {
    id: "sq-006",
    question: "प्रॉम्प्ट इंजीनियरिंग (Prompt Engineering) का मुख्य उद्देश्य क्या है?",
    options: [
      "कंप्यूटर हार्डवेयर को तेज़ करना",
      "AI मॉडल से बेहतर और अधिक सटीक उत्तर प्राप्त करने के लिए प्रश्नों को सावधानी से तैयार करना",
      "वेबसाइट का SEO बेहतर बनाना",
      "डेटाबेस स्कीमा डिज़ाइन करना"
    ],
    correct_option: 1,
    category: "Prompt Engineering",
    difficulty: "medium",
    explanation: "प्रॉम्प्ट इंजीनियरिंग AI मॉडल से अधिक सटीक और उपयोगी उत्तर पाने के लिए प्रश्नों की रचना करती है।"
  },
  {
    id: "sq-007",
    question: "LLM का पूर्ण रूप क्या है और यह मुख्य रूप से क्या करता है?",
    options: [
      "Large Language Model — बड़े टेक्स्ट डेटा पर सिखाया गया AI जो भाषा समझ और उत्पन्न कर सकता है",
      "Long Lasting Memory — लंबी याददाश्त वाला रोबोट",
      "Local Logic Module — स्थानीय तर्क प्रणाली",
      "Layered Learning Method — मल्टी-लेयर शिक्षण विधि"
    ],
    correct_option: 0,
    category: "Generative AI",
    difficulty: "medium",
    explanation: "LLM = Large Language Model, जो बड़े टेक्स्ट कॉर्पस पर ट्रेन होता है (जैसे GPT)।"
  },
  {
    id: "sq-008",
    question: "सुपरवाइज़्ड लर्निंग (Supervised Learning) में मॉडल को कैसे सिखाया जाता है?",
    options: [
      "बिना किसी लेबल वाले डेटा से",
      "लेबल किए गए डेटा (input-output जोड़े) से, जहाँ सही उत्तर पहले से दिए होते हैं",
      "सिर्फ इंटरनेट ब्राउज़िंग से",
      "रोबोट के साथ खेलने से"
    ],
    correct_option:  1,
    category: "Machine Learning",
    difficulty: "medium",
    explanation: "Supervised learning में input के साथ सही output लेबल दिया जाता है, मॉडल उनसे पैटर्न सीखता है।"
  },
  {
    id: "sq-009",
    question: "अनसुपरवाइज़्ड लर्निंग (Unsupervised Learning) का मुख्य उपयोग क्या है?",
    options: [
      "नियमित रूप से ईमेल भेजना",
      "बिना लेबल वाले डेटा में छिपे पैटर्न और समूह (clusters) खोजना",
      "वेबसाइट की गति बढ़ाना",
      "इंटरनेट से डेटा डिलीट करना"
    ],
    correct_option: 1,
    category: "Machine Learning",
    difficulty: "medium",
    explanation: "Unsupervised learning बिना लेबल वाले डेटा से पैटर्न व क्लस्टर ढूंढता है (जैसे कस्टमर सेगमेंटेशन)।"
  },
  {
    id: "sq-010",
    question: "रीइन्फोर्समेंट लर्निंग (Reinforcement Learning) किस प्रकार सीखती है?",
    options: [
      "लेबल किए गए डेटा से",
      "पुरस्कार और दंड (reward/penalty) के ट्रायल-एंड-एरर से",
      "केवल किताबें पढ़कर",
      "दूसरे कंप्यूटर से डेटा कॉपी करके"
    ],
    correct_option: 1,
    category: "Machine Learning",
    difficulty: "medium",
    explanation: "RL एजेंट पुरस्कार/दंड से ट्रायल-एंड-एरर द्वारा सीखता है (जैसे AlphaGo)।"
  },
  {
    id: "sq-011",
    question: "कंप्यूटर विज़न (Computer Vision) किस कार्य में सक्षम AI शाखा है?",
    options: [
      "केवल टेक्स्ट ट्रांसलेशन",
      "इमेज और वीडियो से जानकारी निकालना व उन्हें समझना",
      "सिर्फ ऑडियो जनरेट करना",
      "हार्डवेयर रिपेयर करना"
    ],
    correct_option: 1,
    category: "Computer Vision",
    difficulty: "easy",
    explanation: "CV इमेज व वीडियो को समझने व विश्लेषण करने में सक्षम है (जैसे फेस रिकग्निशन)।"
  },
  {
    id: "sq-012",
    question: "NLP (Natural Language Processing) का मुख्य अनुप्रयोग क्या है?",
    options: [
      "मशीनों को इंसानी भाषा समझने, बोलने और अनुवाद करने में सक्षम बनाना",
      "केवल वेबसाइट डिज़ाइन करना",
      "डेटाबेस ऑप्टिमाइज़ करना",
      "रोबोट के पहिए घुमाना"
    ],
    correct_option: 0,
    category: "NLP",
    difficulty: "easy",
    explanation: "NLP इंसानी भाषा को समझने, बोलने और ट्रांसलेट करने में सक्षम बनाता है।"
  },
  {
    id: "sq-013",
    question: "ChatGPT किस कंपनी द्वारा विकसित किया गया है और यह किस श्रेणी का AI है?",
    options: [
      "Google द्वारा — सर्च इंजन AI",
      "OpenAI द्वारा — जनरेटिव LLM",
      "Microsoft द्वारा — ऑपरेटिंग सिस्टम AI",
      "Apple द्वारा — वॉइस असिस्टेंट"
    ],
    correct_option: 1,
    category: "Generative AI",
    difficulty: "easy",
    explanation: "ChatGPT OpenAI द्वारा विकसित एक जनरेटिव LLM है।"
  },
  {
    id: "sq-014",
    question: "AI मॉडल के 'हैल्यूसिनेशन' (Hallucination) का क्या अर्थ है?",
    options: [
      "मॉडल का वीडियो देखना",
      "मॉडल का गलत या काल्पनिक जानकारी आत्मविश्वास से प्रस्तुत करना",
      "मॉडल का इंटरनेट से डिस्कनेक्ट होना",
      "मॉडल का सिर्फ हार्डवेयर में चलना"
    ],
    correct_option: 1,
    category: "AI Ethics",
    difficulty: "hard",
    explanation: "Hallucination = AI गलत या काल्पनिक जानकारी को सही के रूप में प्रस्तुत करता है।"
  },
  {
    id: "sq-015",
    question: "AI के नैतिक उपयोग (AI Ethics) में कौन-सा मुद्दा सबसे अहम है?",
    options: [
      "मॉडल की गति बढ़ाना",
      "पूर्वाग्रह (bias), गोपनीयता, पारदर्शिता और जवाबदेही का संतुलन",
      "मॉडल का रंग बदलना",
      "सिर्फ नए फीचर जोड़ना"
    ],
    correct_option: 1,
    category: "AI Ethics",
    difficulty: "hard",
    explanation: "AI Ethics में bias, privacy, transparency व accountability सबसे अहम मुद्दे हैं।"
  },
  {
    id: "sq-016",
    question: "AI का उपयोग किस क्षेत्र में 'डायग्नोस्टिक इमेजिंग' के लिए किया जाता है?",
    options: [
      "स्वास्थ्य देखभाल (Healthcare) — X-ray/MRI विश्लेषण",
      "खेल (Sports) — स्कोर गणना",
      "फैशन — कपड़े डिज़ाइन करना",
      "कृषि — बीज गिनना"
    ],
    correct_option: 0,
    category: "AI in Healthcare",
    difficulty: "medium",
    explanation: "AI स्वास्थ्य क्षेत्र में X-ray/MRI जैसी डायग्नोस्टिक इमेजिंग के विश्लेषण में उपयोगी है।"
  },
  {
    id: "sq-017",
    question: "स्मार्ट असिस्टेंट (जैसे Alexa, Siri) किस तकनीकों का मिश्रण उपयोग करते हैं?",
    options: [
      "केवल गणित",
      "NLP, स्पीच रिकग्निशन, और मशीन लर्निंग",
      "केवल वेब ब्राउज़िंग",
      "केवल हार्डवेयर सेंसर"
    ],
    correct_option: 1,
    category: "Conversational AI",
    difficulty: "medium",
    explanation: "Alexa/Siri NLP + speech recognition + ML का मिश्रण उपयोग करते हैं।"
  },
  {
    id: "sq-018",
    question: "AI में 'ट्रेनिंग डेटा' (Training Data) की गुणवत्ता क्यों महत्वपूर्ण है?",
    options: [
      "इससे मॉडल का रंग तय होता है",
      "मॉडल की सटीकता और निष्पक्षता डेटा की गुणवत्ता पर निर्भर करती है — 'Garbage In, Garbage Out'",
      "इससे मॉडल का आकार बदलता है",
      "डेटा की गुणवत्ता से कोई फर्क नहीं पड़ता"
    ],
    correct_option: 1,
    category: "AI Fundamentals",
    difficulty: "hard",
    explanation: "AI सिद्धांत: Garbage In, Garbage Out — डेटा जैसा, मॉडल वैसा ही परिणाम देगा।"
  },
  {
    id: "sq-019",
    question: "AI का उपयोग करके ऑटोमेशन किस क्षेत्र में सबसे अधिक व्यावसायिक लाभ दिखा रहा है?",
    options: [
      "सिर्फ गेमिंग",
      "कस्टमर सपोर्ट, डेटा एंट्री, कोड जनरेशन और मार्केटिंग जैसे दोहराए जाने वाले कार्य",
      "सिर्फ फिल्म निर्माण",
      "सिर्फ कृषि"
    ],
    correct_option: 1,
    category: "AI in Business",
    difficulty: "medium",
    explanation: "AI ऑटोमेशन दोहराए जाने वाले कार्यों (कस्टमर सपोर्ट, डेटा एंट्री, कोड जनरेशन) में सबसे अधिक लाभ दिखा रहा है।"
  },
  {
    id: "sq-020",
    question: "AI के भविष्य के करियर अवसरों में सबसे अधिक माँग वाला कौन-सा कौशल है?",
    options: [
      "केवल टाइपिंग स्पीड",
      "प्रॉम्प्ट इंजीनियरिंग, ML मॉडलिंग, डेटा एनालिसिस और AI एथिक्स का ज्ञान",
      "केवल वीडियो एडिटिंग",
      "केवल फाइल अपलोड करना"
    ],
    correct_option: 1,
    category: "AI Careers",
    difficulty: "medium",
    explanation: "भविष्य में prompt engineering, ML modeling, data analysis और AI ethics वाले कौशल सबसे अधिक माँग में हैं।"
  }
];
