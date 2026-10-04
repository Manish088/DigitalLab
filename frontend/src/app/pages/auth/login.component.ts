import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Background glow elements -->
      <div class="absolute top-0 -left-4 w-72 h-72 bg-brand-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div class="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-cyan-400 text-white shadow-xl shadow-brand-500/25 mb-4">
          <i class="fa-solid fa-microscope text-2xl"></i>
        </div>
        <h2 class="text-3xl font-extrabold text-white tracking-tight font-heading">Lab Suvidha LIMS</h2>
        <p class="mt-2 text-sm text-slate-400">Cloud Pathology Laboratory Information Management System</p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div class="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700/60">
          <!-- Mode Tabs -->
          <div class="flex border-b border-slate-700 mb-6">
            <button (click)="isRegister = false" [class]="!isRegister ? 'border-b-2 border-brand-500 text-white font-semibold' : 'text-slate-400 hover:text-slate-300'" class="flex-1 py-3 text-center text-sm transition-all">
              Sign In
            </button>
            <button (click)="isRegister = true" [class]="isRegister ? 'border-b-2 border-brand-500 text-white font-semibold' : 'text-slate-400 hover:text-slate-300'" class="flex-1 py-3 text-center text-sm transition-all">
              Register New Lab
            </button>
          </div>

          <!-- Alert message -->
          <div *ngIf="errorMessage" class="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center">
            <i class="fa-solid fa-circle-exclamation mr-2 text-sm"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Sign In Form -->
          <form *ngIf="!isRegister" (ngSubmit)="onLogin()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Email or Username</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <i class="fa-solid fa-envelope text-xs"></i>
                </div>
                <input type="text" [(ngModel)]="loginData.emailOrUsername" name="email" required placeholder="doctor@citylab.com"
                  class="block w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm">
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <i class="fa-solid fa-lock text-xs"></i>
                </div>
                <input type="password" [(ngModel)]="loginData.password" name="password" required placeholder="••••••••"
                  class="block w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm">
              </div>
            </div>

            <button type="submit" [disabled]="loading"
              class="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 text-white font-semibold text-sm hover:from-brand-500 hover:to-cyan-500 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50">
              <i *ngIf="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
              {{ loading ? 'Signing in...' : 'Sign In to Dashboard' }}
            </button>

            <!-- Quick Demo Credentials Box -->
            <div class="pt-4 border-t border-slate-700/60 mt-4 text-xs">
              <span class="text-slate-400 font-semibold uppercase tracking-wider block mb-2">⚡ Quick One-Click Demo Logins:</span>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" (click)="fillDemo('doctor@citylab.com', 'Pass@12345')"
                  class="p-2 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-brand-500 text-left transition-colors">
                  <div class="text-brand-400 font-semibold">👨‍⚕️ Lab Owner / Admin</div>
                  <div class="text-slate-500 text-[10px]">doctor&#64;citylab.com</div>
                </button>
                <button type="button" (click)="fillDemo('admin@labsuvidha.com', 'Admin@12345')"
                  class="p-2 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-amber-500 text-left transition-colors">
                  <div class="text-amber-400 font-semibold">🛡️ Super Admin</div>
                  <div class="text-slate-500 text-[10px]">admin&#64;labsuvidha.com</div>
                </button>
              </div>
            </div>
          </form>

          <!-- Register Form -->
          <form *ngIf="isRegister" (ngSubmit)="onRegister()" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Laboratory / Diagnostic Name</label>
              <input type="text" [(ngModel)]="regData.labName" name="labName" required placeholder="e.g. Metro Care Diagnostics"
                class="block w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Owner / Doctor Full Name</label>
              <input type="text" [(ngModel)]="regData.ownerName" name="ownerName" required placeholder="Dr. S. K. Gupta"
                class="block w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm">
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Email</label>
                <input type="email" [(ngModel)]="regData.email" name="email" required placeholder="lab@example.com"
                  class="block w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Mobile</label>
                <input type="tel" [(ngModel)]="regData.phone" name="phone" required placeholder="9876543210"
                  class="block w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">City</label>
                <input type="text" [(ngModel)]="regData.city" name="city" placeholder="e.g. Mumbai"
                  class="block w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Password</label>
                <input type="password" [(ngModel)]="regData.password" name="password" required placeholder="••••••••"
                  class="block w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm">
              </div>
            </div>

            <button type="submit" [disabled]="loading"
              class="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
              <i *ngIf="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
              {{ loading ? 'Creating Account...' : 'Start 14-Day Free Trial' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isRegister = false;
  loading = false;
  errorMessage = '';

  loginData = {
    emailOrUsername: 'doctor@citylab.com',
    password: 'Pass@12345'
  };

  regData = {
    labName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    password: ''
  };

  fillDemo(email: string, pass: string) {
    this.loginData.emailOrUsername = email;
    this.loginData.password = pass;
    this.onLogin();
  }

  onLogin() {
    this.loading = true;
    this.errorMessage = '';
    this.authService.login(this.loginData).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.role === 'SuperAdmin') {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please check credentials.';
      }
    });
  }

  onRegister() {
    this.loading = true;
    this.errorMessage = '';
    this.authService.register(this.regData).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Registration failed.';
      }
    });
  }
}
