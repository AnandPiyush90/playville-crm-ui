import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrmApiService } from '../crm-api.service';
import { CustomerDto, CustomerService, CustomerSummaryDto } from '../../customer.service';
import { ToastService } from '../../toast/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss'],
})
export class BookingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  customers: CustomerSummaryDto[] = [];
  selectedCustomer?: CustomerDto;
  birthdayBookings: any[] = [];
  schoolTrips: any[] = [];
  birthdayLoading = false;
  schoolTripLoading = false;
  birthdayError = '';
  schoolTripError = '';
  statusById: Record<number, string> = {};
  actualKidsById: Record<number, number | null> = {};

  birthdayForm = this.fb.group({
    customerId: [null as number | null, Validators.required],
    kidId: [null as number | null, Validators.required],
    partyDate: ['', Validators.required],
    partySlotStart: ['', Validators.required],
    expectedGuests: [0],
    cakeOption: [''],
    foodBoxesCount: [0],
    baseAmount: [0],
    discountPct: [0],
    advancePaid: [0],
    paymentMode: ['UPI'],
    paymentReference: [''],
    notes: [''],
  });

  tripForm = this.fb.group({
    schoolName: ['', Validators.required],
    contactPerson: [''],
    contactPhone: [''],
    contactEmail: [''],
    tripDate: ['', Validators.required],
    slotStart: ['', Validators.required],
    slotEnd: ['', Validators.required],
    expectedKids: [0],
    pricePerKid: [0],
    totalAmount: [0],
    advancePaid: [0],
    paymentMode: ['UPI'],
    paymentReference: [''],
    notes: [''],
  });

  constructor(
    private api: CrmApiService,
    private customersApi: CustomerService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.customersApi.listCustomers(0, 100).subscribe({
      next: (page) => {
        this.customers = page.content ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => this.toast.error(err?.message || 'Unable to load customers'),
    });
    this.load();
  }

  load() {
    this.loadBirthdayBookings();
    this.loadSchoolTrips();
  }

  loadBirthdayBookings() {
    this.birthdayLoading = true;
    this.birthdayError = '';
    this.cdr.detectChanges();
    this.api.listBirthdayBookings().subscribe({
      next: (rows: any) => {
        this.birthdayBookings = this.asArray(rows);
        this.birthdayBookings.forEach((b) => (this.statusById[b.id] = b.status));
        this.birthdayLoading = false;
        this.birthdayError = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.birthdayLoading = false;
        this.birthdayError = err?.error?.message || err?.message || 'Unable to load birthday bookings';
        this.toast.error(this.birthdayError);
        this.cdr.detectChanges();
      },
    });
  }

  loadSchoolTrips() {
    this.schoolTripLoading = true;
    this.schoolTripError = '';
    this.cdr.detectChanges();
    this.api.listSchoolTrips().subscribe({
      next: (rows: any) => {
        this.schoolTrips = this.asArray(rows);
        this.schoolTrips.forEach((t) => {
          this.statusById[t.id] = t.status;
          this.actualKidsById[t.id] = t.actualKids ?? null;
        });
        this.schoolTripLoading = false;
        this.schoolTripError = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.schoolTripLoading = false;
        this.schoolTripError = err?.error?.message || err?.message || 'Unable to load school trips';
        this.toast.error(this.schoolTripError);
        this.cdr.detectChanges();
      },
    });
  }

  private asArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.content)) return value.content;
    if (Array.isArray(value?.items)) return value.items;
    return [];
  }

  loadCustomerKids() {
    const id = this.birthdayForm.controls.customerId.value;
    this.selectedCustomer = undefined;
    this.birthdayForm.patchValue({ kidId: null });
    if (!id) return;
    this.customersApi.getCustomerById(id).subscribe({
      next: (customer) => (this.selectedCustomer = customer),
      error: (err) => this.toast.error(err?.message || 'Unable to load kids for customer'),
    });
  }

  createBirthday() {
    if (this.birthdayForm.invalid) return;
    const raw = this.birthdayForm.getRawValue();
    this.api.createBirthdayBooking({
      customerId: Number(raw.customerId),
      kidId: Number(raw.kidId),
      partyDate: raw.partyDate ?? '',
      partySlotStart: raw.partySlotStart ?? '',
      expectedGuests: raw.expectedGuests ?? undefined,
      cakeOption: raw.cakeOption?.trim() || undefined,
      foodBoxesCount: raw.foodBoxesCount ?? undefined,
      baseAmount: raw.baseAmount ?? undefined,
      discountPct: raw.discountPct ?? undefined,
      advancePaid: raw.advancePaid ?? undefined,
      paymentMode: raw.paymentMode as any,
      paymentReference: raw.paymentReference?.trim() || undefined,
      notes: raw.notes?.trim() || undefined,
    }).subscribe({
      next: () => {
        this.toast.success('Birthday booking created');
        this.birthdayForm.reset({ paymentMode: 'UPI' });
        this.selectedCustomer = undefined;
        this.loadBirthdayBookings();
      },
      error: (err) => this.toast.error(err?.message || 'Unable to create birthday booking'),
    });
  }

  createTrip() {
    if (this.tripForm.invalid) return;
    this.api.createSchoolTrip(this.tripForm.getRawValue() as any).subscribe({
      next: () => {
        this.toast.success('School trip created');
        this.tripForm.reset({ paymentMode: 'UPI' });
        this.loadSchoolTrips();
      },
      error: (err) => this.toast.error(err?.message || 'Unable to create school trip'),
    });
  }

  updateBirthdayStatus(row: any) {
    this.api.updateBirthdayStatus(row.id, this.statusById[row.id]).subscribe({
      next: () => {
        this.toast.success('Birthday status updated');
        this.loadBirthdayBookings();
      },
      error: (err) => this.toast.error(err?.message || 'Unable to update birthday status'),
    });
  }

  updateTripStatus(row: any) {
    this.api.updateSchoolTripStatus(row.id, this.statusById[row.id], this.actualKidsById[row.id] ?? undefined).subscribe({
      next: () => {
        this.toast.success('Trip status updated');
        this.loadSchoolTrips();
      },
      error: (err) => this.toast.error(err?.message || 'Unable to update trip status'),
    });
  }
}
