# QA notes — Earth Stops V2 review cut

**Nobody has watched this in real time or listened to it.** Everything below is a measurement or a still-frame reading of the encoded file; none of it is a viewing or listening result. No publication or final-ready claim is made.

File checked: `exports/v5/FGW_EarthStops_V2_Review_1080x1920.mp4` (silent render `qa/v5/render/FilmV2_silent_raw.mp4` + `audio/v5/v2/stems/mix_v2.wav`). Numbers: `qa/v5/QA_V2.json`, `qa/v5/CAPTION_SYNC.json`, `qa/v5/qa_v2_stdout.txt`.

## What was measured (final encode)
| Check | Result |
|---|---|
| Container | h264 High, 1080 × 1920, 30 fps, yuv420p, bt709; 760 frames counted and 760 decoded; 25.333 s; AAC 48 kHz stereo (dual-mono) 253 kb/s; 16.55 MB; under the 60 s Shorts limit |
| Black / frozen / jump frames | no frame with mean luma < 20; no run of ≥ 3 identical frames; no frame-difference spike > 3× the 95th percentile |
| Loudness (supporting check only) | mix −15.6 LUFS integrated, LRA 2.1 LU, true peak −1.5 dBTP; the AAC encode matches the WAV (0 samples lag); the voice carries one constant gain (−0.30 dB; residual −75.7 dB = quantisation floor), so the narration is unmodified |
| Mono / phone | the channels are identical (dual-mono), so a mono fold-down is bit-identical; no phase issue possible. Phone-speaker proxy: the speech-to-sound ratio is measured in 300–3,400 Hz; sub layers (< 130 Hz) are shelved −8 dB in the effects sum so the mix level is not spent on bass a phone cannot play (energy share of the effects: < 150 Hz 18 %, 150–400 Hz 34 %, 400–3,400 Hz 35 %). **This is not playback on a phone.** |
| Speech vs sound (masking **proxy**, 300–3,400 Hz, 100 ms windows, 139 voiced windows) | median +36.1 dB; 5th percentile +10.8 dB; **1 window below +6 dB** (+5.4 dB at 16.5 s, "And so does the…"); next worst 20.9 s (+6.5), 11.3 s (+7.3), 23.6 s (+7.6). A flag, not a defect: it is a spectral-energy ratio, not intelligibility |
| Caption cues | 18 cues from the final narration; every cue starts −113 … +7 ms from its first word's Scribe start (first cue starts at frame 0); every cue ends 40–517 ms after its last word; cue boundaries rechecked (`CAPTION_SYNC.json`); SRT: `exports/v5/FGW_EarthStops_V2_Captions.srt` |
| Frame-difference | median adjacent-frame difference 3.0 (0–255 scale); busiest 626 (the streak wipe), quietest seconds 7–9 (the shared-motion beat, 0.46–0.72) and the stand at f416–430. **These statistics cannot tell a meaningful transition from a bad one**, and say nothing about taste |
| Loop seam | the last frame (calm hold) is not the first frame (mid-lunge): a hard cut by design (mean abs diff 121 vs 2.3 for adjacent frames) |
| Silent stretches in the mix | < −50 dBFS for ≥ 100 ms at 2.5, 3.45, 6.1, 7.95, 10.15–10.6 (the pause before the stop), 14.45, 24.85–25.3 (the end); all are the narration's own gaps or the tail |

## V1 vulnerable windows, translated to the V2 timeline
The V1 measurement flags (0.6, 6.1, 13.3, 19.1, 33.1 s) were speech-to-sound ratio minima. They are measurement flags, not confirmed defects. V2 changes the narration and event timing, so each was translated to the event that caused it and the whole V2 timeline was rescanned:
| V1 window | V1 cause | V2 equivalent | V2 ratio now |
|---|---|---|---|
| 0.6 s | launch scuff under "Earth" | hook coffee droplets/landing under "Earth" | 0.6 s: +9.7 dB (ducking, droplet level and a 6 dB air-rush dip) |
| 6.1 s | iris/dive swoosh under "So was…" | no such sound (no iris); nearest: the pan whoosh under "together" (9.7 s) | no window < +10 dB there |
| 13.3 s | plaza scrapes under "anything…" | plaza impacts under "the ground suddenly" | 11.3 s: +7.3 dB (object levels −3…−5 dB, bicycle dip 8 dB) |
| 19.1 s | bar ratchets under "Farther…" | marker whirr under "that starting speed" | 19.2 s: +10.9 dB |
| 33.1 s | pull-back swoosh under the callback | sip/ticks under "real" | 23.5–23.7 s: +7.6…+11.9 dB |
The narration is never muted; the "stop" is the surface-stop thump placed in the natural pause (10.15–10.6 s), not a silenced voice.

