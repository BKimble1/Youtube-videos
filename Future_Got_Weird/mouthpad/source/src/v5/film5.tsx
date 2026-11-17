// MouthPad V2: the shot table and every shot. Cuts are on action or on a matching shape (the tongue's tap ring
// becomes the game's hit ring; the pad's click flash becomes the shot; the closing lips cut to the calm face on the
// same line; the winning splat bursts out of the screen into the loser's face). The last frame is the first frame.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {SCREEN, gMouth, gHead, hHead, H, G, Cam, handWorldG} from '../art/room';
import {RoomScene} from './room5';
import {padInHead} from '../art/mouth';
import {reach} from '../crew';
import {camAt, CamKey} from '../camera';
import {game2, FIRE2, LOOP_SWAP, headAim, tongueU, MOVE_B} from './play5';
import {guesser5, honest5, LOOP_CUT, KO_HIT} from './cast5';
import {DeviceFlow, C2_START, ECU2} from './device5';
import {SectionScene, palate} from './section5';
import {AssistShot, ASSIST_START, ASSIST_END} from './assist5';
import {GameVertical, Reticle, MashCU} from './fx';
import {Jaw, padPoint, projector} from '../art/jaw3d';
import {GameScreen} from '../art/game';
import {T} from '../story';
import {Captions5} from './captions5';
import {FPS, clamp, keys, lerp, ss, ss5, eo, pulse, blip} from '../lib';

const INK = '#162A32';
export const MON: Cam = {x: SCREEN.x + SCREEN.w / 2, y: SCREEN.y + SCREEN.h / 2, z: 1.7};
const MED: Cam = {x: 560, y: 770, z: 1.18};
const ECU_A: Cam = {x: gMouth.x, y: gMouth.y + 6, z: 12.5};

export const CUTS = {
  A4: T.can + 0.04, A5: T.with1, B2: T.watch - 0.07, B3: T.this2 + 0.44, C1: T.its + 0.26, C2: C2_START, D1: T.mouth2 + 0.17,
  E1: MOVE_B, F1: T.aim + 0.62, G: ASSIST_START, H1: ASSIST_END, H3: T.mouth3 + 0.16, H4: T.nobody + 0.5,
  I1: T.see + 0.27, I2: T.losing, I3: T.video2, I4: T.game + 0.0, I5: T.someone - 0.05, I6: T.whos, I7: T.literally, C: T.literally + 0.3,
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
  const g = guesser5(t);
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
      <RoomScene t={t} frame={frame} cam={cam} g={g} h={honest5(t)} game={gm} id="a" alwaysMouth
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

// ---------------------------------------------------------------- A5 + B1: low angle on the hands-free player (V4: no gamepad on the desk)
const LOW_CAM: CamKey[] = [
  {t: CUTS.A5, c: {x: 650, y: 905, z: 1.42}}, {t: T.seriously - 0.1, c: {x: 630, y: 905, z: 1.45}},
  {t: T.seriously + 0.35, c: {x: 520, y: 935, z: 1.5}}, {t: CUTS.B2, c: {x: 515, y: 935, z: 1.52}},
];
const ShotLow: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const cam = camAt(t, LOW_CAM);
  return (
    <g>
      <RoomScene t={t} frame={frame} cam={cam} g={guesser5(t)} h={honest5(t)} game={game2(t)} id="lo" alwaysMouth />
    </g>
  );
};

// ---------------------------------------------------------------- B3: Honest's jaw drops
const ShotHonestCU: React.FC<{t: number; frame: number; z: number; dy?: number; id: string}> = ({t, frame, z, dy = 30, id}) => {
  const h = honest5(t)!;
  const hp = hHead(h.x);
  const cam = {x: hp.x + 40, y: hp.y - (h.rise ?? 0) + dy, z};
  return <RoomScene t={t} frame={frame} cam={cam} g={guesser5(t)} h={h} game={game2(t)} id={id} alwaysMouth />;
};

// ---------------------------------------------------------------- C1: in to the mouth for the lift
const C1_CAM: CamKey[] = [{t: CUTS.C1, c: {x: gMouth.x, y: gMouth.y - 10, z: 5.2}}, {t: CUTS.C2, c: ECU2, ease: (t, a, b) => ss(t, a, b)}];
const ShotC1: React.FC<{t: number; frame: number}> = ({t, frame}) => (
  <RoomScene t={t} frame={frame} cam={camAt(t, C1_CAM)} g={guesser5(t)} h={honest5(t)} game={game2(t)} id="c1" alwaysMouth />
);

