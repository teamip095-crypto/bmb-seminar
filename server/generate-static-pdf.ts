import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";
import { BMB_BROCHURE_DATA } from "../src/data/brochureData";

export function generateStaticOriginalBrochurePdf(): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const pageHeight = 297;

  const drawHeader = (title: string, sub: string, pageNum: number) => {
    // Professional clean header
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, pageWidth, 32, "F");
    doc.setFillColor(217, 119, 6); // Amber-600 accent bar
    doc.rect(0, 31, pageWidth, 1.5, "F");

    // Brand Name
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("BMB EDUCOM", 14, 13);

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(9);
    doc.text("FROM ZERO TO AI EXPERT", 14, 19);

    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Professional Artificial Intelligence Training Program", 14, 25);

    // Right side level & page
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), pageWidth - 14, 13, { align: "right" });

    doc.setTextColor(245, 158, 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(sub, pageWidth - 14, 19, { align: "right" });

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7.5);
    doc.text(`Page ${pageNum} of 6`, pageWidth - 14, 26, { align: "right" });
  };

  const drawFooter = () => {
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 16, pageWidth, 16, "F");
    doc.setFillColor(226, 232, 240);
    doc.rect(0, pageHeight - 16, pageWidth, 0.8, "F");

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("BHILAI CAMPUS: GE Road, Karma Bhawan, Supela | Ph: 940 795 5315 / 5318", 14, pageHeight - 9.5);
    doc.text("RAJNANDGAON CAMPUS: Above Tathagat Coaching, GE Road | Ph: 790 990 9903 / 6", 14, pageHeight - 5.5);

    doc.setTextColor(180, 83, 9);
    doc.text("www.bmbeducom.com • bmbeducom@gmail.com", pageWidth - 14, pageHeight - 7.5, { align: "right" });
  };

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Top Accent Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 42, "F");
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 41, pageWidth, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("BMB EDUCOM", 15, 20);

  doc.setTextColor(251, 191, 36);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BETTER EDUCATION FOR BETTER FUTURE", 15, 28);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("Government Registered & Industry Certified Institution", 15, 35);

  doc.setFillColor(245, 158, 11);
  doc.roundedRect(pageWidth - 70, 12, 55, 18, 2, 2, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("ADMISSION OPEN", pageWidth - 42.5, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text("2026 BATCH", pageWidth - 42.5, 26, { align: "center" });

  // Main Hero Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 48, pageWidth - 28, 48, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.6);
  doc.roundedRect(14, 48, pageWidth - 28, 48, 3, 3, "D");

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("OFFICIAL SYLLABUS & CURRICULUM", pageWidth / 2, 58, { align: "center" });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(24);
  doc.text("FROM ZERO TO AI EXPERT", pageWidth / 2, 70, { align: "center" });

  doc.setTextColor(180, 83, 9);
  doc.setFontSize(11);
  doc.text("Professional Artificial Intelligence Training Program", pageWidth / 2, 80, { align: "center" });

  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Learn • Build • Innovate • Get Hired | From Basics to Autonomous AI Agents", pageWidth / 2, 88, { align: "center" });

  // 4 Feature Boxes (2x2 Grid)
  const features = [
    {
      title: "Industry Oriented Course",
      sub: "Hands-on training with 25+ real-world AI tools, APIs and live commercial projects."
    },
    {
      title: "100% Placement Assistance",
      sub: "Dedicated resume building, mock interviews, freelance guidance and job referrals."
    },
    {
      title: "Certified Credentials",
      sub: "Industry recognized certification upon completion of capstone AI projects."
    },
    {
      title: "High-Growth Future",
      sub: "Master prompt engineering, generative AI, Python automation and AI agent systems."
    }
  ];

  features.forEach((feat, fIdx) => {
    const col = fIdx % 2;
    const row = Math.floor(fIdx / 2);
    const fx = 14 + col * ((pageWidth - 34) / 2 + 6);
    const fy = 102 + row * 34;
    const fw = (pageWidth - 34) / 2;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(fx, fy, fw, 30, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.roundedRect(fx, fy, fw, 30, 2, 2, "D");

    doc.setFillColor(245, 158, 11);
    doc.rect(fx, fy, 2.5, 30, "F");

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(feat.title, fx + 6, fy + 9);

    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(feat.sub, fw - 10);
    doc.text(lines, fx + 6, fy + 16);
  });

  // Course Levels Summary Table Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 176, pageWidth - 28, 44, 3, 3, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 176, pageWidth - 28, 44, 3, 3, "D");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("4 COMPREHENSIVE LEARNING LEVELS (1 TO 6 MONTHS)", 20, 185);

  const levelPills = [
    { lvl: "Level 1: AI Starter", dur: "1 Month", desc: "ChatGPT, Gemini, Prompting, Basic AI Tools" },
    { lvl: "Level 2: AI Beginner", dur: "2 Months", desc: "Creative Media, AI Video, Voice Cloning, Canva AI" },
    { lvl: "Level 3: AI Intermediate", dur: "4 Months", desc: "Python for AI, APIs, LangChain, Custom GPTs" },
    { lvl: "Level 4: AI Advanced", dur: "6 Months", desc: "Autonomous AI Agents, RAG Pipelines, Enterprise AI" }
  ];

  levelPills.forEach((lp, lIdx) => {
    const py = 192 + lIdx * 6.5;
    doc.setTextColor(180, 83, 9);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(`• ${lp.lvl} (${lp.dur}):`, 20, py);

    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(lp.desc, 76, py);
  });

  // Campus Address Card
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 225, pageWidth - 28, 48, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 225, pageWidth - 28, 48, 3, 3, "D");

  // Bhilai
  doc.setFillColor(245, 158, 11);
  doc.rect(14, 225, (pageWidth - 28) / 2, 6, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("BHILAI CAMPUS", 18, 229.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text("GE Road, Karma Bhawan, Supela, Bhilai (C.G.)", 18, 238);
  doc.setTextColor(2, 132, 199);
  doc.text("Contact: 940 795 5315, 940 795 5318", 18, 244);

  // Rajnandgaon
  const rx = 14 + (pageWidth - 28) / 2;
  doc.setFillColor(15, 23, 42);
  doc.rect(rx, 225, (pageWidth - 28) / 2, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("RAJNANDGAON CAMPUS", rx + 4, 229.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text("1st Floor, Above Tathagat Coaching, GE Road, Bhadoriya Chowk", rx + 4, 238);
  doc.setTextColor(2, 132, 199);
  doc.text("Contact: 790 990 9903, 790 990 9906", rx + 4, 244);

  // Bottom Notice
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text("Admissions Helpline: 940 795 5315 | Email: bmbeducom@gmail.com | Website: www.bmbeducom.com", pageWidth / 2, 266, { align: "center" });

  drawFooter();

  // ==========================================
  // PAGES 2 - 5: COURSE LEVELS
  // ==========================================
  BMB_BROCHURE_DATA.levels.forEach((lvl, idx) => {
    doc.addPage("a4", "portrait");
    const pageNum = idx + 2;

    drawHeader(lvl.level, lvl.badge, pageNum);

    // Level Header Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 37, pageWidth - 28, 24, 2.5, 2.5, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 37, pageWidth - 28, 24, 2.5, 2.5, "D");

    doc.setTextColor(180, 83, 9);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(lvl.badge.toUpperCase(), 18, 44);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text(lvl.level, 18, 51);

    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(lvl.description, 18, 57);

    // Duration and Mode badges on right
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(pageWidth - 65, 41, 48, 7, 1.5, 1.5, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`Duration: ${lvl.duration}`, pageWidth - 41, 46, { align: "center" });

    doc.setFillColor(226, 232, 240);
    doc.roundedRect(pageWidth - 65, 50, 48, 7, 1.5, 1.5, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(lvl.mode, pageWidth - 41, 55, { align: "center" });

    // Section title
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DETAILED SYLLABUS & MODULES", 14, 68);

    const colW = (pageWidth - 34) / 2;

    if (lvl.topics.length === 1 && !("category" in lvl.topics[0] && (lvl.topics[0] as any).category)) {
      // 2-column single item list (Starter Level)
      const allItems = lvl.topics[0].items;
      const half = Math.ceil(allItems.length / 2);

      [allItems.slice(0, half), allItems.slice(half)].forEach((colItems, cIdx) => {
        const cx = 14 + cIdx * (colW + 6);
        let cy = 74;

        colItems.forEach((item, iIdx) => {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(cx, cy, colW, 13, 2, 2, "F");
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(cx, cy, colW, 13, 2, 2, "D");

          doc.setFillColor(245, 158, 11);
          doc.circle(cx + 4, cy + 6.5, 1.8, "F");

          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          const lines = doc.splitTextToSize(item, colW - 12);
          doc.text(lines, cx + 8, cy + 5);

          cy += 15.5;
        });
      });
    } else {
      // Categorized modules (Beginner, Intermediate, Advanced)
      lvl.topics.forEach((topic: { category?: string; items: string[] }, tIdx: number) => {
        const colIndex = tIdx % 2;
        const rowIndex = Math.floor(tIdx / 2);
        const tx = 14 + colIndex * (colW + 6);
        const ty = 74 + rowIndex * 80;

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(tx, ty, colW, 74, 2.5, 2.5, "F");
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(tx, ty, colW, 74, 2.5, 2.5, "D");

        // Module Category Banner
        doc.setFillColor(15, 23, 42);
        doc.rect(tx, ty, colW, 9, "F");
        doc.setTextColor(251, 191, 36);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text((topic.category || `MODULE ${tIdx + 1}`).toUpperCase(), tx + 4, ty + 6);

        let itemY = ty + 15;
        topic.items.forEach((item, iIdx) => {
          doc.setFillColor(245, 158, 11);
          doc.circle(tx + 4, itemY - 1, 1.2, "F");

          doc.setTextColor(51, 65, 85);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          const lines = doc.splitTextToSize(item, colW - 10);
          doc.text(lines, tx + 8, itemY);
          itemY += lines.length * 4.2 + 2;
        });
      });
    }

    // Key Highlights Bar at bottom
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 242, pageWidth - 28, 28, 2.5, 2.5, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 242, pageWidth - 28, 28, 2.5, 2.5, "D");

    doc.setTextColor(180, 83, 9);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("KEY HIGHLIGHTS & LEARNING OUTCOMES:", 18, 249);

    lvl.highlights.forEach((hl, hIdx) => {
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`✓  ${hl}`, 18, 256 + hIdx * 5);
    });

    drawFooter();
  });

  // ==========================================
  // PAGE 6: CAREER, TOOLS & SUPPORT
  // ==========================================
  doc.addPage("a4", "portrait");
  drawHeader("Career & Lifetime Support", "Placements, Tools & Campuses", 6);

  // Top Section: Career Pathways
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 37, pageWidth - 28, 64, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 37, pageWidth - 28, 64, 3, 3, "D");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("JOB ROLES & CAREER OPPORTUNITIES", 18, 46);

  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("High-demand roles you can apply for after completing the BMB AI Training Program:", 18, 52);

  const careers = BMB_BROCHURE_DATA.careerOpportunities;
  const colC = (pageWidth - 44) / 2;
  careers.forEach((career, cIdx) => {
    const col = cIdx % 2;
    const row = Math.floor(cIdx / 2);
    const cx = 18 + col * (colC + 8);
    const cy = 60 + row * 8;

    doc.setFillColor(245, 158, 11);
    doc.circle(cx + 2, cy - 1, 1.5, "F");

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(career, cx + 6, cy);
  });

  // Middle Section: Lifetime Support & Benefits
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 106, pageWidth - 28, 64, 3, 3, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 106, pageWidth - 28, 64, 3, 3, "D");

  doc.setFillColor(15, 23, 42);
  doc.rect(14, 106, pageWidth - 28, 8, "F");
  doc.setTextColor(251, 191, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("LIFETIME BMB STUDENT SUPPORT & ECOSYSTEM", 18, 112);

  BMB_BROCHURE_DATA.lifetimeSupport.forEach((supp, sIdx) => {
    const sy = 122 + sIdx * 9.5;
    doc.setFillColor(245, 158, 11);
    doc.circle(20, sy - 1, 1.8, "F");

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(supp, 26, sy);
  });

  // Tools & Technologies Cloud Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 175, pageWidth - 28, 45, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 175, pageWidth - 28, 45, 3, 3, "D");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("25+ INDUSTRY AI TOOLS & FRAMEWORKS COVERED", 18, 184);

  const tools = BMB_BROCHURE_DATA.toolsAndTech;
  let toolX = 18;
  let toolY = 193;

  tools.forEach((tool, tIdx) => {
    const tw = doc.getTextWidth(tool) + 7;
    if (toolX + tw > pageWidth - 20) {
      toolX = 18;
      toolY += 8;
    }

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(toolX, toolY - 4.5, tw, 6.5, 1.2, 1.2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(toolX, toolY - 4.5, tw, 6.5, 1.2, 1.2, "D");

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(tool, toolX + 3.5, toolY);

    toolX += tw + 3;
  });

  // Contact / Admissions Card
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, 225, pageWidth - 28, 48, 3, 3, "F");
  doc.setFillColor(245, 158, 11);
  doc.rect(14, 225, pageWidth - 28, 2, "F");

  doc.setTextColor(251, 191, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ADMISSION & COUNSELING HELPLINE", pageWidth / 2, 235, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Bhilai Helpline: 940 795 5315, 940 795 5318", pageWidth / 2, 243, { align: "center" });
  doc.text("Rajnandgaon Helpline: 790 990 9903, 790 990 9906", pageWidth / 2, 249, { align: "center" });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8.5);
  doc.text("Email: bmbeducom@gmail.com | Website: www.bmbeducom.com", pageWidth / 2, 257, { align: "center" });
  doc.setTextColor(251, 191, 36);
  doc.text("★ BMB EDUCOM - BETTER EDUCATION FOR BETTER FUTURE ★", pageWidth / 2, 265, { align: "center" });

  drawFooter();

  return Buffer.from(doc.output("arraybuffer"));
}

// Generate file when executed
if (process.argv[1] && process.argv[1].includes("generate-static-pdf")) {
  const buf = generateStaticOriginalBrochurePdf();
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const outputPath = path.join(publicDir, "bmb_ai_expert_brochure.pdf");
  fs.writeFileSync(outputPath, buf);
  console.log(`Saved static brochure PDF to ${outputPath} (${buf.length} bytes)`);
}
