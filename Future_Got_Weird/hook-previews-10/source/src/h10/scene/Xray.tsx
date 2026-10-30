// HOOK 10: the local cutaway. Inside a soft window that travels down his body with the camera, the skin and clothes
// turn to translucent tissue and the anatomy shows in a clean mid-sagittal style (Zombie Ant / Cockroach cutaways):
// skull, brain and motor cortex with the skull implant over it; the cervical, thoracic and lumbar spine with the cord
// in its canal and the injured C5-C7 segment; the paddle electrode on the cord's back over T11-L1, its lead and the
// abdominal pulse generator; the hip bone and the near leg's bones, nerves and muscles. Everything is placed in the
// participant's own frames (body.ts) so it walks with him.
import React from 'react';
import {lit, mix, shade} from '../rig/color';
import {INK} from '../rig/ink';
import {limbGeo} from '../rig/limb';
import {torsoPath, DIM, ManPose} from '../rig/Man';
import {add, clamp, fmt, mul, norm, P, perp, sub, V} from '../rig/math';
import {capsulePath} from '../rig/shade';
import {closedPath, openPath} from '../../shared/lib';
import {Frames, polyD, Track} from './body';
import {HEADPT, Paths, TORPT} from './paths';
import {SIG, SIG_CORE} from './Pulse';

export const BONE = '#ECE2C9';
export const DISC = '#8DB0BE';
export const CORD = '#F2E0B3';
export const NERVE = '#F4D88E';
export const BRAIN = '#E6A2A2';
export const MUSCLE = '#BF4C57';
const TINT = '#0D2A35';

const ptsD = (pts: V[]) => closedPath(pts.map((p) => ({x: p.x, y: p.y})), 1);
const lineD = (pts: V[]) => openPath(pts.map((p) => ({x: p.x, y: p.y})), 1);

export type Act = {
  cortex: number; // motor cortex activity 0..1
  rec: number; // implant electrodes recording 0..1
  lesionGlow: number;
  pad: number; // paddle electrodes firing 0..1
  quad: number; // near-leg muscle activations 0..1
  ham: number;
  calf: number;
  ta: number;
  t: number;
};

const HEAD_D = `M0,-107 C55,-107 100,-60 100,0 C100,60 55,107 0,107 C-55,107 -100,60 -100,0 C-100,-60 -55,-107 0,-107 Z`;

/** a spindle (muscle belly) along the near leg: from f0 to f1, centre offset c(f), half width w */
const spindle = (F: Frames, f0: number, f1: number, c0: number, c1: number, w: number, k = 1) => {
  const n = 14;
  const L: V[] = [], R: V[] = [];
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    const f = f0 + (f1 - f0) * x;
    const c = c0 + (c1 - c0) * x;
    const hw = w * k * Math.pow(Math.sin(Math.PI * Math.min(0.97, Math.max(0.03, x))), 0.75);
    L.push(F.leg(f, c + hw));
    R.push(F.leg(f, c - hw));
  }
  return [...L, ...R.reverse()];
};

const Muscle: React.FC<{id: string; F: Frames; f0: number; f1: number; c0: number; c1: number; w: number; act: number}> = ({id, F, f0, f1, c0, c1, w, act}) => {
  const k = 1 + 0.1 * act;
  const outline = spindle(F, f0, f1, c0, c1, w, k);
  const col = mix(MUSCLE, '#FF7A5C', act * 0.75);
  const a = F.leg(f0, (c0 + c1) / 2), b = F.leg(f1, (c0 + c1) / 2);
  const mid = mul(add(a, b), 0.5);
  const ax = norm(sub(b, a));
  const nn = perp(ax);
  const fibers = [-0.6, -0.2, 0.2, 0.6].map((q) => [0.1, 0.3, 0.5, 0.7, 0.9].map((x) => F.leg(f0 + (f1 - f0) * x, (c0 + c1) / 2 + (c1 - c0) * (x - 0.5) + q * w * k * Math.pow(Math.sin(Math.PI * x), 0.75))));
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={fmt(add(mid, mul(nn, w)).x)} y1={fmt(add(mid, mul(nn, w)).y)} x2={fmt(add(mid, mul(nn, -w)).x)} y2={fmt(add(mid, mul(nn, -w)).y)}>
          <stop offset="0" stopColor={lit(col, 0.25)} />
          <stop offset="0.5" stopColor={col} />
          <stop offset="1" stopColor={shade(col, 0.35)} />
        </linearGradient>
      </defs>
      {act > 0.02 && <path d={ptsD(outline)} fill="none" stroke="#FF8A66" strokeOpacity={0.35 * act} strokeWidth={10} strokeLinejoin="round" />}
      <path d={ptsD(outline)} fill={`url(#${id}-g)`} stroke={shade(MUSCLE, 0.55)} strokeWidth={1.6} />
      {fibers.map((f, i) => (
        <path key={i} d={lineD(f)} fill="none" stroke={lit(col, 0.45)} strokeOpacity={0.45 + 0.3 * act} strokeWidth={1.3} />
      ))}
    </g>
  );
};

