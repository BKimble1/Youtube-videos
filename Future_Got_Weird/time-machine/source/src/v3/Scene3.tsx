// V3: one frame of the film. Segments in order; each hands over on something visible on screen.
import React from 'react';
import {staticFile} from 'remotion';
import {clamp, hash, lerp, ss} from '../lib';
import {resetIds} from '../core/ids';
import {camT, Cam} from '../story';
import {BlackHole, bhFrame, hasWide} from '../art/space';
import {Capsule2, HatchFront, CAPSULE2} from '../v2/craft';
import {Cockpit, CockpitFront, COCKPIT_ASTRO, Watch2, WATCH, hourMinutes, secBlurAt} from '../v2/cockpit';
import {Astronaut, Friend, GLOVE, astroReach, ArmA} from '../art/figures';
import {C, Expr, InkK, INK, OUT} from '../art/crew';
import {Room, ROOM} from '../v2/room';
import {Yard, YARD, YardOut, YOUT} from '../v2/yard';
import {walkFeetDir, walkBob} from '../v2/walk';
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
/** a contact shadow under a figure (drawn by the scene, so it can fade in as the feet reach the ground) */
const Shadow: React.FC<{x: number; y: number; s: number; a: number}> = ({x, y, s, a}) => (a > 0.01 ? <ellipse cx={x} cy={y + 2 * s} rx={100 * s} ry={15 * s} fill={C.shadow} opacity={a} /> : null);

/** his watch: one compressed hour in the cockpit (10:00 -> 11:00), then real time */
const watchMinutes = (t: number) => {
  const u = (t - T3.hourStart) / (T3.hourEnd - T3.hourStart);
  if (t < T3.hourStart) return 600 + (t - T3.hourStart) / 60;
  if (t <= T3.hourEnd) return hourMinutes(u);
  return 660 + (t - T3.hourEnd) / 60;
};
/** the watch on his wrist: the dial turns with the forearm; the strap wraps the sleeve (clipped to its silhouette) */
const watchEl = (t: number, k: string) => (p: {x: number; y: number; angle: number; ik?: number}) => {
  const kk = S.WATCH_R / 100;
  const ik = p.ik ?? 1;
  const hw = (20 + OUT * ik) / kk; // the sleeve's half-width (with its outline), in watch units
  return (
    <g transform={`translate(${p.x} ${p.y}) rotate(${S.watchRot(p.angle)})`}>
      <g transform={`scale(${kk})`}>
        <rect x={-50} y={-hw} width={100} height={2 * hw} fill={WATCH.strap} />
        <rect x={24} y={-hw} width={22} height={2 * hw} fill={WATCH.strapSh} />
        <line x1={-50} y1={-hw} x2={-50} y2={hw} stroke={INK} strokeWidth={(2.4 * ik) / kk} />
        <line x1={50} y1={-hw} x2={50} y2={hw} stroke={INK} strokeWidth={(2.4 * ik) / kk} />
        <line x1={-50} y1={-hw + (2 * ik) / kk} x2={50} y2={-hw + (2 * ik) / kk} stroke={INK} strokeWidth={(OUT * ik) / kk} />
        <line x1={-50} y1={hw - (2 * ik) / kk} x2={50} y2={hw - (2 * ik) / kk} stroke={INK} strokeWidth={(OUT * ik) / kk} />
      </g>
      <Watch2 r={S.WATCH_R} minutes={watchMinutes(t)} id={`${k}w`} strap={false} soft
        secBlur={t > T3.hourStart && t < T3.hourEnd ? secBlurAt((t - T3.hourStart) / (T3.hourEnd - T3.hourStart), T3.hourEnd - T3.hourStart) : 0} />
    </g>
  );
};

