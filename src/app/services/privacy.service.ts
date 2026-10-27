import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PrivacyService {
  private readonly STORAGE_KEY = 'stealth_mode_enabled';
  private readonly HASH_KEY = 'stealth';

  readonly isPrivacyMode = signal<boolean>(localStorage.getItem(this.STORAGE_KEY) === 'true');
  readonly hasPassword = signal<boolean>(!!localStorage.getItem(this.HASH_KEY));

  constructor() {
    // ⚠️ TEMPORARY: Un-comment this, load the app once on your phone, then delete this line!
    // this.setPassword('1410').then(() => console.log('Password set!'));

    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, String(this.isPrivacyMode()));
    });
  }

  enablePrivacyMode(): void {
    this.isPrivacyMode.set(true);
  }

  async setPassword(newPassword: string): Promise<void> {
    if (!newPassword) return;
    const hash = await this.hashString(newPassword);
    localStorage.setItem(this.HASH_KEY, hash);
    this.hasPassword.set(true);
  }

  private async hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async removePassword(currentPassword: string): Promise<boolean> {
    const isValid = await this.verifyPassword(currentPassword);
    if (isValid) {
      localStorage.removeItem(this.HASH_KEY);
      this.hasPassword.set(false);
      return true;
    }
    return false;
  }

  private async verifyPassword(input: string): Promise<boolean> {
    const storedHash = localStorage.getItem(this.HASH_KEY);
    if (!storedHash) return true;

    const inputHash = await this.hashString(input);
    return storedHash === inputHash;
  }

  async unlock(password: string): Promise<boolean> {
    // If no password is configured, unlock directly
    if (!this.hasPassword()) {
      this.isPrivacyMode.set(false);
      return true;
    }

    const isValid = await this.verifyPassword(password);
    if (isValid) {
      this.isPrivacyMode.set(false);
      return true;
    }

    return false;
  }
}
