// The theme button. Dark is the default for everyone; the button switches to
// light and saves that choice, and switching back to dark clears it. The
// device's own setting is not consulted. Without this script the button
// stays hidden and the site stays dark.
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;

  function current() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }

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
    if (current() === 'dark') {
      root.setAttribute('data-theme', 'light');
      store('light');
    } else {
      root.removeAttribute('data-theme');
      store(null);
    }
    label();
  });

  label();
  btn.hidden = false;
})();
