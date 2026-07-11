import { describe, it, expect } from 'vitest';
import { CustomersListComponent } from './customers-list.component';

describe('CustomersListComponent', () => {
  it('initializes the component', () => {
    const component = new CustomersListComponent(undefined as any, undefined as any);
    expect(component).toBeTruthy();
  });
});
