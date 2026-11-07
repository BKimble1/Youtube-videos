// WORLD test sheets: every environment through its typical camera, a flock cell, and the story's own cameras.
// A grey placeholder bird (the rig's BODY ellipsoids and wing outline) stands at the camera target so scale reads.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {Basis, basis, bodyFrame, ellipsoid2, Frame, mul3, Orbit, poly, proj, rotZ, smoothClosed, V3, xf, xfv} from '../three';
import {BODY, phiOfPhase, pose, Pose, wingPt, WING_OUTLINE, WingFrame} from '../rig';
import {resetIds, uid} from '../core/ids';
import {FieldBack, FieldFront, LabBack, LabFront, MeadowBack, MeadowFront, SkyBack} from '../art/world';
import {Flock, FLOCK_MEADOW, FLOCK_SKY, LivingBird, LivingBirdView, offsetFlock, wingbeat} from '../art/flock';
import {labState, meadowState, openState, skyState, MEADOW_T0, SKY_T0, ShotState, V_FLY} from '../story';
import {DUR} from '../lib';
import {INK} from '../art/palette';

const W = 1080, H = 1920;

/** grey placeholder bird (not final art): body ellipsoids and the two wing outlines */
const Placeholder: React.FC<{B: Basis; F: Frame; ps?: Pose}> = ({B, F, ps = pose(phiOfPhase(0.25))}) => {
  const ell = (k: keyof typeof BODY) => {
    const e = BODY[k];
    const Fe: Frame = {o: xf(F, e.c), ex: xfv(F, rotZ([1, 0, 0], e.tilt ?? 0)), ey: xfv(F, rotZ([0, 1, 0], e.tilt ?? 0)), ez: F.ez};
    return smoothClosed(ellipsoid2(B, Fe, [0, 0, 0], e.r, 36));
  };
  const wing = (Wf: WingFrame) => poly(WING_OUTLINE.map(([a, b]) => {
    const q = proj(B, xf(F, wingPt(Wf, a, b)));
    return {x: q.x, y: q.y};
  }));
  return (
    <g stroke={INK} strokeWidth={2} fill="#9AA3A9">
      <path d={wing(ps.wing.far)} fill="#7F888E" />
      {(['rear', 'chest', 'neck', 'head'] as const).map((k) => <path key={k} d={ell(k)} />)}
      <path d={wing(ps.wing.near)} />
    </g>
  );
};

