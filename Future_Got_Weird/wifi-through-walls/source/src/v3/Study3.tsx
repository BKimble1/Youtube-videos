// V3 study (the separate experiment's test, illustrated): a controlled sensing area in a lab, a taped walking lane in
// front of an ordinary Wi-Fi access point and a receiving laptop. Participant A walks the lane: the access point's
// signal scatters off her body to the receiver, and the recording laptop builds her pattern and files it as P-001.
// Participant B (taller, older, a backpack, a longer and slower stride) walks it in a lower, closer shot: a different
// pattern, P-002. The camera then rises to the lab display: recordings fill a grid of 197, and matching sweeps across
// it (almost every cell confirmed, a few not). The display says it is an illustration: no study data is shown.
import React from 'react';
import {add3, B, basis, Cam, camPath, proj, scaleAt, v3, V3} from '../world/cam';
import {Box, INK, Line3, Poly, ry, rz} from '../world/draw';
import {cardAt, cardPt, FloorShadow, Person, U} from '../art/person';
import {heelStrikes, walk, Gait} from '../art/walk';
import {manJoints, ManPose, Outfit} from '../dc/Man';
import {EXPR_NEUTRAL, Expr} from '../dc/Head';
import {HandPose} from '../dc/Hand';
import {Router} from '../scenes/cafeSet';
import {clamp, f1, hash, ss, useUid, word} from '../lib';
import {E_OUT, H_IN, Signature} from './Cafe3';

const W = word;
const T_ = (w: string, n = 0) => W(w, n).start;
export const SB = {
  in: E_OUT, tested: T_('tested'), n197: T_('one'), seven: T_('seven'), people: T_('people', 1), and: T_('and', 1),
  identified: T_('identified'), almost: T_('almost'), everyone: T_('everyone'), correctly: T_('correctly'), out: H_IN,
};
const LANE_Z = 1.3;
const BACK = 3.0;
const CG = {wall: '#DCD8E6', floor: '#B9BCC2', floorLine: '#A5A8AF', tape: '#F2C14E', ceil: '#EEF0F2', door: '#9AA7B8'};
const AP = v3(-1.15, 1.3, 2.3);
const RXL = {x: 1.15, y: 1.0, z: 2.3, w: 0.42, h: 0.27};

// ------------------------------------------------------------------ the participants
type Walker = {o: Outfit; s: number; seed: number; g: Gait; pack?: boolean; label: string};
const A: Walker = {
  o: {skin: '#7A4B32', hair: '#1C1A1A', shirt: '#2E8F8A', stripe: null, pants: '#55606B', shoe: '#F2F2F2', longSleeve: true, hairStyle: 'curly'},
  s: 0.97, seed: 3, label: 'P-001',
  g: {x0: 0, v: 640, T: 0.82, ph: 0.3, arm: 21, elbow: 14, lean: 3},
};
const Bw: Walker = {
  o: {skin: '#D9A07C', hair: '#B8B8B8', shirt: '#E07A5F', stripe: null, pants: '#4A4A55', shoe: '#2F2F2F', longSleeve: true, hairStyle: 'short'},
  s: 1.06, seed: 23, label: 'P-002', pack: true,
  g: {x0: 0, v: 560, T: 1.06, ph: 0.65, arm: 12, elbow: 24, lean: 7},
};
/** each crosses the lane's middle (x = 0) at tc; world speed = g.v / U * s */
export const cross = {A: SB.tested - 0.05, B: SB.seven + 0.2};
const gaitOf = (w: Walker, tc: number): Gait => ({...w.g, x0: (w.g.v * tc)});
const placed = (w: Walker, tc: number, t: number) => {
  const p = walk(gaitOf(w, tc), t);
  const dx = p.x;
  // the card sits at the walker's own floor point (world x = dx / U * s), the pose shifted to match
  return {at: v3((dx / U) * w.s, 0, LANE_Z), p: {...p, x: 0, lAx: (p.lAx ?? 0) - dx, rAx: (p.rAx ?? 0) - dx} as ManPose, wx: (dx / U) * w.s};
};
export const studyFootsteps = () => [
  ...heelStrikes(gaitOf(A, cross.A), SB.in, cross.A + 1.6).map((s) => ({...s, who: 'participant A', gain: 0.55})),
  ...heelStrikes(gaitOf(Bw, cross.B), cross.B - 1.0, cross.B + 1.4).map((s) => ({...s, who: 'participant B', gain: 0.6})),
];

