// Test entry for the eel renderer (art/eelArt.tsx): real poses from eelAt(t) through the story camera, over a plain
// olive-brown fish silhouette and a teal water background. Never part of the film.
//   npx remotion still src/test/eel.entry.tsx EelFrame $TMPDIR/out.png --props='{"t":0}'
//   views: story (camAt(t)), head (≈60 px/u on the head), lens (the final lens pass, the real layer depth and blur)
//   split: draw the inside part [0, exitIdx] OVER the fish too, so the join with the outside part can be inspected
//   EelSheet: several times at phone size (360×640 cells) in one document (also exercises uid())
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {closed} from '../core/geo';
import {BODY, OPERCLE_EDGE} from '../anatomy';
import {open} from '../core/geo';
import {Cam, DIST, Layer, layerScale} from '../camera';
import {RADII} from '../eel';
import {camAt, eelAt, lensAt} from '../story';
import {C, INK, INK_PX, NS} from '../art/palette';
import {Eel} from '../art/eelArt';
import {resetIds} from '../core/ids';

type FrameProps = {t: number; view?: 'story' | 'head' | 'lens' | 'tail'; split?: boolean; dorsal?: number; fish?: boolean; over?: 'tail' | 'head'; zoom?: number; focus?: number};

const Water: React.FC = () => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, ${C.waterTop} 0%, ${C.waterMid} 55%, ${C.waterDeep} 100%)`}} />
);

const Fish: React.FC<{c: Cam}> = ({c}) => (
  <Layer c={c}>
    <path d={closed(BODY, 0.8)} fill={C.fishBody} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
    <path d={open(OPERCLE_EDGE)} fill="none" stroke={INK} strokeWidth={2} vectorEffect={NS} opacity={0.7} />
  </Layer>
);

export const EelFrame: React.FC<FrameProps> = ({t, view = 'story', split = false, dorsal, fish = true, over, zoom, focus}) => {
  const e = eelAt(t);
  let c: Cam = camAt(t);
  let z = 0;
  if (focus !== undefined) {
    const q = e.pts[Math.round(focus)];
    c = {x: q.x, y: q.y, w: 1080 / (zoom ?? 60)};
  } else if (view === 'head') {
    const q = e.pts[6];
    c = {x: q.x, y: q.y, w: 1080 / (zoom ?? 60)};
  } else if (view === 'tail') {
    const q = e.pts[108];
    c = {x: q.x, y: q.y, w: 1080 / (zoom ?? 60)};
  } else if (view === 'lens') {
    z = -lensAt(t) * DIST * c.w;
  }
  const px = layerScale(c, z);
  const N = e.pts.length - 1;
  const inside = !e.free && e.exitIdx > 0 ? Math.min(N, e.exitIdx) : 0;
  const common = {pts: e.pts, radii: RADII, px, t, dorsal, over};
  const inPart = inside > 0 ? <Eel {...common} from={0} to={inside} /> : null;
  const outPart = inside < N ? <Eel {...common} from={inside} /> : null;
  return (
    <AbsoluteFill>
      <Water />
      {!split && inPart && <Layer c={c} z={z}>{inPart}</Layer>}
      {fish && <Fish c={c} />}
      {split && inPart && <Layer c={c} z={z}>{inPart}</Layer>}
      {outPart && <Layer c={c} z={z}>{outPart}</Layer>}
    </AbsoluteFill>
  );
};

const Frame1: React.FC<FrameProps> = (p) => {
  resetIds('f');
  return <EelFrame {...p} />;
};

export const EelSheet: React.FC<{ts: number[]; cols?: number; split?: boolean}> = ({ts, cols = 3, split}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {ts.map((t, i) => {
        resetIds(`s${i}_`);
        return (
          <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
            <EelFrame t={t} split={split} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <>
    <Composition id="EelFrame" component={Frame1} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 0} as FrameProps} />
    <Composition id="EelSheet" component={EelSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ts: [0, 6.5, 9.5, 12.6, 15, 17, 19.6, 20.9, 22], cols: 3} as {ts: number[]; cols?: number; split?: boolean}} />
  </>
);

registerRoot(Root);
