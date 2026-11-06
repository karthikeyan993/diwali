// Chennai by night from the Marina: a subtle monochrome skyline with a warm rim light, the sand of
// Marina beach with the lighthouse and catamarans, then the sea with reflections.
// viewBox is 1200 x VH (city ground at y = 320, sea from WY); it is sliced from the bottom-centre,
// so on phones the middle landmarks (Central, gopuram, lighthouse) stay in view.

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

/** Marina lighthouse: a tall tapering tower standing on the beach, with a viewing gallery and a lit lantern */
function lighthouse(cx, base) {
  const d = [
    R(cx - 20, base - 8, 40, 8), R(cx - 16, base - 14, 32, 6),           // stepped plinth on the sand
    P([cx - 12, base - 14], [cx - 7, 96], [cx + 7, 96], [cx + 12, base - 14]), // shaft
    R(cx - 13, 90, 26, 6), R(cx - 11, 82, 22, 2),                       // viewing gallery + rail
    R(cx - 6, 66, 12, 16),                                             // lantern room
    `M${cx - 8} 66Q${cx} 54 ${cx + 8} 66Z`, R(cx - .6, 46, 1.2, 10),      // dome + vane
  ];
  for (let x = cx - 11; x <= cx + 11; x += 3.6) d.push(R(x - .4, 84, .8, 6)); // gallery posts
  for (let y = 120; y < base - 30; y += 24) win(cx - 1.2, y, 2.4, 6, .9);    // slit windows up the stair
  // fluting down the shaft
  const flutes = `M${cx - 3.5} 98L${cx - 6} ${base - 14}M${cx + 3.5} 98L${cx + 6} ${base - 14}`;
  return { d, flutes, lamp: [cx, 74] };
}

/** Kattumaram catamarans pulled up on the sand */
function catamaran(x, y, s = 1) {
  return `M${f(x - 16 * s)} ${f(y - 2 * s)}Q${f(x)} ${f(y + 3 * s)} ${f(x + 18 * s)} ${f(y - 5 * s)}L${f(x + 15 * s)} ${f(y)}Q${f(x)} ${f(y + 4 * s)} ${f(x - 14 * s)} ${f(y + 1 * s)}Z`
    + `M${f(x - 2 * s)} ${f(y - 1 * s)}L${f(x + 1 * s)} ${f(y - 15 * s)}L${f(x + 2.2 * s)} ${f(y - 15 * s)}L${f(x + 1 * s)} ${f(y - 1 * s)}Z`;
}

