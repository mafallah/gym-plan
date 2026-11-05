#!/usr/bin/env node
// Builds the printable 4-day split (print/GB3-4-day-split.pdf) from the data below.
// Usage: NODE_PATH=$(npm root -g) node print/build-pdf.cjs
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const OUT_DIR = __dirname;
const HTML_FILE = path.join(OUT_DIR, "plan-4day.html");
const PDF_FILE = path.join(OUT_DIR, "GB3-4-day-split.pdf");

// ---------------------------------------------------------------- plan data

// Pulley heights, in cm above the floor, for a ~175 cm person.
const LEVELS = { TOP: 208, HEAD: 165, CHEST: 135, LOW: 40, BOTTOM: 10 };

const DAYS = [
  {
    n: 1, title: "Chest + Triceps", short: "Chest + Tri", weekday: "Monday", accent: "#b42318",
    focus: "Heavy upper-chest press first, while you're fresh. Just one triceps exercise: every press already works them.",
    cardio: { name: "Stationary bike", detail: "20 min, moderate (you can talk in short sentences)" },
    ex: [
      { name: "Incline dumbbell press", fa: "پرس بالا سینه دمبل", sets: "3 × 8–12", rest: "2 min", heavy: true,
        setup: "Bench at about 30° (a low incline, not 45°). Kick the dumbbells up off your thighs.",
        how: "Lower to your upper chest, elbows about 45° from your body (not flared). Press up and slightly in.",
        note: "Your 40 lb lift: at 3 × 12, go up 5 lb.",
        swap: "Incline machine press (handles start at upper-chest height)." },
      { name: "Machine chest press", fa: "پرس سینه دستگاه", sets: "3 × 10–12", rest: "90 s",
        setup: "Seat height so the handles line up with the middle of your chest.",
        how: "Shoulder blades back against the pad. Press out without slamming your elbows straight; take 2–3 s on the way back.",
        swap: "Flat dumbbell bench press." },
      { name: "Low-to-high cable fly", fa: "کراس اوور از پایین به بالا", sets: "3 × 12–15", rest: "60–90 s",
        cable: { level: "BOTTOM", levelText: "BOTTOM, both columns", attach: "2 single D-handles",
          stand: "Center of the station, 1 step forward, staggered feet", stance: "cross" },
        how: "Hands start low by your hips, palms forward, elbows slightly bent. Sweep up and in until your hands meet at chin height.",
        note: "Start light: 10–15 lb a side.",
        swap: "Pec deck (handles at chest height). Only one column free? Do one arm at a time." },
      { name: "Triceps rope pushdown", fa: "پشت بازو طناب", sets: "3 × 12–15", rest: "60 s",
        cable: { level: "TOP", levelText: "TOP, highest hole", attach: "Rope",
          stand: "Facing the machine, half a step back, slight forward lean", stance: "face" },
        how: "Elbows pinned to your sides. Push down until your arms are straight, spreading the rope ends apart. Elbows don't move.",
        note: "Weaker after pressing is normal.",
        swap: "Straight-bar pushdown (same setup, straight bar, palms down)." },
      { name: "Plank", fa: "پلانک", sets: "3 × 20–40 s", rest: "45 s", bonus: true,
        how: "Forearms under your shoulders, body in one straight line, glutes squeezed. Knees down if your lower back sags.",
        swap: "Dead bug, 3 × 8 slow reps per side." },
    ],
  },
  {
    n: 2, title: "Legs", short: "Legs", weekday: "Tuesday", accent: "#17703a",
    focus: "Machines only, joint-friendly. The leg press is the big one; everything after it is lighter.",
    cardio: { name: "Elliptical", detail: "20 min, easy to moderate" },
    ex: [
      { name: "Leg press", fa: "پرس پا دستگاه", sets: "4 × 10–15", rest: "2 min", heavy: true,
        setup: "Feet shoulder-width in the middle of the platform.",
        how: "Lower until your knees are at about 90° while your lower back stays on the pad. Push through your whole foot; don't lock your knees.",
        swap: "Smith machine squat, or goblet squat to a box." },
      { name: "Seated leg curl", fa: "پشت پا ماشین", sets: "3 × 12–15", rest: "90 s",
        setup: "Knees in line with the pivot dot. Thigh pad snug, ankle pad just above your heels.",
        how: "Curl all the way back, squeeze for 1 s, then lower slowly for 3 s.",
        swap: "Lying leg curl." },
      { name: "Leg extension", fa: "جلو پا ماشین", sets: "3 × 12–15", rest: "60–90 s",
        setup: "Knees in line with the pivot dot, ankle pad on your lower shin, back flat on the seat.",
        how: "Straighten your legs fully, squeeze for 1 s, lower slowly. Hold the side handles.",
        swap: "Leg press with your feet low and narrow on the platform." },
      { name: "Back extension (45° bench)", fa: "فیله کمر", sets: "3 × 12–15", rest: "60–90 s",
        setup: "Top of the pad just below your hip bones, so you bend at the hips.",
        how: "Arms crossed on your chest. Lower until your hamstrings stretch, then rise until your body is straight, not past it. Squeeze your glutes at the top.",
        swap: "Cable pull-through: BOTTOM pulley, rope, face away, straddle the cable, 2–3 steps out." },
      { name: "Seated calf raise", fa: "ساق پا نشسته", sets: "3 × 15", rest: "60 s", bonus: true,
        setup: "Pad snug on your lower thighs, balls of your feet on the edge of the step.",
        how: "All the way down (1 s stretch), all the way up (1 s squeeze).",
        swap: "Calf raises on the leg press." },
    ],
  },
  {
    n: 3, title: "Back + Biceps", short: "Back + Bi", weekday: "Thursday", accent: "#1d4ed8",
    focus: "Pull with your elbows, not your hands. Both curls use the same low pulley, so you only switch the handle.",
    cardio: { name: "Bike or elliptical", detail: "25 min, moderate" },
    ex: [
      { name: "Lat pulldown", fa: "زیر بغل سیم‌کش", sets: "3 × 10–12", rest: "2 min", heavy: true,
        cable: { level: "TOP", levelText: "Fixed at the top (nothing to set)", attach: "Long wide bar",
          stand: "Seated, thighs locked under the pad (set the pad first)", stance: "seated", fixed: true },
        how: "Hands a bit wider than your shoulders. Lean back slightly and pull the bar to your upper chest, elbows down to your ribs. Arms straight at the top.",
        swap: "Assisted pull-up machine." },
      { name: "Seated cable row", fa: "زیر بغل قایقی", sets: "3 × 10–12", rest: "90 s",
        cable: { level: "LOW", levelText: "Fixed low pulley (row station)", attach: "V-handle (close grip)",
          stand: "Seated, feet on the foot plate, knees slightly bent", stance: "seated", fixed: true },
        how: "Sit tall, chest up. Pull the handle to your belly button and squeeze your shoulder blades. Arms reach forward without rounding your back.",
        swap: "Single-arm cable row (CHEST-height pulley, D-handle, staggered feet)." },
      { name: "Machine row (chest pad)", fa: "زیر بغل قایقی دستگاه", sets: "3 × 10–12", rest: "90 s",
        setup: "Handles at mid-chest height; chest pad set so you reach them with straight arms.",
        how: "Chest stays on the pad. Pull your elbows back past your ribs, squeeze for 1 s, return slowly.",
        note: "Replaces the one-arm dumbbell row.",
        swap: "Chest-supported dumbbell row (face-down on a 30–45° bench)." },
      { name: "Cable curl", fa: "جلو بازو سیم‌کش", sets: "3 × 10–12", rest: "60–90 s",
        cable: { level: "BOTTOM", levelText: "BOTTOM, lowest hole", attach: "Straight bar (or EZ bar)",
          stand: "Facing the machine, about 1 foot back, feet hip-width", stance: "face" },
        how: "Elbows stay glued to your sides. Curl to shoulder height, then lower slowly for 3 s. Don't lean back to help.",
        swap: "EZ-bar curl." },
      { name: "Rope hammer curl", fa: "جلو بازو چکشی طناب", sets: "3 × 12", rest: "60 s", bonus: true,
        cable: { level: "BOTTOM", levelText: "BOTTOM, same as #4", attach: "Rope (unclip the bar, clip on the rope)",
          stand: "Same spot as #4", stance: "face" },
        how: "Palms face each other the whole time. Curl up, squeeze, lower slowly.",
        swap: "Dumbbell hammer curl." },
    ],
  },
  {
    n: 4, title: "Shoulders", short: "Shoulders", weekday: "Saturday", accent: "#6b21a8",
    focus: "Side delts (lateral raises) make shoulders look wider. They recover fast, so they get two exercises. Light weights, strict form.",
    cardio: { name: "Elliptical or bike", detail: "30 min, moderate (shortest weight day, so the longest cardio)" },
    ex: [
      { name: "Seated dumbbell shoulder press", fa: "پرس سرشانه دمبل", sets: "3 × 8–12", rest: "2 min", heavy: true,
        setup: "Bench upright, one notch back from vertical. Dumbbells start at chin level.",
        how: "Press up until your arms are straight (not locked), dumbbells slightly in front of your head. Lower to chin level; back stays on the pad.",
        swap: "Machine shoulder press (handles start at shoulder height)." },
      { name: "Dumbbell lateral raise", fa: "نشر جانب دمبل", sets: "3 × 12–15", rest: "60–90 s",
        setup: "Standing, feet hip-width, slight forward lean, light dumbbells.",
        how: "Raise your arms out to the sides up to shoulder height, elbows slightly bent, leading with your elbows. Lower slowly for 3 s.",
        swap: "Lateral raise machine." },
      { name: "Face pull", fa: "فیس پول طناب", sets: "3 × 15", rest: "60 s",
        cable: { level: "HEAD", levelText: "HEAD, forehead height", attach: "Rope",
          stand: "Facing the machine, 2 steps back, arms straight", stance: "face" },
        how: "Thumbs pointing back toward you. Pull to your forehead with elbows high and wide, spreading the rope ends past your ears. Squeeze 1 s.",
        swap: "Reverse pec deck (rear-delt machine)." },
      { name: "Single-arm cable lateral raise", fa: "نشر جانب سیم‌کش تک‌دست", sets: "3 × 12–15 each arm", rest: "60 s after both arms",
        cable: { level: "BOTTOM", levelText: "BOTTOM, lowest hole", attach: "1 D-handle",
          stand: "Side-on, 1 small step away, handle in the far hand", stance: "side" },
        how: "The cable crosses in front of your body. Raise your arm out to the side up to shoulder height, elbow slightly bent; lower for 3 s.",
        note: "Lighter than dumbbells.",
        swap: "Seated dumbbell lateral raise." },
      { name: "Overhead cable triceps extension", fa: "پشت بازو طناب از پشت سر", sets: "3 × 12–15", rest: "60 s", bonus: true,
        cable: { level: "CHEST", levelText: "CHEST, mid-chest height", attach: "Rope",
          stand: "Facing away, 1 big step forward, staggered feet, slight lean", stance: "away" },
        how: "Elbows by your ears, hands behind your head. Straighten your arms forward and up, then come back slowly for a deep stretch.",
        note: "Your 2nd triceps exercise of the week.",
        swap: "Seated overhead dumbbell extension." },
    ],
  },
];

