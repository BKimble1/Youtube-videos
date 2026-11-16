// V3 acting: the guesser (the MouthPad player) and Honest (his friend, then his opponent), as functions of film time.
// One rig per character; every expression is a weighted blend of named states (eyes, brows, mouth shape, head), so
// faces evolve continuously instead of switching. Honest's mouth uses the rig's continuous viseme mouth.
import {mixPose, IDLE, Pose, VisShape, reach} from '../crew';
import {GState, HState, handsUp, handsBehind, honestHold, H, G} from '../art/room';
import {MouthState} from '../art/mouth';
import {T} from '../story';
import {FIRE2, FLIGHT, headTilt, headAim} from './play5';
import {clamp, keys, ss, ss5, pulse, lerp, bo} from '../lib';

const C2_START_G = 5.78; // the lift out of the mouth (device3.tsx C2_START)
const on = (t: number, a: number, b: number, r = 0.15) => ss(t, a, a + r) * (1 - ss(t, b - r, b));
export const KO_HIT = FIRE2.ko + FLIGHT; // the winning splat lands
export const LOOP_CUT = 30.9; // the match cut back into the opening composition
/** smooth noise for idle life (deterministic) */
const sway = (t: number, f: number, ph: number) => Math.sin(t * f + ph) * 0.6 + Math.sin(t * f * 1.73 + ph * 2.1) * 0.4;

