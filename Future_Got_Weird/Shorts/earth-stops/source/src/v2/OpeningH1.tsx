import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {CAP_FONT, HED_FONT} from '../fonts4';
import {E, kf} from '../lib/motion';
import {Hed} from '../opening/type';
import {SceneH} from './SceneH';
import {GlobeH, SPIN, surfaceAngle} from './GlobeH';
import {GSY, LAMPS} from './choreo2';
import {CHIP, EAST_F, GLOBE_FULL, GLOBE_STOP, INSET, MPH_F, NUM_A, NUM_B, RW0, RW1, RWK, bikeXH, panelP, sceneFor, toScreenFor, zoomFor} from './choreoH';

export type HookH1Props = {marker?: boolean; captions?: boolean; graphics?: boolean};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const pop = (f: number, a: number, dur = 5) => (f < a ? 0 : Math.min(1, (f - a) / dur));
const popScale = (f: number, a: number) => { const t = pop(f, a, 6); return t <= 0 ? 0 : 1 + 0.12 * Math.sin(t * Math.PI) * (1 - t) * 3 - (1 - E.out(t)) * 0.2; };

/* ------------------------------------------------------------------ small graphics */
const ArrowShape: React.FC<{x: number; y: number; w: number; fill?: string}> = ({x, y, w, fill = C.coral}) => {
  const k = w / 100;
  return <path transform={`translate(${x} ${y}) scale(${k})`} d="M -50 -14 H 8 V -34 L 52 0 L 8 34 V 14 H -50 Z" fill={fill} stroke={C.ink} strokeWidth={5 / k} strokeLinejoin="round" />;
};
const Chip: React.FC<{x: number; y: number; w: number; text: string; tone: 'move' | 'still'; scale: number; opacity?: number; arrow?: boolean}> = ({x, y, w, text, tone, scale, opacity = 1, arrow}) => {
  if (scale <= 0.01 || opacity <= 0.01) return null;
  const h = 66, fill = tone === 'move' ? C.saffron : C.teal, col = tone === 'move' ? C.ink : C.cream;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <rect x={-w / 2 + 6} y={-h / 2 + 7} width={w} height={h} rx={18} fill={C.ink} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={18} fill={fill} stroke={C.ink} strokeWidth={5} />
      <text x={arrow ? -26 : 0} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={42} letterSpacing={1.5} fill={col}>{text}</text>
      {arrow && <ArrowShape x={w / 2 - 38} y={0} w={44} fill={C.coral} />}
    </g>
  );
};

/* ------------------------------------------------------------------ captions (Montserrat ExtraBold, cream, ink outline, replaced not faded) */
type Seg = [string, boolean?];
const CAPS: {a: number; b: number; lines: Seg[][]}[] = [
  {a: 17, b: 40, lines: [[['What if Earth']], [['stopped', true], ['—']]]}, // the globe has the frame before f 17
  {a: 47, b: 68, lines: [[['right '], ['now?', true]]]},
  {a: 82, b: 124, lines: [[['This street was']], [['moving '], ['east', true]]]},
  {a: 124, b: 179, lines: [[['at about a '], ['thousand', true]], [['miles an hour.']]]},
];
const Captions: React.FC<{f: number}> = ({f}) => {
  const c = CAPS.find((q) => f >= q.a && f < q.b);
  if (!c) return null;
  const n = c.lines.length, base = n === 1 ? 540 : 500;
  return (
    <g fontFamily={CAP_FONT} fontWeight={800} fontSize={68} textAnchor="middle" strokeLinejoin="round">
      {c.lines.map((ln, i) => (
        <text key={i} x={540} y={base + i * 86} paintOrder="stroke" stroke={C.ink} strokeWidth={15} fill={C.cream}>
          {ln.map(([t, em], j) => <tspan key={j} fill={em ? C.coral : C.cream}>{t}</tspan>)}
        </text>
      ))}
    </g>
  );
};

const Rewind: React.FC<{f: number}> = ({f}) => {
  if (f < RW0 || f >= RW1 + 2) return null;
  const blink = Math.floor((f - RW0) / 4) % 2 === 0 ? 1 : 0.55;
  const tri = (x: number) => <path d={`M ${x + 34} -24 L ${x} 0 L ${x + 34} 24 Z`} fill={C.ink} />;
  return (
    <g transform="translate(150 430)" opacity={blink}>
      <rect x={-130 + 6} y={-40 + 7} width={260} height={80} rx={20} fill={C.ink} />
      <rect x={-130} y={-40} width={260} height={80} rx={20} fill={C.saffronLight} stroke={C.ink} strokeWidth={5} />
      {tri(-108)}{tri(-68)}
      <text x={42} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={40} letterSpacing={2} fill={C.ink}>BEFORE</text>
    </g>
  );
};

