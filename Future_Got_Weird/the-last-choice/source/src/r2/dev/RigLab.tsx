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
import {V3, add3, mul3, lerp, clamp, smooth, rad, lerp3, easeOut, easeInOut} from '../../kit/math';
import {Scene, Item, makeView, Cam3, headingVec, mixCam3} from '../engine';
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
  const handR = keyV([[0, add3(palmR, {x: 0, y: 0.25, z: 0})], [0.8, palmR], [3.0, palmR], [3.9, add3(kneeL, mul3(headingVec(H0), 0.03))], [4.9, add3(kneeL, {x: 0, y: 0.05, z: 0})], [6.0, bod3(pos, H0, 0.15, 0.48, 0.95)], [7.2, bod3(pos, H0, 0.22, 0.34, 0.8)], [9.5, bod3(pos, 90, 0.25, 0.34, 0.8)]], u);
  const handL = keyV([[0, at3(pos, H0, 0.2, -0.24, 0.05)], [0.9, palmL], [2.4, palmL], [3.6, bod3(pos, H0, 0.32, 0.02, 0.9)], [7.2, bod3(pos, H0, 0.3, 0.04, 1.0)], [9.5, bod3(pos, 90, 0.32, 0.02, 1.0)]], u);
  const footL = keyV([[0, at3(pos, H0, -0.62, -0.14, 0.05)], [1.3, at3(pos, H0, -0.6, -0.14, 0.05)], [2.6, at3(pos, H0, 0.08, -0.15, 0.02)], [3.8, at3(pos, H0, 0.3, -0.15, 0.02)], [6.2, at3(pos, H0, 0.3, -0.15, 0.02)], [7.2, at3(pos, H0, 0.2, -0.18, 0.02)], [8.4, at3(pos, 120, 0.2, -0.18, 0.02)], [9.2, at3(pos, 90, 0.2, -0.18, 0.02)]], u);
  const footR = keyV([[0, at3(pos, H0, -0.64, 0.14, 0.05)], [1.3, at3(pos, H0, -0.62, 0.14, 0.05)], [2.6, at3(pos, H0, -0.5, 0.13, 0.08)], [3.8, at3(pos, H0, -0.44, 0.14, 0.1)], [5.0, at3(pos, H0, -0.4, 0.15, 0.08)], [6.0, at3(pos, H0, 0.02, 0.17, 0.02)], [7.2, at3(pos, H0, -0.08, 0.18, 0.02)], [7.9, at3(pos, 110, -0.08, 0.2, 0.02)], [8.8, at3(pos, 90, -0.08, 0.18, 0.02)]], u);
  const pose = keyPose(RISE_KEYS, u);
  const T = M.SOLO + u;
  return {pos, heading, handR, handL, footL, footR, pose, T};
};

const sceneFor = (view: ReturnType<typeof makeView>, T: number, figs: Item[], o: {atmos?: boolean} = {}) => (
  <Scene view={view} light={lightFor(T)} mats={MATS} t={T} items={[...setItems(view, T), ...(o.atmos === false ? [] : atmosItems(view, T)), ...figs]} />
);

