# Invisibility Shield V1: production and QA note (first review cut)

23 Oct 2026. **Review cut: not final, not published.**

## Deliverables

| File | What |
|---|---|
| `exports/FGW_Invisibility_Shield_V1_REVIEW_1080x1920.mp4` | Review cut, 29.27 s (see Render settings) |
| `exports/FGW_Invisibility_Shield_V1_MASTER_2160x3840.mp4` | Native 4K master (see Render settings) |
| `production/NARRATION_APPROVED.txt` | Approved narration: the one authoritative text |
| `captions/FGW_Invisibility_Shield_V1.srt` | 21 phrase cues, from the measured words of the final take |
| `audio/narration/FGW_Invisibility_Shield_narration_final.wav` | Final narration, 48 kHz / 24-bit |
| `audio/mix/FGW_Invisibility_Shield_V1_mix.wav` | Final mix; stems are rebuilt by `tools/make_audio.py` |
| `audio/narration/voice_provenance.json` | Voice id, prompts, 4 takes, hashes, selection and ASR results |
| `production/SOURCE_NOTES.md` | Sources, what was blocked, depiction choices, attribution |
| `qa/v1/` | QA JSON, motion scan, phone sheet and transition strips |
| `source/` | Editable Remotion source (composition `InvisibilityShield`, still `FilmStill`) |

**Review cut details:** 1080×1920, 30 fps, 878 frames, 29.27 s. H.264 High, CRF 16, keyframe every 0.5 s. AAC 320 kb/s,
48 kHz. 14.7 MB. Captions burned in.

**4K master details:** 2160×3840, vectors rendered natively at 2×, not upscaled. Same timing, mix and captions as the
review cut.

## Narration and runtime

