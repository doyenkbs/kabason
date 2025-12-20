function initIPTool() {
  const ipInput = document.getElementById("ipInput");
  const ipOutput = document.getElementById("ipOutput");
  const ipSummary = document.getElementById("ipSummary");

  const ipFile = document.getElementById("ipFile");
  const ipColumn = document.getElementById("ipColumn");
  const ipFileInfo = document.getElementById("ipFileInfo");

  /* Load CSV/XLSX */
  ipFile.addEventListener("change", async () => {
    const file = ipFile.files[0];
    if (!file) return;

    const { headers, bodyRows } = await parseFileToColumnData(file);

    ipColumn.innerHTML = "<option value=''>Select column…</option>";
    headers.forEach((h, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = h;
      ipColumn.appendChild(opt);
    });

    ipColumn.selectedIndex = 1;

    ipInput.value = cleanList(bodyRows.map(r => r[0])).join("\n");
    ipFileInfo.textContent = `${bodyRows.length} rows, ${headers.length} columns`;

    ipColumn.onchange = () => {
      const idx = parseInt(ipColumn.value, 10);
      ipInput.value = cleanList(bodyRows.map(r => r[idx])).join("\n");
    };
  });

  /* Validate IP */
  function isValidIP(ip) {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;
    return parts.every(p => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
  }

  /* Convert IP to integer */
  function ipToInt(ip) {
    return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
  }

  /* Convert integer to IP */
  function intToIp(int) {
    return [
      (int >>> 24) & 255,
      (int >>> 16) & 255,
      (int >>> 8) & 255,
      int & 255
    ].join(".");
  }

  /* Expand CIDR */
  function expandCIDR(cidr, hostsOnly = false) {
    const [base, prefix] = cidr.split("/");
    if (!isValidIP(base) || isNaN(prefix)) return [];

    const baseInt = ipToInt(base);
    const mask = 0xffffffff << (32 - prefix);
    const network = baseInt & mask;
    const broadcast = network | (~mask >>> 0);

    let start = network;
    let end = broadcast;

    if (hostsOnly) {
      start = network + 1;
      end = broadcast - 1;
      if (start > end) return [];
    }

    const result = [];
    for (let i = start; i <= end; i++) {
      result.push(intToIp(i));
    }
    return result;
  }

  /* Collapse IP list into CIDRs */
  function collapseToCIDR(ips) {
    const ints = ips.map(ipToInt).sort((a, b) => a - b);
    const result = [];

    let start = ints[0];
    let end = ints[0];

    function pushRange(s, e) {
      while (s <= e) {
        let maxSize = 32;
        while (maxSize > 0) {
          const mask = 0xffffffff << (32 - maxSize);
          if ((s & mask) !== s) break;
          const blockEnd = s + (1 << (32 - maxSize)) - 1;
          if (blockEnd > e) break;
          maxSize--;
        }
        maxSize++;
        result.push(intToIp(s) + "/" + maxSize);
        s += 1 << (32 - maxSize);
      }
    }

    for (let i = 1; i < ints.length; i++) {
      if (ints[i] === end + 1) {
        end = ints[i];
      } else {
        pushRange(start, end);
        start = end = ints[i];
      }
    }
    pushRange(start, end);

    return result;
  }

  /* Clean input */
  function getCleanIPs() {
    return cleanList(ipInput.value.split(/[\r\n,]+/));
  }

  /* Validate button */
  document.getElementById("validateIPs").onclick = () => {
    const ips = getCleanIPs();
    const valid = ips.filter(isValidIP);
    const invalid = ips.filter(ip => !isValidIP(ip));

    ipSummary.innerText = `${valid.length} valid, ${invalid.length} invalid`;
    ipOutput.innerText = invalid.join("\n");
  };

  /* Expand (all IPs) */
  document.getElementById("expandAll").onclick = () => {
    const items = getCleanIPs();
    let result = [];

    items.forEach(item => {
      if (item.includes("/")) {
        result.push(...expandCIDR(item, false));
      } else if (isValidIP(item)) {
        result.push(item);
      }
    });

    ipOutput.innerText = cleanList(result).join("\n");
  };

  /* Expand (hosts only) */
  document.getElementById("expandHosts").onclick = () => {
    const items = getCleanIPs();
    let result = [];

    items.forEach(item => {
      if (item.includes("/")) {
        result.push(...expandCIDR(item, true));
      } else if (isValidIP(item)) {
        result.push(item);
      }
    });

    ipOutput.innerText = cleanList(result).join("\n");
  };

  /* Collapse to CIDR */
  document.getElementById("collapseCIDR").onclick = () => {
    const ips = getCleanIPs().filter(isValidIP);
    if (!ips.length) return;

    const cidrs = collapseToCIDR(ips);
    ipOutput.innerText = cidrs.join("\n");
  };

  /* Sort */
  document.getElementById("sortIPs").onclick = () => {
    const ips = getCleanIPs().filter(isValidIP);
    ips.sort((a, b) => ipToInt(a) - ipToInt(b));
    ipOutput.innerText = ips.join("\n");
  };

  /* Clean */
  document.getElementById("cleanIPs").onclick = () => {
    const cleaned = cleanList(ipInput.value.split(/[\r\n,]+/));
    ipInput.value = cleaned.join("\n");
  };

  /* Copy Output */
  document.getElementById("copyIPs").onclick = () => {
    const text = ipOutput.innerText;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => alert("Copied!"));
  };

  /* Download Output */
  document.getElementById("downloadIPs").onclick = () => {
    const text = ipOutput.innerText;
    if (!text) return;
    downloadText(text, "ip_output.txt");
  };

  /* Clear All */
  document.getElementById("clearIPTool").onclick = () => {
    if (!confirm("Reset IP/CIDR Utility Tool?")) return;

    ipInput.value = "";
    ipOutput.innerText = "";
    ipSummary.innerText = "";

    ipFile.value = "";
    ipColumn.innerHTML = "<option value=''>Select column…</option>";
    ipFileInfo.textContent = "";
  };
}