export const RigLab: React.FC<{page?: number}> = ({page = 0}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  if (page <= 6) {
    const role = ROLES2[page];
    const look = CAST[ROLE2[role]];
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}}>
        <text x={40} y={60} fontFamily={FONT.display} fontSize={34} fill={C.ink}>{`R2 model sheet · ${role} (${ROLE2[role]})`}</text>
        {sheetPoses.map((q, i) => {
          const col = i % 5, row = Math.floor(i / 5);
          const x = 200 + col * 380, y = 480 + row * 470;
          return (
            <g key={i}>
              <Figure look={look} t={t} seed={3 + i} id={`ms${i}`} x={x} y={y} s={0.82} ink={3.4} light={LIGHT0} dmg={dmgR2(role, 30)} {...q.p} />
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
      world: {handL: R.handL, handR: R.handR, footL: R.footL, footR: R.footR},
    });
    // camera: low, three-quarter front, slowly rising with him; ends behind his right shoulder as he turns east
    const fwd = headingVec(RISE_HEAD), right = headingVec(RISE_HEAD + 90);
    const CS = (globalThis as {RIG_CAM?: number}).RIG_CAM ?? 1;
    const side = CS === 1 ? -1 : 1;
    const c0: Cam3 = {pos: add3(R.pos, {x: fwd.x * 1.1 + right.x * 2.5 * side, y: 0.55, z: fwd.z * 1.1 + right.z * 2.5 * side}), target: add3(R.pos, {x: fwd.x * 0.35, y: 0.2, z: fwd.z * 0.35}), fov: 44};
    const c1: Cam3 = {pos: add3(R.pos, {x: fwd.x * 1.4 + right.x * 3.0 * side, y: 0.8, z: fwd.z * 1.4 + right.z * 3.0 * side}), target: add3(R.pos, {x: fwd.x * 0.1, y: 1.0, z: fwd.z * 0.1}), fov: 44};
    const c2: Cam3 = {pos: add3(R.pos, {x: -2.4, y: 1.0, z: 1.6}), target: add3(R.pos, {x: 6, y: 0.6, z: -1}), fov: 46};
    const cam = u < 7.6 ? mixCam3(c0, c1, smooth(u / 7)) : mixCam3(c1, c2, smooth((u - 7.6) / 1.6));
    const view = makeView(cam);
    return sceneFor(view, R.T, [fig]);
  }
  if (page === 9) {
    // contact proof: the runner (guesser) knocked back, caught by the breaker (honest) — world-targeted hands on his back
    const T = M.CATCH;
    const base: V3 = {x: 46, y: 0, z: 6};
    const k = clamp(t / 2.2);
    const fallK = clamp(k * 1.25);
    const catcherPos: V3 = {x: base.x - 1.0, y: groundH(base.x - 1.0, base.z), z: base.z};
    const runnerPos0: V3 = {x: base.x + 0.6, y: groundH(base.x + 0.6, base.z), z: base.z};
    const runnerPos = lerp3(runnerPos0, {x: base.x - 0.35, y: groundH(base.x - 0.35, base.z), z: base.z}, easeOut(fallK));
    const runnerPose: Pose = keyPose([[0, STAND], [0.2, KNOCKED_BACK(0.15)], [0.7, layer(KNOCKED_BACK(0.38), {drop: 40})], [1, layer(KNOCKED_BACK(0.38), {drop: 50, bodyPitch: -32})]], fallK);
    const runnerSpec = {key: 'run', look: lookR2('runner'), t: T + t, seed: 4, pos: runnerPos, heading: 90, pose: {...runnerPose, dmg: dmgR2('runner', T + 2), holdR: halligan1({ang: 70})}};
    const view = makeView({pos: {x: base.x + 0.4, y: 1.3, z: base.z + 4.6}, target: {x: base.x - 0.3, y: 1.0, z: base.z}, fov: 40});
    const rr = figureRig(view, runnerSpec);
    const back = rr.chest; // the faller's chest/back — the catcher's hands go to his shoulder blades
    const hR = add3(back, {x: -0.18, y: 0.05, z: -0.14}), hL = add3(back, {x: -0.16, y: -0.12, z: 0.16});
    const catchW = clamp((t - 0.55) / 0.35);
    const catcher = figureSprite({key: 'cat', look: lookR2('breaker'), t: T + t, seed: 7, pos: catcherPos, heading: 90, pose: layer(CATCH_BODY, {dmg: dmgR2('breaker', T)}),
      world: catchW > 0 ? {handR: lerp3(add3(catcherPos, {x: 0.35, y: 1.15, z: 0.25}), hR, catchW), handL: lerp3(add3(catcherPos, {x: 0.35, y: 1.15, z: -0.25}), hL, catchW)} : undefined});
    // hand on the shoulder (right side of the frame): the drone pilot's hand on the Director's left shoulder
    const dPos: V3 = {x: base.x + 2.4, y: groundH(base.x + 2.4, base.z - 1.4), z: base.z - 1.4};
    const dSpec = {key: 'dir', look: lookR2('director'), t: T + t, seed: 11, pos: dPos, heading: 80, pose: {...BRACED({wide: 0.7}), handL: 'fist' as const, wearL: plateWear('dented'), dmg: dmgR2('director', T)}};
    const dr = figureRig(view, dSpec);
    const shoulder = add3(dr.rig ? dr.head : dPos, {x: -0.05, y: -0.34, z: 0.22});
    const pPos: V3 = {x: dPos.x - 0.55, y: groundH(dPos.x - 0.55, dPos.z + 0.55), z: dPos.z + 0.55};
    const reach = smooth(clamp((t - 0.6) / 0.6));
    const pilot = figureSprite({key: 'pil', look: lookR2('drone'), t: T + t, seed: 5, pos: pPos, heading: 70, pose: {...REACH_SHOULDER, extra: controller(), handL: 'grip', dmg: dmgR2('drone', T)},
      world: {handR: lerp3(add3(pPos, {x: 0.3, y: 1.0, z: 0.2}), shoulder, reach)}});
    return sceneFor(view, T, [figureSprite(runnerSpec), catcher, figureSprite(dSpec), pilot], {atmos: false});
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
    const look = lookR2('director');
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}}>
        <text x={40} y={60} fontFamily={FONT.display} fontSize={34} fill={C.ink}>R2 pitch check · camera −20° / 0° / +35° · yaw 0 / 40 / 120</text>
        {[-20, 0, 35].map((pitch, i) => [0, 40, 120].map((yaw, j) => {
          const x = 220 + (i * 3 + j) * 190, y = 620;
          return <g key={`${i}${j}`}><Figure look={look} t={t} id={`pc${i}${j}`} x={x} y={y} s={0.62} ink={3} pitch={pitch} yaw={yaw} light={LIGHT0} wearL={plateWear('dented')} {...BRACED()} dmg={dmgR2('director', 100)} /><Label x={x} y={y + 60} t={`${pitch}° / ${yaw}°`} size={18} /></g>;
        }))}
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
      {role: 'flares', label: 'flare / canister (throw)', p: {...THROW(k), yaw: 50, holdR: k < 0.6 ? flare({lit: 1, t}) : undefined, holdL: canister()}},
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
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: BG}} />;
};
void rad; void STAND;
