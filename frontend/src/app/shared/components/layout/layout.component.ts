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
        <div class="px-3 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div class="flex items-center space-x-2 sm:space-x-3">
            <!-- Mobile Hamburger Menu Button (Visible on Mobile/Tablet) -->
            <button type="button" (click)="toggleMobileMenu()" 
              class="lg:hidden p-2 rounded-xl text-slate-600 hover:text-brand-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Toggle Menu">
              <i class="fa-solid fa-bars text-lg"></i>
            </button>

            <!-- Lab Logo & Title -->
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
              <i class="fa-solid fa-flask-vial text-base sm:text-lg"></i>
            </div>
            <div class="truncate max-w-[170px] sm:max-w-none">
              <div class="flex items-center space-x-1.5 sm:space-x-2">
                <h1 class="text-sm sm:text-lg font-bold text-slate-900 font-heading leading-none truncate">
                  {{ currentUser()?.labName || 'DigitLab LIMS' }}
                </h1>
                <span *ngIf="currentUser()?.role" class="hidden sm:inline-block px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {{ currentUser()?.role }}
                </span>
              </div>
              <p class="text-[10px] sm:text-xs text-slate-500 truncate">Cloud Pathology System</p>
            </div>
          </div>

          <!-- Quick Action Bar & User Profile -->
          <div class="flex items-center space-x-2 sm:space-x-3">
            <a routerLink="/cases/add" class="inline-flex items-center px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-500/20 transition-colors shrink-0">
              <i class="fa-solid fa-plus mr-1 sm:mr-1.5 text-xs"></i>
              <span>New Case</span>
            </a>

            <div class="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <div class="flex items-center space-x-2 sm:space-x-3">
              <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs sm:text-sm">
                {{ currentUser()?.fullName?.charAt(0) || 'U' }}
              </div>
              <div class="hidden md:block text-left">
                <div class="text-xs font-bold text-slate-900 leading-tight">{{ currentUser()?.fullName }}</div>
                <div class="text-[11px] text-slate-500 truncate max-w-[140px]">{{ currentUser()?.email }}</div>
              </div>
              <button (click)="logout()" title="Logout" class="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">
                <i class="fa-solid fa-arrow-right-from-bracket text-xs sm:text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Mobile Navigation Drawer Overlay Backdrop -->
      <div *ngIf="mobileMenuOpen" 
        (click)="closeMobileMenu()" 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300">
      </div>

      <!-- Mobile Slide-out Drawer Navigation -->
      <div *ngIf="mobileMenuOpen" 
        class="fixed inset-y-0 left-0 max-w-xs w-72 bg-slate-900 text-slate-300 z-50 flex flex-col justify-between shadow-2xl lg:hidden transform transition-transform duration-300 animate-in slide-in-from-left">
        
        <!-- Mobile Drawer Header -->
        <div class="p-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <i class="fa-solid fa-flask-vial text-sm"></i>
            </div>
            <span class="font-bold text-white text-sm font-heading">DigitLab Menu</span>
          </div>
          <button (click)="closeMobileMenu()" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <i class="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <!-- Mobile Drawer Links List -->
        <div class="p-3 space-y-1 overflow-y-auto flex-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-2 pb-1">Main Modules</div>
          
          <a routerLink="/dashboard" (click)="closeMobileMenu()" routerLinkActive="bg-brand-600 text-white shadow-lg" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-800 transition-all">
            <i class="fa-solid fa-chart-pie w-5 text-center mr-2.5"></i> Dashboard
          </a>

          <a routerLink="/cases/add" (click)="closeMobileMenu()" routerLinkActive="bg-brand-600 text-white shadow-lg" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-800 transition-all">
            <i class="fa-solid fa-file-invoice-dollar w-5 text-center mr-2.5"></i> New Case / Billing
          </a>

          <a routerLink="/cases" (click)="closeMobileMenu()" routerLinkActive="bg-brand-600 text-white shadow-lg" [routerLinkActiveOptions]="{exact: true}" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-800 transition-all">
            <i class="fa-solid fa-list-check w-5 text-center mr-2.5"></i> Case Management
          </a>

          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-3 pb-1">Lab Operations</div>

          <a routerLink="/tests" (click)="closeMobileMenu()" routerLinkActive="bg-brand-600 text-white shadow-lg" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-800 transition-all">
            <i class="fa-solid fa-dna w-5 text-center mr-2.5"></i> Test Catalog & Rates
          </a>

          <a routerLink="/doctors" (click)="closeMobileMenu()" routerLinkActive="bg-brand-600 text-white shadow-lg" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-800 transition-all">
            <i class="fa-solid fa-user-doctor w-5 text-center mr-2.5"></i> Doctor Referrals
          </a>

          <a routerLink="/agents" (click)="closeMobileMenu()" routerLinkActive="bg-brand-600 text-white shadow-lg" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-800 transition-all">
            <i class="fa-solid fa-motorcycle w-5 text-center mr-2.5"></i> Collection Centres
          </a>

          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-3 pb-1">Finance & Branding</div>

          <a routerLink="/transactions" (click)="closeMobileMenu()" routerLinkActive="bg-brand-600 text-white shadow-lg" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-800 transition-all">
            <i class="fa-solid fa-receipt w-5 text-center mr-2.5"></i> Accounts & Ledger
          </a>

          <a routerLink="/letterhead" (click)="closeMobileMenu()" routerLinkActive="bg-brand-600 text-white shadow-lg" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-800 transition-all">
            <i class="fa-solid fa-signature w-5 text-center mr-2.5"></i> Letterhead & Branding
          </a>

          <a routerLink="/staff" (click)="closeMobileMenu()" routerLinkActive="bg-brand-600 text-white shadow-lg" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-800 transition-all">
            <i class="fa-solid fa-users-gear w-5 text-center mr-2.5"></i> Staff & Permissions
          </a>

          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-3 pb-1">SaaS & Support</div>

          <a routerLink="/subscription" (click)="closeMobileMenu()" routerLinkActive="bg-brand-600 text-white shadow-lg" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-800 transition-all">
            <i class="fa-solid fa-credit-card w-5 text-center mr-2.5"></i> Subscription & Billing
          </a>

          <a routerLink="/support" (click)="closeMobileMenu()" routerLinkActive="bg-brand-600 text-white shadow-lg" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-800 transition-all">
            <i class="fa-solid fa-headset w-5 text-center mr-2.5"></i> Helpdesk & Support
          </a>

          <ng-container *ngIf="isSuperAdmin()">
            <div class="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-3 pt-3 pb-1">Super Admin</div>
            <a routerLink="/admin-dashboard" (click)="closeMobileMenu()" routerLinkActive="bg-amber-600 text-white" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl text-amber-200 hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-shield-halved w-5 text-center mr-2.5"></i> SaaS Admin Portal
            </a>
          </ng-container>
        </div>

        <div class="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
          <span>DigitLab v2.6.0</span>
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>

      <!-- Main Shell Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Desktop Left Sidebar Navigation (Hidden on Mobile/Tablet) -->
        <aside class="hidden lg:flex w-64 bg-slate-900 text-slate-300 flex-col justify-between shrink-0 shadow-xl">
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
        <main class="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-slate-50/60 w-full min-w-0">
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

  mobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
  }
}
