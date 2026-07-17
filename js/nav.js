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

// ---------------------------------------------------------------- Theme toggle
// Dos instancias por página (.theme-toggle en .nav-actions para escritorio,
// .theme-toggle-drawer dentro del menú móvil — ver css/responsive.css),
// un solo handler para las dos. El repintado visual real lo hacen los
// selectores [data-theme] / @media(prefers-color-scheme:dark) de
// css/tokens.css solo con el atributo data-theme del <html> — acá solo se
// escribe ese atributo, se guarda la preferencia, y se sincroniza el resto
// de la UI (aria-pressed, texto del botón del drawer, meta theme-color).

const THEME_KEY = 'playbook_theme';

function storedTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
}

function isDarkActive() {
  const stored = storedTheme();
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function syncThemeUi() {
  const dark = isDarkActive();
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    const label = btn.querySelector('.theme-toggle-label');
    if (label) label.textContent = dark ? 'Modo claro' : 'Modo oscuro';
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#121316' : '#ffffff');
}

function initThemeToggle() {
  const toggles = document.querySelectorAll('[data-theme-toggle]');
  if (!toggles.length) return;

  syncThemeUi();

  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const next = isDarkActive() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      syncThemeUi();

      // El toggle del drawer se comporta como cualquier otro link del menú:
      // tocarlo cierra el drawer, igual que bindDrawerLinks() hace con los <a>.
      if (btn.classList.contains('theme-toggle-drawer')) {
        const drawer = document.getElementById('nav-links');
        const overlay = document.getElementById('nav-overlay');
        const navToggle = document.getElementById('nav-toggle');
        if (drawer) drawer.classList.remove('is-open');
        if (overlay) overlay.classList.remove('is-open');
        if (navToggle) {
          navToggle.setAttribute('aria-expanded', 'false');
          navToggle.setAttribute('aria-label', 'Abrir menú');
        }
      }
    });
  });

  // Sin preferencia guardada, seguir los cambios de tema del sistema en
  // vivo — el repintado visual ya lo hace @media(prefers-color-scheme:dark)
  // solo, esto solo mantiene sincronizados aria-pressed/label/theme-color.
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (!storedTheme()) syncThemeUi();
    });
  }
}

initMobileDrawer();
initScrollShrink();
initActiveSection();
initCtaPulse();
initThemeToggle();

document.addEventListener('playbook:content-rendered', initActiveSection);
