![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)
![GitHub Repo Size](https://img.shields.io/github/repo-size/doyenkbs/kabason)
![GitHub Last Commit](https://img.shields.io/github/last-commit/doyenkbs/kabason)

# KABASON Utility Suite

The **Kabason Utility Suite** is a modular, browser‑based collection of precision tools designed to streamline data processing, validation, and transformation workflows. Each tool loads dynamically, ensuring fast performance, clean separation of logic, and effortless scalability as new utilities are added.

Live Site: **https://kabason.com**

---

## 🚀 Features

### ✅ Modular Architecture
Each tool is isolated into its own HTML, CSS, and JS files, dynamically loaded into the main interface. This keeps the codebase clean, scalable, and easy to maintain.

### ✅ Included Tools

#### **1. List Comparison Tool**
- Compare two datasets  
- Remove duplicates  
- Ignore blank lines  
- Case‑insensitive matching  
- CSV/XLSX column extraction  
- Side‑by‑side comparison results  

#### **2. Regex Formatter**
- Convert hostnames into clean, environment‑ready regex  
- Escape special characters  
- Extract base names  
- CSV/XLSX column extraction  
- Copy/download output  

#### **3. IP / CIDR Utility Tool**
- Validate IPs  
- Expand CIDR blocks  
- Collapse IP lists into minimal CIDRs  
- Sort, clean, and normalize lists  
- CSV/XLSX column extraction  
- Copy/download output  

---

## 🧱 Tech Stack

- **HTML / CSS / JavaScript**
- **Cloudflare Pages** (deployment)
- **GitHub** (version control)
- **XLSX.js** (CSV/XLSX parsing)

---

## 📦 Project Structure

kabason-utility-suite/ │ ├── index.html ├── assets/ │   ├── css/ │   ├── js/ │   └── img/ └── tools/ ├── list-tool.html ├── regex-tool.html └── new-tool.html
---

## ✅ Project Structure
kabason-utility-suite/
│
├── index.html
│
├── assets/
│   ├── css/
│   │   ├── global.css
│   │   ├── list-tool.css
│   │   ├── regex-tool.css
│   │   └── new-tool.css
│   │
│   ├── js/
│   │   ├── global.js
│   │   ├── list-tool.js
│   │   ├── regex-tool.js
│   │   └── new-tool.js
│   │
│   └── img/
│       ├── logo.png
│       └── favicon.ico   (optional)
│
├── tools/
│   ├── list-tool.html
│   ├── regex-tool.html
│   └── new-tool.html
│
├── README.md
└── LICENSE


---

## 🌐 Deployment

This project is deployed using **Cloudflare Pages** and automatically updates on every push to the `main` branch.

---

## 📊 Analytics

Cloudflare Web Analytics is enabled to provide privacy‑friendly insights into usage patterns without tracking users.

---

## 🛠️ Future Enhancements

- Additional tools (JSON formatter, log parser, hash generator, etc.)
- Global search across tools
- User preferences (persisted theme, settings)
- Tool‑specific documentation pages


---

# ✅ **LICENSE (MIT License)**

```text
MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including, without limitation, the rights  
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell  
copies of the Software, and to permit persons to whom the Software is  
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in  
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER  
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING  
FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OF OTHER  
DEALINGS IN THE SOFTWARE.

---

## © 2025 KABASON — Empowering Through Service


