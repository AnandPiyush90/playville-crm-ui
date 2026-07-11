import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { CrmApiService, PackageResponse, PurchaseRequest, PurchaseResponse } from '../crm-api.service';
import { CustomerService, CustomerSummaryDto } from '../../customer.service';
import { ToastService } from '../../toast/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './purchases.component.html',
  styleUrls: ['./purchases.component.scss'],
})
export class PurchasesComponent implements OnInit {
  private fb = inject(FormBuilder);
  customers: CustomerSummaryDto[] = [];
  packages: PackageResponse[] = [];
  purchases: PurchaseResponse[] = [];
  history: PurchaseResponse[] = [];
  loading = false;
  error = '';

  form = this.fb.group({
    customerId: [null as number | null, Validators.required],
    packageId: [null as number | null, Validators.required],
    paymentMode: ['UPI', Validators.required],
    paymentReference: [''],
    discountApplied: [0],
    notes: [''],
  });

  constructor(
    private api: CrmApiService,
    private customersApi: CustomerService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const customerId = Number(this.route.snapshot.queryParamMap.get('customerId'));
    if (customerId) {
      this.form.patchValue({ customerId });
      this.loadHistory();
    }
    this.loadLookups();
    this.loadPurchases();
  }

  loadLookups() {
    this.customersApi.listCustomers(0, 100).subscribe({
      next: (page) => {
        this.customers = page.content ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => this.toast.error(err?.message || 'Unable to load customers'),
    });
    this.api.listPackages().subscribe({
      next: (rows: any) => {
        this.packages = this.asArray<PackageResponse>(rows);
        this.cdr.detectChanges();
      },
      error: (err) => this.toast.error(err?.message || 'Unable to load packages'),
    });
  }

  loadPurchases() {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    this.api.listPurchases(0, 20).subscribe({
      next: (page: any) => {
        this.purchases = this.asArray<PurchaseResponse>(page);
        this.loading = false;
        this.error = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Unable to load purchases';
        this.toast.error(this.error);
        this.cdr.detectChanges();
      },
    });
  }

  loadHistory() {
    const customerId = this.form.controls.customerId.value;
    if (!customerId) {
      this.history = [];
      return;
    }
    this.api.customerPurchaseHistory(customerId).subscribe({
      next: (rows: any) => (this.history = this.asArray<PurchaseResponse>(rows)),
      error: (err) => this.toast.error(err?.message || 'Unable to load customer history'),
    });
  }

  private asArray<T>(value: any): T[] {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.content)) return value.content;
    if (Array.isArray(value?.items)) return value.items;
    return [];
  }

  purchase() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload: PurchaseRequest = {
      customerId: Number(raw.customerId),
      packageId: Number(raw.packageId),
      paymentMode: raw.paymentMode as PurchaseRequest['paymentMode'],
      paymentReference: raw.paymentReference?.trim() || undefined,
      discountApplied: Number(raw.discountApplied) || 0,
      notes: raw.notes?.trim() || undefined,
    };
    this.loading = true;
    this.api
      .createPurchase(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.toast.success('Package purchased successfully');
          this.form.patchValue({ packageId: null, paymentReference: '', discountApplied: 0, notes: '' });
          this.loadPurchases();
          this.loadLookups();
          this.loadHistory();
        },
        error: (err) => this.toast.error(err?.message || 'Purchase failed'),
      });
  }
}
