import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** How long the app can sit in the background before it asks for Face ID again. */
export const RELOCK_AFTER_MS = 60_000;

const CREDENTIAL_KEY = 'app_lock_credential';

/** The authenticator data's flags byte sits after the 32-byte RP ID hash; 0x04 is "user verified". */
const FLAGS_INDEX = 32;
const USER_VERIFIED = 0x04;

/**
 * Asks for Face ID before the admin sees the app. It uses a passkey that lives on this phone:
 * creating it and using it both need Face ID (or the phone's passcode as iOS's own fallback).
 *
 * This keeps out someone holding the unlocked phone. It does not encrypt anything: the Firebase
 * session and the cached data stay on the device as before.
 */
@Injectable({ providedIn: 'root' })
export class AppLockService {
  private credentialId = readStored();
  private hiddenAt: number | null = null;
  private pending: Promise<boolean> | null = null;

  /** This device can ask for Face ID, Touch ID or Windows Hello. Checked once at start. */
  readonly supported = signal(false);
  readonly enabled = signal(this.credentialId !== null);
  /** Face ID is needed before the app can be used. */
  readonly locked = signal(this.credentialId !== null);
  /** The app is in the background: hide it so the app switcher snapshot shows nothing. */
  readonly covered = signal(false);
  readonly busy = signal(false);

  constructor() {
    void checkSupport().then((ok) => this.supported.set(ok));

    const onVisibility = () => this.handleVisibility(document.visibilityState);
    document.addEventListener('visibilitychange', onVisibility);
    inject(DestroyRef).onDestroy(() =>
      document.removeEventListener('visibilitychange', onVisibility),
    );
  }

  /** Creates the passkey. iOS asks for Face ID while it does. Must run from a tap. */
  async enable(account: { uid: string; email: string }): Promise<void> {
    if (!this.supported()) throw new Error('Face ID is not available on this device.');

    this.busy.set(true);
    try {
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: randomBytes(32),
          rp: { name: 'Expenses' },
          // The uid as the passkey's user id, so turning this on again replaces the old passkey.
          user: {
            id: new TextEncoder().encode(account.uid),
            name: account.email,
            displayName: account.email,
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
          },
          attestation: 'none',
          timeout: 60_000,
        },
      })) as PublicKeyCredential | null;

      if (!credential) throw new Error('Face ID was not set up.');

      this.credentialId = toBase64Url(new Uint8Array(credential.rawId));
      writeStored(this.credentialId);
      this.enabled.set(true);
      this.locked.set(false);
    } catch (error) {
      throw friendlyError(error, 'Face ID was not set up.');
    } finally {
      this.busy.set(false);
    }
  }

  /** Turns the lock off on this device. iOS keeps the passkey in Passwords until deleted there. */
  disable(): void {
    this.credentialId = null;
    writeStored(null);
    this.enabled.set(false);
    this.locked.set(false);
    this.covered.set(false);
  }

  /** Asks for Face ID. True when it went through. Calls made while one is open share it. */
  unlock(): Promise<boolean> {
    if (!this.locked()) return Promise.resolve(true);
    this.pending ??= this.verify().finally(() => (this.pending = null));
    return this.pending;
  }

  private async verify(): Promise<boolean> {
    if (!this.credentialId) {
      this.locked.set(false);
      return true;
    }

    this.busy.set(true);
    try {
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: randomBytes(32),
          allowCredentials: [{ type: 'public-key', id: fromBase64Url(this.credentialId) }],
          userVerification: 'required',
          timeout: 60_000,
        },
      })) as PublicKeyCredential | null;

      const response = assertion?.response as AuthenticatorAssertionResponse | undefined;
      const flags = response ? new Uint8Array(response.authenticatorData)[FLAGS_INDEX] : 0;
      if (!(flags & USER_VERIFIED)) return false;

      this.locked.set(false);
      this.covered.set(false);
      return true;
    } catch (error) {
      // Cancelled, failed, or iOS wanted a tap first. The lock screen offers the button.
      console.warn('Face ID unlock did not go through:', error);
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  private handleVisibility(state: DocumentVisibilityState): void {
    if (!this.enabled()) return;

    if (state === 'hidden') {
      this.hiddenAt ??= Date.now();
      this.covered.set(true);
      return;
    }

    const away = this.hiddenAt === null ? 0 : Date.now() - this.hiddenAt;
    this.hiddenAt = null;
    if (away >= RELOCK_AFTER_MS) this.locked.set(true);
    this.covered.set(false);
  }
}

async function checkSupport(): Promise<boolean> {
  try {
    return (
      typeof PublicKeyCredential !== 'undefined' &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  } catch {
    return false;
  }
}

function friendlyError(error: unknown, fallback: string): Error {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return new Error(`${fallback} It was cancelled or timed out.`);
  }
  if (error instanceof DOMException && error.name === 'InvalidStateError') {
    return new Error(`${fallback} A passkey for this app already exists; try again.`);
  }
  return error instanceof Error ? error : new Error(fallback);
}

function readStored(): string | null {
  try {
    return localStorage.getItem(CREDENTIAL_KEY);
  } catch {
    return null;
  }
}

function writeStored(value: string | null): void {
  try {
    if (value) localStorage.setItem(CREDENTIAL_KEY, value);
    else localStorage.removeItem(CREDENTIAL_KEY);
  } catch {
    // Storage blocked: the lock only lasts for this session.
  }
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length));
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
