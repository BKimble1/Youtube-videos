# V2 report — Earth Stops. You Don't. (complete review cut)

**Status: complete V2 review cut built (25.33 s, 1080 × 1920, 30 fps, 760 frames). Awaiting the owner's one whole-film review. Not published, not uploaded, not scheduled. No pull request. No final-ready claim.** Branch `claude/fgw-earth-stops-short`. Preserved: V1 `701648d` (branch `claude/fgw-earth-stops-v1-checkpoint-701648d`, `checkpoints/v4/CHECKPOINT.md`, V1 exports untouched in `exports/v4/`), hook H1 `dea9b81`. Tag pushes are refused by the remote, so checkpoints are branches and commit hashes.

## 1. Deliverables (`exports/v5/`)
| File | What |
|---|---|
| `FGW_EarthStops_V2_Review_1080x1920.mp4` | **the review**: picture, Test Voice take B, captions, sound (with the tension swell) |
| `FGW_EarthStops_V2_ReviewNoMusic_1080x1920.mp4` | the same without the swell (no-music alternative) |
| `FGW_EarthStops_V2_Silent_1080x1920.mp4` | picture only (watch this muted first) |
| `FGW_EarthStops_V2_VoiceOnly_48k.wav` / `.mp3` / `…_VoiceOnly_1080x1920.mp4` | the narration alone, aligned to the film |
| `FGW_EarthStops_V2_SFXOnly_…mp4`, `…_MusicOnly_…mp4`, `stems/` | sound design alone; the swell alone; the 48 kHz stems (mix, no-music mix, voice, sfx, music) |
| `FGW_EarthStops_V2_Captions.srt` | the 18 cues (also burned in) |
| `FGW_EarthStops_V2_Script.md` | final script |
| `EXPORT_METADATA.json` / `.md` | verbatim ffprobe, size, sha256, exact commands |
Also: `script/` (SCRIPT, CLAIM_LEDGER, SOURCES, STORYBOARD), `audio/v5/` (voice, generated SFX with alternatives and an audition reel, cues, stems, `SFX_LOG.csv`, `MIX_LOG.json`), `qa/v5/` (QA, caption sync, all-frame sheets, UI overlay, phone-width), `source/` (reproducible Remotion project + lockfile), `credits.md`.

## 2. V1 → V2 change log (final timecodes, 30 fps)
| Time | V1 (34.5 s) | V2 (25.33 s) |
|---|---|---|
| 0.00 | calm walk, globe holds the frame until 0.2 s | **frame 0 = mid-lunge**: coffee stream, lamp post as the grounded reference, street full-bleed; inset globe stops at 0.10 s; compact `WHAT IF` tag |
| 1.27–1.43 | tags | `0 MPH` on the lamp post, `~1,000 MPH →` on the bicycle |
| 1.83–2.63 | rewind + prolonged backtracking | **one** `BEFORE` rewind, back to the calm walk |
| 2.64–6.0 | "This street was moving east…" `EAST` + number roll | "At the equator, you're already moving about a thousand miles an hour." `EQUATOR` (2.9 s), east arrow (4.17 s), stable `~1,000 MPH` plate (4.87 s), **no number roll** |
| 6.2–9.7 | globe iris → icon crowd (cat, boat, lamp, house…) → dive → `ALL MOVING EAST — TOGETHER` | **shared motion explained once** on the street: `NO SLOSH` lens (6.8 s), equal arrows on her (7.57), the ground (8.37) and a pigeon in the air (9.17) |
| 9.67–10.53 | whip pan | whip pan east to the plaza (kept, shortened) |
| 10.73–14.9 | "anything that isn't fixed…" many props, `FIXED` | "Stop the ground suddenly, and loose objects initially keep moving east": **three props** (chair tips, box tumbles, bicycle rolls on), `GROUND 0 MPH` on the curb, `LOOSE →`; **no `FIXED`** |
| 14.13–14.87 | slanted push wipe | kept |
| 14.83–18.1 | air then sea, tide fills frame to empty teal at 18.0 s | air (14.83), **sea mass** (16.2 s) past pier posts, buoy and boat, wall (17.13 s), flood; foam spray carries the cut (17.8–18.53 s) — **no empty teal** |
| 18.1–20.5 | pole view, bars 1,040/798/181, 157 line, Category 5, ~6 s static panel | **one camera move** (18.73–19.67 s) from the equator trail to a short trail near the pole; no numbers |
| 20.5–21.1 | — | streak wipe into the payoff |
| 20.87–24.0 | "None of this can really happen…" (10 s) | "The stop is imaginary. The motion is real." calm close-up, `EQUATOR ~1,000 MPH` (21.27 s), **sip on "real" (22.93–24.33 s)** |
| 24.33–25.33 | pull-back and loop | calm hold; **hard cut loop**, no pull-back, no end screen |
| layers | layered globe/street dissolves ~8 s | **none**: pan, push wipe, foam wipe, streak wipe, one rewind |
| captions | 23 cues | 18 cues, one main caption + at most one annotation, all rebuilt from the final narration |
| sound | 137 procedural events + bed, no music | 107 events with a job each; 8 generated ElevenLabs one-shots layered with procedural Foley; selective ducking; sub shelved for phones; optional restrained swell (separate stem) |

