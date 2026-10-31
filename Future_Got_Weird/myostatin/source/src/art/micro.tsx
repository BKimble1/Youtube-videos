// The muscle at every magnification, in one world (units: "u"; a fibre is about 60 u across). Fibres run along x.
// The same field is drawn coarse-to-fine as the camera closes in, so a dive from the skin cutaway reaches a single fibre
// without a cut:
//   fascicles (bundles with pale perimysium between them) -> individual fibres -> sarcomere striations ->
//   the hero fibre's own detail: myofibrils inside a translucent membrane, receptors on it, a nucleus under it.
// Molecules: myostatin as a two-lobed dimer (magenta), the receptor (activin type IIB, cobalt Y in the membrane),
// the signal it sends inward (amber), a blocking antibody (teal Y), and amino-acid building blocks (pale beads).
import React from 'react';
import {P, add, closed, mul, open, pt, rot} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp} from '../lib';

export type Cam = {x: number; y: number; w: number};
export type Myo = {p: P; ang: number; op: number; dock: number; caught: number};
export type Ab = {p: P; ang: number; op: number; grip: number};
export type MicroState = {
  t: number;
  variant: 'human' | 'bull' | 'dish';
  g: number;       // hero fibre radius factor
  gN: number;      // neighbour fibres' radius factor
  q: number;       // myofibril rows in the hero's upper half (continuous: the fraction is the row being assembled)
  nuc: number;     // nucleus activity 0..1
  flow: number;    // building-block stream 0..1
  beads: {p: P; op: number}[];
  rec: number[];   // receptor activation (per receptor in REC_X)
  myo: Myo[];
  abs: Ab[];
  sig: {p: P; op: number}[];
  sheet?: number;  // collagen sheet crossing the lens: its centre, in screen heights (undefined when off)
  // V4: distinct physical events
  lead?: {p: P; ang: number; depth: number; op: number}; // the one myostatin the camera follows (depth 1 = far, blurred)
  dome?: {x: number; h: number};                          // the membrane tries to bulge out here (restrained)
  wave?: {x: number; u: number};                          // the brake signal spreading from a receptor (u 0..1)
  bad?: {p: P; ang: number; op: number}[];               // misshapen, inactive myostatin (the Belgian Blue mutation)
  grip?: number;                                          // 0..1 how tightly the receptor's arms close on the lead
};

export const PITCH = 90, R0 = 30, FASC = 1100;
export const REC_X = [-96, -50, -4, 44, 92];
export const ZIP_X0 = -170, ZIP_X1 = 170;
const STRAND = 6;
export const rowY = (k: number) => -(3 + STRAND * k);
export const heroR = (s: MicroState) => R0 * s.g;
/** where the myofibril being assembled has got to */
export const zipFront = (q: number) => {
  const k = Math.floor(q), fr = q - k;
  return pt(lerp(ZIP_X0, ZIP_X1, fr), rowY(k));
};
/** row centres in the hero fascicle: the hero at 0 with a wider gap above it for the molecules */
export const heroRows = (s: MicroState) => {
  const rh = heroR(s);
  const rows: {y: number; r: number; i: number}[] = [{y: 0, r: rh, i: 0}];
  let yUp = -rh - 64, yDn = rh + 20;
  for (let i = 1; i <= 7; i++) {
    const rU = R0 * s.gN * (0.92 + 0.16 * hash(i * 3.3)), rD = R0 * s.gN * (0.92 + 0.16 * hash(i * 5.1));
    rows.push({y: yUp - rU, r: rU, i: -i});
    rows.push({y: yDn + rD, r: rD, i});
    yUp -= 2 * rU + 18;
    yDn += 2 * rD + 18;
  }
  return rows;
};

const PAL = {
  human: {fluid: '#2A0A17', fluid2: '#4A1024', fib: '#CF3C45', fibLit: '#F07A78', fibDk: '#7E1724', peri: '#F2C9C2', glow: '#FF7A8A'},
  bull: {fluid: '#26060F', fluid2: '#460A1C', fib: '#C42F3C', fibLit: '#EC6B6E', fibDk: '#6E1020', peri: '#F0C3BB', glow: '#FF6A7E'},
  dish: {fluid: '#1E0C24', fluid2: '#3B1338', fib: '#D24A58', fibLit: '#F48A8E', fibDk: '#80202E', peri: '#EBD0D8', glow: '#FF8AA6'},
};

