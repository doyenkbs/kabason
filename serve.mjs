// Zero-dependency static server for local preview.
// Usage: node serve.mjs [port] [folder]
//   node serve.mjs 8091 public   the site, as Cloudflare Pages serves it
// Like Pages, it answers a missing path with 404.html (status 404) when the
// folder has one, and sends the "/*" headers from the folder's _headers file.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const ROOT = process.argv[3] ? resolvePath(HERE, process.argv[3]) + (process.platform === 'win32' ? '\\' : '/') : HERE;
const PORT = Number(process.argv[2]) || 8080;

// Only the "/*" block: the one the site uses. Re-read per request so an edit
// applies without a restart.
async function siteHeaders() {
  let text;
  try { text = await readFile(join(ROOT, '_headers'), 'utf8'); } catch { return {}; }
  const out = {};
  let inAll = false;
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    if (!/^\s/.test(raw)) { inAll = raw.trim() === '/*'; continue; }
    if (!inAll) continue;
    const at = raw.indexOf(':');
    if (at > 0) out[raw.slice(0, at).trim().toLowerCase()] = raw.slice(at + 1).trim();
  }
  return out;
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
};

async function resolve(pathname) {
  // Strip query/hash, decode, and block traversal above ROOT.
  const clean = normalize(decodeURIComponent(pathname.split('?')[0].split('#')[0]));
  let target = join(ROOT, clean);
  if (!target.startsWith(ROOT)) return null;

  try {
    const info = await stat(target);
    if (info.isDirectory()) target = join(target, 'index.html');
  } catch {
    // Allow extensionless routes to hit their .html file.
    if (!extname(target)) target += '.html';
  }

  try {
    await stat(target);
    return target;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const headers = await siteHeaders();
  const file = await resolve(req.url || '/');

  if (!file) {
    try {
      const page = await readFile(join(ROOT, '404.html'));
      res.writeHead(404, { ...headers, 'content-type': TYPES['.html'], 'cache-control': 'no-cache' });
      res.end(page);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
    }
    return;
  }

  try {
    const body = await readFile(file);
    res.writeHead(200, {
      ...headers,
      'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`500 ${err.message}`);
  }
}).listen(PORT, () => {
  console.log(`serving ${ROOT} at http://localhost:${PORT}`);
});
