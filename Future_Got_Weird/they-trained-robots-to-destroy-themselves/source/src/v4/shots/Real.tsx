// V4 REAL (150.5 → 190.4): transfer and robustness.
//   R1  the same standing robot, the same side view: a paper roll sweeps across and the training stage becomes the
//       foundry deck, the avatar becomes the F.02 (the roll covers the change completely)
//   R2  one stable side view: slack at the knee, an uneven plate under the foot, noisy sensors — each corrected
//   R3  pull back: a foundry the team had never visited
//   R4  back to the stage: the Crew make the simulation messy on purpose (weight, footing, timing, rounds)
//   R5  the airbag rehearsal: close on the foot at the ledge, track the descent, the landing fills the frame
//   R6  the foundry gets messy: monitors drop out, sparks; the policy keeps running and the robot pushes off
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {T, blockStart} from '../../v3/cues';
import {Cam, Scene, Layer, Bot, Chip, Tag, mixCam, seg, smooth, easeInOut, easeOut, lerp, toScreen} from '../kit/scene';
import {RollWipe} from '../kit/roll';
import {FoundryView, StageView, FD} from '../sets/views';
import {rig, RPose} from '../rig/Robot2D';
import {stand, A} from '../rig/poses';
import {C} from '../../theme';

export const REAL_START = blockStart('B05') - 0.12;
export const REAL_END = blockStart('B06') - 0.12;
const T_SIMR = T('But a simulator') + 0.15;
const T_SLACK = T('Real joints have slack') - 0.05;
const T_FLOOR = T('floors aren’t perfectly') - 0.05;
const T_NOISY = T('and sensors are noisy') - 0.05;
const T_NEVER = T('And Figure says this jump') - 0.1;

/** The stable side view shared by Train's end and R1/R2. */
export const SIDE_S = 0.78;
export const SIDE_X = 120;
export const CAM_SIDE: Cam = {x: 170, y: 320, z: 1.6};
export const sidePose = (o: Partial<RPose> = {}): RPose => stand(SIDE_X, FD.deck.top, SIDE_S, {yaw: 0.8, armN: A(4, 14, {grip: 0.3}), armF: A(-4, 16, {grip: 0.3}), ...o});

const robust = (tau: number) => {
  const p = sidePose();
  const r0 = rig(p, SIDE_S);
  const footN = r0.pts.ankleN;
  // slack: a decaying sway at the knee, then held
  const sl = seg(tau, T_SLACK + 0.2, T_SLACK + 1.4);
  const sway = sl > 0 && sl < 1 ? Math.sin(sl * Math.PI * 9) * (1 - sl) * 7 * SIDE_S : 0;
  p.x += sway;
  // uneven floor: a plate under the near foot tilts; the foot follows, the ankle corrects
  const tilt = smooth(seg(tau, T_FLOOR + 0.15, T_FLOOR + 0.55)) * 8;
  const lean = Math.sin(Math.PI * seg(tau, T_FLOOR + 0.25, T_FLOOR + 1.1)) * 3;
  p.rot += lean;
  if (p.footN && tilt > 0) p.footN = {...p.footN, y: p.footN.y - tilt * 1.6, pitch: tilt};
  // noisy sensors: tiny head jitter that settles
  const nz = seg(tau, T_NOISY + 0.1, T_NOISY + 1.2);
  if (nz > 0 && nz < 1) p.head += Math.sin(nz * 80) * 1.6 * (1 - nz);
  return {pose: p, tilt, foot: footN, sway: sl, nz};
};

