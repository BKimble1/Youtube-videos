// MouthPad V2: the shot table and every shot. Cuts are on action or on a matching shape (the tongue's tap ring
// becomes the game's hit ring; the pad's click flash becomes the shot; the closing lips cut to the calm face on the
// same line; the winning splat bursts out of the screen into the loser's face). The last frame is the first frame.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {RoomScene, SCREEN, gMouth, gHead, hHead, H, G, Cam, handWorldG} from '../art/room';
import {padInHead} from '../art/mouth';
import {reach} from '../crew';
import {camAt, CamKey} from '../camera';
import {game2, FIRE2, LOOP_SWAP, headAim} from './play2';
import {guesser2, honest2} from './cast2';
import {DeviceFlow, C2_START, ECU2} from './device2';
import {SectionScene, palate} from './section2';
import {AssistShot, ASSIST_START, ASSIST_END} from './assist2';
import {GameVertical, Reticle, DustyPad, MagnifierProp, MAG_LENS, MashCU, PaintBurst} from './fx';
import {Jaw, padPoint, projector} from '../art/jaw3d';
import {GameScreen} from '../art/game';
import {T} from '../story';
import {FPS, clamp, keys, lerp, ss, ss5, eo, pulse, blip} from '../lib';

const INK = '#162A32';
export const MON: Cam = {x: SCREEN.x + SCREEN.w / 2, y: SCREEN.y + SCREEN.h / 2, z: 1.7};
const MED: Cam = {x: 560, y: 770, z: 1.18};
const ECU_A: Cam = {x: gMouth.x, y: gMouth.y + 6, z: 12.5};

export const CUTS = {
  A4: T.can + 0.3, A5: T.with1, B2: T.watch - 0.07, B3: T.this2 + 0.44, C1: T.its + 0.16, C2: C2_START, D1: T.mouth2 + 0.17,
  E1: T.moves + 0.03, F1: T.aim + 0.62, F2: T.click + 0.03, G: ASSIST_START, H1: ASSIST_END, H3: T.mouth3 + 0.04, H4b: T.see + 0.2,
  I1: T.controller + 0.5, I2: T.losing, I3: T.game, I4: T.whos, I5: T.just, I5b: T.sitting2 + 0.2, I6a: T.there + 0.2, I6b: T.mouth4, I6c: T.shut,
  I6d: T.shut + 0.54, I6e: T.shut + 1.17,
};

// ---------------------------------------------------------------- A: hook (0 → the tap)
const A_CAM: CamKey[] = [
  {t: 0, c: MON}, {t: 0.3, c: {...MON, z: 1.76}},
  {t: 0.62, c: MED, ease: (t, a, b) => ss(t, a, b)},
  {t: 1.2, c: ECU_A, ease: (t, a, b) => ss(t, a, b)},
  {t: CUTS.A4, c: {...ECU_A, z: 13.4}},
];
const ShotA: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const cam = camAt(t, A_CAM);
  const g = guesser2(t);
  const gm = game2(t);
  // the reticle: leaves the screen on "THIS", flies to the mouth, shrinks onto the gold pad
  const t0 = T.this, t1 = T.this + 0.42, t2 = T.mouth1 - 0.02;
  const g0 = game2(t0);
  const start = {x: SCREEN.x + g0.cross.x, y: SCREEN.y + g0.cross.y};
  const pad = padInHead(g.m, 0.15, 0.25);
  const padW = {x: G.x + pad.x * G.scale, y: G.ground + pad.y * G.scale};
  const u = ss5(t, t0, t1), v = ss5(t, t1, t2);
  const arc = Math.sin(u * Math.PI) * -140;
  const p = {x: lerp(lerp(start.x, gMouth.x, u), padW.x, v), y: lerp(lerp(start.y, gMouth.y, u) + arc, padW.y, v)};
  const rScreen = lerp(lerp(26, 70, u), 38, v);
  const o = (t >= t0 ? 1 : 0) * (1 - ss(t, t2 + 0.05, t2 + 0.25));
  const lock = ss(t, t2 - 0.08, t2 + 0.04);
  // the tap: a ring grows from the contact point on the pad (it becomes the game's hit ring in the next shot)
  const tap = T.can + 0.02;
  const tapPad = padInHead(g.m, g.m.u ?? 0, g.m.v ?? 0);
  const tapW = {x: G.x + tapPad.x * G.scale, y: G.ground + tapPad.y * G.scale};
  const ringT = t - tap;
  return (
    <g>
      <RoomScene t={t} frame={frame} cam={cam} g={g} h={honest2(t)} game={gm} id="a" alwaysMouth
        front={o > 0.001 ? <Reticle x={p.x} y={p.y} r={rScreen / cam.z} lock={lock} spin={u * 90} o={o} /> : undefined} />
      {ringT > 0 && (
        <circle cx={540 + cam.z * (tapW.x - cam.x)} cy={960 + cam.z * (tapW.y - cam.y)} r={20 + ringT * 1500} fill="none" stroke="#FFFFFF" strokeWidth={14 + ringT * 30} opacity={0.9} />
      )}
    </g>
  );
};

