# MouthPad V3: report

**Review file:** `exports/FGW_MOUTHPAD_V3_REVIEW_1080x1920.mp4` (Git-ignored). Its checksummed backup is in `backup/`.
Restore with `cat backup/FGW_MOUTHPAD_V3_REVIEW_1080x1920.mp4.part_* > exports/FGW_MOUTHPAD_V3_REVIEW_1080x1920.mp4`.

- **SHA-256:** `443a10c2be56e235e8eb414c8abeb993f8f757ae9ced8fa3c95ea25daf2afac2`
- **Size:** 19,271,027 bytes

It is not published. Nobody has watched it in real time or listened to it; this environment has no playback. Every
check below is a measurement or a frame-step sheet of the delivered file that was actually inspected.

## 1. Runtime and verified resolution

ffprobe on the delivered file:

| Property | Value |
|---|---|
| Runtime | **31.90 s** (957 frames) |
| Video | H.264 High, **1080 × 1920**, SAR 1:1, DAR 9:16, **30 fps** (30/1), yuv420p, BT.709, 4.56 Mb/s |
| Audio | AAC LC, 48 kHz, stereo, 260 kb/s |
| Loudness | −14.0 LUFS integrated, −1.49 dBTP true peak |
| Black frames / frozen ≥ 1 s | none / none |
| Longest near-static stretch | 0.33 s |

### The "512 × 910" report

The pipeline renders natively at 1080 × 1920. Nothing in it scales:
- `Root.tsx` registers `MouthPadV3` at width 1080, height 1920;
- `tools/render.sh` writes full-size JPEG frames (957 at 1080 × 1920) and encodes them with no scale filter;
- there is no scale setting in `remotion.config`.

The V1, V2 and V3 files, and the V2 file rebuilt from its backup parts, all measure 1080 × 1920 with ffprobe.

The smaller size almost certainly comes from the review app's inline preview: the file card plays a reduced
transcode. V3 is therefore sent as a download attachment, not an inline preview. If a downloaded copy still reads
512 × 910, compare its SHA-256 with the one above; a mismatch means a re-encoded copy.

## 2. What changed from V2

| Time (s) | V2 | V3 |
|---|---|---|
| **All** | No captions | **Burned-in narration captions in the channel style:** Nunito Black, white with a dark stroke, key words in yellow capitals (see Captions below). |
| 0–5 | Big decorative contact rings over the gameplay | **No circular overlays** over the game: the tap is a small spark on the pad.<br>The player bobs and flicks.<br>The push into the mouth and the cut back out to the game are timed to the words. |
| 5.5–10 | Abrupt, busy fly-in; a giant solid pink tongue; blocky side teeth | **Two-phase fly-in:** the device backs off and tilts, then flies side-on into the cut-away head.<br>**Redrawn section:** a smaller tongue with a groove and tip highlight, whose tip curls up to touch the gold pad on "roof".<br>**Teeth and shell:** 2D upper teeth and incisor, with the clear shell drawn over them. |
| 10–12 | The game camera followed Zip | **Locked game camera:** Zip visibly runs left, then right, in sync with the tongue's sweep across the pad (glowing trail, W/A/D keys lighting). |
| 12–14 | Tilt | The face-cam head tilt drives the crosshair directly. |
| 14–15.6 | Press | The tongue tip makes contact on "CLICK" and the pad flashes; the cut to the game shot has no ring. |
| 16–20 | Cuts between the desktop and the phone | **One continuous camera glide** from the desktop to the phone.<br>Her hands stay on the armrests throughout. |
| 20–24.7 | Magnifying glass | **No magnifier.**<br>**Close-up:** the device clearly in the open mouth.<br>**Lip close:** natural. The upper lip and teeth stay fixed to the head, the jaw rises, and a closed smile hides the device completely.<br>**Match cut:** on the mouth line into the game, which keeps responding. |
| 24.7–31.9 | His arm crossed his mouth; the paint explosion engulfed the frame; the winner was unclear | **Rebuilt as beats A–E:**<br>**A.** Honest, confident.<br>**B.** Rapid escalation cuts.<br>**C.** Zip, the orange robot, clearly wins: Rex is knocked back and spins, X eyes and green goo; a trophy rises above Zip; confetti; Zip hops; the crosshair fades.<br>**D.** Honest freezes, the controller slowly slips from his hands, and his eyes go to the winner.<br>**E.** The winner, hands behind his head and mouth shut, a tiny smug smile on "SHUT".<br>**Loop:** a match cut back to the opening monitor composition. |
| Audio | | **New win sounds:** charge whine, K.O. thump, confetti pops, victory jingle, "wah" as Honest's eyes go to the winner, a controller thud, a smug chime.<br>The music filters down under the punchline. |

## 3. Narration

**Identical.** V3 uses the V2 narration master unchanged:
- `audio/narration/FGW_MouthPad_narration_V2.wav`;
- the same ElevenLabs narrator (Test Voice, `eleven_v4`);
- the 101 locked words.

The delivered audio, transcribed back:
- **whisper:** WER 0.04. The only differences are the spellings "mouth pad" and "touch pad".
- **zipformer:** WER 0.059. It has the same spelling differences plus "vitio" for "video", identical to its result on
  the dry narration.

