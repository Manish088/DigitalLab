import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { DoctorReferral, DoctorPayoutRecord, LetterheadConfig } from '../../core/models/lims.models';

@Component({
  selector: 'app-doctor-referrals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900 font-heading">Doctor Referral & Commission Tracking</h2>
          <p class="text-xs text-slate-500">Manage referring physicians, track patient volume, settle commission payouts & generate official settlement vouchers.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2.5">
          <button (click)="exportDoctorsToCsv()" [disabled]="doctors.length === 0"
            class="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            title="Export Doctor Commission Summary to CSV">
            <i class="fa-solid fa-file-excel mr-2 text-emerald-600"></i> Export Ledger (CSV)
          </button>
          <button (click)="openAddDoctorModal()" class="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all cursor-pointer">
            <i class="fa-solid fa-user-plus mr-2"></i> Register New Doctor
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="flex items-center space-x-2 border-b border-slate-200">
        <button type="button" (click)="activeTab = 'doctors'"
          [class]="activeTab === 'doctors' ? 'border-brand-600 text-brand-600 font-bold border-b-2' : 'text-slate-500 hover:text-slate-700 font-semibold'"
          class="pb-3 px-3 text-xs transition-colors flex items-center space-x-2 cursor-pointer">
          <i class="fa-solid fa-user-doctor"></i>
          <span>Referring Doctors & Accounts ({{ doctors.length }})</span>
        </button>
        <button type="button" (click)="activeTab = 'vouchers'; loadVouchers()"
          [class]="activeTab === 'vouchers' ? 'border-brand-600 text-brand-600 font-bold border-b-2' : 'text-slate-500 hover:text-slate-700 font-semibold'"
          class="pb-3 px-3 text-xs transition-colors flex items-center space-x-2 cursor-pointer">
          <i class="fa-solid fa-receipt"></i>
          <span>Settlement Vouchers & Receipts ({{ vouchers.length }})</span>
        </button>
      </div>

      <!-- TAB 1: Doctors List & Referral Statistics -->
      <div *ngIf="activeTab === 'doctors'" class="space-y-4">
        <!-- Doctors Table -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th class="p-3.5">Doctor Profile</th>
                  <th class="p-3.5">Specialization / Clinic</th>
                  <th class="p-3.5">Commission Rate</th>
                  <th class="p-3.5">Referred Cases</th>
                  <th class="p-3.5">Total Billing</th>
                  <th class="p-3.5">Commission Earned</th>
                  <th class="p-3.5">Pending Due</th>
                  <th class="p-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <!-- Loading State -->
                <tr *ngIf="loading">
                  <td colspan="8" class="p-8 text-center text-slate-500">
                    <i class="fa-solid fa-circle-notch fa-spin text-2xl text-brand-600 mb-2"></i>
                    <div class="text-xs font-semibold text-slate-600">Loading Referring Doctors & Balances...</div>
                  </td>
                </tr>

                <!-- Empty State -->
                <tr *ngIf="!loading && doctors.length === 0">
                  <td colspan="8" class="p-8 text-center text-slate-500 space-y-2">
                    <i class="fa-solid fa-user-doctor text-2xl text-slate-300"></i>
                    <div class="text-xs font-bold text-slate-700">No referring doctors found</div>
                    <p class="text-[11px] text-slate-400">Add referring doctors to track commissions and issue settlement vouchers.</p>
                  </td>
                </tr>

                <tr *ngFor="let doc of doctors" class="hover:bg-slate-50/80 transition-colors">
                  <td class="p-3.5">
                    <div class="font-bold text-slate-900">{{ doc.doctorName }}</div>
                    <div class="text-[11px] text-slate-400 font-mono">Code: {{ doc.doctorCode }}</div>
                  </td>
                  <td class="p-3.5">
                    <div class="font-semibold text-slate-800">{{ doc.specialization || 'General Physician' }}</div>
                    <div class="text-slate-400 text-[11px]">{{ doc.clinicHospitalName || 'Private Practice' }}</div>
                  </td>
                  <td class="p-3.5">
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                      {{ doc.defaultCommissionValue }}{{ doc.commissionType === 1 ? '%' : ' Flat' }}
                    </span>
                  </td>
                  <td class="p-3.5 font-bold text-slate-800">
                    {{ doc.totalCasesCount }} cases
                  </td>
                  <td class="p-3.5 font-bold text-slate-900">
                    ₹{{ doc.totalBillingVolume | number:'1.2-2' }}
                  </td>
                  <td class="p-3.5 font-bold text-emerald-600">
                    ₹{{ doc.totalCommissionEarned | number:'1.2-2' }}
                  </td>
                  <td class="p-3.5">
                    <span [class]="doc.pendingCommissionDue > 0 ? 'text-rose-600 font-black' : 'text-slate-400 font-semibold'">
                      ₹{{ doc.pendingCommissionDue | number:'1.2-2' }}
                    </span>
                  </td>
                  <td class="p-3.5 text-right whitespace-nowrap">
                    <div class="inline-flex items-center space-x-1.5">
                      <button (click)="viewDoctorVouchers(doc)"
                        class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        title="View Settlement Vouchers for this Doctor">
                        <i class="fa-solid fa-receipt mr-1 text-slate-500"></i> Vouchers
                      </button>
                      <button (click)="openPayoutModal(doc)" [disabled]="doc.pendingCommissionDue <= 0"
                        class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Record Commission Payout & Generate Official Voucher">
                        <i class="fa-solid fa-hand-holding-dollar mr-1"></i> Pay
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: All Settlement Vouchers Ledger -->
      <div *ngIf="activeTab === 'vouchers'" class="space-y-4">
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th class="p-3.5">Voucher No</th>
                  <th class="p-3.5">Doctor Details</th>
                  <th class="p-3.5">Payout Date</th>
                  <th class="p-3.5">Settlement Period</th>
                  <th class="p-3.5">Payment Method</th>
                  <th class="p-3.5">Reference / UTR</th>
                  <th class="p-3.5 text-right">Paid Amount (₹)</th>
                  <th class="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <!-- Loading State -->
                <tr *ngIf="loadingVouchers">
                  <td colspan="8" class="p-8 text-center text-slate-500">
                    <i class="fa-solid fa-circle-notch fa-spin text-2xl text-brand-600 mb-2"></i>
                    <div class="text-xs font-semibold text-slate-600">Loading Doctor Settlement Vouchers...</div>
                  </td>
                </tr>

                <!-- Empty State -->
                <tr *ngIf="!loadingVouchers && vouchers.length === 0">
                  <td colspan="8" class="p-8 text-center text-slate-500 space-y-1">
                    <i class="fa-solid fa-receipt text-2xl text-slate-300"></i>
                    <div class="text-xs font-bold text-slate-700">No settlement vouchers generated yet</div>
                    <p class="text-[11px] text-slate-400">When you pay commission to a doctor, an official printable voucher will appear here.</p>
                  </td>
                </tr>

                <tr *ngFor="let v of vouchers" class="hover:bg-slate-50/80 transition-colors">
                  <td class="p-3.5 font-mono font-bold text-slate-900">
                    {{ v.payoutNumber }}
                  </td>
                  <td class="p-3.5">
                    <div class="font-bold text-slate-800">Dr. {{ v.doctorName }}</div>
                    <div class="text-[10px] text-slate-400">{{ v.clinicHospitalName || v.specialization || 'Private Clinic' }}</div>
                  </td>
                  <td class="p-3.5 text-slate-600">
                    {{ v.payoutDate | date:'dd MMM yyyy, hh:mm a' }}
                  </td>
                  <td class="p-3.5 text-slate-500 text-[11px]">
                    {{ v.periodStartDate | date:'dd/MM/yy' }} - {{ v.periodEndDate | date:'dd/MM/yy' }}
                  </td>
                  <td class="p-3.5">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {{ getPaymentMethodName(v.paymentMethod) }}
                    </span>
                  </td>
                  <td class="p-3.5 text-slate-500 font-mono text-[11px]">
                    {{ v.transactionReference || v.remarks || '-' }}
                  </td>
                  <td class="p-3.5 text-right font-black text-emerald-600 text-sm">
                    ₹{{ v.paidAmount | number:'1.2-2' }}
                  </td>
                  <td class="p-3.5 text-right whitespace-nowrap">
                    <button (click)="openVoucherPreview(v)"
                      class="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors inline-flex items-center space-x-1 cursor-pointer">
                      <i class="fa-solid fa-print text-amber-400 mr-1"></i>
                      <span>View Voucher</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Add Doctor Modal -->
      <div *ngIf="showAddModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 class="text-sm font-bold text-slate-900 font-heading">Register Referring Doctor</h3>
            <button (click)="showAddModal = false" class="text-slate-400 hover:text-slate-600 cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Doctor Full Name *</label>
              <input type="text" [(ngModel)]="newDoc.doctorName" placeholder="Dr. S. K. Gupta" class="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Specialization</label>
                <input type="text" [(ngModel)]="newDoc.specialization" placeholder="Cardiologist" class="w-full px-3 py-2 border rounded-xl">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Commission %</label>
                <input type="number" [(ngModel)]="newDoc.defaultCommissionValue" placeholder="15" class="w-full px-3 py-2 border rounded-xl font-bold text-brand-600">
              </div>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Clinic / Hospital Name</label>
              <input type="text" [(ngModel)]="newDoc.clinicHospitalName" placeholder="Care Hospital" class="w-full px-3 py-2 border rounded-xl">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Mobile / Phone</label>
              <input type="tel" [(ngModel)]="newDoc.phone" placeholder="9812345678" class="w-full px-3 py-2 border rounded-xl">
            </div>
          </div>

          <button (click)="createDoctor()" class="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer">
            Save Doctor
          </button>
        </div>
      </div>

      <!-- Record Payout Modal -->
      <div *ngIf="payoutDoc" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-sm font-bold text-slate-900 font-heading">Record Commission Payout</h3>
              <p class="text-[11px] text-slate-400">Generate an official signed settlement voucher.</p>
            </div>
            <button (click)="payoutDoc = null" class="text-slate-400 hover:text-slate-600 cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <!-- Doctor info card -->
          <div class="bg-slate-50 p-3.5 rounded-2xl text-xs space-y-1.5 border border-slate-100">
            <div class="flex justify-between items-center">
              <span class="text-slate-500">Doctor:</span>
              <strong class="text-slate-900 text-sm">Dr. {{ payoutDoc.doctorName }}</strong>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500">Clinic / Hospital:</span>
              <span class="text-slate-700">{{ payoutDoc.clinicHospitalName || 'Private Practice' }}</span>
            </div>
            <div class="flex justify-between items-center pt-1 border-t border-slate-200">
              <span class="text-slate-600 font-semibold">Pending Commission Due:</span>
              <strong class="text-rose-600 text-sm">₹{{ payoutDoc.pendingCommissionDue | number:'1.2-2' }}</strong>
            </div>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Payout Amount (₹) *</label>
              <input type="number" [(ngModel)]="payoutData.paidAmount" min="1" [max]="payoutDoc.pendingCommissionDue"
                class="w-full px-3 py-2 text-base border border-slate-300 rounded-xl font-bold text-emerald-600 focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Period From</label>
                <input type="date" [(ngModel)]="payoutPeriodFrom" class="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Period To</label>
                <input type="date" [(ngModel)]="payoutPeriodTo" class="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs">
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select [(ngModel)]="payoutData.paymentMethod" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs">
                <option [value]="1">Cash Counter Desk</option>
                <option [value]="2">UPI / QR (Google Pay, PhonePe, Paytm)</option>
                <option [value]="4">Bank Transfer / NEFT / RTGS</option>
                <option [value]="3">Debit / Credit Card</option>
                <option [value]="5">Cheque / Demand Draft</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Transaction Ref / UTR / Remarks</label>
              <input type="text" [(ngModel)]="payoutData.transactionReference" placeholder="e.g. UPI Ref, NEFT UTR or Cheque No" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs">
            </div>
          </div>

          <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
            <button (click)="payoutDoc = null" class="w-full sm:flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer">
              Cancel
            </button>
            <button (click)="submitPayout()" [disabled]="submittingPayout || payoutData.paidAmount <= 0"
              class="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50">
              <i *ngIf="submittingPayout" class="fa-solid fa-circle-notch fa-spin"></i>
              <span *ngIf="!submittingPayout">Confirm & Generate Voucher</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Live Settlement Voucher Modal Popup -->
      <div *ngIf="activeVoucher" class="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          
          <!-- Top Bar -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <div class="flex items-center space-x-2">
              <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base">
                <i class="fa-solid fa-receipt"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900 font-heading">Doctor Commission Settlement Voucher</h3>
                <p class="text-[11px] text-slate-400">Official proof of payment & commission reconciliation.</p>
              </div>
            </div>
            <button (click)="activeVoucher = null" class="text-slate-400 hover:text-slate-600 cursor-pointer"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>

          <!-- Printable Preview Container -->
          <div class="overflow-y-auto flex-1 p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-slate-800 space-y-4">
            <!-- Voucher Card Layout -->
            <div class="bg-white p-4 sm:p-5 rounded-xl border border-slate-300 shadow-sm space-y-4 text-xs">
              <!-- Lab Header -->
              <div class="text-center border-b-2 border-slate-800 pb-3 space-y-0.5">
                <div class="text-base font-black uppercase text-slate-900 tracking-wide">{{ labConfig?.labName || 'CITY CARE DIAGNOSTICS & PATHOLOGY' }}</div>
                <div class="text-[11px] text-slate-500">{{ labConfig?.address || 'Main Road, Civil Lines' }} {{ labConfig?.city ? '• ' + labConfig.city : '' }} • Ph: {{ labConfig?.phone || '7706087066' }}</div>
                <div *ngIf="labConfig?.gstin" class="text-[10px] font-semibold text-slate-700">GSTIN: {{ labConfig.gstin }}</div>
                <div class="inline-block mt-1 bg-slate-900 text-white font-bold text-[10px] uppercase px-3 py-0.5 rounded tracking-wider">
                  COMMISSION SETTLEMENT VOUCHER
                </div>
              </div>

              <!-- Metadata -->
              <div class="flex justify-between items-start text-[11px] border-b border-slate-200 pb-2">
                <div>
                  <div><span class="text-slate-500">Voucher No:</span> <strong class="font-mono text-slate-900">{{ activeVoucher.payoutNumber }}</strong></div>
                  <div><span class="text-slate-500">Settlement Date:</span> <strong>{{ activeVoucher.payoutDate | date:'dd MMM yyyy, hh:mm a' }}</strong></div>
                </div>
                <div class="text-right">
                  <div><span class="text-slate-500">Period:</span> <strong>{{ activeVoucher.periodStartDate | date:'dd/MM/yy' }} to {{ activeVoucher.periodEndDate | date:'dd/MM/yy' }}</strong></div>
                  <div><span class="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">PAYMENT SETTLED</span></div>
                </div>
              </div>

              <!-- Doctor Box -->
              <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div class="font-bold text-slate-900 text-sm">Dr. {{ activeVoucher.doctorName }} <span *ngIf="activeVoucher.degree" class="text-xs text-slate-600 font-normal">({{ activeVoucher.degree }})</span></div>
                <div class="text-[11px] text-slate-600 mt-0.5">{{ activeVoucher.specialization || 'General Physician' }} • {{ activeVoucher.clinicHospitalName || 'Private Practice' }}</div>
                <div class="text-[10px] text-slate-400 font-mono mt-0.5">Doctor Code: {{ activeVoucher.doctorCode }} <span *ngIf="activeVoucher.phone">| Ph: {{ activeVoucher.phone }}</span></div>
              </div>

              <!-- Breakdown Table -->
              <table class="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead class="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th class="p-2 border-b border-slate-200">Particulars</th>
                    <th class="p-2 border-b border-slate-200 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr>
                    <td class="p-2">Referred Patient Cases Booked ({{ activeVoucher.totalCasesCount }} cases)</td>
                    <td class="p-2 text-right font-mono">₹{{ activeVoucher.totalBillingVolume | number:'1.2-2' }}</td>
                  </tr>
                  <tr>
                    <td class="p-2">Total Referral Commission Accrued</td>
                    <td class="p-2 text-right font-mono">₹{{ activeVoucher.totalCommissionEarned | number:'1.2-2' }}</td>
                  </tr>
                  <tr class="bg-emerald-50/80 font-bold text-emerald-900">
                    <td class="p-2.5">NET COMMISSION PAID (THIS VOUCHER)</td>
                    <td class="p-2.5 text-right font-mono text-sm font-black text-emerald-700">₹{{ activeVoucher.paidAmount | number:'1.2-2' }}</td>
                  </tr>
                  <tr>
                    <td class="p-2">Remaining Commission Balance Due</td>
                    <td class="p-2 text-right font-mono font-bold" [class.text-rose-600]="activeVoucher.remainingDue > 0">
                      ₹{{ activeVoucher.remainingDue | number:'1.2-2' }}
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Words and Mode -->
              <div class="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-1 text-xs">
                <div><span class="text-slate-500 font-medium">Amount in Words:</span> <strong class="italic text-slate-900">{{ numberToWordsINR(activeVoucher.paidAmount) }}</strong></div>
                <div><span class="text-slate-500 font-medium">Payment Mode:</span> <strong class="text-slate-800">{{ getPaymentMethodName(activeVoucher.paymentMethod) }}</strong> <span *ngIf="activeVoucher.transactionReference" class="font-mono text-slate-600">(Ref: {{ activeVoucher.transactionReference }})</span></div>
                <div *ngIf="activeVoucher.remarks"><span class="text-slate-500 font-medium">Remarks:</span> <span class="text-slate-700">{{ activeVoucher.remarks }}</span></div>
              </div>

              <!-- Signature Grid -->
              <div class="grid grid-cols-2 gap-4 pt-6 text-center text-xs">
                <div>
                  <div class="border-t border-dashed border-slate-400 pt-1 font-semibold text-slate-700">
                    Doctor's / Receiver's Signature
                  </div>
                </div>
                <div>
                  <div class="border-t border-dashed border-slate-400 pt-1 font-semibold text-slate-700">
                    Authorized Accounts Signatory<br>
                    <span class="text-[9px] text-slate-400 font-normal">({{ labConfig?.labName || 'Laboratory Desk' }})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 shrink-0 border-t border-slate-100">
            <button (click)="activeVoucher = null" class="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer text-center">
              Close Preview
            </button>
            <button (click)="printVoucher(activeVoucher)" class="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-lg flex items-center justify-center space-x-2 cursor-pointer">
              <i class="fa-solid fa-print text-amber-400"></i>
              <span>Print Official Settlement Voucher (A4)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DoctorReferralsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  doctors: DoctorReferral[] = [];
  vouchers: DoctorPayoutRecord[] = [];
  loading = false;
  loadingVouchers = false;
  submittingPayout = false;
  activeTab: 'doctors' | 'vouchers' = 'doctors';

  showAddModal = false;
  payoutDoc: DoctorReferral | null = null;
  activeVoucher: DoctorPayoutRecord | null = null;
  labConfig: LetterheadConfig | null = null;

  payoutPeriodFrom = '';
  payoutPeriodTo = '';

  newDoc = {
    doctorCode: 'DOC' + Math.floor(100 + Math.random() * 900),
    doctorName: '',
    specialization: '',
    clinicHospitalName: '',
    phone: '',
    commissionType: 1,
    defaultCommissionValue: 15
  };

  payoutData = {
    paidAmount: 0,
    paymentMethod: 2, // default UPI
    transactionReference: '',
    remarks: ''
  };

  ngOnInit(): void {
    this.loadDoctors();
    this.loadLabConfig();
    this.initDefaultDates();
  }

  private initDefaultDates(): void {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(today.getDate() - 30);
    this.payoutPeriodTo = today.toISOString().split('T')[0];
    this.payoutPeriodFrom = oneMonthAgo.toISOString().split('T')[0];
  }

  loadLabConfig(): void {
    this.api.getLetterheadConfig().subscribe({
      next: (cfg) => {
        this.labConfig = cfg;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadDoctors(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.api.getDoctors().subscribe({
      next: (docs) => {
        this.doctors = docs || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.message || 'Failed to load doctors list.');
      }
    });
  }

  loadVouchers(doctorId?: string): void {
    this.loadingVouchers = true;
    this.cdr.detectChanges();
    this.api.getDoctorPayouts(doctorId).subscribe({
      next: (list) => {
        this.vouchers = list || [];
        this.loadingVouchers = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingVouchers = false;
        this.cdr.detectChanges();
        this.toast.error('Failed to load settlement vouchers.');
      }
    });
  }

  viewDoctorVouchers(doc: DoctorReferral): void {
    this.activeTab = 'vouchers';
    this.loadVouchers(doc.id);
  }

  openAddDoctorModal(): void {
    this.showAddModal = true;
  }

  createDoctor(): void {
    if (!this.newDoc.doctorName) {
      this.toast.warning('Please enter doctor name.');
      return;
    }
    this.api.createDoctor(this.newDoc).subscribe({
      next: () => {
        this.showAddModal = false;
        this.toast.success(`Dr. ${this.newDoc.doctorName} registered successfully!`);
        this.loadDoctors();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error saving doctor.')
    });
  }

  openPayoutModal(doc: DoctorReferral): void {
    this.payoutDoc = doc;
    this.payoutData.paidAmount = doc.pendingCommissionDue;
    this.payoutData.paymentMethod = 2; // UPI
    this.payoutData.transactionReference = '';
    this.payoutData.remarks = `Commission settlement for Dr. ${doc.doctorName}`;
    this.initDefaultDates();
  }

  submitPayout(): void {
    if (!this.payoutDoc) return;
    if (this.payoutData.paidAmount <= 0) {
      this.toast.warning('Please enter a valid payout amount.');
      return;
    }

    this.submittingPayout = true;
    this.cdr.detectChanges();

    const payload = {
      doctorId: this.payoutDoc.id,
      paidAmount: Number(this.payoutData.paidAmount),
      paymentMethod: Number(this.payoutData.paymentMethod),
      transactionReference: this.payoutData.transactionReference ? this.payoutData.transactionReference.trim() : null,
      remarks: this.payoutData.remarks ? this.payoutData.remarks.trim() : null,
      periodStartDate: this.payoutPeriodFrom ? new Date(this.payoutPeriodFrom).toISOString() : new Date().toISOString(),
      periodEndDate: this.payoutPeriodTo ? new Date(this.payoutPeriodTo).toISOString() : new Date().toISOString()
    };

    this.api.recordDoctorPayout(payload).subscribe({
      next: (createdVoucher) => {
        this.submittingPayout = false;
        const docName = this.payoutDoc?.doctorName || '';
        this.payoutDoc = null;
        this.toast.success(`Payout of ₹${payload.paidAmount} recorded for Dr. ${docName}!`);
        
        // Open the settlement voucher immediately
        if (createdVoucher) {
          this.activeVoucher = createdVoucher;
        }

        this.loadDoctors();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.submittingPayout = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.message || 'Error recording payout.');
      }
    });
  }

  openVoucherPreview(v: DoctorPayoutRecord): void {
    this.activeVoucher = v;
    this.cdr.detectChanges();
  }

  getPaymentMethodName(method: number | string): string {
    const m = Number(method);
    switch (m) {
      case 1: return 'Cash Counter Desk';
      case 2: return 'UPI / QR Code (GPay / PhonePe / Paytm)';
      case 3: return 'Debit / Credit Card';
      case 4: return 'Bank Transfer / NEFT / RTGS';
      case 5: return 'Cheque / Demand Draft';
      case 6: return 'Digital Wallet';
      default: return typeof method === 'string' ? method : 'Cash Desk';
    }
  }

  numberToWordsINR(amount: number): string {
    const rounded = Math.round(amount);
    if (rounded === 0) return 'Zero Rupees Only';

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                   'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanOneThousand = (n: number): string => {
      let res = '';
      if (n >= 100) {
        res += units[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        res += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        res += units[n] + ' ';
      }
      return res.trim();
    };

    let numStr = '';
    let crore = Math.floor(rounded / 10000000);
    let rem = rounded % 10000000;
    let lakh = Math.floor(rem / 100000);
    rem %= 100000;
    let thousand = Math.floor(rem / 1000);
    rem %= 1000;
    let hundred = rem;

    if (crore > 0) numStr += convertLessThanOneThousand(crore) + ' Crore ';
    if (lakh > 0) numStr += convertLessThanOneThousand(lakh) + ' Lakh ';
    if (thousand > 0) numStr += convertLessThanOneThousand(thousand) + ' Thousand ';
    if (hundred > 0) numStr += convertLessThanOneThousand(hundred) + ' ';

    return 'Rupees ' + numStr.trim() + ' Only';
  }

  exportDoctorsToCsv(): void {
    if (!this.doctors || this.doctors.length === 0) {
      this.toast.warning('No doctor referral records to export.');
      return;
    }

    const headers = [
      'Doctor Code',
      'Doctor Name',
      'Specialization',
      'Clinic / Hospital',
      'Phone Number',
      'Commission Rate',
      'Total Referred Cases',
      'Total Billing Volume (INR)',
      'Total Commission Earned (INR)',
      'Total Commission Paid (INR)',
      'Pending Commission Due (INR)'
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = this.doctors.map(doc => {
      const rateStr = `${doc.defaultCommissionValue}${doc.commissionType === 1 ? '%' : ' Flat'}`;
      return [
        escapeCsv(doc.doctorCode),
        escapeCsv(doc.doctorName),
        escapeCsv(doc.specialization || 'General Physician'),
        escapeCsv(doc.clinicHospitalName || 'Private Practice'),
        escapeCsv(doc.phone || ''),
        escapeCsv(rateStr),
        escapeCsv(doc.totalCasesCount || 0),
        escapeCsv(Number(doc.totalBillingVolume || 0).toFixed(2)),
        escapeCsv(Number(doc.totalCommissionEarned || 0).toFixed(2)),
        escapeCsv(Number(doc.totalCommissionPaid || 0).toFixed(2)),
        escapeCsv(Number(doc.pendingCommissionDue || 0).toFixed(2))
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    link.setAttribute('href', url);
    link.setAttribute('download', `Doctor_Commission_Ledger_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.toast.success(`Exported ${this.doctors.length} doctor accounts to Excel (CSV) successfully!`);
  }

  printVoucher(v: DoctorPayoutRecord): void {
    const printWindow = window.open('', '', 'width=800,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    const words = this.numberToWordsINR(v.paidAmount);
    const dateStr = new Date(v.payoutDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const periodStr = `${new Date(v.periodStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} to ${new Date(v.periodEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Commission Settlement Voucher - ${v.payoutNumber}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; }
            .voucher-card { border: 2px solid #0f172a; border-radius: 8px; padding: 24px; position: relative; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 18px; }
            .lab-title { font-size: 20px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .lab-sub { font-size: 11px; color: #475569; margin-top: 3px; }
            .voucher-badge { display: inline-block; background: #0f172a; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 16px; border-radius: 4px; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
            .meta-grid { display: flex; justify-content: space-between; margin-bottom: 18px; font-size: 12px; }
            .doc-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin-bottom: 18px; }
            .doc-title { font-size: 14px; font-weight: 700; color: #0f172a; }
            .table-box { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
            .table-box th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
            .table-box td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 12px; }
            .highlight-row { background: #ecfdf5; font-weight: bold; font-size: 13px; color: #065f46; }
            .words-box { background: #f8fafc; border: 1px dashed #94a3b8; border-radius: 6px; padding: 10px 14px; margin-bottom: 24px; font-size: 12px; }
            .sign-grid { display: flex; justify-content: space-between; margin-top: 45px; padding-top: 10px; }
            .sign-line { border-top: 1px dashed #475569; width: 220px; text-align: center; padding-top: 5px; font-size: 11px; font-weight: bold; color: #334155; }
            .footer-note { text-align: center; font-size: 10px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="voucher-card">
            <div class="header">
              <div class="lab-title">${this.labConfig?.labName || 'CITY CARE DIAGNOSTICS & PATHOLOGY'}</div>
              <div class="lab-sub">${this.labConfig?.address || 'Main Road, Civil Lines'} ${this.labConfig?.city ? '• ' + this.labConfig.city : ''} • Ph: ${this.labConfig?.phone || '7706087066'}</div>
              ${this.labConfig?.gstin ? `<div class="lab-sub"><strong>GSTIN:</strong> ${this.labConfig.gstin}</div>` : ''}
              <div class="voucher-badge">Doctor Commission Settlement Voucher</div>
            </div>

            <div class="meta-grid">
              <div>
                <div><strong>Voucher No:</strong> <span style="font-family:monospace; font-weight:bold;">${v.payoutNumber}</span></div>
                <div><strong>Settlement Date:</strong> ${dateStr}</div>
              </div>
              <div style="text-align:right;">
                <div><strong>Settlement Period:</strong> ${periodStr}</div>
                <div><strong>Status:</strong> <span style="color:#059669; font-weight:bold;">SETTLED / PAID</span></div>
              </div>
            </div>

            <div class="doc-box">
              <div class="doc-title">Dr. ${v.doctorName} ${v.degree ? '(' + v.degree + ')' : ''}</div>
              <div style="font-size:12px; color:#475569; margin-top:2px;">
                ${v.specialization || 'General Physician'} • ${v.clinicHospitalName || 'Private Practice'}
              </div>
              <div style="font-size:11px; color:#64748b; margin-top:3px;">
                <strong>Doctor Code:</strong> ${v.doctorCode} ${v.phone ? ' | <strong>Phone:</strong> ' + v.phone : ''}
              </div>
            </div>

            <table class="table-box">
              <thead>
                <tr>
                  <th>Particulars / Settlement Breakdown</th>
                  <th style="text-align:right;">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Referred Patient Cases Booked (${v.totalCasesCount} cases)</td>
                  <td style="text-align:right; font-family:monospace;">₹${Number(v.totalBillingVolume || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Total Referral Commission Accrued</td>
                  <td style="text-align:right; font-family:monospace;">₹${Number(v.totalCommissionEarned || 0).toFixed(2)}</td>
                </tr>
                <tr class="highlight-row">
                  <td>NET COMMISSION PAID (THIS VOUCHER)</td>
                  <td style="text-align:right; font-family:monospace; font-size:14px; font-weight:900;">₹${Number(v.paidAmount || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Remaining Balance Commission Due</td>
                  <td style="text-align:right; font-family:monospace; color:${v.remainingDue > 0 ? '#dc2626' : '#475569'};">₹${Number(v.remainingDue || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="words-box">
              <div><strong>Amount in Words:</strong> <span style="font-style:italic; font-weight:600;">${words}</span></div>
              <div style="margin-top:4px;"><strong>Payment Mode:</strong> ${this.getPaymentMethodName(v.paymentMethod)} ${v.transactionReference ? ' | <strong>Ref / UTR:</strong> ' + v.transactionReference : ''}</div>
              ${v.remarks ? `<div style="margin-top:2px; font-size:11px; color:#475569;"><strong>Notes / Remarks:</strong> ${v.remarks}</div>` : ''}
            </div>

            <div class="sign-grid">
              <div class="sign-line">
                Doctor's / Receiver's Signature
              </div>
              <div class="sign-line">
                Authorized Accounts Signatory<br>
                <span style="font-size:9px; font-weight:normal; color:#64748b;">(For ${this.labConfig?.labName || 'City Care Diagnostics'})</span>
              </div>
            </div>

            <div class="footer-note">
              This is a computer-generated official commission payout voucher. All settlements are subject to realization.
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
