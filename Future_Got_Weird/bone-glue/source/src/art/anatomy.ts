// Shared anatomy: the patient's RIGHT forearm and hand, palm up (supinated), seen from the volar (palm) side with the
// hand pointing UP the frame. World units are millimetres, x to the right, y down. Origin: the centre of the
// distal-radius fracture on the radius axis (a Colles-level break about 25 mm above the radiocarpal joint).
//   radius   on the thumb side  (screen RIGHT), styloid tip at (17, -39)
//   ulna     on the little-finger side (screen LEFT), head at (-26, -20)
//   carpals  y -36 .. -74;  metacarpals y -70 .. -145;  fingers to y -240 (middle fingertip, straight)
//   thumb    on the right, from the trapezium out to (58, -152)
// Every module (bone, skeleton, skin, instruments, camera) uses these points so they stay in register.
import {P, pt, lerpP, add, mul, nrm, perp, sub, len} from '../core/geo';

// ---------------------------------------------------------------- radius
/** the radius outline (closed, clockwise from the ulnar corner of the articular surface) */
export const RADIUS: P[] = [
  // articular surface: ulnar corner -> lunate facet -> ridge -> scaphoid facet -> styloid tip (radial inclination)
  pt(-15.2, -25.0), pt(-10, -26.5), pt(-5, -28.4), pt(-1.5, -29.2), pt(2, -30.4), pt(7, -32.8), pt(11.5, -35.5), pt(15, -38.0), pt(17.0, -39.0),
  // radial border down the shaft
  pt(18.4, -36.4), pt(18.6, -32), pt(18.2, -26), pt(17.2, -20), pt(15.6, -14), pt(14.0, -8), pt(12.9, -3), pt(12.5, 0), pt(12.1, 5),
  pt(11.6, 12), pt(11.0, 22), pt(10.4, 34), pt(9.8, 50), pt(9.2, 70), pt(8.4, 100), pt(7.8, 130), pt(7.4, 165), pt(7.6, 200),
  pt(9.6, 222), pt(10.6, 236), pt(8.0, 246), pt(0, 249), pt(-8.0, 246), pt(-10.6, 236), pt(-9.6, 222),
  // ulnar border up the shaft
  pt(-7.6, 200), pt(-7.4, 165), pt(-7.9, 130), pt(-8.5, 100), pt(-9.1, 70), pt(-9.7, 50), pt(-10.3, 34), pt(-10.9, 22), pt(-11.6, 12),
  pt(-12.1, 5), pt(-12.5, 0), pt(-13.0, -4), pt(-14.0, -9), pt(-15.2, -14), pt(-15.8, -18), pt(-15.9, -22),
];
/** half-width of the radius at height y (for shading across the bone, and for culling) */
export const radiusEdges = (y: number): [number, number] => {
  const pick = (from: number, to: number) => {
    const ps = RADIUS.slice(from, to);
    for (let i = 0; i < ps.length - 1; i++) {
      const a = ps[i], b = ps[i + 1];
      if ((y - a.y) * (y - b.y) <= 0 && a.y !== b.y) return a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y);
    }
    return NaN;
  };
  return [pick(33, RADIUS.length), pick(8, 27)];
};

// ---------------------------------------------------------------- the fracture (comminuted, intra-articular)
// Four fragments, aligned (reduced): the shaft (below), the lunate-facet fragment (upper left), the radial-styloid
// fragment (upper right, its crack runs into the joint) and a small radial wedge (butterfly) fragment below the
// transverse line on the thumb side.
/** the transverse crack C1, ulnar border -> radial border */
export const C1: P[] = [pt(-12.6, 1.4), pt(-9.6, 0.5), pt(-7.0, 1.3), pt(-4.4, 0.4), pt(-1.8, 1.0), pt(0.8, -0.2), pt(3.5, 0.5), pt(6.0, -0.2), pt(8.6, -0.6), pt(10.8, -1.4), pt(12.9, -1.0)];
/** the styloid crack C2, from C1 up into the radiocarpal joint (between the scaphoid and lunate facets) */
export const C2: P[] = [pt(3.5, 0.5), pt(4.1, -3.4), pt(3.2, -7.6), pt(3.9, -11.8), pt(2.6, -16.2), pt(2.9, -20.6), pt(1.6, -25.0), pt(1.0, -29.8)];
/** the wedge crack C3, from C1 down to the radial border */
export const C3: P[] = [pt(6.0, -0.2), pt(7.4, 2.6), pt(8.3, 5.3), pt(9.9, 7.4), pt(11.7, 9.6)];
export const CRACKS = {C1, C2, C3};
/** the order the surgeon lays the bead: along C1 from the ulnar border to the C2 junction, up C2, then C1's radial
 *  part and C3 around the wedge */