export const Real: React.FC = () => {
  const f = useCurrentFrame();
  const tau = REAL_START + f / 30;

  // ---------------------------------------------- R1/R2: transfer + robustness (one stable side view)
  if (tau < T_NEVER) {
    const cam = CAM_SIDE;
    const lw = 4 / cam.z;
    const st = robust(tau);
    const r = rig(st.pose, SIDE_S);
    const kneeS = toScreen(cam, r.pts.kneeN[0], r.pts.kneeN[1]);
    const footS = toScreen(cam, r.pts.ankleN[0], r.pts.ankleN[1] + 30);
    const headS = toScreen(cam, r.pts.visor[0], r.pts.visor[1]);
    const plate = (
      <g transform={`rotate(${-st.tilt} ${st.foot[0] - 50} ${FD.deck.top})`}>
        <rect x={st.foot[0] - 50} y={FD.deck.top - 9} width={130} height={9} fill="#6E7882" stroke="#120C10" strokeWidth={lw} />
      </g>
    );
    const kHl = Math.max(0, Math.sin(Math.PI * seg(tau, T_SLACK + 1.0, T_SLACK + 1.6)));
    const aHl = Math.max(0, Math.sin(Math.PI * seg(tau, T_FLOOR + 0.5, T_FLOOR + 1.3)));
    const hl = {kneeN: {color: C.teal, amount: kHl}, ankleN: {color: C.teal, amount: aHl}};
    const foundry = (
      <Scene bg="#221A21">
        <FoundryView cam={cam} t={tau} glow={0.9} behind={<>{st.tilt > 0 ? plate : null}<Bot cam={cam} id="rR" model="F02" s={SIDE_S} pose={st.pose} hl={hl} /></>} />
      </Scene>
    );
    const stage = (
      <Scene bg="#EEF4FD">
        <StageView cam={cam} grid={0.25} front={<Bot cam={cam} id="rS" model="SIM" s={SIDE_S} pose={sidePose()} />} />
      </Scene>
    );
    const k = seg(tau, T_SIMR, T_SIMR + 0.62);
    // noisy sensor readout (a jittery trace that settles once filtered)
    const nzK = seg(tau, T_NOISY, T_NOISY + 0.3) * (1 - seg(tau, T_NEVER - 0.3, T_NEVER));
    const trace = Array.from({length: 40}, (_, i) => {
      const x = headS.x + 70 + i * 9;
      const calm = smooth(seg(tau, T_NOISY + 0.8, T_NOISY + 1.3));
      const y = headS.y - 120 + (Math.sin(i * 1.7 + tau * 40) * 18 + Math.sin(i * 0.7 + tau * 23) * 10) * (1 - calm) + Math.sin(i * 0.25) * 6 * calm;
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    return (
      <div style={{position: 'absolute', inset: 0}}>
        <RollWipe k={k} dir={-1} before={stage} after={foundry} tone="steel" />
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
          <Tag ax={kneeS.x} ay={kneeS.y} x={kneeS.x + 160} y={kneeS.y - 40} text="joint slack" k={seg(tau, T_SLACK + 0.1, T_SLACK + 0.45) * (1 - seg(tau, T_FLOOR - 0.2, T_FLOOR))} />
          <Tag ax={footS.x} ay={footS.y} x={footS.x + 180} y={footS.y + 60} text="uneven floor" k={seg(tau, T_FLOOR + 0.1, T_FLOOR + 0.45) * (1 - seg(tau, T_NOISY - 0.2, T_NOISY))} />
          {nzK > 0 ? (
            <g opacity={nzK}>
              <rect x={headS.x + 50} y={headS.y - 190} width={400} height={140} rx={16} fill={C.paper} stroke={C.ink} strokeWidth={4} />
              <path d={'M' + trace.join('L')} fill="none" stroke={C.coral} strokeWidth={4} strokeLinejoin="round" />
              <text x={headS.x + 70} y={headS.y - 158} fontFamily='"Nunito Variable", sans-serif' fontWeight={800} fontSize={28} fill={C.ink}>noisy sensors</text>
              <line x1={headS.x + 10} y1={headS.y - 10} x2={headS.x + 50} y2={headS.y - 60} stroke={C.ink} strokeWidth={4} />
            </g>
          ) : null}
        </svg>
      </div>
    );
  }
  // ---------------------------------------------- R3: a foundry the team had never visited
  const u = easeInOut(seg(tau, T_NEVER, T_NEVER + 2.2));
  const cam = mixCam(CAM_SIDE, {x: 620, y: 520, z: 0.82}, u);
  return (
    <Scene bg="#221A21" over={<Chip x={100} y={64} lines={['FIGURE SAYS', 'a foundry the team had never visited']} k={seg(tau, T_NEVER + 0.5, T_NEVER + 0.9)} size={38} />}>
      <FoundryView cam={cam} t={tau} behind={<Bot cam={cam} id="rR3" model="F02" s={SIDE_S} pose={sidePose({head: 8 * u})} />} />
    </Scene>
  );
};
void easeOut; void lerp; void Layer;
