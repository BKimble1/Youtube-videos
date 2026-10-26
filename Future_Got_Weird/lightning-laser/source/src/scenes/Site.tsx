// The research site through a camera: sky, clouds, ranges, summit, apparatus, shelter, tower, beam, channel, bolt,
// channel motes, rain and foreground. Every input is a value of the shot's time, so a frame is a pure function.
import React from 'react';
import {Cam, Layer} from '../dc/camera';
import {clamp, fmt, hash} from '../dc/math';
import {Apparatus} from '../art/Apparatus';
import {Beam, Bolt, Channel, tipAt} from '../art/Bolt';
import {Clouds, Foreground, Rain, Ranges, Sky, Summit} from '../art/Env';
import {ShelterExt} from '../art/Shelter';
import {Tower} from '../art/Tower';
import {axisPt, BOLT, H0} from '../world/site';

export type SiteState = {
  /** revealed arc length of the bolt (-1: none) and its core brightness */
  boltS: number;
  boltCore: number;
  /** light the discharge throws on the scene 0..1 */
  flash: number;
  beam: number;
  pulses?: number[];
  channel: number;
  channelGrow?: number;
  /** loop time for the channel motes (continuous across the seam) */
  tau: number;
  rainT: number;
  drift: number;
  /** measurement bracket: 0..1 draw-on, label 0..1 */
  bracket?: number;
  label?: number;
  status?: number;
  hideRain?: boolean;
  /** the payoff: the channel drawn brighter and wider, with a bright core */
  channelBoost?: number;
};

/** motes in the channel (ionised, heated air drawn as small glowing dots): positions are functions of tau */
const MOTES = Array.from({length: 150}, (_, i) => ({h: H0 - 130 + 260 * hash(i, 201), off: (hash(i, 203) - 0.5) * 2, r: 0.32 + 0.4 * hash(i, 205), ph: 6.283 * hash(i, 207), sp: 0.6 + 0.8 * hash(i, 209), hue: hash(i, 211)}));
const Motes: React.FC<{z: number; tau: number; alpha: number}> = ({z, tau, alpha}) => {
  const vis = clamp((z - 3.5) / 4) * alpha;
  if (vis <= 0.01) return null;
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={vis}>
      {MOTES.map((m, i) => {
        const h = m.h + 3.2 * Math.sin(tau * m.sp + m.ph) + 1.2 * tau;
        const off = m.off * 6.2 + 0.7 * Math.sin(tau * m.sp * 1.7 + m.ph * 2);
        const p = axisPt(h, off);
        const tw = 0.6 + 0.4 * Math.sin(tau * 3.1 * m.sp + m.ph);
        return <circle key={i} cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(m.r)} fill={m.hue > 0.5 ? '#9FF6FF' : '#C9B8FF'} opacity={0.35 + 0.5 * tw} />;
      })}
    </g>
  );
};

/** the measurement bracket along the guided section: two end ticks on the axis's right, a line between, a label */
const Bracket: React.FC<{k: number; label: number; z: number}> = ({k, label, z}) => {
  if (k <= 0) return null;
  const off = 34;
  const g0 = axisPt(0, off), g1 = axisPt(300 * k, off);
  const t0a = axisPt(0, off - 12), t0b = axisPt(0, off + 12);
  const t1a = axisPt(300, off - 12), t1b = axisPt(300, off + 12);
  const sw = 4.4 / Math.pow(z, 0.6);
  const mid = axisPt(150, off + 26);
  return (
    <g>
      <g stroke="#0B151C" strokeWidth={fmt(sw + 3)} strokeLinecap="round" opacity={0.6}>
        <line x1={fmt(g0.x)} y1={fmt(g0.y)} x2={fmt(g1.x)} y2={fmt(g1.y)} />
      </g>
      <g stroke="#FFE27A" strokeWidth={fmt(sw)} strokeLinecap="round">
        <line x1={fmt(t0a.x)} y1={fmt(t0a.y)} x2={fmt(t0b.x)} y2={fmt(t0b.y)} />
        <line x1={fmt(g0.x)} y1={fmt(g0.y)} x2={fmt(g1.x)} y2={fmt(g1.y)} />
        {k >= 1 && <line x1={fmt(t1a.x)} y1={fmt(t1a.y)} x2={fmt(t1b.x)} y2={fmt(t1b.y)} />}
      </g>
      {label > 0 && (
        <text x={fmt(mid.x)} y={fmt(mid.y)} fontFamily='"Nunito Variable", sans-serif' fontWeight={900} fontSize={fmt(58 / Math.pow(z, 0.75))} fill="#FFE27A" stroke="#0B151C" strokeWidth={fmt(10 / Math.pow(z, 0.75))} paintOrder="stroke" opacity={label} dominantBaseline="middle">
          160+ ft
        </text>
      )}
    </g>
  );
};

export const SiteWorld: React.FC<{id: string; cam: Cam; st: SiteState}> = ({id, cam, st}) => {
  const top = st.boltS > 0 ? tipAt(BOLT.pts, Math.min(st.boltS, BOLT.total)) : undefined;
  return (
    <g>
      <Sky flash={st.flash} />
      <Ranges cam={cam} flash={st.flash} />
      <Clouds cam={cam} flash={st.flash} boltTop={top} drift={st.drift} />
      {!st.hideRain && <Rain cam={{...cam}} rt={st.rainT} flash={st.flash} />}
      <Layer cam={cam} depth={1}>
        <Summit flash={st.flash} />
        <Apparatus id={`${id}-ap`} flash={st.flash} on={st.beam} status={st.status ?? 1} />
        <ShelterExt flash={st.flash} />
        <Tower id={`${id}-tw`} flash={st.flash} aviation={0.5 + 0.5 * Math.sin(st.rainT * 3.4)} />
        <Beam id={`${id}-bm`} z={cam.z} alpha={st.beam * (1 - 0.6 * clamp((cam.z - 2.5) / 4))} pulses={st.pulses} pulseK={1 - clamp((cam.z - 3) / 5)} />
        <Channel id={`${id}-ch`} z={cam.z} alpha={st.channel} grow={st.channelGrow ?? 1} boost={st.channelBoost ?? 0} />
        <Motes z={cam.z} tau={st.tau} alpha={st.channel} />
        <Bolt id={`${id}-bt`} s={st.boltS} core={st.boltCore} z={cam.z} />
        <Bracket k={st.bracket ?? 0} label={st.label ?? 0} z={cam.z} />
      </Layer>
      <Foreground cam={cam} flash={st.flash} />
    </g>
  );
};
