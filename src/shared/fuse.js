// A bottle rocket standing in a glass bottle, with a long fuse along the ground.
// Touch the fuse: the fire crawls along the thread until it reaches the rocket, and then the rocket
// itself lifts out of the bottle and flies up (no swap), leaving a trail of sparks until it bursts.
// Shared so any themed page can start this way.
import { gsap } from 'gsap';
import { audio } from './audio.js';
import { FLAME } from './fireworks.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];

// viewBox 220 x 200, ground at y 198. Rocket centred on x 150.
const FUSE_D = 'M152 111C166 117 177 140 173 168C169 190 140 196 110 192S52 185 22 192';
const TAIL = [150, 111];   // where the exhaust comes out
const NOSE = [150, 40];

const DEFS = `
  <linearGradient id="rkBody" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#6a0b16"/><stop offset=".3" stop-color="#c81e36"/><stop offset=".48" stop-color="#ff6b78"/>
    <stop offset=".62" stop-color="#d7263d"/><stop offset="1" stop-color="#5a0912"/>
  </linearGradient>
  <linearGradient id="rkGold" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#8a5a12"/><stop offset=".45" stop-color="#ffe08a"/><stop offset=".6" stop-color="#ffc94a"/><stop offset="1" stop-color="#7a4c0c"/>
  </linearGradient>
  <linearGradient id="rkCone" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#b8860b"/><stop offset=".45" stop-color="#fff0b8"/><stop offset=".7" stop-color="#ffcf4a"/><stop offset="1" stop-color="#8a5a12"/>
  </linearGradient>
  <linearGradient id="rkStick" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b4a2a"/><stop offset=".5" stop-color="#c9a070"/><stop offset="1" stop-color="#6b4a2a"/></linearGradient>
  <linearGradient id="bottleGlass" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#0f5a3a" stop-opacity=".85"/><stop offset=".25" stop-color="#3fae7a" stop-opacity=".55"/>
    <stop offset=".55" stop-color="#1f7a50" stop-opacity=".45"/><stop offset="1" stop-color="#0b4a30" stop-opacity=".9"/>
  </linearGradient>
  <radialGradient id="fuseGlow"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".95"/><stop offset="1" stop-color="#ff9f1c" stop-opacity="0"/></radialGradient>`;

// paper rocket: stick, cylindrical body with gold bands and a printed band, curved nose cone, end cap
const ROCKET = `
  <rect x="149" y="64" width="2" height="128" rx="1" fill="url(#rkStick)"/>
  <path d="M144 62H156V108H144Z" fill="url(#rkBody)"/>
  <path d="M144 62H156V66.5H144Z M144 102.5H156V107H144Z" fill="url(#rkGold)"/>
  <path d="M144 76H156V92H144Z" fill="#fff4e0" opacity=".92"/>
  <path d="M146 79l1.6 1.6l-1.6 1.6l-1.6-1.6Z M150 79l1.6 1.6l-1.6 1.6l-1.6-1.6Z M154 79l1.6 1.6l-1.6 1.6l-1.6-1.6Z
           M148 85l1.6 1.6l-1.6 1.6l-1.6-1.6Z M152 85l1.6 1.6l-1.6 1.6l-1.6-1.6Z" fill="#d7263d"/>
  <path d="M144 76H156V77H144Z M144 91H156V92H144Z" fill="#ffc94a"/>
  <path d="M152.6 62V108" stroke="#fff" stroke-opacity=".22" stroke-width=".8"/>
  <path d="M143 62.5Q144.5 50 150 40Q155.5 50 157 62.5Z" fill="url(#rkCone)"/>
  <circle cx="150" cy="39.6" r="1.6" fill="#fff0b8"/>
  <path d="M144 107H156V111H144Z" fill="#2b140c"/>`;

const BOTTLE = `
  <path d="M133 193Q133 198 138 198H162Q167 198 167 193V160Q167 147 158 139V124H143V139Q133 147 133 160Z" fill="url(#bottleGlass)"/>
  <path d="M141.5 118H158.5V124H141.5Z" fill="#2f8f60" opacity=".9"/>
  <path d="M133 193Q133 198 138 198H162Q167 198 167 193V160Q167 147 158 139V124H143V139Q133 147 133 160Z M141.5 118H158.5V124H141.5Z"
        fill="none" stroke="#b8ffd8" stroke-opacity=".45" stroke-width="1"/>
  <path d="M138 160Q138 152 144 146" stroke="#e8fff2" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  <path d="M138.5 166V188" stroke="#e8fff2" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
  <path d="M162 164V184" stroke="#e8fff2" stroke-opacity=".18" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M135 195H165" stroke="#062a1a" stroke-opacity=".6" stroke-width="2"/>`;

