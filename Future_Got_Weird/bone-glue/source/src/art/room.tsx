// The room: a quiet, dark operating-room backdrop seen past the hand table, the hand table itself and the drape fold
// over the patient's forearm. All in wrist-plane millimetres (anatomy.ts). Deterministic, no text or glyphs.
//
//   RoomBack      far layer (z about +600): floor and wall in dark teal-grey, the overhead lamp's warm pool, two soft
//                 out-of-focus shapes. Covers +-20 m so no edge can ever show.
//   HandTable     the table plane under the patient's arm (z about +40):
//                 'drape'    the sterile drape over the table, folded and lying flat round a padded arm board (about
//                            150 mm wide, lighter than the drape, its rounded edges standing up off the cloth) that runs
//                            from below the frame to past the fingertips; the forearm and hand lie on the board with a
//                            tight contact shadow and a soft cast shadow;
//                 'followup' months later: a clinic exam table in muted teal vinyl with a strip of white exam paper
//                            under the forearm and hand (its torn top edge, side edges and soft crinkles visible).
//   DrapeOverArm  a sterile stockinette sleeve lying flat over the forearm low in the frame (from about y = +150 down),
//                 its rolled cuff round the arm: draw it ABOVE the arm (skin layer).
//
// Ink contours are constant on-screen width (non-scaling strokes): 2.8 px showing, as the skin and the instruments.
import React from 'react';
import {C, INK} from './palette';
import {mix, lit, shade} from '../core/color';
import {FINGERS, THUMB, fingerChain, skinBorders, thumbChain} from './anatomy';
import {P, pt, open, closed, add, lerpP} from '../core/geo';
import {noise1} from '../lib';

const f = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(2));
const NS = 'non-scaling-stroke' as const;
/** an ink contour drawn on top of a fill (non-scaling, 2.8 px) */
const INK_PX = 2.8;

