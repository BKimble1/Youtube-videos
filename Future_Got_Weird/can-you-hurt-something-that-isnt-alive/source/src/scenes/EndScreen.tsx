import React from 'react';
import {Paper, Dashed} from '../components/Scenic';
import {C} from '../theme';

// Clean end screen: placeholders only. Space for the channel circle and one video rectangle.
export const EndScreen: React.FC = () => (
  <Paper>
    <Dashed x={260} y={240} w={520} h={520} r={260} />
    <Dashed x={1000} y={240} w={660} h={372} r={22}>
      <span style={{fontSize: 30}}>next video</span>
    </Dashed>
    <div style={{position: 'absolute', left: 1000, top: 660, width: 660, height: 4, background: C.paperLine}} />
  </Paper>
);
