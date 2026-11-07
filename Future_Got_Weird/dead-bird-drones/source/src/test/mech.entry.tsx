// MECH test sheets: the drive at 20 px/cm at four crank angles, close-ups at 60 and 110 px/cm on the gearbox and on the
// rod-to-lever joint, motion blur, focus, and the lab cradle under a body silhouette.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {add3, basis, Basis, bodyFrame, ellipsoid2, Frame, Orbit, poly, proj, rotZ, smoothClosed, V3, xf, hull, V2} from '../three';
import {BODY, CRADLE, GEARS, pose, phiOfPhase, Pose, WING_OUTLINE, wingPt} from '../rig';
import {Mech, MechLook, Cradle} from '../art/mech';
import {C, INK} from '../art/palette';
import {resetIds} from '../core/ids';

const ellFrame = (F: Frame, e: {c: V3; tilt?: number}): Frame => {
  const t = e.tilt ?? 0;
  const R = (v: V3): V3 => {
    const w = rotZ(v, t);
    return [F.ex[0] * w[0] + F.ey[0] * w[1] + F.ez[0] * w[2], F.ex[1] * w[0] + F.ey[1] * w[1] + F.ez[1] * w[2], F.ex[2] * w[0] + F.ey[2] * w[1] + F.ez[2] * w[2]];
  };
  return {o: xf(F, e.c), ex: R([1, 0, 0]), ey: R([0, 1, 0]), ez: R([0, 0, 1])};
};
/** a coarse body silhouette (hull of the body ellipsoids' outlines) */
const bodySil = (B: Basis, F: Frame): V2[] => hull((['chest', 'rear', 'neck', 'head'] as const).flatMap((k) => ellipsoid2(B, ellFrame(F, BODY[k]), [0, 0, 0], BODY[k].r, 36)));

/** stand-in for the Bird module's open cutaway: the far shell's inner surface behind the drive */
const ShellBack: React.FC<{B: Basis; F: Frame; id: string}> = ({B, F, id}) => {
  const sil = bodySil(B, F);
  const c = proj(B, xf(F, [2, 3, -4]));
  return (
    <g>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={c.x} cy={c.y} r={14 * c.s}>
          <stop offset="0" stopColor={C.shellInner} />
          <stop offset="1" stopColor={C.shellInnerDeep} />
        </radialGradient>
      </defs>
      <path d={smoothClosed(sil)} fill={`url(#${id})`} stroke={INK} strokeWidth={2.6} />
    </g>
  );
};
const BodyProxy: React.FC<{B: Basis; F: Frame}> = ({B, F}) => (
  <path d={smoothClosed(bodySil(B, F))} fill={C.plumage} stroke={INK} strokeWidth={2.6} opacity={0.95} />
);
const WingProxy: React.FC<{B: Basis; F: Frame; ps: Pose; side: 'near' | 'far'}> = ({B, F, ps, side}) => {
  const W = ps.wing[side];
  const pts = WING_OUTLINE.map(([a, b]) => proj(B, xf(F, wingPt(W, a, b))));
  return <path d={poly(pts)} fill={side === 'near' ? C.plumageLit : C.plumageDeep} stroke={INK} strokeWidth={2.6} opacity={0.9} />;
};

