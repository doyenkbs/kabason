
// assets/js/list-tool.js
// Kabason List Comparison Tool — explicit initializer + per-list counts

(function () {
  /**
   * Initialize the List Comparison Tool.
   * Call this AFTER the List Comparison markup is present in the DOM.
   * Returns true if wired, false if core elements missing.
   */
  function initListTool() {
    // --- Required core elements ---
    const listAEl = document.getElementById("listA");
    const listBEl = document.getElementById("listB");

    if (!listAEl || !listBEl) {
      console.warn("[ListTool] Missing #listA or #listB — init skipped.");
      return false;
    }

    // --- Optional / buttons / upload / results ---
    const fileA     = document.getElementById("fileA");
    const fileB     = document.getElementById("fileB");
    const columnA   = document.getElementById("columnA");
    const columnB   = document.getElementById("columnB");
    const fileAInfo = document.getElementById("fileAInfo");
    const fileBInfo = document.getElementById("fileBInfo");

    const cleanABtn   = document.getElementById("cleanA");
    const cleanBBtn   = document.getElementById("cleanB");
    const clearABtn   = document.getElementById("clearA");
    const clearBBtn   = document.getElementById("clearB");
    const compareBtn  = document.getElementById("compareBtn");
    const clearAllBtn = document.getElementById("clearAllBtn");

    const bothOutput  = document.getElementById("bothOutput");
    const onlyAOutput = document.getElementById("onlyAOutput");
    const onlyBOutput = document.getElementById("onlyBOutput");

    const bothCount   = document.getElementById("bothCount");
    const onlyACount  = document.getElementById("onlyACount");
    const onlyBCount  = document.getElementById("onlyBCount");

    const listACountSpan = document.getElementById("listACount");
    const listBCountSpan = document.getElementById("listBCount");

    // --- Helpers (keep same semantics as your tool) ---
    const splitLines = (text) =>
      String(text || "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n");

    const trimAndFilter = (lines) =>
      lines.map((l) => l.trim()).filter((l) => l.length > 0);

    function cleanList(arr) {
      return arr.map((x) => x.trim()).filter((x) => x.length);
    }

    function renderPerListCounts() {
      const aItems = trimAndFilter(splitLines(listAEl.value));
      const bItems = trimAndFilter(splitLines(listBEl.value));

      if (listACountSpan) {
        if (aItems.length > 0) {
          listACountSpan.textContent = `Items: ${aItems.length}`;
          listACountSpan.hidden = false;
        } else {
          listACountSpan.textContent = "";
          listACountSpan.hidden = true;
        }
      }
      if (listBCountSpan) {
        if (bItems.length > 0) {
          listBCountSpan.textContent = `Items: ${bItems.length}`;
          listBCountSpan.hidden = false;
        } else {
          listBCountSpan.textContent = "";
          listBCountSpan.hidden = true;
        }
      }
    }

    function trimClean(textarea) {
      textarea.value = cleanList(textarea.value.split(/[\r\n]+/)).join("\n");
    }

    // --- Upload: CSV/XLSX (uses external helper if available) ---
    fileA && fileA.addEventListener("change", async () => {
      const file = fileA.files?.[0];
      if (!file) return;

      if (typeof parseFileToColumnData !== "function") {
        console.warn("[ListTool] parseFileToColumnData() missing.");
        return;
      }

      const { headers, bodyRows } = await parseFileToColumnData(file);

      if (columnA) {
        columnA.innerHTML = "<option value=''>Select column…</option>";
        headers.forEach((h, i) => {
          const opt = document.createElement("option");
          opt.value = i;
          opt.textContent = h;
          columnA.appendChild(opt);
        });
        columnA.selectedIndex = Math.min(1, headers.length ? 1 : 0);
      }

      listAEl.value = cleanList(bodyRows.map((r) => r[0])).join("\n");
      fileAInfo && (fileAInfo.textContent = `${bodyRows.length} rows, ${headers.length} columns`);
      renderPerListCounts();

      columnA && (columnA.onchange = () => {
        const idx = parseInt(columnA.value, 10);
        if (Number.isFinite(idx)) {
          listAEl.value = cleanList(bodyRows.map((r) => r[idx])).join("\n");
          renderPerListCounts();
        }
      });
    });

    fileB && fileB.addEventListener("change", async () => {
      const file = fileB.files?.[0];
      if (!file) return;

      if (typeof parseFileToColumnData !== "function") {
        console.warn("[ListTool] parseFileToColumnData() missing.");
        return;
      }

      const { headers, bodyRows } = await parseFileToColumnData(file);

      if (columnB) {
        columnB.innerHTML = "<option value=''>Select column…</option>";
        headers.forEach((h, i) => {
          const opt = document.createElement("option");
          opt.value = i;
          opt.textContent = h;
          columnB.appendChild(opt);
        });
        columnB.selectedIndex = Math.min(1, headers.length ? 1 : 0);
      }

      listBEl.value = cleanList(bodyRows.map((r) => r[0])).join("\n");
      fileBInfo && (fileBInfo.textContent = `${bodyRows.length} rows, ${headers.length} columns`);
      renderPerListCounts();

      columnB && (columnB.onchange = () => {
        const idx = parseInt(columnB.value, 10);
        if (Number.isFinite(idx)) {
          listBEl.value = cleanList(bodyRows.map((r) => r[idx])).join("\n");
          renderPerListCounts();
        }
      });
    });

    // --- Trim & Clean buttons ---
    cleanABtn && (cleanABtn.onclick = () => {
      trimClean(listAEl);
      renderPerListCounts();
    });
    cleanBBtn && (cleanBBtn.onclick = () => {
      trimClean(listBEl);
      renderPerListCounts();
    });

    // --- Live typing/paste ---
    ["input", "change"].forEach((evt) => {
      listAEl.addEventListener(evt, renderPerListCounts);
      listBEl.addEventListener(evt, renderPerListCounts);
    });

    // --- Clear A / Clear B ---
    clearABtn && (clearABtn.onclick = () => {
      listAEl.value = "";
      fileA && (fileA.value = "");
      if (columnA) {
        columnA.innerHTML = "";
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Select column…";
        columnA.appendChild(opt);
        columnA.selectedIndex = 0;
      }
      fileAInfo && (fileAInfo.textContent = "");
      renderPerListCounts();
    });

    clearBBtn && (clearBBtn.onclick = () => {
      listBEl.value = "";
      fileB && (fileB.value = "");
      if (columnB) {
        columnB.innerHTML = "";
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Select column…";
        columnB.appendChild(opt);
        columnB.selectedIndex = 0;
      }
      fileBInfo && (fileBInfo.textContent = "");
      renderPerListCounts();
    });

    // --- Compare Lists ---
    compareBtn && (compareBtn.onclick = () => {
      const caseInsensitive = document.getElementById("caseInsensitive")?.checked || false;
      const removeDuplicates = document.getElementById("removeDuplicates")?.checked || false;
      const ignoreBlanks    = document.getElementById("ignoreBlanks")?.checked || false;
      const stripWhitespace = document.getElementById("stripWhitespace")?.checked || false;

      let listA = listAEl.value.split(/[\r\n,]+/);
      let listB = listBEl.value.split(/[\r\n,]+/);

      if (stripWhitespace) {
        listA = listA.map((x) => x.trim());
        listB = listB.map((x) => x.trim());
      }
      if (ignoreBlanks) {
        listA = listA.filter((x) => x.length);
        listB = listB.filter((x) => x.length);
      }
      if (caseInsensitive) {
        listA = listA.map((x) => x.toLowerCase());
        listB = listB.map((x) => x.toLowerCase());
      }
      if (removeDuplicates) {
        listA = Array.from(new Set(listA));
        listB = Array.from(new Set(listB));
      }

      const setA = new Set(listA);
      const setB = new Set(listB);

      const both  = cleanList(listA.filter((i) => setB.has(i)));
      const onlyA = cleanList(listA.filter((i) => !setB.has(i)));
      const onlyB = cleanList(listB.filter((i) => !setA.has(i)));

      bothOutput  && (bothOutput.innerText  = both.join("\n"));
      onlyAOutput && (onlyAOutput.innerText = onlyA.join("\n"));
      onlyBOutput && (onlyBOutput.innerText = onlyB.join("\n"));

      bothCount   && (bothCount.innerText  = `${both.length} item(s) in both lists`);
      onlyACount  && (onlyACount.innerText = `${onlyA.length} item(s) only in List A`);
      onlyBCount  && (onlyBCount.innerText = `${onlyB.length} item(s) only in List B`);
    });

    // --- Clear All ---
    clearAllBtn && (clearAllBtn.onclick = () => {
      if (!confirm("Reset List Comparison Tool?")) return;

      listAEl.value = "";
      listBEl.value = "";
      fileA && (fileA.value = "");
      fileB && (fileB.value = "");

      columnA && (columnA.innerHTML = "<option value=''>Select column…</option>");
      columnB && (columnB.innerHTML = "<option value=''>Select column…</option>");
      fileAInfo && (fileAInfo.textContent = "");
      fileBInfo && (fileBInfo.textContent = "");

      ["bothOutput", "onlyAOutput", "onlyBOutput"].forEach((id) => {
        const el = document.getElementById(id);
        el && (el.innerText = "");
      });
      ["bothCount", "onlyACount", "onlyBCount"].forEach((id) => {
        const el = document.getElementById(id);
        el && (el.innerText = "");
      });

      ["caseInsensitive", "removeDuplicates", "ignoreBlanks", "stripWhitespace"].forEach((id) => {
        const cb = document.getElementById(id);
        cb && (cb.checked = false);
      });

      renderPerListCounts();
    });

    // --- Result actions ---
    document.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.copy;
        const el = document.getElementById(id);
        const text = el ? el.innerText : "";
        if (!text) return alert("Nothing to copy.");
        navigator.clipboard
          .writeText(text)
          .then(() => alert("Copied!"))
          .catch(() => {
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

    document.querySelectorAll("[data-download]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.download;
        const fn = btn.dataset.fn || "list.txt";
        const el = document.getElementById(id);
        const text = el ? el.innerText : "";
        if (!text) return alert("Nothing to download.");
        if (typeof downloadText === "function") {
          downloadText(text, fn);
        } else {
          const blob = new Blob([text], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fn;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      });
    });

    document.querySelectorAll("[data-clear]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const outId = btn.dataset.clear;
        const countId = btn.dataset.clearcount;
        const outEl = document.getElementById(outId);
        const countEl = document.getElementById(countId);
        outEl && (outEl.innerText = "");
        countEl && (countEl.innerText = "");
      });
    });

    // Initial: empty state -> counts hidden
    renderPerListCounts();

    console.log("[ListTool] init complete.");
    return true;
  }

  // Export globally so your router/page can call it
  window.initListTool = initListTool;
})();
