// The theme button. It flips light and dark and saves the choice. Choosing the
// theme the device already uses clears the saved choice, so the site goes back
// to following the device. Without this script the button stays hidden.
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function device() { return media.matches ? 'dark' : 'light'; }
  function current() { return root.getAttribute('data-theme') || device(); }

  function store(value) {
    try {
      if (value) localStorage.setItem('theme', value);
      else localStorage.removeItem('theme');
    } catch (e) { /* storage blocked: the choice lasts for this page only */ }
  }

  function label() {
    var text = 'Switch to ' + (current() === 'dark' ? 'light' : 'dark') + ' theme';
    btn.setAttribute('aria-label', text);
    btn.title = text;
  }

  btn.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    if (next === device()) {
      root.removeAttribute('data-theme');
      store(null);
    } else {
      root.setAttribute('data-theme', next);
      store(next);
    }
    label();
  });

  if (media.addEventListener) media.addEventListener('change', label);
  else if (media.addListener) media.addListener(label);

  label();
  btn.hidden = false;
})();
