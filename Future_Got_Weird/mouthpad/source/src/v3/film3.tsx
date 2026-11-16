// MouthPad V2: the shot table and every shot. Cuts are on action or on a matching shape (the tongue's tap ring
// becomes the game's hit ring; the pad's click flash becomes the shot; the closing lips cut to the calm face on the
// same line; the winning splat bursts out of the screen into the loser's face). The last frame is the first frame.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {RoomScene, SCREEN, gMouth, gHead, hHead, H, G, Cam, handWorldG} from '../art/room';
import {padInHead} from '../art/mouth';
import {reach} from '../crew';
import {camAt, CamKey} from '../camera';
import {game2, FIRE2, LOOP_SWAP, headAim} from './play3';
import {guesser3, honest3, LOOP_CUT} from './cast3';
import {DeviceFlow, C2_START, ECU2} from './device3';
import {SectionScene, palate} from './section3';
import {AssistShot, ASSIST_START, ASSIST_END} from './assist3';
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
  A4: T.can + 0.08, A5: T.with1, B2: T.watch - 0.07, B3: T.this2 + 0.44, C1: T.its + 0.26, C2: C2_START, D1: T.mouth2 + 0.17,
  E1: T.moves + 0.03, F1: T.aim + 0.62, F2: T.click + 0.03, G: ASSIST_START, H1: ASSIST_END, H3: T.mouth3 + 0.16, H4: T.nobody + 0.5, H5: T.see + 0.22,
  I1: T.controller + 0.0, I2: T.losing, I3: T.video2, I4: T.game + 0.0, I5: T.someone - 0.05, I6: T.whos, I7: T.literally, I8: T.literally + 0.3, C: T.just,
  D: T.there + 0.15, E: T.mouth4, L: LOOP_CUT,
};

// ---------------------------------------------------------------- A: hook (0 → the tap)
const A_CAM: CamKey[] = [
  {t: 0, c: MON}, {t: 0.3, c: {...MON, z: 1.76}},
  {t: 0.62, c: MED, ease: (t, a, b) => ss(t, a, b)},
  {t: 1.2, c: ECU_A, ease: (t, a, b) => ss(t, a, b)},
  {t: CUTS.A4, c: {...ECU_A, z: 13.2}},
];
const ShotA: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const cam = camAt(t, A_CAM);
  const g = guesser3(t);
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
      <RoomScene t={t} frame={frame} cam={cam} g={g} h={honest3(t)} game={gm} id="a" alwaysMouth
        front={o > 0.001 ? <Reticle x={p.x} y={p.y} r={rScreen / cam.z} lock={lock} spin={u * 90} o={o} /> : undefined} />
      {ringT > 0 && ringT < 0.12 && (
        <g transform={`translate(${540 + cam.z * (tapW.x - cam.x)} ${960 + cam.z * (tapW.y - cam.y)})`} opacity={1 - ringT / 0.12}>
          {[0, 1, 2, 3, 4, 5].map((k) => <line key={k} x1={0} y1={0} x2={Math.cos(k * 1.047) * (30 + 260 * ringT)} y2={Math.sin(k * 1.047) * (30 + 260 * ringT)} stroke="#FFF6C8" strokeWidth={8} strokeLinecap="round" />)}
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- A4, B2, I3, I6a, I6c: the game's own camera
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
      <RoomScene t={t} frame={frame} cam={cam} g={guesser3(t)} h={honest3(t)} game={game2(t)} id="lo" alwaysMouth />
      <DustyPad t={t} x={720 - par} y={1650} s={1.5} />
    </g>
  );
};

// ---------------------------------------------------------------- B3: Honest's jaw drops
const ShotHonestCU: React.FC<{t: number; frame: number; z: number; dy?: number; id: string}> = ({t, frame, z, dy = 30, id}) => {
  const h = honest3(t)!;
  const hp = hHead(h.x);
  const cam = {x: hp.x + 40, y: hp.y - (h.rise ?? 0) + dy, z};
  return <RoomScene t={t} frame={frame} cam={cam} g={guesser3(t)} h={h} game={game2(t)} id={id} alwaysMouth />;
};

// ---------------------------------------------------------------- C1: in to the mouth for the lift
const C1_CAM: CamKey[] = [{t: CUTS.C1, c: {x: gMouth.x, y: gMouth.y - 10, z: 5.2}}, {t: CUTS.C2, c: ECU2, ease: (t, a, b) => ss(t, a, b)}];
const ShotC1: React.FC<{t: number; frame: number}> = ({t, frame}) => (
  <RoomScene t={t} frame={frame} cam={camAt(t, C1_CAM)} g={guesser3(t)} h={honest3(t)} game={game2(t)} id="c1" alwaysMouth />
);

