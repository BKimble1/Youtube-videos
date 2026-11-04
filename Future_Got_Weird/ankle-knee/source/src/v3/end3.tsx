// V3 ending inserts.
//   FootShot3  recovery: his turned foot hangs past the pillow, a recognisable foot (the 3D model: big toe, four
//              smaller toes, nails, heel) resting its toes on the blanket; one wiggle creases the fabric
//   FaceShot3  cut on the wiggle to Wyatt noticing: eyes down to his foot, a small believable smile; a blanket fold
//   LaceShot3  the fold matches a lace pulled tight on his cleat (studs and stripe: a cleat at once)
//   PlantShot3 cut on the tug: the cleat plants on the turf
import React from 'react';
import {Cam, Layer, W, H, camScale} from '../camera';
import {Inked, InkPath, InkLine} from '../dc/ink';
import {Blob, Capsule, SoftShadow} from '../dc/shade';
import {Hand} from '../dc/Hand';
import {lit, shade} from '../dc/color';
import {fmt, V} from '../dc/math';
import {closed} from '../core/geo';
import {Cleat, footPt, BioFoot} from '../art/wyatt';
import {C} from '../art/pal';
import {clamp, ss, ss5, lerp} from '../lib';
import {Crease} from '../v2/bed2';
import {Wyatt2, bjoints, SKIN} from '../v2/body';
import {recoveryPose, HAND_PINCH} from '../v2/poses';
import {EXPR_NEUTRAL} from '../dc/Head';
import {T3, start3, end3, FACE_T} from './story3';
import {PitchShot3} from './Scene3';

const pth = (ps: V[], t = 0.6) => closed(ps, t);
const Wall: React.FC<{k: string}> = ({k}) => (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
    <defs><linearGradient id={`${k}wl`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={lit(C.wall, 0.3)} /><stop offset="1" stopColor={C.wallDeep} /></linearGradient></defs>
    <rect x={0} y={0} width={W} height={H} fill={`url(#${k}wl)`} />
  </svg>
);

// ------------------------------------------------------------------------------------------------------ the foot
const AF: V = {x: 0, y: -20};
export const footToe = (t: number) => {
  const wig = clamp((t - (T3.wiggle - 0.02)) / 0.42);
  return 34 * Math.sin(Math.PI * wig) * (wig > 0 && wig < 1 ? 1 : 0) + 8 * Math.max(0, Math.sin(Math.PI * clamp((t - (T3.woke + 0.05)) / 0.4)));
};
export const FootShot3: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c: Cam = {x: lerp(-1, -2, ss(t, start3('foot'), FACE_T)), y: -12, w: lerp(32, 27, ss5(t, start3('foot'), FACE_T)), eye: -40};
  const iw = 7 / camScale(c);
  const toe = footToe(t);
  // the turned foot hangs past the pillow, toes down on the blanket: the rig's foot from the inside (big toe nearest,
  // the four smaller toes beside it, nails on each)
  const FA = 8;
  const tip = footPt(AF, FA, -1, 17.0, 4.3);
  const blanket = tip.y + 1.2;
  const press = clamp(toe / 34);
  return (
    <>
      <Wall k={k} />
      <Layer c={c}>
        {/* the mattress and blanket below, the pillow under his thigh */}
        <Inked w={iw}><Blob id={`${k}bk`} d={pth([{x: -40, y: blanket}, {x: 60, y: blanket - 1}, {x: 60, y: 30}, {x: -40, y: 30}], 0.2)} c={{x: 0, y: blanket + 4}} r={50} color={C.gown} k={0.6} /></Inked>
        <Inked w={iw}><Blob id={`${k}pl`} d={pth([{x: 12, y: blanket - 1}, {x: 13, y: AF.y + 4}, {x: 30, y: AF.y + 1}, {x: 70, y: AF.y + 2}, {x: 70, y: blanket - 1}], 0.5)} c={{x: 36, y: AF.y + 6}} r={30} color={lit(C.sheet, 0.1)} /></Inked>
        {/* the thigh beyond the turned shin, with the clean dressing over the join */}
        <Inked w={iw}><Capsule id={`${k}th`} a={{x: 18, y: AF.y - 0.6}} b={{x: 80, y: AF.y - 4}} ra={4.9} rb={8} color={SKIN} /></Inked>
        <Inked w={iw}><Capsule id={`${k}dr`} a={{x: 14, y: AF.y - 0.4}} b={{x: 24, y: AF.y - 1.2}} ra={5.4} rb={5.8} color={C.dressing} k={0.5} /></Inked>
        <SoftShadow id={`${k}ts`} c={{x: tip.x, y: blanket + 0.4}} rx={6} ry={1.1} alpha={0.25} color="#3E5B6B" />
        <Crease c={{x: tip.x, y: blanket}} s={clamp(press * 1.4 + ss(t, T3.wiggle + 0.25, FACE_T) * 0.3)} iw={iw} />
        <Inked w={iw}><Capsule id={`${k}an`} a={{x: 19, y: AF.y - 0.6}} b={AF} ra={4.6} rb={3.6} color={SKIN} /></Inked>
        <BioFoot id={`${k}f`} A={AF} fa={FA} h={-1} iw={iw} toeCurl={toe} skin={SKIN} />
      </Layer>
    </>
  );
};

