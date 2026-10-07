(() => {
  'use strict';

  const projects = window.VISION_PROJECTS || [];
  const byId = new Map(projects.map((p) => [p.id, p]));

  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const fileOf = (src) => (src || '').split('/').pop();
  const lookLabel = (p) => `Look ${pad(projects.indexOf(p) + 1)}`;

  const grid = $('grid');
  const indexEl = $('index');
  const filtersEl = $('filters');
  const viewToggle = document.querySelector('.view-toggle');
  const workCount = $('work-count');
  const preview = $('preview');
  const lightbox = $('lightbox');
  const lbMedia = $('lb-media');
  const lbCount = $('lb-count');
  const lbTitle = $('lb-title');
  const lbMeta = $('lb-meta');
  const lbDesc = $('lb-desc');
  const lbCredits = $('lb-credits');
  const lbPrev = $('lb-prev');
  const lbNext = $('lb-next');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  let activeCategory = 'All';
  let currentId = null;
  let opener = null;

  /* ---------- Images ---------- */

  // Placeholder labels: what the slot is, and the file it is waiting for.
  function labelMedia(media, label, src) {
    media.querySelectorAll('.media-label, .media-file').forEach((n) => n.remove());
    const a = document.createElement('span');
    a.className = 'media-label';
    a.textContent = label;
    const b = document.createElement('span');
    b.className = 'media-file';
    b.textContent = fileOf(src);
    media.prepend(a, b);
  }

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
    labelMedia(media, media.dataset.label || '', media.dataset.src);
    loadImage(media, media.dataset.src, media.dataset.alt);
  });

  /* ---------- Filters ---------- */

  function countFor(category) {
    return category === 'All' ? projects.length : projects.filter((p) => p.category === category).length;
  }

  function buildFilters() {
    ['All', ...new Set(projects.map((p) => p.category))].forEach((name) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mono';
      btn.textContent = `${name} (${pad(countFor(name))})`;
      btn.dataset.category = name;
      btn.setAttribute('aria-pressed', String(name === activeCategory));
      filtersEl.append(btn);
    });
  }

  function visibleProjects() {
    return projects.filter((p) => activeCategory === 'All' || p.category === activeCategory);
  }

  function applyFilter(category) {
    activeCategory = category;
    filtersEl.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.category === category));
    });
    grid.classList.toggle('is-filtered', category !== 'All');

    document.querySelectorAll('.card[data-category], .row[data-category]').forEach((el) => {
      const show = category === 'All' || el.dataset.category === category;
      el.hidden = !show;
      if (show && el.classList.contains('card')) {
        // restart the entrance animation
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = '';
      }
    });
    workCount.textContent = `${pad(visibleProjects().length)} looks`;
  }

  filtersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-category]');
    if (btn) applyFilter(btn.dataset.category);
  });

  /* ---------- Grid ---------- */

  function buildGrid() {
    const frag = document.createDocumentFragment();

    projects.forEach((p) => {
      const li = document.createElement('li');
      li.className = 'card' + (p.feature ? ' is-feature' : '');
      li.dataset.id = p.id;
      li.dataset.category = p.category;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card-btn';
      btn.setAttribute('aria-haspopup', 'dialog');

      const media = document.createElement('span');
      media.className = 'media';
      media.dataset.tone = p.tone || 'grey';
      labelMedia(media, lookLabel(p), p.image);

      const cap = document.createElement('span');
      cap.className = 'card-cap';
      const brand = document.createElement('span');
      brand.className = 'card-brand';
      brand.textContent = p.category;
      const title = document.createElement('span');
      title.className = 'card-title';
      title.textContent = p.title;
      const year = document.createElement('span');
      year.className = 'card-year';
      year.textContent = p.year;
      cap.append(brand, title, year);

      btn.append(media, cap);
      li.append(btn);
      frag.append(li);
      loadImage(media, p.image, p.alt);
    });

    // Call-to-action cell closes the grid
    const cta = document.createElement('li');
    cta.className = 'card is-cta';
    cta.innerHTML =
      '<a class="card-btn" href="#contact">' +
      '<span class="media" data-tone="blue">' +
      '<span class="cta-text">Book a<br>session</span>' +
      '<span class="cta-arrow" aria-hidden="true">↗</span>' +
      '</span>' +
      '<span class="card-cap"><span class="card-brand">Inquire</span><span class="card-title">Start a conversation</span></span>' +
      '</a>';
    frag.append(cta);

    grid.append(frag);
  }

  /* ---------- Index (list view with cursor preview) ---------- */

  let tx = 0, ty = 0, px = 0, py = 0, raf = 0, previewOn = false;

  function loop() {
    const k = reduceMotion.matches ? 1 : 0.16;
    px += (tx - px) * k;
    py += (ty - py) * k;
    const tilt = reduceMotion.matches ? 0 : Math.max(-10, Math.min(10, (tx - px) * 0.06));
    preview.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) rotate(${tilt}deg)`;
    raf = previewOn ? requestAnimationFrame(loop) : 0;
  }

  function showPreview(p, e) {
    if (!finePointer.matches) return;
    preview.dataset.tone = p.tone || 'grey';
    preview.style.setProperty('--r', p.ratio || 0.75);
    labelMedia(preview, lookLabel(p), p.image);
    loadImage(preview, p.image, '');
    tx = px = e.clientX;
    ty = py = e.clientY;
    previewOn = true;
    preview.classList.add('is-on');
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function hidePreview() {
    previewOn = false;
    preview.classList.remove('is-on');
  }

  function buildIndex() {
    const frag = document.createDocumentFragment();
    projects.forEach((p, i) => {
      const li = document.createElement('li');
      li.className = 'row';
      li.dataset.id = p.id;
      li.dataset.category = p.category;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'row-btn';
      btn.setAttribute('aria-haspopup', 'dialog');

      const parts = [
        ['row-num mono', pad(i + 1)],
        ['row-title display', p.title],
        ['row-cat mono', p.category],
        ['row-year mono', p.year],
        ['row-arrow', '↗']
      ].map(([cls, text]) => {
        const s = document.createElement('span');
        s.className = cls;
        s.textContent = text;
        if (cls === 'row-arrow') s.setAttribute('aria-hidden', 'true');
        return s;
      });
      btn.append(...parts);

      btn.addEventListener('pointerenter', (e) => showPreview(p, e));
      btn.addEventListener('pointerleave', hidePreview);

      li.append(btn);
      frag.append(li);
    });
    indexEl.append(frag);
    indexEl.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; });
  }

  function setView(view) {
    grid.hidden = view !== 'grid';
    indexEl.hidden = view !== 'index';
    viewToggle.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.view === view));
    });
    hidePreview();
  }

  viewToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-view]');
    if (btn) setView(btn.dataset.view);
  });

  /* ---------- Lightbox ---------- */

  function openFrom(e, selector) {
    const btn = e.target.closest(selector);
    if (!btn) return;
    opener = btn;
    openLightbox(btn.closest('[data-id]').dataset.id);
  }
  grid.addEventListener('click', (e) => openFrom(e, 'button.card-btn'));
  indexEl.addEventListener('click', (e) => openFrom(e, '.row-btn'));

  function renderLightbox(id) {
    const p = byId.get(id);
    if (!p) return;
    currentId = id;

    const list = visibleProjects();
    const index = list.findIndex((item) => item.id === id);

    lbMedia.dataset.tone = p.tone || 'grey';
    lbMedia.style.setProperty('--r', p.ratio || 0.75);
    labelMedia(lbMedia, lookLabel(p), p.image);
    loadImage(lbMedia, p.image, p.alt);

    lbCount.textContent = `${pad(index + 1)} / ${pad(list.length)}`;
    lbTitle.textContent = p.title;
    lbMeta.textContent = `${p.category} / ${p.year}`;
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
    hidePreview();
    renderLightbox(id);
    if (!lightbox.open) lightbox.showModal();
    document.body.classList.add('has-modal');
  }

  function step(direction) {
    const list = visibleProjects();
    if (list.length < 2) return;
    const index = list.findIndex((p) => p.id === currentId);
    renderLightbox(list[(index + direction + list.length) % list.length].id);
  }

  lbPrev.addEventListener('click', () => step(-1));
  lbNext.addEventListener('click', () => step(1));
  $('lb-close').addEventListener('click', () => lightbox.close());

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

  const toggle = document.querySelector('.nav-toggle');
  const navList = $('nav-list');

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

  /* ---------- Paris clock ---------- */

  const clock = $('clock');
  const timeFmt = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Paris'
  });
  const tickClock = () => { clock.textContent = `Paris ${timeFmt.format(new Date())}`; };
  tickClock();
  setInterval(tickClock, 15000);

  /* ---------- Reveal on scroll ---------- */

  const revealEls = document.querySelectorAll('.reveal, .reveal-clip');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Init ---------- */

  $('year').textContent = new Date().getFullYear();
  buildFilters();
  buildGrid();
  buildIndex();
  applyFilter('All');
})();
