import { describe, it, expect } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  it('adds and removes toast messages', () => {
    const service = new ToastService();
    service.success('Saved', 1000);
    const messages = service.messages$.getValue();
    expect(messages.length).toBe(1);
    service.dismiss(messages[0].id);
    expect(service.messages$.getValue().length).toBe(0);
  });
});
