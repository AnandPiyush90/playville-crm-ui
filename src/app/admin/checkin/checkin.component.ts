import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { timeout } from 'rxjs/operators';
import { CustomerService, CustomerDto } from '../../customer.service';
import { CheckinResponse, CheckinService } from './checkin.service';
import { ToastService } from '../../toast/toast.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './checkin.component.html',
  styleUrls: ['./checkin.component.scss'],
})
export class CheckinComponent implements OnInit, OnDestroy {
  private readonly activeCacheKey = 'playville_active_checkins_cache';
  customer?: CustomerDto;
  loading = false;
  activeLoading = false;
  error = '';
  activeError = '';
  selectedKidIds: number[] = [];
  checkinIdToCheckout?: number;
  activeCheckins: CheckinResponse[] = [];
  checkoutExtraCharges: Record<number, number | null> = {};
  checkoutNotes: Record<number, string> = {};
  rawResponse: any;
  showRaw = false;
  private qpSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private svc: CustomerService,
    private checkinSvc: CheckinService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.activeCheckins = this.readCachedActiveCheckins();
    this.loadActiveCheckins();

    // Subscribe to query param changes so navigation with new params always triggers load
    this.qpSub = this.route.queryParamMap.subscribe((qp) => {
      const paramKeys = ['customerId', 'customerid', 'customer', 'id'];
      let customerId: number | null = null;
      for (const k of paramKeys) {
        const v = qp.get(k);
        if (v) {
          const n = Number(v);
          if (!Number.isNaN(n) && n > 0) {
            customerId = n;
            break;
          }
        }
      }
      if (customerId) {
        this.loadCustomer(customerId);
      } else {
        this.customer = undefined;
        this.selectedKidIds = [];
        this.error = '';
      }
    });
  }

  ngOnDestroy(): void {
    this.qpSub?.unsubscribe();
  }

  loadActiveCheckins() {
    this.activeLoading = true;
    this.activeError = '';
    this.cdr.detectChanges();
    this.checkinSvc
      .getActiveCheckins()
      .subscribe({
        next: (rows) => {
          this.activeCheckins = this.mergeActiveRows(Array.isArray(rows) ? rows : [], this.readCachedActiveCheckins());
          this.writeCachedActiveCheckins(this.activeCheckins);
          this.syncLoadedCustomerCheckoutState();
          this.initCheckoutForms();
          this.activeLoading = false;
          this.activeError = '';
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.activeCheckins = this.readCachedActiveCheckins();
          this.syncLoadedCustomerCheckoutState();
          this.initCheckoutForms();
          this.activeLoading = false;
          this.activeError = this.activeCheckins.length
            ? 'Live active check-ins did not respond. Showing locally tracked check-ins from this browser.'
            : 'Unable to load active check-ins. You can still load a customer and check in.';
          this.cdr.detectChanges();
        },
      });
  }

  loadCustomer(id: number) {
    this.loading = true;
    this.error = '';
    this.customer = undefined;
    this.selectedKidIds = [];
    this.checkinIdToCheckout = undefined;
    this.rawResponse = undefined;
    this.cdr.detectChanges();
    this.svc
      .getCustomerRaw(id)
      .pipe(timeout(10000))
      .subscribe({
        next: (raw: any) => {
          this.rawResponse = raw;
          const customer = this.normalizeCustomer(raw);

          if (!customer?.id) {
            this.error = 'Unable to locate customer data in response.';
            this.loading = false;
            this.cdr.detectChanges();
            return;
          }

          const kids = Array.isArray(customer.kids) ? customer.kids : [];
          this.customer = { ...customer, kids };
          this.mergeCustomerIntoCachedActiveCheckin();
          this.syncLoadedCustomerCheckoutState();

          if (kids.length > 0) {
            this.selectedKidIds = [kids[0].id];
          }
          this.loading = false;
          this.error = '';
          this.cdr.detectChanges();
        },
        error: (e: any) => {
          this.error = e?.message || 'Unable to load customer.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private normalizeCustomer(response: any): CustomerDto | undefined {
    const payload = response?.data?.customer ?? response?.data ?? response?.customer ?? response;
    return payload && typeof payload === 'object' ? (payload as CustomerDto) : undefined;
  }

  private syncLoadedCustomerCheckoutState() {
    if (!this.customer) {
      this.checkinIdToCheckout = undefined;
      return;
    }

    const active = this.activeCheckins.find((row) => row.customerId === this.customer?.id);
    this.checkinIdToCheckout = active ? this.getCheckinId(active) : undefined;
  }

  private initCheckoutForms() {
    this.activeCheckins.forEach((row) => {
      const id = this.getCheckinId(row);
      if (id && !(id in this.checkoutExtraCharges)) {
        this.checkoutExtraCharges[id] = null;
        this.checkoutNotes[id] = '';
      }
    });
  }

  private readCachedActiveCheckins(): CheckinResponse[] {
    try {
      const raw = localStorage.getItem(this.activeCacheKey);
      const rows = raw ? JSON.parse(raw) : [];
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  }

  private writeCachedActiveCheckins(rows: CheckinResponse[]) {
    try {
      localStorage.setItem(this.activeCacheKey, JSON.stringify(rows));
    } catch {}
  }

  private mergeActiveRows(apiRows: CheckinResponse[], cachedRows: CheckinResponse[]): CheckinResponse[] {
    const merged = new Map<string, CheckinResponse>();
    [...cachedRows, ...apiRows].forEach((row) => {
      const id = this.getCheckinId(row);
      const key = id ? `id:${id}` : `customer:${row.customerId}`;
      merged.set(key, { ...merged.get(key), ...row });
    });
    return Array.from(merged.values());
  }

  private upsertCachedActiveCheckin(row: CheckinResponse) {
    const id = this.getCheckinId(row);
    if (!id) return;
    const rows = this.readCachedActiveCheckins().filter((existing) => this.getCheckinId(existing) !== id);
    rows.unshift(row);
    this.writeCachedActiveCheckins(rows);
    this.activeCheckins = rows;
    this.initCheckoutForms();
    this.syncLoadedCustomerCheckoutState();
  }

  private removeCachedActiveCheckin(checkinId: number) {
    const rows = this.readCachedActiveCheckins().filter((row) => this.getCheckinId(row) !== checkinId);
    this.writeCachedActiveCheckins(rows);
  }

  private mergeCustomerIntoCachedActiveCheckin() {
    if (!this.customer) return;
    const active = this.activeCheckins.find((row) => row.customerId === this.customer?.id);
    if (!active) return;
    active.parentName = active.parentName || this.customer.parentName;
    active.phoneNumber = active.phoneNumber || this.customer.phoneNumber;
    active.sessionBalance = active.sessionBalance ?? this.customer.globalSessionBalance;
    this.writeCachedActiveCheckins(this.activeCheckins);
  }

  getCheckinId(row: CheckinResponse): number | undefined {
    return row.checkinId ?? row.id;
  }

  getLoadedCustomerActiveCheckin(): CheckinResponse | undefined {
    if (!this.customer) {
      return undefined;
    }
    return this.activeCheckins.find((row) => row.customerId === this.customer?.id);
  }

  kidNames(row: CheckinResponse): string {
    const kids = Array.isArray(row.kids) ? row.kids : [];
    return kids.length ? kids.map((kid) => kid.kidName).join(', ') : `${row.kidsCount ?? 0} kid(s)`;
  }

  ensureCheckoutForm(id: number) {
    if (!(id in this.checkoutExtraCharges)) {
      this.checkoutExtraCharges[id] = null;
      this.checkoutNotes[id] = '';
    }
  }

  performCheckin() {
    if (!this.customer || this.selectedKidIds.length === 0) {
      this.toast.error('Select at least one child before checking in.');
      return;
    }
    if (this.checkinIdToCheckout) {
      this.toast.error('This customer is already checked in. Please check out first.');
      return;
    }
    this.loading = true;
    this.cdr.detectChanges();
    this.checkinSvc
      .checkIn({ customerId: this.customer.id, kidIds: this.selectedKidIds })
      .subscribe({
        next: (res: any) => {
          const resultId = res?.id ?? res?.checkinId ?? res?.data?.id ?? res?.data?.checkinId;
          this.checkinIdToCheckout = resultId;
          if (resultId && this.customer) {
            const checkedInKids = (this.customer.kids ?? []).filter((kid) => this.selectedKidIds.includes(kid.id));
            this.upsertCachedActiveCheckin({
              ...res,
              checkinId: resultId,
              customerId: this.customer.id,
              parentName: res?.parentName ?? this.customer.parentName,
              phoneNumber: res?.phoneNumber ?? this.customer.phoneNumber,
              kids: Array.isArray(res?.kids) ? res.kids : checkedInKids,
              kidsCount: res?.kidsCount ?? checkedInKids.length,
              sessionBalance: res?.sessionBalance ?? this.customer.globalSessionBalance,
              checkinTime: res?.checkinTime ?? new Date().toISOString(),
              status: res?.status ?? 'ACTIVE',
            });
          }
          this.toast.success('Checked in successfully');
          this.loading = false;
          this.cdr.detectChanges();
          this.loadActiveCheckins();
        },
        error: (err: any) => {
          this.toast.error(err?.message || 'Check-in failed');
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  performCheckout(checkinId = this.checkinIdToCheckout) {
    if (!checkinId) {
      this.toast.error('No active check-in found to checkout.');
      return;
    }
    this.ensureCheckoutForm(checkinId);
    this.loading = true;
    this.cdr.detectChanges();
    this.checkinSvc
      .checkOut(checkinId, {
        extraCharges: this.checkoutExtraCharges[checkinId] ?? undefined,
        checkoutNotes: this.checkoutNotes[checkinId]?.trim() || undefined,
      })
      .subscribe({
      next: (res) => {
        this.toast.success('Checked out successfully');
        delete this.checkoutExtraCharges[checkinId];
        delete this.checkoutNotes[checkinId];
        this.removeCachedActiveCheckin(checkinId);
        if (this.checkinIdToCheckout === checkinId) {
          this.checkinIdToCheckout = undefined;
        }
        this.activeCheckins = this.activeCheckins.filter((row) => this.getCheckinId(row) !== checkinId);
        this.writeCachedActiveCheckins(this.activeCheckins);
        this.syncLoadedCustomerCheckoutState();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.toast.error(err?.message || 'Checkout failed');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
