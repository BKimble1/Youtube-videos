// The engineering bench: a compact, warmer setting for the controlled tests, in the bay's units (6.2 per cm) and the
// same side-on staging. On the bench: a small vertical test stand whose carriage carries a specimen strip (smooth glass
// above, rough brick below) that slides up and down past a fixed pad position; a rotation stage holding a spare tile;
// a desk lamp. The same lead (dc/Man) works it from the right. The bench top is y = 0.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {Deco, INK, Inked, InkLine} from '../dc/ink';
import {add, clamp, fmt, P, V} from '../dc/math';
import {Capsule, Glow, Lin, SoftShadow} from '../dc/shade';
import {Cam, Layer} from '../dc/camera';
import {Man, ManPose} from '../dc/Man';
import {Expr} from '../dc/Head';
import {HandPose} from '../dc/Hand';
import {PadBar, PadBody, Ring} from '../art/Pad';
import {CM, PadState, prPad, ringOf} from '../world/geo';
import {HERO} from '../world/pose';
import {brickX} from './Micro';

export const BENCH = {
  standX: 0, // the specimen's face (x = 0, like the glass wall)
  glassT: 6 * CM,
  brickT: 8 * CM,
  strip0: -540, // top of the specimen strip at slide 0
  glassLen: 220,
  brickLen: 300,
  padY: -420, // the pad's test position (centre)
  cord: 210, // ring to the top of the test mass
};

