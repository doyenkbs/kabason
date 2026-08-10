function initCronTool() {
  const cronInput = document.getElementById("cronInput");
  const cronOutput = document.getElementById("cronOutput");
  const cronPreview = document.getElementById("cronPreview");
  const cronValidation = document.getElementById("cronValidation");
 
  
// ---- Help Modal wiring (inside initCronTool) ----
(function wireModal() {
  const modal   = document.getElementById('cronHelpModal');
  const openBtn = document.getElementById('openCronHelpBtn');
  if (!modal || !openBtn) return;

  const closeEls = modal.querySelectorAll('[data-close="modal"]');

  function openModal() {
    modal.hidden = false;
    modal.classList.add('open');
    // Focus the close button for accessibility
    const closer = modal.querySelector('.modal-close');
    if (closer) closer.focus();
    document.addEventListener('keydown', onKeyDown);
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.hidden = true;
    document.removeEventListener('keydown', onKeyDown);
  }
  function onKeyDown(e) { if (e.key === 'Escape') closeModal(); }

  openBtn.addEventListener('click', openModal);
  closeEls.forEach(el => el.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal();
  });
})();

  /* -----------------------------
     BASIC PARSER
  ----------------------------- */
  function explainField(field, type) {
    if (field === "*") return `every ${type}`;
    if (field.includes("/")) {
      const [_, step] = field.split("/");
      return `every ${step} ${type}`;
    }
    if (field.includes(",")) {
      return `${type}s ${field.split(",").join(", ")}`;
    }
    return `${type} ${field}`;
  }

  window.parseCron = function () {
    const cron = cronInput.value.trim();
    if (!cron) return;

    const parts = cron.split(/\s+/);
    if (parts.length !== 5) {
      cronOutput.innerText = "Invalid cron: must contain 5 fields.";
      return;
    }

    const [min, hour, dom, month, dow] = parts;

    const explanation = `
• Minutes: ${explainField(min, "minute")}
• Hours: ${explainField(hour, "hour")}
• Day of Month: ${explainField(dom, "day")}
• Month: ${explainField(month, "month")}
• Day of Week: ${explainField(dow, "weekday")}
    `.trim();

    cronOutput.innerText = explanation;

    validateCron(cron);
    previewCron(cron);
  };

  /* -----------------------------
     GENERATOR
  ----------------------------- */
  window.generateCron = function () {
    const m = document.getElementById("genMinutes").value || "*";
    const h = document.getElementById("genHours").value || "*";
    const dom = document.getElementById("genDom").value || "*";
    const mon = document.getElementById("genMonth").value || "*";
    const dow = document.getElementById("genDow").value || "*";

      // Normalize */X patterns
    if (m.startsWith("*/")) m = `*/${m.split("/")[1]}`;

    const cron = `${m} ${h} ${dom} ${mon} ${dow}`;
    cronInput.value = cron;
    parseCron();
  };

  /* -----------------------------
     CLEAR
  ----------------------------- */

