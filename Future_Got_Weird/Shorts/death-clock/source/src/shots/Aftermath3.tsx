// V3 arrival -> treatment -> recovery -> the question -> the loop bridge, in his street world with the same rig.
// The drone arrives as assistance and hovers beside him (a data link to the band, no healing light); the band
// treats: its case turns, the port presses, one blue pulse runs into the established vessel and up the arm to
// the heart, whose rhythm settles; the window closes as his fingers release and he breathes. The support hand
// loads, he pushes up to sitting and lifts the wrist: green replaces red, "Life Expectancy: 42 Years". Unease.
// The camera returns to the glass; one local "?" glitch turns into the red 00:02:14 of the opening, and the same
// push carries on through frames 0-7 of the next play (the cold open), so the loop is one camera move.
import React from 'react';
import {armFrame, DeviceView} from '../art/Device';
import {Drone, DronePose} from '../art/Drone';
import {EXPR_GASP, EXPR_PAIN, EXPR_RELIEF, EXPR_UNEASY, Expr, mixExpr} from '../art/Head';
import {HAND_BRACE, HAND_CLUTCH, HAND_RELAXED, HandPose, mixHand} from '../art/Hand';
import {PortModule, SectionLayers, VesselTube} from '../art/Interior';
import {ChestCut, cutGeo, cutPathD} from '../art/Cutaway';
import {manJoints, ManPose, torsoPath} from '../art/Man';
import {Cam} from '../lib/camera';
import {PAL} from '../lib/color';
import {deviceState3} from '../lib/device3';
import {limbGeo} from '../lib/limb';
import {spline, splineRec, SKey} from '../lib/motion';
import {add, clamp, easeIn, easeInOut, easeOut, fmt, inv, lerp, mul, noise1, V} from '../lib/math';
import {Glow} from '../lib/shade';
import {B, TOTAL} from '../lib/timeline3';
import {PROP} from './Opening';
import {BAND_C, LOCAL_PER_WORLD, PJ, R0, SEC_ROLL, SF, VP, VPX, W} from './Journey3';
import {Scene} from './Scene';

const ease = easeInOut;
const zLog = (f: number, keys: [number, number][]) => Math.exp(spline(f, keys.map(([t, z]) => [t, Math.log(z)])));
/** loop time: frames 0-7 of the film continue the end of this scene */
export const loopF = (f: number) => (f < B.cut ? f + TOTAL : f);

// ---------------------------------------------------------------- body
const SIT: ManPose = {...PROP, torso: 2, chest: 8, neck: 2, lW: 0, lTu: -150, lTv: -170, lElb: -1, lWr: -4, turn: 0.42};
const BODY: SKey<ManPose>[] = [
  [B.release0, {...PROP}, 'stop'],
  // the support hand loads: weight shifts onto the arm before the push
  [B.release0 + 14, {...PROP, torso: 18, chest: 35, neck: -10}],
  // the push: the torso rises round the hips while the hand still holds the grass
  [B.rise0 + 14, {...PROP, torso: 9, chest: 20, neck: -4}],
  [B.rise1 - 6, {...PROP, torso: 3, chest: 10, neck: 0, lWr: 70}],
  // the hand leaves the grass and the wrist comes up in front of him
  [B.green + 14, {...SIT, lW: 0, lWr: 0}],
  [B.life + 10, {...SIT, neck: 4}],
  [B.uneasy0 + 12, {...SIT, neck: 0, turn: 0.38}],
  [B.return0, {...SIT, neck: 2}],
  [TOTAL + B.cut, {...SIT, neck: 3}],
];

export const manAt = (f: number): ManPose => {
  if (f < B.release0) {
    // breathing is held while the camera is inside the arm (the section frame is built on the still pose)
    const env = clamp(1 - inv(B.act0 - 6, B.act0, f) + inv(B.settleHeart1 - 6, B.release0, f));
    const br = Math.sin(f * 0.21) * env;
    return {...PROP, breath: 0.5 + 0.5 * br, torso: PROP.torso + 0.6 * br, chest: PROP.chest + 1.4 * Math.sin(f * 0.21 + 0.6) * env};
  }
  let m = splineRec(f, BODY);
  // the hand target blends from the grass to the raised position (the arm IK stays continuous)
  const lift = ease(inv(B.rise1 - 4, B.green + 12, f));
  m = {...m, lW: 1 - lift, lWx: PROP.lWx, lWy: PROP.lWy};
  // a deep breath out at the release, then calmer breathing
  const deep = Math.sin(Math.PI * clamp(inv(B.release0 - 2, B.release0 + 24, f)));
  const br = Math.sin(f * 0.16);
  return {...m, breath: 0.5 + 0.4 * br + 0.5 * deep, chest: m.chest + 0.8 * br - 3 * deep};
};

