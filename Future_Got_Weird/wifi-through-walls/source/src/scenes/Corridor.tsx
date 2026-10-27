// G: the controlled test. A research corridor with a taped walking lane between an ordinary Wi-Fi access point (on a
// tripod) and a capture laptop; participants walk the lane one after another (different people, one of them the
// guesser, #12), each pass is matched against the walks recorded earlier; the wall display then fills its grid of
// 197 participants, almost all matched (a few misses). Re-identification of previously recorded participants only:
// no names, no faces on screen.
import React from 'react';
import {B, basis, Cam, camKeys, proj, scaleAt, v3} from '../world/cam';
import {Box, INK, Line3, Poly, ry, rz} from '../world/draw';
import {cardAt, cardPt, FloorShadow, Person, U} from '../art/person';
import {walk, Gait} from '../art/walk';
import {GUESSER, manJoints, ManPose, Outfit} from '../dc/Man';
import {EXPR_NEUTRAL, Expr} from '../dc/Head';
import {HandPose} from '../dc/Hand';
import {Router} from './cafeSet';
import {clamp, f1, hash, ss, useUid, word} from '../lib';

const W = word;
export const GB = {
  g0: W('they', 1).start - 0.1,
  people: W('people', 1).start,
  everyone: W('everyone').start,
  correctly: W('correctly').start,
  g1: W('so').start - 0.12,
};
const LANE_Z = 1.2;
const BACK = 2.8;
const CG = {wall: '#DCD8E6', wallLo: '#C9C4D8', floor: '#B9BCC2', floorLine: '#A5A8AF', tape: '#F2C14E', ceil: '#EEF0F2', door: '#9AA7B8'};

type Walker = {o: Outfit; seed: number; s: number; carry?: 'crate' | 'pack'; id: number};
const WALKERS: Walker[] = [
  {o: {skin: '#7A4B32', hair: '#1C1A1A', shirt: '#2E8F8A', stripe: null, pants: '#55606B', shoe: '#F2F2F2', longSleeve: true, hairStyle: 'curly'}, seed: 3, s: 1.0, id: 3},
  {o: {skin: '#F3CDB0', hair: '#E3BC63', shirt: '#F2B134', stripe: null, pants: '#3D5A80', shoe: '#FFFFFF', longSleeve: true, hairStyle: 'bun'}, seed: 27, s: 0.96, id: 27},
  {o: GUESSER, seed: 12, s: 1.0, id: 12},
  {o: {skin: '#C68B63', hair: '#2B2B33', shirt: '#7C6BD6', stripe: null, pants: '#B8A27A', shoe: '#3A3A3A', glasses: true, hairStyle: 'short'}, seed: 58, s: 1.03, id: 58},
  {o: {skin: '#F0C8A8', hair: '#6B4226', shirt: '#5FAF6A', stripe: null, pants: '#2E3440', shoe: '#E8E8E8', hairStyle: 'swoop'}, seed: 91, s: 0.98, carry: 'pack', id: 91},
  {o: {skin: '#D9A07C', hair: '#B8B8B8', shirt: '#E07A5F', stripe: null, pants: '#4A4A55', shoe: '#2F2F2F', longSleeve: true, hairStyle: 'short'}, seed: 140, s: 1.02, carry: 'crate', id: 140},
  {o: {skin: '#5C3A28', hair: '#121212', shirt: '#F4F1EA', stripe: '#4F7CC9', pants: '#2F3E5C', shoe: '#FFFFFF', hairStyle: 'swoop'}, seed: 176, s: 1.01, id: 176},
];
const SPACING = 0.6;
const V = 880; // units/s
/** each walker crosses x = 0 (the middle of the lane) at tc */
const crossT = (i: number) => GB.g0 + 0.45 + i * SPACING;
const gaitOf = (i: number): Gait => ({x0: V * crossT(i), v: V, T: 0.82, ph: hash(i, 4), hipY: -480 * WALKERS[i].s - 4, arm: 70});

const camG = (t: number): Cam => {
  const c0: Cam = {pos: v3(0.05, 1.42, -2.7), yaw: 0, pitch: 0, f: 2000, cx: 540, cy: 840};
  const c1: Cam = {pos: v3(0.0, 2.25, -0.2), yaw: 0, pitch: 2, f: 2000, cx: 540, cy: 960};
  return camKeys(t, [
    [GB.g0, {...c0, pos: v3(0.2, 1.42, -2.8)}],
    [GB.everyone - 0.35, c0],
    [GB.g1, c1],
  ]);
};

