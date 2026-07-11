import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrmApiService, PackageRequest, PackageResponse } from '../crm-api.service';
import { ToastService } from '../../toast/toast.service';
import { finalize } from 'rxjs/operators';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.scss'],
})
export class PackagesComponent implements OnInit {
  private fb = inject(FormBuilder);
  packages: PackageResponse[] = [];
  loading = false;
  error = '';
  editing?: PackageResponse;
  showAll = false;

  form = this.fb.group({
    packageName: ['', Validators.required],
    sessionsPurchased: [1, [Validators.required, Validators.min(1)]],
    sessionsBonus: [0],
    pricePerSession: [0, [Validators.required, Validators.min(0)]],
    totalPrice: [0, [Validators.required, Validators.min(0)]],
    validityDays: [30],
    birthdayDiscountPct: [0],
    rechargeDiscountPct: [0],
    canUpgrade: [false],
    displayOrder: [0],
  });

  constructor(private api: CrmApiService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    const req = this.showAll ? this.api.listAllPackages() : this.api.listPackages();
    req.subscribe({
      next: (rows: any) => {
        this.packages = this.asArray<PackageResponse>(rows);
        this.loading = false;
        this.error = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Unable to load packages';
        this.toast.error(this.error);
        this.cdr.detectChanges();
      },
    });
  }

  private asArray<T>(value: any): T[] {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.content)) return value.content;
    if (Array.isArray(value?.items)) return value.items;
    return [];
  }

  edit(pkg: PackageResponse) {
    this.editing = pkg;
    this.form.patchValue({
      packageName: pkg.packageName,
      sessionsPurchased: pkg.sessionsPurchased,
      sessionsBonus: pkg.sessionsBonus ?? 0,
      pricePerSession: pkg.pricePerSession ?? 0,
      totalPrice: pkg.totalPrice,
      validityDays: pkg.validityDays ?? 30,
      birthdayDiscountPct: pkg.birthdayDiscountPct ?? 0,
      rechargeDiscountPct: pkg.rechargeDiscountPct ?? 0,
      canUpgrade: !!pkg.canUpgrade,
      displayOrder: pkg.displayOrder ?? 0,
    });
  }

  reset() {
    this.editing = undefined;
    this.form.reset({
      packageName: '',
      sessionsPurchased: 1,
      sessionsBonus: 0,
      pricePerSession: 0,
      totalPrice: 0,
      validityDays: 30,
      birthdayDiscountPct: 0,
      rechargeDiscountPct: 0,
      canUpgrade: false,
      displayOrder: 0,
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.form.getRawValue() as PackageRequest;
    const req = this.editing ? this.api.updatePackage(this.editing.id, payload) : this.api.createPackage(payload);
    this.loading = true;
    req.pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toast.success(this.editing ? 'Package updated' : 'Package created');
        this.reset();
        this.load();
      },
      error: (err) => this.toast.error(err?.message || 'Unable to save package'),
    });
  }

  deactivate(pkg: PackageResponse) {
    this.api.deactivatePackage(pkg.id).subscribe({
      next: () => {
        this.toast.success('Package deactivated');
        this.load();
      },
      error: (err) => this.toast.error(err?.message || 'Unable to deactivate package'),
    });
  }

  reactivate(pkg: PackageResponse) {
    this.api.reactivatePackage(pkg.id).subscribe({
      next: () => {
        this.toast.success('Package reactivated');
        this.load();
      },
      error: (err) => this.toast.error(err?.message || 'Unable to reactivate package'),
    });
  }
}
