import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
            Super Administrator Control Center
          </span>
          <h2 class="text-2xl font-black font-heading mt-2">Multi-Tenant Platform Command</h2>
          <p class="text-xs text-amber-100">Global pathology labs overview, active SaaS subscriptions, trial leads, and platform health.</p>
        </div>
      </div>

      <!-- Platform Global KPIs Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4" *ngIf="adminStats">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div class="text-xs text-slate-500 font-semibold">Total Registered Labs</div>
          <div class="text-2xl font-black text-slate-900 mt-1">{{ adminStats.totalLabs }}</div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div class="text-xs text-slate-500 font-semibold">Active Subscriptions</div>
          <div class="text-2xl font-black text-emerald-600 mt-1">{{ adminStats.activeLabs }}</div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div class="text-xs text-slate-500 font-semibold">System-Wide Cases Processed</div>
          <div class="text-2xl font-black text-brand-600 mt-1">{{ adminStats.totalCasesSystemWide }}</div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div class="text-xs text-slate-500 font-semibold">Platform Revenue</div>
          <div class="text-2xl font-black text-purple-600 mt-1">₹{{ adminStats.totalPlatformRevenueAnnual | number:'1.0-0' }}</div>
        </div>
      </div>

      <!-- Labs List -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-sm text-slate-900 font-heading">Registered Laboratories & Tenants</h3>
          <span class="text-xs text-slate-500">{{ labs.length }} labs</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th class="p-3.5">Lab Code / Name</th>
                <th class="p-3.5">Owner / Contact</th>
                <th class="p-3.5">Location</th>
                <th class="p-3.5">SaaS Plan Status</th>
                <th class="p-3.5">Expiry Date</th>
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let lab of labs" class="hover:bg-slate-50/80 transition-colors">
                <td class="p-3.5">
                  <div class="font-bold text-slate-900">{{ lab.labName }}</div>
                  <span class="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">{{ lab.labCode }}</span>
                </td>
                <td class="p-3.5">
                  <div class="font-semibold text-slate-800">{{ lab.ownerName }}</div>
                  <div class="text-slate-400 text-[11px]">{{ lab.email }} • {{ lab.phone }}</div>
                </td>
                <td class="p-3.5 text-slate-600">
                  {{ lab.city }}, {{ lab.state }}
                </td>
                <td class="p-3.5">
                  <span [class]="lab.subscriptionStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'"
                    class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border">
                    {{ lab.subscriptionStatus }}
                  </span>
                </td>
                <td class="p-3.5 text-slate-600">
                  {{ lab.subscriptionExpiryDate ? (lab.subscriptionExpiryDate | date:'dd MMM yyyy') : 'Trial' }}
                </td>
                <td class="p-3.5 text-right">
                  <button (click)="toggleLab(lab)"
                    [class]="lab.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'"
                    class="px-3 py-1 rounded-lg border text-xs font-bold transition-colors">
                    {{ lab.isActive ? 'Suspend' : 'Activate' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class SuperAdminComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  adminStats: any = null;
  labs: any[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getSuperAdminDashboard().subscribe(res => {
      this.adminStats = res;
      this.cdr.detectChanges();
    });
    this.api.getSuperAdminLabs().subscribe(res => {
      this.labs = res || [];
      this.cdr.detectChanges();
    });
  }

  toggleLab(lab: any): void {
    const newState = !lab.isActive;
    this.api.updateLabStatus(lab.id, newState).subscribe({
      next: () => {
        lab.isActive = newState;
        this.toast.info(`Lab ${lab.labName} is now ${newState ? 'Active' : 'Disabled'}.`);
        this.cdr.detectChanges();
      },
      error: () => this.toast.error('Error updating lab status.')
    });
  }
}
