// One frame of the film: pick the world for time t, draw it through the camera, with any portal drawing the next
// world inside it; captions in screen space on top.
import React from 'react';
import {clamp, lerp, ss, word, keyS} from './lib';
import {resetIds} from './core/ids';
import * as St from './story';
import {Cam, camT, S} from './story';
import {Street} from './art/city';
import {Astronaut, AstroPose, ASTRO_IDLE, astroReach, Friend, FriendPose, reach} from './art/figures';
import {BlackHole, LightRays, orbitAngle, orbitPos, Ship, TinyEarth, WallClock} from './art/space';
import {CloudPass, Globe} from './art/earth';
import {Capsule, Car, Dust, G, Neighbourhood} from './art/house';
import {FLOOR, Hallway} from './art/interior';
import {Watch} from './art/figures';
import {C, INK} from './art/crew';
import {Captions} from './Captions';

const W = (c: Cam, children: React.ReactNode) => <g transform={camT(c)}>{children}</g>;
const at = (x: number, y: number, s: number, children: React.ReactNode, extra = '') => <g transform={`translate(${x} ${y}) scale(${s}) ${extra}`}>{children}</g>;
const mapG = (m: St.Map2, children: React.ReactNode) => <g transform={`translate(${m.o.x} ${m.o.y}) scale(${m.s}) translate(${-m.q.x} ${-m.q.y})`}>{children}</g>;
/** the reflection content inside a helmet (head-local), i.e. the space world through the visor map */
const visorContent = (t: number, k: string) => (
  <g transform={`translate(${St.REFL.rx} ${St.REFL.ry}) scale(${St.REFL.k}) translate(${-St.REFL.q.x} ${-St.REFL.q.y})`}>{spaceWorld(t, k + 'v', {ship: true})}</g>
);

// ---- B / G: space ---------------------------------------------------------------------------------------------------
function spaceWorld(t: number, k: string, o: {ship?: boolean; porthole?: boolean; warp?: number} = {}) {
  const sh = St.shipAt(Math.min(t, S.B1 + 0.3));
  // after the approach (warp view, reflections later in the film) the ship keeps orbiting at its normal size
  const orbitOnly = t > S.B1 + 0.3;
  const oth = 1.9 - (t - 18.0) * 0.16;
  const ang = orbitOnly ? orbitAngle(oth) : sh.ang;
  const pos = orbitOnly ? orbitPos(oth) : {x: sh.x, y: sh.y};
  const ks = orbitOnly ? 0.012 : sh.k;
  const warp = o.warp ?? 0;
  return (
    <g>
      <BlackHole t={t} />
      {warp > 0 && <LightRays t={t} op={warp} px={St.camG(t).z} from={St.G_FROM} t0={19.15} />}
      {o.ship !== false && (
        <g transform={`translate(${pos!.x} ${pos!.y}) rotate(${ang}) scale(${ks})`}>
          <Ship t={t} id={`${k}ship`} win={o.porthole ? <g>{mapInv(St.portholeMap(t), sh, cabinWorld(t, k + 'cab'))}</g> : <g><circle cx={50} cy={-14} r={21} fill="#1F3550" /><circle cx={48} cy={-12} r={9} fill={C.saffron} opacity={0.6} /></g>} />
        </g>
      )}
      {warp > 0 && (
        <g opacity={warp}>
          {/* the astronaut's watch beside his ship: it ticks at the ordinary rate */}
          <g transform={`translate(${St.G_WATCH.x} ${St.G_WATCH.y})`}>
            <circle r={St.G_WATCH.r * 1.7} fill="#BFF4F0" opacity={0.10} />
            <Watch r={St.G_WATCH.r} t={t + 12} id={`${k}gw`} strap={90} />
          </g>
          {/* Earth, far away, and an Earth clock racing */}
          <g transform={`translate(${St.G_EARTH.x} ${St.G_EARTH.y})`}><TinyEarth r={St.G_EARTH.r} spin={t * 2.2} id={`${k}te`} /></g>
          <circle cx={St.G_CLOCK.x} cy={St.G_CLOCK.y} r={St.G_CLOCK.r * 1.7} fill="#FFE7A6" opacity={0.10} />
          <g transform={`translate(${St.G_CLOCK.x} ${St.G_CLOCK.y})`}><WallClock r={St.G_CLOCK.r} t={t} rate={4000} /></g>
        </g>
      )}
    </g>
  );
}
/** porthole content is drawn in ship-local units: undo the ship's transform, then apply the porthole map */
function mapInv(m: St.Map2, sh: {x: number; y: number; ang: number; k: number}, children: React.ReactNode) {
  // ship-local u -> space: R(ang) * k * u + pos. Porthole map: space = o + s * (cabin - q). With ang = 0 at the
  // approach we draw in ship-local: u = (space - pos) / k  =>  cabin -> ship-local: (o - pos)/k + (s/k) * (cabin - q)
  const ox = (m.o.x - sh.x) / sh.k, oy = (m.o.y - sh.y) / sh.k, s = m.s / sh.k;
  return <g transform={`rotate(${-sh.ang}) translate(${ox} ${oy}) scale(${s}) translate(${-m.q.x} ${-m.q.y})`}>{children}</g>;
}

