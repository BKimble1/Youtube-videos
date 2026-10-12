# QA notes — Earth Stops V3 review cut

**Nobody has watched this in real time or listened to it — not me, not anyone.** I cannot play video or audio. Everything below is one of three things, kept apart: **(A) what I looked at** (still frames decoded from the encoded files, read as contact sheets), **(B) measurements** (numbers computed from the encodes and stems), **(C) what remains for a person.** None of it is a viewing or listening result, and none of it is a publication or final-ready claim. No AI frame-voting, viewer subagents or simulated viewer tests were used.

File checked: `exports/v6/FGW_EarthStops_V3_Review_1080x1920.mp4` (silent render `qa/v6/render/FilmV3_silent_raw.mp4` + `audio/v6/v3/stems/mix_v3.wav`; the Silent/Voice/SFX/Music/NoMusic mp4s carry identical picture bytes). Numbers: `qa/v6/QA_V3.json`, `qa/v6/AUDIO_MEASUREMENTS_V3.json`, `qa/v6/CAPTION_SYNC.json`; metadata: `exports/v6/EXPORT_METADATA.json`.

## A. What I looked at (decoded frames of the encode, not playback)
| What | Frames read | Notes |
|---|---|---|
| First second (brake, contact, dive, cut, carried-east, lamp, suspended beat, cut) | f0, 2, 4, …, 18 (every 2) and f19–37 (every 1–2) from the first full encode; the final encode is the same source except for the items below | Pads already closing at f0; planet intact; lock at f14; dive f15–19; cut at f20 to the street; fear pose, coffee ribbon, lamp looming f25–35; the cut at f36 to the still street. **No frame shows a collision.** |
| P2 street trajectories | f36–100 every 4 from the **final** encode, plus f100/125/134/150 (first encode) | Bike rolls in f56–68, hits the lamp at f69–70 and flips; a chair hits the palm f72–76; boxes, pot, chairs, bin follow; `GROUND 0 MPH`, plate and `EQUATOR` land on their words |
| Wind and the awning cut | f134–242 every 12–16 (first encode); f224–246 every 2 (**final** encode) | Palms bend flat, flags stream, posts at the lens; the awning wipes screen-right and the coast appears behind it, never an empty frame |
| Coast | f250–398 (first encode); f352–394 (**final** encode) | The swell grows from the left horizon; pier hit f318–326 (planks fly); overtopping f336–352; the foam-edged band crosses the frame and **now leaves at f392** (the first encode held a static band to f392 and popped; fixed) |
| Explanation, globe, finale | f430–716 (first encode); f436, 448, 500, 520, 743 (**final** encode) | First arrow now sits behind her, off her face (the first encode had it across her eyes; fixed); the slab shrinks to the equator marker; markers and chips; ring growth; caliper slides in |
| Loop seam | f722, 728, 734, 738, 741, 743, 0, 1, 2, 4, 8, 12 (first encode) and f743 (final) | Globe orientation, centre, radius, pad position and rotation direction continue across f743 → f0; the only visible change at the seam is the caption appearing |
| Shorts-UI layout (approximate) | `qa/v6/UI_OVERLAY_V3.png`: f0, 14, 30, 69, 150, 230, 318, 336, 400, 447, 520, 640, 722, 740 of the **final** Review mp4 | Caption lane, plate, chips, faces, the pad contact (x ≈ 670–800) and the wave crest stay clear of the top bar, right rail and bottom block; the caliper's vertical bar and mounting beam brush the right rail (x ≥ 930) from f14 on, and the lamp post at f30 sits behind it. **Approximate layout, not the live UI.** |
| Phone width | `qa/v6/PHONE_WIDTH_V3.png`: 7 frames at 360 × 640 | Captions legible at 360 px; chips (`GROUND 0 MPH`, `EQUATOR`, `NORMAL DAY`, `NEAR A POLE`) are small (≈ 14 px at 360); the globe markers and their trails are small and thin at that size |
**Not read**: a complete frame-by-frame pass of all 744 frames of the final encode (I read the transitions and trajectories listed above; I did not read every frame). Still-frame reading **cannot certify motion at normal speed.**

