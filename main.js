/* main.js — Mobile hamburger menu toggle */
(function () {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');

  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);

    // Animate the three bars into an X
    const spans = hamburger.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.cssText = 'transform: translateY(6.5px) rotate(45deg)';
      spans[1].style.cssText = 'opacity: 0; transform: scaleX(0)';
      spans[2].style.cssText = 'transform: translateY(-6.5px) rotate(-45deg)';
    } else {
      spans.forEach(s => (s.style.cssText = ''));
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('open');
      hamburger.querySelectorAll('span').forEach(s => (s.style.cssText = ''));
    }
  });

  // Subtle navbar shadow on scroll
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 10
      ? '0 2px 20px rgba(0,0,0,0.07)'
      : 'none';
  }, { passive: true });
})();

/* Cycling greeting */
(function () {
  const words = document.querySelectorAll('.greeting-word');
  if (!words.length) return;
  let current = 0;
  setInterval(() => {
    words[current].classList.remove('active');
    current = (current + 1) % words.length;
    words[current].classList.add('active');
  }, 2000);
})();