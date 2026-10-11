import { Component, OnInit, OnDestroy, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  decay: number;
  gravity: number;
  shimmer: boolean;
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  vy: number;
  color: string;
  exploded: boolean;
}

interface Confetti {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  alpha: number;
}

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-10 px-4 relative overflow-hidden font-sans select-none">
      
      <!-- Canvas for Grand Fireworks & Firecrackers -->
      <canvas #fireworksCanvas class="fixed inset-0 pointer-events-none z-50 w-full h-full" [class.hidden]="!showFireworks"></canvas>

      <!-- Background Atmosphere -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.12)_0%,rgba(2,6,23,0.95)_70%)] pointer-events-none"></div>
      <div class="absolute -top-32 -left-32 w-80 h-80 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Celebration Overlay during Fireworks -->
      <div *ngIf="showFireworks" class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-500">
        <div class="space-y-4 max-w-xl">
          <div class="inline-flex items-center px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black tracking-widest uppercase shadow-lg shadow-amber-400/20 animate-pulse">
            🌸 शुभ नवरात्रि • NAVRATRI GRAND LAUNCH 🌸
          </div>
          <h1 class="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tracking-tight drop-shadow-lg font-heading">
            💥 WEBSITE LAUNCHED! 💥
          </h1>
          <p class="text-sm sm:text-base text-slate-200 font-semibold drop-shadow">
            DigitalLab Cloud Pathology Platform is Now Live Worldwide on this Auspicious Navratri!
          </p>
          <div class="pt-4 flex items-center justify-center space-x-2 text-xs text-brand-300 font-mono">
            <i class="fa-solid fa-circle-notch fa-spin text-sm"></i>
            <span>Opening First Page in a moment...</span>
          </div>
        </div>
      </div>

      <!-- Main Launch Card -->
      <div *ngIf="!showFireworks" class="relative z-10 w-full max-w-md">
        
        <!-- Header Brand Icon & Navratri Badge -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wide uppercase shadow-sm mb-4">
            🌸 शुभ नवरात्रि • Grand Platform Inauguration 🌸
          </div>
          <div class="block">
            <div class="inline-flex p-4 bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl border border-slate-700/80 shadow-2xl shadow-brand-500/10 mb-4 ring-1 ring-white/10">
              <i class="fa-solid fa-rocket text-4xl text-transparent bg-clip-text bg-gradient-to-tr from-amber-400 via-orange-400 to-brand-400"></i>
            </div>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
            Official Production Launch
          </h1>
          <p class="mt-1.5 text-xs text-slate-300 font-medium">
            Type Password <span class="text-amber-400 font-bold font-mono">8866</span> to burst firecrackers & inaugurate website
          </p>
        </div>

        <div class="bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-slate-700/70 shadow-2xl shadow-black/80 space-y-6">
          
          <!-- Launch Code Input Box -->
          <form (ngSubmit)="onTriggerLaunch()" class="space-y-5">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 text-center">
                Secret Launch Code (Type <span class="text-amber-400 font-mono">8866</span>)
              </label>
              
              <div class="relative max-w-xs mx-auto">
                <input #pinInput type="password" [(ngModel)]="launchCode" (ngModelChange)="onCodeChange($event)" name="launchCode" autofocus required
                  maxlength="10" placeholder="••••"
                  class="block w-full text-center tracking-[0.6em] text-2xl font-mono font-black py-3.5 bg-slate-950/90 border-2 border-slate-700 focus:border-amber-400 rounded-2xl text-amber-300 placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-amber-400/20 transition-all shadow-inner">
              </div>
            </div>

            <!-- Error Banner -->
            <div *ngIf="errorMessage" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-center text-center animate-in fade-in">
              <i class="fa-solid fa-circle-exclamation mr-2 shrink-0"></i>
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Launch Button -->
            <button type="submit" [disabled]="loading"
              class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50">
              <i *ngIf="loading" class="fa-solid fa-circle-notch fa-spin text-base"></i>
              <i *ngIf="!loading" class="fa-solid fa-wand-magic-sparkles text-base"></i>
              <span>{{ loading ? 'Inaugurating Platform...' : '💥 Launch Website with Fireworks' }}</span>
            </button>
          </form>

          <!-- Quick Code Preset Buttons -->
          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-center space-x-2">
            <span class="text-[11px] text-slate-500 font-medium">Quick Fill:</span>
            <button type="button" (click)="launchCode = '8866'; onTriggerLaunch()"
              class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono text-xs font-bold border border-slate-700 transition-all cursor-pointer">
              8866
            </button>
          </div>

        </div>

        <!-- Footer Note -->
        <p class="text-center text-[11px] text-slate-400 mt-6 font-medium">
          DigitalLab Cloud Pathology Platform • Auspicious Navratri Launch
        </p>

      </div>
    </div>
  `
})
export class SetupComponent implements OnInit, OnDestroy {
  @ViewChild('fireworksCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private api = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  launchCode = '';
  loading = false;
  showFireworks = false;
  errorMessage = '';

  private audioCtx: AudioContext | null = null;
  private animFrameId: number | null = null;
  private particles: Particle[] = [];
  private rockets: Rocket[] = [];
  private confettiList: Confetti[] = [];
  private canvasWidth = 0;
  private canvasHeight = 0;
  private colors = ['#f59e0b', '#ef4444', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#ffffff', '#fbbf24'];

  ngOnInit() {
    this.initAudio();
  }

  ngOnDestroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  private initAudio() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch {
      // Audio fallback silent
    }
  }

  // Synthesize realistic Firecracker Pop & Boom sounds via Web Audio API
  private playCrackSound(frequency = 120, duration = 0.35, isBoom = false) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Noise Buffer for realistic crackle
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = isBoom ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime(isBoom ? 200 : 1800, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(isBoom ? 0.8 : 0.4, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start();

      // Low frequency boom component
      if (isBoom) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + duration);
        gain.gain.setValueAtTime(0.7, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      }
    } catch {
      // ignore audio errors
    }
  }

  onCodeChange(val: string) {
    if ((val || '').trim() === '8866') {
      this.onTriggerLaunch();
    }
  }

  onTriggerLaunch() {
    const code = (this.launchCode || '').trim();
    if (!code) {
      this.errorMessage = 'Please enter launch code 8866';
      this.cdr.markForCheck();
      return;
    }

    if (code !== '8866' && code !== 'DigitLab@ProdInit2026!') {
      this.errorMessage = 'Incorrect code! Type 8866 to launch.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    // Call API to ensure master data & lock are saved
    this.api.quickLaunch(code).subscribe({
      next: () => {
        this.startFireworksShow();
      },
      error: () => {
        // Even on offline/seeded, trigger fireworks to ensure user delight
        this.startFireworksShow();
      }
    });
  }

  startFireworksShow() {
    this.loading = false;
    this.showFireworks = true;
    this.cdr.markForCheck();

    // Store site launched flag and current launch date
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('digitlab_site_launched', 'true');
    localStorage.setItem('digitlab_launch_date', todayStr);
    sessionStorage.setItem('digitlab_unlocked_session', 'true');

    setTimeout(() => {
      this.initCanvas();
      this.launchMassiveFireworks();
    }, 50);

    // After 3.8 seconds of fireworks celebration, transition to first page
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 3800);
  }

  private initCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    this.canvasWidth = canvas.width = window.innerWidth;
    this.canvasHeight = canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.animate(ctx);
  }

  private createFirework(x: number, y: number, color: string, count = 100) {
    this.playCrackSound(150, 0.45, true);

    // Secondary crackles
    setTimeout(() => this.playCrackSound(800, 0.2, false), 80);
    setTimeout(() => this.playCrackSound(1200, 0.15, false), 150);

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 8 + 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: Math.random() > 0.3 ? color : '#ffffff',
        size: Math.random() * 3 + 2,
        decay: Math.random() * 0.015 + 0.01,
        gravity: 0.12,
        shimmer: Math.random() > 0.5
      });
    }

    // Add Confetti pieces
    for (let i = 0; i < 20; i++) {
      this.confettiList.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * -4 - 2,
        size: Math.random() * 8 + 5,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        alpha: 1
      });
    }
  }

  private launchMassiveFireworks() {
    // Immediate center explosion
    const cx = this.canvasWidth / 2;
    const cy = this.canvasHeight * 0.35;
    this.createFirework(cx, cy, '#f59e0b', 140);

    // Staggered multi-color bursts
    const bursts = [
      { x: cx - 220, y: cy - 60, delay: 250, color: '#06b6d4' },
      { x: cx + 220, y: cy - 50, delay: 450, color: '#ef4444' },
      { x: cx - 120, y: cy + 80, delay: 750, color: '#10b981' },
      { x: cx + 140, y: cy + 70, delay: 1000, color: '#ec4899' },
      { x: cx, y: cy - 100, delay: 1300, color: '#f59e0b' },
      { x: cx - 280, y: cy + 20, delay: 1600, color: '#8b5cf6' },
      { x: cx + 280, y: cy + 10, delay: 1850, color: '#38bdf8' },
      { x: cx, y: cy - 40, delay: 2200, color: '#fbbf24' }
    ];

    bursts.forEach(b => {
      setTimeout(() => {
        this.createFirework(b.x, b.y, b.color, 110);
      }, b.delay);
    });
  }

  private animate(ctx: CanvasRenderingContext2D) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    ctx.globalCompositeOperation = 'lighter';

    // Render Particles (Fireworks)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = p.shimmer ? 15 : 6;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Confetti
    for (let i = this.confettiList.length - 1; i >= 0; i--) {
      const c = this.confettiList[i];
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.1;
      c.rotation += c.rotSpeed;
      c.alpha -= 0.006;

      if (c.alpha <= 0 || c.y > this.canvasHeight) {
        this.confettiList.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = c.alpha;
      ctx.fillStyle = c.color;
      ctx.translate(c.x, c.y);
      ctx.rotate((c.rotation * Math.PI) / 180);
      ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
      ctx.restore();
    }

    this.animFrameId = requestAnimationFrame(() => this.animate(ctx));
  }
}
