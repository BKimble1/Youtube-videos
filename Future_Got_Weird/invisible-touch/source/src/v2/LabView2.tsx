// V2 lab renderer: the V1 lab world (it/lab.tsx) with the V2 overlays. Real scene in the Weird Crew finish; all cyan,
// glowing or dashed shapes are the explanation.
import React from 'react';
import {Lab, HAND_L} from '../it/lab';
import {handGeo} from '../it/hand';
import {Waves, Focus, Pulse, phaseGlow, CYAN, CYAN_HI, ROW} from '../it/fx';
import {SkinSection} from '../it/skin';
import {DEV_TOP} from '../it/device';
import {Shot2} from './shots2';
import {V} from '../dc/math';

export const geoOf = (s: Shot2) => {
  const dir = {x: Math.cos((s.ang * Math.PI) / 180), y: Math.sin((s.ang * Math.PI) / 180)};
  const g0 = handGeo({W: {x: 0, y: 0}, dir, L: HAND_L}, s.pose);
  const W = {x: s.pad.x - g0.pad.x, y: s.pad.y - g0.pad.y};
  return handGeo({W, dir, L: HAND_L}, s.pose);
};
export const focusOf = (s: Shot2): V => {
  const g = geoOf(s);
  const palm = {x: g.palmPt.x + 2, y: g.palmPt.y + 5.5};
  const k = s.onPalm;
  return {x: g.pad.x + (palm.x - g.pad.x) * k, y: g.pad.y + 1 + (palm.y - g.pad.y - 1) * k};
};

/** a conceptual button outline (dashed, glowing, see-through) lying in the air at the focus: an idea, not an object */
export const ButtonOutline: React.FC<{c: V; a: number; k: number; tilt?: number}> = ({c, a, k, tilt = 0.32}) => {
  if (a <= 0.01) return null;
  const r = Math.max(15, 34 / k) * (0.85 + 0.15 * a);
  const w = 2.2 / k;
  const dash = `${(7 / k).toFixed(2)} ${(5 / k).toFixed(2)}`;
  return (
    <g opacity={a}>
      <ellipse cx={c.x} cy={c.y + 1.5} rx={r * 1.25} ry={r * tilt * 1.25} fill={CYAN} opacity={0.1} />
      <ellipse cx={c.x} cy={c.y + 1.5} rx={r} ry={r * tilt} fill="none" stroke={CYAN_HI} strokeWidth={w * 1.4} strokeDasharray={dash} />
      <ellipse cx={c.x} cy={c.y + 1.5 + r * 0.12} rx={r} ry={r * tilt} fill="none" stroke={CYAN} strokeWidth={w} strokeDasharray={dash} opacity={0.6} />
      <ellipse cx={c.x} cy={c.y + 1.5} rx={r * 0.62} ry={r * tilt * 0.62} fill="none" stroke={CYAN_HI} strokeWidth={w * 0.8} strokeDasharray={dash} opacity={0.7} />
    </g>
  );
};

export const LabView2: React.FC<{s: Shot2; t: number; id: string}> = ({s, t, id}) => {
  const F = focusOf(s);
  const g = geoOf(s);
  const tipAng = (Math.atan2(g.index.tipDir.y, g.index.tipDir.x) * 180) / Math.PI;
  const Fw = {x: F.x, y: -F.y, z: 0};
  const EY = -DEV_TOP;
  const overlayFocus = (k: number) => <Focus c={F} r={Math.max(4.5, 40 / k)} a={s.focus} id={`${id}-fc`} squash={0.5} />;
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
        wallBlur: s.macro > 0.05 ? 5 * s.macro : 0,
        glow: s.glowOn > 0.01 || s.waves > 0.01 ? (i, j) => phaseGlow(t, i, j, Fw, Math.max(s.glowOn, s.waves * 0.9), 0.4, 0.38) : undefined,
        under: (k) => (
          <g>
            {s.macro > 0.01 && <rect x={-3000} y={-3000} width={6000} height={6000} fill="#0B1E2B" opacity={0.7 * Math.min(1, s.macro)} />}
            <Waves t={t} F={F} on={s.waves} wavelets={s.wavelets} envelope={s.envelope} bands={s.bands} w={Math.max(0.5, 3.2 / k)} t0={s.waveT0} id={`${id}-wv`} />
            {/* convergence geometry: a ray from every emitter in the section to the focus, drawn as it grows */}
            {s.rays > 0.01 &&
              ROW.map((x, i) => {
                const L = Math.hypot(F.x - x, F.y - EY);
                const grow = Math.min(1, s.rays * 1.4 - (Math.abs(i - 7.5) / 7.5) * 0.4);
                if (grow <= 0) return null;
                return <line key={i} x1={x} y1={EY} x2={x + (F.x - x) * grow} y2={EY + (F.y - EY) * grow} stroke={CYAN_HI} strokeWidth={Math.max(0.3, 1.6 / k)} strokeOpacity={0.55 * s.rays} strokeDasharray={`${(L * 0.04).toFixed(2)} ${(L * 0.02).toFixed(2)}`} />;
              })}
            {!s.focusOver && overlayFocus(k)}
          </g>
        ),
        overlay: (k) => (
          <g>
            {s.focusOver && overlayFocus(k)}
            <ButtonOutline c={F} a={s.outline} k={k} />
            {s.ripple > 0.01 &&
              [0, 1, 2].map((i) => {
                const ph = (t * 3 + i / 3) % 1;
                const r = 2 + ph * 7;
                return <ellipse key={i} cx={F.x} cy={F.y - 0.6} rx={r} ry={r * 0.32} fill="none" stroke={CYAN_HI} strokeWidth={Math.max(0.15, 1.4 / k)} opacity={s.ripple * 0.7 * (1 - ph)} />;
              })}
            {s.pulseOn > 0.01 && (
              <g opacity={s.pulseOn}>
                <Pulse c={F} age={s.pulse} size={Math.max(20, 80 / k)} w={4 / k} />
                <Focus c={F} r={Math.max(8, 38 / k)} a={Math.max(0, 1 - s.pulse / 0.6)} id={`${id}-pf`} squash={0.6} />
              </g>
            )}
            <SkinSection at={g.pad} ang={tipAng} R={s.sectionR} open={s.section} act={s.sectionAct} t={t} ink={2.4 / k} id={`${id}-sk`} />
          </g>
        ),
      }}
    />
  );
};
void CYAN;
