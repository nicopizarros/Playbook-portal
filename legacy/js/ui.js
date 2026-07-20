'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  const groupIndex = new Map();
  function observeNew() {
    document.querySelectorAll('.reveal:not(.is-observed)').forEach(el => {
      el.classList.add('is-observed');
      const parent = el.parentElement;
      const idx = groupIndex.get(parent) || 0;
      el.style.transitionDelay = (idx * 60) + 'ms';
      groupIndex.set(parent, idx + 1);
      observer.observe(el);
    });
  }

  observeNew();
  document.addEventListener('playbook:rendered', observeNew);
  document.addEventListener('playbook:content-rendered', observeNew);
  document.addEventListener('playbook:archive-rendered', observeNew);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function initNewsletterForms() {
  document.querySelectorAll('form.pill-form:not([data-nl-bound])').forEach(form => {
    form.setAttribute('data-nl-bound', 'true');
    const input = form.querySelector('input');
    const errorEl = form.querySelector('.nl-error');
    if (!input) return;

    form.addEventListener('submit', e => {
      const value = input.value.trim();
      if (!isValidEmail(value)) {
        e.preventDefault();
        form.classList.add('has-error');
        if (errorEl) errorEl.textContent = 'Ingresa un correo válido.';
        input.focus();
        return;
      }
      form.classList.remove('has-error');
      window.setTimeout(() => form.classList.add('is-success'), 50);
    });

    input.addEventListener('input', () => form.classList.remove('has-error'));
  });
}

function animateCount(el) {
  const raw = el.textContent.trim();
  const match = raw.match(/^([\d.]+)(.*)$/);
  if (!match) return;
  const target = parseFloat(match[1]);
  const decimals = (match[1].split('.')[1] || '').length;
  const suffix = match[2];

  if (prefersReducedMotion) return;

  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = raw;
  }
  requestAnimationFrame(tick);
}

function initStatCounters() {
  const stats = document.querySelectorAll('.stat b:not([data-counted])');
  if (!stats.length || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.4 });
  stats.forEach(el => {
    el.setAttribute('data-counted', 'true');
    observer.observe(el);
  });
}

initScrollReveal();
initNewsletterForms();
initStatCounters();

document.addEventListener('playbook:content-rendered', () => {
  initNewsletterForms();
  initStatCounters();
});
