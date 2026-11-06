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
const FUSE_D = 'M22 192C52 185 80 188 108 191C130 194 138 186 140 168C142 140 140 122 150 111'; // tip -> rocket
const TAIL = [150, 111];   // where the exhaust comes out
const NOSE = [150, 34];

const DEFS = `
  <linearGradient id="rkShade" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".28" stop-color="#000" stop-opacity="0"/>
    <stop offset=".42" stop-color="#fff" stop-opacity=".38"/><stop offset=".58" stop-color="#fff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".55"/>
  </linearGradient>
  <pattern id="rkSpiral" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)">
    <rect width="3.2" height="9" fill="#ffd166"/>
  </pattern>
  <linearGradient id="rkGold" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#8a5a12"/><stop offset=".45" stop-color="#ffe9a0"/><stop offset=".6" stop-color="#ffc94a"/><stop offset="1" stop-color="#7a4c0c"/>
  </linearGradient>
  <linearGradient id="rkCone" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#9aa3b8"/><stop offset=".42" stop-color="#ffffff"/><stop offset=".62" stop-color="#d6dbe8"/><stop offset="1" stop-color="#6c7590"/>
  </linearGradient>
  <linearGradient id="rkStick" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a5a32"/><stop offset=".5" stop-color="#e0bf86"/><stop offset="1" stop-color="#7a5a32"/></linearGradient>
  <linearGradient id="bottleGlass" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#0f5a3a" stop-opacity=".85"/><stop offset=".25" stop-color="#3fae7a" stop-opacity=".55"/>
    <stop offset=".55" stop-color="#1f7a50" stop-opacity=".45"/><stop offset="1" stop-color="#0b4a30" stop-opacity=".9"/>
  </linearGradient>
  <radialGradient id="fuseGlow"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".95"/><stop offset="1" stop-color="#ff9f1c" stop-opacity="0"/></radialGradient>`;

// a festive paper rocket: spiral-wrapped body with gold foil collars and a star badge, a curved foil
// nose cone, a clay nozzle, and a bamboo stick taped to its side (which stands in the bottle)
const ROCKET = `
  <rect x="159.6" y="66" width="2.4" height="128" rx="1.2" fill="url(#rkStick)"/>
  <path d="M159.4 120h2.8v1.2h-2.8z M159.4 150h2.8v1.2h-2.8z" fill="#5a3e1e"/>
  <path d="M141 60H159V104H141Z" fill="#c81e36"/>
  <path d="M141 60H159V104H141Z" fill="url(#rkSpiral)" opacity=".85"/>
  <path d="M141 60H159V65.5H141Z M141 98.5H159V104H141Z" fill="url(#rkGold)"/>
  <path d="M141 62.7H159 M141 101.3H159" stroke="#7a4c0c" stroke-width=".5" stroke-dasharray="1 1.6"/>
  <circle cx="150" cy="82" r="7.4" fill="#fff6e6"/>
  <circle cx="150" cy="82" r="7.4" fill="none" stroke="#ffc94a" stroke-width="1"/>
  <path d="M150.0 77.2L151.2 80.4L154.6 80.5L151.9 82.6L152.8 85.9L150.0 84.0L147.2 85.9L148.1 82.6L145.4 80.5L148.8 80.4Z" fill="#d7263d"/>
  <path d="M141 60H159V104H141Z" fill="url(#rkShade)"/>
  <path d="M143 104H157L155 110.5H145Z" fill="#3b1d10"/>
  <path d="M145 110.5H155" stroke="#000" stroke-opacity=".4" stroke-width="1"/>
  <path d="M140 61C141 50 146 41 150 35C154 41 159 50 160 61Z" fill="url(#rkCone)"/>
  <path d="M142.4 54.5H157.6 M144.6 47H155.4" stroke="#7a8196" stroke-width=".8"/>
  <path d="M140 61C141 50 146 41 150 35C154 41 159 50 160 61Z" fill="url(#rkShade)" opacity=".6"/>
  <path d="M139.4 60H160.6V62H139.4Z" fill="url(#rkGold)"/>
  <circle cx="150" cy="34.4" r="1.9" fill="#fff6c8"/>
  <path d="M157.6 70h5v2.6h-5z M157.6 94h5v2.6h-5z" fill="#ffe08a"/>`;

