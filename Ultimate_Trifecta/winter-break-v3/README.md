# Ultimate Trifecta: Season 1 – Winter Break (V3, 33 s)

V3 is built from the V2 project and keeps V2's music track locked from 0:00 to 0:33: the creator's polished score, unedited and played at its own speed. This pass improves character performance, ground contact and the final escape. All changes are made in the source scenes (planner and trailer director) and rendered natively in Godot.

## Deliverables

| File | What it is |
|---|---|
| `exports/Ultimate_Trifecta_Winter_Break_V3.mp4` | Review/delivery copy: 1920×1080, 30 fps, H.264 two-pass at about 17 Mb/s, AAC 48 kHz |
| `backup/…V3_master_crf16.mp4.part00/01` | CRF 16 master, split to stay under GitHub's 100 MB limit. Rejoin with `cat *.part* > master.mp4`; the sha256 is in `master_crf16.sha256` |
| `audio/mix/` | Final mix plus separate stems: score (bit-identical to the source) and effects |
| `qa/v3/` | QA report, contact sheet, frame-by-frame strips |
| `source/` | Planner (`plan4.py`), EDL, trailer director, mix and compositor |

## The recut, 0:20.6–0:28.7

| Shot | Time | Content |
|---|---|---|
| E1a | 20.6–21.83 | **Inside the doorway.** The elf yanks the left leaf open and catches it with one hand. Blue turns and takes one step back toward the courtyard, searching. |
| D3 | 21.83–25.67 | **Three-quarter on the bush (the musical pickup).** The reindeer sees the doorway, pushes the branch aside (22.33), and plants a foot on the snow at the path's edge (22.667). It springs on the hit at 22.97. The camera pans with the first two strides. The branch whips back and its snow slides off (23.33). The cart's returning headlight sweeps across the vacated snow and its print (about 23.9–24.6). |
| E4 | 25.67–28.67 | **The threshold, middle stretch skipped.** The reindeer's face reads as it runs at Blue's outstretched hand. A push-in lands on the catch (26.83). Blue pivots and pulls the friend through while the elf swings the leaf shut. The latch lands at 28.500. |

After the recut:
- **0:28.67:** the three back against the door, listening.
- **0:29.6:** an irregular clump of snow lands between the bunny slippers and the reindeer's feet.
- **0:29.8:** the existing title, held to 0:33.

## Other fixes

**Ground contact**
- The trailer now measures the drawn surface under each character from the mesh triangles. Measured heights:
  - fountain rim: 0.613
  - plaza: 0.03
  - spine path and porch/threshold/lobby slab: 0.075–0.077
  - snow drifts: about 0.11
  - rug: 0.028
- In V2 everyone stood at y = 0, so feet sank 3–11 cm into the path, the drift and the mat.
- Bodies now ride the surface. Each planted foot samples its own touch-down height and stays pinned through stance (the game's foot lock). The swing foot keeps its clearance. The cart also sits on the path.

**Opening, 0:02.9**
- The rim insert is now a low side angle that shows the rim, the slipper coming in, and the landing together.
- The knees take about 4 cm of give as the foot takes the weight.

**Headlights, 0:08**
- B1 now cuts on the light frame (8.000) to a reverse into the beam.
- Faces are lit with detail (lower energy than V2's blown-out faces), and shadows fall behind the characters.
- Reactions are ordered: the elf reacts first (+0.04 s), Blue next (+0.17 s), and the reindeer turns and starts late (+0.3 s and +0.45 s).

**0:15.4–17 pavement insert**
- V2's transparent multi-leg frames came from compositing 60 fps renders by averaging frame pairs.
- Every shot is now rendered natively at 30 fps, with no blending or trails.
- The insert is restaged so one slipper plants on a small drift (pavement visible around it), the weight rolls over it, and the cart's tyre crosses the same drift about 0.7 s later.

**Bush close-up, 0:17–0:20.6**
- The camera stays outside the foliage, looking through one consistent gap at one eye and one antler.
- The rig has no eye controls, so the trailer adds run-time gaze shapes that slide the irises within the eye whites.
- The eye follows the passing cart, then finds the lit doorway.

## Sound

- The score is untouched: its stem matches the source exactly (diff 0.0) and has zero lag in the mix.
- The whole mix gets one uniform gain to −14.0 LUFS (−1.9 dBTP) with a peak limiter.
- Effects sit on their own stem and follow the revised movement:
  - branch push and release (23.18)
  - the reindeer's first footfall crunch on the snow (22.667)
  - the spring
  - the snow sliding off the branch
  - the door yank and catch
  - the door swing and the latch (28.500)
  - the soft snow landing (29.598)
- The motor and footsteps carry across the chase cuts: effects level stays within about 2.4 dB either side of every cut.
- No whooshes, booms or fades.
- Audio was checked by measurement, not by ear.

## Trailer-only staging

These changes are in the dev-only trailer director, not the game:
- the snowy bush at (5.4, 75.5), with clumps arranged to leave a gap on its west side and one clump that swings as a branch
- two snow drifts
- the irregular snow clump
- the gaze shapes
- the drawn-ground lookup
- per-shot headlight energy

ElevenLabs generation was not available, so the foley comes from the game's and the previous trailer's sound library plus synthesized snow and cloth sounds.
