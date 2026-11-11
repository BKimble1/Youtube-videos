// V2 lab sequences (one world, continuous camera paths):
//  A  0.00-2.00  the payoff first: a cyborg in a narrow passage, antennae in the slot, cyan LED; a cyan command reaches
//                the backpack, a pulse runs down the electrode, the insect turns into the side passage (lateral
//                track); pull back: the passage sits in a lab beside an assembly station; push onto its backpack.
//     2.00-4.30  match cut on the backpack: a white mount with its board, held in the gripper, coming down onto a
//                clamped insect; electrodes slide into the membrane under the (translucent) pronotum; the hooks latch;
//                cyan LED; the battery plugs in; orbit to a clean side profile as it walks away.
//  B  4.30-6.43  "68 seconds": the cell from above, the next insect fixed -> scanned (the wrist camera finds the
//                pronotum and the implant point) -> backpack grasped -> implanted -> latched -> released, sped up
//                under a FIX -> RELEASE timer.
//  C1 6.43-10.4  real time: the gripper grabs a backpack at the tray ("grabs"), carries it, a low side view of the
//                implant through the translucent pronotum, the hooks latch on "back".
//  C2 10.4-14.9  the finished backpack (angled), the insect released; ground-level follow with a wireless command;
//                close on the thorax: pulses run down the electrode (orange stimulation flash at the tip); the insect
//                turns away from a small block; overhead: the straight path it was on (dashed) vs the turn it took.
//  G  26.74-end  the ending (tau = t - DUR): the same cyborg in a pool of light beside a parked tiny robot; pull back
//                over the lab; it walks toward the lens; the camera drops to its level and follows it round into the
//                passage, where the film began.
import React from 'react';
import {add3, Basis, Orbit, proj, V3} from '../core/three';
import {Item} from '../core/draw3';
import {toW} from '../core/frame';
import {at, chain} from '../camera';
import {DUR, ring, ss} from '../lib';
import {PACK_SEAT, MEMBRANE} from '../roach/rig';
import {pathAt} from '../roach/gait';
import {LabView2} from './LabView2';
import {armAt2, bugAt2, OBSTACLE, ocState, R2_PATH, R2_TURN_S, r2Travel} from './story2';
import {elecPts, packPt2, PTS2} from './pack2';
import {TRAY2_SLOTS, ROBOT_PARK} from './lab2';
import {Callout, PulseTag, Timer68} from '../scenes/overlays';
import {SegOverlay, Trajectory, Wireless} from './overlays2';

const SEAT: V3 = [0, PACK_SEAT[0], PACK_SEAT[2]];
const thorax = (st: ReturnType<typeof ocState>['st'], dz = 6): V3 => toW(st.body, [2, 0, dz]);

// ------------------------------------------------------------------ the opening camera (a pure function of tau)
export const openCam = (tau: number): Orbit => {
  const oc = ocState(tau).st;
  const tgt = (u: number) => thorax(ocState(u).st, 7);
  // macro on the insect at the slot, tracking it laterally through the turn
  const near = at(add3(tgt(tau), [0, 0, 0]), 112 + 14 * ss(tau, 0.3, 0.8), 24, 27, 1040);
  // pull back over the lab: the passage, the assembly station behind it, insects waiting on the conveyor
  const wide = at([30, 120, 8], 150, 30, 4.4, 960);
  // push onto its backpack
  const pk = at(toW(oc.body, [PACK_SEAT[0], 0, PACK_SEAT[2] + 1]), 140, 38, 30, 960);
  let o = near;
  const a = ss(tau, 0.78, 1.32), b = ss(tau, 1.36, 1.98);
  const lerp = (x: Orbit, y: Orbit, u: number): Orbit => ({...x, target: [0, 1, 2].map((i) => x.target[i] + (y.target[i] - x.target[i]) * u) as V3, az: x.az + (y.az - x.az) * u, el: x.el + (y.el - x.el) * u, d: x.d * Math.pow(y.d / x.d, u), cy: (x.cy ?? 960) + ((y.cy ?? 960) - (x.cy ?? 960)) * u});
  o = lerp(o, wide, a);
  o = lerp(o, pk, b);
  return o;
};

