// Zero-dependency screenshots via headless Chrome.
// Usage: node screenshot.mjs <url> [label] [--width=1440] [--height=2400] [--wait=2500] [--flag ...]
// Saves to ./temporary screenshots/screenshot-N[-label].png (auto-incremented).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUT_DIR = join(ROOT, 'temporary screenshots');

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

const chrome = CHROME_CANDIDATES.find(existsSync);
if (!chrome) {
  console.error('No Chrome or Edge binary found.');
  process.exit(1);
}

const argv = process.argv.slice(2);
const opts = {};
const positional = [];
const passthrough = [];

for (const arg of argv) {
  const kv = arg.match(/^--(width|height|wait)=(\d+)$/);
  if (kv) {
    opts[kv[1]] = Number(kv[2]);
  } else if (arg.startsWith('--')) {
    passthrough.push(arg);
  } else {
    positional.push(arg);
  }
}

const [url, label] = positional;
if (!url) {
  console.error('Usage: node screenshot.mjs <url> [label] [--width=N] [--height=N]');
  process.exit(1);
}

const width = opts.width || 1440;
const height = opts.height || 2400;
const wait = opts.wait ?? 2500;

mkdirSync(OUT_DIR, { recursive: true });

// Find the next free index so nothing is ever overwritten.
const used = readdirSync(OUT_DIR)
  .map((f) => f.match(/^screenshot-(\d+)/))
  .filter(Boolean)
  .map((m) => Number(m[1]));
const next = (used.length ? Math.max(...used) : 0) + 1;

const name = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const out = join(OUT_DIR, name);

const profile = mkdtempSync(join(tmpdir(), 'shot-'));

try {
  execFileSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${profile}`,
      `--window-size=${width},${height}`,
      `--virtual-time-budget=${wait}`,
      `--screenshot=${out}`,
      ...passthrough,
      url,
    ],
    { stdio: 'pipe', timeout: 60000 }
  );
  console.log(`saved: temporary screenshots/${name}  (${width}x${height})`);
} catch (err) {
  console.error(`screenshot failed: ${err.message}`);
  process.exit(1);
} finally {
  rmSync(profile, { recursive: true, force: true });
}
