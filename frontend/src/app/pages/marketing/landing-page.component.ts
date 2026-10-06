import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface CatalogTest {
  code: string;
  name: string;
  department: string;
  specimen: string;
  price: number;
  parameters: { name: string; unit: string; range: string; flag?: string }[];
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white relative overflow-hidden">
      
      <!-- Background Ambient Glow & Tech Grid -->
      <div class="fixed inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none -z-10"></div>
      <div class="fixed top-0 left-1/3 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse"></div>
      <div class="fixed top-1/2 right-10 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div class="fixed bottom-10 left-10 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10"></div>

      <!-- Top Sticky Notification Header -->
      <div class="bg-gradient-to-r from-brand-700 via-cyan-700 to-emerald-700 text-white text-[11px] sm:text-xs py-2.5 px-4 text-center font-medium tracking-wide flex items-center justify-center space-x-2 border-b border-cyan-500/30 shadow-lg">
        <span class="px-2 py-0.5 rounded-full bg-black/30 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-300/30 flex items-center">
          <i class="fa-solid fa-sparkles mr-1"></i> #1 CLOUD LIMS 2026
        </span>
        <span class="hidden sm:inline">Join 1,200+ Pathology Labs across India. Get <strong>14 Days Free Access</strong> + Free Master Test Catalog Setup!</span>
        <span class="sm:hidden">Get <strong>14 Days Free Trial</strong> + WhatsApp Integration!</span>
        <a routerLink="/login" class="underline hover:text-cyan-200 ml-1 font-bold">Start Free Trial &rarr;</a>
      </div>

      <!-- Main Navigation -->
      <nav class="border-b border-slate-800/80 backdrop-blur-2xl sticky top-0 z-50 bg-[#070b14]/90">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <!-- Logo Brand -->
          <a routerLink="/" class="flex items-center space-x-3 group">
            <div class="relative">
              <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-500 via-cyan-500 to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-cyan-500/25 group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-microscope text-xl"></i>
              </div>
              <span class="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div class="flex items-center space-x-1.5">
                <span class="text-2xl font-black text-white font-heading tracking-tight">DigitLab</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/40">PRO 2.0</span>
              </div>
              <span class="text-[10px] text-cyan-400 font-bold block uppercase tracking-widest">Smart Cloud Pathology System</span>
            </div>
          </a>

          <!-- Desktop Links -->
          <div class="hidden lg:flex items-center space-x-7 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#features" class="hover:text-cyan-400 transition-colors flex items-center"><i class="fa-solid fa-cubes text-slate-500 mr-1.5"></i> 15+ Modules</a>
            <a href="#report-showcase" class="hover:text-cyan-400 transition-colors flex items-center"><i class="fa-solid fa-file-invoice text-slate-500 mr-1.5"></i> Smart Reports</a>
            <a href="#calculator" class="hover:text-cyan-400 transition-colors flex items-center"><i class="fa-solid fa-calculator text-slate-500 mr-1.5"></i> ROI Calculator</a>
            <a href="#test-explorer" class="hover:text-cyan-400 transition-colors flex items-center"><i class="fa-solid fa-flask-vial text-slate-500 mr-1.5"></i> Test Catalog</a>
            <a href="#pricing" class="hover:text-cyan-400 transition-colors flex items-center"><i class="fa-solid fa-tags text-slate-500 mr-1.5"></i> Pricing</a>
            <a href="#faq" class="hover:text-cyan-400 transition-colors">FAQs</a>
          </div>

          <!-- Top CTA Action Buttons -->
          <div class="hidden sm:flex items-center space-x-3">
            <a routerLink="/login" class="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 shadow-sm transition-all flex items-center">
              <i class="fa-solid fa-user-lock mr-1.5 text-brand-400"></i> Lab Login
            </a>
            <a routerLink="/login" class="px-5 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-cyan-500 via-brand-500 to-emerald-500 text-white shadow-xl shadow-cyan-500/25 hover:scale-105 hover:shadow-cyan-500/40 transition-all flex items-center">
              <i class="fa-solid fa-bolt mr-1.5 text-amber-300"></i> 14-Day Free Trial
            </a>
          </div>

          <!-- Mobile Hamburger -->
          <button type="button" (click)="mobileMenuOpen.set(!mobileMenuOpen())"
            class="lg:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none">
            <i class="fa-solid" [ngClass]="mobileMenuOpen() ? 'fa-xmark text-lg' : 'fa-bars text-lg'"></i>
          </button>
        </div>

        <!-- Mobile Drawer Navigation -->
        <div *ngIf="mobileMenuOpen()" class="lg:hidden bg-slate-900/95 border-b border-slate-800 px-6 py-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div class="flex flex-col space-y-3 text-sm font-semibold text-slate-300">
            <a (click)="mobileMenuOpen.set(false)" href="#features" class="hover:text-cyan-400 py-1">15+ Core Modules</a>
            <a (click)="mobileMenuOpen.set(false)" href="#report-showcase" class="hover:text-cyan-400 py-1">Smart Reports & QR</a>
            <a (click)="mobileMenuOpen.set(false)" href="#calculator" class="hover:text-cyan-400 py-1">Revenue ROI Calculator</a>
            <a (click)="mobileMenuOpen.set(false)" href="#test-explorer" class="hover:text-cyan-400 py-1">Master Test Catalog</a>
            <a (click)="mobileMenuOpen.set(false)" href="#pricing" class="hover:text-cyan-400 py-1">Pricing & UPI Plans</a>
            <a (click)="mobileMenuOpen.set(false)" href="#faq" class="hover:text-cyan-400 py-1">FAQs</a>
          </div>
          <div class="pt-3 border-t border-slate-800 flex flex-col space-y-2">
            <a routerLink="/login" class="w-full text-center py-2.5 rounded-xl font-bold text-xs bg-slate-800 text-white border border-slate-700">Lab Login</a>
            <a routerLink="/login" class="w-full text-center py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg">Start 14-Day Free Trial</a>
          </div>
        </div>
      </nav>

      <!-- HERO SECTION -->
      <header class="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div class="text-center space-y-6 max-w-4xl mx-auto">
            <!-- Badge -->
            <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 via-brand-500/10 to-emerald-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-300 shadow-inner">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Next-Gen Pathology Automation for Modern Diagnostics</span>
            </div>

            <!-- Hero Headline -->
            <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black font-heading tracking-tight text-white leading-[1.15]">
              Run Your Entire Pathology Lab On
              <span class="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent block mt-1">100% Autopilot Cloud</span>
            </h1>

            <!-- Subtitle -->
            <p class="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Say goodbye to manual register books, sample tube mix-ups, and report delays. Get <strong>Instant Barcode Tube Labels</strong>, <strong>WhatsApp PDF Reports with QR Verification</strong>, <strong>Dynamic Normal Reference Ranges</strong>, and <strong>Automated Doctor Commission Payout Vouchers</strong>.
            </p>

            <!-- Dual Action CTAs -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <a routerLink="/login" class="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-cyan-500 via-brand-500 to-emerald-500 text-white shadow-2xl shadow-cyan-500/30 hover:scale-105 hover:shadow-cyan-500/50 transition-all flex items-center justify-center space-x-2 cursor-pointer">
                <i class="fa-solid fa-rocket text-amber-300 text-lg"></i>
                <span>Start 14-Day Free Trial (Instant Setup)</span>
              </a>
              <a href="https://wa.me/918866102960?text=Hello%20DigitLab%20Team%2C%20I%20want%20to%20see%20a%20live%20demo%20of%20DigitLab%20Pathology%20Software" target="_blank"
                class="w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-sm sm:text-base bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg hover:border-emerald-500/50 transition-all flex items-center justify-center space-x-2 cursor-pointer">
                <i class="fa-brands fa-whatsapp text-emerald-400 text-xl"></i>
                <span>Book 1-on-1 Demo on WhatsApp</span>
              </a>
            </div>

            <!-- 4 Trust Numbers -->
            <div class="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-xs">
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 text-center">
                <div class="text-2xl font-black text-white font-heading">1,200+</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Active Pathology Labs</div>
              </div>
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 text-center">
                <div class="text-2xl font-black text-emerald-400 font-heading">50,000+</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Daily Reports Delivered</div>
              </div>
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 text-center">
                <div class="text-2xl font-black text-cyan-400 font-heading">10 Seconds</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Patient Intake Time</div>
              </div>
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 text-center">
                <div class="text-2xl font-black text-amber-400 font-heading">100% Free</div>
                <div class="text-[11px] text-slate-400 mt-0.5">No Credit Card Needed</div>
              </div>
            </div>

          </div>

          <!-- Interactive Live UI Preview Window -->
          <div class="mt-14 max-w-5xl mx-auto rounded-3xl p-3 sm:p-5 bg-gradient-to-b from-slate-800/90 via-slate-900 to-[#070b14] border border-slate-700/80 shadow-2xl shadow-cyan-500/10 relative">
            
            <!-- Window Bar -->
            <div class="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs text-slate-400">
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span class="ml-2 font-mono text-[11px] text-slate-400 hidden sm:inline">DigitLab Cloud LIMS v2.0 • Live Counter & Testing Desk</span>
              </div>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                <i class="fa-solid fa-circle text-[7px] text-emerald-400 mr-1 animate-ping"></i> LIVE DESK
              </span>
            </div>

            <!-- Preview Dashboard Content -->
            <div class="p-4 sm:p-6 space-y-4">
              <!-- KPI Row -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                  <div class="text-[11px] text-slate-400 font-semibold">Today's Registered Cases</div>
                  <div class="text-2xl font-black text-white mt-1">54 <span class="text-xs text-emerald-400 font-bold">+22%</span></div>
                </div>
                <div class="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/30">
                  <div class="text-[11px] text-slate-400 font-semibold">Cash in Counter Drawer</div>
                  <div class="text-2xl font-black text-emerald-400 mt-1">₹38,450.00</div>
                </div>
                <div class="bg-slate-900/90 p-4 rounded-2xl border border-cyan-500/30">
                  <div class="text-[11px] text-slate-400 font-semibold">UPI / QR Collections</div>
                  <div class="text-2xl font-black text-cyan-400 mt-1">₹24,900.00</div>
                </div>
                <div class="bg-slate-900/90 p-4 rounded-2xl border border-purple-500/30">
                  <div class="text-[11px] text-slate-400 font-semibold">Approved & WhatsApp Shared</div>
                  <div class="text-2xl font-black text-purple-400 mt-1">51 / 54</div>
                </div>
              </div>

              <!-- Live Patient Case Strip Preview -->
              <div class="bg-slate-950/90 rounded-2xl border border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="flex items-center space-x-3.5">
                  <div class="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-lg font-bold shrink-0">
                    <i class="fa-solid fa-file-medical"></i>
                  </div>
                  <div>
                    <div class="flex items-center space-x-2">
                      <span class="text-sm font-black text-white">Complete Blood Count (CBC with ESR)</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-500/20 text-brand-300">#CASE-2026-0842</span>
                    </div>
                    <div class="text-xs text-slate-400 mt-0.5">Patient: Ramesh Verma (48 Y / Male) • Ref Doc: Dr. S. K. Gupta (Cardiology)</div>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center">
                    <i class="fa-solid fa-circle-check text-emerald-400 mr-1.5"></i> Pathologist Approved
                  </span>
                  <a routerLink="/login" class="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition-all">
                    Open in Software &rarr;
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </header>

      <!-- INTERACTIVE REALISTIC A4 MEDICAL REPORT SHOWCASE -->
      <section id="report-showcase" class="py-20 bg-slate-900/70 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center space-y-3 max-w-3xl mx-auto">
            <span class="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              ⭐ NABL Standard Formatting
            </span>
            <h2 class="text-3xl sm:text-5xl font-black font-heading text-white">Flawless, Professional A4 & WhatsApp Reports</h2>
            <p class="text-xs sm:text-base text-slate-400">Patients and referring doctors love our clean layout, abnormal flags, QR verification tokens, and digital pathologist signoff.</p>
          </div>

          <!-- Realistic A4 Sample Sheet Render -->
          <div class="max-w-4xl mx-auto bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border-4 border-slate-700/50 space-y-6 font-sans">
            
            <!-- Lab Letterhead Header -->
            <div class="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <div class="w-10 h-10 rounded-xl bg-brand-900 text-white flex items-center justify-center font-black text-xl">
                    <i class="fa-solid fa-microscope"></i>
                  </div>
                  <div>
                    <h2 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">CITY CARE DIAGNOSTICS & PATHOLOGY</h2>
                    <p class="text-xs font-semibold text-brand-700">ISO 9001:2015 & NABL Compliant Molecular Laboratory</p>
                  </div>
                </div>
                <p class="text-[11px] text-slate-600">Plot 14, Main Road, Medical Enclave, New Delhi • Ph: +91 98765 43210 • Email: reports&#64;citycarelab.com</p>
              </div>

              <div class="text-right flex sm:flex-col items-end justify-between">
                <div class="px-2.5 py-1 bg-brand-50 border border-brand-200 rounded-lg text-brand-800 text-[11px] font-bold">
                  NABL ACCREDITED LAB
                </div>
                <div class="text-[10px] text-slate-400 font-mono mt-1">CIN: U85110DL2026PTC</div>
              </div>
            </div>

            <!-- Patient Demographics & Barcode Strip -->
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span class="text-slate-500 block text-[10px]">PATIENT NAME</span>
                <strong class="text-slate-900 text-sm">Mr. Vikram Sharma</strong>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">AGE / GENDER</span>
                <strong class="text-slate-900">45 Yrs / Male</strong>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">CASE NO / UHID</span>
                <strong class="text-brand-700 font-mono">CASE-2026-0042</strong>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">SAMPLE BARCODE</span>
                <span class="font-mono text-xs font-black bg-white px-2 py-0.5 rounded border border-slate-300">||| 8849201948</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">REFERRED BY</span>
                <strong class="text-slate-900">Dr. Ananya Sen (MD, DM)</strong>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">COLLECTION DATE</span>
                <span class="text-slate-700">06-Oct-2026, 08:30 AM</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">REPORTING DATE</span>
                <span class="text-slate-700">06-Oct-2026, 11:15 AM</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">STATUS</span>
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">FINAL APPROVED</span>
              </div>
            </div>

            <!-- Investigation Table Mock -->
            <div class="space-y-2">
              <div class="bg-slate-900 text-white font-black text-xs px-3 py-1.5 rounded-lg uppercase tracking-wider flex justify-between">
                <span>COMPLETE BLOOD COUNT (CBC PANEL)</span>
                <span class="font-normal text-[10px] text-slate-300">METHOD: AUTOMATED 5-PART CELL COUNTER</span>
              </div>

              <table class="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead class="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th class="p-2.5">Investigation Parameter</th>
                    <th class="p-2.5">Observed Value</th>
                    <th class="p-2.5">Flag</th>
                    <th class="p-2.5">Unit</th>
                    <th class="p-2.5">Biological Reference Range</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr>
                    <td class="p-2.5 font-bold">Hemoglobin (Hb)</td>
                    <td class="p-2.5 font-black text-slate-900">14.8</td>
                    <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">NORMAL</span></td>
                    <td class="p-2.5 font-mono text-slate-600">g/dL</td>
                    <td class="p-2.5 text-slate-600">13.0 - 17.0 (Adult Male)</td>
                  </tr>
                  <tr class="bg-rose-50/70">
                    <td class="p-2.5 font-bold text-rose-900">Total Leukocyte Count (TLC)</td>
                    <td class="p-2.5 font-black text-rose-700 text-sm">13,400</td>
                    <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-black bg-rose-200 text-rose-800 animate-pulse">HIGH ▲</span></td>
                    <td class="p-2.5 font-mono text-rose-800">/cumm</td>
                    <td class="p-2.5 text-rose-900 font-semibold">4,000 - 11,000</td>
                  </tr>
                  <tr>
                    <td class="p-2.5 font-bold">Platelet Count</td>
                    <td class="p-2.5 font-black text-slate-900">2.85</td>
                    <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">NORMAL</span></td>
                    <td class="p-2.5 font-mono text-slate-600">lakhs/cumm</td>
                    <td class="p-2.5 text-slate-600">1.50 - 4.50</td>
                  </tr>
                  <tr>
                    <td class="p-2.5 font-bold">Neutrophils</td>
                    <td class="p-2.5 font-black text-slate-900">74</td>
                    <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">NORMAL</span></td>
                    <td class="p-2.5 font-mono text-slate-600">%</td>
                    <td class="p-2.5 text-slate-600">40 - 75</td>
                  </tr>
                  <tr>
                    <td class="p-2.5 font-bold">Lymphocytes</td>
                    <td class="p-2.5 font-black text-slate-900">22</td>
                    <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">NORMAL</span></td>
                    <td class="p-2.5 font-mono text-slate-600">%</td>
                    <td class="p-2.5 text-slate-600">20 - 45</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Signatures & QR Code Section -->
            <div class="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div class="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div class="w-14 h-14 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center">
                  <i class="fa-solid fa-qrcode text-3xl text-slate-900"></i>
                </div>
                <div class="text-[10px] text-slate-600">
                  <strong class="text-slate-900 block">Scan to Verify Digital Report</strong>
                  <span>Instant authentic PDF download</span>
                </div>
              </div>

              <div class="flex space-x-8 text-center">
                <div>
                  <div class="font-signature text-sm font-serif italic text-brand-800">Pooja Sharma</div>
                  <div class="border-t border-slate-400 pt-0.5 font-bold text-[10px] text-slate-800">Pooja Sharma (DMLT)</div>
                  <div class="text-[9px] text-slate-500">Medical Lab Technologist</div>
                </div>
                <div>
                  <div class="font-signature text-sm font-serif italic text-brand-800">Dr. Rajesh V. Mehta</div>
                  <div class="border-t border-slate-400 pt-0.5 font-bold text-[10px] text-slate-800">Dr. Rajesh V. Mehta (MD)</div>
                  <div class="text-[9px] text-slate-500">Consultant Pathologist (DMC-48291)</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- INTERACTIVE LAB REVENUE & ROI CALCULATOR -->
      <section id="calculator" class="py-20 bg-slate-950 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center space-y-3 max-w-3xl mx-auto">
            <span class="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
              💰 Live ROI Estimator
            </span>
            <h2 class="text-3xl sm:text-5xl font-black font-heading text-white">Calculate Your Lab's Growth & Savings</h2>
            <p class="text-xs sm:text-base text-slate-400">See how much time and money DigitLab saves your clinic every single month.</p>
          </div>

          <!-- Interactive Calculator Widget Card -->
          <div class="bg-slate-900/90 rounded-3xl p-6 sm:p-10 border border-slate-800 max-w-4xl mx-auto shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            <!-- Sliders Column -->
            <div class="space-y-6 text-xs">
              <!-- Slider 1 -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-slate-200">Daily Patient Cases:</span>
                  <span class="text-lg font-black text-cyan-400">{{ dailyCases() }} cases / day</span>
                </div>
                <input type="range" [(ngModel)]="dailyCases" min="5" max="300" step="5"
                  class="w-full accent-cyan-400 cursor-pointer">
                <div class="flex justify-between text-[10px] text-slate-500">
                  <span>5 cases</span>
                  <span>150 cases</span>
                  <span>300 cases</span>
                </div>
              </div>

              <!-- Slider 2 -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-slate-200">Average Bill Amount per Case:</span>
                  <span class="text-lg font-black text-emerald-400">₹{{ avgBill() }}</span>
                </div>
                <input type="range" [(ngModel)]="avgBill" min="200" max="2500" step="50"
                  class="w-full accent-emerald-400 cursor-pointer">
                <div class="flex justify-between text-[10px] text-slate-500">
                  <span>₹200</span>
                  <span>₹1,200</span>
                  <span>₹2,500</span>
                </div>
              </div>

              <!-- Slider 3 -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-slate-200">Doctor Referral Commission Share:</span>
                  <span class="text-lg font-black text-amber-400">{{ doctorCommissionPct() }}%</span>
                </div>
                <input type="range" [(ngModel)]="doctorCommissionPct" min="0" max="40" step="1"
                  class="w-full accent-amber-400 cursor-pointer">
                <div class="flex justify-between text-[10px] text-slate-500">
                  <span>0%</span>
                  <span>20%</span>
                  <span>40%</span>
                </div>
              </div>
            </div>

            <!-- Output ROI Card -->
            <div class="bg-[#070b14] p-6 rounded-2xl border border-slate-800 space-y-4 text-center">
              <div>
                <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Estimated Monthly Lab Billing</span>
                <div class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mt-1">
                  ₹{{ monthlyRevenue() | number:'1.0-0' }}
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div class="p-3 bg-slate-900 rounded-xl">
                  <div class="text-[10px] text-slate-400">Staff Time Saved</div>
                  <div class="text-lg font-bold text-cyan-300 mt-0.5">{{ hoursSaved() }} Hours / mo</div>
                </div>
                <div class="p-3 bg-slate-900 rounded-xl">
                  <div class="text-[10px] text-slate-400">Doctor Commission</div>
                  <div class="text-lg font-bold text-amber-400 mt-0.5">₹{{ monthlyDoctorCommission() | number:'1.0-0' }}</div>
                </div>
              </div>

              <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold">
                🚀 Net Projected Monthly Profit: ₹{{ netProfit() | number:'1.0-0' }}
              </div>

              <a routerLink="/login" class="block w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-black text-xs rounded-xl shadow-lg transition-all">
                Start Automating for Just ₹499/mo &rarr;
              </a>
            </div>

          </div>

        </div>
      </section>

      <!-- INTERACTIVE TEST CATALOG EXPLORER -->
      <section id="test-explorer" class="py-20 bg-slate-900/80 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div class="text-center space-y-3 max-w-2xl mx-auto">
            <span class="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
              🔬 500+ Pre-Configured Tests
            </span>
            <h2 class="text-3xl sm:text-4xl font-black font-heading text-white">Search Master Test Catalog</h2>
            <p class="text-xs sm:text-sm text-slate-400">Explore pre-loaded test profiles with formula computations and adult/pediatric normal reference ranges.</p>
          </div>

          <!-- Search Bar -->
          <div class="max-w-xl mx-auto relative">
            <input type="text" [(ngModel)]="searchQuery" placeholder="🔍 Search test e.g. CBC, Thyroid, Lipid, LFT, Sugar, HbA1c..."
              class="w-full px-5 py-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-500 shadow-xl">
          </div>

          <!-- Filtered Tests Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
            <div *ngFor="let t of filteredCatalogTests()" class="p-5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-all space-y-3 group">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">{{ t.name }}</h3>
                  <p class="text-[11px] text-slate-400 mt-0.5">{{ t.department }} • {{ t.specimen }}</p>
                </div>
                <span class="font-mono text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  ₹{{ t.price }}
                </span>
              </div>

              <div class="p-2.5 bg-slate-900 rounded-xl space-y-1 text-[11px]">
                <div *ngFor="let p of t.parameters.slice(0, 3)" class="flex justify-between text-slate-300">
                  <span>{{ p.name }}:</span>
                  <span class="font-mono text-cyan-300 font-medium">{{ p.range }} {{ p.unit }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- 15+ CORE MODULES GRID -->
      <section id="features" class="py-24 bg-slate-950 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div class="text-center space-y-3 max-w-3xl mx-auto">
            <span class="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
              Complete Pathology Suite
            </span>
            <h2 class="text-3xl sm:text-5xl font-black font-heading text-white">15+ Integrated Power Modules</h2>
            <p class="text-xs sm:text-base text-slate-400">Everything needed to run a solo laboratory, phlebotomy collection centre, or multi-branch diagnostic hospital.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-user-injured"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">1. Patient Intake & Duplicate Search</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Instant lookup by 10-digit mobile number, unique UHID generator, patient visit history, and age/gender auto-computation.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-cash-register"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">2. Split Billing & POS Counter</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Advance receipts, discount limits, due balance tracking, and split payments (Physical Cash Desk, Dynamic UPI QR, and Card Swipes).</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-brand-500/50 transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-barcode"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">3. Thermal Barcode Tube Stickers</h3>
              <p class="text-xs text-slate-400 leading-relaxed">50x25mm thermal barcode sticker printing for EDTA, Serum, and Fluoride tubes. Never mix up samples at centrifuge station.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-microscope"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">4. Smart Result Entry & Range Badges</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Age/gender specific normal reference intervals. Auto-highlights Low/High and Critical panic values with dynamic medical formulas.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-signature"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">5. Pathologist Digital Signoff</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Doctor approval workflows with custom digital signatures, clinical impressions, interpretations, and NABL disclaimer headers.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-brands fa-whatsapp"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">6. 1-Click WhatsApp PDF Sharing</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Deliver reports directly to patient WhatsApp with secure cloud download link and test summary—at zero extra SMS cost.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-user-doctor"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">7. Doctor Commission Settlement</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Track referral cases by doctor, calculate exact percentage commissions, record payouts, and generate official signed Settlement Vouchers.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-book-open"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">8. Day-End Counter Closing Ledger</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Live reconciliation for cashier desks. Matches physical cash against UPI, POS cards, discounts, and uncollected dues for audit proof.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-teal-500/50 transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-400 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-sliders"></i>
              </div>
              <h3 class="text-lg font-bold text-white font-heading">9. Pre-Printed Letterhead Margins</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Visual slider controls for Top, Bottom, Left, and Right margins (mm) so reports fit your existing pre-printed laboratory pads flawlessly.</p>
            </div>

          </div>

        </div>
      </section>

      <!-- TESTIMONIALS & REVIEWS -->
      <section class="py-20 bg-slate-900/80 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center space-y-3 max-w-2xl mx-auto">
            <span class="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              ⭐ Trusted by Doctors Across India
            </span>
            <h2 class="text-3xl sm:text-4xl font-black font-heading text-white">What Pathologists Say About Us</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            <div class="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <div class="flex text-amber-400 text-xs space-x-1">
                <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
              </div>
              <p class="text-xs text-slate-300 italic leading-relaxed">
                "Pehele hamare lab me daily sham ko doctor commission aur cash counter calculate karne me 2 ghante lagte the. DigitLab ne sab kuch automated kar diya. Settlement Voucher feature bohot transparent hai!"
              </p>
              <div class="flex items-center space-x-3 pt-2 border-t border-slate-800">
                <div class="w-10 h-10 rounded-full bg-brand-500/20 text-brand-300 font-bold flex items-center justify-center">
                  DS
                </div>
                <div>
                  <div class="font-bold text-white text-xs">Dr. S. K. Verma</div>
                  <div class="text-[10px] text-slate-400">Verma Pathcare Labs, Patna</div>
                </div>
              </div>
            </div>

            <div class="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <div class="flex text-amber-400 text-xs space-x-1">
                <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
              </div>
              <p class="text-xs text-slate-300 italic leading-relaxed">
                "Barcode sample stickers aur WhatsApp PDF report delivery ne hamare lab ki branding bohot premium bana di hai. Patients QR code scan karke direct report download kar lete hain!"
              </p>
              <div class="flex items-center space-x-3 pt-2 border-t border-slate-800">
                <div class="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center">
                  DA
                </div>
                <div>
                  <div class="font-bold text-white text-xs">Dr. Ananya Sen</div>
                  <div class="text-[10px] text-slate-400">Apex Diagnostics, Kolkata</div>
                </div>
              </div>
            </div>

            <div class="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <div class="flex text-amber-400 text-xs space-x-1">
                <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
              </div>
              <p class="text-xs text-slate-300 italic leading-relaxed">
                "Pre-printed letterhead margins ka slider itna simple hai ki 2 minute me hamare printed stationery me exact fit ho gaya. Technical support WhatsApp par instant reply karti hai."
              </p>
              <div class="flex items-center space-x-3 pt-2 border-t border-slate-800">
                <div class="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center">
                  DR
                </div>
                <div>
                  <div class="font-bold text-white text-xs">Dr. Rajesh V. Mehta</div>
                  <div class="text-[10px] text-slate-400">City Diagnostics Centre, Mumbai</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- PRICING PLANS -->
      <section id="pricing" class="py-24 bg-slate-950 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center space-y-4 max-w-3xl mx-auto">
            <span class="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
              Transparent & Affordable
            </span>
            <h2 class="text-3xl sm:text-5xl font-black font-heading text-white">Simple, Honest Pricing</h2>
            <p class="text-xs sm:text-base text-slate-400">Zero hidden fees. Pay easily with Instant UPI QR / Google Pay / PhonePe / Paytm / Cards.</p>

            <!-- Toggle -->
            <div class="inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
              <button type="button" (click)="billingCycle.set('Monthly')"
                [class]="billingCycle() === 'Monthly' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
                class="px-4 py-2 rounded-xl transition-all cursor-pointer">
                Monthly Plan
              </button>
              <button type="button" (click)="billingCycle.set('Annual')"
                [class]="billingCycle() === 'Annual' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
                class="px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer">
                <span>Annual Plan</span>
                <span class="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black">20% OFF</span>
              </button>
            </div>
          </div>

          <!-- Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            <!-- Starter -->
            <div class="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-all">
              <div class="space-y-4">
                <div>
                  <h3 class="text-xl font-bold text-white font-heading">Starter Lab</h3>
                  <p class="text-xs text-slate-400 mt-1">For new collection centres & single-technician labs.</p>
                </div>

                <div>
                  <div class="text-4xl font-black text-white font-heading">
                    ₹{{ billingCycle() === 'Annual' ? '499' : '599' }}
                    <span class="text-xs font-normal text-slate-400">/ month</span>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-1">{{ billingCycle() === 'Annual' ? '₹5,988 billed annually' : 'Billed monthly' }}</div>
                </div>

                <ul class="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> Up to <strong>150 cases / month</strong></li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> <strong>2 Staff user logins</strong></li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> Thermal POS Billing Receipts</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> WhatsApp PDF Reports</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> Standard Master Test Catalog</li>
                </ul>
              </div>

              <a routerLink="/login" class="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition-all">
                Start 14-Day Free Trial
              </a>
            </div>

            <!-- Pro -->
            <div class="bg-gradient-to-b from-brand-950 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-cyan-400 flex flex-col justify-between space-y-6 shadow-2xl shadow-cyan-500/20 relative">
              <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-md">
                ⭐ Recommended by Pathologists
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
                  <div class="text-[10px] text-cyan-300 mt-1">{{ billingCycle() === 'Annual' ? '₹11,988 billed annually' : 'Billed monthly' }}</div>
                </div>

                <ul class="space-y-2.5 text-xs text-slate-200 border-t border-slate-800 pt-4">
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> <strong>Unlimited patient cases</strong></li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> <strong>10 Staff accounts</strong> (Tech + Billing)</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> 50x25mm Barcode Tube Label Engine</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> Doctor Commission Settlement Vouchers</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> Custom Letterhead Margin Calibrator</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> Live Day-End Cash Closeout Ledger</li>
                </ul>
              </div>

              <a routerLink="/login" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-brand-500 to-emerald-500 text-white font-black text-xs text-center shadow-lg shadow-cyan-500/30 hover:scale-105 transition-all">
                Start 14-Day Free Trial (All Features)
              </a>
            </div>

            <!-- Enterprise -->
            <div class="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-all">
              <div class="space-y-4">
                <div>
                  <h3 class="text-xl font-bold text-white font-heading">Hospital & Franchise</h3>
                  <p class="text-xs text-slate-400 mt-1">Multi-branch hospital chains & collection hubs.</p>
                </div>

                <div>
                  <div class="text-4xl font-black text-white font-heading">
                    ₹{{ billingCycle() === 'Annual' ? '2,499' : '2,999' }}
                    <span class="text-xs font-normal text-slate-400">/ month</span>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-1">Multi-centre hub & branch permissions</div>
                </div>

                <ul class="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> Unlimited cases & collection centres</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> <strong>Unlimited staff & pathologist logins</strong></li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> Multi-Tenant Central Management</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> 24/7 Dedicated WhatsApp Helpline</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-400 mr-2"></i> Free Custom Test Data Migration</li>
                </ul>
              </div>

              <a routerLink="/login" class="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition-all">
                Contact Sales / Start Trial
              </a>
            </div>

          </div>

        </div>
      </section>

      <!-- FAQ ACCORDION -->
      <section id="faq" class="py-20 bg-slate-900/80 border-t border-slate-800">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div class="text-center space-y-3">
            <span class="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
              Common Questions
            </span>
            <h2 class="text-3xl sm:text-4xl font-black font-heading text-white">Frequently Asked Questions</h2>
          </div>

          <div class="space-y-3 text-xs sm:text-sm">
            <div *ngFor="let faq of faqs; let i = index" class="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden transition-all">
              <button type="button" (click)="toggleFaq(i)" class="w-full p-4 sm:p-5 text-left font-bold text-white flex items-center justify-between hover:text-cyan-400 transition-colors">
                <span>{{ faq.q }}</span>
                <i class="fa-solid" [ngClass]="openFaqIndex() === i ? 'fa-chevron-up text-cyan-400' : 'fa-chevron-down text-slate-500'"></i>
              </button>
              <div *ngIf="openFaqIndex() === i" class="px-4 pb-4 sm:px-5 sm:pb-5 text-slate-400 leading-relaxed border-t border-slate-900 pt-3">
                {{ faq.a }}
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- FINAL CTA CALLOUT BANNER -->
      <section class="py-16 bg-gradient-to-r from-[#070b14] via-slate-900 to-[#070b14] border-t border-slate-800 relative overflow-hidden">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 class="text-3xl sm:text-5xl font-black font-heading text-white leading-tight">
            Ready to Upgrade Your Pathology Lab?
          </h2>
          <p class="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto">
            Join 1,200+ pathologists across India. Get set up in under 60 seconds with our pre-loaded 500+ test catalog!
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <a routerLink="/login" class="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-cyan-500 via-brand-500 to-emerald-500 text-white shadow-2xl hover:scale-105 transition-all">
              🚀 Start 14-Day Free Trial (Instant Access)
            </a>
            <a href="https://wa.me/918866102960?text=Hello%20DigitLab%20Team%2C%20I%20want%20a%20live%20demo%20of%20DigitLab%20Pathology%20Software" target="_blank"
              class="w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center space-x-2 transition-all">
              <i class="fa-brands fa-whatsapp text-lg"></i>
              <span>WhatsApp Live Help (+91 8866102960)</span>
            </a>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="py-12 bg-[#05070d] border-t border-slate-900 text-slate-500 text-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-cyan-500 flex items-center justify-center text-white font-bold">
              <i class="fa-solid fa-microscope text-sm"></i>
            </div>
            <div>
              <span class="font-bold text-white">DigitLab LIMS 2.0</span> — Intelligent Cloud Pathology LIMS Platform
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

      <!-- FLOATING WHATSAPP BUTTON -->
      <a href="https://wa.me/918866102960?text=Hello%20DigitLab%20Team%2C%20I%20want%20to%20learn%20more%20about%20the%20Pathology%20Software" target="_blank"
        class="fixed bottom-6 right-6 z-50 p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-2xl shadow-emerald-500/40 flex items-center space-x-2 hover:scale-105 transition-all group cursor-pointer"
        title="Chat with WhatsApp Support">
        <i class="fa-brands fa-whatsapp text-2xl"></i>
        <span class="hidden sm:inline font-bold text-xs pr-1">Live Help</span>
      </a>

    </div>
  `
})
export class LandingPageComponent {
  mobileMenuOpen = signal(false);
  billingCycle = signal<'Monthly' | 'Annual'>('Annual');
  openFaqIndex = signal<number | null>(0);
  searchQuery = signal('');

  // ROI Calculator Signals
  dailyCases = signal(35);
  avgBill = signal(650);
  doctorCommissionPct = signal(15);

  monthlyRevenue = computed(() => this.dailyCases() * this.avgBill() * 30);
  hoursSaved = computed(() => Math.round(this.dailyCases() * 1.8));
  monthlyDoctorCommission = computed(() => Math.round(this.monthlyRevenue() * (this.doctorCommissionPct() / 100)));
  netProfit = computed(() => Math.round(this.monthlyRevenue() - this.monthlyDoctorCommission() - 499));

  allCatalogTests: CatalogTest[] = [
    {
      code: 'CBC-01',
      name: 'Complete Blood Count (CBC with ESR)',
      department: 'Hematology',
      specimen: 'EDTA Whole Blood',
      price: 350,
      parameters: [
        { name: 'Hemoglobin', unit: 'g/dL', range: '13.0 - 17.0' },
        { name: 'Total WBC Count', unit: '/cumm', range: '4,000 - 11,000' },
        { name: 'Platelets', unit: 'lakhs/cumm', range: '1.50 - 4.50' }
      ]
    },
    {
      code: 'LIPID-01',
      name: 'Lipid Profile (Complete Cholesterol Panel)',
      department: 'Biochemistry',
      specimen: 'Serum (Fasting)',
      price: 650,
      parameters: [
        { name: 'Total Cholesterol', unit: 'mg/dL', range: '< 200' },
        { name: 'Triglycerides', unit: 'mg/dL', range: '< 150' },
        { name: 'HDL (Good)', unit: 'mg/dL', range: '> 40.0' }
      ]
    },
    {
      code: 'LFT-01',
      name: 'Liver Function Test (LFT Panel)',
      department: 'Biochemistry',
      specimen: 'Serum Plain',
      price: 550,
      parameters: [
        { name: 'Bilirubin Total', unit: 'mg/dL', range: '0.2 - 1.2' },
        { name: 'SGOT / AST', unit: 'U/L', range: '5.0 - 40.0' },
        { name: 'SGPT / ALT', unit: 'U/L', range: '5.0 - 45.0' }
      ]
    },
    {
      code: 'KFT-01',
      name: 'Kidney Function Test (KFT / RFT)',
      department: 'Biochemistry',
      specimen: 'Serum Plain',
      price: 500,
      parameters: [
        { name: 'Blood Urea', unit: 'mg/dL', range: '15.0 - 45.0' },
        { name: 'Serum Creatinine', unit: 'mg/dL', range: '0.6 - 1.2' },
        { name: 'Uric Acid', unit: 'mg/dL', range: '3.5 - 7.2' }
      ]
    },
    {
      code: 'THY-01',
      name: 'Thyroid Profile Total (T3, T4, TSH)',
      department: 'Immunoassay',
      specimen: 'Serum SST Gel',
      price: 450,
      parameters: [
        { name: 'Total T3', unit: 'ng/dL', range: '60.0 - 200.0' },
        { name: 'Total T4', unit: 'ug/dL', range: '4.5 - 12.0' },
        { name: 'TSH Ultrasensitive', unit: 'uIU/mL', range: '0.35 - 5.50' }
      ]
    },
    {
      code: 'HBA1C-01',
      name: 'HbA1c (Glycated Hemoglobin)',
      department: 'Biochemistry',
      specimen: 'EDTA Whole Blood',
      price: 400,
      parameters: [
        { name: 'HbA1c', unit: '%', range: '< 5.7 (Normal)' },
        { name: 'Estimated Avg Glucose', unit: 'mg/dL', range: '70 - 126' }
      ]
    }
  ];

  filteredCatalogTests = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.allCatalogTests;
    return this.allCatalogTests.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.code.toLowerCase().includes(q) || 
      t.department.toLowerCase().includes(q)
    );
  });

  faqs = [
    {
      q: 'Kya DigitLab ko chalane ke liye kisi server ya expensive hardware ki zaroorat hai?',
      a: 'Bilkul nahi! DigitLab 100% Cloud par chalta hai. Aap isko kisi bhi normal Laptop, Desktop, Android Mobile ya Tablet par Google Chrome me chala sakte hain.'
    },
    {
      q: 'Kya thermal barcode printer aur 80mm receipt printer support karta hai?',
      a: 'Ji haan! TSC, Zebra, TVS, Xprinter, aur sabhi standard 50x25mm barcode tube label printers aur 80mm thermal receipt printers 100% supported hain.'
    },
    {
      q: 'Patients ko WhatsApp par report kaise share hoti hai?',
      a: 'Pathologist doctor ke approve karte hi 1-Click me patient ke WhatsApp number par verified PDF download link chala jata hai jise patient kabhi bhi scan ya open kar sakta hai.'
    },
    {
      q: 'Hamare pre-printed letterhead pad par report kaise set hogi?',
      a: 'Letterhead Designer module me visual sliders diye gaye hain. Aap Top Margin (e.g. 45mm) aur Bottom Margin (e.g. 25mm) set karke exact apne printed pad me report print kar sakte hain.'
    },
    {
      q: 'Doctor Referral Commission kaise count hota hai?',
      a: 'System automatically doctor commission calculate karta hai aur payout karne par official printable Payout Settlement Voucher generate karta hai.'
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