const exprAt = (f: number): Expr => {
  const atBand: Expr = {...EXPR_PAIN, shut: 0, lid: 0.18, squint: 0.25, gx: 0.55, gy: 0.75, pupil: 0.7};
  if (f < B.release0) return mixExpr(atBand, {...EXPR_GASP, gx: 0.4, gy: 0.6}, 0.3 + 0.2 * Math.sin(f * 0.1));
  const relieved: Expr = {...EXPR_RELIEF, gx: -0.35, gy: 0.75};
  const reading: Expr = {...EXPR_RELIEF, gx: -0.45, gy: 0.8, smile: 0, open: 0.12};
  const uneasy: Expr = {...EXPR_UNEASY, gx: 0.1, gy: 0.05};
  const backDown: Expr = {...EXPR_UNEASY, gx: -0.45, gy: 0.75};
  if (f < B.green) return mixExpr(atBand, relieved, ease(inv(B.release0, B.rise1, f)));
  if (f < B.uneasy0) return mixExpr(relieved, reading, ease(inv(B.green, B.life, f)));
  if (f < B.return0) return mixExpr(reading, uneasy, ease(inv(B.uneasy0, B.uneasy0 + 16, f)));
  return mixExpr(uneasy, backDown, ease(inv(B.return0, B.return0 + 18, f)));
};

const handsAt = (f: number): {l: HandPose; r: HandPose} => {
  const dig = {...HAND_BRACE, curl: [0.34, 0.38, 0.4, 0.42] as HandPose['curl'], spread: 0.8, thumbCurl: 0.35};
  const flat = {...HAND_BRACE, curl: [0.12, 0.12, 0.16, 0.18] as HandPose['curl'], spread: 0.9};
  const claw = {...HAND_CLUTCH, curl: [0.5, 0.56, 0.6, 0.64] as HandPose['curl'], spread: 0.6, thumb: 40};
  let l: HandPose = mixHand(dig, flat, ease(inv(B.release0, B.release0 + 10, f)));
  l = mixHand(l, HAND_RELAXED, ease(inv(B.rise1 - 4, B.green + 10, f)));
  // the callback: the fingers tense again with the red screen (and keep tensing into the cold open)
  l = mixHand(l, claw, ease(inv(B.callback - 2, TOTAL + B.cut, f)));
  const r0 = mixHand(HAND_CLUTCH, {...HAND_CLUTCH, curl: [0.55, 0.62, 0.66, 0.7]}, 0.5 + 0.5 * Math.sin(f * 0.3));
  const r = mixHand(r0, {...HAND_CLUTCH, curl: [0.3, 0.34, 0.38, 0.42], spread: 0.5}, ease(inv(B.release0, B.release0 + 20, f)));
  return {l, r};
};

// ---------------------------------------------------------------- the drone: arrives beside him and hovers
const HOVER = {x: BAND_C.x - 150, y: PJ.head.y - 250};
export const arriveDrone3 = (f: number): DronePose => {
  const t = easeOut(inv(B.past0 + 4, B.act0 + 4, f));
  const back = ease(inv(B.rise0, B.green + 30, f));
  return {
    x: lerp(HOVER.x - 700, HOVER.x, t) - back * 120,
    y: lerp(HOVER.y - 420, HOVER.y, t) - back * 260 + Math.sin(f * 0.2) * 5 * t,
    s: 0.72,
    pitch: lerp(16, 0, ease(t)) - 6 * back,
    spin: f * 1.8,
    beacon: 0.5 + 0.5 * Math.sin(f * 0.6),
  };
};

