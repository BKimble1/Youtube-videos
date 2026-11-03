// Test entry for the inside module (art/inside.tsx): the translucent reveal and the three-quarter cutaway at the film's
// real cameras and eel poses, with stand-ins for the other modules (a plain olive exterior, a plain slate eel tube).
//   npx remotion still src/test/inside.entry.tsx InsideOne out.png --props='{"mode":"cut","t":12.3,"yawDeg":22}'
//   npx remotion still src/test/inside.entry.tsx InsideSheet out.png
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {BODY, EYE, GILL_Z, MOUTH, OPERCLE_EDGE, PREOPERCLE} from '../anatomy';
import {Layer} from '../camera';
import {closed, open, P, pt, tube} from '../core/geo';
import {resetIds, uid} from '../core/ids';
import {RADII} from '../eel';
import {camAt, eelAt, fishAt} from '../story';
import {C, INK, INK_PX, NS} from '../art/palette';
import {STRIP_W, CUT_WINDOW, CUT_Z, CutEdge, GillArches, InteriorBack, StomachFront, yawMatrix, yawX} from '../art/inside';

type Props = {mode: 'reveal' | 'cut'; t: number; yawDeg?: number; tag?: string; split?: boolean};

const Bg: React.FC = () => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, ${C.waterTop} 0%, ${C.waterMid} 45%, ${C.waterDeep} 100%)`}} />
);

/** a plain slate tube along samples [a, b] (flat ends, side ink only, so consecutive sections join without seams) */
const EelTube: React.FC<{pts: P[]; a: number; b: number}> = ({pts, a, b}) => {
  const lo = Math.max(0, a), hi = Math.min(pts.length - 1, b);
  if (hi - lo < 1) return null;
  const tb = tube(pts.slice(lo, hi + 1), RADII.slice(lo, hi + 1).map((r) => Math.max(0.02, r)), false, false);
  return (
    <g>
      <path d={'M' + tb.outline.map((q) => `${q.x.toFixed(3)} ${q.y.toFixed(3)}`).join('L') + 'Z'} fill={C.eelFlank} />
      <path d={'M' + tb.L.map((q) => `${q.x.toFixed(3)} ${q.y.toFixed(3)}`).join('L')} fill="none" stroke={INK} strokeWidth={2} vectorEffect={NS} />
      <path d={'M' + tb.R.map((q) => `${q.x.toFixed(3)} ${q.y.toFixed(3)}`).join('L')} fill="none" stroke={INK} strokeWidth={2} vectorEffect={NS} />
    </g>
  );
};

const Bed: React.FC = () => <rect x={-120} y={12.6} width={240} height={60} fill={C.sand} />;

const Reveal: React.FC<{t: number; tag: string; split: boolean}> = ({t, tag, split}) => {
  resetIds(tag);
  const c = camAt(t), e = eelAt(t), f = fishAt(t);
  const P2 = e.pts.map((q) => pt(q.x, q.y));
  const inEnd = Math.min(e.exitIdx, 121);
  let kG = 0;
  while (kG < inEnd && e.pts[kG].z < GILL_Z) kG++;
  return (
    <AbsoluteFill>
      <Bg />
      <Layer c={c}>
        <Bed />
        <InteriorBack t={t} mode="reveal" />
        {split && <EelTube pts={P2} a={0} b={Math.min(kG, inEnd - 1)} />}
        <GillArches t={t} mode="reveal" gill={f.gill} />
        <EelTube pts={P2} a={split ? kG - 1 : 0} b={Math.min(e.exitIdx, 120)} />
        <StomachFront t={t} mode="reveal" />
        <path d={closed(BODY)} fill={C.fishBody} opacity={0.3} />
        <path d={closed(BODY)} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
        {e.exitIdx <= 120 && <EelTube pts={P2} a={e.exitIdx - 1} b={120} />}
      </Layer>
    </AbsoluteFill>
  );
};

/** the plain olive exterior (stand-in for FishBody + Operculum) in the skin slice, masked by the window */
const Exterior: React.FC = () => {
  const m = uid('tm');
  // the gill cover's rear strip (the part the window leaves intact), a shade lighter than the body
  const T = OPERCLE_EDGE.map((_, i) => {
    const a = OPERCLE_EDGE[Math.max(0, i - 1)], b = OPERCLE_EDGE[Math.min(OPERCLE_EDGE.length - 1, i + 1)];
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    return pt((b.x - a.x) / l, (b.y - a.y) / l);
  });
  const inner = OPERCLE_EDGE.map((q, i) => pt(q.x - T[i].y * (STRIP_W + 0.6), q.y + T[i].x * (STRIP_W + 0.6)));
  const cover = open(OPERCLE_EDGE) + 'L' + open([...inner].reverse()).slice(1) + 'Z';
  return (
    <g>
      <defs>
        <mask id={m} maskUnits="userSpaceOnUse" x={-80} y={-60} width={160} height={120}>
          <rect x={-80} y={-60} width={160} height={120} fill="#FFFFFF" />
          <path d={CUT_WINDOW} fill="#000000" />
        </mask>
      </defs>
      <g mask={`url(#${m})`}>
        <path d={closed(BODY)} fill={C.fishBody} />
        <path d={cover} fill={C.fishCheek} />
        {/* the dark gill opening beneath the cover's rear edge */}
        <path d={open(OPERCLE_EDGE.slice(1, 6).map((q, i) => pt(q.x + 0.2 * Math.sin((i / 4) * Math.PI) + 0.08, q.y)))} fill="none" stroke={C.gillDark} strokeWidth={0.32} strokeLinecap="round" />
        <path d={open(OPERCLE_EDGE)} fill="none" stroke={INK} strokeWidth={2.4} vectorEffect={NS} />
        <path d={open(PREOPERCLE)} fill="none" stroke={INK} strokeWidth={1.6} vectorEffect={NS} opacity={0.6} />
        <circle cx={EYE.c.x} cy={EYE.c.y} r={EYE.r} fill={C.eyeIris} stroke={INK} strokeWidth={2} vectorEffect={NS} />
        <circle cx={EYE.c.x - 0.3} cy={EYE.c.y} r={EYE.r * 0.55} fill={C.pupil} />
        <path d={`M${MOUTH.tip.x} ${MOUTH.tip.y} Q${(MOUTH.tip.x + MOUTH.corner.x) / 2} ${MOUTH.corner.y + 0.6} ${MOUTH.corner.x} ${MOUTH.corner.y}`} fill="none" stroke={INK} strokeWidth={2.2} vectorEffect={NS} />
        <path d={closed(BODY)} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
      </g>
    </g>
  );
};

