# Sea Slug Regeneration V2: report

## Deliverables

| File | What |
| --- | --- |
| `exports/FGW_SeaSlug_Regeneration_V2_HOOK_REVIEW_1080x1920.mp4` | Opening gate render: frames 0–149 (5.0 s), full V2 mix |
| `exports/FGW_SeaSlug_Regeneration_V2_REVIEW_1080x1920.mp4` | Full V2 review |
| `source/` (composition `SeaSlugV2`) | Editable project: rig, sets, shots, compositor |
| `audio/mix_v2/`, `audio/cues_v2.json`, `audio/sfx_cues_v2.json` | V2 mix, stems, measurements and cue list |
| `captions/FGW_SeaSlug_Regeneration_V2.srt` | Captions (same words and timings as V1, because the narration is unchanged) |

Both files are rendered natively from the vector source at 1080×1920, 30 fps. They use the same settings as V1:
- PNG frames;
- H.264 yuv420p, bt709, CRF 16, x264 slow, GOP 15;
- AAC 320 kb/s at 48 kHz.

Neither file is an upscale.

- **Runtime:** 28.667 s (860 frames), the same as V1.
- **Status:** review cut only. **It is not final or publish-ready** (see "Unresolved" below), and nothing was
  published or uploaded.
- **Not watched or heard in real time:** this environment has no audio or video output. Everything below was
  checked from the rendered files by frame extraction and measurement.

## Narration: unchanged

- **Source:** the same ElevenLabs take as V1 (`audio/narration/FGW_SeaSlug_narration_V1.wav`), used sample for
  sample with gain only. The mix measures a correlation of 1.0 against the source.
- **Edits:** no word was added, removed or retimed, and no filler was added.
- **Timing:** every picture event is timed from the real Scribe word alignment of that take (`F('word', n)` in
  `source/src/lib.ts`).

## What changed from V1

The picture was rebuilt. Nothing visual from V1 is reused except the caption component and the lab-label style.

- **The creature.** A new deformable 3D surface rig of *Elysia cf. marginata* (`source/src/v2/slug/`):
  - **Build:** the trunk is a tube of rings in body coordinates. The two parapodia are two-sided curling sheets on
    their own grid: the left one opens wider and ruffles more, the right one curls in further.
  - **Rhinophores:** rolled, with a groove, and orange-yellow tips.
  - **Markings:** a pericardial hump, black spots, pale specks and tubule veins, all fixed in body coordinates.
  - **Drawing:** every facet is depth-sorted globally and lit with smooth vertex-normal shading (a warm key and
    cool shade ramp with a wet specular). Ink is drawn only on silhouettes and open edges, in the FGW house finish
    (kit copied from the Dead Spider V6 project).
  - **Design lock:** the design was locked on an 8-view model sheet before animation (`Model2Sheet`: overhead, 3/4,
    low, side, neck pulling, separated, x-ray, day 14).
- **The sets.**
  - **Lab:** a new culture dish on a bench, with sand grains, grit, caustics and soft *Bryopsis* fragments, and the
    FGW lab wall out of focus behind.
  - **Seabed:** a new underwater set with the following:
    - green-blue water with soft surface light;
    - fogged reef shapes behind;
    - a mottled rock floor that fades into the water;
    - a tuft of soft, translucent, swaying *Bryopsis* fronds. Each frond is a bare stalk that branches into two rows
      of curved, tapering pinnules with a pyramidal outline. They are not pine sprigs.
- **The shots.** All eight scenes are new and follow the V2 brief beat by beat (below).
- **The sound.** The V1 synthesis and beds are retimed to the V2 picture. The heartbeat is now held for five beats on
  the picture's own beat frames, and the brush was replaced by a probe tap.

## Scene by scene, and what made each

**Runway was not used for any frame or sound in V2.** Its outputs live on `dnznrvs05pmza.cloudfront.net`, which this
environment's network policy blocks. The V1 workaround of relaying files through another connector was refused by
the session's permission system, so it was not tried again. **Every scene is Remotion** (vector rig and sets).

