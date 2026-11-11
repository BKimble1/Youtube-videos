// Sequences A-C in the assembly cell, one continuous camera path (0 - 14.9 s):
//  A  the hook (the backpack snaps on), the insect wakes and crawls toward the lens, the camera rises to reveal the cell;
//  B  "68 seconds": in closer on the station; the next insect's whole assembly cycle plays sped up under a timer, the
//     vision system finding the attach site first;
//  C1 "a robotic arm grabs a tiny computer and attaches it to the cockroach's back": the gripper picks a backpack at the
//     tray, carries it over, and a low side view shows the electrodes sliding under the rear edge of the pronotum (the
//     shield turns translucent there) before the hooks clip on;
//  C2 "tiny electrodes deliver electrical pulses that can make the bug turn": in to the backpack (chip, battery,
//     electrodes labelled), the insect is released and walks; a pulse runs down one electrode and the insect turns,
//     its own legs doing the walking.
import React from 'react';
import {add3, Basis, Orbit, proj, V3} from '../core/three';
import {at, chain} from '../camera';
import {ring, ss} from '../lib';
import {LabView} from './LabView';
import {HOOK_O} from './hook';
import {armAt, bugAt} from '../story';
import {PACK_PTS, packPt, electrodePts} from '../kit/backpack';
import {toW} from '../core/frame';
import {PACK_SEAT, MEMBRANE} from '../roach/rig';
import {TRAY_SLOTS} from '../kit/lab';
import {Callout, PulseTag, Timer68, VisionBracket} from './overlays';

const SEAT: V3 = [0, PACK_SEAT[0], PACK_SEAT[2]];
const bodyAt = (k: number, t: number, dz = 6): V3 => add3(bugAt(k, t).st.body.o, [0, 0, dz]);

export const labCamA_C = (t: number): Orbit =>
  chain(t, (tt) => HOOK_O(tt), [
    // follow the woken insect as it crawls toward the lens
    {a: 1.3, b: 2.35, o: (tt) => at(add3(bodyAt(0, tt), [0, 4, 0]), 160, 47, 14.5, 1000)},
    // rise and pull back: the whole cell (station, conveyor with waiting insects, tray, arm, arena)
    {a: 2.2, b: 4.05, o: () => at([-30, 10, 0], 168, 58, 4.3, 980)},
    // B: in on the station and tray for the sped-up cycle
    {a: 4.15, b: 4.95, o: () => at([-38, -28, 8], 172, 54, 7.4, 1060)},
    // C1: to the tray as the gripper comes down for the next backpack
    {a: 6.15, b: 6.95, o: () => at(add3(TRAY_SLOTS[1], [0, 0, 4]), 176, 50, 15, 1040)},
    // carry: follow the held backpack toward the station
    {a: 7.45, b: 8.45, o: (tt) => at(add3(armAt(tt).arm.tcp, [0, 0, -2]), 160, 40, 15, 1000)},
    // low side view of the seat for the insertion
    {a: 8.3, b: 9.3, o: () => at(add3(SEAT, [1, 4, -2.5]), 128, 24, 30, 1000)},
    // C2: over and into the backpack
    {a: 10.15, b: 10.95, o: () => at(add3(SEAT, [0, 0, 1.5]), 128, 66, 40, 900)},
    // follow the released insect
    {a: 11.2, b: 12.2, o: (tt) => at(bodyAt(2, tt, 4), 130, 72, 17, 960)},
    // rise for the turn
    {a: 12.6, b: 14.0, o: () => at([-14, 112, 0], 120, 82, 8.2, 900)},
  ]);

/** the snap: a short camera kick (screen space), decaying */
const kick = (t: number) => ({x: 3.5 * ring(t, 0.42, 9, 0.07), y: 7 * ring(t, 0.42, 8, 0.07)});

const pulseFor = (t: number) => (k: number) => {
  if (k !== 2) return undefined;
  for (const p0 of [12.38, 12.9, 13.35]) {
    const u = (t - p0) / 0.38;
    if (u > 0 && u < 1.25) return {t: u, side: -1 as const};
  }
  return undefined;
};