// ------------------------------------------------------------------ cameras
const cam = (x: number, y: number, z: number, f = 1450, cy = 900, pitch = 0): Cam => ({pos: v3(x, y, z), yaw: 0, pitch, f, cx: 540, cy});
const DISP = {x: 0.2, y: 2.25, z: BACK - 0.03, w: 1.9, h: 1.1};
export const studyCam = (t: number): Cam => {
  const ax = (tt: number) => placed(A, cross.A, tt).wx;
  const bx = (tt: number) => placed(Bw, cross.B, tt).wx;
  // A: the same framing the café used (match on action); B: lower and closer; then up to the display
  return camPath(t, [
    [SB.in - 0.4, cam(ax(SB.in - 0.4) + 0.75, 1.3, LANE_Z - 2.53, 1450, 900)],
    [SB.in + 0.3, cam(ax(SB.in + 0.3) - 0.05, 1.3, LANE_Z - 2.53, 1450, 900)],
    [SB.tested + 0.5, cam(ax(SB.tested + 0.5) - 0.15, 1.28, LANE_Z - 2.45, 1450, 900)],
    [SB.n197 + 0.45, cam(0.45, 1.12, LANE_Z - 2.25, 1450, 920)],
    [cross.B - 0.25, cam(bx(cross.B - 0.25) - 0.05, 0.95, LANE_Z - 1.85, 1450, 960)],
    [cross.B + 0.15, cam(bx(cross.B + 0.15) - 0.1, 0.95, LANE_Z - 1.8, 1450, 960)],
    [SB.people + 0.7, cam(DISP.x, 2.25, BACK - 2.6, 1250, 880), true],
    [SB.identified + 0.45, cam(DISP.x, 2.25, BACK - 2.45, 1250, 900)],
    [SB.correctly + 0.3, cam(DISP.x, 2.25, BACK - 2.25, 1250, 930)],
    [SB.out, cam(DISP.x + 0.15, DISP.y, BACK - 1.0, 1700, 960)],
  ]);
};

