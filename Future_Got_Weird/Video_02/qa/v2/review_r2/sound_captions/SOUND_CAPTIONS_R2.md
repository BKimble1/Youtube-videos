# Video 02 v2, release check r2: sound and captions (measurement only)

Release candidate: `exports/Future_Got_Weird_Video_02_v2_UPLOAD_1080p.mp4` (9716 frames, 323.867 s; AAC 48 kHz stereo, 323.883 s).
Frame N is at N/30 s. Frame numbers are this render's (V6's hold and everything after it sit 84 frames later than in the r1 log).

**Nobody listened to anything.** Every statement below is a measurement of the decoded file or its stems, or a comparison of
measured audio times with frames that were extracted and looked at. Nothing here is a claim about how it sounds.

## Loudness (encoded file)

| Measure | Value | Target | Result |
|---|---|---|---|
| Integrated (ffmpeg ebur128) | -15.5 LUFS | -16 to -14 | pass |
| Integrated (pyloudnorm, decoded AAC) | -15.53 LUFS | | |
| True peak (ebur128, 4x) | -1.3 dBTP | <= -1.0 | pass (0.3 dB margin) |
| True peak (4x polyphase, numpy) | -1.28 dBTP | | |
| Sample peak | -1.30 dBFS | | |
| LRA | 2.2 LU (low -17.1, high -14.9 LUFS) | | |
| Per scene | V1 -15.6, V2 -15.3, V3 -15.5, V4 -15.6, V5 -15.4, V6 -16.4, V7 -15.3, V8 -15.4, V9 -15.5, V10 -15.4, V11 -15.6, V12 -16.2, V13 -15.8 LUFS | | even |

The decoded AAC lines up with `audio/mix/v2/final_mix.wav` at 0 samples lag (residual -59.7 dBFS against -19.2 dBFS of
programme, i.e. coding noise only), and the three stems sum to the mix within -58.5 dBFS, so the stems were used to say
which element is which. Last sample ~1e-9, last 100 ms -72.7 dBFS (a fade, not a cut). Evidence: `ebur128_upload.txt`,
`loudness_python.json`.

Whole-film speech-band scan (300-4000 Hz, 40 ms windows, `band_scan.json`): in the 4805 windows where the voice is at
word-core level (>= -35 dBFS in band) the voice sits a median 25.1 dB over the music (5th percentile 10.2 dB) and 43.8 dB
over the effects (5th percentile 19.1 dB). Only 4 effect windows and 14 music windows come within 3 dB, each a single
40 ms window at a consonant edge.

## r1 sound and caption defects

