import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardStats,
  Patient,
  CaseOrder,
  TestMaster,
  TestCategory,
  DoctorReferral,
  DoctorPayoutRecord,
  CollectionAgent,
  LetterheadConfig,
  SubscriptionPlan,
  SupportTicket
} from '../models/lims.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard/stats`);
  }

  // Patients
  getPatients(search?: string): Observable<Patient[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<Patient[]>(`${this.baseUrl}/patients`, { params });
  }

  createPatient(patient: Partial<Patient>): Observable<Patient> {
    return this.http.post<Patient>(`${this.baseUrl}/patients`, patient);
  }

  // Cases
  getCases(filters: {
    search?: string;
    fromDate?: string;
    toDate?: string;
    doctorId?: string;
    status?: number;
    paymentStatus?: number;
    page?: number;
    pageSize?: number;
  }): Observable<{ totalCount: number; page: number; pageSize: number; totalPages: number; items: any[] }> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      const val = (filters as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });
    return this.http.get<any>(`${this.baseUrl}/cases`, { params });
  }

  getCaseById(id: string): Observable<CaseOrder> {
    return this.http.get<CaseOrder>(`${this.baseUrl}/cases/${id}`);
  }

  createCase(caseData: any): Observable<CaseOrder> {
    return this.http.post<CaseOrder>(`${this.baseUrl}/cases`, caseData);
  }

  addTestsToCase(caseOrderId: string, data: {
    testIds: string[];
    additionalDiscountAmount?: number;
    additionalPaidAmount?: number;
    paymentMethod?: number;
    transactionRef?: string | null;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/cases/${caseOrderId}/add-tests`, data);
  }

  removeTestFromCase(caseOrderId: string, itemId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cases/${caseOrderId}/items/${itemId}`);
  }

  settleDuePayment(caseOrderId: string, data: { amount: number; paymentMethod: number; referenceNumber?: string; remarks?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/cases/${caseOrderId}/settle-due`, data);
  }

  updateCaseStatus(id: string, status: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/cases/${id}/status`, status);
  }

  // Investigation Results
  getInvestigationDetails(caseOrderId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/investigations/${caseOrderId}`);
  }

  saveInvestigationResults(data: { caseOrderId: string; items: any[] }): Observable<any> {
    return this.http.post(`${this.baseUrl}/investigations/save-results`, data);
  }

  approveReport(caseOrderId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/investigations/${caseOrderId}/approve`, {});
  }

  unlockReport(caseOrderId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/investigations/${caseOrderId}/unlock`, {});
  }

  // Reports & PDF
  getReportPdfUrl(caseOrderId: string, letterheadMode: boolean = true): string {
    return `${this.baseUrl}/reports/pdf/${caseOrderId}?letterheadMode=${letterheadMode}`;
  }

  getInvoicePdfUrl(caseOrderId: string): string {
    return `${this.baseUrl}/reports/invoice/${caseOrderId}`;
  }

  getThermalReceiptPdfUrl(caseOrderId: string, width: number = 80): string {
    return `${this.baseUrl}/reports/thermal-receipt/${caseOrderId}?width=${width}`;
  }

  getBarcodeSvgUrl(caseOrderId: string): string {
    return `${this.baseUrl}/cases/${caseOrderId}/barcode-svg`;
  }

  getPublicReportByToken(token: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/public/${token}`);
  }

  getPublicReportDownloadUrl(token: string): string {
    return `${this.baseUrl}/reports/public/${token}/download`;
  }

  // Test Catalog
  getCategories(): Observable<TestCategory[]> {
    return this.http.get<TestCategory[]>(`${this.baseUrl}/tests/categories`);
  }

  createCategory(data: { categoryCode: string; categoryName: string; displayOrder: number }): Observable<TestCategory> {
    return this.http.post<TestCategory>(`${this.baseUrl}/tests/categories`, data);
  }

  getTests(search?: string, categoryId?: string): Observable<TestMaster[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (categoryId) params = params.set('categoryId', categoryId);
    return this.http.get<TestMaster[]>(`${this.baseUrl}/tests`, { params });
  }

  createTest(test: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/tests`, test);
  }

  // Doctors & Referral
  getDoctors(search?: string): Observable<DoctorReferral[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<DoctorReferral[]>(`${this.baseUrl}/doctors`, { params });
  }

  createDoctor(doctor: any): Observable<DoctorReferral> {
    return this.http.post<DoctorReferral>(`${this.baseUrl}/doctors`, doctor);
  }

  recordDoctorPayout(data: any): Observable<DoctorPayoutRecord> {
    return this.http.post<DoctorPayoutRecord>(`${this.baseUrl}/doctors/payout`, data);
  }

  getDoctorPayouts(doctorId?: string): Observable<DoctorPayoutRecord[]> {
    let params = new HttpParams();
    if (doctorId) params = params.set('doctorId', doctorId);
    return this.http.get<DoctorPayoutRecord[]>(`${this.baseUrl}/doctors/payouts`, { params });
  }

  // Collection Agents
  getAgents(): Observable<CollectionAgent[]> {
    return this.http.get<CollectionAgent[]>(`${this.baseUrl}/agents`);
  }

  createAgent(agent: any): Observable<CollectionAgent> {
    return this.http.post<CollectionAgent>(`${this.baseUrl}/agents`, agent);
  }

  // Transactions & Ledger
  getTransactions(fromDate?: string, toDate?: string, paymentMethod?: number): Observable<any> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (paymentMethod !== undefined && paymentMethod !== null) params = params.set('paymentMethod', paymentMethod.toString());
    return this.http.get<any>(`${this.baseUrl}/transactions`, { params });
  }

  // Letterhead & Branding
  getLetterheadConfig(): Observable<LetterheadConfig> {
    return this.http.get<LetterheadConfig>(`${this.baseUrl}/letterhead`);
  }

  updateLetterheadConfig(config: LetterheadConfig): Observable<any> {
    return this.http.put(`${this.baseUrl}/letterhead`, config);
  }

  // Staff
  getStaff(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/staff`);
  }

  createStaff(staff: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/staff`, staff);
  }

  toggleStaffStatus(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/staff/${id}/toggle-status`, {});
  }

  // SaaS & Subscriptions
  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.baseUrl}/subscriptions/plans`);
  }

  getPaymentConfig(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/subscriptions/payment-config`);
  }

  getMySubscription(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/subscriptions/my-subscription`);
  }

  createSubscriptionOrder(planId: string, billingCycle: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/subscriptions/create-order`, { planId, billingCycle });
  }

  verifySubscriptionPayment(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/subscriptions/verify-payment`, data);
  }

  submitManualPayment(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/subscriptions/submit-manual-payment`, data);
  }

  // Support Tickets
  getSupportTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${this.baseUrl}/supporttickets`);
  }

  createSupportTicket(ticket: any): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.baseUrl}/supporttickets`, ticket);
  }

  addTicketReply(data: { ticketId: string; message: string; attachmentUrl?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/supporttickets/reply`, data);
  }

  // Super Admin
  getSuperAdminDashboard(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/dashboard`);
  }

  getSuperAdminLabs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/labs`);
  }

  updateLabStatus(id: string, isActive: boolean): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin/labs/${id}/status`, isActive);
  }
}
