// Every shot as a pure function of the absolute frame. Boundaries come from SHOT (lib/timeline.ts),
// device states from deviceState (lib/device.ts). The cue sheet (script/CUE_SHEET.md) is generated
// from the same constants.
import React from 'react';
import {BodyMap, bodyCam} from '../art/Body';
import {CrossSection, crossCam} from '../art/CrossSection';
import {collarRing, Dog, DogPose, DOG_IDLE} from '../art/Dog';
import {Drone} from '../art/Drone';
import {EXPR_GASP, EXPR_PAIN, EXPR_RELIEF, EXPR_UNEASY, EXPR_WINCE, Expr, mixExpr} from '../art/Head';
import {HAND_CLUTCH, HAND_LIMP, HAND_RELAXED, HAND_BRACE, HandPose, mixHand} from '../art/Hand';
import {Man, manJoints, ManPose} from '../art/Man';
import {NeighbourhoodMap} from '../art/Map';
import {Street} from '../art/Street';
import {VesselRide, vesselCam} from '../art/Vessel';
import {CLOSE, WristClose} from '../art/WristClose';
import {Bead, BeadDefs, pathAt, smoothPath} from '../art/Beads';
import {Cam, Layer} from '../lib/camera';
import {mix, PAL, shade} from '../lib/color';
import {DEV, deviceState} from '../lib/device';
import {SKey, spline, splineRec, spring} from '../lib/motion';
import {add, clamp, easeIn, easeInOut, easeOut, fmt, inv, Key, lerp, noise1, settle, track, trackRec, V} from '../lib/math';
import {Glow, Lin, SoftShadow} from '../lib/shade';
import {fE, fS, SHOT} from '../lib/timeline';
import {fallState, followThrough, GROUND, Leash, StreetScene, StreetState} from './StreetShots';

const ang = (d: V) => (Math.atan2(d.y, d.x) * 180) / Math.PI;
const normAng = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
const blinkAt = (f: number, at: number[]) => Math.max(0, ...at.map((b) => 1 - Math.abs(f - b) / 3));

/** The opening wrist framing (S03 landing); the ending returns to it. Watch centred, his face in the upper third. */
export const OPEN_FRAME: Cam = {x: 640, y: 972, z: 1.5};

// ---------------------------------------------------------------- S01-S03: collapse, zoom to the wrist
const LIE = fallState(51);

/** After the fall: the lying man breathes in shallow, pained breaths. */
const lyingState = (f: number): StreetState => {
  const st = f <= 51 ? fallState(f) : LIE;
  if (f <= 51) return st;
  const br = 0.5 + 0.5 * Math.sin(f * 0.5);
  return {...st, man: {...st.man, breath: br, torso: st.man.torso + br * 0.6}, expr: mixExpr(EXPR_WINCE, EXPR_PAIN, 0.5 + 0.5 * Math.sin(f * 0.13))};
};

const streetBand = (st: StreetState) => {
  const j = manJoints(st.man);
  return {c: add(j.L.W, {x: (j.L.foreDir.x * -20 * j.s), y: (j.L.foreDir.y * -20 * j.s)}), a: ang({x: j.L.W.x - j.L.E.x, y: j.L.W.y - j.L.E.y})};
};
const CLOSE_DIR = ang({x: CLOSE.wrist.x - CLOSE.elbow.x, y: CLOSE.wrist.y - CLOSE.elbow.y});

