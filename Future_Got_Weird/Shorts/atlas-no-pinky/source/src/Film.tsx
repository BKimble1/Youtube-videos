import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, F, H, W} from './theme';
import {CAPTIONS, EV} from './cues';
import {Bench, Chip, E, kf, tapeLead, ThemeLayer, tw, Wall, TAPE_BW, tapePoly, RH} from './film/common';
import {CheckerBody, CheckerFront, checkerState} from './film/checker';
import {B01Hud, B01World, B02Hud, B02World, B03World, OPEN_POSE} from './film/beats1';
import {B04Hud, B04World, B05Hud, ShotA, ShotB, ShotC, W5, DIE5, poseB04, shotA, shotB} from './film/beats2';
import {B06Bench, B06Card, B06Hud, B06Plates, B06Tray, B07Hud, B07Tool, B08Card, B09World} from './film/beats3';
import {tipWorld} from './hand/Hand';

const WIPE = {from: EV['B01.tape.enter'], to: EV['B01.tape.enter'] + 17};
const IRIS_R = 2300;
const iris = (g: number, from: number, to: number) => tw(g, from, to - from, E.inOut) * IRIS_R;

// iris reveals: [id, centre, from, to]
const idxTipB04 = tipWorld('robot', 'front', 'index', poseB04(489), {x: RH.x, y: RH.y, scale: RH.s});
const IR = {
  b04: {cx: RH.x, cy: RH.y, from: 301, to: 313}, // wall -> saffron (B03 -> B04), from the palm
  b05: {cx: idxTipB04.x, cy: idxTipB04.y, from: 489, to: 503}, // B04 -> B05 from the index fingertip
  shotB: {cx: W5.x, cy: 0, from: 539, to: 553}, // washer -> turning object
  shotC: {cx: DIE5.x, cy: DIE5.y, from: 567, to: 581}, // object centre -> tool trigger
  b09: {cx: RH.x, cy: RH.y, from: 939, to: 953}, // B08 -> B09 loop pose
};

const themeLayers = (): ThemeLayer[] => [
  {theme: 'cream', from: WIPE.from, to: WIPE.to, kind: 'tape'},
  {theme: 'saffron', from: IR.b04.from, to: IR.b04.to, kind: 'iris', cx: IR.b04.cx, cy: IR.b04.cy},
  {theme: 'cream', from: IR.b05.from, to: IR.b05.to, kind: 'iris', cx: IR.b05.cx, cy: IR.b05.cy},
  {theme: 'saffron', from: IR.b09.from, to: IR.b09.to, kind: 'iris', cx: IR.b09.cx, cy: IR.b09.cy},
];