// ---------------------------------------------------------------- D1: move your tongue (cause on top, effect below)
const ShotSplit: React.FC<{t: number}> = ({t}) => {
  const g = game2(t);
  const inA = eo(t, CUTS.D1, CUTS.D1 + 0.28);
  const UK: [number, number][] = [[CUTS.D1, 0], [T.move + 0.1, 0], [T.tongue2 + 0.25, -0.8], [T.character - 0.12, -0.8], [T.moves + 0.2, 0.8]];
  const u = keys(t, UK);
  const v = 0.05 * Math.sin(t * 3);
  // the tongue's trail on the pad, sampled behind the contact
  const trail = Array.from({length: 10}, (_, i) => {
    const tt = t - i * 0.035;
    return {u: keys(tt, UK), v: 0.05 * Math.sin(tt * 3)};
  });
  const view = {yaw: 0, pitch: -90, persp: 600};
  const pr = projector(view);
  const px = 11.5;
  const jy = lerp(140, 540, inA), gy = lerp(1500, 1060, inA); // both panels already in frame on the first frame
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
  const box = {x: lerp(0, 40, k), y: lerp(0, 140, k), w: lerp(1080, 500, k), h: lerp(1920, 620, k)};
  const cam = {x: gHead.x, y: gHead.y + 40, z: lerp(2.6, 2.6, k)};
  const sx = box.w / 1080, sy = box.h / 1920, sc = Math.max(sx, sy);
  const aim = headAim(t);
  return (
    <g>
      <GameVertical g={game2(t)} id="e1-gm" zoom={2.5} hy={800} cx={540 - 130 * aim} />
      <defs><clipPath id="e1-box"><rect x={box.x} y={box.y} width={box.w} height={box.h} rx={lerp(0, 34, k)} /></clipPath></defs>
      <g clipPath="url(#e1-box)">
        <g transform={`translate(${box.x + box.w / 2} ${box.y + box.h / 2}) scale(${sc}) translate(-540 -960)`}>
          <RoomScene t={t} frame={frame} cam={cam} g={guesser3(t)} h={null} game={game2(t)} id="e1" alwaysMouth />
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

// ---------------------------------------------------------------- H: the hidden controller
// The device, clearly in the working mouth → the lower lip rises and the lips meet (the head holds still) → the camera
// eases back to his calm, ordinary face, mouth on the centre line → match cut on that line to the game's horizon,
// where the game is STILL answering → Honest leans in and squints at the shut mouth (nothing to see).
const H_CAM: CamKey[] = [
  {t: CUTS.H1, c: {x: gMouth.x, y: gMouth.y - 4, z: 7.0}}, {t: T.close, c: {x: gMouth.x, y: gMouth.y - 2, z: 8.4}},
  {t: CUTS.H3, c: {x: gMouth.x, y: gMouth.y, z: 8.8}},
  {t: CUTS.H4, c: {x: gMouth.x, y: gMouth.y, z: 2.4}, ease: (t, a, b) => ss5(t, a, b)},
];
const ShotHide: React.FC<{t: number; frame: number}> = ({t, frame}) => (
  <RoomScene t={t} frame={frame} cam={camAt(t, H_CAM)} g={guesser3(t)} h={honest3(t)} game={game2(t)} id="h" alwaysMouth />
);
const ShotSquint: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const cam = {x: lerp(610, 640, ss(t, CUTS.H5, CUTS.I1)), y: 900, z: lerp(1.55, 1.62, ss(t, CUTS.H5, CUTS.I1))};
  return <RoomScene t={t} frame={frame} cam={cam} g={guesser3(t)} h={honest3(t)} game={game2(t)} id="h5" alwaysMouth />;
};

// ---------------------------------------------------------------- I: the versus round (beats A-E) and the loop
const ShotWide: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const cam = {x: lerp(470, 490, ss(t, CUTS.I1, CUTS.I2)), y: 860, z: lerp(1.08, 1.14, ss(t, CUTS.I1, CUTS.I2))};
  return <RoomScene t={t} frame={frame} cam={cam} g={guesser3(t)} h={honest3(t)} game={game2(t)} id="i1" alwaysMouth />;
};
const ShotGuesserCU: React.FC<{t: number; frame: number; cam: Cam; id: string}> = ({t, frame, cam, id}) => (
  <RoomScene t={t} frame={frame} cam={cam} g={guesser3(t)} h={honest3(t)} game={game2(t)} id={id} alwaysMouth />
);
/** the guesser's close-up: framed so the monitor stays out of frame (the next round starts unseen) */
const gCU = (t: number, a: number, b: number, z0: number, z1: number): Cam => ({x: gHead.x + 40, y: gHead.y + 60, z: lerp(z0, z1, ss(t, a, b))});
const LOOP_CAM: CamKey[] = [{t: CUTS.L, c: {...MON, z: 1.6}}, {t: 31.9, c: MON, ease: (t, a, b) => (t - a) / (b - a)}];

