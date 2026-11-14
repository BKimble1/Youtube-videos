// S4: the real experiment. The cutaway pulls straight back until the 3D tunnel is a thin tube, and hands over (same
// place, width and angle) to a clean diagram: a pig in side view with its small intestine drawn as a coiled tube. The
// robot (a 2D glyph with the same colours and body plan) then travels a highlighted stretch, leaving a trail with one
// tick per foot, and "6+ FEET" lands on "FEET". The animal-study context is explicit (the pig, and a small tag).
import React from 'react';
import {C, INK} from '../art/palette';
import {clamp, lerp, ss, ss5, word} from '../lib';
import {heading} from '../world/path';
import {trackS} from '../world/frames';
import {crawl, extLen, LEN, R_ANCHOR_MAX} from '../robot/state';
import {CapText} from './CapText';
import {WIDE_CY, WIDE_PX} from './inside';

// ---------------------------------------------------------------- layout (pig-local units, placed by PIG_TF)
const PIG_S = 0.98, PIG_X = 50, PIG_Y = 690;
export const toScreen = (x: number, y: number) => ({x: x * PIG_S + PIG_X, y: y * PIG_S + PIG_Y});
const TUBE = 15.5 / PIG_S; // tube width (local) -> 15.5 px on screen at zoom 1
export const PX_PER_UNIT_Z1 = 15.5 / 5.14; // the 3D tunnel's outer diameter (5.14 units) maps to the tube width

// the coiled small intestine: a serpentine of rows joined by half-turns, entered from the stomach side
const ROWS = [258, 292, 326, 360, 394];
const XL = 318, XR = 692, RT = (ROWS[1] - ROWS[0]) / 2;
type Pt = {x: number; y: number};
const PATH: Pt[] = (() => {
  const pts: Pt[] = [];
  // entry from the stomach (upper right)
  for (let k = 0; k <= 20; k++) {
    const u = k / 20;
    pts.push({x: 742 - 50 * u, y: 214 + (ROWS[0] - 214) * ss(u, 0, 1)});
  }
  for (let r = 0; r < ROWS.length; r++) {
    const leftward = r % 2 === 0;
    const y = ROWS[r];
    for (let k = 1; k <= 40; k++) {
      const u = k / 40;
      const x = leftward ? lerp(XR, XL, u) : lerp(XL, XR, u);
      pts.push({x, y: y + 3.2 * Math.sin(u * Math.PI * 3 + r) * Math.sin(u * Math.PI)});
    }
    if (r === ROWS.length - 1) break;
    // half-turn to the next row (left turns after leftward rows, right turns after rightward rows)
    const cx = leftward ? XL : XR, cy = y + RT;
    for (let k = 1; k <= 16; k++) {
      const a = (k / 16) * Math.PI;
      pts.push(leftward ? {x: cx - RT * Math.sin(a), y: cy - RT * Math.cos(a)} : {x: cx + RT * Math.sin(a), y: cy - RT * Math.cos(a)});
    }
  }
  // on toward the large bowel (lower left)
  const last = pts[pts.length - 1];
  for (let k = 1; k <= 12; k++) pts.push({x: last.x + 8 * k, y: last.y + 2.2 * k * k * 0.1});
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
  let best = 0, bx = 1e9;
  for (let i = 0; i < PATH.length; i++) {
    if (ARC[i] < 300 || ARC[i] > 520) continue;
    if (PATH[i].x < bx) { bx = PATH[i].x; best = ARC[i]; }
  }
  return best;
})();
export const P0 = toScreen(at(L_P0).p.x, at(L_P0).p.y);
/** the travelled stretch: "over six feet" (local path length) */
const TRAVEL = 640;

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

const Glyph: React.FC<{t: number; scale: number}> = ({t, scale}) => {
  // a time-lapse inchworm (same body plan and colours as the 3D robot); draws along local +y
  const st = crawl(4.3 + ((t * 2.2) % 5.4));
  const u = (n: number) => n * PX_PER_UNIT_Z1 * scale;
  const ext = extLen(st.e);
  const segs: [number, number, string, number][] = [];
  let y = 0;
  const total = LEN.tailCap + 2 * LEN.anchor + 2 * LEN.collar + ext + LEN.headCap;
  y = -total / 2;
  segs.push([y, LEN.tailCap, C.cap[3], 0.85]); y += LEN.tailCap;
  segs.push([y, LEN.anchor, C.sleeve[3], 1.02 + (R_ANCHOR_MAX - 1.02) * st.aT]); y += LEN.anchor;
  segs.push([y, LEN.collar, C.cap[3], 1.03]); y += LEN.collar;
  segs.push([y, ext, C.body[3], 0.98]); y += ext;
  segs.push([y, LEN.collar, C.cap[3], 1.03]); y += LEN.collar;
  segs.push([y, LEN.anchor, C.sleeve[3], 1.02 + (R_ANCHOR_MAX - 1.02) * st.aH]); y += LEN.anchor;
  segs.push([y, LEN.headCap, C.cap[3], 0.85]);
  return (
    <g>
      {segs.map(([y0, len, col, r], k) => (
        <rect key={k} x={-u(r)} y={u(y0)} width={u(2 * r)} height={u(len) + 0.4} rx={u(Math.min(r, len / 2) * (k === 0 || k === 6 ? 1 : 0.45))} fill={col} stroke={INK} strokeWidth={Math.max(0.6, u(0.12))} />
      ))}
      <rect x={-u(0.3)} y={u(-total / 2) - u(30)} width={u(0.6)} height={u(30)} fill={C.tether[2]} stroke={INK} strokeWidth={Math.max(0.5, u(0.08))} />
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
  const breathe = (1 + 0.008 * Math.sin(t * 2.4)) * (1 + 0.07 * ss5(t, tZ1, 16.8));
  const travel = ss5(t, tTr0, tTr1);
  const lNow = L_P0 + TRAVEL * travel;
  const g = at(lNow);
  const gs = toScreen(g.p.x, g.p.y);
  const gAng = (Math.atan2(g.t.y, g.t.x) * 180) / Math.PI - 90;
  const tubeD = `M${PATH.map((p) => {
    const q = toScreen(p.x, p.y);
    return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;
  }).join('L')}`;
  const trail: string[] = [];
  for (let l = L_P0; l <= lNow; l += 3) {
    const q = at(l).p, s = toScreen(q.x, q.y);
    trail.push(`${s.x.toFixed(1)},${s.y.toFixed(1)}`);
  }
  const ticks = Array.from({length: 6}, (_, k) => L_P0 + (TRAVEL * (k + 1)) / 6.15);
  const tagA = ss(t, tPig - 0.15, tPig + 0.25);
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
          <g transform={`translate(${gs.x.toFixed(2)},${gs.y.toFixed(2)}) rotate(${gAng.toFixed(2)})`}>
            <Glyph t={t} scale={1} />
          </g>
        </g>
      </g>
      {/* the study tag */}
      <g opacity={tagA * pigA} transform={`translate(540,${612 - 10 * (1 - tagA)})`}>
        <rect x={-210} y={-30} width={420} height={60} rx={30} fill="#0E1A27" stroke="#F3B3AE" strokeWidth={3} />
        <text x={0} y={12} textAnchor="middle" fontFamily='"Nunito Variable", Nunito, sans-serif' fontWeight={800} fontSize={33} letterSpacing="0.08em" fill="#F7D3CF">PIG STUDY · MIT 2026</text>
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
