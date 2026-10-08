// Ремонт Квартир 64 · набросок. Без библиотек и без отправки данных: заявка уходит ссылкой в мессенджер.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const ease = {
    inOut: k => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    out: k => 1 - Math.pow(1 - k, 3),
  };
  const tween = (ms, fn, e = ease.inOut) => new Promise(res => {
    const t0 = performance.now();
    const fr = t => { const k = Math.min(1, (t - t0) / ms); fn(e(k)); k < 1 ? requestAnimationFrame(fr) : res(); };
    requestAnimationFrame(fr);
  });

  // шапка и нижняя панель
  const top = $('.top'), mbar = $('.mbar');
  const onScroll = () => top.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (mbar && 'IntersectionObserver' in window) {
    let heroVisible = true, formVisible = false;
    const upd = () => mbar.classList.toggle('on', !heroVisible && !formVisible);
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; upd(); }).observe($('#scene'));
    new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; upd(); }, { threshold: .15 }).observe($('#zayavka'));
  }

  // ---------- подоконник: пластик ↔ керамогранит ----------
  const scene = $('#scene'), svg = $('#sceneSvg');
  const L = 230, R = 970, REST = 700;
  const clipA = $('#clipRectA'), clipB = $('#clipRectB');
  const laser = $('#laser'), laserH = $('#laserH'), knob = $('#knob'), tags = $('#tags');
  const laserLine = $('#laserLine'), laserGlow = $('#laserGlow'), laserDot = $('#laserDot');
  const tagL = $('#tagL'), tagR = $('#tagR'), range = $('#seam');
  const GLOSS = { white: 1, marble: .7, concrete: .3, nero: .7, travertine: .45 };
  let seam = L, intro = true, stone = 'marble', busy = false;

  const placeLaser = x => {
    laserLine.setAttribute('d', `M${x} 430 V600`); laserGlow.setAttribute('d', `M${x} 430 V600`);
    laserDot.setAttribute('cx', x);
  };
  const setSeam = x => {
    seam = Math.max(L, Math.min(R, x));
    clipA.setAttribute('width', seam);
    if (!busy) placeLaser(seam);
    knob.setAttribute('transform', `translate(${seam - REST} 0)`);
    tagL.setAttribute('x', seam - 16); tagR.setAttribute('x', seam + 16);
    tagL.style.opacity = seam < 380 ? 0 : 1; tagR.style.opacity = seam > 860 ? 0 : 1;
    range.value = Math.round((seam - L) / (R - L) * 100);
  };
  const showControls = () => { knob.setAttribute('opacity', 1); tags.setAttribute('opacity', 1); };

  async function runIntro() {
    if (reduce) { setSeam(REST); showControls(); laser.setAttribute('opacity', .35); scene.classList.add('ready'); intro = false; return; }
    setSeam(L);
    await sleep(650);
    if (!intro) return;
    await tween(260, k => { laser.setAttribute('opacity', k); laserH.setAttribute('opacity', k); });
    await tween(1700, k => { if (intro) { setSeam(L + (R - L) * k); laserH.setAttribute('opacity', 1 - k); } });
    if (!intro) return;
    scene.classList.add('ready');
    await sleep(260);
    await tween(760, k => {
      if (!intro) return;
      setSeam(R - (R - REST) * k);
      laser.setAttribute('opacity', 1 - .65 * k); knob.setAttribute('opacity', k); tags.setAttribute('opacity', k);
    }, ease.out);
    intro = false;
  }
  const stopIntro = () => {
    if (!intro) return;
    intro = false; laserH.setAttribute('opacity', 0); laser.setAttribute('opacity', .35); showControls(); scene.classList.add('ready');
  };

  // на телефоне подоконник крупнее: показываем середину, края уходят за кадр
  const phone = matchMedia('(max-width: 640px)');
  const fitView = () => svg.setAttribute('viewBox', phone.matches ? '290 250 620 470' : '200 160 800 520');
  fitView(); phone.addEventListener('change', fitView);

  const toSvgX = ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  let dragging = false;
  svg.addEventListener('pointerdown', ev => {
    const p = toSvgX(ev);
    if (p.y < 400 || p.y > 700) return;
    dragging = true; svg.setPointerCapture(ev.pointerId); stopIntro(); scene.classList.add('touched'); setSeam(p.x);
  });
  svg.addEventListener('pointermove', ev => { if (dragging) setSeam(toSvgX(ev).x); });
  const endDrag = () => { dragging = false; };
  svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);
  range.addEventListener('input', () => { stopIntro(); scene.classList.add('touched'); setSeam(L + (R - L) * range.value / 100); });

  // примерка цвета: новый камень «прорисовывается» лазером поверх старого
  const src = n => `img/stone/${n}.jpg`;
  Object.keys(GLOSS).forEach(n => { const i = new Image(); i.src = src(n); });
  const setLayer = (layer, n) => {
    $(layer === 'A' ? '#imgA' : '#imgB').setAttribute('href', src(n));
    $(layer === 'A' ? '#edgeA' : '#edgeB').setAttribute('href', src(n));
    $(`#stone${layer} .gloss`).setAttribute('opacity', GLOSS[n]);
  };
  setLayer('A', stone);
  const stoneSelect = $('#fStone');
  const names = Object.fromEntries($$('.sw').map(b => [b.dataset.stone, b.dataset.name]));
  async function pickStone(n) {
    if (n === stone || busy) return;
    stopIntro(); stone = n;
    $$('.sw').forEach(b => b.setAttribute('aria-checked', b.dataset.stone === n));
    if (stoneSelect) stoneSelect.value = names[n];
    updateMessage();
    if (reduce) { setLayer('A', n); return; }
    busy = true; setLayer('B', n);
    const to = seam;
    laser.setAttribute('opacity', 1);
    await tween(Math.max(450, (to - L) * 1.5), k => { const x = L + (to - L) * k; clipB.setAttribute('width', x); placeLaser(x); });
    setLayer('A', n); clipB.setAttribute('width', 0);
    busy = false; placeLaser(seam);
    await tween(400, k => laser.setAttribute('opacity', 1 - .65 * k));
  }
  const sws = $$('.sw');
  sws.forEach((b, i) => {
    b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
    b.addEventListener('click', () => { sws.forEach(x => (x.tabIndex = -1)); b.tabIndex = 0; pickStone(b.dataset.stone); });
    b.addEventListener('keydown', ev => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
      if (!d) return;
      ev.preventDefault(); const nb = sws[(i + d + sws.length) % sws.length]; nb.focus(); nb.click();
    });
  });
  runIntro();

  // ---------- цены: вкладки ----------
  const tabs = $$('.tabs [role=tab]');
  const openTab = t => {
    tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => openTab(t));
    t.addEventListener('keydown', ev => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[ev.key]; if (!d) return;
      ev.preventDefault(); const nt = tabs[(i + d + tabs.length) % tabs.length]; nt.focus(); openTab(nt);
    });
  });

  // ---------- объекты: до / после ----------
  $$('[data-ba]').forEach(card => {
    const btns = $$('.ba-switch button', card);
    btns.forEach(b => b.addEventListener('click', () => {
      card.classList.toggle('show-before', b.dataset.show === 'before');
      btns.forEach(x => x.setAttribute('aria-pressed', x === b));
    }));
  });

  // ---------- заявка: собираем текст и ссылки ----------
  const form = $('#leadForm'), pv = $('#pvText'), tg = $('#sendTg'), vk = $('#sendVk'), toast = $('#toast');
  const TG = 'https://t.me/IvanIvanov064';
  const val = n => (form.elements[n] ? String(form.elements[n].value || '').trim() : '');
  const digits = n => val(n).replace(/\D+/g, '').slice(0, 4);
  function buildMessage() {
    const what = val('what') || $('input[name=what]:checked', form).value;
    const lines = ['Здравствуйте! Пишу с сайта.'];
    if (what === 'sill') {
      lines.push('Нужен подоконник из керамогранита.');
      const len = digits('len'), wid = digits('wid'), qty = digits('qty');
      if (len || wid) lines.push(`Размер: ${len || '?'} × ${wid || '?'} см.`);
      if (qty) lines.push(`Окон: ${qty}.`);
      if (val('stone')) lines.push(`Цвет: ${val('stone')}.`);
    } else {
      lines.push({ flat: 'Нужен ремонт квартиры под ключ.', bath: 'Нужен ремонт ванной.', other: 'Хочу спросить про ремонт.' }[what]);
      if (digits('area')) lines.push(`Площадь: ${digits('area')} м².`);
    }
    if (val('place')) lines.push(`Где: ${val('place')}.`);
    if (val('note')) lines.push(val('note'));
    if (val('name')) lines.push(`Меня зовут ${val('name')}.`);
    return lines.join('\n');
  }
  function updateMessage() {
    if (!form) return;
    const what = $('input[name=what]:checked', form).value;
    $('#fSill').hidden = what !== 'sill';
    $('#fFlat').hidden = !(what === 'flat' || what === 'bath');
    const text = buildMessage();
    pv.textContent = text;
    tg.href = `${TG}?text=${encodeURIComponent(text)}`;
  }
  form.addEventListener('input', updateMessage);
  form.addEventListener('change', updateMessage);
  form.addEventListener('submit', ev => ev.preventDefault());
  vk.addEventListener('click', () => {
    const text = buildMessage();
    const done = ok => {
      toast.textContent = ok ? 'Текст скопирован. Вставьте его в сообщение ВКонтакте.' : 'Скопируйте текст из поля «Сообщение» и вставьте его ВКонтакте.';
      toast.hidden = false; clearTimeout(done.t); done.t = setTimeout(() => (toast.hidden = true), 6000);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => done(true), () => done(false));
    else done(false);
  });
  // кнопки «Рассчитать подоконник» / «Хочу такой» сразу выбирают подоконник и цвет из примерки
  $$('[data-want=sill]').forEach(a => a.addEventListener('click', () => {
    const r = $('input[name=what][value=sill]', form); if (r) r.checked = true;
    if (stoneSelect) stoneSelect.value = names[stone];
    updateMessage();
  }));
  updateMessage();
})();
