'use strict';

function initMobileDrawer() {
  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('nav-links');
  const overlay = document.getElementById('nav-overlay');
  if (!toggle || !drawer || !overlay) return;

  function openDrawer() {
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú');
    const firstLink = drawer.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
  }

  toggle.addEventListener('click', () => {
    if (drawer.classList.contains('is-open')) closeDrawer();
    else openDrawer();
  });

  overlay.addEventListener('click', closeDrawer);

  function bindDrawerLinks() {
    drawer.querySelectorAll('a:not([data-drawer-bound])').forEach(link => {
      link.setAttribute('data-drawer-bound', 'true');
      link.addEventListener('click', closeDrawer);
    });
  }
  bindDrawerLinks();
  document.addEventListener('playbook:content-rendered', bindDrawerLinks);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      closeDrawer();
      toggle.focus();
    }
  });
}

function initScrollShrink() {
  const header = document.querySelector('header.topbar');
  if (!header) return;
  let ticking = false;
  function update() {
    header.classList.toggle('is-scrolled', window.scrollY > 80);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
}

let activeSectionObserver = null;

function initActiveSection() {
  const links = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  if (activeSectionObserver) activeSectionObserver.disconnect();

  const map = new Map();
  links.forEach(link => {
    const id = link.getAttribute('href').slice(1);
    const section = document.getElementById(id);
    if (section) map.set(section, link);
  });
  if (!map.size) return;

  activeSectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const link = map.get(entry.target);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('is-active-section'));
        link.classList.add('is-active-section');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  map.forEach((_, section) => activeSectionObserver.observe(section));
}

function initCtaPulse() {
  const cta = document.getElementById('nav-cta');
  if (!cta) return;
  window.setTimeout(() => {
    cta.classList.add('pulse-once');
    cta.addEventListener('animationend', () => cta.classList.remove('pulse-once'), { once: true });
  }, 2000);
}

initMobileDrawer();
initScrollShrink();
initActiveSection();
initCtaPulse();

document.addEventListener('playbook:content-rendered', initActiveSection);
