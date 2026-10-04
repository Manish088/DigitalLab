import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { DoctorReferral, CollectionAgent, TestMaster, TestCategory, Gender, PriorityLevel, PaymentMethod } from '../../core/models/lims.models';

@Component({
  selector: 'app-add-case',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-slate-900 font-heading">New Patient Registration & Case Billing</h2>
          <p class="text-xs text-slate-500">Register patient, select tests, calculate pricing & generate sample barcodes.</p>
        </div>
        <button (click)="submitCase()" [disabled]="submitting || selectedTests.length === 0"
          class="inline-flex items-center px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50">
          <i *ngIf="submitting" class="fa-solid fa-spinner fa-spin mr-2"></i>
          <i *ngIf="!submitting" class="fa-solid fa-check-double mr-2"></i>
          {{ submitting ? 'Creating Bill...' : 'Create & Generate Bill' }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Patient Demographics & Referral Details (2 cols) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Patient Details Box -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <i class="fa-solid fa-user-plus text-brand-600 mr-2"></i> Patient Information
              </h3>
              <span class="text-xs text-brand-600 font-medium bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                New UHID Auto-Generated
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name *</label>
                <input type="text" [(ngModel)]="patient.fullName" placeholder="e.g. Ramesh Chandra Verma" required
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                <select [(ngModel)]="patient.gender" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <option [ngValue]="1">Male</option>
                  <option [ngValue]="2">Female</option>
                  <option [ngValue]="3">Other</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Age (Years) *</label>
                <input type="number" [(ngModel)]="patient.ageYears" min="0" max="120" placeholder="Years"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <input type="tel" [(ngModel)]="patient.phone" placeholder="9876543210"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <select [(ngModel)]="patient.bloodGroup" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <option value="">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Address / Locality</label>
              <input type="text" [(ngModel)]="patient.address" placeholder="e.g. Flat 102, Shanti Vihar, Rohini"
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>
          </div>

          <!-- Doctor & Agent Referral Selection -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center">
              <i class="fa-solid fa-stethoscope text-emerald-600 mr-2"></i> Referral & Sample Logistics
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Referring Doctor</label>
                <select [(ngModel)]="referringDoctorId" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <option [ngValue]="null">Direct / Self Walk-in</option>
                  <option *ngFor="let doc of doctors" [ngValue]="doc.id">{{ doc.doctorName }} ({{ doc.specialization || 'General' }})</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Collection Centre / Agent</label>
                <select [(ngModel)]="collectionAgentId" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <option [ngValue]="null">Main Laboratory Center</option>
                  <option *ngFor="let agt of agents" [ngValue]="agt.id">{{ agt.agentName }} ({{ agt.centreName }})</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Case Priority</label>
                <select [(ngModel)]="priority" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <option [ngValue]="1">Routine (Standard TAT)</option>
                  <option [ngValue]="2">Urgent (Priority Reporting)</option>
                  <option [ngValue]="3">STAT (Critical Emergency)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Test Catalog Search & Selection Table -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <i class="fa-solid fa-vial-circle-check text-brand-600 mr-2 text-base"></i> Select Investigations & Tests
              </h3>
              <span class="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                {{ filteredTests.length }} of {{ availableTests.length }} tests available
              </span>
            </div>

            <!-- Department / Category Quick Filter Tabs -->
            <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              <button type="button" (click)="selectedCategory = ''; filterChanged()"
                [class]="selectedCategory === '' ? 'bg-brand-600 text-white font-bold shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'"
                class="px-3 py-1.5 rounded-xl whitespace-nowrap transition-all">
                All Tests ({{ availableTests.length }})
              </button>
              <button *ngFor="let cat of categories" type="button" (click)="selectedCategory = cat.id; filterChanged()"
                [class]="selectedCategory === cat.id ? 'bg-brand-600 text-white font-bold shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'"
                class="px-3 py-1.5 rounded-xl whitespace-nowrap transition-all">
                {{ cat.categoryName }} ({{ getCategoryTestCount(cat.id) }})
              </button>
            </div>

            <!-- Search input -->
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <i class="fa-solid fa-magnifying-glass text-xs"></i>
              </div>
              <input type="text" [(ngModel)]="testSearch" (input)="filterChanged()" placeholder="Search test name, test code, or department (e.g. CBC, Lipid, LFT, Sugar, KFT)..."
                class="w-full pl-9 pr-8 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              <button *ngIf="testSearch" (click)="testSearch = ''; filterChanged()" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <!-- Loading Spinner -->
            <div *ngIf="loadingTests" class="py-10 text-center space-y-2">
              <i class="fa-solid fa-circle-notch fa-spin text-2xl text-brand-600"></i>
              <div class="text-xs font-semibold text-slate-600">Loading Test Catalog & Rate List...</div>
            </div>

            <!-- Filtered tests chip selector Grid -->
            <div *ngIf="!loadingTests && filteredTests.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1">
              <div *ngFor="let t of filteredTests" (click)="toggleTest(t)"
                [class]="isSelected(t.id) ? 'bg-brand-50/80 border-brand-500 ring-2 ring-brand-500/20 shadow-sm' : 'bg-slate-50/80 border-slate-200/90 hover:border-brand-300 hover:bg-white'"
                class="p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all">
                <div class="space-y-0.5 max-w-[70%]">
                  <div class="flex items-center space-x-1.5">
                    <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-brand-700 border border-brand-100 font-mono">
                      {{ t.testCode }}
                    </span>
                    <span class="text-[10px] text-slate-400 truncate">{{ t.categoryName }}</span>
                  </div>
                  <div class="font-bold text-xs text-slate-800 leading-snug">{{ t.testName }}</div>
                  <div class="text-[10px] text-slate-500">
                    <i class="fa-solid fa-vial text-[9px] mr-1 text-slate-400"></i>{{ t.sampleType || 'Blood' }} • {{ t.containerVialType || 'EDTA' }}
                  </div>
                </div>

                <div class="text-right space-y-1">
                  <div class="font-black text-sm text-slate-900">₹{{ t.price | number:'1.0-0' }}</div>
                  <span *ngIf="isSelected(t.id)" class="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <i class="fa-solid fa-check mr-1 text-[9px]"></i> Added
                  </span>
                  <span *ngIf="!isSelected(t.id)" class="inline-flex items-center text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full hover:border-brand-400 hover:text-brand-600">
                    + Add
                  </span>
                </div>
              </div>
            </div>

            <!-- Empty State when no test matches filter -->
            <div *ngIf="!loadingTests && filteredTests.length === 0" class="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <i class="fa-solid fa-magnifying-glass text-2xl text-slate-300"></i>
              <div class="text-xs font-bold text-slate-700">No matching tests found</div>
              <p class="text-[11px] text-slate-400">Try searching for a different test name, code or reset the department filter.</p>
              <button type="button" (click)="testSearch = ''; selectedCategory = ''; filterChanged()" class="mt-2 text-xs font-semibold text-brand-600 hover:underline">
                View All {{ availableTests.length }} Tests
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Billing Breakdown & Payment Settlement (1 col) -->
        <div class="space-y-6">
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 sticky top-20">
            <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center">
              <i class="fa-solid fa-receipt text-brand-600 mr-2"></i> Bill Summary & Advance
            </h3>

            <!-- Selected tests list -->
            <div class="space-y-2">
              <div class="text-xs font-semibold text-slate-600">Selected Items ({{ selectedTests.length }}):</div>
              <div *ngIf="selectedTests.length === 0" class="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-400 border border-dashed border-slate-200">
                No tests selected yet. Click on any test to add.
              </div>
              <div *ngFor="let item of selectedTests" class="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs border border-slate-100">
                <span class="font-medium text-slate-800 truncate max-w-[150px]">{{ item.testName }}</span>
                <div class="flex items-center space-x-2">
                  <span class="font-bold">₹{{ item.price }}</span>
                  <button (click)="toggleTest(item)" class="text-slate-400 hover:text-rose-600">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Pricing Breakdown -->
            <div class="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Gross Total:</span>
                <span class="font-bold text-slate-900">₹{{ grossTotal | number:'1.2-2' }}</span>
              </div>

              <!-- Discount Inputs -->
              <div class="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label class="text-[11px] text-slate-500 block">Discount %</label>
                  <input type="number" [(ngModel)]="discountPercent" (input)="onDiscountPercentChange()" min="0" max="100" placeholder="%"
                    class="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs">
                </div>
                <div>
                  <label class="text-[11px] text-slate-500 block">Discount Amount (₹)</label>
                  <input type="number" [(ngModel)]="discountAmount" (input)="onDiscountAmountChange()" min="0" [max]="grossTotal" placeholder="₹"
                    class="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs">
                </div>
              </div>

              <div class="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Net Payable:</span>
                <span class="text-brand-600">₹{{ netPayable | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Payment Collection -->
            <div class="space-y-3 pt-3 border-t border-slate-100">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Paid / Advance Amount (₹)</label>
                <div class="flex space-x-2">
                  <input type="number" [(ngModel)]="paidAmount" (input)="calculateDue()" min="0" [max]="netPayable"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-bold text-emerald-600 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <button type="button" (click)="payFull()" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl whitespace-nowrap">
                    Full Paid
                  </button>
                </div>
              </div>

              <div class="flex justify-between items-center p-3 rounded-xl bg-slate-50 text-xs">
                <span class="text-slate-500">Balance Pending Due:</span>
                <span [class]="dueAmount > 0 ? 'text-rose-600 font-black text-sm' : 'text-emerald-600 font-bold'">₹{{ dueAmount | number:'1.2-2' }}</span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                <select [(ngModel)]="paymentMethod" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <option [ngValue]="1">Cash Counter</option>
                  <option [ngValue]="2">UPI (GPay / PhonePe / QR)</option>
                  <option [ngValue]="3">Debit / Credit Card</option>
                  <option [ngValue]="4">Net Banking</option>
                </select>
              </div>

              <div *ngIf="paymentMethod === 2 || paymentMethod === 3">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / UTR / Auth No</label>
                <input type="text" [(ngModel)]="transactionRef" placeholder="e.g. UPI Ref or Card Auth Code"
                  class="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl">
              </div>
            </div>

            <button (click)="submitCase()" [disabled]="submitting || selectedTests.length === 0"
              class="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50">
              <i *ngIf="submitting" class="fa-solid fa-spinner fa-spin mr-2"></i>
              {{ submitting ? 'Processing Bill...' : 'Create Case & Print Bill' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AddCaseComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  doctors: DoctorReferral[] = [];
  agents: CollectionAgent[] = [];
  categories: TestCategory[] = [];
  availableTests: TestMaster[] = [];
  selectedTests: TestMaster[] = [];

  testSearch = '';
  selectedCategory = '';
  loadingTests = false;
  submitting = false;

  // Form State
  patient = {
    fullName: '',
    gender: Gender.Male,
    ageYears: 32,
    ageMonths: 0,
    ageDays: 0,
    phone: '',
    bloodGroup: '',
    address: ''
  };

  referringDoctorId: string | null = null;
  collectionAgentId: string | null = null;
  priority: PriorityLevel = PriorityLevel.Routine;

  discountPercent = 0;
  discountAmount = 0;
  paidAmount = 0;
  paymentMethod: PaymentMethod = PaymentMethod.Cash;
  transactionRef = '';

  ngOnInit(): void {
    this.loadMasters();
  }

  loadMasters(): void {
    this.loadingTests = true;
    this.cdr.detectChanges();

    this.api.getDoctors().subscribe({
      next: (docs) => {
        this.doctors = docs || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading doctors:', err)
    });

    this.api.getAgents().subscribe({
      next: (agts) => {
        this.agents = agts || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading agents:', err)
    });

    this.api.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading categories:', err)
    });

    this.api.getTests().subscribe({
      next: (tests) => {
        this.availableTests = tests || [];
        this.loadingTests = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading tests:', err);
        this.loadingTests = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterChanged(): void {
    this.cdr.detectChanges();
  }

  getCategoryTestCount(categoryId: string): number {
    return this.availableTests.filter(t => t.categoryId === categoryId).length;
  }

  get filteredTests(): TestMaster[] {
    return this.availableTests.filter(t => {
      const matchCat = !this.selectedCategory || t.categoryId === this.selectedCategory;
      const search = this.testSearch.trim().toLowerCase();
      const matchSearch = !search ||
        t.testName.toLowerCase().includes(search) ||
        t.testCode.toLowerCase().includes(search) ||
        (t.shortName && t.shortName.toLowerCase().includes(search)) ||
        (t.categoryName && t.categoryName.toLowerCase().includes(search));
      return matchCat && matchSearch;
    });
  }

  isSelected(id: string): boolean {
    return this.selectedTests.some(t => t.id === id);
  }

  toggleTest(test: TestMaster): void {
    const idx = this.selectedTests.findIndex(t => t.id === test.id);
    if (idx >= 0) {
      this.selectedTests.splice(idx, 1);
    } else {
      this.selectedTests.push(test);
    }
    this.recalculate();
    this.cdr.detectChanges();
  }

  get grossTotal(): number {
    return this.selectedTests.reduce((sum, t) => sum + t.price, 0);
  }

  get netPayable(): number {
    return Math.max(0, this.grossTotal - this.discountAmount);
  }

  get dueAmount(): number {
    return Math.max(0, this.netPayable - this.paidAmount);
  }

  onDiscountPercentChange(): void {
    if (this.discountPercent > 0) {
      this.discountAmount = (this.grossTotal * this.discountPercent) / 100;
    } else {
      this.discountAmount = 0;
    }
    this.paidAmount = this.netPayable;
    this.cdr.detectChanges();
  }

  onDiscountAmountChange(): void {
    if (this.grossTotal > 0 && this.discountAmount > 0) {
      this.discountPercent = (this.discountAmount / this.grossTotal) * 100;
    } else {
      this.discountPercent = 0;
    }
    this.paidAmount = this.netPayable;
    this.cdr.detectChanges();
  }

  calculateDue(): void {
    if (this.paidAmount > this.netPayable) {
      this.paidAmount = this.netPayable;
    }
    this.cdr.detectChanges();
  }

  payFull(): void {
    this.paidAmount = this.netPayable;
    this.cdr.detectChanges();
  }

  recalculate(): void {
    this.onDiscountPercentChange();
    this.paidAmount = this.netPayable;
    this.cdr.detectChanges();
  }

  submitCase(): void {
    if (!this.patient.fullName || !this.patient.fullName.trim()) {
      alert('Please enter patient name.');
      return;
    }
    if (this.selectedTests.length === 0) {
      alert('Please select at least one test.');
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    const cleanDoctorId = this.referringDoctorId && this.referringDoctorId !== 'null' && this.referringDoctorId !== '' ? this.referringDoctorId : null;
    const cleanAgentId = this.collectionAgentId && this.collectionAgentId !== 'null' && this.collectionAgentId !== '' ? this.collectionAgentId : null;

    const payload = {
      newPatient: {
        fullName: this.patient.fullName.trim(),
        gender: Number(this.patient.gender) || 1,
        ageYears: Number(this.patient.ageYears) || 0,
        ageMonths: Number(this.patient.ageMonths) || 0,
        ageDays: Number(this.patient.ageDays) || 0,
        phone: this.patient.phone ? this.patient.phone.trim() : null,
        email: null,
        address: this.patient.address ? this.patient.address.trim() : null,
        bloodGroup: this.patient.bloodGroup || null
      },
      referringDoctorId: cleanDoctorId,
      collectionAgentId: cleanAgentId,
      priority: Number(this.priority) || 1,
      selectedTestIds: this.selectedTests.map(t => t.id),
      discountPercent: Number(this.discountPercent) || 0,
      discountAmount: Number(this.discountAmount) || 0,
      paidAmount: Number(this.paidAmount) || 0,
      paymentMethod: Number(this.paymentMethod) || 1,
      transactionRef: this.transactionRef ? this.transactionRef.trim() : null,
      notes: ''
    };

    this.api.createCase(payload).subscribe({
      next: (createdCase) => {
        this.submitting = false;
        this.cdr.detectChanges();
        this.router.navigate(['/cases']);
      },
      error: (err) => {
        this.submitting = false;
        this.cdr.detectChanges();
        const errDetail = err.error?.message || (err.error?.errors ? JSON.stringify(err.error.errors) : 'Error creating case bill.');
        alert(errDetail);
      }
    });
  }
}