## B. Measurements (final encode)
| Check | Result |
|---|---|
| Container | h264 High, 1080 × 1920, 30 fps, yuv420p, bt709; **744 frames counted** (24.800 s); AAC 48 kHz stereo (dual-mono) 253 kb/s; 17.3 MB; under the 60 s Shorts limit. Labeled preview: 540 × 960, 2.6 MB |
| Frozen frames | **none**: no adjacent pair with mean difference < 0.05. The only *intentional* hold is f31–36 (the suspended beat: speed 12 %, vignette and zoom close; it is slowed motion, mean step ≈ 17 there, not a freeze) |
| Hard changes | step > 4× median at f18–36 (brake dive, action cut f19→20, the carried-east motion, the cut f35→36), f70–80 (bike/chair impacts, shake), f168–218 (the wind tracking shot), f227–239 (the awning), f319–320 (wave hit shake), f369–376 (water band). Largest step f19→20 (110): the action cut. All are the designed cuts or fast moves; this statistic cannot judge whether any is good |
| Frame-difference by scene (mean step, 0–255 scale, 270 × 480 grey) | brake 10.8 · carried east 21.3 · street 7.1 · wind 21.4 · **swell 3.1** · hit/flood/band 7.8 · NORMAL DAY 1.2 · globe 3.1 · finale 2.9. **Flag:** the swell build (7.9–10.6 s) is the quietest part of the escalation after the intense wind; it is slow-scale growth by design, but whether it reads as rising dread or a lull is a viewing question |
| Loop seam (picture) | f743 → f0 mean step **4.07** vs median adjacent step 3.48 (**1.17×**); the extra is the caption appearing at f0 |
| Loudness | **−15.9 LUFS integrated, LRA 3.9 LU (no-music mix: 4.0), true peak −1.5 dBTP** on the AAC mp4s; WAV mixes −15.9 / −1.5. The AAC encode is time-aligned with the WAV |
| Narration integrity | the narration in the mix equals the cut timeline at one constant gain (−0.10 dB, residual −77 dB); each of the seven segments equals the take-B slice (residual ≈ −73 dB = 1-sample rounding). **No stretch, speed-up or pitch change** |
| Mono | channels identical (dual-mono): mono fold-down is bit-identical |
| Speech vs sound (masking **proxy**, 300–3,400 Hz, 100 ms windows, 99 voiced windows; effects stem only) | median +34.5 dB; 5th percentile +16.6 dB; 1st percentile +5.9 dB; **1 window below +6 dB: 0.4 s at −7.5 dB** — the brake's lock clack, deliberately on the stressed word *stopped* (contact 0.47 s; word starts 0.48 s). I trimmed the clack to 160 ms, moved the bed's energy out of the speech band and lowered the accent; the transient still exceeds the speech band for ≈ 100 ms. It is an accent on the word, not a mute, but **it is the first thing to listen for**. Next worst: 13.6 s (+6.1 dB, footsteps under *the spin*), 6.4 s (+7.5), 5.6 s (+8.4). The swell stem is ≥ 10.9 dB under the speech band in voiced windows. A flag, not a defect: a spectral-energy ratio is not intelligibility |
| Effects by band | < 150 Hz 9 %, 150–400 Hz 16 %, 400–3,400 Hz 40 %, > 3,400 Hz 36 % (sub layers shelved −8 dB for phones; **not playback on a phone**) |
| Tension swell | original synthesis, f150–302 (5.0–10.07 s), −13 dB re the voice's loudest 100 ms (V2's was effectively inaudible at −50 dBFS). Measured: −46 dBFS in the 6.7–7.1 s window and −36 dBFS at 7.8–9.0 s (swell stem RMS), i.e. **−4.7 dB re the rest of the mix in the voice gap 7.8–9.0 s and −5.7 dB at 9.75–10.07 s, but 16–19 dB under the mix while the narration speaks (e.g. −15.8 dB at 6.7–7.1 s, −18.9 dB at 9.0–9.75 s).** It is audible only in the gaps, by design. It is a separate stem and the **no-music mix is the safer review file** |
| Controlled silence | f31–36: the supporting layer is gated −40 dB (measured −81 dBFS RMS in the effects stem); f306–318: ambient layers gated −26 dB before the wave hit (effects stem −33 dBFS RMS: mostly the pier creak and the rotation-free bed). Mix windows < −50 dBFS for ≥ 100 ms: 1.05–1.1 s (the beat), 10.25–10.4 s (the pre-hit silence), 12.8–12.9 s, 15.25–15.5 s (calm after *with Earth*) — all designed or the narration's own gaps |
| Event timing in the encode | the lock accent peaks 12 ms after f14; the pier snap/wave hit at 10.601 s (f318 = 10.600 s); the caliper clunk at 24.068 s (f722 = 24.067 s). The bike clang (f69) and chair thwack (f74) are five frames apart and could not be separated by this probe; both are placed on their cue frames by construction |
| **Audio loop seam** | the hum is periodic over the film and the strain is one waveform split at t = 0 (18 frames at the end, 14 at the start): |last sample − first sample| = 0.018 vs a median sample step of 0.015 (p99 0.059) within ±40 ms; RMS of the last 20 ms 0.0314 vs first 20 ms 0.0310. No click or silence by construction. **AAC encoder delay/padding (≈ 24.81 s containers) may add a few ms at a player's loop point: a player-side issue to check** |
| Caption cues (`CAPTION_SYNC.json`) | 14 cues; every cue starts −33 … 0 ms from its first word (the first cue starts at frame 0); every cue ends 27–727 ms after its last word; no overlap; SRT `exports/v6/FGW_EarthStops_V3_Captions.srt` has 0 overlapping cues (V2's 33 ms overlap is fixed: each cue ends 1 ms before the next) and 0 double spaces; shortest cue 633 ms. The cue *about a thousand* was retimed to its word after the first sync check (it had started 233 ms early) |

## First-second checklist (30 fps, from `source/src/film3/timeline3.ts` and the stills)
| Brief | V3 | Where |
|---|---|---|
| Frame 0: large Earth dominates, continents moving, pads already closing, compact `WHAT IF`, narration begins "If Earth…" | yes: Earth diameter 780 of 1,080 px; pads 95 px from the ring at f0 (130 open at f−16) | f0 stills; voice starts 0.05 s |
| Contact ≈ 0.30–0.50 s on "stopped" | **f14 = 0.467 s** (the word starts 0.48 s) | `T.brakeContact`; stills f12/14/15 |
| Decisive stop; no deformation, explosion or coral shock ring | 3 px recoil, spin dead at f15; the pads grip a ring, the sphere is never touched | stills |
| 0.50–0.75 s action-driven cut/dive to the street | dive f15–19, **action cut f20 = 0.667 s** | stills f18–21 |
| 0.75–1.00 s lamp post looms, fear acting, collision staged, no penetration | lamp enters f25, fills the frame by f31; fear pose; **no contact shown** | stills f23–35 |
| Optional 4–6 frame suspended beat | **f31–36 (5 frames)** logged as intentional (slowed, vignette, push-in), separate from freeze defects | `QA_V3.json` |
| No split screen, tiny labels, repeated stops, extra inset or title card | none | stills |

## Defects found and fixed during QA (so the record is honest)
- The first stage arrow sat across the woman's eyes (f430–462): moved behind her.
- The water band was held static at x ≈ 700–1500 for 8 frames (f384–392) and then popped out; it collided with the caption *You don't feel the spin*: the sweep now ends exactly as the band leaves the frame (f392).
- The bicycle clang (f59) and the chair hit (f66) landed on the stressed word *east* (masking proxy −1 dB there): the bicycle and chair now start later so both hits fall in the narration's pause after *east* (f69, f74).
- The brake bed sat in the speech band (proxy −14 dB at 0.1 s and −20 dB at 0.4 s): the servo whine was moved above 3.3 kHz and the hum split into < 280 Hz and > 3.6 kHz.
- The caption *about a thousand* started 233 ms before its word: retimed.
- In the stills the rotor ring's 40 fine ticks read as a measuring tape: replaced by 18 broad slots (a ventilated-rotor look) and the film re-rendered; the QA numbers and sheets below are from that final render (the first-second and transition stills listed in §A were read on earlier renders of the same composition and are unaffected except for the ring's slots).
- The V2 SRT overlap and double space: fixed (see above).