export const BEAD_PATH: P[][] = [C1.slice(0, 7), C2, C1.slice(6), C3];

/** a jagged version of a crack polyline: deterministic zigzag between the vertices (amplitude in mm) */
export const jag = (ps: P[], amp = 0.28, step = 0.55, seed = 1): P[] => {
  const out: P[] = [];
  for (let i = 0; i < ps.length - 1; i++) {
    const a = ps[i], b = ps[i + 1];
    const L = len(sub(b, a));
    const n = Math.max(1, Math.round(L / step));
    const nn = perp(nrm(sub(b, a)));
    for (let k = 0; k < n; k++) {
      const u = k / n;
      const h = Math.sin((i * 17.3 + k * 7.1 + seed * 3.7) * 12.9898) * 43758.5453;
      const r = (h - Math.floor(h)) * 2 - 1;
      const amp_k = k === 0 ? 0 : amp * r;
      out.push(add(lerpP(a, b, u), mul(nn, amp_k)));
    }
  }
  out.push(ps[ps.length - 1]);
  return out;
};

// ---------------------------------------------------------------- ulna
export const ULNA: P[] = [
  // head (rounded) and styloid (a peg on the little-finger side)
  pt(-20.4, -16), pt(-19.2, -22), pt(-21.0, -27.2), pt(-25.4, -28.8), pt(-29.0, -28.4), pt(-31.0, -31.0), pt(-32.4, -34.4), pt(-34.2, -33.4), pt(-34.6, -28.6),
  pt(-34.4, -22), pt(-33.0, -15), pt(-31.6, -8),
  // shaft down to the elbow (the olecranon is off frame)
  pt(-31.0, 10), pt(-31.2, 40), pt(-32.0, 80), pt(-32.8, 130), pt(-33.6, 180), pt(-35.2, 230), pt(-36, 250), pt(-26, 252), pt(-24.6, 230),
  pt(-24.0, 180), pt(-23.4, 130), pt(-22.8, 80), pt(-22.2, 40), pt(-21.8, 10), pt(-21.2, -8),
];

// ---------------------------------------------------------------- carpals (volar view)
export type Carpal = {name: string; c: P; rx: number; ry: number; rot: number};
export const CARPALS: Carpal[] = [
  {name: 'scaphoid', c: pt(9.0, -46.0), rx: 6.0, ry: 12.0, rot: -0.55},
  {name: 'lunate', c: pt(-6.8, -40.8), rx: 7.4, ry: 6.4, rot: 0.1},
  {name: 'triquetrum', c: pt(-19.6, -45.6), rx: 6.2, ry: 5.6, rot: 0.35},
  {name: 'pisiform', c: pt(-24.0, -49.8), rx: 4.4, ry: 4.2, rot: 0},
  {name: 'trapezium', c: pt(18.6, -63.0), rx: 6.8, ry: 6.0, rot: -0.4},
  {name: 'trapezoid', c: pt(8.0, -66.0), rx: 5.0, ry: 5.4, rot: -0.1},
  {name: 'capitate', c: pt(-3.6, -61.0), rx: 6.4, ry: 10.6, rot: 0.04},
  {name: 'hamate', c: pt(-16.8, -62.0), rx: 6.4, ry: 8.4, rot: 0.18},
];
/** the hook of the hamate (a small volar knob) */
export const HAMATE_HOOK = pt(-18.6, -64.0);