/** the wall display: dataset label, live pattern, the grid of 197 */
const MONW = {x: 0, y: 2.38, w: 1.7, h: 1.0};
const MISSES = [37, 151];
const Display: React.FC<{b: B; t: number}> = ({b, t}) => {
  const u = useUid();
  const tl = proj(b, v3(MONW.x - MONW.w / 2, MONW.y + MONW.h / 2, BACK - 0.03)), br = proj(b, v3(MONW.x + MONW.w / 2, MONW.y - MONW.h / 2, BACK - 0.03));
  const r = {x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y};
  const mono = 'JetBrains Mono, monospace';
  const cols = 18, rows = 11; // 198 cells, 197 used
  const gx = r.x + r.w * 0.05, gy = r.y + r.h * 0.3, gw = r.w * 0.9, gh = r.h * 0.62;
  const cw = gw / cols, ch = gh / rows;
  // the live walker: the one nearest the lane's middle
  const live = WALKERS.map((_, i) => i).reduce((a, i) => (Math.abs(t - crossT(i)) < Math.abs(t - crossT(a)) ? i : a), 0);
  const fill = (n: number) => {
    // matched as they pass (their own cell), then the rest of the set in a quick sweep
    const own = WALKERS.findIndex((w) => w.id === n);
    if (own >= 0) return ss(t, crossT(own) + 0.15, crossT(own) + 0.3);
    return ss(t, GB.everyone - 0.2 + n * 0.0055, GB.everyone - 0.1 + n * 0.0055);
  };
  return (
    <g>
      <Poly b={b} pts={rz(BACK - 0.02, MONW.x - MONW.w / 2 - 0.05, MONW.x + MONW.w / 2 + 0.05, MONW.y - MONW.h / 2 - 0.05, MONW.y + MONW.h / 2 + 0.05)} fill="#1B252C" />
      <defs><clipPath id={`${u}gmon`}><rect x={r.x} y={r.y} width={r.w} height={r.h} /></clipPath></defs>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#0B1522" />
      <g clipPath={`url(#${u}gmon)`}>
        <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.12)} fontSize={f1(r.h * 0.1)} fill="#E8F1F6" fontFamily={mono} fontWeight={700}>197 PARTICIPANTS</text>
        <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.2)} fontSize={f1(r.h * 0.05)} fill="#8FB4CF" fontFamily={mono}>WALKS RECORDED EARLIER · MATCHING</text>
        {/* the live pattern of the walker in the lane */}
        {Array.from({length: 22}, (_, i) => {
          const sd = WALKERS[live].seed;
          const v = 0.5 + 0.3 * Math.sin(i * 0.55 + sd * 1.7) + (hash(i, sd) - 0.5) * 0.5;
          const pal = ['#173B6B', '#1E6FA8', '#25A6B8', '#7FE0C2', '#F6D26B', '#F08A4B'];
          return <rect key={i} x={f1(r.x + r.w * 0.62 + i * r.w * 0.015)} y={f1(r.y + r.h * 0.06)} width={f1(r.w * 0.016)} height={f1(r.h * 0.13)} fill={pal[Math.max(0, Math.min(5, Math.round(v * 5)))]} />;
        })}
        {Array.from({length: 197}, (_, n) => {
          const cx = gx + (n % cols) * cw, cy = gy + Math.floor(n / cols) * ch;
          const fl = fill(n);
          const miss = MISSES.includes(n);
          const col = fl > 0.5 ? (miss ? '#E0525A' : '#2FB37A') : '#1C3550';
          const own = WALKERS.findIndex((w) => w.id === n) >= 0;
          const flash = own ? clamp(1 - Math.abs(t - (crossT(WALKERS.findIndex((w) => w.id === n)) + 0.25)) / 0.25) : 0;
          return (
            <g key={n}>
              <rect x={f1(cx + cw * 0.08)} y={f1(cy + ch * 0.1)} width={f1(cw * 0.84)} height={f1(ch * 0.8)} rx={f1(cw * 0.12)} fill={col} />
              {flash > 0 && <rect x={f1(cx - cw * 0.1)} y={f1(cy - ch * 0.08)} width={f1(cw * 1.2)} height={f1(ch * 1.16)} rx={f1(cw * 0.15)} fill="none" stroke="#FFFFFF" strokeWidth={f1(cw * 0.1)} opacity={flash} />}
            </g>
          );
        })}
      </g>
    </g>
  );
};

