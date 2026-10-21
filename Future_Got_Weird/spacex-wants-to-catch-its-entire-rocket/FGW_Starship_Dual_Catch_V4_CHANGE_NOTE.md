# FGW Starship Dual Catch — V4 change and QA note

21 Oct 2026. Review cut only: not published, no 4K master rendered. V3 is preserved (`source/src/v3/`, `backup/v3/`);
the 4K source media is untouched (`tools/v3_fetch_footage.sh`).

## Delivered

| Item | Value |
|---|---|
| Review video | `exports/FGW_Starship_Dual_Catch_V4_REVIEW_1080p.mp4` — 1920×1080, 30 fps, H.264 + AAC 48 kHz (parts in `backup/v4/`) |
| Runtime | **4:10.7 (250.73 s; 7,520 video frames)**, down from 5:41.0. Below the 4:20–4:40 aim: the brief's cuts and the new 25 s opening leave 4:08.7 of narration; nothing was stretched or slowed to reach a number |
| Captions | `captions/FGW_Starship_Dual_Catch_V4.srt` (89 cues, timed from the measured words of the V4 narration) |
| Final narration text | `script/v4_narration_final.md` (new lines marked) |
| End-frame PNG | `qa/v4/FGW_Starship_Dual_Catch_V4_END_FRAME.png` |
| Mix | measured on the final file: -15.0 LUFS integrated, -1.6 dBTP true peak (ffmpeg ebur128); same score, effects and levels as V2/V3, cues retimed to V4 |
| Editable source | `source/src/v4/` (composition `MainV4`; site views `V4Lab`, ship-attitude check `V4Pose`) |
| Shot list | `qa/v4/shotlist.json` (`cd source && node shotlist.mjs v4`): 54 shots, no gaps or overlaps |

## New VO generated (Test Voice `kk5XaSLo2XAw0sKM98zU`, verified in the account; `eleven_v4`; flow `CdC6ENlpAGuJ3ocPlCxk`)

1. **Opening** (the approved text, verbatim, 70 words): "SpaceX has already caught the booster. Now Elon Musk says
   Flight Fifteen will try to catch the spacecraft too—after it comes back from orbit. He announced it on October
   twentieth: both stages, one mission. Super Heavy is the booster underneath. Starship is the spacecraft on top. They
   launch together, then return separately. The hard part is that second catch. Miss badly, and the rocket could take
   the catcher with it." — 2 takes; take 1 kept (24.8 s; widest pitch range). Elon Musk, Flight Fifteen, both stages and
   October 20 are all heard within the first 12.2 s.
2. **Closing** (approved, verbatim): "That's the Flight Fifteen challenge: bring both stages home. Flying them again is the
   payoff." — 4 takes. The first two (`[warm]`) came out at a median 188–205 Hz against ~148 Hz for the V2 ending they
   follow, so two more were generated with `[calm]`; take 3 (144 Hz) is used.
3. No other new sentence.

Credits: opening 2 × 450, closing 4 × 100 ≈ **1,300 credits**; Scribe timing passes were free. Takes are cached in
`audio/v4/takes/` (`audio/v4/picks.json` has every generation id). Scribe returned the prompt text with word timings (it
aligned the known text), so it serves as timing, not as an independent check of the words.

## Removed V3 sentences (V3 timecodes) and the resulting joins

| V3 | Removed | Join |
|---|---|---|
| 0:00.3–0:49.0 | The whole V3 opening through "The launch site becomes part of the landing system." | New opening → "Look closely at that first catch." |
| 1:30.8–1:34.7 | "Getting to orbit means moving fast enough sideways to keep falling around Earth." | "…orbital speed." → "Coming home means getting rid of that energy." |
| 1:54.2–2:05.0 | "A damaged spacecraft reaching the right coastline is not enough." … "Surviving re-entry only gets it to the next problem." | "…control systems still working." → "Lower down, Starship descends broadside…" |
| 2:35.5–2:44.5 | "A successful ocean landing proves…" … "Put the attachment points where the receiving surfaces will actually be." | "…when its support features reach the arms." → "Those receiving surfaces belong to a moving machine." |
| 3:14.3–3:21.1 | "The spacecraft and the catcher must complete their own movements…" and "That's the handoff." | "…one supported structure." → "Now change one thing at a time." |
| 3:41.9–3:52.5 | "These are simple examples…" … "The engines can't leave the tower to absorb whatever motion happens to remain." | "…becomes an impact." → "And because the receiving machine is part of the launch site…" |
| 4:22.7–4:27.7 | "Protecting the receiving machinery matters as much as getting a dramatic picture…" | "…beside the arms." → "Moving recovery machinery onto the ground…" |
| 5:01.9–5:06.1 | "Every successful return moves that idea closer to a working transportation system." | "…performed once." → "So watch the final seconds differently." |
| 5:30.2–5:35.4 | "The next challenge is bringing home the spacecraft…" | Replaced by the new closing line |

