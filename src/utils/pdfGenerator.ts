import { jsPDF } from "jspdf";
import { BMB_BROCHURE_DATA } from "../data/brochureData";

export interface ParticipantPassData {
  name: string;
  registrationId: string;
  seatNumber: string;
  seminarDateHi: string;
  seminarDateEn: string;
  seminarTime: string;
  whatsappNumber: string;
  fullAddress: string;
  secureLink: string;
}

/**
 * Generates the complete official 6-Page "From Zero to AI Expert" Syllabus Brochure + Seminar Pass PDF
 */
export function generateBmbBrochurePDF(passData?: ParticipantPassData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // Helper: Draw Gradient-like Header Box
  const drawHeaderBanner = (title: string, sub: string, pageNum: number, totalPages: number = 6) => {
    // Dark Futuristic Background Banner
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, pageWidth, 38, "F");

    // Golden Accent Line
    doc.setFillColor(245, 158, 11); // #f59e0b
    doc.rect(0, 37, pageWidth, 1.5, "F");

    // Institution Name
    doc.setTextColor(245, 158, 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("BMB EDUCOM", 15, 12);

    // AI Expert Tag
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("FROM ZERO TO AI EXPERT", 15, 19);

    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Professional Artificial Intelligence Training Program", 15, 25);

    // Page Title
    doc.setTextColor(56, 189, 248);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), pageWidth - 15, 14, { align: "right" });

    doc.setTextColor(203, 213, 225);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(sub, pageWidth - 15, 21, { align: "right" });

    // Page indicator
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 15, 32, { align: "right" });
  };

  // Helper: Draw Footer
  const drawFooter = () => {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageHeight - 16, pageWidth, 16, "F");

    doc.setFillColor(245, 158, 11);
    doc.rect(0, pageHeight - 16, pageWidth, 0.8, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("BHILAI: GE Road, Karma Bhawan, Supela | Ph: 940 795 5315 / 5318", 15, pageHeight - 9);
    doc.text("RAJNANDGAON: Above Tathagat Coaching, GE Road | Ph: 790 990 9903 / 6", 15, pageHeight - 5);

    doc.setTextColor(245, 158, 11);
    doc.text("www.bmbeducom.com • Verified AI Curriculum", pageWidth - 15, pageHeight - 7, { align: "right" });
  };

  // ==========================================
  // PAGE 1: COVER & SEMINAR ADMISSION PASS
  // ==========================================
  doc.setFillColor(10, 15, 30);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Top Glowing Gold Brand Badge
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(15, 12, 50, 14, 2, 2, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("BMB EDUCOM", 40, 21, { align: "center" });

  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - 75, 12, 60, 14, 2, 2, "F");
  doc.setTextColor(251, 191, 36);
  doc.setFontSize(9);
  doc.text("★ ADMISSION OPEN 2026 ★", pageWidth - 45, 21, { align: "center" });

  // Main Hero Typography
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("FROM ZERO TO", pageWidth / 2, 44, { align: "center" });

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(36);
  doc.text("AI EXPERT", pageWidth / 2, 58, { align: "center" });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Professional Artificial Intelligence Training Program", pageWidth / 2, 66, { align: "center" });

  doc.setTextColor(56, 189, 248);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text("LEARN  •  BUILD  •  INNOVATE  •  GET HIRED", pageWidth / 2, 73, { align: "center" });

  // If Participant Pass Data is provided, render the Official Admission Pass Box!
  if (passData) {
    // Official Pass Card
    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.8);
    doc.roundedRect(15, 80, pageWidth - 30, 72, 4, 4, "FD");

    // Gold Top Header of Pass
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(15, 80, pageWidth - 30, 11, 4, 4, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("OFFICIAL FRIDAY SEMINAR ADMISSION PASS & SEAT ALLOCATION", pageWidth / 2, 87.5, { align: "center" });

    // Seat Number (Prominent Gold Badge)
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(22, 96, 52, 22, 3, 3, "F");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text("RESERVED SEAT NO.", 48, 102, { align: "center" });
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(passData.seatNumber || "BMB-SEAT-001", 48, 113, { align: "center" });

    // Pass ID & Attendee Details
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Candidate Name: ${passData.name}`, 82, 100);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Registration ID: ${passData.registrationId}`, 82, 107);
    doc.text(`WhatsApp: +91 ${passData.whatsappNumber}`, 82, 113);
    doc.text(`Address: ${passData.fullAddress.substring(0, 45)}`, 82, 119);

    // Date & Time Bar inside Pass
    doc.setFillColor(2, 6, 23);
    doc.roundedRect(22, 122, pageWidth - 44, 14, 2, 2, "F");
    doc.setTextColor(56, 189, 248);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(`DATE: ${passData.seminarDateHi} (${passData.seminarDateEn})`, 28, 129);
    doc.setTextColor(245, 158, 11);
    doc.text(`TIME: ${passData.seminarTime || "11:00 AM – 4:00 PM IST"}`, 28, 134);

    // Link info
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Online Live Link: ${passData.secureLink}`, 22, 144);
    doc.text("Present this digital pass or WhatsApp confirmation upon entry.", 22, 149);
  }

  // 4 Pillars Box
  const pillarY = passData ? 158 : 88;
  const pillars = [
    { title: "Industry Oriented", sub: "Practical Hands-on Projects" },
    { title: "Placement Assistance", sub: "Resume, Mock QA & Portfolios" },
    { title: "Govt & BMB Certificate", sub: "Verified Credentials" },
    { title: "Brighter AI Career", sub: "High-Growth Salary Pathways" }
  ];

  pillars.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const px = 15 + col * (pageWidth / 2 - 12);
    const py = pillarY + row * 24;

    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.4);
    doc.roundedRect(px, py, pageWidth / 2 - 18, 20, 2, 2, "FD");

    doc.setTextColor(245, 158, 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`✔  ${p.title}`, px + 4, py + 8);

    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(p.sub, px + 8, py + 14);
  });

  // Center Contacts Box on Cover Page
  const contactY = passData ? 212 : 148;
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.6);
  doc.roundedRect(15, contactY, pageWidth - 30, 48, 3, 3, "FD");

  doc.setTextColor(245, 158, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("BMB EDUCOM CAMPUS LOCATIONS & ADMISSION DESK", pageWidth / 2, contactY + 9, { align: "center" });

  // Bhilai
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.text("BHILAI CENTER", 22, contactY + 18);
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("GE Road, Karma Bhawan, Supela, Bhilai, Chhattisgarh", 22, contactY + 24);
  doc.setTextColor(56, 189, 248);
  doc.setFont("helvetica", "bold");
  doc.text("Phone: 940 795 5315, 940 795 5318", 22, contactY + 30);

  // Rajnandgaon
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.text("RAJNANDGAON CENTER", 115, contactY + 18);
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("1st Floor, Above Tathagat Coaching, GE Road, Bhadoriya Chowk", 115, contactY + 24);
  doc.setTextColor(56, 189, 248);
  doc.setFont("helvetica", "bold");
  doc.text("Phone: 790 990 9903, 790 990 9906", 115, contactY + 30);

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Online Live Stream + Classroom Hybrid Batches Available", pageWidth / 2, contactY + 41, { align: "center" });

  drawFooter();

  // ==========================================
  // PAGES 2 - 5: DETAILED 4 COURSE LEVELS
  // ==========================================
  BMB_BROCHURE_DATA.levels.forEach((lvl, idx) => {
    doc.addPage("a4", "portrait");
    const pageNumber = idx + 2;

    // Dark Background
    doc.setFillColor(10, 15, 30);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    drawHeaderBanner(lvl.level, `${lvl.duration} • ${lvl.mode}`, pageNumber);

    // Duration & Mode Floating Badge
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(15, 44, 60, 10, 2, 2, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(`DURATION: ${lvl.duration.toUpperCase()}`, 45, 50.5, { align: "center" });

    doc.setFillColor(30, 41, 59);
    doc.roundedRect(80, 44, 60, 10, 2, 2, "F");
    doc.setTextColor(56, 189, 248);
    doc.setFontSize(8.5);
    doc.text(lvl.mode.toUpperCase(), 110, 50.5, { align: "center" });

    // Description Box
    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(51, 65, 85);
    doc.roundedRect(15, 58, pageWidth - 30, 16, 2, 2, "FD");

    doc.setTextColor(241, 245, 249);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Focus & Outcomes:", 20, 65);
    doc.setTextColor(203, 213, 225);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(lvl.description, 20, 70);

    // Course Content Grid Header
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(15, 80, pageWidth - 30, 8, 2, 2, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("COMPREHENSIVE COURSE CONTENT & MODULE BREAKDOWN", pageWidth / 2, 85.5, { align: "center" });

    // Module Topics Grid (2 Columns)
    let curY = 94;
    const colW = (pageWidth - 36) / 2;

    if (lvl.topics.length === 1 && !("category" in lvl.topics[0] && lvl.topics[0].category)) {
      // 2-column single item list (Starter Level)
      const allItems = lvl.topics[0].items;
      const half = Math.ceil(allItems.length / 2);
      const col1 = allItems.slice(0, half);
      const col2 = allItems.slice(half);

      [col1, col2].forEach((items, cIdx) => {
        const cx = 15 + cIdx * (colW + 6);
        let cy = curY;
        items.forEach(item => {
          doc.setFillColor(15, 23, 42);
          doc.setDrawColor(51, 65, 85);
          doc.setLineWidth(0.3);
          doc.roundedRect(cx, cy, colW, 8.5, 1.5, 1.5, "FD");

          doc.setTextColor(34, 197, 94);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.text("✔", cx + 3, cy + 5.5);

          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.text(item, cx + 9, cy + 5.5);

          cy += 10.5;
        });
      });
      curY += half * 10.5 + 8;
    } else {
      // Categorized modules (Beginner, Intermediate, Advanced)
      lvl.topics.forEach((topic: { category?: string; items: string[] }, tIdx: number) => {
        const colIndex = tIdx % 2;
        const rowIndex = Math.floor(tIdx / 2);
        const tx = 15 + colIndex * (colW + 6);
        const ty = curY + rowIndex * 48;

        if (ty < pageHeight - 40) {
          doc.setFillColor(15, 23, 42);
          doc.setDrawColor(245, 158, 11);
          doc.setLineWidth(0.4);
          doc.roundedRect(tx, ty, colW, 44, 2, 2, "FD");

          // Topic Category Title
          doc.setFillColor(30, 41, 59);
          doc.roundedRect(tx, ty, colW, 7, 2, 2, "F");
          doc.setTextColor(251, 191, 36);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.text(topic.category?.toUpperCase() || "CORE TOPICS", tx + 4, ty + 5);

          // Items inside Category
          let itemY = ty + 12;
          topic.items.slice(0, 5).forEach(itm => {
            doc.setTextColor(56, 189, 248);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.text("•", tx + 4, itemY);

            doc.setTextColor(241, 245, 249);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.text(itm.substring(0, 38), tx + 8, itemY);
            itemY += 6;
          });
        }
      });
    }

    // Key Highlights Bar at bottom
    doc.setFillColor(2, 6, 23);
    doc.setDrawColor(56, 189, 248);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, pageHeight - 34, pageWidth - 30, 14, 2, 2, "FD");

    doc.setTextColor(56, 189, 248);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("KEY HIGHLIGHTS:", 20, pageHeight - 25);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(lvl.highlights.join("   |   "), 55, pageHeight - 25);

    drawFooter();
  });

  // ==========================================
  // PAGE 6: BUILD YOUR AI FUTURE & CAREER
  // ==========================================
  doc.addPage("a4", "portrait");
  doc.setFillColor(10, 15, 30);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  drawHeaderBanner("BUILD YOUR AI FUTURE", "Career Pathways & Lifetime Support", 6);

  // Big Banner
  doc.setTextColor(245, 158, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LEARN TODAY, BUILD TOMORROW, LEAD THE AI WORLD", pageWidth / 2, 48, { align: "center" });

  // 1. Career Opportunities
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(15, 56, (pageWidth - 36) / 2, 80, 3, 3, "FD");

  doc.setFillColor(245, 158, 11);
  doc.roundedRect(15, 56, (pageWidth - 36) / 2, 9, 3, 3, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("🚀 CAREER OPPORTUNITIES", 15 + (pageWidth - 36) / 4, 62, { align: "center" });

  let cY = 71;
  BMB_BROCHURE_DATA.careerOpportunities.forEach(career => {
    doc.setTextColor(34, 197, 94);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("✔", 20, cY);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(career, 26, cY);
    cY += 8.5;
  });

  // 2. Lifetime Support
  const rightX = 15 + (pageWidth - 36) / 2 + 6;
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(56, 189, 248);
  doc.roundedRect(rightX, 56, (pageWidth - 36) / 2, 80, 3, 3, "FD");

  doc.setFillColor(56, 189, 248);
  doc.roundedRect(rightX, 56, (pageWidth - 36) / 2, 9, 3, 3, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("🛡️ LIFETIME BMB SUPPORT", rightX + (pageWidth - 36) / 4, 62, { align: "center" });

  let lY = 71;
  BMB_BROCHURE_DATA.lifetimeSupport.forEach(supp => {
    doc.setTextColor(245, 158, 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("★", rightX + 5, lY);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(supp, rightX + 11, lY);
    lY += 13.5;
  });

  // Tools & Technologies Cloud Box
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(15, 142, pageWidth - 30, 40, 3, 3, "FD");

  doc.setFillColor(30, 41, 59);
  doc.roundedRect(15, 142, pageWidth - 30, 8, 3, 3, "F");
  doc.setTextColor(251, 191, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOOLS & TECHNOLOGIES TAUGHT", pageWidth / 2, 147.5, { align: "center" });

  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const techRow1 = "Python  •  ChatGPT  •  Gemini  •  Claude  •  PyTorch  •  TensorFlow  •  LangChain";
  const techRow2 = "CrewAI  •  OpenCV  •  Pinecone  •  AWS  •  Docker  •  FastAPI  •  Streamlit  •  Zapier";
  doc.text(techRow1, pageWidth / 2, 158, { align: "center" });
  doc.text(techRow2, pageWidth / 2, 168, { align: "center" });

  // Contact & Admission Desk Box
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.8);
  doc.roundedRect(15, 188, pageWidth - 30, 70, 3, 3, "FD");

  doc.setFillColor(245, 158, 11);
  doc.roundedRect(15, 188, pageWidth - 30, 10, 3, 3, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("OFFICIAL CONTACT & ADMISSION ENQUIRY", pageWidth / 2, 194.5, { align: "center" });

  // Bhilai
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("BHILAI CENTER", 25, 206);
  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("GE Road, Karma Bhawan, Supela, Bhilai", 25, 212);
  doc.setTextColor(56, 189, 248);
  doc.setFont("helvetica", "bold");
  doc.text("📞 940 795 5315 / 940 795 5318", 25, 218);

  // Rajnandgaon
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("RAJNANDGAON CENTER", 115, 206);
  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("1st Floor, Above Tathagat Coaching, GE Road, Bhadoriya Chowk", 115, 212);
  doc.setTextColor(56, 189, 248);
  doc.setFont("helvetica", "bold");
  doc.text("📞 790 990 9903 / 790 990 9906", 115, 218);

  doc.setTextColor(251, 191, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Admissions Helpline & WhatsApp Support: +91 94079 55315", pageWidth / 2, 232, { align: "center" });

  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Official Portal: www.bmbeducom.com  |  Email: admissions@bmbeducom.com", pageWidth / 2, 240, { align: "center" });

  drawFooter();

  return doc;
}
