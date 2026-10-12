# Hook H1 report — hybrid opening (E-C causal connection + E-A v2 street action)

**Status: hook built, awaiting the owner's own viewing and listening. Not uploaded, not scheduled, not published. The rest of the film is not built.** Branch `claude/fgw-earth-stops-short`; prototype checkpoint `a885fd5` preserved (`checkpoints/v2/CHECKPOINT.md`).

## 1. What was delivered
| | Path |
|---|---|
| Hook, picture + voice + SFX (6.0 s, 1080×1920, 30 fps, 180 frames) | `exports/v3/FGW_EarthStops_Hook_H1_VoiceSFX_1080x1920.mp4` |
| Silent (picture only, with captions, tag and graphics) | `exports/v3/FGW_EarthStops_Hook_H1_Silent_1080x1920.mp4` |
| Silent, **clean** (no captions, tag or graphics: for judging the picture alone) | `exports/v3/FGW_EarthStops_Hook_H1_Silent_Clean_1080x1920.mp4` |
| Voice only / SFX only (to judge each layer) | `exports/v3/FGW_EarthStops_Hook_H1_VoiceOnly_…mp4`, `…_SFXOnly_…mp4` |
| Script, claim ledger, sources, storyboard + sheet | `script/SCRIPT.md`, `script/CLAIM_LEDGER.md`, `script/SOURCES.md`, `script/STORYBOARD.md`, `script/storyboard/STORYBOARD_SHEET.png` |
| SFX audition (3 candidates per cue + a listening reel) | `audio/v3/audition/` (`AUDITION_REPORT.md`, `audition_reel.wav`) |
| Voice provenance and analysis | `audio/v3/voice/NARRATION_PROVENANCE.md`, `VOICE_ANALYSIS_r1/r2.json` |
| QA numbers and sheets | `qa/v3/QA_H1.json`, `qa/v3/sheets/` (all 180 frames, phone key frames), `qa/v3_probe_h1.json` |
| Export metadata (ffprobe, sha256) | `exports/v3/EXPORT_METADATA.json`, `.md` |

## 2. The owner's brief against what was built
| Brief | What the hook does | Evidence (encoded file unless noted) | Caveat |
|---|---|---|---|
| Begin with the event underway; no calm standing pre-roll | Frame 0 is a mid-stride walk under a **blurred, spinning globe**; no standing pose | Sheet f0–f4 | f0–f4 (0.17 s) is still a walk; whether that reads as "calm" is the owner's call |
| Globe's abrupt stop clear within ~0.15–0.25 s, imbalance alongside | **Globe stops dead on f5 (0.167 s)**; her lean begins on the same frame | Globe sharpness 1.22 (f4) → 3.51 (f5); head-to-feet lean 25.5 px (f4) → 62.8 (f5) → 94.7 (f6) → 167.0 px (f7) (`QA_H1.json`) | Measurements, not perception. Picture only; the stop is **0.55 s before the voice says "stopped"** (0.72 s) |
| Street expands to dominate; globe to a small inset or away | Street panel top edge y 820 (f5) → 692 (f8) → 410 (f11) → 128 (f14) → **0 (f17, 0.57 s): full bleed**; globe becomes an inset (centre 915,338, radius 72 px) top right and stays | `QA_H1.json` `street_panel_top_y` | Inset position vs the live Shorts UI not checked |
| Keep larger side-view character, coffee, riderless bicycle; show continued motion against an anchored reference | Side-view hero (same cast member), tapered coffee stream with droplets, bicycle enters f41 and crosses; **lamp posts and palm are anchored** (screen-x range ≤ 2.9 px over f42–65) | `anchored_lamps_screen_x_f42_to_f65`; sheet f42–66 | Side view is an extrapolation of the approved front-view cast (identity check still owed by the owner, as in v2) |
| Remove the coral pulse; stop through motion and a synchronized audio change | No pulse, ring or flash. Stop = blur→sharp on the globe, the street going still, and the audio **cutting to digital silence for 100 ms at f5** | SFX-only RMS −21.1 dB (80 ms before) → −140 dB (100 ms after) | In the **full mix** the voice continues, so the dip is only −13.7 → −16.9 dB (3.2 dB) over those 100 ms. Whether that is a noticeable "audio change" needs listening |
| Advance into the explanation at ~1–1.5 s; replace the prolonged slide | Street goes still by **1.40 s**; `0 MPH` tag lands on the lamp post (f42), `~1,000 MPH →` on the bicycle (f47); then a **rewind** (f66–90) to the "before" state, then the EAST / EQUATOR / number readout | Street band motion 24.6 (f17–27) → **0.03 (f45–65)** while the bicycle moves; rewind 32.4 | The hero holds a stunned pose ≈ 1 s (f45–72) while the bicycle crosses: a motion lull (frame-difference energy ≈ 3–5 there vs ≈ 8–35 elsewhere) |
| Character and mug readable until a deliberate transition; no drift offscreen | Hero extents x 9–922 px on all frames; top 726, bottom 1501; no frame has any hero pixel beyond x = 940 (right rail) | `hero_extents` | Caption lane y 460–620 never meets the hero (min hero top in caption frames 726) |
| Narration from frame zero | First speech sample above 0.01 at **0.038 s** (voice file starts speech 0.03 s in); **not shifted, trimmed or stretched** | `first_voice_sample_over_0.01_s`, `NARRATION_PROVENANCE.md` | |
| First ~5 s | The hook is **6.0 s**: the voice line S2 ends at 5.83 s | | Cutting to 5 s would clip "miles an hour"; I did not rush the voice |
| Hypothetical explicit | `WHAT IF` tag stays on screen for all 6.0 s; the first words are "What if" | | |

