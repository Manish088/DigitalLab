export enum Gender {
  Male = 1,
  Female = 2,
  Other = 3,
  Both = 4
}

export enum CaseStatus {
  Registered = 1,
  SampleCollected = 2,
  InProgress = 3,
  Completed = 4,
  Approved = 5,
  Delivered = 6,
  Cancelled = 7
}

export enum ItemResultStatus {
  Pending = 1,
  InProgress = 2,
  Completed = 3,
  Approved = 4
}

export enum PaymentStatus {
  Unpaid = 1,
  Partial = 2,
  Paid = 3,
  Refunded = 4
}

export enum PaymentMethod {
  Cash = 1,
  UPI = 2,
  Card = 3,
  NetBanking = 4,
  Cheque = 5,
  Wallet = 6
}

export enum TestItemType {
  SingleTest = 1,
  Profile = 2,
  Package = 3
}

export enum PriorityLevel {
  Routine = 1,
  Urgent = 2,
  STAT = 3
}

export enum ResultFlag {
  Normal = 0,
  High = 1,
  Low = 2,
  Critical = 3
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  designation?: string;
  tenantId?: string;
  labName?: string;
  logoUrl?: string;
  permissionsJson?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  tenantId?: string;
  labName?: string;
  logoUrl?: string;
  expiresAt: string;
}

export interface DashboardStats {
  totalPatients: number;
  todayCases: number;
  pendingTests: number;
  completedReports: number;
  approvedReports: number;
  todayCollection: number;
  monthlyRevenue: number;
  totalPendingDues: number;
  totalDoctors: number;
  totalAgents: number;
  revenueTrend: { date: string; revenue: number; casesCount: number }[];
  recentCases: RecentCaseItem[];
}

export interface RecentCaseItem {
  id: string;
  caseNumber: string;
  barcode: string;
  patientName: string;
  patientPhone: string;
  netAmount: number;
  dueAmount: number;
  status: string;
  paymentStatus: string;
  orderDate: string;
}

export interface Patient {
  id: string;
  uhid: string;
  fullName: string;
  gender: Gender;
  ageYears: number;
  ageMonths: number;
  ageDays: number;
  phone?: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
}

export interface CaseOrder {
  id: string;
  tenantId: string;
  caseNumber: string;
  barcode: string;
  patientId: string;
  patient: Patient;
  referringDoctorId?: string;
  doctorName?: string;
  collectionAgentId?: string;
  agentName?: string;
  orderDate: string;
  sampleCollectedDate?: string;
  reportingDate?: string;
  priority: PriorityLevel;
  status: CaseStatus;
  totalAmount: number;
  discountAmount: number;
  discountPercent: number;
  discountReason?: string;
  taxAmount: number;
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  publicAccessToken: string;
  approvedByName?: string;
  approvedAt?: string;
  items: CaseOrderItem[];
  transactions: PaymentTransaction[];
}

export interface CaseOrderItem {
  id: string;
  testId: string;
  testCode: string;
  testName: string;
  categoryName?: string;
  sampleType?: string;
  containerVialType?: string;
  itemPrice: number;
  netAmount: number;
  status: ItemResultStatus;
  pathologistRemarks?: string;
  interpretationNote?: string;
  results: TestResultValue[];
}

export interface TestResultValue {
  id: string;
  parameterId: string;
  parameterName: string;
  resultValue?: string;
  unit?: string;
  normalRangeText?: string;
  numericValue?: number;
  flag: ResultFlag;
  isAbnormal: boolean;
  isCriticalPanic: boolean;
  remarks?: string;
  displayOrder: number;
}

export interface PaymentTransaction {
  id: string;
  transactionNumber: string;
  transactionDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  receivedByName?: string;
  remarks?: string;
}

export interface TestMaster {
  id: string;
  categoryId: string;
  categoryName: string;
  testCode: string;
  testName: string;
  shortName?: string;
  itemType: TestItemType;
  sampleType?: string;
  containerVialType?: string;
  price: number;
  costPrice?: number;
  tatHours: number;
  methodology?: string;
  clinicalSignificance?: string;
  preTestInstructions?: string;
  interpretationTemplate?: string;
  isActive: boolean;
  parameters: TestParameter[];
}

export interface TestParameter {
  id: string;
  testId: string;
  parameterCode: string;
  parameterName: string;
  unit?: string;
  inputType: number;
  defaultValue?: string;
  optionsJson?: string;
  formulaExpression?: string;
  displayOrder: number;
  isMandatory: boolean;
  normalRanges: ParameterNormalRange[];
}

export interface ParameterNormalRange {
  id?: string;
  applicableGender: Gender;
  minAgeDays: number;
  maxAgeDays: number;
  minNormalValue?: number;
  maxNormalValue?: number;
  panicLowValue?: number;
  panicHighValue?: number;
  textualRange?: string;
  ageDisplayGroup?: string;
}

export interface TestCategory {
  id: string;
  categoryCode: string;
  categoryName: string;
  displayOrder: number;
  isActive: boolean;
  testsCount: number;
}

export interface DoctorReferral {
  id: string;
  doctorCode: string;
  doctorName: string;
  degree?: string;
  specialization?: string;
  registrationNumber?: string;
  clinicHospitalName?: string;
  phone?: string;
  email?: string;
  address?: string;
  commissionType: number;
  defaultCommissionValue: number;
  isActive: boolean;
  totalCasesCount: number;
  totalBillingVolume: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  pendingCommissionDue: number;
}

export interface CollectionAgent {
  id: string;
  agentCode: string;
  agentName: string;
  centreName?: string;
  phone?: string;
  email?: string;
  address?: string;
  commissionPercent: number;
  isActive: boolean;
  totalCasesCount: number;
  totalBillingVolume: number;
}

export interface LetterheadConfig {
  labName: string;
  tagline?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  nablNumber?: string;
  logoUrl?: string;
  headerImageUrl?: string;
  footerImageUrl?: string;
  digitalSignatureUrl?: string;
  pathologistName?: string;
  pathologistDegree?: string;
  pathologistRegNo?: string;
  letterheadMarginTopMm: number;
  letterheadMarginBottomMm: number;
  letterheadMarginLeftMm: number;
  letterheadMarginRightMm: number;
  showHeader: boolean;
  showFooter: boolean;
  showQrCode: boolean;
  showBarcodeOnBill: boolean;
  showDigitalSignature: boolean;
  reportFontFamily: string;
  primaryColor: string;
}

export interface SubscriptionPlan {
  id: string;
  planCode: string;
  planName: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  maxCasesPerMonth: number;
  maxStaffAccounts: number;
  hasCustomLetterhead: boolean;
  hasPublicQrDownload: boolean;
  hasDoctorReferralModule: boolean;
  hasThermalPrinting: boolean;
  hasWhatsAppAlerts: boolean;
  isActive: boolean;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: number;
  status: number;
  description: string;
  attachmentUrl?: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  replies: {
    id: string;
    senderName: string;
    isAdminReply: boolean;
    message: string;
    attachmentUrl?: string;
    createdAt: string;
  }[];
}
