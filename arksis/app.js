// АРКСИС, набросок. Рентген стены, разрез, лента из ВК, форма.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const touchOnly = matchMedia('(hover: none)');

  /* ---------- Рентген стены ---------- */
  const xr = document.getElementById('xr');
  if (xr) {
    const spots = [...xr.querySelectorAll('.xr-spot')];
    const tip = document.getElementById('xrTip');
    const toggle = document.getElementById('xrToggle');
    const hint = document.getElementById('xrHint');
    const ring = xr.querySelector('.xr-ring');
    const R = () => (xr.clientWidth < 420 ? 86 : 122);
    let w = 0, h = 0, x = 0, y = 0, tx = 0, ty = 0, r = 0, tr = 0, raf = 0;
    let open = false, tourIdx = 0, tourTimer = 0, idleTimer = 0, userActive = false, visible = false, current = null;

    if (touchOnly.matches) hint.textContent = 'Коллекторный узел, ЖК «Декабристов». Проведите пальцем по стене.';

    const apply = () => {
      xr.style.setProperty('--x', x + 'px');
      xr.style.setProperty('--y', y + 'px');
      xr.style.setProperty('--lr', r + 'px');
      ring.style.setProperty('--k', Math.max(r, 1) / 100);
    };
    const step = () => {
      const ease = reduce.matches ? 1 : 0.16;
      x += (tx - x) * ease; y += (ty - y) * ease; r += (tr - r) * (reduce.matches ? 1 : 0.12);
      apply();
      if (Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(tr - r) > 0.4) raf = requestAnimationFrame(step);
      else { x = tx; y = ty; r = tr; apply(); raf = 0; }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };

    const spotXY = s => [s.dataset.x / 100 * w, s.dataset.y / 100 * h];
    const showTip = s => {
      spots.forEach(o => o.classList.toggle('is-on', o === s));
      current = s;
      if (!s) { tip.classList.remove('is-on'); return; }
      tip.querySelector('strong').textContent = s.dataset.t;
      tip.querySelector('span').textContent = s.dataset.d;
      const dock = w < 480 || open;
      tip.classList.toggle('is-dock', dock);
      if (dock) { tip.style.left = tip.style.right = tip.style.top = ''; }
      else {
        const sx = tx, sy = ty, off = R() + 14;
        if (sx < w / 2) { tip.style.left = Math.min(sx + off, w - 210) + 'px'; tip.style.right = 'auto'; }
        else { tip.style.right = Math.min(w - sx + off, w - 210) + 'px'; tip.style.left = 'auto'; }
        tip.style.top = Math.max(12, Math.min(sy - 30, h - 130)) + 'px';
      }
      tip.classList.add('is-on');
    };
    const nearest = (px, py) => {
      let best = null, bd = Infinity;
      for (const s of spots) { const [sx, sy] = spotXY(s); const d = Math.hypot(sx - px, sy - py); if (d < bd) { bd = d; best = s; } }
      return bd < R() * 0.9 ? best : null;
    };
    const clampC = (v, max) => Math.min(Math.max(v, R() * 0.72), max - R() * 0.72);
    const goTo = s => { const [sx, sy] = spotXY(s); tx = clampC(sx, w); ty = clampC(sy, h); kick(); showTip(s); };

    const tour = () => {
      clearTimeout(tourTimer);
      if (reduce.matches || open || userActive || !visible || document.hidden) return;
      tourIdx = (tourIdx + 1) % spots.length;
      goTo(spots[tourIdx]);
      tourTimer = setTimeout(tour, 3400);
    };
    const pauseTour = ms => {
      userActive = true; clearTimeout(tourTimer); clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { userActive = false; tour(); }, ms);
    };

    const measure = () => {
      const kx = w ? x / w : 0.52, ky = h ? y / h : 0.6;
      w = xr.clientWidth; h = xr.clientHeight;
      x = tx = kx * w; y = ty = ky * h;
      tr = open ? Math.hypot(w, h) : R(); r = tr;
      apply(); if (current) showTip(current);
    };
    new ResizeObserver(measure).observe(xr);
    measure();
    // старт: линза раскрывается на коллекторе
    r = 0; tr = R(); goTo(spots[0]); kick();

    const local = e => { const b = xr.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    xr.addEventListener('pointermove', e => {
      if (open || e.target.closest('.xr-spot')) return;
      if (e.pointerType === 'touch' && !e.isPrimary) return;
      const [px, py] = local(e); tx = px; ty = py; kick();
      showTip(nearest(px, py));
      pauseTour(e.pointerType === 'touch' ? 5000 : 2600);
    });
    xr.addEventListener('pointerdown', e => {
      if (open || e.target.closest('.xr-spot')) return;
      const [px, py] = local(e); tx = px; ty = py; kick(); showTip(nearest(px, py)); pauseTour(5000);
    });
    spots.forEach((s, i) => {
      const pick = () => { if (open) { showTip(s); return; } tourIdx = i; goTo(s); pauseTour(6000); };
      s.addEventListener('click', pick);
      s.addEventListener('focus', pick);
    });

    toggle.addEventListener('click', () => {
      open = !open;
      xr.classList.toggle('is-open', open);
      toggle.setAttribute('aria-pressed', String(open));
      toggle.textContent = open ? 'Вернуть отделку' : 'Снять отделку';
      tr = open ? Math.hypot(w, h) : R();
      kick();
      if (open) { clearTimeout(tourTimer); showTip(current || spots[0]); }
      else { pauseTour(2500); }
    });

    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !userActive) { clearTimeout(tourTimer); tourTimer = setTimeout(tour, 2600); } else clearTimeout(tourTimer); }, { threshold: 0.35 }).observe(xr);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tourTimer = setTimeout(tour, 2600); });
    reduce.addEventListener?.('change', () => { clearTimeout(tourTimer); kick(); });
  }

  /* ---------- Разрез: подсветка слоя ---------- */
  const cut = document.querySelector('.cut svg');
  const layers = [...document.querySelectorAll('.layer')];
  if (cut && layers.length) {
    const setLayer = n => {
      layers.forEach(l => l.classList.toggle('is-on', l.dataset.layer === n));
      cut.querySelectorAll('[data-layer]').forEach(g => g.classList.toggle('is-on', g.dataset.layer === n));
    };
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setLayer(e.target.dataset.layer)), { rootMargin: '-45% 0px -45% 0px' });
    layers.forEach(l => { io.observe(l); l.addEventListener('pointerenter', () => setLayer(l.dataset.layer)); });
    setLayer('1');
  }

  /* ---------- Окна ---------- */
  const dlgPost = document.getElementById('dlgPost');
  const dlgVideo = document.getElementById('dlgVideo');
  const videoBox = document.getElementById('videoBox');
  document.querySelectorAll('dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  [dlgPost, dlgVideo].forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
  dlgVideo.addEventListener('close', () => { videoBox.replaceChildren(); });

  const openClip = (id) => {
    const f = document.createElement('iframe');
    // плеер ВК для публичного клипа группы
    f.src = 'https://vkvideo.ru/video_ext.php?oid=-36832487&id=' + encodeURIComponent(id) + '&hd=2&autoplay=1';
    f.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock';
    f.title = 'Клип из группы АРКСИС в ВК';
    f.loading = 'lazy';
    videoBox.replaceChildren(f);
    dlgVideo.showModal();
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-clip]'); if (b) openClip(b.dataset.clip); });

  /* ---------- Лента из ВК ---------- */
  const feedEl = document.getElementById('feed');
  const clipsEl = document.getElementById('clips');
  const moreBtn = document.getElementById('feedMore');
  const demoBtn = document.getElementById('feedDemo');
  const statusEl = document.getElementById('feedStatus');
  const fmtDay = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
  const fmtUpd = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Novosibirsk' });
  const safeUrl = u => (/^https:\/\/(vk\.ru|vk\.com|vkvideo\.ru)\//.test(u) ? u : 'https://vk.ru/arksis.group');
  const safeImg = u => (/^img\/feed\/[\w.-]+\.jpg$/.test(u) ? u : '');
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const photosWord = n => n + ' фото';

  let FEED = null, shown = 6;
  const card = (p, big, isNew) => {
    const a = el('article', 'post' + (big ? ' is-big' : '') + (isNew ? ' is-new' : ''));
    if (isNew) a.append(el('span', 'badge', 'Новое'));
    const pic = el('button', 'post-pic'); pic.type = 'button';
    pic.setAttribute('aria-label', 'Открыть фото: ' + p.title);
    const cover = p.video ? safeImg(p.video.cover) : safeImg(p.photos[0]);
    if (cover) { const img = el('img'); img.src = cover; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; pic.append(img); }
    if (p.video) pic.append(el('span', 'count', 'Видео ' + p.video.duration));
    else if (p.photos.length > 1) pic.append(el('span', 'count', photosWord(p.photos.length)));
    pic.addEventListener('click', () => (p.video ? openClip(p.video.id) : openPost(p)));
    const body = el('div', 'post-body');
    const meta = el('div', 'post-meta');
    meta.append(el('span', '', p.place || ''), el('time', '', fmtDay.format(new Date(p.date))));
    meta.lastChild.dateTime = p.date;
    const link = el('a', '', 'Пост в ВК'); link.href = safeUrl(p.url); link.target = '_blank'; link.rel = 'noopener noreferrer';
    body.append(meta, el('h3', '', p.title), el('p', '', p.text), link);
    a.append(pic, body);
    return a;
  };
  const openPost = p => {
    const gal = document.getElementById('dlgGal');
    gal.replaceChildren(...p.photos.map(src => { const i = el('img'); i.src = safeImg(src); i.alt = p.title; i.loading = 'lazy'; return i; }));
    document.getElementById('dlgPlace').textContent = p.place || '';
    const d = document.getElementById('dlgDate'); d.textContent = fmtDay.format(new Date(p.date)); d.dateTime = p.date;
    document.getElementById('dlgPostTitle').textContent = p.title;
    document.getElementById('dlgText').textContent = p.text;
    document.getElementById('dlgLink').href = safeUrl(p.url);
    dlgPost.showModal();
  };
  const render = (newId) => {
    const list = FEED.posts.slice(0, shown);
    feedEl.replaceChildren(...list.map((p, i) => card(p, i === 0, p.id === newId)));
    moreBtn.hidden = FEED.posts.length <= shown;
    moreBtn.textContent = 'Показать ещё ' + Math.min(3, FEED.posts.length - shown);
  };
  const renderClips = () => {
    clipsEl.replaceChildren(...FEED.clips.map(c => {
      const b = el('button', 'clip'); b.type = 'button'; b.dataset.clip = c.id; b.setAttribute('role', 'listitem');
      b.setAttribute('aria-label', 'Смотреть клип: ' + c.title);
      const pic = el('span', 'c-pic'); const img = el('img'); img.src = safeImg(c.cover); img.alt = ''; img.loading = 'lazy'; pic.append(img);
      b.append(pic, el('b', '', c.title), el('span', '', c.views + ' просмотров'));
      return b;
    }));
  };
  const setStatus = iso => { statusEl.textContent = 'Обновляется сам из группы ВК. Последнее обновление: ' + fmtUpd.format(new Date(iso)); };

  fetch('data/vk-feed.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => { FEED = data; render(); renderClips(); setStatus(data.updated); })
    .catch(() => {
      const box = el('div', 'feed-error');
      box.append('Не получилось загрузить посты. ', Object.assign(el('a', '', 'Свежие объекты в группе ВК'), { href: 'https://vk.ru/arksis.group', target: '_blank', rel: 'noopener noreferrer' }));
      feedEl.replaceChildren(box);
    });
  moreBtn.addEventListener('click', () => { shown += 3; render(); });

  // Пример: так в ленту приходит новый пост с хэштегом #насайт
  demoBtn.addEventListener('click', () => {
    if (!FEED || FEED.posts[0].id === 57991) return;
    FEED.posts.unshift({ id: 57991, url: 'https://vk.ru/wall-36832487_57991', date: '2026-10-08', place: 'Клип',
      title: 'Штукатурка «бухтит»: проверяем стены', text: 'Если штукатурка звучит пусто, её снимают и делают заново. Видео 0:19 из группы.',
      photos: [], video: { id: 456239795, cover: 'img/feed/clip_456239795.jpg', duration: '0:19' } });
    shown += 1;
    render(57991);
    statusEl.textContent = 'Обновляется сам из группы ВК. Последнее обновление: только что';
    demoBtn.disabled = true; demoBtn.textContent = 'Пост добавлен';
    feedEl.firstElementChild.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'center' });
  });

  /* ---------- Форма ---------- */
  const form = document.getElementById('leadForm');
  const st = document.getElementById('formStatus');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const phone = form.phone.value.replace(/[^\d+]/g, '');
    st.classList.add('is-on'); st.classList.remove('err');
    if (form.company.value) return; // ловушка для ботов
    if (phone.replace(/\D/g, '').length < 10) { st.classList.add('err'); st.textContent = 'Проверьте телефон: нужно 10 или 11 цифр.'; form.phone.focus(); return; }
    if (!form.consent.checked) { st.classList.add('err'); st.textContent = 'Отметьте согласие на обработку данных, без него заявку не отправить.'; form.consent.focus(); return; }
    st.textContent = 'Это набросок, заявка никуда не ушла. В рабочей версии она придёт в сообщения группы ВК или в Telegram, а вы получите ответ с расчётом.';
  });
})();