// ---------------------------------------------------------------- hand: metacarpals and the finger chains
export type Digit = {base: P; head: P; w: number; phal: number[]; dir: number};
/** index, middle, ring, little (metacarpal base -> head, then three phalanx lengths, straight-finger direction in rad) */
export const FINGERS: Digit[] = [
  {base: pt(8.4, -74), head: pt(12.2, -141), w: 7.4, phal: [41, 24, 17], dir: -Math.PI / 2 + 0.07},
  {base: pt(-3.2, -74), head: pt(-2.2, -145), w: 7.8, phal: [45, 28, 18], dir: -Math.PI / 2},
  {base: pt(-13.6, -73), head: pt(-16.4, -137), w: 6.8, phal: [42, 26, 17], dir: -Math.PI / 2 - 0.07},
  {base: pt(-22.4, -70), head: pt(-29.0, -125), w: 6.2, phal: [33, 19, 15], dir: -Math.PI / 2 - 0.17},
];
/** the thumb: first metacarpal from the trapezium, then two phalanges */
export const THUMB: Digit = {base: pt(22.0, -69), head: pt(41.0, -104), w: 8.2, phal: [31, 24], dir: -Math.PI / 2 + 0.52};

/** Joint points of a finger for a flexion amount (0 straight .. 1 a loose fist). The palm faces the camera, so a
 *  flexing finger rises toward the lens: each phalanx shortens by the cosine of its accumulated flexion, and the
 *  chain also drifts slightly toward the thumb side. Returns [MCP (metacarpal head), PIP, DIP, tip]. */
export const fingerChain = (d: Digit, curl: number): P[] => {
  const ang = [0.42 * curl + 0.18, 0.95 * curl + 0.22, 0.6 * curl + 0.12]; // per-joint flexion (rad): a relaxed hand at curl 0.25
  const pts: P[] = [d.head];
  let acc = 0;
  let p = d.head;
  const along = {x: Math.cos(d.dir), y: Math.sin(d.dir)};
  for (let i = 0; i < d.phal.length; i++) {
    acc += ang[i] ?? 0;
    const L = d.phal[i] * Math.cos(Math.min(acc, 1.45));
    p = add(p, mul(along, L));
    pts.push(p);
  }
  return pts;
};
/** the thumb chain [MCP (first metacarpal head), IP, tip] for an opposition / flexion amount 0..1 */
export const thumbChain = (curl: number): P[] => {
  const dir = THUMB.dir - 0.45 * curl; // swings toward the palm as it flexes
  const along = {x: Math.cos(dir), y: Math.sin(dir)};
  const a1 = 0.15 + 0.4 * curl, a2 = 0.25 + 0.6 * curl;
  const p1 = add(THUMB.head, mul(along, THUMB.phal[0] * Math.cos(a1)));
  const p2 = add(p1, mul(along, THUMB.phal[1] * Math.cos(a1 + a2)));
  return [THUMB.head, p1, p2];
};

// ---------------------------------------------------------------- skin landmarks
/** the wrist's distal crease and the forearm's skin borders (left = ulnar, right = radial) at a height y */
export const WRIST_CREASE_Y = -36;
export const skinBorders = (y: number): [number, number] => {
  // forearm: 58 mm wide at the wrist crease, widening toward the elbow; the palm widens past the wrist
  if (y >= WRIST_CREASE_Y) {
    const u = Math.min(1, (y - WRIST_CREASE_Y) / 260);
    return [-38 - 12 * u ** 0.8, 21 + 10 * u ** 0.8];
  }
  const v = Math.min(1, (WRIST_CREASE_Y - y) / 70);
  return [-38 - 6 * Math.sin(v * Math.PI * 0.5), 21 + 13 * Math.sin(v * Math.PI * 0.5)];
};

// ---------------------------------------------------------------- the incision (volar approach over the radius)
/** the surgical opening, held open by two small retractors (an ellipse; centre, half-width, half-length) */
export const INCISION = {c: pt(0.5, -2.0), rx: 16.0, ry: 18.5};
/** the depth of the radius' volar surface below the skin (mm) */
export const BONE_DEPTH = 10;

// ---------------------------------------------------------------- the glue's match point for the oyster comparison
/** a point on the bead's lower contact edge along C1 (glue above, shaft bone below): the oyster match aligns here */
export const MATCH_B = pt(-7.0, 2.6);
