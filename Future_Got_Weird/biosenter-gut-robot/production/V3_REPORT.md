# BIOSENTER Gut Robot: V3 final report

**Deliverable:** `exports/FGW_BIOSENTER_GUT_ROBOT_V3_FINAL_1080x1920.mp4`
(SHA-256 `02544f16…cfcf78`; the full hash is in `qa/v3/sha256.txt`). Composition `BiosenterV3`, mix `mix_v3`.

## 1. Changelog (V2 → V3)

- **Pig-study label removed completely.** The pill, its text, its fade/slide animation and its UI-tick sound are
  deleted from source (`scenes/pig.tsx`, `tools/make_audio.py`); no replacement shape or label.
- **Pig experiment rebuilt around a continuous route:**
  - **Coil:** redrawn as vertical columns. The cutaway's straight tunnel now hands over to a straight, downward
    stretch, so the robot never starts wrapped round a turn.
  - **Robot marker:** drawn along the intestine path itself, with the same body plan and colours as the 3D robot. It
    bends with the tube through every turn, at a constant scale, and keeps crawling with no loop reset (V2's glyph
    reset its cycle every 2.5 s).
  - **Tether:** the robot now trails a tether back along the route and out of the pig. Slow dashes move toward the
    robot, showing it is fed and gently pushed from outside: the pig travel was assisted, not an independent journey.
  - **Camera:** a gentler push-in (+18%, down from +75%) overlapping the travel, then a pull-back on "6+ FEET" and a
    slow drift. The pig is never cropped; at the strongest push its right margin measures 90–96 px.
