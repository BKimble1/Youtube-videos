# v2 report — E-A v2 and E-C (opening prototypes, 75 frames, 2.50 s, 1080×1920, 30 fps)

**Read this first: nobody has watched either clip play and nobody has listened to either soundtrack.** I looked at frames and ran scripts on the encoded files. No AI "viewer" voting rounds were run for v2 (you asked me not to substitute them for playback review); the v1 reviewer evidence in `qa/read_test/` and `qa/dir_test/` is history only and is not used to support anything below. Full production stays paused. Zero paid generation (no ElevenLabs, no Runway).

## 1. Deliverables (all in `exports/v2/`; exact metadata in `exports/v2/EXPORT_METADATA.json` / `.md`)
| File | What |
|---|---|
| `FGW_EarthStops_EA2_Opening_Silent_1080x1920.mp4` / `..._SFX_...mp4` | **E-A v2**: side-view hero, recomposed street, tapered coffee, loose bicycle vs anchored lamps/palm, camera-brake reveal |
| `FGW_EarthStops_EC1_Opening_Silent_1080x1920.mp4` / `..._SFX_...mp4` | **E-C (minimal)**: a globe is the visible cause (spins, stops dead); the same street scene below is the effect |
| `..._Silent_NoMarker_...mp4` (both) | no WHAT IF tag (staging-only test) |
Each: H.264 High, 1080×1920, 30 fps, 75 frames, 2.500 s, yuv420p, bt709 (tv range). Silent files have no audio stream. SFX files copy the identical picture stream and add AAC, 48 kHz, 2 ch (identical channels, mono-safe), 320 kb/s requested. Checkpoint of v1 kept: tag `earth-stops-ea-v1`, `checkpoints/v1/`.

## 2. The seven items
| # | Ask | What was done | Evidence / caveat |
|---|---|---|---|
| 1 | Same cast identity and palette; test one side/three-quarter off-balance pose against the approved references | New side rig of the **same** cast member (`clerkB`: bun, glasses, earring, blue cardigan over white shirt, navy trousers). Same `Look` colours, same segment lengths (thigh+shin 158, upper arm 84, forearm 78), outline 4. Only the view changed (face turned toward travel, nose on the silhouette, ear, glasses temple, bun at the back). Test sheet: approved reference crop vs side standing vs v1 front off-balance vs side off-balance/flight/skid (`qa/v2/lab/PoseLab2_0000.png`) | The approved cast sheets contain no side view, so this view is **new artwork extrapolated from them: it needs your identity check**. Known roughness: flight pose is cluttered (arm, mug and scarf overlap), torso slightly lumpy, mitt-style hands |
| 2 | Recompose around character, mug, ground reference; less sky/road; keep the liquid visible | Tall facades, shallow sidewalk, curb, thin road under a scrim. The camera rides her so the jet has room: hips at x≈250–300, mug ≤ x 790 | Road below the curb: **24.4% → 18.4%** of frame height (E-A v2), 17–18% (E-C). Empty sky above the first roofline: 19.4% → **6.6%** at frame 0, but it grows to 19–21% after the pull-back (the price of the reveal; the tag lives there). Liquid: choreography probe shows **0 airborne drops off-frame** in all 36 airborne frames (E-A v2) and 44 (E-C); v1 pixels show coffee clipped at the frame edge on 34 of 75 frames, first at frame 2 |
| 3 | Tapered stream that breaks into varied droplets; no repeated beads; few outlines | One filled ribbon, full width at the mouth, tapering with age, then 46 parcels of random size (radius 4.5–17), stretched along their velocity, ink outline only if r > 8; ground stains are irregular blobs with one outline-free fill | Read at 360 px width (`qa/v2/sheets/*_phone360_keyframes.png`): a tapered dark stream that breaks into unequal drops. Unknown: whether it reads as coffee rather than ink or oil without the mug beside it (it is in every frame) |
| 4 | More than her balance affected: one loose object continues the same direction, an anchored reference gives the contrast | E-A v2: a riderless bicycle (same ground-frame speed as her) against three lamp posts and a palm that never move except under the camera. After the brake the bicycle travels **508 px** (x 140 → 648, frames 36–72) past lamp posts fixed at x = 104 / 826 / 1549. E-C: **no extra object by design** (minimal): the hero, her coffee and her stains are the loose things, lamps/palm the anchors | The bicycle is only a wheel peeking in at the left edge until ~frame 29 (fully visible by ~36): the proof arrives late in E-A. Not tested: whether a riderless bike reads as "loose" or as "someone's bike rolling" |
| 5 | A revealing second beat around 0.8–1.2 s; don't repeat one slide | E-A v2: beat 1 frames 0–19 (stop, skid, spill); beat 2 frames 20–36 = hop/landing **and** camera brake (street speed 23.7 → 0.02 px/frame, 0.67–1.13 s) with the pull-back to zoom 0.86 by 1.2 s; beat 3 frames 37–74 on a pixel-still street. E-C: same scene shifted 10 frames, brake **1.00–1.47 s** (starts in the window, ends after it) | Measured on the no-tag renders: background band difference **24.5 → 0.011** (E-A v2, mean abs, 8-bit) between frames 8–20 and 38–74; E-C **19.6 → 0.009**. Weakness: beat 3 is still 1.27 s of one continuous slide |
| 6 | Minimal E-C connecting stopped ground with continuing motion; compare; don't assume E-A wins | Built (§3). Globe spins at 7°/frame (≈24 px/frame at its centre, motion-blurred), stops dead at frame 8 with a coral ring pulse; she begins to pitch frame 9 | See comparison and recommendation |
| 7 | Silent and SFX previews with exact export metadata; no paid generation | Done; sha256, ffprobe JSON, exact render and mux commands in `exports/v2/EXPORT_METADATA.*` | Audio is procedural numpy Foley (`tools/foley_lib.py`, `tools/build_audio_v2.py`), never auditioned |