// ---- 1-2 space --------------------------------------------------------------------------------------------------------
/** fine vector stars that take over from the ray-traced frames once they are magnified past their resolution */
const CloseStars: React.FC<{cam: Cam; op: number}> = ({cam, op}) => {
  if (op < 0.01) return null;
  const view = 1300 / cam.z; // generous: the camera may be rolled
  const out: React.ReactNode[] = [];
  for (const [cell, seed, rPx, a] of [[2.0, 11, 2.2, 0.75], [0.5, 23, 1.7, 0.6], [0.14, 37, 1.5, 0.5]] as [number, number, number, number][]) {
    const n = view / cell;
    if (n > 24 || n < 1.5) continue;
    const x0 = Math.floor((cam.x - view) / cell), x1 = Math.ceil((cam.x + view) / cell);
    const y0 = Math.floor((cam.y - view) / cell), y1 = Math.ceil((cam.y + view) / cell);
    const fade = ss(24 - n, 0, 8) * ss(n, 1.5, 4);
    for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++) {
      const h = hash(i * 12.9898 + j * 78.233 + seed);
      if (h > 0.55) continue;
      const sx = (i + hash(i * 3.1 + j * 7.7 + seed)) * cell, sy = (j + hash(i * 5.3 + j * 1.9 + seed)) * cell;
      out.push(<circle key={`${seed}-${i}-${j}`} cx={sx} cy={sy} r={(rPx * (0.6 + h)) / cam.z} fill="#FFF6E0" opacity={a * fade * op} />);
    }
  }
  return <g>{out}</g>;
};
/** sparse dust near the ship, streaming past along its heading (parallax) during the follow; periodic at the loop seam */
const SpaceDust: React.FC<{cam: Cam}> = ({cam}) => {
  const a = (1 - ss(cam.z, 44, 60)) * (1 - ss(Math.abs(cam.r ?? 0), 0.3, 2.5));
  if (a < 0.01) return null;
  const P = 4.2, c0 = S.CAM_OPEN;
  const vx = -0.55 * cam.z * P / 30, vy = 1.55 * cam.z * P / 30; // px per frame
  const L = Math.hypot(vx, vy), ux = vx / L, uy = vy / L;
  return (
    <g>
      {Array.from({length: 30}, (_, i) => {
        const x = (((hash(i * 4.7) * 1180 - (cam.x - c0.x) * cam.z * P) % 1180) + 1180) % 1180 - 50;
        const y = (((hash(i * 8.3) * 2020 - (cam.y - c0.y) * cam.z * P) % 2020) + 2020) % 2020 - 50;
        const r = 1.3 + 1.4 * hash(i * 2.9);
        return <line key={i} x1={x} y1={y} x2={x - ux * L * 1.4} y2={y - uy * L * 1.4} stroke="#FFF6E0" strokeWidth={r} strokeLinecap="round" opacity={a * (0.35 + 0.4 * hash(i * 6.1))} />;
      })}
    </g>
  );
};
function spaceWorld(t: number, k: string, cam: Cam) {
  const tau = spaceTau(t);
  const p = S.shipPos(tau), rot = S.shipRot(tau);
  const winPx = S.WIN_R * cam.z;
  const showCabin = winPx > 34;
  const mag = S.bhMag(cam);
  return (
    <g>
      <BlackHole t={bhT3(t)} imgOp={1 - ss(mag, 2.6, 4.4)} />
      <CloseStars cam={cam} op={ss(mag, 2.2, 3.8)} />
      <g transform={`translate(${p.x} ${p.y}) rotate(${rot}) scale(${S.SM})`}>
        <Capsule2 t={t} id={`${k}cap`} flame={0.8} flameA={1} glow={1}
          win={showCabin ? (
            <g>
              <g transform={`translate(0 ${CAPSULE2.win.y}) scale(${CAPSULE2.win.r / S.COCKPIT_VIEW.r}) translate(${-S.COCKPIT_VIEW.x} ${-S.COCKPIT_VIEW.y})`}>{cockpitWorld(t, k + 'ck', 1)}</g>
              {/* far away the cabin reads as a lit porthole; it resolves as we close in. Out of the loop cut the glass starts
                  dark navy (the watch dial it matches) and clears as the camera pulls back */}
              <circle cx={0} cy={CAPSULE2.win.y} r={CAPSULE2.win.r + 6} fill="#13213A" opacity={Math.max(0.75 * (1 - ss(winPx, 40, 150)), tau < 0 ? 0.8 * (1 - ss((tau - (T3.loopCut - T3.dur)) / (T3.dur - T3.loopCut), 0.08, 0.6)) : 0)} />
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
  const armL = inCockpit ? S.cockpitArm(t) : S.REST_L;
  const raised = clamp((t - T3.raise) / (T3.raiseEnd - T3.raise));
  const tt = inCockpit ? t : 4.2;
  const e: Expr = S.cockpitFace(tt);
  // a small tilt of the head toward the wrist while he looks down at it
  const tilt = -8 * ss(tt, T3.glance, T3.glance + 0.18) * (1 - 0.5 * ss(tt, T3.raise + 0.2, T3.raiseEnd));
  return (
    <g>
      <Cockpit t={t} id={`${k}ck`} bhT={bhT3(t)} />
      <InkK.Provider value={S.inkFor(z)}>
        <g transform={`translate(${A.x} ${A.y}) scale(${A.s})`}>
          <Astronaut pose={{armL, armR: REST_R, e, frontL: true, tilt}} id={`${k}as`} frame={Math.round(t * 30)} glove={GLOVE} watchEl={watchEl(t, k)} watchAt={S.WATCH_AT} shadow={false} />
        </g>
      </InkK.Provider>
      <CockpitFront t={t} id={`${k}cf`} shoulder={1 - ss(raised, 0, 0.35)} />
    </g>
  );
}

// ---- 5 the room, past: the wall clock races; the window (the garden through the glass) ---------------------------------
const WSC = ROOM.win.h / 1920;
const inWindow = (n: React.ReactNode) => <g transform={`translate(${ROOM.win.cx - 540 * WSC} ${ROOM.win.cy - 960 * WSC}) scale(${WSC})`}>{n}</g>;
/** the friend seen from the house, beyond the fence: right of the gate from inside (left of it from the street) */
const OUT_FRIEND_X = YOUT.mirror - S.FRIEND.x; // (the view maps street x to mirror - x)
function outPast(t: number, k: string) {
  return (
    <YardOut D={0.05} season={0.06} t={t} id={`${k}yo`}
      beyondFence={
        <g transform={`translate(${OUT_FRIEND_X} ${YOUT.fenceY - 30}) scale(${S.YS * 0.96})`}>
          <Friend age={0.05} pose={{armL: {a: 8, b: 10}, armR: {a: 8, b: 10}, e: {mouth: 'soft', lookX: -0.3, lookY: -0.3}}} id={`${k}yf`} facing={-1} green />
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
/** the friend: waiting (now and then he looks up at the sky); the capsule; the blast; he meets his friend; recognition */
const friendYardFace = (t: number): Expr => {
  const up1 = ss(t, 9.95, 10.08) * (1 - ss(t, 10.3, 10.44));
  const up2 = ss(t, 10.8, 10.93) * (1 - ss(t, 11.06, 11.18));
  const look = ss(t, T3.descent - 0.15, T3.descent + 0.1);
  const follow = ss(t, T3.descent + 0.25, T3.landing);
  const meet = ss(t, T3.stepDown + 0.2, T3.arrive - 0.2);
  const rec = ss(t, T3.recognise + 0.08, T3.recognise + 0.4);
  const watchGo = ss(t, T3.turnToHouse + 0.1, T3.walk + 0.3);
  const upAll = Math.max(up1, up2, look * (1 - follow));
  const flinch = ss(t, T3.landing - 0.25, T3.landing - 0.05) * (1 - ss(t, T3.landing + 0.15, T3.landing + 0.45));
  return {
    // the capsule is to his left (screen-left), the astronaut walks in from the left and stops on his right
    ...S.mouthAt(t, [[0, 'soft'], [T3.landing - 0.18, 'o'], [T3.landing + 0.42, 'soft'], [T3.recognise + 0.34, 'smile'], [T3.walk + 0.5, 'soft']], 0.14),
    open: 0.25,
    lookX: lerp(lerp(lerp(-0.2, -0.35, upAll), -0.8, follow * (1 - meet)), lerp(0.75, 0.55, watchGo), meet),
    lookY: lerp(lerp(lerp(0.1, -0.95, upAll), 0.05, follow), lerp(0.08, -0.25, watchGo), meet),
    brows: 0.35 * look * (1 - meet) + 0.35 * flinch + 0.25 * meet * (1 - rec) + 0.12 * rec,
    sad: 0.3 * rec, turn: 0.3 * meet, wide: 0.3 * look * (1 - meet) + 0.25 * flinch,
    blink: 1 - 0.85 * Math.max(Math.sin(Math.PI * clamp((t - 10.62) / 0.13)), Math.sin(Math.PI * clamp((t - (T3.recognise + 0.18)) / 0.14))) ** 2,
  };
};
/** the astronaut's face on the way to his friend and through the recognition */
const astroYardFace = (t: number, house: number): Expr => {
  const meet = ss(t, T3.arrive - 0.45, T3.arrive);
  const search = ss(t, T3.faces + 0.05, T3.recognise) * (1 - ss(t, T3.recognise, T3.recognise + 0.15));
  const rec = ss(t, T3.recognise, T3.recognise + 0.3);
  const sacc = search * Math.sin((t - T3.faces) * 20) * 0.15;
  return {
    ...S.mouthAt(t, [[0, 'soft'], [T3.stepDown + 0.05, 'o'], [T3.stepDown + 0.4, 'soft'], [T3.recognise + 0.1, 'flat']], 0.14),
    open: 0.2,
    // he looks up at his house as he steps down, then at his friend (left), level with his eyes
    lookX: lerp(lerp(0.15, 0.4, house), -0.75 + sacc, meet), lookY: lerp(lerp(-0.1, -0.85, house), 0.12 + sacc * 0.4, meet),
    wide: 0.3 + 0.3 * house + 0.18 * search - 0.25 * rec, brows: 0.3 + 0.3 * house + 0.2 * search + 0.2 * rec, sad: 0.5 * rec,
    turn: -0.25 * meet, blink: 1 - 0.85 * Math.sin(Math.PI * clamp((t - (T3.recognise + 0.26)) / 0.14)) ** 2,
  };
};
function yardWorld(t: number, k: string) {
  const D = S.yardD(t), season = S.yardSeason(t);
  const cap = S.capsuleYard(t);
  const age = S.friendAge(t);
  const turning = t >= T3.turnToHouse;
  // the astronaut: hatch -> road -> his friend -> (later) turns in place, through the gate, up the path, seen from behind
  let astro: React.ReactNode = null;
  let astroBehind = false;
  let astroShadow: React.ReactNode = null;
  if (t >= T3.hatch + 0.05 && !turning) {
    const r = S.astroReturn(t);
    const settle = 1 - ss(t, T3.arrive - 0.22, T3.arrive + 0.02);
    const house = ss(t, T3.stepDown - 0.06, T3.stepDown + 0.06) * (1 - ss(t, T3.stepDown + 0.3, T3.stepDown + 0.48));
    const dist = r.s / S.YS + 46 * ss(t, T3.stepOut, T3.stepDown);
    const amp = r.walking ? settle : 0;
    const fd = walkFeetDir(dist, amp, S.RET_STEP, r.dx, r.dy);
    const sw = Math.sin((Math.PI * dist) / S.RET_STEP) * 12 * amp;
    const el = (
      <g transform={`translate(${r.x} ${r.y}) scale(${S.YS})`}>
        <Astronaut pose={{armL: {a: 9 - sw, b: 12}, armR: {a: 9 + sw, b: 12}, e: astroYardFace(t, house), bob: walkBob(dist, amp, S.RET_STEP), frontL: true}} id={`${k}as`} frame={Math.round(t * 30)} glove={GLOVE}
          watchEl={watchEl(t, k + 'a')} watchAt={S.WATCH_AT} feet={fd} nearLeg={fd.nearR ? 'R' : 'L'} shadow={false} />
      </g>
    );
    if (S.inHatch(t)) {
      const H = S.HATCH_W;
      astro = (
        <g>
          <clipPath id={`${k}hc`}><ellipse cx={H.x} cy={H.y + cap.dip} rx={H.rx - 3} ry={H.ry - 3} /></clipPath>
          <g clipPath={`url(#${k}hc)`}>{el}</g>
          <g transform={`translate(${cap.x} ${cap.y}) scale(${S.CAP_S})`}><HatchFront hatch={cap.hatch} /></g>
        </g>
      );
    } else {
      astro = el;
      astroShadow = <Shadow x={r.x} y={r.y} s={S.YS} a={ss(r.y, S.SILL_Y + 20, S.ROAD_Y)} />;
    }
  } else if (turning) {
    const a = S.astroDoor(t);
    // the turn in place: features turn away, a squash as the back view takes over, feet planted
    const tk = ss(t, T3.turnToHouse, T3.walk);
    const back = tk > 0.5;
    const squash = 1 - 0.22 * Math.sin(Math.PI * tk);
    const walking = t > T3.walk;
    const dist = a.dist / a.s;
    const amp = walking ? ss(t, T3.walk, T3.walk + 0.12) : 0;
    const swing = Math.sin((Math.PI * dist) / S.PATH_STEP) * 14 * amp;
    const ae: Expr = {lookX: 0.8, lookY: -0.1, turn: 0.9 * clamp(tk * 2), sad: 0.4, brows: 0.3, mouth: 'flat'};
    astroBehind = a.y < YARD.fenceY + 2;
    astro = (
      <g transform={`translate(${a.x} ${a.y}) scale(${a.s * squash} ${a.s})`}>
        <Astronaut pose={{armL: {a: 9 + swing, b: 14}, armR: {a: 9 - swing, b: 14}, e: ae, bob: walkBob(dist, amp, S.PATH_STEP), frontL: !back}} id={`${k}ad`} frame={Math.round(t * 30)} glove={GLOVE}
          watchEl={watchEl(t, k + 'd')} watchAt={S.WATCH_AT} feet={walkFeetDir(dist, amp, S.PATH_STEP, a.dx, a.dy)} nearLeg={walkFeetDir(dist, amp, S.PATH_STEP, a.dx, a.dy).nearR ? 'R' : 'L'} back={back} shadow={false} />
      </g>
    );
    astroShadow = <Shadow x={a.x} y={a.y} s={a.s} a={1} />;
  }
  // the friend: in the same place all through the years, ageing; at the landing he flinches from the blast
  const blast = ss(t, T3.landing - 0.25, T3.landing - 0.05) * (1 - ss(t, T3.landing + 0.15, T3.landing + 0.5));
  const shield = blast;
  const friend = (
    <g transform={`translate(${S.FRIEND.x} ${S.FRIEND.y}) scale(${S.YS})`}>
      <Friend age={age} pose={{armL: {a: 7, b: 9}, armR: {a: lerp(7, 62, shield), b: lerp(9, 78, shield)}, e: friendYardFace(t), lean: -10 * blast, bob: 1.2 * Math.sin(t * 2.2)}} id={`${k}fr`} facing={1} green />
    </g>
  );
  // landing dust: soft clouds (no outlines) that bloom at touchdown, roll outward and rise, fading as one
  const puff = clamp((t - T3.landing + 0.06) / 0.6);
  const dustA = ss(puff, 0, 0.12) * (1 - ss(puff, 0.35, 1));
  const sh = ss(t, T3.descent, T3.landing);
  const gate = ss(t, S.T_GATE - 0.3, S.T_GATE - 0.02);
  const doorOpen = ss(t, T3.inside - 0.46, T3.inside - 0.12);
  const yd = {D, season, t, v3: true, gateOpen: gate, doorOpen};
  return (
    <g>
      <Yard {...yd} id={`${k}yd`} layer="back" />
      {astroBehind && astroShadow}
      {astroBehind && astro}
      <Yard {...yd} id={`${k}yf`} layer="front" />
      {t > T3.descent && <ellipse cx={S.LAND.x} cy={S.LAND.y + 4} rx={lerp(60, 250, sh)} ry={lerp(10, 32, sh)} fill="#1B2A33" opacity={0.08 + 0.2 * sh} />}
      {friend}
      {t > T3.descent - 0.1 && (
        <g transform={`translate(${cap.x} ${cap.y}) scale(${S.CAP_S})`}>
          <Capsule2 t={t} id={`${k}cap`} retro={cap.retro} legs={cap.legs} hatch={cap.hatch} legSpread={S.LEG_SPREAD} />
        </g>
      )}
      {dustA > 0.01 && (
        <g opacity={0.7 * dustA}>
          {[-1, 1].map((sd) => [0, 1, 2, 3].map((q) => {
            const reach = 120 + 230 * (1 - (1 - puff) * (1 - puff));
            const px = S.LAND.x + sd * reach * (0.5 + 0.17 * q), py = S.LAND.y + 6 - (14 + 9 * q) * puff;
            return <ellipse key={`${sd}${q}`} cx={px} cy={py} rx={(30 + 10 * q) * (0.7 + 0.9 * puff)} ry={(18 + 6 * q) * (0.7 + 0.8 * puff)} fill={q % 2 ? '#D6CDBD' : '#C9BFAD'} />;
          }))}
        </g>
      )}
      {!astroBehind && astroShadow}
      {!astroBehind && astro}
    </g>
  );
}

// ---- 10-12 the room, present ------------------------------------------------------------------------------------------
function outPresent(t: number, k: string, ship = true, door = false) {
  const C0 = {x: 255, y: 1258, s: 0.36};
  return (
    <YardOut D={1} season={0.12} t={t} id={`${k}po`} gateOpen={1}
      {...(door ? {doorPath: true, skylineHaze: 0.6} : {})}
      beyondFence={ship ? <g transform={`translate(${C0.x} ${C0.y}) scale(${C0.s})`}><Capsule2 t={t} id={`${k}pc`} legs={1} hatch={0.2} legSpread={S.LEG_SPREAD} /></g> : undefined} />
  );
}
/** the doorway looks out on the garden (a 1080x1920 view of YardOut scaled into the door opening) */
function doorOutside(t: number, k: string) {
  const x0 = S.DOOR3.x0, x1 = S.DOOR3.x1, y0 = S.DOOR3.y0, h = S.F3 - y0;
  const sc = h / 1920 * 1.5;
  const cx = (x0 + x1) / 2;
  return <g transform={`translate(${cx - 360 * sc} ${y0 - 330 * sc}) scale(${sc})`}>{outPresent(t, k + 'do', false, true)}</g>;
}
const roomAstroFace = (t: number): Expr => {
  const see = ss(t, T3.seePhoto - 0.1, T3.seePhoto + 0.15);
  const real = ss(t, T3.realise, T3.realise + 0.32);
  const toFriend = ss(t, T3.friendIn + 0.3, T3.friendIn + 0.6) * (1 - ss(t, T3.watchUp + 0.05, T3.watchUp + 0.3));
  const atWatch = ss(t, T3.watchUp + 0.1, T3.watchUp + 0.35) * (1 - ss(t, 21.2, 21.45));
  const back = ss(t, 21.25, 21.55);
  const settle = ss(t, 19.0, 19.6);
  return {
    ...S.mouthAt(t, [[0, 'flat'], [T3.realise + 0.12, 'tremble'], [19.35, 'flat'], [21.5, 'soft']], 0.14),
    turn: lerp(lerp(-0.1, -0.35, see), 0.4, Math.max(toFriend, back)), lookX: lerp(lerp(-0.3, -0.75, see), 0.8, Math.max(toFriend, back)) * (1 - atWatch) - 0.6 * atWatch,
    lookY: lerp(lerp(0.0, 0.7, see), 0.0, Math.max(toFriend, back, settle * 0.6)) * (1 - atWatch) + 0.85 * atWatch,
    wide: 0.25 * see * (1 - real), brows: lerp(0.2 * see, 0.55, real) * (1 - 0.5 * settle), sad: 0.8 * real * (1 - 0.35 * settle),
    blink: 1 - 0.85 * Math.max(Math.sin(Math.PI * clamp((t - 17.15) / 0.14)), Math.sin(Math.PI * clamp((t - 21.62) / 0.14))) ** 2,
  };
};
/** his old friend in the doorway: he watches him, blinks, looks at the watch, and softens into a small nod */
const roomFriendFace = (t: number): Expr => {
  const watch = ss(t, T3.watchUp + 0.2, T3.watchUp + 0.45) * (1 - ss(t, 21.2, 21.45));
  return {
    ...S.mouthAt(t, [[0, 'flat'], [21.5, 'soft'], [21.95, 'smile']], 0.16),
    lookX: lerp(-0.75, -0.55, watch), lookY: lerp(0.05, 0.6, watch), turn: -0.35, sad: 0.3 * (1 - ss(t, 21.4, 21.9)), brows: 0.15 + 0.15 * watch,
    wide: 0.18 * watch,
    blink: 1 - 0.85 * Math.max(Math.sin(Math.PI * clamp((t - 20.32) / 0.14)), Math.sin(Math.PI * clamp((t - 21.32) / 0.14))) ** 2,
  };
};
function roomPresentWorld(t: number, k: string, cam: Cam) {
  const x = S.roomAstroX(t);
  const dist = (S.DOOR3.cx - 10 - x) / S.RS;
  // the walk winds down into the stand over the last few frames (the lifted foot comes down, the bob settles)
  const amp = 1 - ss(t, T3.roomStop - 0.2, T3.roomStop + 0.02);
  const feet = walkFeetDir(dist, amp, 100, -1, 0); // walking to screen-left
  const swing = Math.sin((Math.PI * dist) / 100) * 12 * amp;
  // the watch comes up for the last beat (the same raise as in the cockpit)
  const wu = clamp((t - T3.watchUp) / 0.6);
  const st = ss(t, T3.roomStop - 0.1, T3.roomStop + 0.3); // standing still: the arms hang closer to the suit
  const restA = lerp(10, 6, st), restB = lerp(14, 10, st);
  const eu = S.e5(wu);
  const armL: ArmA = {a: lerp(restA + swing, S.RAISED.a, eu), b: lerp(restB, S.RAISED.b, eu)};
  // his old friend steps into the doorway from the path (from the right, seen from inside) and stops on the threshold
  const fu = ss(t, T3.friendIn, T3.friendIn + 0.7);
  const fx = lerp(S.DOOR3.x1 + 90, S.FRIEND_DOOR_X, fu);
  const fWalk = t > T3.friendIn && t < T3.friendIn + 0.7;
  const nod = 3 * Math.sin(Math.PI * clamp((t - 21.55) / 0.5));
  return (
    <g>
      <Mirror>
        <Room t={t} id={`${k}rm`} era={1} clockMinutes={661 + (t - 15) / 60} windowView={<Mirror>{inWindow(outPresent(t, k))}</Mirror>}
          v3={{doorOpen: 1, outside: <Mirror>{doorOutside(t, k)}</Mirror>, candle: 1, photo: true}} />
      </Mirror>
      {t > T3.friendIn && (
        <g>
          {/* seen only within the door opening (he is outside the jamb until he steps onto the threshold) */}
          <clipPath id={`${k}fdc`}><rect x={S.DOOR3.x0} y={S.DOOR3.y0 - 40} width={S.DOOR3.x1 - S.DOOR3.x0} height={S.F3 - S.DOOR3.y0 + 80} /></clipPath>
          <g clipPath={`url(#${k}fdc)`}>
            <g transform={`translate(${fx} ${S.F3}) scale(${S.RS})`}>
              <Friend age={1} pose={{armL: {a: lerp(7, 3, fu), b: lerp(9, 6, fu)}, armR: {a: 7, b: 9}, e: roomFriendFace(t), walk: fWalk ? fu * 7 : 0, stride: fWalk ? 1 - ss(fu, 0.75, 1) : 0, lean: nod, bob: 1.0 * Math.sin(t * 2.0)}} id={`${k}rf`} facing={-1} green />
            </g>
          </g>
        </g>
      )}
      <InkK.Provider value={S.inkFor(cam.z)}>
        <g transform={`translate(${x} ${S.F3}) scale(${S.RS})`}>
          <Astronaut pose={{armL, armR: {a: restA - swing, b: restB}, e: roomAstroFace(t), bob: walkBob(dist, amp), frontL: true}} id={`${k}ra`} frame={Math.round(t * 30)} glove={GLOVE} watchEl={watchEl(t, k + 'r')} watchAt={S.WATCH_AT} feet={feet} nearLeg={feet.nearR ? 'R' : 'L'} />
        </g>
      </InkK.Provider>
    </g>
  );
}

// ---- captions: only the narration, clear of faces, the watch and the photograph -----------------------------------------
// (in the cockpit the resting watch sits low in frame: those two captions go a little lower, over the console face)
const capY = (i: number) => (i === 1 || i === 2 ? 1792 : 1716);
const capHide = (i: number) => (i === CAPTIONS.length - 1 ? 22.35 : CAPTIONS[i].hide);

export const Scene3: React.FC<{t: number; fkey: string; captions: boolean}> = ({t, fkey, captions}) => {
  resetIds(fkey);
  let body: React.ReactNode = null;
  const urls: string[] = [];
  if (t < T3.windowIn || t >= T3.loopCut) {
    const c = S.camSpace(t);
    body = (
      <g>
        {W(c, spaceWorld(t, fkey + 'A', c))}
        <SpaceDust cam={c} />
      </g>
    );
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
