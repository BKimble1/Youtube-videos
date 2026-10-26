# Glass Climbing V7: changelog

V7 is a surgical pass on V6, made from the V7 brief. Frames are at 30 fps: 1170 frames, 39.0 s.

- **Source:** `source/src/v7/`.
- **Tools:** `tools/v7/`.
- **Unchanged from V6:**
  - the narration, sample for sample;
  - the caption wording and style;
  - the music direction;
  - the pad and device design (`v6/Pad6.tsx`);
  - the micro and spring shots.

## Deliverables

| File | What it is |
| --- | --- |
| `exports/FGW_Glass_Climbing_V7_FINAL_REVIEW_1080x1920.mp4` | Review render from source (see *Checks*). |
| `exports/FGW_Glass_Climbing_V7_MASTER_2160x3840.mp4` | Master at 2×, rendered from vector source (see *Checks*). |
| `audio/mix/FGW_Glass_Climbing_V7_mix.wav` | The V7 mix. |

## What changed

### Character and world
- **No 3D puppet.** The tube-limbed 3D climber from V6 (the overhead look-down and the fall seen from above) is gone.
  Every exterior view now shows the hand-drawn Weird Crew character over the perspective tower and street
  (`v7/Exterior7.tsx`).
  - He is scaled to his depth, and his pads sit where the camera sees the glass.
  - He is turned to the building's vertical at his position, so he stands true to the facade when the camera looks down.
- **No ledge.** The floor fin he stood on in V6 is no longer part of the story.
  - His feet never stand on anything. At the catch his toes only touch the glass; after the lift-off his shoes hang
    clear of it in the taut stirrups.
  - The floor lines are phased so a planted shoe is always about 1.4 m from any floor line.
- **One-storey climb.** The climb is now exactly one storey (eight cycles of 234 units, 3.02 m), and the facade repeats
  every storey. As a result, the end of the film is the opening one floor higher.

### Hook (0–6 s)
| Time | Shot | Change |
| --- | --- | --- |
| 0–0.4 s | H1 | Immediate action: his near pad strikes the glass at frame 3 and catches him; his arm and the strap take the load; the street is visible far below. Only the pad holds him. |
| 0.4–1.3 s | H2 | Three-quarter exterior: his whole body hangs on both pads, his shoes on nothing, the traffic far below; he comes back to the glass. |
| 1.3–2.4 s | H3 | Close on both fists round their handles, both pads planted on the glass (static, brief). |
| 2.4–3.5 s | H4 | "lift your feet": his shoes come away from the glass (out about 16 cm), his knees bend, and the straps take all of him. |
| 3.5–4.5 s | H5a | Distant: the tall facade with him on it, the far pad going up. |
| 4.5–5.7 s | H5b | Close, low angle: he rises onto the far pad and goes on up. |

### Micro (6–17.8 s) and springs (17.8–22 s)
- **Micro shots kept.** These are V6's shots:
  - into the pad;
  - the wedges in depth turning into the section;
  - the wedges bending;
  - the molecules;
  - one pull back out to him.
- **No glow.** The bright cyan contact line is gone, so the contact is no longer drawn as glowing glue. What remains:
  - the dark contact strip;
  - the faint dashed molecular cues between close pairs only.
- **Springs:** V6's shots, kept. The pull-out now hands over to V7's climb at the same framing.

### Climb (22–28.6 s)
- V6's four shots (weight shift, stirrups, release, reseat and rise) on V7's rig, with the same framings.
- The first caption moved off his feet.

### Ending
| Time | Shot | Change |
| --- | --- | --- |
| 28.6–29.8 s | E1 | Outside: he climbs on toward the brick pier; glass and brick side by side. Replaces the 3D look-down. |
| 29.8–31 s | G1 | Through the glass, the far pad's tiles darken as he loads it. |
| 31–31.8 s | G1b | New: the same contact in section on smooth glass, every wedge flat with no gap. |
| 31.8–34.7 s | G2 | He climbs once more on glass, then takes the near pad across onto the brick and presses it on: pleased at first, then doubtful as he leans on it. |
| 34.7–36.5 s | G3 | New: glass above, brick below, the same wedges in section. On glass they lie flat. On brick only a few tips reach the peaks, gaps show between them, and the wedges peel and skid. |
| 36.5–39 s | F1 | Replaces the fall. See below. |

**F1, the slip:**
1. The brick pad slips. His shoulder drops, he tips back and his legs swing out.
2. The far pad never leaves the glass. Its strap snaps taut and arrests him in a short arc.
3. He swings back and reaches the loose pad to the glass.
4. The camera pushes in along the reach. The film ends as the pad nears the glass, and frame 3 is its contact.