// ---------------------------------------------------------------- A4, B2, I3, I6a, I6c: the game's own camera
const TapRingCarry: React.FC<{t: number}> = ({t}) => {
  // the ring from the tap continues, centred on the crosshair, and fades as the shot leaves the blaster
  const r = t - (T.can + 0.02);
  if (r > 0.55) return null;
  return <circle cx={540} cy={870} r={20 + r * 1500} fill="none" stroke="#FFFFFF" strokeWidth={14 + r * 30} opacity={0.9 * (1 - clamp((r - 0.3) / 0.25))} />;
};
const ShotGame: React.FC<{t: number; zoom: number; hy?: number; id: string; extra?: React.ReactNode}> = ({t, zoom, hy = 760, id, extra}) => (
  <g>
    <GameVertical g={game2(t)} id={id} zoom={zoom} hy={hy} />
    {extra}
  </g>
);

// ---------------------------------------------------------------- A5 + B1: low angle past the cobwebbed gamepad
const LOW_CAM: CamKey[] = [
  {t: CUTS.A5, c: {x: 650, y: 905, z: 1.42}}, {t: T.seriously - 0.1, c: {x: 630, y: 905, z: 1.45}},
  {t: T.seriously + 0.35, c: {x: 520, y: 935, z: 1.5}}, {t: CUTS.B2, c: {x: 515, y: 935, z: 1.52}},
];
const ShotLow: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const cam = camAt(t, LOW_CAM);
  const par = (cam.x - 650) * 0.5;
  return (
    <g>
      <RoomScene t={t} frame={frame} cam={cam} g={guesser2(t)} h={honest2(t)} game={game2(t)} id="lo" alwaysMouth />
      <DustyPad t={t} x={720 - par} y={1650} s={1.5} />
    </g>
  );
};

// ---------------------------------------------------------------- B3: Honest's jaw drops
const ShotHonestCU: React.FC<{t: number; frame: number; z: number; dy?: number; id: string}> = ({t, frame, z, dy = 30, id}) => {
  const h = honest2(t)!;
  const hp = hHead(h.x);
  const cam = {x: hp.x + 40, y: hp.y - (h.rise ?? 0) + dy, z};
  return <RoomScene t={t} frame={frame} cam={cam} g={guesser2(t)} h={h} game={game2(t)} id={id} alwaysMouth />;
};

// ---------------------------------------------------------------- C1: in to the mouth for the lift
const C1_CAM: CamKey[] = [{t: CUTS.C1, c: {x: gHead.x, y: gHead.y + 30, z: 3.2}}, {t: CUTS.C2, c: ECU2, ease: (t, a, b) => ss(t, a, b)}];
const ShotC1: React.FC<{t: number; frame: number}> = ({t, frame}) => (
  <RoomScene t={t} frame={frame} cam={camAt(t, C1_CAM)} g={guesser2(t)} h={honest2(t)} game={game2(t)} id="c1" alwaysMouth />
);

