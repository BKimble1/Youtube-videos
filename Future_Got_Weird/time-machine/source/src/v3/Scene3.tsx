// V3: one frame of the film. Segments in order; each hands over on something visible on screen.
import React from 'react';
import {staticFile} from 'remotion';
import {clamp, lerp, ss} from '../lib';
import {resetIds} from '../core/ids';
import {camT, Cam} from '../story';
import {BlackHole, bhFrame, hasWide} from '../art/space';
import {Capsule2, HatchFront, CAPSULE2} from '../v2/craft';
import {Cockpit, CockpitFront, COCKPIT_ASTRO, Watch2, hourMinutes, secBlurAt} from '../v2/cockpit';
import {Astronaut, Friend, GLOVE, astroReach, ArmA} from '../art/figures';
import {Expr, InkK, INK} from '../art/crew';
import {Room, ROOM} from '../v2/room';
import {Yard, YARD, YardOut, YOUT} from '../v2/yard';
import {walkFeet, walkBob, DOOR_STEP} from '../v2/walk';
import {useImages} from '../v2/preload';
import {Captions2} from '../v2/Captions2';
import {CAPTIONS} from '../lib';
import * as S from './story';
import {T3, bhT3, spaceTau} from './timing';

const W = (c: Cam, n: React.ReactNode) => <g transform={camT(c)}>{n}</g>;
/** the V3 room is drawn mirrored about the window's centre; this group is its own inverse */
const Mirror: React.FC<{children: React.ReactNode}> = ({children}) => <g transform={`translate(${S.MIRROR_X} 0) scale(-1 1)`}>{children}</g>;
const bhUrls = (bt: number) => {
  const n = bhFrame(bt), f4 = String(n).padStart(4, '0');
  return [staticFile(`bh/f_${f4}.jpg`), ...(hasWide(n) ? [staticFile(`bhw/f_${f4}.jpg`)] : [])];
};
const REST_R: ArmA = {a: 14, b: 18};

/** his watch: one compressed hour in the cockpit (10:00 -> 11:00), then real time */
const watchMinutes = (t: number) => {
  const u = (t - T3.hourStart) / (T3.hourEnd - T3.hourStart);
  if (t < T3.hourStart) return 600 + (t - T3.hourStart) / 60;
  if (t <= T3.hourEnd) return hourMinutes(u);
  return 660 + (t - T3.hourEnd) / 60;
};
const watchEl = (t: number, k: string) => (p: {x: number; y: number; angle: number}) => (
  <g transform={`translate(${p.x} ${p.y}) rotate(${S.watchRot(p.angle)})`}>
    <Watch2 r={S.WATCH_R} minutes={watchMinutes(t)} id={`${k}w`} secBlur={t > T3.hourStart && t < T3.hourEnd ? secBlurAt((t - T3.hourStart) / (T3.hourEnd - T3.hourStart), T3.hourEnd - T3.hourStart) : 0} />
  </g>
);

// ---- 1-2 space --------------------------------------------------------------------------------------------------------
function spaceWorld(t: number, k: string, cam: Cam) {
  const tau = spaceTau(t);
  const p = S.shipPos(tau), rot = S.shipRot(tau);
  const winPx = S.WIN_R * cam.z;
  const showCabin = winPx > 34;
  return (
    <g>
      <BlackHole t={bhT3(t)} />
      <g transform={`translate(${p.x} ${p.y}) rotate(${rot}) scale(${S.SM})`}>
        <Capsule2 t={t} id={`${k}cap`} flame={0.8} glow={1}
          win={showCabin ? (
            <g>
              <g transform={`translate(0 ${CAPSULE2.win.y}) scale(${CAPSULE2.win.r / S.COCKPIT_VIEW.r}) translate(${-S.COCKPIT_VIEW.x} ${-S.COCKPIT_VIEW.y})`}>{cockpitWorld(t, k + 'ck', 1)}</g>
              {/* far away the cabin reads as a lit porthole; it resolves as we close in */}
              <circle cx={0} cy={CAPSULE2.win.y} r={CAPSULE2.win.r + 6} fill="#13213A" opacity={0.75 * (1 - ss(winPx, 40, 150))} />
            </g>
          ) : undefined} />
      </g>
    </g>
  );
}

