import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { TestMaster, TestCategory } from '../../core/models/lims.models';

interface ParamModel {
  id?: string;
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
        <button (click)="openAddTestModal()" class="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all cursor-pointer">
          <i class="fa-solid fa-plus mr-2"></i> Add New Investigation
        </button>
      </div>

      <!-- Categories Tabs Strip -->
      <div class="flex items-center space-x-2 overflow-x-auto pb-2">
        <button (click)="selectedCategory = ''"
          [class]="selectedCategory === '' ? 'bg-brand-600 text-white font-bold' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'"
          class="px-4 py-2 rounded-xl text-xs whitespace-nowrap shadow-sm transition-all cursor-pointer">
          All Departments ({{ tests.length }})
        </button>
        <button *ngFor="let cat of categories" (click)="selectedCategory = cat.id"
          [class]="selectedCategory === cat.id ? 'bg-brand-600 text-white font-bold' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'"
          class="px-4 py-2 rounded-xl text-xs whitespace-nowrap shadow-sm transition-all cursor-pointer">
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
        <div *ngFor="let t of filteredTests" class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-start justify-between">
              <span class="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-bold text-[10px] uppercase border border-brand-100">
                {{ t.categoryName }}
              </span>
              <div class="flex items-center space-x-1.5">
                <span class="text-xs font-mono font-bold text-slate-400">#{{ t.testCode }}</span>
                <span *ngIf="!t.isActive" class="text-[9px] font-bold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-200">Deactivated</span>
              </div>
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
          </div>

          <!-- Card Footer with Quick Price Change & Controls -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-100 gap-2 mt-2">
            <!-- Clickable Price Block -->
            <div (click)="openQuickPriceModal(t)" class="cursor-pointer group flex-1" title="Click to Change Test Charge / Price">
              <div class="text-[10px] text-slate-400 flex items-center space-x-1">
                <span>Standard Charge</span>
                <i class="fa-solid fa-pen text-[9px] text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </div>
              <div class="flex items-center space-x-1.5 mt-0.5">
                <span class="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors">₹{{ t.price }}</span>
                <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 group-hover:bg-emerald-100 transition-colors">
                  <i class="fa-solid fa-pen-to-square text-[9px] mr-0.5"></i> Edit Price
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center space-x-1 shrink-0">
              <!-- Edit Test Details Button -->
              <button (click)="openEditTestModal(t)" 
                class="px-2.5 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                title="Edit Investigation Details & Parameters">
                <i class="fa-solid fa-sliders text-xs"></i>
                <span class="hidden sm:inline">Edit</span>
              </button>

              <!-- View Ranges Button -->
              <button (click)="viewParameters(t)" 
                class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                title="View Normal Ranges & Parameters">
                <i class="fa-solid fa-eye text-xs"></i>
              </button>

              <!-- Delete / Deactivate Button -->
              <button (click)="openDeleteModal(t)" 
                class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs transition-colors cursor-pointer"
                title="Delete or Deactivate Test">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 1. QUICK PRICE / CHARGE CHANGE MODAL -->
      <div *ngIf="selectedTestForPrice" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center space-x-2.5">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
                <i class="fa-solid fa-indian-rupee-sign"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900 font-heading">Change Test Charge / Price</h3>
                <p class="text-[11px] text-slate-500">{{ selectedTestForPrice.testName }} ({{ selectedTestForPrice.testCode }})</p>
              </div>
            </div>
            <button (click)="selectedTestForPrice = null" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
              <i class="fa-solid fa-xmark text-base"></i>
            </button>
          </div>

