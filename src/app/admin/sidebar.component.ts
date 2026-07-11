import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppTheme, ThemeService } from '../theme.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="sidebar">
      <header class="sidebar-header">
        <span class="brand-mark">PV</span>
        <span>
          <strong>PlayVille</strong>
          <small>Admin CRM</small>
        </span>
      </header>
      <ul class="nav-list">
        <li><a routerLink="/admin/customers" routerLinkActive="active">Customers</a></li>
        <li><a routerLink="/admin/customers/new" routerLinkActive="active">Onboard Customer</a></li>
        <li><a routerLink="/admin/kids" routerLinkActive="active">Kids</a></li>
        <li><a routerLink="/admin/packages" routerLinkActive="active">Packages</a></li>
        <li><a routerLink="/admin/purchases" routerLinkActive="active">Purchases</a></li>
        <li><a routerLink="/admin/checkin" routerLinkActive="active">Check-in / Check-out</a></li>
        <li><a routerLink="/admin/bookings" routerLinkActive="active">Bookings</a></li>
        <li><a routerLink="/admin/branches" routerLinkActive="active">Branches</a></li>
        <li><a routerLink="/admin/staff" routerLinkActive="active">Staff</a></li>
      </ul>
      <section class="theme-card">
        <span>Theme</span>
        <div class="theme-switch">
          <button type="button" [class.active]="theme === 'light'" (click)="setTheme('light')">Light</button>
          <button type="button" [class.active]="theme === 'dark'" (click)="setTheme('dark')">Dark</button>
        </div>
      </section>
    </nav>
  `,
  styles: [
    `
      .sidebar {
        padding: 1rem;
        font-family: var(--font-ui);
        color: var(--text-strong);
      }
      .sidebar-header {
        font-weight: 700;
        font-size: 1rem;
        margin-bottom: 1.25rem;
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      .brand-mark {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0.9rem;
        display: grid;
        place-items: center;
        color: #ffffff;
        background: linear-gradient(135deg, var(--brand-blue), var(--brand-pink));
        box-shadow: var(--shadow-pop);
        letter-spacing: 0.04em;
      }
      .sidebar-header small {
        display: block;
        color: var(--text-muted);
        font-weight: 600;
        margin-top: 0.1rem;
      }
      .nav-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .nav-list a {
        text-decoration: none;
        color: var(--text);
        padding: 0.62rem 0.75rem;
        border-radius: 0.65rem;
        display: inline-block;
        width: 100%;
        transition: background 160ms ease, color 160ms ease, transform 160ms ease;
      }
      .nav-list a.active {
        background: var(--nav-active);
        color: var(--brand-blue-strong);
        font-weight: 600;
        box-shadow: inset 3px 0 0 var(--brand-yellow);
      }
      .nav-list a:hover {
        background: var(--surface-hover);
        transform: translateX(2px);
      }
      .theme-card {
        margin-top: 1.25rem;
        padding: 0.75rem;
        border-radius: 0.85rem;
        background: var(--surface-soft);
        border: 1px solid var(--border);
      }
      .theme-card > span {
        display: block;
        color: var(--text-muted);
        font-size: 0.8rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }
      .theme-switch {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.35rem;
      }
      .theme-switch button {
        border: 0;
        border-radius: 0.6rem;
        padding: 0.45rem 0.55rem;
        background: transparent;
        color: var(--text);
        font-weight: 700;
        cursor: pointer;
      }
      .theme-switch button.active {
        background: var(--brand-blue);
        color: #fff;
      }
    `,
  ],
})
export class SidebarComponent {
  theme: AppTheme = 'light';

  constructor(private themeService: ThemeService) {
    this.themeService.theme$.subscribe((theme) => (this.theme = theme));
  }

  setTheme(theme: AppTheme) {
    this.themeService.setTheme(theme);
  }
}
