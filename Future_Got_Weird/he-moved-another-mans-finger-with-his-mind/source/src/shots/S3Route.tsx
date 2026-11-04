// S3. The route ("Watch what happens on a rocket" .. "missing the entire game").
// One connected chain that the camera follows: Rao's game launches a rocket and slows down; his RIGHT hand stays
// flat while the imagined movement (dashed ghost) repeats; up to the EEG cap, where the brain rhythm (mu band)
// shrinks when he imagines; along the cable to the computer that watches for that drop; to the screen, where the
// cursor climbs to the blue FIRE target; the computer sends one FIRE packet; the camera pulls back through Rao's lab
// window to the campus, the packet crosses to Stocco's window and docks in the TMS unit; inside, Stocco is seen
// from behind (his left = frame left), the round coil sits over the LEFT motor cortex and the hand area lights up;
// the command triggers the pulse, the signal crosses the midline and runs down his RIGHT arm; cut with the signal
// to the hand close-up (S1 geometry): the wrist jerks up, the hand drops and the index finger hits the space bar;
// cut on the click to the cannon on Rao's screen, the rocket explodes; pull back out of Rao's window, across the
// campus and into Stocco's window for the "nervous tic" reaction; pull back to the campus: Rao's window erupts
// with game action while Stocco sits in his quiet room.
import React from 'react';
import {clamp, easeInOut, easeOut, fmt, lerp} from '../dc/math';
import {FPS} from '../lib/core';
import {Cam, INK, K, Packet} from '../art/kit';
import {Campus, PW, STOCCO_WRIST, WIN_A, WIN_B} from './S1Hook';
import {LAB_A, LAB_OY, LabInPanel, RAO_COMP_OUT, RaoLab, StoccoBack, StoccoClose, StoccoFront, TMS_DISPLAY} from '../art/s3parts';
import {hitTime, tm} from './s3time';

const WW = 106; // lab window size in the campus (as in S1)
const SC = WW / PW;
const KL = SC * LAB_A; // lab unit -> campus unit
type Cm = {x: number; y: number; z: number};
type Win = {x: number; y: number};
const labPt = (w: Win, lx: number, ly: number) => ({x: w.x + KL * lx, y: w.y + KL * (ly + LAB_OY)});
/** a camera inside a lab, kept within the lab panel so the building never shows at the frame edge */
const labCam = (w: Win, lx: number, ly: number, lz: number): Cm => {
  const x = clamp(lx, 960 / lz, 1920 - 960 / lz), y = clamp(ly, -LAB_OY + 540 / lz, 1630 - 540 / lz);
  return {...labPt(w, x, y), z: lz / KL};
};
const WIDE: Cm = {x: 0, y: 470, z: 1.02};

/** camera between A and B: log-zoom, moving about the fixed point of the two framings (a straight zoom on screen) */
const camBetween = (A: Cm, B: Cm, k: number): Cm => {
  const z = A.z * Math.pow(B.z / A.z, k);
  if (Math.abs(Math.log(B.z / A.z)) < 0.02) return {x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k), z};
  const px = (A.x * A.z - B.x * B.z) / (A.z - B.z);
  const py = (A.y * A.z - B.y * B.z) / (A.z - B.z);
  return {x: px - ((px - A.x) * A.z) / z, y: py - ((py - A.y) * A.z) / z, z};
};
/** keyed camera path: [time, cam] holds; consecutive keys with different times blend with easeInOut */
const camPath = (t: number, ks: [number, Cm][]): Cm => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, A] = ks[i];
    const [b, B] = ks[i + 1];
    if (t <= b) return A === B ? A : camBetween(A, B, easeInOut(clamp((t - a) / (b - a || 1e-6))));
  }
  return ks[ks.length - 1][1];
};

const Burst: React.FC<{x: number; y: number; s: number; k: number; color?: string}> = ({x, y, s, k, color = K.saffron}) => {
  if (k <= 0 || k >= 1) return null;
  const r = s * (0.4 + 0.6 * easeOut(Math.min(1, k * 2.2)));
  const pts = Array.from({length: 16}, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const rr = i % 2 ? r * 0.55 : r;
    return `${fmt(x + Math.cos(a) * rr)},${fmt(y + Math.sin(a) * rr)}`;
  }).join(' ');
  return (
    <g opacity={1 - clamp((k - 0.55) / 0.45)}>
      <polygon points={pts} fill={color} stroke={INK} strokeWidth={s * 0.08} strokeLinejoin="round" />
      <circle cx={x} cy={y} r={r * 0.32} fill="#FFFFFF" />
    </g>
  );
};

