import { describe, it, expect } from 'vitest';
import { CustomerViewComponent } from './customer-view.component';

describe('CustomerViewComponent', () => {
  it('creates the component', () => {
    const component = new CustomerViewComponent(undefined as any, undefined as any, undefined as any, undefined as any, undefined as any);
    expect(component).toBeTruthy();
  });
});
