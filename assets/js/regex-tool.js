function initRegexTool() {
  const regexInput = document.getElementById("regexInput");
  const regexFile = document.getElementById("regexFile");
  const regexColumn = document.getElementById("regexColumn");
  const regexFileInfo = document.getElementById("regexFileInfo");

  const envSelect = document.getElementById("regexEnvironment");
  const trimBox = document.getElementById("regexTrim");
  const caseBox = document.getElementById("regexCaseSensitive");
  const beginBox = document.getElementById("regexBegin");
  const endBox = document.getElementById("regexEnd");

  /* Load CSV/XLSX */
  regexFile.addEventListener("change", async () => {
    const file = regexFile.files[0];
    if (!file) return;

    const { headers, bodyRows } = await parseFileToColumnData(file);

    regexColumn.innerHTML = "<option value=''>Select column…</option>";
    headers.forEach((h, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = h;
      regexColumn.appendChild(opt);
    });

    regexColumn.selectedIndex = 1;

    regexInput.value = cleanList(bodyRows.map(r => r[0])).join("\n");
    regexFileInfo.textContent = `${bodyRows.length} rows, ${headers.length} columns`;

    regexColumn.onchange = () => {
      const idx = parseInt(regexColumn.value, 10);
      regexInput.value = cleanList(bodyRows.map(r => r[idx])).join("\n");
    };
  });

  /* Environment formatting is currently a no-op: every environment gets the
     bare pattern. The dropdown stays so wrapping can come back per-environment
     (regex: for Tanium, /…/ for JavaScript) without changing the markup. */
  function formatForEnvironment(pattern, env) {
    return pattern;
  }

  /* Format hostnames.
     buildHostnameRegex lives in global.js and is shared with the landing
     demo, so the two can never produce different output for the same input. */
  window.formatHostnames = function () {
    const items = regexInput.value.split(/[\r\n,]+/);

    const pattern = buildHostnameRegex(items, {
      dedupe: trimBox.checked,
      caseSensitive: caseBox.checked,
      anchorStart: beginBox.checked,
      anchorEnd: endBox.checked
    });

    if (!pattern) return;

    document.getElementById("regexOutput").innerText = formatForEnvironment(pattern, envSelect.value);
  };

  window.copyRegex = function () {
    const text = document.getElementById("regexOutput").innerText;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => alert("Copied!"));
  };

  window.downloadRegex = function () {
    const text = document.getElementById("regexOutput").innerText;
    if (!text) return;
    downloadText(text, "tanium_regex.txt");
  };

  window.clearRegex = function () {
    regexInput.value = "";
    document.getElementById("regexOutput").innerText = "";
    regexFile.value = "";
    regexColumn.innerHTML = "<option value=''>Select column…</option>";
    regexFileInfo.textContent = "";
  };
}
