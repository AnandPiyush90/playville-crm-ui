import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminComponent } from './admin/admin.component';
import { CustomersListComponent } from './admin/customers/customers-list/customers-list.component';
import { CustomerOnboardComponent } from './admin/customers/customer-onboard/customer-onboard.component';
import { CustomerViewComponent } from './admin/customers/customer-view/customer-view.component';
import { CustomerEditComponent } from './admin/customers/customer-edit/customer-edit.component';
import { KidsListComponent } from './admin/kids/kids-list/kids-list.component';
import { CheckinComponent } from './admin/checkin/checkin.component';
import { PackagesComponent } from './admin/packages/packages.component';
import { PurchasesComponent } from './admin/purchases/purchases.component';
import { BranchesComponent } from './admin/branches/branches.component';
import { StaffComponent } from './admin/staff/staff.component';
import { BookingsComponent } from './admin/bookings/bookings.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  {
    path: 'admin',
    component: AdminComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'customers' },
      { path: 'customers', component: CustomersListComponent },
      { path: 'customers/new', component: CustomerOnboardComponent },
      { path: 'customers/:id', component: CustomerViewComponent },
      { path: 'customers/:id/edit', component: CustomerEditComponent },
      { path: 'kids', component: KidsListComponent },
      { path: 'packages', component: PackagesComponent },
      { path: 'purchases', component: PurchasesComponent },
      { path: 'branches', component: BranchesComponent },
      { path: 'staff', component: StaffComponent },
      { path: 'bookings', component: BookingsComponent },
      { path: 'checkin', component: CheckinComponent },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
