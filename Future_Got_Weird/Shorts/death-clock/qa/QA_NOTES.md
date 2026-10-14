# QA notes: The Death Clock v1

## What was inspected, and how

This environment cannot play video or audio in real time, so **nobody has watched or listened to this Short at speed.** Every check below is either a measurement or a look at still frames decoded from the encoded files.

| Check | Method | Result |
|---|---|---|
| Picture, whole film | Contact sheets of every 6th frame decoded from the encoded captioned master (`qa/v1/sheet_*.png`), read sheet by sheet | See shot notes below |
| Phone-size readability | 16 frames scaled to 360×640 with an approximate Shorts UI overlay (`qa/v1/phone_ui_overlay.png`). The overlay geometry is an estimate, not the platform spec. | Captions, countdown, alert, STABILIZING and "42 Years" all sit inside the working area (x 90–900, y 180–1480) |
| Changed shots, full detail | Full-frame stills of S11 lift-off and S14 after the fixes | See fixes |
| Pops, flash frames | Frame-difference scan of the encode (`tools/motion_scan.py`) | See "Motion scan" |
| FUTURE CONCEPT label | `tools/check_label.py` on the decoded master and clean files: label text versus pill contrast, every frame | See "Final encode checks" |
| Countdown logic | `source/scripts/check_device.ts` evaluates the device state for all 1373 frames | **PASS**: one origin at 00:02:14 (frame 579, 19.30 s), never increases, only 1-second steps, frozen at 00:01:52 from frame 1056, never reaches zero, one contiguous glitch window (frames 1291–1298). Output in `qa/DEVICE_CHECK.json`. |
| Captions vs. locked narration | `tools/make_srt.py` asserts the 31 caption chunks join to the five locked blocks exactly | **PASS** |
| TTS text vs. locked narration | `tools/check_tts_text.py` | **PASS**, 5/5 blocks exact |
| Narration words | Blind Scribe transcription of the selected take | All 98 words, in order |
| Loudness / peaks | ffmpeg ebur128 + true peak on mix and stems (`qa/AUDIO_QA.json`) | Mix −14.9 LUFS, LRA 5.8 LU, true peak −1.7 dBTP; stems sum to the mix (max error 2.4e-7) |
| Voice over bed | Short-window level of narration vs. everything else, during speech | Speech-weighted margin min 7.8 dB, median 18.3 dB; tightest at 36.3 s (rotor/heartbeat under "lose consciousness"), 35.3 s and 42.1 s |
| Durations | ffprobe on every deliverable (`exports/v1/EXPORT_METADATA.json`) | See "Final encode checks" |

**Not verified:**
- Listening: voice tone and naturalness, pronunciation of "nano-sensors", "cellular decay" and "life expectancy", whether the lengthened pauses sound natural, SFX realism, and how the mix feels against the picture.
- Real-time motion: whether moves feel smooth or rushed at speed. The frame-difference scan finds pops but cannot judge feel.
- Device colour and brightness on actual phones, and the real YouTube UI overlay.

## Shot notes (timecodes in the final film)