/** stroked tube along a track (cord, nerve, lead) with a dark edge and a light core line */
const Tube: React.FC<{T: Track | V[]; w: number; color: string; edge?: string; core?: number; opacity?: number}> = ({T, w, color, edge, core = 0.35, opacity = 1}) => {
  const pts = Array.isArray(T) ? T : T.pts;
  const d = polyD(pts);
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={edge ?? shade(color, 0.5)} strokeWidth={w + 2.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      {core > 0 && <path d={d} fill="none" stroke={lit(color, 0.6)} strokeOpacity={core} strokeWidth={w * 0.3} strokeLinecap="round" strokeLinejoin="round" transform="translate(-0.6 -0.8)" />}
    </g>
  );
};

/** the head's contents, drawn in head-local units */
const HeadInside: React.FC<{F: Frames; act: Act}> = ({F, act}) => {
  const h = F.j.head;
  const tr = `translate(${fmt(h.x)} ${fmt(h.y)}) rotate(${fmt(F.headRoll)}) scale(${fmt(F.hs)})`;
  const brain: V[] = [
    {x: -84, y: -30}, {x: -80, y: -60}, {x: -56, y: -82}, {x: -18, y: -90}, {x: 24, y: -88}, {x: 60, y: -74}, {x: 84, y: -46},
    {x: 92, y: -14}, {x: 84, y: 6}, {x: 62, y: 4}, {x: 44, y: 12}, {x: 30, y: 10}, {x: 24, y: -10}, {x: 8, y: -30}, {x: -30, y: -32}, {x: -62, y: -28},
  ];
  const gyri = [
    'M-70,-40 C-60,-52 -46,-46 -40,-58 C-34,-70 -20,-64 -14,-76',
    'M-74,-20 C-62,-24 -58,-36 -46,-34 C-34,-32 -30,-44 -22,-48',
    'M-64,-40 C-52,-46 -40,-38 -30,-44 C-18,-50 -6,-44 4,-48',
    'M34,-4 C42,-10 50,-2 60,-6 C68,-10 74,-4 82,-8',
    'M36,-78 C40,-64 54,-66 58,-52 C62,-40 76,-42 80,-28',
    'M40,-40 C50,-36 52,-24 64,-22 C74,-20 78,-8 86,-6',
    'M30,-60 C34,-50 26,-40 32,-30 C38,-20 30,-12 36,-4',
    'M-40,-78 C-30,-72 -34,-62 -24,-58',
  ];
  // central sulcus (14,-88) -> (-10,-40); precentral (motor) gyrus in front of it
  const sulcus = 'M44,-82 C38,-70 34,-62 28,-54 C22,-46 18,-40 12,-30';
  const motor: V[] = [{x: 40, y: -84}, {x: 32, y: -70}, {x: 24, y: -58}, {x: 16, y: -46}, {x: 8, y: -34}, {x: -4, y: -40}, {x: 6, y: -54}, {x: 16, y: -68}, {x: 24, y: -86}];
  const sparks = Array.from({length: 9}, (_, i) => {
    const ph = (act.t * 3.1 + i * 0.37) % 1;
    const u = (i * 0.618) % 1;
    const x = 30 - 24 * u + 5 * Math.sin(i * 2.1);
    const y = -78 + 40 * u + 4 * Math.cos(i * 1.7);
    const a = act.cortex * Math.max(0, Math.sin(Math.PI * ph)) ** 2;
    return {x, y, a};
  });
  const imp = HEADPT.implant;
  const impF = HEADPT.implantFar;
  return (
    <g transform={tr}>
      <defs>
        <radialGradient id="h10-brain" cx="-0.1" cy="-0.2" r="0.95">
          <stop offset="0" stopColor={lit(BRAIN, 0.3)} />
          <stop offset="0.6" stopColor={BRAIN} />
          <stop offset="1" stopColor={shade(BRAIN, 0.35)} />
        </radialGradient>
        <radialGradient id="h10-motor">
          <stop offset="0" stopColor="#FFC39A" stopOpacity={0.95} />
          <stop offset="1" stopColor="#FF8C6A" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* skull: a bone shell under the scalp (cut where the implant replaces a piece of bone) */}
      <path d={`${HEAD_D} M0,-95 C49,-95 89,-53 89,0 C89,53 49,95 0,95 C-49,95 -89,53 -89,0 C-89,-53 -49,-95 0,-95 Z`} transform="scale(0.985)" fill={BONE} fillRule="evenodd" opacity={0.9} />
      <path d={HEAD_D} transform="scale(0.985)" fill="none" stroke={shade(BONE, 0.4)} strokeWidth={1.5} opacity={0.6} />
      {/* cerebellum, brainstem, cerebrum */}
      <ellipse cx={66} cy={22} rx={26} ry={15} transform="rotate(-12 66 22)" fill={shade(BRAIN, 0.12)} stroke={shade(BRAIN, 0.5)} strokeWidth={1.4} />
      {[-6, 0, 6].map((k) => (
        <path key={k} d={`M${44 + k},${16 + k} Q66,${8 + k * 1.6} ${88},${18 + k}`} fill="none" stroke={shade(BRAIN, 0.45)} strokeWidth={1} opacity={0.7} />
      ))}
      <path d={capsulePath({x: 40, y: 6}, {x: 36, y: 112}, 9, 6.5)} fill={mix(CORD, BRAIN, 0.3)} stroke={shade(CORD, 0.5)} strokeWidth={1.4} />
      <path d={ptsD(brain)} fill="url(#h10-brain)" stroke={shade(BRAIN, 0.55)} strokeWidth={1.6} />
      {/* the dura over the brain */}
      <path d="M-70,-62 C-50,-86 -10,-93 26,-91 C58,-86 80,-62 88,-40" fill="none" stroke="#F6E9E4" strokeOpacity={0.55} strokeWidth={1.6} />
      {gyri.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={shade(BRAIN, 0.42)} strokeWidth={1.6} strokeLinecap="round" opacity={0.75} />
      ))}
      {/* motor cortex (precentral gyrus) lights as he intends the step */}
      <path d={ptsD(motor)} fill={mix(BRAIN, '#F58C78', 0.15 + 0.4 * act.cortex)} opacity={0.8} />
      <path d={sulcus} fill="none" stroke={shade(BRAIN, 0.55)} strokeWidth={2} strokeLinecap="round" />
      <path d="M18,-24 C34,-30 50,-30 70,-34" fill="none" stroke={shade(BRAIN, 0.55)} strokeWidth={2} strokeLinecap="round" />
      {act.cortex > 0.01 && <ellipse cx={20} cy={-60} rx={26} ry={30} fill="url(#h10-motor)" opacity={0.55 * act.cortex} />}
      {sparks.map((s, i) => (
        <circle key={i} cx={fmt(s.x)} cy={fmt(s.y)} r={2.6} fill="#FFF4E0" opacity={fmt(s.a)} />
      ))}
      {/* the two skull implants (64 electrodes each on their underside, on the dura); the far one behind */}
      <Implant c={impF} far rec={act.rec} t={act.t} />
      <Implant c={imp} rec={act.rec} t={act.t} />
    </g>
  );
};

