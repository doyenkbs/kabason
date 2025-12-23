
// assets/js/ip-tool.js
// KABASON Utility Suite — IP Networking Tool
// IMPORTANT: This file does NOT auto-run.
// Your index.html dynamic loader calls: initIPTool()
// We provide window.initIPTool (and camelCase alias) here.

/* global fetch */
(function () {
  /**
   * Safe initializer called by index.html:
   *   loadTool("ipTool", "tools/ip-tool.html", initIPTool);
   */
  function initIpTool() {
    const scope = document.getElementById("ipTool");
    if (!scope) {
      console.warn("[IPTool] #ipTool container not found.");
      return;
    }

    // If the tool HTML hasn’t loaded yet (or was replaced), try to find core fields.
    const q = (sel) => scope.querySelector(sel);

    // ---------- Query elements inside #ipTool ----------
    // Calculator
    const ipv4Input   = q("#ipv4Input");
    const maskInput   = q("#maskInput");
    const prefixInput = q("#prefixInput");
    const calcBtn     = q("#calcBtn");
    const clearCalcBtn= q("#clearCalcBtn");

    const netAddr     = q("#netAddr");
    const bcastAddr   = q("#bcastAddr");
    const firstHost   = q("#firstHost");
    const lastHost    = q("#lastHost");
    const hostCount   = q("#hostCount");
    const maskOut     = q("#maskOut");
    const prefixOut   = q("#prefixOut");
    const wildcardOut = q("#wildcardOut");
    const classOut    = q("#classOut");
    const scopeOut    = q("#scopeOut");

    // Classification
    const ipClassInput= q("#ipClassInput");
    const classifyBtn = q("#classifyBtn");
    const clearClassBtn= q("#clearClassBtn");
    const verOut      = q("#verOut");
    const typeOut     = q("#typeOut");
    const specialOut  = q("#specialOut");

    // Geolocation
    const geoIpInput  = q("#geoIpInput");
    const geoProvider = q("#geoProvider");
    const ipinfoToken = q("#ipinfoToken");
    const geoBtn      = q("#geoBtn");
    const clearGeoBtn = q("#clearGeoBtn");
    const geoIp       = q("#geoIp");
    const geoCountry  = q("#geoCountry");
    const geoRegion   = q("#geoRegion");
    const geoCity     = q("#geoCity");
    const geoLatLng   = q("#geoLatLng");
    const geoASN      = q("#geoASN");
    const geoTZ       = q("#geoTZ");
    const geoMsg      = q("#geoMsg");

    // Minimal presence check (calculator core controls)
    if (!ipv4Input || !calcBtn) {
      console.warn("[IPTool] Tool HTML not present yet (core fields missing).");
      return;
    }

    console.log("[IPTool] init: wiring controls.");

    // ---------- IPv4 helpers ----------
    function parseIPv4(ip) {
      const m = String(ip || "").trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (!m) return null;
      const oct = m.slice(1).map(Number);
      if (oct.some((n) => n < 0 || n > 255)) return null;
      return oct;
    }
    function ipToInt(oct) {
      return ((oct[0] << 24) >>> 0) + (oct[1] << 16) + (oct[2] << 8) + oct[3];
    }
    function intToIp(n) {
      return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
    }
    function prefixToMask(pfx) {
      if (pfx < 0 || pfx > 32) return null;
      const mask = pfx === 0 ? 0 : (0xFFFFFFFF << (32 - pfx)) >>> 0;
      return intToIp(mask);
    }
    function maskToPrefix(maskStr) {
      const oct = parseIPv4(maskStr);
      if (!oct) return null;
      const n = ipToInt(oct);
      // Validate contiguous ones then zeros (mask integrity)
      const inv = (~n) >>> 0;
      if (((inv + 1) & inv) !== 0) return null; // non-contiguous zeros
      return (n.toString(2).match(/1/g) || []).length;
    }
    function ipv4Class(ipOct) {
      const f = ipOct[0];
      if (f <= 127) return "A";
      if (f <= 191) return "B";
      if (f <= 223) return "C";
      if (f <= 239) return "D (Multicast)";
      return "E (Reserved)";
    }
    function isPrivateIPv4(oct) {
      const n = ipToInt(oct);
      const inRange = (ip, start, end) => ip >= start && ip <= end;
      const tenStart = ipToInt([10, 0, 0, 0]),    tenEnd = ipToInt([10, 255, 255, 255]);
      const rfc172Start = ipToInt([172, 16, 0, 0]), rfc172End = ipToInt([172, 31, 255, 255]);
      const rfc192Start = ipToInt([192, 168, 0, 0]), rfc192End = ipToInt([192, 168, 255, 255]);
      return inRange(n, tenStart, tenEnd) || inRange(n, rfc172Start, rfc172End) || inRange(n, rfc192Start, rfc192End);
    }
    function specialIPv4Range(oct) {
      const n = ipToInt(oct);
      const inRange = (ip, start, end) => ip >= start && ip <= end;
      const ranges = [
        { name: "Loopback",        start: ipToInt([127, 0, 0, 0]),   end: ipToInt([127, 255, 255, 255]) },
        { name: "Link-Local (APIPA)", start: ipToInt([169, 254, 0, 0]), end: ipToInt([169, 254, 255, 255]) },
        { name: "TEST-NET (192.0.2.0/24)", start: ipToInt([192, 0, 2, 0]), end: ipToInt([192, 0, 2, 255]) },
        { name: "Benchmarking (198.18.0.0/15)", start: ipToInt([198, 18, 0, 0]), end: ipToInt([198, 19, 255, 255]) },
        { name: "Documentation (203.0.113.0/24)", start: ipToInt([203, 0, 113, 0]), end: ipToInt([203, 0, 113, 255]) }
      ];
      const hit = ranges.find(r => inRange(n, r.start, r.end));
      return hit ? hit.name : "";
    }

    // ---------- IPv6 helpers (classification only) ----------
    function isIPv6(ip) {
      return /^([0-9a-fA-F:]+)$/.test(String(ip || "").trim());
    }
    function classifyIPv6(ip) {
      const s = ip.toLowerCase();
      if (s === "::1") return { ver: "IPv6", type: "Loopback",     special: "::1" };
      if (s.startsWith("fe80:")) return { ver: "IPv6", type: "Link-Local",  special: "fe80::/10" };
      if (s.startsWith("fc") || s.startsWith("fd"))
        return { ver: "IPv6", type: "Unique Local", special: "fc00::/7" };
      if (s.startsWith("ff")) return { ver: "IPv6", type: "Multicast",   special: "ff00::/8" };
      return { ver: "IPv6", type: "Global Unicast", special: "" };
    }

    // ---------- Calculator wiring ----------
    calcBtn.addEventListener("click", () => {
      try {
        const ipOct = parseIPv4(ipv4Input.value);
        if (!ipOct) { alert("Invalid IPv4 address."); return; }

        let maskStr = (maskInput?.value || "").trim();
        let pfx = prefixInput?.value === "" ? null : Number(prefixInput?.value);

        if (maskStr && !pfx) {
          pfx = maskToPrefix(maskStr);
          if (pfx == null) { alert("Invalid subnet mask."); return; }
        } else if (pfx != null && !maskStr) {
          maskStr = prefixToMask(pfx);
        } else if (!maskStr && pfx == null) {
          // Default /24
          pfx = 24;
          maskStr = "255.255.255.0";
        }
        if (pfx < 0 || pfx > 32) { alert("Prefix must be 0–32."); return; }

        const ipInt = ipToInt(ipOct);
        const maskInt = ipToInt(parseIPv4(maskStr));
        const netInt = (ipInt & maskInt) >>> 0;
        const wildcardInt = (~maskInt) >>> 0;
        const bcastInt = (netInt | wildcardInt) >>> 0;

        const hostBits = 32 - pfx;
        let hosts, first, last;
        if (pfx === 32) {
          hosts = 1; first = intToIp(ipInt);   last = intToIp(ipInt);
        } else if (pfx === 31) {
          hosts = 2; first = intToIp(netInt);  last = intToIp(bcastInt); // RFC 3021
        } else {
          hosts = Math.max(0, (2 ** hostBits) - 2);
          first = intToIp((netInt + 1) >>> 0);
          last  = intToIp((bcastInt - 1) >>> 0);
        }

        netAddr     && (netAddr.textContent     = intToIp(netInt));
        bcastAddr   && (bcastAddr.textContent   = intToIp(bcastInt));
        firstHost   && (firstHost.textContent   = first);
        lastHost    && (lastHost.textContent    = last);
        hostCount   && (hostCount.textContent   = hosts.toLocaleString());
        maskOut     && (maskOut.textContent     = maskStr);
        prefixOut   && (prefixOut.textContent   = `/${pfx}`);
        wildcardOut && (wildcardOut.textContent = intToIp(wildcardInt));
        classOut    && (classOut.textContent    = ipv4Class(ipOct));
        scopeOut    && (scopeOut.textContent    = isPrivateIPv4(ipOct) ? "Private (RFC1918)" : "Public");
      } catch (e) {
        console.error("[IPTool] Calculator error:", e);
      }
    });

    clearCalcBtn && clearCalcBtn.addEventListener("click", () => {
      try {
        if (ipv4Input)   ipv4Input.value = "";
        if (maskInput)   maskInput.value = "";
        if (prefixInput) prefixInput.value = "";
        [netAddr,bcastAddr,firstHost,lastHost,hostCount,maskOut,prefixOut,wildcardOut,classOut,scopeOut]
          .forEach(el => el && (el.textContent = ""));
      } catch (e) {
        console.error("[IPTool] Clear calc error:", e);
      }
    });

    // ---------- Classification wiring ----------
    classifyBtn && classifyBtn.addEventListener("click", () => {
      try {
        const ip = String(ipClassInput?.value || "").trim();
        if (!ip) { alert("Enter an IP address."); return; }

        const oct = parseIPv4(ip);
        if (oct) {
          verOut      && (verOut.textContent = "IPv4");
          typeOut     && (typeOut.textContent = isPrivateIPv4(oct) ? "Private" : "Public");
          specialOut  && (specialOut.textContent = specialIPv4Range(oct));
          return;
        }
        if (isIPv6(ip)) {
          const info = classifyIPv6(ip);
          verOut      && (verOut.textContent = info.ver);
          typeOut     && (typeOut.textContent = info.type);
          specialOut  && (specialOut.textContent = info.special);
          return;
        }
        alert("Invalid IP address (neither IPv4 nor IPv6).");
      } catch (e) {
        console.error("[IPTool] Classification error:", e);
      }
    });

    clearClassBtn && clearClassBtn.addEventListener("click", () => {
      try {
        if (ipClassInput) ipClassInput.value = "";
        [verOut, typeOut, specialOut].forEach(el => el && (el.textContent = ""));
      } catch (e) {
        console.error("[IPTool] Clear class error:", e);
      }
    });

    // ---------- Geolocation wiring ----------
    async function geolocate() {
      if (!geoIp || !geoCountry || !geoRegion || !geoCity || !geoLatLng || !geoASN || !geoTZ || !geoMsg) {
        console.warn("[IPTool] Geolocation fields missing; skipping.");
        return;
      }
      try {
        geoMsg.textContent = "";
        const provider = geoProvider?.value || "ipapi";
        const ip = String(geoIpInput?.value || "").trim();

        if (provider === "ipapi") {
          // ipapi.co typically allows CORS; blank IP returns requester IP
          const url = ip ? `https://ipapi.co/${encodeURIComponent(ip)}/json/` : "https://ipapi.co/json/";
          const res = await fetch(url, { mode: "cors" });
          if (!res.ok) throw new Error(`ipapi.co HTTP ${res.status}`);
          const data = await res.json();

          geoIp.textContent      = data.ip || ip || "";
          geoCountry.textContent = data.country_name || data.country || "";
          geoRegion.textContent  = data.region || data.region_code || "";
          geoCity.textContent    = data.city || "";
          geoLatLng.textContent  = (data.latitude && data.longitude) ? `${data.latitude}, ${data.longitude}` : "";
          geoASN.textContent     = data.org || data.asn || "";
          geoTZ.textContent      = data.timezone || "";
        } else if (provider === "ipinfo") {
          const token = String(ipinfoToken?.value || "").trim();
          if (!token) { geoMsg.textContent = "ipinfo.io requires a token."; return; }
          const url = ip ? `https://ipinfo.io/${encodeURIComponent(ip)}?token=${encodeURIComponent(token)}`
                         : `https://ipinfo.io/json?token=${encodeURIComponent(token)}`;
          const res = await fetch(url, { mode: "cors" });
          if (!res.ok) throw new Error(`ipinfo.io HTTP ${res.status}`);
          const data = await res.json();

          geoIp.textContent      = data.ip || ip || "";
          geoCountry.textContent = data.country || "";
          geoRegion.textContent  = data.region || "";
          geoCity.textContent    = data.city || "";
          geoLatLng.textContent  = data.loc || "";
          geoASN.textContent     = data.org || "";
          geoTZ.textContent      = data.timezone || "";
        }
      } catch (e) {
        geoMsg.textContent = `Geolocation error: ${e.message}. (Check CORS / network / token)`;
        console.error("[IPTool] Geolocation error:", e);
      }
    }

    geoBtn && geoBtn.addEventListener("click", geolocate);
    clearGeoBtn && clearGeoBtn.addEventListener("click", () => {
      try {
        if (geoIpInput) geoIpInput.value = "";
        [geoIp, geoCountry, geoRegion, geoCity, geoLatLng, geoASN, geoTZ].forEach(el => el && (el.textContent = ""));
        geoMsg && (geoMsg.textContent = "");
      } catch (e) {
        console.error("[IPTool] Clear geo error:", e);
      }
    });

    console.log("[IPTool] wiring complete.");
  }

  // ---- Export the name your loader expects (and camelCase alias) ----
  window.initIPTool = function () {
    try { initIpTool(); } catch (e) { console.error("[IPTool] init error:", e); }
  };
  window.initIpTool = window.initIPTool;
})();
