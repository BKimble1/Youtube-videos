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
import {Room, ROOM} from './room';
import {walkFeet, walkBob} from './walk';
import {Head} from '../art/crew';
import {GUESSER, HELMET, astroReach, astroHandLocal} from '../art/figures';

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

// ---- 5: the home clock (past room) and the window --------------------------------------------------------------------------
function roomPastWorld(t: number, k: string) {
  const sc = St.WIN_SC;
  const view = <g transform={`translate(${St.WIN_CENTRE.x - 540 * sc} ${St.WIN_CENTRE.y - 960 * sc}) scale(${sc})`}>{yardViewA(t, k + 'wv')}</g>;
  return <Room t={t} id={`${k}rm`} era={0} clockMinutes={St.homeClockMinutes(t)} clockBlur={St.homeClockBlur(t)} windowView={view} />;
}
/** the yard as seen at the start of the decades (camera C_A); placeholder until the yard module is wired */
function yardViewA(t: number, k: string) {
  return <rect width={1080} height={1920} fill="#9CC77E" />;
}

// ---- 10-12: the family room, present -----------------------------------------------------------------------------------------
const roomAstroE = (t: number): Expr => {
  const look = ss(t, V2.notice - 0.1, V2.notice + 0.2);
  const face = ss(t, V2.faceTurn, V2.faceTurn + 0.4);
  const grief = ss(t, V2.faceTurn + 0.2, V2.faceTurn + 1.2);
  return {
    turn: lerp(0.3, 0.45, look), lookX: lerp(0.5, 0.85, look) * (1 - 0.6 * face), lookY: lerp(0, 0.15, look) + 0.25 * face,
    wide: 0.3 * look * (1 - grief), brows: 0.25 * look * (1 - grief), sad: 0.25 * look + 0.6 * grief,
    mouth: grief > 0.4 ? 'tremble' : 'flat', blink: t > 17.3 && t < 17.38 ? 0.12 : 1,
  };
};
function roomPresentWorld(t: number, k: string) {
  const x = St.roomAstroX(t);
  const moving = St.roomWalking(t) ? 1 : 0;
  const dist = (x - 470) / St.RS;
  // the reach: his right glove follows the wipe across the family photo's glass
  const reachU = ss(t, V2.reach, V2.dustWipe - 0.1) * (1 - ss(t, V2.faceTurn, V2.faceTurn + 0.45));
  const w = St.dustWipeAt(t);
  const wp = (() => {
    const W = ROOM.wipe;
    const c = {x: 2 * W.via.x - (W.from.x + W.to.x) / 2, y: 2 * W.via.y - (W.from.y + W.to.y) / 2};
    const a = (1 - w) * (1 - w), b = 2 * w * (1 - w), d = w * w;
    return {x: a * W.from.x + b * c.x + d * W.to.x, y: a * W.from.y + b * c.y + d * W.to.y};
  })();
  const tgt = {x: (wp.x - x) / St.RS, y: (wp.y - ROOM.floor) / St.RS};
  const arm = astroReach(tgt.x, tgt.y, 1, 1);
  const armR = {a: lerp(10, arm.a, reachU), b: lerp(14, arm.b, reachU)};
  const swing = moving * Math.sin((Math.PI * dist) / 58) * 14;
  const pose = {
    armL: {a: 10 + swing, b: 16}, armR: reachU > 0.01 ? armR : {a: 10 - swing, b: 16},
    e: roomAstroE(t), bob: walkBob(dist, moving),
  };
  // his reflection on the family photo's glass: his face beside the faces in the print, the window's towers behind him.
  // Drawn over the room (normal blend, cool and translucent), clipped to the glass.
  const ro = St.reflOpRoom(t);
  const G = ROOM.photoFamily.glass;
  const reflNode = ro > 0.001 ? (
    <g>
      <clipPath id={`${k}rgl`}><rect x={G.x} y={G.y} width={G.w} height={G.h} /></clipPath>
      <g clipPath={`url(#${k}rgl)`} opacity={ro}>
        {/* the window behind him, with the changed skyline, reflected */}
        <rect x={G.x + G.w * 0.5} y={G.y - 4} width={G.w * 0.52} height={G.h * 0.62} fill="#CFE6F2" opacity={0.55} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={G.x + G.w * (0.54 + 0.11 * i)} y={G.y + G.h * (0.08 + 0.06 * (i % 2))} width={G.w * 0.07} height={G.h * 0.6} rx={2} fill="#9FC4DA" opacity={0.6} />)}
        <g transform={`translate(${G.x + G.w * 0.8} ${G.y + G.h * 0.6}) scale(0.78)`}>
          <g opacity={0.9}>
            <Head skin={'#E3D2D0'} hair="spiky" hairColor={'#B2626A'} id={`${k}rh`} cheeks={false} e={{...roomAstroE(Math.max(t, V2.faceTurn + 0.4)), turn: -0.2, lookX: -0.35, lookY: 0.15}} />
          </g>
          <circle cx={HELMET.cx} cy={HELMET.cy} r={HELMET.r} fill="#DCEFFF" opacity={0.18} />
          <circle cx={HELMET.cx} cy={HELMET.cy} r={HELMET.r} fill="none" stroke="#F4FBFF" strokeWidth={6} opacity={0.8} />
        </g>
        <rect x={G.x} y={G.y} width={G.w} height={G.h} fill="#BFD6E6" opacity={0.12} />
      </g>
    </g>
  ) : null;
  // his watch beside the photograph (one hour on his wrist; a whole life in the frame)
  const wb = ss(t, V2.watchBeside, V2.watchBeside + 0.35) * (1 - ss(t, V2.photoMove + 0.1, V2.photoMove + 0.5));
  const photoView = <g transform={`translate(${ROOM.photoFriend.print.x} ${ROOM.photoFriend.print.y}) scale(${ROOM.photoFriend.printScale})`}>{W(St.CAM_CLOSE, hookWorld(0, k + 'pv', true))}</g>;
  return (
    <g>
      <Room t={t} id={`${k}rm`} era={1} clockMinutes={661 + (t - 15) / 60} dustWipe={w / St.WIPE_MAX > 0.999 ? 1 : w} photoView={photoView} photoTint={St.printTint(t)} photoGlass={St.printGlass(t)} windowView={yardPresentView(t, k + 'wv')} />
      {reflNode}
      {(t < V2.photoClose + 0.2) && (
        <g transform={`translate(${x} ${ROOM.floor}) scale(${St.RS})`}>
          <Astronaut pose={pose} id={`${k}as`} frame={Math.round(t * 30)} glove={GLOVE} watchEl={() => null} feet={walkFeet(dist, moving)} />
        </g>
      )}
      {wb > 0.001 && (
        <g transform={`translate(${St.FAM.x - 150 + 80 * wb} ${St.FAM.y + 230 - 150 * wb})`}>
          <ForeArm minutes={661 + (t - 15) / 60} secBlur={0} id={`${k}wf`} s={0.36} rot={-10} />
        </g>
      )}
    </g>
  );
}
function yardPresentView(t: number, k: string) {
  void t; void k;
  return <rect x={ROOM.win.x0} y={ROOM.win.y0} width={ROOM.win.w} height={ROOM.win.h} fill="#A8D8E6" />;
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
  } else if (t < V2.windowCover) {
    body = W(St.camRoomPast(t), roomPastWorld(t, 'D'));
  } else if (t < V2.doorPass) {
    body = <rect width={1080} height={1920} fill="#333" />;
  } else {
    body = W(St.camRoomOwn(t), roomPresentWorld(t, 'F'));
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
