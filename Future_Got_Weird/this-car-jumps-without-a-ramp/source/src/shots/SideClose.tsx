// 1:48–2:14, side view: after the real clip replays, the same hop in the established cutaway with its two forces
// (the road force vanishes at separation, gravity stays), the landing, then a short drive past the jobs the narration
// names (brake, turn, uneven pavement) and a composed stop under the last words, with the channel mark in the scene.
import React from 'react';
import {C, F} from '../theme';
import {w} from '../cues';
import {SideCar, bodyToWorld} from '../car/side';
import {Arrow} from '../car/parts';
import {AXLE_F, AXLE_R, COM, WHEEL_R} from '../car/geom';
import {Cam, Chip, Label, camKeys, toScreen, World} from '../kit/stage';
import {SideWorld, Sign} from '../kit/sideworld';
import {G, MTOT} from '../sim/launch';
import {clamp01, easeInOut, easeOut, keys, seg, smooth, warp, win} from '../kit/util';
import {CAM_WIDE, CAM_DIAG, LW, launchPose} from './SideLaunch';

export const T = {
  watch: w('b6', 'watch'),
  again: w('b6', 'again'),
  suspension: w('b6', 'suspension'),
  builds: w('b6', 'builds'),
  grounded: w('b6', 'grounded'),
  contact: w('b6', 'contact'),
  breaks: w('b6', 'breaks'),
  gravity: w('b6', 'gravity'),
  flight: w('b6', 'flight'),
  hop: w('b6', 'hop'),
  demonstration: w('b6', 'demonstration'),
  useful: w('b6', 'useful'),
  brake: w('b6', 'brake'),
  turn: w('b6', 'turn'),
  uneven: w('b6', 'uneven'),
  pavement: w('b6', 'pavement'),
  supercar: w('b6', 'supercar'),
  jump: w('b6', 'jump', 1),
  most: w('b6', 'most'),
  harder: w('b6', 'harder'),
  keeping: w('b6', 'keeping'),
  composed: w('b6', 'composed'),
  ground: w('b6', 'ground'),
};
export const CLOSE_IN = T.watch - 0.42; // the real clip starts (cut)
export const MATCH_T = T.suspension - 0.25; // the vector car takes over from the real one
const take = T.breaks - 0.05;
const land = T.flight + 0.75;
const WARP: [number, number][] = [[MATCH_T, 0.3], [T.builds + 0.3, 0.92], [T.grounded + 0.4, 1.05], [take, 1.104], [land, 1.404], [land + 0.9, 1.75], [land + 1.6, 2.4]];

// the drive: from rest, gentle acceleration, cruise past the signs, then a composed stop
const GO = T.useful - 0.6;
const STOP = T.composed + 0.35;
const VC = 9000; // mm/s
const xAt = (t: number) => {
  if (t <= GO) return 0;
  const a1 = GO + 1.2; // accelerate over 1.2 s
  if (t < a1) return (0.5 * VC * (t - GO) ** 2) / 1.2;
  const x1 = 0.5 * VC * 1.2;
  const b0 = STOP - 1.8; // brake over 1.8 s
  if (t < b0) return x1 + VC * (t - a1);
  const xb = x1 + VC * (b0 - a1);
  const u = Math.min(t, STOP) - b0;
  return xb + VC * u - (0.5 * VC * u * u) / 1.8;
};
const signAt = (tw: number) => xAt(tw) + 2900; // a sign sits just ahead of the nose when its word is spoken
const BUMP_C = [0, 1, 2, 3].map((i) => (xAt(T.uneven) + 1200 + i * 1700) / 1000);
const BUMP2 = [0, 1, 2].map((i) => (xAt(T.most + 0.3) + 1500 + i * 2300) / 1000);
export const CLOSE_EV = {take, land, go: GO, stop: STOP, signBrake: T.brake, xAt: (t: number) => xAt(t)};
export const closeRoad = (xm: number) => road(xm);
const road = (xm: number) => {
  let h = 0;
  for (const c of BUMP_C) { const u = (xm - (c - 0.35)) / 0.7; if (u > 0 && u < 1) h = Math.max(h, 0.045 * Math.sin(Math.PI * u) ** 2); }
  for (const c of BUMP2) { const u = (xm - (c - 0.5)) / 1.0; if (u > 0 && u < 1) h = Math.max(h, 0.03 * Math.sin(Math.PI * u) ** 2); }
  return h;
};