/** myostatin: the mature dimer, two curved lobes joined at the middle */
export const MYO_S = 1.6, AB_S = 1.45, REC_S = 1.35;
export const Myostatin: React.FC<{p: P; ang: number; op?: number; s?: number}> = ({p, ang, op = 1, s = MYO_S}) => (
  <g transform={`translate(${p.x} ${p.y}) rotate(${(ang * 180) / Math.PI}) scale(${s})`} opacity={op}>
    <ellipse cx={0} cy={0} rx={10} ry={6} fill="#FF4F9A" opacity={0.18} />
    {[-1, 1].map((k) => (
      <g key={k} transform={`scale(${k} 1)`}>
        <path d="M0.6 -0.8 C3 -4.2 7.2 -4.6 8.4 -1.8 C9.2 0.2 7.6 2.6 5.2 2.4 C3.4 2.2 2.4 1.0 0.6 0.9 Z" fill="#F23C88" stroke="#4E0727" strokeWidth={0.5} strokeLinejoin="round" />
        <path d="M2.4 -1.9 C4 -3.4 6.4 -3.5 7.4 -2.1" stroke="#FFB3D2" strokeWidth={0.7} fill="none" strokeLinecap="round" />
        <circle cx={6.4} cy={0.4} r={0.7} fill="#B8155E" />
      </g>
    ))}
    <ellipse cx={0} cy={0} rx={1.5} ry={1.3} fill="#C21866" stroke="#4E0727" strokeWidth={0.4} />
  </g>
);
/** inactive myostatin (the Belgian Blue mutation): a truncated, misfolded dimer, greyed */
export const BadMyostatin: React.FC<{p: P; ang: number; op?: number}> = ({p, ang, op = 1}) => (
  <g transform={`translate(${p.x} ${p.y}) rotate(${(ang * 180) / Math.PI}) scale(${MYO_S * 1.45})`} opacity={op}>
    <path d="M0.6 -0.8 C3 -4.2 7.2 -4.6 8.4 -1.8 C9.2 0.2 7.6 2.6 5.2 2.4 C3.4 2.2 2.4 1.0 0.6 0.9 Z" fill="#9C7A8C" stroke="#3A2230" strokeWidth={0.5} />
    <path d="M-0.6 -0.6 C-1.8 -2.2 -3.6 -2.0 -3.8 -0.6 C-3.6 0.8 -2 1.2 -0.6 0.8 Z" fill="#7E6070" stroke="#3A2230" strokeWidth={0.5} />
    <path d="M-3.6 1.6 l-1.4 1.4 M-2.8 2.2 l-0.6 1.8" stroke="#3A2230" strokeWidth={0.4} />
    <ellipse cx={0} cy={0} rx={1.2} ry={1.0} fill="#6E5262" stroke="#3A2230" strokeWidth={0.35} />
  </g>
);
/** the receptor pair in the membrane: a stem through it, two arms out into the fluid */
const Receptor: React.FC<{x: number; y: number; act: number; up: boolean}> = ({x, y, act, up}) => {
  const s = up ? 1 : -1;
  const c = mix('#3C72F0', '#9CC4FF', act);
  return (
    <g transform={`translate(${x} ${y}) scale(${REC_S * (1 - 0.22 * act)} ${s * REC_S})`}>
      {act > 0.02 && <circle cx={0} cy={-6} r={7 + 3 * act} fill="#7FB4FF" opacity={0.28 * act} />}
      <path d="M-1.1 3 L-1.1 -4.2 L-4.6 -8.6 L-3.2 -9.6 L0 -5.8 L3.2 -9.6 L4.6 -8.6 L1.1 -4.2 L1.1 3 Z" fill={c} stroke="#0E1F55" strokeWidth={0.45} strokeLinejoin="round" />
      <path d="M-0.4 2 L-0.4 -4.4" stroke="#C9DCFF" strokeWidth={0.4} opacity={0.8} />
      <circle cx={0} cy={2.6} r={1.6} fill={mix('#2A4CB0', '#FFB347', act)} stroke="#0E1F55" strokeWidth={0.35} />
    </g>
  );
};
/** a blocking antibody: Y with two Fab arms and an Fc stem */
export const Antibody: React.FC<{p: P; ang: number; op?: number; grip?: number}> = ({p, ang, op = 1, grip = 0}) => {
  const spread = 34 - 12 * grip;
  const arm = (k: number) => (
    <g key={k} transform={`rotate(${k * spread})`}>
      <rect x={-1.9} y={-15} width={3.8} height={12} rx={1.9} fill="#2FD9C0" stroke="#06433D" strokeWidth={0.5} />
      <rect x={-1.3} y={-14} width={1.2} height={9} rx={0.6} fill="#B5FFF2" opacity={0.7} />
    </g>
  );
  return (
    <g transform={`translate(${p.x} ${p.y}) rotate(${(ang * 180) / Math.PI}) scale(${AB_S})`} opacity={op}>
      <circle cx={0} cy={-6} r={14} fill="#38F0D6" opacity={0.1} />
      {arm(-1)}
      {arm(1)}
      <rect x={-2.1} y={-3} width={4.2} height={13} rx={2.1} fill="#21B9A4" stroke="#06433D" strokeWidth={0.5} />
      <circle cx={0} cy={-2.6} r={2.2} fill="#1C9E8C" stroke="#06433D" strokeWidth={0.4} />
    </g>
  );
};

