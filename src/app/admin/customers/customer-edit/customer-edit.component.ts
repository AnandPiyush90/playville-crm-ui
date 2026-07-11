import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService, CustomerDto, UpdateCustomerRequest } from '../../../customer.service';
import { ToastService } from '../../../toast/toast.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-customer-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-edit.component.html',
  styleUrls: ['./customer-edit.component.scss'],
})
export class CustomerEditComponent implements OnInit {
  form: FormGroup;
  customer?: CustomerDto;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: CustomerService,
    private toast: ToastService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      parentName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: [''],
      leadSource: [''],
      disclaimerAccepted: [false],
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Invalid customer ID.';
      return;
    }
    this.loadCustomer(id);
  }

  loadCustomer(id: number) {
    this.loading = true;
    this.svc.getCustomerById(id).subscribe({
      next: (customer: CustomerDto) => {
        this.customer = customer;
        this.form.patchValue({
          parentName: customer.parentName,
          phoneNumber: customer.phoneNumber,
          email: customer.email,
          leadSource: customer.leadSource,
          disclaimerAccepted: customer.disclaimerAccepted,
        });
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.message || 'Failed to load customer.';
      },
    });
  }

  save() {
    if (!this.customer || this.form.invalid) return;
    this.loading = true;
    const payload = this.form.getRawValue() as UpdateCustomerRequest;
    this.svc.updateCustomer(this.customer.id, payload).subscribe({
      next: () => {
        this.toast.success('Customer updated successfully');
        this.router.navigate(['/admin/customers', this.customer?.id]);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.message || 'Update failed';
      },
    });
  }
}
