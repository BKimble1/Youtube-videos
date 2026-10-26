// The earlier study (2024), after a deliberate cut. The robot watches a recorded face on the monitor; the small
// changes as a smile begins are marked on the face. One cue travels to the robot's pupil camera; model one predicts
// the coming expression, model two turns it into motor commands, and the result comes out through the same mouth
// corner. Then a schematic of the reported timing: the robot starts at the prediction, about 0.84 s before the smile
// is plainly visible, and both arrive together.
import React from 'react';
import {lipAnchors} from '../art/Robot';
import {Card, CommandPanel, Tag, UI} from '../art/Ui';
import {INK} from '../dc/ink';
import {clamp, fmt, lerp} from '../dc/math';
import {camPath, toScreen} from '../lib/cam';
import {pr, T} from '../lib/core';
import {CO24, K, robotAt, screenFaceAt} from '../state';
import {BenchWorld, BW, ScreenFace} from './BenchWorld';
import {SmilePlot} from './Late';

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
/** the screen face's mouth corners (world), from dc/Head's mouth construction at R = 110, turn 0.1 */
const faceCorners = (smile: number, wide: number) => {
  const R = 110, s = R / 100, turn = 0.1;
  const xf = -30 * turn;
  const mx = xf - 6 * turn;
  const mw = 28 * wide * (1 - 0.15 * turn);
  const cy = 54 - smile * 10;
  const c = {x: BW.mon.x, y: BW.mon.y + 10};
  return [{x: c.x + (mx - mw) * s, y: c.y + cy * s}, {x: c.x + (mx + mw) * s, y: c.y + cy * s}];
};

