import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ProtoSheet} from './proto';

const Root: React.FC = () => <Composition id="ProtoSheet" component={ProtoSheet} durationInFrames={1} fps={30} width={1080} height={1920} />;
registerRoot(Root);
