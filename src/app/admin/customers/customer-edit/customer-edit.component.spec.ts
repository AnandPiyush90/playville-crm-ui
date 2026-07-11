import { describe, it, expect } from 'vitest';
import { CustomerEditComponent } from './customer-edit.component';

describe('CustomerEditComponent', () => {
  it('creates the component', () => {
    const component = new CustomerEditComponent(undefined as any, undefined as any, undefined as any, undefined as any, undefined as any);
    expect(component).toBeTruthy();
  });
});