export const guesser5 = (t: number): GState => {
  const up = handsUp(1);
  up.handL = {curl: 0.05 + 0.12 * (0.5 + 0.5 * Math.sin(t * 9)), spread: 1};
  up.handR = {curl: 0.05 + 0.12 * (0.5 + 0.5 * Math.sin(t * 9 + 1.5)), spread: 1};
  // hands up for the hook; laced behind the head from the head-aim beat through the whole ending (never in front of
  // the face); up again during the loop shot (at the frame edge), matching frame 0
  // (V4) the hands go behind the head while he is off screen (the cut-away and the split screen), and come up again
  // in the loop glide by moving the HANDS along a short outward arc with the arms solved by IK every frame (blending
  // joint angles made the elbows hang and the hands slide past the cheeks)
  const behind = ss(t, T.roof + 0.1, T.move - 0.1) * (1 - ss5(t, LOOP_CUT + 0.15, LOOP_CUT + 0.8));
  let pose: Pose = behind > 0 ? mixPose(up, handsBehind(), behind) : up;
  if (behind > 0 && behind < 1) {
    const ch = {x: G.x, y: G.ground, scale: G.scale};
    const arc = Math.sin(Math.PI * behind);
    const tgt = (side: -1 | 1) => ({
      x: G.x + side * lerp(side < 0 ? 168 : 170, 44, behind) + side * 48 * arc,
      y: G.ground - lerp(side < 0 ? 690 : 695, 650, behind) - 14 * arc,
    });
    const L = tgt(-1), R = tgt(1);
    pose = {...pose, armL: reach(ch, -1, L.x, L.y, 1), armR: reach(ch, 1, R.x, R.y, 1),
      handL: {curl: lerp(up.handL.curl, 0.7, behind), spread: lerp(1, 0.3, behind)}, handR: {curl: lerp(up.handR.curl, 0.7, behind), spread: lerp(1, 0.3, behind)}};
  }
  // where he looks: the game (left), Honest (down-left), us; the bored half-lidded stare in the versus round
  const atUs = on(t, T.its - 0.25, T.mouthpad, 0.18) + on(t, T.mouth4 - 0.05, 30.5, 0.2);
  const atHonest = on(t, T.seriously + 0.1, T.watch, 0.15);
  const bored = on(t, T.so - 0.2, 30.6, 0.3);
  // opening: his eyes follow the action, a smug brow flick and a little nod when the perfect shot lands
  const flick = pulse(t, 0.42, 0.5, 0.75, 0.95);
  const lookX = lerp(lerp(-0.85 + 0.12 * sway(t, 2.3, 1), -1, clamp(atHonest)), 0, clamp(atUs));
  const lookY = lerp(lerp(-0.22 + 0.08 * sway(t, 1.7, 2), 0.35, clamp(atHonest)), 0.05, clamp(atUs));
  // one slow, bored blink in each of his versus close-ups; eyelids half down while bored
  const slowBlink = Math.max(pulse(t, T.losing + 0.95, T.losing + 1.08, T.losing + 1.12, T.losing + 1.3), pulse(t, T.literally + 0.35, T.literally + 0.48, T.literally + 0.52, T.literally + 0.7));
  const lid = 1 - 0.38 * bored - 0.55 * slowBlink;
  pose = {
    ...pose,
    // (V5) in the aim demo his eyes lead the head toward where he is aiming
    lookX: lerp(lookX, 0.95 * headAim(t), on(t, T.tilt - 0.15, T.press, 0.12)), lookY: lerp(lookY + 0.25 * bored, -0.2, on(t, T.tilt - 0.15, T.press, 0.12)),
    brows: 0.05 + 0.5 * flick + 0.5 * pulse(t, T.its - 0.3, T.its - 0.15, T.mouthpad - 0.2, T.mouthpad) - 0.25 * on(t, T.tilt, T.aim + 0.4) + 0.4 * clamp(atHonest) - 0.1 * bored + 0.22 * pulse(t, T.shut + 0.05, T.shut + 0.2, 30.4, 30.6),
    browAsym: 0.5 * flick + 0.35 * pulse(t, T.shut + 0.05, T.shut + 0.2, 30.4, 30.6),
    // head aim: a clear tilt left on "head", then right onto the target on "you AIM", holding while it locks
    tilt: headTilt(t) + 2.5 * flick + 1.2 * sway(t, 1.1, 0.3) * (1 - bored * 0.6) * (1 - on(t, T.tilt - 0.3, T.press + 0.1, 0.2)), // (V4) the aim demo's tilt is exactly the game's aim
    lean: 0,
    // (V4) eyes held open from the lips closing to the next cut (an automatic blink was cut off by the cut)
    blink: t > T.so - 0.2 && t < 30.7 ? lid : t > T.close && t < T.see + 0.4 ? 1 : undefined,
    mouth: 'smile',
    // bob: a subtle groove to the game in the hook, settling back in the chair while bored
    bob: (t < 3.6 ? 3 * Math.abs(Math.sin(t * Math.PI * 2.0)) : 0) + 4 * bored,
  };
  // mouth: closed (smile) at frame 0; opens on "THIS" as the reticle arrives; the tongue taps the pad
  const open = keys(t, [
    [-1, 0], [T.this + 0.2, 0], [T.this + 0.45, 1.0], [T.tongue1 - 0.9, 1.0], [T.tongue1 - 0.6, 0.55], [T.seriously, 0.35], [T.watch - 0.05, 0.35], [T.watch + 0.1, 0.55],
    [T.its - 0.2, 0.55], [T.its + 0.15, 1.0], [T.mouthpad + 0.4, 1.0], [T.mouthpad + 0.6, 0],
    // the twist: wide and working; "Close your mouth" → the lower lip comes up and stays shut for the rest
    [T.and2 + 3.6, 0], [T.but - 0.15, 0.95], [T.close - 0.02, 0.95], [T.mouth3 + 0.12, 0],
  ], ss5);
  const lift = Math.max(on(t, T.mouth1 + 0.12, T.video1 - 0.15, 0.22), on(t, T.games - 0.1, T.tongue1 + 0.6, 0.2), on(t, T.watch, T.this2 + 0.45, 0.12), on(t, T.but, T.close - 0.05, 0.2));
  // the tongue tip sweeps across the pad as he plays
  const u = keys(t, [[T.mouth1, 0.15], [T.watch, 0], [T.watch + 0.1, -0.6], [T.watch + 0.24, 0.6], [T.watch + 0.38, -0.4], [T.this2 + 0.1, 0], [T.but, 0], [T.heres + 0.3, -0.55], [T.craziest + 0.2, 0.5], [T.part, -0.3], [T.close, 0.1]]);
  const pr = (f: number) => pulse(t, f - 0.12, f - 0.05, f + 0.03, f + 0.12);
  const press = Math.max(pr(T.can + 0.02), pr(FIRE2.tongue), pr(FIRE2.watchA), pr(FIRE2.watchB));
  // the punchline: a tiny smug smile grows on "SHUT" — mouth stays shut
  const smug = ss(t, T.shut + 0.02, T.shut + 0.32) * (1 - ss(t, LOOP_CUT + 0.4, LOOP_CUT + 0.9));
  const smile = 0.35 - 0.2 * bored + 0.45 * smug;
  const m: MouthState = {open, tongueLift: lift, u, v: 0.25, press, glow: 1, smile, smirk: 0.55 * smug, device: t < C2_START_G || t > T.and2 ? 1 : 0, smoothClose: true, clipPad: true,
    // (V4) the closed line meets the slit where it closes, then relaxes into the smile (and the reverse before the hook opens)
    settle: Math.min(t > T.close - 0.5 ? ss(t, T.mouth3 + 0.1, T.mouth3 + 0.45) : 1, 1 - ss(t, T.this + 0.02, T.this + 0.2) + (t > T.this + 1 ? 1 : 0))};
  // the head holds still for the lift-out match and through the lips closing (only breathing remains)
  const still = 1 - on(t, T.its - 0.1, T.mouthpad + 0.1, 0.12) - 0.85 * on(t, T.but - 0.2, T.mouth3 + 0.5, 0.2);
  return {pose, m, life: clamp(still), front: 'none'};
};

