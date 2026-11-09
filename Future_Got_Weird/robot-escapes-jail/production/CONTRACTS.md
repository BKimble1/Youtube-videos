# Shot boundary contracts (wave 2)

Every shot is `React.FC<{t: number}>` (t = FILM seconds) drawing the whole 1080×1920 frame, active for t ∈ `SHOTS.Sx`
(`src/story.ts`). Shots export their sound cues: `export const CUES_Sx = (): Cue[]` with
`type Cue = {t: number; kind: string; gain?: number; dur?: number}` (film seconds; kinds from `tools/make_audio.py`).

Captions are drawn by the film in screen space, by default centred at y ≈ 330 (band y 250–420, x 110–870). Keep faces and
the key action out of that band unless told otherwise; the director may move a caption per shot (tell the director in your
report where captions must NOT go in your shot, as y ranges per time window).

## Boundaries

| Cut | t | Outgoing last frame | Incoming first frame |
|---|---|---|---|
| S1 → S2 | 3.24 | Camera has whipped down following the falling cup and now looks straight down (pitch 90) at the corridor floor: the coffee `CoffeeSplash` (view 1, u ≈ 0.85) centred at screen (540, 980), radius ≈ 150 px. | MATCH CUT (shape): the robot seen from directly above in the cell (Robot `view` 1), its head circle centred at (540, 980), radius ≈ 150 px (use `robotHeadScreen`), eyes looking up at us. Then the camera rises and tilts to frontal. |
| S2 → S3 | 5.80 | Continuous: same world, same camera path (one owner). | |
| S3 → S4 | 8.80 | Continuous (one owner). | |
| S4 → S5 | 13.55 | Camera looks steeply down on the silver puddle outside the bars; in the last 6 frames the puddle's screen outline is exactly `puddleOutline(540, 1040, 300, 140, t, 7)` (liquid.tsx), drawn with `LiquidMetal`. | MATCH CUT (object): the same `puddleOutline(540, 1040, 300, 140, t, 7)` with `LiquidMetal`, now inside a lab collection dish (petri dish rim radius ≈ 360 px) on a lab bench. |
| S5 → S6 | 17.02 | Push into the re-formed figure's chest; the last ≥ 4 frames are the full-frame `<MetalSurface t={t}/>` (liquid.tsx). | `<MetalSurface t={t}/>` full frame (seamless), then the science cutaway opens out of it. |
| S6 → S7 | 22.45 | Last ≈ 0.3 s: everything fades except ONE field line: `FIELD_PATH = "M 150 1420 C 360 1220, 700 1300, 930 960"`, stroke `C.field`, width 12 px, round caps, a soft cyan glow (same glow both sides). | The identical line on the same background colour `C.navy1`; it becomes the route through the stomach model. |
| S7 → S8 | 27.82 | Deliberate cut (a new place: back to the jail). | The guard in front of the empty cell. |
| S8 → S1 (loop) | 32.40 → 0 | The droplet's `RobotEyes` sit at EXACTLY the screen positions and size of the robot's eyes at frame 0 (`robotEyeScreen` with S1's frame-0 values), glow and gaze matching; the alarm is on again. | Frame 0. |
