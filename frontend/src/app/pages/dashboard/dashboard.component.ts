import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { RealtimeService } from '../../core/services/realtime.service';
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
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20">
              {{ roleDisplayName() }}
            </span>
          </div>
          <h2 class="text-2xl font-bold font-heading">Welcome back, {{ currentUser()?.fullName }}!</h2>
          <p class="text-sm text-slate-300">{{ currentUser()?.labName }} - Pathology Management Center</p>
        </div>

        <div class="mt-4 md:mt-0 flex items-center space-x-3">
          <!-- Role-wise Quick Action Buttons -->
          <a *ngIf="!isPathologist()" routerLink="/cases/add" class="inline-flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/30 transition-all cursor-pointer">
            <i class="fa-solid fa-plus mr-2"></i> New Patient Case
          </a>

          <a *ngIf="isManagement() || isReceptionist()" routerLink="/transactions" class="inline-flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-700/80 hover:bg-slate-700 text-white border border-slate-600 transition-all cursor-pointer">
            <i class="fa-solid fa-receipt mr-2"></i> Day Ledger
          </a>

          <a *ngIf="isTechnician() || isPathologist()" routerLink="/cases" class="inline-flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-700/80 hover:bg-slate-700 text-white border border-slate-600 transition-all cursor-pointer">
            <i class="fa-solid fa-list-check mr-2"></i> Case Worklist
          </a>
        </div>
      </div>

      <!-- Role Focus Banners -->
      <!-- Technician Station Banner -->
      <div *ngIf="isTechnician()" class="p-4 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-700/40 text-white shadow-md flex items-center justify-between">
        <div class="flex items-center space-x-3.5">
          <div class="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
            <i class="fa-solid fa-microscope"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h4 class="font-bold text-sm">Diagnostic Lab Technician Workstation</h4>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">TESTING STATION</span>
            </div>
            <p class="text-xs text-slate-400">Process specimen tubes, enter parameter values, and advance cases through testing.</p>
          </div>
        </div>
        <a routerLink="/cases" class="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow">
          <i class="fa-solid fa-flask-vial mr-1.5"></i> Open Worklist
        </a>
      </div>

      <!-- Pathologist Station Banner -->
      <div *ngIf="isPathologist()" class="p-4 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border border-purple-700/40 text-white shadow-md flex items-center justify-between">
        <div class="flex items-center space-x-3.5">
          <div class="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xl shrink-0">
            <i class="fa-solid fa-signature"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h4 class="font-bold text-sm">Pathologist Review & Authorization Station</h4>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">SIGN-OFF DESK</span>
            </div>
            <p class="text-xs text-slate-400">Review clinical interpretations, verify panic values, and digitally authorize final reports.</p>
          </div>
        </div>
        <a routerLink="/cases" class="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow">
          <i class="fa-solid fa-file-signature mr-1.5"></i> Review Reports
        </a>
      </div>

      <!-- Receptionist Station Banner -->
      <div *ngIf="isReceptionist()" class="p-4 rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-slate-900 border border-sky-700/40 text-white shadow-md flex items-center justify-between">
        <div class="flex items-center space-x-3.5">
          <div class="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center text-xl shrink-0">
            <i class="fa-solid fa-id-card-clip"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h4 class="font-bold text-sm">Front Desk & Reception Billing Counter</h4>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">FRONT DESK</span>
            </div>
            <p class="text-xs text-slate-400">Register incoming patients, collect cash/UPI payments, print receipts, and issue barcodes.</p>
          </div>
        </div>
        <a routerLink="/cases/add" class="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow">
          <i class="fa-solid fa-plus mr-1.5"></i> New Registration
        </a>
      </div>

      <!-- 1. KPI SUMMARY CARDS GRID (ROLE-TAILORED) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4" *ngIf="stats">
        
        <!-- === CASE A: LAB OWNER & LAB MANAGER (FULL EXECUTIVE FINANCIAL KPIS) === -->
        <ng-container *ngIf="isManagement()">
          <!-- Today Cases -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                <i class="fa-solid fa-calendar-day"></i>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">Today</span>
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
              <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">Revenue</span>
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
              <span class="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">Pending</span>
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
              <span class="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold">Outstanding</span>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-rose-600">₹{{ stats.totalPendingDues | number:'1.0-0' }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Total Uncollected Balance</div>
            </div>
          </div>
        </ng-container>

        <!-- === CASE B: RECEPTIONIST (BILLING & REGISTRATION FOCUS) === -->
        <ng-container *ngIf="isReceptionist()">
          <!-- Today Cases -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg">
                <i class="fa-solid fa-users-line"></i>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold">Patients</span>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-slate-900">{{ stats.todayCases }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Today's Registered Patients</div>
            </div>
          </div>

          <!-- Today Counter Cash+UPI -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                <i class="fa-solid fa-cash-register"></i>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">Counter</span>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-emerald-600">₹{{ stats.todayCollection | number:'1.0-0' }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Today's Total Received</div>
            </div>
          </div>

          <!-- Today's Due Left -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
                <i class="fa-solid fa-clock-rotate-left"></i>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">Due</span>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-amber-600">₹{{ (stats.todayDueCreated || 0) | number:'1.0-0' }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Today's Pending Due</div>
            </div>
          </div>

          <!-- Cumulative Patients -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                <i class="fa-solid fa-address-book"></i>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">Total</span>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-slate-900">{{ stats.totalPatients }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Registered Patient Directory</div>
            </div>
          </div>
        </ng-container>

        <!-- === CASE C: TECHNICIAN (CLINICAL TESTING FOCUS - NO FINANCIAL DATA) === -->
        <ng-container *ngIf="isTechnician()">
          <!-- Pending Tests -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
                <i class="fa-solid fa-hourglass-half"></i>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">Action Needed</span>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-amber-600">{{ stats.pendingTests }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Tests Awaiting Results</div>
            </div>
          </div>

          <!-- Today's Cases -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                <i class="fa-solid fa-vial"></i>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">Samples</span>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-slate-900">{{ stats.todayCases }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Today's Received Cases</div>
            </div>
          </div>

          <!-- Completed/Verified Reports -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                <i class="fa-solid fa-circle-check"></i>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">Completed</span>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-emerald-600">{{ stats.approvedReports }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Verified & Signed Reports</div>
            </div>
          </div>

          <!-- Total Patients -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
                <i class="fa-solid fa-users"></i>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold">Directory</span>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-slate-900">{{ stats.totalPatients }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Total Lab Patients</div>
            </div>
          </div>
        </ng-container>

        <!-- === CASE D: PATHOLOGIST (REPORT APPROVAL FOCUS - NO FINANCIAL DATA) === -->
        <ng-container *ngIf="isPathologist()">
          <!-- Pending Verification -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
                <i class="fa-solid fa-file-waveform"></i>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">Review</span>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-amber-600">{{ stats.pendingTests }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Tests to Review & Authorize</div>
            </div>
          </div>

          <!-- Verified & Released Reports -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                <i class="fa-solid fa-signature"></i>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">Authorized</span>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-emerald-600">{{ stats.approvedReports }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Approved Pathology Reports</div>
            </div>
          </div>

          <!-- Today Cases -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                <i class="fa-solid fa-notes-medical"></i>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">Cases</span>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-slate-900">{{ stats.todayCases }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Today's Diagnoses</div>
            </div>
          </div>

          <!-- Total Patients -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div class="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
                <i class="fa-solid fa-users"></i>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold">Directory</span>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-black text-slate-900">{{ stats.totalPatients }}</div>
              <div class="text-xs text-slate-500 mt-0.5">Total Lab Patients</div>
            </div>
          </div>
        </ng-container>

      </div>

      <!-- 2. COUNTER RECONCILIATION CARD (ONLY FOR LAB OWNER, MANAGER & RECEPTIONIST) -->
      <div *ngIf="(isManagement() || isReceptionist()) && stats" 
        class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
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

      <!-- 3. SECONDARY EXECUTIVE METRICS (ONLY FOR LAB OWNER & LAB MANAGER) -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3" *ngIf="isManagement() && stats">
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
            <div class="text-xs text-slate-400">Referring Doctors</div>
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

      <!-- 4. WORKFLOW SECTION: CHART (MANAGEMENT ONLY) + RECENT CASES WORKLIST -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 7-Day Revenue Trend Chart (ONLY FOR LAB OWNER & MANAGER) -->
        <div *ngIf="isManagement()" class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-1">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-slate-900 font-heading">7-Day Revenue Trend</h3>
            <span class="text-xs text-slate-400"><i class="fa-solid fa-chart-simple mr-1"></i> Live</span>
          </div>
          <div class="h-64 relative">
            <canvas #revenueChartCanvas></canvas>
          </div>
        </div>

        <!-- Recent Registered Cases (Spans 2 columns for Management, Full 3 columns for Staff!) -->
        <div [class]="isManagement() ? 'bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2' : 'bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm col-span-1 lg:col-span-3'">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-base font-bold text-slate-900 font-heading">
                {{ isTechnician() ? 'Laboratory Testing Worklist' : (isPathologist() ? 'Pathology Review Worklist' : 'Recent Cases Workflow') }}
              </h3>
              <p class="text-xs text-slate-500">
                {{ isTechnician() ? 'Enter parameters and complete investigations.' : (isPathologist() ? 'Review findings and authorize reports.' : 'Live case tracking and results status.') }}
              </p>
            </div>
            <a routerLink="/cases" class="text-xs font-semibold text-brand-600 hover:text-brand-700">View All Cases &rarr;</a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th class="p-3">Case No / Barcode</th>
                  <th class="p-3">Patient Details</th>
                  <!-- Bill / Due shown ONLY to Management & Receptionist -->
                  <th *ngIf="isManagement() || isReceptionist()" class="p-3">Bill / Due</th>
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
                  <!-- Bill / Due Column -->
                  <td *ngIf="isManagement() || isReceptionist()" class="p-3">
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
                    <a [routerLink]="['/investigations', c.id]" class="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 hover:bg-brand-50 hover:text-brand-600 font-medium transition-colors" [title]="isPathologist() ? 'Review & Sign Report' : 'Enter Results'">
                      <i [class]="isPathologist() ? 'fa-solid fa-signature text-xs mr-1' : 'fa-solid fa-microscope text-xs mr-1'"></i>
                      <span>{{ isPathologist() ? 'Review & Sign' : 'Enter Result' }}</span>
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
export class DashboardComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private realtime = inject(RealtimeService);
  private cdr = inject(ChangeDetectorRef);
  private subs = new Subscription();

  @ViewChild('revenueChartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  currentUser = this.authService.currentUserSignal;
  userRole = computed(() => this.currentUser()?.role || '');
  isOwner = computed(() => {
    const r = this.userRole();
    return r === 'LabAdmin' || r === 'SuperAdmin';
  });

  isManagement = computed(() => {
    const r = this.userRole();
    return r === 'LabAdmin' || r === 'LabManager' || r === 'SuperAdmin';
  });
  isTechnician = computed(() => this.userRole() === 'Technician');
  isReceptionist = computed(() => this.userRole() === 'Receptionist');
  isPathologist = computed(() => this.userRole() === 'Pathologist');

  roleDisplayName = computed(() => {
    const r = this.userRole();
    if (r === 'LabAdmin') return 'Lab Owner';
    if (r === 'LabManager') return 'Lab Manager';
    if (r === 'Technician') return 'Lab Technician';
    if (r === 'Receptionist') return 'Receptionist';
    if (r === 'Pathologist') return 'Pathologist Doctor';
    return r || 'User';
  });

  stats: DashboardStats | null = null;
  todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  isTrialMode = false;
  trialDaysLeft = 14;
  labCode = '';
  linkCopied = false;

  copyReferralLink(): void {
    const code = this.labCode || 'DIGITLAB';
    const link = `${window.location.origin}/register?ref=${code}`;
    navigator.clipboard.writeText(link).then(() => {
      this.linkCopied = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.linkCopied = false;
        this.cdr.detectChanges();
      }, 3000);
    });
  }

  getWhatsAppShareUrl(): string {
    const code = this.labCode || 'DIGITLAB';
    const link = `${window.location.origin}/register?ref=${code}`;
    const text = encodeURIComponent(`Namaste Doctor! Hum apne lab me DigitalLab Cloud Pathology Software use kar rahe hain. 100+ tests preloaded hain aur reports direct WhatsApp par QR verification ke sath deliver hoti hain. Aap bhi 14-din ka zero risk free trial shuru karein: ${link}`);
    return `https://wa.me/?text=${text}`;
  }

  ngOnInit(): void {
    this.loadStats();
    this.checkTrialStatus();

    // Auto-refresh Dashboard KPI counts & recent cases whenever any real-time event happens
    this.subs.add(this.realtime.caseCreated$.subscribe(() => this.loadStats()));
    this.subs.add(this.realtime.caseStatusChanged$.subscribe(() => this.loadStats()));
    this.subs.add(this.realtime.reportApproved$.subscribe(() => this.loadStats()));
    this.subs.add(this.realtime.paymentUpdated$.subscribe(() => this.loadStats()));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  checkTrialStatus(): void {
    this.api.getMySubscription().subscribe({
      next: (sub) => {
        this.labCode = sub?.labCode || '';
        const isPastDate = sub?.subscriptionExpiryDate ? new Date(sub.subscriptionExpiryDate) < new Date() : false;
        const isExpired = sub?.isExpired || sub?.subscriptionStatus === 'Expired' || sub?.subscriptionStatus === 'Suspended' || isPastDate;

        if (!isExpired && sub?.subscriptionExpiryDate && (sub?.subscriptionStatus === 'Trial' || sub?.currentPlan?.planCode === 'TRIAL')) {
          this.isTrialMode = true;
          const diffMs = new Date(sub.subscriptionExpiryDate).getTime() - Date.now();
          this.trialDaysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          this.cdr.detectChanges();
        } else {
          this.isTrialMode = false;
        }
      },
      error: () => {}
    });
  }

  loadStats(): void {
    this.api.getDashboardStats().subscribe({
      next: (res) => {
        this.stats = res;
        this.cdr.detectChanges();
        if (this.isManagement()) {
          setTimeout(() => this.renderChart(), 100);
        }

        // Fetch Live Transactions to guarantee dynamic Counter Closing values
        if (this.isManagement() || this.isReceptionist()) {
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
        }
      },
      error: (err) => console.error(err)
    });
  }

  renderChart(): void {
    if (!this.stats || !this.chartCanvas || !this.isManagement()) return;
    const ctx = this.chartCanvas.nativeElement?.getContext('2d');
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
