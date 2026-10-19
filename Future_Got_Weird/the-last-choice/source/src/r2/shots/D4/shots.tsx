// Section D4 shots: physical cameras on one battle (battle.tsx), film seconds in times.ts SH. Screen direction: the
// enemy is east (screen right) except where a shot re-establishes it (D4-3 and D4-9 look across the van; D4-5 is
// behind the Crew; the overhead re-establishes everything). The palette: an elevated track to establish the
// defensible area, low three-quarters for the blocks and counters, side-on for the strike, a brief overhead to show
// the ring, close for the choice and the loss; level lenses except the overhead.
import React from 'react';
import {Stage, useShotTime, camPath, CamKey} from '../../film/stage';
import type {AtmosOpts} from '../../world';
import {V3} from '../../../kit/math';
import {d4Items, d4FxAt, D4Opts} from './battle';
import {crewAt} from './crew';
import {SH, EV} from './times';
import {G} from './motion';

const M_STRIKE = EV.strike;
const g = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});
/** every shot's camera (start, keys, ease), for the cue sheet's pan/dist (tools) */
export const D4_CAMS: {start: number; keys: CamKey[]; ease: number}[] = [];
const shot = (start: number, keys: CamKey[], o: (T: number) => D4Opts = () => ({}), drift = 0.018, ease = 0.6, atmos?: AtmosOpts): React.FC => {
  D4_CAMS.push({start, keys, ease});
  const C: React.FC = () => {
    const {t, T} = useShotTime(start);
    const cam = camPath(keys, t, ease);
    const f = d4FxAt(T);
    return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={drift} atmos={atmos} items={(v) => [...d4Items(v, T, o(T)), ...f.items]} />;
  };
  return C;
};
const chest = (role: Parameters<typeof crewAt>[0], T: number, up = 1.2): V3 => {
  const c = crewAt(role, T);
  return {x: c.body.pos.x, y: c.body.pos.y + up, z: c.body.pos.z};
};

// ------------------------------------------------------------------ D4-1a (149.86–152.50): the defensible area
// Elevated three-quarter from the south-west, tracking west with them: the Crew on their feet among D1's wrecks, the
// arc of units advancing in guard from the east (screen right), heavy 2 walking out of the crater beyond; the
// Director backs off facing them, then they all turn and run for the van.
export const D4_1a = shot(SH.d41, [
  {t: 0, pos: g(25.6, 9.6, 4.6), target: g(35.6, 2.0, 0.9), fov: 44},
  {t: SH.d41b - SH.d41, pos: g(24.2, 9.0, 4.2), target: g(32.8, 2.2, 1.0), fov: 44},
], () => ({full: 30}), 0.016);
// ------------------------------------------------------------------ D4-1b (152.50–154.50): THE PLATE answered
// Low from the south (nearly side-on, so the two bodies stay apart): W1 runs him down, the hammer on the plate (153.42) — the crack goes right
// through, his heels skid back; it presses after him; his look at the plate; its hook as he turns away — he ducks
// under it and runs.
export const D4_1b = shot(SH.d41b, [
  {t: 0, pos: g(32.6, 5.5, 1.05), target: g(31.0, 1.7, 1.3), fov: 40},
  {t: SH.d42a - SH.d41b, pos: g(32.35, 5.45, 1.05), target: g(30.7, 1.75, 1.2), fov: 40},
], (T) => ({full: 34, tweak: {director: {anchor: chest('director', T, 1.3)}}}), 0.016);

// ------------------------------------------------------------------ D4-2a (154.50–156.70): THE RUNNER's route cut
// Low, south-east of him: he makes for the gap along the south side; the flanker overtakes along the near side and
// cuts across his path; the halligan comes up too late; the backhand; he goes over backward onto the street.
export const D4_2a = shot(SH.d42a, [
  {t: 0, pos: g(22.4, 12.6, 0.8), target: g(20.0, 7.8, 1.15), fov: 42},
  {t: 0.95, pos: g(21.6, 12.2, 0.85), target: g(17.3, 8.0, 1.1), fov: 38},
  {t: SH.d42b - SH.d42a, pos: g(21.3, 12.0, 0.85), target: g(17.6, 7.75, 0.7), fov: 38},
], (T) => ({full: 30, tweak: {runner: {anchor: chest('runner', T, 1.0)}}}), 0.02);

