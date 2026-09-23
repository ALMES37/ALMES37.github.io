/* Пиксельные эффекты:
   1) портрет, который собирается из оранжево-чёрных пикселей при прокрутке;
   2) живой постер Audi RS 7 ABT в стиле «битые данные». */
(() => {
  const INK = [10, 11, 14], EMBER = [26, 50, 112], PAPER = [226, 231, 238]; // графит, тёмно-синий, серебро
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16 - .5);
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const hash = (x, y) => {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Портрет ---------- */
  const fig = document.querySelector('[data-portrait]');
  if (fig) {
    const img = fig.querySelector('img');
    const cv = fig.querySelector('canvas');
    const ctx = cv.getContext('2d');
    const small = document.createElement('canvas');
    const sctx = small.getContext('2d', { willReadFrequently: true });
    let W = 0, H = 0, dpr = 1, progress = 0, canRead = true;

    const resize = () => {
      const r = fig.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      render();
    };

    function render() {
      if (!W || !img.complete || !img.naturalWidth) return;
      const p = progress;
      cv.style.opacity = String(1 - smooth(.86, 1, p));
      if (p >= 1) return;

      const e = smooth(0, 1, p);
      const cell = Math.max(2, 64 * Math.pow(1 - e, 1.25) + 2);
      const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
      small.width = cols; small.height = rows;

      // повторяем object-fit: cover
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const k = Math.max(W / iw, H / ih);
      const sw = W / k, sh = H / k;
      sctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, W / cell, H / cell);

      const glyphs = [];
      if (canRead) {
        try {
          const data = sctx.getImageData(0, 0, cols, rows);
          const a = data.data;
          const mix = smooth(.4, .9, p);
          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              const i = (y * cols + x) * 4;
              const r = a[i], g = a[i + 1], b = a[i + 2];
              let l = (r * .3 + g * .59 + b * .11) / 255;
              l = (l - .5) * 1.35 + .5 + BAYER[(y & 3) * 4 + (x & 3)] * .5;
              const c = l < .3 ? INK : l < .74 ? EMBER : PAPER;
              if (c === PAPER && cell > 15 && hash(x, y) > .8) glyphs.push(x, y);
              a[i] = c[0] + (r - c[0]) * mix;
              a[i + 1] = c[1] + (g - c[1]) * mix;
              a[i + 2] = c[2] + (b - c[2]) * mix;
            }
          }
          sctx.putImageData(data, 0, 0);
        } catch (err) {
          canRead = false; // файл открыт с диска — браузер не даёт читать пиксели, оставляем просто пикселизацию
        }
      }

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(small, 0, 0, cols, rows, 0, 0, cols * cell * dpr, rows * cell * dpr);

      if (glyphs.length) {
        ctx.fillStyle = 'rgba(10,11,14,.75)';
        ctx.font = `${Math.round(cell * .62 * dpr)}px "Martian Mono", monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let i = 0; i < glyphs.length; i += 2) {
          ctx.fillText('z', (glyphs[i] + .5) * cell * dpr, (glyphs[i + 1] + .5) * cell * dpr);
        }
      }
    }

    window.portraitFX = {
      set(p) { progress = Math.min(1, Math.max(0, p)); render(); },
    };
    if (img.complete) resize(); else img.addEventListener('load', resize, { once: true });
    new ResizeObserver(resize).observe(fig);
    if (reduce) window.portraitFX.set(1);
  }

  /* ---------- 2. Постер RS 7 ABT ---------- */
  const poster = document.querySelector('[data-poster]');
  if (!poster) return;
  const pctx = poster.getContext('2d');
  const car = new Image();
  car.src = 'img/work/rs7-cut.png';
  const mask = new Image();
  // маска машины 160×75 внутри кода — чтобы читать её даже при открытии файла с диска
  mask.src = 'data:image/png;base64,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';

  let PW = 0, PH = 0, pdpr = 1, cell = 8, cols = 0, rows = 0, cov = null, cov2 = null;
  let carBox = { x: 0, y: 0, w: 0, h: 0 };
  let praf = 0, pvisible = false, last = 0, glitchAt = 0, glitchBand = null;
  const pm = { x: -99, y: -99, on: 0, ton: 0 };
  const t0 = performance.now();

  function layout() {
    const r = poster.getBoundingClientRect();
    if (!r.width) return;
    pdpr = Math.min(window.devicePixelRatio || 1, 2);
    PW = r.width; PH = r.height;
    poster.width = Math.round(PW * pdpr); poster.height = Math.round(PH * pdpr);
    cell = PW / 62;
    cols = Math.ceil(PW / cell); rows = Math.ceil(PH / cell);
    const w = PW * 1.1, h = w * (500 / 1070);
    carBox = { x: -PW * .05, y: PH * .53 - h / 2, w, h };

    // покрытие клеток машиной (0..1) + размытая версия для «осыпи» вокруг
    cov = new Float32Array(cols * rows);
    if (mask.complete && mask.naturalWidth) {
      const c = document.createElement('canvas');
      c.width = cols; c.height = rows;
      const g = c.getContext('2d');
      g.drawImage(mask, carBox.x / cell, carBox.y / cell, carBox.w / cell, carBox.h / cell);
      const d = g.getImageData(0, 0, cols, rows).data;
      for (let i = 0; i < cols * rows; i++) cov[i] = d[i * 4 + 3] ? d[i * 4] / 255 : 0;
    }
    cov2 = blur(blur(cov, 2), 2);
    frame(performance.now(), true);
  }

  function blur(src, r) {
    const out = new Float32Array(src.length);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let s = 0, n = 0;
        for (let dy = -r; dy <= r; dy++) {
          const yy = y + dy; if (yy < 0 || yy >= rows) continue;
          for (let dx = -r; dx <= r; dx++) {
            const xx = x + dx; if (xx < 0 || xx >= cols) continue;
            s += src[yy * cols + xx]; n++;
          }
        }
        out[y * cols + x] = s / n;
      }
    }
    return out;
  }

  function cross(x, y, s) {
    pctx.fillRect(x - s, y - .5, s * 2, 1);
    pctx.fillRect(x - .5, y - s, 1, s * 2);
  }

  function frame(now, force) {
    if (!PW || !cov) return;
    if (!force && now - last < 33) return; // ~30 кадров в секунду достаточно
    last = now;
    const t = reduce ? 3 : (now - t0) / 1000;
    pm.on += (pm.ton - pm.on) * .12;

    const c = pctx;
    c.setTransform(pdpr, 0, 0, pdpr, 0, 0);
    c.fillStyle = 'rgb(231,234,239)';
    c.fillRect(0, 0, PW, PH);

    // крупная типографика за машиной
    c.fillStyle = '#d2d7df';
    c.font = `800 ${PW * .4}px Tektur, sans-serif`;
    c.textBaseline = 'top'; c.textAlign = 'left';
    c.fillText('RS7', PW * .045, PH * .07);
    c.font = `800 ${PW * .2}px Tektur, sans-serif`;
    c.textAlign = 'right'; c.textBaseline = 'alphabetic';
    c.fillText('ABT', PW * .955, PH * .885);

    if (car.complete && car.naturalWidth) c.drawImage(car, carBox.x, carBox.y, carBox.w, carBox.h);

    // «битые» пиксели
    const mcx = pm.x / cell, mcy = pm.y / cell, sig2 = 2 * 7 * 7;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const cv = cov[i], cb = cov2[i];
        if (cb < .015) continue;
        const dx = x - mcx, dy = y - mcy;
        const m = pm.on * Math.exp(-(dx * dx + dy * dy) / sig2);
        const n = noise(x * .15 + t * .32, y * .15 - t * .1) * .72 + noise(x * .55 - t * 1.1, y * .55) * .28;
        const edge = cb > .04 && cb < .96 ? 1 - Math.abs(cb - .5) * 2 : 0;
        const f = n + m * .6 + edge * .3 + (x / cols) * .08;
        const px = x * cell, py = y * cell;
        if (cv > .5) {
          if (f > .8) { c.fillStyle = 'rgb(231,234,239)'; c.fillRect(px, py, cell + .5, cell + .5); }
          else if (f > .66) { c.fillStyle = hash(x, y + Math.floor(t * 3)) > .25 ? '#1a3270' : '#3a5fc4'; c.fillRect(px, py, cell + .5, cell + .5); }
        } else if (f > .7) {
          c.fillStyle = hash(x * 3, y) > .45 ? '#0a0b0e' : '#1a3270';
          c.fillRect(px, py, cell + .5, cell + .5);
        }
      }
    }

    // зона из символов «z», как в референсе
    c.fillStyle = '#0a0b0e';
    c.font = `${cell * 1.05}px "Martian Mono", monospace`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const zx0 = Math.floor(cols * .6), zx1 = Math.floor(cols * .9);
    const zy0 = Math.floor(rows * .13), zy1 = Math.floor(rows * .43);
    for (let y = zy0; y < zy1; y++) {
      const jag = Math.floor(noise(y * .35, t * .6) * 6);
      for (let x = zx0 + jag; x < zx1; x++) {
        if (hash(x, y) < .3) continue;
        if (noise(x * .4, y * .4 + t * .5) < .38) continue;
        c.fillText('z', (x + .5) * cell, (y + .5) * cell);
      }
    }

    // перекрестья и подписи
    c.fillStyle = '#0a0b0e';
    const ins = PW * .1;
    [[ins, ins], [PW - ins, ins], [ins, PH - ins], [PW - ins, PH - ins], [ins, PH / 2], [PW - ins, PH / 2]]
      .forEach(([x, y]) => cross(x, y, 6));

    c.fillRect(PW * .04, PH * .03, PW * .085, PW * .034);
    c.fillStyle = '#e7eaef';
    c.font = `500 ${PW * .022}px "Martian Mono", monospace`;
    c.textAlign = 'center';
    c.fillText('on', PW * .0825, PH * .03 + PW * .017);
    for (let k = 0; k < 10; k++) {
      c.fillStyle = hash(k, Math.floor(t * 4)) > .5 ? '#0a0b0e' : '#9aa3b0';
      c.fillRect(PW * .13 + (k % 5) * PW * .007, PH * .03 + Math.floor(k / 5) * PW * .007, PW * .007, PW * .007);
    }

    c.fillStyle = '#0a0b0e';
    c.font = `400 ${Math.max(9, PW * .018)}px "Martian Mono", monospace`;
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    c.fillText('AUDI RS 7 ABT — 2023', PW * .045, PH * .955);
    c.textAlign = 'right';
    c.fillText('LOST DATA / 760 Л.С.', PW * .955, PH * .955);
    c.textAlign = 'left';
    c.fillText('[ дизайн: широков и. ]', PW * .045, PH * .918);

    // иногда полоса «съезжает» — глитч
    if (!reduce && now > glitchAt) {
      glitchBand = { y: Math.random() * PH * .8, h: 6 + Math.random() * 40, dx: (Math.random() - .5) * 40, until: now + 110 };
      glitchAt = now + 1600 + Math.random() * 2400;
    }
    if (glitchBand && now < glitchBand.until) {
      const b = glitchBand;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(poster, 0, b.y * pdpr, poster.width, b.h * pdpr, b.dx * pdpr, b.y * pdpr, poster.width, b.h * pdpr);
    }
  }

  function ploop(now) {
    frame(now);
    praf = pvisible ? requestAnimationFrame(ploop) : 0;
  }

  const ready = () => { layout(); };
  Promise.all([
    new Promise(r => (car.complete ? r() : car.addEventListener('load', r, { once: true }))),
    new Promise(r => (mask.complete ? r() : mask.addEventListener('load', r, { once: true }))),
    document.fonts ? document.fonts.ready : Promise.resolve(),
  ]).then(ready);

  new ResizeObserver(() => layout()).observe(poster);
  new IntersectionObserver(([e]) => {
    pvisible = e.isIntersecting && !reduce;
    if (pvisible && !praf) praf = requestAnimationFrame(ploop);
  }, { rootMargin: '100px' }).observe(poster);

  poster.addEventListener('pointermove', (e) => {
    const r = poster.getBoundingClientRect();
    pm.x = e.clientX - r.left; pm.y = e.clientY - r.top; pm.ton = 1;
  }, { passive: true });
  poster.addEventListener('pointerleave', () => { pm.ton = 0; });
})();
