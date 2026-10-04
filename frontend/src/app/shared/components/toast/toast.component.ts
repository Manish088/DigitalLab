import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-5 right-5 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <div *ngFor="let toast of toastService.toasts()"
        [ngClass]="{
          'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-500/10': toast.type === 'success',
          'bg-rose-50/95 border-rose-300 text-rose-950 shadow-rose-500/10': toast.type === 'error',
          'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-500/10': toast.type === 'warning',
          'bg-sky-50/95 border-sky-300 text-sky-950 shadow-sky-500/10': toast.type === 'info'
        }"
        class="pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-md flex items-start space-x-3 transform transition-all duration-300 animate-in slide-in-from-top-4 fade-in">
        
        <!-- Icon -->
        <div class="flex-shrink-0 mt-0.5">
          <i *ngIf="toast.type === 'success'" class="fa-solid fa-circle-check text-emerald-600 text-lg"></i>
          <i *ngIf="toast.type === 'error'" class="fa-solid fa-circle-xmark text-rose-600 text-lg"></i>
          <i *ngIf="toast.type === 'warning'" class="fa-solid fa-triangle-exclamation text-amber-600 text-lg"></i>
          <i *ngIf="toast.type === 'info'" class="fa-solid fa-circle-info text-sky-600 text-lg"></i>
        </div>

        <!-- Body -->
        <div class="flex-1 min-w-0 pr-1">
          <h4 *ngIf="toast.title" class="text-xs font-bold font-heading tracking-wide uppercase opacity-90 mb-0.5">{{ toast.title }}</h4>
          <p class="text-xs font-medium leading-relaxed break-words">{{ toast.message }}</p>
        </div>

        <!-- Dismiss Button -->
        <button type="button" (click)="toastService.dismiss(toast.id)"
          class="flex-shrink-0 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