## 3. Voice timing (measured on the selected take, `VOICE_ANALYSIS_r2.json`; no time-stretching)
| Item | Time (s) |
|---|---|
| "What" … "stopped" … "Earth stopped" ends | 0.03 · stopped 0.72 · 1.21 |
| Em-dash pause | 1.21–1.57 (0.36 s) |
| "right now?" | 1.57–2.17 |
| Paragraph pause | 2.17–2.74 (0.57 s) |
| "This street was moving **east** (3.84) at about a **thousand** (4.64) miles an hour." | 2.74–5.83 |

Sentence one is 2.14 s, the pause before sentence two is 0.57 s, and sentence two runs 3.09 s. Where the picture lands relative to the voice: picture stop **0.17 s**, voice "stopped" **0.72 s** (picture early by 0.55 s); street still **1.40 s**, voice "right now?" **1.57 s** (picture 0.17 s early); rewind **2.20–3.00 s**, covering the paragraph pause (2.17–2.74); EAST arrow **3.77 s** vs "east" **3.84 s** (0.07 s early); number roll **4.33–5.03 s** vs "thousand" **4.64–5.04 s** (the number *settles* as the word ends); `MPH` **5.13 s** vs "miles" **5.12 s**. The brief asked for the real timing to drive the picture and not the other way round, so the stop does **not** wait for the word.

## 4. Sound (all procedural; none of it listened to)
- **Voice**: ElevenLabs Test Voice (`kk5XaSLo2XAw0sKM98zU`), model `eleven_v4`, 2 rounds × 2 variations; take B of round 2 chosen **by measurement only** (tighter hook, clearer pitch rise on "right now?"; the pitch tracker is noisy, so this is a weak criterion). Scribe returned the sent words exactly. Estimated spend ≈ 220 credits per round (price check), plus two short Scribe runs; **I did not re-read the balance**.
- **SFX**: numpy Foley (`tools/foley_lib.py`), sha1-seeded, no samples, no stock, no generated audio. **Not run:** ElevenLabs Sound Effects, Eleven Music, Runway sound/music. For the five sounds where the choice mattered (planet spin, grip scrape, tag slap, counter, and the stop itself) three candidates each were measured against a stated rule and one picked (`audio/v3/audition/AUDITION_REPORT.md`). **A pick is a measurement proxy**: `audition_reel.wav` plays every candidate (index in the report) so a person can check or overrule it.
- **Mix**: voice −15.5 LUFS / −1.6 dBTP alone; full mix **−15.7 LUFS, −1.5 dBTP** in the AAC inside the mp4 (SFX alone −26.0 LUFS). Left and right channels are identical (mono-safe). SFX groups are set relative to the voice RMS (globe −3 dB, impacts −8, friction −11, liquid −15, graphics −15, …) and ducked under speech (3–6 dB). These are design targets, not listening results.
- **Measured weak spots**: (a) the worst 100 ms speech-to-SFX ratio (300–3400 Hz, voiced frames only) is **−19.6 dB at 0.625 s**, the tail of "Earth" just before "stopped", where the launch scuff (f17) and coffee stream overlap a quiet fricative; the median is +24.8 dB. It may shave the end of "Earth"; unlistened. Fix if it does: move the launch snap two or three frames later or drop it 3 dB. (b) The rewind whoosh is quiet (−29 dB RMS in its stem). (c) The stop's audio change in the full mix is modest (§2).

