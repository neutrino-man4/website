/* about.js — Scroll-triggered reveal + mobile date labels */
(function () {

  /* ── Scroll reveal ── */
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger each entry slightly
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, i * 120);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  reveals.forEach(el => observer.observe(el));

  /* ── Inject data-date on timeline bodies for mobile CSS ::before ── */
  document.querySelectorAll('.timeline__entry').forEach(entry => {
    const dateEl = entry.querySelector('.timeline__date');
    const body   = entry.querySelector('.timeline__body');
    if (dateEl && body) {
      body.setAttribute('data-date', dateEl.textContent.trim());
    }
  });

})();