// ---------------------------------------------------------------- D1: move your tongue (cause on top, effect below)
const ShotSplit: React.FC<{t: number}> = ({t}) => {
  const g = game2(t);
  const inA = eo(t, CUTS.D1, CUTS.D1 + 0.28);
  const u = tongueU(t); // (V4) the same curve moves Zip (play4.ts), so the game answers the tongue on the same frame
  const v = 0.05 * Math.sin(t * 3);
  // the tongue's trail on the pad, sampled behind the contact
  const trail = Array.from({length: 10}, (_, i) => {
    const tt = t - i * 0.035;
    return {u: tongueU(tt), v: 0.05 * Math.sin(tt * 3)};
  });
  const view = {yaw: 0, pitch: -90, persp: 600};
  const pr = projector(view);
  const px = 11.5;
  const jy = lerp(100, 500, inA), gy = lerp(1540, 1100, inA); // both panels already in frame on the first frame; (V3 captions) a 110 px band between them (880–990) carries the caption
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#1B1D33" />
      {/* cause: the roof of the mouth from below, the see-through tongue sliding on the pad */}
      <g transform={`translate(0 ${jy})`}>
        <rect x={50} y={-410} width={980} height={790} rx={48} fill="#4A1622" stroke={INK} strokeWidth={6} />
        <g transform={`translate(540 -10) scale(${px})`}>
          <Jaw clipPad view={view} px={px} id="d1-jaw" contact={{u, v, glow: 1, r: 1.6}} tongueX={1} /> {/* (V5) a smaller contact disc stays on the pad at the extremes */}
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
  const k = 1; // (V4) the cut from the split lands straight in the facecam layout
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
          <RoomScene t={t} frame={frame} cam={cam} g={guesser5(t)} h={null} game={game2(t)} id="e1" alwaysMouth />
        </g>
      </g>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={lerp(0, 34, k)} fill="none" stroke="#FFFFFF" strokeWidth={lerp(0, 10, k)} />
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={lerp(0, 34, k)} fill="none" stroke={INK} strokeWidth={lerp(0, 4, k)} />
    </g>
  );
};

// ---------------------------------------------------------------- F1: press your tongue up (contact = click)
// (V4) the same "cause on top, effect below" layout as the move demo: the tongue presses the pad in the cut-away on
// top while the game runs below, so the click and the shot it fires are seen in the same frame.
const GamePanel: React.FC<{t: number; y: number; id: string}> = ({t, y, id}) => (
  <g transform={`translate(0 ${y})`}>
    <defs><clipPath id={`${id}-gclip`}><rect x={50} y={-110} width={980} height={700} rx={48} /></clipPath></defs>
    <g clipPath={`url(#${id}-gclip)`}>
      <g transform="translate(60 -110) scale(1.5)"><GameScreen g={game2(t)} id={`${id}-gm`} ext={{t: 0, b: 70, l: 10, r: 10}} hud /></g>
    </g>
    <rect x={50} y={-110} width={980} height={700} rx={48} fill="none" stroke={INK} strokeWidth={6} />
  </g>
);
const ShotPress: React.FC<{t: number}> = ({t}) => {
  const cz = -0.6; // (V5) the whole tip under the pad's flat part
  const px = lerp(10.6, 11.4, ss(t, CUTS.F1, CUTS.G));
  const contactY = palate(cz) + 0.5;
  const fx = cz - 10, fy = contactY + 4;
  // (V4) the tip rises and hovers just short of the pad, then flicks up into contact on "CLICK" (the click is the contact)
  const tl = keys(t, [[T.tongue3 - 0.05, 0], [T.up + 0.05, 0.68], [T.you4 + 0.15, 0.73], [T.click - 0.06, 0.75], [T.click + 0.0, 1]]);
  const press = pulse(t, T.click - 0.03, T.click, T.click + 0.12, T.click + 0.25);
  const P0 = {x: 50, y: 90, w: 980, h: 790};
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#1B1D33" />
      <defs><clipPath id="f1-clip"><rect x={P0.x} y={P0.y} width={P0.w} height={P0.h} rx={48} /></clipPath></defs>
      <g clipPath="url(#f1-clip)">
        <SectionScene cx={540 - fx * px} cy={P0.y + P0.h / 2 - fy * px} px={px} lift={tl} cz={cz} press={press} glow={clamp((tl - 0.94) / 0.06)} ring={t - T.click} reveal={1} near={0} />
      </g>
      <rect x={P0.x} y={P0.y} width={P0.w} height={P0.h} rx={48} fill="none" stroke={INK} strokeWidth={6} />
      <GamePanel t={t} y={1100} id="f1" />
    </g>
  );
};