// ---------------------------------------------------------------- D1: move your tongue (cause on top, effect below)
const ShotSplit: React.FC<{t: number}> = ({t}) => {
  const g = game2(t);
  const inA = eo(t, CUTS.D1, CUTS.D1 + 0.28);
  const u = keys(t, [[CUTS.D1, 0], [T.move + 0.12, 0], [T.tongue2 + 0.25, -0.75], [T.character - 0.12, -0.75], [T.character - 0.02, -0.15], [T.moves - 0.02, -0.15], [T.moves + 0.34, 0.7]]);
  const v = keys(t, [[T.character - 0.08, -0.45], [T.moves - 0.04, 0.75], [T.moves + 0.3, 0.4]]);
  // the tongue's trail on the pad, sampled behind the contact
  const trail = Array.from({length: 10}, (_, i) => {
    const tt = t - i * 0.035;
    return {u: keys(tt, [[CUTS.D1, 0], [T.move + 0.12, 0], [T.tongue2 + 0.25, -0.75], [T.character - 0.12, -0.75], [T.character - 0.02, -0.15], [T.moves - 0.02, -0.15], [T.moves + 0.34, 0.7]]), v: keys(tt, [[T.character - 0.08, -0.45], [T.moves - 0.04, 0.75], [T.moves + 0.3, 0.4]])};
  });
  const view = {yaw: 0, pitch: -90, persp: 600};
  const pr = projector(view);
  const px = 11.5;
  const jy = lerp(-600, 540, inA), gy = lerp(2500, 1060, inA);
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#1B1D33" />
      {/* cause: the roof of the mouth from below, the see-through tongue sliding on the pad */}
      <g transform={`translate(0 ${jy})`}>
        <rect x={50} y={-410} width={980} height={790} rx={48} fill="#4A1622" stroke={INK} strokeWidth={6} />
        <g transform={`translate(540 -10) scale(${px})`}>
          <Jaw view={view} px={px} id="d1-jaw" contact={{u, v, glow: 1, r: 3.4}} tongueX={1} />
          {trail.map((q, i) => {
            const p = pr(padPoint(q.u, q.v, 0.5));
            return <circle key={i} cx={p.x} cy={p.y} r={1.6 * (1 - i / 10)} fill="#FFF6C8" opacity={0.6 * (1 - i / 10)} />;
          })}
        </g>
      </g>
      {/* effect: the game, its keys lighting as the tongue moves */}
      <g transform={`translate(0 ${gy})`}>
        <defs><clipPath id="d1-gclip"><rect x={50} y={-110} width={980} height={700} rx={48} /></clipPath></defs>
        <g clipPath="url(#d1-gclip)">
          <g transform="translate(60 -110) scale(1.5)"><GameScreen g={g} id="d1-gm" ext={{t: 0, b: 70, l: 10, r: 10}} hud /></g>
        </g>
        <rect x={50} y={-110} width={980} height={700} rx={48} fill="none" stroke={INK} strokeWidth={6} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- E1: tilt your head, you aim (facecam over the game)
const ShotFacecam: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const k = ss5(t, CUTS.E1 + 0.22, CUTS.E1 + 0.48); // the face shrinks into the corner, the game appears behind
  const box = {x: lerp(0, 46, k), y: lerp(0, 150, k), w: lerp(1080, 420, k), h: lerp(1920, 520, k)};
  const cam = {x: gHead.x, y: gHead.y + 40, z: lerp(2.6, 2.6, k)};
  const sx = box.w / 1080, sy = box.h / 1920, sc = Math.max(sx, sy);
  const aim = headAim(t);
  return (
    <g>
      <GameVertical g={game2(t)} id="e1-gm" zoom={2.5} hy={760} cx={540 - 60 * aim} />
      <defs><clipPath id="e1-box"><rect x={box.x} y={box.y} width={box.w} height={box.h} rx={lerp(0, 34, k)} /></clipPath></defs>
      <g clipPath="url(#e1-box)">
        <g transform={`translate(${box.x + box.w / 2} ${box.y + box.h / 2}) scale(${sc}) translate(-540 -960)`}>
          <RoomScene t={t} frame={frame} cam={cam} g={guesser2(t)} h={null} game={game2(t)} id="e1" alwaysMouth />
        </g>
      </g>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={lerp(0, 34, k)} fill="none" stroke="#FFFFFF" strokeWidth={lerp(0, 10, k)} />
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={lerp(0, 34, k)} fill="none" stroke={INK} strokeWidth={lerp(0, 4, k)} />
    </g>
  );
};