const Implant: React.FC<{c: V; far?: boolean; rec: number; t: number}> = ({c, far, rec, t}) => {
  const body = far ? '#7E8C96' : '#AEB9C2';
  const rx = far ? 22 : 27, ry = 6.5;
  return (
    <g opacity={far ? 0.7 : 1} transform={`rotate(${far ? -4 : 34} ${c.x} ${c.y})`}>
      <ellipse cx={c.x} cy={c.y + 3} rx={rx} ry={ry} fill={shade(body, 0.35)} stroke={INK} strokeWidth={1.2} />
      <rect x={c.x - rx} y={c.y - 2} width={rx * 2} height={5} fill={shade(body, 0.2)} />
      <ellipse cx={c.x} cy={c.y - 2} rx={rx} ry={ry} fill={lit(body, 0.2)} stroke={INK} strokeWidth={1.2} />
      <ellipse cx={c.x - 6} cy={c.y - 3.5} rx={12} ry={2} fill="#FFFFFF" opacity={0.5} />
      {/* the electrode grid on the underside, touching the dura */}
      {Array.from({length: 8}, (_, i) => {
        const x = c.x - rx + 5 + i * ((rx * 2 - 10) / 7);
        const fl = rec * (0.55 + 0.45 * Math.sin(t * 23 + i * 1.9));
        return (
          <g key={i}>
            {fl > 0.05 && <circle cx={x} cy={c.y + 8} r={5} fill={SIG} opacity={0.35 * fl} />}
            <circle cx={x} cy={c.y + 7.2} r={1.9} fill={mix('#C9A65A', SIG_CORE, fl)} stroke={INK} strokeWidth={0.5} />
          </g>
        );
      })}
    </g>
  );
};