const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${fmt(x0 + r)},${fmt(y0)} H${fmt(x1 - r)} Q${fmt(x1)},${fmt(y0)} ${fmt(x1)},${fmt(y0 + r)} V${fmt(y1 - r)} Q${fmt(x1)},${fmt(y1)} ${fmt(x1 - r)},${fmt(y1)} H${fmt(x0 + r)} Q${fmt(x0)},${fmt(y1)} ${fmt(x0)},${fmt(y1 - r)} V${fmt(y0 + r)} Q${fmt(x0)},${fmt(y0)} ${fmt(x0 + r)},${fmt(y0)} Z`;

/** the room behind the bench (parallax depth 2.2; laid out for what the bench cameras see at that depth): a warm
 *  pegboard wall with tools, a shelf, a small screen, and the lamp's pool of light */
export const BenchRoom: React.FC<{id: string}> = ({id}) => (
  <g>
    <Lin id={`${id}-w`} d="M-3000,-3000 H3000 V2500 H-3000 Z" from={{x: 0, y: -400}} to={{x: 0, y: 900}} stops={[[0, '#5B5049'], [0.6, '#7A6A5E'], [1, '#8E7D70']]} />
    <path d={rr(-420, -260, 1180, 640, 18)} fill="#B38E68" />
    <path d={rr(-420, -260, 1180, 640, 18)} fill="none" stroke="#6E5440" strokeWidth={10} />
    {Array.from({length: 16}).map((_, i) =>
      Array.from({length: 9}).map((__, j) => <circle key={`${i}-${j}`} cx={-370 + i * 100} cy={-210 + j * 100} r={8} fill="#7A5C42" opacity={0.7} />),
    )}
    {/* tools on the board */}
    <path d="M-300,-150 l36,0 l0,270 l-36,0 Z" fill="#5E6E78" />
    <path d="M-336,-170 h108 v36 h-108 Z" fill="#C0392B" opacity={0.85} />
    <path d="M-60,-100 a80,80 0 1 0 1,0 Z" fill="none" stroke="#3E4A52" strokeWidth={20} />
    <path d="M160,-170 l22,0 l0,330 l-22,0 Z M240,-170 l22,0 l0,290 l-22,0 Z M320,-170 l22,0 l0,260 l-22,0 Z" fill="#46535B" />
    <path d={rr(560, -200, 980, 110, 14)} fill="#2F3A40" />
    <path d={rr(586, -174, 954, 84, 8)} fill="#6FB8B0" opacity={0.6} />
    <path d="M610,-100 l80,-40 l70,60 l90,-80 l80,50" fill="none" stroke="#E8F6F4" strokeWidth={6} opacity={0.8} />
    {/* shelf above the board */}
    <path d="M-900,-420 H1500 V-390 H-900 Z" fill="#4A3E36" />
    {[[-760, '#C9A15E'], [-500, '#7E9AA6'], [-220, '#B5654A'], [380, '#8FA77A'], [700, '#C9A15E'], [1020, '#7E9AA6']].map(([x, c], i) => (
      <path key={i} d={rr(x as number, -600, (x as number) + 200, -420, 10)} fill={c as string} opacity={0.85} />
    ))}
    <Glow id={`${id}-lp`} c={{x: 200, y: 260}} r={900} color="#FFD9A0" alpha={0.3} />
  </g>
);

/** the desk lamp at the back of the bench, its warm head over the test stand */
export const Lamp: React.FC<{id: string; k: number}> = ({id, k}) => (
  <g>
    <Glow id={`${id}-pool`} c={{x: -40, y: -380}} r={420} color="#FFD49A" alpha={0.28} />
    <Inked w={3 * k}>
      <Lin id={`${id}-b`} d={`M-700,-16 H-580 V0 H-700 Z`} from={{x: 0, y: -16}} to={{x: 0, y: 0}} stops={[[0, '#4C5861'], [1, '#2C343A']]} />
      <Capsule id={`${id}-a1`} a={{x: -640, y: -14}} b={{x: -600, y: -640}} ra={5} rb={5} color="#3E4A52" spec={0.3} />
      <Capsule id={`${id}-a2`} a={{x: -600, y: -640}} b={{x: -130, y: -820}} ra={5} rb={5} color="#3E4A52" spec={0.3} />
      <path d="M-160,-850 L-60,-800 L-90,-740 L-190,-790 Z" fill="#C0392B" />
    </Inked>
    <ellipse cx={-76} cy={-772} rx={22} ry={8} transform="rotate(25 -76 -772)" fill="#FFE8B8" />
  </g>
);

/** the bench itself: a thick laminated top with a light edge, a steel frame below */
export const BenchTop: React.FC<{id: string; k: number}> = ({id, k}) => (
  <g>
    <Inked w={4 * k}>
      <Lin id={`${id}-tp`} d="M-3000,0 H3000 V46 H-3000 Z" from={{x: 0, y: 0}} to={{x: 0, y: 46}} stops={[[0, '#D9B98E'], [0.3, '#C49A6C'], [1, '#8C6A48']]} />
      <Lin id={`${id}-fr`} d="M-3000,46 H3000 V2000 H-3000 Z" from={{x: 0, y: 46}} to={{x: 0, y: 900}} stops={[[0, '#3D4A52'], [1, '#2A343A']]} />
    </Inked>
    <Deco>
      <path d="M-3000,3 H3000" stroke="#FFF1DA" strokeWidth={fmt(3 * k)} opacity={0.6} />
      {[-1500, -500, 500, 1500].map((x) => (
        <path key={x} d={rr(x - 380, 110, x + 380, 600, 16)} fill="none" stroke="#1E272C" strokeWidth={fmt(6 * k)} />
      ))}
    </Deco>
  </g>
);

/** the test stand: base, upright column, and the sliding carriage with its specimen strip (glass over brick).
 *  `slide` moves the carriage up (negative) or down. */
export const TestStand: React.FC<{id: string; k: number; slide: number}> = ({id, k, slide}) => {
  const g0 = BENCH.strip0 + slide, g1 = g0 + BENCH.glassLen, b1 = g1 + BENCH.brickLen;
  const T = BENCH.brickT;
  // the brick's rough face, at a visible scale (the same jagged profile family as the micro view, coarser)
  const pts: V[] = [];
  for (let y = g1 + 4; y <= b1 - 4; y += 4) pts.push({x: BENCH.standX + brickX(y * 9) * 0.06 + 1.5, y});
  return (
    <g>
      {/* column behind the strip, and its base on the bench */}
      <Inked w={3.2 * k}>
        <Lin id={`${id}-col`} d={`M${-T - 46},-900 H${-T - 10} V0 H${-T - 46} Z`} from={{x: -T - 46, y: 0}} to={{x: -T - 10, y: 0}} stops={[[0, '#C9D3DA'], [0.5, '#9EADB8'], [1, '#6F7E89']]} />
        <Lin id={`${id}-base`} d={`M${-T - 170},-24 H${60} V0 H${-T - 170} Z`} from={{x: 0, y: -24}} to={{x: 0, y: 0}} stops={[[0, '#7D8B95'], [1, '#4C5861']]} />
      </Inked>
      <Deco>
        {[-820, -600, -380, -160].map((y) => (
          <path key={y} d={`M${-T - 60},${y} H${-T - 20}`} stroke="#5E6B74" strokeWidth={fmt(2 * k)} />
        ))}
      </Deco>
      {/* carriage frame */}
      <Inked w={3.2 * k}>
        <Lin id={`${id}-car`} d={`M${-T - 16},${g0 - 26} H${-T + 4} V${b1 + 26} H${-T - 16} Z`} from={{x: 0, y: g0}} to={{x: 0, y: b1}} stops={[[0, '#E2E8EC'], [1, '#9AA8B2']]} />
      </Inked>
      {/* glass segment: a slab in section, its lit face toward the pad */}
      <Lin id={`${id}-gl`} d={`M${-BENCH.glassT},${g0} H0 V${g1} H${-BENCH.glassT} Z`} from={{x: -BENCH.glassT, y: 0}} to={{x: 0, y: 0}} stops={[[0, '#7FC7BE', 0.85], [0.5, '#D6F2F0', 0.55], [1, '#8DD0C7', 0.85]]} />
      <path d={`M0,${g0} V${g1} M${-BENCH.glassT},${g0} V${g1}`} stroke="#1F4A50" strokeWidth={fmt(2.2 * k)} />
      <path d={`M${-2.6 * k},${g0} V${g1}`} stroke="#FFFFFF" strokeWidth={fmt(2.2 * k)} opacity={0.8} />
      {/* brick segment: red-brown, a fired texture, its rough face */}
      <Inked w={3.2 * k}>
        <path d={`M${-T},${g1} L${pts.map((p) => P(p)).join(' L')} L${-T},${b1} Z`} fill="#A4573E" />
      </Inked>
      <Deco>
        {Array.from({length: 26}).map((_, i) => (
          <circle key={i} cx={fmt(-T + 4 + ((i * 37) % (T - 6)))} cy={fmt(g1 + 10 + ((i * 113) % (BENCH.brickLen - 20)))} r={fmt(1.4 + (i % 3))} fill={i % 2 ? '#C77A5C' : '#6E3424'} opacity={0.55} />
        ))}
        <path d={`M${-T},${g1} H2`} stroke={INK} strokeWidth={fmt(2 * k)} />
      </Deco>
    </g>
  );
};

/** a spare tile on a small rotation stage: `turn` 0 shows its back (the tendon's tab), 1 its patterned face */
export const TileStage: React.FC<{id: string; k: number; c: V; turn: number; detail: number}> = ({id, k, c, turn, detail}) => {
  const a = turn * Math.PI;
  const w = 2.5 * CM, h = 2.5 * CM;
  const sx = Math.cos(a); // +1 back toward us, -1 face toward us
  const showFace = sx < 0;
  const hw = (w / 2) * Math.abs(sx) + 0.4;
  return (
    <g>
      {/* stage: a turned disc on a post */}
      <Inked w={3 * k}>
        <Capsule id={`${id}-post`} a={{x: c.x, y: c.y + h / 2 + 6}} b={{x: c.x, y: -30}} ra={3.2} rb={3.2} color="#9AA9B4" spec={0.3} />
        <Lin id={`${id}-disc`} d={`M${c.x - 34},-30 H${c.x + 34} V-14 H${c.x - 34} Z`} from={{x: 0, y: -30}} to={{x: 0, y: -14}} stops={[[0, '#D3DBE0'], [1, '#6F7E89']]} />
        <Lin id={`${id}-foot`} d={`M${c.x - 46},-14 H${c.x + 46} V0 H${c.x - 46} Z`} from={{x: 0, y: -14}} to={{x: 0, y: 0}} stops={[[0, '#4C5861'], [1, '#2C343A']]} />
      </Inked>
      {/* the tile: a thin silicone square on its backing film, foreshortened as it turns */}
      <Inked w={2.6 * k}>
        <path d={rr(c.x - hw, c.y - h / 2, c.x + hw, c.y + h / 2, Math.min(2, hw))} fill={showFace ? mix('#D5E6EA', '#FFFFFF', 0.1) : '#B9C9CF'} />
      </Inked>
      <Deco>
        {showFace
          ? Array.from({length: 18}).map((_, i) => (
              <path key={i} d={`M${fmt(c.x - hw + 0.6)},${fmt(c.y - h / 2 + 1 + i * ((h - 2) / 17))} H${fmt(c.x + hw - 0.6)}`} stroke="#7E9BA4" strokeWidth={0.22} opacity={0.4 + 0.5 * detail} />
            ))
          : <circle cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(1.6 * Math.abs(sx) + 0.3)} fill="#5E6B74" />}
        <path d={`M${fmt(c.x - hw + 0.6)},${fmt(c.y - h / 2 + 2)} L${fmt(c.x - hw + 0.6 + hw * 0.5)},${fmt(c.y - h / 2 + 0.8)}`} stroke="#FFFFFF" strokeWidth={0.5} opacity={0.6} />
      </Deco>
      {/* clamp jaws at the tile's lower edge */}
      <Inked w={2.4 * k}>
        <path d={`M${c.x - 5},${c.y + h / 2 - 1} H${c.x + 5} V${c.y + h / 2 + 7} H${c.x - 5} Z`} fill="#6F7E89" />
      </Inked>
    </g>
  );
};

/** a slotted test mass on a cord from the pad's ring */
export const Weight: React.FC<{id: string; k: number; ring: V; drop: number; swing: number}> = ({id, k, ring, drop, swing}) => {
  // the mass hangs a cord's length below the ring until it comes to rest on the bench top; the cord then goes slack
  const hang = add(ring, {x: swing * 0.3, y: BENCH.cord + drop});
  const top = {x: hang.x, y: Math.min(hang.y, -66)};
  const slack = hang.y - top.y;
  const mid = {x: (ring.x + top.x) / 2 + slack * 0.5, y: (ring.y + top.y) / 2 + slack * 0.2};
  return (
    <g>
      <path d={`M${P(ring)} Q${P(mid)} ${P(top)}`} fill="none" stroke="#2E2A26" strokeWidth={fmt(2.4 * k)} />
      <Inked w={3 * k}>
        <Lin id={`${id}-m`} d={rr(top.x - 26, top.y, top.x + 26, top.y + 64, 6)} from={{x: top.x - 26, y: 0}} to={{x: top.x + 26, y: 0}} stops={[[0, '#E8C46E'], [0.45, '#C99A3E'], [1, '#8C6624']]} />
      </Inked>
      <Deco>
        <path d={`M${top.x - 26},${top.y + 22} H${top.x + 26} M${top.x - 26},${top.y + 42} H${top.x + 26}`} stroke="#7A5820" strokeWidth={fmt(1.6 * k)} />
      </Deco>
    </g>
  );
};

export type BenchState = {
  slide: number;
  pad: PadState | null; // null: the pad is off the stand
  hand: {pose: ManPose; on: boolean; expr: Expr; lHand: HandPose; rHand: HandPose} | null;
  tileTurn: number;
  tileDetail: number;
  weight: {drop: number; swing: number} | null;
};

export const TILE_STAGE: V = {x: -360, y: -150};

export const BenchWorld: React.FC<{id: string; st: BenchState; cam: Cam; k: number; nest?: React.ReactNode; obl?: number}> = ({id, st, cam, k, nest, obl = 1.9}) => {
  const pad = st.pad ? {...st.pad, obl} : null;
  const ring = pad ? prPad(ringOf(pad)) : null;
  return (
    <>
      <Layer cam={cam} depth={2.2} opacity={cam.z < 400 ? 1 : 0}>
        <BenchRoom id={`${id}-room`} />
      </Layer>
      <Layer cam={cam} depth={1}>
        {/* he stands behind the bench: drawn first, the bench hides his legs */}
        {st.hand && <Man id={`${id}-man`} pose={st.hand.pose} expr={st.hand.expr} lHand={st.hand.lHand} rHand={st.hand.rHand} outfit={HERO} />}
        <Lamp id={`${id}-lamp`} k={k} />
        <BenchTop id={`${id}-bt`} k={k} />
        <SoftShadow id={`${id}-sh`} c={{x: -60, y: 4}} rx={220} ry={12} alpha={0.35} color="#3A2A1E" />
        <TestStand id={`${id}-ts`} k={k} slide={st.slide} />
        <TileStage id={`${id}-tile`} k={k} c={TILE_STAGE} turn={st.tileTurn} detail={st.tileDetail} />
        {pad && ring && (
          <>
            <PadBody id={`${id}-pad`} s={pad} k={k} bar={!st.hand?.on} />
            <Ring c={ring} k={k} />
            {st.weight && <Weight id={`${id}-w`} k={k} ring={ring} drop={st.weight.drop} swing={st.weight.swing} />}
          </>
        )}
        {st.hand && (
          <>
            {st.hand.on && pad && (
              <Man id={`${id}-hl`} pose={st.hand.pose} expr={st.hand.expr} lHand={st.hand.lHand} rHand={st.hand.rHand} outfit={HERO} handsOnly handsOnlySide="L" holdL={{front: [0, 1, 2, 3], obj: <PadBar id={`${id}-bar`} s={pad} k={k} />}} />
            )}
          </>
        )}
        {nest}
      </Layer>
    </>
  );
};
export {clamp, lit, shade, InkLine};