window.clearCron = function () {
  // Clear cron expression outputs
  cronInput.value = "";
  cronOutput.innerText = "";
  cronPreview.innerText = "";
  cronValidation.innerText = "";

  // Clear generator fields
  ["genMinutes","genHours","genDom","genMonth","genDow"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  // ✅ Also clear Plain-English input
  const eng = document.getElementById("englishInput");
  if (eng) eng.value = "";
};

  
// Copy Cron → clipboard
window.copyCron = function () {
  try {
    const val = (document.getElementById("cronInput")?.value || "").trim();
    if (!val) return alert("Cron expression is empty.");
    navigator.clipboard.writeText(val)
      .then(() => alert("Cron copied to clipboard."))
      .catch(() => {
        // Fallback: older browsers
        const ta = document.createElement("textarea");
        ta.value = val;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        alert("Cron copied to clipboard.");
      });
  } catch (e) {
    console.error("[CronTool] copyCron failed:", e);
    alert("Unable to copy cron.");
  }
};


/* -----------------------------
   REVERSE GENERATOR (Plain English → Cron)
----------------------------- */


window.englishToCron = function () {
  const raw = document.getElementById("englishInput")?.value || "";
  const text = raw.toLowerCase().trim();
  if (!text) return;

  let m = "*", h = "*", dom = "*", mon = "*", dow = "*";

  /* -----------------------------
     MINUTES / HOURS
  ----------------------------- */
  // every N minutes
  const minuteMatch = text.match(/\bevery\s+(\d+)\s+minutes?\b/);
  if (minuteMatch) {
    m = `*/${minuteMatch[1]}`;
  } else if (/\bevery\s+minute\b/.test(text)) {
    m = "*";
  }

  // every N hours
  const hourMatch = text.match(/\bevery\s+(\d+)\s+hours?\b/);
  if (hourMatch) {
    h = `*/${hourMatch[1]}`;
    m = "0"; // convention: hourly schedules run on minute 0
  }

  // at HH(:MM) am/pm
  const timeMatch = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    let minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3];

    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;

    h = String(hour);
    m = String(minute);
  }

  /* -----------------------------
     DAYS OF WEEK (DOW)
  ----------------------------- */
  // weekday/weekend
  if (/\bweekday(s)?\b/.test(text)) dow = "1-5";
  if (/\bweekend(s)?\b/.test(text)) dow = "0,6";

  // DOW words & abbreviations → collect all, then join as list
  const dowMap = [
    { re: /\bsun(day)?\b/, val: 0 },
    { re: /\bmon(day)?\b/, val: 1 },
    { re: /\btue(s|sday)?\b/, val: 2 },
    { re: /\bwed(nesday)?\b/, val: 3 },
    { re: /\bthu(r|rs|rsday)?\b/, val: 4 },
    { re: /\bfri(day)?\b/, val: 5 },
    { re: /\bsat(urday)?\b/, val: 6 }
  ];
  const matchedDows = [];
  for (const d of dowMap) {
    if (d.re.test(text)) matchedDows.push(d.val);
  }
  if (matchedDows.length) {
    // unique & sorted
    dow = Array.from(new Set(matchedDows)).sort((a,b) => a - b).join(",");
  }

  /* -----------------------------
     MONTHS
  ----------------------------- */
  const monthWordToNum = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12
  };

  const monthMatches = text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/g);
  if (monthMatches && monthMatches.length) {
    const nums = monthMatches
      .map(w => monthWordToNum[w])
      .filter(Boolean);
    if (nums.length) {
      mon = Array.from(new Set(nums)).sort((a,b) => a - b).join(",");
    }
  }

  /* -----------------------------
     DAY OF MONTH (DOM)
  ----------------------------- */
  // Range: "on 1-5"
  const domRange = text.match(/\bon\s+(\d{1,2})\s*-\s*(\d{1,2})\b/);
  if (domRange) {
    const a = parseInt(domRange[1], 10);
    const b = parseInt(domRange[2], 10);
    if (a >= 1 && b <= 31 && a <= b) dom = `${a}-${b}`;
  } else {
    // List or single: "on 1 and 15", "on 1, 15", "on the 1st"
    // Grab all 1–31 ordinals/numbers that follow "on"
    const domListMatches = [];
    // e.g., "on 1 and 15", "on 1, 15", "on the 1st"
    const onBlock = text.match(/\bon\s+(?:the\s+)?([^\n]+)/);
    if (onBlock) {
      const nums = onBlock[1].match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/g);
      if (nums) {
        nums.forEach(n => {
          const v = parseInt(n, 10);
          if (v >= 1 && v <= 31) domListMatches.push(v);
        });
      }
    }
    if (domListMatches.length) {
      dom = Array.from(new Set(domListMatches)).sort((a,b) => a - b).join(",");
    }
  }

  /* -----------------------------
     YEAR (not supported in 5-field cron)
  ----------------------------- */
  // If a year (e.g., 2026) is present, we ignore it for 5-field cron.
  // const yearMatch = text.match(/\b(19|20)\d{2}\b/); // (optional) detect & ignore

  /* -----------------------------
     BUILD FINAL CRON
  ----------------------------- */
  const cron = `${m} ${h} ${dom} ${mon} ${dow}`;
  cronInput.value = cron;
  parseCron();
};



