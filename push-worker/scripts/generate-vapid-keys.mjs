// Generates the VAPID key pair that signs push notifications.
// The private key is written to .dev.vars (git-ignored) and never printed.
// The public key is printed so it can go in wrangler.jsonc.
//
// Run once. New keys invalidate every existing phone subscription.
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const devVarsPath = fileURLToPath(new URL('../.dev.vars', import.meta.url));

if (existsSync(devVarsPath)) {
  console.error('.dev.vars already exists. Delete it first if you really want new keys.');
  console.error('New keys mean every phone has to enable notifications again.');
  process.exit(1);
}

const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
  'sign',
  'verify',
]);

const publicKey = Buffer.from(await crypto.subtle.exportKey('raw', keyPair.publicKey)).toString(
  'base64url',
);
const { d: privateKey } = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

writeFileSync(devVarsPath, `VAPID_PRIVATE_KEY=${privateKey}\n`);

console.log('Private key saved to .dev.vars');
console.log('Public key (put this in wrangler.jsonc as VAPID_PUBLIC_KEY):');
console.log(publicKey);
