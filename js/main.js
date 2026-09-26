/* ==========================================================
   Широков Иван — портфолио. Главный скрипт.
   ========================================================== */

/* Ссылки на соцсети. Когда появятся — впиши сюда адрес, и кнопка заработает.
   Пример: tgChannel: 'https://t.me/имя_канала', mail: 'mailto:почта@пример.ru' */
const LINKS = {
  tgChannel: 'https://t.me/ALMES378',
  tg: 'https://t.me/ALMES37',
  vk: '',
  mail: '',
};

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (reduce) root.classList.add('reduced');
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* приватный режим — не страшно */ } },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) { /* не страшно */ } },
  };

  /* Первый экран «одноразовый»: когда он целиком ушёл вверх, он убирается, и вернуться к нему прокруткой нельзя.
     Обновил страницу в начале — заставка играет снова; обновил в середине — сайт открывается там же, без заставки. */
  const oneWay = hasGSAP && !reduce;
  const heroEl = $('.hero');
  let heroGone = false;
  const savedRaw = oneWay ? parseFloat(store.get('pos')) : NaN;
  const savedY = savedRaw > 40 ? savedRaw : NaN; // в самом верху сайта — это «начало»: снова показываем заставку
  // ссылка вида …/#works, открытая впервые, ведёт сразу к разделу
  const hashLink = location.hash.length > 1 && location.hash !== '#top' && Number.isNaN(savedRaw);
  const restore = oneWay && (Number.isFinite(savedY) || hashLink);
  if (oneWay) {
    // место на странице запоминаем сами; через ScrollTrigger — иначе он вернёт браузеру «авто»
    ScrollTrigger.clearScrollMemory('manual');
    // заставка: страница начинается с самого верха, «#раздел» в адресе не должен её перепрыгивать
    if (!restore && location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  const jump = (y) => window.scrollTo({ top: y, behavior: 'instant' });

  /* ---------- Шифр: перебор символов ---------- */
  const GLYPHS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ#%&*/<>▒░▓';
  const rnd = (s) => s[Math.floor(Math.random() * s.length)];

  function decode(el, text, duration = 1100) {
    return new Promise((resolve) => {
      if (reduce) { el.textContent = text; resolve(); return; }
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const done = Math.floor(p * text.length);
        let out = '';
        for (let i = 0; i < text.length; i++) {
          out += i < done || text[i] === ' ' || text[i] === '_' || text[i] === '(' || text[i] === ')' ? text[i] : rnd(GLYPHS);
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Имя засекречено, пока не долистаешь ---------- */
  const brands = $$('[data-brand]');
  let revealed = false;
  let brandTimer = 0;
  if (!reduce) {
    brandTimer = setInterval(() => {
      if (revealed) return;
      const base = '(???????_?)'.split('');
      for (let k = 0; k < 2; k++) {
        const i = 1 + Math.floor(Math.random() * 7);
        base[i] = rnd('█▓▒░#?/<>');
      }
      brands.forEach((b) => { b.textContent = base.join(''); });
    }, 110);
  }

  function revealName() {
    if (revealed) return;
    revealed = true;
    clearInterval(brandTimer);
    brands.forEach((b) => decode(b, '(ШИРОКОВ_И)', 900));
    const ini = $('[data-initial]');
    if (ini) decode(ini, '( И )', 600);
    store.set('name-revealed', '1');
  }

  const nameParts = $$('[data-decode]');
  function decodeName() {
    nameParts.forEach((el, i) => setTimeout(() => decode(el, el.dataset.decode, 1000), i * 260));
    setTimeout(revealName, 700);
  }

  /* ---------- Загрузка-интрига + включение экрана ---------- */
  const power = $('[data-power]');
  const boot = $('[data-boot]');
  const BOOT = [
    '> автор: ███████ ████  [засекречено]',
    '> сайтов сделано вручную: 3',
    '> шаблонов использовано: 0',
    '> включаю экран_',
  ];

  function typeBoot(signal) {
    return new Promise((resolve) => {
      if (!boot) { resolve(); return; }
      let line = 0, ch = 0;
      const out = [];
      const step = () => {
        if (signal.skip) { boot.textContent = BOOT.join('\n'); resolve(); return; }
        if (line >= BOOT.length) { setTimeout(resolve, 260); return; }
        const text = BOOT[line];
        out[line] = text.slice(0, ++ch);
        boot.textContent = out.join('\n');
        if (ch >= text.length) { line++; ch = 0; setTimeout(step, 150); } else setTimeout(step, 13);
      };
      step();
    });
  }

  function intro() {
    const lines = $$('[data-line]');
    const bits = $$('[data-intro]');
    if (!hasGSAP || reduce || restore) {
      if (power) power.style.display = 'none';
      return;
    }
    power.style.animation = 'none'; // отменяем «запасное» автовключение из CSS
    gsap.set(lines, { yPercent: 115 });
    gsap.set(bits, { opacity: 0, y: 12 });
    gsap.set('[data-glow]', { opacity: 0 });

    // заставка играет при каждом открытии и обновлении страницы в самом начале
    const signal = { skip: false };
    const skip = () => { signal.skip = true; };
    addEventListener('pointerdown', skip, { once: true });
    addEventListener('keydown', skip, { once: true });

    typeBoot(signal).then(() => {
      removeEventListener('pointerdown', skip);
      removeEventListener('keydown', skip);
      const beam = power.querySelector('i');
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .to(boot, { opacity: 0, duration: .2, ease: 'none' })
        .to(beam, { scaleX: 1, duration: .35, ease: 'power3.inOut' }, '<')
        .to(beam, { scaleY: 60, opacity: 0, duration: .5, ease: 'power2.in' })
        .to(power, { opacity: 0, duration: .45, ease: 'power2.out' }, '<.12')
        .set(power, { display: 'none' })
        .to(lines, { yPercent: 0, duration: 1.1, stagger: .08 }, '<-.1')
        .to(bits, { opacity: 1, y: 0, duration: .8, stagger: .04 }, '<.15')
        .to('[data-glow]', { opacity: 1, duration: 1.4, ease: 'power2.out' }, '<');
    });
  }

  /* ---------- Переход с первого экрана в сайт ----------
     Окно-экран раскрывается на весь монитор, серебро перетекает в тёмно-синюю ночь,
     провод из нитей раскручивается, нити серебрятся и разлетаются в стороны. Фон ночи = фон следующего блока. */
  function heroScroll() {
    const stage = $('[data-stage]');
    const metal = $('[data-metal]');
    if (!reduce && metal) {
      // блик на серебре едет за мышкой
      $('.hero').addEventListener('pointermove', (e) => {
        metal.style.setProperty('--sheen', `${(e.clientX / innerWidth) * 100}%`);
      }, { passive: true });
    }
    if (!hasGSAP || reduce || restore) return;

    const fx = { open: 0, night: 0, untwist: 0, spread: 0 };
    const push = () => window.fibersFX && window.fibersFX.set(fx);
    const mobile = matchMedia('(max-width: 860px)').matches;
    ScrollTrigger.config({ ignoreMobileResize: true });
    gsap.set(stage, { '--open': 0 });

    heroTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.hero', start: 'top top', end: mobile ? '+=110%' : '+=170%',
        pin: true, scrub: 1, anticipatePin: 1,
      },
    })
      .to(fx, { untwist: 1, duration: .42, ease: 'power1.inOut', onUpdate: push }, 0)
      .to('[data-screen-ui]', { opacity: 0, y: -50, duration: .28, ease: 'power2.in' }, 0)
      .to('[data-glow]', { opacity: 0, duration: .3 }, 0)
      // тяжёлая тень рамки гаснет в начале раскрытия — её не нужно перерисовывать каждый кадр
      .to('[data-frame]', { opacity: 0, duration: .2 }, .06)
      .to(stage, { '--open': 1, duration: .55, ease: 'power2.inOut' }, .06)
      .to(fx, { open: 1, duration: .55, ease: 'power2.inOut', onUpdate: push }, .06)
      .to('[data-night]', { opacity: 1, duration: .42, ease: 'power1.inOut' }, .2)
      .to(fx, { night: 1, duration: .42, ease: 'power1.inOut', onUpdate: push }, .2)
      .to(fx, { spread: 1, duration: .4, ease: 'power2.in', onUpdate: push }, .6);

    // первый экран целиком ушёл вверх — убираем его насовсем
    goneTrigger = ScrollTrigger.create({
      trigger: '#about', start: 'top top',
      onEnter: () => requestAnimationFrame(() => dropHero(true)),
    });
  }

  let heroTl = null, goneTrigger = null;
  function dropHero(keepView) {
    if (heroGone || !heroEl) return;
    heroGone = true;
    const about = $('#about');
    const before = about.getBoundingClientRect().top;
    if (goneTrigger) goneTrigger.kill();
    if (heroTl) { heroTl.scrollTrigger.kill(); heroTl.kill(); }
    heroEl.hidden = true;
    const spacer = heroEl.parentElement;
    if (spacer && spacer.classList.contains('pin-spacer')) spacer.style.display = 'none';
    root.classList.add('hero-gone');
    ScrollTrigger.refresh();
    // содержимое остаётся на месте — пропадает только то, что уже выше экрана
    if (keepView) jump(scrollY + about.getBoundingClientRect().top - before);
    savePos();
  }

  function savePos() {
    if (!oneWay) return;
    if (heroGone) store.set('pos', String(Math.round(scrollY)));
    else store.del('pos');
  }

  /* ---------- Появление блоков при прокрутке ---------- */
  function reveals() {
    const els = $$('[data-reveal]');
    const portrait = window.portraitFX;
    const nameEl = $('.about__name');

    if (!hasGSAP || reduce) {
      if (portrait) portrait.set(1);
      const io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) { decodeName(); io.disconnect(); }
      });
      if (nameEl) io.observe(nameEl);
      return;
    }

    gsap.set(els, { opacity: 0, y: 44 });
    ScrollTrigger.batch(els, {
      start: 'top 88%', once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: .09, ease: 'expo.out', overwrite: true }),
    });

    if (portrait) {
      ScrollTrigger.create({
        trigger: '[data-portrait]', start: 'top bottom', end: 'top 20%', scrub: 1,
        onUpdate: (s) => portrait.set(s.progress),
        onRefresh: (s) => portrait.set(s.progress),
      });
    }
    if (nameEl) ScrollTrigger.create({ trigger: nameEl, start: 'top 82%', once: true, onEnter: decodeName });

    // лента фото едет вбок, пока листаешь (на широком экране)
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      const track = $('[data-strip-track]');
      gsap.fromTo(track, { x: () => innerWidth * .12 }, {
        x: () => -(track.scrollWidth - innerWidth * .88), ease: 'none',
        scrollTrigger: { trigger: '[data-strip]', start: 'top bottom', end: 'bottom top', scrub: .5, invalidateOnRefresh: true },
      });
      gsap.to('.works__bg', {
        yPercent: 10, ease: 'none',
        scrollTrigger: { trigger: '.works', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    gsap.from('[data-foot] span', {
      yPercent: 100, stagger: .05, ease: 'none',
      scrollTrigger: { trigger: '.foot', start: 'top 95%', end: 'bottom bottom', scrub: .6 },
    });
  }

  /* ---------- Шапка: показ, активный раздел, счётчик ---------- */
  function nav() {
    const bar = $('[data-nav]');
    const count = $('[data-count]');
    const about = $('#about');
    const links = $$('[data-nav-link]');
    new IntersectionObserver(([e]) => {
      bar.classList.toggle('is-shown', e.boundingClientRect.top < innerHeight * .7);
    }, { threshold: [0, .01, .5, 1] }).observe(about);
    addEventListener('scroll', () => {
      if (scrollY < 40 && !heroGone) bar.classList.remove('is-shown');
    }, { passive: true });
    // «наверх», когда первого экрана уже нет, — к началу сайта
    $('.nav__brand').addEventListener('click', (e) => {
      if (!heroGone) return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });

    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        count.textContent = e.target.dataset.section;
        links.forEach((l) => l.classList.toggle('is-active', l.dataset.navLink === e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('[data-section]').forEach((s) => io.observe(s));
  }

  /* ---------- Карточка Audi: рентген-линза ---------- */
  function xrayCard() {
    const box = $('[data-xray]');
    if (!box) return;
    const top = box.querySelector('.xray__top');
    const lens = box.querySelector('.xray__lens');
    let x = .5, y = .55, tx = .5, ty = .55, hover = false, raf = 0, vis = false;
    const t0 = performance.now();

    const tick = (now) => {
      if (!hover) {
        const t = (now - t0) / 1000;
        tx = .5 + Math.sin(t * .55) * .3;
        ty = .56 + Math.sin(t * 1.1) * .14;
      }
      x += (tx - x) * .14; y += (ty - y) * .14;
      const w = box.clientWidth, h = box.clientHeight, r = Math.max(60, w * .19);
      top.style.setProperty('--x', `${x * w}px`);
      top.style.setProperty('--y', `${y * h}px`);
      top.style.setProperty('--r', `${r}px`);
      lens.style.width = lens.style.height = `${r * 1.7}px`;
      lens.style.margin = `${-r * .85}px 0 0 ${-r * .85}px`;
      lens.style.transform = `translate(${x * w}px, ${y * h}px)`;
      raf = vis ? requestAnimationFrame(tick) : 0;
    };
    new IntersectionObserver(([e]) => {
      vis = e.isIntersecting;
      if (vis && !raf) raf = requestAnimationFrame(tick);
    }).observe(box);
    if (reduce) { vis = false; tick(t0); }

    const move = (e) => {
      const r = box.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height;
      hover = true;
      if (reduce) tick(performance.now());
    };
    box.addEventListener('pointermove', move, { passive: true });
    box.addEventListener('pointerdown', move, { passive: true });
    box.addEventListener('pointerleave', () => { hover = false; });
  }

  /* ---------- Карточка магазина: три стиля ---------- */
  function shopCard() {
    const box = $('[data-shop]');
    if (!box) return;
    const imgs = $$('img', box);
    const btns = $$('button', box);
    let i = 0, timer = 0, pausedUntil = 0;
    const set = (n) => {
      i = n;
      imgs.forEach((im, k) => im.classList.toggle('is-on', k === n));
      btns.forEach((b, k) => { b.classList.toggle('is-on', k === n); b.setAttribute('aria-pressed', String(k === n)); });
    };
    btns.forEach((b, k) => b.addEventListener('click', () => { set(k); pausedUntil = performance.now() + 9000; }));
    if (reduce) return;
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) {
        timer = setInterval(() => { if (performance.now() > pausedUntil) set((i + 1) % imgs.length); }, 2800);
      }
    }).observe(box);
  }

  /* ---------- Пирамида: наклон за мышкой ---------- */
  function tiltCard() {
    const box = $('[data-tilt]');
    if (!box || reduce) return;
    const img = box.querySelector('img');
    box.addEventListener('pointermove', (e) => {
      const r = box.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      img.style.setProperty('--rx', `${-y * 10}deg`);
      img.style.setProperty('--ry', `${x * 14}deg`);
    }, { passive: true });
    box.addEventListener('pointerleave', () => {
      img.style.setProperty('--rx', '0deg');
      img.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- «Подробнее» в карточках ---------- */
  function moreToggles() {
    $$('[data-more]').forEach((m) => {
      const btn = m.querySelector('button');
      btn.addEventListener('click', () => {
        const open = m.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
        if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 500);
      });
    });
  }

  /* ---------- Тумблер «мои работы / на заказ» ---------- */
  function wipToggle() {
    const tg = $('[data-toggle]');
    if (!tg) return;
    const tabs = $$('[data-tab]', tg);
    const title = $('[data-wip-title]');
    const text = $('[data-wip-text]');
    const TEXT = {
      mine: ['Мои работы', 'Собираю подборку — скоро здесь появятся постеры, обложки и другие мои работы.'],
      order: ['Работы на заказ', 'Здесь будут работы, сделанные для заказчиков. Хочешь, чтобы первой была твоя? Напиши — обсудим.'],
    };
    const select = (k, focus) => {
      tabs.forEach((b, n) => {
        const on = n === k;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      tg.style.setProperty('--pos', k);
      const [h, p] = TEXT[tabs[k].dataset.tab];
      if (hasGSAP && !reduce) {
        gsap.timeline()
          .to([title, text], { opacity: 0, y: -6, duration: .16, ease: 'power1.in' })
          .add(() => { title.textContent = h; text.textContent = p; })
          .to([title, text], { opacity: 1, y: 0, duration: .4, stagger: .05, ease: 'expo.out' });
        decode(title, h, 500);
      } else { title.textContent = h; text.textContent = p; }
    };
    tabs.forEach((b, n) => {
      b.tabIndex = n === 0 ? 0 : -1;
      b.addEventListener('click', () => select(n));
      b.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); select(n === 0 ? 1 : 0, true); }
      });
    });
  }

  /* ---------- Кнопки соцсетей ---------- */
  const toastEl = $('[data-toast]');
  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-shown'), 2400);
  }

  function socialLinks() {
    $$('[data-link]').forEach((a) => {
      const url = (LINKS[a.dataset.link] || '').trim();
      const sub = a.querySelector('[data-link-sub]');
      const safe = /^https:\/\//i.test(url) || /^mailto:/i.test(url);
      if (url && safe) {
        a.href = url;
        if (/^https:/i.test(url)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        if (sub) sub.textContent = url.replace(/^(https:\/\/|mailto:)/i, '').replace(/^(www\.)?/, '').slice(0, 28);
      } else {
        a.setAttribute('aria-disabled', 'true');
        a.addEventListener('click', (e) => { e.preventDefault(); toast('Ссылка появится совсем скоро'); });
      }
    });
  }

  /* ---------- Запуск ---------- */
  if (store.get('name-revealed')) revealName();
  intro();
  heroScroll();
  reveals();
  nav();
  xrayCard();
  shopCard();
  tiltCard();
  moreToggles();
  wipToggle();
  socialLinks();

  if (restore) {
    // обновили страницу в середине: первого экрана уже нет, возвращаемся туда, где остановились
    dropHero(false);
    const target = hashLink ? document.getElementById(location.hash.slice(1)) : null;
    let moved = false; // человек уже листает сам — больше не двигаем страницу
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, () => { moved = true; }, { once: true, passive: true }));
    const place = () => { if (!moved) jump(target ? target.getBoundingClientRect().top + scrollY : savedY); };
    place();
    // шрифты и картинки могли сдвинуть вёрстку — ставим на место ещё раз
    if (document.fonts) document.fonts.ready.then(() => { ScrollTrigger.refresh(); place(); });
    addEventListener('load', () => { ScrollTrigger.refresh(); place(); }, { once: true });
  } else if (hasGSAP) {
    // пересчитать позиции, когда догрузятся шрифты и картинки
    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
    addEventListener('load', () => ScrollTrigger.refresh());
  }

  if (oneWay) {
    let saving = 0;
    addEventListener('scroll', () => {
      if (!saving) saving = requestAnimationFrame(() => { saving = 0; savePos(); });
    }, { passive: true });
    addEventListener('pagehide', savePos);
    savePos();
  }
})();