// ------------------------------------------------------------------------------------------------------ the face
export const FaceShot3: React.FC<{t: number; k: string}> = ({t, k}) => {
  const notice = ss(t, FACE_T, FACE_T + 0.25);
  const smile = ss(t, FACE_T + 0.25, FACE_T + 0.7);
  const p = recoveryPose({H: {x: 0, y: -22}, neck: lerp(18, 28, notice), blink: Math.max(0, 1 - (t - FACE_T) / 0.12) * 0.5,
    expr: {...EXPR_NEUTRAL, lid: lerp(0.35, 0.18, notice), gx: lerp(-0.2, -0.8, notice), gy: lerp(0.3, 0.95, notice), smile: lerp(0.05, 0.4, smile), browIn: 0.2 * notice, flush: 0.25 + 0.15 * smile}});
  const j = bjoints(p);
  const c: Cam = {x: j.headC.x - 5, y: j.headC.y + 14, w: lerp(42, 39, ss(t, FACE_T, end3('face'))), eye: -40};
  const px = 1 / camScale(c);
  const iw = 7 * px;
  const foldC = {x: c.x, y: c.y + 26};
  const blanket = (
    <g>
      <Inked w={iw}>
        <Blob id={`${k}bl`} d={pth([{x: j.headC.x - 70, y: foldC.y - 4}, {x: j.headC.x - 20, y: foldC.y - 9}, {x: j.headC.x + 6, y: j.headC.y + 30}, {x: j.headC.x + 30, y: j.headC.y + 30}, {x: j.headC.x + 40, y: foldC.y + 30}, {x: j.headC.x - 70, y: foldC.y + 30}], 0.5)} c={{x: c.x, y: foldC.y}} r={40} color={C.gown} k={0.7} />
      </Inked>
      {[-1, 0, 1].map((q) => (
        <InkLine key={q} d={`M${fmt(foldC.x - 9 + q * 6)},${fmt(foldC.y - 3 + q)} Q${fmt(foldC.x + q * 6)},${fmt(foldC.y + 2 + q)} ${fmt(foldC.x + 9 + q * 6)},${fmt(foldC.y - 3 + q)}`} w={iw * 0.7} opacity={0.6} />
      ))}
    </g>
  );
  return (
    <>
      <Wall k={k} />
      <Layer c={c}>
        <Inked w={iw}><InkPath d={pth([{x: 2, y: -9}, {x: 24, y: -9}, {x: 64, y: -80}, {x: 44, y: -92}], 0.25)} fill={C.bed} /></Inked>
        <Inked w={iw}><Blob id={`${k}hp`} d={pth([{x: 8, y: -60}, {x: 26, y: -86}, {x: 44, y: -82}, {x: 44, y: -48}, {x: 22, y: -38}])} c={{x: 28, y: -64}} r={26} color={C.sheet} /></Inked>
        <Wyatt2 p={p} o={{id: `${k}w`, px, shoeN: 'bare', shoeF: 'bare', prosthesis: false, footRel: 90, shirt: C.gown, shorts: C.gown, sock: null, beforeNearArm: blanket}} />
      </Layer>
    </>
  );
};

