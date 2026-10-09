# v2 kit (`src/components/v2k/`)

Shared components for the v2 scenes of "How Cameras See Around Corners". All are screen space (1920×1080), pure
functions of their props (no frame hooks: pass progress values you derive from your cue constants), flat cutout style
with 4 px ink outlines and the theme palette. Labels fade or cut in; nothing springs. Dev composition: `KitV2`
(`src/dev/KitV2.tsx`, 420 frames) shows every state.

| File | Exports |
|---|---|
| `QuestionTitle.tsx` | `QuestionTitle`, `questionTitleSize`, `QT` |
| `Labels.tsx` | `TeachLabel`, `SubLabel`, `Label`, `Chip`, `ChipG`, `Overlay`, `labelBox`, `leaderEnds` |
| `ArrivalTimeline.tsx` | `ArrivalTimeline`, `TL_GEOM`, `SPIKE_X`, `BUMP_X`, `BASELINE_Y`, `fitTimeline`, `timelinePoint`, `MarkerRing` |
| `RealTrackBoard.tsx` | `RealTrackBoard`, `REPLAY`, `replayIndex`, `replayEndFrame`, `TRACK_GEOM`, `trackGeom`, `trackPoint`, `TRACK_COLUMN`, `TRACK_FRAMES`, `SOURCE_R8`, `HIDDEN_SIDE_CHECK`, `isHiddenSide` |
| `EvidenceCard.tsx` | `EvidenceCard`, `EVIDENCE`, `evidenceIconSlot` |
| `util.ts` | internal helpers |

---

## QuestionTitle

```ts
QuestionTitle: React.FC<{text: string; from: number; to: number; frame: number; color?: string}>
questionTitleSize(text: string): number   // 64, or smaller if it would pass x 1824
QT = {x: 96, baseline: 118, size: 64, maxRight: 1824, fadeIn: 6, fadeOut: 8}
```

One line, Fredoka 600, 64 px, ink, plain text with a thin white stroke halo, left edge x 96, baseline y 118 (cap top
about y 71). Fades in over 6 frames from `from`; fades out over the 8 frames that end at `to`; renders nothing before
`from` or from `to` on. `from`/`to`/`frame` are global frames. A line too long for x 96–1824 is measured
(`lib/measure` textWidth) and set smaller to fit, with a dev warning: shorten it instead.

```tsx
const g = useG();
<QuestionTitle text="What survives the bounce?" from={K.title} to={K.titleEnd} frame={g} />
```

On a real-data board (V10.1) the title sits where the board's "Real data" headline is: set the board's `headline` to 0
while the title is up (the V1 source line, which starts "Real data ·", stays).

## Labels

```ts
type LabelProps = {
  children: string;            // one line of text
  x: number; y: number;        // anchor point, screen px
  size?: number;               // TeachLabel 64 (60–72), SubLabel 48, Label 48
  anchor?: 'start' | 'middle' | 'end';          // default 'start'
  valign?: 'baseline' | 'middle' | 'top';       // default 'baseline'
  opacity?: number;            // 0..1 (fade only)
  color?: string;              // default ink
  font?: 'body' | 'display';   // Nunito 800 (default) or Fredoka 600
  weight?: number;
  halo?: boolean | string;     // white stroke halo, default true
  haloWidth?: number;          // default max(6, 0.14·size)
  leader?: {x: number; y: number; gap?: number; dot?: boolean; color?: string; t?: number};
  highlight?: number;          // 0..1 flat saffron-light swash behind the text ("brighten once": sin(π·t))
  highlightColor?: string;
  asGroup?: boolean;           // return a <g> for a parent screen-space <svg>
};
TeachLabel: React.FC<LabelProps>   // 64 px default; console.warn (dev) below 60 px
SubLabel:   React.FC<LabelProps>   // 48 px default
Label:      React.FC<LabelProps>   // the base
Chip: React.FC<{children; x; y; anchor?; valign?: 'top' | 'middle' | 'bottom'; size?: number /* 30–34, default 32 */;
                opacity?; maxWidth?: number /* wraps into a rounded box */; tone?: 'cream' | 'saffron'; style?}>
ChipG: React.FC<{text; x; y; anchor?; size?; opacity?; tone?}>   // the same chip as SVG, for scaled SVG drawings
```

