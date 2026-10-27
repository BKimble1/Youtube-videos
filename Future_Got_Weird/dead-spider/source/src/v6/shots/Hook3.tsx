// V4 HOOK (0 - 4.52): one continuous pressure-driven action, built to prove the idea in the first second.
//  0.00  a curled dead wolf spider, big, on a dark lab mat; the syringe's needle is already coming down onto it
//  0.00  the camera travels down along the needle toward the body; the needle punctures the front body section at
//        0.22 s with a small shudder
//  0.36  air: the stopper drives down, a pale slug runs down the needle; three legs snap open, the rest a beat later
//  1.05  the camera drops to a low angle: the legs hook down, gripping at nothing below them
//  2.00  out and up to the whole apparatus: the spider hangs from the needle of a syringe clamped in a stand; the
//        finger pushes, the legs answer, and ease back as the push is let off
//  3.00  in toward the spider; on "MOVE" the full push snaps every leg to its widest; the camera closes on one leg
//        (matched, at 4.52, by the same leg of a living spider)
import React from 'react';
import {INK} from '../../dc/ink';
import {Item} from '../../draw3';
import {clamp, keyS, ss5} from '../../lib';
import {LOOK_A, spiderItems} from '../../SpiderDraw';
import {legLocal, SpiderPose, toWorld} from '../../spider';
import {add3, Basis, lerp3, lerpOrbit, Orbit, orbitCam, P2, proj, projPoly, V3} from '../../three';
import {PressHand, Scene} from '../../shots/common';
import {AIR_C, hubTopOf, needle1Items, standItems2, syr1, syringe1Items} from '../../v2/claw';
import {entryOf, H_NEEDLE, H_PLUNGER, H_PRESS, H_ROD, HOOK_LEG, hookPose, MAT_Z} from '../world3';

const legPt = (P: SpiderPose, k: number) => toWorld(P, legLocal(HOOK_LEG, P.e[HOOK_LEG], 0)[k]);
/** down the needle: high, nearly along its axis */
const C0 = (P: SpiderPose): Orbit => ({target: add3(entryOf(P), [0, 0, 3]), az: -18, el: 66, d: 86, f: 5400, cy: 880});
const C0b = (P: SpiderPose): Orbit => ({target: add3(P.pos, [-0.8, 0, 0.6]), az: -22, el: 54, d: 74, f: 5400, cy: 1000});
/** easing back as the legs spread */
const C1 = (P: SpiderPose): Orbit => ({target: add3(P.pos, [-1.2, 0, -0.6]), az: -26, el: 44, d: 104, f: 5400, cy: 910});
/** low, looking up at the legs hooking down */
const C2 = (P: SpiderPose): Orbit => ({target: add3(P.pos, [-0.8, 0, -1.6]), az: -46, el: 3, d: 70, f: 5400, cy: 1000});
const C2b = (P: SpiderPose): Orbit => ({...C2(P), az: -60, d: 64, cy: 940});
/** the whole apparatus */
const C3 = (P: SpiderPose): Orbit => ({target: add3(P.pos, [0, 0, 22]), az: -38, el: -12, d: 88, f: 1750, cy: 700});
/** back in on the spider, then onto the matched leg */
const C4 = (P: SpiderPose): Orbit => ({target: add3(P.pos, [-1.4, 0, -1.8]), az: -32, el: 12, d: 80, f: 5400, cy: 880});
const C5 = (P: SpiderPose): Orbit => ({target: lerp3(legPt(P, 2), legPt(P, 4), 0.5), az: -40, el: 10, d: 58, f: 5400, cy: 870});
export const camHook3 = (t: number) => {
  const P = hookPose(t);
  let o: Orbit;
  if (t < 0.36) o = lerpOrbit(C0(P), C0b(P), ss5(t, 0, 0.36));
  else if (t < 1.05) o = lerpOrbit(C0b(P), C1(P), ss5(t, 0.36, 1.0));
  else if (t < 2.0) o = lerpOrbit(lerpOrbit(C1(P), C2(P), ss5(t, 1.05, 1.45)), C2b(P), ss5(t, 1.45, 2.0));
  else if (t < 3.0) o = lerpOrbit(C2b(P), C3(P), ss5(t, 2.0, 2.45));
  else if (t < 3.8) o = lerpOrbit(C3(P), C4(P), ss5(t, 3.0, 3.48));
  else o = lerpOrbit(C4(P), C5(P), ss5(t, 3.8, 4.52));
  return orbitCam(o);
};

