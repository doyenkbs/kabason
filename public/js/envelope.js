// The "Stop animation" button under the account card. The envelope loops, and
// WCAG 2.2.2 requires a way to stop motion that runs longer than 5 seconds.
// Stopping removes the animations and leaves the real card showing; playing
// starts the cycle again from the top. The choice is remembered. Without this
// script the button stays hidden; with reduced motion the CSS hides it and
// nothing animates anyway.
(function () {
  var stage = document.getElementById('ac-stage');
  var btn = document.getElementById('anim-toggle');
  if (!stage || !btn) return;
  var label = btn.querySelector('.anim-label');

  function set(still) {
    stage.classList.toggle('is-still', still);
    btn.setAttribute('aria-pressed', still ? 'true' : 'false');
    label.textContent = still ? 'Play animation' : 'Stop animation';
    try {
      if (still) localStorage.setItem('envelope', 'still');
      else localStorage.removeItem('envelope');
    } catch (e) { /* storage blocked: the choice lasts for this page only */ }
  }

  var saved = null;
  try { saved = localStorage.getItem('envelope'); } catch (e) { /* blocked */ }
  set(saved === 'still');

  btn.addEventListener('click', function () {
    set(!stage.classList.contains('is-still'));
  });
  btn.hidden = false;
})();
