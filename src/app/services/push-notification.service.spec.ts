import { TestBed } from '@angular/core/testing';
import { SwPush } from '@angular/service-worker';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import {
  PUSH_WORKER_URL,
  PushNotificationService,
  VAPID_PUBLIC_KEY,
} from './push-notification.service';

function fakeSubscription(endpoint = 'https://web.push.apple.com/abc') {
  return {
    endpoint,
    toJSON: () => ({ endpoint, keys: { p256dh: 'p', auth: 'a' } }),
  } as unknown as PushSubscription;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe('PushNotificationService', () => {
  let subscription$: BehaviorSubject<PushSubscription | null>;
  let swPush: {
    isEnabled: boolean;
    subscription: BehaviorSubject<PushSubscription | null>;
    requestSubscription: ReturnType<typeof vi.fn>;
    unsubscribe: ReturnType<typeof vi.fn>;
  };
  let fetchMock: ReturnType<typeof vi.fn>;

  function setup(options: { signedIn?: boolean } = {}) {
    const user =
      options.signedIn === false ? null : { getIdToken: vi.fn().mockResolvedValue('token-123') };

    TestBed.configureTestingModule({
      providers: [
        { provide: SwPush, useValue: swPush },
        { provide: AuthService, useValue: { user: () => user } },
      ],
    });
    return TestBed.inject(PushNotificationService);
  }

  beforeEach(() => {
    subscription$ = new BehaviorSubject<PushSubscription | null>(null);
    swPush = {
      isEnabled: true,
      subscription: subscription$,
      requestSubscription: vi.fn(async () => {
        const sub = fakeSubscription();
        subscription$.next(sub);
        return sub;
      }),
      unsubscribe: vi.fn(async () => subscription$.next(null)),
    };
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('PushManager', class {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('subscribes the phone and sends the subscription with the sign-in token', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    const service = setup();

    await service.enable();

    expect(swPush.requestSubscription).toHaveBeenCalledWith({ serverPublicKey: VAPID_PUBLIC_KEY });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${PUSH_WORKER_URL}/subscribe`);
    expect(init.headers.Authorization).toBe('Bearer token-123');
    expect(JSON.parse(init.body).subscription.endpoint).toBe('https://web.push.apple.com/abc');
    expect(service.status()).toBe('on');
  });

  it('undoes the local subscription when the server rejects it', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Only the admin account can do this' }, 403));
    const service = setup();

    await expect(service.enable()).rejects.toThrow('Only the admin account can do this');

    expect(swPush.unsubscribe).toHaveBeenCalled();
    expect(service.status()).toBe('off');
  });

  it('tells the server before unsubscribing', async () => {
    subscription$.next(fakeSubscription('https://web.push.apple.com/old'));
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    const service = setup();

    await service.disable();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${PUSH_WORKER_URL}/unsubscribe`);
    expect(JSON.parse(init.body)).toEqual({ endpoint: 'https://web.push.apple.com/old' });
    expect(swPush.unsubscribe).toHaveBeenCalled();
  });

  it('refuses to call the server when signed out', async () => {
    const service = setup({ signedIn: false });

    await expect(service.sendTest()).rejects.toThrow('signed out');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the amount, description and category for a new pending item', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ sent: 1, removed: 0, failed: 0 }));
    const service = setup();

    await service.notifyNewPending({
      amount: 12.5,
      description: ' Lidl ',
      category: 'Supermarket',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${PUSH_WORKER_URL}/notify`);
    expect(JSON.parse(init.body)).toEqual({ body: '€12.50 · Lidl · Supermarket' });
  });

  it('never throws when the pending notification fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = setup();

    await expect(
      service.notifyNewPending({ amount: 3, description: '', category: 'Coffee' }),
    ).resolves.toBeUndefined();
  });

  it('sends a request to the kiosk, leaving out an amount that is not filled in', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ sent: 1, removed: 0, failed: 0 }));
    const service = setup();

    await service.notifyKioskRequest({ amount: 0, description: 'Electricity', category: 'Bills' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${PUSH_WORKER_URL}/request`);
    expect(JSON.parse(init.body)).toEqual({ body: 'Electricity · Bills' });
  });

  it('tells the admin when the kiosk declines a request, with the reason', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ sent: 1, removed: 0, failed: 0 }));
    const service = setup();

    await service.notifyRequestDeclined(
      { amount: 20, description: 'Taxi', category: 'Transport' },
      ' Not mine ',
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${PUSH_WORKER_URL}/notify`);
    expect(JSON.parse(init.body)).toEqual({
      type: 'request-declined',
      body: 'Taxi · Transport — Not mine',
    });
  });

  it('reports unsupported when there is no service worker', () => {
    swPush.isEnabled = false;
    const service = setup();

    expect(service.status()).toBe('unsupported');
  });
});
