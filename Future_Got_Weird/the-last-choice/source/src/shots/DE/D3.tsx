// D3 — Hands, close. The friend's fingers, interlaced with the Director's on the bed sheet, hold on; a last faint
// squeeze; then the grip weakens and lets go, the hand goes heavy, and the Director's grip answers and keeps holding.
// Stillness and time: the release takes over a second; nothing else moves. (3.5 s, near silence.)
import React from 'react';
import {useShot} from '../../film/useShot';
import {look, dmg} from '../../film/crew';
import {Frame, Grade} from '../../kit/cam';
import {Glow} from '../../fx/light';
import {clamp, seg, smooth, easeInOut, lerp, noise} from '../../kit/math';
import {C} from '../../theme';
import {Clasp} from './Clasp';

const ID = 'D3';
export const releaseOf = (t: number) => easeInOut(seg(t, 1.05, 2.45)); // 0 holding … 1 let go

const D3: React.FC = () => {
  const {t, T} = useShot(ID);
  const rel = releaseOf(t);
  // the last squeeze before the release (a small tightening and relaxing)
  const lastSq = Math.sin(Math.PI * seg(t, 0.45, 0.95)) * 0.12;
  const grip = clamp(1 - rel + lastSq * 0);
  const sag = smooth(seg(t, 1.9, 2.75));
  const squeeze = smooth(seg(t, 2.35, 3.0));
  // breathing: the friend's hand rises and falls slightly until the release
  const life = 1 - smooth(seg(t, 0.9, 1.6));
  const breathe = Math.sin(t * Math.PI * 2 * 0.42) * 3 * life;
  const tremble = noise(t * 6, 3) * 1.2 * (1 - squeeze * 0.5);
  const zoom = lerp(1.0, 1.05, smooth(clamp(t / 3.5)));
  const fd = dmg('friend', T), dd = dmg('director', T);
  const s = 1.3 * zoom;
  return (
    <Frame bg="#F3EFE6">
      <g transform={`translate(960 540) scale(${zoom}) translate(-960 -540)`}>
        {/* the sheet: warm white with soft folds; the mattress edge along the bottom */}
        <rect x={-40} y={-40} width={2000} height={1160} fill="#F5F2EA" />
        {[[-80, 180, 2000, 120], [-60, 420, 2000, 300], [200, 760, 2100, 640]].map(([x0, y0, x1, y1], i) => (
          <path key={i} d={`M ${x0} ${y0} Q ${(x0 + x1) / 2} ${(y0 + y1) / 2 - 60} ${x1} ${y1}`} fill="none" stroke="#E2DDD0" strokeWidth={6} strokeLinecap="round" />
        ))}
        <path d="M -40 940 Q 900 900 1960 960 L 1960 1120 L -40 1120 Z" fill="#E6E9EA" stroke={C.ink} strokeWidth={5} />
        <path d="M -40 940 Q 900 900 1960 960" fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.6} transform="translate(0 10)" />
        {/* the friend's vest hem at the top left (their body above the frame) */}
        <path d="M -40 -40 L 420 -40 Q 360 60 160 110 Q 40 140 -40 150 Z" fill={C.teal} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
        <path d="M 120 -40 Q 110 40 60 120" fill="none" stroke={C.tealDeep} strokeWidth={5} opacity={0.6} />
        <Glow x={1150} y={420} r={900} color="#FFE7B8" opacity={0.35} squash={0.6} id="d3sun" />
        <Clasp x={900 - breathe * 0.4} y={590 + breathe + tremble * 0.3} rot={-16} s={s} t={t} grip={grip} sag={sag} squeeze={squeeze}
          skinF={look('friend').skin} skinD={look('director').skin} pale={fd.pale ?? 0} bloodF={fd.handBlood?.R ?? 0} bloodD={dd.handBlood?.R ?? 0} ink={5} />
      </g>
      <Grade vignette={0.42} id="vgD3" />
    </Frame>
  );
};
export default D3;