/** one frame (1080 x 1920 world) drawn into a sheet cell at (x, y) scaled by k */
const Cell: React.FC<{x: number; y: number; k: number; label: string; children: React.ReactNode}> = ({x, y, k, label, children}) => {
  const id = uid('cell');
  return (
    <g transform={`translate(${x},${y}) scale(${k})`}>
      <defs>
        <clipPath id={id}><rect width={W} height={H} /></clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {children}
        <rect y={260} width={W} height={150} fill="none" stroke="rgba(255,0,0,0.35)" strokeWidth={3} strokeDasharray="12 10" />
        <rect y={1500} width={W} height={420} fill="rgba(0,0,0,0.06)" />
        <text x={24} y={70} fontSize={46} fontFamily="monospace" fill="#000" stroke="#FFF" strokeWidth={6} paintOrder="stroke">{label}</text>
      </g>
      <rect width={W} height={H} fill="none" stroke="#111" strokeWidth={6} />
    </g>
  );
};
const Grid: React.FC<{cols: number; rows: number; cells: {label: string; node: React.ReactNode}[]}> = ({cols, rows, cells}) => {
  resetIds('w_');
  const k = Math.min(W / cols / W, H / rows / H);
  return (
    <AbsoluteFill style={{background: '#222'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {cells.map((c, i) => (
          <Cell key={i} x={(i % cols) * W * k} y={Math.floor(i / cols) * H * k} k={k} label={c.label}>{c.node}</Cell>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ cameras from the brief
const fieldCam = (t: number, scale = 20): Orbit => ({target: [300 * t, 2, 0], yaw: 14, pitch: 7, dist: 600, scale});
const labWide: Orbit = {target: [0, 0, 0], yaw: 20, pitch: 18, dist: 500, scale: 12};
const labClose: Orbit = {target: [4, -1, 4], yaw: 20, pitch: 18, dist: 500, scale: 55};
const meadowCam = (t: number): Orbit => ({target: [300 * t, 0, 0], yaw: 8, pitch: 4, dist: 900, scale: 9});
const skyCam = (t: number): Orbit => ({target: [300 * t, 0, 0], yaw: 12, pitch: 5, dist: 700, scale: 15});

const fieldCell = (t: number, scale = 20) => {
  const B = basis(fieldCam(t, scale));
  return (
    <g>
      <FieldBack B={B} t={t} />
      <Placeholder B={B} F={bodyFrame([300 * t, 0, 0])} ps={pose(phiOfPhase(t / 0.7))} />
      <FieldFront B={B} t={t} />
    </g>
  );
};
const labCell = (o: Orbit) => {
  const B = basis(o);
  return (
    <g>
      <LabBack B={B} t={5} />
      <Placeholder B={B} F={bodyFrame([0, 0, 0])} />
      <LabFront B={B} t={5} />
    </g>
  );
};
const MEADOW_BIRDS = (t0: number): LivingBird[] => [
  {o: [300 * t0 - 260, 20, -900], v: [300, 4, 0], scale: 1, phase: 0.1, freq: 2.3},
  {o: [300 * t0 + 20, -10, -1300], v: [306, 2, 0], scale: 1, phase: 0.55, freq: 2.1},
  {o: [300 * t0 + 240, 30, -1700], v: [298, -3, 0], scale: 1, phase: 0.3, freq: 2.5},
  {o: [300 * t0 - 520, -20, -1200], v: [302, 5, 0], scale: 1, phase: 0.8, freq: 2.2},
];
const meadowCell = (t: number, birds = false) => {
  const B = basis(meadowCam(t));
  return (
    <g>
      <MeadowBack B={B} t={t} />
      {birds && <Flock B={B} t={0} birds={MEADOW_BIRDS(t)} />}
      <Placeholder B={B} F={bodyFrame([300 * t, 0, 0])} ps={pose(phiOfPhase(t / 0.7))} />
      <MeadowFront B={B} t={t} />
    </g>
  );
};
const SKY_BIRDS: LivingBird[] = [
  {o: [-250, -10, -600], v: [300, 3, 0], scale: 1, phase: 0.2, freq: 2.2},
  {o: [-10, -40, -1000], v: [306, -2, 0], scale: 1, phase: 0.65, freq: 2.4},
  {o: [-430, -30, -1400], v: [297, 0, 0], scale: 1, phase: 0.4, freq: 2.1},
  {o: [160, -90, -1800], v: [310, 2, 0], scale: 1, phase: 0.9, freq: 2.5},
  {o: [-120, -110, -2400], v: [304, 1, 0], scale: 1, phase: 0.15, freq: 2.3},
  {o: [120, -60, -700], v: [300, 1, -8], scale: 1, phase: 0.45, freq: 2.0},
];
const skyCell = (t: number, birds = false) => {
  const B = basis(skyCam(t));
  return (
    <g>
      <SkyBack B={B} t={t} />
      {birds && <Flock B={B} t={t} birds={SKY_BIRDS} />}
      <Placeholder B={B} F={bodyFrame([300 * t, 0, 0])} ps={pose(phiOfPhase(t / 0.7))} />
    </g>
  );
};
/** four living birds at characteristic moments of the beat, each in its own quarter of the cell */
const flockClose = () => {
  const phases = [0.0, 0.25, 0.52, 0.78];
  // pick seeds whose glide gate is closed at t = 0 so the beat itself shows
  const seedFor = (ph: number) => {
    for (let s = 1; s < 200; s++) if (wingbeat({o: [0, 0, 0], v: [1, 0, 0], scale: 1, phase: ph}, 0, s).glide < 0.01) return s;
    return 1;
  };
  return (
    <g>
      <SkyBack B={basis(skyCam(0))} t={0} />
      {phases.map((ph, i) => {
        const B = basis({target: [0, 0, 0], yaw: 14, pitch: 8, dist: 700, scale: 9.5, cx: 270 + (i % 2) * 540, cy: 480 + Math.floor(i / 2) * 960});
        return <LivingBirdView key={i} B={B} t={0} bird={{o: [0, 0, 0], v: [1, 0, 0], scale: 1, phase: ph, freq: 2.3}} seed={seedFor(ph)} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ the story's own cameras (for checking the film)
const FILM_MEADOW: LivingBird[] = [
  {o: [-120, 160, -900], v: [205, 4, 0], scale: 1, phase: 0.1, freq: 2.3},
  {o: [60, 110, -1300], v: [212, 2, 0], scale: 1, phase: 0.55, freq: 2.1},
  {o: [260, 220, -1600], v: [208, -3, 0], scale: 1, phase: 0.3, freq: 2.5},
  {o: [-320, 60, -1150], v: [200, 6, 0], scale: 1, phase: 0.8, freq: 2.2},
  {o: [420, 140, -2100], v: [215, 0, 0], scale: 1, phase: 0.05, freq: 2.4},
];
const FILM_SKY: LivingBird[] = [
  {o: [-140, 120, -700], v: [205, 3, 0], scale: 1, phase: 0.2, freq: 2.2},
  {o: [80, 190, -1050], v: [210, -2, 0], scale: 1, phase: 0.65, freq: 2.4},
  {o: [-360, 230, -1400], v: [203, 0, 0], scale: 1, phase: 0.4, freq: 2.1},
  {o: [300, 80, -1800], v: [212, 2, 0], scale: 1, phase: 0.9, freq: 2.5},
  {o: [-40, 300, -2300], v: [208, 1, 0], scale: 1, phase: 0.15, freq: 2.3},
];
const storyCell = (t: number) => {
  let s: ShotState;
  let back: React.ReactNode, front: React.ReactNode = null, flock: React.ReactNode = null;
  if (t < 3.95) {
    s = openState(t);
    const B = basis(s.cam);
    back = <FieldBack B={B} t={t} />;
    front = <FieldFront B={B} t={t} />;
  } else if (t < 12.6) {
    s = labState(t);
    const B = basis(s.cam);
    back = <LabBack B={B} t={t} />;
    front = <LabFront B={B} t={t} />;
  } else if (t < 15.6) {
    s = meadowState(t);
    const B = basis(s.cam);
    back = <MeadowBack B={B} t={t - MEADOW_T0} />;
    flock = <Flock B={B} t={t - MEADOW_T0} birds={FLOCK_MEADOW} />;
    front = <MeadowFront B={B} t={t - MEADOW_T0} />;
  } else {
    s = skyState(t);
    const B = basis(s.cam);
    back = <SkyBack B={B} t={t - SKY_T0} />;
    flock = <Flock B={B} t={t - SKY_T0} birds={offsetFlock(FLOCK_SKY, V_FLY * (SKY_T0 - DUR))} />;
  }
  const B = basis(s.cam);
  return (
    <g>
      {back}
      {flock}
      <Placeholder B={B} F={s.F} ps={s.ps} />
      {front}
    </g>
  );
};

const Field: React.FC = () => <Grid cols={2} rows={2} cells={[
  {label: 'field t=0', node: fieldCell(0)},
  {label: 'field t=0.5', node: fieldCell(0.5)},
  {label: 'field t=1.0', node: fieldCell(1.0)},
  {label: 'field t=3 s12', node: fieldCell(3, 12)},
]} />;
const LabMeadow: React.FC = () => <Grid cols={2} rows={2} cells={[
  {label: 'lab wide', node: labCell(labWide)},
  {label: 'lab close', node: labCell(labClose)},
  {label: 'meadow t=0', node: meadowCell(0)},
  {label: 'meadow t=1.5 +flock', node: meadowCell(1.5, true)},
]} />;
const SkyFlock: React.FC = () => <Grid cols={2} rows={2} cells={[
  {label: 'sky t=0', node: skyCell(0)},
  {label: 'sky t=1.5 +flock', node: skyCell(1.5, true)},
  {label: 'flock beat', node: flockClose()},
  {label: 'flock t=0.8', node: skyCell(0.8, true)},
]} />;
const STORY_TS = [0, 0.5, 3.0, 3.9, 4.6, 5.2, 7.0, 9.6, 10.9, 13.0, 14.6, 15.4, 19.5, 20.8, 22.2, 23.4];
const Story: React.FC<{ts: number[]}> = ({ts}) => <Grid cols={4} rows={4} cells={ts.map((t) => ({label: `t=${t}`, node: storyCell(t)}))} />;
const Single: React.FC<{t: number}> = ({t}) => <Grid cols={1} rows={1} cells={[{label: `t=${t}`, node: storyCell(t)}]} />;

const Root: React.FC = () => (
  <>
    <Composition id="WorldField" component={Field} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="WorldLabMeadow" component={LabMeadow} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="WorldSkyFlock" component={SkyFlock} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="WorldStory" component={Story} durationInFrames={1} fps={30} width={W} height={H} defaultProps={{ts: STORY_TS}} />
    <Composition id="WorldSingle" component={Single} durationInFrames={1} fps={30} width={W} height={H} defaultProps={{t: 0}} />
  </>
);
void mul3;
void ({} as V3);

// ------------------------------------------------------------------ debug: one environment layer alone at a story time
const DebugPart: React.FC<{t: number; part: string}> = ({t, part}) => {
  resetIds('d_');
  const s = t < 12.6 ? labState(t) : meadowState(t);
  const B = basis(s.cam);
  const node =
    part === 'labback' ? <LabBack B={B} t={t} /> : part === 'labfront' ? <LabFront B={B} t={t} /> :
    part === 'meadowback' ? <MeadowBack B={B} t={t - MEADOW_T0} /> : <MeadowFront B={B} t={t - MEADOW_T0} />;
  return (
    <AbsoluteFill style={{background: '#F0F'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>{node}</svg>
    </AbsoluteFill>
  );
};
registerRoot(() => (
  <>
    <Root />
    <Composition id="WorldDebug" component={DebugPart} durationInFrames={1} fps={30} width={W} height={H} defaultProps={{t: 10.9, part: 'labback'}} />
  </>
));
