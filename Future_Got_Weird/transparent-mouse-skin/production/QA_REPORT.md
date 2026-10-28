# Transparent Mouse Skin V1: QA report (28 Oct 2026)

**This is a review version, not certified for publication.** The checks below were run on the exported files.
**No one has watched or listened to the film in real time.** This session has no audio or video playback, so the
pace, the delivery and the sound mix have **not** been auditioned. Motion was judged from contact sheets, frame strips
and a frame-difference scan, which cannot certify how it feels at speed.

## Deliverables (verified by ffprobe and a full decode)

| File | Size | Measured |
|---|---|---|
| `exports/FGW_Transparent_Mouse_Skin_V1_REVIEW_1080x1920.mp4` | 19.9 MB | H.264 High, 1080×1920, 30 fps, 752 frames, 25.067 s, yuv420p bt709. AAC 48 kHz stereo 320 kb/s. 0 decode errors. |
| `exports/FGW_Transparent_Mouse_Skin_V1_MASTER_2160x3840.mp4` | 60.7 MB | H.264, **2160×3840 native** (vectors rendered at 2×, not an upscale; see `qa/master/native_vs_upscaled_f408.png`), 30 fps, 752 frames, 25.067 s. 0 decode errors. |
| `exports/FGW_Transparent_Mouse_Skin_V1_CLEAN_NO_CAPTIONS_1080x1920.mp4` | (see the README) | the same film without captions (`captions: false`) |
| `cover/…f120_4.00s…png` | | frame 120 of the film at 2160×3840 and 1080×1920, plain and with "SEE-THROUGH SKIN" (cover only) |

There are no generated plates, so there is no plate resolution to document. See `RUNWAY_NOTES.md`.

## Narration and captions

- **Narrator:** ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`, the channel narrator, verified on 28 Oct), model
  eleven_v4. Take 2 of one two-take run, used verbatim. The only edits are silent gap middles: no gap exceeds
  0.42 s, and the hesitation after "away…" is 0.28 s. Provenance is in `audio/narration/voice_provenance.json`.
- **Timing:** speech runs 0.00–23.76 s. The first seven words resolve at 2.44 s (target 2.3–2.7 s). Pace is about 182 wpm.
- **Independent recognition** (Whisper small, given no script text), run on the raw takes, the final narration and
  the review MP4's own audio: every word of the 72-word script is heard except **"washed" heard as "wash"**.
  This is the /t/ of "washed" running into "the", and it happens in both takes. **Listen to this line.**
- The connector's Scribe "transcripts" just reproduced the prompt (delivery tags included), so they were **not** used
  as verification.
- `tools/check_script.py` passes. The script has 72 words. The captions, read in order, are the script verbatim, and
  so is the SRT. The measured words equal the script's words. Each caption has 1–6 words, and captions never overlap.
  There is no subscribe, like or comment prompt in the source.

## Sound (measured, not auditioned)

- ffmpeg on the review MP4 measures −14.0 LUFS integrated, LRA 6.7 LU, true peak −1.4 dBTP. The mix WAV measures
  −1.5 dBTP.
- The voice is the narration, sample for sample, gain only. The bed sits 18 LU under the voice and is ducked under
  speech, with a deeper dip under "Without making a single cut".
- The soft limiter touched 0.24% of samples, with at most 1.9 dB of reduction.
- Effects play on visible contact only (`audio/sfx_cues.json`): the swab, the call-out opening and closing, the dye,
  the rinse squirt, trickle and drips, and a faint clock under the time-lapse. There are no animal sounds, no
  breathing, no heartbeat and no sting.
- MP4 audio against the mix: 0.0 ms lag. Audio is present from 0.00 s (no lead-in).

## Picture checks

- **Hook** (`qa/review/review_hook_0-3s.png`, every 0.2 s): at frame 0 the whole sedated mouse is readable, with the
  clear red-orange patch, the loops beneath it and the opaque neighbouring skin. Peristalsis is moving from the first
  frames. The single push begins at 0.40 s and is under way by 1–3 s. The outline is kept throughout.
- **Phone size with the UI overlay** (`qa/review/review_phone_ui.png`): captions sit at y≈1432 in S1 and S4, above
  the title band, and inside the right rail. In S2 they sit at the top (330), and in S3 above the call-out (205).
  Captions stay off the patch, the light paths and the hands.
  - The first draft put captions inside the title band. This was fixed.
  - At the end of S1, a caption grazed the patch rim. Reframing fixed it.
- **Native frames** (`qa/review/native/`, 20 frames):
  - The surface stays continuous over the patch at every transmission: pores, sheen, a fur edge, no line.
  - The swab touches the skin at true scale.
  - The section shows scattering, then the dye in the water only, then straight red paths. The fat keeps its colour,
    and the blue ray is absorbed.
  - The organs blur and then vanish under returning opacity between 22.6 and 23.3 s.
  - The last frame shows intact skin.
- **Transitions** (`production/SHOTS_AND_TRANSITIONS.md`; `qa/review/transition_strips.png`): one matched cut at
  7.00 s, the call-out open and close, and the loop restart.
- **Frame-difference scan** (`qa/review/motion_scan.json`): the median frame change is 1.12. The only single-frame
  spike is the planned cut (f210, 7.00 s). The other raised runs are continuous actions:
  - the push (f28–34);
  - the swab strokes (f228–276);
  - the call-out opening (f298–317) and closing (f598–617, peak 24.8: the disc collapsing during the 1.15 s camera return);
  - the end pull-out (f721–736).

  The loop seam differs by 22.3 because the restart is compositional: opaque at z 1.26, back to clear at z 1.20.
- `blackdetect`: none. `freezedetect` (≥0.8 s): none.

## Fixes made during review

1. The patch first read as a fuzzy hole with a glass glare, and then as hazy stripes. It became intact shaved skin
   that thickens toward the fur edge, over packed intestinal coils.
2. The operator was mouse-sized. They were rescaled to a true gloved-hand scale, so only fingertips and the tool
   enter the frame.
3. Rinse water drawn as white streaks could read as scratches. It was replaced with beads and a moving sheen.
4. A faint skin crease line on the patch could read as an incision. It was removed.
5. Bottom captions sat in the Shorts title band. They were moved up.
6. The call-out return was a 0.5 s camera swing. It became a 1.15 s eased move, and the rinse starts only after the
   camera lands.
7. A caption ran 2 frames past the 7.00 s cut. It is now cut with the picture.
8. The section's "before" state scattered too little. The lipid regions were packed (44), and the scattered branches
   are now visible.

## Not done or not met (honest status)

- **Real-time playback with sound has not happened.** The film still needs a normal-speed watch and a full listen:
  narration tone and clarity, the "washed the" elision, the bed level, pace at the call-out, and caption sync.
- **The primary sources could not be read** from this environment. The science follows the published paper as known
  before this session (`SOURCE_NOTES.md`) and must be checked before publishing.
- **Runway plates are not used.** Runway's media hosts are blocked here, and no credits were spent. The replacement
  slots are documented in `RUNWAY_NOTES.md`.
- Dead Spider V6 and Cyborg Cockroach V5 are not in this repository and were not viewed.
- The ray indices are exaggerated for legibility, and the section is a schematic (stated in `SOURCE_NOTES.md`).
