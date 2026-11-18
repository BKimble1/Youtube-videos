# Ultimate Trifecta: Season 1 – Winter Break (V4, 33 s)

V4 is built from the V3 source project. The approved 33-second score is locked: it is placed untouched at 0:00 and plays at its own speed. The headlights still hit at 0:08.000 and the title still cuts in at 0:29.800.

Kept from V3:
- the warm lobby opening
- the clearer fountain step
- the wide chase around the fountain
- the reindeer's eye through the bush

Everything is rendered from the source scenes in Godot at native 1920×1080, 30 fps.

## Deliverables

| File | What it is |
|---|---|
| `exports/Ultimate_Trifecta_Winter_Break_V4.mp4` | Delivery copy: 1920×1080, 30 fps, H.264 two-pass at about 17 Mb/s, AAC 48 kHz |
| `backup/…V4_master_crf16.mp4.part00/01` | CRF 16 master, split to stay under GitHub's 100 MB limit. Rejoin with `cat *.part* > master.mp4`; the sha256 is in `master_crf16.sha256` |
| `audio/mix/` | Final mix plus stems: score (bit-identical to the source) and effects |
| `qa/v4/` | QA report, contact sheet, frame-by-frame strips of the tyre shots, the hand catch, the door clearance and the ending |
| `source/` | Planner (`plan5.py`), EDL, trailer director (with the new arm IK), mix and compositor |

## 1. The patrol cart has weight

**What caused the gap.** The game's `CartView` lifts the cart model by `RIDE_Y = 0.3 m`. In gameplay this is needed because the cart's physics box rides 0.3 m below the drawn ground. The trailer, however, already passed the real drawn ground height, so it got the 0.3 m lift on top. The whole cart floated 30 cm, which is the daylight under the tyres at 0:09.2 and 0:16.6.

**The fix, checked in side view against the path:**
- The trailer now positions the cart body at `ground − RIDE_Y`.
- The tyre radius (0.31) equals the wheel-centre height (0.31), so each tyre bottom sits on the measured surface: path 0.075, plaza 0.03, drift about 0.11.
- Wheel spin is distance travelled ÷ 0.31, so rotation matches ground speed.

**Contact and snow:**
- Each tyre now has a tight, soft contact shadow, placed every frame at that wheel's ground height and turned with the cart.
- Tyre spray now starts at the contact patch. It is thrown low and backwards, opposite the direction of travel, and trails behind the wheel.

**The shots:**
- **0:09.2–0:09.9:** the cart is now parked on the paved north path. The low wheel shot is on the paved side, so the tyre rolls across the paving seams on the ground.
- **0:15.4–0:17.0:** the tyres run on the paving beside the drift, with the spray trailing behind.
- **Fountain wide:** the cart is grounded.

## 2. The chase is performed

**Headlights, 0:08:**
- The elf sees the lights first and pulls Blue away by the sleeve. The elf's hand locks onto Blue's forearm through the new arm IK.
- Blue reacts next. The reindeer turns late.
- Faces are lit with eye detail.

**Low tracking shot:**
- Blue glances back over a shoulder, the eyes find the cart, and the face reacts.
- Blue then snaps forward and drives harder through the next two strides (deeper lean, pumping arms).

**Contact poses.** A trailer-only two-bone arm IK (`TrailerArmIK`) puts each hand on a real target, blended in and out on keyed weights:
- the elf's hand on Blue's sleeve
- the elf's hand on the door's pull handle, then on the open leaf's edge
- the elf's hand on the push plate for the final pull
- Blue's hand and the reindeer's hand meeting at the catch

The receiving character reacts each time (pulled, checked, or swinging past). Feet stay pinned by the game's foot lock on the measured surfaces.

## 3. The escape and the ending

| Shot | Time | Content |
|---|---|---|
| D3 | 21.83–24.00 | The reindeer emerges around 0:22, pushes off, and takes its first strides. After it leaves, the returning headlights cross the abandoned patch for about 0.3 s. |
| E4 | 24.00–27.80 | **A straight cut to the same run arriving at the lobby** (the empty grass and the sign are gone). Three-quarter side angle on the porch, described below the table. |
| E5 | 27.80–29.80 | **All three just inside the closed door**, described below the table. |
| Title | 29.80–33.00 | Hard cut on 0:29.800 to the official title artwork, held to 0:33. |

**E4 beats:**
- Blue plants one slipper and reaches out.
- The reindeer reaches back as it runs past Blue's left side, and the hands meet against open background (about 0:25.5–0:25.7).
- The momentum swings Blue back one step.
- The elf is already bracing the open leaf by its edge, one arm stretched to it.
- Blue pulls the reindeer through. Its trailing hoof clears the threshold (about 0:27.0–0:27.17) before the elf follows it in and the leaf starts to swing.

**E5 beats:**
- The latch catches at 0:28.500.
- All three lean toward the door, listening.
- A headlight sweeps across the glass and moves away (about 0:28.6–0:29.2).
- A small snow clump slips from the antler into the lower frame (it lands at about 0:29.50), and all three look down at it.

Removed: the front-facing lineup and the separate shoe insert.

## Sound

- The score is untouched: its stem matches the source exactly (diff 0.0) and has zero lag in the mix.
- The mix is −14.0 LUFS with a look-ahead limiter.
- Effects follow the new movement:
  - the motor, pitched by speed and distance, muffled after the latch
  - the tyre crunch
  - the branch
  - the reindeer's footfalls
  - the grab at the catch
  - the door yank, swing and latch (28.500)
  - the snow landing
- Audio was checked by measurement (sync peaks, loudness, score integrity, the waveform around every beat), not by ear.

## Measured sync and QA

See `qa/v4/report.json`.
