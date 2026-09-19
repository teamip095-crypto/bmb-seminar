import { db } from "../db/database";
import { WhatsAppMessage, SeminarPassPurchase } from "../db/schema";

export interface WhatsAppSendResult {
  messageId: string;
  status: WhatsAppMessage["status"];
  error?: string;
  directWhatsAppLink: string;
  renderedText: string;
}

export class WhatsAppService {
  /**
   * Generates the personalized WhatsApp message text for a registered participant
   * Includes Seat Number, Seminar Date & Time, Personal Learning Pass, Venue, and PDF Brochure Link
   */
  public static generateRegistrationMessageText(params: {
    name: string;
    registrationId: string;
    seatNumber: string;
    seminarDateEn: string;
    seminarDateHi: string;
    seminarTime?: string;
    seminarVenue?: string;
    reportingTime?: string;
    secureLink: string;
    pdfDownloadUrl: string;
  }): string {
    const time = params.seminarTime || "11:00 AM – 4:00 PM IST";
    const venue = params.seminarVenue || "BMB Educom टेक हब (जयपुर / ऑनलाइन एक्सेस)";
    const reporting = params.reportingTime || "10:45 AM";

    return `🎓 *BMB Educom AI Seminar Admission Pass*

नमस्ते *${params.name}* जी,
बधाई हो! BMB Educom के विशेष AI सेमिनार "FROM ZERO TO AI EXPERT" में आपका रजिस्ट्रेशन सफलतापूर्वक कन्फर्म हो चुका है।

━━━━━━━━━━━━━━━━━━━━
🎟️ *SEMINAR ADMISSION DETAILS:*
━━━━━━━━━━━━━━━━━━━━
💺 *Reserved Seat No:* *${params.seatNumber}*
📌 *Registration ID:* ${params.registrationId}
📅 *सेमिनार दिनांक:* ${params.seminarDateHi} (${params.seminarDateEn})
⏰ *समय:* ${time}
📍 *स्थान:* ${venue}

━━━━━━━━━━━━━━━━━━━━
🔗 *YOUR PERSONAL SEMINAR ACCESS PASS:*
━━━━━━━━━━━━━━━━━━━━
${params.secureLink}
*(इस लिंक पर क्लिक करके आप About BMB Educom देख सकते हैं और 20 प्रश्नों का AI स्कॉलरशिप क्विज खेल सकते हैं)*

━━━━━━━━━━━━━━━━━━━━
📄 *OFFICIAL AI SYLLABUS & BROCHURE (PDF):*
━━━━━━━━━━━━━━━━━━━━
👉 *ब्रोशर अभी डाउनलोड करें (Official AI Brochure):*
${params.pdfDownloadUrl || "https://acesse.one/bq9atwd"}

💡 *कृपया ध्यान दें:* सेमिनार में ${reporting} तक रिपोर्ट करें या ऐप पर लाइव जुड़ें। सेमिनार के बाद 20 प्रश्नों का AI स्कॉलरशिप क्विज़ होगा जिसमें आप नकद पुरस्कार (Cash Prizes) जीत सकते हैं।

— BMB Educom`;
  }