const circle = (cx: number, cy: number, r: number) => `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
const outside = (cx: number, cy: number, r: number) => `M -10 -10 H ${W + 10} V ${H + 10} H -10 Z ${circle(cx, cy, Math.max(0.01, r))}`;

const TAGS: [number, string][] = [
  [0, 'NEW-HAND SCHEMATIC'],
  [98, 'ILLUSTRATIVE RECONSTRUCTION'],
  [309, 'CONCEPTUAL DIAGRAM'],
  [489, 'COMPANY-REPORTED ABILITIES'],
  [609, 'DESIGN-OPTION SCHEMATIC'],
  [792, 'DESIGN-GOAL ILLUSTRATION'],
  [890, 'COSMETIC EXPECTATION'],
  [939, 'EDITORIAL JOKE'],
];

const Captions: React.FC<{g: number}> = ({g}) => {
  const c = CAPTIONS.find((k) => g >= k.from && g < k.to);
  if (!c) return null;
  const lines = c.text.split('\n');
  const a = Math.min(1, (g - c.from + 1) / 3) * Math.min(1, (c.to - g) / 3);
  const w = Math.min(900, Math.max(...lines.map((l) => l.length)) * 27.5 + 64);
  const h = lines.length * 62 + 30;
  return (
    <g transform={`translate(540 ${1405})`} opacity={a}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={C.ink} opacity={0.88} />
      {lines.map((l, i) => (
        <text key={i} x={0} y={(i - (lines.length - 1) / 2) * 62} dy="0.36em" textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={52} fill={C.cream}>
          {l}
        </text>
      ))}
    </g>
  );
};

export const Film: React.FC<{captions?: boolean; audio?: boolean}> = ({captions = false, audio = false}) => {
  const g = useCurrentFrame();
  const st = checkerState(g);
  // camera: B01 punch-in toward the gap (released into the tape wipe); B04 gentle push-in at the number reveal
  const k1 = kf(g, [[0, 0, E.linear], [EV['B01.punch_in'], 0, E.inOut], [EV['B01.punch_in'] + 14, 1, E.inOut], [WIPE.from + 4, 1, E.inOut], [WIPE.to, 0, E.inOut]]);
  const k4 = tw(g, EV['B04.count.thirteen'] - 4, 16, E.inOut) * (1 - tw(g, 489, 10, E.inOut));
  const cam = {cx: 540 + 40 * k1 + 30 * k4, cy: 960, zoom: 1 + 0.07 * k1 + 0.045 * k4};
  const wiping = g >= WIPE.from && g < WIPE.to + 1;
  const leftPoly = `-20,0 ${tapeLead(g, WIPE.from, WIPE.to, 0)},0 ${tapeLead(g, WIPE.from, WIPE.to, H)},${H} -20,${H}`;
  const rightPoly = tapePoly(g, WIPE.from, WIPE.to);
  const lead = (y: number) => tapeLead(g, WIPE.from, WIPE.to, y);

  const rB05 = iris(g, IR.b05.from, IR.b05.to);
  const rB = iris(g, IR.shotB.from, IR.shotB.to);
  const rC = iris(g, IR.shotC.from, IR.shotC.to);
  const r09 = iris(g, IR.b09.from, IR.b09.to);
  const sA = shotA(g);
  const sB = shotB(g);
  const ti = TAGS.map(([f]) => f).filter((f) => g >= f).length - 1;
  const tag = TAGS[ti];
  const prevTag = ti > 0 ? TAGS[ti - 1][1] : undefined;
  const tagK = Math.min(1, (g - tag[0] + 1) / 7);
  const dock = tw(g, 792, 8);

  return (
    <AbsoluteFill style={{background: C.saffron}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <clipPath id="clipL"><polygon points={leftPoly} /></clipPath>
          <clipPath id="clipR"><polygon points={rightPoly} /></clipPath>
          <clipPath id="b04out"><path clipRule="evenodd" d={outside(IR.b05.cx, IR.b05.cy, rB05)} /></clipPath>
          <clipPath id="b05in"><path d={circle(IR.b05.cx, IR.b05.cy, Math.max(0.01, rB05))} /></clipPath>
          <clipPath id="aout"><path clipRule="evenodd" d={outside(W5.x, sA.wy, rB)} /></clipPath>
          <clipPath id="bin"><path d={circle(W5.x, sA.wy, Math.max(0.01, rB))} /></clipPath>
          <clipPath id="bout"><path clipRule="evenodd" d={outside(sB.cx, sB.cy, rC)} /></clipPath>
          <clipPath id="cin"><path d={circle(sB.cx, sB.cy, Math.max(0.01, rC))} /></clipPath>
          <clipPath id="b08out"><path clipRule="evenodd" d={outside(IR.b09.cx, IR.b09.cy, r09)} /></clipPath>
          <clipPath id="b09in"><path d={circle(IR.b09.cx, IR.b09.cy, Math.max(0.01, r09))} /></clipPath>
        </defs>
        <g transform={`translate(${W / 2} ${H / 2}) scale(${cam.zoom}) translate(${-cam.cx} ${-cam.cy})`}>
          <Wall g={g} layers={themeLayers()} />
          <CheckerBody g={g} st={st} />
          <Bench />
          {g < WIPE.to + 1 && <g clipPath={wiping ? 'url(#clipL)' : undefined}><B01World g={g} /></g>}
          {g >= WIPE.from && g < 262 && <g clipPath={wiping ? 'url(#clipR)' : undefined}><B02World g={g} /></g>}
          {g >= 240 && g < 312 && <B03World g={g} />}
          {g >= 309 && g < 504 && <g clipPath={g >= IR.b05.from ? 'url(#b04out)' : undefined}><B04World g={g} /></g>}
          {g >= 489 && g < 620 && (
            <g clipPath={g < IR.b05.to ? 'url(#b05in)' : undefined}>
              {g < 553 + 2 && <g clipPath={g >= IR.shotB.from ? 'url(#aout)' : undefined}><ShotA g={g} /></g>}
              {g >= IR.shotB.from && g < 581 + 2 && <g clipPath="url(#bin)"><g clipPath={g >= IR.shotC.from ? 'url(#bout)' : undefined}><ShotB g={g} /></g></g>}
              {g >= IR.shotC.from && g < 620 && <g clipPath="url(#cin)"><g opacity={1 - tw(g, 604, 10)}><ShotC g={g} /></g></g>}
            </g>
          )}
          {g >= 601 && g < 802 && <B06Card g={g} />}
          {g >= 603 && g < 960 && <B06Tray g={g} dock={dock} />}
          {g >= 603 && g < 792 && <B06Bench g={g} />}
          {g >= 705 && g < 800 && <B06Plates g={g} />}
          {g >= 792 && g < 960 && (
            <g clipPath={g >= IR.b09.from ? 'url(#b08out)' : undefined}>
              {g >= 893 && <B08Card g={g} />}
              <B07Tool g={g} />
            </g>
          )}
          {g >= IR.b09.from && <g clipPath="url(#b09in)"><B09World g={g} /></g>}
          <CheckerFront g={g} st={st} />
        </g>
        {/* HUD (screen space) */}
        {g < WIPE.to + 1 && <g clipPath={wiping ? 'url(#clipL)' : undefined}><B01Hud g={g} /></g>}
        {g >= WIPE.from && g < 252 && <g clipPath={wiping ? 'url(#clipR)' : undefined}><B02Hud g={g} /></g>}
        {g >= 309 && g < 495 && <B04Hud g={g} />}
        {g >= 520 && g < 609 && <B05Hud g={g} />}
        {g >= 609 && g < 710 && <B06Hud g={g} />}
        {g >= 800 && g < 892 && <B07Hud g={g} />}
        <Chip tag={tag[1]} prev={prevTag} k={tagK} />
        {captions && <Captions g={g} />}
        {wiping && (
          <polygon points={`${lead(0)},0 ${lead(0) + TAPE_BW},0 ${lead(H) + TAPE_BW},${H} ${lead(H)},${H}`} fill={C.blue} stroke={C.ink} strokeWidth={5} opacity={0.96} />
        )}
      </svg>
      {audio && <Audio src={staticFile('audio/final_mix.wav')} />}
    </AbsoluteFill>
  );
};
void OPEN_POSE; void B06Hud;