// ---- C: cabin ---------------------------------------------------------------------------------------------------------
function cabinWorld(t: number, k: string) {
  const e = {lookX: 0.25, lookY: 0.85, mouth: 'soft' as const, brows: 0.15};
  const pose: AstroPose = {armL: St.C_ARM_L, armR: {a: 12, b: 20}, e, frontL: true};
  const earth = <g transform={`scale(${St.SUB_MAP.s}) translate(${-St.EARTH.x} ${-St.EARTH.y})`}>{earthWorld(t, k + 'e', true)}</g>;
  return (
    <g>
      <rect x={-2000} y={-1000} width={5000} height={5000} fill="#16303A" />
      {/* cabin wall: panels and indicator lights */}
      {Array.from({length: 8}, (_, i) => <rect key={i} x={-400 + i * 260} y={180} width={230} height={1500} rx={22} fill="#1F3F4B" stroke={INK} strokeWidth={4} />)}
      {Array.from({length: 18}, (_, i) => <circle key={i} cx={-300 + (i % 9) * 230} cy={420 + Math.floor(i / 9) * 700} r={9} fill={[C.teal, C.saffron, C.coral][i % 3]} opacity={0.5 + 0.5 * Math.sin(t * 3 + i)} />)}
      {/* warm light from the disk through the porthole behind the camera */}
      <circle cx={540} cy={800} r={900} fill="#FF9A55" opacity={0.10} />
      {at(St.C_ASTRO.x, St.C_ASTRO.y, St.C_ASTRO.s, <Astronaut pose={pose} id={`${k}a`} frame={Math.round(t * 30)} watchTime={t + 1800} fullWatch earth={earth} shadow={false} reflection={<g opacity={0.6}><circle cx={30} cy={-30} r={40} fill="#FF9A55" opacity={0.25} /></g>} reflOpacity={0.6} />)}
    </g>
  );
}

// ---- D: Earth ----------------------------------------------------------------------------------------------------------
function earthWorld(t: number, k: string, mini = false) {
  return (
    <g>
      <rect x={-6000} y={-6000} width={13000} height={13000} fill="#0B1424" />
      {Array.from({length: mini ? 40 : 160}, (_, i) => {
        const x = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1, y = ((Math.sin(i * 78.233) * 43758.5453) % 1 + 1) % 1;
        return <circle key={i} cx={-1500 + x * 4080} cy={-1600 + y * 5000} r={1.5 + (i % 3)} fill="#FFF6E0" opacity={0.7} />;
      })}
      {at(St.EARTH.x, St.EARTH.y, 1, <Globe r={St.EARTH.r} lon0={St.earthLon(t)} years={St.earthYears(t)} id={`${k}g`} cloud={(t - S.C1) * 0.9} />)}
    </g>
  );
}

// ---- A: the street hook --------------------------------------------------------------------------------------------------
function streetWorld(th: number, t: number, k: string) {
  const age = St.friendAge(th);
  const rp = ss(th, -0.55, 0.8);
  const idleR = {a: 10, b: 12};
  const reachR = astroReach(150, -318, 1, 1);
  const wide = 0.45 * ss(th, -0.45, 0.05) + 0.55 * ss(th, 0.3, 0.75);
  const aPose: AstroPose = {
    armL: {a: 10 + 6 * rp, b: 12 + 10 * rp},
    armR: {a: lerp(idleR.a, reachR.a, rp), b: lerp(idleR.b, reachR.b, rp)},
    e: {wide, brows: lerp(0, 1, wide), mouth: th < -0.25 ? 'soft' : 'gasp', open: 0.25 + 0.6 * ss(th, 0.2, 0.7), lookX: lerp(0.7, 0.85, wide), lookY: lerp(0, 0.25, ss(th, 0.4, 1)), blink: 1},
  };
  // the friend looks at the astronaut, then down at his own hand as it ages
  const look = ss(th, -0.4, 0.5);
  const lift = ss(th, -0.45, 0.6);
  const fPose: FriendPose = {
    armL: {a: lerp(8, 0, lift), b: lerp(10, 0, lift)},
    armR: {a: 8, b: 10},
    e: {lookX: lerp(-0.7, -0.15, look), lookY: lerp(0, 0.85, look), mouth: th < -0.3 ? 'smile' : 'o', open: 0.3 + ss(th, -0.3, 0.9) * 0.5, wide: ss(th, -0.35, 0.3) * 0.6, brows: ss(th, -0.35, 0.3)},
  };
  // his left (forward) hand comes up in front of him to be looked at
  if (lift > 0) fPose.armL = reachL(lift);
  return (
    <g>
      <Street f={ss(age, 0.02, 1)} t={t} id={`${k}st`} />
      {at(St.A_POS.friend.x, St.A_POS.friend.y, St.A_POS.s, <Friend age={age} pose={fPose} id={`${k}fr`} facing={-1} />)}
      {at(St.A_POS.astro.x, St.A_POS.astro.y, St.A_POS.s, <Astronaut pose={aPose} id={`${k}as`} frame={Math.round(t * 30)} reflection={visorContent(t, k)} reflOpacity={St.reflOpacityA(th)} />)}
    </g>
  );
}
const reachL = (u: number) => {
  const a = reach(-62, -262, -1, 1);
  return {a: lerp(8, a.a, u), b: lerp(10, a.b, u)};
};

