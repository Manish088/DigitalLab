import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { DoctorReferral } from '../../core/models/lims.models';

@Component({
  selector: 'app-doctor-referrals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900 font-heading">Doctor Referral & Commission Tracking</h2>
          <p class="text-xs text-slate-500">Manage referring physicians, calculate incentive percentages, track patient counts & record payouts.</p>
        </div>
        <button (click)="openAddDoctorModal()" class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all">
          <i class="fa-solid fa-user-plus mr-2"></i> Register New Doctor
        </button>
      </div>

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
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
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
                  <span [class]="doc.pendingCommissionDue > 0 ? 'text-rose-600 font-black' : 'text-slate-400'">
                    ₹{{ doc.pendingCommissionDue | number:'1.2-2' }}
                  </span>
                </td>
                <td class="p-3.5 text-right">
                  <button (click)="openPayoutModal(doc)" [disabled]="doc.pendingCommissionDue <= 0"
                    class="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors disabled:opacity-40">
                    Pay Commission
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Doctor Modal -->
      <div *ngIf="showAddModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 class="text-sm font-bold text-slate-900 font-heading">Register Referring Doctor</h3>
            <button (click)="showAddModal = false" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Doctor Full Name *</label>
              <input type="text" [(ngModel)]="newDoc.doctorName" placeholder="Dr. S. K. Gupta" class="w-full px-3 py-2 border rounded-xl">
            </div>
            <div class="grid grid-cols-2 gap-2">
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

          <button (click)="createDoctor()" class="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow-md">
            Save Doctor
          </button>
        </div>
      </div>

      <!-- Payout Modal -->
      <div *ngIf="payoutDoc" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 class="text-sm font-bold text-slate-900 font-heading">Record Commission Payout</h3>
            <button (click)="payoutDoc = null" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
            <div><span class="text-slate-500">Doctor:</span> <strong class="text-slate-900">{{ payoutDoc.doctorName }}</strong></div>
            <div><span class="text-slate-500">Pending Commission:</span> <strong class="text-rose-600">₹{{ payoutDoc.pendingCommissionDue }}</strong></div>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Payout Amount (₹)</label>
              <input type="number" [(ngModel)]="payoutData.paidAmount" min="1" [max]="payoutDoc.pendingCommissionDue"
                class="w-full px-3 py-2 border rounded-xl font-bold text-emerald-600">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select [(ngModel)]="payoutData.paymentMethod" class="w-full px-3 py-2 border rounded-xl">
                <option [value]="1">Cash</option>
                <option [value]="2">UPI / GPay</option>
                <option [value]="4">Bank Transfer / NEFT</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Transaction Ref / Remarks</label>
              <input type="text" [(ngModel)]="payoutData.transactionReference" placeholder="UTR or Bank Reference" class="w-full px-3 py-2 border rounded-xl">
            </div>
          </div>

          <button (click)="submitPayout()" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md">
            Confirm Payout
          </button>
        </div>
      </div>
    </div>
  `
})
export class DoctorReferralsComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  doctors: DoctorReferral[] = [];
  showAddModal = false;
  payoutDoc: DoctorReferral | null = null;

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
    paymentMethod: 4,
    transactionReference: '',
    periodStartDate: new Date().toISOString(),
    periodEndDate: new Date().toISOString()
  };

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.api.getDoctors().subscribe(docs => {
      this.doctors = docs || [];
      this.cdr.detectChanges();
    });
  }

  openAddDoctorModal(): void {
    this.showAddModal = true;
  }

  createDoctor(): void {
    if (!this.newDoc.doctorName) return;
    this.api.createDoctor(this.newDoc).subscribe({
      next: () => {
        this.showAddModal = false;
        this.loadDoctors();
      },
      error: (err) => alert(err.error?.message || 'Error saving doctor.')
    });
  }

  openPayoutModal(doc: DoctorReferral): void {
    this.payoutDoc = doc;
    this.payoutData.paidAmount = doc.pendingCommissionDue;
  }

  submitPayout(): void {
    if (!this.payoutDoc) return;
    const payload = {
      doctorId: this.payoutDoc.id,
      paidAmount: this.payoutData.paidAmount,
      paymentMethod: Number(this.payoutData.paymentMethod),
      transactionReference: this.payoutData.transactionReference,
      periodStartDate: this.payoutData.periodStartDate,
      periodEndDate: this.payoutData.periodEndDate
    };

    this.api.recordDoctorPayout(payload).subscribe({
      next: () => {
        this.payoutDoc = null;
        alert('Payout recorded successfully!');
        this.loadDoctors();
      },
      error: (err) => alert(err.error?.message || 'Error recording payout.')
    });
  }
}
