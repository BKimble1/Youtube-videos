// V5 test bay: the V3 model unchanged, plus the in-world scientist at the workstation, the effects line and
// reservoir on the model hand's mount, the pressure dent, the red-fluid jet, and its persistent marks.
import React from 'react';
import {Cam3, horiz, vert} from '../v3/proj';
import {Wall3, Workstation3, RobotBase3, Bench3, CuttingBoard, ApplePlanShape, HandProp, PendantLight, Arm3, knifeShadowPath, HAND_PARTS, HAND3, BENCH} from '../v3/World3';
import {Pose3, knifeWorld, KN} from '../v3/rig3';
import {EffectsLine, BenchMarks, Jet, PalmDent} from './Fluid5';
import {SciFigure} from './Scientist5';

export const SCI_WORLD = {x: -150, d: -380};

export const TestBay5: React.FC<{c: Cam3; pose: Pose3; glint?: number; hot?: number; squeeze?: number; screen?: React.ReactNode; fluidDt: number | null; dent: number; sciLean?: number}> = ({c, pose, glint, hot, squeeze, screen, fluidDt, dent, sciLean = 0}) => {
  const kn = knifeWorld(pose);
  const hBlade = (kn.edgeMid.h + kn.W(KN.handleFront, KN.spine).h) / 2;
  const shOp = Math.max(0.35, 0.8 - (hBlade - HAND3.palmTop) / 500);
  const handClip = 'v5-handTopClip';
  const bx = [kn.W(KN.tipU + 54, KN.edge).x, kn.W(KN.handleFront, KN.edge).x];
  return (
    <g>
      <Wall3 c={c} />
      <Workstation3 c={c} screen={screen} />
      <g transform={`${vert(c, SCI_WORLD.d)} translate(${SCI_WORLD.x} 0)`}>
        <SciFigure lean={sciLean} />
      </g>
      <RobotBase3 c={c} />
      <Bench3 c={c} />
      <g transform={horiz(c, BENCH.top)} filter="url(#v3-soft)">
        <path d={knifeShadowPath(pose, BENCH.top)} fill="#0E141A" opacity={Math.max(0.42, shOp * 0.85)} />
      </g>
      <CuttingBoard c={c} />
      <ApplePlanShape c={c} />
      <BenchMarks c={c} dt={fluidDt} />
      <HandProp
        c={c}
        shadow={
          <g>
            <defs>
              <clipPath id={handClip}>
                {HAND_PARTS.map((p, i) => (
                  <path key={i} transform={`${horiz(c, p.top(-20))} translate(${HAND3.x} 0)`} d={'M ' + p.pts.map(([x, d]) => `${x} ${d}`).join(' L ') + ' Z'} />
                ))}
              </clipPath>
            </defs>
            <g clipPath={`url(#${handClip})`}>
              <g transform={horiz(c, HAND3.palmTop)} filter="url(#v3-soft)">
                <path d={knifeShadowPath(pose, HAND3.palmTop)} fill="#3A1804" opacity={Math.min(0.9, shOp * 1.15)} />
              </g>
              <PalmDent c={c} amount={dent} x0={Math.max(HAND3.x - 70, bx[0])} x1={Math.min(HAND3.x + 64, bx[1])} />
            </g>
          </g>
        }
      />
      <EffectsLine c={c} />
      {c.e < 40 && <PendantLight c={c} on={1} />}
      <Arm3 c={c} pose={pose} glint={glint} hot={hot} squeeze={squeeze} />
      {/* the jet leaves the front of the palm toward the camera, so it is in front of the arm plane (d > 0) */}
      <Jet c={c} dt={fluidDt} />
    </g>
  );
};