// ---------------------------------------------------------------- camera
const SEC_VIEW = W(SF.Xp - 760, 420);
const PORT_VIEW = W(SF.Xp - 80, 200);
const VES_VIEW = W(SF.Xp - 900, 520);
const CUT0 = cutGeo(PJ.C, PJ.tc, PROP.s, 1);
const HEART0 = CUT0.loc(86, -46);
const MED = {x: 560, y: 1450};

export const camAt = (g: number, wristW: V, headW: V): Cam => {
  if (g < B.release0 + 4) {
    const keys: [number, V, number][] = [
      [B.past0 + 8, {x: 470, y: 1350}, 1.35],
      [B.arrive, {x: 500, y: 1420}, 1.6],
      [B.act0 + 2, BAND_C, 6.5],
      [B.act0 + 14, SEC_VIEW, 11],
      [B.inject0 - 4, PORT_VIEW, 18],
      [B.inject0 + 10, PORT_VIEW, 20],
      [B.inject1 - 6, VES_VIEW, 15],
      [B.settleHeart0 + 6, add(mul(BAND_C, 0.4), mul(PJ.L.E, 0.6)), 3.6],
      [B.settleHeart0 + 18, add(mul(HEART0, 0.7), mul(CUT0.c, 0.3)), 4.8],
      [B.settleHeart1 - 4, HEART0, 5.2],
      [B.release0 + 4, MED, 2.2],
    ];
    return {x: spline(g, keys.map(([t, p]) => [t, p.x])), y: spline(g, keys.map(([t, p]) => [t, p.y])), z: zLog(g, keys.map(([t, , z]) => [t, z])), roll: 0};
  }
  // recovery and the question; the end pushes into the glass and keeps going through the loop point
  const twoShot = (k: number) => ({x: lerp(headW.x, wristW.x, k) + 10, y: lerp(headW.y, wristW.y, k)});
  const keys: [number, V, number][] = [
    [B.release0 + 4, MED, 2.2],
    [B.rise0, {x: 560, y: 1420}, 2.0],
    [B.rise1, {x: 560, y: 1380}, 1.9],
    [B.green + 6, twoShot(0.86), 4.2],
    // "life expectancy, forty-two years": the readout large and readable
    [B.life + 4, wristW, 9.0],
    [B.life + 46, wristW, 9.4],
    // his uneasy reaction: face and band together, the band above the caption lane
    [B.uneasy0 + 6, twoShot(0.6), 2.4],
    [B.return0, twoShot(0.6), 2.3],
    [B.glitch - 8, wristW, 7.5],
    [B.callback, wristW, 9.4],
    [TOTAL + B.cut, wristW, 11.6],
  ];
  const c = {x: spline(g, keys.map(([t, p]) => [t, p.x])), y: spline(g, keys.map(([t, p]) => [t, p.y])), z: zLog(g, keys.map(([t, , z]) => [t, z]))};
  // a slow roll during the push to the glass gives the bridge its own steady motion
  const roll = lerp(0, -5, ease(inv(B.return0, TOTAL + B.cut, g)));
  return {...c, roll};
};