          <div class="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-600">
            <div class="flex justify-between">
              <span>Department:</span>
              <strong class="text-slate-900">{{ selectedTestForPrice.categoryName }}</strong>
            </div>
            <div class="flex justify-between">
              <span>Current Charge:</span>
              <strong class="text-emerald-700 font-mono text-sm">₹{{ selectedTestForPrice.price }}</strong>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-800 mb-1">
                New Standard Patient Charge (₹) *
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">₹</span>
                <input type="number" [(ngModel)]="quickPriceValue" min="0" step="1"
                  class="w-full pl-8 pr-3 py-2.5 text-base font-extrabold text-emerald-700 border-2 border-slate-300 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none bg-white">
              </div>
              <p class="text-[10px] text-slate-400 mt-1">This price will automatically apply to all new patient registrations and bill invoices.</p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Cost / Consumables Cost (₹) <span class="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">₹</span>
                <input type="number" [(ngModel)]="quickCostPriceValue" min="0" step="1" placeholder="e.g. 50"
                  class="w-full pl-7 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white">
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button type="button" (click)="selectedTestForPrice = null" [disabled]="savingQuickPrice"
              class="w-full py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="button" (click)="saveQuickPrice()" [disabled]="savingQuickPrice"
              class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer">
              <i *ngIf="savingQuickPrice" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <i *ngIf="!savingQuickPrice" class="fa-solid fa-floppy-disk text-xs"></i>
              <span>{{ savingQuickPrice ? 'Updating...' : 'Save New Price' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 2. ADD / EDIT INVESTIGATION MASTER MODAL -->
      <div *ngIf="showTestModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-bold text-slate-900 font-heading flex items-center">
                <i class="fa-solid fa-flask-vial text-brand-600 mr-2"></i>
                {{ isEditMode ? 'Edit Investigation / Test Details' : 'Add New Investigation / Test' }}
              </h3>
              <p class="text-xs text-slate-500">
                {{ isEditMode ? 'Modify test pricing, department, parameters, and reference normal ranges.' : 'Create a new test with parameters, pricing, and reference normal ranges.' }}
              </p>
            </div>
            <button (click)="showTestModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="overflow-y-auto flex-1 space-y-4 pr-1">
            <!-- Row 1: Code, Name, Category -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Test Code *</label>
                <input type="text" [(ngModel)]="currentTestForm.testCode" placeholder="e.g. WIDAL, DENGUE"
                  class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Investigation Name *</label>
                <input type="text" [(ngModel)]="currentTestForm.testName" placeholder="e.g. Widal Agglutination Test (Slide & Tube)"
                  class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>
            </div>

            <!-- Row 2: Department, Price, TAT -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Department / Category *</label>
                <select [(ngModel)]="currentTestForm.categoryId" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <option value="" disabled>Select Department</option>
                  <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.categoryName }}</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Charge / Price (₹) *</label>
                <input type="number" [(ngModel)]="currentTestForm.price" placeholder="e.g. 350"
                  class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold text-emerald-600 focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Turnaround Time (Hours)</label>
                <input type="number" [(ngModel)]="currentTestForm.tatHours" placeholder="e.g. 4"
                  class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>
            </div>

            <!-- Row 3: Sample & Tube -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Sample Specimen Type</label>
                <input type="text" [(ngModel)]="currentTestForm.sampleType" placeholder="e.g. Serum Clotted, Whole Blood EDTA, Urine"
                  class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Container / Vial Type</label>
                <input type="text" [(ngModel)]="currentTestForm.containerVialType" placeholder="e.g. Yellow Gel SST, Lavender EDTA"
                  class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>
            </div>

            <!-- Row 4: Methodology -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Methodology / Technology</label>
                <input type="text" [(ngModel)]="currentTestForm.methodology" placeholder="e.g. Rapid Slide Agglutination / ECLIA / Dry Chemistry"
                  class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Cost Price (₹)</label>
                <input type="number" [(ngModel)]="currentTestForm.costPrice" placeholder="e.g. 50"
                  class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              </div>
            </div>

            <!-- Parameters Section -->
            <div class="space-y-3 pt-3 border-t border-slate-100">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-slate-900 uppercase">Test Parameters & Reference Ranges</h4>
                  <p class="text-[11px] text-slate-500">Add measured parameters that will appear on the report & result entry screen.</p>
                </div>
                <button type="button" (click)="addParamRow()" class="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs border border-brand-200 cursor-pointer">
                  <i class="fa-solid fa-plus mr-1"></i> Add Parameter
                </button>
              </div>

