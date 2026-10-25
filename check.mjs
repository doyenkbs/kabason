// Checks public/ against the site's rules. Plain Node, no dependencies.
//
//   node serve.mjs 8091 public      (in another terminal, for part 2)
//   node check.mjs
//
// 1. Static, over every file in public/:
//    - every internal href/src points at a file in public/
//    - every external link is one of the allowed URLs and has rel="noopener"
//    - no forms, inputs, inline styles, scripts, meta refresh, _redirects,
//      or mention of itkab
//    - robots noindex on every page; _headers and robots.txt as specified
//    - WCAG AA contrast for the colour pairings in css/site.css, both modes
// 2. In headless Chrome against the running preview (skipped if it is not up):
//    - no request to any other host, no CSP violation
//    - no horizontal overflow at 390px, light and dark

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PUB = join(ROOT, 'public');
const BASE = process.env.BASE || 'http://localhost:8091';

const ALLOWED_EXTERNAL = new Set([
  'https://webmail.kabason.com',
  'https://authentik.kabason.net/if/user/',
  'https://mail.kabason.com/account',
  'mailto:support@kabason.com',
]);

const HEADERS = `/*
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
`;
const ROBOTS = 'User-agent: *\nDisallow: /\n';

let fails = 0;
function check(label, ok, detail) {
  if (!ok) fails++;
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + '  ' + label + (detail ? '   [' + detail + ']' : ''));
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}
const isFile = (p) => stat(p).then((s) => s.isFile(), () => false);
const rel = (p) => relative(PUB, p).split(sep).join('/');

async function resolveLocal(ref, fromFile) {
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean) return true;
  let target = clean.startsWith('/') ? join(PUB, clean) : join(dirname(fromFile), clean);
  if (relative(PUB, target).startsWith('..')) return false;
  if (clean.endsWith('/')) target = join(target, 'index.html');
  return isFile(target);
}

/* --- 1. Static -------------------------------------------------------------- */

console.log('\n1. Static checks over public/');
const files = await walk(PUB);
const pages = files.filter((f) => f.endsWith('.html'));

check('_headers is exactly as specified', (await readFile(join(PUB, '_headers'), 'utf8')) === HEADERS);
check('robots.txt disallows everything', (await readFile(join(PUB, 'robots.txt'), 'utf8')) === ROBOTS);
check('no _redirects file', !existsSync(join(PUB, '_redirects')) && !existsSync(join(ROOT, '_redirects')));
check('pages: index, mail, 404', ['index.html', 'mail/index.html', '404.html'].every((p) => pages.map(rel).includes(p)), pages.map(rel).join(', '));

for (const f of files) {
  if (!/\.(html|css|svg|txt)$/.test(f) && !f.endsWith('_headers')) continue;
  const text = await readFile(f, 'utf8');
  check(rel(f) + ': no mention of itkab', !/itkab/i.test(text));
}

for (const page of pages) {
  const name = rel(page);
  const html = await readFile(page, 'utf8');
  check(name + ': robots noindex', html.includes('<meta name="robots" content="noindex">'));
  check(name + ': no form or input fields', !/<(form|input|textarea|select)\b/i.test(html));
  const buttons = [...html.matchAll(/<button\b[^>]*>/gi)].map((m) => m[0]);
  check(name + ': only type="button" buttons', buttons.every((b) => /\stype="button"/.test(b)));
  check(name + ': no inline style', !/\sstyle\s*=|<style\b/i.test(html));
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  check(name + ': scripts are only /js/ files, never inline',
    scripts.every((m) => /\ssrc="\/js\/[a-z-]+\.js"/.test(m[1]) && !m[2].trim()), scripts.length + ' scripts');
  check(name + ': theme-init.js is in <head>, blocking, before the stylesheet',
    /<head>[\s\S]*?<script src="\/js\/theme-init\.js"><\/script>[\s\S]*?<link rel="stylesheet"[\s\S]*?<\/head>/.test(html));
  check(name + ': no inline handlers or javascript: URLs', !/\son[a-z]+\s*=\s*["']|javascript:/i.test(html));
  check(name + ': no meta refresh', !/http-equiv\s*=\s*["']?refresh/i.test(html));

  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const tag = m[0];
    const href = (/\shref="([^"]*)"/.exec(tag) || [])[1];
    if (href == null) continue;
    if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(href)) {
      check(name + ': external link allowed: ' + href, ALLOWED_EXTERNAL.has(href));
      if (!href.startsWith('mailto:')) check(name + ': rel="noopener" on ' + href, /\srel="[^"]*\bnoopener\b[^"]*"/.test(tag));
    } else {
      check(name + ': internal link resolves: ' + href, await resolveLocal(href, page));
    }
  }
  for (const m of html.matchAll(/<(?:link|img|source)\b[^>]*\s(?:href|src)="([^"]*)"/gi)) {
    check(name + ': asset resolves: ' + m[1], !/^[a-z]+:|^\/\//i.test(m[1]) && (await resolveLocal(m[1], page)));
  }
}

/* --- Contrast ---------------------------------------------------------------- */

const css = await readFile(join(PUB, 'css/site.css'), 'utf8');
function between(start, end) {
  const a = css.indexOf('/* tokens:' + start + ' */');
  const b = css.indexOf('/* tokens:' + end + ' */');
  return a === -1 || b === -1 ? '' : css.slice(a, b);
}
function vars(block) {
  const out = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)) out[m[1]] = m[2];
  return out;
}
const dark = vars(between('dark', 'light'));
const light = { ...dark, ...vars(between('light', 'end')) };
check('css: dark (default) and light token blocks found', Object.keys(dark).length > 10 && Object.keys(vars(between('light', 'end'))).length > 10);
check('css: the light block sets every dark colour', Object.keys(dark).every((k) => k in vars(between('light', 'end'))));
check('css: no prefers-color-scheme rule (dark is the default for everyone)', !/prefers-color-scheme/.test(css));

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground, background, minimum]. 4.5 for text, 3 for focus rings and UI.
const SURFACES = ['bg', 'band', 'surface', 'surface-2', 'cream'];
const PAIRS = [
  ...SURFACES.flatMap((bg) => [['ink', bg, 4.5], ['muted', bg, 4.5], ['link', bg, 4.5], ['focus', bg, 3]]),
  ['on-accent', 'accent', 4.5], ['on-accent', 'accent-hover', 4.5], ['on-accent', 'flap', 4.5],
  // --spark-ink: the orange eyebrow labels. --spark itself is decoration only.
  ['spark-ink', 'bg', 4.5], ['spark-ink', 'band', 4.5], ['spark-ink', 'surface', 4.5],
  ['accent', 'surface', 3], ['accent', 'band', 3],
];
console.log('\n   Contrast (WCAG AA)');
for (const [mode, v] of [['light', light], ['dark', dark]]) {
  for (const [fg, bg, min] of PAIRS) {
    if (!v[fg] || !v[bg]) { check(`${mode} --${fg} on --${bg}`, false, 'missing token'); continue; }
    const r = ratio(v[fg], v[bg]);
    check(`${mode} --${fg} on --${bg}`, r >= min, r.toFixed(2) + ':1, needs ' + min);
  }
}

