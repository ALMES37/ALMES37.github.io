'use strict';

/* ================= Город: одна настройка =================
   Поменять город для всего сайта: CITY ниже.
   Или ссылкой: ?city=stavropol, ?city=tula и т. д. (список CITIES),
   любой другой: ?city=Сочи&in=в Сочи                                  */
const CITY = { name: 'Екатеринбург', in: 'в Екатеринбурге' };
const CITIES = {
  ekb: ['Екатеринбург', 'в Екатеринбурге'], stavropol: ['Ставрополь', 'в Ставрополе'],
  tula: ['Тула', 'в Туле'], kazan: ['Казань', 'в Казани'], ufa: ['Уфа', 'в Уфе'],
  perm: ['Пермь', 'в Перми'], chelyabinsk: ['Челябинск', 'в Челябинске'], tyumen: ['Тюмень', 'в Тюмени'],
  izhevsk: ['Ижевск', 'в Ижевске'], krasnodar: ['Краснодар', 'в Краснодаре'], samara: ['Самара', 'в Самаре'],
  moscow: ['Москва', 'в Москве'], spb: ['Санкт-Петербург', 'в Санкт-Петербурге'],
  novosibirsk: ['Новосибирск', 'в Новосибирске'], nn: ['Нижний Новгород', 'в Нижнем Новгороде'],
  voronezh: ['Воронеж', 'в Воронеже'], rostov: ['Ростов-на-Дону', 'в Ростове-на-Дону'],
  volgograd: ['Волгоград', 'в Волгограде'], sochi: ['Сочи', 'в Сочи'], omsk: ['Омск', 'в Омске'],
};
(() => {
  const q = new URLSearchParams(location.search);
  const raw = (q.get('city') || '').trim().slice(0, 40);
  const ok = s => /^[А-Яа-яЁё\- ]{2,50}$/.test(s);
  if (raw) {
    const hit = CITIES[raw.toLowerCase()];
    if (hit) { CITY.name = hit[0]; CITY.in = hit[1]; }
    else if (ok(raw)) {
      const inn = (q.get('in') || '').trim().slice(0, 50);
      CITY.name = raw; CITY.in = ok(inn) ? inn : 'в городе ' + raw;
    }
  }
  document.querySelectorAll('[data-city]').forEach(n => { n.textContent = CITY.name; });
  document.querySelectorAll('[data-city-in]').forEach(n => { n.textContent = CITY.in.replace(/^(в|во) /, '$1 '); });
  if (q.has('shot')) document.documentElement.classList.add('shot');
  document.title = 'Ремонт квартир под ключ ' + CITY.in;
})();

/* ================= Общие помощники ================= */
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => RM.matches;
const hasG = typeof window.gsap !== 'undefined';
if (hasG && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs, parent) => {
  const e = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};
const C30 = Math.cos(Math.PI / 6);
const iso = (x, y, z = 0) => [(x - y) * C30, (x + y) * 0.5 - z];
const pts = arr => arr.map(p => { const q = iso(p[0], p[1], p[2] || 0); return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ');
const flat = arr => arr.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const eOut = t => 1 - Math.pow(1 - t, 3);
const eIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// k-й элемент из n появляется внутри окна [a, b], каждому достаётся доля w окна
const stg = (p, a, b, k, n, w = 0.3) => {
  const span = b - a, d = span * w, s = a + (span - d) * (n > 1 ? k / (n - 1) : 0);
  return clamp((p - s) / d, 0, 1);
};
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// отсечение многоугольника прямоугольником (Сазерленд — Ходжман)
function clipRect(poly, x0, y0, x1, y1) {
  const E = [
    [p => p[0] >= x0, (a, b) => [x0, a[1] + (x0 - a[0]) / (b[0] - a[0]) * (b[1] - a[1])]],
    [p => p[0] <= x1, (a, b) => [x1, a[1] + (x1 - a[0]) / (b[0] - a[0]) * (b[1] - a[1])]],
    [p => p[1] >= y0, (a, b) => [a[0] + (y0 - a[1]) / (b[1] - a[1]) * (b[0] - a[0]), y0]],
    [p => p[1] <= y1, (a, b) => [a[0] + (y1 - a[1]) / (b[1] - a[1]) * (b[0] - a[0]), y1]],
  ];
  let out = poly;
  for (const [inside, cut] of E) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const cur = inp[i], prev = inp[(i + inp.length - 1) % inp.length];
      if (inside(cur)) { if (!inside(prev)) out.push(cut(prev, cur)); out.push(cur); }
      else if (inside(prev)) out.push(cut(prev, cur));
    }
    if (!out.length) break;
  }
  return out;
}
const area = p => Math.abs(p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0) / 2);
const rot = (p, cx, cy, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return [cx + (p[0] - cx) * c - (p[1] - cy) * s, cy + (p[0] - cx) * s + (p[1] - cy) * c]; };
const shade = (hex, d) => { const n = parseInt(hex.slice(1), 16); const f = v => clamp(Math.round(v + d), 0, 255); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };

