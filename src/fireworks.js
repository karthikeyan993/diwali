// WebGL fireworks engine built on PixiJS.
// Every particle is an additive-blended glow sprite, stretched along its velocity so it reads as a streak.
import { Application, Container, Sprite, Texture } from 'pixi.js';
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
  return { spark: noop, burst: noop, launchShell: noop, setEmbers: noop, width: innerWidth, height: innerHeight, scale: 1 };
}

export async function createFireworks(host, { quality = 1 } = {}) {
  const app = new Application();
  try {
    await app.init({
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: false,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
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
  const layer = new Container();
  app.stage.addChild(layer);

  const pool = [], parts = [], shells = [], flashes = [];
  const MAX = Math.round(3200 * quality) + 300;
  let embers = true;

  const W = () => app.screen.width;
  const H = () => app.screen.height;
  const S = () => Math.max(.75, Math.min(1.5, Math.min(W(), H()) / 420));

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
    if (parts.length >= MAX) return;
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
    if (fl > 0) flash(x, y, fl * S());
  }

  function launchShell(tx, ty, opts = {}) {
    const sx = tx + rand(-W() * .08, W() * .08), sy = H() + 10, g = .12 * S();
    const vy = -Math.sqrt(2 * g * Math.max(60, sy - ty));
    const frames = -vy / g;
    shells.push({ x: sx, y: sy, vx: (tx - sx) / frames, vy, g, opts, sp: sprite() });
    if (!opts.silent) audio.whoosh(rand(.7, 1), .05);
  }

  app.ticker.add((ticker) => {
    const k = Math.min(ticker.deltaTime, 3);
    const w = W(), h = H();

    if (embers && Math.random() < .22 * k * quality) {
      spark(rand(0, w), h + 4, rand(-.3, .3), rand(-1.6, -.7), pick(FLAME),
        { g: -.004, f: .995, decay: rand(.004, .008), size: rand(1.1, 2.3), tw: true });
    }

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
        if (!s.opts.silent) audio.boom(false);
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

      if (p.life <= 0 || p.y > h + 30) {
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
  });

  return {
    spark, burst, launchShell,
    setEmbers(v) { embers = v; },
    get width() { return W(); },
    get height() { return H(); },
    get scale() { return S(); },
  };
}
