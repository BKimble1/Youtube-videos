// 1 · THE HIDDEN WEAPON (0 → "Now imagine"). Frame 0 is already mid-drift: the folded-DNA device tumbles through a
// crowded protein space. On "hides a weapon" its shell turns translucent (internal cutaway) to show the concealed
// ligands; on "trigger a cell" the camera drops to reveal the membrane and its receptors; on "acidic surroundings" the
// space warms and protons gather on the locks; on "it opens" the locks release and the flaps swing flat, the device
// settles toward the membrane, the membrane dimples and receptors start to gather. The cell-death payoff is withheld.
import React from 'react';
import {T, TE, clamp01, drift, lerp, seg, smooth, easeOut, pulse} from '../kit/core';
import {Cam, camPath, smoothCam, kick} from '../kit/cam';
import {Frame, Vignette} from '../kit/fx';
import {MicroWorld} from '../sets/micro';
import {M} from '../theme';

export const HOOK_END = T('Now imagine') - 0.04;
export const tHide = T('hides a weapon'), tTrig = T('trigger a cell'), tDestroy = T('destroy itself');
export const tAcid = T('In acidic'), tOpens = T('it opens'), tOpensE = TE('it opens');
export const T_UNLOCK = tOpens - 0.35;
export const T_OPEN0 = tOpens - 0.05, T_OPEN1 = tOpens + 0.65;

export const hookDevice = (t: number) => {
  const settle = smooth(seg(t, T_OPEN1 - 0.1, HOOK_END + 0.4));
  const x = lerp(-150, 10, smooth(seg(t, -1, HOOK_END))) + drift(t, 3, 2.4) * 26 * (1 - smooth(seg(t, tAcid, T_OPEN0)));
  const y = lerp(-340, -262, smooth(seg(t, 0, T_OPEN0))) + drift(t, 5, 2.1) * 20 * (1 - smooth(seg(t, tAcid, T_OPEN0))) + settle * 150;
  const rot = drift(t, 8, 2.8) * 9 * (1 - smooth(seg(t, tAcid, T_UNLOCK)));
  return {x, y, rot};
};

const camRaw = (t: number): Cam => {
  const d = hookDevice(t);
  const k = camPath([
    [-0.5, {x: d.x - 40, y: d.y - 10, z: 2.9}],
    [tHide - 0.1, {x: d.x - 10, y: d.y + 4, z: 3.25}],
    [tHide + 0.5, {x: d.x + 20, y: d.y + 12, z: 4.3}],
    [tTrig - 0.05, {x: d.x + 34, y: d.y + 14, z: 4.5}],
    [tDestroy + 0.4, {x: d.x + 60, y: -170, z: 1.35}],
    [tAcid + 0.2, {x: d.x + 40, y: -150, z: 1.15}],
    [tOpens - 0.4, {x: d.x, y: d.y + 70, z: 1.75}],
    [tOpens + 0.5, {x: d.x, y: d.y + 70, z: 1.95}],
    [HOOK_END, {x: d.x + 10, y: -95, z: 2.25}],
  ])(t);
  return k;
};

export const Hook: React.FC<{t: number}> = ({t}) => {
  const d = hookDevice(t);
  const cam = kick(smoothCam(camRaw, t, 0.25), t, tOpens + 0.12, 5, 0.3);
  const xray = smooth(seg(t, tHide - 0.05, tHide + 0.35)) * (1 - smooth(seg(t, tTrig + 0.3, tDestroy + 0.2)));
  const acid = smooth(seg(t, tAcid - 0.1, tAcid + 1.1));
  const protons = smooth(seg(t, tAcid + 0.3, T_UNLOCK));
  const unlock = smooth(seg(t, T_UNLOCK, T_OPEN0 + 0.05));
  const open = easeOut(seg(t, T_OPEN0, T_OPEN1));
  const gather = smooth(seg(t, T_OPEN1 - 0.2, HOOK_END + 0.1)) * 0.85;
  const bulge = smooth(seg(t, T_OPEN1, HOOK_END + 0.3)) * 0.8;
  return (
    <Frame bg={M.void}>
      <MicroWorld t={t} cam={cam} devX={d.x} devY={d.y} devRot={d.rot} open={open} unlock={unlock} xray={xray} protons={protons} acid={acid} gather={gather} bulge={bulge} devGlow={pulse(t, tOpens + 0.3, 0.35) * 0.8 + xray} />
      <Vignette op={0.9} />
    </Frame>
  );
};
export const _u = {clamp01, easeOut, tOpensE};