export function createFuse(host) {
  const btn = document.createElement('button');
  btn.className = 'fuse';
  btn.setAttribute('aria-label', 'Light the fuse');
  btn.innerHTML = `
  <svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>${DEFS}</defs>
    <g class="rk">${ROCKET}</g>
    ${BOTTLE}
    <path class="burnt" d="${FUSE_D}" fill="none" stroke="#2a1c12" stroke-width="2.2" stroke-linecap="round"/>
    <path class="thread" d="${FUSE_D}" fill="none" stroke="#e9d5a3" stroke-width="2.6" stroke-linecap="round"/>
    <circle class="ember" cx="22" cy="192" r="9" fill="url(#fuseGlow)"/>
    <circle class="ring" cx="22" cy="192" r="9" fill="none" stroke="#ffd166" stroke-width="1.6"/>
  </svg>
  <span class="fuse-hint" aria-hidden="true">👆</span>`;
  host.appendChild(btn);

  // the rocket that actually flies: an identical drawing in its own layer, so lift-off is a GPU transform
  const fly = document.createElement('div');
  fly.className = 'rk-fly';
  fly.setAttribute('aria-hidden', 'true');
  fly.innerHTML = `<svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg"><defs>${DEFS.replace(/id="/g, 'id="f-')}</defs>${ROCKET.replace(/url\(#/g, 'url(#f-')}</svg><i class="rk-flame"></i>`;
  host.appendChild(fly);

  const svg = btn.querySelector('svg');
  const thread = btn.querySelector('.thread');
  const ember = btn.querySelector('.ember');
  const rk = btn.querySelector('.rk');
  const L = thread.getTotalLength();
  thread.style.strokeDasharray = `${L} ${L}`;

  const toScreen = (x, y) => { const m = svg.getScreenCTM(); return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }; };

  function reset() {
    gsap.killTweensOf(fly);
    btn.classList.remove('burning', 'gone');
    thread.style.strokeDashoffset = '0';
    ember.setAttribute('cx', 22); ember.setAttribute('cy', 192);
    rk.style.opacity = '1';
    fly.classList.remove('on', 'lit');
    gsap.set(fly, { x: 0, y: 0, rotation: 0, scale: 1 });
    btn.disabled = false;
  }

  /** Burn the fuse until the fire reaches the rocket. */
  async function light(fx, duration = 2) {
    btn.disabled = true;
    btn.classList.add('burning');
    audio.hiss(duration + .2, .09);
    const prog = { p: 0 };
    await gsap.to(prog, {
      p: 1, duration, ease: 'none',
      onUpdate() {
        const len = prog.p * L;
        thread.style.strokeDashoffset = `${-len}`;
        const pt = thread.getPointAtLength(len);
        ember.setAttribute('cx', pt.x);
        ember.setAttribute('cy', pt.y);
        const s = toScreen(pt.x, pt.y);
        for (let i = 0; i < 3; i++) {
          fx.spark(s.x, s.y, rand(-2.2, 2.2), rand(-3.2, .6), pick([...FLAME, 0xffffff]),
            { decay: rand(.04, .08), size: rand(1, 2), g: .09, f: .95, tw: true });
        }
      },
    });
  }

  /** Lift the rocket out of the bottle and fly it to `target`. Resolves with the burst point (its nose). */
  async function launch(fx, target, { reducedMotion = false } = {}) {
    // put the flying copy exactly over the drawn rocket, then hide the drawn one: no visible swap
    const r = btn.getBoundingClientRect();
    Object.assign(fly.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    const k = r.width / 220;
    fly.style.transformOrigin = `${150 * k}px ${80 * k}px`;
    fly.classList.add('on');
    rk.style.opacity = '0';
    btn.classList.add('gone');

    const tail0 = toScreen(...TAIL), nose0 = toScreen(...NOSE);
    const dx = target.x - nose0.x, dy = target.y - nose0.y;
    const emit = (n, spread) => {
      const tx = +gsap.getProperty(fly, 'x'), ty = +gsap.getProperty(fly, 'y');
      for (let i = 0; i < n; i++) {
        fx.spark(tail0.x + tx + rand(-2, 2), tail0.y + ty, rand(-spread, spread), rand(1.5, 4.5), pick([...FLAME, 0xffffff]),
          { decay: rand(.025, .05), g: .05, size: rand(1.3, 2.8), f: .97 });
      }
    };

    fly.classList.add('lit');
    const tl = gsap.timeline();
    // ignition: the rocket shudders in the bottle, spitting sparks
    tl.to(fly, {
      duration: reducedMotion ? .2 : .45, ease: 'none', y: -3,
      onUpdate: () => { gsap.set(fly, { x: rand(-1.6, 1.6) }); emit(3, 2); },
    })
      .add(() => audio.whoosh(1.3, .22))
      // lift-off: it accelerates away, leaning slightly as it drifts towards the middle
      .to(fly, {
        duration: 1.25, ease: 'power2.in',
        x: dx, y: dy, rotation: gsap.utils.clamp(-12, 12, dx / 18), scale: .8,
        onUpdate: () => emit(4, 1),
      });
    await tl;
    fly.classList.remove('on', 'lit');
    return { x: target.x, y: target.y };
  }

  return { el: btn, light, launch, reset };
}
