import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { SupportTicket } from '../../core/models/lims.models';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900 font-heading">Helpdesk & Customer Support</h2>
          <p class="text-xs text-slate-500">Raise software issues, billing queries, and get 24/7 technical assistance.</p>
        </div>
        <button (click)="showNewTicketModal = true" class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all">
          <i class="fa-solid fa-plus mr-2"></i> Raise New Ticket
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div *ngFor="let t of tickets" class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">{{ t.ticketNumber }}</span>
              <h3 class="font-bold text-sm text-slate-900 mt-1">{{ t.subject }}</h3>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              {{ t.status === 1 ? 'Open' : (t.status === 2 ? 'In Progress' : 'Resolved') }}
            </span>
          </div>

          <p class="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">{{ t.description }}</p>

          <!-- Replies thread -->
          <div *ngIf="t.replies && t.replies.length > 0" class="space-y-2 border-t pt-2">
            <div *ngFor="let r of t.replies" class="p-2 rounded-lg text-xs" [class]="r.isAdminReply ? 'bg-brand-50 text-brand-900 border border-brand-100' : 'bg-slate-100 text-slate-800'">
              <div class="font-bold text-[10px] text-slate-500">{{ r.senderName }} ({{ r.isAdminReply ? 'Support Team' : 'You' }}):</div>
              <div>{{ r.message }}</div>
            </div>
          </div>

          <!-- Quick reply box -->
          <div class="flex space-x-2 pt-2">
            <input type="text" [(ngModel)]="replyMessages[t.id]" placeholder="Type reply message..."
              class="flex-1 px-3 py-1.5 text-xs border rounded-lg">
            <button (click)="sendReply(t.id)" class="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold">
              Reply
            </button>
          </div>
        </div>
      </div>

      <!-- New Ticket Modal -->
      <div *ngIf="showNewTicketModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 class="text-sm font-bold text-slate-900 font-heading">Raise Support Ticket</h3>
            <button (click)="showNewTicketModal = false" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Subject *</label>
              <input type="text" [(ngModel)]="newTicket.subject" placeholder="e.g. Barcode printer alignment issue" class="w-full px-3 py-2 border rounded-xl">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Category</label>
              <select [(ngModel)]="newTicket.category" class="w-full px-3 py-2 border rounded-xl">
                <option value="General">General Query</option>
                <option value="Reports">Report / PDF Formatting</option>
                <option value="Billing">Billing & Accounting</option>
                <option value="Integration">Hardware / Barcode Integration</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Description *</label>
              <textarea [(ngModel)]="newTicket.description" rows="3" placeholder="Provide detailed steps or problem description..." class="w-full p-2 border rounded-xl"></textarea>
            </div>
          </div>

          <button (click)="createTicket()" class="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow-md">
            Submit Ticket
          </button>
        </div>
      </div>
    </div>
  `
})
export class SupportComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  tickets: SupportTicket[] = [];
  showNewTicketModal = false;
  replyMessages: { [key: string]: string } = {};

  newTicket = {
    subject: '',
    category: 'General',
    priority: 2,
    description: ''
  };

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.api.getSupportTickets().subscribe(res => {
      this.tickets = res || [];
      this.cdr.detectChanges();
    });
  }

  createTicket(): void {
    if (!this.newTicket.subject || !this.newTicket.description) {
      this.toast.warning('Please enter subject and problem description.');
      return;
    }
    this.api.createSupportTicket(this.newTicket).subscribe({
      next: () => {
        this.showNewTicketModal = false;
        this.toast.success('Support ticket submitted successfully!');
        this.loadTickets();
      },
      error: () => this.toast.error('Error creating support ticket.')
    });
  }

  sendReply(ticketId: string): void {
    const msg = this.replyMessages[ticketId];
    if (!msg || !msg.trim()) return;

    this.api.addTicketReply({ ticketId, message: msg.trim() }).subscribe({
      next: () => {
        this.replyMessages[ticketId] = '';
        this.toast.success('Reply sent successfully!');
        this.loadTickets();
      },
      error: () => this.toast.error('Error sending reply.')
    });
  }
}