const Room: React.FC<{b: B}> = ({b}) => {
  const k = scaleAt(b, v3(0, 0, LANE_Z));
  const hw = Math.max(0.8, Math.min(2.4, k * 0.0025));
  return (
    <g>
      <Poly b={b} pts={rz(BACK, -8, 8, 0, 3.2)} fill={CG.wall} />
      <Poly b={b} pts={rz(BACK - 0.001, -8, 8, 0, 0.1)} fill="#F1EFF6" sw={0.6} />
      <Poly b={b} pts={rz(BACK - 0.001, -8, 8, 1.0, 1.06)} fill="#B7B0CC" stroke={false} />
      {/* doors at either end */}
      {[-2.6, 2.6].map((x) => <Poly key={x} b={b} pts={rz(BACK - 0.002, x - 0.45, x + 0.45, 0, 2.1)} fill={CG.door} />)}
      <Poly b={b} pts={ry(0, -8, 8, -1, BACK)} fill={CG.floor} />
      {[-0.2, 0.6, 1.8, 2.3].map((z) => <Line3 key={z} b={b} pts={[v3(-8, 0, z), v3(8, 0, z)]} stroke={CG.floorLine} w={hw} px />)}
      {/* the taped lane, with start and stop marks */}
      {[LANE_Z - 0.38, LANE_Z + 0.38].map((z) => <Poly key={z} b={b} pts={ry(0.002, -3, 3, z - 0.025, z + 0.025)} fill={CG.tape} stroke={false} />)}
      {[-2.2, 2.2].map((x) => <Poly key={x} b={b} pts={ry(0.002, x - 0.03, x + 0.03, LANE_Z - 0.38, LANE_Z + 0.38)} fill={CG.tape} stroke={false} />)}
      {[-1.2, -0.4, 0.4, 1.2].map((x) => <Poly key={x} b={b} pts={[v3(x + 0.12, 0.003, LANE_Z - 0.1), v3(x - 0.08, 0.003, LANE_Z), v3(x + 0.12, 0.003, LANE_Z + 0.1)]} fill="#FFFFFF" stroke={false} op={0.7} />)}
      <Poly b={b} pts={ry(3.2, -8, 8, -1, BACK)} fill={CG.ceil} />
      {[-1.5, 0.5, 2.5].map((x) => <Poly key={x} b={b} pts={ry(3.19, x - 0.5, x + 0.5, 1.4, 2.0)} fill="#FFFFFF" sw={0.6} />)}
    </g>
  );
};
/** the access point on its tripod and the capture laptop on a cart, behind the lane */
const Kit: React.FC<{b: B; t: number}> = ({b, t}) => {
  const ap = v3(-0.95, 1.25, 2.25);
  const k = scaleAt(b, ap);
  const c = proj(b, ap);
  return (
    <g>
      {[30, 150, 270].map((a) => <Line3 key={a} b={b} pts={[v3(ap.x, 0.7, ap.z), v3(ap.x + Math.cos((a * Math.PI) / 180) * 0.28, 0, ap.z + Math.sin((a * Math.PI) / 180) * 0.28)]} stroke="#2C3A44" w={0.02} />)}
      <Line3 b={b} pts={[v3(ap.x, 0.7, ap.z), v3(ap.x, ap.y - 0.06, ap.z)]} stroke="#7E8B94" w={0.03} />
      <Router b={b} p={ap} />
      {[0, 1, 2].map((i) => {
        const ph = (t * 0.8 + i / 3) % 1;
        return <circle key={i} cx={f1(c.x)} cy={f1(c.y - k * 0.06)} r={f1(k * (0.12 + ph * 0.9))} fill="none" stroke="#7FE8FF" strokeWidth={Math.max(1.2, k * 0.008)} opacity={0.55 * (1 - ph)} />;
      })}
      {/* cart with the capture laptop */}
      <Box b={b} x0={0.65} x1={1.25} y0={0.78} y1={0.82} z0={2.0} z1={2.45} front="#9AA6AD" side="#7E8B94" top="#C9D1D6" />
      <Line3 b={b} pts={[v3(0.7, 0, 2.05), v3(0.7, 0.8, 2.05)]} stroke="#5D6A73" w={0.025} />
      <Line3 b={b} pts={[v3(1.2, 0, 2.05), v3(1.2, 0.8, 2.05)]} stroke="#5D6A73" w={0.025} />
      <Poly b={b} pts={rz(2.12, 0.78, 1.12, 0.84, 1.06)} fill="#22313B" />
      <Poly b={b} pts={rz(2.11, 0.8, 1.1, 0.86, 1.04)} fill="#123049" stroke={false} />
      <Line3 b={b} pts={[v3(1.12, 0.84, 2.15), v3(1.15, 1.0, 2.15)]} stroke={INK} w={0.01} />
    </g>
  );
};

