document.addEventListener('DOMContentLoaded', function () {
  var header = document.querySelector('.site-header');

  // Keep --header-height in sync with the header's real rendered height so
  // fixed-position content below it (case-header, page-intro) always clears
  // it exactly, on every breakpoint and in both its normal and .is-static
  // (scrolled) states.
  function updateHeaderHeight() {
    if (!header) return;
    document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
  }
  updateHeaderHeight();
  window.addEventListener('resize', updateHeaderHeight);

  // The header is fixed on every page so its links stay reachable while
  // scrolling. On the default (hero) header it starts transparent over the
  // hero image; past a small scroll threshold it picks up .is-static, which
  // gives it a subdued translucent background so it stays legible without
  // overpowering the page. .on-light headers (About, Evidence, Women's
  // Sport) are solid from the start and only pick up a subtle shadow.
  if (header) {
    var scrollThreshold = 24;
    function updateScrolledState() {
      var scrolled = window.scrollY > scrollThreshold;
      header.classList.toggle('is-static', scrolled);
    }
    updateScrolledState();
    window.addEventListener('scroll', updateScrolledState, { passive: true });
    // Header height can change once .is-static applies its own (smaller)
    // padding, so re-measure after the class toggles.
    window.addEventListener('scroll', updateHeaderHeight, { passive: true });
  }

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
