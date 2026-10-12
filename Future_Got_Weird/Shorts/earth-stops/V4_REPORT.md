# V4 report — Earth Stops. You Don't. (final animation and pacing review cut)

**Status: complete V4 review cut built (20.5 s, 1080 × 1920, 30 fps, 615 frames, loops). Awaiting the owner's one whole-film review. Not published, not uploaded, not scheduled. No pull request. No claim of final readiness, and no prediction of performance.** Branch `claude/fgw-earth-stops-short`. Preserved: V3 `243eb4d` (branch `claude/fgw-earth-stops-v3-checkpoint-243eb4d`, verified on `origin`; `checkpoints/v6/CHECKPOINT.md`; V3 exports untouched in `exports/v6/`, `git diff 243eb4d -- exports/v6` is empty), V2 `f6f000b`, V1 `701648d`. Tag pushes are refused by the remote, so checkpoints are branches and commit hashes.

**I could not watch or listen to this film.** Everything I say about how it looks and sounds comes from decoded still frames and measurements; the sections below say which is which. The creative assessment (§5) is a reading of the stills and the numbers, not a viewing report.

## 1. Deliverables (`exports/v7/`)
| File | What |
|---|---|
| `FGW_EarthStops_V4_Review_1080x1920.mp4` | **the V4 review master**: picture, Test Voice, captions, sound (with the tension swell); h264 + AAC, 1080 × 1920, 30 fps, 20.5 s |
| `FGW_EarthStops_V4_ReviewNoMusic_1080x1920.mp4` | the same without the swell — **the safer file to review sound on** |
| `FGW_EarthStops_V4_Review_Preview_540x960_labeled.mp4` | smaller preview (burned label "V4 REVIEW PREVIEW … not final … unpublished") |
| `FGW_EarthStops_V4_Silent_1080x1920.mp4` | picture only (watch this muted first) |
| `FGW_EarthStops_V4_VoiceOnly_48k.wav` / `.mp3` / `…_VoiceOnly_1080x1920.mp4` | the narration alone, aligned to the film |
| `FGW_EarthStops_V4_SFXOnly_…mp4`, `…_MusicOnly_…mp4`, `stems/` | sound design alone; the swell alone; 48 kHz stems (mix, no-music mix, voice, sfx, music) |
| `FGW_EarthStops_V4_Captions.srt` | the 16 cues (also burned in); no overlaps, single spaces |
| `FGW_EarthStops_V4_Script.md` | final script |
| `EXPORT_METADATA.json` / `.md` | verbatim ffprobe, size, sha256, counted frames, exact commands |
Also: `script/` (SCRIPT, STORYBOARD, CLAIM_LEDGER, SOURCES; V1–V3 versions in `history/`), `audio/v7/` (voice with provenance, cues, 101-event log `v4/SFX_LOG.csv`, stems, `MIX_LOG.json`), `qa/v7/` (QA, scene motion, caption sync, audio measurements, sheets of the decoded encode, UI overlay, phone width), `source/` (reproducible Remotion project + lockfile; V4 = `source/src/film4/`, compositions `FilmV4`, `FilmV4-Clean`), `credits.md`, `QA_NOTES_V4.md`, `handoff/OWNER_APPROVAL_V4.md`.