/** spine, cord, injury, paddle, lead, pulse generator, hip bone */
const Trunk: React.FC<{F: Frames; Pt: Paths; act: Act}> = ({F, Pt, act}) => {
  const vs = Pt.verts;
  const s = F.s;
  const els: React.ReactNode[] = [];
  // the column's disc band behind the bodies
  const band = [...vs.map((v) => add(v.p, mul(v.n, -v.depth * 0.46))), ...vs.slice().reverse().map((v) => add(v.p, mul(v.n, v.depth * 0.46)))];
  els.push(<path key="band" d={polyD(band) + 'Z'} fill={DISC} stroke={shade(DISC, 0.5)} strokeWidth={1.2} />);
  vs.forEach((v, i) => {
    const hh = v.h * 0.39, dd = v.depth * 0.5;
    const C = (a: number, n: number) => add(v.p, add(mul(v.a, a), mul(v.n, n)));
    const bodyPts = [C(-hh, -dd + 3), C(-hh, dd - 3), C(-hh + 3, dd), C(hh - 3, dd), C(hh, dd - 3), C(hh, -dd + 3), C(hh - 3, -dd), C(-hh + 3, -dd)];
    const lesion = v.name === 'C6' ? 1 : 0;
    // posterior arch (sectioned) and spinous process, behind the canal
    const canal = 22 * s;
    const sp = (v.region === 'C' ? 12 : v.region === 'T' ? 20 : 16) * s;
    const arch = [C(-hh * 0.7, dd + canal), C(-hh * 0.8, dd + canal + 7 * s), C(hh * 0.2, dd + canal + sp), C(hh * 1.1, dd + canal + sp + 2 * s), C(hh * 0.9, dd + canal + sp - 5 * s), C(hh * 0.6, dd + canal + 4 * s), C(hh * 0.6, dd + canal)];
    els.push(
      <g key={v.name}>
        <path d={ptsD(arch)} fill={shade(BONE, 0.12)} stroke={shade(BONE, 0.5)} strokeWidth={1.1} />
        <path d={ptsD(bodyPts)} fill={lesion ? mix(BONE, '#C9B79A', 0.5) : BONE} stroke={shade(BONE, 0.5)} strokeWidth={1.2} />
        <path d={lineD([C(-hh * 0.6, -dd * 0.5), C(-hh * 0.65, dd * 0.4)])} stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.6} fill="none" />
        {/* pedicle bridging body and arch, drawn faint so the canal stays readable */}
        <path d={lineD([C(-hh * 0.2, dd), C(-hh * 0.4, dd + canal)])} stroke={shade(BONE, 0.2)} strokeOpacity={0.35} strokeWidth={3} fill="none" />
      </g>,
    );
    void i;
  });
  // sacrum below L5
  const l5 = vs[vs.length - 1];
  const sac = [add(l5.p, add(mul(l5.a, l5.h * 0.5), mul(l5.n, -l5.depth * 0.45))), add(l5.p, add(mul(l5.a, l5.h * 0.5), mul(l5.n, l5.depth * 0.45))), F.tor(-34, 64), F.tor(-58, 58), F.tor(-62, 50), F.tor(-40, 40)];
  // hip bone (os coxae): the iliac wing fanning up from the socket round the femoral head
  const hp = F.j.lLeg.hp;
  const ilium = [F.tor(36, 58), F.tor(46, 28), F.tor(38, -4), add(hp, mul(F.pxT, -18 * s)), add(hp, mul(F.upT, -16 * s)), add(hp, mul(F.pxT, 18 * s)), F.tor(-24, 56)];
  // the cord, its sheath, the conus and the cauda equina
  const cordW = 9 * s;
  const caudaStart = Pt.cord.pts[Pt.cord.pts.length - 1];
  const cauda = [-2, 0, 2, 4].map((k) => {
    const pts = vs.slice(-4).map((v) => add(v.p, mul(v.n, Pt.cordOff(v) + k * 1.4 * s)));
    return [caudaStart, ...pts, add(F.tor(-40, 64), mul(F.pxT, k))];
  });
  const les = Pt.lesion;
  const pad = Pt.paddle;
  const padAx = norm(sub(pad.bottom, pad.top));
  const padN = perp(padAx);
  const padD = (() => {
    const w = 7 * s;
    return ptsD([add(pad.top, mul(padN, w)), add(pad.mid, mul(padN, w * 1.1)), add(pad.bottom, mul(padN, w)), add(pad.bottom, mul(padAx, 4 * s)), add(pad.bottom, mul(padN, -w)), add(pad.mid, mul(padN, -w * 1.1)), add(pad.top, mul(padN, -w)), add(pad.top, mul(padAx, -4 * s))]);
  })();
  const elec = Array.from({length: 8}, (_, i) => {
    const k = (i + 0.5) / 8;
    const q = add(add(pad.top, mul(sub(pad.bottom, pad.top), k)), mul(padN, (i % 2 ? 2.4 : -2.4) * s));
    return q;
  });
  const ipgC = F.tor(TORPT.ipg.u, TORPT.ipg.v);
  const ipgUp = F.upT, ipgX = F.pxT;
  const IP = (a: number, b: number) => add(ipgC, add(mul(ipgUp, a * s), mul(ipgX, b * s)));
  return (
    <g>
      <path d={ptsD(ilium)} fill={shade(BONE, 0.1)} opacity={0.4} stroke={shade(BONE, 0.45)} strokeWidth={1.2} />
      <circle cx={fmt(hp.x)} cy={fmt(hp.y)} r={fmt(17 * s)} fill="none" stroke={shade(BONE, 0.35)} strokeWidth={3} opacity={0.5} />
      <path d={ptsD(sac)} fill={shade(BONE, 0.06)} stroke={shade(BONE, 0.5)} strokeWidth={1.2} />
      {els}
      {/* cord sheath (dura) and cord */}
      <path d={polyD(Pt.cord.pts)} fill="none" stroke="#C9DCE4" strokeOpacity={0.35} strokeWidth={cordW + 8 * s} strokeLinecap="round" strokeLinejoin="round" />
      {cauda.map((c, i) => (
        <path key={i} d={lineD(c)} fill="none" stroke={shade(NERVE, 0.15)} strokeWidth={1.8 * s} opacity={0.85} />
      ))}
      <Tube T={Pt.cord} w={cordW} color={CORD} />
      {/* the injury: a pinched, scarred, discoloured stretch of cord at C5-C7 */}
      <g>
        <circle cx={fmt(les.c.x)} cy={fmt(les.c.y)} r={fmt((34 + 14 * act.lesionGlow) * s)} fill="url(#h10-glow-red)" opacity={0.75 + 0.25 * act.lesionGlow} />
        <path d={lineD([les.a, les.c, les.b])} fill="none" stroke="#2E1A1C" strokeWidth={cordW * 1.15} strokeLinecap="round" />
        <path d={lineD([les.a, les.c, les.b])} fill="none" stroke="#6A3A3A" strokeWidth={cordW * 0.55} strokeLinecap="round" />
        <path d={lineD([les.a, les.c, les.b])} fill="none" stroke="#B0544A" strokeWidth={cordW * 0.3} strokeLinecap="round" strokeDasharray={`${fmt(3 * s)} ${fmt(2.4 * s)}`} />
        {[-1, 1].map((k) => (
          <path key={k} d={lineD([add(les.a, mul(perp(norm(sub(les.b, les.a))), k * cordW * 0.55)), add(les.c, mul(perp(norm(sub(les.b, les.a))), k * cordW * 0.2)), add(les.b, mul(perp(norm(sub(les.b, les.a))), k * cordW * 0.55))])} fill="none" stroke="#3B2526" strokeWidth={1.4} />
        ))}
      </g>
      {/* the paddle on the back of the cord, its lead, the pulse generator in the abdomen */}
      <Tube T={Pt.lead} w={3.6 * s} color="#E8EEF2" edge="#5B6B76" core={0.5} />
      {act.pad > 0.02 && <path d={padD} fill="none" stroke={SIG} strokeOpacity={0.5 * act.pad} strokeWidth={14} strokeLinejoin="round" />}
      <path d={padD} fill="#DCE8EE" stroke="#4E626E" strokeWidth={1.3} />
      {elec.map((q, i) => {
        const fl = act.pad * (0.6 + 0.4 * Math.sin(act.t * 40 + i));
        return (
          <g key={i}>
            {fl > 0.05 && <circle cx={fmt(q.x)} cy={fmt(q.y)} r={fmt(6 * s)} fill={SIG} opacity={0.4 * fl} />}
            <rect x={fmt(q.x - 2.2 * s)} y={fmt(q.y - 2.2 * s)} width={fmt(4.4 * s)} height={fmt(4.4 * s)} rx={0.8} fill={mix('#B9C6CE', SIG_CORE, fl)} stroke="#46545E" strokeWidth={0.5} />
          </g>
        );
      })}
      <g>
        <path d={ptsD([IP(19, -15), IP(19, 15), IP(15, 19), IP(-15, 19), IP(-19, 15), IP(-19, -15), IP(-15, -19), IP(15, -19)])} fill="#AAB6BE" stroke={INK} strokeWidth={1.4} />
        <path d={ptsD([IP(11, 19), IP(11, 28), IP(4, 30), IP(-10, 28), IP(-10, 19)])} fill="#D7E9EE" opacity={0.9} stroke={INK} strokeWidth={1} />
        <path d={lineD([IP(13, -11), IP(13, 8)])} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" fill="none" />
        <path d={lineD([IP(-13, -6), IP(-10, 10)])} stroke={shade('#AAB6BE', 0.4)} strokeOpacity={0.6} strokeWidth={2} strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
};