export const camA_C = (t: number): Orbit =>
  chain(t, (tt) => (tt < 1.999 ? openCam(tt) : at(add3(armAt2(tt).arm.tcp, [0, 0, 1]), 140, 38, 30, 960)), [
    // the installation: track down with the gripper, then low to the seat for the implant
    {a: 2.0, b: 2.55, o: (tt) => at(add3(armAt2(tt).arm.tcp, [0, 0, 0]), 128, 30, 30, 980)},
    {a: 2.45, b: 2.95, o: () => at(add3(SEAT, [0, 4, -2.5]), 112, 18, 34, 1000)},
    // macro on the contacts and the latch, the LED, the battery
    {a: 3.02, b: 3.45, o: () => at(add3(SEAT, [0, 0, 1]), 118, 44, 40, 960)},
    // orbit to a clean side profile as it starts to walk
    {a: 3.5, b: 4.25, o: (tt) => at(add3(bugAt2(0, tt).st.body.o, [0, 6, 7]), 92, 9, 15, 1020)},
    // B: rise over the cell for the sped-up cycle
    {a: 4.25, b: 4.95, o: () => at([-34, -24, 8], 128, 56, 6.6, 1060)},
    // C1: to the tray as the gripper comes down for the next backpack
    {a: 6.15, b: 6.95, o: () => at(add3(TRAY2_SLOTS[1], [0, 0, 4]), 140, 44, 16, 1040)},
    {a: 7.45, b: 8.45, o: (tt) => at(add3(armAt2(tt).arm.tcp, [0, 0, -2]), 122, 36, 15, 1000)},
    {a: 8.3, b: 9.3, o: () => at(add3(SEAT, [1, 4, -2.5]), 110, 18, 32, 1000)},
    // C2: the finished backpack from an angle
    {a: 10.1, b: 10.8, o: () => at(add3(SEAT, [0, 0, 1.5]), 128, 58, 36, 920)},
    // ground level, following the walk
    {a: 11.15, b: 11.9, o: (tt) => at(add3(bugAt2(2, tt).st.body.o, [0, 10, 6]), 168, 7, 17, 1080)},
    // close on the thorax for the pulses
    {a: 12.05, b: 12.6, o: (tt) => at(thorax(bugAt2(2, tt).st, 8), 150, 36, 28, 980)},
    // rise as it turns
    {a: 13.35, b: 14.05, o: (tt) => at(add3(bugAt2(2, tt).st.body.o, [0, 0, 4]), 150, 62, 12, 960)},
    // overhead: the path
    {a: 14.0, b: 14.89, o: () => at([-14, 118, 0], 150, 84, 7.6, 980)},
  ]);

const kick = (t: number) => ({x: 2.2 * ring(t, 2.98, 9, 0.06) + 1.6 * ring(t, 10.15, 9, 0.06), y: 4.5 * ring(t, 2.98, 8, 0.06) + 3 * ring(t, 10.15, 8, 0.06)});

const pulseFor = (t: number) => (k: number) => {
  if (k !== 2) return undefined;
  for (const p0 of [12.36, 12.84, 13.28]) {
    const u = (t - p0) / 0.3;
    if (u > 0 && u < 1.35) return {t: u, side: 1 as const};
  }
  return undefined;
};

/** the control demo's two paths, on the bench: straight on (dashed grey), and the turn it took (cyan) */
const paths = (t: number) => (B: Basis): Item[] => {
  const a = ss(t, 13.5, 13.8);
  if (a <= 0) return [];
  const sNow = r2Travel(t);
  const p0 = pathAt(R2_PATH, R2_TURN_S);
  const straight = [0, 30, 60, 90, 110].map((d) => proj(B, [p0.p[0], p0.p[1] + d, 0.3]));
  const took: {x: number; y: number}[] = [];
  for (let s = R2_TURN_S - 40; s <= sNow; s += 3) {
    const q = pathAt(R2_PATH, s);
    took.push(proj(B, [q.p[0], q.p[1], 0.3]));
  }
  return [{z: 1e7 - 10, el: <Trajectory key="traj" a={a} straight={straight} took={took} />}];
};

