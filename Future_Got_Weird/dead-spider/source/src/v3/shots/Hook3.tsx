// V3 HOOK (0 - 4.52): one continuous, pressure-driven action.
//  0.00  tight on a big curled dead wolf spider on a dark lab mat; a slender needle is already coming in
//  0.20  the needle punctures the top of the front body section: a quick shudder runs through the body
//  0.40  air: a pale pulse runs down the needle; three legs snap open first, the rest a beat later
//  0.75  the camera eases back and to the side: the silhouette widens; the body hangs limp on the needle
//  1.10  the camera closes on the front body section, the needle and its entry point in view
//  1.65  through the entry point: the specimen opens into a section, the chamber fills with air and the pulse runs
//        out along the legs
//  2.35  following the pressure to one leg's hinge: the joint membrane swells and the hinge straightens, and the
//        camera rides out along the leg as it straightens
//  3.30  out to a low three-quarter view of the whole dead spider; on "MOVE" the full push snaps every leg wide open
import React from 'react';
import {INK} from '../../dc/ink';
import {Item} from '../../draw3';
import {clamp, keyS, lerp, ss, ss5} from '../../lib';
import {LOOK_A, spiderItems} from '../../SpiderDraw';
import {legLocal, SpiderPose, toWorld} from '../../spider';
import {add3, Basis, lerp3, lerpOrbit, Orbit, orbitCam, P2, proj, projPoly, V3} from '../../three';
import {JointDetail} from '../../shots/C';
import {Scene} from '../../shots/common';
import {AIR_C, hubTopOf, needle1Items, syringe1Items} from '../../v2/claw';
import {entryOf, H_NEEDLE, H_PRESS, H_SECTION, HOOK_LEG, hookPose, MAT_Z} from '../world3';

const jointOf = (P: SpiderPose, k: number) => toWorld(P, legLocal(HOOK_LEG, P.e[HOOK_LEG], 0)[k]);
const K0 = (P: SpiderPose): Orbit => ({target: add3(P.pos, [-1.2, 0, 0.3]), az: -24, el: 46, d: 76, f: 5400, cy: 1060});
const K1 = (P: SpiderPose): Orbit => ({target: add3(P.pos, [-1.6, 0, -0.6]), az: -4, el: 38, d: 112, f: 5400, cy: 980});
const K2 = (P: SpiderPose): Orbit => ({target: entryOf(P), az: -14, el: 50, d: 70, f: 5400, cy: 860});
const K3 = (P: SpiderPose): Orbit => ({target: add3(P.pos, [0.2, 0, 0.2]), az: -8, el: 56, d: 56, f: 5400, cy: 800});
const K4 = (P: SpiderPose, u: number): Orbit => ({target: lerp3(jointOf(P, 2), jointOf(P, 4), u), az: 6, el: 38, d: 46, f: 5400, cy: 790});
const K5 = (P: SpiderPose): Orbit => ({target: add3(P.pos, [-1.6, 0, -2.2]), az: -30, el: 11, d: 84, f: 5400, cy: 1000});
export const camHook3 = (t: number) => {
  const P = hookPose(t);
  let o: Orbit;
  if (t < 1.1) o = lerpOrbit(K0(P), K1(P), ss5(t, 0.6, 1.1));
  else if (t < 1.65) o = lerpOrbit(K1(P), K2(P), ss5(t, 1.1, 1.68));
  else if (t < 2.35) o = lerpOrbit(K2(P), K3(P), ss5(t, 1.65, 2.35));
  else if (t < 3.22) o = lerpOrbit(K3(P), K4(P, ss5(t, 2.85, 3.22)), ss5(t, 2.2, 3.05));
  else o = lerpOrbit(K4(P, 1), K5(P), ss5(t, 3.22, 3.72));
  return orbitCam(o!);
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
  const sec = H_SECTION(t);
  const press = H_PRESS(t);
  const pulse = (t - 0.4) / 0.16;
  const flow = t > 1.8 && t < 3.4 ? (t - 1.8) * 3.2 : undefined;
  return (
    <Scene
      id={`H${Math.round(t * 30)}`}
      cam={cam}
      bg="#1A2426"
      back={(B) => (
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
          {sec > 0.01 && <rect width={1080} height={1920} fill="#0E1719" opacity={0.86 * sec} />}
        </>
      )}
      items={(B) => {
        const it: Item[] = [];
        it.push(...spiderItems(B, P, LOOK_A, {id: 'sh', cut: sec > 0.01 ? {fluid: AIR_C, core: 0.62 * sec * (0.55 + 0.45 * press), flow, squeeze: 0, dim: 0, muscles: false, chamber: sec * ss(t, 1.7, 2.15)} : undefined}));
        it.push(...needle1Items(B, entry, tipAbove, 0));
        it.push(...syringe1Items(B, hub, 0.55 + 0.3 * ss(t, 0.38, 0.58), {air: press, pulse: pulse > 0 && pulse < 1.15 ? pulse : undefined, needleTip: entry}));
        return it;
      }}
      over={(B) => (
        <>
          <JointDetail B={B} P={P} pr={keyS(t, [[0, 0.3], [2.4, 0.3], [2.85, 1]])} live={1} op={clamp(sec * ss(t, 2.3, 2.6) * (1 - ss(t, 3.2, 3.45)))} leg={HOOK_LEG} color={AIR_C} />
          <ChamberGlow B={B} P={P} k={sec * ss(t, 1.75, 2.1) * (0.6 + 0.4 * Math.sin(Math.max(0, t - 1.75) * 9) ** 2)} />
        </>
      )}
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
void lerp;
