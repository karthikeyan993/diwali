import '../shared/base.css';
import './style.css';
import { gsap } from 'gsap';
import { createFireworks, PALETTES, GOLD } from '../shared/fireworks.js';
import { audio } from '../shared/audio.js';
import { createSky } from '../shared/sky.js';
import { bigBurst } from '../shared/rocket.js';
import { createFuse } from '../shared/fuse.js';
import { revealLetters, center } from '../shared/letters.js';
import { buildSkyline, WY, DECK } from './skyline.js';
import { buildToran } from './toran.js';

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const Q = RM ? 0.45 : 1;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];

const chooser = $('#chooser'), greet = $('#greet'), world = $('#world'), hint = $('#g-hint');
const diyaBtns = $$('.diya-btn');

/* ---------------- Sky decoration ---------------- */
const hexNum = (c) => parseInt(c.trim().slice(1), 16);

const drawToran = () => buildToran($('#toran'), innerWidth);

/** Marina promenade: a stone edge, railing and glowing lamp posts, drawn to the screen width */
function buildShore(el, W) {
  let posts = '', lamps = '';
  for (let x = 6; x < W; x += 22) posts += `M${x} 22V30`;
  for (let x = 40; x < W; x += 140) {
    lamps += `<rect x="${x - 1}" y="6" width="2" height="24" fill="#140a26"/><circle cx="${x}" cy="6" r="3.2" fill="#ffe2a8"/><circle cx="${x}" cy="6" r="11" fill="url(#lampGlow)"/>`;
  }
  el.innerHTML = `<svg viewBox="0 0 ${W} 52" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><radialGradient id="lampGlow"><stop offset="0" stop-color="#ffc36b" stop-opacity=".55"/><stop offset="1" stop-color="#ffc36b" stop-opacity="0"/></radialGradient>
    <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a44"/><stop offset="1" stop-color="#0a0514"/></linearGradient></defs>
    <rect x="0" y="30" width="${W}" height="22" fill="url(#stone)"/>
    <rect x="0" y="30" width="${W}" height="1.2" fill="#c98bd6" opacity=".4"/>
    <path d="M0 22H${W}" stroke="#3a2456" stroke-width="1.6"/>
    <path d="${posts}" stroke="#3a2456" stroke-width="1.4"/>
    ${lamps}
  </svg>`;
}
const drawShore = () => buildShore($('#shore'), innerWidth);

function shake() {
  if (RM) return;
  world.classList.remove('shake');
  void world.offsetWidth;
  world.classList.add('shake');
}