/** LIC building */
function lic(cx) {
  const d = [R(cx - 28, 132, 56, 188), R(cx - 20, 122, 40, 10), R(cx - 1, 90, 2, 32)];
  for (let r = 0; r < 16; r++) {
    const litFloor = rnd() < .28;
    for (let c = 0; c < 5; c++) win(cx - 22 + c * 9.5, 140 + r * 11, 4, 5, litFloor ? .85 : .08);
  }
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

/** Coconut palms along the riverbank */
function palm(x, h, lean) {
  const top = [x + lean, G - h];
  let d = `M${x} ${G}Q${f(x + lean * .25)} ${f(G - h * .55)} ${f(top[0])} ${f(top[1])}`;
  for (const [ang, len] of [[-170, 30], [-140, 34], [-110, 26], [-70, 26], [-40, 34], [-10, 30], [-90, 18]]) {
    const a = ang * Math.PI / 180, ex = top[0] + Math.cos(a) * len, ey = top[1] + Math.sin(a) * len * .55 + len * .35;
    const cx = top[0] + Math.cos(a) * len * .5, cy = top[1] + Math.sin(a) * len * .5 - 6;
    d += `M${f(top[0])} ${f(top[1])}Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}`;
  }
  return d;
}

/* ---------- Napier Bridge: lit bow arches over the Cooum where it meets the sea, at the end of the Marina ---------- */
const NB0 = 1010, NBN = 2;
export const DECK = { x0: NB0 + 4, x1: NB0 + NBN * 100, y: 309 };
function napier() {
  let arches = '', hangers = '';
  const solid = [R(NB0, 304, NBN * 100 + 4, 5)];
  const lights = [];
  const COLS = ['#ffd166', '#ff5fa2', '#5ce1ff', '#7dff6a'];
  for (let i = 0; i < NBN; i++) {
    const x0 = NB0 + i * 100;
    arches += `M${x0 + 4} 304Q${x0 + 50} 258 ${x0 + 96} 304`;
    solid.push(R(x0 - 1, 309, 4, G - 309));
    for (let k = 1; k < 8; k++) {
      const t = k / 8, ax = (1 - t) ** 2 * (x0 + 4) + 2 * (1 - t) * t * (x0 + 50) + t * t * (x0 + 96);
      const ay = (1 - t) ** 2 * 304 + 2 * (1 - t) * t * 258 + t * t * 304;
      hangers += `M${f(ax)} ${f(ay)}V304`;
    }
    for (let k = 1; k < 10; k++) {
      const t = k / 10;
      lights.push([(1 - t) ** 2 * (x0 + 4) + 2 * (1 - t) * t * (x0 + 50) + t * t * (x0 + 96), (1 - t) ** 2 * 304 + 2 * (1 - t) * t * 258 + t * t * 304, COLS[(i + k) % 4]]);
    }
  }
  solid.push(R(NB0 + NBN * 100, 309, 4, G - 309));
  return { solid, arches, hangers, lights, rail: `M${NB0} 301H${NB0 + NBN * 100 + 4}` };
}

/* ---------- a lit country boat drifting along the river (its own layer, slides on the GPU) ---------- */
function boat(cx, y) {
  return `
    <path d="M${cx - 26} ${y}Q${cx} ${y + 9} ${cx + 26} ${y}L${cx + 30} ${y - 4}H${cx - 30}Z" fill="#2a1406"/>
    <path d="M${cx - 2} ${y - 4}V${y - 26}" stroke="#2a1406" stroke-width="1.6"/>
    <path d="M${cx - 1} ${y - 25}L${cx + 16} ${y - 8}H${cx - 1}Z" fill="#3a1d3a" opacity=".8"/>
    <circle cx="${cx - 14}" cy="${y - 8}" r="2.2" fill="#ffcf6b" filter="url(#cityGlow)"/>
    <g transform="translate(0 ${2 * y + 6}) scale(1 -1)" opacity=".3"><circle cx="${cx - 14}" cy="${y - 8}" r="2.2" fill="#ffcf6b"/></g>`;
}

export const VH = 452, WY = 354; // Marina sand from the city's ground (G) down to the sea (WY)
const SAND_END = 1000;            // the beach ends at the Cooum mouth

export function buildSkyline(el) {
  windows.length = 0; lights.length = 0; door.length = 0;
  seed = 7;
  const back = fillers();
  const CC = 430, GC = 625, LC = 805;
  const g = gopuram(GC);
  const c = central(CC);
  const l = lighthouse(LC, WY - 6);
  const s = santhome(1000);
  const nb = napier();
  const front = [...ripon(90), ...lic(255), ...g, ...c.d, ...s.d, ...l.d];
  const gopD = g.join('');
  const palms = [palm(160, 88, 10), palm(318, 78, -8), palm(728, 70, 9), palm(905, 90, -10)].join('');

  // Chennai Central detail: string courses and pilasters across the red-brick front
  let centralDetail = `M${CC - 95} 262H${CC + 95}M${CC - 95} 282H${CC + 95}`;
  for (let x = CC - 89; x < CC + 95; x += 12) centralDetail += `M${x} 256V320`;

  // Marina beach: the sand's front edge laps in gentle curves, and ends at the river mouth
  let sand = `M-10 ${G}H${SAND_END}`;
  sand += `C${SAND_END + 6} ${G + 8} ${SAND_END - 14} ${WY - 6} ${SAND_END - 4} ${WY}`;
  for (let x = SAND_END - 4, k = 0; x > -10; x -= 40, k++) sand += `Q${f(x - 20)} ${f(WY + (k % 2 ? 2 : -1.2))} ${f(x - 40)} ${WY}`;
  sand += 'Z';
  // foam lines where the waves reach the sand, and a second, fainter line further out
  let foam = '', foam2 = '';
  for (let x = -10; x < SAND_END; x += 26 + rnd() * 30) {
    const len = 14 + rnd() * 34;
    foam += `M${f(x)} ${f(WY + 1.2)}q${f(len / 2)} ${f(1.4 + rnd())} ${f(len)} 0`;
    if (rnd() < .6) foam2 += `M${f(x + 10)} ${f(WY + 7 + rnd() * 3)}q${f(len / 2)} ${f(1.2)} ${f(len * 1.2)} 0`;
  }
  // beach road lamps along the Marina, and catamarans on the sand
  const lamps = [360, 515, 715, 880, 960].map((x) => [x, G - 22]);
  const lampPoles = lamps.map(([x, y]) => R(x - .5, y, 1, G + 2 - y)).join('');
  const boats = catamaran(372, G + 17, 1.3) + catamaran(490, G + 24, 1.5) + catamaran(915, G + 18, 1.2) + catamaran(712, G + 26, 1.3);

  const dot = ([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="1.15"/>`;
  const lightsA = lights.filter((_, i) => i % 2 === 0).map(dot).join('');
  const lightsB = lights.filter((_, i) => i % 2 === 1).map(dot).join('');
  const bridgeDot = ([x, y, col]) => `<circle cx="${f(x)}" cy="${f(y)}" r="1.5" fill="${col}"/>`;
  const bridgeA = nb.lights.filter((_, i) => i % 2 === 0).map(bridgeDot).join('');
  const bridgeB = nb.lights.filter((_, i) => i % 2 === 1).map(bridgeDot).join('');
  const rect = ([x, y, w, h, r]) => `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" rx=".6" opacity="${f(.35 + r * .55)}"/>`;
  const steadyWin = windows.filter((w) => w[4] <= .82).map(rect).join('');
  // twinkling windows ride on the two serial-light layers, so there are only a few layers in total
  const twinkle = windows.filter((w) => w[4] > .82);
  const twinkleA = twinkle.filter((_, i) => i % 2 === 0).map(rect).join('');
  const twinkleB = twinkle.filter((_, i) => i % 2 === 1).map(rect).join('');

  // the river: reflections of the lights, squashed and fading with depth, plus ripples
  const mirror = `translate(0 ${f(WY + G * .8)}) scale(1 -0.8)`; // city base (G) lands on the waterline (WY)
  const streaks = windows.filter((w) => w[4] > .5).map(([x, y, w, h]) => `<rect x="${f(x)}" y="${f(y - h * 2)}" width="${w}" height="${f(h * 3)}"/>`).join('');
  let ripples = '';
  for (let i = 0; i < 46; i++) {
    const y = WY + 4 + rnd() * (VH - WY - 6), x = rnd() * 1200, len = 18 + rnd() * 70;
    ripples += `<path d="M${f(x)} ${f(y)}h${f(len)}" stroke-opacity="${f(.05 + rnd() * .12)}"/>`;
  }

  const layer = (cls, body) => `<svg class="${cls}" viewBox="0 0 1200 ${VH}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
  // festival colour washes on the gopuram (cross-faded with CSS opacity), reflected in the river
  const vivid = (cls, grad) => layer(`vivid ${cls}`, `
    <path d="${gopD}" fill="url(#${grad})"/>
    <path d="${gopD}" fill="url(#${grad})" transform="${mirror}" opacity=".14" mask="url(#fadeMask)"/>`);

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
    <linearGradient id="river" gradientUnits="userSpaceOnUse" x1="0" y1="${WY}" x2="0" y2="${VH}"><stop offset="0" stop-color="#1a1046"/><stop offset="1" stop-color="#04020c"/></linearGradient>
    <linearGradient id="sand" gradientUnits="userSpaceOnUse" x1="0" y1="${G}" x2="0" y2="${WY}"><stop offset="0" stop-color="#2a1a3c"/><stop offset="1" stop-color="#4d3350"/></linearGradient>
    <radialGradient id="sandGlow"><stop offset="0" stop-color="#ffb35c" stop-opacity=".42"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>
    <radialGradient id="lampGlow"><stop offset="0" stop-color="#fff1c2" stop-opacity=".7"/><stop offset="1" stop-color="#fff1c2" stop-opacity="0"/></radialGradient>
    <linearGradient id="gSaffron" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="${G}">
      <stop offset="0" stop-color="#ffe27a" stop-opacity=".9"/><stop offset=".5" stop-color="#ff8c1a" stop-opacity=".75"/><stop offset="1" stop-color="#ff3d6e" stop-opacity=".45"/>
    </linearGradient>
    <linearGradient id="gMagenta" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="${G}">
      <stop offset="0" stop-color="#ff9bd2" stop-opacity=".9"/><stop offset=".5" stop-color="#d93fae" stop-opacity=".75"/><stop offset="1" stop-color="#7b3cff" stop-opacity=".45"/>
    </linearGradient>
    <linearGradient id="gGreen" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="${G}">
      <stop offset="0" stop-color="#b8ffd0" stop-opacity=".9"/><stop offset=".5" stop-color="#2ee6a5" stop-opacity=".7"/><stop offset="1" stop-color="#1f8fff" stop-opacity=".45"/>
    </linearGradient>
    <linearGradient id="fadeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <mask id="fadeMask" maskUnits="userSpaceOnUse" x="0" y="${WY}" width="1200" height="${VH - WY}">
      <rect x="0" y="${WY}" width="1200" height="${VH - WY}" fill="url(#fadeGrad)"/>
    </mask>
    <filter id="cityGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <path id="cityFront" d="${front.join('')}"/>
  </defs>
  <path d="${back.join('')}" fill="#120b30" opacity=".85"/>
  <rect x="0" y="${G}" width="1200" height="${VH - G}" fill="url(#river)"/>
  <path d="${sand}" fill="url(#sand)"/>
  <ellipse cx="${GC}" cy="${G + 10}" rx="80" ry="18" fill="url(#sandGlow)"/>
  ${lamps.map(([x]) => `<ellipse cx="${x}" cy="${G + 10}" rx="44" ry="12" fill="url(#sandGlow)" opacity=".7"/>`).join('')}
  <path d="${lampPoles}" fill="#140a2c"/>
  <path d="${boats}" fill="#0c0620"/>
  <use href="#cityFront" fill="url(#cityFill)" stroke="url(#cityRim)" stroke-width="1.1"/>
  <path d="${centralDetail}" stroke="#3a2a70" stroke-width=".6" opacity=".7"/>
  <path d="${l.flutes}" stroke="#3a2c80" stroke-width=".8"/>
  <g fill="#ffcf6b">${steadyWin}</g>
  <path d="${door.join('')}" fill="url(#doorGrad)" filter="url(#cityGlow)" opacity=".9"/>
  <g filter="url(#cityGlow)">
    <circle cx="${c.clock[0]}" cy="${c.clock[1]}" r="9" fill="#ffe9b0" opacity=".9"/>
    <circle cx="${s.rose[0]}" cy="${s.rose[1]}" r="5" fill="#ffb3d9" opacity=".7"/>
    <rect x="${l.lamp[0] - 5}" y="${l.lamp[1] - 7}" width="10" height="14" fill="#fff6d8"/>
    <circle cx="${l.lamp[0]}" cy="${l.lamp[1]}" r="14" fill="url(#lampGlow)"/>
    <rect x="${LC - 12}" y="91" width="24" height="2" fill="#ffd27a" opacity=".85"/>
    ${lamps.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#ffe2a8"/>`).join('')}
  </g>
  <path d="${palms}" fill="none" stroke="#0a0618" stroke-width="2.6" stroke-linecap="round"/>
  <path d="${nb.solid.join('')}" fill="#1c1446"/>
  <path d="${nb.hangers}" stroke="#2c2266" stroke-width=".8"/>
  <path d="${nb.arches}${nb.rail}" fill="none" stroke="#3a2c80" stroke-width="2.4" stroke-linecap="round"/>
  <g mask="url(#fadeMask)">
    <g transform="${mirror}" opacity=".3">
      <path d="${door.join('')}" fill="#ff9a3c"/>
      <rect x="${LC - 3}" y="40" width="6" height="${G - 40}" fill="#fff1c2" opacity=".5"/>
    </g>
    <g transform="${mirror}" fill="#ffcf6b" opacity=".2">${streaks}</g>
  </g>
  <g stroke="#c9b8ff" stroke-width=".8">${ripples}</g>`)
    + layer('surf', `<path d="${foam}" fill="none" stroke="#e8e0ff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/><path d="${foam2}" fill="none" stroke="#c9b8ff" stroke-width="1" stroke-linecap="round" opacity=".3"/>`)
    + layer('city-lit', `<use href="#cityFront" fill="url(#cityLit)"/>`)
    + vivid('v1', 'gSaffron')
    + vivid('v2', 'gMagenta')
    + vivid('v3', 'gGreen')
    + layer('ferry', boat(560, WY + 36))
    + layer('city-lights a', `<g fill="#ffcf6b">${twinkleA}</g><g fill="#ffe7a0" filter="url(#cityGlow)">${lightsA}</g><g filter="url(#cityGlow)">${bridgeA}</g>`)
    + layer('city-lights b', `<g fill="#ffcf6b">${twinkleB}</g><g fill="#ffe7a0" filter="url(#cityGlow)">${lightsB}</g><g filter="url(#cityGlow)">${bridgeB}</g>`);

  // the lighthouse beam is a plain element that only scales, so its sweep stays on the GPU
  const beam = document.createElement('div');
  beam.className = 'beam';
  el.appendChild(beam);

  const base = el.querySelector('.city-base');
  const stop = el.querySelector('#cityLitStop');
  return {
    lit: el.querySelector('.city-lit'),
    setLightColor(hex) { stop.setAttribute('stop-color', hex); stop.nextElementSibling.setAttribute('stop-color', hex); },
    /** pin the beam to the lantern (call after layout and on resize) */
    placeBeam() {
      const m = base.getScreenCTM(), r = el.getBoundingClientRect();
      if (!m) return;
      beam.style.left = `${m.a * l.lamp[0] + m.e - r.left}px`;
      beam.style.top = `${m.d * l.lamp[1] + m.f - r.top}px`;
    },
    /** viewBox point -> screen pixels (accounts for the slice crop) */
    toScreen(x, y) {
      const m = base.getScreenCTM();
      return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
    },
  };
}
