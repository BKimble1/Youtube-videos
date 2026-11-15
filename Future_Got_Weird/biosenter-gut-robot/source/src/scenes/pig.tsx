// S4: the real experiment. The cutaway pulls straight back until the 3D tunnel is a thin tube, and hands over (same
// place, width and angle) to a clean diagram: a pig in side view with its small intestine drawn as a coiled tube. The
// robot (a 2D glyph with the same colours and body plan) then travels a highlighted stretch, leaving a trail with one
// tick per foot, and "6+ FEET" lands on "FEET". The animal-study context is explicit (the pig, and a small tag).
import React from 'react';
import {C, INK} from '../art/palette';
import {clamp, keyS, lerp, ss, ss5, word} from '../lib';
import {heading} from '../world/path';
import {trackS} from '../world/frames';
import {bodyLen, crawl, extLen, LEN, R_ANCHOR_MAX} from '../robot/state';
import {CapText} from './CapText';
import {WIDE_CY, WIDE_PX} from './inside';

// ---------------------------------------------------------------- layout (pig-local units, placed by PIG_TF)
const PIG_S = 0.98, PIG_X = 50, PIG_Y = 690;
export const toScreen = (x: number, y: number) => ({x: x * PIG_S + PIG_X, y: y * PIG_S + PIG_Y});
const TUBE = 15.5 / PIG_S; // tube width (local) -> 15.5 px on screen at zoom 1
export const PX_PER_UNIT_Z1 = 15.5 / 5.14; // the 3D tunnel's outer diameter (5.14 units) maps to the tube width

// the coiled small intestine (schematic): a serpentine of vertical columns joined by half-turns, entered from the
// stomach side. Columns (rather than rows) put a straight, downward stretch at the handover point, so the cutaway's
// straight tunnel hands over to a straight tube and the robot never starts wrapped round a turn.
const COLS_X = Array.from({length: 15}, (_, k) => 684 - 25 * k);
const YT = 258, YB = 412, RT = (COLS_X[0] - COLS_X[1]) / 2;
type Pt = {x: number; y: number};
const PATH: Pt[] = (() => {
  const pts: Pt[] = [];
  // entry from the stomach (upper right) curving down into the first column
  for (let k = 0; k <= 16; k++) {
    const u = k / 16;
    pts.push({x: 742 - (742 - COLS_X[0]) * ss(u, 0, 1), y: 210 + (YT - 210) * u});
  }
  for (let c = 0; c < COLS_X.length; c++) {
    const down = c % 2 === 0;
    const x = COLS_X[c];
    for (let k = 1; k <= 30; k++) {
      const u = k / 30;
      pts.push({x: x + 2.4 * Math.sin(u * Math.PI * 2 + c) * Math.sin(u * Math.PI), y: down ? lerp(YT, YB, u) : lerp(YB, YT, u)});
    }
    if (c === COLS_X.length - 1) break;
    // half-turn to the next column (to the left), at the bottom after a downward column, at the top after an upward one
    const cx = x - RT, cy = down ? YB : YT;
    for (let k = 1; k <= 16; k++) {
      const a = (k / 16) * Math.PI;
      pts.push(down ? {x: cx + RT * Math.cos(a), y: cy + RT * Math.sin(a)} : {x: cx + RT * Math.cos(a), y: cy - RT * Math.sin(a)});
    }
  }
  // on toward the large bowel (lower left)
  const last = pts[pts.length - 1];
  for (let k = 1; k <= 12; k++) pts.push({x: last.x - 6 * k, y: last.y - 2 * k});
  return pts;
})();
const ARC: number[] = (() => {
  const a = [0];
  for (let i = 1; i < PATH.length; i++) a.push(a[i - 1] + Math.hypot(PATH[i].x - PATH[i - 1].x, PATH[i].y - PATH[i - 1].y));
  return a;
})();
const at = (l: number) => {
  const L = clamp(l, 0, ARC[ARC.length - 1]);
  let i = 1;
  while (i < ARC.length - 1 && ARC[i] < L) i++;
  const u = (L - ARC[i - 1]) / (ARC[i] - ARC[i - 1] || 1);
  const p = {x: lerp(PATH[i - 1].x, PATH[i].x, u), y: lerp(PATH[i - 1].y, PATH[i].y, u)};
  const tx = PATH[i].x - PATH[i - 1].x, ty = PATH[i].y - PATH[i - 1].y;
  const tl = Math.hypot(tx, ty) || 1;
  return {p, t: {x: tx / tl, y: ty / tl}};
};
// P0: the leftmost point of the first left half-turn, where the tube runs straight DOWN (the cutaway's direction)
const L_P0 = (() => {
  // the arc length at the middle of column 2 (a downward column)
  let best = 0, bd = 1e9;
  const yMid = YT + 0.3 * (YB - YT);
  for (let i = 0; i < PATH.length; i++) {
    const d = Math.abs(PATH[i].x - COLS_X[2]) + Math.abs(PATH[i].y - yMid);
    if (d < bd && i > 0 && PATH[i].y > PATH[i - 1].y) { bd = d; best = ARC[i]; }
  }
  return best;
})();
export const P0 = toScreen(at(L_P0).p.x, at(L_P0).p.y);
/** the travelled stretch: "over six feet" (local path length) */
/** ~2 m is about 22 lengths of the ~9 cm robot: the stretch is drawn to the glyph's own scale */
const TRAVEL = (22 * bodyLen(0.5) * PX_PER_UNIT_Z1) / PIG_S;
/** the centre of the travelled stretch on screen (the push-in target) */
const ROUTE_C = (() => {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let l = L_P0; l <= L_P0 + TRAVEL; l += 5) {
    const q = toScreen(at(l).p.x, at(l).p.y);
    x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
  }
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2};
})();

