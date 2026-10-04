import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginResponse, UserProfile } from '../models/lims.models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = 'http://localhost:5000/api/auth';
  private readonly TOKEN_KEY = 'lab_auth_token';
  private readonly USER_KEY = 'lab_user_profile';

  currentUserSignal = signal<UserProfile | null>(this.getStoredUser());
  isLoggedIn = computed(() => !!this.currentUserSignal());
  isSuperAdmin = computed(() => this.currentUserSignal()?.role === 'SuperAdmin');
  isLabAdmin = computed(() => this.currentUserSignal()?.role === 'LabAdmin');

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { emailOrUsername: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(res => {
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

  register(data: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/register`, data).pipe(
      tap(res => {
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
