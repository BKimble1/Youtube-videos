// One room-scale frame: the lab, the emitter and cart, the beam and the three Crew characters, all painted far to near
// from one camera in the shared world.
import React from 'react';
import {INK} from './rig/cast';
import {Crew4, Hold, Pose4} from './rig/Crew';
import {basis, Cam, cardOf, V3} from './rig/geo';
import {Body4, Look4} from './rig/cast';
import {depth, Item, paint} from './art/d3';
// the beam is painted in depth order at its far end: a head turned so that her ear is behind it covers the beam's end;
// a head in the way is drawn under the beam that ends on it
import {labItems, PAL} from './art/Lab';
import {Beam, emitterItems} from './art/Emitter';

export type Actor = {id: string; look: Look4; b: Body4; pose: Pose4; g: V3; h: number; holdL?: Hold; holdR?: Hold; earCU?: number; hide?: boolean};
export type BeamState = {vis: number; end: V3; prog?: number; hit?: number; pulses?: number; sweep?: number; rings?: number};
/** the beam's place in the paint order: just before or just after one actor (the head it ends on) */
export type BeamSort = {id: string; after: boolean};
export type SceneState = {t: number; cam: Cam; actors: Actor[]; beam?: BeamState; on?: number; dial?: number; lane?: number; tapeLit?: number; open?: number; spin?: number; beamSort?: BeamSort};

/** held props (hand-local rig units; counter-rotated so they stay upright on screen) */
export const phoneHold = (tilt = 0, glow = 1): Hold => (rot) => ({
  back: (
    <g transform={`rotate(${-rot + tilt})`}>
      <rect x={-13} y={-34} width={26} height={46} rx={5} fill="#2B2B33" stroke={INK} strokeWidth={3} />
      <rect x={-10} y={-30} width={20} height={36} rx={2} fill={glow > 0.5 ? '#BFE8E3' : '#4C6A75'} />
      <rect x={-6} y={-24} width={12} height={3} rx={1.5} fill="#1CA7A0" opacity={glow} />
      <rect x={-6} y={-18} width={9} height={3} rx={1.5} fill="#4F7CC9" opacity={glow} />
    </g>
  ),
});
export const cupHold = (): Hold => (rot) => ({
  back: (
    <g transform={`rotate(${-rot})`}>
      <path d="M -15 -34 L 15 -34 L 12 12 L -12 12 Z" fill="#FFFBF0" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <rect x={-15.5} y={-18} width={31} height={14} fill="#EF6B55" stroke={INK} strokeWidth={2.4} />
      <rect x={-17} y={-40} width={34} height={8} rx={3} fill="#3F5560" stroke={INK} strokeWidth={3} />
    </g>
  ),
});

export const RoomScene: React.FC<SceneState> = (s) => {
  const b = basis(s.cam);
  const {items, back} = labItems(b, s.t, {lane: s.lane, tapeLit: s.tapeLit});
  const all: (Item | null)[] = [...items, ...emitterItems(b, s.t, {on: s.on, dial: s.dial, open: s.open, spin: s.spin})];
  const dOf: Record<string, number> = {};
  for (const a of s.actors) {
    if (a.hide) continue;
    const cd = cardOf(b, a.g, a.h);
    if (cd.depth < 0.15) continue;
    dOf[a.id] = cd.depth;
    all.push({d: cd.depth, node: <Crew4 key={a.id} id={`${a.id}${Math.round(s.t * 1000)}`} look={a.look} b={a.b} pose={a.pose} cd={cd} t={s.t} holdL={a.holdL} holdR={a.holdR} earCU={a.earCU} />});
  }
  const bs = s.beamSort && dOf[s.beamSort.id] !== undefined ? dOf[s.beamSort.id] + (s.beamSort.after ? -1e-4 : 1e-4) : undefined;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect x={0} y={0} width={1080} height={1920} fill={PAL.wall} />
      {back}
      {paint(s.beam ? [...all, {d: bs ?? depth(b, s.beam.end) - 0.03, node: <Beam key="beam" b={b} t={s.t} {...s.beam} />}] : all)}
    </svg>
  );
};
