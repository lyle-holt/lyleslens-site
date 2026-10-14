// Films on the area pages. Each <figure class="film"> holds a <video> with
// native controls and a hidden "Play" button. With JavaScript the controls
// are removed at rest and the button shows over the first frame; pressing it
// turns the native controls on, starts the film and moves focus to the video
// so keyboard users can reach the controls. Without JavaScript the native
// controls simply stay. Nothing autoplays.
(function () {
  'use strict';
  var figs = document.querySelectorAll('figure.film');
  Array.prototype.forEach.call(figs, function (fig) {
    var video = fig.querySelector('video');
    var btn = fig.querySelector('.film-play');
    if (!video || !btn) return;
    video.controls = false;
    btn.hidden = false;
    btn.addEventListener('click', function () {
      fig.classList.add('is-playing');
      video.controls = true;
      var p = video.play();
      if (p && typeof p.catch === 'function') p.catch(function () { /* native controls remain */ });
      try { video.focus({ preventScroll: true }); } catch (e) { video.focus(); }
    });
  });
})();
