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
          <p class="text-xs text-slate-500">Customize A4 margins, pre-printed stationery spacing, header/footer images, and pathologist digital signatures.</p>
        </div>
        <button (click)="saveConfig()" [disabled]="saving"
          class="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 cursor-pointer">
          <i *ngIf="saving" class="fa-solid fa-spinner fa-spin mr-1.5"></i>
          <i *ngIf="!saving" class="fa-solid fa-floppy-disk mr-1.5"></i>
          Save Settings
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Settings Controls Column -->
        <div class="space-y-6">
          <!-- Lab Profile Details -->
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
                <input type="text" [(ngModel)]="config.gstin" placeholder="Optional (leave blank if not available)" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs">
                <p class="text-[10px] text-slate-400 mt-1">Diagnostics are GST exempt. Leave blank if not registered.</p>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">
                  NABL / ISO Accreditation No <span class="text-[11px] font-normal text-slate-400">(Optional)</span>
                </label>
                <input type="text" [(ngModel)]="config.nablNumber" placeholder="Optional (e.g. NABL-MC-9812)" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs">
                <p class="text-[10px] text-slate-400 mt-1">Leave blank if lab is standard / non-accredited.</p>
              </div>
            </div>
          </div>

          <!-- A4 Spacing & Margins Sliders -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center">
              <i class="fa-solid fa-ruler-combined text-brand-600 mr-2"></i> Letterhead Margins (Pre-Printed Paper Support)
            </h3>

            <div class="space-y-4 text-xs">
              <div>
                <div class="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Top Header Margin (Space for letterhead logo):</span>
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

          <!-- Pathologist Credentials & Signature -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center">
              <i class="fa-solid fa-signature text-brand-600 mr-2"></i> Pathologist Digital Signature & Signoff
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-700 mb-1">Chief Pathologist / Doctor Name</label>
                <input type="text" [(ngModel)]="config.pathologistName" class="w-full px-3 py-2 border border-slate-300 rounded-xl">
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Degree / Qualification</label>
                <input type="text" [(ngModel)]="config.pathologistDegree" placeholder="MBBS, MD (Pathology)" class="w-full px-3 py-2 border border-slate-300 rounded-xl">
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">MCI / State Reg Number</label>
                <input type="text" [(ngModel)]="config.pathologistRegNo" placeholder="DMC-48291" class="w-full px-3 py-2 border border-slate-300 rounded-xl">
              </div>
            </div>
          </div>
        </div>

        <!-- Live A4 Report Preview Column -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <i class="fa-solid fa-eye text-brand-600 mr-2"></i> Live Report Visual Preview
            </h3>
            <span class="text-[11px] text-slate-500">Simulating Standard A4 (210 x 297 mm)</span>
          </div>

          <!-- Simulated A4 Paper Sheet -->
          <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl p-6 min-h-[560px] flex flex-col justify-between text-slate-800 text-[11px] relative overflow-hidden"
               [style.padding-top.px]="config.letterheadMarginTopMm * 2"
               [style.padding-bottom.px]="config.letterheadMarginBottomMm * 2"
               [style.padding-left.px]="config.letterheadMarginLeftMm * 2"
               [style.padding-right.px]="config.letterheadMarginRightMm * 2">

            <!-- Simulated Header Overlay -->
            <div *ngIf="config.showHeader" class="pb-3 border-b-2 border-brand-600 space-y-0.5">
              <div class="flex justify-between items-start">
                <div>
                  <h1 class="text-base font-black text-brand-700 tracking-tight leading-none">{{ config.labName }}</h1>
                  <p class="text-[10px] text-slate-500 italic">{{ config.tagline }}</p>
                  <p class="text-[9px] text-slate-600 mt-1">{{ config.address }} • Phone: {{ config.phone }}</p>
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

            <!-- Patient Demographics Mock -->
            <div class="my-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[9px] grid grid-cols-3 gap-2">
              <div>
                <div><strong>Patient:</strong> Vikram Sharma</div>
                <div><strong>Age/Sex:</strong> 45 Y / Male</div>
              </div>
              <div>
                <div><strong>UHID:</strong> PAT-2026-0001</div>
                <div><strong>Ref Doc:</strong> Dr. Ananya Sen</div>
              </div>
              <div>
                <div><strong>Date:</strong> 02-Oct-2026</div>
                <div><strong>Status:</strong> <span class="text-emerald-600 font-bold">Approved</span></div>
              </div>
            </div>

            <!-- Sample Report Table Mock -->
            <div class="space-y-1 my-2 flex-1">
              <div class="font-bold text-brand-800 bg-slate-100 p-1 rounded text-[10px]">
                HEMATOLOGY - COMPLETE BLOOD COUNT (CBC)
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

            <!-- Signatures & Verification Footer -->
            <div class="pt-4 border-t border-slate-200 flex justify-between items-end text-[9px]">
              <div class="space-y-0.5">
                <div class="text-[8px] text-slate-400 italic">Scan QR code for digital validation</div>
                <div class="w-12 h-12 bg-slate-100 rounded border border-slate-300 flex items-center justify-center font-mono text-[8px]">
                  [ QR ]
                </div>
              </div>

              <div class="text-right space-y-0.5">
                <div class="italic text-[8px] text-slate-500">Digitally Verified & Signed:</div>
                <div class="font-bold text-slate-900">{{ config.pathologistName }}</div>
                <div class="text-[8px] text-slate-600">{{ config.pathologistDegree }} • Reg: {{ config.pathologistRegNo }}</div>
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

  ngOnInit(): void {
    this.api.getLetterheadConfig().subscribe(res => {
      this.config = res;
      this.cdr.detectChanges();
    });
  }

  saveConfig(): void {
    if (!this.config) return;
    this.saving = true;
    this.cdr.detectChanges();
    this.api.updateLetterheadConfig(this.config).subscribe({
      next: () => {
        this.saving = false;
        this.cdr.detectChanges();
        this.toast.success('Letterhead and branding settings saved successfully!');
      },
      error: (err) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.message || 'Error saving letterhead configuration.');
      }
    });
  }
}