Edits fall in the pauses between sentences with 12 ms fades (`tools/v4_build_voice.py`, edit list in
`audio/v4/edit_list.json`). Chapter pauses were cut from 1.4–2.2 s to 0.9 s; paragraph pauses are capped at 0.85 s;
deliberate beats are kept longer (the real flip under "Watch the change.", each error example, the settle after
"the tower takes the load."). No word is stretched, sped up or pitch-shifted.

## Real footage used, by sentence (56 s, all silent, briefly credited)

| Clip | V4 time | Source | Sentence |
|---|---|---|---|
| 01 Flight 5 catch | 0:00.0–0:02.7 | 4.6– | "SpaceX has already caught the booster." |
| 04 Flight 14 launch | 0:12.9–0:14.8 | 0.6– | "Super Heavy is the booster underneath." (tag beside the booster) |
| 04 | 0:14.8–0:17.1 | 3.55– | "Starship is the spacecraft on top." (tag beside the ship) |
| 05 Flight 14 separation | 0:17.1–0:19.6 | 11.65–14.15 | "They launch together, then return separately." — the staging flash lands on "return" |
| 01 | 0:25.7–0:32.7 | 1.0–8.0 | "Look closely at that first catch. The booster is still firing its engines…" |
| 02 Flight 14 reentry | 1:07.9–1:13.4 | 4.0– | "The atmosphere does much of the braking…" |
| 03 Flight 14 ocean return | **1:30.8–1:44.7** | **16.85–30.75** | One second before ignition → relight on "relight" → rotation → the source's cut to the external upright burn on "Falling sideways…". The earlier onboard preparation is trimmed |
| 10 tower | 1:52.9–1:56.3 | 2.6– | "Those receiving surfaces belong to a moving machine." |
| 07 booster top | 2:10.7–2:13.3 | 0– | "…the newer booster has three larger grid fins…" ("GRID FIN", short "QD ARM" tag) |
| 01 | 3:19.7–3:23.1 | 11.6– | "That's the prize behind this ridiculous-looking maneuver." (booster held by the arms) |
| 09 Ship 40 | 3:23.1–3:26.1 | 0–3.0 | "But bringing a spacecraft home is the beginning of another job" (identified as the Flight 13 ocean recovery) |
| 09 | 3:26.1–3:28.9 | 5.4–8.2 | "checking the heat shield" |
| 04 | 3:33.7–3:38.7 | 15.4–20.4 | "…repeat. The goal is a system that keeps working…" (a launch, not a reflight claim) |

