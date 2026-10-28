import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginResponse, UserProfile } from '../models/lims.models';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'lab_auth_token';
  private readonly USER_KEY = 'lab_user_profile';

  private readonly BACKUP_TOKEN_KEY = 'superadmin_backup_token';
  private readonly BACKUP_USER_KEY = 'superadmin_backup_user';

  currentUserSignal = signal<UserProfile | null>(this.getStoredUser());
  isImpersonatingSignal = signal<boolean>(!!localStorage.getItem(this.BACKUP_TOKEN_KEY));
  isLoggedIn = computed(() => !!this.currentUserSignal());
  isSuperAdmin = computed(() => this.currentUserSignal()?.role === 'SuperAdmin');
  isLabAdmin = computed(() => this.currentUserSignal()?.role === 'LabAdmin');
  canManageStaff = computed(() => {
    const role = this.currentUserSignal()?.role;
    return role === 'LabAdmin' || role === 'LabManager' || role === 'SuperAdmin';
  });
  canManageLab = computed(() => {
    const role = this.currentUserSignal()?.role;
    return role === 'LabAdmin' || role === 'LabManager' || role === 'SuperAdmin';
  });

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { emailOrUsername: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(res => {
        localStorage.removeItem(this.BACKUP_TOKEN_KEY);
        localStorage.removeItem(this.BACKUP_USER_KEY);
        this.isImpersonatingSignal.set(false);
        localStorage.setItem(this.TOKEN_KEY, res.token);
        const profile: UserProfile = {
          id: res.userId,
          fullName: res.fullName,
          email: res.email,
          role: res.role,
          tenantId: res.tenantId,
          labName: res.labName,
          logoUrl: res.logoUrl
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(profile));
        this.currentUserSignal.set(profile);
      })
    );
  }

  impersonate(res: LoginResponse): void {
    const currentToken = this.getToken();
    const currentUser = localStorage.getItem(this.USER_KEY);
    if (currentToken && !localStorage.getItem(this.BACKUP_TOKEN_KEY)) {
      localStorage.setItem(this.BACKUP_TOKEN_KEY, currentToken);
      if (currentUser) localStorage.setItem(this.BACKUP_USER_KEY, currentUser);
    }
    
    localStorage.setItem(this.TOKEN_KEY, res.token);
    const profile: UserProfile = {
      id: res.userId,
      fullName: res.fullName,
      email: res.email,
      role: res.role,
      tenantId: res.tenantId,
      labName: res.labName,
      logoUrl: res.logoUrl
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(profile));
    this.currentUserSignal.set(profile);
    this.isImpersonatingSignal.set(true);
    this.router.navigate(['/dashboard']);
  }

  exitImpersonation(): void {
    const backupToken = localStorage.getItem(this.BACKUP_TOKEN_KEY);
    const backupUser = localStorage.getItem(this.BACKUP_USER_KEY);
    if (backupToken && backupUser) {
      localStorage.setItem(this.TOKEN_KEY, backupToken);
      localStorage.setItem(this.USER_KEY, backupUser);
      localStorage.removeItem(this.BACKUP_TOKEN_KEY);
      localStorage.removeItem(this.BACKUP_USER_KEY);
      this.currentUserSignal.set(JSON.parse(backupUser));
      this.isImpersonatingSignal.set(false);
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.logout();
    }
  }

  checkUserExists(email?: string, phone?: string): Observable<{ emailExists: boolean; phoneExists: boolean; alreadyRegistered: boolean; message?: string }> {
    let params: any = {};
    if (email) params.email = email;
    if (phone) params.phone = phone;
    return this.http.get<{ emailExists: boolean; phoneExists: boolean; alreadyRegistered: boolean; message?: string }>(`${this.baseUrl}/check-user-exists`, { params });
  }

  sendOtp(phone: string, email: string, ownerName?: string): Observable<{ success: boolean; message: string; phone: string; email?: string; emailSent?: boolean; demoOtp?: string; expiresInSeconds: number }> {
    return this.http.post<{ success: boolean; message: string; phone: string; email?: string; emailSent?: boolean; demoOtp?: string; expiresInSeconds: number }>(`${this.baseUrl}/send-otp`, { phone, email, ownerName });
  }

  verifyOtp(otp: string, email?: string, phone?: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/verify-otp`, { otp, email, phone });
  }

  changePassword(oldPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/change-password`, { oldPassword, newPassword });
  }

  forgotPasswordSendOtp(emailOrPhone: string): Observable<{
    success: boolean;
    userId: string;
    maskedEmail: string;
    emailSent: boolean;
    message: string;
    demoOtp?: string;
    expiresInSeconds: number;
  }> {
    return this.http.post<{
      success: boolean;
      userId: string;
      maskedEmail: string;
      emailSent: boolean;
      message: string;
      demoOtp?: string;
      expiresInSeconds: number;
    }>(`${this.baseUrl}/forgot-password/send-otp`, { emailOrPhone });
  }

  forgotPasswordVerifyOtp(userId: string, otp: string): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
    }>(`${this.baseUrl}/forgot-password/verify-otp`, { userId, otp });
  }

  forgotPasswordReset(userId: string, otp: string, newPassword: string): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
    }>(`${this.baseUrl}/forgot-password/reset-password`, { userId, otp, newPassword });
  }

  register(data: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/register`, data).pipe(
      tap(res => {
        localStorage.removeItem(this.BACKUP_TOKEN_KEY);
        localStorage.removeItem(this.BACKUP_USER_KEY);
        this.isImpersonatingSignal.set(false);
        localStorage.setItem(this.TOKEN_KEY, res.token);
        const profile: UserProfile = {
          id: res.userId,
          fullName: res.fullName,
          email: res.email,
          role: res.role,
          tenantId: res.tenantId,
          labName: res.labName,
          logoUrl: res.logoUrl
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(profile));
        this.currentUserSignal.set(profile);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.BACKUP_TOKEN_KEY);
    localStorage.removeItem(this.BACKUP_USER_KEY);
    this.isImpersonatingSignal.set(false);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): UserProfile | null {
    const data = localStorage.getItem(this.USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}
