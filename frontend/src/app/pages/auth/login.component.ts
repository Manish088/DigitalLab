import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-100/70 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Background subtle decorative medical accents -->
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none"></div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div class="inline-block p-2 bg-white rounded-2xl shadow-md border border-slate-200/80 mb-3">
          <img src="logo.png" alt="DigitalLab" class="w-14 h-14 rounded-xl object-contain">
        </div>
        <h2 class="text-3xl font-black text-slate-900 tracking-tight font-heading">DigitalLab LIMS</h2>
        <p class="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">Cloud Pathology & Diagnostic Laboratory Management System</p>
      </div>

      <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div class="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200/80">
          
          <!-- Mode Tabs -->
          <div class="flex border-b border-slate-200 mb-6 text-xs sm:text-sm font-bold">
            <button type="button" (click)="isRegister = false; errorMessage = ''" 
              [class]="!isRegister ? 'border-b-2 border-brand-600 text-brand-700 font-extrabold pb-3' : 'text-slate-400 hover:text-slate-600 pb-3'" 
              class="flex-1 text-center transition-all cursor-pointer">
              Sign In to Account
            </button>
            <button type="button" (click)="isRegister = true; errorMessage = ''" 
              [class]="isRegister ? 'border-b-2 border-brand-600 text-brand-700 font-extrabold pb-3' : 'text-slate-400 hover:text-slate-600 pb-3'" 
              class="flex-1 text-center transition-all cursor-pointer">
              Register New Lab
            </button>
          </div>

          <!-- Alert error message -->
          <div *ngIf="errorMessage" class="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center animate-in fade-in duration-200">
            <i class="fa-solid fa-circle-exclamation mr-2 text-sm shrink-0"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Sign In Form -->
          <form *ngIf="!isRegister" (ngSubmit)="onLogin()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Email or Username</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i class="fa-solid fa-envelope text-xs"></i>
                </div>
                <input type="text" [(ngModel)]="loginData.emailOrUsername" name="email" required placeholder="Enter registered email or username"
                  class="block w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-xs sm:text-sm font-semibold transition-all">
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-bold text-slate-700">Password</label>
              </div>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i class="fa-solid fa-lock text-xs"></i>
                </div>
                <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="loginData.password" name="password" required placeholder="Enter your password"
                  class="block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-xs sm:text-sm font-semibold transition-all">
                <button type="button" (click)="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                  <i class="fa-solid" [ngClass]="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
            </div>

            <button type="submit" [disabled]="loading"
              class="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-sky-600 text-white font-bold text-xs sm:text-sm hover:from-brand-500 hover:to-sky-500 transition-all shadow-lg shadow-brand-600/25 disabled:opacity-50 cursor-pointer">
              <i *ngIf="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
              {{ loading ? 'Signing in...' : 'Sign In to Dashboard' }}
            </button>
          </form>

          <!-- Register Form -->
          <form *ngIf="isRegister" (ngSubmit)="onRegister()" class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Laboratory / Diagnostic Name *</label>
              <input type="text" [(ngModel)]="regData.labName" name="labName" required placeholder="e.g. Metro Care Diagnostics"
                class="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Owner / Doctor Full Name *</label>
              <input type="text" [(ngModel)]="regData.ownerName" name="ownerName" required placeholder="Dr. S. K. Gupta"
                class="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                <input type="email" [(ngModel)]="regData.email" name="email" required placeholder="lab@example.com"
                  class="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-semibold transition-all">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Mobile / WhatsApp *</label>
                <input type="tel" [(ngModel)]="regData.phone" name="phone" required placeholder="7706087066"
                  class="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-semibold transition-all">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input type="text" [(ngModel)]="regData.city" name="city" placeholder="e.g. Mumbai"
                  class="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-semibold transition-all">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                <input type="password" [(ngModel)]="regData.password" name="password" required placeholder="Min 6 characters"
                  class="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-semibold transition-all">
              </div>
            </div>

            <button type="submit" [disabled]="loading"
              class="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs sm:text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer">
              <i *ngIf="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
              {{ loading ? 'Creating Account...' : 'Start 14-Day Free Trial' }}
            </button>
          </form>

        </div>

        <p class="text-center text-[11px] text-slate-400 mt-6 font-medium">
          DigitalLab Cloud Pathology & LIMS Platform • Secure & ISO Compliant
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isRegister = false;
  loading = false;
  showPassword = false;
  errorMessage = '';

  loginData = {
    emailOrUsername: '',
    password: ''
  };

  regData = {
    labName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    password: ''
  };

  onLogin() {
    if (!this.loginData.emailOrUsername || !this.loginData.password) {
      this.errorMessage = 'Please enter both email/username and password.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.authService.login(this.loginData).subscribe({
      next: (res) => {
        this.loading = false;
        this.cdr.markForCheck();
        if (res.role === 'SuperAdmin') {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please ensure the backend API is running.';
        } else if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else if (typeof err.error === 'string' && err.error.length < 150) {
          this.errorMessage = err.error;
        } else if (err.status === 401) {
          this.errorMessage = 'Invalid email/username or account does not exist.';
        } else {
          this.errorMessage = 'Login failed. Please check your credentials and try again.';
        }
        this.cdr.markForCheck();
      }
    });
  }

  onRegister() {
    if (!this.regData.labName || !this.regData.ownerName || !this.regData.email || !this.regData.phone || !this.regData.password) {
      this.errorMessage = 'Please fill in all required fields.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.authService.register(this.regData).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please ensure the backend API is running.';
        } else if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Registration failed. Please check your details and try again.';
        }
        this.cdr.markForCheck();
      }
    });
  }
}
