// The Day — homepage film (2026-09-12). Loaded on the homepage only, after nav.js.
//
// The film sits inside the "Your organisation already has photographs."
// section with no heading, lede or CTA of its own. It never autoplays. The
// poster overlay (a real button) is the only control at rest; native controls
// are enabled once the reader presses Play and removed again when the poster
// state is restored at the end. "Play with captions" starts the same file from
// 0:00 with the English caption track showing; plain Play leaves captions off,
// as the film was designed (the track carries no `default` attribute).
//
// Header protection: the site header is position:fixed and stays pinned while
// scrolling (nav.js toggles .is-static). While the film is actively playing
// inline and its rectangle overlaps the header band, the header is suppressed
// (.is-hidden-for-film, visibility:hidden) so the film's day words are never
// covered. Pause, end, fullscreen and leaving the overlap all restore it. The
// two behaviours are independent; nothing here touches .is-static.
//
// Analytics: GA4 events per THE-DAY handover, verification/ANALYTICS-EVENTS.md,
// each at most once per play session, sent through the page's existing gtag.
(function () {
  'use strict';

  var fig = document.getElementById('the-day');
  if (!fig) return;
  var video = fig.querySelector('.film-video');
  var playBtn = fig.querySelector('.film-play');
  var captionsBtn = fig.querySelector('.film-captions');
  var header = document.querySelector('.site-header');
  if (!video || !playBtn || !captionsBtn) return;

  var NARRATION_END = 123.1;   // 2:03.1, end of the narration (the remaining 16.5 s is the silent end sequence)
  var FILM_DURATION = 139.6;   // fallback until metadata has loaded
  var POSTER_FADE_MS = 250;
  var HIDDEN_CLASS = 'is-hidden-for-film';
  var marks = {};              // per-play-session "already sent" flags
  var captionMode = 'off';
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  // --- Caption track -------------------------------------------------------
  function captionTrack() {
    var tracks = video.textTracks;
    if (!tracks) return null;
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].kind === 'captions') return tracks[i];
    }
    return null;
  }
  function setCaptions(on) {
    var track = captionTrack();
    if (track) track.mode = on ? 'showing' : 'disabled';
  }

  // --- Analytics -----------------------------------------------------------
  function send(name, params) {
    if (typeof gtag !== 'function') return;
    var payload = { video_id: 'the_day', caption_mode: captionMode };
    if (params) for (var k in params) if (Object.prototype.hasOwnProperty.call(params, k)) payload[k] = params[k];
    gtag('event', name, payload);
  }

  // --- Play ----------------------------------------------------------------
  function start(withCaptions) {
    captionMode = withCaptions ? 'on' : 'off';
    marks = {};
    fig.classList.remove('is-ending');
    fig.classList.add('is-playing');       // hides the overlay and takes it out of the tab order
    video.controls = true;                 // native controls are the only controls from here
    setCaptions(withCaptions);
    if (video.currentTime) {
      try { video.currentTime = 0; } catch (e) { /* not seekable yet; load() below covers it */ }
    }
    var p = video.play();
    if (p && typeof p.catch === 'function') p.catch(function () { /* the reader can use the native controls */ });
    // Keyboard users: focus moves to the video so the native controls are reachable.
    try { video.focus({ preventScroll: true }); } catch (e) { video.focus(); }
    // Some browsers reset track modes when playback (re)starts from a reset element.
    setCaptions(withCaptions);
  }
  playBtn.addEventListener('click', function () { start(false); });
  captionsBtn.addEventListener('click', function () { start(true); });

  // --- Progress events -------------------------------------------------------
  video.addEventListener('play', function () {
    if (!marks.play) {
      marks.play = true;
      send('video_play', { video_duration: FILM_DURATION });
    }
    armHeader();
  });
  video.addEventListener('timeupdate', function () {
    var d = (isFinite(video.duration) && video.duration > 0) ? video.duration : FILM_DURATION;
    var t = video.currentTime;
    [25, 50, 75].forEach(function (pct) {
      if (!marks['p' + pct] && t >= d * pct / 100) {
        marks['p' + pct] = true;
        send('video_progress', { video_percent: pct });
      }
    });
    if (!marks.narration && t >= NARRATION_END) {
      marks.narration = true;
      send('video_narration_complete');
    }
  });

  // --- End: restore the poster state -----------------------------------------
  video.addEventListener('ended', function () {
    if (!marks.complete) {
      marks.complete = true;
      send('video_complete');
    }
    releaseHeader();
    // The video stays at its final black frame while it fades out over the
    // poster painted on .film-frame; once the poster is opaque, reset.
    fig.classList.add('is-ending');
    var restore = function () {
      video.controls = false;
      try { video.currentTime = 0; } catch (e) { /* load() resets it anyway */ }
      video.load();                       // back to the poster attribute, metadata only
      fig.classList.remove('is-playing');
      fig.classList.remove('is-ending');
      try { playBtn.focus({ preventScroll: true }); } catch (e) { playBtn.focus(); }
    };
    if (reducedMotion && reducedMotion.matches) restore();
    else window.setTimeout(restore, POSTER_FADE_MS + 10);
  });

  // --- Header protection -------------------------------------------------------
  if (!header) return;

  var raf = null;
  var armed = false;

  function inFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || video.webkitDisplayingFullscreen);
  }
  function overlapping() {
    var h = header.getBoundingClientRect();
    var v = video.getBoundingClientRect();
    if (h.height === 0 || v.height === 0) return false;
    return v.top < h.bottom && v.bottom > h.top;
  }
  function shouldHide() {
    return armed &&
      !video.paused && !video.ended &&
      !inFullscreen() &&
      !header.classList.contains('nav-open') &&
      overlapping();
  }
  function check() {
    raf = null;
    header.classList.toggle(HIDDEN_CLASS, shouldHide());
  }
  function schedule() {
    if (raf === null) raf = window.requestAnimationFrame(check);
  }
  function armHeader() {
    if (armed) { check(); return; }
    armed = true;
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    check();
  }
  function releaseHeader() {
    if (!armed) return;
    armed = false;
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    if (raf !== null) { window.cancelAnimationFrame(raf); raf = null; }
    header.classList.remove(HIDDEN_CLASS);
  }

  video.addEventListener('pause', releaseHeader);           // also fires just before `ended`
  // Fullscreen in and out: standard event, WebKit's document event, and the
  // iOS video-element events (iOS has no document.fullscreenElement).
  document.addEventListener('fullscreenchange', schedule);
  document.addEventListener('webkitfullscreenchange', schedule);
  video.addEventListener('webkitbeginfullscreen', schedule);
  video.addEventListener('webkitendfullscreen', function () { window.setTimeout(check, 50); });
  // Rotation: the viewport settles a frame or two after the event.
  window.addEventListener('orientationchange', function () { window.setTimeout(schedule, 300); });
  // Leaving the page mid-play (tab switch) pauses nothing, but the header
  // must never be left hidden if playback stops for any other reason.
  video.addEventListener('emptied', releaseHeader);
  video.addEventListener('error', releaseHeader);
})();
