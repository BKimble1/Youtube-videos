import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {Hed} from '../opening/type';
import {Scene2} from './Opening2';
import {Globe} from './Globe';
import {T0} from './choreoEC';

/** E-C: sky + globe (cause) above a rounded street panel (effect). The panel shows the E-A street scene scaled by S, shifted by T0 frames, without the bicycle. */
const PANEL_TOP = 820;
const S = 0.82;
const FEET = 1500; // screen y of the street's feet line
const TX = 540 - 540 * S;
const TY = FEET - PANEL_TOP - 1480 * S; // scene GSY = 1480

export const OpeningEC: React.FC<{marker?: boolean}> = ({marker = true}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id="skyEC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.saffron} />
            <stop offset="1" stopColor={C.saffronLight} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="url(#skyEC)" />
      </svg>
      <Globe f={f} />
      <div style={{position: 'absolute', left: -6, top: PANEL_TOP - 7, width: W + 12, height: H, background: C.ink, borderRadius: '44px 44px 0 0'}} />
      <div style={{position: 'absolute', left: 0, top: PANEL_TOP, width: W, height: H - PANEL_TOP, overflow: 'hidden', borderRadius: '40px 40px 0 0'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${TX}px, ${TY}px) scale(${S})`}}>
          <Scene2 f={f - T0} marker={false} ec pad={420} />
        </div>
      </div>
      {marker && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
          <rect x={(W - 318) / 2 + 7} y={222} width={318} height={96} rx={22} fill={C.ink} />
          <rect x={(W - 318) / 2} y={215} width={318} height={96} rx={22} fill={C.saffron} stroke={C.ink} strokeWidth={5} />
          <Hed x={W / 2} y={263} text="WHAT IF" size={68} color={C.ink} shadow={null} ls={3} />
        </svg>
      )}
    </AbsoluteFill>
  );
};
