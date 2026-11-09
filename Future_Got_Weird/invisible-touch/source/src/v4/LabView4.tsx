// V4 lab renderer (from v2/LabView2.tsx): round transducer cans, no rays, the skin-localised tactile pulse, the dive
// into the fingertip, the moving sensation spot, and the pinch's dashed "button" outline that the fingers close
// through (back arc behind the hand, front arc over it).
import React from 'react';
import {Lab} from '../it/lab';
import {Waves, Focus, phaseGlow, CYAN, CYAN_HI} from '../it/fx';
import {ButtonOutline, focusOf, geoOf} from '../v2/LabView2';
import {Shot4} from './shots4';
import {TactilePulse, FingerCut} from './fx4';
import {V} from '../dc/math';

const nearestAge = (t: number, ev: number[]) => {
  let best = 99;
  ev.forEach((e) => {
    const a = t - e;
    if (a > -0.26 && Math.abs(a) < Math.abs(best)) best = a;
  });
  return best;
};

const PinchRing: React.FC<{c: V; k: number; a: number; front: boolean}> = ({c, k, a, front}) => {
  if (a <= 0.01) return null;
  const r = 13, ry = r * 0.32;
  const d = `M${c.x - r},${c.y} A${r},${ry} 0 0 ${front ? 0 : 1} ${c.x + r},${c.y}`;
  const dash = `${(6 / k).toFixed(2)} ${(4 / k).toFixed(2)}`;
  return (
    <g opacity={a}>
      {!front && <ellipse cx={c.x} cy={c.y} rx={r} ry={ry} fill={CYAN} opacity={0.12} />}
      {front && <path d={d} fill="none" stroke={CYAN} strokeWidth={Math.max(0.4, 7 / k)} opacity={0.18} />}
      <path d={d} fill="none" stroke={CYAN_HI} strokeWidth={Math.max(0.3, (front ? 4 : 3.2) / k)} strokeDasharray={dash} opacity={front ? 1 : 0.85} />
    </g>
  );
};

export const LabView4: React.FC<{s: Shot4; t: number; id: string}> = ({s, t, id}) => {
  const g = geoOf(s);
  const F0 = focusOf(s);
  const F: V = s.pinchAt ?? s.spot ?? F0;
  const Fw = {x: F.x, y: -F.y, z: 0};
  const age = nearestAge(t, s.tactile);
  const spotAge = nearestAge(t, s.spotEvents);
  return (
    <Lab
      id={id}
      s={{
        cam: s.cam,
        man: s.man,
        expr: s.expr,
        hand: {pose: s.pose, ang: s.ang, pad: s.pad},
        press: s.press,
        body: s.body,
        billboard: s.billboard,
        lightbox: s.lightbox,
        roundCans: true,
        wallBlur: s.macro > 0.05 ? 5 * s.macro : 0,
        glow: s.glowOn > 0.01 || s.waves > 0.01 ? (i, j) => phaseGlow(t, i, j, Fw, Math.max(s.glowOn, s.waves * 0.9), 0.4, 0.38) : undefined,
        under: (k) => (
          <g>
            {s.macro > 0.01 && <rect x={-3000} y={-3000} width={6000} height={6000} fill="#0B1E2B" opacity={0.7 * Math.min(1, s.macro)} />}
            <Waves t={t} F={F} on={s.waves} wavelets={s.wavelets} envelope={s.envelope} bands={s.bands} w={Math.max(0.5, 3.2 / k)} t0={s.waveT0} id={`${id}-wv`} />
            {s.pinchAt && <PinchRing c={s.pinchAt} k={k} a={s.passOutline} front={false} />}
            {!s.pinchAt && s.focus > 0.01 && <Focus c={F} r={Math.max(4.5, 40 / k)} a={s.focus} id={`${id}-fc`} squash={0.5} />}
          </g>
        ),
        overlay: (k) => (
          <g>
            <ButtonOutline c={F0} a={s.outline} k={k} />
            {s.pinchAt && (
              <g>
                {/* the imaginary button's glow stays where it is: the fingers close through it */}
                <Focus c={s.pinchAt} r={Math.max(3, 18 / k)} a={0.75 * Math.max(s.passOutline, 0.4) * (s.waves > 0.05 ? 1 : 0)} id={`${id}-pg`} squash={0.6} />
                <PinchRing c={s.pinchAt} k={k} a={s.passOutline} front />
              </g>
            )}
            {s.spot && (
              <g>
                <Focus c={s.spot} r={Math.max(6, 46 / k)} a={1} id={`${id}-sp`} squash={0.45} />
                <circle cx={s.spot.x} cy={s.spot.y} r={Math.max(1.2, 7 / k)} fill="#F2FDFF" />
                {spotAge > -0.02 && spotAge < 0.45 && (
                  <ellipse cx={s.spot.x} cy={s.spot.y} rx={3 + 20 * (spotAge / 0.45)} ry={(3 + 20 * (spotAge / 0.45)) * 0.3} fill="none" stroke={CYAN_HI} strokeWidth={Math.max(0.3, 4 / k)} opacity={1 - spotAge / 0.45} />
                )}
              </g>
            )}
            <FingerCut g={g} F={F0} open={s.cut} act={s.cutAct} t={t} k={k} id={`${id}-cut`} />
            <TactilePulse g={g} F={F0} age={age} k={k} id={`${id}-tp`} />
          </g>
        ),
      }}
    />
  );
};
