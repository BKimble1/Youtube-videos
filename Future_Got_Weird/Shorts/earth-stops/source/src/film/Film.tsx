import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {GlobeH} from '../v2/GlobeH';
import {OpeningH1} from '../v2/OpeningH1';
import {Captions, WhatIfTag, popScale, ramp} from './ui';
import {N_FILM, T} from './timeline';
import {BIG, INSET, spinFor} from './globe';
import {GlobeDiagram, diagramTransform, zoomU} from './B02';
import {StreetStory} from './StreetStory';
import {Coast, CoastGraphics, TideFill} from './B04';
import {Polar} from './B05';
import {B6, Closeup, closeAlign, FinaleGlobe, LoopStreet, CLOSE_HIP, CLOSE_REF, closeHip, diveTransform, diveU, loopStreetHero, matchZoom} from './B06';

/** the finale globe grows out of the polar disc's size and place while it dissolves in (f727-739) */
const introTransform = (f: number) => {
  const e = E.out(ramp(f, B6.a0 - 12, B6.a0 + 6, (x) => x)), sc = 0.74 + 0.26 * e, dy = (880 - BIG.cy) * (1 - e);
  return `translate(0px, ${dy}px) translate(${BIG.cx}px, ${BIG.cy}px) scale(${sc}) translate(${-BIG.cx}px, ${-BIG.cy}px)`;
};

export type FilmProps = {captions?: boolean; graphics?: boolean; marker?: boolean};

export const FilmV1: React.FC<FilmProps> = ({captions = true, graphics = true, marker = true}) => {
  const f = useCurrentFrame();
  const u = zoomU(f);
  void N_FILM; void CLOSE_HIP; void diveU;
  const diagramOp = f < T.zoomA ? 1 : 1 - ramp(f, T.zoomB - 11, T.zoomB - 3, (x) => x);
  const inset = popScale(f, T.zoomB) > 0.01 && f < T.wipe2A + 14;
  const insetR = INSET.R * popScale(f, T.zoomB);
  void u;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {f < 204 && <OpeningH1 marker={false} captions={false} graphics={graphics} tilde />}
      {f >= T.zoomA && f < T.wipe1B + 4 && <StreetStory f={f} graphics={graphics} />}
      {f >= T.irisA && f < T.zoomB + 6 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: diagramOp, transform: diagramTransform(f), transformOrigin: '0 0'}}>
          <GlobeDiagram f={f} />
        </div>
      )}
      {f >= T.wipe1A - 2 && f < T.wipe2B + 2 && (() => {
        const u = ramp(f, T.wipe1A, T.wipe1B, E.inOut), x = -120 + (W + 420) * u, slant = 170;
        return (
          <>
            <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, clipPath: `polygon(0px 0px, ${x}px 0px, ${x - slant}px ${H}px, 0px ${H}px)`}}>
              <Coast f={f} />
              {graphics && <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}><CoastGraphics f={f} /></svg>}
            </div>
            {u > 0 && u < 1 && <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}><polygon points={`${x},0 ${x + 26},0 ${x + 26 - slant},${H} ${x - slant},${H}`} fill={C.cream} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" /></svg>}
          </>
        );
      })()}
      {f >= T.wipe2B - 1 && f < T.b05end + 16 && <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: 1 - ramp(f, T.b05end - 4, T.b05end + 12, (x) => x)}}><Polar f={f} /></div>}
      {f >= T.wipe2A && f < T.wipe2B + 2 && <TideFill f={f} />}
      {f >= B6.a0 - 14 && f < B6.zoomB + 4 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: ramp(f, B6.a0 - 12, B6.a0, (x) => x) * (1 - ramp(f, B6.zoomB - 10, B6.zoomB - 2, (x) => x)), transform: `${introTransform(f)} ${diveTransform(f)}`, transformOrigin: '0 0'}}>
          <FinaleGlobe f={f} graphics={graphics} />
        </div>
      )}
      {f >= B6.zoomA + 6 && f < B6.outB + 2 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: ramp(f, B6.zoomB - 10, B6.zoomB - 2, (x) => x) * (1 - ramp(f, B6.outA + 6, B6.outA + 8, (x) => x)), transform: f < B6.zoomB ? closeAlign(f) : f < B6.outA ? 'none' : matchZoom(ramp(f, B6.outA, B6.outB, E.inOut), {x: closeHip(f).x, y: closeHip(f).y, sc: CLOSE_REF.sc}, loopStreetHero(f)), transformOrigin: '0 0'}}>
          <Closeup f={f} graphics={graphics} />
        </div>
      )}
      {f >= B6.outA && <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: ramp(f, B6.outA, B6.outA + 6, (x) => x)}}><LoopStreet f={f} /></div>}
      {inset && <GlobeH f={f} cx={INSET.cx} cy={INSET.cy} R={insetR} id="gins" spin={spinFor(f)} />}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        {marker && <WhatIfTag off={f < B6.tagOff0 ? 0 : f < 1008 ? ramp(f, B6.tagOff0, B6.tagOff1, E.inOut) : 1 - ramp(f, 1008, 1026, E.out)} />}
        {captions && <Captions f={f} />}
      </svg>
    </AbsoluteFill>
  );
};