- Labels render their own full-frame overlay `<svg>` unless `asGroup`.
- The leader runs from the nearest point of the label's padded box to the target and stops `gap` px short (default 8).
- A Chip is HTML, Nunito 800, ink on cream, 3 px ink outline; it warns in dev outside 30–34 px.

```tsx
<TeachLabel x={300} y={420} leader={{x: 1180, y: 330, dot: true}}>time-of-flight sensor</TeachLabel>
<SubLabel x={300} y={520} opacity={tw(g, K.sub, 6, E.linear)}>times its own light's round trip</SubLabel>
<Chip x={1800} y={80} anchor="end" size={30}>illustration</Chip>
<Chip x={140} y={820} size={30} maxWidth={620}>invisible flash · shown for clarity</Chip>
```

## ArrivalTimeline (V2.2, V3.4, V4.1, V8.2)

The one shared arrival chart: fixed colours (teal wall echo, saffron hidden echo) and fixed positions. It is
illustrative and always carries a "not to scale" chip when shown full frame. It is drawn in a 1920×1080 design frame
and placed on screen by `x`, `y` and `layoutScale` (screen = (x + s·dx, y + s·dy)).

```ts
ArrivalTimeline: React.FC<{
  x?: number; y?: number; layoutScale?: number;        // placement (default full frame)
  axis?: number;           // 0..1 axis draws on, then "time →" (48 px). Default 1
  wall?: number;           // 0..1 the tall teal spike lands (rises, ~7 % overshoot, settles). Default 0
  hidden?: number;         // 0..1 the small saffron bump lands. Default 0
  hiddenScale?: number;    // bump height multiplier, default 1 (V8.2: → 0.4)
  bracket?: number;        // 0..1 dimension bracket spike → bump, label cuts in at 0.6+
  bracketLabel?: string;   // 64 px, default "a few nanoseconds"
  labels?: number | [number, number];   // "wall echo" / "his echo" (48 px, under the marks)
  wallLabel?: string; hiddenLabel?: string;
  ring?: number;           // 0..1 marker ring drawn round the bump
  notToScale?: number; notToScaleText?: string;   // chip, 34 px, bottom-right; e.g. "not to scale · far weaker"
  routeStrip?: number;     // 0..1 five icons (sensor, wall, him, wall, sensor) + dashed legs, above the axis
  routePulse?: number;     // 0..1 pulse dot over the 4 legs; smaller and fainter after each bounce
  routeLabels?: [string, string];          // e.g. ["1 bounce", "3 bounces"], 64 px, by the spike and the bump
  routeLabelsT?: number | [number, number]; // default 1 when routeLabels are given
  tick?: number;           // 0..1 one small ink tick drops onto the axis at the hidden-echo time (V3.4)
  bg?: boolean | 'card';   // true: paper field + cream card; 'card': card only; false: transparent
  opacity?: number;
}>
fitTimeline(target: {x, y, w}, src = TL_GEOM.card): {x, y, layoutScale}   // fit the card into a screen rect
timelinePoint(p: {x, y}, place): {x, y}                                   // design point → screen
MarkerRing: React.FC<{cx, cy, rx, ry, t}>                                  // the hand-drawn ring, reusable
```

**Geometry (design px = screen px at layoutScale 1), `TL_GEOM`:**

