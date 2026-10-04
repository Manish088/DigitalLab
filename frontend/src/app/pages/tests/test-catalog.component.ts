import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { TestMaster, TestCategory } from '../../core/models/lims.models';

interface NewParamModel {
  parameterCode: string;
  parameterName: string;
  unit: string;
  inputType: number;
  defaultValue: string;
  textualRange: string;
  minNormalValue: number | null;
  maxNormalValue: number | null;
}

@Component({
  selector: 'app-test-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900 font-heading">Test Catalog & Master Rate List</h2>
          <p class="text-xs text-slate-500">Configure pathology investigations, profile packages, pricing, sample vials, and reference intervals.</p>
        </div>
        <button (click)="openAddTestModal()" class="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all">
          <i class="fa-solid fa-plus mr-2"></i> Add New Investigation
        </button>
      </div>

      <!-- Categories Tabs Strip -->
      <div class="flex items-center space-x-2 overflow-x-auto pb-2">
        <button (click)="selectedCategory = ''"
          [class]="selectedCategory === '' ? 'bg-brand-600 text-white font-bold' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'"
          class="px-4 py-2 rounded-xl text-xs whitespace-nowrap shadow-sm transition-all">
          All Departments ({{ tests.length }})
        </button>
        <button *ngFor="let cat of categories" (click)="selectedCategory = cat.id"
          [class]="selectedCategory === cat.id ? 'bg-brand-600 text-white font-bold' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'"
          class="px-4 py-2 rounded-xl text-xs whitespace-nowrap shadow-sm transition-all">
          {{ cat.categoryName }} ({{ cat.testsCount }})
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div class="relative flex-1 max-w-md">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <i class="fa-solid fa-magnifying-glass text-xs"></i>
          </div>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search test name, code (e.g. CBC, Lipid, Sugar)..."
            class="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
        </div>
        <div class="text-xs text-slate-500 font-medium">
          Showing {{ filteredTests.length }} tests
        </div>
      </div>

      <!-- Tests Catalog Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let t of filteredTests" class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow space-y-3">
          <div class="flex items-start justify-between">
            <span class="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-bold text-[10px] uppercase border border-brand-100">
              {{ t.categoryName }}
            </span>
            <span class="text-xs font-mono font-bold text-slate-400">#{{ t.testCode }}</span>
          </div>

          <div>
            <h3 class="font-bold text-sm text-slate-900 leading-snug">{{ t.testName }}</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">{{ t.methodology || 'Automated Diagnostic Analyzer' }}</p>
          </div>

          <div class="p-2.5 bg-slate-50 rounded-xl text-[11px] space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-500">Sample / Tube:</span>
              <span class="font-semibold text-slate-800">{{ t.sampleType || 'Blood' }} ({{ t.containerVialType || 'EDTA' }})</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Turnaround Time:</span>
              <span class="font-semibold text-slate-800">{{ t.tatHours }} Hours</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Parameters:</span>
              <span class="font-bold text-brand-600">{{ t.parameters ? t.parameters.length : 0 }} parameters</span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <div class="text-[10px] text-slate-400">Standard Price</div>
              <div class="text-base font-black text-slate-900">₹{{ t.price }}</div>
            </div>
            <button (click)="viewParameters(t)" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">
              View Ranges
            </button>
          </div>
        </div>
      </div>

      <!-- Add New Investigation Modal -->
      <div *ngIf="showAddModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] flex flex-col">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-bold text-slate-900 font-heading flex items-center">
                <i class="fa-solid fa-flask-vial text-brand-600 mr-2"></i> Add New Investigation / Test
              </h3>
              <p class="text-xs text-slate-500">Create a new test with parameters, pricing, and reference normal ranges.</p>
            </div>
            <button (click)="showAddModal = false" class="text-slate-400 hover:text-slate-600 text-lg"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="overflow-y-auto flex-1 space-y-4 pr-1">
            <!-- Row 1: Code, Name, Category -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Test Code *</label>
                <input type="text" [(ngModel)]="newTest.testCode" placeholder="e.g. WIDAL, DENGUE"
                  class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Investigation Name *</label>
                <input type="text" [(ngModel)]="newTest.testName" placeholder="e.g. Widal Agglutination Test (Slide & Tube)"
                  class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>
            </div>

            <!-- Row 2: Department, Price, TAT -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Department / Category *</label>
                <select [(ngModel)]="newTest.categoryId" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <option value="" disabled>Select Department</option>
                  <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.categoryName }}</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Price (₹) *</label>
                <input type="number" [(ngModel)]="newTest.price" placeholder="e.g. 350"
                  class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold text-emerald-600 focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Turnaround Time (Hours)</label>
                <input type="number" [(ngModel)]="newTest.tatHours" placeholder="e.g. 4"
                  class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>
            </div>

            <!-- Row 3: Sample & Tube -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Sample Specimen Type</label>
                <input type="text" [(ngModel)]="newTest.sampleType" placeholder="e.g. Serum Clotted, Whole Blood EDTA, Urine"
                  class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Container / Vial Type</label>
                <input type="text" [(ngModel)]="newTest.containerVialType" placeholder="e.g. Yellow Gel SST, Lavender EDTA"
                  class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>
            </div>

            <!-- Row 4: Methodology -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Methodology / Technology</label>
              <input type="text" [(ngModel)]="newTest.methodology" placeholder="e.g. Rapid Slide Agglutination / ECLIA / Dry Chemistry"
                class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>

            <!-- Parameters Section -->
            <div class="space-y-3 pt-3 border-t border-slate-100">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-slate-900 uppercase">Test Parameters & Reference Ranges</h4>
                  <p class="text-[11px] text-slate-500">Add measured parameters that will appear on the report & result entry screen.</p>
                </div>
                <button type="button" (click)="addParamRow()" class="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs border border-brand-200">
                  <i class="fa-solid fa-plus mr-1"></i> Add Parameter
                </button>
              </div>

              <div *ngIf="newParams.length === 0" class="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                No parameters added yet. Click "+ Add Parameter" to add report parameters.
              </div>

              <div *ngFor="let p of newParams; let i = index" class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 relative">
                <button (click)="removeParamRow(i)" class="absolute top-3 right-3 text-slate-400 hover:text-rose-600 text-xs">
                  <i class="fa-solid fa-trash"></i>
                </button>

                <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 pr-6">
                  <div>
                    <label class="block text-[10px] text-slate-500 font-semibold">Parameter Code</label>
                    <input type="text" [(ngModel)]="p.parameterCode" placeholder="e.g. TYPHI_O"
                      class="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono uppercase bg-white">
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block text-[10px] text-slate-500 font-semibold">Parameter Name *</label>
                    <input type="text" [(ngModel)]="p.parameterName" placeholder="e.g. S. Typhi 'O' (Antigen)"
                      class="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white">
                  </div>
                  <div>
                    <label class="block text-[10px] text-slate-500 font-semibold">Unit</label>
                    <input type="text" [(ngModel)]="p.unit" placeholder="e.g. mg/dL, %, Titre"
                      class="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white">
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label class="block text-[10px] text-slate-500 font-semibold">Textual Range / Bio Reference</label>
                    <input type="text" [(ngModel)]="p.textualRange" placeholder="e.g. < 1:80 Negative / 10 - 50"
                      class="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white">
                  </div>
                  <div>
                    <label class="block text-[10px] text-slate-500 font-semibold">Min Normal (Numeric)</label>
                    <input type="number" [(ngModel)]="p.minNormalValue" placeholder="e.g. 10"
                      class="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white">
                  </div>
                  <div>
                    <label class="block text-[10px] text-slate-500 font-semibold">Max Normal (Numeric)</label>
                    <input type="number" [(ngModel)]="p.maxNormalValue" placeholder="e.g. 50"
                      class="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" (click)="showAddModal = false" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="button" (click)="submitNewTest()" [disabled]="savingTest"
              class="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all disabled:opacity-50">
              <i *ngIf="savingTest" class="fa-solid fa-circle-notch fa-spin mr-1"></i>
              {{ savingTest ? 'Saving...' : 'Save Investigation to Catalog' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Parameters & Reference Range Modal -->
      <div *ngIf="selectedTestForModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-sm font-bold text-slate-900 font-heading">{{ selectedTestForModal.testName }} ({{ selectedTestForModal.testCode }})</h3>
              <p class="text-xs text-slate-500">Parameters & Normal Reference Intervals</p>
            </div>
            <button (click)="selectedTestForModal = null" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="overflow-y-auto flex-1 space-y-3">
            <div *ngFor="let p of selectedTestForModal.parameters" class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2">
              <div class="flex justify-between font-bold text-slate-900">
                <span>{{ p.parameterName }}</span>
                <span class="font-mono text-slate-500">Unit: {{ p.unit || 'N/A' }}</span>
              </div>
              <div class="space-y-1">
                <div *ngFor="let r of p.normalRanges" class="flex justify-between text-[11px] text-slate-600 bg-white p-1.5 rounded border border-slate-100">
                  <span>{{ r.ageDisplayGroup || (r.applicableGender === 1 ? 'Male' : (r.applicableGender === 2 ? 'Female' : 'All')) }}</span>
                  <strong class="text-slate-800">{{ r.textualRange || (r.minNormalValue + ' - ' + r.maxNormalValue) }}</strong>
                </div>
              </div>
            </div>
          </div>

          <button (click)="selectedTestForModal = null" class="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
            Close
          </button>
        </div>
      </div>
    </div>
  `
})
export class TestCatalogComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  categories: TestCategory[] = [];
  tests: TestMaster[] = [];
  selectedCategory = '';
  searchQuery = '';
  selectedTestForModal: TestMaster | null = null;

  // Add Test Modal State
  showAddModal = false;
  savingTest = false;

  newTest = {
    testCode: '',
    testName: '',
    shortName: '',
    categoryId: '',
    price: 300,
    costPrice: 50,
    tatHours: 4,
    sampleType: 'Serum Clotted',
    containerVialType: 'Yellow / Gel SST',
    methodology: 'Automated Analyzer',
    itemType: 1
  };

  newParams: NewParamModel[] = [];

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.api.getCategories().subscribe(cats => {
      this.categories = cats || [];
      if (this.categories.length > 0 && !this.newTest.categoryId) {
        this.newTest.categoryId = this.categories[0].id;
      }
      this.cdr.detectChanges();
    });
    this.api.getTests().subscribe(tests => {
      this.tests = tests || [];
      this.cdr.detectChanges();
    });
  }

  get filteredTests(): TestMaster[] {
    return this.tests.filter(t => {
      const matchCat = !this.selectedCategory || t.categoryId === this.selectedCategory;
      const matchSearch = !this.searchQuery ||
        t.testName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        t.testCode.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  viewParameters(test: TestMaster): void {
    this.selectedTestForModal = test;
  }

  openAddTestModal(): void {
    this.newTest = {
      testCode: '',
      testName: '',
      shortName: '',
      categoryId: this.categories.length > 0 ? this.categories[0].id : '',
      price: 300,
      costPrice: 50,
      tatHours: 4,
      sampleType: 'Serum Clotted',
      containerVialType: 'Yellow / Gel SST',
      methodology: 'Automated Analyzer',
      itemType: 1
    };
    this.newParams = [
      {
        parameterCode: 'PARAM1',
        parameterName: 'Result / Observation',
        unit: '',
        inputType: 1,
        defaultValue: '',
        textualRange: 'Negative / Normal',
        minNormalValue: null,
        maxNormalValue: null
      }
    ];
    this.showAddModal = true;
  }

  addParamRow(): void {
    const num = this.newParams.length + 1;
    this.newParams.push({
      parameterCode: `P${num}`,
      parameterName: `Parameter ${num}`,
      unit: '',
      inputType: 1,
      defaultValue: '',
      textualRange: 'Normal',
      minNormalValue: null,
      maxNormalValue: null
    });
  }

  removeParamRow(index: number): void {
    this.newParams.splice(index, 1);
  }

  submitNewTest(): void {
    if (!this.newTest.testCode.trim()) {
      this.toast.warning('Please enter Test Code (e.g. WIDAL, DENGUE).');
      return;
    }
    if (!this.newTest.testName.trim()) {
      this.toast.warning('Please enter Test Name.');
      return;
    }
    if (!this.newTest.categoryId) {
      this.toast.warning('Please select Department / Category.');
      return;
    }

    this.savingTest = true;

    const payload = {
      categoryId: this.newTest.categoryId,
      testCode: this.newTest.testCode.trim().toUpperCase(),
      testName: this.newTest.testName.trim(),
      shortName: this.newTest.shortName || this.newTest.testCode.trim().toUpperCase(),
      itemType: this.newTest.itemType,
      sampleType: this.newTest.sampleType,
      containerVialType: this.newTest.containerVialType,
      price: this.newTest.price || 0,
      costPrice: this.newTest.costPrice || 0,
      tatHours: this.newTest.tatHours || 4,
      methodology: this.newTest.methodology,
      clinicalSignificance: '',
      preTestInstructions: '',
      interpretationTemplate: '',
      parameters: this.newParams.map((p, idx) => ({
        parameterCode: p.parameterCode || `P${idx + 1}`,
        parameterName: p.parameterName,
        unit: p.unit || '',
        inputType: p.inputType,
        defaultValue: p.defaultValue || '',
        optionsJson: '',
        formulaExpression: '',
        displayOrder: idx + 1,
        isMandatory: true,
        normalRanges: [
          {
            applicableGender: 3, // Both
            minAgeDays: 0,
            maxAgeDays: 43800,
            minNormalValue: p.minNormalValue,
            maxNormalValue: p.maxNormalValue,
            panicLowValue: null,
            panicHighValue: null,
            textualRange: p.textualRange,
            ageDisplayGroup: 'General'
          }
        ]
      }))
    };

    this.api.createTest(payload).subscribe({
      next: () => {
        this.savingTest = false;
        this.showAddModal = false;
        this.toast.success(`Investigation "${this.newTest.testName}" added to catalog successfully!`);
        this.loadCatalog();
      },
      error: (err) => {
        this.savingTest = false;
        this.toast.error(err.error?.message || 'Failed to save test.');
      }
    });
  }
}
