import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

export interface WhatsAppShareOptions {
  caseOrder: any;
  recipientType: 'Patient' | 'Doctor';
  customPhone?: string;
  letterheadMode?: boolean;
  customMessage?: string;
}

export interface WhatsAppShareResult {
  success: boolean;
  mode: 'server_cloud_api' | 'native_share' | 'desktop_auto_download' | 'link_only' | 'user_cancelled';
  message: string;
  fileName?: string;
  openedWhatsApp?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WhatsAppShareService {
  private api = inject(ApiService);

  /**
   * Check if the device / browser supports direct file sharing via Web Share API
   */
  canShareFilesDirectly(): boolean {
    if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
      return false;
    }

    try {
      const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      return navigator.canShare({ files: [testFile] });
    } catch {
      return false;
    }
  }

  /**
   * Send the actual PDF file to WhatsApp.
   * 1. On Desktop: Opens WhatsApp Web synchronously to avoid browser popup blocker,
   *    then downloads the real PDF file to computer and shows step-by-step guidance.
   * 2. On Mobile/Tablet: Uses Web Share API to attach the real PDF file directly into WhatsApp.
   */
  async sendReportPdf(options: WhatsAppShareOptions): Promise<WhatsAppShareResult> {
    const c = options.caseOrder;
    const token = this.resolveReportToken(c);
    const caseNo = c.caseNumber || 'Report';
    const patientName = c.patientName || c.patient?.fullName || 'Patient';
    const docName = c.doctorName || c.referringDoctor?.doctorName || 'Doctor';
    const docTitle = docName.trim().toLowerCase().startsWith('dr') ? docName.trim() : `Dr. ${docName.trim()}`;
    const letterhead = options.letterheadMode ?? true;

    const rawPhone = options.customPhone || 
      (options.recipientType === 'Patient' ? (c.patientPhone || c.patient?.phone) : (c.doctorPhone || c.referringDoctor?.phone));
    
    const targetPhone = this.formatWhatsAppPhone(rawPhone);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const downloadUrl = `${origin}/report/download/${token}`;

    const messageText = options.customMessage || (options.recipientType === 'Patient'
      ? `*Namaste ${patientName} Ji*,\n\nAapki Diagnostic Test Report ready aur verify ho chuki hai (Case No: *${caseNo}*).\n\n📄 *Official PDF Report document is attached below.*\n\n🔗 *Online View/Download Link:*\n${downloadUrl}\n\n_Thank you for choosing DigitalLab!_`
      : `*Respected ${docTitle}*,\n\nDiagnostic Test Report for referred patient *${patientName}* (Case No: *${caseNo}*) has been verified and attached as PDF document.\n\n🔗 *Online View:*\n${downloadUrl}\n\n_Thank you for your valuable referral!_`);

    const isNativeShareSupported = this.canShareFilesDirectly();

    // On Desktop, open WhatsApp Web synchronously right now to prevent browser popup blocking!
    let desktopWin: Window | null = null;
    if (!isNativeShareSupported) {
      const waUrl = targetPhone 
        ? `https://web.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(messageText)}`
        : `https://web.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
      desktopWin = window.open(waUrl, '_blank');
    }

    // Fetch the PDF binary blob
    let blob: Blob;
    try {
      if (token) {
        blob = await firstValueFrom(this.api.getPublicReportPdfBlob(token, letterhead));
      } else {
        blob = await firstValueFrom(this.api.getCaseReportPdfBlob(c.id, letterhead));
      }
    } catch (fetchErr) {
      console.error('Failed to generate/fetch report PDF blob:', fetchErr);
      throw new Error('Could not generate PDF report from server. Please verify report status.');
    }

    const fileName = `Report_${caseNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

    // If mobile native share supported:
    if (isNativeShareSupported) {
      try {
        await navigator.share({
          title: `Report - ${caseNo}`,
          text: messageText,
          files: [pdfFile]
        });

        return {
          success: true,
          mode: 'native_share',
          message: 'PDF file attached directly to device share sheet!',
          fileName
        };
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') {
          return {
            success: false,
            mode: 'user_cancelled',
            message: 'Sharing was cancelled by user.'
          };
        }
        console.warn('Native navigator.share failed, switching to desktop download fallback:', shareErr);
      }
    }

    // Trigger auto-download so the user has the actual PDF file on their machine
    this.triggerBlobDownload(blob, fileName);

    return {
      success: true,
      mode: 'desktop_auto_download',
      message: `PDF '${fileName}' download ho chuki hai! WhatsApp Web khul gaya hai - chat me 📎 Attach ➔ Document karein ya PDF ko drag & drop karein.`,
      fileName,
      openedWhatsApp: !!(desktopWin && !desktopWin.closed)
    };
  }

  /**
   * Send regular WhatsApp Link only (lightweight text share)
   */
  sendReportLinkOnly(options: WhatsAppShareOptions): { opened: boolean; targetPhone: string; message: string } {
    const c = options.caseOrder;
    const token = this.resolveReportToken(c);
    const caseNo = c.caseNumber || 'Report';
    const patientName = c.patientName || c.patient?.fullName || 'Patient';
    const docName = c.doctorName || c.referringDoctor?.doctorName || 'Doctor';
    const docTitle = docName.trim().toLowerCase().startsWith('dr') ? docName.trim() : `Dr. ${docName.trim()}`;

    const rawPhone = options.customPhone || 
      (options.recipientType === 'Patient' ? (c.patientPhone || c.patient?.phone) : (c.doctorPhone || c.referringDoctor?.phone));
    
    const targetPhone = this.formatWhatsAppPhone(rawPhone);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const downloadUrl = `${origin}/report/download/${token}`;

    const message = options.customMessage || (options.recipientType === 'Patient'
      ? `*Namaste ${patientName} Ji*,\n\nAapki Diagnostic Test Report ready aur verify ho chuki hai (Case No: *${caseNo}*).\n\n📄 *Apni Verified Report Download karein:*\n${downloadUrl}\n\n_Thank you for choosing our Laboratory!_`
      : `*Respected ${docTitle}*,\n\nDiagnostic Test Report for your referred patient *${patientName}* (Case No: *${caseNo}*) has been verified and approved.\n\n📄 *View Verified Report:*\n${downloadUrl}\n\n_Thank you for your valuable referral!_`);

    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const waUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;

    if (isMobile) {
      window.location.href = waUrl;
      return { opened: true, targetPhone, message };
    } else {
      const win = window.open(waUrl, '_blank');
      return { opened: !!(win && !win.closed && typeof win.closed !== 'undefined'), targetPhone, message };
    }
  }

  /**
   * Helper to download blob directly to the user's computer/device
   */
  triggerBlobDownload(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 5000);
  }

  /**
   * Format Indian or international phone number
   */
  formatWhatsAppPhone(rawPhone?: string): string {
    const digits = (rawPhone || '').replace(/\D/g, '');
    if (!digits || digits.length < 10) return '';
    if (digits.length === 10) return `91${digits}`;
    if (digits.startsWith('91') && digits.length === 12) return digits;
    if (digits.length > 10) return digits;
    return `91${digits}`;
  }

  resolveReportToken(c: any): string | null {
    const isValid = (val: any) =>
      val &&
      val !== 'undefined' &&
      val !== 'null' &&
      val !== '00000000-0000-0000-0000-000000000000';

    return isValid(c.publicAccessToken)
      ? c.publicAccessToken
      : (isValid(c.PublicAccessToken)
          ? c.PublicAccessToken
          : (isValid(c.id) ? c.id : c.caseNumber));
  }
}
