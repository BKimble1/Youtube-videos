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
  LAB, LAB_CAMS, LAB_HAND, LAB_HANDOFF, LAB_SHOTS, LAB_STAGING, LAB_STREAM, LIQ_SHADE, LAB_ENV, LabGlove, LabHandoffPuddle, LabHandTool,
  LabMeltBridge, LabStream, LabWorld, labCamBetween, labFigureBody, labLidClose, labMagnetGrip, labMeltBase, labPullToBars,
  labPuddleFloor, labRevealCam, lerpShot, MagnetSpec, shotCam,
} from '../art/labset';
import {projectPrims} from '../liquid/sdf';
import {floorPrims} from '../liquid/flow';
import {ChromeBody} from '../liquid/Chrome';
import {labProj} from '../art/labset';

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

type View = 'reveal0' | 'reveal' | 'meltMedium' | 'meltClose' | 'overheadAngled' | 'handoff' | 'bench' | 'mold' | 'collect';
/** one camera, one state (still). melt / u / coil / lid / magnet from props */
const Cam: React.FC<{view: View; melt?: number; u?: number; coil?: number; lid?: number; magnet?: boolean; field?: number; label?: boolean; dish?: boolean; mold?: number; glove?: boolean; atBars?: boolean; pinned?: boolean; bridge?: number; hand?: 'collect' | 'fill' | 'lift'}> = ({
  view, melt = 0, u = -1, coil = 0, lid = 1, magnet = false, field = 0, label = true, dish = false, mold = -1, glove = false, atBars = false, pinned = false, bridge = -1, hand,
}) => {
  const t = useCurrentFrame() / FPS + 6;
  const cam: Cam3 = view === 'reveal0' ? labRevealCam(0) : LAB_CAMS[view];
  const mg: MagnetSpec | null = atBars ? {...LAB.MAGNET_BARS, field: 0.8} : magnet ? {x: LAB.MAGNET_PULL.x, d: LAB.MAGNET_PULL.d, field} : null;
  const base = pinned ? labMeltBase(melt, t) : atBars ? LAB.AT_BARS : melt > 0 ? LAB.MELT : LAB.HOME;
  const body =
    bridge >= 0
      ? (p: 'back' | 'front') => <LabMeltBridge cam={cam} t={t} k={bridge} part={p} />
      : u >= 0
        ? (p: 'back' | 'front') => <LabStream cam={cam} t={t} u={u} part={p} />
        : labFigureBody(cam, t, base, melt, coil * (melt > 0 && melt < 1 ? 0.8 : 0.3));
  const H = hand ? LAB_HAND[hand] : null;
  const handNode = H ? <LabHandTool cam={cam} t={t} tip={H.tip} ang={H.ang} handAng={H.handAng} tool={hand === 'lift' ? 'tweezers' : 'pipette'} fill={hand === 'collect' ? 0.5 : 0.3} squeeze={0.4} open={0.2} handMM={H.handMM} toolMM={H.toolMM} thumbSide={H.thumbSide} /> : null;
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
        front={handNode ?? (glove && mg ? <LabGlove cam={cam} at={labMagnetGrip(mg)} ang={-70} pose={HAND_RELAXED} /> : null)}
      />
      {label && <Label text={`${view} melt ${melt} u ${u} coil ${coil}${pinned ? ' pinned' : ''}${bridge >= 0 ? ' bridge ' + bridge : ''}${hand ? ' hand ' + hand : ''}`} />}
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
  // the recommended path: melts where it was pressed against the bars, the pool pinned behind them (labMeltBase)
  return (
    <Frame tag="ml">
      <LabWorld cam={cam} t={t} coil={coil} body={labFigureBody(cam, t, labMeltBase(m, t), m, coil * 0.85)} />
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


/** the whole LB staging from the pull to the hand-off, one continuous take (6.2 -> 13.67 s): the magnet drags the solid
 *  figure against the bars (clunk), is withdrawn, the coil melts it where it stands (pool pinned behind the bars,
 *  ending on LAB.MELT), the bridge turns the pool into the stream start, the camera rises to the overhead, the magnet
 *  returns and pulls the liquid through, ends on the hand-off camera. */
const Staging: React.FC = () => {
  const f = useCurrentFrame();
  const t = 6.2 + f / FPS;
  const S = LAB_STAGING;
  // camera: meltMedium -> meltClose during the melt -> overhead (bridge + magnet in) -> handoff
  const shot =
    t < S.melt.t0 + 0.1
      ? LAB_SHOTS.meltMedium
      : t < S.melt.t1
        ? lerpShot(LAB_SHOTS.meltMedium, LAB_SHOTS.meltClose, ss5(t, S.melt.t0 + 0.1, S.melt.t1 - 0.2))
        : t < 12.4
          ? lerpShot(LAB_SHOTS.meltClose, LAB_SHOTS.overheadAngled, ss5(t, S.melt.t1 - 0.05, 11.5))
          : lerpShot(LAB_SHOTS.overheadAngled, LAB_SHOTS.handoff, ss5(t, 12.4, 13.5));
  const cam = shotCam(shot);
  // magnet: in from the front, pull, withdrawn; back in for the stream
  const md =
    t < S.withdraw.t0
      ? keyS(t, [[S.pull.t0 - 0.3, LAB.MAGNET_BARS.d - 14], [S.pull.t0 + 0.2, LAB.MAGNET_BARS.d]])
      : t < S.magnetIn.t0
        ? keyS(t, [[S.withdraw.t0, LAB.MAGNET_BARS.d], [S.withdraw.t1, S.withdraw.d]])
        : keyS(t, [[S.magnetIn.t0, LAB.MAGNET_PULL.d - 9], [S.magnetIn.t1, LAB.MAGNET_PULL.d]]);
  const field = t < S.withdraw.t1 ? ss(t, S.pull.t0 - 0.2, S.pull.t0 + 0.2) * (1 - ss(t, S.withdraw.t0, S.withdraw.t1)) : ss(t, S.magnetIn.t0, S.magnetIn.t1) * (1 - ss(t, 13.1, 13.5));
  const coil = ss(t, S.coilOn, S.coilOn + 0.2) * (1 - ss(t, S.melt.t1 - 0.1, S.melt.t1 + 0.4) * 0.75) * (1 - ss(t, 11.2, 12));
  const m = ss(t, S.melt.t0, S.melt.t1);
  const k = ss(t, S.bridge.t0, S.bridge.t1);
  const u = ss(t, S.stream.t0, S.stream.t1);
  const handoff = t >= 13.47;
  const pull = labPullToBars(t);
  const body = (p: 'back' | 'front') =>
    handoff
      ? p === 'front' && <LabHandoffPuddle t={t} cam={cam} settle={ss(t, 13.47, 13.9)} />
      : t >= S.stream.t0
        ? <LabStream cam={cam} t={t} u={u} part={p} />
        : t >= S.bridge.t0
          ? <LabMeltBridge cam={cam} t={t} k={k} part={p} warm={coil * 0.5} />
          : m > 0
            ? labFigureBody(cam, t, labMeltBase(m, t), m, coil * 0.85)(p)
            : labFigureBody(cam, t, pull.base, 0, 0)(p);
  const stage = handoff ? 'handoff' : t >= S.stream.t0 ? 'stream' : t >= S.bridge.t0 ? 'bridge' : m > 0 ? 'melt' : 'pull';
  return (
    <Frame tag="sg">
      <LabWorld cam={cam} t={t} coil={coil} magnet={field > 0.001 || md > LAB.MAGNET_PULL.d - 17 ? {x: t < S.magnetIn.t0 ? LAB.MAGNET_BARS.x : 0, d: md, yaw: t < S.magnetIn.t0 ? LAB.MAGNET_BARS.yaw : 0, field} : null} body={body} />
      <Label text={`${stage} t ${t.toFixed(2)} m ${m.toFixed(2)} k ${k.toFixed(2)} u ${u.toFixed(2)}`} />
    </Frame>
  );
};

/** bridge test: k = frame / 20 at a fixed camera (props: view) */
const Bridge: React.FC<{view?: View}> = ({view = 'meltClose'}) => {
  const f = useCurrentFrame();
  const t = 10.4;
  const cam = LAB_CAMS[view as Exclude<View, 'reveal0'>];
  const k = f <= 0 ? -1 : f >= 21 ? 1 : (f - 1) / 20;
  return (
    <Frame tag="br">
      <LabWorld cam={cam} t={t} body={(p) => <LabMeltBridge cam={cam} t={t} k={k} part={p} />} />
      <Label text={`bridge ${view} k ${k.toFixed(2)}`} />
    </Frame>
  );
};

/** MS collection beat: hand-off camera -> collect camera, the gloved hand + pipette enter, dip, squeeze, draw the
 *  puddle up (the puddle's area shrinks as the pipette fills), and leave */
const Collect: React.FC = () => {
  const f = useCurrentFrame();
  const t = LAB_HANDOFF.t + f / FPS;
  const cam = labCamBetween(LAB_SHOTS.handoff, LAB_SHOTS.collect, ss5(t, 13.75, 14.4));
  const enter = ss(t, 13.85, 14.4) * (1 - ss(t, 15.3, 15.7));
  const draw = ss(t, 14.47, 15.1);
  const H = LAB_HAND.collect;
  const P = LAB_HANDOFF.puddle;
  const R = P.rx * Math.sqrt(Math.max(0, 1 - draw));
  const pd = R > 0.2 ? labPuddleFloor({x: P.x, d: P.d, R, t, seed: P.seed, settle: 1}) : null;
  const s = labProj(cam, {x: P.x, h: 0, d: P.d})?.s ?? 40;
  const lift = ss(t, 15.15, 15.5) * 6;
  return (
    <Frame tag="cl">
      <LabWorld
        cam={cam}
        t={t}
        magnet={LAB_HANDOFF.magnet}
        body={(p) => p === 'front' && pd && <ChromeBody prims={projectPrims(cam, floorPrims(pd.prims, 0, LAB_STREAM.thick))} blend={pd.blend * s} R={LIQ_SHADE.R * s} specs={2} env={LAB_ENV} band={LIQ_SHADE.band} />}
        front={<LabHandTool cam={cam} t={t} tip={{...H.tip, h: H.tip.h + lift}} ang={H.ang} handAng={H.handAng} tool="pipette" fill={draw} squeeze={ss(t, 14.3, 14.47) * (1 - ss(t, 14.5, 15.1))} enter={enter} handMM={H.handMM} toolMM={H.toolMM} thumbSide={H.thumbSide} />}
      />
      <Label text={`collect t ${t.toFixed(2)} draw ${draw.toFixed(2)}`} />
    </Frame>
  );
};

/** MS mold beat: the pipette fills the open mold, then tweezers lift at the re-formed figure's head */
const Mold: React.FC = () => {
  const f = useCurrentFrame();
  const t = 15.3 + f / FPS;
  const cam = LAB_CAMS.mold;
  const fill = ss(t, 15.5, 16.3);
  const tw = t > 16.6;
  const H = tw ? LAB_HAND.lift : LAB_HAND.fill;
  const enter = tw ? ss(t, 16.6, 17.0) : ss(t, 15.3, 15.6) * (1 - ss(t, 16.3, 16.6));
  return (
    <Frame tag="md">
      <LabWorld
        cam={cam}
        t={t}
        dish
        mold={{open: 1, fill}}
        front={<LabHandTool cam={cam} t={t} tip={H.tip} ang={H.ang} handAng={H.handAng} tool={tw ? 'tweezers' : 'pipette'} fill={1 - fill} squeeze={fill} open={1 - ss(t, 16.9, 17.1)} enter={enter} handMM={H.handMM} toolMM={H.toolMM} thumbSide={H.thumbSide} />}
      />
      <Label text={`mold t ${t.toFixed(2)} fill ${fill.toFixed(2)}`} />
    </Frame>
  );
};

/** the test sheet: one state per frame (render as a PNG sequence) */
type CamProps = React.ComponentProps<typeof Cam>;
export const VIEWS: CamProps[] = [
  {view: 'reveal0'},
  {view: 'reveal', lid: 0},
  {view: 'meltMedium', atBars: true},
  {view: 'meltMedium', coil: 1, melt: 0.3, pinned: true},
  {view: 'meltClose', coil: 1, melt: 0.55, pinned: true},
  {view: 'meltClose', coil: 0.6, melt: 1, pinned: true},
  {view: 'overheadAngled', melt: 0, magnet: true},
  {view: 'overheadAngled', u: 0, magnet: true, field: 1},
  {view: 'overheadAngled', u: 0.45, magnet: true, field: 1},
  {view: 'overheadAngled', u: 0.8, magnet: true, field: 1},
  {view: 'handoff', u: 1, magnet: true},
  {view: 'overheadAngled', melt: 0, coil: 1, magnet: false},
  {view: 'bench', coil: 0, dish: true, mold: 0.6, magnet: true, u: 1},
  {view: 'collect', u: 1, hand: 'collect'},
  {view: 'mold', mold: 0.6, dish: true, hand: 'fill'},
  {view: 'mold', mold: 1, dish: true, hand: 'lift'},
  {view: 'overheadAngled', bridge: 0.5},
  {view: 'meltMedium', coil: 1, melt: 0.85, pinned: true},
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
    <Composition id="Staging" component={Staging} durationInFrames={225} fps={FPS} width={1080} height={1920} />
    <Composition id="Bridge" component={Bridge as React.FC} durationInFrames={23} fps={FPS} width={1080} height={1920} />
    <Composition id="Collect" component={Collect} durationInFrames={66} fps={FPS} width={1080} height={1920} />
    <Composition id="Mold" component={Mold} durationInFrames={57} fps={FPS} width={1080} height={1920} />
  </>
));
void clamp;