const Cut: React.FC<{t: number; yawDeg: number; tag: string}> = ({t, yawDeg, tag}) => {
  resetIds(tag);
  const c = camAt(t), e = eelAt(t), f = fishAt(t);
  const yaw = (yawDeg * Math.PI) / 180;
  const Q = e.pts.map((q) => pt(yawX(q.x, q.z, yaw), q.y));
  const inEnd = Math.min(e.exitIdx, 121); // first outside sample
  let kG = 0;
  while (kG < inEnd && e.pts[kG].z < GILL_Z) kG++;
  return (
    <AbsoluteFill>
      <Bg />
      <Layer c={c}>
        <g transform={yawMatrix(0, yaw)}>
          <Bed />
        </g>
        <g transform={yawMatrix(0, yaw)}>
          <InteriorBack t={t} mode="cut" />
        </g>
        <EelTube pts={Q} a={0} b={Math.min(kG, inEnd - 1)} />
        <g transform={yawMatrix(GILL_Z, yaw)}>
          <GillArches t={t} mode="cut" gill={f.gill} />
        </g>
        {kG < inEnd && <EelTube pts={Q} a={kG - 1} b={inEnd - 1} />}
        <g transform={yawMatrix(CUT_Z, yaw)}>
          <Exterior />
          <CutEdge yaw={yaw} />
        </g>
        {inEnd <= 120 && <EelTube pts={Q} a={inEnd - 1} b={120} />}
      </Layer>
    </AbsoluteFill>
  );
};

export const InsideOne: React.FC<Props> = ({mode, t, yawDeg = 22, tag = 'a', split = false}) =>
  mode === 'cut' ? <Cut t={t} yawDeg={yawDeg} tag={tag} /> : <Reveal t={t} tag={tag} split={split} />;

const SHEET: Props[] = [
  {mode: 'reveal', t: 3.0}, {mode: 'reveal', t: 6.5}, {mode: 'cut', t: 11.6, yawDeg: 22},
  {mode: 'cut', t: 12.3, yawDeg: 0}, {mode: 'cut', t: 12.3, yawDeg: 22}, {mode: 'cut', t: 13.0, yawDeg: 22},
];
export const InsideSheet: React.FC<{items?: Props[]; cols?: number}> = ({items = SHEET, cols = 3}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {items.map((p, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <InsideOne {...p} tag={`s${i}_`} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <>
    <Composition id="InsideOne" component={InsideOne} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{mode: 'cut', t: 12.3, yawDeg: 22} as Props} />
    <Composition id="InsideSheet" component={InsideSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{cols: 3}} />
  </>
);
registerRoot(Root);
