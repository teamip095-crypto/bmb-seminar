import { db } from "../db/database";
import { WhatsAppMessage } from "../db/schema";

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

    return `🎓 *BMB EDUCOM — AI SEMINAR ADMISSION PASS*

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
*(इस लिंक पर क्लिक करके आप About AI देख सकते हैं और 2-मिनट का लाइव क्विज दे सकते हैं)*

━━━━━━━━━━━━━━━━━━━━
📄 *OFFICIAL AI SYLLABUS & BROCHURE (PDF):*
━━━━━━━━━━━━━━━━━━━━
👉 *ब्रोशर अभी डाउनलोड करें (Official AI Brochure):*
${params.pdfDownloadUrl || "https://acesse.one/bq9atwd"}

💡 *कृपया ध्यान दें:* सेमिनार में ${reporting} तक रिपोर्ट करें या ऐप पर लाइव जुड़ें। सेमिनार के बाद 2-मिनट का AI क्विज़ होगा जिसमें आपको मिलेगा आकर्षक उपहार।

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
}

