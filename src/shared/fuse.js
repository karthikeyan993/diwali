// A rocket standing in a bottle with a long fuse. Touch the fuse: the fire crawls along the thread,
// sparking and hissing, until it reaches the rocket. Shared so any themed page can start this way.
import { gsap } from 'gsap';
import { audio } from './audio.js';
import { FLAME } from './fireworks.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];
const FUSE_D = 'M22 140C48 131 70 148 96 141S146 152 160 134S162 100 152 90';

export function createFuse(host) {
  const btn = document.createElement('button');
  btn.className = 'fuse';
  btn.setAttribute('aria-label', 'Light the fuse');
  btn.innerHTML = `
  <svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="fuseGlow"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".9"/><stop offset="1" stop-color="#ff9f1c" stop-opacity="0"/></radialGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9fd8ff" stop-opacity=".35"/><stop offset=".5" stop-color="#9fd8ff" stop-opacity=".1"/><stop offset="1" stop-color="#9fd8ff" stop-opacity=".3"/></linearGradient>
    </defs>
    <g class="rk">
      <rect x="149" y="44" width="2" height="94" fill="#a77b4f"/>
      <path d="M143 52H157V88Q150 92 143 88Z" fill="#d7263d"/>
      <rect x="143" y="60" width="14" height="4" fill="#fff"/>
      <rect x="143" y="74" width="14" height="4" fill="#ffd166"/>
      <path d="M143 52L150 34L157 52Z" fill="#ffd166"/>
      <path d="M143 80L137 92L143 88Z M157 80L163 92L157 88Z" fill="#ffd166"/>
    </g>
    <path d="M136 158H164V130Q164 120 156 116V102H144V116Q136 120 136 130Z" fill="url(#glass)" stroke="#bfe6ff" stroke-opacity=".6" stroke-width="1.2"/>
    <path d="M140 132V152" stroke="#fff" stroke-opacity=".35" stroke-width="1.4" stroke-linecap="round"/>
    <path class="burnt" d="${FUSE_D}" fill="none" stroke="#2a1c12" stroke-width="2.2" stroke-linecap="round"/>
    <path class="thread" d="${FUSE_D}" fill="none" stroke="#e9d5a3" stroke-width="2.6" stroke-linecap="round"/>
    <circle class="ember" cx="22" cy="140" r="9" fill="url(#fuseGlow)"/>
    <circle class="ring" cx="22" cy="140" r="9" fill="none" stroke="#ffd166" stroke-width="1.6"/>
  </svg>
  <span class="fuse-hint" aria-hidden="true">👆</span>`;
  host.appendChild(btn);

  const svg = btn.querySelector('svg');
  const thread = btn.querySelector('.thread');
  const ember = btn.querySelector('.ember');
  const rk = btn.querySelector('.rk');
  const L = thread.getTotalLength();
  thread.style.strokeDasharray = `${L} ${L}`;

  const toScreen = (x, y) => { const m = svg.getScreenCTM(); return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }; };

  function reset() {
    gsap.killTweensOf(rk);
    btn.classList.remove('burning', 'gone');
    thread.style.strokeDashoffset = '0';
    gsap.set(ember, { attr: { cx: 22, cy: 140 } });
    gsap.set(rk, { opacity: 1 });
    btn.disabled = false;
  }

  /** Burn the fuse. Resolves with the rocket's screen position once the fire reaches it. */
  async function light(fx, duration = 1.8) {
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
    const at = toScreen(150, 70);
    rk.style.opacity = '0';
    btn.classList.add('gone');
    return at;
  }

  return { el: btn, light, reset };
}