/* ================= Первый экран: ванная собирается по этапам ================= */
const Room = (() => {
  const svg = document.getElementById('room');
  if (!svg) return null;
  const W = 260, D = 200, H = 150, T = 14, SL = 14;
  const BX = 172, BY = 74, BH = 56;               // ванна у правой стены
  const NX0 = 124, NX1 = 196, NZ0 = 84, NZ1 = 116, ND = 9; // ниша
  const C = {
    cut: '#2A2E31', cut2: '#33383B',
    concR: '#C9CBC6', concL: '#B6B9B4', concF: '#BDC0BB',
    level: '#D3D5D0', beacon: '#8F979C',
    tileR: '#F3F3F0', tileL: '#E3E4E0', tileF: '#6E7479',
    gkl: '#B2C6AF', gkl2: '#9FB39C', laser: '#18A07F', ink: '#1C1F22', accent: '#0E6A54',
  };
  seed = 11;
  const defs = el('defs', null, svg);
  // крапинки бетона
  const sp = el('pattern', { id: 'speck', width: 40, height: 40, patternUnits: 'userSpaceOnUse' }, defs);
  for (let i = 0; i < 34; i++) el('circle', { cx: (rnd() * 40).toFixed(1), cy: (rnd() * 40).toFixed(1), r: (0.4 + rnd() * 1.1).toFixed(2), fill: rnd() > 0.5 ? '#7E837E' : '#E6E7E3', opacity: (0.25 + rnd() * 0.4).toFixed(2) }, sp);
  const lg = (id, x1, y1, x2, y2, stops) => { const g = el('linearGradient', { id, x1, y1, x2, y2, gradientUnits: 'userSpaceOnUse' }, defs); stops.forEach(([o, c, a]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a ?? 1 }, g)); return g; };
  lg('plR', 0, -150, 0, 130, [[0, '#E9EAE6'], [1, '#DADBD6']]);
  lg('plL', 0, -150, 0, 100, [[0, '#DCDDD8'], [1, '#CDCFCA']]);
  lg('aoR', 0, 0, 70, 0, [[0, '#1C1F22', 0.16], [1, '#1C1F22', 0]]);
  lg('aoL', 0, 0, -70, 0, [[0, '#1C1F22', 0.16], [1, '#1C1F22', 0]]);
  lg('nicheLight', 0, -64, 0, -20, [[0, '#FFE7B0', 0.95], [1, '#FFE7B0', 0]]);
  lg('basin', 0, 10, 0, 60, [[0, '#DCE3E4'], [1, '#F7F9F9']]);
  const rg = el('radialGradient', { id: 'floorShadow' }, defs);
  el('stop', { offset: 0, 'stop-color': '#1C1F22', 'stop-opacity': 0.26 }, rg);
  el('stop', { offset: 1, 'stop-color': '#1C1F22', 'stop-opacity': 0 }, rg);
  const cpN = el('clipPath', { id: 'cpNiche' }, defs);
  el('polygon', { points: pts([[NX0, 0, NZ0], [NX1, 0, NZ0], [NX1, 0, NZ1], [NX0, 0, NZ1]]) }, cpN);
  const cpM = el('clipPath', { id: 'cpMag' }, defs);
  const MAG = { x: -128, y: 196, r: 47 };
  el('circle', { cx: MAG.x, cy: MAG.y, r: MAG.r }, cpM);

  const G = name => el('g', { class: name }, svg);
  const poly = (g, p, fill, extra) => el('polygon', Object.assign({ points: pts(p), fill }, extra || {}), g);

  // тень, плита перекрытия и срезы стен
  const gBase = G('base');
  const sc = iso(W / 2, D / 2, -SL);
  el('ellipse', { cx: sc[0] + 4, cy: sc[1] + 22, rx: 250, ry: 74, fill: 'url(#floorShadow)' }, gBase);
  poly(gBase, [[-T, D, 0], [W, D, 0], [W, D, -SL], [-T, D, -SL]], C.cut2);
  poly(gBase, [[W, -T, 0], [W, D, 0], [W, D, -SL], [W, -T, -SL]], C.cut);
  poly(gBase, [[-T, D, 0], [0, D, 0], [0, D, H], [-T, D, H]], C.cut2);
  poly(gBase, [[W, -T, 0], [W, 0, 0], [W, 0, H], [W, -T, H]], C.cut);
  el('polygon', { points: pts([[-T, -T, H], [W, -T, H], [W, 0, H], [0, 0, H], [0, D, H], [-T, D, H]]), fill: '#1C1F22' }, gBase);

  // пол: бетон
  const floorP = [[0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0]];
  poly(gBase, floorP, C.concF); poly(gBase, floorP, 'url(#speck)');
  // стены: бетон
  const wallR = [[0, 0, 0], [W, 0, 0], [W, 0, H], [0, 0, H]];
  const wallL = [[0, 0, 0], [0, D, 0], [0, D, H], [0, 0, H]];
  poly(gBase, wallR, C.concR); poly(gBase, wallR, 'url(#speck)');
  poly(gBase, wallL, C.concL); poly(gBase, wallL, 'url(#speck)');
  // трещина и заплатка на бетоне
  el('polyline', { points: pts([[214, 0, 146], [219, 0, 128], [215, 0, 117], [223, 0, 101], [220, 0, 92]]), fill: 'none', stroke: '#8E938E', 'stroke-width': 1 }, gBase);
  poly(gBase, [[0, 150, 30], [0, 182, 34], [0, 178, 58], [0, 146, 52]], '#AEB1AC');
  // трубы из стены и канализация из пола
  const gPipes = G('pipes');
  [[40, '#F2F2EF'], [56, '#F2F2EF']].forEach(([x, c]) => {
    const a = iso(x, 0, 26), b = iso(x, 9, 26);
    el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#7D837F', 'stroke-width': 6, 'stroke-linecap': 'round' }, gPipes);
    el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: c, 'stroke-width': 4, 'stroke-linecap': 'round' }, gPipes);
  });
  { const a = iso(118, 26, 0), b = iso(118, 26, 9); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#8A9095', 'stroke-width': 11 }, gPipes); el('ellipse', { cx: b[0], cy: b[1], rx: 5.5, ry: 3.2, fill: '#3B4043' }, gPipes); }

  // лазерный уровень
  const gLaser = G('laser');
  const lp = pts([[0, D, 96], [0, 0, 96], [W, 0, 96]]);
  el('polyline', { points: lp, fill: 'none', stroke: C.laser, 'stroke-width': 5, opacity: 0.22, 'stroke-linejoin': 'round' }, gLaser);
  const laserLine = el('polyline', { points: lp, fill: 'none', stroke: C.laser, 'stroke-width': 1.3, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, gLaser);

  // маяки
  const gBeac = G('beacons');
  const bR = [18, 74, 130, 186, 242], bL = [22, 78, 134, 190];
  const beacons = [];
  bR.forEach(b => beacons.push(poly(gBeac, [[b - 1.6, 0.6, 3], [b + 1.6, 0.6, 3], [b + 1.6, 0.6, H - 4], [b - 1.6, 0.6, H - 4]], C.beacon)));
  bL.forEach(b => beacons.push(poly(gBeac, [[0.6, b - 1.6, 3], [0.6, b + 1.6, 3], [0.6, b + 1.6, H - 4], [0.6, b - 1.6, H - 4]], '#7F878C')));

  // штукатурка полосами между маяками
  const gPlas = G('plaster');
  const strips = [];
  const edgesR = [0, ...bR, W], edgesL = [0, ...bL, D];
  for (let i = 0; i < edgesR.length - 1; i++) strips.push({ wall: 'R', a: Math.max(0, edgesR[i] - 2), b: Math.min(W, edgesR[i + 1] + 2), e: el('polygon', { fill: 'url(#plR)' }, gPlas) });
  for (let i = 0; i < edgesL.length - 1; i++) strips.push({ wall: 'L', a: Math.max(0, edgesL[i] - 2), b: Math.min(D, edgesL[i + 1] + 2), e: el('polygon', { fill: 'url(#plL)' }, gPlas) });
  strips.sort((s1, s2) => s1.a - s2.a);

  // наливной пол
  const gLevel = G('level');
  const levelP = poly(gLevel, floorP, C.level);
  const mark = el('g', { opacity: 0 }, gLevel);
  const arc = []; for (let a = 0; a <= 90; a += 6) arc.push([34 * Math.cos(a * Math.PI / 180), 34 * Math.sin(a * Math.PI / 180), 0]);
  el('polyline', { points: pts(arc), fill: 'none', stroke: C.accent, 'stroke-width': 1.6 }, mark);
  const m9 = iso(30, 30, 0);
  el('text', { x: m9[0], y: m9[1] + 4, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: C.accent }, mark).textContent = '90°';

  // плитка на полу по диагонали
  const gFloorT = G('floorTiles');
  const floorTiles = [];
  { const a = 36, hd = a * Math.SQRT2 / 2, g = 1.5, s = 2 * hd;
    const cands = [];
    for (let i = -1; i <= Math.ceil(W / s) + 1; i++) for (let j = -1; j <= Math.ceil(D / s) + 1; j++) {
      cands.push([i * s, j * s]); cands.push([i * s + hd, j * s + hd]);
    }
    cands.forEach(([cx, cy]) => {
      const r = hd - g;
      const pl = clipRect([[cx - r, cy], [cx, cy - r], [cx + r, cy], [cx, cy + r]], 0, 0, W, D);
      if (pl.length < 3 || area(pl) < 6) return;
      floorTiles.push({ key: cx + cy, e: el('polygon', { points: pts(pl.map(p => [p[0], p[1], 0])), fill: shade(C.tileF, (rnd() - 0.5) * 10) }, gFloorT) });
    });
    floorTiles.sort((t1, t2) => t1.key - t2.key);
  }

  // плитка на стенах 40×20, ряд за рядом снизу
  const gWallT = G('wallTiles');
  const wallTiles = [];
  { const tw = 40, th = 20, g = 1.2;
    const lay = (len, wall) => {
      for (let z = 0; z < H; z += th) for (let u = 0; u < len; u += tw) {
        const r = clipRect([[u + g / 2, z + g / 2], [u + tw - g / 2, z + g / 2], [u + tw - g / 2, z + th - g / 2], [u + g / 2, z + th - g / 2]], 0, 0, len, H);
        if (r.length < 3 || area(r) < 4) continue;
        const p3 = r.map(p => wall === 'R' ? [p[0], 0.9, p[1]] : [0.9, p[0], p[1]]);
        wallTiles.push({ key: z * 1000 + u, wall, e: el('polygon', { points: pts(p3), fill: shade(wall === 'R' ? C.tileR : C.tileL, (rnd() - 0.5) * 5) }, gWallT) });
      }
    };
    lay(W, 'R'); lay(D, 'L');
    wallTiles.sort((t1, t2) => t1.key - t2.key);
  }
  // мягкая тень в углу
  const gAO = G('ao');
  poly(gAO, wallR, 'url(#aoR)'); poly(gAO, wallL, 'url(#aoL)');

  // ниша с подсветкой
  const gNiche = G('niche');
  poly(gNiche, [[NX0, 0, NZ0], [NX1, 0, NZ0], [NX1, 0, NZ1], [NX0, 0, NZ1]], '#2E3336');
  const gN2 = el('g', { 'clip-path': 'url(#cpNiche)' }, gNiche);
  poly(gN2, [[NX0, -ND, NZ0], [NX1, -ND, NZ0], [NX1, -ND, NZ1], [NX0, -ND, NZ1]], '#D9DAD6');
  poly(gN2, [[NX0, -ND, NZ0], [NX0, 0, NZ0], [NX0, 0, NZ1], [NX0, -ND, NZ1]], '#C4C6C1');
  poly(gN2, [[NX0, -ND, NZ0], [NX1, -ND, NZ0], [NX1, 0, NZ0], [NX0, 0, NZ0]], '#ECEDE9');
  const nLight = el('g', { opacity: 0 }, gN2);
  poly(nLight, [[NX0, -ND, NZ0], [NX1, -ND, NZ0], [NX1, -ND, NZ1], [NX0, -ND, NZ1]], 'url(#nicheLight)');
  poly(nLight, [[NX0, -ND, NZ0], [NX1, -ND, NZ0], [NX1, 0, NZ0], [NX0, 0, NZ0]], '#FFF1CC', { opacity: 0.75 });
  { const a = iso(NX0, -ND + 1, NZ1 - 1), b = iso(NX1, -ND + 1, NZ1 - 1); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#FFF6DC', 'stroke-width': 2 }, nLight); }

  // экран ванной: короб растёт из пола
  const gBox = G('box');
  const boxFront = el('polygon', { fill: C.gkl }, gBox);
  const boxSide = el('polygon', { fill: C.gkl2 }, gBox);
  const boxTop = el('polygon', { fill: '#C9D6C6' }, gBox);
  const gBoxT = G('boxTiles');
  const boxTiles = [];
  { const tw = 40, th = 20, g = 1.2;
    for (let z = 0; z < BH; z += th) {
      for (let k = 0; BX - tw * k > 0; k++) {
        const r = clipRect([[BX - tw * (k + 1) + g / 2, z + g / 2], [BX - tw * k - (k ? g / 2 : 0), z + g / 2], [BX - tw * k - (k ? g / 2 : 0), Math.min(z + th, BH) - g / 2], [BX - tw * (k + 1) + g / 2, Math.min(z + th, BH) - g / 2]], 0, 0, BX, BH);
        if (r.length >= 3) boxTiles.push({ key: z * 10 + k, f: 'F', e: el('polygon', { points: pts(r.map(p => [p[0], BY, p[1]])), fill: shade(C.tileR, (rnd() - 0.5) * 5) }, gBoxT) });
      }
      for (let k = 0; BY - tw * k > 0; k++) {
        const r = clipRect([[BY - tw * (k + 1) + g / 2, z + g / 2], [BY - tw * k - (k ? g / 2 : 0), z + g / 2], [BY - tw * k - (k ? g / 2 : 0), Math.min(z + th, BH) - g / 2], [BY - tw * (k + 1) + g / 2, Math.min(z + th, BH) - g / 2]], 0, 0, BY, BH);
        if (r.length >= 3) boxTiles.push({ key: z * 10 + k, f: 'S', e: el('polygon', { points: pts(r.map(p => [BX, p[0], p[1]])), fill: shade(C.tileL, (rnd() - 0.5) * 5) }, gBoxT) });
      }
    }
    boxTiles.sort((a, b) => a.key - b.key);
  }
  const gBoxD = el('g', { opacity: 0 }, gBoxT);
  poly(gBoxD, [[22, BY, 0], [150, BY, 0], [150, BY, 9], [22, BY, 9]], '#24292C', { opacity: 0.78 });
  const hatch = poly(gBoxD, [[BX, 16, 12], [BX, 56, 12], [BX, 56, 44], [BX, 16, 44]], 'none', { stroke: '#8A908C', 'stroke-width': 1 });
  const miter = (() => { const a = iso(BX, BY, 0), b = iso(BX, BY, BH); return el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: C.accent, 'stroke-width': 2.4, opacity: 0, 'stroke-linecap': 'square' }, gBoxT); })();

  // ванна сверху
  const gBath = G('bath');
  el('polygon', { points: pts([[0, 0, BH], [BX, 0, BH], [BX, BY, BH], [0, BY, BH]]), fill: '#FBFBFA' }, gBath);
  { const cx = BX / 2 + 2, cy = BY / 2, rx = BX / 2 - 11, ry = BY / 2 - 9, n = 4.5, ring = [];
    for (let i = 0; i < 48; i++) { const t = i / 48 * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); ring.push([cx + rx * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), cy + ry * Math.sign(s) * Math.pow(Math.abs(s), 2 / n), BH]); }
    el('polygon', { points: pts(ring), fill: 'url(#basin)', stroke: '#C9D0D2', 'stroke-width': 1 }, gBath);
  }
  { const a = iso(BX, BY, BH), b = iso(BX, 0, BH), c = iso(0, BY, BH); el('polyline', { points: `${c[0]},${c[1]} ${a[0]},${a[1]} ${b[0]},${b[1]}`, fill: 'none', stroke: '#D5D9D8', 'stroke-width': 1 }, gBath); }

  // смеситель и полотенцесушитель
  const gFix = G('fix');
  { const b0 = iso(60, 0, 76), b1 = iso(60, 7, 76), s1 = iso(60, 22, 76), s2 = iso(60, 22, 71);
    el('line', { x1: b0[0], y1: b0[1], x2: b1[0], y2: b1[1], stroke: C.ink, 'stroke-width': 7, 'stroke-linecap': 'round' }, gFix);
    el('polyline', { points: `${b1[0]},${b1[1]} ${s1[0]},${s1[1]} ${s2[0]},${s2[1]}`, fill: 'none', stroke: C.ink, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, gFix);
    const h1 = iso(60, 4, 80), h2 = iso(60, 4, 88); el('line', { x1: h1[0], y1: h1[1], x2: h2[0], y2: h2[1], stroke: C.ink, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, gFix);
  }
  { const X = 3.5, y0 = 120, y1 = 160, z0 = 30, z1 = 122, L = (p, q, w) => { const a = iso(...p), b = iso(...q); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: C.ink, 'stroke-width': w, 'stroke-linecap': 'round' }, gFix); };
    L([X, y0, z0], [X, y0, z1], 3); L([X, y1, z0], [X, y1, z1], 3);
    for (let z = z0 + 10; z < z1; z += 13) L([X, y0, z], [X, y1, z], 2);
    L([0, y0, z0 + 4], [X, y0, z0 + 4], 2); L([0, y1, z1 - 4], [X, y1, z1 - 4], 2);
  }

  // лупа: срез угла сверху
  const gMag = G('mag');
  { const a = iso(BX, BY, BH * 0.62), dx = a[0] - MAG.x, dy = a[1] - MAG.y, dl = Math.hypot(dx, dy);
    el('line', { x1: MAG.x + dx / dl * MAG.r, y1: MAG.y + dy / dl * MAG.r, x2: a[0], y2: a[1], stroke: C.ink, 'stroke-width': 1 }, gMag);
    el('circle', { cx: a[0], cy: a[1], r: 2.6, fill: C.ink }, gMag);
    el('circle', { cx: MAG.x, cy: MAG.y, r: MAG.r + 3, fill: C.ink }, gMag);
    el('circle', { cx: MAG.x, cy: MAG.y, r: MAG.r, fill: '#F5F5F2' }, gMag);
    const gi = el('g', { 'clip-path': 'url(#cpMag)' }, gMag);
    const s = 2.3, ox = MAG.x + 14, oy = MAG.y - 8;   // угол облицовки
    const P2 = arr => arr.map(([u, v]) => [ox + u * s, oy + v * s]);
    el('polygon', { points: flat(P2([[-60, -60], [-11, -60], [-11, -11], [-60, -11]])), fill: '#B2C6AF' }, gi);   // ГКЛ
    el('polygon', { points: flat(P2([[-11, -60], [-8, -60], [-8, -8], [-60, -8], [-60, -11], [-11, -11]])), fill: '#9EA39F' }, gi); // клей
    el('polygon', { points: flat(P2([[-8, -60], [0, -60], [0, 0], [-8, -8]])), fill: '#F3F3F0', stroke: '#1C1F22', 'stroke-width': 0.8 }, gi);
    el('polygon', { points: flat(P2([[-60, -8], [-8, -8], [0, 0], [-60, 0]])), fill: '#E3E4E0', stroke: '#1C1F22', 'stroke-width': 0.8 }, gi);
    const q0 = P2([[0, 0]])[0], q1 = P2([[-8, -8]])[0];
    el('line', { x1: q0[0], y1: q0[1], x2: q1[0], y2: q1[1], stroke: C.accent, 'stroke-width': 1.6 }, gi);
    const t = el('text', { x: MAG.x - 6, y: MAG.y + 30, 'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 600, fill: C.accent }, gMag); t.textContent = 'запил 45°';
  }

  // подписи
  const gLab = G('labels');
  const labels = [];
  const label = (pt, at, text) => {
    const g = el('g', { opacity: 0 }, gLab);
    const a = iso(...pt);
    el('line', { x1: a[0], y1: a[1], x2: at[0], y2: at[1], stroke: C.ink, 'stroke-width': 1 }, g);
    el('circle', { cx: a[0], cy: a[1], r: 2.4, fill: C.ink }, g);
    const w = text.length * 6.4 + 16;
    el('rect', { x: at[0] - w / 2, y: at[1] - 11, width: w, height: 22, fill: '#F5F5F2', stroke: C.ink, 'stroke-width': 1 }, g);
    el('text', { x: at[0], y: at[1] + 4.2, 'text-anchor': 'middle', 'font-size': 12, fill: C.ink }, g).textContent = text;
    labels.push(g);
  };
  label([86, BY, 5], [44, 172], 'ниша для ног');
  label([BX, 36, 28], [168, 128], 'люк на магнитах');
  label([160, -4, 104], [176, -72], 'подсветка ниши');

  const T0 = { R: [-8.7, 5], L: [8.7, 5] };
  function draw(p) {
    // лазер и маяки
    const lz = seg(p, 0.01, 0.08) * (1 - seg(p, 0.30, 0.35));
    laserLine.setAttribute('stroke-dashoffset', (1 - seg(p, 0.01, 0.1)).toFixed(3));
    gLaser.style.opacity = lz.toFixed(3);
    beacons.forEach((b, k) => { const t = eOut(stg(p, 0.05, 0.17, k, beacons.length, 0.35)); b.style.opacity = t; b.setAttribute('transform', `translate(0 ${(-26 * (1 - t)).toFixed(1)})`); });
    // штукатурка
    strips.forEach((s, k) => {
      const h = H * eOut(stg(p, 0.14, 0.31, k, strips.length, 0.4));
      if (h <= 0.01) { s.e.setAttribute('points', ''); return; }
      s.e.setAttribute('points', pts(s.wall === 'R' ? [[s.a, 0.4, 0], [s.b, 0.4, 0], [s.b, 0.4, h], [s.a, 0.4, h]] : [[0.4, s.a, 0], [0.4, s.b, 0], [0.4, s.b, h], [0.4, s.a, h]]));
    });
    const lv = eOut(seg(p, 0.18, 0.32));
    levelP.style.opacity = lv > 0 ? 1 : 0;
    levelP.setAttribute('transform', `scale(${Math.max(lv, 0.001).toFixed(4)})`);
    mark.style.opacity = (seg(p, 0.28, 0.32) * (1 - seg(p, 0.40, 0.45))).toFixed(3);
    // короб экрана
    const bh = BH * eOut(seg(p, 0.35, 0.44));
    if (bh < 0.2) { boxFront.setAttribute('points', ''); boxSide.setAttribute('points', ''); boxTop.setAttribute('points', ''); }
    else {
      boxFront.setAttribute('points', pts([[0, BY, 0], [BX, BY, 0], [BX, BY, bh], [0, BY, bh]]));
      boxSide.setAttribute('points', pts([[BX, 0, 0], [BX, BY, 0], [BX, BY, bh], [BX, 0, bh]]));
      boxTop.setAttribute('points', pts([[0, 0, bh], [BX, 0, bh], [BX, BY, bh], [0, BY, bh]]));
    }
    gPipes.style.opacity = 1 - seg(p, 0.42, 0.45);
    // плитка
    floorTiles.forEach((t, k) => { const v = eOut(stg(p, 0.38, 0.62, k, floorTiles.length, 0.18)); t.e.style.opacity = v; t.e.setAttribute('transform', `translate(0 ${(-14 * (1 - v)).toFixed(1)})`); });
    wallTiles.forEach((t, k) => { const v = eOut(stg(p, 0.42, 0.65, k, wallTiles.length, 0.16)); const o = T0[t.wall]; t.e.style.opacity = v; t.e.setAttribute('transform', `translate(${(o[0] * (1 - v)).toFixed(1)} ${(o[1] * (1 - v)).toFixed(1)})`); });
    gNiche.style.opacity = seg(p, 0.5, 0.56);
    boxTiles.forEach((t, k) => { const v = eOut(stg(p, 0.55, 0.66, k, boxTiles.length, 0.3)); const o = t.f === 'F' ? T0.R : T0.L; t.e.style.opacity = v; t.e.setAttribute('transform', `translate(${(o[0] * (1 - v)).toFixed(1)} ${(o[1] * (1 - v)).toFixed(1)})`); });
    gBoxD.style.opacity = seg(p, 0.62, 0.67);
    hatch.style.opacity = seg(p, 0.86, 0.94);
    miter.style.opacity = seg(p, 0.6, 0.66);
    miter.setAttribute('stroke-width', (2.4 - 1.2 * seg(p, 0.8, 0.9)).toFixed(2));
    gMag.style.opacity = eOut(seg(p, 0.6, 0.67));
    gMag.setAttribute('transform', `translate(0 ${(8 * (1 - eOut(seg(p, 0.6, 0.67)))).toFixed(1)})`);
    // финиш
    const bt = eOut(seg(p, 0.68, 0.77));
    gBath.style.opacity = bt; gBath.setAttribute('transform', `translate(0 ${(-30 * (1 - bt)).toFixed(1)})`);
    const fx = eOut(seg(p, 0.75, 0.86));
    gFix.style.opacity = fx; gFix.setAttribute('transform', `translate(0 ${(-8 * (1 - fx)).toFixed(1)})`);
    nLight.style.opacity = seg(p, 0.82, 0.92);
    labels.forEach((g, k) => { g.style.opacity = eOut(stg(p, 0.86, 1, k, labels.length, 0.5)); });
  }
  return { draw };
})();

