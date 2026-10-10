import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg} from '../lib/timeline';
import {E, tw} from '../lib/motion';
import {ArrivalTimeline, TL_GEOM} from '../components/v2k/ArrivalTimeline';
import {EVIDENCE, EvidenceCard, evidenceIconSlot} from '../components/v2k/EvidenceCard';
import {fontShorthand} from '../components/v2k/util';
import {textWidth} from '../lib/measure';
import {SubLabel, TeachLabel} from '../components/v2k/Labels';
import {ZoneBox} from '../components/v02/S3_ZoneBox';
import {SURVIVES} from '../components/v2s/V3_Parts';
import {BUMP, ECHO, EchoPlot, LENS, PUSH_TARGET, RING_R, SPIKE, X, d1, pushed} from '../components/v2s/V4_EchoBoard';
import {ROUTE_ICON, RouteIcon, ScreenPointer, TapRing, pointerAt} from '../components/v2s/V4_Parts';

/**
 * V4 · Later, weaker, and real (s14, s15, s16). v2/SHOTPLAN_V2.md V4.1–V4.3.
 *
 *  V4.1 s14  Opens on V3's last frame (V3_Parts TimelineHandoff: the kit ArrivalTimeline full frame, the one tick,
 *            "what survives: timing"); the label fades, the five-icon route strip draws above the axis (sensor, wall,
 *            him, wall, sensor). One pulse runs the strip and thins at each bounce. On "once" it is at the wall icon and
 *            the tall teal spike lands, "1 bounce" (64); it runs on, smaller, to him, back to the wall and home, where
 *            the tiny saffron bump lands late (the tick from V3 gives way to it), "3 bounces" (64); the chip becomes
 *            "not to scale · far weaker" (34); the bump is ringed on "tiny". No dot tally, no counts.
 *  V4.2 s15  Hard switch on "This is real data": the kit EvidenceCard (headline "Real data", the 3×3 zone icon) with the
 *            authors' raw counts, centre zone (V4_EchoBoard) drawn complete on the first frame; the source line on "same
 *            team" (34): "authors' released raw counts · centre zone"; on "different sensor" the tag "different sensor:
 *            3×3 zones" (48) cuts in beside the zone icon (where V6 later puts "same 3×3 sensor") and brightens once while
 *            the icon's nine zones light (v2 review r1, V2-R1-14: the condition was a 34 px clause of the source line);
 *            the icon's centre zone marks on "sensor". "wall echo" (48) on "the wall's", a pulse on its peak on "big
 *            echo". On "later" a bar magnifier appears beside the spike and travels along the tail, arriving as "zoom" is
 *            said; on "zoom" its factor animates ×1 → ×250, fast at first, so the bump stands up within about 5 frames of
 *            the word (V2-R1-16: it used to wait at ×1 for 1.5 s and start 10 frames late); "hundreds of times weaker
 *            (this capture)" (48). No printed ratio; the blip before the spike is not annotated.
 *  V4.3 s16  Push toward the bump (the plot scales inside the card; headline, icon and source stay): the bump lands
 *            ringed (ink ring, r 90, 6 px) centred on (960, 520); the checker's arm comes in from the right and her
 *            pointer taps the ring; on "timing" a dimension line spike → bump, "≈ 3.7 ns later" (48), and "wall echo"
 *            fades as it draws (its peak dot stays; V2-R1-23: four labels and the icon at once); on "farther" a
 *            small generic route icon (sensor → wall → hidden object → wall → sensor) and "≈ 1.1 m extra, there and back"
 *            (48). The last frame: the ring at (960, 520), the V4 → V5 graphic match.
 */

/* ================================================================== cues */

