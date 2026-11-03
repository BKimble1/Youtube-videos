// V2 test sheet for B4: the positioning probe, the applicator (with lift) and the surgeon's hands (art/instruments.tsx,
// art/surgeon.tsx). Each state is drawn through the camera Layer system as the film does: room z +600, hand table
// z +40, SurgeonBack z -6, the inside of the wrist z 0 (deep tissue, skeleton, a FLAT STAND-IN of the V2 fracture from
// seams.ts, and the instruments' contact shadows ProbeShadow / AppShadow with the UNPROJECTED states), skin
// z -0.7*BONE_DEPTH, SurgeonFront z -6. Instrument tips are given in the wrist plane and reprojected to the instrument
// layer as Scene.tsx does.
// States: a1/a2 opening close-up (probe pressing the wedge / lifted), b wrist reveal, c1/c2 the styloid stroke and the
// applicator lifted, d1-d4 fixation release at seams.STYLOID_PRESS (lift 0 / .5 / 1, then withdrawing), r0/r5/r1 the
// same release at a press point inside the window (staging suggestion), e/e2 wide (hands in / withdrawing), w4/w5 the
// clinic framing (in / almost fully withdrawn), h/hl/hr hand close-ups.
// A key 't<seconds>' (e.g. 't15.9') draws that film moment from story.ts (camera, instruments, wedge, glue) with this
// sheet's stand-in fracture, the shadows given the instruments' withdrawal (probeOn / appOn); 't<seconds>@x,y,w' draws
// the same moment through another camera (e.g. 't3.8@95,-50,190': the far hand just beyond REVEAL's right edge). A key 'o<opt>_<shot>'
// (e.g. 'oL_rv') draws a staging option for the styloid hold (OPTS below).
// Props: st = a state key for one full-size frame, or 'sheet' with ks (keys) and cols; off = ['back'|'front'|'shadow']
// to skip a part (debugging). Compositions: Surgeon2 (1080x1920; a 'sheet' here fits 3 x 3) and Sheet2 (1080x1440).
//   npx remotion still src/test/surgeon2.entry.tsx Surgeon2 out.png --props='{"st":"sheet","ks":["a1","b","e"],"cols":3}'
import React from 'react';
import {Composition, registerRoot, AbsoluteFill} from 'remotion';
import {Cam, Layer, layerScale} from '../camera';
import {P, pt, closed, open} from '../core/geo';
import {resetIds} from '../core/ids';
import {SurgeonBack, SurgeonFront, SURGEON_DEFAULT} from '../art/surgeon';
import {AppShadow, ProbeShadow, INSTR_Z} from '../art/instruments';
import {RoomBack, HandTable, DrapeOverArm} from '../art/room';
import {ArmSkin, DeepTissue, IncisionRim, ArmState, armOutlinePath} from '../art/arm';
import {Skeleton} from '../art/skeleton';
import {BONE_DEPTH, RADIUS} from '../art/anatomy';
import {C, INK} from '../art/palette';
import {InstrState2} from '../v2state';
import {camAt, instrAt, wedgeAt, boneAt} from '../story';
import {SEAM_IDS, SeamId, WEDGE_OUT, WEDGE_POLY, WEDGE_SEATED, WedgeX, glueBand, seamEdgeLine, seamLength, seamNearest, seamPoint, xfSvg, xfPoint, STYLOID_PRESS, WEDGE_PRESS, PROBE_ANG_W, PROBE_ANG_S} from '../art/seams';

const Z_SKIN = -0.7 * BONE_DEPTH, Z_INSTR = INSTR_Z, Z_TABLE = 40, Z_ROOM = 600;
const reproject = (c: Cam, p: P, z: number): P => {
  const r = layerScale(c, 0) / layerScale(c, z);
  return pt(c.x + (p.x - c.x) * r, c.y + (p.y - c.y) * r);
};

