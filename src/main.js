import './style.css';
import { gsap } from 'gsap';
import { createFireworks, PALETTES, MULTI, FLAME, GOLD } from './fireworks.js';
import { audio } from './audio.js';
import { buildSkyline } from './skyline.js';
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
function makeStars() {
  const n = Math.round(Math.min(110, (innerWidth * innerHeight) / 5000));
  let html = '';
  for (let i = 0; i < n; i++) {
    html += `<i class="star" style="left:${rand(0, 100)}%;top:${rand(0, 72)}%;--s:${rand(1, 2.6).toFixed(1)}px;--d:${rand(2, 5).toFixed(1)}s;--delay:${rand(-5, 0).toFixed(1)}s"></i>`;
  }
  $('#stars').innerHTML = html;
}

function makeBokeh() {
  const colors = ['#ffcf6b', '#ff4f9a', '#7b5cff', '#3be8ff', '#ff9f1c'];
  let html = '';
  for (let i = 0; i < 9; i++) {
    html += `<i class="bokeh" style="left:${rand(-10, 90)}%;top:${rand(5, 85)}%;--s:${rand(50, 150).toFixed(0)}px;--c:${pick(colors)};--o:${rand(.12, .3).toFixed(2)};--t:${rand(10, 20).toFixed(0)}s;--delay:${rand(-20, 0).toFixed(0)}s;--dx:${rand(-60, 60).toFixed(0)}px;--dy:${rand(-80, 40).toFixed(0)}px"></i>`;
  }
  $('#bokeh').innerHTML = html;
}

const hexNum = (c) => parseInt(c.trim().slice(1), 16);

const drawToran = () => buildToran($('#toran'), innerWidth);

function shake() {
  if (RM) return;
  world.classList.remove('shake');
  void world.offsetWidth;
  world.classList.add('shake');
}

function splitInto(el, text) {
  el.innerHTML = '';
  el.setAttribute('aria-label', text);
  return [...text].map((ch, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--i', i);
    s.textContent = ch === ' ' ? ' ' : ch;
    el.appendChild(s);
    return s;
  });
}

const center = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