// ------------------------------------------------------------------ D4-2b (156.70–158.50): THE TETHER answered
// Side-on from the south, close: she (left, facing right) levels the empty launcher; H1's fist closes on it, the tug,
// the launcher torn out of her hands; it is flung down.
export const D4_2b = shot(SH.d42b, [
  {t: 0, pos: g(18.6, 1.4, 1.15), target: g(18.8, -1.3, 1.25), fov: 44},
  {t: SH.d43 - SH.d42b, pos: g(18.4, 1.35, 1.12), target: g(18.4, -1.3, 1.2), fov: 44},
], (T) => ({full: 30, tweak: {tether: {anchor: chest('tether', T, 1.2)}}}), 0.016);

// ------------------------------------------------------------------ D4-3a (158.50–160.75): at the van, spent
// From the south, behind them, low: the van and the ridge's north end beyond (units holding there: that way is shut),
// the arc holding beyond reach to the right; they come in and stand, spent; the tablet dropped, the cable pulled off
// the reel, the last flare drawn.
export const D4_3a = shot(SH.d43, [
  {t: 0, pos: g(14.9, 11.6, 1.6), target: g(11.6, 2.4, 1.45), fov: 44},
  {t: SH.d43b - SH.d43, pos: g(14.6, 10.8, 1.55), target: g(11.8, 2.0, 1.5), fov: 42},
], () => ({full: 30}), 0.014);
// ------------------------------------------------------------------ D4-3b (160.75–162.42): he looks round; the arm
// Close behind his right shoulder from among them: he looks back at them (to us), turns to the units, raises his arm.
export const D4_3b = shot(SH.d43b, [
  {t: 0, pos: g(13.6, 4.6, 1.45), target: g(12.6, 0.4, 1.75), fov: 38},
  {t: SH.d44a - SH.d43b, pos: g(13.5, 4.2, 1.45), target: g(12.65, 0.2, 1.9), fov: 38},
], (T) => ({full: 30, tweak: {director: {anchor: chest('director', T, 1.4)}}}), 0.012);

// ------------------------------------------------------------------ D4-4a (162.42–163.62): ARRIVAL — W1 swings first
// Low, in profile from the west (a re-established axis for one beat: he charges in from the right): W1's hook comes
// round at the charging Director, he ducks under it and drives the plate into its open chest — the chest plate off.
export const D4_4a = shot(SH.d44a, [
  {t: 0, pos: g(9.5, -2.6, 1.35), target: g(13.2, -2.2, 1.3), fov: 46},
  {t: SH.d44b - SH.d44a, pos: g(9.55, -2.65, 1.33), target: g(13.3, -2.35, 1.2), fov: 46},
], (T) => ({full: 30, tweak: {director: {anchor: chest('director', T, 1.3)}}}), 0.02);

// ------------------------------------------------------------------ D4-4b (163.62–164.72): W2 at the decoy maker; the club
// From the south-east, low: W2 winds up at the decoy maker; the breaker steps between them — the trigger: nothing —
// and swings the empty breaker into its raised arm: the arm comes off.
export const D4_4b = shot(SH.d44b, [
  {t: 0, pos: g(16.9, 7.7, 0.95), target: g(14.3, 4.2, 1.55), fov: 44},
  {t: SH.d44c - SH.d44b, pos: g(17.0, 7.6, 0.95), target: g(14.4, 4.2, 1.35), fov: 44},
], (T) => ({full: 30, tweak: {breaker: {anchor: chest('breaker', T, 1.3)}}}), 0.022);

