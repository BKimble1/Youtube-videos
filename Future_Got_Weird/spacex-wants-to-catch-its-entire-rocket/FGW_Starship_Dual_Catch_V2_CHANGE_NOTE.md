# FGW Starship Dual Catch — V2 change note

21 Oct 2026. Review cut only: not published, no 4K master rendered.

## What was delivered

| Item | Value |
|---|---|
| Review video | `exports/FGW_Starship_Dual_Catch_V2_REVIEW_1080p.mp4` — 1920×1080, 30 fps, H.264 + AAC 48 kHz (parts in `backup/v2/`) |
| Runtime | **5:41.0** (341.0 s): narration ends at 5:35.6, then a 1.4 s close on the restacked ship and a 4 s fade to the FGW wordmark. Target was 5:40–6:10; the length is the real narration plus picture beats, nothing padded |
| Voice | ElevenLabs **Test Voice** `kk5XaSLo2XAw0sKM98zU` (verified in the account's voice list), model `eleven_v4`, the model and voice the Tesla and Death Clock projects used. Flow `CdC6ENlpAGuJ3ocPlCxk` |
| Narration text | The owner's section-F script verbatim (908 words), no wording changes. `script/v2_narration_final.md` |
| Captions | `captions/FGW_Starship_Dual_Catch_V2.srt`, 121 phrase cues, ≤ 42 characters per line, timed from the measured word times. Not burned in |
| Mix | measured −15.0 LUFS integrated, −1.9 dBTP (ffmpeg ebur128, true peak) |
| Editable source | `source/src/v2/` (composition `MainV2`), reusable hardware in `vehicles.tsx` / `site.tsx`, model sheet `V2Lab` |

## Voice: how it was made

1. Opening test (hook only, 4 takes, `[excited]` … `[serious]`). Measured 170–178 wpm with a 14.5–15 semitone pitch range;
   a blind Scribe pass returned all 32 words. Take 4 (`Zr65jos3…`) kept.
2. The other nine sections in one pass each, 2 takes per section (kept to two to save credits), with light direction
   tags (`[curious]`, `[serious]`, `[dry]` before "Sounds reasonable", `[amused]`, `[calm]`/`[warm]` for the ending).
3. Picks by measurement (`tools/v2_analyze_takes.py`): widest pitch movement at a natural rate. One blind Scribe pass over
   all picks returned 907 words in script order; the only differences were punctuation and "re-entry".
4. Placement (`audio/v2/plan.json`): sections placed on the timeline with picture lead-ins; a few picture beats inserted as
   silence inside existing pauses (e.g. 1.4 s after "Watch the change.", 1.6 s after "the tower takes the load."). No
   word was cut, stretched, sped up or pitch-shifted.
5. All takes cached in `audio/v2/takes/` (generation id in each file name); re-rendering pictures cannot trigger generation.

Credits used: opening test 4 × 196 = 784, nine sections × 2 takes = 10,928, Scribe 62 + 1,757 = 1,819; **≈ 13,530 credits** in total (per-generation prices
reported by ElevenLabs). No other paid service was used.

**Nobody has listened to the voice.** This environment cannot play audio. Delivery, pronunciation (Starship, Super Heavy,
Raptor) and the dry jokes were checked by transcription and measurement only. Listen before approving; any section that
fails can be regenerated alone.

## Footage incorporated

| Clip | Where | Notes |
|---|---|---|
| `01_Flight5_BoosterCatch.mp4` | 0:00–0:03.4 (hook), ≈0:49.6–0:56.4 (powered approach), ≈5:27.3–5:30.0 ("The first catch brought the booster home") | Three different portions; brief `SpaceX · Flight 5, 2024` credit each time |
| `02_Flight14_Reentry_4K.mp4` | ≈1:38.0–1:43.4 | Entered on the Earth-limb horizon from the drawn orbit shot; cropped from the top so SpaceX's lower telemetry strip is out of frame (the "Views by Starlink" mark stays). Credit `SpaceX · Flight 14, 2026` |
| `03_Flight14_OceanReturn_4K.mp4` | **Not incorporated — not in the release** | The release holds only the first two files. The ocean flip and landing burn (≈2:13.8–2:21.1) is original animation for now. The edit point is ready: add the file to the release, run `tools/v2_fetch_footage.sh` (add a line for it), set `HAS_OCEAN_CLIP = true` in `source/src/v2/timeline.tsx` and re-render; the slot plays local 14.5 s onward with the credit |

About 15 s of real footage in total (the brief's 30–45 s assumed the ocean clip). Footage is shown without source audio:
the clips' soundtracks have strong tonal peaks, so I could not confirm they are clean engine sound rather than music, and
nobody can listen here. Engine sound across the real/drawn joins is the original synthesised rumble.

## What changed from V1 (against the brief's defect list)

- Opens on the real catch at frame 0; the drawn stack follows on a tower-column wipe matched to the real tower's position;
  a 3-second reentry→flip teaser and a close on the receiving arms, then a pull down the tower to the mount and tank farm.
  No title card, no "NOT YET ATTEMPTED" banner, no persistent ILLUSTRATION chips or source bubble.
- Hardware rebuilt (`vehicles.tsx`, `site.tsx`): the ship and booster are true cylinders projected from any azimuth, so
  tiles, flaps, fittings, fins and engines stay consistent through camera changes and the flip; the arms are deep
  trusses with receiving rails, pivoting on a carriage (swing and carriage travel are separate motions); near/far arms
  occlude the vehicle correctly; Pad 2-style mount over a flame trench; quick-disconnect arm drawn separately and retracted.
- Orbit section is one shot (ship cruising sideways → the curve of the Earth → belly-first into the atmosphere), then the
  real plasma, then a tile close-up that pulls back to the whole windward body. Heat stays on the vehicle and its flow.
- The flip is one physically continuous manoeuvre (belly-flop with working flaps → relight → swing upright), then a
  multi-exposure "watch the change" shot, then the upright pose carried into the tower environment.
- Load path: rail → arm diagonals → carriage → mast legs → foundation, with a travelling highlight.
- Three error demonstrations from one front view down the arms with a baseline and resets: DRIFT, TILT, TOO FAST.
- Abort material compressed to one decision beat (status lamps, the Flight 6 call-off, divert options that run out near the
  arms). Probability quote, timeline and checklists removed.
- Ending: the hook's arm composition returns for the planned contact (music drops just before the supports meet, weighty
  settle, stable hold), both stages at the pad, the real Flight 5 catch for "the first catch brought the booster home", the
  restack for "sending it back up again", FGW wordmark.

## Unresolved, concrete

1. **Ocean-return clip missing** (above).
2. **Voice not heard by anyone** (above). Also unheard: the whole mix. Effects and score were placed and measured
   (speech-band check: `tools/v2_speech_mask.py`), not listened to.
3. **Reference photographs not opened.** content.spacex.com and the SpaceX image CDN were blocked by this session's network
   policy, so the Pad 2 arm/carriage, B19 and S39 photos in the brief could not be compared with the drawings. The arms,
   carriage and V3 fins follow published descriptions and the Flight 5 footage; check them against the photos.
4. The ship's support fittings are generic (interface unpublished), as the brief allows.
5. QA was done on rendered frames, contact sheets and frame strips across every real/drawn join and manoeuvre
   (`qa/v2/`), not by watching at normal speed.
6. Before publishing, re-check the Flight 15 plan and the Flight 6 wording against current primary sources (see
   `FGW_Starship_Dual_Catch_Sources.md`).
