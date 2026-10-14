// V3 prototype gate: the corrected collapse in the street scene, and elbow-bend close-ups of the rebuilt arm.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Man, ManPose, manJoints} from '../art/Man';
import {EXPR_PAIN} from '../art/Head';
import {HAND_CLUTCH, HAND_RELAXED, HAND_BRACE} from '../art/Hand';
import {SCREEN_IDLE} from '../lib/screen';
import {Scene} from '../shots/Scene';
import {collapseCam, collapseState, PROP} from '../shots/Opening';
import {PAL} from '../lib/color';
import {Journey3} from '../shots/Journey3';
import {Flyover, HospitalBay, MAP_END, MapBlip, RoofWipe} from '../shots/Dispatch';
import {B as B3} from '../lib/timeline3';
import {Aftermath3} from '../shots/Aftermath3';

const redScreen = (f: number) => ({...SCREEN_IDLE, f, red: 1, secs: 134 - f / 30, timerIn: 1, flash: (f * 0.085) % 1});

export const RigCollapse: React.FC = () => {
  const f = useCurrentFrame();
  const st = collapseState(f);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Scene id="rc" cam={collapseCam(f)} man={st.man} expr={st.expr} blink={st.blink} lHand={st.lHand} rHand={st.rHand} dog={st.dog} hairSway={st.hairSway} dev={{screen: redScreen(f), roll: -30, yaw: 14}} nearLegFront={f > 24} />
      </svg>
    </AbsoluteFill>
  );
};

// elbow bends at close range: frame selects the bend (hand target pulled toward the shoulder)
export const RigElbow: React.FC = () => {
  const f = useCurrentFrame();
  const targets: [number, number][] = [[-330, 30], [-250, -120], [-150, -170], [-60, -130]];
  const [tu, tv] = targets[Math.min(f % 4, targets.length - 1)];
  const pose: ManPose = {...PROP, x: 560, y: 1500, s: 2.2, torso: 6, chest: 6, neck: 4, lW: 0, lTu: tu, lTv: tv, lWr: 10, rTu: -84, rTv: -2, lA: 0, rA: 0, lHip: 10, lKnee: 20, rHip: 14, rKnee: 16};
  const j = manJoints(pose);
  void j;
  return (
    <AbsoluteFill style={{background: '#CFE3EC'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect x={0} y={1500} width={1080} height={420} fill={PAL.grass} />
        <g transform="translate(0 -60)">
          <Man id="re" pose={pose} expr={EXPR_PAIN} lHand={f === 3 ? HAND_BRACE : HAND_RELAXED} rHand={HAND_CLUTCH} device={f >= 4 ? undefined : {screen: redScreen(30), roll: -20, yaw: 14}} hideLeftForearm={f === 6} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const J3Test: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Journey3 id="j3" f={f} />
      </svg>
    </AbsoluteFill>
  );
};

export const DispTest: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {f < MAP_END ? <MapBlip id="mb" f={f} /> : f < B3.travel0 ? <HospitalBay id="hb" f={f} /> : <RoofWipe id="rw" f={f} before={<Flyover id="fo" f={f} />} after={<rect width={1080} height={1920} fill="#9C9" />} />}
      </svg>
    </AbsoluteFill>
  );
};

export const AftTest: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Aftermath3 id="af" f={f} />
      </svg>
    </AbsoluteFill>
  );
};