const SC = scene('V4');
const K = {
  start: SC.from,
  end: SC.to,
  // s14
  nearly: at('s14', 'nearly'),
  back14: at('s14', 'back'),
  once: at('s14', 'once'),
  three: at('s14', 'three'),
  times: at('s14', 'times'),
  so14: at('s14', 'so'),
  its: at('s14', "it's"),
  tiny: at('s14', 'tiny'),
  // s15
  this15: at('s15', 'this'),
  same: at('s15', 'same'),
  different: at('s15', 'different'),
  sensor15: at('s15', 'sensor'),
  walls: at('s15', "wall's"),
  big: at('s15', 'big'),
  then: at('s15', 'then'),
  later: at('s15', 'later'),
  bump15: at('s15', 'bump'),
  zoom: at('s15', 'zoom'),
  seeEnd: at('s15', 'see', 1, 'end'),
  hundreds: at('s15', 'hundreds'),
  // s16
  s16: seg('s16').from,
  bump16: at('s16', 'bump'),
  clue: at('s16', 'clue'),
  timing: at('s16', 'timing'),
  farther: at('s16', 'farther'),
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const f2 = (n: number) => Math.round(n * 100) / 100;

/* ================================================================== beats */

// V4.1 the shared timeline
const LABEL_OUT = K.start;
const STRIP0 = Math.max(K.start + 6, K.nearly - 2);
const STRIP_DUR = 26;
const P_WALL = Math.max(STRIP0 + STRIP_DUR + 6, K.once); // the pulse reaches the wall icon: the spike lands
const P_FIRE = Math.max(STRIP0 + STRIP_DUR - 8, P_WALL - 22);
const SPIKE_LABEL = P_WALL + 6;
const P_HOME = Math.max(P_WALL + 54, K.times); // the thinned pulse is home: the bump lands
const P_HIM = P_WALL + (P_HOME - P_WALL) / 3;
const P_WALL2 = P_WALL + (2 * (P_HOME - P_WALL)) / 3;
const BUMP_LABEL = Math.max(P_HOME + 4, K.times + 4);
const CHIP_SWAP = Math.max(P_HOME + 8, K.so14);
const CUT = K.this15; // hard switch to the real data
const RING1 = Math.max(BUMP_LABEL + 8, K.its);
const RING1_DUR = clamp(CUT - 4 - RING1, 8, 14);
if (RING1 + RING1_DUR > CUT - 2) throw new Error('V4: the ring on "tiny" is not drawn before the switch');
/** routePulse 0..1 over the strip's four legs: leg 1 to the wall by P_WALL, the other three (thinner) by P_HOME. */
const routePulse = (g: number) => {
  if (g < P_FIRE) return 0;
  if (g < P_WALL) return 0.25 * ((g - P_FIRE) / (P_WALL - P_FIRE));
  if (g < P_HOME) return 0.25 + 0.75 * ((g - P_WALL) / (P_HOME - P_WALL));
  return 1;
};

// V4.2 the real waveform
const SOURCE_T = K.same;
const ZONE_T = K.sensor15 - 2;
/** "a different sensor": the icon's nine zones light up on "different" (its 3×3 grid is the difference), then settle
 *  back as "the wall's big echo" takes over (director fix: the 4.4 s from the cut to "wall echo" had no visible beat
 *  besides the 34 px source line). */
const ZONE_LISTEN = (g: number) => 0.15 + 0.85 * tw(g, K.different - 2, 8, E.inOut) * (1 - 0.8 * tw(g, K.walls - 12, 12, E.inOut));
const SPIKE_LAB = K.walls - 2;
const SPIKE_PULSE = Math.max(SPIKE_LAB + 10, K.big);
/** V2-R1-16: the ×1 → ×250 animation starts ON "zoom" (where the music's lift lands); the magnifier comes in on "later"
 *  (about 1.5 s before) and slides along the tail without stopping until just before it, so there is no wait at ×1. */
const ZOOM0 = K.zoom;
const LENS_IN = Math.max(K.later, SPIKE_PULSE + 16);
const LENS_SLIDE0 = LENS_IN + 8;
const LENS_SLIDE1 = ZOOM0 - 2;
const ZOOM1 = ZOOM0 + 22;
/** The factor's curve (log-space progress): quick at first, so the bump is up about 5 frames after "zoom", then it settles
 *  on ×250 well inside "zoom in to see". */
const ZOOM_EASE = Easing.bezier(0.2, 0.7, 0.4, 1);
const RATIO_T = Math.max(ZOOM1 + 6, K.hundreds - 2);
if (LENS_SLIDE1 - LENS_SLIDE0 < 20) throw new Error('V4: the magnifier has no time to travel before "zoom"');
if (ZOOM1 > K.seeEnd) throw new Error('V4: the zoom must reach ×250 inside "zoom in to see"');

// V4.3 the push, the ring, the tap, the measure
const PUSH0 = Math.max(RATIO_T + 40, K.s16);
const PUSH_DUR = 24;
const PUSH_END = PUSH0 + PUSH_DUR;
const RING0 = Math.max(PUSH_END + 2, K.bump16 + 6);
const RING_DUR = 14;
const TAP = Math.max(RING0 + RING_DUR + 4, K.clue + 4);
const DIM0 = Math.max(TAP + 14, K.timing - 2);
const DIM_DUR = 14;
const DIM_LABEL = DIM0 + 10;
const EXTRA0 = Math.max(DIM_LABEL + 10, K.farther - 2);
if (EXTRA0 + 8 > K.end - 4) throw new Error('V4: the last labels are not in before the cut');

/* ================================================================== V4.3 screen geometry */

const SPIKE_S = pushed(SPIKE, 1);
const BUMP_S = pushed({x: BUMP.x, y: BUMP.y}, 1);
/** The dimension line runs above the ring and the lens top, spike → bump. */
const DIM_Y = PUSH_TARGET.y - RING_R - 40;
const LENS_TOP_S = pushed({x: 0, y: LENS.top}, 1).y;
if (DIM_Y > LENS_TOP_S - 12) throw new Error(`V4: the dimension line (${DIM_Y}) is not above the pushed lens top (${LENS_TOP_S.toFixed(0)})`);
const DIM_TEXT = `≈ ${d1(ECHO.bumpNs)} ns later`;
const EXTRA_TEXT = `≈ ${d1(ECHO.extraM)} m extra, there and back`;
/** After the push the top right of the card is clear (the trace there is flat): the route icon over the extra-path
 *  label, both right-aligned on the safe margin, above the lens's zoom tab. */
const ICON_K = 1.25; // director fix: at k 1 each glyph was ~12 px at phone width
const ICON_Y = 196;
const ICON_X = 1780 - ROUTE_ICON.w * ICON_K + 32;
const EXTRA_Y = 300;
{
  const tabTop = pushed({x: 0, y: LENS.top - 29}, 1).y;
  if (EXTRA_Y + 14 > tabTop - 8) throw new Error(`V4: the extra-path label (${EXTRA_Y}) runs into the zoom tab (${tabTop.toFixed(0)})`);
  // a conservative width estimate (Nunito 800 averages ~0.56 em per character; the renders are checked as well)
  const w = EXTRA_TEXT.length * 0.6 * 48;
  const dimRight = (SPIKE_S.x + BUMP_S.x) / 2 + (DIM_TEXT.length * 0.6 * 48) / 2;
  if (1780 - w < dimRight + 40 && EXTRA_Y + 14 > DIM_Y - 26 - 36) throw new Error('V4: the extra-path label runs into the dimension label');
}
/** The pointer taps the ring's lower right, coming in from the lower right. */
const TAP_PT = {x: PUSH_TARGET.x + RING_R * Math.cos(0.7), y: PUSH_TARGET.y + RING_R * Math.sin(0.7)};
const TAP_BACK = {x: 1, y: 0.62};

/* ================================================================== sound cue sheet */

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (K.end - K.start) / 30, gain: -8},
  // V4.1: the pulse motif thins at each bounce
  {f: P_FIRE, kind: 'sensor_pulse', gain: -4},
  {f: P_WALL, kind: 'bounce_tick', pitch: 2, gain: -3},
  {f: P_WALL + 2, kind: 'echo_return', gain: -3, note: 'the wall echo lands (1 bounce)'},
  {f: Math.round(P_HIM), kind: 'bounce_tick', pitch: 0, gain: -7},
  {f: Math.round(P_WALL2), kind: 'bounce_tick', pitch: -2, gain: -10},
  {f: P_HOME, kind: 'echo_return', pitch: -3, gain: -12, note: 'the 3-bounce echo lands, tiny'},
  // V4.2
  {f: LENS_IN, kind: 'magnifier_slide', gain: -5},
  // V4.3
  {f: TAP, kind: 'pencil_tap', gain: -3, pitch: 2, note: 'pointer taps the ring'},
];