/** the dark lab mat: a self-healing cutting mat with a fine grid and a ruler edge, on the bench */
export const DarkMat: React.FC<{B: Basis; c: V3; half: number; z: number}> = ({B, c, half, z}) => {
  const pts = (x0: number, x1: number, y0: number, y1: number): V3[] => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];
  const lines: React.ReactNode[] = [];
  for (let k = -half; k <= half; k += 5) {
    const major = k % 25 === 0;
    lines.push(<path key={`x${k}`} d={`M${P2(proj(B, [c[0] + k, c[1] - half, z]))} L${P2(proj(B, [c[0] + k, c[1] + half, z]))}`} stroke={major ? '#6F8C86' : '#4E6662'} strokeWidth={major ? 1.6 : 0.9} opacity={0.7} />);
    lines.push(<path key={`y${k}`} d={`M${P2(proj(B, [c[0] - half, c[1] + k, z]))} L${P2(proj(B, [c[0] + half, c[1] + k, z]))}`} stroke={major ? '#6F8C86' : '#4E6662'} strokeWidth={major ? 1.6 : 0.9} opacity={0.7} />);
  }
  return (
    <g>
      <path d={projPoly(B, pts(c[0] - half - 0.6, c[0] + half + 0.6, c[1] - half - 0.6, c[1] + half + 0.6).map((p) => [p[0], p[1], z - 1.5] as V3))} fill="#23302F" />
      <path d={projPoly(B, pts(c[0] - half, c[0] + half, c[1] - half, c[1] + half))} fill="#2F4140" stroke={INK} strokeWidth={1.5} />
      {lines}
    </g>
  );
};

export const Hook3: React.FC<{t: number}> = ({t}) => {
  const cam = camHook3(t);
  const P = hookPose(t);
  const entry = entryOf(P);
  const tipAbove = H_NEEDLE(t);
  const hub = hubTopOf(entry, tipAbove);
  const press = H_PRESS(t);
  const plunger = H_PLUNGER(t);
  const g = syr1(hub, plunger);
  const p1 = (t - 0.36) / 0.18, p2 = (t - 2.2) / 0.16, p3 = (t - 3.42) / 0.14;
  const pulse = p1 > 0 && p1 < 1.15 ? p1 : p2 > 0 && p2 < 1.15 ? p2 : p3 > 0 && p3 < 1.15 ? p3 : undefined;
  const finger = keyS(t, [[0, 1], [2.0, 1], [2.16, 0], [2.66, 0], [2.8, 0.6], [3.3, 0.6], [3.42, 0]]);
  return (
    <Scene
      id={`H${Math.round(t * 30)}`}
      cam={cam}
      bg="#1A2426"
      back={() => (
        <g>
          <defs>
            <radialGradient id="hbg" cx="540" cy="700" r="1400" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#33454A" />
              <stop offset="1" stopColor="#141C1E" />
            </radialGradient>
          </defs>
          <rect width={1080} height={1920} fill="url(#hbg)" />
        </g>
      )}
      floor={(B) => (
        <>
          <DarkMat B={B} c={[0, 0, 0]} half={90} z={MAT_Z} />
          <ShadowOn B={B} P={P} z={MAT_Z} />
        </>
      )}
      items={(B) => {
        const it: Item[] = [];
        it.push(...spiderItems(B, P, LOOK_A, {id: 'sh', occlusion: true}));
        it.push(...needle1Items(B, entry, tipAbove, 0));
        it.push(...syringe1Items(B, hub, plunger, {air: press, pulse, needleTip: entry}));
        it.push(...standItems2(B, H_ROD, g.clampAt, -70, 200));
        return it;
      }}
      over={(B) => {
        const Tr = proj(B, g.thumb), N = proj(B, g.nozzle0);
        // the operator's finger on the plunger, only while the whole apparatus is in view
        if (t < 2.0 || t > 3.45) return <ChamberGlow B={B} P={P} k={press * (t > 0.4 && t < 1.4 ? 1 : 0)} />;
        return <PressHand id="Hph" rest={{x: Tr.x, y: Tr.y}} down={{x: N.x - Tr.x, y: N.y - Tr.y}} L={128 * Tr.s} lift={finger} gap={0.058} />;
      }}
    />
  );
};
/** a soft shadow under the spider on the mat; it grows with the legs and softens as the spider is lifted */
const ShadowOn: React.FC<{B: Basis; P: SpiderPose; z: number}> = ({B, P, z}) => {
  const c = proj(B, [P.pos[0] - 1.6, P.pos[1] + 0.5, z]);
  const k = clamp(P.e.reduce((a, b) => a + b, 0) / 8);
  const h = P.pos[2] - z;
  const rx = (5.6 + 5 * k) * c.s, ry = (4.2 + 3.6 * k) * c.s;
  return (
    <g opacity={0.5 - 0.2 * clamp((h - 2) / 6)}>
      <defs>
        <radialGradient id="hsh">
          <stop offset="0" stopColor="#000" stopOpacity={0.8} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} rx={rx.toFixed(1)} ry={ry.toFixed(1)} fill="url(#hsh)" />
    </g>
  );
};
/** the air arriving in the chamber: a faint pulsing glow over the section, nothing more */
const ChamberGlow: React.FC<{B: Basis; P: SpiderPose; k: number}> = ({B, P, k}) => {
  if (k < 0.02) return null;
  const q = proj(B, toWorld(P, [0.1, 0, 0.3]));
  return (
    <g opacity={0.45 * k}>
      <defs>
        <radialGradient id="hcg">
          <stop offset="0" stopColor={AIR_C} stopOpacity={0.9} />
          <stop offset="1" stopColor={AIR_C} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={q.x.toFixed(1)} cy={q.y.toFixed(1)} rx={(2.6 * q.s).toFixed(1)} ry={(2.1 * q.s).toFixed(1)} fill="url(#hcg)" />
    </g>
  );
};
