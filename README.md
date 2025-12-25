![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)
![GitHub Repo Size](https://img.shields.io/github/repo-size/doyenkbs/kabason)
![GitHub Last Commit](https://img.shields.io/github/last-commit/doyenkbs/kabason)

# KABASON Utility Suite

**KABASON Utility Suite** is a modular, browser-based collection of precision tools built to streamline **data processing**, **validation**, and **transformation** workflows. Each tool loads dynamically into a consistent UI, keeping the codebase clean, fast, and easy to extend.

**Live Site:** https://kabason.com

---

## 🚀 Highlights

- **Modular architecture** (each tool has its own HTML/CSS/JS)
- **Dynamic tool loading** (fast UI, clean separation of concerns)
- **Consistent UX** (shared layout, dark/light theme, standardized buttons)
- **CSV/XLSX support** via **XLSX.js**
- **Cloudflare Pages deployment** with auto-updates on push

---

## 🧰 Included Tools

### 1) List Comparison Tool
- Compare two datasets
- Remove duplicates
- Ignore blank lines
- Case-insensitive matching
- CSV/XLSX column extraction
- Side-by-side comparison results

### 2) Regex Formatter
- Convert hostnames into clean, environment-ready regex
- Escape special characters
- Extract base names
- CSV/XLSX column extraction
- Copy / download output

### 3) Cron Scheduler & Expression Builder
A cron utility for building, interpreting, validating, and previewing cron expressions.

**Features**
- Plain-English → Cron (e.g., “weekday at 09:00”, “every 15 minutes”)
- Field generator (minutes, hours, DOM, month, DOW)
- Parser output (human-readable)
- Next run times (browser timezone)
- Validator (Linux-style 5-field cron)

### 4) IP Networking Tool
- IPv4 Subnet & CIDR calculator (network/broadcast, usable hosts, first/last host)
- Public/Private + IPv6 classification (version, type, special range)
- IP geolocation lookup (ISP/ASN, city/region, lat/long, timezone)
- Quick Calculate/Clear actions

### 5) JSON → CSV / Table Converter (NEW)
Convert raw JSON payloads into clean, exportable CSV with a searchable table preview.

**Features**
- Paste or upload JSON (array or object)
- Optional **Root Path** selection (e.g., `users`, `data.items`)
- Flatten nested keys into dotted columns
- Array handling:
  - Join values with custom separator
  - Index keys (optional)
- Searchable **Table Preview**
- Copy / download CSV output

### 6) CSV → JSON Converter (NEW)
Convert CSV (Excel exports) into structured JSON for APIs, configs, and automation.

**Features**
- Paste or upload CSV
- Delimiter support (auto / comma / semicolon / tab / pipe)
- Headers on/off
- Type inference toggle (numbers/booleans, preserves padded IDs like `001`)
- Dot-notation headers → nested JSON (optional)
- Output modes:
  - Array of objects
  - Object keyed by a selected column
- JSON formatting (indent/minify)
- Copy / download JSON output (from the output panel)

---

## 🧱 Tech Stack

- **HTML / CSS / JavaScript**
- **Cloudflare Pages** (deployment)
- **GitHub** (version control)
- **XLSX.js** (CSV/XLSX parsing)

---

## ✅ Project Structure

```text
kabason-utility-suite/
│
├── index.html
│
├── assets/
│   ├── css/
│   │   ├── global.css
│   │   ├── landing.css
│   │   ├── list-tool.css
│   │   ├── regex-tool.css
│   │   ├── cron-tool.css
│   │   ├── ip-tool.css
│   │   ├── json-to-csv.css
│   │   └── csv-to-json.css
│   │
│   ├── js/
│   │   ├── global.js
│   │   ├── list-tool.js
│   │   ├── regex-tool.js
│   │   ├── cron-tool.js
│   │   ├── ip-tool.js
│   │   ├── json-to-csv.js
│   │   └── csv-to-json.js
│   │
│   └── img/
│       ├── logo.png
│       └── favicon.ico   (optional)
│
├── tools/
│   ├── list-tool.html
│   ├── regex-tool.html
│   ├── cron-tool.html
│   ├── ip-tool.html
│   ├── json-to-csv.html
│   └── csv-to-json.html
│
├── README.md
└── LICENSE

## 🌐 Deployment

This project is deployed using **Cloudflare Pages** and automatically updates on every push to the `main` branch.

## 📊 Analytics

**Cloudflare Web Analytics** is enabled to provide privacy-friendly insights into usage patterns without tracking users.

## 🛠️ Future Enhancements

- Additional tools (log parser, hash generator, unit converter, etc.)
- Global search across tools
- User preferences (persisted theme, tool settings)
- Tool-specific documentation pages

## ✅ License (MIT)


MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including, without limitation, the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## © 2025 KABASON — Empowering Through Service
::contentReference[oaicite:0]{index=0}