| Time | Shot | Observed in decoded frames | Status |
|---|---|---|---|
| 0.00–0.80 s | S01 | First frame: man stumbling with his right hand clutching his chest, blue band on the LEFT wrist, dog behind on the right, FUTURE CONCEPT label top-left. First word at 0.12 s. | OK |
| 0.80–1.70 s | S02 | Knees buckle, brace, onto his side on the grass; band toward camera; the dog steps back | OK |
| 1.70–2.00 s | S03a | Accelerating zoom with roll toward the wrist. Frame 56 is a deliberate whip-zoom spike in the motion scan. | OK (intended) |
| 2.00–3.77 s | S03b | Close-up: VITAL SCAN green, then a slight red edge; his pained face in soft focus; dive into the glass | OK |
| 3.77–8.20 s | S04 | Reservoir beads, cutaway (skin, yellow fat, tissue, red vessel), micro-port needles, sensors cross into the vessel. "MICROSCOPIC NANO-SENSORS" emphasis caption. | OK |
| 8.20–13.80 s | S05–S06 | Vessel ride; docking; two cells grey and flag amber on "cellular decay"; pull-out | OK |
| 13.80–18.00 s | S07 | Body map; organs flag amber on "begin to fail"; heart quivers, "RHYTHM: LETHAL" card; signal runs down the left arm | OK |
| 18.00 s | cut | Match cut to the same watch. One frame of green, then crimson over 4 frames. | OK |
| 18.0–21.0 s | S08 | CALCULATING, then **00:02:14 appears at 19.30 s** and starts counting down | OK |
| 21.1–24.9 s | S09 | Close crop on the digits; "DOWN TO THE EXACT SECOND." caption below the case, not over the digits | OK |
| 24.9–28.0 s | S10 | Blue pulse wave, HELP ALERT SENT, signal bead | OK |
| 28.0–30.4 s | S11 | Map, pin, data packet; drone lift-off from a rooftop pad; TIME COMPRESSED tag from 29.13 s | **Fixed** (see below) |
| 30.4–33.6 s | S12 | Drone crosses the street and hovers over him; dotted link to a location pin. The dog stands just behind him, partly overlapping his hips in depth. | OK, minor |
| 33.6–37.0 s | S13 | Inset: tiny injection, blue droplets; STABILIZING slides up as HELP ALERT SENT slides out (2–3 frames of both, clipped by the screen); timer frozen at 00:01:52 | OK |
| 37.0–40.0 s | S14 | Push up, legs come round, sits on the grass; band turns green at 38.33 s; dog sits behind him; drone hovers | **Reworked** (see below) |
| 40.0–43.0 s | S15 | Opening wrist framing, now with him sitting: "Life Expectancy:" / "42 Years" clearly legible 40.0–41.9 s, then a rack focus to his face on the question (the readout softens, by design) | OK |
| 43.0–45.77 s | S16 | One localized glitch, "?" for 8 frames (43.03–43.27 s); the readout restores; hold on the opening wrist composition to the end | OK |

## Defects found in the first full render and fixed

1. **TIME COMPRESSED tag clipped** (29.1–33.6 s): the text ran past its pill, so it read "COMPRESSEI" on light sky. The pill was widened to 330 px, the same width as the FUTURE CONCEPT pill. Checked in a still: the full text is now inside the pill.
2. **Caption covering the drone pad** (29.5–30.4 s, "alerts emergency services"): the lift-off was framed with the pad at screen y≈1376, behind the caption box. The camera was moved so the pad sits at y≈1060 and the caption falls on the plain building wall below. A roof lip and a rooftop vent were added so the block reads as a building. Checked in stills at frames 892 and 906.
3. **Recovery pose read as a side plank or lunge** (37.0–40.0 s): the old "sit" kept his thighs pointing back. One frame showed the right arm swinging above his head. The rig could only rotate legs in the picture plane, so lying (feet to the right) to sitting (feet to the left) was impossible without passing through the ground. Fixes:
   - Thigh, shin and foot foreshortening added to the character rig (`lFs/lFsh/rFs/rFsh` in `Man.tsx`), so the legs can swing toward the camera.
   - New keyframes: push up on both hands (37.6 s), legs shortest as they pass under him toward the camera (37.8 s), seated with the near knee raised and drawn in front of the torso, the band arm resting on it (38.5 s).
   - Per-foot contact shadows. Two soft clothing-rustle cues added to the mix at the push and the swing.
   - Checked in stills at 1124–1200.

## Motion scan
See "Final encode checks". Expected spikes are the hard cuts, the deliberate whip zoom at frame 56, the digit crop push in S09 (frames 640–644) and the map-to-lift-off cut inside S11 (frame 886).

## Remaining limitations (not fixed)
- **S14 transition (37.6–38.2 s):** the legs swinging toward the camera are a 2D approximation. For about 0.3 s his knees are tucked under him with the feet low in frame. It reads as a quick tuck in stills; nobody has judged it at speed.
- **Close-up lower half (S15–S16):** his tee fills the lower ~40% of the frame as a broad soft-focus orange area. The ending matches the opening framing by design, so this was kept.
- **Leash:** the cord itself is drawn as stacked stroked paths (a thin cord with a highlight), not as an outline. The brief's no-strokes rule applies to body and prop outlines; the cord is the one prop drawn this way. UI graphics (ECG traces, dotted signal path) are also strokes.
- **Opening pace:** the first sentence runs about 207 wpm in the selected take, a little above the 180–195 guide (see `audio/narration/NARRATION_PROVENANCE.md`).
- **Label size:** FUTURE CONCEPT is 37 px text in a 330×60 pill (about 12 px tall on a 360-px-wide phone). Legible in the phone overlay, but small.
- **Voice-to-bed margin:** at 36.3 s the speech-weighted margin is 7.8 dB. Measurement suggests it is intelligible; this is unverified by ear.

## Final encode checks
Pending: the final masters are re-rendering with the fixes above. This section will be filled in from the encoded v1 files.