export const S01_03 = (f: number) => {
  const [, s3e] = SHOT.s03;
  const cut = 60;
  if (f < 51) return <StreetScene id="s01" st={fallState(f)} />;
  if (f < cut) {
    const st = lyingState(f);
    const b = streetBand(st);
    const t = easeIn(inv(51, cut, f));
    const cam: Cam = {x: lerp(LIE.cam.x, b.c.x, t), y: lerp(LIE.cam.y, b.c.y, t), z: lerp(LIE.cam.z, 7.5, t), roll: normAng(CLOSE_DIR - b.a) * easeInOut(inv(51, cut, f))};
    return <StreetScene id="s03a" st={{...st, cam}} />;
  }
  // the close-up: land on the watch by ~2.2 s, hold on VITAL SCAN with a slight red edge warning, then dive
  const land = settle(inv(cut, cut + 14, f) * 1.6, 4.5, 9);
  const diveT = easeIn(inv(s3e - 13, s3e, f));
  const z0 = lerp(1.18, OPEN_FRAME.z, land) + 0.12 * inv(cut + 8, s3e - 13, f);
  const cam: Cam = {x: lerp(lerp(OPEN_FRAME.x, 660, inv(cut + 8, s3e - 13, f)), CLOSE.watch.x, diveT), y: lerp(OPEN_FRAME.y, CLOSE.watch.y, diveT), z: z0 + diveT * diveT * 14};
  const screen = {...deviceState(f), dive: clamp(inv(s3e - 9, s3e - 2, f))};
  const br = 0.5 + 0.5 * Math.sin(f * 0.5);
  return (
    <WristClose
      id="s03"
      cam={cam}
      screen={screen}
      expr={mixExpr(EXPR_WINCE, EXPR_PAIN, 0.5 + 0.5 * Math.sin(f * 0.13))}
      blink={blinkAt(f, [84])}
      hand={mixHand(HAND_LIMP, {...HAND_LIMP, curl: [0.36, 0.42, 0.46, 0.5]}, 0.5 + 0.5 * Math.sin(f * 0.2))}
      breath={br}
    />
  );
};

// ---------------------------------------------------------------- S04: the cutaway
export const S04 = (f: number) => {
  const [s0, s1] = SHOT.s04;
  const t0 = fS('injecting');
  return <CrossSection id="s04" st={{f, cam: crossCam(f, s0, s1), needle: inv(t0 - 8, t0, f), t0}} />;
};

// ---------------------------------------------------------------- S05-S06: bloodstream and cells
export const S05_06 = (f: number) => {
  const a = SHOT.s05[0];
  const b = SHOT.s06[0];
  const c = SHOT.s06[1];
  return <VesselRide id="s05" st={{f, cam: vesselCam(f, a, b, c), a, b, c, decayAt: fS('decay')}} />;
};

// ---------------------------------------------------------------- S07: body map and heart
export const bodyState = (f: number) => {
  const [f0, f1] = SHOT.s07;
  return {
    f,
    cam: bodyCam(f, f0, fS('organs'), fS('heart'), f1 - 26, f1),
    organs: inv(fS('begin to fail'), fS('fail') + 6, f) * (1 - 0.9 * inv(fS('heart') - 4, fS('heart') + 10, f)),
    chaos: inv(fS('lethal') - 4, fS('lethal') + 8, f),
    signal: inv(f1 - 26, f1 - 2, f),
    ecg: inv(fS('heart') + 2, fS('heart') + 10, f) * (1 - inv(f1 - 24, f1 - 14, f)),
    dots: 1,
  };
};
export const S07 = (f: number) => <BodyMap id="s07" st={bodyState(f)} />;

// ---------------------------------------------------------------- S08-S10: warning, exact second, help alert
const pained = (f: number): Expr => mixExpr(EXPR_WINCE, EXPR_GASP, 0.5 + 0.5 * Math.sin(f * 0.11));

