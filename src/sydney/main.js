import '../shared/base.css';
import './style.css';
import { gsap } from 'gsap';
import { createFireworks, PALETTES } from '../shared/fireworks.js';
import { audio } from '../shared/audio.js';
import { createSky } from '../shared/sky.js';
import { flyName, bigBurst } from '../shared/rocket.js';
import { revealLetters, center } from '../shared/letters.js';
import { buildHarbour, WY, DECK, topChord, OPERA_TIP } from './harbour.js';

const NAME = 'Yashik';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const Q = RM ? 0.45 : 1;
const $ = (s) => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];

const startScreen = $('#start'), greet = $('#greet'), world = $('#world'), launchBtn = $('#launch');
const SPARKLE = [0x4ff0ff, 0xff6fc8, 0xffffff, 0xb9a6ff];
const SYD_SHELLS = [[0x4ff0ff, 0xffffff, 0x3b6bff], [0xff5fb8, 0xffffff, 0xb44dff], [0xffd166, 0xffffff, 0xff9f1c], ...PALETTES];

/** Foreground promenade: a stone edge, railing and glowing harbour lamps, drawn to the screen width */
function buildShore(el, W) {
  let posts = '', lamps = '';
  for (let x = 6; x < W; x += 22) posts += `M${x} 22V30`;
  for (let x = 40; x < W; x += 140) {
    lamps += `<rect x="${x - 1}" y="6" width="2" height="24" fill="#0b1230"/><circle cx="${x}" cy="6" r="3.2" fill="#fff1c2"/><circle cx="${x}" cy="6" r="11" fill="url(#lampGlow)"/>`;
  }
  el.innerHTML = `<svg viewBox="0 0 ${W} 52" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><radialGradient id="lampGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
    <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2150"/><stop offset="1" stop-color="#05081a"/></linearGradient></defs>
    <rect x="0" y="30" width="${W}" height="22" fill="url(#stone)"/>
    <rect x="0" y="30" width="${W}" height="1.2" fill="#6f86d6" opacity=".45"/>
    <path d="M0 22H${W}" stroke="#263066" stroke-width="1.6"/>
    <path d="${posts}" stroke="#263066" stroke-width="1.4"/>
    ${lamps}
  </svg>`;
}

function shake() {
  if (RM) return;
  world.classList.remove('shake');
  void world.offsetWidth;
  world.classList.add('shake');
}

