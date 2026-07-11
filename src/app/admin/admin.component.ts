import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, RouterOutlet],
  template: `
    <div class="admin-shell">
      <app-sidebar class="admin-sidebar"></app-sidebar>
      <main class="admin-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .admin-shell {
        display: flex;
        min-height: 100vh;
        background:
          radial-gradient(circle at 18% 8%, var(--wash-blue), transparent 28rem),
          radial-gradient(circle at 82% 12%, var(--wash-yellow), transparent 24rem),
          var(--app-bg);
        color: var(--text);
      }
      .admin-sidebar {
        width: 260px;
        border-right: 1px solid var(--border);
        background: var(--sidebar-bg);
        backdrop-filter: blur(18px);
        position: sticky;
        top: 0;
        height: 100vh;
        overflow: auto;
      }
      .admin-main {
        flex: 1;
        padding: 1.25rem;
        min-width: 0;
      }
    `,
  ],
})
export class AdminComponent {}
