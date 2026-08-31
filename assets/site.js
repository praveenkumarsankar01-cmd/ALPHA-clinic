/* ════════════════════════════════════════════════════════════
   ALPHA CLINIC — shared UI layer
   Plain script, zero imports. Loaded by every page.
   Kept deliberately separate from the Firebase module so a blocked
   or slow CDN can never stop the reveal code and leave a page at
   opacity:0. Every lookup is guarded: service pages have no booking
   form, and this file must run clean there too.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  var $  = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  // ── Header state ────────────────────────────────────────
  var hdr = $('#hdr');
  if (hdr) {
    addEventListener('scroll', function () {
      hdr.classList.toggle('compact', scrollY > 40);
    }, { passive: true });
  }

  // ── Mega dropdowns (Services, Team) ─────────────────────
  var megaParents = ['#svcParent', '#teamParent'].map($).filter(Boolean);
  megaParents.forEach(function (parent) {
    parent.addEventListener('mouseenter', function () {
      // only one panel open at a time
      megaParents.forEach(function (p) { p.classList.remove('open'); });
      parent.classList.add('open');
    });
    parent.addEventListener('mouseleave', function () { parent.classList.remove('open'); });
    var top = parent.querySelector('a');
    if (top) {
      top.addEventListener('click', function (e) {
        // On touch devices the first tap opens the panel instead of navigating.
        if (matchMedia('(hover: none)').matches && !parent.classList.contains('open')) {
          e.preventDefault();
          megaParents.forEach(function (p) { p.classList.remove('open'); });
          parent.classList.add('open');
        }
      });
    }
  });
  if (megaParents.length) {
    document.addEventListener('click', function (e) {
      megaParents.forEach(function (p) {
        if (!p.contains(e.target)) p.classList.remove('open');
      });
    });
  }

  // ── Mobile drawer ───────────────────────────────────────
  var mnav = $('#mnav'), scrim = $('#scrim'), burger = $('#burger'), mclose = $('#mclose');
  if (mnav && scrim) {
    var openNav  = function () { mnav.classList.add('open');    scrim.classList.add('on');    document.body.style.overflow = 'hidden'; };
    var closeNav = function () { mnav.classList.remove('open'); scrim.classList.remove('on'); document.body.style.overflow = ''; };
    if (burger) burger.addEventListener('click', openNav);
    if (mclose) mclose.addEventListener('click', closeNav);
    scrim.addEventListener('click', closeNav);
    mnav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeNav); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });

    // Accordion sections in the drawer (Services, Team).
    [['#mToggle', '#mSub'], ['#mToggle2', '#mSub2']].forEach(function (pair) {
      var btn = $(pair[0]), sub = $(pair[1]);
      if (btn && sub) btn.addEventListener('click', function () { sub.classList.toggle('open'); });
    });
  }

  // ── Featured treatments carousel ────────────────────────
  var rail = $('#featRail');
  if (rail) {
    var prev = $('#featPrev'), next = $('#featNext');
    var step = function () {
      var card = rail.querySelector('.feat-card');
      return card ? card.getBoundingClientRect().width + 26 : 300;
    };
    var syncArrows = function () {
      if (!prev || !next) return;
      prev.disabled = rail.scrollLeft <= 4;
      next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
    };
    if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { rail.scrollBy({ left:  step(), behavior: 'smooth' }); });
    rail.addEventListener('scroll', syncArrows, { passive: true });
    addEventListener('resize', syncArrows);
    syncArrows();
  }

  // ── Hero video ──────────────────────────────────────────
  var heroVid = $('#heroVid');
  if (heroVid) {
    // Autoplay is only permitted while muted; if the browser still refuses
    // (data-saver, reduced motion), fall back to the poster frame rather
    // than leaving a dead black box.
    var play = heroVid.play();
    if (play && play.catch) play.catch(function () { heroVid.controls = true; });

    var muteBtn = $('#vidMute');
    if (muteBtn) {
      muteBtn.addEventListener('click', function () {
        heroVid.muted = !heroVid.muted;
        muteBtn.innerHTML = heroVid.muted
          ? '<i class="fas fa-volume-xmark"></i>'
          : '<i class="fas fa-volume-high"></i>';
        muteBtn.setAttribute('aria-label', heroVid.muted ? 'Unmute video' : 'Mute video');
        if (!heroVid.muted) heroVid.play();
      });
    }
    // Don't burn battery/data on a video nobody is looking at.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { heroVid.play().catch(function () {}); }
          else if (!heroVid.paused) heroVid.pause();
        });
      }, { threshold: 0.15 }).observe(heroVid);
    }
  }

  // ── Reveal on scroll ────────────────────────────────────
  var revealTargets = $$('.rv');

  // Anything already in view is revealed on the next frame rather than
  // waiting for the observer: the hero must never depend on an
  // IntersectionObserver callback to become visible. Deferring by one
  // frame lets the opacity:0 state paint first, so the transition still
  // plays. innerHeight can be 0 in a background/prerendered tab, hence
  // the fallback height.
  var revealInView = function () {
    var vh = innerHeight || 800;
    revealTargets.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.classList.add('in');
    });
  };
  requestAnimationFrame(function () { requestAnimationFrame(revealInView); });

  if ('IntersectionObserver' in window) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        setTimeout(function () { entry.target.classList.add('in'); }, (i % 4) * 90);
        revealer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px' });
    revealTargets.forEach(function (el) { revealer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('in'); });
  }

  // Scroll companion to the observer. IntersectionObserver does not fire in
  // a background or prerendered tab, and a section that silently never
  // appears is far worse than one cheap rect check per scroll. Detaches
  // itself once everything has been revealed.
  var onScrollReveal = function () {
    revealInView();
    var done = revealTargets.every(function (el) { return el.classList.contains('in'); });
    if (done) removeEventListener('scroll', onScrollReveal);
  };
  addEventListener('scroll', onScrollReveal, { passive: true });
  // Last-resort guard — nothing on this site may stay invisible.
  // A page opened into a background tab (or prerendered) reports
  // visibilityState 'hidden' and innerHeight 0, and IntersectionObserver
  // never fires there. Comparing against innerHeight would make this
  // fallback a silent no-op in exactly the case it exists for, so when the
  // viewport has no height we simply reveal everything.
  var revealAll = function () {
    revealTargets.forEach(function (el) { el.classList.add('in'); });
  };
  addEventListener('load', function () {
    setTimeout(function () {
      if (!innerHeight) { revealAll(); return; }
      revealTargets.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) el.classList.add('in');
      });
    }, 1200);
  });
  // If the tab is shown later, let the observer catch up; anything still
  // hidden a moment after that gets revealed outright.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    setTimeout(function () {
      revealTargets.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) el.classList.add('in');
      });
    }, 400);
  });

  // ── Stat counters ───────────────────────────────────────
  var counters = $$('.count');
  if (counters.length && 'IntersectionObserver' in window) {
    var counterObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target, target = +el.dataset.target;
        var started = performance.now(), dur = 1500;
        var tick = function (now) {
          var p = Math.min((now - started) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString('en-IN') + '+';
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        counterObs.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { counterObs.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = (+el.dataset.target).toLocaleString('en-IN') + '+'; });
  }

  // ── FAQ accordions (service pages) ──────────────────────
  $$('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q'), a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', function () {
      var open = item.classList.toggle('open');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : 0;
    });
  });

  // ── Footer year ─────────────────────────────────────────
  var yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // ── Booking-page only below ─────────────────────────────
  var bookingForm = $('#bookingForm');
  if (!bookingForm) return;

  var modal = $('#successModal');
  if (modal) {
    var close = $('#modalClose');
    if (close) close.addEventListener('click', function () { modal.classList.remove('active'); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.classList.remove('active'); });
  }

  // Local date, not toISOString() — that returns UTC, which is a day
  // behind IST for most of the evening and would let a patient in
  // Chennai pick a date that has already passed.
  var todayLocal = function () {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  };
  window.__alphaToday = todayLocal;

  var dateInput = $('#f-date');
  if (dateInput) dateInput.min = todayLocal();

  // Preselect service/doctor when arriving from a service or profile page
  // (…/index.html?service=Dental%20Care#book, ?doctor=Dr.%20Priya%20Sharma).
  var params = new URLSearchParams(location.search);
  var preselect = function (sel, wanted) {
    if (!sel || !wanted) return;
    sel.querySelectorAll('option').forEach(function (o) {
      // compare on decoded text; option labels carry entities like &amp;
      if (o.text.trim().toLowerCase() === wanted.trim().toLowerCase()) {
        sel.value = o.value || o.text;
      }
    });
  };
  preselect($('#f-service'), params.get('service'));
  preselect($('#f-doctor'),  params.get('doctor'));

  // ── Booking safety net ──────────────────────────────────
  // If the Firebase module never loads (CDN blocked, offline, strict
  // network), the form must still reach the clinic instead of silently
  // reloading the page and losing the enquiry.
  bookingForm.addEventListener('submit', function (e) {
    if (window.__alphaFirebaseReady) return;      // module owns the submit
    e.preventDefault();
    if (!bookingForm.checkValidity()) { bookingForm.reportValidity(); return; }
    var f = new FormData(bookingForm);
    var msg = '*NEW APPOINTMENT - ALPHA CLINIC*%0A%0A' +
      '*Name:* ' + f.get('name') + '%0A*Age:* ' + f.get('age') + '%0A' +
      '*Phone:* ' + f.get('phone') + '%0A*Email:* ' + f.get('email') + '%0A' +
      '*Service:* ' + f.get('service') + '%0A*Doctor:* ' + f.get('doctor') + '%0A' +
      '*Date:* ' + f.get('date') + '%0A*Time:* ' + f.get('time') + '%0A' +
      '*Symptoms:* ' + (f.get('symptoms') || '-');
    window.open('https://wa.me/919092543740?text=' + msg, '_blank');
    if (modal) modal.classList.add('active');
    bookingForm.reset();
    if (dateInput) dateInput.min = todayLocal();
  });

  // Nodes the Firebase module needs.
  window.__alphaUI = { modal: modal, dateInput: dateInput };
})();