// ---------------------------------------------------------------- a flat stand-in of the V2 fracture (context only)
const RAD = closed(RADIUS, 0.55);
type Glue = Partial<Record<SeamId, [number, number]>>;
const FractureStandIn: React.FC<{id: string; w: WedgeX; glue: Glue; px: number}> = ({id, w, glue, px}) => {
  const wedgePoly = closed(WEDGE_POLY as P[], 0);
  return (
    <g>
      <defs>
        <clipPath id={`${id}-rc`}><path d={RAD} /></clipPath>
        <clipPath id={`${id}-nw`}><path d={`M-200 -200H200V400H-200Z ${wedgePoly}`} clipRule="evenodd" /></clipPath>
        <clipPath id={`${id}-wc`}><path d={wedgePoly} /></clipPath>
        <linearGradient id={`${id}-bg`} gradientUnits="userSpaceOnUse" x1="-16" y1="-30" x2="18" y2="20">
          <stop offset="0" stopColor={C.boneLit} />
          <stop offset="0.55" stopColor={C.bone} />
          <stop offset="1" stopColor={C.boneShade} />
        </linearGradient>
      </defs>
      <path d={RAD} fill={C.cavity} />
      <g clipPath={`url(#${id}-nw)`}>
        <path d={RAD} fill={`url(#${id}-bg)`} stroke={C.boneInk} strokeWidth={2.4 * px} />
      </g>
      <g clipPath={`url(#${id}-rc)`}>
        {SEAM_IDS.flatMap((sid) => glueBand(sid, -0.5, seamLength(sid) + 0.5, WEDGE_SEATED, 0).map((r, i) => (
          <path key={sid + i} d={closed([...r.lo, ...[...r.hi].reverse()], 0)} fill={C.cavity} />
        )))}
      </g>
      <g transform={xfSvg(w)}>
        <g clipPath={`url(#${id}-wc)`}>
          <path d={RAD} fill={`url(#${id}-bg)`} stroke={C.boneInk} strokeWidth={2.4 * px} />
        </g>
      </g>
      {SEAM_IDS.map((sid) => ([1, -1] as const).map((side) => (
        <path key={sid + side} d={open(seamEdgeLine(sid, -0.6, seamLength(sid) + 0.6, side, w), 0)} stroke={C.boneInk} strokeWidth={1.8 * px} fill="none" />
      )))}
      {SEAM_IDS.map((sid) => {
        const g = glue[sid];
        if (!g) return null;
        return glueBand(sid, g[0], Math.min(g[1], seamLength(sid)), w).map((r, i) => (
          <path key={sid + i} d={closed([...r.lo, ...[...r.hi].reverse()], 0)} fill={C.glue} stroke={C.glueInk} strokeWidth={1.4 * px} />
        ));
      })}
    </g>
  );
};

