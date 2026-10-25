// Glass Climbing V5, Shot B: looking down past his shoulder. A small 3D scene (metres) through a perspective camera
// above and behind him: the glass bay he climbs (floor fins and spandrels below him, closing toward the street), the
// brick pier on his left, his head, shoulders, arms and legs (the Crew's colours and ink, limbs as tapered tubes), the
// two pads on the glass (the same Pad3D assembly, turned to the camera's view), the straps and loops, and 30 m below
// the street with tiny pedestrians and cars moving. Everything is sorted by depth. A dramatized view, like the other
// height shots: not a claim about where the research pad was tested.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {fmt, lerp} from '../dc/math';
import {HERO} from '../world/pose';
import {allTiles, BAR_U, Pad3D, Pad3DState} from './Pad3D';
import {ss} from './climb5';

const W = 1080, H = 1920;
type P3 = {x: number; y: number; z: number}; // x out from the wall, y up, z along the wall (+: his left)
const v3 = (x: number, y: number, z: number): P3 => ({x, y, z});
const sub3 = (a: P3, b: P3) => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const dot3 = (a: P3, b: P3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross3 = (a: P3, b: P3) => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const norm3 = (a: P3) => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return v3(a.x / l, a.y / l, a.z / l);
};
const lerp3 = (a: P3, b: P3, t: number) => v3(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));
const rnd = (i: number, s: number) => ((((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1) + 1) % 1);

const camera = (eye: P3, target: P3, f: number) => {
  const fw = norm3(sub3(target, eye));
  const rt = norm3(cross3(fw, v3(0, 1, 0)));
  const up = cross3(rt, fw);
  const pr = (p: P3) => {
    const d = sub3(p, eye);
    const zc = Math.max(0.05, dot3(d, fw));
    return {x: W / 2 + (f * dot3(d, rt)) / zc, y: H / 2 - (f * dot3(d, up)) / zc, d: zc};
  };
  return {pr, fw, f};
};

export const LookDown: React.FC<{id: string; f: number; f0: number; view?: number[]}> = ({id, f, f0, view}) => {
  const t = f - f0;
const vw = view ?? [0.8, 31.5, -0.55, -0.4, 27.6, 0.2, 800];
  const EYE = v3(vw[0], vw[1], vw[2]), AIM = v3(vw[3], vw[4], vw[5]);
  const drift = ss(f, f0, f0 + 36);
  const cam = camera(v3(EYE.x, EYE.y + 0.12 * drift, EYE.z), v3(AIM.x, AIM.y - 0.6 * drift, AIM.z), vw[6]);
  const pr = cam.pr;
  const items: {d: number; n: React.ReactNode}[] = [];
  let key = 0;
  const poly = (pts: P3[], fill: string, opt: {stroke?: number; op?: number; d?: number} = {}) => {
    const s = pts.map(pr);
    items.push({d: opt.d ?? s.reduce((a, p) => a + p.d, 0) / s.length, n: <path key={key++} d={`M${s.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} Z`} fill={fill} stroke={opt.stroke ? INK : 'none'} strokeWidth={opt.stroke ?? 0} opacity={opt.op ?? 1} strokeLinejoin="round" />});
  };
  /** a limb: a tube between two points, radius in metres, drawn at its mean depth */
  const tube = (a: P3, b: P3, ra: number, rb: number, color: string, dz = 0) => {
    const A = pr(a), B = pr(b);
    const RA = (cam.f * ra) / A.d, RB = (cam.f * rb) / B.d;
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const d = `M${fmt(A.x + nx * RA)},${fmt(A.y + ny * RA)} L${fmt(B.x + nx * RB)},${fmt(B.y + ny * RB)} A${fmt(RB)},${fmt(RB)} 0 0 1 ${fmt(B.x - nx * RB)},${fmt(B.y - ny * RB)} L${fmt(A.x - nx * RA)},${fmt(A.y - ny * RA)} A${fmt(RA)},${fmt(RA)} 0 0 1 ${fmt(A.x + nx * RA)},${fmt(A.y + ny * RA)} Z`;
    items.push({d: (A.d + B.d) / 2 + dz, n: (
      <g key={key++}>
        <path d={d} fill={color} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M${fmt(A.x + nx * RA * 0.45)},${fmt(A.y + ny * RA * 0.45)} L${fmt(B.x + nx * RB * 0.45)},${fmt(B.y + ny * RB * 0.45)}`} stroke={lit(color, 0.45)} strokeWidth={Math.max(2, RB * 0.35)} strokeLinecap="round" opacity={0.5} />
      </g>
    )});
  };
  const strap = (a: P3, b: P3, col: string) => {
    const A = pr(a), B = pr(b);
    const w = (cam.f * 0.024) / ((A.d + B.d) / 2);
    items.push({d: (A.d + B.d) / 2 + 0.02, n: (
      <g key={key++}>
        <path d={`M${fmt(A.x)},${fmt(A.y)} L${fmt(B.x)},${fmt(B.y)}`} stroke={INK} strokeWidth={w + 5} strokeLinecap="round" />
        <path d={`M${fmt(A.x)},${fmt(A.y)} L${fmt(B.x)},${fmt(B.y)}`} stroke={col} strokeWidth={w} />
      </g>
    )});
  };

  // ---- the street, 30 m down: pavement, kerb, road; pedestrians and cars (along the wall)
  poly([v3(0, 0, -40), v3(0, 0, 40), v3(3.4, 0, 40), v3(3.4, 0, -40)], '#D3CFC5', {d: 1e4});
  poly([v3(3.4, 0, -40), v3(3.4, 0, 40), v3(3.6, 0, 40), v3(3.6, 0, -40)], '#8C8A84', {d: 1e4 - 1});
  poly([v3(3.6, 0, -40), v3(3.6, 0, 40), v3(10, 0, 40), v3(10, 0, -40)], '#5F6366', {d: 1e4 - 2});
  poly([v3(6.7, 0, -40), v3(6.7, 0, 40), v3(6.8, 0, 40), v3(6.8, 0, -40)], '#E8E3D2', {d: 1e4 - 3});
  poly([v3(10, 0, -40), v3(10, 0, 40), v3(16, 0, 40), v3(16, 0, -40)], '#C9C5BC', {d: 1e4 - 4});
  for (let i = 0; i < 6; i++) poly([v3(3.7, 0.01, 6 + i * 0.8), v3(9.9, 0.01, 6 + i * 0.8), v3(9.9, 0.01, 6.4 + i * 0.8), v3(3.7, 0.01, 6.4 + i * 0.8)], '#E8E3D2', {d: 1e4 - 5});
  for (let i = 0; i < 40; i++) {
    const dir = rnd(i, 1) > 0.5 ? 1 : -1;
    const x = 0.6 + rnd(i, 2) * 2.5;
    const z = ((((rnd(i, 3) * 40 + dir * t * 0.045) % 40) + 40) % 40) - 20;
    const p = pr(v3(x, 0.9, z)), g = pr(v3(x + 0.3, 0, z));
    const r = (cam.f * 0.25) / p.d;
    items.push({d: 1e4 - 10, n: (
      <g key={key++}>
        <ellipse cx={fmt(g.x)} cy={fmt(g.y)} rx={fmt(r * 1.2)} ry={fmt(r * 0.6)} fill="#000" opacity={0.18} />
        <circle cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(r)} fill={['#C8553D', '#2E86AB', '#F2C14E', '#5F7470', '#8E5572', '#E9EEF2'][i % 6]} stroke={INK} strokeWidth={1} />
      </g>
    )});
  }
  for (let i = 0; i < 8; i++) {
    const lane = i % 2;
    const x = lane ? 8.2 : 5.1;
    const z = ((((rnd(i, 7) * 60 + (lane ? -0.18 : 0.15) * t) % 60) + 60) % 60) - 30;
    const c = ['#D64545', '#2C6E91', '#E8E1D5', '#36454F', '#F2B134', '#6B8F71'][i % 6];
    poly([v3(x - 0.9, 1.3, z - 2.2), v3(x + 0.9, 1.3, z - 2.2), v3(x + 0.9, 1.3, z + 2.2), v3(x - 0.9, 1.3, z + 2.2)], c, {stroke: 1.5, d: 1e4 - 20});
    poly([v3(x - 0.75, 1.32, z - 0.6), v3(x + 0.75, 1.32, z - 0.6), v3(x + 0.75, 1.32, z + 0.7), v3(x - 0.75, 1.32, z + 0.7)], '#9FC3D3', {d: 1e4 - 21});
  }
  // a haze over the street (depth)
  items.push({d: 9000, n: <rect key={key++} x={0} y={0} width={W} height={H} fill="#DCE8EE" opacity={0.3} />});

  // ---- the wall (x = 0): his glass bay, the brick pier on his left, fins and spandrels at each floor below him
  const LEDGE = 29.0; // the fin he stood on, below his feet; floors every 3.4 m below it
  const bay: [number, number] = [-1.6, 0.42], pier: [number, number] = [0.42, 1.0];
  const glassCol = (y: number) => mix('#5C8C9E', '#A9CFDA', ((((y - LEDGE) % 3.4) + 3.4) % 3.4) / 3.4);
  for (let fl = 0; fl < 9; fl++) {
    const y1 = LEDGE + 2.4 - fl * 3.4, y0 = y1 - 3.4;
    if (y0 > 32) continue;
    poly([v3(0, y0, bay[0]), v3(0, y0, bay[1]), v3(0, y1, bay[1]), v3(0, y1, bay[0])], glassCol(y0 + 1.2), {d: 5000 + fl});
    poly([v3(0, y0 + 2.4 - 0.25, bay[0]), v3(0, y0 + 2.4 - 0.25, bay[1]), v3(0, y0 + 2.4, bay[1]), v3(0, y0 + 2.4, bay[0])], '#2E4A5C', {d: 4999 + fl});
    // the fin: a thin shelf out from the glass
    poly([v3(0, y0 + 2.4, bay[0]), v3(0, y0 + 2.4, bay[1]), v3(0.08, y0 + 2.4, bay[1]), v3(0.08, y0 + 2.4, bay[0])], '#E2E8EC', {stroke: 2, d: 4998 + fl});
  }
  // the bay's upper glass (where his hands are), its reflections, mullions
  poly([v3(0, 31.4, bay[0]), v3(0, 31.4, bay[1]), v3(0, 33, bay[1]), v3(0, 33, bay[0])], '#9CC7D4', {d: 4990});
  for (const zm of [-1.0, -0.35]) poly([v3(0.02, -1, zm - 0.02), v3(0.02, -1, zm + 0.02), v3(0.02, 33, zm + 0.02), v3(0.02, 33, zm - 0.02)], '#D7DEE3', {stroke: 2, d: 4980});
  poly([v3(0.01, -1, -0.6), v3(0.01, -1, -0.45), v3(0.01, 33, -0.2), v3(0.01, 33, -0.35)], '#FFFFFF', {op: 0.14, d: 4979});
  poly([v3(0, -1, pier[0]), v3(0, -1, pier[1]), v3(0, 33, pier[1]), v3(0, 33, pier[0])], '#A9573D', {d: 5100});
  for (let k = 0; k < 120; k++) {
    const y = 33 - k * 0.28;
    const a = pr(v3(0.005, y, pier[0])), b = pr(v3(0.005, y, pier[1]));
    items.push({d: 5099, n: <path key={key++} d={`M${fmt(a.x)},${fmt(a.y)} L${fmt(b.x)},${fmt(b.y)}`} stroke="#D9C3A6" strokeWidth={Math.max(0.6, (cam.f * 0.012) / a.d)} opacity={0.65} />});
  }
  poly([v3(0.03, -1, pier[0] - 0.03), v3(0.03, -1, pier[0] + 0.03), v3(0.03, 33, pier[0] + 0.03), v3(0.03, 33, pier[0] - 0.03)], '#C3CDD4', {stroke: 2, d: 4970});
  // the building's foot and the rest of the facade beyond (out to his right)
  poly([v3(0, -1, bay[0] - 6), v3(0, -1, bay[0]), v3(0, 33, bay[0]), v3(0, 33, bay[0] - 6)], '#6E9AAC', {d: 5200});

  // ---- him: joints (metres), facing the wall; the near pad comes up beneath the far one (cycle 3, 878-902)
  const up = ss(f, 878, 902), lift = Math.sin(Math.PI * up);
  const padR = v3(0.0, 30.78, -0.16); // far (his right) hand's pad: the upper one
  const padL = v3(0.0, lerp(30.36, 30.6, up), 0.35); // near (left) hand's pad
  const sway = 0.006 * Math.sin(t * 0.17);
  const pelvis = v3(0.48, 29.98, 0);
  const shR = v3(0.43 + sway, 30.5, -0.19), shL = v3(0.45 + sway, 30.49, 0.19);
  const hR = v3(0.12, padR.y, padR.z), hL = v3(0.12 + 0.05 * lift, padL.y, padL.z);
  const eR = v3(0.34, 30.62, -0.33), eL = v3(0.38, lerp(30.2, 30.32, up), 0.46);
  const hipR = v3(0.47, 29.98, -0.11), hipL = v3(0.49, 29.98, 0.11);
  const kR = v3(0.22, 29.62, -0.14), kL = v3(0.26, 29.6, 0.16);
  const fR = v3(0.26, 29.18, -0.11), fL = v3(0.3, 29.16, 0.13);
  // legs, straps and loops (the straps from each pad's foot ring to the loop on that foot)
  tube(hipR, kR, 0.075, 0.06, shade(HERO.pants, 0.12));
  tube(kR, fR, 0.06, 0.048, shade(HERO.pants, 0.12));
  tube(hipL, kL, 0.078, 0.062, HERO.pants);
  tube(kL, fL, 0.062, 0.05, HERO.pants);
  tube(v3(fR.x - 0.08, fR.y - 0.04, fR.z), v3(fR.x + 0.05, fR.y - 0.03, fR.z), 0.045, 0.05, '#F1F4F6', -0.01);
  tube(v3(fL.x - 0.08, fL.y - 0.04, fL.z), v3(fL.x + 0.05, fL.y - 0.03, fL.z), 0.045, 0.05, '#FFFFFF', -0.01);
  strap(v3(0.03, padR.y - 0.13, padR.z), v3(fR.x - 0.03, fR.y + 0.03, fR.z), shade('#D8663B', 0.18));
  strap(v3(0.03, padL.y - 0.13, padL.z), v3(fL.x - 0.03, fL.y + 0.03, fL.z), '#D8663B');
  // torso (the striped tee, from behind and above), neck, head (hair crown)
  const torsoTop = pr(v3(0.45, 30.52, 0)), torsoBot = pr(pelvis);
  const tw = (cam.f * 0.21) / torsoTop.d, bw = (cam.f * 0.17) / torsoBot.d;
  const tdx = torsoBot.x - torsoTop.x, tdy = torsoBot.y - torsoTop.y, tl = Math.hypot(tdx, tdy), tnx = -tdy / tl, tny = tdx / tl;
  const teeD = `M${fmt(torsoTop.x + tnx * tw)},${fmt(torsoTop.y + tny * tw)} C${fmt(torsoTop.x + tnx * tw * 1.15 + tdx * 0.4)},${fmt(torsoTop.y + tny * tw * 1.15 + tdy * 0.4)} ${fmt(torsoBot.x + tnx * bw * 1.1)},${fmt(torsoBot.y + tny * bw)} ${fmt(torsoBot.x + tnx * bw)},${fmt(torsoBot.y + tny * bw)} L${fmt(torsoBot.x - tnx * bw)},${fmt(torsoBot.y - tny * bw)} C${fmt(torsoBot.x - tnx * bw * 1.1)},${fmt(torsoBot.y - tny * bw)} ${fmt(torsoTop.x - tnx * tw * 1.15 + tdx * 0.4)},${fmt(torsoTop.y - tny * tw * 1.15 + tdy * 0.4)} ${fmt(torsoTop.x - tnx * tw)},${fmt(torsoTop.y - tny * tw)} Q${fmt(torsoTop.x - tdx * 0.12)},${fmt(torsoTop.y - tdy * 0.16)} ${fmt(torsoTop.x + tnx * tw)},${fmt(torsoTop.y + tny * tw)} Z`;
  items.push({d: (torsoTop.d + torsoBot.d) / 2 - 0.05, n: (
    <g key={key++}>
      <defs>
        <clipPath id={`${id}-tee`}><path d={teeD} /></clipPath>
      </defs>
      <path d={teeD} fill={HERO.shirt} stroke={INK} strokeWidth={6} />
      <g clipPath={`url(#${id}-tee)`}>
        {Array.from({length: 7}).map((_, i) => {
          const a = (i + 0.7) / 7;
          const cx = torsoTop.x + tdx * a, cy = torsoTop.y + tdy * a;
          const w = lerp(tw, bw, a) * 1.3;
          return <path key={i} d={`M${fmt(cx + tnx * w)},${fmt(cy + tny * w)} Q${fmt(cx + tdx * 0.04)},${fmt(cy + tdy * 0.04)} ${fmt(cx - tnx * w)},${fmt(cy - tny * w)}`} stroke="#F2C14E" strokeWidth={fmt(Math.max(5, (tl / 7) * 0.5))} fill="none" />;
        })}
      </g>
    </g>
  )});
  tube(shR, eR, 0.06, 0.05, shade(HERO.skin, 0.06), -0.02);
  tube(shL, eL, 0.062, 0.052, HERO.skin, -0.02);
  // sleeves over the shoulders
  tube(shR, lerp3(shR, eR, 0.4), 0.07, 0.066, shade(HERO.shirt, 0.06), -0.03);
  tube(shL, lerp3(shL, eL, 0.4), 0.072, 0.068, HERO.shirt, -0.03);
  // the pads, turned to the camera's view of them, his hands on their bars
  for (const [pc, hand, elbow, near] of [[padR, hR, eR, false], [padL, hL, eL, true]] as [P3, P3, P3, boolean][]) {
    const c = pr(pc);
    const toCam = norm3(sub3(EYE, pc));
    const yaw = (Math.atan2(toCam.x, toCam.z) * 180) / Math.PI; // 90: from straight behind (the handle side)
    const pitch = (Math.asin(toCam.y) * 180) / Math.PI;
    const sc = (cam.f * 0.001) / c.d; // px per mm
    const st: Pad3DState = {yaw, pitch, load: near ? 1 - 0.9 * lift : 1, contact: allTiles(1), cover: 1, gap: near ? 18 * lift : 0, tilt: 0, slide: 0, surface: 'none', hand: null, strap: 0};
    items.push({d: c.d + 0.02, n: (
      <g key={key++} transform={`translate(${fmt(c.x)} ${fmt(c.y)}) scale(${fmt(sc)})`}>
        <Pad3D id={`${id}-pd${near ? 'L' : 'R'}`} z={sc} st={st} />
      </g>
    )});
    // forearm and fist round the bar
    tube(elbow, v3(hand.x + 0.03, hand.y, hand.z), 0.05, 0.04, near ? HERO.skin : shade(HERO.skin, 0.06), -0.06);
    const hp = pr(hand), hr = (cam.f * 0.05) / hp.d;
    items.push({d: hp.d - 0.07, n: (
      <g key={key++}>
        <ellipse cx={fmt(hp.x)} cy={fmt(hp.y)} rx={fmt(hr * 1.1)} ry={fmt(hr)} fill={near ? HERO.skin : shade(HERO.skin, 0.06)} stroke={INK} strokeWidth={4} />
        {[0, 1, 2].map((k) => <path key={k} d={`M${fmt(hp.x - hr * 0.6)},${fmt(hp.y - hr * 0.5 + k * hr * 0.45)} Q${fmt(hp.x)},${fmt(hp.y - hr * 0.3 + k * hr * 0.45)} ${fmt(hp.x + hr * 0.5)},${fmt(hp.y - hr * 0.55 + k * hr * 0.45)}`} stroke={shade(HERO.skin, 0.35)} strokeWidth={2.5} fill="none" />)}
      </g>
    )});
  }
  // the head: the red crown of spikes seen from above and behind, an ear
  const head = pr(v3(0.44, 30.76, 0)), hrr = (cam.f * 0.13) / head.d;
  items.push({d: head.d - 0.2, n: (
    <g key={key++}>
      <ellipse cx={fmt(head.x + hrr * 0.9)} cy={fmt(head.y + hrr * 0.25)} rx={fmt(hrr * 0.22)} ry={fmt(hrr * 0.32)} fill={HERO.skin} stroke={INK} strokeWidth={5} />
      <path d={(() => {
        const n = 11, pts: string[] = [];
        for (let i = 0; i < n * 2; i++) {
          const a = (i / (n * 2)) * Math.PI * 2 + 0.2;
          const r = i % 2 ? hrr * 0.86 : hrr * (1.22 + 0.08 * Math.sin(i * 1.7));
          pts.push(`${fmt(head.x + Math.cos(a) * r)},${fmt(head.y + Math.sin(a) * r * 0.86 + (i % 2 ? 0 : 3 * Math.sin(t * 0.2 + i)))}`);
        }
        return `M${pts.join(' L')} Z`;
      })()} fill={HERO.hair} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <ellipse cx={fmt(head.x - hrr * 0.2)} cy={fmt(head.y - hrr * 0.25)} rx={fmt(hrr * 0.5)} ry={fmt(hrr * 0.28)} fill={lit(HERO.hair, 0.35)} opacity={0.5} />
    </g>
  )});
  items.sort((a, b) => b.d - a.d);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <rect x={0} y={0} width={W} height={H} fill="#B8C9CF" />
      {items.map((it) => it.n)}
      <rect x={0} y={0} width={W} height={H} fill={`url(#${id}-vg)`} />
      <defs>
        <radialGradient id={`${id}-vg`} cx="0.5" cy="0.42" r="0.78">
          <stop offset="0.62" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.3} />
        </radialGradient>
      </defs>
    </svg>
  );
};
export {BAR_U};
