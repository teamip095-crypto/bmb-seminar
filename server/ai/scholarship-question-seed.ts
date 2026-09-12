export interface ScholarshipQuestion {
  id: string;
  order: number;
  question: string;
  options: [string, string, string, string];
  correctOption: number;
  explanation: string;
  topic: string;
}

export const SCHOLARSHIP_20_QUESTIONS: ScholarshipQuestion[] = [
  {
    id: "sq-01",
    order: 1,
    question: "आर्टिफिशियल इंटेलिजेंस (AI) का मुख्य उद्देश्य क्या है? (What is the primary objective of Artificial Intelligence?)",
    options: [
      "कंप्यूटर को केवल टाइपिंग और प्रिंटिंग सिखाना",
      "मशीनों को मानव की तरह सोचने, सीखने और निर्णय लेने में सक्षम बनाना",
      "इंटरनेट की गति बढ़ाना और डेटा स्टोर करना",
      "हार्डवेयर और चिप्स की मरम्मत करना"
    ],
    correctOption: 1,
    explanation: "AI का मुख्य उद्देश्य ऐसी प्रणालियाँ बनाना है जो मानव बुद्धिमत्ता की तरह तर्क, सीख और स्वायत्त निर्णय ले सकें।",
    topic: "AI Fundamentals"
  },
  {
    id: "sq-02",
    order: 2,
    question: "ChatGPT, Gemini और Claude किस प्रकार के AI मॉडल के उदाहरण हैं? (What type of AI models are ChatGPT, Gemini, and Claude?)",
    options: [
      "Large Language Models (LLMs) / Generative AI",
      "Relational Database Management Systems",
      "Network Operating Systems",
      "Computer Hardware Controllers"
    ],
    correctOption: 0,
    explanation: "ये सभी Large Language Models (LLMs) हैं जो Generative AI के तहत विशाल टेक्स्ट डेटा पर प्रशिक्षित किए जाते हैं।",
    topic: "LLMs & Generative AI"
  },
  {
    id: "sq-03",
    order: 3,
    question: "Prompt Engineering में 'Few-Shot Prompting' का क्या अर्थ होता है?",
    options: [
      "AI को बिना कोई निर्देश दिए केवल एक शब्द भेजना",
      "कंप्यूटर की स्क्रीनशॉट कैप्चर करना",
      "AI को उत्तर देने से पहले 2-3 हल किए गए सटीक उदाहरण (Examples) देना",
      "AI मॉडल को डिलीट करके नया मॉडल बनाना"
    ],
    correctOption: 2,
    explanation: "Few-Shot Prompting में मॉडल को सही दिशा देने के लिए प्रॉम्प्ट के अंदर कुछ इनपुट-आउटपुट उदाहरण दिए जाते हैं।",
    topic: "Prompt Engineering"
  },
  {
    id: "sq-04",
    order: 4,
    question: "जनरेटिव एआई (Generative AI) और पारंपरिक एआई (Discriminative AI) में मुख्य अंतर क्या है?",
    options: [
      "पारंपरिक AI केवल इमेज बनाता है जबकि Generative AI केवल गणित करता है",
      "Generative AI नया कंटेंट (टेक्स्ट, इमेज, कोड) बनाता है, जबकि Discriminative डेटा को वर्गीकृत (Classify) करता है",
      "Generative AI को इंटरनेट की आवश्यकता नहीं होती",
      "दोनों में कोई अंतर नहीं है"
    ],
    correctOption: 1,
    explanation: "Generative AI नया और मौलिक कंटेंट उत्पन्न करता है, जबकि पारम्परिक AI डेटा में क्लासिफिकेशन और प्रेडिक्शन करता है।",
    topic: "Generative AI"
  },
  {
    id: "sq-05",
    order: 5,
    question: "Artificial Neural Network (ANN) की बुनियादी कार्यप्रणाली किस जैविक अंग से प्रेरित है?",
    options: [
      "मानव हृदय की धड़कन (Heart Rhythm)",
      "आंखों की रेटिना केवल",
      "कंप्यूटर का पावर सप्लाई सर्किट",
      "मानव मस्तिष्क के न्यूरॉन्स (Human Brain Neurons)"
    ],
    correctOption: 3,
    explanation: "कृत्रिम न्यूरल नेटवर्क मानव मस्तिष्क के जैविक न्यूरॉन्स और उनके आपसी सिनेप्स कनेक्शन से प्रेरित होकर कार्य करते हैं।",
    topic: "Neural Networks"
  },
  {
    id: "sq-06",
    order: 6,
    question: "डीप लर्निंग और आधुनिक AI मॉडल्स की ट्रेनिंग के लिए GPU (Graphics Processing Unit) का अत्यधिक उपयोग क्यों होता है?",
    options: [
      "क्योंकि GPU केवल वीडियो गेम खेल सकता है",
      "क्योंकि GPU में हजारों समानांतर कोर (Parallel Cores) होते हैं जो मैट्रिक्स गुणा तेजी से करते हैं",
      "क्योंकि GPU में बहुत कम बिजली लगती है",
      "क्योंकि GPU ऑपरेटिंग सिस्टम को बाईपास कर देता है"
    ],
    correctOption: 1,
    explanation: "GPU विशाल मात्रा में समानांतर मैट्रिक्स और टेंसर गणनाएं एक साथ कर सकते हैं, जो न्यूरल नेटवर्क ट्रेनिंग के लिए अनिवार्य हैं।",
    topic: "Hardware & Acceleration"
  },
  {
    id: "sq-07",
    order: 7,
    question: "Natural Language Processing (NLP) में 'Tokenization' प्रक्रिया क्या करती है?",
    options: [
      "कंप्यूटर की मेमोरी को फॉर्मेट करना",
      "पासवर्ड को एन्क्रिप्ट करना",
      "टेक्स्ट को छोटे-छोटे टुकड़ों (शब्दों, उप-शब्दों या वर्णों) में विभाजित करना",
      "कंप्यूटर स्क्रीन पर फॉन्ट बदलना"
    ],
    correctOption: 2,
    explanation: "Tokenization टेक्स्ट को टोकन (Tokens) में तोड़ता है ताकि AI मॉडल उन्हें संख्यात्मक वेक्टर्स में बदलकर समझ सके।",
    topic: "NLP & Tokenization"
  },
  {
    id: "sq-08",
    order: 8,
    question: "Computer Vision में इमेज प्रोसेसिंग और ऑब्जेक्ट डिटेक्शन के लिए कौन सा न्यूरल नेटवर्क सर्वाधिक लोकप्रिय है?",
    options: [
      "Recurrent Neural Network (RNN)",
      "Convolutional Neural Network (CNN)",
      "Decision Tree Classifier",
      "Simple Linear Regression"
    ],
    correctOption: 1,
    explanation: "CNN (कनवोल्यूशनल न्यूरल नेटवर्क) इमेज के स्थानिक पैटर्न (Spatial Features) और किनारों को पहचानने में सर्वश्रेष्ठ माना जाता है।",
    topic: "Computer Vision"
  },
  {
    id: "sq-09",
    order: 9,
    question: "2017 में गूगल द्वारा पेश किए गए 'Transformer' आर्किटेक्चर का सबसे मुख्य घटक कौन सा है?",
    options: [
      "Self-Attention Mechanism ('Attention Is All You Need')",
      "Floppy Disk Cache",
      "Hard Disk Partitioning",
      "CPU Overclocking"
    ],
    correctOption: 0,
    explanation: "ट्रांसफॉर्मर का मूल आधार 'Self-Attention Mechanism' है, जो वाक्यों में शब्दों के आपसी संदर्भ और वजन को समानांतर रूप से समझता है।",
    topic: "Transformer Architecture"
  },
  {
    id: "sq-10",
    order: 10,
    question: "AI शब्दावली में 'Hallucination' (भ्रम) किसे कहा जाता है?",
    options: [
      "जब कंप्यूटर अचानक रीस्टार्ट हो जाता है",
      "जब इंटरनेट की स्पीड बहुत कम हो जाती है",
      "जब AI मॉडल पूर्ण विश्वास के साथ गलत या मनगढ़ंत तथ्य प्रस्तुत करता है",
      "जब AI मॉडल का रंग बदल जाता है"
    ],
    correctOption: 2,
    explanation: "AI Hallucination तब होता है जब एक LLM वास्तविक तथ्यों के बजाय आत्मविश्वास के साथ झूठी या मनगढ़ंत जानकारी उत्पन्न करता है।",
    topic: "AI Limitations & Safety"
  },
  {
    id: "sq-11",
    order: 11,
    question: "RAG (Retrieval-Augmented Generation) तकनीक का मुख्य लाभ क्या है?",
    options: [
      "यह पूरे मॉडल को फिर से स्क्रैच से ट्रेन करती है",
      "यह AI को किसी बाहरी निजी डेटाबेस या डॉक्यूमेंट से ताज़ा व सटीक जानकारी निकालकर उत्तर देने की अनुमति देती है",
      "यह कंप्यूटर का हार्डवेयर बदल देती है",
      "यह केवल ऑडियो फाइल बनाती है"
    ],
    correctOption: 1,
    explanation: "RAG आंतरिक ज्ञान के बजाय विश्वसनीय बाहरी दस्तावेजों से सटीक संदर्भ खोजकर सटीक और अद्यतित उत्तर तैयार करता है।",
    topic: "RAG & Modern Architecture"
  },
  {
    id: "sq-12",
    order: 12,
    question: "Midjourney, DALL-E और Stable Diffusion किस तकनीक पर आधारित इमेज जेनरेशन मॉडल हैं?",
    options: [
      "Spreadsheet Formulations",
      "Relational SQL Tables",
      "FTP File Transfers",
      "Diffusion Models (डिफ्यूजन मॉडल्स)"
    ],
    correctOption: 3,
    explanation: "आधुनिक AI इमेज जनरेटर 'Diffusion Models' का उपयोग करते हैं, जो नॉइज़ (Noise) को धीरे-धीरे हटाकर सुंदर चित्र बनाते हैं।",
    topic: "Image Generation AI"
  },
  {
    id: "sq-13",
    order: 13,
    question: "सुपरवाइज्ड लर्निंग (Supervised Learning) में डेटा का क्या स्वरूप होना अनिवार्य है?",
    options: [
      "डेटा में कोई लेबल या उत्तर नहीं होना चाहिए",
      "डेटा केवल वीडियो फॉर्मेट में होना चाहिए",
      "डेटा में इनपुट के साथ उसका सही लेबल/उत्तर (Labeled Data) होना चाहिए",
      "डेटा को हमेशा हाथ से कागज पर लिखना चाहिए"
    ],
    correctOption: 2,
    explanation: "Supervised Learning में मॉडल को इनपुट फीचर्स के साथ सही आउटपुट लेबल (Ground Truth) देकर ट्रेन किया जाता है।",
    topic: "Machine Learning Types"
  },
  {
    id: "sq-14",
    order: 14,
    question: "RLHF (Reinforcement Learning from Human Feedback) का उपयोग LLM को फाइन-ट्यून करने में क्यों किया जाता है?",
    options: [
      "AI उत्तरों को अधिक मानवीय, सुरक्षित, मददगार और विनम्र बनाने के लिए",
      "कंप्यूटर की बिजली की खपत दोगुनी करने के लिए",
      "AI को इंसानों से झूठ बोलने की कला सिखाने के लिए",
      "केवल गेम्स में ग्राफिक्स बढ़ाने के लिए"
    ],
    correctOption: 0,
    explanation: "RLHF इंसानी फीडबैक के आधार पर AI मॉडल को गाइड करता है ताकि उसके उत्तर सत्य, सुरक्षित और उपयोगकर्ता के अनुकूल हों।",
    topic: "RLHF & Alignment"
  },
  {
    id: "sq-15",
    order: 15,
    question: "मशीन लर्निंग मॉडल में 'Overfitting' का क्या अर्थ होता है?",
    options: [
      "मॉडल बिल्कुल भी नहीं सीख पाता",
      "मॉडल बहुत तेजी से गणना करता है",
      "डेटा की साइज मेमोरी से ज्यादा बड़ी हो जाती है",
      "मॉडल ट्रेनिंग डेटा को रट लेता है लेकिन नए डेटा पर खराब प्रदर्शन करता है"
    ],
    correctOption: 3,
    explanation: "Overfitting तब होती है जब मॉडल ट्रेनिंग डेटा के शोर और विवरणों को अत्यधिक याद कर लेता है और नए अनदेखे डेटा पर फेल हो जाता है।",
    topic: "Model Evaluation"
  },
  {
    id: "sq-16",
    order: 16,
    question: "Vector Embeddings का आधुनिक AI सर्च और सिमेंटिक सिमिलैरिटी में क्या महत्व है?",
    options: [
      "यह टेक्स्ट को साधारण ASCII कोड में बदलता है",
      "यह शब्दों और वाक्यों के अर्थ (Meaning) को बहुआयामी संख्यात्मक निर्देशांकों (Vectors) में बदलता है",
      "यह फाइलों को कंप्रेस करके ZIP बनाता है",
      "यह केवल फाइलों का नाम बदलता है"
    ],
    correctOption: 1,
    explanation: "Vector Embeddings शब्दों के अर्थ और वैचारिक संबंधों को गणितीय दूरी (Cosine Similarity) द्वारा मापने योग्य बनाते हैं।",
    topic: "Vector Search & Embeddings"
  },
  {
    id: "sq-17",
    order: 17,
    question: "Autonomous AI Agents (जैसे AutoGPT, CrewAI) की क्या विशेषता है?",
    options: [
      "वे जटिल लक्ष्यों को प्राप्त करने के लिए स्वयं योजना बनाते हैं, टूल्स इस्तेमाल करते हैं और कार्य निष्पादित करते हैं",
      "वे केवल एक लाइन का टेक्स्ट प्रिंट कर सकते हैं",
      "वे केवल कीबोर्ड के बटन दबा सकते हैं",
      "वे बिना बिजली के काम करते हैं"
    ],
    correctOption: 0,
    explanation: "AI एजेंट्स स्वयं निर्णय लेकर वेब ब्राउज कर सकते हैं, कोड चला सकते हैं, और मल्टी-स्टेप कार्य स्वतंत्र रूप से पूरे कर सकते हैं।",
    topic: "Autonomous AI Agents"
  },
  {
    id: "sq-18",
    order: 18,
    question: "जिम्मेदार AI (Responsible & Ethical AI) में 'Algorithmic Bias' से बचने के लिए क्या आवश्यक है?",
    options: [
      "केवल एक ही वर्ग या जाति का डेटा इस्तेमाल करना",
      "AI मॉडल को कभी टेस्ट न करना",
      "विविध, निष्पक्ष और संतुलित ट्रेनिंग डेटासेट का उपयोग करना",
      "सिर्फ पुरानी किताबों का डेटा डालना"
    ],
    correctOption: 2,
    explanation: "एल्गोरिद्म पूर्वाग्रह को रोकने के लिए ट्रेनिंग डेटा का संतुलित, विविध और निरंतर मानवीय ऑडिट होना आवश्यक है।",
    topic: "AI Ethics & Safety"
  },
  {
    id: "sq-19",
    order: 19,
    question: "टेस्ला (Tesla) और वेमो (Waymo) की सेल्फ-ड्राइविंग कारों में किस AI तकनीक का सर्वाधिक संयोजन होता है?",
    options: [
      "केवल एक्सेल स्प्रेडशीट फॉर्मूला",
      "सिंपल HTML और CSS कोड",
      "Computer Vision, Deep Reinforcement Learning और Sensor Fusion (LiDAR/Cameras)",
      "केवल रेडियो फ्रीक्वेंसी रिसीवर"
    ],
    correctOption: 2,
    explanation: "सेल्फ-ड्राइविंग गाड़ियां रियल-टाइम कंप्यूटर विज़न, सेंसर फ्यूज़न और पाथ प्लानिंग न्यूरल नेटवर्क्स के संयोजन से चलती हैं।",
    topic: "Real-world AI Applications"
  },
  {
    id: "sq-20",
    order: 20,
    question: "BMB Educom के AI ट्रेनिंग प्रोग्राम का मुख्य विज़न क्या है?",
    options: [
      "छात्रों से केवल थ्योरी रटवाना",
      "फर्जी दावों के बजाय छात्रों को उद्योग-मानक प्रैक्टिकल AI टूल्स, कोडिंग और प्रोजेक्ट्स में पारंगत बनाना",
      "बिना कंप्यूटर के क्लास चलाना",
      "केवल सोशल मीडिया चलाना सिखाना"
    ],
    correctOption: 1,
    explanation: "BMB Educom का उद्देश्य छात्रों को हैंड्स-ऑन प्रोजेक्ट्स, प्रॉम्प्टिंग, ऑटोमेशन और वास्तविक AI सिस्टम निर्माण में दक्ष बनाना है।",
    topic: "BMB AI Practical Vision"
  }
];
