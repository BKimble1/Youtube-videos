import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, H, OUTLINE, W} from '../../theme';
import {Layer} from '../../lib/camera';
import {Floor, Wall} from '../Sets';
import {NAVY_DEEP} from './S6_Props';

/**
 * S6 stage: the striped curtain (split at centre stage, x 960), the blue stage floor, the stage apron with the
 * guard-rail label, and movable spotlights. A variant of components/Sets StageSet (whose spotlights are fixed).
 */

export const FLOOR_Y = 850;
export const APRON_Y = 1012;

export const Curtain: React.FC<{sway: number}> = ({sway}) => (
  <Wall color={C.saffronDeep} depth={0.7}>
    {Array.from({length: 24}).map((_, i) => (
      <div key={i} style={{position: 'absolute', left: i * 96 - 40 + sway * Math.sin(i * 1.7), top: 0, width: 48, height: H + 400, background: C.saffron, opacity: 0.55, borderRadius: 24}} />
    ))}
    {/* the centre split of the curtain (world x 960 on the curtain layer, plus the Wall's 200 px bleed) */}
    <div style={{position: 'absolute', left: 200 + 960 - 3, top: 0, width: 6, height: H + 400, background: C.saffronDeep, borderLeft: `2px solid rgba(22,42,50,0.35)`}} />
  </Wall>
);

export const StageFloor: React.FC<{labelOn: number; label: string}> = ({labelOn, label}) => (
  <>
    <Floor color={C.blueDeep} y={FLOOR_Y} depth={1} stripe={C.blue} />
    <Layer depth={1}>
      <div style={{position: 'absolute', left: -400, right: -400, top: APRON_Y, height: 500, background: NAVY_DEEP, borderTop: `${OUTLINE + 1}px solid ${C.ink}`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 4, height: 5, background: C.blue, opacity: 0.7}} />
      </div>
      {labelOn > 0 && (
        <div style={{position: 'absolute', left: 0, width: W, top: APRON_Y + 18, textAlign: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 32, letterSpacing: '0.02em', lineHeight: 1, color: C.saffronLight, opacity: labelOn, textShadow: `0 0 ${10 * labelOn}px rgba(255,199,68,0.5)`}}>
          {label}
        </div>
      )}
    </Layer>
  </>
);

export type Spot = {x: number; y: number; rx: number; on: number; tint?: string; src?: number};

/** Spotlight cones from the rig above the frame onto floor pools. World space (depth 1). */
export const Spotlights: React.FC<{spots: Spot[]}> = ({spots}) => (
  <svg width={W + 800} height={H + 600} viewBox={`-400 -400 ${W + 800} ${H + 600}`} style={{position: 'absolute', left: -400, top: -400, overflow: 'visible', pointerEvents: 'none'}}>
    <defs>
      <linearGradient id="s6cone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.cream} stopOpacity={0.04} />
        <stop offset="0.7" stopColor={C.cream} stopOpacity={0.34} />
        <stop offset="1" stopColor={C.cream} stopOpacity={0.1} />
      </linearGradient>
      <radialGradient id="s6pool">
        <stop offset="0" stopColor={C.cream} stopOpacity={0.6} />
        <stop offset="0.75" stopColor={C.cream} stopOpacity={0.35} />
        <stop offset="1" stopColor={C.cream} stopOpacity={0} />
      </radialGradient>
    </defs>
    {spots.map((s, i) =>
      s.on <= 0.001 ? null : (
        <g key={i} opacity={s.on}>
          <path d={`M ${(s.src ?? s.x) - 26} -300 L ${s.x - s.rx} ${s.y} L ${s.x + s.rx} ${s.y} L ${(s.src ?? s.x) + 26} -300 Z`} fill={s.tint ?? 'url(#s6cone)'} opacity={s.tint ? 0.13 : 1} />
          <ellipse cx={s.x} cy={s.y} rx={s.rx * 1.05} ry={s.rx * 0.2} fill="url(#s6pool)" />
        </g>
      ),
    )}
  </svg>
);

/** The centre split of the curtain pushed open by the host. open: 0..1 gap; bulge: 0..1 fabric pushed toward camera. */
export const SLIT = {x: 960, top: 360, bottom: FLOOR_Y, w: 290};
export const slitPath = (open: number) => {
  const hw = (SLIT.w / 2) * open;
  const {x, top, bottom} = SLIT;
  return `M ${x} ${top} C ${x - hw * 0.6} ${top + 90} ${x - hw} ${top + 220} ${x - hw * 0.92} ${bottom} L ${x + hw * 0.92} ${bottom} C ${x + hw} ${top + 220} ${x + hw * 0.6} ${top + 90} ${x} ${top} Z`;
};

export const CurtainSlit: React.FC<{open: number; bulge: number; wiggle: number}> = ({open, bulge, wiggle}) => {
  if (open <= 0.001 && bulge <= 0.001) return null;
  const hw = (SLIT.w / 2) * open;
  const {x, top, bottom} = SLIT;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {bulge > 0.001 && (
        <g>
          <ellipse cx={x + wiggle} cy={620} rx={70 + 50 * bulge} ry={150 + 60 * bulge} fill={C.saffronLight} opacity={0.5 * bulge} />
          <path d={`M ${x} ${top - 60} Q ${x + 26 * bulge + wiggle} 620 ${x} ${bottom}`} stroke={C.ink} strokeWidth={3} fill="none" opacity={0.5} />
        </g>
      )}
      {open > 0.001 && (
        <g>
          <path d={slitPath(open)} fill="#0E1A22" />
          {/* bunched fabric edges */}
          {[-1, 1].map((s) => (
            <path key={s} d={`M ${x} ${top} C ${x + s * hw * 0.6} ${top + 90} ${x + s * hw} ${top + 220} ${x + s * hw * 0.92} ${bottom}`} stroke={C.saffron} strokeWidth={22} fill="none" strokeLinecap="round" />
          ))}
          {[-1, 1].map((s) => (
            <path key={`o${s}`} d={`M ${x} ${top} C ${x + s * hw * 0.6} ${top + 90} ${x + s * hw} ${top + 220} ${x + s * hw * 0.92} ${bottom}`} stroke={C.ink} strokeWidth={4} fill="none" transform={`translate(${s * -10} 0)`} />
          ))}
        </g>
      )}
    </svg>
  );
};

/** Screen-space darkness with one soft pool of light (the follow spot), used for the opening. */
export const Darkness: React.FC<{a: number; x: number; y: number; r: number}> = ({a, x, y, r}) =>
  a <= 0.001 ? null : (
    <AbsoluteFill style={{background: `radial-gradient(circle at ${x}px ${y}px, rgba(14,26,34,0) ${r * 0.82}px, rgba(14,26,34,${a}) ${r * 1.04}px)`, pointerEvents: 'none'}} />
  );