// ---------------------------------------------------------------- H: the hidden controller
// The device, clearly in the working mouth → the lower lip rises and the lips meet (the head holds still) → the camera
// eases back to his calm, ordinary face, mouth on the centre line → match cut on that line to the game's horizon,
// where the game is STILL answering → (V4) the wide two-shot: Honest rolls closer and peers at the shut mouth.
const H_CAM: CamKey[] = [
  {t: CUTS.H1, c: {x: gMouth.x, y: gMouth.y - 4, z: 7.0}}, {t: T.close, c: {x: gMouth.x, y: gMouth.y - 2, z: 8.4}},
  {t: CUTS.H3, c: {x: gMouth.x, y: gMouth.y, z: 8.8}},
  {t: CUTS.H4, c: {x: gMouth.x, y: gMouth.y, z: 2.4}, ease: (t, a, b) => ss5(t, a, b)},
];
const ShotHide: React.FC<{t: number; frame: number}> = ({t, frame}) => (
  <RoomScene t={t} frame={frame} cam={camAt(t, H_CAM)} g={guesser5(t)} h={honest5(t)} game={game2(t)} id="h" alwaysMouth />
);

// ---------------------------------------------------------------- I: the versus round (beats A-E) and the loop
const ShotWide: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const cam = {x: lerp(470, 490, ss(t, CUTS.I1, CUTS.I2)), y: 860, z: lerp(1.08, 1.14, ss(t, CUTS.I1, CUTS.I2))};
  return <RoomScene t={t} frame={frame} cam={cam} g={guesser5(t)} h={honest5(t)} game={game2(t)} id="i1" alwaysMouth />;
};
const ShotGuesserCU: React.FC<{t: number; frame: number; cam: Cam; id: string}> = ({t, frame, cam, id}) => (
  <RoomScene t={t} frame={frame} cam={cam} g={guesser5(t)} h={honest5(t)} game={game2(t)} id={id} alwaysMouth />
);
/** the guesser's close-up: framed so the monitor stays out of frame (the next round starts unseen) */
const gCU = (t: number, a: number, b: number, z0: number, z1: number): Cam => ({x: gHead.x + 40, y: gHead.y + 60, z: lerp(z0, z1, ss(t, a, b))});
/** (V4) the last shot: the winner's close-up, then the camera glides out and across to the monitor, arriving exactly at
 *  the opening composition on the loop point (frame 957 = frame 0), still easing in as the opening shot does */
const endCam = (t: number): Cam => {
  const cu = gCU(t, CUTS.E, CUTS.L, 3.1, 3.3);
  if (t <= CUTS.L) return cu;
  const u = ss5(t, CUTS.L, 31.9);
  const a = gCU(CUTS.L, CUTS.E, CUTS.L, 3.1, 3.3);
  const lz = lerp(Math.log(a.z), Math.log(MON.z), u);
  // the position follows the zoom (so the move reads as one push-out-and-pan, not a slide)
  const w = (1 / Math.exp(lz) - 1 / a.z) / (1 / MON.z - 1 / a.z);
  return {x: lerp(a.x, MON.x, w), y: lerp(a.y, MON.y, w), z: Math.exp(lz)};
};

