// Chennai skyline as a subtle monochrome silhouette with a warm rim light.
// viewBox is 1200 x 320 (ground at y = 320); it is sliced from the bottom-centre,
// so on phones the middle landmarks (gopuram, Central, lighthouse) stay in view.

const G = 320; // ground
const f = (n) => +n.toFixed(1);
const R = (x, y, w, h) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
const P = (...pts) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';
const lerp = (a, b, t) => a + (b - a) * t;

// seeded random so the skyline looks the same on every load
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const windows = [];
const win = (x, y, w = 3, h = 4, p = .45) => { if (rnd() < p) windows.push([x, y, w, h, rnd()]); };

/** Kapaleeshwarar-style gopuram: stepped tiers, barrel-vault crown, kalasams */
function gopuram(cx) {
  const d = [R(cx - 62, 290, 124, 30)];
  const n = 7, yb0 = 290, top = 116, th = (yb0 - top) / n;
  for (let i = 0; i < n; i++) {
    const yb = yb0 - i * th, yt = yb - th;
    const hb = lerp(54, 22, i / n), ht = lerp(54, 22, (i + 1) / n);
    d.push(P([cx - hb - 3, yb], [cx + hb + 3, yb], [cx + hb + 3, yb - 3], [cx + ht, yt], [cx - ht, yt], [cx - hb - 3, yb - 3]));
    win(cx - 2, yt + th * .35, 4, 6, .9);
    if (i < 5) { win(cx - hb * .55, yt + th * .45, 3, 4, .5); win(cx + hb * .55 - 3, yt + th * .45, 3, 4, .5); }
  }
  d.push(`M${cx - 30} ${top}Q${cx - 34} ${top - 16} ${cx - 24} ${top - 20}H${cx + 24}Q${cx + 34} ${top - 16} ${cx + 30} ${top}Z`);
  d.push(`M${cx - 30} ${top - 10}q-9 -6 -5 -15l3 2q-2 6 3 9z`, `M${cx + 30} ${top - 10}q9 -6 5 -15l-3 2q2 6 -3 9z`);
  for (let k = -2; k <= 2; k++) {
    const x = cx + k * 10, y = top - 20;
    d.push(`M${x - 3} ${y}q0 -6 3 -8q3 2 3 8z`, R(x - .7, y - 13, 1.4, 6));
  }
  return d;
}

/** Chennai Central: red-brick block with a central clock tower and corner turrets */
function central(cx) {
  const d = [R(cx - 95, 254, 190, 66)];
  for (let x = cx - 95; x < cx + 95; x += 10) d.push(R(x, 250, 5, 4));
  for (const t of [cx - 88, cx + 88]) d.push(R(t - 9, 216, 18, 38), P([t - 11, 216], [t, 192], [t + 11, 216]), R(t - .6, 184, 1.2, 9));
  for (const t of [cx - 46, cx + 46]) d.push(R(t - 7, 230, 14, 24), P([t - 8, 230], [t, 215], [t + 8, 230]));
  d.push(R(cx - 20, 172, 40, 82), R(cx - 16, 150, 32, 22));
  d.push(`M${cx - 18} 150Q${cx - 18} 130 ${cx} 114Q${cx + 18} 130 ${cx + 18} 150Z`, R(cx - 1, 100, 2, 15));
  for (const t of [cx - 20, cx + 20]) d.push(P([t - 3, 172], [t, 158], [t + 3, 172]));
  for (let x = cx - 88; x < cx + 88; x += 12) {
    if (Math.abs(x - cx) < 24) continue;
    win(x, 264, 5, 8, .55); win(x, 288, 5, 8, .4);
  }
  win(cx - 3, 226, 6, 10, .9); win(cx - 3, 156, 6, 8, .9);
  return { d, clock: [cx, 192] };
}

/** Marina lighthouse */
function lighthouse(cx) {
  const d = [P([cx - 14, G], [cx - 8, 142], [cx + 8, 142], [cx + 14, G]), R(cx - 12, 134, 24, 8), R(cx - 7, 118, 14, 16), P([cx - 9, 118], [cx, 106], [cx + 9, 118])];
  for (let y = 160; y < 300; y += 26) win(cx - 1.5, y, 3, 5, .7);
  return { d, lamp: [cx, 126] };
}

/** LIC building */
function lic(cx) {
  const d = [R(cx - 28, 132, 56, 188), R(cx - 20, 122, 40, 10), R(cx - 1, 90, 2, 32)];
  for (let r = 0; r < 16; r++) for (let c = 0; c < 5; c++) win(cx - 22 + c * 9.5, 140 + r * 11, 4, 5, .3);
  return d;
}

