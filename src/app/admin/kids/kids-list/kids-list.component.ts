import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerDto, CustomerService, CustomerSummaryDto } from '../../../customer.service';
import { ToastService } from '../../../toast/toast.service';
import { CrmStoreFacade } from '../../state/crm-store.facade';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-kids-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './kids-list.component.html',
  styleUrls: ['./kids-list.component.scss'],
})
export class KidsListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  customers: CustomerSummaryDto[] = [];
  customersLoading = false;
  selectedCustomerId?: number;
  customer?: CustomerDto;

  form = this.fb.group({
    kidName: ['', Validators.required],
    dob: ['', Validators.required],
    gender: ['Male', Validators.required],
    specialNotes: [''],
  });

  constructor(private svc: CustomerService, private toast: ToastService, private crmStore: CrmStoreFacade) {}

  ngOnInit() {
    this.crmStore.customers$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((rows) => (this.customers = rows));
    this.crmStore.loading$('customers').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((loading) => (this.customersLoading = loading));
    this.crmStore.error$('customers').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((error) => {
      if (error) this.toast.error(error);
    });
    this.crmStore.ensureCustomers();
  }

  loadCustomer() {
    this.customer = undefined;
    if (!this.selectedCustomerId) return;
    this.svc.getCustomerById(this.selectedCustomerId).subscribe({
      next: (customer) => (this.customer = { ...customer, kids: customer.kids ?? [] }),
      error: (err) => this.toast.error(err?.message || 'Unable to load customer kids'),
    });
  }

  addKid() {
    if (!this.customer || this.form.invalid) return;
    this.svc.addKid(this.customer.id, this.form.getRawValue() as any).subscribe({
      next: (kid) => {
        this.toast.success('Kid added');
        this.customer?.kids?.push(kid);
        this.form.reset({ gender: 'Male' });
      },
      error: (err) => this.toast.error(err?.message || 'Unable to add kid'),
    });
  }
}