/* ползунок этапов */
(() => {
  if (!Room) return;
  const track = document.getElementById('track'), knob = document.getElementById('knob'), fill = document.getElementById('railFill');
  const ticks = [...track.querySelectorAll('.tick')];
  const btns = [...document.querySelectorAll('#stops button')];
  const cap = document.getElementById('caption');
  const NAMES = ['Бетон', 'Штукатурка', 'Плитка', 'Готово'];
  const CAPS = [
    '<b>Бетон.</b> Квартира от застройщика: стены с перепадами, из стены и пола торчат трубы.',
    '<b>Штукатурка.</b> Маяки по лазерному уровню, стены в одну плоскость, углы 90°, наливной пол.',
    '<b>Плитка.</b> Пол по диагонали, экран ванной. Внешний угол на запил 45°, без пластикового уголка.',
    '<b>Готово.</b> Ниша с подсветкой, ниша для ног под ванной, люк для обслуживания на магнитах.',
  ];
  let P = 0, tw = { p: 0 }, anim = null, stage = -1, w = track.clientWidth;
  const ui = p => {
    knob.style.transform = `translateX(${(p * w).toFixed(1)}px)`;
    fill.style.transform = `scaleX(${p.toFixed(4)})`;
    ticks.forEach((t, i) => t.classList.toggle('on', p >= i / 3 - 0.004));
    const s = Math.round(p * 3);
    if (s !== stage) {
      stage = s;
      btns.forEach((b, i) => (i === s ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
      track.setAttribute('aria-valuenow', s); track.setAttribute('aria-valuetext', NAMES[s]);
      cap.innerHTML = CAPS[s];
    }
  };
  const set = p => { P = clamp(p, 0, 1); Room.draw(P); ui(P); };
  const kill = () => { if (anim) { anim.kill(); anim = null; } };
  const go = (to, dur) => {
    kill();
    if (reduced() || !hasG) { set(to); return; }
    tw.p = P;
    anim = gsap.to(tw, { p: to, duration: dur ?? clamp(Math.abs(to - P) * 3.4, 0.35, 2.4), ease: 'power2.inOut', onUpdate: () => set(tw.p) });
  };
  addEventListener('resize', () => { w = track.clientWidth; ui(P); });
  btns.forEach(b => b.addEventListener('click', () => go(+b.dataset.stop / 3)));
  const fromX = x => { const r = track.getBoundingClientRect(); return clamp((x - r.left) / r.width, 0, 1); };
  let drag = false;
  track.addEventListener('pointerdown', e => { drag = true; kill(); track.setPointerCapture(e.pointerId); set(fromX(e.clientX)); });
  track.addEventListener('pointermove', e => { if (drag) set(fromX(e.clientX)); });
  const up = () => { if (!drag) return; drag = false; go(Math.round(P * 3) / 3, 0.35); };
  track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);
  track.addEventListener('keydown', e => {
    const s = Math.round(P * 3);
    const m = { ArrowRight: s + 1, ArrowUp: s + 1, ArrowLeft: s - 1, ArrowDown: s - 1, Home: 0, End: 3 }[e.key];
    if (m === undefined) return;
    e.preventDefault(); go(clamp(m, 0, 3) / 3);
  });
  // автозапуск: квартира собирается от бетона до готовой ванной
  if (reduced() || !hasG) { set(1); return; }
  set(0);
  const start = () => {
    tw.p = 0;
    anim = gsap.timeline({ delay: 0.5 })
      .to(tw, { p: 1 / 3, duration: 2.2, ease: 'power1.inOut', onUpdate: () => set(tw.p) })
      .to(tw, { p: 2 / 3, duration: 2.8, ease: 'power1.inOut', onUpdate: () => set(tw.p) }, '+=0.7')
      .to(tw, { p: 1, duration: 2.1, ease: 'power1.inOut', onUpdate: () => set(tw.p) }, '+=0.7');
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
  window.__replayHero = () => { kill(); set(0); start(); };
})();

/* ================= Угол: пластиковый уголок или запил 45° ================= */
(() => {
  const svg = document.getElementById('corner');
  if (!svg) return;
  const L = 50, HZ = 72, TT = 10, GL = 3, F = 40, E = TT + 2;
  const g = el('g', null, svg);
  // пол вокруг
  el('polygon', { points: pts([[-L, F, 0], [F, F, 0], [F, -L, 0], [-L, -L, 0]]), fill: '#D9DBD6' }, g);
  for (let u = -L + 4; u <= F; u += 30) {
    let a = iso(u, -L, 0), b = iso(u, F, 0); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#C7CAC5', 'stroke-width': 0.6 }, g);
    a = iso(-L, u, 0); b = iso(F, u, 0); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#C7CAC5', 'stroke-width': 0.6 }, g);
  }
  el('ellipse', { cx: 0, cy: 3, rx: 70, ry: 18, fill: '#1C1F22', opacity: 0.08 }, g);
  // затирка (фон граней)
  el('polygon', { points: pts([[-L, 0, 0], [0, 0, 0], [0, 0, HZ], [-L, 0, HZ]]), fill: '#BFC3BE' }, g);
  el('polygon', { points: pts([[0, -L, 0], [0, 0, 0], [0, 0, HZ], [0, -L, HZ]]), fill: '#B3B7B2' }, g);
  // срез сверху: сердцевина короба
  el('polygon', { points: pts([[-L, -L, HZ], [-TT - GL, -L, HZ], [-TT - GL, -TT - GL, HZ], [-L, -TT - GL, HZ]]), fill: '#B7BBB6' }, g);
  el('polygon', { points: pts([[-TT - GL, -L, HZ], [-TT, -L, HZ], [-TT, -TT, HZ], [-L, -TT, HZ], [-L, -TT - GL, HZ], [-TT - GL, -TT - GL, HZ]]), fill: '#6E7470' }, g);
  const TW = 30, TH = 18, gap = 0.8;
  const rows = []; for (let z = 0; z < HZ; z += TH) rows.push([z, Math.min(z + TH, HZ)]);
  const dyn = [];   // плитки у угла меняют длину
  const faceA = [], faceB = [];
  rows.forEach(([z0, z1]) => {
    for (let k = 0; k * TW < L; k++) {
      const a = -TW * (k + 1), b = -TW * k;
      const pa = el('polygon', { fill: shade('#F2F2EF', (rnd() - 0.5) * 5) }, g);
      const pb = el('polygon', { fill: shade('#E0E1DD', (rnd() - 0.5) * 5) }, g);
      faceA.push({ e: pa, a: Math.max(a, -L) + gap / 2, b: b - (k ? gap / 2 : 0), z0: z0 + gap / 2, z1: z1 - gap / 2, k });
      faceB.push({ e: pb, a: Math.max(a, -L) + gap / 2, b: b - (k ? gap / 2 : 0), z0: z0 + gap / 2, z1: z1 - gap / 2, k });
    }
  });
  // плитка в срезе сверху
  const topA = el('polygon', { fill: '#F2F2EF', stroke: '#1C1F22', 'stroke-width': 0.5 }, g);
  const topB = el('polygon', { fill: '#E0E1DD', stroke: '#1C1F22', 'stroke-width': 0.5 }, g);
  const mLine = el('line', { stroke: '#0E6A54', 'stroke-width': 1.6 }, g);
  const deg = el('text', { x: iso(-TT * 2.6, -TT * 0.3, HZ)[0], y: iso(-TT * 2.6, -TT * 0.3, HZ)[1] - 3, 'font-size': 8, 'font-weight': 600, fill: '#0E6A54', 'text-anchor': 'middle' }, g); deg.textContent = '45°';
  const edge = el('line', { stroke: '#FFFFFF', 'stroke-width': 0.8 }, g);
  // уголок: полукруглый профиль по ребру
  const bead = el('g', null, g);
  const bg = el('linearGradient', { id: 'beadG', x1: -11, y1: 0, x2: 11, y2: 0, gradientUnits: 'userSpaceOnUse' }, el('defs', null, svg));
  [[0, '#FFFFFF'], [0.45, '#F1F1EC'], [0.8, '#CDD0CA'], [1, '#B9BDB7']].forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, bg));
  { const top = [], bot = [];
    for (let a = 0; a <= 90; a += 10) { const u = -E + (E + 2.5) * Math.cos(a * Math.PI / 180), v = -E + (E + 2.5) * Math.sin(a * Math.PI / 180); top.push([u, v, HZ]); bot.push([u, v, 0]); }
    const side = top.map(p => iso(...p));
    const left = side[side.length - 1], right = side[0];
    const b0 = iso(...bot[bot.length - 1]), b1 = iso(...bot[0]);
    el('path', { d: `M${left[0]},${left[1]} L${b0[0]},${b0[1]} L${b1[0]},${b1[1]} L${right[0]},${right[1]} Z`, fill: 'url(#beadG)', stroke: '#A9ADA7', 'stroke-width': 0.5 }, bead);
    el('polygon', { points: pts([[-E, -E, HZ], ...top]), fill: '#F7F7F4', stroke: '#1C1F22', 'stroke-width': 0.5 }, bead);
  }
  const legend = document.getElementById('cornerLegend');
  const TXT = [
    'Пластиковый уголок закрывает срез плитки. Он выступает над стеной, а в его щелях копится грязь.',
    'Края двух плиток срезаны под 45° и сходятся в одну острую грань. Угол выглядит цельным, как будто плитка гнётся.',
  ];
  let S = 1;
  function draw(s) {
    const xe = -E + E * s, xi = -E + 2 * s;   // внешний и внутренний край угловой плитки
    faceA.forEach(t => { const b = t.k === 0 ? xe : t.b; t.e.setAttribute('points', pts([[t.a, 0, t.z0], [b, 0, t.z0], [b, 0, t.z1], [t.a, 0, t.z1]])); });
    faceB.forEach(t => { const b = t.k === 0 ? xe : t.b; t.e.setAttribute('points', pts([[0, t.a, t.z0], [0, b, t.z0], [0, b, t.z1], [0, t.a, t.z1]])); });
    topA.setAttribute('points', pts([[-L, -TT, HZ], [xi, -TT, HZ], [xe, 0, HZ], [-L, 0, HZ]]));
    topB.setAttribute('points', pts([[-TT, -L, HZ], [-TT, xi, HZ], [0, xe, HZ], [0, -L, HZ]]));
    const m0 = iso(-TT, -TT, HZ), m1 = iso(0, 0, HZ);
    mLine.setAttribute('x1', m0[0]); mLine.setAttribute('y1', m0[1]); mLine.setAttribute('x2', m1[0]); mLine.setAttribute('y2', m1[1]);
    mLine.style.opacity = seg(s, 0.7, 1); deg.style.opacity = seg(s, 0.8, 1);
    const e0 = iso(0, 0, 0), e1 = iso(0, 0, HZ);
    edge.setAttribute('x1', e0[0]); edge.setAttribute('y1', e0[1]); edge.setAttribute('x2', e1[0]); edge.setAttribute('y2', e1[1]);
    edge.style.opacity = seg(s, 0.75, 1);
    bead.style.opacity = 1 - seg(s, 0.1, 0.6);
    bead.setAttribute('transform', `translate(0 ${(16 * eOut(s)).toFixed(1)})`);
  }
  const btns = [...document.querySelectorAll('[data-corner]')];
  const tw = { s: 1 }; let anim;
  const setS = (to, instant) => {
    btns.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.corner === to)));
    legend.textContent = TXT[to];
    if (anim) anim.kill();
    if (instant || reduced() || !hasG) { S = to; tw.s = to; draw(to); return; }
    tw.s = S;
    anim = gsap.to(tw, { s: to, duration: 0.9, ease: 'power2.inOut', onUpdate: () => { S = tw.s; draw(S); } });
  };
  btns.forEach(b => b.addEventListener('click', () => setS(+b.dataset.corner)));
  setS(1, true);
  // один раз показать разницу, когда блок появился на экране
  if (!reduced() && hasG && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      setS(0, true);
      setTimeout(() => setS(1), 900);
    }, { threshold: 0.55 });
    io.observe(svg);
  }
})();

