# kabason.com

Kabason Mail: the landing page and mail help page for members with @kabason.com
mailboxes. Plain HTML and CSS on Cloudflare Pages, no build step. The only JavaScript
is the light/dark theme switch and the envelope animation's stop button.

## What ships

Cloudflare Pages publishes `public/` and nothing else:

| Path | What it is |
|---|---|
| `public/index.html` | Home: Kabason Mail, welcome text, account card, how to get an address |
| `public/mail/index.html` | Webmail link, account links, mail app settings, step-by-step setup per app |
| `public/404.html` | Not-found page, served by Pages with status 404 |
| `public/css/site.css` | The only stylesheet; every colour is a custom property, light and dark |
| `public/js/theme-init.js` | Blocking, first in `<head>`: applies a saved theme choice before paint |
| `public/js/theme.js` | The theme button; follows the device until someone picks a theme |
| `public/js/envelope.js` | The "Stop animation" button for the looping envelope (WCAG 2.2.2) |
| `public/img/logo-mark.png` | The KABASON logo mark (header and envelope stamp), cropped from the full logo |
| `public/favicon.png`, `public/apple-touch-icon.png` | Browser tab and phone home-screen icons, from the same mark |
| `public/_headers` | CSP and security headers for every path |
| `public/robots.txt` | Disallows everything; every page also has `noindex` |

Everything at the repo root (this README, `claude.md`, `context.md`, the scripts) stays
out of the published site.

Pages settings: framework preset None, build command empty, build output directory `public`.

## What the site does not do

- It never handles a login. Webmail (Bulwark) sends people to Authentik itself. The
  site links only to the Authentik user dashboard for account management, never to a
  login or authorize URL.
- No forms, no inline scripts, no third-party fonts, CDNs or analytics. The CSP in
  `_headers` would block them anyway.
- No redirects of any kind.

## Local preview and checks

```
node serve.mjs 8091 public     # http://localhost:8091, applies _headers, 404s like Pages
node check.mjs                 # static rules, contrast, then browser checks against 8091
node screenshot.mjs http://localhost:8091/mail/ label
```

`check.mjs` fails on any internal link that does not resolve, any external link that is
not one of the allowed URLs, missing `rel="noopener"`, form fields, inline styles or
scripts, meta refresh, a `_redirects` file, missing `noindex`, the two dark token blocks
drifting apart, contrast below WCAG AA in either theme, a request to another host, a CSP
violation, horizontal overflow at 390px in any theme state, or a theme button that does
not switch, save, and clear its choice.

## Placeholders

Search for `PLACEHOLDER` in `public/`:

- the support address (home page twice, mail page once)
- the "Stay safe" promise on the home page: keep it only if it is true

The old tools site is in git history and in the `kabason.com-archived` folder.
