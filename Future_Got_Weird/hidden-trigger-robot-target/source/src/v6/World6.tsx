// V6 test bay: the V3 model unchanged, plus the in-world scientist at the workstation, the effects line and
// reservoir on the model hand's mount, the pressed crease under the blade, the red-fluid jet and its persistent marks.
// V6: the prop dips on its mount when struck (spring-damped), and the crease depth follows the blade's actual press.
import React from 'react';
import {Cam3, horiz, vert, projY} from '../v3/proj';
import {Wall3, Workstation3, RobotBase3, Bench3, CuttingBoard, ApplePlanShape, HandProp, PendantLight, Arm3, knifeShadowPath, HAND_PARTS, HAND3, BENCH} from '../v3/World3';
import {Pose3, knifeWorld, KN} from '../v3/rig3';
import {EffectsLine, BenchMarks, DropShadows, Jet, PalmCrease, handJolt, MOUNT_PIVOT} from './Fluid6';
import {SciFigure} from './Scientist6';

export const SCI_WORLD = {x: -150, d: -380};
// palm-top height under the blade's flat edge (the V3 palm height field, local x = world x - HAND3.x)
const palmTopAt = (x: number) => {
  const l = x - HAND3.x;
  return l < -50 ? 440 + (l + 74) * 0.5 : l < 10 ? 452 + (l + 50) * 0.08 : l < 66 ? 457 - (l - 10) * 0.09 : 452 - (l - 66) * 0.07;
};
// how far the blunt edge presses into the palm (units), sampled along the flat part of the edge
export const pressDepth = (pose: Pose3) => {
  const kn = knifeWorld(pose);
  let best = 0;
  for (let u = KN.tipU + 54; u <= KN.handleFront; u += 4) {
    const p = kn.W(u, KN.edge);
    if (p.x > HAND3.x - 74 && p.x < HAND3.x + 150) best = Math.max(best, palmTopAt(p.x) - p.h);
  }
  return best;
};

export const TestBay6: React.FC<{c: Cam3; pose: Pose3; glint?: number; hot?: number; squeeze?: number; screen?: React.ReactNode; marksDt: number | null; jetDt: number | null; sciLean?: number}> = ({c, pose, glint, hot, squeeze, screen, marksDt, jetDt, sciLean = 0}) => {
  const kn = knifeWorld(pose);
  const hBlade = (kn.edgeMid.h + kn.W(KN.handleFront, KN.spine).h) / 2;
  const shOp = Math.max(0.35, 0.8 - (hBlade - HAND3.palmTop) / 500);
  const handClip = 'v6-handTopClip';
  const bx = [kn.W(KN.tipU + 54, KN.edge).x, kn.W(KN.handleFront, KN.edge).x];
  const depth = pressDepth(pose);
  const jolt = handJolt(jetDt);
  const pivotY = projY(c, 0, MOUNT_PIVOT.h);
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
      <BenchMarks c={c} dt={marksDt} />
      <DropShadows c={c} dt={jetDt} />
      {/* the prop dips on its mount for a moment when struck */}
      <g transform={jolt ? `rotate(${jolt} ${MOUNT_PIVOT.x} ${pivotY})` : undefined}>
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
                <PalmCrease c={c} depth={depth} x0={Math.max(HAND3.x - 70, bx[0])} x1={Math.min(HAND3.x + 64, bx[1])} dt={jetDt} />
              </g>
            </g>
          }
        />
      </g>
      <EffectsLine c={c} />
      {c.e < 40 && <PendantLight c={c} on={1} />}
      <Arm3 c={c} pose={pose} glint={glint} hot={hot} squeeze={squeeze} />
      {/* the jet leaves the front of the blade toward the camera, so it is in front of the arm plane (d > 0) */}
      <Jet c={c} dt={jetDt} />
    </g>
  );
};
