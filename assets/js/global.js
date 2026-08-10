/* ==========================================================================
   KABASON — SHELL BEHAVIOUR
   Routing, theme, the landing demo, and helpers shared by every tool.
   ========================================================================== */

/* --------------------------------------------------------------------------
   ROUTING
   Each tool gets a slug so it can be linked, bookmarked, and reached with
   the back button. The pane ids are the ones the tool scripts query by.
   -------------------------------------------------------------------------- */

const ROUTES = {
  home: "home",
  lists: "listTool",
  regex: "regexTool",
  cron: "cronTool",
  "json-to-csv": "jsonToCsvTool",
  "csv-to-json": "csvToJsonTool",
  ip: "ipTool"
};

const SLUGS = Object.keys(ROUTES).reduce((map, slug) => {
  map[ROUTES[slug]] = slug;
  return map;
}, {});

function showPane(targetId) {
  const pane = document.getElementById(targetId);
  if (!pane) return false;

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  pane.classList.add("active");

  const tab = document.querySelector('.tab[data-target="' + targetId + '"]');
  if (tab) {
    tab.classList.add("active");
    // Keep the active tool visible when the rail is scrolled sideways.
    tab.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  return true;
}

/* Called on load and on every hashchange, and again once the tool panes
   have finished loading so a deep link lands on real content. */
function applyRouteFromHash() {
  const slug = window.location.hash.replace("#", "");
  showPane(ROUTES[slug] || "home");
}

function navigateTo(targetId) {
  if (!showPane(targetId)) return;

  // Home is the bare URL; every tool gets its own hash.
  const targetHash = targetId === "home" ? "" : "#" + SLUGS[targetId];

  if (window.location.hash !== targetHash) {
    history.pushState(null, "", targetHash || window.location.pathname);
  }

  window.scrollTo({ top: 0 });
}

document.addEventListener("click", function (e) {
  // Tabs and landing cards carry data-target. Cross-links between tools
  // carry data-goto, so they read differently in the markup.
  const nav = e.target.closest(".tab, .tool-card, [data-goto]");
  if (!nav) return;

  const target = nav.dataset.goto || nav.dataset.target;
  if (target) navigateTo(target);
});

window.addEventListener("hashchange", applyRouteFromHash);
applyRouteFromHash();

/* --------------------------------------------------------------------------
   INTERNAL TABS (advanced regex panels)
   -------------------------------------------------------------------------- */

document.addEventListener("click", function (e) {
  const tab = e.target.closest(".regex-tab");
  if (!tab) return;

  document.querySelectorAll(".regex-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".regex-panel").forEach(p => p.classList.remove("active"));

  tab.classList.add("active");
  document.getElementById(tab.dataset.target).classList.add("active");
});

/* --------------------------------------------------------------------------
   THEME
   The choice is remembered. First visit follows the operating system.
   The class lives on <html> so index.html can set it before first paint.
   -------------------------------------------------------------------------- */

const themeToggle = document.getElementById("toggleStyleBtn");

/* Only an actual click is remembered. Applying the theme on load must not
   write anything, or the first visit would silently lock in whatever the
   operating system happened to be set to that day. */
function applyTheme(mode, remember) {
  const root = document.documentElement;
  root.classList.toggle("dark-mode", mode === "dark");
  root.classList.toggle("light-mode", mode === "light");

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      mode === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  if (!remember) return;

  try {
    localStorage.setItem("kabason-theme", mode);
  } catch (e) {
    /* Private browsing. The theme still applies, it just will not persist. */
  }
}

applyTheme(document.documentElement.classList.contains("light-mode") ? "light" : "dark", false);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    applyTheme(document.documentElement.classList.contains("dark-mode") ? "light" : "dark", true);
  });
}

/* Follow the operating system until the user has made a choice of their own. */
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  let saved = null;
  try { saved = localStorage.getItem("kabason-theme"); } catch (err) {}
  if (!saved) applyTheme(e.matches ? "dark" : "light", false);
});

/* --------------------------------------------------------------------------
   SHARED HELPERS
   -------------------------------------------------------------------------- */

function downloadText(text, filename) {
  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function cleanList(list) {
  return Array.from(new Set(list.map(v => v.trim()).filter(v => v.length)));
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* Turns a pile of hostnames or FQDNs into one alternation pattern.
   Used by the regex tool and by the demo on the landing page, so the demo
   cannot drift away from what the tool actually does. */
function buildHostnameRegex(items, opts) {
  const settings = opts || {};
  let list = items.map(s => s.trim()).filter(Boolean);

  if (settings.dedupe) list = cleanList(list);
  if (!list.length) return "";

  // Strip the domain: srv-atl-01.corp.local matches on srv-atl-01
  const baseNames = list.map(item => item.split(".")[0]);

  let pattern = "(" + baseNames.map(escapeRegex).join("|") + ")(\\..*)?";

  if (settings.anchorStart) pattern = "^" + pattern;
  if (settings.anchorEnd) pattern = pattern + "$";
  if (!settings.caseSensitive) pattern = "(?i)" + pattern;

  return pattern;
}

/* CSV/XLSX parser used by all tools */
async function parseFileToColumnData(file) {
  const name = file.name.toLowerCase();
  let rows = [];

  if (name.endsWith(".csv")) {
    const text = await file.text();
    const workbook = XLSX.read(text, { type: "string" });
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
  } else if (name.endsWith(".xlsx")) {
    const data = new Uint8Array(await file.arrayBuffer());
    const workbook = XLSX.read(data, { type: "array" });
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
  }

  const headerRow = rows[0];
  const isHeader = headerRow.some(v => typeof v === "string" && v.trim().length > 0);
  const headers = isHeader ? headerRow : headerRow.map((_, i) => "Column " + (i + 1));
  const bodyRows = isHeader ? rows.slice(1) : rows;

  return { headers, bodyRows };
}

/* --------------------------------------------------------------------------
   LANDING DEMO
   The hero is the regex tool, running. On first load the result resolves
   over half a second so the page opens on a transformation happening.
   -------------------------------------------------------------------------- */

(function initHeroDemo() {
  const input = document.getElementById("heroInput");
  const output = document.getElementById("heroOutput");
  if (!input || !output) return;

  const inCount = document.getElementById("heroInCount");
  const outCount = document.getElementById("heroOutCount");
  const stat = document.getElementById("heroStat");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let revealFrame = null;

  function render(animate) {
    const lines = input.value.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
    const unique = cleanList(lines);

    const pattern = buildHostnameRegex(lines, {
      dedupe: true,
      caseSensitive: false,
      anchorStart: true,
      anchorEnd: true
    });

    inCount.textContent = lines.length + (lines.length === 1 ? " line" : " lines");
    outCount.textContent = pattern ? pattern.length + " chars" : "";

    const removed = lines.length - unique.length;
    stat.textContent = lines.length
      ? unique.length +
        (unique.length === 1 ? " host" : " hosts") +
        (removed ? ", " + removed + " duplicate" + (removed === 1 ? "" : "s") + " dropped" : "")
      : "";

    if (revealFrame) cancelAnimationFrame(revealFrame);

    if (!animate || reduceMotion || !pattern) {
      output.textContent = pattern;
      return;
    }

    const start = performance.now();
    (function step(now) {
      const progress = Math.min((now - start) / 500, 1);
      output.textContent = pattern.slice(0, Math.ceil(pattern.length * progress));
      if (progress < 1) revealFrame = requestAnimationFrame(step);
    })(start);
  }

  input.addEventListener("input", () => render(false));
  render(true);
})();
