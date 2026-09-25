import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { AppComponent } from './app';
import { SwUpdate } from '@angular/service-worker';
import { AdjustmentService } from './services/adjustment-service';
import { AuthService } from './services/auth.service';
import { ExpenseStateService } from './services/expense-state.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    const authReady = signal(true);
    const user = signal(null);
    const currentRole = signal(null);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            user,
            currentRole,
            authReady,
            isAuthenticated: computed(() => false),
            isAdmin: computed(() => false),
            isKiosk: computed(() => false),
          },
        },
        {
          provide: AdjustmentService,
          useValue: {
            getAdjustmentsQuery: () => ({ data: signal([]) }),
          },
        },
        {
          provide: ExpenseStateService,
          useValue: {},
        },
        {
          provide: SwUpdate,
          useValue: { isEnabled: false },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the sign-in screen when signed out', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Sign in to continue');
  });
});
