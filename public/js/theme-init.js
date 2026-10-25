// Runs before first paint: a blocking script, first in <head>. Never give it
// defer or async, or the wrong theme flashes. Dark is the default in the CSS;
// this only applies a saved choice of light.
(function () {
  try {
    if (localStorage.getItem('theme') === 'light') document.documentElement.setAttribute('data-theme', 'light');
  } catch (e) { /* storage blocked: stay dark */ }
})();
