# V3 report — Earth Stops. You Don't. (complete review cut)

**Status: complete V3 review cut built (24.8 s, 1080 × 1920, 30 fps, 744 frames, loops). Awaiting the owner's one whole-film review. Not published, not uploaded, not scheduled. No pull request. No claim of final readiness, and no prediction of performance.** Branch `claude/fgw-earth-stops-short`. Preserved: V2 `f6f000b` (branch `claude/fgw-earth-stops-v2-checkpoint-f6f000b`, `checkpoints/v5/CHECKPOINT.md`, V2 exports untouched in `exports/v5/`), V1 `701648d`. Tag pushes are refused by the remote, so checkpoints are branches and commit hashes.

**I could not watch or listen to this film.** Everything I say about how it looks and sounds comes from decoded still frames and measurements; the sections below say which is which. The creative assessment (§5) is therefore a reading of the stills and the numbers, not a viewing report.

## 1. Deliverables (`exports/v6/`)
| File | What |
|---|---|
| `FGW_EarthStops_V3_Review_1080x1920.mp4` | **the V3 review master**: picture, Test Voice, captions, sound (with the tension swell) |
| `FGW_EarthStops_V3_ReviewNoMusic_1080x1920.mp4` | the same without the swell — **the safer file to review sound on** |
| `FGW_EarthStops_V3_Review_Preview_540x960_labeled.mp4` | smaller preview (540 × 960, burned label "V3 REVIEW PREVIEW … not final … unpublished") |
| `FGW_EarthStops_V3_Silent_1080x1920.mp4` | picture only (watch this muted first) |
| `FGW_EarthStops_V3_VoiceOnly_48k.wav` / `.mp3` / `…_VoiceOnly_1080x1920.mp4` | the narration alone, aligned to the film |
| `FGW_EarthStops_V3_SFXOnly_…mp4`, `…_MusicOnly_…mp4`, `stems/` | sound design alone; the swell alone; 48 kHz stems (mix, no-music mix, voice, sfx, music) |
| `FGW_EarthStops_V3_Captions.srt` | the 14 cues (also burned in); no overlaps, single spaces |
| `FGW_EarthStops_V3_Script.md` | final script |
| `EXPORT_METADATA.json` / `.md` | verbatim ffprobe, size, sha256, exact commands |
Also: `script/` (SCRIPT, STORYBOARD, CLAIM_LEDGER, SOURCES; V1/V2 versions in `history/`), `audio/v6/` (voice with provenance, 10 new generated clips + manifest, cues, 101-event log `v3/SFX_LOG.csv`, stems, `MIX_LOG.json`), `qa/v6/` (QA, caption sync, audio measurements, stills, encode sheets, UI overlay, phone width), `source/` (reproducible Remotion project + lockfile; V3 = `source/src/film3/`, compositions `FilmV3`, `FilmV3-Clean`), `credits.md`, `QA_NOTES_V3.md`, `handoff/OWNER_APPROVAL_V3.md`.

