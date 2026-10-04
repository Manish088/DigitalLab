import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
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
          <h2 class="text-xl font-bold text-slate-900 font-heading">Subscription, SaaS Billing & Payment Gateway</h2>
          <p class="text-xs text-slate-500">Upgrade your cloud pathology plan, manage recurring cycles, and download GST SaaS tax invoices.</p>
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

          <button (click)="initiateCheckout(plan)" [disabled]="plan.monthlyPrice === 0"
            class="w-full py-3 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 transition-all disabled:opacity-40">
            {{ plan.monthlyPrice === 0 ? 'Current Trial' : 'Subscribe via Razorpay' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class SubscriptionComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  plans: SubscriptionPlan[] = [];
  mySub: any = null;
  billingCycle = 'Monthly';

  ngOnInit(): void {
    this.api.getPlans().subscribe(p => {
      this.plans = p || [];
      this.cdr.detectChanges();
    });
    this.api.getMySubscription().subscribe(s => {
      this.mySub = s;
      this.cdr.detectChanges();
    });
  }

  initiateCheckout(plan: SubscriptionPlan): void {
    this.api.createSubscriptionOrder(plan.id, this.billingCycle).subscribe({
      next: (order) => {
        // Mock Razorpay successful verification
        const mockVerify = {
          razorpayOrderId: order.orderId,
          razorpayPaymentId: 'pay_' + Math.random().toString(36).substring(7),
          razorpaySignature: 'sig_' + Math.random().toString(36).substring(7),
          planId: plan.id,
          billingCycle: this.billingCycle
        };

        this.api.verifySubscriptionPayment(mockVerify).subscribe({
          next: () => {
            alert(`Payment of ₹${order.amount} successful! Plan ${plan.planName} activated.`);
            this.api.getMySubscription().subscribe(s => {
              this.mySub = s;
              this.cdr.detectChanges();
            });
          },
          error: (err) => alert(err.error?.message || 'Payment verification failed.')
        });
      },
      error: (err) => alert('Error creating Razorpay order.')
    });
  }
}