export const S08_10 = (f: number) => {
  const [a] = SHOT.s08;
  const [b] = SHOT.s09;
  const [c, d] = SHOT.s10;
  // S08: match cut from the body map's wrist, pull back to reveal his face, slow push.
  // S09: close crop on the digits, hold, small pull back to his face and hand. S10: settle as the wave leaves.
  const W = CLOSE.watch;
  const cam: Cam = {
    // monotone splines: the camera flows through its marks instead of stopping at each one
    x: spline(f, [[a, W.x, 'hit'], [a + 12, 640], [b - 4, 650], [b + 20, W.x], [b + 56, W.x], [c - 6, 560], [c + 16, 640]]),
    y: spline(f, [[a, W.y, 'hit'], [a + 12, 972], [b - 4, 980], [b + 20, W.y + 46], [b + 56, W.y + 46], [c - 6, 900], [c + 16, 972], [d - 16, 972], [d, 900]]),
    z: spline(f, [[a, 2.3, 'hit'], [a + 12, 1.5], [b - 4, 1.64], [b + 20, 2.9], [b + 56, 2.9], [c - 6, 1.3], [c + 16, 1.5]]),
  };
  const screen = deviceState(f);
  // the blue wave: one expanding ring from the watch, then a signal that rises toward the sky
  const waveT = inv(DEV.alertAt - 4, DEV.alertAt + 26, f);
  const riseT = inv(d - 18, d, f);
  const overlay = (
    <g>
      {waveT > 0 && waveT < 1 && (
        <g>
          <defs>
            <radialGradient id="s10-ring">
              <stop offset="0.55" stopColor={PAL.signal} stopOpacity={0.12 * (1 - waveT)} />
              <stop offset="0.82" stopColor="#BFF3FF" stopOpacity={0.95 * (1 - waveT)} />
              <stop offset="0.9" stopColor={PAL.signal} stopOpacity={0.8 * (1 - waveT)} />
              <stop offset="1" stopColor={PAL.signal} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={CLOSE.watch.x} cy={CLOSE.watch.y} rx={120 + waveT * 820} ry={(120 + waveT * 820) * 0.82} fill="url(#s10-ring)" />
          <Glow id="s10-wg" c={CLOSE.watch} r={380} color={PAL.signal} alpha={0.85 * (1 - waveT)} />
        </g>
      )}
      {riseT > 0 && riseT < 1 && (
        <g>
          <BeadDefs id="s10-b" />
          <Bead id="s10-b" p={{x: CLOSE.watch.x + 40 * riseT, y: lerp(CLOSE.watch.y - 140, -400, easeIn(riseT))}} r={22} dir={{x: 0.05, y: -1}} wake={6} />
        </g>
      )}
    </g>
  );
  const br = 0.5 + 0.5 * Math.sin(f * 0.55);
  return (
    <WristClose id="s08" cam={cam} screen={screen} expr={pained(f)} blink={blinkAt(f, [612, 700, 790])} hand={mixHand(HAND_LIMP, {...HAND_LIMP, curl: [0.38, 0.44, 0.5, 0.54]}, br)} breath={br} overlay={overlay} />
  );
};

// ---------------------------------------------------------------- S11: map -> drone lift-off
export const S11 = (f: number) => {
  const [a, b] = SHOT.s11;
  const cutLift = a + 46;
  if (f < cutLift) {
    const cam: Cam = {x: lerp(600, 520, inv(a, cutLift, f)), y: lerp(1120, 900, easeInOut(inv(a + 10, cutLift, f))), z: lerp(1.0, 0.86, inv(a, cutLift, f))};
    return <NeighbourhoodMap id="s11" st={{f, cam, pin: easeOut(inv(a, a + 10, f)), packet: inv(a + 12, a + 40, f), lift: easeIn(inv(a + 40, cutLift, f)), spin: f * 0.9}} />;
  }
  // lift-off from a rooftop pad in the same neighbourhood
  const t = inv(cutLift, b, f);
  const rise = easeIn(t);
  // pad sits at screen y ~1060 so the low caption lane falls on the plain wall below it, clear of pad and drone
  const cam: Cam = {x: 560, y: 994 - rise * 60, z: 1.35};
  const dp = {x: 520 + easeIn(clamp((t - 0.45) / 0.55)) * 560, y: 980 - rise * 330, s: 0.95, pitch: 14 * easeIn(clamp((t - 0.35) / 0.65)), spin: f * 1.7, beacon: 0.5 + 0.5 * Math.sin(f * 0.6)};
  return (
    <Street id="s11b" cam={cam}>
      <Lin id="s11-bld" d="M180,1080 h700 v800 h-700 Z" from={{x: 180, y: 1080}} to={{x: 880, y: 1880}} stops={[[0, '#E4E1DA'], [1, '#B4AEA4']]} />
      <Lin id="s11-roof" d="M150,1060 h760 v40 h-760 Z" from={{x: 0, y: 1060}} to={{x: 0, y: 1100}} stops={[[0, '#F2F0EB'], [1, '#C9C4BA']]} />
      <Lin id="s11-lip" d="M150,1100 h760 v26 h-760 Z" from={{x: 0, y: 1100}} to={{x: 0, y: 1126}} stops={[[0, '#A39D92'], [1, '#C4BEB3']]} />
      <Lin id="s11-vent" d="M760,1010 h110 v52 h-110 Z" from={{x: 760, y: 1010}} to={{x: 870, y: 1062}} stops={[[0, '#D9DDE0'], [1, '#97A0A8']]} />
      <rect x={770} y={1022} width={90} height={6} rx={3} fill="#7E8891" opacity={0.6} />
      <rect x={770} y={1036} width={90} height={6} rx={3} fill="#7E8891" opacity={0.6} />
      <ellipse cx={815} cy={1066} rx={70} ry={8} fill="#000" opacity={0.18} />
      <ellipse cx={520} cy={1068} rx={250} ry={30} fill="#2F4256" />
      <ellipse cx={520} cy={1066} rx={218} ry={24} fill={PAL.signal} opacity={0.75} />
      <ellipse cx={520} cy={1066} rx={204} ry={20} fill="#3C5670" />
      <Drone id="s11-dr" p={dp} shadowY={1070} />
    </Street>
  );
};