// ---------------------------------------------------------------- F1: press your tongue up (contact = click)
const ShotPress: React.FC<{t: number}> = ({t}) => {
  const cz = 1.2;
  const px = lerp(17, 19.5, ss(t, CUTS.F1, CUTS.F2));
  const contactY = palate(cz) + 0.5;
  const fx = cz, fy = contactY + 30 / px;
  const tl = keys(t, [[T.tongue3 - 0.05, 0], [T.up + 0.05, 0.82], [T.you4 + 0.15, 0.86], [T.click - 0.02, 1]]);
  const press = pulse(t, T.click - 0.03, T.click, T.click + 0.12, T.click + 0.25);
  return <SectionScene cx={540 - fx * px} cy={900 - fy * px} px={px} lift={tl} cz={cz} press={press} glow={ss(t, T.click - 0.04, T.click)} ring={t - T.click} reveal={1} near={0} />;
};
const ClickFlashCarry: React.FC<{t: number}> = ({t}) => {
  const r = t - T.click;
  if (r > 0.4) return null;
  return <circle cx={540} cy={870} r={20 + r * 1300} fill="none" stroke="#FFFFFF" strokeWidth={18 + r * 30} opacity={0.95 * (1 - clamp((r - 0.15) / 0.25))} />;
};

// ---------------------------------------------------------------- H: the twist
const H_CAM: CamKey[] = [
  {t: CUTS.H1, c: {x: gMouth.x, y: gMouth.y - 6, z: 6.8}}, {t: T.close - 0.05, c: {x: gMouth.x, y: gMouth.y - 2, z: 8.6}},
  {t: CUTS.H3, c: {x: gMouth.x, y: gMouth.y, z: 9.2}},
  // match cut on the mouth line: same screen position, the calm medium shot
  {t: CUTS.H3, c: {x: gMouth.x, y: gMouth.y, z: 1.5}, cut: true}, {t: T.even - 0.2, c: {x: gMouth.x - 10, y: gMouth.y, z: 1.56}},
  // ...and the screen is STILL responding
  {t: T.even + 0.05, c: {x: 430, y: 660, z: 1.45}, ease: (t, a, b) => ss(t, a, b)}, {t: CUTS.H4b, c: {x: 420, y: 655, z: 1.5}},
  {t: CUTS.H4b, c: {x: 690, y: 820, z: 1.9}, cut: true}, {t: CUTS.I1, c: {x: 700, y: 820, z: 1.98}},
];
const ShotTwist: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const cam = camAt(t, H_CAM);
  const h = honest2(t);
  const g = guesser2(t);
  const isMag = t >= CUTS.H4b && h;
  let lens: React.ReactNode = null;
  if (isMag && h) {
    // the lens magnifies what is under it: the guesser's closed mouth (nothing to see)
    const ch = {x: h.x, y: H.ground, scale: H.scale};
    const hw = handWorldG(ch, h.pose.armR, 1);
    const ang = ((h.pose.armR.a + h.pose.armR.b) * Math.PI) / 180;
    const lc = {x: hw.x + Math.sin(ang) * MAG_LENS.off * H.scale * 0 + 0, y: hw.y - MAG_LENS.off * H.scale};
    const sx = 540 + cam.z * (lc.x - cam.x), sy = 960 + cam.z * (lc.y - cam.y), rr = MAG_LENS.r * H.scale * cam.z;
    lens = (
      <g>
        <defs><clipPath id="h-lens"><circle cx={sx} cy={sy} r={rr} /></clipPath></defs>
        <g clipPath="url(#h-lens)">
          <rect x={sx - rr} y={sy - rr} width={rr * 2} height={rr * 2} fill="#F2C9A8" />
          <g transform={`translate(${sx} ${sy}) scale(1.9) translate(${-sx} ${-sy})`}>
            <RoomScene t={t} frame={frame} cam={cam} g={g} h={null} game={game2(t)} id="h-mag" alwaysMouth />
          </g>
          <circle cx={sx - rr * 0.35} cy={sy - rr * 0.35} r={rr * 0.25} fill="#FFFFFF" opacity={0.35} />
        </g>
      </g>
    );
  }
  return (
    <g>
      <RoomScene t={t} frame={frame} cam={cam} g={g} h={h} game={game2(t)} id="h" alwaysMouth />
      {lens}
    </g>
  );
};