type CellSpec = {x: number; y: number; w: number; h: number; cam: Orbit; u: number; look?: MechLook; kind?: 'cut' | 'cradle' | 'cradleAll' | 'exploded' | 'bare'; label: string};
const Cell: React.FC<{s: CellSpec; i: number}> = ({s, i}) => {
  const B = basis({...s.cam, cx: s.w / 2 + (s.cam.cx ?? 0), cy: s.h / 2 + (s.cam.cy ?? 0)});
  const F = bodyFrame([0, 0, 0]);
  const ps = pose(phiOfPhase(s.u));
  const kind = s.kind ?? 'cut';
  return (
    <g transform={`translate(${s.x},${s.y})`}>
      <clipPath id={`mcell${i}`}><rect width={s.w} height={s.h} /></clipPath>
      <g clipPath={`url(#mcell${i})`}>
        <rect width={s.w} height={s.h} fill={kind === 'cradle' || kind === 'exploded' ? '#DCE4E8' : '#C9D6DD'} />
        {kind === 'cut' && <ShellBack B={B} F={F} id={`msb${i}`} />}
        {kind === 'exploded' && <WingProxy B={B} F={F} ps={ps} side="far" />}
        {kind === 'cradle' && <Cradle B={B} F={F} base={[0, CRADLE.benchY, 0]} layer="back" />}
        {kind === 'cradle' && <BodyProxy B={B} F={F} />}
        {kind === 'cradle' && <Cradle B={B} F={F} base={[0, CRADLE.benchY, 0]} layer="front" />}
        {kind === 'exploded' && <Cradle B={B} F={F} base={[0, CRADLE.benchY, 0]} />}
        {kind === 'cradleAll' && <Cradle B={B} F={F} base={[0, CRADLE.benchY, 0]} />}
        {kind === 'cradleAll' && <BodyProxy B={B} F={F} />}
        {kind !== 'cradle' && kind !== 'cradleAll' && <Mech B={B} F={F} ps={ps} look={s.look} />}
        {kind === 'exploded' && <WingProxy B={B} F={F} ps={ps} side="near" />}
      </g>
      <rect width={s.w} height={s.h} fill="none" stroke="#7A8790" strokeWidth={2} />
      <text x={10} y={22} fontSize={17} fontFamily="monospace" fill="#22303A">{s.label}</text>
    </g>
  );
};

const DRIVE_T: V3 = [2.4, 0.2, 0];
const sheetA = (): CellSpec[] => {
  const cells: CellSpec[] = [];
  [0, 0.25, 0.5, 0.75].forEach((u, k) =>
    cells.push({x: k * 270, y: 0, w: 270, h: 440, cam: {target: DRIVE_T, yaw: 14, pitch: 7, dist: 900, scale: 20}, u, look: {detail: 0.25}, label: `20px u=${u}`}),
  );
  const gb: V3 = [3.4, -1.9, 0.3];
  cells.push({x: 0, y: 440, w: 540, h: 500, cam: {target: gb, yaw: 10, pitch: 5, dist: 90, scale: 60}, u: 0.1, look: {detail: 0.85}, label: 'gearbox 60px'});
  cells.push({x: 540, y: 440, w: 540, h: 500, cam: {target: [4.5, -3.2, 0], yaw: 10, pitch: 5, dist: 90, scale: 110}, u: 0.1, look: {detail: 1}, label: 'P0/A mesh 110px'});
  cells.push({x: 0, y: 940, w: 540, h: 500, cam: {target: [2.6, 3.4, 1.6], yaw: 10, pitch: 5, dist: 80, scale: 60}, u: 0.35, look: {detail: 0.85}, label: 'rod-lever 60px'});
  cells.push({x: 540, y: 940, w: 540, h: 500, cam: {target: [2.5, 3.9, 2.3], yaw: 10, pitch: 5, dist: 80, scale: 110}, u: 0.35, look: {detail: 1}, label: 'rod-lever 110px'});
  cells.push({x: 0, y: 1440, w: 360, h: 480, cam: {target: [3.6, -2.0, 0.3], yaw: 12, pitch: 7, dist: 90, scale: 48}, u: 0.2, look: {detail: 0.8, rate: (2 * Math.PI) / 0.7}, label: 'blur: flight rate'});
  cells.push({x: 360, y: 1440, w: 360, h: 480, cam: {target: [3.6, -2.0, 0.3], yaw: 12, pitch: 7, dist: 90, scale: 48}, u: 0.2, look: {detail: 0.8, rate: 0.32 * (2 * Math.PI) / 0.7, focus: 'P0'}, label: 'slow + focus P0'});
  cells.push({x: 720, y: 1440, w: 360, h: 480, cam: {target: [-1, -4, 0], yaw: 22, pitch: 15, dist: 420, scale: 8}, u: 0.25, kind: 'cradle', label: 'cradle 8px'});
  return cells;
};
const sheetB = (): CellSpec[] => {
  const cells: CellSpec[] = [];
  cells.push({x: 0, y: 0, w: 1080, h: 820, cam: {target: [-1.5, -2.5, 0], yaw: 24, pitch: 14, dist: 420, scale: 26}, u: 0.15, kind: 'exploded', look: {detail: 0.45}, label: 'frame on cradle, wings on spars (exploded view, 26px)'});
  cells.push({x: 0, y: 820, w: 540, h: 550, cam: {target: [3.0, -0.6, 0.3], yaw: 12, pitch: 7, dist: 90, scale: 66}, u: 0.6, look: {detail: 0.9, focus: 'B'}, label: 'focus B 66px'});
  cells.push({x: 540, y: 820, w: 540, h: 550, cam: {target: [2.6, 3.0, 1.6], yaw: 12, pitch: 5, dist: 80, scale: 60}, u: 0.85, look: {detail: 0.9, focus: 'rod'}, label: 'focus rod 60px'});
  cells.push({x: 0, y: 1370, w: 540, h: 550, cam: {target: [4.6, -2.2, 0], yaw: 10, pitch: 6, dist: 80, scale: 70}, u: 0.42, look: {detail: 0.9, focus: 'A', rate: 0.9}, label: 'focus A 70px'});
  cells.push({x: 540, y: 1370, w: 540, h: 550, cam: {target: DRIVE_T, yaw: 14, pitch: 7, dist: 900, scale: 30}, u: 0.6, look: {detail: 0.4, rate: (2 * Math.PI) / 0.7}, label: '30px flight blur'});
  return cells;
};
const sheetC = (): CellSpec[] => {
  const cells: CellSpec[] = [];
  cells.push({x: 0, y: 0, w: 1080, h: 700, cam: {target: [-1, -5, 0], yaw: 22, pitch: 15, dist: 420, scale: 14}, u: 0.25, kind: 'cradle', label: 'cradle 14px (lab wide)'});
  cells.push({x: 0, y: 700, w: 1080, h: 620, cam: {target: [5.5, -9, 0], yaw: 22, pitch: 15, dist: 420, scale: 34}, u: 0.25, kind: 'cradle', label: 'cradle 34px'});
  cells.push({x: 0, y: 1320, w: 1080, h: 600, cam: {target: [-1, -6, 0], yaw: 22, pitch: 15, dist: 420, scale: 14}, u: 0.25, kind: 'cradleAll', label: 'cradle layer=all drawn before the body (current Film order)'});
  return cells;
};

