import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { CreateStaffRequest, CrmApiService, StaffDto } from '../crm-api.service';
import { ToastService } from '../../toast/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.scss'],
})
export class StaffComponent implements OnInit {
  private fb = inject(FormBuilder);
  staff: StaffDto[] = [];
  loading = false;
  error = '';
  form = this.fb.group({
    fullName: ['', Validators.required],
    email: [''],
    phone: [''],
    username: ['', Validators.required],
    password: ['', Validators.required],
    role: ['staff'],
  });

  constructor(private api: CrmApiService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    this.api.listStaff().subscribe({
      next: (rows: any) => {
        this.staff = this.asArray<StaffDto>(rows);
        this.loading = false;
        this.error = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Unable to load staff';
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

  create() {
    if (this.form.invalid) return;
    this.loading = true;
    this.api.createStaff(this.form.getRawValue() as CreateStaffRequest).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toast.success('Staff created');
        this.form.reset({ role: 'staff' });
        this.load();
      },
      error: (err) => this.toast.error(err?.message || 'Unable to create staff'),
    });
  }

  deactivate(row: StaffDto) {
    this.api.deactivateStaff(row.id).subscribe({
      next: () => {
        this.toast.success('Staff deactivated');
        this.load();
      },
      error: (err) => this.toast.error(err?.message || 'Unable to deactivate staff'),
    });
  }
}