export const Study24: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = robotAt(f);
  const sf = screenFaceAt(f);
  const cam = camPath(
    f,
    [
      [K.study24, {x: 1560, y: 560, z: 1.0}],
      [K.ms840 - 0.2, {x: 1560, y: 560, z: 1.03}],
      [K.ms840 + 0.8, {x: 1560, y: 470, z: 1.0}],
      [CO24.full + 0.8, {x: 1560, y: 470, z: 1.0}],
      [K.enough, {x: 1500, y: 455, z: 1.09}],
    ],
    ease,
  );
  const corners = faceCorners(sf.smile, sf.wide);
  // small-change markers: during "learned to recognize small changes" and again at the new cue
  const mk = Math.max(pr(f, T('small changes') - 0.3, T('small changes') + 0.2) * (1 - pr(f, K.oneModel + 0.6, K.oneModel + 1.0)), pr(f, CO24.cue, CO24.cue + 0.4) * (1 - pr(f, CO24.visible + 0.4, CO24.visible + 0.9)));
  // the cue's path to the pupil camera
  const eye = lipAnchors(st) && {x: BW.head.x, y: BW.head.y};
  const eyeW = (() => {
    // the robot's eye nearer the monitor (az +30 at the current yaw)
    const a = ((30 + st.yaw) * Math.PI) / 180;
    return {x: BW.head.x + 100 * Math.cos((6 * Math.PI) / 180) * Math.sin(a) * BW.head.s, y: BW.head.y - 116 * Math.sin((6 * Math.PI) / 180) * BW.head.s};
  })();
  const travel = pr(f, K.oneModel - 0.1, K.oneModel + 0.7);
  const dot = {x: lerp(corners[0].x, eyeW.x, travel), y: lerp(corners[0].y, eyeW.y, travel) - Math.sin(travel * Math.PI) * 120};
  const glow = clamp(1 - Math.abs(t - (K.oneModel + 0.75)) / 0.4);
  const m1 = pr(f, K.oneModel + 0.6, K.oneModel + 1.0) * (1 - pr(f, K.ms840 - 0.4, K.ms840));
  const m2 = pr(f, K.another2 - 0.1, K.another2 + 0.3) * (1 - pr(f, K.ms840 - 0.4, K.ms840));
  const out = pr(f, K.another2 + 1.2, K.another2 + 1.9) * (1 - pr(f, K.ms840 - 0.4, K.ms840));
  const corner = (() => {
    const p = lipAnchors(st).find((a) => a.k === 'cornerR')!.p;
    return {x: BW.head.x + p.x * BW.head.s, y: BW.head.y + p.y * BW.head.s};
  })();
  const sEye = toScreen(cam, eyeW);
  const sCorner = toScreen(cam, corner);
  const sDot = toScreen(cam, dot);
  const chartK = pr(f, K.ms840 + 0.1, K.ms840 + 0.6);
  const less = clamp(1 - Math.abs(t - (K.less + 0.5)) / 0.8);
  // model-two bars follow the predicted smile
  const pv = clamp((t - (K.another2 + 0.4)) / 1.4);
  const bars = [0.2, 0.3, 0.7, 0.25, 0.8, 0.3, 0.6, 0.2].map((v, i) => lerp(0.15, v, pv * (i % 2 ? 0.8 : 1)));
  // chart geometry: the bracket between prediction and visible smile
  const cx0 = 330, cw = 1260, ct0 = CO24.cue - 0.6, ct1 = CO24.full + 1.2;
  const tx = (tt: number) => cx0 + 170 + ((cw - 190) * (tt - ct0)) / (ct1 - ct0);
  return (
    <g>
      <BenchWorld
        id="s24"
        cam={cam}
        st={st}
        monOn={1}
        lensGlow={glow}
        cut={out > 0.01 ? {u: 38, v: 0, r: 30, k: out} : undefined}
        screen={<ScreenFace id="s24-sf" expr={sf} />}
        over={
          mk > 0.01 ? (
            <g opacity={mk}>
              {corners.map((c, i) => (
                <circle key={i} cx={fmt(c.x)} cy={fmt(c.y)} r={13} fill="none" stroke={UI.amber} strokeWidth={4} />
              ))}
              {[-1, 1].map((sg) => (
                <circle key={sg} cx={fmt(BW.mon.x + sg * 48)} cy={fmt(BW.mon.y + 44)} r={16} fill="none" stroke={UI.amber} strokeWidth={3} strokeDasharray="5 4" />
              ))}
            </g>
          ) : null
        }
      />
      <Tag x={70} y={90} text="Earlier study · Science Robotics · 2024" k={pr(f, K.study24 + 0.1, K.study24 + 0.5) * (1 - pr(f, K.watched + 2.5, K.watched + 3.0))} size={26} />
      <Tag x={1290} y={300} text="small changes as a smile begins" k={mk * (t < K.oneModel + 1 ? 1 : 0)} size={24} tone="warm" />
      {travel > 0.01 && travel < 0.999 && <circle cx={fmt(sDot.x)} cy={fmt(sDot.y)} r={9} fill={UI.amber} stroke={INK} strokeWidth={2} />}
      {/* model one: predicts the coming expression (a curve extrapolated ahead of the data) */}
      <Card x={620} y={80} w={380} h={230} title="Model 1" titleSize={36} k={m1} accent={UI.amber}>
        <text x={30} y={100} fontFamily="Nunito Variable" fontWeight={700} fontSize={22} fill="#5A6672">predicts the coming expression</text>
        <path d="M40,200 C110,198 150,190 190,170" fill="none" stroke={UI.coral} strokeWidth={5} strokeLinecap="round" />
        <path d="M190,170 C230,150 270,124 330,120" fill="none" stroke={UI.coral} strokeWidth={5} strokeDasharray="8 8" strokeLinecap="round" />
        <circle cx={190} cy={170} r={6} fill={UI.coral} />
        <text x={200} y={212} fontFamily="Nunito Variable" fontWeight={700} fontSize={18} fill="#5A6672">now</text>
      </Card>
      {m2 > 0.01 && <path d={`M1000,195 L1060,195`} stroke={INK} strokeWidth={4} opacity={m2} />}
      <Card x={1060} y={80} w={380} h={230} title="Model 2" titleSize={36} k={m2} accent={UI.blue}>
        <text x={30} y={100} fontFamily="Nunito Variable" fontWeight={700} fontSize={22} fill="#5A6672">turns it into motor commands</text>
        <g transform="translate(40 118) scale(0.6)">
          <CommandPanel x={0} y={0} vals={bars} title="" />
        </g>
      </Card>
      {m1 > 0.01 && (
        <path d={`M${fmt(sEye.x + 20)},${fmt(sEye.y - 20)} C${fmt(sEye.x + 60)},${fmt(sEye.y - 160)} 640,320 660,300`} fill="none" stroke={UI.amber} strokeWidth={3} strokeDasharray="7 6" opacity={m1} />
      )}
      {out > 0.01 && (
        <path d={`M1250,310 C1250,${fmt(sCorner.y - 40)} ${fmt(sCorner.x + 160)},${fmt(sCorner.y)} ${fmt(sCorner.x + 38)},${fmt(sCorner.y)}`} fill="none" stroke={UI.blue} strokeWidth={4} opacity={out} />
      )}
      {/* the reported timing, as a schematic */}
      <SmilePlot
        f={f}
        t0={ct0}
        t1={ct1}
        k={chartK}
        x={cx0}
        y={1010}
        w={cw}
        h={60}
        personSmile={(ff) => screenFaceAt(ff).smile}
        marks={[
          {t: CO24.predict, label: 'prediction', color: UI.blue},
          {t: CO24.visible, label: 'smile visible', color: UI.coral},
        ]}
      />
      {chartK > 0.01 && t > CO24.visible && (
        <g opacity={chartK}>
          <path d={`M${fmt(tx(CO24.predict))},${812} l0,-14 L${fmt(tx(CO24.visible))},798 l0,14`} fill="none" stroke={INK} strokeWidth={4 + 3 * less} />
          <text x={fmt((tx(CO24.predict) + tx(CO24.visible)) / 2)} y={786} textAnchor="middle" fontFamily="Nunito Variable" fontWeight={800} fontSize={26 + 4 * less} fill={INK}>
            about 0.84 s (reported)
          </text>
        </g>
      )}
      <Tag x={1570} y={860} text="Schematic" k={chartK} size={22} anchor="end" tone="warm" />
      {eye && null}
    </g>
  );
};