// ---- E: neighbourhood --------------------------------------------------------------------------------------------------------
function hoodWorld(t: number, k: string) {
  const D = St.decades(t);
  const age = t < 11 ? 0.05 + 0.95 * D : 1;
  const cy = St.capsuleY(t);
  const landed = t >= St.T_LAND;
  const turn = ss(t, 12.55, 12.9);
  const recog = ss(t, 13.35, 13.75);
  const fPose: FriendPose = {
    armL: reachArm(ss(t, 13.7, 14.2)),
    armR: {a: 8, b: 10},
    e: {lookX: lerp(lerp(0.15, -0.05, D), 0.85, turn), lookY: lerp(0.05, -0.15, recog), mouth: recog > 0.5 ? (t < 14.0 ? 'o' : 'tremble') : 'soft', open: 0.6, wide: recog * 0.8 * (1 - ss(t, 14.1, 14.6) * 0.5), brows: recog, sad: ss(t, 14.0, 14.4) * 0.6},
  };
  const ax = St.astroEX(t);
  const walking = (t > 12.95 && t < 13.45) || (t > 14.35 && t < 15.0);
  const aPose: AstroPose = {
    armL: walking ? {a: 10 + 18 * Math.sin(t * 16), b: 20} : {a: 10, b: 14},
    armR: t > 14.9 ? astroReach(140, -250, 1, 1) : walking ? {a: 10 - 18 * Math.sin(t * 16), b: 20} : {a: 10, b: 14},
    stride: walking ? 1 : 0, legs: t * 16,
    e: {lookX: t < 14.35 ? -0.85 : 0.85, wide: ss(t, 13.4, 13.7), brows: ss(t, 13.4, 13.7), mouth: t < 13.4 ? 'soft' : t < 14.35 ? 'gasp' : 'flat', open: 0.5, sad: ss(t, 13.9, 14.3)},
    bob: walking ? -Math.abs(Math.sin(t * 16)) * 10 : 0,
  };
  const astroFront = t > 14.0;
  const doorOpen = ss(t, 14.85, 15.1);
  const astro = t > 12.95 ? at(ax, E_FEET, St.E.s, <g transform={t > 14.35 ? 'scale(1 1)' : ''}><Astronaut pose={aPose} id={`${k}as`} frame={Math.round(t * 30)} /></g>) : null;
  return (
    <g>
      <Neighbourhood D={D} t={t} id={`${k}nb`} sunArcs={ss(t, 9.15, 10.9)} doorOpen={doorOpen} doorPortal={mapG(St.DOOR_MAP, hallWorld(t, k + 'h', true))} />
      <Car D={D} x={590} t={t} />
      {at(St.E.friend.x, St.E.friend.y, St.E.s, <Friend age={age} pose={fPose} id={`${k}fr`} facing={-1} />)}
      {!astroFront && astro}
      {t > 10.9 && (
        <g transform={`translate(${St.E.capsuleX} ${cy}) scale(0.95)`}>
          <Capsule hatch={ss(t, 12.7, 12.95)} flame={landed ? 1 - ss(t, St.T_LAND, St.T_LAND + 0.25) : 1} t={t} legs={ss(t, 12.0, 12.3)} />
        </g>
      )}
      <Dust p={(t - St.T_LAND) / 0.8} x={St.E.capsuleX} />
      {astroFront && astro}
    </g>
  );
}
const E_FEET = 1645;
const reachArm = (u: number) => ({a: lerp(8, 60, u), b: lerp(10, 30, u)});

