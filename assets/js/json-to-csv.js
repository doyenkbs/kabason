function initJsonToCsvTool() {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const els = {
    file: $("jsonFile"),
    input: $("jsonInput"),
    convert: $("btnConvert"),
    clear: $("btnClear"),
    copy: $("btnCopyCsv"),
    download: $("btnDownloadCsv"),
    csvOut: $("csvOutput"),
    tableWrap: $("tableWrap"),
    search: $("tableSearch"),
    arrayMode: $("arrayMode"),
    arrayJoiner: $("arrayJoiner"),
    rootPath: $("rootPath"),
    rootPreset: $("rootPreset"),
  };

  const must = [
    "input",
    "convert",
    "clear",
    "csvOut",
    "tableWrap",
    "copy",
    "download",
    "arrayMode",
    "arrayJoiner",
    "rootPath",
    "rootPreset",
  ];
  for (const k of must) {
    if (!els[k]) {
      console.error(`[json-to-csv] Missing element "${k}". Check tools/json-to-csv.html ids.`);
      return;
    }
  }

  let lastCsv = "";
  let lastRows = [];
  let lastCols = [];

  function safeString(v) {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  function isPlainObject(v) {
    return Object.prototype.toString.call(v) === "[object Object]";
  }

  // Supports dot paths and bracket indexes:
  // users
  // data.items
  // data.items[0].name
  function getByPath(obj, path) {
    if (!path) return obj;
    const trimmed = path.trim();
    if (!trimmed) return obj;

    // Convert bracket notation to dot: a[0].b -> a.0.b
    const normalized = trimmed.replace(/\[(\d+)\]/g, ".$1");
    const parts = normalized.split(".").filter(Boolean);

    let cur = obj;
    for (const part of parts) {
      if (cur === null || cur === undefined) return undefined;

      // numeric index
      if (/^\d+$/.test(part)) {
        const idx = Number(part);
        if (!Array.isArray(cur)) return undefined;
        cur = cur[idx];
      } else {
        cur = cur[part];
      }
    }
    return cur;
  }

  // If user didn't specify a rootPath, try common ones
  function autoDetectRoot(parsed) {
    if (Array.isArray(parsed)) return { rows: parsed, usedPath: "" };

    if (!isPlainObject(parsed)) return { rows: [parsed], usedPath: "" };

    const candidates = [
      "users",
      "items",
      "results",
      "data",
      "data.items",
      "data.results",
      "response.items",
      "response.results",
    ];

    for (const p of candidates) {
      const v = getByPath(parsed, p);
      if (Array.isArray(v)) return { rows: v, usedPath: p };
    }

    // If "data" itself is an array-like container (rare)
    const data = parsed.data;
    if (Array.isArray(data)) return { rows: data, usedPath: "data" };

    return { rows: [parsed], usedPath: "" };
  }

  // Flatten JSON into a single object of key/value pairs
  // - Objects -> dot keys
  // - Arrays:
  //   - join: join into one cell
  //   - index: create keys arr[0], arr[1]...
  function flatten(value, opts, prefix = "", out = {}) {
    const mode = opts.mode;
    const joiner = opts.joiner;

    if (value === null || value === undefined) {
      if (prefix) out[prefix] = "";
      return out;
    }

    if (typeof value !== "object") {
      if (prefix) out[prefix] = String(value);
      else out["value"] = String(value);
      return out;
    }

    if (Array.isArray(value)) {
      if (!prefix) {
        out["$"] = safeString(value);
        return out;
      }

      if (mode === "join") {
        const joined = value
          .map((v) => (typeof v === "object" ? safeString(v) : String(v)))
          .join(joiner);
        out[prefix] = joined;
        return out;
      }

      value.forEach((v, i) => {
        const key = `${prefix}[${i}]`;
        flatten(v, opts, key, out);
      });
      return out;
    }

    Object.keys(value).forEach((k) => {
      const next = prefix ? `${prefix}.${k}` : k;
      flatten(value[k], opts, next, out);
    });

    return out;
  }

  function collectColumns(rows) {
    const set = new Set();
    rows.forEach((r) => Object.keys(r).forEach((k) => set.add(k)));
    return Array.from(set).sort();
  }

  function csvEscape(s) {
    const str = s ?? "";
    const needsQuotes = /[",\n\r]/.test(str);
    const safe = String(str).replace(/"/g, '""');
    return needsQuotes ? `"${safe}"` : safe;
  }

  function toCsv(rows, cols) {
    const header = cols.map(csvEscape).join(",");
    const body = rows.map((r) => cols.map((c) => csvEscape(r[c] ?? "")).join(",")).join("\n");
    return `${header}\n${body}`;
  }

  function renderTable(rows, cols) {
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";

    const thead = document.createElement("thead");
    const trh = document.createElement("tr");

    cols.forEach((c) => {
      const th = document.createElement("th");
      th.textContent = c;
      th.style.textAlign = "left";
      th.style.padding = "8px";
      th.style.position = "sticky";
      th.style.top = "0";
      th.style.zIndex = "1";
      th.style.background = "rgba(0,0,0,0.25)";
      trh.appendChild(th);
    });

    thead.appendChild(trh);

    const tbody = document.createElement("tbody");
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      cols.forEach((c) => {
        const td = document.createElement("td");
        td.textContent = r[c] ?? "";
        td.style.padding = "8px";
        td.style.verticalAlign = "top";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);

    els.tableWrap.innerHTML = "";
    els.tableWrap.appendChild(table);
  }

  function setButtonsEnabled(on) {
    els.copy.disabled = !on;
    els.download.disabled = !on;
  }

  function clearOutputsOnly() {
    els.csvOut.textContent = "";
    els.tableWrap.innerHTML = "";
    els.search.value = "";
    lastCsv = "";
    lastRows = [];
    lastCols = [];
    setButtonsEnabled(false);
  }

  function rowSearchText(row, cols) {
    const raw = cols.map((c) => safeString(row[c] ?? "")).join(" ").toLowerCase();
    const normalized = raw.replace(/\\/g, "");
    return { raw, normalized };
  }

  function normalizeRows(rows) {
    // Ensure we always have an array of row-objects
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => (isPlainObject(r) ? r : { value: safeString(r) }));
  }

  // --- Wiring: root preset -> root path
  els.rootPreset.addEventListener("change", () => {
    els.rootPath.value = els.rootPreset.value || "";
  });

  // File upload -> textarea
  if (els.file) {
    els.file.addEventListener("change", async () => {
      const f = els.file.files && els.file.files[0];
      if (!f) return;
      els.input.value = await f.text();
    });
  }

  // Clear resets everything
  els.clear.addEventListener("click", () => {
    els.input.value = "";
    els.file.value = "";
    els.search.value = "";

    els.rootPreset.value = "";
    els.rootPath.value = "";

    els.arrayMode.value = "join"; // default per your request
    els.arrayJoiner.value = "; ";

    clearOutputsOnly();
  });

  // Convert
  els.convert.addEventListener("click", () => {
    try {
      const raw = els.input.value.trim();
      if (!raw) throw new Error("Paste JSON or upload a .json file.");

      const parsed = JSON.parse(raw);

      // Decide which array becomes rows
      const userPath = els.rootPath.value.trim();
      let rowsSource;
      let usedPath = "";

      if (userPath) {
        rowsSource = getByPath(parsed, userPath);
        usedPath = userPath;

        if (!Array.isArray(rowsSource)) {
          throw new Error(
            `Root path "${userPath}" did not resolve to an array. Try a different path (e.g. users, items, data.items) or clear it.`
          );
        }
      } else {
        const detected = autoDetectRoot(parsed);
        rowsSource = detected.rows;
        usedPath = detected.usedPath;

        // If we auto-detected a path, show it so the user learns it
        if (usedPath) {
          els.rootPath.value = usedPath;
          // Also set preset if it matches one
          const opts = Array.from(els.rootPreset.options).map((o) => o.value);
          if (opts.includes(usedPath)) els.rootPreset.value = usedPath;
        }
      }

      // If the parsed root is already an array, rowsSource is the parsed array
      if (Array.isArray(parsed) && !userPath) {
        rowsSource = parsed;
        usedPath = "";
        els.rootPreset.value = "";
        els.rootPath.value = "";
      }

      const rows = normalizeRows(rowsSource);
      if (!rows.length) throw new Error("No rows found to convert.");

      const mode = els.arrayMode.value; // index | join
      const joinerRaw = (els.arrayJoiner.value ?? "").toString();
      const joiner = joinerRaw.length ? joinerRaw : "; ";

      const flatRows = rows.map((obj) => flatten(obj, { mode, joiner }));
      const cols = collectColumns(flatRows);

      lastRows = flatRows;
      lastCols = cols;

      lastCsv = toCsv(flatRows, cols);
      els.csvOut.textContent = lastCsv;

      renderTable(flatRows, cols);
      setButtonsEnabled(true);
    } catch (e) {
      clearOutputsOnly();
      els.csvOut.textContent = `Error: ${e.message}`;
    }
  });

  // Copy CSV
  els.copy.addEventListener("click", async () => {
    if (!lastCsv) return;
    try {
      await navigator.clipboard.writeText(lastCsv);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = lastCsv;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  });

  // Download CSV
  els.download.addEventListener("click", () => {
    if (!lastCsv) return;
    const blob = new Blob([lastCsv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "json-export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  });

  // Search
  els.search.addEventListener("input", () => {
    if (!lastRows.length) return;

    const q = els.search.value.trim().toLowerCase();
    if (!q) {
      renderTable(lastRows, lastCols);
      return;
    }

    const qNorm = q.replace(/\\/g, "");

    const filtered = lastRows.filter((r) => {
      const { raw, normalized } = rowSearchText(r, lastCols);
      return raw.includes(q) || normalized.includes(qNorm);
    });

    renderTable(filtered, lastCols);
  });

  // Init
  els.arrayMode.value = els.arrayMode.value || "join"; // default per your request
  if (!els.arrayJoiner.value) els.arrayJoiner.value = "; ";
  clearOutputsOnly();
}
