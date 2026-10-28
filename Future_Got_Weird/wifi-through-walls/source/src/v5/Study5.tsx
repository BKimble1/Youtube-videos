// V5 study (the separate experiment's test, illustrated): a long test corridor with a taped lane between an ordinary
// access point and receivers; participants walk it one at a time, each with their own build, clothes and stride; the
// camera travels with them, and the long data wall behind them builds each walker's signature as they pass its
// section. The camera ends pushed onto the first screen (the last walker's signature), which becomes the full-frame
// matching screen (ui.tsx StudyUI).
import React from 'react';
import {B, basis, Cam, camPath, proj, scaleAt, v3} from '../world/cam';
import {Box, INK, Line3, Poly, ry, rz} from '../world/draw';
import {cardAt, cardPt, FloorShadow, Person, U} from '../art/person';
import {heelStrikes, walk, Gait} from '../art/walk';
import {manJoints, ManPose, Outfit} from '../dc/Man';
import {EXPR_NEUTRAL} from '../dc/Head';
import {HandPose} from '../dc/Hand';
import {clamp, f1, ss, useUid, word} from '../lib';
import {E_OUT} from './Cafe5';
import {SigBand} from './ui';
import {Router} from '../scenes/cafeSet';

const T_ = (w: string, n = 0) => word(w, n).start;
export const STUDY_UI_IN = T_('people', 1) + 0.42;
const LANE_Z = 1.4, BACK = 3.2;
const CG = {wall: '#DCD8E6', floor: '#B9BCC2', floorLine: '#A5A8AF', tape: '#F2C14E', ceil: '#EEF0F2'};

type Walker = {o: Outfit; s: number; seed: number; g: Gait; pack?: boolean; t0: number; x0w: number};
/** each enters at world x0w at time t0 and walks left; world speed v / U * s */
const mk = (o: Outfit, s: number, seed: number, g: Omit<Gait, 'x0'>, t0: number, x0w: number, pack = false): Walker => ({o, s, seed, g: {...g, x0: (x0w / s) * U + g.v * t0}, t0, x0w, pack});
/** each crosses the frame's centre (camera x at that moment) at its own time; they are a metre or more apart */
const camX = (t: number) => 0.4 - 0.25 * (t - E_OUT);
const mkc = (o: Outfit, s: number, seed: number, g: Omit<Gait, 'x0'>, tc: number, pack = false): Walker => {
  // world x at time t: camX(tc) - (v / U) * s * (t - tc)
  const xc = camX(tc);
  return {o, s, seed, g: {...g, x0: (xc / s) * U + g.v * tc}, t0: tc - 1.2, x0w: xc, pack};
};
export const WALKERS: Walker[] = [
  mkc({skin: '#7A4B32', hair: '#1C1A1A', shirt: '#2E8F8A', stripe: null, pants: '#55606B', shoe: '#F2F2F2', longSleeve: true, hairStyle: 'curly'}, 0.97, 3,
    {v: 760, T: 0.78, ph: 0.3, arm: 21, elbow: 14, lean: 3}, E_OUT - 0.25),
  mkc({skin: '#D9A07C', hair: '#B8B8B8', shirt: '#E07A5F', stripe: null, pants: '#4A4A55', shoe: '#2F2F2F', longSleeve: true, hairStyle: 'short'}, 1.06, 23,
    {v: 640, T: 1.0, ph: 0.65, arm: 12, elbow: 24, lean: 7}, E_OUT + 0.8, true),
  mkc({skin: '#F3CDB0', hair: '#E3BC63', shirt: '#F2B134', stripe: null, pants: '#3D5A80', shoe: '#FFFFFF', longSleeve: true, hairStyle: 'bun'}, 0.93, 27,
    {v: 820, T: 0.7, ph: 0.1, arm: 17, elbow: 22, lean: 4}, E_OUT + 1.75),
];
/** lane depth per walker (B walks the far side of the lane, C the near side) */
const LZ = [LANE_Z, LANE_Z + 0.28, LANE_Z - 0.22];
const placed = (w: Walker, t: number) => {
  const p = walk(w.g, t);
  const dx = p.x;
  return {at: v3((dx / U) * w.s, 0, LZ[WALKERS.indexOf(w)]), p: {...p, x: 0, lAx: (p.lAx ?? 0) - dx, rAx: (p.rAx ?? 0) - dx} as ManPose, wx: (dx / U) * w.s};
};
export const studyFootsteps = () => WALKERS.flatMap((w) => heelStrikes(w.g, Math.max(w.t0, E_OUT), STUDY_UI_IN).map((s) => ({...s, who: 'participant', gain: 0.5})));

