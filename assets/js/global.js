/* ========== GLOBAL TAB SWITCHING ========== */
document.addEventListener("click", function (e) {
  if (!e.target.classList.contains("tab")) return;

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  e.target.classList.add("active");
  document.getElementById(e.target.dataset.target).classList.add("active");
});

/* ========== THEME TOGGLE ========== */
document.getElementById("toggleStyleBtn").addEventListener("click", () => {
  const body = document.body;
  if (body.classList.contains("dark-mode")) {
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");
  } else {
    body.classList.remove("light-mode");
    body.classList.add("dark-mode");
  }
});

/* ========== SHARED HELPERS ========== */
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