// ------------------------------------------------------------------------------------------------ room
export const RoomBack: React.FC<{id: string; t: number}> = ({id, t}) => {
  // a slow breath in the lamp's pool (barely perceptible), deterministic in t
  const br = 1 + 0.025 * noise1(t * 0.35, 3);
  const BIG = 20000;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fl`} gradientUnits="userSpaceOnUse" x1="0" y1="-1400" x2="0" y2="1400">
          <stop offset="0" stopColor={mix(C.roomLit, C.room, 0.25)} />
          <stop offset="0.38" stopColor={C.roomLit} />
          <stop offset="0.62" stopColor={mix(C.room, C.roomLit, 0.35)} />
          <stop offset="1" stopColor={shade(C.room, 0.35)} />
        </linearGradient>
        <radialGradient id={`${id}-lp`} gradientUnits="userSpaceOnUse" cx="60" cy="-120" r={f(900 * br)}>
          <stop offset="0" stopColor={C.lamp} stopOpacity={0.3} />
          <stop offset="0.35" stopColor={C.lamp} stopOpacity={0.14} />
          <stop offset="0.7" stopColor={C.lamp} stopOpacity={0.04} />
          <stop offset="1" stopColor={C.lamp} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-vg`} gradientUnits="userSpaceOnUse" cx="60" cy="-100" r="2600">
          <stop offset="0.35" stopColor="#081218" stopOpacity={0} />
          <stop offset="1" stopColor="#081218" stopOpacity={0.6} />
        </radialGradient>
        <radialGradient id={`${id}-sp`} gradientUnits="userSpaceOnUse" cx="-520" cy="-1150" r="260">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset="0.3" stopColor={C.lamp} stopOpacity={0.28} />
          <stop offset="1" stopColor={C.lamp} stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}-bl`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="40" />
        </filter>
      </defs>
      {/* floor below, the far wall above (the band where they meet is lit by the lamp) */}
      <rect x={-BIG} y={-BIG} width={BIG * 2} height={BIG * 2} fill={shade(C.room, 0.35)} />
      <rect x={-BIG} y={-1400} width={BIG * 2} height={2800} fill={`url(#${id}-fl)`} />
      <rect x={-BIG} y={-BIG} width={BIG * 2} height={BIG - 1400} fill={mix(C.roomLit, C.room, 0.25)} />
      {/* soft out-of-focus shapes: an equipment cart's dark mass on the left, a skirting line on the far wall */}
      <g filter={`url(#${id}-bl)`}>
        <rect x={-1500} y={-1240} width={BIG} height={60} fill={shade(C.room, 0.25)} opacity={0.7} />
        <rect x={-1150} y={-900} width={420} height={700} rx={60} fill={shade(C.room, 0.45)} opacity={0.75} />
        <rect x={-1110} y={-860} width={340} height={70} rx={30} fill={C.roomLit} opacity={0.5} />
        <ellipse cx={980} cy={-700} rx={260} ry={420} fill={shade(C.room, 0.3)} opacity={0.6} />
      </g>
      {/* the lamp's warm pool and its far reflection */}
      <rect x={-BIG} y={-BIG} width={BIG * 2} height={BIG * 2} fill={`url(#${id}-lp)`} />
      <ellipse cx="-520" cy="-1150" rx="300" ry="200" fill={`url(#${id}-sp)`} />
      <rect x={-BIG} y={-BIG} width={BIG * 2} height={BIG * 2} fill={`url(#${id}-vg)`} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ shared bits
const blurF = (id: string, sd: number) => (
  <filter id={id} x="-25%" y="-25%" width="150%" height="150%">
    <feGaussianBlur stdDeviation={f(sd)} />
  </filter>
);
/** The patient's forearm, palm and digits as one silhouette on the table, for its shadow (curl about the film's 0.25) */
const handSilhouette = (curl = 0.28): {body: string; digits: {ps: P[]; w: number}[]} => {
  const L: P[] = [], R: P[] = [];
  for (let y = 1300; y >= -142; y -= 20) {
    const [l, r] = skinBorders(y);
    L.push(pt(l, y));
    R.push(pt(r, y));
  }
  const body = closed([...R, ...[...L].reverse()], 0.6);
  const digits = FINGERS.map((d) => ({ps: [d.base, ...fingerChain(d, curl)], w: d.w * 0.95}));
  digits.push({ps: [THUMB.base, ...thumbChain(0.2)], w: THUMB.w});
  return {body, digits};
};
/** The arm's shadow on the surface under it, light from the upper left: a tight dark contact core hugging the
 *  silhouette and a soft cast shadow falling down-right. */
const ArmShadow: React.FC<{id: string; core: number; soft: number; color: string; blurK?: number; bend?: number}> = ({id, core, soft, color, blurK = 1, bend = 0}) => {
  const s = handSilhouette();
  const digits = (grow: number) => s.digits.map((dg, i) => (
    <path key={i} d={open(dg.ps, 0.8)} fill="none" stroke={color} strokeWidth={f(dg.w * 2 + grow * 2)} strokeLinecap="round" strokeLinejoin="round" />
  ));
  // when the wrist bends the hand's part of the shadow turns with it about the wrist (the blur hides the join)
  const rot = `rotate(${f((bend * 180) / Math.PI)} -4 -42)`;
  const shape = (dx: number, dy: number, grow: number) => (
    <g transform={`translate(${f(dx)} ${f(dy)})`}>
      {Math.abs(bend) < 1e-5 ? (
        <>
          <path d={s.body} fill={color} stroke={color} strokeWidth={f(grow * 2)} strokeLinejoin="round" />
          {digits(grow)}
        </>
      ) : (
        <>
          <g clipPath={`url(#${id}-fc)`}><path d={s.body} fill={color} stroke={color} strokeWidth={f(grow * 2)} strokeLinejoin="round" /></g>
          <g transform={rot}>
            <g clipPath={`url(#${id}-hc)`}><path d={s.body} fill={color} stroke={color} strokeWidth={f(grow * 2)} strokeLinejoin="round" /></g>
            {digits(grow)}
          </g>
        </>
      )}
    </g>
  );
  return (
    <g>
      <defs>
        {blurF(`${id}-s`, 7 * blurK)}
        {blurF(`${id}-c`, 2.2 * blurK)}
        <clipPath id={`${id}-fc`}><rect x={-400} y={-42} width={800} height={1600} /></clipPath>
        <clipPath id={`${id}-hc`}><rect x={-400} y={-600} width={800} height={558} /></clipPath>
      </defs>
      <g filter={`url(#${id}-s)`} opacity={soft}>
        {shape(8, 10, 2)}
      </g>
      <g filter={`url(#${id}-c)`} opacity={core}>
        {shape(2.2, 2.8, 0.5)}
      </g>
    </g>
  );
};

/** soft cloth folds: a lit ridge with a shadowed trough beside it, blurred */
const Folds: React.FC<{id: string; folds: P[][]; lit: string; deep: string; blur: number; a?: number; w?: number}> = ({id, folds, lit: litC, deep, blur, a = 1, w = 1}) => (
  <g>
    <defs>{blurF(`${id}-f`, blur)}</defs>
    <g filter={`url(#${id}-f)`} opacity={a}>
      {folds.map((ps, i) => (
        <g key={i}>
          <path d={open(ps.map((p) => pt(p.x + 6 * w, p.y + 5 * w)), 1)} fill="none" stroke={deep} strokeWidth={f(20 * w)} strokeLinecap="round" opacity={0.7} />
          <path d={open(ps, 1)} fill="none" stroke={litC} strokeWidth={f(15 * w)} strokeLinecap="round" opacity={0.7} />
        </g>
      ))}
    </g>
  </g>
);

// ------------------------------------------------------------------------------------------------ hand table
/** the padded arm board under the forearm and hand (wrist-plane mm) */
export const BOARD = {x0: -80, x1: 72, y0: -292, y1: 1500, r: 46};
/** the exam paper strip at the follow-up (slightly skewed on the table) */
const PAPER = {x0: -84, x1: 70, y0: -268, skew: 0.025};

export const HandTable: React.FC<{id: string; variant: 'drape' | 'followup'; bend?: number}> = ({id, variant, bend}) => (variant === 'followup' ? <FollowupTable id={id} bend={bend} /> : <DrapedTable id={id} />);

const DrapedTable: React.FC<{id: string}> = ({id}) => {
  const B = BOARD;
  // the board seen from the high three-quarter camera: a touch narrower at its far end (beyond the fingertips) than
  // under the forearm, so it reads as a flat surface running away from the lens
  const bx = (y: number, side: 0 | 1) => {
    const u = Math.min(1, Math.max(0, (y - B.y0) / 760));
    const w0 = side ? B.x1 : B.x0;
    return w0 + (side ? -1 : 1) * 12 * (1 - u) ** 1.2;
  };
  const outline: P[] = [];
  const steps = 8;
  // left edge up, the rounded far end, right edge down
  for (let y = B.y1; y >= B.y0 + B.r; y -= 100) outline.push(pt(bx(y, 0), y));
  const cxL = bx(B.y0 + B.r, 0) + B.r, cxR = bx(B.y0 + B.r, 1) - B.r, cy = B.y0 + B.r;
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI + (Math.PI / 2) * (i / steps);
    outline.push(pt(cxL + B.r * Math.cos(a), cy + B.r * Math.sin(a)));
  }
  for (let i = 0; i <= steps; i++) {
    const a = (3 * Math.PI) / 2 + (Math.PI / 2) * (i / steps);
    outline.push(pt(cxR + B.r * Math.cos(a), cy + B.r * Math.sin(a)));
  }
  for (let y = B.y0 + B.r + 100; y <= B.y1; y += 100) outline.push(pt(bx(y, 1), y));
  const boardD = `M${outline.map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}Z`;
  // the drape lying on the table round the board: long folds running away from the board's edges and past its end
  const folds: P[][] = [
    [pt(-104, -250), pt(-150, -120), pt(-170, 60), pt(-160, 300)],
    [pt(-98, 120), pt(-150, 260), pt(-230, 420), pt(-300, 640)],
    [pt(-120, -330), pt(-220, -410), pt(-360, -470)],
    [pt(-30, -320), pt(-50, -420), pt(-120, -560)],
    [pt(70, -330), pt(120, -440), pt(190, -560)],
    [pt(96, -200), pt(150, -110), pt(190, 40), pt(220, 220)],
    [pt(92, 160), pt(150, 300), pt(200, 470)],
    [pt(-300, -200), pt(-360, 0), pt(-380, 200)],
    [pt(260, -300), pt(320, -120), pt(360, 80)],
  ];
  // creases where the cloth breaks over the board's edge
  const edgeCreases: P[][] = [
    [pt(B.x0 - 2, -180), pt(B.x0 - 14, -150), pt(B.x0 - 30, -132)],
    [pt(B.x0 - 2, 40), pt(B.x0 - 16, 64), pt(B.x0 - 36, 80)],
    [pt(B.x1 + 2, -120), pt(B.x1 + 16, -96), pt(B.x1 + 34, -84)],
    [pt(B.x1 + 2, 90), pt(B.x1 + 14, 118), pt(B.x1 + 32, 134)],
    [pt(-40, B.y0 - 2), pt(-52, B.y0 - 18), pt(-70, B.y0 - 30)],
    [pt(30, B.y0 - 2), pt(42, B.y0 - 18), pt(58, B.y0 - 32)],
  ];
  // shallow wrinkles across the board where the drape is pulled over the pad: they lie in the plane, so they crowd
  // together toward the far end
  const wrinkles: P[][] = [290, 150, 30, -75, -165, -238].flatMap((y, i) => {
    const l = bx(y, 0) + 3, r = bx(y, 1) - 3;
    const a = 4 + 2 * (i % 2);
    return [
      [pt(l, y + a), pt(l + 18, y - 1), pt(l + 34, y + 2)],
      [pt(r, y + a - 2), pt(r - 16, y - 3), pt(r - 32, y + 1)],
    ];
  });
  const boardCol = mix(C.drapeLit, '#5D8DB5', 0.3);
  /** the board's side as the high camera (to its right) sees it: a band 9 mm to the right and 8 mm down */
  const EX = pt(9, 8);
  const sideCol = mix(C.drape, C.drapeDeep, 0.35);
  const boardLit = lit(boardCol, 0.14);
  const boardDeep = mix(boardCol, C.drapeDeep, 0.55);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-dr`} gradientUnits="userSpaceOnUse" cx="20" cy="-60" r="900" fx="-40" fy="-140">
          <stop offset="0" stopColor={mix(C.drape, C.drapeLit, 0.45)} />
          <stop offset="0.4" stopColor={C.drape} />
          <stop offset="0.75" stopColor={mix(C.drape, C.drapeDeep, 0.6)} />
          <stop offset="1" stopColor={C.drapeDeep} />
        </radialGradient>
        <linearGradient id={`${id}-bd`} gradientUnits="userSpaceOnUse" x1="-60" y1="-300" x2="80" y2="500">
          <stop offset="0" stopColor={boardLit} />
          <stop offset="0.5" stopColor={boardCol} />
          <stop offset="1" stopColor={mix(boardCol, C.drape, 0.5)} />
        </linearGradient>
        {blurF(`${id}-bs`, 8)}
        {blurF(`${id}-bb`, 2.5)}
        <clipPath id={`${id}-bc`}>
          <path d={boardD} />
        </clipPath>
      </defs>
      {/* the draped table round the board */}
      <rect x={-3000} y={-3000} width={6000} height={6000} fill={C.drapeDeep} />
      <rect x={-1200} y={-1200} width={2400} height={2700} fill={`url(#${id}-dr)`} />
      <Folds id={`${id}-fo`} folds={folds} lit={lit(C.drapeLit, 0.04)} deep={shade(C.drapeDeep, 0.15)} blur={10} a={0.5} w={1.4} />
      {/* the board's cast shadow on the lower cloth (down-right) */}
      <path d={boardD} fill="#050E16" opacity={0.7} filter={`url(#${id}-bs)`} transform="translate(22 24)" />
      <Folds id={`${id}-ec`} folds={edgeCreases.map((ps) => ps.map((p) => pt(p.x + (p.x > 0 ? EX.x : 0), p.y + EX.y)))} lit={mix(C.drapeLit, C.drape, 0.2)} deep={shade(C.drapeDeep, 0.25)} blur={3} a={0.6} w={0.5} />
      {/* the board's thickness: its right side and near end face the camera (which looks from the near right), the
          drape pulled down over them in shadow */}
      {[0.2, 0.4, 0.6, 0.8, 1].map((t) => (
        <path key={t} d={boardD} fill={sideCol} transform={`translate(${f(EX.x * t)} ${f(EX.y * t)})`} />
      ))}
      <path d={boardD} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" opacity={0.85} transform={`translate(${f(EX.x)} ${f(EX.y)})`} />
      <path d={boardD} fill="none" stroke={lit(sideCol, 0.25)} strokeWidth={2.5} opacity={0.5} transform={`translate(${f(EX.x * 0.45)} ${f(EX.y * 0.45)})`} />
      {/* the padded board: the drape pulled taut over it, a matte cloth top; its rounded edges turn light on the upper
          left and into shadow on the lower right */}
      <path d={boardD} fill={`url(#${id}-bd)`} />
      <g clipPath={`url(#${id}-bc)`}>
        <path d={boardD} fill="none" stroke={boardDeep} strokeWidth={14} transform="translate(-4 -5)" opacity={0.9} filter={`url(#${id}-bb)`} />
        <path d={boardD} fill="none" stroke={lit(boardCol, 0.3)} strokeWidth={9} transform="translate(4 4)" opacity={0.55} filter={`url(#${id}-bb)`} />
        <path d={boardD} fill="none" stroke={boardCol} strokeWidth={6} transform="translate(4 4)" />
        {wrinkles.map((ps, i) => (
          <g key={i} filter={`url(#${id}-bb)`}>
            <path d={open(ps.map((p) => pt(p.x + 1.5, p.y + 2.5)), 1)} fill="none" stroke={boardDeep} strokeWidth={3.5} strokeLinecap="round" opacity={0.55} />
            <path d={open(ps, 1)} fill="none" stroke={lit(boardCol, 0.25)} strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
          </g>
        ))}
        {/* the forearm and hand lying on the board */}
        <ArmShadow id={`${id}-as`} core={0.6} soft={0.42} color="#08131D" />
      </g>
      <path d={boardD} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" opacity={0.85} />
    </g>
  );
};