/** near leg: bones, muscles, nerves */
const Leg: React.FC<{F: Frames; Pt: Paths; act: Act}> = ({F, Pt, act}) => {
  const s = F.s;
  const L = (f: number, w: number) => F.leg(f, w);
  return (
    <g>
      <path d={capsulePath(L(0.06, 0), L(0.97, -2), 9 * s, 10 * s)} fill={BONE} stroke={shade(BONE, 0.5)} strokeWidth={1.2} />
      <circle cx={fmt(F.j.lLeg.hp.x)} cy={fmt(F.j.lLeg.hp.y)} r={fmt(14 * s)} fill={BONE} stroke={shade(BONE, 0.5)} strokeWidth={1.2} />
      <circle cx={fmt(L(0.98, -3).x)} cy={fmt(L(0.98, -3).y)} r={fmt(15 * s)} fill={BONE} stroke={shade(BONE, 0.5)} strokeWidth={1.2} />
      <path d={capsulePath(L(1.04, -2), L(1.95, 0), 10 * s, 7 * s)} fill={BONE} stroke={shade(BONE, 0.5)} strokeWidth={1.2} />
      <path d={capsulePath(L(1.08, -12), L(1.92, -8), 3.5 * s, 3 * s)} fill={shade(BONE, 0.1)} stroke={shade(BONE, 0.5)} strokeWidth={1} />
      <Muscle id="h10-ham" F={F} f0={0.08} f1={0.95} c0={-24} c1={-16} w={13 * s} act={act.ham} />
      <Muscle id="h10-quad" F={F} f0={0.1} f1={0.95} c0={22} c1={14} w={15 * s} act={act.quad} />
      <ellipse cx={fmt(L(1.0, 26).x)} cy={fmt(L(1.0, 26).y)} rx={fmt(7 * s)} ry={fmt(10 * s)} fill={BONE} stroke={shade(BONE, 0.5)} strokeWidth={1.1} />
      <Muscle id="h10-calf" F={F} f0={1.04} f1={1.62} c0={-16} c1={-10} w={13 * s} act={act.calf} />
      <Muscle id="h10-ta" F={F} f0={1.1} f1={1.8} c0={12} c1={9} w={6 * s} act={act.ta} />
      {/* small motor branches into the muscles */}
      {[0.35, 0.55, 0.72].map((f, i) => (
        <path key={`q${i}`} d={lineD([L(f, 21), L(f + 0.05, 27)])} fill="none" stroke={NERVE} strokeWidth={1.8 * s} strokeLinecap="round" />
      ))}
      {[0.35, 0.6].map((f, i) => (
        <path key={`h${i}`} d={lineD([L(f, -22), L(f + 0.05, -28)])} fill="none" stroke={NERVE} strokeWidth={1.8 * s} strokeLinecap="round" />
      ))}
    </g>
  );
};

