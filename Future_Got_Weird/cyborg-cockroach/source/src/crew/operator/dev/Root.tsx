// Dev root: the operator's test sheets as stills.
import React from 'react';
import {Still} from 'remotion';
import '../../../fonts';
import {CloseUpStill, OperatorSheet, RemoteSheet} from './Sheet';

export const OperatorDevRoot: React.FC = () => (
  <>
    <Still id="RemoteSheet" component={RemoteSheet} width={1080} height={1920} defaultProps={{}} />
    <Still id="CloseUp" component={CloseUpStill} width={1080} height={1920} defaultProps={{press: 0, lift: 0, led: 'armed' as const}} />
    <Still id="OperatorSheet" component={OperatorSheet} width={1080} height={1920} defaultProps={{}} />
  </>
);
