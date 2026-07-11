import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  it('creates', () => {
    const comp = new LoginComponent(undefined as any, undefined as any, undefined as any);
    expect(comp).toBeTruthy();
  });
});