/** the field of fascicles and fibres, coarse to fine */
export const MicroWorld: React.FC<{s: MicroState; cam: Cam; bg?: boolean}> = ({s, cam, bg = true}) => {
  const pal = PAL[s.variant];
  const sc = 1080 / cam.w;
  const vx0 = cam.x - cam.w * 0.62, vx1 = cam.x + cam.w * 0.62;
  const vh = cam.w * (1920 / 1080);
  const vy0 = cam.y - vh * 0.56, vy1 = cam.y + vh * 0.56;
  const idS = uid('str'), idF = uid('fg'), idFl = uid('fl'), idH = uid('hg'), idM = uid('mf'), idN = uid('ng'), idLB = uid('lb');
  const fibOp = clamp((PITCH * sc - 2.2) / 3);      // individual fibres
  const strOp = clamp((10 * sc - 2.5) / 3);         // striations
  const detOp = clamp((cam.w < 1 ? 1 : (1700 - cam.w) / 600));  // hero detail
  const cueOp = clamp((PITCH * sc - 6) / 6);                     // nuclei and capillaries
  const j0 = Math.floor(vy0 / FASC) - 1, j1 = Math.ceil(vy1 / FASC) + 1;
  const fasc: React.ReactNode[] = [];
  const rowsH = heroRows(s);
  for (let j = j0; j <= j1; j++) {
    const Y = j * FASC;
    const top = Y - FASC / 2 + 30, bot = Y + FASC / 2 - 30;
    const tone = hash(j * 7.7) * 0.25;
    const wave = (x: number, ph: number) => 70 * Math.sin(x / 5200 + j * 1.3 + ph) * (1 - fibOp);
    const band = (y0: number, y1: number, ph: number) => {
      const xs = Array.from({length: 13}, (_, k) => vx0 + ((vx1 - vx0) * k) / 12);
      return closed([...xs.map((x) => pt(x, y0 + wave(x, ph))), ...[...xs].reverse().map((x) => pt(x, y1 + wave(x, ph + 0.4)))], 0.5);
    };
    fasc.push(<path key={`fb${j}`} d={band(top, bot, 0)} fill={mix(mix(pal.fib, pal.fibDk, tone), pal.fluid, fibOp * 0.92)} opacity={bg ? 1 : 1 - 0.95 * fibOp} />);
    fasc.push(<path key={`fh${j}`} d={band(top + 40, top + (bot - top) * 0.32, 0.1)} fill={pal.fibLit} opacity={0.32 * (1 - fibOp)} />);
    fasc.push(<path key={`fd${j}`} d={band(bot - (bot - top) * 0.22, bot, 0.2)} fill={pal.fibDk} opacity={0.5 * (1 - fibOp)} />);
    fasc.push(<path key={`pm${j}`} d={band(Y + FASC / 2 - 34, Y + FASC / 2 + 34, 0.3)} fill={pal.peri} opacity={0.9} />);
    if (fibOp < 0.99) {
      for (let k = 0; k < 9; k++) {
        const yy = top + ((bot - top) * (k + 0.5)) / 9;
        fasc.push(<path key={`fl${j}_${k}`} d={band(yy - 6, yy + 6, 0.05 * k)} fill={pal.fibDk} opacity={0.35 * (1 - fibOp)} />);
      }
    }
    if (fibOp > 0.01) {
      const rows = j === 0 ? rowsH : Array.from({length: 11}, (_, k) => ({y: Y + (k - 5) * PITCH, r: R0 * (0.92 + 0.14 * hash(j * 13 + k)) * (j === 0 ? s.gN : 1), i: k - 5}));
      for (const rw of rows) {
        if (rw.y + rw.r < vy0 || rw.y - rw.r > vy1) continue;
        if (j !== 0 && Math.abs(rw.y - Y) > FASC / 2 - 30) continue;
        if (j === 0 && Math.abs(rw.y) > FASC / 2 + 60) continue;
        const hero = j === 0 && rw.i === 0;
        fasc.push(
          <g key={`r${j}_${rw.i}`} opacity={fibOp}>
            <rect x={vx0} y={rw.y - rw.r} width={vx1 - vx0} height={2 * rw.r} fill={`url(#${hero ? idH : idF})`} />
            {strOp > 0.01 && <rect x={vx0} y={rw.y - rw.r} width={vx1 - vx0} height={2 * rw.r} fill={`url(#${idS})`} opacity={strOp * (hero ? 0.18 : 0.42)} />}
            <rect x={vx0} y={rw.y - rw.r} width={vx1 - vx0} height={Math.max(1.2, rw.r * 0.08)} fill="#FFD3CF" opacity={0.55} />
            {!hero && cueOp > 0.01 && (() => {
              const cues: React.ReactNode[] = [];
              const step = 170;
              for (let n = Math.floor(vx0 / step) - 1; n <= Math.ceil(vx1 / step); n++) {
                const x = n * step + 60 * hash(n * 1.7 + rw.i * 3.1);
                const side = hash(n * 2.3 + rw.i) > 0.5 ? -1 : 1;
                cues.push(<ellipse key={`n${n}`} cx={x} cy={rw.y + side * rw.r * 0.62} rx={13} ry={4.2} fill="#7C4CC8" opacity={0.55 * cueOp} />);
                if (hash(n * 5.1 + rw.i * 1.3) > 0.55) cues.push(<path key={`c${n}`} d={`M${x + 40} ${rw.y + rw.r + 2} q20 ${8} 46 ${16}`} stroke="#8E1622" strokeWidth={5} fill="none" opacity={0.8 * cueOp} strokeLinecap="round" />);
              }
              return cues;
            })()}
            {!hero && detOp > 0.01 && <rect x={vx0} y={rw.y - rw.r} width={vx1 - vx0} height={2 * rw.r} fill="#1A0208" opacity={0.32 * detOp} />}
          </g>,
        );
      }
    }
  }
  // the hero fibre's inside: myofibrils (one being assembled), its nucleus, the membrane and its receptors
  const rh = heroR(s);
  const hero: React.ReactNode[] = [];
  if (detOp > 0.01) {
    const n = Math.floor(s.q);
    const fr = s.q - n;
    const front = lerp(ZIP_X0, ZIP_X1, fr);
    for (let k = -n - 1; k <= n; k++) {
      const top = k >= 0;
      const kk = top ? k : -k - 1;
      const y = top ? rowY(kk) : -rowY(kk);
      const partial = kk === n;
      const x0 = partial ? ZIP_X0 : vx0, x1 = partial ? front : vx1;
      if (x1 <= x0) continue;
      hero.push(
        <g key={`m${k}`}>
          <rect x={x0} y={y - 2.45} width={x1 - x0} height={4.9} rx={partial ? 2.4 : 0} fill={`url(#${idM})`} opacity={0.92} />
          <rect x={x0} y={y - 2.45} width={x1 - x0} height={1.1} fill="#FFC4BE" opacity={0.28} />
          <rect x={x0} y={y + 1.6} width={x1 - x0} height={0.85} fill="#3A0610" opacity={0.45} />
          {partial && fr > 0.01 && fr < 0.99 && (
            <g>
              <circle cx={front} cy={y} r={4.5} fill="#FFE9A8" opacity={0.35 * s.flow + 0.1} />
              <circle cx={front} cy={y} r={2.0} fill="#FFF4CC" opacity={0.6 * s.flow + 0.2} />
            </g>
          )}
        </g>,
      );
    }
    // nucleus under the membrane
    const nx = 22, ny = -rh + 12;
    hero.push(
      <g key="nuc">
        {s.nuc > 0.03 && <ellipse cx={nx} cy={ny} rx={38} ry={16} fill="#C792FF" opacity={0.22 * s.nuc * (0.8 + 0.2 * Math.sin(s.t * 9))} />}
        <ellipse cx={nx} cy={ny} rx={28} ry={10} fill={mix('#2E2440', '#B06CFF', s.nuc)} opacity={0.3 + 0.4 * s.nuc} />
        <ellipse cx={nx} cy={ny} rx={23} ry={7.2} fill={`url(#${idN})`} stroke="#1E0E30" strokeWidth={0.6} />
        <circle cx={nx + 5} cy={ny - 0.8} r={2.4} fill={mix('#4A3E58', '#FFE6FF', s.nuc)} />
        {[[-12, 1], [-5, -2], [10, 2]].map(([dx, dy], i) => <circle key={i} cx={nx + dx} cy={ny + dy} r={1.1} fill={mix('#3A3048', '#E9C8FF', s.nuc)} opacity={0.8} />)}
      </g>,
    );
    // the membrane: a translucent skin over the myofibrils, catching light
    if (s.dome && s.dome.h > 0.2) {
      // the fibre pushes out here and is pulled back: a dome of fibre under a stretched membrane
      const {x: dx, h} = s.dome;
      const pts = Array.from({length: 13}, (_, i) => {
        const u = i / 12;
        return pt(dx - 46 + 92 * u, -rh - h * Math.sin(Math.PI * u) ** 1.6);
      });
      hero.push(<path key="dome" d={`${open(pts)} L${dx + 46} ${-rh + 6} L${dx - 46} ${-rh + 6} Z`} fill={pal.fib} />);
      hero.push(<path key="domeM" d={open(pts)} stroke="#FFC9C6" strokeWidth={3.2} fill="none" opacity={0.85} />);
      hero.push(<path key="domeT" d={open(pts.slice(3, 10))} stroke="#FFFFFF" strokeWidth={1} fill="none" opacity={0.25 + 0.04 * h} />);
    }
    hero.push(<rect key="memT" x={vx0} y={-rh} width={vx1 - vx0} height={3.2} fill="#FFC9C6" opacity={0.75} />);
    if (s.wave && s.wave.u > 0 && s.wave.u < 1) {
      // the brake signal: a bright pulse runs both ways along the membrane and a ripple runs inward
      const {x: wx, u} = s.wave;
      const d = 30 + 260 * u, fade = 1 - u;
      [-1, 1].forEach((k) => hero.push(<rect key={`wv${k}`} x={wx + k * d - 22} y={-rh - 2} width={44} height={6} rx={3} fill="#FFC45E" opacity={0.85 * fade} />));
      hero.push(<ellipse key="wvi" cx={wx} cy={-rh + 4} rx={20 + 200 * u} ry={6 + 40 * u} fill="none" stroke="#FFB347" strokeWidth={2.4 * fade + 0.3} opacity={0.6 * fade} />);
    }
    hero.push(<rect key="memT2" x={vx0} y={-rh + 3.2} width={vx1 - vx0} height={rh * 0.5} fill="#FFE2DC" opacity={0.1} />);
    hero.push(<rect key="memT3" x={vx0} y={-rh + 3.2} width={vx1 - vx0} height={2.2} fill="#FFFFFF" opacity={0.25} />);
    hero.push(<rect key="memB" x={vx0} y={rh - 3.2} width={vx1 - vx0} height={3.2} fill="#FFC9C6" opacity={0.6} />);
    REC_X.forEach((x, i) => {
      hero.push(<Receptor key={`rt${i}`} x={x} y={-rh} act={s.rec[i] ?? 0} up />);
      hero.push(<Receptor key={`rb${i}`} x={x + 24} y={rh} act={0} up={false} />);
    });
    // receptors on the upper neighbour's lower membrane
    const up = rowsH.find((r) => r.i === -1)!;
    [-120, -72, -24, 26, 74, 122].forEach((x, i) => hero.push(<Receptor key={`rn${i}`} x={x} y={up.y + up.r} act={0} up={false} />));
  }
  const ahead: React.ReactNode[] = [];
  if (detOp > 0.01) {
    s.beads.forEach((b, i) => b.op > 0.01 && ahead.push(<g key={`b${i}`} opacity={b.op}><circle cx={b.p.x} cy={b.p.y} r={2.4} fill="#FFE38A" opacity={0.25} /><circle cx={b.p.x} cy={b.p.y} r={1.3} fill="#FFF1B8" stroke="#B38A2A" strokeWidth={0.25} /></g>));
    s.sig.forEach((g, i) => g.op > 0.01 && ahead.push(<g key={`s${i}`} opacity={g.op}><circle cx={g.p.x} cy={g.p.y} r={4.2} fill="#FFB347" opacity={0.3} /><circle cx={g.p.x} cy={g.p.y} r={1.9} fill="#FFC45E" stroke="#7A4300" strokeWidth={0.3} /></g>));
    s.abs.forEach((a, i) => a.op > 0.01 && ahead.push(<Antibody key={`a${i}`} p={a.p} ang={a.ang} op={a.op} grip={a.grip} />));
    s.myo.forEach((m, i) => m.op > 0.01 && ahead.push(<Myostatin key={`y${i}`} p={m.p} ang={m.ang} op={m.op} />));
    (s.bad ?? []).forEach((m, i) => m.op > 0.01 && ahead.push(<BadMyostatin key={`bd${i}`} p={m.p} ang={m.ang} op={m.op} />));
    if (s.lead && s.lead.op > 0.01) {
      const L = s.lead;
      const blur = 3.2 * L.depth;
      ahead.push(
        <g key="lead" opacity={L.op} filter={blur > 0.3 ? `url(#${idLB})` : undefined}>
          <Myostatin p={L.p} ang={L.ang} s={MYO_S * (1.25 - 0.55 * L.depth)} />
        </g>,
      );
    }
  }
  // drifting debris in the fluid gives the close views depth (very near the lens: large, soft, slow)
  const motes: React.ReactNode[] = [];
  if (detOp > 0.01) {
    for (let i = 0; i < 14; i++) {
      const x = cam.x + (hash(i * 2.7) - 0.5) * cam.w * 1.2 + 8 * Math.sin(s.t * 0.6 + i);
      const y = cam.y + (hash(i * 4.9) - 0.5) * vh * 1.1 + 6 * Math.cos(s.t * 0.5 + i * 2);
      motes.push(<circle key={i} cx={x} cy={y} r={(1.2 + 2.6 * hash(i * 8.3)) * cam.w / 240} fill={pal.glow} opacity={0.08 * detOp} />);
    }
  }
  return (
    <g>
      <defs>
        <pattern id={idS} patternUnits="userSpaceOnUse" width={10} height={200} x={0} y={0}>
          <rect x={0} y={0} width={5.6} height={200} fill={pal.fibDk} opacity={0.55} />
          <rect x={7.6} y={0} width={0.7} height={200} fill={pal.fibDk} opacity={0.9} />
          <rect x={5.6} y={0} width={2} height={200} fill="#FFD9D4" opacity={0.35} />
        </pattern>
        <pattern id={idM} patternUnits="userSpaceOnUse" width={10} height={200} x={0} y={0}>
          <rect x={0} y={0} width={10} height={200} fill={pal.fib} />
          <rect x={0} y={0} width={5.6} height={200} fill={mix(pal.fib, pal.fibDk, 0.42)} />
          <rect x={6.4} y={0} width={1.0} height={200} fill="#FFD6D0" opacity={0.45} />
          <rect x={8.6} y={0} width={0.5} height={200} fill={pal.fibDk} opacity={0.8} />
        </pattern>
        <linearGradient id={idF} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={mix(pal.fibDk, '#000000', 0.2)} />
          <stop offset={0.14} stopColor={pal.fib} />
          <stop offset={0.26} stopColor={mix(pal.fibLit, '#FFFFFF', 0.15)} />
          <stop offset={0.5} stopColor={pal.fib} />
          <stop offset={0.85} stopColor={pal.fibDk} />
          <stop offset={1} stopColor={mix(pal.fibDk, '#000000', 0.5)} />
        </linearGradient>
        <linearGradient id={idH} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={mix(pal.fibDk, '#000000', 0.2)} />
          <stop offset={0.5} stopColor={mix(pal.fibDk, pal.fib, 0.4)} />
          <stop offset={1} stopColor={mix(pal.fibDk, '#000000', 0.45)} />
        </linearGradient>
        <radialGradient id={idN}>
          <stop offset={0} stopColor={mix('#5E4A7A', '#E2B8FF', s.nuc)} />
          <stop offset={1} stopColor={mix('#3A2A55', '#8A4FE0', s.nuc)} />
        </radialGradient>
        <filter id={idLB} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={3.2 * (s.lead?.depth ?? 0) + 0.01} /></filter>
        <radialGradient id={idFl} cx="0.4" cy="0.3" r="0.8">
          <stop offset={0} stopColor={pal.fluid2} />
          <stop offset={1} stopColor={pal.fluid} />
        </radialGradient>
      </defs>
      {bg && <rect x={vx0} y={vy0} width={vx1 - vx0} height={vy1 - vy0} fill={pal.fluid} />}
      {fasc}
      {detOp > 0.01 && <g opacity={detOp}>{hero}</g>}
      {ahead.length > 0 && <g opacity={detOp}>{ahead}</g>}
      {motes}
    </g>
  );
};