// ---------------------------------------------------------------- Honest
type Face = {brows: number; asym: number; lookX: number; lookY: number; v: VisShape};
const F: Record<string, Face> = {
  neutral: {brows: 0, asym: 0, lookX: 0.9, lookY: -0.45, v: {open: 0, wide: 0.45, round: 0, smile: 0}},
  skeptic: {brows: -0.2, asym: 0.9, lookX: 0.9, lookY: -0.1, v: {open: 0, wide: 0.35, round: 0.15, smile: -0.35}},
  shocked: {brows: 1, asym: 0, lookX: 0.6, lookY: -0.45, v: {open: 0.55, wide: 0.2, round: 0.85, smile: 0}},
  peer: {brows: 0.3, asym: 0.7, lookX: 1, lookY: -0.2, v: {open: 0.02, wide: 0.3, round: 0.3, smile: -0.2}},
  confident: {brows: -0.35, asym: 0, lookX: 0.35, lookY: -0.55, v: {open: 0.05, wide: 0.7, round: 0, smile: 0.7}},
  furious: {brows: -1, asym: 0.3, lookX: 0.3, lookY: -0.6, v: {open: 0.18, wide: 1, round: 0, smile: -0.9}}, // (V4) gritted, clearly frustrated
  frozen: {brows: 0.75, asym: 0.55, lookX: 0.3, lookY: -0.55, v: {open: 0.5, wide: 0.25, round: 0.65, smile: -0.1}},
  defeated: {brows: 0.55, asym: 0.75, lookX: 1, lookY: -0.12, v: {open: 0.42, wide: 0.25, round: 0.6, smile: -0.25}},
};
const blendFace = (ws: [string, number][]): Face => {
  let tot = 0;
  const acc: Face = {brows: 0, asym: 0, lookX: 0, lookY: 0, v: {open: 0, wide: 0, round: 0, smile: 0}};
  for (const [k, w] of ws) {
    if (w <= 0) continue;
    tot += w;
    const f = F[k];
    acc.brows += f.brows * w; acc.asym += f.asym * w; acc.lookX += f.lookX * w; acc.lookY += f.lookY * w;
    acc.v.open += f.v.open * w; acc.v.wide += f.v.wide * w; acc.v.round += f.v.round * w; acc.v.smile += f.v.smile * w;
  }
  const n = Math.max(tot, 1e-6);
  return {brows: acc.brows / n, asym: acc.asym / n, lookX: acc.lookX / n, lookY: acc.lookY / n, v: {open: acc.v.open / n, wide: acc.v.wide / n, round: acc.v.round / n, smile: acc.v.smile / n}};
};

