// Every sound is synthesised with Web Audio, so there are no audio files to load.
// Textures that would be expensive to build per sound (crackle, fuse sizzle, outdoor echo) are rendered
// once into buffers when audio unlocks and then replayed with small variations, which keeps phones cool.
const rand = (a, b) => a + Math.random() * (b - a);
const CHIME = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]; // C major pentatonic

let ac = null, master = null, bus = null, dry = null, verb = null, on = true;
let noiseBuf, crackleBuf, sizzleBuf, impulseBuf;

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
      const level = ac.createGain(); level.gain.value = .72;
      master.connect(limiter); limiter.connect(level); level.connect(ac.destination);
      impulseBuf = makeImpulse();
      noiseBuf = makeNoise(2); crackleBuf = makeCrackle(); sizzleBuf = makeSizzle();
      newBus();
    }
    if (ac.state === 'suspended') ac.resume();
  } catch {
    ac = null;
  }
}

const ok = () => on && ac && ac.state === 'running';

/** All sounds (and their echo) run through a bus. Cutting the sound drops the bus and starts a fresh one,
 *  which silences everything already playing or scheduled, including echo tails. */
function newBus() {
  bus = ac.createGain(); bus.connect(master);
  dry = ac.createGain(); dry.connect(bus);
  const conv = ac.createConvolver(); conv.buffer = impulseBuf;
  const wet = ac.createGain(); wet.gain.value = .32;
  verb = ac.createGain(); verb.connect(conv); conv.connect(wet); wet.connect(bus);
}
function stopAll() {
  if (!ac || !bus) return;
  const old = bus, t = ac.currentTime;
  old.gain.cancelScheduledValues(t);
  old.gain.setValueAtTime(old.gain.value, t);
  old.gain.linearRampToValueAtTime(0, t + .03); // a 30 ms fade avoids a click
  setTimeout(() => { try { old.disconnect(); } catch { /* already gone */ } }, 120);
  newBus();
}

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
  g.gain.exponentialRampToValueAtTime(.38, t + .06);
  g.gain.setValueAtTime(.38, t + dur - .12);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(hp); hp.connect(pk); pk.connect(g); send(g, -.1, .12);
  s.start(t, Math.random() * 1.5); s.stop(t + dur + .05);
  for (let i = 0; i < 5; i++) popAt(t + rand(.1, dur - .1), rand(.08, .18), rand(-.3, .2), 2600);
}

/** A smooth airy swish that rises and thins out as something climbs away (shared by rockets and shells) */
function swish(t, dur, vol, pan) {
  const s = src(noiseBuf, true), lp = filter('lowpass', 2600), bp = filter('bandpass', 520, .7), g = ac.createGain();
  bp.frequency.setValueAtTime(520, t); bp.frequency.exponentialRampToValueAtTime(1900, t + dur);
  lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(1500, t + dur);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(.35, dur * .3));
  g.gain.setValueAtTime(vol, t + dur * .55);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(bp); bp.connect(lp); lp.connect(g); send(g, pan, .3);
  s.start(t, Math.random()); s.stop(t + dur + .05);
}
/** A soft whistle gliding upward with a gentle wobble */
function whistle(t, dur, vol, pan, f0 = 820, f1 = 1900) {
  const o = ac.createOscillator(), vib = ac.createOscillator(), vg = ac.createGain(), g = ac.createGain(), lp = filter('lowpass', 3000);
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  vib.frequency.value = 9; vg.gain.value = 14; vib.connect(vg); vg.connect(o.frequency);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * .25);
  g.gain.setValueAtTime(vol, t + dur * .6);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(lp); lp.connect(g); send(g, pan, .4);
  o.start(t); vib.start(t); o.stop(t + dur + .05); vib.stop(t + dur + .05);
}

/** Rocket lift-off: a soft ignition, then a long smooth swish with a gentle whistle as it climbs */
function launch(lift = .45, dur = 1.8) {
  if (!ok()) return;
  const t = ac.currentTime, t1 = t + lift;
  // ignition: a muffled puff and a short fizz while it shudders in the bottle
  { const s = src(noiseBuf), lp = filter('lowpass', 500), g = ac.createGain();
    env(g, t, .28, .03, t + .35); s.connect(lp); lp.connect(g); send(g, 0, .25); s.start(t, Math.random()); s.stop(t + .4); }
  { const s = src(sizzleBuf, true, 1.15), hp = filter('highpass', 1800), g = ac.createGain();
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.3, t + .06);
    g.gain.setValueAtTime(.3, t1); g.gain.exponentialRampToValueAtTime(.0001, t1 + .4);
    s.connect(hp); hp.connect(g); send(g, 0, .1); s.start(t, Math.random()); s.stop(t1 + .45); }
  swish(t1, dur + .25, .42, 0);
  whistle(t1 + .08, dur, .07, 0, 760, 1700);
  // a faint sparkle trail
  { const s = src(sizzleBuf, true, 1.4), hp = filter('highpass', 4000), g = ac.createGain();
    env(g, t1, .07, .2, t1 + dur); s.connect(hp); hp.connect(g); send(g, 0, .2); s.start(t1, Math.random()); s.stop(t1 + dur + .05); }
}