async function main() {
  createSky($('#sky'), {
    reducedMotion: RM,
    beamColors: ['rgba(79,240,255,1)', 'rgba(155,92,255,1)', 'rgba(255,95,184,1)'],
    blobColors: ['rgba(79,240,255,1)', 'rgba(255,95,184,1)', 'rgba(123,92,255,1)', 'rgba(255,209,102,1)', 'rgba(59,107,255,1)'],
    starTop: .55,
  });

  const city = buildHarbour($('#harbour'));
  const drawShore = () => buildShore($('#shore'), innerWidth);
  drawShore();
  addEventListener('resize', drawShore);
  const waterY = () => city.toScreen(0, WY).y;

  // bursts wash the skyline in their colour (opacity-only, composited)
  const lightCity = (color, strength) => {
    const target = Math.min(.7, .15 + strength / 220);
    if (target < +gsap.getProperty(city.lit, 'opacity')) return;
    city.setLightColor('#' + color.toString(16).padStart(6, '0'));
    gsap.killTweensOf(city.lit);
    gsap.set(city.lit, { opacity: target });
    gsap.to(city.lit, { opacity: 0, duration: 1.6, ease: 'power2.out' });
  };

  const fx = await createFireworks($('#fx'), { quality: Q, onLight: lightCity, reflection: { y: waterY, alpha: .5 } });
  fx.setEmbers(false); // no embers rising out of the harbour

  /* ---------------- timers, idle calm ---------------- */
  const timers = [];
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  let showTimer = null, bridgeTimer = null;
  let lastInput = performance.now();
  const idle = () => performance.now() - lastInput > 45000;
  for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => { lastInput = performance.now(); }, { passive: true });

  /* ---------------- launch points: barges on the water and the bridge arch ---------------- */
  const barge = () => ({ x: rand(fx.width * .06, fx.width * .94), y: waterY() + rand(2, 8) });
  const arch = (t = rand(.12, .88)) => city.toScreen(...topChord(t));
  const sky = (lowFrac = .4) => ({ x: rand(fx.width * .1, fx.width * .9), y: rand(fx.height * .07, Math.min(fx.height * lowFrac, waterY() - 120)) });

  function shell(opts = {}) {
    const t = sky();
    fx.launchShell(t.x, t.y, { pal: pick(SYD_SHELLS), from: Math.random() < .35 ? arch() : barge(), ...opts });
  }

  /** The Harbour Bridge moment: a waterfall pours off the deck while shells fan out from the arch */
  function bridgeMoment() {
    const a = city.toScreen(DECK.x0, DECK.y), b = city.toScreen(DECK.x1, DECK.y);
    const x0 = Math.max(0, a.x), x1 = Math.min(fx.width, b.x);
    if (x1 - x0 > 40) fx.waterfall(x0, x1, a.y + 2, waterY(), 7);
    slots().forEach((x, i) => later(i * 150, () => fx.flowerPot(x, 6))); // the promenade joins in
    for (let i = 0; i < 7; i++) {
      later(400 + i * 320, () => {
        const from = arch(.12 + .76 * (i / 6));
        fx.launchShell(from.x + (i - 3) * fx.width * .05, rand(fx.height * .08, fx.height * .3), { from, pal: pick(SYD_SHELLS) });
      });
    }
  }

  /* ---------------- ground crackers on the promenade: flower pots, chakras, pops, ladi ---------------- */
  let groundTimer = null;
  const slots = () => [.1, .3, .5, .7, .9].map((s) => s * fx.width);
  function groundAct() {
    const W = fx.width, r = Math.random();
    if (r < .4) fx.flowerPot(pick(slots()));
    else if (r < .68) fx.chakra(rand(W * .15, W * .85));
    else if (r < .86) {
      const n = 3 + ((Math.random() * 4) | 0);
      for (let i = 0; i < n; i++) later(i * rand(120, 380), () => fx.pop(rand(W * .06, W * .94)));
    } else {
      const x = rand(W * .08, W * .4);
      fx.ladi(x, x + rand(W * .3, W * .5), 18);
    }
  }
  function startGround() {
    const W = fx.width;
    later(200, () => fx.flowerPot(W * .2));
    later(500, () => fx.flowerPot(W * .8));
    later(1100, () => fx.chakra(W * .5));
    const loop = () => { if (!document.hidden && !idle()) groundAct(); groundTimer = setTimeout(loop, rand(1700, 3200)); };
    groundTimer = setTimeout(loop, 3800);
  }

  function stopShow() {
    clearTimeout(showTimer);
    clearTimeout(bridgeTimer);
    clearTimeout(groundTimer);
    timers.splice(0).forEach(clearTimeout);
  }
  function startShow(mode) {
    stopShow();
    const party = mode === 'party';
    const go = () => {
      if (!document.hidden) shell(party ? {} : { silent: true, n: 70, speed: 5, flash: 40 });
      showTimer = setTimeout(go, party ? (idle() ? rand(3500, 5000) : rand(700, 1400) / Q) : rand(1800, 3000));
    };
    showTimer = setTimeout(go, party ? 1500 : 800);
    if (party) {
      const bridgeLoop = () => {
        if (!document.hidden && !idle()) bridgeMoment();
        bridgeTimer = setTimeout(bridgeLoop, rand(16000, 22000));
      };
      bridgeTimer = setTimeout(bridgeLoop, 1800);
    }
  }

  /* ---------------- Yashik's rocket rises from the Opera House ---------------- */
  let busy = false;
  async function lightUp() {
    if (busy) return;
    busy = true;
    audio.unlock();
    stopShow();

    const bc = center(launchBtn);
    fx.burst(bc.x, bc.y, { type: 'ring', n: 60, speed: 3.2, pal: [0x4ff0ff, 0xff5fb8, 0xffffff], flash: 60, trail: 0 });
    launchBtn.classList.add('fired');

    const tip = city.toScreen(...OPERA_TIP);
    const W = fx.width, H = fx.height;
    const { x, y } = await flyName(fx, {
      text: NAME, x: Math.min(Math.max(tip.x, 60), W - 60), y: Math.min(tip.y - 16, H - 60),
      fontSize: '1.7rem', fontFamily: "'Baloo 2', system-ui, sans-serif", c1: '#4ff0ff', c2: '#ff5fb8',
      target: { x: W / 2, y: Math.max(H * .22, 100) },
      reducedMotion: RM, quality: Q,
      onIgnite: () => startScreen.classList.add('hidden'),
    });
    bigBurst(fx, x, y, later);
    shake();
    later(380, revealGreeting);
  }

  function revealGreeting() {
    gsap.set('.reveal', { opacity: 0, y: 20 });
    greet.classList.remove('hidden');
    revealLetters(fx, $('#g-top'), $('#g-name'), 'Happy Diwali', NAME, SPARKLE);
    gsap.to('.reveal', { opacity: 1, y: 0, duration: .7, ease: 'power2.out', stagger: .2, delay: 1.7 });
    startShow('party');
    later(900, startGround);
  }

  function reset() {
    stopShow();
    fx.stopGround();
    greet.classList.add('hidden');
    launchBtn.classList.remove('fired');
    startScreen.classList.remove('hidden');
    busy = false;
    startShow('ambient');
  }

  /* ---------------- wiring ---------------- */
  launchBtn.addEventListener('click', lightUp);
  $('#again').addEventListener('click', reset);
  greet.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    audio.unlock();
    const ty = Math.min(e.clientY, waterY() - 60);
    fx.launchShell(e.clientX, ty, { from: { x: e.clientX + rand(-30, 30), y: waterY() + 4 }, pal: pick(SYD_SHELLS), n: 120, flash: 60 });
  });
  $('#sound').addEventListener('click', (e) => {
    audio.unlock();
    const on = audio.toggle();
    const b = e.currentTarget;
    b.textContent = on ? '🔊' : '🔇';
    b.setAttribute('aria-label', on ? 'Mute sound' : 'Turn sound on');
    b.setAttribute('aria-pressed', String(!on));
  });

  startShow('ambient');
}

main();