Not used: 06 (pad) and **08 (the May 2025 Musk clip — removed)**. The October 20 webcast could not be retrieved
(x.com, ir.spacex.com and the SpaceX image CDN are refused by this session's network policy), so no announcement picture
is used and none is claimed; the news is carried by the narration and one `OCT 20 · FLIGHT 15` chip.

## What changed in the picture

- **Opening** (0:00–0:25.7): real catch → the same tower drawn, arms empty, tilting up to the ship as the second target
  (`OCT 20 · FLIGHT 15`) → orbit to entry in one move → two separate journeys (booster home first, ship after its
  flight) → real stack named stage by stage → real separation → one move from the hovering ship to the rails and down
  over the pad.
- **Site rebuilt** (`site.tsx`, `cam3.ts`): one perspective camera for everything (V3's orthographic camera could not give
  the ground a horizon, which is why the hardstand read as a tilted floating square). Ground plane to a real horizon,
  the Gulf beyond a beach and surf lines, marsh and lagoons, irregular hardstand flush in the terrain, roads, flame
  trench, tower plinth, mount legs on concrete footings, tank farm with a pipe rack to the mount, service buildings,
  scrub on a fixed world grid, long cast shadows from one sun. Views authored: oblique site, low toward the arms,
  mechanism scale, from the sea, ground level (`V4Lab`).
- **Daylight throughout** for the drawn site; the night/sunset/day chapter changes are gone.
- **Catch mechanism**: real deceleration → contact at the rails → load into the support feature and truss → clearance →
  the shelf analogy, whose shelves become the actual rails (same screen layout) → one pull-back reveals rocket, moving
  "shelves" and engine "crane". `LINE UP` / `ARRIVE GENTLY` / `SHELVES MOVE` etc. removed.
- **Reentry**: orbit → real plasma → tiles → flap answering the flow (shorter) → return corridor (sea, shoreline, pad,
  then following the ship) → broadside close-up matched to the onboard view → real flip.
- **Tower and load path**: real brace → drawn brace → arms swing, carriage travels → one camera travelling under the
  arm, along the truss, into the carriage, down the legs, into the plinth.
- **Drift / tilt / speed**: each with one change and a reset; no X left on screen.
- **Abort**: the conditions shown as hardware (a flap that stops answering, an engine that will not light, an arm that
  stops mid-swing), the decision point on one approach path, one alternate route to sea that lapses once the point is
  passed; traffic-light bubbles and `DECIDE HERE` removed.
- **Reuse**: booster set back on the mount (a separate, explained operation) → real catch → recovered Ship 40 → tiles →
  drawn engine/structure check → the ship lifted onto its booster for the next flight → real launch. No cut back to the
  recovery.
- **Final handoff**: one approach from the Gulf with the pad in view, heat-shield side, flaps, relight and flip beside the
  tower, contact (3:52.7), load, settle, pull-back. **No booster under the ship**; the mount stays empty.
- **Support features** are part of the ship drawing (`fittings`), placed by the ship's own transform; the separate gray
  marker that drifted off the rotating ship in V3 is gone. Ship attitude in the world (`shipPose`) sets the on-screen
  roll and the azimuth the camera sees, so the tiled side stays physically consistent (checked in `V4Pose`).

## End screen

**Starts 3:55.7 (235.73 s), ends 4:10.7 (250.73 s).** Contact completes at 3:52.7 and the load beat at 3:54.0 first.
Panels: left **x=180, y=360, w=660, h=371**; right **x=1080, y=360, w=660, h=371**; 0.5 s entrance, then stationary
(measured: mean pixel change 0.073 and 0.042 on a 0–255 scale between 3:56.4 and the last frame). Small "FUTURE GOT WEIRD" and "KEEP EXPLORING" above; the tower holding the ship sits between
the panels with the sea behind; only clouds and a beacon move. The panels are picture only — the clickable elements
have to be added in YouTube Studio.

## QA performed

- File: 1920×1080, 30 fps, 250.7 s, H.264 + AAC 48 kHz (`qa/v4/qa_v4_results.json`). Black stretches: none. Audio
  drop-outs over 1.5 s: none.
- Near-static stretches (freezedetect, strict, ≥ 1.5 s): the end screen (by design) and eight beats of 1.6–3.9 s; the
  longest is the two-journeys diagram (0:08.5, lines drawing). A 7.5 s near-static corridor hold found on the first full
  render (alternate route, 3:01) was fixed by a camera that follows the ship to the arms; the affected chunks were
  re-rendered and QA re-run.
- Test renders before the full export: a half-resolution render of the whole film with sheets every 0.5 s, then targeted
  re-tests (`qa/v4/test/`). They caught and fixed: the return corridor looking inland at empty sand; the final approach
  showing only sky until the flip (now from the Gulf with the pad in view); the decision corridor too wide; the tilt view
  too close; the second-target reveal and the engine-check framing; an over-long flap hold; a 0.7 s launch flash.
- Ship attitude check (`V4Pose`): the tiled side faces the correct way upright, broadside and mid-flip; fittings stay on
  the hull. Site views (`V4Lab`): `qa/v4/lab/`.
- Frame strips (every 2nd frame) across all 21 real/drawn boundaries, the real relight, the closing flip, contact and the
  end-screen entrance: `qa/v4/review/*.jpg`; contact sheets `first30.jpg`, `whole_*.jpg`.
- Speech band: effects and score a median 14.1 dB below the voice (`tools/v4_speech_mask.py`).

## Runway

Not used. The Runway connector was intermittently available in this session; the rebuilt 2.5D site already resolves the
floating pad, and generated plates would not control contact or attachment. No Runway output is in this cut.

## Remaining defects and unperformed checks

1. **Nobody has listened** — to the new lines, the voice edits, or the mix. Checked by measurement only (pitch, loudness,
   speech-band masking). The cut points sit in pauses with fades, but breath continuity at the nine joins is unheard.
2. **Runtime 4:10.7 is under the 4:20–4:40 aim** (see above). If more time is wanted, the natural place is a slower
   final approach or a longer real ocean sequence, not a slower narrator.
3. **No authentic October 20 picture** (webcast unreachable). The opening relies on the narration and the ID chip.
4. **Reference photographs still not opened** (same network block). The site follows the pack frames (04, 06, 10) and
   published descriptions; tank and building positions are representative, not surveyed.
5. On the end frame the near arm's tip reaches the edge of the right panel (the ship and tower are clear of both).
6. The ship's support fittings remain generic (interface unpublished). Scale of the drawn site is approximate.
7. QA was done on rendered frames, contact sheets and frame strips, not by watching at normal speed with sound.