/** Shell rising from the ground: the same swish, lighter, sometimes with a little whistle */
function whoosh(dur = 1.1, vol = .16, pan = 0) {
  if (!ok()) return;
  const t = ac.currentTime;
  swish(t, dur, vol, pan);
  if (Math.random() < .35) whistle(t, dur * .9, vol * .3, pan, rand(850, 1150), rand(1700, 2300));
}

/** A firework bursting, tuned for phone speakers: a soft crack, a warm "whump", a long echo, then glitter */
function boom(big = false, pan = 0) {
  if (!ok()) return;
  const t = ac.currentTime, vol = big ? .72 : rand(.22, .36), len = big ? 2.4 : rand(1.2, 1.6);
  // soft crack (band-limited, so it's a "pop" rather than a harsh click)
  { const s = src(noiseBuf), bp = filter('bandpass', 1700, .6), lp = filter('lowpass', 4200), g = ac.createGain();
    env(g, t, vol * .5, .004, t + .07); s.connect(bp); bp.connect(lp); lp.connect(g); send(g, pan, .6); s.start(t, Math.random()); s.stop(t + .09); }
  // warm whump in the range phone speakers can actually play
  { const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(big ? 140 : rand(150, 190), t); o.frequency.exponentialRampToValueAtTime(62, t + .45);
    env(g, t, vol * .45, .008, t + .55); o.connect(g); send(g, pan * .5, .3); o.start(t); o.stop(t + .6); }
  // body: a rolling boom that mostly lives in the echo
  { const s = src(noiseBuf, true), lp = filter('lowpass', big ? 1200 : rand(900, 1200)), g = ac.createGain();
    lp.frequency.setValueAtTime(lp.frequency.value, t); lp.frequency.exponentialRampToValueAtTime(90, t + len);
    env(g, t, vol * .5, .015, t + len); s.connect(lp); lp.connect(g); send(g, pan, .9);
    s.start(t, Math.random()); s.stop(t + len + .05); }
  // glitter crackle afterwards
  if (big || Math.random() < .6) {
    const ct = t + rand(.2, .38), rate = rand(.85, 1.2);
    const s = src(crackleBuf, false, rate), hp = filter('highpass', 2000), g = ac.createGain();
    g.gain.value = vol * (big ? .55 : .35);
    s.connect(hp); hp.connect(g); send(g, pan * .6, .35);
    s.start(ct); s.stop(ct + crackleBuf.duration / rate);
  }
}

/** Each floating cracker in the Chennai game has its own voice */
function cracker(kind, pan = 0) {
  if (!ok()) return;
  const t = ac.currentTime;
  if (kind === 'bomb') {
    // atom bomb: a deep round BOOM with a long echo
    { const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(50, t + .6);
      env(g, t, .32, .01, t + .7); o.connect(g); send(g, pan * .5, .4); o.start(t); o.stop(t + .75); }
    { const s = src(noiseBuf, true), lp = filter('lowpass', 900), g = ac.createGain();
      lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(70, t + 1.6);
      env(g, t, .32, .01, t + 1.6); s.connect(lp); lp.connect(g); send(g, pan, .9); s.start(t, Math.random()); s.stop(t + 1.65); }
  } else if (kind === 'lakshmi') {
    // Lakshmi cracker: a sharp DHAAM, then a short rattle of crackle
    { const s = src(noiseBuf), bp = filter('bandpass', 2300, .8), g = ac.createGain();
      env(g, t, .55, .002, t + .12); s.connect(bp); bp.connect(g); send(g, pan, .6); s.start(t, Math.random()); s.stop(t + .14); }
    { const s = src(noiseBuf, true), lp = filter('lowpass', 1800), g = ac.createGain();
      env(g, t, .3, .005, t + .5); s.connect(lp); lp.connect(g); send(g, pan, .6); s.start(t, Math.random()); s.stop(t + .55); }
    { const s = src(crackleBuf, false, 1.5), hp = filter('highpass', 1800), g = ac.createGain();
      g.gain.value = .35; s.connect(hp); hp.connect(g); send(g, pan, .3); s.start(t + .12); s.stop(t + .12 + crackleBuf.duration / 1.5); }
  } else {
    // rocket: a quick rising zip, then a bright pop
    whistle(t, .32, .12, pan, 1100, 3000);
    swish(t, .32, .18, pan);
    popAt(t + .3, .5, pan, 2000);
    { const s = src(crackleBuf, false, 1.3), hp = filter('highpass', 2400), g = ac.createGain();
      g.gain.value = .25; s.connect(hp); hp.connect(g); send(g, pan, .35); s.start(t + .34); s.stop(t + .34 + crackleBuf.duration / 1.3); }
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
  unlock, fuse, launch, whoosh, boom, cracker, pop, hiss, chime,
  stopAll,
  toggle() { on = !on; if (!on) stopAll(); return on; },
};