// ---------------------------------------------------------------- states
type Spec = {c: Cam; s: InstrState2; w: WedgeX; glue: Glue; label: string};
const S0 = SURGEON_DEFAULT;
const ALL: Glue = {C1: [0, 99], C2: [0, 99], C3: [0, 99]};
const sC1 = (x: number, y: number) => seamNearest('C1', pt(x, y));
const sC2 = (x: number, y: number) => seamNearest('C2', pt(x, y));
const CAM_A: Cam = {x: 4, y: -0.6, w: 26, k: 1}; // the film's CAM0
const CAM_B: Cam = {x: 16, y: -44, w: 165, k: 0.97, focus: -6};
const CAM_C: Cam = {x: 10, y: -18, w: 100, k: 0.98, focus: -6};
const CAM_D: Cam = {x: 4, y: -8, w: 80, k: 1, focus: -4};
const CAM_E: Cam = {x: 60, y: -90, w: 300, k: 0.9};
const appA = {tip: pt(-3.4, 1.0), ang: -0.42, press: 0.4, gel: 1, lift: 0};
const probeW = {tip: xfPoint(WEDGE_PRESS, WEDGE_OUT), ang: PROBE_ANG_W, lift: 0};
const probeS = {tip: STYLOID_PRESS, ang: PROBE_ANG_S, lift: 0};
// the film's framings (story.ts): REVEAL, ACT, FIX, and a close look at the probe's contact on the styloid fragment
const CAM_REV: Cam = {x: 10, y: -27, w: 112, k: 0.98, focus: -5};
const CAM_ACT: Cam = {x: 8.5, y: -10, w: 62, k: 1, focus: -3};
const CAM_FIX: Cam = {x: 6, y: -4, w: 58, k: 1, focus: -3};
const CAM_Z: Cam = {x: 8.5, y: -6.5, w: 16, k: 1, focus: 0};
const c2 = (y: number) => {
  let s = 0;
  while (seamPoint('C2', s).y > y) s += 0.05;
  return {p: seamPoint('C2', s), s};
};
// the styloid stroke: the applicator steep from above (story APP_ANG_S), clear of the probe on the styloid fragment
const APP_S = -1.35;
const appMid = {tip: c2(-8).p, ang: APP_S - 0.025, press: 0.6, gel: 1, lift: 0};
const appB = {tip: pt(3.6, 0.2), ang: -0.45, press: 0.5, gel: 1, lift: 0};
const appC = {tip: pt(2.9, -12), ang: -0.5, press: 0.7, gel: 1, lift: 0};
const st = (o: Partial<InstrState2>): InstrState2 => ({...S0, ...o});
const STATES: Record<string, Spec> = {
  a1: {label: 'a1 open', c: CAM_A, s: st({app: appA, probe: probeW, k: 1}), w: WEDGE_OUT, glue: {C1: [0, sC1(-3.4, 1.0)]}},
  a2: {label: 'a2 open lift1', c: CAM_A, s: st({app: {...appA, tip: pt(9.5, 6.5), ang: -0.3}, probe: {...probeW, tip: pt(11.26, 4.08), lift: 1}, k: 1}), w: WEDGE_SEATED, glue: {C1: [0, 99], C3: [0, 99]}},
  b: {label: 'b reveal', c: CAM_B, s: st({app: appB, probe: probeS, k: 0.97, lean: 1}), w: WEDGE_SEATED, glue: {C1: [0, 99], C3: [0, 99]}},
  c1: {label: 'c1 stroke', c: CAM_C, s: st({app: appC, probe: probeS, k: 0.98, lean: 1.5}), w: WEDGE_SEATED, glue: {C1: [0, 99], C3: [0, 99], C2: [0, sC2(2.9, -12)]}},
  c2: {label: 'c2 app lift', c: CAM_C, s: st({app: {...appC, tip: pt(2.7, -16.5), lift: 0.6}, probe: probeS, k: 0.98, lean: 1.5}), w: WEDGE_SEATED, glue: {C1: [0, 99], C3: [0, 99], C2: [0, sC2(2.7, -16.5)]}},
  d1: {label: 'd1 lift0', c: CAM_D, s: st({probe: probeS, appOn: 0, k: 1}), w: WEDGE_SEATED, glue: ALL},
  d2: {label: 'd2 lift.5', c: CAM_D, s: st({probe: {...probeS, lift: 0.5}, appOn: 0, k: 1}), w: WEDGE_SEATED, glue: ALL},
  d3: {label: 'd3 lift1', c: CAM_D, s: st({probe: {...probeS, lift: 1}, appOn: 0, k: 1}), w: WEDGE_SEATED, glue: ALL},
  d4: {label: 'd4 on.4', c: CAM_D, s: st({probe: {...probeS, lift: 1}, appOn: 0, probeOn: 0.4, k: 1}), w: WEDGE_SEATED, glue: ALL},
  e: {label: 'e wide', c: CAM_E, s: st({app: appB, probe: probeS, k: 0.9}), w: WEDGE_SEATED, glue: ALL},
  e2: {label: 'e2 withdraw', c: CAM_E, s: st({app: {...appB, lift: 1}, probe: {...probeS, lift: 1}, appOn: 0.4, probeOn: 0.4, k: 0.9}), w: WEDGE_SEATED, glue: ALL},
  hl: {label: 'hl left', c: {x: 105, y: 42, w: 120, k: 0.95, focus: -6}, s: st({app: appB, probe: probeS, k: 0.95}), w: WEDGE_SEATED, glue: ALL},
  hr: {label: 'hr right', c: {x: 112, y: -62, w: 120, k: 0.95, focus: -6}, s: st({app: appB, probe: probeS, k: 0.95}), w: WEDGE_SEATED, glue: ALL},
  // the release with the press point inside the window (a staging suggestion: mid styloid fragment, away from the retractor)
  r0: {label: 'r0 in-win lift0', c: CAM_D, s: st({probe: {tip: pt(7.4, -10.5), ang: 0.62, lift: 0}, appOn: 0, k: 1}), w: WEDGE_SEATED, glue: ALL},
  r5: {label: 'r5 lift.5', c: CAM_D, s: st({probe: {tip: pt(7.4, -10.5), ang: 0.62, lift: 0.5}, appOn: 0, k: 1}), w: WEDGE_SEATED, glue: ALL},
  r1: {label: 'r1 lift1', c: CAM_D, s: st({probe: {tip: pt(7.4, -10.5), ang: 0.62, lift: 1}, appOn: 0, k: 1}), w: WEDGE_SEATED, glue: ALL},
  // V2 fix-probe checks: the frame-0 push, the styloid hold and its release (lift 0 / .15 / .5 / 1), the stroke in ACT
  f0: {label: 'f0 frame0', c: CAM_A, s: st({app: appA, probe: probeW, k: 1}), w: WEDGE_OUT, glue: {C1: [0, sC1(-3.4, 1.0)]}},
  z0: {label: 'z0 hold', c: CAM_Z, s: st({app: appMid, probe: probeS, appOn: 0, k: 1}), w: WEDGE_SEATED, glue: ALL},
  z1: {label: 'z1 lift.15', c: CAM_Z, s: st({probe: {...probeS, lift: 0.15}, appOn: 0, k: 1}), w: WEDGE_SEATED, glue: ALL},
  z5: {label: 'z5 lift.5', c: CAM_Z, s: st({probe: {...probeS, lift: 0.5}, appOn: 0, k: 1}), w: WEDGE_SEATED, glue: ALL},
  z9: {label: 'z9 lift1', c: CAM_Z, s: st({probe: {...probeS, lift: 1}, appOn: 0, k: 1}), w: WEDGE_SEATED, glue: ALL},
  x0: {label: 'x0 FIX hold', c: CAM_FIX, s: st({probe: probeS, appOn: 0, k: 1}), w: WEDGE_SEATED, glue: ALL},
  x9: {label: 'x9 FIX lift1', c: CAM_FIX, s: st({probe: {...probeS, lift: 1}, appOn: 0, k: 1}), w: WEDGE_SEATED, glue: ALL},
  xo: {label: 'xo FIX out.5', c: CAM_FIX, s: st({probe: {...probeS, lift: 1}, appOn: 0, probeOn: 0.5, k: 1}), w: WEDGE_SEATED, glue: ALL},
  ac: {label: 'ac ACT stroke', c: CAM_ACT, s: st({app: appMid, probe: probeS, k: 1, lean: 1.5}), w: WEDGE_SEATED, glue: {C1: [0, 99], C3: [0, 99], C2: [0, c2(-8).s]}},
  al: {label: 'al ACT lifted', c: CAM_ACT, s: st({app: {...appMid, tip: c2(-17).p, ang: APP_S - 0.05, gel: 0, lift: 1}, probe: probeS, k: 1, lean: 1.5}), w: WEDGE_SEATED, glue: {C1: [0, 99], C3: [0, 99], C2: [0, c2(-17).s]}},
  // the reveal: the applicator waits at the foot of the styloid seam at its shallow angle, the probe waits lifted beside
  // the fragment (story PROBE_READY), below the cannula's line
  rv: {label: 'rv REVEAL', c: CAM_REV, s: st({app: {...appB, tip: seamPoint('C2', 0.15), ang: -0.47}, probe: {tip: pt(11.25, -2.5), ang: 1.48, lift: 1}, k: 0.98, lean: 1}), w: WEDGE_SEATED, glue: {C1: [0, 99], C3: [0, 99]}},
  hn: {label: 'hn left grip', c: {x: 30, y: 105, w: 190, k: 0.98, focus: -6}, s: st({app: appB, probe: probeS, k: 0.98}), w: WEDGE_SEATED, glue: ALL},
  hf: {label: 'hf right grip', c: {x: 62, y: -42, w: 120, k: 1, focus: -6}, s: st({app: appMid, probe: probeS, k: 1}), w: WEDGE_SEATED, glue: ALL},
  w4: {label: 'w4 clinic', c: {x: 92, y: -100, w: 405, k: 0.86, focus: -10}, s: st({app: appB, probe: probeS, k: 0.86, lean: 1, face: {focus: 0.55, smile: 0, gx: -0.5, gy: 0.55, blink: 0}}), w: WEDGE_SEATED, glue: ALL},
  w5: {label: 'w5 out', c: {x: 92, y: -100, w: 405, k: 0.86, focus: -10}, s: st({app: {...appB, lift: 1}, probe: {...probeS, lift: 1}, appOn: 0.02, probeOn: 0.02, k: 0.86, lean: -1}), w: WEDGE_SEATED, glue: ALL},
  h: {label: 'h hands', c: {x: 120, y: -10, w: 210, k: 0.95, focus: -6}, s: st({app: appB, probe: probeS, k: 0.95}), w: WEDGE_SEATED, glue: ALL},
};

