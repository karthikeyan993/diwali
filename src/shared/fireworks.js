// WebGL fireworks engine built on PixiJS.
// Every particle is an additive-blended glow sprite, stretched along its velocity so it reads as a streak.
import { Application, Container, Graphics, Matrix, RenderTexture, Sprite, Texture, Ticker } from 'pixi.js';
import { audio } from './audio.js';

export const PALETTES = [
  [0xffd166, 0xff8c1a, 0xfff3b0],
  [0xff4fa3, 0xff9bd2, 0xffffff],
  [0x9b5cff, 0xc9a6ff, 0x5ce1ff],
  [0x2ee6c5, 0xa8ffef, 0xffd166],
  [0xff3b3b, 0xffd166, 0xff8c1a],
  [0x5ce1ff, 0xffffff, 0x9b5cff],
  [0x7dff6a, 0xffffff, 0xffd166],
];
export const MULTI = [0xffd166, 0xff4fa3, 0x9b5cff, 0x2ee6c5, 0xff8c1a, 0x5ce1ff, 0xffffff, 0x7dff6a];
export const FLAME = [0xfff3b0, 0xffd166, 0xff8c1a, 0xffb347];
export const GOLD = [0xffd166, 0xffe9a8, 0xffb347];
const TYPES = ['peony', 'peony', 'ring', 'willow', 'heart', 'double', 'peony', 'crossette'];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];