// ------------------------------------------------------------------ the set
const Room: React.FC<{b: B}> = ({b}) => {
  const k = scaleAt(b, v3(0, 0, LANE_Z));
  const hw = Math.max(0.8, Math.min(2.4, k * 0.0025));
  return (
    <g>
      <Poly b={b} pts={rz(BACK, -8, 8, 0, 3.2)} fill={CG.wall} />
      <Poly b={b} pts={rz(BACK - 0.001, -8, 8, 0, 0.1)} fill="#F1EFF6" sw={0.6} />
      <Poly b={b} pts={rz(BACK - 0.001, -8, 8, 1.0, 1.06)} fill="#B7B0CC" stroke={false} />
      {[-2.9, 3.1].map((x) => <Poly key={x} b={b} pts={rz(BACK - 0.002, x - 0.45, x + 0.45, 0, 2.1)} fill={CG.door} />)}
      <Poly b={b} pts={ry(0, -8, 8, -4, BACK)} fill={CG.floor} />
      {[-2.6, -1.4, -0.2, 0.6, 1.9, 2.5].map((z) => <Line3 key={z} b={b} pts={[v3(-8, 0, z), v3(8, 0, z)]} stroke={CG.floorLine} w={hw} px />)}
      {/* the taped lane, start and stop marks, arrows */}
      {[LANE_Z - 0.38, LANE_Z + 0.38].map((z) => <Poly key={z} b={b} pts={ry(0.002, -3, 3, z - 0.025, z + 0.025)} fill={CG.tape} stroke={false} />)}
      {[-2.2, 2.2].map((x) => <Poly key={x} b={b} pts={ry(0.002, x - 0.03, x + 0.03, LANE_Z - 0.38, LANE_Z + 0.38)} fill={CG.tape} stroke={false} />)}
      {[-1.2, -0.4, 0.4, 1.2].map((x) => <Poly key={x} b={b} pts={[v3(x + 0.12, 0.003, LANE_Z - 0.1), v3(x - 0.08, 0.003, LANE_Z), v3(x + 0.12, 0.003, LANE_Z + 0.1)]} fill="#FFFFFF" stroke={false} op={0.7} />)}
      <Poly b={b} pts={ry(3.2, -8, 8, -1, BACK)} fill={CG.ceil} />
      {[-1.5, 0.5, 2.5].map((x) => <Poly key={x} b={b} pts={ry(3.19, x - 0.5, x + 0.5, 1.4, 2.0)} fill="#FFFFFF" sw={0.6} />)}
    </g>
  );
};
/** the access point on its tripod; the receiving laptop on a cart (its screen records the walker's pattern) */
const Kit: React.FC<{b: B; t: number; rec: React.ReactNode}> = ({b, t, rec}) => {
  const u = useUid();
  const tl = proj(b, v3(RXL.x - RXL.w / 2, RXL.y + RXL.h / 2, RXL.z)), br = proj(b, v3(RXL.x + RXL.w / 2, RXL.y - RXL.h / 2, RXL.z));
  const r = {x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y};
  void t;
  return (
    <g>
      {[30, 150, 270].map((a) => <Line3 key={a} b={b} pts={[v3(AP.x, 0.7, AP.z), v3(AP.x + Math.cos((a * Math.PI) / 180) * 0.28, 0, AP.z + Math.sin((a * Math.PI) / 180) * 0.28)]} stroke="#2C3A44" w={0.02} />)}
      <Line3 b={b} pts={[v3(AP.x, 0.7, AP.z), v3(AP.x, AP.y - 0.06, AP.z)]} stroke="#7E8B94" w={0.03} />
      <Router b={b} p={AP} />
      {/* cart */}
      <Box b={b} x0={RXL.x - 0.38} x1={RXL.x + 0.38} y0={0.78} y1={0.82} z0={RXL.z - 0.2} z1={RXL.z + 0.3} front="#9AA6AD" side="#7E8B94" top="#C9D1D6" />
      {[-0.33, 0.33].map((dx) => <Line3 key={dx} b={b} pts={[v3(RXL.x + dx, 0, RXL.z - 0.15), v3(RXL.x + dx, 0.8, RXL.z - 0.15)]} stroke="#5D6A73" w={0.025} />)}
      <Poly b={b} pts={rz(RXL.z + 0.01, RXL.x - RXL.w / 2 - 0.015, RXL.x + RXL.w / 2 + 0.015, RXL.y - RXL.h / 2 - 0.015, RXL.y + RXL.h / 2 + 0.015)} fill="#22313B" />
      <defs><clipPath id={`${u}rxl`}><rect x={r.x} y={r.y} width={r.w} height={r.h} /></clipPath></defs>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#0B1522" />
      <g clipPath={`url(#${u}rxl)`}>{rec}</g>
      <Line3 b={b} pts={[v3(RXL.x + RXL.w / 2 + 0.03, 0.84, RXL.z), v3(RXL.x + RXL.w / 2 + 0.06, 1.05, RXL.z)]} stroke={INK} w={0.01} />
    </g>
  );
};
const mono = 'JetBrains Mono, monospace';
/** the receiving laptop's recording view */
const Recording: React.FC<{b: B; t: number}> = ({b, t}) => {
  const tl = proj(b, v3(RXL.x - RXL.w / 2, RXL.y + RXL.h / 2, RXL.z)), br = proj(b, v3(RXL.x + RXL.w / 2, RXL.y - RXL.h / 2, RXL.z));
  const r = {x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y};
  const fs = r.h * 0.1;
  const who = t < (cross.A + cross.B) / 2 ? A : Bw;
  const tc = who === A ? cross.A : cross.B;
  const rec = ss(t, tc - 0.9, tc + 0.6);
  const saved = ss(t, tc + 0.6, tc + 0.75);
  return (
    <g>
      <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.15)} fontSize={f1(fs)} fill="#8FB4CF" fontFamily={mono}>RECORDING</text>
      <circle cx={f1(r.x + r.w * 0.92)} cy={f1(r.y + r.h * 0.11)} r={f1(r.h * 0.04)} fill={saved > 0.5 ? '#2FB37A' : Math.floor(t * 3) % 2 ? '#FF4D4D' : '#A33'} />
      <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.33)} fontSize={f1(fs * 1.3)} fill="#FFD24A" fontFamily={mono} fontWeight={700}>{who.label}</text>
      <Signature x={r.x + r.w * 0.05} y={r.y + r.h * 0.42} w={r.w * 0.9} h={r.h * 0.32} seed={who.seed} reveal={rec} cols={34} />
      {saved > 0 && <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.9)} fontSize={f1(fs * 0.9)} fill="#7CFFB2" fontFamily={mono} opacity={saved}>SAVED</text>}
    </g>
  );
};

