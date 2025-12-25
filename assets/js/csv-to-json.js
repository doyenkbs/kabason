function initCsvToJsonTool() {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const els = {
    file: $("csvFile"),
    input: $("csvInput"),
    convert: $("btnConvertCsv"),
    clear: $("btnClearCsv"),
    copy: $("btnCopyJson"),
    download: $("btnDownloadJson"),
    output: $("jsonOutput"),

    delimiterMode: $("delimiterMode"),
    headerMode: $("headerMode"),
    inferTypes: $("inferTypes"),
    dotNotation: $("dotNotation"),
    trimCells: $("trimCells"),
    skipEmpty: $("skipEmpty"),
    outputMode: $("outputMode"),
    keyColumn: $("keyColumn"),
    indent: $("indent"),
  };

  const btnGo = document.getElementById("btnGoJsonToCsv");
if (btnGo) {
  btnGo.addEventListener("click", () => {
    // Switch tabs without changing global.js:
    const tab = document.querySelector('.tab[data-target="jsonToCsvTool"]');
    if (tab) tab.click();
  });
}

  const must = [
    "input","convert","clear","copy","download","output",
    "delimiterMode","headerMode","inferTypes","dotNotation","trimCells","skipEmpty",
    "outputMode","keyColumn","indent"
  ];
  for (const k of must) {
    if (!els[k]) {
      console.error(`[csv-to-json] Missing element "${k}". Check tools/csv-to-json.html ids.`);
      return;
    }
  }

  let lastJsonText = "";

  function setButtonsEnabled(on) {
    els.copy.disabled = !on;
    els.download.disabled = !on;
  }

  function clearAll() {
    els.input.value = "";
    if (els.file) els.file.value = "";

    els.delimiterMode.value = "auto";
    els.headerMode.value = "headers";
    els.inferTypes.checked = true;
    els.dotNotation.checked = true;
    els.trimCells.checked = true;
    els.skipEmpty.checked = true;
    els.outputMode.value = "array";
    els.keyColumn.value = "";
    els.keyColumn.disabled = true;
    els.indent.value = "2";

    els.output.textContent = "";
    lastJsonText = "";
    setButtonsEnabled(false);
    resetKeyColumnOptions([]);
  }

  function resetKeyColumnOptions(headers) {
    els.keyColumn.innerHTML = `<option value="">Key column: (select)</option>`;
    headers.forEach((h) => {
      const opt = document.createElement("option");
      opt.value = h;
      opt.textContent = h;
      els.keyColumn.appendChild(opt);
    });
  }

  function detectDelimiter(line) {
    const counts = [
      { d: ",", c: (line.match(/,/g) || []).length },
      { d: ";", c: (line.match(/;/g) || []).length },
      { d: "\t", c: (line.match(/\t/g) || []).length },
      { d: "|", c: (line.match(/\|/g) || []).length },
    ];
    counts.sort((a, b) => b.c - a.c);
    return counts[0].c > 0 ? counts[0].d : ","; // default comma
  }

  // RFC-ish CSV parser (quotes + commas + newlines)
  function parseCsv(text, delimiter) {
    const rows = [];
    let row = [];
    let cur = "";
    let i = 0;
    let inQuotes = false;

    while (i < text.length) {
      const ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          // Escaped quote
          if (text[i + 1] === '"') {
            cur += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i += 1;
          continue;
        }
        cur += ch;
        i += 1;
        continue;
      }

      if (ch === '"') {
        inQuotes = true;
        i += 1;
        continue;
      }

      if (ch === delimiter) {
        row.push(cur);
        cur = "";
        i += 1;
        continue;
      }

      if (ch === "\r") {
        // ignore \r (handle CRLF)
        i += 1;
        continue;
      }

      if (ch === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
        i += 1;
        continue;
      }

      cur += ch;
      i += 1;
    }

    // last cell
    row.push(cur);
    rows.push(row);

    return rows;
  }

  function inferType(val) {
    if (val === null || val === undefined) return "";
    const s = String(val);

    // keep empty as empty string
    if (s.length === 0) return "";

    // booleans/null
    const low = s.toLowerCase();
    if (low === "true") return true;
    if (low === "false") return false;
    if (low === "null") return null;

    // number detection (avoid stripping leading zeros like 001 unless user wants inference)
    // We'll infer numbers only if it doesn't look like a padded ID.
    if (/^-?\d+(\.\d+)?$/.test(s)) {
      if (s.length > 1 && s[0] === "0" && s[1] !== ".") {
        return s; // keep "001" as string
      }
      const n = Number(s);
      if (!Number.isNaN(n)) return n;
    }

    return s;
  }

  function setNested(obj, path, value) {
    const parts = path.split(".").filter(Boolean);
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i];
      const last = i === parts.length - 1;
      if (last) {
        cur[key] = value;
      } else {
        if (typeof cur[key] !== "object" || cur[key] === null) cur[key] = {};
        cur = cur[key];
      }
    }
  }

  function normalizeHeader(h, idx) {
    const name = (h ?? "").toString().trim();
    return name.length ? name : `col${idx + 1}`;
  }

  function buildObjects(rows, options) {
    const {
      hasHeaders,
      trimCells,
      skipEmpty,
      inferTypesOn,
      dotNotationOn,
    } = options;

    const cleaned = rows
      .map((r) => r.map((c) => (trimCells ? String(c).trim() : String(c))))
      .filter((r) => (skipEmpty ? r.some((c) => c.trim().length > 0) : true));

    if (!cleaned.length) return { headers: [], objects: [] };

    let headers = [];
    let startIdx = 0;

    if (hasHeaders) {
      headers = cleaned[0].map((h, idx) => normalizeHeader(h, idx));
      startIdx = 1;
    } else {
      const maxCols = Math.max(...cleaned.map((r) => r.length));
      headers = Array.from({ length: maxCols }, (_, i) => `col${i + 1}`);
      startIdx = 0;
    }

    const objects = [];
    for (let r = startIdx; r < cleaned.length; r++) {
      const row = cleaned[r];
      const obj = {};

      headers.forEach((h, idx) => {
        const raw = row[idx] ?? "";
        const v = inferTypesOn ? inferType(raw) : raw;

        if (dotNotationOn && h.includes(".")) {
          setNested(obj, h, v);
        } else {
          obj[h] = v;
        }
      });

      objects.push(obj);
    }

    return { headers, objects };
  }

  function toKeyedObject(objects, keyField) {
    const out = {};
    for (const o of objects) {
      const key = (o && o[keyField] !== undefined && o[keyField] !== null) ? String(o[keyField]) : "";
      if (!key) continue;

      if (out[key] === undefined) {
        out[key] = o;
      } else if (Array.isArray(out[key])) {
        out[key].push(o);
      } else {
        out[key] = [out[key], o];
      }
    }
    return out;
  }

  function renderJson(value) {
    const indentVal = Number(els.indent.value);
    const indent = indentVal === 0 ? 0 : indentVal;

    const text = JSON.stringify(value, null, indent);
    els.output.textContent = text;
    lastJsonText = text;
    setButtonsEnabled(true);
  }

  // Output mode toggles key column
  els.outputMode.addEventListener("change", () => {
    const keyed = els.outputMode.value === "keyed";
    els.keyColumn.disabled = !keyed;
  });

  // Root: file upload -> textarea
  if (els.file) {
    els.file.addEventListener("change", async () => {
      const f = els.file.files && els.file.files[0];
      if (!f) return;
      const text = await f.text();
      els.input.value = text;
    });
  }

  els.clear.addEventListener("click", clearAll);

  els.convert.addEventListener("click", () => {
    try {
      const raw = els.input.value;
      if (!raw || !raw.trim()) throw new Error("Paste CSV or upload a file.");

      // delimiter
      let delimiter = els.delimiterMode.value;
      if (delimiter === "auto") {
        const firstLine = raw.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
        delimiter = detectDelimiter(firstLine);
      } else if (delimiter === "\\t") {
        delimiter = "\t";
      }

      const rows = parseCsv(raw, delimiter);

      const hasHeaders = els.headerMode.value === "headers";
      const trimCells = els.trimCells.checked;
      const skipEmpty = els.skipEmpty.checked;
      const inferTypesOn = els.inferTypes.checked;
      const dotNotationOn = els.dotNotation.checked;

      const { headers, objects } = buildObjects(rows, {
        hasHeaders,
        trimCells,
        skipEmpty,
        inferTypesOn,
        dotNotationOn,
      });

      resetKeyColumnOptions(headers);

      if (els.outputMode.value === "keyed") {
        els.keyColumn.disabled = false;

        const keyField = els.keyColumn.value || headers[0] || "";
        if (!keyField) throw new Error("No columns available for keyed output.");

        // Ensure dropdown selects something
        els.keyColumn.value = keyField;

        const keyed = toKeyedObject(objects, keyField);
        renderJson(keyed);
      } else {
        els.keyColumn.disabled = true;
        renderJson(objects);
      }
    } catch (e) {
      els.output.textContent = `Error: ${e.message}`;
      lastJsonText = "";
      setButtonsEnabled(false);
    }
  });

  els.copy.addEventListener("click", async () => {
    if (!lastJsonText) return;
    try {
      await navigator.clipboard.writeText(lastJsonText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = lastJsonText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  });

  els.download.addEventListener("click", () => {
    if (!lastJsonText) return;
    const blob = new Blob([lastJsonText], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  });

  // Start clean
  clearAll();
}