## 2. V3 → V4 change log (final timecodes, 30 fps)
| Time | V3 (24.8 s) | V4 (20.5 s) |
|---|---|---|
| words / pauses | 55 words, pauses of 1.0–3.5 s between lines (the ocean beat was 3.3 s of silence) | **64 words, 13 phrases, gaps 0.10–0.45 s** (0.22, 0.24, 0.10, 0.28, 0.26, 0.24, 0.28, **0.45**, 0.32, 0.21, 0.30, 0.30); no word stretched or clipped; speech 0.05–20.05 s |
| 0.00 | pads (slotted ring) closing | pads **twice as large** (280 × 104 px) on a **plain belt**, 97 px from the belt at f0 and accelerating; continents turning 4° per frame |
| 0.50 | lock at f14 on *stopped* | **lock at f15 inside *stopped*** (the word starts 0.48 s): pads dig in, bracket recoils, sparks and a flash at the contact lines, a 9-frame shake; the clack is short, band-passed, placed in the silent /t/ closure at 0.52 s |
| 0.53–0.67 | punch-in at the contact point | dive 1× → 2.35× (f16–19), **action cut at f20 = 0.67 s** |
| 0.67–1.60 | carried east 0.5 s + a **5-frame suspended beat** | **28 frames (0.93 s) of continuous acting, no hold**: stumble, **feet leave the ground at 0.97 s**, fear grows, bun and scarf trail, coffee leaves the cup as a stream that breaks into drops; the cut at 1.60 s comes before any contact |
| 1.60–4.27 | street from 1.2 s; `EQUATOR` chip added late | still street: mug, **bicycle rolls in turning, hits the lamp post at 2.37 s** (in the 0.24 s breath after *east*), the **`EQUATOR ~1,000 MPH` plate lands at 2.73 s** (EQUATOR on the first speed plate) |
| 4.27–6.07 | wind and debris 5.0–7.9 s | **a chair hits the palm at 4.60 s** (in the breath after *equator*); a bigger box, a clay pot and a second chair cross; wind rising |
| 6.07–8.63 | tracking shot, awning crosses the lens | **brief acceleration blur (6.07–6.53 s), then controlled tracking**; **the awning strains (6.53 s), tears at a corner (7.87 s), whips free (8.27 s), covers the lens (8.27–8.57 s) and is dragged off**; the cut to the coast hides behind it |
| 8.63–11.8 | swell grows; boat sits behind the pier | **a swell grows from the left from 8.93 s**; the boat is on the **same water surface** and is lifted from 9.13 s and rides the front face; the crest reaches the boat and the middle post on ***coast.* (11.2 s)**: the lip breaks, the boat capsizes at the lip, **post 2 snaps (11.27 s), a deck section detaches (11.4 s) and flies**, post 3 tilts; the surge runs on toward the town; **0.6 s of aftermath (11.2–11.8 s)** |
| 11.8–12.8 | foam-edged band sweeping the frame (cut carried by a decorative band) | the **flood rises through the frame with a foam line and spray (11.8–12.07 s), covers it (≥ 88 % of the frame is water on f360–365, 0.2 s) and drains in sheets and rivulets (12.07–12.8 s)**, revealing the stage: no detached band, no lingering opaque wipe |
| 12.07–13.8 | NORMAL DAY after a long pause | NORMAL DAY as the water drains; three arrows on *you / move / with* (13.27, 13.47, 13.67 s) |
| 13.8–14.53 | pull-out | pull-out onto the turning Earth (no extra diagram, no long calm walk) |
| 14.53–16.67 | latitude comparison after a lead-in | markers with thicker trails and a bigger `EQUATOR` / `NEAR A POLE` chip, visible **during the line** (chips at 14.6 s and 15.73 s; tilt move 14.93–16.53 s) |
| 17.17–20.5 | ring grows (20.1 s), brake returns (23.3 s), pads close from 24.2 s with a 2 s tail after the last word | ring grows 17.5–18.3 s; **the brake returns during the last line (18.07–19.13 s)**; pads start closing at **19.17 s**; **the last word ends at 20.05 s and the film restarts at 20.5 s**: no tail, no end screen |
| captions | 14 cues | 16 cues from the actual voice timeline; every cue starts within 40 ms of its first word; no one-frame gaps between back-to-back cues |
| sound | 101 events, five new generated one-shots | 101 events, **no new generation**: reused V2/V3 clips + procedural Foley; retimed to the corrected contacts; boat/pier/water sounds placed on the visible reactions; lock clack reshaped (see above); awning sounds kept out of the speech band; the swell stem re-timed (f150–322); no louder music |
| loop | pads close from f726 (0.6 s before the end) | pads close from f575 (1.33 s before the end), `padGap(t)` shared with frame 0; audio continuous by construction |

