// Sydney Harbour at night: Opera House, Harbour Bridge, Sydney Tower and the CBD, with the water below.
// Drawn once as a static SVG; anything that changes (Vivid colours on the sails, bridge lights, burst glow)
// is a separate overlay whose CSS opacity animates, so the city is never repainted.
// viewBox 1200 x 360, water line at y = 262, sliced from the bottom-centre.

export const VW = 1200, VH = 360, WY = 262;
const f = (n) => +n.toFixed(1);
const R = (x, y, w, h) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const windows = [];
const win = (x, y, w = 2.6, h = 3.4, p = .3) => { if (rnd() < p) windows.push([x, y, w, h, rnd()]); };

/* ---------- CBD towers + Sydney Tower ---------- */
const TOWERS = [[440, 26, 156], [468, 20, 132], [492, 30, 118], [527, 22, 146], [552, 34, 104], [590, 24, 126], [660, 28, 108],
  [692, 22, 136], [718, 30, 96], [752, 20, 128], [776, 26, 142], [806, 34, 152], [846, 22, 170], [872, 28, 162], [904, 24, 178]];
function cbd() {
  const d = [];
  for (const [x, w, top] of TOWERS) {
    d.push(R(x, top, w, WY - top));
    if (rnd() < .4) d.push(R(x + 3, top - 6, w - 6, 6));
    if (rnd() < .3) d.push(R(x + w / 2 - .6, top - 18, 1.2, 14));
    for (let y = top + 6; y < WY - 6; y += 7) for (let wx = x + 3; wx < x + w - 3; wx += 5) win(wx, y, 2.4, 3, .12);
  }
  return d;
}
function sydneyTower(cx) {
  return {
    d: [R(cx - 3, 96, 6, WY - 96), R(cx - 8, 88, 16, 5), R(cx - .7, 46, 1.4, 42)],
    turret: `M${cx - 13} 96Q${cx} 84 ${cx + 13} 96L${cx + 11} 110Q${cx} 114 ${cx - 11} 110Z`,
  };
}

/* ---------- The Rocks / Circular Quay and the north shore ---------- */
function shores() {
  const d = [];
  let x = -10;
  while (x < 360) {
    const w = 18 + rnd() * 30, h = 18 + rnd() * 46;
    d.push(R(x, WY - h, w, h));
    for (let y = WY - h + 5; y < WY - 4; y += 7) for (let wx = x + 3; wx < x + w - 3; wx += 6) win(wx, y, 2.4, 3, .22);
    x += w + rnd() * 4;
  }
  d.push(`M960 ${WY}Q1010 236 1066 244Q1130 228 1210 238V${WY}Z`);
  x = 1000;
  while (x < 1210) { const w = 14 + rnd() * 22, h = 8 + rnd() * 20; d.push(R(x, WY - 14 - h * .6, w, h)); x += w + 6 + rnd() * 10; }
  return d;
}

/* ---------- Harbour Bridge ---------- */
const quad = (p0, c, p2, t) => [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p2[1]];
const TOP = [[632, 206], [799, 18], [966, 206]];
const BOT = [[638, 224], [799, 64], [960, 224]];
export const DECK = { x0: 642, x1: 956, y: 218 };
export const topChord = (t) => quad(...TOP, t);
function bridge() {
  const solid = [];
  for (const x of [598, 966]) solid.push(R(x, 180, 34, WY - 180), R(x + 3, 172, 28, 8), R(x + 8, 165, 18, 7));
  solid.push(R(560, 216, 476, 6));
  for (const x of [574, 1012]) solid.push(R(x, 222, 4, WY - 222));
  let truss = `M${TOP[0]}Q${TOP[1]} ${TOP[2]}M${BOT[0]}Q${BOT[1]} ${BOT[2]}`;
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = topChord(t), b = quad(...BOT, t);
    truss += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
    if (i < n) { const b2 = quad(...BOT, (i + 1) / n); truss += `M${f(a[0])} ${f(a[1])}L${f(b2[0])} ${f(b2[1])}`; }
    if (b[1] < DECK.y - 2) truss += `M${f(b[0])} ${f(b[1])}V${DECK.y}`;
  }
  const lights = [];
  for (let i = 1; i < 44; i++) lights.push(topChord(i / 44));
  const deckLights = [];
  for (let x = 566; x < 1032; x += 7) deckLights.push([x, 214.5]);
  return { solid, truss, lights, deckLights };
}