## 2. V2 → V3 change log (final timecodes, 30 fps)
| Time | V2 (25.33 s) | V3 (24.8 s) |
|---|---|---|
| 0.00 | mid-lunge, no visible cause; inset globe stops at 0.10 s | **an oversized brake is already closing on a large turning Earth** (pads 95 px from the ring); `WHAT IF` tag; narration "If Earth…" |
| 0.47 | — | **lock on *stopped*** (f14): 3 px recoil, spin dead; no deformation, no shock ring; clack + mid body + sub; the hum is cut dead |
| 0.50–0.67 | — | punch-in at the contact point, **action cut at 0.667 s** to the equatorial street |
| 0.67–1.03 | calm walk after a rewind | **she is carried east**: feet off the ground, scarf and coffee streaming, a lamp post looming (danger inside the first second) |
| 1.03–1.20 | — | **5-frame suspended beat** (intentional hold; the supporting sound layer drops to near-silence), then the cut: the collision is never shown |
| 1.20–5.0 | walk, tags, rewind, plate | **the street stands still, everything loose streams east**: mug, **bicycle hits the lamp post (2.30 s)**, **a chair hits the palm (2.47 s)** — in the narration's pause after *east* — boxes, a pot, chairs, a foreground bin; `GROUND 0 MPH` (1.4 s), `~1,000 MPH` plate on *thousand* (2.9 s), `EQUATOR` on *equator* (4.27 s) |
| 5.0–7.9 | still shared-motion beat (6–9 s was the quietest picture) | **wind**: the camera rides east with the debris, palms bend flat, flags stream, posts sweep the lens (5.9–7.1 s), a torn awning crosses the lens and **hides the cut** (7.5–7.9 s) |
| 7.9–13.1 | plaza, then coast at 14.8 s | **the ocean is the biggest beat**: a swell rises at 8.3 s and keeps growing (to ~860 px), **hits the pier at 10.60 s**, overtops the foreground at 11.20 s and hides the skyline; 3.3 s without narration for it to play; a foam-edged water band carries the cut (11.8–13.07 s) instead of a bubble transition |
| 13.1–15.7 | `NO SLOSH` lens, equal arrows | one demonstration, after the consequences: **`NORMAL DAY`**, three equal arrows on *you / move / with* (14.33, 14.53, 14.70 s) |
| 15.7–19.9 | latitude globe move at 18.7 s | pull-out onto Earth (15.67–16.53 s) and **one moving globe comparison** with markers (long at the equator, short near a pole), tilt move 16.93–18.87 s |
| 19.9–24.8 | sip on "real"; hard-cut loop | **the loop**: same Earth, same camera; the equator line grows into the rotor ring (20.13–20.93 s); the brake slides back in (23.27–24.07 s); **the pads start to close at 24.2 s** exactly as at frame 0; the strain bed runs across the seam; no sip, no reset gag, no end screen |
| words | 68, S1–S7 | **55** (the brief's script, verbatim); speech 0.05–22.73 s |
| captions | 18 cues | 14 cues; SRT overlap and double space fixed |
| sound | 107 events, swell inaudible (≈ −50 dBFS) | 101 events with a job each; loop-continuous bed; controlled silences (the beat, the 12 frames before the wave); five new generated one-shots; swell raised to be audible in the voice gaps; no-music mix |

## 3. The brief against what was built
| Brief | What V3 does | Caveat |
|---|---|---|
| One coordinated V3 from V2, no per-shot gates | yes | — |
| Absurd readable trigger; **brake arrests spin, not orbit**; impossible metaphor | oversized brake on a rotor ring; the ledger and the script say the stop is imaginary | whether the ring reads as a *brake rotor* or as a measuring tape is a viewing question (its ticks look like a ruler in the stills) |
| First second: Earth dominates, pads closing, `WHAT IF`, contact 0.30–0.50 s on "stopped", cut/dive 0.50–0.75 s, lamp post 0.75–1.0 s, no collision | f0 / f14 (0.467 s) / f20 (0.667 s) / lamp f25–35, no contact shown | the lock clack sits on the word *stopped* (proxy −7.5 dB at 0.4 s): the first listening check |
| Escalation: loose objects 3–6 s, wind by ~6 s, ocean largest 9–14 s | objects 1.2–5 s, wind visible from 3.3 s and dominant 5–7.9 s, coast from 7.9 s (swell 8.3 s, hit 10.6 s) | the ocean section is earlier than the brief's 9–14 s window because the narration is compact (the whole film is 24.8 s) |
| Explanation after the major consequence; one demo (14–18 s) and one globe comparison (18–21 s) | demo 13.1–15.7 s; globe 16.5–19.9 s; the loop return 19.9–24.8 s | both sit ≈ 1 s earlier than the brief's windows; the finale (4.9 s) is longer than "final 3–4 s" because the ring and caliper return need the time |
| Screen-right = east; same woman; palette | yes | the woman does not appear between 1.2 s and 13.1 s (her fate is left open by design) |
| Remotion drives everything; Runway only for the coast if inspectable | Remotion only | the V1 Runway clip's host is still refused; no Runway generation in V3 |
| Voice: Test Voice, new coherent take, no stretching | take B cut at its pauses; silence added at four cuts; no stretch | unlistened |
| Sound: distinct physical sounds per beat, silence before big events, no repeated whooshes, midrange impacts, reuse V2, generate only missing | 101 events; gates at 1.03–1.20 s and 10.2–10.6 s; post passes are pitched-down pressure pulses, not whooshes; five new clips for the missing sounds | nothing heard; the swell is audible only in gaps |
| Loop: same composition, pads begin closing in the final fraction of a second, signalled reset, bed joins without click, repeated impact only at next contact, no end screen | pads close from f726 (0.6 s before the end, `padGap(t)` shared with frame 0); the ring/caliper return is the signal; audio continuous by construction | the closing starts 0.6 s before the end, not "a fraction of a second"; the seam is measured, not seen in motion |
| Captions: large, 1–2 lines, faces/contact/props/crest clear | per-cue vertical offsets keep the lane clear; Shorts overlay mock; phone crops | approximate UI; small chips |
| QA: state precisely what was viewed/heard | `QA_NOTES_V3.md` §A–C | no playback by me |
| Deliverables incl. durable preservation, lockfile, commit/push record | `exports/v6/`, `source/package-lock.json`, §6 | the exports are in git |

## 4. Checks performed and checks that remain
Done (measurements and still-frame readings of the encode; `QA_NOTES_V3.md`): container/frames/freezes/cuts, the loop seam in picture and audio, loudness and true peak on the AAC, narration integrity (cut-only, constant gain), masking proxy (99 voiced windows), caption sync (14 cues) and a clean SRT, first-second checklist, trajectories and every transition on stills, approximate Shorts-UI overlay, phone-width crops. Defects found by this QA and fixed are listed in `QA_NOTES_V3.md`.
**Remaining for a person** (nobody has done these): real-time playback on a phone (muted, then with sound); listening (especially at 0.3–0.7 s, 2.3–2.5 s, 10.2–10.6 s and the loop point); auditioning the generated one-shots; the live Shorts UI; opening the source pages; the ElevenLabs licence; rights confirmation before any commercial-publication recommendation; which Atlas / murder-tip files were uploaded.

## 5. Creative assessment (a reading of stills and numbers; nothing was viewed in motion or heard)
1. **Is the trigger readable?** *Probably, with one risk.* In the stills the two coral pads close on a saffron band around the equator and the planet is never touched; the lock is a recoil and a stop, with no explosion. The risk: the ring's tick marks look like a measuring tape, and the C-bracket may read as "a clamp on a ruler". The first frame has no narration context beyond the caption *If Earth stopped,*, so readability depends on the 0.47 s lock and the caption landing together — which is a viewing question.
2. **Is there personal danger in the first second?** *By construction, yes.* At 0.667 s the picture cuts to her mid-air with the coffee streaming and a lamp post filling the frame by 1.03 s; the collision is withheld. It is a 0.5 s shot plus a 5-frame beat, and whether that is enough to land (or too fast to read) needs a person. The cost: she vanishes until 13 s.
3. **Do the consequences grow?** *Objects → wind → ocean grow in stills and in the numbers* (mean frame change 7 → 21 → 3 (the swell build) → 8 for the hit and flood). The honest flag: after the intense wind (5–7.9 s) the swell build is the *quietest* escalation section (3.1); it is meant as scale growth before the hit, but it may read as a lull. The wave grows from 120 to ~860 px of a 1,920 px frame, which helps; the hit and the flood are strong in the stills.
4. **Does the coast earn its scale?** *It has the ingredients*: a small boat and a three-post pier at the foot of the frame, the crest rising behind them, planks flying at the hit, the water overtopping the foreground, the skyline lost. Whether the pier and boat are small enough to sell the size, and whether the foam-edged band feels like the same water, is for a viewer. The V2 bubble transition is gone.
5. **Does the explanation reward attention?** *It is compact* — one slab with three arrows, one globe — and it comes after the consequences, as asked. Two risks: the globe's markers and trails are small and thin at phone width, and the `NEAR A POLE` chip is small; and the calm slab is a different scene from the street, so the woman's return is not a resolution of her danger.
6. **Does the final movement connect to the next play?** *Measured: yes.* The f743 → f0 picture step is 1.16× an ordinary step; globe orientation, rotation rate, pad position and the strain are shared across the seam; the audio seam step is within the ordinary sample-to-sample range. What no measurement shows is whether the closing pads at 24.2 s feel like an invitation or like a stutter, and whether a viewer will register the restart.

## 6. Spend, commit record
ElevenLabs (estimates by price check, not billing): V3 narration (2 variations) ≈ 604 credits, Scribe ≈ 40, five new Sound Effects prompts (10 clips) ≈ 167. Runway: nothing new. No Eleven Music, no Runway audio, no AI frame votes, no viewer subagents.
Commits on `claude/fgw-earth-stops-short` (pushed): V3 work-in-progress `99297ba` ("V3 WIP: new brake opening, street/wind/coast/explanation/loop scenes…"); the V3 review commit and the documentation-only commit that records its hash are listed in `PRODUCTION_STATE.md`. V2 baseline `f6f000b` and its checkpoint branch, and V1 `701648d`, are untouched.
