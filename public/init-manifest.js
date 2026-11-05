(function () {
  var path = window.location.pathname || '';
  var slug = path.replace(/^\//, '').split('/')[0];
  if (slug && slug !== 'admin') {
    var link = document.getElementById('pwa-manifest') || document.querySelector('link[rel="manifest"]');
    if (link) link.setAttribute('href', '/manifest/' + slug + '.json');
  }
})();