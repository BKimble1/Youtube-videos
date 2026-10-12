# V1 report — Earth Stops. You Don't. (complete review cut)

**Status: complete V1 review cut built (34.5 s, 1080 × 1920, 30 fps, 1,035 frames). Awaiting the owner's one consolidated whole-film review. Not uploaded, not scheduled, not published. No pull request. No V2 work started.** Branch `claude/fgw-earth-stops-short`. Checkpoints: hook H1 `dea9b81` (branch `claude/fgw-earth-stops-hook-h1-checkpoint-dea9b81`, `checkpoints/v3/`), prototypes `a885fd5`, v1 `0783b00`. Tag pushes are refused by the remote.

## 1. What was delivered (`exports/v4/`)
| File | What |
|---|---|
| `FGW_EarthStops_V1_Review_1080x1920.mp4` | **the review**: picture, Test Voice, burned-in captions, procedural sound |
| `FGW_EarthStops_V1_Silent_1080x1920.mp4` | picture only (watch this muted first) |
| `FGW_EarthStops_V1_VoiceOnly_48k.wav` / `.mp3` / `..._VoiceOnly_1080x1920.mp4` | the narration alone, aligned to the film |
| `FGW_EarthStops_V1_SFXOnly_1080x1920.mp4` | the sound design alone, on the picture |
| `FGW_EarthStops_V1_Script.md`, `..._Captions.srt` | final script; the 23 caption cues |
| `EXPORT_METADATA.json` / `.md` | ffprobe, sha256, exact commands |
| `QA_NOTES_V1.md`, `qa/v4/QA_V1.json`, `qa/v4/sheets/` | concise QA notes; numbers; every frame as contact sheets |

## 2. The brief against what was built
| Brief | What V1 does | Caveat |
|---|---|---|
| All scenes built, purposeful transitions, consistent characters | Six scenes, no placeholders (`script/STORYBOARD.md`). Transitions: iris out of the hook's globe → dive into her icon → whip pan → slanted push wipe → sea fills the frame → disc becomes the globe → match-zoom dive → match-zoom pull-back → loop. Same cast member and same street throughout; cat, pigeon, bicycle and plaza share the street | Nothing was seen in motion by a person |
| Full Test Voice narration, synced captions, physical sound | 101 words, one generation, take A unmodified; 23 caption cues within −120…+13 ms of their first word (first cue starts late on purpose); 137 procedural sound events, no music | Voice and sound **never listened to** |
| Bus removed; air-and-ocean kept | S4 is now "Stop the ground, and anything that isn't fixed to it keeps going." (plaza: loose things leave, fixed things stay). S5: wind, then sea surge over beach, wall and promenade, then the water fills the frame | Surge is drawn for legibility, not to scale (ledger V9) |
| Clear hypothetical framing | "What if" first; `WHAT IF` tag from f0 until after "None of this can really happen" (peels at f776–792) and returns for the loop; the ending says it in words | |
| Accurate speed qualifications | plate `~1,000`; `EQUATOR` chip in the hook, in B06 and on the globe; S6 "it starts at"; chart `STARTING SPEED ONLY`; computed 1,040 / 798 / 181 mph vs Category 5 at 157; S7 "At the equator" | "about a thousand" is 3.9 % under 1,040 (ledger open item 3) |
| Coffee payoff | she rides the globe east; dive; close-up with the world streaking past while she and the mug are calm; she sips, nothing spills; pull-back; loop to frame 0 | the streaks are a frame-of-reference device, not a measurement (ledger V10) |
| Runway where a shot benefits | one test on the B04 surge; its video could not be downloaded here, so it is **not** in the film (`script/STORYBOARD.md`) | see §6 |
| Preserve checkpoints; commit and push | `checkpoints/v3/CHECKPOINT.md` (H1 at `dea9b81`); everything committed and pushed to `claude/fgw-earth-stops-short` | |
| Export film, voice-only, final script, concise QA | see §1 | |
| Inspect everything; identify unavailable checks | `QA_NOTES_V1.md` (the exact reading history and the unavailable checks) | measurements are not creative quality |

