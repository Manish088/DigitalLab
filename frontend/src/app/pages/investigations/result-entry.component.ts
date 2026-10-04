import { Component, OnInit, inject, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { TestMaster, TestCategory } from '../../core/models/lims.models';

@Component({
  selector: 'app-result-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Loading State -->
      <div *ngIf="loading" class="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center space-y-3">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-brand-600"></i>
        <div class="text-sm font-bold text-slate-700">Loading Patient Case & Investigation Parameters...</div>
        <p class="text-xs text-slate-400">Fetching diagnostic parameters, normal ranges, and previous values...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage && !loading" class="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-rose-800 text-xs space-y-3">
        <div class="font-bold flex items-center text-sm">
          <i class="fa-solid fa-triangle-exclamation mr-2 text-rose-600"></i> Unable to Load Investigation
        </div>
        <p>{{ errorMessage }}</p>
        <div class="flex items-center space-x-3 pt-2">
          <button (click)="loadInvestigationDetails()" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition-colors">
            <i class="fa-solid fa-rotate-right mr-1.5"></i> Retry
          </button>
          <a routerLink="/cases" class="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors">
            Back to Case List
          </a>
        </div>
      </div>

      <!-- Main Content when caseDetails is loaded -->
      <ng-container *ngIf="caseDetails && !loading">
        <!-- Top Patient & Case Status Banner -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <a routerLink="/cases" class="text-xs font-bold text-slate-500 hover:text-brand-600 mr-1"><i class="fa-solid fa-arrow-left mr-1"></i> Cases</a>
              <span class="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Case: {{ caseDetails.caseNumber }}</span>
              <span class="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">||| {{ caseDetails.barcode }}</span>
              <span [ngClass]="{
                'bg-emerald-50 text-emerald-700 border-emerald-200': caseDetails.status === 'Approved',
                'bg-blue-50 text-blue-700 border-blue-200': caseDetails.status === 'Completed',
                'bg-amber-50 text-amber-700 border-amber-200': caseDetails.status === 'Registered' || caseDetails.status === 'SampleCollected',
                'bg-purple-50 text-purple-700 border-purple-200': caseDetails.status === 'InProgress'
              }" class="px-2.5 py-0.5 rounded-full text-xs font-bold border">
                {{ caseDetails.status }}
              </span>
            </div>
            <h2 class="text-xl font-black text-slate-900 font-heading">
              {{ caseDetails.patient?.fullName }}
              <span class="text-slate-500 font-normal text-sm">({{ caseDetails.patient?.ageYears }} Yrs / {{ getGenderDisplay(caseDetails.patient?.gender) }})</span>
            </h2>
            <div class="text-xs text-slate-500 flex items-center space-x-3">
              <span><strong>UHID:</strong> {{ caseDetails.patient?.uhid }}</span>
              <span>•</span>
              <span><strong>Ref Doctor:</strong> {{ caseDetails.doctorName }}</span>
              <span>•</span>
              <span><strong>Order Date:</strong> {{ caseDetails.orderDate | date:'dd MMM yyyy, hh:mm a' }}</span>
              <span *ngIf="caseDetails.approvedByName">•</span>
              <span *ngIf="caseDetails.approvedByName" class="text-emerald-700 font-semibold">
                <strong>Approved by:</strong> {{ caseDetails.approvedByName }} ({{ caseDetails.approvedAt | date:'dd MMM, hh:mm a' }})
              </span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Add More Tests Button (Available before approval) -->
            <button *ngIf="caseDetails.status !== 'Approved'" (click)="openAddTestsModal()"
              class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer">
              <i class="fa-solid fa-plus-circle mr-1.5"></i> Add Tests
            </button>

            <!-- Save Button (Only when not approved) -->
            <button *ngIf="caseDetails.status !== 'Approved'" (click)="saveResults()" [disabled]="saving"
              class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 transition-all disabled:opacity-50">
              <i *ngIf="saving" class="fa-solid fa-spinner fa-spin mr-1.5"></i>
              <i *ngIf="!saving" class="fa-solid fa-floppy-disk mr-1.5"></i>
              Save Results
            </button>

            <!-- Approve Report Button / Approved Badge -->
            <button *ngIf="caseDetails.status !== 'Approved'" (click)="approveReport()" [disabled]="approving"
              class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50">
              <i *ngIf="approving" class="fa-solid fa-spinner fa-spin mr-1.5"></i>
              <i *ngIf="!approving" class="fa-solid fa-stamp mr-1.5"></i>
              Verify & Approve Report
            </button>

            <span *ngIf="caseDetails.status === 'Approved'"
              class="inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
              <i class="fa-solid fa-circle-check mr-1.5 text-emerald-600"></i> Report Approved & Locked ✓
            </span>

            <!-- View PDF Report (Standard with Header) -->
            <button type="button" (click)="printReportPdf(true)"
              class="inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-semibold bg-brand-50 hover:bg-brand-100 text-brand-800 transition-all cursor-pointer shadow-sm border border-brand-200">
              <i class="fa-solid fa-file-pdf mr-1.5 text-brand-600"></i> Print Report PDF
            </button>

            <!-- View PDF Report (Pre-printed Letterhead Mode) -->
            <button type="button" (click)="printReportPdf(false)"
              class="inline-flex items-center px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer shadow-sm"
              title="Print on pre-printed laboratory letterhead stationary">
              <i class="fa-solid fa-print mr-1 text-slate-500"></i> Letterhead Mode
            </button>

            <!-- View Invoice / Bill -->
            <button type="button" (click)="printInvoicePdf()"
              class="inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer shadow-sm">
              <i class="fa-solid fa-file-invoice mr-1.5 text-emerald-600"></i> Print Bill
            </button>
          </div>
        </div>

        <!-- Approved & Locked Security Alert Banner -->
        <div *ngIf="caseDetails.status === 'Approved'" class="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-300/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-200">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
              <i class="fa-solid fa-shield-halved text-lg"></i>
            </div>
            <div>
              <div class="text-xs font-bold text-emerald-950 flex items-center space-x-2">
                <span>Verified Diagnostic Report (Results Locked)</span>
                <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">LOCKED & SIGNED ✓</span>
              </div>
              <div class="text-[11px] text-emerald-800 mt-0.5">
                Approved by <strong>{{ caseDetails.approvedByName }}</strong> on {{ caseDetails.approvedAt | date:'dd MMM yyyy, hh:mm a' }}. Input editing is disabled to protect clinical report authenticity.
              </div>
            </div>
          </div>

          <button type="button" (click)="showUnlockModal = true" class="px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 font-bold text-xs shadow-sm transition-all flex items-center shrink-0">
            <i class="fa-solid fa-lock-open mr-1.5 text-amber-600"></i> Unlock Report to Edit
          </button>
        </div>

        <!-- Investigation Parameters Grid -->
        <div class="space-y-6" *ngFor="let item of caseDetails.items">
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <!-- Item Department & Test Name Header -->
            <div class="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-xs font-semibold uppercase">{{ item.categoryName }}</span>
                <h3 class="font-bold text-sm font-heading">{{ item.testName }} ({{ item.testCode }})</h3>
                <button *ngIf="caseDetails.status !== 'Approved' && caseDetails.items.length > 1" (click)="removeTest(item)"
                  class="ml-2 text-rose-300 hover:text-rose-100 hover:bg-rose-900/50 p-1 rounded transition-colors" title="Remove this test from case">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
              <div class="text-xs text-slate-400">
                Sample: <strong class="text-slate-200">{{ item.sampleType || 'Whole Blood' }}</strong> ({{ item.containerVialType || 'EDTA' }})
              </div>
            </div>

            <!-- Parameters Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th class="p-3 w-1/3">Investigation Parameter</th>
                    <th class="p-3 w-1/4">Result Value *</th>
                    <th class="p-3 w-1/6">Unit</th>
                    <th class="p-3 w-1/4">Normal Reference Range</th>
                    <th class="p-3 w-1/6 text-center">Status Flag</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let param of item.parameters" class="hover:bg-slate-50/50">
                    <!-- Parameter Name -->
                    <td class="p-3 font-semibold text-slate-800">
                      {{ param.parameterName }}
                    </td>

                    <!-- Result Input -->
                    <td class="p-3">
                      <div class="relative">
                        <!-- Dropdown Options if optionsList is present -->
                        <select *ngIf="param.optionsList && param.optionsList.length > 0"
                          [(ngModel)]="param.resultValue" (change)="onValueChange(param)"
                          [disabled]="caseDetails.status === 'Approved'"
                          [class.bg-slate-100]="caseDetails.status === 'Approved'"
                          [class.cursor-not-allowed]="caseDetails.status === 'Approved'"
                          [class.font-bold]="caseDetails.status === 'Approved'"
                          class="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none">
                          <option value="">Select Option</option>
                          <option *ngFor="let opt of param.optionsList" [value]="opt">{{ opt }}</option>
                        </select>

                        <!-- Standard Text / Numeric Input -->
                        <input *ngIf="!param.optionsList || param.optionsList.length === 0"
                          type="text" [(ngModel)]="param.resultValue" (input)="onValueChange(param)" placeholder="Enter value"
                          [readonly]="caseDetails.status === 'Approved'"
                          [disabled]="caseDetails.status === 'Approved'"
                          [class]="caseDetails.status === 'Approved' 
                            ? 'w-full px-3 py-1.5 text-xs border border-slate-200 bg-slate-100/90 text-slate-900 font-bold rounded-lg cursor-not-allowed select-none shadow-none'
                            : (param.isAbnormal ? 'w-full px-3 py-1.5 text-xs border border-rose-400 bg-rose-50/40 text-rose-900 font-bold rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all' : 'w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all')">
                      </div>
                    </td>

                    <!-- Unit -->
                    <td class="p-3 text-slate-500 font-mono">
                      {{ param.unit || '-' }}
                    </td>

                    <!-- Normal Range -->
                    <td class="p-3 text-slate-600">
                      <span class="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                        {{ param.normalRangeText || 'N/A' }}
                      </span>
                    </td>

                    <!-- Status Flag Badge -->
                    <td class="p-3 text-center">
                      <span *ngIf="param.flag === 'Normal'" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Normal
                      </span>
                      <span *ngIf="param.flag === 'High'" class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                        HIGH ↑
                      </span>
                      <span *ngIf="param.flag === 'Low'" class="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                        LOW ↓
                      </span>
                      <span *ngIf="param.flag === 'Critical'" class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-sm">
                        CRITICAL ⚠
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Clinical Remarks & Interpretation Notes -->
            <div class="p-4 bg-slate-50/70 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Pathologist Remarks / Impression</label>
                <textarea [(ngModel)]="item.pathologistRemarks" rows="2" placeholder="e.g. Normocytic Normochromic blood picture. No abnormal cells seen."
                  [readonly]="caseDetails.status === 'Approved'"
                  [disabled]="caseDetails.status === 'Approved'"
                  [class.bg-slate-100]="caseDetails.status === 'Approved'"
                  [class.cursor-not-allowed]="caseDetails.status === 'Approved'"
                  class="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"></textarea>
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Clinical Interpretation / Notes</label>
                <textarea [(ngModel)]="item.interpretationNote" rows="2" placeholder="Standard clinical guidance or interpretation template..."
                  [readonly]="caseDetails.status === 'Approved'"
                  [disabled]="caseDetails.status === 'Approved'"
                  [class.bg-slate-100]="caseDetails.status === 'Approved'"
                  [class.cursor-not-allowed]="caseDetails.status === 'Approved'"
                  class="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Report Approval Confirmation Modal Popup -->
        <div *ngIf="showApproveModal" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div class="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 mx-auto shadow-inner">
              <i class="fa-solid fa-stamp text-2xl"></i>
            </div>
            
            <div class="text-center space-y-2">
              <h3 class="text-lg font-bold text-slate-900 font-heading">Verify & Approve Report?</h3>
              <p class="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to verify and digitally approve this laboratory report for
                <strong class="text-slate-800">{{ caseDetails?.patient?.fullName }}</strong> (Case: <span class="font-mono text-brand-600 font-bold">{{ caseDetails?.caseNumber }}</span>)?
              </p>
              <div class="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100 text-emerald-800 text-[11px] text-left space-y-1">
                <div class="flex items-center font-bold text-emerald-900">
                  <i class="fa-solid fa-circle-check text-emerald-600 mr-1.5"></i> Digital Signatures Applied
                </div>
                <div class="text-slate-600">The PDF report will be verified, doctor digital signature will be embedded, and status will update to <strong class="text-emerald-700">Approved</strong>.</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mt-6">
              <button type="button" (click)="showApproveModal = false" [disabled]="approving"
                class="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="button" (click)="confirmApproveReport()" [disabled]="approving"
                class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center">
                <i *ngIf="approving" class="fa-solid fa-spinner fa-spin mr-1.5"></i>
                <i *ngIf="!approving" class="fa-solid fa-check-double mr-1.5"></i>
                {{ approving ? 'Approving...' : 'Yes, Approve Now' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Custom Report Unlock Confirmation Modal Popup -->
        <div *ngIf="showUnlockModal" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 mx-auto shadow-inner">
              <i class="fa-solid fa-lock-open text-2xl"></i>
            </div>
            
            <div class="text-center space-y-2">
              <h3 class="text-lg font-bold text-slate-900 font-heading">Unlock Report for Modification?</h3>
              <p class="text-xs text-slate-500 leading-relaxed">
                This report is currently verified & approved. Unlocking it will remove digital approval status and allow parameter values or tests to be modified.
              </p>
              <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] text-left space-y-1">
                <div class="flex items-center font-bold text-amber-900">
                  <i class="fa-solid fa-triangle-exclamation text-amber-600 mr-1.5"></i> Re-approval Required
                </div>
                <div class="text-slate-600">After updating results, you will need to re-verify and approve the report again before generating final certified PDFs.</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mt-6">
              <button type="button" (click)="showUnlockModal = false" [disabled]="unlocking"
                class="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="button" (click)="confirmUnlockReport()" [disabled]="unlocking"
                class="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center">
                <i *ngIf="unlocking" class="fa-solid fa-spinner fa-spin mr-1.5"></i>
                <i *ngIf="!unlocking" class="fa-solid fa-lock-open mr-1.5"></i>
                {{ unlocking ? 'Unlocking...' : 'Yes, Unlock Report' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Add More Tests Modal Popup -->
        <div *ngIf="showAddTestsModal" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95 duration-200 space-y-4">
            
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 class="text-base font-bold text-slate-900 font-heading flex items-center">
                  <i class="fa-solid fa-vial-virus text-indigo-600 mr-2"></i> Add Additional Tests to Case
                </h3>
                <p class="text-xs text-slate-500">Case: <span class="font-mono font-bold text-brand-600">{{ caseDetails?.caseNumber }}</span> | Patient: <strong>{{ caseDetails?.patient?.fullName }}</strong></p>
              </div>
              <button type="button" (click)="showAddTestsModal = false" class="text-slate-400 hover:text-slate-600 text-sm">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <!-- Search & Filters -->
            <div class="space-y-2">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div class="sm:col-span-2 relative">
                  <input type="text" [(ngModel)]="addTestSearch" placeholder="Search test name or code..."
                    class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
                </div>
                <div>
                  <select [(ngModel)]="addTestCategory" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    <option value="">All Categories</option>
                    <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.categoryName }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Test Catalog List -->
            <div class="border border-slate-200 rounded-2xl max-h-60 overflow-y-auto divide-y divide-slate-100">
              <div *ngIf="loadingCatalog" class="p-6 text-center text-xs text-slate-400">
                <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading test catalog...
              </div>

              <div *ngFor="let t of filteredAvailableTests"
                (click)="toggleNewTest(t)"
                [class.bg-indigo-50]="isTestSelectedForAdd(t.id)"
                [class.opacity-60]="isTestAlreadyInCase(t.id)"
                [class.cursor-not-allowed]="isTestAlreadyInCase(t.id)"
                [class.cursor-pointer]="!isTestAlreadyInCase(t.id)"
                class="p-2.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                
                <div class="flex items-center space-x-3">
                  <input type="checkbox"
                    [checked]="isTestSelectedForAdd(t.id) || isTestAlreadyInCase(t.id)"
                    [disabled]="isTestAlreadyInCase(t.id)"
                    (click)="$event.stopPropagation(); toggleNewTest(t)"
                    class="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4">
                  <div>
                    <div class="font-bold text-xs text-slate-800">{{ t.testName }}</div>
                    <div class="text-[10px] text-slate-400">{{ t.testCode }} • {{ t.categoryName || 'General' }}</div>
                  </div>
                </div>

                <div class="text-right">
                  <div class="font-bold text-xs text-slate-900">₹{{ t.price }}</div>
                  <span *ngIf="isTestAlreadyInCase(t.id)" class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Already in Case ✓
                  </span>
                </div>
              </div>
            </div>

            <!-- Pricing & Payment Inputs for Added Tests -->
            <div *ngIf="selectedNewTestIds.length > 0" class="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 space-y-3">
              <div class="flex justify-between items-center text-xs font-bold text-slate-800">
                <span>Selected ({{ selectedNewTestIds.length }} new test(s)):</span>
                <span class="text-indigo-900 text-sm">₹{{ addedGrossTotal }}</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-indigo-100 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Additional Discount (₹)</label>
                  <input type="number" [(ngModel)]="additionalDiscount" (input)="onAddDiscountChange()" min="0" [max]="addedGrossTotal"
                    class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1 flex justify-between items-center">
                    <span>Pay Now Amount (₹)</span>
                    <button type="button" (click)="payFullAdded()" class="text-[10px] text-indigo-600 font-bold hover:underline">Full Paid</button>
                  </label>
                  <input type="number" [(ngModel)]="additionalPaid" min="0" [max]="addedNetPayable"
                    class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-emerald-600 bg-white">
                </div>
              </div>

              <div *ngIf="additionalPaid > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select [(ngModel)]="additionalPaymentMethod" class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">
                    <option [value]="1">Cash Counter</option>
                    <option [value]="2">UPI / QR Code</option>
                    <option [value]="3">Card</option>
                    <option [value]="4">Net Banking</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Transaction Ref / Note</label>
                  <input type="text" [(ngModel)]="additionalTransactionRef" placeholder="e.g. UPI Ref / Receipt No"
                    class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">
                </div>
              </div>
            </div>

            <!-- Footer Buttons -->
            <div class="flex items-center justify-end space-x-3 pt-2">
              <button type="button" (click)="showAddTestsModal = false" [disabled]="addingTests"
                class="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="button" (click)="submitAddTests()" [disabled]="addingTests || selectedNewTestIds.length === 0"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center disabled:opacity-50">
                <i *ngIf="addingTests" class="fa-solid fa-spinner fa-spin mr-1.5"></i>
                <i *ngIf="!addingTests" class="fa-solid fa-plus mr-1.5"></i>
                {{ addingTests ? 'Adding Tests...' : 'Add ' + selectedNewTestIds.length + ' Test(s) to Case' }}
              </button>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class ResultEntryComponent implements OnInit {
  public api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @Input() id?: string;

  caseId = '';
  caseDetails: any = null;
  loading = true;
  saving = false;
  approving = false;
  showApproveModal = false;
  showUnlockModal = false;
  unlocking = false;
  errorMessage = '';

  // Add Tests Modal State
  showAddTestsModal = false;
  catalogTests: TestMaster[] = [];
  categories: TestCategory[] = [];
  loadingCatalog = false;
  addTestSearch = '';
  addTestCategory = '';
  selectedNewTestIds: string[] = [];
  additionalDiscount = 0;
  additionalPaid = 0;
  additionalPaymentMethod = 1;
  additionalTransactionRef = '';
  addingTests = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.caseId = this.id || params.get('id') || this.route.snapshot.params['id'] || '';
      if (this.caseId) {
        this.loadInvestigationDetails();
      } else {
        this.loading = false;
        this.errorMessage = 'No Case ID found in URL route.';
        this.cdr.detectChanges();
      }
    });
  }

  loadInvestigationDetails(): void {
    if (!this.caseId) {
      this.loading = false;
      this.errorMessage = 'No Case ID specified.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.api.getInvestigationDetails(this.caseId).subscribe({
      next: (res) => {
        try {
          this.caseDetails = res;
          if (this.caseDetails?.items) {
            this.caseDetails.items.forEach((item: any) => {
              if (item.parameters) {
                item.parameters.forEach((p: any) => {
                  p.optionsList = this.parseOptions(p.optionsJson);
                  this.onValueChange(p);
                });
              }
            });
          }
        } catch (e: any) {
          console.error('Error processing case details:', e);
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading investigation:', err);
        if (err.status === 401) {
          this.errorMessage = 'Your session has expired. Please log in again to view case investigation.';
        } else if (err.status === 404) {
          this.errorMessage = `Case not found with ID: ${this.caseId}`;
        } else {
          this.errorMessage = err.error?.message || (typeof err.error === 'string' ? err.error : 'Failed to load case investigation details from server.');
        }
        this.cdr.detectChanges();
      }
    });
  }

  parseOptions(optionsJson?: string): string[] {
    if (!optionsJson) return [];
    try {
      const parsed = JSON.parse(optionsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return optionsJson.split(',').map(s => s.trim()).filter(s => !s);
    }
  }

  getGenderDisplay(gender: any): string {
    if (gender === 1 || gender === 'Male' || gender === 'male') return 'Male';
    if (gender === 2 || gender === 'Female' || gender === 'female') return 'Female';
    if (gender === 3 || gender === 'Other') return 'Other';
    return gender || 'N/A';
  }

  getReportPdfUrl(caseId: string, letterheadMode: boolean = true): string {
    return this.api.getReportPdfUrl(caseId, letterheadMode);
  }

  printReportPdf(letterheadMode: boolean = true): void {
    const targetId = this.caseDetails?.id || this.caseId;
    if (!targetId) return;

    if (this.caseDetails?.items) {
      const payload = {
        caseOrderId: this.caseId,
        items: (this.caseDetails.items || []).map((i: any) => ({
          caseOrderItemId: i.id,
          pathologistRemarks: i.pathologistRemarks,
          interpretationNote: i.interpretationNote,
          results: (i.parameters || []).map((p: any) => ({
            parameterId: p.parameterId,
            resultValue: p.resultValue !== undefined && p.resultValue !== null ? p.resultValue.toString() : '',
            remarks: p.remarks || ''
          }))
        }))
      };

      this.api.saveInvestigationResults(payload).subscribe({
        next: () => window.open(this.api.getReportPdfUrl(targetId, letterheadMode), '_blank'),
        error: () => window.open(this.api.getReportPdfUrl(targetId, letterheadMode), '_blank')
      });
    } else {
      window.open(this.api.getReportPdfUrl(targetId, letterheadMode), '_blank');
    }
  }

  printInvoicePdf(): void {
    const targetId = this.caseDetails?.id || this.caseId;
    if (targetId) {
      window.open(this.api.getInvoicePdfUrl(targetId), '_blank');
    }
  }

  onValueChange(param: any): void {
    if (!param.resultValue) {
      param.flag = 'Normal';
      param.isAbnormal = false;
      return;
    }

    const val = parseFloat(param.resultValue);
    if (isNaN(val)) {
      param.flag = 'Normal';
      param.isAbnormal = false;
      return;
    }

    if (param.panicLowValue !== null && param.panicLowValue !== undefined && val <= param.panicLowValue) {
      param.flag = 'Critical';
      param.isAbnormal = true;
    } else if (param.panicHighValue !== null && param.panicHighValue !== undefined && val >= param.panicHighValue) {
      param.flag = 'Critical';
      param.isAbnormal = true;
    } else if (param.minNormalValue !== null && param.minNormalValue !== undefined && val < param.minNormalValue) {
      param.flag = 'Low';
      param.isAbnormal = true;
    } else if (param.maxNormalValue !== null && param.maxNormalValue !== undefined && val > param.maxNormalValue) {
      param.flag = 'High';
      param.isAbnormal = true;
    } else {
      param.flag = 'Normal';
      param.isAbnormal = false;
    }
  }

  saveResults(): void {
    this.saving = true;
    const payload = {
      caseOrderId: this.caseId,
      items: (this.caseDetails.items || []).map((i: any) => ({
        caseOrderItemId: i.id,
        pathologistRemarks: i.pathologistRemarks,
        interpretationNote: i.interpretationNote,
        results: (i.parameters || []).map((p: any) => ({
          parameterId: p.parameterId,
          resultValue: p.resultValue !== undefined && p.resultValue !== null ? p.resultValue.toString() : '',
          remarks: p.remarks || ''
        }))
      }))
    };

    this.api.saveInvestigationResults(payload).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('Investigation results saved successfully!');
        this.cdr.detectChanges();
        this.loadInvestigationDetails();
      },
      error: (err) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.message || 'Error saving results.');
      }
    });
  }

  approveReport(): void {
    if (this.caseDetails?.status === 'Approved') return;
    this.showApproveModal = true;
    this.cdr.detectChanges();
  }

  confirmApproveReport(): void {
    this.approving = true;
    this.cdr.detectChanges();

    const payload = {
      caseOrderId: this.caseId,
      items: (this.caseDetails?.items || []).map((i: any) => ({
        caseOrderItemId: i.id,
        pathologistRemarks: i.pathologistRemarks,
        interpretationNote: i.interpretationNote,
        results: (i.parameters || []).map((p: any) => ({
          parameterId: p.parameterId,
          resultValue: p.resultValue !== undefined && p.resultValue !== null ? p.resultValue.toString() : '',
          remarks: p.remarks || ''
        }))
      }))
    };

    // First save the entered values into database, then approve!
    this.api.saveInvestigationResults(payload).subscribe({
      next: () => {
        this.api.approveReport(this.caseId).subscribe({
          next: () => {
            this.approving = false;
            this.showApproveModal = false;
            this.toast.success('Report verified & digitally approved with Doctor Signature!');
            this.cdr.detectChanges();
            this.loadInvestigationDetails();
          },
          error: (err) => {
            this.approving = false;
            this.showApproveModal = false;
            this.cdr.detectChanges();
            this.toast.error(err.error?.message || 'Error approving report.');
          }
        });
      },
      error: (err) => {
        this.approving = false;
        this.showApproveModal = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.message || 'Error saving results before approval.');
      }
    });
  }

  confirmUnlockReport(): void {
    this.unlocking = true;
    this.cdr.detectChanges();
    this.api.unlockReport(this.caseId).subscribe({
      next: (res) => {
        this.unlocking = false;
        this.showUnlockModal = false;
        this.toast.success(res.message || 'Report unlocked successfully. You can now edit results.');
        this.cdr.detectChanges();
        this.loadInvestigationDetails();
      },
      error: (err) => {
        this.unlocking = false;
        this.showUnlockModal = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.message || 'Failed to unlock report.');
      }
    });
  }

  // Add Tests Logic
  openAddTestsModal(): void {
    if (this.caseDetails?.status === 'Approved') {
      this.toast.warning('Cannot add tests to an already approved report.');
      return;
    }

    this.selectedNewTestIds = [];
    this.additionalDiscount = 0;
    this.additionalPaid = 0;
    this.additionalPaymentMethod = 1;
    this.additionalTransactionRef = '';
    this.addTestSearch = '';
    this.addTestCategory = '';
    this.showAddTestsModal = true;
    this.cdr.detectChanges();

    if (this.catalogTests.length === 0) {
      this.loadingCatalog = true;
      this.cdr.detectChanges();

      this.api.getCategories().subscribe({
        next: (cats) => {
          this.categories = cats || [];
          this.cdr.detectChanges();
        }
      });

      this.api.getTests().subscribe({
        next: (tests) => {
          this.catalogTests = tests || [];
          this.loadingCatalog = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loadingCatalog = false;
          this.cdr.detectChanges();
          this.toast.error('Failed to load test catalog.');
        }
      });
    }
  }

  isTestAlreadyInCase(testId: string): boolean {
    return (this.caseDetails?.items || []).some((i: any) => i.testId === testId);
  }

  isTestSelectedForAdd(testId: string): boolean {
    return this.selectedNewTestIds.includes(testId);
  }

  toggleNewTest(t: TestMaster): void {
    if (this.isTestAlreadyInCase(t.id)) return;

    const idx = this.selectedNewTestIds.indexOf(t.id);
    if (idx >= 0) {
      this.selectedNewTestIds.splice(idx, 1);
    } else {
      this.selectedNewTestIds.push(t.id);
    }

    this.additionalPaid = this.addedNetPayable;
    this.cdr.detectChanges();
  }

  get filteredAvailableTests(): TestMaster[] {
    return this.catalogTests.filter(t => {
      const matchCat = !this.addTestCategory || t.categoryId === this.addTestCategory;
      const search = this.addTestSearch.trim().toLowerCase();
      const matchSearch = !search ||
        t.testName.toLowerCase().includes(search) ||
        t.testCode.toLowerCase().includes(search) ||
        (t.categoryName && t.categoryName.toLowerCase().includes(search));
      return matchCat && matchSearch;
    });
  }

  get addedGrossTotal(): number {
    return this.catalogTests
      .filter(t => this.selectedNewTestIds.includes(t.id))
      .reduce((sum, t) => sum + t.price, 0);
  }

  get addedNetPayable(): number {
    return Math.max(0, this.addedGrossTotal - this.additionalDiscount);
  }

  onAddDiscountChange(): void {
    if (this.additionalDiscount > this.addedGrossTotal) {
      this.additionalDiscount = this.addedGrossTotal;
    }
    this.additionalPaid = this.addedNetPayable;
    this.cdr.detectChanges();
  }

  payFullAdded(): void {
    this.additionalPaid = this.addedNetPayable;
    this.cdr.detectChanges();
  }

  submitAddTests(): void {
    if (this.selectedNewTestIds.length === 0) {
      this.toast.warning('Please select at least one test to add.');
      return;
    }

    this.addingTests = true;
    this.cdr.detectChanges();

    const payload = {
      testIds: this.selectedNewTestIds,
      additionalDiscountAmount: Number(this.additionalDiscount) || 0,
      additionalPaidAmount: Number(this.additionalPaid) || 0,
      paymentMethod: Number(this.additionalPaymentMethod) || 1,
      transactionRef: this.additionalTransactionRef ? this.additionalTransactionRef.trim() : null
    };

    this.api.addTestsToCase(this.caseId, payload).subscribe({
      next: (res) => {
        this.addingTests = false;
        this.showAddTestsModal = false;
        this.toast.success(res.message || 'Tests added successfully to case!');
        this.cdr.detectChanges();
        this.loadInvestigationDetails();
      },
      error: (err) => {
        this.addingTests = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.message || 'Failed to add tests to case.');
      }
    });
  }

  removeTest(item: any): void {
    if (this.caseDetails?.status === 'Approved') {
      this.toast.warning('Cannot remove tests from an approved report.');
      return;
    }
    if ((this.caseDetails?.items || []).length <= 1) {
      this.toast.warning('A case must have at least one test.');
      return;
    }

    this.api.removeTestFromCase(this.caseId, item.id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Test removed from case.');
        this.loadInvestigationDetails();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to remove test from case.');
      }
    });
  }
}
