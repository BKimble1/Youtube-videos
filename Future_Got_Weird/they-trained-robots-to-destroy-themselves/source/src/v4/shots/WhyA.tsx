// V4 WHY, part A (19.4 → 37.0): the F.02 introduced from its emblem, the job it did (hand/object contact), the F.03
// matched-pose comparison and the fleet growing, the F.02 carried off, and "what do you do with a retired robot?".
import React from 'react';
import {T} from '../../v3/cues';
import {Cam, Scene, Layer, Bot, Crew, Chip, Title, mixCam, seg, smooth, easeInOut, easeOut, backOut, lerp, springy} from '../kit/scene';
import {BayBack, Plinth, Conveyor, DoorPanel, PartsCart, BAY, BCOL, Spot} from '../sets/bay';
import {rig, RPose} from '../rig/Robot2D';
import {stand, blend, A} from '../rig/poses';
import {CHEST_Z, S_OPEN} from './Opening';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {C, F} from '../../theme';

const G = BAY.floor;
const S2B = T('Figure says they spent') - 0.1;
const S2C = T('But as its newer') - 0.06;
const S2D = T('So what do you do') - 0.12;
export const WHY_A_END = T('Sell it') - 0.08;

// ---------------------------------------------------------------- S2a: from the emblem to the robot
const F02_FRONT = stand(0, G, 1, {yaw: 0, armN: A(3, 8, {grip: 0.3}), armF: A(3, 8, {grip: 0.3})});
const chest0 = rig(F02_FRONT, 1).pts.chest;
const a2Pose = (tau: number, t0: number): RPose => {
  const turn = smooth(seg(tau, t0 + 2.1, t0 + 3.3));
  const p = stand(0, G, 1, {yaw: lerp(0, 0.45, turn), armN: A(3, 8, {grip: 0.3}), armF: A(3, 8, {grip: 0.3})});
  // a small, purposeful gesture: the hand comes up, the fingers close, the head looks at it
  const g = smooth(seg(tau, t0 + 3.6, t0 + 4.3)) * (1 - smooth(seg(tau, t0 + 5.0, t0 + 5.6)));
  if (g > 0) {
    const r0 = rig(p, 1);
    const h = {x: lerp(r0.pts.wrN[0], 150, g), y: lerp(r0.pts.wrN[1] + 40, 520, g)};
    p.handN = h;
    p.armN = {...p.armN, grip: lerp(0.3, 0.85, smooth(seg(tau, t0 + 4.3, t0 + 4.7)))};
    p.head = 14 * g;
    p.neck = 6 * g;
  }
  return p;
};

