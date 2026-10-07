import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { LetterheadConfig } from '../../core/models/lims.models';

@Component({
  selector: 'app-letterhead',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6" *ngIf="config">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 class="text-xl font-bold text-slate-900 font-heading">Letterhead & Brand Customizer</h2>
          <p class="text-xs text-slate-500">Upload your custom letterhead graphics, set A4 margins, brand logo, and configure pathologist digital signatures.</p>
        </div>
        <div class="flex items-center space-x-3">
          <button (click)="saveConfig()" [disabled]="saving"
            class="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 cursor-pointer">
            <i *ngIf="saving" class="fa-solid fa-spinner fa-spin mr-1.5"></i>
            <i *ngIf="!saving" class="fa-solid fa-floppy-disk mr-1.5"></i>
            Save Settings
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Settings Controls Column -->
        <div class="lg:col-span-6 space-y-6">

          <!-- 1. Letterhead & Graphics Upload Card -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
              <span class="flex items-center">
                <i class="fa-solid fa-cloud-arrow-up text-brand-600 mr-2"></i> Letterhead & Graphic Uploads
              </span>
              <span class="text-[10px] text-slate-400 font-normal">PNG, JPG, WEBP (Max 5MB)</span>
            </h3>

            <!-- Header Letterhead Banner -->
            <div class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-bold text-slate-800 text-xs block">Letterhead Header Banner (Top of A4 Report)</span>
                  <span class="text-[11px] text-slate-500">Upload pre-designed header banner image or letterhead graphic</span>
                </div>
                <div *ngIf="config.headerImageUrl" class="flex items-center space-x-2">
                  <span class="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full border border-emerald-200">Active ✓</span>
                  <button type="button" (click)="removeAsset('header')" class="text-rose-600 hover:text-rose-700 text-xs font-semibold" title="Remove Header Image">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>

              <div *ngIf="config.headerImageUrl" class="relative group rounded-lg overflow-hidden border border-slate-200 bg-white max-h-24 flex items-center justify-center p-1">
                <img [src]="getImageUrl(config.headerImageUrl)" alt="Header Preview" class="max-h-20 w-full object-contain">
              </div>

              <div class="flex items-center space-x-2 pt-1">
                <label class="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm transition-all">
                  <i *ngIf="uploadingAsset === 'header'" class="fa-solid fa-spinner fa-spin mr-1.5 text-brand-600"></i>
                  <i *ngIf="uploadingAsset !== 'header'" class="fa-solid fa-image mr-1.5 text-brand-600"></i>
                  {{ config.headerImageUrl ? 'Change Header Image' : 'Upload Header Image' }}
                  <input type="file" accept="image/*" (change)="onFileSelected($event, 'header')" class="hidden">
                </label>
                <span class="text-[10px] text-slate-400">Replaces text header with custom image</span>
              </div>
            </div>

            <!-- Lab Logo Upload -->
            <div class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-bold text-slate-800 text-xs block">Lab Brand Logo</span>
                  <span class="text-[11px] text-slate-500">Displayed next to lab name in standard header</span>
                </div>
                <div *ngIf="config.logoUrl" class="flex items-center space-x-2">
                  <span class="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full border border-emerald-200">Active ✓</span>
                  <button type="button" (click)="removeAsset('logo')" class="text-rose-600 hover:text-rose-700 text-xs font-semibold" title="Remove Logo">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>

              <div *ngIf="config.logoUrl" class="rounded-lg overflow-hidden border border-slate-200 bg-white h-14 w-14 flex items-center justify-center p-1">
                <img [src]="getImageUrl(config.logoUrl)" alt="Logo Preview" class="max-h-12 max-w-12 object-contain">
              </div>

              <div class="flex items-center space-x-2 pt-1">
                <label class="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm transition-all">
                  <i *ngIf="uploadingAsset === 'logo'" class="fa-solid fa-spinner fa-spin mr-1.5 text-brand-600"></i>
                  <i *ngIf="uploadingAsset !== 'logo'" class="fa-solid fa-shield-cat mr-1.5 text-brand-600"></i>
                  {{ config.logoUrl ? 'Change Logo' : 'Upload Lab Logo' }}
                  <input type="file" accept="image/*" (change)="onFileSelected($event, 'logo')" class="hidden">
                </label>
              </div>
            </div>

            <!-- Footer Banner Upload -->
            <div class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-bold text-slate-800 text-xs block">Letterhead Footer Graphic (Bottom of A4 Report)</span>
                  <span class="text-[11px] text-slate-500">Optional accreditation badges, ISO logos, or contact footer</span>
                </div>
                <div *ngIf="config.footerImageUrl" class="flex items-center space-x-2">
                  <span class="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full border border-emerald-200">Active ✓</span>
                  <button type="button" (click)="removeAsset('footer')" class="text-rose-600 hover:text-rose-700 text-xs font-semibold" title="Remove Footer Image">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>

              <div *ngIf="config.footerImageUrl" class="rounded-lg overflow-hidden border border-slate-200 bg-white max-h-16 flex items-center justify-center p-1">
                <img [src]="getImageUrl(config.footerImageUrl)" alt="Footer Preview" class="max-h-14 w-full object-contain">
              </div>

              <div class="flex items-center space-x-2 pt-1">
                <label class="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm transition-all">
                  <i *ngIf="uploadingAsset === 'footer'" class="fa-solid fa-spinner fa-spin mr-1.5 text-brand-600"></i>
                  <i *ngIf="uploadingAsset !== 'footer'" class="fa-solid fa-image mr-1.5 text-brand-600"></i>
                  {{ config.footerImageUrl ? 'Change Footer Graphic' : 'Upload Footer Graphic' }}
                  <input type="file" accept="image/*" (change)="onFileSelected($event, 'footer')" class="hidden">
                </label>
              </div>
            </div>
          </div>

          <!-- 2. Pathologist Credentials & Digital Signature -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <i class="fa-solid fa-signature text-brand-600 mr-2"></i> Pathologist Digital Signature & Signoff
              </h3>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" [(ngModel)]="config.showDigitalSignature" class="sr-only peer">
                <div class="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                <span class="ml-2 text-xs font-semibold text-slate-700">{{ config.showDigitalSignature ? 'Enabled' : 'Disabled' }}</span>
              </label>
            </div>

            <p class="text-[11px] text-slate-500">
              When enabled, your doctor signoff and credentials appear at the bottom of diagnostic reports. If disabled or left blank, the signature block is removed automatically.
            </p>

            <div *ngIf="config.showDigitalSignature" class="space-y-4 pt-1">
              <!-- Signature Image Upload -->
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-xs">Scanned Signature Image (Optional)</span>
                  <button *ngIf="config.digitalSignatureUrl" type="button" (click)="removeAsset('signature')" class="text-rose-600 hover:text-rose-700 text-xs font-semibold">
                    <i class="fa-solid fa-trash-can mr-1"></i> Remove
                  </button>
                </div>
                <div *ngIf="config.digitalSignatureUrl" class="rounded border border-slate-200 bg-white h-12 w-32 flex items-center justify-center p-1">
                  <img [src]="getImageUrl(config.digitalSignatureUrl)" alt="Signature" class="max-h-10 max-w-full object-contain">
                </div>
                <label class="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm transition-all">
                  <i *ngIf="uploadingAsset === 'signature'" class="fa-solid fa-spinner fa-spin mr-1.5 text-brand-600"></i>
                  <i *ngIf="uploadingAsset !== 'signature'" class="fa-solid fa-pen-nib mr-1.5 text-brand-600"></i>
                  {{ config.digitalSignatureUrl ? 'Change Signature Image' : 'Upload Signature Image (PNG)' }}
                  <input type="file" accept="image/*" (change)="onFileSelected($event, 'signature')" class="hidden">
                </label>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div class="sm:col-span-2">
                  <label class="block font-semibold text-slate-700 mb-1">Chief Pathologist / Doctor Name</label>
                  <input type="text" [(ngModel)]="config.pathologistName" placeholder="e.g. Dr. Rajesh Sharma, MD" class="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Degree / Qualification</label>
                  <input type="text" [(ngModel)]="config.pathologistDegree" placeholder="e.g. MBBS, MD (Pathology)" class="w-full px-3 py-2 border border-slate-300 rounded-xl">
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">MCI / State Reg Number</label>
                  <input type="text" [(ngModel)]="config.pathologistRegNo" placeholder="e.g. DMC-48291" class="w-full px-3 py-2 border border-slate-300 rounded-xl">
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Lab Profile Details -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center">
              <i class="fa-solid fa-hospital text-brand-600 mr-2"></i> Lab Profile & Header Information
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-700 mb-1">Laboratory Display Name</label>
                <input type="text" [(ngModel)]="config.labName" class="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>

              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-700 mb-1">Tagline / Motto</label>
                <input type="text" [(ngModel)]="config.tagline" class="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input type="text" [(ngModel)]="config.phone" class="w-full px-3 py-2 border border-slate-300 rounded-xl">
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Email</label>
                <input type="email" [(ngModel)]="config.email" class="w-full px-3 py-2 border border-slate-300 rounded-xl">
              </div>

              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-700 mb-1">Address & City</label>
                <input type="text" [(ngModel)]="config.address" class="w-full px-3 py-2 border border-slate-300 rounded-xl">
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">
                  GSTIN Number <span class="text-[11px] font-normal text-slate-400">(Optional)</span>
                </label>
                <input type="text" [(ngModel)]="config.gstin" placeholder="Optional" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs">
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">
                  NABL Accreditation <span class="text-[11px] font-normal text-slate-400">(Optional)</span>
                </label>
                <input type="text" [(ngModel)]="config.nablNumber" placeholder="Optional (e.g. NABL-MC-9812)" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs">
              </div>
            </div>
          </div>

          <!-- 4. A4 Spacing & Margins Sliders -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center">
              <i class="fa-solid fa-ruler-combined text-brand-600 mr-2"></i> Letterhead Margins (Pre-Printed Paper Support)
            </h3>

            <div class="space-y-4 text-xs">
              <div>
                <div class="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Top Header Margin (Space for letterhead header):</span>
                  <span class="text-brand-600 font-bold">{{ config.letterheadMarginTopMm }} mm</span>
                </div>
                <input type="range" [(ngModel)]="config.letterheadMarginTopMm" min="10" max="80" step="1"
                  class="w-full accent-brand-600 cursor-pointer">
              </div>

              <div>
                <div class="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Bottom Footer Margin (Space for pre-printed footer):</span>
                  <span class="text-brand-600 font-bold">{{ config.letterheadMarginBottomMm }} mm</span>
                </div>
                <input type="range" [(ngModel)]="config.letterheadMarginBottomMm" min="10" max="60" step="1"
                  class="w-full accent-brand-600 cursor-pointer">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Left Margin:</span>
                    <span class="text-brand-600 font-bold">{{ config.letterheadMarginLeftMm }} mm</span>
                  </div>
                  <input type="range" [(ngModel)]="config.letterheadMarginLeftMm" min="5" max="30" step="1"
                    class="w-full accent-brand-600 cursor-pointer">
                </div>
                <div>
                  <div class="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Right Margin:</span>
                    <span class="text-brand-600 font-bold">{{ config.letterheadMarginRightMm }} mm</span>
                  </div>
                  <input type="range" [(ngModel)]="config.letterheadMarginRightMm" min="5" max="30" step="1"
                    class="w-full accent-brand-600 cursor-pointer">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Live A4 Report Preview Column -->
        <div class="lg:col-span-6 space-y-4">
          <div class="flex items-center justify-between sticky top-4 z-10 bg-slate-50/90 backdrop-blur py-2">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <i class="fa-solid fa-eye text-brand-600 mr-2"></i> Live Report Visual Preview
            </h3>
            <span class="text-[11px] text-slate-500 font-medium">Simulating Standard A4 (210 x 297 mm)</span>
          </div>

          <!-- Simulated A4 Paper Sheet -->
          <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl p-6 min-h-[620px] flex flex-col justify-between text-slate-800 text-[11px] relative overflow-hidden transition-all"
               [style.padding-top.px]="config.letterheadMarginTopMm * 1.5"
               [style.padding-bottom.px]="config.letterheadMarginBottomMm * 1.5"
               [style.padding-left.px]="config.letterheadMarginLeftMm * 1.8"
               [style.padding-right.px]="config.letterheadMarginRightMm * 1.8">

            <!-- 1. Header Display: Custom Banner Image OR Structured Typography Header -->
            <div>
              <div *ngIf="config.showHeader">
                <!-- Custom Uploaded Header Banner -->
                <div *ngIf="config.headerImageUrl" class="mb-3 pb-2 border-b-2 border-brand-600">
                  <img [src]="getImageUrl(config.headerImageUrl)" alt="Custom Letterhead Header" class="w-full max-h-24 object-contain">
                </div>

                <!-- Structured Typography Header (with optional Logo) -->
                <div *ngIf="!config.headerImageUrl" class="pb-3 border-b-2 border-brand-600 space-y-0.5">
                  <div class="flex justify-between items-start">
                    <div class="flex items-center space-x-3">
                      <div *ngIf="config.logoUrl" class="w-10 h-10 rounded border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center bg-white p-0.5">
                        <img [src]="getImageUrl(config.logoUrl)" alt="Lab Logo" class="max-h-full max-w-full object-contain">
                      </div>
                      <div>
                        <h1 class="text-base font-black text-brand-700 tracking-tight leading-none">{{ config.labName }}</h1>
                        <p class="text-[10px] text-slate-500 italic">{{ config.tagline }}</p>
                        <p class="text-[9px] text-slate-600 mt-0.5">{{ config.address }} • Phone: {{ config.phone }}</p>
                      </div>
                    </div>
                    <div class="text-right text-[9px] space-y-1">
                      <span *ngIf="config.nablNumber" class="inline-block px-1.5 py-0.5 bg-brand-50 text-brand-700 font-bold rounded border border-brand-200">
                        NABL: {{ config.nablNumber }}
                      </span>
                      <div *ngIf="config.gstin" class="text-[8px] text-slate-500 font-medium">
                        GSTIN: {{ config.gstin }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Patient Demographics Mock -->
              <div class="my-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[9px] grid grid-cols-3 gap-2">
                <div>
                  <div><strong>Patient:</strong> Vikram Sharma</div>
                  <div><strong>Age/Sex:</strong> 45 Y / Male</div>
                </div>
                <div>
                  <div><strong>UHID:</strong> PAT-2026-0001</div>
                  <div><strong>Ref Doc:</strong> Dr. R. K. Verma</div>
                </div>
                <div>
                  <div><strong>Date:</strong> 02-Oct-2026</div>
                  <div><strong>Status:</strong> <span class="text-emerald-600 font-bold">Approved</span></div>
                </div>
              </div>

              <!-- Sample Report Table Mock -->
              <div class="space-y-1 my-2 flex-1">
                <div class="font-bold text-brand-800 bg-slate-100 p-1 rounded text-[10px] uppercase">
                  Hematology - Complete Blood Count (CBC)
                </div>
                <div class="space-y-1 text-[9px]">
                  <div class="flex justify-between border-b border-slate-100 py-1">
                    <span>Hemoglobin (Hb)</span>
                    <span class="font-bold text-rose-600">11.2 g/dL (LOW)</span>
                    <span class="text-slate-400">13.0 - 17.0</span>
                  </div>
                  <div class="flex justify-between border-b border-slate-100 py-1">
                    <span>Total Leukocyte Count (TLC)</span>
                    <span class="font-bold text-slate-900">8,200 /cumm</span>
                    <span class="text-slate-400">4,000 - 11,000</span>
                  </div>
                  <div class="flex justify-between border-b border-slate-100 py-1">
                    <span>Platelet Count</span>
                    <span class="font-bold text-slate-900">2.80 lakhs/cumm</span>
                    <span class="text-slate-400">1.50 - 4.50</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Section: Verification, Doctor Signature & Custom Footer -->
            <div class="space-y-3 pt-3">
              <!-- Signatures & Verification Row -->
              <div class="border-t border-slate-200 pt-3 flex justify-between items-end text-[9px]">
                <div class="space-y-0.5">
                  <div class="text-[8px] text-slate-400 italic">Scan QR code for digital validation</div>
                  <div class="w-10 h-10 bg-slate-100 rounded border border-slate-300 flex items-center justify-center font-mono text-[7px] text-slate-500">
                    [ QR ]
                  </div>
                </div>

                <!-- Dynamic Doctor Signature (Hidden if disabled or empty) -->
                <div *ngIf="config.showDigitalSignature && config.pathologistName" class="text-right space-y-0.5">
                  <!-- Scanned Signature Image if uploaded -->
                  <div *ngIf="config.digitalSignatureUrl" class="flex justify-end mb-1">
                    <img [src]="getImageUrl(config.digitalSignatureUrl)" alt="Doctor Signature" class="max-h-8 max-w-28 object-contain">
                  </div>
                  <div class="italic text-[8px] text-slate-500">Verified & Digitally Signed By:</div>
                  <div class="font-bold text-slate-900">{{ config.pathologistName }}</div>
                  <div *ngIf="config.pathologistDegree" class="text-[8px] text-slate-600">{{ config.pathologistDegree }}</div>
                  <div *ngIf="config.pathologistRegNo" class="text-[8px] font-bold text-brand-600">Reg: {{ config.pathologistRegNo }}</div>
                  <div class="text-[8px] text-slate-500 italic">Consultant Pathologist</div>
                </div>

                <!-- Empty State Hint in Preview when signature is off -->
                <div *ngIf="!config.showDigitalSignature || !config.pathologistName" class="text-right space-y-0.5 text-[8px] text-slate-400 italic">
                  <span>[ Digital Signature Omitted ]</span>
                </div>
              </div>

              <!-- Optional Custom Uploaded Footer Graphic -->
              <div *ngIf="config.footerImageUrl" class="pt-1 border-t border-slate-100">
                <img [src]="getImageUrl(config.footerImageUrl)" alt="Footer Graphic" class="w-full max-h-12 object-contain">
              </div>

              <!-- Page Footer Note -->
              <div class="text-center text-[8px] text-slate-400 pt-1">
                --- End of Diagnostic Report ---
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
})
export class LetterheadComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  config: LetterheadConfig | null = null;
  saving = false;
  uploadingAsset: string | null = null;

  ngOnInit(): void {
    this.api.getLetterheadConfig().subscribe(res => {
      this.config = res;
      this.cdr.detectChanges();
    });
  }

  getImageUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  }

  onFileSelected(event: Event, assetType: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !this.config) return;

    const file = input.files[0];
    this.uploadingAsset = assetType;
    this.cdr.detectChanges();

    this.api.uploadLetterheadAsset(file, assetType).subscribe({
      next: (res) => {
        this.uploadingAsset = null;
        if (this.config) {
          if (assetType === 'header') this.config.headerImageUrl = res.url;
          if (assetType === 'logo') this.config.logoUrl = res.url;
          if (assetType === 'footer') this.config.footerImageUrl = res.url;
          if (assetType === 'signature') this.config.digitalSignatureUrl = res.url;
        }
        this.cdr.detectChanges();
        this.toast.success(`${assetType.toUpperCase()} graphic uploaded and applied to preview!`);
      },
      error: (err) => {
        this.uploadingAsset = null;
        this.cdr.detectChanges();
        this.toast.error(err.error?.message || 'Failed to upload image asset.');
      }
    });
  }

  removeAsset(assetType: string): void {
    if (!this.config) return;
    if (assetType === 'header') this.config.headerImageUrl = undefined;
    if (assetType === 'logo') this.config.logoUrl = undefined;
    if (assetType === 'footer') this.config.footerImageUrl = undefined;
    if (assetType === 'signature') this.config.digitalSignatureUrl = undefined;
    this.cdr.detectChanges();
  }

  saveConfig(): void {
    if (!this.config) return;
    this.saving = true;
    this.cdr.detectChanges();
    this.api.updateLetterheadConfig(this.config).subscribe({
      next: () => {
        this.saving = false;
        this.cdr.detectChanges();
        this.toast.success('Letterhead, logo, and branding settings saved successfully!');
      },
      error: (err) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.message || 'Error saving letterhead configuration.');
      }
    });
  }
}