              <div *ngIf="paramRows.length === 0" class="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                No parameters added yet. Click "+ Add Parameter" to add report parameters.
              </div>

              <div *ngFor="let p of paramRows; let i = index" class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 relative">
                <button (click)="removeParamRow(i)" class="absolute top-3 right-3 text-slate-400 hover:text-rose-600 text-xs cursor-pointer" title="Remove Parameter">
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
            <button type="button" (click)="showTestModal = false" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="submitTestForm()" [disabled]="savingTest"
              class="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer">
              <i *ngIf="savingTest" class="fa-solid fa-circle-notch fa-spin mr-1"></i>
              {{ savingTest ? 'Saving...' : (isEditMode ? 'Update Investigation' : 'Save Investigation to Catalog') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 3. PARAMETERS & REFERENCE RANGES PREVIEW MODAL -->
      <div *ngIf="selectedTestForModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div class="flex items-start justify-between border-b border-slate-100 pb-3 gap-2 shrink-0">
            <div class="min-w-0 flex-1">
              <h3 class="text-xs sm:text-sm font-bold text-slate-900 font-heading break-words leading-snug">
                {{ selectedTestForModal.testName }}
                <span class="text-[11px] font-mono font-normal text-slate-500">({{ selectedTestForModal.testCode }})</span>
              </h3>
              <p class="text-[11px] text-slate-500 mt-0.5">Parameters & Normal Reference Intervals</p>
            </div>
            <button (click)="selectedTestForModal = null" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg shrink-0 cursor-pointer">
              <i class="fa-solid fa-xmark text-base"></i>
            </button>
          </div>

          <div class="overflow-y-auto flex-1 space-y-2.5 pr-0.5">
            <div *ngIf="!selectedTestForModal.parameters || selectedTestForModal.parameters.length === 0" class="p-6 text-center text-xs text-slate-400">
              No parameters configured for this investigation.
            </div>

            <div *ngFor="let p of selectedTestForModal.parameters" class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span class="font-bold text-xs text-slate-900 break-words">{{ p.parameterName }}</span>
                <span *ngIf="p.unit" class="font-mono text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 self-start sm:self-auto shrink-0">
                  Unit: <strong class="text-slate-800">{{ p.unit }}</strong>
                </span>
              </div>

              <!-- Ranges List -->
              <div *ngIf="p.normalRanges && p.normalRanges.length > 0" class="space-y-1">
                <div *ngFor="let r of p.normalRanges" class="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                  <span class="text-slate-500 text-[10px] font-medium">
                    {{ r.ageDisplayGroup || (r.applicableGender === 1 ? 'Adult Male' : (r.applicableGender === 2 ? 'Adult Female' : 'All Genders / Ages')) }}
                  </span>
                  <strong class="text-slate-900 font-mono text-xs break-all">
                    {{ r.textualRange || (r.minNormalValue + ' - ' + r.maxNormalValue + (p.unit ? ' ' + p.unit : '')) }}
                  </strong>
                </div>
              </div>

              <div *ngIf="!p.normalRanges || p.normalRanges.length === 0" class="text-[10px] text-slate-400 italic bg-white p-1.5 rounded border border-slate-100">
                Qualitative / Observation Parameter
              </div>
            </div>
          </div>

          <div class="pt-2 shrink-0 border-t border-slate-100 flex items-center justify-between">
            <button type="button" (click)="editPriceFromPreview(selectedTestForModal)" class="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all cursor-pointer">
              <i class="fa-solid fa-pen-to-square mr-1"></i> Edit Price
            </button>
            <button type="button" (click)="selectedTestForModal = null" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow transition-colors cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- 4. DELETE CONFIRMATION MODAL -->
      <div *ngIf="testToDelete" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-center">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl shadow-inner">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900 font-heading">Delete Investigation?</h3>
            <p class="text-xs text-slate-500 mt-1">
              Are you sure you want to remove <strong class="text-slate-800">{{ testToDelete.testName }}</strong>?
            </p>
          </div>
          <div class="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-800 text-left border border-amber-200">
            <i class="fa-solid fa-info-circle mr-1"></i> If patient cases exist with this test, it will be safely deactivated from new bookings instead of permanent removal.
          </div>
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button (click)="testToDelete = null" [disabled]="deleting"
              class="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50">
              Cancel
            </button>
            <button (click)="confirmDelete()" [disabled]="deleting"
              class="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center justify-center space-x-1 cursor-pointer">
              <i *ngIf="deleting" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ deleting ? 'Deleting...' : 'Yes, Delete' }}</span>
            </button>
          </div>
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