export const honest5 = (t: number): HState => {
  // slides in on "Seriously", stays; rolls a little closer to peer at the guesser's shut mouth; the versus round:
  // confident, furious, standing and straining; frozen when he loses; then gone (out of frame) before the loop shot
  const inX = lerp(-420, H.x, bo(t, T.seriously - 0.25, T.seriously + 0.15, 1.1));
  const closer = on(t, T.controller - 0.35, T.so + 0.1, 0.3); // the peering lean and face
  const closerPos = ss(t, T.see - 0.3, T.see + 0.2); // (V5) the reposition finishes off screen (during the game shot), before the cut to the wide
  const exit = ss(t, T.mouth4 + 0.3, LOOP_CUT - 0.2);
  const x = inX + 150 * closerPos - 900 * exit;
  if (t < T.seriously - 0.3 || x < -650) return null;
  const confident = on(t, T.so - 0.2, T.losing + 0.1, 0.2);
  const furious = on(t, T.losing + 0.04, KO_HIT + 0.05, 0.2); // (V4) turns while the controller close-up is on screen
  const frozen = ss(t, KO_HIT, KO_HIT + 0.08);
  const toWinner = ss5(t, T.with2 - 0.2, T.with2 + 0.25); // his eyes slowly travel from the screen to the winner
  const mash = on(t, T.imagine - 0.25, KO_HIT + 0.02, 0.12) * (1 - frozen);
  const intens = mash * (0.45 + 0.55 * furious + 0.4 * on(t, T.someone, KO_HIT, 0.1));
  const rise = 120 * ss(t, T.whos, T.literally - 0.02) * (1 - ss(t, T.mouth4 + 0.3, T.mouth4 + 0.6)); // (V4) rises during the game shot, seen up in the two-shot
  const jit = (s: number, a: number) => (Math.sin(t * 61 + s) * 0.6 + Math.sin(t * 37 + s * 2) * 0.4) * a;
  const dx = jit(1, 9 * intens), dy = jit(2, 8 * intens);
  // the controller: held at his lap while watching, up for the round, slips slowly out of his hands after the loss
  const padUp = ss(t, T.so - 0.3, T.imagine);
  // (V4) the controller slips (slow), then falls with gravity and lands on the floor before the cut
  const slip = ss(t, KO_HIT + 0.35, KO_HIT + 0.7);
  const fall = clamp((t - (KO_HIT + 0.6)) / 0.38);
  const drop = 0.18 * slip + 0.82 * fall * fall;
  const ch = {x, y: H.ground - rise, scale: H.scale};
  let pose: Pose = honestHold(x, dx * (1 - frozen), dy * (1 - frozen));
  void ch;
  const low = honestHold(x, 0, 60);
  pose = {...pose, armL: mixPose(low, pose, padUp).armL, armR: mixPose(low, pose, padUp).armR};
  // fingers loosen as the controller slips
  pose.handL = {curl: lerp(0.75, 0.25, drop)}; pose.handR = {curl: lerp(0.75, 0.25, drop)};
  const skeptic = on(t, T.seriously - 0.1, T.watch + 0.2, 0.15);
  const shocked = on(t, FIRE2.watchB + 0.02, T.its + 0.5, 0.1);
  const peer = closer;
  const face = blendFace([
    ['neutral', 0.25], ['skeptic', 3 * skeptic], ['shocked', 3 * shocked], ['peer', 3 * peer], ['confident', 3 * confident * (1 - furious)],
    ['furious', 3 * furious * (1 - frozen)], ['frozen', 4 * frozen * (1 - toWinner)], ['defeated', 4 * frozen * toWinner],
  ]);
  pose = {
    ...pose,
    lookX: face.lookX + 0.06 * Math.sin(t * 5) * (1 - frozen), lookY: face.lookY,
    brows: face.brows, browAsym: face.asym,
    mouth: 'flat',
    lean: 14 * skeptic + 9 * peer + 12 * furious * (1 - frozen),
    // (V4) a frustrated head shake while he loses
    tilt: 5 * peer + jit(3, 2.2 * intens) - 6 * frozen * toWinner + 4 * shocked + 5 * Math.sin(t * 21) * furious * (1 - frozen) * on(t, T.someone - 0.1, KO_HIT, 0.15),
    // a slow blink-free stare when frozen
    blink: frozen > 0.5 ? 1 : undefined,
  };
  return {
    x, pose, rise, vis: face.v,
    pad: {dx: dx * (1 - frozen) + 30 * drop, dy: dy * (1 - frozen) + (1 - padUp) * 60 + drop * 300, r: jit(4, 7 * intens) + drop * 70, shake: intens > 0.5 ? (Math.floor(t * 24) % 2) : 0},
    sweat: clamp((t - (T.losing + 0.2)) / 1.0) * (1 - frozen), sweatX: 96, sweatY: 112, // (V4) at the temple, clear of the eye
  };
};
void IDLE; void keys;
