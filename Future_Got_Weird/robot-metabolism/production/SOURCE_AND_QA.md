# Robot Metabolism V1: sources, decisions and QA

## Review status, plainly

- **Done and verified from the exported files:** dimensions, frame rate, frame count, duration, full decode, black and
  frozen frames, loudness and true peak of the file's own audio, audio/video sync against the mix, caption words
  against the locked narration, and frame-by-frame inspection of the hook (0.2 s intervals, every frame around the
  connection), the operator push and match cut, the failure/drop/replacement (0.1 s intervals) and the whole film at
  0.5 s intervals (`qa/`).
- **Not done:** nobody has watched the film in real time with sound, and nobody has listened to it. This container has
  no audio or video playback. Timing and levels were checked by alignment, waveform and stem measurement only.
  **Watch and listen at normal speed, on a phone speaker and on headphones, before treating V1 as final.**

## Exports (measured with ffprobe / ffmpeg from the files)

| File | Picture | Frames / duration | Audio | Loudness (file) |
| --- | --- | --- | --- | --- |
| `exports/FGW_Robot_Metabolism_V1_REVIEW_1080x1920.mp4` | H.264 High, 1080×1920, yuv420p bt709, 30 fps, captions | 771 / 25.700 s | AAC 48 kHz stereo 320 kb/s | −14.6 LUFS, −2.6 dBTP |
| `exports/FGW_Robot_Metabolism_V1_MASTER_2160x3840.mp4` | H.264 High, 2160×3840, rendered at `--scale=2` from the vector source (not an upscale) | 771 / 25.700 s | same mix | −14.6 LUFS, −2.6 dBTP |
| `exports/FGW_Robot_Metabolism_V1_CLEAN_1080x1920.mp4` | as the review, no captions | 771 / 25.700 s | same mix | −14.6 LUFS, −2.6 dBTP |

All three: no decode errors, no black frames, no frozen stretches, audio offset 0.0 ms against the PCM mix. Details:
`qa/*_qa.json` (written by `tools/qa.py`). No generated raster plates are used, so nothing in the master is at a lower
native resolution.

## Narration

- Locked text: `production/NARRATION_LOCKED.txt` (75 words). Captions and the SRT are derived from it and checked
  word for word (`tools/make_narration.py` asserts it; `tools/qa.py` re-checks the shipped files).
- Narrator: ElevenLabs **"Test Voice"** (`kk5XaSLo2XAw0sKM98zU`), verified live with `creative_list_voices` on
  28 Oct 2026; the same id as Glass Climbing V6 and Robot Faces. Model `eleven_v4` (the latest approved FGW
  configuration). Connector default settings; nothing changed on the stored voice. Delivery directed with two
  eleven_v4 audio tags (`[confident, conversational, brisk]`, `[slightly unsettling]`), which are not spoken.
- **One take** (generation `sFSGtyouI0ubSii0lWiV`, 489.95 credits). 180 wpm. No second take was needed.
- **Independent check:** ElevenLabs Scribe (`eleven_scribe_v1`, 141.35 credits) transcribed the *final edited* WAV:
  75/75 words, exact match, and no direction tag spoken. (PocketSphinx forced alignment gives the word times; its
  free recognition is only a rough cross-check.)
- Edits (all in digital silence): 30 ms of empty lead-in; 0.12 s from the middle of the pause after "beside it…" (now
  about 0.2 s of silence before "could"); a 0.8 s tail for the last image. No time-stretch, pitch change or word edit.
- Source format: the connector returns MP3 44.1 kHz 128 kb/s only. The 48 kHz/24-bit WAV is an editing conversion.
- The direct speech-with-timestamps endpoint was not usable: `api.elevenlabs.io` is blocked by this environment's
  network policy; only the connector works. Full record: `audio/narration/voice_provenance.json`.

## Science and what the picture claims

Sources: Wyder et al., "Robot metabolism: Toward machines that can grow by consuming other machines," *Science
Advances* 11, eadu6897 (July 2025), https://doi.org/10.1126/sciadv.adu6897; project page
https://robotmetabolism.github.io/; Columbia Engineering news release.

**Research access was limited.** This environment's network policy blocked the paper (PMC, arXiv), the project page and
the Columbia release, so the figures and demonstration videos could **not** be inspected. The facts below come from the
brief and from web-search summaries of those sources; the geometry is a simplification built to them:

- A Truss Link: a bar that expands and contracts (about 28 cm contracted, about 43 cm extended), with a free-form
  magnetic connector at each end (a 12.7 mm N52 sphere magnet in a printed shell, with a spring; retracting the magnet
  releases it). Drawn as a rigid housing with a sliding inner rod, round connector shells and a status light. The rig
  probe holds every working link between 0.28 and 0.43 m.
- Operator control (a custom keyboard interface, scripted and direct control): shown by the Weird Crew's guesser at a
  keyboard, with the robot responding on his monitor. Nothing in the film chooses parts on its own.
- The extra link used like a walking stick on a 10-degree downhill (the ratchet tetrahedron, reported about 66 % faster
  downhill): shown as the module propping the robot's lifted rear vertex and pushing with its tip planted, racing a
  plain tetrahedron of the same links down a 10-degree ramp. No number is shown. **The exact attachment geometry of
  the paper's ratchet tetrahedron could not be checked** (figures blocked); this prop-and-push arrangement is an
  illustration of "walking stick", not a reproduction.
