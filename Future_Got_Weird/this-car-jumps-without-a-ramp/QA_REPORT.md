# QA report: This Car Jumps Without a Ramp, finishing pass (19 Oct 2026)

## What was delivered

- `exports/FGW_U9_FINAL_4K.mp4` (Git-ignored; SHA-256 in `exports/FGW_U9_FINAL_4K.sha256`: `8cf0c1e2…6591a`).
  Rendered natively from the project at **3840×2160, 30 fps** (Remotion `--scale=2`), H.264 High, yuv420p, BT.709, CRF 14, PNG frames,
  AAC-LC 320 kb/s 48 kHz stereo. Not upscaled from the review file.
- `thumbnail/FGW_U9_thumb_FINAL_1280x720.jpg` (now a genuine BYD frame), title and description in `upload/UPLOAD_TEXT.md`, plus updated docs.

## Changes in the finishing pass

1. **Real footage in the middle.** A 4.7 s real sequence (V2 recording frames 900–1040: the U9 crossing a strip of road spikes with all four wheels clear of the pavement, landing beyond it) now plays at 0:35.3–0:40.0, from "the ground stops pushing" to "brings it back down". The illustration shows the push and takeoff, hard-cuts to the real shot, and returns with the car back on the road and the road-force arrows resuming exactly when contact does. The real cornering shot at 0:42 now plays whole (1.4 s instead of 0.9 s). No supplied footage shows braking or an uneven road, so none was forced into those sections.
2. **Opening/replay match cuts** (1.83 s and 1:48): the dissolve with a double image is replaced by a crisp cut on the real clip's last frame; the illustrated car sits on the same wheel centres.
3. **0:55.7 transition:** the three-quarter view no longer pushes in from the lens (it was huge at the grass edge); it is now a deliberate cut to a composed shot with the car in its lane, constant distance.
4. **Source quality:** only two originals exist (release digests match); crops, scaling and sharpness measured (see `footage/README.md`). Real clips are now decoded losslessly and the master uses PNG frames.
5. **Thumbnail, title, description:** real frame, "NO RAMP", title "This Car Jumps Without a Ramp. Here's How."
6. Cabin: checked through its full motion (belt, hands, wheel, seat, arrow); one label moved off the arrow's tail.
- Review copies `exports/FGW_U9_REVIEW_1080p_r2_not-for-upload.mp4` (this pass's 1080p) and the earlier r1. Not for upload.

## What could not be done here

- **Normal-speed audio-visual playback.** This environment has no way to watch or listen to the file in real time, so
  nobody has watched the cut or heard the mix here. The checks below are measurements, transcript/timing data and
  frame-by-frame inspection of frames extracted from the exported file. **Watch it once at full speed with sound before upload.**
- Not checked by ear: sound-effect levels and taste, click/truncation audibility (measured only: see Mix), music ending.

## Narration

Unchanged. The approved Test Voice recording (134.16 s) and its word timings were not touched: no ElevenLabs calls, no
re-records, no re-stitching, no time-stretch, and no wording changes. `audio/narration/` has no changes in this pass.

## Measured on the exported 4K file (`tools/qa.py`, `qa/final/qa_results.json`)

- 3840×2160, 4025 frames read, 134.167 s video, 134.160 s audio (A/V length difference 0.007 s).
- Black frames: none. Static holds of 1.5 s or more: none. Single-frame pops: none.
- A scan of all 4025 frames for flat paper-coloured (blank) frames: **none** in the final file. Narration files are unchanged in Git.
- Loudness −15.0 LUFS integrated, LRA 2.1 LU, true peak −1.5 dBTP (reference measurements, not proof the mix sounds right).

## Mix (measured)

- Music, effects and ducking were rebuilt from the exported event times (`audio/sfx_events.json`); the existing music and
  effects were kept, with placement moved only where visuals changed: the whip into the cabin (0.3 s before the cut), the
  real landing (0.13 s earlier than the model's), and a soft pass-by when the drone crosses over the car.
- Masking screen (`audio/mix/speech_mask.txt`): median voice-to-bed margin while speaking 22.8 dB; of 2,024 speech windows
  of 50 ms the bed is within 6 dB of the voice in 67 and above it in 9 (bump thuds and landings between words).
- Music fades out over the last 1.4 s, ringing out under the end card; the final 40 ms of the bed are faded to avoid a click.

## Frame-by-frame inspection (frames pulled from the exported 4K file)

Contact sheets for every transition and cutaway are in `qa/final_strips/` (`tools/transition_sheets.py`), one tile per frame
with its frame number. Checked and found clean: real opening to illustration (1.4–2.3 s); the question shots in and out; the
hand press (14.9–15.7 s: hand enters, touches, the body compresses, the spring fades in); the tyre-wall wipe into the bend; the
real cornering shot out; the speed whip into the cabin scene; the round cutaway in and out of the cabin; the car through the
lens into the replay; replay to illustration; illustration to the real side jump (about five frames of overlap, wheels
aligned); the real landing; the cut to the front three-quarter; hover to illustration; illustration to the real drive-away;
the cut between the two drive shots; the end card.

Fixed in earlier passes:
- A one-frame blank (cream) gap at the cut from the real landing to the front three-quarter shot (found on the first 4K render
  and fixed by making the second clip start on the frame after the first ends; the file above is the re-render).
- The side jump's hover shot started a frame late; the BYD credit chip faded too late at the opening dissolve.

Observations on the final file:
- **Cabin (1:36–1:45).** Clean interior: the driver's face and torso are unobstructed; the seat bolster visibly gives under
  the body; the belt is anchored to the pillar above the shoulder and ends in a buckle on the seat; there is a single arrow,
  tail on the bolster and tip at the body; two bars show lean falling while the sideways force stays the same. Entry and exit
  are a continuous round cutaway in the windscreen, with no dark frame.
- **Physics rules.** Road-force arrows end at takeoff; the gravity arrow stays through flight to landing (drawn on the real
  footage, anchored to the model's centre of mass); the MOTION arrow follows the vertical velocity and is hidden at the apex;
  actuator forces appear only as internal pairs in the cutaways; no numbers are shown (the graphs are labelled "ILLUSTRATIVE").
- **Text.** Headline bubbles that repeated the narration were removed; kept: SPRING, DAMPER, POWERED ACTUATOR, GRAVITY, MOTION,
  MORE/LESS LOAD, TRAVEL LIMIT, the cabin labels, the real-versus-simplified captions ("BYD DEMONSTRATION VIDEO",
  "SIMPLIFIED CUTAWAY", "SLOW MOTION · SIMPLIFIED MODEL"), and the small wordmark at the end.
- **Real shots.** All played frame for frame at the source cadence, none repeated; BYD's on-screen numbers and logos are
  outside the crops (the band in the side jump is removed with `delogo`).

## Known remaining issues

1. **Real footage is 1080p and partly soft at source.** A rendered frame keeps about 88% of its source frame's fine detail (measured); the close wheel, cornering and drive shots are soft in the recordings (motion blur, depth of field, double compression). No better original exists.
1b. **Superseded note:** the real footage is 1080p, The real shots come from screen recordings (1080p, double-compressed) and are enlarged to 4K,
   so they look softer than the native-4K vector art. Documented in `footage/README.md`.
2. **The three-quarter and rear illustrated car (0:57–1:00, 2:08) is the weakest drawing.** It is now the same colour,
   with a blunt wide nose, grille and plate, and consistent wheel positions, but it is still a faceted model next to the
   hand-drawn side and front views. The rear view is only on screen briefly, and the real drive-away covers the ending.
3. **Hand demo.** The hand is a simple mitt on a sleeve entering from above; its contact and release are clean, but it is the
   plainest drawing in the film.
4. **Jump height.** The illustrated apex clearance (about 0.11 m, also used in the thumbnail) is the model's, not a
   measurement of BYD's car; the supplied footage cannot give it.
5. **Spike-strip footage.** The strip is part of BYD's demonstration (the car clears it on its own suspension); the narration does not mention it, and it is used only for the flight. It may read as a separate stunt to some viewers.
5b. **Rights and sources.** The owner must confirm rights for the BYD excerpts, and open the three cited source pages once
   (they could not be opened from this environment); see `production/CREDITS.md` and `research/claim_ledger.md`.
6. **Pronunciation and delivery** ("BYD's", "Yangwang") were not re-checked by ear in this pass.
