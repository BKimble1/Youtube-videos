// One frame (V2). The camera (story.camAt) looks at one desert world in cm; depth layers go through a pinhole dolly
// and soften with distance from the focus plane, where the animals are. Ink weights follow the zoom.
import React from 'react';
import {resetIds} from './core/ids';
import {clamp, lerp} from './lib';
import {Lizard} from './art/lizard';
import {Coyote, coyoteHeadWorld} from './art/coyote';
import {Section} from './art/section';
import {Jet} from './art/jet';
import {Far, Fore, Ground, Mid} from './art/desert';
import {Cam, camAt, coyoteAt, jetAt, lizardAt, sectionAt, spitAt} from './story';

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
  const sn = sectionAt(t);
  const jet = jetAt(t);
  const spit = spitAt(t);
  const px = c.w / 1080;
  const swL = clamp(3.4 * px, 0.006, 0.06);
  const swC = clamp(4.2 * px, 0.05, 0.3);
  // the coyote's head casts a soft shadow down and to the right (sun upper left)
  const hs = coyoteHeadWorld(cy, {x: 5, y: 0});
  const hh = Math.max(0, -hs.y);
  return (
    <div style={{position: 'absolute', inset: 0, filter: 'contrast(1.04) saturate(1.06)'}}>
      <Layer c={c} delta={320} min={3}>
        <Far />
      </Layer>
      <Layer c={c} delta={80} min={1.5}>
        <Mid />
      </Layer>
      <Layer c={c} delta={0} max={26}>
        <Ground />
        <ellipse cx={hs.x + 0.45 * hh} cy={0.6} rx={9 + 0.15 * hh} ry={2.2} fill="#3A2210" opacity={0.16 * clamp(1 - hh / 60)} />
        <Coyote c={cy} sw={swC} />
        <Lizard s={lz} sw={swL} cut={sn.reveal} section={sn.reveal > 0.001 ? (g, layer) => <Section s={sn} g={g} layer={layer} sw={swL} /> : undefined} />
        {jet && <Jet j={jet} sw={swL * 0.8} />}
        {spit.map((d, i) => <circle key={i} cx={d.p.x} cy={d.p.y} r={d.r} fill="#A3131C" stroke="#2A0608" strokeWidth={swL * 0.6} />)}
      </Layer>
      <Layer c={c} delta={-26} min={4} op={clamp((F / (1080 / c.w) - 40) / 30)}>
        <Fore />
      </Layer>
      {sn.shadow > 0.01 && (
        <div style={{position: 'absolute', inset: 0, opacity: sn.shadow,
          background: `radial-gradient(ellipse 75% 45% at ${lerp(130, 82, clamp((sn.t - 3.95) / 0.45))}% ${lerp(-5, 18, clamp((sn.t - 3.95) / 0.45))}%, rgba(35,14,6,0.55) 0%, rgba(35,14,6,0.3) 45%, rgba(35,14,6,0) 100%)`}} />
      )}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,226,170,0.16) 0%, rgba(255,226,170,0) 45%, rgba(60,25,10,0.12) 100%)'}} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 58%, rgba(20,8,4,0.38) 100%)'}} />
    </div>
  );
};