const FollowupTable: React.FC<{id: string; bend?: number}> = ({id, bend = 0}) => {
  const vinyl = '#4F8E98';
  const vinylLit = lit(vinyl, 0.22);
  const vinylDeep = shade(vinyl, 0.35);
  // the paper strip: gently skewed, its side edges wavering a little, a torn top edge past the fingertips
  const Pp = PAPER;
  const edge = (x: number, side: number): P[] => {
    const ps: P[] = [];
    for (let y = 1500; y >= Pp.y0; y -= 60) ps.push(pt(x + Pp.skew * (y + 100) + 1.4 * noise1(y * 0.012, side ? 3 : 7), y));
    return ps;
  };
  const Lp = edge(Pp.x0, 0);
  const Rp = edge(Pp.x1, 1);
  // the torn top: a fine zigzag between the two top corners
  const tl = Lp[Lp.length - 1], tr = Rp[Rp.length - 1];
  const torn: P[] = [];
  const nT = 26;
  for (let i = 0; i <= nT; i++) {
    const p = lerpP(tl, tr, i / nT);
    torn.push(pt(p.x, p.y + (i % 2 ? -1.6 : 1.2) + 1.2 * noise1(i * 0.7, 5)));
  }
  const paperD = `M${Lp.map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}L${torn.map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}L${[...Rp].reverse().map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}Z`;
  // soft crinkles: a lit ridge and a cool crease, short and gently curved, mostly beside the arm where they show
  const crinkles: P[][] = [
    [pt(-74, -200), pt(-62, -170), pt(-60, -130)],
    [pt(46, -250), pt(56, -214), pt(62, -180)],
    [pt(-70, -40), pt(-58, -4), pt(-62, 40)],
    [pt(50, 10), pt(58, 46), pt(54, 90)],
    [pt(-66, 110), pt(-56, 140), pt(-48, 180)],
    [pt(-30, -262), pt(-10, -250), pt(14, -256)],
  ];
  const sag = [pt(-6, -250), pt(-2, 0), pt(-8, 400)];
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-vy`} gradientUnits="userSpaceOnUse" x1="-400" y1="-500" x2="400" y2="500">
          <stop offset="0" stopColor={vinylLit} />
          <stop offset="0.45" stopColor={vinyl} />
          <stop offset="1" stopColor={mix(vinyl, vinylDeep, 0.6)} />
        </linearGradient>
        <linearGradient id={`${id}-pp`} gradientUnits="userSpaceOnUse" x1="-120" y1="-300" x2="120" y2="300">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#F3F6F8" />
          <stop offset="1" stopColor="#DCE4EA" />
        </linearGradient>
        {blurF(`${id}-ps`, 5)}
        {blurF(`${id}-cr`, 1.6)}
        {blurF(`${id}-sh`, 30)}
        <clipPath id={`${id}-pc`}>
          <path d={paperD} />
        </clipPath>
      </defs>
      {/* the vinyl top: a broad soft sheen and the stitched welt of a cushion seam beyond the hand */}
      <rect x={-3000} y={-3000} width={6000} height={6000} fill={`url(#${id}-vy)`} />
      <ellipse cx="-180" cy="-260" rx="160" ry="420" fill="#FFFFFF" opacity={0.12} filter={`url(#${id}-sh)`} />
      <path d="M-3000 -330 L3000 -342" stroke={vinylDeep} strokeWidth={5} opacity={0.5} />
      <path d="M-3000 -326 L3000 -338" stroke={vinylLit} strokeWidth={2} opacity={0.55} />
      {/* the paper's soft shadow on the vinyl, the paper, a long sag down its middle, crinkles, the edges */}
      <path d={paperD} fill="#173A40" opacity={0.35} filter={`url(#${id}-ps)`} transform="translate(4 5)" />
      <path d={paperD} fill={`url(#${id}-pp)`} />
      <g clipPath={`url(#${id}-pc)`}>
        <path d={open(sag, 1)} fill="none" stroke="#C9D5DF" strokeWidth={22} opacity={0.35} filter={`url(#${id}-ps)`} />
        <g filter={`url(#${id}-cr)`}>
          {crinkles.map((ps, i) => (
            <g key={i}>
              <path d={open(ps.map((p) => pt(p.x + 2.2, p.y + 1.6)), 1)} fill="none" stroke="#AFC0CE" strokeWidth={3.2} strokeLinecap="round" opacity={0.75} />
              <path d={open(ps, 1)} fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" opacity={0.9} />
            </g>
          ))}
        </g>
        <ArmShadow id={`${id}-as`} core={0.32} soft={0.26} color="#3D5566" bend={bend} />
      </g>
      <path d={paperD} fill="none" stroke={INK} strokeWidth={INK_PX * 0.8} vectorEffect={NS} strokeLinejoin="round" opacity={0.7} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ drape over the arm
/** A sterile stockinette sleeve over the forearm, lying flat on the board low in the frame: its rolled cuff wraps the
 *  forearm at about y = +150 (an elliptical roll, seen from the high three-quarter camera), its sides follow the
 *  forearm's edges down out of the frame. Draw it above the arm (the skin layer). */
export const DrapeOverArm: React.FC<{id: string}> = ({id}) => {
  const y0 = 152;
  const side = (y: number): [number, number] => {
    const [l, r] = skinBorders(y);
    const g = 5 + 3 * Math.min(1, (y - y0) / 120);
    return [l - g, r + g];
  };
  const L: P[] = [], R: P[] = [];
  for (let y = y0; y <= 1400; y += 40) {
    const [l, r] = side(y);
    L.push(pt(l + 1.4 * noise1(y * 0.02, 2), y));
    R.push(pt(r + 1.4 * noise1(y * 0.02, 5), y));
  }
  const [cl, cr] = side(y0);
  const cx = (cl + cr) / 2, hw = (cr - cl) / 2;
  // the cuff's roll: a band across the arm whose upper edge bows up over the forearm's top (it wraps round the arm)
  const rollTop: P[] = [], rollBot: P[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI * (i / 16);
    rollTop.push(pt(cx - hw * Math.cos(a), y0 - 4.5 * Math.sin(a)));
    rollBot.push(pt(cx - hw * Math.cos(a), y0 + 9 + 3.5 * Math.sin(a)));
  }
  const bodyD = `M${L.map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}L${[...R].reverse().map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}Z`;
  const rollD = `M${rollTop.map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}L${[...rollBot].reverse().map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}Z`;
  // the knit bunches in soft rings round the arm below the cuff (shallow arcs across it), and one long fold
  const rings: P[][] = [26, 58, 96, 150].map((dy, i) => {
    const ps: P[] = [];
    const [l, r] = side(y0 + dy);
    for (let k = 0; k <= 8; k++) {
      const u = k / 8;
      ps.push(pt(l + (r - l) * (0.08 + 0.84 * u), y0 + dy - 4 * Math.sin(Math.PI * u) + 2 * Math.sin(i * 2.1 + u * 5)));
    }
    return ps;
  });
  const col = mix(C.drape, C.drapeLit, 0.75);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={f(cl)} y1="0" x2={f(cr)} y2="0">
          <stop offset="0" stopColor={lit(col, 0.16)} />
          <stop offset="0.45" stopColor={col} />
          <stop offset="1" stopColor={mix(col, C.drapeDeep, 0.4)} />
        </linearGradient>
        <linearGradient id={`${id}-r`} gradientUnits="userSpaceOnUse" x1="0" y1={f(y0 - 5)} x2="0" y2={f(y0 + 13)}>
          <stop offset="0" stopColor={lit(col, 0.3)} />
          <stop offset="0.55" stopColor={lit(col, 0.1)} />
          <stop offset="1" stopColor={shade(col, 0.18)} />
        </linearGradient>
        {blurF(`${id}-f`, 2.5)}
        <clipPath id={`${id}-c`}>
          <path d={bodyD} />
        </clipPath>
      </defs>
      {/* the skin's shade just above the cuff */}
      <path d={open(rollTop, 1)} fill="none" stroke="#3A1F14" strokeWidth={7} opacity={0.22} filter={`url(#${id}-f)`} transform="translate(0 -3)" />
      <path d={bodyD} fill={`url(#${id}-g)`} />
      <g clipPath={`url(#${id}-c)`}>
        {rings.map((ps, i) => (
          <g key={i} filter={`url(#${id}-f)`}>
            <path d={open(ps.map((p) => pt(p.x, p.y + 3)), 1)} fill="none" stroke={C.drapeDeep} strokeWidth={4} strokeLinecap="round" opacity={0.45} />
            <path d={open(ps, 1)} fill="none" stroke={lit(col, 0.32)} strokeWidth={2.6} strokeLinecap="round" opacity={0.55} />
          </g>
        ))}
        {/* under the rolled cuff, the sleeve's shadow */}
        <path d={open(rollBot.map((p) => pt(p.x, p.y + 4)), 1)} fill="none" stroke={C.drapeDeep} strokeWidth={7} opacity={0.45} filter={`url(#${id}-f)`} />
      </g>
      <path d={bodyD} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />
      {/* the rolled cuff */}
      <path d={rollD} fill={`url(#${id}-r)`} />
      <path d={rollD} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />
      <path d={open(rollTop.map((p) => add(p, pt(0, 2.4))).slice(2, 15), 1)} fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" opacity={0.4} />
    </g>
  );
};