// ---------------------------------------------------------------- render
export const Aftermath3: React.FC<{id: string; f: number}> = ({id, f}) => {
  const g = loopF(f);
  const man = manAt(g);
  const j = manJoints(man);
  const bandW = add(j.L.W, mul(j.L.foreDir, -1.75 * 17 * man.s));
  const cam0 = camAt(g, bandW, j.head);
  // the warning transient at the loop point: a short shake of the glass close-up
  const hit = g >= TOTAL ? Math.exp(-(g - TOTAL) / 3) : 0;
  const cam: Cam = hit > 0.01 ? {...cam0, x: cam0.x + (hit * noise1(g * 3.3, 61) * 3) / cam0.z * 6, y: cam0.y + (hit * noise1(g * 2.9, 62) * 3) / cam0.z * 6} : cam0;
  const expr = exprAt(g);
  const hands = handsAt(g);
  const blink = Math.max(0, 1 - Math.abs(((g - 20) % 85) - 3) / 3) * (g > B.return0 + 20 ? 0 : 1);

  // treatment (in the established section) and the heart settling (the chest window)
  const secOn = g >= B.act0 + 4 && g < B.settleHeart0 + 4;
  const roll = g < B.act0 ? 0 : g < B.settleHeart0 + 4 ? SEC_ROLL * ease(inv(B.act0, B.act0 + 12, g)) : SEC_ROLL * (1 - ease(inv(B.settleHeart0 + 4, B.settleHeart0 + 16, g)));
  const open = ease(inv(B.act0 + 4, B.act0 + 16, g)) * (1 - ease(inv(B.settleHeart0, B.settleHeart0 + 6, g)));
  const portExt = clamp(inv(B.inject0 - 8, B.inject0, g)) * (1 - clamp(inv(B.inject1, B.inject1 + 10, g)));
  const treat = clamp(inv(B.inject0, B.inject0 + 16, g));
  const waveS = lerp(VP.entry, VP.entry + 5200, clamp(inv(B.inject0 + 10, B.settleHeart0 + 6, g)));
  const pxs = cam.z / LOCAL_PER_WORLD;
  const backdrop = clamp(inv(B.act0 + 2, B.act0 + 12, g)) * (1 - clamp(inv(B.settleHeart0, B.settleHeart0 + 10, g)));
  const tube = <VesselTube id={`${id}-vt`} path={VP} f={g} px={pxs} s0={VP.entry - 900} s1={99999} sensors={1} sensorFront={VP.entry + 4000} wave={g >= B.inject0 + 10 ? {s: waveS, a: 1} : undefined} dimFrom={waveS} />;
  // the see-through arm and the chest window while the wave climbs to the heart
  const xA = clamp(inv(B.settleHeart0 - 4, B.settleHeart0 + 6, g)) * (1 - clamp(inv(B.settleHeart1 + 4, B.release0 + 8, g)));
  const cutOpen = ease(inv(B.settleHeart0 + 2, B.settleHeart0 + 14, g)) * (1 - ease(inv(B.settleHeart1, B.release0 + 6, g)));
  const cg = cutGeo(j.C, j.tc, man.s, cutOpen);
  const chaos = 1 - ease(inv(B.settleHeart0 + 16, B.settleHeart1 - 2, g));
  const waveX = lerp(40, VPX.L - 40, ease(inv(B.settleHeart0, B.settleHeart0 + 22, g)));
  const chest = (key: string) => (
    <ChestCut id={`${id}-${key}`} f={g} g={cg} cam={cam} open={cutOpen} organ={1 - 0.5 * ease(inv(B.settleHeart0 + 20, B.settleHeart1, g))} chaos={chaos} organSense={0.8} heartSense={1} heartPos={cg.loc(86, -46)} heartSize={27 * man.s} bodyD={torsoPath(man)} />
  );
  const limbD = limbGeo(j.L.S, j.L.E, j.L.W, 29 * man.s, 23.5 * man.s, 17 * man.s).d;
  const A = armFrame(j.L.E, j.L.W, R0.rE, R0.rW);
  const u0 = A.L - (1.75 + 0.62) * A.rW;
  const bandCut = (() => {
    const a = add(A.E, mul(A.u, u0));
    const b = add(A.E, mul(A.u, A.L + 400));
    const n = mul(A.n, 400);
    return `M${fmt(a.x + n.x)},${fmt(a.y + n.y)} L${fmt(b.x + n.x)},${fmt(b.y + n.y)} L${fmt(b.x - n.x)},${fmt(b.y - n.y)} L${fmt(a.x - n.x)},${fmt(a.y - n.y)} Z`;
  })();
  const vline = `M${VPX.pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}`;
  const overAll =
    xA > 0.01 ? (
      <g>
        <defs>
          <mask id={`${id}-lc`}>
            <path d={limbD} fill="#FFF" />
            <path d={bandCut} fill="#000" />
          </mask>
          <clipPath id={`${id}-cc`}>
            <path d={cutPathD(cg)} />
          </clipPath>
        </defs>
        <g mask={`url(#${id}-lc)`} opacity={xA}>
          {cutOpen > 0.01 && (
            <g clipPath={`url(#${id}-cc)`}>
              {chest('cx2')}
              <path d={limbD} fill="#F7D3BD" opacity={0.14} />
            </g>
          )}
          <g transform={SF.matrix}>
            <path d={vline} fill="none" stroke="#C9566A" strokeWidth={560} strokeLinecap="round" strokeLinejoin="round" opacity={0.28} />
            <path d={vline} fill="none" stroke="#E07A88" strokeWidth={300} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />
            <VesselTube id={`${id}-xt`} path={VPX} f={g} px={pxs} s0={0} s1={99999} sensors={1} sensorFront={VPX.L} wave={{s: waveX, a: 1}} dimFrom={waveX} />
            {/* the treatment pulse climbing the arm toward the heart */}
            {[0, 90, 180, 270].map((d, i) => {
              const q = VPX.at(Math.max(0, waveX - d));
              return <circle key={i} cx={fmt(q.p.x)} cy={fmt(q.p.y)} r={fmt(i ? 120 - i * 22 : 190)} fill={i ? '#7FE3FF' : '#39C6F4'} opacity={i ? 0.5 - i * 0.12 : 0.35} />;
            })}
            <circle cx={fmt(VPX.at(waveX).p.x)} cy={fmt(VPX.at(waveX).p.y)} r={70} fill="#E4FBFF" />
          </g>
        </g>
      </g>
    ) : null;

  const dev: DeviceView = {
    screen: deviceState3(f < B.cut ? f : g),
    roll,
    yaw: 14,
    flip: false,
    upright: true,
    glow: 1 + 0.8 * hit,
    caseOpen: secOn ? open : 0,
    caseCut: () => (
      <g transform={SF.matrix}>
        <PortModule id={`${id}-pm`} sf={SF} f={g} ext={portExt} reservoir={1} blue={1} />
      </g>
    ),
    inArm: () =>
      secOn ? (
        <g transform={SF.matrix}>
          <SectionLayers id={`${id}-sec`} sf={SF} f={g} open={open} tube={tube} stream={0} streamA={0} treat={treat} />
        </g>
      ) : null,
  };
  const dp = arriveDrone3(g);
  const showDrone = g < B.return0 + 30;
  const linkA = clamp(inv(B.arrive - 6, B.arrive + 4, g)) * (1 - clamp(inv(B.act0 + 2, B.act0 + 8, g)));
  return (
    <Scene
      id={id}
      cam={cam}
      man={man}
      expr={expr}
      blink={blink}
      lHand={hands.l}
      rHand={hands.r}
      dog={{x: 1070, y: 1790, s: 1.4, facing: -1, sit: ease(inv(B.green, B.life, g)), head: 26 + 4 * Math.sin(g * 0.05), ears: 0.95, tail: lerp(-6, 14, ease(inv(B.rise0, B.green, g))) + 6 * Math.sin(g * 0.3) * ease(inv(B.green, B.life, g)), lean: 0, step: 0, stepAmt: 0, worry: lerp(1, 0.4, ease(inv(B.rise0, B.life, g)))}}
      hairSway={0}
      dev={dev}
      backdrop={backdrop}
      backdropC={W(SF.Xp - 600, 400)}
      leash={!secOn && xA < 0.05}
      nearLegFront
      noTufts
      afterRightArm={cutOpen > 0.01 ? chest('cx') : null}
      overAll={overAll}
      extra={
        <g>
          {showDrone && <Drone id={`${id}-dr`} p={dp} />}
          {/* the drone has found him: a thin data link to the band (no light on him) */}
          {linkA > 0.01 && (
            <g opacity={linkA}>
              <path d={`M${fmt(dp.x)},${fmt(dp.y + 40 * dp.s)} L${fmt(bandW.x)},${fmt(bandW.y)}`} stroke={PAL.signal} strokeWidth={3} strokeDasharray="6 10" opacity={0.8} />
              <circle cx={fmt(bandW.x)} cy={fmt(bandW.y)} r={fmt(22 + 8 * Math.sin(g * 0.5))} fill="none" stroke={PAL.signal} strokeWidth={3} />
            </g>
          )}
          {/* the warning transient at the loop point: one red ring off the glass */}
          {hit > 0.02 && (
            <g>
              <circle cx={fmt(bandW.x)} cy={fmt(bandW.y)} r={fmt(26 + (1 - hit) * 40)} fill="none" stroke="#FF5A66" strokeWidth={fmt(1 + 3 * hit)} opacity={0.9 * hit} />
              <Glow id={`${id}-hg`} c={bandW} r={60} color="#FF3B4E" alpha={0.5 * hit} />
            </g>
          )}
        </g>
      }
    />
  );
};

export {EXPR_UNEASY, easeIn};
