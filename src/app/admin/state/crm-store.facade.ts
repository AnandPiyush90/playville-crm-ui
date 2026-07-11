import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BranchDto, CrmApiService, PackageResponse, PurchaseResponse, StaffDto } from '../crm-api.service';
import { CustomerService, CustomerSummaryDto } from '../../customer.service';

interface LoadState {
  loading: boolean;
  loaded: boolean;
  error: string;
}

type StoreKey =
  | 'customers'
  | 'packages'
  | 'branches'
  | 'staff'
  | 'purchases'
  | 'birthdayBookings'
  | 'schoolTrips';

const idle = (): LoadState => ({ loading: false, loaded: false, error: '' });

@Injectable({ providedIn: 'root' })
export class CrmStoreFacade {
  private customersSubject = new BehaviorSubject<CustomerSummaryDto[]>([]);
  private packagesSubject = new BehaviorSubject<PackageResponse[]>([]);
  private branchesSubject = new BehaviorSubject<BranchDto[]>([]);
  private staffSubject = new BehaviorSubject<StaffDto[]>([]);
  private purchasesSubject = new BehaviorSubject<PurchaseResponse[]>([]);
  private birthdayBookingsSubject = new BehaviorSubject<any[]>([]);
  private schoolTripsSubject = new BehaviorSubject<any[]>([]);

  private statusSubject = new BehaviorSubject<Record<StoreKey, LoadState>>({
    customers: idle(),
    packages: idle(),
    branches: idle(),
    staff: idle(),
    purchases: idle(),
    birthdayBookings: idle(),
    schoolTrips: idle(),
  });

  customers$ = this.customersSubject.asObservable();
  packages$ = this.packagesSubject.asObservable();
  branches$ = this.branchesSubject.asObservable();
  staff$ = this.staffSubject.asObservable();
  purchases$ = this.purchasesSubject.asObservable();
  birthdayBookings$ = this.birthdayBookingsSubject.asObservable();
  schoolTrips$ = this.schoolTripsSubject.asObservable();

  constructor(private api: CrmApiService, private customersApi: CustomerService) {}

  loading$(key: StoreKey): Observable<boolean> {
    return new Observable((subscriber) => {
      const sub = this.statusSubject.subscribe((status) => subscriber.next(status[key].loading));
      return () => sub.unsubscribe();
    });
  }

  error$(key: StoreKey): Observable<string> {
    return new Observable((subscriber) => {
      const sub = this.statusSubject.subscribe((status) => subscriber.next(status[key].error));
      return () => sub.unsubscribe();
    });
  }

  ensureCustomers(refresh = false) {
    if (!this.shouldLoad('customers', refresh)) return;
    this.markLoading('customers');
    this.customersApi.listCustomers(0, 100).subscribe({
      next: (page) => {
        this.customersSubject.next(page.content ?? []);
        this.markSuccess('customers');
      },
      error: (err) => this.markFailure('customers', this.message(err, 'Unable to load customers')),
    });
  }

  ensurePackages(refresh = false) {
    if (!this.shouldLoad('packages', refresh)) return;
    this.markLoading('packages');
    this.api.listPackages().subscribe({
      next: (rows) => {
        this.packagesSubject.next(this.asArray<PackageResponse>(rows));
        this.markSuccess('packages');
      },
      error: (err) => this.markFailure('packages', this.message(err, 'Unable to load packages')),
    });
  }

  ensureBranches(refresh = false) {
    if (!this.shouldLoad('branches', refresh)) return;
    this.markLoading('branches');
    this.api.listBranches().subscribe({
      next: (rows) => {
        this.branchesSubject.next(this.asArray<BranchDto>(rows));
        this.markSuccess('branches');
      },
      error: (err) => this.markFailure('branches', this.message(err, 'Unable to load branches')),
    });
  }

  ensureStaff(refresh = false) {
    if (!this.shouldLoad('staff', refresh)) return;
    this.markLoading('staff');
    this.api.listStaff().subscribe({
      next: (rows) => {
        this.staffSubject.next(this.asArray<StaffDto>(rows));
        this.markSuccess('staff');
      },
      error: (err) => this.markFailure('staff', this.message(err, 'Unable to load staff')),
    });
  }

  ensurePurchases(refresh = false) {
    if (!this.shouldLoad('purchases', refresh)) return;
    this.markLoading('purchases');
    this.api.listPurchases(0, 20).subscribe({
      next: (rows) => {
        this.purchasesSubject.next(this.asArray<PurchaseResponse>(rows));
        this.markSuccess('purchases');
      },
      error: (err) => this.markFailure('purchases', this.message(err, 'Unable to load purchases')),
    });
  }

  ensureBirthdayBookings(refresh = false) {
    if (!this.shouldLoad('birthdayBookings', refresh)) return;
    this.markLoading('birthdayBookings');
    this.api.listBirthdayBookings().subscribe({
      next: (rows) => {
        this.birthdayBookingsSubject.next(this.asArray(rows));
        this.markSuccess('birthdayBookings');
      },
      error: (err) => this.markFailure('birthdayBookings', this.message(err, 'Unable to load birthday bookings')),
    });
  }

  ensureSchoolTrips(refresh = false) {
    if (!this.shouldLoad('schoolTrips', refresh)) return;
    this.markLoading('schoolTrips');
    this.api.listSchoolTrips().subscribe({
      next: (rows) => {
        this.schoolTripsSubject.next(this.asArray(rows));
        this.markSuccess('schoolTrips');
      },
      error: (err) => this.markFailure('schoolTrips', this.message(err, 'Unable to load school trips')),
    });
  }

  private shouldLoad(key: StoreKey, refresh: boolean) {
    const status = this.statusSubject.value[key];
    return refresh || (!status.loaded && !status.loading);
  }

  private markLoading(key: StoreKey) {
    this.patchStatus(key, { loading: true, error: '' });
  }

  private markSuccess(key: StoreKey) {
    this.patchStatus(key, { loading: false, loaded: true, error: '' });
  }

  private markFailure(key: StoreKey, error: string) {
    this.patchStatus(key, { loading: false, loaded: false, error });
  }

  private patchStatus(key: StoreKey, patch: Partial<LoadState>) {
    const current = this.statusSubject.value;
    this.statusSubject.next({
      ...current,
      [key]: { ...current[key], ...patch },
    });
  }

  private asArray<T>(value: any): T[] {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.content)) return value.content;
    if (Array.isArray(value?.items)) return value.items;
    return [];
  }

  private message(err: any, fallback: string) {
    return err?.error?.message || err?.message || fallback;
  }
}