// ---------------------------------------------------------------- S12: over the same street, to his location
export const S12 = (f: number) => {
  const [a, b] = SHOT.s12;
  const t = inv(a, b - 18, f);
  const arrive = easeOut(t);
  const st = lyingState(f);
  const target = {x: 760, y: 1330};
  const dp = {x: lerp(1700, target.x, arrive), y: lerp(980, target.y, arrive) + Math.sin(f * 0.2) * 6 * arrive, s: 0.72, pitch: lerp(16, 0, easeInOut(inv(a + 30, b - 10, f))), spin: f * 1.7, beacon: 0.5 + 0.5 * Math.sin(f * 0.6)};
  const cam: Cam = {x: lerp(980, 720, easeInOut(t)), y: lerp(1180, 1380, easeInOut(t)), z: lerp(0.62, 0.86, easeInOut(t))};
  // the location link: a dotted glowing path from the drone to a pin over him
  const pin = {x: 700, y: 1560};
  const link = smoothPath([{x: dp.x, y: dp.y + 70}, {x: (dp.x + pin.x) / 2 + 60, y: (dp.y + pin.y) / 2}, pin], 10);
  const show = clamp(inv(fS('location') - 6, fS('location') + 6, f)) * (1 - clamp(inv(b - 14, b - 2, f)));
  return (
    <Street id="s12" cam={{...cam}}>
      <StreetSubject st={{...st, cam}} id="s12m" />
      <Drone id="s12-dr" p={dp} shadowY={GROUND + 10} />
      {show > 0 && (
        <g opacity={show}>
          {link.filter((_, i) => i % 2 === 0).map((p, i) => (
            <circle key={i} cx={fmt(p.x)} cy={fmt(p.y)} r={9} fill={PAL.signal} opacity={0.85} />
          ))}
          <g transform={`translate(${pin.x} ${pin.y}) scale(1.4)`}>
            <path d="M0,0 C-10,-18 -32,-36 -32,-60 C-32,-80 -18,-94 0,-94 C18,-94 32,-80 32,-60 C32,-36 10,-18 0,0 Z" fill={PAL.signal} />
            <circle cx={0} cy={-62} r={12} fill="#0B3550" />
          </g>
        </g>
      )}
    </Street>
  );
};

/** The man, dog and leash without the street (for scenes that build their own world). */
const StreetSubject: React.FC<{st: StreetState; id: string}> = ({st, id}) => {
  const j = manJoints(st.man);
  const lie = clamp(st.man.pelvis / 80);
  return (
    <g>
      {/* ground shadow: long while he lies, gathered under him once he sits up */}
      <SoftShadow id={`${id}-sh`} c={{x: j.H.x - lerp(70, 120, lie), y: GROUND + 6}} rx={lerp(250, 420, lie)} ry={40} alpha={0.32} />
      {/* each foot keeps its own contact shadow (feet nearer the camera sit lower in frame) */}
      {[j.lLeg, j.rLeg].map((L, i) => {
        const fy = Math.max(L.A.y, L.toe.y);
        const gy = Math.max(GROUND, fy) + 6;
        const a = clamp(1 - (gy - 6 - fy) / 120) * 0.36 * (1 - lie);
        return a > 0.01 ? <SoftShadow key={i} id={`${id}-fs${i}`} c={{x: (L.A.x + L.toe.x) / 2 + 10, y: gy}} rx={78} ry={16} alpha={a} /> : null;
      })}
      <Dog id={`${id}-dog`} pose={st.dog} />
      <Man id={`${id}-man`} pose={st.man} expr={st.expr} lHand={st.lHand} rHand={st.rHand} bandColor={st.bandColor} bandGlow={st.bandGlow} nearLegFront={st.nearLegFront} hairSway={st.hairSway} />
      <Leash a={j.R.W} b={collarRing(st.dog)} slack={60} />
    </g>
  );
};

