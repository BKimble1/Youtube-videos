var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/v2/MainV2.tsx
var import_react = __toESM(require("react"));
var import_remotion3 = require("remotion");

// src/v2/timeline.tsx
var import_remotion = require("remotion");

// src/data/narration_lines.json
var narration_lines_default = {
  voice: "espeak-ng en-us+m3 rate 158 pitch 42",
  duration: 412.821,
  lines: [
    {
      id: "h1",
      scene: "hook",
      s: 0.6,
      e: 6.763,
      text: "That's a steel spacecraft falling back from space. And the thing waiting for it is a tower with arms."
    },
    {
      id: "h2",
      scene: "hook",
      s: 7.113,
      e: 13.116,
      text: "This hasn't happened yet. It's an illustration of what SpaceX says it will try next month."
    },
    {
      id: "h3",
      scene: "hook",
      s: 13.616,
      e: 18.811,
      text: "SpaceX has already caught a falling rocket booster with this tower. More than once."
    },
    {
      id: "h4",
      scene: "hook",
      s: 19.111,
      e: 23.888,
      text: "Now it wants to catch the other half, the spacecraft coming back from orbit."
    },
    {
      id: "h5",
      scene: "hook",
      s: 24.188,
      e: 27.526,
      text: "And that second catch is a completely different problem."
    },
    {
      id: "a1",
      scene: "stack",
      s: 28.326,
      e: 35.139,
      text: "Here's the whole machine. It's called Starship, and stacked up it stands about four hundred feet tall."
    },
    {
      id: "a2",
      scene: "stack",
      s: 35.439,
      e: 44.137,
      text: "The bottom part is the booster, Super Heavy. Thirty three engines, and one job: throw everything upward for the first few minutes."
    },
    {
      id: "a3",
      scene: "stack",
      s: 44.437,
      e: 51.058,
      text: "The top part is the ship. It has its own engines, carries the cargo, and actually goes to space."
    },
    {
      id: "a4",
      scene: "stack",
      s: 51.358,
      e: 59.202,
      text: "Rockets like this usually end up in the ocean. So far, every Starship ship that has flown has ended its flight there."
    },
    {
      id: "a5",
      scene: "stack",
      s: 59.502,
      e: 68.645,
      text: "On the next flight, Elon Musk says they'll try to catch both pieces. He says it would be the first time an orbital rocket has been fully recovered."
    },
    {
      id: "b1",
      scene: "booster",
      s: 69.445,
      e: 75.641,
      text: "So how do you catch a booster? First, the stages separate, a couple of minutes after launch."
    },
    {
      id: "b2",
      scene: "booster",
      s: 75.941,
      e: 84.82,
      text: "The booster flips around and relights some of its engines. That's the boostback burn. It sends the booster back toward the launch site."
    },
    {
      id: "b3",
      scene: "booster",
      s: 85.12,
      e: 92.871,
      text: "Then it falls, engines off, steering with these: grid fins. Steel lattices that bite into the air like rudders."
    },
    {
      id: "b4",
      scene: "booster",
      s: 93.171,
      e: 100.128,
      text: "Close to the ground, the engines light again for the landing burn, and the booster slides sideways toward the tower."
    },
    {
      id: "b5",
      scene: "booster",
      s: 100.428,
      e: 106.399,
      text: "And here's the part most people picture wrong. The tower doesn't snatch a rocket out of the sky."
    },
    {
      id: "b6",
      scene: "booster",
      s: 106.699,
      e: 117.405,
      text: "The booster flies itself between two open arms, called chopsticks. The arms close in, and it settles until load points near its top come to rest on them."
    },
    {
      id: "b7",
      scene: "booster",
      s: 117.705,
      e: 123.001,
      text: "From that moment, the whole weight of the booster hangs on a few small contact points."
    },
    {
      id: "b8",
      scene: "booster",
      s: 123.301,
      e: 129.154,
      text: "SpaceX first pulled this off in October twenty twenty four, and has done it again since."
    },
    {
      id: "b9",
      scene: "booster",
      s: 129.454,
      e: 139.581,
      text: "On the new version three booster, that interface got redesigned. Four grid fins became three bigger ones, and the catch points now sit on the fins themselves."
    },
    {
      id: "b10",
      scene: "booster",
      s: 139.881,
      e: 145.683,
      text: "The new tower got shorter arms, too, so they can move faster to track a vehicle coming in."
    },
    {
      id: "c1",
      scene: "orbit",
      s: 146.483,
      e: 148.671,
      text: "So why is the ship so much harder?"
    },
    {
      id: "c2",
      scene: "orbit",
      s: 148.971,
      e: 155.616,
      text: "Because the booster never really leaves. It turns back after a few minutes, and it's home in about seven."
    },
    {
      id: "c3",
      scene: "orbit",
      s: 155.916,
      e: 162.745,
      text: "The ship keeps going. And getting to orbit isn't mostly about going up. It's about going sideways."
    },
    {
      id: "c4",
      scene: "orbit",
      s: 163.045,
      e: 170.3,
      text: "Fast enough that as you fall toward Earth, the ground curves away beneath you. Roughly seventeen thousand miles per hour."
    },
    {
      id: "c5",
      scene: "orbit",
      s: 170.6,
      e: 178.126,
      text: "On the last flight, the ship reached orbit for the first time, and came down in the Pacific about three hours after launch."
    },
    {
      id: "c6",
      scene: "orbit",
      s: 178.426,
      e: 183.624,
      text: "To land, all of that speed has to go somewhere. Mostly, it goes into the air."
    },
    {
      id: "d1",
      scene: "reentry",
      s: 184.424,
      e: 192.314,
      text: "The ship comes in belly first. That whole side is covered in black heat shield tiles, and it faces straight into the flow."
    },
    {
      id: "d2",
      scene: "reentry",
      s: 192.614,
      e: 200.293,
      text: "The air in front of it is crushed so hard it becomes glowing plasma, while the steel on the other side hides in the shield's shadow."
    },
    {
      id: "d3",
      scene: "reentry",
      s: 200.593,
      e: 209.765,
      text: "No engines steer it here. The ship uses four flaps, two near the nose and two at the tail, like a skydiver using arms and legs."
    },
    {
      id: "d4",
      scene: "reentry",
      s: 210.065,
      e: 215.935,
      text: "It stays in that belly flop all the way down through the atmosphere, until most of its speed is gone."
    },
    {
      id: "d5",
      scene: "reentry",
      s: 216.235,
      e: 218.886,
      text: "Then comes the strangest move in rocketry."
    },
    {
      id: "d6",
      scene: "reentry",
      s: 219.186,
      e: 225.717,
      text: "The engines light, the ship swings from horizontal to vertical in seconds, and burns to slow down."
    },
    {
      id: "d7",
      scene: "reentry",
      s: 226.017,
      e: 232.406,
      text: "SpaceX has done this flip over the ocean. What it has never done is end it inside the arms of a tower."
    },
    {
      id: "e1",
      scene: "tower",
      s: 233.206,
      e: 237.644,
      text: "Which brings us to the tower, because the tower has to meet the ship halfway."
    },
    {
      id: "e2",
      scene: "tower",
      s: 237.944,
      e: 244.065,
      text: "This is the launch tower at Starbase, in Texas. It isn't scaffolding. It's a machine."
    },
    {
      id: "e3",
      scene: "tower",
      s: 244.365,
      e: 255.094,
      text: "The chopsticks hang from a carriage that rides up and down the tower, and the arms swing open and closed, fast enough to follow a vehicle that isn't perfectly lined up."
    },
    {
      id: "e4",
      scene: "tower",
      s: 255.394,
      e: 266.481,
      text: "For the ship, the arms aim for catch points up near the forward flaps. The exact hardware hasn't been shown in detail, so treat this as a diagram, not a blueprint."
    },
    {
      id: "e5",
      scene: "tower",
      s: 266.781,
      e: 277.486,
      text: "In September, SpaceX rehearsed. It lifted the actual ship for this flight with the new tower's arms, into what looked like a catch position, and held it there."
    },
    {
      id: "e6",
      scene: "tower",
      s: 277.786,
      e: 284.94,
      text: "That tests loads and alignment. It doesn't test the hard part: doing it with a ship that's still flying."
    },
    {
      id: "e7",
      scene: "tower",
      s: 285.24,
      e: 297.4,
      text: "For the catch to work, everything has to agree at the same instant. The ship's height. Its drift. Its tilt. Its speed. And the arms in the right place, closing around it."
    },
    {
      id: "e8",
      scene: "tower",
      s: 297.7,
      e: 304.678,
      text: "Two enormous machines, one flying and one bolted to the ground, meeting at a few small points of contact."
    },
    {
      id: "f1",
      scene: "wrong",
      s: 305.478,
      e: 306.84,
      text: "So what could go wrong?"
    },
    {
      id: "f2",
      scene: "wrong",
      s: 307.14,
      e: 315.005,
      text: "The ship could come in a little off target. It's flying through wind on engine power, with only so much control left at the end."
    },
    {
      id: "f3",
      scene: "wrong",
      s: 315.305,
      e: 324.366,
      text: "A few feet of drift doesn't sound like much. But if the catch points miss the arms, nothing else on the ship is built to hold its weight there."
    },
    {
      id: "f4",
      scene: "wrong",
      s: 324.666,
      e: 337.247,
      text: "Or the tower might not be ready. That's actually happened. On one earlier flight, the catch was called off with the booster on its way home, because automated checks on the tower didn't come back clean."
    },
    {
      id: "f5",
      scene: "wrong",
      s: 337.547,
      e: 345.796,
      text: "The booster went into the Gulf instead. That's the system working. If anything looks wrong, the vehicle doesn't try for the tower."
    },
    {
      id: "f6",
      scene: "wrong",
      s: 346.096,
      e: 353.408,
      text: "And the ship arrives having just survived reentry. Whatever state it's in, it has to fly that landing anyway."
    },
    {
      id: "f7",
      scene: "wrong",
      s: 353.708,
      e: 363.991,
      text: "Musk says this first attempt is more likely than not to work. But the ship for this flight was recently sent back for more testing, so the date could still move."
    },
    {
      id: "g1",
      scene: "payoff",
      s: 364.791,
      e: 367.188,
      text: "If it does work, here's the sequence."
    },
    {
      id: "g2",
      scene: "payoff",
      s: 367.488,
      e: 373.639,
      text: "Launch. Separation. The booster turns around, and minutes later it's back in the arms."
    },
    {
      id: "g3",
      scene: "payoff",
      s: 373.939,
      e: 381.635,
      text: "Then, after its time in orbit, the ship comes home on its own schedule, to a tower with its arms open and waiting."
    },
    {
      id: "g4",
      scene: "payoff",
      s: 381.935,
      e: 384.161,
      text: "Two catches, from a single launch."
    },
    {
      id: "g5",
      scene: "payoff",
      s: 384.461,
      e: 395.567,
      text: "And that's the real point. Catching it once is a stunt. SpaceX wants to set both pieces back on the pad, refuel them, and fly them again, like an airliner."
    },
    {
      id: "g6",
      scene: "payoff",
      s: 395.867,
      e: 401.897,
      text: "It hasn't reflown a ship yet. Not once. Even a perfect catch is only step one."
    },
    {
      id: "g7",
      scene: "payoff",
      s: 402.197,
      e: 407.604,
      text: "But for decades, the most expensive part of every rocket was the part you threw away."
    },
    {
      id: "g8",
      scene: "payoff",
      s: 407.904,
      e: 411.621,
      text: "SpaceX is trying to make sure there's nothing left to throw."
    }
  ]
};

// src/kit/anim.ts
var clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
var lerp = (a, b, u) => a + (b - a) * u;
var prog = (t, t0, t1) => t1 === t0 ? t >= t1 ? 1 : 0 : clamp((t - t0) / (t1 - t0));
var smoother = (u) => u * u * u * (u * (u * 6 - 15) + 10);
var ep = (t, t0, t1, f = smoother) => f(prog(t, t0, t1));
var keys = (t, k, f = smoother) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], f(prog(t, k[i - 1][0], k[i][0])));
  }
  return k[k.length - 1][1];
};
var fadeWin = (t, a, b, d = 0.4) => Math.min(prog(t, a, a + d), 1 - prog(t, b - d, b));
var noise = (t, seed = 0) => Math.sin(t * 1.7 + seed * 12.9) * 0.5 + Math.sin(t * 3.1 + seed * 7.3 + 1.3) * 0.3 + Math.sin(t * 7.9 + seed * 3.1 + 0.4) * 0.2;
var rnd = (i, s = 0) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
var L = narration_lines_default.lines;
var byId = Object.fromEntries(L.map((l) => [l.id, l]));
var NARR_DUR = narration_lines_default.duration;

// src/v2/timeline.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var Footage = ({ file, a, src0, scale = 1, cx = 0.5, cy = 0.5, dx = 0, dy = 0, grade = "contrast(1.04) saturate(0.96)", children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_remotion.AbsoluteFill, { style: { background: "#000", overflow: "hidden" }, children: [
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_remotion.Sequence, { from: Math.round(a * 30), layout: "none", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_remotion.AbsoluteFill, { style: { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, transformOrigin: `${cx * 100}% ${cy * 100}%`, filter: grade }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_remotion.OffthreadVideo, { src: (0, import_remotion.staticFile)(`media/real/${file}`), startFrom: Math.round(src0 * 30), muted: true, style: { width: "100%", height: "100%", objectFit: "cover" } }) }) }),
  children
] });
var F5 = "01_Flight5_BoosterCatch.mp4";
var F14R = "02_Flight14_Reentry_4K.mp4";
var F14O = "03_Flight14_OceanReturn_4K.mp4";
var HAS_OCEAN_CLIP = false;

// src/v2/cam3.ts
var D = Math.PI / 180;
var proj = (c, p) => {
  const [X, Y, Z] = [p[0] - c.at[0], p[1] - c.at[1], p[2] - c.at[2]];
  const cy = Math.cos(c.yaw * D), sy = Math.sin(c.yaw * D);
  const x1 = X * cy + Z * sy;
  const z1 = -X * sy + Z * cy;
  const cp = Math.cos(c.pitch * D), sp = Math.sin(c.pitch * D);
  const y2 = Y * cp + z1 * sp;
  const z2 = -Y * sp + z1 * cp;
  let sx = x1 * c.z, syy = -y2 * c.z;
  if (c.roll) {
    const cr = Math.cos(c.roll * D), sr = Math.sin(c.roll * D);
    [sx, syy] = [sx * cr - syy * sr, sx * sr + syy * cr];
  }
  return [960 + sx, 540 + syy, z2];
};
var poly = (ps) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

// src/v2/site.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var TW = 6;
var VX = 22;
var ARM_LEN = 30;
var ARM_Z = 6.6;
var TOWER_H = 142;
var D2 = Math.PI / 180;
var LIGHTS = {
  day: { mast: "#38424d", mastBack: "#7d8994", arm: "#46525e", armHi: "#6f7d8b", armLo: "#2b333c", rail: "#c9d1d9", concrete: "#c9c6bd", ground: "#b9b39f", sand: "#d3c7a3", sea: "#5a8fb8", tank: "#e6e8ea", tankHi: "#ffffff", haze: "rgba(205,225,240,0.55)" },
  dusk: { mast: "#2a2a33", mastBack: "#6e5f66", arm: "#34343f", armHi: "#6b5b5f", armLo: "#1f2027", rail: "#f2c7a2", concrete: "#9d8a85", ground: "#6e645d", sand: "#8d7766", sea: "#7d6b7e", tank: "#c9b3aa", tankHi: "#f0d2bd", haze: "rgba(240,170,140,0.4)" },
  night: { mast: "#1a1f27", mastBack: "#323b48", arm: "#222a34", armHi: "#3f4c5c", armLo: "#13171d", rail: "#7d95b5", concrete: "#3a404a", ground: "#262b31", sand: "#2e3236", sea: "#18223a", tank: "#4b5562", tankHi: "#6e7c8c", haze: "rgba(40,55,80,0.5)" },
  studio: { mast: "#3b4651", mastBack: "#8592a0", arm: "#4a5664", armHi: "#748392", armLo: "#2e3640", rail: "#e8edf2", concrete: "#d5d2c8", ground: "#c7c1ad", sand: "#d8ceb0", sea: "#6c9cc2", tank: "#eceef0", tankHi: "#ffffff", haze: "rgba(220,232,242,0.5)" }
};
var palFor = (l) => l === "studio" ? "studio" : l;
var seg = (c, a, b) => {
  const p = proj(c, a), q = proj(c, b);
  return { x1: p[0], y1: p[1], x2: q[0], y2: q[1] };
};
var segD = (c, a, b) => (proj(c, a)[2] + proj(c, b)[2]) / 2;
var BAY = 7.1;
var Mast = ({ c, l, top = TOWER_H }) => {
  const C2 = LIGHTS[l];
  const w = Math.max(1, c.z * 0.55);
  const corners = [[-TW, -TW], [TW, -TW], [TW, TW], [-TW, TW]];
  const faces = [0, 1, 2, 3].map((i) => {
    const a = corners[i], b = corners[(i + 1) % 4];
    const mid = proj(c, [(a[0] + b[0]) / 2, 50, (a[1] + b[1]) / 2]);
    return { a, b, d: mid[2] };
  });
  const centre = proj(c, [0, 50, 0])[2];
  const nb = Math.floor(top / BAY);
  const faceLines = (f, front) => {
    const out = [];
    const col = front ? C2.mast : C2.mastBack;
    const sw = front ? w : w * 0.7;
    for (let i = 0; i < nb; i++) {
      const y0 = i * BAY, y1 = y0 + BAY;
      const A0 = [f.a[0], y0, f.a[1]], B0 = [f.b[0], y0, f.b[1]], A1 = [f.a[0], y1, f.a[1]], B1 = [f.b[0], y1, f.b[1]];
      const h = seg(c, A1, B1);
      out.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { ...h, stroke: col, strokeWidth: sw * 0.9 }, `h${i}`));
      const d1 = seg(c, A0, B1), d2 = seg(c, B0, A1);
      out.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { ...d1, stroke: col, strokeWidth: sw * 0.6 }, `d${i}`));
      out.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { ...d2, stroke: col, strokeWidth: sw * 0.6 }, `e${i}`));
    }
    return out;
  };
  const legs = corners.map((p, i) => ({ ...seg(c, [p[0], 0, p[1]], [p[0], top, p[1]]), d: segD(c, [p[0], 0, p[1]], [p[0], top, p[1]]), i }));
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("g", { strokeLinecap: "round", children: [
    faces.filter((f) => f.d < centre).map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("g", { children: faceLines(f, false) }, `bf${i}`)),
    legs.sort((m, n) => m.d - n.d).map((g) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2, stroke: C2.mast, strokeWidth: w * 2.1 }, g.i)),
    faces.filter((f) => f.d >= centre).map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("g", { children: faceLines(f, true) }, `ff${i}`)),
    [38, 76, 104, 128].filter((y) => y < top).map((y, i) => {
      const ps = [[-TW - 1.6, -TW - 1.6], [TW + 1.6, -TW - 1.6], [TW + 1.6, TW + 1.6], [-TW - 1.6, TW + 1.6]].map(([x, z]) => proj(c, [x, y, z]));
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polygon", { points: poly(ps), fill: C2.mastBack, stroke: C2.mast, strokeWidth: w * 0.8, opacity: 0.9 }, i);
    }),
    top >= TOWER_H ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("g", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { ...seg(c, [0, top, 0], [0, top + 12, 0]), stroke: C2.mast, strokeWidth: w * 1.2 }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { ...seg(c, [-TW, top, -TW], [TW, top + 4, TW]), stroke: C2.mast, strokeWidth: w * 0.8 })
    ] }) : null
  ] });
};
var armFrame = (s, side) => {
  const b = s.open * side * D2;
  const piv = [TW + 1.4, s.carY, side * ARM_Z];
  const dir = [Math.cos(b), 0, Math.sin(b)];
  const nrm = [-Math.sin(b), 0, Math.cos(b)];
  return { piv, dir, nrm };
};
var armPt = (s, side, u, v, w) => {
  const { piv, dir, nrm } = armFrame(s, side);
  const L2 = (s.len ?? ARM_LEN) * u;
  const sag = (s.flex ?? 0) * u * u;
  return [piv[0] + dir[0] * L2 + nrm[0] * w * side, piv[1] + v - sag, piv[2] + dir[2] * L2 + nrm[2] * w * side];
};
var RAIL_DY = 2.6;
var Arm = ({ c, s, side, l, hiRail = 0, hiTruss = 0, load = -1 }) => {
  const C2 = LIGHTS[l];
  const w = Math.max(1, c.z * 0.5);
  const depth = (u) => 6.6 - 2.4 * u;
  const N2 = 9;
  const planes = [-1.5, 1.5].map((ww) => {
    const top = Array.from({ length: N2 + 1 }, (_, i) => armPt(s, side, i / N2, RAIL_DY - 0.6, ww));
    const bot = Array.from({ length: N2 + 1 }, (_, i) => armPt(s, side, i / N2, RAIL_DY - 0.6 - depth(i / N2), ww));
    return { ww, top, bot, d: proj(c, top[4])[2] };
  }).sort((a, b) => a.d - b.d);
  const P = (v) => proj(c, v);
  const hi = "#ffc93c";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("g", { strokeLinecap: "round", strokeLinejoin: "round", children: [
    planes.map((pl, k) => {
      const front = k === 1;
      const col = front ? C2.arm : C2.armLo;
      const els = [];
      els.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polygon", { points: poly([...pl.top.map(P), ...pl.bot.slice().reverse().map(P)]), fill: front ? C2.armHi : C2.armLo, opacity: front ? 0.28 : 0.4 }, "web"));
      els.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polyline", { points: poly(pl.top.map(P)), fill: "none", stroke: col, strokeWidth: w * 1.6 }, "tc"));
      els.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polyline", { points: poly(pl.bot.map(P)), fill: "none", stroke: col, strokeWidth: w * 1.6 }, "bc"));
      for (let i = 0; i <= N2; i++) {
        const a = P(pl.top[i]), b = P(pl.bot[i]);
        els.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: col, strokeWidth: w * 0.9 }, `v${i}`));
        if (i < N2) {
          const q = i % 2 === 0 ? [P(pl.top[i]), P(pl.bot[i + 1])] : [P(pl.bot[i]), P(pl.top[i + 1])];
          const lit = load >= 0 ? Math.max(0, 1 - Math.abs(load * N2 - (N2 - i - 0.5)) / 1.6) * hiTruss : hiTruss;
          els.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: q[0][0], y1: q[0][1], x2: q[1][0], y2: q[1][1], stroke: lit > 0.02 ? hi : col, strokeOpacity: lit > 0.02 ? Math.min(1, 0.4 + lit) : 1, strokeWidth: w * (lit > 0.02 ? 1.4 : 0.9) }, `d${i}`));
        }
      }
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("g", { children: els }, k);
    }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polygon", { points: poly([armPt(s, side, 0, RAIL_DY - 0.6, -1.7), armPt(s, side, 1, RAIL_DY - 0.6, -1.7), armPt(s, side, 1, RAIL_DY - 0.6, 1.7), armPt(s, side, 0, RAIL_DY - 0.6, 1.7)].map(P)), fill: C2.armHi, stroke: C2.arm, strokeWidth: w * 0.8 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polyline", { points: poly([armPt(s, side, 0.12, RAIL_DY, -1.3), armPt(s, side, 0.96, RAIL_DY, -1.3)].map(P)), fill: "none", stroke: C2.armLo, strokeWidth: w * 3.6 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polyline", { points: poly([armPt(s, side, 0.12, RAIL_DY, -1.3), armPt(s, side, 0.96, RAIL_DY, -1.3)].map(P)), fill: "none", stroke: hiRail > 0 ? hi : C2.rail, strokeWidth: w * 2, strokeOpacity: hiRail > 0 ? 0.5 + 0.5 * hiRail : 1 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polygon", { points: poly([armPt(s, side, 1, RAIL_DY, -1.3), armPt(s, side, 1, RAIL_DY, 1.3), armPt(s, side, 1, RAIL_DY - 0.6 - depth(1), 1.3), armPt(s, side, 1, RAIL_DY - 0.6 - depth(1), -1.3)].map(P)), fill: C2.arm, stroke: C2.armLo, strokeWidth: w * 0.8 })
  ] });
};
var Carriage = ({ c, s, l, hi = 0 }) => {
  const C2 = LIGHTS[l];
  const w = Math.max(1, c.z * 0.5);
  const y0 = s.carY - 8, y1 = s.carY + 4;
  const e = TW + 1.6;
  const box = (y) => [[-e, y, -e], [e, y, -e], [e, y, e], [-e, y, e]];
  const P = (v) => proj(c, v);
  const faces = [
    [[e, y0, -e], [e, y0, e], [e, y1, e], [e, y1, -e]],
    [[-e, y0, e], [e, y0, e], [e, y1, e], [-e, y1, e]]
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("g", { strokeLinejoin: "round", children: [
    faces.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polygon", { points: poly(f.map(P)), fill: hi > 0 ? "#5a5030" : C2.armHi, stroke: hi > 0 ? "#ffc93c" : C2.arm, strokeWidth: w * (hi > 0 ? 1.8 : 1.2), opacity: 0.92 }, i)),
    faces.map((f, i) => {
      const p = f.map(P);
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("g", { stroke: C2.armLo, strokeWidth: w * 0.8, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: p[0][0], y1: p[0][1], x2: p[2][0], y2: p[2][1] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: p[1][0], y1: p[1][1], x2: p[3][0], y2: p[3][1] })
      ] }, `x${i}`);
    }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polygon", { points: poly(box(y1).map(P)), fill: C2.arm, opacity: 0.9 }),
    [1, -1].map((sd) => {
      const a = P([TW + 1.4, y0, sd * ARM_Z]), b = P([TW + 1.4, y1 + 1, sd * ARM_Z]);
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: C2.armLo, strokeWidth: w * 4, strokeLinecap: "round" }, sd);
    })
  ] });
};
var QDArm = ({ c, l }) => {
  const C2 = LIGHTS[l];
  const w = Math.max(1, c.z * 0.5);
  const y = 118;
  const pts3 = [[TW, y, -TW], [TW + 3, y, -TW - 8], [TW + 3, y - 2.4, -TW - 8], [TW, y - 2.4, -TW]];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polygon", { points: poly(pts3.map((p) => proj(c, p))), fill: C2.armLo, stroke: C2.mast, strokeWidth: w });
};
var MOUNT_TOP = 19;
var Cyl = ({ c, x, z, r, y0, y1, fill, hi, stroke }) => {
  const a = proj(c, [x, y0, z]), b = proj(c, [x, y1, z]);
  const rx = r * c.z;
  const ry = Math.abs(Math.sin(c.pitch * D2)) * r * c.z + 0.5;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("g", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: `M${a[0] - rx} ${a[1]} L${b[0] - rx} ${b[1]} L${b[0] + rx} ${b[1]} L${a[0] + rx} ${a[1]} A ${rx} ${ry} 0 0 1 ${a[0] - rx} ${a[1]} Z`, fill, stroke, strokeWidth: 1.2 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: a[0] - rx * 0.55, y: b[1], width: rx * 0.3, height: a[1] - b[1], fill: hi, opacity: 0.5 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ellipse", { cx: b[0], cy: b[1], rx, ry, fill: hi, stroke, strokeWidth: 1 })
  ] });
};
var groundHorizon = (c) => {
  const D_ = Math.PI / 180;
  const ahead = (d) => [c.at[0] + Math.sin(c.yaw * D_) * d, 0, c.at[2] - Math.cos(c.yaw * D_) * d];
  const far = proj(c, ahead(420))[1], here = proj(c, ahead(0))[1];
  return c.pitch > 0.5 ? Math.min(far, here) : here;
};
var Ground = ({ c, l }) => {
  const C2 = LIGHTS[l];
  const P = (v) => proj(c, v);
  const hz = groundHorizon(c);
  if (hz > 1200) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("g", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: -50, y: hz - 7, width: 2020, height: 9, fill: C2.sea }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: -50, y: hz, width: 2020, height: Math.max(0, 1200 - hz), fill: C2.sand }),
    c.pitch > 0.5 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polygon", { points: poly([[-90, 0, -70], [90, 0, -70], [90, 0, 60], [-90, 0, 60]].map((p) => P(p))), fill: C2.concrete }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: -50, y: hz - 16, width: 2020, height: 16, fill: C2.haze })
  ] });
};
var TankFarm = ({ c, l }) => {
  const C2 = LIGHTS[l];
  const tanks = [[-48, -40, 5, 26], [-60, -40, 5, 26], [-72, -40, 5, 26], [-54, -58, 4, 20], [-66, -58, 4, 20], [-84, -46, 3.5, 16]];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("g", { opacity: 0.95, children: tanks.sort((a, b) => a[1] - b[1]).map(([x, z, r, h], i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Cyl, { c, x, z, r, y0: 0, y1: h, fill: C2.tank, hi: C2.tankHi, stroke: LIGHTS[l].mast }, i)) });
};
var Mount = ({ c, l }) => {
  const C2 = LIGHTS[l];
  const P = (v) => proj(c, v);
  const box = (x0, x1, y0, y1, z0, z1) => {
    const f = [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    const s = [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]];
    const sl = [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]];
    const t = [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    return { f, s, sl, t };
  };
  const pl = box(VX - 13, VX + 13, 0, 11, -13, 13);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("g", { strokeLinejoin: "round", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polygon", { points: poly(pl.sl.map(P)), fill: C2.concrete, stroke: C2.mast, strokeWidth: 1.2, opacity: 0.9 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polygon", { points: poly(pl.s.map(P)), fill: C2.concrete, stroke: C2.mast, strokeWidth: 1.2 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polygon", { points: poly(pl.f.map(P)), fill: C2.concrete, stroke: C2.mast, strokeWidth: 1.4 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polygon", { points: poly(pl.t.map(P)), fill: C2.ground, stroke: C2.mast, strokeWidth: 1.2 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polygon", { points: poly([[VX - 7, 0, 13], [VX + 7, 0, 13], [VX + 7, 7.5, 13], [VX - 7, 7.5, 13]].map(P)), fill: "#15181c" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Cyl, { c, x: VX, z: 0, r: 8.6, y0: 11, y1: MOUNT_TOP, fill: C2.arm, hi: C2.armHi, stroke: C2.mast }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Cyl, { c, x: VX, z: 0, r: 6.4, y0: MOUNT_TOP, y1: MOUNT_TOP + 0.6, fill: "#20252b", hi: "#2c3238", stroke: C2.mast })
  ] });
};
var CatchSet = ({ c, l, s, vehicle, hiRail = 0, hiTruss = 0, load = -1, hiCarriage = 0, mount = true, farm = true, ground = true, mastTop, fore }) => {
  const vd = proj(c, [VX, s.carY, 0])[2];
  const arms = [1, -1].map((side) => ({ side, d: proj(c, armPt(s, side, 0.6, 0, 0))[2] }));
  const behind = arms.filter((a) => a.d < vd), front = arms.filter((a) => a.d >= vd);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("g", { children: [
    ground ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Ground, { c, l }) : null,
    farm ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(TankFarm, { c, l }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Mast, { c, l, top: mastTop }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(QDArm, { c, l }),
    mount ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Mount, { c, l }) : null,
    behind.map((a) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Arm, { c, s, side: a.side, l, hiRail, hiTruss, load }, a.side)),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Carriage, { c, s, l, hi: hiCarriage }),
    vehicle,
    front.map((a) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Arm, { c, s, side: a.side, l, hiRail, hiTruss, load }, a.side)),
    fore
  ] });
};
var PinMark = ({ c, s, above, side = 1, dx = 0, hi = 1, size = 1.2 }) => {
  const zR = side * (ARM_Z - 1.3);
  const y0 = s.carY + RAIL_DY + above;
  const q = [[VX + dx - size / 2, y0, zR], [VX + dx + size / 2, y0, zR], [VX + dx + size / 2, y0 + size * 0.85, zR], [VX + dx - size / 2, y0 + size * 0.85, zR]].map((p) => proj(c, p));
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polygon", { points: poly(q), fill: hi > 0 ? "#ffc93c" : "#7e8994", stroke: "#1c232b", strokeWidth: Math.max(1.5, c.z * 0.12), strokeLinejoin: "round" });
};
var Place = ({ c, p, tilt = 0, children }) => {
  const s = proj(c, p);
  const ky = Math.cos(c.pitch * D2);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("g", { transform: `translate(${s[0]} ${s[1]}) rotate(${tilt + (c.roll ?? 0)}) scale(${c.z} ${c.z * ky})`, children });
};
var azFor = (c, h) => -c.yaw - h;

