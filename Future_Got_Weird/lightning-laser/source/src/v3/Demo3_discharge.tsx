// V3 beat F: the demonstration bolt. Scene3's Discharge3D with F's controls (the side jabs held back, restrained
// branches, the tip's glow following the crackle), so the guided section reads as one clean line hugging the cyan path.
// View3 is drawn with dk = 0 (no discharge of its own, but its bolt-lit sky and FlashWash still follow st.s), and this
// is drawn as its child.
import React from 'react';
import {Cam3} from '../v2/p3';
import {Discharge3D} from './Scene3';

export const DischargeF: React.FC<{cam: Cam3; s: number; core: number; id: string; branchK?: number; streamerK?: number; tipK?: number}> = (p) => (
  <Discharge3D {...p} />
);