// ---- 3-4 cockpit -------------------------------------------------------------------------------------------------------
function cockpitWorld(t: number, k: string, z: number) {
  const A = COCKPIT_ASTRO;
  const inCockpit = t >= T3.windowIn - 0.6 && t < T3.match;
  const armL = inCockpit ? S.cockpitArm(t) : {a: 16, b: 8};
  const raised = clamp((t - T3.raise) / (T3.raiseEnd - T3.raise));
  const e: Expr = inCockpit ? S.cockpitFace(t) : S.cockpitFace(4.3);
  return (
    <g>
      <Cockpit t={t} id={`${k}ck`} bhT={bhT3(t)} />
      <InkK.Provider value={S.inkFor(z)}>
        <g transform={`translate(${A.x} ${A.y}) scale(${A.s})`}>
          <Astronaut pose={{armL, armR: REST_R, e, frontL: raised > 0.25}} id={`${k}as`} frame={Math.round(t * 30)} glove={GLOVE} watchEl={watchEl(t, k)} shadow={false} />
        </g>
      </InkK.Provider>
      <CockpitFront t={t} id={`${k}cf`} />
    </g>
  );
}

// ---- 5 the room, past: the wall clock races; the window (the garden through the glass) ---------------------------------
const WSC = ROOM.win.h / 1920;
const inWindow = (n: React.ReactNode) => <g transform={`translate(${ROOM.win.cx - 540 * WSC} ${ROOM.win.cy - 960 * WSC}) scale(${WSC})`}>{n}</g>;
function outPast(t: number, k: string) {
  return (
    <YardOut D={0.05} season={0.06} t={t} id={`${k}yo`}
      beyondFence={
        // on the pavement just beyond the fence, right of the gate seen from the street (left of it from the house),
        // kept clear of the window's centre bar
        <g transform={`translate(425 ${YOUT.fenceY - 26}) scale(${S.YS * 0.96})`}>
          <Friend age={0.05} pose={{armL: {a: 8, b: 10}, armR: {a: 8, b: 10}, e: {mouth: 'soft', lookX: 0.3, lookY: -0.3}}} id={`${k}yf`} facing={1} green />
        </g>
      } />
  );
}
function roomPastWorld(t: number, k: string) {
  return (
    <Mirror>
      <Room t={t} id={`${k}rm`} era={0} clockMinutes={S.homeClockMinutes(t)} clockBlur={S.homeClockBlur(t)} windowView={<Mirror>{inWindow(outPast(t, k))}</Mirror>} v3={{doorOpen: 0, candle: 0, photo: false}} />
    </Mirror>
  );
}