/* ================= Раскладка плитки и запас ================= */
const tilePieces = (lay, w, h, RW, RH) => {
  // возвращает многоугольники плиток (до обрезки) в координатах комнаты
  const out = [], cx = RW / 2, cy = RH / 2, g = 0.9, R = Math.hypot(RW, RH);
  const rect = (x, y, a, b) => [[x + g, y + g], [x + a - g, y + g], [x + a - g, y + b - g], [x + g, y + b - g]];
  if (lay === 'straight' || lay === 'offset') {
    const x0 = cx - Math.ceil(cx / w) * w;
    for (let j = 0, y = cy - Math.ceil(cy / h) * h; y < RH; y += h, j++) {
      const sh = lay === 'offset' && j % 2 ? w / 2 : 0;
      for (let x = x0 - (sh ? w : 0) + sh; x < RW; x += w) out.push(rect(x, y, w, h));
    }
  } else if (lay === 'diag') {
    for (let y = cy - Math.ceil(R / h) * h; y < cy + R; y += h)
      for (let x = cx - Math.ceil(R / w) * w + w / 2; x < cx + R; x += w) out.push(rect(x, y, w, h).map(p => rot(p, cx, cy, Math.PI / 4)));
  } else {
    // ёлочка: решётка a=(w,w), b=(L,-L), в ней горизонтальная и вертикальная плашка
    const Lg = Math.max(w, h), sw = Math.min(w, h), N = Math.ceil(R / sw) + 2, M = Math.ceil(R / Lg) + 2;
    for (let m = -N; m <= N; m++) for (let n = -M; n <= M; n++) {
      const ox = cx + m * sw + n * Lg, oy = cy + m * sw - n * Lg;
      out.push(rect(ox, oy, Lg, sw).map(p => rot(p, cx, cy, Math.PI / 4)));
      out.push(rect(ox + Lg, oy + sw - Lg, sw, Lg).map(p => rot(p, cx, cy, Math.PI / 4)));
    }
  }
  return out;
};
(() => {
  const svg = document.getElementById('layout');
  if (!svg) return;
  const RW = 300, RH = 200;
  const SIZES = {
    straight: ['60×60', '30×60', '60×120', '30×30'], offset: ['30×60', '60×120', '20×60', '60×60'],
    diag: ['60×60', '30×30', '45×45'], herring: ['20×120', '15×90', '10×60'],
  };
  const STOCK = { straight: 0.07, offset: 0.1, diag: 0.15, herring: 0.15 };
  const size = document.getElementById('tSize'), areaIn = document.getElementById('tArea');
  const buyOut = document.getElementById('tBuy'), info = document.getElementById('tInfo');
  const btns = [...document.querySelectorAll('[data-lay]')];
  let lay = 'straight', group = null, stat = { cut: 0, all: 0 };
  const fillSizes = () => { size.innerHTML = ''; SIZES[lay].forEach(s => { const o = document.createElement('option'); o.textContent = s; size.appendChild(o); }); };
  const parse = () => { const [a, b] = size.value.split('×').map(Number); return { w: Math.max(a, b), h: Math.min(a, b) }; };
  function render(animate) {
    const { w, h } = parse();
    const ng = el('g', null, svg);
    let cut = 0, all = 0;
    const list = [];
    tilePieces(lay, w, h, RW, RH).forEach(pl => {
      const full = area(pl), c = clipRect(pl, 0, 0, RW, RH);
      if (c.length < 3) return;
      const a = area(c); if (a < 2) return;
      const isCut = a < full * 0.985;
      all++; if (isCut) cut++;
      const cx = c.reduce((s, p) => s + p[0], 0) / c.length, cy = c.reduce((s, p) => s + p[1], 0) / c.length;
      list.push({ d: cx + cy, e: el('polygon', { points: flat(c), fill: isCut ? '#D9DBD5' : '#F4F4F1' }, ng) });
    });
    el('rect', { x: 0.75, y: 0.75, width: RW - 1.5, height: RH - 1.5, fill: 'none', stroke: '#1C1F22', 'stroke-width': 1.5 }, ng);
    stat = { cut, all };
    const old = group; group = ng;
    if (old) {
      if (hasG && !reduced() && animate) gsap.to(old, { opacity: 0, duration: 0.18, onComplete: () => old.remove() });
      else old.remove();
    }
    if (hasG && !reduced() && animate) {
      list.sort((a, b) => a.d - b.d);
      gsap.from(list.map(t => t.e), { opacity: 0, scale: 0.86, transformOrigin: '50% 50%', duration: 0.32, ease: 'power2.out', stagger: { amount: Math.min(0.9, list.length * 0.012) } });
    }
    calc();
  }
  function calc() {
    const a = clamp(parseFloat(String(areaIn.value).replace(',', '.')) || 0, 0, 500);
    const { w, h } = parse(), k = STOCK[lay] + (w >= 120 ? 0.03 : 0);
    const buy = a * (1 + k), n = Math.ceil(buy / (w * h / 10000));
    buyOut.textContent = (Math.round(buy * 10) / 10).toLocaleString('ru-RU') + ' м²';
    info.textContent = `запас ${Math.round(k * 100)}%, около ${n.toLocaleString('ru-RU')} плиток. На схеме комнаты 3×2 м режем ${stat.cut} из ${stat.all}`;
  }
  btns.forEach(b => b.addEventListener('click', () => {
    lay = b.dataset.lay; btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    fillSizes(); render(true);
  }));
  size.addEventListener('change', () => render(true));
  areaIn.addEventListener('input', calc);
  fillSizes(); render(false);
})();

