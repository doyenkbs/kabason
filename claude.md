# claude.md — kabason.com

This folder inherits the workspace rules in [CLAUDE.md](../CLAUDE.md), with these local overrides.
Where they conflict, this file wins.

- **Only `public/` ships.** Cloudflare Pages publishes that folder. Notes and scripts stay at the root.
- **No Tailwind, no web fonts, no placehold.co, no CDN, no third-party anything.** Hand-written CSS in
  `public/css/site.css` with system font stacks. Every colour is a custom property on `:root`, with
  dark values under `prefers-color-scheme`. `check.mjs` reads those blocks to test contrast.
- **No inline styles or scripts.** The CSP in `public/_headers` blocks them. The only JS is the theme
  switch in `public/js/`. `theme-init.js` must stay a blocking script first in `<head>`, never
  `defer` or `async`, or the wrong theme flashes. Dark tokens live in two CSS blocks (device dark,
  chosen dark) that must stay identical; `check.mjs` fails if they drift.
- **No forms or input fields, and no login handling.** Links only. Never link or redirect to an
  Authentik login or authorize URL; only `https://authentik.kabason.net/if/user/`.
- **No redirects:** no `_redirects`, no meta refresh, no JS redirects.
- **The envelope animation loops** (9s cycle, CSS only). Every looping animation must keep the same
  duration so they stay in step, and the "Stop animation" button (`js/envelope.js`) must stay: WCAG
  2.2.2 requires a way to stop motion that runs longer than 5 seconds.
- **Tone:** business, not family or homelab, even though members are family and friends.
- **Privacy:** `noindex` on every page, `robots.txt` disallows all. No names of children, photos of
  people, school, location, or schedule details.
- **External links** are exactly the allowed list in `check.mjs` and carry `rel="noopener"`.
- **Mail app steps** come from the vendor's own support page (Apple, Google, Microsoft, Mozilla).
  If a menu path cannot be confirmed there, do not guess it.
- **Do not touch** DNS, Cloudflare settings, the Pages project, or any subdomain.
- **Preview:** `node serve.mjs 8091 public`, then `node check.mjs`. Screenshot with `node screenshot.mjs`.