/* ------------------------------------------------------------------ the speed readout that answers "what keeps moving, how fast" */
const Readout: React.FC<{f: number}> = ({f}) => {
  const sPlate = popScale(f, NUM_A), sArrow = popScale(f, EAST_F), sEq = popScale(f, NUM_A + 2), sMph = popScale(f, MPH_F);
  const v = Math.round(1000 * E.out(Math.max(0, Math.min(1, (f - NUM_A) / (NUM_B - NUM_A)))));
  const txt = v.toLocaleString('en-US');
  return (
    <g>
      {sArrow > 0.01 && (
        <g transform={`translate(790 735) scale(${sArrow})`}>
          <rect x={-100 + 7} y={-96 + 8} width={200} height={192} rx={26} fill={C.ink} />
          <rect x={-100} y={-96} width={200} height={192} rx={26} fill={C.saffron} stroke={C.ink} strokeWidth={5} />
          <ArrowShape x={0} y={-22} w={130} />
          <text x={0} y={52} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={58} letterSpacing={3} fill={C.ink}>EAST</text>
        </g>
      )}
      {sPlate > 0.01 && (
        <g transform={`translate(400 735) scale(${sPlate})`}>
          <rect x={-250 + 8} y={-96 + 9} width={500} height={192} rx={26} fill={C.ink} />
          <rect x={-250} y={-96} width={500} height={192} rx={26} fill={C.cream} stroke={C.ink} strokeWidth={5} />
          <text x={sMph > 0.01 ? -52 : 0} y={-4} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={172} letterSpacing={1} fill={C.ink}>{txt}</text>
          {sMph > 0.01 && <text x={162} y={36} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={72} letterSpacing={2} fill={C.coral} transform={`scale(${sMph})`} style={{transformOrigin: '162px 36px'}}>MPH</text>}
        </g>
      )}
      <Chip x={262} y={636} w={230} text="EQUATOR" tone="still" scale={sEq} />
    </g>
  );
};

/* ------------------------------------------------------------------ composition */
const PANEL_TOP0 = 820, S0 = 0.82, FEET0 = 1500;
export const OpeningH1: React.FC<HookH1Props> = ({marker = true, captions = true, graphics = true}) => {
  const f = useCurrentFrame();
  const p = panelP(f);
  const top = lerp(PANEL_TOP0, 0, p), S = lerp(S0, 1, p), feet = lerp(FEET0, GSY, p), rad = lerp(40, 0, p);
  const TX = 540 - 540 * S, TY = feet - top - GSY * S;
  const st = sceneFor(f);
  // globe: large (cause) -> inset (top right). From the rewind on it spins again (it is the "before"): reversed at the rewind speed, then forward.
  const gc = {cx: lerp(GLOBE_FULL.cx, INSET.cx, p), cy: lerp(GLOBE_FULL.cy, INSET.cy, p), R: lerp(GLOBE_FULL.R, INSET.R, p)};
  const spinState = f < RW0 ? undefined : f < RW1
    ? {th: surfaceAngle(RW0) + SPIN * RWK * (f - RW0), thc: surfaceAngle(RW0) + SPIN * RWK * (f - RW0), blurS: 7, blurC: 7}
    : {th: surfaceAngle(RW0) + SPIN * RWK * (RW1 - RW0) - SPIN * (f - RW1), thc: surfaceAngle(RW0) + SPIN * RWK * (RW1 - RW0) - SPIN * (f - RW1), blurS: 8, blurC: 8};
  // chips follow the loose bicycle and the anchored lamp until the rewind
  const z = zoomFor(st);
  const bk = toScreenFor(bikeXH(st.s), 1236 - 190, st);
  const lm = toScreenFor(LAMPS[1], 600, st);
  const chipOff = f < RW0 - 2 ? 1 : Math.max(0, 1 - (f - (RW0 - 2)) / 2);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs><linearGradient id="skyH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.saffron} /><stop offset="1" stopColor={C.saffronLight} /></linearGradient></defs>
        <rect x={0} y={0} width={W} height={H} fill="url(#skyH)" />
      </svg>
      {p < 1 && <div style={{position: 'absolute', left: -6, top: top - 7, width: W + 12, height: H, background: C.ink, borderRadius: `${rad + 4}px ${rad + 4}px 0 0`}} />}
      <div style={{position: 'absolute', left: 0, top, width: W, height: H - top, overflow: 'hidden', borderRadius: `${rad}px ${rad}px 0 0`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${TX}px, ${TY}px) scale(${S})`}}>
          <SceneH f={f} />
        </div>
      </div>
      <GlobeH f={f} cx={gc.cx} cy={gc.cy} R={gc.R} spin={spinState} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        {marker && (
          <g>
            <rect x={(W - 318) / 2 + 7} y={222} width={318} height={96} rx={22} fill={C.ink} />
            <rect x={(W - 318) / 2} y={215} width={318} height={96} rx={22} fill={C.saffron} stroke={C.ink} strokeWidth={5} />
            <Hed x={W / 2} y={263} text="WHAT IF" size={68} color={C.ink} shadow={null} ls={3} />
          </g>
        )}
        {graphics && p >= 1 && (
          <g>
            <Chip x={bk.x} y={bk.y - 85 * z} w={310} text="~1,000 MPH" tone="move" arrow scale={popScale(f, CHIP.bike)} opacity={Math.min(chipOff, f < CHIP.bikeOff ? 1 : Math.max(0, 1 - (f - CHIP.bikeOff) / 4))} />
            <Chip x={lm.x} y={lm.y - 40 * z} w={190} text="0 MPH" tone="still" scale={popScale(f, CHIP.lamp)} opacity={chipOff} />
            <Rewind f={f} />
            <Readout f={f} />
          </g>
        )}
        {captions && <Captions f={f} />}
      </svg>
    </AbsoluteFill>
  );
};
