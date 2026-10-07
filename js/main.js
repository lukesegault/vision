(() => {
  'use strict';

  const projects = window.VISION_PROJECTS || [];
  const byId = new Map(projects.map((p) => [p.id, p]));

  const grid = document.getElementById('grid');
  const filtersEl = document.getElementById('filters');
  const lightbox = document.getElementById('lightbox');
  const lbMedia = document.getElementById('lb-media');
  const lbCount = document.getElementById('lb-count');
  const lbTitle = document.getElementById('lb-title');
  const lbMeta = document.getElementById('lb-meta');
  const lbDesc = document.getElementById('lb-desc');
  const lbCredits = document.getElementById('lb-credits');
  const lbPrev = document.getElementById('lb-prev');
  const lbNext = document.getElementById('lb-next');

  let activeCategory = 'All';
  let currentId = null;
  let opener = null;

  /* ---------- Images ---------- */

  // Adds the real photo on top of the placeholder if the file exists.
  // A missing file is silently ignored and the placeholder stays.
  function loadImage(media, src, alt) {
    media.classList.remove('has-image');
    media.querySelector('img')?.remove();
    if (!src) return;
    const img = document.createElement('img');
    img.alt = alt || '';
    img.decoding = 'async';
    img.addEventListener('load', () => media.classList.add('has-image'), { once: true });
    img.addEventListener('error', () => img.remove(), { once: true });
    img.src = src;
    media.append(img);
  }

  document.querySelectorAll('.media[data-src]').forEach((media) => {
    loadImage(media, media.dataset.src, media.dataset.alt);
  });

  /* ---------- Grid and filters ---------- */

  function buildFilters() {
    const categories = ['All', ...new Set(projects.map((p) => p.category))];
    categories.forEach((name) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = name;
      btn.dataset.category = name;
      btn.setAttribute('aria-pressed', String(name === activeCategory));
      filtersEl.append(btn);
    });
  }

  function buildGrid() {
    const frag = document.createDocumentFragment();
    projects.forEach((p, i) => {
      const li = document.createElement('li');
      li.className = 'card';
      li.dataset.id = p.id;
      li.dataset.category = p.category;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card-btn';
      btn.setAttribute('aria-haspopup', 'dialog');

      const media = document.createElement('span');
      media.className = 'media';
      media.dataset.tone = p.tone || 'sand';
      media.style.setProperty('--r', p.ratio || 0.75);
      const label = document.createElement('span');
      label.className = 'media-label';
      label.textContent = `Look ${String(i + 1).padStart(2, '0')}`;
      media.append(label);

      const meta = document.createElement('span');
      meta.className = 'card-meta';
      const title = document.createElement('span');
      title.className = 'card-title';
      title.textContent = p.title;
      const sub = document.createElement('span');
      sub.className = 'card-sub';
      sub.textContent = `${p.category} · ${p.year}`;
      meta.append(title, sub);

      btn.append(media, meta);
      li.append(btn);
      frag.append(li);

      loadImage(media, p.image, p.alt);
    });
    grid.append(frag);
  }

  function visibleProjects() {
    return projects.filter((p) => activeCategory === 'All' || p.category === activeCategory);
  }

  function applyFilter(category) {
    activeCategory = category;
    filtersEl.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.category === category));
    });
    grid.querySelectorAll('.card').forEach((card) => {
      const show = category === 'All' || card.dataset.category === category;
      card.hidden = !show;
      if (show) {
        // restart the entrance animation
        card.style.animation = 'none';
        void card.offsetWidth;
        card.style.animation = '';
      }
    });
  }

  filtersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-category]');
    if (btn) applyFilter(btn.dataset.category);
  });

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.card-btn');
    if (!btn) return;
    opener = btn;
    openLightbox(btn.closest('.card').dataset.id);
  });

  /* ---------- Lightbox ---------- */

  function renderLightbox(id) {
    const p = byId.get(id);
    if (!p) return;
    currentId = id;

    const list = visibleProjects();
    const index = list.findIndex((item) => item.id === id);

    lbMedia.dataset.tone = p.tone || 'sand';
    lbMedia.style.setProperty('--r', p.ratio || 0.75);
    lbMedia.querySelector('.media-label').textContent =
      `Look ${String(projects.indexOf(p) + 1).padStart(2, '0')}`;
    loadImage(lbMedia, p.image, p.alt);

    lbCount.textContent = `${String(index + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    lbTitle.textContent = p.title;
    lbMeta.textContent = `${p.category} · ${p.year}`;
    lbDesc.textContent = p.description || '';

    lbCredits.replaceChildren();
    Object.entries(p.credits || {}).forEach(([role, name]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      dt.textContent = role;
      const dd = document.createElement('dd');
      dd.textContent = name;
      row.append(dt, dd);
      lbCredits.append(row);
    });

    lbPrev.disabled = list.length < 2;
    lbNext.disabled = list.length < 2;
  }

  function openLightbox(id) {
    renderLightbox(id);
    if (!lightbox.open) lightbox.showModal();
    document.body.classList.add('has-modal');
  }

  function step(direction) {
    const list = visibleProjects();
    if (list.length < 2) return;
    const index = list.findIndex((p) => p.id === currentId);
    const next = list[(index + direction + list.length) % list.length];
    renderLightbox(next.id);
  }

  lbPrev.addEventListener('click', () => step(-1));
  lbNext.addEventListener('click', () => step(1));
  document.getElementById('lb-close').addEventListener('click', () => lightbox.close());

  // Click on the dimmed backdrop closes the dialog
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.close();
  });

  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  lightbox.addEventListener('close', () => {
    document.body.classList.remove('has-modal');
    opener?.focus();
  });

  /* ---------- Navigation ---------- */

  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const navList = document.getElementById('nav-list');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
    navList.classList.toggle('is-open', open);
  }

  toggle.addEventListener('click', () => {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  navList.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Reveal on scroll ---------- */

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Init ---------- */

  document.getElementById('year').textContent = new Date().getFullYear();
  buildFilters();
  buildGrid();
})();
