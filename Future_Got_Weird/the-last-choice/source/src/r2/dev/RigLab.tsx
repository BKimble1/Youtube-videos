// R2 rig lab (not part of the film). Pages:
//   0..6  model + pose sheet per Crew member (front, ¾, profile, rear ¾, back, crouch, kneel, braced, fall, injured)
//   7     hand poses (palm / back / edge, both thumb sides)
//   8     PROOF 1: the Director rising on the rubble ridge (engine, real set, low camera), then turning to face east
//   9     contact proof: a catch (the runner knocked back into the breaker's arms) + a hand on the shoulder
//   10    death close-up in the scene (frames 0–239) and the hand clasp insert (frames 240–299)
//   11    pitch check (camera −20° / 0° / +35° at three yaws)      12  tools sheet
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, F as FONT} from '../../theme';
import {V3, add3, mul3, lerp, clamp, smooth, rad, lerp3, easeOut, easeIn, easeInOut} from '../../kit/math';
import {Scene, Item, makeView, Cam3, headingVec, mixCam3, project} from '../engine';
import {setItems} from '../world/set';
import {atmosItems} from '../world/atmos';
import {MATS, lightFor} from '../world/lighting';
import {groundH} from '../world/ground';
import {PLAN} from '../world/plan';
import {M} from '../timing';
import {
  Figure, FigProps, CAST, ROLES2, ROLE2, lookR2, dmgR2, toolsR2, handGlyph, HANDS, figureSprite, keyPose, RISE_KEYS, layer,
  BRACED, KNOCKED_BACK, CATCH_BODY, REACH_SHOULDER, SLUMP, STAND, plateWear, tetherLauncher, hipReel, tablet, breaker, controller,
  halligan1, halligan2, flare, canister, SWING_BREAKER, AIM, SKETCH, THROW, PRY, BLOCK_HIGH, ClaspCU, Pose, figureRig,
  supportCatch, handOn, SH_H, SH_X, Role2, BASH, BLOCK_MID, CROUCH, FIRE_RECOIL, gaitW, RUN_W, breakerCarry, controllerHold,
  FACES, FaceName, expr, deathFace, lastBreath, gazeLook, figureParts,
} from '../rig';

const BG = '#EDE6D6';
const LIGHT0 = {dir: {x: -0.75, y: -0.35, z: 0.35}, key: 1, shadowC: '#30395A', rimC: '#FFD3A0', rim: 1};
const Label: React.FC<{x: number; y: number; t: string; size?: number}> = ({x, y, t, size = 22}) => (
  <text x={x} y={y} fontFamily={FONT.body} fontSize={size} fill={C.ink} textAnchor="middle">{t}</text>
);

const sheetPoses: {label: string; p: Partial<FigProps>}[] = [
  {label: 'front', p: {yaw: 0}},
  {label: 'three-quarter', p: {yaw: 40}},
  {label: 'profile', p: {yaw: 90}},
  {label: 'rear ¾', p: {yaw: 140}},
  {label: 'back', p: {yaw: 180}},
  {label: 'crouch', p: {yaw: 35, drop: 70, lean: 28, legL: {local: {r: -40, u: 10, f: 40}}, legR: {local: {r: 44, u: 10, f: -36}}, armL: {local: {r: -40, u: 150, f: 120}}, armR: {local: {r: 70, u: 110, f: 60}}, handL: 'brace', handR: 'fist', head: {pitch: -14}}},
  {label: 'kneel', p: {yaw: 60, drop: 84, lean: 6, legL: {local: {r: -36, u: 10, f: 72}}, legR: {local: {r: 36, u: 34, f: -72}, pitch: -50}, armL: {local: {r: -34, u: 116, f: 92}}, handL: 'relaxed'}},
  {label: 'braced', p: {yaw: 30, ...BRACED()}},
  {label: 'fall', p: {yaw: 70, bodyPitch: -38, drop: 30, lean: -12, legL: {fk: {fwd: 50, knee: 40}}, legR: {fk: {fwd: 20, knee: 20}}, armL: {fk: {fwd: 110, out: 40, bend: 30}}, armR: {fk: {fwd: 60, out: 60, bend: 20}}, handL: 'open', handR: 'open', face: {mouth: 'open', open: 0.6, brows: 0.6}}},
  {label: 'injured', p: {yaw: 25, drop: 14, lean: 14, side: -8, legL: {local: {r: -40, u: 10, f: 22}}, legR: {local: {r: 40, u: 10, f: -14}}, armL: {local: {r: 10, u: 220, f: 60}, palm: {r: 1, u: 0, f: 0}}, armR: {local: {r: 64, u: 190, f: 40}}, handL: 'brace', head: {pitch: 12, roll: -6}, face: {mouth: 'pain', brows: 0.4, worry: 0.6, lids: 0.4}}},
];

