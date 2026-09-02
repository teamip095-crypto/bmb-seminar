import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

export function buildExactOriginalBmbBrochure(): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pw = 210;
  const ph = 297;

  // Background Drawer with Dark Cyber Grid & Glowing Aura
  const drawCyberBackground = (isCover = false) => {
    // Deep Navy to Dark Blue-Black
    doc.setFillColor(6, 13, 23); // #060d17
    doc.rect(0, 0, pw, ph, "F");

    // Cyber Grid Lines (Subtle Cyan/Blue glow lines)
    doc.setDrawColor(14, 35, 60);
    doc.setLineWidth(0.2);
    for (let x = 10; x < pw; x += 15) {
      doc.line(x, 0, x, ph);
    }
    for (let y = 10; y < ph; y += 15) {
      doc.line(0, y, pw, y);
    }

    // Top Glowing Circuit accents
    doc.setDrawColor(0, 195, 255);
    doc.setLineWidth(0.4);
    doc.line(10, 8, 40, 8);
    doc.line(40, 8, 48, 16);
    doc.line(48, 16, pw - 48, 16);
    doc.line(pw - 48, 16, pw - 40, 8);
    doc.line(pw - 40, 8, pw - 10, 8);

    // Glowing Node Dots
    doc.setFillColor(0, 229, 255);
    doc.circle(40, 8, 1, "F");
    doc.circle(pw - 40, 8, 1, "F");
    doc.circle(48, 16, 1, "F");
    doc.circle(pw - 48, 16, 1, "F");

    // Bottom Circuit line
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.4);
    doc.line(10, ph - 22, pw - 10, ph - 22);
  };

  // Draw 4 Bottom Pillars (Matches pages 1-5 exactly)
  const drawFourPillars = (yPos = 246) => {
    const boxW = (pw - 28) / 4;
    const items = [
      { t1: "INDUSTRY", t2: "ORIENTED", t3: "COURSE", icon: "🎓" },
      { t1: "PLACEMENT", t2: "ASSISTANCE", t3: "", icon: "💼" },
      { t1: "CERTIFICATE", t2: "ON", t3: "COMPLETION", icon: "★" },
      { t1: "BRIGHTER", t2: "CAREER", t3: "BETTER FUTURE", icon: "📈" }
    ];

    items.forEach((item, idx) => {
      const bx = 14 + idx * boxW;
      // Dark pill with gold border
      doc.setFillColor(11, 20, 36);
      doc.roundedRect(bx + 1, yPos, boxW - 2, 14, 2, 2, "F");
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.5);
      doc.roundedRect(bx + 1, yPos, boxW - 2, 14, 2, 2, "D");

      // Left Icon Box
      doc.setFillColor(245, 158, 11);
      doc.circle(bx + 6.5, yPos + 7, 3.5, "F");
      doc.setTextColor(11, 20, 36);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(item.icon, bx + 6.5, yPos + 8.2, { align: "center" });

      // Text lines
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      if (item.t3) {
        doc.text(item.t1, bx + 12, yPos + 4.5);
        doc.text(item.t2, bx + 12, yPos + 7.5);
        doc.text(item.t3, bx + 12, yPos + 10.5);
      } else {
        doc.text(item.t1, bx + 12, yPos + 6);
        doc.text(item.t2, bx + 12, yPos + 9.5);
      }
    });
  };

  // Draw Dual Campus Contact Footer (Matches pages 1 & 6 exactly)
  const drawCampusFooter = (yPos = 264) => {
    // BHILAI (Left Box)
    const halfW = (pw - 28) / 2;
    doc.setFillColor(11, 20, 36);
    doc.roundedRect(14, yPos, halfW - 2, 24, 2, 2, "F");
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.6);
    doc.roundedRect(14, yPos, halfW - 2, 24, 2, 2, "D");

    doc.setTextColor(245, 158, 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("BHILAI", 18, yPos + 6);

    doc.setTextColor(203, 213, 225);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.text("GE ROAD, KARMA BHAWAN, SUPELA, BHILAI", 18, yPos + 11.5);

    doc.setTextColor(251, 191, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("☎ 940 795 5315, 940 795 5318", 18, yPos + 19);

    // RAJNANDGAON (Right Box)
    const rx = 14 + halfW + 2;
    doc.setFillColor(11, 20, 36);
    doc.roundedRect(rx, yPos, halfW - 2, 24, 2, 2, "F");
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.6);
    doc.roundedRect(rx, yPos, halfW - 2, 24, 2, 2, "D");

    doc.setTextColor(245, 158, 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("RAJNANDGAON", rx + 4, yPos + 6);

    doc.setTextColor(203, 213, 225);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.text("1ST FLOOR, ABOVE TATHAGAT COACHING,", rx + 4, yPos + 10.5);
    doc.text("GE ROAD, BHADORIYA CHOWK, RAJNANDGAON", rx + 4, yPos + 14);

    doc.setTextColor(251, 191, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("☎ 790 990 9903 / 6", rx + 4, yPos + 20.5);
  };

  // Draw Page Header for Pages 2 to 5
  const drawLevelHeader = (levelTitle: string, durationStr: string, modeStr: string) => {
    // Top Left Titles
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("FROM", 14, 24);

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(28);
    doc.text("ZERO", 14, 35);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("TO", 48, 32);

    doc.setTextColor(251, 191, 36);
    doc.setFontSize(28);
    doc.text("AI EXPERT", 14, 46);

    doc.setTextColor(203, 213, 225);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Professional Artificial Intelligence Training Program", 14, 53);

    // Motto Bar
    doc.setTextColor(251, 191, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("🎓 LEARN    ⚙ BUILD    ⚡ INNOVATE    💼 GET HIRED", 14, 58.5);

    // Right Side 3D Cyber AI Glowing Badge
    doc.setFillColor(15, 30, 55);
    doc.circle(pw - 34, 36, 20, "F");
    doc.setDrawColor(0, 229, 255);
    doc.setLineWidth(1.2);
    doc.circle(pw - 34, 36, 20, "D");
    doc.setDrawColor(245, 158, 11);
    doc.circle(pw - 34, 36, 17, "D");

    doc.setTextColor(0, 229, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("AI", pw - 34, 43, { align: "center" });

    // Golden Level Pill Ribbon
    doc.setFillColor(11, 20, 36);
    doc.roundedRect(40, 63, pw - 80, 10, 2.5, 2.5, "F");
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1);
    doc.roundedRect(40, 63, pw - 80, 10, 2.5, 2.5, "D");

    doc.setTextColor(251, 191, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(levelTitle, pw / 2, 70, { align: "center" });

    // Duration & Mode Pills at bottom of content
    doc.setFillColor(0, 100, 180);
    doc.roundedRect(14, 265, 62, 8, 4, 4, "F");
    doc.setDrawColor(0, 229, 255);
    doc.setLineWidth(0.8);
    doc.roundedRect(14, 265, 62, 8, 4, 4, "D");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`DURATION - ${durationStr.toUpperCase()}`, 45, 270.5, { align: "center" });

    doc.setTextColor(203, 213, 225);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(modeStr.toUpperCase(), 14, 280);
  };

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  drawCyberBackground(true);

  // Top Left: BMB Educom Logo Box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 12, 48, 20, 2, 2, "F");
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(1);
  doc.roundedRect(14, 12, 48, 20, 2, 2, "D");

  doc.setTextColor(234, 88, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("BMB", 22, 22);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text("eDUCOM", 20, 29);

  // Top Right: Admission Open Medallion Badge
  doc.setFillColor(245, 158, 11);
  doc.circle(pw - 32, 24, 16, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.8);
  doc.circle(pw - 32, 24, 14, "D");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("★  ★  ★", pw - 32, 17, { align: "center" });
  doc.setFontSize(8.5);
  doc.text("ADMISSION", pw - 32, 23, { align: "center" });
  doc.setFontSize(13);
  doc.text("OPEN", pw - 32, 29, { align: "center" });

  // Center Holographic AI Brain & Cyber Orb Visual
  doc.setFillColor(8, 28, 56);
  doc.circle(pw / 2 + 35, 78, 28, "F");
  doc.setDrawColor(0, 229, 255);
  doc.setLineWidth(1.5);
  doc.circle(pw / 2 + 35, 78, 28, "D");

  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.8);
  doc.circle(pw / 2 + 35, 78, 24, "D");

  doc.setTextColor(0, 229, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.text("AI", pw / 2 + 35, 88, { align: "center" });

  // Main Hero Typography
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.text("FROM ZERO TO", pw / 2, 134, { align: "center" });

  doc.setTextColor(251, 191, 36);
  doc.setFontSize(54);
  doc.text("AI EXPERT", pw / 2, 154, { align: "center" });

  // Subtitle Banner
  doc.setFillColor(11, 20, 36);
  doc.roundedRect(20, 162, pw - 40, 9, 2, 2, "F");
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.roundedRect(20, 162, pw - 40, 9, 2, 2, "D");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("PROFESSIONAL ARTIFICIAL INTELLIGENCE TRAINING PROGRAM", pw / 2, 168, { align: "center" });

  // Motto List
  doc.setTextColor(251, 191, 36);
  doc.setFontSize(11);
  doc.text("LEARN   •   BUILD   •   INNOVATE   •   GET HIRED", pw / 2, 184, { align: "center" });

  // 4 Pillars Bar
  drawFourPillars(202);

  // Campus Address Footer
  drawCampusFooter(236);

  // ==========================================
  // PAGE 2: STARTER LEVEL (1 MONTH)
  // ==========================================
  doc.addPage("a4", "portrait");
  drawCyberBackground();
  drawLevelHeader("STARTER LEVEL", "1 MONTH", "ONLINE / OFFLINE MODE");

  // Main Course Content White Card with Neon Blue Border
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(18, 76, pw - 36, 162, 5, 5, "F");
  doc.setDrawColor(0, 180, 240);
  doc.setLineWidth(1.2);
  doc.roundedRect(18, 76, pw - 36, 162, 5, 5, "D");

  // Top Dark Blue Header Tab
  doc.setFillColor(11, 25, 60);
  doc.roundedRect(pw / 2 - 34, 76, 68, 9, 2, 2, "F");
  doc.setDrawColor(0, 229, 255);
  doc.roundedRect(pw / 2 - 34, 76, 68, 9, 2, 2, "D");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("COURSE CONTENT", pw / 2, 82.5, { align: "center" });

  // 2 Columns of Topics
  const starterCol1 = [
    "ChatGPT",
    "Google Gemini",
    "Microsoft Copilot",
    "Claude AI",
    "Perplexity AI",
    "Canva AI",
    "Gamma AI (Presentation)",
    "Napkin AI (Mind Maps & Diagrams)",
    "Adobe Firefly"
  ];

  const starterCol2 = [
    "Microsoft Designer",
    "Leonardo AI",
    "Ideogram AI",
    "Suno AI (Music)",
    "ElevenLabs (AI Voice)",
    "NotebookLM",
    "Google AI Studio (Basic)",
    "AI Prompt Writing Basics",
    "Daily Productivity with AI"
  ];

  const renderChecklistCol = (items: string[], startX: number, startY: number) => {
    items.forEach((item, idx) => {
      const cy = startY + idx * 15;
      // Blue Checkmark icon circle
      doc.setFillColor(0, 150, 230);
      doc.circle(startX + 4, cy, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("✔", startX + 4, cy + 1, { align: "center" });

      // Topic Text
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(item, startX + 11, cy + 1.2);
    });
  };

  renderChecklistCol(starterCol1, 26, 96);
  renderChecklistCol(starterCol2, pw / 2 + 6, 96);

  // 4 Pillars Bar
  drawFourPillars(244);

  // ==========================================
  // PAGE 3: BEGINNER LEVEL (2 MONTHS)
  // ==========================================
  doc.addPage("a4", "portrait");
  drawCyberBackground();
  drawLevelHeader("BEGINNER LEVEL", "2 MONTH", "ONLINE / OFFLINE MODE");

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(18, 76, pw - 36, 162, 5, 5, "F");
  doc.setDrawColor(0, 180, 240);
  doc.setLineWidth(1.2);
  doc.roundedRect(18, 76, pw - 36, 162, 5, 5, "D");

  doc.setFillColor(11, 25, 60);
  doc.roundedRect(pw / 2 - 34, 76, 68, 9, 2, 2, "F");
  doc.setDrawColor(0, 229, 255);
  doc.roundedRect(pw / 2 - 34, 76, 68, 9, 2, 2, "D");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("COURSE CONTENT", pw / 2, 82.5, { align: "center" });

  const begCol1 = [
    { title: "AI Assistants", isHead: true },
    { title: "Advanced ChatGPT" },
    { title: "Google Gemini" },
    { title: "Claude AI" },
    { title: "Microsoft Copilot" },
    { title: "Perplexity AI" },
    { title: "NotebookLM" },
    { title: "AI Design & Graphics", isHead: true },
    { title: "Canva AI (Advanced)" },
    { title: "Microsoft Designer" },
    { title: "Adobe Firefly" },
    { title: "Leonardo AI" },
    { title: "Ideogram AI" },
    { title: "Recraft AI" },
    { title: "Remove.bg" },
    { title: "Clipdrop AI" },
    { title: "AI Video Creation", isHead: true },
    { title: "Runway ML" },
    { title: "Pika AI" },
    { title: "Kling AI" },
    { title: "Luma AI" },
    { title: "CapCut AI" },
    { title: "InVideo AI" },
    { title: "HeyGen (AI Avatar)" },
    { title: "Synthesia (Basic)" },
    { title: "AI Voice & Audio", isHead: true },
    { title: "ElevenLabs" },
    { title: "Suno AI" },
    { title: "Udio AI" },
    { title: "AI Website Creation", isHead: true },
    { title: "Lovable AI" },
    { title: "Bolt.new" }
  ];

  const begCol2 = [
    { title: "v0 by Vercel" },
    { title: "Framer AI" },
    { title: "Wix AI" },
    { title: "Hostinger AI Website Builder" },
    { title: "AI Presentations & Documents", isHead: true },
    { title: "Gamma AI" },
    { title: "Tome AI" },
    { title: "Beautiful.ai" },
    { title: "Napkin AI" },
    { title: "AI Content Creation", isHead: true },
    { title: "Social Media Content" },
    { title: "YouTube Thumbnail Design" },
    { title: "Instagram Reels" },
    { title: "AI Image Editing" },
    { title: "AI Video Editing" },
    { title: "AI Presentation Design" },
    { title: "AI Resume Creation" },
    { title: "Productivity & Automation", isHead: true },
    { title: "Prompt Engineering (Advanced)" },
    { title: "Google AI Studio" },
    { title: "AI Workflow Basics" },
    { title: "AI for Business & Marketing" },
    { title: "AI Productivity Automation" },
    { title: "Final Projects", isHead: true },
    { title: "AI Business Website" },
    { title: "AI Promotional Video" },
    { title: "Brand Identity Kit" },
    { title: "Social Media Campaign" },
    { title: "AI Presentation" },
    { title: "Professional Portfolio" },
    { title: "YouTube Shorts & Instagram Reels" },
    { title: "AI Resume & LinkedIn Profile" }
  ];

  const renderDenseCol = (items: { title: string; isHead?: boolean }[], startX: number, startY: number) => {
    let cy = startY;
    items.forEach(item => {
      if (item.isHead) {
        doc.setFillColor(0, 100, 200);
        doc.circle(startX + 3, cy, 2, "F");
        doc.setTextColor(0, 102, 204);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text(item.title, startX + 8, cy + 1);
        cy += 4.5;
      } else {
        doc.setFillColor(0, 150, 230);
        doc.circle(startX + 3, cy, 1.5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5);
        doc.text("✔", startX + 3, cy + 0.8, { align: "center" });

        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.8);
        doc.text(item.title, startX + 7, cy + 1);
        cy += 4.2;
      }
    });
  };

  renderDenseCol(begCol1, 24, 88);
  renderDenseCol(begCol2, pw / 2 + 4, 88);

  drawFourPillars(244);

  // ==========================================
  // PAGE 4: INTERMEDIATE LEVEL (4 MONTHS)
  // ==========================================
  doc.addPage("a4", "portrait");
  drawCyberBackground();
  drawLevelHeader("INTERMEDIATE LEVEL", "4 MONTH", "ONLINE / OFFLINE MODE");

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(18, 76, pw - 36, 162, 5, 5, "F");
  doc.setDrawColor(0, 180, 240);
  doc.setLineWidth(1.2);
  doc.roundedRect(18, 76, pw - 36, 162, 5, 5, "D");

  doc.setFillColor(11, 25, 60);
  doc.roundedRect(pw / 2 - 34, 76, 68, 9, 2, 2, "F");
  doc.setDrawColor(0, 229, 255);
  doc.roundedRect(pw / 2 - 34, 76, 68, 9, 2, 2, "D");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("COURSE CONTENT", pw / 2, 82.5, { align: "center" });

  const interCol1 = [
    { title: "Python Programming", isHead: true },
    { title: "Python Fundamentals" },
    { title: "Variables & Data Types" },
    { title: "Conditions & Loops" },
    { title: "Functions" },
    { title: "OOP" },
    { title: "File Handling" },
    { title: "Exception Handling" },
    { title: "Web Development Basics", isHead: true },
    { title: "HTML5" },
    { title: "CSS3" },
    { title: "JavaScript Basics" },
    { title: "Responsive Web Design" },
    { title: "Git & GitHub" },
    { title: "AI APIs & Integration", isHead: true },
    { title: "OpenAI API" },
    { title: "Google Gemini API" },
    { title: "Claude API" },
    { title: "Hugging Face API" },
    { title: "REST APIs" },
    { title: "API Authentication" },
    { title: "JSON Handling" },
    { title: "Automation", isHead: true },
    { title: "Zapier" },
    { title: "Make.com" },
    { title: "n8n" },
    { title: "Google Apps Script" },
    { title: "WhatsApp Automation" },
    { title: "Email Automation" },
    { title: "Workflow Automation" }
  ];

  const interCol2 = [
    { title: "AI Website & App Development", isHead: true },
    { title: "Streamlit" },
    { title: "Gradio" },
    { title: "Flask (Basics)" },
    { title: "FastAPI (Basics)" },
    { title: "AI Chatbot Development" },
    { title: "AI Dashboard Development" },
    { title: "Database Basics", isHead: true },
    { title: "SQLite" },
    { title: "MySQL Basics" },
    { title: "Firebase Basics" },
    { title: "Supabase Basics" },
    { title: "Machine Learning", isHead: true },
    { title: "Introduction" },
    { title: "Data Collection" },
    { title: "Data Cleaning" },
    { title: "NumPy" },
    { title: "Pandas" },
    { title: "Scikit-learn Basics" },
    { title: "Regression" },
    { title: "Classification" },
    { title: "Model Evaluation" },
    { title: "Data Visualization", isHead: true },
    { title: "Matplotlib" },
    { title: "Plotly" },
    { title: "Power BI (Basics)" },
    { title: "Deployment", isHead: true },
    { title: "GitHub" },
    { title: "GitHub Pages" },
    { title: "Render" }
  ];

  const interCol3 = [
    { title: "Vercel" },
    { title: "Netlify" },
    { title: "Real-World AI Projects", isHead: true },
    { title: "AI Chatbot" },
    { title: "AI Resume Builder" },
    { title: "AI Image Generator" },
    { title: "AI Content Generator" },
    { title: "AI Voice Assistant" },
    { title: "AI Business Website" },
    { title: "AI Portfolio Website" },
    { title: "AI Automation Workflow" },
    { title: "AI Dashboard" },
    { title: "Freelancing & Client Projects", isHead: true },
    { title: "Fiverr" },
    { title: "Upwork" },
    { title: "Client Communication" },
    { title: "Proposal Writing" },
    { title: "Project Pricing" },
    { title: "Portfolio Building" },
    { title: "Final Capstone Projects", isHead: true },
    { title: "AI SaaS Dashboard" },
    { title: "AI Analytics Dashboard" },
    { title: "AI E-commerce Assistant" },
    { title: "AI Video Generator" },
    { title: "AI Automation System" }
  ];

  renderDenseCol(interCol1, 22, 88);
  renderDenseCol(interCol2, 78, 88);
  renderDenseCol(interCol3, 136, 88);

  drawFourPillars(244);

  // ==========================================
  // PAGE 5: ADVANCED LEVEL (6 MONTHS)
  // ==========================================
  doc.addPage("a4", "portrait");
  drawCyberBackground();
  drawLevelHeader("ADVANCED LEVEL", "6 MONTH", "MOSTLY OFFLINE MODE");

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(18, 76, pw - 36, 162, 5, 5, "F");
  doc.setDrawColor(0, 180, 240);
  doc.setLineWidth(1.2);
  doc.roundedRect(18, 76, pw - 36, 162, 5, 5, "D");

  doc.setFillColor(11, 25, 60);
  doc.roundedRect(pw / 2 - 34, 76, 68, 9, 2, 2, "F");
  doc.setDrawColor(0, 229, 255);
  doc.roundedRect(pw / 2 - 34, 76, 68, 9, 2, 2, "D");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("COURSE CONTENT", pw / 2, 82.5, { align: "center" });

  const advCol1 = [
    { title: "Advanced Python", isHead: true },
    { title: "Advanced OOP" },
    { title: "Decorators" },
    { title: "Generators" },
    { title: "Async Programming" },
    { title: "Virtual Environments" },
    { title: "Package Management" },
    { title: "Data Structures & Algorithms", isHead: true },
    { title: "Arrays" },
    { title: "Linked Lists" },
    { title: "Stacks" },
    { title: "Queues" },
    { title: "Trees" },
    { title: "Graphs" },
    { title: "Searching" },
    { title: "Sorting" },
    { title: "Advanced Machine Learning", isHead: true },
    { title: "Feature Engineering" },
    { title: "Model Optimization" },
    { title: "Cross Validation" },
    { title: "Ensemble Learning" },
    { title: "XGBoost" },
    { title: "Model Deployment" },
    { title: "Deep Learning", isHead: true },
    { title: "Neural Networks" },
    { title: "TensorFlow" },
    { title: "PyTorch" },
    { title: "CNN" },
    { title: "RNN" },
    { title: "LSTM" },
    { title: "Transformers" },
    { title: "Generative AI", isHead: true },
    { title: "LLMs" },
    { title: "Advanced Prompt Engineering" },
    { title: "Fine-Tuning Basics" },
    { title: "Embeddings" },
    { title: "Vector Databases" },
    { title: "RAG" },
    { title: "AI Agent Development", isHead: true }
  ];

  const advCol2 = [
    { title: "LangChain" },
    { title: "LangGraph" },
    { title: "CrewAI" },
    { title: "Multi-Agent Systems" },
    { title: "Tool Calling" },
    { title: "MCP Basics" },
    { title: "Computer Vision", isHead: true },
    { title: "OpenCV" },
    { title: "Image Classification" },
    { title: "Object Detection" },
    { title: "OCR" },
    { title: "Face Detection" },
    { title: "Image Segmentation" },
    { title: "Natural Language Processing", isHead: true },
    { title: "Tokenization" },
    { title: "Sentiment Analysis" },
    { title: "Text Classification" },
    { title: "NER" },
    { title: "Summarization" },
    { title: "Speech AI", isHead: true },
    { title: "Speech-to-Text" },
    { title: "Text-to-Speech" },
    { title: "Voice Cloning" },
    { title: "AI Voice Assistants" },
    { title: "Full Stack AI Development", isHead: true },
    { title: "FastAPI" },
    { title: "Flask" },
    { title: "React Basics" },
    { title: "Streamlit" },
    { title: "Gradio" },
    { title: "Authentication" },
    { title: "REST APIs" },
    { title: "Cloud & Deployment", isHead: true },
    { title: "Docker" },
    { title: "GitHub" },
    { title: "Render" },
    { title: "Vercel" },
    { title: "Cloudflare" },
    { title: "CI/CD Basics" }
  ];

  const advCol3 = [
    { title: "Databases", isHead: true },
    { title: "MySQL" },
    { title: "PostgreSQL" },
    { title: "MongoDB" },
    { title: "Firebase" },
    { title: "Supabase" },
    { title: "Vector Databases" },
    { title: "AI Security & Ethics", isHead: true },
    { title: "Responsible AI" },
    { title: "Model Security" },
    { title: "Data Privacy" },
    { title: "Prompt Injection Awareness" },
    { title: "Industry Projects", isHead: true },
    { title: "Enterprise AI Chatbot" },
    { title: "AI CRM Assistant" },
    { title: "AI Resume Screening System" },
    { title: "AI Image Generator" },
    { title: "AI Video Generator" },
    { title: "AI Voice Assistant" },
    { title: "AI SaaS Dashboard" },
    { title: "AI Document Analyzer" },
    { title: "AI Automation Platform" },
    { title: "Capstone Project", isHead: true },
    { title: "Build & Deploy a Complete AI Product" },
    { title: "Documentation" },
    { title: "Presentation" },
    { title: "Portfolio & GitHub" }
  ];

  renderDenseCol(advCol1, 22, 88);
  renderDenseCol(advCol2, 78, 88);
  renderDenseCol(advCol3, 136, 88);

  drawFourPillars(244);

  // ==========================================
  // PAGE 6: CAREER, TOOLS & SUPPORT (BACK COVER)
  // ==========================================
  doc.addPage("a4", "portrait");
  drawCyberBackground();

  // Top Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("BUILD", 14, 22);

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(32);
  doc.text("YOUR AI", 14, 34);

  doc.setTextColor(251, 191, 36);
  doc.setFontSize(34);
  doc.text("FUTURE", 14, 46);

  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Learn. Build. Automate. Succeed.", 14, 53);

  // Right Side 3D Glowing AI Sphere
  doc.setFillColor(8, 28, 56);
  doc.circle(pw - 34, 34, 20, "F");
  doc.setDrawColor(0, 229, 255);
  doc.setLineWidth(1.2);
  doc.circle(pw - 34, 34, 20, "D");
  doc.setDrawColor(245, 158, 11);
  doc.circle(pw - 34, 34, 16, "D");
  doc.setTextColor(0, 229, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("AI", pw - 34, 41, { align: "center" });

  // "WHY CHOOSE OUR AI PROGRAM?" 5 Icons Bar
  doc.setTextColor(245, 158, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("WHY CHOOSE OUR AI PROGRAM?", pw / 2, 63, { align: "center" });

  const whyPillars = [
    { icon: "🎓", label: "Beginner to\nExpert Journey" },
    { icon: "★", label: "Practical\nProjects" },
    { icon: "📊", label: "Industry-Focused\nCurriculum" },
    { icon: "🤝", label: "Placement &\nCareer Support" },
    { icon: "🏆", label: "Skills for\nReal World" }
  ];

  const pillW = (pw - 28) / 5;
  whyPillars.forEach((p, idx) => {
    const px = 14 + idx * pillW;
    doc.setFillColor(11, 20, 36);
    doc.roundedRect(px + 1, 67, pillW - 2, 18, 2, 2, "F");
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.4);
    doc.roundedRect(px + 1, 67, pillW - 2, 18, 2, 2, "D");

    doc.setFillColor(245, 158, 11);
    doc.circle(px + pillW / 2, 73, 3, "F");
    doc.setTextColor(11, 20, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(p.icon, px + pillW / 2, 74.2, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    const lines = p.label.split("\n");
    doc.text(lines[0], px + pillW / 2, 79, { align: "center" });
    if (lines[1]) doc.text(lines[1], px + pillW / 2, 82, { align: "center" });
  });

  // 3 Large Feature Cards (Career, Tools, Lifetime Support)
  const cardW = (pw - 34) / 3;

  // CARD 1: CAREER OPPORTUNITIES
  doc.setFillColor(11, 20, 36);
  doc.roundedRect(14, 90, cardW, 82, 3, 3, "F");
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.roundedRect(14, 90, cardW, 82, 3, 3, "D");

  doc.setTextColor(245, 158, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("CAREER OPPORTUNITIES", 14 + cardW / 2, 97, { align: "center" });

  const careers = [
    "AI Developer",
    "Machine Learning Engineer",
    "Data Scientist",
    "AI Automation Specialist",
    "NLP Engineer",
    "Computer Vision Engineer",
    "AI Product Developer",
    "Freelancer & AI Consultant"
  ];

  careers.forEach((car, cIdx) => {
    const cy = 104 + cIdx * 9;
    doc.setFillColor(0, 180, 240);
    doc.circle(18, cy, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5);
    doc.text("✔", 18, cy + 0.8, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.text(car, 23, cy + 1);
  });

  // CARD 2: TOOLS & TECHNOLOGIES
  const c2x = 14 + cardW + 3;
  doc.setFillColor(11, 20, 36);
  doc.roundedRect(c2x, 90, cardW, 82, 3, 3, "F");
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.roundedRect(c2x, 90, cardW, 82, 3, 3, "D");

  doc.setTextColor(245, 158, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("TOOLS & TECHNOLOGIES", c2x + cardW / 2, 97, { align: "center" });

  const techBadges = [
    "Gemini", "OpenAI", "Claude",
    "Canva AI", "Meta", "HuggingFace",
    "Pinecone", "AWS", "Python",
    "PyTorch", "Docker", "LangChain"
  ];

  techBadges.forEach((t, tIdx) => {
    const col = tIdx % 2;
    const row = Math.floor(tIdx / 2);
    const tx = c2x + 4 + col * (cardW / 2 - 2);
    const ty = 104 + row * 10.5;

    doc.setFillColor(18, 32, 56);
    doc.roundedRect(tx, ty, cardW / 2 - 4, 7.5, 1.5, 1.5, "F");
    doc.setDrawColor(0, 180, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(tx, ty, cardW / 2 - 4, 7.5, 1.5, 1.5, "D");

    doc.setTextColor(0, 229, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(t, tx + (cardW / 2 - 4) / 2, ty + 5, { align: "center" });
  });

  doc.setTextColor(245, 158, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("+ Many More", c2x + cardW / 2, 166, { align: "center" });

  // CARD 3: LIFETIME SUPPORT
  const c3x = 14 + (cardW + 3) * 2;
  doc.setFillColor(11, 20, 36);
  doc.roundedRect(c3x, 90, cardW, 82, 3, 3, "F");
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.roundedRect(c3x, 90, cardW, 82, 3, 3, "D");

  doc.setTextColor(245, 158, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("LIFETIME SUPPORT", c3x + cardW / 2, 97, { align: "center" });

  const supports = [
    "Recorded Lectures",
    "Project Guidance",
    "Job Assistance",
    "Community Access",
    "Updates & Resources"
  ];

  supports.forEach((supp, sIdx) => {
    const sy = 106 + sIdx * 12;
    doc.setFillColor(0, 180, 240);
    doc.circle(c3x + 5, sy, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5);
    doc.text("✔", c3x + 5, sy + 0.8, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(supp, c3x + 10, sy + 1.2);
  });

  // Trophy Banner (Left)
  doc.setFillColor(11, 20, 36);
  doc.roundedRect(14, 180, pw - 86, 26, 3, 3, "F");
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.roundedRect(14, 180, pw - 86, 26, 3, 3, "D");

  doc.setFillColor(245, 158, 11);
  doc.circle(26, 193, 7, "F");
  doc.setTextColor(11, 20, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("🏆", 26, 195.5, { align: "center" });

  doc.setTextColor(251, 191, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("LEARN TODAY, BUILD TOMORROW,", 38, 190);
  doc.text("LEAD THE AI WORLD.", 38, 198);

  // Golden Certified Badge (Right)
  doc.setFillColor(245, 158, 11);
  doc.circle(pw - 36, 193, 16, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  doc.circle(pw - 36, 193, 14, "D");

  doc.setTextColor(11, 20, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("★  ★  ★", pw - 36, 186, { align: "center" });
  doc.setFontSize(7.5);
  doc.text("CERTIFIED", pw - 36, 191, { align: "center" });
  doc.text("AI EXPERT", pw - 36, 195.5, { align: "center" });
  doc.setFontSize(5);
  doc.text("BRIGHTER CAREER", pw - 36, 199.5, { align: "center" });
  doc.text("BETTER FUTURE", pw - 36, 203, { align: "center" });

  // Center "CONTACT US" Pill
  doc.setFillColor(11, 20, 36);
  doc.roundedRect(pw / 2 - 30, 214, 60, 10, 5, 5, "F");
  doc.setDrawColor(0, 229, 255);
  doc.setLineWidth(1);
  doc.roundedRect(pw / 2 - 30, 214, 60, 10, 5, 5, "D");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("CONTACT US", pw / 2, 221, { align: "center" });

  // Campus Address Footer
  drawCampusFooter(232);

  return Buffer.from(doc.output("arraybuffer"));
}

// Generate immediately when executed
if (process.argv[1] && process.argv[1].includes("generate-official-brochure")) {
  const buf = buildExactOriginalBmbBrochure();
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const outputPath = path.join(publicDir, "bmb_ai_expert_brochure.pdf");
  fs.writeFileSync(outputPath, buf);
  console.log(`Successfully compiled exact original BMB brochure PDF to ${outputPath} (${buf.length} bytes)`);
}
