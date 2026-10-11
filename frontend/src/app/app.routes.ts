import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/marketing/landing-page.component';
import { LoginComponent } from './pages/auth/login.component';
import { SetupComponent } from './pages/setup/setup.component';
import { PublicDownloadComponent } from './pages/reports/public-download.component';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CaseListComponent } from './pages/cases/case-list.component';
import { AddCaseComponent } from './pages/cases/add-case.component';
import { ResultEntryComponent } from './pages/investigations/result-entry.component';
import { TestCatalogComponent } from './pages/tests/test-catalog.component';
import { DoctorReferralsComponent } from './pages/doctors/doctor-referrals.component';
import { AgentsComponent } from './pages/agents/agents.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { LetterheadComponent } from './pages/letterhead/letterhead.component';
import { StaffComponent } from './pages/staff/staff.component';
import { SubscriptionComponent } from './pages/subscription/subscription.component';
import { SupportComponent } from './pages/support/support.component';
import { SuperAdminComponent } from './pages/super-admin/super-admin.component';
import { authGuard, superAdminGuard, subscriptionActiveGuard, staffManagementGuard, labManagementGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'home', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'launch', component: SetupComponent },
  { path: 'setup', component: SetupComponent },
  { path: 'init', component: SetupComponent },
  { path: 'report/download/:token', component: PublicDownloadComponent },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'cases', component: CaseListComponent },
      { path: 'cases/add', component: AddCaseComponent, canActivate: [subscriptionActiveGuard] },
      { path: 'investigations/:id', component: ResultEntryComponent, canActivate: [subscriptionActiveGuard] },
      { path: 'tests', component: TestCatalogComponent, canActivate: [subscriptionActiveGuard, labManagementGuard] },
      { path: 'doctors', component: DoctorReferralsComponent, canActivate: [subscriptionActiveGuard, labManagementGuard] },
      { path: 'agents', component: AgentsComponent, canActivate: [subscriptionActiveGuard, labManagementGuard] },
      { path: 'transactions', component: TransactionsComponent, canActivate: [subscriptionActiveGuard, labManagementGuard] },
      { path: 'letterhead', component: LetterheadComponent, canActivate: [subscriptionActiveGuard, labManagementGuard] },
      { path: 'staff', component: StaffComponent, canActivate: [subscriptionActiveGuard, labManagementGuard] },
      { path: 'subscription', component: SubscriptionComponent, canActivate: [labManagementGuard] },
      { path: 'support', component: SupportComponent, canActivate: [labManagementGuard] },
      { path: 'admin-dashboard', component: SuperAdminComponent, canActivate: [superAdminGuard] }
    ]
  },

  { path: '**', redirectTo: '' }
];