| Item | Value |
|---|---|
| card | x 80–1840, y 36–944, r 22 (cream, 4 px ink, shadow +10/+14) |
| axis | baseline y 700, x 220 → 1700 (arrowhead at 1700); "time →" right-aligned at x 1700, baseline 774 |
| wall echo spike | `SPIKE_X` = 520, peak 400 px above the baseline (top y 300), gaussian σ 20 |
| hidden echo bump | `BUMP_X` = 1240, peak 92 px × hiddenScale (top y 608 at scale 1), σ 46 |
| `BASELINE_Y` | 700 |
| bracket | y 540 from x 520 to 1240; label baseline 504, centred x 880 |
| ring round the bump | centre (1240, 646), rx 136, ry 80 |
| tick | x 1240, 14 × 70 px on the baseline |
| route strip | icons centred y 150 at x 330, 650, 970, 1290, 1610 |
| labels | "wall echo" at x 520, "his echo" at x 1240, baseline 774 (48 px) |
| route labels | "1 bounce" start (574, 380); "3 bounces" start (1394, 640), 64 px |
| not-to-scale chip | right edge x 1780, centre y 868 |

```tsx
// V2.2: lands, bracket, chip; then shrinks into the sensor display (V2.3 match)
const s = tw(g, K.shrink, 14, E.inOut);
const dst = fitTimeline({x: DISPLAY.x, y: DISPLAY.y, w: DISPLAY.w});
<ArrivalTimeline wall={tw(g, K.wall, 10, E.linear)} hidden={tw(g, K.his, 10, E.linear)}
  labels={[tw(g, K.wall + 4, 6, E.linear), tw(g, K.his + 4, 6, E.linear)]}
  bracket={tw(g, K.few, 14, E.linear)} notToScale={tw(g, K.few, 6, E.linear)}
  bg={s > 0 ? 'card' : true}
  x={dst.x * s} y={dst.y * s} layoutScale={1 + (dst.layoutScale - 1) * s} />

// V4.1: route strip and pulse, route labels, ring on "tiny"
<ArrivalTimeline routeStrip={...} routePulse={...} wall={...} hidden={...} ring={...}
  routeLabels={['1 bounce', '3 bounces']} routeLabelsT={[...]} notToScale={1} notToScaleText="not to scale · far weaker" />

// V8.2: weak laser → fainter echo
<ArrivalTimeline wall={1} hidden={1} labels={1} notToScale={1} hiddenScale={1 - 0.6 * tw(g, K.weak, 14)} />

// V3.4: one tick at one time, rising from below (bg 'card' leaves the room visible above it)
<ArrivalTimeline axis={1} tick={tw(g, K.blip, 10, E.linear)} bg="card" y={lerp(700, 0, rise)} />
```

For the V4.3 → V5.1 match, the bump's ring is `TL_GEOM.ring` (through `timelinePoint` if the chart is placed);
`MarkerRing` draws the same ring elsewhere.

## RealTrackBoard (V1.3, V10.1, V10.2, V10.4)

