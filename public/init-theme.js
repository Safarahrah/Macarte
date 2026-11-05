(function () {
  var stored = localStorage.getItem('darkMode');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var shouldBeDark = stored === 'true' || (stored === null && prefersDark);
  if (shouldBeDark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
})();