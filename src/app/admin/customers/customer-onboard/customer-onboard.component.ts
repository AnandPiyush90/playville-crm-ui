import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService, CreateCustomerRequest } from '../../../customer.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../toast/toast.service';

@Component({
  selector: 'app-customer-onboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-onboard.component.html',
  styleUrls: ['./customer-onboard.component.scss'],
})
export class CustomerOnboardComponent {
  form: FormGroup;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private svc: CustomerService, private router: Router, private toast: ToastService) {
    this.form = this.fb.group({
      parentName: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required]],
      email: [''],
      leadSource: [''],
      disclaimerAccepted: [false],
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const payload = this.form.getRawValue() as CreateCustomerRequest;

    this.svc.createCustomer(payload).subscribe({
      next: () => {
        this.toast.success('Customer created successfully');
        this.router.navigate(['/admin/customers']);
      },
      error: (e: any) => {
        this.error = e?.message || 'Unable to create customer';
        this.loading = false;
        this.toast.error(this.error);
      },
    });
  }
}
