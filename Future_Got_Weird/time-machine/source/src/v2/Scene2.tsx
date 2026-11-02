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
import {Astronaut, Friend, GLOVE} from '../art/figures';
import {useImages} from './preload';
import {Captions2} from './Captions2';
import {CAPTIONS} from '../lib';
import {Expr} from '../art/crew';
import {YardWorld, YardFore} from './backgrounds';
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
  // smile (the photo) -> surprise as his friend ages -> concern at the old hands -> curiosity as he looks up to the visor
  const sur = ss(t, 0.14, 0.42) * (1 - ss(t, V2.lookHands - 0.05, V2.lookHands + 0.2));
  const down = ss(t, V2.lookHands - 0.1, V2.lookHands + 0.18) * (1 - ss(t, V2.headTurn, V2.headTurn + 0.3));
  const up = ss(t, V2.headTurn, V2.headTurn + 0.35);
  const mouth: Expr['mouth'] = t < 0.16 ? 'smile' : sur > 0.4 ? 'o' : up > 0.5 ? 'soft' : 'flat';
  return {
    mouth, open: 0.2 + 0.35 * sur,
    wide: 0.75 * sur + 0.25 * up, brows: 0.9 * sur + 0.45 * up - 0.1 * down, sad: 0.45 * down,
    lookX: lerp(lerp(0.75, 0.4, down), -0.25, up), lookY: lerp(lerp(0.05, 0.9, down), -1, up), blink: t > 0.9 && t < 0.96 ? 0.15 : 1,
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
      <YardWorld D={St.hookD(tt)} season={lerp(0.1, 0.16, St.hookD(tt))} t={tt} id={`${k}bg`} />
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
/** the yard through the window at the start of the decades: exactly the decades shot's first frame (camera C_A) */
function yardViewA(t: number, k: string) {
  return W(St.C_A, decadesWorld(Math.max(t, V2.windowCover - 0.001), k));
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
  const swing = moving * Math.sin((Math.PI * dist) / 100) * 14;
  const pose = {
    armL: {a: 10 + swing, b: 16}, armR: reachU > 0.01 ? armR : {a: 10 - swing, b: 16},
    e: roomAstroE(t), bob: walkBob(dist, moving),
  };
  // his reflection on the family photo's glass: his face beside the faces in the print, the window's towers behind him.
  // Drawn over the room (normal blend, cool and translucent), clipped to the glass.
  const ro = St.reflOpRoom(t);
  const G = ROOM.photoFamily.glass;
  const RSp = ROOM.photoFamily.reflSpot;
  const hs = (RSp.r * 1.05) / 58; // his reflected head at the photo faces' size
  const reflNode = ro > 0.001 ? (
    <g>
      <clipPath id={`${k}rgl`}><rect x={G.x} y={G.y} width={G.w} height={G.h} /></clipPath>
      <g clipPath={`url(#${k}rgl)`} opacity={ro}>
        {/* the window behind him, with the changed skyline (towers), reflected around his head */}
        <rect x={RSp.x - RSp.r * 1.7} y={G.y - 2} width={RSp.r * 3.6} height={G.h * 0.58} fill="#CFE6F2" opacity={0.42} />
        {[0, 1, 2].map((i) => <rect key={i} x={RSp.x - RSp.r * 1.5 + i * RSp.r * 1.15} y={G.y + 6 + 8 * (i % 2)} width={RSp.r * 0.45} height={G.h * 0.5} rx={2} fill="#9FC4DA" opacity={0.55} />)}
        <g transform={`translate(${RSp.x} ${RSp.y}) scale(${hs})`}>
          <g opacity={0.92}>
            <Head skin={'#E8D5CF'} hair="spiky" hairColor={'#B9646C'} id={`${k}rh`} cheeks={false} e={{...roomAstroE(Math.max(t, V2.faceTurn + 0.4)), turn: -0.25, lookX: -0.4, lookY: 0.1}} />
          </g>
          <circle cx={HELMET.cx} cy={HELMET.cy} r={HELMET.r} fill="#DCEFFF" opacity={0.16} />
          <circle cx={HELMET.cx} cy={HELMET.cy} r={HELMET.r} fill="none" stroke="#F4FBFF" strokeWidth={7} opacity={0.75} />
        </g>
      </g>
    </g>
  ) : null;
  // his watch beside the photograph (one hour on his wrist; a whole life in the frame)
  const wb = ss(t, V2.watchBeside, V2.watchBeside + 0.35) * (1 - ss(t, V2.photoMove + 0.1, V2.photoMove + 0.5));
  // the pre-departure print: the opening composition in screen coordinates (the room maps 1080x1920 onto the print)
  const photoView = W(St.CAM_CLOSE, hookWorld(0, k + 'pv', true));
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
        <g transform={`translate(${St.FAM.x - 150 + 20 * wb} ${St.FAM.y + 230 - 105 * wb})`}>
          <ForeArm minutes={661 + (t - 15) / 60} secBlur={0} id={`${k}wf`} s={0.3} rot={22} />
        </g>
      )}
    </g>
  );
}
/** the present-day yard through the window: the towers of the changed skyline, his old friend waiting by the gate */
function yardPresentView(t: number, k: string) {
  const sc = St.WIN_SC;
  const cam = {x: 1180, y: 1060, z: 1.0};
  return (
    <g transform={`translate(${St.WIN_CENTRE.x - 540 * sc} ${St.WIN_CENTRE.y - 960 * sc}) scale(${sc})`}>
      {W(cam, (
        <g>
          <YardWorld D={1} season={0.16} t={t} id={`${k}py`} doorOpen={1} gateOpen={1} />
          <g transform={`translate(${TS.fx} ${St.FEET}) scale(${St.YS})`}>
            <Friend age={1} pose={{armL: {a: 10, b: 14}, armR: {a: 10, b: 14}, e: {mouth: 'soft', lookX: 0.6, lookY: -0.1}}} id={`${k}pf`} facing={1} green />
          </g>
        </g>
      ))}
    </g>
  );
}

