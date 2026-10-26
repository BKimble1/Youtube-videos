// "At Columbia University ... twenty-six motors ... which combinations create the shapes it needs."
// A new view of the same robot at the mirror bench (a deliberate cut: the explanation needs the face toward us).
// The camera eases toward the mouth; a local section opens in the skin (linkages to the lip attachments); on
// "twenty-six motors" the camera draws back while the section widens into a whole-head x-ray of representative
// motors (not a 26-part diagram); then the skin closes and the face tries untrained combinations, each shown with the
// motor commands that produced it.
import React from 'react';
import {Bench, Shadow, Wall} from '../art/Lab';
import {Robot, RobotSupport} from '../art/Robot';
import {CommandPanel, Tag} from '../art/Ui';
import {clamp, smooth} from '../dc/math';
import {camPath, Layer} from '../lib/cam';
import {pr, T} from '../lib/core';
import {BABBLE, BABBLE_CMD, K, robotAt} from '../state';

const HEAD = {x: 960, y: 470, s: 2.2};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const BENCH_Y = 960;
const POST = Math.max(0, (BENCH_Y + 36 - HEAD.y) / HEAD.s - 206);

export const Mech: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = robotAt(f);
  const cam = camPath(
    f,
    [
      [K.columbia, {x: 960, y: 520, z: 1.0}],
      [T('flexible') + 0.2, {x: 968, y: 540, z: 1.2}],
      [K.motors - 0.15, {x: 975, y: 600, z: 1.85}],
      [K.motors + 1.2, {x: 962, y: 520, z: 1.12}],
      [K.banana, {x: 960, y: 515, z: 1.08}],
    ],
    ease,
  );
  // local section at the mouth: opens before "twenty-six", widens with the pull-back, then hands over to the x-ray
  const cutK = pr(f, T('face with') - 0.3, T('face with') + 0.25);
  const cutR = 64;
  const xr = pr(f, K.motors + 0.45, K.motors + 0.95) * (1 - pr(f, T('That gives') + 0.1, T('That gives') + 0.5));
  const cutVis = cutK * (1 - pr(f, K.motors + 0.5, K.motors + 0.9));
  // the commands panel follows the babble table
  let ci = -1;
  BABBLE.forEach(([t0], i) => {
    if (t >= t0 - 0.12) ci = i;
  });
  const vals = ci < 0 ? [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] : BABBLE_CMD[ci].map((v, j) => {
    const prev = ci > 0 ? BABBLE_CMD[ci - 1][j] : 0.5;
    return prev + (v - prev) * smooth(clamp((t - (BABBLE[ci][0] - 0.12)) / 0.26));
  });
  const panelK = pr(f, K.combos + 0.1, K.combos + 0.45) * (1 - pr(f, K.banana - 0.45, K.banana - 0.1));
  return (
    <g>
      <Layer cam={cam} depth={2}>
        <Wall id="mc-wall" x0={-1200} x1={3100} top={-600} wainsY={660} floorY={1400} detail="shelf" shelfX={280} cool={0.15} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Bench id="mc-bench" x0={-900} x1={2900} y={BENCH_Y} depth={80} face={500} legs={false} />
        <Shadow cx={HEAD.x} cy={BENCH_Y + 40} rx={190} ry={16} />
        <RobotSupport id="mc-sup" x={HEAD.x} y={HEAD.y} s={HEAD.s} yaw={st.yaw} postLen={POST} />
        <Robot id="mc-rob" st={st} x={HEAD.x} y={HEAD.y} s={HEAD.s} cut={cutVis > 0 ? {u: 0, v: 6, r: cutR, k: cutVis} : undefined} xray={xr} xrayHot={['corner', 'lip']} />
      </Layer>
      <Tag x={70} y={1000} text="Columbia University · Creative Machines Lab" k={pr(f, K.columbia + 0.2, K.columbia + 0.6) * (1 - pr(f, K.motors - 0.6, K.motors - 0.2))} size={26} />
      <Tag x={1250} y={380} text="26 motors in the face" k={pr(f, K.motors + 0.7, K.motors + 1.0) * (1 - pr(f, T('That gives') + 0.3, T('That gives') + 0.6))} size={30} tone="light" />
      <Tag x={1290} y={445} text="a few shown here" k={0.95 * pr(f, K.motors + 0.9, K.motors + 1.2) * (1 - pr(f, T('That gives') + 0.3, T('That gives') + 0.6))} size={26} tone="light" />
      <g transform="translate(1400 640) scale(1.3)">
        <CommandPanel x={0} y={40} vals={vals} k={panelK} title="Motor commands" />
        <Tag x={0} y={14} text="Before practice" k={panelK} size={22} tone="warm" />
      </g>
    </g>
  );
};