// ---------------------------------------------------------------- I: the versus round
const ShotWide: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const cam = {x: lerp(470, 480, ss(t, CUTS.I1, CUTS.I2)), y: 860, z: lerp(1.08, 1.12, ss(t, CUTS.I1, CUTS.I2))};
  return <RoomScene t={t} frame={frame} cam={cam} g={guesser2(t)} h={honest2(t)} game={game2(t)} id="i1" alwaysMouth />;
};
const ShotGuesserCU: React.FC<{t: number; frame: number; cam: Cam; id: string}> = ({t, frame, cam, id}) => (
  <RoomScene t={t} frame={frame} cam={cam} g={guesser2(t)} h={honest2(t)} game={game2(t)} id={id} alwaysMouth />
);
const END_CAM: CamKey[] = [
  {t: CUTS.I6e, c: {x: gHead.x + 10, y: gHead.y + 45, z: 3.0}}, {t: 31.42, c: {x: gHead.x + 5, y: gHead.y + 40, z: 3.12}},
  {t: 31.9, c: MON, ease: (t, a, b) => ss5(t, a, b)},
];

export const SHOTS2: {name: string; a: number; b: number}[] = [
  {name: 'A hook: game, pull-out, reticle to the mouth, the tap', a: 0, b: CUTS.A4},
  {name: 'A4 game: the tap becomes the shot', a: CUTS.A4, b: CUTS.A5},
  {name: 'A5/B1 low angle: cobwebbed gamepad, Honest leans in', a: CUTS.A5, b: CUTS.B2},
  {name: 'B2 game: weave and double', a: CUTS.B2, b: CUTS.B3},
  {name: 'B3 Honest jaw drop', a: CUTS.B3, b: CUTS.C1},
  {name: 'C1 into the mouth', a: CUTS.C1, b: CUTS.C2},
  {name: 'C2-C5 device: lift out, turn, sensor, fly into the cut-away', a: CUTS.C2, b: CUTS.D1},
  {name: 'D1 split: tongue moves → character moves', a: CUTS.D1, b: CUTS.E1},
  {name: 'E1 facecam: head tilt → aim', a: CUTS.E1, b: CUTS.F1},
  {name: 'F1 cut-away: the press', a: CUTS.F1, b: CUTS.F2},
  {name: 'F2 game: the click fires', a: CUTS.F2, b: CUTS.G},
  {name: 'G montage: computer and phone, hands-free', a: CUTS.G, b: CUTS.H1},
  {name: 'H twist: device in the mouth, lips close, calm face, game still answering, magnifier', a: CUTS.H1, b: CUTS.I1},
  {name: 'I1 wide: the versus round begins', a: CUTS.I1, b: CUTS.I2},
  {name: 'I2 mashing thumbs', a: CUTS.I2, b: CUTS.I3},
  {name: 'I3 game: barrage, tiny side-steps', a: CUTS.I3, b: CUTS.I4},
  {name: 'I4 guesser checks his nails', a: CUTS.I4, b: CUTS.I5},
  {name: 'I5 Honest stands, straining', a: CUTS.I5, b: CUTS.I5b},
  {name: 'I5b guesser blinks', a: CUTS.I5b, b: CUTS.I6a},
  {name: 'I6a game: lock on Rex', a: CUTS.I6a, b: CUTS.I6b},
  {name: 'I6b mouth shut, smiling', a: CUTS.I6b, b: CUTS.I6c},
  {name: 'I6c game: K.O. on SHUT, paint bursts out', a: CUTS.I6c, b: CUTS.I6d},
  {name: 'I6d paint slides away: Honest frozen', a: CUTS.I6d, b: CUTS.I6e},
  {name: 'I6e/I7 winner, then back into the screen (loop)', a: CUTS.I6e, b: 99},
];

