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
import {Capsule2, HatchFront, Trail} from './craft';
import {Cockpit, CockpitFront, COCKPIT_ASTRO, ForeArm, cockpitBhT, cockpitBhUrls} from './cockpit';
import {cockpitPoseAt, forearmAt, secBlurAtT, watchMinutesAt} from './cockpitShot';
import {Astronaut, Friend, GLOVE} from '../art/figures';
import {useImages} from './preload';
import {Captions2} from './Captions2';
import {CAPTIONS} from '../lib';
import {Expr} from '../art/crew';
import {YardWorld, YardFore, FENCE_Y} from './backgrounds';
import {Room, ROOM} from './room';
import {YardOut, YOUT, NearTrunk} from './yard';
import {walkFeet, walkBob, DOOR_STEP} from './walk';
import {Head} from '../art/crew';
import {GUESSER, HELMET, astroReach, astroHandLocal} from '../art/figures';

const W = (c: Cam, children: React.ReactNode) => <g transform={camT(c)}>{children}</g>;
const bhUrls = (t: number) => {
  const n = bhFrame(t), f4 = String(n).padStart(4, '0');
  return [staticFile(`bh/f_${f4}.jpg`), ...(hasWide(n) ? [staticFile(`bhw/f_${f4}.jpg`)] : [])];
};

