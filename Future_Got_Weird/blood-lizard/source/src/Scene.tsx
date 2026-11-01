// One frame. The camera (story.camAt) looks at one desert world in cm; depth layers go through a pinhole dolly (a
// push-in moves near things more than far ones) and soften with distance from the focus plane, where the animals are.
// Ink weights follow the zoom so outlines keep a steady screen weight from the wide shot to the inside of the eye.
import React from 'react';
import {resetIds} from './core/ids';
import {clamp, lerp} from './lib';
import {Lizard, LizardState} from './art/lizard';
import {Coyote, coyoteHeadWorld, HEAD_K} from './art/coyote';
import {Sinus} from './art/sinus';
import {Jet} from './art/jet';
import {Far, Fore, Ground, Mid} from './art/desert';
import {Cam, camAt, coyoteAt, heldAt, jetAt, lizardAt, sinusAt} from './story';

const F = 3600;
const Layer: React.FC<{c: Cam; delta: number; focus?: number; min?: number; max?: number; op?: number; children: React.ReactNode}> = ({c, delta, focus = 0, min = 0, max = 34, op = 1, children}) => {
  const s0 = 1080 / c.w;
  const d = F / s0;
  if (d + delta < 4 || op <= 0.001) return null;
  const s = F / (d + delta);
  const coc = 0.3 * F * Math.abs(1 / (d + focus) - 1 / (d + delta));
  const b = Math.max(min, Math.min(max, coc));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op, filter: b > 0.4 ? `blur(${b.toFixed(1)}px)` : undefined}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <g transform={`translate(540 960) scale(${s}) translate(${-c.x} ${-c.y})`}>{children}</g>
      </svg>
    </div>
  );
};

export const Scene: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  resetIds(fkey);
  const c = camAt(t);
  const lz = lizardAt(t);
  const cy = coyoteAt(t);
  const sn = sinusAt(t);
  const jet = jetAt(t);
  const held = heldAt(t);
  const px = c.w / 1080;
  const swL = clamp(3.4 * px, 0.006, 0.06);
  const swC = clamp(4.2 * px, 0.05, 0.3);
  const lizard = (
    <Lizard s={lz} sw={swL} reveal={sn.reveal} shadow={!held} interior={sn.reveal > 0.001 ? (cd) => <Sinus s={sn} sw={swL / 1.16} clipD={cd} /> : undefined} />
  );
  // inside the jaws: the lizard (world) drawn through the inverse of the head's transform
  const Jw = coyoteHeadWorld(cy, {x: 0, y: 0});
  const inMouth = held ? (
    <g transform={`scale(${1 / HEAD_K}) rotate(${(-cy.ang * 180) / Math.PI}) translate(${-Jw.x} ${-Jw.y})`}>{lizard}</g>
  ) : undefined;
  // the coyote's head casts a soft shadow down and to the right (sun upper left)
  const hs = coyoteHeadWorld(cy, {x: 5, y: 0});
  const hh = Math.max(0, -hs.y);
  const shadowX = hs.x + 0.45 * hh;
  return (
    <div style={{position: 'absolute', inset: 0, filter: 'contrast(1.04) saturate(1.05)'}}>
      <Layer c={c} delta={320} min={3}>
        <Far />
      </Layer>
      <Layer c={c} delta={80} min={1.5}>
        <Mid />
      </Layer>
      <Layer c={c} delta={0} max={26}>
        <Ground />
        <ellipse cx={shadowX} cy={0.6} rx={9 + 0.15 * hh} ry={2.2} fill="#3A2210" opacity={0.18 * clamp(1 - hh / 60)} />
        <Coyote c={cy} sw={swC} inMouth={inMouth} />
        {!held && lizard}
        {jet && <Jet j={jet} sw={swL * 0.8} />}
      </Layer>
      <Layer c={c} delta={-26} min={4} op={clamp((F / (1080 / c.w) - 40) / 30)}>
        <Fore />
      </Layer>
      {/* the predator's head passing over the lizard: its shadow sweeps in from the upper left and hangs there */}
      {sn.shadow > 0.01 && (
        <div style={{position: 'absolute', inset: 0, opacity: sn.shadow,
          background: `radial-gradient(ellipse 75% 45% at ${lerp(-30, 18, clamp((sn.t - 3.95) / 0.45))}% ${lerp(-5, 18, clamp((sn.t - 3.95) / 0.45))}%, rgba(35,14,6,0.55) 0%, rgba(35,14,6,0.3) 45%, rgba(35,14,6,0) 100%)`}} />
      )}
      {/* warm low sun from the upper left, and a soft vignette */}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,226,170,0.16) 0%, rgba(255,226,170,0) 45%, rgba(60,25,10,0.12) 100%)'}} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 58%, rgba(20,8,4,0.38) 100%)'}} />
    </div>
  );
};
export type {LizardState};
