import { Injectable, signal, effect, inject } from '@angular/core';
import { Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';

export interface RealtimeCaseEvent {
  caseId: string;
  caseNumber: string;
  patientName: string;
  status: string;
  netAmount?: number;
  dueAmount?: number;
  testNames?: string[];
  uhid?: string;
  barcode?: string;
  orderDate?: string;
}

export interface CriticalPanicEvent {
  caseId: string;
  caseNumber: string;
  patientName: string;
  criticalCount: number;
  parameters: Array<{
    parameterName: string;
    resultValue: string;
    unit: string;
    normalRangeText: string;
  }>;
  alertTime: string;
}

export interface ReportApprovedEvent {
  caseId: string;
  caseNumber: string;
  status: string;
  approvedByName: string;
  approvedAt: string;
  publicAccessToken: string;
}

export interface PaymentUpdatedEvent {
  caseId: string;
  caseNumber: string;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  private hubConnection: signalR.HubConnection | null = null;

  // Connection status signal
  isConnected = signal<boolean>(false);
  connectionStatus = signal<'Disconnected' | 'Connecting' | 'Connected' | 'Reconnecting'>('Disconnected');

  // Event Streams
  caseCreated$ = new Subject<RealtimeCaseEvent>();
  caseStatusChanged$ = new Subject<RealtimeCaseEvent>();
  reportApproved$ = new Subject<ReportApprovedEvent>();
  criticalPanicAlert$ = new Subject<CriticalPanicEvent>();
  paymentUpdated$ = new Subject<PaymentUpdatedEvent>();

  constructor() {
    // Automatically monitor user login status and manage SignalR connection
    effect(() => {
      const user = this.authService.currentUserSignal();
      if (user) {
        this.startConnection(user.tenantId);
      } else {
        this.stopConnection();
      }
    });
  }

  public async startConnection(tenantId?: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) return;

    // Resolve hub URL
    let hubBaseUrl = environment.apiUrl.replace('/api', '');
    if (!hubBaseUrl.startsWith('http')) {
      hubBaseUrl = window.location.origin;
    }
    const hubUrl = `${hubBaseUrl}/hubs/lab`;

    this.connectionStatus.set('Connecting');

    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => this.authService.getToken() || '',
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.registerHandlers();

      await this.hubConnection.start();
      this.isConnected.set(true);
      this.connectionStatus.set('Connected');
      console.log('✅ [SignalR] Connected to DigitLab Real-time Hub');

      if (tenantId) {
        await this.hubConnection.invoke('JoinTenantRoom', tenantId);
      }

      this.hubConnection.onreconnecting(() => {
        this.isConnected.set(false);
        this.connectionStatus.set('Reconnecting');
      });

      this.hubConnection.onreconnected(async () => {
        this.isConnected.set(true);
        this.connectionStatus.set('Connected');
        if (tenantId) {
          await this.hubConnection?.invoke('JoinTenantRoom', tenantId);
        }
      });

      this.hubConnection.onclose(() => {
        this.isConnected.set(false);
        this.connectionStatus.set('Disconnected');
      });

    } catch (err) {
      console.warn('⚠️ [SignalR] Failed to connect to Real-time Hub:', err);
      this.isConnected.set(false);
      this.connectionStatus.set('Disconnected');
    }
  }

  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch {}
      this.hubConnection = null;
      this.isConnected.set(false);
      this.connectionStatus.set('Disconnected');
    }
  }

  private registerHandlers(): void {
    if (!this.hubConnection) return;

    // 1. New Case Created
    this.hubConnection.on('CaseCreated', (data: RealtimeCaseEvent) => {
      console.log('⚡ [SignalR] CaseCreated received:', data);
      this.caseCreated$.next(data);
      this.toastService.info(
        `New case ${data.caseNumber} registered for ${data.patientName}.`,
        'New Case Live Alert'
      );
    });

    // 2. Case Status Changed
    this.hubConnection.on('CaseStatusChanged', (data: RealtimeCaseEvent) => {
      console.log('⚡ [SignalR] CaseStatusChanged received:', data);
      this.caseStatusChanged$.next(data);
      this.toastService.info(
        `Case ${data.caseNumber} status updated to ${data.status}.`,
        'Status Live Update'
      );
    });

    // 3. Report Approved
    this.hubConnection.on('ReportApproved', (data: ReportApprovedEvent) => {
      console.log('⚡ [SignalR] ReportApproved received:', data);
      this.reportApproved$.next(data);
      this.toastService.success(
        `Report for case ${data.caseNumber} has been verified & approved by ${data.approvedByName}!`,
        'Report Approved'
      );
    });

    // 4. Critical / Panic Value Alert (Audible/Red Warning)
    this.hubConnection.on('CriticalPanicAlert', (data: CriticalPanicEvent) => {
      console.warn('🚨 [SignalR] CriticalPanicAlert received:', data);
      this.criticalPanicAlert$.next(data);
      const paramsList = data.parameters?.map(p => `${p.parameterName}: ${p.resultValue} ${p.unit}`).join(', ');
      this.toastService.error(
        `CRITICAL VALUE DETECTED for ${data.patientName} (${data.caseNumber})! Parameters: ${paramsList}`,
        '🚨 Panic Alert'
      );
    });

    // 5. Payment Settle / Update
    this.hubConnection.on('PaymentUpdated', (data: PaymentUpdatedEvent) => {
      console.log('⚡ [SignalR] PaymentUpdated received:', data);
      this.paymentUpdated$.next(data);
      this.toastService.success(
        `Payment updated for ${data.caseNumber}. Remaining Due: ₹${data.dueAmount}`,
        'Payment Live Update'
      );
    });
  }
}