export const SHOTS2: {name: string; a: number; b: number}[] = [
  {name: 'A hook: game, pull-out, reticle to the mouth, the tap', a: 0, b: CUTS.A4},
  {name: 'A4 game: the tap fires the shot', a: CUTS.A4, b: CUTS.A5},
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
  {name: 'H hide: device in the mouth, the lips close, calm face', a: CUTS.H1, b: CUTS.H4},
  {name: 'H4 game (match cut on the mouth line): still answering', a: CUTS.H4, b: CUTS.H5},
  {name: 'H5 Honest squints at the shut mouth', a: CUTS.H5, b: CUTS.I1},
  {name: 'I1 A: confident opponent, bored winner', a: CUTS.I1, b: CUTS.I2},
  {name: 'I2 B: mashing thumbs', a: CUTS.I2, b: CUTS.I3},
  {name: 'I3 B: game, precise side-steps', a: CUTS.I3, b: CUTS.I4},
  {name: 'I4 B: winner leans back, bored', a: CUTS.I4, b: CUTS.I5},
  {name: 'I5 B: opponent furious', a: CUTS.I5, b: CUTS.I6},
  {name: 'I6 B: game, Zip tags Rex', a: CUTS.I6, b: CUTS.I7},
  {name: 'I7 B: opponent stands, straining', a: CUTS.I7, b: CUTS.I8},
  {name: 'I8 B: winner, slow blink', a: CUTS.I8, b: CUTS.C},
  {name: 'IC C: the decisive win', a: CUTS.C, b: CUTS.D},
  {name: 'ID D: opponent frozen, controller slips, eyes to the winner', a: CUTS.D, b: CUTS.E},
  {name: 'IE E: the winner, mouth shut, tiny smug smile on SHUT', a: CUTS.E, b: CUTS.L},
  {name: 'L loop: back into the opening composition', a: CUTS.L, b: 99},
];

export const Frame2: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const s = SHOTS2.find((q) => t >= q.a && t < q.b) ?? SHOTS2[SHOTS2.length - 1];
  const n = s.name.split(' ')[0];
  switch (n) {
    case 'A': return <ShotA t={t} frame={frame} />;
    case 'A4': return <ShotGame t={t} zoom={lerp(2.75, 2.55, ss(t, CUTS.A4, CUTS.A5))} id="a4" />;
    case 'A5/B1': return <ShotLow t={t} frame={frame} />;
    case 'B2': return <ShotGame t={t} zoom={lerp(2.3, 2.5, ss(t, CUTS.B2, CUTS.B3))} id="b2" />;
    case 'B3': return <ShotHonestCU t={t} frame={frame} z={lerp(2.9, 3.1, ss(t, CUTS.B3, CUTS.C1))} id="b3" />;
    case 'C1': return <ShotC1 t={t} frame={frame} />;
    case 'C2-C5': return <DeviceFlow t={t} frame={frame} />;
    case 'D1': return <ShotSplit t={t} />;
    case 'E1': return <ShotFacecam t={t} frame={frame} />;
    case 'F1': return <ShotPress t={t} />;
    case 'F2': return <ShotGame t={t} zoom={lerp(2.6, 2.8, ss(t, CUTS.F2, CUTS.G))} id="f2" />;
    case 'G': return <AssistShot t={t} frame={frame} />;
    case 'H': return <ShotHide t={t} frame={frame} />;
    case 'H4': return <ShotGame t={t} zoom={lerp(2.5, 2.6, ss(t, CUTS.H4, CUTS.H5))} hy={960} id="h4" />;
    case 'H5': return <ShotSquint t={t} frame={frame} />;
    case 'I1': return <ShotWide t={t} frame={frame} />;
    case 'I2': return <MashCU t={t} intensity={0.85} />;
    case 'I3': return <ShotGame t={t} zoom={2.35} id="i3" />;
    case 'I4': return <ShotGuesserCU t={t} frame={frame} cam={gCU(t, CUTS.I4, CUTS.I5, 2.5, 2.6)} id="i4" />;
    case 'I5': return <ShotHonestCU t={t} frame={frame} z={lerp(2.3, 2.45, ss(t, CUTS.I5, CUTS.I6))} dy={70} id="i5" />;
    case 'I6': return <ShotGame t={t} zoom={2.45} id="i6" />;
    case 'I7': return <ShotHonestCU t={t} frame={frame} z={lerp(1.9, 2.0, ss(t, CUTS.I7, CUTS.I8))} dy={150} id="i7" />;
    case 'I8': return <ShotGuesserCU t={t} frame={frame} cam={gCU(t, CUTS.I8, CUTS.C, 2.8, 2.9)} id="i8" />;
    case 'IC': return <ShotGame t={t} zoom={lerp(2.2, 2.32, ss(t, CUTS.C, CUTS.D))} hy={720} id="ic" />;
    case 'ID': return <ShotHonestCU t={t} frame={frame} z={lerp(1.62, 1.7, ss(t, CUTS.D, CUTS.E))} dy={190} id="id" />;
    case 'IE': return <ShotGuesserCU t={t} frame={frame} cam={gCU(t, CUTS.E, CUTS.L, 3.1, 3.35)} id="ie" />;
    default: return <RoomScene t={t} frame={frame} cam={camAt(t, LOOP_CAM)} g={guesser3(t)} h={honest3(t)} game={game2(t)} id="lp" alwaysMouth />;
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
