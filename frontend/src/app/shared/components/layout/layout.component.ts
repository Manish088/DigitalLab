import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
      <!-- Top Navigation Bar -->
      <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div class="px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <i class="fa-solid fa-flask-vial text-lg"></i>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h1 class="text-lg font-bold text-slate-900 font-heading leading-none">
                  {{ currentUser()?.labName || 'DigitLab LIMS' }}
                </h1>
                <span *ngIf="currentUser()?.role" class="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {{ currentUser()?.role }}
                </span>
              </div>
              <p class="text-xs text-slate-500">Cloud Pathology Information System</p>
            </div>
          </div>

          <!-- Quick Action Bar & User Profile -->
          <div class="flex items-center space-x-3">
            <a routerLink="/cases/add" class="inline-flex items-center px-3.5 py-1.5 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-colors">
              <i class="fa-solid fa-plus mr-1.5 text-xs"></i> New Case
            </a>

            <div class="h-6 w-px bg-slate-200"></div>

            <div class="flex items-center space-x-3">
              <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm">
                {{ currentUser()?.fullName?.charAt(0) || 'U' }}
              </div>
              <div class="hidden md:block text-left">
                <div class="text-xs font-bold text-slate-900 leading-tight">{{ currentUser()?.fullName }}</div>
                <div class="text-[11px] text-slate-500 truncate max-w-[140px]">{{ currentUser()?.email }}</div>
              </div>
              <button (click)="logout()" title="Logout" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                <i class="fa-solid fa-arrow-right-from-bracket text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="flex-1 flex overflow-hidden">
        <!-- Left Sidebar Navigation -->
        <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 shadow-xl">
          <div class="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
            <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-2 pb-1">Main Modules</div>
            
            <a routerLink="/dashboard" routerLinkActive="bg-brand-600 text-white shadow-lg shadow-brand-600/30" class="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-chart-pie w-5 text-center mr-3"></i> Dashboard
            </a>

            <a routerLink="/cases/add" routerLinkActive="bg-brand-600 text-white shadow-lg shadow-brand-600/30" class="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-file-invoice-dollar w-5 text-center mr-3"></i> New Case / Billing
            </a>

            <a routerLink="/cases" routerLinkActive="bg-brand-600 text-white shadow-lg shadow-brand-600/30" [routerLinkActiveOptions]="{exact: true}" class="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-list-check w-5 text-center mr-3"></i> Case Management
            </a>

            <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-4 pb-1">Lab Operations</div>

            <a routerLink="/tests" routerLinkActive="bg-brand-600 text-white shadow-lg shadow-brand-600/30" class="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-dna w-5 text-center mr-3"></i> Test Catalog & Rates
            </a>

            <a routerLink="/doctors" routerLinkActive="bg-brand-600 text-white shadow-lg shadow-brand-600/30" class="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-user-doctor w-5 text-center mr-3"></i> Doctor Referrals
            </a>

            <a routerLink="/agents" routerLinkActive="bg-brand-600 text-white shadow-lg shadow-brand-600/30" class="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-motorcycle w-5 text-center mr-3"></i> Collection Centres / Agents
            </a>

            <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-4 pb-1">Finance & Branding</div>

            <a routerLink="/transactions" routerLinkActive="bg-brand-600 text-white shadow-lg shadow-brand-600/30" class="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-receipt w-5 text-center mr-3"></i> Accounts & Ledger
            </a>

            <a routerLink="/letterhead" routerLinkActive="bg-brand-600 text-white shadow-lg shadow-brand-600/30" class="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-signature w-5 text-center mr-3"></i> Letterhead & Branding
            </a>

            <a routerLink="/staff" routerLinkActive="bg-brand-600 text-white shadow-lg shadow-brand-600/30" class="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-users-gear w-5 text-center mr-3"></i> Staff & Permissions
            </a>

            <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-4 pb-1">SaaS & Support</div>

            <a routerLink="/subscription" routerLinkActive="bg-brand-600 text-white shadow-lg shadow-brand-600/30" class="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-credit-card w-5 text-center mr-3"></i> Subscription & Billing
            </a>

            <a routerLink="/support" routerLinkActive="bg-brand-600 text-white shadow-lg shadow-brand-600/30" class="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-headset w-5 text-center mr-3"></i> Helpdesk & Support
            </a>

            <ng-container *ngIf="isSuperAdmin()">
              <div class="text-[11px] font-bold uppercase tracking-wider text-amber-400 px-3 pt-4 pb-1">Super Admin</div>
              <a routerLink="/admin-dashboard" routerLinkActive="bg-amber-600 text-white" class="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-amber-200 hover:bg-slate-800 transition-all">
                <i class="fa-solid fa-shield-halved w-5 text-center mr-3"></i> SaaS Admin Portal
              </a>
            </ng-container>
          </div>

          <div class="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
            <span>DigitLab v2.6.0</span>
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </aside>

        <!-- Main Content Viewport -->
        <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/60">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent {
  private authService = inject(AuthService);
  currentUser = this.authService.currentUserSignal;
  isSuperAdmin = this.authService.isSuperAdmin;

  logout() {
    this.authService.logout();
  }
}
