import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AppLockService, RELOCK_AFTER_MS } from './app-lock.service';

/** Authenticator data: a 32-byte RP ID hash, then the flags byte. */
function authenticatorData(flags: number): ArrayBuffer {
  const data = new Uint8Array(37);
  data[32] = flags;
  return data.buffer;
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('AppLockService', () => {
  let create: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;

  async function setup() {
    const service = TestBed.inject(AppLockService);
    await vi.waitFor(() => expect(service.supported()).toBe(true));
    return service;
  }

  beforeEach(() => {
    localStorage.clear();
    create = vi.fn(async () => ({ rawId: new Uint8Array([1, 2, 250, 251]).buffer }));
    get = vi.fn(async () => ({ response: { authenticatorData: authenticatorData(0x05) } }));
    vi.stubGlobal('PublicKeyCredential', {
      isUserVerifyingPlatformAuthenticatorAvailable: async () => true,
    });
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: { create, get },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    setVisibility('visible');
  });

  it('starts unlocked when Face ID was never turned on', async () => {
    const service = await setup();
    expect(service.enabled()).toBe(false);
    expect(service.locked()).toBe(false);
  });

  it('creates a passkey that needs Face ID and remembers it', async () => {
    const service = await setup();

    await service.enable({ uid: 'admin-uid', email: 'me@example.com' });

    const options = create.mock.calls[0][0].publicKey;
    expect(options.authenticatorSelection).toMatchObject({
      authenticatorAttachment: 'platform',
      userVerification: 'required',
    });
    expect(new TextDecoder().decode(options.user.id)).toBe('admin-uid');
    expect(service.enabled()).toBe(true);
    expect(service.locked()).toBe(false);
    expect(localStorage.getItem('app_lock_credential')).toBe('AQL6-w');
  });

  it('starts locked on the next launch and unlocks with that passkey', async () => {
    localStorage.setItem('app_lock_credential', 'AQL6-w');
    const service = await setup();
    expect(service.locked()).toBe(true);

    expect(await service.unlock()).toBe(true);

    const options = get.mock.calls[0][0].publicKey;
    expect(options.userVerification).toBe('required');
    expect(Array.from(options.allowCredentials[0].id)).toEqual([1, 2, 250, 251]);
    expect(service.locked()).toBe(false);
  });

  it('stays locked when Face ID is cancelled', async () => {
    localStorage.setItem('app_lock_credential', 'AQL6-w');
    get.mockRejectedValue(new DOMException('cancelled', 'NotAllowedError'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const service = await setup();

    expect(await service.unlock()).toBe(false);
    expect(service.locked()).toBe(true);
  });

  it('stays locked when the passkey was used without verifying the person', async () => {
    localStorage.setItem('app_lock_credential', 'AQL6-w');
    get.mockResolvedValue({ response: { authenticatorData: authenticatorData(0x01) } });
    const service = await setup();

    expect(await service.unlock()).toBe(false);
    expect(service.locked()).toBe(true);
  });

  it('shares one Face ID prompt between calls made while it is open', async () => {
    localStorage.setItem('app_lock_credential', 'AQL6-w');
    const service = await setup();

    await Promise.all([service.unlock(), service.unlock()]);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('covers the app in the background and locks again only after a minute away', async () => {
    const service = await setup();
    await service.enable({ uid: 'admin-uid', email: 'me@example.com' });
    vi.useFakeTimers();

    setVisibility('hidden');
    expect(service.covered()).toBe(true);
    vi.advanceTimersByTime(RELOCK_AFTER_MS - 1000);
    setVisibility('visible');
    expect(service.covered()).toBe(false);
    expect(service.locked()).toBe(false);

    setVisibility('hidden');
    vi.advanceTimersByTime(RELOCK_AFTER_MS);
    setVisibility('visible');
    expect(service.locked()).toBe(true);
  });

  it('forgets the lock when turned off', async () => {
    const service = await setup();
    await service.enable({ uid: 'admin-uid', email: 'me@example.com' });

    service.disable();

    expect(service.enabled()).toBe(false);
    expect(localStorage.getItem('app_lock_credential')).toBeNull();
    setVisibility('hidden');
    expect(service.covered()).toBe(false);
  });
});