// ------------------------------------------------------------------ D4-4c (164.72–165.62): the cable round its shins; driven over
// From the south-east, a little high, looking north-west across W3's shins: the loop whips round them (right), taut
// back to her hands (left) as she hauls; the Director drives into its chest from beyond.
export const D4_4c = shot(SH.d44c, [
  {t: 0, pos: g(18.3, 0.4, 1.7), target: g(15.95, -1.75, 0.75), fov: 48},
  {t: SH.d44d - SH.d44c, pos: g(18.15, 0.28, 1.65), target: g(16.0, -1.85, 0.7), fov: 47},
], (T) => ({full: 30, tweak: {tether: {anchor: chest('tether', T, 0.9)}}}), 0.02);

// ------------------------------------------------------------------ D4-4d (165.62–166.41): the last flare into heavy 2's eye
// Low behind the flare carrier: heavy 2 halts and levels its launcher at them; he strikes the last flare and throws
// it into its eye before it can fire: the flash.
export const D4_4d = shot(SH.d44d, [
  {t: 0, pos: g(12.3, 8.9, 0.9), target: g(20.5, 3.6, 2.4), fov: 46},
  {t: SH.d45 - SH.d44d, pos: g(12.4, 8.8, 0.95), target: g(21.0, 4.2, 2.2), fov: 46},
], (T) => ({full: 30, tweak: {flares: {anchor: chest('flares', T, 1.3)}}}), 0.02);

// ------------------------------------------------------------------ D4-5 (166.41–169.06): the local win, a breath; they come on again
// Behind them, low, looking east past the drone pilot: blinded, heavy 2 steps back off the slab; a look between them;
// then the units step over the wrecks and close, and the heavy shakes the flash off its eye.
export const D4_5 = shot(SH.d45, [
  {t: 0, pos: g(9.5, 5.1, 1.4), target: g(21.0, 2.8, 0.8), fov: 46},
  {t: 1.6, pos: g(9.7, 5.0, 1.42), target: g(19.8, 2.5, 1.0), fov: 45},
  {t: SH.d45b - SH.d45, pos: g(9.8, 4.9, 1.45), target: g(18.6, 2.4, 1.7), fov: 46},
], () => ({full: 34}), 0.016);
// ------------------------------------------------------------------ D4-5b (169.06–170.40): THE DRONE answered
// From the north-east, low, her face toward us: a drone drops out of the sky at the drone pilot (her controller dead): it
// clips her head, she goes down, the controller falls from her hands.
export const D4_5b = shot(SH.d45b, [
  {t: 0, pos: g(13.6, 1.6, 1.3), target: g(11.2, 4.3, 1.7), fov: 46},
  {t: SH.d46a - SH.d45b, pos: g(13.5, 1.66, 1.28), target: g(11.3, 4.2, 1.5), fov: 46},
], (T) => ({full: 30, near: true, tweak: {drone: {anchor: chest('drone', T, 1.0)}}}), 0.016);

// ------------------------------------------------------------------ D4-6a (170.40–172.60): REALIZE — the ring from above
// A brief overhead: the few of them by the van, the wrecks they made, the ring closing on every side — units over
// the ridge's ends and on its crest behind them, the arc tightening from the east — and heavy 2 coming on again.
export const D4_6a = shot(SH.d46a, [
  {t: 0, pos: {x: 11.4, y: 25.0, z: 14.6}, target: {x: 11.8, y: 0.5, z: 2.8}, fov: 52},
  {t: SH.d46b - SH.d46a, pos: {x: 11.0, y: 23.6, z: 13.8}, target: {x: 11.7, y: 0.5, z: 2.9}, fov: 52},
], () => ({full: 16, maxFull: 4, far: 60}), 0.0, 0.6, {smoke: 0.55, haze: 0.6});

