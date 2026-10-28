import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Background Decorative Blobs -->
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 px-4 sm:px-0">
        <a routerLink="/" class="inline-flex items-center justify-center space-x-2.5 mb-2 hover:opacity-90 transition-all">
          <img src="logo.png" alt="DigitalLab" class="w-14 h-14 rounded-xl object-contain">
        </a>
        <h2 class="text-3xl font-black text-slate-900 tracking-tight font-heading">DigitalLab LIMS</h2>
        <p class="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">Cloud Pathology & Diagnostic Laboratory Management System</p>
      </div>

      <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div class="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200/80">
          
          <!-- Mode Tabs: Sign In / Register -->
          <div class="flex border-b border-slate-200 mb-6 text-xs sm:text-sm font-bold">
            <button type="button" (click)="isRegister = false; errorMessage = ''" 
              [class]="!isRegister ? 'border-b-2 border-brand-600 text-brand-700 font-extrabold pb-3' : 'text-slate-400 hover:text-slate-600 pb-3'" 
              class="flex-1 text-center transition-all cursor-pointer">
              Sign In
            </button>
            <button type="button" (click)="isRegister = true; errorMessage = ''" 
              [class]="isRegister ? 'border-b-2 border-emerald-600 text-emerald-700 font-extrabold pb-3' : 'text-slate-400 hover:text-slate-600 pb-3'" 
              class="flex-1 text-center transition-all cursor-pointer">
              Register
            </button>
          </div>

          <!-- Alert Success Message -->
          <div *ngIf="successMessage" class="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2 animate-in fade-in duration-200">
            <i class="fa-solid fa-circle-check text-emerald-600 text-sm mt-0.5 shrink-0"></i>
            <span class="leading-relaxed">{{ successMessage }}</span>
          </div>

          <!-- Alert Error Message -->
          <div *ngIf="errorMessage" class="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-sm animate-in fade-in duration-200">
            <div class="flex items-center justify-between space-x-2">
              <div class="flex items-center space-x-2 min-w-0">
                <i class="fa-solid fa-circle-exclamation text-rose-600 text-sm shrink-0"></i>
                <span class="font-bold text-rose-900 truncate">{{ errorMessage }}</span>
              </div>
              <button *ngIf="isAlreadyRegisteredError && isRegister" type="button" (click)="switchToSignIn()" class="shrink-0 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow transition-all cursor-pointer inline-flex items-center space-x-1">
                <span>Sign In</span>
                <i class="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          </div>

          <!-- Sign In Form (Email Only) -->
          <form *ngIf="!isRegister" (ngSubmit)="onLogin()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                <i class="fa-solid fa-envelope text-slate-400 mr-1.5 text-xs"></i>
                <span>Email Address</span>
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i class="fa-solid fa-at text-xs"></i>
                </div>
                <input type="email" [(ngModel)]="loginData.emailOrUsername" name="email" required placeholder="Enter your registered email address"
                  class="block w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-xs sm:text-sm font-semibold transition-all">
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-bold text-slate-700">Password</label>
                <button type="button" (click)="openForgotPassword()" class="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer">
                  Forgot Password?
                </button>
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
                Register Here &rarr;
              </button>
            </div>
          </form>

          <!-- Clean Simple Register Form -->
          <form *ngIf="isRegister" (ngSubmit)="onInitiateRegister()" class="space-y-3.5">
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
              <input type="email" [(ngModel)]="regData.email" (blur)="onEmailBlur()" (change)="onEmailBlur()" (input)="onEmailInput()" name="email" required placeholder="e.g. yourname@gmail.com"
                [class.border-rose-400]="emailAlreadyRegistered"
                [class.bg-rose-50]="emailAlreadyRegistered"
                class="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
              <p *ngIf="emailAlreadyRegistered" class="mt-1 text-[11px] font-semibold text-rose-600 flex items-center">
                <i class="fa-solid fa-circle-exclamation mr-1 text-[10px]"></i> Email already registered.
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span class="flex items-center">
                    <i class="fa-brands fa-whatsapp text-emerald-600 mr-1 text-sm"></i>
                    <span>WhatsApp Number *</span>
                  </span>
                  <span *ngIf="!phoneAlreadyRegistered && regData.phone" [class]="phoneStatus.color" class="text-[10px] font-bold">
                    {{ phoneStatus.text }}
                  </span>
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                    +91
                  </div>
                  <input type="tel" [(ngModel)]="regData.phone" (input)="onPhoneInput($event)" name="phone" required placeholder="10-digit number" maxlength="10" inputmode="numeric"
                    [class.border-rose-400]="phoneAlreadyRegistered"
                    [class.bg-rose-50]="phoneAlreadyRegistered"
                    class="block w-full pl-11 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
                </div>
                <p *ngIf="phoneAlreadyRegistered" class="mt-1 text-[11px] font-semibold text-rose-600 flex items-center">
                  <i class="fa-solid fa-circle-exclamation mr-1 text-[10px]"></i> Mobile number already registered.
                </p>
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
            </div>

            <!-- Referral Bonus Badge -->
            <div *ngIf="regData.referralCode" class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
              <span class="flex items-center"><i class="fa-solid fa-gift text-emerald-600 mr-2"></i> Referral Applied: <strong>{{ regData.referralCode }}</strong></span>
              <span class="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">+1 Month Free</span>
            </div>

            <button type="submit" [disabled]="loading || sendingOtp"
              class="w-full mt-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-600 text-white font-extrabold text-xs sm:text-sm hover:from-emerald-500 hover:to-brand-500 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2">
              <i *ngIf="sendingOtp" class="fa-solid fa-spinner fa-spin mr-2"></i>
              <i *ngIf="!sendingOtp" class="fa-solid fa-user-plus text-emerald-200 text-base"></i>
              <span>{{ sendingOtp ? 'Sending Verification OTP...' : 'Register Lab' }}</span>
            </button>

            <div class="pt-2 text-center">
              <span class="text-xs text-slate-500">Already have an account? </span>
              <button type="button" (click)="isRegister = false; errorMessage = ''" class="text-xs font-bold text-brand-600 hover:text-brand-700 underline cursor-pointer">
                Sign In &rarr;
              </button>
            </div>
          </form>

        </div>

        <!-- Registration OTP Verification Modal -->
        <div *ngIf="showOtpModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-8 relative overflow-hidden">
            
            <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-inner mb-4">
              <i class="fa-solid fa-envelope-circle-check"></i>
            </div>

            <h3 class="text-xl font-black text-center text-slate-900 font-heading">Verify Your Email</h3>
            <p class="text-xs text-center text-slate-500 mt-1.5 leading-relaxed">
              We sent a 6-digit verification code to <br>
              <strong class="text-slate-800 text-sm font-bold font-mono">{{ regData.email }}</strong>
              <button type="button" (click)="showOtpModal = false" class="text-brand-600 hover:underline text-[11px] ml-1.5 font-semibold cursor-pointer">
                (Change)
              </button>
            </p>

            <!-- Email Sent Notification Badge (No OTP displayed) -->
            <div class="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5 shadow-sm">
              <i class="fa-solid fa-circle-check text-emerald-600 text-base mt-0.5 shrink-0"></i>
              <div class="leading-relaxed">
                <span class="font-bold block text-emerald-900 text-xs">OTP Sent to Email</span>
                <span>A 6-digit verification code has been sent to your email. Please check your inbox or spam folder.</span>
              </div>
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

        <!-- First-Time Login Change Password Modal -->
        <div *ngIf="showFirstLoginChangeModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-8 relative overflow-hidden">
            
            <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl shadow-inner mb-3">
              <i class="fa-solid fa-lock-open"></i>
            </div>

            <h3 class="text-xl font-black text-center text-slate-900 font-heading">Change Default Password</h3>
            <p class="text-xs text-center text-slate-500 mt-1.5 leading-relaxed">
              Welcome to <strong>DigitalLab LIMS</strong>!<br>
              Since you logged in with a default password, please create your new personal password to activate your account.
            </p>

            <!-- Alert error inside first-login modal -->
            <div *ngIf="firstLoginError" class="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center">
              <i class="fa-solid fa-circle-exclamation mr-2 text-sm shrink-0"></i>
              <span>{{ firstLoginError }}</span>
            </div>

            <div class="mt-4 space-y-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">New Personal Password *</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i class="fa-solid fa-lock text-xs"></i>
                  </div>
                  <input [type]="firstLoginShowPassword ? 'text' : 'password'" [(ngModel)]="firstLoginNewPassword" placeholder="Minimum 6 characters"
                    class="block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
                  <button type="button" (click)="firstLoginShowPassword = !firstLoginShowPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                    <i class="fa-solid" [ngClass]="firstLoginShowPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i class="fa-solid fa-lock text-xs"></i>
                  </div>
                  <input [type]="firstLoginShowPassword ? 'text' : 'password'" [(ngModel)]="firstLoginConfirmPassword" placeholder="Re-enter new password"
                    (keyup.enter)="onSubmitFirstLoginPassword()"
                    class="block w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
                </div>
              </div>

              <button type="button" (click)="onSubmitFirstLoginPassword()" [disabled]="firstLoginLoading || !firstLoginNewPassword || !firstLoginConfirmPassword"
                class="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-600 text-white font-extrabold text-xs sm:text-sm hover:from-emerald-500 hover:to-brand-500 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2">
                <i *ngIf="firstLoginLoading" class="fa-solid fa-spinner fa-spin mr-2"></i>
                <i *ngIf="!firstLoginLoading" class="fa-solid fa-circle-check"></i>
                <span>{{ firstLoginLoading ? 'Updating Password...' : 'Save Password & Go to Dashboard' }}</span>
              </button>
            </div>

          </div>
        </div>

        <!-- Forgot Password Modal -->
        <div *ngIf="showForgotModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-8 relative overflow-hidden">
            
            <!-- Close button -->
            <button type="button" (click)="closeForgotPassword()" class="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>

            <!-- Icon Header -->
            <div class="w-14 h-14 mx-auto rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-2xl shadow-inner mb-3">
              <i class="fa-solid fa-key" *ngIf="forgotStep === 'input'"></i>
              <i class="fa-solid fa-shield-halved" *ngIf="forgotStep === 'otp'"></i>
              <i class="fa-solid fa-lock" *ngIf="forgotStep === 'new-password'"></i>
              <i class="fa-solid fa-circle-check text-emerald-500" *ngIf="forgotStep === 'success'"></i>
            </div>

            <h3 class="text-xl font-black text-center text-slate-900 font-heading">
              <span *ngIf="forgotStep === 'input'">Reset Password</span>
              <span *ngIf="forgotStep === 'otp'">Verify OTP</span>
              <span *ngIf="forgotStep === 'new-password'">Set New Password</span>
              <span *ngIf="forgotStep === 'success'">Password Reset!</span>
            </h3>

            <!-- Step Progress Indicator -->
            <div *ngIf="forgotStep !== 'success'" class="flex items-center justify-center space-x-2 my-3">
              <div class="flex items-center space-x-1.5 text-[11px] font-bold">
                <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                      [ngClass]="forgotStep === 'input' ? 'bg-brand-600 text-white' : 'bg-emerald-100 text-emerald-700'">1</span>
                <span [ngClass]="forgotStep === 'input' ? 'text-brand-700' : 'text-slate-400'">Account</span>
              </div>
              <div class="w-6 h-0.5 bg-slate-200"></div>
              <div class="flex items-center space-x-1.5 text-[11px] font-bold">
                <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                      [ngClass]="forgotStep === 'otp' ? 'bg-brand-600 text-white' : (forgotStep === 'new-password' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400')">2</span>
                <span [ngClass]="forgotStep === 'otp' ? 'text-brand-700' : 'text-slate-400'">OTP</span>
              </div>
              <div class="w-6 h-0.5 bg-slate-200"></div>
              <div class="flex items-center space-x-1.5 text-[11px] font-bold">
                <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                      [ngClass]="forgotStep === 'new-password' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'">3</span>
                <span [ngClass]="forgotStep === 'new-password' ? 'text-brand-700' : 'text-slate-400'">Reset</span>
              </div>
            </div>

            <!-- Error Banner -->
            <div *ngIf="forgotErrorMessage" class="mt-2 mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center animate-in fade-in">
              <i class="fa-solid fa-circle-exclamation mr-2 text-sm shrink-0"></i>
              <span>{{ forgotErrorMessage }}</span>
            </div>

            <!-- STEP 1: Enter Email -->
            <div *ngIf="forgotStep === 'input'" class="space-y-4">
              <p class="text-xs text-center text-slate-500 leading-relaxed">
                Enter your registered <strong>Email Address</strong>. We will send an OTP to your email to verify your identity.
              </p>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <i class="fa-solid fa-envelope text-slate-400 mr-1.5 text-xs"></i>
                  <span>Registered Email Address</span>
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i class="fa-solid fa-at text-xs"></i>
                  </div>
                  <input type="email" [(ngModel)]="forgotEmailOrPhone" placeholder="e.g. yourname@gmail.com"
                    (keyup.enter)="onForgotSendOtp()"
                    class="block w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
                </div>
              </div>

              <button type="button" (click)="onForgotSendOtp()" [disabled]="forgotLoading || !forgotEmailOrPhone"
                class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-sky-600 text-white font-extrabold text-xs sm:text-sm hover:from-brand-500 hover:to-sky-500 transition-all shadow-lg shadow-brand-600/25 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2">
                <i *ngIf="forgotLoading" class="fa-solid fa-spinner fa-spin mr-2"></i>
                <i *ngIf="!forgotLoading" class="fa-solid fa-paper-plane"></i>
                <span>{{ forgotLoading ? 'Sending OTP...' : 'Send OTP to Email' }}</span>
              </button>

              <div class="text-center pt-2">
                <button type="button" (click)="closeForgotPassword()" class="text-xs font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer">
                  Back to Sign In
                </button>
              </div>
            </div>

            <!-- STEP 2: Enter OTP -->
            <div *ngIf="forgotStep === 'otp'" class="space-y-4">
              <p class="text-xs text-center text-slate-500 leading-relaxed">
                We sent a 6-digit verification code to:<br>
                <strong class="text-slate-800 text-sm font-bold font-mono">{{ forgotMaskedEmail }}</strong>
                <button type="button" (click)="forgotStep = 'input'; forgotErrorMessage = ''" class="text-brand-600 hover:underline text-[11px] ml-1.5 font-semibold cursor-pointer">
                  (Change)
                </button>
              </p>

              <!-- Email Sent Notification Badge -->
              <div class="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start space-x-2.5 shadow-sm">
                <i class="fa-solid fa-circle-check text-blue-600 text-base mt-0.5 shrink-0"></i>
                <div class="leading-relaxed">
                  <span class="font-bold block text-blue-900 text-xs">OTP Sent to Email</span>
                  <span>A 6-digit password reset code has been sent to your registered email. Please check your inbox or spam folder.</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5 text-center">Enter 6-Digit Code</label>
                <input type="text" [(ngModel)]="forgotOtp" maxlength="6" inputmode="numeric" placeholder="• • • • • •"
                  (keyup.enter)="onForgotVerifyOtp()"
                  class="block w-full text-center text-2xl tracking-[0.5em] font-mono font-black py-3 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all">
              </div>

              <button type="button" (click)="onForgotVerifyOtp()" [disabled]="forgotLoading || forgotOtp.length < 6"
                class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-sky-600 text-white font-extrabold text-xs sm:text-sm hover:from-brand-500 hover:to-sky-500 transition-all shadow-lg shadow-brand-600/25 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2">
                <i *ngIf="forgotLoading" class="fa-solid fa-spinner fa-spin mr-2"></i>
                <i *ngIf="!forgotLoading" class="fa-solid fa-check"></i>
                <span>{{ forgotLoading ? 'Verifying...' : 'Verify OTP' }}</span>
              </button>

              <!-- Resend countdown -->
              <div class="text-center pt-1">
                <button *ngIf="forgotCountdown === 0" type="button" (click)="onForgotResendOtp()" [disabled]="forgotLoading"
                  class="text-xs font-bold text-brand-600 hover:text-brand-700 underline cursor-pointer">
                  Didn't receive email? Resend OTP
                </button>
                <span *ngIf="forgotCountdown > 0" class="text-xs text-slate-400 font-medium">
                  Resend code in <strong class="text-slate-600 font-bold">{{ forgotCountdown }}s</strong>
                </span>
              </div>
            </div>

            <!-- STEP 3: Set New Password -->
            <div *ngIf="forgotStep === 'new-password'" class="space-y-3.5">
              <p class="text-xs text-center text-slate-500 leading-relaxed">
                OTP verified successfully! Now choose a strong new password for your account.
              </p>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i class="fa-solid fa-lock text-xs"></i>
                  </div>
                  <input [type]="forgotShowNewPassword ? 'text' : 'password'" [(ngModel)]="forgotNewPassword" placeholder="Min 6 characters"
                    class="block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
                  <button type="button" (click)="forgotShowNewPassword = !forgotShowNewPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                    <i class="fa-solid" [ngClass]="forgotShowNewPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i class="fa-solid fa-lock text-xs"></i>
                  </div>
                  <input [type]="forgotShowNewPassword ? 'text' : 'password'" [(ngModel)]="forgotConfirmPassword" placeholder="Re-enter new password"
                    (keyup.enter)="onForgotResetPassword()"
                    class="block w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold transition-all">
                </div>
              </div>

              <button type="button" (click)="onForgotResetPassword()" [disabled]="forgotLoading || !forgotNewPassword || !forgotConfirmPassword"
                class="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs sm:text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2">
                <i *ngIf="forgotLoading" class="fa-solid fa-spinner fa-spin mr-2"></i>
                <i *ngIf="!forgotLoading" class="fa-solid fa-floppy-disk"></i>
                <span>{{ forgotLoading ? 'Updating Password...' : 'Save New Password & Sign In' }}</span>
              </button>
            </div>

            <!-- STEP 4: Success Message -->
            <div *ngIf="forgotStep === 'success'" class="space-y-4 text-center py-2">
              <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-medium leading-relaxed">
                {{ forgotSuccessMessage || 'Your password has been reset successfully! You can now sign in with your new password.' }}
              </div>

              <button type="button" (click)="closeForgotPassword()"
                class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-sky-600 text-white font-extrabold text-xs sm:text-sm hover:from-brand-500 transition-all shadow-lg shadow-brand-600/25 cursor-pointer">
                Proceed to Sign In &rarr;
              </button>
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
  successMessage = '';

  // Real-time duplicate registration checks
  emailAlreadyRegistered = false;
  phoneAlreadyRegistered = false;

  get isAlreadyRegisteredError(): boolean {
    return !!this.errorMessage && (
      this.errorMessage.toLowerCase().includes('already registered') ||
      this.errorMessage.toLowerCase().includes('already user register')
    );
  }

  switchToSignIn(): void {
    this.isRegister = false;
    this.errorMessage = '';
    if (this.regData.email) {
      this.loginData.emailOrUsername = this.regData.email.trim().toLowerCase();
    }
    this.cdr.markForCheck();
  }

  onEmailInput(): void {
    this.emailAlreadyRegistered = false;
    if (this.isAlreadyRegisteredError && !this.phoneAlreadyRegistered) {
      this.errorMessage = '';
    }
  }

  onEmailBlur(): void {
    const email = (this.regData.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.emailAlreadyRegistered = false;
      return;
    }

    this.authService.checkUserExists(email, undefined).subscribe({
      next: (res) => {
        this.emailAlreadyRegistered = res.emailExists;
        if (res.emailExists) {
          this.errorMessage = res.message || 'Email address already registered.';
        } else if (!this.phoneAlreadyRegistered && this.isAlreadyRegisteredError) {
          this.errorMessage = '';
        }
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  // First Login Change Password State
  showFirstLoginChangeModal = false;
  firstLoginOldPassword = '';
  firstLoginNewPassword = '';
  firstLoginConfirmPassword = '';
  firstLoginShowPassword = false;
  firstLoginLoading = false;
  firstLoginError = '';
  tempLoginResponse: any = null;

  showOtpModal = false;
  demoOtp = '';
  enteredOtp = '';
  otpError = '';
  otpCountdown = 0;
  private otpTimerInterval: any = null;

  showServerModal = false;
  customServerInput = '';

  // Forgot Password State
  showForgotModal = false;
  forgotStep: 'input' | 'otp' | 'new-password' | 'success' = 'input';
  forgotEmailOrPhone = '';
  forgotUserId = '';
  forgotMaskedEmail = '';
  forgotDemoOtp = '';
  forgotOtp = '';
  forgotNewPassword = '';
  forgotConfirmPassword = '';
  forgotShowNewPassword = false;
  forgotLoading = false;
  forgotErrorMessage = '';
  forgotSuccessMessage = '';
  forgotCountdown = 0;
  private forgotTimerInterval: any = null;

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
    this.clearForgotTimer();
    this.clearOtpTimer();
  }

  onLogin() {
    if (!this.loginData.emailOrUsername || !this.loginData.password) {
      this.errorMessage = 'Please enter both your registered email address and password.';
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

        if (res.mustChangePassword) {
          this.tempLoginResponse = res;
          this.firstLoginOldPassword = this.loginData.password;
          this.firstLoginNewPassword = '';
          this.firstLoginConfirmPassword = '';
          this.firstLoginError = '';
          this.showFirstLoginChangeModal = true;
          this.cdr.markForCheck();
          return;
        }

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
          this.errorMessage = 'Invalid email or password. Please verify and try again.';
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
    this.regData.phone = digits;
    input.value = digits;
    this.phoneAlreadyRegistered = false;

    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      this.authService.checkUserExists(undefined, digits).subscribe({
        next: (res) => {
          this.phoneAlreadyRegistered = res.phoneExists;
          if (res.phoneExists) {
            this.errorMessage = res.message || 'Mobile number already registered.';
          } else if (!this.emailAlreadyRegistered && this.isAlreadyRegisteredError) {
            this.errorMessage = '';
          }
          this.cdr.markForCheck();
        },
        error: () => {}
      });
    } else {
      this.phoneAlreadyRegistered = false;
      if (!this.emailAlreadyRegistered && this.isAlreadyRegisteredError) {
        this.errorMessage = '';
      }
    }
    this.cdr.markForCheck();
  }

  onInitiateRegister() {
    if (!this.regData.labName?.trim() || !this.regData.ownerName?.trim() || !this.regData.email?.trim() || !this.regData.phone?.trim()) {
      this.errorMessage = 'Please fill in all required fields (Lab Name, Owner/Doctor Name, Email Address, WhatsApp Number).';
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

    if (this.emailAlreadyRegistered || this.phoneAlreadyRegistered) {
      this.errorMessage = (this.emailAlreadyRegistered && this.phoneAlreadyRegistered)
        ? 'Email and mobile number already registered.'
        : this.emailAlreadyRegistered
          ? 'Email address already registered.'
          : 'Mobile number already registered.';
      this.cdr.markForCheck();
      return;
    }

    this.sendingOtp = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.authService.sendOtp(cleanPhone, this.regData.email?.trim().toLowerCase(), this.regData.ownerName?.trim()).subscribe({
      next: (res) => {
        this.sendingOtp = false;
        this.demoOtp = '';
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
          if (err.error?.emailRegistered) this.emailAlreadyRegistered = true;
          if (err.error?.phoneRegistered) this.phoneAlreadyRegistered = true;
          if (err.error?.alreadyRegistered) {
            if (this.errorMessage.includes('email') && !this.errorMessage.includes('mobile')) this.emailAlreadyRegistered = true;
            if (this.errorMessage.includes('mobile') && !this.errorMessage.includes('email')) this.phoneAlreadyRegistered = true;
            if (this.errorMessage.includes('Both') || (this.errorMessage.includes('email') && this.errorMessage.includes('mobile'))) {
              this.emailAlreadyRegistered = true;
              this.phoneAlreadyRegistered = true;
            }
          }
        } else {
          this.errorMessage = 'Failed to send OTP to email. Please try again.';
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
      password: null,
      referralCode: this.regData.referralCode?.trim() || null,
      otp: code
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.showOtpModal = false;
        this.clearOtpTimer();
        this.authService.logout();
        this.isRegister = false;
        this.loginData.emailOrUsername = this.regData.email.trim().toLowerCase();
        this.loginData.password = '';
        this.successMessage = `🎉 Account created successfully! A temporary login password has been sent to ${this.regData.email}. Please check your email inbox and sign in.`;
        this.errorMessage = '';
        this.cdr.markForCheck();
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

    this.authService.sendOtp(cleanPhone, this.regData.email?.trim().toLowerCase()).subscribe({
      next: (res) => {
        this.resendingOtp = false;
        this.demoOtp = '';
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

  onSubmitFirstLoginPassword(): void {
    if (!this.firstLoginNewPassword || this.firstLoginNewPassword.length < 6) {
      this.firstLoginError = 'New password must be at least 6 characters.';
      this.cdr.markForCheck();
      return;
    }

    if (this.firstLoginNewPassword !== this.firstLoginConfirmPassword) {
      this.firstLoginError = 'Passwords do not match. Please re-enter identical passwords.';
      this.cdr.markForCheck();
      return;
    }

    this.firstLoginLoading = true;
    this.firstLoginError = '';
    this.cdr.markForCheck();

    this.authService.changePassword(this.firstLoginOldPassword, this.firstLoginNewPassword).subscribe({
      next: () => {
        this.firstLoginLoading = false;
        this.showFirstLoginChangeModal = false;
        this.cdr.markForCheck();

        if (this.tempLoginResponse?.role === 'SuperAdmin') {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.firstLoginLoading = false;
        this.firstLoginError = err.error?.message || 'Failed to update password. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  openForgotPassword(): void {
    this.forgotEmailOrPhone = (this.loginData.emailOrUsername || '').trim();
    this.forgotStep = 'input';
    this.forgotErrorMessage = '';
    this.forgotSuccessMessage = '';
    this.forgotOtp = '';
    this.forgotNewPassword = '';
    this.forgotConfirmPassword = '';
    this.forgotDemoOtp = '';
    this.forgotShowNewPassword = false;
    this.showForgotModal = true;
    this.cdr.markForCheck();
  }

  closeForgotPassword(): void {
    this.showForgotModal = false;
    this.clearForgotTimer();
    this.cdr.markForCheck();
  }

  onForgotSendOtp(): void {
    const input = (this.forgotEmailOrPhone || '').trim();
    if (!input) {
      this.forgotErrorMessage = 'Please enter your registered email address.';
      this.cdr.markForCheck();
      return;
    }

    this.forgotLoading = true;
    this.forgotErrorMessage = '';
    this.cdr.markForCheck();

    this.authService.forgotPasswordSendOtp(input).subscribe({
      next: (res) => {
        this.forgotLoading = false;
        this.forgotUserId = res.userId;
        this.forgotMaskedEmail = res.maskedEmail || input;
        this.forgotDemoOtp = '';
        this.forgotStep = 'otp';
        this.forgotOtp = '';
        this.startForgotCountdown(60);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.forgotLoading = false;
        if (err.status === 0) {
          this.forgotErrorMessage = 'Cannot connect to server. Please check if backend is running.';
        } else if (err.error?.message) {
          this.forgotErrorMessage = err.error.message;
        } else {
          this.forgotErrorMessage = 'Account not found. Please verify your email address.';
        }
        this.cdr.markForCheck();
      }
    });
  }

  onForgotVerifyOtp(): void {
    const otp = (this.forgotOtp || '').trim();
    if (!otp || otp.length < 6) {
      this.forgotErrorMessage = 'Please enter the 6-digit code received on your email.';
      this.cdr.markForCheck();
      return;
    }

    this.forgotLoading = true;
    this.forgotErrorMessage = '';
    this.cdr.markForCheck();

    this.authService.forgotPasswordVerifyOtp(this.forgotUserId, otp).subscribe({
      next: () => {
        this.forgotLoading = false;
        this.forgotStep = 'new-password';
        this.forgotErrorMessage = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotErrorMessage = err.error?.message || 'Invalid or expired OTP. Please enter the correct code.';
        this.cdr.markForCheck();
      }
    });
  }

  onForgotResetPassword(): void {
    if (!this.forgotNewPassword || this.forgotNewPassword.length < 6) {
      this.forgotErrorMessage = 'New password must be at least 6 characters long.';
      this.cdr.markForCheck();
      return;
    }

    if (this.forgotNewPassword !== this.forgotConfirmPassword) {
      this.forgotErrorMessage = 'Passwords do not match. Please re-enter identical passwords.';
      this.cdr.markForCheck();
      return;
    }

    this.forgotLoading = true;
    this.forgotErrorMessage = '';
    this.cdr.markForCheck();

    this.authService.forgotPasswordReset(this.forgotUserId, this.forgotOtp, this.forgotNewPassword).subscribe({
      next: (res) => {
        this.forgotLoading = false;
        this.forgotStep = 'success';
        this.forgotSuccessMessage = res.message || 'Your password has been reset successfully!';
        this.loginData.emailOrUsername = this.forgotEmailOrPhone;
        this.loginData.password = '';
        this.clearForgotTimer();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotErrorMessage = err.error?.message || 'Failed to reset password. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  onForgotResendOtp(): void {
    this.onForgotSendOtp();
  }

  startForgotCountdown(seconds: number): void {
    this.clearForgotTimer();
    this.forgotCountdown = seconds;
    this.forgotTimerInterval = setInterval(() => {
      if (this.forgotCountdown > 0) {
        this.forgotCountdown--;
        this.cdr.markForCheck();
      } else {
        this.clearForgotTimer();
      }
    }, 1000);
  }

  clearForgotTimer(): void {
    if (this.forgotTimerInterval) {
      clearInterval(this.forgotTimerInterval);
      this.forgotTimerInterval = null;
    }
  }

  clearOtpTimer() {
    if (this.otpTimerInterval) {
      clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = null;
    }
  }
}
