import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'playville_theme';
  private readonly themeSubject = new BehaviorSubject<AppTheme>(this.readTheme());
  theme$ = this.themeSubject.asObservable();

  constructor() {
    this.applyTheme(this.themeSubject.value);
  }

  setTheme(theme: AppTheme) {
    localStorage.setItem(this.storageKey, theme);
    this.themeSubject.next(theme);
    this.applyTheme(theme);
  }

  toggleTheme() {
    this.setTheme(this.themeSubject.value === 'dark' ? 'light' : 'dark');
  }

  private readTheme(): AppTheme {
    const saved = localStorage.getItem(this.storageKey);
    return saved === 'dark' ? 'dark' : 'light';
  }

  private applyTheme(theme: AppTheme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
