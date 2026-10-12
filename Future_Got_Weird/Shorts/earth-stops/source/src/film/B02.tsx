import React from 'react';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {GlobeH} from '../v2/GlobeH';
import {BikeWorld} from '../v2/Bike2';
import {CharacterSide, hipOnGround, sideFK} from '../v2/side';
import {MugSide} from '../v2/props';
import {GSY, GYW, SC} from '../v2/choreo2';
import {ArrowShape, CALM, Cat, Chip, HeroAt, Pigeon, cl, lerp, popScale, ramp} from './ui';
import {BIG, INSET, filmTh, filmThc, spinFor} from './globe';
import {T} from './timeline';
import {CAM_B02, HERO_X, toScr} from './street';
import {HED_FONT} from '../fonts4';

/* ------------------------------------------------------------------ B02a: the globe carries everything on it, east, together */
export const B2 = {pop0: 194, lens: 250, arrows: [262, 266, 270, 274, 278, 282], chip: 284}; // picture events (frames), shared with the sound cues
const ICON_SC = 0.42; // hero icon character scale at k = 1
const ICON_BASE = 1.38; // other icons relative to their drawn size
const ICON_D = [-160, -120, -80, -40, 0, 40, 80, 120, 160];
const ICON_KIND = ['palm', 'boat', 'lamp', 'cat', 'hero', 'palm', 'bike', 'house', 'boat'] as const;
const rad = (d: number) => (d * Math.PI) / 180;
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
const thDiag = (f: number) => filmTh(Math.min(f, T.zoomA)); // the globe is held while the camera dives into the street icon
const heroLon = () => filmTh(T.zoomA); // the street icon is under the pin when the dive starts

