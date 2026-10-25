// V2 (from V1 scenes/Springs.tsx): the springs now take up the load one after another (each tile's tendon has its own
// small slack, so the pull reaches them in turn), each overshoots a little and settles, until all share it evenly; the
// camera travels across the cutaway (clear of the hand) instead of holding.
// Shot L (535-681): "Special springs spread the load, so one little patch doesn't have to hold you up alone."
// The loaded left pad seen from his side (its back), square-on, in millimetres. His hand is on the grip bar and the
// foot strap hangs from the ring below. The back cover becomes a cutaway: behind it each of the 24 tiles is pulled by
// its own tendon through its own spring, anchored to the plate's rails. Pulled down by the strap, the rails move and
// every spring stretches about the same, so every tile carries about the same share; a tile that met the glass a
// little late (its tendon still slack) is taken up and ends up loaded like the rest. Then an explanatory comparison
// (not a failure): if one patch were all that held, its spring would have to stretch far and its contact would be
// strained; with the array, the same pull is shared and each spring barely moves.
// Simplification (noted in production/SOURCE_NOTES.md): the real pad routes tendons and nitinol springs inside the
// plate; the layout here (one coil per tile, in the gap below it) keeps their relationships, not their dimensions.
import React from 'react';
import {mix, shade} from '../dc/color';
import {INK, Inked} from '../dc/ink';
import {add, clamp, fmt, lerp, P, V} from '../dc/math';
import {Capsule, Lin, SoftShadow} from '../dc/shade';
import {Layer} from '../dc/camera';
import {Hand} from '../dc/Hand';
import {H_BAR} from '../world/rig';
import {keyN, ss} from '../world/climb';
import {camAt, inOut, kOf} from '../camera';
import {PLATE, WEB} from '../art/Pad';
import {HERO} from '../world/pose';

/** each tile's tendon slack (mm): the order in which the rising pull reaches the springs */
const slackOf = (c: number, r: number) => 0.4 + 6.5 * ((((Math.sin((c + 1) * 91.7 + (r + 1) * 37.3) * 43758.5453) % 1) + 1) % 1);
/** a spring's small overshoot after it is taken up (mm), decaying */
const ring = (t: number) => (t <= 0 ? 0 : 1.6 * Math.sin(t * 0.55) * Math.exp(-t * 0.12));

const COLS = 4, ROWS = 6, TILE = 25, GAP = 3.4, RIM = 7;
const PW = COLS * TILE + (COLS - 1) * GAP + 2 * RIM, PH = ROWS * TILE + (ROWS - 1) * GAP + 2 * RIM;
const tc = (c: number, r: number): V => ({x: -PW / 2 + RIM + c * (TILE + GAP) + TILE / 2, y: -PH / 2 + RIM + r * (TILE + GAP) + TILE / 2});
/** the late tile (its tendon slack at first) */
const LATE = {c: 0, r: 4};
/** the tile in the one-patch comparison */
const ONE = {c: 0, r: 2};

