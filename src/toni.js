// Toni's drawing and the shared exercise list, used by every window.
const TONI_SVG = `
  <svg class="toni pose-idle" viewBox="0 0 200 300" aria-hidden="true">
    <defs>
      <filter id="sticker" x="-30%" y="-20%" width="160%" height="140%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="7" result="grow"/>
        <feFlood flood-color="#fff"/>
        <feComposite in2="grow" operator="in" result="white"/>
        <feOffset in="grow" dx="4" dy="6" result="off"/>
        <feGaussianBlur in="off" stdDeviation="2" result="blur"/>
        <feFlood flood-color="#000" flood-opacity=".13"/>
        <feComposite in2="blur" operator="in" result="shadow"/>
        <feMerge><feMergeNode in="shadow"/><feMergeNode in="white"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#sticker)">
      <g class="motion ink" stroke-width="4">
        <line x1="34" y1="100" x2="50" y2="100"/><line x1="26" y1="124" x2="46" y2="124"/><line x1="34" y1="148" x2="50" y2="148"/>
      </g>
      <!-- legs -->
      <g class="leg leg-l"><g class="sw"><path class="ink" stroke-width="13" d="M0 0 L-2 60"/><ellipse cx="-9" cy="68" rx="17" ry="10" fill="var(--ink)"/></g></g>
      <g class="leg leg-r"><g class="sw"><path class="ink" stroke-width="13" d="M0 0 L2 60"/><ellipse cx="9" cy="68" rx="17" ry="10" fill="var(--ink)"/></g></g>
      <g class="bodygrp">
        <!-- arms sit behind the tube -->
        <g class="arm arm-l"><g class="sw"><path class="ink" stroke-width="12" d="M0 0 Q-4 26 0 50"/><circle cx="0" cy="54" r="9" fill="var(--ink)"/></g></g>
        <g class="arm arm-r"><g class="sw"><path class="ink" stroke-width="12" d="M0 0 Q4 26 0 50"/><circle cx="0" cy="54" r="9" fill="var(--ink)"/>
          <rect class="thumb-up" x="-3" y="58" width="7" height="14" rx="3.5" fill="var(--ink)"/></g></g>
        <g class="arms-up">
          <path class="ink" stroke-width="12" d="M64 124 Q28 108 40 46"/><circle cx="44" cy="40" r="9" fill="var(--ink)"/>
          <path class="ink" stroke-width="12" d="M136 124 Q172 108 160 46"/><circle cx="156" cy="40" r="9" fill="var(--ink)"/>
        </g>
        <!-- tube -->
        <rect x="60" y="40" width="80" height="164" rx="13" fill="var(--body)"/>
        <rect x="66" y="58" width="9" height="136" rx="4.5" fill="var(--light)" opacity=".9"/>
        <rect x="126" y="56" width="9" height="140" rx="4.5" fill="var(--shade)"/>
        <g stroke="var(--ridges)" stroke-width="3.4" stroke-linecap="round">
          <line x1="84" y1="60" x2="84" y2="194"/><line x1="100" y1="62" x2="100" y2="196"/><line x1="116" y1="60" x2="116" y2="194"/>
        </g>
        <!-- open top -->
        <ellipse cx="100" cy="44" rx="38" ry="11" fill="var(--light)"/>
        <ellipse cx="100" cy="45" rx="34" ry="8.6" fill="#B47826"/>
        <ellipse cx="100" cy="47.5" rx="26" ry="5" fill="#9A6520"/>
        <path d="M70 45 Q100 56 130 45" stroke="var(--ridges)" stroke-width="2" fill="none" opacity=".7"/>
        <rect x="60" y="40" width="80" height="164" rx="13" class="ink" stroke-width="6"/>
        <ellipse cx="100" cy="44" rx="38" ry="11" class="ink" stroke-width="5"/>
        <!-- front face -->
        <g class="front">
          <ellipse cx="80" cy="110" rx="8.5" ry="6" fill="var(--blush)"/>
          <ellipse cx="120" cy="110" rx="8.5" ry="6" fill="var(--blush)"/>
          <g class="eyes">
            <ellipse cx="88" cy="94" rx="5.6" ry="7" fill="var(--ink)"/><ellipse cx="112" cy="94" rx="5.6" ry="7" fill="var(--ink)"/>
            <circle cx="89.8" cy="91" r="2" fill="#fff"/><circle cx="113.8" cy="91" r="2" fill="#fff"/>
          </g>
          <path d="M89 106 Q100 108 111 106 Q109 120 100 120 Q91 120 89 106 Z" fill="var(--ink)"/>
        </g>
        <!-- side face, for chin tucks -->
        <g class="profile">
          <ellipse cx="124" cy="110" rx="7" ry="5.5" fill="var(--blush)"/>
          <g class="eyes"><ellipse cx="126" cy="94" rx="5" ry="6.6" fill="var(--ink)"/><circle cx="127.6" cy="91" r="1.8" fill="#fff"/></g>
          <path d="M127 108 Q133 113 138 107" class="ink" stroke-width="3.4"/>
        </g>
      </g>
      <g class="arrow"><path d="M182 98 H160 M168 90 L159 98 L168 106" stroke="#E0482B" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
    </g>
  </svg>`;

let toniCount = 0;
function makeToni() {
  const holder = document.createElement("div");
  holder.innerHTML = TONI_SVG.trim();
  const s = holder.firstElementChild;
  const fid = "sticker" + (++toniCount);
  s.querySelector("filter").id = fid;
  s.querySelector("[filter]").setAttribute("filter", `url(#${fid})`);
  return s;
}

function setPose(svg, pose) {
  svg.setAttribute("class", "toni pose-" + pose);
}

const EXERCISES = [
  { id: "chin", title: "Chin tucks", desc: "Slide your head straight back, like a double chin.", reps: "10 slow reps", secs: 45, pose: "chin",
    steps: ["Sit tall, eyes level with the screen.", "Glide your chin straight back. Don't tip it down.", "Hold for 2 seconds, then release. Repeat 10 times."] },
  { id: "neck", title: "Neck side stretch", desc: "Ear toward shoulder, other shoulder stays down.", reps: "20 sec each side", secs: 40, pose: "neck",
    steps: ["Drop your right ear toward your right shoulder.", "Keep the left shoulder heavy. Breathe.", "After 20 seconds, switch sides."] },
  { id: "walk", title: "Walkaround", desc: "Get up and walk. Refill your water, rest your eyes.", reps: "2 min", secs: 120, pose: "walk",
    steps: ["Stand up and walk away from the desk.", "Look at something far away.", "Refill your water on the way back."] },
  { id: "thoracic", title: "Thoracic extension", desc: "Hands behind your head, arch your upper back over the chair.", reps: "10 reps", secs: 40, pose: "stretch",
    steps: ["Lace your fingers behind your head.", "Lean back over the top of the chair, elbows wide.", "Return to upright. Repeat 10 times."] },
];

const POSES = [["idle", "Idle"], ["wave", "Wave"], ["stretch", "Stretch"], ["chin", "Chin tuck"], ["neck", "Neck side"], ["walk", "Walk"], ["thumbs", "Thumbs up"]];

function chime(notes = [660, 880]) {
  try {
    const ctx = new AudioContext();
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * 0.16;
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.55);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {}
}
