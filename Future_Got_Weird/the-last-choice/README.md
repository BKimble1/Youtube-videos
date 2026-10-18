# Future Got Weird: THE LAST CHOICE — R3, the final pass

A dialogue-free animated short, **3:57.80**.

New York falls and a black title card follows. The Director climbs out of the rubble and faces a machine army alone. The Crew join him one by one, and about two and a half minutes of combat follow. The machines strike first, and each exchange is attack, defense, counter, consequence. The Crew's tactics (a decoy, a tether, a drone, a catch) work for a moment. The machines adapt and answer each one. The Director sees a teammate about to die, chooses to take the blow, and cannot rise. The survivors are caught one by one and surrender. He dies by the van with the drone pilot holding his hand. Nobody touches the radio; its indicator flutters through static and an old song catches. One continuous rising camera move carries from his face, past the radio, out over the fallen city, to a single card: **A FUTURE GOT WEIRD FILM**.

R3 is the owner's final-pass audit applied to R2 (`production/R3_AUDIT.md`): the characters, the choreography, the cutting, the city, the fire, the surrender, the radio, the sound balance and the end card. The story, cast, style and music structure are R2's.

**Status:** a review cut. It is **private and not published.** The music comes from recordings the owner supplied. **Supplying them does not establish publication clearance, and nothing here represents that rights are cleared.** The music, the mixes and every render are Git-ignored. The `film-audio-v1` release that carries the recordings is attached to this public repository, so anyone can download it.

**It is not ready to publish.** Known visible defects remain (see "Unresolved issues"), the music is not cleared, and nobody has watched this film in real time or heard it (see "Not done").

