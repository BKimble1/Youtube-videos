// Dev root: the survivor test sheets as Stills (1080 x 1920).
import React from 'react';
import {Still} from 'remotion';
import '../../../fonts';
import {SurvivorSheet} from './SurvivorSheet';

export const SurvivorDevRoot: React.FC = () => (
  <>
    <Still id="SurvivorSheet" component={SurvivorSheet} width={1080} height={1920} defaultProps={{page: 'explore'}} />
  </>
);
