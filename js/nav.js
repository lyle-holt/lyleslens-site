document.addEventListener('DOMContentLoaded', function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  var scrollLockY = 0;

  // --- Header height -------------------------------------------------------
  // Keeps --header-height in sync with the header's real rendered height so
  // content below the fixed header (case-header, page-intro) always clears it
  // on every breakpoint. Measured on load, on resize, and once the header's
  // own padding transition finishes — deliberately NOT on every scroll event:
  // writing a custom property mid-scroll forces a synchronous layout of the
  // whole page on each frame, which on lower-powered Android handsets makes
  // the fixed header lag, flicker, or drop out of the repaint while scrolling.
  function updateHeaderHeight() {
    if (!header) return;
    // While the menu is open the header fills the screen; measuring then would
    // push every page's top padding down by a full viewport height.
    if (header.classList.contains('nav-open')) return;
    document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
  }
  updateHeaderHeight();
  window.addEventListener('resize', updateHeaderHeight);
  if (header) header.addEventListener('transitionend', updateHeaderHeight);

  // --- Scrolled state ------------------------------------------------------
  // The header is fixed on every page so its links stay reachable while
  // scrolling. On the default (hero) header it starts transparent over the
  // hero image; past a small scroll threshold it picks up .is-static, giving
  // it a subdued solid bar so it stays legible without overpowering the page.
  // .on-light headers (About, Evidence, Women's Sport) are solid from the
  // start and only pick up a subtle shadow.
  if (header) {
    var scrollThreshold = 24;
    var ticking = false;
    function applyScrolledState() {
      ticking = false;
      header.classList.toggle('is-static', window.scrollY > scrollThreshold);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(applyScrolledState);
    }
    applyScrolledState();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // --- Mobile menu ---------------------------------------------------------
  // Opening adds .nav-open to the header, which expands the (already fixed)
  // header to fill the screen and lays the nav out inside it in normal flow.
  // No second fixed element is involved, so there is nothing for mobile
  // Safari to mis-resolve.
  if (!toggle || !nav || !header) return;

  function lockScroll() {
    scrollLockY = window.scrollY || window.pageYOffset || 0;
    // overflow:hidden alone does not stop the page scrolling behind an overlay
    // on iOS Safari — pinning the body is what actually holds it still.
    document.body.style.position = 'fixed';
    document.body.style.top = (-scrollLockY) + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.classList.add('nav-locked');
  }

  function unlockScroll() {
    document.body.classList.remove('nav-locked');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollLockY);
  }

  function openNav() {
    header.classList.add('nav-open');
    nav.classList.add('mobile-open');
    toggle.setAttribute('aria-expanded', 'true');
    lockScroll();
  }

  function closeNav() {
    if (!header.classList.contains('nav-open')) return;
    header.classList.remove('nav-open');
    nav.classList.remove('mobile-open');
    toggle.setAttribute('aria-expanded', 'false');
    unlockScroll();
    updateHeaderHeight();
  }

  toggle.addEventListener('click', function () {
    if (header.classList.contains('nav-open')) closeNav();
    else openNav();
  });

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  window.addEventListener('resize', function () {
    // Must match the nav breakpoint in style.css (max-width: 1180px). When this
    // said 900 the overlay was the only nav between 901 and 1180px, yet any
    // resize event closed it — and on tablets the address bar hiding fires
    // resize, so the menu shut itself mid-tap.
    if (window.innerWidth > 1180) closeNav();
  });
});