**Voice.** ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`), the channel's established narrator. I used
take 3 of 4, unedited.

**Pace and runtime.**
- Speech starts on frame 0 and ends at 28.61 s.
- That is 195 wpm over the speech span.
- A 0.66 s tail is appended, giving **29.27 s**.

This is just under the 30–33 s target. I kept the natural read rather than stretching pauses.

**Prior versions.** No earlier voiceover or captions existed for this episode, so there was nothing to replace.

## Story and timing

Every action is keyed from the measured words (`source/src/world.ts`, `CUE`). There is one location and one panel
throughout, and the camera is the observer.

| Time (s) | Picture |
|---|---|
| 0.0–1.2 | Frame 0 is mid-lift. The panel swings up from his left side; his torso, then his head, vanish inside its outline by about 0.6–0.8 s. The wall's band and joints continue through the panel; vertical plank ends and the socket smear; his shins stay visible below it |
| 1.3–7.7 | One continuous push onto the panel: a slow creep, accelerating on "You see". The lens ridges resolve on "tiny lenses" with both side edges in frame |
| 7.9–13.9 | A cut line opens a **top-view section** under the same panel (labelled "simplified light paths"), with a dashed outline of where he stands drawn above the cut. "Sideways": his light reaches the lenses and fans out sideways (a faint ray still reaches the viewer). "Smearing the background": wall light from beside him bends across the space in front of him toward the viewer, and the band closes across the outline |
| 13.4–17.5 | The section folds shut, then the camera pulls back. It arrives a little off the frontal line, where a faint outline shows, then aligns; the outline melts into the smear by "scenery" |
| 18.4–23.9 | The camera eases to the panel's left edge. A small weight-shift dip, then his connected right hand comes round the edge on "around the edge", palm forward, five fingers. It floats, with a finger ripple on "floating in midair", then withdraws |
| 23.9–26.4 | The panel is lowered: head, shoulders, then torso return across the top edge. It is then carried to his side and his legs return. Feet stay planted and his height never changes |
| 27.4–29.27 | A knowing look on "the entire time". Then the grip, a small dip and the start of the next lift, which runs into frame 0 |

## Transition list (outgoing → incoming → new information → decision)

There are **no cuts**. Every change of view is a continuous camera move on the same scene, and the mechanism is
visited once.

1. **Loop seam.** End of the film (lift starting from his side) → frame 0 (the same lift, mid-motion). New information: none. The loop is continuous. **Keep.**
2. **Full shot → panel surface** (continuous push, 1.3–7.7 s). New information: the panel is covered in lens ridges. **Keep.**
3. **Panel surface → top-view section under a cut on the same panel** (7.9–8.6 s). New information: the light paths. **Keep.**
4. **Section → full frontal view** (fold closed at 13.4–13.9 s, then pull back). New information: the result from the viewer's position. The view does not return to the mechanism afterwards. **Keep.**
5. **Off-axis → aligned** (15.3–17.5 s, a modest lateral move). New information: "from the right position" — the outline fades only when aligned. **Keep.**
6. **Full view → the panel's left edge** (18.4–19.6 s). New information: frames the space where the hand appears. **Keep.**
7. **Edge framing → full shot** (23.9–25.3 s, during the lowering). New information: the whole person returns. **Keep.**

**Removed or merged:** nothing. There is no exterior → mechanism → exterior → same-mechanism detour.

## Checks performed

### Automated, on the rendered MP4

**Build:** `tsc --noEmit` is clean.

**Container, loudness and sync:**
- ffprobe: as listed under Deliverables.
- Loudness (ebur128): I −14.6 LUFS, LRA 4.9, true peak −2.6 dBFS.
- No black segments. No freezes of 1 s or longer (after fixes).
- Largest keyframe gap: 0.5 s.
- Audio against the mix: offset 0.0 ms, correlation 0.99997.

**Transcript (Vosk, small English model, free recognition of the MP4's own audio).** Word error rate against the
approved text is 0.065. All remaining differences are spelling-only or the systematic "raise the" (see Remaining
limitations):

| Approved | Heard |
|---|---|
| raised this | raise the |
| its | it's |
| midair then | mid air than |

Caption windows: 19 of 21 match. The other two are the "raise the" and "mid air" spellings.

**Motion scan:** no one-frame spikes. An earlier render had spikes at 8.3 s and 13.6 s, where the section opened and
closed too fast; those moves were slowed. Largest change: 15.6 at 14.6 s, the pull-back.

**Loop seam:** last-to-first frame difference is 2.95, against about 1.1 between neighbouring frames. The difference
comes from the first caption appearing on frame 0, which it must, because speech starts there. Pose, panel and camera
are continuous across the seam.

**Mix:** narration −17 LUFS. The music bed sits about 14 LU under it and ducks under speech. The voice is about 28 dB
above everything else in the 400–5000 Hz band. The bed is built to loop: whole cycles, with a noise crossfade at the
seam.

### Visual inspection of decoded frames (contact sheets and stills, not real-time playback)

- **Contact sheets** at 2 fps across the whole film: `qa/v1/` and the scratch sheets.
- **Transition strips** read from the MP4 (`qa/v1/strips/`): hook, push, cut open, close and pull, align, to the hand,
  hand out, ripple, return and lowering, carry aside.
- **Muted, phone-size sheet** with approximate Shorts UI zones (`qa/v1/review_phone_ui_sheet.png`). Captions stay
  clear of the top, right and bottom UI zones and of the panel edges in the full shots.
- **Native-resolution stills:**
  - floating hand: five digits, palm forward, wrist hidden at the edge;
  - finger ripple;
  - knowing face and hanging arm;
  - frame 0.

**Defects found in these passes and fixed:**
- Hair poked above the raised panel: the panel was raised higher.
- The panel interior was washed out and read as frosted glass: the ridge, tint and residual levels were lowered.
- The off-axis outline was far too strong, and it also fired during the hand and lowering camera moves: it was
  limited to the D window and reduced.
- The elbows poked past the panel's edges while it was lowered: the elbow excursion was reduced (the arm is
  foreshortened).
- A static 4 s hold after the lift: replaced with one continuous push that runs into the lens reveal.
- The section opened and closed too fast.
- The finger ripple was too subtle.
- The arms were too thin.
- The poses had no idle life: breathing added.
- The hand's return overlapped the start of the lowering: re-timed.

### 4K master

**Container:** 2160×3840, 30 fps, 878 frames, 29.269 s, H.264 High, CRF 16, AAC. 39.9 MB.

**Audio:** the decoded audio is bit-identical to the review cut's (same MD5 of the decoded stream): −14.6 LUFS, peak
−2.6 dBFS.

**Picture:** a native crop (hand at 20.6 s) against a 2× Lanczos upscale of the review frame shows sharper vector
edges on the native render (`qa/v1/master_native_crop_vs_upscaled_review.png`). The master was not inspected beyond
that crop and the metadata.

### Not performed

- **Nobody has watched or listened to the cut in real time with sound.** This environment has no audio or video
  output. Pace, voice quality and mix balance are judged only from measurements, transcripts and frame inspection.
- No check against the maker's videos: they could not be reached (see `SOURCE_NOTES.md`).

## Remaining limitations (for the reviewer)

1. **Unverified depiction.** The Kickstarter pages, maker site and press pages were blocked, so the panel's look,
   handles, stance and optics follow search summaries only. Compare with the campaign videos before publishing.
2. **Opening words.** All four takes are transcribed by two local recognisers as "raise the shield". This is probably
   a small-model bias on the elided "-d th-". **Listen to the first second** to confirm "raised this".
3. **Runtime.** 29.27 s, slightly under the 30–33 s target, because the natural read is 195 wpm.
4. **Stylised scale and diagram:**
   - The panel (1.30 × 0.75 m) is a stylised size between the reported Full Size (0.99 m) and Megashield (1.83 m).
   - The lens ridges (about 2.5 cm pitch) are far coarser than the real lenses.
   - The top view compresses depth, and its rays are representative, not simulated.
5. **Optics are a deterministic 2D approximation, not a physical simulation:**
   - a horizontal-only blur of the same wall, with slight magnification;
   - a wide sideways blur of the person at low opacity;
   - a lightly blurred outline when off-axis, plus a little wall parallax.
6. **Hidden grip handoffs.** The left hand changes grip, and the supporting hand takes the load before the reach.
   Both happen behind the panel, so only a small dip of the panel shows the weight shift. His left arm is hidden behind
   the panel whenever it is carried at his side.
7. **Section labels** (WALL, YOU, LENSES, VIEWER) are small at phone size.
8. **The floor** is a large, plain area in the full shots. It keeps the captions clean but is visually quiet.
9. **The music** is synthesised and restrained. Its balance against the voice has been measured, not heard.

## Render settings

**Review cut:**

    npx remotion render src/index.ts InvisibilityShield ../exports/FGW_Invisibility_Shield_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4

**4K master:** the same command with `--scale=2`, writing `../exports/FGW_Invisibility_Shield_V1_MASTER_2160x3840.mp4`.
