// THE shared geometry contract for the predator and the eel's escape route. Every module draws from these numbers,
// so the exterior, the translucent reveal, the X-ray and the cutaway all share one outline and one route.
//
// Fish-local units ("u"): the predator (a dark sleeper, Odontobutis obscura, the predator in the X-ray study) faces
// LEFT, snout tip at x = -50, caudal fin tip at x = +50 (total length 100 u). y is DOWN. z is toward the viewer
// (the near side of the fish is z > 0; the head is about 14 u wide, so the near skin of the head is at z ≈ +7).
// The fish rests upright on the riverbed; its belly line is at y ≈ +12.4.
import {P, pt} from './core/geo';

export type P3 = {x: number; y: number; z: number};
export const p3 = (x: number, y: number, z = 0): P3 => ({x, y, z});

// ---------------------------------------------------------------- body outline (no fins), as two profiles
/** dorsal profile, snout to caudal peduncle (top edge of the body) */
export const DORSAL: P[] = [
  pt(-50.0, -0.6), pt(-48.6, -3.6), pt(-45.6, -6.9), pt(-42.4, -9.2), pt(-38.6, -10.6), pt(-33.5, -11.7),
  pt(-27.0, -12.5), pt(-19.0, -12.9), pt(-10.0, -12.6), pt(0.0, -11.8), pt(10.0, -10.6), pt(20.0, -8.8),
  pt(28.0, -6.6), pt(33.0, -5.4),
];
/** ventral profile, lower-jaw tip to caudal peduncle (bottom edge of the body) */
export const VENTRAL: P[] = [
  pt(-51.0, 0.9), pt(-49.6, 3.6), pt(-46.4, 6.4), pt(-41.5, 8.6), pt(-35.0, 10.2), pt(-28.0, 11.3),
  pt(-19.0, 12.1), pt(-9.0, 12.5), pt(1.0, 12.3), pt(11.0, 11.1), pt(20.0, 8.9), pt(28.0, 6.5), pt(33.0, 5.4),
];
/** the caudal peduncle end, where the caudal fin attaches (x = 33, y -5.4 .. +5.4); the rounded caudal fin reaches x = 50 */
export const CAUDAL = {x0: 33, halfDepth0: 5.4, tipX: 50, halfDepthMax: 9.5};
/** closed body outline (dorsal snout→tail, then ventral tail→jaw) for clip paths and silhouettes */
export const BODY: P[] = [...DORSAL, ...[...VENTRAL].reverse()];

// ---------------------------------------------------------------- head landmarks
export const EYE = {c: pt(-40.6, -7.0), r: 2.7};
/** the closed mouth: the cleft runs from between the lips at the snout back to the corner below the eye */
export const MOUTH = {tip: pt(-50.6, 0.15), corner: pt(-41.2, 2.7)};
/** preopercle: the curved groove behind the eye that bounds the cheek (top to bottom) */
export const PREOPERCLE: P[] = [pt(-37.0, -9.6), pt(-35.6, -5.0), pt(-35.4, -0.5), pt(-36.6, 4.2), pt(-39.2, 8.2)];
/** the gill cover's free REAR EDGE (top to bottom): the gill opening is the slit beneath this edge */
export const OPERCLE_EDGE: P[] = [
  pt(-27.6, -10.9), pt(-25.4, -9.0), pt(-23.8, -6.7), pt(-22.7, -3.6), pt(-22.5, 0.0), pt(-23.4, 3.6), pt(-25.4, 7.0), pt(-28.8, 10.2),
];
/** where the eel leaves the fish: on the upper part of the gill cover's rear edge (beneath the edge, near side) */
export const EXIT: P3 = p3(-23.55, -6.35, 6.4);
/** the direction the eel's body leaves the exit: back and up, clear of the pectoral fin (radians, screen angle, y down) */
export const EXIT_ANGLE = (-58 * Math.PI) / 180;
/** pectoral fin: base on the flank behind the LOWER half of the gill cover, the fan reaching back to x ≈ -9 */
export const PECTORAL = {base: [pt(-20.9, 1.6), pt(-20.2, 6.4)] as [P, P], reach: 11.5, z: 7.2};
/** pelvic fins under the belly below the pectoral, resting on the riverbed */
export const PELVIC = {base: pt(-16.5, 11.9), reach: 7.5};
/** dorsal fins: first (spiny, short) and second (soft, long); anal fin opposite the second dorsal */
export const DORSAL1 = {x0: -9.5, x1: -0.5, h: 6.5};
export const DORSAL2 = {x0: 3.0, x1: 22.0, h: 7.0};
export const ANAL = {x0: 6.0, x1: 21.0, h: 6.0};

// ---------------------------------------------------------------- interior landmarks (all at the midline unless noted)
/** buccal cavity / pharynx: the throat behind the closed mouth */
export const PHARYNX = {front: pt(-46.5, 0.6), back: pt(-29.0, 1.2), halfH: 3.0};
/** the four gill arches on the near side (each a curved bar from top to bottom, concave forward); gill slits are the
 *  gaps between them. The eel crosses the slit between arch 2 and arch 3 (0-based 1 and 2) at y ≈ -2.6. z ≈ +2.6 */