// src/v2/vehicles.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var R = 4.5;
var BOOSTER_LEN = 72;
var INK = "#1c232b";
var D3 = Math.PI / 180;
var NS = { vectorEffect: "non-scaling-stroke" };
var PAL = {
  day: { hi: "#f3f6f8", mid: "#c2cad2", lo: "#7e8994", rim: "#a9b4bf", tile: "#1f2328", tileHi: "#3b424b", out: INK },
  dusk: { hi: "#f6dcc6", mid: "#b9a8a6", lo: "#5d6270", rim: "#e8a27c", tile: "#1b1d22", tileHi: "#3f3a3d", out: INK },
  night: { hi: "#9fb0c4", mid: "#5e6b7c", lo: "#2b3340", rim: "#6f86a6", tile: "#121519", tileHi: "#2a3038", out: "#0b0e12" },
  space: { hi: "#ffffff", mid: "#b8c2cc", lo: "#4a5562", rim: "#7fb0ff", tile: "#16191d", tileHi: "#353b44", out: INK },
  studio: { hi: "#f4f6f8", mid: "#c9d0d7", lo: "#86919c", rim: "#b8c3cd", tile: "#22262b", tileHi: "#3d444d", out: INK }
};
var wrap = (a) => ((a + 180) % 360 + 360) % 360 - 180;
var ShadeDefs = ({ id, p }) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("defs", { children: [
  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("linearGradient", { id: `${id}_steel`, gradientUnits: "userSpaceOnUse", x1: -R, x2: R, y1: 0, y2: 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0", stopColor: p.lo }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0.1", stopColor: p.mid }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0.3", stopColor: p.hi }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0.5", stopColor: p.mid }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0.8", stopColor: p.lo }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0.94", stopColor: p.lo }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "1", stopColor: p.rim })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("linearGradient", { id: `${id}_tile`, gradientUnits: "userSpaceOnUse", x1: -R, x2: R, y1: 0, y2: 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0", stopColor: p.tile }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0.28", stopColor: p.tileHi }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0.55", stopColor: p.tile }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "1", stopColor: p.tile })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("linearGradient", { id: `${id}_bell`, x1: "0", x2: "1", y1: "0", y2: "0", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0", stopColor: "#2a2522" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0.35", stopColor: "#8a7b6e" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0.6", stopColor: "#4d443d" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "1", stopColor: "#201c1a" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("pattern", { id: `${id}_hex`, width: 0.62, height: 0.54, patternUnits: "userSpaceOnUse", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M0 0.27 L0.155 0 L0.465 0 L0.62 0.27 L0.465 0.54 L0.155 0.54 Z", fill: "none", stroke: "rgba(255,255,255,0.16)", strokeWidth: 0.04 }) }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("radialGradient", { id: `${id}_heat`, cx: "0.5", cy: "0.5", r: "0.5", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0", stopColor: "#fff1d6", stopOpacity: "0.95" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0.35", stopColor: "#ff9a52", stopOpacity: "0.75" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0.7", stopColor: "#e2486e", stopOpacity: "0.35" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "1", stopColor: "#8a2fa8", stopOpacity: "0" })
  ] })
] });
var band = (prof, a0, a1, az) => {
  const lo = Math.max(a0, az - 90), hi = Math.min(a1, az + 90);
  if (hi <= lo) return null;
  const left = prof.map(([y, r]) => [r * Math.sin((lo - az) * D3), y]);
  const right = prof.map(([y, r]) => [r * Math.sin((hi - az) * D3), y]).reverse();
  return [...left, ...right].map((p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).join(" ");
};
var tileBands = (prof, hw, az) => {
  const a = wrap(az);
  const out = [];
  for (const off of [-360, 0, 360]) {
    const b = band(prof, -hw + off, hw + off, a);
    if (b) out.push(b);
  }
  return out;
};
var Plume = ({ x = 0, w, len, k, t, seed = 0 }) => {
  if (k <= 0.01) return null;
  const f = 1 + 0.06 * noise(t * 9, seed) + 0.03 * noise(t * 23, seed + 4);
  const L2 = len * k * f;
  const W = w * (0.7 + 0.3 * k);
  const outer = `M${x - W * 0.5} 0 C ${x - W * 0.95} ${L2 * 0.25}, ${x - W * 1.1} ${L2 * 0.6}, ${x} ${L2} C ${x + W * 1.1} ${L2 * 0.6}, ${x + W * 0.95} ${L2 * 0.25}, ${x + W * 0.5} 0 Z`;
  const core = `M${x - W * 0.34} 0 C ${x - W * 0.48} ${L2 * 0.18}, ${x - W * 0.4} ${L2 * 0.42}, ${x} ${L2 * 0.6} C ${x + W * 0.4} ${L2 * 0.42}, ${x + W * 0.48} ${L2 * 0.18}, ${x + W * 0.34} 0 Z`;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ellipse", { cx: x, cy: L2 * 0.3, rx: W * 2.4, ry: L2 * 0.55, fill: "url(#glowWarm)", opacity: 0.5 * k }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: outer, fill: "url(#plumeOuter)", opacity: 0.95 }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: core, fill: "url(#plumeCore)" }),
    [0.14, 0.27, 0.39].map((u, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ellipse", { cx: x, cy: L2 * u, rx: W * (0.2 - i * 0.035), ry: W * 0.1, fill: "#fff", opacity: 0.5 * k }, i))
  ] });
};
var SHIP_PROF = (() => {
  const p = [[0.6, R * 0.97], [0, R]];
  for (let y = -1; y >= -33; y -= 4) p.push([y, R]);
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    p.push([-33 - u * 19, R * Math.pow(Math.cos(u * Math.PI / 2), 0.62)]);
  }
  return p;
})();
var shipR = (y) => {
  if (y > -33) return R;
  const u = Math.min(1, (-33 - y) / 19);
  return R * Math.pow(Math.cos(u * Math.PI / 2), 0.62);
};
var FLAPS = {
  fwd: [1, -1].map((s) => ({ th: 112 * s, y0: -34.5, y1: -45.5, ty0: -36.6, ty1: -42.2, span: 2.5, side: s })),
  aft: [1, -1].map((s) => ({ th: 97 * s, y0: -0.6, y1: -14.2, ty0: -1.8, ty1: -10.6, span: 4.3, side: s }))
};
var flapGeom = (f, defl, az, radiusAt) => {
  const th = f.th * D3, td = (f.th + f.side * defl) * D3, a = az * D3;
  const ex = [-Math.sin(a), Math.cos(a)], cv = [Math.cos(a), Math.sin(a)];
  const pt = (y, out) => {
    const r = radiusAt(y);
    const P = [r * Math.cos(th) + out * Math.cos(td), r * Math.sin(th) + out * Math.sin(td)];
    return { x: P[0] * ex[0] + P[1] * ex[1], d: P[0] * cv[0] + P[1] * cv[1], y };
  };
  const q = [pt(f.y0, 0), pt(f.y1, 0), pt(f.ty1, f.span), pt(f.ty0, f.span)];
  const n = [-Math.sin(td), Math.cos(td)];
  const facing = n[0] * cv[0] + n[1] * cv[1];
  const windwardFace = n[0] * 1 > 0 ? 1 : -1;
  const tileVisible = facing * windwardFace > 0;
  const depth = (q[0].d + q[2].d) / 2;
  return { q, depth, tileVisible, edge: Math.abs(facing) };
};
var Ship = ({ az = 90, flapFwd = 0, flapAft = 0, engines = 0, t = 0, pal = "day", heat = 0, detail = false, fittings = 0, id = "ship", plumeLen = 26, ghost = false }) => {
  const p = PAL[pal];
  const gid = `${id}_${pal}`;
  const a = wrap(az);
  const flaps = [...FLAPS.fwd.map((f) => ({ f, g: flapGeom(f, flapFwd, a, shipR) })), ...FLAPS.aft.map((f) => ({ f, g: flapGeom(f, flapAft, a, shipR) }))];
  const back = flaps.filter((x) => x.g.depth < 0);
  const front = flaps.filter((x) => x.g.depth >= 0);
  const outline = [...SHIP_PROF.map(([y, r]) => `${-r},${y}`), ...SHIP_PROF.slice().reverse().map(([y, r]) => `${r},${y}`)].join(" ");
  const tiles = tileBands(SHIP_PROF.filter(([y]) => y <= 0.3), 100, a);
  const FlapEl = ({ g }) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "polygon",
    {
      points: g.q.map((v) => `${v.x.toFixed(3)},${v.y.toFixed(3)}`).join(" "),
      fill: g.tileVisible ? p.tile : p.mid,
      stroke: p.out,
      strokeWidth: 2,
      strokeLinejoin: "round",
      ...NS
    }
  );
  const eng = [
    ...[0, 120, 240].map((th) => ({ th, r: 1.25, vac: false })),
    ...[60, 180, 300].map((th) => ({ th, r: 3, vac: true }))
  ].map((e) => ({ ...e, x: e.r * Math.sin((e.th - a) * D3), d: e.r * Math.cos((e.th - a) * D3) })).sort((m, n) => m.d - n.d);
  const fit = [90, -90].map((th) => ({ x: (R + 0.35) * Math.sin((th - a) * D3), d: Math.cos((th - a) * D3) }));
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { opacity: ghost ? 0.35 : 1, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ShadeDefs, { id: gid, p }),
    engines > 0.01 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("g", { children: [-1.1, 0, 1.1].map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Plume, { x: x * Math.abs(Math.cos(a * D3)) * 0.4 + x * 0.6, w: 1.6, len: plumeLen, k: engines, t, seed: i }, i)) }) : null,
    eng.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "path",
      {
        d: e.vac ? `M${e.x - 0.75} -0.3 L${e.x + 0.75} -0.3 L${e.x + 1.15} 0.9 L${e.x - 1.15} 0.9 Z` : `M${e.x - 0.3} -0.3 L${e.x + 0.3} -0.3 L${e.x + 0.42} 0.5 C ${e.x + 0.6} 1.2, ${e.x + 0.66} 1.6, ${e.x + 0.66} 1.9 L${e.x - 0.66} 1.9 C ${e.x - 0.66} 1.6, ${e.x - 0.6} 1.2, ${e.x - 0.42} 0.5 Z`,
        fill: `url(#${gid}_bell)`,
        stroke: p.out,
        strokeWidth: 1.4,
        ...NS
      },
      i
    )),
    back.map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FlapEl, { g: x.g }, `b${i}`)),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("polygon", { points: outline, fill: `url(#${gid}_steel)` }),
    tiles.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("polygon", { points: b, fill: `url(#${gid}_tile)` }),
      detail ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("polygon", { points: b, fill: `url(#${gid}_hex)` }) : null
    ] }, i)),
    Array.from({ length: 17 }, (_, i) => -1.83 * (i + 1)).map((y, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: -R, x2: R, y1: y, y2: y, stroke: "rgba(20,26,32,0.16)", strokeWidth: 1, ...NS }, i)),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("polygon", { points: outline, fill: "none", stroke: p.out, strokeWidth: 2.4, strokeLinejoin: "round", ...NS }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: -R, y: -0.9, width: 2 * R, height: 0.9, fill: "rgba(20,24,30,0.22)" }),
    fittings > 0 ? fit.filter((f) => f.d > -0.2).map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("g", { opacity: Math.min(1, fittings), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: f.x - 0.7, y: -36.4, width: 1.4, height: 1.3, rx: 0.2, fill: "#ffc93c", stroke: p.out, strokeWidth: 1.6, ...NS }) }, i)) : fit.filter((f) => f.d > -0.2).map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: f.x - 0.55, y: -36.2, width: 1.1, height: 1, rx: 0.15, fill: p.lo, stroke: p.out, strokeWidth: 1.2, ...NS }, i)),
    front.map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FlapEl, { g: x.g }, `f${i}`)),
    heat > 0.01 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ShipHeat, { az: a, k: heat, t, gid }) : null
  ] });
};
var ShipHeat = ({ az, k, t, gid }) => {
  const wx = -Math.sin(az * D3);
  const faceOn = Math.abs(Math.cos(az * D3));
  const side = Math.abs(wx) < 0.15 ? 1 : Math.sign(wx);
  const f = 1 + 0.06 * noise(t * 7, 2);
  const ys = Array.from({ length: 26 }, (_, i) => 1 - i * 2);
  const outer = ys.map((y) => [side * (shipR(y) * Math.max(0.35, Math.abs(wx)) + (2.2 + 1.4 * Math.sin(-y / 50 * Math.PI)) * f), y]);
  const inner = ys.slice().reverse().map((y) => [side * shipR(y) * Math.max(0.3, Math.abs(wx)) * 0.55, y]);
  const pts = [...outer, ...inner].map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
  const gx = `${gid}_shock${side > 0 ? "r" : "l"}`;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { opacity: k, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("linearGradient", { id: gx, gradientUnits: "userSpaceOnUse", x1: 0, x2: side * (R + 4), y1: 0, y2: 0, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0.45", stopColor: "#fff6e8", stopOpacity: "0.95" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0.7", stopColor: "#ffb06a", stopOpacity: "0.85" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "0.88", stopColor: "#f0508a", stopOpacity: "0.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("stop", { offset: "1", stopColor: "#7a3ad0", stopOpacity: "0" })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ellipse", { cx: side * 1.5, cy: -25, rx: R * 2.4, ry: 34 * f, fill: `url(#${gid}_heat)`, opacity: 0.45 + 0.25 * faceOn }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("polygon", { points: pts, fill: `url(#${gx})`, opacity: 0.95 - 0.35 * faceOn }),
    faceOn > 0.3 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("polygon", { points: SHIP_PROF.map(([y, r]) => `${-r * 0.92},${y}`).concat(SHIP_PROF.slice().reverse().map(([y, r]) => `${r * 0.92},${y}`)).join(" "), fill: `url(#${gid}_heat)`, opacity: 0.55 * faceOn }) : null
  ] });
};
var FIN_Y = { v3: -63.2, v1: -66.2 };
var Booster = ({ az = 90, version = "v3", engines = 0, t = 0, pal = "day", fins = 24, id = "bst", plumeLen = 40, catchHi = 0, ghost = false }) => {
  const p = PAL[pal];
  const gid = `${id}_${pal}`;
  const a = wrap(az);
  const L2 = BOOSTER_LEN;
  const outline = `${-R},${0.4} ${-R},${-L2} ${R},${-L2} ${R},${0.4}`;
  const finAz = version === "v3" ? [0, 120, 240] : [45, 135, 225, 315];
  const span = version === "v3" ? 4.6 : 3.6;
  const wid = version === "v3" ? 4 : 3;
  const fy = FIN_Y[version];
  const finEls = finAz.map((th) => {
    const s = Math.sin((th - a) * D3), c = Math.cos((th - a) * D3);
    const xs = [R * s - wid / 2 * c, R * s + wid / 2 * c, (R + span) * s + wid / 2 * c, (R + span) * s - wid / 2 * c];
    const thick = 0.7 + Math.abs(Math.sin(fins * D3)) * (version === "v3" ? 3.4 : 2.6) * (0.35 + 0.65 * Math.abs(c));
    return { th, c, s, xs, thick };
  }).sort((m, n) => m.c - n.c);
  const FinEl = ({ f }) => {
    const x0 = Math.min(...f.xs), x1 = Math.max(...f.xs);
    const top = fy - f.thick / 2, bot = fy + f.thick / 2;
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: x0, y: top, width: Math.max(0.4, x1 - x0), height: f.thick, fill: p.lo, stroke: p.out, strokeWidth: 2, ...NS }),
      x1 - x0 > 1.2 && f.thick > 1.2 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
        Array.from({ length: Math.floor((x1 - x0) / 0.5) }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: x0 + 0.25 + i * 0.5, x2: x0 + 0.25 + i * 0.5 + f.thick * 0.5, y1: top + 0.1, y2: bot - 0.1, stroke: "rgba(15,18,22,0.75)", strokeWidth: 1, ...NS }, i)),
        Array.from({ length: Math.floor((x1 - x0) / 0.5) }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: x0 + 0.25 + i * 0.5 + f.thick * 0.5, x2: x0 + 0.25 + i * 0.5, y1: top + 0.1, y2: bot - 0.1, stroke: "rgba(15,18,22,0.75)", strokeWidth: 1, ...NS }, `r${i}`))
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: R * f.s - 0.7, y: fy - 1.3, width: 1.4, height: 2.6, fill: p.mid, stroke: p.out, strokeWidth: 1.4, ...NS, opacity: f.c > -0.2 ? 1 : 0 })
    ] });
  };
  const pins = version === "v1" ? [90, 270].map((th) => ({ x: (R + 0.5) * Math.sin((th - a) * D3), d: Math.cos((th - a) * D3) })) : [];
  const bells = Array.from({ length: 20 }, (_, i) => i * 18).map((th) => ({ x: 3.8 * Math.sin((th - a) * D3), d: Math.cos((th - a) * D3) })).filter((b) => b.d > -0.3).sort((m, n) => m.d - n.d);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { opacity: ghost ? 0.35 : 1, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ShadeDefs, { id: gid, p }),
    engines > 0.01 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("g", { children: [-2.2, 0, 2.2].map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Plume, { x, w: 2.4, len: plumeLen, k: engines, t, seed: i + 3 }, i)) }) : null,
    bells.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: `M${b.x - 0.32} 0 L${b.x + 0.32} 0 L${b.x + 0.62} 1.6 L${b.x - 0.62} 1.6 Z`, fill: `url(#${gid}_bell)`, stroke: p.out, strokeWidth: 1.2, ...NS }, i)),
    finEls.filter((f) => f.c < 0).map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FinEl, { f }, `b${i}`)),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("polygon", { points: outline, fill: `url(#${gid}_steel)` }),
    Array.from({ length: 38 }, (_, i) => -1.83 * (i + 1)).map((y, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: -R, x2: R, y1: y, y2: y, stroke: "rgba(20,26,32,0.14)", strokeWidth: 1, ...NS }, i)),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: -R, y: -5.5, width: 2 * R, height: 5.9, fill: "rgba(40,36,34,0.35)" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: -R, y: -L2, width: 2 * R, height: version === "v3" ? 2.6 : 2.2, fill: "rgba(30,34,40,0.55)" }),
    Array.from({ length: 7 }, (_, i) => -R + 0.9 + i * 1.2).map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x, y: -L2 + 0.6, width: 0.7, height: version === "v3" ? 1.4 : 1, fill: "#0f1215", opacity: 0.85 }, i)),
    (() => {
      const rc = Math.cos((200 - a) * D3);
      const rx = R * Math.sin((200 - a) * D3);
      return rc > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: rx - 0.35, y: -L2 + 3, width: 0.7, height: L2 - 9, fill: p.mid, stroke: "rgba(20,26,32,0.5)", strokeWidth: 1, ...NS }) : null;
    })(),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("polygon", { points: outline, fill: "none", stroke: p.out, strokeWidth: 2.4, strokeLinejoin: "round", ...NS }),
    pins.filter((q) => q.d > -0.2).map((q, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: q.x - 0.6, y: -L2 + 4.6, width: 1.2, height: 1, rx: 0.15, fill: catchHi > 0 ? "#ffc93c" : p.lo, stroke: p.out, strokeWidth: 1.4, ...NS }, i)),
    finEls.filter((f) => f.c >= 0).map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FinEl, { f }, `f${i}`)),
    version === "v3" && catchHi > 0 ? finEls.filter((f) => f.c >= -0.1).map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: R * f.s - 0.8, y: fy - 1.9, width: 1.6, height: 0.8, rx: 0.15, fill: "#ffc93c", stroke: p.out, strokeWidth: 1.4, opacity: catchHi, ...NS }, i)) : null
  ] });
};
var Stack = ({ az = 90, t = 0, pal = "day", engines = 0, id = "stk" }) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Booster, { az, pal, t, engines, id: `${id}b`, plumeLen: 70 }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("g", { transform: `translate(0 ${-BOOSTER_LEN})`, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Ship, { az, pal, t, id: `${id}s` }) })
] });
var ShipEngineView = ({ lit = 0, hiSea = 0, t = 0 }) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { r: R, fill: "#3a4049", stroke: INK, strokeWidth: 3, ...NS }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { r: R * 0.92, fill: "#2a2f36" }),
  [60, 180, 300].map((th, i) => {
    const x = 3 * Math.sin(th * D3), y = -3 * Math.cos(th * D3);
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: x, cy: y, r: 1.2, fill: "#5a4f47", stroke: INK, strokeWidth: 2.4, ...NS }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: x, cy: y, r: 0.95, fill: "#1a1715" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: x, cy: y, r: 0.25, fill: "#4a413b" })
    ] }, `v${i}`);
  }),
  [0, 120, 240].map((th, i) => {
    const x = 1.25 * Math.sin(th * D3), y = -1.25 * Math.cos(th * D3);
    const g = lit * (0.85 + 0.15 * noise(t * 11, i));
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: x, cy: y, r: 0.66, fill: "#6d5f55", stroke: hiSea > 0 ? "#ffc93c" : INK, strokeWidth: hiSea > 0 ? 3.5 : 2.2, ...NS }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: x, cy: y, r: 0.5, fill: "#1a1715" }),
      g > 0.01 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: x, cy: y, r: 0.5, fill: "#fff3d0", opacity: g }) : null,
      g > 0.01 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: x, cy: y, r: 1.1, fill: "url(#glowWarm)", opacity: g }) : null
    ] }, `s${i}`);
  })
] });
var FinTopView = ({ elev = 32, rot = 0, catchHi = 0, ver = "v3" }) => {
  const se = Math.sin(elev * D3), ce = Math.cos(elev * D3);
  const P = (x, y, z) => [x, z * se - y * ce];
  const fy = 0;
  const span = ver === "v3" ? 4.6 : 3.6, wid = ver === "v3" ? 4 : 3;
  const fins = (ver === "v3" ? [0, 120, 240] : [45, 135, 225, 315]).map((a0) => {
    const a = (a0 + rot) * D3;
    const ur = [Math.sin(a), Math.cos(a)], ut = [Math.cos(a), -Math.sin(a)];
    const pt = (r, w) => P(ur[0] * r + ut[0] * w, fy, ur[1] * r + ut[1] * w);
    return { a, depth: ur[1], ur, ut, pt };
  });
  const topH = 9;
  const body = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: `M${-R} ${P(0, -30, 0)[1]} L${-R} ${P(0, topH, 0)[1]} A ${R} ${R * se} 0 0 1 ${R} ${P(0, topH, 0)[1]} L${R} ${P(0, -30, 0)[1]} Z`, fill: "url(#steelCyl)", stroke: INK, strokeWidth: 2.4, ...NS }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ellipse", { cx: 0, cy: P(0, topH, 0)[1], rx: R, ry: R * se, fill: "#3a4049", stroke: INK, strokeWidth: 2.4, ...NS }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ellipse", { cx: 0, cy: P(0, topH, 0)[1], rx: R * 0.8, ry: R * 0.8 * se, fill: "#59616c" }),
    Array.from({ length: 24 }, (_, i) => {
      const a = i / 24 * Math.PI * 2;
      const x = R * Math.sin(a), z = R * Math.cos(a);
      if (z < 0) return null;
      const p1 = P(x, topH - 0.6, z), p2 = P(x, topH - 2.4, z);
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], stroke: "#0f1215", strokeWidth: 3, ...NS }, i);
    })
  ] });
  const Fin = ({ f }) => {
    const c = [f.pt(R, -wid / 2), f.pt(R + span, -wid / 2), f.pt(R + span, wid / 2), f.pt(R, wid / 2)];
    const grid = [];
    for (let i = 1; i < 8; i++) {
      const u = i / 8;
      const a1 = f.pt(R + span * u, -wid / 2), a2 = f.pt(R + span * u, wid / 2);
      const b1 = f.pt(R, -wid / 2 + wid * u), b2 = f.pt(R + span, -wid / 2 + wid * u);
      grid.push(/* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: a1[0], y1: a1[1], x2: a2[0], y2: a2[1], stroke: "#1f252c", strokeWidth: 2, ...NS }, `a${i}`));
      grid.push(/* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: b1[0], y1: b1[1], x2: b2[0], y2: b2[1], stroke: "#1f252c", strokeWidth: 2, ...NS }, `b${i}`));
    }
    const cf = [f.pt(R - 0.2, -0.8), f.pt(R + 1.2, -0.8), f.pt(R + 1.2, 0.8), f.pt(R - 0.2, 0.8)];
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("polygon", { points: c.map((p) => p.join(",")).join(" "), fill: "#8d98a3", stroke: INK, strokeWidth: 2.6, strokeLinejoin: "round", ...NS }),
      grid,
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("polygon", { points: cf.map((p) => p.join(",")).join(" "), fill: catchHi > 0 ? "#ffc93c" : "#5d6670", stroke: INK, strokeWidth: 2, opacity: ver === "v3" ? 1 : 0, ...NS })
    ] });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
    fins.filter((f) => f.depth < 0).map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Fin, { f }, `b${i}`)),
    body,
    fins.filter((f) => f.depth >= 0).map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Fin, { f }, `f${i}`))
  ] });
};

// src/v2/scene.tsx
var import_remotion2 = require("remotion");

// src/assets/defs.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var Defs = () => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("defs", { children: [
  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("linearGradient", { id: "steelCyl", x1: "0", x2: "1", y1: "0", y2: "0", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0", stopColor: "#8d97a1" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.12", stopColor: "#d9dee3" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.3", stopColor: "#f4f6f8" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.52", stopColor: "#c5ccd3" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.78", stopColor: "#959fa9" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.93", stopColor: "#b7bfc7" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "1", stopColor: "#7d8791" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("linearGradient", { id: "steelCylDusk", x1: "0", x2: "1", y1: "0", y2: "0", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0", stopColor: "#6e6a72" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.14", stopColor: "#d9b9a3" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.32", stopColor: "#f2d9c4" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.55", stopColor: "#a9a3a8" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.8", stopColor: "#6f7580" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "1", stopColor: "#59606b" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("linearGradient", { id: "tileCyl", x1: "0", x2: "1", y1: "0", y2: "0", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0", stopColor: "#15181c" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.35", stopColor: "#30353c" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.7", stopColor: "#23272d" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "1", stopColor: "#1a1d21" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("linearGradient", { id: "towerSteel", x1: "0", x2: "1", y1: "0", y2: "0", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0", stopColor: "#4b5764" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.5", stopColor: "#5d6a78" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "1", stopColor: "#3a444f" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("linearGradient", { id: "armSteel", x1: "0", x2: "0", y1: "0", y2: "1", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0", stopColor: "#6c7987" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.45", stopColor: "#4d5967" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "1", stopColor: "#36404a" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("linearGradient", { id: "bell", x1: "0", x2: "1", y1: "0", y2: "0", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0", stopColor: "#3b3430" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.35", stopColor: "#8a7b6e" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.6", stopColor: "#5a4f47" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "1", stopColor: "#2a2522" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("linearGradient", { id: "plumeCore", x1: "0", x2: "0", y1: "0", y2: "1", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0", stopColor: "#ffffff" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.25", stopColor: "#fff3c4" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.7", stopColor: "#ffb347", stopOpacity: "0.8" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "1", stopColor: "#ff7a2f", stopOpacity: "0" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("linearGradient", { id: "plumeOuter", x1: "0", x2: "0", y1: "0", y2: "1", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0", stopColor: "#ffd27a", stopOpacity: "0.95" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.45", stopColor: "#ff8a3d", stopOpacity: "0.55" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "1", stopColor: "#ff5a1f", stopOpacity: "0" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("radialGradient", { id: "glowWarm", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0", stopColor: "#ffd9a0", stopOpacity: "0.9" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.4", stopColor: "#ff9a4a", stopOpacity: "0.45" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "1", stopColor: "#ff6a2a", stopOpacity: "0" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("radialGradient", { id: "glowPlasma", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0", stopColor: "#ffe9d0", stopOpacity: "0.95" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.35", stopColor: "#ff8f5a", stopOpacity: "0.7" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.7", stopColor: "#d0408a", stopOpacity: "0.3" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "1", stopColor: "#7a2a9a", stopOpacity: "0" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("radialGradient", { id: "glowWhite", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0", stopColor: "#ffffff", stopOpacity: "0.9" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "1", stopColor: "#ffffff", stopOpacity: "0" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("radialGradient", { id: "vignette", cx: "0.5", cy: "0.5", r: "0.75", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0.6", stopColor: "#000", stopOpacity: "0" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "1", stopColor: "#000", stopOpacity: "0.45" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("pattern", { id: "tilesHex", width: "0.9", height: "0.78", patternUnits: "userSpaceOnUse", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M0 0.39 L0.225 0 L0.675 0 L0.9 0.39 L0.675 0.78 L0.225 0.78 Z", fill: "none", stroke: "#454b53", strokeWidth: "0.06" }) }),
  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("pattern", { id: "gridLattice", width: "0.7", height: "0.7", patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { width: "0.7", height: "0.7", fill: "#7d8996" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: "0.13", y: "0.13", width: "0.44", height: "0.44", fill: "#1f252c" })
  ] })
] });

// src/kit/ui.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var C = {
  ink: "#1c232b",
  ink2: "#2b3540",
  cream: "#fbf4e4",
  yellow: "#ffc93c",
  orange: "#ff8a3d",
  teal: "#2ec4b6",
  red: "#e5484d",
  steelHi: "#eef1f4",
  steel: "#c3cad2",
  steelMid: "#9aa4ae",
  steelLo: "#6b7580",
  tile: "#22262b",
  tileHi: "#3a4048",
  tower: "#3b4651",
  towerHi: "#5b6875"
};
var FONT = {
  ui: '"Nunito Variable", sans-serif',
  title: '"Fredoka Variable", sans-serif',
  mono: '"JetBrains Mono", monospace'
};

// src/v2/scene.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
var Frame = ({ children, bg = "#0d1218" }) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_remotion2.AbsoluteFill, { style: { background: bg }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("svg", { width: 1920, height: 1080, viewBox: "0 0 1920 1080", style: { position: "absolute", inset: 0 }, children: [
  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Defs, {}),
  children
] }) });
var SKIES = {
  day: ["#4b8ccc", "#86bce6", "#d6ebf6"],
  dusk: ["#2a3560", "#b56a73", "#ffb27a"],
  night: ["#060a15", "#0f1830", "#1f2a46"],
  studio: ["#9fb8cc", "#c6d7e3", "#e9eff3"],
  high: ["#050816", "#14265a", "#4f86c8"],
  space: ["#020309", "#05070f", "#0a0f1e"],
  gulf: ["#5b97cf", "#9cc8ea", "#e2f0f7"]
};
var Sky = ({ k, horizon = 0.7, sun }) => {
  const s = SKIES[k];
  const id = `v2sky_${k}_${Math.round(horizon * 100)}`;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("g", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("defs", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("linearGradient", { id, x1: "0", x2: "0", y1: "0", y2: "1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: "0", stopColor: s[0] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: horizon * 0.75, stopColor: s[1] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: horizon, stopColor: s[2] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: "1", stopColor: s[2] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("radialGradient", { id: `${id}_sun`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: "0", stopColor: "#fff4d8", stopOpacity: "0.95" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: "0.2", stopColor: "#ffd08a", stopOpacity: "0.55" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: "1", stopColor: "#ff9a5a", stopOpacity: "0" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("rect", { x: -20, y: -20, width: 1960, height: 1120, fill: `url(#${id})` }),
    sun ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: sun[0], cy: sun[1], r: 260, fill: `url(#${id}_sun)` }) : null
  ] });
};
var skyOf = (l) => l === "day" ? "day" : l === "dusk" ? "dusk" : l === "night" ? "night" : "studio";
var Clouds = ({ n = 8, seed = 1, y0 = 120, y1 = 600, dx = 0, dy = 0, s = 1, tint = "#f4f6f8", o = 0.9 }) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("g", { opacity: o, children: Array.from({ length: n }, (_, i) => {
  const x = ((rnd(i, seed) * 2600 + dx * (0.6 + rnd(i, seed + 5) * 0.8)) % 2600 + 2600) % 2600 - 340;
  const y = y0 + rnd(i, seed + 1) * (y1 - y0) + dy * (0.6 + rnd(i, seed + 6) * 0.8);
  const k = s * (0.5 + rnd(i, seed + 2) * 1);
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("g", { transform: `translate(${x} ${y}) scale(${k})`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M-150 18 C -150 -6, -110 -20, -84 -12 C -70 -42, -20 -50, 4 -28 C 26 -54, 92 -46, 100 -14 C 136 -16, 160 4, 150 18 Z", fill: tint }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M-150 18 L150 18 C 120 26, -110 26, -150 18 Z", fill: "rgba(80,100,130,0.18)" })
  ] }, i);
}) });
var Limb = ({ top, r = 5200, cx = 960, night = 0, glow = 1 }) => {
  const cy = top + r;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("g", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("defs", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("radialGradient", { id: "v2atmo", cx, cy, r: r * 1.03, gradientUnits: "userSpaceOnUse", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: 0.955, stopColor: "#8fd0ff", stopOpacity: "0" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: 0.972, stopColor: "#9fd8ff", stopOpacity: 0.75 * glow }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: 1, stopColor: "#3a70c0", stopOpacity: "0" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("linearGradient", { id: "v2earth", x1: "0", x2: "0", y1: "0", y2: "1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: "0", stopColor: "#3f86c9" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: "0.02", stopColor: "#2a64a6" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: "0.12", stopColor: "#173f72" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: "1", stopColor: "#0b2245" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx, cy, r: r * 1.03, fill: "url(#v2atmo)" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("g", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("clipPath", { id: "v2earthclip", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx, cy, r }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("rect", { x: -100, y: top - 5, width: 2120, height: 1200, fill: "url(#v2earth)", clipPath: "url(#v2earthclip)" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("g", { clipPath: "url(#v2earthclip)", opacity: 0.55, children: Array.from({ length: 26 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("ellipse", { cx: rnd(i, 31) * 2200 - 140, cy: top + 20 + Math.pow(rnd(i, 32), 1.6) * 700, rx: 60 + rnd(i, 33) * 160, ry: 6 + rnd(i, 34) * 14, fill: "#e9f2fa", opacity: 0.5 + rnd(i, 35) * 0.4 }, i)) }),
      night > 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("rect", { x: -100, y: top - 5, width: 2120, height: 1200, fill: "#030714", opacity: night, clipPath: "url(#v2earthclip)" }) : null
    ] })
  ] });
};
var SeaPlane = ({ y, t, tint = ["#3f7fae", "#1f4a72"] }) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("g", { children: [
  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("linearGradient", { id: `v2sea_${tint[0].slice(1)}`, x1: "0", x2: "0", y1: "0", y2: "1", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: "0", stopColor: tint[0] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("stop", { offset: "1", stopColor: tint[1] })
  ] }) }),
  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("rect", { x: -50, y, width: 2020, height: 1200, fill: `url(#v2sea_${tint[0].slice(1)})` }),
  Array.from({ length: 40 }, (_, i) => {
    const yy = y + 8 + Math.pow(rnd(i, 7), 1.7) * 600;
    const sc = 0.3 + (yy - y) / 600;
    const x = (rnd(i, 8) * 2100 + t * 14 * sc) % 2100 - 90;
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("line", { x1: x, x2: x + 30 * sc + rnd(i, 9) * 40 * sc, y1: yy, y2: yy, stroke: "rgba(255,255,255,0.22)", strokeWidth: 1.5 + sc * 2, strokeLinecap: "round" }, i);
  })
] });
var Credit = ({ text, o = 1 }) => o <= 0.01 ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("g", { opacity: o, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("text", { x: 56, y: 1030, fontFamily: FONT.ui, fontWeight: 700, fontSize: 24, fill: "#fbf4e4", letterSpacing: 1.2, style: { paintOrder: "stroke" }, stroke: "rgba(0,0,0,0.55)", strokeWidth: 5, children: text }) });
var Word = ({ text, x, y, o = 1, size = 96, color = C.yellow, anchor = "middle" }) => o <= 0.01 ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("g", { opacity: clamp(o), transform: `translate(${x} ${y}) scale(${0.92 + 0.08 * clamp(o)})`, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("text", { textAnchor: anchor, fontFamily: FONT.title, fontWeight: 700, fontSize: size, fill: color, stroke: C.ink, strokeWidth: size * 0.09, style: { paintOrder: "stroke" }, letterSpacing: size * 0.03, children: text }) });
var Tag = ({ text, x, y, to, o = 1, size = 30, align = "l" }) => {
  if (o <= 0.01) return null;
  const w = text.length * size * 0.62 + size * 0.9;
  const X = align === "r" ? x - w : x;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("g", { opacity: clamp(o), children: [
    to ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("line", { x1: align === "r" ? x : x, y1: y, x2: to[0], y2: to[1], stroke: C.cream, strokeWidth: 3, strokeLinecap: "round", style: { filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" } }) : null,
    to ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: to[0], cy: to[1], r: 6, fill: C.yellow, stroke: C.ink, strokeWidth: 2.5 }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("rect", { x: X, y: y - size * 0.82, width: w, height: size * 1.5, rx: size * 0.3, fill: "rgba(20,25,31,0.82)" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("text", { x: X + size * 0.45, y: y + size * 0.26, fontFamily: FONT.title, fontWeight: 600, fontSize: size, fill: C.cream, letterSpacing: size * 0.04, children: text })
  ] });
};

// src/v2/shots/common.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
var shipRestY = (carY) => carY + RAIL_DY - 35.1;
var boosterRestY = (carY, v) => carY + RAIL_DY - (v === "v3" ? 64.3 : 66.4);
var approach = (t, t0, t1, h0, settle = 0.35) => {
  if (t <= t0) return h0;
  if (t < t1) {
    const u = (t - t0) / (t1 - t0);
    return h0 * Math.pow(1 - u, 2.2);
  }
  const v = t - t1;
  return -settle * (1 - Math.exp(-v * 4)) - settle * 0.25 * Math.exp(-v * 3) * Math.sin(v * 9);
};
var throttle = (t, t0, t1, cut = 0.5) => clamp(prog(t, t0 - 0.4, t0) * (1 - prog(t, t1, t1 + cut)));
var CatchView = ({ t, c, l, s, sky, vehicle, clouds = true, overlay, sun, under, ...rest }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(Frame, { children: [
  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Sky, { k: sky ?? skyOf(l), sun: sun ?? (l === "dusk" ? [1500, 760] : void 0) }),
  under,
  clouds ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Clouds, { n: 7, seed: 3, y0: 60, y1: 380, dx: t * 6 - c.at[0] * c.z * 0.15, dy: c.at[1] * c.z * 0.12, s: 0.9, tint: l === "dusk" ? "#f3c0a6" : l === "night" ? "#253049" : "#f4f6f8", o: l === "night" ? 0.6 : 0.75 }) : null,
  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(CatchSet, { c, l, s, vehicle, ...rest }),
  overlay
] });
var ShipAt = ({
  c,
  carY,
  above,
  dx = 0,
  dz = 0,
  tilt = 0,
  heading = 90,
  l,
  props = {}
}) => {
  const p = [VX + dx, shipRestY(carY) + above, dz];
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Place, { c, p, tilt, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Ship, { az: azFor(c, heading), pal: palFor(l), ...props }) });
};
var BoosterAt = ({
  c,
  carY,
  above,
  v,
  dx = 0,
  tilt = 0,
  heading = 0,
  l,
  props = {}
}) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Place, { c, p: [VX + dx, boosterRestY(carY, v) + above, 0], tilt, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Booster, { az: azFor(c, heading), version: v, pal: palFor(l), ...props }) });
var InFlight = ({ x, y, rot, z, children }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("g", { transform: `translate(${x} ${y}) rotate(${rot}) scale(${z})`, children });
var Streaks = ({ t, dir, n = 26, k = 1, color = "rgba(255,255,255,0.35)", seed = 2 }) => {
  if (k <= 0.01) return null;
  const len = Math.hypot(dir[0], dir[1]) || 1;
  const ux = dir[0] / len, uy = dir[1] / len;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("g", { opacity: k, children: Array.from({ length: n }, (_, i) => {
    const ph = (t * (0.9 + i % 5 * 0.15) + i * 0.6180339 % 1) % 1;
    const bx = i * 397 % 1920 + noise(i, seed) * 80;
    const by = i * 211 % 1080 + noise(i, seed + 3) * 60;
    const off = (ph - 0.5) * 2600;
    const x = ((bx + ux * off) % 2200 + 2200) % 2200 - 140, y = ((by + uy * off) % 1300 + 1300) % 1300 - 110;
    const L2 = 80 + i % 4 * 50;
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("line", { x1: x, y1: y, x2: x - ux * L2, y2: y - uy * L2, stroke: color, strokeWidth: 2 + i % 3, strokeLinecap: "round" }, i);
  }) });
};

// src/v2/data/narr.json
var narr_default = {
  duration: 339.6,
  sections: [
    {
      id: "S0",
      s: 0.25,
      e: 11.49
    },
    {
      id: "S1",
      s: 13.69,
      e: 49.07
    },
    {
      id: "S2",
      s: 50.67,
      e: 85.1
    },
    {
      id: "S3",
      s: 86.5,
      e: 125.22
    },
    {
      id: "S4",
      s: 126.62,
      e: 164.7
    },
    {
      id: "S5",
      s: 166.3,
      e: 201.28
    },
    {
      id: "S6",
      s: 202.68,
      e: 239.58
    },
    {
      id: "S7",
      s: 240.78,
      e: 267.8
    },
    {
      id: "S8",
      s: 269.4,
      e: 306.26
    },
    {
      id: "S9",
      s: 308.26,
      e: 335.6
    }
  ],
  lines: [
    {
      id: "S0_00",
      sec: "S0",
      s: 0.31,
      e: 2.21,
      text: "SpaceX wants to do this twice."
    },
    {
      id: "S0_01",
      sec: "S0",
      s: 2.65,
      e: 7.01,
      text: "First, the booster, then the spacecraft after it comes back from orbit."
    },
    {
      id: "S0_02",
      sec: "S0",
      s: 7.53,
      e: 11.31,
      text: "And if that handoff goes wrong, the rocket isn't the only thing at risk."
    },
    {
      id: "S1_00",
      sec: "S1",
      s: 13.75,
      e: 15.65,
      text: "Super Heavy is the booster underneath."
    },
    {
      id: "S1_01",
      sec: "S1",
      s: 16.13,
      e: 18.31,
      text: "Starship is the pointed spacecraft on top."
    },
    {
      id: "S1_02",
      sec: "S1",
      s: 18.71,
      e: 21.23,
      text: "They launch together, then take very different trips."
    },
    {
      id: "S1_03",
      sec: "S1",
      s: 21.71,
      e: 24.55,
      text: "The booster turns back toward the coast while the ship keeps going."
    },
    {
      id: "S1_04",
      sec: "S1",
      s: 25.19,
      e: 30.05,
      text: "In October twenty twenty-four, SpaceX caught a returning booster with the tower's giant arms."
    },
    {
      id: "S1_05",
      sec: "S1",
      s: 31.21,
      e: 38.85,
      text: "Now, for flight fifteen, it says it wants to attempt both recoveries, two catches during one mission separated by the ship's flight."
    },
    {
      id: "S1_06",
      sec: "S1",
      s: 39.47,
      e: 46.01,
      text: "The new challenge is bringing a spacecraft back through the atmosphere, turning it upright, and delivering it to the machinery waiting on the ground."
    },
    {
      id: "S1_07",
      sec: "S1",
      s: 46.65,
      e: 48.95,
      text: "The launch site becomes part of the landing system."
    },
    {
      id: "S2_00",
      sec: "S2",
      s: 50.73,
      e: 52.35,
      text: "Look closely at that first catch."
    },
    {
      id: "S2_01",
      sec: "S2",
      s: 52.81,
      e: 55.33,
      text: "The booster is still firing its engines on the way in."
    },
    {
      id: "S2_02",
      sec: "S2",
      s: 55.87,
      e: 59.79,
      text: "Those engines remove almost all of its downward speed before the arms take the load."
    },
    {
      id: "S2_03",
      sec: "S2",
      s: 60.37,
      e: 63.19,
      text: "The arms support dedicated features near the top of the vehicle."
    },
    {
      id: "S2_04",
      sec: "S2",
      s: 63.65,
      e: 66.05,
      text: "They aren't crushing a steel fuel tank until it sticks."
    },
    {
      id: "S2_05",
      sec: "S2",
      s: 66.73,
      e: 69.17,
      text: "Think of lowering a heavy object onto two shelves."
    },
    {
      id: "S2_06",
      sec: "S2",
      s: 69.65,
      e: 72.71,
      text: "Line up the supports, arrive gently, transfer the weight."
    },
    {
      id: "S2_07",
      sec: "S2",
      s: 73.31,
      e: 80.08,
      text: "Sounds reasonable, except the object is a rocket, the shelves move, and the crane is the rocket's own engines."
    },
    {
      id: "S2_08",
      sec: "S2",
      s: 80.72,
      e: 82.82,
      text: "Being between the arms is only the start."
    },
    {
      id: "S2_09",
      sec: "S2",
      s: 83.16,
      e: 84.96,
      text: "Its motion has to be under control."
    },
    {
      id: "S3_00",
      sec: "S3",
      s: 86.56,
      e: 90.14,
      text: "The ship adds a completely different problem: orbital speed."
    },
    {
      id: "S3_01",
      sec: "S3",
      s: 90.82,
      e: 94.7,
      text: "Getting to orbit means moving fast enough sideways to keep falling around Earth."
    },
    {
      id: "S3_02",
      sec: "S3",
      s: 95.24,
      e: 97.5,
      text: "Coming home means getting rid of that energy."
    },
    {
      id: "S3_03",
      sec: "S3",
      s: 98.1,
      e: 102.82,
      text: "The atmosphere does much of the braking while the gas around the vehicle becomes intensely hot."
    },
    {
      id: "S3_04",
      sec: "S3",
      s: 103.38,
      e: 105.72,
      text: "That's what the black-tiled side is protecting it from."
    },
    {
      id: "S3_05",
      sec: "S3",
      s: 106.82,
      e: 113.6,
      text: "The ship has to hold the right orientation, keep its heat shield facing the flow, and survive with its control systems still working."
    },
    {
      id: "S3_06",
      sec: "S3",
      s: 114.2,
      e: 117.4,
      text: "A damaged spacecraft reaching the right coastline is not enough."
    },
    {
      id: "S3_07",
      sec: "S3",
      s: 117.86,
      e: 121.74,
      text: "It still needs engines, control, and a final maneuver beside a tower."
    },
    {
      id: "S3_08",
      sec: "S3",
      s: 122.32,
      e: 125.02,
      text: "Surviving re-entry only gets it to the next problem."
    },
    {
      id: "S4_00",
      sec: "S4",
      s: 126.68,
      e: 133.02,
      text: "Lower down, Starship descends broadside, using its body against the air while the flaps help control its attitude."
    },
    {
      id: "S4_01",
      sec: "S4",
      s: 133.5,
      e: 136.4,
      text: "Then the engines relight and swing the vehicle toward upright."
    },
    {
      id: "S4_02",
      sec: "S4",
      s: 136.92,
      e: 140.48,
      text: "SpaceX has already demonstrated this flip and landing burn over the ocean."
    },
    {
      id: "S4_03",
      sec: "S4",
      s: 141.28,
      e: 142.02,
      text: "Watch the change."
    },
    {
      id: "S4_04",
      sec: "S4",
      s: 143.86,
      e: 147.04,
      text: "Falling sideways becomes a powered, nearly vertical descent."
    },
    {
      id: "S4_05",
      sec: "S4",
      s: 147.56,
      e: 149.84,
      text: "The planned tower catch adds a physical target."
    },
    {
      id: "S4_06",
      sec: "S4",
      s: 150.28,
      e: 155,
      text: "The ship needs the right position, orientation, and motion when its support features reach the arms."
    },
    {
      id: "S4_07",
      sec: "S4",
      s: 155.5,
      e: 158.68,
      text: "A successful ocean landing proves an important part of that sequence."
    },
    {
      id: "S4_08",
      sec: "S4",
      s: 159.18,
      e: 160.86,
      text: "The tower asks for something extra."
    },
    {
      id: "S4_09",
      sec: "S4",
      s: 161.34,
      e: 164.52,
      text: "Put the attachment points where the receiving surfaces will actually be."
    },
    {
      id: "S5_00",
      sec: "S5",
      s: 166.36,
      e: 169.02,
      text: "Those receiving surfaces belong to a moving machine."
    },
    {
      id: "S5_01",
      sec: "S5",
      s: 169.5,
      e: 172.68,
      text: "The arms swing, and their carriage travels up and down the tower."
    },
    {
      id: "S5_02",
      sec: "S5",
      s: 173.3,
      e: 174.94,
      text: "Look at the deep trusses underneath."
    },
    {
      id: "S5_03",
      sec: "S5",
      s: 175.94,
      e: 180.96,
      text: "The load has to pass through those members into the carriage, down the tower, and into the ground."
    },
    {
      id: "S5_04",
      sec: "S5",
      s: 182.18,
      e: 188.28,
      text: "The newer tower uses shorter arms, and the newer booster has three larger grid fins with revised catch features."
    },
    {
      id: "S5_05",
      sec: "S5",
      s: 188.84,
      e: 193.78,
      text: "For a moment, flying machinery and ground machinery have to become one supported structure."
    },
    {
      id: "S5_06",
      sec: "S5",
      s: 194.34,
      e: 199.6,
      text: "The spacecraft and the catcher must complete their own movements in the right condition at the right moment."
    },
    {
      id: "S5_07",
      sec: "S5",
      s: 200.16,
      e: 201.12,
      text: "That's the handoff."
    },
    {
      id: "S6_00",
      sec: "S6",
      s: 202.74,
      e: 204.62,
      text: "Now change one thing at a time."
    },
    {
      id: "S6_01",
      sec: "S6",
      s: 205.18,
      e: 208.76,
      text: "Add sideways drift, and a support feature can miss its receiving surface."
    },
    {
      id: "S6_02",
      sec: "S6",
      s: 210.22,
      e: 214.98,
      text: "Add tilt, and one side can meet the arms before the other, changing how the load is shared."
    },
    {
      id: "S6_03",
      sec: "S6",
      s: 216.52,
      e: 220.24,
      text: "Keep too much downward speed, and a gentle handoff becomes an impact."
    },
    {
      id: "S6_04",
      sec: "S6",
      s: 221.88,
      e: 225.02,
      text: "These are simple examples, but they explain the real problem."
    },
    {
      id: "S6_05",
      sec: "S6",
      s: 225.58,
      e: 228.52,
      text: "Position, rotation, and speed have to cooperate."
    },
    {
      id: "S6_06",
      sec: "S6",
      s: 229,
      e: 232.54,
      text: "The engines can't leave the tower to absorb whatever motion happens to remain."
    },
    {
      id: "S6_07",
      sec: "S6",
      s: 233.12,
      e: 239.42,
      text: "And because the receiving machine is part of the launch site, a serious failure could damage the equipment needed for the next flight too."
    },
    {
      id: "S7_00",
      sec: "S7",
      s: 240.84,
      e: 244.16,
      text: "That makes deciding when to attempt the catch part of the engineering."
    },
    {
      id: "S7_01",
      sec: "S7",
      s: 244.68,
      e: 250.42,
      text: "A vehicle problem, an engine problem, or a problem on the ground can remove the conditions for a safe approach."
    },
    {
      id: "S7_02",
      sec: "S7",
      s: 251.04,
      e: 254.86,
      text: "Flight six already showed that tower health checks could call off a booster catch."
    },
    {
      id: "S7_03",
      sec: "S7",
      s: 255.4,
      e: 258.72,
      text: "Alternatives depend on the mission plan and when the problem is detected."
    },
    {
      id: "S7_04",
      sec: "S7",
      s: 259.1,
      e: 262.22,
      text: "They aren't a guaranteed escape once the rocket is beside the arms."
    },
    {
      id: "S7_05",
      sec: "S7",
      s: 262.68,
      e: 267.66,
      text: "Protecting the receiving machinery matters as much as getting a dramatic picture of a rocket coming home."
    },
    {
      id: "S8_00",
      sec: "S8",
      s: 269.46,
      e: 274,
      text: "Moving recovery machinery onto the ground keeps some of that machinery off the flying vehicle."
    },
    {
      id: "S8_01",
      sec: "S8",
      s: 274.56,
      e: 279.54,
      text: "Recovering both stages also creates the possibility of using the same expensive hardware again."
    },
    {
      id: "S8_02",
      sec: "S8",
      s: 280.5,
      e: 283.3,
      text: "That's the prize behind this ridiculous-looking maneuver."
    },
    {
      id: "S8_03",
      sec: "S8",
      s: 283.92,
      e: 291.74,
      text: "But bringing a spacecraft home is the beginning of another job: checking the heat shield, engines, and structure, then proving it can fly again."
    },
    {
      id: "S8_04",
      sec: "S8",
      s: 292.24,
      e: 295.32,
      text: "Catch it, inspect it, fly it again, repeat."
    },
    {
      id: "S8_05",
      sec: "S8",
      s: 296.56,
      e: 301.22,
      text: "The goal is a system that keeps working rather than a spectacular trick performed once."
    },
    {
      id: "S8_06",
      sec: "S8",
      s: 301.86,
      e: 306.1,
      text: "Every successful return moves that idea closer to a working transportation system."
    },
    {
      id: "S9_00",
      sec: "S9",
      s: 308.32,
      e: 310.26,
      text: "So watch the final seconds differently."
    },
    {
      id: "S9_01",
      sec: "S9",
      s: 311.24,
      e: 312.68,
      text: "The heat shield has done its job."
    },
    {
      id: "S9_02",
      sec: "S9",
      s: 313.43,
      e: 314.97,
      text: "The flaps have controlled the descent."
    },
    {
      id: "S9_03",
      sec: "S9",
      s: 315.84,
      e: 317.82,
      text: "The engines have turned and slowed the ship."
    },
    {
      id: "S9_04",
      sec: "S9",
      s: 318.98,
      e: 321.48,
      text: "Now the supports meet, and the tower takes the load."
    },
    {
      id: "S9_05",
      sec: "S9",
      s: 323.6,
      e: 326.74,
      text: "That's the sequence SpaceX wants to complete with both stages."
    },
    {
      id: "S9_06",
      sec: "S9",
      s: 327.56,
      e: 329.26,
      text: "The first catch brought the booster home."
    },
    {
      id: "S9_07",
      sec: "S9",
      s: 330.22,
      e: 335.42,
      text: "The next challenge is bringing home the spacecraft that went to orbit and eventually sending it back up again."
    }
  ],
  words: [
    {
      line: "S0_00",
      w: "SpaceX",
      s: 0.31,
      e: 0.85
    },
    {
      line: "S0_00",
      w: "wants",
      s: 0.93,
      e: 1.13
    },
    {
      line: "S0_00",
      w: "to",
      s: 1.17,
      e: 1.25
    },
    {
      line: "S0_00",
      w: "do",
      s: 1.27,
      e: 1.37
    },
    {
      line: "S0_00",
      w: "this",
      s: 1.43,
      e: 1.61
    },
    {
      line: "S0_00",
      w: "twice.",
      s: 1.69,
      e: 2.21
    },
    {
      line: "S0_01",
      w: "First,",
      s: 2.65,
      e: 2.97
    },
    {
      line: "S0_01",
      w: "the",
      s: 3.21,
      e: 3.29
    },
    {
      line: "S0_01",
      w: "booster,",
      s: 3.33,
      e: 3.69
    },
    {
      line: "S0_01",
      w: "then",
      s: 4.149,
      e: 4.51
    },
    {
      line: "S0_01",
      w: "the",
      s: 4.57,
      e: 4.65
    },
    {
      line: "S0_01",
      w: "spacecraft",
      s: 4.75,
      e: 5.33
    },
    {
      line: "S0_01",
      w: "after",
      s: 5.69,
      e: 5.89
    },
    {
      line: "S0_01",
      w: "it",
      s: 5.91,
      e: 5.99
    },
    {
      line: "S0_01",
      w: "comes",
      s: 6.03,
      e: 6.25
    },
    {
      line: "S0_01",
      w: "back",
      s: 6.29,
      e: 6.47
    },
    {
      line: "S0_01",
      w: "from",
      s: 6.49,
      e: 6.63
    },
    {
      line: "S0_01",
      w: "orbit.",
      s: 6.71,
      e: 7.01
    },
    {
      line: "S0_02",
      w: "And",
      s: 7.53,
      e: 7.61
    },
    {
      line: "S0_02",
      w: "if",
      s: 7.65,
      e: 7.75
    },
    {
      line: "S0_02",
      w: "that",
      s: 7.81,
      e: 7.95
    },
    {
      line: "S0_02",
      w: "handoff",
      s: 7.99,
      e: 8.37
    },
    {
      line: "S0_02",
      w: "goes",
      s: 8.39,
      e: 8.57
    },
    {
      line: "S0_02",
      w: "wrong,",
      s: 8.65,
      e: 8.97
    },
    {
      line: "S0_02",
      w: "the",
      s: 9.31,
      e: 9.43
    },
    {
      line: "S0_02",
      w: "rocket",
      s: 9.47,
      e: 9.83
    },
    {
      line: "S0_02",
      w: "isn't",
      s: 9.89,
      e: 10.07
    },
    {
      line: "S0_02",
      w: "the",
      s: 10.11,
      e: 10.27
    },
    {
      line: "S0_02",
      w: "only",
      s: 10.35,
      e: 10.61
    },
    {
      line: "S0_02",
      w: "thing",
      s: 10.65,
      e: 10.77
    },
    {
      line: "S0_02",
      w: "at",
      s: 10.81,
      e: 10.91
    },
    {
      line: "S0_02",
      w: "risk.",
      s: 10.97,
      e: 11.31
    },
    {
      line: "S1_00",
      w: "Super",
      s: 13.75,
      e: 14.05
    },
    {
      line: "S1_00",
      w: "Heavy",
      s: 14.09,
      e: 14.35
    },
    {
      line: "S1_00",
      w: "is",
      s: 14.39,
      e: 14.47
    },
    {
      line: "S1_00",
      w: "the",
      s: 14.51,
      e: 14.69
    },
    {
      line: "S1_00",
      w: "booster",
      s: 14.71,
      e: 15.05
    },
    {
      line: "S1_00",
      w: "underneath.",
      s: 15.13,
      e: 15.65
    },
    {
      line: "S1_01",
      w: "Starship",
      s: 16.13,
      e: 16.59
    },
    {
      line: "S1_01",
      w: "is",
      s: 16.63,
      e: 16.71
    },
    {
      line: "S1_01",
      w: "the",
      s: 16.73,
      e: 16.85
    },
    {
      line: "S1_01",
      w: "pointed",
      s: 16.89,
      e: 17.21
    },
    {
      line: "S1_01",
      w: "spacecraft",
      s: 17.31,
      e: 17.81
    },
    {
      line: "S1_01",
      w: "on",
      s: 17.85,
      e: 17.97
    },
    {
      line: "S1_01",
      w: "top.",
      s: 18.03,
      e: 18.31
    },
    {
      line: "S1_02",
      w: "They",
      s: 18.71,
      e: 18.83
    },
    {
      line: "S1_02",
      w: "launch",
      s: 18.87,
      e: 19.11
    },
    {
      line: "S1_02",
      w: "together,",
      s: 19.13,
      e: 19.49
    },
    {
      line: "S1_02",
      w: "then",
      s: 19.75,
      e: 19.89
    },
    {
      line: "S1_02",
      w: "take",
      s: 19.93,
      e: 20.23
    },
    {
      line: "S1_02",
      w: "very",
      s: 20.27,
      e: 20.51
    },
    {
      line: "S1_02",
      w: "different",
      s: 20.59,
      e: 20.85
    },
    {
      line: "S1_02",
      w: "trips.",
      s: 20.89,
      e: 21.23
    },
    {
      line: "S1_03",
      w: "The",
      s: 21.71,
      e: 21.81
    },
    {
      line: "S1_03",
      w: "booster",
      s: 21.83,
      e: 22.15
    },
    {
      line: "S1_03",
      w: "turns",
      s: 22.19,
      e: 22.43
    },
    {
      line: "S1_03",
      w: "back",
      s: 22.47,
      e: 22.67
    },
    {
      line: "S1_03",
      w: "toward",
      s: 22.69,
      e: 22.87
    },
    {
      line: "S1_03",
      w: "the",
      s: 22.89,
      e: 22.97
    },
    {
      line: "S1_03",
      w: "coast",
      s: 23.03,
      e: 23.37
    },
    {
      line: "S1_03",
      w: "while",
      s: 23.47,
      e: 23.59
    },
    {
      line: "S1_03",
      w: "the",
      s: 23.61,
      e: 23.71
    },
    {
      line: "S1_03",
      w: "ship",
      s: 23.75,
      e: 23.91
    },
    {
      line: "S1_03",
      w: "keeps",
      s: 23.99,
      e: 24.19
    },
    {
      line: "S1_03",
      w: "going.",
      s: 24.23,
      e: 24.55
    },
    {
      line: "S1_04",
      w: "In",
      s: 25.19,
      e: 25.25
    },
    {
      line: "S1_04",
      w: "October",
      s: 25.29,
      e: 25.67
    },
    {
      line: "S1_04",
      w: "twenty",
      s: 25.71,
      e: 25.89
    },
    {
      line: "S1_04",
      w: "twenty-four,",
      s: 25.97,
      e: 26.49
    },
    {
      line: "S1_04",
      w: "SpaceX",
      s: 26.87,
      e: 27.33
    },
    {
      line: "S1_04",
      w: "caught",
      s: 27.35,
      e: 27.51
    },
    {
      line: "S1_04",
      w: "a",
      s: 27.55,
      e: 27.57
    },
    {
      line: "S1_04",
      w: "returning",
      s: 27.61,
      e: 28.11
    },
    {
      line: "S1_04",
      w: "booster",
      s: 28.13,
      e: 28.49
    },
    {
      line: "S1_04",
      w: "with",
      s: 28.51,
      e: 28.61
    },
    {
      line: "S1_04",
      w: "the",
      s: 28.63,
      e: 28.73
    },
    {
      line: "S1_04",
      w: "tower's",
      s: 28.77,
      e: 29.21
    },
    {
      line: "S1_04",
      w: "giant",
      s: 29.29,
      e: 29.63
    },
    {
      line: "S1_04",
      w: "arms.",
      s: 29.73,
      e: 30.05
    },
    {
      line: "S1_05",
      w: "Now,",
      s: 31.21,
      e: 31.41
    },
    {
      line: "S1_05",
      w: "for",
      s: 31.63,
      e: 31.75
    },
    {
      line: "S1_05",
      w: "flight",
      s: 31.77,
      e: 31.99
    },
    {
      line: "S1_05",
      w: "fifteen,",
      s: 32.31,
      e: 32.79
    },
    {
      line: "S1_05",
      w: "it",
      s: 33.15,
      e: 33.25
    },
    {
      line: "S1_05",
      w: "says",
      s: 33.29,
      e: 33.43
    },
    {
      line: "S1_05",
      w: "it",
      s: 33.47,
      e: 33.55
    },
    {
      line: "S1_05",
      w: "wants",
      s: 33.59,
      e: 33.79
    },
    {
      line: "S1_05",
      w: "to",
      s: 33.81,
      e: 33.89
    },
    {
      line: "S1_05",
      w: "attempt",
      s: 33.93,
      e: 34.23
    },
    {
      line: "S1_05",
      w: "both",
      s: 34.41,
      e: 34.609
    },
    {
      line: "S1_05",
      w: "recoveries,",
      s: 34.67,
      e: 35.23
    },
    {
      line: "S1_05",
      w: "two",
      s: 35.75,
      e: 35.87
    },
    {
      line: "S1_05",
      w: "catches",
      s: 35.97,
      e: 36.29
    },
    {
      line: "S1_05",
      w: "during",
      s: 36.33,
      e: 36.61
    },
    {
      line: "S1_05",
      w: "one",
      s: 36.71,
      e: 36.81
    },
    {
      line: "S1_05",
      w: "mission",
      s: 36.87,
      e: 37.17
    },
    {
      line: "S1_05",
      w: "separated",
      s: 37.51,
      e: 37.99
    },
    {
      line: "S1_05",
      w: "by",
      s: 38.01,
      e: 38.11
    },
    {
      line: "S1_05",
      w: "the",
      s: 38.15,
      e: 38.23
    },
    {
      line: "S1_05",
      w: "ship's",
      s: 38.25,
      e: 38.53
    },
    {
      line: "S1_05",
      w: "flight.",
      s: 38.55,
      e: 38.85
    },
    {
      line: "S1_06",
      w: "The",
      s: 39.47,
      e: 39.57
    },
    {
      line: "S1_06",
      w: "new",
      s: 39.59,
      e: 39.75
    },
    {
      line: "S1_06",
      w: "challenge",
      s: 39.79,
      e: 40.19
    },
    {
      line: "S1_06",
      w: "is",
      s: 40.23,
      e: 40.35
    },
    {
      line: "S1_06",
      w: "bringing",
      s: 40.37,
      e: 40.61
    },
    {
      line: "S1_06",
      w: "a",
      s: 40.67,
      e: 40.73
    },
    {
      line: "S1_06",
      w: "spacecraft",
      s: 40.81,
      e: 41.29
    },
    {
      line: "S1_06",
      w: "back",
      s: 41.43,
      e: 41.65
    },
    {
      line: "S1_06",
      w: "through",
      s: 41.67,
      e: 41.81
    },
    {
      line: "S1_06",
      w: "the",
      s: 41.83,
      e: 41.91
    },
    {
      line: "S1_06",
      w: "atmosphere,",
      s: 41.99,
      e: 42.45
    },
    {
      line: "S1_06",
      w: "turning",
      s: 42.77,
      e: 42.99
    },
    {
      line: "S1_06",
      w: "it",
      s: 43.03,
      e: 43.09
    },
    {
      line: "S1_06",
      w: "upright,",
      s: 43.15,
      e: 43.49
    },
    {
      line: "S1_06",
      w: "and",
      s: 43.77,
      e: 43.85
    },
    {
      line: "S1_06",
      w: "delivering",
      s: 43.89,
      e: 44.33
    },
    {
      line: "S1_06",
      w: "it",
      s: 44.37,
      e: 44.45
    },
    {
      line: "S1_06",
      w: "to",
      s: 44.47,
      e: 44.55
    },
    {
      line: "S1_06",
      w: "the",
      s: 44.57,
      e: 44.61
    },
    {
      line: "S1_06",
      w: "machinery",
      s: 44.65,
      e: 45.11
    },
    {
      line: "S1_06",
      w: "waiting",
      s: 45.21,
      e: 45.45
    },
    {
      line: "S1_06",
      w: "on",
      s: 45.47,
      e: 45.55
    },
    {
      line: "S1_06",
      w: "the",
      s: 45.57,
      e: 45.63
    },
    {
      line: "S1_06",
      w: "ground.",
      s: 45.67,
      e: 46.01
    },
    {
      line: "S1_07",
      w: "The",
      s: 46.65,
      e: 46.75
    },
    {
      line: "S1_07",
      w: "launch",
      s: 46.79,
      e: 47.05
    },
    {
      line: "S1_07",
      w: "site",
      s: 47.09,
      e: 47.29
    },
    {
      line: "S1_07",
      w: "becomes",
      s: 47.31,
      e: 47.67
    },
    {
      line: "S1_07",
      w: "part",
      s: 47.73,
      e: 47.97
    },
    {
      line: "S1_07",
      w: "of",
      s: 48.01,
      e: 48.07
    },
    {
      line: "S1_07",
      w: "the",
      s: 48.11,
      e: 48.17
    },
    {
      line: "S1_07",
      w: "landing",
      s: 48.21,
      e: 48.51
    },
    {
      line: "S1_07",
      w: "system.",
      s: 48.59,
      e: 48.95
    },
    {
      line: "S2_00",
      w: "Look",
      s: 50.73,
      e: 50.93
    },
    {
      line: "S2_00",
      w: "closely",
      s: 51.01,
      e: 51.43
    },
    {
      line: "S2_00",
      w: "at",
      s: 51.47,
      e: 51.53
    },
    {
      line: "S2_00",
      w: "that",
      s: 51.59,
      e: 51.73
    },
    {
      line: "S2_00",
      w: "first",
      s: 51.77,
      e: 51.95
    },
    {
      line: "S2_00",
      w: "catch.",
      s: 52.05,
      e: 52.35
    },
    {
      line: "S2_01",
      w: "The",
      s: 52.81,
      e: 52.95
    },
    {
      line: "S2_01",
      w: "booster",
      s: 52.97,
      e: 53.31
    },
    {
      line: "S2_01",
      w: "is",
      s: 53.35,
      e: 53.47
    },
    {
      line: "S2_01",
      w: "still",
      s: 53.57,
      e: 53.83
    },
    {
      line: "S2_01",
      w: "firing",
      s: 53.87,
      e: 54.17
    },
    {
      line: "S2_01",
      w: "its",
      s: 54.19,
      e: 54.33
    },
    {
      line: "S2_01",
      w: "engines",
      s: 54.37,
      e: 54.67
    },
    {
      line: "S2_01",
      w: "on",
      s: 54.71,
      e: 54.79
    },
    {
      line: "S2_01",
      w: "the",
      s: 54.81,
      e: 54.89
    },
    {
      line: "S2_01",
      w: "way",
      s: 54.91,
      e: 55.07
    },
    {
      line: "S2_01",
      w: "in.",
      s: 55.15,
      e: 55.33
    },
    {
      line: "S2_02",
      w: "Those",
      s: 55.87,
      e: 56.07
    },
    {
      line: "S2_02",
      w: "engines",
      s: 56.11,
      e: 56.39
    },
    {
      line: "S2_02",
      w: "remove",
      s: 56.43,
      e: 56.75
    },
    {
      line: "S2_02",
      w: "almost",
      s: 56.79,
      e: 57.21
    },
    {
      line: "S2_02",
      w: "all",
      s: 57.31,
      e: 57.41
    },
    {
      line: "S2_02",
      w: "of",
      s: 57.45,
      e: 57.51
    },
    {
      line: "S2_02",
      w: "its",
      s: 57.55,
      e: 57.69
    },
    {
      line: "S2_02",
      w: "downward",
      s: 57.73,
      e: 58.05
    },
    {
      line: "S2_02",
      w: "speed",
      s: 58.21,
      e: 58.45
    },
    {
      line: "S2_02",
      w: "before",
      s: 58.47,
      e: 58.81
    },
    {
      line: "S2_02",
      w: "the",
      s: 58.85,
      e: 58.93
    },
    {
      line: "S2_02",
      w: "arms",
      s: 58.97,
      e: 59.17
    },
    {
      line: "S2_02",
      w: "take",
      s: 59.21,
      e: 59.35
    },
    {
      line: "S2_02",
      w: "the",
      s: 59.39,
      e: 59.47
    },
    {
      line: "S2_02",
      w: "load.",
      s: 59.51,
      e: 59.79
    },
    {
      line: "S2_03",
      w: "The",
      s: 60.37,
      e: 60.49
    },
    {
      line: "S2_03",
      w: "arms",
      s: 60.55,
      e: 60.73
    },
    {
      line: "S2_03",
      w: "support",
      s: 60.77,
      e: 61.15
    },
    {
      line: "S2_03",
      w: "dedicated",
      s: 61.19,
      e: 61.63
    },
    {
      line: "S2_03",
      w: "features",
      s: 61.73,
      e: 62.07
    },
    {
      line: "S2_03",
      w: "near",
      s: 62.11,
      e: 62.23
    },
    {
      line: "S2_03",
      w: "the",
      s: 62.27,
      e: 62.35
    },
    {
      line: "S2_03",
      w: "top",
      s: 62.41,
      e: 62.61
    },
    {
      line: "S2_03",
      w: "of",
      s: 62.65,
      e: 62.69
    },
    {
      line: "S2_03",
      w: "the",
      s: 62.73,
      e: 62.77
    },
    {
      line: "S2_03",
      w: "vehicle.",
      s: 62.83,
      e: 63.19
    },
    {
      line: "S2_04",
      w: "They",
      s: 63.65,
      e: 63.73
    },
    {
      line: "S2_04",
      w: "aren't",
      s: 63.75,
      e: 63.91
    },
    {
      line: "S2_04",
      w: "crushing",
      s: 63.97,
      e: 64.25
    },
    {
      line: "S2_04",
      w: "a",
      s: 64.29,
      e: 64.37
    },
    {
      line: "S2_04",
      w: "steel",
      s: 64.43,
      e: 64.61
    },
    {
      line: "S2_04",
      w: "fuel",
      s: 64.75,
      e: 64.93
    },
    {
      line: "S2_04",
      w: "tank",
      s: 65.03,
      e: 65.21
    },
    {
      line: "S2_04",
      w: "until",
      s: 65.23,
      e: 65.43
    },
    {
      line: "S2_04",
      w: "it",
      s: 65.45,
      e: 65.57
    },
    {
      line: "S2_04",
      w: "sticks.",
      s: 65.67,
      e: 66.05
    },
    {
      line: "S2_05",
      w: "Think",
      s: 66.73,
      e: 66.87
    },
    {
      line: "S2_05",
      w: "of",
      s: 66.91,
      e: 67.01
    },
    {
      line: "S2_05",
      w: "lowering",
      s: 67.07,
      e: 67.41
    },
    {
      line: "S2_05",
      w: "a",
      s: 67.469,
      e: 67.529
    },
    {
      line: "S2_05",
      w: "heavy",
      s: 67.59,
      e: 67.81
    },
    {
      line: "S2_05",
      w: "object",
      s: 67.91,
      e: 68.25
    },
    {
      line: "S2_05",
      w: "onto",
      s: 68.29,
      e: 68.51
    },
    {
      line: "S2_05",
      w: "two",
      s: 68.55,
      e: 68.69
    },
    {
      line: "S2_05",
      w: "shelves.",
      s: 68.79,
      e: 69.17
    },
    {
      line: "S2_06",
      w: "Line",
      s: 69.65,
      e: 69.79
    },
    {
      line: "S2_06",
      w: "up",
      s: 69.83,
      e: 69.91
    },
    {
      line: "S2_06",
      w: "the",
      s: 69.95,
      e: 70.01
    },
    {
      line: "S2_06",
      w: "supports,",
      s: 70.05,
      e: 70.51
    },
    {
      line: "S2_06",
      w: "arrive",
      s: 70.89,
      e: 71.15
    },
    {
      line: "S2_06",
      w: "gently,",
      s: 71.23,
      e: 71.55
    },
    {
      line: "S2_06",
      w: "transfer",
      s: 71.99,
      e: 72.35
    },
    {
      line: "S2_06",
      w: "the",
      s: 72.37,
      e: 72.45
    },
    {
      line: "S2_06",
      w: "weight.",
      s: 72.47,
      e: 72.71
    },
    {
      line: "S2_07",
      w: "Sounds",
      s: 73.31,
      e: 73.57
    },
    {
      line: "S2_07",
      w: "reasonable,",
      s: 73.61,
      e: 74.01
    },
    {
      line: "S2_07",
      w: "except",
      s: 74.98,
      e: 75.36
    },
    {
      line: "S2_07",
      w: "the",
      s: 75.4,
      e: 75.52
    },
    {
      line: "S2_07",
      w: "object",
      s: 75.62,
      e: 75.9
    },
    {
      line: "S2_07",
      w: "is",
      s: 75.94,
      e: 76.02
    },
    {
      line: "S2_07",
      w: "a",
      s: 76.08,
      e: 76.18
    },
    {
      line: "S2_07",
      w: "rocket,",
      s: 76.24,
      e: 76.64
    },
    {
      line: "S2_07",
      w: "the",
      s: 76.9,
      e: 77.02
    },
    {
      line: "S2_07",
      w: "shelves",
      s: 77.08,
      e: 77.42
    },
    {
      line: "S2_07",
      w: "move,",
      s: 77.48,
      e: 77.7
    },
    {
      line: "S2_07",
      w: "and",
      s: 77.98,
      e: 78.04
    },
    {
      line: "S2_07",
      w: "the",
      s: 78.08,
      e: 78.16
    },
    {
      line: "S2_07",
      w: "crane",
      s: 78.22,
      e: 78.54
    },
    {
      line: "S2_07",
      w: "is",
      s: 78.58,
      e: 78.66
    },
    {
      line: "S2_07",
      w: "the",
      s: 78.7,
      e: 78.8
    },
    {
      line: "S2_07",
      w: "rocket's",
      s: 78.84,
      e: 79.26
    },
    {
      line: "S2_07",
      w: "own",
      s: 79.34,
      e: 79.54
    },
    {
      line: "S2_07",
      w: "engines.",
      s: 79.62,
      e: 80.08
    },
    {
      line: "S2_08",
      w: "Being",
      s: 80.72,
      e: 80.9
    },
    {
      line: "S2_08",
      w: "between",
      s: 80.94,
      e: 81.2
    },
    {
      line: "S2_08",
      w: "the",
      s: 81.24,
      e: 81.34
    },
    {
      line: "S2_08",
      w: "arms",
      s: 81.42,
      e: 81.72
    },
    {
      line: "S2_08",
      w: "is",
      s: 81.76,
      e: 81.98
    },
    {
      line: "S2_08",
      w: "only",
      s: 82.04,
      e: 82.28
    },
    {
      line: "S2_08",
      w: "the",
      s: 82.32,
      e: 82.42
    },
    {
      line: "S2_08",
      w: "start.",
      s: 82.52,
      e: 82.82
    },
    {
      line: "S2_09",
      w: "Its",
      s: 83.16,
      e: 83.32
    },
    {
      line: "S2_09",
      w: "motion",
      s: 83.38,
      e: 83.8
    },
    {
      line: "S2_09",
      w: "has",
      s: 83.86,
      e: 84.08
    },
    {
      line: "S2_09",
      w: "to",
      s: 84.12,
      e: 84.18
    },
    {
      line: "S2_09",
      w: "be",
      s: 84.2,
      e: 84.26
    },
    {
      line: "S2_09",
      w: "under",
      s: 84.3,
      e: 84.48
    },
    {
      line: "S2_09",
      w: "control.",
      s: 84.5,
      e: 84.96
    },
    {
      line: "S3_00",
      w: "The",
      s: 86.56,
      e: 86.66
    },
    {
      line: "S3_00",
      w: "ship",
      s: 86.7,
      e: 86.96
    },
    {
      line: "S3_00",
      w: "adds",
      s: 87.02,
      e: 87.18
    },
    {
      line: "S3_00",
      w: "a",
      s: 87.22,
      e: 87.28
    },
    {
      line: "S3_00",
      w: "completely",
      s: 87.3,
      e: 88.08
    },
    {
      line: "S3_00",
      w: "different",
      s: 88.12,
      e: 88.42
    },
    {
      line: "S3_00",
      w: "problem:",
      s: 88.46,
      e: 88.84
    },
    {
      line: "S3_00",
      w: "orbital",
      s: 89.38,
      e: 89.7
    },
    {
      line: "S3_00",
      w: "speed.",
      s: 89.86,
      e: 90.14
    },
    {
      line: "S3_01",
      w: "Getting",
      s: 90.82,
      e: 91.04
    },
    {
      line: "S3_01",
      w: "to",
      s: 91.08,
      e: 91.2
    },
    {
      line: "S3_01",
      w: "orbit",
      s: 91.26,
      e: 91.54
    },
    {
      line: "S3_01",
      w: "means",
      s: 91.58,
      e: 91.78
    },
    {
      line: "S3_01",
      w: "moving",
      s: 91.82,
      e: 92.16
    },
    {
      line: "S3_01",
      w: "fast",
      s: 92.2,
      e: 92.46
    },
    {
      line: "S3_01",
      w: "enough",
      s: 92.5,
      e: 92.74
    },
    {
      line: "S3_01",
      w: "sideways",
      s: 92.8,
      e: 93.32
    },
    {
      line: "S3_01",
      w: "to",
      s: 93.36,
      e: 93.46
    },
    {
      line: "S3_01",
      w: "keep",
      s: 93.52,
      e: 93.7
    },
    {
      line: "S3_01",
      w: "falling",
      s: 93.8,
      e: 94.08
    },
    {
      line: "S3_01",
      w: "around",
      s: 94.12,
      e: 94.36
    },
    {
      line: "S3_01",
      w: "Earth.",
      s: 94.42,
      e: 94.7
    },
    {
      line: "S3_02",
      w: "Coming",
      s: 95.24,
      e: 95.48
    },
    {
      line: "S3_02",
      w: "home",
      s: 95.56,
      e: 95.86
    },
    {
      line: "S3_02",
      w: "means",
      s: 96.04,
      e: 96.24
    },
    {
      line: "S3_02",
      w: "getting",
      s: 96.28,
      e: 96.46
    },
    {
      line: "S3_02",
      w: "rid",
      s: 96.64,
      e: 96.78
    },
    {
      line: "S3_02",
      w: "of",
      s: 96.82,
      e: 96.9
    },
    {
      line: "S3_02",
      w: "that",
      s: 96.96,
      e: 97.08
    },
    {
      line: "S3_02",
      w: "energy.",
      s: 97.12,
      e: 97.5
    },
    {
      line: "S3_03",
      w: "The",
      s: 98.1,
      e: 98.16
    },
    {
      line: "S3_03",
      w: "atmosphere",
      s: 98.22,
      e: 98.66
    },
    {
      line: "S3_03",
      w: "does",
      s: 98.68,
      e: 98.88
    },
    {
      line: "S3_03",
      w: "much",
      s: 98.98,
      e: 99.14
    },
    {
      line: "S3_03",
      w: "of",
      s: 99.18,
      e: 99.26
    },
    {
      line: "S3_03",
      w: "the",
      s: 99.28,
      e: 99.36
    },
    {
      line: "S3_03",
      w: "braking",
      s: 99.4,
      e: 99.78
    },
    {
      line: "S3_03",
      w: "while",
      s: 100.08,
      e: 100.18
    },
    {
      line: "S3_03",
      w: "the",
      s: 100.22,
      e: 100.32
    },
    {
      line: "S3_03",
      w: "gas",
      s: 100.36,
      e: 100.6
    },
    {
      line: "S3_03",
      w: "around",
      s: 100.66,
      e: 100.84
    },
    {
      line: "S3_03",
      w: "the",
      s: 100.86,
      e: 100.94
    },
    {
      line: "S3_03",
      w: "vehicle",
      s: 100.98,
      e: 101.34
    },
    {
      line: "S3_03",
      w: "becomes",
      s: 101.36,
      e: 101.72
    },
    {
      line: "S3_03",
      w: "intensely",
      s: 101.76,
      e: 102.48
    },
    {
      line: "S3_03",
      w: "hot.",
      s: 102.52,
      e: 102.82
    },
    {
      line: "S3_04",
      w: "That's",
      s: 103.38,
      e: 103.58
    },
    {
      line: "S3_04",
      w: "what",
      s: 103.6,
      e: 103.7
    },
    {
      line: "S3_04",
      w: "the",
      s: 103.74,
      e: 103.84
    },
    {
      line: "S3_04",
      w: "black-tiled",
      s: 103.86,
      e: 104.44
    },
    {
      line: "S3_04",
      w: "side",
      s: 104.5,
      e: 104.74
    },
    {
      line: "S3_04",
      w: "is",
      s: 104.78,
      e: 104.86
    },
    {
      line: "S3_04",
      w: "protecting",
      s: 104.9,
      e: 105.32
    },
    {
      line: "S3_04",
      w: "it",
      s: 105.34,
      e: 105.44
    },
    {
      line: "S3_04",
      w: "from.",
      s: 105.48,
      e: 105.72
    },
    {
      line: "S3_05",
      w: "The",
      s: 106.82,
      e: 106.9
    },
    {
      line: "S3_05",
      w: "ship",
      s: 106.92,
      e: 107.1
    },
    {
      line: "S3_05",
      w: "has",
      s: 107.18,
      e: 107.3
    },
    {
      line: "S3_05",
      w: "to",
      s: 107.34,
      e: 107.4
    },
    {
      line: "S3_05",
      w: "hold",
      s: 107.44,
      e: 107.64
    },
    {
      line: "S3_05",
      w: "the",
      s: 107.68,
      e: 107.8
    },
    {
      line: "S3_05",
      w: "right",
      s: 107.84,
      e: 108.02
    },
    {
      line: "S3_05",
      w: "orientation,",
      s: 108.08,
      e: 108.76
    },
    {
      line: "S3_05",
      w: "keep",
      s: 109.14,
      e: 109.28
    },
    {
      line: "S3_05",
      w: "its",
      s: 109.32,
      e: 109.44
    },
    {
      line: "S3_05",
      w: "heat",
      s: 109.48,
      e: 109.66
    },
    {
      line: "S3_05",
      w: "shield",
      s: 109.72,
      e: 109.94
    },
    {
      line: "S3_05",
      w: "facing",
      s: 110.04,
      e: 110.32
    },
    {
      line: "S3_05",
      w: "the",
      s: 110.36,
      e: 110.46
    },
    {
      line: "S3_05",
      w: "flow,",
      s: 110.5,
      e: 110.74
    },
    {
      line: "S3_05",
      w: "and",
      s: 111.12,
      e: 111.2
    },
    {
      line: "S3_05",
      w: "survive",
      s: 111.28,
      e: 111.78
    },
    {
      line: "S3_05",
      w: "with",
      s: 111.8,
      e: 111.88
    },
    {
      line: "S3_05",
      w: "its",
      s: 111.92,
      e: 112.04
    },
    {
      line: "S3_05",
      w: "control",
      s: 112.08,
      e: 112.42
    },
    {
      line: "S3_05",
      w: "systems",
      s: 112.5,
      e: 112.88
    },
    {
      line: "S3_05",
      w: "still",
      s: 112.98,
      e: 113.2
    },
    {
      line: "S3_05",
      w: "working.",
      s: 113.24,
      e: 113.6
    },
    {
      line: "S3_06",
      w: "A",
      s: 114.2,
      e: 114.28
    },
    {
      line: "S3_06",
      w: "damaged",
      s: 114.32,
      e: 114.68
    },
    {
      line: "S3_06",
      w: "spacecraft",
      s: 114.74,
      e: 115.26
    },
    {
      line: "S3_06",
      w: "reaching",
      s: 115.34,
      e: 115.6
    },
    {
      line: "S3_06",
      w: "the",
      s: 115.64,
      e: 115.72
    },
    {
      line: "S3_06",
      w: "right",
      s: 115.74,
      e: 115.94
    },
    {
      line: "S3_06",
      w: "coastline",
      s: 115.98,
      e: 116.54
    },
    {
      line: "S3_06",
      w: "is",
      s: 116.58,
      e: 116.72
    },
    {
      line: "S3_06",
      w: "not",
      s: 116.82,
      e: 117
    },
    {
      line: "S3_06",
      w: "enough.",
      s: 117.04,
      e: 117.4
    },
    {
      line: "S3_07",
      w: "It",
      s: 117.86,
      e: 117.94
    },
    {
      line: "S3_07",
      w: "still",
      s: 118.02,
      e: 118.2
    },
    {
      line: "S3_07",
      w: "needs",
      s: 118.24,
      e: 118.5
    },
    {
      line: "S3_07",
      w: "engines,",
      s: 118.58,
      e: 119
    },
    {
      line: "S3_07",
      w: "control,",
      s: 119.22,
      e: 119.7
    },
    {
      line: "S3_07",
      w: "and",
      s: 120,
      e: 120.08
    },
    {
      line: "S3_07",
      w: "a",
      s: 120.12,
      e: 120.22
    },
    {
      line: "S3_07",
      w: "final",
      s: 120.28,
      e: 120.5
    },
    {
      line: "S3_07",
      w: "maneuver",
      s: 120.56,
      e: 120.96
    },
    {
      line: "S3_07",
      w: "beside",
      s: 120.98,
      e: 121.26
    },
    {
      line: "S3_07",
      w: "a",
      s: 121.3,
      e: 121.36
    },
    {
      line: "S3_07",
      w: "tower.",
      s: 121.4,
      e: 121.74
    },
    {
      line: "S3_08",
      w: "Surviving",
      s: 122.32,
      e: 122.78
    },
    {
      line: "S3_08",
      w: "re-entry",
      s: 122.82,
      e: 123.26
    },
    {
      line: "S3_08",
      w: "only",
      s: 123.46,
      e: 123.7
    },
    {
      line: "S3_08",
      w: "gets",
      s: 123.74,
      e: 123.9
    },
    {
      line: "S3_08",
      w: "it",
      s: 123.94,
      e: 124.02
    },
    {
      line: "S3_08",
      w: "to",
      s: 124.06,
      e: 124.12
    },
    {
      line: "S3_08",
      w: "the",
      s: 124.16,
      e: 124.28
    },
    {
      line: "S3_08",
      w: "next",
      s: 124.34,
      e: 124.6
    },
    {
      line: "S3_08",
      w: "problem.",
      s: 124.62,
      e: 125.02
    },
    {
      line: "S4_00",
      w: "Lower",
      s: 126.68,
      e: 126.86
    },
    {
      line: "S4_00",
      w: "down,",
      s: 126.96,
      e: 127.28
    },
    {
      line: "S4_00",
      w: "Starship",
      s: 127.9,
      e: 128.28
    },
    {
      line: "S4_00",
      w: "descends",
      s: 128.34,
      e: 128.7
    },
    {
      line: "S4_00",
      w: "broadside,",
      s: 128.8,
      e: 129.4
    },
    {
      line: "S4_00",
      w: "using",
      s: 129.72,
      e: 129.92
    },
    {
      line: "S4_00",
      w: "its",
      s: 129.94,
      e: 130.1
    },
    {
      line: "S4_00",
      w: "body",
      s: 130.14,
      e: 130.38
    },
    {
      line: "S4_00",
      w: "against",
      s: 130.44,
      e: 130.7
    },
    {
      line: "S4_00",
      w: "the",
      s: 130.74,
      e: 130.86
    },
    {
      line: "S4_00",
      w: "air",
      s: 130.94,
      e: 131.12
    },
    {
      line: "S4_00",
      w: "while",
      s: 131.2,
      e: 131.32
    },
    {
      line: "S4_00",
      w: "the",
      s: 131.34,
      e: 131.48
    },
    {
      line: "S4_00",
      w: "flaps",
      s: 131.52,
      e: 131.84
    },
    {
      line: "S4_00",
      w: "help",
      s: 131.88,
      e: 132.02
    },
    {
      line: "S4_00",
      w: "control",
      s: 132.06,
      e: 132.38
    },
    {
      line: "S4_00",
      w: "its",
      s: 132.4,
      e: 132.52
    },
    {
      line: "S4_00",
      w: "attitude.",
      s: 132.6,
      e: 133.02
    },
    {
      line: "S4_01",
      w: "Then",
      s: 133.5,
      e: 133.66
    },
    {
      line: "S4_01",
      w: "the",
      s: 133.699,
      e: 133.8
    },
    {
      line: "S4_01",
      w: "engines",
      s: 133.84,
      e: 134.139
    },
    {
      line: "S4_01",
      w: "relight",
      s: 134.28,
      e: 134.68
    },
    {
      line: "S4_01",
      w: "and",
      s: 134.699,
      e: 134.78
    },
    {
      line: "S4_01",
      w: "swing",
      s: 134.94,
      e: 135.18
    },
    {
      line: "S4_01",
      w: "the",
      s: 135.22,
      e: 135.32
    },
    {
      line: "S4_01",
      w: "vehicle",
      s: 135.34,
      e: 135.66
    },
    {
      line: "S4_01",
      w: "toward",
      s: 135.7,
      e: 135.88
    },
    {
      line: "S4_01",
      w: "upright.",
      s: 136,
      e: 136.4
    },
    {
      line: "S4_02",
      w: "SpaceX",
      s: 136.92,
      e: 137.32
    },
    {
      line: "S4_02",
      w: "has",
      s: 137.34,
      e: 137.54
    },
    {
      line: "S4_02",
      w: "already",
      s: 137.64,
      e: 137.94
    },
    {
      line: "S4_02",
      w: "demonstrated",
      s: 137.98,
      e: 138.52
    },
    {
      line: "S4_02",
      w: "this",
      s: 138.56,
      e: 138.76
    },
    {
      line: "S4_02",
      w: "flip",
      s: 138.8,
      e: 139.04
    },
    {
      line: "S4_02",
      w: "and",
      s: 139.06,
      e: 139.16
    },
    {
      line: "S4_02",
      w: "landing",
      s: 139.24,
      e: 139.56
    },
    {
      line: "S4_02",
      w: "burn",
      s: 139.64,
      e: 139.8
    },
    {
      line: "S4_02",
      w: "over",
      s: 139.86,
      e: 139.98
    },
    {
      line: "S4_02",
      w: "the",
      s: 140.02,
      e: 140.08
    },
    {
      line: "S4_02",
      w: "ocean.",
      s: 140.16,
      e: 140.48
    },
    {
      line: "S4_03",
      w: "Watch",
      s: 141.28,
      e: 141.5
    },
    {
      line: "S4_03",
      w: "the",
      s: 141.54,
      e: 141.62
    },
    {
      line: "S4_03",
      w: "change.",
      s: 141.66,
      e: 142.02
    },
    {
      line: "S4_04",
      w: "Falling",
      s: 143.86,
      e: 144.1
    },
    {
      line: "S4_04",
      w: "sideways",
      s: 144.22,
      e: 144.66
    },
    {
      line: "S4_04",
      w: "becomes",
      s: 144.7,
      e: 144.96
    },
    {
      line: "S4_04",
      w: "a",
      s: 145,
      e: 145.1
    },
    {
      line: "S4_04",
      w: "powered,",
      s: 145.16,
      e: 145.52
    },
    {
      line: "S4_04",
      w: "nearly",
      s: 145.78,
      e: 146.2
    },
    {
      line: "S4_04",
      w: "vertical",
      s: 146.22,
      e: 146.54
    },
    {
      line: "S4_04",
      w: "descent.",
      s: 146.62,
      e: 147.04
    },
    {
      line: "S4_05",
      w: "The",
      s: 147.56,
      e: 147.66
    },
    {
      line: "S4_05",
      w: "planned",
      s: 147.7,
      e: 148.02
    },
    {
      line: "S4_05",
      w: "tower",
      s: 148.06,
      e: 148.3
    },
    {
      line: "S4_05",
      w: "catch",
      s: 148.4,
      e: 148.68
    },
    {
      line: "S4_05",
      w: "adds",
      s: 148.72,
      e: 148.86
    },
    {
      line: "S4_05",
      w: "a",
      s: 148.9,
      e: 149.04
    },
    {
      line: "S4_05",
      w: "physical",
      s: 149.04,
      e: 149.36
    },
    {
      line: "S4_05",
      w: "target.",
      s: 149.46,
      e: 149.84
    },
    {
      line: "S4_06",
      w: "The",
      s: 150.28,
      e: 150.38
    },
    {
      line: "S4_06",
      w: "ship",
      s: 150.4,
      e: 150.6
    },
    {
      line: "S4_06",
      w: "needs",
      s: 150.64,
      e: 150.82
    },
    {
      line: "S4_06",
      w: "the",
      s: 150.88,
      e: 150.98
    },
    {
      line: "S4_06",
      w: "right",
      s: 151,
      e: 151.14
    },
    {
      line: "S4_06",
      w: "position,",
      s: 151.22,
      e: 151.68
    },
    {
      line: "S4_06",
      w: "orientation,",
      s: 151.9,
      e: 152.62
    },
    {
      line: "S4_06",
      w: "and",
      s: 152.64,
      e: 152.74
    },
    {
      line: "S4_06",
      w: "motion",
      s: 152.84,
      e: 153.24
    },
    {
      line: "S4_06",
      w: "when",
      s: 153.28,
      e: 153.34
    },
    {
      line: "S4_06",
      w: "its",
      s: 153.38,
      e: 153.48
    },
    {
      line: "S4_06",
      w: "support",
      s: 153.52,
      e: 153.88
    },
    {
      line: "S4_06",
      w: "features",
      s: 153.92,
      e: 154.24
    },
    {
      line: "S4_06",
      w: "reach",
      s: 154.28,
      e: 154.48
    },
    {
      line: "S4_06",
      w: "the",
      s: 154.52,
      e: 154.58
    },
    {
      line: "S4_06",
      w: "arms.",
      s: 154.68,
      e: 155
    },
    {
      line: "S4_07",
      w: "A",
      s: 155.5,
      e: 155.56
    },
    {
      line: "S4_07",
      w: "successful",
      s: 155.58,
      e: 156.12
    },
    {
      line: "S4_07",
      w: "ocean",
      s: 156.18,
      e: 156.42
    },
    {
      line: "S4_07",
      w: "landing",
      s: 156.48,
      e: 156.8
    },
    {
      line: "S4_07",
      w: "proves",
      s: 156.84,
      e: 157.06
    },
    {
      line: "S4_07",
      w: "an",
      s: 157.1,
      e: 157.14
    },
    {
      line: "S4_07",
      w: "important",
      s: 157.18,
      e: 157.68
    },
    {
      line: "S4_07",
      w: "part",
      s: 157.72,
      e: 157.9
    },
    {
      line: "S4_07",
      w: "of",
      s: 157.94,
      e: 158
    },
    {
      line: "S4_07",
      w: "that",
      s: 158.04,
      e: 158.18
    },
    {
      line: "S4_07",
      w: "sequence.",
      s: 158.24,
      e: 158.68
    },
    {
      line: "S4_08",
      w: "The",
      s: 159.18,
      e: 159.26
    },
    {
      line: "S4_08",
      w: "tower",
      s: 159.32,
      e: 159.62
    },
    {
      line: "S4_08",
      w: "asks",
      s: 159.72,
      e: 159.96
    },
    {
      line: "S4_08",
      w: "for",
      s: 160,
      e: 160.12
    },
    {
      line: "S4_08",
      w: "something",
      s: 160.14,
      e: 160.44
    },
    {
      line: "S4_08",
      w: "extra.",
      s: 160.52,
      e: 160.86
    },
    {
      line: "S4_09",
      w: "Put",
      s: 161.34,
      e: 161.48
    },
    {
      line: "S4_09",
      w: "the",
      s: 161.5,
      e: 161.56
    },
    {
      line: "S4_09",
      w: "attachment",
      s: 161.6,
      e: 162.04
    },
    {
      line: "S4_09",
      w: "points",
      s: 162.14,
      e: 162.42
    },
    {
      line: "S4_09",
      w: "where",
      s: 162.44,
      e: 162.52
    },
    {
      line: "S4_09",
      w: "the",
      s: 162.56,
      e: 162.6
    },
    {
      line: "S4_09",
      w: "receiving",
      s: 162.64,
      e: 163.04
    },
    {
      line: "S4_09",
      w: "surfaces",
      s: 163.14,
      e: 163.58
    },
    {
      line: "S4_09",
      w: "will",
      s: 163.6,
      e: 163.78
    },
    {
      line: "S4_09",
      w: "actually",
      s: 163.88,
      e: 164.26
    },
    {
      line: "S4_09",
      w: "be.",
      s: 164.3,
      e: 164.52
    },
    {
      line: "S5_00",
      w: "Those",
      s: 166.36,
      e: 166.58
    },
    {
      line: "S5_00",
      w: "receiving",
      s: 166.62,
      e: 166.98
    },
    {
      line: "S5_00",
      w: "surfaces",
      s: 167.14,
      e: 167.7
    },
    {
      line: "S5_00",
      w: "belong",
      s: 167.72,
      e: 168
    },
    {
      line: "S5_00",
      w: "to",
      s: 168.04,
      e: 168.12
    },
    {
      line: "S5_00",
      w: "a",
      s: 168.18,
      e: 168.24
    },
    {
      line: "S5_00",
      w: "moving",
      s: 168.3,
      e: 168.58
    },
    {
      line: "S5_00",
      w: "machine.",
      s: 168.62,
      e: 169.02
    },
    {
      line: "S5_01",
      w: "The",
      s: 169.5,
      e: 169.6
    },
    {
      line: "S5_01",
      w: "arms",
      s: 169.68,
      e: 169.94
    },
    {
      line: "S5_01",
      w: "swing,",
      s: 170.02,
      e: 170.34
    },
    {
      line: "S5_01",
      w: "and",
      s: 170.56,
      e: 170.62
    },
    {
      line: "S5_01",
      w: "their",
      s: 170.66,
      e: 170.78
    },
    {
      line: "S5_01",
      w: "carriage",
      s: 170.84,
      e: 171.12
    },
    {
      line: "S5_01",
      w: "travels",
      s: 171.22,
      e: 171.64
    },
    {
      line: "S5_01",
      w: "up",
      s: 171.7,
      e: 171.82
    },
    {
      line: "S5_01",
      w: "and",
      s: 171.84,
      e: 171.96
    },
    {
      line: "S5_01",
      w: "down",
      s: 172,
      e: 172.18
    },
    {
      line: "S5_01",
      w: "the",
      s: 172.22,
      e: 172.3
    },
    {
      line: "S5_01",
      w: "tower.",
      s: 172.36,
      e: 172.68
    },
    {
      line: "S5_02",
      w: "Look",
      s: 173.3,
      e: 173.4
    },
    {
      line: "S5_02",
      w: "at",
      s: 173.42,
      e: 173.48
    },
    {
      line: "S5_02",
      w: "the",
      s: 173.52,
      e: 173.68
    },
    {
      line: "S5_02",
      w: "deep",
      s: 173.72,
      e: 173.9
    },
    {
      line: "S5_02",
      w: "trusses",
      s: 174.02,
      e: 174.38
    },
    {
      line: "S5_02",
      w: "underneath.",
      s: 174.42,
      e: 174.94
    },
    {
      line: "S5_03",
      w: "The",
      s: 175.94,
      e: 176.02
    },
    {
      line: "S5_03",
      w: "load",
      s: 176.08,
      e: 176.28
    },
    {
      line: "S5_03",
      w: "has",
      s: 176.32,
      e: 176.48
    },
    {
      line: "S5_03",
      w: "to",
      s: 176.5,
      e: 176.6
    },
    {
      line: "S5_03",
      w: "pass",
      s: 176.66,
      e: 176.94
    },
    {
      line: "S5_03",
      w: "through",
      s: 176.96,
      e: 177.2
    },
    {
      line: "S5_03",
      w: "those",
      s: 177.24,
      e: 177.42
    },
    {
      line: "S5_03",
      w: "members",
      s: 177.48,
      e: 177.86
    },
    {
      line: "S5_03",
      w: "into",
      s: 178.12,
      e: 178.3
    },
    {
      line: "S5_03",
      w: "the",
      s: 178.34,
      e: 178.42
    },
    {
      line: "S5_03",
      w: "carriage,",
      s: 178.46,
      e: 178.84
    },
    {
      line: "S5_03",
      w: "down",
      s: 179.16,
      e: 179.36
    },
    {
      line: "S5_03",
      w: "the",
      s: 179.38,
      e: 179.46
    },
    {
      line: "S5_03",
      w: "tower,",
      s: 179.52,
      e: 179.82
    },
    {
      line: "S5_03",
      w: "and",
      s: 180.08,
      e: 180.16
    },
    {
      line: "S5_03",
      w: "into",
      s: 180.28,
      e: 180.46
    },
    {
      line: "S5_03",
      w: "the",
      s: 180.5,
      e: 180.56
    },
    {
      line: "S5_03",
      w: "ground.",
      s: 180.6,
      e: 180.96
    },
    {
      line: "S5_04",
      w: "The",
      s: 182.18,
      e: 182.28
    },
    {
      line: "S5_04",
      w: "newer",
      s: 182.32,
      e: 182.5
    },
    {
      line: "S5_04",
      w: "tower",
      s: 182.6,
      e: 182.86
    },
    {
      line: "S5_04",
      w: "uses",
      s: 183,
      e: 183.26
    },
    {
      line: "S5_04",
      w: "shorter",
      s: 183.32,
      e: 183.58
    },
    {
      line: "S5_04",
      w: "arms,",
      s: 183.72,
      e: 184
    },
    {
      line: "S5_04",
      w: "and",
      s: 184.32,
      e: 184.38
    },
    {
      line: "S5_04",
      w: "the",
      s: 184.42,
      e: 184.5
    },
    {
      line: "S5_04",
      w: "newer",
      s: 184.54,
      e: 184.72
    },
    {
      line: "S5_04",
      w: "booster",
      s: 184.8,
      e: 185.16
    },
    {
      line: "S5_04",
      w: "has",
      s: 185.2,
      e: 185.44
    },
    {
      line: "S5_04",
      w: "three",
      s: 185.48,
      e: 185.7
    },
    {
      line: "S5_04",
      w: "larger",
      s: 185.84,
      e: 186.14
    },
    {
      line: "S5_04",
      w: "grid",
      s: 186.24,
      e: 186.4
    },
    {
      line: "S5_04",
      w: "fins",
      s: 186.5,
      e: 186.8
    },
    {
      line: "S5_04",
      w: "with",
      s: 186.84,
      e: 186.96
    },
    {
      line: "S5_04",
      w: "revised",
      s: 187,
      e: 187.5
    },
    {
      line: "S5_04",
      w: "catch",
      s: 187.56,
      e: 187.76
    },
    {
      line: "S5_04",
      w: "features.",
      s: 187.84,
      e: 188.28
    },
    {
      line: "S5_05",
      w: "For",
      s: 188.84,
      e: 188.94
    },
    {
      line: "S5_05",
      w: "a",
      s: 188.98,
      e: 189.02
    },
    {
      line: "S5_05",
      w: "moment,",
      s: 189.08,
      e: 189.44
    },
    {
      line: "S5_05",
      w: "flying",
      s: 189.86,
      e: 190.14
    },
    {
      line: "S5_05",
      w: "machinery",
      s: 190.18,
      e: 190.74
    },
    {
      line: "S5_05",
      w: "and",
      s: 190.76,
      e: 190.88
    },
    {
      line: "S5_05",
      w: "ground",
      s: 190.92,
      e: 191.18
    },
    {
      line: "S5_05",
      w: "machinery",
      s: 191.2,
      e: 191.76
    },
    {
      line: "S5_05",
      w: "have",
      s: 191.86,
      e: 191.98
    },
    {
      line: "S5_05",
      w: "to",
      s: 192,
      e: 192.06
    },
    {
      line: "S5_05",
      w: "become",
      s: 192.1,
      e: 192.52
    },
    {
      line: "S5_05",
      w: "one",
      s: 192.62,
      e: 192.74
    },
    {
      line: "S5_05",
      w: "supported",
      s: 192.84,
      e: 193.26
    },
    {
      line: "S5_05",
      w: "structure.",
      s: 193.38,
      e: 193.78
    },
    {
      line: "S5_06",
      w: "The",
      s: 194.34,
      e: 194.44
    },
    {
      line: "S5_06",
      w: "spacecraft",
      s: 194.5,
      e: 195.06
    },
    {
      line: "S5_06",
      w: "and",
      s: 195.08,
      e: 195.16
    },
    {
      line: "S5_06",
      w: "the",
      s: 195.18,
      e: 195.26
    },
    {
      line: "S5_06",
      w: "catcher",
      s: 195.32,
      e: 195.64
    },
    {
      line: "S5_06",
      w: "must",
      s: 195.8,
      e: 196
    },
    {
      line: "S5_06",
      w: "complete",
      s: 196.04,
      e: 196.38
    },
    {
      line: "S5_06",
      w: "their",
      s: 196.4,
      e: 196.58
    },
    {
      line: "S5_06",
      w: "own",
      s: 196.66,
      e: 196.82
    },
    {
      line: "S5_06",
      w: "movements",
      s: 196.88,
      e: 197.3
    },
    {
      line: "S5_06",
      w: "in",
      s: 197.34,
      e: 197.4
    },
    {
      line: "S5_06",
      w: "the",
      s: 197.44,
      e: 197.58
    },
    {
      line: "S5_06",
      w: "right",
      s: 197.62,
      e: 197.78
    },
    {
      line: "S5_06",
      w: "condition",
      s: 197.84,
      e: 198.32
    },
    {
      line: "S5_06",
      w: "at",
      s: 198.66,
      e: 198.74
    },
    {
      line: "S5_06",
      w: "the",
      s: 198.8,
      e: 198.86
    },
    {
      line: "S5_06",
      w: "right",
      s: 198.98,
      e: 199.2
    },
    {
      line: "S5_06",
      w: "moment.",
      s: 199.26,
      e: 199.6
    },
    {
      line: "S5_07",
      w: "That's",
      s: 200.16,
      e: 200.48
    },
    {
      line: "S5_07",
      w: "the",
      s: 200.54,
      e: 200.6
    },
    {
      line: "S5_07",
      w: "handoff.",
      s: 200.64,
      e: 201.12
    },
    {
      line: "S6_00",
      w: "Now",
      s: 202.74,
      e: 202.92
    },
    {
      line: "S6_00",
      w: "change",
      s: 202.98,
      e: 203.24
    },
    {
      line: "S6_00",
      w: "one",
      s: 203.44,
      e: 203.62
    },
    {
      line: "S6_00",
      w: "thing",
      s: 203.76,
      e: 204.02
    },
    {
      line: "S6_00",
      w: "at",
      s: 204.06,
      e: 204.14
    },
    {
      line: "S6_00",
      w: "a",
      s: 204.18,
      e: 204.22
    },
    {
      line: "S6_00",
      w: "time.",
      s: 204.3,
      e: 204.62
    },
    {
      line: "S6_01",
      w: "Add",
      s: 205.18,
      e: 205.32
    },
    {
      line: "S6_01",
      w: "sideways",
      s: 205.44,
      e: 205.9
    },
    {
      line: "S6_01",
      w: "drift,",
      s: 205.92,
      e: 206.22
    },
    {
      line: "S6_01",
      w: "and",
      s: 206.44,
      e: 206.5
    },
    {
      line: "S6_01",
      w: "a",
      s: 206.54,
      e: 206.58
    },
    {
      line: "S6_01",
      w: "support",
      s: 206.62,
      e: 207
    },
    {
      line: "S6_01",
      w: "feature",
      s: 207.04,
      e: 207.26
    },
    {
      line: "S6_01",
      w: "can",
      s: 207.34,
      e: 207.5
    },
    {
      line: "S6_01",
      w: "miss",
      s: 207.54,
      e: 207.72
    },
    {
      line: "S6_01",
      w: "its",
      s: 207.76,
      e: 207.86
    },
    {
      line: "S6_01",
      w: "receiving",
      s: 207.9,
      e: 208.26
    },
    {
      line: "S6_01",
      w: "surface.",
      s: 208.36,
      e: 208.76
    },
    {
      line: "S6_02",
      w: "Add",
      s: 210.22,
      e: 210.4
    },
    {
      line: "S6_02",
      w: "tilt,",
      s: 210.48,
      e: 210.74
    },
    {
      line: "S6_02",
      w: "and",
      s: 211.12,
      e: 211.28
    },
    {
      line: "S6_02",
      w: "one",
      s: 211.36,
      e: 211.46
    },
    {
      line: "S6_02",
      w: "side",
      s: 211.58,
      e: 211.8
    },
    {
      line: "S6_02",
      w: "can",
      s: 211.84,
      e: 211.94
    },
    {
      line: "S6_02",
      w: "meet",
      s: 211.96,
      e: 212.1
    },
    {
      line: "S6_02",
      w: "the",
      s: 212.14,
      e: 212.24
    },
    {
      line: "S6_02",
      w: "arms",
      s: 212.32,
      e: 212.58
    },
    {
      line: "S6_02",
      w: "before",
      s: 212.62,
      e: 212.88
    },
    {
      line: "S6_02",
      w: "the",
      s: 212.92,
      e: 212.98
    },
    {
      line: "S6_02",
      w: "other,",
      s: 213.06,
      e: 213.24
    },
    {
      line: "S6_02",
      w: "changing",
      s: 213.64,
      e: 214
    },
    {
      line: "S6_02",
      w: "how",
      s: 214.06,
      e: 214.16
    },
    {
      line: "S6_02",
      w: "the",
      s: 214.2,
      e: 214.28
    },
    {
      line: "S6_02",
      w: "load",
      s: 214.32,
      e: 214.48
    },
    {
      line: "S6_02",
      w: "is",
      s: 214.5,
      e: 214.6
    },
    {
      line: "S6_02",
      w: "shared.",
      s: 214.64,
      e: 214.98
    },
    {
      line: "S6_03",
      w: "Keep",
      s: 216.52,
      e: 216.72
    },
    {
      line: "S6_03",
      w: "too",
      s: 216.76,
      e: 216.88
    },
    {
      line: "S6_03",
      w: "much",
      s: 216.92,
      e: 217.12
    },
    {
      line: "S6_03",
      w: "downward",
      s: 217.14,
      e: 217.48
    },
    {
      line: "S6_03",
      w: "speed,",
      s: 217.6,
      e: 217.86
    },
    {
      line: "S6_03",
      w: "and",
      s: 218.14,
      e: 218.2
    },
    {
      line: "S6_03",
      w: "a",
      s: 218.26,
      e: 218.36
    },
    {
      line: "S6_03",
      w: "gentle",
      s: 218.42,
      e: 218.72
    },
    {
      line: "S6_03",
      w: "handoff",
      s: 218.76,
      e: 219.2
    },
    {
      line: "S6_03",
      w: "becomes",
      s: 219.24,
      e: 219.52
    },
    {
      line: "S6_03",
      w: "an",
      s: 219.56,
      e: 219.7
    },
    {
      line: "S6_03",
      w: "impact.",
      s: 219.76,
      e: 220.24
    },
    {
      line: "S6_04",
      w: "These",
      s: 221.88,
      e: 222.02
    },
    {
      line: "S6_04",
      w: "are",
      s: 222.04,
      e: 222.2
    },
    {
      line: "S6_04",
      w: "simple",
      s: 222.26,
      e: 222.5
    },
    {
      line: "S6_04",
      w: "examples,",
      s: 222.54,
      e: 223.1
    },
    {
      line: "S6_04",
      w: "but",
      s: 223.38,
      e: 223.48
    },
    {
      line: "S6_04",
      w: "they",
      s: 223.5,
      e: 223.58
    },
    {
      line: "S6_04",
      w: "explain",
      s: 223.62,
      e: 224.08
    },
    {
      line: "S6_04",
      w: "the",
      s: 224.14,
      e: 224.3
    },
    {
      line: "S6_04",
      w: "real",
      s: 224.34,
      e: 224.52
    },
    {
      line: "S6_04",
      w: "problem.",
      s: 224.62,
      e: 225.02
    },
    {
      line: "S6_05",
      w: "Position,",
      s: 225.58,
      e: 226.04
    },
    {
      line: "S6_05",
      w: "rotation,",
      s: 226.28,
      e: 226.8
    },
    {
      line: "S6_05",
      w: "and",
      s: 226.9,
      e: 226.98
    },
    {
      line: "S6_05",
      w: "speed",
      s: 227.18,
      e: 227.56
    },
    {
      line: "S6_05",
      w: "have",
      s: 227.6,
      e: 227.82
    },
    {
      line: "S6_05",
      w: "to",
      s: 227.84,
      e: 227.92
    },
    {
      line: "S6_05",
      w: "cooperate.",
      s: 227.96,
      e: 228.52
    },
    {
      line: "S6_06",
      w: "The",
      s: 229,
      e: 229.12
    },
    {
      line: "S6_06",
      w: "engines",
      s: 229.16,
      e: 229.48
    },
    {
      line: "S6_06",
      w: "can't",
      s: 229.56,
      e: 229.78
    },
    {
      line: "S6_06",
      w: "leave",
      s: 229.8,
      e: 229.96
    },
    {
      line: "S6_06",
      w: "the",
      s: 230,
      e: 230.08
    },
    {
      line: "S6_06",
      w: "tower",
      s: 230.12,
      e: 230.44
    },
    {
      line: "S6_06",
      w: "to",
      s: 230.48,
      e: 230.54
    },
    {
      line: "S6_06",
      w: "absorb",
      s: 230.6,
      e: 230.96
    },
    {
      line: "S6_06",
      w: "whatever",
      s: 231,
      e: 231.34
    },
    {
      line: "S6_06",
      w: "motion",
      s: 231.36,
      e: 231.68
    },
    {
      line: "S6_06",
      w: "happens",
      s: 231.72,
      e: 232.02
    },
    {
      line: "S6_06",
      w: "to",
      s: 232.06,
      e: 232.14
    },
    {
      line: "S6_06",
      w: "remain.",
      s: 232.16,
      e: 232.54
    },
    {
      line: "S6_07",
      w: "And",
      s: 233.12,
      e: 233.18
    },
    {
      line: "S6_07",
      w: "because",
      s: 233.22,
      e: 233.52
    },
    {
      line: "S6_07",
      w: "the",
      s: 233.56,
      e: 233.62
    },
    {
      line: "S6_07",
      w: "receiving",
      s: 233.64,
      e: 234.06
    },
    {
      line: "S6_07",
      w: "machine",
      s: 234.08,
      e: 234.38
    },
    {
      line: "S6_07",
      w: "is",
      s: 234.42,
      e: 234.54
    },
    {
      line: "S6_07",
      w: "part",
      s: 234.58,
      e: 234.72
    },
    {
      line: "S6_07",
      w: "of",
      s: 234.74,
      e: 234.8
    },
    {
      line: "S6_07",
      w: "the",
      s: 234.84,
      e: 234.88
    },
    {
      line: "S6_07",
      w: "launch",
      s: 234.96,
      e: 235.18
    },
    {
      line: "S6_07",
      w: "site,",
      s: 235.26,
      e: 235.48
    },
    {
      line: "S6_07",
      w: "a",
      s: 235.9,
      e: 235.98
    },
    {
      line: "S6_07",
      w: "serious",
      s: 236.08,
      e: 236.52
    },
    {
      line: "S6_07",
      w: "failure",
      s: 236.56,
      e: 236.94
    },
    {
      line: "S6_07",
      w: "could",
      s: 236.96,
      e: 237.12
    },
    {
      line: "S6_07",
      w: "damage",
      s: 237.16,
      e: 237.5
    },
    {
      line: "S6_07",
      w: "the",
      s: 237.5,
      e: 237.58
    },
    {
      line: "S6_07",
      w: "equipment",
      s: 237.62,
      e: 238.02
    },
    {
      line: "S6_07",
      w: "needed",
      s: 238.06,
      e: 238.32
    },
    {
      line: "S6_07",
      w: "for",
      s: 238.36,
      e: 238.44
    },
    {
      line: "S6_07",
      w: "the",
      s: 238.46,
      e: 238.54
    },
    {
      line: "S6_07",
      w: "next",
      s: 238.58,
      e: 238.82
    },
    {
      line: "S6_07",
      w: "flight",
      s: 238.86,
      e: 239.1
    },
    {
      line: "S6_07",
      w: "too.",
      s: 239.16,
      e: 239.42
    },
    {
      line: "S7_00",
      w: "That",
      s: 240.84,
      e: 240.98
    },
    {
      line: "S7_00",
      w: "makes",
      s: 241.02,
      e: 241.22
    },
    {
      line: "S7_00",
      w: "deciding",
      s: 241.24,
      e: 241.8
    },
    {
      line: "S7_00",
      w: "when",
      s: 241.84,
      e: 242.02
    },
    {
      line: "S7_00",
      w: "to",
      s: 242.06,
      e: 242.14
    },
    {
      line: "S7_00",
      w: "attempt",
      s: 242.2,
      e: 242.46
    },
    {
      line: "S7_00",
      w: "the",
      s: 242.5,
      e: 242.58
    },
    {
      line: "S7_00",
      w: "catch",
      s: 242.66,
      e: 242.96
    },
    {
      line: "S7_00",
      w: "part",
      s: 243.14,
      e: 243.34
    },
    {
      line: "S7_00",
      w: "of",
      s: 243.38,
      e: 243.46
    },
    {
      line: "S7_00",
      w: "the",
      s: 243.5,
      e: 243.56
    },
    {
      line: "S7_00",
      w: "engineering.",
      s: 243.6,
      e: 244.16
    },
    {
      line: "S7_01",
      w: "A",
      s: 244.68,
      e: 244.74
    },
    {
      line: "S7_01",
      w: "vehicle",
      s: 244.78,
      e: 245.06
    },
    {
      line: "S7_01",
      w: "problem,",
      s: 245.14,
      e: 245.54
    },
    {
      line: "S7_01",
      w: "an",
      s: 245.78,
      e: 245.9
    },
    {
      line: "S7_01",
      w: "engine",
      s: 245.94,
      e: 246.18
    },
    {
      line: "S7_01",
      w: "problem,",
      s: 246.26,
      e: 246.66
    },
    {
      line: "S7_01",
      w: "or",
      s: 246.9,
      e: 247
    },
    {
      line: "S7_01",
      w: "a",
      s: 247.06,
      e: 247.12
    },
    {
      line: "S7_01",
      w: "problem",
      s: 247.16,
      e: 247.48
    },
    {
      line: "S7_01",
      w: "on",
      s: 247.52,
      e: 247.6
    },
    {
      line: "S7_01",
      w: "the",
      s: 247.62,
      e: 247.72
    },
    {
      line: "S7_01",
      w: "ground",
      s: 247.76,
      e: 248.16
    },
    {
      line: "S7_01",
      w: "can",
      s: 248.26,
      e: 248.38
    },
    {
      line: "S7_01",
      w: "remove",
      s: 248.42,
      e: 248.8
    },
    {
      line: "S7_01",
      w: "the",
      s: 248.82,
      e: 248.9
    },
    {
      line: "S7_01",
      w: "conditions",
      s: 248.94,
      e: 249.46
    },
    {
      line: "S7_01",
      w: "for",
      s: 249.48,
      e: 249.56
    },
    {
      line: "S7_01",
      w: "a",
      s: 249.62,
      e: 249.7
    },
    {
      line: "S7_01",
      w: "safe",
      s: 249.76,
      e: 249.94
    },
    {
      line: "S7_01",
      w: "approach.",
      s: 249.98,
      e: 250.42
    },
    {
      line: "S7_02",
      w: "Flight",
      s: 251.04,
      e: 251.24
    },
    {
      line: "S7_02",
      w: "six",
      s: 251.34,
      e: 251.62
    },
    {
      line: "S7_02",
      w: "already",
      s: 251.72,
      e: 251.96
    },
    {
      line: "S7_02",
      w: "showed",
      s: 252.08,
      e: 252.34
    },
    {
      line: "S7_02",
      w: "that",
      s: 252.38,
      e: 252.5
    },
    {
      line: "S7_02",
      w: "tower",
      s: 252.58,
      e: 252.84
    },
    {
      line: "S7_02",
      w: "health",
      s: 252.88,
      e: 253.06
    },
    {
      line: "S7_02",
      w: "checks",
      s: 253.16,
      e: 253.44
    },
    {
      line: "S7_02",
      w: "could",
      s: 253.46,
      e: 253.6
    },
    {
      line: "S7_02",
      w: "call",
      s: 253.68,
      e: 253.88
    },
    {
      line: "S7_02",
      w: "off",
      s: 253.96,
      e: 254.1
    },
    {
      line: "S7_02",
      w: "a",
      s: 254.14,
      e: 254.2
    },
    {
      line: "S7_02",
      w: "booster",
      s: 254.22,
      e: 254.48
    },
    {
      line: "S7_02",
      w: "catch.",
      s: 254.58,
      e: 254.86
    },
    {
      line: "S7_03",
      w: "Alternatives",
      s: 255.4,
      e: 255.94
    },
    {
      line: "S7_03",
      w: "depend",
      s: 255.98,
      e: 256.3
    },
    {
      line: "S7_03",
      w: "on",
      s: 256.32,
      e: 256.4
    },
    {
      line: "S7_03",
      w: "the",
      s: 256.42,
      e: 256.5
    },
    {
      line: "S7_03",
      w: "mission",
      s: 256.54,
      e: 256.76
    },
    {
      line: "S7_03",
      w: "plan",
      s: 256.84,
      e: 257.12
    },
    {
      line: "S7_03",
      w: "and",
      s: 257.24,
      e: 257.4
    },
    {
      line: "S7_03",
      w: "when",
      s: 257.44,
      e: 257.6
    },
    {
      line: "S7_03",
      w: "the",
      s: 257.62,
      e: 257.72
    },
    {
      line: "S7_03",
      w: "problem",
      s: 257.74,
      e: 258.06
    },
    {
      line: "S7_03",
      w: "is",
      s: 258.1,
      e: 258.2
    },
    {
      line: "S7_03",
      w: "detected.",
      s: 258.22,
      e: 258.72
    },
    {
      line: "S7_04",
      w: "They",
      s: 259.1,
      e: 259.24
    },
    {
      line: "S7_04",
      w: "aren't",
      s: 259.3,
      e: 259.5
    },
    {
      line: "S7_04",
      w: "a",
      s: 259.54,
      e: 259.64
    },
    {
      line: "S7_04",
      w: "guaranteed",
      s: 259.68,
      e: 260.1
    },
    {
      line: "S7_04",
      w: "escape",
      s: 260.14,
      e: 260.6
    },
    {
      line: "S7_04",
      w: "once",
      s: 260.66,
      e: 260.82
    },
    {
      line: "S7_04",
      w: "the",
      s: 260.86,
      e: 260.94
    },
    {
      line: "S7_04",
      w: "rocket",
      s: 260.98,
      e: 261.24
    },
    {
      line: "S7_04",
      w: "is",
      s: 261.28,
      e: 261.38
    },
    {
      line: "S7_04",
      w: "beside",
      s: 261.42,
      e: 261.72
    },
    {
      line: "S7_04",
      w: "the",
      s: 261.74,
      e: 261.82
    },
    {
      line: "S7_04",
      w: "arms.",
      s: 261.92,
      e: 262.22
    },
    {
      line: "S7_05",
      w: "Protecting",
      s: 262.68,
      e: 263.12
    },
    {
      line: "S7_05",
      w: "the",
      s: 263.16,
      e: 263.22
    },
    {
      line: "S7_05",
      w: "receiving",
      s: 263.24,
      e: 263.66
    },
    {
      line: "S7_05",
      w: "machinery",
      s: 263.68,
      e: 264.14
    },
    {
      line: "S7_05",
      w: "matters",
      s: 264.3,
      e: 264.64
    },
    {
      line: "S7_05",
      w: "as",
      s: 264.68,
      e: 264.84
    },
    {
      line: "S7_05",
      w: "much",
      s: 264.92,
      e: 265.12
    },
    {
      line: "S7_05",
      w: "as",
      s: 265.16,
      e: 265.28
    },
    {
      line: "S7_05",
      w: "getting",
      s: 265.3,
      e: 265.5
    },
    {
      line: "S7_05",
      w: "a",
      s: 265.54,
      e: 265.6
    },
    {
      line: "S7_05",
      w: "dramatic",
      s: 265.62,
      e: 266.08
    },
    {
      line: "S7_05",
      w: "picture",
      s: 266.18,
      e: 266.46
    },
    {
      line: "S7_05",
      w: "of",
      s: 266.499,
      e: 266.58
    },
    {
      line: "S7_05",
      w: "a",
      s: 266.62,
      e: 266.64
    },
    {
      line: "S7_05",
      w: "rocket",
      s: 266.72,
      e: 267.02
    },
    {
      line: "S7_05",
      w: "coming",
      s: 267.08,
      e: 267.319
    },
    {
      line: "S7_05",
      w: "home.",
      s: 267.36,
      e: 267.66
    },
    {
      line: "S8_00",
      w: "Moving",
      s: 269.46,
      e: 269.72
    },
    {
      line: "S8_00",
      w: "recovery",
      s: 269.76,
      e: 270.2
    },
    {
      line: "S8_00",
      w: "machinery",
      s: 270.26,
      e: 270.68
    },
    {
      line: "S8_00",
      w: "onto",
      s: 270.76,
      e: 270.94
    },
    {
      line: "S8_00",
      w: "the",
      s: 270.979,
      e: 271.06
    },
    {
      line: "S8_00",
      w: "ground",
      s: 271.12,
      e: 271.5
    },
    {
      line: "S8_00",
      w: "keeps",
      s: 271.62,
      e: 271.859
    },
    {
      line: "S8_00",
      w: "some",
      s: 271.94,
      e: 272.06
    },
    {
      line: "S8_00",
      w: "of",
      s: 272.099,
      e: 272.18
    },
    {
      line: "S8_00",
      w: "that",
      s: 272.22,
      e: 272.32
    },
    {
      line: "S8_00",
      w: "machinery",
      s: 272.359,
      e: 272.88
    },
    {
      line: "S8_00",
      w: "off",
      s: 272.96,
      e: 273.14
    },
    {
      line: "S8_00",
      w: "the",
      s: 273.18,
      e: 273.26
    },
    {
      line: "S8_00",
      w: "flying",
      s: 273.3,
      e: 273.58
    },
    {
      line: "S8_00",
      w: "vehicle.",
      s: 273.62,
      e: 274
    },
    {
      line: "S8_01",
      w: "Recovering",
      s: 274.56,
      e: 275.04
    },
    {
      line: "S8_01",
      w: "both",
      s: 275.06,
      e: 275.26
    },
    {
      line: "S8_01",
      w: "stages",
      s: 275.36,
      e: 275.84
    },
    {
      line: "S8_01",
      w: "also",
      s: 275.92,
      e: 276.18
    },
    {
      line: "S8_01",
      w: "creates",
      s: 276.22,
      e: 276.52
    },
    {
      line: "S8_01",
      w: "the",
      s: 276.54,
      e: 276.62
    },
    {
      line: "S8_01",
      w: "possibility",
      s: 276.66,
      e: 277.28
    },
    {
      line: "S8_01",
      w: "of",
      s: 277.32,
      e: 277.4
    },
    {
      line: "S8_01",
      w: "using",
      s: 277.46,
      e: 277.66
    },
    {
      line: "S8_01",
      w: "the",
      s: 277.7,
      e: 277.82
    },
    {
      line: "S8_01",
      w: "same",
      s: 277.94,
      e: 278.2
    },
    {
      line: "S8_01",
      w: "expensive",
      s: 278.24,
      e: 278.8
    },
    {
      line: "S8_01",
      w: "hardware",
      s: 278.84,
      e: 279.2
    },
    {
      line: "S8_01",
      w: "again.",
      s: 279.24,
      e: 279.54
    },
    {
      line: "S8_02",
      w: "That's",
      s: 280.5,
      e: 280.82
    },
    {
      line: "S8_02",
      w: "the",
      s: 280.86,
      e: 280.96
    },
    {
      line: "S8_02",
      w: "prize",
      s: 281,
      e: 281.3
    },
    {
      line: "S8_02",
      w: "behind",
      s: 281.34,
      e: 281.58
    },
    {
      line: "S8_02",
      w: "this",
      s: 281.62,
      e: 281.76
    },
    {
      line: "S8_02",
      w: "ridiculous-looking",
      s: 281.8,
      e: 282.84
    },
    {
      line: "S8_02",
      w: "maneuver.",
      s: 282.88,
      e: 283.3
    },
    {
      line: "S8_03",
      w: "But",
      s: 283.92,
      e: 284.06
    },
    {
      line: "S8_03",
      w: "bringing",
      s: 284.1,
      e: 284.34
    },
    {
      line: "S8_03",
      w: "a",
      s: 284.38,
      e: 284.44
    },
    {
      line: "S8_03",
      w: "spacecraft",
      s: 284.54,
      e: 285.04
    },
    {
      line: "S8_03",
      w: "home",
      s: 285.1,
      e: 285.4
    },
    {
      line: "S8_03",
      w: "is",
      s: 285.44,
      e: 285.54
    },
    {
      line: "S8_03",
      w: "the",
      s: 285.58,
      e: 285.66
    },
    {
      line: "S8_03",
      w: "beginning",
      s: 285.68,
      e: 286.12
    },
    {
      line: "S8_03",
      w: "of",
      s: 286.16,
      e: 286.22
    },
    {
      line: "S8_03",
      w: "another",
      s: 286.26,
      e: 286.66
    },
    {
      line: "S8_03",
      w: "job:",
      s: 286.72,
      e: 286.98
    },
    {
      line: "S8_03",
      w: "checking",
      s: 287.48,
      e: 287.76
    },
    {
      line: "S8_03",
      w: "the",
      s: 287.8,
      e: 287.86
    },
    {
      line: "S8_03",
      w: "heat",
      s: 287.9,
      e: 288.08
    },
    {
      line: "S8_03",
      w: "shield,",
      s: 288.14,
      e: 288.46
    },
    {
      line: "S8_03",
      w: "engines,",
      s: 288.76,
      e: 289.14
    },
    {
      line: "S8_03",
      w: "and",
      s: 289.22,
      e: 289.3
    },
    {
      line: "S8_03",
      w: "structure,",
      s: 289.42,
      e: 289.82
    },
    {
      line: "S8_03",
      w: "then",
      s: 290.28,
      e: 290.46
    },
    {
      line: "S8_03",
      w: "proving",
      s: 290.52,
      e: 290.88
    },
    {
      line: "S8_03",
      w: "it",
      s: 290.92,
      e: 290.98
    },
    {
      line: "S8_03",
      w: "can",
      s: 291,
      e: 291.16
    },
    {
      line: "S8_03",
      w: "fly",
      s: 291.18,
      e: 291.38
    },
    {
      line: "S8_03",
      w: "again.",
      s: 291.44,
      e: 291.74
    },
    {
      line: "S8_04",
      w: "Catch",
      s: 292.24,
      e: 292.46
    },
    {
      line: "S8_04",
      w: "it,",
      s: 292.52,
      e: 292.62
    },
    {
      line: "S8_04",
      w: "inspect",
      s: 292.94,
      e: 293.38
    },
    {
      line: "S8_04",
      w: "it,",
      s: 293.42,
      e: 293.52
    },
    {
      line: "S8_04",
      w: "fly",
      s: 293.86,
      e: 294.04
    },
    {
      line: "S8_04",
      w: "it",
      s: 294.06,
      e: 294.12
    },
    {
      line: "S8_04",
      w: "again,",
      s: 294.16,
      e: 294.52
    },
    {
      line: "S8_04",
      w: "repeat.",
      s: 294.88,
      e: 295.32
    },
    {
      line: "S8_05",
      w: "The",
      s: 296.56,
      e: 296.68
    },
    {
      line: "S8_05",
      w: "goal",
      s: 296.72,
      e: 297.02
    },
    {
      line: "S8_05",
      w: "is",
      s: 297.06,
      e: 297.14
    },
    {
      line: "S8_05",
      w: "a",
      s: 297.2,
      e: 297.26
    },
    {
      line: "S8_05",
      w: "system",
      s: 297.32,
      e: 297.62
    },
    {
      line: "S8_05",
      w: "that",
      s: 297.66,
      e: 297.76
    },
    {
      line: "S8_05",
      w: "keeps",
      s: 297.82,
      e: 298.04
    },
    {
      line: "S8_05",
      w: "working",
      s: 298.18,
      e: 298.54
    },
    {
      line: "S8_05",
      w: "rather",
      s: 298.86,
      e: 299.1
    },
    {
      line: "S8_05",
      w: "than",
      s: 299.12,
      e: 299.22
    },
    {
      line: "S8_05",
      w: "a",
      s: 299.26,
      e: 299.32
    },
    {
      line: "S8_05",
      w: "spectacular",
      s: 299.38,
      e: 300.02
    },
    {
      line: "S8_05",
      w: "trick",
      s: 300.14,
      e: 300.4
    },
    {
      line: "S8_05",
      w: "performed",
      s: 300.42,
      e: 300.8
    },
    {
      line: "S8_05",
      w: "once.",
      s: 300.9,
      e: 301.22
    },
    {
      line: "S8_06",
      w: "Every",
      s: 301.86,
      e: 302.06
    },
    {
      line: "S8_06",
      w: "successful",
      s: 302.14,
      e: 302.62
    },
    {
      line: "S8_06",
      w: "return",
      s: 302.66,
      e: 303
    },
    {
      line: "S8_06",
      w: "moves",
      s: 303.12,
      e: 303.36
    },
    {
      line: "S8_06",
      w: "that",
      s: 303.42,
      e: 303.52
    },
    {
      line: "S8_06",
      w: "idea",
      s: 303.56,
      e: 303.88
    },
    {
      line: "S8_06",
      w: "closer",
      s: 303.94,
      e: 304.38
    },
    {
      line: "S8_06",
      w: "to",
      s: 304.42,
      e: 304.5
    },
    {
      line: "S8_06",
      w: "a",
      s: 304.56,
      e: 304.64
    },
    {
      line: "S8_06",
      w: "working",
      s: 304.68,
      e: 304.98
    },
    {
      line: "S8_06",
      w: "transportation",
      s: 305.02,
      e: 305.66
    },
    {
      line: "S8_06",
      w: "system.",
      s: 305.74,
      e: 306.1
    },
    {
      line: "S9_00",
      w: "So",
      s: 308.32,
      e: 308.6
    },
    {
      line: "S9_00",
      w: "watch",
      s: 308.64,
      e: 308.88
    },
    {
      line: "S9_00",
      w: "the",
      s: 308.92,
      e: 309.02
    },
    {
      line: "S9_00",
      w: "final",
      s: 309.06,
      e: 309.28
    },
    {
      line: "S9_00",
      w: "seconds",
      s: 309.38,
      e: 309.76
    },
    {
      line: "S9_00",
      w: "differently.",
      s: 309.8,
      e: 310.26
    },
    {
      line: "S9_01",
      w: "The",
      s: 311.24,
      e: 311.3
    },
    {
      line: "S9_01",
      w: "heat",
      s: 311.34,
      e: 311.5
    },
    {
      line: "S9_01",
      w: "shield",
      s: 311.54,
      e: 311.8
    },
    {
      line: "S9_01",
      w: "has",
      s: 311.84,
      e: 311.98
    },
    {
      line: "S9_01",
      w: "done",
      s: 312,
      e: 312.14
    },
    {
      line: "S9_01",
      w: "its",
      s: 312.16,
      e: 312.32
    },
    {
      line: "S9_01",
      w: "job.",
      s: 312.38,
      e: 312.68
    },
    {
      line: "S9_02",
      w: "The",
      s: 313.43,
      e: 313.53
    },
    {
      line: "S9_02",
      w: "flaps",
      s: 313.57,
      e: 313.89
    },
    {
      line: "S9_02",
      w: "have",
      s: 313.91,
      e: 314.01
    },
    {
      line: "S9_02",
      w: "controlled",
      s: 314.05,
      e: 314.43
    },
    {
      line: "S9_02",
      w: "the",
      s: 314.45,
      e: 314.53
    },
    {
      line: "S9_02",
      w: "descent.",
      s: 314.55,
      e: 314.97
    },
    {
      line: "S9_03",
      w: "The",
      s: 315.84,
      e: 315.96
    },
    {
      line: "S9_03",
      w: "engines",
      s: 316.02,
      e: 316.3
    },
    {
      line: "S9_03",
      w: "have",
      s: 316.34,
      e: 316.48
    },
    {
      line: "S9_03",
      w: "turned",
      s: 316.54,
      e: 316.9
    },
    {
      line: "S9_03",
      w: "and",
      s: 316.92,
      e: 317
    },
    {
      line: "S9_03",
      w: "slowed",
      s: 317.14,
      e: 317.4
    },
    {
      line: "S9_03",
      w: "the",
      s: 317.44,
      e: 317.54
    },
    {
      line: "S9_03",
      w: "ship.",
      s: 317.56,
      e: 317.82
    },
    {
      line: "S9_04",
      w: "Now",
      s: 318.98,
      e: 319.12
    },
    {
      line: "S9_04",
      w: "the",
      s: 319.16,
      e: 319.24
    },
    {
      line: "S9_04",
      w: "supports",
      s: 319.26,
      e: 319.64
    },
    {
      line: "S9_04",
      w: "meet,",
      s: 319.7,
      e: 319.9
    },
    {
      line: "S9_04",
      w: "and",
      s: 320.2,
      e: 320.28
    },
    {
      line: "S9_04",
      w: "the",
      s: 320.3,
      e: 320.4
    },
    {
      line: "S9_04",
      w: "tower",
      s: 320.46,
      e: 320.72
    },
    {
      line: "S9_04",
      w: "takes",
      s: 320.84,
      e: 321.06
    },
    {
      line: "S9_04",
      w: "the",
      s: 321.1,
      e: 321.16
    },
    {
      line: "S9_04",
      w: "load.",
      s: 321.2,
      e: 321.48
    },
    {
      line: "S9_05",
      w: "That's",
      s: 323.6,
      e: 323.82
    },
    {
      line: "S9_05",
      w: "the",
      s: 323.86,
      e: 323.96
    },
    {
      line: "S9_05",
      w: "sequence",
      s: 324,
      e: 324.38
    },
    {
      line: "S9_05",
      w: "SpaceX",
      s: 324.48,
      e: 324.92
    },
    {
      line: "S9_05",
      w: "wants",
      s: 324.96,
      e: 325.14
    },
    {
      line: "S9_05",
      w: "to",
      s: 325.18,
      e: 325.24
    },
    {
      line: "S9_05",
      w: "complete",
      s: 325.28,
      e: 325.7
    },
    {
      line: "S9_05",
      w: "with",
      s: 325.74,
      e: 325.94
    },
    {
      line: "S9_05",
      w: "both",
      s: 325.98,
      e: 326.16
    },
    {
      line: "S9_05",
      w: "stages.",
      s: 326.28,
      e: 326.74
    },
    {
      line: "S9_06",
      w: "The",
      s: 327.56,
      e: 327.66
    },
    {
      line: "S9_06",
      w: "first",
      s: 327.7,
      e: 327.9
    },
    {
      line: "S9_06",
      w: "catch",
      s: 328,
      e: 328.28
    },
    {
      line: "S9_06",
      w: "brought",
      s: 328.3,
      e: 328.5
    },
    {
      line: "S9_06",
      w: "the",
      s: 328.52,
      e: 328.62
    },
    {
      line: "S9_06",
      w: "booster",
      s: 328.64,
      e: 328.92
    },
    {
      line: "S9_06",
      w: "home.",
      s: 329,
      e: 329.26
    },
    {
      line: "S9_07",
      w: "The",
      s: 330.22,
      e: 330.28
    },
    {
      line: "S9_07",
      w: "next",
      s: 330.32,
      e: 330.52
    },
    {
      line: "S9_07",
      w: "challenge",
      s: 330.56,
      e: 330.94
    },
    {
      line: "S9_07",
      w: "is",
      s: 330.98,
      e: 331.12
    },
    {
      line: "S9_07",
      w: "bringing",
      s: 331.14,
      e: 331.4
    },
    {
      line: "S9_07",
      w: "home",
      s: 331.44,
      e: 331.58
    },
    {
      line: "S9_07",
      w: "the",
      s: 331.62,
      e: 331.7
    },
    {
      line: "S9_07",
      w: "spacecraft",
      s: 331.78,
      e: 332.28
    },
    {
      line: "S9_07",
      w: "that",
      s: 332.3,
      e: 332.4
    },
    {
      line: "S9_07",
      w: "went",
      s: 332.42,
      e: 332.54
    },
    {
      line: "S9_07",
      w: "to",
      s: 332.58,
      e: 332.68
    },
    {
      line: "S9_07",
      w: "orbit",
      s: 332.74,
      e: 333.02
    },
    {
      line: "S9_07",
      w: "and",
      s: 333.4,
      e: 333.64
    },
    {
      line: "S9_07",
      w: "eventually",
      s: 333.7,
      e: 334.36
    },
    {
      line: "S9_07",
      w: "sending",
      s: 334.42,
      e: 334.62
    },
    {
      line: "S9_07",
      w: "it",
      s: 334.66,
      e: 334.74
    },
    {
      line: "S9_07",
      w: "back",
      s: 334.78,
      e: 334.96
    },
    {
      line: "S9_07",
      w: "up",
      s: 335.02,
      e: 335.1
    },
    {
      line: "S9_07",
      w: "again.",
      s: 335.14,
      e: 335.42
    }
  ]
};

// src/v2/time.ts
var N = narr_default;
var NARR_V2 = N.duration;
var FILM_END = N.duration + 1.4;
var byLine = Object.fromEntries(N.lines.map((l) => [l.id, l]));
var bySec = Object.fromEntries(N.sections.map((s) => [s.id, s]));
var ls = (id) => byLine[id].s;
var ss = (id) => bySec[id].s;
var norm = (v) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
var wt = (id, word, nth = 0, which = "s") => {
  const ws = N.words.filter((w) => w.line === id && norm(w.w) === norm(word));
  if (!ws.length) throw new Error(`word ${word} not in ${id}`);
  return ws[Math.min(nth, ws.length - 1)][which];
};
var lines = N.lines;
var words = N.words;

// src/v2/shots/s0s1.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var CAR_SHIP = 96;
var Rim = ({ k, children }) => k <= 0.01 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_jsx_runtime8.Fragment, { children }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("g", { style: { filter: `drop-shadow(0 0 ${6 * k}px rgba(255,201,60,${0.95 * k})) drop-shadow(0 0 ${2 * k}px rgba(255,201,60,${k}))` }, children });
var ShipReturnSky = ({ t, u, z, x, y, light, heatK = 1 }) => {
  const heat = heatK * (1 - prog(u, 0.3, 0.5));
  const rot = lerp(-90, 0, smoother(prog(u, 0.6, 0.95)));
  const az = lerp(52, 90, smoother(prog(u, 0.1, 0.55)));
  const eng = prog(u, 0.58, 0.64);
  const flap = 10 + 25 * Math.sin(t * 3) * (1 - prog(u, 0.6, 0.7));
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Streaks, { t, dir: [0.35, -1], k: 0.7, color: light === "high" ? "rgba(255,190,150,0.3)" : "rgba(255,255,255,0.35)" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(InFlight, { x, y, rot, z, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Ship, { az, heat, t, pal: light === "high" ? "space" : light === "dusk" ? "dusk" : "day", engines: eng, flapFwd: flap, flapAft: flap * 0.7, id: "hookret", plumeLen: 22 }) }) })
  ] });
};
var s0s1Shots = () => {
  const tBooster = wt("S0_01", "booster");
  const tCraft = wt("S0_01", "spacecraft");
  const tOrbit = wt("S0_01", "orbit");
  const tWrong = wt("S0_02", "wrong");
  const tRisk = wt("S0_02", "risk");
  const s1 = ss("S1");
  const shots = [];
  shots.push({
    id: "H1_real",
    a: 0,
    b: 3.4,
    render: (t) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Footage, { file: F5, a: 0, src0: 4.4, scale: 1.12, cx: 0.42, cy: 0.42, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("svg", { width: 1920, height: 1080, style: { position: "absolute", inset: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Credit, { text: "SpaceX \xB7 Flight 5, 2024", o: fadeWin(t, 0.4, 3.3, 0.3) }) }) })
  });
  shots.push({
    id: "H2_stack",
    a: 3.4,
    b: tOrbit - 0.15,
    tin: "column",
    render: (t) => {
      const u = prog(t, 3.4, tOrbit);
      const c = { at: [14, keys(t, [[3.4, 46], [tCraft - 0.2, 46], [tCraft + 0.6, 98]]), 0], z: lerp(7.6, 8.4, u), yaw: -14, pitch: 2 };
      const kb = fadeWin(t, Math.max(3.45, tBooster - 0.2), tCraft + 0.1, 0.25);
      const ks = fadeWin(t, tCraft, tOrbit + 1, 0.25);
      const s = { carY: 112, open: 38 };
      return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        CatchView,
        {
          t,
          c,
          l: "dusk",
          s,
          sun: [1650, 820],
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(Place, { c, p: [VX, MOUNT_TOP + 0.6, 0], children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Rim, { k: kb, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Booster, { az: azFor(c, 0), pal: "dusk", t, id: "h2b" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("g", { transform: `translate(0 ${-BOOSTER_LEN})`, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Rim, { k: ks, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Ship, { az: azFor(c, 90), pal: "dusk", t, id: "h2s" }) }) })
          ] })
        }
      );
    }
  });
  const h3a = tOrbit - 0.15, h3b = tWrong + 0.55;
  shots.push({
    id: "H3_return",
    a: h3a,
    b: h3b,
    tin: "cut",
    render: (t) => {
      const u = prog(t, h3a, h3b);
      const sky = u < 0.45 ? "high" : "dusk";
      return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Sky, { k: "high" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("g", { opacity: smoother(prog(u, 0.35, 0.6)), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Sky, { k: "dusk" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Clouds, { n: 9, seed: 5, y0: 200, y1: 1e3, dy: -t * 420, dx: t * 60, s: 1.1, tint: "#f2c3aa", o: prog(u, 0.4, 0.6) * 0.8 }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ShipReturnSky, { t, u, z: lerp(12, 15, u), x: lerp(980, 940, u), y: 540, light: sky === "high" ? "high" : "dusk" })
      ] });
    }
  });
  const h4a = h3b, h4b = s1 - 0.05;
  shots.push({
    id: "H4_arms",
    a: h4a,
    b: h4b,
    tin: "cut",
    render: (t) => {
      const above = lerp(26, 4.5, ep(t, h4a, tRisk - 0.3));
      const pull = ep(t, tRisk - 0.9, h4b - 0.2);
      const c = { at: [lerp(17, 8, pull), lerp(CAR_SHIP + 2, 30, pull), 0], z: lerp(15, 5.2, pull), yaw: lerp(20, 8, pull), pitch: lerp(-4, 6, pull) };
      const s = { carY: CAR_SHIP, open: lerp(24, 9, ep(t, h4a, tRisk)) };
      return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        CatchView,
        {
          t,
          c,
          l: "dusk",
          s,
          hiRail: fadeWin(t, h4a + 0.2, tRisk, 0.3),
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ShipAt, { c, carY: CAR_SHIP, above, l: "dusk", heading: 110, props: { engines: 0.85, t, id: "h4s", fittings: 0 } })
        }
      );
    }
  });
  const tSH = ls("S1_00"), tSS = ls("S1_01"), tLaunch = ls("S1_02"), tTrips = wt("S1_02", "trips");
  const tTurns = wt("S1_03", "turns"), tKeeps = wt("S1_03", "keeps");
  const tOct = ls("S1_04"), tArms = wt("S1_04", "arms");
  const tNow = ls("S1_05"), tBoth = wt("S1_05", "both"), tTwo = wt("S1_05", "two"), tSep = wt("S1_05", "separated");
  const tNew = ls("S1_06"), tUp = wt("S1_06", "upright"), tDeliv = wt("S1_06", "delivering");
  const tSite = ls("S1_07");
  shots.push({
    id: "A1_establish",
    a: s1 - 0.05,
    b: tLaunch - 0.1,
    tin: "dip",
    td: 0.5,
    render: (t) => {
      const u = prog(t, s1, tLaunch);
      const c = { at: [lerp(8, 16, u), keys(t, [[s1, 50], [tSS - 0.2, 54], [tSS + 1, 84]]), 0], z: lerp(7.2, 7.8, u), yaw: lerp(32, 20, u), pitch: 5 };
      const s = { carY: 112, open: 40 };
      const base = c;
      const bl = fadeWin(t, tSH + 0.1, tLaunch, 0.3), sl = fadeWin(t, tSS + 0.05, tLaunch, 0.3);
      return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        CatchView,
        {
          t,
          c,
          l: "day",
          s,
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Place, { c, p: [VX, MOUNT_TOP + 0.6, 0], children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Stack, { az: azFor(base, 70), t, pal: "day", id: "a1" }) }),
          overlay: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("svg", { width: 1920, height: 1080, style: { position: "absolute", inset: 0 }, children: (() => {
            const b = proj(c, [VX + 4.5, MOUNT_TOP + 40, 0]), sh = proj(c, [VX + 4.5, MOUNT_TOP + BOOSTER_LEN + 22, 0]);
            return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Tag, { text: "SUPER HEAVY", x: b[0] + 150, y: b[1], to: [b[0] + 8, b[1]], o: bl, size: 38 }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Tag, { text: "STARSHIP", x: sh[0] + 150, y: sh[1], to: [sh[0] + 8, sh[1]], o: sl, size: 38 })
            ] });
          })() })
        }
      );
    }
  });
  shots.push({
    id: "A2_trips",
    a: tLaunch - 0.1,
    b: tOct - 0.2,
    tin: "cut",
    render: (t) => {
      const sep = tTrips - 0.25;
      const climb = (t - (tLaunch - 0.1)) * 1;
      const ds = Math.max(0, t - sep);
      const z = lerp(9, 4.2, ep(t, sep, tKeeps));
      const shipX = 960 + ds * ds * 30 + ds * 90, shipY = 470 - ds * 190 - ds * ds * 10;
      const boosterRot = -lerp(0, 160, ep(t, sep + 0.3, tTurns + 0.4));
      const bX = 930 - ds * 110 - Math.max(0, t - tTurns) * 120, bY = 600 + BOOSTER_LEN * z * 0.5 + ds * 90;
      const boost = clamp(prog(t, tTurns - 0.1, tTurns + 0.2)) * (1 - prog(t, tKeeps + 0.4, tKeeps + 0.8));
      return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Sky, { k: "high", horizon: 0.95 }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Clouds, { n: 10, seed: 8, y0: -200, y1: 1200, dy: climb * 500 + ds * 300, s: 0.9, o: 0.55 * (1 - prog(t, sep, sep + 2)) }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Streaks, { t, dir: [0, 1], k: 0.5 * (1 - prog(t, sep + 1, sep + 2.5)) }),
        t < sep ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(InFlight, { x: 960, y: 560 + 52 * z * 0.4, rot: 0, z, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("g", { transform: `translate(0 ${BOOSTER_LEN * 0.35})`, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Stack, { az: 70, t, pal: "day", engines: 1, id: "a2" }) }) }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(InFlight, { x: bX, y: bY, rot: boosterRot, z, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("g", { transform: `translate(0 ${BOOSTER_LEN * 0.5})`, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Booster, { az: 70, t, pal: "day", engines: boost, plumeLen: 30, id: "a2b" }) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(InFlight, { x: shipX, y: shipY, rot: lerp(0, 28, ep(t, sep, tKeeps)), z, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Ship, { az: 80, t, pal: "day", engines: clamp(prog(t, sep - 0.05, sep + 0.15)), plumeLen: 36, id: "a2s" }) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: 960, cy: 560, r: lerp(20, 220, prog(t, sep, sep + 0.5)), fill: "url(#glowWarm)", opacity: 1 - prog(t, sep, sep + 0.7) })
        ] })
      ] });
    }
  });
  shots.push({
    id: "A3_oct2024",
    a: tOct - 0.2,
    b: tNow - 0.25,
    tin: "fade",
    td: 0.4,
    render: (t) => {
      const car = 104;
      const above = approach(t, tOct - 0.2, tArms + 0.15, 40);
      const c = { at: [lerp(14, 16, prog(t, tOct, tNow)), lerp(86, 80, prog(t, tOct, tNow)), 0], z: lerp(8.2, 8.8, prog(t, tOct, tNow)), yaw: -16, pitch: 1 };
      const s = { carY: car, open: lerp(20, 5, ep(t, tOct, tArms)) };
      return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        CatchView,
        {
          t,
          c,
          l: "dusk",
          s,
          sun: [1500, 700],
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(BoosterAt, { c, carY: car, above, v: "v1", l: "dusk", heading: 45, props: { engines: throttle(t, tOct - 0.2, tArms + 0.15, 0.8), t, plumeLen: 34, id: "a3b" } }),
          overlay: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("svg", { width: 1920, height: 1080, style: { position: "absolute", inset: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Word, { text: "OCT 2024", x: 110, y: 150, anchor: "start", size: 64, color: "#fbf4e4", o: fadeWin(t, tOct, tNow - 0.3, 0.3) }) })
        }
      );
    }
  });
  shots.push({
    id: "A4_plan",
    a: tNow - 0.25,
    b: tNew - 0.2,
    tin: "dip",
    td: 0.45,
    render: (t) => {
      const base = [430, 930];
      const top = [base[0] + 70, base[1] - 300];
      const k1 = ep(t, tBoth - 0.3, tTwo + 0.2);
      const kOut = ep(t, tNow + 0.1, tSep - 0.2);
      const k2 = ep(t, tSep - 0.1, tNew - 0.35);
      const bArc = (u) => [top[0] + Math.sin(u * Math.PI) * 420, top[1] - Math.sin(u * Math.PI) * 420 - (1 - u) * 0];
      const sOut = (u) => [top[0] + u * 1500, top[1] - Math.pow(u, 0.55) * 520];
      const sIn = (u) => [lerp(-160, top[0], u), lerp(130, top[1] - 40, Math.pow(u, 1.5))];
      const path = (f, k) => Array.from({ length: 48 }, (_, i) => f(i / 47 * k)).map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
      const bp = bArc(k1), so = sOut(kOut), si = sIn(k2);
      const dash = { fill: "none", strokeWidth: 9, strokeDasharray: "3 20", strokeLinecap: "round" };
      return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Sky, { k: "gulf", horizon: 0.86 }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Limb, { top: 960, r: 12e3, glow: 0.6 }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: 0, y: 952, width: 1920, height: 16, fill: "#d3c7a3" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("g", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: base[0] - 26, y: base[1] - 420, width: 52, height: 420, fill: "#38424d" }),
          Array.from({ length: 14 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: `M${base[0] - 26} ${base[1] - i * 30} L${base[0] + 26} ${base[1] - i * 30 - 30} M${base[0] + 26} ${base[1] - i * 30} L${base[0] - 26} ${base[1] - i * 30 - 30}`, stroke: "#5b6875", strokeWidth: 4 }, i)),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: base[0] + 26, y: top[1] - 6, width: 110, height: 20, fill: "#46525e", stroke: "#1c232b", strokeWidth: 3 })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("polyline", { points: path(bArc, k1), stroke: "#ffc93c", ...dash }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("polyline", { points: path(sOut, kOut), stroke: "#fbf4e4", ...dash }),
        k2 > 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("polyline", { points: path(sIn, k2), stroke: "#fbf4e4", ...dash }) : null,
        k1 > 0.02 && k1 < 0.99 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(InFlight, { x: bp[0], y: bp[1], rot: lerp(10, 175, k1) * (k1 < 0.5 ? 1 : 1), z: 3.2, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("g", { transform: "translate(0 36)", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Booster, { az: 60, pal: "day", id: "a4b", engines: k1 > 0.85 ? 1 : 0, plumeLen: 18 }) }) }) : null,
        k1 >= 0.99 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(InFlight, { x: top[0] + 60, y: top[1] + 64 * 3.2 - 10, rot: 0, z: 3.2, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Booster, { az: 60, pal: "day", id: "a4b2" }) }) : null,
        kOut > 0.02 && kOut < 0.97 && k2 <= 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(InFlight, { x: so[0], y: so[1], rot: lerp(20, 75, kOut), z: 3.6, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Ship, { az: 70, pal: "day", engines: 0.9, t, id: "a4s", plumeLen: 20 }) }) }) : null,
        k2 > 0.02 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(InFlight, { x: si[0], y: si[1], rot: lerp(-90, 0, prog(k2, 0.65, 1)), z: 3.6, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Ship, { az: 70, pal: "day", heat: 1 - prog(k2, 0.15, 0.5), engines: prog(k2, 0.7, 0.8), t, id: "a4s2", plumeLen: 16 }) }) }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Word, { text: "FLIGHT 15", x: 1820, y: 140, anchor: "end", size: 64, color: "#fbf4e4", o: fadeWin(t, tNow, tNew, 0.3) }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Word, { text: "1", x: top[0] + 250, y: top[1] - 60, size: 140, o: prog(t, tTwo - 0.2, tTwo + 0.1) }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Word, { text: "2", x: top[0] - 220, y: top[1] - 60, size: 140, o: prog(t, tNew - 0.9, tNew - 0.6) })
      ] });
    }
  });
  const a5a = tNew - 0.2, a5flip = tUp - 0.4, a5c = tDeliv - 0.15;
  shots.push({
    id: "A5_challenge",
    a: a5a,
    b: a5c,
    tin: "cut",
    render: (t) => {
      const u = prog(t, a5a, a5c);
      return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Sky, { k: "high" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("g", { opacity: smoother(prog(t, a5flip - 0.8, a5flip)), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Sky, { k: "day" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Limb, { top: lerp(760, 1500, prog(t, a5a, a5flip)), r: 7e3, glow: 0.8 }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Clouds, { n: 9, seed: 11, y0: 300, y1: 1100, dy: -t * 380, s: 1.2, o: prog(t, a5flip - 0.6, a5flip) * 0.85 }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ShipReturnSky, { t, u: lerp(0.1, 0.98, u), z: 11, x: 960, y: 520, light: t < a5flip - 0.4 ? "high" : "day" })
      ] });
    }
  });
  shots.push({
    id: "A5_arms",
    a: a5c,
    b: tSite - 0.1,
    tin: "cut",
    render: (t) => {
      const above = lerp(44, 6, ep(t, a5c, tSite));
      const c = { at: [lerp(8, 14, prog(t, a5c, tSite)), 106, 0], z: 6.5, yaw: -26, pitch: -3 };
      const s = { carY: CAR_SHIP, open: lerp(30, 12, ep(t, a5c, tSite)) };
      return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        CatchView,
        {
          t,
          c,
          l: "day",
          s,
          hiRail: fadeWin(t, tDeliv + 0.3, tSite + 0.5, 0.3),
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ShipAt, { c, carY: CAR_SHIP, above, l: "day", heading: 90, props: { engines: 0.9, t, id: "a5s" } })
        }
      );
    }
  });
  shots.push({
    id: "A6_site",
    a: tSite - 0.1,
    b: ss("S2") - 1.3,
    tin: "fade",
    td: 0.4,
    render: (t) => {
      const u = prog(t, tSite - 0.1, ss("S2") - 1.3);
      const c = { at: [lerp(-6, 0, u), 52, 0], z: lerp(4.4, 4, u), yaw: lerp(-38, -30, u), pitch: 9 };
      const s = { carY: 108, open: 36 };
      const k = fadeWin(t, tSite + 0.4, ss("S2") - 1, 0.3);
      return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(CatchView, { t, c, l: "dusk", s, hiRail: k, hiCarriage: k, sun: [1450, 640] });
    }
  });
  return shots;
};

// src/v2/shots/s2s3.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
var svg = (children) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("svg", { width: 1920, height: 1080, style: { position: "absolute", inset: 0 }, children });
var Arrow = ({ x, y, dx, dy, color = C.yellow, w = 10, o = 1 }) => {
  const L2 = Math.hypot(dx, dy);
  if (L2 < 4 || o <= 0.01) return null;
  const ux = dx / L2, uy = dy / L2, h = Math.min(L2 * 0.5, w * 3);
  const ex = x + dx, ey = y + dy;
  const hx = ex - ux * h, hy = ey - uy * h;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("g", { opacity: o, strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: x, y1: y, x2: hx, y2: hy, stroke: C.ink, strokeWidth: w + 6 }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("polygon", { points: `${ex},${ey} ${hx - uy * w * 1.6},${hy + ux * w * 1.6} ${hx + uy * w * 1.6},${hy - ux * w * 1.6}`, fill: color, stroke: C.ink, strokeWidth: 4 }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: x, y1: y, x2: hx, y2: hy, stroke: color, strokeWidth: w })
  ] });
};
var s2s3Shots = () => {
  const shots = [];
  const s2 = ss("S2");
  const tFiring = wt("S2_01", "firing"), tLoad = wt("S2_02", "load");
  const tArmsSup = ls("S2_03"), tTop = wt("S2_03", "top");
  const tCrush = ls("S2_04"), tShelves = ls("S2_05"), tLine = ls("S2_06"), tGently = wt("S2_06", "gently"), tTransfer = wt("S2_06", "transfer");
  const tSounds = ls("S2_07"), tRocket = wt("S2_07", "rocket"), tMove = wt("S2_07", "move"), tCrane = wt("S2_07", "crane"), tEngines = wt("S2_07", "engines");
  const tBetween = ls("S2_08"), tMotion = ls("S2_09");
  const CAR3 = 104;
  const b1a = s2 - 1.05, b1b = tLoad - 2.6;
  shots.push({
    id: "B1_real",
    a: b1a,
    b: b1b,
    tin: "fade",
    td: 0.35,
    render: (t) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Footage, { file: F5, a: b1a, src0: 1, scale: 1.08, cx: 0.45, cy: 0.38, children: svg(/* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Credit, { text: "SpaceX \xB7 Flight 5, 2024", o: fadeWin(t, b1a + 0.3, b1b - 0.1, 0.3) })) })
  });
  const b2a = b1b, b2b = tArmsSup - 0.1;
  shots.push({
    id: "B2_speed",
    a: b2a,
    b: b2b,
    tin: "column",
    render: (t) => {
      const above = approach(t, b2a - 1.2, tLoad + 0.05, 22);
      const v = Math.max(0, (approach(t - 0.05, b2a - 1.2, tLoad + 0.05, 22) - above) / 0.05);
      const c = { at: [VX - 2, CAR3 - 4, 0], z: 15, yaw: -12, pitch: 0 };
      const s = { carY: CAR3, open: lerp(10, 4, ep(t, b2a, tLoad)) };
      const bc = proj(c, [VX, boosterRestY(CAR3, "v1") + above + 50, 0]);
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        CatchView,
        {
          t,
          c,
          l: "dusk",
          s,
          hiRail: fadeWin(t, tLoad - 0.4, b2b + 1, 0.2),
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(BoosterAt, { c, carY: CAR3, above, v: "v1", l: "dusk", heading: 45, props: { engines: throttle(t, b2a - 1, tLoad + 0.05, 0.6), t, plumeLen: 30, id: "b2b" } }),
          overlay: svg(/* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Arrow, { x: bc[0] + 130, y: bc[1] - 60, dx: 0, dy: Math.min(260, v * 26), o: 1 - prog(t, tLoad, tLoad + 0.3) }))
        }
      );
    }
  });
  shots.push({
    id: "B3_pin",
    a: b2b,
    b: tCrush - 0.1,
    tin: "cut",
    render: (t) => {
      const c = { at: [VX - 5, CAR3 + 2, 0], z: lerp(34, 38, prog(t, b2b, tCrush)), yaw: -28, pitch: 6 };
      const s = { carY: CAR3, open: 4, flex: 0.25 };
      const pin = proj(c, [VX, CAR3 + RAIL_DY + 0.5, ARM_Z - 1.3]);
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        CatchView,
        {
          t,
          c,
          l: "dusk",
          s,
          hiRail: 0.6,
          fore: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(PinMark, { c, s, above: 0 }),
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(BoosterAt, { c, carY: CAR3, above: -0.25, v: "v1", l: "dusk", heading: 45, props: { t, id: "b3b", catchHi: 1 } }),
          overlay: svg(
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Arrow, { x: pin[0], y: pin[1] - 210, dx: 0, dy: 170, o: fadeWin(t, tArmsSup + 0.3, tCrush, 0.25) }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Tag, { text: "CATCH PIN", x: pin[0] - 330, y: pin[1] - 240, to: [pin[0] - 10, pin[1] - 8], o: fadeWin(t, tTop - 0.3, tCrush, 0.25), size: 36 })
            ] })
          )
        }
      );
    }
  });
  shots.push({
    id: "B4_plan",
    a: tCrush - 0.1,
    b: tShelves - 0.15,
    tin: "cut",
    render: (t) => {
      const sq = ep(t, tCrush + 0.1, tCrush + 0.8);
      const no = prog(t, wt("S2_04", "sticks") - 0.5, wt("S2_04", "sticks") - 0.1);
      const k = 30;
      const cx = 1060, cy = 540;
      const armW = 3.4 * k, gap = (ARM_Z - 1.3 - R) * k;
      const armRect = (sd) => {
        const y = cy + sd * (R * k + gap) + (sd > 0 ? 0 : -armW);
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("g", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: 140, y, width: 1500, height: armW, fill: "#46525e", stroke: C.ink, strokeWidth: 4 }),
          Array.from({ length: 15 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: 160 + i * 100, y1: y + 6, x2: 240 + i * 100, y2: y + armW - 6, stroke: "#2b333c", strokeWidth: 6 }, i)),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: 300, y: sd > 0 ? y : y + armW - 18, width: 1300, height: 18, fill: "#c9d1d9", stroke: C.ink, strokeWidth: 3 })
        ] }, sd);
      };
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { width: 1920, height: 1080, fill: "#d9d2bf" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: 0, y: 0, width: 180, height: 1080, fill: "#38424d" }),
        armRect(1),
        armRect(-1),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("radialGradient", { id: "b4tank", cx: "0.38", cy: "0.35", r: "0.75", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: "0", stopColor: "#f4f6f8" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: "0.6", stopColor: "#b9c2cb" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: "1", stopColor: "#7e8994" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx, cy, r: R * k, fill: "url(#b4tank)", stroke: C.ink, strokeWidth: 5 }),
        [1, -1].map((sd) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: cx - 0.6 * k, y: cy + sd * (R * k) - (sd > 0 ? 0 : 1.6 * k) + (sd > 0 ? -0.2 * k : 0.2 * k), width: 1.2 * k, height: (gap / k + 1.6) * k, fill: "#ffc93c", stroke: C.ink, strokeWidth: 4 }, sd)),
        [1, -1].map((sd) => {
          const y1 = cy + sd * R * k, y2 = cy + sd * (R * k + gap);
          return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("g", { stroke: C.ink, strokeWidth: 4, children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: cx + 260, y1, x2: cx + 260, y2 }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: cx + 245, y1, x2: cx + 275, y2: y1 }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: cx + 245, y1: y2, x2: cx + 275, y2 })
          ] }, `g${sd}`);
        }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Word, { text: "CLEARANCE", x: cx + 300, y: cy - 40, anchor: "start", size: 44, color: "#fbf4e4", o: prog(t, tCrush + 0.8, tCrush + 1.1) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("g", { opacity: 1 - prog(t, tShelves - 0.5, tShelves - 0.2), children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Arrow, { x: cx - 110, y: cy - R * k - 250, dx: 0, dy: (250 - 24) * sq, color: C.red }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Arrow, { x: cx - 110, y: cy + R * k + 250, dx: 0, dy: -(250 - 24) * sq, color: C.red }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("g", { opacity: no, stroke: C.red, strokeWidth: 24, strokeLinecap: "round", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: cx - 170, y1: cy - 170, x2: cx + 170, y2: cy + 170 }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: cx + 170, y1: cy - 170, x2: cx - 170, y2: cy + 170 })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Word, { text: "VIEW FROM ABOVE", x: 60, y: 1040, anchor: "start", size: 30, color: "#fbf4e4", o: 0.9 })
      ] });
    }
  });
  const b5a = tShelves - 0.15, b6a = tSounds + 0.55, b6b = tBetween - 0.2;
  shots.push({
    id: "B5_shelves",
    a: b5a,
    b: b6a,
    tin: "dip",
    td: 0.5,
    render: (t) => {
      const k = 34;
      const cx = 960, shelfY = 640;
      const drop = t < tTransfer ? lerp(330, 0, ep(t, tLine - 0.6, tTransfer)) : 0;
      const sway = (1 - prog(t, tLine - 0.3, tLine + 0.8)) * 40 * Math.sin(t * 2.2);
      const slack = prog(t, tTransfer, tTransfer + 0.5);
      const dx = cx + sway;
      const top = shelfY - 1.1 * k - drop;
      const lineA = prog(t, tLine - 0.1, tLine + 0.3) * (1 - prog(t, tGently, tGently + 0.3));
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Sky, { k: "studio" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: 0, y: 760, width: 1920, height: 320, fill: "#c7c1ad" }),
        [-1, 1].map((sd) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("g", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: cx + sd * 6.9 * k - 0.9 * k, y: shelfY, width: 1.8 * k, height: 760 - shelfY, fill: "#5b6875", stroke: C.ink, strokeWidth: 4 }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: cx + sd * 5 * k - 2.2 * k, y: shelfY, width: 4.4 * k, height: 0.6 * k, fill: "#c9d1d9", stroke: C.ink, strokeWidth: 4 })
        ] }, sd)),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: dx, y1: -10, x2: dx, y2: top - 1.6 * k + slack * 26, stroke: "#2b333c", strokeWidth: 7 }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: `M${dx - 22} ${top - 1.6 * k} q 22 40 44 0`, stroke: "#2b333c", strokeWidth: 10, fill: "none" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: dx, y1: top - 1.4 * k, x2: dx - 3.6 * k, y2: top, stroke: "#2b333c", strokeWidth: 5 }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: dx, y1: top - 1.4 * k, x2: dx + 3.6 * k, y2: top, stroke: "#2b333c", strokeWidth: 5 }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("linearGradient", { id: "b5drum", x1: "0", x2: "1", y1: "0", y2: "0", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: "0", stopColor: "#7e8994" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: "0.3", stopColor: "#f3f6f8" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: "0.6", stopColor: "#c2cad2" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: "1", stopColor: "#6b7580" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: dx - 4.5 * k, y: top, width: 9 * k, height: 6 * k, fill: "url(#b5drum)", stroke: C.ink, strokeWidth: 5 }),
        [-1, 1].map((sd) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: dx + sd * 4.5 * k - (sd > 0 ? 0 : 1.2 * k), y: top + 0.2 * k, width: 1.2 * k, height: 0.9 * k, fill: "#ffc93c", stroke: C.ink, strokeWidth: 4 }, sd)),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("g", { opacity: lineA, stroke: C.yellow, strokeWidth: 4, strokeDasharray: "10 10", children: [-1, 1].map((sd) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: dx + sd * 5.1 * k, y1: top + 1.1 * k, x2: dx + sd * 5.1 * k, y2: shelfY }, sd)) }),
        [-1, 1].map((sd) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Arrow, { x: cx + sd * 5.1 * k, y: shelfY - 230, dx: 0, dy: 180, o: fadeWin(t, tTransfer + 0.2, b6a, 0.2) }, sd)),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Word, { text: "LINE UP", x: 960, y: 180, size: 84, o: fadeWin(t, tLine, tGently, 0.2), color: "#fbf4e4" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Word, { text: "ARRIVE GENTLY", x: 960, y: 180, size: 84, o: fadeWin(t, tGently, tTransfer, 0.2), color: "#fbf4e4" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Word, { text: "TRANSFER THE WEIGHT", x: 960, y: 180, size: 84, o: fadeWin(t, tTransfer, b6a, 0.2), color: "#fbf4e4" })
      ] });
    }
  });
  shots.push({
    id: "B6_except",
    a: b6a,
    b: b6b,
    tin: "column",
    render: (t) => {
      const c = { at: [VX - 4, lerp(CAR3 - 6, CAR3 - 24, ep(t, tCrane - 0.3, tEngines + 0.5)), 0], z: lerp(9.5, 7.2, ep(t, tCrane - 0.3, tEngines + 0.5)), yaw: -18, pitch: 2 };
      const swing = ep(t, tMove - 0.6, tMove + 0.3);
      const s = { carY: CAR3, open: lerp(32, 7, swing) };
      const eng = prog(t, tEngines - 0.35, tEngines);
      const above = lerp(10, 5, ep(t, b6a, b6b));
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        CatchView,
        {
          t,
          c,
          l: "day",
          s,
          hiRail: fadeWin(t, tMove - 0.4, tCrane, 0.2),
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(BoosterAt, { c, carY: CAR3, above, v: "v1", l: "day", heading: 45, props: { t, id: "b6b", engines: eng, plumeLen: 34 } }),
          overlay: svg(
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Word, { text: "ROCKET", x: 1500, y: 260, size: 80, o: fadeWin(t, tRocket - 0.1, tMove - 0.1, 0.15), color: "#fbf4e4" }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Word, { text: "SHELVES MOVE", x: 1500, y: 260, size: 80, o: fadeWin(t, tMove - 0.1, tCrane - 0.1, 0.15), color: "#fbf4e4" }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Word, { text: "CRANE = ENGINES", x: 1500, y: 260, size: 80, o: fadeWin(t, tCrane - 0.1, b6b, 0.15), color: "#fbf4e4" })
            ] })
          )
        }
      );
    }
  });
  shots.push({
    id: "B7_control",
    a: b6b,
    b: ss("S3") - 1.4,
    tin: "cut",
    render: (t) => {
      const k = 1 - ep(t, tMotion + 0.2, tMotion + 1.6);
      const dx = (2.4 * noise(t * 0.9, 3) + 1.2 * Math.sin(t * 2.1)) * k;
      const tilt = 3.2 * noise(t * 1.1, 7) * k;
      const above = lerp(14, 5, ep(t, b6b, tMotion + 1.6));
      const c = { at: [VX - 6, CAR3 + 6, 0], z: 9, yaw: -18, pitch: 2 };
      const s = { carY: CAR3, open: 9 };
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        CatchView,
        {
          t,
          c,
          l: "day",
          s,
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("g", { opacity: 0.25 * k, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(BoosterAt, { c, carY: CAR3, above, v: "v1", l: "day", heading: 45, props: { t, id: "b7g" } }) }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(BoosterAt, { c, carY: CAR3, above, dx, tilt, v: "v1", l: "day", heading: 45, props: { t, id: "b7b", engines: 0.85, plumeLen: 28 } })
          ] })
        }
      );
    }
  });
  const s3 = ss("S3");
  const tOrbSpeed = wt("S3_00", "orbital"), tSide = wt("S3_01", "sideways"), tFalling = wt("S3_01", "falling");
  const tHome = ls("S3_02"), tAtmo = ls("S3_03"), tHot = wt("S3_03", "hot");
  const tTiles = ls("S3_04"), tOrient = ls("S3_05"), tFlow = wt("S3_05", "flow"), tSurvive = wt("S3_05", "survive");
  const tDamaged = ls("S3_06"), tEnginesC = wt("S3_07", "engines"), tControl = wt("S3_07", "control"), tFinal = wt("S3_07", "final");
  const tNext = ls("S3_08");
  const c1a = ss("S3") - 1.4, c3b = tAtmo - 0.1;
  shots.push({
    id: "C1_orbit",
    a: c1a,
    b: c3b,
    tin: "dip",
    td: 0.6,
    render: (t) => {
      const pull = ep(t, tSide - 0.6, tFalling + 0.4);
      const dive = ep(t, tHome - 0.2, c3b);
      const z = lerp(11, 2.6, pull) * lerp(1, 1.6, dive);
      const limbTop = lerp(1010, 760, pull) - dive * 380;
      const roll = lerp(0, -14, dive);
      const rot = lerp(90, lerp(78, -80, smoother(prog(t, tHome - 0.3, tHome + 1.4))), pull > 0 ? 1 : 0);
      const shipX = lerp(860, 960, pull), shipY = lerp(520, 470, pull) + dive * 120;
      const trail = Array.from({ length: 40 }, (_, i) => {
        const a = -i / 40 * 0.5 * pull;
        const r = 5200;
        return [960 + Math.sin(a - 0.05) * r * 0.42 - 420 * pull * (i / 40) * 0, 0];
      });
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Sky, { k: "space" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("g", { transform: `rotate(${roll} 960 540)`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("g", { transform: `translate(${-t * 40} 0)`, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Limb, { top: limbTop, r: 5200, cx: 960 + t * 40, glow: 1 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: `M ${shipX - 900 * pull} ${shipY + 120 * pull} Q ${shipX - 450 * pull} ${shipY - 30 * pull} ${shipX - 40} ${shipY}`, stroke: "#fbf4e4", strokeWidth: 5, strokeDasharray: "2 14", strokeLinecap: "round", fill: "none", opacity: pull * (1 - dive) }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(InFlight, { x: shipX, y: shipY, rot, z, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Ship, { az: lerp(130, 40, dive), t, pal: "space", heat: prog(t, tAtmo - 1.4, tAtmo) * 0.8, id: "c1s" }) }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Word, { text: "SIDEWAYS", x: 1450, y: 300, size: 80, color: "#fbf4e4", o: fadeWin(t, tSide, tFalling + 0.6, 0.25) }),
        trail.length < 0 ? null : null
      ] });
    }
  });
  const c4a = c3b, c4b = tTiles + 0.05;
  shots.push({
    id: "C4_real",
    a: c4a,
    b: c4b,
    tin: "fade",
    td: 0.3,
    render: (t) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Footage, { file: F14R, a: c4a, src0: 4, scale: 1.2, cx: 0.92, cy: 0, children: svg(/* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Credit, { text: "SpaceX \xB7 Flight 14, 2026", o: fadeWin(t, c4a + 0.3, c4b - 0.1, 0.3) })) })
  });
  const c5b = tOrient + 1.9;
  shots.push({
    id: "C5_tiles",
    a: c4b,
    b: c5b,
    tin: "fade",
    td: 0.25,
    render: (t) => {
      const u = ep(t, c4b, c5b - 0.4);
      const z = Math.exp(lerp(Math.log(150), Math.log(12), u));
      const flaps = 18 + 14 * Math.sin(t * 2.4);
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Sky, { k: "high" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Streaks, { t, dir: [0.2, -1], k: 0.5, color: "rgba(255,180,160,0.3)" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(InFlight, { x: 960, y: lerp(380, 560, u), rot: -96, z, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("g", { transform: `translate(${lerp(2, 0, u)} ${lerp(22, 26, u)})`, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Ship, { az: lerp(8, 30, u), heat: lerp(0.15, 0.85, prog(u, 0.25, 0.8)), t, pal: "space", detail: true, flapFwd: flaps, flapAft: flaps * 0.7, id: "c5s" }) }) })
      ] });
    }
  });
  shots.push({
    id: "C6_flow",
    a: c5b,
    b: tDamaged - 0.1,
    tin: "cut",
    render: (t) => {
      const flaps = 22 + 18 * Math.sin(t * 2) + 6 * noise(t * 3, 4);
      const z = 13;
      const arrows = prog(t, tFlow - 0.6, tFlow);
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Sky, { k: "high" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Streaks, { t, dir: [0, -1], k: 0.55, color: "rgba(255,190,170,0.35)" }),
        Array.from({ length: 6 }, (_, i) => {
          const ph = (t * 1.4 + i / 6) % 1;
          return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Arrowish, { x: 560 + i * 160, y: 1e3 - ph * 280, o: arrows * (1 - ph) }, i);
        }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(InFlight, { x: 960, y: 500, rot: -90, z, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Ship, { az: lerp(40, 60, prog(t, c5b, tDamaged)), heat: lerp(0.8, 0.55, prog(t, c5b, tDamaged)), t, pal: "space", flapFwd: flaps, flapAft: 44 - flaps * 0.6, id: "c6s" }) }) })
      ] });
    }
  });
  shots.push({
    id: "C7_coast",
    a: tDamaged - 0.1,
    b: tEnginesC - 0.25,
    tin: "dip",
    td: 0.45,
    render: (t) => {
      const u = prog(t, tDamaged - 0.1, tEnginesC - 0.25);
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(Frame, { bg: "#2f6c9c", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { width: 1920, height: 1080, fill: "#2f6c9c" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M0 0 L760 0 C 720 160, 800 320, 760 470 C 720 620, 820 780, 780 1080 L0 1080 Z", fill: "#c9bb8f" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M760 0 C 720 160, 800 320, 760 470 C 720 620, 820 780, 780 1080", stroke: "#f3ead2", strokeWidth: 10, fill: "none" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M0 0 L640 0 C 610 200, 680 360, 640 520 C 600 700, 700 860, 660 1080 L0 1080 Z", fill: "#a9a37b" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx: 748, cy: 540, r: 9, fill: "#ffc93c", stroke: C.ink, strokeWidth: 3 }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: `M 1980 ${150} Q 1300 ${330} ${lerp(1500, 860, u)} ${lerp(260, 470, u)}`, stroke: "#ffb27a", strokeWidth: 7, fill: "none", strokeLinecap: "round", opacity: 0.7, strokeDasharray: "2 14" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(InFlight, { x: lerp(1500, 860, u), y: lerp(260, 470, u), rot: -115, z: 2.4, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Ship, { az: 150, pal: "day", t, heat: 0.3 * (1 - u), id: "c7s", flapAft: 40 }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Clouds, { n: 6, seed: 21, y0: 0, y1: 1080, dx: t * 10, s: 1.4, o: 0.35 })
      ] });
    }
  });
  shots.push({
    id: "C8a_engines",
    a: tEnginesC - 0.25,
    b: tControl - 0.12,
    tin: "cut",
    render: (t) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(Frame, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Sky, { k: "night" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("g", { transform: `translate(960 540) scale(${lerp(70, 80, prog(t, tEnginesC - 0.25, tControl))})`, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ShipEngineView, { lit: prog(t, tEnginesC, tEnginesC + 0.3), hiSea: 1, t }) })
    ] })
  });
  shots.push({
    id: "C8b_control",
    a: tControl - 0.12,
    b: tFinal - 0.12,
    tin: "cut",
    render: (t) => {
      const fl = 10 + 40 * smoother(prog(t, tControl, tControl + 0.5));
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Sky, { k: "day" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Streaks, { t, dir: [0, -1], k: 0.5 }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(InFlight, { x: 1100, y: 560, rot: -90, z: 30, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("g", { transform: "translate(0 30)", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Ship, { az: 150, pal: "day", t, flapFwd: 10, flapAft: fl, id: "c8s" }) }) })
      ] });
    }
  });
  shots.push({
    id: "C8c_tower",
    a: tFinal - 0.12,
    b: tNext - 0.1,
    tin: "cut",
    render: (t) => {
      const c = { at: [lerp(12, 16, prog(t, tFinal, tNext)), 98, 0], z: 13, yaw: 24, pitch: -3 };
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(CatchView, { t, c, l: "day", s: { carY: 98, open: lerp(28, 18, ep(t, tFinal, tNext)) }, hiRail: fadeWin(t, tFinal + 0.2, tNext + 1, 0.3) });
    }
  });
  shots.push({
    id: "C9_next",
    a: tNext - 0.1,
    b: ss("S4") - 0.2,
    tin: "fade",
    td: 0.4,
    render: (t) => {
      const u = prog(t, tNext - 0.1, ss("S4"));
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Sky, { k: "high" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("g", { opacity: u, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Sky, { k: "day" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Clouds, { n: 10, seed: 31, y0: 200, y1: 1100, dy: -t * 300, dx: 0, s: 1.3, o: 0.7 * u }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Streaks, { t, dir: [0, -1], k: 0.5 }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(InFlight, { x: 960, y: 520, rot: -90, z: 9, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Ship, { az: 110, pal: "day", heat: 0.35 * (1 - u), t, flapFwd: 20, flapAft: 25, id: "c9s" }) }) })
      ] });
    }
  });
  return shots;
};
var Arrowish = ({ x, y, o }) => o <= 0.01 ? null : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: `M${x - 26} ${y + 18} L${x} ${y - 8} L${x + 26} ${y + 18}`, stroke: "#ffd6b0", strokeWidth: 7, fill: "none", strokeLinecap: "round", strokeLinejoin: "round", opacity: o * 0.8 });

// src/v2/shots/s4s5s6.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
var svg2 = (children) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("svg", { width: 1920, height: 1080, style: { position: "absolute", inset: 0 }, children });
var CAR = 98;
var flipPose = (f) => ({ rot: lerp(-90, 0, smoother(clamp(f))), eng: clamp(f / 0.08), flapAft: lerp(30, 70, clamp(f * 1.5)), flapFwd: lerp(20, 60, clamp(f * 1.5)) });
var s4s5s6Shots = () => {
  const shots = [];
  const s4 = ss("S4");
  const tFlaps = wt("S4_00", "flaps"), tRelight = wt("S4_01", "relight"), tUpright = wt("S4_01", "upright");
  const tDemo = ls("S4_02"), tOcean = wt("S4_02", "ocean"), tWatch = ls("S4_03"), tFalling = ls("S4_04"), tPowered = wt("S4_04", "powered"), tDescent = wt("S4_04", "descent", 0, "e");
  const tPlanned = ls("S4_05"), tNeeds = ls("S4_06"), tPos = wt("S4_06", "position"), tOri = wt("S4_06", "orientation"), tMot = wt("S4_06", "motion"), tReach = wt("S4_06", "reach");
  const tProves = ls("S4_07"), tExtra = ls("S4_08"), tPut = ls("S4_09"), tActually = wt("S4_09", "actually");
  const d1a = s4 - 0.2, d2a = tRelight - 0.55;
  shots.push({
    id: "D1_bellyflop",
    a: d1a,
    b: d2a,
    tin: "cut",
    render: (t) => {
      const ff = 25 + 22 * Math.sin(t * 1.7) + 6 * noise(t * 2, 1);
      const fa = 30 - 18 * Math.sin(t * 1.7 + 0.8);
      const u = prog(t, d1a, d2a);
      const z = lerp(13, 15, u);
      const x = 960, y = 520 + 10 * noise(t * 0.7, 3);
      const hiF = fadeWin(t, tFlaps - 0.1, d2a, 0.25);
      const fwdTip = [x - 40 * z, y], aftTip = [x + 8 * z, y];
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Sky, { k: "day" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Clouds, { n: 12, seed: 41, y0: -300, y1: 1400, dy: -t * 520, dx: 0, s: 1.3, o: 0.85 }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Streaks, { t, dir: [0, -1], k: 0.4 }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(InFlight, { x, y, rot: -90 + 2.5 * noise(t * 0.8, 5), z, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Ship, { az: 58, pal: "day", t, flapFwd: ff, flapAft: fa, id: "d1s" }) }) }),
        svg2(
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Tag, { text: "FLAPS", x: x - 14 * z - 200, y: 300, to: [x - 14 * z, y - 3.5 * z], o: hiF, size: 36 }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Tag, { text: "FLAPS", x: x + 19 * z + 240, y: 300, to: [x + 19 * z, y - 3.5 * z], o: hiF, size: 36, align: "r" })
          ] })
        )
      ] });
    }
  });
  const d3a = tDemo - 0.25;
  shots.push({
    id: "D2_relight",
    a: d2a,
    b: d3a,
    tin: "cut",
    render: (t) => {
      const f = ep(t, tRelight - 0.1, d3a + 0.6, (u) => u);
      const p = flipPose(f);
      const z = 14;
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Sky, { k: "day" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Clouds, { n: 12, seed: 41, y0: -300, y1: 1400, dy: -t * lerp(520, 260, f), s: 1.3, o: 0.85 }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(InFlight, { x: lerp(1040, 960, f), y: lerp(470, 430, f), rot: p.rot, z, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Ship, { az: lerp(58, 100, f), pal: "day", t, engines: p.eng, plumeLen: 30, flapFwd: p.flapFwd, flapAft: p.flapAft, id: "d2s" }) }) })
      ] });
    }
  });
  const d4a = tWatch - 0.2;
  shots.push({
    id: "D3_ocean",
    a: d3a,
    b: d4a,
    tin: "cut",
    render: (t) => {
      if (HAS_OCEAN_CLIP) {
        return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Footage, { file: F14O, a: d3a, src0: 14.5, scale: 1.15, cx: 0.5, cy: 0, children: svg2(/* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Credit, { text: "SpaceX \xB7 Flight 14, 2026", o: fadeWin(t, d3a + 0.3, d4a - 0.1, 0.3) })) });
      }
      const u = prog(t, d3a, d4a);
      const h = lerp(42, 2, ep(t, d3a, d4a - 0.2, (v) => 1 - Math.pow(1 - v, 1.8)));
      const sea = 900;
      const z = 7;
      const spray = prog(h, 18, 2);
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Sky, { k: "gulf", horizon: 0.6 }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(SeaPlane, { y: 600, t }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("g", { opacity: spray, children: Array.from({ length: 14 }, (_, i) => {
          const a = (i / 13 - 0.5) * 2.4;
          const L2 = 60 + 140 * spray + 30 * noise(t * 4, i);
          return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("ellipse", { cx: 960 + Math.sin(a) * L2 * 1.6, cy: sea - Math.abs(Math.cos(a)) * L2 * 0.25, rx: 50, ry: 22, fill: "#ffffff", opacity: 0.55 }, i);
        }) }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(InFlight, { x: 960, y: sea - h * z - 20, rot: 2 * noise(t, 2), z, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Ship, { az: 110, pal: "day", t, engines: 1, plumeLen: Math.min(26, h + 4), flapFwd: 60, flapAft: 70, id: "d3s" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "OCEAN", x: 1780, y: 160, anchor: "end", size: 60, color: "#fbf4e4", o: fadeWin(t, tDemo + 0.2, d4a, 0.3) })
      ] });
    }
  });
  const d5a = tPlanned - 0.25;
  shots.push({
    id: "D4_strobe",
    a: d4a,
    b: d5a,
    tin: "fade",
    td: 0.35,
    render: (t) => {
      const N2 = 7;
      const path = (f) => [lerp(330, 1180, f), lerp(260, 620, Math.pow(f, 1.4))];
      const shown = prog(t, tWatch + 0.3, tDescent - 0.2) * (N2 - 1);
      const z = 4.6;
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Sky, { k: "gulf", horizon: 0.92 }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("rect", { x: 0, y: 970, width: 1920, height: 110, fill: "#3f7fae" }),
        Array.from({ length: N2 }, (_, i) => {
          const f = i / (N2 - 1);
          const o = clamp(shown - i + 1);
          if (o <= 0) return null;
          const p = flipPose(f);
          const [x, y] = path(f);
          const last = i === N2 - 1 || i === Math.floor(shown);
          return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("g", { opacity: o * (last ? 1 : 0.45), children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(InFlight, { x, y, rot: p.rot, z, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Ship, { az: 100, pal: "day", t, engines: f > 0.05 ? 1 : 0, plumeLen: 18, flapFwd: p.flapFwd, flapAft: p.flapAft, id: `d4s${i}` }) }) }) }, i);
        }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "FALLING SIDEWAYS", x: 330, y: 140, anchor: "start", size: 64, color: "#fbf4e4", o: fadeWin(t, tFalling - 0.1, d5a, 0.25) }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "POWERED, NEARLY VERTICAL", x: 1860, y: 980, anchor: "end", size: 64, o: fadeWin(t, tPowered - 0.1, d5a, 0.25) })
      ] });
    }
  });
  const d6a = tNeeds - 0.15;
  shots.push({
    id: "D5_target",
    a: d5a,
    b: d6a,
    tin: "column",
    render: (t) => {
      const u = ep(t, d5a, d6a);
      const c = { at: [VX - 2, lerp(shipRestY(CAR) + 50, CAR + 2, u), 0], z: lerp(12, 8.5, u), yaw: -24, pitch: lerp(-2, 3, u) };
      const s = { carY: CAR, open: 18 };
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        CatchView,
        {
          t,
          c,
          l: "day",
          s,
          hiRail: fadeWin(t, wt("S4_05", "target") - 0.4, d6a + 1, 0.3),
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ShipAt, { c, carY: CAR, above: lerp(34, 26, u), l: "day", heading: 70, props: { engines: 1, t, id: "d5s", plumeLen: 24, flapFwd: 60, flapAft: 70 } })
        }
      );
    }
  });
  const d7a = tProves - 0.2;
  shots.push({
    id: "D6_conditions",
    a: d6a,
    b: d7a,
    tin: "cut",
    render: (t) => {
      const c = { at: [VX - 3, CAR + 4, 0], z: 11, yaw: -18, pitch: 2 };
      const s = { carY: CAR, open: lerp(18, 6, ep(t, d6a, tReach)) };
      const above = lerp(18, 3.5, ep(t, d6a, d7a));
      const v = 18 * (1 - ep(t, d6a, d7a));
      const posK = fadeWin(t, tPos - 0.1, d7a, 0.2), oriK = fadeWin(t, tOri - 0.1, d7a, 0.2), motK = fadeWin(t, tMot - 0.1, d7a, 0.2);
      const fit = proj(c, [VX, shipRestY(CAR) + above + 35.6, ARM_Z - 1.3]);
      const rail = proj(c, [VX, CAR + RAIL_DY, ARM_Z - 1.3]);
      const nose = proj(c, [VX, shipRestY(CAR) + above + 52, 0]), base2 = proj(c, [VX, shipRestY(CAR) + above, 0]);
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        CatchView,
        {
          t,
          c,
          l: "day",
          s,
          hiRail: posK,
          fore: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(PinMark, { c, s, above: above + 0.5, hi: 1 }),
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ShipAt, { c, carY: CAR, above, l: "day", heading: 70, props: { engines: 1, t, id: "d6s", plumeLen: 20, flapFwd: 60, flapAft: 70 } }),
          overlay: svg2(
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("g", { opacity: posK, children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("line", { x1: fit[0], y1: fit[1], x2: rail[0], y2: rail[1], stroke: C.yellow, strokeWidth: 5, strokeDasharray: "12 10" }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "POSITION", x: fit[0] + 120, y: fit[1] - 40, anchor: "start", size: 52, o: 1 })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("g", { opacity: oriK, children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("line", { x1: nose[0], y1: nose[1] - 60, x2: base2[0], y2: base2[1] + 60, stroke: "#fbf4e4", strokeWidth: 4, strokeDasharray: "14 10" }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "ORIENTATION", x: nose[0] - 140, y: nose[1] - 20, anchor: "end", size: 52, color: "#fbf4e4", o: 1 })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("g", { opacity: motK, children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Arrow, { x: base2[0] - 220, y: base2[1] - 200, dx: 0, dy: 20 + v * 9, color: "#fbf4e4" }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "MOTION", x: base2[0] - 260, y: base2[1] - 230, anchor: "end", size: 52, color: "#fbf4e4", o: 1 })
              ] })
            ] })
          )
        }
      );
    }
  });
  const d8a = tExtra - 0.2;
  shots.push({
    id: "D7_sequence",
    a: d7a,
    b: d8a,
    tin: "dip",
    td: 0.45,
    render: (t) => {
      const panels = [
        { x: 260, rot: -90, heat: 1, eng: 0 },
        { x: 700, rot: -45, heat: 0, eng: 1 },
        { x: 1140, rot: 0, heat: 0, eng: 1 }
      ];
      const k = (i) => prog(t, d7a + 0.15 + i * 0.35, d7a + 0.45 + i * 0.35);
      const br = prog(t, wt("S4_07", "proves") - 0.2, wt("S4_07", "proves") + 0.3);
      const q = prog(t, wt("S4_07", "sequence") - 0.4, wt("S4_07", "sequence"));
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Sky, { k: "gulf", horizon: 0.95 }),
        panels.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("g", { opacity: k(i), children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("rect", { x: p.x - 190, y: 250, width: 380, height: 480, rx: 24, fill: "rgba(20,25,31,0.18)" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(InFlight, { x: p.x, y: 500, rot: p.rot, z: 5, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Ship, { az: 100, pal: "day", t, heat: p.heat, engines: p.eng, plumeLen: 16, flapFwd: 40, flapAft: 50, id: `d7s${i}` }) }) })
        ] }, i)),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("g", { opacity: k(3), children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("rect", { x: 1390, y: 250, width: 380, height: 480, rx: 24, fill: "rgba(20,25,31,0.18)" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("g", { transform: "translate(1520 330)", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("rect", { x: -30, y: 0, width: 30, height: 380, fill: "#38424d" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("rect", { x: 0, y: 170, width: 150, height: 26, fill: "#46525e", stroke: C.ink, strokeWidth: 3 }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("rect", { x: 0, y: 190, width: 150, height: 6, fill: "#ffc93c" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(InFlight, { x: 1630, y: 560, rot: 0, z: 5, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Ship, { az: 100, pal: "day", t, engines: 1, plumeLen: 10, flapFwd: 60, flapAft: 70, id: "d7s3" }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("g", { opacity: br, children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M 80 790 L 80 820 L 1320 820 L 1320 790", stroke: "#fbf4e4", strokeWidth: 8, fill: "none", strokeLinejoin: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "DEMONSTRATED OVER THE OCEAN", x: 700, y: 900, size: 54, color: "#fbf4e4", o: 1 })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "PLANNED", x: 1580, y: 900, size: 54, o: q })
      ] });
    }
  });
  const e1a = ss("S5") - 1.6;
  shots.push({
    id: "D8_extra",
    a: d8a,
    b: e1a,
    tin: "cut",
    render: (t) => {
      const c = { at: [VX - 1, CAR + 3.6, ARM_Z - 1.3], z: lerp(46, 52, prog(t, d8a, e1a)), yaw: -30, pitch: 8 };
      const s = { carY: CAR, open: lerp(9, 4, ep(t, d8a, tActually)) };
      const above = lerp(7, 0.7, ep(t, d8a, e1a));
      const align = fadeWin(t, tPut - 0.1, e1a + 1, 0.3);
      const a1 = proj(c, [VX, CAR + RAIL_DY + above + 0.4, ARM_Z - 1.3]), a2 = proj(c, [VX, CAR + RAIL_DY, ARM_Z - 1.3]);
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        CatchView,
        {
          t,
          c,
          l: "day",
          s,
          hiRail: align,
          mount: false,
          farm: false,
          fore: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(PinMark, { c, s, above, hi: 1 }),
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ShipAt, { c, carY: CAR, above, l: "day", heading: 70, props: { engines: 0.9, t, id: "d8s", flapFwd: 60, flapAft: 70 } }),
          overlay: svg2(
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("g", { opacity: align, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("line", { x1: a1[0], y1: a1[1], x2: a2[0], y2: a2[1], stroke: C.yellow, strokeWidth: 6, strokeDasharray: "14 10" }) })
          )
        }
      );
    }
  });
  const tMoving = wt("S5_00", "machine"), tSwing = wt("S5_01", "swing"), tCarriage = wt("S5_01", "carriage"), tTowerE = wt("S5_01", "tower", 0, "e");
  const tTruss = ls("S5_02"), tLoadP = ls("S5_03"), tInto = wt("S5_03", "carriage"), tDown = wt("S5_03", "down"), tGround = wt("S5_03", "ground");
  const tNewer = ls("S5_04"), tShorter = wt("S5_04", "shorter"), tFins = wt("S5_04", "three"), tCatchF = wt("S5_04", "revised");
  const tMoment = ls("S5_05"), tOne = wt("S5_05", "one"), tCraft = ls("S5_06"), tHand = ls("S5_07");
  const e2a = tSwing - 0.5;
  shots.push({
    id: "E1_pullback",
    a: e1a,
    b: e2a,
    tin: "cut",
    render: (t) => {
      const u = ep(t, e1a, e2a - 0.2);
      const c = { at: [lerp(VX, 4, u), lerp(CAR + 3, CAR - 18, u), lerp(ARM_Z - 1.3, 0, u)], z: Math.exp(lerp(Math.log(46), Math.log(5.6), u)), yaw: lerp(-30, -32, u), pitch: lerp(8, 6, u) };
      const s = { carY: CAR, open: 4 };
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(CatchView, { t, c, l: "day", s, hiRail: 1 - u });
    }
  });
  const e3a = tTruss - 0.2;
  shots.push({
    id: "E2_motions",
    a: e2a,
    b: e3a,
    tin: "cut",
    render: (t) => {
      const c = { at: [6, CAR - 8, 0], z: 5.6, yaw: -32, pitch: 6 };
      const sw = Math.sin(Math.PI * ep(t, tSwing - 0.3, tCarriage - 0.1));
      const car = CAR + 16 * Math.sin(Math.PI * ep(t, tCarriage - 0.1, tTowerE + 0.2));
      const s = { carY: car, open: 6 + 34 * sw };
      const arm = proj(c, armPt(s, 1, 0.9, 0, 0)), carP = proj(c, [-TW - 2, car, 0]);
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        CatchView,
        {
          t,
          c,
          l: "day",
          s,
          hiCarriage: fadeWin(t, tCarriage - 0.1, e3a + 0.4, 0.2),
          overlay: svg2(
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Tag, { text: "SWING", x: arm[0] + 70, y: arm[1] + 90, to: [arm[0], arm[1] + 10], o: fadeWin(t, tSwing - 0.2, tCarriage, 0.2), size: 40 }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Tag, { text: "TRAVEL", x: carP[0] - 60, y: carP[1], to: [carP[0] + 20, carP[1]], o: fadeWin(t, tCarriage - 0.1, e3a + 0.3, 0.2), size: 40, align: "r" })
            ] })
          )
        }
      );
    }
  });
  const e5a = tNewer - 0.25;
  shots.push({
    id: "E3_loadpath",
    a: e3a,
    b: e5a,
    tin: "cut",
    render: (t) => {
      const follow = ep(t, tInto - 0.2, tGround + 0.4);
      const c = {
        at: [lerp(18, 0, ep(t, tLoadP, tInto + 0.3)), lerp(CAR - 4, 30, follow), 0],
        z: lerp(lerp(13, 10, prog(t, e3a, tLoadP)), 4.6, follow),
        yaw: lerp(-38, -30, follow),
        pitch: lerp(-12, 4, ep(t, e3a, tInto))
      };
      const s = { carY: CAR, open: 4, flex: 0.3 };
      const loadU = ep(t, tLoadP + 0.2, tInto - 0.1);
      const trussK = fadeWin(t, tTruss, e5a, 0.3);
      const carK = fadeWin(t, tInto - 0.2, e5a, 0.2);
      const down = ep(t, tDown - 0.2, tGround);
      const legs = [[TW, TW], [TW, -TW], [-TW, TW], [-TW, -TW]].map(([x, z]) => [proj(c, [x, CAR - 8, z]), proj(c, [x, 0, z])]);
      const gp = proj(c, [0, 0, 0]);
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        CatchView,
        {
          t,
          c,
          l: "day",
          s,
          hiTruss: trussK,
          load: t < tLoadP ? -1 : loadU,
          hiCarriage: carK,
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(BoosterAt, { c, carY: CAR, above: -0.3, v: "v3", l: "day", heading: 0, props: { t, id: "e3b" } }),
          overlay: svg2(
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
              down > 0 ? legs.map(([a, b], i) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("line", { x1: a[0], y1: a[1], x2: lerp(a[0], b[0], down), y2: lerp(a[1], b[1], down), stroke: C.yellow, strokeWidth: 7, strokeLinecap: "round", opacity: 0.9 * (1 - prog(t, e5a - 0.5, e5a)) }, i)) : null,
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("ellipse", { cx: gp[0], cy: gp[1], rx: 160 * prog(t, tGround - 0.1, tGround + 0.4), ry: 30 * prog(t, tGround - 0.1, tGround + 0.4), fill: "none", stroke: C.yellow, strokeWidth: 6, opacity: 1 - prog(t, tGround + 0.4, e5a) })
            ] })
          )
        }
      );
    }
  });
  const e6a = tMoment - 0.2;
  shots.push({
    id: "E5_newer",
    a: e5a,
    b: tFins - 0.35,
    tin: "cut",
    render: (t) => {
      const c = { at: [10, CAR - 2, 0], z: 9, yaw: -40, pitch: 10 };
      const s = { carY: CAR, open: 8 };
      const g = fadeWin(t, tShorter - 0.3, tFins, 0.2);
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        CatchView,
        {
          t,
          c,
          l: "day",
          s,
          fore: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("g", { opacity: 0.35 * g, children: [1, -1].map((sd) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Arm, { c, s: { ...s, len: 40 }, side: sd, l: "studio" }, sd)) }),
          overlay: svg2(/* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "SHORTER ARMS", x: 1760, y: 200, anchor: "end", size: 64, color: "#fbf4e4", o: g }))
        }
      );
    }
  });
  shots.push({
    id: "E5b_fins",
    a: tFins - 0.35,
    b: e6a,
    tin: "cut",
    render: (t) => {
      const rot = 10 + 40 * prog(t, tFins - 0.35, e6a);
      const hi = prog(t, tCatchF - 0.2, tCatchF + 0.2);
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Sky, { k: "studio" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("g", { transform: `translate(960 ${600}) scale(${lerp(54, 60, prog(t, tFins, e6a))})`, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(FinTopView, { elev: 34, rot, catchHi: hi }) }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "3 LARGER GRID FINS", x: 1820, y: 170, anchor: "end", size: 64, color: "#2b3540", o: fadeWin(t, tFins - 0.1, e6a, 0.2) }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "REVISED CATCH FEATURES", x: 1820, y: 1e3, anchor: "end", size: 56, o: fadeWin(t, tCatchF - 0.1, e6a, 0.2) })
      ] });
    }
  });
  const e7a = tCraft - 0.2;
  shots.push({
    id: "E6_one",
    a: e6a,
    b: e7a,
    tin: "cut",
    render: (t) => {
      const c = { at: [10, CAR - 22, 0], z: lerp(5.4, 5, prog(t, e6a, e7a)), yaw: -24, pitch: 4 };
      const s = { carY: CAR, open: lerp(14, 4, ep(t, e6a, tOne - 0.4)) };
      const above = approach(t, e6a - 0.5, tOne - 0.2, 20);
      const one = prog(t, tOne - 0.1, tOne + 0.4);
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        CatchView,
        {
          t,
          c,
          l: "dusk",
          s,
          hiTruss: one * 0.6,
          hiCarriage: one,
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("g", { style: one > 0 ? { filter: `drop-shadow(0 0 ${5 * one}px rgba(255,201,60,${one}))` } : void 0, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(BoosterAt, { c, carY: CAR, above, v: "v3", l: "dusk", heading: 0, props: { t, engines: throttle(t, e6a - 0.5, tOne - 0.2, 0.6), plumeLen: 36, id: "e6b" } }) })
        }
      );
    }
  });
  const f0a = ss("S6") - 1;
  shots.push({
    id: "E7_handoff",
    a: e7a,
    b: f0a,
    tin: "cut",
    render: (t) => {
      const c = { at: [VX - 6, CAR + 8, 0], z: 9.5, yaw: -22, pitch: 3 };
      const end = tHand + 0.4;
      const s = { carY: lerp(CAR + 6, CAR, ep(t, e7a, end)), open: lerp(34, 5, ep(t, e7a, end)) };
      const above = lerp(30, 0.8, ep(t, e7a, end));
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        CatchView,
        {
          t,
          c,
          l: "dusk",
          s,
          hiRail: fadeWin(t, tHand - 0.3, f0a + 1, 0.3),
          fore: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(PinMark, { c, s, above, hi: 1 }),
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ShipAt, { c, carY: s.carY, above: above + (s.carY - CAR) * 0, l: "dusk", heading: 70, props: { engines: 0.9, t, id: "e7s", flapFwd: 60, flapAft: 70 } }),
          overlay: svg2(/* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "THE HANDOFF", x: 960, y: 170, size: 78, o: fadeWin(t, tHand - 0.1, f0a, 0.2) }))
        }
      );
    }
  });
  const tDrift = ls("S6_01"), tMiss = wt("S6_01", "miss"), tTilt = ls("S6_02"), tFirst = wt("S6_02", "before"), tShared = wt("S6_02", "shared");
  const tFast = ls("S6_03"), tImpact = wt("S6_03", "impact"), tSimple = ls("S6_04"), tCoop = ls("S6_05");
  const tCant = ls("S6_06"), tRemain = wt("S6_06", "remain"), tSite = ls("S6_07"), tNext = wt("S6_07", "next");
  const FV = { at: [VX, CAR - 1, 0], z: 23, yaw: -90, pitch: 6 };
  const sF = { carY: CAR, open: 0 };
  const FrontDemo = ({ t, v, ghost, word, wo = 0, impact = 0, overlay }) => {
    const shipNode = (q, id, gh = false) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ShipAtFront, { t, q, id, ghost: gh });
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      CatchView,
      {
        t,
        c: FV,
        l: "studio",
        s: { ...sF, flex: impact * 0.8 },
        clouds: false,
        mount: false,
        farm: false,
        hiRail: 0.8,
        vehicle: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
          ghost ? shipNode(ghost, "fg", true) : null,
          shipNode(v, "fv")
        ] }),
        overlay: svg2(
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
            word ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: word, x: 300, y: 200, size: 110, o: wo }) : null,
            impact > 0 ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("circle", { cx: 960, cy: proj(FV, [VX, CAR + RAIL_DY, 0])[1], r: 300 * impact, fill: "none", stroke: C.red, strokeWidth: 14 * (1 - impact), opacity: 1 - impact }) : null,
            overlay
          ] })
        )
      }
    );
  };
  const ShipAtFront = ({ t, q, id, ghost }) => {
    const p = proj(FV, [VX, shipRestY(CAR) + q.above, q.dz]);
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("g", { transform: `translate(${p[0]} ${p[1] - 35.6 * FV.z}) rotate(${q.tilt}) translate(0 ${35.6 * FV.z}) scale(${FV.z})`, opacity: ghost ? 0.3 : 1, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Ship, { az: 180, pal: "studio", t, engines: q.eng, plumeLen: 16, flapFwd: 60, flapAft: 70, id, fittings: 1 }) });
  };
  const base = { dz: 0, tilt: 0, above: 0, eng: 0 };
  const f1a = tDrift - 0.2;
  shots.push({
    id: "F0_baseline",
    a: f0a,
    b: f1a,
    tin: "dip",
    td: 0.5,
    render: (t) => {
      const above = approach(t, f0a, f1a - 0.5, 12, 0.15);
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(FrontDemo, { t, v: { ...base, above, eng: throttle(t, f0a, f1a - 0.5, 0.4) }, word: "BASELINE", wo: fadeWin(t, f0a + 0.3, f1a, 0.2) * 0.85 });
    }
  });
  const f2a = tTilt - 0.2;
  shots.push({
    id: "F1_drift",
    a: f1a,
    b: f2a,
    tin: "cut",
    render: (t) => {
      const u = ep(t, f1a + 0.2, tMiss + 0.4);
      const above = lerp(12, -2.5, u);
      const dz = lerp(0, 2.6, ep(t, f1a + 0.2, tMiss));
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(FrontDemo, { t, v: { dz, tilt: 0, above, eng: 1 - prog(t, tMiss + 0.3, tMiss + 0.6) }, ghost: { ...base, above: Math.max(0, above) }, word: "DRIFT", wo: fadeWin(t, f1a + 0.1, f2a, 0.2) });
    }
  });
  const f3a = tFast - 0.2;
  shots.push({
    id: "F2_tilt",
    a: f2a,
    b: f3a,
    tin: "cut",
    render: (t) => {
      const above = approach(t, f2a + 0.1, tFirst, 12, 0.1);
      const tilt = 4.5 * (1 - 0.3 * prog(t, tFirst, tShared));
      const one = prog(t, tFirst - 0.1, tFirst + 0.2) * (1 - prog(t, f3a - 0.4, f3a));
      const pr = proj(FV, [VX, CAR + RAIL_DY, ARM_Z - 1.3]), pl = proj(FV, [VX, CAR + RAIL_DY, -(ARM_Z - 1.3)]);
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        FrontDemo,
        {
          t,
          v: { dz: 0, tilt, above: above + 0.9, eng: throttle(t, f2a, tFirst, 0.5) },
          ghost: base,
          word: "TILT",
          wo: fadeWin(t, f2a + 0.1, f3a, 0.2),
          overlay: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Arrow, { x: pr[0], y: pr[1] - 230, dx: 0, dy: 200, color: C.red, o: one, w: 14 }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Arrow, { x: pl[0], y: pl[1] - 120, dx: 0, dy: 80, o: one, w: 8 })
          ] })
        }
      );
    }
  });
  const f4a = tSimple - 0.2;
  shots.push({
    id: "F3_fast",
    a: f3a,
    b: f4a,
    tin: "cut",
    render: (t) => {
      const hit = tImpact - 0.15;
      const above = t < hit ? lerp(14, 0, Math.pow(prog(t, f3a + 0.4, hit), 1.15)) : -0.6 * Math.exp(-(t - hit) * 6) * Math.cos((t - hit) * 30);
      const imp = t > hit ? prog(t, hit, hit + 0.5) : 0;
      const shake = t > hit ? 8 * Math.exp(-(t - hit) * 5) * Math.sin((t - hit) * 60) : 0;
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { style: { position: "absolute", inset: 0, transform: `translate(${shake}px, ${shake * 0.5}px)` }, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(FrontDemo, { t, v: { dz: 0, tilt: 0, above, eng: t < hit ? 0.35 : 0 }, ghost: base, word: "TOO FAST", wo: fadeWin(t, f3a + 0.1, f4a, 0.2), impact: imp > 0 && imp < 1 ? imp : 0 }) });
    }
  });
  const f5a = tCant - 0.2;
  shots.push({
    id: "F4_cooperate",
    a: f4a,
    b: f5a,
    tin: "cut",
    render: (t) => {
      const k = ep(t, tCoop + 0.2, f5a - 0.3);
      const above = lerp(3, 0, k);
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        FrontDemo,
        {
          t,
          v: { ...base, above, eng: 0.6 * (1 - k) },
          ghost: null,
          overlay: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("g", { opacity: 0.35 * (1 - k), children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ShipAtFront, { t, q: { dz: lerp(2.6, 0, k), tilt: 0, above: above + 2, eng: 0 }, id: "f4a", ghost: true }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ShipAtFront, { t, q: { dz: 0, tilt: lerp(4.5, 0, k), above: above + 2, eng: 0 }, id: "f4b", ghost: true })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "POSITION", x: 420, y: 200, size: 60, color: "#2b3540", o: prog(t, wt("S6_05", "position") - 0.1, wt("S6_05", "position") + 0.2) }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "ROTATION", x: 960, y: 200, size: 60, color: "#2b3540", o: prog(t, wt("S6_05", "rotation") - 0.1, wt("S6_05", "rotation") + 0.2) }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Word, { text: "SPEED", x: 1500, y: 200, size: 60, color: "#2b3540", o: prog(t, wt("S6_05", "speed") - 0.1, wt("S6_05", "speed") + 0.2) })
          ] })
        }
      );
    }
  });
  const f6a = tSite - 0.2;
  shots.push({
    id: "F5_remain",
    a: f5a,
    b: f6a,
    tin: "cut",
    render: (t) => {
      const c = { at: [VX - 4, CAR + 2, 0], z: 10, yaw: -14, pitch: 2 };
      const s = { carY: CAR, open: 4, flex: 0.4 * prog(t, tRemain - 0.6, tRemain) };
      const above = lerp(10, 0, ep(t, f5a, tRemain - 0.5));
      const r = proj(c, [VX, CAR + RAIL_DY, ARM_Z - 1.3]);
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        CatchView,
        {
          t,
          c,
          l: "studio",
          s,
          clouds: false,
          hiRail: 0.8,
          fore: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(PinMark, { c, s, above, hi: 1 }),
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ShipAt, { c, carY: CAR, above, l: "studio", heading: 70, props: { engines: 0.9, t, id: "f5s", flapFwd: 60, flapAft: 70 } }),
          overlay: svg2(/* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Arrow, { x: r[0] + 40, y: r[1] - 260, dx: 0, dy: 220, color: C.red, w: 16, o: fadeWin(t, wt("S6_06", "motion") - 0.3, f6a, 0.2) }))
        }
      );
    }
  });
  const g0a = ss("S7") - 0.9;
  shots.push({
    id: "F6_site",
    a: f6a,
    b: g0a,
    tin: "dip",
    td: 0.5,
    render: (t) => {
      const u = prog(t, f6a, g0a);
      const c = { at: [lerp(6, -4, u), lerp(70, 44, u), 0], z: lerp(5.2, 3.8, u), yaw: lerp(-30, -42, u), pitch: lerp(6, 11, u) };
      const s = { carY: 108, open: 30 };
      const k = fadeWin(t, tNext - 0.4, g0a + 0.5, 0.3);
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(CatchView, { t, c, l: "night", s, hiRail: k, hiCarriage: k });
    }
  });
  return shots;
};

// src/v2/shots/s7s8s9.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
var svg3 = (children) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("svg", { width: 1920, height: 1080, style: { position: "absolute", inset: 0 }, children });
var CAR2 = 98;
var Lamp = ({ x, y, state, o = 1, label }) => o <= 0.01 ? null : /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("g", { opacity: o, children: [
  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("circle", { cx: x, cy: y, r: 30, fill: state === "go" ? "#36c37a" : state === "warn" ? "#ffb23c" : "#4a5260", stroke: C.ink, strokeWidth: 5 }),
  state !== "off" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("circle", { cx: x, cy: y, r: 52, fill: state === "go" ? "rgba(54,195,122,0.25)" : "rgba(255,178,60,0.3)" }) : null,
  label ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("text", { x: x + 48, y: y + 14, fontFamily: FONT.title, fontWeight: 600, fontSize: 40, fill: C.cream, stroke: C.ink, strokeWidth: 4, style: { paintOrder: "stroke" }, children: label }) : null
] });
var s7s8s9Shots = () => {
  const shots = [];
  const g0a = ss("S7") - 0.9;
  const tVeh = wt("S7_01", "vehicle"), tEng = wt("S7_01", "engine"), tGnd = wt("S7_01", "ground"), tRemove = wt("S7_01", "remove");
  const tF6 = ls("S7_02"), tCall = wt("S7_02", "call"), tAlt = ls("S7_03"), tDetect = wt("S7_03", "detected");
  const tBeside = ls("S7_04"), tProtect = ls("S7_05"), tPicture = wt("S7_05", "picture");
  const g3a = tF6 - 0.25;
  shots.push({
    id: "G1_decide",
    a: g0a,
    b: g3a,
    tin: "fade",
    td: 0.4,
    render: (t) => {
      const c = { at: [12, 92, 0], z: 4, yaw: -26, pitch: 3 };
      const s = { carY: CAR2, open: 30 };
      const above = lerp(90, 70, prog(t, g0a, g3a));
      const sp = proj(c, [VX, shipRestY(CAR2) + above + 20, 0]);
      const tw = proj(c, [0, 140, 0]);
      const warn = t > tGnd + 0.1;
      const dim = prog(t, tRemove - 0.1, tRemove + 0.5);
      const pathPts = Array.from({ length: 20 }, (_, i) => {
        const u = i / 19;
        return proj(c, [VX, shipRestY(CAR2) + above * (1 - u), 0]);
      });
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        CatchView,
        {
          t,
          c,
          l: "dusk",
          s,
          sun: [1500, 760],
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ShipAt, { c, carY: CAR2, above, l: "dusk", heading: 70, props: { engines: 0, t, id: "g1s", flapFwd: 30, flapAft: 30 } }),
          overlay: svg3(
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("polyline", { points: pathPts.map((p) => `${p[0]},${p[1] + 210}`).join(" "), stroke: warn ? C.red : C.cream, strokeWidth: 6, strokeDasharray: "4 16", strokeLinecap: "round", fill: "none", opacity: (1 - 0.6 * dim) * prog(t, g0a + 0.2, g0a + 0.8) }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Lamp, { x: sp[0] + 150, y: sp[1] - 60, state: t > tVeh ? "go" : "off", o: prog(t, tVeh - 0.3, tVeh), label: "VEHICLE" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Lamp, { x: sp[0] + 150, y: sp[1] + 60, state: t > tEng ? "go" : "off", o: prog(t, tEng - 0.3, tEng), label: "ENGINES" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Lamp, { x: tw[0] - 330, y: tw[1] + 120, state: warn ? "warn" : "off", o: prog(t, tGnd - 0.3, tGnd), label: "GROUND" })
            ] })
          )
        }
      );
    }
  });
  const g4a = tAlt - 0.2;
  shots.push({
    id: "G3_flight6",
    a: g3a,
    b: g4a,
    tin: "dip",
    td: 0.45,
    render: (t) => {
      const c = { at: [30, 70, 0], z: 4.4, yaw: -20, pitch: 4 };
      const s = { carY: 104, open: 30 };
      const u = ep(t, g3a, g4a + 0.4);
      const off = lerp(0, 150, u);
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        CatchView,
        {
          t,
          c,
          l: "day",
          s,
          sky: "gulf",
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Place, { c, p: [VX + 40 + off, 170 - 90 * u, -40 * u], tilt: lerp(-4, 14, u), children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Booster, { az: azFor(c, 45), version: "v1", pal: "day", t, engines: 0.9, plumeLen: 30, id: "g3b" }) }),
          overlay: svg3(
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Word, { text: "FLIGHT 6 \xB7 2024", x: 110, y: 150, anchor: "start", size: 60, color: "#fbf4e4", o: fadeWin(t, tF6, g4a, 0.3) }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Word, { text: "CATCH CALLED OFF", x: 110, y: 240, anchor: "start", size: 60, o: fadeWin(t, tCall - 0.2, g4a, 0.25) })
            ] })
          )
        }
      );
    }
  });
  const g5a = tProtect - 0.2;
  shots.push({
    id: "G4_branches",
    a: g4a,
    b: g5a,
    tin: "cut",
    render: (t) => {
      const tower = [380, 880];
      const P0 = [1800, 90];
      const pathAt = (u) => [lerp(P0[0], tower[0] + 140, u), lerp(P0[1], tower[1] - 260, Math.pow(u, 0.85))];
      const pu = ep(t, g4a, g5a - 0.3, (v) => v);
      const shipP = pathAt(Math.min(0.98, pu));
      const branches = [0.12, 0.3, 0.48, 0.66];
      const red = prog(t, tBeside - 0.2, tBeside + 0.4);
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Sky, { k: "gulf", horizon: 0.88 }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("rect", { x: 0, y: 930, width: 1920, height: 150, fill: "#3f7fae" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("rect", { x: 0, y: 890, width: 760, height: 50, fill: "#d3c7a3" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("g", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("rect", { x: tower[0] - 14, y: tower[1] - 460, width: 28, height: 460, fill: "#38424d" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("rect", { x: tower[0] + 14, y: tower[1] - 266, width: 150, height: 16, fill: "#46525e", stroke: C.ink, strokeWidth: 3 })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("polyline", { points: Array.from({ length: 50 }, (_, i) => pathAt(i / 49)).map((p) => p.join(",")).join(" "), stroke: "#fbf4e4", strokeWidth: 7, strokeDasharray: "4 16", strokeLinecap: "round", fill: "none" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: `M ${pathAt(0.8)[0]} ${pathAt(0.8)[1]} L ${pathAt(1)[0]} ${pathAt(1)[1]}`, stroke: C.red, strokeWidth: 14, strokeLinecap: "round", opacity: red }),
        branches.map((b, i) => {
          const p = pathAt(b);
          const passed = pu > b + 0.05;
          const o = prog(t, tAlt + i * 0.35, tAlt + i * 0.35 + 0.3) * (passed ? 0.25 : 1);
          return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Arrow, { x: p[0], y: p[1], dx: 220, dy: 170, color: C.teal, w: 9, o }, i);
        }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(InFlight, { x: shipP[0], y: shipP[1], rot: lerp(-90, 0, prog(pu, 0.55, 0.8)), z: 2.4, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Ship, { az: 70, pal: "day", t, engines: pu > 0.6 ? 1 : 0, plumeLen: 14, flapFwd: 40, flapAft: 50, id: "g4s" }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Word, { text: "DIVERT OPTIONS", x: 1300, y: 720, size: 56, color: C.teal, o: fadeWin(t, tAlt + 0.3, tBeside, 0.3) }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Word, { text: "NO GUARANTEED ESCAPE", x: 760, y: 520, anchor: "start", size: 56, color: C.red, o: red * fadeWin(t, tBeside, g5a, 0.2) })
      ] });
    }
  });
  const h1a = ss("S8") - 1;
  shots.push({
    id: "G5_protect",
    a: g5a,
    b: h1a,
    tin: "fade",
    td: 0.4,
    render: (t) => {
      const u = prog(t, g5a, h1a);
      const c = { at: [lerp(4, 8, u), lerp(80, 92, u), 0], z: lerp(5.2, 6.4, u), yaw: lerp(-34, -26, u), pitch: 3 };
      const k = fadeWin(t, tProtect + 0.2, tPicture - 0.2, 0.3);
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(CatchView, { t, c, l: "dusk", s: { carY: 104, open: 30 }, hiRail: k, hiCarriage: k, sun: [1550, 700] });
    }
  });
  const tGroundM = wt("S8_00", "ground"), tOff = wt("S8_00", "off"), tBoth = ls("S8_01"), tAgain = wt("S8_01", "again");
  const tPrize = ls("S8_02"), tJob = ls("S8_03"), tHeat = wt("S8_03", "heat"), tEngS = wt("S8_03", "engines"), tStruct = wt("S8_03", "structure"), tProving = wt("S8_03", "proving");
  const tCatch = ls("S8_04"), tInspect = wt("S8_04", "inspect"), tFly = wt("S8_04", "fly"), tRepeat = wt("S8_04", "repeat");
  const tGoal = ls("S8_05"), tOnce = wt("S8_05", "once"), tEvery = ls("S8_06");
  const h2a = tBoth - 0.2;
  shots.push({
    id: "H1_legs",
    a: h1a,
    b: h2a,
    tin: "dip",
    td: 0.45,
    render: (t) => {
      const c = { at: [10, 88, 0], z: 5.6, yaw: -24, pitch: 3 };
      const s = { carY: CAR2, open: 10 };
      const above = 14;
      const legs = 1 - prog(t, tOff - 0.4, tOff + 0.3);
      const armK = fadeWin(t, tGroundM - 0.2, h2a, 0.3);
      const b = proj(c, [VX, shipRestY(CAR2) + above, 0]);
      const z = c.z;
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        CatchView,
        {
          t,
          c,
          l: "studio",
          s,
          hiRail: armK,
          hiCarriage: armK,
          clouds: false,
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ShipAt, { c, carY: CAR2, above, l: "studio", heading: 70, props: { t, id: "h1s", flapFwd: 60, flapAft: 70 } }),
          overlay: svg3(
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("g", { opacity: legs * prog(t, h1a + 0.3, h1a + 0.8), stroke: "#e5484d", strokeWidth: 5, strokeDasharray: "10 8", fill: "none", children: [
              [-1, 1].map((sd) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: `M ${b[0] + sd * 3 * z} ${b[1] - 4 * z} L ${b[0] + sd * 8 * z} ${b[1] + 6 * z} L ${b[0] + sd * 10 * z} ${b[1] + 6 * z}` }, sd)),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: `M ${b[0] - 1 * z} ${b[1]} L ${b[0]} ${b[1] + 7 * z} L ${b[0] + 1.5 * z} ${b[1] + 7 * z}` })
            ] })
          )
        }
      );
    }
  });
  const h3a = tPrize - 0.2;
  shots.push({
    id: "H2_restack",
    a: h2a,
    b: h3a,
    tin: "cut",
    render: (t) => {
      const c = { at: [14, 78, 0], z: 4.9, yaw: -30, pitch: 4 };
      const lift = ep(t, h2a + 0.2, tAgain - 0.1);
      const restY = MOUNT_TOP + 0.6 + BOOSTER_LEN;
      const carY = lerp(CAR2, restY + 35.1 - RAIL_DY, lift);
      const s = { carY, open: 4 };
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        CatchView,
        {
          t,
          c,
          l: "day",
          s,
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Place, { c, p: [VX, MOUNT_TOP + 0.6, 0], children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Booster, { az: azFor(c, 0), pal: "day", t, id: "h2b" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ShipAt, { c, carY, above: 0, l: "day", heading: 70, props: { t, id: "h2s" } })
          ] }),
          overlay: svg3(/* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Word, { text: "SAME HARDWARE, AGAIN", x: 1820, y: 170, anchor: "end", size: 60, color: "#fbf4e4", o: fadeWin(t, tAgain - 0.6, h3a, 0.3) }))
        }
      );
    }
  });
  const h4a = tJob - 0.2;
  shots.push({
    id: "H3_prize",
    a: h3a,
    b: h4a,
    tin: "dip",
    td: 0.4,
    render: (t) => {
      const N2 = 6;
      const path = (f) => [lerp(300, 1240, f), lerp(200, 640, Math.pow(f, 1.3))];
      const shown = prog(t, h3a + 0.2, h4a - 0.4) * (N2 - 1);
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Sky, { k: "dusk", sun: [1600, 820] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("rect", { x: 0, y: 960, width: 1920, height: 120, fill: "#2a2a33" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("g", { transform: "translate(1290 960)", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("rect", { x: -26, y: -640, width: 52, height: 640, fill: "#1f2027" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("rect", { x: 26, y: -330, width: 180, height: 30, fill: "#26262e" })
        ] }),
        Array.from({ length: N2 }, (_, i) => {
          const f = i / (N2 - 1);
          const o = clamp(shown - i + 1);
          if (o <= 0) return null;
          const [x, y] = path(f);
          return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("g", { opacity: o * (i === Math.floor(shown) ? 1 : 0.4), children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(InFlight, { x, y, rot: lerp(-90, 0, smoother(prog(f, 0.4, 0.9))), z: 4.2, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Ship, { az: 100, pal: "dusk", t, engines: f > 0.4 ? 1 : 0, plumeLen: 16, flapFwd: 50, flapAft: 60, id: `h3s${i}` }) }) }) }, i);
        })
      ] });
    }
  });
  const h5a = tCatch - 0.15;
  shots.push({
    id: "H4_inspect",
    a: h4a,
    b: h5a,
    tin: "cut",
    render: (t) => {
      const z = 15;
      const x = 960, y = 1e3;
      const scan = ep(t, tHeat - 0.3, tEngS - 0.1);
      const engK = fadeWin(t, tEngS - 0.1, tProving, 0.2), strK = fadeWin(t, tStruct - 0.1, tProving + 0.2, 0.2);
      const lift = ep(t, tProving, h5a + 0.3);
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Sky, { k: "night" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("rect", { x: 0, y: 1e3, width: 1920, height: 80, fill: "#262b31" }),
        [400, 1520].map((lx, i) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("ellipse", { cx: lx, cy: 300, rx: 420, ry: 700, fill: "url(#glowWhite)", opacity: 0.12 }, i)),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(InFlight, { x, y: y - lift * 500, rot: 0, z, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("g", { transform: "translate(0 0)", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Ship, { az: 45, pal: "studio", t, detail: true, id: "h4s", engines: 0 }) }) }),
        scan > 0 && scan < 1 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("rect", { x: x - 6 * z, y: y - 52 * z + scan * 52 * z, width: 12 * z, height: 10, fill: "#2ec4b6", opacity: 0.85 }) : null,
        scan > 0 && scan < 1 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("rect", { x: x - 6 * z, y: y - 52 * z, width: 12 * z, height: scan * 52 * z, fill: "rgba(46,196,182,0.12)" }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("ellipse", { cx: x, cy: y - lift * 500 + 12, rx: 5 * z, ry: 22, fill: "none", stroke: C.yellow, strokeWidth: 8, opacity: engK }),
        strK > 0 ? Array.from({ length: 8 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("line", { x1: x - 4.5 * z, x2: x + 4.5 * z, y1: y - lift * 500 - (4 + i * 3.66) * z, y2: y - lift * 500 - (4 + i * 3.66) * z, stroke: C.yellow, strokeWidth: 4, opacity: strK * 0.8 }, i)) : null,
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Word, { text: "HEAT SHIELD", x: 1500, y: 300, size: 58, color: "#fbf4e4", o: fadeWin(t, tHeat - 0.1, tEngS, 0.2) }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Word, { text: "ENGINES", x: 1500, y: 300, size: 58, color: "#fbf4e4", o: fadeWin(t, tEngS - 0.1, tStruct, 0.2) }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Word, { text: "STRUCTURE", x: 1500, y: 300, size: 58, color: "#fbf4e4", o: fadeWin(t, tStruct - 0.1, tProving, 0.2) }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Word, { text: "FLY AGAIN?", x: 1500, y: 300, size: 58, o: fadeWin(t, tProving, h5a, 0.2) })
      ] });
    }
  });
  const i1a = ss("S9") - 1.4;
  shots.push({
    id: "H5_loop",
    a: h5a,
    b: i1a,
    tin: "cut",
    render: (t) => {
      const cx = 960, cy = 520, r = 300;
      const st = [
        { a: -90, w: "CATCH", t0: tCatch },
        { a: 30, w: "INSPECT", t0: tInspect },
        { a: 150, w: "FLY", t0: tFly }
      ];
      const ring = prog(t, tRepeat - 0.1, tRepeat + 0.6);
      const speed = 0.35 + 1.3 * prog(t, tGoal, i1a);
      const ph = t >= tRepeat ? (t - tRepeat) * speed % 1 : 0;
      const once = fadeWin(t, tOnce - 0.5, tEvery, 0.2);
      const trips = Math.floor(Math.max(0, t - tRepeat) * speed);
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Sky, { k: "night" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("circle", { cx, cy, r, fill: "none", stroke: "#fbf4e4", strokeWidth: 8, strokeDasharray: "6 22", strokeLinecap: "round", opacity: 0.25 + 0.75 * ring }),
        st.map((p, i) => {
          const a = p.a * Math.PI / 180;
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          const o = prog(t, p.t0 - 0.15, p.t0 + 0.1);
          return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("g", { opacity: o, children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("circle", { cx: x, cy: y, r: 96, fill: "#1c232b", stroke: C.yellow, strokeWidth: 6 }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(InFlight, { x, y: y + 64, rot: 0, z: 2.4, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Ship, { az: 70, pal: "day", t, engines: i === 2 ? 1 : 0, plumeLen: 14, id: `h5s${i}` }) }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Word, { text: p.w, x: x + (i === 0 ? 0 : i === 1 ? 130 : -130), y: y + (i === 0 ? -125 : 30), anchor: i === 0 ? "middle" : i === 1 ? "start" : "end", size: 58, color: "#fbf4e4", o: 1 })
          ] }, i);
        }),
        ring > 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("g", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("circle", { cx: cx + Math.cos(ph * Math.PI * 2 - Math.PI / 2) * r, cy: cy + Math.sin(ph * Math.PI * 2 - Math.PI / 2) * r, r: 20, fill: C.yellow, stroke: C.ink, strokeWidth: 5 }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Word, { text: "REPEAT", x: cx, y: cy + 24, size: 82, o: ring })
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("g", { opacity: prog(t, tGoal - 0.2, tGoal + 0.4), children: Array.from({ length: Math.min(40, trips) }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("rect", { x: 360 + i * 30, y: 960, width: 16, height: 46, rx: 5, fill: C.yellow, opacity: 0.9 }, i)) }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("g", { opacity: once, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("circle", { cx: 1650, cy: 240, r: 70 + 30 * Math.sin(t * 6), fill: "url(#glowWarm)" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Word, { text: "ONCE?", x: 1650, y: 360, size: 52, color: "#fbf4e4", o: 1 })
        ] })
      ] });
    }
  });
  const tDiff = ls("S9_00"), tShield = ls("S9_01"), tFlapsF = ls("S9_02"), tEngF = ls("S9_03"), tMeet = wt("S9_04", "meet"), tLoadF = wt("S9_04", "load", 0, "e");
  const tSeq = ls("S9_05"), tFirst = ls("S9_06"), tNextC = ls("S9_07"), tBack = wt("S9_07", "back");
  shots.push({
    id: "I1_high",
    a: i1a,
    b: tShield - 0.2,
    tin: "dip",
    td: 0.6,
    render: (t) => {
      const u = prog(t, i1a, tShield);
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Sky, { k: "dusk", sun: [1500, 900] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(SeaPlane, { y: 870, t, tint: ["#9a6f7a", "#3d3f5c"] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("rect", { x: 0, y: 860, width: 760, height: 30, fill: "#7a6658" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Clouds, { n: 8, seed: 61, y0: 500, y1: 900, dy: -t * 40, s: 1, tint: "#f3c0a6", o: 0.7 }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(InFlight, { x: lerp(1250, 1100, u), y: lerp(260, 330, u), rot: -90, z: 3.2, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Ship, { az: 40, pal: "dusk", t, heat: 0.25 * (1 - u), flapFwd: 30, flapAft: 40, id: "i1s" }) }) })
      ] });
    }
  });
  shots.push({
    id: "I2_tiles",
    a: tShield - 0.2,
    b: tFlapsF - 0.25,
    tin: "cut",
    render: (t) => {
      const u = prog(t, tShield - 0.2, tFlapsF);
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Sky, { k: "dusk" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(InFlight, { x: 960, y: 560, rot: -96, z: lerp(70, 58, u), children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("g", { transform: "translate(1 24)", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Ship, { az: 18, pal: "dusk", t, heat: 0.18 * (1 - u), detail: true, id: "i2s" }) }) })
      ] });
    }
  });
  shots.push({
    id: "I3_flaps",
    a: tFlapsF - 0.25,
    b: tEngF - 0.25,
    tin: "cut",
    render: (t) => {
      const ff = 25 + 22 * Math.sin(t * 2), fa = 30 - 18 * Math.sin(t * 2 + 0.8);
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Sky, { k: "dusk" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Clouds, { n: 12, seed: 71, y0: -300, y1: 1400, dy: -t * 520, s: 1.3, tint: "#f3c0a6", o: 0.8 }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(InFlight, { x: 980, y: 520, rot: -90, z: 17, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Ship, { az: 58, pal: "dusk", t, flapFwd: ff, flapAft: fa, id: "i3s" }) }) })
      ] });
    }
  });
  const i5a = tMeet - 1.6;
  shots.push({
    id: "I4_engines",
    a: tEngF - 0.25,
    b: i5a,
    tin: "cut",
    render: (t) => {
      const f = ep(t, tEngF - 0.2, i5a - 0.2);
      const rot = lerp(-90, 0, smoother(f));
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Frame, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Sky, { k: "dusk" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Clouds, { n: 10, seed: 72, y0: -300, y1: 1400, dy: -t * lerp(520, 180, f), s: 1.3, tint: "#f3c0a6", o: 0.8 }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(InFlight, { x: lerp(1040, 960, f), y: lerp(480, 420, f), rot, z: 13, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("g", { transform: "translate(0 26)", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Ship, { az: lerp(58, 100, f), pal: "dusk", t, engines: prog(t, tEngF - 0.2, tEngF + 0.1), plumeLen: 28, flapFwd: lerp(30, 60, f), flapAft: lerp(30, 70, f), id: "i4s" }) }) })
      ] });
    }
  });
  const i6a = tSeq - 0.3;
  shots.push({
    id: "I5_contact",
    a: i5a,
    b: i6a,
    tin: "fade",
    td: 0.3,
    render: (t) => {
      const contact = tMeet + 0.15;
      const above = approach(t, i5a - 2.4, contact, 9, 0.35);
      const c = { at: [17, CAR2 + 2, 0], z: lerp(15, 13.5, prog(t, i5a, i6a)), yaw: 20, pitch: -4 };
      const s = { carY: CAR2, open: lerp(9, 4, ep(t, i5a, contact)), flex: 0.35 * prog(t, contact, contact + 0.6) };
      const eng = throttle(t, i5a - 2, contact + 0.1, 0.7);
      const loadK = fadeWin(t, wt("S9_04", "tower") - 0.2, i6a + 1, 0.3);
      const pin = proj(c, [VX, CAR2 + RAIL_DY + 0.6, ARM_Z - 1.3]);
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        CatchView,
        {
          t,
          c,
          l: "dusk",
          s,
          hiRail: loadK * 0.7,
          hiTruss: loadK * 0.5,
          fore: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(PinMark, { c, s, above: Math.max(above, -0.3) + 0, hi: 1 }),
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ShipAt, { c, carY: CAR2, above, l: "dusk", heading: 110, props: { engines: eng, t, id: "i5s", flapFwd: 60, flapAft: 70 } }),
          overlay: svg3(/* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Arrow, { x: pin[0], y: pin[1] - 200, dx: 0, dy: 170, o: loadK }))
        }
      );
    }
  });
  shots.push({
    id: "I6_both",
    a: i6a,
    b: tFirst - 0.25,
    tin: "fade",
    td: 0.5,
    render: (t) => {
      const u = prog(t, i6a, tFirst);
      const c = { at: [lerp(8, 4, u), lerp(70, 62, u), 0], z: lerp(4.6, 4.2, u), yaw: -26, pitch: 4 };
      const carShip = MOUNT_TOP + 0.6 + BOOSTER_LEN + 35.1 - RAIL_DY + 18;
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        CatchView,
        {
          t,
          c,
          l: "dusk",
          s: { carY: carShip, open: 4 },
          sun: [1550, 720],
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Place, { c, p: [VX, MOUNT_TOP + 0.6, 0], children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Booster, { az: azFor(c, 0), pal: "dusk", t, id: "i6b" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ShipAt, { c, carY: carShip, above: 0, l: "dusk", heading: 110, props: { t, id: "i6s" } })
          ] }),
          overlay: svg3(/* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Word, { text: "BOTH STAGES", x: 1820, y: 170, anchor: "end", size: 64, color: "#fbf4e4", o: fadeWin(t, wt("S9_05", "both") - 0.2, tFirst, 0.2) }))
        }
      );
    }
  });
  const i8a = tNextC - 0.2;
  shots.push({
    id: "I7_real",
    a: tFirst - 0.25,
    b: i8a,
    tin: "fade",
    td: 0.35,
    render: (t) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Footage, { file: F5, a: tFirst - 0.25, src0: 9.6, scale: 1.1, cx: 0.42, cy: 0.5, children: svg3(/* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Credit, { text: "SpaceX \xB7 Flight 5, 2024", o: fadeWin(t, tFirst, i8a - 0.1, 0.3) })) })
  });
  const endA = NARR_V2 - 2.6;
  shots.push({
    id: "I8_next",
    a: i8a,
    b: FILM_END + 1,
    tin: "column",
    render: (t) => {
      const u = prog(t, i8a, endA);
      const c = { at: [lerp(14, 2, u), lerp(96, 70, u), 0], z: lerp(6.2, 4, u), yaw: lerp(-20, -34, u), pitch: lerp(2, 6, u) };
      const restY = MOUNT_TOP + 0.6 + BOOSTER_LEN;
      const lift = ep(t, tBack - 1.6, tBack + 0.9);
      const carY = lerp(shipRestY(0) * 0 + 98, restY + 35.1 - RAIL_DY, lift);
      const fin = prog(t, endA, endA + 1);
      const mark = prog(t, endA + 0.9, endA + 1.6);
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_jsx_runtime11.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        CatchView,
        {
          t,
          c,
          l: "dusk",
          s: { carY, open: 4 },
          sun: [1550, 720],
          vehicle: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Place, { c, p: [VX, MOUNT_TOP + 0.6, 0], children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Booster, { az: azFor(c, 0), pal: "dusk", t, id: "i8b" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ShipAt, { c, carY, above: 0, l: "dusk", heading: 110, props: { t, id: "i8s" } })
          ] }),
          overlay: svg3(
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("rect", { width: 1920, height: 1080, fill: "#05070a", opacity: fin }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("text", { x: 960, y: 560, textAnchor: "middle", fontFamily: FONT.title, fontWeight: 700, fontSize: 64, fill: C.cream, letterSpacing: 6, opacity: mark, children: "FUTURE GOT WEIRD" })
            ] })
          )
        }
      ) });
    }
  });
  return shots;
};

// src/v2/MainV2.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
var allShotsV2 = () => [...s0s1Shots(), ...s2s3Shots(), ...s4s5s6Shots(), ...s7s8s9Shots()];

// <stdin>
module.exports = allShotsV2().map((s) => ({ id: s.id, a: +s.a.toFixed(2), b: +s.b.toFixed(2), tin: s.tin ?? "cut" }));
