// The U9 in three dimensions, for the overhead map and the low three-quarter tracking shot. The body is lofted from
// cross-sections whose heights come from the very trace the side drawing uses (geom.topY), so the three-quarter car is
// the same car, not a stretched sprite. Flat-shaded in four tones with the channel's ink outline, so it sits beside the
// hand-drawn side and front views. Illustration, not a factory model.
import React from 'react';
import {C} from '../theme';
import {AXLE_F, AXLE_R, PAINT, WHEEL_R, topY} from './geom';
import {Cam3, V3, carDirToWorld, carToWorld, cross, dot, norm, project, sub} from '../kit/view3d';

type Kind = 'paint' | 'glass' | 'carbon' | 'light' | 'tail' | 'under';
type Face = {pts: V3[]; kind: Kind; n: V3; bias?: number};

const interp = (k: [number, number][], x: number) => {
  if (x <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) if (x <= k[i + 1][0]) return k[i][1] + ((k[i + 1][1] - k[i][1]) * (x - k[i][0])) / (k[i + 1][0] - k[i][0]);
  return k[k.length - 1][1];
};
const W = (x: number) => interp([[-2183, 690], [-2120, 780], [-2020, 880], [-1850, 975], [-1600, 1010], [-1450, 1014], [-1000, 1008], [-400, 992], [400, 990], [1000, 1000], [1450, 1008], [1700, 975], [1900, 940], [2100, 900], [2250, 830], [2349, 740]], x);
const SILL = (x: number) => interp([[-2183, 330], [-1950, 250], [-1450, 195], [-900, 175], [900, 175], [1450, 195], [1900, 245], [2349, 250]], x);
const FLOOR = (x: number) => interp([[-2183, 280], [-1900, 200], [-900, 140], [900, 140], [1900, 190], [2349, 230]], x);
const BELT = (x: number) => interp([[-1250, 1060], [-800, 1050], [-300, 990], [300, 905], [900, 872], [1200, 900]], x);
const WR = (x: number) => interp([[-1250, 600], [-700, 540], [-300, 455], [300, 435], [700, 450], [1150, 660]], x);
const tubTop = (x: number) => (x < -1200 || x > 1250 ? topY(x) : Math.min(topY(x), BELT(x)));

const TUB_X = [-2183, -2120, -2040, -1940, -1820, -1700, -1580, -1450, -1320, -1150, -950, -700, -400, -100, 200, 500, 800, 1100, 1300, 1450, 1600, 1750, 1900, 2050, 2200, 2300, 2349];
const CAB_X = [-1250, -1150, -1000, -850, -700, -500, -300, -100, 100, 300, 500, 700, 850, 1000, 1100, 1150];

/** Outer ring of the tub at x, left half, from the centre line over the shoulder, side and sill to the floor. */
const tubRing = (x: number): [number, number][] => {
  const w = W(x), top = tubTop(x), sill = SILL(x), fl = FLOOR(x);
  const yD = Math.max(top - 120, sill + 140);
  return [[0, top], [0.5 * w, top - 8], [0.88 * w, Math.max(top - 45, yD)], [w, yD], [w, 0.5 * (yD + sill)], [0.97 * w, sill], [0.8 * w, fl], [0, fl]];
};
const cabRing = (x: number): [number, number][] => {
  const top = topY(x), base = tubTop(x), wr = WR(x), wb = Math.max(wr, W(x) - 170);
  const yC = top - Math.min(85, (top - base) * 0.5);
  return [[0, top], [0.55 * wr, top - 8], [wr, yC], [wb, base]];
};