## 3. The film, beat by beat (time from the voice)
| Time | Line | What happens |
|---|---|---|
| 0.0–6.1 | "What if Earth stopped—right now? This street was moving east at about a thousand miles an hour." | The H1 hook: blurred globe stops dead at 0.17 s, street takes over, she is flung east, brake, `0 MPH` / `~1,000 MPH` tags, rewind, `EAST`, `EQUATOR`, `~1,000 MPH` |
| 5.9–10.4 | "So was everything on it. You can't feel it, because it all moves together." | globe iris; icons with equal arrows; dive into her; `NO SLOSH` on her cup; `ALL MOVING EAST — TOGETHER` |
| 9.7–14.9 | "Stop the ground, and anything that isn't fixed to it keeps going." | whip pan to the plaza; on "Stop" the globe stops and every loose thing leaves; `FIXED` / `LOOSE →` |
| 14.1–18.3 | "At first, the air keeps going. So does the ocean." | push wipe to the coast; palms, flag, litter, pigeon; then the sea surges east and fills the frame |
| 18.0–24.9 | "Farther from the equator, it's slower—but even at eighty degrees north, it starts at Category five hurricane speed." | the planet from above the pole; rings at true radii; bars 1,040 / 798 / 181; axis zoom; 157 line; `STARTING SPEED ONLY` |
| 24.2–34.5 | "None of this can really happen. But the motion is real. At the equator, her coffee's been moving about a thousand miles an hour all along. It just never spilled." | still globe, tag peels, she rides the globe, dive, calm close-up with streaks, sip, pull-back, loop |

## 4. Measured facts that matter (full list: `QA_NOTES_V1.md`)
- Encoded file: 34.500 s; −15.8 LUFS, −1.5 dBTP; AAC aligned to the WAV (0 samples); no black frames, no jump cuts; the loop seam is as smooth as any adjacent frame pair.
- Quietest picture: seconds 19–23 (B05 chart) and 25 (still globe) — motion energy ≈ 1 against a median of 2.5. Busiest: the hook, the dives, the loop.
- Speech-to-sound proxy: median +26 dB, 9 of 187 voiced windows below +6 dB; the worst is 0.6 s (launch scuff under the tail of "Earth", −14 dB) — unlistened, may shave that word.
- The hook's stop (0.17 s) still lands 0.55 s **before** the spoken "stopped" (0.72 s).

## 5. What to judge in the whole-film review (nobody has done any of this)
1. **Opening.** Does the hook read as an event, muted? Does the globe → street link work? Is 6 s too long before the idea of "everything moves together" arrives?
2. **Story.** Does the order (premise → shared motion → stop → air/ocean → latitude → payoff) hold you? Does the latitude beat (B05) feel like a detour or a turn?
3. **Scientific accuracy.** Read `script/CLAIM_LEDGER.md`; decide on "about a thousand" (3.9 % low), the `NO SLOSH` lens, the cat-and-boat icon diagram, the not-to-scale surge, the Category 5 comparison. **All sources are excerpt-only.**
4. **Visual intensity.** B03/B04 are the loud middle; B05 is calm; is that the right shape? Is the all-teal beat (0.2 s at f541) acceptable?
5. **Character movement.** Walk cycle, close-up pose and sip, the calm stance on the globe, the icon scale on the globe. Side-view identity check is still owed.
6. **Transitions.** Eight devices (see §2); which one feels like a trick, which a cut-through?
7. **Captions.** Size (68 px), lane (y ≈ 450–650), one coral word per cue, line breaks; collisions with chips and the Shorts UI.
8. **Narration.** Performance of take A (and take B exists on disk): pacing, emphasis on "can't", "None", "never"; whether the numbers land.
9. **Sound.** Whether the two stops (hook, "Stop") are heard; the plaza scrapes; the surge; the sip; any effect that distracts or is too loud; the bed. No music was added: say whether you want any.
10. **Ending.** Sip → pull-back → loop to the hook: does it work as a punchline, and does the loop feel like a loop or a reset?

## 6. Runway
One generation: seedance-2, 5 s, image-to-video from a Remotion still of the coast, asking for the sea to surge east over the wall with the jetty, lamp, wall and buildings still, flat vector style (task `901f6225-4775-460e-b5e2-2836d4bf2d2d`, **180 credits**). The task succeeded and the one preview frame it returned kept the flat-vector look, but **the video's host is denied by the sandbox network policy**, so I never saw its motion and did not use it. I do not claim it would have helped or failed. To judge it: allow `dnznrvs05pmza.cloudfront.net` or open the task in Runway. Nothing else was generated with Runway (no audio, no music).

## 7. Spend and tools
ElevenLabs: full-script Test Voice (2 variations, ≈ 1,100 credits by price check) and one Scribe; Runway: 180 credits; WebSearch earlier for source excerpts. **Not run:** Eleven Music, ElevenLabs/Runway sound effects, any music. No AI frame votes or viewer subagents. No pull request. Nothing uploaded or published.

## 8. Needs the owner (see `PRODUCTION_STATE.md`)
Watch and listen; check the live Shorts UI; allow the blocked source hosts (or open S1, S2, S5, S7, S9); say which Atlas/murder-tip files were uploaded; give **one coordinated V2 brief**.
