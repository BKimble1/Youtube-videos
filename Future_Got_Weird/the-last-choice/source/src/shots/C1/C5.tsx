// C5 · 1:04.6–1:09.0 · On the catwalk under the deck, beside the broken steam pipe. The builder crouches over the
// battered tablet and sketches four walking figures with a finger; a tap — the sketch fills in and walks. Input →
// creation. The Director watches; the carrier keeps watch west; the friend sits with the teammate.
import React from 'react';
import {Cam, mixCam, smoothCam} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {look, dmg, CIV, radioOnStrap} from '../../film/crew';
import {at, Cue} from '../../film/cue';
import {shot} from '../../film/timing';
import {ActorProps, solve} from '../../rig/actor';
import {clamp, seg, smooth, lerp, V2, noise} from '../../kit/math';
import {CatwalkScene, CATWALK} from './catwalk';
import {Tablet, SketchFigure, FACE, stand} from './kit';
import {C} from '../../theme';

const ID = 'C5';
export const BX = 8900; // the builder's spot on the catwalk (C5–C7)
const TAP = 2.6;
const FIG = [0, 1, 2, 3].map((i) => ({x: -27 + i * 18, y: 20, h: 34}));
const DRAW = (i: number) => [0.45 + i * 0.5, 0.9 + i * 0.5] as const;

/** Where the fingertip is while sketching figure i at progress u (tablet-local). */
const tip = (i: number, u: number): V2 => {
  const f = FIG[i], h = f.h;
  const hip = {x: f.x, y: f.y - h * 0.45}, neck = {x: f.x + h * 0.03, y: f.y - h * 0.8}, head = {x: f.x + h * 0.04, y: f.y - h * 0.92};
  const legs = [-0, 0].map((_, k) => ({x: hip.x + (k ? -1 : 1) * Math.sin(0) * h, y: hip.y + h * 0.45}));
  const arms = [0, 1].map(() => ({x: neck.x, y: neck.y + h * 0.34}));
  const segs: [V2, V2][] = [[hip, neck], [hip, legs[0]], [hip, legs[1]], [neck, arms[0]], [neck, arms[1]]];
  const n = clamp(u) * 6;
  if (n < 1) { const a = n * Math.PI * 2; return {x: head.x + Math.cos(a) * h * 0.08, y: head.y + Math.sin(a) * h * 0.08}; }
  const k = Math.min(4, Math.floor(n - 1)), w = n - 1 - k;
  return {x: lerp(segs[k][0].x, segs[k][1].x, w), y: lerp(segs[k][0].y, segs[k][1].y, w)};
};

export const tabletPose = (t: number, builder: ActorProps) => {
  const r = solve(builder);
  return {x: r.P.x + 30, y: r.P.y - 70 + 3 * noise(t * 2, 4), z: r.P.z + 70, tz: r.torsoZ, s: 1.25, view: 0.84, rot: -5};
};