export const S3: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const m = tm();

  // ------------------------------------------------ the hand close-up (between the back view and the click)
  if (t >= m.handCut && t < m.cut) {
    const z = 1.3 + 0.06 * clamp((t - m.handCut) / (m.cut - m.handCut));
    return (
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill={K.stoccoWall} />
        <Cam x={700} y={640} z={z}>
          <StoccoClose t={t} wrist={STOCCO_WRIST} />
        </Cam>
      </g>
    );
  }

  // ------------------------------------------------ campus-based shots (labs inside the two windows)
  const A = (lx: number, ly: number, lz: number) => labCam(WIN_A, lx, ly, lz);
  const B = (lx: number, ly: number, lz: number) => labCam(WIN_B, lx, ly, lz);
  const part1 = t < m.cut;
  let cam: Cm;
  if (part1) {
    const OPEN = A(990, 470, 1.08);
    const HANDS = A(1040, 560, 1.35);
    const HEAD = A(700, 330, 1.4);
    const CHAIN = A(990, 480, 1.12);
    const CURS = A(1480, 375, 2.0);
    const COMP = A(1220, 430, 1.3);
    const BACK = B(960, 470, 1.0);
    const BHEAD = B(960, 330, 1.9);
    const BTMS = B(700, 380, 1.45);
    const BARM = B(1060, 560, 1.45);
    cam = camPath(t, [
      [m.start, OPEN], [m.imagines - 0.45, OPEN], [m.imagines + 0.45, HANDS],
      [m.cap - 0.25, HANDS], [m.cap + 0.9, HEAD],
      [m.computer - 0.2, HEAD], [m.computer + 0.8, CHAIN],
      [m.screen - 0.35, CHAIN], [m.screen + 0.55, CURS],
      [m.sends - 0.05, CURS], [m.sends + 0.75, COMP],
      [m.command + 0.15, COMP], [m.internet + 0.7, WIDE],
      [m.across - 0.25, WIDE], [m.across + 1.5, BACK],
      [m.coil + 0.9, BACK], [m.brain - 0.1, BHEAD],
      [m.trigger - 0.3, BHEAD], [m.trigger + 0.3, BTMS],
      [m.pulse + 0.02, BTMS], [m.handCut - 0.08, BARM],
    ]);
  } else {
    const CURS = A(1480, 375, 2.0);
    const FRONT = B(930, 400, 1.3);
    const END: Cm = {x: 0, y: 445, z: 1.45};
    cam = camPath(t, [
      [m.cut, CURS], [m.disappears - 0.2, CURS], [m.disappears + 1.7, WIDE],
      [m.disappears + 1.85, WIDE], [m.described + 0.55, FRONT],
      [m.imagine - 0.5, FRONT], [m.imagine + 1.0, END],
    ]);
  }

  // ------------------------------------------------ the FIRE packet (campus space, constant size on screen)
  const pk = (() => {
    if (!part1) return null;
    const t0 = m.command - 0.25; // leaves the computer on "command"
    const t1 = m.internet - 0.2; // reaches the top of Rao's window panel
    const t2 = t1 + 0.6; // out of window A
    const t3 = m.across - 0.05; // reaches window B
    const t4 = m.across + 1.2; // docks in the TMS unit
    if (t < t0 || t > t4 + 0.25) return null;
    const out = labPt(WIN_A, RAO_COMP_OUT.x, RAO_COMP_OUT.y);
    const lift = labPt(WIN_A, RAO_COMP_OUT.x, 120);
    const aTop = {x: WIN_A.x + WW / 2, y: WIN_A.y - 8};
    const bTop = {x: WIN_B.x + WW / 2, y: WIN_B.y - 8};
    const dock = labPt(WIN_B, TMS_DISPLAY.x, TMS_DISPLAY.y);
    let p: {x: number; y: number};
    if (t < t1) {
      const u = easeOut(clamp((t - t0) / (t1 - t0)));
      p = {x: lerp(out.x, lift.x, u), y: lerp(out.y, lift.y, u)};
    } else if (t < t2) {
      const u = easeInOut(clamp((t - t1) / (t2 - t1)));
      p = {x: lerp(lift.x, aTop.x, u), y: lerp(lift.y, aTop.y, u)};
    } else if (t < t3) {
      const u = easeInOut(clamp((t - t2) / (t3 - t2)));
      const c = {x: 0, y: 40};
      p = {x: (1 - u) ** 2 * aTop.x + 2 * u * (1 - u) * c.x + u * u * bTop.x, y: (1 - u) ** 2 * aTop.y + 2 * u * (1 - u) * c.y + u * u * bTop.y};
    } else {
      const u = easeInOut(clamp((t - t3) / (t4 - t3)));
      p = {x: lerp(bTop.x, dock.x, u), y: lerp(bTop.y, dock.y, u)};
    }
    const pop = 1 + 0.35 * Math.max(0, 1 - Math.abs(t - (m.fire + 0.1)) / 0.35);
    const shrink = 1 - 0.6 * clamp((t - (t4 - 0.25)) / 0.3);
    const k = clamp((t - t0) / 0.2) * (1 - clamp((t - t4) / 0.2));
    return <Packet x={p.x} y={p.y} s={(1.0 * pop * shrink) / cam.z} k={k} />;
  })();

  // ------------------------------------------------ the ending: Rao's window erupts with game action
  const bursts = !part1 ? [m.missing - 0.05, m.missing + 0.55, m.game - 0.05, m.game + 0.5, m.game + 0.95] : [];
  const glowA = bursts.reduce((a, b) => Math.max(a, t > b ? Math.max(0, 1 - (t - b) / 0.45) : 0), 0);
  const winA = {x: WIN_A.x + WW / 2, y: WIN_A.y};
  const burstPos = [{x: -60, y: -70}, {x: 70, y: -40}, {x: -20, y: -120}, {x: 80, y: -110}, {x: -70, y: -30}];

  return (
    <g>
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        <Campus
          f={f}
          shift={0}
          frameK={1}
          rao={<LabInPanel><RaoLab t={t} f={f} /></LabInPanel>}
          stocco={<LabInPanel>{part1 ? <StoccoBack t={t} f={f} /> : <StoccoFront t={t} f={f} />}</LabInPanel>}
          glowA={glowA}
        >
          {pk}
          {bursts.map((b, i) => (
            <Burst key={i} x={winA.x + burstPos[i].x} y={winA.y + burstPos[i].y} s={70 + 14 * (i % 2)} k={(t - b) / 0.7} color={i % 2 ? K.coral : K.saffron} />
          ))}
        </Campus>
      </Cam>
    </g>
  );
};

