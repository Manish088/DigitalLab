import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { CollectionAgent } from '../../core/models/lims.models';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900 font-heading">Collection Centres & Field Agents</h2>
          <p class="text-xs text-slate-500">Manage sample collection points, phlebotomist agents, and commission structures.</p>
        </div>
        <button (click)="showAddModal = true" class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all">
          <i class="fa-solid fa-plus mr-2"></i> Add Collection Centre
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div *ngFor="let agt of agents" class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-bold text-sm text-slate-900">{{ agt.agentName }}</h3>
              <p class="text-xs text-brand-600 font-semibold">{{ agt.centreName }}</p>
            </div>
            <span class="text-xs font-mono font-bold text-slate-400">#{{ agt.agentCode }}</span>
          </div>

          <div class="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-500">Phone:</span>
              <span class="font-medium text-slate-800">{{ agt.phone || 'N/A' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Commission Rate:</span>
              <span class="font-bold text-brand-700">{{ agt.commissionPercent }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Total Cases:</span>
              <span class="font-bold text-slate-900">{{ agt.totalCasesCount }} cases</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Billing Volume:</span>
              <span class="font-black text-slate-900">₹{{ agt.totalBillingVolume | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Modal -->
      <div *ngIf="showAddModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 class="text-sm font-bold text-slate-900 font-heading">Add Collection Centre / Agent</h3>
            <button (click)="showAddModal = false" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Agent / Contact Person Name *</label>
              <input type="text" [(ngModel)]="newAgent.agentName" placeholder="e.g. Ramesh Kumar" class="w-full px-3 py-2 border rounded-xl">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Centre / Hub Name *</label>
              <input type="text" [(ngModel)]="newAgent.centreName" placeholder="East Delhi Collection Hub" class="w-full px-3 py-2 border rounded-xl">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input type="tel" [(ngModel)]="newAgent.phone" placeholder="7706087066" class="w-full px-3 py-2 border rounded-xl">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Commission %</label>
                <input type="number" [(ngModel)]="newAgent.commissionPercent" placeholder="10" class="w-full px-3 py-2 border rounded-xl font-bold text-brand-600">
              </div>
            </div>
          </div>

          <button (click)="createAgent()" class="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer">
            Save Agent
          </button>
        </div>
      </div>
    </div>
  `
})
export class AgentsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  agents: CollectionAgent[] = [];
  showAddModal = false;

  newAgent = {
    agentCode: 'AGT' + Math.floor(100 + Math.random() * 900),
    agentName: '',
    centreName: '',
    phone: '',
    email: '',
    address: '',
    commissionPercent: 10
  };

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.api.getAgents().subscribe(res => {
      this.agents = res || [];
      this.cdr.detectChanges();
    });
  }

  createAgent(): void {
    if (!this.newAgent.agentName || !this.newAgent.centreName) {
      this.toast.warning('Please enter agent name and centre name.');
      return;
    }
    this.api.createAgent(this.newAgent).subscribe({
      next: () => {
        this.showAddModal = false;
        this.toast.success('Collection agent added successfully!');
        this.loadAgents();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error saving agent.')
    });
  }
}
