// Test entry for the predator exterior and its X-ray (src/art/fish.tsx, src/art/xray.tsx), at the film's framings.
// The eel here is a plain slate tube along eelAt(t).pts (the real eel is another module).
//   npx remotion still src/test/fish.entry.tsx Fish out.png --props='{"t":0}'
//   props: t (story time), cam (camera time, default t), gill / prop / look / startle (overrides), mode 'ext' | 'xray'
//   npx remotion still src/test/fish.entry.tsx FishSheet out.png      (gill 0 / 0.5 / 1 × prop 0 / 1 at camAt(0))
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {Cam, Layer} from '../camera';
import {line, P, pt, poly, tube} from '../core/geo';
import {resetIds, uid} from '../core/ids';
import {C, INK, NS} from '../art/palette';
import {RADII} from '../eel';
import {camAt, eelAt, fishAt} from '../story';
import {FishBody, FishFar, FishLook, GillGap, gillGapPath, Operculum, Pectoral, fishSilhouette} from '../art/fish';
import {XRayBack, XRayFront} from '../art/xray';

type Props = {t: number; cam?: number; gill?: number; prop?: number; look?: number; startle?: number; mode?: 'ext' | 'xray'; sil?: boolean; op?: number};

/** a plain slate tube for samples [i0, i1] of the eel */
const EelTube: React.FC<{ps: P[]; i0: number; i1: number; px: number}> = ({ps, i0, i1, px}) => {
  if (i1 - i0 < 1) return null;
  const Cn = ps.slice(i0, i1 + 1);
  const R = RADII.slice(i0, i1 + 1).map((r) => Math.max(0.04, r));
  const tb = tube(Cn, R, i1 === ps.length - 1, i0 === 0);
  const eye = i0 <= 4 && i1 >= 4;
  const e = ps[4], d = ps[5];
  const nx = -(d.y - e.y), ny = d.x - e.x, nl = Math.hypot(nx, ny) || 1;
  const ex = e.x + (nx / nl) * 0.25, ey = e.y + (ny / nl) * 0.25;
  return (
    <g>
      <path d={poly(tb.outline)} fill={C.eelFlank} stroke={INK} strokeWidth={2.4} vectorEffect={NS} strokeLinejoin="round" />
      <path d={line(tb.L.slice(1, -1))} fill="none" stroke={C.eelBack} strokeWidth={Math.max(1, 0.5 * px)} vectorEffect={NS} opacity={0.8} />
      {eye && <circle cx={ex} cy={ey} r={0.42} fill={C.eelEye} />}
      {eye && <circle cx={ex - 0.13} cy={ey - 0.13} r={0.13} fill="#fff" />}
    </g>
  );
};

const Scene: React.FC<Props> = ({t, cam, gill, prop, look, startle, mode = 'ext', sil, op}) => {
  const c: Cam = camAt(cam ?? t);
  const f = fishAt(t);
  const e = eelAt(t);
  const s: FishLook = {t, gill: gill ?? f.gill, finPhase: f.finPhase, startle: startle ?? f.startle, prop: prop ?? 0, look: look ?? 0};
  const ps = e.pts.map((q) => pt(q.x, q.y));
  const N = ps.length - 1;
  const ex = Math.min(e.exitIdx, N + 1);
  const px = 1080 / c.w;
  const clip = uid('tgap');
  if (mode === 'xray') {
    return (
      <AbsoluteFill style={{background: `radial-gradient(120% 80% at 40% 45%, ${C.xrayBg1}, ${C.xrayBg0})`}}>
        <Layer c={c}>
          <XRayBack s={s} />
          <EelTube ps={ps} i0={0} i1={N} px={px} />
          <XRayFront s={s} opacity={0.85} />
        </Layer>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{background: `linear-gradient(${C.waterTop}, ${C.waterMid} 55%, ${C.waterDeep})`}}>
      <Layer c={c}>
        <rect x={-200} y={12.3} width={400} height={120} fill={C.sand} />
        <rect x={-200} y={12.3} width={400} height={1.2} fill={C.bedShadow} opacity={0.25} />
        <ellipse cx={-8} cy={12.7} rx={44} ry={1.1} fill={C.bedShadow} opacity={0.45} />
        <FishFar s={s} />
        {op !== undefined && <EelTube ps={ps} i0={0} i1={Math.min(N, ex)} px={px} />}
        <FishBody s={s} opacity={op} />
        <g opacity={op}>
          <GillGap s={s} />
        </g>
        <defs>
          <clipPath id={clip}>
            <path d={gillGapPath(s)} />
          </clipPath>
        </defs>
        {ex <= N && (
          <g clipPath={`url(#${clip})`}>
            <EelTube ps={ps} i0={Math.max(0, ex - 16)} i1={Math.min(N, ex + 1)} px={px} />
          </g>
        )}
        <Operculum s={s} opacity={op} />
        <Pectoral s={s} opacity={op} />
        {ex <= N && <EelTube ps={ps} i0={Math.max(0, ex - 1)} i1={N} px={px} />}
        {sil && <path d={fishSilhouette(s)} fill="#ff00ff" opacity={0.35} stroke="#ff00ff" strokeWidth={1} vectorEffect={NS} />}
      </Layer>
    </AbsoluteFill>
  );
};

const One: React.FC<Props> = (p) => {
  resetIds('f_');
  return <Scene {...p} />;
};

const SHEET: Props[] = [
  {t: 0, gill: 0, prop: 0}, {t: 0, gill: 0.5, prop: 0}, {t: 0, gill: 1, prop: 0},
  {t: 0, gill: 0, prop: 1}, {t: 0, gill: 0.5, prop: 1}, {t: 0, gill: 1, prop: 1},
];
const Sheet: React.FC<{items?: Props[]; cols?: number}> = ({items = SHEET, cols = 3}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {items.map((p, i) => {
        resetIds(`s${i}_`);
        return (
          <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
            <Scene {...p} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <>
    <Composition id="Fish" component={One} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 0} as Props} />
    <Composition id="FishSheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1280} defaultProps={{cols: 3} as {items?: Props[]; cols?: number}} />
  </>
));