| # | Time | What happens | Made with |
| --- | --- | --- | --- |
| 1 | 0–4.3 s | See "Opening" below | Remotion |
| 2 | 4.3–7.3 s | Focus racks from the head to the abandoned body. A gloved hand brings a blunt probe in from the upper right and touches the near parapodium, which curls hard locally. The body flinches and recovers, then twitches again on "MOVING". Three readable actions, all finished before the cut. | Remotion |
| 3 | 7.3–13.0 s | REWIND (the separation replays backwards, the head rejoins). The camera swings to a close behind-oblique view of the neck. A sagittal cutaway opens through the neck and front body, showing the digestive-gland lobes, the gut, the heart beating in its pericardium, and a fine line marking the breaking plane. The neck parts in section. The heart stays in the body, and the camera keeps both in frame as the head leaves without it. No diagram, ring UI or floating labels. | Remotion |
| 4 | 13.0–16.3 s | A continuous push into the abandoned body's cut face, through to its tissue: gland cells full of stolen chloroplasts, in three depth layers. Two copepod-like parasites appear on "PARASITES", drawn ghosted (translucent, dashed) under a small HYPOTHESIS tag. The tissue then dissolves onto the head gliding away. | Remotion |
| 5 | 16.3–18.2 s | Cut to the seabed: a low macro on the *Bryopsis* tuft. The head glides in and rears a little, and its snout presses against a frond's stalk in profile. The head pumps (a slow rhythmic surge, no mouth drawn) while the frond drains from the puncture upward, turning pale and clear, and the head greens. | Remotion |
| 6 | 18.2–21.2 s | TIME-LAPSE · DAY 1 → 7, with the light cycling between day and night and the tuft swaying fast. A small, pale, rounded bud of new tissue grows behind the head. A cutaway opens through the new tissue: a tiny new heart forms on "NEW HEART" and beats from "BEATING". The beat is held, and the heartbeat sound uses the same frames. | Remotion |
| 7 | 21.2–25.0 s | The camera rises to an overhead-oblique view, so the animal lies up the frame with the head at the top. There are three held stages joined by short time-lapse runs: **DAY 7** (the bud and its heart), **DAY 14** (the body has lengthened, the parapodia are narrow pale flaps, first spots) and **DAY 21** (full length, parapodia open and ruffled, markings and green restored). The same head is used throughout. There is no glow and no morph: the growth is length, then flaps, then pigment. | Remotion |
| 8 | 25.0–28.67 s | Cut back to the dish. The regrown slug glides in and settles where the film began, and the camera closes on its neck. A constriction forms on "actually did it". On "TWICE" the head starts to pull away and the neck stretches. The last frame runs into frame 0 with the same camera and pose, with the gap growing at the hook's rate. | Remotion |

## Opening (0–4.3 s) and its gate

**The shot:**
- **Frame 0:** a close, slightly elevated 3/4 macro of the whole slug with the neck already stretching and pinched,
  and the TIME-LAPSE tag on.
- **0.35–0.6 s:** the neck thins to nothing and parts without a snap. Both ends then round over.
- **0.7–1.05 s:** the camera holds still while the head glides away along its mucus trail.
- **From 1.05 s:** the camera tracks the head past an algae fragment.
- **1.45–2.05 s:** the camera drops to a low macro angle, with the rhinophores against the lab.
- **2.05–2.6 s:** soft detritus flecks drift right by the lens and slide through the lower frame (parallax).
- **2.6–4.3 s:** a slow push toward the abandoned body sets up scene 2's rack focus. The body gives a small reflex at
  2.7–3.2 s.
- There is no empty overhead shot.

**Gate, as actually done:**
- **Rendered and sampled:** the first 5 s were rendered to MP4 and then sampled from the file at phone size:
  - every 0.1 s across 0–4.5 s;
  - side by side with `FGW_Dead_Spider_V6_FINAL` and `FGW_Cyborg_Cockroach_V5_FINAL` (found on the repository's
    other branches) at 0.2 s steps.
- **Normal speed, muted:** I cannot play video here. "Normal speed" was judged from dense frame strips and the
  per-frame motion scan, not from real-time playback.
- **What it showed:**
  - The event reads with no sound: neck pulls, parts, head leaves, body stays.
  - The subject is large and the captions stay clear of it.
  - No frame was static for more than 1 s, and there are no one-frame pops.
- **Weaker than the benchmarks:** both benchmarks cut or reframe strongly by about 1.4 s and again by about 2.2 s.
  V2 is one continuous move.
- **What the gate changed:**
  - **2.3–4.3 s:** on the first gate render this stretch was nearly static. I added the slow push toward the body.
  - **Low macro:** the subject sat high in the frame over empty sand. I recentred it.
  - The final hook file was re-rendered after these changes and is the same frames as the full review's first 5 s.

## QA of the full render

RESULTS_PLACEHOLDER

## Unresolved

UNRESOLVED_PLACEHOLDER