/* ================================================================== V4.1 */

/** A contact ring round the route-strip icon the pulse bounces off, weaker at each bounce (wall, him, wall), so "thins
 *  at each bounce" reads at phone width (director fix: the kit's 4 px bounce ring and the shrinking dot vanish at 390 px). */
const BOUNCES = [
  {f: P_WALL, x: TL_GEOM.route.xs[1], k: 1},
  {f: Math.round(P_HIM), x: TL_GEOM.route.xs[2], k: 0.7},
  {f: Math.round(P_WALL2), x: TL_GEOM.route.xs[3], k: 0.45},
];
const BounceRings: React.FC<{g: number}> = ({g}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
    {BOUNCES.map((b) => {
      const u = (g - b.f) / 16;
      if (u < 0 || u >= 1) return null;
      return <circle key={b.f} cx={b.x} cy={TL_GEOM.route.y} r={f2(46 + 34 * E.out(u))} fill="none" stroke={C.saffronDeep} strokeWidth={f2(10 * b.k * (1 - 0.5 * u))} opacity={f2(b.k * (1 - u))} />;
    })}
  </svg>
);

const TimelineShot: React.FC<{g: number}> = ({g}) => {
  const labelOp = 1 - tw(g, LABEL_OUT, 8, E.linear);
  const spike = tw(g, P_WALL, 12, E.linear);
  const bump = tw(g, P_HOME, 12, E.linear);
  const tickOp = 1 - tw(g, P_HOME, 8, E.linear);
  // the chip changes in two steps (out, then in) so the two texts never overlap
  const chipOld = 1 - tw(g, CHIP_SWAP - 4, 4, E.linear);
  const chipNew = tw(g, CHIP_SWAP, 6, E.linear);
  const p = routePulse(g);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <ArrivalTimeline
        axis={1}
        wall={spike}
        hidden={bump}
        routeStrip={tw(g, STRIP0, STRIP_DUR, E.linear)}
        routePulse={p > 0 && p < 1 ? p : 0}
        routeLabels={['1 bounce', '3 bounces']}
        routeLabelsT={[tw(g, SPIKE_LABEL, 6, E.linear), tw(g, BUMP_LABEL, 6, E.linear)]}
        ring={tw(g, RING1, RING1_DUR, E.inOut)}
        notToScale={chipOld}
        bg
      />
      <BounceRings g={g} />
      {tickOp > 0 && <ArrivalTimeline axis={0} tick={1} bg={false} opacity={tickOp} />}
      {chipNew > 0 && <ArrivalTimeline axis={0} notToScale={chipNew} notToScaleText="not to scale · far weaker" bg={false} />}
      {labelOp > 0 && (
        <TeachLabel x={SURVIVES.x} y={SURVIVES.y} anchor="middle" size={SURVIVES.size} opacity={labelOp} font="display">
          {SURVIVES.text}
        </TeachLabel>
      )}
    </AbsoluteFill>
  );
};

