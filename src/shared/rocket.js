// The big burst when the rocket reaches the top. Shared by every themed page.
import { audio } from './audio.js';
import { MULTI, PALETTES } from './fireworks.js';

const rand = (a, b) => a + Math.random() * (b - a);

/** The big multi-colour burst after the name arrives, with follow-up bursts and a heart. */
export function bigBurst(fx, x, y, later) {
  fx.burst(x, y, { type: 'peony', n: 200, pal: MULTI, speed: 7.5, flash: 150, glitter: true, trail: 3 });
  fx.burst(x, y, { type: 'ring', n: 80, pal: PALETTES[0], speed: 4.5, flash: 0 });
  audio.boom(true, 0);
  try { navigator.vibrate?.([40, 30, 90]); } catch { /* unsupported */ }
  const side = Math.min(fx.width * .3, 170);
  later(260, () => { fx.burst(x - side, y + rand(20, 60), { type: 'peony', n: 90, flash: 50 }); audio.boom(false, -.6); });
  later(480, () => { fx.burst(x + side, y + rand(20, 60), { type: 'peony', n: 90, flash: 50 }); audio.boom(false, .6); });
  later(1000, () => { fx.burst(x, y + Math.min(fx.height * .2, 160), { type: 'heart', n: 120, pal: PALETTES[1], speed: 5, flash: 50 }); audio.boom(false, 0); });
}