// ---------------------------------------------------------------- S13: the tiny automated injection
export const S13 = (f: number) => {
  const [a, b] = SHOT.s13;
  const port = clamp(inv(DEV.injectAt, DEV.injectAt + 6, f)) * (1 - clamp(inv(DEV.freezeAt, DEV.freezeAt + 20, f)));
  // close on the band's edge (the port pip), then pull back to his hand and breathing
  const pip = add(CLOSE.watch, {x: -150, y: 132});
  const inT = easeInOut(inv(a, a + 20, f));
  const outT = easeInOut(inv(DEV.freezeAt + 4, DEV.freezeAt + 30, f));
  const cam: Cam = {x: lerp(lerp(OPEN_FRAME.x, 600, inT), 620, outT), y: lerp(lerp(OPEN_FRAME.y, 1040, inT), 960, outT), z: lerp(lerp(OPEN_FRAME.z, 1.86, inT), 1.4, outT)};
  // inset: the needle tip releases the fictional treatment into the vessel (stylized)
  const inset = clamp(inv(DEV.injectAt + 2, DEV.injectAt + 10, f)) * (1 - clamp(inv(DEV.freezeAt - 6, DEV.freezeAt + 4, f)));
  const k = inv(DEV.injectAt + 6, DEV.freezeAt, f);
  const relax = easeInOut(inv(DEV.freezeAt, b, f));
  const br = 0.5 + 0.5 * Math.sin(f * lerp(0.55, 0.3, relax));
  const fingers = mixHand(HAND_LIMP, HAND_RELAXED, relax * (0.5 + 0.5 * Math.sin(f * 0.25)));
  const drone = (
    <g>
      <SoftShadow id="s13-ds" c={{x: 880, y: 250}} rx={300} ry={90} alpha={0.28} />
      <Glow id="s13-db" c={{x: 860, y: 140}} r={260} color={PAL.signal} alpha={0.35 * (0.5 + 0.5 * Math.sin(f * 0.6))} />
      <Drone id="s13-dr" p={{x: 860, y: 60, s: 1.1, pitch: 0, spin: f * 1.7, beacon: 0.5 + 0.5 * Math.sin(f * 0.6)}} />
    </g>
  );
  return (
    <g>
      <WristClose id="s13" cam={cam} screen={deviceState(f)} expr={mixExpr(EXPR_WINCE, EXPR_RELIEF, relax * 0.7)} blink={blinkAt(f, [1040, 1090])} hand={fingers} breath={br} port={port} far={drone} />
      {inset > 0.01 && (
        <g opacity={inset} transform={`translate(800 330) scale(${fmt(lerp(0.72, 0.9, easeOut(inset)))})`}>
          <InjectInset id="s13i" k={k} f={f} />
        </g>
      )}
    </g>
  );
};