export const LabA_C2: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  const O = camA_C(t);
  const kk = kick(t);
  const overlay = (B: Basis) => {
    const els: React.ReactNode[] = [];
    // A: the steering command arriving at the backpack (a cyan signal from off-frame), then the pulse (in the pack)
    if (t < 0.6) {
      const oc = ocState(t);
      const ant = proj(B, packPt2(oc.pack, [-12, 6, 6.2]));
      els.push(<Wireless key="w0" to={ant} a={ss(t, 0.0, 0.06) * (1 - ss(t, 0.4, 0.58))} phase={t / 0.3} from={{x: 1180, y: ant.y - 520}} />);
    }
    // B: the wrist camera's segmentation of the pronotum and the implant reference point
    if (t > 4.42 && t < 4.82) {
      const st = bugAt2(1, t).st;
      const pts = [[24, 0], [20, 12], [10, 14.2], [4, 11], [4, -11], [10, -14.2], [20, -12]].map(([x, y]) => proj(B, toW(st.body, [x, y, 8.6])));
      const ref = proj(B, toW(st.body, [MEMBRANE[0] - 1.2, 0, 8.6]));
      els.push(<SegOverlay key="seg" pts={pts} refPt={ref} a={ss(t, 4.44, 4.52) * (1 - ss(t, 4.72, 4.8))} lock={ss(t, 4.55, 4.66)} />);
    }
    // the implant views: electrodes into the membrane
    if (t > 2.5 && t < 3.05) {
      const b = bugAt2(0, t);
      const tip = proj(B, toW(b.st.body, [5.3, 2.2, 7.3]));
      els.push(<Callout key="ce0" p={tip} to={{x: tip.x - 200, y: tip.y - 330}} text="ELECTRODES" a={ss(t, 2.55, 2.8) * (1 - ss(t, 2.95, 3.05))} align="right" />);
    }
    if (t > 9.0 && t < 10.45) {
      const b = bugAt2(2, t);
      const tip = proj(B, toW(b.st.body, [5.3, -2.2, 7.3]));
      els.push(<Callout key="ce" p={tip} to={{x: tip.x + 150, y: tip.y - 360}} text="ELECTRODES → MEMBRANE" a={ss(t, 9.05, 9.4) * (1 - ss(t, 10.2, 10.42))} align="left" />);
    }
    // C2: the parts, briefly
    if (t > 10.45 && t < 11.35) {
      const b = bugAt2(2, t);
      if (b.pack) {
        const a = (d: number) => ss(t, 10.5 + d, 10.75 + d) * (1 - ss(t, 11.1, 11.3));
        const chip = proj(B, packPt2(b.pack, PTS2.chip));
        const batt = proj(B, packPt2(b.pack, PTS2.batt));
        els.push(<Callout key="c1" p={chip} to={{x: chip.x + 110, y: chip.y - 280}} text="CONTROLLER + RADIO" a={a(0)} align="left" />);
        els.push(<Callout key="c2" p={batt} to={{x: batt.x - 120, y: batt.y + 300}} text="BATTERY" a={a(0.15)} align="right" />);
      }
    }
    // C2: the wireless command, then the pulse readout
    if (t > 11.7 && t < 12.45) {
      const b = bugAt2(2, t);
      if (b.pack) {
        const ant = proj(B, packPt2(b.pack, [-12, 6, 6.2]));
        els.push(<Wireless key="w2" to={ant} a={ss(t, 11.72, 11.85) * (1 - ss(t, 12.3, 12.45))} phase={(t - 11.72) / 0.25} from={{x: 140, y: 380}} />);
      }
    }
    if (t > 12.3 && t < 13.75) els.push(<PulseTag key="pt" x={620} y={330} a={ss(t, 12.32, 12.45) * (1 - ss(t, 13.55, 13.72))} phase={(t - 12.3) * 1.4} />);
    return <>{els}</>;
  };
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translate(${kk.x.toFixed(2)}px, ${kk.y.toFixed(2)}px)`}}>
      <LabView2
        t={t}
        orbit={O}
        fkey={fkey}
        o={{
          extra: paths(t),
          pulse: pulseFor(t),
          oc: t < 4.3,
          ocTau: t,
          obstacle: ss(t, 10.9, 11.2),
          xray: (k) => (k === 0 ? ss(t, 2.45, 2.6) * (1 - ss(t, 3.0, 3.2)) : k === 2 ? ss(t, 8.95, 9.3) * (1 - ss(t, 10.2, 10.5)) + ss(t, 12.2, 12.4) * (1 - ss(t, 13.4, 13.6)) : 0),
          pronoOp: (k) => (k === 'oc' ? 1 - 0.55 * ss(t, 0.16, 0.26) * (1 - ss(t, 0.56, 0.7)) : k === 0 ? 1 - 0.62 * ss(t, 2.45, 2.6) * (1 - ss(t, 3.0, 3.2)) : k === 2 ? 1 - 0.62 * (ss(t, 8.95, 9.3) * (1 - ss(t, 10.2, 10.5)) + ss(t, 12.2, 12.4) * (1 - ss(t, 13.4, 13.6))) : undefined),
        }}
        overlay={overlay}
      />
      <Timer68 t={t} t0={4.36} t1={5.6} out={6.22} note="FIX → RELEASE · PER INSECT · SPED UP" />
    </div>
  );
};

// ------------------------------------------------------------------ the ending
export const camG = (t: number): Orbit => {
  const tau = (tt: number) => tt - DUR;
  const oc = (tt: number) => ocState(tau(tt)).st;
  return chain(t, (tt) => at(thorax(oc(tt), 7), 118, 13, 17, 1060), [
    // pull back over the lab: several finished insects, the station, the passage
    {a: 27.35, b: 28.25, o: (tt) => at(add3(thorax(oc(tt), 0), [-40, -60, 0]), 96, 30, 4.6, 980)},
    // it walks toward the lens; the camera comes down to its level
    {a: 28.2, b: 29.05, o: (tt) => at(thorax(oc(tt), 6), 72, 8, 15, 1080)},
    // follow it round the bend into the passage (orbit with it)
    {a: 29.0, b: 30.4, o: (tt) => at(thorax(oc(tt), 7), 118, 12, 20, 1040)},
    {a: 30.1, b: DUR, o: (tt) => openCam(tau(tt))},
  ]);
};

export const LabG2: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  const O = camG(t);
  const overlay = (B: Basis) => {
    // a quiet tag on the parked robot vs the insect (the contrast)
    const a = ss(t, 27.0, 27.25) * (1 - ss(t, 28.05, 28.3));
    if (a <= 0) return null;
    const rb = proj(B, add3(ROBOT_PARK, [0, 0, 22]));
    const oc = proj(B, thorax(ocState(t - DUR).st, 16));
    return (
      <>
        {rb.z > 30 && rb.x > 60 && rb.x < 1020 && rb.y > 300 && <Callout p={rb} to={{x: rb.x + 30, y: rb.y - 160}} text="BUILT FROM SCRATCH" a={a} color="#8FB3E8" align="left" />}
        <Callout p={oc} to={{x: oc.x - 60, y: oc.y - 400}} text="LIVING INSECT" a={a} color="#FFD84A" align="right" />
      </>
    );
  };
  return <LabView2 t={t} orbit={O} fkey={fkey} o={{oc: true, ocTau: t - DUR, dof: 1.2}} overlay={overlay} />;
};
export {elecPts};