/* ---------- Opera House ---------- */
// [x0, width, height, facing]: -1 = tip leans left (towards the harbour), 1 = a back shell leaning right.
// Listed back to front so nearer shells overlap the ones behind.
const SAILS = [[540, 34, 36, 1], [470, 44, 50, 1], [556, 30, 30, -1], [522, 48, 52, -1], [488, 58, 70, -1], [448, 58, 58, -1], [412, 70, 76, -1], [372, 78, 92, -1]];
const B = WY - 14;
// a shell: a bulging outer curve up to the tip, then a slightly concave fall back to the podium
function sail(x0, w, h, dir) {
  const fx = (u) => (dir < 0 ? x0 + w * u : x0 + w * (1 - u));
  const tip = [fx(.26), B - h];
  return `M${f(fx(0))} ${B}C${f(fx(-.06))} ${f(B - h * .55)} ${f(fx(.08))} ${f(B - h * .95)} ${f(tip[0])} ${f(tip[1])}`
    + `C${f(fx(.42))} ${f(B - h * .78)} ${f(fx(.66))} ${f(B - h * .34)} ${f(fx(1))} ${B}Z`;
}
function ribs(x0, w, h, dir) {
  const fx = (u) => (dir < 0 ? x0 + w * u : x0 + w * (1 - u));
  const tip = [fx(.26), B - h];
  return [.38, .62, .84].map((k) => `M${f(tip[0])} ${f(tip[1])}Q${f(fx(k * .55 + .12))} ${f(B - h * .5)} ${f(fx(k))} ${B}`).join('');
}
export const OPERA_TIP = [372 + 78 * .26, B - 92];