const buildModel = (): Face[] => {
  const faces: Face[] = [];
  const quad = (a: V3, b: V3, c: V3, d: V3, kind: Kind, centre: V3) => {
    let n = norm(cross(sub(b, a), sub(d, a)));
    const cen: V3 = [(a[0] + b[0] + c[0] + d[0]) / 4, (a[1] + b[1] + c[1] + d[1]) / 4, (a[2] + b[2] + c[2] + d[2]) / 4];
    if (dot(n, sub(cen, centre)) < 0) n = [-n[0], -n[1], -n[2]];
    faces.push({pts: [a, b, c, d], kind, n});
  };
  // tub
  for (let i = 0; i < TUB_X.length - 1; i++) {
    const x0 = TUB_X[i], x1 = TUB_X[i + 1];
    const r0 = tubRing(x0), r1 = tubRing(x1);
    for (let j = 0; j < r0.length - 1; j++) {
      for (const s of [1, -1]) {
        const p = (x: number, r: [number, number][], k: number): V3 => [x, r[k][1], r[k][0] * s];
        const xm = (x0 + x1) / 2;
        const centre: V3 = [xm, 520, 0];
        let kind: Kind = 'paint';
        if (j >= 5) kind = 'under';
        else if (j === 4 && xm > -1050 && xm < -520) kind = 'carbon'; // rear side intake
        else if (j === 4 && xm > -400 && xm < 1100 && x1 < 1100) kind = j === 4 ? 'paint' : 'paint';
        if (j === 3 && xm > 1750 && xm < 2150) kind = 'light'; // headlight blade
        if (j === 5 && xm > -900 && xm < 900) kind = 'carbon'; // sill
        quad(p(x0, r0, j), p(x1, r1, j), p(x1, r1, j + 1), p(x0, r0, j + 1), kind, centre);
      }
    }
  }
  // greenhouse
  for (let i = 0; i < CAB_X.length - 1; i++) {
    const x0 = CAB_X[i], x1 = CAB_X[i + 1], xm = (x0 + x1) / 2;
    const r0 = cabRing(x0), r1 = cabRing(x1);
    for (let j = 0; j < r0.length - 1; j++) {
      for (const s of [1, -1]) {
        const p = (x: number, r: [number, number][], k: number): V3 => [x, r[k][1], r[k][0] * s];
        const centre: V3 = [xm, 900, 0];
        const screen = xm > 700 || xm < -850; // windscreen and rear glass: the whole slope is glass
        const kind: Kind = j <= 1 ? (screen ? 'glass' : 'carbon') : screen ? 'glass' : 'glass';
        quad(p(x0, r0, j), p(x1, r1, j), p(x1, r1, j + 1), p(x0, r0, j + 1), j === 2 && !screen ? 'carbon' : kind, centre);
      }
    }
  }
  // end caps (tail and nose)
  const cap = (x: number, dir: 1 | -1, kind: Kind) => {
    const r = tubRing(x);
    const pts: V3[] = [...r.map(([z, y]) => [x, y, z] as V3), ...r.slice(1, -1).reverse().map(([z, y]) => [x, y, -z] as V3)];
    faces.push({pts, kind, n: [dir, 0, 0]});
  };
  cap(-2183, -1, 'paint');
  {
    const r = tubRing(-2183);
    const top = r[0][1], w = 0.8 * r[3][0];
    faces.push({pts: [[-2185, top - 70, -w], [-2185, top - 70, w], [-2185, top - 118, w], [-2185, top - 118, -w]], kind: 'tail', n: [-1, 0, 0]});
  }
  cap(2349, 1, 'paint');
  // front fascia: the low black grille and a number plate
  faces.push({pts: [[2353, 372, -600], [2353, 372, 600], [2353, 258, 600], [2353, 258, -600]], kind: 'carbon', n: [1, 0, 0]});
  faces.push({pts: [[2355, 330, -170], [2355, 330, 170], [2355, 270, 170], [2355, 270, -170]], kind: 'under', n: [1, 0, 0]});
  return faces;
};
export const FACES = buildModel();

const TONES: Record<Kind, string[]> = {
  paint: ['#A81E30', '#C42337', PAINT.red, '#E8434F', '#F67C86'],
  glass: ['#1B2D35', PAINT.glass, '#3E6272', PAINT.glassLight, '#8FB3C0'],
  carbon: ['#171E23', PAINT.carbon, PAINT.carbon, PAINT.carbonLight, '#52606B'],
  light: ['#16252E', '#1E323D', '#27414F', '#33566A', '#4B7387'],
  tail: ['#C94A36', C.coral, C.coral, '#F58F7C', '#F58F7C'],
  under: ['#10161A', '#171E23', '#1E272D', '#27313A', '#27313A'],
};
const SUN: V3 = norm([0.55, 0.62, -0.5]);

export type LoftPose = {e: number; n: number; psi: number; roll?: number; pitch?: number; dz?: number; wheelRot?: number; steer?: number; blur?: number};
export type LoftProps = {cam: Cam3; pose: LoftPose; id?: string; wing?: boolean; shadow?: number; ink?: number};

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixHex = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
/** Toon tones: a ramp per material sampled in ten steps (fine enough to read as shaded, coarse enough to stay cut-out). Shadows are
 *  lifted so the paint stays red in the shade. */
