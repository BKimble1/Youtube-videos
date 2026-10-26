// S10 (17.90-20.60 s) "They've demonstrated this on laboratory targets." The target side. It opens close on the injector
// where S09 left it (same embed height and angle, needle pointing screen-left into the silicone), seen from beside the
// target, with the silicone block, its cradle and the injector barrel cut open at z = 0 (rig/Section.tsx). An explanatory,
// visibly time-compressed delivery follows (about 18.1-19.2 s): the seal of the small activator chamber in the plunger
// opens, fine gas bubbles form behind the plunger, the plunger advances, the amber dose runs through the needle's bore and
// blooms into the translucent silicone as a soft cloud. On "laboratory" one eased pull-back (rising and swinging round to
// the front-left) shows the artificial set-up: the aluminium cradle with its screws and base plate on the grid mat, the
// injector in the silicone and the medic insect waiting a few centimetres away; early in the move the cutaway dissolves
// into the normal exterior (a full-frame crossfade of two renders of the same camera, so nothing pops).
import React from 'react';
import {lookAt, proj, scaleAt, Cam} from '../lib/cam';
import {V3, V2, add, lerp3, toW} from '../lib/v3';
import {clamp, lerp, ramp, sr} from '../lib/ease';
import {Roach} from '../rig/Roach';
import {Injector} from '../rig/Gear';
import {NEEDLE_TIP, EMBED} from '../rig/launch';
import {LabBackdrop, ArenaFloor, TargetFixture} from '../sets/Lab';
import {arenaWalls} from '../sets/LabRoom';
import {FixtureShadow} from './S01';
import {s09Pose, S09_EMBED_FRAME, S09_T_CUT} from './S09';
import {PackBase, TubeExterior, SectionInjector, DoseCloud, FixtureSection, silClipId, Delivery} from '../rig/Section';
import {fmt, polyPath} from '../lib/g3';
import {ShotProps} from './index';
import {FPS, word} from '../timeline';

const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------------------------------------------
// Timing (from the narration)
// ---------------------------------------------------------------------------------------------------------------
const T_SEAL = word("they've", 0).start; // 18.14: the seal opens as the line begins
const T_PULL0 = word('laboratory', 0).start; // 19.16: the pull-back starts on "laboratory"
const T_PULL1 = word('targets', 0).end + 0.3; // 20.50: and settles just after "targets"

/** the time-compressed delivery */
export const s10Delivery = (t: number): Delivery => ({
  seal: sr(t, T_SEAL, T_SEAL + 0.13),
  fizz: ramp(t, T_SEAL + 0.04, T_SEAL + 0.16) * (1 - 0.7 * sr(t, 19.1, 19.6)),
  gas: sr(t, T_SEAL + 0.1, 19.08),
  plunger: 0.95 * sr(t, T_SEAL + 0.16, 19.1),
  flow: ramp(t, T_SEAL + 0.24, T_SEAL + 0.34) * (1 - 0.0),
  cloud: 0.9 * sr(t, T_SEAL + 0.3, 19.2) + 0.1 * sr(t, 19.2, 20.4),
  t,
});

// ---------------------------------------------------------------------------------------------------------------
// Camera: an orbit about a pivot; one eased move from the close side view to the front-left, higher and wider
// ---------------------------------------------------------------------------------------------------------------
const F = 3200;
const A = {piv: [2.5, 27, 0] as V3, phi: -5 * DEG, el: 3 * DEG, R: 118, cy: 870};
const B = {piv: [27, 17, 0] as V3, phi: 30 * DEG, el: 19 * DEG, R: 470, cy: 900};
export const s10Cam = (t: number): Cam => {
  const k = sr(t, T_PULL0, T_PULL1);
  const piv = lerp3(A.piv, B.piv, k);
  const phi = lerp(A.phi, B.phi, k), el = lerp(A.el, B.el, k), R = A.R * Math.pow(B.R / A.R, k);
  const eye: V3 = add(piv, [R * Math.cos(el) * Math.sin(phi), R * Math.sin(el), R * Math.cos(el) * Math.cos(phi)]);
  return lookAt(eye, piv, F, 540, lerp(A.cy, B.cy, k));
};
/** cutaway visibility: full until the pull-back is under way, then dissolved into the exterior */
const sectionAt = (t: number) => 1 - sr(t, T_PULL0 + 0.14, T_PULL0 + 0.62);

// ---------------------------------------------------------------------------------------------------------------
const Background: React.FC<{id: string; cam: Cam}> = ({id, cam}) => (
  <g>
    <LabBackdrop id={`${id}b`} cam={cam} blur={16} />
    <ArenaFloor id={`${id}f`} cam={cam} />
    <FixtureShadow cam={cam} />
    {arenaWalls(cam, {skip: ['s', 'e']}).sort((a, b) => b.z - a.z).map((w) => w.el)}
  </g>
);

/** the target and the injector from outside: the dose shows faintly through the translucent silicone */
const Exterior: React.FC<{id: string; cam: Cam; d: Delivery}> = ({id, cam, d}) => {
  const inj = S09_EMBED_FRAME;
  const face = [[0.05, 13, -19.5], [0.05, 13, 19.5], [0.05, 47, 19.5], [0.05, 47, -19.5]].map((p) => proj(cam, p as V3));
  const faceVis = cam.eye[0] > 0;
  const entry: V2[] = Array.from({length: 24}, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return proj(cam, [0.08, inj.o[1] + 1.1 * Math.sin(a), inj.o[2] + 1.1 * Math.cos(a)]);
  });
  return (
    <g>
      <Background id={id} cam={cam} />
      <TargetFixture id={`${id}t`} cam={cam} />
      {faceVis && (
        <g>
          <defs>
            <clipPath id={`${id}-face`}>
              <path d={polyPath(face)} />
            </clipPath>
          </defs>
          <DoseCloud id={`${id}dc`} cam={cam} f={inj} c={d.cloud} alpha={0.42} clip={`url(#${id}-face)`} />
          <path d={polyPath(entry)} fill="#B9705C" opacity={0.55} />
        </g>
      )}
      <Injector id={`${id}i`} cam={cam} s={{f: inj, plunger: d.plunger, needleEnd: NEEDLE_TIP - EMBED}} />
    </g>
  );
};

/** the cutaway: the cradle, silicone and injector cut at z = 0 */
const Cutaway: React.FC<{id: string; cam: Cam; d: Delivery}> = ({id, cam, d}) => (
  <g>
    <Background id={id} cam={cam} />
    <FixtureSection id={`${id}x`} cam={cam} />
    <DoseCloud id={`${id}dc`} cam={cam} f={S09_EMBED_FRAME} c={d.cloud} clip={silClipId(`${id}x`)} />
    <SectionInjector id={`${id}si`} cam={cam} f={S09_EMBED_FRAME} d={d} />
  </g>
);

export const S10: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS;
  const cam = s10Cam(t);
  const d = s10Delivery(t);
  const sec = sectionAt(t);
  const pose = s09Pose(t);
  const gear = (
    <g>
      <PackBase cam={cam} f={pose.frame} part="back" />
      <TubeExterior id="s10tx" cam={cam} f={pose.frame} cutT={t - S09_T_CUT} />
      <PackBase cam={cam} f={pose.frame} part="front" />
    </g>
  );
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {sec < 1 && <Exterior id="s10e" cam={cam} d={d} />}
      {sec > 0 && (
        <g opacity={sec < 1 ? fmt(sec) : undefined}>
          <Cutaway id="s10c" cam={cam} d={d} />
        </g>
      )}
      <Roach pose={pose} cam={cam} o={{id: 's10r', gear}} />
    </svg>
  );
};

