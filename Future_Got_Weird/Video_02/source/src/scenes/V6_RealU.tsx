import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg} from '../lib/timeline';
import {E, tw} from '../lib/motion';
import {PLINTH} from '../lib/shots';
import {EVIDENCE, EvidenceCard, evidenceIconSlot} from '../components/v2k/EvidenceCard';
import {Label, SubLabel} from '../components/v2k/Labels';
import {ZoneBox} from '../components/v02/S3_ZoneBox';
import {N_POS, UFront} from '../components/v02/S7_Plots';
import {V6Raster, v6RasterGeom} from '../components/v2s/V6_Raster';
import {ScrollRoll} from '../components/v02/S5_Board';
import {Pointer, TapRing, pointerAt} from '../components/v2s/V5_Parts';

/**
 * V6 · The real U (n13, s37). Record R10, claims C33, C35 (C18 for the method). Adapted from v1 S7.2 (S7_Plots
 * RasterPanel + UFront), moved here from v1 5:06.
 *
 *  V6.1 n13   The hard, visible switch from our plan: a new evidence board (kit EvidenceCard, white card, ink outline,
 *             tape, hard shadow), headline "Real data" (64), the same 3×3 zone icon as V4's waveform board (S3_ZoneBox;
 *             its centre-zone mark is off here, because the U uses all nine zones), "same 3×3 sensor" (48), an empty 6×6
 *             grid of the preset sensor positions and an empty front-view frame. Source line from the cut (34):
 *             "authors' released data and code, run by us". No characters, no plan, no person token.
 *  V6.2 s37   The zone box steps through the 36 preset positions (the authors' 6×6 back-and-forth raster, hard-coded in
 *             their script) while the front view shows the real partial sums: one image per position, k = 1 → 36, no
 *             in-between frames (each image holds 5 → 2 frames, never fewer than 2), ending on the authors' full result
 *             (our k = 36 equals their volume exactly). Display as the authors' plot: per-image scaling, gamma 3, x
 *             inverted (UFront). "36 preset positions · object held still" (48); "rough outline" (48) under the U. In
 *             the hold the checker's pointer (her arm and prop only) taps the U's base.
 *  Out        The board rolls up from the bottom into a paper scroll while the paper behind it turns to the museum
 *             wall's colour; the last 6 frames hold ScrollRoll at cx 960, cy 430, len 560, r 46 (spin 0, sw 4, sx = sy = 1,
 *             screen px) on PLINTH.wall: V7 opens on the identical scroll and drops it onto the first ledge.
 *
 * Never morphed from our arcs, never in our room's coordinates, never beside the kit sensor.
 */

/* ------------------------------------------------------------------ cues */

const K = {
  start: scene('V6').from,
  end: scene('V6').to,
  real: at('n13', 'real'),
  s37: seg('s37').from,
  moved: at('s37', 'moved'),
  positions: at('s37', 'positions'),
  rough: at('s37', 'rough'),
  hidden: at('s37', 'hidden'),
  uEnd: at('s37', 'u', 1, 'end'),
};

/** the V6 → V7 roll-up contract: the scroll's last 6 frames */
export const V6_SCROLL = {cx: 960, cy: 430, len: 560, r: 46, spin: 0, sw: 4, holdFrames: 6};

/* ------------------------------------------------------------------ the build-up (one image per preset position) */

const BUILD0 = K.moved + 2;
const BUILD1 = Math.max(BUILD0 + 90, K.rough - 4); // k = 36 from here on
/** start frame of image k (1..36): durations fall linearly from D0 to D1 frames (the first positions read longest) */
const KSTART: number[] = (() => {
  const n = N_POS - 1; // intervals k = 1..35
  const total = BUILD1 - BUILD0;
  const d1 = 2;
  const d0 = (2 * total) / n - d1;
  const out = [BUILD0];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += d0 + ((d1 - d0) * i) / (n - 1);
    out.push(BUILD0 + Math.round(acc));
  }
  return out;
})();
for (let i = 1; i < KSTART.length; i++) {
  if (KSTART[i] - KSTART[i - 1] < 2) throw new Error(`V6: image k=${i} shows for ${KSTART[i] - KSTART[i - 1]} frame(s) (needs 2)`);
}
if (KSTART[KSTART.length - 1] !== BUILD1) throw new Error('V6: the build does not end on k = 36 at BUILD1');
/** image k at frame g (0 = none yet) */
const kAt = (g: number) => {
  let k = 0;
  for (let i = 0; i < KSTART.length; i++) if (g >= KSTART[i]) k = i + 1;
  return k;
};