// ------------------------------------------------------------------ proof 1: the rise
const RISE_POS: V3 = (() => { const p = PLAN.directorBuried; return {x: p.x, y: groundH(p.x, p.z), z: p.z}; })();
const RISE_HEAD = 150; // he rises facing south-east, then turns to face the enemy (east)
/** A ground contact (on the terrain) near the figure. */
const at3 = (pos: V3, heading: number, fwd: number, right: number, up = 0): V3 => {
  const f = headingVec(heading), r = headingVec(heading + 90);
  const x = pos.x + f.x * fwd + r.x * right, z = pos.z + f.z * fwd + r.z * right;
  return {x, y: groundH(x, z) + up, z};
};
/** A body-relative point (height measured from the feet, not the terrain under it). */
const bod3 = (pos: V3, heading: number, fwd: number, right: number, up: number): V3 => {
  const f = headingVec(heading), r = headingVec(heading + 90);
  return {x: pos.x + f.x * fwd + r.x * right, y: pos.y + up, z: pos.z + f.z * fwd + r.z * right};
};
type K3 = [number, V3];
const keyV = (keys: K3[], t: number): V3 => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerp3(keys[i - 1][1], keys[i][1], easeInOut((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
};
/** The rise, u = seconds from the first solo note; turn to face east from 7.6 s. */
export const riseSpec = (u: number) => {
  const turn = smooth((u - 7.6) / 1.4);
  const heading = lerp(RISE_HEAD, 90, turn);
  const pos = RISE_POS;
  const H0 = RISE_HEAD;
  const palmR = at3(pos, H0, 0.62, 0.22, 0.03), palmL = at3(pos, H0, 0.5, -0.3, 0.03);
  const kneeL = at3(pos, H0, 0.34, -0.15, 0.48);
  const handR = keyV([[0, add3(palmR, {x: 0, y: 0.25, z: 0})], [0.8, palmR], [2.3, palmR], [3.4, add3(kneeL, mul3(headingVec(H0), 0.03))], [4.9, add3(kneeL, {x: 0, y: 0.05, z: 0})], [6.0, bod3(pos, H0, 0.15, 0.48, 0.95)], [7.2, bod3(pos, H0, 0.22, 0.34, 0.8)], [9.5, bod3(pos, 90, 0.25, 0.34, 0.8)]], u);
  const handL = keyV([[0, at3(pos, H0, 0.2, -0.24, 0.05)], [0.9, palmL], [1.9, palmL], [3.6, bod3(pos, H0, 0.36, -0.1, 0.6)], [5.0, bod3(pos, H0, 0.34, -0.1, 0.74)], [6.2, bod3(pos, H0, 0.32, -0.08, 0.92)], [7.2, bod3(pos, H0, 0.32, -0.08, 0.92)], [9.5, bod3(pos, 90, 0.34, -0.06, 0.94)]], u);
  const footL = keyV([[0, at3(pos, H0, -0.62, -0.14, 0.05)], [1.3, at3(pos, H0, -0.6, -0.14, 0.05)], [2.6, at3(pos, H0, 0.08, -0.15, 0.02)], [3.8, at3(pos, H0, 0.3, -0.15, 0.02)], [6.2, at3(pos, H0, 0.3, -0.15, 0.02)], [7.2, at3(pos, H0, 0.2, -0.18, 0.02)], [8.4, at3(pos, 120, 0.2, -0.18, 0.02)], [9.2, at3(pos, 90, 0.2, -0.18, 0.02)]], u);
  const footR = keyV([[0, at3(pos, H0, -0.64, 0.14, 0.05)], [1.3, at3(pos, H0, -0.62, 0.14, 0.05)], [2.6, at3(pos, H0, -0.5, 0.13, 0.08)], [3.8, at3(pos, H0, -0.44, 0.14, 0.1)], [5.0, at3(pos, H0, -0.4, 0.15, 0.08)], [6.0, at3(pos, H0, 0.02, 0.17, 0.02)], [7.2, at3(pos, H0, -0.08, 0.18, 0.02)], [7.9, at3(pos, 110, -0.08, 0.2, 0.02)], [8.8, at3(pos, 90, -0.08, 0.18, 0.02)]], u);
  const pose = keyPose(RISE_KEYS, u);
  const T = M.SOLO + u;
  // planted palms: the wrist bends so the palm lies on the rubble, fingers forward and a little out
  const plantR = u < 0.8 ? smooth(u / 0.8) : 1 - smooth((u - 2.1) / 0.5);
  const plantL = u < 0.9 ? smooth((u - 0.3) / 0.6) : 1 - smooth((u - 1.75) / 0.4);
  const down = {x: 0, y: -1, z: 0};
  const orientR = {fingers: add3(mul3(headingVec(H0), 0.9), mul3(headingVec(H0 + 90), 0.3)), palm: down, w: plantR};
  const orientL = {fingers: add3(mul3(headingVec(H0), 0.9), mul3(headingVec(H0 - 90), 0.3)), palm: down, w: plantL};
  return {pos, heading, handR, handL, footL, footR, orientR, orientL, pose, T};
};

const sceneFor = (view: ReturnType<typeof makeView>, T: number, figs: Item[], o: {atmos?: boolean} = {}) => (
  <Scene view={view} light={lightFor(T)} mats={MATS} t={T} items={[...setItems(view, T), ...(o.atmos === false ? [] : atmosItems(view, T)), ...figs]} />
);

export const RigLab: React.FC<{page?: number; nofig?: boolean}> = ({page = 0, nofig = false}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  if (page <= 6) {
    const role = ROLES2[page];
    const look = CAST[ROLE2[role]];
    // worn kit that is part of the costume (held tools are on page 12)
    const kit: Partial<FigProps> = role === 'director' ? {wearL: plateWear('dented')} : role === 'tether' ? {extra: hipReel(0.8)} : {};
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}}>
        <text x={40} y={60} fontFamily={FONT.display} fontSize={34} fill={C.ink}>{`R2 model sheet · ${role} (${ROLE2[role]})`}</text>
        {sheetPoses.map((q, i) => {
          const col = i % 5, row = Math.floor(i / 5);
          const x = 200 + col * 380, y = 480 + row * 470;
          return (
            <g key={i}>
              <Figure look={look} t={t} seed={3 + i} id={`ms${i}`} x={x} y={y} s={0.82} ink={3.4} light={LIGHT0} dmg={dmgR2(role, 30)} {...kit} {...q.p} />
              <Label x={x} y={y + 50} t={q.label} />
            </g>
          );
        })}
      </svg>
    );
  }
  if (page === 7) {
    const skin = CAST.clerkC.skin;
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}}>
        <text x={40} y={60} fontFamily={FONT.display} fontSize={34} fill={C.ink}>R2 hand poses · palm / back / edge-on · thumb up / down</text>
        {HANDS.map((h, i) => (
          [[1, 1], [-1, 1], [0.15, 1], [1, -1]].map(([pv, th], j) => {
            const x = 150 + i * 225, y = 200 + j * 220;
            const [b, fr] = handGlyph(h, {s: 3, ink: 5, skin, inkC: C.ink, pv, thumb: th, holding: h === 'grip' ? <rect x={48} y={-70} width={20} height={140} rx={6} fill="#5B646B" stroke={C.ink} strokeWidth={5} /> : undefined});
            return (
              <g key={`${i}_${j}`}>
                <g transform={`translate(${x - 60} ${y}) rotate(0)`}>{b}{fr}</g>
                {j === 0 && <Label x={x} y={110} t={h} />}
                {i === 0 && <Label x={50} y={y + 6} t={['palm', 'back', 'edge', 'flip'][j]} size={18} />}
              </g>
            );
          })
        ))}
      </svg>
    );
  }
  if (page === 8) {
    // PROOF 1: the rise. Frame time = seconds from the first solo note.
    const u = t;
    const R = riseSpec(u);
    const look = lookR2('director');
    const fig = figureSprite({
      key: 'dir', look, t: R.T, seed: 11, pos: R.pos, heading: R.heading,
      pose: {...R.pose, handL: R.pose.handL, wearL: plateWear(toolsR2('director', R.T).plate ?? 'intact'), dmg: dmgR2('director', R.T)},
      world: {handL: R.handL, handR: R.handR, footL: R.footL, footR: R.footR, orientL: R.orientL, orientR: R.orientR},
    });
    // camera: low, three-quarter front, slowly rising with him; ends behind his right shoulder as he turns east
    const fwd = headingVec(RISE_HEAD), right = headingVec(RISE_HEAD + 90);
    const CS = (globalThis as {RIG_CAM?: number}).RIG_CAM ?? 1;
    const side = CS === 1 ? -1 : 1;
    const c0: Cam3 = {pos: add3(R.pos, {x: fwd.x * 1.1 + right.x * 2.5 * side, y: 0.55, z: fwd.z * 1.1 + right.z * 2.5 * side}), target: add3(R.pos, {x: fwd.x * 0.35, y: 0.2, z: fwd.z * 0.35}), fov: 44};
    const c1: Cam3 = {pos: add3(R.pos, {x: fwd.x * 1.4 + right.x * 3.0 * side, y: 0.8, z: fwd.z * 1.4 + right.z * 3.0 * side}), target: add3(R.pos, {x: fwd.x * 0.1, y: 1.0, z: fwd.z * 0.1}), fov: 44};
    // over his right shoulder looking east at the avenue; kept above the rubble so the ridge never blocks the lens
    const c2p = add3(R.pos, {x: -2.0, y: 1.55, z: 1.4});
    c2p.y = Math.max(c2p.y, groundH(c2p.x, c2p.z) + 0.7);
    const c2: Cam3 = {pos: c2p, target: add3(R.pos, {x: 7, y: 0.95, z: -1.7}), fov: 50};
    // the end move orbits around him (through his front as he turns), so he never leaves the frame
    const orbit = (a: Cam3, b: Cam3, k: number): Cam3 => {
      const oa = {x: a.pos.x - R.pos.x, z: a.pos.z - R.pos.z}, ob = {x: b.pos.x - R.pos.x, z: b.pos.z - R.pos.z};
      const aa = Math.atan2(oa.x, oa.z), ab = Math.atan2(ob.x, ob.z);
      const da = ((ab - aa + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
      const ang = aa + da * k, rr = lerp(Math.hypot(oa.x, oa.z), Math.hypot(ob.x, ob.z), k);
      const x = R.pos.x + Math.sin(ang) * rr, z = R.pos.z + Math.cos(ang) * rr;
      // rise a little mid-move to clear the slabs around him; the aim leaves him for the avenue only at the end
      const y = Math.max(lerp(a.pos.y, b.pos.y, k) + 0.6 * Math.sin(Math.PI * k), groundH(x, z) + 0.6);
      return {pos: {x, y, z}, target: lerp3(a.target, b.target, k * k * k), fov: lerp(a.fov ?? 44, b.fov ?? 44, k)};
    };
    const cam = u < 7.2 ? mixCam3(c0, c1, smooth(u / 7.2)) : orbit(c1, c2, smooth((u - 7.2) / 2.6));
    const view = makeView(cam);
    return sceneFor(view, R.T, nofig ? [] : [fig]); // nofig: the set alone (render-cost baseline)
  }
  if (page === 9) {
    // CONTACT PROOF. Frames 0–149: a catch from behind (the breaker catches the runner, knocked back by a hit) using
    // the support hierarchy: the runner's fall stops on the breaker's cradle, the breaker's palms sit on his back.
    // Frames 150–299: the drone pilot's hand settles on the Director's left shoulder; he turns his head to it.
    const T = M.CATCH;
    if (f < 150) {
      const base: V3 = {x: 46, y: 0, z: 6};
      const k = clamp(t / 2.4);
      const fallK = clamp(k * 1.25);
      // the catcher stands behind and a little to the faller's right, so the faller's head lands by his shoulder
      const catcherPos: V3 = {x: base.x - 0.95, y: groundH(base.x - 0.95, base.z + 0.36), z: base.z + 0.36};
      const r0: V3 = {x: base.x + 0.6, y: 0, z: base.z}, r1: V3 = {x: base.x + 0.08, y: 0, z: base.z};
      const rp = lerp3(r0, r1, easeOut(fallK));
      const runnerPos: V3 = {x: rp.x, y: groundH(rp.x, rp.z), z: rp.z};
      // he would fall flat (−48°); the catch decides where he actually stops
      const runnerPose: Pose = keyPose([[0, STAND], [0.2, KNOCKED_BACK(0.15)], [0.7, layer(KNOCKED_BACK(0.4), {drop: 34})], [1, layer(KNOCKED_BACK(0.42), {drop: 72, bodyPitch: -48})]], fallK); // knees buckle as he goes
      const runner = {key: 'run', look: lookR2('runner'), t: T + t, seed: 4, pos: runnerPos, heading: 90, pose: {...runnerPose, dmg: dmgR2('runner', T + 2), handR: 'grip' as const, holdR: halligan1({ang: 70})}};
      const absorb = smooth(clamp((t - 0.9) / 0.6));
      const catcher = {key: 'cat', look: lookR2('breaker'), t: T + t, seed: 7, pos: catcherPos, heading: 90,
        pose: layer(CATCH_BODY, {drop: 28 + 16 * absorb, lean: 12 - 8 * absorb, head: {yaw: 10, pitch: 10}, dmg: dmgR2('breaker', T)})};
      const gy = groundH(base.x - 0.4, base.z);
      const view = makeView({pos: {x: base.x + 2.4, y: gy + 1.4, z: base.z + 3.5}, target: {x: base.x - 0.45, y: gy + 1.0, z: base.z + 0.1}, fov: 36});
      const c = supportCatch(view, runner, catcher, {w: smooth(clamp((t - 0.35) / 0.45))});
      return sceneFor(view, T, [figureSprite(c.faller), figureSprite(c.catcher)], {atmos: false});
    }
    const u = (f - 150) / 30;
    const dp: V3 = {x: 22, y: 0, z: 3};
    const dPos: V3 = {x: dp.x, y: groundH(dp.x, dp.z), z: dp.z};
    const pPos: V3 = {x: dp.x - 0.5, y: groundH(dp.x - 0.5, dp.z - 0.5), z: dp.z - 0.5};
    const reach = smooth(clamp((u - 0.6) / 0.9));
    const turn = smooth(clamp((u - 1.3) / 0.8));
    const dir = {key: 'dir', look: lookR2('director'), t: T + t, seed: 11, pos: dPos, heading: 100,
      pose: {...BRACED({wide: 0.7}), handL: 'fist' as const, wearL: plateWear('dented'), dmg: dmgR2('director', T), head: {yaw: -46 * turn, pitch: 4 * turn}, face: {mouth: turn > 0.5 ? 'flat' as const : 'grit' as const, brows: lerp(-0.6, 0.1, turn), worry: 0.3 * turn, lookX: -0.8 * turn}}};
    const pilot0 = {key: 'pil', look: lookR2('drone'), t: T + t, seed: 5, pos: pPos, heading: 112, pose: {...REACH_SHOULDER, handL: 'relaxed' as const, dmg: dmgR2('drone', T), face: {mouth: 'flat' as const, worry: 0.6, brows: 0.3}}};
    const view = makeView({pos: add3(dPos, {x: 2.3, y: 1.55, z: -1.7}), target: add3(dPos, {x: -0.25, y: 1.3, z: -0.25}), fov: 34});
    const fwd = headingVec(100);
    // her palm comes down onto the top of his left shoulder, fingers draping forward over it
    const pilot = handOn(view, dir, {r: -(SH_X - 8), u: SH_H + 14, f: -4}, pilot0, 'R', reach, {palm: {x: 0, y: -1, z: 0}, fingers: add3(mul3(fwd, 0.8), {x: 0, y: -0.45, z: 0})});
    return sceneFor(view, T, [figureSprite(dir), figureSprite(pilot)], {atmos: false});
  }
  if (page === 10) {
    if (f >= 240) {
      const u = (f - 240) / 60;
      return <ClaspCU grip={1 - smooth(u * 1.4)} sag={smooth((u - 0.4) / 0.6)} squeeze={smooth(u * 2)} t={t} pale={0.6} />;
    }
    // the death close-up in the scene: he sits against the death slab, the drone pilot beside him
    const T = M.FINAL_HIT + t;
    const dp = PLAN.deathPos;
    const pos: V3 = {x: dp.x, y: groundH(dp.x, dp.z), z: dp.z};
    const lid = smooth((t - 6.6) / 1.4);
    const unf = smooth((t - 2) / 4);
    const face = {lid: Math.max(lid, 0.3 * smooth(t / 2)), unfocus: unf, mouth: 'breath' as const, open: 0.4 * (0.5 + 0.5 * Math.sin(t * 2.4)) * (1 - lid), lookX: lerp(0.5, 0.1, smooth(t / 4)), lookY: lerp(-0.2, 0.2, unf), brows: 0.2, worry: 0.5};
    const dir = figureSprite({key: 'dir', look: lookR2('director'), t: T, seed: 11, pos, heading: PLAN.deathHeading,
      pose: {...SLUMP({lean: 22, headRoll: lerp(10, 22, smooth((t - 6) / 2))}), face, breath: 0.25 * (1 - lid), wearL: plateWear('shattered'), dmg: dmgR2('director', M.STRIKE + 12)}});
    const hp = headingVec(PLAN.deathHeading);
    const cam: Cam3 = {pos: add3(pos, {x: hp.x * 1.1 + 0.25, y: 0.95, z: hp.z * 1.1 + 0.35}), target: add3(pos, {x: hp.x * 0.15, y: 0.98, z: hp.z * 0.15}), fov: 30};
    return sceneFor(makeView(cam), T, [dir], {atmos: false});
  }
  if (page === 11) {
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}}>
        <text x={40} y={60} fontFamily={FONT.display} fontSize={34} fill={C.ink}>R2 pitch check · camera −20° / 0° / +35° · yaw 0 / 40 / 120</text>
        {(['director', 'drone'] as const).map((role, r) => [-20, 0, 35].map((pitch, i) => [0, 40, 120].map((yaw, j) => {
          const x = 220 + (i * 3 + j) * 190, y = 470 + r * 470;
          return <g key={`${r}${i}${j}`}><Figure look={lookR2(role)} t={t} seed={7} id={`pc${r}${i}${j}`} x={x} y={y} s={0.6} ink={3} pitch={pitch} yaw={yaw} light={LIGHT0} wearL={role === 'director' ? plateWear('dented') : undefined} {...BRACED()} face={{blink: false, mouth: 'grit', brows: -0.5}} dmg={dmgR2(role, 100)} /><Label x={x} y={y + 60} t={`${pitch}° / ${yaw}°`} size={18} /></g>;
        })))}
      </svg>
    );
  }
  if (page === 13) {
    // head turnaround at close-up scale: the director (row 1) and the six others at three-quarter (row 2)
    const cells: {role: typeof ROLES2[number]; yaw: number; label: string; pitch?: number}[] = [
      ...[0, 20, 40, 65, 90, 150].map((yaw) => ({role: 'director' as const, yaw, label: `director ${yaw}°`})),
      ...(['tether', 'decoy', 'breaker', 'drone', 'runner', 'flares'] as const).map((role, i) => ({role, yaw: [40, -40, 60, -25, 75, 30][i], label: `${role} ${[40, -40, 60, -25, 75, 30][i]}°`})),
    ];
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}}>
        <defs>{cells.map((_, i) => <clipPath key={i} id={`hc${i}`}><rect x={(i % 6) * 310 + 30} y={Math.floor(i / 6) * 500 + 70} width={300} height={440} rx={16} /></clipPath>)}</defs>
        {cells.map((c, i) => {
          const x = (i % 6) * 310 + 180, y = Math.floor(i / 6) * 500 + 330 + 744;
          return (
            <g key={i}>
              <g clipPath={`url(#hc${i})`}><Figure look={lookR2(c.role)} t={t} seed={5 + i} id={`hd${i}`} x={x} y={y} s={2} ink={5} yaw={c.yaw} pitch={c.pitch ?? 4} light={LIGHT0} dmg={dmgR2(c.role, 30)} {...STAND} /></g>
              <Label x={x} y={Math.floor(i / 6) * 500 + 540} t={c.label} size={20} />
            </g>
          );
        })}
      </svg>
    );
  }
  if (page === 12) {
    const k = (t % 3) / 3;
    const figs: {role: typeof ROLES2[number]; p: Partial<FigProps>; label: string}[] = [
      {role: 'director', label: 'plate (block high)', p: {...BLOCK_HIGH, yaw: 30, wearL: plateWear('dented', {glint: 0.6})}},
      {role: 'tether', label: 'tether launcher (aim)', p: {...AIM, yaw: 60, holdR: tetherLauncher(), extra: hipReel(0.8)}},
      {role: 'decoy', label: 'tablet + projector (sketch)', p: {...SKETCH(t), yaw: 20, holdL: tablet({sketch: k, screen: false})}},
      {role: 'breaker', label: 'breaker (swing)', p: {...SWING_BREAKER(k), yaw: 70, extra: breaker({gauge: 0.6})}},
      {role: 'drone', label: 'drone controller', p: {...BRACED({fists: false}), yaw: 20, handL: 'grip', handR: 'grip', twoHanded: true, armL: {local: {r: -24, u: 250, f: 90}}, armR: {local: {r: 24, u: 250, f: 90}}, extra: controller()}},
      {role: 'runner', label: 'halligan (pry)', p: {...PRY(0.5 + 0.5 * Math.sin(t * 3)), yaw: 60, extra: halligan2()}},
      {role: 'flares', label: 'flare / canister (throw)', p: {...THROW(k), yaw: 50, holdR: k < 0.6 ? flare({lit: 1, t}) : undefined, handL: 'grip', holdL: canister()}},
    ];
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}}>
        <text x={40} y={60} fontFamily={FONT.display} fontSize={34} fill={C.ink}>R2 tools in the hands</text>
        {figs.map((q, i) => {
          const x = 170 + i * 265, y = 760;
          return <g key={i}><Figure look={lookR2(q.role)} t={t} seed={i + 2} id={`tl${i}`} x={x} y={y} s={0.95} ink={3.6} light={LIGHT0} dmg={dmgR2(q.role, 60)} {...q.p} /><Label x={x} y={y + 70} t={q.label} size={18} /></g>;
        })}
      </svg>
    );
  }
  if (page === 14) return <DiagStrip f={f} />;
  if (page === 15) return <DiagSil f={f} />;
  if (page === 16) return <DiagHeads f={f} />;
  if (page === 17) return <ExprSheet f={f} />;
  if (page === 19) {
    // probe: one action cell large (frame = role·10 + cell, yaw from the cell, camera 0°)
    const role = ROLES2[Math.floor(f / 10) % ROLES2.length];
    const c = diagCells(role, 1, 0)[f % 10];
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}}>
        <text x={14} y={34} fontFamily={FONT.body} fontSize={24} fill={C.ink}>{`${role} · ${c.label} · yaw ${c.yaw}`}</text>
        <Figure look={lookR2(role)} t={0} seed={5} id="probe" x={960} y={1040} s={2.2} ink={5} pitch={0} light={LIGHT0} dmg={dmgR2(role, DIAG_T)} {...c.pose} yaw={c.yaw} />
      </svg>
    );
  }
  if (page === 18) return <DeathSheet f={f} />;
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}} />;
};
void rad; void STAND;