// ---------------------------------------------------------------- S2b: loading parts (tote → conveyor)
const CART_X = 250, BELT = {x0: 360, x1: 2600, y: 640};
const PANEL_IN_TOTE = {x: 250, y: G - 470};
const loadPose = (tau: number): {pose: RPose; panel: {x: number; y: number; rot: number} | null; released: number} => {
  const t = tau - S2B;
  const base = stand(30, G, 1, {yaw: 0.5});
  const reachDown: RPose = {...base, rot: 6, waist: 14, neck: 8, head: 12, y: base.y + 12};
  const lift: RPose = {...base, rot: 0, waist: 2, neck: 2, head: 4};
  const place: RPose = {...base, rot: 6, waist: 12, neck: 8, head: 10, y: base.y + 8};
  const ph = (a: number, b: number) => smooth(seg(t, a, b));
  // body
  let body = blend(base, reachDown, ph(0.0, 0.55));
  body = blend(body, lift, ph(0.6, 1.2));
  body = blend(body, place, ph(1.3, 2.0));
  body = blend(body, base, ph(2.5, 3.1));
  // panel path (both hands on it while carried)
  const pA = PANEL_IN_TOTE, pB = {x: 230, y: 470}, pC = {x: 420, y: BELT.y - 30};
  let panel: {x: number; y: number; rot: number} | null = null;
  let released = 0;
  if (t < 0.6) panel = {x: pA.x, y: pA.y, rot: -90};
  else if (t < 1.2) {
    const u = ph(0.6, 1.2);
    panel = {x: lerp(pA.x, pB.x, u), y: lerp(pA.y, pB.y, u) - Math.sin(Math.PI * u) * 30, rot: lerp(-90, -10, u)};
  } else if (t < 2.05) {
    const u = ph(1.25, 2.0);
    panel = {x: lerp(pB.x, pC.x, u), y: lerp(pB.y, pC.y, u) - Math.sin(Math.PI * u) * 40, rot: lerp(-10, 0, u)};
  } else {
    released = t - 2.05;
    panel = {x: pC.x + 240 * Math.max(0, released - 0.3), y: pC.y, rot: 0};
  }
  // hands: on the panel's two ends while held, otherwise relaxed
  const held = t > 0.45 && t < 2.15;
  const reaching = t <= 0.45 ? ph(0.0, 0.45) : 1;
  if (panel && (held || t <= 0.45)) {
    // grips in the panel's own frame: on its top edge while it stands in the tote, at its two ends once it is flat
    const flat = Math.max(0, Math.min(1, (panel.rot + 90) / 80));
    const rr = (panel.rot * Math.PI) / 180;
    const loc = (lx: number, ly: number) => ({x: panel.x + Math.cos(rr) * lx - Math.sin(rr) * ly, y: panel.y + Math.sin(rr) * lx + Math.cos(rr) * ly});
    const gn = loc(lerp(70, -62, flat), lerp(-14, -34, flat)), gf = loc(lerp(70, 62, flat), lerp(14, -34, flat));
    const r0 = rig(body, 1);
    const k = held ? 1 : reaching;
    body.handN = {x: lerp(r0.pts.wrN[0], gn.x, k), y: lerp(r0.pts.wrN[1] + 30, gn.y - 20, k)};
    body.handF = {x: lerp(r0.pts.wrF[0], gf.x, k), y: lerp(r0.pts.wrF[1] + 30, gf.y - 20, k)};
    body.armN = {...body.armN, grip: held ? 0.8 : 0.4};
    body.armF = {...body.armF, grip: held ? 0.8 : 0.4};
  }
  return {pose: body, panel, released};
};

// ---------------------------------------------------------------- S2c: F.02 vs F.03 (matched front poses)
const compPose = (x: number): RPose => stand(x, G, 1, {yaw: 0, armN: A(3, 8, {grip: 0.3}), armF: A(3, 8, {grip: 0.3})});

