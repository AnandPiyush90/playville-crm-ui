import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface CustomerSummaryDto {
  id: number;
  phoneNumber: string;
  parentName: string;
  globalSessionBalance?: number;
  currentPackageName?: string;
  totalVisits?: number;
  disclaimerAccepted?: boolean;
}

export interface KidDto {
  id: number;
  kidName: string;
  dob: string;
  ageInYears?: number;
  gender: string;
  specialNotes?: string;
  eligible?: boolean;
}

export interface CustomerDto {
  id: number;
  phoneNumber: string;
  parentName: string;
  email?: string;
  leadSource?: string;
  globalSessionBalance?: number;
  currentPackageName?: string;
  totalVisits?: number;
  disclaimerAccepted?: boolean;
  kids?: KidDto[];
}

export interface UpdateCustomerRequest {
  parentName: string;
  phoneNumber: string;
  email?: string;
  leadSource?: string;
  disclaimerAccepted?: boolean;
}

export interface CreateKidRequest {
  kidName: string;
  dob: string;
  gender: string;
  specialNotes?: string;
}

export interface CreateCustomerRequest {
  phoneNumber: string;
  parentName: string;
  email?: string;
  leadSource?: string;
  disclaimerAccepted?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly base = '/api/v1';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private unwrap<T>(response: any): T {
    if (!response || typeof response !== 'object') {
      return response;
    }
    if ('data' in response && response.data !== response) {
      return this.unwrap<T>(response.data);
    }
    return response;
  }

  listCustomers(page = 0, size = 20, search?: string): Observable<PagedResponse<CustomerSummaryDto>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (search !== undefined && search !== null) params = params.set('search', search);
    return this.http.get<any>(`${this.base}/customers`, { params, headers: this.authHeaders() }).pipe(
      map((r) => {
        const payload = this.unwrap<any>(r);
        const pageData = payload?.content ? payload : payload?.data ? payload.data : payload;
        return {
          content: pageData?.content ?? pageData?.items ?? [],
          page: pageData?.page ?? 0,
          size: pageData?.size ?? size,
          totalElements: pageData?.totalElements ?? pageData?.total ?? 0,
          totalPages: pageData?.totalPages ?? 0,
          last: pageData?.last ?? true,
        };
      })
    );
  }

  createCustomer(payload: CreateCustomerRequest) {
    return this.http.post<any>(`${this.base}/customers`, payload, { headers: this.authHeaders() }).pipe(map((r) => this.unwrap<any>(r)));
  }

  getCustomerById(id: number) {
    return this.http.get<any>(`${this.base}/customers/${id}`, { headers: this.authHeaders() }).pipe(
      map((r) => {
        const payload = this.unwrap<any>(r);
        if (payload?.customer) {
          return payload.customer as CustomerDto;
        }
        return payload as CustomerDto;
      })
    );
  }
  
    /**
     * Returns the raw HTTP response for debugging purposes (no unwrapping).
     */
    getCustomerRaw(id: number) {
      return this.http.get<any>(`${this.base}/customers/${id}`, { headers: this.authHeaders() });
    }

  updateCustomer(id: number, payload: UpdateCustomerRequest) {
    return this.http.put<any>(`${this.base}/customers/${id}`, payload, { headers: this.authHeaders() }).pipe(map((r) => this.unwrap<any>(r)));
  }

  addKid(customerId: number, payload: CreateKidRequest) {
    return this.http.post<any>(`${this.base}/customers/${customerId}/kids`, payload, { headers: this.authHeaders() }).pipe(map((r) => this.unwrap<any>(r)));
  }
}
