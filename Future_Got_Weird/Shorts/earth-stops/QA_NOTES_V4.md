# QA notes — Earth Stops V4 review cut

**Nobody has watched this in real time or listened to it — not me, not anyone.** I cannot play video or audio. Everything below is one of three things, kept apart: **(A) what I looked at** (still frames decoded from the encoded files and read as contact sheets), **(B) measurements** (numbers computed from the encodes and stems), **(C) what remains for a person.** None of it is a viewing or listening result, and none of it is a publication or final-ready claim. No AI frame-voting, viewer subagents or simulated viewer tests were used.

File checked: `exports/v7/FGW_EarthStops_V4_Review_1080x1920.mp4` (silent render `qa/v7/render/FilmV4_silent_raw.mp4` + `audio/v7/v4/stems/mix_v4.wav`; the Silent/Voice/SFX/Music/NoMusic mp4s carry identical picture bytes). Numbers: `qa/v7/QA_V4.json`, `qa/v7/SCENE_MOTION_V4.json`, `qa/v7/AUDIO_MEASUREMENTS_V4.json`, `qa/v7/CAPTION_SYNC.json`; metadata: `exports/v7/EXPORT_METADATA.json`. Tools: `tools/qa_v4.py`, `qa_motion_v4.py`, `qa_audio_v4.py`, `qa_captions_v4.py`, `audio_ratio_v4.py`, `audio_stem_ratio_v4.py`, `ui_overlay_v4.py`, `sheets_v3.py`.

