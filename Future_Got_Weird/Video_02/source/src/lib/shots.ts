import type {Cam} from './camera';

/**
 * Shared framings so every room scene looks like the same room from the same places. World px (1920x1080 space),
 * for <Camera cam={...}> around a RoomSet drawn with DEFAULT_VIEW. Derived from layout.json projections
 * (operator, hider, partition, wall samples, gap at the wall): see tools/sync_layout.py and lib/room.ts.
 *  - ROOM: tilt 0, both characters, the partition and the lit wall patch, headroom for the hair.
 *  - RAISED: tilt RAISED_TILT. Light paths in the room are drawn at RAISED_TILT or at tilt 0 (S2.4), and every leg that
 *    passes the partition goes behind its END, never across its top (lib/room assertAroundTheEnd, at module load for
 *    every tilt the shot draws light at). RAISED is a LOW rise on purpose: from the front-left camera the opening at
 *    the wall lies behind the partition's far end, and the higher the camera, the higher the far-side legs climb on
 *    screen; above about 0.12, W4 and then W3 come out across the near panels' top band (0.12: W4 16 px below the near
 *    corner, fails; 0.15: every leg over the top). At 0.10 the W3 -> him leg goes behind the far end 313 px below its
 *    corner and comes out at the near end 53 px below it (W4: 39 px), screen px at zoom 1.25; rigs on the set's height
 *    scale (rigScale 1.20) stand clearly below the 2 m screen. The "seen from above" PlanCard carries the top-down read.
 *    Framings derived at tilt 0.10 from the projected subjects (world px): her left edge 483, his elbow 1308, the
 *    partition's far top 133, her feet 772. At CAM_PATH the partition top lands at screen y 138 and her feet at 936,
 *    and his elbow is 50 px left of the card.
 *  - PLAN_ACT: tilt 1, the arcs' working area (wall samples, hider, arcs up to |WH| = 1.33 m) for act 3.
 *  - PLAN_FULL: tilt 1, the whole room board.
 * Scenes may move between these with camPath, and may add their own close-ups, but a cut between scenes lands on
 * one of these framings unless a hand-off says otherwise.
 */
export const RAISED_TILT = 0.1;
export const CAM_ROOM: Cam = {cx: 880, cy: 565, zoom: 1.2};
/** RAISED, the room centred: both characters head to feet, the partition's far top, the wall spot W3. */
export const CAM_RAISED: Cam = {cx: 895, cy: 455, zoom: 1.25};
/** RAISED with the "seen from above" PlanCard in PLAN_CARD_RECT (top right): the room in screen x ~320..1350. */
export const CAM_PATH: Cam = {cx: 996, cy: 455, zoom: 1.25};
/** RAISED with a column of cards on the left (S1.6-S1.7, S3.2): the room in screen x ~905..1855. */
export const CAM_PATH_SIDE: Cam = {cx: 531, cy: 455, zoom: 1.15};
/** Screen rect of the PlanCard beside a raised path shot (480 px = a quarter of the frame width). */
export const PLAN_CARD_RECT = {x: 1400, y: 40, w: 480, h: 408};
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