/* ёлочка в карточке услуг */
(() => {
  const svg = document.getElementById('herring');
  if (!svg) return;
  tilePieces('herring', 70, 14, 300, 230).forEach(pl => {
    const c = clipRect(pl, 0, 0, 300, 230); if (c.length < 3) return;
    el('polygon', { points: flat(c), fill: shade('#E2D6C2', (rnd() - 0.5) * 16) }, svg);
  });
})();

/* ================= Слои стены ================= */
(() => {
  const svg = document.getElementById('layerSvg');
  if (!svg) return;
  svg.setAttribute('viewBox', '-170 -10 440 520');
  svg.style.aspectRatio = '440 / 520';
  const LX = 250, LY = 165, GAP = 34;
  const L = [
    { t: 40, top: '#B9BCB7', a: '#9FA39E', b: '#8E928D', pat: 'speck' },
    { t: 4, top: '#C5CEC9', a: '#B1BAB5', b: '#A2ABA6' },
    { t: 24, top: '#DCDBD5', a: '#C8C7C1', b: '#B9B8B2' },
    { t: 7, top: '#EFEEE9', a: '#DDDCD6', b: '#D0CFC9' },
    { t: 3, top: '#F7F7F4', a: '#E4E4E0', b: '#D8D8D3', pat: 'mesh' },
    { t: 6, top: '#0E6A54', a: '#0B5845', b: '#094A3A' },
  ];
  const defs = el('defs', null, svg);
  const sp = el('pattern', { id: 'speck2', width: 36, height: 36, patternUnits: 'userSpaceOnUse' }, defs);
  for (let i = 0; i < 26; i++) el('circle', { cx: (rnd() * 36).toFixed(1), cy: (rnd() * 36).toFixed(1), r: (0.5 + rnd()).toFixed(2), fill: '#6F746F', opacity: (0.2 + rnd() * 0.35).toFixed(2) }, sp);
  const mp = el('pattern', { id: 'mesh', width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(30)' }, defs);
  el('path', { d: 'M0 0H7M0 0V7', stroke: '#BFC3BE', 'stroke-width': 0.9, fill: 'none' }, mp);
  const root = el('g', { transform: 'translate(0 292)' }, svg);
  const items = L.map((l, i) => {
    const g = el('g', null, root);
    const o = {
      g, l,
      top: el('polygon', { fill: l.top }, g),
      tex: l.pat ? el('polygon', { fill: `url(#${l.pat === 'speck' ? 'speck2' : 'mesh'})` }, g) : null,
      fa: el('polygon', { fill: l.a }, g),
      fb: el('polygon', { fill: l.b }, g),
      tag: el('g', null, g),
    };
    el('rect', { x: -12, y: -12, width: 24, height: 24, fill: '#1C1F22' }, o.tag);
    el('text', { x: 0, y: 5, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600, fill: '#E9EAE6' }, o.tag).textContent = i + 1;
    return o;
  });
  const lis = [...document.querySelectorAll('#layList li')];
  let last = -1;
  function draw(e) {
    let z = 0;
    items.forEach((o, i) => {
      const z0 = z + e * i * GAP, z1 = z0 + o.l.t;
      z += o.l.t;
      o.top.setAttribute('points', pts([[0, 0, z1], [LX, 0, z1], [LX, LY, z1], [0, LY, z1]]));
      if (o.tex) o.tex.setAttribute('points', pts([[0, 0, z1], [LX, 0, z1], [LX, LY, z1], [0, LY, z1]]));
      o.fa.setAttribute('points', pts([[0, LY, z0], [LX, LY, z0], [LX, LY, z1], [0, LY, z1]]));
      o.fb.setAttribute('points', pts([[LX, 0, z0], [LX, LY, z0], [LX, LY, z1], [LX, 0, z1]]));
      const a = iso(LX, LY * 0.45, (z0 + z1) / 2);
      o.tag.setAttribute('transform', `translate(${(a[0] + 26).toFixed(1)} ${(a[1]).toFixed(1)})`);
      o.tag.style.opacity = i === 0 ? 1 : seg(e, (i - 0.6) / L.length, i / L.length);
    });
    const on = Math.min(L.length - 1, Math.floor(e * L.length + 0.4));
    if (on !== last) { last = on; lis.forEach((li, i) => li.classList.toggle('on', i <= on)); }
  }
  if (reduced() || !hasG || !window.ScrollTrigger) { draw(1); return; }
  draw(0);
  const mm = gsap.matchMedia();
  mm.add({ desk: '(min-width: 901px)', phone: '(max-width: 900px)' }, ctx => {
    const st = ctx.conditions.desk
      ? { trigger: '#layers .layers-pin', start: 'top top', end: '+=900', pin: true, scrub: 0.6 }
      : { trigger: '#layerSvg', start: 'top 80%', end: 'bottom 30%', scrub: 0.5 };
    const o = { e: 0 };
    gsap.to(o, { e: 1, ease: 'none', scrollTrigger: st, onUpdate: () => draw(eIO(o.e)) });
  });
})();

/* ================= Планировки объектов ================= */
const PLANS = [
  {
    title: 'Двушка по дизайн-проекту', meta: '64 м², новостройка, бетон', term: '5 месяцев',
    rooms: [
      { id: 'liv', x: 10, y: 10, w: 220, h: 150, n: 'Кухня-гостиная', a: '24 м²' },
      { id: 'bed', x: 230, y: 10, w: 160, h: 150, n: 'Спальня', a: '16 м²' },
      { id: 'bath', x: 10, y: 160, w: 100, h: 130, n: 'Ванная', a: '4,8 м²' },
      { id: 'wc', x: 110, y: 160, w: 60, h: 130, n: 'С/у', a: '2 м²' },
      { id: 'hall', x: 170, y: 160, w: 140, h: 130, n: 'Прихожая', a: '9 м²' },
      { id: 'ward', x: 310, y: 160, w: 80, h: 130, n: 'Гардероб', a: '4 м²' },
    ],
    doors: [[200, 160, 'h'], [262, 160, 'h'], [170, 196, 'v'], [170, 250, 'v'], [310, 210, 'v'], [218, 290, 'h']],
    windows: [[40, 10, 150, 10], [262, 10, 360, 10]],
    tags: {
      'Штукатурка по маякам': ['liv', 'bed', 'hall', 'ward'], 'Наливной пол': ['liv', 'bed', 'bath', 'wc', 'hall', 'ward'],
      'Плитка': ['bath', 'wc', 'hall'], 'Паркет ёлочкой': ['liv', 'bed'], 'Покраска и молдинги': ['liv', 'bed', 'hall'],
    },
    fx: [['bath', 14, 246, 92, 40]],
  },
  {
    title: 'Ванная под ключ', meta: '4,2 м², вторичка', term: '3 недели',
    rooms: [
      { id: 'room', x: 30, y: 20, w: 340, h: 260, n: '', a: '' },
      { id: 'screen', x: 34, y: 24, w: 222, h: 100, n: '', a: '' },
      { id: 'box', x: 300, y: 24, w: 66, h: 110, n: '', a: '' },
    ],
    doors: [[250, 280, 'h']],
    windows: [],
    tags: { 'Гидроизоляция': ['room'], 'Запил 45°': ['screen', 'box'], 'Ниша для ног': ['screen'], 'Люк на магнитах': ['screen'], 'Скрытый вентилятор': ['box'] },
    fx: [['bathBig', 34, 24, 222, 100], ['wcBig', 300, 24, 66, 110], ['sink', 34, 180, 70, 70]],
  },
  {
    title: 'Комната с декоративной штукатуркой', meta: '13 м², загородный дом', term: '6 недель',
    rooms: [
      { id: 'room', x: 50, y: 20, w: 300, h: 260, n: 'Спальня', a: '13 м²' },
      { id: 'accent', x: 54, y: 24, w: 12, h: 252, n: '', a: '' },
      { id: 'outer', x: 54, y: 24, w: 292, h: 12, n: '', a: '' },
    ],
    doors: [[300, 280, 'h']],
    windows: [[150, 20, 250, 20]],
    tags: { 'Демонтаж старого ГКЛ': ['outer'], 'Штукатурка по маякам': ['room'], 'Новая проводка от щита': ['room'], 'Декоративная штукатурка': ['accent'] },
    fx: [['bed', 66, 90, 120, 130]],
  },
  {
    title: 'Кухня после потопа', meta: '9 м², вторичка, частичный ремонт', term: '2 недели',
    rooms: [
      { id: 'room', x: 50, y: 20, w: 300, h: 260, n: 'Кухня', a: '9 м²' },
      { id: 'apron', x: 54, y: 24, w: 292, h: 14, n: '', a: '' },
      { id: 'ceil', x: 230, y: 24, w: 116, h: 120, n: '', a: '' },
    ],
    doors: [[100, 280, 'h']],
    windows: [[350, 120, 350, 220]],
    tags: { 'Фартук из керамогранита': ['apron'], 'Покраска потолка': ['room'], 'Обработка от плесени': ['ceil'] },
    fx: [['counter', 54, 38, 292, 50]],
  },
];
function drawPlan(svg, P, mini) {
  const ink = mini ? '#0E6A54' : '#1C1F22';
  const rooms = {};
  P.rooms.forEach(r => {
    rooms[r.id] = el('rect', { x: r.x, y: r.y, width: r.w, height: r.h, fill: mini ? 'none' : (r.n === '' && r.id !== 'room' ? 'transparent' : '#FFFFFF'), class: 'room', 'data-room': r.id }, svg);
  });
  (P.fx || []).forEach(([k, x, y, w, h]) => {
    const st = { fill: 'none', stroke: mini ? ink : '#7C8380', 'stroke-width': 1.2 };
    if (k === 'bath' || k === 'bathBig') { el('rect', Object.assign({ x: x + 4, y: y + 4, width: w - 8, height: h - 8, rx: 14 }, st), svg); }
    else if (k === 'wcBig') { el('rect', Object.assign({ x: x + 8, y: y + 6, width: w - 16, height: 16 }, st), svg); el('ellipse', Object.assign({ cx: x + w / 2, cy: y + 52, rx: 18, ry: 26 }, st), svg); }
    else if (k === 'sink') { el('rect', Object.assign({ x, y, width: w, height: h }, st), svg); el('ellipse', Object.assign({ cx: x + w / 2 - 6, cy: y + h / 2, rx: 20, ry: 24 }, st), svg); }
    else if (k === 'bed') { el('rect', Object.assign({ x, y, width: w, height: h }, st), svg); el('rect', Object.assign({ x: x + 6, y: y + 8, width: 24, height: h - 16 }, st), svg); }
    else if (k === 'counter') { el('rect', Object.assign({ x, y, width: w, height: h }, st), svg); el('rect', Object.assign({ x: x + 180, y: y + 10, width: 46, height: 30 }, st), svg); }
  });
  // стены
  P.rooms.filter(r => r.n !== '' || r.id === 'room').forEach(r => el('rect', { x: r.x, y: r.y, width: r.w, height: r.h, fill: 'none', stroke: ink, 'stroke-width': mini ? 2 : 4 }, svg));
  const ext = P.rooms.filter(r => r.n !== '' || r.id === 'room');
  const bx0 = Math.min(...ext.map(r => r.x)), by0 = Math.min(...ext.map(r => r.y)), bx1 = Math.max(...ext.map(r => r.x + r.w)), by1 = Math.max(...ext.map(r => r.y + r.h));
  el('rect', { x: bx0, y: by0, width: bx1 - bx0, height: by1 - by0, fill: 'none', stroke: ink, 'stroke-width': mini ? 3 : 8 }, svg);
  const paper = mini ? '#F5F5F2' : '#EFEFEB';
  (P.windows || []).forEach(([x1, y1, x2, y2]) => {
    el('line', { x1, y1, x2, y2, stroke: '#FFFFFF', 'stroke-width': mini ? 3 : 8 }, svg);
    const dx = x1 === x2 ? 2.5 : 0, dy = y1 === y2 ? 2.5 : 0;
    el('line', { x1: x1 - dx, y1: y1 - dy, x2: x2 - dx, y2: y2 - dy, stroke: ink, 'stroke-width': 1 }, svg);
    el('line', { x1: x1 + dx, y1: y1 + dy, x2: x2 + dx, y2: y2 + dy, stroke: ink, 'stroke-width': 1 }, svg);
  });
  (P.doors || []).forEach(([x, y, o]) => {
    const d = 30;
    if (o === 'h') {
      el('line', { x1: x, y1: y, x2: x + d, y2: y, stroke: mini ? paper : '#FFFFFF', 'stroke-width': mini ? 4 : 9 }, svg);
      if (!mini) { el('line', { x1: x, y1: y, x2: x, y2: y - d, stroke: ink, 'stroke-width': 1.4 }, svg); el('path', { d: `M${x} ${y - d} A${d} ${d} 0 0 1 ${x + d} ${y}`, fill: 'none', stroke: ink, 'stroke-width': 0.8, 'stroke-dasharray': '3 3' }, svg); }
    } else {
      el('line', { x1: x, y1: y, x2: x, y2: y + d, stroke: mini ? paper : '#FFFFFF', 'stroke-width': mini ? 4 : 9 }, svg);
      if (!mini) { el('line', { x1: x, y1: y, x2: x - d, y2: y, stroke: ink, 'stroke-width': 1.4 }, svg); el('path', { d: `M${x - d} ${y} A${d} ${d} 0 0 0 ${x} ${y + d}`, fill: 'none', stroke: ink, 'stroke-width': 0.8, 'stroke-dasharray': '3 3' }, svg); }
    }
  });
  if (!mini) P.rooms.filter(r => r.n).forEach(r => {
    const t = el('text', { x: r.x + r.w / 2, y: r.y + r.h / 2 - 2, 'text-anchor': 'middle', 'font-size': r.w < 70 ? 11 : 13, fill: '#1C1F22' }, svg); t.textContent = r.n;
    const a = el('text', { x: r.x + r.w / 2, y: r.y + r.h / 2 + 15, 'text-anchor': 'middle', 'font-size': 11, fill: '#50575C' }, svg); a.textContent = r.a;
  });
  return rooms;
}
(() => {
  const shelf = document.getElementById('shelf');
  if (!shelf) return;
  PLANS.forEach(P => {
    const card = document.createElement('article'); card.className = 'work';
    card.innerHTML = `<div class="plan"><span class="ex">пример объекта</span><svg viewBox="0 0 400 300" role="img"></svg></div>
      <div class="body"><h3></h3><p class="meta"></p><div class="tags" role="group" aria-label="Виды работ"></div>
      <div class="term"><span></span><span class="ex">срок для примера</span></div></div>`;
    const svg = card.querySelector('svg');
    svg.setAttribute('aria-label', 'Планировка: ' + P.title);
    card.querySelector('h3').textContent = P.title;
    card.querySelector('.meta').textContent = P.meta;
    card.querySelector('.term span').textContent = 'Срок: ' + P.term;
    const rooms = drawPlan(svg, P, false);
    const tg = card.querySelector('.tags');
    Object.keys(P.tags).forEach(name => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = name; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        const on = b.getAttribute('aria-pressed') !== 'true';
        tg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
        Object.values(rooms).forEach(r => r.classList.remove('hl'));
        if (on) { b.setAttribute('aria-pressed', 'true'); P.tags[name].forEach(id => rooms[id] && rooms[id].classList.add('hl')); }
      });
      tg.appendChild(b);
    });
    tg.querySelector('button').click();
    shelf.appendChild(card);
  });
  const step = dir => { const c = shelf.querySelector('.work'); shelf.scrollBy({ left: dir * (c.getBoundingClientRect().width + 14), behavior: reduced() ? 'auto' : 'smooth' }); };
  document.getElementById('prevW').addEventListener('click', () => step(-1));
  document.getElementById('nextW').addEventListener('click', () => step(1));
  const mini = document.getElementById('planMini');
  if (mini) drawPlan(mini, PLANS[0], true);
})();

