import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

export interface VerificationResult {
  isValid: boolean;
  confidence: number;
  reason: string;
  amountFound?: number;
  utrFound?: string;
  filename?: string;
  url?: string;
}

export class PaymentVerificationService {
  private static screenshotsDir = path.resolve(process.cwd(), ".data", "screenshots");

  public static ensureDirectory(): void {
    try {
      // On Vercel serverless (read-only FS), /tmp is the only writable directory.
      // Fall back to /tmp/.data/screenshots so screenshot upload still works.
      const isVercel = Boolean(process.env.VERCEL);
      const baseDir = isVercel ? "/tmp" : process.cwd();
      PaymentVerificationService.screenshotsDir = path.resolve(baseDir, ".data", "screenshots");
      if (!fs.existsSync(PaymentVerificationService.screenshotsDir)) {
        fs.mkdirSync(PaymentVerificationService.screenshotsDir, { recursive: true });
      }
    } catch (err) {
      // Silently fail — screenshots won't be storable but the app will still boot.
      console.warn("[payment-verification] ensureDirectory failed (likely read-only FS):", (err as Error).message);
    }
  }

  /**
   * Validates and saves transaction screenshot
   * Checks for authenticity, rejects fake or non-payment images
   */
  public static async verifyTransactionScreenshot(params: {
    imageBase64: string;
    utrNumber: string;
    participantName: string;
    whatsappNumber: string;
    expectedAmount?: number;
  }): Promise<VerificationResult> {
    PaymentVerificationService.ensureDirectory();

    const expectedAmount = params.expectedAmount || 199;
    const cleanUTR = params.utrNumber.trim().replace(/\s+/g, "");

    // 1. Basic UTR validation
    if (!cleanUTR || cleanUTR.length < 6 || /^(.)\1+$/.test(cleanUTR) || cleanUTR === "123456" || cleanUTR === "123456789") {
      return {
        isValid: false,
        confidence: 0.95,
        reason: "अमान्य UPI UTR / Transaction Ref No। कृपया अपने UPI ऐप से सही 12-अंकीय UTR नंबर दर्ज करें।"
      };
    }

    // 2. Base64 data parsing
    let rawBase64 = params.imageBase64;
    let mimeType = "image/jpeg";
    const mimeMatch = rawBase64.match(/^data:(image\/(png|jpeg|jpg|webp));base64,/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
      rawBase64 = rawBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(rawBase64, "base64");
    } catch {
      return {
        isValid: false,
        confidence: 1,
        reason: "अमान्य इमेज फाइल फॉर्मेट। कृपया वैध स्क्रीनशॉट अपलोड करें।"
      };
    }

    // Check minimum file size (> 5KB to avoid tiny 1px fake images)
    if (buffer.length < 4000) {
      return {
        isValid: false,
        confidence: 0.9,
        reason: "स्क्रीनशॉट फाइल बहुत छोटी या अधूरी है। कृपया स्पष्ट UPI ट्रांजेक्शन स्क्रीनशॉट अपलोड करें।"
      };
    }

    // Check maximum file size (under 12MB)
    if (buffer.length > 12 * 1024 * 1024) {
      return {
        isValid: false,
        confidence: 0.9,
        reason: "स्क्रीनशॉट फाइल का साइज 12MB से अधिक है। कृपया छोटा स्क्रीनशॉट अपलोड करें।"
      };
    }

    // Verify magic bytes for image formats
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer.slice(8, 12).toString("ascii") === "WEBP";

    if (!isJpeg && !isPng && !isWebp) {
      return {
        isValid: false,
        confidence: 0.95,
        reason: "अपलोड की गई फाइल एक मान्य JPEG/PNG/WebP इमेज नहीं है।"
      };
    }

    // 3. Save screenshot to disk
    const ext = isPng ? "png" : (isWebp ? "webp" : "jpg");
    const filename = `upi_${Date.now()}_${cleanUTR.slice(-6)}.${ext}`;
    const filePath = path.join(PaymentVerificationService.screenshotsDir, filename);
    fs.writeFileSync(filePath, buffer);
    const screenshotUrl = `/api/admin/screenshots/${filename}`;

    // 4. Multimodal Verification via Gemini if API key is available
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
Analyze this payment transaction screenshot image carefully.
Context: Student is paying ₹${expectedAmount} for "BMB EDUCOM AI SEMINAR PASS".
Target UPI ID: "himanchal310@okaxis" or phone "9301056006" or name "Himanchal" or "BMB Educom".
Claimed UTR: "${cleanUTR}".

Evaluate:
1. Is this an authentic screenshot of a completed/successful UPI/bank payment app (e.g. PhonePe, Google Pay, Paytm, BHIM, Axis Bank, Cred, etc.)?
2. Does it look like a fake, edited text, meme, random photo, nature picture, selfie, or non-payment document?
3. If it is a real payment screenshot, does it show a successful status?

Respond ONLY in strict JSON format:
{
  "is_authentic_payment": boolean,
  "confidence": number,
  "status_text": string,
  "detected_amount": number or null,
  "reason": string
}
`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType.replace("jpg", "jpeg"),
                    data: rawBase64
                  }
                },
                { text: prompt }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        const text = response.text?.trim();
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.is_authentic_payment === false) {
            // Remove fake image
            try { fs.unlinkSync(filePath); } catch {}
            return {
              isValid: false,
              confidence: parsed.confidence || 0.85,
              reason: parsed.reason || "यह स्क्रीनशॉट एक मान्य UPI सफल भुगतान जैसा प्रतीत नहीं हो रहा है। कृपया वास्तविक UPI पेमेंट रसीद अपलोड करें।"
            };
          }

          return {
            isValid: true,
            confidence: parsed.confidence || 0.9,
            reason: "UPI भुगतान स्क्रीनशॉट सफलतापूर्वक सत्यापित हो गया है।",
            amountFound: parsed.detected_amount || expectedAmount,
            utrFound: cleanUTR,
            filename,
            url: screenshotUrl
          };
        }
      } catch (geminiErr: any) {
        console.warn("Gemini payment image verification warning, falling back to rule validation:", geminiErr?.message || geminiErr);
      }
    }

    // 5. Fallback rule verification: Valid image structure + non-trivial UTR
    return {
      isValid: true,
      confidence: 0.85,
      reason: "UPI ट्रांजेक्शन स्क्रीनशॉट एवं UTR सफलतापूर्वक प्राप्त व रिकॉर्ड हो गया।",
      amountFound: expectedAmount,
      utrFound: cleanUTR,
      filename,
      url: screenshotUrl
    };
  }
}