/** Callout: needle tip in the skin, blue droplets dispersing into the vessel (no drug, no dose). */
const InjectInset: React.FC<{id: string; k: number; f: number}> = ({id, k, f}) => (
  <g>
    <defs>
      <clipPath id={`${id}-c`}>
        <circle cx={0} cy={0} r={230} />
      </clipPath>
      <radialGradient id={`${id}-rim`}>
        <stop offset="0.9" stopColor="#FFFFFF" stopOpacity={0} />
        <stop offset="0.94" stopColor="#FFFFFF" stopOpacity={0.95} />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={0} cy={0} r={246} fill="#0F1C26" opacity={0.35} />
    <g clipPath={`url(#${id}-c)`}>
      <Lin id={`${id}-sk`} d="M-260,-260 h520 v130 h-520 Z" from={{x: 0, y: -260}} to={{x: 0, y: -130}} stops={[[0, '#F6C8A8'], [1, PAL.skinLayer]]} />
      <Lin id={`${id}-ft`} d="M-260,-130 h520 v110 h-520 Z" from={{x: 0, y: -130}} to={{x: 0, y: -20}} stops={[[0, PAL.fat], [1, shade(PAL.fat, 0.2)]]} />
      <Lin id={`${id}-vs`} d="M-260,-20 h520 v170 h-520 Z" from={{x: 0, y: -20}} to={{x: 0, y: 150}} stops={[[0, PAL.vessel], [0.5, PAL.blood], [1, shade(PAL.blood, 0.3)]]} />
      <Lin id={`${id}-ts`} d="M-260,150 h520 v120 h-520 Z" from={{x: 0, y: 150}} to={{x: 0, y: 270}} stops={[[0, PAL.tissue], [1, shade(PAL.tissue, 0.3)]]} />
      <Lin id={`${id}-nd`} d="M-12,-262 L12,-262 L2,-60 L-2,-60 Z" from={{x: -12, y: 0}} to={{x: 12, y: 0}} stops={[[0, '#F4F7FA'], [0.5, '#B8C2CC'], [1, '#7D8894']]} />
      {Array.from({length: 24}).map((_, i) => {
        const t = clamp(k * 1.6 - i * 0.03);
        if (t <= 0) return null;
        const ang0 = (i / 24) * Math.PI * 2;
        const r = 30 + t * 170;
        return <circle key={i} cx={fmt(Math.cos(ang0) * r * 1.3)} cy={fmt(60 + Math.sin(ang0) * r * 0.42 + noise1(f * 0.2, i) * 6)} r={fmt(9 - t * 4)} fill="#7FE3FF" opacity={0.9 * (1 - t * 0.6)} />;
      })}
      <Glow id={`${id}-g`} c={{x: 0, y: 40}} r={200 * k + 20} color={PAL.signal} alpha={0.5} />
    </g>
    <circle cx={0} cy={0} r={238} fill={`url(#${id}-rim)`} />
  </g>
);

// ---------------------------------------------------------------- S14: recovery, wide
// He pushes up on both hands, swings his legs round toward the camera and sits up on the grass: near knee raised
// (drawn in front of the torso), far leg bent along the ground, right hand planted behind him, the band on his left
// forearm resting across the knee, head lowered toward it (the close-up that follows looks at the same band).
const SIT: Partial<ManPose> = {
  x: 760, y: 1700, torso: -2, chest: 16, neck: 16, turn: 0.42, pelvis: -4,
  lHip: 146, lKnee: 134, lAnk: -34, lFs: 0.95, lFsh: 1.0,
  rHip: 112, rKnee: 92, rAnk: -20, rFs: 0.78, rFsh: 0.7,
  rW: 1, rWx: 930, rWy: GROUND - 6, rElb: 1, rWr: -60,
  lW: 1, lWx: 560, lWy: 1560, lElb: 1, lWr: 4,
};
export const recoveryState = (f: number): StreetState => {
  const [a, b] = SHOT.s14;
  const base = LIE.man;
  const keys: SKey<ManPose>[] = [
    [a, {...base, rWx: 560, rWy: GROUND + 4}, 'stop'],
    // up on both hands, hips still on the grass, legs starting to come round
    [a + 18, {...base, x: 790, y: 1676, torso: 52, chest: 10, neck: -4, pelvis: 66, lHip: 40, lKnee: 70, lFs: 0.8, rHip: 30, rKnee: 64, rFs: 0.8,
      rW: 1, rWx: 560, rWy: GROUND + 4, rElb: -1, lW: 1, lWx: 470, lWy: GROUND + 30, lElb: 1}],
    // legs pointing toward the camera (short), torso coming upright over the hips
    // legs pass under him pointing at the camera: shortest here
    [a + 24, {...base, x: 782, y: 1694, torso: 34, chest: 11, neck: 2, pelvis: 40, lHip: 62, lKnee: 70, lAnk: -10, lFs: 0.3, lFsh: 0.36, rHip: 54, rKnee: 66, rAnk: -8, rFs: 0.3, rFsh: 0.34,
      rW: 1, rWx: 740, rWy: GROUND - 2, rElb: 1, rWr: -30, lW: 1, lWx: 520, lWy: GROUND - 40, lElb: 1, lWr: 10}],
    [a + 30, {...base, x: 772, y: 1704, torso: 16, chest: 12, neck: 6, pelvis: 14, lHip: 100, lKnee: 104, lAnk: -24, lFs: 0.4, lFsh: 0.34, rHip: 84, rKnee: 88, rAnk: -16, rFs: 0.36, rFsh: 0.32,
      rW: 1, rWx: 900, rWy: GROUND - 4, rElb: 1, rWr: -40, lW: 1, lWx: 560, lWy: 1640, lElb: 1, lWr: 10}],
    [a + 46, {...base, ...SIT}],
    [b, {...base, ...SIT, neck: 20, lWy: 1556}],
  ];
  const body = (t: number): ManPose => {
    const m = splineRec(t, keys);
    const heave = 0.5 + 0.5 * Math.sin(t * 0.42);
    return {...m, breath: heave, chest: m.chest + heave * 1.6, neck: m.neck + noise1(t * 0.2, 4) * 2};
  };
  const ft = followThrough(body, f);
  const man = {...body(f), neck: body(f).neck + ft.headLag};
  const expr = mixExpr(mixExpr(EXPR_WINCE, EXPR_GASP, inv(a, a + 30, f)), EXPR_RELIEF, inv(a + 34, b - 10, f));
  const dogT = easeInOut(inv(a + 10, a + 56, f));
  const dog: DogPose = {...DOG_IDLE, x: lerp(1070, 1160, dogT), y: GROUND - 10, s: 1.4, facing: -1, head: lerp(28, 12, dogT), ears: spring((t) => lerp(0.9, 0.5, easeInOut(inv(a + 10, a + 56, t))), f, 0.1, 0.25), tail: spring((t) => lerp(-6, 22 + 12 * Math.sin(t * 0.8), easeInOut(inv(a + 10, a + 56, t))), f, 0.12, 0.3), sit: easeInOut(inv(a + 50, a + 66, f)), step: f * 0.55, stepAmt: Math.sin(Math.PI * inv(a + 10, a + 56, f)), worry: lerp(1, 0.6, dogT), lean: 0};
  const cam: Cam = {x: lerp(560, 760, easeInOut(inv(a, b, f))), y: lerp(1560, 1440, easeInOut(inv(a, b, f))), z: lerp(1.3, 0.96, easeInOut(inv(a, b, f)))};
  const green = clamp(inv(DEV.recoverAt, DEV.recoverAt + 12, f));
  return {man, expr, lHand: mixHand(HAND_LIMP, HAND_RELAXED, inv(a, a + 40, f)), rHand: mixHand(HAND_CLUTCH, HAND_BRACE, inv(a + 4, a + 20, f)), dog, cam, bandColor: mix(PAL.alert, PAL.normal, green), bandGlow: 0.8, nearLegFront: f >= a + 26, hairSway: ft.hairSway};
};

