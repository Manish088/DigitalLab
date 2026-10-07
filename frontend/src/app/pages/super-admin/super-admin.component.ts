import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-12">
      <!-- SuperAdmin Header Banner -->
      <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-800">
        <div>
          <div class="flex items-center space-x-2">
            <span class="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center space-x-1.5">
              <i class="fa-solid fa-crown text-amber-400"></i>
              <span>SUPERADMIN SaaS COMMAND CENTER</span>
            </span>
            <span class="text-xs text-slate-400">Enterprise Multi-Tenant</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-black font-heading mt-2 tracking-tight">Platform Fleet Control</h2>
          <p class="text-xs sm:text-sm text-slate-300 mt-0.5">Manage tenants, 1-click lab access, subscription plans, central helpdesk, and global broadcast announcements.</p>
        </div>
        
        <div class="flex flex-wrap items-center gap-2.5">
          <button (click)="openCreateLabModal()" class="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center space-x-1.5 cursor-pointer">
            <i class="fa-solid fa-plus-circle"></i>
            <span>Onboard New Lab</span>
          </button>
          <button (click)="loadData()" class="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center space-x-1.5 cursor-pointer">
            <i class="fa-solid fa-arrows-rotate" [ngClass]="loading ? 'fa-spin' : ''"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Global KPIs Summary -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4" *ngIf="adminStats">
        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div class="absolute right-3 top-3 text-slate-100 group-hover:text-brand-50 transition-colors text-4xl -z-0">
            <i class="fa-solid fa-hospital"></i>
          </div>
          <div class="relative z-10">
            <div class="text-[11px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Total Laboratories</div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ adminStats.totalLabs }}</div>
            <div class="text-[11px] text-emerald-600 font-bold mt-1 flex items-center">
              <i class="fa-solid fa-check-circle mr-1"></i> {{ adminStats.activeLabs }} Active
            </div>
          </div>
        </div>

        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div class="absolute right-3 top-3 text-slate-100 group-hover:text-amber-50 transition-colors text-4xl -z-0">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div class="relative z-10">
            <div class="text-[11px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Expiring / Pending</div>
            <div class="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{{ getExpiringSoonLabsCount() }}</div>
            <div class="text-[11px] text-slate-500 font-semibold mt-1">Expiring within 7 days</div>
          </div>
        </div>

        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div class="absolute right-3 top-3 text-slate-100 group-hover:text-emerald-50 transition-colors text-4xl -z-0">
            <i class="fa-solid fa-indian-rupee-sign"></i>
          </div>
          <div class="relative z-10">
            <div class="text-[11px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Platform Revenue</div>
            <div class="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">₹{{ (adminStats.totalPlatformRevenueAnnual || 0) | number:'1.0-0' }}</div>
            <div class="text-[11px] text-slate-500 font-semibold mt-1">{{ pendingTransactionsCount }} UTRs in queue</div>
          </div>
        </div>

        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div class="absolute right-3 top-3 text-slate-100 group-hover:text-indigo-50 transition-colors text-4xl -z-0">
            <i class="fa-solid fa-flask-vial"></i>
          </div>
          <div class="relative z-10">
            <div class="text-[11px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">System-Wide Cases</div>
            <div class="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">{{ adminStats.totalCasesSystemWide }}</div>
            <div class="text-[11px] text-slate-500 font-semibold mt-1">Total lab test records</div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold scrollbar-thin">
        <button (click)="activeTab = 'labs'"
          [ngClass]="activeTab === 'labs' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
          class="px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 cursor-pointer">
          <i class="fa-solid fa-building-columns"></i>
          <span>Laboratories & Impersonation ({{ labs.length }})</span>
        </button>

        <button (click)="activeTab = 'payments'"
          [ngClass]="activeTab === 'payments' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
          class="px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 cursor-pointer relative">
          <i class="fa-solid fa-receipt"></i>
          <span>UTR Approvals ({{ transactions.length }})</span>
          <span *ngIf="pendingTransactionsCount > 0" class="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black">
            {{ pendingTransactionsCount }}
          </span>
        </button>

        <button (click)="activeTab = 'plans'"
          [ngClass]="activeTab === 'plans' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
          class="px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 cursor-pointer">
          <i class="fa-solid fa-tags"></i>
          <span>Pricing & SaaS Plans ({{ plans.length }})</span>
        </button>

        <button (click)="activeTab = 'tickets'"
          [ngClass]="activeTab === 'tickets' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
          class="px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 cursor-pointer relative">
          <i class="fa-solid fa-headset"></i>
          <span>Helpdesk Tickets ({{ tickets.length }})</span>
          <span *ngIf="openTicketsCount > 0" class="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
            {{ openTicketsCount }}
          </span>
        </button>

        <button (click)="activeTab = 'announcement'"
          [ngClass]="activeTab === 'announcement' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
          class="px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 cursor-pointer">
          <i class="fa-solid fa-bullhorn text-amber-400"></i>
          <span>Broadcast Notice</span>
        </button>

        <button (click)="activeTab = 'analytics'"
          [ngClass]="activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
          class="px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 cursor-pointer">
          <i class="fa-solid fa-chart-line"></i>
          <span>Geo & Revenue Insights</span>
        </button>
      </div>

      <!-- TAB 1: LABORATORIES & DIRECT IMPERSONATION -->
      <div *ngIf="activeTab === 'labs'" class="space-y-4">
        <!-- Search and Quick Filter Bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="relative flex-1">
            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input type="text" [(ngModel)]="labSearchQuery" (ngModelChange)="onLabFilterChange()" placeholder="Search lab name, owner name, code, email, phone, city..."
              class="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none">
          </div>
          <div class="flex items-center space-x-2">
            <select [(ngModel)]="labStatusFilter" (ngModelChange)="onLabFilterChange()" class="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 outline-none">
              <option value="all">All Status ({{ labs.length }})</option>
              <option value="Active">Active Subscriptions</option>
              <option value="ExpiringSoon">Expiring Within 7 Days</option>
              <option value="Expired">Expired / Suspended</option>
            </select>
          </div>
        </div>

        <!-- Labs Table -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-900 text-slate-300 uppercase tracking-wider font-semibold">
                <tr>
                  <th class="p-3.5">Lab Code & Name</th>
                  <th class="p-3.5">Owner & Contact</th>
                  <th class="p-3.5">Location</th>
                  <th class="p-3.5">SaaS Plan & Status</th>
                  <th class="p-3.5">Expiry Date</th>
                  <th class="p-3.5 text-right">Direct Support & Controls</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngIf="filteredLabs.length === 0">
                  <td colspan="6" class="p-8 text-center text-slate-400">
                    <i class="fa-solid fa-hospital-user text-3xl mb-2 text-slate-300 block"></i>
                    No laboratories found matching your filter criteria.
                  </td>
                </tr>
                <tr *ngFor="let lab of paginatedLabs" class="hover:bg-slate-50/80 transition-colors">
                  <td class="p-3.5">
                    <div class="font-bold text-slate-900 flex items-center space-x-1.5">
                      <span>{{ lab.labName }}</span>
                      <span *ngIf="!lab.isActive" class="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">Suspended</span>
                    </div>
                    <div class="flex items-center space-x-1 mt-0.5">
                      <span class="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{{ lab.labCode }}</span>
                      <span class="text-[10px] text-slate-400">• ID: {{ lab.id.substring(0, 8) }}...</span>
                    </div>
                  </td>
                  <td class="p-3.5">
                    <div class="font-semibold text-slate-800">{{ lab.ownerName }}</div>
                    <div class="text-slate-500 text-[11px] flex items-center space-x-2 mt-0.5">
                      <span><i class="fa-solid fa-envelope text-slate-400 mr-1"></i>{{ lab.email }}</span>
                      <span><i class="fa-solid fa-phone text-slate-400 mr-1"></i>{{ lab.phone }}</span>
                    </div>
                  </td>
                  <td class="p-3.5 text-slate-600">
                    <div class="font-medium text-slate-800">{{ lab.city || 'N/A' }}</div>
                    <div class="text-[11px] text-slate-400">{{ lab.state || 'India' }}</div>
                  </td>
                  <td class="p-3.5">
                    <div class="flex items-center space-x-1.5">
                      <span [ngClass]="{
                        'bg-emerald-50 text-emerald-700 border-emerald-200': lab.subscriptionStatus === 'Active',
                        'bg-amber-50 text-amber-700 border-amber-200': lab.subscriptionStatus === 'Trial',
                        'bg-rose-50 text-rose-700 border-rose-200': lab.subscriptionStatus === 'Expired' || lab.subscriptionStatus === 'Suspended'
                      }" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block">
                        {{ lab.subscriptionStatus }}
                      </span>
                      <span *ngIf="isExpiringSoon(lab)" class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                        Expiring Soon
                      </span>
                    </div>
                  </td>
                  <td class="p-3.5">
                    <div class="font-semibold text-slate-800">
                      {{ lab.subscriptionExpiryDate ? (lab.subscriptionExpiryDate | date:'dd MMM yyyy') : 'No Expiry Set' }}
                    </div>
                    <div class="text-[10px] text-slate-400" *ngIf="lab.subscriptionExpiryDate">
                      {{ getDaysRemainingText(lab.subscriptionExpiryDate) }}
                    </div>
                  </td>
                  <td class="p-3.5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end space-x-1.5">
                      <!-- 1-Click Enter Lab Portal (Impersonation) -->
                      <button (click)="impersonateLab(lab)"
                        title="1-Click Login to this Lab as Support Admin"
                        class="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all inline-flex items-center space-x-1 cursor-pointer">
                        <i class="fa-solid fa-right-to-bracket"></i>
                        <span>Enter Portal</span>
                      </button>

                      <!-- WhatsApp Renewal Reminder -->
                      <button (click)="sendWhatsAppReminder(lab)"
                        title="Send WhatsApp Renewal Reminder"
                        class="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition-all inline-flex items-center cursor-pointer">
                        <i class="fa-brands fa-whatsapp text-emerald-600 text-sm"></i>
                      </button>

                      <!-- Manage Validity -->
                      <button (click)="openEditSub(lab)"
                        title="Extend or change subscription validity"
                        class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-all inline-flex items-center space-x-1 cursor-pointer">
                        <i class="fa-solid fa-calendar-plus text-slate-600"></i>
                        <span>Validity</span>
                      </button>

                      <!-- Reset Password -->
                      <button (click)="openResetPasswordModal(lab)"
                        title="Reset LabAdmin password in 1 click"
                        class="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all inline-flex items-center cursor-pointer">
                        <i class="fa-solid fa-key"></i>
                      </button>

                      <!-- Toggle Status -->
                      <button (click)="toggleLab(lab)"
                        [title]="lab.isActive ? 'Suspend Lab' : 'Activate Lab'"
                        [class]="lab.isActive ? 'text-rose-600 hover:bg-rose-50 border-rose-200' : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'"
                        class="px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer">
                        {{ lab.isActive ? 'Suspend' : 'Activate' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Laboratories Pagination Footer -->
          <div *ngIf="filteredLabs.length > 0" class="p-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="flex items-center space-x-2 text-slate-500 font-medium">
              <span>Showing</span>
              <strong class="text-slate-800">{{ (labPage - 1) * labPageSize + 1 }}</strong>
              <span>to</span>
              <strong class="text-slate-800">{{ Math.min(labPage * labPageSize, filteredLabs.length) }}</strong>
              <span>of</span>
              <strong class="text-slate-800">{{ filteredLabs.length }}</strong>
              <span>laboratories</span>

              <div class="h-4 w-px bg-slate-300 mx-1 hidden sm:block"></div>

              <div class="flex items-center space-x-1.5">
                <span class="text-slate-500">Per page:</span>
                <select [(ngModel)]="labPageSize" (ngModelChange)="labPage = 1" class="px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-700 outline-none">
                  <option [ngValue]="5">5</option>
                  <option [ngValue]="10">10</option>
                  <option [ngValue]="20">20</option>
                  <option [ngValue]="50">50</option>
                </select>
              </div>
            </div>

            <div class="flex items-center space-x-1">
              <button (click)="labPage = 1" [disabled]="labPage === 1"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="First Page">
                <i class="fa-solid fa-angles-left"></i>
              </button>
              <button (click)="labPage = labPage - 1" [disabled]="labPage === 1"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                <i class="fa-solid fa-chevron-left mr-1"></i> Prev
              </button>

              <div class="flex items-center space-x-1 px-1">
                <button *ngFor="let p of getLabPageNumbers()" (click)="labPage = p"
                  [ngClass]="labPage === p ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'"
                  class="w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer">
                  {{ p }}
                </button>
              </div>

              <button (click)="labPage = labPage + 1" [disabled]="labPage >= totalLabPages"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                Next <i class="fa-solid fa-chevron-right ml-1"></i>
              </button>
              <button (click)="labPage = totalLabPages" [disabled]="labPage >= totalLabPages"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Last Page">
                <i class="fa-solid fa-angles-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: UTR APPROVALS QUEUE -->
      <div *ngIf="activeTab === 'payments'" class="space-y-4">
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div class="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                <i class="fa-solid fa-receipt"></i>
              </div>
              <div>
                <h3 class="font-bold text-sm text-slate-900 font-heading">💳 Live Subscription Payments & UTR Verification Queue</h3>
                <p class="text-[11px] text-slate-500">Cross-reference submitted 12-digit UPI UTRs with your bank statement and approve instant plan activation.</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {{ transactions.length }} Total Submissions
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th class="p-3.5">Lab Name / Code</th>
                  <th class="p-3.5">Owner / Contact</th>
                  <th class="p-3.5">Plan & Amount</th>
                  <th class="p-3.5">🏷️ Submitted Transaction UTR</th>
                  <th class="p-3.5">Date & Time</th>
                  <th class="p-3.5">Status</th>
                  <th class="p-3.5 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngIf="transactions.length === 0">
                  <td colspan="7" class="p-8 text-center text-slate-400">
                    <i class="fa-solid fa-receipt text-3xl mb-2 text-slate-300 block"></i>
                    No subscription payment transactions submitted yet.
                  </td>
                </tr>
                <tr *ngFor="let t of paginatedPayments" class="hover:bg-slate-50/80 transition-colors">
                  <td class="p-3.5">
                    <div class="font-bold text-slate-900">{{ t.labName }}</div>
                    <span class="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">{{ t.labCode }}</span>
                  </td>
                  <td class="p-3.5">
                    <div class="font-semibold text-slate-800">{{ t.ownerName }}</div>
                    <div class="text-slate-400 text-[11px]">{{ t.phone }} • {{ t.email }}</div>
                  </td>
                  <td class="p-3.5">
                    <div class="font-bold text-slate-900">{{ t.planName }} ({{ t.billingCycle }})</div>
                    <div class="text-emerald-600 font-extrabold text-sm">₹{{ t.amountPaid | number:'1.0-0' }}</div>
                  </td>
                  <td class="p-3.5">
                    <div class="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200 max-w-fit">
                      <span class="font-mono font-bold text-slate-800 text-xs">{{ t.transactionUtr }}</span>
                      <button (click)="copyUtr(t.transactionUtr)" title="Copy UTR to clipboard" class="text-slate-400 hover:text-slate-700 text-xs px-1 cursor-pointer">
                        <i class="fa-solid fa-copy"></i>
                      </button>
                    </div>
                  </td>
                  <td class="p-3.5 text-slate-600">
                    {{ t.createdAt | date:'dd MMM yyyy, hh:mm a' }}
                  </td>
                  <td class="p-3.5">
                    <span [ngClass]="{
                      'bg-emerald-50 text-emerald-700 border-emerald-200': t.status === 'Active',
                      'bg-amber-50 text-amber-700 border-amber-200': t.status === 'Pending' || t.status === 'Pending Verification',
                      'bg-rose-50 text-rose-700 border-rose-200': t.status === 'Rejected'
                    }" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block">
                      {{ t.status }}
                    </span>
                  </td>
                  <td class="p-3.5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end space-x-2">
                      <button *ngIf="t.status !== 'Active'" (click)="approve(t)"
                        class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center space-x-1 cursor-pointer">
                        <i class="fa-solid fa-check"></i>
                        <span>Approve</span>
                      </button>
                      <button *ngIf="t.status !== 'Rejected'" (click)="reject(t)"
                        class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer">
                        <i class="fa-solid fa-xmark"></i>
                        <span>Reject</span>
                      </button>
                      <span *ngIf="t.status === 'Active'" class="text-[11px] text-emerald-600 font-bold flex items-center">
                        <i class="fa-solid fa-circle-check mr-1"></i> Verified
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Payments Pagination Footer -->
          <div *ngIf="transactions.length > 0" class="p-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="flex items-center space-x-2 text-slate-500 font-medium">
              <span>Showing</span>
              <strong class="text-slate-800">{{ (paymentPage - 1) * paymentPageSize + 1 }}</strong>
              <span>to</span>
              <strong class="text-slate-800">{{ Math.min(paymentPage * paymentPageSize, transactions.length) }}</strong>
              <span>of</span>
              <strong class="text-slate-800">{{ transactions.length }}</strong>
              <span>submissions</span>
            </div>

            <div class="flex items-center space-x-1">
              <button (click)="paymentPage = paymentPage - 1" [disabled]="paymentPage === 1"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                <i class="fa-solid fa-chevron-left mr-1"></i> Prev
              </button>
              <div class="flex items-center space-x-1 px-1">
                <button *ngFor="let p of getPaymentPageNumbers()" (click)="paymentPage = p"
                  [ngClass]="paymentPage === p ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'"
                  class="w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer">
                  {{ p }}
                </button>
              </div>
              <button (click)="paymentPage = paymentPage + 1" [disabled]="paymentPage >= totalPaymentPages"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                Next <i class="fa-solid fa-chevron-right ml-1"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: PRICING & SAAS PLANS -->
      <div *ngIf="activeTab === 'plans'" class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold font-heading text-slate-900">SaaS Subscription Plans & Pricing</h3>
            <p class="text-xs text-slate-500">Configure public plans, monthly/annual fees, test quotas, and feature flags.</p>
          </div>
          <button (click)="openCreatePlanModal()" class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5 cursor-pointer">
            <i class="fa-solid fa-plus"></i>
            <span>Add New Plan</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div *ngFor="let plan of plans" class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between relative overflow-hidden">
            <div *ngIf="plan.isPopular" class="absolute top-0 right-0 bg-amber-500 text-white font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Popular
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h4 class="text-lg font-black text-slate-900 font-heading">{{ plan.name }}</h4>
                <span *ngIf="!plan.isActive" class="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">Inactive</span>
              </div>
              <p class="text-xs text-slate-500 mt-1">{{ plan.description || 'Full-featured pathology LIMS plan.' }}</p>

              <div class="my-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div class="flex items-baseline space-x-1">
                  <span class="text-2xl font-black text-slate-900">₹{{ plan.priceMonthly }}</span>
                  <span class="text-xs text-slate-500 font-bold">/ month</span>
                </div>
                <div class="text-xs text-emerald-600 font-bold mt-0.5">
                  ₹{{ plan.priceAnnual }} / year (Save ₹{{ (plan.priceMonthly * 12) - plan.priceAnnual | number:'1.0-0' }})
                </div>
              </div>

              <div class="space-y-2 text-xs text-slate-600">
                <div class="flex items-center space-x-2">
                  <i class="fa-solid fa-check text-emerald-600"></i>
                  <span><strong>{{ plan.maxMonthlyTests === 0 ? 'Unlimited' : plan.maxMonthlyTests }}</strong> Tests / month</span>
                </div>
                <div class="flex items-center space-x-2">
                  <i class="fa-solid fa-check text-emerald-600"></i>
                  <span><strong>{{ plan.maxStaffUsers === 0 ? 'Unlimited' : plan.maxStaffUsers }}</strong> Staff logins</span>
                </div>
                <div *ngFor="let feat of getFeatureList(plan.features)" class="flex items-center space-x-2 text-slate-500">
                  <i class="fa-solid fa-circle-check text-brand-500 text-[11px]"></i>
                  <span>{{ feat }}</span>
                </div>
              </div>
            </div>

            <div class="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <button (click)="openEditPlanModal(plan)" class="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all text-center cursor-pointer">
                <i class="fa-solid fa-pen-to-square mr-1"></i> Edit Plan
              </button>
              <button (click)="deletePlan(plan)" class="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer" title="Delete Plan">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 4: CENTRAL HELPDESK TICKETS -->
      <div *ngIf="activeTab === 'tickets'" class="space-y-4">
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 class="font-bold text-sm text-slate-900 font-heading">🎧 Multi-Tenant Helpdesk Command Center</h3>
              <p class="text-[11px] text-slate-500">View and respond to support queries, feature requests, and issue tickets across all labs.</p>
            </div>
            <span class="text-xs font-bold text-slate-600">{{ tickets.length }} Total Tickets</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th class="p-3.5">Ticket # / Date</th>
                  <th class="p-3.5">Lab / Submitter</th>
                  <th class="p-3.5">Subject & Category</th>
                  <th class="p-3.5">Priority & Status</th>
                  <th class="p-3.5 text-right">Support Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngIf="tickets.length === 0">
                  <td colspan="5" class="p-8 text-center text-slate-400">
                    <i class="fa-solid fa-clipboard-check text-3xl mb-2 text-slate-300 block"></i>
                    No support tickets found across any laboratory.
                  </td>
                </tr>
                <tr *ngFor="let t of paginatedTickets" class="hover:bg-slate-50/80 transition-colors">
                  <td class="p-3.5">
                    <div class="font-mono font-bold text-slate-900">{{ t.ticketNumber }}</div>
                    <div class="text-slate-400 text-[11px]">{{ t.createdAt | date:'dd MMM yyyy, hh:mm a' }}</div>
                  </td>
                  <td class="p-3.5">
                    <div class="font-bold text-slate-800">{{ t.labName || 'Lab' }}</div>
                    <div class="text-slate-500 text-[11px]">{{ t.createdByName }} • {{ t.contactEmail }}</div>
                  </td>
                  <td class="p-3.5">
                    <div class="font-bold text-slate-900">{{ t.subject }}</div>
                    <div class="text-slate-500 text-[11px] line-clamp-1 mt-0.5">{{ t.description }}</div>
                    <span class="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">{{ t.category }}</span>
                  </td>
                  <td class="p-3.5">
                    <div class="space-y-1">
                      <span [ngClass]="{
                        'bg-rose-50 text-rose-700 border-rose-200': t.priority === 'High' || t.priority === 'Urgent',
                        'bg-amber-50 text-amber-700 border-amber-200': t.priority === 'Medium',
                        'bg-slate-100 text-slate-700 border-slate-200': t.priority === 'Low'
                      }" class="px-2 py-0.5 rounded text-[10px] font-bold border inline-block">
                        {{ t.priority }}
                      </span>
                      <div>
                        <span [ngClass]="{
                          'bg-emerald-50 text-emerald-700 border-emerald-200': t.status === 'Resolved' || t.status === 'Closed',
                          'bg-amber-50 text-amber-700 border-amber-200': t.status === 'InProgress',
                          'bg-sky-50 text-sky-700 border-sky-200': t.status === 'Open'
                        }" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block">
                          {{ t.status }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="p-3.5 text-right whitespace-nowrap">
                    <button (click)="openTicketReplyModal(t)" class="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center space-x-1 cursor-pointer">
                      <i class="fa-solid fa-reply"></i>
                      <span>View & Reply</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tickets Pagination Footer -->
          <div *ngIf="tickets.length > 0" class="p-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="flex items-center space-x-2 text-slate-500 font-medium">
              <span>Showing</span>
              <strong class="text-slate-800">{{ (ticketPage - 1) * ticketPageSize + 1 }}</strong>
              <span>to</span>
              <strong class="text-slate-800">{{ Math.min(ticketPage * ticketPageSize, tickets.length) }}</strong>
              <span>of</span>
              <strong class="text-slate-800">{{ tickets.length }}</strong>
              <span>tickets</span>
            </div>

            <div class="flex items-center space-x-1">
              <button (click)="ticketPage = ticketPage - 1" [disabled]="ticketPage === 1"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                <i class="fa-solid fa-chevron-left mr-1"></i> Prev
              </button>
              <div class="flex items-center space-x-1 px-1">
                <button *ngFor="let p of getTicketPageNumbers()" (click)="ticketPage = p"
                  [ngClass]="ticketPage === p ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'"
                  class="w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer">
                  {{ p }}
                </button>
              </div>
              <button (click)="ticketPage = ticketPage + 1" [disabled]="ticketPage >= totalTicketPages"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                Next <i class="fa-solid fa-chevron-right ml-1"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 5: GLOBAL BROADCAST NOTICE -->
      <div *ngIf="activeTab === 'announcement'" class="space-y-4">
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm max-w-2xl space-y-4">
          <div>
            <h3 class="text-base font-bold font-heading text-slate-900 flex items-center space-x-2">
              <i class="fa-solid fa-bullhorn text-amber-500"></i>
              <span>Global Broadcast Announcement Banner</span>
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">Publish an instant global banner to every active laboratory user (e.g. system maintenance, new feature release, holiday notification).</p>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Banner Type / Styling</label>
              <div class="grid grid-cols-4 gap-2">
                <label [class.border-indigo-600]="announcementForm.type === 'Info'" [class.bg-indigo-50]="announcementForm.type === 'Info'"
                  class="p-2.5 rounded-xl border border-slate-200 text-center cursor-pointer transition-all flex flex-col items-center">
                  <input type="radio" name="annType" [(ngModel)]="announcementForm.type" value="Info" class="hidden">
                  <i class="fa-solid fa-circle-info text-indigo-600 mb-1"></i>
                  <span class="text-xs font-bold text-slate-800">Info (Blue)</span>
                </label>
                <label [class.border-amber-600]="announcementForm.type === 'Warning'" [class.bg-amber-50]="announcementForm.type === 'Warning'"
                  class="p-2.5 rounded-xl border border-slate-200 text-center cursor-pointer transition-all flex flex-col items-center">
                  <input type="radio" name="annType" [(ngModel)]="announcementForm.type" value="Warning" class="hidden">
                  <i class="fa-solid fa-triangle-exclamation text-amber-600 mb-1"></i>
                  <span class="text-xs font-bold text-slate-800">Warning (Yellow)</span>
                </label>
                <label [class.border-rose-600]="announcementForm.type === 'Alert'" [class.bg-rose-50]="announcementForm.type === 'Alert'"
                  class="p-2.5 rounded-xl border border-slate-200 text-center cursor-pointer transition-all flex flex-col items-center">
                  <input type="radio" name="annType" [(ngModel)]="announcementForm.type" value="Alert" class="hidden">
                  <i class="fa-solid fa-circle-exclamation text-rose-600 mb-1"></i>
                  <span class="text-xs font-bold text-slate-800">Alert (Red)</span>
                </label>
                <label [class.border-emerald-600]="announcementForm.type === 'Success'" [class.bg-emerald-50]="announcementForm.type === 'Success'"
                  class="p-2.5 rounded-xl border border-slate-200 text-center cursor-pointer transition-all flex flex-col items-center">
                  <input type="radio" name="annType" [(ngModel)]="announcementForm.type" value="Success" class="hidden">
                  <i class="fa-solid fa-circle-check text-emerald-600 mb-1"></i>
                  <span class="text-xs font-bold text-slate-800">Success (Green)</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Broadcast Message Content</label>
              <textarea [(ngModel)]="announcementForm.message" rows="3" placeholder="e.g. Scheduled maintenance on Sunday 2:00 AM to 4:00 AM. DigitalLab will be momentarily upgraded."
                class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none"></textarea>
            </div>

            <div class="flex items-center space-x-3 pt-2">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" [(ngModel)]="announcementForm.isActive" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span class="ml-3 text-xs font-bold text-slate-800">Enable Live Broadcast on all Lab Screens</span>
              </label>
            </div>

            <!-- Preview Box -->
            <div *ngIf="announcementForm.message" class="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div class="text-[10px] uppercase font-bold text-slate-400">Live Preview:</div>
              <div [ngClass]="{
                'bg-indigo-600 text-white': announcementForm.type === 'Info',
                'bg-amber-500 text-white': announcementForm.type === 'Warning',
                'bg-rose-600 text-white': announcementForm.type === 'Alert',
                'bg-emerald-600 text-white': announcementForm.type === 'Success'
              }" class="p-2.5 rounded-lg text-xs font-medium flex items-center space-x-2">
                <i class="fa-solid fa-bullhorn text-amber-200"></i>
                <span class="font-bold">Platform Notice:</span>
                <span>{{ announcementForm.message }}</span>
              </div>
            </div>

            <div class="pt-2">
              <button (click)="saveAnnouncement()" [disabled]="savingAnnouncement"
                class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50">
                <i *ngIf="savingAnnouncement" class="fa-solid fa-spinner fa-spin"></i>
                <span *ngIf="!savingAnnouncement"><i class="fa-solid fa-floppy-disk mr-1"></i> Save & Broadcast</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 6: GEO & REVENUE INSIGHTS -->
      <div *ngIf="activeTab === 'analytics'" class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- City & Region Distribution -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 class="text-sm font-bold text-slate-900 font-heading mb-3 flex items-center space-x-2">
              <i class="fa-solid fa-location-dot text-brand-600"></i>
              <span>Geographical City Breakdown</span>
            </h3>
            <div class="space-y-2">
              <div *ngFor="let item of getCityBreakdown()" class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div class="font-bold text-slate-800">{{ item.city }}</div>
                <div class="flex items-center space-x-2">
                  <span class="font-bold text-brand-600">{{ item.count }} Labs</span>
                  <span class="text-slate-400 text-[10px]">({{ item.percentage }}%)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Subscription Plan Distribution -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 class="text-sm font-bold text-slate-900 font-heading mb-3 flex items-center space-x-2">
              <i class="fa-solid fa-pie-chart text-emerald-600"></i>
              <span>Subscription Status Breakdown</span>
            </h3>
            <div class="space-y-3">
              <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div class="font-bold text-emerald-800">Active Paid Subscriptions</div>
                <div class="font-black text-emerald-700 text-sm">{{ adminStats?.activeLabs || 0 }} Labs</div>
              </div>
              <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                <div class="font-bold text-amber-800">Expiring Soon (Within 7 Days)</div>
                <div class="font-black text-amber-700 text-sm">{{ getExpiringSoonLabsCount() }} Labs</div>
              </div>
              <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs">
                <div class="font-bold text-rose-800">Expired / Suspended Labs</div>
                <div class="font-black text-rose-700 text-sm">{{ getExpiredLabsCount() }} Labs</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL 1: ONBOARD NEW LAB MODAL -->
      <div *ngIf="showCreateLabModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
        <div class="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
          <div class="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div class="flex items-center space-x-3">
              <div class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white text-base font-bold">
                <i class="fa-solid fa-hospital-plus"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold font-heading">Direct Laboratory Onboarding</h3>
                <p class="text-[11px] text-emerald-100">Create new tenant, admin credentials, and assign plan in 1 click.</p>
              </div>
            </div>
            <button (click)="showCreateLabModal = false" class="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <div class="p-6 space-y-3.5 overflow-y-auto flex-1 text-xs text-slate-700">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-800 mb-1">Laboratory Name *</label>
                <input type="text" [(ngModel)]="newLabForm.labName" placeholder="e.g. Apex Diagnostics"
                  class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
              <div>
                <label class="block font-bold text-slate-800 mb-1">Lab Code Prefix</label>
                <input type="text" [(ngModel)]="newLabForm.labCode" placeholder="Auto-generated if empty"
                  class="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase font-semibold outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-800 mb-1">Owner / Doctor Name *</label>
                <input type="text" [(ngModel)]="newLabForm.ownerName" placeholder="e.g. Dr. Rajesh Sharma"
                  class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
              <div>
                <label class="block font-bold text-slate-800 mb-1">Owner Phone / WhatsApp *</label>
                <input type="text" [(ngModel)]="newLabForm.phone" placeholder="e.g. 9876543210"
                  class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-800 mb-1">Owner Email (Login Username) *</label>
                <input type="email" [(ngModel)]="newLabForm.email" placeholder="e.g. drrajesh@apex.com"
                  class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
              <div>
                <label class="block font-bold text-slate-800 mb-1">Initial Password *</label>
                <div class="relative">
                  <input type="text" [(ngModel)]="newLabForm.password" placeholder="Min 6 characters"
                    class="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-semibold outline-none focus:ring-2 focus:ring-emerald-500">
                  <button (click)="generateRandomPassword()" type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded font-bold text-slate-600">
                    Generate
                  </button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-800 mb-1">City</label>
                <input type="text" [(ngModel)]="newLabForm.city" placeholder="e.g. Mumbai"
                  class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
              <div>
                <label class="block font-bold text-slate-800 mb-1">State</label>
                <input type="text" [(ngModel)]="newLabForm.state" placeholder="e.g. Maharashtra"
                  class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label class="block font-bold text-slate-800 mb-1">Assign SaaS Plan</label>
                <select [(ngModel)]="newLabForm.planName" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold outline-none">
                  <option value="Enterprise Plan">Enterprise Plan (Unlimited)</option>
                  <option value="Standard Plan">Standard Plan (1500 Tests)</option>
                  <option value="Basic Plan">Basic Plan (500 Tests)</option>
                  <option value="Free Trial">Free Trial</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-800 mb-1">Validity Duration</label>
                <select [(ngModel)]="newLabForm.validityDays" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold outline-none">
                  <option [ngValue]="15">15 Days (Trial)</option>
                  <option [ngValue]="30">30 Days (1 Month)</option>
                  <option [ngValue]="180">180 Days (6 Months)</option>
                  <option [ngValue]="365">365 Days (1 Year)</option>
                  <option [ngValue]="730">730 Days (2 Years)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0">
            <button type="button" (click)="showCreateLabModal = false" class="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="submitCreateLab()" [disabled]="creatingLab"
              class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer">
              <i *ngIf="creatingLab" class="fa-solid fa-spinner fa-spin"></i>
              <span *ngIf="!creatingLab"><i class="fa-solid fa-check mr-1"></i> Create Laboratory</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL 2: RESET PASSWORD MODAL -->
      <div *ngIf="selectedLabForPassword" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
        <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div class="bg-gradient-to-r from-amber-600 to-orange-700 px-6 py-4 text-white flex items-center justify-between shrink-0">
            <div class="flex items-center space-x-2.5">
              <i class="fa-solid fa-key text-lg"></i>
              <div>
                <h3 class="text-sm font-bold font-heading">Reset LabAdmin Password</h3>
                <p class="text-[11px] text-amber-100">{{ selectedLabForPassword.labName }}</p>
              </div>
            </div>
            <button (click)="selectedLabForPassword = null" class="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <div class="p-6 space-y-4 text-xs">
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
              <div class="font-bold">Admin Email: {{ selectedLabForPassword.email }}</div>
              <div class="text-[11px]">This will update the password for the primary LabAdmin user of this laboratory.</div>
            </div>

            <div>
              <label class="block font-bold text-slate-800 mb-1">New Password</label>
              <div class="flex items-center space-x-2">
                <input type="text" [(ngModel)]="newPasswordInput" placeholder="Enter new password"
                  class="flex-1 px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none">
                <button (click)="newPasswordInput = generateRandomStr(8)" type="button" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs">
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0">
            <button type="button" (click)="selectedLabForPassword = null" class="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="submitResetPassword()" [disabled]="resettingPassword"
              class="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer">
              <i *ngIf="resettingPassword" class="fa-solid fa-spinner fa-spin"></i>
              <span *ngIf="!resettingPassword"><i class="fa-solid fa-check mr-1"></i> Update Password</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL 3: EDIT SUBSCRIPTION MODAL -->
      <div *ngIf="selectedLabForSub" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
        <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
          <div class="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div class="flex items-center space-x-3">
              <div class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white text-base font-bold">
                <i class="fa-solid fa-calendar-check"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold font-heading">Manage Lab Subscription & Validity</h3>
                <p class="text-[11px] text-slate-300">{{ selectedLabForSub.labName }} ({{ selectedLabForSub.labCode }})</p>
              </div>
            </div>
            <button (click)="selectedLabForSub = null" class="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <div class="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <div class="font-bold text-slate-900 text-sm">{{ selectedLabForSub.labName }}</div>
                <div class="text-slate-500 text-[11px]">{{ selectedLabForSub.ownerName }} • {{ selectedLabForSub.phone }}</div>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-slate-400 block">Current Status</span>
                <strong class="text-emerald-700 uppercase font-bold">{{ selectedLabForSub.subscriptionStatus }}</strong>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-slate-800">Subscription Status</label>
              <select [(ngModel)]="editSubData.status" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-slate-900 outline-none">
                <option value="Active">🟢 Active (Full Access)</option>
                <option value="Trial">🟡 Trial (Evaluation)</option>
                <option value="Expired">🔴 Expired (Access Locked)</option>
                <option value="Suspended">⚫ Suspended (Disabled)</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="block font-bold text-slate-800 flex justify-between items-center">
                <span>⚡ Quick Validity Buttons:</span>
                <span class="text-[10px] text-slate-400 font-normal">Auto-calculates date</span>
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button type="button" (click)="addDays(15)" class="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 font-bold transition-all text-center cursor-pointer">
                  +15 Days
                </button>
                <button type="button" (click)="addDays(30)" class="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 font-bold transition-all text-center cursor-pointer">
                  +1 Month (30d)
                </button>
                <button type="button" (click)="addDays(180)" class="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 font-bold transition-all text-center cursor-pointer">
                  +6 Months
                </button>
                <button type="button" (click)="addDays(365)" class="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold transition-all text-center cursor-pointer">
                  +1 Year (365d)
                </button>
                <button type="button" (click)="addDays(730)" class="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold transition-all text-center cursor-pointer">
                  +2 Years
                </button>
                <button type="button" (click)="expireToday()" class="py-2 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold transition-all text-center cursor-pointer">
                  Expire Today
                </button>
              </div>
            </div>

            <div class="space-y-1.5 pt-1">
              <label class="block font-bold text-slate-800">Custom Expiry Date</label>
              <input type="date" [(ngModel)]="editSubData.expiryDateStr"
                class="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-brand-700 text-sm focus:ring-2 focus:ring-slate-900 outline-none">
            </div>
          </div>

          <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0">
            <button type="button" (click)="selectedLabForSub = null" class="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="saveSubscription()" [disabled]="savingSub"
              class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer">
              <i *ngIf="savingSub" class="fa-solid fa-spinner fa-spin"></i>
              <span *ngIf="!savingSub"><i class="fa-solid fa-check mr-1"></i> Save Validity</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL 4: PLAN EDIT / CREATE MODAL -->
      <div *ngIf="showPlanModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
        <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
          <div class="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 text-white flex items-center justify-between shrink-0">
            <h3 class="text-sm font-bold font-heading">{{ planForm.id ? 'Edit SaaS Plan' : 'Create New SaaS Plan' }}</h3>
            <button (click)="showPlanModal = false" class="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <div class="p-6 space-y-3.5 overflow-y-auto flex-1 text-xs">
            <div>
              <label class="block font-bold text-slate-800 mb-1">Plan Name *</label>
              <input type="text" [(ngModel)]="planForm.name" placeholder="e.g. Standard Pathology Plan"
                class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-slate-900">
            </div>

            <div>
              <label class="block font-bold text-slate-800 mb-1">Description</label>
              <input type="text" [(ngModel)]="planForm.description" placeholder="e.g. Best for growing diagnostic centers"
                class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-slate-900">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-800 mb-1">Price Monthly (₹) *</label>
                <input type="number" [(ngModel)]="planForm.priceMonthly"
                  class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none">
              </div>
              <div>
                <label class="block font-bold text-slate-800 mb-1">Price Annual (₹) *</label>
                <input type="number" [(ngModel)]="planForm.priceAnnual"
                  class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-800 mb-1">Max Monthly Tests (0 = Unlimited)</label>
                <input type="number" [(ngModel)]="planForm.maxMonthlyTests"
                  class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold outline-none">
              </div>
              <div>
                <label class="block font-bold text-slate-800 mb-1">Max Staff Users (0 = Unlimited)</label>
                <input type="number" [(ngModel)]="planForm.maxStaffUsers"
                  class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold outline-none">
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-800 mb-1">Features (One per line or comma-separated)</label>
              <textarea [(ngModel)]="planForm.features" rows="3" placeholder="Full LIMS workflow&#10;WhatsApp Report Sharing&#10;Custom Letterhead&#10;Priority 24/7 Support"
                class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-slate-900"></textarea>
            </div>

            <div class="flex items-center space-x-6 pt-1">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="planForm.isActive" class="rounded text-brand-600 focus:ring-brand-500">
                <span class="font-bold text-slate-800">Active Plan</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="planForm.isPopular" class="rounded text-amber-500 focus:ring-amber-400">
                <span class="font-bold text-slate-800">Highlight as "Popular"</span>
              </label>
            </div>
          </div>

          <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0">
            <button type="button" (click)="showPlanModal = false" class="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="savePlan()" [disabled]="savingPlan"
              class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer">
              <i *ngIf="savingPlan" class="fa-solid fa-spinner fa-spin"></i>
              <span *ngIf="!savingPlan"><i class="fa-solid fa-check mr-1"></i> Save Plan</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL 5: TICKET REPLY MODAL -->
      <div *ngIf="selectedTicket" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
        <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
          <div class="bg-gradient-to-r from-brand-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between shrink-0">
            <div class="flex items-center space-x-2.5">
              <i class="fa-solid fa-headset text-lg"></i>
              <div>
                <h3 class="text-sm font-bold font-heading">Helpdesk Ticket: {{ selectedTicket.ticketNumber }}</h3>
                <p class="text-[11px] text-brand-100">{{ selectedTicket.labName }} • {{ selectedTicket.createdByName }}</p>
              </div>
            </div>
            <button (click)="selectedTicket = null" class="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <div class="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div class="font-bold text-slate-900 text-sm">{{ selectedTicket.subject }}</div>
              <div class="text-slate-700 whitespace-pre-wrap">{{ selectedTicket.description }}</div>
              <div class="text-[11px] text-slate-400 pt-1">
                Category: <span class="font-semibold text-slate-600">{{ selectedTicket.category }}</span> • Priority: <span class="font-semibold text-slate-600">{{ selectedTicket.priority }}</span>
              </div>
            </div>

            <!-- Existing Thread Replies -->
            <div *ngIf="selectedTicket.replies && selectedTicket.replies.length > 0" class="space-y-2">
              <div class="font-bold text-slate-700">Communication Thread:</div>
              <div *ngFor="let rep of selectedTicket.replies" 
                [ngClass]="rep.isStaffReply ? 'bg-indigo-50 border-indigo-200 ml-4' : 'bg-slate-50 border-slate-200 mr-4'"
                class="p-3 rounded-xl border space-y-1 text-xs">
                <div class="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                  <span>{{ rep.repliedByName }} ({{ rep.isStaffReply ? 'SuperAdmin Support' : 'Lab Admin' }})</span>
                  <span>{{ rep.createdAt | date:'dd MMM, hh:mm a' }}</span>
                </div>
                <div class="text-slate-800 whitespace-pre-wrap">{{ rep.message }}</div>
              </div>
            </div>

            <!-- New Reply Form -->
            <div class="space-y-2 pt-2 border-t border-slate-100">
              <label class="block font-bold text-slate-800">SuperAdmin Official Reply</label>
              <textarea [(ngModel)]="ticketReplyMessage" rows="3" placeholder="Type support response or resolution notes here..."
                class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-brand-500"></textarea>
              
              <div class="flex items-center justify-between pt-1">
                <div class="flex items-center space-x-2">
                  <span class="font-bold text-slate-700">Update Ticket Status:</span>
                  <select [(ngModel)]="ticketReplyStatus" class="px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-xs outline-none">
                    <option value="InProgress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Open">Open</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0">
            <button type="button" (click)="selectedTicket = null" class="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="submitTicketReply()" [disabled]="sendingTicketReply || !ticketReplyMessage.trim()"
              class="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer">
              <i *ngIf="sendingTicketReply" class="fa-solid fa-spinner fa-spin"></i>
              <span *ngIf="!sendingTicketReply"><i class="fa-solid fa-paper-plane mr-1"></i> Send Reply</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class SuperAdminComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  Math = Math;

  activeTab: 'labs' | 'payments' | 'plans' | 'tickets' | 'announcement' | 'analytics' = 'labs';

  loading = false;
  adminStats: any = null;
  labs: any[] = [];
  transactions: any[] = [];
  plans: any[] = [];
  tickets: any[] = [];

  // Search & Filters
  labSearchQuery = '';
  labStatusFilter = 'all';

  // Laboratories Pagination
  labPage = 1;
  labPageSize = 10;

  // Payments Pagination
  paymentPage = 1;
  paymentPageSize = 10;

  // Tickets Pagination
  ticketPage = 1;
  ticketPageSize = 10;

  // Edit Subscription Modal
  selectedLabForSub: any = null;
  savingSub = false;
  editSubData = {
    status: 'Active',
    expiryDateStr: ''
  };

  // Onboard New Lab Modal
  showCreateLabModal = false;
  creatingLab = false;
  newLabForm = {
    labName: '',
    labCode: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    city: '',
    state: '',
    planName: 'Enterprise Plan',
    validityDays: 365
  };

  // Reset Password Modal
  selectedLabForPassword: any = null;
  resettingPassword = false;
  newPasswordInput = '';

  // Plans Modal
  showPlanModal = false;
  savingPlan = false;
  planForm: any = {
    id: '',
    name: '',
    description: '',
    priceMonthly: 1999,
    priceAnnual: 19999,
    maxMonthlyTests: 0,
    maxStaffUsers: 0,
    features: '',
    isActive: true,
    isPopular: false
  };

  // Support Tickets Reply Modal
  selectedTicket: any = null;
  ticketReplyMessage = '';
  ticketReplyStatus = 'Resolved';
  sendingTicketReply = false;

  // Broadcast Announcement
  announcementForm = {
    message: '',
    type: 'Info',
    isActive: false
  };
  savingAnnouncement = false;

  ngOnInit(): void {
    this.loadData();
    this.loadAnnouncement();
  }

  get pendingTransactionsCount(): number {
    return this.transactions.filter(t => t.status === 'Pending' || t.status === 'Pending Verification').length;
  }

  get openTicketsCount(): number {
    return this.tickets.filter(t => t.status === 'Open' || t.status === 'InProgress').length;
  }

  get filteredLabs(): any[] {
    return this.labs.filter(lab => {
      const q = this.labSearchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        lab.labName?.toLowerCase().includes(q) ||
        lab.labCode?.toLowerCase().includes(q) ||
        lab.ownerName?.toLowerCase().includes(q) ||
        lab.email?.toLowerCase().includes(q) ||
        lab.phone?.toLowerCase().includes(q) ||
        lab.city?.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      if (this.labStatusFilter === 'Active') {
        return lab.subscriptionStatus === 'Active' && (!lab.subscriptionExpiryDate || new Date(lab.subscriptionExpiryDate) >= new Date());
      } else if (this.labStatusFilter === 'ExpiringSoon') {
        return this.isExpiringSoon(lab);
      } else if (this.labStatusFilter === 'Expired') {
        return lab.subscriptionStatus === 'Expired' || lab.subscriptionStatus === 'Suspended' || (lab.subscriptionExpiryDate && new Date(lab.subscriptionExpiryDate) < new Date());
      }
      return true;
    });
  }

  // Laboratories Pagination Getters
  get totalLabPages(): number {
    return Math.ceil(this.filteredLabs.length / this.labPageSize) || 1;
  }

  get paginatedLabs(): any[] {
    const start = (this.labPage - 1) * this.labPageSize;
    return this.filteredLabs.slice(start, start + this.labPageSize);
  }

  getLabPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalLabPages;
    const current = this.labPage;
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4);
      } else if (end === total) {
        start = Math.max(1, end - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  onLabFilterChange(): void {
    this.labPage = 1;
  }

  // Payments Pagination Getters
  get totalPaymentPages(): number {
    return Math.ceil(this.transactions.length / this.paymentPageSize) || 1;
  }

  get paginatedPayments(): any[] {
    const start = (this.paymentPage - 1) * this.paymentPageSize;
    return this.transactions.slice(start, start + this.paymentPageSize);
  }

  getPaymentPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPaymentPages;
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Tickets Pagination Getters
  get totalTicketPages(): number {
    return Math.ceil(this.tickets.length / this.ticketPageSize) || 1;
  }

  get paginatedTickets(): any[] {
    const start = (this.ticketPage - 1) * this.ticketPageSize;
    return this.tickets.slice(start, start + this.ticketPageSize);
  }

  getTicketPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalTicketPages;
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  }

  loadData(): void {
    this.loading = true;
    this.api.getSuperAdminDashboard().subscribe({
      next: (res) => {
        this.adminStats = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
      }
    });

    this.api.getSuperAdminLabs().subscribe({
      next: (res) => {
        this.labs = res || [];
        this.cdr.detectChanges();
      }
    });

    this.api.getSuperAdminTransactions().subscribe({
      next: (res) => {
        this.transactions = res || [];
        this.cdr.detectChanges();
      }
    });

    this.api.getAdminPlans().subscribe({
      next: (res) => {
        this.plans = res || [];
        this.cdr.detectChanges();
      }
    });

    this.api.getAdminSupportTickets().subscribe({
      next: (res) => {
        this.tickets = res || [];
        this.cdr.detectChanges();
      }
    });
  }

  loadAnnouncement(): void {
    this.api.getGlobalAnnouncement().subscribe({
      next: (res) => {
        if (res) {
          this.announcementForm = {
            message: res.message || '',
            type: res.type || 'Info',
            isActive: !!res.isActive
          };
          this.cdr.detectChanges();
        }
      }
    });
  }

  // 1-Click Lab Impersonation
  impersonateLab(lab: any): void {
    if (!confirm(`Are you sure you want to log in as ${lab.labName} (${lab.labCode})? You will gain full support access to this lab.`)) {
      return;
    }

    this.api.impersonateLab(lab.id).subscribe({
      next: (res) => {
        this.toast.success(`Logged in to ${lab.labName} in SuperAdmin Support Mode!`);
        this.auth.impersonate(res);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Error initiating lab impersonation.');
      }
    });
  }

  // WhatsApp Renewal Reminder
  sendWhatsAppReminder(lab: any): void {
    if (!lab.phone) {
      this.toast.warning('No phone number recorded for this laboratory.');
      return;
    }

    const cleanPhone = lab.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const expDate = lab.subscriptionExpiryDate ? new Date(lab.subscriptionExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'soon';
    
    const message = `Hello ${lab.ownerName || lab.labName},\n\nThis is a gentle reminder that your DigitalLab Pathology Software subscription expires on *${expDate}*.\n\nPlease renew your subscription to ensure uninterrupted test bookings, report downloads, and cloud services.\n\nThank you,\nDigitalLab Support Team`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  // Check if expiring in <= 7 days
  isExpiringSoon(lab: any): boolean {
    if (!lab.subscriptionExpiryDate) return false;
    const exp = new Date(lab.subscriptionExpiryDate);
    const now = new Date();
    const diffDays = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }

  getExpiringSoonLabsCount(): number {
    return this.labs.filter(l => this.isExpiringSoon(l)).length;
  }

  getExpiredLabsCount(): number {
    return this.labs.filter(l => l.subscriptionStatus === 'Expired' || l.subscriptionStatus === 'Suspended' || (l.subscriptionExpiryDate && new Date(l.subscriptionExpiryDate) < new Date())).length;
  }

  getDaysRemainingText(expiryDate: string): string {
    const exp = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) return `Expired ${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return 'Expires today';
    return `${diffDays} days remaining`;
  }

  // Onboard New Lab Modal
  openCreateLabModal(): void {
    this.newLabForm = {
      labName: '',
      labCode: '',
      ownerName: '',
      email: '',
      phone: '',
      password: this.generateRandomStr(8),
      city: '',
      state: '',
      planName: 'Enterprise Plan',
      validityDays: 365
    };
    this.showCreateLabModal = true;
  }

  generateRandomPassword(): void {
    this.newLabForm.password = this.generateRandomStr(8);
  }

  generateRandomStr(len: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }

  submitCreateLab(): void {
    if (!this.newLabForm.labName || !this.newLabForm.ownerName || !this.newLabForm.email || !this.newLabForm.phone || !this.newLabForm.password) {
      this.toast.warning('Please fill in all required fields.');
      return;
    }

    this.creatingLab = true;
    this.api.createLabByAdmin(this.newLabForm).subscribe({
      next: (res) => {
        this.creatingLab = false;
        this.showCreateLabModal = false;
        this.toast.success(`Laboratory "${this.newLabForm.labName}" onboarded successfully!`);
        this.loadData();
      },
      error: (err) => {
        this.creatingLab = false;
        this.toast.error(err.error?.message || 'Error creating laboratory.');
      }
    });
  }

  // Reset Password Modal
  openResetPasswordModal(lab: any): void {
    this.selectedLabForPassword = lab;
    this.newPasswordInput = this.generateRandomStr(8);
  }

  submitResetPassword(): void {
    if (!this.selectedLabForPassword || !this.newPasswordInput) return;
    this.resettingPassword = true;

    this.api.resetLabPassword({
      tenantId: this.selectedLabForPassword.id,
      newPassword: this.newPasswordInput
    }).subscribe({
      next: () => {
        this.resettingPassword = false;
        const msg = `Password for ${this.selectedLabForPassword.labName} updated to "${this.newPasswordInput}"!`;
        navigator.clipboard.writeText(this.newPasswordInput);
        this.toast.success(msg + ' (Copied to clipboard)');
        this.selectedLabForPassword = null;
      },
      error: (err) => {
        this.resettingPassword = false;
        this.toast.error(err.error?.message || 'Error resetting password.');
      }
    });
  }

  // Manage Subscription
  openEditSub(lab: any): void {
    this.selectedLabForSub = lab;
    let expDate = new Date();
    if (lab.subscriptionExpiryDate) {
      expDate = new Date(lab.subscriptionExpiryDate);
    } else {
      expDate.setDate(expDate.getDate() + 30);
    }
    this.editSubData = {
      status: lab.subscriptionStatus || 'Active',
      expiryDateStr: expDate.toISOString().split('T')[0]
    };
    this.cdr.detectChanges();
  }

  addDays(days: number): void {
    const base = new Date();
    base.setDate(base.getDate() + days);
    this.editSubData.expiryDateStr = base.toISOString().split('T')[0];
    this.editSubData.status = 'Active';
  }

  expireToday(): void {
    const today = new Date();
    this.editSubData.expiryDateStr = today.toISOString().split('T')[0];
    this.editSubData.status = 'Expired';
  }

  saveSubscription(): void {
    if (!this.selectedLabForSub) return;
    this.savingSub = true;

    const payload = {
      status: this.editSubData.status,
      expiryDate: this.editSubData.expiryDateStr ? new Date(this.editSubData.expiryDateStr).toISOString() : null
    };

    this.api.updateLabSubscription(this.selectedLabForSub.id, payload).subscribe({
      next: () => {
        this.savingSub = false;
        this.toast.success(`Subscription for ${this.selectedLabForSub.labName} updated successfully!`);
        this.selectedLabForSub = null;
        this.loadData();
      },
      error: (err) => {
        this.savingSub = false;
        this.toast.error(err.error?.message || 'Error updating subscription.');
      }
    });
  }

  toggleLab(lab: any): void {
    const newState = !lab.isActive;
    this.api.updateLabStatus(lab.id, newState).subscribe({
      next: () => {
        lab.isActive = newState;
        this.toast.info(`Lab ${lab.labName} is now ${newState ? 'Active' : 'Suspended'}.`);
        this.cdr.detectChanges();
      },
      error: () => this.toast.error('Error updating lab status.')
    });
  }

  // UTR Approvals
  approve(t: any): void {
    this.api.approveSubscription(t.id).subscribe({
      next: () => {
        t.status = 'Active';
        this.toast.success(`Subscription for ${t.labName} approved and activated!`);
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Error approving subscription.');
      }
    });
  }

  reject(t: any): void {
    this.api.rejectSubscription(t.id).subscribe({
      next: () => {
        t.status = 'Rejected';
        this.toast.info(`Subscription for ${t.labName} rejected.`);
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Error rejecting transaction.');
      }
    });
  }

  copyUtr(utr: string): void {
    if (!utr || utr === 'N/A') return;
    navigator.clipboard.writeText(utr);
    this.toast.success(`Transaction UTR "${utr}" copied to clipboard!`);
  }

  // Plans Management
  openCreatePlanModal(): void {
    this.planForm = {
      id: '',
      name: '',
      description: '',
      priceMonthly: 1999,
      priceAnnual: 19999,
      maxMonthlyTests: 0,
      maxStaffUsers: 0,
      features: 'Full Pathology LIMS\nWhatsApp Sharing\nCustom Letterhead',
      isActive: true,
      isPopular: false
    };
    this.showPlanModal = true;
  }

  openEditPlanModal(plan: any): void {
    this.planForm = {
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      priceMonthly: plan.priceMonthly,
      priceAnnual: plan.priceAnnual,
      maxMonthlyTests: plan.maxMonthlyTests,
      maxStaffUsers: plan.maxStaffUsers,
      features: plan.features || '',
      isActive: plan.isActive,
      isPopular: plan.isPopular
    };
    this.showPlanModal = true;
  }

  getFeatureList(features: string): string[] {
    if (!features) return [];
    return features.split(/[\n,]/).map(f => f.trim()).filter(f => f.length > 0);
  }

  savePlan(): void {
    if (!this.planForm.name) {
      this.toast.warning('Plan Name is required.');
      return;
    }

    this.savingPlan = true;
    if (this.planForm.id) {
      this.api.updateAdminPlan(this.planForm.id, this.planForm).subscribe({
        next: () => {
          this.savingPlan = false;
          this.showPlanModal = false;
          this.toast.success(`Plan "${this.planForm.name}" updated!`);
          this.loadData();
        },
        error: (err) => {
          this.savingPlan = false;
          this.toast.error(err.error?.message || 'Error updating plan.');
        }
      });
    } else {
      this.api.createAdminPlan(this.planForm).subscribe({
        next: () => {
          this.savingPlan = false;
          this.showPlanModal = false;
          this.toast.success(`New plan "${this.planForm.name}" created!`);
          this.loadData();
        },
        error: (err) => {
          this.savingPlan = false;
          this.toast.error(err.error?.message || 'Error creating plan.');
        }
      });
    }
  }

  deletePlan(plan: any): void {
    if (!confirm(`Are you sure you want to delete plan "${plan.name}"?`)) return;
    this.api.deleteAdminPlan(plan.id).subscribe({
      next: () => {
        this.toast.info(`Plan "${plan.name}" deleted.`);
        this.loadData();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error deleting plan.')
    });
  }

  // Helpdesk Ticket Reply
  openTicketReplyModal(t: any): void {
    this.selectedTicket = t;
    this.ticketReplyMessage = '';
    this.ticketReplyStatus = t.status === 'Open' ? 'InProgress' : t.status;
  }

  submitTicketReply(): void {
    if (!this.selectedTicket || !this.ticketReplyMessage.trim()) return;
    this.sendingTicketReply = true;

    this.api.replyAdminTicket(this.selectedTicket.id, {
      message: this.ticketReplyMessage.trim(),
      status: this.ticketReplyStatus
    }).subscribe({
      next: () => {
        this.sendingTicketReply = false;
        this.toast.success('Reply submitted to laboratory successfully!');
        this.selectedTicket = null;
        this.loadData();
      },
      error: (err) => {
        this.sendingTicketReply = false;
        this.toast.error(err.error?.message || 'Error replying to ticket.');
      }
    });
  }

  // Broadcast Announcement
  saveAnnouncement(): void {
    this.savingAnnouncement = true;
    this.api.saveGlobalAnnouncement(this.announcementForm).subscribe({
      next: () => {
        this.savingAnnouncement = false;
        this.toast.success('Broadcast announcement updated live for all labs!');
      },
      error: (err) => {
        this.savingAnnouncement = false;
        this.toast.error(err.error?.message || 'Error saving broadcast announcement.');
      }
    });
  }

  // Analytics Helpers
  getCityBreakdown(): { city: string; count: number; percentage: number }[] {
    const cityMap = new Map<string, number>();
    for (const lab of this.labs) {
      const city = lab.city?.trim() || 'Unknown';
      cityMap.set(city, (cityMap.get(city) || 0) + 1);
    }
    const total = this.labs.length || 1;
    const list: { city: string; count: number; percentage: number }[] = [];
    cityMap.forEach((count, city) => {
      list.push({
        city,
        count,
        percentage: Math.round((count / total) * 100)
      });
    });
    return list.sort((a, b) => b.count - a.count);
  }
}
