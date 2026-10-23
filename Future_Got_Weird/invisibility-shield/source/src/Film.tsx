// FGW "This Shield Can Make You Disappear." One continuous demonstration in one place: the wall, the lead and the
// panel never change; the camera is the observer. A (0-5 s) the panel swings up in front of him and his body vanishes
// inside its outline; B the camera pushes onto the same panel until its lens ridges read; C a top-view section opens
// under a cut across the panel and shows the light paths, with the matching front-view overlays above the cut; D the
// section closes and the camera pulls back, arriving a little off the frontal line, then aligns; E the camera eases
// left as his hand comes round the panel's edge and floats; F the panel is lowered and carried aside, he was there all
// along, and the next lift begins (the last frame runs into frame 0).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {clamp, easeInOut as eio, fmt, inv, smooth} from './lib/math';
import {Wall} from './art/Wall';
import {Lead, leadJoints, torsoPath} from './art/Lead';
import {Grips, PanelOptics} from './art/Shield';
import {FrontOverlay, Section} from './art/Section';
import {Captions} from './Overlay';
import {leadAt} from './poses';
import {Cam, camAt, CUE, FPS, H, opticsAt, panelAt, W} from './world';

export type FilmProps = {audio: string | false; captions: boolean};

export const Scene: React.FC<{t: number; captions: boolean; camOverride?: Cam}> = ({t, captions, camOverride}) => {
  const cam = camOverride ?? camAt(t);
  const p = panelAt(t);
  const o = opticsAt(t, cam, p);
  const pose = leadAt(t, p);
  const j = leadJoints(pose);
  const ridgeK = clamp((cam.z - 1.1) / 1.0);
  // mechanism timing
  const sec = {
    open: smooth(inv(CUE.cut0, CUE.cut1, t)) * (1 - smooth(inv(CUE.close0, CUE.close1, t))),
    spread: inv(CUE.spread0, CUE.spread1, t),
    smear: inv(CUE.smear0, CUE.smear1, t),
    labels: clamp(inv(CUE.cut1 - 0.1, CUE.cut1 + 0.25, t)) * (1 - eio(inv(CUE.close0, CUE.close1, t))),
  };
  const outline = clamp(inv(CUE.cut0, CUE.cut1, t)) * (1 - eio(inv(CUE.close0 - 0.1, CUE.close1, t)));
  const wall = <Wall id="wcopy" dx={o.parallax} floor={false} />;
  const figure = (
    <g>
      <Lead id="res" p={pose} shadows={false} />
      <Grips p={p} />
    </g>
  );
  const camT = `translate(${W / 2} ${H / 2}) scale(${fmt(cam.z)}) translate(${fmt(-cam.x)} ${fmt(-cam.y)})`;
  return (
    <AbsoluteFill style={{backgroundColor: '#F5EEDC'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
        <g transform={camT}>
          <Wall id="wall" dx={o.parallax} />
          <Lead id="lead" p={pose} />
          <PanelOptics id="sh" p={p} wall={wall} figure={figure} ghostFig={<Lead id="gh" p={pose} shadows={false} />} resid={o.resid} ghost={o.ghost} ridgeK={ridgeK}>
            <FrontOverlay id="fo" outline={outline} spread={sec.spread} smear={sec.smear} torsoD={torsoPath(j.cx, j.ys)} head={j.head} />
          </PanelOptics>
          <Section id="sec" s={sec} />
        </g>
      </svg>
      {captions && <Captions t={t} />}
    </AbsoluteFill>
  );
};

export const Film: React.FC<FilmProps> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Scene t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};

export const FilmStill: React.FC<{t: number; captions: boolean; cam?: Cam}> = ({t, captions, cam}) => <Scene t={t} captions={captions} camOverride={cam} />;
