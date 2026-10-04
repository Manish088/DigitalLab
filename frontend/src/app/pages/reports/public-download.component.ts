import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-public-download',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div class="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl space-y-6 text-center border border-slate-100 relative overflow-hidden">
        <!-- Top Verified Badge Banner -->
        <div class="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
          <i class="fa-solid fa-circle-check text-emerald-500"></i>
          <span>Verified Digital Laboratory Report</span>
        </div>

        <div *ngIf="loading" class="py-12 space-y-3">
          <i class="fa-solid fa-spinner fa-spin text-3xl text-brand-600"></i>
          <p class="text-xs text-slate-500">Authenticating report token from secure cloud servers...</p>
        </div>

        <div *ngIf="errorMessage" class="py-8 space-y-3">
          <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3 class="font-bold text-slate-900 text-sm">Verification Link Expired or Invalid</h3>
          <p class="text-xs text-slate-500">{{ errorMessage }}</p>
        </div>

        <div *ngIf="reportData && !loading" class="space-y-5 text-left">
          <!-- Lab Name -->
          <div class="text-center pb-4 border-b border-slate-100">
            <h2 class="text-lg font-black text-slate-900 font-heading">{{ reportData.labName }}</h2>
            <p class="text-xs text-slate-500">{{ reportData.labAddress }} • {{ reportData.labPhone }}</p>
          </div>

          <!-- Patient Demographics Card -->
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-slate-500">Patient Name:</span>
              <strong class="text-slate-900">{{ reportData.patientName }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Age / Gender:</span>
              <strong class="text-slate-900">{{ reportData.patientAgeGender }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Case Number:</span>
              <span class="font-mono font-bold text-slate-900">{{ reportData.caseNumber }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Verified On:</span>
              <strong class="text-slate-900">{{ reportData.approvedAt ? (reportData.approvedAt | date:'dd MMM yyyy, hh:mm a') : 'Under Process' }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Verified By:</span>
              <strong class="text-emerald-700">{{ reportData.approvedByName || 'Pathology Incharge' }}</strong>
            </div>
          </div>

          <!-- Tests list -->
          <div>
            <div class="text-xs font-bold text-slate-700 mb-2">Investigations Included:</div>
            <div class="flex flex-wrap gap-1.5">
              <span *ngFor="let t of reportData.tests" class="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 font-medium text-[11px] border border-brand-100">
                <i class="fa-solid fa-flask-vial mr-1 text-[10px]"></i> {{ t }}
              </span>
            </div>
          </div>

          <!-- Download Action Button -->
          <a [href]="api.getPublicReportDownloadUrl(token)" target="_blank"
            class="block w-full py-3.5 px-4 text-center rounded-2xl font-black text-sm bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-xl shadow-brand-500/25 hover:from-brand-500 hover:to-cyan-500 transition-all">
            <i class="fa-solid fa-file-arrow-down mr-2 text-base"></i> Download Verified PDF Report
          </a>

          <div class="text-center text-[10px] text-slate-400">
            Powered by DigitLab Cloud Pathology Information System
          </div>
        </div>
      </div>
    </div>
  `
})
export class PublicDownloadComponent implements OnInit {
  api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  token = '';
  reportData: any = null;
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.params['token'];
    this.api.getPublicReportByToken(this.token).subscribe({
      next: (res) => {
        this.reportData = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Report not found.';
        this.cdr.detectChanges();
      }
    });
  }
}
