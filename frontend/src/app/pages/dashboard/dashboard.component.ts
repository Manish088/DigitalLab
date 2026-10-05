import { Component, OnInit, inject, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats } from '../../core/models/lims.models';

declare var Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Welcome Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-brand-900 via-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <i class="fa-solid fa-circle text-[8px] mr-1 text-emerald-400"></i> Cloud LIMS Active
            </span>
            <span class="text-xs text-slate-400">| Today: {{ todayStr }}</span>
          </div>
          <h2 class="text-2xl font-bold font-heading">Welcome back, {{ currentUser()?.fullName }}!</h2>
          <p class="text-sm text-slate-300">{{ currentUser()?.labName }} - Pathology Management Center</p>
        </div>

        <div class="mt-4 md:mt-0 flex items-center space-x-3">
          <a routerLink="/cases/add" class="inline-flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/30 transition-all">
            <i class="fa-solid fa-plus mr-2"></i> New Patient Case
          </a>
          <a routerLink="/transactions" class="inline-flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-700/80 hover:bg-slate-700 text-white border border-slate-600 transition-all">
            <i class="fa-solid fa-receipt mr-2"></i> Day Ledger
          </a>
        </div>
      </div>

      <!-- KPI Summary Cards Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4" *ngIf="stats">
        <!-- Today Cases -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div class="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
              <i class="fa-solid fa-calendar-day"></i>
            </div>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">Today</span>
          </div>
          <div class="mt-4">
            <div class="text-2xl font-black text-slate-900">{{ stats.todayCases }}</div>
            <div class="text-xs text-slate-500 mt-0.5">Today's Registered Cases</div>
          </div>
        </div>

        <!-- Today Collection -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              <i class="fa-solid fa-indian-rupee-sign"></i>
            </div>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">Revenue</span>
          </div>
          <div class="mt-4">
            <div class="text-2xl font-black text-slate-900">₹{{ stats.todayCollection | number:'1.0-0' }}</div>
            <div class="text-xs text-slate-500 mt-0.5">Today's Counter Collection</div>
          </div>
        </div>

        <!-- Pending Tests -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
              <i class="fa-solid fa-hourglass-half"></i>
            </div>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">Pending</span>
          </div>
          <div class="mt-4">
            <div class="text-2xl font-black text-slate-900">{{ stats.pendingTests }}</div>
            <div class="text-xs text-slate-500 mt-0.5">Tests Awaiting Results</div>
          </div>
        </div>

        <!-- Pending Dues -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div class="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
              <i class="fa-solid fa-hand-holding-dollar"></i>
            </div>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold">Outstanding</span>
          </div>
          <div class="mt-4">
            <div class="text-2xl font-black text-rose-600">₹{{ stats.totalPendingDues | number:'1.0-0' }}</div>
            <div class="text-xs text-slate-500 mt-0.5">Total Uncollected Balance</div>
          </div>
        </div>
      </div>

      <!-- Today's Counter Closing & Cash Reconciliation Card -->
      <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-700/60 relative overflow-hidden" *ngIf="stats">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg shadow-inner">
              <i class="fa-solid fa-cash-register"></i>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-base font-bold font-heading">Today's Counter Closing & Reconciliation</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">LIVE RECONCILIATION</span>
              </div>
              <p class="text-xs text-slate-400">Cash in drawer, UPI/QR, Cards, and Balance Dues for counter closeout.</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <a routerLink="/transactions" class="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-all border border-slate-600">
              <i class="fa-solid fa-list-check mr-1.5"></i> Detailed Day Ledger
            </a>
          </div>
        </div>

        <!-- 4 Column Reconciliation Metrics -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <!-- 1. Cash in Counter -->
          <div class="bg-slate-800/80 p-4 rounded-2xl border border-emerald-500/30 relative">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-300">Cash in Drawer</span>
              <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                <i class="fa-solid fa-money-bill-wave"></i>
              </div>
            </div>
            <div class="text-2xl font-black text-emerald-400 mt-2">₹{{ (stats.todayCashCollection || 0) | number:'1.2-2' }}</div>
            <div class="text-[11px] text-slate-400 mt-1">Physical Cash at Desk</div>
          </div>

          <!-- 2. UPI / QR Code -->
          <div class="bg-slate-800/80 p-4 rounded-2xl border border-blue-500/30 relative">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-300">UPI / QR Code</span>
              <div class="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">
                <i class="fa-solid fa-qrcode"></i>
              </div>
            </div>
            <div class="text-2xl font-black text-blue-400 mt-2">₹{{ (stats.todayUpiCollection || 0) | number:'1.2-2' }}</div>
            <div class="text-[11px] text-slate-400 mt-1">GPay / PhonePe / Paytm</div>
          </div>

          <!-- 3. Card / Net Banking -->
          <div class="bg-slate-800/80 p-4 rounded-2xl border border-purple-500/30 relative">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-300">Card / Online</span>
              <div class="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">
                <i class="fa-solid fa-credit-card"></i>
              </div>
            </div>
            <div class="text-2xl font-black text-purple-400 mt-2">₹{{ (stats.todayCardCollection || 0) | number:'1.2-2' }}</div>
            <div class="text-[11px] text-slate-400 mt-1">POS Card & Net Banking</div>
          </div>

          <!-- 4. Today's Uncollected Due -->
          <div class="bg-slate-800/80 p-4 rounded-2xl border border-amber-500/30 relative">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-300">Today's Due Left</span>
              <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">
                <i class="fa-solid fa-clock-rotate-left"></i>
              </div>
            </div>
            <div class="text-2xl font-black text-amber-400 mt-2">₹{{ (stats.todayDueCreated || 0) | number:'1.2-2' }}</div>
            <div class="text-[11px] text-slate-400 mt-1">Unpaid Balance from Today</div>
          </div>
        </div>

        <!-- Quick Summary Bar at Bottom -->
        <div class="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div class="flex items-center space-x-4">
            <span>Today's Total Billed: <strong class="text-white">₹{{ (stats.todayBilledAmount || 0) | number:'1.2-2' }}</strong></span>
            <span>•</span>
            <span>Total Cash+UPI Inflow: <strong class="text-emerald-400">₹{{ (stats.todayCollection || 0) | number:'1.2-2' }}</strong></span>
            <span>•</span>
            <span>Discount Given: <strong class="text-rose-400">₹{{ (stats.todayDiscountGiven || 0) | number:'1.2-2' }}</strong></span>
          </div>
          <div class="text-slate-400 font-mono text-[11px]">
            Reconciled across {{ stats.todayCases }} cases
          </div>
        </div>
      </div>

      <!-- Secondary KPIs Strip -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3" *ngIf="stats">
        <div class="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-400">Total Patients</div>
            <div class="text-lg font-bold">{{ stats.totalPatients }}</div>
          </div>
          <i class="fa-solid fa-users text-slate-600 text-xl"></i>
        </div>
        <div class="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-400">Verified Reports</div>
            <div class="text-lg font-bold text-emerald-400">{{ stats.approvedReports }}</div>
          </div>
          <i class="fa-solid fa-circle-check text-slate-600 text-xl"></i>
        </div>
        <div class="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-400">Referred Doctors</div>
            <div class="text-lg font-bold">{{ stats.totalDoctors }}</div>
          </div>
          <i class="fa-solid fa-user-doctor text-slate-600 text-xl"></i>
        </div>
        <div class="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-400">Monthly Revenue</div>
            <div class="text-lg font-bold text-brand-400">₹{{ stats.monthlyRevenue | number:'1.0-0' }}</div>
          </div>
          <i class="fa-solid fa-chart-line text-slate-600 text-xl"></i>
        </div>
      </div>

      <!-- Revenue Chart & Recent Cases Table -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 7-Day Revenue Trend Chart -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-1">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-slate-900 font-heading">7-Day Revenue Trend</h3>
            <span class="text-xs text-slate-400"><i class="fa-solid fa-chart-simple mr-1"></i> Live</span>
          </div>
          <div class="h-64 relative">
            <canvas #revenueChartCanvas></canvas>
          </div>
        </div>

        <!-- Recent Registered Cases -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-slate-900 font-heading">Recent Cases Workflow</h3>
            <a routerLink="/cases" class="text-xs font-semibold text-brand-600 hover:text-brand-700">View All Cases &rarr;</a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th class="p-3">Case No / Barcode</th>
                  <th class="p-3">Patient Details</th>
                  <th class="p-3">Bill / Due</th>
                  <th class="p-3">Status</th>
                  <th class="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100" *ngIf="stats?.recentCases">
                <tr *ngFor="let c of stats?.recentCases" class="hover:bg-slate-50/80 transition-colors">
                  <td class="p-3">
                    <div class="font-bold text-slate-900">{{ c.caseNumber }}</div>
                    <div class="text-[11px] font-mono text-slate-500">||| {{ c.barcode }}</div>
                  </td>
                  <td class="p-3">
                    <div class="font-semibold text-slate-800">{{ c.patientName }}</div>
                    <div class="text-slate-400 text-[11px]">{{ c.patientPhone }}</div>
                  </td>
                  <td class="p-3">
                    <div class="font-semibold text-slate-800">₹{{ c.netAmount | number:'1.2-2' }}</div>
                    <div *ngIf="c.dueAmount > 0" class="text-rose-600 font-semibold text-[11px]">Due: ₹{{ c.dueAmount }}</div>
                    <div *ngIf="c.dueAmount <= 0" class="text-emerald-600 font-semibold text-[11px]">Paid Full</div>
                  </td>
                  <td class="p-3">
                    <span [ngClass]="{
                      'bg-emerald-50 text-emerald-700 border-emerald-200': c.status === 'Approved',
                      'bg-blue-50 text-blue-700 border-blue-200': c.status === 'Completed',
                      'bg-amber-50 text-amber-700 border-amber-200': c.status === 'Registered' || c.status === 'SampleCollected',
                      'bg-purple-50 text-purple-700 border-purple-200': c.status === 'InProgress'
                    }" class="px-2.5 py-1 rounded-full text-[11px] font-semibold border">
                      {{ c.status }}
                    </span>
                  </td>
                  <td class="p-3 text-right space-x-1">
                    <a [routerLink]="['/investigations', c.id]" class="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 hover:bg-brand-50 hover:text-brand-600 font-medium transition-colors" title="Enter Results">
                      <i class="fa-solid fa-microscope text-xs mr-1"></i> Enter Result
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('revenueChartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  currentUser = this.authService.currentUserSignal;
  stats: DashboardStats | null = null;
  todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.api.getDashboardStats().subscribe({
      next: (res) => {
        this.stats = res;
        this.cdr.detectChanges();
        setTimeout(() => this.renderChart(), 100);

        // Fetch Live Transactions to guarantee dynamic Counter Closing values even before backend restart
        this.api.getTransactions().subscribe({
          next: (txRes) => {
            if (txRes && this.stats) {
              if (txRes.todayClosing && (txRes.todayClosing.todayCash > 0 || txRes.todayClosing.todayUpi > 0 || txRes.todayClosing.todayBilled > 0)) {
                this.stats.todayCashCollection = txRes.todayClosing.todayCash;
                this.stats.todayUpiCollection = txRes.todayClosing.todayUpi;
                this.stats.todayCardCollection = txRes.todayClosing.todayCard;
                this.stats.todayBilledAmount = txRes.todayClosing.todayBilled;
                this.stats.todayDiscountGiven = txRes.todayClosing.todayDiscount;
                this.stats.todayDueCreated = txRes.todayClosing.todayDueCreated;
              } else if (txRes.transactions && txRes.transactions.length > 0) {
                const today = new Date().toDateString();
                const todayTxns = txRes.transactions.filter((t: any) => new Date(t.transactionDate).toDateString() === today);

                const cashSum = todayTxns
                  .filter((t: any) => t.paymentMethod === 'Cash' || t.paymentMethod === '1' || t.paymentMethod === 1)
                  .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

                const upiSum = todayTxns
                  .filter((t: any) => t.paymentMethod === 'UPI' || t.paymentMethod === 'Upi' || t.paymentMethod === '2' || t.paymentMethod === 2)
                  .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

                const cardSum = todayTxns
                  .filter((t: any) => t.paymentMethod === 'Card' || t.paymentMethod === 'NetBanking' || t.paymentMethod === 3 || t.paymentMethod === 4)
                  .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

                this.stats.todayCashCollection = cashSum;
                this.stats.todayUpiCollection = upiSum;
                this.stats.todayCardCollection = cardSum;
                if (!this.stats.todayBilledAmount) {
                  this.stats.todayBilledAmount = cashSum + upiSum + cardSum;
                }
              }
              this.cdr.detectChanges();
            }
          },
          error: (err) => console.error('Error fetching transactions for dashboard counter:', err)
        });
      },
      error: (err) => console.error(err)
    });
  }

  renderChart(): void {
    if (!this.stats || !this.chartCanvas) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.stats.revenueTrend.map(x => x.date);
    const data = this.stats.revenueTrend.map(x => x.revenue);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Collection (₹)',
          data: data,
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: '#0284c7',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { font: { size: 10 } }
          },
          x: {
            ticks: { font: { size: 10 } }
          }
        }
      }
    });
  }
}