## 3. The brief against what was built
| Brief | What V4 does | Caveat |
|---|---|---|
| One final animation/pacing revision from V3; not a new concept or a generic speed-up | same concept, same cast; every beat re-animated; narration re-spoken with short breaths | the film is **20.5 s, shorter than the brief's editorial 23–24 s**: the 64 words at the voice's natural pace plus breaths are 20 s of speech, and I added no hold or padding. If the owner wants 23–24 s, the options are a longer voice take or added narrative beats, not stretching |
| Boat rises with the water | one water surface function drives the picture and the boat; the boat is lifted from f274, rides the front face tilting with the lagged local slope, flips at the lip | the boat is mostly hidden behind the pier deck while the sea is calm (only the sail shows, f266–292); the wave is a stylised steep cross-section with a rounded crest and may still read as a triangle; **nobody has seen it in motion** |
| Pier visibly changes; a section detaches, a missing section after | post 2 snaps (f338), a deck section detaches and flies (f342), its ragged edges match the gap, post 3 leans, the rope hangs | — |
| Water overtopping/obscuring the urban environment; 0.5–0.8 s of aftermath | the aftermath is 0.6 s (f336–354); the surge runs on toward the town (its face is at the building's foot by f356) and the **flood then covers the whole frame, town included** | the crest itself does not climb over the building; the covering is done by the flood |
| Transition carried by water/spray; no decorative band, no lingering opaque wipe, no cut that removes the aftermath | flood rise (8 frames), near-full cover for 6 frames, drain (22 frames) revealing the stage | the near-full cover is 6 frames (0.2 s); more than three quarters of the frame is water for 9 frames (0.3 s) |
| Awning transition kept, wind-driven | strain → tear → free → cover → sweep, the cut hides behind it | — |
| Opening: simplified band, larger pad contact, the stop on "stopped" | plain belt, pads twice as large, contact inside *stopped* | the stop is 20 ms before the lock sound, on the /t/ closure |
| Personal danger ~0.8–1.0 s by staging, within the first second | f20–48 = 0.93 s, feet leave at 0.97 s | whether the acting reads at phone size is a viewing question |
| 2–3 clear trajectories, one dominant contact at a time, EQUATOR on the first plate | mug, bicycle (dominant, f71), box, chair (dominant, f138); plate has `EQUATOR` from f82 | four trajectories pass in the street before the wind starts |
| Wind: one sharp consequence, acceleration blur then controlled tracking | the awning tear; blur f182–196 then sharp | — |
| Shared-motion explanation kept, no extra diagram | NORMAL DAY with three arrows | — |
| Latitude comparison during the line, bigger markers/trails, no idle lead-in | chips at 14.6 s / 15.73 s, trails thicker | the markers appear 0.27 s after *Closer* (the pull-out ends at 14.53 s) |
| Brake returns during the final narration, no tail, matched seam, finish the takeaway before the restart | caliper 18.07–19.13 s, pads close from 19.17 s, last word ends 20.05 s, restart 20.5 s | the restart comes 0.45 s after the last word |
| Voice: new take, short natural breaths (0.1–0.3 s; longer only with purpose), no stretching/clipping | take A, 11 gaps shortened by removing the middle of each silence; longest 0.45 s (after *coast.*, deliberate) | whether the breaths feel natural is unlistened; two gaps exceed the 0.3 s guide: 0.32 s and the deliberate 0.45 s |
| Captions rebuilt from the actual voice timeline | 16 cues, ±40 ms | — |
| Sound: retime to corrected contacts, lower the clack so "stopped" stays intelligible, reuse clips, no new music | done; no new generation | the wave hit masks the last /st/ of *coast.* (≈ 150 ms) |
| Deliverables incl. preservation, lockfile, cue/storyboard records, change log, QA notes | `exports/v7/`, `source/package-lock.json`, `audio/v7/cues_v4.json`, `script/STORYBOARD.md`, this report, `QA_NOTES_V4.md` | exports are in git (see §6) |

## 4. Checks performed and checks that remain
Done (measurements and still-frame readings of the encode; `QA_NOTES_V4.md`): container/frames/freezes/static runs, per-scene motion, the loop seam in picture and audio, loudness and true peak on the AAC, narration integrity (silence-only cuts, constant gain), masking proxy (116 voiced windows) and the named hits, event timing, dead-air scan, caption sync (16 cues) and a clean SRT, first-second checklist, boat/pier/transition stills, approximate Shorts-UI overlay, phone-width crops. Defects found and fixed are listed in `QA_NOTES_V4.md`.
**Remaining for a person** (nobody has done these): real-time playback on a phone (muted, then with sound); listening (especially 0.4–0.7 s, 7.9–8.7 s, 11.0–11.4 s and the loop point); judging the shortened pauses; auditioning the generated one-shots; the live Shorts UI; opening the source pages; the ElevenLabs licence; rights confirmation before any commercial-publication recommendation; which Atlas / murder-tip files were uploaded.

## 5. Creative assessment (a reading of stills and numbers; nothing was viewed in motion or heard)
1. **Does the opening stay alive and read?** *In the stills, yes.* Every frame from f0 to f19 changes: the pads close and accelerate while the continents turn, the lock adds a dig-in, sparks and a flash, the dive punches in, and the cut lands on a woman already off-balance. The risk is the same as in V3: whether a plain belt with two oversized pads reads as a *brake* rather than a clamp; that is a viewing question.
2. **Is the personal danger acted?** *By construction, yes.* Twenty-eight frames of changing pose, a fear expression that grows, delayed hair and scarf and a developing coffee stream, with no hold; the cut before contact still leaves her fate open. Whether 0.93 s is long enough to register at phone size is for a person.
3. **Does each shot keep one focal event moving?** *Mostly.* The street has a clear sequence (mug → bicycle → plate → chair) but its first 1.6 s are carried by small objects; the calm NORMAL DAY stage is nearly still by design (frame-difference 1.2), and the globe moves slowly (3.0). The coast is the biggest change: the swell is visible from the first coast frames and the boat is carried up with it; the stills show it riding the face.
4. **Does the coast earn its scale and its consequence?** The stills show the boat lifted, flipped at the lip, the pier post snapping, a deck section flying, the surge running on, and then a flood. Honest flags: the boat is hidden behind the pier deck in the calm phase; the wave is a cartoon cross-section that can still read as a triangle; the hit lands on the final /st/ of *coast.*
5. **Is the pacing tight without being rushed?** Gaps are 0.10–0.45 s and every gap has an effect or ambient layer; the film is 20.5 s (3 s under the editorial target). Whether the breaths feel natural, or the whole thing feels hurried, is unlistened.
6. **Does the ending connect to the next play?** *Measured: yes.* The f614 → f0 picture step is 1.22× an ordinary step (the caption change); globe orientation, rotation rate, pad gap and the strain are shared; the audio seam step is within the ordinary sample-to-sample range. Whether the closing pads (from 19.17 s) feel like an invitation or a stutter, and whether 0.45 s after the last word is the right breath before the restart, needs a person.

## 6. Spend, commit record
ElevenLabs (estimates carried from the V3 price check, not billing): V4 narration (2 variations) ≈ 604 credits, Scribe ≈ 40. **No sound-effect generation, no Eleven Music, no Runway** (nothing new). No AI frame votes, no viewer subagents.
Commits on `claude/fgw-earth-stops-short` (all pushed): V4 work-in-progress `6e806ce`, `77fccbb`; the review cut and these documents: see `git log` (the commit that contains `exports/v7/` is recorded in `PRODUCTION_STATE.md`). V3 `243eb4d` and its checkpoint branch, V2 `f6f000b` and V1 `701648d` are untouched.
