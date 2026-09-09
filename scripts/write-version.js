const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outFile = path.join(__dirname, '..', 'src', 'environments', 'version.ts');

function getGitVersion() {
  const shaFromEnv = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA;
  if (shaFromEnv) {
    return shaFromEnv.slice(0, 8);
  }

  try {
    const sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'pipe'] })
      .toString()
      .trim();

    if (sha) {
      const status = execSync('git status --porcelain', { stdio: ['ignore', 'pipe', 'pipe'] })
        .toString()
        .trim();

      return status ? `${sha}-dirty` : sha;
    }
  } catch {
    // Ignore and fall back to local-dev
  }

  return 'local-dev';
}

const version = getGitVersion();
const content = `export const APP_VERSION = '${version}';\n`;

fs.writeFileSync(outFile, content, 'utf8');
