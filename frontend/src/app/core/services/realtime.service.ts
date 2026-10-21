import { Injectable, signal, effect, inject, NgZone } from '@angular/core';
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
  private ngZone = inject(NgZone);

  private hubConnection: signalR.HubConnection | null = null;
  private reconnectInterval: any = null;

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

    // Background health check & auto-reconnect every 6 seconds if logged in but disconnected
    this.reconnectInterval = setInterval(() => {
      const user = this.authService.currentUserSignal();
      if (user && (!this.hubConnection || this.hubConnection.state === signalR.HubConnectionState.Disconnected)) {
        console.log('🔄 [SignalR Auto-Reconnect] Checking and re-establishing live connection...');
        this.startConnection(user.tenantId);
      }
    }, 6000);
  }

  public async startConnection(tenantId?: string): Promise<void> {
    if (this.hubConnection && 
       (this.hubConnection.state === signalR.HubConnectionState.Connected || 
        this.hubConnection.state === signalR.HubConnectionState.Connecting)) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) return;

    // Resolve hub URL
    let hubBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    if (!hubBaseUrl.startsWith('http')) {
      const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
      hubBaseUrl = `http://${host}:5000`;
    } else if (hubBaseUrl.includes(':4200')) {
      hubBaseUrl = hubBaseUrl.replace(':4200', ':5000');
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
      this.ngZone.run(() => {
        this.isConnected.set(true);
        this.connectionStatus.set('Connected');
      });
      console.log('✅ [SignalR] Connected to DigitLab Real-time Hub at', hubUrl);

      const activeTenant = tenantId || this.authService.currentUserSignal()?.tenantId;
      if (activeTenant) {
        await this.hubConnection.invoke('JoinTenantRoom', activeTenant.toLowerCase());
      }

      this.hubConnection.onreconnecting(() => {
        this.ngZone.run(() => {
          this.isConnected.set(false);
          this.connectionStatus.set('Reconnecting');
        });
      });

      this.hubConnection.onreconnected(async () => {
        this.ngZone.run(() => {
          this.isConnected.set(true);
          this.connectionStatus.set('Connected');
        });
        const currentTenant = tenantId || this.authService.currentUserSignal()?.tenantId;
        if (currentTenant) {
          await this.hubConnection?.invoke('JoinTenantRoom', currentTenant.toLowerCase());
        }
      });

      this.hubConnection.onclose(() => {
        this.ngZone.run(() => {
          this.isConnected.set(false);
          this.connectionStatus.set('Disconnected');
        });
      });

    } catch (err) {
      console.warn('⚠️ [SignalR] Failed to connect to Real-time Hub:', err);
      this.ngZone.run(() => {
        this.isConnected.set(false);
        this.connectionStatus.set('Disconnected');
      });
    }
  }

  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch {}
      this.hubConnection = null;
      this.ngZone.run(() => {
        this.isConnected.set(false);
        this.connectionStatus.set('Disconnected');
      });
    }
  }

  private registerHandlers(): void {
    if (!this.hubConnection) return;

    // 1. New Case Created
    this.hubConnection.on('CaseCreated', (data: RealtimeCaseEvent) => {
      this.ngZone.run(() => {
        console.log('⚡ [SignalR] CaseCreated received in NgZone:', data);
        this.caseCreated$.next(data);
        this.toastService.info(
          `New case ${data.caseNumber} registered for ${data.patientName}.`,
          'New Case Live Alert'
        );
      });
    });

    // 2. Case Status Changed
    this.hubConnection.on('CaseStatusChanged', (data: RealtimeCaseEvent) => {
      this.ngZone.run(() => {
        console.log('⚡ [SignalR] CaseStatusChanged received in NgZone:', data);
        this.caseStatusChanged$.next(data);
        this.toastService.info(
          `Case ${data.caseNumber} status updated to ${data.status}.`,
          'Status Live Update'
        );
      });
    });

    // 3. Report Approved
    this.hubConnection.on('ReportApproved', (data: ReportApprovedEvent) => {
      this.ngZone.run(() => {
        console.log('⚡ [SignalR] ReportApproved received in NgZone:', data);
        this.reportApproved$.next(data);
        this.toastService.success(
          `Report for case ${data.caseNumber} has been verified & approved by ${data.approvedByName}!`,
          'Report Approved'
        );
      });
    });

    // 4. Critical / Panic Value Alert (Audible/Red Warning)
    this.hubConnection.on('CriticalPanicAlert', (data: CriticalPanicEvent) => {
      this.ngZone.run(() => {
        console.warn('🚨 [SignalR] CriticalPanicAlert received in NgZone:', data);
        this.criticalPanicAlert$.next(data);
        const paramsList = data.parameters?.map(p => `${p.parameterName}: ${p.resultValue} ${p.unit}`).join(', ');
        this.toastService.error(
          `CRITICAL VALUE DETECTED for ${data.patientName} (${data.caseNumber})! Parameters: ${paramsList}`,
          '🚨 Panic Alert'
        );
      });
    });

    // 5. Payment Settle / Update
    this.hubConnection.on('PaymentUpdated', (data: PaymentUpdatedEvent) => {
      this.ngZone.run(() => {
        console.log('⚡ [SignalR] PaymentUpdated received in NgZone:', data);
        this.paymentUpdated$.next(data);
        this.toastService.success(
          `Payment updated for ${data.caseNumber}. Remaining Due: ₹${data.dueAmount}`,
          'Payment Live Update'
        );
      });
    });
  }
}