| Id | Status | What was measured |
|---|---|---|
| V2-R1-01 (sound side of the U payoff) | closed | "U." stops sounding at 145.34 s (f4360). Gadd9 resolve (bass, guitar, vibes, glock tick) onsets 145.61 s (f4368), the pencil_tap at 145.60 s, the pointer touches the U's base on f4370 (burst). The board holds complete through f4443 and starts rolling on f4444 (148.13 s; V7 cut f4470): hold 2.5 s after the aligned word end, 2.8 s after the audible end. Note onsets 148.13-149.00 s: none (marimba's last 147.88, pizz's last 147.58; the next onsets are the museum's on the cut). See NEW-03 for a level rise under the roll-up. |
| V2-R1-12 | partly (polish) | Pointer: accelerating poke f3293-3297, contact f3297, 4 px press to f3300, at rest from f3303. pencil_tap onset 109.88 s (f3296.4); music full stop 109.92 s (f3297.6). Face: changes f3305, fully dropped f3306; uh_oh onset 110.24 s (f3307.2), -6 dB. Still overlaps "place." (110.40-110.85): the vowel core is 8-19 dB above the sting in band; the /s/ is 43-54 dB above it in 4-12 kHz; the sting is above the voice only in the 300-4000 Hz part of the /s/ and the word's tail. Not masking; the r1 fix's "over before place" was not met, by design. |
| V2-R1-13 | closed | "corner." sounds until 320.88 s (f9626); the bed holds -36 to -41 dBFS across it (no onsets 318.9-321.1 s); the last chord (harp, bass, vibes) starts at 321.13 s (f9634), 0.25 s after the word, then rises 15-18 dB. |
| V2-R1-16 (sound side) | closed | Glock+vibes tick and lift onsets 67.18-67.24 s (f2016-2017); the magnifier zoom starts f2018 on "zoom"; the bump shows from f2020-2021 and is clear by f2024. |
| V2-R1-22 | closed | Mirror enters f1045, lands f1050 (burst). The slide (sfx_track, before room tone) rises through f1045-1049 from -61 to -36 dBFS, clear of the room tone from f1048; ting on f1050. |
| V2-R1-24 | closed | n02 window 11.67-13.80 s and s15 window 68.27-71.37 s: only pizzicato onsets inside (no marimba, vibes, glock, guitar, bass). Music in band -38 to -44 dBFS (r1: -31 to -33 peaks). Tail of "estimate." 12.00-12.04 s: music -40.7/-40.1 vs r1 -31. Before "hundreds" 69.62-69.66 s: -41 (r1 marimba -33). Inside "weaker." the one remaining tie is a soft pizz note in the /k/ closure (70.86 s, 2.4 dB over the voice's dip in one 40 ms window); the word's vowels are 8-12 dB clear. |
| V2-R1-37 | closed | robot_motor under n30 now -11 dB (r1 -6). Motor in band about -42 to -47 dBFS; word cores 15-25 dB above. The remaining ties are the voice's own closures and tails ("now," decay 300.38-300.50, /t/ of "safety" 302.54-302.58, the /m/ of "system." 303.06-303.10, whose energy is below 300 Hz and 12-16 dB above the motor full band). The ping at 301.43 s sits on the /k/ of "clue" by design (vowel 16-25 dB clear). |
| V2-R1-39 | closed | Music stem and bed are exact digital zero from 311.067 s (f9332.0, end of "too.") to 313.868 s (f9416.0, the V13 cut), 2.80 s, after an 80 ms release. Only effects play under the hold (render -27.4 dBFS: footsteps, readout_off, smug_exhale, uh_oh). The resolve starts on the cut. SHOTPLAN_V2 V12 now says the gag plays dry. |
| V2-R1-40 | closed | readout_beep placed at -8 dB: -32 to -33 dBFS in band (r1 -24 to -25), a ~1.2 kHz tone 12-13 dB under "It's" full band; the /s/ of "It's" (2.78-2.80 s) is -19 to -21 dBFS in 4-12 kHz with the beep at -80 there. Hand on the sensor from f81 (burst), beep onset f82.8. |
| V2-R1-41 | partly (polish) | Against word frames every cue leads by 1.5-2.5 frames (median 1.9). Against the measured audible onset (narration stem, -45 dBFS, 20 ms), 7 cues still come in late, mostly s-initial words the aligner marks at the vowel: cue 80 n24 "So what can..." 6.2 frames (0.21 s; r1's named f7186 beat), 7 "so it comes back" 4.3, 17 "Everything" 4.1 (3.2 to the voiced start), 59 "so many weak" 4.1, 104 "Subscribe" 4.0, 101 "Being" 3.8 (r1's f9031 beat), 56 "Don't" 4.1 against soft pre-voicing, on the voiced start. |
| V2-R1-42 | closed | "through known / positions," now one cue (47) ending at the comma; "a hundred dollars" together (82); "farther from the wall spot." together (31); "That's how the U was made." 19.8 cps (75). Max line 42, max 2 lines, max 19.81 cps, no cue under 1.0 s. |

Fix for V2-R1-41: snap segment-initial cues to the segment's `from` frame minus 2 (n09 f1373, s31 f5212, n24 f7269,
n31 f9113) and the mid-sentence s-words to the measured onset minus 2 (cue 7 f549, cue 59 f5471, cue 104 f9550).

## audio_qc.json "effects within 3 dB of speech" (100 ms, full band)

| Time | Effect (placed.json) | Word | Masks a word? |
|---|---|---|---|
| 107.0 s | V5 arc_draw, cue f3193, 0 dB ("arc 2 sweep") | s20 "arc." | No. The vowel is 30-40 dB over the sweep in band; the /k/ release is 26 dB clear in band and level with the sweep's hiss only above 4 kHz. The flag is the word's decaying tail. |
| 110.6, 110.8 s | V5 uh_oh, cue f3307, -6 dB (J3b) | s20 "place." | No. See V2-R1-12: vowel 8-19 dB clear in band, /s/ 43-54 dB clear in 4-12 kHz. |
| 240.1, 240.2 s | V9 uh_oh, cue f7190, -10 dB ("he deflates: the estimate keeps up") | n23 "keeps up" | No. Vowel cores 15-35 dB clear in band, the /s/ of "keeps" 48-50 dB clear above 4 kHz; the /p/ release of "up" (240.16-240.26) is 1-6 dB over the sting. |
| 294.2 s | V11 sun_glare, cue f8813, -9 dB (tile 3) | s43 "sunlight," | No. The word is 11-34 dB over the glare in band; the glare's energy is outside 300-4000 Hz and the flag falls on the word's tail. |
| 310.7 s | V12 partition_thunk f9318 (+2 dB, the far end meets the wall), sensor_pulse f9322 (-4 dB), footstep_wood f9315 (-9 dB) | s47 "too." | No. The vowel is 10-17 dB over the effects in band through its core; the thunk is low-frequency (it ties the voice only full band), the /t/ burst is 27 dB clear above 4 kHz. Same verdict r1 gave this beat. |

