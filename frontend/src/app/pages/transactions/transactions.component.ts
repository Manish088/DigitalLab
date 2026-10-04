import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900 font-heading">Financial Ledger & Day-End Cash Closeout</h2>
          <p class="text-xs text-slate-500">Track all incoming payments, payment mode splits (Cash, UPI, Card), and counter collections.</p>
        </div>
      </div>

      <!-- Filters & Summary Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label class="block text-[10px] text-slate-400 font-semibold mb-0.5">From Date</label>
            <input type="date" [(ngModel)]="fromDate" (change)="loadTransactions()" class="px-2.5 py-1.5 border rounded-lg text-xs">
          </div>
          <div>
            <label class="block text-[10px] text-slate-400 font-semibold mb-0.5">To Date</label>
            <input type="date" [(ngModel)]="toDate" (change)="loadTransactions()" class="px-2.5 py-1.5 border rounded-lg text-xs">
          </div>
          <div>
            <label class="block text-[10px] text-slate-400 font-semibold mb-0.5">Payment Method</label>
            <select [(ngModel)]="selectedPaymentMethod" (change)="loadTransactions()" class="px-2.5 py-1.5 border rounded-lg text-xs">
              <option value="">All Payment Modes</option>
              <option [value]="1">Cash Counter</option>
              <option [value]="2">UPI / QR Code</option>
              <option [value]="3">Card</option>
              <option [value]="4">Net Banking</option>
            </select>
          </div>
        </div>

        <!-- Total Collection Display -->
        <div class="p-3 bg-slate-900 text-white rounded-xl flex items-center space-x-4">
          <div>
            <div class="text-[10px] text-slate-400">Total Filtered Revenue</div>
            <div class="text-lg font-black text-emerald-400">₹{{ totalCollection | number:'1.2-2' }}</div>
          </div>
          <span class="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 font-mono">{{ count }} receipts</span>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th class="p-3.5">Txn Receipt No</th>
                <th class="p-3.5">Case / Patient Details</th>
                <th class="p-3.5">Date & Time</th>
                <th class="p-3.5">Payment Mode</th>
                <th class="p-3.5">Reference / Notes</th>
                <th class="p-3.5">Received By</th>
                <th class="p-3.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <!-- Loading Row -->
              <tr *ngIf="loading">
                <td colspan="7" class="p-8 text-center text-slate-500">
                  <i class="fa-solid fa-circle-notch fa-spin text-2xl text-brand-600 mb-2"></i>
                  <div class="text-xs font-semibold text-slate-600">Loading Financial Ledger & Day Collections...</div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="!loading && transactions.length === 0">
                <td colspan="7" class="p-8 text-center text-slate-500 space-y-1">
                  <i class="fa-solid fa-receipt text-2xl text-slate-300"></i>
                  <div class="text-xs font-bold text-slate-700">No payment transactions found</div>
                  <p class="text-[11px] text-slate-400">No transactions recorded for the selected date range and payment mode.</p>
                </td>
              </tr>

              <tr *ngFor="let tx of transactions" class="hover:bg-slate-50/80 transition-colors">
                <td class="p-3.5 font-mono font-bold text-slate-900">
                  {{ tx.transactionNumber }}
                </td>
                <td class="p-3.5">
                  <div class="font-bold text-slate-800">{{ tx.patientName }}</div>
                  <div class="text-[11px] text-brand-600 font-mono">Case: {{ tx.caseNumber }}</div>
                </td>
                <td class="p-3.5 text-slate-600">
                  {{ tx.transactionDate | date:'dd MMM yyyy, hh:mm a' }}
                </td>
                <td class="p-3.5">
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                    {{ tx.paymentMethod }}
                  </span>
                </td>
                <td class="p-3.5 text-slate-500 font-mono text-[11px]">
                  {{ tx.referenceNumber || tx.remarks || '-' }}
                </td>
                <td class="p-3.5 text-slate-600">
                  {{ tx.receivedByName || 'Cashier Desk' }}
                </td>
                <td class="p-3.5 text-right font-black text-emerald-600 text-sm">
                  ₹{{ tx.amount | number:'1.2-2' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class TransactionsComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  transactions: any[] = [];
  totalCollection = 0;
  count = 0;
  loading = false;

  fromDate = '';
  toDate = '';
  selectedPaymentMethod = '';

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.api.getTransactions(
      this.fromDate || undefined,
      this.toDate || undefined,
      this.selectedPaymentMethod ? Number(this.selectedPaymentMethod) : undefined
    ).subscribe({
      next: (res) => {
        this.transactions = res.transactions || [];
        this.totalCollection = res.totalCollection || 0;
        this.count = res.count || 0;
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
}
