// Background sky on a single 2D canvas: sweeping searchlight beams, soft bokeh lights and twinkling stars.
// One canvas layer instead of ~80 separately composited DOM elements keeps phones cool. It redraws at
// ~24 fps: everything here moves slowly, so the difference is invisible while the GPU work halves.

const rand = (a, b) => a + Math.random() * (b - a);

function beamImage(color) {
  const w = 160, h = 600;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, h, 0, 0);
  grad.addColorStop(0, color);
  grad.addColorStop(.8, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  // a few widening passes give the beam soft edges without a blur filter
  for (let i = 0; i < 5; i++) {
    const top = w * (.18 + i * .08), base = 3 + i * 2;
    g.globalAlpha = .22;
    g.beginPath();
    g.moveTo(w / 2 - base, h); g.lineTo(w / 2 + base, h);
    g.lineTo(w / 2 + top, 0); g.lineTo(w / 2 - top, 0);
    g.closePath(); g.fill();
  }
  return c;
}

function blobImage(color) {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return c;
}

export function createSky(canvas, { reducedMotion = false } = {}) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const beams = [
    { img: beamImage('rgba(255,207,107,1)'), x: .12, speed: .00011, phase: 1.2, alpha: .16 },
    { img: beamImage('rgba(155,92,255,1)'), x: .5, speed: .00008, phase: 3.4, alpha: .15 },
    { img: beamImage('rgba(255,79,154,1)'), x: .88, speed: .0001, phase: 0, alpha: .15 },
  ];
  const blobColors = ['rgba(255,207,107,1)', 'rgba(255,79,154,1)', 'rgba(123,92,255,1)', 'rgba(59,232,255,1)', 'rgba(255,159,28,1)'];
  const blobs = blobColors.concat(blobColors[0]).map((c) => ({
    img: blobImage(c), x: rand(0, 1), y: rand(.05, .85), r: rand(25, 75), a: rand(.12, .28),
    dx: rand(-60, 60), dy: rand(-80, 40), sp: rand(.00005, .0001), ph: rand(0, 6),
  }));
  let stars = [];

  function resize() {
    dpr = 1; // soft glows and 1px stars look the same at 1x, at a fraction of the pixels
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(80, (W * H) / 5500));
    stars = Array.from({ length: n }, () => ({ x: rand(0, W), y: rand(0, H * .72), s: rand(.6, 1.5), sp: rand(.0012, .003), ph: rand(0, 6) }));
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    for (const b of beams) {
      const rot = reducedMotion ? 0 : Math.sin(t * b.speed + b.phase) * .45;
      const bh = H * 1.25, bw = Math.max(W * .55, 260);
      ctx.save();
      ctx.translate(W * b.x, H + 20);
      ctx.rotate(rot);
      ctx.globalAlpha = b.alpha;
      ctx.drawImage(b.img, -bw / 2, -bh, bw, bh);
      ctx.restore();
    }
    for (const o of blobs) {
      const k = reducedMotion ? 0 : Math.sin(t * o.sp + o.ph);
      ctx.globalAlpha = o.a;
      ctx.drawImage(o.img, o.x * W + k * o.dx - o.r, o.y * H + k * o.dy - o.r, o.r * 2, o.r * 2);
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = reducedMotion ? .6 : .15 + .8 * (.5 + .5 * Math.sin(t * s.sp + s.ph));
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  let last = 0;
  function loop(t) {
    if (t - last >= 40) { last = t; draw(t); } // ~24 fps is plenty for slow sweeps and twinkles
    if (!reducedMotion) requestAnimationFrame(loop);
  }

  resize();
  addEventListener('resize', () => { resize(); draw(performance.now()); });
  draw(performance.now());
  requestAnimationFrame(loop);
}