  /**
   * Sends the official confirmation WhatsApp message or logs truthfully if API credentials are not configured
   */
  public static async sendRegistrationConfirmation(params: {
    participantId: string;
    phoneNumber: string;
    name: string;
    registrationId: string;
    seatNumber: string;
    seminarDateEn: string;
    seminarDateHi: string;
    seminarTime?: string;
    seminarVenue?: string;
    reportingTime?: string;
    secureLink: string;
    pdfDownloadUrl: string;
  }): Promise<WhatsAppSendResult> {
    const renderedText = WhatsAppService.generateRegistrationMessageText(params);
    const cleanPhone = params.phoneNumber.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // Build direct click-to-chat fallback link
    const directWhatsAppLink = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(renderedText)}`;

    // Initial database log
    const msgRecord = db.logWhatsAppMessage({
      participant_id: params.participantId,
      phone_number: params.phoneNumber,
      message_type: "registration_confirmation",
      message_content: renderedText,
      status: "queued"
    });

    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    // Truthful credential checking
    if (!apiToken || !phoneNumberId) {
      db.updateWhatsAppMessageStatus(
        msgRecord.id,
        "pending_configuration",
        "Official WhatsApp Cloud API credentials not configured in environment."
      );
      return {
        messageId: msgRecord.id,
        status: "pending_configuration",
        error: "WhatsApp API credentials pending configuration. Use direct 1-click WhatsApp link below.",
        directWhatsAppLink,
        renderedText
      };
    }

    try {
      const endpoint = apiUrl || `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: {
            preview_url: true,
            body: renderedText
          }
        })
      });

      const responseData = await response.json();

      if (response.ok && responseData.messages?.[0]?.id) {
        db.updateWhatsAppMessageStatus(msgRecord.id, "sent");
        return {
          messageId: msgRecord.id,
          status: "sent",
          directWhatsAppLink,
          renderedText
        };
      } else {
        const errMsg = responseData.error?.message || "WhatsApp provider rejected message";
        db.updateWhatsAppMessageStatus(msgRecord.id, "failed", errMsg);
        return {
          messageId: msgRecord.id,
          status: "failed",
          error: errMsg,
          directWhatsAppLink,
          renderedText
        };
      }
    } catch (err: any) {
      const errorStr = String(err?.message || err);
      db.updateWhatsAppMessageStatus(msgRecord.id, "failed", errorStr);
      return {
        messageId: msgRecord.id,
        status: "failed",
        error: errorStr,
        directWhatsAppLink,
        renderedText
      };
    }
  }

  /**
   * Generates and sends a 6-digit Super Admin Password Recovery OTP via WhatsApp
   */
  public static async sendAdminPasswordResetOTP(params: {
    adminId: string;
    adminName: string;
    phoneNumber: string;
    otp: string;
    expiresInMinutes: number;
  }): Promise<WhatsAppSendResult> {
    const renderedText = `🔐 *BMB EDUCOM — SUPER ADMIN PASSWORD RECOVERY*

नमस्ते *${params.adminName}* जी,
आपके BMB Super Admin अकाउंट के पासवर्ड रीसेट का अनुरोध प्राप्त हुआ है।

━━━━━━━━━━━━━━━━━━━━
🔑 *YOUR 6-DIGIT RECOVERY OTP:*
*${params.otp}*
━━━━━━━━━━━━━━━━━━━━

⏱️ यह सुरक्षा OTP अगले *${params.expiresInMinutes} मिनट* के लिए मान्य है।
कृपया यह कोड किसी अन्य व्यक्ति के साथ साझा न करें।

यदि आपने यह अनुरोध नहीं किया है, तो कृपया तुरंत अपने BMB IT एडमिनिस्ट्रेटर से संपर्क करें।

— BMB Educom Security Operations`;

    const cleanPhone = params.phoneNumber.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const directWhatsAppLink = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(renderedText)}`;

    const msgRecord = db.logWhatsAppMessage({
      participant_id: params.adminId,
      phone_number: params.phoneNumber,
      message_type: "admin_otp_recovery",
      message_content: renderedText,
      status: "queued"
    });

    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!apiToken || !phoneNumberId) {
      db.updateWhatsAppMessageStatus(
        msgRecord.id,
        "pending_configuration",
        "Official WhatsApp Cloud API credentials not configured in environment."
      );
      return {
        messageId: msgRecord.id,
        status: "pending_configuration",
        error: "WhatsApp API credentials pending configuration.",
        directWhatsAppLink,
        renderedText
      };
    }

    try {
      const endpoint = apiUrl || `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: {
            preview_url: false,
            body: renderedText
          }
        })
      });

      const responseData = await response.json();

      if (response.ok && responseData.messages?.[0]?.id) {
        db.updateWhatsAppMessageStatus(msgRecord.id, "sent");
        return {
          messageId: msgRecord.id,
          status: "sent",
          directWhatsAppLink,
          renderedText
        };
      } else {
        const errMsg = responseData.error?.message || "WhatsApp provider rejected message";
        db.updateWhatsAppMessageStatus(msgRecord.id, "failed", errMsg);
        return {
          messageId: msgRecord.id,
          status: "failed",
          error: errMsg,
          directWhatsAppLink,
          renderedText
        };
      }
    } catch (err: any) {
      const errorStr = String(err?.message || err);
      db.updateWhatsAppMessageStatus(msgRecord.id, "failed", errorStr);
      return {
        messageId: msgRecord.id,
        status: "failed",
        error: errorStr,
        directWhatsAppLink,
        renderedText
      };
    }
  }

  /**
   * Sends confirmation when password has been successfully reset
   */
  public static async sendAdminPasswordChangeConfirmation(params: {
    adminId: string;
    adminName: string;
    phoneNumber: string;
  }): Promise<WhatsAppSendResult> {
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const renderedText = `✅ *BMB EDUCOM — SUPER ADMIN PASSWORD UPDATED*

नमस्ते *${params.adminName}* जी,
आपके BMB Super Admin अकाउंट का पासवर्ड सफलतापूर्वक बदल दिया गया है।

🕒 *परिवर्तन का समय:* ${timestamp} IST
🛡️ *अकाउंट सुरक्षा:* एक्टिव (Active)

अब आप अपने नए पासवर्ड से BMB Super Admin कमांड सेंटर में लॉगिन कर सकते हैं।

— BMB Educom Security Team`;

    const cleanPhone = params.phoneNumber.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const directWhatsAppLink = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(renderedText)}`;

    const msgRecord = db.logWhatsAppMessage({
      participant_id: params.adminId,
      phone_number: params.phoneNumber,
      message_type: "admin_password_updated",
      message_content: renderedText,
      status: "queued"
    });

    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!apiToken || !phoneNumberId) {
      db.updateWhatsAppMessageStatus(msgRecord.id, "pending_configuration");
      return {
        messageId: msgRecord.id,
        status: "pending_configuration",
        directWhatsAppLink,
        renderedText
      };
    }

    try {
      const endpoint = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: {
            preview_url: false,
            body: renderedText
          }
        })
      });

      const responseData = await response.json();
      if (response.ok && responseData.messages?.[0]?.id) {
        db.updateWhatsAppMessageStatus(msgRecord.id, "sent");
        return {
          messageId: msgRecord.id,
          status: "sent",
          directWhatsAppLink,
          renderedText
        };
      }
      return {
        messageId: msgRecord.id,
        status: "failed",
        directWhatsAppLink,
        renderedText
      };
    } catch {
      return {
        messageId: msgRecord.id,
        status: "failed",
        directWhatsAppLink,
        renderedText
      };
    }
  }

  /**
   * Generates student invoice + pass receipt text with thanks note
   */
  public static generatePassInvoiceMessageText(purchase: SeminarPassPurchase): string {
    const isFree = purchase.payment_method === "free_pass";
    const settings = db.getSeminarSettings();
    const originalPrice = purchase.original_amount || 500;
    const paidAmount = purchase.amount_paid;
    const savings = originalPrice - paidAmount;

    return `🎟️ *BMB EDUCOM AI SEMINAR PASS & INVOICE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🙏 *हार्दिक धन्यवाद एवं बधाई!* (Thank You Note)
