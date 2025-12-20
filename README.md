# KABASON Utility Suite  
A modular, scalable collection of operational tools designed to support data accuracy, workflow efficiency, and technical clarity.

This suite is built with a **fully modular architecture**, allowing new tools to be added easily without modifying the core structure.

---

## ✅ Features

### **1. List Comparison Tool**
- Compare two lists
- Case-insensitive matching
- Remove duplicates
- Ignore blank lines
- Strip whitespace
- File upload (CSV/XLSX)
- Column selection
- Trim & Clean utilities

### **2. Regex Formatter Tool**
- Convert hostnames/FQDNs into Tanium-ready regex
- File upload + column selection
- Clean, escape, and format patterns

### **3. IP/CIDR Utility Tool**
- Validate IPs
- Expand CIDR blocks (all IPs or hosts only)
- Collapse IP lists into minimal CIDR ranges
- Sort, clean, dedupe
- File upload + column selection

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

## ✅ Adding a New Tool

1. Create three files:
'tools/my-tool.html assets/css/my-tool.css assets/js/my-tool.js'


2. Add a new tab in `index.html`:
```html
<div class="tab" data-target="myTool">My Tool</div>
```

3. Add a container:
```html
<div id="myTool" class="page"></div>
```

4. Load the tool:

```JavaScript
loadTool("myTool", "tools/my-tool.html");
```
That’s it — the suite automatically scales.

## ✅ Requirements
• 	Modern browser (Chrome, Edge, Firefox, Safari)
• 	No backend required — fully client-side
• 	Internet connection only needed for XLSX library CDN

## ✅ License
This project is licensed under the MIT License (see LICENSE file).

## ✅ Author
Christian Kaba


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