// labels
const LBL_SENSOR = K.real - 2;
const LBL_PRESET = Math.max(BUILD0 + 6, K.positions - 6);
const LBL_ROUGH = K.rough;

// the hold: the checker's pointer taps the U's base
const ROLL_DUR = 20;
const ROLL_END = K.end - V6_SCROLL.holdFrames; // the scroll is complete and still from here to the cut
const ROLL0 = ROLL_END - ROLL_DUR;
const TAP_U = Math.min(Math.max(BUILD1 + 18, K.hidden - 8), ROLL0 - 24);
if (TAP_U < BUILD1 + 12) throw new Error(`V6: the pointer taps ${TAP_U - BUILD1} frames after the U completes (needs 12)`);

/* ------------------------------------------------------------------ layout (screen px, inside EVIDENCE.content) */

const ICON = evidenceIconSlot('Real data');
const UCELL = 15;
const U_BOX = {x: 1150, y: 196, size: 40 * UCELL}; // the 40×40 front view: x 1150–1750, y 196–796
const RAS_W = 780;
const RAS_BOX = 82;
const RAS = {x: 160, y: 250, w: RAS_W, h: v6RasterGeom(RAS_W, RAS_BOX).height};
/** the U's base (cells: rows ~12–16, displayed columns ~12–32 of the authors' final view): the tip touches its underside */
const U_BASE = {x: U_BOX.x + 22.5 * UCELL, y: U_BOX.y + 27.2 * UCELL};
const POINTER_DIR = {x: 0.88, y: 0.47};

/* ------------------------------------------------------------------ the roll-up into a scroll */

const CARD = EVIDENCE.card;
const CARD_W = CARD.x1 - CARD.x0; // 1760
const S_END = V6_SCROLL.len / CARD_W; // the board shrinks to the scroll's length
const R_END = V6_SCROLL.r / S_END; // final roll radius, board px
const R0 = 14;
const Y_TOP = CARD.y0;
const Y_BOT = CARD.y1;
/** pivot (screen y) of the shrink: chosen so the finished roll (centre y = Y_TOP + R_END, board px) lands on cy 430 */
const PIVOT_Y = (V6_SCROLL.cy - (Y_TOP + R_END) * S_END) / (1 - S_END);
const ROLL_C0 = Y_BOT - R0;
const ROLL_C1 = Y_TOP + R_END;
const TH = (Math.PI * (R_END * R_END - R0 * R0)) / (ROLL_C0 - ROLL_C1);
const rollAt = (g: number) => {
  const p = E.inOut(tw(g, ROLL0, ROLL_DUR, E.linear));
  const s = 1 + (S_END - 1) * E.inOut(tw(g, ROLL0 + 2, ROLL_DUR - 2, E.linear));
  const yc = ROLL_C0 + (ROLL_C1 - ROLL_C0) * p; // roll centre, board px
  const r = Math.sqrt(R0 * R0 + ((ROLL_C0 - yc) * TH) / Math.PI);
  return {p, s, yc, r};
};
{
  const f = rollAt(ROLL_END);
  const cy = PIVOT_Y + (f.yc - PIVOT_Y) * f.s;
  if (Math.abs(cy - V6_SCROLL.cy) > 1e-6 || Math.abs(f.r * f.s - V6_SCROLL.r) > 1e-6 || Math.abs(CARD_W * f.s - V6_SCROLL.len) > 1e-6) throw new Error(`V6: the finished scroll is at cy ${cy}, r ${f.r * f.s}, len ${CARD_W * f.s}`);
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerpHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp01(t)).toString(16).padStart(2, '0')).join('');
};

/* ------------------------------------------------------------------ the board */

const Board: React.FC<{g: number}> = ({g}) => {
  const k = kAt(g);
  const done = k;
  // the box sits on position 1 until the build starts, then on the position whose image is showing (it fires there)
  const pos = Math.max(1, k);
  const sinceStep = k > 0 ? g - KSTART[k - 1] : 99;
  const fire = k > 0 && k < N_POS ? clamp01(1 - sinceStep / 3) : k === N_POS ? 1 - tw(g, BUILD1, 10, E.linear) : 0;
  return (
    <EvidenceCard
      background={false}
      icon={<ZoneBox x={0} y={0} size={96} listening={0.15} centre={0} />}
      source="authors' released data and code, run by us"
    >
      {/* panel captions (34 px) */}
      <Label x={RAS.x + 20} y={RAS.y - 32} size={34} color={C.inkSoft} halo={false}>
        sensor positions (preset)
      </Label>
      <Label x={U_BOX.x} y={U_BOX.y - 22} size={34} color={C.inkSoft} halo={false}>
        hidden object, rebuilt · front view
      </Label>
      {/* the 6×6 raster and the zone box */}
      <div style={{position: 'absolute', left: RAS.x, top: RAS.y}}>
        <V6Raster width={RAS.w} pos={pos} done={done} firing={fire} boxSize={RAS_BOX} />
      </div>
      <div style={{position: 'absolute', left: RAS.x + 20, top: RAS.y + RAS.h + 8, fontFamily: F.mono, fontWeight: 600, fontSize: 34, color: C.inkSoft, whiteSpace: 'pre'}}>
        {`positions used: ${String(done).padStart(2, ' ')} / ${N_POS}`}
      </div>
      {/* the front view: real partial sums, one image per position */}
      <div style={{position: 'absolute', left: U_BOX.x, top: U_BOX.y}}>
        <UFront cell={UCELL} k={k} t={1} />
      </div>
    </EvidenceCard>
  );
};