const RULES = [
  ["Warm up (5 min).", "Easy bike or elliptical, then 2 light sets of exercise 1: about half your weight × 12, then three-quarters × 6. These don't count as work sets."],
  ["How heavy?", "Pick a weight where you finish each set with about 2 good reps left in you. The last 2–3 reps should feel hard, but your form stays clean."],
  ["When to go up.", "Once you hit the top of the rep range on every set (e.g. 3 × 12 on 8–12), add weight next time: +5 lb dumbbells and upper-body machines, +10 lb leg press, +1 plate on cables. Then build the reps back up."],
  ["Rest.", "2 min after exercise 1 (the heavy one). 60–90 s for everything else."],
  ["Speed.", "Lift in about 1 s, lower in 2–3 s. No swinging or bouncing."],
  ["Low-energy day.", "Do exercises 1–3 only and skip the rest. That still counts as a full session. Showing up beats skipping."],
  ["Bonus (5).", "Only if you still have energy after exercise 4."],
  ["Easy week.", "Every 6th week, keep the same weights but do 2 sets instead of 3. You'll come back stronger."],
  ["Pain rule.", "Sharp or joint pain means stop that exercise and use its swap. Muscle burn is fine."],
  ["Cardio finisher.", "After the weights. Tired? 10 min is fine. Bikes taken? Walk on an incline treadmill: 3.0–3.5 mph at 5–8% incline."],
];

