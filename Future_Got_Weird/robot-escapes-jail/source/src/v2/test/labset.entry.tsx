// LABSET tests: every lab camera with the solid figure in the cage, the melt pool, the overhead stream through the bars
// with the magnet outside, coil on/off, the reveal pull-back, props (dish, mold, glove) and the LB -> MS hand-off.
//   cd source; TMPDIR=/dev/shm/v2_labset/tmp npx remotion still src/v2/test/labset.entry.tsx Cam <out.png> --props='{"view":"meltMedium"}' --log=error
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {C} from '../../art/palette';
import {resetIds} from '../../core/ids';
import {clamp, keyS, ss, ss5} from '../../lib';
import {Cam3} from '../../world';
import {ChromeSurface} from '../liquid/Chrome';
import {HAND_RELAXED} from '../../dc/Hand';
import {
  LAB, LAB_CAMS, LAB_HANDOFF, LAB_SHOTS, LabGlove, LabHandoffPuddle, LabStream, LabWorld, labCamBetween, labFigureBody,
  labLidClose, labMagnetGrip, labRevealCam, MagnetSpec, shotCam,
} from '../art/labset';

const FPS = 30;
const Frame: React.FC<{children: React.ReactNode; tag: string}> = ({children, tag}) => {
  resetIds(tag);
  return (
    <AbsoluteFill style={{background: C.navy0}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {children}
      </svg>
    </AbsoluteFill>
  );
};
const Label: React.FC<{text: string}> = ({text}) => (
  <text x={40} y={1880} fill="#9FB6D2" fontSize={30} fontFamily="monospace">{text}</text>
);

type View = 'reveal0' | 'reveal' | 'meltMedium' | 'meltClose' | 'overheadAngled' | 'handoff' | 'bench' | 'mold';
/** one camera, one state (still). melt / u / coil / lid / magnet from props */
const Cam: React.FC<{view: View; melt?: number; u?: number; coil?: number; lid?: number; magnet?: boolean; field?: number; label?: boolean; dish?: boolean; mold?: number; glove?: boolean; atBars?: boolean}> = ({
  view, melt = 0, u = -1, coil = 0, lid = 1, magnet = false, field = 0, label = true, dish = false, mold = -1, glove = false, atBars = false,
}) => {
  const t = useCurrentFrame() / FPS + 6;
  const cam: Cam3 = view === 'reveal0' ? labRevealCam(0) : view === 'mold' ? shotCam({p: {x: 4, h: 26, d: -38}, at: {x: 13, h: 0, d: -14}, f: 2300}) : LAB_CAMS[view];
  const mg: MagnetSpec | null = atBars ? {x: 6.5, d: -6.5, yaw: -40, field: 0.8} : magnet ? {x: LAB.MAGNET_PULL.x, d: LAB.MAGNET_PULL.d, field} : null;
  const body = u >= 0 ? (p: 'back' | 'front') => <LabStream cam={cam} t={t} u={u} part={p} /> : labFigureBody(cam, t, atBars ? LAB.AT_BARS : melt > 0 ? LAB.MELT : LAB.HOME, melt, coil * (melt > 0 && melt < 1 ? 0.8 : 0.3));
  return (
    <Frame tag="cm">
      <LabWorld
        cam={cam}
        t={t}
        lid={lid}
        coil={coil}
        magnet={mg}
        dish={dish}
        mold={mold >= 0 ? {open: 1, fill: mold} : null}
        body={body}
        front={glove && mg ? <LabGlove cam={cam} at={labMagnetGrip(mg)} ang={-70} pose={HAND_RELAXED} /> : null}
      />
      {label && <Label text={`${view} melt ${melt} u ${u} coil ${coil}`} />}
    </Frame>
  );
};

/** the reveal: ChromeSurface for 3 frames, then the pull-back out of the figure's chest to the cage; the lid closes */
const Reveal: React.FC = () => {
  const f = useCurrentFrame();
  const t = 3.4 + f / FPS;
  if (f < 3) return <Frame tag="rv"><ChromeSurface t={t} /></Frame>;
  const u = keyS(t, [[3.5, 0], [5.0, 1]], (x) => 1 - (1 - x) ** 3);
  const cam = labRevealCam(u);
  const lid = labLidClose(t, 5.14);
  return (
    <Frame tag="rv">
      <LabWorld cam={cam} t={t} lid={lid} body={labFigureBody(cam, t, LAB.HOME, 0, 0)} />
      <Label text={`reveal u ${u.toFixed(2)} lid ${lid.toFixed(2)}`} />
    </Frame>
  );
};

/** melt medium -> close, coil on (3 s) */
const Melt: React.FC = () => {
  const f = useCurrentFrame();
  const t = 7.6 + f / FPS;
  const m = ss(t, 7.84, 10.4);
  const coil = ss(t, 7.6, 7.8) * (1 - ss(t, 10.3, 10.6) * 0.6);
  const cam = labCamBetween(LAB_SHOTS.meltMedium, LAB_SHOTS.meltClose, ss5(t, 7.9, 10.2));
  return (
    <Frame tag="ml">
      <LabWorld cam={cam} t={t} coil={coil} body={labFigureBody(cam, t, LAB.MELT, m, coil * 0.85)} />
      <Label text={`melt ${m.toFixed(2)} coil ${coil.toFixed(2)}`} />
    </Frame>
  );
};

/** overhead: the magnet slides in, the liquid streams through the front bars and collects outside; ends on the
 *  hand-off camera with labHandoffPuddle (settling) */
const Stream: React.FC = () => {
  const f = useCurrentFrame();
  const t = 11.4 + f / FPS;
  const mz = keyS(t, [[11.4, LAB.MAGNET_PULL.d - 9], [11.9, LAB.MAGNET_PULL.d]]);
  const u = ss(t, 11.8, 13.35);
  const cam = labCamBetween(LAB_SHOTS.overheadAngled, LAB_SHOTS.handoff, ss5(t, 12.4, 13.5));
  const handoff = t >= 13.47;
  const field = ss(t, 11.5, 11.9) * (1 - ss(t, 13.1, 13.5));
  return (
    <Frame tag="st">
      <LabWorld
        cam={cam}
        t={t}
        coil={0.25 * (1 - ss(t, 11.4, 12.4))}
        magnet={{x: LAB.MAGNET_PULL.x, d: mz, field}}
        body={(p) => (handoff ? p === 'front' && <LabHandoffPuddle t={t} cam={cam} settle={ss(t, 13.47, 13.9)} /> : <LabStream cam={cam} t={t} u={u} part={p} />)}
      />
      <Label text={`stream u ${u.toFixed(2)} ${handoff ? 'HANDOFF puddle' : ''}`} />
    </Frame>
  );
};

/** the hand-off frame (13.67 s): LAB_HANDOFF.cam + labHandoffPuddle */
const Handoff: React.FC<{label?: boolean; shade?: number; band?: number}> = ({label = true, shade, band}) => {
  const t = LAB_HANDOFF.t + useCurrentFrame() / FPS;
  const cam = LAB_HANDOFF.cam;
  return (
    <Frame tag="ho">
      <LabWorld cam={cam} t={t} magnet={LAB_HANDOFF.magnet} body={(p) => p === 'front' && <LabHandoffPuddle t={t} shade={shade} band={band} />} />
      {label && <Label text={`handoff t ${t.toFixed(2)} shade ${shade} band ${band}`} />}
    </Frame>
  );
};

/** the test sheet: one state per frame (render as a PNG sequence) */
type CamProps = React.ComponentProps<typeof Cam>;
export const VIEWS: CamProps[] = [
  {view: 'reveal0'},
  {view: 'reveal', lid: 0},
  {view: 'meltMedium'},
  {view: 'meltMedium', coil: 1, melt: 0.3},
  {view: 'meltClose', coil: 1, melt: 0.55},
  {view: 'meltClose', coil: 0.6, melt: 1},
  {view: 'overheadAngled', melt: 0, magnet: true},
  {view: 'overheadAngled', u: 0, magnet: true, field: 1},
  {view: 'overheadAngled', u: 0.45, magnet: true, field: 1},
  {view: 'overheadAngled', u: 0.8, magnet: true, field: 1},
  {view: 'handoff', u: 1, magnet: true},
  {view: 'overheadAngled', melt: 0, coil: 1, magnet: false},
  {view: 'bench', coil: 0, dish: true, mold: 0.6, magnet: true, u: 1},
  {view: 'bench', u: 1, magnet: true, glove: true},
  {view: 'meltMedium', atBars: true},
  {view: 'mold', mold: 0.6, dish: true},
  {view: 'mold', mold: 1, dish: true, u: 1},
];
const Views: React.FC = () => {
  const f = useCurrentFrame();
  const v = VIEWS[Math.min(VIEWS.length - 1, f)];
  return <Cam {...v} />;
};

registerRoot(() => (
  <>
    <Composition id="Views" component={Views} durationInFrames={VIEWS.length} fps={FPS} width={1080} height={1920} />
    <Composition id="Cam" component={Cam as React.FC} durationInFrames={30} fps={FPS} width={1080} height={1920} defaultProps={{view: 'meltMedium'} as never} />
    <Composition id="Reveal" component={Reveal} durationInFrames={60} fps={FPS} width={1080} height={1920} />
    <Composition id="Melt" component={Melt} durationInFrames={90} fps={FPS} width={1080} height={1920} />
    <Composition id="Stream" component={Stream} durationInFrames={75} fps={FPS} width={1080} height={1920} />
    <Composition id="Handoff" component={Handoff as React.FC} durationInFrames={30} fps={FPS} width={1080} height={1920} />
  </>
));
void clamp;