/* ================= Этапы: линия прогресса ================= */
(() => {
  const prog = document.getElementById('stepProg');
  if (!prog) return;
  const lis = [...document.querySelectorAll('#steplist li')];
  const mark = k => lis.forEach((li, i) => { li.querySelector('.n').style.borderColor = i <= k ? '#0E6A54' : ''; li.querySelector('.n').style.color = i <= k ? '#0E6A54' : ''; });
  const list = document.getElementById('steplist');
  const fit = () => list.style.setProperty('--lh', (lis[lis.length - 1].offsetTop + 14) + 'px');
  fit(); addEventListener('resize', fit);
  if (reduced() || !hasG || !window.ScrollTrigger) { prog.style.transform = 'scaleY(1)'; mark(lis.length - 1); return; }
  gsap.fromTo(prog, { scaleY: 0 }, {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '#steplist', start: 'top 65%', end: 'bottom 65%', scrub: 0.4, onUpdate: s => mark(Math.floor(s.progress * (lis.length - 1) + 0.05)) },
  });
})();

/* ================= Калькулятор ================= */
const Calc = (() => {
  const f = document.getElementById('calcForm');
  if (!f) return null;
  const RATE = { cos: 4500, cap: 11000, des: 16000 };     // работы, ₽ за м², для примера
  const MAT = { cos: 3500, cap: 9000, des: 15000 };       // материалы, ₽ за м², для примера
  const WK = { cos: 0.07, cap: 0.19, des: 0.25 };          // недель на м²
  const STATE = { bare: 1, wb: 0.72, old: 1.15 }, KIND = { new: 1, old: 1.08 };
  const SHARE = { cos: [0.12, 0.13, 0.6, 0.15], cap: [0.34, 0.2, 0.36, 0.1], des: [0.3, 0.2, 0.42, 0.08] };
  const NAMES = { new: 'новостройка', old: 'вторичка', bare: 'бетон', wb: 'white box', cos: 'косметический', cap: 'капитальный', des: 'по дизайн-проекту', work: 'только работы', all: 'работы и материалы' };
  const $ = id => document.getElementById(id);
  const areaIn = $('area'), areaOut = $('areaOut');
  const r10 = v => Math.round(v / 10000) * 10000;
  const rub = v => v.toLocaleString('ru-RU') + ' ₽';
  const bars = [...document.querySelectorAll('#gantt i')];
  let last = '';
  function run() {
    const d = Object.fromEntries(new FormData(f));
    const a = +areaIn.value;
    areaOut.textContent = a + ' м²';
    const base = a * RATE[d.level] * STATE[d.state] * KIND[d.kind];
    const w0 = r10(base * 0.92), w1 = r10(base * 1.1);
    $('rWork').textContent = `от ${w0.toLocaleString('ru-RU')} до ${rub(w1)}`;
    const mat = r10(a * MAT[d.level] * (d.state === 'wb' ? 0.85 : 1));
    $('rMatRow').hidden = d.what !== 'all';
    $('rMat').textContent = rub(mat);
    const wk = 2 + a * WK[d.level] * (d.state === 'wb' ? 0.8 : d.state === 'old' ? 1.1 : 1);
    const t0 = Math.max(1, Math.round(wk * 0.9)), t1 = Math.max(t0 + 1, Math.round(wk * 1.12));
    $('rTime').textContent = `от ${t0} до ${t1} недель`;
    const sh = SHARE[d.level].slice();
    if (d.state === 'wb') { sh[0] *= 0.5; }
    const sum = sh.reduce((s, v) => s + v, 0);
    let x = 0;
    bars.forEach((b, i) => { const wv = sh[i] / sum; b.style.transform = `translateX(${(x * 100).toFixed(2)}%) scaleX(${wv.toFixed(3)})`; x += wv; });
    last = `Расчёт с сайта: ${NAMES[d.kind]}, ${d.state === 'old' ? 'старый ремонт' : NAMES[d.state]}, ${a} м², ${NAMES[d.level]}, ${NAMES[d.what]}. Работы от ${w0.toLocaleString('ru-RU')} до ${rub(w1)}${d.what === 'all' ? ', материалы около ' + rub(mat) : ''}, срок от ${t0} до ${t1} недель.`;
  }
  f.addEventListener('input', run); f.addEventListener('change', run);
  run();
  document.getElementById('toLead').addEventListener('click', () => {
    const msg = document.getElementById('fMsg');
    msg.value = last;
    document.getElementById('fWhat').value = 'Ремонт под ключ';
    document.getElementById('lead').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
    setTimeout(() => document.getElementById('fName').focus({ preventScroll: true }), reduced() ? 0 : 700);
  });
  return { summary: () => last };
})();