// a chunky cartoon rocket for game-like pages: bold outlines, cel shading, a porthole, big fins
const INK = 'stroke="#2a0f1a" stroke-width="2" stroke-linejoin="round"';
const CARTOON = `
  <rect x="159.6" y="66" width="2.4" height="128" rx="1.2" fill="#d9b47a" stroke="#5a3e1e" stroke-width=".8"/>
  <path d="M140 86L129 101Q127.5 107 134 107L141 102Z" fill="#7b5cff" ${INK}/>
  <path d="M160 86L171 101Q172.5 107 166 107L159 102Z" fill="#6a48f0" ${INK}/>
  <path d="M143.5 103.5H156.5L154.5 111H145.5Z" fill="#8a93a8" ${INK}/>
  <rect x="139" y="57" width="22" height="48" rx="7" fill="#ff3b4e" ${INK}/>
  <path d="M141.5 62Q141 80 142 100" stroke="#ff9aa3" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M157.8 61Q159 80 157.8 101" stroke="#c41f36" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M139.4 89H160.6V95H139.4Z" fill="#ffd166" stroke="#2a0f1a" stroke-width="1.4"/>
  <circle cx="150" cy="74" r="6.2" fill="#5ce1ff" ${INK}/>
  <path d="M146.6 72.4Q148 69.6 151 69.8" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M139.2 59Q140 41 150 29Q160 41 160.8 59Z" fill="#ffd166" ${INK}/>
  <path d="M143.6 55Q144 43 149.4 34" stroke="#fff3b0" stroke-width="2.4" stroke-linecap="round" fill="none"/>
  <circle cx="150" cy="29.6" r="2.2" fill="#ff3b4e" ${INK} stroke-width="1.4"/>`;

const BOTTLE = `<g transform="translate(11 0)">
  <path d="M133 193Q133 198 138 198H162Q167 198 167 193V160Q167 147 158 139V124H143V139Q133 147 133 160Z" fill="url(#bottleGlass)"/>
  <path d="M141.5 118H158.5V124H141.5Z" fill="#2f8f60" opacity=".9"/>
  <path d="M133 193Q133 198 138 198H162Q167 198 167 193V160Q167 147 158 139V124H143V139Q133 147 133 160Z M141.5 118H158.5V124H141.5Z"
        fill="none" stroke="#b8ffd8" stroke-opacity=".45" stroke-width="1"/>
  <path d="M138 160Q138 152 144 146" stroke="#e8fff2" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  <path d="M138.5 166V188" stroke="#e8fff2" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
  <path d="M162 164V184" stroke="#e8fff2" stroke-opacity=".18" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M135 195H165" stroke="#062a1a" stroke-opacity=".6" stroke-width="2"/></g>`;

