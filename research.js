/* ============================================================
   research.js — Image carousel
   ============================================================

   Images are declared directly on each .topic element via the
   data-images attribute (comma-separated paths). Example:

     data-images="research/quantum/1.png,research/quantum/2.png"

   TO ADD MORE IMAGES: append paths to the data-images list.
   TO CHANGE SPEED:    adjust INTERVAL_MS below.
   ============================================================ */

(function () {
  'use strict';

  const INTERVAL_MS = 3500;

  /* ── Scroll reveal ── */
  const revealObserver = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ── Build each carousel ── */
  document.querySelectorAll('.topic[data-images]').forEach(topic => {
    const raw    = topic.dataset.images || '';
    const paths  = raw.split(',').map(s => s.trim()).filter(Boolean);
    const track  = topic.querySelector('.carousel__track');
    const dotsEl = topic.querySelector('.carousel__dots');
    const prev   = topic.querySelector('.carousel__prev');
    const next   = topic.querySelector('.carousel__next');

    if (!track) return;

    if (paths.length === 0) {
      showPlaceholder(track);
      if (prev) prev.style.display = 'none';
      if (next) next.style.display = 'none';
      return;
    }

    /* Build slides */
    paths.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'carousel__slide' + (i === 0 ? ' active' : '');

      const img   = document.createElement('img');
      img.src     = src;
      img.alt     = 'Research plot ' + (i + 1);
      img.loading = 'lazy';

      slide.appendChild(img);
      track.appendChild(slide);

      /* Dot */
      if (dotsEl) {
        const dot = document.createElement('button');
        dot.className = 'carousel__dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Slide ' + (i + 1));
        dot.addEventListener('click', () => { goTo(i); resetTimer(); });
        dotsEl.appendChild(dot);
      }
    });

    /* Hide controls if only one image */
    if (paths.length === 1) {
      if (prev) prev.style.display = 'none';
      if (next) next.style.display = 'none';
    }

    let current = 0;
    let timer   = null;

    function allSlides() { return track.querySelectorAll('.carousel__slide'); }
    function allDots()   { return dotsEl ? dotsEl.querySelectorAll('.carousel__dot') : []; }

    function goTo(idx) {
      const s = allSlides(), d = allDots();
      s[current].classList.remove('active');
      if (d[current]) d[current].classList.remove('active');
      current = ((idx % paths.length) + paths.length) % paths.length;
      s[current].classList.add('active');
      if (d[current]) d[current].classList.add('active');
    }

    function startTimer() {
      timer = setInterval(() => goTo(current + 1), INTERVAL_MS);
    }

    function resetTimer() {
      clearInterval(timer);
      startTimer();
    }

    if (prev) prev.addEventListener('click', () => { goTo(current - 1); resetTimer(); });
    if (next) next.addEventListener('click', () => { goTo(current + 1); resetTimer(); });

    track.addEventListener('mouseenter', () => clearInterval(timer));
    track.addEventListener('mouseleave', startTimer);

    topic.setAttribute('tabindex', '0');
    topic.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { goTo(current - 1); resetTimer(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); resetTimer(); }
    });

    startTimer();
  });

  function showPlaceholder(track) {
    track.innerHTML =
      '<div class="carousel__placeholder">' +
        '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
          '<circle cx="8.5" cy="8.5" r="1.5"/>' +
          '<polyline points="21 15 16 10 5 21"/>' +
        '</svg>' +
        '<p>Add image paths via <code>data-images</code> on this .topic element.</p>' +
      '</div>';
  }

})();
