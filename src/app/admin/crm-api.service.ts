import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, timeout } from 'rxjs/operators';
import { AuthService } from '../auth.service';

export interface PackageResponse {
  id: number;
  packageName: string;
  sessionsPurchased: number;
  sessionsBonus?: number;
  sessionsTotal?: number;
  pricePerSession?: number;
  totalPrice: number;
  validityDays?: number;
  birthdayDiscountPct?: number;
  rechargeDiscountPct?: number;
  canUpgrade?: boolean;
  displayOrder?: number;
  active?: boolean;
}

export interface PackageRequest {
  packageName: string;
  sessionsPurchased: number;
  sessionsBonus?: number;
  pricePerSession: number;
  totalPrice: number;
  validityDays?: number;
  birthdayDiscountPct?: number;
  rechargeDiscountPct?: number;
  canUpgrade?: boolean;
  displayOrder?: number;
}

export interface PurchaseRequest {
  customerId: number;
  packageId: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Online';
  paymentReference?: string;
  discountApplied?: number;
  notes?: string;
}

export interface PurchaseResponse {
  id: number;
  customerId: number;
  parentName?: string;
  phoneNumber?: string;
  packageId: number;
  packageName?: string;
  sessionsAdded?: number;
  amountPaid?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  paymentMode?: string;
  createdAt?: string;
}

export interface BranchDto {
  id: number;
  branchCode: string;
  branchName: string;
  address?: string;
  city?: string;
  phone?: string;
  openTime?: string;
  closeTime?: string;
  closedDay?: string;
  notificationEmail?: string;
  active?: boolean;
}

export interface StaffDto {
  id: number;
  branchId?: number;
  branchCode?: string;
  fullName: string;
  email?: string;
  phone?: string;
  username: string;
  role?: string;
  active?: boolean;
}

export interface CreateStaffRequest {
  fullName: string;
  email?: string;
  phone?: string;
  username: string;
  password: string;
  role?: 'admin' | 'manager' | 'staff';
}

export interface BirthdayBookingRequest {
  customerId: number;
  kidId: number;
  partyDate: string;
  partySlotStart: string;
  expectedGuests?: number;
  cakeOption?: string;
  foodBoxesCount?: number;
  baseAmount?: number;
  discountPct?: number;
  advancePaid?: number;
  paymentMode?: 'Cash' | 'UPI' | 'Card' | 'Online';
  paymentReference?: string;
  notes?: string;
}

export interface SchoolTripRequest {
  schoolName: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  tripDate: string;
  slotStart: string;
  slotEnd: string;
  expectedKids?: number;
  pricePerKid?: number;
  totalAmount?: number;
  advancePaid?: number;
  paymentMode?: 'Cash' | 'UPI' | 'Card' | 'Online';
  paymentReference?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class CrmApiService {
  private readonly base = '/api/v1';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders() {
    const token = this.auth.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private unwrap<T>(response: any): T {
    if (!response || typeof response !== 'object') return response;
    if ('data' in response && response.data !== response) return this.unwrap<T>(response.data);
    return response as T;
  }

  private get<T>(url: string, params?: HttpParams) {
    return this.http.get<any>(`${this.base}${url}`, { headers: this.authHeaders(), params }).pipe(timeout(10000), map((r) => this.unwrap<T>(r)));
  }

  private post<T>(url: string, body: unknown) {
    return this.http.post<any>(`${this.base}${url}`, body, { headers: this.authHeaders() }).pipe(timeout(10000), map((r) => this.unwrap<T>(r)));
  }

  private put<T>(url: string, body: unknown) {
    return this.http.put<any>(`${this.base}${url}`, body, { headers: this.authHeaders() }).pipe(timeout(10000), map((r) => this.unwrap<T>(r)));
  }

  private patch<T>(url: string, body: unknown = null, params?: HttpParams) {
    return this.http.patch<any>(`${this.base}${url}`, body, { headers: this.authHeaders(), params }).pipe(timeout(10000), map((r) => this.unwrap<T>(r)));
  }

  private delete<T>(url: string) {
    return this.http.delete<any>(`${this.base}${url}`, { headers: this.authHeaders() }).pipe(timeout(10000), map((r) => this.unwrap<T>(r)));
  }

  listPackages() { return this.get<PackageResponse[]>('/packages'); }
  listAllPackages() { return this.get<PackageResponse[]>('/packages/all'); }
  createPackage(payload: PackageRequest) { return this.post<PackageResponse>('/packages', payload); }
  updatePackage(id: number, payload: PackageRequest) { return this.put<PackageResponse>(`/packages/${id}`, payload); }
  deactivatePackage(id: number) { return this.delete<void>(`/packages/${id}`); }
  reactivatePackage(id: number) { return this.patch<PackageResponse>(`/packages/${id}/reactivate`); }

  listPurchases(page = 0, size = 20) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.get<any>('/purchases', params);
  }
  createPurchase(payload: PurchaseRequest) { return this.post<PurchaseResponse>('/purchases', payload); }
  customerPurchaseHistory(customerId: number) { return this.get<PurchaseResponse[]>(`/purchases/customer/${customerId}`); }

  listBranches() { return this.get<BranchDto[]>('/branches'); }
  getBranch(id: number) { return this.get<BranchDto>(`/branches/${id}`); }
  updateBranch(id: number, payload: Partial<BranchDto>) { return this.put<BranchDto>(`/branches/${id}`, payload); }

  listStaff() { return this.get<StaffDto[]>('/staff'); }
  createStaff(payload: CreateStaffRequest) { return this.post<StaffDto>('/staff', payload); }
  deactivateStaff(id: number) { return this.delete<void>(`/staff/${id}`); }

  listBirthdayBookings(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.get<any[]>('/birthday-bookings', params);
  }
  createBirthdayBooking(payload: BirthdayBookingRequest) { return this.post<any>('/birthday-bookings', payload); }
  updateBirthdayStatus(id: number, status: string) {
    return this.patch<any>(`/birthday-bookings/${id}/status`, null, new HttpParams().set('status', status));
  }

  listSchoolTrips(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.get<any[]>('/school-trips', params);
  }
  createSchoolTrip(payload: SchoolTripRequest) { return this.post<any>('/school-trips', payload); }
  updateSchoolTripStatus(id: number, status: string, actualKids?: number) {
    let params = new HttpParams().set('status', status);
    if (actualKids !== undefined && actualKids !== null) params = params.set('actualKids', actualKids);
    return this.patch<any>(`/school-trips/${id}/status`, null, params);
  }
}
