import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { RealtimeService } from '../../../core/services/realtime.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
      <!-- SuperAdmin Impersonation Support Banner -->
      <div *ngIf="isImpersonating()" class="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-lg sticky top-0 z-50 border-b border-amber-400/30">
        <div class="flex items-center space-x-2">
          <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
            <i class="fa-solid fa-user-secret text-amber-100"></i>
          </div>
          <span>
            <strong>SuperAdmin Support Mode:</strong> You are managing <span class="underline">{{ currentUser()?.labName }}</span> as SuperAdmin.
          </span>
        </div>
        <button (click)="exitImpersonation()" class="px-3 py-1 bg-white hover:bg-amber-50 text-amber-900 rounded-lg text-xs font-black shadow transition-all flex items-center space-x-1.5 cursor-pointer">
          <i class="fa-solid fa-arrow-right-from-bracket text-amber-700"></i>
          <span>Exit & Return to SuperAdmin</span>
        </button>
      </div>

      <!-- Global Broadcast Announcement Banner -->
      <div *ngIf="announcement?.isActive && announcement?.message && !announcementDismissed" 
        [ngClass]="{
          'bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-800 text-white': announcement?.type === 'Info' || !announcement?.type,
          'bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white': announcement?.type === 'Warning',
          'bg-gradient-to-r from-rose-700 via-rose-600 to-pink-700 text-white': announcement?.type === 'Alert',
          'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white': announcement?.type === 'Success'
        }"
        class="px-4 py-2 text-xs font-medium flex items-center justify-between gap-2 shadow-sm border-b border-white/10 sticky top-0 z-40">
        <div class="flex items-center space-x-2 truncate">
          <i class="fa-solid fa-bullhorn text-amber-300 text-sm shrink-0"></i>
          <span class="font-bold shrink-0">Platform Notice:</span>
          <span class="truncate">{{ announcement?.message }}</span>
        </div>
        <button (click)="announcementDismissed = true" class="text-white/80 hover:text-white p-1 shrink-0 cursor-pointer" title="Dismiss notice">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Global Subscription Expired Alert Banner -->
      <div *ngIf="isSubExpired && !isSuperAdmin()" class="bg-gradient-to-r from-rose-700 via-rose-600 to-rose-800 text-white px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-md sticky top-0 z-40 animate-in fade-in duration-200">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-triangle-exclamation text-amber-300 text-sm"></i>
          <span>
            <strong>Laboratory Subscription Expired:</strong> All workflow operations, result entry, report downloads, and new registrations are locked.
          </span>
        </div>
        <a routerLink="/subscription" class="px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-black shadow-sm transition-all flex items-center space-x-1 shrink-0">
          <i class="fa-solid fa-crown text-amber-500 mr-1"></i>
          <span>Renew Subscription Plan &rarr;</span>
        </a>
      </div>

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
            <img src="logo.png" alt="DigitalLab" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-md object-contain shrink-0">
            <div class="truncate max-w-[170px] sm:max-w-none">
              <div class="flex items-center space-x-1.5 sm:space-x-2">
                <h1 class="text-sm sm:text-lg font-bold text-slate-900 font-heading leading-none truncate">
                  {{ currentUser()?.labName || 'DigitalLab LIMS' }}
                </h1>
                <span *ngIf="currentUser()?.role" class="hidden sm:inline-block px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {{ currentUser()?.role }}
                </span>
                <span *ngIf="realtime.isConnected()" class="hidden md:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Real-Time WebSockets Sync Active">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>LIVE</span>
                </span>
              </div>
              <p class="text-[10px] sm:text-xs text-slate-500 truncate">Cloud Pathology System</p>
            </div>
          </div>

          <!-- Quick Action Bar & User Profile -->
          <div class="flex items-center space-x-2 sm:space-x-3">
            <a *ngIf="isTrial && !isSubExpired && !isSuperAdmin()" routerLink="/subscription" 
              class="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer shadow-sm">
              <i class="fa-solid fa-gift text-emerald-600"></i>
              <span>14-Day Free Trial: {{ trialDaysRemaining }} Days Left</span>
            </a>

            <button (click)="handleNewCaseClick()" 
              [class.opacity-50]="isSubExpired && !isSuperAdmin()"
              class="inline-flex items-center px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-500/20 transition-colors shrink-0 cursor-pointer">
              <i class="fa-solid fa-plus mr-1 sm:mr-1.5 text-xs"></i>
              <span>New Case</span>
            </button>

            <div class="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <div class="flex items-center space-x-2 sm:space-x-3">
              <button type="button" (click)="openProfileModal()" 
                class="flex items-center space-x-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100 transition-colors text-left cursor-pointer group" 
                title="Click to view & edit Profile / Email">
                <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs sm:text-sm group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                  {{ currentUser()?.fullName?.charAt(0) || 'U' }}
                </div>
                <div class="hidden md:block text-left">
                  <div class="text-xs font-bold text-slate-900 leading-tight flex items-center space-x-1">
                    <span>{{ currentUser()?.fullName }}</span>
                    <i class="fa-solid fa-pen text-[9px] text-slate-400 group-hover:text-brand-600"></i>
                  </div>
                  <div class="text-[11px] text-slate-500 truncate max-w-[150px]">{{ currentUser()?.email }}</div>
                </div>
              </button>
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
            <img src="logo.png" alt="DigitalLab" class="w-7 h-7 rounded-lg object-contain">
            <span class="font-bold text-white text-sm font-heading">DigitalLab Menu</span>
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

          <ng-container *ngIf="canManageLab()">
            <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-3 pb-1">Lab Operations</div>

            <a routerLink="/tests" (click)="closeMobileMenu()" routerLinkActive="bg-brand-600 text-white shadow-lg" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-dna w-5 text-center mr-2.5"></i> Test Catalog & Rates
            </a>

            <a routerLink="/doctors" (click)="closeMobileMenu()" routerLinkActive="bg-brand-600 text-white shadow-lg" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-user-doctor w-5 text-center mr-2.5"></i> Doctor Referrals
            </a>

            <a routerLink="/agents" (click)="closeMobileMenu()" routerLinkActive="bg-brand-600 text-white shadow-lg" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-motorcycle w-5 text-center mr-2.5"></i> Collection Centres / Agents
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

            <a href="https://github.com/Manish088/DigitalLab/releases/download/v1.0-mobile/DigitLab.apk" target="_blank" class="flex items-center px-3 py-2 text-xs font-bold rounded-xl text-emerald-400 hover:bg-slate-800 transition-all">
              <i class="fa-brands fa-android w-5 text-center mr-2.5 text-base"></i> Download Mobile App
            </a>
          </ng-container>

          <ng-container *ngIf="isSuperAdmin()">
            <div class="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-3 pt-3 pb-1">Super Admin</div>
            <a routerLink="/admin-dashboard" (click)="closeMobileMenu()" routerLinkActive="bg-amber-600 text-white" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl text-amber-200 hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-shield-halved w-5 text-center mr-2.5"></i> SaaS Admin Portal
            </a>
            <a [routerLink]="['/admin-dashboard']" [queryParams]="{ tab: 'monetization' }" (click)="closeMobileMenu()" class="flex items-center px-3 py-2 text-xs font-medium rounded-xl text-emerald-300 hover:bg-slate-800 transition-all">
              <i class="fa-solid fa-rectangle-ad w-5 text-center mr-2.5 text-emerald-400"></i> Advertising & Monetization
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

            <ng-container *ngIf="canManageLab()">
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

              <a href="https://github.com/Manish088/DigitalLab/releases/download/v1.0-mobile/DigitLab.apk" target="_blank" class="flex items-center px-3 py-2 text-sm font-bold rounded-lg text-emerald-400 hover:bg-slate-800 transition-all">
                <i class="fa-brands fa-android w-5 text-center mr-3 text-base"></i> Download Mobile App
              </a>
            </ng-container>

            <ng-container *ngIf="isSuperAdmin()">
              <div class="text-[11px] font-bold uppercase tracking-wider text-amber-400 px-3 pt-4 pb-1">Super Admin</div>
              <a routerLink="/admin-dashboard" routerLinkActive="bg-amber-600 text-white" class="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-amber-200 hover:bg-slate-800 transition-all">
                <i class="fa-solid fa-shield-halved w-5 text-center mr-3"></i> SaaS Admin Portal
              </a>
              <a [routerLink]="['/admin-dashboard']" [queryParams]="{ tab: 'monetization' }" class="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-emerald-300 hover:bg-slate-800 transition-all">
                <i class="fa-solid fa-rectangle-ad w-5 text-center mr-3 text-emerald-400"></i> Advertising & Monetization
              </a>
            </ng-container>
          </div>

          <div class="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
            <span>DigitalLab v2.6.0</span>
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </aside>

        <!-- Main Content Viewport -->
        <main class="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-slate-50/60 w-full min-w-0">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Floating 24/7 WhatsApp Help Support Button (Step 5) -->
      <a href="https://wa.me/917706087066?text=Namaste%20DigitalLab%20Support%2C%20mujhe%20software%20me%20help%20chahiye."
        target="_blank" rel="noopener noreferrer"
        class="fixed bottom-5 right-5 z-50 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-full px-4 py-2.5 shadow-2xl flex items-center space-x-2.5 border-2 border-white cursor-pointer hover:scale-105 transition-all group"
        title="Instant 24/7 WhatsApp Helpdesk">
        <i class="fa-brands fa-whatsapp text-2xl text-white"></i>
        <div class="text-left hidden sm:block">
          <div class="text-[9px] font-medium leading-none text-emerald-100">Instant Help</div>
          <div class="text-xs font-black tracking-wide leading-tight">WhatsApp Support</div>
        </div>
      </a>

      <!-- User Profile & Real Email Settings Modal -->
      <div *ngIf="showProfileModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2.5">
              <div class="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-base">
                <i class="fa-solid fa-user-pen"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900 font-heading">My Profile & Email</h3>
                <p class="text-[11px] text-slate-400">Update your account details and login email</p>
              </div>
            </div>
            <button (click)="showProfileModal = false" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <!-- Alert error -->
          <div *ngIf="profileError" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center">
            <i class="fa-solid fa-circle-exclamation mr-2 text-sm shrink-0"></i>
            <span>{{ profileError }}</span>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input type="text" [(ngModel)]="profileForm.fullName" placeholder="Enter full name"
                class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Email Address *</span>
                <span class="text-[10px] text-brand-600 font-normal">Real Email (e.g. rahul&#64;gmail.com)</span>
              </label>
              <input type="email" [(ngModel)]="profileForm.email" placeholder="e.g. yourname@gmail.com"
                class="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              <p class="text-[10px] text-slate-400 mt-1">This email appears on your reports and is used for login.</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number</label>
              <input type="tel" [(ngModel)]="profileForm.phoneNumber" placeholder="10-digit mobile number" maxlength="10"
                class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>
          </div>

          <div class="flex items-center space-x-2 pt-3 border-t border-slate-100">
            <button type="button" (click)="saveProfile()" [disabled]="savingProfile"
              class="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50">
              <i *ngIf="savingProfile" class="fa-solid fa-spinner fa-spin mr-1"></i>
              <i *ngIf="!savingProfile" class="fa-solid fa-check mr-1"></i>
              <span>{{ savingProfile ? 'Saving...' : 'Save Profile Changes' }}</span>
            </button>
            <button type="button" (click)="showProfileModal = false" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-all cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastService);
  public realtime = inject(RealtimeService);

  currentUser = this.authService.currentUserSignal;
  isSuperAdmin = this.authService.isSuperAdmin;
  canManageStaff = this.authService.canManageStaff;
  canManageLab = this.authService.canManageLab;
  isImpersonating = this.authService.isImpersonatingSignal;

  mobileMenuOpen = false;
  isSubExpired = false;
  isTrial = false;
  trialDaysRemaining = 14;
  subExpiryDate: string | null = null;
  announcement: any = null;
  announcementDismissed = false;

  ngOnInit(): void {
    if (!this.isSuperAdmin()) {
      this.checkSubscription();
    }
    this.loadAnnouncement();
  }

  loadAnnouncement(): void {
    this.apiService.getGlobalAnnouncement().subscribe({
      next: (res) => {
        this.announcement = res;
      },
      error: () => {
        // Silently ignore if announcement fails
      }
    });
  }

  exitImpersonation(): void {
    this.toast.info('Exited lab impersonation. Returning to SuperAdmin Portal...');
    this.authService.exitImpersonation();
  }

  checkSubscription(): void {
    this.apiService.getMySubscription().subscribe({
      next: (sub) => {
        const isPastDate = sub?.subscriptionExpiryDate ? new Date(sub.subscriptionExpiryDate) < new Date() : false;
        this.subExpiryDate = sub?.subscriptionExpiryDate || null;
        this.isSubExpired = sub?.isExpired || sub?.subscriptionStatus === 'Expired' || sub?.subscriptionStatus === 'Suspended' || isPastDate;

        if (!this.isSubExpired && sub?.subscriptionExpiryDate && (sub?.subscriptionStatus === 'Trial' || sub?.currentPlan?.planCode === 'TRIAL')) {
          this.isTrial = true;
          const diffMs = new Date(sub.subscriptionExpiryDate).getTime() - Date.now();
          this.trialDaysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        } else {
          this.isTrial = false;
        }
      },
      error: (err) => console.error('Error checking layout subscription status:', err)
    });
  }

  handleNewCaseClick(): void {
    if (this.isSubExpired && !this.isSuperAdmin()) {
      const expDateStr = this.subExpiryDate 
        ? new Date(this.subExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
        : 'earlier';
      this.toast.error(`⚠️ Laboratory Subscription Expired (Ended on ${expDateStr}). Please renew your plan to register new patients and generate bills.`);
      this.router.navigate(['/subscription']);
      return;
    }
    this.router.navigate(['/cases/add']);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  showProfileModal = false;
  savingProfile = false;
  profileError = '';
  profileForm = {
    fullName: '',
    email: '',
    phoneNumber: ''
  };

  openProfileModal(): void {
    const u = this.currentUser();
    this.profileForm = {
      fullName: u?.fullName || '',
      email: u?.email || '',
      phoneNumber: ''
    };
    this.profileError = '';
    this.showProfileModal = true;
    this.apiService.getMyProfile().subscribe({
      next: (res) => {
        if (res) {
          this.profileForm.fullName = res.fullName || this.profileForm.fullName;
          this.profileForm.email = res.email || this.profileForm.email;
          this.profileForm.phoneNumber = res.phoneNumber || '';
        }
      },
      error: () => {}
    });
  }

  saveProfile(): void {
    if (!this.profileForm.fullName?.trim() || !this.profileForm.email?.trim()) {
      this.profileError = 'Please enter both your full name and email address.';
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.profileForm.email.trim())) {
      this.profileError = 'Please enter a valid email address (e.g. lab@example.com).';
      return;
    }

    this.savingProfile = true;
    this.profileError = '';
    this.apiService.updateMyProfile({
      fullName: this.profileForm.fullName.trim(),
      email: this.profileForm.email.trim().toLowerCase(),
      phoneNumber: this.profileForm.phoneNumber?.trim() || undefined
    }).subscribe({
      next: (res) => {
        this.savingProfile = false;
        this.showProfileModal = false;
        const curUser = this.currentUser();
        if (curUser) {
          const updated = {
            ...curUser,
            fullName: res.fullName || this.profileForm.fullName.trim(),
            email: res.email || this.profileForm.email.trim().toLowerCase()
          };
          localStorage.setItem('lab_user_profile', JSON.stringify(updated));
          this.authService.currentUserSignal.set(updated);
        }
        this.toast.success('Profile and email updated successfully!');
      },
      error: (err) => {
        this.savingProfile = false;
        this.profileError = err.error?.message || 'Failed to update profile. Please try again.';
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