// ---- 6-9 the garden and the house front -------------------------------------------------------------------------------
const friendYardFace = (t: number): Expr => {
  // waiting: now and then he looks up at the sky; at the return he follows the capsule down, then meets his friend
  const up1 = ss(t, 9.85, 9.98) * (1 - ss(t, 10.18, 10.32));
  const up2 = ss(t, 10.72, 10.85) * (1 - ss(t, 11.0, 11.12));
  const look = ss(t, T3.descent - 0.15, T3.descent + 0.1);
  const follow = ss(t, T3.descent + 0.3, T3.landing);
  const meet = ss(t, T3.stepDown + 0.1, T3.arrive);
  const rec = ss(t, T3.recognise + 0.1, T3.recognise + 0.4);
  const upAll = Math.max(up1, up2, look * (1 - follow));
  return {
    mouth: rec > 0.5 ? 'smile' : meet > 0.5 ? 'soft' : 'soft', lookX: lerp(lerp(-0.25, -0.15, upAll), -0.75, Math.max(follow, meet)),
    lookY: lerp(lerp(0.1, -0.95, upAll), 0.05, Math.max(follow * 0.6, meet)), brows: 0.35 * look * (1 - meet) + 0.25 * meet * (1 - rec) + 0.1 * rec,
    sad: 0.25 * rec, turn: -0.3 * meet, wide: 0.3 * look * (1 - meet),
  };
};
function yardWorld(t: number, k: string) {
  const D = S.yardD(t), season = S.yardSeason(t);
  const cap = S.capsuleYard(t);
  const age = S.friendAge(t);
  const door = t > T3.turnToHouse;
  const a = S.astroDoor(t);
  const doorOpen = ss(t, T3.atDoor - 0.12, T3.atDoor + 0.1);
  // the astronaut: hatch -> road -> his friend -> (later) up the path, seen from behind
  let astro: React.ReactNode = null;
  let astroBehind = false;
  if (t >= T3.hatch + 0.05 && !door) {
    const ax = S.astroReturnX(t);
    const walking = t > T3.stepOut + 0.04 && t < T3.arrive;
    const settle = 1 - ss(t, T3.arrive - 0.18, T3.arrive);
    const dist = (ax - S.HATCH_W.x) / S.YS + 40 * ss(t, T3.stepOut + 0.04, T3.stepDown);
    const house = ss(t, T3.stepDown - 0.04, T3.stepDown + 0.06) * (1 - ss(t, T3.stepDown + 0.22, T3.stepDown + 0.34));
    const meet = ss(t, T3.stepDown + 0.15, T3.arrive);
    const search = ss(t, T3.faces + 0.1, T3.recognise) * (1 - ss(t, T3.recognise, T3.recognise + 0.15));
    const rec = ss(t, T3.recognise, T3.recognise + 0.25);
    const sacc = search * Math.sin((t - T3.faces) * 20) * 0.18;
    const ae: Expr = {
      lookX: lerp(lerp(0.3, 0.55, house), 0.75 + sacc, meet), lookY: lerp(lerp(-0.2, -0.9, house), -0.06 + sacc * 0.5, meet),
      wide: 0.35 + 0.3 * house + 0.15 * search - 0.2 * rec, brows: 0.3 + 0.35 * house + 0.2 * search + 0.15 * rec, sad: 0.4 * rec,
      mouth: house > 0.5 ? 'o' : rec > 0.5 ? 'flat' : 'soft', open: 0.2, turn: 0.25 * meet, blink: t > T3.recognise + 0.3 && t < T3.recognise + 0.37 ? 0.15 : 1,
    };
    const el = (
      <g transform={`translate(${ax} ${S.astroReturnFeet(t)}) scale(${S.YS})`}>
        <Astronaut pose={{armL: {a: 9, b: 12}, armR: {a: 9, b: 12}, e: ae}} id={`${k}as`} frame={Math.round(t * 30)} glove={GLOVE} watchEl={watchEl(t, k + 'a')} feet={walkFeet(walking ? dist : 0, walking ? settle : 0)} shadow={!S.inHatch(t)} />
      </g>
    );
    if (S.inHatch(t)) {
      const H = S.HATCH_W;
      astro = (
        <g>
          <clipPath id={`${k}hc`}><ellipse cx={H.x} cy={H.y} rx={H.rx - 3} ry={H.ry - 3} /></clipPath>
          <g clipPath={`url(#${k}hc)`}>{el}</g>
          <g transform={`translate(${cap.x} ${cap.y}) scale(${S.CAP_S})`}><HatchFront hatch={cap.hatch} /></g>
        </g>
      );
    } else astro = el;
  } else if (door) {
    const walking = t > T3.turnToHouse + 0.12;
    const dist = Math.hypot(a.x - S.ASTRO_MEET_X, a.y - S.FEET) / S.YS;
    const away = ss(t, T3.turnToHouse + 0.2, T3.turnToHouse + 0.4);
    const swing = walking && t < T3.atDoor ? Math.sin((Math.PI * dist) / DOOR_STEP) * 16 : 0;
    const push = ss(t, T3.atDoor - 0.16, T3.atDoor) * (1 - ss(t, T3.atDoor + 0.12, T3.inside));
    const latch = astroReach((YARD.door.x + 16 - a.x) / a.s, (YARD.door.y0 + 162 - a.y) / a.s, -1, 1);
    const ae: Expr = {lookX: 0.8, lookY: -0.1, turn: lerp(0.25, 0.9, away), sad: 0.3, brows: 0.25, mouth: 'flat'};
    astroBehind = a.y < 1588;
    astro = (
      <g transform={`translate(${a.x} ${a.y}) scale(${a.s})`}>
        <Astronaut pose={{armL: push > 0.01 ? {a: lerp(9 + swing, latch.a, push), b: lerp(14, latch.b, push)} : {a: 9 + swing, b: 14}, armR: {a: 9 - swing, b: 14}, e: ae, bob: walkBob(dist, walking ? 1 : 0, DOOR_STEP), frontL: push > 0.01}} id={`${k}ad`} frame={Math.round(t * 30)} glove={GLOVE} watchEl={watchEl(t, k + 'd')} feet={walkFeet(dist, walking && t < T3.atDoor + 0.05 ? 1 : 0, DOOR_STEP)} back={away > 0.5} />
      </g>
    );
  }
  // the friend: in the same place all through the years, ageing; at the return he leans back from the blast
  const blast = ss(t, T3.landing - 0.22, T3.landing) * (1 - ss(t, T3.landing + 0.12, T3.landing + 0.4));
  const fe: Expr = door ? {mouth: 'soft', lookX: lerp(-0.75, 0.6, ss(t, T3.turnToHouse, T3.turnToHouse + 0.3)), lookY: -0.05, turn: 0.2, sad: 0.25} : friendYardFace(t);
  const friend = (
    <g transform={`translate(${S.FRIEND_X} ${S.FEET}) scale(${S.YS})`}>
      <Friend age={age} pose={{armL: {a: 7, b: 9}, armR: {a: 7, b: 9}, e: fe, lean: -8 * blast, bob: 1.2 * Math.sin(t * 2.2)}} id={`${k}fr`} facing={-1} green />
    </g>
  );
  const puff = clamp((t - T3.landing) / 0.45);
  const sh = ss(t, T3.descent, T3.landing);
  const yd = {D, season, t, v3: true, gateOpen: t > T3.descent ? 0.62 : 0, doorOpen};
  return (
    <g>
      <Yard {...yd} id={`${k}yd`} layer="back" />
      {astroBehind && astro}
      <Yard {...yd} id={`${k}yf`} layer="front" />
      {t > T3.descent && <ellipse cx={S.LAND.x} cy={S.LAND.y + 4} rx={lerp(60, 250, sh)} ry={lerp(10, 32, sh)} fill="#1B2A33" opacity={0.08 + 0.2 * sh} />}
      {t > T3.descent - 0.1 && (
        <g transform={`translate(${cap.x} ${cap.y}) scale(${S.CAP_S})`}>
          <Capsule2 t={t} id={`${k}cap`} retro={cap.retro} legs={cap.legs} hatch={cap.hatch} />
        </g>
      )}
      {puff > 0 && puff < 1 && [-1, 1].map((sd) => [0, 1, 2, 3, 4].map((q) => {
        const reach = 140 + 250 * (1 - (1 - puff) * (1 - puff));
        const px = S.LAND.x + sd * (reach * (0.45 + 0.14 * q)), py = S.LAND.y + 8 - 10 * q * puff;
        return <ellipse key={`${sd}${q}`} cx={px} cy={py} rx={(28 + 9 * q) * (0.6 + puff)} ry={(17 + 5 * q) * (0.6 + 0.6 * puff)} fill={q % 2 ? '#CFC6B6' : '#BDB3A2'} stroke={INK} strokeWidth={2.5} opacity={0.9 * (1 - ss(puff, 0.45, 1))} />;
      }))}
      {!astroBehind && astro}
      {friend}
    </g>
  );
}