- Shedding a link that stops working (links detach in a low-power or broken state) and connecting a found
  replacement: shown with the walking-stick module failing (its light goes out, it stops extending), its connector
  letting go, and a separate, working module connecting the same way the first one did. *Staging decision:* in a
  tetrahedron, dropping one of its own six links leaves a hinge that a lone rod cannot be re-inserted into without
  lifting, so the replacement is shown on the one-end attachment (the stick), which is mechanically honest. The film
  combines separate demonstrations; the cuts to the ramp and to the module station mark them as separate tests.
- The ending is conditional: a broken robot (cracked housing, snapped connector, dark lights) with one intact module,
  its standby light on, lit by a pool of task light. No harvesting action; no broken part comes back to life.
- Excluded: eating, mouths, combat, dismemberment, organic tissue, autonomous selection, invented grippers.

## Visual system

- Original FGW art: flat fills with the channel's ink contour, warm upper-left key light, the lab palette (cream wall,
  teal panel, wood bench). The only character is the Weird Crew's existing guesser on his existing rig
  (`source/src/dc/`, copied unchanged from Robot Faces).
- Identity bands: the robot's own links pale blue; the acquired module amber (kept through the hook, the mechanism, the
  walking stick, the ramp and its failure); the replacement teal; the broken robot grey; the comparison robot faded.
- Shots and transitions: `production/SHOTS_AND_TRANSITIONS.md` (14 setups, four cuts, one match cut).
- Captions: the channel treatment (Nunito Black, dark stroke, yellow capitals on emphasis words: OTHER ROBOTS, SPARE BODY
  PARTS, MAGNETS, WALKING STICK, REPLACEMENT, BODY PART), 17 phrases, at most two lines, shown from 0.04 s before each
  phrase's first word. Checked against an *approximate* Shorts overlay (right action column and bottom title band
  drawn as rectangles; the official template was not available here): captions stay clear of both. Some far ends of
  modules pass under the right column; the contacts never do.
- No subscribe, like or comment cue, end card, outro, logo or title card anywhere.

## Runway

Not integrated: the Runway output hosts are blocked by this environment's proxy (tested on existing media, zero
credits). See `production/RUNWAY.md` for the planned slots, briefs and how to integrate.

## Sound

`tools/make_audio.py`: the narration sample for sample (voice stem correlation 1.0 with the source); a synthesised low
pad and soft pulse under it, ducked under speech; effects placed from the picture's own state (`audio/cues.json`):
motor whir that follows the measured link length changes, one magnetic contact click at each connection, an un-click at
the release, the dying module's motor winding down, tip taps and scuffs, key clicks, quiet room tone. Nothing sampled,
no third-party music. Integrated −14.6 LUFS, true peak −2.6 dBTP (4× oversampled), voice 23.5 dB above everything else
in the 400 Hz–5 kHz band while speaking (`audio/mix/mix_measure.json`). The final 0.8 s is the last image under the
bed's decay; no music-only outro and no sting.

## Checks and fixes made during review

| Found | Fix |
| --- | --- |
| The motor block of every link covered its own connector shell, so ends read as dark stubs | housing starts beyond the shell; slimmer motor block |
| Link parts flickered in depth order (band hidden under the housing) | each link's body painted as one ordered item; the rod above or below the housing by which end is nearer |
| Contact sheets showed wrong gradients (ids shared between views) | per-view id prefixes |
| The hook was too small and the module's first move too subtle | tighter, higher camera; the module telescopes 6 cm on its own before the approach; after connecting, the body steps and drags it along |
| The camera reached the joint before "stretch and shrink", so the stretch was off screen | a side view holds the whole body through the stretch and the shrink, then moves to the joint |
| Camera easing warped key times (actions could miss their words) | easing now only in the first and last path segments; every key is reached at its time |
| Ramp: robots small and overlapping, then (front view) the stick hidden behind the body | an elevated side view: the slope reads as a diagonal, the stick and its tip are visible, the comparison robot falls behind |
| Ending: the intact module did not stand out | camera over the tray, the module pointing toward the robot, a warm task-light pool on it |
| The monitor push accelerated into the cut (frame-difference spike 278–284) | the push eases to rest at the cut; the next shot starts at rest on the same camera |
| The failure was hard to see | camera moves in on the module's status light as it goes out; larger status lights |
| The replacement contact was small in frame | the camera closes in on the joint for the connection |

The rig probe (`tools/rig_probe.ts`) passes on all 771 frames: every working link 0.28–0.43 m, no end below a surface,
the joined module exactly at its vertex, separate modules never intersecting (the probe excludes only the frames where
the released connector is still within a centimetre of its vertex).

## Remaining limitations

- Not watched or heard in real time (see the top).
- The paper's figures and videos could not be inspected; the walking-stick geometry and the replacement staging are
  explained simplifications (above).
- Runway not integrated (blocked host).
- The robots' speeds are illustrative (the real robots are much slower); the race shows the comparison, not the figure.
- Frame-difference "spikes" remain at 269–277 (the eased monitor push: the whole frame scales smoothly; no pop).
- The type checker reports pre-existing errors inside the copied character rig (`source/src/dc/Man.tsx`, unchanged
  from Robot Faces); everything written for this episode type-checks.
- Duration 25.7 s is a little under the 26–29 s guide: it is the measured length of the natural take plus a short
  tail; nothing was stretched or padded.