  // Quick Price Edit State
  selectedTestForPrice: TestMaster | null = null;
  quickPriceValue = 0;
  quickCostPriceValue: number | undefined = undefined;
  savingQuickPrice = false;

  // Full Test Modal State (Add & Edit)
  showTestModal = false;
  isEditMode = false;
  editingTestId: string | null = null;
  savingTest = false;

  currentTestForm = {
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
    itemType: 1,
    isActive: true
  };

  paramRows: ParamModel[] = [];

  // Delete State
  testToDelete: TestMaster | null = null;
  deleting = false;

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.api.getCategories().subscribe(cats => {
      this.categories = cats || [];
      if (this.categories.length > 0 && !this.currentTestForm.categoryId) {
        this.currentTestForm.categoryId = this.categories[0].id;
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

  editPriceFromPreview(test: TestMaster): void {
    this.selectedTestForModal = null;
    this.openQuickPriceModal(test);
  }

  // 1. Quick Price Change Logic
  openQuickPriceModal(test: TestMaster): void {
    this.selectedTestForPrice = test;
    this.quickPriceValue = test.price || 0;
    this.quickCostPriceValue = test.costPrice || undefined;
    this.cdr.detectChanges();
  }

  saveQuickPrice(): void {
    if (!this.selectedTestForPrice) return;
    if (this.quickPriceValue < 0) {
      this.toast.warning('Price cannot be negative.');
      return;
    }

    this.savingQuickPrice = true;
    this.api.updateTestPrice(this.selectedTestForPrice.id, this.quickPriceValue, this.quickCostPriceValue).subscribe({
      next: (res: any) => {
        this.savingQuickPrice = false;
        this.toast.success(res?.message || `Price updated to ₹${this.quickPriceValue}!`);
        if (this.selectedTestForPrice) {
          this.selectedTestForPrice.price = this.quickPriceValue;
          this.selectedTestForPrice.costPrice = this.quickCostPriceValue;
        }
        this.selectedTestForPrice = null;
        this.loadCatalog();
      },
      error: (err) => {
        this.savingQuickPrice = false;
        this.toast.error(err.error?.message || 'Failed to update test price.');
      }
    });
  }

  // 2. Add / Edit Full Investigation
  openAddTestModal(): void {
    this.isEditMode = false;
    this.editingTestId = null;
    this.currentTestForm = {
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
      itemType: 1,
      isActive: true
    };
    this.paramRows = [
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
    this.showTestModal = true;
  }

  openEditTestModal(test: TestMaster): void {
    this.isEditMode = true;
    this.editingTestId = test.id;
    this.currentTestForm = {
      testCode: test.testCode,
      testName: test.testName,
      shortName: test.shortName || test.testCode,
      categoryId: test.categoryId,
      price: test.price,
      costPrice: test.costPrice || 0,
      tatHours: test.tatHours,
      sampleType: test.sampleType || 'Serum Clotted',
      containerVialType: test.containerVialType || 'Yellow / Gel SST',
      methodology: test.methodology || 'Automated Analyzer',
      itemType: test.itemType || 1,
      isActive: test.isActive !== false
    };

    if (test.parameters && test.parameters.length > 0) {
      this.paramRows = test.parameters.map((p: any, idx: number) => {
        const primaryRange = p.normalRanges && p.normalRanges.length > 0 ? p.normalRanges[0] : null;
        return {
          id: p.id,
          parameterCode: p.parameterCode || `P${idx + 1}`,
          parameterName: p.parameterName,
          unit: p.unit || '',
          inputType: p.inputType || 1,
          defaultValue: p.defaultValue || '',
          textualRange: primaryRange?.textualRange || '',
          minNormalValue: primaryRange?.minNormalValue !== undefined ? primaryRange.minNormalValue : null,
          maxNormalValue: primaryRange?.maxNormalValue !== undefined ? primaryRange.maxNormalValue : null
        };
      });
    } else {
      this.paramRows = [];
    }

    this.showTestModal = true;
  }

  addParamRow(): void {
    const num = this.paramRows.length + 1;
    this.paramRows.push({
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
    this.paramRows.splice(index, 1);
  }

  submitTestForm(): void {
    if (!this.currentTestForm.testCode.trim()) {
      this.toast.warning('Please enter Test Code (e.g. WIDAL, DENGUE).');
      return;
    }
    if (!this.currentTestForm.testName.trim()) {
      this.toast.warning('Please enter Test Name.');
      return;
    }
    if (!this.currentTestForm.categoryId) {
      this.toast.warning('Please select Department / Category.');
      return;
    }

    this.savingTest = true;

    const payload: any = {
      categoryId: this.currentTestForm.categoryId,
      testCode: this.currentTestForm.testCode.trim().toUpperCase(),
      testName: this.currentTestForm.testName.trim(),
      shortName: this.currentTestForm.shortName || this.currentTestForm.testCode.trim().toUpperCase(),
      itemType: this.currentTestForm.itemType,
      sampleType: this.currentTestForm.sampleType,
      containerVialType: this.currentTestForm.containerVialType,
      price: this.currentTestForm.price || 0,
      costPrice: this.currentTestForm.costPrice || 0,
      tatHours: this.currentTestForm.tatHours || 4,
      methodology: this.currentTestForm.methodology,
      clinicalSignificance: '',
      preTestInstructions: '',
      interpretationTemplate: '',
      isActive: this.currentTestForm.isActive,
      parameters: this.paramRows.map((p, idx) => ({
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

    if (this.isEditMode && this.editingTestId) {
      this.api.updateTest(this.editingTestId, payload).subscribe({
        next: (res: any) => {
          this.savingTest = false;
          this.showTestModal = false;
          this.toast.success(res?.message || `Investigation "${this.currentTestForm.testName}" updated successfully!`);
          this.loadCatalog();
        },
        error: (err) => {
          this.savingTest = false;
          this.toast.error(err.error?.message || 'Failed to update test.');
        }
      });
    } else {
      this.api.createTest(payload).subscribe({
        next: () => {
          this.savingTest = false;
          this.showTestModal = false;
          this.toast.success(`Investigation "${this.currentTestForm.testName}" added to catalog successfully!`);
          this.loadCatalog();
        },
        error: (err) => {
          this.savingTest = false;
          this.toast.error(err.error?.message || 'Failed to save test.');
        }
      });
    }
  }

  // 3. Delete Logic
  openDeleteModal(test: TestMaster): void {
    this.testToDelete = test;
  }

  confirmDelete(): void {
    if (!this.testToDelete) return;
    this.deleting = true;
    this.api.deleteTest(this.testToDelete.id).subscribe({
      next: (res: any) => {
        this.deleting = false;
        this.toast.success(res?.message || `Investigation "${this.testToDelete?.testName}" removed.`);
        this.testToDelete = null;
        this.loadCatalog();
      },
      error: (err) => {
        this.deleting = false;
        this.toast.error(err.error?.message || 'Failed to delete test.');
      }
    });
  }
}
