// Runs before first paint: a blocking script, first in <head>. Never give it
// defer or async, or the wrong theme flashes. Applies a saved choice; with
// none saved, the CSS follows the device setting on its own.
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  } catch (e) { /* storage blocked: follow the device */ }
})();