export const S14 = (f: number) => {
  const st = recoveryState(f);
  const dp = {x: 1040, y: 1090 + Math.sin(f * 0.15) * 8, s: 0.62, pitch: 0, spin: f * 1.7, beacon: 0.5 + 0.5 * Math.sin(f * 0.6)};
  return (
    <Street id="s14" cam={st.cam} fg={undefined}>
      <StreetSubject st={st} id="s14m" />
      <Drone id="s14-dr" p={dp} shadowY={GROUND + 30} />
    </Street>
  );
};

// ---------------------------------------------------------------- S15-S16: 42 years, the question, the glitch

export const S15_16 = (f: number) => {
  const [a] = SHOT.s15;
  const rack = easeInOut(inv(fS('would you want') - 12, fS('would you want') + 2, f)) * (1 - easeInOut(inv(DEV.glitchAt - 5, DEV.glitchAt, f)));
  const cam: Cam = {x: lerp(660, OPEN_FRAME.x, inv(a, DEV.glitchAt, f)), y: lerp(950, OPEN_FRAME.y, inv(a, DEV.glitchAt, f)) - rack * 40, z: lerp(1.68, OPEN_FRAME.z, easeInOut(inv(a, DEV.glitchAt, f)))};
  const br = 0.5 + 0.5 * Math.sin(f * 0.3);
  return (
    <WristClose
      id="s15"
      bg="sitting"
      cam={cam}
      screen={deviceState(f)}
      expr={mixExpr(EXPR_RELIEF, EXPR_UNEASY, inv(a + 10, fS('would you want'), f))}
      blink={blinkAt(f, [1228, 1320])}
      hand={HAND_RELAXED}
      breath={br * 0.5}
      farBlur={lerp(7, 1.2, rack)}
      armBlur={lerp(0, 4.5, rack)}
    />
  );
};

export {EXPR_PAIN, HAND_BRACE, GROUND as GROUND_Y, fE, track, Layer};
