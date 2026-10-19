import { Component, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-100/70 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Background subtle decorative medical accents -->
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none"></div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <a routerLink="/" class="inline-block p-2 bg-white rounded-2xl shadow-md border border-slate-200/80 mb-3 hover:scale-105 transition-transform">
          <img src="logo.png" alt="DigitalLab" class="w-14 h-14 rounded-xl object-contain">
        </a>
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
              Sign In
            </button>
            <button type="button" (click)="isRegister = true; errorMessage = ''" 
              [class]="isRegister ? 'border-b-2 border-emerald-600 text-emerald-700 font-extrabold pb-3' : 'text-slate-400 hover:text-slate-600 pb-3'" 
              class="flex-1 text-center transition-all cursor-pointer flex items-center justify-center space-x-1.5">
              <span>Start Free Trial</span>
              <span class="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">14 Days</span>
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
              <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                <i class="fa-solid fa-envelope text-slate-400 mr-1.5 text-xs"></i>
                <span>Email Address or Mobile Number</span>
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i class="fa-solid fa-user-check text-xs"></i>
                </div>
                <input type="text" [(ngModel)]="loginData.emailOrUsername" name="email" required placeholder="Enter Email Address or 10-digit mobile"
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

            <div class="mt-4 pt-4 border-t border-slate-100 text-center">
              <p class="text-xs text-slate-500">Don't have an account yet?</p>
              <button type="button" (click)="isRegister = true; errorMessage = ''" class="mt-1 text-xs font-extrabold text-emerald-600 hover:text-emerald-700 underline cursor-pointer">
                Start 14-Day Free Trial (Instant 1-Min Setup) &rarr;
              </button>
            </div>
          </form>

          <!-- Register / 14-Day Free Trial Form -->
          <form *ngIf="isRegister" (ngSubmit)="onInitiateRegister()" class="space-y-3.5">
            <!-- 14-Day Trial Trust Banner -->
            <div class="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-brand-500/10 border border-emerald-500/30 text-center">
              <div class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-1 border border-emerald-300">
                <i class="fa-solid fa-shield-check text-emerald-600"></i>
                <span>Zero Risk • 14 Days Free Trial</span>
              </div>
              <h3 class="text-xs sm:text-sm font-extrabold text-slate-800">Launch Your Lab in 1 Minute</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">100+ standard tests preloaded • No credit card required</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Laboratory / Diagnostic Name *</label>
              <input type="text" [(ngModel)]="regData.labName" name="labName" required placeholder="e.g. Metro Care Diagnostics"
                class="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Owner / Doctor Full Name *</label>
              <input type="text" [(ngModel)]="regData.ownerName" name="ownerName" required placeholder="e.g. Dr. S. K. Gupta"
                class="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                <i class="fa-solid fa-envelope text-slate-400 mr-1 text-xs"></i>
                <span>Email Address *</span>
              </label>
              <input type="email" [(ngModel)]="regData.email" name="email" required placeholder="e.g. yourname@gmail.com"
                class="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span class="flex items-center">
                    <i class="fa-brands fa-whatsapp text-emerald-600 mr-1 text-sm"></i>
                    <span>WhatsApp Number *</span>
                  </span>
                  <span *ngIf="regData.phone" [class]="phoneStatus.color" class="text-[10px] font-bold">
                    {{ phoneStatus.text }}
                  </span>
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                    +91
                  </div>
                  <input type="tel" [(ngModel)]="regData.phone" (input)="onPhoneInput($event)" name="phone" required placeholder="10-digit number" maxlength="10" inputmode="numeric"
                    class="block w-full pl-11 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <i class="fa-solid fa-lock text-slate-400 mr-1 text-xs"></i>
                  <span>Password *</span>
                </label>
                <input type="password" [(ngModel)]="regData.password" name="password" required placeholder="Min 6 characters"
                  class="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                <i class="fa-solid fa-location-dot text-slate-400 mr-1 text-xs"></i>
                <span>City / Location</span>
                <span class="text-slate-400 font-normal text-[10px] ml-1.5">(Optional)</span>
              </label>
              <input type="text" [(ngModel)]="regData.city" name="city" placeholder="e.g. Mumbai, Delhi, Lucknow"
                class="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
            </div>

            <!-- Referral Bonus Badge -->
            <div *ngIf="regData.referralCode" class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
              <span class="flex items-center"><i class="fa-solid fa-gift text-emerald-600 mr-2"></i> Referral Applied: <strong>{{ regData.referralCode }}</strong></span>
              <span class="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">+1 Month Free</span>
            </div>

            <button type="submit" [disabled]="loading || sendingOtp"
              class="w-full mt-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-600 text-white font-black text-xs sm:text-sm hover:from-emerald-500 hover:to-brand-500 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2">
              <i *ngIf="sendingOtp" class="fa-solid fa-spinner fa-spin mr-2"></i>
              <i *ngIf="!sendingOtp" class="fa-brands fa-whatsapp text-emerald-200 text-base"></i>
              <span>{{ sendingOtp ? 'Sending WhatsApp OTP...' : 'Verify Mobile & Start 14-Day Free Trial' }}</span>
            </button>

            <!-- Features Included in Trial -->
            <div class="mt-3 grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-1.5 text-xs"></i> 100+ Preloaded Tests</div>
              <div class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-1.5 text-xs"></i> Plain Paper Print</div>
              <div class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-1.5 text-xs"></i> WhatsApp QR Reports</div>
              <div class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-1.5 text-xs"></i> Zero Credit Card</div>
            </div>

            <div class="pt-2 text-center">
              <span class="text-xs text-slate-500">Already have an account? </span>
              <button type="button" (click)="isRegister = false; errorMessage = ''" class="text-xs font-bold text-brand-600 hover:text-brand-700 underline cursor-pointer">
                Sign In &rarr;
              </button>
            </div>
          </form>

          <!-- Mobile / Server Config Bar -->
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span class="flex items-center space-x-1.5 truncate max-w-[220px]" [title]="currentApiUrl">
              <i class="fa-solid fa-server text-slate-400"></i>
              <span>Server: <strong class="text-slate-700 font-mono font-bold">{{ displayServerUrl }}</strong></span>
            </span>
            <button type="button" (click)="openServerModal()" class="text-brand-600 hover:text-brand-700 font-bold hover:underline cursor-pointer shrink-0">
              Change
            </button>
          </div>

        </div>

        <!-- Mobile App 1-Click Install Card -->
        <div class="mt-4 p-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg shadow-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center space-x-3 text-left">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-lg shadow-sm shrink-0">
              <i class="fa-brands fa-android"></i>
            </div>
            <div>
              <div class="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <span>DigitLab Android App</span>
                <span class="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">Official</span>
              </div>
              <div class="text-[11px] text-slate-500">Fast 1-tap direct download for mobile phones (No login needed)</div>
            </div>
          </div>
          <a href="https://github.com/Manish088/DigitalLab/releases/download/v1.0-mobile/DigitLab.apk"
             target="_blank"
             class="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 transition-all cursor-pointer shrink-0">
            <i class="fa-solid fa-download text-xs"></i>
            <span>Download .APK</span>
          </a>
        </div>

        <!-- Server Configuration Modal -->
        <div *ngIf="showServerModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2.5">
                <div class="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-sm">
                  <i class="fa-solid fa-server"></i>
                </div>
                <h3 class="text-sm font-bold text-slate-900 font-heading">Backend Server URL</h3>
              </div>
              <button (click)="showServerModal = false" class="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <p class="text-xs text-slate-500">
              Mobile phone par backend se connect karne ke liye apne laptop ka Wi-Fi IP address ya live server URL enter karein:
            </p>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Server URL</label>
              <input type="text" [(ngModel)]="customServerInput" placeholder="http://10.17.135.22:5000"
                class="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>

            <div class="flex items-center space-x-2 pt-2">
              <button type="button" (click)="saveServerUrl()" class="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer">
                Save & Apply
              </button>
              <button type="button" (click)="resetServerUrl()" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-all cursor-pointer">
                Reset Default
              </button>
            </div>
          </div>
        </div>

        <!-- OTP Verification Modal -->
        <div *ngIf="showOtpModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-8 relative overflow-hidden">
            
            <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-inner mb-4">
              <i class="fa-brands fa-whatsapp"></i>
            </div>

            <h3 class="text-xl font-black text-center text-slate-900 font-heading">Verify Mobile Number</h3>
            <p class="text-xs text-center text-slate-500 mt-1.5 leading-relaxed">
              We sent a 6-digit verification code to <br>
              <strong class="text-slate-800 text-sm font-bold">+91 {{ regData.phone }}</strong>
              <button type="button" (click)="showOtpModal = false" class="text-brand-600 hover:underline text-[11px] ml-1.5 font-semibold cursor-pointer">
                (Change)
              </button>
            </p>

            <!-- Demo OTP Helper Badge (for instant demo/testing) -->
            <div *ngIf="demoOtp" class="mt-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span class="flex items-center">
                <i class="fa-solid fa-key text-amber-500 mr-2"></i>
                <span>Test / Demo OTP:</span>
              </span>
              <span class="font-mono font-black text-sm bg-white px-2 py-0.5 rounded-lg border border-amber-200 tracking-wider">
                {{ demoOtp }}
              </span>
            </div>

            <!-- Alert error inside modal -->
            <div *ngIf="otpError" class="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center">
              <i class="fa-solid fa-circle-exclamation mr-2 text-sm shrink-0"></i>
              <span>{{ otpError }}</span>
            </div>

            <!-- 6-digit OTP input -->
            <div class="mt-5">
              <label class="block text-xs font-bold text-slate-700 mb-1.5 text-center">Enter 6-Digit Code</label>
              <input type="text" [(ngModel)]="enteredOtp" maxlength="6" inputmode="numeric" placeholder="• • • • • •"
                (keyup.enter)="onVerifyAndRegister()"
                class="block w-full text-center text-2xl tracking-[0.5em] font-mono font-black py-3 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
            </div>

            <!-- Action Buttons -->
            <div class="mt-5 space-y-2.5">
              <button type="button" (click)="onVerifyAndRegister()" [disabled]="loading || !enteredOtp || enteredOtp.length < 6"
                class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2">
                <i *ngIf="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
                <i *ngIf="!loading" class="fa-solid fa-rocket text-amber-300"></i>
                <span>{{ loading ? 'Verifying & Setting Up Lab...' : 'Verify OTP & Launch Lab' }}</span>
              </button>

              <!-- Resend Countdown -->
              <div class="text-center pt-1">
                <button *ngIf="otpCountdown === 0" type="button" (click)="resendOtp()" [disabled]="resendingOtp"
                  class="text-xs font-bold text-brand-600 hover:text-brand-700 underline cursor-pointer">
                  {{ resendingOtp ? 'Resending...' : "Didn't receive code? Resend OTP" }}
                </button>
                <span *ngIf="otpCountdown > 0" class="text-xs text-slate-400 font-medium">
                  Resend code in <strong class="text-slate-600 font-bold">{{ otpCountdown }}s</strong>
                </span>
              </div>
            </div>

          </div>
        </div>

        <p class="text-center text-[11px] text-slate-400 mt-6 font-medium">
          DigitalLab Cloud Pathology & LIMS Platform • Secure & ISO Compliant
        </p>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  isRegister = false;
  loading = false;
  sendingOtp = false;
  resendingOtp = false;
  showPassword = false;
  errorMessage = '';

  showOtpModal = false;
  demoOtp = '';
  enteredOtp = '';
  otpError = '';
  otpCountdown = 0;
  private otpTimerInterval: any = null;

  showServerModal = false;
  customServerInput = '';

  get currentApiUrl(): string {
    return environment.apiUrl;
  }

  get displayServerUrl(): string {
    try {
      const urlStr = this.currentApiUrl.startsWith('http') ? this.currentApiUrl : `http://${window.location.host}${this.currentApiUrl}`;
      const u = new URL(urlStr);
      return u.host;
    } catch {
      return this.currentApiUrl;
    }
  }

  openServerModal(): void {
    const raw = localStorage.getItem('DIGITLAB_API_URL') || this.currentApiUrl.replace(/\/api\/?$/, '');
    this.customServerInput = raw;
    this.showServerModal = true;
  }

  saveServerUrl(): void {
    if (this.customServerInput && this.customServerInput.trim()) {
      localStorage.setItem('DIGITLAB_API_URL', this.customServerInput.trim());
    } else {
      localStorage.removeItem('DIGITLAB_API_URL');
    }
    this.showServerModal = false;
    window.location.reload();
  }

  resetServerUrl(): void {
    localStorage.removeItem('DIGITLAB_API_URL');
    this.showServerModal = false;
    window.location.reload();
  }

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
    password: '',
    referralCode: ''
  };

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['ref']) {
        this.regData.referralCode = params['ref'].toString().trim().toUpperCase();
        this.isRegister = true;
        this.cdr.markForCheck();
      }
      if (params['trial'] === 'true' || params['mode'] === 'register') {
        this.isRegister = true;
        this.cdr.markForCheck();
      }
    });

    if (this.router.url.includes('register') || this.router.url.includes('free-trial')) {
      this.isRegister = true;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.clearOtpTimer();
  }

  onLogin() {
    if (!this.loginData.emailOrUsername || !this.loginData.password) {
      this.errorMessage = 'Please enter both email address / mobile number and password.';
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
          this.errorMessage = 'Invalid credentials or account does not exist. Try starting your 14-Day Free Trial.';
        } else {
          this.errorMessage = 'Login failed. Please check your credentials and try again.';
        }
        this.cdr.markForCheck();
      }
    });
  }

  getSanitizedPhone(): string {
    let clean = (this.regData.phone || '').replace(/\D/g, '');
    if (clean.length === 11 && clean.startsWith('0')) clean = clean.substring(1);
    else if (clean.length === 12 && clean.startsWith('91')) clean = clean.substring(2);
    return clean;
  }

  get phoneStatus(): { valid: boolean; text: string; color: string } {
    const p = this.regData.phone;
    if (!p) return { valid: false, text: '', color: '' };
    if (p.length > 0 && !/^[6-9]/.test(p)) {
      return { valid: false, text: 'Must start with 6-9', color: 'text-rose-500 font-bold' };
    }
    if (p.length < 10) {
      return { valid: false, text: `${p.length}/10 digits`, color: 'text-slate-400 font-medium' };
    }
    const uniqueDigits = new Set(p.split('')).size;
    const dummySequences = ['9876543210', '8765432109', '7654321098', '6789012345', '7890123456', '8901234567', '9012345678', '9123456789', '9898989898', '9988776655'];
    if (uniqueDigits < 3 || dummySequences.includes(p)) {
      return { valid: false, text: 'Dummy number', color: 'text-rose-500 font-bold' };
    }
    return { valid: true, text: '✓ Valid Number', color: 'text-emerald-600 font-bold' };
  }

  onPhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let digits = (input.value || '').replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.substring(1);
    } else if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.substring(2);
    }
    if (digits.length > 10) {
      digits = digits.slice(0, 10);
    }
    this.regData.phone = digits;
    input.value = digits;
    this.cdr.markForCheck();
  }

  onInitiateRegister() {
    if (!this.regData.labName?.trim() || !this.regData.ownerName?.trim() || !this.regData.email?.trim() || !this.regData.phone?.trim() || !this.regData.password?.trim()) {
      this.errorMessage = 'Please fill in all required fields (Lab Name, Owner/Doctor Name, Email Address, WhatsApp Number, Password).';
      this.cdr.markForCheck();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.regData.email.trim())) {
      this.errorMessage = 'Please enter a valid email address (e.g. lab@example.com).';
      this.cdr.markForCheck();
      return;
    }

    const cleanPhone = this.getSanitizedPhone();
    if (cleanPhone.length !== 10) {
      this.errorMessage = 'Mobile number must be exactly 10 digits.';
      this.cdr.markForCheck();
      return;
    }

    if (!/^[6-9]/.test(cleanPhone)) {
      this.errorMessage = 'Indian mobile number must start with 6, 7, 8, or 9.';
      this.cdr.markForCheck();
      return;
    }

    const uniqueDigits = new Set(cleanPhone.split('')).size;
    const dummySequences = [
      '9876543210', '8765432109', '7654321098',
      '6789012345', '7890123456', '8901234567', '9012345678',
      '9123456789', '9898989898', '9988776655'
    ];

    if (uniqueDigits < 3 || dummySequences.includes(cleanPhone)) {
      this.errorMessage = 'Please enter a genuine active mobile number (fake or repetitive dummy numbers are not allowed).';
      this.cdr.markForCheck();
      return;
    }

    if (this.regData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      this.cdr.markForCheck();
      return;
    }

    this.sendingOtp = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.authService.sendOtp(cleanPhone).subscribe({
      next: (res) => {
        this.sendingOtp = false;
        this.demoOtp = res.demoOtp || '';
        this.enteredOtp = '';
        this.otpError = '';
        this.showOtpModal = true;
        this.startOtpCountdown(30);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.sendingOtp = false;
        if (err.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please ensure backend is running.';
        } else if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Failed to send OTP to mobile. Please try again.';
        }
        this.cdr.markForCheck();
      }
    });
  }

  onVerifyAndRegister() {
    const code = (this.enteredOtp || '').trim();
    if (!code || code.length !== 6) {
      this.otpError = 'Please enter the complete 6-digit OTP code.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.otpError = '';
    this.cdr.markForCheck();

    const cleanPhone = this.getSanitizedPhone();
    const payload = {
      labName: this.regData.labName.trim(),
      ownerName: this.regData.ownerName.trim(),
      email: this.regData.email.trim().toLowerCase(),
      phone: cleanPhone,
      city: this.regData.city?.trim() || null,
      password: this.regData.password,
      referralCode: this.regData.referralCode?.trim() || null,
      otp: code
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.showOtpModal = false;
        this.clearOtpTimer();
        this.cdr.markForCheck();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 0) {
          this.otpError = 'Unable to connect to server. Please ensure backend is running.';
        } else if (err.error?.message) {
          this.otpError = err.error.message;
        } else {
          this.otpError = 'Registration failed. Please check the code and try again.';
        }
        this.cdr.markForCheck();
      }
    });
  }

  resendOtp() {
    const cleanPhone = this.getSanitizedPhone();
    if (!cleanPhone || cleanPhone.length !== 10) return;

    this.resendingOtp = true;
    this.otpError = '';
    this.cdr.markForCheck();

    this.authService.sendOtp(cleanPhone).subscribe({
      next: (res) => {
        this.resendingOtp = false;
        this.demoOtp = res.demoOtp || '';
        this.startOtpCountdown(30);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.resendingOtp = false;
        this.otpError = err.error?.message || 'Failed to resend code. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  startOtpCountdown(seconds: number) {
    this.clearOtpTimer();
    this.otpCountdown = seconds;
    this.otpTimerInterval = setInterval(() => {
      if (this.otpCountdown > 0) {
        this.otpCountdown--;
        this.cdr.markForCheck();
      } else {
        this.clearOtpTimer();
      }
    }, 1000);
  }

  clearOtpTimer() {
    if (this.otpTimerInterval) {
      clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = null;
    }
  }
}