/* ================= Заявка ================= */
(() => {
  const form = document.getElementById('order');
  if (!form) return;
  const name = document.getElementById('fName'), phone = document.getElementById('fPhone'), ok = document.getElementById('fOk');
  const err = (inp, id, msg) => { document.getElementById(id).textContent = msg; if (inp) inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (inp && msg) inp.setAttribute('aria-describedby', id); };
  phone.addEventListener('input', () => {
    let d = phone.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (d && !d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    const p = d.slice(1);
    let s = d ? '+7' : '';
    if (p.length) s += ' (' + p.slice(0, 3);
    if (p.length >= 3) s += ')';
    if (p.length > 3) s += ' ' + p.slice(3, 6);
    if (p.length > 6) s += '-' + p.slice(6, 8);
    if (p.length > 8) s += '-' + p.slice(8, 10);
    phone.value = s;
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    let bad = null;
    const n = name.value.trim();
    if (n.length < 2) { err(name, 'eName', 'Напишите имя, чтобы мастер знал, как обращаться'); bad = bad || name; } else err(name, 'eName', '');
    if (phone.value.replace(/\D/g, '').length !== 11) { err(phone, 'ePhone', 'Нужен номер из 11 цифр, например +7 912 345-67-89'); bad = bad || phone; } else err(phone, 'ePhone', '');
    if (!ok.checked) { err(null, 'eOk', 'Отметьте согласие на обработку данных'); bad = bad || ok; } else err(null, 'eOk', '');
    if (bad) { bad.focus(); return; }
    form.classList.add('done');
    document.getElementById('sent').scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  });
  const dlg = document.getElementById('policy');
  document.getElementById('polLink').addEventListener('click', e => { e.preventDefault(); if (dlg.showModal) dlg.showModal(); });
})();

/* ================= Кнопки-заглушки, шапка, нижняя панель ================= */
(() => {
  const toast = document.getElementById('toast');
  let tm;
  const say = msg => { toast.textContent = msg; toast.classList.add('on'); clearTimeout(tm); tm = setTimeout(() => toast.classList.remove('on'), 3200); };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-stub]');
    if (!b) return;
    const k = b.dataset.stub;
    say(k === 'телефон' ? 'Это демо. На рабочем сайте кнопка сразу наберёт ваш номер.' : `Это демо. На рабочем сайте кнопка откроет ваш ${k}.`);
  });
  const top = document.querySelector('header.top'), hero = document.getElementById('hero'), dock = document.getElementById('dock');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      top.classList.toggle('stuck', en.boundingClientRect.top < 0);
      dock.classList.toggle('show', !en.isIntersecting);
    }, { threshold: 0.02 }).observe(hero);
  }
  if (hasG && window.ScrollTrigger) {
    addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
