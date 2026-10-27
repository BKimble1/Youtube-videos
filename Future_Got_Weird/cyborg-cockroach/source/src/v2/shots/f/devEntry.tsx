// Group F dev entry (not part of the film): the V2 film frame with group F's shots registered over whatever the shot
// table holds, so F1-F5 can be checked before the integrator registers grpF in all2.ts. From source/:
//   npx remotion still src/v2/shots/f/devEntry.tsx SheetF out.png --props='{"fs":[760,780],"captions":false}'
//   npx remotion still src/v2/shots/f/devEntry.tsx StillF out.png --props='{"f":800,"captions":true}'
import React from 'react';
import {registerRoot, Still} from 'remotion';
import {Sheet2, FilmStill2} from '../../Film2';
import {registerShots} from '../index2';
import {CAP2_Y} from '../../captions2';
import {SHOTS_F, CAPY_F} from '../grpF';

registerShots(SHOTS_F);
Object.assign(CAP2_Y, CAPY_F);

const Root: React.FC = () => (
  <>
    <Still id="SheetF" component={Sheet2} width={1080} height={1920} defaultProps={{fs: [760, 800], captions: false}} />
    <Still id="StillF" component={FilmStill2} width={1080} height={1920} defaultProps={{f: 760, captions: true}} />
  </>
);
registerRoot(Root);