export const SHOTS2: {name: string; a: number; b: number}[] = [
  {name: 'A hook: game, pull-out, reticle to the mouth, the tap', a: 0, b: CUTS.A4},
  {name: 'A4 game: the tap fires the shot', a: CUTS.A4, b: CUTS.A5},
  {name: 'A5/B1 low angle: hands-free player (no controller), Honest leans in', a: CUTS.A5, b: CUTS.B2},
  {name: 'B2 game: weave and double', a: CUTS.B2, b: CUTS.B3},
  {name: 'B3 Honest jaw drop', a: CUTS.B3, b: CUTS.C1},
  {name: 'C1 into the mouth', a: CUTS.C1, b: CUTS.C2},
  {name: 'C2-C5 device: lift out, turn, sensor, fly into the cut-away', a: CUTS.C2, b: CUTS.D1},
  {name: 'D1 split: tongue moves → character moves', a: CUTS.D1, b: CUTS.E1},
  {name: 'E1 facecam: head tilt → aim', a: CUTS.E1, b: CUTS.F1},
  {name: 'F1 split: the press clicks, the game fires on the next frame', a: CUTS.F1, b: CUTS.G},
  {name: 'G montage: computer and phone, hands-free', a: CUTS.G, b: CUTS.H1},
  {name: 'H hide: device in the mouth, the lips close, calm face', a: CUTS.H1, b: CUTS.H4},
  {name: 'H4 game (match cut on the mouth line): still answering', a: CUTS.H4, b: CUTS.I1},
  {name: 'I1 A: confident opponent, bored winner', a: CUTS.I1, b: CUTS.I2},
  {name: 'I2 B: mashing thumbs', a: CUTS.I2, b: CUTS.I3},
  {name: 'I3 B: game, precise side-steps', a: CUTS.I3, b: CUTS.I4},
  {name: 'I4 B: winner leans back, bored', a: CUTS.I4, b: CUTS.I5},
  {name: 'I5 B: opponent furious', a: CUTS.I5, b: CUTS.I6},
  {name: 'I6 B: game, Zip tags Rex', a: CUTS.I6, b: CUTS.I7},
  {name: 'I7 B: two-shot: opponent up and straining, the winner relaxed', a: CUTS.I7, b: CUTS.C},
  {name: 'IC C: the decisive win', a: CUTS.C, b: CUTS.D},
  {name: 'ID D: opponent frozen, controller slips, eyes to the winner', a: CUTS.D, b: CUTS.E},
  {name: 'IE E: the winner, mouth shut, tiny smug smile on SHUT; the camera glides back into the opening composition', a: CUTS.E, b: 99},
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
    case 'G': return <AssistShot t={t} frame={frame} />;
    case 'H': return <ShotHide t={t} frame={frame} />;
    case 'H4': return <ShotGame t={t} zoom={lerp(2.5, 2.6, ss(t, CUTS.H4, CUTS.I1))} hy={960} id="h4" />;
    case 'I1': return <ShotWide t={t} frame={frame} />;
    case 'I2': return <MashCU t={t} intensity={0.85} />;
    case 'I3': return <ShotGame t={t} zoom={2.35} id="i3" />;
    case 'I4': return <ShotGuesserCU t={t} frame={frame} cam={gCU(t, CUTS.I4, CUTS.I5, 2.5, 2.6)} id="i4" />;
    case 'I5': return <ShotHonestCU t={t} frame={frame} z={lerp(2.3, 2.45, ss(t, CUTS.I5, CUTS.I6))} dy={70} id="i5" />;
    case 'I6': return <ShotGame t={t} zoom={2.45} id="i6" />;
    // (V4) a two-shot: Honest up and straining beside the winner, who has not moved
    case 'I7': return <RoomScene t={t} frame={frame} cam={{x: lerp(540, 552, ss(t, CUTS.I7, CUTS.C)), y: 905, z: lerp(1.3, 1.36, ss(t, CUTS.I7, CUTS.C))}} g={guesser5(t)} h={honest5(t)} game={game2(t)} id="i7" alwaysMouth />;
    // (V4) a zoom punch on the K.O. hit
    case 'IC': return <ShotGame t={t} zoom={lerp(2.2, 2.32, ss(t, CUTS.C, CUTS.D)) + 0.24 * pulse(t, KO_HIT - 0.03, KO_HIT + 0.05, KO_HIT + 0.18, KO_HIT + 0.5)} hy={720} id="ic" />;
    case 'ID': return <ShotHonestCU t={t} frame={frame} z={lerp(1.62, 1.7, ss(t, CUTS.D, CUTS.E))} dy={190} id="id" />;
    default: return <ShotGuesserCU t={t} frame={frame} cam={endCam(t)} id="ie" />;
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
      <Captions5 frame={frame} />
      {audio ? <Audio src={staticFile(`audio/${audio}.wav`)} /> : null}
    </AbsoluteFill>
  );
};
void blip; void reach; void LOOP_SWAP;
