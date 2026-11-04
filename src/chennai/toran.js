// Maavilai thoranam: a Tamil-style mango-leaf toran with hanging marigold strands and little brass bells.

const f = (n) => +n.toFixed(1);

const DEFS = `
<defs>
  <radialGradient id="mgO-g" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffb24d"/><stop offset=".7" stop-color="#f26b00"/><stop offset="1" stop-color="#b84300"/></radialGradient>
  <radialGradient id="mgY-g" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffe680"/><stop offset=".7" stop-color="#ffb000"/><stop offset="1" stop-color="#c47c00"/></radialGradient>
  <linearGradient id="leaf-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3fa34d"/><stop offset=".55" stop-color="#1f7a33"/><stop offset="1" stop-color="#0f4a1d"/></linearGradient>
  <linearGradient id="brass-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5a12"/><stop offset=".45" stop-color="#ffe08a"/><stop offset="1" stop-color="#9c6a16"/></linearGradient>
  ${['O', 'Y'].map((c) => `
  <symbol id="mg${c}" viewBox="-7 -7 14 14" overflow="visible">
    ${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<circle cx="${f(Math.cos(a) * 4)}" cy="${f(Math.sin(a) * 4)}" r="2.6" fill="url(#mg${c}-g)"/>`; }).join('')}
    ${Array.from({ length: 7 }, (_, i) => { const a = i / 7 * Math.PI * 2 + .3; return `<circle cx="${f(Math.cos(a) * 2)}" cy="${f(Math.sin(a) * 2)}" r="2.1" fill="url(#mg${c}-g)"/>`; }).join('')}
    <circle r="1.4" fill="${c === 'O' ? '#9a3a00' : '#a86a00'}"/>
  </symbol>`).join('')}
  <symbol id="leaf" viewBox="-6 0 12 28" overflow="visible">
    <path d="M0 0C6.5 6 6.5 18 0 28C-6.5 18 -6.5 6 0 0Z" fill="url(#leaf-g)"/>
    <path d="M0 1.5V26" stroke="#a7e59b" stroke-width=".6" opacity=".55"/>
  </symbol>
  <symbol id="bell" viewBox="-5 0 10 12" overflow="visible">
    <path d="M-4 9Q-4 2 0 1.5Q4 2 4 9H-4Z" fill="url(#brass-g)"/>
    <rect x="-4.6" y="8.6" width="9.2" height="1.6" rx=".8" fill="#c8922a"/>
    <circle cy="11" r="1.2" fill="#ffd166"/>
  </symbol>
</defs>`;

export function buildToran(el, W) {
  const gap = 20;
  const n = Math.ceil(W / gap) + 1;
  let strands = '', leaves = '';

  for (let i = 0; i < n; i++) {
    // marigold strand between each pair of leaves, lengths rising and falling like swags.
    // Each strand is its own little <svg> so its sway is a cheap GPU transform, not an SVG repaint.
    const x = i * gap + gap / 2;
    const len = 3 + Math.round(3 * (.5 + .5 * Math.cos((i / 6) * Math.PI * 2)));
    const h = f(22 + len * 8.6);
    let s = `<line x1="0" y1="4" x2="0" y2="${f(10 + len * 8.6)}" stroke="#c99a3a" stroke-width=".8"/>`;
    for (let k = 0; k < len; k++) {
      s += `<use href="#mg${(i + k) % 2 ? 'O' : 'Y'}" x="-5.8" y="${f(12 + k * 8.6 - 5.8)}" width="11.6" height="11.6"/>`;
    }
    s += `<use href="#bell" x="-4" y="${f(10 + len * 8.6)}" width="8" height="10"/>`;
    strands += `<svg class="strand" style="left:${x - 7}px;height:${h}px;--t:${f(2.6 + (i % 5) * .35)}s;--d:${f(-(i % 7) * .45)}s" width="14" viewBox="-7 0 14 ${h}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;

    // mango leaf hanging from the rope
    const lx = i * gap, rot = (i % 2 ? 7 : -7);
    leaves += `<use href="#leaf" x="${lx - 6}" y="3" width="12" height="28" transform="rotate(${rot} ${lx} 4)"/>`;
  }

  el.innerHTML = `${strands}
<svg class="toran-base" viewBox="0 0 ${W} 40" preserveAspectRatio="xMinYMin meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  ${DEFS}
  ${leaves}
  <rect x="0" y="1.5" width="${W}" height="4" fill="#8a5a1a"/>
  <rect x="0" y="1.5" width="${W}" height="4" fill="none" stroke="#e0b25a" stroke-width="1" stroke-dasharray="3 2" opacity=".8"/>
</svg>`;
}
