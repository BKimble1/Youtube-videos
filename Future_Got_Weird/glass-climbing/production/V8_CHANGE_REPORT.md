# Glass Climbing V8: change report

V8 is the final visual and animation pass on V7, made from the V8 brief. Frames are at 30 fps: 1170 frames, 39.0 s.

- **Source:** `source/src/v8/`.
- **Tools:** `tools/v8/`.
- **Composition:** `GlassClimbingV8` in `source/src/Root.tsx`.
- **Unchanged from V7:**
  - The approved narration, sample for sample. The voice stem in the V8 mix correlates 1.0 with the source recording;
    nothing was regenerated, shortened, sped up or reworded.
  - The caption wording and the yellow emphasis words.
  - The Weird Crew character design, the 2D vector style and the 24-tile pad.

## Deliverables

| File | What it is |
| --- | --- |
| `exports/FGW_Glass_Climbing_V8_REVIEW_1080x1920.mp4` | Review render from vector source at 1080×1920. |
| `exports/FGW_Glass_Climbing_V8_MASTER_2160x3840.mp4` | Master rendered at 2× from the same vector source (not an upscale). |
| `audio/mix/FGW_Glass_Climbing_V8_mix.wav` | The V8 mix. |
| `production/v8_plates/` | Runway prompts and composition references (see *Runway*). |

DIMENSIONS_PLACEHOLDER

## Hook (0–5.7 s)

| Frames | Shot | What it shows |
| --- | --- | --- |
| 0–24 | H1 | Hero exterior from above, re-chosen for V8: he fills the left half, both pads and tethers read, and the street with its pavement, people and cars is visible far below, clear of the right-hand UI column. He is already moving: the near pad arrives and touches the glass at frame 3, a downward load seats it, the tethers take up and his knees settle. |
| 24–70 | H2 | Match into the oblique contact close-up: his fist round the grip, the contact edge and shadow, a restrained reflection, the settle under load. The arm now runs back from the handle to his side, as in H1, in his white sleeve; framed below the top UI band. |
| 70–105 | H3 | One slow push down the tether to the stirrups. His head is above the frame, the soles are seated on the stirrups, the near leg takes his weight and the far knee lifts. The feet stay above the caption throughout. |
| 105–171 | H4 | The height reveal is one pure zoom-out: the eye and the aim stay fixed and only the focal length changes, so the drawn climber and the 3D tower stay registered. It opens big on him mid-reach and widens to the street, traffic and onlookers far below while he climbs a cycle. |

The loop ends and begins on the same camera. The last frames bring the free pad back to the glass; frame 0 continues the
same reach, and the street keeps running across the seam (the frames before the catch ends use the looped time).

## Explanation

- **Pad → tile → wedges (171–232).** One continuous zoom from the side-on pad into its tile face. The section's own
  ground now fades in over the last part of the zoom, so the hand-over to the section view no longer flips the air
  pockets from grey to black in one frame (the V8 QA pop at 213/214).
- **Wedges (232–380).** A clean side section with the glass fixed: the tips settle, the backing is pulled down and the
  wedges bend over into long flat contact strips. The held stretches now creep in slowly (zoom 6.8 → 7.6 px/µm about
  the focus strip), so no stretch is frozen. The contact bands on the glass are wider so they read at phone size. A
  hairline seam that traced square corners at the air pockets is closed.
- **Molecular (380–503).** A continuous zoom from the creeping section into one contact strip: the gap narrows and
  short, pale paired dashes appear across it between facing atoms. The dashes are now paired on rest positions, so
  none blinks on and off with the jiggle, and they are bolder. The zoom back out is longer (473–503).
- **"can hold your entire weight" (503–528).** Back to him in the bay, wider, loaded in both stirrups, with a small
  settle. His feet sit above the caption.
- **Springs (528–642).** S0 is now a cut-in on the near stirrup and a short tilt up its strap. The spring cutaway is
  re-timed to the narration: the cover comes off on "Special springs", every spring stretches together on "spread the
  load", one patch lets go on "so one little patch" and is held while its neighbours take its share, then it returns
  and the load evens out; the cover goes back on before a straight cut to the climb. The camera takes one path that
  never reverses (the stop-start push, the dissolve and the pull-out shot are gone). No neon, flashing, callouts or
  badges.

## Climbing (642–857)

One complete cycle in one held medium view, against the fixed mullions and floor lines:

- "Then, you shift your weight" (664–704): the hips go down and across onto the near stirrup; its tether is taut.
- "onto the other pad." (704–744): the far stirrup unweights, its tether slackens and the far foot comes up.
- "The first releases," (746): the unloaded far pad peels away from the glass (its stand-off now eases in and on with
  no dead stop), is carried up through a natural arc, and reseats and loads (792–806).
- "letting you reach higher" (808–830): he rises onto it, relative to the fixed facade.
- "and repeat." (834–856): the near pad follows, and the next side begins.

Cycle 5 now runs behind the spring cutaway and is settled before the cut, so he no longer stands up on the cut back.

## Ending and loop

- **Smooth surface (894–954).** The contact test through the glass: the pad comes into place and stops before it
  touches, then goes straight in (it no longer slides 8 mm after first contact). Broad, even contact; then the same
  contact in section.
- **Glass to brick (954–1041).** A medium view follows him up the glass. On "but switch to rough brick" it cuts to a
  closer, held view of his upper body, both pads and the brick strip: the same free pad goes across onto the brick
  while the other stays anchored on glass. The brick target is now 0.3 m further onto the brick, clear of the pier's
  edge strip. The brick strip reads as brick: courses with staggered head joints.
- **Rough close-up (1041–1082).** Split comparison in the same orientation and scale. The brick panel is framed on two
  wedges whose tips land on brick peaks; the rest hang over gaps. As the load comes on, the touching tips are dragged
  and released over several frames (no one-frame snap). Brick is rigid; nothing penetrates.
- **"can't make the same contact" (1082–1170).** Hero view: the brick pad creeps and fails, a short lurch (the near
  foot drops, the knee bends) arrested by the taut far tether, alarm, he steadies, then one deliberate reach brings the
  free pad back toward the glass across the seam. One valid glass support throughout. No end card, black frame or pause.

## Scenery

- The native vector tower (`v8/Tower8.tsx`) is used in every exterior shot.
- The white oval ceiling lights are replaced by faint linear fixtures.
- The brick piers are drawn in storey-high segments, so the near glass no longer paints over them and their mortar no
  longer spills onto the glass. The pier beside his bay has real coursing around eye level.
- Each pad has a faint cast shadow on the pane under it, as well as its contact footprint.

## Runway

RUNWAY_PLACEHOLDER

## Sound

- The V8 mix is re-timed to the new picture: the spring cover, stretch, lost patch, neighbours, evening out and cover
  back; the settle at 505; the climb's seat, tension and release effects follow the new cycle times automatically.
- A wind lift opens the height view. There are no electronic or magnetic sounds.
- Measurements: MIX_PLACEHOLDER

## Facts

The narration and captions are unchanged: a tiled, gecko-inspired dry adhesive (24 tiles), with no motors or suction.
Nothing in the picture or captions claims that the cited research tested a climb at this height.

## Checks

CHECKS_PLACEHOLDER

## Remaining issues

REMAINING_PLACEHOLDER
