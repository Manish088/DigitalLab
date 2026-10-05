import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { SubscriptionPlan } from '../../core/models/lims.models';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900 font-heading">Subscription, SaaS Billing & Payments</h2>
          <p class="text-xs text-slate-500">Upgrade your cloud pathology plan, pay via Instant UPI QR / PhonePe / GPay, and manage your billing cycles.</p>
        </div>
      </div>

      <!-- Current Active Plan Status -->
      <div *ngIf="mySub" class="bg-gradient-to-r from-brand-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Status: {{ mySub.subscriptionStatus }}
            </span>
          </div>
          <h3 class="text-xl font-bold font-heading">
            Current Plan: {{ mySub.currentPlan?.planName || 'Free 14-Day Evaluation' }}
          </h3>
          <p class="text-xs text-slate-400">
            Valid Until: <strong>{{ mySub.subscriptionExpiryDate ? (mySub.subscriptionExpiryDate | date:'dd MMMM yyyy') : 'No Expiry Set' }}</strong>
          </p>
        </div>

        <div class="flex items-center space-x-2">
          <span class="text-xs font-medium text-slate-300">Billing Cycle:</span>
          <div class="bg-slate-800 p-1 rounded-xl flex border border-slate-700 text-xs">
            <button (click)="billingCycle = 'Monthly'" [class]="billingCycle === 'Monthly' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400'" class="px-3 py-1 rounded-lg transition-all">Monthly</button>
            <button (click)="billingCycle = 'Annual'" [class]="billingCycle === 'Annual' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400'" class="px-3 py-1 rounded-lg transition-all">Annual (20% OFF)</button>
          </div>
        </div>
      </div>

      <!-- Subscription Plans Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div *ngFor="let plan of plans" [class]="plan.planCode === 'PREMIUM' ? 'ring-2 ring-brand-500 border-brand-500' : 'border-slate-200/80'"
          class="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-6 hover:shadow-lg transition-all">
          <div class="space-y-4">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-bold text-base text-slate-900 font-heading">{{ plan.planName }}</h3>
                <p class="text-xs text-slate-500 mt-1">{{ plan.description }}</p>
              </div>
              <span *ngIf="plan.planCode === 'PREMIUM'" class="px-2 py-0.5 bg-brand-500 text-white text-[10px] font-black rounded-full uppercase">Most Popular</span>
            </div>

            <div>
              <div class="text-3xl font-black text-slate-900 font-heading">
                ₹{{ (billingCycle === 'Annual' ? plan.annualPrice : plan.monthlyPrice) | number:'1.0-0' }}
                <span class="text-xs font-normal text-slate-400">/ {{ billingCycle === 'Annual' ? 'year' : 'month' }}</span>
              </div>
            </div>

            <!-- Features -->
            <ul class="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 text-xs"></i> Up to <strong>{{ plan.maxCasesPerMonth }}</strong> cases / month</li>
              <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 text-xs"></i> <strong>{{ plan.maxStaffAccounts }}</strong> staff user logins</li>
              <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 text-xs"></i> Custom Letterhead Designer</li>
              <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 text-xs"></i> Online QR Token Report Sharing</li>
              <li class="flex items-center"><i class="fa-solid fa-check text-emerald-600 mr-2 text-xs"></i> Doctor Referral Commission Ledger</li>
              <li *ngIf="plan.hasWhatsAppAlerts" class="flex items-center text-brand-700 font-bold"><i class="fa-solid fa-check text-brand-600 mr-2 text-xs"></i> WhatsApp & SMS Alerts</li>
            </ul>
          </div>

          <div class="space-y-2">
            <button (click)="openUpiModal(plan)" [disabled]="plan.monthlyPrice === 0"
              class="w-full py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-40">
              <i class="fa-solid fa-qrcode text-sm"></i>
              <span>{{ plan.monthlyPrice === 0 ? 'Current Trial' : 'Pay via UPI QR Code / GPay / PhonePe' }}</span>
            </button>
            <button *ngIf="plan.monthlyPrice > 0" (click)="initiateRazorpayCheckout(plan)"
              class="w-full py-2 rounded-xl font-semibold text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all">
              Pay via Card / NetBanking
            </button>
          </div>
        </div>
      </div>

      <!-- Responsive Compact UPI Payment Modal -->
      <div *ngIf="showUpiModal && selectedPlan" 
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
        <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh] animate-fade-in">
          
          <!-- Modal Header (Compact) -->
          <div class="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-3.5 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                <i class="fa-solid fa-qrcode"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold font-heading">Scan & Pay via UPI</h3>
                <p class="text-[10px] text-emerald-100">0% Transaction Fee • Instant Activation</p>
              </div>
            </div>
            <button (click)="closeUpiModal()" class="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 w-7 h-7 rounded-full flex items-center justify-center transition-all">
              <i class="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>

          <!-- Modal Scrollable Content -->
          <div class="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
            
            <!-- Plan Summary & Amount -->
            <div class="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <div>
                <div class="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">{{ selectedPlan.planName }} ({{ billingCycle }})</div>
                <div class="text-[10px] text-slate-500">{{ billingCycle === 'Annual' ? '12 Months Access' : '1 Month Access' }}</div>
              </div>
              <div class="text-2xl font-black text-emerald-700 font-heading">
                ₹{{ getPayAmount() | number:'1.0-0' }}
              </div>
            </div>

            <!-- Dynamic UPI QR Code Section -->
            <div class="flex flex-col items-center justify-center text-center space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div class="p-2 bg-white rounded-xl shadow-sm border border-slate-200 inline-block">
                <img [src]="getUpiQrUrl()" alt="UPI QR Code" class="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto">
              </div>
              
              <!-- Supported Apps Badges -->
              <div class="flex items-center space-x-1.5 text-[10px] font-medium text-slate-500">
                <span class="px-2 py-0.5 bg-white rounded border border-slate-200">Google Pay</span>
                <span class="px-2 py-0.5 bg-white rounded border border-slate-200">PhonePe</span>
                <span class="px-2 py-0.5 bg-white rounded border border-slate-200">Paytm</span>
                <span class="px-2 py-0.5 bg-white rounded border border-slate-200">BHIM UPI</span>
              </div>
            </div>

            <!-- UPI ID & Copy Row -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-600 font-medium">Or Pay to UPI ID:</span>
                <span class="text-slate-500">Payee: <strong class="text-slate-700">{{ paymentConfig.payeeName }}</strong></span>
              </div>
              <div class="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <i class="fa-solid fa-at text-brand-600 text-xs"></i>
                <span class="flex-1 font-mono font-bold text-xs text-slate-800 truncate select-all">{{ paymentConfig.upiId }}</span>
                <button (click)="copyUpiId()" class="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm shrink-0">
                  {{ copied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-2.5 pt-1">
              <!-- WhatsApp Screenshot Button -->
              <a [href]="getWhatsAppShareUrl()" target="_blank" 
                class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all">
                <i class="fa-brands fa-whatsapp text-sm"></i>
                <span>Send Receipt on WhatsApp</span>
              </a>

              <!-- UTR Reference Verification -->
              <div class="pt-2 border-t border-slate-100 space-y-1.5">
                <label class="block text-[11px] font-medium text-slate-600">Submit UTR / Reference (Optional for Instant Activation):</label>
                <div class="flex space-x-2">
                  <input type="text" [(ngModel)]="transactionUtr" placeholder="e.g. 427812984123" 
                    class="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                  <button (click)="submitManualPayment()" [disabled]="isSubmitting"
                    class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 shrink-0">
                    {{ isSubmitting ? '...' : 'Verify & Activate' }}
                  </button>
                </div>
              </div>
            </div>

          </div>

          <!-- Modal Footer (Compact) -->
          <div class="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500 shrink-0">
            <span>Helpline WhatsApp: <strong>+91 {{ paymentConfig.whatsappNumber }}</strong></span>
            <button (click)="closeUpiModal()" class="text-slate-600 hover:text-slate-900 font-semibold text-xs">Close</button>
          </div>

        </div>
      </div>

    </div>
  `
})
export class SubscriptionComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  plans: SubscriptionPlan[] = [];
  mySub: any = null;
  billingCycle = 'Monthly';

  // UPI Payment Config
  paymentConfig = {
    upiId: 'yadavmanishkk-2@okhdfcbank',
    payeeName: 'Manish Yadav',
    whatsappNumber: '7706087066',
    bankName: '',
    accountNo: '',
    ifscCode: ''
  };

  showUpiModal = false;
  selectedPlan: SubscriptionPlan | null = null;
  transactionUtr = '';
  isSubmitting = false;
  copied = false;

  ngOnInit(): void {
    this.loadPlans();
    this.loadMySub();
    this.loadPaymentConfig();
  }

  loadPlans(): void {
    this.api.getPlans().subscribe(p => {
      this.plans = p || [];
      this.cdr.detectChanges();
    });
  }

  loadMySub(): void {
    this.api.getMySubscription().subscribe(s => {
      this.mySub = s;
      this.cdr.detectChanges();
    });
  }

  loadPaymentConfig(): void {
    this.api.getPaymentConfig().subscribe({
      next: (cfg) => {
        if (cfg) {
          this.paymentConfig = {
            upiId: cfg.upiId || this.paymentConfig.upiId,
            payeeName: cfg.payeeName || this.paymentConfig.payeeName,
            whatsappNumber: cfg.whatsAppNumber || this.paymentConfig.whatsappNumber,
            bankName: cfg.bankName || this.paymentConfig.bankName,
            accountNo: cfg.accountNo || this.paymentConfig.accountNo,
            ifscCode: cfg.ifscCode || this.paymentConfig.ifscCode
          };
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  openUpiModal(plan: SubscriptionPlan): void {
    this.selectedPlan = plan;
    this.transactionUtr = '';
    this.copied = false;
    this.showUpiModal = true;
  }

  closeUpiModal(): void {
    this.showUpiModal = false;
    this.selectedPlan = null;
  }

  getPayAmount(): number {
    if (!this.selectedPlan) return 0;
    return this.billingCycle === 'Annual' ? this.selectedPlan.annualPrice : this.selectedPlan.monthlyPrice;
  }

  getUpiQrUrl(): string {
    if (!this.selectedPlan) return '';
    const amount = this.getPayAmount();
    const upiUri = `upi://pay?pa=${this.paymentConfig.upiId}&pn=${encodeURIComponent(this.paymentConfig.payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('DigitalLab ' + this.selectedPlan.planName)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
  }

  copyUpiId(): void {
    navigator.clipboard.writeText(this.paymentConfig.upiId);
    this.copied = true;
    this.toast.success('UPI ID copied to clipboard!');
    setTimeout(() => {
      this.copied = false;
      this.cdr.detectChanges();
    }, 2500);
  }

  getWhatsAppShareUrl(): string {
    if (!this.selectedPlan) return '';
    const amount = this.getPayAmount();
    const labName = this.mySub?.labName || 'My Pathology Lab';
    const text = `Hello Manish Sir, I have made a subscription payment for DigitalLab.\n\n*Plan:* ${this.selectedPlan.planName}\n*Cycle:* ${this.billingCycle}\n*Amount:* ₹${amount}\n*UPI ID Paid To:* ${this.paymentConfig.upiId}\n*UTR/Ref No:* ${this.transactionUtr || '[Attached Screenshot]'}\n\nPlease activate my subscription.`;
    return `https://wa.me/91${this.paymentConfig.whatsappNumber}?text=${encodeURIComponent(text)}`;
  }

  submitManualPayment(): void {
    if (!this.selectedPlan) return;

    this.isSubmitting = true;
    const payload = {
      planId: this.selectedPlan.id,
      billingCycle: this.billingCycle,
      transactionUtr: this.transactionUtr.trim() || undefined,
      remarks: `Paid via UPI ID ${this.paymentConfig.upiId}`
    };

    this.api.submitManualPayment(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.toast.success(`Payment verified! ${this.selectedPlan?.planName} activated successfully.`);
        this.closeUpiModal();
        this.loadMySub();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toast.error(err.error?.message || 'Error activating plan.');
      }
    });
  }

  initiateRazorpayCheckout(plan: SubscriptionPlan): void {
    this.api.createSubscriptionOrder(plan.id, this.billingCycle).subscribe({
      next: (order) => {
        const mockVerify = {
          razorpayOrderId: order.orderId,
          razorpayPaymentId: 'pay_' + Math.random().toString(36).substring(7),
          razorpaySignature: 'sig_' + Math.random().toString(36).substring(7),
          planId: plan.id,
          billingCycle: this.billingCycle
        };

        this.api.verifySubscriptionPayment(mockVerify).subscribe({
          next: () => {
            this.toast.success(`Payment of ₹${order.amount} successful! Plan ${plan.planName} activated.`);
            this.loadMySub();
          },
          error: (err) => this.toast.error(err.error?.message || 'Payment verification failed.')
        });
      },
      error: () => this.toast.error('Error creating Razorpay order.')
    });
  }
}
