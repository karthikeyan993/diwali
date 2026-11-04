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

/** Kapaleeshwarar-style gopuram: stone base with a lit doorway, nine stepped tiers lined with
 *  sculpture silhouettes and corner mini-shrines, a barrel-vault crown with horns and kalasams,
 *  and festival serial lights running up its edges. */
const lights = [];
const door = [];
function gopuram(cx) {
  const d = [];
  // plinth + base storey
  d.push(R(cx - 84, 296, 168, 24), R(cx - 80, 292, 160, 4), R(cx - 76, 258, 152, 34), R(cx - 80, 254, 160, 4));
  for (let x = cx - 72; x <= cx + 72; x += 12) if (Math.abs(x - cx) > 18) d.push(R(x - 1.5, 262, 3, 28)); // pilaster hint
  door.push(`M${cx - 12} 320V284Q${cx - 12} 270 ${cx} 267Q${cx + 12} 270 ${cx + 12} 284V320Z`);

  const n = 9, yb0 = 254, top = 104, th = (yb0 - top) / n;
  let hb = 74;
  for (let i = 0; i < n; i++) {
    const yb = yb0 - i * th, yt = yb - th;
    const ht = hb - 2;
    // tier body with a cornice ledge
    d.push(P([cx - hb - 4, yb], [cx + hb + 4, yb], [cx + hb + 4, yb - 2.6], [cx + ht, yt + 1], [cx - ht, yt + 1], [cx - hb - 4, yb - 2.6]));
    // sculpture figures along the top edge
    for (let x = cx - ht + 6; x <= cx + ht - 6; x += 6.5) {
      const h = 2.2 + ((x * 13) % 3) * .6;
      d.push(`M${f(x - 1.6)} ${f(yt + 1)}v${f(-h + 1)}q1.6 -2 3.2 0v${f(h - 1)}z`);
    }
    // corner mini-shrines (kudu) stand out on the silhouette
    for (const sx of [-1, 1]) {
      const x = cx + sx * (ht - 2);
      d.push(R(x - 2.6, yt - 3, 5.2, 4), `M${f(x - 3.4)} ${f(yt - 3)}Q${f(x)} ${f(yt - 8)} ${f(x + 3.4)} ${f(yt - 3)}Z`);
    }
    // central arched opening, lit
    windows.push([cx - 2.5, yt + th * .32, 5, Math.min(9, th * .55), .95]);
    if (i < 6) for (const sx of [-1, 1]) win(cx + sx * hb * .5 - 1.5, yt + th * .45, 3, 5, .55);
    // serial lights down both slopes
    for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) lights.push([cx + sx * lerp(hb + 3, ht, k / 2), lerp(yb - 3, yt + 1, k / 2)]);
    hb = ht - 2.6;
  }
  // barrel-vault crown (shala) with kirtimukha horns
  const cy = top;
  d.push(`M${cx - 34} ${cy}V${cy - 8}Q${cx - 34} ${cy - 20} ${cx - 24} ${cy - 22}H${cx + 24}Q${cx + 34} ${cy - 20} ${cx + 34} ${cy - 8}V${cy}Z`);
  d.push(`M${cx - 34} ${cy - 12}q-10 -5 -7 -16l3 1.5q-2 7 4 10z`, `M${cx + 34} ${cy - 12}q10 -5 7 -16l-3 1.5q2 7 -4 10z`);
  windows.push([cx - 4, cy - 15, 8, 9, .95]);
  for (let k = -3; k <= 3; k++) {
    const x = cx + k * 8.4, y = cy - 22;
    d.push(`M${x - 3} ${y}q-.6 -5 3 -6.5q3.6 1.5 3 6.5z`, R(x - .7, y - 13, 1.4, 7), `M${x - 1.6} ${y - 6.5}a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0`);
    lights.push([x, y - 14]);
  }
  for (let x = cx - 30; x <= cx + 30; x += 6) lights.push([x, cy - 22.5]);
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
  windows.length = 0; lights.length = 0; door.length = 0;
  seed = 7;
  const back = fillers();
  const g = gopuram(600);
  const c = central(818);
  const l = lighthouse(985);
  const s = santhome(1110);
  const front = [...ripon(150), ...lic(380), ...g, ...c.d, ...l.d, ...s.d];
  // Everything is drawn once. Anything that changes over time lives in its own overlay <svg>
  // whose CSS opacity is animated, so the browser only re-composites and never re-paints the city.
  const dot = ([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="1.15"/>`;
  const lightsA = lights.filter((_, i) => i % 2 === 0).map(dot).join('');
  const lightsB = lights.filter((_, i) => i % 2 === 1).map(dot).join('');
  const rect = ([x, y, w, h, r]) => `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" rx=".6" opacity="${f(.35 + r * .55)}"/>`;
  const steadyWin = windows.filter((w) => w[4] <= .82).map(rect).join('');
  // twinkling windows ride on the two serial-light layers, so there are only three layers in total
  const twinkle = windows.filter((w) => w[4] > .82);
  const twinkleA = twinkle.filter((_, i) => i % 2 === 0).map(rect).join('');
  const twinkleB = twinkle.filter((_, i) => i % 2 === 1).map(rect).join('');
  const layer = (cls, body) => `<svg class="${cls}" viewBox="0 0 1200 ${G}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

  el.innerHTML = layer('city-base', `
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
    <linearGradient id="doorGrad" gradientUnits="userSpaceOnUse" x1="0" y1="266" x2="0" y2="${G}">
      <stop offset="0" stop-color="#ffd27a"/><stop offset=".6" stop-color="#ff9a3c"/><stop offset="1" stop-color="#c2521c"/>
    </linearGradient>
    <filter id="cityGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <path id="cityFront" d="${front.join('')}"/>
  </defs>
  <path d="${back.join('')}" fill="#120b30" opacity=".85"/>
  <use href="#cityFront" fill="url(#cityFill)" stroke="url(#cityRim)" stroke-width="1.1"/>
  <g fill="#ffcf6b">${steadyWin}</g>
  <path d="${door.join('')}" fill="url(#doorGrad)" filter="url(#cityGlow)" opacity=".9"/>
  <g filter="url(#cityGlow)">
    <circle cx="${c.clock[0]}" cy="${c.clock[1]}" r="9" fill="#ffe9b0" opacity=".9"/>
    <circle cx="${s.rose[0]}" cy="${s.rose[1]}" r="5" fill="#ffb3d9" opacity=".7"/>
    <rect x="${l.lamp[0] - 6}" y="${l.lamp[1] - 7}" width="12" height="13" fill="#fff1c2"/>
  </g>`)
    + layer('city-lit', `<use href="#cityFront" fill="url(#cityLit)"/>`)
    + layer('city-lights a', `<g fill="#ffcf6b">${twinkleA}</g><g fill="#ffe7a0" filter="url(#cityGlow)">${lightsA}</g>`)
    + layer('city-lights b', `<g fill="#ffcf6b">${twinkleB}</g><g fill="#ffe7a0" filter="url(#cityGlow)">${lightsB}</g>`);

  const stop = el.querySelector('#cityLitStop');
  return {
    lit: el.querySelector('.city-lit'),
    setLightColor(hex) { stop.setAttribute('stop-color', hex); stop.nextElementSibling.setAttribute('stop-color', hex); },
  };
}
