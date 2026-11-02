// Creates src/environments/environment.ts at build time on hosts like Vercel, where the
// file is not in git. Set FIREBASE_API_KEY in the host's environment variables.
// Locally, an existing environment.ts is left alone when the variable is not set.
const fs = require('fs');
const path = require('path');

const outFile = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
const apiKey = process.env.FIREBASE_API_KEY;

if (apiKey) {
  const content = `export const environment = {\n  production: true,\n  apiKey: ${JSON.stringify(apiKey)},\n};\n`;
  fs.writeFileSync(outFile, content, 'utf8');
} else if (!fs.existsSync(outFile)) {
  console.error(
    'Missing src/environments/environment.ts. Set the FIREBASE_API_KEY environment variable to generate it.',
  );
  process.exit(1);
}