const Sheet: React.FC<{which: 'A' | 'B' | 'C'}> = ({which}) => {
  resetIds('mech');
  const cells = which === 'A' ? sheetA() : which === 'B' ? sheetB() : sheetC();
  return (
    <AbsoluteFill style={{background: '#E6ECEF'}}>
      <svg width={1080} height={1920}>
        {cells.map((s, i) => <Cell key={i} s={s} i={i} />)}
      </svg>
    </AbsoluteFill>
  );
};
const SheetA: React.FC = () => <Sheet which="A" />;
const SheetB: React.FC = () => <Sheet which="B" />;
const SheetC: React.FC = () => <Sheet which="C" />;

/** geometry check: a marker at gear B's angle on the crank radius must sit on the projected crank pin */
const Check: React.FC = () => {
  resetIds('mchk');
  const B = basis({target: [2.5, 0, 0], yaw: 14, pitch: 7, dist: 300, scale: 60});
  const F = bodyFrame([0, 0, 0]);
  const ps = pose(phiOfPhase(0.3));
  const g = GEARS.B;
  const mk = proj(B, xf(F, add3(g.c, [1.15 * Math.cos(ps.gear.B), 1.15 * Math.sin(ps.gear.B), 0])));
  const pin = proj(B, xf(F, ps.pin));
  return (
    <AbsoluteFill style={{background: '#C9D6DD'}}>
      <svg width={1080} height={1920}>
        <Mech B={B} F={F} ps={ps} look={{detail: 1}} />
        <circle cx={mk.x} cy={mk.y} r={10} fill="none" stroke="#00C" strokeWidth={2} />
        <circle cx={pin.x} cy={pin.y} r={4} fill="#0C0" />
      </svg>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <>
    <Composition id="MechA" component={SheetA} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="MechB" component={SheetB} durationInFrames={1} fps={30} width={1080} height={1920} />
 <Composition id="MechC" component={SheetC} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="MechCheck" component={Check} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
registerRoot(Root);
