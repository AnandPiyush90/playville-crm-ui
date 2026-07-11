import { describe, it, expect } from 'vitest';
import { CustomerOnboardComponent } from './customer-onboard.component';

describe('CustomerOnboardComponent', () => {
  it('creates the component', () => {
    const component = new CustomerOnboardComponent(undefined as any, undefined as any, undefined as any);
    expect(component).toBeTruthy();
  });
});