function glowTexture(size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const r = size / 2;
  const gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(.22, 'rgba(255,255,255,.9)');
  gr.addColorStop(.5, 'rgba(255,255,255,.22)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return Texture.from(c);
}

/** A stand-in with the same API, used if WebGL can't start, so the greeting still works. */
function noopEngine() {
  const noop = () => {};
  return { spark: noop, burst: noop, launchShell: noop, setEmbers: noop, flowerPot: noop, chakra: noop, pop: noop, ladi: noop, stopGround: noop, clearPots: noop, clearSky: noop, setQuiet: noop, waterfall: noop, spawnTarget: noop, hit: () => false, clearTargets: noop, targetCount: 0, width: innerWidth, height: innerHeight, scale: 1 };
}

export async function createFireworks(host, { quality: baseQuality = 1, onLight = null, onTargetBurst = null, reflection = null } = {}) {
  // Particle counts scale with `quality`, which adapts to the device so the frame rate holds.
  const smallCores = (navigator.hardwareConcurrency || 8) <= 4;
  let quality = baseQuality * (smallCores ? .7 : 1);
  const maxQuality = quality;
  const app = new Application();
  // Fireworks are soft glows, so a lower backing resolution is invisible but saves a lot of GPU fill.
  const bigScreen = innerWidth * innerHeight > 900000;
  try {
    await app.init({
      autoStart: false, // we drive frames ourselves and skip drawing when the sky is empty
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: false,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, bigScreen ? 1 : 1.25),
      preference: 'webgl',
      powerPreference: 'high-performance',
    });
  } catch (e) {
    console.warn('Fireworks disabled:', e);
    return noopEngine();
  }
  app.canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(app.canvas);

  const tex = glowTexture();
  const groundLayer = new Container(); // flower-pot bodies (normal blending)
  const targetLayer = new Container(); // floating crackers you can burst
  const layer = new Container();
  app.stage.addChild(groundLayer, targetLayer, layer);

  const pool = [], parts = [], shells = [], flashes = [], emitters = [];
  const maxParts = () => 2600 * quality + 300;
  let embers = true;
  // quiet: background (automatic) sounds are muted; anything the user triggers still sounds
  let quiet = false;
  const auto = (opts = {}) => !opts.silent && (!quiet || opts.user);
  const groundTimers = [];
  let drewLast = false;

  const W = () => app.screen.width;
  const H = () => app.screen.height;
  const S = () => Math.max(.75, Math.min(1.5, Math.min(W(), H()) / 420));
  const panOf = (x) => Math.max(-1, Math.min(1, (x / W()) * 2 - 1)) * .8; // where on screen -> left/right

  function sprite() {
    let s = pool.pop();
    if (!s) {
      s = new Sprite(tex);
      s.anchor.set(.5);
      s.blendMode = 'add';
      layer.addChild(s);
    }
    s.visible = true;
    return s;
  }
  function release(s) { s.visible = false; pool.push(s); }

  function spark(x, y, vx, vy, color, o = {}) {
    if (parts.length >= maxParts()) return;
    const sp = sprite();
    sp.tint = color;
    parts.push({
      sp, x, y, vx, vy, color, life: 1,
      decay: o.decay ?? rand(.012, .02),
      size: o.size ?? rand(1.6, 2.8),
      g: o.g ?? .045,
      f: o.f ?? .955,
      tw: !!o.tw,
      trail: o.trail || 0,
      split: o.split || 0,
      floor: o.floor ?? Infinity, // e.g. the water line: sparks vanish when they reach it
      t: 0,
    });
  }

  function flash(x, y, r) {
    const sp = sprite();
    sp.tint = 0xfff0d0;
    sp.rotation = 0;
    flashes.push({ sp, x, y, r, life: 1 });
  }

  function burst(x, y, opt = {}) {
    const pal = opt.pal || pick(PALETTES);
    const n = Math.round((opt.n || 110) * quality);
    const sp = (opt.speed || 6.5) * S();
    const type = opt.type || pick(TYPES);
    const trail = opt.trail ?? (Math.random() < .35 ? 3 : 0);

    if (type === 'ring') {
      const tilt = rand(.45, 1);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, s = sp * rand(.96, 1.04);
        spark(x, y, Math.cos(a) * s, Math.sin(a) * s * tilt, pick(pal), { decay: rand(.012, .016) });
      }
    } else if (type === 'heart') {
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        const hx = 16 * Math.sin(t) ** 3;
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const s = (sp / 16) * rand(.97, 1.03);
        spark(x, y, hx * s, hy * s, pick(pal), { g: .02, decay: rand(.011, .014) });
      }
    } else if (type === 'willow') {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), s = sp * Math.sqrt(Math.random()) * .9;
        spark(x, y, Math.cos(a) * s, Math.sin(a) * s, pick(GOLD),
          { decay: rand(.006, .01), g: .035, f: .95, tw: true, size: rand(1.3, 2.3), trail: 4 });
      }
    } else if (type === 'crossette') {
      for (let i = 0; i < Math.max(6, n / 14); i++) {
        const a = rand(0, Math.PI * 2), s = sp * rand(.7, 1);
        spark(x, y, Math.cos(a) * s, Math.sin(a) * s, pick(pal), { decay: .028, size: 3, trail: 2, split: 1 });
      }
    } else if (type === 'double') {
      burst(x, y, { ...opt, type: 'peony', pal, n: (opt.n || 110) * .7, flash: 0 });
      burst(x, y, { ...opt, type: 'ring', pal: pick(PALETTES), n: (opt.n || 110) * .45, speed: (opt.speed || 6.5) * .5, flash: 0 });
    } else {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), s = sp * Math.pow(Math.random(), .3);
        spark(x, y, Math.cos(a) * s, Math.sin(a) * s, pick(pal), { trail });
      }
    }
    if (opt.glitter) {
      for (let i = 0; i < 60 * quality; i++) {
        const a = rand(0, Math.PI * 2), s = sp * rand(.2, 1);
        spark(x, y, Math.cos(a) * s, Math.sin(a) * s, 0xfff8e0, { tw: true, decay: rand(.006, .01), size: 1.4, g: .03 });
      }
    }
    const fl = opt.flash ?? 70;
    if (fl > 0) {
      flash(x, y, fl * S());
      onLight?.(pal[0], fl);
    }
  }

  function launchShell(tx, ty, opts = {}) {
    // shells rise from the bottom of the screen, or from a launch point (a barge, a bridge)
    const sx = opts.from ? opts.from.x : tx + rand(-W() * .08, W() * .08);
    const sy = opts.from ? opts.from.y : H() + 10, g = .12 * S();
    const vy = -Math.sqrt(2 * g * Math.max(60, sy - ty));
    const frames = -vy / g;
    shells.push({ x: sx, y: sy, vx: (tx - sx) / frames, vy, g, opts, sp: sprite() });
    // the swish lasts as long as the climb
    if (auto(opts)) audio.whoosh(Math.min(2.2, Math.max(.8, frames / 60 + .15)), .085, panOf(sx));
  }

  /* ---------- Ground crackers ---------- */
  const groundY = () => H() - 16;
  const POT_COLORS = [GOLD, GOLD, [0xffd166, 0x7dff6a, 0xffffff], [0xffd166, 0xff6fb5, 0xffffff]];

  function glow(color) {
    const g = sprite();
    g.tint = color; g.rotation = 0; g.alpha = 0;
    return g;
  }

  /** Flower pot (anar): a cone on the ground spraying a fountain of sparks.
   *  Pots stay standing where they were placed and simply fire again, rather than vanishing. */
  const pots = [];
  function potAt(x) {
    let p = pots.find((q) => Math.abs(q.x - x) < 16);
    if (!p) {
      const body = new Graphics()
        .poly([-11, 0, 11, 0, 4, -24, -4, -24]).fill(0x9e1f1a)
        .poly([-9.5, -6, 9.5, -6, 8.4, -9.5, -8.4, -9.5]).fill(0xffc53d)
        .poly([-6.6, -15, 6.6, -15, 5.6, -18, -5.6, -18]).fill(0xffc53d)
        .rect(-4, -26, 8, 3).fill(0x3a0d0a);
      body.position.set(x, groundY());
      body.alpha = 0;
      groundLayer.addChild(body);
      p = { x, body };
      pots.push(p);
    }
    return p;
  }
  function flowerPot(x, dur = rand(4.5, 6.5), opts = {}) {
    const p = potAt(x);
    if (emitters.some((e) => e.type === 'pot' && e.pot === p)) return; // already firing
    emitters.push({ type: 'pot', x: p.x, pot: p, t: 0, dur: dur * 60, pal: pick(POT_COLORS), g: glow(0xffe39a) });
    if (auto(opts)) audio.hiss(dur, .05, false, panOf(x));
  }
  /** Drop shells still climbing and fade every spark quickly (used when starting over) */
  function clearSky() {
    shells.splice(0).forEach((s) => release(s.sp));
    for (const p of parts) p.decay = Math.max(p.decay, .08);
    drewLast = true;
  }
  function clearPots() {
    pots.splice(0).forEach((p) => p.body.destroy());
    drewLast = true; // draw one more frame so they disappear
  }

  /** Chakra: a ground spinner that whirls sparks and wanders a little */
  function chakra(x, dur = rand(4, 5.5)) {
    emitters.push({ type: 'chakra', x, vx: rand(-.5, .5), t: 0, dur: dur * 60, a: 0, g: glow(0xfff2c0) });
    if (auto()) audio.hiss(dur, .06, true, panOf(x));
  }

  /** A tiny cracker going pop */
  function pop(x, y = groundY() - rand(0, 6), loud = false) {
    flash(x, y, rand(14, 22) * S());
    for (let i = 0; i < 16 * quality; i++) {
      const a = rand(Math.PI, Math.PI * 2), s = rand(1, 3.4) * S();
      spark(x, y, Math.cos(a) * s, Math.sin(a) * s, pick([0xffffff, 0xfff3b0, 0xffd166, 0xff8c1a]),
        { decay: rand(.04, .07), size: rand(1.1, 2), g: .09, f: .94 });
    }
    if (auto() || loud) audio.pop(loud, panOf(x));
  }

  /** Ladi / saram: a string of crackers popping in quick succession across the ground */
  function ladi(x0, x1, count = 24) {
    for (let i = 0; i < count; i++) {
      groundTimers.push(setTimeout(() => pop(lerpN(x0, x1, i / (count - 1)) + rand(-6, 6)), i * rand(55, 95)));
    }
  }
  const lerpN = (a, b, t) => a + (b - a) * t;

  /** Bridge waterfall: a curtain of golden sparks pouring from a deck down to the water */
  function waterfall(x0, x1, y, floor, dur = 7) {
    emitters.push({ type: 'falls', x0, x1, y, floor, t: 0, dur: dur * 60 });
    if (auto()) audio.hiss(dur, .06, false, panOf((x0 + x1) / 2));
  }

  function stopGround() {
    groundTimers.splice(0).forEach(clearTimeout);
    emitters.forEach((e) => { e.t = Math.max(e.t, e.dur - 30); });
  }

  /* ---------- Floating crackers: touch one and it bursts ---------- */
  const targets = [];
  const FUSE = 0xd8c38f;
  function crackerGraphic(kind) {
    const g = new Graphics();
    let tip;
    if (kind === 'bomb') {            // round "atom bomb"
      g.circle(0, 0, 14).fill(0x1d7a3e).stroke({ width: 1.6, color: 0xffd166 });
      g.rect(-13.6, -3, 27.2, 6).fill(0xffd166);
      g.circle(-5, -6, 3.4).fill({ color: 0xffffff, alpha: .3 });
      g.moveTo(0, -14).quadraticCurveTo(7, -20, 3, -27).stroke({ width: 2, color: FUSE });
      tip = [3, -27];
    } else if (kind === 'lakshmi') {  // red paper "Lakshmi vedi"
      g.roundRect(-11, -15, 22, 30, 3).fill(0xc62828).stroke({ width: 1.6, color: 0xffd166 });
      g.circle(0, 0, 6.5).fill(0xffd166);
      g.circle(0, 0, 3.6).fill(0xc62828);
      g.rect(-11, -10, 22, 1.4).fill(0xffd166);
      g.rect(-11, 8.6, 22, 1.4).fill(0xffd166);
      g.moveTo(0, -15).quadraticCurveTo(-6, -21, -2, -27).stroke({ width: 2, color: FUSE });
      tip = [-2, -27];
    } else {                          // rocket
      g.rect(-1, 9, 2, 20).fill(0x9c7a55);
      g.rect(-4.5, -13, 9, 23).fill(0xe53935);
      g.rect(-4.5, -6, 9, 3).fill(0xffffff);
      g.rect(-4.5, 2, 9, 3).fill(0xffffff);
      g.poly([-5.5, -13, 5.5, -13, 0, -24]).fill(0xffd166);
      tip = [0, 10];
    }
    return { g, tip };
  }

  function spawnTarget() {
    const kind = pick(['bomb', 'bomb', 'lakshmi', 'lakshmi', 'rocket']);
    const { g, tip } = crackerGraphic(kind);
    const sc = 1.15 * S();
    g.scale.set(sc);
    targetLayer.addChild(g);
    targets.push({
      g, tip, kind, sc,
      x: rand(W() * .14, W() * .86), y: H() + 40,
      vx: rand(-.35, .35), vy: -rand(.9, 1.45) * S(),
      rot: kind === 'rocket' ? 0 : rand(-.4, .4), vr: kind === 'rocket' ? 0 : rand(-.012, .012),
      ph: rand(0, 6),
    });
  }

  function explodeTarget(i) {
    const t = targets[i];
    targets.splice(i, 1);
    const pal = t.kind === 'bomb' ? [0x7dff6a, 0xffd166, 0xffffff] : t.kind === 'lakshmi' ? [0xff3b3b, 0xffd166, 0xfff3b0] : MULTI;
    burst(t.x, t.y, { type: pick(['peony', 'double', 'ring', 'crossette', 'peony']), pal, n: 130, speed: 6, flash: 90, glitter: true });
    audio.cracker(t.kind, panOf(t.x));
    t.g.destroy();
    onTargetBurst?.(t.kind, t.x, t.y);
  }

  function hit(px, py) {
    const r = 34 * S();
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      if (Math.hypot(t.x - px, t.y - py) < r) { explodeTarget(i); return true; }
    }
    return false;
  }

  function clearTargets() {
    targets.splice(0).forEach((t) => t.g.destroy());
  }

  function updateTargets(k) {
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      t.ph += .03 * k;
      t.x += (t.vx + Math.sin(t.ph) * .35) * k;
      t.y += t.vy * k;
      t.rot += t.vr * k;
      t.g.position.set(t.x, t.y);
      t.g.rotation = t.rot;
      // fizzing fuse
      const c = Math.cos(t.rot), s = Math.sin(t.rot);
      const fx = t.x + (c * t.tip[0] - s * t.tip[1]) * t.sc, fy = t.y + (s * t.tip[0] + c * t.tip[1]) * t.sc;
      for (let j = 0; j < 2; j++) {
        spark(fx, fy, rand(-1.2, 1.2), rand(-1.2, t.kind === 'rocket' ? 2.5 : .8), pick([0xffffff, 0xfff3b0, 0xffd166, 0xff8c1a]),
          { decay: rand(.05, .09), size: rand(1, 1.8), g: .04, f: .94, tw: true });
      }
      if (t.y < -60) { t.g.destroy(); targets.splice(i, 1); }
    }
  }

  function updateEmitters(k) {
    const gy = groundY();
    for (let i = emitters.length - 1; i >= 0; i--) {
      const e = emitters[i];
      e.t += k;
      const t = e.t / e.dur;
      if (t >= 1.15) {
        if (e.g) release(e.g);
        emitters.splice(i, 1);
        continue;
      }
      // ramp up, sustain with flicker, die out
      const env = t >= 1 ? 0 : Math.min(1, e.t / 25) * Math.min(1, (1 - t) * 6) * rand(.75, 1);

      if (e.type === 'pot') {
        e.pot.body.alpha = Math.min(1, e.pot.body.alpha + .1 * k);
        const mx = e.x, my = gy - 25;
        const n = Math.round(8 * env * k * quality);
        for (let j = 0; j < n; j++) {
          spark(mx + rand(-2, 2), my, rand(-1.5, 1.5) * S(), -rand(5.5, 9.2) * S() * (.65 + .35 * env), pick(e.pal),
            { g: .2 * S(), f: .99, decay: rand(.016, .028), size: rand(1.3, 2.4), tw: Math.random() < .4 });
        }
        e.g.position.set(mx, my - 4);
        e.g.scale.set(.9 + env * .5);
        e.g.alpha = env * .8;
      } else if (e.type === 'falls') {
        const n = Math.round(((e.x1 - e.x0) / 14) * env * k * quality);
        for (let j = 0; j < n; j++) {
          spark(rand(e.x0, e.x1), e.y + rand(0, 2), rand(-.15, .15), rand(0, .6), pick([0xffe7a0, 0xffffff, 0xffd166, 0xffb347]),
            { g: .05, f: .985, decay: rand(.008, .014), size: rand(1.1, 2), tw: true, floor: e.floor });
        }
      } else {
        e.x += e.vx * k;
        if (e.x < W() * .08 || e.x > W() * .92) e.vx *= -1;
        e.a += .42 * k;
        const cy = gy - 6, r = 5;
        const colors = [0x7dff6a, 0xffd166, 0xff5a5a, 0xffffff];
        const col = colors[Math.floor(e.t / 50) % colors.length];
        const n = Math.max(1, Math.round(3 * k * quality * (env > .05 ? 1 : 0)));
        for (let j = 0; j < n * 2 && env > .05; j++) {
          const a = e.a + (j % 2) * Math.PI + rand(-.15, .15);
          const px = e.x + Math.cos(a) * r, py = cy + Math.sin(a) * r * .45;
          const sp = rand(3.5, 6) * S();
          spark(px, py, -Math.sin(a) * sp, Math.cos(a) * sp * .45 - rand(0, 1.2), Math.random() < .3 ? 0xffffff : col,
            { g: .05, f: .93, decay: rand(.04, .06), size: rand(1.2, 2.2) });
        }
        e.g.position.set(e.x, cy);
        e.g.scale.set(.5 + env * .35);
        e.g.alpha = env;
      }
    }
  }

  /* ---------- Water reflection: the sky, flipped and squashed onto the water at half resolution ---------- */
  let reflRT = null, reflSprite = null;
  const flip = new Matrix();
  if (reflection) {
    reflRT = RenderTexture.create({ width: 8, height: 8, resolution: .5 });
    reflSprite = new Sprite(reflRT);
    reflSprite.tint = reflection.tint ?? 0xa9c1ff;
    reflSprite.alpha = reflection.alpha ?? .5;
    app.stage.addChildAt(reflSprite, 0);
  }
  function drawReflection() {
    const wy = reflection.y(), rh = Math.round(H() - wy);
    if (rh < 8) { reflSprite.visible = false; return; }
    if (reflRT.width !== Math.round(W()) || reflRT.height !== rh) reflRT.resize(Math.round(W()), rh);
    const sq = .8; // reflections look shorter than the real thing
    flip.set(1, 0, 0, -sq, 0, wy * sq);
    app.renderer.render({ container: layer, target: reflRT, clear: true, transform: flip });
    reflSprite.visible = true;
    reflSprite.position.set(0, wy);
  }

  const ticker = new Ticker();
  ticker.maxFPS = 60; // don't double the work on 120 Hz screens
  let slowFrames = 0, fastFrames = 0;
  ticker.add(() => {
    const k = Math.min(ticker.deltaTime, 3);
    // adaptive quality: if frames run long (under ~50 fps) while busy, thin out the particles
    if (parts.length > 200) {
      if (ticker.deltaMS > 20) { slowFrames++; fastFrames = 0; } else { fastFrames++; slowFrames = Math.max(0, slowFrames - 1); }
      if (slowFrames > 20) { quality = Math.max(.3, quality * .8); slowFrames = 0; }
      if (fastFrames > 240 && quality < maxQuality) { quality = Math.min(maxQuality, quality * 1.1); fastFrames = 0; }
    }
    const w = W(), h = H();

    if (embers && Math.random() < .1 * k * quality) {
      spark(rand(0, w), h + 4, rand(-.3, .3), rand(-1.6, -.7), pick(FLAME),
        { g: -.004, f: .995, decay: rand(.004, .008), size: rand(1.1, 2.3), tw: true });
    }

    updateEmitters(k);
    updateTargets(k);
    if (pots.length) { const gy = groundY(); for (const p of pots) p.body.y = gy; }

    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.life -= .07 * k;
      if (f.life <= 0) { release(f.sp); flashes.splice(i, 1); continue; }
      const sc = (f.r * (2 - f.life) * 2) / 64;
      f.sp.position.set(f.x, f.y);
      f.sp.scale.set(sc);
      f.sp.alpha = .6 * f.life;
    }

    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i];
      s.x += s.vx * k; s.y += s.vy * k; s.vy += s.g * k;
      s.sp.tint = 0xfff6d0;
      s.sp.position.set(s.x, s.y);
      s.sp.rotation = Math.atan2(s.vy, s.vx);
      s.sp.scale.set(.18 * (1 + Math.abs(s.vy) * .25), .16);
      s.sp.alpha = 1;
      spark(s.x, s.y, rand(-.4, .4), rand(.2, 1.2), pick(FLAME), { decay: rand(.04, .07), size: rand(1.1, 1.9), g: .02 });
      if (s.vy >= -.4) {
        release(s.sp);
        shells.splice(i, 1);
        burst(s.x, s.y, s.opts);
        if (auto(s.opts)) audio.boom(false, panOf(s.x));
      }
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      const fk = Math.pow(p.f, k);
      p.vx *= fk;
      p.vy = p.vy * fk + p.g * k;
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.life -= p.decay * k;

      if (p.life <= 0 || p.y > h + 30 || p.y > p.floor) {
        if (p.split && p.life <= 0) {
          // crossette: each star splits into four
          for (let j = 0; j < 4; j++) {
            const a = j * Math.PI / 2 + rand(-.3, .3), s = rand(2.5, 3.5) * S();
            spark(p.x, p.y, Math.cos(a) * s, Math.sin(a) * s, p.color, { decay: rand(.02, .03), trail: 3 });
          }
        }
        release(p.sp);
        parts[i] = parts[parts.length - 1];
        parts.pop();
        continue;
      }

      if (p.trail && (p.t += k) >= p.trail) {
        p.t = 0;
        spark(p.x, p.y, 0, 0, p.color, { decay: .06, size: p.size * .55, g: .015, f: .9 });
      }

      const speed = Math.hypot(p.vx, p.vy);
      const b = (p.size * 3.4 / 64) * (.55 + .45 * p.life);
      p.sp.position.set(p.x, p.y);
      p.sp.rotation = Math.atan2(p.vy, p.vx);
      p.sp.scale.set(b * (1 + speed * .5), b);
      p.sp.alpha = p.tw && Math.random() < .45 ? p.life * .15 : p.life;
    }

    // only hand a frame to the GPU when something is on screen (plus one to clear the last one)
    const active = parts.length || shells.length || flashes.length || emitters.length || targets.length;
    if (reflection && (active || drewLast)) drawReflection();
    if (active || drewLast) app.render();
    drewLast = !!active;
  });
  ticker.start();

  return {
    spark, burst, launchShell, flowerPot, chakra, pop, ladi, stopGround, clearPots, clearSky, waterfall, spawnTarget, hit, clearTargets,
    setQuiet(v) { quiet = v; },
    get targetCount() { return targets.length; },
    setEmbers(v) { embers = v; },
    get width() { return W(); },
    get height() { return H(); },
    get scale() { return S(); },
  };
}