The voice stays clear of the bed: at least 8.5 dB above it in 95% of speech windows (median 16.8 dB).

## Captions

- **Text:** the locked script verbatim in 26 short spoken phrases (`tools/make_captions_v3.py` asserts this). The SRT
  is `captions/FGW_MouthPad_V3.srt`.
- **Timing:** from the narration's measured word times.
  - A caption appears whole up to 40 ms before its first word, never before the previous phrase's last word ends.
  - Once its last word has ended, it leaves on the next cut, so it never trails into an unrelated shot.
  - No fades; it holds perfectly still.
- **Sync check** (`tools/qa_captions_v3.py`, `qa/v3/captions_sync.json`): every one of the 690 frames that lie wholly
  inside a spoken word shows the phrase containing that word, with **0 mismatches**. The shortest caption lasts
  0.73 s.
- **Placement:** in screen space, never inside a camera move. It was checked on sheets of the delivered file at each
  caption's start, middle and end.
  - **Lower third (y ≈ 1500)** by default: open ground in the game, chin or shirt in close-ups, desk or lap
    elsewhere.
  - **Split-screen demo:** a 110 px dark band between the mouth panel and the game panel. The panels were spread
    40 px apart each to make room.
  - **Punchline:** on the chest, clear of the faces, the eyes and the falling controller, so it doesn't move
    mid-phrase across the last cut.
- **One cut moved for the captions:** the cut to Honest squinting now lands exactly at the end of "SEE" (+50 ms), so
  "the controller." never appears while "SEE" is still being spoken.

## 4. Mouth and hand glitch

**Corrected.** The arm no longer crosses the mouth at 27–29 s. The winner's hands stay behind his head from the head
tilt (12 s) through the end and come back up only after the loop cut.
- His mouth stays closed from the lip close (22 s) to the end.
- Checked frame by frame in `qa/v3/win_25-29s.png` and `qa/v3/win_29-31s.png`.

## 5. Correct winner

**Yes.** Zip, the orange robot, wins (`qa/v3/win_25-29s.png`):
- the final shot hits Rex;
- Rex is knocked back and spins, with X eyes and green goo, away from Zip;
- the trophy rises above Zip, confetti falls, and Zip hops;
- nothing engulfs Zip.

Honest's eyes then move to the winner.

## Frame-by-frame inspection of the delivered file

Sheets of the delivered file are in `qa/v3/`:
- the required windows (`win_00-02s.png`, `win_05-10s.png`, `win_09-16s.png`, `win_16-20s.png`, `win_20-23s.png`,
  `win_25-29s.png`, `win_29-31s.png`);
- the loop seam (`win_loop.png`, frames 950–956 → 0–3);
- every planned cut (`cut_*.png`).

**Results:**
- **Big frame steps outside planned cuts:** all are multi-frame camera moves:
  - the hook pull-out and the push into the mouth;
  - the device fly-in;
  - the split-screen entry;
  - the face-cam shrink;
  - the desktop→phone glide;
  - the pull-back from the closed mouth.

  The two short ones (frames 116–117 and 260) were stepped one frame at a time: a slow room drift with a game flash,
  and a caption change during a steady push. Neither is a pop.
- **Loop seam:** the last frame and frame 0 differ by 6.1 (median frame step 3.0); it is the same composition.
- **Loop audio:** the music completes 64 beats over the film, so the audio loop is seamless (seam jump 0.006).

## 6. Remaining issues

1. **Not watched or heard in real time.** The comic timing of beats C–E and the music level need one human pass at
   normal speed with sound.
2. **YouTube's interface may overlap lower captions.** The lower-third captions sit at y ≈ 1420–1580. That is clear
   of the action, but on some phones the Shorts title and channel name can overlap the lowest line. Check on a phone
   after upload.
3. **The caption touches some art:**
   - in the mouth close-ups (1.2–1.7 s, 5.6–6.4 s), the two-line caption touches the lower lip;
   - at 29.0–29.3 s, it sits over Honest's lap just as the controller leaves it (the falling controller stays visible
     below).
4. **Head aim is a tilt (roll),** because the rig has no yaw. It matches "Tilt your head".
5. **The device is still drawn from text descriptions:** the pad's size and position, the traces and the batteries.
   Check against a real MouthPad photo.
6. **Claims to check before publishing** (as in V1/V2, `production/SOURCE_NOTES.md`):
   - the tongue→WASD, head→aim, press→click mapping;
   - "nobody can even SEE the controller" (inferred from the form factor);
   - the per-user direction mapping.
7. **True peak is −1.49 dBTP,** about 0.01 dB above a strict −1.5 target. Harmless on YouTube, which normalises
   loudness.

## 7. Readiness

A strong review cut, technically ready to upload:
- verified 1080 × 1920 at 30 fps, −14 LUFS;
- clean ASR;
- captions synced word for word;
- no pops, black frames or freezes.

It is not yet publish-ready until three things happen:
- a human watches and listens once at normal speed (mainly the ending's timing);
- the device design and the claims above are checked against official MouthPad material;
- caption clearance is checked on a phone in the Shorts player.

My estimate: about 8 / 10 (V2 was 7.5). The ending now reads correctly, the demos are clearer, and the captions
carry the script for viewers watching muted.