/* ================================================================== V4.2 + V4.3 */

/** The ring (ink, 6 px, no fill) drawn on like a pen stroke from the upper left. */
const InkRing: React.FC<{t: number}> = ({t}) => {
  if (t <= 0) return null;
  const n = 64;
  const a0 = -2.2;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    pts.push(`${f2(PUSH_TARGET.x + RING_R * Math.cos(a))},${f2(PUSH_TARGET.y + RING_R * Math.sin(a))}`);
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {t >= 1 ? (
        <circle cx={PUSH_TARGET.x} cy={PUSH_TARGET.y} r={RING_R} fill="none" stroke={C.ink} strokeWidth={6} />
      ) : (
        <polyline points={pts.join(' ')} fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={f2(1 - t)} />
      )}
    </svg>
  );
};

/** The dimension line spike → bump (screen px, after the push) with its label. */
const Dimension: React.FC<{t: number; label: number}> = ({t, label}) => {
  if (t <= 0) return null;
  const u = E.inOut(clamp01(t));
  const xa = SPIKE_S.x;
  const xb = xa + (BUMP_S.x - xa) * u;
  const guide = clamp01((t - 0.7) / 0.3);
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
        {guide > 0 && <path d={`M ${f2(BUMP_S.x)} ${DIM_Y} L ${f2(BUMP_S.x)} ${f2(DIM_Y + (BUMP_S.y - 10 - DIM_Y) * guide)}`} stroke={C.saffronDeep} strokeWidth={4} strokeDasharray="3 9" strokeLinecap="round" />}
        <path d={`M ${f2(xa)} ${DIM_Y} L ${f2(xb)} ${DIM_Y}`} stroke={C.ink} strokeWidth={11} strokeLinecap="round" />
        <path d={`M ${f2(xa)} ${DIM_Y} L ${f2(xb)} ${DIM_Y}`} stroke={C.saffron} strokeWidth={5} strokeLinecap="round" />
        <path d={`M ${f2(xa)} ${DIM_Y - 18} L ${f2(xa)} ${DIM_Y + 18}`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
        {u > 0.98 && <path d={`M ${f2(xb)} ${DIM_Y - 18} L ${f2(xb)} ${DIM_Y + 18}`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />}
      </svg>
      {label > 0 && (
        <SubLabel x={(SPIKE_S.x + BUMP_S.x) / 2} y={DIM_Y - 26} anchor="middle" opacity={label}>
          {DIM_TEXT}
        </SubLabel>
      )}
    </>
  );
};

const BoardShot: React.FC<{g: number}> = ({g}) => {
  const push = E.inOut(tw(g, PUSH0, PUSH_DUR, E.linear));
  const ratio = tw(g, RATIO_T, 6, E.linear) * (1 - tw(g, PUSH0, 8, E.linear));
  const ptr = pointerAt(g, {target: TAP_PT, back: TAP_BACK, hit: TAP, travel: 900, inDur: 12, hold: 10, outDur: 14});
  const extra = tw(g, EXTRA0, 6, E.linear);
  return (
    <AbsoluteFill>
      <EvidenceCard
        icon={<ZoneBox x={0} y={0} size={96} listening={ZONE_LISTEN(g)} centre={tw(g, ZONE_T, 8, E.linear)} />}
        source={SOURCE}
        sourceT={tw(g, SOURCE_T, 6, E.linear)}
      >
        <EchoPlot
          t={{
            spikeLabel: tw(g, SPIKE_LAB, 6, E.linear),
            spikeText: tw(g, SPIKE_LAB, 6, E.linear) * (1 - tw(g, DIM0, 8, E.linear)),
            spikePulse: tw(g, SPIKE_PULSE, 14, E.inOut),
            lens: tw(g, LENS_IN, 10),
            lensSlide: tw(g, LENS_SLIDE0, LENS_SLIDE1 - LENS_SLIDE0, E.linear),
            zoom: tw(g, ZOOM0, ZOOM1 - ZOOM0, ZOOM_EASE),
            ratio,
            axisTitle: 1 - tw(g, PUSH0, 10, E.linear),
            push,
          }}
        />
      </EvidenceCard>
      <SubLabel x={SENSOR_TAG.x} y={SENSOR_TAG.y} opacity={tw(g, SENSOR_TAG_T, 6, E.linear)} highlight={Math.sin(Math.PI * tw(g, SENSOR_TAG_T, 44, E.linear))}>
        {SENSOR_TAG.text}
      </SubLabel>
      <InkRing t={tw(g, RING0, RING_DUR, E.inOut)} />
      <Dimension t={tw(g, DIM0, DIM_DUR, E.linear)} label={tw(g, DIM_LABEL, 6, E.linear)} />
      <RouteIcon x={ICON_X} y={ICON_Y} t={extra} k={ICON_K} />
      {extra > 0 && (
        <SubLabel x={1780} y={EXTRA_Y} anchor="end" opacity={extra}>
          {EXTRA_TEXT}
        </SubLabel>
      )}
      <TapRing x={TAP_PT.x} y={TAP_PT.y} t={(g - TAP) / 12} />
      <ScreenPointer pose={ptr} />
    </AbsoluteFill>
  );
};

/** The source line (34, the citation, small) and the sensor condition lifted out of it into a 48 px tag beside the zone
 *  icon (v2 review r1, V2-R1-14; evidence brief §4.1 / §10: "different sensor: 3×3 zones · centre zone" beside the
 *  result). Placed as V6's "same 3×3 sensor" (icon slot + 74, headline baseline − 4), so the two boards rhyme. */
const SOURCE = "authors' released raw counts · centre zone";
const ICON_SLOT = evidenceIconSlot('Real data');
const SENSOR_TAG = {text: 'different sensor: 3×3 zones', x: ICON_SLOT.x + 74, y: EVIDENCE.headline.baseline - 4, size: 48};
const SENSOR_TAG_T = K.different - 2;
{
  // the tag stays inside the card's top row, clear of the V4.3 route icon below it (measured in the browser only)
  if (typeof document !== 'undefined') {
    const w = textWidth(SENSOR_TAG.text, fontShorthand(F.body, 800, SENSOR_TAG.size));
    if (SENSOR_TAG.x + w > EVIDENCE.card.x1 - 40) throw new Error(`V4: the sensor tag runs off the card (${(SENSOR_TAG.x + w).toFixed(0)})`);
    const iconTop = ICON_Y - 40 * ICON_K;
    if (SENSOR_TAG.x + w > ICON_X - 40 && SENSOR_TAG.y + 14 > iconTop - 12) throw new Error('V4: the sensor tag runs into the route icon');
  }
}

/* ================================================================== the scene */

export const V4LaterWeaker: React.FC = () => {
  const g = useG();
  if (g < CUT) return <TimelineShot g={g} />;
  return <BoardShot g={g} />;
};