The R8 kit track, from the authors' released data (`data/evidence/tracking_topdown.json`), seen from above, x mirrored
so the sensor sits at left. It shows the 16 measured wall points and the wall line, the sensor marker and the partition
line (both are the authors' plot constants), and the estimated position.

- The dot is **`stored_xz`**, the authors' saved estimate. The board never uses `ours_xz` and never draws a halo from
  `ours_std_xz`.
- The board sits on an `EvidenceCard`: headline "Real data" (64 px), the source line (34 px) and a "sped up" corner
  tag (34 px).
- There are no cartoon characters, no conditions box, and no counter unless you ask for one.

```ts
RealTrackBoard: React.FC<{
  idx: number;              // data index now: replayIndex(g, K.board). −1 = no dot yet
  replay?: ReplaySpec;      // default REPLAY (used for the trail)
  layout?: number;          // 0..1 wall + points, sensor, partition draw on. Default 1 (on the cut)
  dot?: number;             // 0..1 dot + trail. Default 1
  trail?: number;           // trail length in PLOTTED positions, default 14 (≈ 0.47 s)
  sensorLabel?: number;     // 0..1 "sensor" 64 px. Default 1
  blocked?: number;         // 0..1 dashed sight line sensor → partition, then the X. Default 1
  blockedAimIdx?: number;   // aim at a data index (default: centroid of the replayed track, so the X holds still)
  blockedLabel?: number;    // 0..1 "blocked" 64 px (coral-deep). Default 1
  dotLabel?: number;        // 0..1 "estimated position" 64 px + leader to the dot. Default 1 (auto-fades as column → 0.25)
  labelBrighten?: number;   // 0..1 one-shot: swash behind the dot label (peaks at 0.5) + a ring from the dot
  headline?: number;        // 0..1 "Real data". Default 1
  source?: number; sourceText?: string;   // default SOURCE_R8
  spedUp?: number;          // 0..1 "sped up" tag. Default 1
  push?: number;            // 0..1 slow 5 % push (eased inside), the plot scales about the focus
  pushFocusIdx?: number;    // focus data index (default: the current dot; pass the index at the push start for a steady push)
  column?: number;          // 0..1 right-hand provenance column: the plot shrinks/shifts left (eased inside)
  columnItems?: {text: string; size?: number; t: number}[];   // default 40 px, one at a time, fixed slots
  counter?: number;         // 0..1 "frame N of 475" (30 px mono; N = idx + 1; frame numbers, never seconds)
  chip?: {text: string; t: number};    // 30 px, wraps to the column width
  fov?: number;             // 0..1 optional pale field-of-view wedge (default 0)
  scaleBar?: number;        // 0..1 optional 50 cm scale bar (default 0)
  background?: boolean;     // paper field behind the card (default true)
}>
REPLAY = {start: 6, step: 2, end: 474, frames: 235}
replayIndex(frame: number, startFrame: number, opts = REPLAY): number
replayEndFrame(startFrame: number, opts = REPLAY): number    // startFrame + 234
trackGeom(column = 0): {K, P(xz), D(dx, z), sensor, wallY, partition: {x, y0, y1}, panel}
trackPoint(i: number, column = 0): {x, y}                   // screen point of stored_xz[i] (no push)
TRACK_GEOM, TRACK_COLUMN, TRACK_FRAMES (475), SOURCE_R8, HIDDEN_SIDE_CHECK, isHiddenSide(i)
```

**Replay mapping (record it in the source record).**

| | |
|---|---|
| Data | `stored_xz` |
| First plotted index | 6 (data frame 7) |
| Step | every 2nd data frame |
| Last plotted index | 474 (data frame 475) |
| Plotted frames | 235, one per video frame, about 7.8 s at 30 fps; the dot then holds on 474 |
| Interpolation | none: the dot jumps from one stored position to the next |
| Trail | joins previously plotted positions only (idx − 2, idx − 4, …) |
| Tag | always "sped up" |

`replayIndex(frame, startFrame) = min(474, 6 + 2·(frame − startFrame))`, and −1 before `startFrame`. Start the replay on
the cut (`startFrame` = the board's first frame) so the dot is there from the first frame. V10.1 uses the same mapping
from its own start.

**Hidden side (verified).**

- The scripted check (Python on the JSON, in screen coordinates for both layouts) and the module-load check
  (`HIDDEN_SIDE_CHECK`, which throws if it fails) agree:
  - every `stored_xz` index from 4 to 474, so every replayed index from 6 up, plots on the hidden side of the plotted
    partition line;
  - "hidden side" means beyond the partition's x, with the straight sensor → estimate line meeting the partition
    segment.
- Indices 0–3 do not, as the evidence brief says, so the replay never shows them.

**Geometry, column 0 (V1.3), no push (`TRACK_GEOM`).**

| Item | Value |
|---|---|
| Scale | K = 500 px per metre (display frame: dx = −x, z = distance from the wall) |
| Sensor marker | centre (420, 610) |
| Wall line | y 200; wall band above it |
| 16 wall points | x ≈ 555–937 on y ≈ 200 |
| Partition | x 570, from y 525 down; it runs off the panel's bottom edge at y 868 (its plot constant ends at z 1.6 → y 1000) |
| Plot panel | x 124–1796, y 146–868 (paper floor, clipped) |
| Track box | x ≈ 714–1176, y ≈ 479–827 |
| Dot | 40 px across plus a 4 px ink outline |
| Labels | "sensor" right-anchored at (358, 632); "blocked" right-anchored at (544, X + 112); "estimated position" right-anchored at (1760, 676) |

- The hidden side, from the partition at x 570 to the panel edge at 1796, spans 1226 px. That is 64 % of the frame
  width, 70 % of the card width and 73 % of the plot panel.
- With the column (column = 1), K = 430, the sensor is at (400, 552), the partition at x 529, the panel ends at x 1104,
  and the column spans x 1150–1790 from y 172.

```tsx
// V1.3
const idx = replayIndex(g, K.board);   // K.board = the cut onto the board
<RealTrackBoard idx={idx}
  sensorLabel={tw(g, K.sensorWord, 6, E.linear)} blockedLabel={...} dotLabel={tw(g, K.estimate, 6, E.linear)}
  labelBrighten={tw(g, K.thatDot, 20, E.linear)}
  push={tw(g, K.thatDot, 90, E.linear)} pushFocusIdx={replayIndex(K.thatDot, K.board)} />

// V10.2
<RealTrackBoard idx={replayIndex(g, K.v10)} dotLabel={0} column={tw(g, K.take, 20, E.linear)}
  columnItems={[{text: 'ST sensor kit · 16 zones · held still · not the phone-grade device', t: ...},
                {text: "under US$100 (authors' figure)", t: ...},
                {text: 'setup: flat wall + empty-room scan first', t: ...}]}
  counter={...}
  chip={{text: 'our check: their code + their data → matched their saved results · a software check, not a new experiment', t: ...}} />
```

Notes for scene builders:
- **V1 → V2 match:** hold `TRACK_GEOM.sensor`, `TRACK_GEOM.wallY` and `TRACK_GEOM.partition` while the style changes.
- **V10.4 stamp:** place it beside the track with `trackGeom(column).P` or `trackPoint`.
- **Settled labels:** the label anchors follow the push, but their font size does not scale.
- **Dot label and the column:** "estimated position" has no room once the column is in. It fades by itself over the
  first quarter of `column`; set `dotLabel` to 0 for V10.2.

## EvidenceCard (V4.2, V6, V10.5 and the R8 board)

```ts
EvidenceCard: React.FC<{
  children?: React.ReactNode;      // the plot: full-frame screen-space layers inside EVIDENCE.content
  headline?: string; headlineT?: number;       // default "Real data", Fredoka 600 64 px at (150, baseline 116)
  icon?: React.ReactNode; iconT?: number; iconAt?: {x, y};   // drawn with its origin at the icon slot centre
  source?: string; sourceT?: number;           // 34 px Nunito 800 ink-soft at (150, baseline 914)
  tag?: string; tagT?: number;                 // corner chip 34 px, right edge 1790, centre y 92
  background?: boolean;   // flat paper field, default true
  card?: boolean;         // draw the card (default true)
  opacity?: number;
}>
EVIDENCE = {card: {x0: 80, y0: 30, x1: 1840, y1: 944}, headline: {x: 150, baseline: 116, size: 64}, iconGap: 56,
            tag: {x: 1790, y: 92, size: 34}, source: {x: 150, baseline: 914, size: 34},
            content: {x0: 120, y0: 146, x1: 1800, y1: 870}, shadow: {dx: 12, dy: 14}}
evidenceIconSlot(headline = 'Real data'): {x, y}   // icon centre, right of the measured headline
```

- The card is white with a 4 px ink outline, a hard shadow (+12/+14) and two tape strips, the S1.3 / S3.3 / S7 family.
- Every slot fades with its own t. Boards cut in: avoid whole-board fade-ins.

```tsx
<EvidenceCard icon={<ZoneBox x={0} y={0} size={96} listening={0.15} centre={1} />}
  source="authors' released raw counts · different sensor: 3×3 zones · centre zone">
  {/* your plot, screen space, inside EVIDENCE.content */}
</EvidenceCard>
```

## Verification

- Stills of every KitV2 state were inspected at full size and at 390 px wide:
  - round 1: `qa/v2/kit/r1`
  - round 2: `qa/v2/kit/r2`
  - final: `qa/v2/kit/r3` (`phone/` subfolders hold the 390 px versions)
- At 390 px, every key label, the dot and the trail are legible.