const IconPalm: React.FC = () => (
  <g>
    <path d="M -7 0 Q -6 -60 4 -112 L 14 -112 Q 6 -60 8 0 Z" fill={C.woodLight} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    {[[-52, 8, C.teal], [-34, -22, C.tealLight], [0, -34, C.teal], [34, -22, C.tealLight], [52, 8, C.teal]].map(([dx, dy, col], i) => (
      <path key={i} d={`M 9 -112 Q ${9 + (dx as number) * 0.5} ${-112 + (dy as number) - 14} ${9 + (dx as number)} ${-112 + (dy as number) + 16} Q ${9 + (dx as number) * 0.5} ${-112 + (dy as number) + 4} 9 -104 Z`} fill={col as string} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    ))}
  </g>
);
const IconLamp: React.FC = () => (
  <g>
    <rect x={-5} y={-132} width={10} height={132} fill={C.ink} />
    <rect x={-14} y={-8} width={28} height={10} rx={3} fill={C.ink} />
    <path d="M 0 -128 q 0 -26 30 -26" fill="none" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
    <path d="M 18 -154 h 34 l -6 16 h -22 z" fill={C.saffron} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </g>
);
const IconHouse: React.FC = () => (
  <g>
    <rect x={-52} y={-118} width={104} height={118} fill={C.saffronLight} stroke={C.ink} strokeWidth={4} />
    <rect x={-58} y={-130} width={116} height={16} rx={4} fill={C.tealDeep} stroke={C.ink} strokeWidth={4} />
    {[-32, 12].map((x) => <path key={x} d={`M ${x} -58 L ${x} -86 A 14 14 0 0 1 ${x + 28} -86 L ${x + 28} -58 Z`} fill={C.tealLight} stroke={C.ink} strokeWidth={3} />)}
    {Array.from({length: 6}).map((_, i) => <rect key={i} x={-48 + i * 16} y={-44} width={16} height={16} fill={i % 2 ? C.cream : C.teal} />)}
    <rect x={-48} y={-44} width={96} height={16} fill="none" stroke={C.ink} strokeWidth={3} />
    <rect x={-12} y={-26} width={26} height={26} rx={3} fill={C.blue} stroke={C.ink} strokeWidth={3} />
  </g>
);
export const IconBoat: React.FC = () => (
  <g>
    <path d="M -60 -18 q 60 28 120 0 l -14 22 h -92 z" fill={C.coral} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" transform="translate(0 -8)" />
    <line x1={0} y1={-26} x2={0} y2={-124} stroke={C.ink} strokeWidth={6} />
    <path d="M 4 -122 L 44 -40 L 4 -40 Z" fill={C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M -4 -100 L -36 -40 L -4 -40 Z" fill={C.saffronLight} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M -80 6 q 20 -14 40 0 t 40 0 t 40 0 t 40 0" fill="none" stroke={C.cream} strokeWidth={5} strokeLinecap="round" />
  </g>
);

export const globeBoxB02a = (f: number) => {
  const u = ramp(f, T.irisA, T.irisB, E.inOut);
  return {cx: lerp(INSET.cx, BIG.cx, u), cy: lerp(INSET.cy, BIG.cy, u), R: lerp(INSET.R, BIG.R, u)};
};

/** the layer: paper background revealed by an iris that grows out of the inset globe, the turning globe with its icons, equal arrows. The whole layer is then zoomed into the street icon. */
export const GlobeDiagram: React.FC<{f: number}> = ({f}) => {
  const box = globeBoxB02a(f);
  const iris = lerp(INSET.R, 2300, E.inOut(cl((f - T.irisA) / (T.irisB + 6 - T.irisA))));
  const k = box.R / 340 * 1.13; // icon scale: 1.13 at the full-size globe
  const th = thDiag(f);
  const popStart = B2.pop0;
  const items = ICON_D.map((d, i) => {
    const lon = heroLon() + d;
    const rel = rad(wrap(lon - th));
    const c = Math.cos(rel);
    return {d, kind: ICON_KIND[i], i, x: box.cx + box.R * Math.sin(rel), c, rel};
  }).filter((it) => it.c > 0.02).sort((a, b) => a.c - b.c);
  const feetY = box.cy + 14 * k;
  const popOf = (d: number) => popScale(f, popStart + Math.abs(d) / 40 * 3);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, clipPath: `circle(${iris}px at ${box.cx}px ${box.cy}px)`}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <rect x={0} y={0} width={W} height={H} fill={C.paper} />
        {[420, 640, 860, 1080, 1300].map((r, i) => <circle key={i} cx={box.cx} cy={box.cy} r={r * Math.max(0.6, k)} fill="none" stroke={C.paperLine} strokeWidth={6} opacity={0.7} />)}
      </svg>
      <GlobeH f={f} cx={box.cx} cy={box.cy} R={box.R} id="gb2" spin={spinFor(Math.min(f, T.zoomA))} pin={false} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        {items.map((it) => {
          const s = popOf(it.d);
          if (s <= 0.01 || it.kind === 'hero') return null;
          return (
            <g key={it.i} transform={`translate(${it.x} ${feetY}) scale(${k * s * ICON_BASE * (0.3 + 0.7 * it.c)} ${k * s * ICON_BASE})`} style={{filter: 'drop-shadow(0 0 2px #FFFBF0) drop-shadow(0 0 2px #FFFBF0) drop-shadow(0 0 3px #FFFBF0)'}}>
              {it.kind === 'palm' && <IconPalm />}
              {it.kind === 'lamp' && <IconLamp />}
              {it.kind === 'house' && <IconHouse />}
              {it.kind === 'boat' && <IconBoat />}
              {it.kind === 'cat' && <Cat x={0} y={0} s={1.15} />}
              {it.kind === 'bike' && <g transform="scale(0.5) translate(0 -1236)"><BikeWorld f={0} at={{x: 0, ang: th * 3, tilt: 0}} /></g>}
            </g>
          );
        })}
        {items.filter((it) => popOf(it.d) > 0.4).map((it) => (
          <g key={`a${it.i}`} transform={`translate(${it.x} ${feetY - 262 * k}) scale(${k * (0.35 + 0.65 * it.c) * popOf(it.d)} ${k * popOf(it.d)})`}>
            <ArrowShape x={0} y={0} w={112} />
          </g>
        ))}
      </svg>
      {items.filter((it) => it.kind === 'hero').map((it) => {
        const s = popOf(it.d);
        const pose = CALM(f);
        const hipY = feetY - (164 * ICON_SC * k) * s;
        return (
          <div key="hero" style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scaleX(${0.3 + 0.7 * it.c})`, transformOrigin: `${it.x}px ${feetY}px`, filter: 'drop-shadow(0 0 2px #FFFBF0) drop-shadow(0 0 2px #FFFBF0) drop-shadow(0 0 3px #FFFBF0)'}}>
            <CharacterSide pose={pose} hip={{x: it.x, y: hipY - 4 * k}} sc={ICON_SC * k * s} scarfWrap holdN={<MugSide tilt={0} sc={ICON_SC * k * s} />} />
          </div>
        );
      })}
    </div>
  );
};

/** zoom transform of the diagram layer into the street (maps the hero icon's feet to her feet in the street scene) */
export const FEET_ICON = {x: BIG.cx, y: BIG.cy + 14 * 1.13};
export const FEET_TARGET = () => ({x: toScr(HERO_X, 1290, CAM_B02).x, y: GSY});
export const ZOOM_K = (SC * CAM_B02.z) / (ICON_SC * 1.13);
export const zoomU = (f: number) => ramp(f, T.zoomA, T.zoomB, E.inOut);
export const diagramTransform = (f: number) => {
  const u = zoomU(f);
  const K = Math.exp(Math.log(ZOOM_K) * u);
  const t = FEET_TARGET();
  const T0 = {x: lerp(FEET_ICON.x, t.x, u), y: lerp(FEET_ICON.y, t.y, u)};
  return `translate(${T0.x}px, ${T0.y}px) scale(${K}) translate(${-FEET_ICON.x}px, ${-FEET_ICON.y}px)`;
};

/* ------------------------------------------------------------------ B02b: the street, standing still, everything carrying the same arrow */
export const B02bGraphics: React.FC<{f: number; camX: number; z: number}> = ({f, camX, z}) => {
  const cam = {x: camX, z};
  const sw = 0.6 * Math.sin(f * 0.11);
  const pose = CALM(f);
  const hip = {x: toScr(HERO_X, 0, cam).x, y: 0};
  void hip; void sw; void pose;
  const pHip = hipOnGround(CALM(f), HERO_X, GYW, SC), fk = sideFK(CALM(f), pHip, SC);
  const heroHead = toScr(HERO_X + 20, fk.Hc.y - 62 * SC - 70, cam);
  const mug = toScr(fk.Wn.x + 100, fk.Wn.y - 130, cam);
  const bike = toScr(520, 1236 - 190 - 60, cam);
  const cat = toScr(720, 1290 - 170 - 56, cam);
  const palm = toScr(1010 + 40, 1220 - 600 - 70, cam);
  const lampHead = toScr(640, 560 - 80, cam);
  const arrows: [number, {x: number; y: number}, number][] = [[B2.arrows[0], heroHead, 1], [B2.arrows[1], mug, 0.8], [B2.arrows[2], bike, 1], [B2.arrows[3], cat, 1], [B2.arrows[4], palm, 1], [B2.arrows[5], lampHead, 1]];
  const lens = popScale(f, B2.lens);
  const lensOff = ramp(f, T.panA - 4, T.panA + 4);
  return (
    <g>
      {arrows.map(([fr, p, sc], i) => {
        const s = popScale(f, fr) * (1 - lensOff);
        if (s <= 0.01) return null;
        return (
          <g key={i} transform={`translate(${p.x} ${p.y - 30 * z}) scale(${s * sc})`}>
            <ArrowShape x={0} y={0} w={150} />
          </g>
        );
      })}
      <Chip x={540} y={706} w={640} text="ALL MOVING EAST — TOGETHER" tone="move" scale={popScale(f, B2.chip) * (1 - lensOff)} />
      {/* the coffee: a lens on the mug, level and calm */}
      {lens > 0.01 && (
        <g transform={`translate(790 905) scale(${lens * (1 - lensOff)})`}>
          <circle cx={0} cy={0} r={158} fill={C.cream} stroke={C.ink} strokeWidth={8} />
          <clipPath id="lensClip"><circle cx={0} cy={0} r={150} /></clipPath>
          <g clipPath="url(#lensClip)">
            <rect x={-160} y={-160} width={320} height={320} fill={C.tealLight} />
            <g transform="translate(0 28) scale(1.9)">
              <path d="M -40 -34 L 40 -34 L 34 40 Q 33 48 24 48 L -24 48 Q -33 48 -34 40 Z" fill={C.coral} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
              <ellipse cx={0} cy={-34} rx={40} ry={10} fill={C.cream} stroke={C.ink} strokeWidth={3} />
              <ellipse cx={0} cy={-33} rx={34} ry={7} fill="#33200F" />
              <ellipse cx={-10} cy={-35} rx={10} ry={2.2} fill="#B9824A" opacity={0.8} />
              {[-14, 0, 14].map((x, i) => <path key={i} d={`M ${x} -52 q ${5 * Math.sin(f * 0.15 + i)} -9 0 -18 q ${-5 * Math.sin(f * 0.15 + i)} -9 0 -18`} fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" opacity={0.5} />)}
            </g>
          </g>
          <rect x={-120} y={104} width={240} height={54} rx={14} fill={C.teal} stroke={C.ink} strokeWidth={6} />
          <text x={0} y={132} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={40} letterSpacing={2} fill={C.cream}>NO SLOSH</text>
        </g>
      )}
    </g>
  );
};
export {Pigeon, HeroAt, sideFK};