/** the access point's broadcast, and the arcs it scatters off the walker toward the receiver */
const Signal: React.FC<{b: B; t: number; who: V3}> = ({b, t, who}) => {
  const c = proj(b, add3(AP, v3(0, 0.12, -0.05)));
  const k = scaleAt(b, AP);
  const rx = v3(RXL.x + RXL.w / 2 + 0.06, 1.05, RXL.z);
  const out: React.ReactNode[] = [];
  const P = 0.4, SP = 1.4;
  const dW = Math.hypot(who.x - AP.x, who.y - AP.y, who.z - AP.z);
  const n0 = Math.floor(t / P);
  for (let n = n0 - 10; n <= n0; n++) {
    const te = n * P;
    const R = (t - te) * SP;
    if (R <= 0.05 || R > 3.6) continue;
    out.push(<circle key={`r${n}`} cx={f1(c.x)} cy={f1(c.y)} r={f1(k * R)} fill="none" stroke="#BFF6FF" strokeWidth={Math.max(1.3, k * 0.008)} opacity={0.5 * clamp(R / 0.3) * clamp((3.6 - R) / 1.2)} />);
    const ts = te + dW / SP;
    if (t > ts && t < ts + 1.5) {
      const back = v3(rx.x - who.x, rx.y - who.y, rx.z - who.z);
      const dist = Math.hypot(back.x, back.y, back.z);
      const rr = (t - ts) * 2.2;
      if (rr < dist) {
        const ctr = add3(who, v3((back.x / dist) * rr, (back.y / dist) * rr, (back.z / dist) * rr));
        const Q = proj(b, ctr), kk = scaleAt(b, ctr), Wp = proj(b, who);
        const rad = (0.08 + rr * 0.06) * kk;
        const ang = (Math.atan2(Q.y - Wp.y, Q.x - Wp.x) * 180) / Math.PI;
        const pt = (d: number) => ({x: Q.x + Math.cos(((ang + d) * Math.PI) / 180) * rad, y: Q.y + Math.sin(((ang + d) * Math.PI) / 180) * rad});
        const p0 = pt(-60), p1 = pt(60);
        out.push(<path key={`s${n}`} d={`M${f1(p0.x)},${f1(p0.y)} A${f1(rad)},${f1(rad)} 0 0 1 ${f1(p1.x)},${f1(p1.y)}`} fill="none" stroke="#FFE68A" strokeWidth={Math.max(1.3, kk * 0.008)} opacity={0.8 * clamp(rr / 0.1) * clamp((dist - rr) / 0.3)} />);
      }
    }
  }
  return <g style={{mixBlendMode: 'screen'}}>{out}</g>;
};

