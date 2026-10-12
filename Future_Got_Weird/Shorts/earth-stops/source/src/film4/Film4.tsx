import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {WhatIfTag, Captions} from '../film2/ui';
import {BrakeScene, DIVE_AT, diveScale, lockShake} from './Brake4';
import {SpaceBG} from './Globe4';
import {CUES, N_FILM, T} from './timeline4';
import {P1, P2, P3, AwningLayer} from './StreetScenes4';
import {CoastScene, FloodLayer} from './Coast4';
import {GlobeFamily, SPACE_BG, Stage, geoAt} from './Space4';
import {E} from '../lib/motion';

export type Film4Props = {captions?: boolean; graphics?: boolean; marker?: boolean};
const abs: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: W, height: H};

export const FilmV4: React.FC<Film4Props> = ({captions = true, graphics = true, marker = true}) => {
  const f = useCurrentFrame();
  const sc = diveScale(f);
  const inCoast = f >= T.coastA && f < T.floodB + 1;
  const stageOn = f >= T.stageA && f < T.toGlobeA;
  const shrink = f >= T.toGlobeA && f < T.toGlobeB;
  const u = Math.max(0, Math.min(1, (f - T.toGlobeA) / (T.toGlobeB - T.toGlobeA))), ue = E.inOut(u);
  const gm = geoAt(T.toGlobeB), SLABY = 1230, eqY = gm.cy + gm.R * Math.sin((gm.tilt * Math.PI) / 180);
  return (
    <AbsoluteFill style={{background: C.ink}}>
      {f < T.cutStreet && (
        <div style={{...abs, transform: `translate(${lockShake(f).dx}px, ${lockShake(f).dy}px) translate(${DIVE_AT.x}px, ${DIVE_AT.y}px) scale(${sc}) translate(${-DIVE_AT.x}px, ${-DIVE_AT.y}px)`, transformOrigin: '0 0'}}>
          <BrakeScene t={f} />
        </div>
      )}
      {f >= T.cutStreet && f < T.wideA && <P1 f={f} />}
      {f >= T.wideA && f < T.trackA && <P2 f={f} graphics={graphics} />}
      {stageOn && <div style={abs}><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><SpaceBG id="bkbg" glowX={SPACE_BG.glowX} glowY={SPACE_BG.glowY} /><Stage f={f} graphics={graphics} /></svg></div>}
      {f >= T.toGlobeA && <div style={abs}><GlobeFamily f={f} graphics={graphics} /></div>}
      {shrink && <div style={abs}><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><Stage f={f} graphics={graphics} scale={1 + (0.12 - 1) * ue} at={{x: 540, y: SLABY + (eqY - SLABY) * ue}} streaks={Math.max(0, 1 - u * 2.5)} /></svg></div>}
      {inCoast && <div style={abs}><CoastScene f={f} /></div>}
      {f >= T.trackA && f < T.coastA && <div style={abs}><P3 f={f} graphics={graphics} /></div>}
      <AwningLayer f={f} />
      <FloodLayer f={f} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{...abs}}>
        {marker && <WhatIfTag />}
        {captions && <Captions f={f} cues={CUES} />}
      </svg>
    </AbsoluteFill>
  );
};
void N_FILM;
