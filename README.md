# 🧪 DigitLab - Multi-Tenant Cloud Pathology LIMS

Enterprise-grade Cloud Laboratory Information Management System (LIMS) & SaaS platform built with **ASP.NET Core (Backend Web API)**, **Angular 19+ (Frontend SPA)**, and **Microsoft SQL Server / EF Core**.

---

## 🚀 Key Features & Modules (All 15 Modules Implemented)

1. **Authentication & RBAC**: JWT Bearer auth, multi-tenancy isolation (`TenantId`), role-based access for SuperAdmin, LabAdmin, Pathologists, Technicians, Receptionists.
2. **Lab Dashboard & KPI Analytics**: Real-time stats (Today's Cases, Daily Collection, Pending Dues, Revenue Charts with Chart.js).
3. **Patient Registration & Smart Case Billing**: UHID generator, CODE39/128 vector barcode generation, auto discount calculation, advance payment, and due tracking.
4. **Investigation Result Entry & Pathologist Verification**: Dynamic parameter inputs, age/gender normal reference range matching, automatic abnormal & critical panic flags, clinical interpretations, and digital signature stamps.
5. **Invoicing & Receipts**: Standard A4 Tax Invoice PDF generation and Thermal POS receipt support.
6. **Public Report Sharing (QR Code)**: Tokenized public access URLs (`/report/download/:token`) allowing patients and doctors to scan QR codes on printed reports to verify and download PDFs without logging in.
7. **Letterhead Designer & Branding**: Live A4 margin adjusters (in mm) for pre-printed letterheads, custom fonts, colors, and NABL accreditation badges.
8. **Test Catalog & Rate Master**: Tests, profiles/panels, packages, departments (Biochemistry, Hematology, Microbiology, Serology), parameters, and normal ranges.
9. **Doctor Referrals & Commissions**: Doctor directory, percentage/flat commission calculation, referral volume tracking, and payout settlement ledger.
10. **Collection Centres & Field Agents**: B2B collection hub management and phlebotomist logistics tracking.
11. **Financial Ledger & Accounts**: Daily cash counter closeout, payment mode splits (Cash, UPI, Card, NetBanking).
12. **SaaS Subscriptions & Payment Gateway**: Razorpay payment gateway integration for monthly/annual plans and SaaS tax invoices.
13. **Customer Support / Helpdesk**: Support ticket creation, attachments, and threaded conversations.
14. **Super Admin SaaS Command Center**: Multi-tenant laboratory verification, subscription management, and global platform revenue metrics.
15. **Public Marketing Website**: Responsive landing page with feature showcase, pricing calculator, and demo request forms.

---

## 📁 Solution Structure

```
d:\Antigravity\Lab\
├── backend/
│   ├── src/
│   │   ├── Lab.Domain/          # Entities, Enums, Interfaces
│   │   ├── Lab.Application/     # DTOs, Business Logic, DB Interfaces
│   │   ├── Lab.Infrastructure/  # EF Core DbContext, Identity, QuestPDF, Barcodes
│   │   └── Lab.Api/             # REST API Controllers, Swagger, Program.cs
│   └── Lab.slnx
├── frontend/                    # Angular Standalone Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/            # Models, Services, Interceptors, Guards
│   │   │   ├── pages/           # 15 Module Views (Dashboard, Cases, Results, etc.)
│   │   │   └── shared/          # Navigation, Layout, Modals
│   │   └── index.html           # TailwindCSS, FontAwesome, Chart.js
└── database/
    └── schema.sql               # Microsoft SQL Server Database Schema Script
```

---

## 🏃 Running the Application

### 1. Backend API (ASP.NET Core)
```powershell
cd backend
dotnet run --project src/Lab.Api
```
- **API Swagger Documentation**: `http://localhost:5000/swagger` (or `https://localhost:5001/swagger`)
- **Database**: Automatically seeds demo data, tests, normal ranges, and accounts on first run (Supports SQL Server & SQLite fallback).

### 2. Frontend SPA (Angular)
```powershell
cd frontend
npm start
```
- **Application URL**: `http://localhost:4200`

---

## 🔑 Pre-Configured Demo Credentials

| Role | Email / Username | Password | Access Level |
|---|---|---|---|
| **👨‍⚕️ Lab Owner / Admin** | `doctor@citylab.com` | `Pass@12345` | Full Lab Operations, Billing, Result Entry, Letterhead, Accounts |
| **🛡️ Super Administrator** | `admin@digitlab.com` | `Admin@12345` | Platform Multi-Lab Management, SaaS Plans & Global Analytics |
| **🧪 Lab Technician / Staff** | `staff@citylab.com` | `Pass@12345` | Case Entry & Investigation Result Entry |

---

## 🖨️ Database Setup (SQL Server)
If you prefer running a direct SQL Server script:
Execute `database/schema.sql` inside SQL Server Management Studio (SSMS) or Azure Data Studio.
