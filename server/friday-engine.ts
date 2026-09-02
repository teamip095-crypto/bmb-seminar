import { db } from "./db/database";
import { SeminarEvent } from "./db/schema";

export interface FridaySeminarStatus {
  event: SeminarEvent;
  isToday: boolean;
  isActiveNow: boolean;
  isRegistrationOpen: boolean;
  formattedDateHi: string;
  formattedDateEn: string;
  countdownSeconds: number;
  serverTimeIST: string;
}

export class FridayEngine {
  /**
   * Returns current time in Asia/Kolkata timezone
   */
  public static getNowIST(): {
    date: Date;
    year: number;
    month: number; // 1-12
    day: number;
    dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    hours: number;
    minutes: number;
    seconds: number;
    dateString: string; // YYYY-MM-DD
    timeString: string; // HH:mm:ss
    isoString: string;
  } {
    const now = new Date();
    // Convert to IST (UTC +5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + istOffset);

    const year = istTime.getFullYear();
    const month = istTime.getMonth() + 1;
    const day = istTime.getDate();
    const dayOfWeek = istTime.getDay();
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const seconds = istTime.getSeconds();

    const dateString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const timeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    return {
      date: istTime,
      year,
      month,
      day,
      dayOfWeek,
      hours,
      minutes,
      seconds,
      dateString,
      timeString,
      isoString: istTime.toISOString()
    };
  }

  /**
   * Computes the target Friday YYYY-MM-DD based on the server-authoritative rules
   */
  public static computeTargetFridayDate(simulatedDate?: Date): {
    targetFridayDate: string;
    isToday: boolean;
    isActiveNow: boolean;
  } {
    let nowIST = FridayEngine.getNowIST();
    if (simulatedDate) {
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(simulatedDate.getTime() + (simulatedDate.getTimezoneOffset() * 60 * 1000) + istOffset);
      nowIST = {
        date: istTime,
        year: istTime.getFullYear(),
        month: istTime.getMonth() + 1,
        day: istTime.getDate(),
        dayOfWeek: istTime.getDay(),
        hours: istTime.getHours(),
        minutes: istTime.getMinutes(),
        seconds: istTime.getSeconds(),
        dateString: `${istTime.getFullYear()}-${String(istTime.getMonth() + 1).padStart(2, "0")}-${String(istTime.getDate()).padStart(2, "0")}`,
        timeString: `${String(istTime.getHours()).padStart(2, "0")}:${String(istTime.getMinutes()).padStart(2, "0")}:${String(istTime.getSeconds()).padStart(2, "0")}`,
        isoString: istTime.toISOString()
      };
    }

    const { dayOfWeek, hours, minutes } = nowIST;
    const currentTotalMinutes = hours * 60 + minutes;
    const seminarStartMinutes = 11 * 60; // 11:00 AM = 660 mins
    const seminarEndMinutes = 16 * 60;   // 04:00 PM = 960 mins

    let daysToAdd = 0;
    let isToday = false;
    let isActiveNow = false;

    if (dayOfWeek === 5) {
      // Friday
      if (currentTotalMinutes < seminarStartMinutes) {
        // Friday before 11:00 AM -> Show today's Friday seminar
        daysToAdd = 0;
        isToday = true;
        isActiveNow = false;
      } else if (currentTotalMinutes <= seminarEndMinutes) {
        // Friday 11:00 AM - 4:00 PM -> Show today's active seminar
        daysToAdd = 0;
        isToday = true;
        isActiveNow = true;
      } else {
        // Friday after 4:00 PM -> Show next Friday (+7 days)
        daysToAdd = 7;
        isToday = false;
        isActiveNow = false;
      }
    } else {
      // Saturday (6), Sunday (0), Mon (1), Tue (2), Wed (3), Thu (4) -> Show next Friday
      // Distance to next Friday:
      // If Sat (6) -> +6 days
      // If Sun (0) -> +5 days
      // If Mon (1) -> +4 days
      // If Tue (2) -> +3 days
      // If Wed (3) -> +2 days
      // If Thu (4) -> +1 day
      daysToAdd = (5 - dayOfWeek + 7) % 7;
      if (daysToAdd === 0) daysToAdd = 7;
    }

    const targetDate = new Date(nowIST.date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    const targetFridayDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;

    return {
      targetFridayDate,
      isToday,
      isActiveNow
    };
  }

  /**
   * Formats a YYYY-MM-DD date into Hindi and English strings
   */
  public static formatEventDates(dateStr: string): { hi: string; en: string } {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));

    const monthsEn = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthsHi = [
      "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
      "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
    ];

    const en = `Friday, ${d} ${monthsEn[m - 1]} ${y}`;
    const hi = `शुक्रवार, ${d} ${monthsHi[m - 1]} ${y}`;

    return { hi, en };
  }

  /**
   * Retrieves or idempotently creates the active/target Friday seminar event
   */
  public static async getOrCreateCurrentSeminar(simulatedDate?: Date): Promise<FridaySeminarStatus> {
    await db.initialize();

    const { targetFridayDate, isToday, isActiveNow } = FridayEngine.computeTargetFridayDate(simulatedDate);
    const formatted = FridayEngine.formatEventDates(targetFridayDate);

    let event = db.getSeminarEventByDate(targetFridayDate);

    if (!event) {
      event = db.createSeminarEvent({
        event_date: targetFridayDate,
        start_time: "11:00",
        end_time: "16:00",
        timezone: "Asia/Kolkata",
        title: `BMB Educom AI Seminar — ${formatted.en}`,
        description: `Official Weekly Friday AI Learning, Quiz & Admission Event (${formatted.hi})`,
        status: isActiveNow ? "active" : "scheduled",
        registration_open: true
      });
    }

    // Calculate seconds remaining until 11:00 AM on the target date
    const nowIST = FridayEngine.getNowIST();
    const [y, m, d] = targetFridayDate.split("-").map(Number);
    const targetStartUTC = new Date(Date.UTC(y, m - 1, d, 5, 30, 0)); // 11:00 IST is 05:30 UTC
    const nowUTC = new Date();
    const countdownSeconds = Math.max(0, Math.round((targetStartUTC.getTime() - nowUTC.getTime()) / 1000));

    return {
      event,
      isToday,
      isActiveNow,
      isRegistrationOpen: event.registration_open && event.status !== "cancelled",
      formattedDateHi: formatted.hi,
      formattedDateEn: formatted.en,
      countdownSeconds,
      serverTimeIST: `${nowIST.dateString} ${nowIST.timeString} IST`
    };
  }
}
