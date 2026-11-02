// V3 walks with planted feet in WORLD space: every step lands on a point of the route and stays there until that foot
// swings again, so a foot never slides, on straight or curved routes alike. The body is lowered just enough for both
// legs to reach their feet (knees bend at the wide contact poses, the hips rise as the legs pass). Walking sideways the
// feet keep to two depth lanes (one leg always the near one, drawn in front), so the stride reads as a turned walk, never
// as legs swapping places in an X.
import {clamp, lerp, sm} from '../lib';

export type Pt = {x: number; y: number};
export type Route = {total: number; at: (s: number) => Pt; dir: (s: number) => {dx: number; dy: number}};
export type Feet = {lx: number; ly: number; rx: number; ry: number};

/** plant positions (arc length) for an even walk from s0 to s1, after any given leading plants */
export const evenPlants = (s0: number, s1: number, step: number, lead: number[] = []) => {
  const n = Math.max(1, Math.round((s1 - s0) / step));
  const even = Array.from({length: n + 1}, (_, k) => s0 + ((s1 - s0) * k) / n);
  return [...lead.filter((v) => v < s0 - 1e-6), ...even];
};

type Ev = {s0: number; s1: number; a: number; b: number};
/** the swing windows: step i (foot `first` + i - 1, alternating) lands on plants[i] while the body travels from the
 *  midpoint of the previous step to the midpoint of this one; a closing step brings the other foot alongside at the end */
const events = (plants: number[], first: 0 | 1) => {
  const n = plants.length - 1;
  const m = (i: number) => (i <= 0 ? plants[0] : (plants[i - 1] + plants[i]) / 2);
  const ev: Ev[][] = [[], []];
  const at = [0, 0];
  for (let i = 1; i <= n; i++) {
    const f = (first + i - 1) % 2;
    ev[f].push({s0: m(i - 1), s1: m(i), a: at[f], b: i});
    at[f] = i;
  }
  const fc = (first + n) % 2;
  if (at[fc] !== n) ev[fc].push({s0: m(n), s1: plants[n], a: at[fc], b: n});
  return ev;
};
/** body arc lengths at which a foot lands (for footstep sounds) */
export const landings = (plants: number[], first: 0 | 1 = 0) =>
  events(plants, first).flat().map((e) => e.s1).sort((a, b) => a - b);

export type GaitOpts = {
  plants: number[];
  /** which foot steps first: 0 = his left (screen-left from the front), 1 = his right */
  first: 0 | 1;
  /** world units per rig unit */
  scale: number;
  /** half the stance width (rig units) */
  hip?: number;
  /** depth lanes when walking sideways (rig units): the near foot this much lower on screen, the far foot higher */
  lane?: number;
  near?: 0 | 1;
  /** swing lift (rig units) */
  lift?: number;
  /** the facing used for the lanes: true = seen from behind (lanes are mirrored) */
  back?: boolean;
  /** a constant knee bend while walking (rig units) */
  bend?: number;
};
export const gait = (R: Route, s: number, o: GaitOpts) => {
  const P = o.plants, n = P.length - 1;
  const hip = o.hip ?? 30, lane = o.lane ?? 0, lift = o.lift ?? 18, near = o.near ?? 1;
  const ev = events(P, o.first);
  const B = R.at(s);
  // a foot standing on plant j (world): the route point plus its stance offsets; no lanes at the first and last plants
  const footAt = (f: 0 | 1, j: number): Pt => {
    const p = R.at(P[j]);
    const w = j === 0 || j === n ? 0 : Math.abs(R.dir(P[j]).dx);
    const side = f ? 1 : -1;
    return {x: p.x + side * hip * o.scale, y: p.y + (f === near ? 1 : -1) * lane * w * o.scale};
  };
  const foot = (f: 0 | 1) => {
    const E = ev[f];
    let planted = E.length ? E[0].a : n;
    for (const e of E) {
      if (s >= e.s1) {
        planted = e.b;
        continue;
      }
      if (s > e.s0 && e.s1 > e.s0) {
        const u = clamp((s - e.s0) / (e.s1 - e.s0));
        const A = footAt(f, e.a), Bp = footAt(f, e.b), k = sm(u);
        return {x: lerp(A.x, Bp.x, k), y: lerp(A.y, Bp.y, k), lift: lift * Math.sin(Math.PI * u), swing: true};
      }
      break;
    }
    return {...footAt(f, planted), lift: 0, swing: false};
  };
  const fl = foot(0), fr = foot(1);
  const rel = (q: {x: number; y: number}) => ({x: (q.x - B.x) / o.scale, y: (q.y - B.y) / o.scale});
  const L = rel(fl), Rr = rel(fr);
  // lower the body so both legs (82 + 80, hips at -168, x +-32) reach a stride's width with a little knee bend (the
  // legs may lengthen a few percent; depth offsets - a foot nearer the camera sits lower - are taken by legStretch)
  const need = (q: Pt, lf: number, hx: number) => 162 - lf - Math.sqrt(Math.max(0, 172 * 172 - (q.x - hx) * (q.x - hx)));
  const bob = Math.max(0, need(L, fl.lift, -32), need(Rr, fr.lift, 32)) + (o.bend ?? 0);
  const feet: Feet = {lx: L.x, ly: L.y - 6 - fl.lift - bob, rx: Rr.x, ry: Rr.y - 6 - fr.lift - bob};
  // the leg to draw in front: the foot standing nearer the camera (lower on screen); the lane's near leg when level
  const nearLeg: 'L' | 'R' = L.y > Rr.y + 1.5 ? 'L' : Rr.y > L.y + 1.5 ? 'R' : near ? 'R' : 'L';
  return {feet, bob, body: B, nearLeg, swingL: fl.swing, swingR: fr.swing};
};
/** the arm swing that goes with the stride: + when his left foot is forward (in the direction of travel) */
export const armSwing = (g: {feet: Feet}, dx: number, dy: number) => {
  const fwd = (g.feet.lx - g.feet.rx) * dx + (g.feet.ly - g.feet.ry) * dy * 0.6;
  return clamp(fwd / 120, -1, 1);
};
