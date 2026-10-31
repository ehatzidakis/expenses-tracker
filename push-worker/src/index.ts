import { buildPushPayload, type PushSubscription } from '@block65/webcrypto-web-push';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Secrets aren't in wrangler.jsonc, so the generated Env type doesn't know about them.
declare global {
  interface Env {
    VAPID_PRIVATE_KEY: string;
  }
}

// Google's public keys for Firebase sign-in tokens. jose caches them between requests.
const firebaseKeys = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
);

const SUBSCRIPTION_PREFIX = 'sub:';
const MAX_BODY_LENGTH = 180;

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface Caller {
  uid: string;
  isAdmin: boolean;
  canNotify: boolean;
}

interface StoredSubscription {
  subscription: PushSubscription;
  uid: string;
  createdAt: string;
  userAgent: string | null;
}

interface SendResult {
  sent: number;
  removed: number;
  failed: number;
}

export default {
  async fetch(request, env): Promise<Response> {
    const cors = corsHeaders(request.headers.get('Origin'), env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    let response: Response;
    try {
      response = await route(request, env);
    } catch (error) {
      if (error instanceof HttpError) {
        response = json({ error: error.message }, error.status);
      } else {
        console.error(error);
        response = json({ error: 'Something went wrong' }, 500);
      }
    }

    for (const [name, value] of Object.entries(cors)) {
      response.headers.set(name, value);
    }
    return response;
  },
} satisfies ExportedHandler<Env>;

async function route(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);
  const key = `${request.method} ${pathname}`;

  switch (key) {
    case 'GET /':
      return json({ ok: true });

    case 'GET /vapid-public-key':
      return json({ publicKey: env.VAPID_PUBLIC_KEY });

    case 'POST /subscribe': {
      const caller = await authenticate(request, env);
      requireAdmin(caller);
      const subscription = parseSubscription(await readJson(request));
      const stored: StoredSubscription = {
        subscription,
        uid: caller.uid,
        createdAt: new Date().toISOString(),
        userAgent: request.headers.get('User-Agent'),
      };
      await env.SUBSCRIPTIONS.put(await storageKey(subscription.endpoint), JSON.stringify(stored));
      return json({ ok: true });
    }

    case 'POST /unsubscribe': {
      const caller = await authenticate(request, env);
      requireAdmin(caller);
      const body = await readJson(request);
      const endpoint = typeof body['endpoint'] === 'string' ? body['endpoint'] : '';
      if (!endpoint) throw new HttpError(400, 'Missing endpoint');
      await env.SUBSCRIPTIONS.delete(await storageKey(endpoint));
      return json({ ok: true });
    }

    case 'POST /test': {
      const caller = await authenticate(request, env);
      requireAdmin(caller);
      const result = await sendToAll(env, {
        title: 'Test notification',
        body: 'Notifications are working.',
      });
      return json(result);
    }

    case 'POST /notify': {
      const caller = await authenticate(request, env);
      if (!caller.canNotify) throw new HttpError(403, 'This account cannot send notifications');
      const body = await readJson(request);
      const text = typeof body['body'] === 'string' ? body['body'].trim() : '';
      const result = await sendToAll(env, {
        title: 'New pending transaction',
        body: text ? text.slice(0, MAX_BODY_LENGTH) : 'Tap to review it.',
      });
      return json(result);
    }

    default:
      throw new HttpError(404, 'Not found');
  }
}

// ---- Auth ----

async function authenticate(request: Request, env: Env): Promise<Caller> {
  const match = /^Bearer (.+)$/.exec(request.headers.get('Authorization') ?? '');
  if (!match) throw new HttpError(401, 'Missing sign-in token');

  let uid: string | undefined;
  try {
    const { payload } = await jwtVerify(match[1], firebaseKeys, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
      algorithms: ['RS256'],
    });
    uid = payload.sub;
  } catch {
    throw new HttpError(401, 'Invalid or expired sign-in token');
  }
  if (!uid) throw new HttpError(401, 'Invalid sign-in token');

  const isAdmin = uid === env.ADMIN_UID;
  return { uid, isAdmin, canNotify: isAdmin || splitList(env.NOTIFY_UIDS).includes(uid) };
}

function requireAdmin(caller: Caller): void {
  if (!caller.isAdmin) throw new HttpError(403, 'Only the admin account can do this');
}

// ---- Sending ----

async function sendToAll(
  env: Env,
  notification: { title: string; body: string },
): Promise<SendResult> {
  const vapid = {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  };
  const result: SendResult = { sent: 0, removed: 0, failed: 0 };

  const { keys } = await env.SUBSCRIPTIONS.list({ prefix: SUBSCRIPTION_PREFIX });

  await Promise.all(
    keys.map(async ({ name }) => {
      const stored = await env.SUBSCRIPTIONS.get<StoredSubscription>(name, 'json');
      if (!stored) return;

      try {
        const payload = await buildPushPayload(
          {
            data: angularNotification(notification),
            options: { ttl: 60 * 60 * 24, urgency: 'high' },
          },
          stored.subscription,
          vapid,
        );
        const res = await fetch(stored.subscription.endpoint, payload);

        if (res.ok) {
          result.sent++;
        } else if (res.status === 404 || res.status === 410) {
          // The phone dropped this subscription (app removed, permission revoked).
          await env.SUBSCRIPTIONS.delete(name);
          result.removed++;
        } else {
          console.error('Push rejected', res.status, await res.text());
          result.failed++;
        }
      } catch (error) {
        console.error('Push failed', error);
        result.failed++;
      }
    }),
  );

  return result;
}

// Angular's service worker shows a push only if it has this shape.
// Tapping the notification focuses the open app, or opens it.
function angularNotification({ title, body }: { title: string; body: string }) {
  return {
    notification: {
      title,
      body,
      icon: '/icons/icon-192x192.png',
      data: {
        onActionClick: {
          default: { operation: 'navigateLastFocusedOrOpen', url: '/' },
        },
      },
    },
  };
}

// ---- Helpers ----

function parseSubscription(body: Record<string, unknown>): PushSubscription {
  const sub = body['subscription'] as Partial<PushSubscription> | undefined;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;

  if (
    typeof endpoint !== 'string' ||
    !endpoint.startsWith('https://') ||
    typeof p256dh !== 'string' ||
    typeof auth !== 'string'
  ) {
    throw new HttpError(400, 'Invalid push subscription');
  }

  return { endpoint, expirationTime: sub?.expirationTime ?? null, keys: { p256dh, auth } };
}

// Endpoints are long URLs, so store them under a short hash.
async function storageKey(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return SUBSCRIPTION_PREFIX + hex;
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === 'object') return body as Record<string, unknown>;
  } catch {
    // fall through
  }
  throw new HttpError(400, 'Request body must be JSON');
}

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  if (!origin || !splitList(env.ALLOWED_ORIGINS).includes(origin)) {
    return { Vary: 'Origin' };
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
