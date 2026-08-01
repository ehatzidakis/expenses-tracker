import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PrivacyService {
  private readonly STORAGE_KEY = 'stealth_mode_enabled';

  readonly isPrivacyMode = signal<boolean>(localStorage.getItem(this.STORAGE_KEY) === 'true');

  constructor() {
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, String(this.isPrivacyMode()));
    });
  }

  toggle(): void {
    this.isPrivacyMode.update((current) => !current);
  }
}
