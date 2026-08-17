document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  function closeNav() {
    nav.classList.remove('mobile-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-locked');
  }

  toggle.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('mobile-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.classList.toggle('nav-locked', isOpen);
  });

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) closeNav();
  });
});