## 3. The brief against what was built
| Brief | What V2 does | Caveat |
|---|---|---|
| 24–29 s, voice not sped up or stretched | 25.33 s; take B unmodified (one constant gain) | not listened to |
| Frame 0 shows visible disruption; street dominates; globe a brief inset | yes (lunge, coffee stream, lamp post); globe stops at 0.10 s | the inset stays (small) as the cause cue until the plaza wipe and stops again on "Stop" |
| Shared motion once; avoid icon crowd | three equal arrows + one lens | the still beat (7–9 s) is the quietest picture (motion stat only) |
| Loose objects: 2–3 props, believable tumbles, fixed reference; no "bolted is safe" | chair, box, bicycle; curb is the reference; no `FIXED` | overlap of the bicycle with the box at ≈ 12.5–13.2 s |
| Air/ocean main escalation | pier, boat, buoy, sea mass, wall, flood, foam | illustrative, not to scale |
| Latitude: one move; remove 40°/181/157/Category 5 | done | the pole path is small; the comparison is by memory of the equator trail |
| Payoff direct to calm coffee, no floating globe | done | the loop is a hard cut |
| Clean transitions, no flash or layered dissolves | done | motion not seen at speed |
| Sound: few distinct events, no whoosh on every transition, selective ducking, music only if authorised | 107 events; one whoosh (the streak wipe) plus the swell stem; ducking per group; no licensed music | nothing heard; one masking-proxy window at +5.4 dB (16.5 s) |
| Runway: inspect the clip before spending more | re-checked (task SUCCEEDED, host refused); no new credits | clip **not inspected**; no claim it helped or failed |
| Claim ledger, sources, licence notes | `script/CLAIM_LEDGER.md`, `SOURCES.md`, `credits.md` | R1–R6 were the reviewer's reads; Claude opened none |

## 4. Checks performed and checks that remain
Done (measurements and still-frame readings of the final encode; see `QA_NOTES_V2.md`): container/frames/luma/frozen/jump, loudness and peak, AAC alignment, caption cue boundaries, speech-to-sound masking proxy (V1 windows translated), mono identity, all 760 frames as contact sheets, risky transitions frame by frame, representative Shorts-UI overlay, 360 px phone-width crops.
**Remaining for a person** (nobody has done these): real-time playback on a phone (muted, then with sound); listening to voice, SFX, swell and mix on phone speaker/headphones/mono; auditioning the generated one-shots; the live Shorts UI; opening the source pages; the Runway clip; the ElevenLabs plan's licence for commercial use; Scribe on the final mix; which Atlas / murder-tip files were uploaded.

## 5. Spend
ElevenLabs: V2 narration (2 variations) ≈ 784 credits, Scribe ≈ 40, Sound Effects (16 clips) ≈ 267 — **estimates by price check, not billing records**. Runway: nothing new (the V1 test spent 180). No Eleven Music, no Runway audio, no AI frame votes, no viewer subagents.

## 6. Commit record
V2 work-in-progress commit `6667119` on `claude/fgw-earth-stops-short`, then the final V2 commit (see `git log`; the hash is reported in the hand-off message). V1 baseline `701648d` and its checkpoint branch are untouched.