/** staging options for the styloid hold (key 'o<opt>_<shot>', e.g. 'oL_rv'): the applicator's angle on the styloid
 *  seam, the probe's press point and angle; shots: rv = REVEAL (the applicator at the C2 foot), ac = ACT mid-stroke,
 *  at = ACT at the top of the stroke, fx = FIX holding (applicator gone), fl = FIX lifted 1, z = close, w = wide,
 *  h = the right hand. C = the old staging (-0.47: the cannula crosses the probe), A = steep throughout (its hand covers
 *  the patient's thumb in REVEAL), L = steep for the stroke only (the film: story turns it on "Researchers"), P = the
 *  polish-hands patch's stroke start */
const OPTS: Record<string, {app: number; p: P; th: number}> = {
  A: {app: -1.3, p: pt(7, -9), th: 1.18},
  C: {app: -0.47, p: pt(7, -9), th: 1.18},
  L: {app: -1.35, p: pt(7, -9), th: 1.18},
  // the polish-hands staging patch (story-hands.patch): the stroke starts at -1.28 and relaxes to -0.98 as the tip climbs
  P: {app: -1.28, p: pt(7, -9), th: 1.18},
};
const optSpec = (key: string): Spec | null => {
  const m = /^o([A-Z])_([a-z]+)$/.exec(key);
  if (!m || !OPTS[m[1]]) return null;
  const o = OPTS[m[1]];
  const probe = {tip: o.p, ang: o.th, lift: m[2] === 'fl' ? 1 : 0};
  const foot = seamPoint('C2', 0.15);
  const mid = c2(-8), top = c2(-17);
  const glue2: Glue = {C1: [0, 99], C3: [0, 99]};
  switch (m[2]) {
    case 'rv': return {label: key, c: CAM_REV, s: st({app: {tip: foot, ang: o.app, press: 0.5, gel: 1, lift: 0}, probe, k: 0.98, lean: 2}), w: WEDGE_SEATED, glue: glue2};
    case 'ac': return {label: key, c: CAM_ACT, s: st({app: {tip: mid.p, ang: o.app - 0.025, press: 0.6, gel: 1, lift: 0}, probe, k: 1, lean: 2}), w: WEDGE_SEATED, glue: {...glue2, C2: [0, mid.s]}};
    case 'at': return {label: key, c: CAM_ACT, s: st({app: {tip: top.p, ang: o.app - 0.05, press: 0.7, gel: 0, lift: 0.6}, probe, k: 1, lean: 2}), w: WEDGE_SEATED, glue: {...glue2, C2: [0, top.s]}};
    case 'fx': case 'fl': return {label: key, c: CAM_FIX, s: st({probe, appOn: 0, k: 1}), w: WEDGE_SEATED, glue: ALL};
    case 'w': return {label: key, c: {x: 60, y: -90, w: 300, k: 0.9, focus: -8}, s: st({app: {tip: mid.p, ang: o.app - 0.025, press: 0.6, gel: 1, lift: 0}, probe, k: 0.9, lean: 2}), w: WEDGE_SEATED, glue: {...glue2, C2: [0, mid.s]}};
    case 'h': return {label: key, c: {x: 28, y: -75, w: 140, k: 0.98, focus: -6}, s: st({app: {tip: mid.p, ang: o.app - 0.025, press: 0.6, gel: 1, lift: 0}, probe, k: 0.98, lean: 2}), w: WEDGE_SEATED, glue: {...glue2, C2: [0, mid.s]}};
    case 'z': return {label: key, c: {x: o.p.x + 1, y: o.p.y + 1.5, w: 16, k: 1, focus: 0}, s: st({probe: {...probe, lift: 0}, appOn: 0, k: 1}), w: WEDGE_SEATED, glue: ALL};
    default: return null;
  }
};