// Every cable movement in the plan, for the guide page.
const CABLE_TABLE = [
  ["Low-to-high cable fly", 1, "BOTTOM (both)", "2 D-handles", "Center, 1 step forward, staggered"],
  ["Triceps rope pushdown", 1, "TOP", "Rope", "Facing, ½ step back"],
  ["Straight-bar pushdown (swap)", 1, "TOP", "Straight bar", "Facing, ½ step back"],
  ["Cable pull-through (swap)", 2, "BOTTOM", "Rope", "Facing away, straddle cable, 2–3 steps out"],
  ["Lat pulldown", 3, "Fixed (top)", "Wide bar", "Seated, thighs under the pad"],
  ["Seated cable row", 3, "Fixed (low)", "V-handle", "Seated, feet on the plate"],
  ["Single-arm cable row (swap)", 3, "CHEST", "D-handle", "Facing, staggered feet"],
  ["Cable curl", 3, "BOTTOM", "Straight / EZ bar", "Facing, 1 ft back"],
  ["Rope hammer curl", 3, "BOTTOM", "Rope", "Facing, 1 ft back"],
  ["Face pull", 4, "HEAD", "Rope", "Facing, 2 steps back"],
  ["Single-arm cable lateral raise", 4, "BOTTOM", "D-handle", "Side-on, far hand, 1 step away"],
  ["Overhead cable triceps extension", 4, "CHEST", "Rope", "Facing away, 1 big step out"],
];

// ---------------------------------------------------------------- drawing helpers

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const GRAY = { body: "#d4d7dc", line: "#9aa0a8", dark: "#4b5160", panel: "#eceef1" };

// Front-view pictogram of a ~175 cm person standing on the floor at `floor`, `s` px per cm.
function person(cx, floor, s) {
  const y = (cm) => floor - cm * s;
  const w = (cm) => cm * s;
  return `
    <circle cx="${cx}" cy="${y(164)}" r="${w(11)}" fill="${GRAY.body}"/>
    <rect x="${cx - w(17)}" y="${y(147)}" width="${w(34)}" height="${w(58)}" rx="${w(8)}" fill="${GRAY.body}"/>
    <rect x="${cx - w(25.5)}" y="${y(145)}" width="${w(7.5)}" height="${w(62)}" rx="${w(3.75)}" fill="${GRAY.body}"/>
    <rect x="${cx + w(18)}" y="${y(145)}" width="${w(7.5)}" height="${w(62)}" rx="${w(3.75)}" fill="${GRAY.body}"/>
    <rect x="${cx - w(15.5)}" y="${y(94)}" width="${w(14.5)}" height="${w(94)}" rx="${w(6)}" fill="${GRAY.body}"/>
    <rect x="${cx + w(1)}" y="${y(94)}" width="${w(14.5)}" height="${w(94)}" rx="${w(6)}" fill="${GRAY.body}"/>`;
}

// Small side-view gauge: cable column + person, pulley height highlighted.
function miniGauge(level, accent) {
  const floor = 70, s = 0.31;
  const y = (cm) => floor - cm * s;
  const ly = y(LEVELS[level]);
  const ticks = ["TOP", "HEAD", "CHEST", "BOTTOM"]
    .map((l) => `<line x1="5" x2="12" y1="${y(LEVELS[l])}" y2="${y(LEVELS[l])}" stroke="${GRAY.line}" stroke-width="0.7"/>`)
    .join("");
  return `<svg class="gauge" viewBox="0 0 46 72" aria-hidden="true">
    <rect x="3" y="2" width="11.5" height="68" rx="2" fill="${GRAY.panel}" stroke="${GRAY.line}" stroke-width="0.8"/>
    ${ticks}
    ${person(31, floor, s)}
    <line x1="1" x2="45" y1="70.4" y2="70.4" stroke="${GRAY.line}" stroke-width="0.8"/>
    <line x1="13" x2="44" y1="${ly}" y2="${ly}" stroke="${accent}" stroke-width="1.5" stroke-dasharray="2.4 1.6"/>
    <circle cx="8.75" cy="${ly}" r="3.6" fill="${accent}" stroke="#fff" stroke-width="0.9"/>
  </svg>`;
}

// Top-view stance diagram. Machine is drawn at the top of the box.
function stanceIcon(type, accent) {
  const machine = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.6" fill="${GRAY.dark}"/>`;
  const pulley = (x, y) => `<circle cx="${x}" cy="${y}" r="2.3" fill="${accent}"/>`;
  const cable = (d) => `<path d="${d}" fill="none" stroke="${accent}" stroke-width="1.3" stroke-linecap="round"/>`;
  const body = (cx, cy, rot) => `<g transform="translate(${cx} ${cy}) rotate(${rot})">
      <ellipse rx="10.5" ry="4.8" fill="${GRAY.body}" stroke="${GRAY.line}" stroke-width="0.8"/>
      <circle r="4" fill="#b8bdc5" stroke="${GRAY.line}" stroke-width="0.6"/>
      <path d="M-3.4,-5.6 L0,-10.6 L3.4,-5.6 Z" fill="${GRAY.dark}"/>
    </g>`;
  let g = "";
  switch (type) {
    case "face":
      g = machine(16, 3, 24, 7) + cable("M28,10 L28,28") + pulley(28, 10) + body(28, 36, 0);
      break;
    case "away":
      g = machine(16, 3, 24, 7) + cable("M28,10 L28,30") + pulley(28, 10) + body(28, 32, 180);
      break;
    case "side":
      g = machine(16, 3, 24, 7) + cable("M28,10 Q38,24 30.5,40") + pulley(28, 10) + body(26, 31, 90);
      break;
    case "cross":
      g = machine(2, 6, 7, 18) + machine(47, 6, 7, 18) +
        cable("M9,15 L18.5,34") + cable("M47,15 L37.5,34") +
        pulley(9, 15) + pulley(47, 15) + body(28, 34, 180);
      break;
    case "seated":
      g = machine(16, 3, 24, 7) +
        `<rect x="18" y="29" width="20" height="18" rx="2.5" fill="${GRAY.panel}" stroke="${GRAY.line}" stroke-width="0.8"/>` +
        cable("M28,10 L28,27") + pulley(28, 10) + body(28, 36, 0);
      break;
  }
  return `<svg class="stance" viewBox="0 0 56 52" aria-hidden="true">${g}</svg>`;
}