// Clear the Plain-English textarea
window.clearEnglish = function () {
  const el = document.getElementById("englishInput");
  if (el) el.value = "";
};
``


  /* -----------------------------
     CRON VALIDATOR (programmatic)
  ----------------------------- */
  /* Says what is wrong and which field it is in. The class drives the color,
     which is why the message itself carries no symbol. */
  function setValidation(message, ok) {
    cronValidation.innerText = message;
    cronValidation.classList.toggle("is-valid", ok);
    cronValidation.classList.toggle("is-invalid", !ok);
  }

  function validateCron(cron) {
    const parts = cron.split(/\s+/);
    if (parts.length !== 5) {
      setValidation(`Needs 5 fields, found ${parts.length}: minute, hour, day of month, month, day of week.`, false);
      return;
    }

    const [min, hour, dom, mon, dow] = parts;

    // Validate each field using numeric bounds + token parsing
    if (!isValidField(min, 0, 59)) {
      setValidation(`Minute field "${min}" is not valid. Use 0-59.`, false);
      return;
    }
    if (!isValidField(hour, 0, 23)) {
      setValidation(`Hour field "${hour}" is not valid. Use 0-23.`, false);
      return;
    }
    if (!isValidField(dom, 1, 31)) {
      setValidation(`Day of month field "${dom}" is not valid. Use 1-31.`, false);
      return;
    }
    if (!isValidField(mon, 1, 12)) {
      setValidation(`Month field "${mon}" is not valid. Use 1-12.`, false);
      return;
    }
    if (!isValidField(dow, 0, 6)) {
      setValidation(`Day of week field "${dow}" is not valid. Use 0-6, where 0 is Sunday.`, false);
      return;
    }

    setValidation("Valid cron expression.", true);
  }

  // Validate a field (supports *, lists, ranges, steps)
  function isValidField(field, minVal, maxVal) {
    const tokens = String(field).split(",");
    // Empty tokens or malformed commas are invalid
    if (!tokens.length || tokens.some(t => t.trim().length === 0)) return false;
    return tokens.every(tok => isValidToken(tok.trim(), minVal, maxVal));
  }

  function isValidToken(token, minVal, maxVal) {
    if (token === "*") return true;

    // Step-only: */n
    if (token.startsWith("*/")) {
      const step = parseInt(token.slice(2), 10);
      return Number.isInteger(step) && step > 0;
    }

    // Range with optional step: a-b or a-b/n
    if (token.includes("-")) {
      const [rangePart, stepPart] = token.split("/");
      const [aStr, bStr] = rangePart.split("-");
      const a = parseInt(aStr, 10);
      const b = parseInt(bStr, 10);
      if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
      if (a > b) return false;
      if (a < minVal || b > maxVal) return false;
      if (stepPart !== undefined) {
        const step = parseInt(stepPart, 10);
        if (!Number.isInteger(step) || step <= 0) return false;
      }
      return true;
    }

    // Single value
    const n = parseInt(token, 10);
    return Number.isInteger(n) && n >= minVal && n <= maxVal;
  }

  /* -----------------------------
     CRON PREVIEW (Next 10 Runs)
  ----------------------------- */
  function previewCron(cron) {
    try {
      const parts = cron.split(/\s+/);
      if (parts.length !== 5) return;

      const [min, hour, dom, mon, dow] = parts;

      const results = [];
      let date = new Date();

      while (results.length < 10) {
        date.setMinutes(date.getMinutes() + 1);

        if (matches(date.getMinutes(), min) &&
            matches(date.getHours(), hour) &&
            matches(date.getDate(), dom) &&
            matches(date.getMonth() + 1, mon) &&
            matches(date.getDay(), dow)) {
            results.push(
              date.toLocaleString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })
            );
          }
      }

      cronPreview.innerText = results.join("\n");
    } catch {
      cronPreview.innerText = "Unable to generate preview.";
    }
  }

  function matches(value, field) {
    if (field === "*") return true;
    if (field.includes("/")) {
      const [base, step] = field.split("/");
      return value % parseInt(step, 10) === 0;
    }
    if (field.includes(",")) {
      return field.split(",").map(Number).includes(value);
    }
    return parseInt(field, 10) === value;
  }
}