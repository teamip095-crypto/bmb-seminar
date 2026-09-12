import { buildExactOriginalBmbBrochure } from "../generate-official-brochure";

export interface PassPdfParams {
  name?: string;
  registrationId?: string;
  seatNumber?: string;
  seminarDateHi?: string;
  seminarDateEn?: string;
  seminarTime?: string;
  whatsappNumber?: string;
  fullAddress?: string;
  secureLink?: string;
}

export class ServerPdfService {
  /**
   * Generates the 6-page exact original BMB AI Training Brochure PDF buffer
   */
  public static generateBrochurePdfBuffer(passData?: PassPdfParams): Buffer {
    return buildExactOriginalBmbBrochure();
  }
}
