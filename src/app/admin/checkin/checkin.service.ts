import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth.service';
import { Observable, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

export interface CheckinRequest {
  customerId: number;
  kidIds: number[];
  branchId?: number;
  notes?: string;
}

export interface CheckoutRequest {
  extraCharges?: number;
  checkoutNotes?: string;
}

export interface CheckinResponse {
  id?: number;
  checkinId?: number;
  customerId: number;
  parentName?: string;
  phoneNumber?: string;
  branchId?: number;
  branchCode?: string;
  kidId?: number;
  kids?: Array<{ id: number; kidName: string; dob?: string; gender?: string }>;
  checkedInAt?: string;
  checkedOutAt?: string;
  checkinTime?: string;
  checkoutTime?: string;
  status?: string;
  kidsCount?: number;
  sessionBalance?: number;
  sessionsDeducted?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  extraCharges?: number;
  gstAmount?: number;
  totalCharged?: number;
  checkoutNotes?: string;
}

@Injectable({ providedIn: 'root' })
export class CheckinService {
  private readonly base = '/api/v1';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders() {
    const token = this.auth.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private addBranchId(payload: CheckinRequest): CheckinRequest {
    const branchId = this.auth.getBranchId();
    return branchId != null ? { ...payload, branchId } : payload;
  }

  checkIn(payload: CheckinRequest): Observable<CheckinResponse> {
    const body = this.addBranchId(payload);
    return this.http.post<any>(`${this.base}/checkins`, body, { headers: this.authHeaders() }).pipe(
      timeout(10000),
      map((r) => r?.data ?? r),
      catchError((error) => {
        if (error?.status === 404) {
          return this.http.post<any>(`${this.base}/customers/${body.customerId}/checkins`, body, { headers: this.authHeaders() }).pipe(
            timeout(10000),
            map((r) => r?.data ?? r),
            catchError((inner) => {
              if (inner?.status === 404) {
                return this.http.post<any>(`${this.base}/customers/${body.customerId}/kids/${body.kidIds && body.kidIds.length ? body.kidIds[0] : 0}/checkin`, body, { headers: this.authHeaders() }).pipe(
                  timeout(10000),
                  map((r) => r?.data ?? r)
                );
              }
              return throwError(() => inner);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }

  getActiveCheckins(): Observable<CheckinResponse[]> {
    return this.http.get<any>(`${this.base}/checkins/active`, { headers: this.authHeaders() }).pipe(
      timeout(8000),
      map((r) => r?.data ?? r ?? [])
    );
  }

  checkOut(checkinId: number, payload: CheckoutRequest = {}): Observable<CheckinResponse> {
    return this.http.post<any>(`${this.base}/checkins/${checkinId}/checkout`, payload, { headers: this.authHeaders() }).pipe(
      timeout(10000),
      map((r) => r?.data ?? r),
      catchError((error) => {
        if (error?.status === 404) {
          return this.http.put<any>(`${this.base}/checkins/checkout/${checkinId}`, null, { headers: this.authHeaders() }).pipe(
            timeout(10000),
            map((r) => r?.data ?? r),
            catchError((inner) => {
              if (inner?.status === 404) {
                return this.http.put<any>(`${this.base}/checkouts/${checkinId}`, null, { headers: this.authHeaders() }).pipe(
                  timeout(10000),
                  map((r) => r?.data ?? r)
                );
              }
              return throwError(() => inner);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }
}