export const crewC5 = (t: number, T: number) => {
  const out: ActorProps[] = [];
  const g = CATWALK;
  // builder: crouched, tablet in her left hand, drawing with the right index finger
  const b: ActorProps = {
    ...stand(look('builder'), BX, g, {t}, 46), seed: 37, dmg: dmg('builder', T), z: 40, yaw: 26, drop: 118, lean: 24, breath: 0.5,
    face: {mouth: t > TAP + 0.3 ? 'soft' : 'flat', brows: -0.4, lids: 0.2, lookY: 0.8, lookX: 0.15}, head: {pitch: 22, yaw: 6},
    legL: {foot: {x: BX - 58, y: g - 10}}, legR: {foot: {x: BX + 50, y: g - 10}, pole: {x: 0.3, y: 0, z: 1}},
  };
  const tp = tabletPose(t, b);
  const sy = lerp(0.18, 1, tp.view);
  // the active stroke
  let drawI = -1, drawU = 0;
  FIG.forEach((_, i) => { const [a, e] = DRAW(i); if (t >= a && t < e) { drawI = i; drawU = (t - a) / (e - a); } });
  const between = t < TAP ? FIG.findIndex((_, i) => t < DRAW(i)[0]) : -1;
  const tl = drawI >= 0 ? tip(drawI, drawU) : t < TAP + 0.15 && t > 2.45 ? {x: 30, y: 14} : between > 0 ? lerp2(tip(between - 1, 1), tip(between, 0), smooth(clamp((t - DRAW(between - 1)[1]) / 0.1))) : {x: 46, y: 30};
  const lift = drawI >= 0 || Math.abs(t - TAP) < 0.06 ? 0 : 10;
  const rot = (tp.rot * Math.PI) / 180;
  const toW = (q: V2): V2 => ({x: tp.x + (q.x * Math.cos(rot) - q.y * sy * Math.sin(rot)) * tp.s, y: tp.y + (q.x * Math.sin(rot) + q.y * sy * Math.cos(rot)) * tp.s});
  const fw = toW(tl);
  const away = smooth(seg(t, 3.2, 3.6)); // finger leaves the screen after the tap
  b.armR = {hand: {x: lerp(fw.x + 8, tp.x + 70, away), y: lerp(fw.y - 14 - lift, tp.y - 40, away), z: tp.z + 30}, pole: {x: 0.4, y: 1, z: 0.2}};
  b.handR = 'mitt';
  b.zHand = [175, 190];
  b.armL = {hand: {x: tp.x - 50, y: tp.y + 8, z: tp.z + 6}, pole: {x: -0.6, y: 1, z: 0}};
  out.push(b);
  // Director: crouched beside her, watching the screen, then looks up at her
  const look2 = smooth(seg(t, 3.0, 3.4));
  out.push({...stand(look('director'), BX + 215, g, {t}, 44), seed: 31, dmg: dmg('director', T), z: -50, yaw: -45, drop: 104, lean: 26, breath: 0.8,
    legL: {foot: {x: BX + 260, y: g - 10}}, legR: {foot: {x: BX + 170, y: g - 10}},
    armR: {hand: {x: BX + 175, y: g - 120, z: -10}}, armL: {hand: {x: BX + 235, y: g - 110, z: -70}},
    face: {mouth: look2 > 0.5 ? 'soft' : 'pant', brows: -0.3, lookX: lerp(-0.5, -0.3, look2), lookY: lerp(0.7, -0.1, look2)}, head: {pitch: lerp(24, 4, look2), yaw: lerp(-20, -10, look2)}});
  // carrier: standing west of them, watching back along the catwalk, holding the cut arm
  out.push({...stand(look('carrier'), BX - 270, g, {t}, 36, -1), seed: 35, dmg: dmg('carrier', T), z: -40, yaw: -70, breath: 0.9, lean: 4,
    armL: {fk: {fwd: 40, out: 4, bend: 110}}, handL: 'fist', armR: {hand: {x: BX - 240, y: g - 290, z: 10}},
    face: {mouth: 'grit', brows: -0.5, lids: 0.3, lookX: -0.4}, head: {yaw: -20 + 12 * noise(t * 0.6, 2)}});
  // the friend kneels by the teammate, who sits against the girder
  out.push({look: look('teammate'), t, seed: 36, dmg: dmg('teammate', T), x: BX + 490, y: g, z: 60, yaw: 70, drop: 128, lean: -16, breath: 1,
    legR: {foot: {x: BX + 600, y: g - 12}}, legL: {foot: {x: BX + 560, y: g - 12}, pitch: 10}, satchel: {radio: radioOnStrap(T)},
    armL: {hand: {x: BX + 520, y: g - 190, z: 30}}, handL: 'fist', armR: {fk: {fwd: 20, out: 30, bend: 30}},
    face: {mouth: 'sad', worry: 0.8, lids: 0.45}, head: {pitch: 8, roll: 6}});
  out.push({...stand(look('friend'), BX + 355, g, {t}, 40), seed: 33, dmg: dmg('friend', T), yaw: 20, drop: 6, lean: 4, z: -20,
    armR: {hand: {x: BX + 455, y: g - 250, z: 30}}, face: {mouth: 'flat', worry: 0.6, lookX: 0.3, lookY: 0.5}, head: {yaw: 10, pitch: 14}});
  // civilians further along, crouched low
  [0, 1, 2].forEach((i) => out.push({...stand(CIV[i], BX + 760 + i * 150, g, {t}, 34), s: CIV[i].height, seed: 50 + i, yaw: 80 - i * 30, drop: 70 + 20 * i, lean: 20, face: FACE.worry}));
  return {out, tp, b};
};
const lerp2 = (a: V2, b: V2, u: number) => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u)});