// ---- F / H: hallway -----------------------------------------------------------------------------------------------------------
function hallWorld(t: number, k: string, viaDoor = false) {
  const x = t < S.F1 ? St.astroFX(t) : St.F_HEAD.x;
  const walking = t < 16.95 && t > 15.2;
  let pose: AstroPose;
  let eyeRefl: Parameters<typeof Astronaut>[0]['eyeRefl'];
  let refl: React.ReactNode = undefined, reflOp = 0.25, tint = 1;
  if (t < S.F1 + 0.01) {
    const lookIn = ss(t, 16.85, 17.25);
    pose = {
      armL: walking ? {a: 10 + 16 * Math.sin(t * 13), b: 20} : {a: 8, b: 14},
      armR: walking ? {a: 10 - 16 * Math.sin(t * 13), b: 20} : {a: 8, b: 14},
      stride: walking ? 0.9 : 0, legs: t * 13,
      bob: walking ? -Math.abs(Math.sin(t * 13)) * 8 : 0,
      e: {turn: lerp(0.2, St.F_LOOK.turn, lookIn), lookX: lerp(0.6, St.F_LOOK.lookX, lookIn), lookY: lerp(-0.2, St.F_LOOK.lookY, lookIn), sad: ss(t, 17.0, 17.5), brows: ss(t, 17.0, 17.5) * 0.3, mouth: t > 17.1 ? 'tremble' : 'flat', wide: 0.15, blink: t > 17.62 && t < 17.72 ? 0.1 : 1},
    };
    const eo = ss(t, 18.25, S.F1 - 0.02);
    if (eo > 0) {
      eyeRefl = {side: St.F_EYE_SIDE as 1, op: eo, node: eyeContent(t, k)};
      tint = 1 - eo;
    }
  } else {
    // H: the hand, then the visor
    const up = ss(t, 21.5, 21.95);
    pose = {
      armL: {a: lerp(St.H_ARM_L.a, 10, ss(t, 21.45, 21.9)), b: lerp(St.H_ARM_L.b, 14, ss(t, 21.45, 21.9))}, armR: {a: 8, b: 14}, frontL: true,
      e: {lookX: lerp(-0.1, 0.0, up), lookY: lerp(0.95, 0.0, up), wide: 0.25 + 0.2 * up, brows: 0.3, mouth: 'soft', sad: 0.4 * (1 - up)},
    };
    refl = visorContent(t, k + 'hv');
    reflOp = St.reflOpacityH(t);
  }
  return (
    <g>
      <Hallway t={t} id={`${k}hw`} />
      {(!viaDoor || t > 15.2) && at(x, FLOOR, St.F_ASTRO.s, <Astronaut pose={pose} id={`${k}as`} frame={Math.round(t * 30)} reflection={refl} reflOpacity={reflOp} eyeRefl={eyeRefl} tint={tint} fullWatch={t >= S.F1} watchTime={t + 1800} />)}
    </g>
  );
}
/** the eye reflection, head-local: the hole centred on the pupil, the pupil being its shadow */
function eyeContent(t: number, k: string) {
  const ex = 21 * St.F_EYE_SIDE + St.F_LOOK.turn * 9 + St.F_LOOK.lookX * 5, ey = -6 + St.F_LOOK.lookY * 4;
  return <g transform={`translate(${ex} ${ey}) scale(${5.5 / Math.sqrt(27)})`}>{spaceWorld(t, k + 'ey', {ship: true, warp: 0})}</g>;
}

// ---------------------------------------------------------------------------------------------------------------------------------
export const Scene: React.FC<{t: number; fkey: string; captions: boolean}> = ({t, fkey, captions}) => {
  resetIds(fkey);
  let body: React.ReactNode;
  let overlay: React.ReactNode = null;
  if (t < S.A1 || t >= S.H1) {
    const th = St.hookT(t);
    body = W(St.camA(th), streetWorld(th, t, 'A'));
  } else if (t < S.B1) {
    body = W(St.camB(t), spaceWorld(t, 'B', {ship: true, porthole: t > St.B_APPROACH.t0 + 0.4}));
  } else if (t < S.C1) {
    body = W(St.camC(t), cabinWorld(t, 'C'));
  } else if (t < S.D1) {
    body = W(St.camD(t), earthWorld(t, 'D'));
    overlay = <CloudPass p={St.cloudP(t)} />;
  } else if (t < S.E1) {
    body = W(St.camE(t), hoodWorld(t, 'E'));
    overlay = <CloudPass p={St.cloudP(t)} />;
  } else if (t < S.F1) {
    body = W(St.camF(t), hallWorld(t, 'F'));
  } else if (t < S.G1) {
    body = W(St.camG(t), spaceWorld(t, 'G', {ship: true, warp: ss(t, 19.15, 19.6)}));
  } else {
    body = W(St.camH(t), hallWorld(t, 'H'));
  }
  return (
    <>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        {body}
        {overlay}
      </svg>
      {captions && <Captions t={t} />}
    </>
  );
};
export {clamp, word, keyS, G};
