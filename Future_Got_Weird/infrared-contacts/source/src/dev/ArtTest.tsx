// Art inspection still: the lead rig at a chosen zoom and pose (not part of the film).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LeadHead, LeadBody, Finger, POSE0, LeadPose} from '../art/Lead';

export const ArtTest: React.FC<{z: number; cx: number; cy: number; pose: Partial<LeadPose>; finger?: {x: number; y: number; dir: number; lens: number}; body?: boolean}> = ({z, cx, cy, pose, finger, body}) => {
  const p = {...POSE0, ...pose};
  return (
    <AbsoluteFill style={{background: '#2C4A57'}}>
      <svg width={1080} height={1920}>
        <g transform={`translate(540 960) scale(${z}) translate(${-cx} ${-cy})`}>
          {body && <LeadBody id="b" breath={0} pass="back" />}
          <LeadHead p={p} id="h" frame={0} />
          {body && <LeadBody id="b2" breath={0} pass="front" />}
          {finger && <Finger tip={{x: finger.x, y: finger.y}} dir={finger.dir} lens={finger.lens} lensRx={22} id="f" />}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

import {SectionView, SectionState} from '../art/Section';
export const SecTest: React.FC<{zl: number; cx: number; cy: number; st: Partial<SectionState>}> = ({zl, cx, cy, st}) => {
  const s: SectionState = {zl, view: {x0: cx - 540 / zl, x1: cx + 540 / zl, y0: cy - 960 / zl, y1: cy + 960 / zl}, reveal: 1, lidOpen: 0, lensOut: 0,
    retina: {amt: 0, deg: 180, spread: 20, col: '#62F08E'}, hero: {charge: 0, emit: 0, spin: 0}, lensFocus: 0, ...st};
  return (
    <AbsoluteFill style={{background: '#F2C9A8'}}>
      <svg width={1080} height={1920}>
        <g transform={`translate(540 960) scale(${zl}) translate(${-cx} ${-cy})`}>
          <SectionView s={s} id="sec" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

import {TrainBack, Sender, Bystander} from '../art/Train';
import {LEAD} from '../lib';
export const TrainTest: React.FC<{t: number; aim: number}> = ({t, aim}) => (
  <AbsoluteFill>
    <svg width={1080} height={1920}>
      <TrainBack t={t} id="tr" leadLamp={0.6} />
      <Bystander page={0.4} breath={0} id="by" />
      <g transform={`translate(${LEAD.at.x} ${LEAD.at.y}) scale(${LEAD.s})`}>
        <LeadBody id="lb" breath={0} pass="back" />
        <LeadHead p={{...POSE0, lid: 1, tilt: 0}} id="lh" frame={0} />
        <LeadBody id="lb2" breath={0} pass="front" />
      </g>
      <Sender aim={aim} press={0} look={1} smile={0.5} breath={0} id="sd" />
    </svg>
  </AbsoluteFill>
);
