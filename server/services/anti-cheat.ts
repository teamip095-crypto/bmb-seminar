import crypto from "crypto";

export class AntiCheatService {
  /**
   * Generates a high-entropy random token
   */
  public static generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Hashes a token with SHA-256 for secure database storage
   */
  public static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Generates a unique Registration ID e.g. BMB-20260904-7F8A
   */
  public static generateRegistrationId(eventDate: string): string {
    const cleanDate = eventDate.replace(/-/g, "");
    const randomSuffix = crypto.randomBytes(2).toString("hex").toUpperCase();
    return `BMB-${cleanDate}-${randomSuffix}`;
  }

  /**
   * Creates a display name e.g. "Rahul S. (Jaipur)" or "Rahul S." for privacy-safe leaderboard
   */
  public static createDisplayName(name: string, city?: string): string {
    const parts = name.trim().split(" ");
    let baseName = parts[0];
    if (parts.length > 1) {
      const lastInitial = parts[parts.length - 1][0].toUpperCase();
      baseName = `${parts[0]} ${lastInitial}.`;
    }
    if (city && city.trim()) {
      return `${baseName} (${city.trim()})`;
    }
    return baseName;
  }

  /**
   * Validates if a quiz attempt is within the server-authoritative 120 seconds time limit
   * (allows 5-second grace period for network latency on auto-submit)
   */
  public static isAttemptExpired(startedAt: string, graceSeconds: number = 5): boolean {
    const startTime = new Date(startedAt).getTime();
    const now = Date.now();
    const maxAllowedMs = (120 + graceSeconds) * 1000;
    return (now - startTime) > maxAllowedMs;
  }
}
