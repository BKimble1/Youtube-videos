# Glass Climbing V6: change note

V6 is a finish pass on V5, from the V6 brief (`FGW_Glass_Climbing_V6_Final_Polish_Prompt.md`). Frames are at 30 fps:
1170 frames, 39.0 s. Shot list and transitions: `production/V6_SHOTS_AND_TRANSITIONS.md`. Source: `source/src/v6/`.

## Deliverables

| File | What it is |
| --- | --- |
| `exports/FGW_Glass_Climbing_V6_REVIEW_1080x1920.mp4` | Review render from source. ffprobe: H.264, 1080×1920, 1170 frames, 30 fps, AAC audio. |
| `exports/FGW_Glass_Climbing_V6_MASTER_2160x3840.mp4` | Master, rendered from source at 2× with the project's established master settings. Its encoded size is checked with ffprobe after it renders. |
| `audio/mix/FGW_Glass_Climbing_V6_mix.wav` | The mix. |
| `captions/FGW_Glass_Climbing_V6.srt` | Captions from the new word timings. |

About the V5 file you looked at: the V5 review in `exports/` is 1080×1920 according to ffprobe. A 512×910 picture is
most likely the in-app preview's transcode, not the file itself. Nothing in V6 is upscaled; both files are rendered
from source.

## Narration (regenerated)

- **Voice.** The channel's saved ElevenLabs voice, "Test Voice" (`kk5XaSLo2XAw0sKM98zU`), model `eleven_v4`. The ID
  came from the project's records (`audio/narration/voice_provenance.json`) and was confirmed in the workspace with
  `creative_list_voices` on 26 Oct 2026. No other voice was tried.
- **Words.** The approved narration, word for word. Inline tags shaped the delivery (conversational, energetic,
  short pauses) and are not spoken.
- **Takes.** Two takes were generated (flow `t9vcp2v2BeMCyIwSUvu4`).
  - Take 1 was rejected. Whisper heard "But, but there's a catch".
  - Take 2 (`y6pd`) is used as generated: no edits, 37.5 s of speech, pauses of 0.3–0.5 s.
  - Both recognisers heard take 2 cleanly, apart from spelling differences. Whisper heard "press" for "pressed"; the
    second recogniser (zipformer) heard "pressed".
  - Provenance, hashes and the ASR results are in `voice_provenance.json` under `v6`.
- **Length.** Total length is 39.0 s: speech plus a 1.5 s tail for the fall and the catch.
- **Retiming.** The animation and the captions were retimed to this take's measured word times
  (`source/src/data/timeline_v6.json`).

## Rebuilt shared assets

**The pad (`v6/Pad6.tsx`).** Every pad in the film is drawn by this one component.
- Added parts:
  - a bevelled frame;
  - a layered back: a cover plus a raised backplate;
  - countersunk fasteners;
  - flanged handle posts with gussets;
  - an attachment lug with the D-ring through it;
  - a box-stitched strap end;
  - a small contact shadow on the glass.
- **The cutaway.** The rear cover now lifts off along the handle before it fades. It no longer switches in place.
- **The springs.** Fewer, thicker coils. A spring's stretch is capped inside its own cell, so it never reaches across a
  neighbour. Load sharing shows on the springs themselves (slack grey, slightly warm when carrying more). The floating
  red squiggle is gone.