/** a film moment from story.ts (key 't<seconds>', e.g. 't15.9'): its camera, instruments, wedge pose and glue, drawn
 *  with this sheet's stand-in fracture and with the instruments' withdrawal passed to their shadows */
const filmSpec = (key: string): Spec | null => {
  const m = /^t([0-9.]+)(?:@(-?[0-9.]+),(-?[0-9.]+),([0-9.]+))?$/.exec(key);
  if (!m) return null;
  const t = Number(m[1]);
  const wc = camAt(t);
  if (wc.world !== 'wrist') return null;
  if (m[2] !== undefined) wc.cam = {...wc.cam, x: Number(m[2]), y: Number(m[3]), w: Number(m[4])};
  const g = boneAt(t, wc.cam.w / 1080).glue;
  const glue: Glue = {};
  for (const id of SEAM_IDS) if (g[id].b > g[id].a) glue[id] = [g[id].a, g[id].b];
  return {label: `${key} (${Math.round(t * 30)})`, c: wc.cam, s: instrAt(t), w: wedgeAt(t), glue};
};
const specOf = (key: string): Spec => filmSpec(key) ?? optSpec(key) ?? STATES[key];

const ARM0: ArmState = {curl: 0.25, thumb: 0.2, incision: 1, sutures: 0, scar: 0, window: null};
const Frame: React.FC<{sp: Spec; id: string; off?: string[]}> = ({sp, id, off = []}) => {
  resetIds(id);
  const c = sp.c;
  const px = c.w / 1080;
  const arm = ARM0;
  const ins = sp.s;
  const s: InstrState2 = {
    ...ins,
    app: {...ins.app, tip: reproject(c, ins.app.tip, Z_INSTR)},
    probe: {...ins.probe, tip: reproject(c, ins.probe.tip, Z_INSTR)},
    k: c.k ?? 1,
  };
  return (
    <AbsoluteFill style={{background: '#0D111C', overflow: 'hidden'}}>
      {c.w > 90 && (
        <Layer c={c} z={Z_ROOM} minBlur={3} maxBlur={14}>
          <RoomBack id={`${id}-rm`} t={0} />
        </Layer>
      )}
      {c.w > 24 && (
        <Layer c={c} z={Z_TABLE} maxBlur={18}>
          <HandTable id={`${id}-tb`} variant="drape" />
        </Layer>
      )}
      {!off.includes('back') && <Layer c={c} z={Z_INSTR} maxBlur={20}>
        <SurgeonBack id={`${id}-sb`} s={s} />
      </Layer>}
      <Layer c={c} z={0} maxBlur={20}>
        <defs>
          <clipPath id={`${id}-ac`}>
            <path d={armOutlinePath(arm)} transform={`translate(${c.x} ${c.y}) scale(${layerScale(c, Z_SKIN) / layerScale(c, 0)}) translate(${-c.x} ${-c.y})`} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-ac)`}>
          <DeepTissue id={`${id}-dt`} s={arm} />
          <Skeleton id={`${id}-sk`} curl={arm.curl} thumb={arm.thumb} detail={px < 0.1 ? 1 : 0.6} />
          <FractureStandIn id={`${id}-fx`} w={sp.w} glue={sp.glue} px={px} />
          {!off.includes('shadow') && ins.probeOn > 0.01 && <ProbeShadow st={ins.probe} px={px} on={ins.probeOn} />}
          {!off.includes('shadow') && ins.appOn > 0.01 && <AppShadow st={ins.app} px={px} on={ins.appOn} />}
        </g>
      </Layer>
      <Layer c={c} z={Z_SKIN} maxBlur={22}>
        <ArmSkin id={`${id}-as`} s={arm} />
        <IncisionRim id={`${id}-ir`} s={arm} />
        <DrapeOverArm id={`${id}-do`} />
      </Layer>
      {!off.includes('front') && (ins.appOn > 0.01 || ins.probeOn > 0.01) && (
        <Layer c={c} z={Z_INSTR} maxBlur={c.w < 60 ? 1.5 : 20}>
          <SurgeonFront id={`${id}-sf`} s={s} />
        </Layer>
      )}
    </AbsoluteFill>
  );
};
void INK;

const Sheet: React.FC<{ks: string[]; cols: number}> = ({ks, cols}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {ks.map((key, i) => (
        <div key={key} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame sp={specOf(key)} id={`f${key.replace(/[^A-Za-z0-9]/g, '_')}`} />
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 64, color: '#FF0', fontFamily: 'monospace'}}>{specOf(key).label}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const Test: React.FC<{st: string; ks?: string[]; cols?: number; off?: string[]}> = ({st: key, ks, cols, off}) => {
  if (key === 'sheet') return <Sheet ks={ks ?? Object.keys(STATES)} cols={cols ?? 4} />;
  return <Frame sp={specOf(key)} id={`f${key.replace(/[^A-Za-z0-9]/g, '_')}`} off={off} />;
};

registerRoot(() => (
  <>
    <Composition id="Surgeon2" component={Test} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{st: 'b'} as {st: string; ks?: string[]; cols?: number; off?: string[]}} />
    <Composition id="Sheet2" component={Test} durationInFrames={1} fps={30} width={1080} height={1440} defaultProps={{st: 'sheet'} as {st: string; ks?: string[]; cols?: number; off?: string[]}} />
  </>
));
