/* ==========================================================
   Широков Иван (ALMES37). Главный скрипт портфолио.
   ========================================================== */

/* Ссылки на соцсети. Впиши адрес, и строка появится в блоке «Связь».
   Пустая строка: пункт спрятан. Принимаются только https://… и mailto:…
   Пример: vk: 'https://vk.com/твой_адрес', mail: 'mailto:почта@пример.ru' */
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
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const motion = hasGSAP && !reduce;
  if (reduce) root.classList.add('reduced');
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* приватный режим: не страшно */ } },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) { /* не страшно */ } },
  };

  /* Первый экран «одноразовый»: когда он целиком ушёл вверх, он убирается, и вернуться к нему прокруткой нельзя.
     Обновил страницу в начале: заставка играет снова. Обновил в середине: сайт открывается там же, без заставки. */
  const oneWay = motion;
  const heroEl = $('.hero');
  let heroGone = false;
  const savedRaw = oneWay ? parseFloat(store.get('pos')) : NaN;
  const savedY = savedRaw > 40 ? savedRaw : NaN; // в самом верху сайта это «начало»: снова показываем заставку
  const hashLink = location.hash.length > 1 && location.hash !== '#top' && Number.isNaN(savedRaw);
  const restore = oneWay && (Number.isFinite(savedY) || hashLink);
  if (oneWay) {
    ScrollTrigger.clearScrollMemory('manual');
    if (!restore && location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  const jump = (y) => window.scrollTo({ top: y, behavior: 'instant' });

  /* ---------- Перебор символов (для заголовка в «Дизайне») ---------- */
  const GLYPHS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ#%&*/<>▒░▓';
  const rnd = (s) => s[Math.floor(Math.random() * s.length)];
  function decode(el, text, duration = 600) {
    if (reduce) { el.textContent = text; return; }
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const done = Math.floor(p * text.length);
      let out = '';
      for (let i = 0; i < text.length; i++) out += i < done || text[i] === ' ' ? text[i] : rnd(GLYPHS);
      el.textContent = out;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Ссылки на соцсети ---------- */
  function socialLinks() {
    $$('[data-link]').forEach((a) => {
      const url = (LINKS[a.dataset.link] || '').trim();
      const safe = /^https:\/\//i.test(url) || /^mailto:/i.test(url);
      const li = a.closest('li');
      if (url && safe) {
        a.href = url;
        if (/^https:/i.test(url)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        const sub = a.querySelector('[data-link-sub]');
        if (sub) sub.textContent = url.replace(/^(https:\/\/|mailto:)/i, '').replace(/^www\./i, '').slice(0, 32);
        if (li) li.hidden = false;
      } else if (li) {
        li.hidden = true; // пустую ссылку прячем, чтобы не было кнопок «в никуда»
      }
    });
  }

  /* ---------- Заставка ----------
     Темнота. Полоса света вытягивается поперёк экрана, раскрывается на две
     и открывает хромированный ALMES37, по буквам проходит блик.
     Потом экран мигает и включается серебром, выезжают заголовок и кнопка. */
  let heroIdle = false;            // можно ли двигать блик мышкой
  const afterIntro = [];           // что запустить, когда заставка закончилась
  const whenReady = (fn) => (heroIdle ? fn() : afterIntro.push(fn));
  const heroReady = () => { heroIdle = true; afterIntro.splice(0).forEach((fn) => fn()); };

  function intro() {
    if (!root.classList.contains('intro')) { heroReady(); return; }
    if (!motion || restore) { root.classList.remove('intro'); heroReady(); return; }
    window.__intro = true;

    const badge = $('[data-badge]');
    const chromeEl = badge.querySelector('.chrome');
    const shadow = chromeEl.querySelector('.chrome__shadow');
    const band = chromeEl.querySelector('.sweep-band');
    const bars = $$('[data-lightbar]');
    const lines = $$('[data-line]');
    const bits = $$('[data-intro]');
    const metal = $('[data-metal]');
    const frame = $('[data-frame]');
    const glow = $('[data-glow]');
    const dark = $('[data-dark]');
    const shutters = $$('[data-shutter]');

    gsap.set(dark, { opacity: 1 });
    gsap.set([frame, glow, metal], { opacity: 0 });
    gsap.set(['[data-screen-ui]', badge], { opacity: 1 });
    gsap.set(lines, { yPercent: 118 });
    gsap.set(bits, { opacity: 0, y: 14 });
    gsap.set(shutters, { display: 'block', y: 0 });
    gsap.set(shadow, { opacity: 0 });
    gsap.set(bars, { scaleX: 0, opacity: 1, y: 0 });
    root.classList.remove('intro'); // дальше видимостью управляет GSAP

    // пока идёт заставка, страницу не крутим: иначе прокрутка начнёт раскрывать экран раньше времени
    const block = (e) => e.preventDefault();
    const keys = (e) => { if ([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) e.preventDefault(); };
    addEventListener('wheel', block, { passive: false });
    addEventListener('touchmove', block, { passive: false });
    addEventListener('keydown', keys);

    const travel = () => badge.offsetHeight * 0.66;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: finish });
    tl.to(bars, { scaleX: 1, duration: 0.85, ease: 'expo.inOut' }, 0.2)
      .to(frame, { opacity: 0.3, duration: 0.9, ease: 'power2.out' }, 0.45)
      // полосы расходятся вверх и вниз и тянут за собой шторки: шильдик открывается от середины
      .to([bars[0], shutters[0]], { y: () => -travel(), duration: 0.75, ease: 'power3.inOut' }, 1.0)
      .to([bars[1], shutters[1]], { y: () => travel(), duration: 0.75, ease: 'power3.inOut' }, 1.0)
      .set(shutters, { display: 'none' }, 1.8)
      .to(bars, { opacity: 0, duration: 0.4, ease: 'power1.in' }, 1.5)
      .fromTo(band, { xPercent: -100 }, { xPercent: 100, duration: 1.1, ease: 'power2.inOut' }, 1.38)
      // экран включается: короткое мерцание, как у монитора
      .to(metal, { keyframes: { opacity: [0, 0.85, 0.35, 1], easeEach: 'none' }, duration: 0.42, ease: 'none' }, 2.05)
      .to(dark, { opacity: 0, duration: 0.9, ease: 'power2.out' }, 2.05)
      .to(frame, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 2.05)
      .to(glow, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 2.2)
      .to(shadow, { opacity: 0.55, duration: 0.9, ease: 'power2.out' }, 2.25)
      .to(lines, { yPercent: 0, duration: 1.15, stagger: 0.1 }, 2.3)
      .to(bits, { opacity: 1, y: 0, duration: 0.8, stagger: 0.05 }, 2.45);

    // нетерпеливым: клик, клавиша или колесо ускоряют заставку в пять раз
    const skip = () => tl.timeScale(5);
    const evs = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    evs.forEach((ev) => addEventListener(ev, skip, { once: true, passive: true }));

    function finish() {
      evs.forEach((ev) => removeEventListener(ev, skip));
      removeEventListener('wheel', block);
      removeEventListener('touchmove', block);
      removeEventListener('keydown', keys);
      gsap.set([...bars, ...shutters], { display: 'none' });
      heroReady();
    }
  }

  /* ---------- Блик вокруг курсора на хромированной надписи ----------
     Круглое пятно света обрезано по буквам: водишь мышкой рядом с ALMES37, и хром блестит вокруг неё.
     Радиус в пикселях экрана, пятно догоняет курсор с небольшой задержкой. */
  function spotlight(zone, chromeEl, rpx, allowed = () => true) {
    const svg = chromeEl && chromeEl.querySelector('.chrome__sweep');
    const spot = svg && svg.querySelector('.spot');
    const spark = svg && svg.querySelector('.spark');
    if (!spot || reduce) return { busy: () => false };
    const vb = svg.viewBox.baseVal;
    let x = 0, y = 0, tx = 0, ty = 0, op = 0, top = 0, raf = 0, on = false, tapTimer = 0, rad = 1;
    const loop = () => {
      x += (tx - x) * 0.24; y += (ty - y) * 0.24; op += (top - op) * 0.16;
      spot.setAttribute('cx', x.toFixed(1));
      spot.setAttribute('cy', y.toFixed(1));
      spot.style.opacity = op.toFixed(3);
      if (spark) { // искра-звёздочка в центре: чуть поворачивается, пока ведёшь мышкой
        spark.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(x * 0.02).toFixed(1)}) scale(${(rad * 0.95).toFixed(1)})`);
        spark.style.opacity = (op * 0.9).toFixed(3);
      }
      const moving = Math.abs(tx - x) > 0.6 || Math.abs(ty - y) > 0.6 || Math.abs(top - op) > 0.01;
      raf = moving ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const aim = (e) => {
      const r = svg.getBoundingClientRect();
      if (!r.width) return false;
      const k = vb.width / r.width; // единиц рисунка на пиксель
      const near = allowed() && e.clientX > r.left - rpx && e.clientX < r.right + rpx && e.clientY > r.top - rpx && e.clientY < r.bottom + rpx;
      tx = vb.x + (e.clientX - r.left) * k;
      ty = vb.y + (e.clientY - r.top) * k;
      rad = rpx * k;
      spot.setAttribute('r', rad.toFixed(1));
      if (near && !on) { x = tx; y = ty; } // загорается сразу под курсором, а не прилетает издалека
      on = near; top = near ? 1 : 0;
      kick();
      return near;
    };
    zone.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') aim(e); }, { passive: true });
    zone.addEventListener('pointerleave', () => { on = false; top = 0; kick(); });
    // на телефоне: коснулся надписи, и она вспыхнула под пальцем
    zone.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch' || !aim(e)) return;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { on = false; top = 0; kick(); }, 700);
    }, { passive: true });
    return { busy: () => on };
  }

  /* ---------- Блик на хроме и на алюминии: едет за мышкой ---------- */
  function heroLight() {
    const hero = heroEl;
    const sheen = $('[data-sheen]');
    const band = $('[data-badge] .sweep-band');
    if (!hero || !band || reduce || !hasGSAP) return;
    const sheenTo = gsap.quickTo(sheen, 'xPercent', { duration: 0.9, ease: 'power3' });
    let lastMove = 0, visible = true;
    gsap.set(band, { xPercent: -100 });

    // хром блестит вокруг курсора, пока шильдик стоит на месте (до прокрутки)
    const spot = spotlight(hero, $('[data-badge] .chrome'), 74, () => heroIdle && scrollY < 10);
    if (fine) {
      hero.addEventListener('pointermove', (e) => {
        if (!heroIdle || scrollY > 10) return;
        lastMove = performance.now();
        sheenTo((e.clientX / innerWidth - 0.5) * 40);
      }, { passive: true });
    }
    // сам по себе блик пробегает раз в несколько секунд, если мышь не трогают
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
    const glint = () => {
      if (heroIdle && visible && !heroGone && scrollY < 20 && !spot.busy() && performance.now() - lastMove > 3000 && !document.hidden) {
        gsap.fromTo(band, { xPercent: -100 }, { xPercent: 100, duration: 1.3, ease: 'power2.inOut', overwrite: true });
      }
      if (!heroGone) setTimeout(glint, 5200 + Math.random() * 2400);
    };
    whenReady(() => setTimeout(glint, 2600));
  }

  /* ---------- Переход с первого экрана в сайт ----------
     Окно-экран раскрывается на весь монитор, серебро перетекает в тёмно-синюю ночь,
     а шильдик уезжает наверх и «садится» в шапку. Фон ночи = фон следующего блока. */
  let heroTl = null, goneTrigger = null;
  function heroScroll() {
    if (!motion || restore) return;
    const badge = $('[data-badge]');
    const shadow = badge.querySelector('.chrome__shadow');
    const nav = $('[data-nav]');
    const navBrand = $('.nav__brand');
    const mobile = matchMedia('(max-width: 860px)').matches;
    ScrollTrigger.config({ ignoreMobileResize: true });
    const win = [$('[data-frame]'), $('[data-screen]')];
    gsap.set(win, { '--open': 0 });
    gsap.set(badge, { xPercent: -50, yPercent: -50, x: 0, y: 0 });

    // куда садиться: место маленького шильдика в шапке (сама шапка в этот момент ещё спрятана)
    let target = { x: 0, y: -300, s: 0.2 };
    const measure = () => {
      nav.classList.add('is-measure');
      const r = navBrand.getBoundingClientRect();
      nav.classList.remove('is-measure');
      if (!r.width || !badge.offsetWidth) return;
      // offsetLeft/offsetTop не зависят от transform: это центр шильдика (он сдвинут на -50% -50%)
      target = { x: r.left + r.width / 2 - badge.offsetLeft, y: r.top + r.height / 2 - badge.offsetTop, s: r.width / badge.offsetWidth };
    };
    measure();

    // кант истончается ступенями: класс меняется всего два раза за прокрутку
    const badgeChrome = badge.querySelector('.chrome');
    let slim = 0;
    const setSlim = (p) => {
      const lvl = p < 0.72 ? 0 : p < 0.86 ? 1 : 2;
      if (lvl === slim) return;
      slim = lvl;
      badgeChrome.classList.toggle('is-slim-1', lvl === 1);
      badgeChrome.classList.toggle('is-slim-2', lvl === 2);
    };

    let docked = false;
    const dock = (on) => {
      if (on === docked) return;
      docked = on;
      nav.classList.toggle('is-docked', on);
      badge.style.visibility = on ? 'hidden' : '';
    };

    heroTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: heroEl, start: 'top top', end: mobile ? '+=110%' : '+=145%',
        pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
        onRefreshInit: measure,
        onUpdate: (s) => { setSlim(s.progress); dock(s.progress > 0.985); },
      },
    })
      .to('[data-screen-ui]', { opacity: 0, y: -50, duration: 0.28, ease: 'power2.in' }, 0)
      .to('[data-glow]', { opacity: 0, duration: 0.3 }, 0)
      // тяжёлая тень рамки гаснет в начале раскрытия: её не нужно перерисовывать каждый кадр
      .to('[data-frame]', { opacity: 0, duration: 0.2 }, 0.06)
      .to(win, { '--open': 1, duration: 0.55, ease: 'power2.inOut' }, 0.06)
      .to('[data-night]', { opacity: 1, duration: 0.42, ease: 'power1.inOut' }, 0.2)
      .to(shadow, { opacity: 0, duration: 0.3 }, 0.2)
      .to(badge, { x: () => target.x, y: () => target.y, scale: () => target.s, duration: 0.62, ease: 'power3.inOut' }, 0.34)
      .fromTo(badge.querySelector('.sweep-band'), { xPercent: -100 }, { xPercent: 100, duration: 0.5, ease: 'power1.inOut', immediateRender: false }, 0.4);

    // первый экран целиком ушёл вверх: убираем его насовсем
    goneTrigger = ScrollTrigger.create({
      trigger: '#about', start: 'top top',
      onEnter: () => requestAnimationFrame(() => dropHero(true)),
    });
  }

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
    const nav = $('[data-nav]');
    nav.classList.add('is-shown');
    nav.classList.remove('is-docked');
    ScrollTrigger.refresh();
    // содержимое остаётся на месте: пропадает только то, что уже выше экрана
    if (keepView) jump(scrollY + about.getBoundingClientRect().top - before);
    savePos();
  }

  function savePos() {
    if (!oneWay) return;
    if (heroGone) store.set('pos', String(Math.round(scrollY)));
    else store.del('pos');
  }

  /* ---------- Шапка: показ, активный раздел ---------- */
  function nav() {
    const bar = $('[data-nav]');
    const about = $('#about');
    const links = $$('[data-nav-link]');
    const ind = $('[data-nav-ind]');
    new IntersectionObserver(([e]) => {
      bar.classList.toggle('is-shown', heroGone || e.boundingClientRect.top < innerHeight * 0.7);
    }, { threshold: [0, 0.01, 0.5, 1] }).observe(about);
    // «наверх», когда первого экрана уже нет: к началу сайта
    $$('.nav__brand, [data-top]').forEach((a) => a.addEventListener('click', (e) => {
      if (!heroGone) return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    }));

    // белая капсула с хромированным кантом ездит под пунктами; тёмный текст у того пункта, под которым она стоит
    if (hasGSAP) ind.style.transition = 'opacity .3s';
    let under = null;
    const setUnder = (link) => {
      if (under === link) return;
      if (under) under.classList.remove('is-under');
      under = link;
      if (link) link.classList.add('is-under');
    };
    const point = (link) => {
      if (!link || !link.offsetWidth) { ind.style.opacity = '0'; setUnder(null); return; }
      const x = link.offsetLeft, w = link.offsetWidth;
      const first = ind.style.opacity !== '1';
      ind.style.opacity = '1';
      if (!hasGSAP || first || reduce) {
        if (hasGSAP) gsap.set(ind, { x, width: w });
        else { ind.style.width = `${w}px`; ind.style.transform = `translateX(${x}px)`; }
        setUnder(link);
        return;
      }
      gsap.to(ind, { x, width: w, duration: 0.55, ease: 'expo.out', overwrite: 'auto' });
      gsap.delayedCall(0.12, () => setUnder(link)); // текст темнеет, когда капсула уже почти под пунктом
    };
    let active = null;
    if (fine) {
      links.forEach((l) => l.addEventListener('pointerenter', () => point(l)));
      $('[data-nav-links]').addEventListener('pointerleave', () => point(active));
    }
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        active = links.find((l) => l.dataset.navLink === e.target.id) || null;
        links.forEach((l) => {
          l.classList.toggle('is-active', l === active);
          if (l === active) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
        });
        point(active);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach((s) => io.observe(s));
    addEventListener('resize', () => point(active), { passive: true });
  }

  /* ---------- Кто за экраном: табло ALMES37 → ШИРОКОВ, потом ИВАН ---------- */
  function nameFlip() {
    const cells = $$('[data-flip] .flip');
    const last = $('[data-name-last]');
    if (!motion || !cells.length) return; // без анимации сразу видно «ШИРОКОВ ИВАН»
    const num = (c, k) => parseFloat(getComputedStyle(c).getPropertyValue(k));
    cells.forEach((c) => {
      gsap.set(c, { '--w': num(c, '--wa') });
      gsap.set(c.firstElementChild, { rotationX: 0 });
    });
    const lastChrome = last.querySelector('.chrome');
    const band = last.querySelector('.sweep-band');
    gsap.set(lastChrome, { clipPath: 'inset(-20% 100% -20% -4%)' });

    ScrollTrigger.create({
      trigger: '.about__name', start: 'top 80%', once: true,
      onEnter: () => {
        const tl = gsap.timeline();
        cells.forEach((c, i) => {
          tl.to(c.firstElementChild, { rotationX: 180, duration: 0.95, ease: 'back.inOut(1.3)' }, 0.15 + i * 0.09)
            .to(c, { '--w': num(c, '--wb'), duration: 0.95, ease: 'power3.inOut' }, 0.15 + i * 0.09);
        });
        tl.to(lastChrome, { clipPath: 'inset(-20% -4% -20% -4%)', duration: 1.1, ease: 'expo.inOut' }, 0.75);
        if (band) tl.fromTo(band, { xPercent: -100 }, { xPercent: 100, duration: 1.2, ease: 'power2.inOut' }, 1.15);
      },
    });
  }

  /* ---------- Появление текста при прокрутке ---------- */
  function reveals() {
    const portrait = window.portraitFX;
    // серебряные заголовки: по ним один раз проходит блик
    const lit = $$('[data-lit]');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-lit'); io.unobserve(e.target); }
      }), { rootMargin: '0px 0px -20% 0px' });
      lit.forEach((el) => io.observe(el));
    }

    if (!motion) { if (portrait) portrait.set(1); return; }

    const els = $$('[data-reveal]');
    gsap.set(els, { opacity: 0, y: 26 });
    ScrollTrigger.batch(els, {
      start: 'top 90%', once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.05, stagger: 0.09, ease: 'expo.out', overwrite: true }),
    });

    if (portrait) {
      ScrollTrigger.create({
        trigger: '[data-portrait]', start: 'top bottom', end: 'top 20%', scrub: 1,
        onUpdate: (s) => portrait.set(s.progress),
        onRefresh: (s) => portrait.set(s.progress),
      });
    }

    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      // лента фото едет вбок, пока листаешь, и слегка наклоняется от скорости прокрутки
      const track = $('[data-strip-track]');
      const skewTo = gsap.quickTo(track, 'skewX', { duration: 0.6, ease: 'power3' });
      gsap.fromTo(track, { x: () => innerWidth * 0.12 }, {
        x: () => -(track.scrollWidth - innerWidth * 0.88), ease: 'none',
        scrollTrigger: {
          trigger: '[data-strip]', start: 'top bottom', end: 'bottom top', scrub: 0.5, invalidateOnRefresh: true,
          onUpdate: (s) => skewTo(gsap.utils.clamp(-5, 5, s.getVelocity() / -350)),
        },
      });
      const settle = () => skewTo(0);
      ScrollTrigger.addEventListener('scrollEnd', settle);
      gsap.to('.works__bg', {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: '.works', start: 'top bottom', end: 'bottom top', scrub: true },
      });
      return () => ScrollTrigger.removeEventListener('scrollEnd', settle);
    });

    // фото работ открываются снизу вверх, как ворота гаража
    $$('[data-media]').forEach((m) => {
      const inner = $$(':scope > picture, :scope > .pyr__img', m);
      const st = { trigger: m, start: 'top 86%', once: true };
      gsap.fromTo(m, { clipPath: 'inset(100% 0% 0% 0% round 18px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.35, ease: 'expo.inOut', scrollTrigger: st,
        onComplete: () => gsap.set(m, { clearProps: 'clipPath' }),
      });
      if (inner.length) gsap.fromTo(inner, { scale: 1.16 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: st });
    });
  }

  /* ---------- Audi: рентген-линза ---------- */
  function xrayCard() {
    const box = $('[data-xray]');
    if (!box) return;
    const top = box.querySelector('.xray__top');
    const lens = box.querySelector('.xray__lens');
    let x = 0.5, y = 0.55, tx = 0.5, ty = 0.55, hover = false, raf = 0, vis = false;
    const t0 = performance.now();

    const tick = (now) => {
      if (!hover) {
        const t = (now - t0) / 1000;
        tx = 0.5 + Math.sin(t * 0.55) * 0.3;
        ty = 0.56 + Math.sin(t * 1.1) * 0.14;
      }
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      const w = box.clientWidth, h = box.clientHeight, r = Math.max(60, w * 0.17);
      top.style.setProperty('--x', `${x * w}px`);
      top.style.setProperty('--y', `${y * h}px`);
      top.style.setProperty('--r', `${r}px`);
      lens.style.width = lens.style.height = `${r * 1.7}px`;
      lens.style.margin = `${-r * 0.85}px 0 0 ${-r * 0.85}px`;
      lens.style.transform = `translate(${x * w}px, ${y * h}px)`;
      raf = vis ? requestAnimationFrame(tick) : 0;
    };
    new IntersectionObserver(([e]) => {
      vis = e.isIntersecting && !reduce;
      if (vis && !raf) raf = requestAnimationFrame(tick);
    }).observe(box);
    tick(t0);

    const move = (e) => {
      const r = box.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height;
      hover = true;
      if (reduce) { x = tx; y = ty; tick(performance.now()); }
    };
    box.addEventListener('pointermove', move, { passive: true });
    box.addEventListener('pointerdown', move, { passive: true });
    box.addEventListener('pointerleave', () => { hover = false; });
  }

  /* ---------- Магазины: колода из трёх витрин ---------- */
  function shopStack() {
    const box = $('[data-shop]');
    if (!box) return;
    const cards = $$('[data-card]', box);
    const btns = $$('.shop__tabs button', box);
    let order = cards.map((_, i) => i);
    let timer = 0, pausedUntil = 0;
    const pose = (d) => ({ xPercent: d * 6, yPercent: -d * 5, rotation: d * 3.2, scale: 1 - d * 0.055, zIndex: 10 - d });
    const shade = (c) => c.querySelector('.shopstack__shade');

    const place = (animate) => order.forEach((ci, d) => {
      const c = cards[ci];
      if (hasGSAP) {
        if (animate) {
          gsap.to(c, { ...pose(d), duration: 0.9, ease: 'expo.out', overwrite: 'auto' });
          gsap.to(shade(c), { opacity: d * 0.3, duration: 0.6, overwrite: 'auto' });
        } else {
          gsap.set(c, pose(d));
          gsap.set(shade(c), { opacity: d * 0.3 });
        }
      } else {
        const p = pose(d);
        c.style.transform = `translate(${p.xPercent}%, ${p.yPercent}%) rotate(${p.rotation}deg) scale(${p.scale})`;
        c.style.zIndex = p.zIndex;
        shade(c).style.opacity = d * 0.3;
      }
    });
    place(false);

    const setActive = (n) => btns.forEach((b, k) => { b.classList.toggle('is-on', k === n); b.setAttribute('aria-pressed', String(k === n)); });
    const show = (n) => {
      if (order[0] === n) return;
      const front = cards[order[0]];
      order = [n, ...order.filter((v) => v !== n)];
      setActive(n);
      if (!motion) { place(false); return; }
      // передняя витрина уходит вниз-влево и встаёт в конец колоды
      gsap.timeline()
        .to(front, { xPercent: -14, yPercent: 9, rotation: -7, duration: 0.32, ease: 'power2.in', overwrite: 'auto' })
        .add(() => place(true), 0.18);
    };
    const pause = () => { pausedUntil = performance.now() + 9000; };
    btns.forEach((b, k) => b.addEventListener('click', () => { show(k); pause(); }));
    cards.forEach((c, k) => c.addEventListener('click', () => { show(k); pause(); }));
    if (reduce) return;
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) timer = setInterval(() => { if (performance.now() > pausedUntil) show(order[1]); }, 3400);
    }).observe(box);
  }

  /* ---------- Пирамида: наклон за мышкой и параллакс ---------- */
  function pyramid() {
    const box = $('[data-tilt]');
    if (!box || reduce) return;
    const img = box.querySelector('img');
    if (fine) {
      box.addEventListener('pointermove', (e) => {
        const r = box.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        img.style.setProperty('--rx', `${-y * 9}deg`);
        img.style.setProperty('--ry', `${x * 12}deg`);
      }, { passive: true });
      box.addEventListener('pointerleave', () => { img.style.setProperty('--rx', '0deg'); img.style.setProperty('--ry', '0deg'); });
    }
    if (motion) {
      gsap.fromTo('[data-pyr-img]', { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  }

  /* ---------- Конфигуратор: крышка ноутбука и переключатель стилей ---------- */
  function konfig() {
    const laptop = $('[data-laptop]');
    if (!laptop) return;
    const lid = $('[data-lid]');
    const shots = $$('[data-shot]', laptop);
    const btns = $$('[data-styles] button');
    const glare = laptop.querySelector('.laptop__glare');

    // все четыре картинки подгружаем заранее, когда блок на подходе, чтобы переключение было мгновенным
    const imgs = shots.map((s) => s.querySelector('img'));
    new IntersectionObserver(([e], io) => {
      if (!e.isIntersecting) return;
      imgs.forEach((im) => { im.loading = 'eager'; });
      io.disconnect();
    }, { rootMargin: '800px 0px' }).observe(laptop);

    if (motion) {
      // крышка открывается, пока листаешь
      gsap.fromTo(lid, { rotationX: -82 }, {
        rotationX: 0, ease: 'power2.out',
        scrollTrigger: { trigger: laptop, start: 'top 95%', end: 'top 35%', scrub: 0.8 },
      });
      gsap.fromTo(glare, { opacity: 0 }, {
        opacity: 1, ease: 'none',
        scrollTrigger: { trigger: laptop, start: 'top 70%', end: 'top 35%', scrub: true },
      });
    }

    let i = 0, timer = 0, pausedUntil = 0, busy = false;
    const set = (n) => {
      if (n === i || busy) return;
      const prev = shots[i], next = shots[n];
      i = n;
      btns.forEach((b, k) => { b.classList.toggle('is-on', k === n); b.setAttribute('aria-pressed', String(k === n)); });
      const img = next.querySelector('img');
      img.loading = 'eager';
      const go = () => {
        if (!motion) { shots.forEach((s, k) => s.classList.toggle('is-on', k === n)); return; }
        busy = true;
        shots.forEach((s) => { s.style.zIndex = ''; });
        prev.style.zIndex = 1; next.style.zIndex = 2;
        next.classList.add('is-on');
        gsap.timeline({ onComplete: () => { prev.classList.remove('is-on'); gsap.set(next, { clearProps: 'clipPath' }); busy = false; } })
          .fromTo(next, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.95, ease: 'expo.inOut' })
          .fromTo(glare, { xPercent: -30 }, { xPercent: 30, duration: 0.95, ease: 'power2.inOut' }, 0);
      };
      (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(go);
    };
    btns.forEach((b, k) => b.addEventListener('click', () => { set(k); pausedUntil = performance.now() + 12000; }));
    if (reduce) return;
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) timer = setInterval(() => { if (performance.now() > pausedUntil) set((i + 1) % shots.length); }, 4200);
    }, { threshold: 0.35 }).observe(laptop);
  }

  /* ---------- Тумблер «мои работы / на заказ» ---------- */
  function wipToggle() {
    const tg = $('[data-toggle]');
    if (!tg) return;
    const tabs = $$('[data-tab]', tg);
    const title = $('[data-wip-title]');
    // блик по канту ручки крутится, только пока тумблер на экране
    new IntersectionObserver(([e]) => tg.classList.toggle('is-visible', e.isIntersecting)).observe(tg);
    const text = $('[data-wip-text]');
    const TEXT = {
      mine: ['Мои работы', 'Собираю подборку. Скоро здесь появятся постеры, обложки и другие мои работы.'],
      order: ['Работы на заказ', 'Здесь будут работы для заказчиков. Хочешь, чтобы первой была твоя? Напиши, обсудим.'],
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
      if (motion) {
        gsap.timeline()
          .to(text, { opacity: 0, y: -6, duration: 0.16, ease: 'power1.in' })
          .add(() => { text.textContent = p; })
          .to(text, { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out' });
        decode(title, h, 520);
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

  /* ---------- Подвал: буквы ALMES37 поднимаются, хром блестит вокруг курсора ---------- */
  function footer() {
    const foot = $('[data-foot]');
    const chromeEl = foot && foot.querySelector('.chrome');
    if (!chromeEl || !hasGSAP || reduce) return;
    const letters = $$('.chrome__metal .ch', chromeEl);
    const sweep = chromeEl.querySelector('.chrome__sweep');
    const band = chromeEl.querySelector('.sweep-band');
    gsap.set(band, { xPercent: -100 });
    gsap.set(sweep, { opacity: 0 });
    gsap.from(letters, {
      yPercent: 120, stagger: 0.06, ease: 'none',
      scrollTrigger: {
        trigger: foot, start: 'top 95%', end: 'bottom bottom', scrub: 0.6,
        onUpdate: (s) => gsap.to(sweep, { opacity: s.progress > 0.92 ? 1 : 0, duration: 0.4, overwrite: true }),
      },
    });
    let visible = false, lastMove = 0, risen = false;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(foot);
    ScrollTrigger.create({ trigger: foot, start: 'bottom bottom-=2', onEnter: () => { risen = true; }, onLeaveBack: () => { risen = false; } });
    const spot = spotlight(foot, chromeEl, 92, () => risen);
    foot.addEventListener('pointermove', () => { lastMove = performance.now(); }, { passive: true });
    const glint = () => {
      if (visible && !spot.busy() && performance.now() - lastMove > 3000 && !document.hidden) {
        gsap.fromTo(band, { xPercent: -100 }, { xPercent: 100, duration: 1.5, ease: 'power2.inOut', overwrite: true });
      }
      setTimeout(glint, 5600 + Math.random() * 2000);
    };
    setTimeout(glint, 4000);
  }

  /* ---------- Запуск ---------- */
  socialLinks();
  intro();
  heroLight();
  heroScroll();
  nav();
  nameFlip();
  reveals();
  xrayCard();
  shopStack();
  pyramid();
  konfig();
  wipToggle();
  footer();

  if (restore) {
    // обновили страницу в середине: первого экрана уже нет, возвращаемся туда, где остановились
    dropHero(false);
    const target = hashLink ? document.getElementById(location.hash.slice(1)) : null;
    let moved = false; // человек уже листает сам: больше не двигаем страницу
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, () => { moved = true; }, { once: true, passive: true }));
    const place = () => { if (!moved) jump(target ? target.getBoundingClientRect().top + scrollY : savedY); };
    place();
    // шрифты и картинки могли сдвинуть вёрстку: ставим на место ещё раз
    if (document.fonts) document.fonts.ready.then(() => { ScrollTrigger.refresh(); place(); });
    addEventListener('load', () => { ScrollTrigger.refresh(); place(); }, { once: true });
  } else if (hasGSAP) {
    // пересчитать позиции, когда догрузятся шрифты и картинки
    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
    addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
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