Evidence: `masking_check.txt` (each time with the overlapping effects, the word, and 40 ms tables in 300-4000 Hz and
4-12 kHz).

## Captions (script/subtitles_v2.srt = package/Future_Got_Weird_Video_02_v2.srt, byte-identical)

- Word for word: 899 tokens, 0 differences against `v2/script_v2.json`, the 51 lines of `v2/SCRIPT_V2.md` and the
  timeline's segment text and aligned words (case and punctuation included). 104 cues, no overlaps.
- In-times: see V2-R1-41. Out-times: no cue goes out before its last word stops sounding (minimum +0.4 frames, median
  +7.3).
- Lines <= 42 (max 42), <= 2 lines, reading speed max 19.81 cps (41 cues between 17 and 20), no cue under 1.0 s.
- No cue spans two narration lines (segments).
- Breaks: see NEW-01 and NEW-02.

## New issues

- **NEW-01 (polish), captions, line breaks inside tight phrases.** In 20 two-line cues the line break splits an
  adjective or determiner from its noun, a number from its unit, or an auxiliary from its verb (the line-wrap scorer
  prefers balanced lines). Present in r1 too, not flagged then. Suggested breaks, all <= 42: 3 "Yet researchers have used
  light / bouncing off a wall" (with NEW-02); 5 "That dot is their position estimate. / Not a photograph."; 11 "So how do
  you turn / a tiny delay into a location?"; 12 "First, a puzzle: / why does a plain wall work at all?"; 22 "with a
  different sensor and hidden object: / the wall's big echo, then,"; 26 "Its timing says / how much farther the light
  travelled."; 29 "Light covers about / thirty centimetres every nanosecond."; 32 "Measure the extra delay, / and you know
  how far he is from that spot."; 45 "That's why the answer is / a likely location, or a rough shape."; 49 "In 2012, an MIT
  team rebuilt / the rough 3D shape of a hidden mannequin."; 50 "By 2021, others had / live video around corners."; 52
  "One team had even tracked / hidden objects with a cheap sensor."; 62 "The team's smartphone-grade device / had about a
  hundred pixels:"; 64 "And if you hold one in your hand, / it jiggles."; 65 "Their fix borrows / night mode's trick from
  phone cameras:"; 85 "safety-vest style / reflective material on the target,"; 98 "bright sunlight, / and fast math on
  small hardware."; 102 "To really hide, / he'd have to block the bounces too."; 104 "Subscribe for more, / and we'll see
  you around the corner." (69 "its listening / spots" has no fit under 42 without re-cutting the cue.)
- **NEW-02 (polish), captions, cue 3/4 in the hook (f149-309).** The cue boundary falls inside "bouncing off | a wall".
  Re-cut n01 as "Yet researchers have used light / bouncing off a wall" (f149-247, 15.7 cps) and "to track someone hidden
  around a corner." (one line, 40 chars, f247-309, 19.5 cps).
- **NEW-03 (polish), music under the V6 roll-up (f4444-4470).** No new notes, but the held Gadd9 rises about 4 dB as the
  board rolls up (music stem -34.0 dBFS at 148.0 s to -30.3 at 148.6 s; strings -34.5 to -29.5) because the 'roll'
  segment is gained 3 dB above 'U' (plan.json: 19.32 vs 16.32 dB, 0.35 s ramp from 148.13 s). MUSIC_NOTES describes the
  resolve as settling here. Not listened to: it may read as a small swell into the museum rather than a settle. Fix: give
  'roll' the U segment's gain or a 1-2 dB down-ramp, so the held chord decays into the V7 cut.

## Files

`audio_checks.txt` (all band tables and onset lists), `masking_check.txt`, `motor_n30_band40.txt`, `band_scan.json`,
`srt_check.json`, `srt_vs_speech.json`, `ebur128_upload.txt`, `loudness_python.json`, `envelopes_checked_beats.jpg`,
`bursts/*.jpg` (U hold and roll-up, U tap, roll-up start, V1 beep contact, V3 mirror slide, V5 crossing, V4 zoom, V11 n30), `scripts/`.
`render.wav` (decoded audio) and `frames/*.png` are working files and are not committed.

## Not checked

Listening of any kind (tone, performance, whether the swell or stings feel right); playback at normal speed; the 4K
master; how YouTube re-encodes the audio (the 0.3 dB true-peak margin is measured on this file only); caption rendering
in the YouTube player.