## C. Not done / unavailable (a person must do these)
1. **Watch the film in real time on a phone**, muted first (`FGW_EarthStops_V3_Silent_…mp4`), then with sound; judge the six questions in `V3_REPORT.md` §5.
2. **Listen** to the narration, the SFX-only track, the swell, the mix and the no-music mix on a phone speaker, headphones and (if possible) mono. **Every level is a design target from measurement.** Listen first at 0.3–0.7 s ("stopped" against the lock clack), at 2.3–2.5 s (clang and thwack in the pause), at 10.2–10.6 s (the silence before the wave) and at the loop point.
3. **Audition the generated one-shots** (picks were by measurement).
4. **Check the live Shorts UI** on a device (the overlay is approximate).
5. **Open the source pages** (or accept the reviewer's reads, `script/SOURCES.md`); Claude opened none.
6. **A Scribe pass on the final mix** was not possible (no file-upload tool in the restricted connector).
7. **Check the ElevenLabs plan's licence** for commercial use of the voice and the generated one-shots, and confirm rights before any recommendation to publish.
8. **Say which Atlas / murder-tip files were uploaded** (analytics conclusions stay conditional).
9. **Runway**: the V1 clip host is still refused; nothing to inspect.

## What the numbers do not say
Loudness, peak, the speech-to-sound ratio and frame-difference statistics are supporting checks. They cannot show that a transition means something, that an effect suits the picture, that the narration is well performed, that the brake reads as a brake, or that the film is good. The swell is a separate stem and mostly inaudible while the narration speaks; judge it on headphones and drop it if it adds nothing.
