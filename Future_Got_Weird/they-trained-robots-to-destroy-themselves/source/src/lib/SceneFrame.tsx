import React, {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';

const Ctx = createContext(0);
export const SceneOffset: React.FC<{from: number; children: React.ReactNode}> = ({from, children}) => (
  <Ctx.Provider value={from}>{children}</Ctx.Provider>
);
/** Global (whole-video) frame number inside a scene Sequence. All cues are global frames. */
export const useG = () => useCurrentFrame() + useContext(Ctx);