// ================================================================== R3 diagnostic strip (pages 14, 15)
// Page 14: every cast member on the real set in the film's light (lightFor at a mid-battle time, the north sidewalk at
// the crater's rim, the camera in the crater looking north: the low sun from screen left), carrying the tools toolsR2
// gives them at that time. Frame f = role·6 + pitch·2 + sheet: role in ROLES2 order; pitch −15° / 0° / +35° (camera
// elevation at chest height); sheet 0 = the turn (yaw 0 15 30 45 60 90 120 135 | 150 165 180 210 240 270 300 330),
// sheet 1 = actions (crouch, run ×3 gait phases, strike anticipation + contact, receiving a hit, the tool in use, guard,
// a look back over the shoulder). Page 15: the same cells as flat silhouettes (frame = role).
const DIAG_T = 120;
const DIAG_PITCH = [-15, 0, 35];
const DIAG_TURN = [0, 15, 30, 45, 60, 90, 120, 135, 150, 165, 180, 210, 240, 270, 300, 330];
type DiagCell = {label: string; yaw: number; pose: Pose; gait?: number; tool?: boolean};
const DIAG_FACE = {blink: false};

/** The role's tools at film time T, in the pose's hands: carry (hanging/ready), run (one hand), use (the tool's work). */
const diagKit = (role: Role2, T: number, mode: 'ready' | 'one'): Pose => {
  const tl = toolsR2(role, T);
  switch (role) {
    case 'director': return {wearL: plateWear(tl.plate ?? 'dented'), handL: 'fist'};
    case 'tether': return {handR: 'grip', holdR: tetherLauncher({loaded: tl.tether !== 'cut'}), extra: hipReel(0.8)};
    case 'decoy': return {handL: 'grip', holdL: tablet({sketch: 0.7, smashed: tl.tablet === 'smashed'})};
    case 'breaker': return mode === 'ready' ? {handL: 'grip', handR: 'grip', twoHanded: true, extra: breaker({gauge: tl.gauge})} : {handR: 'grip', holdR: breakerCarry({gauge: tl.gauge})};
    case 'drone': return mode === 'ready' ? {handL: 'grip', handR: 'grip', twoHanded: true, extra: controller()} : {handL: 'grip', holdL: controllerHold()};
    case 'runner': return {handR: 'grip', holdR: halligan1({ang: 70})};
    case 'flares': return {handR: 'grip', holdR: flare({lit: 0})};
  }
};
const PUNCH = (k: number): Pose => keyPose([
  [0, {drop: 18, lean: 6, twist: 20, armR: {local: {r: 40, u: 260, f: 20}}, armL: {local: {r: -20, u: 270, f: 90}}, handR: 'fist', handL: 'fist', legL: {local: {r: -46, u: 10, f: 44}}, legR: {local: {r: 52, u: 10, f: -46}}, face: {mouth: 'grit', brows: -0.7}}],
  [0.55, {drop: 24, lean: 18, twist: -22, armR: {local: {r: 6, u: 284, f: 196}}, armL: {local: {r: -40, u: 250, f: 50}}, handR: 'fist', handL: 'fist', legL: {local: {r: -46, u: 10, f: 70}}, legR: {local: {r: 52, u: 20, f: -60}, pitch: -20}, face: {mouth: 'grit', brows: -1}}, easeIn],
], k);
const diagReady = (role: Role2, t: number): Pose => {
  const k = diagKit(role, DIAG_T, 'ready');
  switch (role) {
    case 'director': return layer(STAND, {armL: {local: {r: -24, u: 214, f: 70}, pole: {r: -1, u: -0.5, f: -0.1}, palm: {r: -0.4, u: 0.1, f: -1}}}, k);
    case 'tether': return layer(STAND, {armR: {local: {r: 46, u: 186, f: 52}}}, k);
    case 'decoy': return layer(SKETCH(t * 0), k);
    case 'breaker': return layer(SWING_BREAKER(0), k);
    case 'drone': return layer(STAND, {armL: {local: {r: -24, u: 240, f: 92}}, armR: {local: {r: 24, u: 240, f: 92}}}, k);
    default: return layer(STAND, k);
  }
};
const diagStrike = (role: Role2, k: number): Pose => {
  const kit = diagKit(role, DIAG_T, role === 'breaker' ? 'ready' : 'one');
  switch (role) {
    case 'director': return layer(BASH(k), kit);
    case 'breaker': return layer(SWING_BREAKER(lerp(0.35, 0.55, k)), kit);
    case 'tether': return layer(FIRE_RECOIL(k * 0.3), kit);
    case 'runner': return layer(PRY(k), {extra: halligan2(), handL: 'grip', handR: 'grip', twoHanded: true});
    case 'flares': return layer(THROW(lerp(0.4, 0.62, k)), kit, k > 0.9 ? {handR: 'open', holdR: undefined} : {});
    default: return layer(PUNCH(k), kit, role === 'drone' ? {handL: 'grip'} : {handL: 'grip'});
  }
};
const diagUse = (role: Role2, t: number): Pose => {
  switch (role) {
    case 'director': return layer(BLOCK_HIGH, diagKit(role, DIAG_T, 'one'));
    case 'tether': return layer(AIM, diagKit(role, DIAG_T, 'one'));
    case 'decoy': return layer(SKETCH(t + 0.4), diagKit(role, DIAG_T, 'one'));
    case 'breaker': return layer(SWING_BREAKER(0.75), diagKit(role, DIAG_T, 'ready'));
    case 'drone': return layer(BRACED({fists: false}), {armL: {local: {r: -24, u: 250, f: 90}}, armR: {local: {r: 24, u: 250, f: 90}}}, diagKit(role, DIAG_T, 'ready'));
    case 'runner': return layer(PRY(0.5), {extra: halligan2(), handL: 'grip', handR: 'grip', twoHanded: true});
    case 'flares': return layer(THROW(0.2), diagKit(role, DIAG_T, 'one'), {handL: 'grip', holdL: canister()});
  }
};
const diagGuard = (role: Role2): Pose => role === 'director' ? layer(BLOCK_MID, diagKit(role, DIAG_T, 'one')) : role === 'breaker' ? layer(BRACED(), {armR: {local: {r: 30, u: 230, f: 40}}, armL: {local: {r: -14, u: 240, f: 120}}}, diagKit(role, DIAG_T, 'ready')) : layer(BRACED(), diagKit(role, DIAG_T, 'one'));
const diagCells = (role: Role2, sheet: number, t: number): DiagCell[] => {
  if (sheet === 0) return DIAG_TURN.map((yaw) => ({label: `${yaw}°`, yaw, pose: layer(diagReady(role, t), {face: DIAG_FACE})}));
  const kit = diagKit(role, DIAG_T, 'one');
  const hitKit = role === 'breaker' || role === 'drone' ? kit : kit;
  return [
    {label: 'crouch', yaw: 40, pose: layer(CROUCH, kit, role === 'director' ? {} : {}, {face: {...DIAG_FACE, mouth: 'flat', brows: -0.4}})},
    {label: 'run 0.00', yaw: 90, pose: kit, gait: 0.0},
    {label: 'run 0.25', yaw: 90, pose: kit, gait: 0.25},
    {label: 'run 0.50', yaw: 50, pose: kit, gait: 0.5},
    {label: 'strike: wind', yaw: 40, pose: layer(diagStrike(role, 0), {face: DIAG_FACE})},
    {label: 'strike: contact', yaw: 70, pose: layer(diagStrike(role, 1), {face: DIAG_FACE})},
    {label: 'hit received', yaw: 30, pose: layer(KNOCKED_BACK(0.2), hitKit, {face: {...DIAG_FACE, mouth: 'pain', brows: 0.6, lids: 0.3}})},
    {label: 'tool in use', yaw: -40, pose: layer(diagUse(role, t), {face: DIAG_FACE})},
    {label: 'guard', yaw: 140, pose: layer(diagGuard(role), {face: DIAG_FACE})},
    {label: 'look back', yaw: 165, pose: layer(STAND, kit, {head: {yaw: -70}, twist: -20, face: {...DIAG_FACE, lookX: -0.8}})},
  ];
};
/** Place cell i of n on the sidewalk strip, facing so that the camera sees it at `yaw`; run cells follow gaitW. */
const diagSpec = (view: ReturnType<typeof makeView>, role: Role2, c: DiagCell, x: number, z: number, key: string, t: number) => {
  const pos: V3 = {x, y: groundH(x, z), z};
  const toCam = (Math.atan2(view.pos.x - x, -(view.pos.z - z)) * 180) / Math.PI;
  const heading = toCam - c.yaw;
  const look = lookR2(role);
  const base = {key, look, t: DIAG_T + t, seed: 5, dmg: dmgR2(role, DIAG_T)};
  if (c.gait !== undefined) {
    const hv = headingVec(heading);
    const path = [{x: x - hv.x * 6, z: z - hv.z * 6}, {x: x + hv.x * 6, z: z + hv.z * 6}];
    const d0 = 6 - RUN_W.stride * 0.5;
    const g = gaitW(path, d0 + RUN_W.stride * c.gait, RUN_W, groundH);
    return figureSprite({...base, pos: g.pos, heading: g.heading, pose: {...g.pose, ...c.pose, armL: c.pose.armL ?? g.pose.armL, armR: c.pose.armR ?? g.pose.armR, dmg: base.dmg, face: {...DIAG_FACE, mouth: 'pant', brows: -0.3}}, world: {footL: g.footL, footR: g.footR}});
  }
  return figureSprite({...base, pos, heading, pose: {...c.pose, dmg: base.dmg}});
};
const DIAG_Z = -14.3;
const diagCam = (pitch: number, H: number): Cam3 => {
  // fov chosen so a 1.75 m figure is ~0.74 of the band at 9.6 m
  const D = 9.6, chest = 0.15 + 1.2;
  return {pos: {x: 61.6, y: chest + D * Math.tan(rad(pitch)), z: DIAG_Z + D}, target: {x: 61.6, y: 0.15 + 0.9 + (pitch > 20 ? -0.1 : 0), z: DIAG_Z}, fov: 2 * Math.atan(H / 2 / 2200) * 180 / Math.PI};
};
const DiagBand: React.FC<{role: Role2; cells: DiagCell[]; pitch: number; y0: number; band: number; t: number; T: number}> = ({role, cells, pitch, y0, band, t, T}) => {
  const H = 540;
  const view = makeView(diagCam(pitch, H), 1920, H);
  const n = cells.length;
  const span = n > 6 ? 1.05 : 1.62;
  const xs = cells.map((_, i) => 61.6 + (i - (n - 1) / 2) * span);
  const figs = cells.map((c, i) => diagSpec(view, role, c, xs[i], DIAG_Z, `dg${band}_${i}`, t));
  const items: Item[] = [...setItems(view, T, {skip: ['girder', 'wrecks', 'debris']}), ...figs];
  return (
    <svg x={0} y={y0} width={1920} height={H} viewBox={`0 0 1920 ${H}`}>
      <Scene view={view} light={lightFor(T)} mats={MATS} t={T} items={items} />
      {cells.map((c, i) => {
        const sp = project(view, {x: xs[i], y: groundH(xs[i], DIAG_Z), z: DIAG_Z});
        return <g key={i}><rect x={sp.x - 70} y={H - 34} width={140} height={28} rx={6} fill="#000" opacity={0.55} /><text x={sp.x} y={H - 13} fontFamily={FONT.body} fontSize={20} fill="#fff" textAnchor="middle">{c.label}</text></g>;
      })}
    </svg>
  );
};
const DiagStrip: React.FC<{f: number}> = ({f}) => {
  const ri = Math.floor(f / 6) % ROLES2.length, pi = Math.floor(f / 2) % 3, sheet = f % 2;
  const role = ROLES2[ri], pitch = DIAG_PITCH[pi];
  const t = 0;
  const cells = diagCells(role, sheet, t);
  const half = Math.ceil(cells.length / 2);
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: '#222'}}>
      <DiagBand role={role} cells={cells.slice(0, half)} pitch={pitch} y0={0} band={0} t={t} T={DIAG_T} />
      <DiagBand role={role} cells={cells.slice(half)} pitch={pitch} y0={540} band={1} t={t} T={DIAG_T} />
      <rect x={0} y={0} width={760} height={40} fill="#000" opacity={0.6} />
      <text x={14} y={28} fontFamily={FONT.body} fontSize={24} fill="#fff">{`${role} (${ROLE2[role]}) · camera ${pitch > 0 ? '+' : ''}${pitch}° · ${sheet === 0 ? 'turn' : 'actions'} · film light T=${DIAG_T}`}</text>
    </svg>
  );
};
/** Page 16: head close-ups through the turn (frame = role·3 + pitch index), isolated, key light from the left. */
const DiagHeads: React.FC<{f: number}> = ({f}) => {
  const role = ROLES2[Math.floor(f / 3) % ROLES2.length], pitch = DIAG_PITCH[f % 3];
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}}>
      <defs>{DIAG_TURN.map((_, i) => <clipPath key={i} id={`dh${i}`}><rect x={(i % 8) * 240 + 4} y={Math.floor(i / 8) * 520 + 50} width={232} height={440} rx={12} /></clipPath>)}</defs>
      <text x={14} y={34} fontFamily={FONT.body} fontSize={24} fill={C.ink}>{`${role} (${ROLE2[role]}) · head turn · camera ${pitch}°`}</text>
      {DIAG_TURN.map((yaw, i) => {
        const x = (i % 8) * 240 + 120, y = Math.floor(i / 8) * 520 + 50 + 250 + 372 * 1.75;
        const pose = STAND;
        return (
          <g key={i}>
            <g clipPath={`url(#dh${i})`}><Figure look={lookR2(role)} t={0} seed={5} id={`dhf${i}`} x={x} y={y} s={1.75} ink={4.5} yaw={yaw} pitch={pitch} light={LIGHT0} dmg={dmgR2(role, DIAG_T)} {...pose} face={DIAG_FACE} /></g>
            <Label x={x} y={Math.floor(i / 8) * 520 + 515} t={`${yaw}°`} size={20} />
          </g>
        );
      })}
    </svg>
  );
};
/** Page 17: the named expressions (rig/faces.ts) on one cast member (frame = role), three-quarter, close. */
const EXPR_NAMES = Object.keys(FACES) as FaceName[];
const ExprSheet: React.FC<{f: number}> = ({f}) => {
  const role = ROLES2[f % ROLES2.length];
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}}>
      <defs>{EXPR_NAMES.map((_, i) => <clipPath key={i} id={`ex${i}`}><rect x={(i % 8) * 240 + 4} y={Math.floor(i / 8) * 520 + 50} width={232} height={440} rx={12} /></clipPath>)}</defs>
      <text x={14} y={34} fontFamily={FONT.body} fontSize={24} fill={C.ink}>{`${role} (${ROLE2[role]}) · expressions: expr(name) · yaw 25°, camera 4°`}</text>
      {EXPR_NAMES.map((nm, i) => {
        const x = (i % 8) * 240 + 120, y = Math.floor(i / 8) * 520 + 50 + 250 + 372 * 1.75;
        return (
          <g key={nm}>
            <g clipPath={`url(#ex${i})`}><Figure look={lookR2(role)} t={0} seed={5} id={`exf${i}`} x={x} y={y} s={1.75} ink={4.5} yaw={25} pitch={4} light={LIGHT0} dmg={dmgR2(role, 30)} {...STAND} face={{...expr(nm), blink: false}} /></g>
            <Label x={x} y={Math.floor(i / 8) * 520 + 515} t={nm} size={20} />
          </g>
        );
      })}
    </svg>
  );
};
/** Page 18: the death close-up helpers on the Director (deathFace u = 0 … 1, with lastBreath) and gaze (FigSpec.gaze). */
const DeathSheet: React.FC<{f: number}> = () => {
  const us = [0, 0.15, 0.3, 0.45, 0.6, 0.7, 0.8, 0.86, 0.93, 1];
  const look = lookR2('director');
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}}>
      <defs>{us.map((_, i) => <clipPath key={i} id={`ds${i}`}><rect x={i * 190 + 6} y={50} width={180} height={330} rx={12} /></clipPath>)}</defs>
      <text x={14} y={34} fontFamily={FONT.body} fontSize={24} fill={C.ink}>deathFace(u, t) · u = 0 … 1 (lids heavy, focus searching, the final close) · lastBreath chest/mouth</text>
      {us.map((u, i) => {
        const x = i * 190 + 96, y = 50 + 190 + 372 * 1.3;
        const lb = lastBreath(u * 10, 6.5);
        const fc = {...deathFace(u, u * 10 + 1.3, {look: {lookX: -0.5, lookY: 0.1}}), mouth: lb.mouth, open: lb.open};
        return (
          <g key={i}>
            <g clipPath={`url(#ds${i})`}><Figure look={look} t={0} seed={5} id={`dsf${i}`} x={x} y={y} s={1.3} ink={3.6} yaw={30} pitch={8} light={LIGHT0} dmg={dmgR2('director', M.STRIKE + 12)} {...STAND} head={{pitch: 10, roll: 8}} face={fc} chest={lb.chest} /></g>
            <Label x={x} y={400} t={`u ${u.toFixed(2)}`} size={18} />
          </g>
        );
      })}
      <text x={14} y={470} fontFamily={FONT.body} fontSize={24} fill={C.ink}>FigSpec.gaze: the eyes on a world point (the red dot) · gazeLook</text>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
        const x = i * 240 + 120, y = 520 + 200 + 372 * 1.3;
        const r0 = Figure; void r0;
        const pr: FigProps = {look, t: 0, seed: 5, id: `gz${i}`, x, y, s: 1.3, ink: 3.6, yaw: 20, pitch: 4, light: LIGHT0, ...STAND, dmg: dmgR2('director', 30)};
        // a target 1.2 head-heights from the face, around it in the picture plane, a little toward the camera
        const rg = figureParts(pr).rig;
        const tgt = {x: rg.headC.x + Math.cos(rad(a)) * 160, y: rg.headC.y - Math.sin(rad(a)) * 160, z: rg.headC.z + 120};
        const lk = gazeLook(rg, tgt);
        return (
          <g key={`g${i}`}>
            <Figure {...pr} face={{...lk, blink: false}} />
            <circle cx={tgt.x} cy={tgt.y} r={8} fill="#D33" />
          </g>
        );
      })}
    </svg>
  );
};
/** Flat silhouettes: the turn at 0° and +35° pitch, then the actions at 0° (frame = role). */
const DiagSil: React.FC<{f: number}> = ({f}) => {
  const role = ROLES2[f % ROLES2.length];
  const rows: {cells: DiagCell[]; pitch: number}[] = [
    {cells: diagCells(role, 0, 0), pitch: 0}, {cells: diagCells(role, 0, 0), pitch: 35}, {cells: diagCells(role, 1, 0), pitch: 0},
  ];
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}}>
      <text x={14} y={30} fontFamily={FONT.body} fontSize={24} fill={C.ink}>{`${role} (${ROLE2[role]}) · flat silhouettes · turn 0° / turn +35° / actions 0°`}</text>
      {rows.map((row, ri) => row.cells.map((c, i) => {
        const n = row.cells.length, x = 60 + (i + 0.5) * (1800 / n), y = 330 + ri * 345;
        const p = c.pose;
        const run = c.gait !== undefined ? gaitW([{x: 0, z: 6}, {x: 0, z: -6}], 6 - RUN_W.stride * 0.5 + RUN_W.stride * c.gait, RUN_W, () => 0) : null;
        const loc = (q: V3) => ({r: (q.x - run!.pos.x) * 251.4, u: q.y * 251.4 + 10, f: -(q.z - run!.pos.z) * 251.4});
        const legs: Pose = run ? {legL: {...run.pose.legL, local: loc(run.footL)}, legR: {...run.pose.legR, local: loc(run.footR)}} : {};
        const pose = run ? {...run.pose, ...p, armL: p.armL ?? run.pose.armL, armR: p.armR ?? run.pose.armR, ...legs} : p;
        return <g key={`${ri}_${i}`}><Figure look={lookR2(role)} t={0} seed={5} id={`sl${ri}_${i}`} x={x} y={y} s={0.62} ink={2} yaw={c.yaw} pitch={row.pitch} silhouette="#1E2328" shadow={0} dmg={dmgR2(role, DIAG_T)} {...pose} /><Label x={x} y={y + 22} t={c.label} size={14} /></g>;
      }))}
    </svg>
  );
};
