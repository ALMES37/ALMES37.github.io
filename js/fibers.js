/* Оптоволоконные нити на первом экране.
   Пучок нитей свисает сверху, кончики светятся холодным светом и тянутся к курсору.
   Сначала нити скручены в провод. При прокрутке (window.fibersFX.set) провод раскручивается,
   экран раскрывается, наступает «ночь», нити становятся серебряными и разлетаются в стороны. Canvas 2D, без библиотек. */
(() => {
  const canvas = document.querySelector('[data-fibers]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.closest('section') || canvas.parentElement;
  const win = document.querySelector('[data-screen-ui]'); // рамка «экрана» — от неё считаем размеры
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, dpr = 1, strands = [], sparks = [], raf = 0, visible = true;
  let box = { x: 0, y: 0, w: 1, h: 1 };
  let burst = 0;
  const start = performance.now();
  const fx = { open: 0, night: 0, untwist: 0, spread: 0 };
  const mouse = { x: .6, y: .55, tx: .6, ty: .55, on: 0, ton: 0 };
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

  function rng(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // «огонёк» рисуем один раз заранее — так быстрее, чем градиент каждый кадр
  const sprite = (() => {
    const s = document.createElement('canvas'), n = 128;
    s.width = s.height = n;
    const g = s.getContext('2d');
    const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(.1, 'rgba(226,237,255,1)');
    r.addColorStop(.26, 'rgba(120,162,255,.7)');
    r.addColorStop(.55, 'rgba(40,82,200,.22)');
    r.addColorStop(1, 'rgba(20,50,160,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, n, n);
    return s;
  })();

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    box = win
      ? { x: win.offsetLeft, y: win.offsetTop, w: win.offsetWidth, h: win.offsetHeight }
      : { x: 0, y: 0, w: W, h: H };
    const small = box.w < 700;
    const rand = rng(37);
    const n = small ? 48 : 86;
    strands = [];
    for (let i = 0; i < n; i++) {
      const z = rand();                                   // 0 — дальние, 1 — ближние
      const bell = (rand() + rand() + rand() - 1.5) / 1.5; // больше нитей в центре пучка
      strands.push({
        z,
        a: Math.PI / 2 + bell * (small ? .5 : .66),
        len: .5 + rand() * .3 + z * .07,
        ox: (rand() - .5) * .035,
        ph: rand() * Math.PI * 2,
        sp: .35 + rand() * .55,
        tw: rand() * Math.PI * 2,
        w: .7 + z * 1.9 + rand() * .5,
      });
    }
    strands.sort((a, b) => a.z - b.z);
    sparks = Array.from({ length: small ? 18 : 34 }, () => ({
      x: rand(), y: rand(), s: rand(), v: .15 + rand() * .6, ph: rand() * 6.28,
    }));
  }

  function draw(now) {
    const t = (now - start) / 1000;
    mouse.x += (mouse.tx - mouse.x) * .07;
    mouse.y += (mouse.ty - mouse.y) * .07;
    mouse.on += (mouse.ton - mouse.on) * .05;
    burst *= .94;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const { open, night, untwist, spread } = fx;
    const small = box.w < 700;
    const ox = box.x + box.w * (small ? .6 : .57);
    const oyWin = box.y - box.h * (small ? .06 : .15);
    // когда экран раскрывается, «провод» уходит за верхний край
    const oy = lerp(oyWin, -H * .25, open);
    const mx = mouse.x * W, my = mouse.y * H;
    const sigma = Math.max(box.w, box.h) * .2;
    const scale = small ? 1.25 : 1;
    const fade = 1 - smooth(.55, 1, spread) * .9;

    // скрученный провод: ось, длина, радиус витков
    const cableEnd = box.y + box.h * (small ? .36 : .44);
    const cableSway = Math.sin(t * .6) * box.w * .01 + (mx - ox) * .12 * mouse.on;
    const R0 = box.w * (small ? .014 : .011);
    const TURNS = 3;
    const N = small ? 48 : 64;

    // цвет нитей: графит днём → серебро ночью
    const c0 = [lerp(18, 150, night), lerp(20, 160, night), lerp(24, 178, night)];
    const c1 = [lerp(34, 205, night), lerp(40, 214, night), lerp(52, 228, night)];
    const c2 = [lerp(70, 225, night), lerp(96, 235, night), lerp(160, 255, night)];

    for (const s of strands) {
      const L = s.len * box.h * (small ? .6 : 1.02) * (1 + open * .15);
      const sway = Math.sin(t * s.sp + s.ph) * .03 + Math.sin(t * .31 + s.ph * 2) * .018;
      const a = s.a + sway * (.6 + s.z * .7) + burst * Math.sin(s.ph * 3) * .25;

      // раскрученное положение — веер
      let tx = ox + Math.cos(a) * L;
      let ty = oyWin + Math.sin(a) * L;
      if (mouse.on > .01) {
        const dx = mx - tx, dy = my - ty;
        const f = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma)) * (.12 + s.z * .16) * mouse.on;
        tx += dx * f; ty += dy * f;
      }
      // в конце нити разлетаются в стороны
      const dir = Math.cos(a) < 0 ? -1 : 1;
      tx += dir * spread * (W * .5 + s.z * W * .4);
      ty += spread * box.h * (s.z - .35) * .5;

      const bx = ox + s.ox * box.w * untwist, by = oy;
      const ca = Math.PI / 2 + (a - Math.PI / 2) * .22;
      const cl = (ty - by) * .55;
      const cx = bx + Math.cos(ca) * cl + dir * spread * W * .15;
      const cy = by + Math.sin(ca) * cl;

      // точки нити: провод → веер (раскручивается от кончика к основанию)
      ctx.beginPath();
      let px = 0, py = 0;
      for (let i = 0; i <= N; i++) {
        const v = i / N, iv = 1 - v;
        const fx0 = iv * iv * bx + 2 * iv * v * cx + v * v * tx;
        const fy0 = iv * iv * by + 2 * iv * v * cy + v * v * ty;
        const flare = 1 + 3.2 * Math.pow(v, 6);               // на конце провод чуть распушён
        const ang = s.ph + v * TURNS * Math.PI * 2 + t * .7;
        const kx = ox + Math.sin(ang) * R0 * (.5 + s.z) * flare + cableSway * v;
        const ky = by + (cableEnd - by) * v + Math.cos(ang) * R0 * .3 + Math.pow(v, 6) * (s.z - .3) * box.h * .06;
        const k = smooth(0, 1, untwist * 1.6 - iv * .6);
        px = lerp(kx, fx0, k); py = lerp(ky, fy0, k);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }

      const alpha = (.22 + s.z * .78) * fade;
      const grad = ctx.createLinearGradient(bx, by, px, py);
      grad.addColorStop(0, `rgba(${c0},${alpha * lerp(1, .35, night)})`);
      grad.addColorStop(.72, `rgba(${c1},${alpha})`);
      grad.addColorStop(1, `rgba(${c2},${alpha})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = s.w * scale * lerp(1, .75, night);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      const tw = .82 + .18 * Math.sin(t * 2.1 + s.tw) + burst * .5;
      const R = (9 + s.z * 17) * tw * scale * (1 + night * .35) * lerp(.75, 1, untwist);
      ctx.globalAlpha = Math.min(1, (.5 + s.z * .5) * fade);
      ctx.drawImage(sprite, px - R, py - R, R * 2, R * 2);
      ctx.globalAlpha = 1;
    }

    // искры в воздухе
    for (const p of sparks) {
      const yy = ((p.y - t * p.v * .03) % 1 + 1) % 1;
      const x = lerp(ox + (p.x - .5) * box.w * .7, p.x * W, open) + Math.sin(t * .5 + p.ph) * 12;
      const y = lerp(box.y + box.h * .15 + yy * box.h * .8, yy * H, open);
      const big = p.s > .8;
      const r = big ? 10 + p.s * 10 : 1.5 + p.s * 3;
      ctx.globalAlpha = (big ? .16 : .75) * (.5 + .5 * Math.sin(t * 1.7 + p.ph)) * (1 - spread * .5);
      ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    draw(now);
    raf = visible ? requestAnimationFrame(loop) : 0;
  }
  function play() {
    if (reduce) { draw(start + 4000); return; }
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
  }

  window.fibersFX = {
    set(v) { Object.assign(fx, v); if (reduce) draw(performance.now()); },
  };

  build();
  play();

  new ResizeObserver(() => { build(); if (reduce || !raf) draw(performance.now()); }).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; play(); }).observe(canvas);
  document.addEventListener('visibilitychange', play);

  hero.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.tx = (e.clientX - r.left) / r.width;
    mouse.ty = (e.clientY - r.top) / r.height;
    mouse.ton = 1;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { mouse.ton = 0; });
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    burst = 1;
  });
})();
