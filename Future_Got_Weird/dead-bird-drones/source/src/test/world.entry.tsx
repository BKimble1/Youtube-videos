// WORLD test sheets: every environment through its typical camera, a flock cell, and the story's own cameras.
// A grey placeholder bird (the rig's BODY ellipsoids and wing outline) stands at the camera target so scale reads.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {Basis, basis, bodyFrame, ellipsoid2, Frame, Orbit, poly, proj, rotZ, smoothClosed, V3, xf, xfv} from '../three';
import {BODY, phiOfPhase, pose, Pose, wingPt, WING_OUTLINE, WingFrame} from '../rig';
import {resetIds, uid} from '../core/ids';
import {FieldBack, FieldFront, LabBack, LabFront, MEADOW, MeadowBack, MeadowFront, SKY, SkyBack} from '../art/world';
import {Flock, FLOCK_MEADOW, FLOCK_SKY, LivingBird, LivingBirdView, offsetFlock, wingbeat} from '../art/flock';
import {labShellLift, labState, meadowState, openState, skyState, MEADOW_T0, SKY_T0, ShotState, V_FLY} from '../story';
import {DUR} from '../lib';
import {INK} from '../art/palette';
import {Bird} from '../art/bird';

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
const MEADOW_BIRDS = (t0: number): LivingBird[] => ([[-60, 20, -900, 0.1, 2.3], [60, -10, -1300, 0.55, 2.1], [-20, 30, -1700, 0.3, 2.5], [-150, -20, -1200, 0.8, 2.2], [120, -40, -2600, 0.05, 2.4]] as number[][]).map(
  ([dx, y, z, ph, fq]) => ({o: [300 * t0 - Math.tan((8 * Math.PI) / 180) * Math.abs(z) + dx, y, z] as V3, v: [300, 0, 0] as V3, scale: 1, phase: ph, freq: fq}),
);
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
/** test birds placed beyond the target along the camera's line of sight (yaw 12: x shifts by -tan(12) |z|), then
 *  offset by dx cm, at height y; they fly at the camera's 300 cm/s */
