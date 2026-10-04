import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { DoctorReferral } from '../../core/models/lims.models';

@Component({
  selector: 'app-case-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900 font-heading">Patient Cases & Workflow Ledger</h2>
          <p class="text-xs text-slate-500">Track registration, investigation entry, pathologist verification & payment settlements.</p>
        </div>
        <div class="flex items-center space-x-3">
          <a routerLink="/cases/add" class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-500/20 transition-all">
            <i class="fa-solid fa-plus mr-2"></i> New Registration
          </a>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <!-- Search -->
          <div class="lg:col-span-2 relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <i class="fa-solid fa-magnifying-glass text-xs"></i>
            </div>
            <input type="text" [(ngModel)]="filters.search" (keyup.enter)="loadCases()" placeholder="Search patient name, mobile, case no, barcode..."
              class="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
          </div>

          <!-- Doctor Filter -->
          <div>
            <select [(ngModel)]="filters.doctorId" (change)="loadCases()" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              <option value="">All Referring Doctors</option>
              <option *ngFor="let doc of doctors" [value]="doc.id">{{ doc.doctorName }}</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <select [(ngModel)]="filters.status" (change)="loadCases()" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              <option value="">All Report Statuses</option>
              <option [value]="1">1 - Registered</option>
              <option [value]="2">2 - Sample Collected</option>
              <option [value]="3">3 - In Progress</option>
              <option [value]="4">4 - Completed</option>
              <option [value]="5">5 - Approved</option>
            </select>
          </div>

          <!-- Payment Status -->
          <div>
            <select [(ngModel)]="filters.paymentStatus" (change)="loadCases()" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              <option value="">All Payment Statuses</option>
              <option [value]="3">Fully Paid</option>
              <option [value]="2">Partial Due</option>
              <option [value]="1">Unpaid</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span class="text-slate-500 font-medium">Found {{ totalCount }} cases</span>
          <button (click)="resetFilters()" class="text-brand-600 hover:text-brand-700 font-semibold">
            <i class="fa-solid fa-rotate-left mr-1"></i> Reset Filters
          </button>
        </div>
      </div>

      <!-- Cases Data Table -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th class="p-3.5">Case / Barcode</th>
                <th class="p-3.5">Patient Details</th>
                <th class="p-3.5">Doctor / Centre</th>
                <th class="p-3.5">Tests Booked</th>
                <th class="p-3.5">Financials (₹)</th>
                <th class="p-3.5">Workflow Status</th>
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <!-- Loading Row -->
              <tr *ngIf="loading">
                <td colspan="7" class="p-8 text-center text-slate-500">
                  <i class="fa-solid fa-circle-notch fa-spin text-2xl text-brand-600 mb-2"></i>
                  <div class="text-xs font-semibold text-slate-600">Loading Patient Cases & Workflow Ledger...</div>
                </td>
              </tr>

              <!-- Empty State Row -->
              <tr *ngIf="!loading && cases.length === 0">
                <td colspan="7" class="p-8 text-center text-slate-500 space-y-2">
                  <i class="fa-solid fa-folder-open text-2xl text-slate-300"></i>
                  <div class="text-xs font-bold text-slate-700">No patient cases found</div>
                  <p class="text-[11px] text-slate-400">No registered cases match your current filter criteria.</p>
                  <a routerLink="/cases/add" class="inline-flex items-center mt-2 px-3 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-500">
                    <i class="fa-solid fa-plus mr-1.5"></i> Register New Case
                  </a>
                </td>
              </tr>

              <tr *ngFor="let c of cases" class="hover:bg-slate-50/80 transition-colors">
                <!-- Case & Barcode -->
                <td class="p-3.5">
                  <div class="font-bold text-slate-900">{{ c.caseNumber }}</div>
                  <div class="flex items-center space-x-1.5 mt-0.5">
                    <span class="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{{ c.barcode }}</span>
                    <button (click)="showBarcode(c)" class="text-slate-400 hover:text-brand-600" title="Print Barcode Label">
                      <i class="fa-solid fa-barcode text-xs"></i>
                    </button>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">{{ c.orderDate | date:'dd MMM yyyy, hh:mm a' }}</div>
                </td>

                <!-- Patient -->
                <td class="p-3.5">
                  <div class="font-bold text-slate-800">{{ c.patientName }}</div>
                  <div class="text-slate-500 text-[11px]">{{ c.patientAgeGender }}</div>
                  <div class="text-slate-400 text-[10px]"><i class="fa-solid fa-phone text-[9px] mr-1"></i>{{ c.patientPhone || 'No phone' }}</div>
                </td>

                <!-- Doctor -->
                <td class="p-3.5">
                  <div class="font-medium text-slate-800">{{ c.doctorName }}</div>
                </td>

                <!-- Tests -->
                <td class="p-3.5 max-w-[200px]">
                  <div class="font-semibold text-slate-700 truncate" [title]="c.testsSummary">{{ c.testsSummary }}</div>
                  <div class="text-[11px] text-slate-400">{{ c.testsCount }} test(s)</div>
                </td>

                <!-- Financials -->
                <td class="p-3.5">
                  <div class="font-bold text-slate-900">₹{{ c.netAmount | number:'1.2-2' }}</div>
                  <div *ngIf="c.dueAmount > 0" class="text-rose-600 font-bold text-[11px] flex items-center space-x-1">
                    <span>Due: ₹{{ c.dueAmount }}</span>
                    <button (click)="openDueModal(c)" class="px-1 py-0.2 bg-rose-50 text-rose-700 rounded border border-rose-200 text-[9px] hover:bg-rose-100">
                      Settle
                    </button>
                  </div>
                  <div *ngIf="c.dueAmount <= 0" class="text-emerald-600 font-semibold text-[11px]">Paid in Full</div>
                </td>

                <!-- Status -->
                <td class="p-3.5">
                  <span [ngClass]="{
                    'bg-emerald-50 text-emerald-700 border-emerald-200': c.status === 'Approved',
                    'bg-blue-50 text-blue-700 border-blue-200': c.status === 'Completed',
                    'bg-amber-50 text-amber-700 border-amber-200': c.status === 'Registered' || c.status === 'SampleCollected',
                    'bg-purple-50 text-purple-700 border-purple-200': c.status === 'InProgress'
                  }" class="px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block">
                    {{ c.status }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="p-3.5 text-right space-x-1">
                  <!-- Result Entry -->
                  <a [routerLink]="['/investigations', c.id]" class="inline-flex items-center p-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-600 transition-colors" title="Investigation Result Entry">
                    <i class="fa-solid fa-vial-circle-check text-xs"></i>
                  </a>

                  <!-- Invoice PDF -->
                  <a [href]="api.getInvoicePdfUrl(c.id)" target="_blank" class="inline-flex items-center p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 transition-colors" title="Print Tax Invoice / Bill">
                    <i class="fa-solid fa-file-invoice text-xs"></i>
                  </a>

                  <!-- Report PDF (Letterhead Mode) -->
                  <a [href]="api.getReportPdfUrl(c.id, true)" target="_blank" class="inline-flex items-center p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 transition-colors" title="Print A4 Patient Report">
                    <i class="fa-solid fa-file-pdf text-xs"></i>
                  </a>

                  <!-- Public QR Download Link -->
                  <a [routerLink]="['/report/download', c.publicAccessToken]" target="_blank" class="inline-flex items-center p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors" title="Public QR Token Download URL">
                    <i class="fa-solid fa-qrcode text-xs"></i>
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Settle Due Modal -->
      <div *ngIf="settleModalCase" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-sm font-bold text-slate-900 font-heading">Quick Due Payment Settlement</h3>
            <button (click)="settleModalCase = null" class="text-slate-400 hover:text-slate-600">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
            <div><span class="text-slate-500">Case No:</span> <strong class="text-slate-900">{{ settleModalCase.caseNumber }}</strong></div>
            <div><span class="text-slate-500">Patient:</span> <strong class="text-slate-900">{{ settleModalCase.patientName }}</strong></div>
            <div class="text-rose-600 font-bold"><span class="text-slate-500">Current Balance Due:</span> ₹{{ settleModalCase.dueAmount }}</div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Paying Amount (₹)</label>
              <input type="number" [(ngModel)]="settleData.amount" min="1" [max]="settleModalCase.dueAmount"
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-bold text-emerald-600 focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select [(ngModel)]="settleData.paymentMethod" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
                <option [value]="1">Cash Counter</option>
                <option [value]="2">UPI / QR Code</option>
                <option [value]="3">Card</option>
                <option [value]="4">Net Banking</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Payment Reference / Remarks</label>
              <input type="text" [(ngModel)]="settleData.referenceNumber" placeholder="e.g. UPI Reference or Notes"
                class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl">
            </div>
          </div>

          <div class="flex space-x-3 pt-2">
            <button (click)="settleModalCase = null" class="flex-1 py-2 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-50">
              Cancel
            </button>
            <button (click)="submitDueSettlement()" class="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30">
              Confirm Payment
            </button>
          </div>
        </div>
      </div>

      <!-- Barcode Sticker Modal -->
      <div *ngIf="barcodeModalCase" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 class="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">Sample Tube Barcode Label</h3>
            <button (click)="barcodeModalCase = null" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 space-y-2">
            <div class="text-[11px] font-bold text-slate-900">{{ barcodeModalCase.patientName }} ({{ barcodeModalCase.patientAgeGender }})</div>
            <div class="w-full h-16 flex items-center justify-center p-1 bg-white rounded">
              <img [src]="api.getBarcodeSvgUrl(barcodeModalCase.id)" alt="Barcode" class="h-full object-contain">
            </div>
            <div class="text-[10px] text-slate-500 font-mono">{{ barcodeModalCase.caseNumber }}</div>
          </div>

          <button onclick="window.print()" class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md">
            <i class="fa-solid fa-print mr-1.5"></i> Print Thermal Label (50x25mm)
          </button>
        </div>
      </div>
    </div>
  `
})
export class CaseListComponent implements OnInit {
  api = inject(ApiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  cases: any[] = [];
  doctors: DoctorReferral[] = [];
  totalCount = 0;
  loading = false;

  filters = {
    search: '',
    doctorId: '',
    status: '',
    paymentStatus: ''
  };

  settleModalCase: any = null;
  settleData = {
    amount: 0,
    paymentMethod: 1,
    referenceNumber: '',
    remarks: ''
  };

  barcodeModalCase: any = null;

  ngOnInit(): void {
    this.loadCases();
    this.api.getDoctors().subscribe(docs => {
      this.doctors = docs || [];
      this.cdr.detectChanges();
    });
  }

  loadCases(): void {
    this.loading = true;
    this.cdr.detectChanges();

    const queryParams: any = {
      search: this.filters.search,
      doctorId: this.filters.doctorId || undefined,
      status: this.filters.status ? Number(this.filters.status) : undefined,
      paymentStatus: this.filters.paymentStatus ? Number(this.filters.paymentStatus) : undefined,
      page: 1,
      pageSize: 50
    };

    this.api.getCases(queryParams).subscribe({
      next: (res) => {
        this.cases = res.items || [];
        this.totalCount = res.totalCount;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  resetFilters(): void {
    this.filters = { search: '', doctorId: '', status: '', paymentStatus: '' };
    this.loadCases();
  }

  openDueModal(caseItem: any): void {
    this.settleModalCase = caseItem;
    this.settleData = {
      amount: caseItem.dueAmount,
      paymentMethod: 1,
      referenceNumber: '',
      remarks: 'Due Settlement'
    };
  }

  submitDueSettlement(): void {
    if (!this.settleModalCase) return;

    this.api.settleDuePayment(this.settleModalCase.id, this.settleData).subscribe({
      next: () => {
        this.settleModalCase = null;
        this.toast.success(`Due payment of ₹${this.settleData.amount} settled successfully!`);
        this.loadCases();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error settling due payment.')
    });
  }

  showBarcode(c: any): void {
    this.barcodeModalCase = c;
  }
}
