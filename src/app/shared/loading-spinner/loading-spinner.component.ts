import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-shell" [class.compact]="compact">
      <span class="spinner" aria-hidden="true"></span>
      <span>{{ label }}</span>
    </div>
  `,
  styles: [
    `
      .spinner-shell {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        color: #4b5563;
        font-weight: 600;
      }
      .spinner-shell.compact {
        font-size: 0.9rem;
      }
      .spinner {
        width: 1.1rem;
        height: 1.1rem;
        border: 2px solid #dbeafe;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 0.75s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `,
  ],
})
export class LoadingSpinnerComponent {
  @Input() label = 'Loading...';
  @Input() compact = false;
}
