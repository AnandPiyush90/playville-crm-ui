import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService, CustomerSummaryDto, PagedResponse } from '../../../customer.service';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { CheckinService } from '../../checkin/checkin.service';
import { CrmStoreFacade } from '../../state/crm-store.facade';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customers-list.component.html',
  styleUrls: ['./customers-list.component.scss'],
})
export class CustomersListComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  customers: CustomerSummaryDto[] = [];
  page = 0;
  size = 20;
  search = '';
  loading = false;
  error = '';
  activeCustomerIds = new Set<number>();

  constructor(private svc: CustomerService, private router: Router, private checkinSvc: CheckinService, private crmStore: CrmStoreFacade) {}

  ngOnInit(): void {
    this.crmStore.customers$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((rows) => (this.customers = rows));
    this.crmStore.loading$('customers').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((loading) => (this.loading = loading));
    this.crmStore.error$('customers').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((error) => (this.error = error));
    this.crmStore.ensureCustomers();
    this.loadActiveCheckins();
  }

  load() {
    if (this.search.trim()) {
      this.loading = true;
      this.error = '';
      this.svc
        .listCustomers(this.page, this.size, this.search)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (p: PagedResponse<CustomerSummaryDto>) => {
            this.customers = p.content ?? [];
          },
          error: (e: any) => {
            this.error = e?.message || 'Unable to load customers.';
          },
        });
      return;
    }
    this.crmStore.ensureCustomers(true);
  }

  loadActiveCheckins() {
    this.checkinSvc.getActiveCheckins().subscribe({
      next: (rows) => {
        this.activeCustomerIds = new Set((rows ?? []).map((row) => row.customerId));
      },
      error: () => {
        this.activeCustomerIds = new Set<number>();
      },
    });
  }

  isCheckedIn(id: number) {
    return this.activeCustomerIds.has(id);
  }

  view(id: number) {
    this.router.navigate(['/admin/customers', id]);
  }

  edit(id: number) {
    this.router.navigate(['/admin/customers', id, 'edit']);
  }

  checkin(id: number) {
    this.router.navigate(['/admin/checkin'], { queryParams: { customerId: id } });
  }
}
