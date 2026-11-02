// V2: one frame of the film. Picks the world for time t and draws it through the camera; portals draw the next world
// inside them; captions on top in screen space.
import React from 'react';
import {staticFile} from 'remotion';
import {clamp, lerp, ss} from '../lib';
import {resetIds} from '../core/ids';
import {camT, Cam} from '../story';
import {BlackHole, bhFrame, hasWide} from '../art/space';
import * as St from './story';
import {V2} from './story';
import {TwoShot, TS} from './twoShot';
import {Capsule2, Trail} from './craft';
import {Cockpit, CockpitFront, COCKPIT_ASTRO, ForeArm, cockpitBhT, cockpitBhUrls} from './cockpit';
import {cockpitPoseAt, forearmAt, secBlurAtT, watchMinutesAt} from './cockpitShot';
import {Astronaut, GLOVE} from '../art/figures';
import {useImages} from './preload';
import {Captions2} from './Captions2';
import {CAPTIONS} from '../lib';
import {Expr} from '../art/crew';
import {HookBackground} from './backgrounds';

const W = (c: Cam, children: React.ReactNode) => <g transform={camT(c)}>{children}</g>;
const bhUrls = (t: number) => {
  const n = bhFrame(t), f4 = String(n).padStart(4, '0');
  return [staticFile(`bh/f_${f4}.jpg`), ...(hasWide(n) ? [staticFile(`bhw/f_${f4}.jpg`)] : [])];
};

// ---- 1-2: the opening two-shot, the gaze to the visor ------------------------------------------------------------------
const hookAstroE = (t: number): Expr => {
  const sur = ss(t, 0.14, 0.5);
  const down = ss(t, V2.lookHands - 0.1, V2.lookHands + 0.18) * (1 - ss(t, V2.headTurn, V2.headTurn + 0.3));
  const up = ss(t, V2.headTurn, V2.headTurn + 0.35);
  return {
    mouth: t < 0.16 ? 'smile' : sur < 0.6 ? 'soft' : 'o', open: 0.25 + 0.25 * sur,
    wide: 0.75 * sur * (1 - 0.4 * down), brows: 0.9 * sur - 0.2 * down,
    lookX: lerp(lerp(0.75, 0.4, down), -0.25, up), lookY: lerp(lerp(0.05, 0.9, down), -1, up), blink: 1,
  };
};
const hookFriendE = (t: number): Expr => ({mouth: t < 0.16 ? 'smile' : 'soft', lookX: -0.7, lookY: 0.05, brows: 0.1 * ss(t, 0.3, 0.7)});

function hookWorld(t: number, k: string, forPrint = false) {
  const tt = forPrint ? 0 : t;
  const age = St.hookAge(tt);
  const refl = forPrint ? 0 : St.reflOpacity(tt);
  const reflection = refl > 0 ? (
    <g transform={`translate(${St.VREFL.rx} ${St.VREFL.ry}) rotate(${-St.headTilt(tt)}) scale(${St.VREFL.k})`}><BlackHole t={tt} /></g>
  ) : undefined;
  return (
    <g>
      <HookBackground D={St.hookD(tt)} t={tt} id={`${k}bg`} />
      <TwoShot age={age} id={`${k}ts`} frame={Math.round(tt * 30)} clasp={1} squeeze={ss(tt, 0.35, 0.7) * 0.6} astroE={hookAstroE(tt)} friendE={hookFriendE(tt)} tilt={St.headTilt(tt)} reflection={reflection} reflOpacity={refl} />
    </g>
  );
}

// ---- 3: space ------------------------------------------------------------------------------------------------------------
function spaceWorld(t: number, k: string, withCockpit: boolean) {
  const c = St.capsuleSpace(t);
  const cam = St.camSpace(t);
  return (
    <g>
      <BlackHole t={t} />
      <Trail u={c.u} id={`${k}tr`} px={cam.z} />
      <g transform={`translate(${c.x} ${c.y}) rotate(${c.rot}) scale(${c.s})`}>
        <Capsule2 t={t} id={`${k}cap`} flame={c.flame} glow={1} bank={c.bank}
          win={withCockpit ? <g transform={`translate(0 ${-468}) scale(${52 / St.COCKPIT_VIEW.r}) translate(${-St.COCKPIT_VIEW.x} ${-St.COCKPIT_VIEW.y})`}>{cockpitWorld(t, k + 'ck')}</g> : undefined} />
      </g>
    </g>
  );
}

// ---- 4: cockpit ----------------------------------------------------------------------------------------------------------
function cockpitWorld(t: number, k: string) {
  const fa = forearmAt(t);
  return (
    <g>
      <Cockpit t={t} id={`${k}ck`} />
      <g transform={`translate(${COCKPIT_ASTRO.x} ${COCKPIT_ASTRO.y}) scale(${COCKPIT_ASTRO.s})`}>
        <Astronaut pose={cockpitPoseAt(t)} id={`${k}as`} frame={Math.round(t * 30)} glove={GLOVE} hideHands="L" watchEl={() => null} shadow={false} />
      </g>
      <CockpitFront t={t} id={`${k}cf`} />
      <g transform={`translate(${fa.x} ${fa.y})`}>
        <ForeArm minutes={watchMinutesAt(t)} secBlur={secBlurAtT(t)} id={`${k}fa`} s={fa.s} rot={fa.rot} />
      </g>
    </g>
  );
}

// ---- captions: heights clear of faces, hands, the watch and the photographs ------------------------------------------------
const capY = (_i: number) => 1716;
const capHide = (i: number) => (i === CAPTIONS.length - 1 ? 22.3 : CAPTIONS[i].hide);

export const Scene2: React.FC<{t: number; fkey: string; captions: boolean}> = ({t, fkey, captions}) => {
  resetIds(fkey);
  let body: React.ReactNode = null;
  const urls: string[] = [];
  if (t < V2.spaceCut) {
    body = W(St.camHook(t), hookWorld(t, 'A'));
    if (St.reflOpacity(t) > 0) urls.push(...bhUrls(t));
  } else if (t < V2.windowPass) {
    body = W(St.camSpace(t), spaceWorld(t, 'B', t > V2.approach + 0.3));
    urls.push(...bhUrls(t));
    if (t > V2.approach + 0.3) urls.push(...cockpitBhUrls(cockpitBhT(t)));
  } else if (t < V2.matchCut) {
    body = W(St.camCockpit(t), cockpitWorld(t, 'C'));
  } else {
    body = <rect width={1080} height={1920} fill="#333" />;
  }
  useImages(urls);
  return (
    <>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        {body}
      </svg>
      {captions && <Captions2 t={t} y={capY} hide={capHide} />}
    </>
  );
};
export {clamp, TS};