नमस्ते *${purchase.participant_name}* जी,
BMB Educom के मेगा AI सेमिनार "FROM ZERO TO AI EXPERT" का ऑफिशियल पास प्राप्त करने के लिए आपका धन्यवाद। आपका पेमेंट सफलतापूर्वक सत्यापित हो चुका है।

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧾 *OFFICIAL PAYMENT INVOICE & RECEIPT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Invoice Number:* ${purchase.invoice_number}
🏷️ *Pass ID:* ${purchase.id}
💳 *भुगतान माध्यम:* ${isFree ? "100% Free Pass (Round 1 Top 10 Winner)" : "UPI QR Code (" + purchase.upi_id + ")"}
🔢 *UPI UTR / Ref No:* ${purchase.utr_number}
📅 *दिनांक व समय:* ${new Date(purchase.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *FEE BREAKDOWN & SAVINGS:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
• सेमिनार पास वास्तविक मूल्य: ₹${originalPrice}/-
• आपका विशेष ऑफर शुल्क: *₹${paidAmount}/-* ${isFree ? "(100% FREE)" : "(विशेष रियायती दर)"}
• आपकी कुल बचत: *₹${savings}/- की सीधी बचत!*

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 *STAGE 2: MEGA SEMINAR AI QUIZ ACCESS UNLOCKED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
आपके इस पास के साथ सेमिनार में 10 प्रश्नों (5 मिनट) का मेगा AI क्विज खेलने का अवसर अनलॉक हो गया है:
🥇 *1st Winner:* ₹${(settings.cash_prize_1st || 3000).toLocaleString("en-IN")}/- नकद + ₹${(settings.scholarship_1st || 10000).toLocaleString("en-IN")}/- BMB स्कॉलरशिप
🥈 *2nd Winner:* ₹${(settings.cash_prize_2nd || 2000).toLocaleString("en-IN")}/- नकद + ₹${(settings.scholarship_2nd || 8000).toLocaleString("en-IN")}/- BMB स्कॉलरशिप
🥉 *3rd Winner:* ₹${(settings.cash_prize_3rd || 1500).toLocaleString("en-IN")}/- नकद + ₹${(settings.scholarship_3rd || 5000).toLocaleString("en-IN")}/- BMB स्कॉलरशिप
🎁 *Rank 4–20 (17 Winners):* आकर्षक उपहार + ₹${(settings.scholarship_4_to_20 || 1000).toLocaleString("en-IN")}/- BMB स्कॉलरशिप
📜 *अन्य सभी प्रतिभागी:* ₹${(settings.scholarship_participation || 500).toLocaleString("en-IN")}/- स्कॉलरशिप + ई-सर्टिफिकेट

⚠️ *स्कॉलरशिप नियम व शर्तें:*
1. स्कॉलरशिप BMB EDUCOM AI SEMINAR की तारीख से केवल 15 दिनों तक मान्य होगी।
2. यह BMB Educom के किसी भी कोर्स में एडमिशन फीस डिस्काउंट हेतु मान्य है।
3. कोर्स का शुल्क डिस्काउंट राशि के बराबर या कम नहीं होगा।

सेमिनार में समय से उपस्थित हों एवं अपनी डिजिटल रसीद सुरक्षित रखें।
— BMB Educom टीम`;
  }

  /**
   * Generates admin alert text for 9301056006
   */
  public static generateAdminScreenshotNotificationText(purchase: SeminarPassPurchase): string {
    return `🔔 *NEW BMB SEMINAR PASS PAYMENT VERIFIED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Student:* ${purchase.participant_name}
📱 *WhatsApp:* ${purchase.whatsapp_number}
💰 *Amount Paid:* ₹${purchase.amount_paid}/- (Pass Value: ₹${purchase.original_amount}/-)
🧾 *Invoice:* ${purchase.invoice_number}
🔢 *UTR / Ref:* ${purchase.utr_number}
💳 *UPI ID:* ${purchase.upi_id}
🖼️ *Screenshot URL:* ${purchase.screenshot_url || "Uploaded on Server"}
🕒 *Time:* ${new Date(purchase.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}

Automatic invoice & pass has been generated and queued for student.
— BMB Admin Automation`;
  }

  /**
   * Sends both student invoice and admin notification (to 9301056006)
   */
  public static async sendPassInvoiceNotification(purchase: SeminarPassPurchase): Promise<{
    studentResult: WhatsAppSendResult;
    adminResult: WhatsAppSendResult;
  }> {
    // 1. Student Message
    const studentText = WhatsAppService.generatePassInvoiceMessageText(purchase);
    const cleanStudentPhone = purchase.whatsapp_number.replace(/\D/g, "");
    const formattedStudentPhone = cleanStudentPhone.length === 10 ? `91${cleanStudentPhone}` : cleanStudentPhone;
    const studentLink = `https://wa.me/${formattedStudentPhone}?text=${encodeURIComponent(studentText)}`;

    const studentMsg = db.logWhatsAppMessage({
      participant_id: purchase.participant_id,
      phone_number: formattedStudentPhone,
      message_type: "admission_pass",
      message_content: studentText,
      status: "pending_configuration"
    });

    // 2. Admin Message to 9301056006
    const adminText = WhatsAppService.generateAdminScreenshotNotificationText(purchase);
    const adminPhone = "919301056006";
    const adminLink = `https://wa.me/${adminPhone}?text=${encodeURIComponent(adminText)}`;

    const adminMsg = db.logWhatsAppMessage({
      participant_id: purchase.participant_id,
      phone_number: adminPhone,
      message_type: "seminar_reminder",
      message_content: adminText,
      status: "pending_configuration"
    });

    const studentResult: WhatsAppSendResult = {
      messageId: studentMsg.id,
      status: "pending_configuration",
      directWhatsAppLink: studentLink,
      renderedText: studentText
    };

    const adminResult: WhatsAppSendResult = {
      messageId: adminMsg.id,
      status: "pending_configuration",
      directWhatsAppLink: adminLink,
      renderedText: adminText
    };

    // Attempt direct Graph API dispatch if credentials configured
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (apiToken && phoneNumberId) {
      try {
        const endpoint = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
        // Send to student
        await fetch(endpoint, {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: formattedStudentPhone,
            type: "text",
            text: { preview_url: false, body: studentText }
          })
        });
        db.updateWhatsAppMessageStatus(studentMsg.id, "sent");
        studentResult.status = "sent";

        // Send to admin (9301056006)
        await fetch(endpoint, {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: adminPhone,
            type: "text",
            text: { preview_url: false, body: adminText }
          })
        });
        db.updateWhatsAppMessageStatus(adminMsg.id, "sent");
        adminResult.status = "sent";
      } catch (err) {
        console.warn("WhatsApp Cloud API send failed:", err);
      }
    }

    return { studentResult, adminResult };
  }
}