/** the collagen sheet that crosses the lens between two different muscles (a deliberate match, not a morph) */
export const CollagenSheet: React.FC<{y: number}> = ({y}) => {
  // y: the sheet's centre in screen heights (0 = centre of frame); drawn in screen space, 1.6 screens tall
  const id = uid('col');
  const cy = 960 + y * 1920;
  const fibres = Array.from({length: 26}, (_, i) => {
    const yy = cy - 1500 + i * 115 + 30 * Math.sin(i * 1.7);
    const pts = Array.from({length: 8}, (_, k) => pt(-100 + k * 185, yy + 40 * Math.sin(k * 0.9 + i)));
    return <path key={i} d={open(pts)} stroke={i % 3 ? '#FFF1EE' : '#E9B7B2'} strokeWidth={40 + 30 * hash(i)} fill="none" opacity={0.55} strokeLinecap="round" />;
  });
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="#F4D3CE" stopOpacity={0} />
          <stop offset={0.12} stopColor="#F4D3CE" stopOpacity={0.97} />
          <stop offset={0.88} stopColor="#EBC2BC" stopOpacity={0.97} />
          <stop offset={1} stopColor="#EBC2BC" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={-50} y={cy - 1550} width={1180} height={3100} fill={`url(#${id})`} />
      {fibres}
    </g>
  );
};
void add; void closed; void mul; void rot;