// ---- 6-9: the yard: decades, the return, the reunion, the way to the door ------------------------------------------------
/** the capsule's glint crossing high overhead and its shadow sweeping over the friend (what makes him look up) */
function overheadSign(t: number) {
  const u = (t - (V2.lightPass - 0.12)) / 0.5;
  if (u <= 0 || u >= 1) return null;
  const sx = lerp(1700, 700, u), sy = lerp(260, 420, u);
  const shx = lerp(1550, 950, u);
  return (
    <g>
      <path d={`M ${sx + 140} ${sy - 30} L ${sx} ${sy}`} stroke="#FFF3D6" strokeWidth={10} strokeLinecap="round" opacity={0.75 * Math.sin(Math.PI * u)} />
      <circle cx={sx} cy={sy} r={14} fill="#FFFBF0" opacity={Math.sin(Math.PI * u)} />
      <ellipse cx={shx} cy={St.FEET + 4} rx={230} ry={26} fill="#162A32" opacity={0.18 * Math.sin(Math.PI * u)} />
    </g>
  );
}
function decadesWorld(t: number, k: string) {
  const f = St.friendYard(t);
  const st = St.yardStage(t);
  const e: Expr = st === 0 ? {mouth: 'soft', lookX: 0.2, lookY: lerp(0.1, -0.9, ss(t, V2.windowCover + 0.15, V2.windowCover + 0.45))} : st === 1 ? {mouth: 'flat', lookX: 0.6, lookY: 0.1} : {mouth: 'soft', lookX: -0.6, lookY: lerp(0.1, -1, ss(t, V2.lookUp, V2.lookUp + 0.2))};
  return (
    <g>
      <YardWorld D={St.yardD(t)} season={St.yardSeason(t)} t={t} id={`${k}yd`} />
      <g transform={`translate(${f.x} ${f.y}) scale(${St.YS * St.depthAt(f.y)})`}>
        <Friend age={f.age} pose={{armL: {a: 8, b: 10}, armR: {a: 8, b: 10}, e, walk: f.walk, stride: f.stride}} id={`${k}fr`} facing={st === 1 ? 1 : -1} green />
      </g>
      {overheadSign(t)}
    </g>
  );
}
function returnWorld(t: number, k: string) {
  const cap = St.capsuleYard(t);
  const look = ss(t, V2.lookUp, V2.lookUp + 0.2);
  const follow = ss(t, V2.descentStart + 0.3, V2.landing);
  const meet = ss(t, V2.stepDown, V2.arrive);
  const fe: Expr = {mouth: meet > 0.5 ? 'o' : 'soft', open: 0.3, lookX: lerp(-0.6, -0.9, follow), lookY: lerp(lerp(0.1, -1, look), 0.15, follow), wide: 0.5 * meet, brows: 0.6 * meet};
  const ax = St.astroReturnX(t);
  const out = t >= V2.stepOut - 0.12;
  const walking = t > V2.stepDown && t < V2.arrive;
  const dist = (ax - St.HATCH_W.x) / St.YS;
  const ae: Expr = {lookX: lerp(0.3, 0.8, meet), lookY: lerp(-0.4, 0.05, ss(t, V2.stepDown, V2.walkToFriend)), wide: 0.35, brows: 0.4 * (1 - meet) + 0.2, mouth: 'soft', turn: 0.2};
  const H = St.HATCH_W;
  return (
    <g>
      <YardWorld D={1} season={0.16} t={t} id={`${k}yd`} />
      <g transform={`translate(${TS.fx} ${St.FEET}) scale(${St.YS})`}>
        <Friend age={1} pose={{armL: {a: 8, b: 10}, armR: {a: 8, b: 10}, e: fe}} id={`${k}fr`} facing={-1} green />
      </g>
      {out && (
        <g>
          <clipPath id={`${k}hc`}><ellipse cx={H.x} cy={H.y} rx={H.rx} ry={H.ry} /><rect x={H.x + H.rx * 0.2} y={-4000} width={8000} height={8000} /></clipPath>
          <g clipPath={t < V2.stepDown + 0.1 ? `url(#${k}hc)` : undefined}>
            <g transform={`translate(${ax} ${St.astroReturnFeet(t)}) scale(${St.YS})`}>
              <Astronaut pose={{armL: {a: 10, b: 14}, armR: {a: 10, b: 14}, e: ae}} id={`${k}as`} frame={Math.round(t * 30)} glove={GLOVE} watchEl={() => null} feet={walkFeet(walking ? dist : 0, walking ? 1 : 0)} />
            </g>
          </g>
        </g>
      )}
      <g transform={`translate(${cap.x} ${cap.y}) scale(${St.CAP_S})`}>
        <Capsule2 t={t} id={`${k}cap`} retro={cap.retro} legs={cap.legs} hatch={cap.hatch} />
      </g>
    </g>
  );
}
const reunionAstroE = (t: number): Expr => {
  // eyes search his face -> recognition arrives (a small smile) -> attention drops to their joined hands (concern)
  const search = ss(t, V2.search, V2.recognise);
  const rec = ss(t, V2.recognise, V2.recognise + 0.18);
  const hands = ss(t, V2.toHands, V2.toHands + 0.2);
  const sacc = search * (1 - rec) * Math.sin((t - V2.search) * 22) * 0.2;
  const mouth: Expr['mouth'] = rec < 0.5 ? 'flat' : hands < 0.5 ? 'smile' : 'flat';
  return {
    lookX: lerp(0.72 + sacc, 0.45, hands), lookY: lerp(-0.08 + sacc * 0.5, 0.9, hands), wide: 0.35 * search * (1 - rec) + 0.1,
    brows: lerp(0.25 * search, 0.5, rec) * (1 - 0.6 * hands), sad: 0.15 * rec + 0.5 * hands, mouth, blink: t > 13.86 && t < 13.93 ? 0.12 : 1,
  };
};
const reunionFriendE = (t: number): Expr => ({mouth: t > V2.recognise - 0.1 ? 'smile' : 'soft', lookX: -0.7, lookY: lerp(0, 0.6, ss(t, V2.toHands + 0.1, V2.toHands + 0.35)), brows: 0.15, sad: 0.25});
function reunionWorld(t: number, k: string) {
  const u = ss(t, V2.arrive - 0.05, V2.clasp);
  return (
    <g>
      <YardWorld D={1} season={0.16} t={t} id={`${k}yd`} />
      <TwoShot age={1} id={`${k}ts`} frame={Math.round(t * 30)} clasp={u} squeeze={ss(t, V2.recognise, V2.recognise + 0.3) * 0.7} astroE={reunionAstroE(t)} friendE={reunionFriendE(t)} />
    </g>
  );
}
function doorWorld(t: number, k: string) {
  const g = ss(t, V2.gesture, V2.gesture + 0.22);
  const a = St.astroDoor(t);
  const ax = a.x;
  const walking = t > V2.walkStart;
  const dist = Math.hypot(ax - TS.ax, a.y - St.FEET) / St.YS;
  const gestureArm = {a: lerp(30, 72, g), b: lerp(30, 10, g)};
  const fe: Expr = {mouth: 'soft', lookX: lerp(-0.7, 0.8, g), lookY: -0.1, turn: 0.3 * g, brows: 0.15, sad: 0.2};
  const ae: Expr = {lookX: lerp(0.45, 0.95, ss(t, V2.gesture + 0.08, V2.gesture + 0.3)), lookY: lerp(0.8, 0, ss(t, V2.gesture, V2.gesture + 0.25)), turn: 0.35 * ss(t, V2.gesture + 0.1, V2.walkStart), sad: 0.35, brows: 0.25, mouth: 'flat'};
  const swing = walking ? Math.sin((Math.PI * dist) / 100) * 14 : 0;
  return (
    <g>
      <YardWorld D={1} season={0.16} t={t} id={`${k}yd`} doorOpen={ss(t, V2.walkStart + 0.2, V2.doorPass)} gateOpen={ss(t, V2.gesture, V2.walkStart + 0.15)} />
      <g transform={`translate(${TS.fx} ${St.FEET}) scale(${St.YS})`}>
        <Friend age={1} pose={{armL: {a: 10, b: 14}, armR: gestureArm, e: fe}} id={`${k}fr`} facing={-1} green />
      </g>
      <g transform={`translate(${ax} ${a.y}) scale(${a.s})`}>
        <Astronaut pose={{armL: {a: 10 + swing, b: 16}, armR: {a: 10 - swing, b: 16}, e: ae, bob: walkBob(dist, walking ? 1 : 0)}} id={`${k}as`} frame={Math.round(t * 30)} glove={GLOVE} watchEl={() => null} feet={walkFeet(dist, walking ? 1 : 0)} />
      </g>
    </g>
  );
}
/** the doorframe passing across the lens: yard on the left of the jamb, the room on the right */
const Jamb: React.FC<{x: number}> = ({x}) => (
  <g>
    <rect x={x - 18} y={-20} width={120} height={1960} fill="#E9DCC3" stroke="#162A32" strokeWidth={6} />
    <rect x={x + 26} y={-20} width={40} height={1960} fill="#C9B79A" />
    <rect x={x - 30} y={-20} width={30} height={1960} fill="#F4EEE2" stroke="#162A32" strokeWidth={6} />
  </g>
);