// ------------------------------------------------------------------------------------------------------ the lace
export const LaceShot3: React.FC<{t: number; k: string}> = ({t, k}) => {
  const t0 = start3('lace'), t1 = end3('lace');
  const tug = ss5(t, T3.learned - 0.12, t1 - 0.03);
  const s = 44;
  const A = {x: W / 2 + 40, y: H / 2 + 160};
  const F = (u: number, v: number) => footPt({x: 0, y: 0}, 90, 1, u, v);
  const eyelets = [2.6, 4.6, 6.6, 8.6, 10.4].map((u) => ({u, v: -2.6 + (u - 2.6) * 0.42}));
  const slack = lerp(1.6, 0.15, tug);
  const lift = lerp(0, -1.2, tug);
  const xs = eyelets.slice(0, -1).map((a, i) => {
    const b = eyelets[i + 1];
    const p = F(a.u, a.v - 0.6), q = F(b.u, b.v - 0.6);
    const m = F((a.u + b.u) / 2, (a.v + b.v) / 2 - 0.6 - slack + lift);
    return `M${fmt(p.x)},${fmt(p.y)} Q${fmt(m.x)},${fmt(m.y)} ${fmt(q.x)},${fmt(q.y)}`;
  });
  const top = F(eyelets[0].u, eyelets[0].v - 0.6);
  const hand = {x: top.x - 1.5, y: lerp(top.y - 7, top.y - 11, tug)};
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <defs><linearGradient id={`${k}lb`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={lit(C.turfLight, 0.2)} /><stop offset="1" stopColor={C.turfDeep} /></linearGradient></defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${k}lb)`} />
      <g transform={`translate(${fmt(A.x)} ${fmt(A.y)}) scale(${s})`}>
        <Cleat id={`${k}cl`} A={{x: 0, y: 0}} fa={90} iw={0.16} />
        {eyelets.map((e, i) => { const q = F(e.u, e.v - 0.6); return <circle key={i} cx={fmt(q.x)} cy={fmt(q.y)} r={0.32} fill="#2B2F36" />; })}
        {xs.map((d, i) => <path key={i} d={d} fill="none" stroke="#FFFFFF" strokeWidth={0.42} strokeLinecap="round" />)}
        {xs.map((d, i) => <path key={`o${i}`} d={d} fill="none" stroke="#172B3A" strokeWidth={0.08} opacity={0.6} />)}
        <path d={`M${fmt(top.x)},${fmt(top.y)} Q${fmt(top.x + 2 * (1 - tug))},${fmt((top.y + hand.y) / 2)} ${fmt(hand.x)},${fmt(hand.y + 1.4)}`} fill="none" stroke="#FFFFFF" strokeWidth={0.42} strokeLinecap="round" />
        <Inked w={0.18}>
          <Capsule id={`${k}fa`} a={{x: hand.x + 4, y: hand.y - 14}} b={{x: hand.x + 0.5, y: hand.y - 3}} ra={2.4} rb={2.0} color={SKIN} />
          <Hand id={`${k}hd`} wrist={{x: hand.x + 0.5, y: hand.y - 3}} ang={100} L={8.5} thumbSide={1} view="back" pose={HAND_PINCH} color={SKIN} bare />
        </Inked>
      </g>
      {void t0}
    </svg>
  );
};

// ------------------------------------------------------------------------------------------------------ the plant
export const PlantShot3: React.FC<{t: number; k: string}> = ({t, k}) => <PitchShot3 t={t} c={{x: 124, y: -21, w: 46, eye: -13}} k={k} />;