async function main() {
  makeStars();
  makeBokeh();
  drawToran();
  addEventListener('resize', drawToran);

  // Chennai skyline that catches the light of every burst
  const city = buildSkyline($('#skyline'));
  let cityGlow = { v: 0 };
  const lightCity = (color, strength) => {
    const target = Math.min(.75, .18 + strength / 220);
    if (target < cityGlow.v) return;
    city.setLightColor('#' + color.toString(16).padStart(6, '0'));
    gsap.killTweensOf(cityGlow);
    cityGlow.v = target;
    city.lit.setAttribute('opacity', target);
    gsap.to(cityGlow, { v: 0, duration: 1.6, ease: 'power2.out', onUpdate: () => city.lit.setAttribute('opacity', cityGlow.v.toFixed(3)) });
  };

  let score = 0;
  const scoreEl = $('#score'), scoreN = $('#score-n'), scoreLabel = $('#score-label');
  const onTargetBurst = () => {
    score++;
    scoreN.textContent = score;
    if (score === 1) scoreLabel.textContent = 'Burst';
    scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump');
    if (score % 10 === 0) { audio.chime(5); shake(); }
  };

  const fx = await createFireworks($('#fx'), { quality: Q, onLight: lightCity, onTargetBurst });

  /* ---------------- Floating crackers game ---------------- */
  let targetTimer = null;
  function startTargets() {
    stopTargets();
    const loop = () => {
      if (!document.hidden && fx.targetCount < 3) fx.spawnTarget();
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
    const loop = () => { if (!document.hidden) groundAct(); groundTimer = setTimeout(loop, rand(1800, 3400)); };
    groundTimer = setTimeout(loop, 4200);
  }
  function stopGroundShow() { clearTimeout(groundTimer); }

  /* ---------------- Background shows ---------------- */
  let showTimer = null;
  const timers = [];
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  function stopShow() {
    clearTimeout(showTimer);
    timers.splice(0).forEach(clearTimeout);
  }
  function startShow(mode) {
    clearTimeout(showTimer);
    const party = mode === 'party';
    const go = () => {
      if (!document.hidden) {
        const W = fx.width, H = fx.height;
        fx.launchShell(rand(W * .12, W * .88), rand(H * .08, H * (party ? .42 : .3)),
          party ? {} : { silent: true, n: 70, speed: 5, flash: 40 });
      }
      showTimer = setTimeout(go, party ? rand(700, 1500) / Q : rand(1800, 3200));
    };
    showTimer = setTimeout(go, party ? 1400 : 900);
  }

  /* ---------------- Choose a name → rocket → burst ---------------- */
  let busy = false;

  async function choose(btn) {
    if (busy) return;
    busy = true;
    audio.unlock();
    stopShow();
    fx.setEmbers(false);

    const name = btn.dataset.name;
    const label = btn.querySelector('.p-name');
    const r = label.getBoundingClientRect();
    const c1 = btn.style.getPropertyValue('--c1'), c2 = btn.style.getPropertyValue('--c2');
    gsap.to(btn, { rotateX: 0, rotateY: 0, duration: .3 });
    $$('.player').forEach((b) => b.classList.add(b === btn ? 'chosen' : 'gone'));

    // power-up: the little diya releases a ring of light
    const oc = center(btn.querySelector('.p-diya'));
    const pal = [hexNum(c1), hexNum(c2), 0xffffff];
    fx.burst(oc.x, oc.y, { type: 'ring', n: 60, speed: 3.2, pal, flash: 60, trail: 0 });
    fx.burst(oc.x, oc.y, { type: 'peony', n: 30, speed: 2, pal, flash: 0, trail: 0 });

    const el = document.createElement('div');
    el.className = 'rocket';
    el.textContent = name;
    el.style.fontSize = getComputedStyle(label).fontSize;
    el.style.setProperty('--c1', c1);
    el.style.setProperty('--c2', c2);
    document.body.appendChild(el);
    const ew = el.offsetWidth, eh = el.offsetHeight;
    const pos = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const place = (x, y, rotation = 0, scale = 1) => gsap.set(el, { x: x - ew / 2, y: y - eh / 2, rotation, scale });
    place(pos.x, pos.y);

    const W = fx.width, H = fx.height;
    const start = { ...pos }, target = { x: W / 2, y: Math.max(H * .27, 110) };
    const rumble = { j: 0 }, flight = { p: 0 };

    const tl = gsap.timeline();
    tl.add(() => chooser.classList.add('hidden'), .06)
      .add(() => el.classList.add('lit'), .06)
      // ignition: rumble and sparks
      .to(rumble, {
        j: 2.5, duration: RM ? .2 : .5, ease: 'power1.in',
        onUpdate() {
          const j = rumble.j;
          place(pos.x + rand(-j, j), pos.y + rand(-j, j));
          for (let i = 0; i < 3; i++) {
            fx.spark(pos.x + rand(-12, 12), pos.y + eh * .7, rand(-1.8, 1.8), rand(.5, 3), pick(FLAME),
              { decay: rand(.03, .05), g: .07, size: rand(1.3, 2.5), f: .97 });
          }
        },
      })
      .add(() => audio.whoosh(1.15, .2))
      // lift-off: slow start, fast climb, hang at the top
      .to(flight, {
        p: 1, duration: 1.15, ease: 'power3.inOut',
        onUpdate() {
          const p = flight.p;
          const nx = start.x + (target.x - start.x) * p + Math.sin(p * Math.PI * 3) * 9 * (1 - p);
          const dx = nx - pos.x;
          pos.x = nx;
          pos.y = start.y + (target.y - start.y) * p;
          place(pos.x, pos.y, gsap.utils.clamp(-14, 14, dx * 2.5), 1 - .12 * p);
          const n = 2 + Math.round(5 * Math.sin(p * Math.PI) * Q);
          for (let i = 0; i < n; i++) {
            fx.spark(pos.x + rand(-5, 5), pos.y + eh * .9, rand(-.9, .9), rand(1.5, 4), pick(FLAME),
              { decay: rand(.025, .045), g: .05, size: rand(1.4, 2.9), f: .97 });
          }
        },
      });
    await tl;
    el.remove();

    // the big burst
    const { x, y } = pos;
    fx.burst(x, y, { type: 'peony', n: 200, pal: MULTI, speed: 7.5, flash: 150, glitter: true, trail: 3 });
    fx.burst(x, y, { type: 'ring', n: 80, pal: PALETTES[0], speed: 4.5, flash: 0 });
    audio.boom(true);
    shake();
    try { navigator.vibrate?.([40, 30, 90]); } catch { /* unsupported */ }

    const side = Math.min(W * .3, 170);
    later(260, () => { fx.burst(x - side, y + rand(20, 60), { type: 'peony', n: 90, flash: 50 }); audio.boom(); });
    later(480, () => { fx.burst(x + side, y + rand(20, 60), { type: 'peony', n: 90, flash: 50 }); audio.boom(); });
    later(1000, () => { fx.burst(x, y + Math.min(H * .2, 160), { type: 'heart', n: 120, pal: PALETTES[1], speed: 5, flash: 50 }); audio.boom(); });

    later(380, () => revealGreeting(name));
  }

  /* ---------------- Greeting ---------------- */
  function revealGreeting(name) {
    const top = splitInto($('#g-top'), 'Happy Diwali');
    const letters = splitInto($('#g-name'), name + '!');
    hint.innerHTML = '&nbsp;';
    gsap.set('.reveal', { opacity: 0, y: 20 });
    greet.classList.remove('hidden');

    gsap.fromTo(top,
      { opacity: 0, scale: 2.6, y: -30, rotation: -12, filter: 'blur(10px)' },
      { opacity: 1, scale: 1, y: 0, rotation: 0, filter: 'blur(0px)', duration: .9, ease: 'back.out(2.2)', stagger: .055 });

    // the name's letters fly in from the burst, each popping a little firework where it lands
    gsap.fromTo(letters,
      { opacity: 0, scale: 0, x: () => rand(-90, 90), y: () => rand(-140, -40), rotation: () => rand(-120, 120) },
      {
        opacity: 1, scale: 1, x: 0, y: 0, rotation: 0, duration: 1.3, ease: 'elastic.out(1, .55)', delay: .45,
        stagger: {
          each: .09,
          onStart() {
            const c = center(this.targets()[0]);
            fx.burst(c.x, c.y, { type: 'peony', n: 22, speed: 2.4, flash: 22, pal: MULTI, trail: 0 });
          },
        },
      });

    gsap.to('.reveal', { opacity: 1, y: 0, duration: .7, ease: 'power2.out', stagger: .2, delay: 1.7 });
    score = 0;
    scoreN.textContent = '0';
    scoreLabel.textContent = 'Touch a cracker!';
    later(2600, startGame);
    startShow('party');
    later(900, startGround);
    later(3200, startTargets);
  }

  /* ---------------- Mini-game: light the diyas ---------------- */
  let lit = 0, playing = false;

  function startGame() {
    lit = 0;
    playing = true;
    diyaBtns.forEach((b) => { b.classList.add('out'); b.setAttribute('aria-label', b.getAttribute('aria-label').replace(/^Lit/, 'Light')); });
    gsap.to('.flame-wrap', { scale: 0, duration: .45, ease: 'back.in(2)', stagger: .08 });
    gsap.to('.halo', { opacity: 0, duration: .5, stagger: .08 });
    document.body.classList.add('game');
    setHint(`Tap the diyas to light them 🪔 0 / ${diyaBtns.length}`);
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
    gsap.fromTo(btn.querySelector('.diya'), { scale: 1.25 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
    audio.chime(step);

    // sparkle fountain from the diya
    const c = center(btn.querySelector('.flame-wrap'));
    for (let i = 0; i < 40 * Q; i++) {
      fx.spark(c.x + rand(-3, 3), c.y, rand(-1.6, 1.6), rand(-8, -3.5) * fx.scale, pick(GOLD),
        { g: .16, f: .985, decay: rand(.015, .025), size: rand(1.3, 2.4), tw: true });
    }

    if (lit === diyaBtns.length) finale();
    else setHint(`Tap the diyas to light them 🪔 ${lit} / ${diyaBtns.length}`);
  }

  function finale() {
    playing = false;
    document.body.classList.remove('game');
    setHint('Woohoo! All diyas lit! 🎉');
    clearTimeout(showTimer);
    const W = fx.width, H = fx.height;
    const shots = RM ? 8 : 18;
    for (let i = 0; i < shots; i++) {
      later(i * 170, () => fx.launchShell(rand(W * .1, W * .9), rand(H * .08, H * .45)));
    }
    slots().forEach((x, i) => later(i * 120, () => fx.flowerPot(x, 6)));
    later(400, () => fx.chakra(W * .33));
    later(650, () => fx.chakra(W * .67));
    later(1200, () => fx.ladi(W * .06, W * .94, 30));
    later(shots * 170 + 900, () => {
      fx.burst(W / 2, H * .3, { type: 'heart', n: 160, pal: PALETTES[1], speed: 7, flash: 120 });
      fx.burst(W / 2, H * .3, { type: 'willow', n: 140, speed: 7, flash: 0 });
      audio.boom(true);
      shake();
    });
    later(shots * 170 + 2200, () => { setHint('Tap the sky for more fireworks ✨'); startShow('party'); });
  }

  /* ---------------- Reset ---------------- */
  function reset() {
    stopShow();
    stopGroundShow();
    stopTargets();
    fx.clearTargets();
    fx.stopGround();
    playing = false;
    document.body.classList.remove('game');
    gsap.killTweensOf('.ch, .reveal, .flame-wrap, .halo, #g-hint');
    gsap.to('.flame-wrap', { scale: 1, duration: .5, ease: 'back.out(2)' });
    gsap.to('.halo', { opacity: 1, duration: .5 });
    diyaBtns.forEach((b) => b.classList.remove('out'));
    greet.classList.add('hidden');
    $$('.player').forEach((b) => b.classList.remove('chosen', 'gone'));
    chooser.classList.remove('hidden');
    fx.setEmbers(true);
    busy = false;
    startShow('ambient');
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
  diyaBtns.forEach((b) => b.addEventListener('click', () => lightDiya(b)));
  $('#again').addEventListener('click', reset);
  // tap the sky for a firework; touch (or swipe across) a floating cracker to burst it
  let pressing = false;
  greet.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    audio.unlock();
    pressing = true;
    if (!fx.hit(e.clientX, e.clientY)) fx.launchShell(e.clientX, Math.min(e.clientY, fx.height * .7), { n: 120, flash: 60 });
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

  startShow('ambient');
}

main();
