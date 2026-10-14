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
    // Never write 0px. If this runs before the header has laid out (fonts still
    // loading, logo not yet decoded), offsetHeight reads 0 — and writing that
    // literal zero defeats the 118px fallback in the stylesheet, collapsing the
    // top padding on .case-header and .page-intro so the fixed header sits over
    // the eyebrow and cuts through the first line of the H1. Leaving the
    // property unset lets the fallback hold until a real measurement exists.
    var h = header.offsetHeight;
    if (!h) {
      // Re-measure after layout settles, then again once webfonts land.
      requestAnimationFrame(updateHeaderHeight);
      return;
    }
    document.documentElement.style.setProperty('--header-height', h + 'px');
  }
  updateHeaderHeight();
  window.addEventListener('load', updateHeaderHeight);
  window.addEventListener('resize', updateHeaderHeight);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateHeaderHeight);
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

  // --- Focus while the menu is open ----------------------------------------
  // The open menu covers the whole screen, so keyboard and screen-reader users
  // are kept inside it: everything else in <body> (skip link, <main>, footer)
  // goes inert, focus moves to the first menu link, Tab and Shift+Tab cycle
  // through the menu links and the close button, and closing hands focus back
  // to the toggle.
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a'));
  var trapItems = navLinks.concat([toggle]); // DOM order: links, then the toggle
  var inertEls = [];

  function setPageInert(on) {
    if (on) {
      inertEls = Array.prototype.filter.call(document.body.children, function (el) {
        return el !== header && el.tagName !== 'SCRIPT' && !el.hasAttribute('inert');
      });
      inertEls.forEach(function (el) { el.setAttribute('inert', ''); });
    } else {
      inertEls.forEach(function (el) { el.removeAttribute('inert'); });
      inertEls = [];
    }
  }

  function focusEl(el) {
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  function openNav() {
    header.classList.add('nav-open');
    nav.classList.add('mobile-open');
    toggle.setAttribute('aria-expanded', 'true');
    lockScroll();
    setPageInert(true);
    if (navLinks.length) focusEl(navLinks[0]);
  }

  // returnFocus: false only when the menu closes because the viewport grew
  // past the breakpoint, where the toggle itself is hidden.
  function closeNav(returnFocus) {
    if (!header.classList.contains('nav-open')) return;
    header.classList.remove('nav-open');
    nav.classList.remove('mobile-open');
    toggle.setAttribute('aria-expanded', 'false');
    setPageInert(false);
    unlockScroll();
    updateHeaderHeight();
    if (returnFocus !== false) focusEl(toggle);
  }

  toggle.addEventListener('click', function () {
    if (header.classList.contains('nav-open')) closeNav();
    else openNav();
  });

  navLinks.forEach(function (link) {
    link.addEventListener('click', function () { closeNav(); });
  });

  document.addEventListener('keydown', function (e) {
    if (!header.classList.contains('nav-open')) return;
    if (e.key === 'Escape') { closeNav(); return; }
    if (e.key !== 'Tab') return;
    var first = trapItems[0];
    var last = trapItems[trapItems.length - 1];
    var i = trapItems.indexOf(document.activeElement);
    if (i === -1) { e.preventDefault(); focusEl(e.shiftKey ? last : first); }
    else if (e.shiftKey && i === 0) { e.preventDefault(); focusEl(last); }
    else if (!e.shiftKey && i === trapItems.length - 1) { e.preventDefault(); focusEl(first); }
  });

  window.addEventListener('resize', function () {
    // Close only once the full navigation row has taken over, which is when
    // the toggle itself is hidden. Reading the toggle's computed display keeps
    // this in step with whichever stylesheet the page uses (style.css switches
    // at 1120px, site.css at 64em) without a hard-coded number. On tablets the
    // address bar hiding fires resize, so the menu must not shut itself while
    // the toggle is still showing.
    if (window.getComputedStyle(toggle).display === 'none') closeNav(false);
  });
});
