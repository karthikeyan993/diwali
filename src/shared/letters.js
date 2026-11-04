// "Happy Diwali, Name!" letter animation shared by every themed page.
import { gsap } from 'gsap';
import { MULTI } from './fireworks.js';

const rand = (a, b) => a + Math.random() * (b - a);
export const RAINBOW = ['#ffd166', '#ff9f1c', '#ff5f8f', '#e45bff', '#9b7bff', '#4fc3ff', '#2ee6c5', '#9dff6a'];

export const center = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

export function splitInto(el, text, colors = null) {
  el.innerHTML = '';
  el.setAttribute('aria-label', text);
  return [...text].map((ch, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--i', i);
    if (colors) s.style.setProperty('--c', colors[i % colors.length]);
    s.textContent = ch === ' ' ? ' ' : ch;
    el.appendChild(s);
    return s;
  });
}

/** Animate the greeting in: top line pops, the name's letters fly in and each lands with a tiny burst. */
export function revealLetters(fx, topEl, nameEl, topText, name, palette = RAINBOW) {
  const top = splitInto(topEl, topText);
  const shift = (Math.random() * palette.length) | 0;
  const letters = splitInto(nameEl, name + '!', [...palette.slice(shift), ...palette.slice(0, shift)]);

  gsap.fromTo(top,
    { opacity: 0, scale: 2.6, y: -30, rotation: -12, filter: 'blur(10px)' },
    { opacity: 1, scale: 1, y: 0, rotation: 0, filter: 'blur(0px)', duration: .9, ease: 'back.out(2.2)', stagger: .055 });

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
}
