function initRegexTool() {
  const regexInput = document.getElementById("regexInput");
  const regexFile = document.getElementById("regexFile");
  const regexColumn = document.getElementById("regexColumn");
  const regexFileInfo = document.getElementById("regexFileInfo");

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

  /* Escape regex characters */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /* Format hostnames */
  window.formatHostnames = function () {
    let items = regexInput.value.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
    if (!items.length) return;

    let baseNames = items.map(item => item.split(".")[0]);
    let escaped = baseNames.map(escapeRegex);

    let regex = "(" + escaped.join("|") + ")(\\..*)?$";
    document.getElementById("regexOutput").innerText = regex;
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