## What was inspected (by reading, not by playback)
- **All 760 frames of the encoded file** as contact sheets (45 per sheet, `qa/v5/sheets/V2_all_frames_part01…17.png`): all 17 sheets were read at least once on the first V2 render; sheets 7, 12, 13 and 15 were re-read on the second render for the regions that changed (arrows, coast and foam, latitude, payoff). The last render changed only: label positions (GROUND chip, ground arrow, payoff chip), the inset-globe size and the latitude globe centre; those were checked on stills and on the overlay frames from the final encode.
- **Full-size stills** at 0.6 scale were rendered **from the source** (not from the encode) and read for frames 0, 100, 235, 265, 282, 300, 350, 380, 436, 540, 556, 600, 610, 640 (labels, arrows, caption collisions, contact); they are not the encode.
- **Risky transitions** (rewind f55–79, pan f290–316, push wipe f424–446, foam f534–556, streak wipe f616–634): read frame by frame on the sheets. **A still-frame inspection cannot certify motion at normal speed.**
- **Labels during movement**: the `LOOSE →` chip follows the bicycle and the `GROUND 0 MPH` chip is fixed to the curb; read on the sheets, not played.
- **Character contact**: the lunge/landing (f0–40), the chair/box/bicycle crossing (f336–400; the bicycle passes through the stopped box at ≈ f375–395 — a visual overlap that is physically plausible but busy), the sip (f688–730) read on the sheets.
- **Source loading** (fonts, SVG): the render log has no warnings or errors apart from Docker memory notices; fonts are bundled (`@fontsource`).
- **Final seam**: described above (hard cut).
- **Captions vs Shorts UI**: `qa/v5/UI_OVERLAY_V2.png` marks a representative layout (top bar y < 170, right rail x ≥ 930 / y 1,060–1,780, bottom channel/title block x < 830 / y > 1,650, progress bar) over 14 frames of the encode. Result: the caption lane (y ≈ 430–620), the speed plate, the `EQUATOR` / `LOOSE` / `NEAR A POLE` / payoff chips, the stop cue and the faces stay clear; the `GROUND 0 MPH` chip and the ground arrow sit just above the bottom block (≈ y 1,586–1,652). **This is an approximate layout, not the live YouTube UI.**
- **Phone width**: `qa/v5/PHONE_WIDTH_V2.png` shows seven frames at 360 × 640. Captions stay legible there (white with a 15 px ink outline, 68 px at 1080 = 23 px at 360); the chips' text is small (≈ 14–15 px at 360) but legible.

## Runway
`get_task` on the V1 coast clip (`901f6225-4775-460e-b5e2-2836d4bf2d2d`, status SUCCEEDED, seedance-2, 720 × 1280, 5 s, no new credits) returned the same single preview frame as before and the video URL on `dnznrvs05pmza.cloudfront.net`. `curl` to that host returned 000 (refused), so **the clip was not inspected** (12 Oct 2026). **I do not claim it helped or failed.** The V2 coast is Remotion.

## Not done / unavailable (the owner or a person must do these)
1. **Watch the film in real time on a phone**, muted first (`FGW_EarthStops_V2_Silent_…mp4`), then with sound.
2. **Listen** to the voice-only, the SFX-only, the music-only stem, the mix and the no-music mix on a phone speaker, headphones and (where possible) in mono. All sound levels are design targets from measurement.
3. **Audition the generated one-shots** (`audio/v5/sfx_gen/audition_reel_gen.wav`, alternatives A/B kept): picks were made from duration, spectrograms, band balance and fit to the job, not by listening and not by RMS or peak alone.
4. **Check the live Shorts UI** on a device (the overlay is approximate).
5. **Open the source pages** (or accept the reviewer's reads, `script/SOURCES.md`); Claude opened none.
6. **A Scribe pass on the final mix** was not possible (the restricted ElevenLabs connector in this session has no file-upload tool).
7. **Inspect the Runway clip** (allow its host or open the task in Runway).
8. **Check the licence** of the generated sound effects and the voice against the ElevenLabs plan.
9. **Say which Atlas / murder-tip files were uploaded** (analytics conclusions stay conditional).

## What the numbers do not say
Loudness, peak, the speech-to-sound ratio and frame-difference statistics are supporting checks. They cannot show that a transition means something, that an effect suits the picture, that the narration is well performed, or that the film is good. The tension swell is very quiet (about 40 dB under the voice overall) and mostly invisible on a phone speaker; judge it on headphones and cut it if it adds nothing.