// ---------------------------------------------------------------- timing
const tZ0 = 11.55, tZ1 = 12.95; // zoom-out
export const Z0 = (WIDE_PX * 5.14) / 15.5; // the cutaway's px-per-unit -> zoom of the diagram that matches it
const tPig = word('pigs').start;
const tTr0 = word('where').start + 0.05, tTr1 = word('FEET').start - 0.04;
const tFeet = word('FEET').start;
/** zoom of the diagram (1 = final layout) */
export const zoomAt = (t: number) => Math.exp(Math.log(Z0) * (1 - ss5(t, tZ0, tZ1)));
/** 3D -> 2D handover (1 = all 2D) */
export const handover = (t: number) => {
  const z = zoomAt(t);
  return clamp((Math.log(16) - Math.log(z)) / (Math.log(16) - Math.log(8.5)));
};
/** screen angle of the cutaway tunnel at the handover (deg) */
export const A0 = (-heading(trackS(12.0)) * 180) / Math.PI;

/** the robot on the route: its body is drawn ALONG the intestine path (so it bends with the tube and never leaves it),
 *  with the same body plan and colours as the 3D robot, at the diagram's scale. A continuous inchworm (phase p), no reset. */
const RouteRobot: React.FC<{lCentre: number; p: number}> = ({lCentre, p}) => {
  const k = PX_PER_UNIT_Z1 / PIG_S; // robot units -> local path units
  const e = 0.5 + 0.5 * Math.sin(2 * Math.PI * p);
  const aT = 0.5 + 0.5 * Math.sin(2 * Math.PI * p - Math.PI / 2), aH = 0.5 + 0.5 * Math.sin(2 * Math.PI * p + Math.PI / 2);
  const ext = extLen(e);
  const segs: [number, string, number][] = [
    [LEN.tailCap, C.cap[3], 0.75], [LEN.anchor, C.sleeve[3], 1.02 + (R_ANCHOR_MAX - 1.02) * aT], [LEN.collar, C.cap[3], 1.0],
    [ext, C.body[3], 0.95], [LEN.collar, C.cap[3], 1.0], [LEN.anchor, C.sleeve[3], 1.02 + (R_ANCHOR_MAX - 1.02) * aH], [LEN.headCap, C.cap[3], 0.75],
  ];
  const total = segs.reduce((m, q) => m + q[0], 0);
  let l = lCentre - (total / 2) * k;
  const line = (l0: number, l1: number) => {
    const pts: string[] = [];
    for (let x = l0; x <= l1 + 1e-6; x += 0.8) { const q = at(x).p, sp = toScreen(q.x, q.y); pts.push(`${sp.x.toFixed(2)},${sp.y.toFixed(2)}`); }
    const q = at(l1).p, sp = toScreen(q.x, q.y); pts.push(`${sp.x.toFixed(2)},${sp.y.toFixed(2)}`);
    return `M${pts.join('L')}`;
  };
  const pieces = segs.map(([len, col, r]) => { const l0 = l; l += len * k; return {d: line(l0, l), col, w: 2 * r * PX_PER_UNIT_Z1}; });
  const whole = line(lCentre - (total / 2) * k, lCentre + (total / 2) * k);
  return (
    <g>
      <path d={whole} fill="none" stroke={INK} strokeWidth={2 * 1.05 * PX_PER_UNIT_Z1 + 2} strokeLinecap="round" strokeLinejoin="round" />
      {pieces.map((q, i) => <path key={`o${i}`} d={q.d} fill="none" stroke={INK} strokeWidth={q.w + 2} strokeLinecap="butt" strokeLinejoin="round" />)}
      {pieces.map((q, i) => <path key={i} d={q.d} fill="none" stroke={q.col} strokeWidth={q.w} strokeLinecap={i === 0 || i === 6 ? 'round' : 'butt'} strokeLinejoin="round" />)}
    </g>
  );
};
/** the tether: from the robot's tail back along the route and out of the pig; slow dashes move toward the robot (it is
 *  fed and gently pushed from outside: the pig travel was assisted, not an independent journey) */