/** sound events of the sequence (absolute seconds) */
export const CUES_S3 = (): {t: number; kind: string; gain?: number}[] => {
  const m = tm();
  const hit = hitTime();
  return [
    {t: m.launch, kind: 'rocket_launch'},
    {t: m.imagines - 0.4, kind: 'whoosh', gain: 0.3},
    {t: m.cap + 0.1, kind: 'whoosh', gain: 0.35},
    {t: m.capW, kind: 'pop', gain: 0.5},
    {t: m.changes + 0.05, kind: 'tick', gain: 0.6},
    {t: m.computer + 0.4, kind: 'tick', gain: 0.4},
    {t: m.computer + 0.9, kind: 'tick', gain: 0.4},
    {t: m.screen + 0.05, kind: 'whoosh', gain: 0.3},
    {t: m.cursorW + 0.6, kind: 'tick', gain: 0.35},
    {t: m.cursorW + 1.3, kind: 'tick', gain: 0.4},
    {t: m.cursorW + 2.0, kind: 'tick', gain: 0.45},
    {t: m.target - 0.04, kind: 'pop', gain: 0.8},
    {t: m.command - 0.25, kind: 'packet_send'},
    {t: m.command + 0.2, kind: 'whoosh', gain: 0.45},
    {t: m.fire + 0.1, kind: 'whoosh', gain: 0.35},
    {t: m.across - 0.05, kind: 'packet_arrive', gain: 0.8},
    {t: m.across + 0.1, kind: 'whoosh', gain: 0.35},
    {t: m.across + 1.2, kind: 'tick', gain: 0.5},
    {t: m.coil, kind: 'pop', gain: 0.4},
    {t: m.trigger + 0.12, kind: 'tick', gain: 0.6},
    {t: m.pulse, kind: 'coil_pulse'},
    {t: m.contact, kind: 'key_click'},
    {t: m.cut, kind: 'cannon'},
    {t: hit, kind: 'boom'},
    {t: m.disappears - 0.1, kind: 'whoosh', gain: 0.4},
    {t: m.described + 0.1, kind: 'whoosh', gain: 0.35},
    {t: m.tic - 0.2, kind: 'pop', gain: 0.4},
    {t: m.imagine - 0.4, kind: 'whoosh', gain: 0.35},
    {t: m.missing - 0.05, kind: 'boom', gain: 0.35},
    {t: m.missing + 0.55, kind: 'cannon', gain: 0.3},
    {t: m.game - 0.05, kind: 'boom', gain: 0.35},
    {t: m.game + 0.5, kind: 'boom', gain: 0.3},
  ];
};