/* --- 2. Browser -------------------------------------------------------------- */

const up = await fetch(BASE + '/').then((r) => r.ok, () => false);
if (!up) {
  console.log(`\n2. Browser checks skipped: nothing answering at ${BASE}`);
  fails++;
} else {
  await browserChecks();
}

console.log('\n' + (fails ? fails + ' FAILURES' : 'all checks pass'));
process.exit(fails ? 1 : 0);

async function browserChecks() {
  const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(existsSync);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const port = 9300 + Math.floor(Math.random() * 300);
  const profile = mkdtempSync(join(tmpdir(), 'kabason-check-'));
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', '--user-data-dir=' + profile, '--remote-debugging-port=' + port, 'about:blank'],
    { stdio: ['ignore', 'pipe', 'pipe'] });
  let wsUrl = null;
  chrome.stderr.on('data', (b) => { const hit = b.toString().match(/ws:\/\/[^\s]+/); if (hit && !wsUrl) wsUrl = hit[0]; });

  try {
    for (let i = 0; i < 100 && !wsUrl; i++) await sleep(100);
    const ws = new WebSocket(wsUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0;
    const waiters = new Map();
    ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id); } };
    const raw = (method, params, sessionId) => {
      const mid = ++id;
      ws.send(JSON.stringify({ id: mid, method, params: params || {}, ...(sessionId ? { sessionId } : {}) }));
      return new Promise((r) => waiters.set(mid, r));
    };
    const t = await raw('Target.createTarget', { url: 'about:blank' });
    const sid = (await raw('Target.attachToTarget', { targetId: t.result.targetId, flatten: true })).result.sessionId;
    const send = (m, p) => raw(m, p, sid);
    const evalIn = async (e) => ((await send('Runtime.evaluate', { expression: e, returnByValue: true })).result.result || {}).value;

    await send('Page.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: "window.__csp=[];document.addEventListener('securitypolicyviolation',function(e){window.__csp.push(e.violatedDirective+' '+e.blockedURI)});",
    });

    const load = async (path, width, scheme) => {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
      await send('Page.navigate', { url: BASE + path });
      for (let i = 0; i < 50 && (await evalIn('document.readyState')) !== 'complete'; i++) await sleep(100);
      await sleep(250);
    };

    console.log('\n2. Browser checks at ' + BASE);
    const host = new URL(BASE).host;
    for (const path of ['/', '/mail/', '/404.html', '/no-such-page']) {
      await load(path, 1280, 'light');
      const foreign = await evalIn(`JSON.stringify(performance.getEntriesByType("resource").map(e => new URL(e.name).host).filter(h => h !== ${JSON.stringify(host)}))`);
      check(path + ': no request to another host', foreign === '[]', foreign);
      const csp = await evalIn('JSON.stringify(window.__csp)');
      check(path + ': no CSP violation', csp === '[]', csp);
      // Device light and dark with no saved choice, then a forced choice
      // against the opposite device setting.
      for (const [scheme, forced] of [['light', null], ['dark', null], ['dark', 'light'], ['light', 'dark']]) {
        await load(path, 390, scheme);
        await evalIn(forced ? `localStorage.setItem("theme", "${forced}")` : 'localStorage.removeItem("theme")');
        await load(path, 390, scheme);
        await evalIn('document.querySelectorAll("details").forEach(d => d.open = true)');
        const w = await evalIn('Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)');
        check(`${path}: no overflow at 390px, device ${scheme}${forced ? ', chosen ' + forced : ''}`, w <= 390, w + 'px');
      }
      await evalIn('localStorage.removeItem("theme")');
    }

    console.log('\n   Theme button');
    const bg = () => evalIn('getComputedStyle(document.body).backgroundColor');
    await load('/', 1280, 'light');
    await evalIn('localStorage.removeItem("theme")');
    await load('/', 1280, 'light');
    // Dark is the default for everyone: test on a device set to LIGHT.
    check('button is shown when JS runs', await evalIn('!document.getElementById("theme-toggle").hidden'));
    check('no saved choice on a light device: still dark (no data-theme)', (await evalIn('document.documentElement.getAttribute("data-theme")')) === null);
    const darkBg = await bg();
    check('dark colours on a light device', darkBg === 'rgb(23, 36, 51)', darkBg);
    check('button label offers light', (await evalIn('document.getElementById("theme-toggle").getAttribute("aria-label")')) === 'Switch to light theme');
    await evalIn('document.getElementById("theme-toggle").click()');
    await sleep(100);
    check('click switches to light and saves it', (await evalIn('document.documentElement.dataset.theme + "/" + localStorage.getItem("theme")')) === 'light/light');
    const lightBg = await bg();
    check('the page colours actually change', lightBg !== darkBg, darkBg + ' -> ' + lightBg);
    await load('/mail/', 1280, 'dark');
    check('the light choice holds on the next page, even on a dark device, set before paint',
      (await evalIn('document.documentElement.dataset.theme')) === 'light' && (await bg()) === lightBg);
    await evalIn('document.getElementById("theme-toggle").click()');
    await sleep(100);
    check('clicking back to dark clears the saved choice',
      (await evalIn('String(document.documentElement.getAttribute("data-theme")) + "/" + localStorage.getItem("theme")')) === 'null/null');
    await load('/', 1280, 'dark');
    check('no saved choice on a dark device: dark colours', (await bg()) === darkBg);
    await evalIn('localStorage.removeItem("theme")');

    console.log('\n   Envelope loop and its stop button (WCAG 2.2.2)');
    const cs = (sel, prop) => evalIn(`getComputedStyle(document.querySelector(${JSON.stringify(sel)})).${prop}`);
    await evalIn('localStorage.removeItem("envelope")');
    await load('/', 1280, 'light');
    check('the real card shows at once, before any fold', (await cs('.ac-real', 'opacity')) === '1');
    check('the loop repeats', (await cs('.ac-real', 'animationIterationCount')) === 'infinite' && (await cs('.plane', 'animationIterationCount')) === 'infinite');
    check('stop button is shown when JS runs', await evalIn('!document.getElementById("anim-toggle").hidden'));
    await evalIn('document.getElementById("anim-toggle").click()');
    await sleep(100);
    check('stop removes every animation',
      ['.ac-real', '.ac-sender', '.ac-sender .flap', '.ac-sender .ac-body', '.plane'].length ===
      (await evalIn(`['.ac-real', '.ac-sender', '.ac-sender .flap', '.ac-sender .ac-body', '.plane'].filter(s => getComputedStyle(document.querySelector(s)).animationName === 'none').length`)));
    check('stopped: real card showing, copy and plane hidden',
      (await cs('.ac-real', 'opacity')) === '1' && (await cs('.ac-sender', 'opacity')) === '0' && (await cs('.plane', 'opacity')) === '0');
    check('stopped: button says Play and is pressed',
      (await evalIn('document.getElementById("anim-toggle").getAttribute("aria-pressed") + "/" + document.querySelector(".anim-label").textContent')) === 'true/Play animation');
    await load('/', 1280, 'light');
    check('the stop is remembered on reload', await evalIn('document.getElementById("ac-stage").classList.contains("is-still")'));
    await evalIn('document.getElementById("anim-toggle").click()');
    await sleep(100);
    check('play restarts the loop and clears the saved choice',
      (await cs('.ac-real', 'animationName')) === 'real-cycle' && (await evalIn('localStorage.getItem("envelope")')) === null);
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await send('Page.reload');
    await sleep(800);
    check('reduced motion: no animation and no stop button',
      (await cs('.ac-real', 'animationName')) === 'none' && (await cs('#anim-toggle', 'display')) === 'none' && (await cs('.ac-sender', 'opacity')) === '0');
    await send('Emulation.setEmulatedMedia', { features: [] });
    await raw('Browser.close').catch(() => {});
  } catch (err) {
    check('browser driver', false, err.message);
  } finally {
    chrome.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* windows lock */ }
  }
}