| What | Where |
|---|---|
| **Review film (1080p)** | `exports/FGW_TheLastChoice_R3_REVIEW_1080p.mp4`: 1920×1080, 30 fps, **7,134 frames**, **3:57.800** (video 237.800 s, audio 237.781 s), H.264 High CRF 18 yuv420p bt709 with AAC 320 kb/s stereo 48 kHz, **−16.1 LUFS, −2.0 dBTP after encoding** (LRA 13.0 LU), 233,174,110 bytes, SHA-256 `24f1810380bbe66685020b146fc153d361a3cafa7a3bb5f15f687c78d6ab12b3`. Git-ignored because it contains the music. |
| **Native 4K master** | `exports/FGW_TheLastChoice_R3_MASTER_4K.mp4`: 3840×2160, 30 fps, **7,134 frames**, **3:57.800** (video 237.800 s, audio 237.781 s), H.264 High CRF 18 yuv420p bt709 with the same AAC 320 kb/s stereo 48 kHz track, **−16.1 LUFS, −2.0 dBTP** (LRA 13.0 LU), 552,376,882 bytes (18.6 Mb/s), SHA-256 `d93ab68b2f6df9629f7e37d49b6976cd3f2673f1438c5bd7c32c7d9753a3b903`. **A native render of the vector scene with `LastChoiceR2-4K`, not an upscale.** The same edit as the 1080p review; chunks 0–4 come from commit `c3cd9b2`, chunks 5–7 from `ff4c9e0` (see "4K render" below; pixel-neutral). Git-ignored because it contains the music. |
| Editable source | `source/` (Remotion 4, React, TypeScript, SVG). Compositions `LastChoiceR2` (1920×1080) and `LastChoiceR2-4K` (3840×2160, the same component; everything is vector, so 4K is a native render, not an upscale). The R3 composition keeps R2's ids. |
| Single timeline | `source/src/r2/timing.ts`: music segments, music anchors `M`, sections. The anchors did not move in R3. |
| Sound sheet | `source/src/r2/sound.ts`: beds, perspective, radio automation, global cues. Section cues live in `source/src/r2/shots/<SEC>/cues.ts`. 1,210 cues. |
| Shots | `source/src/r2/shots/{A,B,C,D1,D2,D3,D4,EF,G}/`: 105 shots tiling 0–237.8 s. The registry is `source/src/r2/film/registry.ts`; the master is `source/src/r2/film/MainR2.tsx`. The as-built shot list with times is `qa/r3/render/timeline.json`. |
| Audit, brief, exchanges | `production/R3_AUDIT.md` (the owner's audit, section 12 holds the release gates), `production/R3_BRIEF.md`, `production/R3_EXCHANGES.md` (every exchange: start, target, attack, defense, counter, consequence, end). |
| Music cue sheet | `production/MUSIC_CUE_SHEET_R3.md` (R3's continuous second cue and the mix). Cue 1's structure is in `production/MUSIC_CUE_SHEET_R2.md`. |
| Release description | `production/R3_DESCRIPTION.md`: the scenario text and the music attribution, moved off screen. |
| QA | `qa/r3/render/` (the review of the delivered file: every-3 s sheets, one sheet per 12 cuts, `qa_results.json`, and `inspect/` with the frame-by-frame sheets and the before/after of the two fixes made at delivery). Per-area sheets from the production pass are in `qa/r3/{B,C,D1,D2,D3,D4,EF,rig,mech,fx,atmos,city}/`. |
| R1, R2 (preserved) | R1: source at commit `2a8e9aa` (local tag `the-last-choice-R1`; notes in `production/R1_README.md`). R2: local tag `the-last-choice-R2`; its README is in that tag. R3: local tag `the-last-choice-R3`. The 1080p film equals the source at commit `c3cd9b2`. The 4K master equals it too, except that its chunks 5–7 were rendered from `ff4c9e0` (one clipping fix in the drones' marking beam, pixel-neutral). Later commits are documentation and QA sheets only. |

## Render it

```
cd Future_Got_Weird/the-last-choice
bash tools/fetch_music.sh                       # recordings (release film-audio-v1), SHA-256 checked
python3 tools/r2/build_music_r2.py              # audio/r2/music/{portals,llt_full,llt_radio}.wav + edit.json
bash tools/r2/render_chunks.sh exports/FGW_TheLastChoice_R3_REVIEW_1080p.mp4                 # 1080p
bash tools/r2/render_chunks.sh exports/FGW_TheLastChoice_R3_MASTER_4K.mp4 LastChoiceR2-4K     # native 4K
# one chunk of an existing work dir (same bundle snapshot), for a re-render after a fix:
FR=7134 CONC=4 bash tools/r2/render_one_chunk.sh <absolute work dir> <chunk 0-7> [LastChoiceR2-4K]
python3 tools/r2/qa_r2.py exports/FGW_TheLastChoice_R3_REVIEW_1080p.mp4 qa/r3/render/timeline.json qa/r3/render
```

`render_chunks.sh` does four things:
1. Writes `audio/r2/timing.json` from the source and mixes it (`tools/r2/mix_r2.py`). `SKIP_MIX=1` reuses the current mix.
2. Bundles the source once, so the render uses a fixed snapshot.
3. Renders the film in 1,000-frame chunks (eight: seven of 1,000 frames and one of 134). A failed chunk is re-rendered alone and finished chunks are kept.
4. Joins the chunks and adds the mix as AAC 320 kb/s.

**`render_one_chunk.sh` defaults to R2's frame count (7,740). For R3 always pass `FR=7134`.** (`render_chunks.sh` reads the count from the composition and needs nothing.)

Measured on this 4-core machine: a 1,000-frame 1080p chunk took about 6 minutes (chunk 2, `CONC=4`). The 4K chunks took 6.5 to 12.5 minutes each at `CONC=4` (chunk 0 12 min, chunk 1 6.5, chunk 2 10, chunk 3 10, chunk 4 9.5, chunk 5 8, chunk 6 10, chunk 7 under 1), apart from the stall described under "4K render". To inspect stills: `cd source && COMP=LastChoiceR2 SCALE=0.5 node stills.mjs <dir> t:<seconds> …`

## 4K render

`LastChoiceR2-4K` renders the same composition at 3840×2160. The master was rendered in the same eight chunks as the 1080p file, from a fixed bundle, and joined with the same mix.

**A stall, found and fixed at delivery.** Chunks 0–4 rendered in 6.5–12.5 minutes each. Chunk 5 then stalled: the browser sat at 100% CPU for 27 minutes without reaching its 5-minute frame timeout (the screenshot never returned), and retries at lower concurrency (4, 3, 1) and in fresh browsers stalled on the same frames. Single frames were the cause (2:49.10, frame 5,073, and the pair 5,092–5,093 near it), and 5,073 rendered in 2–3 s as a 1080p still, as 4K stills at half scale, and as the 1080p composition at 2× scale; only the 3840 px composition stalled. Switching the drones' marking beam off made the frames render, which isolated it: a drone high above the frame (the one marking the drone pilot at the start of D4-5b) leaves one end of the beam's line thousands of pixels off screen, the line sits in a group with an opacity, and the browser allocates a layer as large as the line's bounding box, which at 3840 px never finished. `beam()` in `source/src/r2/mech/kit.tsx` now cuts the line to the frame plus a small margin before it is drawn (commit `ff4c9e0`). Visible pixels are unchanged: six 4K frames from B6b and D3-5/D3-6, where the beam is drawn (frames 1,030, 1,040, 3,860, 3,900, 3,950, 4,000), rendered from `c3cd9b2` and from `ff4c9e0`, were identical in five and within 6 grey levels (2,386 pixels) in one. I did not confirm that every one of those frames has a beam on it. Chunks 5–7 were then rendered from `ff4c9e0` in 8, 10 and under 1 minute. The 1080p file was not re-rendered, because the change cannot alter a 1080p frame.

If a 4K chunk ever stalls again: render it with `tools/r2/render_one_chunk.sh` in the background and watch the encoder's input (`/proc/<compositor ffmpeg pid>/io`, `rchar`); no growth for several minutes means a stall, not slowness. Render single frames with `renderStill` at half scale to see whether the frame itself is the cause.

## How the film is built (R2's engine, R3's changes)

The engine is R2's: a real 3D set drawn as illustration (perspective camera, painter's sorting by view depth, three-tone cel lighting, ink on silhouette and crease edges), 2D rig sprites placed in the world by their feet, one battlefield in metres, machines at army scale, equipment effects, and a continuity registry so wrecks and damage persist. R3 changed these parts:

- **Camera:** a shift lens (`Cam3.shift`) keeps verticals from converging; the target stays framed.
- **Rig** (`source/src/r2/rig/`): one-crest spiky hair as a single union silhouette; the Director's headset cup and boom layered segment by segment by depth; continuous limb shading (no joint discs); a stricter rounded-hip test; short props split at the face; the Director's curls reach the nape and merge into one mass in rear views.
- **Machines** (`source/src/r2/mech/`): parry, dodge, catch, brace, shove, press, combos, turns and securing behaviours; joint failure then gravity-true debris; walker legs with independent support phases; routes around wrecks; opt-in soft stepping over obstacles.
- **Atmosphere** (`world/fires.ts`, `world/atmos.tsx`, `fx/smoke.tsx`): flames anchored to a fuel source with several irregular tongues, room fires in openings, plumes that grow from their sources and drift with one wind, depth-correct smoke (a smoke layer does not make an opaque facade transparent), embers; dust puffs drawn as billows, not near-circles.
- **City** (`world/`): a spatial checker (`tools/r3/city_check.mjs`) found 70 overlaps and draw-order risks, fixed by moving routes and set pieces; city-detail clusters; damage events in the opening aerial.
- **Sound** (`tools/r2/mix_r2.py`, `source/src/r2/sound.ts`): see "Music and sound".

## Asset provenance

| Asset | Source |
|---|---|
| **Cast** | The approved Weird Crew looks from `they-trained-robots-to-destroy-themselves/source/src/components/cast.ts`. The Director is `clerkC`. Nothing on screen names anyone. |
| **Set, machines, effects, props** | Drawn in code for this film. There are no external images and no real logos. |
| **Sound effects** | ElevenLabs sound-effect takes generated for this film on the channel's account (R2 flow `NZsNryXtOG1YNHRfL1ls`, prompts in `audio/r2/sfx_raw/manifest.json`), plus R1's library from flow `z1if6RWnmC2gvHiGpM0u`. Takes were chosen by objective rules (`tools/r2/prep_sfx_r2.py`), not by ear. No new generation was made for R3. |
| **Music** | Owner-supplied Spotify screen recordings (release `film-audio-v1`) of "Portals" (Alan Silvestri) and "It's Been a Long, Long Time" (Jule Styne, Sammy Cahn; Harry James and His Orchestra with Kitty Kallen). **Not cleared.** The attribution is in `production/R3_DESCRIPTION.md`, not on screen. |
| **Fonts** | Fredoka and Nunito (`@fontsource`, OFL). |
| **Runway** | **Not used in the film.** See the next section. |

## Runway

The audit allowed Runway for an environment-only shot. A 3–6 s trial on the opening city (the A1 aerial plate, `exports/A1_plate_runway_trial_src.mp4`, 6.6 s rendered from the source) was set up. **Downloading Runway's generated keyframe preview was blocked by this environment's permission policy, so the paid video edit was never submitted and no credits were spent on it.** Nothing from Runway is in either delivered film. The fire, smoke, embers and city changes in R3 are all drawn in the source.

## Changes from R2

Section times in R3 (the film is 20 s shorter than R2's 4:18.00; the music anchors are R2's):

| Section | Time | Content |
|---|---|---|
| A | 0:00–0:09.3 | dusk aerial of the city, the tower fails (0:00–0:06.6); the title card (0:06.6–0:09.3) |
| B | 0:09.3–0:35.8 | the Director rises from the rubble; the army is revealed; the heavy finds him; the plate strap; the halt; the sentry drone marks him |
| C | 0:35.8–0:59.95 | the Crew arrive and climb; the drone launch; the shoulder; the shared turn; the army commits; the charge |
| D1 | 0:59.95–1:34.3 | first breach: the run, the machines strike first (1:06.5), the line (1:08.3–1:17.45), the rescue exchange (1:17.45–1:29.78), the gain and the breath |
| D2 | 1:34.3–1:56.92 | the decoy plan, the flank, the pry, the tether, the knockback, the shield, the regroup |
| D3 | 1:56.92–2:29.86 | the blind, the pin, heavy 1's fall, the mark, the formation, the failed decoy, the denied flank, the lost drone, heavy 2, the blast, the fall back |
| D4 | 2:29.86–3:06.9 | the shrinking ground, each tactic answered, the ring, the choice and the strike (2:57.76), the surrender (2:59.3–3:06.9) |
| E | 3:06.9–3:18.3 | the clasp, the last breath (3:15.0), the eyes close (3:16.6) |
| F1 | 3:18.3–3:51.6 | one move: his face → the unattended radio (flutter at 3:19.0, the song from its opening at 3:19.6) → the rising pullback |
| End card | 3:51.6–3:57.8 | A FUTURE GOT WEIRD FILM |

By the audit's twelve items:

**1. The character system** (all sections; 0:44.1, 1:43.6 and the rear views 0:16.8–0:23.4 are the proof frames)
- The red-haired runner has one crest at every angle (R2 doubled it at 0:44.15; the frame at 0:44.10–0:44.17 now shows one).
- The Director's headset boom and cup are layered by depth, so nothing flips through his skull in a turn.
- The Director's curls cover the back of his head down to the nape; in the over-the-shoulder views (B3 0:16.8–0:21.4, F1) the back of his head reads as hair, not a bare face.
- Continuous limb shading (no joint discs), a stricter rounded-hip test, short props split at the face.
- Faces change with the beat: recognition and resolve in C, effort and fear in D, pain in D3/D4, grief and the last breath in E.

**2. Connected exchanges, not demonstrations** (D1–D4; `production/R3_EXCHANGES.md`)
- **D1** was rebuilt so the machines strike first (D1-2b 1:06.5). The **representative rescue exchange is D1-5…D1-8, 1:17.45–1:29.78**: threat (U1's jab 1:17.65, the wind-up); defense (the Director plants and blocks, the plate dents, his heels skid, 1:18.48; U1 follows, presses its palm on the plate and shoves him off, 1:19.3–1:19.85); intervention (the breaker runs in, 1:19.9–1:21.2; the Director ducks the finishing hammer; the ram tears U1's forearm off at the elbow, 1:21.34); counter (U1 catches the tool and wrenches the breaker in, 1:21.95; the Director's plate drives into its knee, 1:22.33); consequence (the ram in its chest drives it 1.3 m into U2, 1:22.80, and both go down; the runner pins U2); continuation (U3 comes out of the gap, 1:23.6; they move to meet it, no pause; the shoulder drive up the rim, 1:25.9; it goes over the crest, 1:29.78).
- **D2** was rebuilt: pressure continues while the plan runs, the projector is shown as a device (the sketch at 1:35.4, the tap at 1:36.9, the projector clicking on at 1:37.55), the distraction is used at once (1:39.5–1:42.2), ten exchanges in which the robots adapt (B backhands the man behind it, A grabs the cable and hauls her), and the wrecks of B and A stay as cover.
- **D3** was re-choreographed: the strongest attack is connected; heavy 1's wreck blocks the crater (2:05.64); the robots' adaptation is shown before each defeat it causes (the mark, 2:08.02; the arc that walks through the decoy figures, 2:13.82–2:17.66; the drones that cut the flank and run the allied drone down, 2:17.66–2:22.36); heavy 2 climbs the wreck and undoes the barrier (2:22.36); the blast and the fall back (2:25.18–2:29.86).
- **D4** was re-choreographed: the ground shrinks; each tactic is answered (the plate cracked, 2:32.5; the runner's route cut, 2:34.5; the tether torn from her hands, 2:36.7; the drone dropped on the pilot, 2:49.06); the ring closes (2:50.4–2:55.0).
- The machines fight back: parry, dodge, catch, brace, shove, press, combos, turns, retreat to regroup, securing behaviours.

**3. Force and weight** (D1–D4)
- Joint failure first, then gravity-true debris; heavy weight (the heavies' swinging feet are planted, their legs have independent support phases); the machines' foot pops eased (D3, 2:22–2:29); heavy 2's ram is carried clear of the wreck and pipe.
- No large flash over a contact: the ram hit's white star is removed in D1; the plate burst (2:57.76) has a small, short flash.
- Delivery fixes (below): D1's armour chip and the ram-hit point light.

**4. Cutting** (105 shots, 104 cuts; `qa/r3/render/timeline.json`)
- In the combat (D1–D4, 77 shots) the average shot is 1.65 s and the median 1.5 s; D2's average is 1.33 s. The brief's palette was inserts of 0.7–1.5 s, exchanges of 1.5–3 s and occasional 3–5 s wides.
- C has no held line-up: turn → readying → the army breaks → the charge (0:53.04–0:59.95).
- B's held shots each add information (the sentry's sortie, the drone marking him at 0:32.9–0:35.8).
- Cut when an event changes; screen direction kept until a wide. The cut sheets (`qa/r3/render/cuts_*.png`) show every cut.

**5. The city's spatial logic** (A, B, D, F1)
- A persistent layout (rubble mound, avenue, crater, girder, van and radio, fires) checked by `tools/r3/city_check.mjs`: 70 overlaps and draw-order risks, routes fixed so machines walk round obstructions or step over them.
- Fallen machines and wrecks persist across cuts and into F1 (D1's wrecks, D2's barricade, heavy 1's wreck in the crater).
- City-detail clusters, damage events in the opening aerial (0:00–0:06.6), and no rebar through the pilot and the Director in F1's crane-up (3:28–3:31).

**6. Fire and atmosphere** (A, B, D, F1)
- Anchored, multi-tongue flames with a brighter core and warmer edges; room fires in openings; source plumes that rise and drift with one wind; embers.
- Dust puffs are drawn as billows with a ragged edge (a puff near the lens fades, one filling the frame is held down): the launcher blast at 2:25.4–2:26.2 reads as a dust cloud, not stacked circular washes.

**7. Defeat and surrender** (D4 2:55.0–3:06.9, E 3:06.9–3:18.3)
- The choice is readable without a caption: the heavy locks its eye on the drone pilot (2:55.04); the Director sees (2:55.98, his head snaps round), chooses (2:56.2, the jaw sets), sprints 4.6 m and plants between them, plate up (2:57.42); the ram comes down onto the plate (**2:57.76**), the plate bursts, he is thrown 2.2 m back into the slab, his legs give (2:58.35), he slides down (2:59.3–3:00.7) and cannot rise: one push, the arm gives (3:02.15–3:03.05).
- The surrender is individual and motivated: each goes to him and is caught, not struck (the tether operator's wrist 3:00.4; the decoy maker's 3:01.0; the breaker's leg gives 3:01.3; the flare carrier's arm is locked 3:01.7 and pressed to a knee 3:02.4), then the hands go up (decoy maker 3:03.55), the last heave (3:04.3), the tether operator gives up (3:04.6). The machines catch and restrain; they never strike. Heavy 2 steps back (2:58.9–3:00.9).
- The pilot crawls to him (3:03.7–3:05.5) and takes his hand (E1 from 3:06.9); his grip loosens (the clasp insert 3:11.4–3:13.1); the last breath is at 3:15.0, the eyes are shut at 3:16.6 and the neck lets go after them. Restrained, not graphic.

**8. The radio and the song** (F1 3:18.3–3:51.6; see "Music and sound")
- The reach, the button press and the knob are deleted. The radio sits on the van floor with a faint standby lamp from E1 on. After his stillness the camera pans to it (3:18.55–3:19.0); its indicator **flutters** with two bursts of static (3:19.00, 0.3 s; 3:19.38, 0.5 s); nobody is near it. At 3:19.60 the song starts from the first sample of the usable recording and plays on, in order.

**9. The opening and the fight sound** (B 0:09.3–0:35.8 and everywhere)
- The rise's breaths, grunts, rubble and cables are lowered at source (an earlier 6–8 dB pass, then 6 dB more over Portals' solo, `balanceRise` in `shots/B/cues.ts`), and near-duplicate takes within 0.3 s are dropped, instead of ducking the music. Measured: the worst 400 ms window of effects over music in 0:09.3–0:35 went from +10 dB to +4 dB; the +4 dB is at the knee's contact with the slab (≈0:13.7).
- Effects give way to the music only where their short-term level comes within 3 dB of it (ratio 0.6, at most 5 dB; active 63.7 s, average 1.35 dB).
- Contacts are cued to the visible mechanics (1,210 cues; the cue lists of D1–D4 were rebuilt with the exchanges).

**10. Runway:** not used (see "Runway").

**11. The end card** (G 3:51.6–3:57.8)
- The scrolling credits are gone. The card reads exactly **A FUTURE GOT WEIRD FILM**, white on black, fading in from 3:52.2 to full at 3:53.0, held to 3:56.3 and faded out by 3:57.3, with no tool credit and no generated-content line. The opening title (0:06.6–0:09.3) is kept.
- The scenario text and the music attribution moved off screen to `production/R3_DESCRIPTION.md`.
- The film is 20.2 s shorter than R2 (3:57.80 against 4:18.00).

**12. The final review:** this document; see "What was checked, and how".

## Music and sound

- **"Portals"** (cue 1): used in full, rec 1.30 → 193.80 at film 0:00.60 → 3:13.10. Unchanged from R2.
- **"It's Been a Long, Long Time"** (cue 2): **continuous from rec 0, no splice, no vocal entry.** The flutter is at 3:19.00; the song plays from rec 0 at 3:19.60 (0.35 s fade-in, so it reads as the broadcast catching through the static) and ends on its cadence at **3:54.26** (rec 34.66, chosen by chroma similarity 0.97 to the song's own phrase endings and refined on the onset), then a **3 s fade** to 3:57.26 over the end card. The vocal (rec 64.36) is not reached.
- **Radio and full-range copies are sample-aligned (lag 0).** Both are cut from one continuous read; the radio's speaker model is filtered zero-phase; a cross-correlation of the two (400–3000 Hz) peaks at lag 0. The radio copy plays alone at −5 dB until 3:23.0, recedes through a zero-phase low-pass while the full-range copy rises at equal power from 3:23.0 to 3:37.0, and the song is full range from 3:37.0.
- **Level:** static gain to −16 LUFS integrated and a 4×-oversampled lookahead limiter to −2.0 dBTP before encoding (−16.0 LUFS, −2.0 dBTP). The limiter works more than 2 dB only at the strike (2:57.96 and 2:58.29, at most 2.7 dB). On the delivered 1080p file, after AAC encoding, EBU R128 reads −16.1 LUFS, LRA 13.0 LU, true peak −2.0 dBTP (the mix's own gain was not changed).

## What was checked, and how

- **Measured on the delivered 1080p file** (`qa/r3/render/qa_results.json`, `tools/r2/qa_r2.py`, plus separate `ffprobe` and `ffmpeg` runs on the file itself, not its name):
  - 1920×1080, `r_frame_rate` 30/1, bt709 tv, 7,134 frames by `ffprobe -count_frames`, video 237.800 s, audio 237.781 s: the 19 ms difference is under one frame (33 ms), so audio and video are in sync;
  - to check sync directly, the decoded AAC was cross-correlated against the source mix (`source/public/audio/r2_mix.wav`) at 10, 60, 100, 150, 177, 200 and 230 s: lag 0 samples at every point;
  - −16.1 LUFS integrated, true peak −2.0 dBTP after encoding, which is under the −1.0 dBTP limit, so the mix gain was not changed.
- **Black and frozen spans:** only the intended ones.
  - 6.60–9.37 black: the title card (the title fades in on black).
  - 231.37–237.77: the pullback fades out and the end card follows. The card's text covers under 2% of the frame, so the detector reads it as black.
  - Frozen 7.27–9.13: the held title. Frozen 232.8–236.8: the held card.
- **The last frame** (frame 7,133) is pure black (maximum pixel value 0). The end card reads exactly "A FUTURE GOT WEIRD FILM" (full at 3:53.0–3:56.3; measured on the pixel maxima: it first rises above black at 3:52.2 and is gone by 3:57.5); nothing else is on it.
- **All 104 cuts:** the outgoing shot's last frame beside the incoming shot's first frame at exact frame times (`qa/r3/render/cuts_00..08.png`). No blank or flash frames, except the intended bright flare flash that ends D1-4d (1:17.4). The invisible cuts E2→F1 (3:18.3) and the section handovers match.
- **Contact sheets:** a frame every 3 s (`qa/r3/render/every3s_*.png`).
- **Frame by frame** (every 2nd or 3rd frame, from the delivered file; sheets in `qa/r3/render/inspect/`): the D1 rescue 1:17.45–1:27.4 (every 2nd frame; to 1:29.78 every 6th), the D3 blast 2:25.2–2:26.3, the strike 2:57.3–2:58.6, the surrender 2:59–3:07, E1 3:06.9–3:11.4, the death and radio 3:11–3:21, the end card; and the lead's fixes: the Director's rear-view curls 0:16.8–0:23.4, the C4b drone launch 0:46.4–0:49.2, the D2-4b lens 1:43.55–1:44.42, the F1 rebar 3:28–3:31, the dust billows at 2:25.4. The curls, the rebar and the dust read as fixed. The C4b launch and D2-4b are improved but keep residuals, listed below.
- **Other windows by sheet** (a frame every 6 to 9 frames): 0:00–0:36, 0:36–0:60, 1:00–2:59 in 6 s steps (except the windows above), and the F1 pullback 3:18–3:52 (every 12 to 20 frames).
- **Radio:** from the pan (3:18.55) to 3:22 only the radio and the van are in view; nobody is near it or touches it. The amber display lights in five short blips at 3:19.03, 3:19.23, 3:19.40, 3:19.50 and 3:19.57 (counted per frame from the pixels) and then stays lit from 3:19.60, where the song starts.
- **Fixed at delivery** (two defects found in the delivered render; both were cheap and local to D1):
  - **A grey flake on the Director's hair** at 1:10.03–1:10.23 (7 frames, and on his shirt into the next shot): the armour chips of his bash into U1's chest flew back along the contact normal past his head. Fixed by removing those chips (commit `3b9b224`). Before and after: `qa/r3/render/inspect/D1_chip_BEFORE_70.0-70.4.jpg` and `D1_chip_AFTER_70.0-70.4.jpg`.
  - **A frame-wide milky wash** for 3 frames at each D1 ram hit (the point light of the hit, full power, radius 6 m, after R3 had removed the star): seen at 1:22.77–1:22.85. Fixed by keeping the light at 0.35 of its power (commit `c3cd9b2`). Before and after: `D1_ramlight_BEFORE_82.73-82.9.jpg`, `D1_ramlight_AFTER_82.77-82.87.jpg`.
  - Chunk 2 (frames 2,000–2,999) was re-rendered from `c3cd9b2` and spliced in; every other chunk is from commits whose source differs only in D2-4b's lens (chunk 3 was re-rendered from `7a54f2d`). The final film therefore equals the source at `c3cd9b2` (checked on ten frames spread over all eight chunks: a still rendered from the source against the delivered frame differs by at most 2.2 grey levels of 255 on average, which is the encoder's, while a neighbouring frame in the action differs by up to 45).
- **Native 4K master** (`qa/r3/render/qa_results_4k.json`, sheets `qa/r3/render/inspect/4K_*.jpg`):
  - 3840×2160, 30/1, bt709, 7,134 frames by `ffprobe -count_frames`, video 237.800 s, audio 237.781 s; −16.1 LUFS, LRA 13.0 LU, true peak −2.0 dBTP after encoding (the same audio as the 1080p file);
  - the last frame is pure black (maximum pixel value 0); the end card reads "A FUTURE GOT WEIRD FILM" at 3:55.0;
  - ten frames spread over all eight chunks (0:10.0, 0:50.0, 1:10.0, 1:43.7, 2:26.7, 2:58.0, 3:03.3, 3:26.7, 3:53.3, 3:57.8) were compared with the 1080p file at the same frame numbers: the 4K frame scaled down to 1080p differs from the 1080p frame by 0.00–1.98 grey levels of 255 on average (edge anti-aliasing), so it is the same picture;
  - it is not an upscale: the energy above the 1080p band (the residual of a down-then-up resize) is 0.65–1.09 grey levels on the 4K frames and 0.19–0.34 on the 1080p frames resized to 4K, over four frames; `qa/r3/render/inspect/4K_native_vs_upscaled_1080p_f2100.jpg` shows a native crop beside the upscale of the same crop;
  - not played, not listened to, and not inspected frame by frame: for the picture, the 1080p inspection above stands in for it.
- **Not done: I cannot play video or listen in this environment.** Nobody has watched either film in real time or heard it here. The motion was judged from frames at exact times, on sheets that I read as images; the audio was judged only from levels, the correlation above and the cue sheet's measurements. The checks above are evidence, not a viewing.

## Unresolved issues (known defects and limits)

**Picture** (timestamps are in the delivered film; none was fixed unless stated above)
- **0:47.0–0:47.4 (C4b, the drone launch):** the drone's body and rotor arms cross the drone pilot's face and glasses for about 10 frames while she raises it on her palm, before it clears above her head at 0:47.4. The two climbers behind her are no longer stacked on her head (they sit behind it and touch its outline at 0:47.2–0:47.8), so this is smaller than in R2, not gone. I tried moving the hold point further out and up (`HOLD_UP` in `source/src/r2/shots/C/crew.ts`); her arm cannot reach it and the drone floated off her palm, so I reverted it and left the source as committed.
- **0:34.1–0:35.0 (B6b):** the marking drone's near rotor arm and its translucent rotor blur sit against the Director's cheek and hair while its amber beam finds his eye; its body is clear of his face.
- **0:50.1–0:51.2 (C5a):** the Director's eyes look up and to the right rather than down at the breaker's hand on his shoulder.
- **1:26.40–1:26.73 (D1-8, the shoulder drive):** a starburst flash and spark cone sit on the contact for about 3 frames (1:26.40–1:26.50, the audit asks for no large flash over a contact), and armour chips from the hit land on the Director's hair for 2–3 frames (1:26.47–1:26.53) before they fly clear. It is the same kind of fault as the grey flake fixed at 1:10.03, shorter. Not fixed: it would mean re-rendering chunk 2 of both films again.
- **1:43.55–1:44.42 (D2-4b, the pry):** the runner's face is pressed behind the robot's popped back plate for the whole shot, and at 1:44.07–1:44.20 the torn cables, a plate shard and sparks cross his mouth and forehead. The Director's curls and eyes now sit behind the robot's head (1:43.7–1:43.9), not on top of it as in R2, but the robot's head still hides most of his face.
- **2:22.4–2:23.3 (D3-10):** residual 6–9 cm grazes of heavy 2 against the wreck. Measured in the source; not judgeable from the frames at this scale.
- **2:28.5–2:28.9:** heavy 2's rear-left shin passes about 0.28 m into the water main. It is out of frame in D3-11e; D4 opens with that pose in the far background.
- **3:11.4–3:13.1 (E1 clasp insert):** flatter and more graphic than the rest.
- **3:17.20–3:18.6 (E2, then the first second of F1): a hair curl pops in front of the Director's ear.** In one frame step (3:17.20 → 3:17.23) a large dark curl with a single crease line jumps from behind his head to in front of it, over the top of his ear and his temple, and stays there for about 1.4 s, in the extreme close-up of his face. Cause: the rig draws each curl behind or in front of the head by a hard depth threshold (`blobAt` in `source/src/r2/rig/figure.tsx`), and his head settling after the eyes close takes the ear-side curl across it. A safe fix is a rig change that touches every view of the Director's curls, so every chunk would need re-rendering; changing only E2's head pose would remove the neck's settle. Not done.
- **3:18.55–3:18.95 (E2 → F1):** the drone pilot's helmet sweeps across the lens during the pan to the radio (carried from R2).
- **≈3:34–3:47 (F1 pullback):** a brick building fills the upper left, then from about 3:41 a tall brick tower fills the right quarter to third of the frame, and the crowd is small below it.
- **Not re-inspected one by one from R2's list:** the blocky combat units in the widest shots and the generic far city. They are as in R2 unless the changes above reach them.

**Audio, unverified by ear** (all measured, none heard)
- **The opening effort:** the worst 400 ms window of effects over Portals' solo is still +4 dB at the knee's contact with the slab (≈0:13.7).
- **The song's entry through static at 3:19.6 and the cadence and fade at 3:54.3.**
- **The radio-to-full-range change, 3:23.0–3:37.0.**
- **The limiter at the strike** (2:57.96, 2:58.29: up to 2.7 dB of reduction) and the overall balance of music against effects.
- **Effect takes:** chosen by objective rules, not auditioned; 17 kinds have only one take.

**Limits**
- **Rights:** the music is owner-supplied and not cleared. The film must not be published until licensing is settled.
- **Not YouTube-ready:** known visible defects remain (the list above), and no one has watched the film in real time.
- **4K:** the master is a complete native render and passes the file checks above. Its picture was judged from the 1080p inspection and ten compared frames, not frame by frame, so every defect listed above is in it too. It is also not heard or watched.