// ------------------------------------------------------------------ the lab display: the dataset
const MISSES = [37, 104, 151];
const Display: React.FC<{b: B; t: number}> = ({b, t}) => {
  const u = useUid();
  const tl = proj(b, v3(DISP.x - DISP.w / 2, DISP.y + DISP.h / 2, DISP.z)), br = proj(b, v3(DISP.x + DISP.w / 2, DISP.y - DISP.h / 2, DISP.z));
  const r = {x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y};
  const cols = 18, rows = 11; // 198 places, 197 used
  const gx = r.x + r.w * 0.05, gy = r.y + r.h * 0.24, gw = r.w * 0.9, gh = r.h * 0.64;
  const cw = gw / cols, ch = gh / rows;
  // recordings arrive (the first two are A and B), then matching sweeps the set
  const filled = (n: number) => (n === 0 ? ss(t, cross.A + 0.6, cross.A + 0.8) : n === 1 ? ss(t, cross.B + 0.6, cross.B + 0.8) : ss(t, SB.people + 0.25 + n * 0.003, SB.people + 0.35 + n * 0.003));
  const matched = (n: number) => ss(t, SB.identified + 0.15 + ((n * 37) % 197) * 0.008, SB.identified + 0.25 + ((n * 37) % 197) * 0.008);
  const fsT = r.h * 0.085;
  return (
    <g>
      <Poly b={b} pts={rz(DISP.z + 0.01, DISP.x - DISP.w / 2 - 0.05, DISP.x + DISP.w / 2 + 0.05, DISP.y - DISP.h / 2 - 0.05, DISP.y + DISP.h / 2 + 0.05)} fill="#1B252C" />
      <defs><clipPath id={`${u}disp`}><rect x={r.x} y={r.y} width={r.w} height={r.h} /></clipPath></defs>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#0B1522" />
      <g clipPath={`url(#${u}disp)`}>
        <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.11)} fontSize={f1(fsT)} fill="#E8F1F6" fontFamily={mono} fontWeight={700}>197 PARTICIPANTS</text>
        <text x={f1(r.x + r.w * 0.05)} y={f1(r.y + r.h * 0.18)} fontSize={f1(fsT * 0.5)} fill="#8FB4CF" fontFamily={mono}>{t < SB.identified - 0.1 ? 'WALKS RECORDED' : 'NEW WALKS MATCHED TO RECORDINGS'}</text>
        {Array.from({length: 197}, (_, n) => {
          const cx = gx + (n % cols) * cw, cy = gy + Math.floor(n / cols) * ch;
          const fl = filled(n), m = matched(n);
          if (fl <= 0) return <rect key={n} x={f1(cx + cw * 0.08)} y={f1(cy + ch * 0.1)} width={f1(cw * 0.84)} height={f1(ch * 0.8)} rx={f1(cw * 0.1)} fill="#13243A" />;
          const miss = MISSES.includes(n);
          const seed = n * 13 + 5;
          return (
            <g key={n} opacity={0.35 + 0.65 * fl}>
              {/* the cell holds that walk's pattern (three muted bands); matched, it turns solid green, a miss red */}
              {[0, 1, 2].map((j) => <rect key={j} x={f1(cx + cw * 0.08)} y={f1(cy + ch * (0.1 + j * 0.267))} width={f1(cw * 0.84)} height={f1(ch * 0.27)} fill={['#1B4F7A', '#1F6C80', '#2E7F74', '#7A6A3A', '#7A4A35'][Math.floor(hash(seed, j) * 5)]} />)}
              {m > 0 && <rect x={f1(cx + cw * 0.08)} y={f1(cy + ch * 0.1)} width={f1(cw * 0.84)} height={f1(ch * 0.8)} rx={f1(cw * 0.1)} fill={miss ? '#D9534F' : '#2FB37A'} opacity={m} />}
            </g>
          );
        })}
        <text x={f1(r.x + r.w * 0.95)} y={f1(r.y + r.h * 0.95)} textAnchor="end" fontSize={f1(fsT * 0.42)} fill="#6F8FA6" fontFamily={mono}>ILLUSTRATION · NOT STUDY DATA</text>
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ the scene
const HAND: HandPose = {curl: [0.22, 0.28, 0.32, 0.36], spread: 0.35, thumb: 22, thumbCurl: 0.4};
const Pack: React.FC<{cd: ReturnType<typeof cardAt>; p: ManPose}> = ({cd, p}) => {
  const j = manJoints(p);
  const c = cardPt(cd, {x: j.C.x + 92, y: j.C.y - 20});
  const w = 120 * cd.k, h = 180 * cd.k;
  return <rect x={f1(c.x - w / 2)} y={f1(c.y - h / 2)} width={f1(w)} height={f1(h)} rx={f1(w * 0.3)} fill="#3E6FB0" stroke={INK} strokeWidth={Math.max(1, cd.k * 6)} />;
};
export const StudyScene3: React.FC<{t: number}> = ({t}) => {
  const u = useUid();
  const b = basis(studyCam(t));
  const people = ([[A, cross.A], [Bw, cross.B]] as [Walker, number][]).map(([w, tc], i) => ({w, i, ...placed(w, tc, t)})).filter((q) => Math.abs(q.wx) < 3.4);
  const near = people.reduce((a, q) => (Math.abs(q.wx) < Math.abs(a.wx) ? q : a), {wx: 99, at: v3(99, 0, LANE_Z)} as {wx: number; at: V3});
  const ex: Expr = {...EXPR_NEUTRAL, gx: -0.6, smile: 0.2};
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect width={1080} height={1920} fill={CG.wall} />
      <Room b={b} />
      <Display b={b} t={t} />
      <Kit b={b} t={t} rec={<Recording b={b} t={t} />} />
      {people.map(({w, i, at, p}) => {
        const cd = cardAt(b, at, w.s);
        return (
          <g key={i}>
            <FloorShadow cd={cd} x={0} w={200} />
            {w.pack && <Pack cd={cd} p={p} />}
            <Person id={`${u}w${i}`} cd={cd} p={p} farBehind look={{outfit: w.o, expr: ex, lHand: HAND, rHand: HAND}} />
          </g>
        );
      })}
      {near.wx < 3 && t < SB.people + 0.1 && <Signal b={b} t={t} who={v3(near.wx, 1.15, LANE_Z)} />}
    </svg>
  );
};