export function createFuse(host, { art = 'classic' } = {}) {
  const ART = art === 'cartoon' ? CARTOON : ROCKET;
  const btn = document.createElement('button');
  btn.className = 'fuse';
  btn.setAttribute('aria-label', 'Light the fuse');
  btn.innerHTML = `
  <svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>${DEFS}</defs>
    <g class="rk">${ART}</g>
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
  fly.className = `rk-fly ${art}`;
  fly.setAttribute('aria-hidden', 'true');
  fly.innerHTML = `<svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg"><defs>${DEFS.replace(/id="/g, 'id="f-')}</defs>${ART.replace(/url\(#/g, 'url(#f-')}</svg><i class="rk-flame"></i>`;
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
    gsap.set(fly, { x: 0, y: 0, rotation: 0, scale: 1, scaleX: 1, scaleY: 1 });
    btn.disabled = false;
  }

  /** Burn the fuse until the fire reaches the rocket. */
  async function light(fx, duration = 2) {
    btn.disabled = true;
    btn.classList.add('burning');
    audio.fuse(duration + .15);
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
  async function launch(fx, target, { reducedMotion = false, climb: climbFor = 1.8, endScale = .8, stunt = false } = {}) {
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
    const rumble = reducedMotion ? .2 : .45;
    const climb = reducedMotion ? 1.2 : climbFor;
    audio.launch(rumble, climb);
    if (stunt && !reducedMotion) {
      await stuntFlight(fx, dx, dy, rumble, climb, endScale, k);
      fly.classList.remove('on', 'lit');
      return { x: target.x, y: target.y };
    }
    const tl = gsap.timeline();
    // ignition: the rocket shudders in the bottle, spitting sparks
    tl.to(fly, {
      duration: rumble, ease: 'none', y: -3,
      onUpdate: () => { gsap.set(fly, { x: rand(-1.6, 1.6) }); emit(3, 2); },
    })
      // lift-off: it accelerates away, leaning slightly as it drifts towards the middle
      .to(fly, {
        duration: climb, ease: 'power1.in',
        x: dx, y: dy, rotation: gsap.utils.clamp(-12, 12, dx / 18), scale: endScale,
        onUpdate: () => emit(4, 1),
      });
    await tl;
    fly.classList.remove('on', 'lit');
    return { x: target.x, y: target.y };
  }

  /** Cartoon stunt flight: squash before lift-off, a weaving climb that banks into its turns,
   *  two barrel rolls on the way up, and a thick flame trail with glitter that hangs in the air. */
  async function stuntFlight(fx, dx, dy, rumble, climb, endScale, k) {
    const o0 = toScreen(150, 80);                 // the transform origin on screen
    const tailLen = 31 * k;                       // origin -> nozzle, in px at scale 1
    const W = fx.width, weave = Math.min(W * .26, 110) * (Math.random() < .5 ? -1 : 1);
    const GLITTER = [0xff4fa3, 0x5ce1ff, 0xffd166, 0x7dff6a, 0xffffff, 0x9b5cff];
    const smooth = (p) => p * p * (3 - 2 * p);
    const xAt = (p) => dx * p + weave * Math.sin(p * Math.PI * 3) * Math.sin(p * Math.PI);
    const yAt = (p) => dy * (p < .5 ? 2 * p * p * (1.1 - .2 * p) : smooth(p));
    // each roll spins the rocket about its long axis: its width goes through zero and comes back mirrored
    const rollAt = (p) => {
      for (const [a, b] of [[.22, .4], [.58, .76]]) if (p > a && p < b) return Math.cos(((p - a) / (b - a)) * Math.PI * 2);
      return 1;
    };
    const trail = (x, y, rot, sc, boost) => {
      const r = rot * Math.PI / 180, bx = -Math.sin(r), by = Math.cos(r); // unit vector out of the nozzle
      const nx = o0.x + x + bx * tailLen * sc, ny = o0.y + y + by * tailLen * sc;
      for (let i = 0; i < 5 + boost; i++) {
        const sp = rand(2, 5);
        fx.spark(nx + rand(-1.5, 1.5), ny, bx * sp + rand(-.8, .8), by * sp + rand(-.8, .8), pick([...FLAME, 0xffffff]),
          { decay: rand(.03, .055), g: .03, size: rand(1.6, 3.2), f: .95 });
      }
      for (let i = 0; i < 2; i++) {
        fx.spark(nx + rand(-3, 3), ny + rand(-3, 3), rand(-.5, .5), rand(-.2, .6), pick(GLITTER),
          { decay: rand(.01, .018), g: .015, size: rand(1.2, 2.2), f: .97, tw: true });
      }
    };

    // ignition: it squashes down into the bottle, shaking and spitting sparks...
    await gsap.to(fly, {
      duration: rumble, ease: 'power1.in', y: 2, scaleY: .82, scaleX: 1.14,
      onUpdate: () => { gsap.set(fly, { x: rand(-1.8, 1.8) }); trail(+gsap.getProperty(fly, 'x'), 2, 0, 1, 0); },
    });
    // ...then stretches as it springs out and flies
    const prog = { p: 0 };
    let px = 0, py = 0, rot = 0;
    await gsap.to(prog, {
      p: 1, duration: climb, ease: 'none',
      onUpdate() {
        const p = prog.p, x = xAt(p), y = yAt(p);
        const vx = x - px, vy = y - py;
        if (vx * vx + vy * vy > .5) rot = gsap.utils.clamp(-70, 70, Math.atan2(vx, -vy) * 180 / Math.PI);
        px = x; py = y;
        const sc = 1 + (endScale - 1) * Math.pow(p, .8);
        const stretch = 1 + .22 * Math.max(0, 1 - p * 6); // stretched just after lift-off
        gsap.set(fly, { x, y, rotation: rot, scaleX: sc * rollAt(p) / Math.sqrt(stretch), scaleY: sc * stretch });
        trail(x, y, rot, sc, p < .15 ? 4 : 0);
      },
    });
  }

  return { el: btn, light, launch, reset };
}
