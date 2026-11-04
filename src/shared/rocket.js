// A name that ignites, rockets up into the sky and bursts. Shared by every themed page.
import { gsap } from 'gsap';
import { audio } from './audio.js';
import { MULTI, PALETTES, FLAME } from './fireworks.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];

/**
 * Fly `text` from (x, y) to `target` as a rocket. Resolves with the burst position.
 * `onIgnite` runs once the rocket is on screen (hide the source button there).
 */
export async function flyName(fx, { text, x, y, fontSize, fontFamily, c1, c2, target, reducedMotion = false, quality = 1, onIgnite }) {
  const el = document.createElement('div');
  el.className = 'rocket';
  el.textContent = text;
  if (fontSize) el.style.fontSize = fontSize;
  if (fontFamily) el.style.fontFamily = fontFamily;
  el.style.setProperty('--c1', c1);
  el.style.setProperty('--c2', c2);
  document.body.appendChild(el);
  const ew = el.offsetWidth, eh = el.offsetHeight;
  const pos = { x, y };
  const place = (px, py, rotation = 0, scale = 1) => gsap.set(el, { x: px - ew / 2, y: py - eh / 2, rotation, scale });
  place(x, y);

  const start = { x, y };
  const rumble = { j: 0 }, flight = { p: 0 };
  const tl = gsap.timeline();
  tl.add(() => { onIgnite?.(); el.classList.add('lit'); }, .06)
    // ignition: rumble and sparks
    .to(rumble, {
      j: 2.5, duration: reducedMotion ? .2 : .5, ease: 'power1.in',
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
        const n = 2 + Math.round(5 * Math.sin(p * Math.PI) * quality);
        for (let i = 0; i < n; i++) {
          fx.spark(pos.x + rand(-5, 5), pos.y + eh * .9, rand(-.9, .9), rand(1.5, 4), pick(FLAME),
            { decay: rand(.025, .045), g: .05, size: rand(1.4, 2.9), f: .97 });
        }
      },
    });
  await tl;
  el.remove();
  return { ...pos };
}

/** The big multi-colour burst after the name arrives, with follow-up bursts and a heart. */
export function bigBurst(fx, x, y, later) {
  fx.burst(x, y, { type: 'peony', n: 200, pal: MULTI, speed: 7.5, flash: 150, glitter: true, trail: 3 });
  fx.burst(x, y, { type: 'ring', n: 80, pal: PALETTES[0], speed: 4.5, flash: 0 });
  audio.boom(true);
  try { navigator.vibrate?.([40, 30, 90]); } catch { /* unsupported */ }
  const side = Math.min(fx.width * .3, 170);
  later(260, () => { fx.burst(x - side, y + rand(20, 60), { type: 'peony', n: 90, flash: 50 }); audio.boom(); });
  later(480, () => { fx.burst(x + side, y + rand(20, 60), { type: 'peony', n: 90, flash: 50 }); audio.boom(); });
  later(1000, () => { fx.burst(x, y + Math.min(fx.height * .2, 160), { type: 'heart', n: 120, pal: PALETTES[1], speed: 5, flash: 50 }); audio.boom(); });
}
