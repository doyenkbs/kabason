function initListTool() {
  
  /* ---------------------------------------
   Helper / Guard (place at the TOP)
   --------------------------------------- */
  function mustGet(id) {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`[ListTool] Missing element: #${id}`);
    }
    return el;
  }

  const listAEl = document.getElementById("listA");
  const listBEl = document.getElementById("listB");

  const fileA = document.getElementById("fileA");
  const fileB = document.getElementById("fileB");
  const columnA = document.getElementById("columnA");
  const columnB = document.getElementById("columnB");
  const fileAInfo = document.getElementById("fileAInfo");
  const fileBInfo = document.getElementById("fileBInfo");

  /* Load CSV/XLSX into List A */
  fileA.addEventListener("change", async () => {
    const file = fileA.files[0];
    if (!file) return;

    const { headers, bodyRows } = await parseFileToColumnData(file);

    columnA.innerHTML = "<option value=''>Select column…</option>";
    headers.forEach((h, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = h;
      columnA.appendChild(opt);
    });

    columnA.selectedIndex = 1;
    listAEl.value = cleanList(bodyRows.map(r => r[0])).join("\n");
    fileAInfo.textContent = `${bodyRows.length} rows, ${headers.length} columns`;

    columnA.onchange = () => {
      const idx = parseInt(columnA.value, 10);
      listAEl.value = cleanList(bodyRows.map(r => r[idx])).join("\n");
    };
  });

  /* Load CSV/XLSX into List B */
  fileB.addEventListener("change", async () => {
    const file = fileB.files[0];
    if (!file) return;

    const { headers, bodyRows } = await parseFileToColumnData(file);

    columnB.innerHTML = "<option value=''>Select column…</option>";
    headers.forEach((h, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = h;
      columnB.appendChild(opt);
    });

    columnB.selectedIndex = 1;
    listBEl.value = cleanList(bodyRows.map(r => r[0])).join("\n");
    fileBInfo.textContent = `${bodyRows.length} rows, ${headers.length} columns`;

    columnB.onchange = () => {
      const idx = parseInt(columnB.value, 10);
      listBEl.value = cleanList(bodyRows.map(r => r[idx])).join("\n");
    };
  });

  /* Trim & Clean buttons */
  function trimClean(textarea) {
    textarea.value = cleanList(textarea.value.split(/[\r\n]+/)).join("\n");
  }
  document.getElementById("cleanA").onclick = () => trimClean(listAEl);
  document.getElementById("cleanB").onclick = () => trimClean(listBEl);

  
// Clear A / Clear B handlers
document.getElementById("clearA").onclick = () => {
  const listAEl = document.getElementById("listA");
  if (listAEl) listAEl.value = "";
};

document.getElementById("clearB").onclick = () => {
  const listBEl = document.getElementById("listB");
  if (listBEl) listBEl.value = "";
};


// --- Full reset for List A (textarea + upload) ---
document.getElementById("clearA").onclick = () => {
  const listAEl   = document.getElementById("listA");
  const fileA     = document.getElementById("fileA");
  const columnA   = document.getElementById("columnA");
  const fileAInfo = document.getElementById("fileAInfo");

  // 1) Clear textarea
  if (listAEl) listAEl.value = "";

  // 2) Clear file input
  if (fileA) fileA.value = "";

  // 3) Reset column select (back to placeholder)
  if (columnA) {
    columnA.innerHTML = ""; // wipe options
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Select column…";
    columnA.appendChild(opt);
    columnA.selectedIndex = 0;
  }

  // 4) Clear file info label
  if (fileAInfo) fileAInfo.textContent = "";
};

