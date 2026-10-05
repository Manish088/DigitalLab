import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { DoctorReferral, TestMaster, TestCategory } from '../../core/models/lims.models';

@Component({
  selector: 'app-case-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900 font-heading">Patient Cases & Workflow Ledger</h2>
          <p class="text-xs text-slate-500">Track registration, investigation entry, pathologist verification & payment settlements.</p>
        </div>
        <div class="flex items-center space-x-3">
          <button (click)="exportToCsv()" [disabled]="loading || cases.length === 0"
            class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
            title="Export filtered case records to Microsoft Excel / CSV">
            <i class="fa-solid fa-file-excel mr-2"></i> Export to Excel (CSV)
          </button>
          <a routerLink="/cases/add" class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-500/20 transition-all">
            <i class="fa-solid fa-plus mr-2"></i> New Registration
          </a>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <!-- Search -->
          <div class="lg:col-span-2 relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <i class="fa-solid fa-magnifying-glass text-xs"></i>
            </div>
            <input type="text" [(ngModel)]="filters.search" (keyup.enter)="loadCases()" placeholder="Search patient name, mobile, case no, barcode..."
              class="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
          </div>

          <!-- Doctor Filter -->
          <div>
            <select [(ngModel)]="filters.doctorId" (change)="loadCases()" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              <option value="">All Referring Doctors</option>
              <option *ngFor="let doc of doctors" [value]="doc.id">{{ doc.doctorName }}</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <select [(ngModel)]="filters.status" (change)="loadCases()" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              <option value="">All Report Statuses</option>
              <option [value]="1">1 - Registered</option>
              <option [value]="2">2 - Sample Collected</option>
              <option [value]="3">3 - In Progress</option>
              <option [value]="4">4 - Completed</option>
              <option [value]="5">5 - Approved</option>
            </select>
          </div>

          <!-- Payment Status -->
          <div>
            <select [(ngModel)]="filters.paymentStatus" (change)="loadCases()" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
              <option value="">All Payment Statuses</option>
              <option [value]="3">Fully Paid</option>
              <option [value]="2">Partial Due</option>
              <option [value]="1">Unpaid</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span class="text-slate-500 font-medium">Found {{ totalCount }} cases</span>
          <button (click)="resetFilters()" class="text-brand-600 hover:text-brand-700 font-semibold">
            <i class="fa-solid fa-rotate-left mr-1"></i> Reset Filters
          </button>
        </div>
      </div>

      <!-- Cases Data Table -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th class="p-3.5">Case / Barcode</th>
                <th class="p-3.5">Patient Details</th>
                <th class="p-3.5">Doctor / Centre</th>
                <th class="p-3.5">Tests Booked</th>
                <th class="p-3.5">Financials (₹)</th>
                <th class="p-3.5">Workflow Status</th>
                <th class="p-3.5 text-right whitespace-nowrap min-w-[220px]">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <!-- Loading Row -->
              <tr *ngIf="loading">
                <td colspan="7" class="p-8 text-center text-slate-500">
                  <i class="fa-solid fa-circle-notch fa-spin text-2xl text-brand-600 mb-2"></i>
                  <div class="text-xs font-semibold text-slate-600">Loading Patient Cases & Workflow Ledger...</div>
                </td>
              </tr>

              <!-- Empty State Row -->
              <tr *ngIf="!loading && cases.length === 0">
                <td colspan="7" class="p-8 text-center text-slate-500 space-y-2">
                  <i class="fa-solid fa-folder-open text-2xl text-slate-300"></i>
                  <div class="text-xs font-bold text-slate-700">No patient cases found</div>
                  <p class="text-[11px] text-slate-400">No registered cases match your current filter criteria.</p>
                  <a routerLink="/cases/add" class="inline-flex items-center mt-2 px-3 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-500">
                    <i class="fa-solid fa-plus mr-1.5"></i> Register New Case
                  </a>
                </td>
              </tr>

              <tr *ngFor="let c of cases" class="hover:bg-slate-50/80 transition-colors">
                <!-- Case & Barcode -->
                <td class="p-3.5">
                  <div class="font-bold text-slate-900">{{ c.caseNumber }}</div>
                  <div class="flex items-center space-x-1.5 mt-0.5">
                    <span class="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{{ c.barcode }}</span>
                    <button (click)="showBarcode(c)" class="text-slate-400 hover:text-brand-600" title="Print Barcode Label">
                      <i class="fa-solid fa-barcode text-xs"></i>
                    </button>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">{{ c.orderDate | date:'dd MMM yyyy, hh:mm a' }}</div>
                </td>

                <!-- Patient -->
                <td class="p-3.5">
                  <div class="font-bold text-slate-800">{{ c.patientName }}</div>
                  <div class="text-slate-500 text-[11px]">{{ c.patientAgeGender }}</div>
                  <div class="text-slate-400 text-[10px]"><i class="fa-solid fa-phone text-[9px] mr-1"></i>{{ c.patientPhone || 'No phone' }}</div>
                </td>

                <!-- Doctor -->
                <td class="p-3.5">
                  <div class="font-medium text-slate-800">{{ c.doctorName }}</div>
                </td>

                <!-- Tests Booked -->
                <td class="p-3.5 min-w-[220px] max-w-[320px]">
                  <div class="space-y-1">
                    <div *ngFor="let tName of getDisplayedTests(c)" 
                      class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold border border-slate-200 mr-1 mb-1 max-w-full"
                      [title]="tName">
                      <i class="fa-solid fa-vial text-brand-600 text-[10px] shrink-0"></i>
                      <span class="truncate">{{ tName }}</span>
                    </div>

                    <!-- If more than 3 tests, show a +X more pill with expand toggle -->
                    <span *ngIf="getTotalTestCount(c) > 3 && !c.expandedTests" 
                      (click)="c.expandedTests = true"
                      class="inline-flex items-center px-2 py-0.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-[10px] font-bold border border-brand-200 cursor-pointer"
                      [title]="c.testsSummary">
                      + {{ getTotalTestCount(c) - 3 }} more...
                    </span>

                    <span *ngIf="c.expandedTests" 
                      (click)="c.expandedTests = false"
                      class="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer">
                      Show less ▲
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5 font-medium">{{ c.testsCount }} test(s) booked</div>
                </td>

                <!-- Financials -->
                <td class="p-3.5">
                  <div class="font-bold text-slate-900">₹{{ c.netAmount | number:'1.2-2' }}</div>
                  <div *ngIf="c.dueAmount > 0" class="text-rose-600 font-bold text-[11px] flex items-center space-x-1">
                    <span>Due: ₹{{ c.dueAmount }}</span>
                    <button (click)="openDueModal(c)" class="px-1 py-0.2 bg-rose-50 text-rose-700 rounded border border-rose-200 text-[9px] hover:bg-rose-100">
                      Settle
                    </button>
                  </div>
                  <div *ngIf="c.dueAmount <= 0" class="text-emerald-600 font-semibold text-[11px]">Paid in Full</div>
                </td>

                <!-- Status -->
                <td class="p-3.5">
                  <span [ngClass]="{
                    'bg-emerald-50 text-emerald-700 border-emerald-200': c.status === 'Approved',
                    'bg-blue-50 text-blue-700 border-blue-200': c.status === 'Completed',
                    'bg-amber-50 text-amber-700 border-amber-200': c.status === 'Registered' || c.status === 'SampleCollected',
                    'bg-purple-50 text-purple-700 border-purple-200': c.status === 'InProgress'
                  }" class="px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block">
                    {{ c.status }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="p-3.5 text-right whitespace-nowrap min-w-[220px]">
                  <div class="inline-flex items-center justify-end space-x-1 flex-nowrap">
                    <!-- Add More Tests (If Not Approved) -->
                    <button *ngIf="c.status !== 'Approved'" (click)="openAddTestsModal(c)"
                      class="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 transition-colors" title="Add More Tests to Case">
                      <i class="fa-solid fa-plus-circle text-xs"></i>
                    </button>

                    <!-- Result Entry -->
                    <a [routerLink]="['/investigations', c.id]" class="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-600 transition-colors" title="Investigation Result Entry">
                      <i class="fa-solid fa-vial-circle-check text-xs"></i>
                    </a>

                    <!-- Invoice / A4 Bill (Always available for billing/payment) -->
                    <a [href]="api.getInvoicePdfUrl(c.id)" target="_blank" class="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 transition-colors" title="Print Tax Invoice / Bill">
                      <i class="fa-solid fa-file-invoice text-xs"></i>
                    </a>

                    <!-- Report PDF (Letterhead Mode) - ONLY AFTER REPORT IS APPROVED -->
                    <a *ngIf="c.status === 'Approved'" [href]="api.getReportPdfUrl(c.id, true)" target="_blank" class="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 transition-colors" title="Print A4 Patient Report">
                      <i class="fa-solid fa-file-pdf text-xs"></i>
                    </a>

                    <!-- WhatsApp Share Report Link - ONLY AFTER REPORT IS APPROVED -->
                    <button *ngIf="c.status === 'Approved'" type="button" (click)="shareReportOnWhatsApp(c)"
                      class="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer" 
                      title="Send Verified Report on Patient's WhatsApp">
                      <i class="fa-brands fa-whatsapp text-xs"></i>
                    </button>

                    <!-- Public QR Download Link - ONLY AFTER REPORT IS APPROVED -->
                    <a *ngIf="c.status === 'Approved'" [routerLink]="['/report/download', c.publicAccessToken]" target="_blank" class="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors" title="Public QR Token Download URL">
                      <i class="fa-solid fa-qrcode text-xs"></i>
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Settle Due Modal -->
      <div *ngIf="settleModalCase" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-sm font-bold text-slate-900 font-heading">Quick Due Payment Settlement</h3>
            <button (click)="settleModalCase = null" class="text-slate-400 hover:text-slate-600">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
            <div><span class="text-slate-500">Case No:</span> <strong class="text-slate-900">{{ settleModalCase.caseNumber }}</strong></div>
            <div><span class="text-slate-500">Patient:</span> <strong class="text-slate-900">{{ settleModalCase.patientName }}</strong></div>
            <div class="text-rose-600 font-bold"><span class="text-slate-500">Current Balance Due:</span> ₹{{ settleModalCase.dueAmount }}</div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Paying Amount (₹)</label>
              <input type="number" [(ngModel)]="settleData.amount" min="1" [max]="settleModalCase.dueAmount"
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-bold text-emerald-600 focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select [(ngModel)]="settleData.paymentMethod" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none">
                <option [value]="1">Cash Counter</option>
                <option [value]="2">UPI / QR Code</option>
                <option [value]="3">Card</option>
                <option [value]="4">Net Banking</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Payment Reference / Remarks</label>
              <input type="text" [(ngModel)]="settleData.referenceNumber" placeholder="e.g. UPI Reference or Notes"
                class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl">
            </div>
          </div>

          <div class="flex space-x-3 pt-2">
            <button (click)="settleModalCase = null" class="flex-1 py-2 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-50">
              Cancel
            </button>
            <button (click)="submitDueSettlement()" class="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30">
              Confirm Payment
            </button>
          </div>
        </div>
      </div>

      <!-- Barcode Sticker Modal -->
      <div *ngIf="barcodeModalCase" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 class="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">Sample Tube Barcode Label</h3>
            <button (click)="barcodeModalCase = null" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 space-y-2">
            <div class="text-[11px] font-bold text-slate-900">{{ barcodeModalCase.patientName }} ({{ barcodeModalCase.patientAgeGender }})</div>
            <div class="w-full h-16 flex items-center justify-center p-1 bg-white rounded">
              <img [src]="api.getBarcodeSvgUrl(barcodeModalCase.id)" alt="Barcode" class="h-full object-contain">
            </div>
            <div class="text-[10px] text-slate-500 font-mono">{{ barcodeModalCase.caseNumber }}</div>
          </div>

          <button onclick="window.print()" class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md">
            <i class="fa-solid fa-print mr-1.5"></i> Print Thermal Label (50x25mm)
          </button>
        </div>
      </div>

      <!-- Thermal POS Receipt Modal (58mm / 80mm) -->
      <div *ngIf="thermalModalCase" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center space-x-2">
              <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base">
                <i class="fa-solid fa-receipt"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900 font-heading">Thermal POS Receipt (Slip)</h3>
                <p class="text-[11px] text-slate-400">POS Thermal Roll Printer (58mm / 80mm)</p>
              </div>
            </div>
            <button (click)="thermalModalCase = null" class="text-slate-400 hover:text-slate-600">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Roll Size Selector Tabs -->
          <div class="flex items-center justify-center space-x-2 p-1 bg-slate-100 rounded-xl">
            <button type="button" (click)="thermalRollWidth = 80" [class]="thermalRollWidth === 80 ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'" class="flex-1 py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer">
              <i class="fa-solid fa-scroll"></i>
              <span>80 mm (Standard POS)</span>
            </button>
            <button type="button" (click)="thermalRollWidth = 58" [class]="thermalRollWidth === 58 ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'" class="flex-1 py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer">
              <i class="fa-solid fa-scroll"></i>
              <span>58 mm (Compact Roll)</span>
            </button>
          </div>

          <!-- Live Thermal Paper Preview Screen -->
          <div class="overflow-y-auto flex-1 p-3 bg-slate-100 rounded-2xl flex justify-center border border-slate-200/60">
            <div [style.width]="thermalRollWidth === 58 ? '230px' : '310px'" class="bg-white p-4 shadow-md border border-slate-300 text-black font-mono text-[11px] space-y-2 transition-all select-none" id="printable-thermal-receipt">
              <div class="text-center font-bold text-xs uppercase leading-tight">{{ currentLabName }}</div>
              <div class="text-center text-[9px] text-slate-600">{{ currentLabAddress }}</div>
              <div class="text-center text-[9px] text-slate-600">Ph: {{ currentLabPhone }}</div>
              <div *ngIf="currentLabGstin" class="text-center text-[9px] font-bold text-slate-800">GSTIN: {{ currentLabGstin }}</div>
              
              <div class="border-b border-dashed border-black my-1"></div>
              <div class="text-center font-bold text-[10px] uppercase">{{ currentLabGstin ? 'TAX INVOICE / RECEIPT' : 'CASH BILL / RECEIPT' }}</div>
              <div class="border-b border-dashed border-black my-1"></div>
              
              <div class="text-[10px] space-y-0.5">
                <div class="flex justify-between">
                  <span>Bill: <strong>{{ thermalModalCase.caseNumber }}</strong></span>
                  <span>{{ thermalModalCase.orderDate | date:'dd/MM/yy hh:mm a' }}</span>
                </div>
                <div>Pt: <strong>{{ thermalModalCase.patientName }}</strong> ({{ thermalModalCase.patientAgeGender }})</div>
                <div>Mob: {{ thermalModalCase.patientPhone || 'N/A' }}</div>
                <div>Dr: {{ thermalModalCase.doctorName || 'Direct / Self' }}</div>
              </div>

              <div class="border-b border-dashed border-black my-1"></div>

              <!-- Tests list -->
              <div class="space-y-1 text-[10px]">
                <div class="font-bold flex justify-between border-b border-slate-200 pb-0.5">
                  <span>Particulars</span>
                  <span>Qty</span>
                </div>
                <div *ngFor="let t of getTestList(thermalModalCase); let idx = index" class="flex justify-between">
                  <span class="truncate pr-1">{{ idx + 1 }}. {{ t }}</span>
                  <span class="font-semibold shrink-0">1</span>
                </div>
              </div>

              <div class="border-b border-dashed border-black my-1"></div>

              <!-- Financials -->
              <div class="text-[10px] space-y-0.5">
                <div class="flex justify-between">
                  <span>Gross Total:</span>
                  <span>₹{{ thermalModalCase.totalAmount | number:'1.2-2' }}</span>
                </div>
                <div *ngIf="thermalModalCase.discountAmount > 0" class="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-₹{{ thermalModalCase.discountAmount | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between font-bold text-[11px] pt-0.5 border-t border-slate-200">
                  <span>Net Payable:</span>
                  <span>₹{{ thermalModalCase.netAmount | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between font-bold text-emerald-800">
                  <span>Paid Amount:</span>
                  <span>₹{{ thermalModalCase.paidAmount | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between font-bold" [class.text-rose-600]="thermalModalCase.dueAmount > 0">
                  <span>Balance Due:</span>
                  <span>₹{{ thermalModalCase.dueAmount | number:'1.2-2' }}</span>
                </div>
              </div>

              <div class="border-b border-dashed border-black my-1"></div>

              <div class="text-center text-[9px] space-y-0.5">
                <div>Barcode: <strong>{{ thermalModalCase.barcode }}</strong></div>
                <div>Thank You! Get Well Soon.</div>
                <div class="text-[8px] text-slate-500">*** Computer Generated POS Slip ***</div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button type="button" (click)="printThermalDirect()" class="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center space-x-1.5 cursor-pointer">
              <i class="fa-solid fa-print"></i>
              <span>Direct Thermal Print</span>
            </button>
            <a [href]="api.getThermalReceiptPdfUrl(thermalModalCase.id, thermalRollWidth)" target="_blank" class="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center justify-center space-x-1.5 text-center">
              <i class="fa-solid fa-file-pdf"></i>
              <span>Open Thermal PDF</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Add More Tests Modal Popup -->
      <div *ngIf="addTestsModalCase" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95 duration-200 space-y-4">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-bold text-slate-900 font-heading flex items-center">
                <i class="fa-solid fa-vial-virus text-indigo-600 mr-2"></i> Add Additional Tests to Case
              </h3>
              <p class="text-xs text-slate-500">Case: <span class="font-mono font-bold text-brand-600">{{ addTestsModalCase.caseNumber }}</span> | Patient: <strong>{{ addTestsModalCase.patientName }}</strong></p>
            </div>
            <button type="button" (click)="addTestsModalCase = null" class="text-slate-400 hover:text-slate-600 text-sm">
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
              class="p-2.5 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors">
              
              <div class="flex items-center space-x-3">
                <input type="checkbox"
                  [checked]="isTestSelectedForAdd(t.id)"
                  (click)="$event.stopPropagation(); toggleNewTest(t)"
                  class="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4">
                <div>
                  <div class="font-bold text-xs text-slate-800">{{ t.testName }}</div>
                  <div class="text-[10px] text-slate-400">{{ t.testCode }} • {{ t.categoryName || 'General' }}</div>
                </div>
              </div>

              <div class="text-right">
                <div class="font-bold text-xs text-slate-900">₹{{ t.price }}</div>
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
            <button type="button" (click)="addTestsModalCase = null" [disabled]="addingTests"
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
    </div>
  `
})
export class CaseListComponent implements OnInit {
  api = inject(ApiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  cases: any[] = [];
  doctors: DoctorReferral[] = [];
  totalCount = 0;
  loading = false;

  filters = {
    search: '',
    doctorId: '',
    status: '',
    paymentStatus: ''
  };

  settleModalCase: any = null;
  settleData = {
    amount: 0,
    paymentMethod: 1,
    referenceNumber: '',
    remarks: ''
  };

  barcodeModalCase: any = null;

  // Thermal POS Receipt Modal State
  thermalModalCase: any = null;
  thermalRollWidth: 80 | 58 = 80;
  currentLabName = 'CITY CARE DIAGNOSTICS & PATHOLOGY';
  currentLabAddress = 'Civil Lines, Azamgarh';
  currentLabPhone = '7706087066';
  currentLabGstin = '';

  // Add Tests Modal State
  addTestsModalCase: any = null;
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
    this.loadCases();
    this.api.getDoctors().subscribe(docs => {
      this.doctors = docs || [];
      this.cdr.detectChanges();
    });

    this.api.getLetterheadConfig().subscribe(cfg => {
      if (cfg) {
        this.currentLabName = cfg.labName || this.currentLabName;
        this.currentLabAddress = [cfg.address, cfg.city].filter(Boolean).join(', ') || this.currentLabAddress;
        this.currentLabPhone = cfg.phone || this.currentLabPhone;
        this.currentLabGstin = cfg.gstin || '';
        this.cdr.detectChanges();
      }
    });
  }

  loadCases(): void {
    this.loading = true;
    this.cdr.detectChanges();

    const queryParams: any = {
      search: this.filters.search,
      doctorId: this.filters.doctorId || undefined,
      status: this.filters.status ? Number(this.filters.status) : undefined,
      paymentStatus: this.filters.paymentStatus ? Number(this.filters.paymentStatus) : undefined,
      page: 1,
      pageSize: 50
    };

    this.api.getCases(queryParams).subscribe({
      next: (res) => {
        this.cases = res.items || [];
        this.totalCount = res.totalCount;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  resetFilters(): void {
    this.filters = { search: '', doctorId: '', status: '', paymentStatus: '' };
    this.loadCases();
  }

  openDueModal(caseItem: any): void {
    this.settleModalCase = caseItem;
    this.settleData = {
      amount: caseItem.dueAmount,
      paymentMethod: 1,
      referenceNumber: '',
      remarks: 'Due Settlement'
    };
  }

  submitDueSettlement(): void {
    if (!this.settleModalCase) return;

    this.api.settleDuePayment(this.settleModalCase.id, this.settleData).subscribe({
      next: () => {
        this.settleModalCase = null;
        this.toast.success(`Due payment of ₹${this.settleData.amount} settled successfully!`);
        this.loadCases();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error settling due payment.')
    });
  }

  showBarcode(c: any): void {
    this.barcodeModalCase = c;
  }

  openThermalSlipModal(c: any): void {
    this.thermalModalCase = c;
    this.cdr.detectChanges();
  }

  printThermalDirect(): void {
    const printContent = document.getElementById('printable-thermal-receipt');
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=450,height=650');
    if (!printWindow) {
      window.print();
      return;
    }

    const widthCss = this.thermalRollWidth === 58 ? '58mm' : '80mm';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>POS Receipt - ${this.thermalModalCase?.caseNumber || 'Bill'}</title>
          <style>
            @page {
              size: ${widthCss} auto;
              margin: 1mm;
            }
            body {
              font-family: 'Courier New', Courier, monospace, -apple-system, sans-serif;
              font-size: ${this.thermalRollWidth === 58 ? '10px' : '11px'};
              line-height: 1.25;
              margin: 0;
              padding: 2px;
              color: #000;
              width: ${widthCss};
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .border-dashed { border-bottom: 1px dashed #000; margin: 4px 0; }
            .flex { display: flex; justify-content: space-between; align-items: flex-start; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  shareReportOnWhatsApp(c: any): void {
    if (c.status !== 'Approved' && c.status !== 5) {
      this.toast.warning('Report has not been approved yet. WhatsApp report can only be sent after verification & approval.');
      return;
    }

    const rawPhone = (c.patientPhone || '').replace(/\D/g, '');
    const patientName = c.patientName || 'Patient';
    const caseNo = c.caseNumber || '';
    const origin = window.location.origin;
    const downloadUrl = `${origin}/report/download/${c.publicAccessToken}`;

    const message = `*Namaste ${patientName} Ji*,\n\nAapki Diagnostic Test Report ready aur verify ho chuki hai (Case No: *${caseNo}*).\n\n📄 *Apni Verified Report Download karein:*\n${downloadUrl}\n\n_Thank you for choosing our Laboratory!_`;

    if (!rawPhone || rawPhone.length < 10) {
      this.toast.warning(`Patient phone number is missing or invalid: ${c.patientPhone || 'N/A'}`);
      // Open WhatsApp web with text without phone so staff can select chat
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      return;
    }

    const targetPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    this.toast.success(`Opening WhatsApp for ${patientName}...`);
  }

  // Add Tests Logic
  openAddTestsModal(caseItem: any): void {
    if (caseItem.status === 'Approved') {
      this.toast.warning('Cannot add tests to an already approved report.');
      return;
    }

    this.addTestsModalCase = caseItem;
    this.selectedNewTestIds = [];
    this.additionalDiscount = 0;
    this.additionalPaid = 0;
    this.additionalPaymentMethod = 1;
    this.additionalTransactionRef = '';
    this.addTestSearch = '';
    this.addTestCategory = '';
    this.cdr.detectChanges();

    if (this.catalogTests.length === 0) {
      this.loadingCatalog = true;
      this.cdr.detectChanges();

      this.api.getCategories().subscribe(cats => {
        this.categories = cats || [];
        this.cdr.detectChanges();
      });

      this.api.getTests().subscribe({
        next: (tests) => {
          this.catalogTests = tests || [];
          this.loadingCatalog = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingCatalog = false;
          this.cdr.detectChanges();
          this.toast.error('Failed to load test catalog.');
        }
      });
    }
  }

  isTestSelectedForAdd(testId: string): boolean {
    return this.selectedNewTestIds.includes(testId);
  }

  toggleNewTest(t: TestMaster): void {
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
    if (!this.addTestsModalCase || this.selectedNewTestIds.length === 0) {
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

    this.api.addTestsToCase(this.addTestsModalCase.id, payload).subscribe({
      next: (res) => {
        this.addingTests = false;
        this.addTestsModalCase = null;
        this.toast.success(res.message || 'Tests added successfully to case!');
        this.cdr.detectChanges();
        this.loadCases();
      },
      error: (err) => {
        this.addingTests = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.message || 'Failed to add tests to case.');
      }
    });
  }

  getTestList(c: any): string[] {
    if (c.testNames && Array.isArray(c.testNames) && c.testNames.length > 0) {
      return c.testNames;
    }
    if (c.testsSummary) {
      return c.testsSummary.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    }
    return [];
  }

  getTotalTestCount(c: any): number {
    return c.testsCount || this.getTestList(c).length;
  }

  getDisplayedTests(c: any): string[] {
    const list = this.getTestList(c);
    if (c.expandedTests || list.length <= 3) {
      return list;
    }
    return list.slice(0, 3);
  }

  exportToCsv(): void {
    if (!this.cases || this.cases.length === 0) {
      this.toast.warning('No case records available to export.');
      return;
    }

    const headers = [
      'Case Number',
      'Barcode',
      'Date & Time',
      'Patient Name',
      'Age & Gender',
      'Phone Number',
      'Referring Doctor',
      'Tests Booked',
      'Tests Count',
      'Gross Amount (INR)',
      'Discount (INR)',
      'Net Amount (INR)',
      'Paid Amount (INR)',
      'Balance Due (INR)',
      'Payment Status',
      'Workflow Status'
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = this.cases.map(c => {
      const tests = this.getTestList(c).join('; ');
      const paymentStatusStr = c.dueAmount <= 0 ? 'Fully Paid' : (c.paidAmount > 0 ? 'Partial Due' : 'Unpaid');
      const dateFormatted = c.orderDate ? new Date(c.orderDate).toLocaleString('en-IN') : '';

      return [
        escapeCsv(c.caseNumber),
        escapeCsv(c.barcode),
        escapeCsv(dateFormatted),
        escapeCsv(c.patientName),
        escapeCsv(c.patientAgeGender),
        escapeCsv(c.patientPhone || ''),
        escapeCsv(c.doctorName || 'Direct / Self'),
        escapeCsv(tests),
        escapeCsv(c.testsCount || 1),
        escapeCsv(Number(c.totalAmount || 0).toFixed(2)),
        escapeCsv(Number(c.discountAmount || 0).toFixed(2)),
        escapeCsv(Number(c.netAmount || 0).toFixed(2)),
        escapeCsv(Number(c.paidAmount || 0).toFixed(2)),
        escapeCsv(Number(c.dueAmount || 0).toFixed(2)),
        escapeCsv(paymentStatusStr),
        escapeCsv(c.status)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    link.setAttribute('href', url);
    link.setAttribute('download', `Patient_Cases_Ledger_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.toast.success(`Exported ${this.cases.length} case records to Excel (CSV) successfully!`);
  }
}