const toneOf = (kind: Kind, lit0: number) => {
  const t = TONES[kind];
  const lit = Math.min(1, 0.22 + 0.78 * lit0);
  const q = Math.round(lit * 9) / 9;
  const pos = q * (t.length - 1);
  const i = Math.min(t.length - 2, Math.floor(pos));
  return mixHex(t[i], t[i + 1], pos - i);
};

const poly = (pts: {x: number; y: number}[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

type Draw = {depth: number; pts: {x: number; y: number}[]; fill: string; ink?: boolean; stroke?: string; sw?: number; op?: number};

/** Wheel (cylinder) around car-local axis z at (x, WHEEL_R), outer face on side s, as faces for the painter. */
const wheelDraws = (cam: Cam3, pose: LoftPose, xw: number, side: 1 | -1, track: number, width: number, steer: number, rot: number, near: boolean): Draw[] => {
  const blur = pose.blur ?? 0;
  const out: Draw[] = [];
  const zc = side * track;
  const steerA = (steer * Math.PI) / 180;
  const toWorld = (lx: number, ly: number, lz: number): V3 => {
    // steering: rotate about the wheel's vertical axis through (xw, zc)
    const dx = lx - xw, dz = lz - zc;
    const x = xw + dx * Math.cos(steerA) - dz * Math.sin(steerA) * 1;
    const z = zc + dx * Math.sin(steerA) + dz * Math.cos(steerA);
    return carToWorld(pose, [x, ly, z]);
  };
  const N = 28;
  const ring = (z: number, r: number) => Array.from({length: N}, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    return toWorld(xw + r * Math.cos(a), WHEEL_R + r * Math.sin(a), z);
  });
  const zo = zc + side * (width / 2), zi = zc - side * (width / 2);
  const outer = ring(zo, WHEEL_R), inner = ring(zi, WHEEL_R);
  const camPos = cam.eye;
  const proj = (v: V3[]) => v.map((p) => project(cam, p));
  const po = proj(outer), pi = proj(inner);
  if (po.some((p) => !p) || pi.some((p) => !p)) return out;
  const depthOf = (pts: ({z: number} | null)[]) => pts.reduce((s, p) => s + (p ? p.z : 0), 0) / pts.length;
  const bias = near ? -260 : 0;
  // tread band: quads between the faces
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const q = [po[i]!, po[j]!, pi[j]!, pi[i]!];
    const a = (((i + 0.5) / N) * Math.PI * 2);
    const nWorld = carDirToWorld(pose.psi, [Math.cos(a), Math.sin(a), 0]);
    const wp = outer[i];
    if (dot(nWorld, sub(wp, camPos)) > 0) continue;
    const lit = Math.max(0, dot(norm(nWorld), SUN));
    out.push({depth: depthOf(q) + bias, pts: q, fill: lit > 0.55 ? '#2C353B' : '#20272C', ink: true});
  }
  // outer face (visible from outside) and inner face (when seen from inside)
  const faceN = (s: number): V3 => carDirToWorld(pose.psi, [0, 0, s]);
  const outerVis = dot(faceN(side), sub(outer[0], camPos)) < 0;
  const innerVis = dot(faceN(-side), sub(inner[0], camPos)) < 0;
  if (innerVis) out.push({depth: depthOf(pi) + bias + 1, pts: pi as {x: number; y: number}[], fill: '#20272C', ink: true});
  if (outerVis) {
    out.push({depth: depthOf(po) + bias - 2, pts: po as {x: number; y: number}[], fill: '#2C353B', ink: true});
    // rim: pale disc, dark windows (five), hub
    const rimR = 262, zr = zo + side * 2;
    const rimRing = ring(zr, rimR);
    const pr = proj(rimRing);
    if (pr.every((p) => p)) out.push({depth: depthOf(pr) + bias - 4, pts: pr as {x: number; y: number}[], fill: blur > 0.5 ? '#9AA5AB' : PAINT.rim, stroke: C.ink, sw: 1.2});
    for (let k = 0; k < 5; k++) {
      const a0 = rot + (k * 72 * Math.PI) / 180;
      const win = [[104, -19], [236, -29], [236, 29], [104, 19]].map(([r, d]) => {
        const a = a0 + (d * Math.PI) / 180;
        return toWorld(xw + r * Math.cos(a), WHEEL_R + r * Math.sin(a), zr + side * 1);
      });
      const pw = proj(win);
      if (pw.every((p) => p)) out.push({depth: depthOf(pw) + bias - 6, pts: pw as {x: number; y: number}[], fill: PAINT.rimDeep, op: 1 - 0.8 * blur});
    }
    const hub = proj(Array.from({length: 14}, (_, i) => toWorld(xw + 52 * Math.cos((i / 14) * 6.2832), WHEEL_R + 52 * Math.sin((i / 14) * 6.2832), zr + side * 2)));
    if (hub.every((p) => p)) out.push({depth: depthOf(hub) + bias - 8, pts: hub as {x: number; y: number}[], fill: '#EEF2F4', stroke: C.ink, sw: 1});
  }
  return out;
};