const Carry: React.FC<{cd: ReturnType<typeof cardAt>; p: ManPose; kind: 'crate' | 'pack'; front: boolean}> = ({cd, p, kind, front}) => {
  const j = manJoints(p);
  if (kind === 'pack' && !front) {
    const c = cardPt(cd, {x: j.C.x + 92, y: j.C.y - 20});
    const w = 120 * cd.k, h = 180 * cd.k;
    return <rect x={f1(c.x - w / 2)} y={f1(c.y - h / 2)} width={f1(w)} height={f1(h)} rx={f1(w * 0.3)} fill="#3E6FB0" stroke={INK} strokeWidth={Math.max(1, cd.k * 6)} />;
  }
  if (kind === 'crate' && front) {
    const a = cardPt(cd, j.L.W), bb = cardPt(cd, j.R.W);
    const cx = (a.x + bb.x) / 2, cy = (a.y + bb.y) / 2;
    const w = 230 * cd.k, h = 150 * cd.k;
    return (
      <g>
        <rect x={f1(cx - w / 2)} y={f1(cy - h * 0.45)} width={f1(w)} height={f1(h)} rx={f1(w * 0.04)} fill="#C98B4A" stroke={INK} strokeWidth={Math.max(1, cd.k * 6)} />
        {[0.33, 0.66].map((q) => <line key={q} x1={f1(cx - w / 2)} y1={f1(cy - h * 0.45 + h * q)} x2={f1(cx + w / 2)} y2={f1(cy - h * 0.45 + h * q)} stroke="#9A6430" strokeWidth={Math.max(1, cd.k * 5)} />)}
      </g>
    );
  }
  return null;
};

export const CorridorScene: React.FC<{t: number}> = ({t}) => {
  const u = useUid();
  const b = basis(camG(t));
  const cd = cardAt(b, v3(0, 0, LANE_Z));
  const hand: HandPose = {curl: [0.22, 0.28, 0.32, 0.36], spread: 0.35, thumb: 22, thumbCurl: 0.4};
  const people = WALKERS.map((w, i) => {
    let p = walk(gaitOf(i), t);
    if (w.carry === 'crate') p = {...p, lTu: -235, lTv: -175, lElb: -1, rTu: -240, rTv: -205, rElb: -1};
    const ex: Expr = {...EXPR_NEUTRAL, gx: -0.6, smile: 0.15 + 0.2 * hash(i, 2)};
    return {w, i, p, ex};
  }).filter(({p}) => Math.abs(p.x) < 1.9 * U);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect width={1080} height={1920} fill={CG.wall} />
      <Room b={b} />
      <Display b={b} t={t} />
      <Kit b={b} t={t} />
      {people.map(({w, i, p, ex}) => {
        const c = {...cd, k: cd.k * w.s};
        return (
          <g key={i}>
            <FloorShadow cd={c} x={p.x / w.s} w={200} />
            {w.carry && <Carry cd={c} p={{...p, x: p.x / w.s, lAx: p.lAx! / w.s, rAx: p.rAx! / w.s}} kind={w.carry} front={false} />}
            <Person id={`${u}w${i}`} cd={c} p={{...p, x: p.x / w.s, lAx: p.lAx! / w.s, rAx: p.rAx! / w.s}} look={{outfit: w.o, expr: ex, lHand: hand, rHand: hand}} />
            {w.carry && <Carry cd={c} p={{...p, x: p.x / w.s, lAx: p.lAx! / w.s, rAx: p.rAx! / w.s}} kind={w.carry} front />}
          </g>
        );
      })}
    </svg>
  );
};