/** the turn: a dashed trail drawn on the bench behind the walking insect, with an arrowhead at the insect */
const turnTrail = (t: number) => (B: Basis) => {
  const a = ss(t, 12.7, 13.0) * (1 - ss(t, 14.6, 14.85));
  if (a <= 0) return [];
  const pts: string[] = [];
  for (let tt = 11.6; tt <= t; tt += 0.05) {
    const p = proj(B, add3(bugAt(2, tt).st.body.o, [0, 0, 0.2]));
    pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  if (pts.length < 2) return [];
  return [{z: 1e7 - 10, el: (
    <g key="trail" opacity={a}>
      <polyline points={pts.join(' ')} fill="none" stroke="#0E1E2B" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />
      <polyline points={pts.join(' ')} fill="none" stroke="#FFD84A" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 22" />
    </g>
  )}];
};

export const LabA_C: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  const O = labCamA_C(t);
  const kk = kick(t);
  const overlay = (B: Basis) => {
    const els: React.ReactNode[] = [];
    // B: the vision bracket on the next insect before the arm comes in
    if (t > 4.4 && t < 5.15) {
      const st = bugAt(1, t).st;
      const ctr = proj(B, toW(st.body, [-4, 0, 6]));
      const tgt = proj(B, toW(st.body, MEMBRANE));
      const sz = 46 * ctr.s;
      els.push(<VisionBracket key="vb" box={{x: ctr.x - sz * 0.7, y: ctr.y - sz * 0.62, w: sz * 1.4, h: sz * 1.24}} target={tgt} a={ss(t, 4.44, 4.56) * (1 - ss(t, 5.0, 5.12))} lock={ss(t, 4.58, 4.86)} />);
    }
    // C1: the electrodes going under the pronotum (side view)
    if (t > 8.9 && t < 10.5) {
      const b = bugAt(2, t);
      const a = ss(t, 9.0, 9.35) * (1 - ss(t, 10.25, 10.45));
      const e = electrodePts({F: {...b.st.body, o: armAt(t).arm.tcp}, led: 0, hook: 0}, 1);
      const tip = proj(B, b.fitted && b.pack ? electrodePts(b.pack, 1)[3] : e[3]);
      els.push(<Callout key="ce" p={tip} to={{x: tip.x + 150, y: tip.y - 360}} text="ELECTRODES" a={a} align="left" />);
    }
    // C2: the backpack's parts
    if (t > 10.45 && t < 12.3) {
      const b = bugAt(2, t);
      if (b.pack) {
        const a = (d: number) => ss(t, 10.55 + d, 10.85 + d) * (1 - ss(t, 11.95, 12.2));
        const chip = proj(B, packPt(b.pack, PACK_PTS.chip));
        const batt = proj(B, packPt(b.pack, PACK_PTS.batt));
        const el = proj(B, electrodePts(b.pack, -1)[2]);
        els.push(<Callout key="c1" p={chip} to={{x: chip.x + 120, y: chip.y - 300}} text="CONTROL CHIP" a={a(0)} align="left" />);
        els.push(<Callout key="c2" p={batt} to={{x: batt.x - 140, y: batt.y + 280}} text="BATTERY" a={a(0.18)} align="right" />);
        els.push(<Callout key="c3" p={el} to={{x: Math.min(980, el.x + 60), y: el.y - 420}} text="ELECTRODES" a={a(0.36)} align="left" />);
      }
    }
    // C2: the pulse readout
    if (t > 12.25 && t < 14.0) {
      els.push(<PulseTag key="pt" x={600} y={330} a={ss(t, 12.3, 12.45) * (1 - ss(t, 13.75, 13.95))} phase={(t - 12.3) * 1.4} />);
    }
    return <>{els}</>;
  };
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translate(${kk.x.toFixed(2)}px, ${kk.y.toFixed(2)}px)`}}>
      <LabView t={t} orbit={O} fkey={fkey} o={{extra: turnTrail(t), pulse: pulseFor(t), pronoOp: (k) => (k === 2 ? 1 - 0.62 * ss(t, 8.95, 9.3) * (1 - ss(t, 10.2, 10.5)) : undefined)}} overlay={overlay} />
      <Timer68 t={t} t0={4.4} t1={5.5} out={6.2} />
    </div>
  );
};
