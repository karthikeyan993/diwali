// Every sound is synthesised with Web Audio, so there are no audio files to load.
// Textures that would be expensive to build per sound (crackle, fuse sizzle, outdoor echo) are rendered
// once into buffers when audio unlocks and then replayed with small variations, which keeps phones cool.
const rand = (a, b) => a + Math.random() * (b - a);
const CHIME = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]; // C major pentatonic

let ac = null, master = null, dry = null, verb = null, on = true;
let noiseBuf, crackleBuf, sizzleBuf;

/* ---------- one-time buffers ---------- */
function makeNoise(sec) {
  const b = ac.createBuffer(1, ac.sampleRate * sec, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
/** Glittering crackle: hundreds of tiny clicks that thin out over ~2s, spread across left and right */
function makeCrackle(sec = 2.4) {
  const sr = ac.sampleRate, n = sr * sec, b = ac.createBuffer(2, n, sr);
  const L = b.getChannelData(0), R = b.getChannelData(1);
  for (let c = 0; c < 240; c++) {
    const t = .05 + Math.pow(Math.random(), 1.5) * (sec - .3);
    const start = Math.floor(t * sr), len = Math.floor(rand(40, 200));
    const amp = rand(.15, 1) * Math.pow(1 - t / sec, .6);
    const side = Math.random(), aL = side < .5 ? amp : amp * rand(.1, .5), aR = side >= .5 ? amp : amp * rand(.1, .5);
    for (let j = 0; j < len && start + j < n; j++) {
      const e = Math.exp(-j / (len / 4)), v = (Math.random() * 2 - 1) * e;
      L[start + j] += v * aL; R[start + j] += v * aR;
    }
  }
  return b;
}
/** Fuse / flower-pot sizzle: a soft hiss full of irregular sputters */
function makeSizzle(sec = 2) {
  const sr = ac.sampleRate, n = sr * sec, b = ac.createBuffer(1, n, sr), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * .12;
  let i = 0;
  while (i < n) {
    const len = Math.floor(rand(20, 140)), amp = rand(.2, .85);
    for (let j = 0; j < len && i + j < n; j++) d[i + j] += (Math.random() * 2 - 1) * amp * Math.exp(-j / (len / 3));
    i += Math.floor(rand(60, 900));
  }
  return b;
}
/** Outdoor echo: a decaying stereo noise impulse for the convolver */
function makeImpulse(sec = 2.6) {
  const sr = ac.sampleRate, n = sr * sec, b = ac.createBuffer(2, n, sr);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.4);
  }
  return b;
}

function unlock() {
  try {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      // glue compressor -> brick-wall limiter -> a little headroom, so a busy sky never distorts
      master = ac.createDynamicsCompressor();
      master.threshold.value = -14; master.ratio.value = 6;
      const limiter = ac.createDynamicsCompressor();
      limiter.threshold.value = -4; limiter.knee.value = 0; limiter.ratio.value = 20;
      limiter.attack.value = .001; limiter.release.value = .12;
      const level = ac.createGain(); level.gain.value = .82;
      master.connect(limiter); limiter.connect(level); level.connect(ac.destination);
      dry = ac.createGain(); dry.connect(master);
      const conv = ac.createConvolver(); conv.buffer = makeImpulse();
      const wet = ac.createGain(); wet.gain.value = .32;
      verb = ac.createGain(); verb.connect(conv); conv.connect(wet); wet.connect(master);
      noiseBuf = makeNoise(2); crackleBuf = makeCrackle(); sizzleBuf = makeSizzle();
    }
    if (ac.state === 'suspended') ac.resume();
  } catch {
    ac = null;
  }
}

const ok = () => on && ac && ac.state === 'running';

/* ---------- small helpers ---------- */
function src(buf, loop = false, rate = 1) {
  const s = ac.createBufferSource();
  s.buffer = buf; s.loop = loop; s.playbackRate.value = rate;
  return s;
}
function filter(type, freq, q = .7) {
  const f = ac.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  return f;
}
/** route a node to the speakers, panned (-1..1), with some of it sent into the echo */
function send(node, pan = 0, wet = .3) {
  let last = node;
  if (ac.createStereoPanner) {
    const p = ac.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    node.connect(p); last = p;
  }
  last.connect(dry);
  if (wet > 0) { const w = ac.createGain(); w.gain.value = wet; last.connect(w); w.connect(verb); }
}
/** gain envelope: quick attack to `peak`, exponential fall to silence at `end` */
function env(g, t, peak, attack, end) {
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, .0002), t + attack);
  g.gain.exponentialRampToValueAtTime(.0001, end);
}

