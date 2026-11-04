import './style.css';
import { gsap } from 'gsap';
import { createFireworks, PALETTES, MULTI, FLAME, GOLD } from './fireworks.js';
import { audio } from './audio.js';

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

function drawGarland() {
  const W = innerWidth;
  const n = Math.max(3, Math.round(W / 120));
  const sw = W / n, depth = Math.min(34, sw * .3), h = depth + 34;
  let html = '';
  for (let i = 0; i < n; i++) {
    const per = 15;
    for (let j = 0; j <= per; j++) {
      const t = j / per, x = (i * sw + t * sw).toFixed(1), y = 7 + depth * Math.sin(Math.PI * t);
      html += `<circle cx="${x}" cy="${y.toFixed(1)}" r="5.6" fill="url(#mg${j % 2 ? 1 : 2})"/>`;
      if (j % 3 === 1) {
        const ly = (y - 6).toFixed(1);
        html += `<ellipse cx="${x}" cy="${ly}" rx="2.4" ry="5" fill="#2f9e44" transform="rotate(${((t - .5) * 70).toFixed(0)} ${x} ${ly})"/>`;
      }
    }
    if (i > 0) {
      const x = (i * sw).toFixed(1);
      html += `<line x1="${x}" y1="10" x2="${x}" y2="${h - 12}" stroke="#ffd166" stroke-width="1.4"/>` +
        `<path d="M${x - 5} ${h - 12} h10 l-2 9 h-6z" fill="#ffb703"/><circle cx="${x}" cy="${h - 2}" r="2" fill="#ffe08a"/>`;
    }
  }
  const svg = $('#garland');
  svg.setAttribute('viewBox', `0 0 ${W} ${h}`);
  svg.style.height = h + 'px';
  $('#garland-g').innerHTML = html;
}

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
  drawGarland();
  addEventListener('resize', drawGarland);

  const fx = await createFireworks($('#fx'), { quality: Q });

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
    const r = btn.getBoundingClientRect();
    $$('.name').forEach((b) => b.classList.add(b === btn ? 'chosen' : 'gone'));

    const el = document.createElement('div');
    el.className = 'rocket';
    el.textContent = name;
    el.style.setProperty('--c1', btn.style.getPropertyValue('--c1'));
    el.style.setProperty('--c2', btn.style.getPropertyValue('--c2'));
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

    gsap.fromTo('.g-diya', { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: .8, ease: 'back.out(2.5)' });
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
    later(2600, startGame);
    startShow('party');
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
    playing = false;
    document.body.classList.remove('game');
    gsap.killTweensOf('.ch, .reveal, .g-diya, .flame-wrap, .halo, #g-hint');
    gsap.to('.flame-wrap', { scale: 1, duration: .5, ease: 'back.out(2)' });
    gsap.to('.halo', { opacity: 1, duration: .5 });
    diyaBtns.forEach((b) => b.classList.remove('out'));
    greet.classList.add('hidden');
    $$('.name').forEach((b) => b.classList.remove('chosen', 'gone'));
    chooser.classList.remove('hidden');
    fx.setEmbers(true);
    busy = false;
    startShow('ambient');
  }

  /* ---------------- Wiring ---------------- */
  $$('.name').forEach((b) => b.addEventListener('click', () => choose(b)));
  diyaBtns.forEach((b) => b.addEventListener('click', () => lightDiya(b)));
  $('#again').addEventListener('click', reset);
  greet.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    audio.unlock();
    fx.launchShell(e.clientX, Math.min(e.clientY, fx.height * .7), { n: 120, flash: 60 });
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
