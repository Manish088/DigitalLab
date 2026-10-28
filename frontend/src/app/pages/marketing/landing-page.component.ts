import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SubscriptionPlan } from '../../core/models/lims.models';

interface FeatureTab {
  id: number;
  name: string;
  badge: string;
  icon: string;
  headline: string;
  description: string;
  features: string[];
}

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-white text-slate-900 font-sans selection:bg-brand-500 selection:text-white relative overflow-hidden">
      
      <!-- Ambient Tech Background Grid -->
      <div class="fixed inset-0 bg-[linear-gradient(to_right,#e2e8f050_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f050_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none -z-10"></div>
      <div class="fixed top-0 left-1/3 w-[600px] h-[600px] bg-cyan-100/50 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div class="fixed top-1/2 right-10 w-[500px] h-[500px] bg-brand-100/40 rounded-full blur-[140px] pointer-events-none -z-10"></div>

      <!-- Top Notification Bar -->
      <div class="bg-gradient-to-r from-brand-700 via-cyan-700 to-emerald-700 text-white text-[11px] sm:text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center space-x-2 shadow-sm">
        <span class="px-2 py-0.5 rounded-full bg-white/20 text-emerald-200 text-[10px] font-black uppercase tracking-wider border border-white/30 flex items-center">
          <i class="fa-solid fa-sparkles mr-1"></i> NEXT-GEN CLOUD LIMS
        </span>
        <span class="hidden sm:inline">Start your 14-day zero-risk trial today. Pre-loaded with 100+ standard clinical tests & thermal barcode printing.</span>
        <span class="sm:hidden">14-Day Free Trial • Instant Setup</span>
        <a routerLink="/register" class="underline hover:text-emerald-100 ml-1 font-bold">Get Started Free &rarr;</a>
      </div>

      <!-- Navigation Bar -->
      <nav class="border-b border-slate-200/80 backdrop-blur-xl sticky top-0 z-50 bg-white/95">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <!-- Logo & Brand -->
          <a routerLink="/home" class="flex items-center space-x-3 group">
            <img src="logo.png" alt="DigitalLab" class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl shadow-md object-contain group-hover:scale-105 transition-transform">
            <div>
              <span class="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">DigitalLab</span>
              <span class="hidden sm:block text-[10px] font-semibold text-slate-400 -mt-1 tracking-wider uppercase">Cloud Pathology LIMS</span>
            </div>
          </a>

          <!-- Desktop Navigation Links -->
          <div class="hidden lg:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-slate-600">
            <a href="#features" class="hover:text-brand-600 transition-colors">Features</a>
            <a href="#interactive-preview" class="hover:text-brand-600 transition-colors">Product Walkthrough</a>
            <a href="#pricing" class="hover:text-brand-600 transition-colors">Pricing Plans</a>
            <a href="#faq" class="hover:text-brand-600 transition-colors">FAQ</a>
            <a href="https://wa.me/917706087066" target="_blank" class="hover:text-emerald-600 transition-colors flex items-center">
              <i class="fa-brands fa-whatsapp text-emerald-500 mr-1.5 text-sm"></i> WhatsApp Demo
            </a>
          </div>

          <!-- Top CTA Action Buttons -->
          <div class="hidden sm:flex items-center space-x-3">
            <a routerLink="/login" class="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/90 shadow-sm transition-all flex items-center">
              <i class="fa-solid fa-arrow-right-to-bracket mr-1.5 text-brand-600"></i> Lab Login
            </a>
            <a routerLink="/register" class="px-5 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 text-white shadow-lg shadow-brand-500/25 hover:scale-105 transition-all flex items-center">
              <i class="fa-solid fa-rocket mr-1.5 text-amber-300"></i> Start 14-Day Free Trial
            </a>
          </div>

          <!-- Mobile Hamburger Button -->
          <button type="button" (click)="mobileMenuOpen.set(!mobileMenuOpen())"
            class="lg:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 focus:outline-none">
            <i class="fa-solid" [ngClass]="mobileMenuOpen() ? 'fa-xmark text-lg' : 'fa-bars text-lg'"></i>
          </button>
        </div>

        <!-- Mobile Drawer Navigation -->
        <div *ngIf="mobileMenuOpen()" class="lg:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-xl">
          <div class="flex flex-col space-y-3 text-sm font-semibold text-slate-700">
            <a (click)="mobileMenuOpen.set(false)" href="#features" class="hover:text-brand-600 py-1">Core Features</a>
            <a (click)="mobileMenuOpen.set(false)" href="#interactive-preview" class="hover:text-brand-600 py-1">Product Walkthrough</a>
            <a (click)="mobileMenuOpen.set(false)" href="#pricing" class="hover:text-brand-600 py-1">Transparent Pricing</a>
            <a (click)="mobileMenuOpen.set(false)" href="#faq" class="hover:text-brand-600 py-1">Frequently Asked Questions</a>
            <a href="https://wa.me/917706087066" target="_blank" class="text-emerald-600 font-bold py-1 flex items-center">
              <i class="fa-brands fa-whatsapp mr-1.5"></i> WhatsApp Help (+91 7706087066)
            </a>
          </div>
          <div class="pt-3 border-t border-slate-200 flex flex-col space-y-2">
            <a routerLink="/login" class="w-full text-center py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">Lab Login</a>
            <a routerLink="/register" class="w-full text-center py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-brand-600 to-emerald-600 text-white shadow-md">Start 14-Day Free Trial</a>
          </div>
        </div>
      </nav>

      <!-- HERO SECTION -->
      <header class="relative pt-10 pb-16 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/70 via-white to-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="text-center space-y-5 max-w-4xl mx-auto">
            
            <!-- Category Badge -->
            <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-bold text-brand-700 shadow-sm">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Cloud Pathology Laboratory Information Management System</span>
            </div>

            <!-- Main Headline -->
            <h1 class="text-3xl sm:text-5xl lg:text-7xl font-black font-heading tracking-tight text-slate-900 leading-[1.15]">
              Run Your Entire Pathology Lab on
              <span class="bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent block mt-1 sm:mt-2">
                Intelligent Cloud Autopilot
              </span>
            </h1>

            <!-- Professional Subtitle -->
            <p class="text-xs sm:text-base lg:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed px-2">
              Automate patient registration, thermal barcode tube labels, NABL-standard reports, and instant WhatsApp delivery with verified QR codes. No local server or software installation required.
            </p>

            <!-- Action CTAs -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
              <a routerLink="/register" class="w-full sm:w-auto px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-base bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 text-white shadow-xl shadow-brand-500/25 hover:scale-105 transition-all flex items-center justify-center space-x-2.5 cursor-pointer">
                <i class="fa-solid fa-rocket text-amber-300"></i>
                <span>Start 14-Day Free Trial</span>
              </a>
              <a href="https://wa.me/917706087066?text=Hello%20DigitalLab%2C%20I%20would%20like%20a%20live%20demo%20of%20the%20Pathology%20Software" target="_blank"
                class="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-base bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-md hover:border-emerald-500 transition-all flex items-center justify-center space-x-2 cursor-pointer">
                <i class="fa-brands fa-whatsapp text-emerald-600 text-lg"></i>
                <span>Schedule WhatsApp Demo</span>
              </a>
            </div>

            <!-- Zero Risk Trust Indicators -->
            <div class="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-semibold pt-2">
              <span class="flex items-center text-emerald-600"><i class="fa-solid fa-circle-check mr-1.5"></i> 14-Day Free Trial</span>
              <span class="text-slate-300">•</span>
              <span class="flex items-center text-brand-600"><i class="fa-solid fa-bolt mr-1.5 text-amber-500"></i> Instant 60-Second Setup</span>
              <span class="text-slate-300">•</span>
              <span class="flex items-center text-slate-700"><i class="fa-solid fa-shield-halved mr-1.5 text-cyan-600"></i> No Credit Card Required</span>
            </div>

            <!-- Trust Metrics Grid -->
            <div class="pt-6 sm:pt-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-xs">
              <div class="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center">
                <div class="text-2xl sm:text-3xl font-black text-slate-900 font-heading">1,200+</div>
                <div class="text-[11px] text-slate-500 mt-1 font-medium">Diagnostic Laboratories</div>
              </div>
              <div class="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center">
                <div class="text-2xl sm:text-3xl font-black text-emerald-600 font-heading">500,000+</div>
                <div class="text-[11px] text-slate-500 mt-1 font-medium">Reports Generated</div>
              </div>
              <div class="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center">
                <div class="text-2xl sm:text-3xl font-black text-brand-600 font-heading">&lt; 10s</div>
                <div class="text-[11px] text-slate-500 mt-1 font-medium">Patient Intake Time</div>
              </div>
              <div class="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center">
                <div class="text-2xl sm:text-3xl font-black text-cyan-600 font-heading">99.9%</div>
                <div class="text-[11px] text-slate-500 mt-1 font-medium">Cloud Uptime SLA</div>
              </div>
            </div>

          </div>
        </div>
      </header>

      <!-- INTERACTIVE PRODUCT WALKTHROUGH TABS -->
      <section id="interactive-preview" class="py-16 sm:py-24 bg-gradient-to-b from-white via-slate-50/70 to-white border-t border-slate-200 relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center space-y-3 max-w-3xl mx-auto">
            <span class="px-3.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold uppercase tracking-wider inline-flex items-center">
              <i class="fa-solid fa-display mr-2 text-brand-600"></i> Interactive System Walkthrough
            </span>
            <h2 class="text-3xl sm:text-5xl font-black font-heading text-slate-900 leading-tight">
              Designed for Speed, Accuracy, and Compliance
            </h2>
            <p class="text-xs sm:text-base text-slate-600">
              Explore how DigitalLab streamlines every stage of your clinical diagnostic workflow.
            </p>
          </div>

          <!-- Feature Select Tabs -->
          <div class="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
            <button *ngFor="let tab of tabs; let idx = index"
              type="button"
              (click)="activeTab.set(idx)"
              [class]="activeTab() === idx ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-black' : 'text-slate-600 hover:text-slate-900 font-semibold'"
              class="px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center space-x-2 cursor-pointer">
              <i class="fa-solid" [ngClass]="tab.icon" [class.text-brand-600]="activeTab() === idx"></i>
              <span>{{ tab.name }}</span>
            </button>
          </div>

          <!-- Active Tab Showcase Card -->
          <div class="max-w-6xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            <!-- Left Info Column -->
            <div class="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-200">
              <div class="space-y-4">
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-700 border border-brand-200 inline-block">
                  {{ tabs[activeTab()].badge }}
                </span>
                <h3 class="text-xl sm:text-2xl font-black text-slate-900 font-heading leading-snug">
                  {{ tabs[activeTab()].headline }}
                </h3>
                <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {{ tabs[activeTab()].description }}
                </p>

                <div class="pt-2 space-y-2.5">
                  <div *ngFor="let item of tabs[activeTab()].features" class="flex items-start space-x-2.5 text-xs text-slate-700">
                    <i class="fa-solid fa-circle-check text-emerald-600 mt-0.5 shrink-0"></i>
                    <span>{{ item }}</span>
                  </div>
                </div>
              </div>

              <div class="pt-4">
                <a routerLink="/register" class="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md">
                  <span>Try this feature in Free Trial</span>
                  <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </a>
              </div>
            </div>

            <!-- Right Interactive UI Mockup Container -->
            <div class="lg:col-span-7 p-6 sm:p-8 bg-slate-950 text-white flex flex-col justify-center">
              
              <!-- Tab 0: Intake & Billing Mockup -->
              <div *ngIf="activeTab() === 0" class="space-y-4 animate-in fade-in duration-300">
                <div class="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                  <div class="flex items-center space-x-2 font-mono">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>NEW PATIENT REGISTRATION</span>
                  </div>
                  <span class="font-mono text-cyan-400">UHID: #DL-2026-9041</span>
                </div>
                
                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span class="text-[10px] text-slate-500 block">Patient Name</span>
                    <span class="font-bold text-white">Anil Kumar Sharma</span>
                  </div>
                  <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span class="text-[10px] text-slate-500 block">Age / Gender</span>
                    <span class="font-bold text-white">45 Years / Male</span>
                  </div>
                </div>

                <div class="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <span class="text-[10px] text-slate-500 block">Selected Test Investigations</span>
                  <div class="flex flex-wrap gap-2">
                    <span class="px-2.5 py-1 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[11px] font-semibold">CBC with ESR (₹350)</span>
                    <span class="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold">Lipid Profile (₹650)</span>
                    <span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">HbA1c (₹500)</span>
                  </div>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span class="text-[10px] text-slate-500 block">Net Total Amount</span>
                    <span class="text-xl font-black text-emerald-400">₹1,500.00</span>
                  </div>
                  <div class="flex space-x-2">
                    <span class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs">Cash Received</span>
                    <span class="px-3 py-1.5 bg-cyan-600 text-white rounded-lg font-bold text-xs">Print Thermal Receipt</span>
                  </div>
                </div>
              </div>

              <!-- Tab 1: Barcode Mockup -->
              <div *ngIf="activeTab() === 1" class="space-y-4 animate-in fade-in duration-300">
                <div class="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3 font-mono">
                  <span>50x25mm THERMAL SPECIMEN LABELS</span>
                  <span class="text-emerald-400">READY TO PRINT</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- Label 1 -->
                  <div class="bg-white text-slate-900 p-4 rounded-xl shadow-lg border border-slate-200 space-y-2">
                    <div class="flex justify-between items-center text-[11px] font-bold">
                      <span class="truncate">Anil Sharma (45Y/M)</span>
                      <span class="px-1.5 py-0.5 rounded text-[9px] bg-purple-100 text-purple-800 font-mono">EDTA</span>
                    </div>
                    <div class="font-mono text-center py-2 bg-slate-50 rounded border border-slate-200">
                      <div class="text-lg tracking-widest font-black">|||| |||||| |||| ||</div>
                      <div class="text-[10px] font-semibold text-slate-600 mt-0.5">DL-2026-9041-01</div>
                    </div>
                    <div class="text-[10px] text-slate-500 flex justify-between">
                      <span>CBC with ESR</span>
                      <span>29-Oct-2026</span>
                    </div>
                  </div>

                  <!-- Label 2 -->
                  <div class="bg-white text-slate-900 p-4 rounded-xl shadow-lg border border-slate-200 space-y-2">
                    <div class="flex justify-between items-center text-[11px] font-bold">
                      <span class="truncate">Anil Sharma (45Y/M)</span>
                      <span class="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 font-mono">SERUM</span>
                    </div>
                    <div class="font-mono text-center py-2 bg-slate-50 rounded border border-slate-200">
                      <div class="text-lg tracking-widest font-black">|||| |||||| |||| ||</div>
                      <div class="text-[10px] font-semibold text-slate-600 mt-0.5">DL-2026-9041-02</div>
                    </div>
                    <div class="text-[10px] text-slate-500 flex justify-between">
                      <span>Lipid Profile</span>
                      <span>29-Oct-2026</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tab 2: Result Entry Mockup -->
              <div *ngIf="activeTab() === 2" class="space-y-3 animate-in fade-in duration-300">
                <div class="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2 font-mono">
                  <span>HEMATOLOGY REPORTING WORKSTATION</span>
                  <span class="text-brand-400">NORMAL RANGES SYNCED</span>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="text-[10px] text-slate-400 border-b border-slate-800">
                        <th class="py-2">Test Parameter</th>
                        <th>Observed</th>
                        <th>Reference Interval</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 font-mono text-xs">
                      <tr>
                        <td class="py-2 text-white font-sans font-semibold">Hemoglobin (Hb)</td>
                        <td class="text-cyan-300 font-bold">14.2 g/dL</td>
                        <td class="text-slate-400">13.0 - 17.0</td>
                        <td><span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400">Normal</span></td>
                      </tr>
                      <tr>
                        <td class="py-2 text-white font-sans font-semibold">Total WBC Count</td>
                        <td class="text-amber-300 font-bold">11,800 /uL</td>
                        <td class="text-slate-400">4,000 - 11,000</td>
                        <td><span class="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400">Slight High</span></td>
                      </tr>
                      <tr>
                        <td class="py-2 text-white font-sans font-semibold">Platelet Count</td>
                        <td class="text-cyan-300 font-bold">2.45 Lakhs</td>
                        <td class="text-slate-400">1.50 - 4.50</td>
                        <td><span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400">Normal</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <span class="text-slate-400">Authorized by: <strong>Dr. S. K. Gupta (MD Path)</strong></span>
                  <span class="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[11px]">
                    <i class="fa-solid fa-signature mr-1"></i> Digitally Signed
                  </span>
                </div>
              </div>

              <!-- Tab 3: WhatsApp Delivery Mockup -->
              <div *ngIf="activeTab() === 3" class="space-y-4 animate-in fade-in duration-300">
                <div class="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3 font-mono">
                  <span>AUTOMATED PATIENT NOTIFICATION</span>
                  <span class="text-emerald-400">DELIVERED VIA WHATSAPP</span>
                </div>

                <div class="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div class="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                    <i class="fa-brands fa-whatsapp text-base"></i>
                    <span>DigitalLab Verified Diagnostics</span>
                  </div>

                  <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <p class="text-slate-200">Hello <strong>Anil Sharma</strong>,</p>
                    <p class="text-slate-400 text-[11px] leading-relaxed">
                      Your diagnostic test report for <strong>Complete Blood Count (CBC)</strong> is ready and authorized by the pathologist.
                    </p>
                    <div class="pt-2 flex items-center space-x-2">
                      <span class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center">
                        <i class="fa-solid fa-file-pdf mr-1.5"></i> Download Original Signed PDF
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
                    <span>QR Verification Active</span>
                    <span class="text-cyan-400">Zero Extra SMS Cost</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      <!-- 4 CORE VALUE DRIVERS -->
      <section id="features" class="py-16 sm:py-24 bg-white border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div class="text-center space-y-3 max-w-3xl mx-auto">
            <span class="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider inline-flex items-center">
              <i class="fa-solid fa-shield-check mr-2 text-emerald-600"></i> The DigitalLab Advantage
            </span>
            <h2 class="text-3xl sm:text-5xl font-black font-heading text-slate-900 leading-tight">
              Why Pathology Laboratories Upgrade to DigitalLab
            </h2>
            <p class="text-xs sm:text-base text-slate-600">
              Replace outdated desktop software prone to data loss and system crashes with a reliable, compliant cloud solution.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <!-- Advantage 1 -->
            <div class="p-6 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-xl transition-all space-y-3.5 group">
              <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-file-invoice"></i>
              </div>
              <h3 class="text-base sm:text-lg font-bold text-slate-900 font-heading">Plain A4 Paper Printing</h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                Save ₹3,000 to ₹5,000 monthly by printing directly on plain A4 paper. Built-in designer prints your logo, NABL headers, and digital signatures automatically.
              </p>
              <div class="text-[11px] font-bold text-emerald-700 flex items-center">
                <i class="fa-solid fa-check mr-1.5"></i> Eliminate pre-printed pad costs
              </div>
            </div>

            <!-- Advantage 2 -->
            <div class="p-6 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-cyan-500 hover:shadow-xl transition-all space-y-3.5 group">
              <div class="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-brands fa-whatsapp"></i>
              </div>
              <h3 class="text-base sm:text-lg font-bold text-slate-900 font-heading">WhatsApp & Online QR</h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                Deliver tamper-proof PDF reports directly to patients via WhatsApp. Patients and referring physicians can verify authenticity anytime with online QR scanning.
              </p>
              <div class="text-[11px] font-bold text-cyan-700 flex items-center">
                <i class="fa-solid fa-check mr-1.5"></i> Instant delivery • Zero SMS cost
              </div>
            </div>

            <!-- Advantage 3 -->
            <div class="p-6 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-brand-500 hover:shadow-xl transition-all space-y-3.5 group">
              <div class="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-mobile-screen-button"></i>
              </div>
              <h3 class="text-base sm:text-lg font-bold text-slate-900 font-heading">Live Mobile Monitoring</h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                Monitor your laboratory from your smartphone or laptop. View today's registered patients, test completion rates, and physical counter collections in real time.
              </p>
              <div class="text-[11px] font-bold text-brand-700 flex items-center">
                <i class="fa-solid fa-check mr-1.5"></i> 24/7 Access on Android & iOS
              </div>
            </div>

            <!-- Advantage 4 -->
            <div class="p-6 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-amber-500 hover:shadow-xl transition-all space-y-3.5 group">
              <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-user-doctor"></i>
              </div>
              <h3 class="text-base sm:text-lg font-bold text-slate-900 font-heading">Doctor Referral Tracking</h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                Calculate referring physician referral commissions automatically. Generate professional settlement vouchers with 1 click to maintain audit integrity and trust.
              </p>
              <div class="text-[11px] font-bold text-amber-700 flex items-center">
                <i class="fa-solid fa-check mr-1.5"></i> 1-Click Settlement Vouchers
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- DYNAMIC PRICING SECTION -->
      <section id="pricing" class="py-16 sm:py-24 bg-slate-50/80 border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center space-y-4 max-w-3xl mx-auto">
            <span class="px-3.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold uppercase tracking-wider inline-flex items-center">
              <i class="fa-solid fa-tag mr-2 text-brand-600"></i> Transparent & Predictable
            </span>
            <h2 class="text-3xl sm:text-5xl font-black font-heading text-slate-900 leading-tight">
              Simple, Transparent Pricing
            </h2>
            <p class="text-xs sm:text-base text-slate-600">
              No hidden fees. Every plan includes full access to all clinical features during the 14-day evaluation trial.
            </p>

            <!-- Billing Cycle Switcher -->
            <div class="inline-flex items-center p-1.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold shadow-sm">
              <button type="button" (click)="billingCycle.set('Monthly')"
                [class]="billingCycle() === 'Monthly' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                class="px-4 py-2 rounded-xl transition-all cursor-pointer">
                Monthly Billing
              </button>
              <button type="button" (click)="billingCycle.set('Annual')"
                [class]="billingCycle() === 'Annual' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                class="px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer">
                <span>Annual Billing</span>
                <span class="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase">Save 20%</span>
              </button>
            </div>
          </div>

          <!-- Dynamic Pricing Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            <div *ngFor="let plan of displayPlans(); let i = index"
              [class]="plan.planCode === 'PRO' ? 'bg-gradient-to-b from-brand-50/40 via-white to-white border-2 border-brand-600 shadow-xl shadow-brand-500/10 relative' : 'bg-white border border-slate-200 hover:shadow-xl'"
              class="rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-all">
              
              <!-- Popular Badge -->
              <div *ngIf="plan.planCode === 'PRO'" class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-brand-600 to-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                🔥 Most Popular Choice
              </div>

              <div class="space-y-4">
                <div>
                  <h3 class="text-xl font-bold text-slate-900 font-heading">{{ plan.planName }}</h3>
                  <p class="text-xs text-slate-500 mt-1 leading-relaxed">{{ plan.description }}</p>
                </div>

                <div>
                  <div class="text-3xl sm:text-4xl font-black text-slate-900 font-heading">
                    ₹{{ billingCycle() === 'Annual' ? (plan.annualPrice / 12 | number:'1.0-0') : plan.monthlyPrice }}
                    <span class="text-xs font-normal text-slate-500">/ month</span>
                  </div>
                  <div class="text-[10px] mt-1 font-semibold" [class]="plan.planCode === 'PRO' ? 'text-brand-600' : 'text-slate-500'">
                    {{ billingCycle() === 'Annual' ? '₹' + plan.annualPrice + ' billed annually (20% discount applied)' : 'Billed monthly' }}
                  </div>
                </div>

                <!-- Feature Inclusions -->
                <ul class="space-y-2.5 text-xs text-slate-700 border-t border-slate-100 pt-4">
                  <li class="flex items-center">
                    <i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i>
                    <span>{{ plan.maxCasesPerMonth === 0 ? 'Unlimited Patient Cases' : 'Up to ' + plan.maxCasesPerMonth + ' Cases / Month' }}</span>
                  </li>
                  <li class="flex items-center">
                    <i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i>
                    <span>{{ plan.maxStaffAccounts }} Staff & Technician Logins</span>
                  </li>
                  <li class="flex items-center">
                    <i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i>
                    <span>Pre-loaded 100+ Test Catalog (CBC, LFT, KFT)</span>
                  </li>
                  <li *ngIf="plan.hasCustomLetterhead" class="flex items-center">
                    <i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i>
                    <span>Custom Letterhead & Digital Signature Designer</span>
                  </li>
                  <li *ngIf="plan.hasWhatsAppAlerts" class="flex items-center">
                    <i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i>
                    <span>Automated WhatsApp PDF & QR Delivery</span>
                  </li>
                  <li *ngIf="plan.hasDoctorReferralModule" class="flex items-center">
                    <i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i>
                    <span>Doctor Referral Commission & Settlement Ledger</span>
                  </li>
                  <li *ngIf="plan.hasThermalPrinting" class="flex items-center">
                    <i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i>
                    <span>Thermal Barcode Tube Sticker Printing</span>
                  </li>
                </ul>
              </div>

              <div>
                <a routerLink="/register"
                  [class]="plan.planCode === 'PRO' ? 'bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 text-white shadow-lg shadow-brand-500/25 hover:scale-105' : 'bg-slate-900 hover:bg-slate-800 text-white'"
                  class="w-full py-3.5 rounded-2xl font-black text-xs text-center block transition-all shadow cursor-pointer">
                  Start 14-Day Free Trial
                </a>
                <p class="text-[10px] text-center text-slate-400 mt-2">Zero setup fee • Instant activation</p>
              </div>

            </div>

          </div>

        </div>
      </section>

      <!-- FREQUENTLY ASKED QUESTIONS (FAQ) -->
      <section id="faq" class="py-16 sm:py-24 bg-white border-t border-slate-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div class="text-center space-y-3">
            <span class="px-3.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold uppercase tracking-wider inline-flex items-center">
              <i class="fa-solid fa-circle-question mr-2 text-brand-600"></i> Clear Answers
            </span>
            <h2 class="text-3xl sm:text-4xl font-black font-heading text-slate-900">
              Frequently Asked Questions
            </h2>
            <p class="text-xs sm:text-base text-slate-600">
              Everything you need to know about setting up and running DigitalLab.
            </p>
          </div>

          <div class="space-y-3">
            <div *ngFor="let item of faqs; let idx = index"
              class="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/50">
              <button type="button"
                (click)="toggleFaq(idx)"
                class="w-full p-4 sm:p-5 text-left flex items-center justify-between font-bold text-sm text-slate-900 hover:text-brand-600 transition-colors cursor-pointer">
                <span>{{ item.question }}</span>
                <i class="fa-solid text-slate-400 text-xs transition-transform" [ngClass]="faqOpen() === idx ? 'fa-minus text-brand-600' : 'fa-plus'"></i>
              </button>
              <div *ngIf="faqOpen() === idx" class="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                {{ item.answer }}
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- BOTTOM CALL TO ACTION BANNER -->
      <section class="py-16 bg-gradient-to-r from-brand-700 via-cyan-700 to-emerald-700 text-white relative overflow-hidden">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 class="text-3xl sm:text-5xl font-black font-heading text-white leading-tight">
            Ready to Modernize Your Pathology Laboratory?
          </h2>
          <p class="text-xs sm:text-base text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of pathology laboratories across India. Start your 14-day free trial in under 60 seconds.
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <a routerLink="/register" class="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm bg-white text-slate-950 shadow-2xl hover:scale-105 transition-all">
              🚀 Start 14-Day Free Trial (Instant Access)
            </a>
            <a href="https://wa.me/917706087066?text=Hello%20DigitalLab%2C%20I%20want%20to%20learn%20more%20about%20your%20LIMS%20software" target="_blank"
              class="w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center space-x-2 transition-all border border-emerald-400/40">
              <i class="fa-brands fa-whatsapp text-lg"></i>
              <span>WhatsApp Direct Inquiry (+91 7706087066)</span>
            </a>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="py-10 bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center space-x-3">
            <img src="logo.png" alt="DigitalLab" class="w-8 h-8 rounded-xl object-contain">
            <div>
              <span class="font-bold text-white text-sm">DigitalLab Cloud</span>
              <span class="block text-[10px] text-slate-500">NABL-Standard Pathology Software</span>
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-6 text-slate-400">
            <a href="#features" class="hover:text-white transition-colors">Features</a>
            <a href="#interactive-preview" class="hover:text-white transition-colors">Product Walkthrough</a>
            <a href="#pricing" class="hover:text-white transition-colors">Pricing</a>
            <a routerLink="/login" class="hover:text-white transition-colors">Lab Login</a>
            <a href="https://wa.me/917706087066" target="_blank" class="hover:text-emerald-400 transition-colors">WhatsApp Support</a>
          </div>
          <div class="text-[11px] text-slate-500 text-center md:text-right">
            © 2026 DigitalLab Technologies. All rights reserved.
          </div>
        </div>
      </footer>

      <!-- FLOATING WHATSAPP BUTTON -->
      <a href="https://wa.me/917706087066?text=Hello%20DigitalLab%2C%20I%20would%20like%20to%20know%20more%20about%20your%20software" target="_blank"
        class="fixed bottom-5 right-5 z-40 p-3 sm:px-4 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-2xl shadow-emerald-500/40 flex items-center space-x-2 hover:scale-105 transition-all cursor-pointer border-2 border-white/20"
        title="Chat on WhatsApp">
        <i class="fa-brands fa-whatsapp text-xl"></i>
        <span class="hidden sm:inline font-bold text-xs pr-1">Instant WhatsApp Help</span>
      </a>

    </div>
  `
})
export class LandingPageComponent implements OnInit {
  private apiService = inject(ApiService);

  mobileMenuOpen = signal(false);
  billingCycle = signal<'Monthly' | 'Annual'>('Annual');
  activeTab = signal(0);
  faqOpen = signal<number | null>(0);

  // Dynamic Plans State
  plans = signal<SubscriptionPlan[]>([]);
  loadingPlans = signal(false);

  // Fallback plans if API is unavailable during offline development
  private defaultPlans: SubscriptionPlan[] = [
    {
      id: 'starter',
      planCode: 'STARTER',
      planName: 'Starter Lab',
      description: 'Ideal for small clinic collection centres and single-technician diagnostic setups.',
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
      description: 'Engineered for growing diagnostic pathology centres with high daily patient volume.',
      monthlyPrice: 999,
      annualPrice: 9590,
      maxCasesPerMonth: 0, // Unlimited
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
      description: 'For hospital diagnostic laboratories, franchise collection networks, and multi-counter setups.',
      monthlyPrice: 1999,
      annualPrice: 18990,
      maxCasesPerMonth: 0, // Unlimited
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

  tabs: FeatureTab[] = [
    {
      id: 0,
      name: 'Intake & Billing',
      badge: 'Reception & Cashier Desk',
      icon: 'fa-id-card-clip',
      headline: 'Register Patients & Collect Payments in Under 10 Seconds',
      description: 'Quickly look up returning patients by phone number, auto-generate unique UHID records, select test investigations with one keystroke, and reconcile counter cash & UPI collections.',
      features: [
        'Instant mobile phone lookup with auto UHID generation',
        'Pre-loaded test catalog with smart search (CBC, LFT, KFT, Lipid)',
        'Cash drawer & instant UPI QR payment reconciliation',
        'Print plain A4 invoices or compact thermal POS receipts'
      ]
    },
    {
      id: 1,
      name: 'Barcode Labeling',
      badge: 'Phlebotomy & Centrifuge Station',
      icon: 'fa-barcode',
      headline: 'Eliminate Specimen Mix-Ups with 50x25mm Barcode Stickers',
      description: 'Print standardized barcode tube labels directly from your thermal printer. Each tube label clearly indicates the patient name, case number, and tube type (EDTA Purple, Serum Red, Fluoride Grey).',
      features: [
        'Direct 50x25mm thermal printer sticker compatibility',
        'Automated barcode encoding linked to patient case record',
        'Color-coded tube guidance for phlebotomy technicians',
        'Zero sample mix-ups at the centrifuge testing bench'
      ]
    },
    {
      id: 2,
      name: 'Result Entry & Sign-off',
      badge: 'Pathologist & Testing Station',
      icon: 'fa-microscope',
      headline: 'Dynamic Reference Intervals, Panic Alerts & Digital Signatures',
      description: 'Normal biological reference ranges automatically adapt to patient age and gender. Critical values are flagged visually with panic indicators for immediate clinical review and sign-off.',
      features: [
        'Age and gender-specific biological reference intervals',
        'Automatic visual indicators for Low, High, and Panic results',
        'Built-in clinical interpretation and medical remarks library',
        'One-click encrypted digital pathologist signature sign-off'
      ]
    },
    {
      id: 3,
      name: 'WhatsApp & Online QR',
      badge: 'Zero Counter Waiting',
      icon: 'fa-qrcode',
      headline: 'Deliver Verified Reports Directly to WhatsApp with QR Verification',
      description: 'Approved reports are dispatched automatically to patients via WhatsApp with a secure cloud PDF download link. Anyone can scan the QR code to verify the report authenticity online.',
      features: [
        'Instant automated WhatsApp PDF report notification',
        'Tamper-proof QR code for instant scan-to-verify authentication',
        'Zero SMS recharge costs or expensive third-party gateways',
        'Patients and doctors can access reports 24/7 on any device'
      ]
    }
  ];

  faqs: FaqItem[] = [
    {
      question: 'Do I need to install software or purchase an expensive local server?',
      answer: 'No. DigitalLab is 100% cloud-based. You can log in securely from any standard web browser on your PC, laptop, tablet, or smartphone without installing any software or maintaining hardware.'
    },
    {
      question: 'Can I print clinical reports on plain A4 paper without pre-printed pads?',
      answer: 'Yes! DigitalLab includes a built-in letterhead designer that prints your laboratory logo, custom header, NABL footer, and pathologist digital signature directly on plain white A4 paper. If you already have pre-printed pads, you can easily adjust margins using our visual millimeter sliders.'
    },
    {
      question: 'Are standard tests like CBC, LFT, and Lipid Profile already pre-loaded?',
      answer: 'Yes. Over 100+ standard clinical pathology tests with normal biological reference ranges, units, and panic thresholds are pre-loaded in your master catalog and ready to use immediately upon signup.'
    },
    {
      question: 'How does the WhatsApp report delivery work?',
      answer: 'Once a pathologist approves a patient case, a single click dispatches an automated WhatsApp notification to the patient with a direct PDF download link and a tamper-proof QR code for online verification.'
    },
    {
      question: 'Can multiple staff members use the software simultaneously?',
      answer: 'Yes. DigitalLab supports simultaneous multi-user access with role-based permissions for Receptionists (billing & registration), Lab Technicians (result entry), Pathologists (report approval), and Lab Managers.'
    }
  ];

  ngOnInit(): void {
    this.fetchPlans();
  }

  fetchPlans(): void {
    this.loadingPlans.set(true);
    this.apiService.getPlans().subscribe({
      next: (res) => {
        // Filter out TRIAL plan from commercial pricing cards
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

  toggleFaq(index: number): void {
    this.faqOpen.update(current => current === index ? null : index);
  }
}