// ---- 10-12 the room, present ------------------------------------------------------------------------------------------
function outPresent(t: number, k: string, ship = true) {
  const C = {x: 255, y: 1258, s: 0.36};
  return (
    <YardOut D={1} season={0.12} t={t} id={`${k}po`} gateOpen={1}
      beyondFence={ship ? <g transform={`translate(${C.x} ${C.y}) scale(${C.s})`}><Capsule2 t={t} id={`${k}pc`} legs={1} hatch={1} /></g> : undefined} />
  );
}
/** the doorway looks out on the garden (a 1080x1920 view of YardOut scaled into the door opening) */
function doorOutside(t: number, k: string) {
  const x0 = S.DOOR3.x0, x1 = S.DOOR3.x1, y0 = S.DOOR3.y0, h = S.F3 - y0;
  const sc = h / 1920 * 1.5;
  const cx = (x0 + x1) / 2;
  return <g transform={`translate(${cx - 360 * sc} ${y0 - 330 * sc}) scale(${sc})`}>{outPresent(t, k + 'do', false)}</g>;
}
const roomAstroFace = (t: number): Expr => {
  const see = ss(t, T3.seePhoto - 0.1, T3.seePhoto + 0.15);
  const real = ss(t, T3.realise, T3.realise + 0.35);
  const toFriend = ss(t, T3.friendIn + 0.25, T3.friendIn + 0.55) * (1 - ss(t, T3.watchUp + 0.05, T3.watchUp + 0.3));
  const atWatch = ss(t, T3.watchUp + 0.1, T3.watchUp + 0.35) * (1 - ss(t, 21.45, 21.7));
  const back = ss(t, 21.5, 21.8);
  const settle = ss(t, 19.0, 19.6);
  return {
    turn: lerp(lerp(-0.1, -0.35, see), 0.4, Math.max(toFriend, back)), lookX: lerp(lerp(-0.3, -0.75, see), 0.8, Math.max(toFriend, back)) * (1 - atWatch) - 0.7 * atWatch,
    lookY: lerp(lerp(0.0, 0.7, see), 0.0, Math.max(toFriend, back, settle * 0.6)) * (1 - atWatch) + 0.75 * atWatch,
    wide: 0.25 * see * (1 - real), brows: lerp(0.2 * see, 0.55, real) * (1 - 0.5 * settle), sad: 0.75 * real * (1 - 0.35 * settle),
    mouth: real > 0.4 && settle < 0.5 ? 'tremble' : back > 0.5 ? 'soft' : 'flat', blink: (t > 17.2 && t < 17.27) || (t > 21.9 && t < 22.05) ? 0.15 : 1,
  };
};
function roomPresentWorld(t: number, k: string, cam: Cam) {
  const x = S.roomAstroX(t);
  const walking = t < T3.roomStop - 0.03;
  const dist = (S.DOOR3.cx - 10 - x) / S.RS;
  const f = walkFeet(dist, walking ? 1 : 0);
  const feet = {lx: -f.rx, ly: f.ry, rx: -f.lx, ry: f.ly}; // walking to screen-left
  const swing = walking ? Math.sin((Math.PI * dist) / 100) * 12 : 0;
  // the watch comes up for the last beat (the same raise as in the cockpit)
  const wu = clamp((t - T3.watchUp) / 0.55);
  const eu = wu * wu * wu * (wu * (wu * 6 - 15) + 10);
  const st = ss(t, T3.roomStop - 0.1, T3.roomStop + 0.3); // standing still: the arms hang closer to the suit
  const restA = lerp(10, 6, st), restB = lerp(14, 10, st);
  const armL: ArmA = eu > 0 ? (() => {
    const ik = astroReach(lerp(-96, S.WATCH_HAND.x, eu), lerp(-120, S.WATCH_HAND.y, eu), -1, -1);
    const kk = clamp(eu / 0.2);
    return {a: lerp(restA + swing, ik.a, kk), b: lerp(restB, ik.b, kk)};
  })() : {a: restA + swing, b: restB};
  // his old friend follows him into the doorway
  const fu = ss(t, T3.friendIn, T3.friendIn + 0.6);
  const fx = lerp(S.DOOR3.x1 + 120, S.FRIEND_DOOR_X, fu);
  const fWalk = t > T3.friendIn && t < T3.friendIn + 0.6;
  const ffe: Expr = {mouth: 'soft', lookX: -0.75, lookY: 0.05, turn: -0.35, sad: 0.3, brows: 0.15};
  return (
    <g>
      <Mirror>
        <Room t={t} id={`${k}rm`} era={1} clockMinutes={661 + (t - 15) / 60} windowView={<Mirror>{inWindow(outPresent(t, k))}</Mirror>}
          v3={{doorOpen: 1, outside: <Mirror>{doorOutside(t, k)}</Mirror>, candle: 1, photo: true}} />
      </Mirror>
      {t > T3.friendIn && (
        <g>
          {/* the doorframe hides him only while he is still beyond the jamb */}
          <clipPath id={`${k}fdc`}><rect x={S.DOOR3.x0} y={S.DOOR3.y0 - 40} width={S.DOOR3.x1 - S.DOOR3.x0 + 14 + 160 * ss(fu, 0.8, 1)} height={S.F3 - S.DOOR3.y0 + 80} /></clipPath>
          <g clipPath={`url(#${k}fdc)`}>
            <g transform={`translate(${fx} ${S.F3}) scale(${S.RS})`}>
              <Friend age={1} pose={{armL: {a: lerp(7, 3, fu), b: lerp(9, 6, fu)}, armR: {a: 7, b: 9}, e: ffe, walk: fWalk ? (fu * 6) : 0, stride: fWalk ? 1 : 0}} id={`${k}rf`} facing={-1} green />
            </g>
          </g>
        </g>
      )}
      <InkK.Provider value={S.inkFor(cam.z)}>
        <g transform={`translate(${x} ${S.F3}) scale(${S.RS})`}>
          <Astronaut pose={{armL, armR: {a: restA - swing, b: restB}, e: roomAstroFace(t), bob: walkBob(dist, walking ? 1 : 0), frontL: eu > 0.25}} id={`${k}ra`} frame={Math.round(t * 30)} glove={GLOVE} watchEl={watchEl(t, k + 'r')} feet={feet} />
        </g>
      </InkK.Provider>
    </g>
  );
}