// ------------------------------------------------------------------ D4-6b (172.60–175.04): their faces
// Close on the Director as he looks round — north, the crest behind them, south: every way shut — the tether
// operator behind him; heavy 2 comes on.
export const D4_6b = shot(SH.d46b, [
  {t: 0, pos: g(16.5, 6.2, 1.55), target: g(13.6, 2.2, 1.5), fov: 36},
  // (it eases back north-west, under heavy 2's path between its legs: ≥ 2 m from every leg as it comes on; the R3
  // first cut drifted south into its left legs' lane and a leg wiped the lens at 174.7)
  {t: SH.d47 - SH.d46b, pos: g(14.8, 2.8, 1.5), target: g(12.3, 5.2, 1.5), fov: 36},
], (T) => ({full: 30, tweak: {director: {anchor: chest('director', T, 1.5)}}}), 0.012);

// ------------------------------------------------------------------ D4-7a (175.04–175.74): the threat aimed at HER
// (R4) Low, from the south-west beside the death slab: she sits against the van's wall (lower left); heavy 2 closes the last
// metre on the open ground south-east of the van's nose (right, its legs clear of her and of the van), its amber eye locked on
// her, the ram arm under its nose pointing along z ≈ 4 — south of the van's front corner.
export const D4_7a = shot(SH.d47, [
  {t: 0, pos: g(5.0, 5.5, 0.7), target: g(13.0, 3.5, 2.2), fov: 46},
  {t: SH.d47b - SH.d47, pos: g(5.1, 5.45, 0.7), target: g(13.0, 3.5, 2.3), fov: 46},
], (T) => ({full: 34, tweak: {drone: {anchor: chest('drone', T, 0.5)}}}), 0.012);
// ------------------------------------------------------------------ D4-7b (175.74–176.45): he SEES; he CHOOSES
// Close on his face from her direction: looking at the heavy, his head snaps round to her (175.98) — the shock; his
// jaw sets (176.2); he launches toward the lens.
export const D4_7b = shot(SH.d47b, [
  {t: 0, pos: g(11.65, 5.2, 1.35), target: g(12.8, 6.4, 1.3), fov: 34},
  {t: SH.d47c - SH.d47b, pos: g(11.62, 5.18, 1.32), target: g(12.72, 6.3, 1.2), fov: 35},
], (T) => ({full: 30, near: true, tweak: {director: {anchor: chest('director', T, 1.45)}}}), 0.012);
// ------------------------------------------------------------------ D4-7c (176.45–177.45): the sprint
// (R4) Low from the south-west, wide enough for all three: the ram rears up over the open ground (right), she shrinks against the
// van's wall (left), he sprints in from the right along z ≈ 4.8 — south of the van's nose — and plants between them, plate up.
export const D4_7c = shot(SH.d47c, [
  {t: 0, pos: g(5.0, 6.6, 0.9), target: g(11.5, 3.8, 2.4), fov: 56},
  {t: SH.d48 - SH.d47c, pos: g(5.1, 6.5, 0.9), target: g(10.8, 4.0, 2.0), fov: 54},
], (T) => ({full: 34, tweak: {drone: {anchor: chest('drone', T, 0.5)}, director: {anchor: chest('director', T, 1.1)}}}), 0.012);

// ------------------------------------------------------------------ D4-8 (177.45–179.30): STRIKE
// (R4) From the south, raised over the slab rslab_15 (the camera sits 3.4 m up: its top is 2.3 m), ≈ 5 m from the plate and wide
// enough (8 m) for the whole event: the death slab at the left, the drone pilot against the van's wall, him planted with the plate
// up, and the ram head coming down from the right across open ground — the van behind them, the head clear of its nose. The
// ram lands on the plate (177.76), the plate bursts, he is thrown back left along the ram's line into the slab (177.99), and the lens
// eases left and in with him as his legs go.
export const D4_8 = shot(SH.d48, [
  {t: 0, pos: g(9.4, 8.8, 3.4), target: g(8.8, 4.2, 1.5), fov: 52},
  {t: M_STRIKE - SH.d48 + 0.12, pos: g(9.4, 8.8, 3.4), target: g(8.7, 4.15, 1.45), fov: 52},
  {t: M_STRIKE - SH.d48 + 0.45, pos: g(9.0, 7.1, 2.2), target: g(7.9, 3.8, 1.2), fov: 48},
  {t: SH.d49a - SH.d48, pos: g(8.3, 6.9, 1.4), target: g(7.2, 3.5, 0.9), fov: 42},
], (T) => ({full: 34, near: true, tweak: {director: {anchor: chest('director', T, 1.0)}, drone: {anchor: chest('drone', T, 0.5)}}}), 0.01);

