import React from 'react';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {BikeWorld} from '../v2/Bike2';
import {GSY, GYW, SC, BIKE_Y} from '../v2/choreo2';
import {Pigeon, ArrowShape, Chip, Leader, SpeedPlate, cl, lerp, popScale, ramp, sm} from './ui';
import {HED_FONT} from '../fonts4';
import {T, WORD, fs} from './timeline';
import {HK} from './Hook2';
import {StreetScene, camS, heroView, sOf, zoomS} from './Scene2';
import {PLAZA_OBJ, PlazaProps, bikeState} from './Plaza';

/** B02 shared motion + B03 loose things: one street, one continuous camera (follow her; stop with her; whip east to the plaza at 'Stop'). */
export const B2 = {
  lens: fs(WORD.feel) - 2, lensOff: fs(WORD.you2) + 16,
  you: fs(WORD.you2) - 1, ground: fs(WORD.ground) - 1, air: fs(WORD.air) - 1, pulse: fs(WORD.together) + 2, arrowsOff: T.panA - 2,
  pigeonIn: T.b02 + 2,
};
export const B3 = {curb: T.stopF + 8, loose: T.stopF + 14, off: T.wipe1A - 4};
export const PLAZA = {cam: 2450, z: 1.1};
const CAM_STAND = () => camS(sOf(T.b02 + 30));
export const camStory = (f: number) => {
  const s = sOf(f);
  const u = ramp(f, T.panA, T.panB, E.inOut);
  const a = f < T.panA ? camS(s) : CAM_STAND();
  return {x: lerp(a, PLAZA.cam, u), z: lerp(zoomS(s), PLAZA.z, u)};
};
export const camStoryVel = (f: number) => camStory(f + 0.5).x - camStory(f - 0.5).x;

const PIGEON = {x: 1560, y: 800};
const pigeonPos = (f: number) => {
  const u = sm((f - B2.pigeonIn) / 22);
  return {x: PIGEON.x + 900 * (1 - u), y: PIGEON.y - 160 * (1 - u) + 10 * Math.sin(f * 0.17), flying: u < 1};
};

export const Story2: React.FC<{f: number; graphics: boolean}> = ({f, graphics}) => {
  const cam = camStory(f);
  const v = camStoryVel(f);
  const blur = Math.min(14, Math.abs(v) * cam.z * 0.3);
  const s = sOf(f);
  const t = f - T.stopF;
  const bk = bikeState(t);
  const pg = pigeonPos(f);
  const toS = (x: number, y: number) => ({x: 540 + (x - cam.x) * cam.z, y: GSY + (y - GYW) * cam.z});
  const hv = heroView(s, cam.x, cam.z);
  const out = ramp(f, T.hookEnd - 6, T.hookEnd + 6, (x) => x);
  const bikeAt = {x: bk.x, ang: bk.ang, tilt: bk.tilt};
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <StreetScene f={f} camX={cam.x} zoom={cam.z} blur={blur} hero={f < T.panB + 6}>
        <BikeWorld f={0} at={bikeAt} />
        {f >= B2.pigeonIn - 1 && f < T.panB + 4 && <Pigeon x={pg.x} y={pg.y} s={2.0} fly flap={pg.flying ? f * 0.95 : f * 0.5} />}
        <PlazaProps t={t} />
      </StreetScene>
      {graphics && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <HookLate f={f} out={out} />
          <B02Graphics f={f} hv={hv} toS={toS} />
          <B03Graphics f={f} toS={toS} bikeX={bk.x} />
        </svg>
      )}
    </div>
  );
};

/** speed introduction on the words (the hook's tail, drawn over the street scene): EQUATOR, the east arrow, the stable plate */
const HookLate: React.FC<{f: number; out: number}> = ({f, out}) => (
  <g>
    <Chip x={470} y={690} w={230} text="EQUATOR" tone="still" scale={popScale(f, HK.eq)} opacity={1 - out} />
    {popScale(f, HK.arrow) > 0.01 && (
      <g transform={`translate(640 1030) scale(${popScale(f, HK.arrow) * (1 - out)})`}><ArrowShape x={0} y={0} w={190} /></g>
    )}
    <SpeedPlate x={640} y={820} scale={popScale(f, HK.plate)} opacity={1 - out} />
  </g>
);

