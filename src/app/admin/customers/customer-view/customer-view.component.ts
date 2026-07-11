import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService, CustomerDto, CreateKidRequest, KidDto } from '../../../customer.service';
import { ToastService } from '../../../toast/toast.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-customer-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.scss'],
})
export class CustomerViewComponent implements OnInit {
  customer?: CustomerDto;
  loading = false;
  error = '';
  kidForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: CustomerService,
    private toast: ToastService,
    private fb: FormBuilder
  ) {
    this.kidForm = this.fb.group({
      kidName: ['', Validators.required],
      dob: ['', Validators.required],
      gender: ['Male', Validators.required],
      specialNotes: [''],
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
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.message || 'Could not load customer.';
      },
    });
  }

  addKid() {
    if (!this.customer || this.kidForm.invalid) return;
    const payload = this.kidForm.getRawValue() as CreateKidRequest;
    this.svc.addKid(this.customer.id, payload).subscribe({
      next: (kid: KidDto) => {
        this.toast.success('Kid added successfully');
        this.customer?.kids?.push(kid);
        this.kidForm.reset({ gender: 'Male' });
      },
      error: (err: any) => {
        this.toast.error(err?.message || 'Failed to add kid');
      },
    });
  }

  edit() {
    if (this.customer) {
      this.router.navigate(['/admin/customers', this.customer.id, 'edit']);
    }
  }

  purchasePackage() {
    if (this.customer) {
      this.router.navigate(['/admin/purchases'], { queryParams: { customerId: this.customer.id } });
    }
  }

  checkin() {
    if (this.customer) {
      this.router.navigate(['/admin/checkin'], { queryParams: { customerId: this.customer.id } });
    }
  }
}
