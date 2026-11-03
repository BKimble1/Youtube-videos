// V2 per-frame state contracts shared by the story (story.ts computes them) and the art modules (they draw them).
// World millimetres (anatomy.ts); seams and the wedge transform in art/seams.ts.
import {P} from './core/geo';
import {SeamId, WedgeX} from './art/seams';

/** healing, each 0..1 */
export type Heal2 = {
  /** the fracture hematoma (a dark clot in and around the seams) */
  hem: number;
  /** soft callus (grey-pink fibrous tissue around the fracture's margins) */
  soft: number;
  /** pale new (woven) bone advancing from both broken faces into the glue-filled gap: seams.growth(id, s, bridge, side)
   *  mm from each face; the glue is what is left between the two fronts (gone where they meet) */
  bridge: number;
  /** the callus hardening (soft grey-pink -> pale woven bone) */
  hard: number;
  /** remodelling: woven bone -> mature bone, the seams and the callus fade back to the shaft's shape */
  remodel: number;
};
export const HEAL2_0: Heal2 = {hem: 0, soft: 0, bridge: 0, hard: 0, remodel: 0};

export type GlueSpan = {a: number; b: number}; // filled arc interval along the seam centreline (mm); none if b <= a

export type BoneState2 = {
  /** an animation clock (s): flow phases, shimmer */
  t: number;
  /** world mm per screen pixel at depth 0 (for constant on-screen line widths) */
  px: number;
  /** the small wedge fragment's current pose (WEDGE_SEATED when home) */
  wedge: WedgeX;
  /** the adhesive in each seam */
  glue: Record<SeamId, GlueSpan>;
  /** where the applicator's tip is laying glue right now (the fresh end of a span), or null; flow 0..1 */
  front: {seam: SeamId; s: number; flow: number} | null;
  /** 0 fresh and glossy .. 1 set (satin) */
  set: number;
  /** the probe tip touching bone: its contact point (current, world mm) and contact 0..1 (0 = lifted clear) */
  press: {p: P; contact: number} | null;
  /** the applicator tip touching bone (for its contact shadow): point and contact 0..1 */
  appContact: {p: P; contact: number} | null;
  /** the wet wound film: amount 0..1; flow clock (s, advances while wet); surge 0..1 progress of a stronger wash across
   *  the field (or -1 when none) */
  wet: number;
  flow: number;
  surge: number;
  heal: Heal2;
};

/** the instruments and the surgeon's hands (instrument space = the wrist plane, mm; tips reprojected by the scene) */
export type ProbeState = {
  /** tip position (at the bone when contact) and the shaft direction FROM the tip TOWARD the handle (rad, atan2, y down) */
  tip: P;
  ang: number;
  /** 0 = tip on the bone, 1 = lifted clear (the instrument rises off the bone and backs away along its axis) */
  lift: number;
};
export type AppState2 = {tip: P; ang: number; press: number; gel: number; lift: number};
export type InstrState2 = {
  app: AppState2;
  probe: ProbeState;
  /** 1 = the hand holds it; the hands never let go in this film, the instruments leave with the hands */
  appOn: number;
  probeOn: number;
  face: {focus: number; smile: number; gx: number; gy: number; blink: number};
  lean: number;
  k: number;
};
