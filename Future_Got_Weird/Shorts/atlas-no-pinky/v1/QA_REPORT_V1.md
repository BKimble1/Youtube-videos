# QA report — Why This Robot Has No Pinky (Atlas Short)

Production pass: 10 Oct 2026. **Not published, not uploaded.**

## Review status — read this first

| Check | Status |
| --- | --- |
| Renders, media specs, loudness/peaks, SRT timing, integrity, determinism | **Measured** (below) |
| Picture review | **Frame-based only**: contact sheets, transition/grip frame bursts, a 360 × 640 sheet, a safe-zone overlay. The film was **not watched at speed** |
| Narration naturalness, tone, dry delivery, pronunciation by ear | **Not reviewed — nobody has listened.** Only proxy: Scribe transcribed the take word-for-word (88/88) |
| Sound effects and music by ear (normal and phone-speaker volume) | **Not reviewed — not listened to.** Effects and music are synthetic; judged only by measurements and a spectrogram |
| Audio/picture sync | **By construction** (one cue table drives both) plus spot-checks of frames; not checked by ear/eye in playback |
| Real phone / current Shorts UI | **Not tested.** Conservative overlay mock only |
| Primary sources re-read | **No** — blocked by the sandbox network policy (see `claim_ledger.md`, C05 unresolved) |

**Recommended before anyone publishes:** (1) watch it with sound on a phone; (2) listen for voice tone, "actuators" and "thirteen", and for harshness in the synthetic effects; (3) confirm "three more actuators" in the IEEE Spectrum interview text.

## Deliverables and measured specs

| File | Result |
| --- | --- |
| `FGW_Atlas_No_Pinky_1080x1920.mp4` (clean) | H.264 High, yuv420p, BT.709, 1080 × 1920, 30 fps, 1038 frames = **34.60 s**, AAC-LC 48 kHz stereo 320 kbps, 10.4 MB, decodes without errors |
| `FGW_Atlas_No_Pinky_Captioned_1080x1920.mp4` | Same, with fixed-lane phrase captions, 10.9 MB |
| `FGW_Atlas_No_Pinky.srt` | 21 cues; monotonic, no overlaps; ≤ 2 lines, ≤ 30 chars/line; text equals the 88 narrated words in order; every cue start equals its Scribe word start (0 mismatches). Peak reading speed 21 chars/s on very short cues ("More cost.") |
| `cover/FGW_Atlas_No_Pinky_Cover.png` | 1080 × 1920: opening hand, circled missing position, `NO PINKY?` / `ON PURPOSE.` |
| `audio/` | narration (mp3 + 48 kHz wav), alignment JSON, cue table, `stems/{narration,music,effects}.wav`, `FGW_Atlas_No_Pinky_mix.wav`, `sfx_log.csv`, `MIX_LOG.json`, provenance |

**Loudness (final MP4 audio, ffmpeg ebur128):** integrated **−14.5 LUFS**, LRA 2.5 LU, true peak **−1.4 dBTP** (target −14 to −16 LUFS, ≤ −1 dBTP). Pre-encode WAV mix: −14.4 LUFS, −1.5 dBFS after limiter. While the narrator speaks: voice −16.4 dBFS RMS, music 19.7 dB below the voice (about −32 dBFS RMS in the gaps, so it breathes back up ~4 dB between phrases; target guidance 16–22 dB), effects 18.9 dB below on average with higher peaks at contact events. L/R correlation 0.9999 (mono sum level equals stereo level: mono-safe). Last 1.17 s after the final word is voice-free; the mix fades over its last 0.12 s so nothing is clipped.

**Timing:** speech 0.00 – 33.43 s; picture ends at 34.60 s (one register click at 33.55 s, tonic chord rings out). Within the 34–40 s target; shorter than the 36 s editorial estimate because the real narration is tight. The voice was not sped up.

## Determinism

Two earlier builds were each rendered twice with identical decoded-frame hashes. The final build was rendered once (frame-hash digests: clean `65e659905e9e3918`, captioned `7759de6451508524`). All motion is frame-driven; randomness is seeded (`rand`, fixed RNG seeds in audio).

## Visual review (frame-based)

- **First two seconds, muted:** hand mid-opening from frame 0, `NO PINKY?` visible from frame 0, one rigid click at frame 6, dashed ghost pinky + coral circle by frame 30, checker rises with a raised brow, `ON PURPOSE.` lands at frame 63. No logo or intro card.
- **Digit count:** robot hand is thumb + three fingers in every shot (front and side views). No five-digit hand is ever shown losing a finger.
- **Continuity:** same hand rig, palette and stand across B01/B03/B04/B09 (identical pose at the loop point); same tool across B05c/B07/B08; same tray/dock rim position across B06→B07.
- **Contacts:** washer, die, trigger and dock contacts are driven by IK to fingertip targets in the same coordinate frame as the objects, so held objects move rigidly with the hand. Contact frames (pinch 525, trigger 581, dock 849, regrip 897, tag 1007) sit on the cue table.
- **Transitions inspected in bursts:** tape wipe (B01→B02), iris cuts (B03→B04 wall, B04→B05, B05a→b→c, B08→B09), card→tray morph (B05→B06), tray→dock match cut. No strobing or full-screen flashes.
- **Pops found and fixed:** tool teleporting into the dock at B07 start; source chip flicker at tag changes; double-eased timing helper; B08 card flying past in 10 frames; overlapping props at the B02 hand swap; forearm tube covering the checker's face; titles overlapped by the arm in B05.
- **Phone legibility:** headlines 100–150 px, source chip 40 px (two lines), captions 52 px. Viewed at true 360 × 640 (`qa/phone_360x640_sheet.png`): headlines, chip and captions readable. Safe-zone mock (red = top 220 px, right rail x > 930, bottom 360 px; green = x 100–870, y 220–1440): all headlines and chips are inside green; captions end about y 1480, outside the red zones but ~40 px past the conservative 1440 line.

Sheets: `qa/contact_sheet_clean.png`, `qa/contact_sheet_captioned.png`, `qa/phone_360x640_sheet.png`.

## Known limitations

- Voice and sound design are unlistened (see status table). The effects (tape rip, servo, stamp, register) are procedural and may sound thinner than recorded foley.
- In the tool-grip shots (B05c, B07, B08) the side-view palm reads somewhat like part of the drill; the long forearm tube crosses the checker's torso (her face stays visible).
- The B03 stamp is deliberately oversized and covers much of the hand for ~1 s.
- B02's cup/knob actions are simplified hook grips; the human-hand prop is cartoonish by design.
- The checker is partly cropped by the left frame edge during the B01 push-in.
- Optional alternate opening B and Runway inserts were **not** produced (requested to avoid duplicate generations; not needed).
- Git LFS uploads are Forbidden in this environment, so audio and MP4s are committed as ordinary blobs via the scoped `.gitattributes`.

## Reproduce

See `README.md`. `tools/build_cues.py` → `tools/build_audio.py` → Remotion render.