// ---- 1-2: the opening two-shot, the gaze to the visor ------------------------------------------------------------------
const hookAstroE = (t: number): Expr => {
  // smile (the photo) -> surprise as his friend ages -> he looks DOWN at the old hand on his glove (concern) -> his gaze
  // rises to the visor with the head (awe, not a smile); his blink goes with the head turn
  const sur = ss(t, 0.14, 0.42) * (1 - ss(t, V2.lookHands - 0.05, V2.lookHands + 0.2));
  const down = St.lookDown(t);
  const up = ss(t, V2.headTurn, V2.headTurn + 0.35);
  const mouth: Expr['mouth'] = t < 0.16 ? 'smile' : sur > 0.4 ? 'o' : up > 0.4 ? 'o' : 'flat';
  return {
    mouth, open: sur > 0.4 ? 0.2 + 0.35 * sur : 0.18 * up,
    wide: 0.75 * sur + 0.4 * up, brows: 0.9 * sur + 0.5 * up - 0.15 * down, sad: 0.5 * down * (1 - up),
    turn: 0.15 * down * (1 - up), lookX: lerp(lerp(0.75, 0.95, down), -0.2, up), lookY: lerp(lerp(0.05, 1, down), -1, up),
    blink: t > V2.headTurn + 0.02 && t < V2.headTurn + 0.09 ? 0.15 : 1,
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
  const view = <g transform={`translate(${St.WIN_CENTRE.x - 540 * sc} ${St.WIN_CENTRE.y - 960 * sc}) scale(${sc})`}>{outPastWorld(t, k + 'wv')}</g>;
  // days racing past: a window-shaped patch of sunlight sweeps the wall once a "day", and the room dims at each "night"
  // (a gentle sweep and a low-amplitude dim, at most ~3 cycles a second: no strobing)
  const dc = St.dayCycle(t);
  const fr = dc.phase - Math.floor(dc.phase);
  const px = lerp(1250, -500, fr);
  const night = 0.5 - 0.5 * Math.cos(2 * Math.PI * dc.phase);
  return (
    <g>
      <Room t={t} id={`${k}rm`} era={0} clockMinutes={St.homeClockMinutes(t)} clockBlur={St.homeClockBlur(t)} windowView={view} glassFade={ss(t, V2.windowPush + 0.02, V2.windowCover - 0.04)} />
      {dc.k > 0.001 && (
        <g>
          <path d={`M ${px} 380 L ${px + 300} 380 L ${px + 120} 1300 L ${px - 180} 1300 Z M ${px + 340} 380 L ${px + 400} 380 L ${px + 220} 1300 L ${px + 160} 1300 Z`} fill="#FFF4D2" opacity={0.2 * dc.k * (1 - night)} />
          <rect x={-400} y={-300} width={2800} height={2800} fill="#1A2342" opacity={0.16 * dc.k * night} />
        </g>
      )}
    </g>
  );
}
/** the view out of the window in the past (YardOut view coords): the young friend on the lawn under the window, waving
 *  up at the sky where the rocket went; the same picture through the glass and, after the push, filling the frame */
function outPastWorld(t: number, k: string) {
  const f = St.OUT_FRIEND;
  const wave = ss(t, V2.windowCover + 0.08, V2.windowCover + 0.28) * (1 - ss(t, V2.wipe1 - 0.18, V2.wipe1 - 0.02));
  const e: Expr = {mouth: wave > 0.3 ? 'smile' : 'soft', lookX: 0.35, lookY: lerp(-0.2, -0.95, ss(t, V2.windowPush, V2.windowCover + 0.2))};
  return (
    <YardOut D={St.yardD(t)} season={St.yardSeason(t)} t={t} id={`${k}yo`}
      onLawn={
        <g transform={`translate(${f.x} ${f.y}) scale(${f.s})`}>
          <Friend age={0.06 + 0.05 * ss(t, V2.windowCover, V2.wipe1)} pose={{armL: {a: 8, b: 10}, armR: {a: lerp(8, 150, wave), b: lerp(10, 22 + 18 * Math.sin((t - V2.windowCover) * 15), wave)}, e}} id={`${k}yf`} facing={1} green />
        </g>
      } />
  );
}
/** the view out of the window in the present: the towers across the road, the capsule parked in the street, his old
 *  friend waiting at the open gate */
function outPresentWorld(t: number, k: string) {
  const C = YOUT.capsule;
  return (
    <YardOut D={1} season={0.16} t={t} id={`${k}po`} gateOpen={1}
      beyondFence={
        <g>
          <g transform={`translate(${C.x} ${C.y}) scale(${C.s})`}><Capsule2 t={t} id={`${k}pc`} legs={1} hatch={1} /></g>
          <g transform={`translate(${YOUT.gateX} ${YOUT.fenceY - 6}) scale(${St.YS * 0.92})`}>
            <Friend age={1} pose={{armL: {a: 10, b: 14}, armR: {a: 10, b: 14}, e: {mouth: 'soft', lookX: 0.1, lookY: -0.1}}} id={`${k}pf`} facing={1} green />
          </g>
        </g>
      } />
  );
}

// ---- 10-12: the family room, present -----------------------------------------------------------------------------------------
const roomAstroE = (t: number): Expr => {
  // he notices the photographs, reaches, wipes; then turns three-quarters to the family photo, brows knitted, mouth
  // trembling, eyes on the print (not on the camera) as the camera moves past his shoulder
  const look = ss(t, V2.notice - 0.1, V2.notice + 0.2);
  const face = ss(t, V2.faceTurn - 0.05, V2.faceTurn + 0.3);
  const grief = ss(t, V2.faceTurn, V2.faceTurn + 0.4);
  return {
    turn: lerp(lerp(0.3, 0.45, look), 0.5, face), lookX: lerp(lerp(0.5, 0.85, look), 0.9, face), lookY: lerp(lerp(0, 0.15, look), 0.22, face),
    wide: 0.3 * look * (1 - grief), brows: lerp(0.25 * look, 0.35, grief), sad: lerp(0.25 * look, 0.8, grief),
    mouth: grief > 0.35 ? 'tremble' : 'flat', blink: t > 16.5 && t < 16.57 ? 0.12 : 1,
  };
};
const HEAD_Y_RIG = -372;
/** his reflected face: grief as he finds the family; a slow blink; it settles to understanding (no smile); his eyes drop to the watch */
const reflE = (t: number): Expr => {
  // grief as he finds them; a slow blink; his eyes go to his younger self in the print (left); brows relax, mouth flat
  // (understanding, no smile); his eyes drop to the watch
  const toSelf = ss(t, 18.85, 19.25) * (1 - ss(t, 19.75, 20.05));
  const settle = ss(t, 19.45, 20.0);
  const toWatch = ss(t, V2.watchBeside - 0.25, V2.watchBeside + 0.15);
  return {
    turn: -0.12 * toSelf, lookX: lerp(lerp(0.15, -0.85, toSelf), 0.3, toWatch), lookY: lerp(lerp(0.12, 0.05, toSelf), 0.75, toWatch),
    sad: lerp(0.85, 0.28, settle), brows: lerp(0.3, -0.12, settle), mouth: settle < 0.4 ? 'tremble' : 'flat',
    blink: (t > 18.5 && t < 18.66) || (t > 19.95 && t < 20.02) ? 0.1 : 1,
  };
};
/** his small nod as it settles (reflection px, room units) */
const reflNod = (t: number) => 5 * Math.sin(Math.PI * clamp((t - 19.62) / 0.36));
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
  // his reflection on the family photo's glass: the astronaut himself (helmet, collar, shoulders) at reflection scale,
  // screen-blended so it adds light like real glass: bright over the print's dark hedge, faint over the light sky and faces.
  const ro = St.reflOpRoom(t);
  const G = ROOM.photoFamily.glass;
  const RSp = ROOM.photoFamily.reflSpot;
  const hs = St.REFL_S;
  const rb = 1.6 * Math.sin(t * 2.4); // breathing
  // parallax: the reflection drifts a little against the print as the camera moves (it is not printed on it)
  const px = -0.16 * (St.camRoom(t).x - St.FAM.x);
  const reflNode = ro > 0.001 ? (
    <g>
      <clipPath id={`${k}rgl`}><rect x={G.x} y={G.y} width={G.w} height={G.h} /></clipPath>
      <g style={{mixBlendMode: 'screen'}} opacity={ro}><g clipPath={`url(#${k}rgl)`}>
        {/* the room's window reflected behind him: a pale pane with its mullion and transom, the towers in it */}
        <g transform={`translate(${px} 0)`}>
          <rect x={RSp.x - 30} y={G.y - 4} width={96} height={G.h * 0.62} fill="#8FA7B6" opacity={0.42} />
          {[0, 1, 2].map((i) => <rect key={i} x={RSp.x - 22 + i * 30} y={G.y + 14 + 9 * (i % 2)} width={12} height={G.h * 0.48} rx={2} fill="#A9C2D2" opacity={0.55} />)}
          <rect x={RSp.x + 16} y={G.y - 4} width={5} height={G.h * 0.62} fill="#C9D7E0" opacity={0.6} />
          <rect x={RSp.x - 30} y={G.y + G.h * 0.24} width={96} height={4} fill="#C9D7E0" opacity={0.6} />
        </g>
        <g transform={`translate(${RSp.x + St.REFL_DX + px} ${RSp.y + St.REFL_DY - HEAD_Y_RIG * hs + rb + reflNod(t)}) scale(${hs})`}>
          <Astronaut pose={{armL: {a: 6, b: 8}, armR: {a: 6, b: 8}, e: reflE(t)}} id={`${k}ra`} frame={Math.round(t * 30)} glove={GLOVE} watchEl={() => null} shadow={false} />
        </g>
      </g></g>
    </g>
  ) : null;
  // his watch beside the photograph (one hour on his wrist; a whole life in the frame)
  const wb = ss(t, V2.watchBeside, V2.watchBeside + 0.35) * (1 - ss(t, V2.photoMove + 0.1, V2.photoMove + 0.5));
  // the pre-departure print: the opening composition in screen coordinates (the room maps 1080x1920 onto the print)
  const photoView = W(St.CAM_CLOSE, hookWorld(0, k + 'pv', true));
  return (
    <g>
      <Room t={t} id={`${k}rm`} era={1} clockMinutes={661 + (t - 15) / 60} dustWipe={w / St.WIPE_MAX > 0.999 ? 1 : w} photoView={photoView} photoTint={St.printTint(t)} photoGlass={St.printGlass(t)} windowView={<g transform={`translate(${St.WIN_CENTRE.x - 540 * St.WIN_SC} ${St.WIN_CENTRE.y - 960 * St.WIN_SC}) scale(${St.WIN_SC})`}>{outPresentWorld(t, k + 'wv')}</g>} />
      {reflNode}
      {(t < V2.photoClose + 0.35) && (
        <g transform={`translate(${x - St.passOffset(t)} ${ROOM.floor}) scale(${St.RS})`}>
          <Astronaut pose={pose} id={`${k}as`} frame={Math.round(t * 30)} glove={GLOVE} watchEl={() => null} feet={walkFeet(dist, moving)} />
        </g>
      )}
      {wb > 0.001 && (
        <g transform={`translate(${St.WATCH_BESIDE.x - 150 * (1 - wb)} ${St.WATCH_BESIDE.y + 120 * (1 - wb)})`}>
          <ForeArm minutes={661 + (t - 15) / 60} secBlur={0} id={`${k}wf`} s={St.WATCH_BESIDE.s} rot={St.WATCH_BESIDE.rot} />
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
  const u = (t - (V2.lightPass - 0.1)) / 0.42;
  if (u <= 0 || u >= 1) return null;
  const sx = lerp(1700, 700, u), sy = lerp(260, 420, u);
  const shx = lerp(1550, 950, u);
  const k = Math.sin(Math.PI * u);
  // the returning capsule's shadow sweeps over the yard and over him (a broad soft band, ~20% darker), with a glint above
  const bx = lerp(2000, 300, u);
  return (
    <g>
      <defs>
        <linearGradient id="ovh-band" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#14222B" stopOpacity={0} />
          <stop offset="0.5" stopColor="#14222B" stopOpacity={1} />
          <stop offset="1" stopColor="#14222B" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={bx - 420} y={-600} width={840} height={2800} fill="url(#ovh-band)" opacity={0.24 * k} />
      <ellipse cx={shx} cy={St.FEET + 4} rx={330} ry={34} fill="#162A32" opacity={0.22 * k} />
      <path d={`M ${sx + 160} ${sy - 34} L ${sx} ${sy}`} stroke="#FFF3D6" strokeWidth={12} strokeLinecap="round" opacity={0.85 * k} />
      <circle cx={sx} cy={sy} r={18} fill="#FFFBF0" opacity={k} />
      <circle cx={sx} cy={sy} r={40} fill="#FFF3D6" opacity={0.35 * k} />
    </g>
  );
}
function decadesWorld(t: number, k: string) {
  const f = St.friendYard(t);
  const st = St.yardStage(t);
  const e: Expr = st === 0 ? {mouth: 'soft', lookX: 0.2, lookY: lerp(0.1, -0.9, ss(t, V2.windowCover + 0.15, V2.windowCover + 0.45))} : st === 1 ? {mouth: 'flat', lookX: 0.6, lookY: 0.1} : {mouth: ss(t, V2.lookUp, V2.lookUp + 0.15) > 0.5 ? 'o' : 'soft', open: 0.25, lookX: lerp(-0.6, -0.2, ss(t, V2.lookUp - 0.04, V2.lookUp + 0.16)), lookY: lerp(0.1, -1, ss(t, V2.lookUp - 0.04, V2.lookUp + 0.16)), brows: 0.6 * ss(t, V2.lookUp - 0.04, V2.lookUp + 0.16), wide: 0.4 * ss(t, V2.lookUp, V2.lookUp + 0.16)};
  // the young friend waves up at the sky, where the rocket went (stage A); later stages keep their arms down
  const wave = st === 0 ? ss(t, V2.windowCover + 0.12, V2.windowCover + 0.32) * (1 - ss(t, V2.wipe1 - 0.2, V2.wipe1 - 0.04)) : 0;
  const waveArm = {a: lerp(8, 150, wave), b: lerp(10, 22 + 18 * Math.sin((t - V2.windowCover) * 15), wave)};
  const fig = (
    <g transform={`translate(${f.x} ${f.y}) scale(${St.YS * St.depthAt(f.y)})`}>
      <Friend age={f.age} pose={{armL: {a: 8, b: 10}, armR: waveArm, e, walk: f.walk, stride: f.stride, lean: st === 2 ? -6 * ss(t, V2.lookUp - 0.04, V2.lookUp + 0.16) : 0}} id={`${k}fr`} facing={st === 1 ? 1 : -1} green />
    </g>
  );
  const behind = f.y < FENCE_Y;
  return (
    <g>
      <YardWorld D={St.yardD(t)} season={St.yardSeason(t)} t={t} id={`${k}yd`} layer="back" gateOpen={st === 2 ? 1 : 0} />
      {behind && fig}
      <YardWorld D={St.yardD(t)} season={St.yardSeason(t)} t={t} id={`${k}yf`} layer="front" gateOpen={st === 2 ? 1 : 0} />
      {!behind && fig}
      {overheadSign(t)}
    </g>
  );
}
function returnWorld(t: number, k: string) {
  const cap = St.capsuleYard(t);
  const look = ss(t, V2.lookUp, V2.lookUp + 0.2);
  const follow = ss(t, V2.descentStart + 0.3, V2.landing);
  const meet = ss(t, V2.stepDown + 0.12, V2.arrive);
  // the landing's blast: he leans back and half-turns from it (12.1-12.45)
  const blast = ss(t, V2.landing - 0.22, V2.landing) * (1 - ss(t, V2.landing + 0.12, V2.landing + 0.4));
  const fe: Expr = {mouth: meet > 0.5 ? 'o' : 'soft', open: 0.3, lookX: lerp(-0.6, -0.9, follow), lookY: lerp(lerp(0.1, -1, look), 0.15, follow), wide: 0.5 * meet + 0.3 * blast, brows: 0.6 * meet + 0.4 * blast, blink: blast > 0.6 ? 0.25 : 1};
  const ax = St.astroReturnX(t);
  const out = t >= V2.hatch + 0.05;
  const walking = t > V2.stepDown && t < V2.arrive;
  const dist = (ax - St.HATCH_W.x) / St.YS;
  // he looks up at the house and the changed street (recognition) before his eyes find his friend
  const house = ss(t, V2.stepDown - 0.04, V2.stepDown + 0.06) * (1 - ss(t, V2.stepDown + 0.2, V2.stepDown + 0.32));
  const ae: Expr = {lookX: lerp(lerp(0.3, 0.55, house), 0.8, meet), lookY: lerp(lerp(-0.2, -0.9, house), 0.05, meet), wide: 0.35 + 0.3 * house, brows: 0.3 + 0.35 * house, mouth: house > 0.5 ? 'o' : 'soft', open: 0.2, turn: 0.2};
  const H = St.HATCH_W;
  const astro = out ? (
    <g transform={`translate(${ax} ${St.astroReturnFeet(t)}) scale(${St.YS})`}>
      <Astronaut pose={{armL: {a: 10, b: 14}, armR: {a: 10, b: 14}, e: ae}} id={`${k}as`} frame={Math.round(t * 30)} glove={GLOVE} watchEl={() => null} feet={walkFeet(walking ? dist : 0, walking ? 1 : 0)} shadow={!St.inHatch(t)} />
    </g>
  ) : null;
  const capT = `translate(${cap.x} ${cap.y}) scale(${St.CAP_S})`;
  // contact shadow under the descending capsule, growing and darkening into the touchdown
  const sh = ss(t, V2.descentStart, V2.landing);
  // touchdown: a puff of dust and petals at the leg pads
  const puff = clamp((t - V2.landing) / 0.4);
  return (
    <g>
      <YardWorld D={1} season={0.16} t={t} id={`${k}yd`} gateOpen={1} />
      {t > V2.descentStart && <ellipse cx={St.LAND.x} cy={St.LAND.y + 4} rx={lerp(60, 260, sh)} ry={lerp(10, 34, sh)} fill="#1B2A33" opacity={0.08 + 0.22 * sh} />}
      <g transform={capT}>
        <Capsule2 t={t} id={`${k}cap`} retro={cap.retro} legs={cap.legs} hatch={cap.hatch} />
      </g>
      {puff > 0 && puff < 1 && [-1, 1].map((sd) => [0, 1, 2, 3].map((q) => {
        const px = St.LAND.x + sd * (190 + 40 * q * puff), py = St.LAND.y + 10 - 26 * q * puff * (1 - 0.4 * q);
        return <circle key={`${sd}${q}`} cx={px} cy={py} r={(18 + 10 * q) * (0.4 + puff)} fill={q === 3 ? '#F4B7C8' : '#D8D2C6'} opacity={0.55 * (1 - puff)} />;
      }))}
      {St.inHatch(t) && astro && (
        <g>
          <clipPath id={`${k}hc`}><ellipse cx={H.x} cy={H.y} rx={H.rx - 3} ry={H.ry - 3} /></clipPath>
          <g clipPath={`url(#${k}hc)`}>{astro}</g>
          <g transform={capT}><HatchFront hatch={cap.hatch} /></g>
        </g>
      )}
      {!St.inHatch(t) && astro}
      <g transform={`translate(${TS.fx} ${St.FEET}) scale(${St.YS})`}>
        <Friend age={1} pose={{armL: {a: 8, b: 10}, armR: {a: 8, b: 10}, e: fe, lean: -5 * blast}} id={`${k}fr`} facing={-1} green />
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
  // the friend reaches for the glove (~8 frames), holds, and lets go just before his gesture to the door (~6 frames)
  const u = ss(t, V2.arrive - 0.12, V2.clasp + 0.02) * (1 - ss(t, V2.gesture - 0.2, V2.gesture));
  return (
    <g>
      <YardWorld D={1} season={0.16} t={t} id={`${k}yd`} gateOpen={1} />
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
  const gestureArm = {a: lerp(6, 72, g), b: lerp(8, 10, g)}; // from the rest pose the release ends in
  const fe: Expr = {mouth: 'soft', lookX: lerp(-0.7, 0.8, g), lookY: -0.1, turn: 0.3 * g, brows: 0.15, sad: 0.2};
  // up the path he turns toward the door (face to the side: walking away, not backing in)
  const away = ss(t, V2.walkStart + 0.15, V2.walkStart + 0.4);
  const ae: Expr = {lookX: lerp(lerp(0.45, 0.95, ss(t, V2.gesture + 0.08, V2.gesture + 0.3)), 1, away), lookY: lerp(lerp(0.8, 0, ss(t, V2.gesture, V2.gesture + 0.25)), -0.2, away), turn: lerp(0.35 * ss(t, V2.gesture + 0.1, V2.walkStart), 0.9, away), sad: 0.35, brows: 0.25, mouth: 'flat'};
  const swing = walking && t < V2.atDoor ? Math.sin((Math.PI * dist) / DOOR_STEP) * 18 : 0;
  // at the porch his right glove pushes the door; it swings in
  const push = ss(t, V2.atDoor - 0.14, V2.atDoor) * (1 - ss(t, V2.doorPass, V2.doorPassEnd));
  const astroBehind = a.y < FENCE_Y;
  const yd = {D: 1, season: 0.16, t, doorOpen: ss(t, V2.atDoor - 0.08, V2.doorPass + 0.04), gateOpen: 1};
  const astro = (
      <g transform={`translate(${ax} ${a.y}) scale(${a.s})`}>
        <Astronaut pose={{armL: {a: 10 + swing, b: 16}, armR: {a: lerp(10 - swing, -95, push), b: lerp(16, 30, push)}, e: ae, bob: walkBob(dist, walking ? 1 : 0, DOOR_STEP)}} id={`${k}as`} frame={Math.round(t * 30)} glove={GLOVE} watchEl={() => null} feet={walkFeet(dist, walking ? 1 : 0, DOOR_STEP)} />
      </g>
  );
  // draw order: the friend stays in front of the astronaut throughout (as in the two-shot), so nothing flips
  return (
    <g>
      <YardWorld {...yd} id={`${k}yd`} layer="back" />
      {astroBehind && astro}
      <YardWorld {...yd} id={`${k}yf`} layer="front" />
      {!astroBehind && astro}
      <g transform={`translate(${TS.fx} ${St.FEET}) scale(${St.YS})`}>
        <Friend age={1} pose={{armL: {a: 6, b: 8}, armR: gestureArm, e: fe}} id={`${k}fr`} facing={-1} green />
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
// 'And when you finally returned,' rides the top band: the tilt up to the returning capsule carries the elderly friend's
// face down through the bottom band
const capY = (i: number) => (i === 5 ? 330 : 1716);
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
    const cd = St.camDecades(t);
    body = St.yardStage(t) === 0 ? W(St.camOut(t), outPastWorld(t, 'E')) : W(cd, decadesWorld(t, 'E'));
    const nx = St.nearTrunkX(t);
    overlay = (
      <g>
        <YardFore t={t} camX={cd.x} zoom={St.FG_ZOOM} D={St.yardD(t)} season={St.fgSeason(t)} trunkX={St.FG_TRUNK_X} leavesX={St.FG_LEAVES_X} />
        {nx > -800 && nx < 1880 && <NearTrunk cx={nx} D={St.yardD(t)} season={0.2} id={`${fkey}nt`} />}
      </g>
    );
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
        <clipPath id={`${fkey}jl`}><rect x={-10} y={-10} width={xj + 10} height={1940} /></clipPath>
        <clipPath id={`${fkey}jr`}><rect x={xj} y={-10} width={1200} height={1940} /></clipPath>
        <g clipPath={`url(#${fkey}jl)`}>{W(St.camDoor(t), doorWorld(t, 'I'))}</g>
        <g clipPath={`url(#${fkey}jr)`}>{W(St.camRoom(t), roomPresentWorld(t, 'F'))}</g>
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
