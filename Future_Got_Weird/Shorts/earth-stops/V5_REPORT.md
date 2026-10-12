# V5 report — Earth Stops. You Don't. (final clarity review cut)

**Status: complete V5 review cut built (20.5 s, 1080 × 1920, 30 fps, 615 frames, loops). Awaiting the owner's one whole-film review. Not published, not uploaded, not scheduled. No pull request. No claim of final readiness, and no prediction of performance.** Branch `claude/fgw-earth-stops-short`. Preserved: V4 `2fb391a` (branch `claude/fgw-earth-stops-v4-checkpoint-2fb391a`, verified on `origin`; `checkpoints/v7/CHECKPOINT.md`; V4 exports untouched in `exports/v7/`), V3 `243eb4d`, V2 `f6f000b`, V1 `701648d`. Tag pushes are refused by the remote, so checkpoints are branches and commit hashes.

**I could not watch or listen to this film.** Everything I say about how it looks and sounds comes from decoded still frames and measurements; the sections below say which is which. The creative assessment (§5) is a reading of stills and numbers, not a viewing report, and **nothing here establishes audience comprehension** (contact sheets, motion metrics and audio ratios do not).

## 1. Deliverables (`exports/v8/`)
| File | What |
|---|---|
| `FGW_EarthStops_V5_Review_1080x1920.mp4` | **the V5 review master**: picture, Test Voice, captions, sound (with the tension swell); h264 + AAC, 1080 × 1920, 30 fps, 20.5 s |
| `FGW_EarthStops_V5_ReviewNoMusic_1080x1920.mp4` | the same without the swell — **the safer file to review sound on** |
| `FGW_EarthStops_V5_Review_Preview_540x960_labeled.mp4` | smaller preview (burned label "V5 REVIEW PREVIEW … not final … unpublished") |
| `FGW_EarthStops_V5_Silent_1080x1920.mp4` | picture only (watch this muted first) |
| `FGW_EarthStops_V5_VoiceOnly_48k.wav` / `.mp3` / `…_VoiceOnly_1080x1920.mp4` | the narration alone (byte-identical to V4's) |
| `FGW_EarthStops_V5_SFXOnly_…mp4`, `…_MusicOnly_…mp4`, `stems/` | sound design alone; the swell alone; 48 kHz stems (mix, no-music mix, voice, sfx, music) |
| `FGW_EarthStops_V5_Captions.srt` | the 16 cues (also burned in; unchanged from V4) |
| `FGW_EarthStops_V5_Script.md` | final script |
| `EXPORT_METADATA.json` / `.md` | verbatim ffprobe, size, sha256, counted frames, exact commands |
Also: `script/` (SCRIPT, STORYBOARD, CLAIM_LEDGER, SOURCES; V1–V4 versions in `history/`), `audio/v8/` (cues, 109-entry log `v5/SFX_LOG.csv`, stems, `MIX_LOG.json`; the voice is `audio/v7/voice/`, unchanged), `qa/v8/` (QA, scene motion, V4/V5 picture diff, flagged-window measurements, opening probe, caption sync, audio measurements, sheets of the decoded encode, UI overlay, phone width), `source/` (reproducible Remotion project + lockfile; V5 = `source/src/film5/`, compositions `FilmV5`, `FilmV5-Clean`), `credits.md`, `QA_NOTES_V5.md`, `handoff/OWNER_APPROVAL_V5.md`.

## 2. V4 → V5 change log (final timecodes, 30 fps)
**Everything outside the rows below is picture-identical to V4**: the mean absolute frame difference V4 vs V5 is 0.33 or less on every frame except f20–47 and f197–224 (`qa/v8/V4_V5_PICTURE_DIFF.json`; the residual is encoder noise). The narration, pauses and captions are V4's.
| Time | V4 | V5 |
|---|---|---|
| 0.00–0.67 | brake closing, lock at 0.50 s, dive, cut at 0.67 s | **unchanged** (f0–19 identical) |
| 0.67 (f20) | she is already mid-stumble, the cup already pouring, the lowest foot riding along with her | **a grounded step**: her near heel strikes at f20 and is **pinned to the pavement in world coordinates** — the camera rides east at a constant 32 world px per frame (her momentum is retained, the ground stopped), so the planted foot slides back under her at ground speed while a contact shadow, dust and later a scuff stay on the pavement; the cup is upright, her eyes are on the pavement |
| 0.73–0.83 (f22–25) | — | **the leg compresses** (hip 260 → 218 px, a 16 % crouch) while her **torso keeps going** (lean 6° → 26°), the free leg tucks and swings through, the far arm counter-swings; the foot has been on the pavement for 5 frames |
| 0.83–0.87 (f25–26) | — | **balance breaks**: the cup tips (upright until f24, 24° at f25, 88° at f27), the near arm throws it forward, the torso pitches (33°); **the supporting foot is released and dragged off at f26 (0.87 s)** (scuff mark, dust) |
| 0.90–0.97 (f27–29) | lift began around f26–27 | **coffee escapes at f27 (0.90 s)**; the near foot is clear at f28; **both feet are more than 30 px off the pavement at f29 (0.97 s)**; fear grows (brows up, mouth opens from 0.65 to 1.3, eyes lift from the ground) |
| 0.97–1.60 (f29–48) | she rose to 112 px and stayed there | **a short parabola**: a little vault velocity from the foot, then gravity (apex about f40, descending toward the cut), torso pitched 46–62°, bun and scarf trailing, coffee in unequal drops, the lamp post looming; **cut at f48 before any contact** (unchanged) |
| 6.57–7.47 (f197–224) | debris, palms, flag; the awning strains | **a second adult** (the cast's "regular person": auburn bob, light-blue shirt, brown trousers) **enters from the left in the middle ground at f197, already off the pavement, is carried east faster than the camera tracks (about 52 px per frame relative to it) with an involuntary flail, passes behind the foreground post (f201–207), crosses in front of the street and is gone by f224 (0.93 s on screen)**, before the awning tears (7.87 s); no collision, no fate; the opening woman does not reappear |
| 7.87–8.63 | awning tear, free, cover | unchanged |
| 0.52 / 0.56–0.96 | lock clack in the /t/ closure | clack unchanged; the effects' speech band and sibilant band are **reduced by 8 dB / 4 dB on the vowel and the closing /pt/ of *stopped*** |
| 7.86–9.12 | awning rip/flap/whump vs *debris through the streets* | effects reduced by 9 dB / 3 dB on *debris* (7.86–8.38 s) and 8 dB / 3 dB on *through the streets* (8.42–9.12 s) |
| 11.12–11.38 | the wave crash on the final /st/ of *coast.* | **speech band −16 dB, sibilant band −10 dB on the crash for 0.26 s (15 ms attack, 100 ms release)**; the thump, the sub and the timing are unchanged |
| opening sound | shoe chirp at f20, launch at f27, coffee from f23, splats f34/f40 | **heel strike f20, shoe drag f21–26, toe chirp f24, release f26, coffee stream f27, splats f36/f42**; air rush grows from a lower start |
| wind sound | — | **the second person's shoe skid (f195) and one quiet cloth flutter (f198–224)** |
| events | 101 | 109 (four new Foley events, four speech-protection windows logged) |

## 3. The brief against what was built
| Brief | What V5 does | Caveat |
|---|---|---|
| Preserve V4 and its strengths; exports/v7 untouched; distinct V5 set | `claude/fgw-earth-stops-v4-checkpoint-2fb391a`; `film5/`, `exports/v8/`; V4/V5 picture diff shows the rest unchanged | — |
| Opening: keep Earth, brake, lock near *stopped*, street entry ~0.67 s, no calm intro | f0–19 identical to V4; f20 is a step but with the cup upright, eyes down and the ground streaming | the first step is on screen for 0.23 s |
| Foot contact pinned in world coordinates through the camera movement, coherent contact shadow, leg compression | two-bone IK to a world-pinned contact point, checked numerically: the shoe is within 2.5 px of the pavement on f20–26 and the contact point moves at exactly the ground speed (37.8 px per frame on screen); the contact shadow and scuff are drawn in world space | the contact is a few frames of a fast shot; whether it reads at normal speed on a phone is a viewing question |
| Torso continues east while the foot resists; balance breaks; supporting foot loses contact; coffee escapes eastward; both feet off by ~0.97 s; fear grows | f22–29 as above; both shoes > 30 px off at f29 | — |
| No voluntary jump, spring launch, random float or rigid translation | a small vault velocity from the planted foot, then gravity; apex about 51 px (rig) at f40 and descending; limbs articulate through every frame | the carry from f29 still shows a body in the air for 0.6 s, which is the hypothetical's point |
| Cup starts upright enough to show a change | upright until f24, tips f25–27 | — |
| Danger within the first second | feet clear at 0.97 s; the loss of footing starts at 0.83 s | — |
| One additional adult, ~6.6–7.7 s, 0.6–0.9 s to register, readable silhouette, before the awning takes over, no captions overlap, no crowd | f197–224 (6.57–7.47 s, 0.93 s on screen); about 550 px long (1.55 rig scale, head about 180 px); well below the caption lane; gone before the tear | slightly longer than 0.9 s counting his legs leaving the frame; the awning edge enters at f212 so for ~5 frames he crosses it (he is in front of it) |
| Approved cast member, limited new artwork | CAST.person in the existing side rig; only his shirt tail is new | **identity check owed**: a side view of another cast member is an extrapolation, as the opening woman's was |
| Same world direction, depth/occlusion | east = screen-right; behind the foreground post, in front of the awning | — |
| Speech clarity: confirm or correct the flagged effects | measured; local reductions on *stopped*, *debris through the streets* and the final /st/ of *coast.* | **not confirmed by ear**: see §4 |
| No narrator muting, clipping, speeding, long gaps or global gain raise | none done; the voice file is byte-identical to V4's; loudness is the same (−15.5 LUFS / −1.5 dBTP) | — |
| Retime footsteps, scuffs, coffee; subtle Foley for the second person | done (see §2) | — |
| About 20.5 s | 20.5 s, 615 frames | — |
| Deliverables, QA notes, preservation, commit/push | `exports/v8/`, this report, `QA_NOTES_V5.md`; §6 | — |

## 4. Checks performed and checks that remain
Done (measurements and still-frame readings of the encode; `QA_NOTES_V5.md`): container, frame count, freezes, static runs, per-scene motion; V4/V5 picture difference per frame; the opening foot/ground numbers (`qa/v8/OPENING_PROBE_V5.json`); first-second stills and the second-person sequence on the encode; loop seam (picture and audio); loudness on the AAC; narration integrity; masking proxy (116 voiced windows: **none below +6 dB**, V4 had two) and the V4-flagged windows in the speech and sibilant bands (`qa/v8/FLAGGED_WINDOWS_V4_V5.json`); event timing; dead-air scan; caption sync and a clean SRT; approximate Shorts-UI overlay and phone-width crops.
**Remaining for a person** (nobody has done these): watching at normal speed on a phone, muted then with sound; listening on a phone speaker and headphones, especially at 0.5–1.0 s (*stopped*), 7.9–9.1 s (*debris through the streets*) and 11.1–11.4 s (*coast.*), because **intelligibility is unverified by ear**; judging whether the planted foot and the loss of footing read at that speed; whether the second person reads as a person at phone size and as another consequence rather than a gag; the live Shorts UI; opening the source pages; the ElevenLabs licence; rights confirmation before any commercial-publication recommendation; which Atlas / murder-tip files were uploaded.

## 5. Creative assessment (a reading of stills and numbers; nothing was viewed in motion or heard)
1. **Does the opening show footing being lost?** *In the stills, yes.* f20–25 show one planted foot with a shadow, a crouch and a torso that keeps going; f25–29 show the cup tipping, the foot dragged off, coffee escaping and the feet clear. The risk is time: the planted foot is on screen for 0.23 s of a shot that is already fast, so it may register as a feeling of "tripping" rather than as an analysed foot. The frames also show a less floaty carry than V4.
2. **Does the second person broaden the stakes without stealing the awning?** In the stills he is a clear person crossing the middle ground, behind the post and in front of the street, and he is gone before the tear. Risks: his light-blue shirt is near the colour family of the opening woman's jacket (different skin, hair and no glasses/bun were the guard), and he flies in the same pose family as her (pitched, arms forward); whether that reads as "another victim" or as a repeat is a viewing question. He reads as a person at 360 px width (`qa/v8/PHONE_WIDTH_V5.png`) but his face is small.
3. **Are the flagged words clearer?** The measurements say the effects are further under the voice on all three words (speech-band margin: *stopped* +22 → +30 dB, *debris* +30 → +37 dB, *through the streets* +29 → +35 dB; sibilant band on the final /st/ of *coast.*: 0 → +10 dB; its speech band is still −6 dB because the crash's thump leaks above 300 Hz). That is a spectral proxy, **not intelligibility**.
4. **Has anything regressed?** The picture outside the two changed windows is identical to V4's by measurement; the boat, pier, captions, explanation and loop are therefore as in V4 (as unviewed as before).

## 6. Spend, commit record
No ElevenLabs generation (no voice, no sound effects), no Eleven Music, no Runway. No AI frame votes, no viewer subagents.
Commits on `claude/fgw-earth-stops-short` (all pushed): V4 `2fb391a` (checkpoint branch above); V5 work is committed after it — see `git log` (the commit that contains `exports/v8/` is recorded in `PRODUCTION_STATE.md`). V3, V2 and V1 checkpoints are untouched.