/** The tablet screen: the finger sketch, then the walking figures (C5), the projector lens. */
export const TabletContent: React.FC<{t: number; tap: number; draw: (i: number) => readonly [number, number]}> = ({t, tap, draw}) => {
  const walking = t > tap + 0.1;
  const fill = smooth(seg(t, tap, tap + 0.3));
  return (
    <g>
      <rect x={-40} y={-26} width={80} height={52} fill="#F4EEDC" opacity={fill * 0.95} />
      {/* ground line (scrolls when the figures walk) */}
      <line x1={-38} y1={21} x2={38} y2={21} stroke={fill > 0.5 ? '#9A8F76' : '#5FA9B8'} strokeWidth={0.8} strokeDasharray="4 3" strokeDashoffset={walking ? -(t - tap) * 14 : 0} opacity={0.7} />
      {FIG.map((f, i) => {
        const [a, e] = draw(i);
        const d = clamp((t - a) / (e - a));
        const ph = walking ? (t - tap) * 9 + i * 1.3 : 0;
        return (
          <g key={i}>
            {fill < 1 && <g opacity={1 - fill}><SketchFigure x={f.x} y={f.y} h={f.h} draw={d} ph={0} /></g>}
            {fill > 0 && <g opacity={fill}><SketchFigure x={f.x - (walking ? Math.sin(ph) * 0.6 : 0)} y={f.y - Math.abs(Math.sin(ph)) * 0.8} h={f.h} ph={ph} fill="#22303A" /></g>}
          </g>
        );
      })}
      {t > tap - 0.02 && t < tap + 0.5 && <circle cx={30} cy={14} r={4 + (t - tap) * 40} fill="none" stroke="#5FA9B8" strokeWidth={1.4} opacity={1 - (t - tap) / 0.5} />}
    </g>
  );
};

const camAt = (t: number): Cam => mixCam({x: 9000, y: -1480, z: 1.05}, {x: 8960, y: -1430, z: 1.85}, smooth(seg(t, 0.2, 2.4)));

export const C5Shot: React.FC = () => {
  const {t, T} = useShot(ID);
  const cam = smoothCam(camAt, t, 0.25);
  const {out, tp} = crewC5(t, T);
  const tab = {z: 40 * 1000 + 150, el: <g transform={`translate(${tp.x} ${tp.y})`}><Tablet s={tp.s} ink={4 / cam.z} view={tp.view} rot={tp.rot} id="c5tab" glow={0.9} content={<TabletContent t={t} tap={TAP} draw={DRAW} />} /></g>};
  return <CatwalkScene id="c5" cam={cam} T={T} crew={out} extraParts={[tab]} rail={{hide: true}} />;
};

const c = at(shot(ID).start);
export const CUES: Cue[] = [
  c(0.45, 'projector_beep', {pan: 0, gain: -8, rate: 0.8}),
  c(TAP, 'projector_beep', {pan: 0.05, gain: -2}),
  c(0, 'breath_ragged', {dur: 4.4, gain: -9, pan: 0.4}),
];
void C;
