// Every sound is synthesised with Web Audio, so there are no audio files to load.
const rand = (a, b) => a + Math.random() * (b - a);
const CHIME = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]; // C major pentatonic

let ac = null, out = null, nb = null, on = true;

function unlock() {
  try {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      out = ac.createDynamicsCompressor();
      out.connect(ac.destination);
      nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const d = nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume();
  } catch {
    ac = null;
  }
}

const ok = () => on && ac && ac.state === 'running';
const noise = () => { const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; return s; };

function whoosh(dur = 1.1, vol = .16) {
  if (!ok()) return;
  const t = ac.currentTime, s = noise(), f = ac.createBiquadFilter(), g = ac.createGain();
  f.type = 'bandpass'; f.Q.value = 5;
  f.frequency.setValueAtTime(350, t);
  f.frequency.exponentialRampToValueAtTime(3200, t + dur);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * .7);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(out);
  s.start(t, Math.random()); s.stop(t + dur + .05);
}

function boom(big = false) {
  if (!ok()) return;
  const t = ac.currentTime, len = big ? 1.8 : 1.1;
  const s = noise(), f = ac.createBiquadFilter(), g = ac.createGain();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(big ? 1500 : 1000, t);
  f.frequency.exponentialRampToValueAtTime(70, t + len);
  g.gain.setValueAtTime(big ? .9 : rand(.2, .35), t);
  g.gain.exponentialRampToValueAtTime(.001, t + len);
  s.connect(f); f.connect(g); g.connect(out);
  s.start(t, Math.random()); s.stop(t + len + .1);

  // crackle
  const n = big ? 40 : 12;
  for (let i = 0; i < n; i++) {
    const ct = t + .2 + Math.random() * (big ? 1.4 : .8);
    const cs = noise(), hf = ac.createBiquadFilter(), cg = ac.createGain();
    hf.type = 'highpass'; hf.frequency.value = 2500 + Math.random() * 3500;
    cg.gain.setValueAtTime(.0001, ct);
    cg.gain.linearRampToValueAtTime((big ? .28 : .12) * Math.random(), ct + .003);
    cg.gain.exponentialRampToValueAtTime(.0001, ct + .03 + Math.random() * .04);
    cs.connect(hf); hf.connect(cg); cg.connect(out);
    cs.start(ct, Math.random()); cs.stop(ct + .1);
  }
}

function chime(step = 0) {
  if (!ok()) return;
  const t = ac.currentTime, freq = CHIME[Math.min(step, CHIME.length - 1)];
  [[1, .22, 'sine'], [2, .06, 'triangle'], [3, .03, 'sine']].forEach(([mult, vol, type]) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq * mult;
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + 1.4);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + 1.5);
  });
}

export const audio = {
  unlock, whoosh, boom, chime,
  toggle() { on = !on; return on; },
};