// Large labelled height chart for the guide page.
function bigGauge() {
  const floor = 452, s = 2.0, accent = "#111827";
  const y = (cm) => floor - cm * s;
  const rows = [
    { l: "TOP", d: "Highest hole", uses: ["Pushdowns"], ly: y(LEVELS.TOP), dy: 0 },
    { l: "HEAD", d: "Forehead", uses: ["Face pull"], ly: y(LEVELS.HEAD), dy: 0 },
    { l: "CHEST", d: "Middle of your chest", uses: ["Overhead triceps,", "single-arm row"], ly: y(LEVELS.CHEST), dy: 0 },
    { l: "BOTTOM", d: "Lowest hole", uses: ["Fly, both curls,", "lateral raise,", "pull-through"], ly: y(LEVELS.BOTTOM), dy: -70 },
  ];
  let holes = "";
  for (let yy = 30; yy < floor - 6; yy += 13) holes += `<circle cx="39" cy="${yy}" r="1.9" fill="#fff"/>`;
  const marks = rows.map((r) => {
    const ty = r.ly + r.dy;
    return `
      <line x1="48" x2="212" y1="${r.ly}" y2="${r.ly}" stroke="${accent}" stroke-width="1.6" stroke-dasharray="5 4"/>
      <circle cx="39" cy="${r.ly}" r="8" fill="${accent}" stroke="#fff" stroke-width="2"/>
      ${r.dy ? `<line x1="212" x2="212" y1="${r.ly}" y2="${ty - 10}" stroke="${accent}" stroke-width="1.2"/>` : ""}
      <text x="220" y="${ty + 1}" font-size="14" font-weight="800" fill="${accent}">${r.l}</text>
      <rect x="290" y="${ty - 13}" width="46" height="18" rx="3" fill="#fff" stroke="#9aa0a8" stroke-width="1"/>
      <text x="294" y="${ty - 6.5}" font-size="5.5" font-weight="700" letter-spacing="0.4" fill="#9aa0a8">PIN #</text>
      <text x="220" y="${ty + 15}" font-size="9.5" font-weight="600" fill="#374151">${esc(r.d)}</text>
      ${r.uses.map((u, i) => `<text x="220" y="${ty + 27 + i * 10.5}" font-size="8.5" fill="#6b7280">${esc(u)}</text>`).join("")}`;
  }).join("");
  return `<svg class="big-gauge" viewBox="0 0 340 462" aria-hidden="true">
    <rect x="20" y="14" width="38" height="${floor - 14}" rx="5" fill="${GRAY.panel}" stroke="${GRAY.line}" stroke-width="1.2"/>
    <rect x="33" y="22" width="12" height="${floor - 30}" rx="3" fill="#c9cdd3"/>
    ${holes}
    ${person(136, floor, s)}
    <line x1="4" x2="336" y1="${floor + 1}" y2="${floor + 1}" stroke="${GRAY.line}" stroke-width="1.5"/>
    <text x="10" y="${floor + 9}" font-size="7" fill="#6b7280" dy="0">FLOOR</text>
    ${marks}
  </svg>`;
}

// Cable attachment icons.
const ATTACH = {
  "Rope": `<circle cx="30" cy="9" r="4.5" fill="none" stroke="#4b5160" stroke-width="2"/>
    <path d="M30,13 C27,24 22,34 18,46 M30,13 C33,24 38,34 42,46" fill="none" stroke="#8a7350" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="17.5" cy="48" r="4.5" fill="#2f3440"/><circle cx="42.5" cy="48" r="4.5" fill="#2f3440"/>`,
  "D-handle": `<circle cx="30" cy="9" r="4.5" fill="none" stroke="#4b5160" stroke-width="2"/>
    <path d="M30,13.5 L16,38 L44,38 Z" fill="none" stroke="#4b5160" stroke-width="2.4" stroke-linejoin="round"/>
    <rect x="15" y="36" width="30" height="8" rx="4" fill="#2f3440"/>`,
  "Straight bar": `<circle cx="30" cy="20" r="4.5" fill="none" stroke="#4b5160" stroke-width="2"/>
    <rect x="28.5" y="24" width="3" height="6" fill="#4b5160"/>
    <rect x="3" y="30" width="54" height="5" rx="2.5" fill="#4b5160"/>
    <rect x="4" y="29" width="14" height="7" rx="3.5" fill="#2f3440"/><rect x="42" y="29" width="14" height="7" rx="3.5" fill="#2f3440"/>`,
  "V-handle": `<circle cx="30" cy="9" r="4.5" fill="none" stroke="#4b5160" stroke-width="2"/>
    <path d="M30,13.5 L30,20 L19,40 M30,20 L41,40" fill="none" stroke="#4b5160" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="13" y="38" width="12" height="7" rx="3.5" fill="#2f3440" transform="rotate(-25 19 41)"/>
    <rect x="35" y="38" width="12" height="7" rx="3.5" fill="#2f3440" transform="rotate(25 41 41)"/>`,
  "Wide lat bar": `<circle cx="30" cy="18" r="4.5" fill="none" stroke="#4b5160" stroke-width="2"/>
    <rect x="28.5" y="22" width="3" height="6" fill="#4b5160"/>
    <path d="M3,40 L11,29 L49,29 L57,40" fill="none" stroke="#4b5160" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`,
};