export const WhyA: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  const WHY0 = T('Start with') - 0.12;
  // ------------------------------------------ S2a
  if (tau < S2B) {
    const p = a2Pose(tau, WHY0);
    const cStart: Cam = {x: chest0[0], y: chest0[1], z: S_OPEN * CHEST_Z};
    const cWaist: Cam = {x: -150, y: 560, z: 1.55};
    const cFull: Cam = {x: -330, y: 700, z: 1.02};
    const cConv: Cam = {x: 210, y: 620, z: 1.62};
    let cam = mixCam(cStart, cWaist, easeInOut(seg(tau, WHY0 + 0.15, WHY0 + 1.7)));
    cam = mixCam(cam, cFull, easeInOut(seg(tau, WHY0 + 2.0, WHY0 + 4.0)));
    cam = mixCam(cam, cConv, easeInOut(seg(tau, S2B - 0.9, S2B)));
    const lw = 4 / cam.z;
    const tl = seg(tau, T('These are') + 0.15, T('These are') + 0.55) * (1 - seg(tau, S2B - 0.8, S2B - 0.4));
    return (
      <Scene bg={BCOL.wall} over={<Title x={110} y={640} big="F.02" small="Figure's second-generation humanoid" k={tl} />}>
        <Layer cam={cam}>
          <BayBack lw={lw} />
          <Spot x={0} y={600} r={620} />
          <Plinth x={0} lw={lw} />
          <PartsCart x={CART_X} lw={lw} />
          <Conveyor x0={BELT.x0} x1={BELT.x1} y={BELT.y} lw={lw} offset={tau * 120} />
          <Bot cam={cam} id="a2" model="F02" s={1} pose={p} />
        </Layer>
      </Scene>
    );
  }
  // ------------------------------------------ S2b
  if (tau < S2C) {
    const st = loadPose(tau);
    const t = tau - S2B;
    const cam = mixCam({x: 210, y: 620, z: 1.62}, {x: 330, y: 610, z: 1.55}, easeInOut(seg(t, 0, 3.6)));
    const lw = 4 / cam.z;
    // earlier panels already riding the belt
    const riders = [0, 1, 2].map((k) => ({x: 820 + k * 420 + 240 * t, y: BELT.y - 30}));
    return (
      <Scene bg={BCOL.wall} over={<Chip x={100} y={64} lines={['FIGURE SAYS', 'months loading parts at a BMW plant']} k={seg(t, 0.3, 0.7)} tone="paper" size={38} />}>
        <Layer cam={cam}>
          <BayBack lw={lw} />
          <Conveyor x0={BELT.x0} x1={BELT.x1} y={BELT.y} lw={lw} offset={tau * 240} />
          {riders.map((r, k) => <DoorPanel key={k} x={r.x} y={r.y} lw={lw} />)}
          <PartsCart x={CART_X} lw={lw} n={st.panel && st.panel.rot === -90 ? 3 : 2} />
          <Bot cam={cam} id="a2b" model="F02" s={1} pose={st.pose} />
          {st.panel && st.panel.rot !== -90 ? <DoorPanel x={st.panel.x} y={st.panel.y} rot={st.panel.rot} lw={lw} /> : null}
        </Layer>
      </Scene>
    );
  }
  // ------------------------------------------ S2c: matched-pose comparison, the fleet grows, the F.02 rolls away
  if (tau < S2D) {
    const t = tau - S2C;
    const slideIn = easeOut(seg(t, 0, 0.55));
    const x03 = lerp(1500, 280, slideIn);
    const away = easeInOut(seg(tau, T('stopped making') - 0.1, S2D + 0.1));
    const x02 = lerp(-280, -1500, away);
    const cam: Cam = {x: lerp(0, -120, away), y: 690, z: 1.0};
    const lw = 4 / cam.z;
    const p02 = compPose(x02);
    const tired = smooth(seg(tau, T('keeping the old') - 0.1, T('keeping the old') + 0.5));
    p02.head = 16 * tired; p02.neck = 6 * tired; p02.waist = 4 * tired;
    p02.armN = A(1, 4); p02.armF = A(1, 4);
    const fleetT = T('fleet grew') - 0.15;
    const fleet = [0, 1, 2, 3, 4].map((k) => springy(tau - fleetT - k * 0.16, 1.6, 7));
    const tag = backOut(seg(tau, T('keeping the old') + 0.1, T('keeping the old') + 0.45));
    return (
      <Scene bg={BCOL.wall}
        over={(
          <>
            <Title x={420 + (x02 - -280) * 1.0} y={830} big="F.02" k={seg(t, 0.35, 0.7) * (1 - away)} align="center" />
            <Title x={960 + 280} y={830} big="F.03" small="newer model" k={seg(t, 0.5, 0.9)} align="center" accent={C.teal} />
          </>
        )}>
        <Layer cam={cam}>
          <BayBack lw={lw} />
          {/* the growing F.03 fleet on the back line */}
          {fleet.map((k, i) => (k > 0.01 ? (
            <g key={i} transform={`translate(${560 + i * 230} ${G - 40}) scale(${0.62 * k}) translate(${-(560 + i * 230)} ${-(G - 40)})`}>
              <Bot cam={{...cam, z: cam.z * 0.62}} id={'fl' + i} model="F03" s={1} pose={stand(560 + i * 230, G - 40, 1, {yaw: 0.35})} />
            </g>
          ) : null))}
          <Plinth x={x03} lw={lw} w={440} />
          <Bot cam={cam} id="c03" model="F03" s={1} pose={compPose(x03)} />
          <g>
            <rect x={x02 - 260} y={G - 6} width={520} height={30} rx={10} fill={BCOL.belt} stroke={BCOL.ink} strokeWidth={lw} />
            {Array.from({length: 8}, (_, i) => <circle key={i} cx={x02 - 230 + i * 66} cy={G + 9} r={lw * 2} fill={BCOL.beamD} />)}
          </g>
          <Bot cam={cam} id="c02" model="F02" s={1} pose={p02} />
          {tag > 0.01 ? (
            <g transform={`translate(${x02 + 170} ${G - 560}) scale(${tag})`}>
              <rect x={-10} y={-56} width={330} height={86} rx={16} fill={C.paper} stroke={C.coral} strokeWidth={lw * 1.4} />
              <text x={155} y={4} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={44} fill={C.coral}>needs service</text>
            </g>
          ) : null}
        </Layer>
      </Scene>
    );
  }
  // ------------------------------------------ S2d: "So what do you do with a retired robot?"
  const t = tau - S2D;
  const push = easeOut(seg(t, 0, 1.0));
  const rx = lerp(-1300, -120, push);
  const cam: Cam = {x: 260, y: 640, z: 1.12};
  const lw = 4 / cam.z;
  const p = stand(rx, G - 30, 1, {yaw: 0.35, armN: A(1, 4), armF: A(1, 4), head: 10, neck: 4});
  const clerkX = rx - 330;
  const handle = {x: rx - 170, y: G - 300};
  const opts = [
    {lab: 'SELL?', icon: 'crate', y: 420, t: T('Sell it') - 0.1},
    {lab: 'TAKE APART?', icon: 'wrench', y: 560, t: T('Take them apart') - 0.1},
    {lab: 'MELT?', icon: 'flame', y: 700, t: T('Melt them') - 0.1},
  ];
  return (
    <Scene bg={BCOL.wall}>
      <Layer cam={cam}>
        <BayBack lw={lw} />
        {/* signpost with three options */}
        <rect x={480} y={330} width={22} height={G - 330} fill="#9E6B30" stroke={BCOL.ink} strokeWidth={lw} />
        {opts.map((o, i) => {
          const k = backOut(seg(t, 0.5 + i * 0.25, 0.85 + i * 0.25));
          if (k <= 0.01) return null;
          return (
            <g key={o.lab} transform={`translate(${491} ${o.y}) scale(${k}) translate(${-491} ${-o.y})`}>
              <path d={`M502 ${o.y - 46} L940 ${o.y - 46} L990 ${o.y} L940 ${o.y + 46} L502 ${o.y + 46} Z`} fill={i === 0 ? C.saffron : C.paper} stroke={BCOL.ink} strokeWidth={lw} strokeLinejoin="round" />
              <text x={560} y={o.y + 16} fontFamily={F.display} fontWeight={700} fontSize={46} fill={BCOL.ink}>{o.lab}</text>
            </g>
          );
        })}
        {/* wheeled service stand */}
        <rect x={rx - 150} y={G - 34} width={300} height={22} rx={6} fill={BCOL.frameD} stroke={BCOL.ink} strokeWidth={lw} />
        {[-110, 110].map((dx) => <circle key={dx} cx={rx + dx} cy={G - 8} r={14} fill={BCOL.ink} />)}
        <path d={`M${rx - 150} ${G - 30} L${handle.x} ${handle.y}`} stroke={BCOL.frameD} strokeWidth={lw * 3} strokeLinecap="round" />
        <Bot cam={cam} id="d02" model="F02" s={1} pose={p} />
        <Crew look={CAST.clerkA} x={clerkX} y={G} h={560} frame={Math.round(tau * 30)} seed={3}
          pose={push < 1 ? {...IDLE, armR: {a: 62, b: 20}, lean: 6, lookX: 0.6, mouth: 'flat'} : {...IDLE, armR: {a: 150, b: 120}, armL: {a: 10, b: 10}, lookX: 0.8, lookY: -0.3, brows: 0.5, mouth: 'hmm'}} />
      </Layer>
    </Scene>
  );
};
void springy;
