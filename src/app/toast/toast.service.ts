import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private messages = new BehaviorSubject<ToastMessage[]>([]);
  messages$ = this.messages.asObservable();

  show(text: string, type: ToastMessage['type'] = 'info', duration = 4000) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const next = [...this.messages.value, { id, type, text }];
    this.messages.next(next);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(text: string, duration?: number) {
    this.show(text, 'success', duration);
  }

  error(text: string, duration?: number) {
    this.show(text, 'error', duration);
  }

  info(text: string, duration?: number) {
    this.show(text, 'info', duration);
  }

  dismiss(id: string) {
    const next = this.messages.value.filter((message) => message.id !== id);
    this.messages.next(next);
  }
}