// ---------------------------------------------------------------- page builders

const footer = (pageNo, total, accent) => `
  <footer class="foot">
    <span>GB3 Gym Plan · 4-Day Split · Nov 2026</span>
    <span class="foot-mid" style="color:${accent || "#6b7280"}">Low-energy day? Do 1–3 only.</span>
    <span>Page ${pageNo} of ${total}</span>
  </footer>`;

function coverPage(total) {
  const week = [
    ["Mon", 1], ["Tue", 2], ["Wed", null], ["Thu", 3], ["Fri", null], ["Sat", 4], ["Sun", null],
  ].map(([d, n]) => {
    if (!n) return `<div class="wk rest"><div class="wk-d">${d}</div><div class="wk-rest">Rest</div><div class="wk-sub">walk if you like</div></div>`;
    const day = DAYS[n - 1];
    return `<div class="wk" style="--accent:${day.accent}"><div class="wk-d">${d}</div>
      <div class="wk-pill">Day ${n}</div><div class="wk-t">${esc(day.title)}</div></div>`;
  }).join("");

  const glance = DAYS.map((day) => `
    <div class="gl" style="--accent:${day.accent}">
      <div class="gl-h"><span class="gl-n">${day.n}</span><span>${esc(day.title)}</span></div>
      <ol>${day.ex.map((e, i) => `
        <li class="${e.bonus ? "b" : ""}"><span class="gl-i">${i + 1}</span>
          <span class="gl-name">${esc(e.name)}${e.bonus ? ' <span class="b-badge">bonus</span>' : ""}</span>
          <span class="gl-s">${esc(e.sets.replace(" each arm", ""))}</span></li>`).join("")}
      </ol>
      <div class="gl-cardio">+ ${esc(day.cardio.name)}, ${esc(day.cardio.detail.split(",")[0])}</div>
    </div>`).join("");

  const rules = RULES.map(([b, t], i) => `<li><span class="r-n">${i + 1}</span><div><b>${esc(b)}</b> ${esc(t)}</div></li>`).join("");

  return `<section class="page cover">
    <header class="cv-head">
      <div class="eyebrow">GB3 Gym Plan</div>
      <h1>4-Day Split</h1>
      <p class="lede">Chest · Legs · Back · Shoulders. One focus per day: 4 exercises plus 1 bonus, with a cable setup for every cable exercise.</p>
    </header>

    <h2>Your week</h2>
    <div class="week">${week}</div>
    <p class="note">Other days work too. Keep the order (Day 1, 2, 3, 4) and never do Chest and Shoulders on back-to-back days, because both use your front shoulders and triceps.</p>

    <h2>The plan at a glance</h2>
    <div class="glance">${glance}</div>

    <h2>How to train</h2>
    <ol class="rules">${rules}</ol>
    ${footer(1, total)}
  </section>`;
}

function guidePage(total) {
  const attach = Object.entries(ATTACH).map(([k, svg]) => `
    <figure class="att"><svg viewBox="0 0 60 56" aria-hidden="true">${svg}</svg><figcaption>${esc(k)}</figcaption></figure>`).join("");
  const rows = CABLE_TABLE.map(([name, d, lvl, att, stand]) => {
    const day = DAYS[d - 1];
    const swap = name.endsWith("(swap)");
    return `<tr class="${swap ? "swap" : ""}"><td class="t-name">${esc(name.replace(" (swap)", ""))}${swap ? ' <span class="swap-tag">swap</span>' : ""}</td>
      <td><span class="t-day" style="--accent:${day.accent}">${d} · ${esc(day.short)}</span></td>
      <td class="t-lvl">${esc(lvl)}</td><td>${esc(att)}</td><td>${esc(stand)}</td></tr>`;
  }).join("");

  return `<section class="page guide">
    <header class="pg-head">
      <div class="eyebrow">Cable setup guide</div>
      <h1 class="h1-sm">Where to set the pulley</h1>
      <p class="lede sm">Every cable machine numbers its holes differently, so this plan uses your body as the ruler. Find each height once, write the hole number in the box, and next time setup takes two seconds.</p>
    </header>
    <div class="guide-grid">
      <div class="guide-fig">${bigGauge()}</div>
      <div class="guide-side">
        <h3>Set up any cable in 4 steps</h3>
        <ol class="steps">
          <li><b>Height.</b> Pull the pop-pin on the column, slide the pulley to the landmark, let go, and tug it to check it clicked in.</li>
          <li><b>Attachment.</b> Clip the handle onto the carabiner and make sure the gate snaps fully shut.</li>
          <li><b>Weight.</b> Put the pin in the stack. Start lighter than you think; cables feel heavier than dumbbells.</li>
          <li><b>Step out.</b> Move away until the plates lift just off the stack at the start. They shouldn't touch down between reps.</li>
        </ol>
        <h3>The handles</h3>
        <div class="atts">${attach}</div>
        <div class="callout">
          <b>Numbers don't transfer.</b> A “30” on one cable tower can feel like 20 on another, because the pulleys differ. Use the same machine when you can and log which one.
        </div>
        <div class="callout">
          <b>Fixed stations.</b> The lat pulldown and the seated row have pulleys that don't move. Set the seat, thigh pad and foot plate instead.
        </div>
        <div class="legend">
          <div class="lg-item">${miniGauge("HEAD", "#111827")}<div><b>Height</b> (side view): the dot is the pulley; the dashed line shows where it hits your body.</div></div>
          <div class="lg-item">${stanceIcon("face", "#111827")}<div><b>Where you stand</b> (seen from above): the dark bar is the machine; the arrow is the way you face.</div></div>
        </div>
      </div>
    </div>
    <h3 class="tbl-h">Every cable exercise in the plan</h3>
    <table class="ctbl">
      <thead><tr><th>Exercise</th><th>Day</th><th>Pulley</th><th>Attachment</th><th>Where you stand</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${footer(2, total)}
  </section>`;
}

