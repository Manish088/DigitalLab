import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

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
        <div class="flex items-center space-x-3">
          <button (click)="exportToCsv()" [disabled]="loading || transactions.length === 0" class="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer" title="Export transactions to Excel / CSV">
            <i class="fa-solid fa-file-excel mr-2 text-white"></i> Export to Excel (CSV)
          </button>
          <button *ngIf="todayClosing" (click)="printDayClosingSummary()" class="inline-flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/20 transition-all cursor-pointer">
            <i class="fa-solid fa-print mr-2 text-amber-400"></i> Print Day-End Closeout Slip
          </button>
        </div>
      </div>

      <!-- Today's Counter Closing & Reconciliation Summary Card -->
      <div *ngIf="todayClosing" class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg">
              <i class="fa-solid fa-cash-register"></i>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-base font-bold font-heading">Today's Counter Closing & Reconciliation</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">CASH DESK</span>
              </div>
              <p class="text-xs text-slate-400">Evening cash reconciliation for cashier desk and bank hand-over.</p>
            </div>
          </div>
          <div class="text-xs font-mono text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <i class="fa-solid fa-calendar-day mr-1.5 text-emerald-400"></i> {{ todayStr }}
          </div>
        </div>

        <!-- 4 Grid Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <!-- Cash in Drawer -->
          <div class="bg-slate-800/80 p-4 rounded-2xl border border-emerald-500/30">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-300">Cash in Drawer</span>
              <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                <i class="fa-solid fa-money-bill-wave"></i>
              </div>
            </div>
            <div class="text-2xl font-black text-emerald-400 mt-2">₹{{ todayClosing.todayCash | number:'1.2-2' }}</div>
            <div class="text-[11px] text-slate-400 mt-1">Physical Cash Counter</div>
          </div>

          <!-- UPI / QR -->
          <div class="bg-slate-800/80 p-4 rounded-2xl border border-blue-500/30">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-300">UPI / QR Code</span>
              <div class="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">
                <i class="fa-solid fa-qrcode"></i>
              </div>
            </div>
            <div class="text-2xl font-black text-blue-400 mt-2">₹{{ todayClosing.todayUpi | number:'1.2-2' }}</div>
            <div class="text-[11px] text-slate-400 mt-1">Direct Bank (GPay / PhonePe)</div>
          </div>

          <!-- Card / Online -->
          <div class="bg-slate-800/80 p-4 rounded-2xl border border-purple-500/30">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-300">POS Card / Online</span>
              <div class="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">
                <i class="fa-solid fa-credit-card"></i>
              </div>
            </div>
            <div class="text-2xl font-black text-purple-400 mt-2">₹{{ todayClosing.todayCard | number:'1.2-2' }}</div>
            <div class="text-[11px] text-slate-400 mt-1">Card Swipes & Net Banking</div>
          </div>

          <!-- Today's Due Left -->
          <div class="bg-slate-800/80 p-4 rounded-2xl border border-amber-500/30">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-300">Today's Due Left</span>
              <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">
                <i class="fa-solid fa-clock-rotate-left"></i>
              </div>
            </div>
            <div class="text-2xl font-black text-amber-400 mt-2">₹{{ todayClosing.todayDueCreated | number:'1.2-2' }}</div>
            <div class="text-[11px] text-slate-400 mt-1">Unpaid from Today's Cases</div>
          </div>
        </div>

        <!-- Quick Summary Footer Bar -->
        <div class="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div class="flex items-center space-x-3">
            <span>Today's Billed: <strong class="text-white">₹{{ todayClosing.todayBilled | number:'1.2-2' }}</strong></span>
            <span>•</span>
            <span>Total Collected: <strong class="text-emerald-400 font-bold">₹{{ todayClosing.todayTotalCollection | number:'1.2-2' }}</strong></span>
            <span>•</span>
            <span>Discounts: <strong class="text-rose-400">₹{{ todayClosing.todayDiscount | number:'1.2-2' }}</strong></span>
          </div>
          <div class="text-slate-300 font-mono text-[11px]">
            {{ todayClosing.todayCasesCount }} Case(s) Booked Today
          </div>
        </div>
      </div>

      <!-- Filters & Summary Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label class="block text-[10px] text-slate-400 font-semibold mb-0.5">From Date</label>
            <input type="date" [(ngModel)]="fromDate" (change)="onFilterChange()" class="px-2.5 py-1.5 border rounded-lg text-xs">
          </div>
          <div>
            <label class="block text-[10px] text-slate-400 font-semibold mb-0.5">To Date</label>
            <input type="date" [(ngModel)]="toDate" (change)="onFilterChange()" class="px-2.5 py-1.5 border rounded-lg text-xs">
          </div>
          <div>
            <label class="block text-[10px] text-slate-400 font-semibold mb-0.5">Payment Method</label>
            <select [(ngModel)]="selectedPaymentMethod" (change)="onFilterChange()" class="px-2.5 py-1.5 border rounded-lg text-xs">
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

        <!-- Pagination Footer Bar -->
        <div *ngIf="count > 0" class="px-4 py-3 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <!-- Left: Showing range & Rows per page -->
          <div class="flex flex-wrap items-center gap-3 text-slate-500">
            <span>
              Showing <strong class="text-slate-900 font-semibold">{{ startIndex }}</strong> - <strong class="text-slate-900 font-semibold">{{ endIndex }}</strong> of <strong class="text-slate-900 font-semibold">{{ count }}</strong> receipts
            </span>
            <span class="text-slate-300 hidden sm:inline">•</span>
            <div class="flex items-center space-x-1.5">
              <span class="text-[11px] text-slate-500">Per page:</span>
              <select [(ngModel)]="pageSize" (change)="onPageSizeChange()" class="px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium cursor-pointer">
                <option [ngValue]="10">10</option>
                <option [ngValue]="20">20</option>
                <option [ngValue]="50">50</option>
                <option [ngValue]="100">100</option>
              </select>
            </div>
          </div>

          <!-- Right: Page Navigation -->
          <div class="flex items-center space-x-1">
            <button type="button" (click)="goToPage(1)" [disabled]="page === 1 || loading"
              class="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600 cursor-pointer"
              title="First Page">
              <i class="fa-solid fa-angles-left text-xs"></i>
            </button>
            <button type="button" (click)="goToPage(page - 1)" [disabled]="page === 1 || loading"
              class="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600 cursor-pointer"
              title="Previous Page">
              <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>

            <!-- Page Number Pills -->
            <ng-container *ngFor="let p of visiblePages">
              <button *ngIf="p !== -1" type="button" (click)="goToPage(p)"
                [class]="p === page ? 'bg-brand-600 text-white font-bold border-brand-600 shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'"
                class="min-w-8 h-8 px-2 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer">
                {{ p }}
              </button>
              <span *ngIf="p === -1" class="px-1 text-slate-400 font-bold">...</span>
            </ng-container>

            <button type="button" (click)="goToPage(page + 1)" [disabled]="page === totalPages || loading"
              class="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600 cursor-pointer"
              title="Next Page">
              <i class="fa-solid fa-chevron-right text-xs"></i>
            </button>
            <button type="button" (click)="goToPage(totalPages)" [disabled]="page === totalPages || loading"
              class="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600 cursor-pointer"
              title="Last Page">
              <i class="fa-solid fa-angles-right text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TransactionsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  transactions: any[] = [];
  totalCollection = 0;
  count = 0;
  loading = false;
  todayClosing: any = null;
  labName = 'CITY CARE DIAGNOSTICS & PATHOLOGY';

  fromDate = '';
  toDate = '';
  selectedPaymentMethod = '';

  // Pagination State
  page = 1;
  pageSize = 10;
  totalPages = 1;

  get startIndex(): number {
    if (this.count === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.page * this.pageSize, this.count);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.page;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1);

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (current < total - 2) pages.push(-1);
      pages.push(total);
    }
    return pages;
  }

  get todayStr(): string {
    return new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  ngOnInit(): void {
    this.loadTransactions();
    this.api.getLetterheadConfig().subscribe(cfg => {
      if (cfg?.labName) this.labName = cfg.labName;
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadTransactions();
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.loadTransactions();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.api.getTransactions(
      this.fromDate || undefined,
      this.toDate || undefined,
      this.selectedPaymentMethod ? Number(this.selectedPaymentMethod) : undefined,
      this.page,
      this.pageSize
    ).subscribe({
      next: (res) => {
        this.transactions = res.transactions || [];
        this.totalCollection = res.totalCollection || 0;
        this.count = res.count || 0;
        this.page = res.page || 1;
        this.pageSize = res.pageSize || 10;
        this.totalPages = res.totalPages || Math.ceil(this.count / this.pageSize) || 1;
        if (res.todayClosing) {
          this.todayClosing = res.todayClosing;
        }
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

  printDayClosingSummary(): void {
    if (!this.todayClosing) return;

    const printWindow = window.open('', '', 'width=450,height=600');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Counter Closeout - ${this.todayStr}</title>
          <style>
            @page { size: 80mm auto; margin: 3mm; }
            body { font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.3; margin: 0; padding: 4px; color: #000; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .border-dashed { border-bottom: 1px dashed #000; margin: 5px 0; }
            .flex { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="text-center font-bold uppercase">${this.labName}</div>
          <div class="text-center">DAILY COUNTER CLOSEOUT SUMMARY</div>
          <div class="text-center">Date: ${this.todayStr}</div>
          <div class="border-dashed"></div>
          <div class="flex"><span>Total Cases Booked:</span><strong>${this.todayClosing.todayCasesCount}</strong></div>
          <div class="flex"><span>Gross Billed Amount:</span><strong>Rs. ${this.todayClosing.todayBilled.toFixed(2)}</strong></div>
          <div class="flex"><span>Discounts Given:</span><strong>-Rs. ${this.todayClosing.todayDiscount.toFixed(2)}</strong></div>
          <div class="border-dashed"></div>
          <div class="text-center font-bold">PAYMENT RECONCILIATION</div>
          <div class="border-dashed"></div>
          <div class="flex"><span>1. Cash in Drawer:</span><strong>Rs. ${this.todayClosing.todayCash.toFixed(2)}</strong></div>
          <div class="flex"><span>2. UPI / QR Bank:</span><strong>Rs. ${this.todayClosing.todayUpi.toFixed(2)}</strong></div>
          <div class="flex"><span>3. Card / Online:</span><strong>Rs. ${this.todayClosing.todayCard.toFixed(2)}</strong></div>
          <div class="border-dashed"></div>
          <div class="flex font-bold" style="font-size:12px;"><span>TOTAL COLLECTION:</span><span>Rs. ${this.todayClosing.todayTotalCollection.toFixed(2)}</span></div>
          <div class="border-dashed"></div>
          <div class="flex"><span>Today's Balance Due:</span><strong>Rs. ${this.todayClosing.todayDueCreated.toFixed(2)}</strong></div>
          <div class="border-dashed"></div>
          <div style="margin-top:20px;" class="flex"><span>Cashier Sign: ________</span><span>Manager Sign: ________</span></div>
          <div class="text-center" style="font-size:9px; margin-top:10px;">*** Day-End Financial Closeout ***</div>
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

  exportToCsv(): void {
    if (!this.transactions || this.transactions.length === 0) {
      this.toast.warning('No transaction records available to export.');
      return;
    }

    const headers = [
      'Txn Receipt Number',
      'Date & Time',
      'Case Number',
      'Patient Name',
      'Payment Mode',
      'Reference / Notes',
      'Received By',
      'Amount Collected (INR)'
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = this.transactions.map(tx => {
      const dateFormatted = tx.transactionDate ? new Date(tx.transactionDate).toLocaleString('en-IN') : '';
      return [
        escapeCsv(tx.transactionNumber),
        escapeCsv(dateFormatted),
        escapeCsv(tx.caseNumber),
        escapeCsv(tx.patientName),
        escapeCsv(tx.paymentMethod),
        escapeCsv(tx.referenceNumber || tx.remarks || '-'),
        escapeCsv(tx.receivedByName || 'Cashier Desk'),
        escapeCsv(Number(tx.amount || 0).toFixed(2))
      ].join(',');
    });

    const summaryRow = [
      escapeCsv('TOTAL REVENUE'),
      escapeCsv(''),
      escapeCsv(''),
      escapeCsv(''),
      escapeCsv(''),
      escapeCsv(''),
      escapeCsv(`${this.count} Receipts`),
      escapeCsv(Number(this.totalCollection || 0).toFixed(2))
    ].join(',');

    const csvContent = '\uFEFF' + [headers.join(','), ...rows, summaryRow].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    link.setAttribute('href', url);
    link.setAttribute('download', `Financial_Transactions_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.toast.success(`Exported ${this.transactions.length} transactions to Excel (CSV) successfully!`);
  }
}