const SKY_BIRDS: LivingBird[] = ([[-60, -10, -600, 0.2, 2.2], [40, -40, -1000, 0.65, 2.4], [-120, -30, -1400, 0.4, 2.1], [110, -90, -1800, 0.9, 2.5], [-40, -150, -2600, 0.15, 2.3], [150, -70, -800, 0.45, 2.0], [-200, -220, -3600, 0.7, 2.2]] as number[][]).map(
  ([dx, y, z, ph, fq]) => ({o: [-Math.tan((12 * Math.PI) / 180) * Math.abs(z) + dx, y, z] as V3, v: [300, 2, 0] as V3, scale: 1, phase: ph, freq: fq}),
);
const skyCell = (t: number, birds = false) => {
  const B = basis(skyCam(t));
  return (
    <g>
      <SkyBack B={B} t={t} />
      {birds && <Flock B={B} t={t} birds={SKY_BIRDS} haze={SKY.haze} />}
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

/** the living bird beside the hero (same camera, same scale), then the whole wingbeat in 16 phases at 7 px/cm and at
 *  story size (2.6 px/cm), to check the silhouette match and that no phase degenerates into needles or shards */
const glideFreeSeed = (ph: number) => {
  for (let s = 1; s < 200; s++) if (wingbeat({o: [0, 0, 0], v: [1, 0, 0], scale: 1, phase: ph}, 0, s).glide < 0.01) return s;
  return 1;
};
const TailZoom: React.FC = () => {
  resetIds('tz_');
  const cam = (scale: number, cx: number, cy: number, yaw = 14, pitch = 8) => basis({target: [-22, 2, 0], yaw, pitch, dist: 700, scale, cx, cy});
  return (
    <AbsoluteFill style={{background: '#CFE3EC'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Bird B={cam(24, 540, 300)} F={bodyFrame([0, 0, 0])} ps={pose(phiOfPhase(0.22))} />
        <LivingBirdView B={cam(24, 540, 800)} t={0} bird={{o: [0, 0, 0], v: [1, 0, 0], scale: 1, phase: 0.3, freq: 2.3}} seed={glideFreeSeed(0.3)} />
        <Bird B={cam(24, 540, 1300, 30, 25)} F={bodyFrame([0, 0, 0])} ps={pose(phiOfPhase(0.22))} />
        <LivingBirdView B={cam(24, 540, 1700, 30, 25)} t={0} bird={{o: [0, 0, 0], v: [1, 0, 0], scale: 1, phase: 0.3, freq: 2.3}} seed={glideFreeSeed(0.3)} />
      </svg>
    </AbsoluteFill>
  );
};
const FlockBeat: React.FC = () => {
  resetIds('fb_');
  const cam = (scale: number, cx: number, cy: number) => basis({target: [-2, 0, 0], yaw: 14, pitch: 8, dist: 700, scale, cx, cy});
  const living = (B: Basis, ph: number, k: string) => (
    <LivingBirdView key={k} B={B} t={0} bird={{o: [0, 0, 0], v: [1, 0, 0], scale: 1, phase: ph, freq: 2.3}} seed={glideFreeSeed(ph)} />
  );
  const cells: React.ReactNode[] = [];
  // hero (left) and living bird (right), two wing positions
  [0.22, 0.7].forEach((u, r) => {
    const Bh = cam(8, 270, 150 + r * 240), Bl = cam(8, 800, 150 + r * 240);
    cells.push(<Bird key={`h${r}`} B={Bh} F={bodyFrame([0, 0, 0], 0, 0, 0)} ps={pose(phiOfPhase(u))} />);
    cells.push(living(Bl, r ? 0.62 : 0.3, `l${r}`));
  });
  for (let i = 0; i < 16; i++) {
    const B = cam(7, 180 + (i % 3) * 360, 640 + Math.floor(i / 3) * 215);
    cells.push(living(B, i / 16, `p${i}`));
  }
  for (let i = 0; i < 16; i++) {
    const B = cam(2.6, 68 + (i % 8) * 135, 1800 + Math.floor(i / 8) * 90 - 20);
    cells.push(living(B, i / 16, `q${i}`));
  }
  return (
    <AbsoluteFill style={{background: '#C9E1EC'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <rect width={W} height={H} fill="#CFE3EC" />
        <rect y={1690} width={W} height={230} fill="#E6EEE6" />
        {cells}
      </svg>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ the story's own cameras (for checking the film)
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
    flock = <Flock B={B} t={t - MEADOW_T0} birds={FLOCK_MEADOW} haze={MEADOW.haze} />;
    front = <MeadowFront B={B} t={t - MEADOW_T0} />;
  } else {
    s = skyState(t);
    const B = basis(s.cam);
    back = <SkyBack B={B} t={t - SKY_T0} />;
    flock = <Flock B={B} t={t - SKY_T0} birds={offsetFlock(FLOCK_SKY, V_FLY * (SKY_T0 - DUR))} haze={SKY.haze} />;
  }
  const B = basis(s.cam);
  // the hero itself (no drive), with the exploded view's shell lift in the lab, so keep-outs read true
  const lift = t >= 3.95 && t < 12.6 ? labShellLift(t) : 0;
  return (
    <g>
      {back}
      {flock}
      <Bird B={B} F={s.F} ps={s.ps} look={{shellLift: lift}} />
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
  {label: 'meadow (story cam) t=13.0', node: storyCell(13.0)},
  {label: 'meadow (brief cam) t=1 +flock', node: meadowCell(1, true)},
]} />;
/** the lab through the story's own cameras with the hero's real shell lift: wide, exploded, schematic, seating */
const LAB_TS = [5.0, 6.6, 7.4, 8.0];
const SkyFlock: React.FC = () => <Grid cols={2} rows={2} cells={[
  {label: 'sky t=0', node: skyCell(0)},
  {label: 'sky t=1.5 +flock', node: skyCell(1.5, true)},
  {label: 'flock beat', node: flockClose()},
  {label: 'flock t=0.8', node: skyCell(0.8, true)},
]} />;
const STORY_TS = [0, 0.5, 3.0, 3.9, 4.6, 5.2, 7.0, 9.6, 10.9, 13.0, 14.6, 15.4, 19.5, 20.8, 22.2, 23.4];
const Story: React.FC<{ts: number[]}> = ({ts}) => <Grid cols={4} rows={4} cells={ts.map((t) => ({label: `t=${t}`, node: storyCell(t)}))} />;
const Pair: React.FC<{ts: number[]}> = ({ts}) => <Grid cols={2} rows={1} cells={ts.map((t) => ({label: `t=${t}`, node: storyCell(t)}))} />;
const Single: React.FC<{t: number}> = ({t}) => <Grid cols={1} rows={1} cells={[{label: `t=${t}`, node: storyCell(t)}]} />;
const Pair2: React.FC<{ts: number[]}> = ({ts}) => <Grid cols={2} rows={2} cells={ts.map((t) => ({label: `t=${t}`, node: storyCell(t)}))} />;

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
/** debug: the opening shot through the story's own camera with chosen layers ('back', 'bird', 'front'); the closing
 *  frames draw the same world at t - DUR, so t may be negative */
const DebugOpen: React.FC<{t: number; parts: string[]}> = ({t, parts}) => {
  resetIds('do_');
  const s = openState(t);
  const B = basis(s.cam);
  return (
    <AbsoluteFill style={{background: '#F0F'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {parts.includes('back') && <FieldBack B={B} t={t} />}
        {parts.includes('bird') && <Bird B={B} F={s.F} ps={s.ps} />}
        {parts.includes('front') && <FieldFront B={B} t={t} />}
      </svg>
    </AbsoluteFill>
  );
};
const Root: React.FC = () => (
  <>
    <Composition id="WorldDebugOpen" component={DebugOpen} durationInFrames={1} fps={30} width={W} height={H} defaultProps={{t: 0, parts: ['back', 'bird', 'front']}} />
    <Composition id="WorldField" component={Field} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="WorldLabMeadow" component={LabMeadow} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="WorldSkyFlock" component={SkyFlock} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="WorldTailZoom" component={TailZoom} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="WorldFlockBeat" component={FlockBeat} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="WorldStory" component={Story} durationInFrames={1} fps={30} width={W} height={H} defaultProps={{ts: STORY_TS}} />
    <Composition id="WorldLabStory" component={Pair2} durationInFrames={1} fps={30} width={W} height={H} defaultProps={{ts: LAB_TS}} />
    <Composition id="WorldPair" component={Pair} durationInFrames={1} fps={30} width={W} height={H} defaultProps={{ts: [14, 20.5]}} />
    <Composition id="WorldSingle" component={Single} durationInFrames={1} fps={30} width={W} height={H} defaultProps={{t: 0}} />
    <Composition id="WorldDebug" component={DebugPart} durationInFrames={1} fps={30} width={W} height={H} defaultProps={{t: 10.9, part: 'labback'}} />
  </>
);
registerRoot(Root);