// ---- captions: only the narration, clear of faces, the watch and the photograph -----------------------------------------
const capY = (_i: number) => 1716;
const capHide = (i: number) => (i === CAPTIONS.length - 1 ? 22.35 : CAPTIONS[i].hide);

export const Scene3: React.FC<{t: number; fkey: string; captions: boolean}> = ({t, fkey, captions}) => {
  resetIds(fkey);
  let body: React.ReactNode = null;
  const urls: string[] = [];
  if (t < T3.windowIn || t >= T3.loopCut) {
    const c = S.camSpace(t);
    body = W(c, spaceWorld(t, fkey + 'A', c));
    urls.push(...bhUrls(bhT3(t)));
  } else if (t < T3.match) {
    const c = S.camCockpit(t);
    body = W(c, cockpitWorld(t, fkey + 'B', c.z));
  } else if (t < T3.windowMatch) {
    body = W(S.camRoomPast(t), roomPastWorld(t, fkey + 'C'));
  } else if (t < T3.inside) {
    body = W(S.camYard(t), yardWorld(t, fkey + 'D'));
  } else {
    const c = S.camRoomPresent(t);
    body = W(c, roomPresentWorld(t, fkey + 'E', c));
  }
  useImages(urls);
  return (
    <>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        <rect x={0} y={0} width={1080} height={1920} fill="#0B0E1D" />
        {body}
      </svg>
      {captions && <Captions2 t={t} y={capY} hide={capHide} />}
    </>
  );
};