## 5. What was inspected, and what was not
**Inspected (by me, in this session):** every one of the 180 frames of the **encoded** silent master as four contact sheets (`qa/v3/sheets/H1_all180_part1–4.png`, 216×384 px per frame); 18 phone-width key frames (`H1_keyframes_phone300.png`, 300×533); and scripted measurements of those frames (globe sharpness, lean, hero extents, panel edge, anchored-lamp drift, street-band motion) and of the audio files (loudness, true peak, band ratios, stop-cut RMS, timing). The numbers are in `QA_H1.json` and reproduce with `tools/qa_h1.py`.

**Not done, and not claimable:**
- **Nobody has watched the hook in real time at 30 fps.** Contact sheets cannot show whether the first 0.2 s *reads* as an event.
- **Nobody has listened** to the voice, the SFX or the mix. Every audio statement above is a measurement. Whether the stop sounds like a stop, whether the globe whirr is pleasant or fatiguing, whether the voice performance is right: unknown.
- **The live Shorts UI** (title, channel name, buttons, right rail, bottom caption area) was not overlaid: caption lane (y 460–620), the plate/chips (y ≈ 640–830) and the globe inset (top right) are placed by estimate.
- **No audience evidence of any kind.** No AI frame votes or AI viewer subagents were run, per the brief; I am not offering any substitute.
- **Source pages** were not opened (network policy): see `script/SOURCES.md`. Every claim is "excerpt only".

## 6. Weaknesses I can see (for the owner to confirm or overrule)
1. **The hero is static for ≈ 1 s** (f45–72) while the bicycle crosses: if the first 2.5 s were fast and the next second feels slack on playback, this is why.
2. **Picture-first**: the stop (0.17 s) lands before the voice's "stopped" (0.72 s). It is a deliberate consequence of "no rushing"; a viewer with sound will hear "What if Earth…" over an already stopped planet.
3. **Plate vs caption spacing is tight** at f135–179 (caption "miles an hour." sits directly above the `1,000 MPH` plate); check on a phone.
4. **`1,000` plate has no tilde** (speech says "about", bicycle tag says `~1,000`; exact value 1,040): ledger open item 2.
5. **"This street" is only true near the equator.** The `EQUATOR` chip lands at 4.4 s, *before* "thousand" (4.64 s); it must not be removed.
6. **Walk at f0–4** reads as a walk, not an event; the globe carries the event until f5.
7. **Duration** 6.0 s vs the requested ≈ 5 s (voice-driven).
8. **Side-view identity**: the approved cast sheets have no side view.

## 7. Decisions requested (also in `handoff/` and the storyboard)
(1) Does the hook work on a phone, muted, then with sound? (2) `~1,000` on the plate? (3) Keep or cut the optional bus (S4) and air/ocean (S5) lines? (4) Approve the loop ending or a plain ending? (5) Which Atlas / murder-tip files were uploaded (analytics remain conditional on this)? (6) Allow the blocked source hosts so the ledger can be closed against the real pages? (7) Proceed to B02–B06, or revise the hook first?

## 8. Spend and tools
ElevenLabs: Test Voice speech (2 rounds × 2 variations), 2 Scribe transcriptions, 1 flow. Runway: **not called**. Music: **not generated**. Generated SFX: **none**. WebSearch (standard mode) for source excerpts. No pull request. Nothing uploaded or published.