export function buildHarbour(el) {
  windows.length = 0; seed = 11;
  const back = shores();
  const city = cbd();
  const tower = sydneyTower(640);
  const br = bridge();
  const podium = [R(356, B, 222, 14), R(350, B + 10, 234, 4)];
  const sailsD = SAILS.map((s) => sail(...s)).join('');
  const ribsD = SAILS.map((s) => ribs(...s)).join('');
  const front = [...city, ...tower.d, ...br.solid, ...podium];

  const rect = ([x, y, w, h, r]) => `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" opacity="${f(.35 + r * .55)}"/>`;
  const steadyWin = windows.filter((w) => w[4] <= .85).map(rect).join('');
  const twA = windows.filter((w, i) => w[4] > .85 && i % 2 === 0).map(rect).join('');
  const twB = windows.filter((w, i) => w[4] > .85 && i % 2 === 1).map(rect).join('');
  const dot = ([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="1.3"/>`;
  const lightsA = br.lights.filter((_, i) => i % 2 === 0).map(dot).join('');
  const lightsB = br.lights.filter((_, i) => i % 2 === 1).map(dot).join('');
  const deck = br.deckLights.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r=".9" fill="${i % 3 ? '#ffe9b0' : '#ff7a6b'}"/>`).join('');

  // water: reflections of the lights, squashed and fading with depth, plus ripple lines
  const mirror = `translate(0 ${f(WY * 1.8)}) scale(1 -0.8)`;
  const streaks = windows.filter((w) => w[4] > .5).map(([x, y, w, h]) => `<rect x="${f(x)}" y="${f(y - h * 2)}" width="${w}" height="${f(h * 3)}"/>`).join('');
  let ripples = '';
  for (let i = 0; i < 46; i++) {
    const y = WY + 4 + rnd() * (VH - WY - 6), x = rnd() * 1200, len = 18 + rnd() * 70;
    ripples += `<path d="M${f(x)} ${f(y)}h${f(len)}" stroke-opacity="${f(.05 + rnd() * .12)}"/>`;
  }

  const layer = (cls, body) => `<svg class="${cls}" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
  const vivid = (cls, grad, extra = '') => layer(`vivid ${cls}`, `
    <path d="${sailsD}" fill="url(#${grad})"/>${extra}
    <path d="${sailsD}" fill="url(#${grad})" transform="${mirror}" opacity=".14" mask="url(#fadeMask)"/>`);

  el.innerHTML = layer('city-base', `
  <defs>
    <linearGradient id="hFill" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="${WY}">
      <stop offset="0" stop-color="#18245c"/><stop offset=".6" stop-color="#0f163c"/><stop offset="1" stop-color="#060a20"/>
    </linearGradient>
    <linearGradient id="hRim" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="${WY}">
      <stop offset="0" stop-color="#9fd3ff" stop-opacity=".6"/><stop offset=".5" stop-color="#c58cff" stop-opacity=".2"/><stop offset="1" stop-color="#c58cff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="hLit" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="${WY}">
      <stop id="hLitStop" offset="0" stop-color="#ffd166" stop-opacity=".85"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="hWater" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0c1d52"/><stop offset="1" stop-color="#02050f"/>
    </linearGradient>
    <linearGradient id="sailWhite" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="${B}">
      <stop offset="0" stop-color="#f6f2e8"/><stop offset="1" stop-color="#a9a6c4"/>
    </linearGradient>
    <linearGradient id="vPink" gradientUnits="userSpaceOnUse" x1="370" y1="150" x2="590" y2="${B}">
      <stop offset="0" stop-color="#ff5fb8"/><stop offset=".5" stop-color="#b44dff"/><stop offset="1" stop-color="#ff8a3d"/>
    </linearGradient>
    <linearGradient id="vBlue" gradientUnits="userSpaceOnUse" x1="370" y1="150" x2="590" y2="${B}">
      <stop offset="0" stop-color="#4ff0ff"/><stop offset=".55" stop-color="#3b6bff"/><stop offset="1" stop-color="#9b5cff"/>
    </linearGradient>
    <linearGradient id="vGold" gradientUnits="userSpaceOnUse" x1="370" y1="150" x2="590" y2="${B}">
      <stop offset="0" stop-color="#ffe27a"/><stop offset=".5" stop-color="#ff9f1c"/><stop offset="1" stop-color="#ff3d6e"/>
    </linearGradient>
    <pattern id="vStripes" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
      <rect width="5" height="10" fill="#fff" opacity=".22"/>
    </pattern>
    <linearGradient id="fadeGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
    </linearGradient>
    <mask id="fadeMask" maskUnits="userSpaceOnUse" x="0" y="${WY}" width="${VW}" height="${VH - WY}">
      <rect x="0" y="${WY}" width="${VW}" height="${VH - WY}" fill="url(#fadeGrad)"/>
    </mask>
    <filter id="hGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <path id="hFront" d="${front.join('')}"/>
  </defs>
  <path d="${back.join('')}" fill="#0d1436" opacity=".9"/>
  <use href="#hFront" fill="url(#hFill)" stroke="url(#hRim)" stroke-width="1"/>
  <path d="${br.truss}" fill="none" stroke="#2a3a80" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M${TOP[0]}Q${TOP[1]} ${TOP[2]}" fill="none" stroke="#9fd3ff" stroke-opacity=".35" stroke-width="1"/>
  <g fill="#ffcf6b">${steadyWin}</g>
  <path d="${tower.turret}" fill="#ffc55a" filter="url(#hGlow)"/>
  <path d="${sailsD}" fill="url(#sailWhite)" stroke="#5b5a86" stroke-width=".6"/>
  <path d="${ribsD}" fill="none" stroke="#7d7aa6" stroke-width=".6" opacity=".7"/>
  <g filter="url(#hGlow)">${deck}</g>
  <rect x="0" y="${WY}" width="${VW}" height="${VH - WY}" fill="url(#hWater)"/>
  <g mask="url(#fadeMask)">
    <g transform="${mirror}" opacity=".3">
      <path d="${sailsD}" fill="#d9dcff" opacity=".45"/>
      <path d="${tower.turret}" fill="#ffc55a"/>
      <path d="M${TOP[0]}Q${TOP[1]} ${TOP[2]}" fill="none" stroke="#ffe7a0" stroke-width="1.4" stroke-dasharray="2 4"/>
    </g>
    <g transform="${mirror}" fill="#ffcf6b" opacity=".22">${streaks}</g>
  </g>
  <g stroke="#b9c8ff" stroke-width=".8">${ripples}</g>`)
    + layer('city-lit', `<use href="#hFront" fill="url(#hLit)"/>`)
    + vivid('v1', 'vPink')
    + vivid('v2', 'vBlue', `<path d="${sailsD}" fill="url(#vStripes)"/><path d="${ribsD}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".7"/>`)
    + vivid('v3', 'vGold')
    + layer('city-lights a', `<g fill="#ffcf6b">${twA}</g><g fill="#fff1c2" filter="url(#hGlow)">${lightsA}</g>`)
    + layer('city-lights b', `<g fill="#ffcf6b">${twB}</g><g fill="#fff1c2" filter="url(#hGlow)">${lightsB}</g>`);

  const base = el.querySelector('.city-base');
  const stop = el.querySelector('#hLitStop');
  return {
    lit: el.querySelector('.city-lit'),
    setLightColor(hex) { stop.setAttribute('stop-color', hex); stop.nextElementSibling.setAttribute('stop-color', hex); },
    /** viewBox point -> screen pixels (accounts for the slice crop) */
    toScreen(x, y) {
      const m = base.getScreenCTM();
      return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
    },
  };
}