export const GILL_ARCHES: P[][] = [0, 1, 2, 3].map((i) => {
  const x = -33.6 + i * 1.85;
  return [pt(x + 1.6, -9.6 + i * 0.3), pt(x + 0.2, -5.2), pt(x - 0.3, -1.0), pt(x + 0.0, 3.2), pt(x + 1.2, 7.0), pt(x + 2.8, 9.4 - i * 0.3)];
});
export const GILL_Z = 2.6;
export const ESOPHAGUS = {front: pt(-28.5, 1.4), back: pt(-13.5, 1.7), halfH: 1.9};
/** the stomach, distended around the swallowed eel (an egg shape; the cardia, where the esophagus enters, is at its front) */
export const STOMACH = {c: pt(-3.2, 4.4), rx: 12.4, ry: 6.6, cardia: pt(-13.5, 1.7)};
/** swim bladder (gas: dark on an X-ray) above the gut, below the spine */
export const SWIM_BLADDER = {c: pt(-2.0, -6.6), rx: 11.5, ry: 2.6};
/** the vertebral column, skull to the caudal fin (for the X-ray) */
export const SPINE: P[] = [pt(-31.0, -6.2), pt(-20.0, -8.4), pt(-8.0, -9.0), pt(4.0, -8.4), pt(16.0, -6.6), pt(26.0, -3.8), pt(34.0, -1.2), pt(40.0, 0.0)];

// ---------------------------------------------------------------- the eel's escape route through the fish
/** Arc-length coordinate σ along the route: σ = 0 at the cardia (stomach mouth); σ > 0 runs up the esophagus to the
 *  throat, turns sideways through the gill slit, crosses the opercular chamber and reaches the EXIT at σ = S_EXIT;
 *  σ < 0 runs back into the stomach (see eel.ts: the swallowed eel lies folded there). The tract below is fixed
 *  anatomy; z rises from the midline (0) through the slit (≈ 2.6) to the near-side exit (6.4). */
export const TRACT: P3[] = [
  p3(-13.5, 1.7, 0.0),
  p3(-17.0, 1.75, 0.0),
  p3(-21.0, 1.8, 0.0),
  p3(-25.0, 1.55, 0.2),
  p3(-28.4, 0.85, 0.8),
  p3(-30.5, -0.5, 1.7),
  p3(-30.55, -2.5, 2.7), // in the slit between arch 2 and arch 3
  p3(-29.2, -4.15, 3.9), // the opercular chamber (between the gills and the cover)
  p3(-27.0, -5.35, 4.9),
  p3(-24.9, -6.05, 5.8),
  EXIT,
];
/** the stomach part of the route (σ < 0) when the eel lies fully folded in it (a Z-fold: back along the top, forward
 *  through the middle, back along the bottom; the head is deepest, pointing toward the fish's tail) */
export const STOMACH_FOLD: P[] = [
  pt(-13.5, 1.7), pt(-9.0, 0.6), pt(-3.0, 0.0), pt(2.2, 0.3), pt(4.9, 1.6), pt(5.2, 3.6), pt(3.0, 4.6),
  pt(-2.0, 4.6), pt(-7.2, 4.9), pt(-9.8, 6.1), pt(-9.6, 8.1), pt(-7.0, 8.9), pt(-2.0, 9.0), pt(3.0, 8.8), pt(8.0, 8.1), pt(12.0, 7.2), pt(15.0, 6.2),
];
/** the stomach part of the route once little of the eel is left inside (a gentle curve back from the cardia) */
export const STOMACH_RELAXED: P[] = [pt(-13.5, 1.7), pt(-9.5, 2.6), pt(-4.5, 3.8), pt(1.0, 4.6), pt(6.5, 4.9), pt(11.5, 4.5), pt(16.0, 3.6), pt(20.0, 2.6)];

// ---------------------------------------------------------------- the eel (a juvenile Japanese eel, Anguilla japonica)
/** total length (u). The body radius along it is EEL_RADIUS(u), u = 0 at the snout, 1 at the tail tip. */
export const EEL_L = 54;
export const EEL_R_MAX = 1.25;
export const EEL_RADIUS = (u: number) => {
  // a rounded snout, a slightly wider head, the trunk, then a long taper to a fine point
  if (u <= 0) return 0.0;
  if (u < 0.035) return EEL_R_MAX * (0.55 + 0.45 * Math.sqrt(u / 0.035)) * 0.92;
  if (u < 0.09) return EEL_R_MAX * (0.92 + 0.06 * Math.sin(((u - 0.035) / 0.055) * Math.PI));
  if (u < 0.38) return EEL_R_MAX * (0.94 + 0.06 * Math.sin(((u - 0.09) / 0.29) * Math.PI));
  const v = (u - 0.38) / 0.62;
  return EEL_R_MAX * 0.94 * Math.pow(Math.max(0, 1 - v), 0.85) + 0.05 * (1 - v);
};
/** body coordinates of the eel's features */
export const EEL_FEAT = {eyeU: 0.03, eyeR: 0.42, gillU: 0.085, pectoralU: 0.095, dorsalFinU: 0.4, analFinU: 0.47, finH: 0.42};
