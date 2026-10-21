// V3 robot: UR5e-style arm on a Segway-style mobile base (simplified from the paper's Figure 4 setup), Hand-E-style
// parallel gripper holding a blunt toy knife. The arm is planar in x-h (J2, J3, J4 solved by IK; J1, J5, J6 fixed);
// the shoulder and elbow housings carry the arm forward in depth: column d = BASE_D, upper arm d = UPPER_D, forearm,
// wrist, gripper and knife d = 0 (the same depth line as the props).
export const BASE_D = -340;
export const UPPER_D = -170;
export const R3 = {
  S: {x: 1010, h: 720}, // shoulder (J2) centre
  L1: 420, // shoulder -> elbow
  L2: 380, // elbow -> wrist 1
  L3: 70, // wrist 1 -> wrist 2, along the tool axis
  GRIP: 130, // wrist 2 -> jaw centre (wrist 3, flange, Hand-E body, fingers)
};
// Toy knife in the tool frame: u along the handle (+u toward the handle end, blade at u < 0), v down the tool axis,
// origin = jaw centre. Blade: rounded nose, blunt edge at v = KN.edge.
export const KN = {handleEnd: 80, handleFront: -6, bolster: -14, tipU: -136, spine: -13, edge: 34, handleH: 28};

export type Pose3 = {x: number; h: number; phi: number}; // jaw centre and tool-axis angle (deg; 90 = pointing down)
export type J3 = {S: {x: number; h: number}; E: {x: number; h: number}; W1: {x: number; h: number}; W2: {x: number; h: number}; G: {x: number; h: number}; th1: number; th2: number; reach: number};

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

// Planar IK in side coordinates (y = -h, y down), fixed elbow-up branch (elbow above the shoulder->wrist line).
export const solve3 = (p: Pose3): J3 => {
  const {L1, L2, L3, GRIP, S} = R3;
  const a = rad(p.phi);
  const ax = {x: Math.cos(a), y: Math.sin(a)};
  const G = {x: p.x, y: -p.h};
  const W2 = {x: G.x - ax.x * GRIP, y: G.y - ax.y * GRIP};
  const W1 = {x: W2.x - ax.x * L3, y: W2.y - ax.y * L3};
  const Sy = {x: S.x, y: -S.h};
  const dx = W1.x - Sy.x, dy = W1.y - Sy.y;
  const dist = Math.min(Math.hypot(dx, dy), L1 + L2 - 1e-6);
  const base = Math.atan2(dy, dx);
  const A = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist))));
  // targets lie to the left of the shoulder, so base ~ 180°: adding A swings the elbow upward (smaller y)
  const t1 = base + A;
  const E = {x: Sy.x + L1 * Math.cos(t1), y: Sy.y + L1 * Math.sin(t1)};
  const t2 = Math.atan2(W1.y - E.y, W1.x - E.x);
  const h = (q: {x: number; y: number}) => ({x: q.x, h: -q.y});
  return {S: {...S}, E: h(E), W1: h(W1), W2: h(W2), G: {x: p.x, h: p.h}, th1: deg(t1), th2: deg(t2), reach: Math.hypot(dx, dy) / (L1 + L2)};
};

// Knife outline points in world (x, h), from the tool transform only (rigid with the jaws).
export const knifeWorld = (p: Pose3) => {
  const a = rad(p.phi);
  const av = {x: Math.cos(a), y: Math.sin(a)}; // tool axis (v), side coords y down
  const bu = {x: Math.sin(a), y: -Math.cos(a)}; // handle direction (u)
  const W = (u: number, v: number) => ({x: p.x + bu.x * u + av.x * v, h: p.h - (bu.y * u + av.y * v)});
  return {
    W,
    edgeLowest: Math.min(W(KN.handleFront, KN.edge).h, W(KN.tipU + 54, KN.edge).h),
    tip: W(KN.tipU, KN.edge - 18),
    edgeMid: W((KN.handleFront + KN.tipU) / 2, KN.edge),
    outline: [W(KN.handleEnd, -KN.handleH / 2), W(KN.handleEnd, KN.handleH / 2), W(KN.bolster, 20), W(KN.handleFront, KN.edge), W(KN.tipU + 54, KN.edge), W(KN.tipU + 14, KN.spine + 30), W(KN.tipU, KN.spine + 16), W(KN.tipU + 14, KN.spine), W(KN.bolster, -20)],
  };
};
