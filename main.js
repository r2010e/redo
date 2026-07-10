/* ============================================================
   ISIN Law Firms — main.js
   Lenis smooth scroll + GSAP/ScrollTrigger timelines.
   The video's currentTime is NEVER touched.
   ============================================================ */
(function () {
  'use strict';

  // Footer year in Arabic-Indic numerals
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toLocaleString('ar-EG', { useGrouping: false });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ensure the looping videos are actually playing (autoplay can be blocked on some engines)
  document.querySelectorAll('video').forEach(function (v) {
    var p = v.play();
    if (p && typeof p.catch === 'function') { p.catch(function () {}); }
  });

  if (reduceMotion) {
    // Reduced motion: no transforms, no smooth scroll. Video still plays. Everything simply shows.
    return;
  }

  window.addEventListener('load', init);
  // If already loaded (defer), fire immediately
  if (document.readyState === 'complete') { /* load listener above still queues */ }

  function init() {
    if (typeof gsap === 'undefined') { return; }
    if (window.ScrollTrigger) { gsap.registerPlugin(ScrollTrigger); }

    /* ---------- Lenis smooth scroll ---------- */
    var lenis = null;
    if (typeof Lenis !== 'undefined') {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
      lenis.on('scroll', function () { if (window.ScrollTrigger) ScrollTrigger.update(); });
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    /* ---------- Load sequence (~1.4s) ---------- */
    var intro = gsap.timeline();
    // 1. grid rules draw in from anchor edges
    intro.from('.grid-rules .vrule', { scaleY: 0, transformOrigin: 'top', duration: 0.6, stagger: 0.08, ease: 'power2.out' }, 0)
         .from('.grid-rules .hrule', { scaleX: 0, transformOrigin: 'right', duration: 0.6, stagger: 0.08, ease: 'power2.out' }, 0)
    // 2. corner labels fade up
         .from('.hero-top > *, .hero-subject, .hero-geo, .hero-vlabel', { autoAlpha: 0, y: 10, duration: 0.3, stagger: 0.04, ease: 'power2.out' }, 0.35)
    // 3. arch scales from 0.94 and fades in
         .from('.arch-hero', { autoAlpha: 0, scale: 0.94, transformOrigin: '50% 100%', duration: 0.8, ease: 'power2.out' }, 0.5)
    // 4. أيسن reveals by clip-path from the RIGHT edge (RTL uncover)
         .fromTo('.display-inner',
            { clipPath: 'inset(0 0 0 100%)' },
            { clipPath: 'inset(0 0 0 0%)', duration: 0.9, ease: 'power3.out' }, 0.6)
         .from('.firm-full, .hero-lede', { autoAlpha: 0, y: 16, duration: 0.6, stagger: 0.1, ease: 'power2.out' }, 1.0);

    /* ---------- Hero: arch drifts ±12px at 0.85× scroll ---------- */
    gsap.to('.arch-hero', {
      y: -24,                              // total drift range across the hero
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.85
      }
    });

    /* ---------- Section fade-ups (24px, once) ---------- */
    gsap.utils.toArray('.about, .director, .areas, .contact, .site-footer').forEach(function (sec) {
      gsap.from(sec, {
        autoAlpha: 0, y: 24, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: sec, start: 'top 82%', once: true }
      });
    });

    /* ---------- 7.5 Video section: one pinned timeline (120% vh) ---------- */
    var arch = document.querySelector('.keyhole-arch');
    var field = document.querySelector('.videofield-mask');
    var vid = document.querySelector('.videofield-video');
    var line = document.querySelector('.videofield-line');

    if (arch && vid && line) {
      // Base state: narrow arch (240-ish), fully graded
      gsap.set(arch, { attr: { d: archPath(120) } });        // half-width 120 => ~240px keyhole
      gsap.set(vid, { filter: 'url(#duotone-video) saturate(1)' });

      var vtl = gsap.timeline({
        scrollTrigger: {
          trigger: '.videofield',
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: true
        }
      });

      // 0.0 -> 0.35 arch mask widens 240px -> full-bleed
      vtl.to(arch, { attr: { d: archPath(520) }, ease: 'power2.inOut', duration: 0.35 }, 0.0);
      // 0.2 -> 0.6 duotone lifts: graded -> saturate(0.8)
      vtl.to(vid, { filter: 'url(#duotone-video) saturate(0.8)', ease: 'none', duration: 0.4 }, 0.2);
      // 0.3 -> 1.0 Arabic line moves left 0.4x, field moves right 0.1x (opposite)
      vtl.fromTo(line, { xPercent: 0 }, { xPercent: -40, ease: 'none', duration: 0.7 }, 0.3);
      vtl.fromTo(field, { xPercent: 0 }, { xPercent: 10, ease: 'none', duration: 0.7 }, 0.3);
      // 0.75 -> 1.0 reverse: grade returns, mask narrows
      vtl.to(vid, { filter: 'url(#duotone-video) saturate(1)', ease: 'none', duration: 0.25 }, 0.75);
      vtl.to(arch, { attr: { d: archPath(160) }, ease: 'power2.inOut', duration: 0.25 }, 0.75);
    }

    ScrollTrigger.refresh();
  }

  /* Arch path builder for the keyhole mask.
     viewBox 1000x600, arch centered at x=500, foot at y=600.
     half = half-width of the arch opening in viewBox units. */
  function archPath(half) {
    var cx = 500;
    var left = cx - half;
    var right = cx + half;
    var footY = 600;
    var springY = footY - half;           // where the semicircle begins
    return 'M' + left + ',' + footY +
           ' L' + left + ',' + springY +
           ' A' + half + ',' + half + ' 0 0 1 ' + right + ',' + springY +
           ' L' + right + ',' + footY + ' Z';
  }
})();