### Loop
- **One camera move across the seam.** F1 and H1 are one exterior camera move on the climb's looped time. Frame 1169
  and frame 0 are consecutive frames of it.
- **Same pose and gear.** The climb state is continuous across the seam, in every value.
- **Same background.** The background is one storey higher, and the facade repeats every storey.

### Sound
- **New effects:**
  - a crisp contact as the pad catches him at frame 3, across the loop;
  - the strap snapping taut;
  - spring creaks;
  - the shoes leaving the glass;
  - the dry crack and grit of the brick slip;
  - air rushing during the drop;
  - cable tension as the far strap arrests him;
  - air on the swing out and back.
- **Removed:** the V6 landing, slap and fall effects.
- **Unchanged:** the narration and the bed.

### Captions
- **Same wording and style.**
- **Moved:**
  - "Then, you shift your weight" moves to the top, off his feet;
  - the last two captions sit in the band between the glass and brick sections, and stay above or below him in the slip.

## Checks

**On the review file.** ffprobe: H.264, 1080×1920, 30 fps, 1170 frames, 39.0 s, AAC audio. It is rendered from the
vector source at 1080×1920, not upscaled.

**Frame-by-frame review.** I read every frame of each hard section from the rendered file, as labelled contact sheets.

| Section | Frames | Sampling |
| --- | --- | --- |
| The hook | 0–63 | Every frame |
| The hook | 64–190 | Every 4th frame |
| The seam | 1138–1169 | Every frame |
| The brick and the slip | 990–1137 | Every 5th frame |
| The climb | 660–916 | Every 8th frame |
| The micro and the springs | 180–660 | Every 15th frame |
| The whole film | All | Every 25th and every 36th frame |

**Fixes made from this review:**
- **Captions on him.** The first caption crossed his face in H2, and another sat on his hair in C1. Those shots are
  reframed.
- **Captions on the hands.** At the end of C3 a caption sat on the near hand. The end framing is now wider.
- **Caption on the slip.** The slip caption crossed his legs. The slip framing now keeps him above it.
- **Micro and spring captions.** These crossed the wedge strip, the molecular contact edge and his hand. They now sit
  over the glass side or the left of the frame.

**Loop.**
- **State.** All 104 values of the climb state are equal at frame 1170 and frame 0 (`tools/v7/rig_probe7.ts`).
- **Picture.** Measured on the rendered file as the mean absolute difference of the picture below the caption band:

  | Frames | Difference |
  | --- | --- |
  | 1168 → 1169 | 18.37 |
  | 1169 → 0 | 17.82 |
  | 0 → 1 | 16.98 |

  The seam sits inside the decelerating push like any other frame pair.
- **Audio.** The sample jump at the seam is 0.003.
- **Not checked by eye or ear.** I cannot watch or listen in real time, so the "end into start three times with audio"
  check still needs a person.

**Camera QC** (`tools/v7/cam_qc7.ts`):
- Every shot holds or makes one move, with no reversals.
- This now covers the exterior cameras too: eye, target and focal length.

**Rig probe** (`tools/v7/rig_probe7.ts`):
- Clean:
  - no hand off its grip;
  - no stretched leg;
  - no strap over its length;
  - no toe through the glass.
- Left as is:
  - **Legs overlapping.** In profile, as he brings a foot up, the near shin passes in front of the far one. Seen on
    sheets, this reads as depth, not clipping.
  - **Straps overlapping.** The two straps overlap where they hang parallel, the near one in front.
  - **Feet in motion.** The feet ease back under the pads after the lift-off (frames 108–129).

**Sound** (`audio/mix/mix_measure_v7.json`):
- −14.6 LUFS integrated.
- Peak −2.9 dBFS.
- Voice 27.8 dB over the rest in the phone band.
- Narration identical to the source (correlation 1.0).

**Captions file.** The wording and timing are unchanged, so `captions/FGW_Glass_Climbing_V6.srt` applies to V7 as is.

## What remains

- **Watching and listening.** A person still needs to watch and listen in real time, including the loop played end to
  start three times.
- **The exterior figure.**
  - He is the 2D character drawn in profile. The exterior cameras look along the facade, where a profile reads
    correctly, and he is tilted to the building's verticals when the camera looks down.
  - He is not re-drawn in true perspective, so a strongly downward view would show that.
- **Distant shot.** In the distant reveal (H5a) he is roughly 150 px tall: small, but clearly visible. It lasts one second.
- **Not published.**
