import type {Cam} from './camera';

/**
 * Shared framings so every room scene looks like the same room from the same places. World px (1920x1080 space),
 * for <Camera cam={...}> around a RoomSet drawn with DEFAULT_VIEW. Derived from layout.json projections
 * (operator, hider, partition, wall samples, gap at the wall): see tools/sync_layout.py and lib/room.ts.
 *  - ROOM: tilt 0, both characters, the partition and the lit wall patch, headroom for the hair.
 *  - RAISED: tilt RAISED_TILT, the gap between the partition's far end and the wall is visible; use whenever light paths
 *    are drawn in the room (S1.4-S1.7, S2.2, S2.4, S3.1, S8.2-S8.3).
 *  - PLAN_ACT: tilt 1, the arcs' working area (wall samples, hider, arcs up to |WH| = 1.33 m) for act 3.
 *  - PLAN_FULL: tilt 1, the whole room board.
 * Scenes may move between these with camPath, and may add their own close-ups, but a cut between scenes lands on
 * one of these framings unless a hand-off says otherwise.
 */
export const RAISED_TILT = 0.4;
export const CAM_ROOM: Cam = {cx: 880, cy: 565, zoom: 1.2};
export const CAM_RAISED: Cam = {cx: 905, cy: 535, zoom: 1.25};
export const CAM_PLAN_ACT: Cam = {cx: 984, cy: 372, zoom: 2.0};
export const CAM_PLAN_FULL: Cam = {cx: 960, cy: 540, zoom: 1.0};

/** Hand-offs between scenes (the outgoing scene's last frame equals the incoming scene's first frame). */
export const HANDOFF = {
  /** S4 -> S5: S4 ends on the plan view at CAM_PLAN_ACT (tilt 1) with the likely-location blob shown; S5 opens on the
   *  same plan board, which rolls up into a scroll and lands on the history shelf. */
  S4S5: {tilt: 1, cam: CAM_PLAN_ACT},
};

/** Plinth style shared by the history shelf (S5) and the 2026 plinth close-up (S6), so the cut matches. */
export const PLINTH = {body: '#FFFBF0', top: '#C9924F', plaque: '#FFC744', rope: '#C94A36', post: '#9E6B30', wall: '#D3E1F8'};
