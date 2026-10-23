// Inlined into <head> by BaseLayout so the theme applies before first paint.
// Plain ES5 on purpose: it is not bundled. Storage access is wrapped because it can throw (private mode, blocked site data).
(function () {
  var KEY = 'theme';
  var root = document.documentElement;

  function stored() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* the choice lasts for this page only */ }
  }
  function preferred() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function apply(theme) {
    root.setAttribute('data-theme', theme);
    var button = document.querySelector('[data-theme-toggle]');
    if (button) button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  function chosen() {
    var saved = stored();
    return saved === 'dark' || saved === 'light' ? saved : null;
  }

  apply(chosen() || preferred());

  // Follow a live system change until the visitor picks a theme themselves.
  if (window.matchMedia) {
    var media = window.matchMedia('(prefers-color-scheme: dark)');
    if (media.addEventListener) {
      media.addEventListener('change', function () {
        if (!chosen()) apply(preferred());
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    button.hidden = false;
    apply(root.getAttribute('data-theme'));
    button.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      save(next);
    });
  });
})();