export const LoftCar: React.FC<LoftProps> = ({cam, pose, id = 'loft', wing = true, shadow = 1, ink = 4}) => {
  const draws: Draw[] = [];
  const eye = cam.eye;
  // body faces
  for (const f of FACES) {
    const w = f.pts.map((p) => carToWorld(pose, p));
    const nW = carDirToWorld(pose.psi, f.n);
    const cen: V3 = [0, 0, 0];
    w.forEach((p) => { cen[0] += p[0] / w.length; cen[1] += p[1] / w.length; cen[2] += p[2] / w.length; });
    if (dot(nW, sub(cen, eye)) > 0 && f.kind !== 'under') continue;
    if (f.kind === 'under' && dot(nW, sub(cen, eye)) > 0) continue;
    const pr = w.map((p) => project(cam, p));
    if (pr.some((p) => !p)) continue;
    const lit = Math.max(0, dot(norm(nW), SUN));
    const fill = toneOf(f.kind, lit);
    draws.push({depth: pr.reduce((s, p) => s + p!.z, 0) / pr.length, pts: pr as {x: number; y: number}[], fill, ink: true});
  }
  // rear wing: a plate on two stays
  if (wing) {
    const plate = (x0: number, x1: number, y: number, z: number, th: number, kind: Kind) => {
      const pts: V3[][] = [
        [[x0, y + th, -z], [x1, y + th, -z], [x1, y + th, z], [x0, y + th, z]],
        [[x0, y, z], [x1, y, z], [x1, y + th, z], [x0, y + th, z]],
        [[x1, y, -z], [x1, y, z], [x1, y + th, z], [x1, y + th, -z]],
        [[x0, y, -z], [x0, y, z], [x0, y + th, z], [x0, y + th, -z]],
        [[x0, y, -z], [x1, y, -z], [x1, y + th, -z], [x0, y + th, -z]],
      ];
      const nrm: V3[] = [[0, 1, 0], [0, 0, 1], [1, 0, 0], [-1, 0, 0], [0, 0, -1]];
      pts.forEach((q, k) => {
        const w = q.map((p) => carToWorld(pose, p));
        const nW = carDirToWorld(pose.psi, nrm[k]);
        const cen: V3 = [(w[0][0] + w[2][0]) / 2, (w[0][1] + w[2][1]) / 2, (w[0][2] + w[2][2]) / 2];
        if (dot(nW, sub(cen, eye)) > 0) return;
        const pr = w.map((p) => project(cam, p));
        if (pr.some((p) => !p)) return;
        const lit = Math.max(0, dot(norm(nW), SUN));
        draws.push({depth: pr.reduce((s, p) => s + p!.z, 0) / 4 - 40, pts: pr as {x: number; y: number}[], fill: toneOf(kind, lit), ink: true});
      });
    };
    plate(-2319, -1900, 1180, 930, 38, 'carbon');
    for (const s of [1, -1]) plate(-2020, -1930, 940, s * 520 + (s > 0 ? -22 : -22), 28, 'carbon');
  }
  // painted details on the side facing the camera: the black wedge behind the door, the door seam, a shoulder highlight
  {
    const nearS = dot(carDirToWorld(pose.psi, [0, 0, 1]), sub(eye, [pose.e, 0, pose.n])) > 0 ? 1 : -1;
    const onSide = (pts: [number, number][], dz = 4): V3[] => pts.map(([x, y]) => [x, y, nearS * (W(x) * (y > 600 ? 0.97 : 0.995) + dz)] as V3);
    const addDecal = (pts: [number, number][], fill: string, bias = -30) => {
      const pr = onSide(pts).map((p) => project(cam, carToWorld(pose, p)));
      if (pr.some((p) => !p)) return;
      draws.push({depth: pr.reduce((a, p) => a + p!.z, 0) / pr.length + bias, pts: pr as {x: number; y: number}[], fill, ink: false, stroke: C.ink, sw: 1.2});
    };
    addDecal([[-180, 660], [-180, 330], [420, 300], [420, 320]], PAINT.carbon);
    // the LED edge of the headlight blade
    const led = [1780, 1860, 1940, 2020, 2100, 2180, 2250].map((x) => [x, tubRing(x)[3][1]] as [number, number]);
    addDecal([...led, ...led.map(([x, y]) => [x, y - 26] as [number, number]).reverse()], PAINT.light, -36);
    addDecal([[-260, 668], [-250, 640], [1000, 800], [1000, 818]], PAINT.redLight, -34);
    addDecal([[-320, 700], [-300, 330], [-292, 330], [-312, 700]], PAINT.redDeep, -34);
  }
  // wheels: far side first, near side among the body faces
  const left: V3 = carDirToWorld(pose.psi, [0, 0, 1]);
  const toCam = sub(eye, [pose.e, 0, pose.n]);
  const camLeft = dot(left, toCam) > 0;
  const trackF = 1719 / 2, trackR = 1676 / 2;
  const steer = pose.steer ?? 0;
  const rot = ((pose.wheelRot ?? 0) * Math.PI) / 180;
  const wheels: [number, 1 | -1, number, number, number][] = [[AXLE_R, 1, trackR, 325, 0], [AXLE_R, -1, trackR, 325, 0], [AXLE_F, 1, trackF, 285, steer], [AXLE_F, -1, trackF, 285, steer]];
  for (const [xw, side, tr, wd, st] of wheels) {
    const near = side === 1 ? camLeft : !camLeft;
    const dr = wheelDraws(cam, pose, xw, side, tr, wd, st, rot, near);
    const sideFacing = dot(norm(carDirToWorld(pose.psi, [0, 0, side])), norm(toCam)) > 0.4;
    if (near && !sideFacing) {
      // seen from ahead or behind the wheel simply stands against the body
    } else if (near) {
      // dark arch behind the near tyre, so the body reads as having an opening there
      const zc = side * (xw === AXLE_F ? trackF : trackR);
      const archPts = Array.from({length: 24}, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return project(cam, carToWorld(pose, [xw + 432 * Math.cos(a), WHEEL_R + 432 * Math.sin(a), side * (W(xw) + 2)]));
      });
      void zc;
      if (archPts.every((p) => p)) draws.push({depth: archPts.reduce((s, p) => s + p!.z, 0) / 24 - 200, pts: archPts as {x: number; y: number}[], fill: '#1B2328'});
    } else {
      // far wheels sit behind everything
      dr.forEach((d) => (d.depth += 3000));
    }
    draws.push(...dr);
  }
  draws.sort((a, b) => b.depth - a.depth);
  // ground shadow under the car (flat on the road)
  const sh = [] as {x: number; y: number}[];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const p = project(cam, carToWorld({...pose, roll: 0, pitch: 0, dz: 0}, [-80 + 2400 * Math.cos(a) * 0.98, 4, 980 * Math.sin(a)]));
    if (p) sh.push(p);
  }
  return (
    <g strokeLinejoin="round">
      {shadow > 0 && sh.length > 20 && <polygon points={poly(sh)} fill={C.ink} opacity={0.2 * shadow} />}
      {/* ink pass: every shape with a heavy ink stroke, so only the silhouette's outer half survives the fill pass */}
      <g>
        {draws.map((d, i) => (d.ink ? <polygon key={`i${i}`} points={poly(d.pts)} fill={C.ink} stroke={C.ink} strokeWidth={ink * 2} /> : null))}
      </g>
      <g>
        {draws.map((d, i) => <polygon key={`f${i}`} points={poly(d.pts)} fill={d.fill} stroke={d.stroke ?? d.fill} strokeWidth={d.sw ?? 1} opacity={d.op ?? 1} />)}
      </g>
      {void id}
    </g>
  );
};
