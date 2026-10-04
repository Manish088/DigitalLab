import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900 font-heading">Staff Members & Role-Based Access Control</h2>
          <p class="text-xs text-slate-500">Add lab technicians, front-desk receptionists, and pathologists with granular module permissions.</p>
        </div>
        <button (click)="showAddModal = true" class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all">
          <i class="fa-solid fa-user-plus mr-2"></i> Add Staff Member
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div *ngFor="let s of staffList" class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                {{ s.fullName?.charAt(0) }}
              </div>
              <div>
                <h3 class="font-bold text-sm text-slate-900">{{ s.fullName }}</h3>
                <p class="text-xs text-slate-500">{{ s.designation }}</p>
              </div>
            </div>
            <span [class]="s.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500'"
              class="px-2 py-0.5 rounded-full text-[10px] font-bold border">
              {{ s.isActive ? 'Active' : 'Disabled' }}
            </span>
          </div>

          <div class="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-500">Email:</span>
              <span class="font-medium text-slate-800">{{ s.email }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Role:</span>
              <span class="font-bold text-brand-700">{{ s.role }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Phone:</span>
              <span class="text-slate-800">{{ s.phoneNumber || 'N/A' }}</span>
            </div>
          </div>

          <button (click)="toggleStatus(s.id)" class="w-full py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-50">
            {{ s.isActive ? 'Deactivate Account' : 'Activate Account' }}
          </button>
        </div>
      </div>

      <!-- Add Staff Modal -->
      <div *ngIf="showAddModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 class="text-sm font-bold text-slate-900 font-heading">Add Staff Account</h3>
            <button (click)="showAddModal = false" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input type="text" [(ngModel)]="newStaff.fullName" placeholder="Pooja Sharma" class="w-full px-3 py-2 border rounded-xl">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Email / Login ID *</label>
              <input type="email" [(ngModel)]="newStaff.email" placeholder="pooja@citylab.com" class="w-full px-3 py-2 border rounded-xl">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Role *</label>
                <select [(ngModel)]="newStaff.role" class="w-full px-3 py-2 border rounded-xl">
                  <option value="Technician">Lab Technician</option>
                  <option value="Receptionist">Reception / Billing</option>
                  <option value="Pathologist">Pathologist Doctor</option>
                  <option value="LabManager">Lab Manager</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Designation</label>
                <input type="text" [(ngModel)]="newStaff.designation" placeholder="Senior DMLT" class="w-full px-3 py-2 border rounded-xl">
              </div>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Password *</label>
              <input type="password" [(ngModel)]="newStaff.password" placeholder="••••••••" class="w-full px-3 py-2 border rounded-xl">
            </div>
          </div>

          <button (click)="createStaff()" class="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow-md">
            Create Account
          </button>
        </div>
      </div>
    </div>
  `
})
export class StaffComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  staffList: any[] = [];
  showAddModal = false;

  newStaff = {
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'Technician',
    designation: 'Lab Technician',
    password: '',
    permissionsJson: '["cases", "results"]'
  };

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.api.getStaff().subscribe(res => {
      this.staffList = res || [];
      this.cdr.detectChanges();
    });
  }

  createStaff(): void {
    if (!this.newStaff.fullName || !this.newStaff.email || !this.newStaff.password) {
      this.toast.warning('Please enter staff name, email, and temporary password.');
      return;
    }
    this.api.createStaff(this.newStaff).subscribe({
      next: () => {
        this.showAddModal = false;
        this.toast.success(`Staff member ${this.newStaff.fullName} created successfully!`);
        this.loadStaff();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error creating staff.')
    });
  }

  toggleStatus(id: string): void {
    this.api.toggleStaffStatus(id).subscribe({
      next: () => {
        this.toast.info('Staff status updated successfully.');
        this.loadStaff();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error updating status.')
    });
  }
}
