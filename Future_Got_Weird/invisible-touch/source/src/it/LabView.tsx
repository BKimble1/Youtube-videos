// Renders a lab shot (labShots.ts) with its explanatory overlays. The real scene (hand, array, bench) is drawn in the
// Weird Crew finish; everything cyan and glowing is the explanation, layered on top.
import React from 'react';
import {Lab, HAND_L} from './lab';
import {LabShot} from './labShots';
import {handGeo} from './hand';
import {Waves, Focus, Pulse, phaseGlow, CYAN} from './fx';
import {SkinSection} from './skin';
import {topMatrix, project} from './cam3';
import {V} from '../dc/math';

export const focusPoint = (s: LabShot): V => {
  const dir = {x: Math.cos((s.ang * Math.PI) / 180), y: Math.sin((s.ang * Math.PI) / 180)};
  const g0 = handGeo({W: {x: 0, y: 0}, dir, L: HAND_L}, s.pose);
  const W = {x: s.pad.x - g0.pad.x, y: s.pad.y - g0.pad.y};
  const g = handGeo({W, dir, L: HAND_L}, s.pose);
  const k = s.onPalm;
  // the focus sits a hair below the skin surface it presses on
  // just under the palm's skin (below the thumb, which lies along the palm's side in the flat hand)
  const palm = {x: g.palmPt.x + 2, y: g.palmPt.y + 5.5};
  return {x: g.pad.x + (palm.x - g.pad.x) * k, y: g.pad.y + 1.0 + (palm.y - g.pad.y - 1.0) * k};
};

export const LabView: React.FC<{s: LabShot; t: number; id: string}> = ({s, t, id}) => {
  const F = focusPoint(s);
  const dir = {x: Math.cos((s.ang * Math.PI) / 180), y: Math.sin((s.ang * Math.PI) / 180)};
  const g0 = handGeo({W: {x: 0, y: 0}, dir, L: HAND_L}, s.pose);
  const W = {x: s.pad.x - g0.pad.x, y: s.pad.y - g0.pad.y};
  const g = handGeo({W, dir, L: HAND_L}, s.pose);
  const tipAng = (Math.atan2(g.index.tipDir.y, g.index.tipDir.x) * 180) / Math.PI;
  const hd = s.trail && s.trail[0];
  const Fw = hd ? {x: F.x + hd.x, y: -F.y, z: hd.z} : {x: F.x, y: -F.y, z: s.focusZ};
  const trailOn = s.trail !== null;
  return (
    <g>
      <Lab
        id={id}
        s={{
          cam: s.cam,
          man: s.man,
          expr: s.expr,
          hand: {pose: s.pose, ang: s.ang, pad: s.pad},
          press: s.press,
          body: s.body,
          card: s.card,
          wallBlur: s.macro > 0.05 ? 6 * s.macro : 0,
          glow: s.glowOn > 0.01 || s.waves > 0.01 ? (i, j) => phaseGlow(t, i, j, Fw, Math.max(s.glowOn, s.waves * 0.9)) : undefined,
          under: (k) => (
            <g>
              {s.macro > 0.01 && <rect x={-3000} y={-3000} width={6000} height={6000} fill="#0B1E2B" opacity={0.72 * Math.min(1, s.macro)} />}
              <Waves t={t} F={F} on={s.waves} wavelets={s.wavelets} envelope={s.envelope} w={Math.max(0.5, 3.2 / k)} t0={s.waveT0} id={`${id}-wv`} />
            </g>
          ),
          overlay: (k) => (
            <g>
              {!trailOn && <Focus c={F} r={Math.max(4.5, 40 / k)} a={s.focus} id={`${id}-fc`} squash={0.5} />}
              {s.pulseOn > 0.01 && (
                <g opacity={s.pulseOn}>
                  <Pulse c={F} age={s.pulse} size={Math.max(24, 90 / k)} w={4 / k} />
                  <Focus c={F} r={Math.max(9, 40 / k)} a={Math.max(0, 1 - s.pulse / 0.6)} id={`${id}-pf`} squash={0.6} />
                </g>
              )}
              <SkinSection at={g.pad} ang={tipAng} R={7} open={s.section} act={s.sectionAct} t={t} ink={2.4 / k} id={`${id}-sk`} />
            </g>
          ),
        }}
      />
      {trailOn && <Trail s={s} F={F} />}
    </g>
  );
};

/** the moving focal point under the palm: a bright head and a fading dotted trail, in the horizontal plane at the
 *  palm's height (an ellipse from this camera), never a solid ring */
const Trail: React.FC<{s: LabShot; F: V}> = ({s, F}) => {
  const m = topMatrix(s.cam, 0, -F.y, 0);
  const pts = (s.trail ?? []).map((p, k) => ({p: project(s.cam, {x: F.x + p.x, y: -F.y, z: p.z}), k}));
  return (
    <g>
      {pts
        .slice()
        .reverse()
        .map(({p, k}) => (
          <circle key={k} cx={p.x} cy={p.y} r={(k === 0 ? 2.8 : 1.9 - k * 0.04) * m.scale} fill={k === 0 ? '#E8FBFF' : CYAN} opacity={k === 0 ? 0.95 : 0.8 * (1 - k / 30)} />
        ))}
      {pts[0] && <circle cx={pts[0].p.x} cy={pts[0].p.y} r={6 * m.scale} fill={CYAN} opacity={0.28} />}
    </g>
  );
};