/** the translucent-tissue stand-in for skin and clothes inside the window */
const Tissue: React.FC<{F: Frames; pose: ManPose}> = ({F, pose}) => {
  const j = F.j;
  const s = F.s;
  const h = j.head;
  const L = j.lLeg;
  const legD = limbGeo(L.hp, L.K, L.A, 43 * s, 33 * s, 28 * s).d;
  const neckD = capsulePath(add(j.N, mul(F.upC, -40 * s)), add(j.N, mul(F.upC, 20 * s)), 31 * s, 29 * s);
  const pel = closedPath([F.tor(10, -86), F.tor(10, 90), F.tor(-52, 94), F.tor(-84, 30), F.tor(-80, -60)], 1);
  return (
    <g>
      <defs>
        <linearGradient id="h10-tis" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={mix(TINT, '#2D6A78', 0.5)} />
          <stop offset="0.5" stopColor={TINT} />
          <stop offset="1" stopColor={shade(TINT, 0.3)} />
        </linearGradient>
      </defs>
      <defs>
        <clipPath id="h10-nohead">
          <path d={`M-20000,-20000 H20000 V20000 H-20000 Z ${polyD(Array.from({length: 48}, (_, i) => F.head(100 * Math.cos((i / 48) * 2 * Math.PI), 107 * Math.sin((i / 48) * 2 * Math.PI))))} Z`} clipRule="evenodd" />
        </clipPath>
      </defs>
      <g opacity={0.86} fill="url(#h10-tis)" clipPath="url(#h10-nohead)">
        <path d={legD} />
        <path d={pel} />
        <path d={torsoPath(pose)} />
        <path d={neckD} />
      </g>
      <path d={HEAD_D} transform={`translate(${fmt(h.x)} ${fmt(h.y)}) rotate(${fmt(F.headRoll)}) scale(${fmt((DIM.headR * s) / 100)})`} fill="url(#h10-tis)" opacity={0.74} />
    </g>
  );
};

export const Xray: React.FC<{F: Frames; Pt: Paths; pose: ManPose; act: Act; children?: React.ReactNode}> = ({F, Pt, pose, act, children}) => {
  const L = F.j.lLeg;
  const legD = limbGeo(L.hp, L.K, L.A, 43 * F.s, 33 * F.s, 28 * F.s).d;
  return (
    <g>
      <Tissue F={F} pose={pose} />
      <defs>
        <clipPath id="h10-legclip">
          <path d={legD} />
        </clipPath>
      </defs>
      <g clipPath="url(#h10-legclip)">
        <Leg F={F} Pt={Pt} act={act} />
      </g>
      <Trunk F={F} Pt={Pt} act={act} />
      <Tube T={Pt.femoral} w={3.6 * F.s} color={NERVE} />
      <Tube T={Pt.sciatic} w={5 * F.s} color={NERVE} />
      <Tube T={Pt.peroneal} w={3 * F.s} color={NERVE} />
      <HeadInside F={F} act={act} />
      {children}
    </g>
  );
};
export {clamp, P};