// ---- captions: heights clear of faces, hands, the watch and the photographs ------------------------------------------------
const capY = (_i: number) => 1716;
const capHide = (i: number) => (i === CAPTIONS.length - 1 ? 22.3 : CAPTIONS[i].hide);

export const Scene2: React.FC<{t: number; fkey: string; captions: boolean}> = ({t, fkey, captions}) => {
  resetIds(fkey);
  let body: React.ReactNode = null;
  let overlay: React.ReactNode = null;
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
  } else if (t < V2.lightPass) {
    body = W(St.camDecades(t), decadesWorld(t, 'E'));
    const cd = St.camDecades(t);
    overlay = <YardFore t={t} camX={cd.x} zoom={St.FG_ZOOM} D={St.yardD(t)} season={St.yardSeason(t)} trunkX={St.FG_TRUNK_X} leavesX={St.FG_LEAVES_X} />;
  } else if (t < V2.arrive) {
    body = W(St.camReturn(t), t < V2.descentStart ? decadesWorld(t, 'E') : returnWorld(t, 'G'));
  } else if (t < V2.gesture) {
    body = W(St.camReturn(t), reunionWorld(t, 'H'));
  } else if (t < V2.doorPass) {
    body = W(St.camDoor(t), doorWorld(t, 'I'));
  } else if (t < V2.doorPassEnd) {
    const xj = St.jambX(t);
    body = (
      <g>
        <clipPath id="jl"><rect x={-10} y={-10} width={xj + 10} height={1940} /></clipPath>
        <clipPath id="jr"><rect x={xj} y={-10} width={1200} height={1940} /></clipPath>
        <g clipPath="url(#jl)">{W(St.camDoor(t), doorWorld(t, 'I'))}</g>
        <g clipPath="url(#jr)">{W(St.camRoom(t), roomPresentWorld(t, 'F'))}</g>
        <Jamb x={xj} />
      </g>
    );
  } else {
    body = W(St.camRoom(t), roomPresentWorld(t, 'F'));
  }
  useImages(urls);
  return (
    <>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        {body}
        {overlay}
      </svg>
      {captions && <Captions2 t={t} y={capY} hide={capHide} />}
    </>
  );
};
export {clamp, TS};