async function main() {
  createSky($('#sky'), { reducedMotion: RM });
  drawToran();
  drawShore();
  addEventListener('resize', () => { drawToran(); drawShore(); });

  // Chennai skyline that catches the light of every burst
  const city = buildSkyline($('#skyline'));
  // the glow layer only changes CSS opacity, which the GPU composites without repainting the city
  const lightCity = (color, strength) => {
    const target = Math.min(.75, .18 + strength / 220);
    if (target < +gsap.getProperty(city.lit, 'opacity')) return;
    city.setLightColor('#' + color.toString(16).padStart(6, '0'));
    gsap.killTweensOf(city.lit);
    gsap.set(city.lit, { opacity: target });
    gsap.to(city.lit, { opacity: 0, duration: 1.6, ease: 'power2.out' });
  };

  let score = 0;
  const scoreEl = $('#score'), scoreN = $('#score-n');
  const onTargetBurst = () => {
    score++;
    scoreN.textContent = score;
    scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump');
    if (score % 10 === 0) { audio.chime(5); shake(); }
  };

  const waterY = () => city.toScreen(0, WY).y;
  const fx = await createFireworks($('#fx'), { quality: Q, onLight: lightCity, onTargetBurst, reflection: { y: waterY, alpha: .45 } });

  /* ---------------- Floating crackers game ---------------- */
  let targetTimer = null;
  function startTargets() {
    stopTargets();
    const loop = () => {
      if (!document.hidden && !idle() && fx.targetCount < 3) fx.spawnTarget();
      targetTimer = setTimeout(loop, rand(1100, 2200));
    };
    loop();
  }
  function stopTargets() { clearTimeout(targetTimer); }

  /* ---------------- Ground show: flower pots, chakras, tiny crackers ---------------- */
  let groundTimer = null;
  const slots = () => [.1, .27, .73, .9].map((s) => s * fx.width); // keep the temple doorway clear
  function groundAct() {
    const W = fx.width, r = Math.random();
    if (r < .38) fx.flowerPot(pick(slots()));
    else if (r < .68) fx.chakra(rand(W * .2, W * .8));
    else if (r < .85) {
      const n = 3 + ((Math.random() * 4) | 0);
      for (let i = 0; i < n; i++) later(i * rand(120, 380), () => fx.pop(rand(W * .08, W * .92)));
    } else {
      const x = rand(W * .1, W * .4);
      fx.ladi(x, x + rand(W * .3, W * .5), 18);
    }
  }
  function startGround() {
    stopGroundShow();
    const W = fx.width;
    later(300, () => fx.flowerPot(W * .2));
    later(700, () => fx.flowerPot(W * .8));
    later(1500, () => fx.chakra(W * .5));
    const loop = () => { if (!document.hidden && !idle()) groundAct(); groundTimer = setTimeout(loop, rand(1800, 3400)); };
    groundTimer = setTimeout(loop, 4200);
  }
  function stopGroundShow() { clearTimeout(groundTimer); }

  /* ---------------- Idle calm: ease off if nobody has touched the screen for a while ---------------- */
  let lastInput = performance.now();
  const idle = () => performance.now() - lastInput > 45000;
  for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => { lastInput = performance.now(); fx.setQuiet(false); }, { passive: true });
  // after a while without a touch, the background show carries on silently; a tap brings the sound back
  setInterval(() => fx.setQuiet(performance.now() - lastInput > 20000), 1000);

  /* ---------------- Background shows ---------------- */
  let showTimer = null;
  const timers = [];
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  /** Napier Bridge moment: a gold waterfall pours off the deck into the river, and the pots join in */
  let bridgeTimer = null;
  function bridgeMoment() {
    const a = city.toScreen(DECK.x0, DECK.y), b = city.toScreen(DECK.x1, DECK.y);
    const x0 = Math.max(0, a.x), x1 = Math.min(fx.width, b.x);
    if (x1 - x0 > 40) fx.waterfall(x0, x1, a.y + 1, waterY(), 7);
    slots().forEach((x, i) => later(i * 150, () => fx.flowerPot(x, 6)));
  }
  function stopShow() {
    clearTimeout(showTimer);
    clearTimeout(bridgeTimer);
    timers.splice(0).forEach(clearTimeout);
  }
  function startShow(mode) {
    clearTimeout(showTimer);
    clearTimeout(bridgeTimer);
    const party = mode === 'party';
    if (party) {
      const bridgeLoop = () => {
        if (!document.hidden && !idle()) bridgeMoment();
        bridgeTimer = setTimeout(bridgeLoop, rand(16000, 22000));
      };
      bridgeTimer = setTimeout(bridgeLoop, 2400);
    }
    const go = () => {
      if (!document.hidden) {
        const W = fx.width, H = fx.height;
        fx.launchShell(rand(W * .12, W * .88), rand(H * .08, H * (party ? .42 : .3)),
          party ? {} : { silent: true, n: 70, speed: 5, flash: 40 });
      }
      showTimer = setTimeout(go, party ? (idle() ? rand(3500, 5000) : rand(700, 1500) / Q) : rand(1800, 3200));
    };
    showTimer = setTimeout(go, party ? 1400 : 900);
  }

  /* ---------------- In the dark: pick a name, then light the fuse ---------------- */
  const title = $('#title');
  const fuse = createFuse(document.body);
  fuse.el.classList.add('away');
  let busy = false, chosenName = null;

  function setTitle(text) {
    gsap.fromTo(title, { opacity: 0, y: 14, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .5, ease: 'back.out(2)', onStart: () => { title.textContent = text; } });
  }

  function choose(btn) {
    if (busy || chosenName) return;
    audio.unlock();
    chosenName = btn.dataset.name;
    const c1 = btn.style.getPropertyValue('--c1'), c2 = btn.style.getPropertyValue('--c2');
    gsap.to(btn, { rotateX: 0, rotateY: 0, duration: .3 });
    $$('.player').forEach((b) => b.classList.add('gone'));

    // power-up: the little diya releases a ring of light
    const oc = center(btn.querySelector('.p-diya'));
    const pal = [hexNum(c1), hexNum(c2), 0xffffff];
    fx.burst(oc.x, oc.y, { type: 'ring', n: 60, speed: 3.2, pal, flash: 60, trail: 0 });
    fx.burst(oc.x, oc.y, { type: 'peony', n: 30, speed: 2, pal, flash: 0, trail: 0 });

    setTitle(`${chosenName}, ready?`);
    fuse.el.classList.remove('away');
  }

  // the fire runs along the fuse, the rocket flies, and its burst lights up Chennai
  async function lightUp() {
    if (busy || !chosenName) return;
    busy = true;
    audio.unlock();
    await fuse.light(fx);
    chooser.classList.add('hidden');
    const W = fx.width, H = fx.height;
    // a long climb: the rocket shrinks into the distance as it rises
    const { x, y } = await fuse.launch(fx, { x: W / 2, y: Math.max(H * .2, 90) }, { reducedMotion: RM, climb: 2.6, endScale: .32 });
    bigBurst(fx, x, y, later);
    shake();
    document.body.classList.add('lit');
    lightCity(0xffe0a0, 400);
    fx.setEmbers(true);
    later(260, () => revealGreeting(chosenName, { x, y }));
  }

  /* ---------------- Greeting ---------------- */
  function revealGreeting(name, from) {
    hint.innerHTML = '&nbsp;';
    gsap.set('.reveal', { opacity: 0, y: 20 });
    greet.classList.remove('hidden');
    revealLetters(fx, $('#g-top'), $('#g-name'), 'Happy Diwali', name, undefined, from);


    gsap.to('.reveal', { opacity: 1, y: 0, duration: .7, ease: 'power2.out', stagger: .2, delay: 1.7 });
    score = 0;
    scoreN.textContent = '0';
    later(2600, startGame);
    startShow('party');
    later(900, startGround);
    later(3200, startTargets);
  }

  /* ---------------- Mini-game: light the diyas ---------------- */
  let lit = 0, playing = false;
  // if nobody taps a diya for a few seconds, a finger points at the next one to light
  const diyaHint = document.createElement('span');
  diyaHint.className = 'diya-hint';
  diyaHint.setAttribute('aria-hidden', 'true');
  diyaHint.textContent = '👆';
  let hintTimer = null;
  function scheduleDiyaHint(delay = 4000) {
    clearTimeout(hintTimer);
    diyaHint.remove();
    if (!playing) return;
    hintTimer = setTimeout(() => {
      const next = diyaBtns.find((b) => b.classList.contains('out'));
      if (playing && next) next.appendChild(diyaHint);
    }, delay);
  }

  function startGame() {
    lit = 0;
    playing = true;
    diyaBtns.forEach((b) => { b.classList.add('out'); b.setAttribute('aria-label', b.getAttribute('aria-label').replace(/^Lit/, 'Light')); });
    gsap.to('.flame-wrap', { scale: 0, duration: .45, ease: 'back.in(2)', stagger: .08 });
    gsap.to('.halo', { opacity: 0, duration: .5, stagger: .08 });
    document.body.classList.add('game');
    setHint(`🪔 0 / ${diyaBtns.length}`);
    scheduleDiyaHint(3500);
  }

  function setHint(text) {
    gsap.fromTo(hint, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .35, onStart: () => { hint.textContent = text; } });
  }

  function lightDiya(btn) {
    if (!playing || !btn.classList.contains('out')) return;
    audio.unlock();
    btn.classList.remove('out');
    btn.setAttribute('aria-label', btn.getAttribute('aria-label').replace(/^Light/, 'Lit'));
    const step = lit++;
    gsap.fromTo(btn.querySelector('.flame-wrap'), { scale: 0 }, { scale: 1, duration: .9, ease: 'elastic.out(1.2, .4)' });
    gsap.to(btn.querySelector('.halo'), { opacity: 1, duration: .6 });
    const art = btn.querySelector('.diya');
    art.classList.remove('pop'); void art.getBoundingClientRect(); art.classList.add('pop');
    audio.chime(step);

    // sparkle fountain from the diya
    const c = center(btn.querySelector('.flame-wrap'));
    for (let i = 0; i < 40 * Q; i++) {
      fx.spark(c.x + rand(-3, 3), c.y, rand(-1.6, 1.6), rand(-8, -3.5) * fx.scale, pick(GOLD),
        { g: .16, f: .985, decay: rand(.015, .025), size: rand(1.3, 2.4), tw: true });
    }

    if (lit === diyaBtns.length) finale();
    else { setHint(`🪔 ${lit} / ${diyaBtns.length}`); scheduleDiyaHint(); }
  }

  function finale() {
    playing = false;
    scheduleDiyaHint();
    document.body.classList.remove('game');
    setHint('🎉');
    clearTimeout(showTimer);
    const W = fx.width, H = fx.height;
    const shots = RM ? 8 : 18;
    for (let i = 0; i < shots; i++) {
      later(i * 170, () => fx.launchShell(rand(W * .1, W * .9), rand(H * .08, H * .45)));
    }
    slots().forEach((x, i) => later(i * 120, () => fx.flowerPot(x, 6)));
    later(300, bridgeMoment);
    later(400, () => fx.chakra(W * .33));
    later(650, () => fx.chakra(W * .67));
    later(1200, () => fx.ladi(W * .06, W * .94, 30));
    later(shots * 170 + 900, () => {
      fx.burst(W / 2, H * .3, { type: 'heart', n: 160, pal: PALETTES[1], speed: 7, flash: 120 });
      fx.burst(W / 2, H * .3, { type: 'willow', n: 140, speed: 7, flash: 0 });
      audio.boom(true);
      shake();
    });
    later(shots * 170 + 2200, () => startShow('party'));
  }

  /* ---------------- Reset ---------------- */
  function reset() {
    audio.stopAll(); // cut every sound that is still playing or scheduled
    stopShow();
    stopGroundShow();
    stopTargets();
    fx.clearTargets();
    fx.stopGround();
    fx.clearPots();
    fx.clearSky();
    playing = false;
    scheduleDiyaHint();
    document.body.classList.remove('game');
    gsap.killTweensOf('.ch, .reveal, .flame-wrap, .halo, #g-hint');
    gsap.to('.flame-wrap', { scale: 1, duration: .5, ease: 'back.out(2)' });
    gsap.to('.halo', { opacity: 1, duration: .5 });
    diyaBtns.forEach((b) => b.classList.remove('out'));
    greet.classList.add('hidden');
    $$('.player').forEach((b) => b.classList.remove('chosen', 'gone'));
    // back to the dark, with a fresh fuse waiting for the next name
    document.body.classList.remove('lit');
    fuse.reset();
    fuse.el.classList.add('away');
    title.textContent = 'Who are you?';
    chooser.classList.remove('hidden');
    fx.setEmbers(false);
    chosenName = null;
    busy = false;
  }

  /* ---------------- Wiring ---------------- */
  $$('.player').forEach((card) => {
    // light follows the finger / cursor, and the card tilts toward it
    const track = (e) => {
      if (busy) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
      if (!RM) gsap.to(card, { rotateY: (px - .5) * 10, rotateX: (.5 - py) * 18, transformPerspective: 700, duration: .4, ease: 'power2.out' });
    };
    card.addEventListener('pointermove', track);
    card.addEventListener('pointerdown', track);
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: .8, ease: 'elastic.out(1, .5)' });
    });
    card.addEventListener('click', () => choose(card));
  });
  fuse.el.addEventListener('click', lightUp);
  diyaBtns.forEach((b) => b.addEventListener('click', () => lightDiya(b)));
  $('#again').addEventListener('click', reset);
  // tap the sky for a firework; touch (or swipe across) a floating cracker to burst it
  let pressing = false;
  greet.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    audio.unlock();
    pressing = true;
    if (!fx.hit(e.clientX, e.clientY)) fx.launchShell(e.clientX, Math.min(e.clientY, fx.height * .7), { n: 120, flash: 60, user: true });
  });
  greet.addEventListener('pointermove', (e) => { if (pressing || e.pointerType === 'mouse') fx.hit(e.clientX, e.clientY); });
  addEventListener('pointerup', () => { pressing = false; });
  addEventListener('pointercancel', () => { pressing = false; });
  $('#sound').addEventListener('click', (e) => {
    audio.unlock();
    const on = audio.toggle();
    const b = e.currentTarget;
    b.textContent = on ? '🔊' : '🔇';
    b.setAttribute('aria-label', on ? 'Mute sound' : 'Turn sound on');
    b.setAttribute('aria-pressed', String(!on));
  });

  // Chennai waits in the dark until a rocket is lit
  fx.setEmbers(false);
}

main();