- **The hand.** In close-ups the hand wraps the bar, with the thumb opposed (the crew's Hand rig). The forearm runs
  on past the frame edge in every close-up, so no arm ends in the air.
- **The springs-to-climb handover.** When the spring view pulls back, it hands over by a dissolve to the full climber
  at an identical framing of the pad, then continues out. The close-up's arm is never seen ending.

**The rig (`v6/climb6.ts`).**
- The feet stay in their stirrups for the whole film, so straps and stirrups never appear or blend in.
- Each strap is computed every frame from its pad's ring to the stirrup on its foot.
- Hands are placed on their bars by IK. A pad being carried follows the hand.
- The rig probe (`tools/v6/rig_probe6.ts`) reports:
  - no hand off its grip;
  - no stretched leg;
  - no strap over its length;
  - no toe through the glass;
  - the loop state equal in all 104 values.
- Probe items left as is:
  - **Accepted from V5:** depth-correct strap crossings, and the near strap passing in front of the far leg by design.
  - **Accepted as motion:** foot travel while a stirrup's ring moves under load.
  - **Fall frames:** a few frames where the straps cross at the release and at the slap.

**The tower and the street (`v6/Tower3D.tsx`).** A perspective scene, built with the bay's own geometry so floors,
piers, the brick and the spandrels match the side views.
- The building:
  - a corner with its side face, which shows the building's thickness;
  - floor divisions, mullions and brick piers;
  - varied glass with reflections and, close by, the ceiling lines and lights inside;
  - a parapet;
  - an entrance with a canopy at the base.
- The street:
  - pavement with joints, kerbs and a two-way road with a centre line and lane dashes;
  - stop lines and two zebra crossings at the corner;
  - a cross street, two neighbouring buildings and their shadows;
  - traffic moving in its lanes;
  - pedestrians walking;
  - a crowd in loose groups at the foot of the tower, heads tipped back, a few phones raised.
- One sun throughout.
- **The climber in this scene** is the bay rig's state placed at depth:
  - limbs as tubes, with sleeves;
  - a rounded torso with its stripes on the visible faces;
  - the red crown of spikes, which covers the head from behind;
  - ears, pads, straps and stirrups.

The bay's spandrel is now opaque glass about 0.9 m tall, flush with the vision glass, so the pads grip it too. Its top
joint is the horizontal line that passes up his body during the fall.

## The fall and the catch

1. The brick pad tears off. The jolt swings him out on the far pad, which peels off the glass too.
2. He falls about 1.6 m beside the facade with both pads in his hands and the stirrups on his feet. Seen from a static
   side camera and then from above and to the side, the spandrel bands go up past him, with the street, traffic and
   crowd below.
3. His near hand slaps its pad flat on the glass at a height he can reach. It loads and slides about 30 cm as it takes
   him, and his feet land on the floor fin, knees bending.
4. He places the far pad and it loads.

That moment is frame 0: the opening is the end of this catch. There is no claim that the real device arrests a fall.

## Loop

The catch shot and the opening shot are one camera move. The move is computed from the climb's own looped time, so the
last frame and frame 0 are consecutive frames of a single move. There is no fade, no freeze and no static hold.

Measured on the rendered review (mean absolute frame difference, picture below the caption band):

| Frames | Difference |
| --- | --- |
| Neighbouring frames | 6.1–6.8 |
| 1169 → 0 | 6.76 |

The only extra change at the cut is the first caption appearing as its sentence begins. The mix's sample jump at the
seam is 0.003. I cannot watch or listen in real time, so the "end into start three times with audio" check was not
done by ear. It still needs a person.

## Sound

- **Narration:** the regenerated narration, sample for sample.
- **Music:** the established bed (V4/V5's synthesised pad, air and pulse), laid out over the V6 timeline and looping
  seamlessly.
- **Effects (61, restrained):**
  - pad contact and release;
  - strap tension;
  - springs;
  - wind in the height shots;
  - the brick tear;
  - a brief fall whoosh;
  - the slap and a short slide rub;
  - the landing on the fin.
- **Measured levels:** −14.6 LUFS integrated, peak −2.9 dBFS, voice 27.9 dB over everything else in the phone band.
- Source: `tools/v6/make_audio_v6.py`, `audio/mix/mix_measure_v6.json`.

## Captions

- **Source:** generated from the new word timings.
- **Fades:** none. A caption is whole from its first frame, so no faint half-drawn text appears on any frame.
- **Zones:** two consistent zones, around y 270 and y 1480 (out of 1920), plus a right-hand block over the
  cross-section shots.
- **Placement:** set shot by shot and checked on contact sheets to stay off the grips, the feet, the contact interface,
  the falling body and the faces.

## Checks run on the rendered review

**Contact sheets:**
- the whole film every 12–13 frames;
- the opening every 6 frames;
- the 8–12 s transitions every 4 frames;
- the fall and catch every 3 frames.

**Camera QC (`tools/v6/cam_qc6.ts`):**
- Every shot holds or makes one move, with no reversals.
- Not covered by the QC: the scale bridges and the 3D shots. These were checked on the sheets.

**Earlier fixes, found during this pass:**
- An easing bug that broke the 3D wedge field's turn.
- A blank grey stretch in the push into the brick contact.
- The overhead and fall views placing him under a caption.

## What remains / blockers

- **Real-time review needed.** Real-time viewing and listening, including the end-to-start pass with audio, were not
  done; a person needs to do them.
- **Scale bridges.**
  - At about 16.3–17 s (the pull out of the molecules) and 35.1–35.3 s (the push into the brick contact), a few frames
    show abstract intermediate scales: the pad's side wall and section bands.
  - They are continuous and short, but a viewer may read them as a blur of shapes.
- **The wedge field.** The 3D field (7.5–9.9 s) now turns continuously into the section, but its lit blade faces are
  bright.
- **The tower.** The 3D tower and figure are simplified (flat shading, tube limbs). The figure is recognisable and
  connected, but it is not a hand-drawn turnaround of the character.
- **Not published.**
