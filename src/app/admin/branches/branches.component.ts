import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { BranchDto, CrmApiService } from '../crm-api.service';
import { ToastService } from '../../toast/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './branches.component.html',
  styleUrls: ['./branches.component.scss'],
})
export class BranchesComponent implements OnInit {
  private fb = inject(FormBuilder);
  branches: BranchDto[] = [];
  selected?: BranchDto;
  loading = false;
  error = '';

  form = this.fb.group({
    branchName: ['', Validators.required],
    address: [''],
    phone: [''],
    openTime: [''],
    closeTime: [''],
    closedDay: [''],
    notificationEmail: [''],
  });

  constructor(private api: CrmApiService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    this.api.listBranches().subscribe({
      next: (rows: any) => {
        this.branches = this.asArray<BranchDto>(rows);
        this.loading = false;
        this.error = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Unable to load branches';
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

  select(branch: BranchDto) {
    this.selected = branch;
    this.form.patchValue({
      branchName: branch.branchName,
      address: branch.address ?? '',
      phone: branch.phone ?? '',
      openTime: branch.openTime ?? '',
      closeTime: branch.closeTime ?? '',
      closedDay: branch.closedDay ?? '',
      notificationEmail: branch.notificationEmail ?? '',
    });
  }

  save() {
    if (!this.selected || this.form.invalid) return;
    const raw = this.form.getRawValue();
    this.loading = true;
    this.api.updateBranch(this.selected.id, {
      branchName: raw.branchName ?? undefined,
      address: raw.address ?? undefined,
      phone: raw.phone ?? undefined,
      openTime: raw.openTime ?? undefined,
      closeTime: raw.closeTime ?? undefined,
      closedDay: raw.closedDay ?? undefined,
      notificationEmail: raw.notificationEmail ?? undefined,
    }).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toast.success('Branch updated');
        this.load();
      },
      error: (err) => this.toast.error(err?.message || 'Unable to update branch'),
    });
  }
}
