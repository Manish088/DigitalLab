import { Component, signal, computed, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export interface FlowerPetal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  swayAngle: number;
  swaySpeed: number;
  swayRadius: number;
  rotation: number;
  rotationSpeed: number;
  flipAngle: number;
  flipSpeed: number;
  opacity: number;
  type: 'rose' | 'marigold' | 'jasmine';
  color: string;
  colorLight: string;
  colorDark: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-white text-slate-900 font-sans selection:bg-brand-500 selection:text-white relative overflow-hidden">
      
      <!-- Celebratory Flower Shower Canvas (फूलों की बारिश) -->
      <canvas #flowerCanvas class="fixed inset-0 pointer-events-none z-50 w-full h-full" [style.display]="flowerShowerActive() ? 'block' : 'none'"></canvas>

      <!-- Auspicious Launch Celebratory Pill Banner -->
      <div *ngIf="flowerShowerActive()"
        class="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 text-white font-bold text-xs sm:text-sm shadow-2xl flex items-center space-x-2 animate-bounce pointer-events-none border border-white/40 shadow-rose-500/25 backdrop-blur-md">
        <span class="text-base">🌸</span>
        <span class="tracking-wide font-black uppercase text-[11px] sm:text-xs">शुभ आरंभ • Auspicious Launch Celebration</span>
        <span class="text-base">🌸</span>
      </div>

      <!-- Background Ambient Glow & Tech Grid -->
      <div class="fixed inset-0 bg-[linear-gradient(to_right,#e2e8f060_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f060_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none -z-10"></div>
      <div class="fixed top-0 left-1/3 w-[550px] h-[550px] bg-cyan-100/60 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse"></div>
      <div class="fixed top-1/2 right-10 w-[500px] h-[500px] bg-brand-100/50 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div class="fixed bottom-10 left-10 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-[140px] pointer-events-none -z-10"></div>

      <!-- Top Sticky Notification Header -->
      <div class="bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 text-white text-[11px] sm:text-xs py-2.5 px-4 text-center font-medium tracking-wide flex items-center justify-center space-x-2 shadow-sm">
        <span class="px-2 py-0.5 rounded-full bg-white/20 text-amber-200 text-[10px] font-black uppercase tracking-wider border border-white/30 flex items-center">
          <i class="fa-solid fa-sparkles mr-1"></i> #1 CLOUD LIMS 2026
        </span>
        <span class="hidden sm:inline">Join 1,200+ Pathology Labs across India. Get <strong>14 Days Free Access</strong> + Free Master Test Catalog Setup!</span>
        <span class="sm:hidden">Get <strong>14 Days Free Trial</strong> + WhatsApp Integration!</span>
        <a routerLink="/login" class="underline hover:text-cyan-100 ml-1 font-bold">Start Free Trial &rarr;</a>
      </div>

      <!-- Main Navigation -->
      <nav class="border-b border-slate-200/80 backdrop-blur-xl sticky top-0 z-50 bg-white/90">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <!-- Logo Brand -->
          <a routerLink="/" class="flex items-center space-x-3 group">
            <img src="logo.png" alt="DigitalLab" class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl shadow-md object-contain group-hover:scale-105 transition-transform">
            <div>
              <span class="text-2xl font-black text-slate-900 font-heading tracking-tight">DigitalLab</span>
            </div>
          </a>

          <!-- Desktop Links -->
          <div class="hidden lg:flex items-center space-x-7 text-xs font-bold uppercase tracking-wider text-slate-600">
            <a href="#video-tour" class="hover:text-brand-600 transition-colors flex items-center"><i class="fa-solid fa-circle-play text-slate-400 mr-1.5"></i> Video Demo</a>
            <a href="#features" class="hover:text-brand-600 transition-colors flex items-center"><i class="fa-solid fa-cubes text-slate-400 mr-1.5"></i> 15+ Modules</a>
            <a href="#calculator" class="hover:text-brand-600 transition-colors flex items-center"><i class="fa-solid fa-calculator text-slate-400 mr-1.5"></i> ROI Calculator</a>
            <a href="#about" class="hover:text-brand-600 transition-colors flex items-center"><i class="fa-solid fa-circle-info text-slate-400 mr-1.5"></i> About Us</a>
            <a href="#pricing" class="hover:text-brand-600 transition-colors flex items-center"><i class="fa-solid fa-tags text-slate-400 mr-1.5"></i> Pricing</a>
          </div>

          <!-- Top CTA Action Buttons -->
          <div class="hidden sm:flex items-center space-x-3">
            <a routerLink="/login" class="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/90 shadow-sm transition-all flex items-center">
              <i class="fa-solid fa-user-lock mr-1.5 text-brand-600"></i> Lab Login
            </a>
            <a routerLink="/login" class="px-5 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-cyan-600 via-brand-600 to-emerald-600 text-white shadow-lg shadow-brand-500/25 hover:scale-105 hover:shadow-brand-500/35 transition-all flex items-center">
              <i class="fa-solid fa-bolt mr-1.5 text-amber-300"></i> 14-Day Free Trial
            </a>
          </div>

          <!-- Mobile Hamburger -->
          <button type="button" (click)="mobileMenuOpen.set(!mobileMenuOpen())"
            class="lg:hidden p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 focus:outline-none">
            <i class="fa-solid" [ngClass]="mobileMenuOpen() ? 'fa-xmark text-lg' : 'fa-bars text-lg'"></i>
          </button>
        </div>

        <!-- Mobile Drawer Navigation -->
        <div *ngIf="mobileMenuOpen()" class="lg:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-xl">
          <div class="flex flex-col space-y-3 text-sm font-semibold text-slate-700">
            <a (click)="mobileMenuOpen.set(false)" href="#video-tour" class="hover:text-brand-600 py-1">Video Demo & Features</a>
            <a (click)="mobileMenuOpen.set(false)" href="#features" class="hover:text-brand-600 py-1">15+ Core Modules</a>
            <a (click)="mobileMenuOpen.set(false)" href="#calculator" class="hover:text-brand-600 py-1">Revenue ROI Calculator</a>
            <a (click)="mobileMenuOpen.set(false)" href="#about" class="hover:text-brand-600 py-1">About DigitalLab</a>
            <a (click)="mobileMenuOpen.set(false)" href="#pricing" class="hover:text-brand-600 py-1">Pricing & UPI Plans</a>
          </div>
          <div class="pt-3 border-t border-slate-200 flex flex-col space-y-2">
            <a routerLink="/login" class="w-full text-center py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">Lab Login</a>
            <a routerLink="/login" class="w-full text-center py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md">Start 14-Day Free Trial</a>
          </div>
        </div>
      </nav>

      <!-- HERO SECTION -->
      <header class="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div class="text-center space-y-6 max-w-4xl mx-auto">
            <!-- Badge -->
            <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-bold text-brand-700 shadow-sm">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Next-Gen Pathology Automation for Modern Diagnostics</span>
            </div>

            <!-- Hero Headline -->
            <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black font-heading tracking-tight text-slate-900 leading-[1.15]">
              Run Your Entire Pathology Lab On
              <span class="bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent block mt-1">100% Autopilot Cloud</span>
            </h1>

            <!-- Subtitle -->
            <p class="text-sm sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Say goodbye to manual register books, sample tube mix-ups, and report delays. Get <strong>Instant Barcode Tube Labels</strong>, <strong>WhatsApp PDF Reports with QR Verification</strong>, <strong>Dynamic Normal Reference Ranges</strong>, and <strong>Automated Doctor Commission Payout Vouchers</strong>.
            </p>

            <!-- Dual Action CTAs -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <a routerLink="/login" class="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-cyan-600 via-brand-600 to-emerald-600 text-white shadow-xl shadow-brand-500/25 hover:scale-105 hover:shadow-brand-500/35 transition-all flex items-center justify-center space-x-2 cursor-pointer">
                <i class="fa-solid fa-rocket text-amber-300 text-lg"></i>
                <span>Start 14-Day Free Trial (Instant Setup)</span>
              </a>
              <a href="#video-tour"
                class="w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-sm sm:text-base bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-md hover:border-brand-500 transition-all flex items-center justify-center space-x-2 cursor-pointer">
                <i class="fa-solid fa-circle-play text-brand-600 text-xl"></i>
                <span>Watch Video Tour (3 Min)</span>
              </a>
            </div>

            <!-- 4 Trust Numbers -->
            <div class="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-xs">
              <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center">
                <div class="text-2xl font-black text-slate-900 font-heading">1,200+</div>
                <div class="text-[11px] text-slate-500 mt-0.5 font-medium">Active Pathology Labs</div>
              </div>
              <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center">
                <div class="text-2xl font-black text-emerald-600 font-heading">50,000+</div>
                <div class="text-[11px] text-slate-500 mt-0.5 font-medium">Daily Reports Delivered</div>
              </div>
              <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center">
                <div class="text-2xl font-black text-brand-600 font-heading">10 Seconds</div>
                <div class="text-[11px] text-slate-500 mt-0.5 font-medium">Patient Intake Time</div>
              </div>
              <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center">
                <div class="text-2xl font-black text-amber-600 font-heading">100% Free</div>
                <div class="text-[11px] text-slate-500 mt-0.5 font-medium">No Credit Card Needed</div>
              </div>
            </div>

          </div>

          <!-- Interactive Live UI Preview Window -->
          <div class="mt-14 max-w-5xl mx-auto rounded-3xl p-3 sm:p-5 bg-white border border-slate-200/90 shadow-2xl shadow-slate-300/40 relative">
            
            <!-- Window Bar -->
            <div class="flex items-center justify-between px-3 py-2 border-b border-slate-100 text-xs text-slate-500 bg-slate-50/80 rounded-t-2xl">
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 rounded-full bg-rose-400 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
                <span class="ml-2 font-mono text-[11px] text-slate-600 hidden sm:inline">DigitalLab Cloud LIMS v2.0 • Live Counter & Testing Desk</span>
              </div>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                <i class="fa-solid fa-circle text-[7px] text-emerald-500 mr-1 animate-ping"></i> LIVE DESK
              </span>
            </div>

            <!-- Preview Dashboard Content -->
            <div class="p-4 sm:p-6 space-y-4">
              <!-- KPI Row -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div class="text-[11px] text-slate-500 font-semibold">Today's Registered Cases</div>
                  <div class="text-2xl font-black text-slate-900 mt-1">54 <span class="text-xs text-emerald-600 font-bold">+22%</span></div>
                </div>
                <div class="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
                  <div class="text-[11px] text-emerald-800 font-semibold">Cash in Counter Drawer</div>
                  <div class="text-2xl font-black text-emerald-700 mt-1">₹38,450.00</div>
                </div>
                <div class="bg-cyan-50/60 p-4 rounded-2xl border border-cyan-200">
                  <div class="text-[11px] text-cyan-800 font-semibold">UPI / QR Collections</div>
                  <div class="text-2xl font-black text-cyan-700 mt-1">₹24,900.00</div>
                </div>
                <div class="bg-purple-50/60 p-4 rounded-2xl border border-purple-200">
                  <div class="text-[11px] text-purple-800 font-semibold">Approved & WhatsApp Shared</div>
                  <div class="text-2xl font-black text-purple-700 mt-1">51 / 54</div>
                </div>
              </div>

              <!-- Live Patient Case Strip Preview -->
              <div class="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="flex items-center space-x-3.5">
                  <div class="w-11 h-11 rounded-2xl bg-brand-100 text-brand-600 border border-brand-200 flex items-center justify-center text-lg font-bold shrink-0">
                    <i class="fa-solid fa-file-medical"></i>
                  </div>
                  <div>
                    <div class="flex items-center space-x-2">
                      <span class="text-sm font-black text-slate-900">Complete Blood Count (CBC with ESR)</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-100 text-brand-700">#CASE-2026-0842</span>
                    </div>
                    <div class="text-xs text-slate-500 mt-0.5">Patient: Ramesh Verma (48 Y / Male) • Ref Doc: Dr. S. K. Gupta (Cardiology)</div>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center">
                    <i class="fa-solid fa-circle-check text-emerald-600 mr-1.5"></i> Pathologist Approved
                  </span>
                  <a routerLink="/login" class="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all">
                    Open in Software &rarr;
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </header>

      <!-- VIDEO FEATURE TOUR SECTION -->
      <section id="video-tour" class="py-24 bg-gradient-to-b from-white via-slate-50/70 to-white border-t border-slate-200 relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div class="text-center space-y-4 max-w-3xl mx-auto">
            <span class="px-3.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold uppercase tracking-wider inline-flex items-center">
              <i class="fa-solid fa-circle-play mr-2 text-brand-600"></i> Interactive Product Video Tour
            </span>
            <h2 class="text-3xl sm:text-5xl font-black font-heading text-slate-900 leading-tight">
              Watch DigitalLab Features in Action
            </h2>
            <p class="text-xs sm:text-base text-slate-600">
              Dekhiye kaise DigitalLab aapke pathology lab ke har task—patient registration, thermal barcode print, test results, WhatsApp delivery aur doctor commission—ko 100% automated karta hai.
            </p>
          </div>

          <!-- Video Tour Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <!-- Left Column: 5 Feature Chapter Selectors -->
            <div class="lg:col-span-5 space-y-3">
              <div *ngFor="let feat of videoFeatures; let idx = index"
                (click)="activeVideoFeature.set(idx)"
                [class]="activeVideoFeature() === idx ? 'bg-white border-brand-500 shadow-lg ring-2 ring-brand-500/20 translate-x-1.5' : 'bg-slate-50/80 hover:bg-white border-slate-200'"
                class="p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 group">
                <div [class]="activeVideoFeature() === idx ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-200 text-slate-700'"
                  class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors">
                  <i class="fa-solid" [ngClass]="feat.icon"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h4 class="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                      {{ feat.title }}
                    </h4>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                      {{ feat.duration }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {{ feat.description }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Right Column: Interactive Video Showcase Player -->
            <div class="lg:col-span-7">
              <div class="bg-slate-950 rounded-3xl p-3 sm:p-5 border border-slate-800 shadow-2xl overflow-hidden relative">
                
                <!-- Player Header Bar -->
                <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-800/80 text-xs text-slate-400 bg-slate-900/90 rounded-t-2xl">
                  <div class="flex items-center space-x-2">
                    <span class="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span class="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span class="ml-2 font-mono text-[11px] text-slate-300 truncate">
                      {{ videoFeatures[activeVideoFeature()].title }} • HD Demo
                    </span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <!-- Voice Narration Button -->
                    <button type="button" (click)="toggleVoice()"
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors flex items-center space-x-1.5 cursor-pointer"
                      [ngClass]="voiceEnabled() ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'">
                      <i class="fa-solid" [ngClass]="voiceEnabled() ? 'fa-volume-high text-cyan-400' : 'fa-volume-xmark'"></i>
                      <span>{{ voiceEnabled() ? '🔊 Hindi Voice: ON' : '🔇 Voice: Muted' }}</span>
                    </button>
                    
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center"
                      [ngClass]="isPlaying() ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-brand-500/20 text-brand-300 border-brand-500/30'">
                      <i class="fa-solid fa-circle text-[7px] mr-1.5" [ngClass]="isPlaying() ? 'text-emerald-400 animate-ping' : 'text-brand-400'"></i>
                      {{ isPlaying() ? 'PLAYING LIVE' : 'CLICK PLAY' }}
                    </span>
                  </div>
                </div>

                <!-- Video Screen Area with Live Simulation -->
                <div class="relative min-h-[360px] sm:min-h-[400px] rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between p-4 sm:p-6 overflow-hidden mt-3 border border-slate-800">
                  
                  <!-- Ambient Graphic Mesh -->
                  <div class="absolute inset-0 bg-[linear-gradient(to_right,#1f293720_1px,transparent_1px),linear-gradient(to_bottom,#1f293720_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none opacity-40"></div>
                  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

                  <!-- Top Tag & Progress Bar Overlay -->
                  <div class="relative z-10 flex justify-between items-center">
                    <span class="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 flex items-center">
                      <i class="fa-solid" [ngClass]="videoFeatures[activeVideoFeature()].icon + ' mr-1.5 text-cyan-400'"></i>
                      Step {{ activeVideoFeature() + 1 }} of {{ videoFeatures.length }}
                    </span>
                    <span class="text-xs text-slate-400 font-mono flex items-center space-x-1.5">
                      <span class="w-2 h-2 rounded-full" [ngClass]="isPlaying() ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'"></span>
                      <span>DigitalLab Cloud Live Demo</span>
                    </span>
                  </div>

                  <!-- STATE 1: PAUSED / INITIAL VIEW (Big Play Button) -->
                  <div *ngIf="!isPlaying()" (click)="togglePlay()"
                    class="relative z-10 text-center space-y-4 my-auto py-6 cursor-pointer group/screen">
                    <button type="button" (click)="togglePlay(); $event.stopPropagation()"
                      class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 via-brand-500 to-emerald-500 text-white shadow-2xl shadow-cyan-500/40 group-hover/screen:scale-110 group-hover/screen:shadow-cyan-500/70 transition-all cursor-pointer">
                      <i class="fa-solid fa-play text-2xl ml-1"></i>
                    </button>
                    <div>
                      <h3 class="text-lg sm:text-xl font-black text-white font-heading">
                        {{ videoFeatures[activeVideoFeature()].title }}
                      </h3>
                      <p class="text-xs text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                        {{ videoFeatures[activeVideoFeature()].description }}
                      </p>
                    </div>

                    <!-- 3 Feature Bullets -->
                    <div class="flex flex-wrap justify-center gap-2 pt-1">
                      <span *ngFor="let b of videoFeatures[activeVideoFeature()].bullets"
                        class="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[10px] text-cyan-200 font-medium">
                        ✓ {{ b }}
                      </span>
                    </div>

                    <div class="text-[11px] text-brand-400 font-bold animate-pulse pt-2">
                      ▶ Click to Play Live Interactive Walkthrough
                    </div>
                  </div>

                  <!-- STATE 2: PLAYING LIVE SIMULATION VIEWS (Animated UI for each feature) -->
                  <div *ngIf="isPlaying()" class="relative z-10 my-auto py-3 space-y-3">
                    
                    <!-- SCENE 0: Patient Registration & UHID Intake -->
                    <div *ngIf="activeVideoFeature() === 0" class="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl animate-in fade-in zoom-in-95 duration-300">
                      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <span class="text-xs font-bold text-cyan-300 flex items-center">
                          <i class="fa-solid fa-user-plus mr-1.5"></i> Patient Intake & Billing Form
                        </span>
                        <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                          ⚡ 8 Sec Intake
                        </span>
                      </div>
                      <div class="grid grid-cols-2 gap-2.5 text-xs">
                        <div class="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <div class="text-[10px] text-slate-400">Mobile Number Search</div>
                          <div class="font-bold text-white mt-0.5">+91 77060 87066 <span class="text-emerald-400 text-[10px]">✓ Found</span></div>
                        </div>
                        <div class="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <div class="text-[10px] text-slate-400">Auto UHID Generated</div>
                          <div class="font-mono font-black text-cyan-400 mt-0.5">#UHID-2026-0842</div>
                        </div>
                        <div class="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <div class="text-[10px] text-slate-400">Patient Demographics</div>
                          <div class="font-bold text-white mt-0.5">Ramesh Verma (48 Y / Male)</div>
                        </div>
                        <div class="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <div class="text-[10px] text-slate-400">Referring Doctor</div>
                          <div class="font-bold text-amber-300 mt-0.5">Dr. S. K. Gupta (Cardiology)</div>
                        </div>
                      </div>
                      <div class="p-2.5 bg-brand-500/15 border border-brand-500/30 rounded-xl flex items-center justify-between text-xs">
                        <span class="text-slate-200">Selected: <strong>CBC + Lipid Profile</strong></span>
                        <span class="font-bold text-emerald-400">Bill: ₹1,250 (UPI QR Paid)</span>
                      </div>
                    </div>

                    <!-- SCENE 1: Barcode Thermal Tube Stickers -->
                    <div *ngIf="activeVideoFeature() === 1" class="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl animate-in fade-in zoom-in-95 duration-300">
                      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <span class="text-xs font-bold text-cyan-300 flex items-center">
                          <i class="fa-solid fa-barcode mr-1.5"></i> 50x25mm Thermal Label Generator
                        </span>
                        <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                          ✓ Auto-Printed
                        </span>
                      </div>
                      <div class="bg-white text-slate-900 rounded-xl p-3 max-w-sm mx-auto shadow-inner border border-slate-300 font-mono text-center space-y-1">
                        <div class="text-[10px] font-black tracking-widest uppercase">DIGITALLAB DIAGNOSTICS</div>
                        <div class="text-base font-black tracking-tighter">||| | ||||| || ||| |||| |</div>
                        <div class="text-xs font-bold">#CASE-2026-0842 • RAMESH VERMA (48/M)</div>
                        <div class="text-[10px] font-semibold text-slate-600">EDTA WHOLE BLOOD • CBC with ESR • 06-OCT-2026</div>
                      </div>
                      <div class="flex justify-center space-x-2 text-[11px] text-slate-300 pt-1">
                        <span class="px-2 py-1 bg-slate-800 rounded-lg border border-slate-700">🟣 EDTA Tube</span>
                        <span class="px-2 py-1 bg-slate-800 rounded-lg border border-slate-700">🟡 Serum Gel</span>
                        <span class="px-2 py-1 bg-slate-800 rounded-lg border border-slate-700">⚪ Fluoride Vial</span>
                      </div>
                    </div>

                    <!-- SCENE 2: Smart Result Entry & Normal Ranges -->
                    <div *ngIf="activeVideoFeature() === 2" class="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl animate-in fade-in zoom-in-95 duration-300">
                      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <span class="text-xs font-bold text-purple-300 flex items-center">
                          <i class="fa-solid fa-microscope mr-1.5"></i> Live Result Entry & Normal Ranges
                        </span>
                        <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                          Age: 48Y (Male Ranges)
                        </span>
                      </div>
                      <div class="space-y-1.5 text-xs">
                        <div class="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span class="text-slate-300 font-medium">Hemoglobin (Hb)</span>
                          <span class="font-bold text-amber-400">10.2 g/dL <span class="text-[10px] px-1.5 py-0.5 bg-amber-500/20 rounded font-bold">LOW</span></span>
                          <span class="text-[10px] text-slate-400 font-mono">(13.0 - 17.0)</span>
                        </div>
                        <div class="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span class="text-slate-300 font-medium">Total Leukocyte Count (TLC)</span>
                          <span class="font-bold text-rose-400">14,200 /cu.mm <span class="text-[10px] px-1.5 py-0.5 bg-rose-500/20 rounded font-bold">HIGH</span></span>
                          <span class="text-[10px] text-slate-400 font-mono">(4,000 - 11,000)</span>
                        </div>
                        <div class="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span class="text-slate-300 font-medium">Platelet Count</span>
                          <span class="font-bold text-emerald-400">1.85 Lakh <span class="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 rounded font-bold">NORMAL</span></span>
                          <span class="text-[10px] text-slate-400 font-mono">(1.50 - 4.50)</span>
                        </div>
                      </div>
                      <div class="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between">
                        <span>Digital Sign: <strong>Dr. Rajesh V. Mehta (MD Pathologist)</strong></span>
                        <span class="font-bold">✓ Approved</span>
                      </div>
                    </div>

                    <!-- SCENE 3: WhatsApp PDF Report Delivery & QR -->
                    <div *ngIf="activeVideoFeature() === 3" class="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl animate-in fade-in zoom-in-95 duration-300">
                      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <span class="text-xs font-bold text-emerald-300 flex items-center">
                          <i class="fa-brands fa-whatsapp mr-1.5"></i> Instant WhatsApp PDF Gateway
                        </span>
                        <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                          ✓ Sent (0 SMS Cost)
                        </span>
                      </div>
                      <div class="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-3 text-xs space-y-2 max-w-sm mx-auto">
                        <div class="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                          <i class="fa-solid fa-file-pdf text-lg text-rose-400"></i>
                          <span>DigitalLab_Report_Ramesh_Verma.pdf</span>
                        </div>
                        <p class="text-[11px] text-slate-300 leading-relaxed">
                          "Namaste Ramesh Verma, aapki Complete Blood Count report ready hai. Scan QR code to verify original signed copy."
                        </p>
                        <div class="flex items-center justify-between pt-1 border-t border-emerald-900/60 text-[10px] text-emerald-400 font-mono">
                          <span>🔒 QR Code Verified</span>
                          <span>Delivered • 10:42 AM</span>
                        </div>
                      </div>
                    </div>

                    <!-- SCENE 4: Doctor Commission Settlements -->
                    <div *ngIf="activeVideoFeature() === 4" class="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl animate-in fade-in zoom-in-95 duration-300">
                      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <span class="text-xs font-bold text-amber-300 flex items-center">
                          <i class="fa-solid fa-receipt mr-1.5"></i> Doctor Referral Settlement Voucher
                        </span>
                        <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                          Zero Disputes
                        </span>
                      </div>
                      <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                        <div class="flex justify-between text-slate-300">
                          <span>Doctor Name:</span>
                          <strong class="text-white">Dr. S. K. Gupta (Cardiology)</strong>
                        </div>
                        <div class="flex justify-between text-slate-300">
                          <span>Referred Cases (October):</span>
                          <strong class="text-cyan-400">42 Cases</strong>
                        </div>
                        <div class="flex justify-between text-slate-300">
                          <span>Total Lab Revenue:</span>
                          <strong class="text-white">₹38,500.00</strong>
                        </div>
                        <div class="flex justify-between pt-1 border-t border-slate-800 text-amber-300 font-bold">
                          <span>Referral Commission (15%):</span>
                          <span class="text-sm">₹5,775.00</span>
                        </div>
                      </div>
                      <div class="p-2 bg-slate-800 rounded-lg text-center text-[10px] text-slate-300 font-mono">
                        Official Signed Settlement Voucher Ready for Instant Payout
                      </div>
                    </div>

                    <!-- Live Hindi Voice Narration Subtitles Box -->
                    <div class="p-3 bg-slate-900/95 border border-cyan-500/30 rounded-2xl text-xs text-cyan-200 flex items-start space-x-2.5 shadow-xl">
                      <div class="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs shrink-0 mt-0.5">
                        <i class="fa-solid fa-volume-high" [ngClass]="voiceEnabled() && isPlaying() ? 'animate-pulse text-cyan-400' : 'text-slate-500'"></i>
                      </div>
                      <div class="flex-1 space-y-0.5">
                        <div class="flex items-center justify-between">
                          <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center">
                            <i class="fa-solid fa-microphone text-[9px] mr-1"></i> Hindi Voice Narration:
                          </span>
                          <span *ngIf="voiceEnabled() && isPlaying()" class="text-[9px] font-mono text-emerald-400 font-bold animate-pulse">● Speaking Live</span>
                          <span *ngIf="!voiceEnabled()" class="text-[9px] font-mono text-amber-400 font-semibold">(Voice Muted)</span>
                        </div>
                        <p class="text-[11px] sm:text-xs text-slate-200 leading-relaxed font-medium">
                          "{{ videoFeatures[activeVideoFeature()].narrationHindi }}"
                        </p>
                      </div>
                    </div>

                  </div>

                  <!-- Bottom Custom Controls Bar with Real Play/Pause & Progress -->
                  <div class="relative z-10 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div class="flex items-center space-x-2 sm:space-x-3">
                      <!-- Play / Pause Button -->
                      <button type="button" (click)="togglePlay()"
                        class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                        [title]="isPlaying() ? 'Pause' : 'Play'">
                        <i class="fa-solid" [ngClass]="isPlaying() ? 'fa-pause' : 'fa-play'"></i>
                      </button>

                      <!-- Quick Voice Toggle Button -->
                      <button type="button" (click)="toggleVoice()"
                        class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                        [title]="voiceEnabled() ? 'Mute Voice' : 'Enable Voice'">
                        <i class="fa-solid" [ngClass]="voiceEnabled() ? 'fa-volume-high text-cyan-400' : 'fa-volume-xmark text-slate-500'"></i>
                      </button>

                      <!-- Running Time Counter -->
                      <span class="text-[11px] font-mono text-slate-300 min-w-[70px]">
                        00:{{ currentTimeSec() < 10 ? '0' + currentTimeSec() : currentTimeSec() }} / {{ videoFeatures[activeVideoFeature()].duration }}
                      </span>

                      <!-- Animated Progress Track -->
                      <div (click)="restartVideo()" title="Click to restart chapter"
                        class="w-16 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer">
                        <div class="h-full bg-gradient-to-r from-cyan-400 via-brand-400 to-emerald-400 transition-all duration-300 rounded-full"
                          [style.width.%]="videoProgress()"></div>
                      </div>
                    </div>

                    <div class="flex items-center space-x-2">
                      <button type="button" (click)="selectFeature((activeVideoFeature() + 1) % videoFeatures.length)"
                        class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 transition-colors cursor-pointer"
                        title="Next Feature">
                        Next &rarr;
                      </button>
                      <a routerLink="/login" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-90 text-white font-black text-[11px] shadow transition-all">
                        Try Live Free &rarr;
                      </a>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- INTERACTIVE LAB REVENUE & ROI CALCULATOR -->
      <section id="calculator" class="py-20 bg-slate-50/70 border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center space-y-3 max-w-3xl mx-auto">
            <span class="px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold uppercase tracking-wider">
              💰 Live ROI Estimator
            </span>
            <h2 class="text-3xl sm:text-5xl font-black font-heading text-slate-900">Calculate Your Lab's Growth & Savings</h2>
            <p class="text-xs sm:text-base text-slate-600">See how much time and money DigitalLab saves your clinic every single month.</p>
          </div>

          <!-- Interactive Calculator Widget Card -->
          <div class="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 max-w-4xl mx-auto shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            <!-- Sliders Column -->
            <div class="space-y-6 text-xs">
              <!-- Slider 1 -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-slate-700">Daily Patient Cases:</span>
                  <span class="text-lg font-black text-brand-600">{{ dailyCases() }} cases / day</span>
                </div>
                <input type="range" [(ngModel)]="dailyCases" min="5" max="300" step="5"
                  class="w-full accent-brand-600 cursor-pointer">
                <div class="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>5 cases</span>
                  <span>150 cases</span>
                  <span>300 cases</span>
                </div>
              </div>

              <!-- Slider 2 -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-slate-700">Average Bill Amount per Case:</span>
                  <span class="text-lg font-black text-emerald-600">₹{{ avgBill() }}</span>
                </div>
                <input type="range" [(ngModel)]="avgBill" min="200" max="2500" step="50"
                  class="w-full accent-emerald-600 cursor-pointer">
                <div class="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>₹200</span>
                  <span>₹1,200</span>
                  <span>₹2,500</span>
                </div>
              </div>

              <!-- Slider 3 -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-slate-700">Doctor Referral Commission Share:</span>
                  <span class="text-lg font-black text-amber-600">{{ doctorCommissionPct() }}%</span>
                </div>
                <input type="range" [(ngModel)]="doctorCommissionPct" min="0" max="40" step="1"
                  class="w-full accent-amber-600 cursor-pointer">
                <div class="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>0%</span>
                  <span>20%</span>
                  <span>40%</span>
                </div>
              </div>
            </div>

            <!-- Output ROI Card -->
            <div class="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 text-center text-white shadow-xl">
              <div>
                <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Estimated Monthly Lab Billing</span>
                <div class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mt-1">
                  ₹{{ monthlyRevenue() | number:'1.0-0' }}
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div class="p-3 bg-slate-800/80 rounded-xl">
                  <div class="text-[10px] text-slate-400">Staff Time Saved</div>
                  <div class="text-lg font-bold text-cyan-300 mt-0.5">{{ hoursSaved() }} Hours / mo</div>
                </div>
                <div class="p-3 bg-slate-800/80 rounded-xl">
                  <div class="text-[10px] text-slate-400">Doctor Commission</div>
                  <div class="text-lg font-bold text-amber-400 mt-0.5">₹{{ monthlyDoctorCommission() | number:'1.0-0' }}</div>
                </div>
              </div>

              <div class="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold">
                🚀 Net Projected Monthly Profit: ₹{{ netProfit() | number:'1.0-0' }}
              </div>

              <a routerLink="/login" class="block w-full py-3 bg-gradient-to-r from-cyan-500 via-brand-500 to-emerald-500 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-lg transition-all">
                Start Automating for Just ₹499/mo &rarr;
              </a>
            </div>

          </div>

        </div>
      </section>

      <!-- 15+ CORE MODULES GRID -->
      <section id="features" class="py-24 bg-white border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div class="text-center space-y-3 max-w-3xl mx-auto">
            <span class="px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold uppercase tracking-wider">
              Complete Pathology Suite
            </span>
            <h2 class="text-3xl sm:text-5xl font-black font-heading text-slate-900">15+ Integrated Power Modules</h2>
            <p class="text-xs sm:text-base text-slate-600">Everything needed to run a solo laboratory, phlebotomy collection centre, or multi-branch diagnostic hospital.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div class="p-6 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-cyan-400 hover:shadow-xl transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-user-injured"></i>
              </div>
              <h3 class="text-lg font-bold text-slate-900 font-heading">1. Patient Intake & Duplicate Search</h3>
              <p class="text-xs text-slate-600 leading-relaxed">Instant lookup by 10-digit mobile number, unique UHID generator, patient visit history, and age/gender auto-computation.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-xl transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-cash-register"></i>
              </div>
              <h3 class="text-lg font-bold text-slate-900 font-heading">2. Split Billing & POS Counter</h3>
              <p class="text-xs text-slate-600 leading-relaxed">Advance receipts, discount limits, due balance tracking, and split payments (Physical Cash Desk, Dynamic UPI QR, and Card Swipes).</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-brand-400 hover:shadow-xl transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-barcode"></i>
              </div>
              <h3 class="text-lg font-bold text-slate-900 font-heading">3. Thermal Barcode Tube Stickers</h3>
              <p class="text-xs text-slate-600 leading-relaxed">50x25mm thermal barcode sticker printing for EDTA, Serum, and Fluoride tubes. Never mix up samples at centrifuge station.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-purple-400 hover:shadow-xl transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-microscope"></i>
              </div>
              <h3 class="text-lg font-bold text-slate-900 font-heading">4. Smart Result Entry & Range Badges</h3>
              <p class="text-xs text-slate-600 leading-relaxed">Age/gender specific normal reference intervals. Auto-highlights Low/High and Critical panic values with dynamic medical formulas.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-xl transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-signature"></i>
              </div>
              <h3 class="text-lg font-bold text-slate-900 font-heading">5. Pathologist Digital Signoff</h3>
              <p class="text-xs text-slate-600 leading-relaxed">Doctor approval workflows with custom digital signatures, clinical impressions, interpretations, and NABL disclaimer headers.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-xl transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-brands fa-whatsapp"></i>
              </div>
              <h3 class="text-lg font-bold text-slate-900 font-heading">6. 1-Click WhatsApp PDF Sharing</h3>
              <p class="text-xs text-slate-600 leading-relaxed">Deliver reports directly to patient WhatsApp with secure cloud download link and test summary—at zero extra SMS cost.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-xl transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-user-doctor"></i>
              </div>
              <h3 class="text-lg font-bold text-slate-900 font-heading">7. Doctor Commission Settlement</h3>
              <p class="text-xs text-slate-600 leading-relaxed">Track referral cases by doctor, calculate exact percentage commissions, record payouts, and generate official signed Settlement Vouchers.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-rose-400 hover:shadow-xl transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-book-open"></i>
              </div>
              <h3 class="text-lg font-bold text-slate-900 font-heading">8. Day-End Counter Closing Ledger</h3>
              <p class="text-xs text-slate-600 leading-relaxed">Live reconciliation for cashier desks. Matches physical cash against UPI, POS cards, discounts, and uncollected dues for audit proof.</p>
            </div>

            <div class="p-6 rounded-3xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-teal-400 hover:shadow-xl transition-all space-y-3 group">
              <div class="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-sliders"></i>
              </div>
              <h3 class="text-lg font-bold text-slate-900 font-heading">9. Pre-Printed Letterhead Margins</h3>
              <p class="text-xs text-slate-600 leading-relaxed">Visual slider controls for Top, Bottom, Left, and Right margins (mm) so reports fit your existing pre-printed laboratory pads flawlessly.</p>
            </div>

          </div>

        </div>
      </section>

      <!-- ABOUT US SECTION -->
      <section id="about" class="py-24 bg-gradient-to-b from-white via-slate-50/80 to-white border-t border-slate-200 relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <!-- Section Header -->
          <div class="text-center space-y-4 max-w-3xl mx-auto">
            <span class="px-3.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold uppercase tracking-wider inline-flex items-center">
              <i class="fa-solid fa-circle-info mr-2 text-brand-600"></i> About DigitalLab
            </span>
            <h2 class="text-3xl sm:text-5xl font-black font-heading text-slate-900 leading-tight">
              India's Leading Cloud Pathology Platform
            </h2>
            <p class="text-xs sm:text-base text-slate-600 leading-relaxed">
              Humara lakshya hai Bharat ke har pathology lab, phlebotomy centre aur diagnostic hospital ko paperless, error-free aur 100% digital banana.
            </p>
          </div>

          <!-- Story & Mission 2-Column Banner -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
            <div class="lg:col-span-7 space-y-4">
              <div class="inline-flex items-center space-x-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <i class="fa-solid fa-bullseye text-emerald-600"></i>
                <span>Our Mission & Vision</span>
              </div>
              <h3 class="text-2xl sm:text-3xl font-black font-heading text-slate-900">
                Building the Future of Digital Healthcare Diagnostics
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Traditional desktop-based pathology softwares purane ho chuke hain—unme computer virus ka dar rehta hai, WhatsApp report delivery nahi hoti, aur doctor referral commission calculate karne me roz ghanto barbad hote hain.
              </p>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                <strong>DigitalLab</strong> ek modern 100% Cloud LIMS hai jisme zero installation ki zaroorat hai. Kisi bhi laptop, desktop ya mobile par instant login kijiye aur apne laboratory ko smart, fast aur NABL compliance ready banayein.
              </p>
              <div class="pt-2 flex flex-wrap gap-4 text-xs font-bold text-slate-700">
                <div class="flex items-center"><i class="fa-solid fa-check-double text-emerald-600 mr-2"></i> Zero Hardware Dependency</div>
                <div class="flex items-center"><i class="fa-solid fa-check-double text-emerald-600 mr-2"></i> Daily Auto Cloud Backups</div>
                <div class="flex items-center"><i class="fa-solid fa-check-double text-emerald-600 mr-2"></i> 24/7 Dedicated Indian Helpline</div>
              </div>
            </div>

            <!-- Stats Showcase Right -->
            <div class="lg:col-span-5 grid grid-cols-2 gap-4">
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <div class="text-3xl font-black text-brand-600 font-heading">1,200+</div>
                <div class="text-xs font-bold text-slate-800">Active Pathology Labs</div>
                <div class="text-[10px] text-slate-400">Across 28 States in India</div>
              </div>
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <div class="text-3xl font-black text-emerald-600 font-heading">500,000+</div>
                <div class="text-xs font-bold text-slate-800">Reports Delivered</div>
                <div class="text-[10px] text-slate-400">Via Instant WhatsApp QR</div>
              </div>
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <div class="text-3xl font-black text-cyan-600 font-heading">99.99%</div>
                <div class="text-xs font-bold text-slate-800">Cloud Uptime SLA</div>
                <div class="text-[10px] text-slate-400">Zero Server Downtime</div>
              </div>
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <div class="text-3xl font-black text-amber-600 font-heading">100%</div>
                <div class="text-xs font-bold text-slate-800">Data Encryption</div>
                <div class="text-[10px] text-slate-400">256-bit Bank-Grade SSL</div>
              </div>
            </div>
          </div>

          <!-- 4 Core Pillars Grid -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div class="p-6 rounded-3xl bg-white hover:shadow-xl border border-slate-200 transition-all space-y-3">
              <div class="w-11 h-11 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center text-lg font-bold">
                <i class="fa-solid fa-cloud-bolt"></i>
              </div>
              <h4 class="font-bold text-slate-900 text-sm font-heading">100% Cloud Native</h4>
              <p class="text-xs text-slate-500 leading-relaxed">
                Kabhi data loss ya virus ka risk nahi. Kahin se bhi apne phone ya PC par lab ka live status check karein.
              </p>
            </div>

            <div class="p-6 rounded-3xl bg-white hover:shadow-xl border border-slate-200 transition-all space-y-3">
              <div class="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold">
                <i class="fa-solid fa-shield-halved"></i>
              </div>
              <h4 class="font-bold text-slate-900 text-sm font-heading">NABL & ISO Compliant</h4>
              <p class="text-xs text-slate-500 leading-relaxed">
                Age/gender dynamic reference intervals, critical panic highlights, aur digital pathologist signoffs.
              </p>
            </div>

            <div class="p-6 rounded-3xl bg-white hover:shadow-xl border border-slate-200 transition-all space-y-3">
              <div class="w-11 h-11 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center text-lg font-bold">
                <i class="fa-solid fa-indian-rupee-sign"></i>
              </div>
              <h4 class="font-bold text-slate-900 text-sm font-heading">Made for Indian Labs</h4>
              <p class="text-xs text-slate-500 leading-relaxed">
                Doctor referral commission settlement vouchers, thermal POS receipts, aur WhatsApp PDF delivery.
              </p>
            </div>

            <div class="p-6 rounded-3xl bg-white hover:shadow-xl border border-slate-200 transition-all space-y-3">
              <div class="w-11 h-11 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg font-bold">
                <i class="fa-solid fa-headset"></i>
              </div>
              <h4 class="font-bold text-slate-900 text-sm font-heading">Direct Hindi/English Help</h4>
              <p class="text-xs text-slate-500 leading-relaxed">
                Free test catalog setup aur WhatsApp par instant technical assistance hamare dedicated support team se.
              </p>
            </div>

          </div>

        </div>
      </section>

      <!-- TESTIMONIALS & REVIEWS -->
      <section class="py-20 bg-slate-50/70 border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center space-y-3 max-w-2xl mx-auto">
            <span class="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold uppercase tracking-wider">
              ⭐ Trusted by Doctors Across India
            </span>
            <h2 class="text-3xl sm:text-4xl font-black font-heading text-slate-900">What Pathologists Say About Us</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div class="flex text-amber-400 text-xs space-x-1">
                <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
              </div>
              <p class="text-xs text-slate-700 italic leading-relaxed">
                "Pehele hamare lab me daily sham ko doctor commission aur cash counter calculate karne me 2 ghante lagte the. DigitalLab ne sab kuch automated kar diya. Settlement Voucher feature bohot transparent hai!"
              </p>
              <div class="flex items-center space-x-3 pt-2 border-t border-slate-100">
                <div class="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center">
                  DS
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-xs">Dr. S. K. Verma</div>
                  <div class="text-[10px] text-slate-500">Verma Pathcare Labs, Patna</div>
                </div>
              </div>
            </div>

            <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div class="flex text-amber-400 text-xs space-x-1">
                <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
              </div>
              <p class="text-xs text-slate-700 italic leading-relaxed">
                "Barcode sample stickers aur WhatsApp PDF report delivery ne hamare lab ki branding bohot premium bana di hai. Patients QR code scan karke direct report download kar lete hain!"
              </p>
              <div class="flex items-center space-x-3 pt-2 border-t border-slate-100">
                <div class="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 font-bold flex items-center justify-center">
                  DA
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-xs">Dr. Ananya Sen</div>
                  <div class="text-[10px] text-slate-500">Apex Diagnostics, Kolkata</div>
                </div>
              </div>
            </div>

            <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div class="flex text-amber-400 text-xs space-x-1">
                <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
              </div>
              <p class="text-xs text-slate-700 italic leading-relaxed">
                "Pre-printed letterhead margins ka slider itna simple hai ki 2 minute me hamare printed stationery me exact fit ho gaya. Technical support WhatsApp par instant reply karti hai."
              </p>
              <div class="flex items-center space-x-3 pt-2 border-t border-slate-100">
                <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                  DR
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-xs">Dr. Rajesh V. Mehta</div>
                  <div class="text-[10px] text-slate-500">City Diagnostics Centre, Mumbai</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- PRICING PLANS -->
      <section id="pricing" class="py-24 bg-white border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center space-y-4 max-w-3xl mx-auto">
            <span class="px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold uppercase tracking-wider">
              Transparent & Affordable
            </span>
            <h2 class="text-3xl sm:text-5xl font-black font-heading text-slate-900">Simple, Honest Pricing</h2>
            <p class="text-xs sm:text-base text-slate-600">Zero hidden fees. Pay easily with Instant UPI QR / Google Pay / PhonePe / Paytm / Cards.</p>

            <!-- Toggle -->
            <div class="inline-flex items-center p-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
              <button type="button" (click)="billingCycle.set('Monthly')"
                [class]="billingCycle() === 'Monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
                class="px-4 py-2 rounded-xl transition-all cursor-pointer">
                Monthly Plan
              </button>
              <button type="button" (click)="billingCycle.set('Annual')"
                [class]="billingCycle() === 'Annual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
                class="px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer">
                <span>Annual Plan</span>
                <span class="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">20% OFF</span>
              </button>
            </div>
          </div>

          <!-- Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            <!-- Starter -->
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all">
              <div class="space-y-4">
                <div>
                  <h3 class="text-xl font-bold text-slate-900 font-heading">Starter Lab</h3>
                  <p class="text-xs text-slate-500 mt-1">For new collection centres & single-technician labs.</p>
                </div>

                <div>
                  <div class="text-4xl font-black text-slate-900 font-heading">
                    ₹{{ billingCycle() === 'Annual' ? '499' : '599' }}
                    <span class="text-xs font-normal text-slate-500">/ month</span>
                  </div>
                  <div class="text-[10px] text-slate-500 mt-1">{{ billingCycle() === 'Annual' ? '₹5,988 billed annually' : 'Billed monthly' }}</div>
                </div>

                <ul class="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> Up to <strong>150 cases / month</strong></li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> <strong>2 Staff user logins</strong></li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> Thermal POS Billing Receipts</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> WhatsApp PDF Reports</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> Standard Master Test Catalog</li>
                </ul>
              </div>

              <a routerLink="/login" class="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs text-center border border-slate-200 transition-all">
                Start 14-Day Free Trial
              </a>
            </div>

            <!-- Pro -->
            <div class="bg-gradient-to-b from-brand-50/50 via-white to-white rounded-3xl p-6 sm:p-8 border-2 border-brand-600 flex flex-col justify-between space-y-6 shadow-xl shadow-brand-500/10 relative">
              <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                ⭐ Recommended by Pathologists
              </div>

              <div class="space-y-4">
                <div>
                  <h3 class="text-xl font-bold text-slate-900 font-heading">Professional Lab</h3>
                  <p class="text-xs text-slate-500 mt-1">For busy diagnostic centres & pathology clinics.</p>
                </div>

                <div>
                  <div class="text-4xl font-black text-slate-900 font-heading">
                    ₹{{ billingCycle() === 'Annual' ? '999' : '1,199' }}
                    <span class="text-xs font-normal text-slate-500">/ month</span>
                  </div>
                  <div class="text-[10px] text-brand-600 font-semibold mt-1">{{ billingCycle() === 'Annual' ? '₹11,988 billed annually' : 'Billed monthly' }}</div>
                </div>

                <ul class="space-y-2.5 text-xs text-slate-700 border-t border-slate-100 pt-4">
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> <strong>Unlimited patient cases</strong></li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> <strong>10 Staff accounts</strong> (Tech + Billing)</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> 50x25mm Barcode Tube Label Engine</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> Doctor Commission Settlement Vouchers</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> Custom Letterhead Margin Calibrator</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> Live Day-End Cash Closeout Ledger</li>
                </ul>
              </div>

              <a routerLink="/login" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-brand-600 to-emerald-600 text-white font-black text-xs text-center shadow-lg shadow-brand-500/25 hover:scale-105 transition-all">
                Start 14-Day Free Trial (All Features)
              </a>
            </div>

            <!-- Enterprise -->
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all">
              <div class="space-y-4">
                <div>
                  <h3 class="text-xl font-bold text-slate-900 font-heading">Hospital & Franchise</h3>
                  <p class="text-xs text-slate-500 mt-1">Multi-branch hospital chains & collection hubs.</p>
                </div>

                <div>
                  <div class="text-4xl font-black text-slate-900 font-heading">
                    ₹{{ billingCycle() === 'Annual' ? '2,499' : '2,999' }}
                    <span class="text-xs font-normal text-slate-500">/ month</span>
                  </div>
                  <div class="text-[10px] text-slate-500 mt-1">Multi-centre hub & branch permissions</div>
                </div>

                <ul class="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> Unlimited cases & collection centres</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> <strong>Unlimited staff & pathologist logins</strong></li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> Multi-Tenant Central Management</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> 24/7 Dedicated WhatsApp Helpline</li>
                  <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 font-bold"></i> Free Custom Test Data Migration</li>
                </ul>
              </div>

              <a routerLink="/login" class="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs text-center border border-slate-200 transition-all">
                Contact Sales / Start Trial
              </a>
            </div>

          </div>

        </div>
      </section>

      <!-- FINAL CTA CALLOUT BANNER -->
      <section class="py-16 bg-gradient-to-r from-brand-700 via-cyan-700 to-emerald-700 text-white relative overflow-hidden">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 class="text-3xl sm:text-5xl font-black font-heading text-white leading-tight">
            Ready to Upgrade Your Pathology Lab?
          </h2>
          <p class="text-xs sm:text-base text-cyan-100 max-w-2xl mx-auto">
            Join 1,200+ pathologists across India. Get set up in under 60 seconds with our pre-loaded 500+ test catalog!
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <a routerLink="/login" class="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm bg-white text-brand-700 shadow-2xl hover:scale-105 transition-all">
              🚀 Start 14-Day Free Trial (Instant Access)
            </a>
            <a href="https://wa.me/917706087066?text=Hello%20DigitalLab%20Team%2C%20I%20want%20a%20live%20demo%20of%20DigitalLab%20Pathology%20Software" target="_blank"
              class="w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center space-x-2 transition-all border border-emerald-400/40">
              <i class="fa-brands fa-whatsapp text-lg"></i>
              <span>WhatsApp Live Help (+91 7706087066)</span>
            </a>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="py-12 bg-slate-50 border-t border-slate-200 text-slate-600 text-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center space-x-3">
            <img src="logo.png" alt="DigitalLab" class="w-8 h-8 rounded-xl object-contain shadow-sm">
            <div>
              <span class="font-bold text-slate-900">DigitalLab</span>
            </div>
          </div>
          <div class="flex items-center space-x-6 text-slate-600 font-medium">
            <a href="#about" class="hover:text-brand-600 transition-colors">About Us</a>
            <a href="#video-tour" class="hover:text-brand-600 transition-colors">Video Tour</a>
            <a routerLink="/login" class="hover:text-brand-600 transition-colors">Lab Login</a>
            <a routerLink="/login" class="hover:text-brand-600 transition-colors">Super Admin</a>
            <a href="https://wa.me/917706087066" target="_blank" class="hover:text-emerald-600 transition-colors">WhatsApp Support</a>
          </div>
          <div class="text-[11px] text-slate-500">
            © 2026 DigitalLab Technologies. All rights reserved.
          </div>
        </div>
      </footer>

      <!-- FLOATING REPLAY FLOWER SHOWER BUTTON -->
      <button type="button" (click)="triggerFlowerShower()"
        class="fixed bottom-6 left-6 z-50 px-4 py-3 bg-white/95 hover:bg-white text-rose-700 hover:text-rose-800 border border-rose-200/90 rounded-2xl shadow-xl shadow-rose-500/15 flex items-center space-x-2.5 hover:scale-105 transition-all group cursor-pointer backdrop-blur-md"
        title="फूलों की बारिश (Shower Festive Flower Petals)">
        <span class="text-xl group-hover:rotate-12 transition-transform">🌸</span>
        <span class="font-bold text-xs hidden sm:inline text-slate-800">फूलों की बारिश</span>
        <span class="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">Replay</span>
      </button>

      <!-- FLOATING WHATSAPP BUTTON -->
      <a href="https://wa.me/917706087066?text=Hello%20DigitalLab%20Team%2C%20I%20want%20to%20learn%20more%20about%20the%20Pathology%20Software" target="_blank"
        class="fixed bottom-6 right-6 z-50 p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-2xl shadow-emerald-500/40 flex items-center space-x-2 hover:scale-105 transition-all group cursor-pointer"
        title="Chat with WhatsApp Support">
        <i class="fa-brands fa-whatsapp text-2xl"></i>
        <span class="hidden sm:inline font-bold text-xs pr-1">Live Help</span>
      </a>

    </div>
  `
})
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('flowerCanvas') flowerCanvasRef!: ElementRef<HTMLCanvasElement>;
  flowerShowerActive = signal(true);
  private flowerAnimId: number | null = null;
  private showerStartTime = 0;
  private readonly SHOWER_DURATION_MS = 14000;
  private petals: FlowerPetal[] = [];
  private onResizeBound = () => this.handleCanvasResize();

  mobileMenuOpen = signal(false);
  billingCycle = signal<'Monthly' | 'Annual'>('Annual');
  activeVideoFeature = signal(0);
  isPlaying = signal(false);
  voiceEnabled = signal(true);
  videoProgress = signal(0);
  currentTimeSec = signal(0);
  private timerInterval: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private playbackStartTime = 0;

  videoFeatures = [
    {
      id: 0,
      title: '1. Fast Patient Intake & UHID',
      duration: '00:10',
      durationSec: 10,
      icon: 'fa-user-injured',
      description: 'Search patient by 10-digit mobile number, generate UHID automatically, calculate age/gender, and assign referring doctor in under 10 seconds.',
      narrationHindi: 'DigitalLab me Patient Registration aur Billing behad aasan hai. Sirf 10 digit mobile number daliye, duplicate check ho jayega, UHID generate hoga aur test select karte hi automatic billing ho jayegi.',
      bullets: ['Auto duplicate check by mobile', 'UHID barcode generation', 'Quick test selector with instant search']
    },
    {
      id: 1,
      title: '2. Barcode Tube Sticker Printing',
      duration: '00:09',
      durationSec: 9,
      icon: 'fa-barcode',
      description: 'Print 50x25mm thermal barcode labels for EDTA, Serum, and Fluoride vials with 1 click. Never confuse sample vials during centrifuge.',
      narrationHindi: 'Sample collection ke baad, EDTA, Serum aur Fluoride vials ke liye ek click me thermal barcode label print kijiye. Centrifuge ya test desk par sample mix hone ki koi tension nahi.',
      bullets: ['Works with all thermal barcode printers', 'Color-coded tube indicators', 'Scan-to-open case on technician desk']
    },
    {
      id: 2,
      title: '3. Smart Test Results & Normal Ranges',
      duration: '00:12',
      durationSec: 12,
      icon: 'fa-microscope',
      description: 'Age and gender-adjusted normal reference intervals with automatic High/Low panic flags, medical formulas, and standard comments.',
      narrationHindi: 'Investigation aur Result Entry me age aur gender ke hisab se normal ranges automatic aati hain. Critical aur Panic values turant red color me highlight ho jati hain aur digital signature ke sath report ready hoti hai.',
      bullets: ['Critical panic values highlighted in red', 'Pre-filled standard clinical templates', 'Digital signature signoff workflow']
    },
    {
      id: 3,
      title: '4. WhatsApp 1-Click PDF Report & QR',
      duration: '00:10',
      durationSec: 10,
      icon: 'fa-brands fa-whatsapp',
      description: 'Send high-resolution PDF diagnostic reports directly to patient WhatsApp with anti-tamper QR code verification link.',
      narrationHindi: 'Patient ko bina mobile number save kiye, direct WhatsApp par tamper-proof QR code wali professional PDF report share kijiye. Patient QR scan karke kabhi bhi original report download kar sakta hai.',
      bullets: ['Instant PDF delivery without saving contact', 'Live QR code report verification', 'Custom lab header or pre-printed pad fit']
    },
    {
      id: 4,
      title: '5. Doctor Commission Settlements',
      duration: '00:09',
      durationSec: 9,
      icon: 'fa-user-doctor',
      description: 'Track patient referrals by doctor, compute exact percentage cuts, settle dues, and generate signed Commission Vouchers with zero disputes.',
      narrationHindi: 'Referring Doctors ka monthly commission calculation bilkul transparent hai. Har referral case ka revenue track kijiye aur one-click me official signed Settlement Voucher generate kijiye.',
      bullets: ['Doctor-wise referral case breakdown', 'Instant PDF voucher generation', 'Cash and online payout ledger']
    }
  ];

  ngOnInit(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Warm up voices in Chromium
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResizeBound);
      // Auto trigger flower shower upon opening the landing / index page
      setTimeout(() => this.initFlowerShower(), 150);
    }
  }

  ngOnDestroy(): void {
    this.stopPlaybackTimer();
    this.stopVoiceNarration();
    this.stopFlowerShower();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResizeBound);
    }
  }

  selectFeature(idx: number): void {
    this.activeVideoFeature.set(idx);
    this.videoProgress.set(0);
    this.currentTimeSec.set(0);
    if (this.isPlaying()) {
      this.startPlayback();
      this.playVoiceNarration();
    }
  }

  togglePlay(): void {
    if (this.isPlaying()) {
      this.pauseVideo();
    } else {
      this.playVideo();
    }
  }

  playVideo(): void {
    this.isPlaying.set(true);
    this.startPlayback();
    this.playVoiceNarration();
  }

  pauseVideo(): void {
    this.isPlaying.set(false);
    this.stopPlaybackTimer();
    this.stopVoiceNarration();
  }

  restartVideo(): void {
    this.videoProgress.set(0);
    this.currentTimeSec.set(0);
    if (!this.isPlaying()) {
      this.playVideo();
    } else {
      this.startPlayback();
      this.playVoiceNarration();
    }
  }

  toggleVoice(): void {
    const nextState = !this.voiceEnabled();
    this.voiceEnabled.set(nextState);
    if (nextState) {
      if (this.isPlaying()) {
        this.playVoiceNarration();
      }
    } else {
      this.stopVoiceNarration();
    }
  }

  private playVoiceNarration(): void {
    if (!this.voiceEnabled()) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();

      const feat = this.videoFeatures[this.activeVideoFeature()];
      const textToSpeak = feat.narrationHindi || feat.description;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      const voices = window.speechSynthesis.getVoices();
      // Look for Hindi voice, else Indian English voice, else default
      const hiVoice = voices.find(v => 
        (v.lang && (v.lang.toLowerCase().startsWith('hi') || v.lang.includes('IN'))) ||
        (v.name && (v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('hemant') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('neerja')))
      );

      if (hiVoice) {
        utterance.voice = hiVoice;
        utterance.lang = hiVoice.lang;
      } else {
        utterance.lang = 'hi-IN';
      }

      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // When voice finishes speaking, transition smoothly to next feature
      utterance.onend = () => {
        if (this.isPlaying()) {
          this.goToNextFeature();
        }
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[DigitalLab Voice] Speech synthesis unavailable:', e);
    }
  }

  private stopVoiceNarration(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.currentUtterance = null;
  }

  private stopPlaybackTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private startPlayback(): void {
    this.stopPlaybackTimer();
    this.playbackStartTime = Date.now();
    const feat = this.videoFeatures[this.activeVideoFeature()];
    const totalSec = feat.durationSec || 10;

    this.timerInterval = setInterval(() => {
      const elapsed = (Date.now() - this.playbackStartTime) / 1000;
      const progress = Math.min(100, Math.round((elapsed / totalSec) * 100));
      this.videoProgress.set(progress);
      this.currentTimeSec.set(Math.min(totalSec, Math.floor(elapsed)));

      if (elapsed >= totalSec) {
        this.goToNextFeature();
      }
    }, 100);
  }

  private goToNextFeature(): void {
    this.stopPlaybackTimer();
    if (this.activeVideoFeature() < this.videoFeatures.length - 1) {
      this.activeVideoFeature.update(v => v + 1);
      this.videoProgress.set(0);
      this.currentTimeSec.set(0);
      this.startPlayback();
      this.playVoiceNarration();
    } else {
      this.videoProgress.set(100);
      this.currentTimeSec.set(this.videoFeatures[this.activeVideoFeature()].durationSec);
      this.pauseVideo();
    }
  }

  // ROI Calculator Signals
  dailyCases = signal(35);
  avgBill = signal(650);
  doctorCommissionPct = signal(15);

  monthlyRevenue = computed(() => this.dailyCases() * this.avgBill() * 30);
  hoursSaved = computed(() => Math.round(this.dailyCases() * 1.8));
  monthlyDoctorCommission = computed(() => Math.round(this.monthlyRevenue() * (this.doctorCommissionPct() / 100)));
  netProfit = computed(() => Math.round(this.monthlyRevenue() - this.monthlyDoctorCommission() - 499));

  // ==========================================
  // FESTIVE FLOWER SHOWER (फूलों की बारिश)
  // ==========================================
  triggerFlowerShower(): void {
    this.flowerShowerActive.set(true);
    this.initFlowerShower();
  }

  private stopFlowerShower(): void {
    if (this.flowerAnimId) {
      cancelAnimationFrame(this.flowerAnimId);
      this.flowerAnimId = null;
    }
    this.petals = [];
  }

  private handleCanvasResize(): void {
    const canvas = this.flowerCanvasRef?.nativeElement;
    if (canvas && typeof window !== 'undefined') {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }

  private initFlowerShower(): void {
    if (typeof window === 'undefined') return;
    this.stopFlowerShower();

    const canvas = this.flowerCanvasRef?.nativeElement;
    if (!canvas) {
      setTimeout(() => this.initFlowerShower(), 100);
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.showerStartTime = Date.now();
    this.flowerShowerActive.set(true);

    const count = window.innerWidth < 640 ? 50 : 85;
    this.petals = [];
    for (let i = 0; i < count; i++) {
      this.petals.push(this.createPetal(false));
    }

    this.flowerAnimId = requestAnimationFrame(() => this.updateAndDrawPetals());
  }

  private createPetal(spawnAtTop: boolean): FlowerPetal {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;

    const types: ('rose' | 'marigold' | 'jasmine')[] = ['rose', 'rose', 'marigold', 'marigold', 'jasmine'];
    const type = types[Math.floor(Math.random() * types.length)];

    let color = '#e11d48';
    let colorLight = '#fecdd3';
    let colorDark = '#9f1239';

    if (type === 'rose') {
      const shades = [
        { c: '#e11d48', cl: '#fecdd3', cd: '#9f1239' }, // vibrant rose
        { c: '#be123c', cl: '#fda4af', cd: '#881337' }, // crimson red
        { c: '#f43f5e', cl: '#ffe4e6', cd: '#be123c' }, // bright pink rose
      ];
      const s = shades[Math.floor(Math.random() * shades.length)];
      color = s.c;
      colorLight = s.cl;
      colorDark = s.cd;
    } else if (type === 'marigold') {
      const shades = [
        { c: '#f59e0b', cl: '#fef08a', cd: '#b45309' }, // golden marigold
        { c: '#ea580c', cl: '#fed7aa', cd: '#9a3412' }, // festive saffron/orange
        { c: '#fbbf24', cl: '#fef9c3', cd: '#d97706' }, // bright golden yellow
      ];
      const s = shades[Math.floor(Math.random() * shades.length)];
      color = s.c;
      colorLight = s.cl;
      colorDark = s.cd;
    } else {
      // Jasmine / Bela
      color = '#fef9c3';
      colorLight = '#ffffff';
      colorDark = '#fef08a';
    }

    const size = type === 'marigold'
      ? Math.random() * 8 + 12
      : (type === 'rose' ? Math.random() * 9 + 14 : Math.random() * 6 + 9);

    return {
      x: Math.random() * width,
      y: spawnAtTop ? -size - Math.random() * 90 : Math.random() * height * 0.75,
      size,
      speedY: Math.random() * 1.6 + 1.2,
      speedX: (Math.random() - 0.5) * 0.9,
      swayAngle: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.03 + 0.015,
      swayRadius: Math.random() * 1.8 + 0.8,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.025,
      flipAngle: Math.random() * Math.PI * 2,
      flipSpeed: Math.random() * 0.04 + 0.02,
      opacity: Math.random() * 0.25 + 0.75,
      type,
      color,
      colorLight,
      colorDark
    };
  }

  private updateAndDrawPetals(): void {
    const canvas = this.flowerCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();
    const isActivelySpawning = (now - this.showerStartTime) < this.SHOWER_DURATION_MS;
    const height = canvas.height;

    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];

      // Physics update: sway side-to-side, fall with gravity, rotate and 3D flip
      p.swayAngle += p.swaySpeed;
      p.x += Math.sin(p.swayAngle) * p.swayRadius + p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;
      p.flipAngle += p.flipSpeed;

      // Check if fallen past bottom
      if (p.y > height + p.size * 2) {
        if (isActivelySpawning) {
          this.petals[i] = this.createPetal(true);
        } else {
          this.petals.splice(i, 1);
          continue;
        }
      }

      this.drawSinglePetal(ctx, p);
    }

    if (this.petals.length > 0) {
      this.flowerAnimId = requestAnimationFrame(() => this.updateAndDrawPetals());
    } else {
      this.flowerShowerActive.set(false);
      this.flowerAnimId = null;
    }
  }

  private drawSinglePetal(ctx: CanvasRenderingContext2D, p: FlowerPetal): void {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    // 3D tumble flip along horizontal axis
    const flip = Math.cos(p.flipAngle);
    ctx.scale(flip, 1);
    ctx.globalAlpha = p.opacity;

    if (p.type === 'rose') {
      // Elegant curved rose petal
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(
        p.size * 0.95, -p.size * 0.65,
        p.size * 1.15, p.size * 0.6,
        0, p.size
      );
      ctx.bezierCurveTo(
        -p.size * 1.15, p.size * 0.6,
        -p.size * 0.95, -p.size * 0.65,
        0, -p.size
      );
      const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, p.size);
      grad.addColorStop(0, p.colorLight);
      grad.addColorStop(0.65, p.color);
      grad.addColorStop(1, p.colorDark);
      ctx.fillStyle = grad;
      ctx.fill();

      // Subtle curved petal vein
      ctx.strokeStyle = p.colorDark;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.7);
      ctx.quadraticCurveTo(p.size * 0.1, 0, 0, p.size * 0.6);
      ctx.stroke();

    } else if (p.type === 'marigold') {
      // Elongated marigold floret with soft tip
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 1.25);
      ctx.bezierCurveTo(
        p.size * 0.55, -p.size * 0.6,
        p.size * 0.55, p.size * 0.7,
        0, p.size
      );
      ctx.bezierCurveTo(
        -p.size * 0.55, p.size * 0.7,
        -p.size * 0.55, -p.size * 0.6,
        0, -p.size * 1.25
      );
      const grad = ctx.createLinearGradient(0, -p.size * 1.25, 0, p.size);
      grad.addColorStop(0, p.colorLight);
      grad.addColorStop(0.6, p.color);
      grad.addColorStop(1, p.colorDark);
      ctx.fillStyle = grad;
      ctx.fill();

      // Soft spine line
      ctx.strokeStyle = p.colorLight;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.9);
      ctx.lineTo(0, p.size * 0.5);
      ctx.stroke();

    } else {
      // Jasmine / Bela petal
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, p.size);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.7, p.color);
      grad.addColorStop(1, p.colorDark);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.restore();
  }
}