const Tether: React.FC<{lTail: number; t: number}> = ({lTail, t}) => {
  const pts: string[] = [];
  for (let x = lTail; x >= 0; x -= 2) { const q = at(x).p, sp = toScreen(q.x, q.y); pts.push(`${sp.x.toFixed(1)},${sp.y.toFixed(1)}`); }
  // out of the stomach end, up through the body toward the head and out of the frame
  for (const [x, y] of [[760, 190], [800, 196], [850, 214], [905, 238], [1000, 250], [1200, 250]] as [number, number][]) {
    const sp = toScreen(x, y); pts.push(`${sp.x.toFixed(1)},${sp.y.toFixed(1)}`);
  }
  const d = `M${pts.join('L')}`;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
      <path d={d} fill="none" stroke={C.tether[3]} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeDasharray="3 15" strokeDashoffset={(t * 26).toFixed(2)} strokeLinecap="round" opacity={0.75} />
    </g>
  );
};

export const PigScene: React.FC<{t: number}> = ({t}) => {
  const Z = zoomAt(t);
  // the frame transform: P0 sits at the cutaway's centre while zoomed in, drifts to its final place as Z -> 1
  const w = 1 - clamp(Math.log(Z) / Math.log(16));
  const cx = lerp(540, P0.x, ss(w, 0, 1)), cy = lerp(WIDE_CY, P0.y, ss(w, 0, 1));
  const ang = A0 * (1 - ss(w, 0.15, 0.85));
  const tf = `translate(${cx.toFixed(2)},${cy.toFixed(2)}) rotate(${ang.toFixed(3)}) scale(${Z.toFixed(4)}) translate(${(-P0.x).toFixed(2)},${(-P0.y).toFixed(2)})`;
  const breathe = 1 + 0.006 * Math.sin(t * 2.4);
  // after the reveal: push in on the route while the robot travels it, pull back as "6+ FEET" lands, then drift
  const follow = keyS(t, [[tZ1, 0], [13.25, 0], [14.35, 1], [tTr1 - 0.05, 1], [tFeet + 0.6, 0]]);
  // a slow, continuous drift through the whole beat (never a static hold); the push-in stays modest so the pig is never cropped
  const drift = 1 + 0.022 * Math.max(0, t - tZ1) + 0.05 * ss5(t, tFeet + 0.4, 16.9);
  const Z2 = (1 + 0.18 * follow) * drift;
  const FX = lerp(540, ROUTE_C.x, follow), FY = lerp(980, ROUTE_C.y, follow);
  const tf2 = `translate(${lerp(540, 540, follow).toFixed(2)},${lerp(980, 1010, follow).toFixed(2)}) scale(${Z2.toFixed(4)}) translate(${(-FX).toFixed(2)},${(-FY).toFixed(2)})`;
  const travel = ss5(t, tTr0, tTr1);
  const lNow = L_P0 + TRAVEL * travel;
  const g = at(lNow);
  const gs = toScreen(g.p.x, g.p.y);
  const tubeD = `M${PATH.map((p) => {
    const q = toScreen(p.x, p.y);
    return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;
  }).join('L')}`;
  const trail: string[] = [];
  for (let l = L_P0; l <= lNow; l += 3) {
    const q = at(l).p, s = toScreen(q.x, q.y);
    trail.push(`${s.x.toFixed(1)},${s.y.toFixed(1)}`);
  }
  const ticks = Array.from({length: 6}, (_, k) => L_P0 + (TRAVEL * (k + 1)) / 6.56); // one per foot (2 m = 6.56 ft)
  const feetPop = t - tFeet;
  const feetS = feetPop < 0 ? 0 : 1 + 0.28 * Math.exp(-feetPop / 0.12) * Math.cos(feetPop * 22);
  const pigA = ss(Z, 3.5, 1.4);
  const W = TUBE * PIG_S;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id="pbg" cx="50%" cy="52%" r="70%">
          <stop offset="0%" stopColor="#1A2C40" />
          <stop offset="100%" stopColor="#0A121D" />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#pbg)" />
      {/* faint lab-diagram grid */}
      <g opacity={0.35 * pigA}>
        {Array.from({length: 19}, (_, k) => <line key={`v${k}`} x1={k * 60} y1={0} x2={k * 60} y2={1920} stroke="#22384F" strokeWidth={1.5} />)}
        {Array.from({length: 33}, (_, k) => <line key={`h${k}`} x1={0} y1={k * 60} x2={1080} y2={k * 60} stroke="#22384F" strokeWidth={1.5} />)}
      </g>
      <g transform={tf}>
        <g transform={tf2}>
        <g transform={`translate(${540},${1000}) scale(${breathe}) translate(${-540},${-1000})`}>
          <Pig a={pigA} />
          {/* the coiled small intestine */}
          <path d={tubeD} fill="none" stroke={C.wall[1]} strokeWidth={W + 3.5} strokeLinejoin="round" strokeLinecap="round" />
          <path d={tubeD} fill="none" stroke={C.wall[3]} strokeWidth={W - 1.5} strokeLinejoin="round" strokeLinecap="round" />
          <path d={tubeD} fill="none" stroke={C.wall[5]} strokeWidth={W * 0.22} strokeLinejoin="round" strokeLinecap="round" opacity={0.55} transform="translate(-1.2,-2.2)" />
          {/* the travelled stretch */}
          {trail.length > 1 && (
            <>
              <path d={`M${trail.join('L')}`} fill="none" stroke={C.glow} strokeWidth={W * 0.95} strokeLinecap="round" strokeLinejoin="round" opacity={0.22} />
              <path d={`M${trail.join('L')}`} fill="none" stroke={C.glow} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {ticks.map((l, k) => {
            if (l > lNow) return null;
            const q = at(l), s = toScreen(q.p.x, q.p.y);
            const age = clamp((lNow - l) / 18);
            const nx = -q.t.y, ny = q.t.x;
            const h = W * 0.75 * (0.6 + 0.4 * age);
            return <line key={k} x1={s.x - nx * h} y1={s.y - ny * h} x2={s.x + nx * h} y2={s.y + ny * h} stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" opacity={0.9} />;
          })}
          <circle cx={gs.x} cy={gs.y} r={30} fill={C.glow} opacity={0.16 * clamp((t - tZ1 + 0.3) / 0.4)} />
          <circle cx={gs.x} cy={gs.y} r={19} fill={C.glow} opacity={0.22 * clamp((t - tZ1 + 0.3) / 0.4)} />
          <Tether lTail={lNow - (bodyLen(0.5) / 2) * (PX_PER_UNIT_Z1 / PIG_S)} t={t} />
          <RouteRobot lCentre={lNow} p={(Math.max(t, tTr0) - tTr0) * 2.2} />
        </g>
        </g>
      </g>
      {feetS > 0 && (
        <g transform={`translate(540,1480) scale(${feetS.toFixed(3)})`}>
          <CapText x={0} y={0} size={150} parts={[['6+', true], [' FEET', false]]} />
        </g>
      )}
    </svg>
  );
};

/** the pig, side view, facing right (local units) */
const Pig: React.FC<{a: number}> = ({a}) => {
  const body = 'M168,248 C196,118 380,92 560,106 C652,113 724,128 768,160 C826,168 884,206 906,246 C930,250 952,262 954,284 C955,306 940,320 914,320 C880,334 842,346 800,350 C770,380 742,400 718,410 C640,440 420,452 300,432 C222,418 164,362 160,302 Z';
  const legs = [[262, 404], [336, 412], [628, 410], [700, 402]];
  const T = (d: string) => <g transform={`translate(${PIG_X},${PIG_Y}) scale(${PIG_S})`}>{/* */}<path d={d} /></g>;
  void T;
  return (
    <g transform={`translate(${PIG_X},${PIG_Y}) scale(${PIG_S})`} opacity={a}>
      {legs.map(([x, y], k) => (
        <rect key={k} x={x - 24} y={y - 30} width={48} height={150 - (k % 2) * 8} rx={20} fill={k % 2 ? '#43213A' : '#3B1C33'} stroke="#F3B3AE" strokeWidth={4} />
      ))}
      <path d={body} fill={C.cavity} stroke="#F3B3AE" strokeWidth={4.5} strokeLinejoin="round" />
      {/* ear, eye, nostrils, tail */}
      <path d="M752,150 C770,98 800,84 826,92 C826,128 812,160 790,176 Z" fill="#4A2440" stroke="#F3B3AE" strokeWidth={4} strokeLinejoin="round" />
      <circle cx={852} cy={232} r={7.5} fill="#F7D3CF" />
      <ellipse cx={938} cy={276} rx={4} ry={7} fill="#F3B3AE" opacity={0.8} />
      <ellipse cx={938} cy={298} rx={4} ry={7} fill="#F3B3AE" opacity={0.8} />
      <path d="M166,262 C140,250 128,226 140,212 C152,198 172,210 160,224 C150,236 128,232 118,222" fill="none" stroke="#F3B3AE" strokeWidth={4.5} strokeLinecap="round" />
      {/* the abdomen, where the gut sits */}
      <path d="M300,232 C420,200 640,204 760,236 C780,300 760,400 700,414 C560,436 400,436 300,420 C262,380 262,280 300,232 Z" fill="#2A0F22" opacity={0.85} />
    </g>
  );
};

/** film times at which the robot passes each foot tick (for the sound) */
export const tickTimes = () => Array.from({length: 6}, (_, k) => {
  const target = (k + 1) / 6.15;
  let a = tTr0, b = tTr1;
  for (let i = 0; i < 40; i++) {
    const m = (a + b) / 2;
    if (ss5(m, tTr0, tTr1) < target) a = m; else b = m;
  }
  return (a + b) / 2;
});
export const PIG_T = {zoom0: tZ0, zoom1: tZ1, pig: tPig, travel0: tTr0, travel1: tTr1, feet: tFeet};
