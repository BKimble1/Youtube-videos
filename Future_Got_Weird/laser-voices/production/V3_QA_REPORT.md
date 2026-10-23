# Laser Voices V3: change and QA note

23 Oct 2026. V3 is a motion, character, sound-design and loop pass on V2. **Not published, not final.** Nobody has
watched or listened to it in real time. Every check below was done by measurement, ASR or decoded still frames (see
"How it was reviewed").

## Files

- `exports/FGW_Laser_Voices_V3_REVIEW_1080x1920.mp4`: 1080×1920, H.264 High, 30 fps, 1022 frames (34.067 s), bt709;
  AAC-LC 48 kHz stereo (ffmpeg's encoder at a 320k target; ffprobe reports 260 kb/s).
- `exports/FGW_Laser_Voices_V3_MASTER_2160x3840.mp4`: native 2160×3840 (the vectors rendered at 2×, not upscaled), the
  same cut and the same audio.
- `captions/FGW_Laser_Voices_V3.srt`: byte-identical to the V1/V2 SRT (the same 23 cues, words and times).
- Source: `source/src/v3/` (composition `LaserVoicesV3`, still `V3Still`, cast sheet `V3Cast`). The rebuild steps are
  in `README.md`.
- Audio: `audio/mix/FGW_Laser_Voices_V3_mix.wav`, the motif stem `audio/mix/stems_v3/motif.wav`, the cue record
  `audio/motif_cues_v3.json` and the measurements `audio/mix/mix_measure_v3.json`.
- Evidence: `qa/v3/`.

V1 and V2 exports, sources, audio and captions are untouched.

## Narration: preserved

- **Source file:** the approved narration file is unchanged (sha256 `b22271734436…`, in `mix_measure_v3.json`).
- **Placement:** it sits at sample 0 with the V1/V2 gain (×1.4303098, measured from the V1 voice stem; residual
  1.2e-7). There is no stretch, pitch change, edit or fade.
- **Master stage:** the same soft clip as V1/V2 (tanh at −1.5 dBFS).
- **Proof:** wherever neither the old message nor the new motif sounds (74.2% of the samples), the V3 mix equals the
  V2/V1 mix within 3 LSB at 24-bit. So the voice, music, room tone and effects are unchanged.
- **Words:** Vosk on the V3 review: WER 0.01 against `NARRATION_APPROVED.txt`. The only difference is "its" heard as
  "it's", the same as V2.
- **Timing:** 22 of 23 caption windows are matched by ASR (the miss is that same homophone). The decoded MP4 audio
  sits at 0.0 ms offset from the mix WAV, correlation 0.99998.
- **Loudness:** −14.5 LUFS, LRA 3.8, true peak −2.6 dBFS, the same as V2.

## Transmitted-message effect: replaced

**Removed (not covered):** the V1/V2 message stem, a voice-like murmur on 0–3.90, 17.73–19.87, 23.93–27.17 and
31.93–34.07 s.

**Added:** an original nonverbal motif, built in `tools/make_audio_v3.py`:
- a soft vowel-like resonance (harmonics through two broad, slowly moving formants);
- a faint, slightly flat upper fifth;
- a sparse glassy grain edge;
- a downward glide of about 3 semitones with a light irregular waver;
- 40 ms attack and 180 ms release;
- a short room on the motif only;
- high-passed at 220 Hz and low-passed at 6.5 kHz.

**Cue record**

| # | Cue | Time | What it does |
|---|---|---|---|
| 1 | Opening reaction | 33.867 s → wraps to 0.40 s | One 0.6 s instance across the loop seam. Frame 0 starts 0.2 s into it, so he is already hearing it. |
| 2 | Quiet return | from 25.90 s | Starts in the pause after "laser" and sustains quietly. |
| 3 | Interruption | frame 815 (27.167 s) | Cut by the picture's own `received` gate (3 ms ramp, wet and dry together). The motif is −140 dB from the first 10 ms after the block. No tail. |
| 4 | Restoration | frame 958 (31.933 s) | The same instance shape, in the gap between "move" and "You". |

**Mix measurements**
- Level: −20.0 dB re the narration RMS during overlap, plus about −4 dB of slow ducking under speech. Motif peak
  −19.9 dBFS.
- Spectrum: the energy sits in 200 Hz–1 kHz. 1–3 kHz is −11 dB, 3–8 kHz is −22 dB and below 200 Hz is −51 dB, so
  there is no narrow shrill band and no sub swell.
- Mono: L/R correlation of the motif is 0.75 (the dry part is mono; only the short room is decorrelated). Folded to
  mono it is 0.6 dB quieter. The whole mix's L/R correlation is 0.9995.
- **Not done:** the level was set by measurement only. It has not been judged by listening. A listening pass on
  phone speakers should confirm −20 dB is audible but unobtrusive.

**Bed seam:** the music and room-tone stems get a 12 ms raised-cosine fade at the very end and start of the file, so
the loop has no click. The narration is not faded. The V1 music pulse (92 bpm) is not phase-aligned to the 34.067 s
loop: its last beat (33.91 s) is followed 0.15 s later by beat 0 on replay.

## Picture changes

### Layout (the root fix for the wide, small-character frames)

**Camera and laser placement**
- The fixed projection moved higher (camera at 3.4 m, 30° down).
- The laser now stands on a post on a lab bench almost straight in front of the listener (exit at 1.42 m). The
  2.44 m (8 ft) path still ends at his ear.
- The path now runs up the portrait frame, source low, ear high, so source, crossing and listener share one compact
  view.

**Where she crosses**
- She crosses about a fifth of the way from the laser.
- Her head stays below his chin on screen, so she never covers his face.
- The path starts at her shoulder height on screen, so it can only meet her head or shoulder.

### Transition list (outgoing → incoming → new information → kept)

1. **Seam:** close face/ear → the same close face/ear (the motif and the reaction continue). Kept; it is the loop.
2. **0.7–2.25 s:** close face → the two of them: the unaffected companion beside him, cup in hand. Kept. This replaces
   V2's long retreat into the floor at 2–4.5 s.
3. **3.5–4.75 s:** two-shot → two-shot plus the laser head below: the source, with no path drawn. Kept.
4. **4.75–5.55 s:** → the exposed-ear profile. Kept.
5. **5.55–8.85 s:** one ear composition that develops: he checks his ear (fingertips at the lobe, the canal clear),
   drops the hand, blinks, and the frame drifts to the empty air beside the ear on "The beam is invisible."
   Kept. It replaces V2's near-identical ear hold.
6. **8.85–9.95 s:** ear → the air beside it. The illustrative path appears only here. The ear rim, jaw and hair stay
   in view; the room settles to the air colour but the head stays lit. Kept.
7. **9.95–14.6 s:** inside the air: one packet → one absorber (a contained warm flash, then jostling) → expansion →
   three pressure fronts carried by crowded molecules (faint teal shading, no rings of molecules) → the canal.
   Kept.
8. **14.6–16.1 s:** air → back along the path → the laser head. There is no intermediate face shot. Kept. It replaces
   V2's 15.25 s "out by the ear" key and whip.
9. **16.1–17.75 s:** laser head: the cover slides off. The module fires into a mirror plate on a motor shaft (saffron
   pivot dot); the slowed swing turns the beam toward the exit window. Kept.
10. **17.75–19.1 s:** laser head → up its output to ONE arrival scale: the whole path, the listening region warm at
    his ear, the sound arcs gathering there, the companion off-axis and unaffected. Kept. It replaces V2's
    18.5–20 s approach-and-retreat.
11. **19.1–22.85 s:** same scale, slow push. A floor-level 8 FT line and a label lying on the floor (21.74–23.67 s);
    she sips. Kept.
12. **22.85–24.9 s:** → the compact three-quarter crossing view as she shifts her weight and steps off. Kept.
13. **24.9–31.7 s:** the crossing: the block at 27.167 s and one reframe at 28.95 s ("message"), then a slow push.
    Kept.
14. **31.7–33.3 s:** the crossing view → close face/ear on the returned signal. It becomes frame 0. Kept.

**Checks on the transitions**
- **Motion scan:** no one-frame spikes over the whole review. There is no run of 0.8 s or more below 0.35 mean change
  (V3 preview: one static second at 29.6–30.6 s, since given a slow push).
- **Freezes:** none of 1 s or more. No black frames.
- **Strips:** `qa/v3/strips/` has open, to_ear, dive, air_exit, sweep_up, to_cross, reframe, to_cu, walk, sip,
  block (frames 807–825) and clear (frames 951–966).

### Obstruction: picture, path, sound and acting agree

**How the block is defined**
- She blocks the path while her drawn outline (head, bun, neck, torso) touches the drawn path on screen.
- The drawn path ends where it first meets that outline, so it ends at her near-side silhouette, never through her
  head. While she blocks it, the downstream segment is not drawn.

**The walk**
- Her walk is solved (`tools/solve_v3.ts`) so the outline first touches the path on frame 815 and has left it on
  frame 958.
- `tools/check_v3.ts` checks every one of the 1022 frames. The on-screen test and the walk plan agree, with zero
  mismatches, and the blocked frames are exactly 815–957 and contiguous.

**What happens on frame 815**
- The path ends at her face edge.
- The ear accent disappears.
- The motif stops.
- His expression switches to puzzlement within 0.2 s (eased onset from frame 815).
- She is mid-step with her coffee, unconcerned.
- The source stays on.

**Frame 958:** the path, the accent and the motif return together, with no overlap with her outline. He lands a small
recognition (smile, lifted brow, a nod).

### Characters (same Crew heads, palettes and clothing; bodies rebuilt)

**Lead**
- Hips raised: the knees are only softly bent and the feet are under the hips. The weight shifts between legs.
- The torso twists against the hips for head checks; the head sits on the twisted neck.
- New tapered jointed arms: shoulder cap, elbow, forearm, cuff, hand. The sleeve stripes are clipped per segment.
- The paper sheet is removed. His hands rest, halt mid-gesture at the reaction, check his ear and lift slightly at
  the cut.

**Companion**
- Same hip fix.
- The cup arm's elbow now bends down and back (it was up and forward).
- The far arm hangs with a small bend and swings only while walking. It no longer shows as a stray nub below the
  jacket.
- She starts beside him and drifts onto the crossing line as she walks.
- Her feet land on the 14 existing footstep sounds (`check_v3` lists the plants).

**Acting arc:** hearing (frame 0) → a head check toward the source, carried by the shoulders → a look to her, who
notices and sips → checking the ear → concentrating while the mechanism plays → concentrating as the message returns
→ puzzled at the cut, with a small turn toward her → recognition.

**Captions:** the same words and timing. They sit in one band fixed in screen space (y = 1470, x 120–960), clear of
the ear, the mirror, the molecular interaction and the occlusion point in the sampled frames
(`qa/v3/review_phone_ui_sheet.png`, with an approximate Shorts UI mask).

### Loop

**Frame match**
- Frame 0 and the last frame share the close face/ear framing, his reaction pose (brow rising, eyes darting back,
  hand halted near the chin) and the ear accent.
- The camera position, zoom and velocity carry across: the key list is wrapped around the seam.
- The companion is off screen at both ends (she leaves frame left during the final push). The opening reveals her
  beside him.

**Measured**
- Last→first frame difference: 7.97, against 5.2–5.8 between consecutive frames before it. V2's seam was 44.8.
- The seam camera step is −17.5 px against −12.8 px per frame just after it.
- Three end-to-start replays: `qa/v3/strips/loop_x3.png`.

**Audio across the seam**
- The narration's last word ends at 33.45 s.
- The motif instance straddles the seam and its room is computed circularly. The last and first motif samples are
  −0.033 and −0.030.

## How it was reviewed

- Decoded frames from the MP4s: contact sheets and frame strips at every handoff, the block and the return, three
  seam replays, and native-resolution frames and crops (`qa/v3/native/`).
- V2/V3 comparisons: `qa/v3/before_after_v2_v3.png`, and the first 3 s at phone size in `qa/v3/hook_v2_v3_phone.png`.
- Measurements: the motion-spike scan, ffprobe, ebur128, Vosk ASR, the decoded-audio offset and correlation, the
  stem-level comparison with V2, and the frame-by-frame obstruction check.

**Not done**
- No normal-speed audiovisual viewing, and no listening of any kind: this environment cannot play video or sound.
- Timing feel, the motif's character and level on phone speakers, and the pace of the 14.6–16.1 s and 17.75–19.1 s
  moves need a person to watch and listen.

## Known issues and simplifications

1. **Flat figures in a perspective room.** The camera now looks down 30°, while the cards are still drawn in pure
   profile, so the angle is more visible than in V2.
2. **The obstruction is defined on screen, not in 3D.** The path is cut where it meets her drawn outline, which is
   what the viewer reads. It ends at her face edge on the blocking frame and at her neck or shoulder later. A
   viewer may read this as the beam hitting her face. It is drawn as a thin illustrative line, with no impact.
3. **The mirror swing is drawn exaggerated (×3) and slowed.** The beam's far end sweeps about ±17 cm around his ear.
   This is an illustration, not the real scan rate or geometry (as in V1/V2).
4. **The sip arm.** The companion's upper arm comes up to almost horizontal at the sip; the Crew arm lengths force a
   folded arm.
5. **The 8 FT label** is small, and briefly overlaps the caption band as it fades (about 23.3 s).
6. **The music pulse is not aligned to the loop** (see the bed seam above).
7. **The mechanism is a simplification:** water is over-represented so one absorber can be followed, and molecule
   sizes are stylised.
8. **The science is unchanged from V1/V2.** The sources are in `production/SOURCE_NOTES.md`; the obstruction ending
   is still a physical inference.
9. **No claims about performance or retention.**
