// Record column (area pages, desktop): the left column is position: sticky.
// When it is shorter than the window it sticks just below the header. When it
// is taller, it scrolls with the page until its foot is in view and then
// sticks there, so the last package and the email button are never out of
// reach. Below the desktop breakpoint the column is part of the page flow and
// this script does nothing.
(function () {
  'use strict';
  var col = document.querySelector('.record-col');
  if (!col || !window.matchMedia) return;
  var mq = window.matchMedia('(min-width: 64em)');
  var header = document.querySelector('.site-header');
  var GAP = 32;
  var raf = null;

  function update() {
    raf = null;
    if (!mq.matches) { col.style.top = ''; return; }
    var hh = header ? header.getBoundingClientRect().height : 72;
    var h = col.offsetHeight;
    var vh = window.innerHeight;
    var top = (hh + GAP + h + GAP <= vh) ? hh + GAP : vh - h - GAP;
    col.style.top = Math.round(top) + 'px';
  }
  function schedule() { if (raf === null) raf = window.requestAnimationFrame(update); }

  update();
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  if (mq.addEventListener) mq.addEventListener('change', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
})();