/* ------------------------------------------------------------------ the scene */

export const V6RealU: React.FC = () => {
  const g = useG();
  const roll = rollAt(g);
  const rolling = g >= ROLL0;
  const done = g >= ROLL_END;
  // the paper round the board turns to the museum wall's colour as the roll starts
  const wallT = tw(g, ROLL0, 8, E.linear);
  const bg = lerpHex(C.paper, PLINTH.wall, wallT);
  const ptr = pointerAt(g, {target: U_BASE, dir: POINTER_DIR, hit: TAP_U, travel: 900, inDur: 16, hold: 10, outDur: 12});

  if (done) {
    // the hand-off frames: the finished scroll, still, on the museum wall's colour (V7's first frame matches)
    return (
      <AbsoluteFill style={{background: PLINTH.wall}}>
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <ScrollRoll cx={V6_SCROLL.cx} cy={V6_SCROLL.cy} len={V6_SCROLL.len} r={V6_SCROLL.r} spin={V6_SCROLL.spin} sw={V6_SCROLL.sw} />
        </svg>
      </AbsoluteFill>
    );
  }

  const s = roll.s;
  const flatBottom = rolling ? roll.yc : 1080; // the flat board shows above the roll's centre line (board px)
  const scrollScreen = {cx: 960, cy: PIVOT_Y + (roll.yc - PIVOT_Y) * s, len: CARD_W * s, r: roll.r * s};
  return (
    <AbsoluteFill style={{background: bg}}>
      <AbsoluteFill style={{transform: `translate(0px, ${(PIVOT_Y * (1 - s)).toFixed(3)}px) scale(${s.toFixed(5)})`, transformOrigin: '960px 0px'}}>
        <AbsoluteFill style={{clipPath: rolling ? `inset(0 0 ${Math.max(0, 1080 - flatBottom).toFixed(2)}px 0)` : undefined}}>
          <Board g={g} />
          {/* labels (on the board: they roll up with it) */}
          <SubLabel x={ICON.x + 74} y={EVIDENCE.headline.baseline - 4} opacity={tw(g, LBL_SENSOR, 6, E.linear)}>
            same 3×3 sensor
          </SubLabel>
          <SubLabel x={RAS.x + 20} y={RAS.y + RAS.h + 112} opacity={tw(g, LBL_PRESET, 6, E.linear)}>
            36 preset positions · object held still
          </SubLabel>
          <SubLabel x={U_BOX.x + U_BOX.size / 2} y={U_BOX.y + U_BOX.size + 60} anchor="middle" opacity={tw(g, LBL_ROUGH, 6, E.linear)}>
            rough outline
          </SubLabel>
          <Pointer pose={ptr} />
          <TapRing x={U_BASE.x} y={U_BASE.y} t={tw(g, TAP_U, 12, E.linear)} r={40} color={C.coralDeep} />
        </AbsoluteFill>
      </AbsoluteFill>
      {rolling && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <ScrollRoll cx={scrollScreen.cx} cy={scrollScreen.cy} len={scrollScreen.len} r={scrollScreen.r} spin={6 * (1 - roll.p)} sw={4} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ sound cue sheet */

export const SFX: Sfx[] = [
  // a beat of near-silence on the switch, and no activity sound under the build: the music carries the lift (shot
  // plan V6 sound); a very low room tone from the line on
  {f: K.s37, kind: 'amb_room', gain: -9, dur: (K.end - K.s37) / 30, note: 'very low tone under the real-data board'},
  {f: TAP_U, kind: 'pencil_tap', gain: -3, note: "the checker's pointer taps the U's base"},
  {f: ROLL0, kind: 'paper_lift', gain: -3, note: 'the board rolls up into a scroll'},
];