/* ---------- sounds ---------- */

/** The lit fuse: crackling sizzle with the odd spit, for `dur` seconds */
function fuse(dur = 2) {
  if (!ok()) return;
  const t = ac.currentTime;
  const s = src(sizzleBuf, true, rand(.95, 1.1)), hp = filter('highpass', 1600), pk = filter('peaking', 4200, 1.2), g = ac.createGain();
  pk.gain.value = 6;
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(.55, t + .06);
  g.gain.setValueAtTime(.55, t + dur - .12);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(hp); hp.connect(pk); pk.connect(g); send(g, -.1, .12);
  s.start(t, Math.random() * 1.5); s.stop(t + dur + .05);
  for (let i = 0; i < 5; i++) popAt(t + rand(.1, dur - .1), rand(.08, .18), rand(-.3, .2), 2600);
}

/** Rocket lift-off: an ignition "fwoomp", then a roar and a rising whistle that fade as it climbs */
function launch(lift = .45, dur = 1.3) {
  if (!ok()) return;
  const t = ac.currentTime, t1 = t + lift, end = t1 + dur;
  // ignition: a soft thud plus fierce sizzle while it shudders in the bottle
  { const s = src(noiseBuf), lp = filter('lowpass', 700), g = ac.createGain();
    env(g, t, .5, .02, t + .4); s.connect(lp); lp.connect(g); send(g, 0, .2); s.start(t, Math.random()); s.stop(t + .45); }
  { const s = src(sizzleBuf, true, 1.25), hp = filter('highpass', 1200), g = ac.createGain();
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.5, t + .05);
    g.gain.setValueAtTime(.5, t1); g.gain.exponentialRampToValueAtTime(.0001, t1 + .35);
    s.connect(hp); hp.connect(g); send(g, 0, .1); s.start(t, Math.random()); s.stop(t1 + .4); }
  // thrust roar: bright at lift-off, duller and quieter as it gets further away
  { const s = src(noiseBuf, true), bp = filter('bandpass', 500, 1.1), lp = filter('lowpass', 7000), g = ac.createGain();
    bp.frequency.setValueAtTime(450, t1); bp.frequency.exponentialRampToValueAtTime(1900, end);
    lp.frequency.setValueAtTime(7000, t1); lp.frequency.exponentialRampToValueAtTime(1400, end);
    g.gain.setValueAtTime(.0001, t1); g.gain.exponentialRampToValueAtTime(.75, t1 + .1); g.gain.exponentialRampToValueAtTime(.0001, end);
    s.connect(bp); bp.connect(lp); lp.connect(g); send(g, 0, .25); s.start(t1, Math.random()); s.stop(end + .05); }
  // the whistle, sliding up with a little wobble
  { const o = ac.createOscillator(), o2 = ac.createOscillator(), vib = ac.createOscillator(), vg = ac.createGain(), g = ac.createGain(), g2 = ac.createGain();
    o.type = 'sine'; o2.type = 'triangle';
    o.frequency.setValueAtTime(760, t1); o.frequency.exponentialRampToValueAtTime(2600, end);
    o2.frequency.setValueAtTime(1520, t1); o2.frequency.exponentialRampToValueAtTime(5200, end);
    vib.frequency.value = 17; vg.gain.value = 28; vib.connect(vg); vg.connect(o.frequency);
    env(g, t1, .14, .18, end); env(g2, t1, .03, .18, end);
    o.connect(g); o2.connect(g2); send(g, 0, .35); send(g2, 0, .35);
    for (const n of [o, o2, vib]) { n.start(t1); n.stop(end + .05); }
  }
}

/** Shell launch from the ground: a short swish, sometimes with a little whistle */
function whoosh(dur = 1.1, vol = .16, pan = 0) {
  if (!ok()) return;
  const t = ac.currentTime, s = src(noiseBuf, true), f = filter('bandpass', 350, 4), g = ac.createGain();
  f.frequency.setValueAtTime(350, t); f.frequency.exponentialRampToValueAtTime(3000, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * .6); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); send(g, pan, .15);
  s.start(t, Math.random()); s.stop(t + dur + .05);
  if (Math.random() < .35) {
    const o = ac.createOscillator(), og = ac.createGain();
    o.frequency.setValueAtTime(rand(900, 1300), t); o.frequency.exponentialRampToValueAtTime(rand(2200, 3200), t + dur);
    env(og, t, vol * .35, .2, t + dur);
    o.connect(og); send(og, pan, .3); o.start(t); o.stop(t + dur + .05);
  }
}

