import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface FeatureTab {
  id: string;
  name: string;
  icon: string;
  badge: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white relative overflow-hidden">
      
      <!-- Ambient Glow Orbs -->
      <div class="fixed top-0 left-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse"></div>
      <div class="fixed top-1/3 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div class="fixed bottom-10 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <!-- Top Notification Bar -->
      <div class="bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 text-white text-[11px] sm:text-xs py-2 px-4 text-center font-semibold tracking-wide flex items-center justify-center space-x-2">
        <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">NEW 2026 EDITION</span>
        <span>🎉 Special Launch Offer: Get <strong>14-Day 100% Free Trial</strong> + Free Test Catalog Setup & WhatsApp Integration!</span>
        <a routerLink="/login" class="underline hover:text-cyan-200 ml-1 font-bold">Claim Free Trial &rarr;</a>
      </div>

      <!-- Top Navbar -->
      <nav class="border-b border-slate-800/80 backdrop-blur-xl sticky top-0 z-50 bg-slate-950/85">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center space-x-3 group">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-500 via-cyan-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <i class="fa-solid fa-microscope text-xl"></i>
            </div>
            <div>
              <div class="flex items-center space-x-1.5">
                <span class="text-2xl font-black text-white font-heading tracking-tight">DigitLab</span>
                <span class="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-brand-500/20 text-brand-300 border border-brand-500/30">LIMS 2.0</span>
              </div>
              <span class="text-[10px] text-cyan-400 font-bold block uppercase tracking-widest">Cloud Pathology Automation</span>
            </div>
          </a>

          <!-- Desktop Navigation Menu -->
          <div class="hidden lg:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#features" class="hover:text-cyan-400 transition-colors">Core Modules</a>
            <a href="#live-demo" class="hover:text-cyan-400 transition-colors">Live Interactive Demo</a>
            <a href="#report-preview" class="hover:text-cyan-400 transition-colors">Smart Reports</a>
            <a href="#pricing" class="hover:text-cyan-400 transition-colors">Pricing & UPI</a>
            <a href="#compare" class="hover:text-cyan-400 transition-colors">Why DigitLab?</a>
            <a href="#faq" class="hover:text-cyan-400 transition-colors">FAQs</a>
          </div>

          <!-- Top CTA Buttons -->
          <div class="hidden sm:flex items-center space-x-3">
            <a routerLink="/login" class="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all">
              <i class="fa-solid fa-arrow-right-to-bracket mr-1.5 text-brand-400"></i> Lab Login
            </a>
            <a routerLink="/login" class="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-500 via-cyan-500 to-emerald-500 text-white shadow-lg shadow-brand-500/25 hover:from-brand-400 hover:to-emerald-400 hover:shadow-cyan-500/40 hover:scale-105 transition-all">
              <i class="fa-solid fa-rocket mr-1.5"></i> Start Free Trial
            </a>
          </div>

          <!-- Mobile Hamburger Toggle -->
          <button type="button" (click)="mobileMenuOpen.set(!mobileMenuOpen())"
            class="lg:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none">
            <i class="fa-solid" [ngClass]="mobileMenuOpen() ? 'fa-xmark text-lg' : 'fa-bars text-lg'"></i>
          </button>
        </div>

        <!-- Mobile Drawer Navigation -->
        <div *ngIf="mobileMenuOpen()" class="lg:hidden bg-slate-900 border-b border-slate-800 px-6 py-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div class="flex flex-col space-y-3 text-sm font-semibold text-slate-300">
            <a (click)="mobileMenuOpen.set(false)" href="#features" class="hover:text-cyan-400 py-1">Core Modules</a>
            <a (click)="mobileMenuOpen.set(false)" href="#live-demo" class="hover:text-cyan-400 py-1">Live Interactive Demo</a>
            <a (click)="mobileMenuOpen.set(false)" href="#report-preview" class="hover:text-cyan-400 py-1">Smart Reports</a>
            <a (click)="mobileMenuOpen.set(false)" href="#pricing" class="hover:text-cyan-400 py-1">Pricing & UPI</a>
            <a (click)="mobileMenuOpen.set(false)" href="#compare" class="hover:text-cyan-400 py-1">Why DigitLab?</a>
            <a (click)="mobileMenuOpen.set(false)" href="#faq" class="hover:text-cyan-400 py-1">FAQs</a>
          </div>
          <div class="pt-3 border-t border-slate-800 flex flex-col space-y-2">
            <a routerLink="/login" class="w-full text-center py-2.5 rounded-xl font-bold text-xs bg-slate-800 text-white border border-slate-700">Lab Login</a>
            <a routerLink="/login" class="w-full text-center py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-lg">Start 14-Day Free Trial</a>
          </div>
        </div>
      </nav>

      <!-- HERO SECTION -->
      <header class="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div class="text-center space-y-6 max-w-4xl mx-auto">
            <!-- Badge -->
            <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-cyan-300 border border-brand-500/30 text-xs font-bold shadow-inner">
              <i class="fa-solid fa-wand-magic-sparkles text-amber-400 animate-spin"></i>
              <span>India's Most Advanced Pathology & Diagnostic LIMS Software</span>
            </div>

            <!-- Main Heading -->
            <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black font-heading tracking-tight text-white leading-tight">
              Smart Diagnostics, Instant Reports &
              <span class="bg-gradient-to-r from-brand-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent block mt-1">100% Automated Pathology</span>
            </h1>

            <!-- Subtitle -->
            <p class="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Eliminate manual register books and report errors. Experience <strong>instant barcode tube labeling</strong>, <strong>WhatsApp PDF sharing with QR verification</strong>, <strong>age/gender reference intervals</strong>, and <strong>automated doctor commission ledger</strong>.
            </p>

            <!-- Hero Action CTAs -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <a routerLink="/login" class="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-brand-500 via-cyan-500 to-emerald-500 text-white shadow-2xl shadow-brand-500/30 hover:scale-105 hover:shadow-cyan-500/40 transition-all flex items-center justify-center space-x-2 cursor-pointer">
                <i class="fa-solid fa-bolt text-amber-300 text-lg"></i>
                <span>Start 14-Day Free Trial (No Card Required)</span>
              </a>
              <a href="#live-demo" class="w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-sm sm:text-base bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg hover:border-cyan-500/50 transition-all flex items-center justify-center space-x-2 cursor-pointer">
                <i class="fa-solid fa-circle-play text-cyan-400 text-base"></i>
                <span>Explore Live Demo Sandbox</span>
              </a>
            </div>

            <!-- Trust Highlights Badges -->
            <div class="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-xs">
              <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3 text-left">
                <div class="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-lg shrink-0">
                  <i class="fa-solid fa-shield-check"></i>
                </div>
                <div>
                  <div class="font-bold text-white text-xs">NABL & ISO Ready</div>
                  <div class="text-[10px] text-slate-400">Compliant Format</div>
                </div>
              </div>

              <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3 text-left">
                <div class="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-lg shrink-0">
                  <i class="fa-brands fa-whatsapp"></i>
                </div>
                <div>
                  <div class="font-bold text-white text-xs">WhatsApp Reports</div>
                  <div class="text-[10px] text-slate-400">1-Click Direct Share</div>
                </div>
              </div>

              <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3 text-left">
                <div class="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center text-lg shrink-0">
                  <i class="fa-solid fa-qrcode"></i>
                </div>
                <div>
                  <div class="font-bold text-white text-xs">QR Verified PDFs</div>
                  <div class="text-[10px] text-slate-400">Scan & Download</div>
                </div>
              </div>

              <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3 text-left">
                <div class="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-lg shrink-0">
                  <i class="fa-solid fa-hand-holding-dollar"></i>
                </div>
                <div>
                  <div class="font-bold text-white text-xs">Doctor Payouts</div>
                  <div class="text-[10px] text-slate-400">Settlement Vouchers</div>
                </div>
              </div>
            </div>

          </div>

          <!-- Hero Mockup Dashboard Preview Window -->
          <div class="mt-14 max-w-5xl mx-auto rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-slate-800/80 to-slate-950 border border-slate-700/80 shadow-2xl shadow-brand-500/10 relative">
            <!-- Window Header -->
            <div class="flex items-center justify-between px-4 py-2 border-b border-slate-800 text-xs text-slate-400">
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span class="ml-2 font-mono text-[11px] text-slate-400">https://digitlab.app/dashboard</span>
              </div>
              <div class="flex items-center space-x-3">
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">● LIVE RECONCILIATION</span>
              </div>
            </div>

            <!-- Mockup Content Grid -->
            <div class="p-4 sm:p-6 space-y-4">
              <!-- Stats Row -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                  <div class="text-xs text-slate-400">Today's Registered Cases</div>
                  <div class="text-2xl font-black text-white mt-1">48 <span class="text-xs text-emerald-400 font-semibold">+18%</span></div>
                </div>
                <div class="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                  <div class="text-xs text-slate-400">Today's Counter Cash</div>
                  <div class="text-2xl font-black text-emerald-400 mt-1">₹34,850.00</div>
                </div>
                <div class="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                  <div class="text-xs text-slate-400">UPI / QR Collections</div>
                  <div class="text-2xl font-black text-cyan-400 mt-1">₹19,200.00</div>
                </div>
                <div class="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                  <div class="text-xs text-slate-400">Verified & Shared Reports</div>
                  <div class="text-2xl font-black text-purple-400 mt-1">42 / 48</div>
                </div>
              </div>

              <!-- Interactive Live Preview Strip -->
              <div class="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 rounded-xl bg-brand-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <i class="fa-solid fa-file-medical"></i>
                  </div>
                  <div>
                    <div class="text-xs font-bold text-white">Complete Blood Count (CBC with 24 Parameters)</div>
                    <div class="text-[11px] text-slate-400">Patient: Vikram Sharma (45 Y / Male) • Ref: Dr. Ananya Sen</div>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <i class="fa-solid fa-circle-check mr-1"></i> Doctor Approved
                  </span>
                  <a routerLink="/login" class="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold transition-all">
                    View Live Report &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </header>

      <!-- LIVE INTERACTIVE TEST FINDER & DEMO CALCULATOR -->
      <section id="live-demo" class="py-20 bg-slate-900/90 border-t border-slate-800/80 relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center space-y-3 max-w-2xl mx-auto">
            <span class="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
              ⚡ Try Real Interactive Engine
            </span>
            <h2 class="text-3xl sm:text-4xl font-black font-heading text-white">Explore Instant Investigation Pricing & Ranges</h2>
            <p class="text-xs sm:text-sm text-slate-400">Select popular pathology tests below to see how DigitLab automatically calculates sample tube types, billing, and normal biological intervals.</p>
          </div>

          <!-- Demo Widget Card -->
          <div class="bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl max-w-4xl mx-auto space-y-6">
            
            <!-- Test Quick Select Chips -->
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-slate-400 mr-1">Select Demo Test:</span>
              <button *ngFor="let t of sampleTests" type="button" (click)="selectedDemoTest.set(t)"
                [class]="selectedDemoTest().code === t.code ? 'bg-brand-600 text-white font-bold border-brand-500 shadow-md shadow-brand-500/30' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'"
                class="px-3 py-1.5 rounded-xl text-xs border transition-all cursor-pointer">
                {{ t.name }}
              </button>
            </div>

            <!-- Dynamic Test Details Preview Card -->
            <div class="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/90 space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div class="flex items-center space-x-2">
                    <h3 class="text-lg font-black text-white font-heading">{{ selectedDemoTest().name }}</h3>
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">{{ selectedDemoTest().code }}</span>
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5">{{ selectedDemoTest().department }} • Specimen: <strong class="text-slate-200">{{ selectedDemoTest().specimen }}</strong></p>
                </div>
                <div class="text-left sm:text-right">
                  <div class="text-2xl font-black text-emerald-400 font-heading">₹{{ selectedDemoTest().price | number:'1.2-2' }}</div>
                  <div class="text-[10px] text-slate-400">Standard MRP / B2C Rate</div>
                </div>
              </div>

              <!-- Parameters Breakdown Grid -->
              <div class="space-y-2">
                <div class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Standard Biological Reference Intervals:</span>
                  <span class="text-[10px] text-cyan-400 font-normal">Auto-flagged with Low / High / Critical Badges</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div *ngFor="let param of selectedDemoTest().parameters" class="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs space-y-1">
                    <div class="flex justify-between font-bold text-slate-200">
                      <span>{{ param.name }}</span>
                      <span class="text-brand-400 font-mono text-[11px]">{{ param.unit }}</span>
                    </div>
                    <div class="flex justify-between text-[11px] text-slate-400">
                      <span>Normal Range:</span>
                      <span class="text-slate-300 font-medium">{{ param.range }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action button -->
              <div class="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="text-[11px] text-slate-400 flex items-center space-x-2">
                  <i class="fa-solid fa-barcode text-cyan-400"></i>
                  <span>Barcode Generation, Thermal Slip & WhatsApp Report Included</span>
                </div>
                <a routerLink="/login" class="w-full sm:w-auto px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all text-center">
                  Try in Full Software Sandbox &rarr;
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- 15+ CORE LIMS MODULES (TABS VIEW) -->
      <section id="features" class="py-24 bg-slate-950 border-t border-slate-800 relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div class="text-center space-y-3 max-w-3xl mx-auto">
            <span class="px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30 text-xs font-bold uppercase tracking-wider">
              Comprehensive Cloud Architecture
            </span>
            <h2 class="text-3xl sm:text-5xl font-black font-heading text-white">All 15+ Core Pathology Modules</h2>
            <p class="text-xs sm:text-base text-slate-400">Everything needed to run small collection centres, standalone pathology labs, or multi-branch diagnostic hospital chains.</p>
          </div>

          <!-- Feature Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <!-- Module 1 -->
            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-brand-500/50 transition-all space-y-3 hover:shadow-xl hover:shadow-brand-500/5 group">
              <div class="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-user-plus"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">1. Patient Registration & UHID</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Fast patient intake with live duplicate phone/name lookup, auto-generated unique UHID, age/gender tracking, and historical visit ledger.</p>
              <div class="text-[11px] font-semibold text-brand-400 flex items-center pt-2">
                <span>Duplicate Search • Instant Demographics</span>
              </div>
            </div>

            <!-- Module 2 -->
            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/50 transition-all space-y-3 hover:shadow-xl hover:shadow-emerald-500/5 group">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-receipt"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">2. Multi-Mode Counter Billing</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Advance payment handling, discount authorisation, balance due tracking, and split payment modes (Cash, UPI QR, POS Card Swipes).</p>
              <div class="text-[11px] font-semibold text-emerald-400 flex items-center pt-2">
                <span>Thermal 80mm POS Slip • Split Payment</span>
              </div>
            </div>

            <!-- Module 3 -->
            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/50 transition-all space-y-3 hover:shadow-xl hover:shadow-cyan-500/5 group">
              <div class="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-barcode"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">3. Barcode Sample Labeling</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Auto-generated CODE39 and CODE128 barcode labels for EDTA, Serum, Fluoride and Citrate tubes. Zero sample mix-ups at centrifuge desk.</p>
              <div class="text-[11px] font-semibold text-cyan-400 flex items-center pt-2">
                <span>Thermal Label 50x25mm • Phlebotomy Tube Tracking</span>
              </div>
            </div>

            <!-- Module 4 -->
            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-purple-500/50 transition-all space-y-3 hover:shadow-xl hover:shadow-purple-500/5 group">
              <div class="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-microscope"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">4. Smart Result Entry & Flags</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Age and gender specific biological reference intervals. Live calculation of dynamic formulas (e.g. Globulin, A:G ratio, LDL, eGFR).</p>
              <div class="text-[11px] font-semibold text-purple-400 flex items-center pt-2">
                <span>High/Low Auto Highlight • Panic Critical Alerts</span>
              </div>
            </div>

            <!-- Module 5 -->
            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/50 transition-all space-y-3 hover:shadow-xl hover:shadow-amber-500/5 group">
              <div class="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-signature"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">5. Pathologist Digital Approval</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Granular approval workflows. Pathologists can review, add clinical interpretations, and digitally authorize reports with secure digital signatures.</p>
              <div class="text-[11px] font-semibold text-amber-400 flex items-center pt-2">
                <span>Digital Signatures • NABL Format Verified</span>
              </div>
            </div>

            <!-- Module 6 -->
            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/50 transition-all space-y-3 hover:shadow-xl hover:shadow-emerald-500/5 group">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-brands fa-whatsapp"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">6. WhatsApp Report Sharing</h3>
              <p class="text-xs text-slate-400 leading-relaxed">1-click WhatsApp message delivery to patient mobile. Includes direct verified download link and summary of investigations booked.</p>
              <div class="text-[11px] font-semibold text-emerald-400 flex items-center pt-2">
                <span>Zero SMS Cost • Direct PDF Download</span>
              </div>
            </div>

            <!-- Module 7 -->
            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-blue-500/50 transition-all space-y-3 hover:shadow-xl hover:shadow-blue-500/5 group">
              <div class="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-user-doctor"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">7. Doctor Referral & Commission</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Automated percentage or flat referral commissions. Track doctor billing volume, pending balances, and generate signed Settlement Vouchers.</p>
              <div class="text-[11px] font-semibold text-blue-400 flex items-center pt-2">
                <span>Payout Ledger • Official Settlement Slip</span>
              </div>
            </div>

            <!-- Module 8 -->
            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-rose-500/50 transition-all space-y-3 hover:shadow-xl hover:shadow-rose-500/5 group">
              <div class="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-cash-register"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">8. Daily Cash Counter Closeout</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Evening cash reconciliation for cashier desks. Matches physical drawer cash against UPI, Card payments, and created due balances.</p>
              <div class="text-[11px] font-semibold text-rose-400 flex items-center pt-2">
                <span>Shift Handover • Day-End Audit Slip</span>
              </div>
            </div>

            <!-- Module 9 -->
            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-teal-500/50 transition-all space-y-3 hover:shadow-xl hover:shadow-teal-500/5 group">
              <div class="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-sliders"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">9. Custom Letterhead Designer</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Live margin adjusters for pre-printed letterheads (Top, Bottom, Left, Right mm). Custom lab logos, ISO/NABL badges, and footers.</p>
              <div class="text-[11px] font-semibold text-teal-400 flex items-center pt-2">
                <span>Pre-Printed Stationery • A4 Layout</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- COMPARISON TABLE (OLD REGISTER VS CLOUD LIMS) -->
      <section id="compare" class="py-20 bg-slate-900/80 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center space-y-3 max-w-2xl mx-auto">
            <span class="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              Before vs After
            </span>
            <h2 class="text-3xl sm:text-4xl font-black font-heading text-white">Why 1,200+ Labs Upgraded to DigitLab</h2>
            <p class="text-xs sm:text-sm text-slate-400">See the real difference between traditional manual lab management and modern cloud automation.</p>
          </div>

          <div class="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl max-w-5xl mx-auto">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs sm:text-sm">
                <thead class="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th class="p-4 sm:p-5">Feature / Workflow</th>
                    <th class="p-4 sm:p-5 text-rose-400 bg-rose-950/20">Traditional Manual Lab</th>
                    <th class="p-4 sm:p-5 text-emerald-400 bg-emerald-950/30">DigitLab Cloud LIMS 2.0</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 text-slate-300">
                  <tr>
                    <td class="p-4 sm:p-5 font-bold text-white">Patient Intake & Registration</td>
                    <td class="p-4 sm:p-5 text-rose-300/80 bg-rose-950/10">Slow manual entry in paper register books (3-5 minutes)</td>
                    <td class="p-4 sm:p-5 text-emerald-300 font-semibold bg-emerald-950/20">Instant 10-second lookup by mobile number with auto-fill</td>
                  </tr>
                  <tr>
                    <td class="p-4 sm:p-5 font-bold text-white">Sample Tubes & Labeling</td>
                    <td class="p-4 sm:p-5 text-rose-300/80 bg-rose-950/10">Marker pen on test tubes (High risk of mix-ups)</td>
                    <td class="p-4 sm:p-5 text-emerald-300 font-semibold bg-emerald-950/20">Automated thermal barcode tube stickers (Zero error)</td>
                  </tr>
                  <tr>
                    <td class="p-4 sm:p-5 font-bold text-white">Reference Range Matching</td>
                    <td class="p-4 sm:p-5 text-rose-300/80 bg-rose-950/10">Technicians manually lookup reference charts by age/gender</td>
                    <td class="p-4 sm:p-5 text-emerald-300 font-semibold bg-emerald-950/20">Automatic age & gender intervals with High/Low warning badges</td>
                  </tr>
                  <tr>
                    <td class="p-4 sm:p-5 font-bold text-white">Report Delivery to Patients</td>
                    <td class="p-4 sm:p-5 text-rose-300/80 bg-rose-950/10">Patient must physically travel back to lab to collect paper report</td>
                    <td class="p-4 sm:p-5 text-emerald-300 font-semibold bg-emerald-950/20">Instant WhatsApp PDF link + QR code scan download</td>
                  </tr>
                  <tr>
                    <td class="p-4 sm:p-5 font-bold text-white">Doctor Referral Commission</td>
                    <td class="p-4 sm:p-5 text-rose-300/80 bg-rose-950/10">Manual diary math with frequent calculation disputes</td>
                    <td class="p-4 sm:p-5 text-emerald-300 font-semibold bg-emerald-950/20">Automated commission ledger with printable Settlement Vouchers</td>
                  </tr>
                  <tr>
                    <td class="p-4 sm:p-5 font-bold text-white">Daily Cash Counter Reconciliation</td>
                    <td class="p-4 sm:p-5 text-rose-300/80 bg-rose-950/10">1-hour manual calculator counting at day end</td>
                    <td class="p-4 sm:p-5 text-emerald-300 font-semibold bg-emerald-950/20">1-click Counter Closing matching Cash, UPI & Card splits</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      <!-- PRICING PLANS WITH INSTANT UPI SUPPORT -->
      <section id="pricing" class="py-24 bg-slate-950 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center space-y-4 max-w-3xl mx-auto">
            <span class="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
              Transparent & Affordable
            </span>
            <h2 class="text-3xl sm:text-5xl font-black font-heading text-white">Simple, Predictable Cloud Pricing</h2>
            <p class="text-xs sm:text-base text-slate-400">Zero hidden setup fees. Pay via Instant UPI QR, Google Pay, PhonePe, Paytm, or Credit/Debit Cards.</p>

            <!-- Billing Toggle -->
            <div class="inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
              <button type="button" (click)="billingCycle.set('Monthly')"
                [class]="billingCycle() === 'Monthly' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
                class="px-4 py-2 rounded-xl transition-all cursor-pointer">
                Monthly Billing
              </button>
              <button type="button" (click)="billingCycle.set('Annual')"
                [class]="billingCycle() === 'Annual' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
                class="px-4 py-2 rounded-xl transition-all flex items-center space-x-1 cursor-pointer">
                <span>Annual Billing</span>
                <span class="px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black">20% OFF</span>
              </button>
            </div>
          </div>

          <!-- Pricing Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            <!-- Starter Plan -->
            <div class="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-all">
              <div class="space-y-4">
                <div>
                  <h3 class="text-xl font-bold text-white font-heading">Starter Lab</h3>
                  <p class="text-xs text-slate-400 mt-1">Ideal for new standalone clinics & collection booths.</p>
                </div>

                <div>
                  <div class="text-4xl font-black text-white font-heading">
                    ₹{{ billingCycle() === 'Annual' ? '499' : '599' }}
                    <span class="text-xs font-normal text-slate-400">/ month</span>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-1">{{ billingCycle() === 'Annual' ? 'Billed annually (₹5,988/yr)' : 'Billed monthly' }}</div>
                </div>

                <ul class="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> Up to <strong>150 cases / month</strong></li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> <strong>2 Staff user logins</strong></li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> Standard Thermal & A4 Reports</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> WhatsApp Report Sharing</li>
                  <li class="flex items-center text-slate-500"><i class="fa-solid fa-xmark mr-2 text-xs"></i> Doctor Commission Ledger</li>
                </ul>
              </div>

              <a routerLink="/login" class="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition-all">
                Start 14-Day Free Trial
              </a>
            </div>

            <!-- Pro / Popular Plan -->
            <div class="bg-gradient-to-b from-brand-950 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-brand-500 flex flex-col justify-between space-y-6 shadow-2xl shadow-brand-500/20 relative">
              <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                ⭐ Most Popular Choice
              </div>

              <div class="space-y-4">
                <div>
                  <h3 class="text-xl font-bold text-white font-heading">Professional Lab</h3>
                  <p class="text-xs text-slate-400 mt-1">For busy diagnostic centres & pathology clinics.</p>
                </div>

                <div>
                  <div class="text-4xl font-black text-white font-heading">
                    ₹{{ billingCycle() === 'Annual' ? '999' : '1,199' }}
                    <span class="text-xs font-normal text-slate-400">/ month</span>
                  </div>
                  <div class="text-[10px] text-brand-300 mt-1">{{ billingCycle() === 'Annual' ? 'Billed annually (₹11,988/yr)' : 'Billed monthly' }}</div>
                </div>

                <ul class="space-y-2.5 text-xs text-slate-200 border-t border-slate-800 pt-4">
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> <strong>Unlimited patient cases</strong></li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> <strong>10 Staff logins</strong> (Technicians + Billing)</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> Thermal Tube Barcode Sticker Engine</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> WhatsApp Reports with QR Code Token</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> Doctor Commission Settlement Vouchers</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> Custom Pre-Printed Letterhead Margins</li>
                </ul>
              </div>

              <a routerLink="/login" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 via-cyan-500 to-emerald-500 hover:from-brand-400 hover:to-emerald-400 text-white font-black text-xs text-center shadow-lg shadow-brand-500/30 transition-all">
                Start 14-Day Free Trial
              </a>
            </div>

            <!-- Enterprise Plan -->
            <div class="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-all">
              <div class="space-y-4">
                <div>
                  <h3 class="text-xl font-bold text-white font-heading">Hospital & Multi-Centre</h3>
                  <p class="text-xs text-slate-400 mt-1">Multi-hub hospital chains & franchise networks.</p>
                </div>

                <div>
                  <div class="text-4xl font-black text-white font-heading">
                    ₹{{ billingCycle() === 'Annual' ? '2,499' : '2,999' }}
                    <span class="text-xs font-normal text-slate-400">/ month</span>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-1">All features + Multi-Centre support</div>
                </div>

                <ul class="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> Unlimited cases & collection centres</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> <strong>Unlimited staff accounts</strong></li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> Dedicated Multi-Tenant Central Hub</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> Priority 24/7 WhatsApp & Phone Support</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2 text-xs"></i> Custom Domain & White-labeling</li>
                </ul>
              </div>

              <a routerLink="/login" class="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition-all">
                Talk to Sales / Start Trial
              </a>
            </div>

          </div>

        </div>
      </section>

      <!-- FREQUENTLY ASKED QUESTIONS (ACCORDION) -->
      <section id="faq" class="py-20 bg-slate-900/90 border-t border-slate-800">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div class="text-center space-y-3">
            <span class="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
              Help & Clarifications
            </span>
            <h2 class="text-3xl sm:text-4xl font-black font-heading text-white">Frequently Asked Questions</h2>
          </div>

          <div class="space-y-3 text-xs sm:text-sm">
            
            <div *ngFor="let faq of faqs; let i = index" class="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden transition-all">
              <button type="button" (click)="toggleFaq(i)" class="w-full p-4 sm:p-5 text-left font-bold text-white flex items-center justify-between hover:text-cyan-400 transition-colors">
                <span>{{ faq.q }}</span>
                <i class="fa-solid" [ngClass]="openFaqIndex() === i ? 'fa-chevron-up text-cyan-400' : 'fa-chevron-down text-slate-500'"></i>
              </button>
              <div *ngIf="openFaqIndex() === i" class="px-4 pb-4 sm:px-5 sm:pb-5 text-slate-400 leading-relaxed border-t border-slate-900 pt-3 animate-in fade-in duration-150">
                {{ faq.a }}
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- FINAL CTA CALLOUT BANNER -->
      <section class="py-16 bg-gradient-to-r from-brand-900 via-slate-900 to-slate-900 border-t border-slate-800 relative overflow-hidden">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 class="text-3xl sm:text-5xl font-black font-heading text-white leading-tight">
            Ready to Upgrade Your Pathology Lab Today?
          </h2>
          <p class="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto">
            Join 1,200+ pathologists and lab owners across India. Setup takes less than 60 seconds with our pre-loaded 500+ test catalogue!
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <a routerLink="/login" class="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-2xl hover:scale-105 transition-all">
              🚀 Start 14-Day Free Trial (Instant Access)
            </a>
            <a href="https://wa.me/918866102960?text=Hello%20DigitLab%20Team%2C%20I%20want%20a%20live%20demo%20of%20the%20Pathology%20Software" target="_blank" class="w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center space-x-2 transition-all">
              <i class="fa-brands fa-whatsapp text-lg"></i>
              <span>Chat with Us on WhatsApp (+91 8866102960)</span>
            </a>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="py-12 bg-slate-950 border-t border-slate-900 text-slate-500 text-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold">
              <i class="fa-solid fa-microscope text-sm"></i>
            </div>
            <div>
              <span class="font-bold text-white">DigitLab LIMS 2.0</span> — Next-Gen Cloud Pathology Automation
            </div>
          </div>
          <div class="flex items-center space-x-6 text-slate-400">
            <a routerLink="/login" class="hover:text-white transition-colors">Lab Login</a>
            <a routerLink="/login" class="hover:text-white transition-colors">Super Admin</a>
            <a href="https://wa.me/918866102960" target="_blank" class="hover:text-emerald-400 transition-colors">WhatsApp Support</a>
          </div>
          <div class="text-[11px] text-slate-600">
            © 2026 DigitLab Technologies. All rights reserved.
          </div>
        </div>
      </footer>

      <!-- FLOATING WHATSAPP HELPLINE BUTTON -->
      <a href="https://wa.me/918866102960?text=Hello%20DigitLab%20Support%2C%20I%20need%20help%20with%20Pathology%20Software" target="_blank"
        class="fixed bottom-6 right-6 z-50 p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-2xl shadow-emerald-500/40 flex items-center space-x-2 hover:scale-105 transition-all group cursor-pointer"
        title="Chat with WhatsApp Support">
        <i class="fa-brands fa-whatsapp text-2xl"></i>
        <span class="hidden sm:inline font-bold text-xs pr-1">Live Support</span>
      </a>

    </div>
  `
})
export class LandingPageComponent {
  mobileMenuOpen = signal(false);
  billingCycle = signal<'Monthly' | 'Annual'>('Annual');
  openFaqIndex = signal<number | null>(0);

  sampleTests = [
    {
      code: 'CBC-01',
      name: 'Complete Blood Count (CBC)',
      department: 'Hematology',
      specimen: 'EDTA Whole Blood (2 ml Purple Top)',
      price: 350,
      parameters: [
        { name: 'Hemoglobin (Hb)', unit: 'g/dL', range: '13.0 - 17.0 (Male) / 12.0 - 15.0 (Female)' },
        { name: 'Total Leukocyte Count (TLC)', unit: '/cumm', range: '4,000 - 11,000' },
        { name: 'Platelet Count', unit: 'lakhs/cumm', range: '1.50 - 4.50' },
        { name: 'Packed Cell Volume (PCV)', unit: '%', range: '40.0 - 50.0' }
      ]
    },
    {
      code: 'LIPID-01',
      name: 'Lipid Profile (Cholesterol Panel)',
      department: 'Biochemistry',
      specimen: 'Serum (Fasting 12 hrs, Red Top)',
      price: 650,
      parameters: [
        { name: 'Total Cholesterol', unit: 'mg/dL', range: '< 200 (Desirable)' },
        { name: 'Triglycerides', unit: 'mg/dL', range: '< 150 (Normal)' },
        { name: 'HDL Cholesterol (Good)', unit: 'mg/dL', range: '> 40.0 (Male) / > 50.0 (Female)' },
        { name: 'LDL Cholesterol (Bad)', unit: 'mg/dL', range: '< 100 (Optimal)' }
      ]
    },
    {
      code: 'LFT-01',
      name: 'Liver Function Test (LFT)',
      department: 'Biochemistry',
      specimen: 'Serum (Plain Tube)',
      price: 550,
      parameters: [
        { name: 'Bilirubin Total', unit: 'mg/dL', range: '0.2 - 1.2' },
        { name: 'SGOT / AST', unit: 'U/L', range: '5.0 - 40.0' },
        { name: 'SGPT / ALT', unit: 'U/L', range: '5.0 - 45.0' },
        { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', range: '30.0 - 120.0' }
      ]
    },
    {
      code: 'THY-01',
      name: 'Thyroid Profile Total (T3, T4, TSH)',
      department: 'Immunoassay',
      specimen: 'Serum (SST Gel Tube)',
      price: 450,
      parameters: [
        { name: 'Total Triiodothyronine (T3)', unit: 'ng/dL', range: '60.0 - 200.0' },
        { name: 'Total Thyroxine (T4)', unit: 'ug/dL', range: '4.5 - 12.0' },
        { name: 'TSH (Ultrasensitive)', unit: 'uIU/mL', range: '0.35 - 5.50' }
      ]
    },
    {
      code: 'HBA1C-01',
      name: 'Glycated Hemoglobin (HbA1c)',
      department: 'Biochemistry',
      specimen: 'EDTA Whole Blood (Purple Top)',
      price: 400,
      parameters: [
        { name: 'HbA1c (Glycosylated Hb)', unit: '%', range: '< 5.7 (Normal) / 5.7 - 6.4 (Prediabetes)' },
        { name: 'Estimated Average Glucose (eAG)', unit: 'mg/dL', range: '70.0 - 126.0' }
      ]
    }
  ];

  selectedDemoTest = signal(this.sampleTests[0]);

  faqs = [
    {
      q: 'Kya DigitLab ko chalane ke liye kisi heavy computer ya server ki zaroorat hai?',
      a: 'Nahi! DigitLab 100% Cloud Architecture par chalta hai. Aap isko kisi bhi normal Laptop, Desktop, Android Mobile, ya Tablet par Google Chrome browser me direct chala sakte hain.'
    },
    {
      q: 'Kya thermal barcode printer aur 80mm receipt printer support karta hai?',
      a: 'Ji haan! TSC, Zebra, Xprinter, TVS, aur sabhi standard 50x25mm barcode tube label printers aur 80mm thermal receipt printers 100% supported hain.'
    },
    {
      q: 'Patients ko WhatsApp par report kaise deliver hoti hai?',
      a: 'Jaise hi Pathologist doctor report ko Approve karte hain, aap 1-Click me patient ke WhatsApp number par verified PDF download link share kar sakte hain.'
    },
    {
      q: 'Pre-printed letterhead par report kaise print karein?',
      a: 'Letterhead Designer module me jakar aap Top Margin (e.g. 45mm) aur Bottom Margin (e.g. 25mm) slider se adjust kar sakte hain taaki report aapke printed pad me perfect fit ho.'
    },
    {
      q: 'Doctor Referral Commission kaise calculate aur pay hota hai?',
      a: 'Har doctor ka percentage ya flat commission auto-compute hota hai. Settlement hone par aap official printable Payout Settlement Voucher generate kar sakte hain.'
    }
  ];

  toggleFaq(index: number): void {
    if (this.openFaqIndex() === index) {
      this.openFaqIndex.set(null);
    } else {
      this.openFaqIndex.set(index);
    }
  }
}