export const Frame2: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const s = SHOTS2.find((q) => t >= q.a && t < q.b) ?? SHOTS2[SHOTS2.length - 1];
  const n = s.name.split(' ')[0];
  switch (n) {
    case 'A': return <ShotA t={t} frame={frame} />;
    case 'A4': return <ShotGame t={t} zoom={2.6} id="a4" extra={<TapRingCarry t={t} />} />;
    case 'A5/B1': return <ShotLow t={t} frame={frame} />;
    case 'B2': return <ShotGame t={t} zoom={lerp(2.3, 2.5, ss(t, CUTS.B2, CUTS.B3))} id="b2" />;
    case 'B3': return <ShotHonestCU t={t} frame={frame} z={lerp(2.9, 3.1, ss(t, CUTS.B3, CUTS.C1))} id="b3" />;
    case 'C1': return <ShotC1 t={t} frame={frame} />;
    case 'C2-C5': return <DeviceFlow t={t} frame={frame} />;
    case 'D1': return <ShotSplit t={t} />;
    case 'E1': return <ShotFacecam t={t} frame={frame} />;
    case 'F1': return <ShotPress t={t} />;
    case 'F2': return <ShotGame t={t} zoom={lerp(2.6, 2.8, ss(t, CUTS.F2, CUTS.G))} id="f2" extra={<ClickFlashCarry t={t} />} />;
    case 'G': return <AssistShot t={t} frame={frame} />;
    case 'H': return <ShotTwist t={t} frame={frame} />;
    case 'I1': return <ShotWide t={t} frame={frame} />;
    case 'I2': return <MashCU t={t} intensity={1} />;
    case 'I3': return <ShotGame t={t} zoom={2.3} id="i3" />;
    case 'I4': return <ShotGuesserCU t={t} frame={frame} cam={{x: gHead.x - 10, y: gHead.y + 150, z: lerp(2.15, 2.25, ss(t, CUTS.I4, CUTS.I5))}} id="i4" />;
    case 'I5': return <ShotHonestCU t={t} frame={frame} z={1.75} dy={150} id="i5" />;
    case 'I5b': return <ShotGuesserCU t={t} frame={frame} cam={{x: gHead.x, y: gHead.y + 40, z: lerp(2.8, 2.9, ss(t, CUTS.I5b, CUTS.I6a))}} id="i5b" />;
    case 'I6a': return <ShotGame t={t} zoom={lerp(2.5, 2.75, ss(t, CUTS.I6a, CUTS.I6b))} id="i6a" />;
    case 'I6b': return <ShotGuesserCU t={t} frame={frame} cam={{x: gMouth.x, y: gMouth.y - 25, z: lerp(4.6, 5.0, ss(t, CUTS.I6b, CUTS.I6c))}} id="i6b" />;
    case 'I6c': return <ShotGame t={t} zoom={2.8} id="i6c" extra={<PaintBurst t={t} t0={FIRE2.ko + 0.1} full={CUTS.I6d - 0.03} off={CUTS.I6d + 0.4} />} />;
    case 'I6d': return (
      <g>
        <ShotHonestCU t={t} frame={frame} z={2.3} dy={60} id="i6d" />
        <PaintBurst t={t} t0={FIRE2.ko + 0.1} full={CUTS.I6d - 0.03} off={CUTS.I6d + 0.4} />
      </g>
    );
    default: return <RoomScene t={t} frame={frame} cam={camAt(t, END_CAM)} g={guesser2(t)} h={honest2(t)} game={game2(t)} id="end" alwaysMouth />;
  }
};

export const Film2: React.FC<{audio?: string | false}> = ({audio}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: '#1B1D33'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Frame2 t={t} frame={frame} />
      </svg>
      {audio ? <Audio src={staticFile(`audio/${audio}.wav`)} /> : null}
    </AbsoluteFill>
  );
};
void blip; void reach; void LOOP_SWAP;