/** the camera drifts left with them, slower, so each passes through the frame in turn */
export const studyCam = (t: number): Cam => camPath(t, [
  [E_OUT - 0.5, {pos: v3(camX(E_OUT - 0.5), 1.2, LANE_Z - 2.5), yaw: 0, pitch: 0, f: 1350, cx: 540, cy: 830}],
  [STUDY_UI_IN - 0.4, {pos: v3(camX(STUDY_UI_IN - 0.4), 1.3, LANE_Z - 2.7), yaw: 0, pitch: 0, f: 1350, cx: 540, cy: 820}],
  // the push onto the data wall's first screen (the last walker's signature), which becomes the matching screen
  [STUDY_UI_IN, {pos: v3(0.72, 2.02, BACK - 1.05), yaw: 0, pitch: 0, f: 1050, cx: 540, cy: 900}],
]);

/** the data wall: three sections, each builds the signature of the walker passing in front of it */
const SECTIONS = [{x0: 0.25, x1: 1.2}, {x0: -0.85, x1: 0.1}, {x0: -1.95, x1: -1.0}];
const DataWall: React.FC<{b: B; t: number; xs: number[]}> = ({b, t, xs}) => {
  const u = useUid();
  const out: React.ReactNode[] = [];
  SECTIONS.forEach((S, i) => {
    const tl = proj(b, v3(S.x0, 2.55, BACK - 0.02)), br = proj(b, v3(S.x1, 1.55, BACK - 0.02));
    const r = {x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y};
    // which walker is in front of this section: the one whose x is inside it (or has passed it)
    const who = WALKERS.findIndex((_, j) => xs[j] < S.x1 + 0.3 && xs[j] > S.x0 - 1.4);
    const w = who >= 0 ? WALKERS[who] : null;
    const rev = w ? clamp((S.x1 + 0.3 - xs[who]) / 1.4) : 0;
    out.push(
      <g key={i}>
        <Poly b={b} pts={rz(BACK - 0.01, S.x0 - 0.04, S.x1 + 0.04, 1.51, 2.59)} fill="#1B252C" />
        <defs><clipPath id={`${u}dw${i}`}><rect x={r.x} y={r.y} width={r.w} height={r.h} /></clipPath></defs>
        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#0B1522" />
        <g clipPath={`url(#${u}dw${i})`}>
          {w && (
            <g>
              {/* the live signal (a ripple that runs while the walker is in front) */}
              <polyline points={Array.from({length: 40}, (_, k) => `${f1(r.x + r.w * (0.05 + 0.9 * (k / 39)))},${f1(r.y + r.h * 0.3 + Math.sin(k * 0.8 + t * 14 + i) * r.h * 0.08 * (rev > 0 && rev < 1 ? 1 : 0.25))}`).join(' ')} fill="none" stroke="#7CFFB2" strokeWidth={Math.max(1.5, r.h * 0.025)} />
              <SigBand x={r.x + r.w * 0.05} y={r.y + r.h * 0.52} w={r.w * 0.9} h={r.h * 0.36} seed={w.seed} reveal={rev} cols={30} rows={4} />
            </g>
          )}
        </g>
      </g>,
    );
  });
  return <g>{out}</g>;
};
const Room: React.FC<{b: B; t: number}> = ({b, t}) => {
  const k = scaleAt(b, v3(0, 0, LANE_Z));
  const hw = Math.max(0.8, Math.min(2.4, k * 0.0025));
  const ap = v3(-3.0, 1.3, 2.5);
  return (
    <g>
      <Poly b={b} pts={rz(BACK, -9, 9, 0, 3.2)} fill={CG.wall} />
      <Poly b={b} pts={rz(BACK - 0.001, -9, 9, 0, 0.1)} fill="#F1EFF6" sw={0.6} />
      <Poly b={b} pts={rz(BACK - 0.001, -9, 9, 1.0, 1.06)} fill="#B7B0CC" stroke={false} />
      <Poly b={b} pts={ry(0, -9, 9, -4, BACK)} fill={CG.floor} />
      {[-2.6, -1.4, -0.2, 0.6, 2.2].map((z) => <Line3 key={z} b={b} pts={[v3(-9, 0, z), v3(9, 0, z)]} stroke={CG.floorLine} w={hw} px />)}
      {[LANE_Z - 0.4, LANE_Z + 0.4].map((z) => <Poly key={z} b={b} pts={ry(0.002, -9, 9, z - 0.025, z + 0.025)} fill={CG.tape} stroke={false} />)}
      {[-3, -1.8, -0.6, 0.6, 1.8, 3].map((x) => <Poly key={x} b={b} pts={[v3(x + 0.12, 0.003, LANE_Z - 0.1), v3(x - 0.08, 0.003, LANE_Z), v3(x + 0.12, 0.003, LANE_Z + 0.1)]} fill="#FFFFFF" stroke={false} op={0.7} />)}
      <Poly b={b} pts={ry(3.2, -9, 9, -1, BACK)} fill={CG.ceil} />
      {[-2.5, -0.5, 1.5].map((x) => <Poly key={x} b={b} pts={ry(3.19, x - 0.5, x + 0.5, 1.4, 2.0)} fill="#FFFFFF" sw={0.6} />)}
      {/* the access point on its tripod at the lane's far end, and a receiver on a stand at each wall section */}
      {[30, 150, 270].map((a) => <Line3 key={a} b={b} pts={[v3(ap.x, 0.7, ap.z), v3(ap.x + Math.cos((a * Math.PI) / 180) * 0.28, 0, ap.z + Math.sin((a * Math.PI) / 180) * 0.28)]} stroke="#2C3A44" w={0.02} />)}
      <Line3 b={b} pts={[v3(ap.x, 0.7, ap.z), v3(ap.x, ap.y - 0.06, ap.z)]} stroke="#7E8B94" w={0.03} />
      <Router b={b} p={ap} />
      {SECTIONS.map((S, i) => (
        <g key={i}>
          <Line3 b={b} pts={[v3((S.x0 + S.x1) / 2, 0, BACK - 0.35), v3((S.x0 + S.x1) / 2, 1.1, BACK - 0.35)]} stroke="#5D6A73" w={0.025} />
          <Box b={b} x0={(S.x0 + S.x1) / 2 - 0.08} x1={(S.x0 + S.x1) / 2 + 0.08} y0={1.1} y1={1.2} z0={BACK - 0.42} z1={BACK - 0.28} front="#22313B" side="#1A262E" top="#33444F" />
          {[-0.05, 0, 0.05].map((dx) => <Line3 key={dx} b={b} pts={[v3((S.x0 + S.x1) / 2 + dx, 1.2, BACK - 0.35), v3((S.x0 + S.x1) / 2 + dx * 1.6, 1.36, BACK - 0.35)]} stroke={INK} w={0.01} />)}
        </g>
      ))}
    </g>
  );
};
const HAND: HandPose = {curl: [0.22, 0.28, 0.32, 0.36], spread: 0.35, thumb: 22, thumbCurl: 0.4};
const Pack: React.FC<{cd: ReturnType<typeof cardAt>; p: ManPose}> = ({cd, p}) => {
  const j = manJoints(p);
  const c = cardPt(cd, {x: j.C.x + 92, y: j.C.y - 20});
  const w = 120 * cd.k, h = 180 * cd.k;
  return <rect x={f1(c.x - w / 2)} y={f1(c.y - h / 2)} width={f1(w)} height={f1(h)} rx={f1(w * 0.3)} fill="#3E6FB0" stroke={INK} strokeWidth={Math.max(1, cd.k * 6)} />;
};
export const StudyScene4: React.FC<{t: number}> = ({t}) => {
  const u = useUid();
  const b = basis(studyCam(t));
  const ps = WALKERS.map((w, i) => ({w, i, ...placed(w, t)}));
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect width={1080} height={1920} fill={CG.wall} />
      <Room b={b} t={t} />
      <DataWall b={b} t={t} xs={ps.map((q) => q.wx)} />
      {[...ps].sort((a, c) => c.at.z - a.at.z).filter((q) => t >= q.w.t0 - 0.6 && q.wx > -6).map(({w, i, at, p}) => {
        const cd = cardAt(b, at, w.s);
        return (
          <g key={i}>
            <FloorShadow cd={cd} x={0} w={200} />
            {w.pack && <Pack cd={cd} p={p} />}
            <Person id={`${u}w${i}`} cd={cd} p={p} farBehind look={{outfit: w.o, expr: {...EXPR_NEUTRAL, gx: -0.6, smile: 0.2}, lHand: HAND, rHand: HAND}} />
          </g>
        );
      })}
    </svg>
  );
};