const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${fmt(x0 + r)},${fmt(y0)} H${fmt(x1 - r)} Q${fmt(x1)},${fmt(y0)} ${fmt(x1)},${fmt(y0 + r)} V${fmt(y1 - r)} Q${fmt(x1)},${fmt(y1)} ${fmt(x1 - r)},${fmt(y1)} H${fmt(x0 + r)} Q${fmt(x0)},${fmt(y1)} ${fmt(x0)},${fmt(y1 - r)} V${fmt(y0 + r)} Q${fmt(x0)},${fmt(y0)} ${fmt(x0 + r)},${fmt(y0)} Z`;

/** a coil spring from a (top) to b (bottom): n turns, the coils open as it stretches */
const coil = (a: V, b: V, n: number, w: number) => {
  const pts: V[] = [a, {x: a.x, y: a.y + 2}];
  const y0 = a.y + 2, y1 = b.y - 2;
  for (let i = 0; i <= n * 2; i++) {
    const t = i / (n * 2);
    pts.push({x: a.x + (i % 2 ? w : -w) * (i === 0 || i === n * 2 ? 0 : 1), y: lerp(y0, y1, t)});
  }
  pts.push(b);
  return `M${pts.map((p) => P(p)).join(' L')}`;
};

export const SpringScene2: React.FC<{id: string; f: number}> = ({id, f}) => {
  // ---- the story's parameters
  const open = ss(f, 543, 562) * (1 - ss(f, 656, 676)); // the cutaway
  const load = keyN(f, [[535, 0.1], [552, 0.1], [586, 1]]);
  const one = ss(f, 594, 606) * (1 - ss(f, 624, 640)); // the one-patch comparison
  const rail = 0.5 + 11.5 * load; // the rails' travel down (mm) when the array shares the pull: each spring's stretch
  const ALONE = 34; // the same pull on one spring alone (drawn compressed: 24 times the load reads as a long stretch)
  const travel = lerp(rail, ALONE, one); // the rails follow the spring that is doing the work
  // in as the cover opens, across the clear (left) half while the springs take up, back for the comparison, out
  const cam = camAt(f, [[535, 4, 30, 4.4], [556, -16, 4, 6.4, inOut], [588, -30, 30, 8.2, inOut], [600, -18, 6, 6.2, inOut], [640, -14, 10, 6.6, inOut], [681, 14, 40, 4.4, inOut]]);
  const k = kOf(cam.z);
  const tiles: React.ReactNode[] = [];
  const springs: React.ReactNode[] = [];
  const REST = 13; // a spring's unstretched length (mm)
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const t = tc(c, r);
      const isLate = c === LATE.c && r === LATE.r;
      const isOne = c === ONE.c && r === ONE.r;
      // the late tile met the glass a little late: its tendon has 5 mm of slack until the rails have moved that far
      const slack = isLate ? 7.6 : slackOf(c, r);
      const working = isOne ? 1 : 1 - one; // in the comparison, only one tendon is attached
      // the moment the rails' travel takes up this tendon's slack, and the spring's ring after it
      const tUp = 552 + (34 * Math.max(0, slack - 0.5)) / 11.5;
      const stretch = isOne ? travel : working * (Math.max(0, travel - slack) + ring(f - tUp) * (1 - one));
      const share = isOne ? clamp(lerp(stretch / 12, 1, one)) : clamp(stretch / 12) * (1 - one);
      const tabY = t.y - 7;
      const anchorY = t.y + TILE / 2 + GAP / 2 + 1 + travel;
      const springBot = {x: t.x, y: anchorY};
      const springTop = {x: t.x, y: anchorY - REST - stretch};
      const loose = Math.max(0, springTop.y - (tabY + 4)); // tendon length beyond its taut run: drawn as slack
      const strain = isOne ? one : 0;
      tiles.push(
        <g key={`t${r}-${c}`}>
          <path d={rr(t.x - TILE / 2, t.y - TILE / 2, t.x + TILE / 2, t.y + TILE / 2, 2.4)} fill={mix('#C9DCE0', '#43606B', 0.8 * share)} />
          {strain > 0.01 && <path d={`M${t.x - TILE / 2 + 2},${t.y + TILE / 2 - 1.6} H${t.x + TILE / 2 - 2}`} stroke="#EAF6F8" strokeWidth={3.2 * strain} opacity={0.95} />}
          <path d={rr(t.x - TILE / 2, t.y - TILE / 2, t.x + TILE / 2, t.y + TILE / 2, 2.4)} fill="none" stroke={INK} strokeWidth={0.7} opacity={0.65} />
        </g>,
      );
      springs.push(
        <g key={`s${r}-${c}`} opacity={isOne ? 1 : 1 - 0.55 * one}>
          {/* tendon from the tile's tab to the spring: straight when taut, a loose curve when slack */}
          <path d={loose > 0.6 ? `M${P({x: t.x, y: tabY})} Q${P({x: t.x + Math.min(6, loose * 0.8), y: (tabY + springTop.y) / 2})} ${P(springTop)}` : `M${P({x: t.x, y: tabY})} L${P(springTop)}`} stroke="#22282C" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <circle cx={t.x} cy={tabY} r={2.8} fill="#5A666E" stroke={INK} strokeWidth={0.6} />
          <path d={coil(springTop, springBot, 6, 4.4)} stroke="#262C30" strokeWidth={2.6} fill="none" strokeLinejoin="round" />
          <path d={coil(springTop, springBot, 6, 4.4)} stroke="#D3DBE0" strokeWidth={1.3} fill="none" strokeLinejoin="round" />
          <rect x={t.x - 5} y={springBot.y - 1.4} width={10} height={3.4} rx={1.2} fill="#46525A" />
        </g>,
      );
    }
  // the rails the springs anchor on (part of the plate): one under each tile row, moving down with the pull
  const rails = Array.from({length: ROWS}).map((_, r) => {
    const y = tc(0, r).y + TILE / 2 + GAP / 2 + 1 + travel;
    return <rect key={r} x={-PW / 2 + 3} y={y + 1.6} width={PW - 6} height={2.6} rx={1} fill="#6A767E" />;
  });
  const handW: V = {x: 46, y: 18};
  const sag = travel * 0.22; // the plate's shift down relative to the tiles (a few mm: the tiles stay inside its frame)
  return (
    <>
      <Layer cam={cam} depth={1.6}>
        {/* the glass behind the pad, and the hall beyond it, soft */}
        <Lin id={`${id}-bg`} d="M-900,-900 H900 V900 H-900 Z" from={{x: 0, y: -400}} to={{x: 0, y: 400}} stops={[[0, '#7F97A3'], [1, '#5E7482']]} />
        {[-260, -120, 180, 320].map((x, i) => (
          <rect key={i} x={x} y={-900} width={34} height={1800} fill="#3F5361" opacity={0.35} />
        ))}
        <rect x={-900} y={-900} width={1800} height={1800} fill="#BFE6EA" opacity={0.28} />
        <path d="M-300,-500 L-100,-700 L-40,-700 L-240,-500 Z" fill="#FFFFFF" opacity={0.12} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <SoftShadow id={`${id}-sh`} c={{x: 6, y: 8}} rx={PW * 0.62} ry={PH * 0.6} alpha={0.35} color="#1C2A33" />
        {/* the plate, handle, hand and strap move down with the rails (the tiles stay on the glass) */}
        <g transform={`translate(0 ${fmt(sag)})`}>
          <path d={`M0,${PH / 2 + 4} L6,${PH / 2 + 400}`} stroke={INK} strokeWidth={17} />
          <path d={`M0,${PH / 2 + 4} L6,${PH / 2 + 400}`} stroke={WEB} strokeWidth={14} />
          <ellipse cx={0} cy={PH / 2 + 4} rx={7} ry={5} fill="none" stroke={INK} strokeWidth={4} />
          <Inked w={2.2 * k}>
            <Lin id={`${id}-fr`} d={rr(-PW / 2, -PH / 2, PW / 2, PH / 2, 7)} from={{x: -PW / 2, y: -PH / 2}} to={{x: PW / 2, y: PH / 2}} stops={[[0, mix(PLATE, '#AAB8C2', 0.35)], [1, shade(PLATE, 0.3)]]} />
          </Inked>
          <path d={rr(-PW / 2 + 4, -PH / 2 + 4, PW / 2 - 4, PH / 2 - 4, 5)} fill="#2E3A41" opacity={open} />
        </g>
        {/* inside: the tiles (their backs, on the glass), the rails, tendons and springs */}
        <g opacity={open}>
          {tiles}
          {rails}
          {springs}
        </g>
        <g transform={`translate(0 ${fmt(sag)})`}>
          {/* the back cover: solid when closed, a cutaway (an outline) when open */}
          <g opacity={1 - open}>
            <path d={rr(-PW / 2 + 4, -PH / 2 + 4, PW / 2 - 4, PH / 2 - 4, 5)} fill={mix(PLATE, '#8C9BA6', 0.2)} />
            {Array.from({length: ROWS}).map((_, r) =>
              Array.from({length: COLS}).map((__, c) => {
                const t = tc(c, r);
                return <circle key={`${r}-${c}`} cx={t.x} cy={t.y} r={3.4} fill={shade(PLATE, 0.35)} />;
              }),
            )}
          </g>
          <path d={rr(-PW / 2 + 4, -PH / 2 + 4, PW / 2 - 4, PH / 2 - 4, 5)} fill="none" stroke="#DCE5EA" strokeWidth={1.2} strokeDasharray="4 3" opacity={open * 0.8} />
          {/* the handle: posts and the bar, the hand closed round it, the forearm from his side (lower right) */}
          <Inked w={2.2 * k}>
            <Capsule id={`${id}-p0`} a={{x: 0, y: -46}} b={{x: 0, y: -40}} ra={4.6} rb={4.6} color="#AEBBC5" spec={0.3} />
            <Capsule id={`${id}-p1`} a={{x: 0, y: 40}} b={{x: 0, y: 46}} ra={4.6} rb={4.6} color="#AEBBC5" spec={0.3} />
            <Capsule id={`${id}-bar`} a={{x: 0, y: -50}} b={{x: 0, y: 50}} ra={8.4} rb={8.4} color="#2C3338" spec={0.35} />
          </Inked>
          <Inked w={2.2 * k}>
            <Capsule id={`${id}-fa`} a={{x: 150, y: 120}} b={handW} ra={21} rb={16} color={HERO.skin} spec={0.2} />
            <Hand id={`${id}-h`} wrist={handW} ang={200} L={88} thumbSide={1} view="back" pose={H_BAR} color={HERO.skin} ink={2.4} bare />
          </Inked>
        </g>
      </Layer>
    </>
  );
};
