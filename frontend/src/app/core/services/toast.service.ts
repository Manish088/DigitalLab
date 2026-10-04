import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);

  show(type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string, duration: number = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, title, message, duration };

    this.toasts.update(list => [...list, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(message: string, title?: string, duration: number = 4000): void {
    this.show('success', message, title || 'Success', duration);
  }

  error(message: string, title?: string, duration: number = 5000): void {
    this.show('error', message, title || 'Error', duration);
  }

  warning(message: string, title?: string, duration: number = 4000): void {
    this.show('warning', message, title || 'Warning', duration);
  }

  info(message: string, title?: string, duration: number = 4000): void {
    this.show('info', message, title || 'Information', duration);
  }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
