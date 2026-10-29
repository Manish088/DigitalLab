import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
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
        <div class="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-16 sm:h-20 flex items-center justify-between">
          
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
        
        <!-- Hero Section with Background Lab Image Slider -->
        <section class="relative min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] flex items-center justify-center overflow-hidden w-full bg-slate-950 text-white">
          
          <!-- Background Slides (5 Images Crossfade Carousel) -->
          <div class="absolute inset-0 z-0">
            <div *ngFor="let slide of slides; let idx = index"
              class="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              [class.opacity-100]="currentSlide() === idx"
              [class.opacity-0]="currentSlide() !== idx"
              [class.scale-105]="currentSlide() === idx"
              style="transition: opacity 1.2s ease-in-out, transform 6s ease-out;">
              <img [src]="slide.url" [alt]="slide.title" class="w-full h-full object-cover object-center">
            </div>

            <!-- Deep Medical Gradient & Contrast Backdrop Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/65 backdrop-blur-[0.5px]"></div>
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.7)_100%)]"></div>
          </div>

          <!-- Hero Content Overlay (Always Crisp & High Contrast) -->
          <div class="relative z-10 w-full px-4 sm:px-8 py-16 sm:py-24 text-center max-w-5xl mx-auto space-y-6">
            
            <!-- Category Badge -->
            <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-lg">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Next-Gen Cloud LIMS for Diagnostic Laboratories</span>
            </div>

            <!-- Main Headline -->
            <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] font-heading drop-shadow-md max-w-4xl mx-auto">
              Run Your Pathology Lab Smarter, Faster & 100% on the Cloud
            </h1>

            <!-- Subtitle -->
            <p class="text-sm sm:text-lg text-slate-200 max-w-3xl mx-auto leading-relaxed drop-shadow">
              Register patients in under 10 seconds, print thermal barcode tube labels, generate compliant reports on plain A4 paper, and deliver instant WhatsApp PDFs with verified QR codes.
            </p>

            <!-- Buttons -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <a routerLink="/register" class="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-black bg-gradient-to-r from-brand-500 via-cyan-500 to-emerald-500 hover:from-brand-400 hover:to-emerald-400 text-slate-950 shadow-2xl hover:scale-105 transition-all flex items-center justify-center space-x-2">
                <i class="fa-solid fa-rocket text-slate-950"></i>
                <span>Start 14-Day Free Trial</span>
              </a>
              <a href="https://wa.me/917706087066?text=Hello%20DigitalLab%2C%20I%20would%20like%20a%20live%20demo%20of%20the%20Pathology%20Software" target="_blank"
                class="w-full sm:w-auto px-7 py-4 rounded-xl text-sm font-bold bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md shadow-lg transition-all flex items-center justify-center space-x-2">
                <i class="fa-brands fa-whatsapp text-emerald-400 text-lg"></i>
                <span>Schedule WhatsApp Demo</span>
              </a>
            </div>

            <!-- Trust Points -->
            <div class="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300 font-semibold pt-2">
              <span class="flex items-center text-emerald-300"><i class="fa-solid fa-check mr-1.5"></i> 14-Day Free Trial</span>
              <span class="text-slate-600">•</span>
              <span class="flex items-center text-cyan-300"><i class="fa-solid fa-bolt mr-1.5"></i> Instant 1-Minute Setup</span>
              <span class="text-slate-600">•</span>
              <span class="flex items-center text-slate-300"><i class="fa-solid fa-shield-halved mr-1.5"></i> No Credit Card Required</span>
              <span class="text-slate-600">•</span>
              <span class="flex items-center text-amber-300"><i class="fa-solid fa-flask-vial mr-1.5"></i> 100+ Tests Pre-loaded</span>
            </div>

            <!-- Slide Navigation Controls & Indicator Dots -->
            <div class="pt-6 flex items-center justify-center space-x-3">
              <button type="button" (click)="prevSlide()" class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-xs cursor-pointer border border-white/20" title="Previous Slide">
                <i class="fa-solid fa-chevron-left"></i>
              </button>
              
              <div class="flex items-center space-x-2">
                <button *ngFor="let slide of slides; let idx = index"
                  type="button"
                  (click)="setSlide(idx)"
                  [class]="currentSlide() === idx ? 'w-8 bg-emerald-400' : 'w-2 bg-white/40 hover:bg-white/70'"
                  class="h-2 rounded-full transition-all duration-300 cursor-pointer"
                  [title]="slide.title">
                </button>
              </div>

              <button type="button" (click)="nextSlide()" class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-xs cursor-pointer border border-white/20" title="Next Slide">
                <i class="fa-solid fa-chevron-right"></i>
              </button>
            </div>

            <!-- Slide Title Caption -->
            <div class="text-[11px] font-mono text-slate-400">
              <i class="fa-solid fa-camera mr-1 text-slate-500"></i>
              <span>Slide {{ currentSlide() + 1 }} of {{ slides.length }} • {{ slides[currentSlide()].title }}</span>
            </div>

          </div>

        </section>

        <!-- Key Features Grid (Simple 6 Cards) -->
        <section id="features" class="py-12 sm:py-16 bg-white border-y border-slate-200">
          <div class="w-full px-4 sm:px-8 lg:px-12 xl:px-16 space-y-10">
            
            <div class="text-center space-y-2 max-w-2xl mx-auto">
              <h2 class="text-2xl sm:text-3xl font-black text-slate-900 font-heading">Everything Your Laboratory Needs to Scale</h2>
              <p class="text-xs sm:text-sm text-slate-500">Engineered for modern diagnostic laboratories, collection centres, and hospital pathology departments.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
              
              <!-- 1 -->
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-brand-300 transition-all">
                <div class="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center text-lg font-bold">
                  <i class="fa-solid fa-id-card-clip"></i>
                </div>
                <h3 class="font-bold text-slate-900 text-base font-heading">Fast Patient Intake & Billing</h3>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Register patients by phone number, auto-generate UHID records, select pre-loaded tests (CBC, LFT, KFT), and collect cash or UPI payments.
                </p>
              </div>

              <!-- 2 -->
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-brand-300 transition-all">
                <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg font-bold">
                  <i class="fa-solid fa-barcode"></i>
                </div>
                <h3 class="font-bold text-slate-900 text-base font-heading">Thermal Barcode Tube Labels</h3>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Print 50x25mm thermal barcode labels for EDTA, Serum, and Fluoride tubes to eliminate sample mix-ups at the centrifuge.
                </p>
              </div>

              <!-- 3 -->
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-brand-300 transition-all">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold">
                  <i class="fa-solid fa-file-invoice"></i>
                </div>
                <h3 class="font-bold text-slate-900 text-base font-heading">Plain A4 Paper Report Printing</h3>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Print clinical reports on plain A4 paper with your custom laboratory letterhead, logo, and digital pathologist signature.
                </p>
              </div>

              <!-- 4 -->
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-brand-300 transition-all">
                <div class="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center text-lg font-bold">
                  <i class="fa-brands fa-whatsapp"></i>
                </div>
                <h3 class="font-bold text-slate-900 text-base font-heading">Automated WhatsApp Delivery</h3>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Send digitally signed PDF reports directly to the patient's WhatsApp with a secure QR code for instant online authenticity verification.
                </p>
              </div>

              <!-- 5 -->
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-brand-300 transition-all">
                <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg font-bold">
                  <i class="fa-solid fa-user-doctor"></i>
                </div>
                <h3 class="font-bold text-slate-900 text-base font-heading">Doctor Referral Commission Tracking</h3>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Track referring physicians automatically, calculate referral shares accurately, and generate official signed settlement vouchers.
                </p>
              </div>

              <!-- 6 -->
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-brand-300 transition-all">
                <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg font-bold">
                  <i class="fa-solid fa-cash-register"></i>
                </div>
                <h3 class="font-bold text-slate-900 text-base font-heading">Real-Time Financial Ledger</h3>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Monitor daily billed revenue, physical cash drawer collections, UPI inflow, and uncollected dues from any phone or computer.
                </p>
              </div>

            </div>

          </div>
        </section>

        <!-- How It Works (Simple 3 Steps) -->
        <section id="how-it-works" class="py-12 sm:py-16 w-full px-4 sm:px-8 lg:px-12 xl:px-16 space-y-8">
          <div class="text-center space-y-2">
            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 font-heading">How It Works in 3 Simple Steps</h2>
            <p class="text-xs sm:text-sm text-slate-500">Start generating your first clinical test report in under three minutes.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center max-w-[1600px] mx-auto">
            <div class="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div class="w-9 h-9 rounded-full bg-brand-600 text-white font-black text-sm flex items-center justify-center mx-auto">1</div>
              <h3 class="font-bold text-slate-900 text-base">Create Your Account</h3>
              <p class="text-xs text-slate-500">Sign up in 30 seconds with your laboratory name and email address. Zero software installation required.</p>
            </div>

            <div class="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div class="w-9 h-9 rounded-full bg-brand-600 text-white font-black text-sm flex items-center justify-center mx-auto">2</div>
              <h3 class="font-bold text-slate-900 text-base">Add Patient & Enter Results</h3>
              <p class="text-xs text-slate-500">Register incoming patients, pick pre-loaded test profiles (CBC, LFT, KFT), and input observed values.</p>
            </div>

            <div class="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div class="w-9 h-9 rounded-full bg-brand-600 text-white font-black text-sm flex items-center justify-center mx-auto">3</div>
              <h3 class="font-bold text-slate-900 text-base">Deliver & Print Reports</h3>
              <p class="text-xs text-slate-500">Print clear QR reports on plain paper or dispatch digitally signed PDF reports directly to patient WhatsApp.</p>
            </div>
          </div>
        </section>

        <!-- Pricing Section (Dynamic from Database) -->
        <section id="pricing" class="py-12 sm:py-16 bg-white border-y border-slate-200">
          <div class="w-full px-4 sm:px-8 lg:px-12 xl:px-16 space-y-10">
            
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
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
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
        <section class="py-12 sm:py-16 text-center w-full max-w-4xl mx-auto px-4 sm:px-8 space-y-5">
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
        <div class="w-full px-4 sm:px-8 lg:px-12 xl:px-16 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
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
export class LandingPageComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);

  billingCycle = signal<'Monthly' | 'Annual'>('Annual');
  plans = signal<SubscriptionPlan[]>([]);
  loadingPlans = signal(false);

  // Background 5 Lab Images Slider State
  currentSlide = signal(0);
  private slideTimer: any = null;

  slides = [
    { url: 'images/lab-slide-1.jpg', title: 'Clinical Hematology & Microscopy Analysis' },
    { url: 'images/lab-slide-2.jpg', title: 'Automated Biochemistry & Specimen Test Tubes' },
    { url: 'images/lab-slide-3.jpg', title: 'Diagnostic Pathology Testing Workstation' },
    { url: 'images/lab-slide-4.jpg', title: 'High-Throughput Clinical Laboratory Analyzers' },
    { url: 'images/lab-slide-5.jpg', title: 'Centrifuge & Specimen Tube Preparation' }
  ];

  nextSlide(): void {
    this.currentSlide.update(i => (i + 1) % this.slides.length);
    this.resetSlideTimer();
  }

  prevSlide(): void {
    this.currentSlide.update(i => (i - 1 + this.slides.length) % this.slides.length);
    this.resetSlideTimer();
  }

  setSlide(idx: number): void {
    this.currentSlide.set(idx);
    this.resetSlideTimer();
  }

  private startSlideTimer(): void {
    this.slideTimer = setInterval(() => {
      this.currentSlide.update(i => (i + 1) % this.slides.length);
    }, 4500);
  }

  private resetSlideTimer(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
      this.startSlideTimer();
    }
  }

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
    this.startSlideTimer();
  }

  ngOnDestroy(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
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
