import { CheckinComponent } from './checkin.component';

describe('CheckinComponent', () => {
  it('creates', () => {
    const comp = new CheckinComponent(undefined as any, undefined as any, undefined as any, undefined as any);
    expect(comp).toBeTruthy();
  });
});