/** San Thome basilica: gothic spire */
function santhome(cx) {
  const d = [P([cx - 50, G], [cx - 50, 252], [cx - 30, 234], [cx + 30, 234], [cx + 50, 252], [cx + 50, G]), R(cx - 11, 162, 22, 90), P([cx - 13, 162], [cx, 72], [cx + 13, 162]), R(cx - 1, 56, 2, 16), R(cx - 5, 61, 10, 2)];
  for (const t of [cx - 11, cx + 11]) d.push(P([t - 3, 162], [t, 146], [t + 3, 162]));
  for (let x = cx - 40; x < cx + 40; x += 11) if (Math.abs(x - cx) > 14) win(x, 270, 4, 10, .5);
  return { d, rose: [cx, 200] };
}

/** Ripon building: long body, central tower, small dome */
function ripon(cx) {
  const d = [R(cx - 70, 260, 140, 60), R(cx - 14, 202, 28, 58), R(cx - 10, 186, 20, 16), `M${cx - 12} 186Q${cx} 162 ${cx + 12} 186Z`, R(cx - .7, 158, 1.4, 10)];
  for (let x = cx - 64; x < cx + 64; x += 10) if (Math.abs(x - cx) > 16) { win(x, 270, 4, 7, .5); win(x, 290, 4, 7, .4); }
  return d;
}

/** Low background blocks filling the gaps */
function fillers() {
  const d = [];
  let x = -10;
  while (x < 1210) {
    const w = 22 + rnd() * 40, h = 30 + rnd() * 70;
    d.push(R(x, G - h, w, h));
    if (rnd() < .25) d.push(R(x + w / 2 - .6, G - h - 14, 1.2, 14));
    for (let wy = G - h + 8; wy < G - 8; wy += 10) for (let wx = x + 4; wx < x + w - 5; wx += 8) win(wx, wy, 3, 4, .12);
    x += w + rnd() * 6;
  }
  return d;
}

export function buildSkyline(el) {
  windows.length = 0;
  seed = 7;
  const back = fillers();
  const g = gopuram(420);
  const c = central(605);
  const l = lighthouse(785);
  const s = santhome(960);
  const front = [...ripon(120), ...lic(265), ...g, ...c.d, ...l.d, ...s.d];

  const winSvg = windows.map(([x, y, w, h, r]) =>
    `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" rx=".6" opacity="${f(.35 + r * .55)}"${r > .82 ? ` class="tw" style="animation-delay:${f(-r * 9)}s"` : ''}/>`).join('');

  el.innerHTML = `
<svg viewBox="0 0 1200 ${G}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="cityFill" gradientUnits="userSpaceOnUse" x1="0" y1="70" x2="0" y2="${G}">
      <stop offset="0" stop-color="#2b1d60"/><stop offset=".55" stop-color="#160e3a"/><stop offset="1" stop-color="#07041a"/>
    </linearGradient>
    <linearGradient id="cityRim" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="${G}">
      <stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset=".45" stop-color="#c58cff" stop-opacity=".25"/><stop offset="1" stop-color="#c58cff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="cityLit" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="${G}">
      <stop id="cityLitStop" offset="0" stop-color="#ffd166" stop-opacity=".85"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff1c2" stop-opacity=".55"/><stop offset="1" stop-color="#fff1c2" stop-opacity="0"/>
    </linearGradient>
    <filter id="cityGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <path id="cityFront" d="${front.join('')}"/>
  </defs>
  <path d="${back.join('')}" fill="#120b30" opacity=".85"/>
  <path class="beam-l" d="M${l.lamp[0]} ${l.lamp[1]}L${l.lamp[0] + 520} ${l.lamp[1] - 34}L${l.lamp[0] + 520} ${l.lamp[1] + 30}Z" fill="url(#beamGrad)"/>
  <use href="#cityFront" fill="url(#cityFill)" stroke="url(#cityRim)" stroke-width="1.1"/>
  <use id="cityLitLayer" href="#cityFront" fill="url(#cityLit)" opacity="0"/>
  <g class="city-windows" fill="#ffcf6b">${winSvg}</g>
  <g filter="url(#cityGlow)">
    <circle cx="${c.clock[0]}" cy="${c.clock[1]}" r="9" fill="#ffe9b0" opacity=".9"/>
    <circle cx="${s.rose[0]}" cy="${s.rose[1]}" r="5" fill="#ffb3d9" opacity=".7"/>
    <rect x="${l.lamp[0] - 6}" y="${l.lamp[1] - 7}" width="12" height="13" fill="#fff1c2" class="lamp"/>
  </g>
</svg>`;

  const stop = el.querySelector('#cityLitStop');
  return {
    lit: el.querySelector('#cityLitLayer'),
    setLightColor(hex) { stop.setAttribute('stop-color', hex); stop.nextElementSibling.setAttribute('stop-color', hex); },
  };
}