// --- Full reset for List B (textarea + upload) ---
document.getElementById("clearB").onclick = () => {
  const listBEl   = document.getElementById("listB");
  const fileB     = document.getElementById("fileB");
  const columnB   = document.getElementById("columnB");
  const fileBInfo = document.getElementById("fileBInfo");

  if (listBEl) listBEl.value = "";
  if (fileB) fileB.value = "";

  if (columnB) {
    columnB.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Select column…";
    columnB.appendChild(opt);
    columnB.selectedIndex = 0;
  }

  if (fileBInfo) fileBInfo.textContent = "";
};


  /* Compare Lists */
  document.getElementById("compareBtn").onclick = () => {
    const opts = {
      caseInsensitive: document.getElementById("caseInsensitive").checked,
      removeDuplicates: document.getElementById("removeDuplicates").checked,
      ignoreBlanks: document.getElementById("ignoreBlanks").checked,
      stripWhitespace: document.getElementById("stripWhitespace").checked
    };

    let listA = listAEl.value.split(/[\r\n,]+/);
    let listB = listBEl.value.split(/[\r\n,]+/);

    if (opts.stripWhitespace) {
      listA = listA.map(x => x.trim());
      listB = listB.map(x => x.trim());
    }
    if (opts.ignoreBlanks) {
      listA = listA.filter(x => x.length);
      listB = listB.filter(x => x.length);
    }
    if (opts.caseInsensitive) {
      listA = listA.map(x => x.toLowerCase());
      listB = listB.map(x => x.toLowerCase());
    }
    if (opts.removeDuplicates) {
      listA = Array.from(new Set(listA));
      listB = Array.from(new Set(listB));
    }

    const setA = new Set(listA);
    const setB = new Set(listB);

    const both = cleanList(listA.filter(i => setB.has(i)));
    const onlyA = cleanList(listA.filter(i => !setB.has(i)));
    const onlyB = cleanList(listB.filter(i => !setA.has(i)));

    document.getElementById("bothOutput").innerText = both.join("\n");
    document.getElementById("onlyAOutput").innerText = onlyA.join("\n");
    document.getElementById("onlyBOutput").innerText = onlyB.join("\n");

    document.getElementById("bothCount").innerText = `${both.length} item(s) in both lists`;
    document.getElementById("onlyACount").innerText = `${onlyA.length} item(s) only in List A`;
    document.getElementById("onlyBCount").innerText = `${onlyB.length} item(s) only in List B`;
  };

  /* Clear All */
  document.getElementById("clearAllBtn").onclick = () => {
    if (!confirm("Reset List Comparison Tool?")) return;

    listAEl.value = "";
    listBEl.value = "";
    fileA.value = "";
    fileB.value = "";
    columnA.innerHTML = "<option value=''>Select column…</option>";
    columnB.innerHTML = "<option value=''>Select column…</option>";
    fileAInfo.textContent = "";
    fileBInfo.textContent = "";

    ["caseInsensitive", "removeDuplicates", "ignoreBlanks", "stripWhitespace"]
      .forEach(id => document.getElementById(id).checked = false);

    ["bothOutput", "onlyAOutput", "onlyBOutput"].forEach(id => {
      document.getElementById(id).innerText = "";
    });
    ["bothCount", "onlyACount", "onlyBCount"].forEach(id => {
      document.getElementById(id).innerText = "";
    });
  };

  
// === Standardize result actions (Copy / Download / Clear) ===
(function wireResultActions() {
  const scope = document.getElementById("listTool");
  if (!scope) return;

  // Copy buttons
  scope.querySelectorAll("[data-copy]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.copy;
      const el = document.getElementById(id);
      const text = el ? el.innerText : "";
      if (!text) return alert("Nothing to copy.");
      navigator.clipboard.writeText(text)
        .then(() => alert("Copied!"))
        .catch(() => {
          // Fallback
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          alert("Copied!");
        });
    });
  });

  // Download buttons
  scope.querySelectorAll("[data-download]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.download;
      const fn = btn.dataset.fn || "list.txt";
      const el = document.getElementById(id);
      const text = el ? el.innerText : "";
      if (!text) return alert("Nothing to download.");
      // Uses downloadText from global.js
      downloadText(text, fn);
    });
  });

  // Per-result Clear buttons
  scope.querySelectorAll("[data-clear]").forEach(btn => {
    btn.addEventListener("click", () => {
      const outId = btn.dataset.clear;
      const countId = btn.dataset.clearcount;
      const outEl = document.getElementById(outId);
      const countEl = document.getElementById(countId);
      if (outEl) outEl.innerText = "";
      if (countEl) countEl.innerText = "";
    });
  });
})();

}
