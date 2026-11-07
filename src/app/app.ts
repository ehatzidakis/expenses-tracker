import { Component, effect, inject, Injector, signal, untracked } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';
import { ExpenseStateService } from './services/expense-state.service';
import { TabBarComponent } from './components/tab-bar.component/tab-bar.component';
import { CreateTransactionComponent } from './components/create-transaction.component/create-transaction.component';
import { ChartsPageComponent } from './components/charts-page/charts-page';
import { AuthService } from './services/auth.service';
import { PendingBadgeService } from './services/pending-badge.service';
import { KioskShellComponent } from './components/kiosk-shell/kiosk-shell.component';
import { BudgetPageComponent } from './components/budget-page/budget-page';
import { SplitzesPageComponent } from './components/splitzes-modal.component/splitzes-modal.component';
import { SettingsPageComponent } from './components/settings-modal.component/settings-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    TabBarComponent,
    CreateTransactionComponent,
    ChartsPageComponent,
    BudgetPageComponent,
    KioskShellComponent,
    SplitzesPageComponent,
    SettingsPageComponent,
  ],
  templateUrl: './app.html',
})
export class AppComponent {
  state = inject(ExpenseStateService);
  private authService = inject(AuthService);
  private swUpdate = inject(SwUpdate);
  private injector = inject(Injector);

  readonly email = signal('');
  readonly password = signal('');
  readonly authError = signal<string | null>(null);
  readonly isSigningIn = signal(false);
  readonly user = this.authService.user;
  readonly currentRole = this.authService.currentRole;
  readonly authReady = this.authService.authReady;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly isAdmin = this.authService.isAdmin;
  readonly isKiosk = this.authService.isKiosk;
  readonly isUpdating = signal(false);

  constructor() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((event) => event.type === 'VERSION_READY'))
        .subscribe(() => {
          this.isUpdating.set(true);
          this.swUpdate.activateUpdate().then(() => window.location.reload());
        });

      this.swUpdate.checkForUpdate();
    }

    // The Home Screen badge: items to review for the admin, requests to fill in for the kiosk.
    // Looked up lazily so signed-out sessions and tests never create it.
    effect(() => {
      const role = this.currentRole();
      if (role) this.injector.get(PendingBadgeService).start(role);
    });

    // Signing out from Settings: the next sign-in starts on Budget, not on Settings.
    effect(() => {
      if (this.authReady() && !this.isAuthenticated()) untracked(() => this.state.setActiveTab('monthly'));
    });
  }

  async signIn(): Promise<void> {
    const email = this.email().trim();
    const password = this.password();

    if (!email || !password) {
      this.authError.set('Enter both email and password.');
      return;
    }

    this.isSigningIn.set(true);
    this.authError.set(null);

    try {
      await this.authService.signIn(email, password);
      this.email.set('');
      this.password.set('');
    } catch (error) {
      console.error('Sign in failed:', error);
      this.authError.set(
        'Unable to sign in. Check your email and password, or enable Email/Password auth in Firebase.',
      );
    } finally {
      this.isSigningIn.set(false);
    }
  }
}
