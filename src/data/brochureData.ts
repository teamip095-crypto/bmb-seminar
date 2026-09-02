export interface CourseLevel {
  level: string;
  badge: string;
  duration: string;
  mode: string;
  color: string;
  description: string;
  highlights: string[];
  topics: {
    category?: string;
    items: string[];
  }[];
}

export const BMB_BROCHURE_DATA = {
  institution: "BMB EDUCOM",
  programName: "FROM ZERO TO AI EXPERT",
  subTitle: "Professional Artificial Intelligence Training Program",
  tagline: "LEARN • BUILD • INNOVATE • GET HIRED",
  keyPillars: [
    { title: "Industry Oriented Course", icon: "GraduationCap" },
    { title: "Placement Assistance", icon: "Briefcase" },
    { title: "Certificate on Completion", icon: "Award" },
    { title: "Brighter Career Better Future", icon: "TrendingUp" }
  ],
  centers: [
    {
      city: "BHILAI",
      address: "GE Road, Karma Bhawan, Supela, Bhilai, Chhattisgarh",
      phones: ["940 795 5315", "940 795 5318"],
      whatsapp: "919407955315"
    },
    {
      city: "RAJNANDGAON",
      address: "1st Floor, Above Tathagat Coaching, GE Road, Bhadoriya Chowk, Rajnandgaon, Chhattisgarh",
      phones: ["790 990 9903", "790 990 9906"],
      whatsapp: "917909909903"
    }
  ],
  levels: [
    {
      level: "STARTER LEVEL",
      badge: "Level 1 • Beginner Friendly",
      duration: "1 Month",
      mode: "Online / Offline Mode",
      color: "from-blue-500 to-cyan-500",
      description: "AI की मूल अवधारणाएं, टॉप जेनरेटिव AI टूल्स और दैनिक उत्पादकता में AI का उपयोग।",
      highlights: ["ChatGPT & Gemini Mastering", "AI Image & Music Creation", "Daily Productivity Hacks"],
      topics: [
        {
          items: [
            "ChatGPT",
            "Google Gemini",
            "Microsoft Copilot",
            "Claude AI",
            "Perplexity AI",
            "Canva AI",
            "Gamma AI (Presentation)",
            "Napkin AI (Mind Maps & Diagrams)",
            "Adobe Firefly",
            "Microsoft Designer",
            "Leonardo AI",
            "Ideogram AI",
            "Suno AI (Music)",
            "ElevenLabs (AI Voice)",
            "NotebookLM",
            "Google AI Studio (Basic)",
            "AI Prompt Writing Basics",
            "Daily Productivity with AI"
          ]
        }
      ]
    },
    {
      level: "BEGINNER LEVEL",
      badge: "Level 2 • Content & Media Creator",
      duration: "2 Month",
      mode: "Online / Offline Mode",
      color: "from-amber-500 to-orange-500",
      description: "AI वीडियो, वॉयस क्लोनिंग, नो-कोड वेबसाइट्स और सोशल मीडिया ऑटोमेशन का पूर्ण पैकेज।",
      highlights: ["Advanced Video Generation", "AI Web Builders (Lovable, v0, Bolt)", "Social Media AI Campaigns"],
      topics: [
        {
          category: "AI Assistants & LLMs",
          items: ["Advanced ChatGPT", "Google Gemini Pro", "Claude 3.5 Sonnet", "Microsoft Copilot", "Perplexity Pro", "NotebookLM Research"]
        },
        {
          category: "AI Design & Graphics",
          items: ["Canva AI (Advanced)", "Microsoft Designer", "Adobe Firefly", "Leonardo AI", "Ideogram AI", "Recraft AI", "Remove.bg & Clipdrop AI"]
        },
        {
          category: "AI Video & Audio Creation",
          items: ["Runway ML Gen-3", "Pika AI", "Kling AI", "Luma Dream Machine", "CapCut AI", "InVideo AI", "HeyGen AI Avatar", "Synthesia Basic", "ElevenLabs Voice Cloning", "Suno AI & Udio AI Music"]
        },
        {
          category: "AI Website Creation & Apps",
          items: ["Lovable AI", "Bolt.new", "v0 by Vercel", "Framer AI", "Wix AI Studio", "Hostinger AI Website Builder"]
        },
        {
          category: "Presentations, Marketing & Projects",
          items: ["Gamma AI & Tome AI", "Social Media AI Content & Reels", "YouTube Thumbnail Design", "AI Presentation & Resume Design", "Brand Identity Kit", "Professional AI Portfolio"]
        }
      ]
    },
    {
      level: "INTERMEDIATE LEVEL",
      badge: "Level 3 • Developer & Freelancer",
      duration: "4 Month",
      mode: "Online / Offline Mode",
      color: "from-emerald-500 to-teal-500",
      description: "Python, AI APIs (Gemini/OpenAI), वर्कफ़्लो ऑटोमेशन, वेब ऐप्स और फ्रीलांसिंग मास्टरी।",
      highlights: ["Full Python & AI APIs", "Zapier & n8n Automations", "Upwork/Fiverr Freelancing & SaaS Projects"],
      topics: [
        {
          category: "Python & Web Development",
          items: ["Python Fundamentals", "Variables, Data Types & OOP", "Functions, Loops & File Handling", "HTML5, CSS3 & Modern JavaScript", "Responsive Web Design", "Git & GitHub Version Control"]
        },
        {
          category: "AI APIs & Database Integration",
          items: ["Google Gemini API", "OpenAI & Claude APIs", "Hugging Face Models", "REST APIs & JSON Handling", "SQLite, MySQL, Firebase & Supabase"]
        },
        {
          category: "No-Code / Low-Code Automation",
          items: ["Zapier & Make.com", "n8n Open Source Automation", "Google Apps Script", "WhatsApp Automation Workflows", "Email Automation Systems"]
        },
        {
          category: "AI Web Apps & Machine Learning",
          items: ["Streamlit & Gradio", "Flask & FastAPI Basics", "NumPy, Pandas & Scikit-learn", "Data Visualization (Matplotlib, Plotly, Power BI)", "AI Chatbot & Dashboard Development"]
        },
        {
          category: "Freelancing & Capstone Projects",
          items: ["Upwork & Fiverr Strategy", "Client Proposal Writing & Pricing", "AI SaaS Dashboard Capstone", "AI Analytics Dashboard", "AI E-commerce Assistant & Video Generator"]
        }
      ]
    },
    {
      level: "ADVANCED LEVEL",
      badge: "Level 4 • Industry AI Engineer & Architect",
      duration: "6 Month",
      mode: "Mostly Offline Mode",
      color: "from-purple-500 to-indigo-500",
      description: "डीप लर्निंग, LLMs (Fine-Tuning, RAG), AI एजेंट्स (LangChain, LangGraph, CrewAI), कंप्यूटर विज़न और एंटरप्राइज डिप्लॉयमेंट।",
      highlights: ["Deep Learning & PyTorch/TensorFlow", "Autonomous Multi-Agent AI (CrewAI, LangGraph)", "Enterprise Capstone & Job Placement"],
      topics: [
        {
          category: "Advanced Python & DSA",
          items: ["Advanced OOP & Decorators", "Async Programming & Package Management", "Data Structures & Algorithms (Trees, Graphs, Sorting)"]
        },
        {
          category: "Deep Learning & Generative AI",
          items: ["TensorFlow & PyTorch", "CNN, RNN, LSTM & Transformers", "LLMs, Advanced Prompt Engineering", "Fine-Tuning, Embeddings & Vector DBs (Pinecone, Chroma)", "RAG (Retrieval-Augmented Generation)"]
        },
        {
          category: "AI Agents & Autonomous Systems",
          items: ["LangChain & LangGraph", "CrewAI Multi-Agent Systems", "MCP Basics & Tool Calling", "Enterprise AI Chatbots & CRM Assistants"]
        },
        {
          category: "Computer Vision & Speech AI",
          items: ["OpenCV & Object Detection", "OCR, Face Detection & Segmentation", "Speech-to-Text & Voice Cloning (Whisper)"]
        },
        {
          category: "Full Stack, Cloud & Ethics",
          items: ["FastAPI, Flask & React Full Stack", "Docker, GitHub, Render & Cloudflare", "CI/CD Pipelines", "Responsible AI & Model Security", "End-to-End Enterprise AI Capstone Deployment"]
        }
      ]
    }
  ],
  careerOpportunities: [
    "AI Developer",
    "Machine Learning Engineer",
    "Data Scientist",
    "AI Automation Specialist",
    "NLP Engineer",
    "Computer Vision Engineer",
    "AI Product Developer",
    "Freelancer & AI Consultant"
  ],
  toolsAndTech: [
    "ChatGPT", "Gemini", "Claude", "OpenAI API", "HuggingFace",
    "Python", "PyTorch", "TensorFlow", "LangChain", "CrewAI",
    "Pinecone", "AWS", "Docker", "Streamlit", "FastAPI"
  ],
  lifetimeSupport: [
    "Recorded Lectures & Lifetime Notes",
    "Live Industry Project Guidance",
    "100% Job & Placement Assistance",
    "Exclusive Alumni & AI Community Access",
    "Continuous AI Tool & Model Updates"
  ]
};
