import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      <!-- Top Navbar -->
      <nav class="border-b border-slate-800/80 backdrop-blur-xl sticky top-0 z-50 bg-slate-900/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <i class="fa-solid fa-microscope text-xl"></i>
            </div>
            <div>
              <span class="text-xl font-extrabold text-white font-heading tracking-tight">Lab Suvidha</span>
              <span class="text-[10px] text-cyan-400 font-bold block uppercase tracking-widest">Cloud Pathology LIMS</span>
            </div>
          </div>

          <div class="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-300">
            <a href="#features" class="hover:text-white transition-colors">Features</a>
            <a href="#modules" class="hover:text-white transition-colors">15 Modules</a>
            <a href="#pricing" class="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" class="hover:text-white transition-colors">Testimonials</a>
          </div>

          <div class="flex items-center space-x-4">
            <a routerLink="/login" class="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Sign In</a>
            <a routerLink="/login" class="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-lg shadow-brand-500/25 hover:from-brand-400 hover:to-cyan-400 transition-all">
              Start Free Trial
            </a>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <header class="relative pt-20 pb-32 overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-cyan-400 border border-brand-500/30 text-xs font-bold">
            <i class="fa-solid fa-sparkles mr-1"></i> #1 Next-Gen Cloud Pathology & LIMS Software
          </div>

          <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black font-heading tracking-tight max-w-4xl mx-auto leading-tight">
            Run Your Pathology Lab on <span class="bg-gradient-to-r from-brand-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Autopilot</span>
          </h1>

          <p class="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            Complete cloud laboratory information management system. Smart barcode sample tracking, age/gender normal ranges, A4 letterhead reports, QR code public sharing, and doctor commission payouts.
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a routerLink="/login" class="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-base bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-2xl shadow-brand-500/40 hover:scale-105 transition-all">
              🚀 Start 14-Day Free Trial
            </a>
            <a routerLink="/login" class="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all">
              👨‍⚕️ View Live Interactive Demo
            </a>
          </div>

          <!-- Trust Badges -->
          <div class="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto text-xs text-slate-400">
            <div class="flex items-center justify-center space-x-2"><i class="fa-solid fa-shield-check text-emerald-400 text-base"></i><span>NABL & ISO Compliant</span></div>
            <div class="flex items-center justify-center space-x-2"><i class="fa-solid fa-barcode text-cyan-400 text-base"></i><span>CODE39 Barcodes</span></div>
            <div class="flex items-center justify-center space-x-2"><i class="fa-solid fa-qrcode text-brand-400 text-base"></i><span>Instant QR Downloads</span></div>
            <div class="flex items-center justify-center space-x-2"><i class="fa-solid fa-cloud text-purple-400 text-base"></i><span>100% Cloud Automated</span></div>
          </div>
        </div>
      </header>

      <!-- 15 Features Grid -->
      <section id="features" class="py-20 bg-slate-950 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div class="text-center space-y-3">
            <h2 class="text-3xl sm:text-4xl font-black font-heading text-white">All 15 Core Modules Included</h2>
            <p class="text-slate-400 text-sm max-w-xl mx-auto">Everything you need to manage patient registration, testing, reporting, accounts, and doctors.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div class="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center text-xl font-bold"><i class="fa-solid fa-user-injured"></i></div>
              <h3 class="font-bold text-base text-white">Patient Registration & Billing</h3>
              <p class="text-xs text-slate-400">Smart case entry with auto price totals, discounts, advance payments, balance tracking, and thermal POS receipts.</p>
            </div>

            <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl font-bold"><i class="fa-solid fa-microscope"></i></div>
              <h3 class="font-bold text-base text-white">Investigation Result Entry</h3>
              <p class="text-xs text-slate-400">Dynamic normal range matching by age & gender, abnormal/critical flags, clinical interpretations & digital signatures.</p>
            </div>

            <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div class="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl font-bold"><i class="fa-solid fa-qrcode"></i></div>
              <h3 class="font-bold text-base text-white">QR Code Public Download</h3>
              <p class="text-xs text-slate-400">Patients & doctors can scan QR codes with mobile cameras to download original verified PDF reports instantly without logging in.</p>
            </div>

            <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div class="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xl font-bold"><i class="fa-solid fa-signature"></i></div>
              <h3 class="font-bold text-base text-white">Letterhead & Brand Designer</h3>
              <p class="text-xs text-slate-400">Interactive live margin adjusters for pre-printed letterheads, custom fonts, colors, and lab accreditation badges.</p>
            </div>

            <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl font-bold"><i class="fa-solid fa-user-doctor"></i></div>
              <h3 class="font-bold text-base text-white">Doctor Referrals & Commissions</h3>
              <p class="text-xs text-slate-400">Doctor directory, automatic percentage or flat commission computation, referral volume dashboard, and payout ledger.</p>
            </div>

            <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div class="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-xl font-bold"><i class="fa-solid fa-credit-card"></i></div>
              <h3 class="font-bold text-base text-white">SaaS Subscriptions & Razorpay</h3>
              <p class="text-xs text-slate-400">Integrated SaaS payment gateway, monthly/annual renewals, promo code engine, and GST tax invoices.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="py-12 bg-slate-950 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>© 2026 Lab Suvidha. Built with ASP.NET Core & Angular. All rights reserved.</p>
      </footer>
    </div>
  `
})
export class LandingPageComponent {}