// ------------------------------------------------------------------ D4-9a (179.30–180.80): he slides down the slab
// From in front of him (east-south-east, low): the slab behind him, he slides down it; the drone pilot at the right.
export const D4_9a = shot(SH.d49a, [
  {t: 0, pos: g(9.0, 4.6, 1.0), target: g(6.9, 3.35, 0.85), fov: 42},
  {t: SH.d49b - SH.d49a, pos: g(8.9, 4.55, 0.95), target: g(6.85, 3.3, 0.65), fov: 40},
], (T) => ({full: 30, near: true, tweak: {director: {anchor: chest('director', T, 0.8)}, drone: {anchor: chest('drone', T, 0.5)}}}), 0.01);

// ------------------------------------------------------------------ D4-9b (180.80–182.00): they are caught
// From his side of them (west), a little above head height, facing them — they are all looking at him: each one
// going to him is caught by a unit behind — the decoy maker's wrist (181.0) in front, the flare carrier's arm locked
// (181.7) between them, the breaker's leg gives and he sits by his dropped breaker (181.3) at the right; heavy 2's leg
// over them, a wreck beside them, the ring beyond. (Lower, the decoy maker hid the flare carrier; further south, the
// slab rslab_15 hid the breaker.)
export const D4_9b = shot(SH.d49b, [
  {t: 0, pos: g(8.4, 5.5, 2.25), target: g(13.2, 6.2, 1.0), fov: 50},
  {t: SH.d49c - SH.d49b, pos: g(8.45, 5.5, 2.2), target: g(13.2, 6.2, 0.95), fov: 49},
], () => ({full: 30, near: true}), 0.01);
// ------------------------------------------------------------------ D4-9c (182.00–183.30): he cannot rise
// Low from the south-east of him, the drone pilot at right: he tries to push himself up on his left hand — the arm
// shakes and gives, he sinks back against the slab; her hand stretched out toward him falls short.
export const D4_9c = shot(SH.d49c, [
  {t: 0, pos: g(9.4, 4.4, 1.0), target: g(7.3, 3.2, 0.75), fov: 48},
  {t: SH.d410 - SH.d49c, pos: g(9.3, 4.35, 0.98), target: g(7.25, 3.2, 0.7), fov: 46},
], (T) => ({full: 30, near: true, tweak: {director: {anchor: chest('director', T, 0.8)}, drone: {anchor: chest('drone', T, 0.6)}}}), 0.01);

// ------------------------------------------------------------------ D4-10 (183.30–186.90): the ring holds — FINAL_HIT
// From behind him, low on the ridge's foot (his view): the drone pilot getting onto her hands and knees to go to him;
// beyond them the decoy maker let go and raising both hands, the flare carrier's last heave and his head dropping, the
// breaker shaking (the tether operator is behind the van from here: EF holds on her); heavy 2 over them; the ring
// lowering into 'ready' unit by unit. On FINAL_HIT everything stops.
export const D4_10 = shot(SH.d410, [
  {t: 0, pos: g(4.4, 4.9, 1.3), target: g(11.5, 4.2, 1.2), fov: 54},
  {t: SH.end - SH.d410, pos: g(4.6, 4.85, 1.28), target: g(11.4, 4.2, 1.15), fov: 52},
// (the drone pilot is 0.5 m in front of the van's long right side, whose sill strip sorts nearer by its mean: bias her)
], () => ({full: 26, maxFull: 14, far: 80, tweak: {drone: {bias: 0.55}}}), 0.0);
