# FGW Starship Dual Catch — V3 change note

21 Oct 2026. Precision-polish review cut only: not published, no 4K master rendered. The 4K pack files are kept untouched
(fetched by `tools/v3_fetch_footage.sh`, SHA-256 checked against `footage/footage_manifest.json`).

## Delivered

| Item | Value |
|---|---|
| Review video | `exports/FGW_Starship_Dual_Catch_V3_REVIEW_1080p.mp4` — 1920×1080, 30 fps, H.264 + AAC 48 kHz (parts in `backup/v3/`) |
| Runtime | **@@RUNTIME@@** (narration ends 5:35.4; the picture holds the end screen to 5:41.0) |
| End-frame PNG | `qa/v3/FGW_Starship_Dual_Catch_V3_END_FRAME.png` |
| Captions | `captions/FGW_Starship_Dual_Catch_V3.srt` — same 121 cues as V2 (the recording and its timing are unchanged) |
| Mix | @@MIX@@ |
| Editable source | `source/src/v3/` (composition `MainV3`); V2 stays reproducible in `source/src/v2/` |
| Shot list | `qa/v3/shotlist.json` (`cd source && node shotlist.mjs v3`): 75 shots, no gaps or overlaps |

## End screen

- **Starts 5:26.0 (326.0 s), ends 5:41.0 (341.0 s)** — the final 15 seconds. The catch contact (5:19.9) and the
  "tower takes the load" beat finish first; the camera pulls back to both stages and stops exactly at 5:26.0.
- Two dark recessed panels, 0.5 s entrance, then stationary:
  - left **x=180, y=360, w=660, h=371**
  - right **x=1080, y=360, w=660, h=371**
- Above them, small "FUTURE GOT WEIRD" and "KEEP EXPLORING". Between them, the tower with the booster on the mount and the
  ship in the arms; the only motion is cloud drift, a blinking tower beacon and faint venting.
- No thumbnails, "VIDEO 1/2" text, subscribe circle or click animation. **The panels are picture only.** The clickable
  video elements have to be added in YouTube Studio, placed over these two rectangles.
- Measured stillness inside the panels (mean absolute pixel difference, 5:26.7 vs the last frame): @@STILL@@.

## Narration

**No narration lines were changed and no ElevenLabs credits were used.** Neither optional line fits without repeating a
neighbour:

1. The first replacement says what S4_06 already says in the next sentences ("The ship needs the right position,
   orientation, and motion…").
2. "That's the prize: bring both stages home, then fly them again" repeats S8_01 ("Recovering both stages … using the same
   expensive hardware again") immediately before it and S8_04 ("Catch it, inspect it, fly it again, repeat") soon after.

Every improvement was therefore made in the picture. The voice is the V2 Test Voice recording, untouched, so there are
no new joins in the voice.

## Real footage used (≈ 80 s, all silent, all credited briefly on screen)

| Clip | Film time | Source time | What it does |
|---|---|---|---|
| 01 Flight 5 catch | 0:00.0–0:03.4 | 4.4– | Hook: the real catch |
| 01 Flight 5 catch | 0:49.6–0:56.9 | 1.0– | Powered approach; pushes in on the arms, then a hard cut to the drawn arms at the same framing |
| 02 Flight 14 reentry | 0:05.6–0:07.5 | 12.8– | Hook: plasma |
| 02 Flight 14 reentry | 1:38.0–1:43.4 | 4.0– | Reentry, entered from the drawn Earth-limb horizon |
| 03 Flight 14 ocean return | **2:09.4–2:27.3** | 13.0–30.9 | One continuous descent: belly-flop → relight (on "relight") → rotation → the source's own cut to the external upright landing burn (on "Falling sideways"). No drawn reset, no repeated flip |
| 04 Flight 14 launch | 0:09.2–0:13.6 | 8.6– | Hook: aerial pad liftoff |
| 04 Flight 14 launch | 0:13.6–0:21.1 | 0.6–, 3.55–, 14.0– | "Super Heavy … Starship … launch together" (liftoff, stack, coast) |
| 04 Flight 14 launch | 5:03.4–5:06.9 | 16.4–19.9 | Climbing over the coast under "Every successful return…" — not presented as a reflight |
| 05 Flight 14 separation | 0:21.1–0:24.3 | 11.95–15.15 | Hot staging; the falling booster leads into the drawn boostback arc |
| 06 Pad 2 site | 0:43.8–0:46.1 | 0– | Establishes the real site before the drawn site |
| 07 booster top | 3:04.3–3:07.5 | 0– | Grid fin and the quick-disconnect arm, labelled "not a catch arm" |
| 08 Musk, May 2025 | 4:40.3–4:43.7 | 9.05–12.47 | Under "That's the prize…" — wide shot after the source's angle cut, "SpaceX update · May 2025", no sound |
| 09 Ship 40 | 4:43.7–4:49.5 | 0–3.0, 5.4–8.2 | Recovered ship with the boat, then a worker on the tiles; "Ship 40 · Flight 13 ocean recovery" |
| 09 Ship 40 | 4:52.9–4:53.8 | 9.2– | "inspect it" |
| 09 Ship 40 | 4:56.4–5:00.9 | 12.7–17.2 | Crew along the hull under "a system that keeps working" |
| 10 tower | 2:44.7–2:49.5 | 2.6– (after the source cut at 2.50) | Real chevron bracing; the next shot starts on the drawn brace at the same place and pulls back |

All conformed to 30 fps by frame selection at real speed (no interpolation, no speed change). Flight clips use a
top-anchored 1.17× crop so SpaceX's telemetry strip is out of frame.

## Interval fixes (against the brief's table)

- **Opening:** real catch → drawn stack on a tower-column wipe → real plasma → drawn approach → real aerial liftoff.
  S1 now runs on real launch, stack and separation footage; the separating booster hands over to the drawn boostback.
- **Powered approach (B1):** the real Flight 5 shot pushes in to the arms and cuts to the drawn arms at the matched
  framing. Shelves compressed; the close-up label is now "SUPPORT FEATURE".
- **Orbit → reentry → tiles → windward side → flap hinge:** new flap-hinge close-up; the belly-flop continues into the
  real ocean return with the camera finishing on the aft flap.
- **Ocean vs tower:** "DEMONSTRATED OVER THE OCEAN" only brackets the ocean path; the tower catch is separately marked
  "PLANNED · TOWER CATCH".
- **Tower:** real 10 bracing matched into the drawn mast; load path unchanged; real 07 booster top, with the QD arm named
  as not a catch arm, then the drawn V3 booster top.
- **Error demos:** drift as a plan view with footprints, tilt from the front, too-fast from the side with a spacing
  trail every 0.2 s; one oblique baseline; no ghost vehicles.
- **Abort:** the decision point on one approach path → three condition close-ups (vehicle, engines, ground), each with
  its status light → NO-GO at the gate → Flight 6 → one alternate path (divert to sea) that is only available before the
  gate; beside the arms, "NO GUARANTEED ESCAPE".
- **Reuse:** Musk (silent) → recovered Ship 40 → tiles → a drawn tile close-up that pulls back to the whole ship on its
  stands → catch it (drawn) / inspect it (real) / fly it again (drawn launch) → crew on the hull → the restacked vehicle
  venting at night → a real launch over the coast. The circular diagram is gone.
- **Closing handoff:** one continuous shot 5:06.9–5:26.0: tile side falling at dusk → close on the tiles → flaps →
  relight and rotation → descent into the arms → contact (5:19.9) → load into the tower → settle and hold → pull back
  to both stages. No historical catch is spliced in (the V2 Flight 5 insert is removed). It becomes the end-screen
  background without a cut.

## Hardware and scenery

Rebuilt from the pack frames (photos on content.spacex.com stayed blocked): chevron-braced mast with gussets, legged
launch table over a dark trench, tank farm with vertical and horizontal tanks, lighter steel, marsh/lagoon flats; V3
booster top with vents, strut cage and three upright grid fins. Comparison sheet: `qa/v3/compare/f00000.png`.

## QA performed

@@QA@@

## Remaining issues, concrete

1. **Nobody has listened.** This environment cannot play audio. The mix was checked by measurement only (loudness, true
   peak, speech-band masking via `tools/v3_speech_mask.py`); joins, effects and the end-screen music were not auditioned
   on headphones or a small speaker.
2. **Reference photographs not opened** (network policy). Hardware follows the pack frames and published descriptions.
3. The ship's support fittings are still generic (interface unpublished).
4. The drawn catch shows the ship held about 6 m above the booster on the mount so that "both stages" can share one
   frame; that spacing is a drawing convenience, not a published geometry.
5. Real footage is Flight 5 (older booster) and Flight 14 (newer hardware); credits identify each, but a viewer may still
   read the Flight 5 catch as current hardware.
6. QA was done on rendered frames, contact sheets and frame strips, not by watching at normal speed with sound.