- **Kirigami grip:**
  - **Tab size:** the tabs are a fixed physical size cut into the sleeve (V2's flaps stretched with the balloon).
    They are smaller (0.12 against 0.16 body radii) and blunt, with flat tips instead of points.
  - **Lift:** they rise at most 38° (V2: 50°), progressively as the sleeve stretches. There is no snap and no
    overshoot.
  - **Contact:** the wall now rests on the tab tips, so they meet the mucosa and never enter it.
  - **Shading and sound:** both faces of a tab are shaded as the same sleeve film. The lift sound is a softer, longer
    ripple.
- **Biopsy:**
  - **One connected instrument:** cable, steel clevis, and two cup jaws hinged on it.
  - **Full sequence:** it reaches out closed, opens on the way, advances to touch the villi, closes, then retracts.
  - **Sample:** it exists only once the jaws have closed, and stays seated in the cups. The notch appears in the
    mucosa at the same moment.
  - **Framing:** the tool close-up is about 45% tighter, so the action reads immediately on a phone.
- **Liquid delivery:**
  - **Droplets:** the sparkle cloud is replaced by a short burst of 34 round droplets, each with its own fixed birth
    time and trajectory. They come from the nozzle tip in a narrow cone (about ±12°), slow toward the wall, and fade
    as they land. Nothing loops or flickers.
  - **Mist:** a faint mist shows near the nozzle only while the burst runs.
  - **Stain:** it grows only as droplets land.
- **Ending:** the descent from the wide view to the opening framing now takes 2.9 s instead of 2.45 s, so it reads as
  slower and steadier. The robot completes a full crawl cycle in the wide view (verified in
  `qa/v3/ending_21.2-26.3s_and_loop.png`), and the last frame continues into frame 0.
- **Captions:** the final caption now clears 0.12 s after "it." (V2: 0.18 s), so the converging camera never puts the
  robot under it.
- **Unchanged from V2:**
  - the narration (master WAV byte-identical, SHA-256 `4a1c8a51…`);
  - the 26.30 s runtime and 789 frames;
  - the palette, the robot design, the music and the shot order.

## 2. Output verification (`qa/v3/`)

| Check | Result (measured on the delivered file) |
|---|---|
| ffprobe (`metadata.json`) | H.264 High, **1080 × 1920**, SAR 1:1, DAR 9:16, yuv420p, **30/1 fps** (r and avg), 789 frames, 26.300 s; **AAC-LC** 48 kHz stereo, about 260 kb/s |
| Black borders (`cropdetect.txt`) | ffmpeg `cropdetect` reports `crop=1080:1920:0:0` on every frame: no borders, no letterboxing |
| Source resolution | Rendered from vector SVG at native 1080×1920 (Remotion frames, then x264 CRF 16). No raster upscaling: the film contains no raster assets |
| Decode | All 789 frames, no errors |
| Unplanned frame jumps (`render_qa.json`) | **0** (only the 4 cuts, the planned camera moves and the kirigami lifts) |
| Longest near-static stretch | 14 frames (0.47 s) |
| Loop seam (last vs first frame) | Mean difference 4.06, against a frame-to-frame median of 2.0: an ordinary frame of motion |
| Narration from the MP4's own audio (`final_asr.json`) | Whisper **WER 0.000**; Zipformer 0.013 (its spelling "travelled") |
| Captions over the robot (`keepout.txt`, every frame) | **Pass.** The focal moving part is never covered by more than 4%; the whole robot by at most 10% |
| Crawl mechanics (`kinematics.txt`, 519 on-screen crawl frames) | **Pass.** A gripping anchor moves 0 times (max displacement 4e-15, numerical zero). No backward motion. The body never changes length while neither anchor grips. Net progress is 2.2 units every cycle. No robot surface lies outside the wall except where an anchor grips (min clearance 0.115 units) |
| Label removal | No label code anywhere in source or tools. Pixel scan of the old label box (12.7–16.8 s, every 4th frame): 0 light pixels |
| Mix (`audio/mix/mix_measure_mix_v3.json`) | −14.0 LUFS, −1.6 dBTP, master limiter at most 1.0 dB, music 16.4 dB and effects 17.8 dB under the voice, seamless loop |

**About the "512 × 910" file.** ffprobe on every review file in the repository (V1, V2 and V3) reads a genuine
1080×1920. A 512×910 copy is a preview transcode made by whatever app displayed it. V3 is the publishing master; no
separate proxy was made.

**Frames inspected** (all sheets come from the MP4):

- the 15 requested timestamps (`requested_timestamps.png`);
- the hook, every 3rd frame;
- the macro grip;
- the full S3 cycle;
- the pig beat;
- the tool sequence;
- every cut ±2 frames;
- the ending and the loop.

## 3. Scientific verification notes

The two reference URLs (MIT News, PubMed) and doi.org remain unreachable from this environment: its network policy
blocks them. The verification in `production/V2_SCIENCE_VERIFICATION.md` was made against published coverage of the
study (MIT News as indexed, UT Southwestern, Popular Science, The Scientist, Tech Briefs, Medical Xpress), and it still
stands. V3 changes:

- **Kirigami sleeves.** Scale-like tabs of fixed size, cut in the sleeve, lifting as it stretches, and meeting
  (never entering) the mucosa. This matches the "bristly kirigami surfaces anchor in the slippery mucosa and minimize
  distention" description.
- **Pig travel.** The brief notes the paper reports about 2 m with gentle forward pushing. V3 now shows the tether
  running out of the pig, with slow dashes moving toward the robot, so the travel reads as an assisted, tethered
  procedure rather than an independent journey. The narration ("traveled over SIX FEET") is unchanged and defensible.
- **The removed label** also removes the earlier flag about naming one institution.
- **Unchanged and still accurate:** pneumatic chamber extension (S3 cutaway), the head and tail anchors, the central
  tool channel, the tether in every shot, the biopsy clip, the fluid sprayer, and "still experimental" with the lab
  bench. No human clinical use is shown or implied.

## 4. Unresolved items (none are visual defects found in the final file)

1. **No real-time listening.** This environment cannot play audio; levels, sync and words were verified by
   measurement and ASR only. Listen on a phone before publishing.
2. **Paper not read directly.** Confirm against the paper that biopsy and spray delivery were demonstrated in the pig
   studies, not only on the bench, and check the exact sleeve cut pattern.
3. **Sleeve colour.** The real sleeves are polyimide (usually amber). The teal sleeves are kept as the house look,
   per the brief; this is a stylization, not a factual claim.
4. **The pig diagram is schematic.** The coil is not to anatomical scale; the travelled stretch is about a quarter of
   the drawn coil.
5. **The lab's controller box** sits partly cropped at the upper-left edge of S6 (unchanged from V2, a composition
   choice).
