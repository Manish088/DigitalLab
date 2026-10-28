import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SubscriptionPlan } from '../../core/models/lims.models';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-brand-500 selection:text-white flex flex-col justify-between">
      
      <!-- Top Navigation -->
      <header class="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          
          <!-- Logo -->
          <a routerLink="/home" class="flex items-center space-x-2.5">
            <img src="logo.png" alt="DigitalLab" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain shadow-sm">
            <div>
              <span class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">DigitalLab</span>
              <span class="hidden sm:inline-block text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full ml-2 border border-brand-200">Cloud LIMS</span>
            </div>
          </a>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <a href="#features" class="hover:text-brand-600 transition-colors">Features</a>
            <a href="#how-it-works" class="hover:text-brand-600 transition-colors">How It Works</a>
            <a href="#pricing" class="hover:text-brand-600 transition-colors">Pricing</a>
            <a href="https://wa.me/917706087066" target="_blank" class="hover:text-emerald-600 transition-colors flex items-center">
              <i class="fa-brands fa-whatsapp text-emerald-500 mr-1.5 text-sm"></i> Help
            </a>
          </div>

          <!-- Buttons -->
          <div class="flex items-center space-x-2.5">
            <a routerLink="/login" class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
              Login
            </a>
            <a routerLink="/register" class="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-black bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 transition-all flex items-center space-x-1.5">
              <i class="fa-solid fa-bolt text-amber-300"></i>
              <span>Free Trial</span>
            </a>
          </div>
        </div>
      </header>

      <!-- Main Body -->
      <main>
        
        <!-- Hero Section -->
        <section class="py-12 sm:py-20 text-center px-4 max-w-4xl mx-auto space-y-6">
          <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Simple Cloud Pathology Software for Diagnostic Labs</span>
          </div>

          <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight font-heading">
            Simple, Fast & Reliable Software for Your Pathology Lab
          </h1>

          <p class="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Manage patient registration, print thermal barcode stickers, generate reports on plain A4 paper, and send PDFs directly to patient WhatsApp with online QR verification.
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a routerLink="/register" class="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-black bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2">
              <i class="fa-solid fa-rocket text-amber-300"></i>
              <span>Start 14-Day Free Trial</span>
            </a>
            <a href="https://wa.me/917706087066?text=Hello%20DigitalLab%2C%20I%20want%20a%20demo%20of%20the%20Pathology%20Software" target="_blank"
              class="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition-all flex items-center justify-center space-x-2">
              <i class="fa-brands fa-whatsapp text-emerald-600 text-base"></i>
              <span>WhatsApp Demo</span>
            </a>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-semibold pt-2">
            <span>✓ 14-Day Free Trial</span>
            <span>•</span>
            <span>✓ 1-Minute Setup</span>
            <span>•</span>
            <span>✓ No Credit Card Needed</span>
            <span>•</span>
            <span>✓ Preloaded 100+ Tests</span>
          </div>
        </section>

        <!-- Key Features Grid (Simple 6 Cards) -->
        <section id="features" class="py-12 sm:py-16 bg-white border-y border-slate-200">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
            
            <div class="text-center space-y-2 max-w-2xl mx-auto">
              <h2 class="text-2xl sm:text-3xl font-black text-slate-900 font-heading">Everything Your Lab Needs</h2>
              <p class="text-xs sm:text-sm text-slate-500">Built specifically for Indian pathology laboratories and collection centres.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              <!-- 1 -->
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-brand-300 transition-all">
                <div class="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center text-lg font-bold">
                  <i class="fa-solid fa-id-card-clip"></i>
                </div>
                <h3 class="font-bold text-slate-900 text-base font-heading">10-Second Patient Intake</h3>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Search patients by mobile number, auto-generate UHID, select preloaded tests (CBC, LFT, KFT), and collect cash or UPI.
                </p>
              </div>

              <!-- 2 -->
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-brand-300 transition-all">
                <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg font-bold">
                  <i class="fa-solid fa-barcode"></i>
                </div>
                <h3 class="font-bold text-slate-900 text-base font-heading">Barcode Tube Stickers</h3>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Print 50x25mm thermal stickers for EDTA, Serum, and Fluoride tubes. Never mix up patient blood samples again.
                </p>
              </div>

              <!-- 3 -->
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-brand-300 transition-all">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold">
                  <i class="fa-solid fa-file-invoice"></i>
                </div>
                <h3 class="font-bold text-slate-900 text-base font-heading">Plain A4 Paper Printing</h3>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Print clean reports on plain A4 paper with your lab logo and doctor signature. Save ₹3,000+ monthly on pre-printed pads.
                </p>
              </div>

              <!-- 4 -->
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-brand-300 transition-all">
                <div class="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center text-lg font-bold">
                  <i class="fa-brands fa-whatsapp"></i>
                </div>
                <h3 class="font-bold text-slate-900 text-base font-heading">Instant WhatsApp Delivery</h3>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Send PDF reports directly to the patient's WhatsApp with online QR verification. Zero SMS recharge costs.
                </p>
              </div>

              <!-- 5 -->
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-brand-300 transition-all">
                <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg font-bold">
                  <i class="fa-solid fa-user-doctor"></i>
                </div>
                <h3 class="font-bold text-slate-900 text-base font-heading">Doctor Referral Commission</h3>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Calculate referring doctor shares automatically and print official signed settlement vouchers with 1 click.
                </p>
              </div>

              <!-- 6 -->
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-brand-300 transition-all">
                <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg font-bold">
                  <i class="fa-solid fa-cash-register"></i>
                </div>
                <h3 class="font-bold text-slate-900 text-base font-heading">Daily Cash Ledger</h3>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Live summary of today's total bills, cash drawer, UPI payments, and uncollected dues from any phone or computer.
                </p>
              </div>

            </div>

          </div>
        </section>

        <!-- How It Works (Simple 3 Steps) -->
        <section id="how-it-works" class="py-12 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div class="text-center space-y-2">
            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 font-heading">How It Works in 3 Steps</h2>
            <p class="text-xs sm:text-sm text-slate-500">Start generating professional reports in under 3 minutes.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div class="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div class="w-9 h-9 rounded-full bg-brand-600 text-white font-black text-sm flex items-center justify-center mx-auto">1</div>
              <h3 class="font-bold text-slate-900 text-base">Create Account</h3>
              <p class="text-xs text-slate-500">Sign up in 30 seconds with your lab name and email. No installation needed.</p>
            </div>

            <div class="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div class="w-9 h-9 rounded-full bg-brand-600 text-white font-black text-sm flex items-center justify-center mx-auto">2</div>
              <h3 class="font-bold text-slate-900 text-base">Register & Enter Values</h3>
              <p class="text-xs text-slate-500">Add patient, choose preloaded tests (CBC, LFT, etc.), and type results.</p>
            </div>

            <div class="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div class="w-9 h-9 rounded-full bg-brand-600 text-white font-black text-sm flex items-center justify-center mx-auto">3</div>
              <h3 class="font-bold text-slate-900 text-base">Print & WhatsApp</h3>
              <p class="text-xs text-slate-500">Print instant QR report on plain paper or dispatch PDF directly via WhatsApp.</p>
            </div>
          </div>
        </section>

        <!-- Pricing Section (Dynamic from Database) -->
        <section id="pricing" class="py-12 sm:py-16 bg-white border-y border-slate-200">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
            
            <div class="text-center space-y-3 max-w-xl mx-auto">
              <h2 class="text-2xl sm:text-3xl font-black text-slate-900 font-heading">Simple, Transparent Pricing</h2>
              <p class="text-xs sm:text-sm text-slate-500">Choose the plan that fits your laboratory. No hidden charges.</p>
              
              <!-- Billing Switcher -->
              <div class="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
                <button type="button" (click)="billingCycle.set('Monthly')"
                  [class]="billingCycle() === 'Monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
                  class="px-3.5 py-1.5 rounded-lg transition-all cursor-pointer">
                  Monthly
                </button>
                <button type="button" (click)="billingCycle.set('Annual')"
                  [class]="billingCycle() === 'Annual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
                  class="px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer">
                  <span>Annual</span>
                  <span class="px-1.5 py-0.2 rounded bg-emerald-500 text-white text-[9px] font-black uppercase">Save 20%</span>
                </button>
              </div>
            </div>

            <!-- Dynamic Plan Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div *ngFor="let plan of displayPlans()"
                [class]="plan.planCode === 'PRO' ? 'border-2 border-brand-600 bg-brand-50/20 shadow-lg relative' : 'border border-slate-200 bg-white'"
                class="rounded-2xl p-6 flex flex-col justify-between space-y-6">
                
                <div *ngIf="plan.planCode === 'PRO'" class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-black uppercase tracking-wider">
                  Most Popular
                </div>

                <div class="space-y-4">
                  <div>
                    <h3 class="text-lg font-bold text-slate-900 font-heading">{{ plan.planName }}</h3>
                    <p class="text-xs text-slate-500 mt-0.5">{{ plan.description }}</p>
                  </div>

                  <div>
                    <div class="text-3xl font-black text-slate-900 font-heading">
                      ₹{{ billingCycle() === 'Annual' ? (plan.annualPrice / 12 | number:'1.0-0') : plan.monthlyPrice }}
                      <span class="text-xs font-normal text-slate-500">/ month</span>
                    </div>
                    <div class="text-[10px] text-slate-500 mt-0.5">
                      {{ billingCycle() === 'Annual' ? '₹' + plan.annualPrice + ' billed annually' : 'Billed monthly' }}
                    </div>
                  </div>

                  <ul class="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <li class="flex items-center">
                      <i class="fa-solid fa-check text-emerald-600 mr-2 text-xs"></i>
                      <span>{{ plan.maxCasesPerMonth === 0 ? 'Unlimited patient cases' : 'Up to ' + plan.maxCasesPerMonth + ' cases / month' }}</span>
                    </li>
                    <li class="flex items-center">
                      <i class="fa-solid fa-check text-emerald-600 mr-2 text-xs"></i>
                      <span>{{ plan.maxStaffAccounts }} Staff accounts</span>
                    </li>
                    <li class="flex items-center">
                      <i class="fa-solid fa-check text-emerald-600 mr-2 text-xs"></i>
                      <span>Plain A4 paper report printing</span>
                    </li>
                    <li class="flex items-center">
                      <i class="fa-solid fa-check text-emerald-600 mr-2 text-xs"></i>
                      <span>Preloaded 100+ standard tests</span>
                    </li>
                    <li *ngIf="plan.hasWhatsAppAlerts" class="flex items-center">
                      <i class="fa-solid fa-check text-emerald-600 mr-2 text-xs"></i>
                      <span>WhatsApp PDF & QR delivery</span>
                    </li>
                    <li *ngIf="plan.hasDoctorReferralModule" class="flex items-center">
                      <i class="fa-solid fa-check text-emerald-600 mr-2 text-xs"></i>
                      <span>Doctor referral commission ledger</span>
                    </li>
                    <li *ngIf="plan.hasThermalPrinting" class="flex items-center">
                      <i class="fa-solid fa-check text-emerald-600 mr-2 text-xs"></i>
                      <span>Barcode tube stickers (50x25mm)</span>
                    </li>
                  </ul>
                </div>

                <a routerLink="/register"
                  [class]="plan.planCode === 'PRO' ? 'bg-brand-600 hover:bg-brand-500 text-white shadow' : 'bg-slate-900 hover:bg-slate-800 text-white'"
                  class="w-full py-2.5 rounded-xl font-bold text-xs text-center block transition-all">
                  Start 14-Day Free Trial
                </a>
              </div>
            </div>

          </div>
        </section>

        <!-- Final Simple CTA -->
        <section class="py-12 sm:py-16 text-center max-w-2xl mx-auto px-4 space-y-5">
          <h2 class="text-2xl sm:text-4xl font-black text-slate-900 font-heading">
            Ready to upgrade your laboratory?
          </h2>
          <p class="text-xs sm:text-base text-slate-600">
            Start your 14-day zero-risk free trial today. Full access to all features with instant setup.
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a routerLink="/register" class="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-black bg-brand-600 hover:bg-brand-500 text-white shadow-md transition-all">
              Start Free Trial Now &rarr;
            </a>
            <a href="https://wa.me/917706087066" target="_blank" class="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center space-x-1.5">
              <i class="fa-brands fa-whatsapp text-emerald-600"></i>
              <span>WhatsApp: +91 7706087066</span>
            </a>
          </div>
        </section>

      </main>

      <!-- Simple Clean Footer -->
      <footer class="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div class="flex items-center space-x-2">
            <img src="logo.png" alt="DigitalLab" class="w-6 h-6 object-contain">
            <span class="font-bold text-slate-800">DigitalLab Cloud LIMS</span>
            <span>•</span>
            <span>Cloud Pathology System</span>
          </div>
          <div>
            © 2026 DigitalLab Technologies. All rights reserved.
          </div>
        </div>
      </footer>

      <!-- Floating WhatsApp Button -->
      <a href="https://wa.me/917706087066?text=Hello%20DigitalLab%2C%20I%20have%20a%20question%20about%20the%20Pathology%20Software" target="_blank"
        class="fixed bottom-5 right-5 z-40 p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-600/30 flex items-center space-x-2 hover:scale-105 transition-all cursor-pointer"
        title="Chat on WhatsApp">
        <i class="fa-brands fa-whatsapp text-xl"></i>
        <span class="hidden sm:inline font-bold text-xs pr-1">WhatsApp Help</span>
      </a>

    </div>
  `
})
export class LandingPageComponent implements OnInit {
  private apiService = inject(ApiService);

  billingCycle = signal<'Monthly' | 'Annual'>('Annual');
  plans = signal<SubscriptionPlan[]>([]);
  loadingPlans = signal(false);

  private defaultPlans: SubscriptionPlan[] = [
    {
      id: 'starter',
      planCode: 'STARTER',
      planName: 'Starter Lab',
      description: 'For small clinic collection points & single-technician labs.',
      monthlyPrice: 499,
      annualPrice: 4790,
      maxCasesPerMonth: 100,
      maxStaffAccounts: 1,
      hasCustomLetterhead: false,
      hasPublicQrDownload: true,
      hasDoctorReferralModule: false,
      hasThermalPrinting: true,
      hasWhatsAppAlerts: false,
      isActive: true
    },
    {
      id: 'pro',
      planCode: 'PRO',
      planName: 'Pro Lab',
      description: 'For growing diagnostic laboratories with high daily volume.',
      monthlyPrice: 999,
      annualPrice: 9590,
      maxCasesPerMonth: 0,
      maxStaffAccounts: 5,
      hasCustomLetterhead: true,
      hasPublicQrDownload: true,
      hasDoctorReferralModule: true,
      hasThermalPrinting: true,
      hasWhatsAppAlerts: true,
      isActive: true
    },
    {
      id: 'advanced',
      planCode: 'ADVANCED',
      planName: 'Advanced / Multi-Branch',
      description: 'For hospital diagnostic centres & multi-counter chains.',
      monthlyPrice: 1999,
      annualPrice: 18990,
      maxCasesPerMonth: 0,
      maxStaffAccounts: 25,
      hasCustomLetterhead: true,
      hasPublicQrDownload: true,
      hasDoctorReferralModule: true,
      hasThermalPrinting: true,
      hasWhatsAppAlerts: true,
      isActive: true
    }
  ];

  displayPlans = computed(() => {
    const list = this.plans();
    return list.length > 0 ? list : this.defaultPlans;
  });

  ngOnInit(): void {
    this.fetchPlans();
  }

  fetchPlans(): void {
    this.loadingPlans.set(true);
    this.apiService.getPlans().subscribe({
      next: (res) => {
        const paidPlans = res.filter(p => p.planCode !== 'TRIAL' && p.isActive);
        if (paidPlans.length > 0) {
          this.plans.set(paidPlans);
        } else {
          this.plans.set(this.defaultPlans);
        }
        this.loadingPlans.set(false);
      },
      error: () => {
        this.plans.set(this.defaultPlans);
        this.loadingPlans.set(false);
      }
    });
  }
}