export const SideClose: React.FC<{t: number}> = ({t}) => {
  const W = MTOT * G;
  const s = warp(t, WARP);
  const lp = launchPose(t < GO ? s : 3.0);
  const X = xAt(t);
  // wheels follow the road; the body follows a smoothed version of it (composed, not rigid)
  const rf = road((X + AXLE_F) / 1000) * 1000, rr = road((X + AXLE_R) / 1000) * 1000;
  const smoothRoad = (xx: number) => {
    let acc = 0;
    for (let k = -4; k <= 4; k++) acc += road((xx + k * 220) / 1000) * 1000;
    return acc / 9;
  };
  const bf = smoothRoad(X + AXLE_F) * 0.55, br = smoothRoad(X + AXLE_R) * 0.55;
  const brakeEnd = keys(t, [[STOP - 1.8, 0], [STOP - 1.2, -1], [STOP - 0.2, -1], [STOP + 0.35, 0.22], [STOP + 1.1, 0]], easeInOut);
  const brakeMid = Math.max(0, 1 - Math.abs(t - T.brake - 0.2) / 0.45);
  const pitch = (Math.atan2(bf - br, 2900) * 180) / Math.PI + 0.55 * brakeEnd - 0.5 * brakeMid;
  const dz = t < GO ? lp.dz : (bf + br) / 2 + 3 * brakeEnd;
  const wf = t < GO ? lp.wz : rf, wr = t < GO ? lp.wz : rr;
  const rot = -(X / (2 * Math.PI * WHEEL_R)) * 360;
  const cutaway = smooth(seg(t, MATCH_T + 0.2, MATCH_T + 0.9)) * (1 - smooth(seg(t, T.demonstration - 0.6, T.demonstration + 0.2)));

  // camera: match framing (opening), the diagram framing for the slowed hop, then track the drive and settle
  const camBase = camKeys(t, [[CLOSE_IN, CAM_WIDE], [MATCH_T + 0.3, CAM_WIDE], [MATCH_T + 1.3, CAM_DIAG], [land + 0.8, CAM_DIAG], [T.useful, {x: 600, y: 760, z: 0.27}], [T.most, {x: 600, y: 760, z: 0.27}], [STOP + 0.6, {x: 1150, y: 720, z: 0.33}]], easeInOut);
  const track = t > GO ? Math.max(0, X - 1200 * smooth(seg(t, GO, GO + 1.5))) : 0;
  const cam: Cam = {...camBase, x: camBase.x + track};
  const px = cam.z;

  // forces during the replayed hop
  const diag = win(t, MATCH_T + 0.5, land + 1.0, 0.4, 0.4);
  const Nax = lp.st.N / 2 / W;
  const com = bodyToWorld({x: X, dz, pitch}, COM.x, COM.y);
  const ax = [X + AXLE_R, X + AXLE_F];
  const sc = (x: number, y: number) => toScreen(cam, x, y);
  const gl = sc(com[0] + 90, com[1] - LW * 0.5);
  const rfl = sc(X + AXLE_F + 150, -Nax * LW * 0.5 - 10);
  const signs: Sign[] = [
    {x: signAt(T.brake), kind: 'brake'},
    {x: signAt(T.turn), kind: 'bend'},
    {x: signAt(T.uneven), kind: 'bumps'},
  ];
  const brakeGlow = brakeMid + Math.max(0, -brakeEnd);
  const mark = smooth(seg(t, T.ground - 0.2, T.ground + 0.6));
  return (
    <g>
      <SideWorld cam={cam} profile={(xm) => road(xm / 1000) * 1000} signs={signs} />
      <World cam={cam}>
        <SideCar x={X} dz={dz} pitch={pitch} wf={wf} wr={wr} rot={rot} px={px} cutaway={cutaway} actuator={1} forceF={t < GO ? lp.force : 0} forceR={t < GO ? lp.force : 0} brake={clamp01(brakeGlow)} id="close" />
        {diag > 0 && (
          <g opacity={diag}>
            <circle cx={com[0]} cy={com[1]} r={58} fill={C.white} stroke={C.ink} strokeWidth={3.5 / px} />
            <path d={`M ${com[0]} ${com[1]} L ${com[0] + 58} ${com[1]} A 58 58 0 0 1 ${com[0]} ${com[1] + 58} Z M ${com[0]} ${com[1]} L ${com[0] - 58} ${com[1]} A 58 58 0 0 1 ${com[0]} ${com[1] - 58} Z`} fill={C.ink} />
            <Arrow x={com[0]} y={com[1] - 70} dx={0} dy={-(LW - 70)} px={px} color={C.blue} width={16} />
            {ax.map((x, i) => <Arrow key={i} x={x + 70} y={-Nax * LW - 10} dx={0} dy={Nax * LW} px={px} color={C.teal} width={16} opacity={Nax > 0.01 ? 1 : 0} />)}
          </g>
        )}
      </World>
      <Label x={gl.x + 110} y={gl.y} text="GRAVITY" color={C.blueLight} size={34} opacity={diag} />
      <Label x={rfl.x + 140} y={rfl.y} text="ROAD FORCE" color={C.tealLight} size={34} opacity={diag * (Nax > 0.02 ? 1 : 0)} />
      <Label x={sc(X, -330).x} y={sc(X, -330).y + 30} text="NO TIRE CONTACT" color={C.coral} fg={C.white} size={38} opacity={diag * (lp.st.air && t < GO ? 1 : 0)} />
      <Chip x={40} y={40} text="SLOWED DOWN" opacity={win(t, MATCH_T + 0.4, land + 0.9, 0.3, 0.3)} />
      <Chip x={40} y={92} text="SIMPLIFIED" opacity={cutaway * 0.95} dark={false} size={22} />
      {/* channel mark, sitting in the final scene */}
      <g opacity={mark} transform={`translate(1880 1040)`}>
        <text x={0} y={0} textAnchor="end" fontFamily={F.display} fontWeight={700} fontSize={44} fill={C.ink}>
          FUTURE <tspan fill={C.coral}>GOT</tspan> WEIRD
        </text>
      </g>
    </g>
  );
};