const B02Graphics: React.FC<{f: number; hv: ReturnType<typeof heroView>; toS: (x: number, y: number) => {x: number; y: number}}> = ({f, hv, toS}) => {
  if (f < B2.lens - 2 || f > B2.arrowsOff + 4) return null;
  const off = 1 - ramp(f, B2.arrowsOff, B2.arrowsOff + 4, (x) => x);
  const pulse = 1 + 0.1 * Math.sin(Math.PI * cl((f - B2.pulse) / 10)) * (f >= B2.pulse ? 1 : 0);
  const head = {x: hv.screen.x + 20, y: hv.screen.y - 640 * 0.86 * (hv.screen.y > 0 ? 1 : 1)};
  void head;
  const fk = hv.fk;
  const headTop = toS(fk.Hc.x + 20, fk.Hc.y - 62 * SC - 105);
  const mug = toS(fk.Wn.x + 60, fk.Wn.y);
  const pg = pigeonPos(f), pgS = toS(pg.x, pg.y);
  const gnd = toS(1510, GYW + 78 + 40); // on the road just under the curb, above the bottom Shorts UI band (y < ~1650)
  const A = (fr: number, p: {x: number; y: number}, w = 190) => {
    const sc = popScale(f, fr) * off * pulse;
    return sc > 0.01 ? <g transform={`translate(${p.x} ${p.y}) scale(${sc})`}><ArrowShape x={0} y={0} w={w} /></g> : null;
  };
  const lens = popScale(f, B2.lens) * (1 - ramp(f, B2.lensOff, B2.lensOff + 5, (x) => x));
  const lc = {x: mug.x + 250, y: mug.y - 175};
  return (
    <g>
      {A(B2.you, {x: headTop.x + 40, y: headTop.y})}
      {A(B2.ground, gnd)}
      {A(B2.air, {x: pgS.x + 20, y: pgS.y - 140})}
      {lens > 0.01 && (
        <g>
          <Leader from={{x: lc.x - 120 * lens, y: lc.y + 70 * lens}} to={{x: mug.x + 8, y: mug.y - 8}} opacity={lens > 0.5 ? 1 : 0} />
          <g transform={`translate(${lc.x} ${lc.y}) scale(${lens})`}>
            <circle cx={0} cy={0} r={150} fill={C.cream} stroke={C.ink} strokeWidth={8} />
            <clipPath id="lensClip2"><circle cx={0} cy={0} r={142} /></clipPath>
            <g clipPath="url(#lensClip2)">
              <rect x={-150} y={-150} width={300} height={300} fill={C.tealLight} />
              <g transform="translate(0 20) scale(1.8)">
                <path d="M -40 -34 L 40 -34 L 34 40 Q 33 48 24 48 L -24 48 Q -33 48 -34 40 Z" fill={C.coral} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
                <ellipse cx={0} cy={-34} rx={40} ry={10} fill={C.cream} stroke={C.ink} strokeWidth={3} />
                <ellipse cx={0} cy={-33} rx={34} ry={7} fill="#33200F" />
                <ellipse cx={-10} cy={-35} rx={10} ry={2.2} fill="#B9824A" opacity={0.8} />
              </g>
            </g>
            <rect x={-112} y={96} width={224} height={52} rx={14} fill={C.teal} stroke={C.ink} strokeWidth={6} />
            <text x={0} y={122} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={38} letterSpacing={2} fill={C.cream}>NO SLOSH</text>
          </g>
        </g>
      )}
    </g>
  );
};

const B03Graphics: React.FC<{f: number; toS: (x: number, y: number) => {x: number; y: number}; bikeX: number}> = ({f, toS, bikeX}) => {
  if (f < B3.curb - 2 || f > B3.off + 8) return null;
  const o = 1 - ramp(f, B3.off, B3.off + 6, (x) => x);
  const curb = toS(PLAZA.cam + 18, GYW + 80);
  const bk = toS(bikeX, BIKE_Y - 190 - 60);
  const gs = popScale(f, B3.curb), ls = popScale(f, B3.loose);
  return (
    <g opacity={o}>
      <Leader from={{x: curb.x, y: curb.y + 20}} to={{x: curb.x, y: curb.y + 2}} opacity={gs > 0.4 ? 1 : 0} />
      <Chip x={curb.x} y={curb.y + 52} w={330} text="GROUND 0 MPH" tone="still" scale={gs} />
      <Chip x={bk.x} y={bk.y - 30} w={250} text="LOOSE" tone="move" arrow scale={ls * (bk.x > -60 && bk.x < W + 60 ? 1 : 0)} />
    </g>
  );
};
void PLAZA_OBJ;
