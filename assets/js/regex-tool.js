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

  /* Escape regex characters */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /* Apply environment formatting 
  function formatForEnvironment(pattern, env) {
    switch (env) {
      case "tanium":
        return `regex:${pattern}`;

      case "powershell":
        return `"${pattern.replace(/"/g, '\\"')}"`;

      case "javascript":
        return `/${pattern}/`;

      case "python":
        return `r"${pattern}"`;

      case "bash":
        return `"${pattern}"`;

      default:
        return pattern;
    }
  } */

     /* ✅ ALWAYS return pure regex only */
  function formatForEnvironment(pattern, env) {
    return pattern;
  }

  
  /* Format hostnames */
  window.formatHostnames = function () {
    let items = regexInput.value
      .split(/[\r\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (!items.length) return;

    /* Trim / Clean */
    if (trimBox.checked) {
      items = cleanList(items);
    }

    /* Extract base names */
    let baseNames = items.map(item => item.split(".")[0]);

    /* Escape */
    let escaped = baseNames.map(escapeRegex);

    /* Build core regex */
    let core = "(" + escaped.join("|") + ")";

    /* Add optional domain */
    core += "(\\..*)?";

    /* Add anchors */
    if (beginBox.checked) core = "^" + core;
    if (endBox.checked) core = core + "$";

    /* Case sensitivity */
    if (!caseBox.checked) {
      // Case insensitive
      core = "(?i)" + core;
    }

    /* Environment formatting */
    const env = envSelect.value;
    const finalRegex = formatForEnvironment(core, env);

    document.getElementById("regexOutput").innerText = finalRegex;
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