/** A firework bursting: crack + chest thump + rumbling body, an echo, and a glittering crackle after */
function boom(big = false, pan = 0) {
  if (!ok()) return;
  const t = ac.currentTime, vol = big ? 1 : rand(.35, .6), len = big ? 2.3 : rand(1.1, 1.5);
  // crack
  { const s = src(noiseBuf), hp = filter('highpass', 1400), g = ac.createGain();
    env(g, t, vol * .9, .003, t + .06); s.connect(hp); hp.connect(g); send(g, pan, .5); s.start(t, Math.random()); s.stop(t + .08); }
  // thump: a falling low tone you feel more than hear
  { const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(big ? 78 : rand(80, 120), t); o.frequency.exponentialRampToValueAtTime(36, t + .55);
    env(g, t, vol * (big ? .95 : .5), .005, t + .65); o.connect(g); send(g, pan * .5, .2); o.start(t); o.stop(t + .7); }
  // body: the rolling boom
  { const s = src(noiseBuf, true), lp = filter('lowpass', big ? 1800 : rand(1100, 1500)), g = ac.createGain();
    lp.frequency.setValueAtTime(lp.frequency.value, t); lp.frequency.exponentialRampToValueAtTime(80, t + len);
    env(g, t, vol * .7, .01, t + len); s.connect(lp); lp.connect(g); send(g, pan, big ? .7 : .45);
    s.start(t, Math.random()); s.stop(t + len + .05); }
  // glitter crackle afterwards
  if (big || Math.random() < .6) {
    const ct = t + rand(.18, .35), rate = rand(.85, 1.25);
    const s = src(crackleBuf, false, rate), hp = filter('highpass', 1700), g = ac.createGain();
    g.gain.value = vol * (big ? .6 : .32);
    s.connect(hp); hp.connect(g); send(g, pan * .6, .3);
    s.start(ct); s.stop(ct + crackleBuf.duration / rate);
  }
}

function popAt(t, vol, pan = 0, freq = rand(1200, 2200)) {
  const s = src(noiseBuf), f = filter('bandpass', freq, .9), g = ac.createGain();
  env(g, t, vol, .002, t + .09); s.connect(f); f.connect(g); send(g, pan, .25);
  s.start(t, Math.random()); s.stop(t + .12);
  const o = ac.createOscillator(), og = ac.createGain();
  o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(80, t + .08);
  env(og, t, vol * .4, .003, t + .1); o.connect(og); send(og, pan, 0); o.start(t); o.stop(t + .12);
}
/** Small cracker pop */
function pop(loud = false, pan = 0) {
  if (!ok()) return;
  popAt(ac.currentTime, loud ? .8 : rand(.3, .5), pan);
}

/** Flower pots and chakras: a steady sputtering fizz; `flutter` adds the chakra's whirr */
function hiss(dur = 5, vol = .05, flutter = false, pan = 0) {
  if (!ok()) return;
  const t = ac.currentTime, s = src(sizzleBuf, true, rand(.85, 1.05)), f = filter('bandpass', flutter ? 3200 : 4300, .6), g = ac.createGain();
  const peak = vol * 3.2;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + .3);
  g.gain.setValueAtTime(peak, t + dur - .7); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); send(g, pan, .15);
  if (flutter) {
    const lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = 11; lg.gain.value = 900;
    lfo.connect(lg); lg.connect(f.frequency);
    lfo.start(t); lfo.stop(t + dur);
  }
  s.start(t, Math.random() * 1.5); s.stop(t + dur + .05);
}

function chime(step = 0) {
  if (!ok()) return;
  const t = ac.currentTime, freq = CHIME[Math.min(step, CHIME.length - 1)];
  [[1, .22, 'sine'], [2, .06, 'triangle'], [3, .03, 'sine']].forEach(([mult, vol, type]) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq * mult;
    env(g, t, vol, .01, t + 1.4);
    o.connect(g); send(g, 0, .25);
    o.start(t); o.stop(t + 1.5);
  });
}

export const audio = {
  unlock, fuse, launch, whoosh, boom, pop, hiss, chime,
  toggle() { on = !on; return on; },
};