function exerciseCard(e, i, accent) {
  const n = i + 1;
  const chips = [`<span class="sets">${esc(e.sets)}</span>`, `<span class="rest">rest ${esc(e.rest)}</span>`];
  if (e.heavy) chips.push(`<span class="chip heavy">Heavy lift</span>`);
  if (e.bonus) chips.push(`<span class="chip bonus">Bonus: only if you have energy</span>`);
  let setup = "";
  if (e.cable) {
    const c = e.cable;
    setup = `<div class="cable">
      <div class="cable-figs">${miniGauge(c.level, accent)}${stanceIcon(c.stance, accent)}</div>
      <div class="cable-txt">
        <div class="cable-h">${c.fixed ? "Cable station" : "Cable setup"}</div>
        <div class="kv"><span class="k">Pulley</span><span class="pv"><b>${esc(c.levelText)}</b>${c.fixed ? "" : `<span class="pin">My pin #<i></i></span>`}</span></div>
        <div class="kv"><span class="k">Handle</span><span>${esc(c.attach)}</span></div>
        <div class="kv"><span class="k">Stand</span><span>${esc(c.stand)}</span></div>
      </div>
    </div>`;
  } else if (e.setup) {
    setup = `<p class="ln"><span class="lbl">Setup</span><span>${esc(e.setup)}</span></p>`;
  }
  return `<article class="ex${e.bonus ? " is-bonus" : ""}">
    <div class="ex-n">${n}</div>
    <div class="ex-body">
      <div class="ex-title"><h3>${esc(e.name)}</h3><span class="fa" lang="fa" dir="rtl">${esc(e.fa)}</span></div>
      <div class="rx">${chips.join("")}</div>
      ${setup}
      <p class="ln"><span class="lbl">How</span><span>${esc(e.how)}${e.note ? ` <b class="note-i">${esc(e.note)}</b>` : ""}</span></p>
      <p class="ln swap"><span class="lbl">Taken?</span><span>${esc(e.swap)}</span></p>
    </div>
    <div class="log">
      ${[1, 2, 3, 4].map((w) => `<div class="cell"><span>Wk ${w}</span></div>`).join("")}
    </div>
  </article>`;
}

function dayPage(day, pageNo, total) {
  return `<section class="page day" style="--accent:${day.accent}">
    <header class="d-head">
      <div class="d-num">${day.n}</div>
      <div class="d-titles">
        <div class="eyebrow">Day ${day.n} · suggested ${day.weekday}</div>
        <h1 class="d-title">${esc(day.title)}</h1>
        <p class="d-focus">${esc(day.focus)}</p>
      </div>
      <div class="d-dates">
        <div class="d-dates-h">Dates</div>
        ${[1, 2, 3, 4].map((w) => `<div class="d-date"><span>Wk ${w}</span><i></i></div>`).join("")}
      </div>
    </header>
    <div class="warm"><span><b>Warm-up:</b> 5 min easy bike or elliptical + 2 light sets of #1 (half weight × 12, three-quarters × 6)</span>
      <span class="log-h">Log: weight, reps per set (40: 12, 11, 10)</span></div>
    <div class="exs">${day.ex.map((e, i) => exerciseCard(e, i, day.accent)).join("")}</div>
    <div class="finish">
      <div class="finish-h">Finish</div>
      <div><b>${esc(day.cardio.name)}</b>: ${esc(day.cardio.detail)}. <span class="muted">Bikes taken? Walk on an incline treadmill: 3.0–3.5 mph at 5–8% incline.</span></div>
    </div>
    <div class="notes"><span>Notes: seat settings, what felt good, what hurt</span>${"<i></i>".repeat(12)}</div>
    ${footer(pageNo, total, day.accent)}
  </section>`;
}

// ---------------------------------------------------------------- styles

const CSS = `
${[400, 500, 600, 700, 800].map((w) => `@font-face { font-family: "InterTT"; font-weight: ${w}; src: url("fonts/inter-latin-${w}-normal.woff2") format("woff2"); }`).join("\n")}
@font-face { font-family: "Vazirmatn"; font-weight: 400; src: url("fonts/Vazirmatn-Regular.woff2") format("woff2"); }
@font-face { font-family: "Vazirmatn"; font-weight: 500; src: url("fonts/Vazirmatn-Medium.woff2") format("woff2"); }
@font-face { font-family: "Vazirmatn"; font-weight: 700; src: url("fonts/Vazirmatn-Bold.woff2") format("woff2"); }
@page { size: Letter; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: "InterTT", "DejaVu Sans", sans-serif; color: #16181d; font-size: 8.4pt; line-height: 1.34; background: #fff; }
b { font-weight: 600; }
.page { width: 8.5in; height: 11in; padding: 0.4in 0.5in 0.5in; position: relative; overflow: hidden; break-after: page; }
.page:last-child { break-after: auto; }
.foot { position: absolute; left: 0.5in; right: 0.5in; bottom: 0.26in; display: flex; justify-content: space-between;
  font-size: 6.8pt; color: #6b7280; border-top: 0.6pt solid #dde0e4; padding-top: 4pt; }
.foot-mid { font-weight: 600; }
.eyebrow { font-size: 7.2pt; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; color: var(--accent, #4b5160); }
h1 { font-size: 34pt; line-height: 1.02; font-weight: 800; letter-spacing: -0.02em; margin-top: 2pt; }
.h1-sm { font-size: 22pt; }
h2 { font-size: 10.5pt; font-weight: 700; margin: 15pt 0 6pt; letter-spacing: -0.005em; }
h3 { font-size: 9.6pt; font-weight: 700; }
.lede { font-size: 10.5pt; color: #3c414b; margin-top: 5pt; max-width: 6.2in; }
.lede.sm { font-size: 9pt; max-width: 6.8in; }
.note { font-size: 8pt; color: #4b5160; margin-top: 6pt; }
.muted { color: #5b616c; }
.fa { font-family: "Vazirmatn", sans-serif; unicode-bidi: isolate; font-weight: 500; }

/* cover */
.cv-head { border-bottom: 2.2pt solid #16181d; padding-bottom: 10pt; }
.week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5pt; }
.wk { border: 1pt solid var(--accent); border-radius: 6pt; padding: 6pt 6pt 7pt; min-height: 0.86in; }
.wk.rest { border: 1pt dashed #c3c7cd; }
.wk-d { font-size: 7pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #6b7280; }
.wk-pill { display: inline-block; margin-top: 5pt; background: var(--accent); color: #fff; font-size: 6.8pt; font-weight: 700;
  border-radius: 8pt; padding: 1pt 6pt; letter-spacing: 0.04em; }
.wk-t { font-size: 9.2pt; font-weight: 700; margin-top: 3pt; line-height: 1.15; }
.wk-rest { font-size: 9.2pt; font-weight: 600; color: #8a9099; margin-top: 7pt; }
.wk-sub { font-size: 6.8pt; color: #9aa0a8; }
.glance { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8pt; }
.gl { border-top: 3pt solid var(--accent); background: #f6f7f9; border-radius: 0 0 6pt 6pt; padding: 6pt 7pt 7pt; }
.gl-h { display: flex; align-items: center; gap: 5pt; font-weight: 700; font-size: 9.6pt; margin-bottom: 4pt; }
.gl-n { width: 15pt; height: 15pt; border-radius: 50%; background: var(--accent); color: #fff; font-size: 8pt;
  display: inline-flex; align-items: center; justify-content: center; }
.gl ol { list-style: none; }
.gl li { display: grid; grid-template-columns: 9pt 1fr auto; gap: 3pt; padding: 2.6pt 0; border-bottom: 0.5pt solid #e1e4e8; font-size: 7.7pt; line-height: 1.25; }
.gl li.b { color: #4b5160; }
.gl-i { color: var(--accent); font-weight: 700; }
.gl-s { white-space: nowrap; font-weight: 600; font-variant-numeric: tabular-nums; }
.c-badge, .b-badge { display: inline-block; font-size: 5.6pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  border-radius: 3pt; padding: 0 2.5pt; vertical-align: 1pt; }
.c-badge { color: var(--accent); border: 0.6pt solid var(--accent); }
.b-badge { color: #6b7280; border: 0.6pt dashed #9aa0a8; }
.gl-cardio { font-size: 7.3pt; color: #4b5160; margin-top: 4pt; }
.rules { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 6pt 16pt; }
.rules li { display: grid; grid-template-columns: 14pt 1fr; gap: 4pt; font-size: 8.2pt; line-height: 1.38; }
.r-n { width: 13pt; height: 13pt; border-radius: 50%; border: 1pt solid #16181d; font-size: 6.8pt; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center; margin-top: 0.5pt; }

/* guide */
.pg-head { border-bottom: 2.2pt solid #16181d; padding-bottom: 8pt; }
.guide-grid { display: grid; grid-template-columns: 3.45in 1fr; gap: 14pt; margin-top: 10pt; }
.big-gauge { width: 3.45in; height: auto; display: block; font-family: "InterTT", sans-serif; }
.guide-side h3 { margin: 0 0 5pt; }
.guide-side h3:not(:first-child) { margin-top: 10pt; }
.steps { padding-left: 13pt; font-size: 8.2pt; }
.steps li { margin-bottom: 3pt; }
.atts { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4pt; }
.att { text-align: center; background: #f6f7f9; border-radius: 5pt; padding: 4pt 2pt 3pt; }
.att svg { width: 0.5in; height: 0.47in; }
.att figcaption { font-size: 6.6pt; font-weight: 600; line-height: 1.15; }
.callout { margin-top: 7pt; font-size: 8pt; border-left: 2.5pt solid #16181d; padding: 2pt 0 2pt 7pt; }
.legend { margin-top: 9pt; display: grid; gap: 5pt; }
.lg-item { display: grid; grid-template-columns: 0.42in 1fr; gap: 7pt; align-items: center; font-size: 7.6pt; color: #3c414b; }
.lg-item svg { width: 0.42in; height: auto; }
.tbl-h { margin: 8pt 0 4pt; }
.ctbl { width: 100%; border-collapse: collapse; font-size: 7.8pt; }
.ctbl th { text-align: left; font-size: 6.6pt; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; font-weight: 700;
  border-bottom: 1pt solid #16181d; padding: 2pt 4pt; }
.ctbl td { padding: 3pt 4pt; border-bottom: 0.5pt solid #e1e4e8; vertical-align: top; }
.ctbl tr.swap td { color: #4b5160; }
.t-name { font-weight: 600; }
.t-lvl { font-weight: 700; white-space: nowrap; }
.t-day { color: var(--accent); font-weight: 700; white-space: nowrap; }
.swap-tag { font-size: 5.8pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #6b7280;
  border: 0.6pt dashed #9aa0a8; border-radius: 3pt; padding: 0 2.5pt; vertical-align: 1pt; }

/* day pages */
.d-head { display: grid; grid-template-columns: 0.62in 1fr 1.55in; gap: 12pt; align-items: center;
  border-bottom: 2.2pt solid var(--accent); padding-bottom: 8pt; }
.d-num { width: 0.62in; height: 0.62in; border-radius: 50%; background: var(--accent); color: #fff; font-size: 26pt; font-weight: 800;
  display: flex; align-items: center; justify-content: center; }
.d-title { font-size: 23pt; margin-top: 0; }
.d-focus { font-size: 8.4pt; color: #3c414b; margin-top: 2pt; line-height: 1.32; }
.d-dates { align-self: stretch; display: grid; grid-template-columns: 1fr 1fr; gap: 3pt 5pt; align-content: center; }
.d-dates-h { grid-column: 1 / -1; font-size: 6.4pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #6b7280; }
.d-date { display: flex; align-items: flex-end; gap: 3pt; font-size: 6.4pt; color: #6b7280; }
.d-date i { flex: 1; border-bottom: 0.7pt solid #9aa0a8; height: 12pt; }
.warm { display: flex; justify-content: space-between; align-items: baseline; gap: 10pt; font-size: 7.9pt; color: #3c414b; padding: 5pt 0 3pt; }
.log-h { font-size: 6.2pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #6b7280; white-space: nowrap; }
.page.day { display: flex; flex-direction: column; }
.page.day > :not(.notes) { flex-shrink: 0; }
.notes { flex: 1 1 auto; min-height: 0; margin-top: 8pt; overflow: hidden; font-size: 6.4pt; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: #9aa0a8; }
.notes i { display: block; height: 0.27in; border-bottom: 0.6pt solid #d4d7dc; }
.ex { display: grid; grid-template-columns: 0.3in 1fr 1.38in; gap: 0 10pt; padding: 5pt 0 5.5pt; border-top: 0.7pt solid #dde0e4; }
.ex-n { width: 0.3in; height: 0.3in; border-radius: 50%; border: 1.6pt solid var(--accent); color: var(--accent);
  font-weight: 800; font-size: 11pt; display: flex; align-items: center; justify-content: center; }
.ex.is-bonus .ex-n { border-style: dashed; }
.ex-title { display: flex; align-items: baseline; justify-content: space-between; gap: 8pt; }
.ex-title h3 { font-size: 12pt; font-weight: 700; letter-spacing: -0.01em; }
.ex-title .fa { font-size: 9.6pt; color: #4b5160; }
.rx { display: flex; flex-wrap: wrap; align-items: center; gap: 3pt 7pt; margin-top: 1.5pt; }
.sets { font-size: 10pt; font-weight: 800; font-variant-numeric: tabular-nums; }
.rest { font-size: 8pt; color: #4b5160; }
.chip { font-size: 6.2pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border-radius: 3pt; padding: 0.6pt 4pt; }
.chip.heavy { background: var(--accent); color: #fff; }
.chip.bonus { border: 0.7pt dashed #8a9099; color: #4b5160; }
.ln { margin-top: 2pt; display: grid; grid-template-columns: 0.46in 1fr; }
.lbl { font-size: 6.4pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); padding-top: 1.6pt; }
.ln.swap { color: #3c414b; }
.ln.swap .lbl { color: #6b7280; }
.note-i { font-weight: 600; color: #16181d; }
.cable { margin-top: 3pt; display: grid; grid-template-columns: auto 1fr; gap: 9pt; align-items: center;
  background: #f3f4f6; border-radius: 5pt; padding: 3.5pt 8pt 3.5pt 6pt; }
.cable-figs { display: flex; gap: 5pt; align-items: center; }
.gauge { width: 0.31in; height: 0.49in; display: block; }
.stance { width: 0.5in; height: 0.46in; display: block; background: #fff; border-radius: 3pt; }
.cable-txt { font-size: 8pt; line-height: 1.24; }
.cable-h { font-size: 6.4pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); margin-bottom: 0.5pt; }
.kv { display: grid; grid-template-columns: 0.44in 1fr; }
.k { color: #6b7280; font-size: 7pt; padding-top: 0.6pt; }
.pv { display: flex; justify-content: space-between; align-items: center; gap: 8pt; }
.pin { display: inline-flex; align-items: center; gap: 4pt; font-size: 5.8pt; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; color: #6b7280; }
.pin i { display: block; width: 0.5in; height: 12pt; background: #fff; border: 0.8pt solid #9aa0a8; border-radius: 3pt; }
.log { display: grid; grid-template-columns: 1fr; grid-auto-rows: 0.25in; gap: 3pt; align-content: start; padding-top: 1pt; }
.cell { border: 0.8pt solid #b5bac1; border-radius: 4pt; position: relative; }
.cell span { position: absolute; top: 50%; transform: translateY(-50%); left: 4pt; font-size: 5.8pt; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase; color: #9aa0a8; }
.finish { margin-top: 4pt; display: grid; grid-template-columns: auto 1fr; gap: 9pt; align-items: center;
  border: 1pt solid var(--accent); border-radius: 6pt; padding: 6pt 10pt; font-size: 8.4pt; }
.finish-h { font-size: 6.8pt; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); }
`;

// ---------------------------------------------------------------- build

async function main() {
  const total = 2 + DAYS.length;
  const pages = [coverPage(total), guidePage(total), ...DAYS.map((d, i) => dayPage(d, i + 3, total))];
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <title>GB3 Gym Plan · 4-Day Split</title><style>${CSS}</style></head><body>${pages.join("")}</body></html>`;
  fs.writeFileSync(HTML_FILE, html);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("file://" + HTML_FILE);
  await page.evaluate(() => document.fonts.ready);

  // Fail loudly if any page's content runs past its bottom edge (it would be clipped in print).
  const overflow = await page.evaluate(() => [...document.querySelectorAll(".page")].map((p, i) => {
    const limit = p.getBoundingClientRect().bottom - parseFloat(getComputedStyle(p).paddingBottom) + 1;
    const worst = Math.max(...[...p.children].filter((c) => !c.classList.contains("foot") && !c.classList.contains("notes"))
      .map((c) => c.getBoundingClientRect().bottom));
    return { page: i + 1, spare_in: +((limit - worst) / 96).toFixed(2) };
  }));
  console.table(overflow);
  const bad = overflow.filter((o) => o.spare_in < 0);
  if (bad.length) {
    console.error("Content overflows on page(s):", bad.map((b) => b.page).join(", "));
    process.exitCode = 1;
  }

  // A notes area too short for even one writing line would just be a stray heading.
  await page.evaluate(() => document.querySelectorAll(".notes").forEach((n) => {
    if (n.getBoundingClientRect().height < 0.45 * 96) n.style.visibility = "hidden";
  }));

  await page.pdf({ path: PDF_FILE, preferCSSPageSize: true, printBackground: true });
  await browser.close();
  console.log("wrote", PDF_FILE);
}

main().catch((e) => { console.error(e); process.exit(1); });
