import React from 'react';
import {Composition, registerRoot, AbsoluteFill} from 'remotion';
import {Cam, Layer, viewRect} from '../camera';
import {Radius, BoneState, HEAL0, BEAD_TOTAL} from '../art/bone';
import {Skeleton} from '../art/skeleton';
import {resetIds} from '../core/ids';
import {C} from '../art/palette';

const boneSt = (px: number, laid = BEAD_TOTAL, t = 12): BoneState => ({t, laid, laidAt: (x) => (x - 6) / 16, seep: 1, set: 1, wet: 0, heal: HEAL0, px});

const SkelView: React.FC<{x: number; y: number; w: number; curl: number}> = ({x, y, w, curl}) => {
  resetIds('sk_');
  const cam: Cam = {x, y, w, k: 1};
  return (
    <AbsoluteFill style={{background: C.cavity}}>
      <Layer c={cam}>
        <Skeleton id="sk" curl={curl} thumb={0.2} detail={1} />
        <Radius st={boneSt(w / 1080)} view={viewRect(cam)} />
      </Layer>
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <>
    <Composition id="Skel" component={SkelView} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{x: -2, y: -52, w: 72, curl: 0.25}} />
  </>
));