## A. What I looked at (decoded frames of the encode, not playback)
| What | Frames read | Notes |
|---|---|---|
| **Every frame of the first complete render** | f0–614, as 14 contact sheets (9 × 5 at 216 × 384) | Read before the fixes below; the film then had the same structure. Defects found there and fixed are listed in the next section |
| **First second of the final encode** (the brief's checkpoint list) | f0, 9 (0.3 s), 15 (lock, 0.5 s), 18 (0.6 s) as a picked sheet, and f0–44 as the first contact sheet of `qa/v7/enc_all/`; f27 (0.9 s) is in that sheet | f0: large Earth, continents turning, pads 97 px from the belt and already closing; f9: pads mid-approach, the planet's landmasses have moved; f15: pads at the belt, sparks and flash; f16–19: the dive; f20: street, she is already off-balance; f27: she is airborne with the coffee streaming and the lamp post coming; f35–44: fear acting continues to the cut at f48. **No frame shows a collision or a frozen pose.** |
| Coast, final encode | f225–269 (awning → coast cut), f270–314 (calm, chop, the swell appearing at the left edge, the boat lifted), f332–360 (crest at the boat, capsize, post snap, deck section, aftermath, flood start), and a 16-frame crop sheet f333–348 around the boat | The boat is lifted by the swell from f292 on and tilts with the face; at f335–347 it flips at the lip and slides down the face on the same curve (no jump between consecutive frames); post 2 breaks at f338 and its stub and the top half agree; the detached deck section's ragged edge matches the gap; planks fly; the surge runs on toward the town; the flood rises at f354–362 |
| Finale, final encode | f540–584 (as sheet 13) and f604–614, f0–15 (picked sheet) | The caliper enters at f547 and seats at f574; the pads start closing at f575; f614 → f0: orientation, centre, radius, pad gap and rotation direction continue; the caption changes |
| Shorts-UI layout (approximate) | `qa/v7/UI_OVERLAY_V4.png`: f0, 15, 30, 71, 138, 236, 330, 340, 390, 447, 520, 575, 600, 614 of the **final** Review mp4 | Caption lane, plate, chips, faces, the pad contact and the wave crest stay clear of the top bar, right rail and bottom block; the caliper's mounting beam and vertical bar brush the right rail (x ≥ 930) as in V3. **Approximate layout, not the live UI.** |
| Phone width | `qa/v7/PHONE_WIDTH_V4.png`: 7 frames at 360 × 640 | Captions legible at 360 px; chips (`GROUND 0 MPH`, `EQUATOR`, `NORMAL DAY`, `NEAR A POLE`) are small (≈ 14 px at 360); the globe markers and trails are small at that size |
| Every frame of the **final** encode | sheeted in `qa/v7/enc_all/` (14 sheets) | I read sheets 1, 6, 7 and 13 of the final encode plus the picked sheets above; **I did not re-read the other final sheets** (the final render differs from the first complete render only in the items listed below). Still-frame reading **cannot certify motion at normal speed.** |

## Defects found by this QA and fixed (so the record is honest)
- **The water body vanished for f306–309** (an empty point list made the SVG path invalid when the swell's crest was just off the left edge): the body is now built from a start point that is always left of the crest.
- **The coast was inert for ~1.5 s** (the swell was only visible from f297): the swell now enters at f268, the sea chop grows from f266 and the boat is lifted from f274 (static runs of ≥ 5 frames with step < 1.0: none, `qa/v7/SCENE_MOTION_V4.json`; the first render had one at f549–556 in the finale, fixed by starting the caliper at f542).
- **The wave read as a triangular fin**: the crest is rounded (zero slope at the top, long convex back) and the surge keeps running after the hit.
- **One-frame caption gaps** between back-to-back cues (the shared caption component treats the end frame as exclusive): fixed in `Film4.tsx` (last-frame-inclusive cues); the last cue now shows on f614.
- **The lock clack sat on the /s/ of *stopped*** (proxy −10.6 dB at 0.4 s, worse than V3's −7.5): the lock moved from f14 to f15, the clack is 60 ms, band-passed 500–6000 Hz and placed at 0.52 s (the silent /t/ closure of *stopped*): the 0.4 s window is now +23 dB and the 0.5 s window +5.2 dB (see B).
- **The awning rip, pole crack and flap sat in the speech band over *debris*** (proxy −12 dB at 7.9 s, −4 dB at 8.5 s): moved above 3.5 kHz / below 200 Hz and lowered; worst window now +2.9 dB (see B).

## B. Measurements (final encode)
| Check | Result |
|---|---|
| Container | h264 High, 1080 × 1920, 30 fps, yuv420p, bt709; **615 frames counted** (20.500 s); AAC 48 kHz stereo (dual-mono) 256 kb/s; 14.5 MB; under the 60 s Shorts limit. Labeled preview: 540 × 960, 2.2 MB |
| Frozen frames | **none**: no adjacent pair with mean difference < 0.05; smallest step in the film 0.72. There is no intentional hold in V4 |
| Static runs | **none**: no run of ≥ 5 frames with mean step < 1.0 |
| Frame-difference by scene (mean step, 0–255 scale, 270 × 480 grey; `SCENE_MOTION_V4.json`) | brake 3.3 · dive 34.3 · carried east 24.4 · still street 4.7 · loose things + wind 5.6 · tracking + awning 21.2 · coast 4.7 (min 0.9) · aftermath 10.0 · flood/drain 11.1 · NORMAL DAY 1.2 · pull-out 4.4 · globe 3.0 · ring + caliper + pads 2.6. **Flags:** NORMAL DAY (12.07–13.8 s) is the calmest stretch (mean 1.2) by design (a walking cycle, arrows popping); the coast build-up (8.6–11.2 s) is slow-scale growth (mean 4.7). A frame difference is not an animation-quality score |
| Flood cover | the share of each frame that is flood-teal (decoded frames of the final encode, 108 × 192): 0.25 up to f356, 0.55 at f358, **≥ 0.88 on f360–365 (6 frames, 0.2 s)**, 0.75 at f368, 0.5 at f373 (the rest is caption and tag); ≥ 0.75 for 9 frames (0.3 s) |
| Hard changes | largest steps: f19→20 (112, the dive-to-street action cut), f47→48 (59, the cut to the still street), f258/259, f254, f256 (the awning covering the lens), f197–204 (the camera tracking). All designed cuts or fast moves |
| Loop seam (picture) | f614 → f0 mean step **4.28** vs median adjacent step 3.52 (**1.22×**); the extra is the caption changing at f0 |
| Loudness | **−15.5 LUFS integrated, LRA 2.2 LU, true peak −1.5 dBTP** on the AAC mp4s (Review and ReviewNoMusic); WAV mixes −15.5 / −1.5. AAC vs WAV lag 0 samples (decoded length 984,064 vs 984,000 samples: 1.3 ms encoder padding) |
| Narration integrity | the 12 kept pieces equal their take-A slices (residual −70 to −74 dB: rounding); 1.44 s of silence removed in 11 gaps; the mixed narration equals the timeline at one constant gain (−0.0 dB, residual −74 dB). **No stretch, speed-up or pitch change** |
| Dual mono | channels identical (max |L − R| = 0) |
| Speech vs sound (masking **proxy**, 300–3,400 Hz, 100 ms windows, 116 voiced windows; effects stem only) | median +28.9 dB; 5th percentile +9.7 dB; 1st percentile +4.3 dB; **2 windows below +6 dB: 7.9 s (+3.9 dB) and 8.5 s (+2.9 dB)**, both inside *debris through the streets* (awning rip/flap and the gust, kept out of the speech band). V3's worst was −7.5 dB at 0.4 s; V4's lock window is now +23.1 dB (0.4 s) / +5.2 dB (0.5 s). A flag, not a defect: a spectral-energy ratio is not intelligibility |
| **The wave hit on *coast.*** | the crash at f336 (11.2 s) lands on the **last /st/ of *coast.*** (the vowel is at 11.0–11.15 s, where the voice is 25–55 dB above the effects): in 50 ms windows the effects exceed the speech band by 17 dB at 11.20 s, 28 dB at 11.25 s, 9.5 dB at 11.30 s, then the voice is gone. The word is carried by its vowel and by the caption, but **the final /st/ is masked for ≈ 150 ms: the second thing to listen for** |
| Hits in the pauses | bike clang (2.37 s) and chair thwack (4.60 s) fall in the narration's 0.24 s and 0.28 s breaths: effects exceed the speech band by 75 and 78 dB there because the voice is silent; neither covers a word |
| Event timing in the encode (peak of the effects stem; clip onsets are within 7 ms of their placement) | lock accent peak 0.533 s (placed 0.52 s, picture contact 0.500 s); chair thwack 4.605 s (f138 = 4.600 s); caliper clunk 19.137 s (f574 = 19.133 s); the wave-hit crash builds to its maximum 78 ms after its onset (11.278 s; onset at f336 = 11.200 s) and the pier snap lands at the post-break frame (11.267 s). The bike clang's peak window also contains the lamp ring |
| **Audio loop seam** | the hum is periodic over the film and the strain is one waveform split at t = 0 (40 frames at the end, 15 at the start): |last − first sample| = 0.0053 vs a median sample step of 0.0070 (p99 0.103); RMS of the last 20 ms 0.0289 vs first 20 ms 0.0327. No click or silence by construction. **AAC encoder delay/padding may add a few ms at a player's loop point: a player-side issue to check** |
| Dead air | no 100 ms window of the no-music mix is below −48 dBFS; every gap between phrases (0.10–0.45 s) has an effect or ambient layer in it |
| Caption cues (`CAPTION_SYNC.json`) | 16 cues; every cue starts −40 … 0 ms from its first word; every cue ends −30 … +700 ms after its last word (*And the ocean keeps moving* ends 30 ms before its last word's end estimate); no overlap; SRT `exports/v7/FGW_EarthStops_V4_Captions.srt`: 0 overlapping cues, 0 double spaces, shortest cue 666 ms |
| Tension swell | original synthesis, f150–322 (5.0–10.73 s), −13 dB re the voice's loudest 100 ms, speech-band ducked 16 dB under the voice; a separate stem; **the no-music mix is the safer review file** |

## First-second checklist (30 fps, from `source/src/film4/timeline4.ts` and the stills)
| Brief | V4 | Where |
|---|---|---|
| Frame 0: Earth dominates, continents moving, pads already closing, `WHAT IF`, narration "If Earth…" | yes: Earth diameter 780 of 1,080 px; pads (280 × 104 px) 97 px from the belt at f0; the continents turn 4° per frame | f0, 9 stills |
| Simplified band, visible pad contact, the stop on "stopped" | plain belt (no slots), pads twice as large; contact **f15 = 0.50 s** (the word starts 0.48 s); the clack sits in the /t/ closure at 0.52 s | stills f13/15/16 |
| Decisive stop, no deformation or shock ring | the pads dig 6 px, the bracket recoils, sparks and a flash at the contact lines; the sphere is never touched | stills f15–18 |
| Danger within the first second, ~0.8–1.0 s, staged acting (not a longer freeze) | **f20–48 = 0.93 s**; feet leave the ground at f29 (0.97 s); no hold | stills f20–47 |
| No collision shown | cut at f48 before contact | stills |

## C. Not done / unavailable (a person must do these)
1. **Watch the film in real time on a phone**, muted first (`FGW_EarthStops_V4_Silent_…mp4`), then with sound; judge the questions in `V4_REPORT.md` §5.
2. **Listen** to the narration, the SFX-only track and the no-music mix on a phone speaker, headphones and (if possible) mono. **Every level is a design target from measurement.** Listen first at 0.4–0.7 s ("stopped" against the lock), at 7.9–8.7 s (*debris through the streets* against the awning), at 11.0–11.4 s (*coast.* against the wave hit), and at the loop point. Also judge whether the shortened pauses (0.10–0.45 s) feel natural or rushed.
3. **Audition the reused generated one-shots** (picks were by measurement, in V2/V3).
4. **Check the live Shorts UI** on a device (the overlay is approximate).
5. **Open the source pages** (or accept the reviewer's reads, `script/SOURCES.md`); Claude opened none.
6. **A Scribe pass on the final mix** was not possible (no file-upload tool in the restricted connector).
7. **Check the ElevenLabs plan's licence** for commercial use of the voice and the generated one-shots, and confirm rights before any recommendation to publish.
8. **Say which Atlas / murder-tip files were uploaded** (analytics conclusions stay conditional).
9. **Runway**: not used; nothing to inspect.

## What the numbers do not say
Loudness, peak, the speech-to-sound ratio and frame-difference statistics are supporting checks. They cannot show that a transition means something, that an effect suits the picture, that the narration is well performed, that the brake reads as a brake, that the boat looks like it floats, or that the film is good. The swell is a separate stem and mostly inaudible while the narration speaks; judge it on headphones and drop it if it adds nothing.