## 3. E-A v2 vs E-C: what the frames and measurements say
| Question | E-A v2 | E-C |
|---|---|---|
| Is the cause (the ground stopping) in the picture? | **No.** Implied; the street's stop is shown only as the camera brake at 0.67–1.13 s | **Yes**, at 0.27 s: planet spinning → dead stop (inner-disc frame difference 17.5 → 0.04), ring pulse, then she pitches 1 frame later |
| First frame | Mid-action (pitched hero, coffee already leaving the mug) | Calm hero with mug under a spinning globe; **first action at frame 9 (0.30 s)** |
| First evidence that *the loose things keep going while the world does not* | ~0.9–1.2 s (still street + bicycle + lamp) | 0.27 s for the cause, 1.0–1.47 s for the street |
| Hero size (bbox height of skin + trousers, % of frame): frames 0 / 12 / 30 / 60 | 33.2 / 27.6 / 22.8 / 23.8 (v1: 37.9 / 36.1 / 32.3 / 32.4) | 27.8 / 26.3 / 22.0 / 19.1 (pose-dependent; E-C's scene is drawn at 0.82× in beat 1 by construction, equal after the pull-back) |
| Liquid visible | whole life in frame | whole life in frame, 0.82× size |
| Loose vs anchored contrast | bicycle + hero vs lamps/palm, 508 px over 1.2 s | hero + coffee vs lamps/palm/stains; no bicycle |
| Unused space | road 18%; sky 7% → 20% | road 17–18%; **the globe (~20% of height) is pixel-still for 2.2 of 2.5 s** |
| Audio cause cue | none (the brake barely shows in the mix: RMS −26.1 → −26.7 dBFS; the rush stem itself goes −24 dB → silent) | planet-stop thump + whirr cut: 0.5–3 kHz band −7.5 dB, 20–120 Hz +5.6 dB, RMS −18.9 → −12.3 dBFS across the stop |
| Risk | still reads as "slip + spill" for ~1 s; cause arrives only with narration | slower start; globe can read as the standard "Earth stops spinning" explainer image, or its ring as an impact; smaller hero; unverified |

## 4. Honest recommendation (provisional until you have watched and listened)
**Carry E-C forward as the lead candidate, keep E-A v2 as the fallback, and decide only after your own muted phone viewing of both.** Why: your test was "not an earthquake is not enough". E-A v2 is the better *picture* (bigger hero, immediate action, richer second beat), but by my frame-by-frame reading its first ~0.6 s is still a person flung forward with spilling coffee, and what makes it extraordinary (the world stopping) arrives only at about 1 s. E-C is the only version in which the premise is visible in the first third of a second without narration or on-screen text. Its costs are real: 0.3 s before any action, a smaller hero, and a graphic that sits still for most of the clip.
If E-C is chosen, three refinements are worth the owner's approval (none done): shorten the calm pre-roll; after the stop, shrink the globe into a corner so the street panel can grow; bring the bicycle into the panel. If E-A v2 is chosen, the clip needs the cause supplied by the first spoken line at frame 0.
This is a reading of frames, not evidence of audience behaviour; a different result from real viewing overrides it.

## 5. Exactly what was and was not inspected
**Inspected by me:**
- all 75 frames of each **encoded** silent MP4 (E-A v2, E-C) as 20%-scale contact sheets (`qa/v2/sheets/*_all75_part{1,2,3}.png`), 8 phone-width (360 px) key frames each (`*_phone360_keyframes.png`), and 12 full-resolution key frames (`qa/v2/keyframes/`);
- the pose-test sheet; the approved reference crop;
- scripted measurements on the encoded files: encode specs (frame count, colour tags), per-frame motion energy, background-band stillness, hero bbox, sky/road margins, coffee-colour pixels at the frame edge (`tools/qa_v2.py` → `qa/v2/QA_MEASUREMENTS_V2.json`); airborne-drop visibility from the choreography (`tools/probe_liquid_v2.mjs`); globe/panel frame differences;
- audio: duration, channel identity, sample/true peak, loudness (WAV and AAC), per-250 ms RMS, band energies around the key events, spectrograms (`tools/qa_audio_v2.py` → `qa/v2/AUDIO_MEASUREMENTS_V2.json`).

**Still requires a human (nobody has done these):**
1. Real-time playback of each clip on a phone, muted, at least twice. Questions: what happened in the first second; which way is she going; why; is it a slip, a quake, or something stranger; does the bicycle help or confuse; does the globe stopping read as cause or as impact?
2. Listening (phone speaker, headphones, mono): do scrape, tick, thump, rush, freewheel clicks sound like physical events or like synthesis; does E-C's planet-stop thump read as "planet stops"; does E-A's reveal need an audio marker (it has none)?
3. The live Shorts UI overlay. Position facts only: hero-coloured pixels inside the top 10% / bottom 18% bands over all 75 frames: E-A v2 24 / 3, E-C 0 / 67 (of ~25–45k hero pixels per frame); the tag sits at y 215–311 (11–16% of height).
4. Identity of the side-view character against the approved cast.
5. Whether E-A v2's hero leaving the right edge (mug gone from about frame 51, body cropped from about frame 62) feels like a cut-on-action or a clipped composition.
6. Analytics/runtime conclusions are unchanged and **remain conditional** until you confirm which Atlas/murder-tip files were uploaded.

## 6. Known weaknesses
**E-A v2:** cause implicit; hero smaller than v1 (the side pose is wide and the 1080 px frame is the limit: hero + mug are ~770 px wide at frame 12); on-screen hero travel in beat 1 is small (hips x 250 → 298 by frame 12 because the camera rides her; the decisive travel, 508 px, comes after the brake); beat 3 is one long slide; sky returns to ~20% after the pull-back; flight-pose clutter; the bicycle's wheel at the left edge for frames 1–28 may look like an artefact; mix shows no audio marker for the brake.
**E-C:** see §3; also the street panel crops the upper floors of the facades, and it contains no loose object besides coffee.

## 7. Method notes
- The v2 picture is pure functions of the frame (`source/src/v2/choreo2.ts`, `choreoEC.ts`); the render, the probes and the audio cue tables read the same functions, so they cannot drift. E-C draws the E-A scene scaled 0.82 into a clipped panel, time-shifted by `T0 = 10` frames (`eventsEC.json`).
- Foley is original numpy synthesis (fixed sha1 seeds): skid, thud, ceramic tick, coffee stream, launch, flutter, rush (follows how fast the street scrolls, so it drops away at the brake), landing, patter of drops, riderless-bike freewheel clicks; E-C adds the spinning-planet whirr, the planet-stop thump and the ring bloom. Log: `audio/v2/<variant>/SFX_LOG.csv`.
- Rebuild commands: README. Local scratch frames lived in `/tmp`; iteration frames were deleted from the repo to keep it small (the encoded files and sheets are the record).
