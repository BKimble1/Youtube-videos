# V2 report: Doctors Grew an Ear Inside Her Arm

V2 revises V1; it is not a rebuild. The character, the drawing system, the ear geometry, the voice and the story are
unchanged.

**Status.** A review version, checked from the files. **It is not published.** It has not been watched or heard in
real time: this environment has no display or speakers.

## Deliverable

`exports/FGW_Ear_Forearm_V2_REVIEW_1080x1920.mp4`

- 1080×1920, 30/1 fps, 609 frames, **20.30 s**.
- H.264 CRF 16 (slow), yuv420p, bt709; AAC 320 kb/s, 48 kHz stereo; 13.3 MB.
- A full decode reports no errors.

| Item | File |
|---|---|
| Narration master (V2 spacing) | `audio/narration/FGW_Ear_Forearm_narration_V2.wav`; word times in `audio/narration/FGW_Ear_Forearm_V2_words.json` |
| Mix | `audio/mix/FGW_Ear_Forearm_V2_mix.wav`, `audio/mix/mix_measure_v2.json`, `audio/sfx_log_v2.json` |
| Captions | burned in; also `captions/FGW_Ear_Forearm_V2.srt` |
| QA evidence | `qa/v2/` (ffprobe, ASR of the MP4, loudness, frame steps, sheets cut from the MP4) |
| Source | `source/src/` (composition `EarForearmV2`); V1's source is at commit `4f47c44` |

## Narration (locked words, same take)

- Same ElevenLabs take as V1: Test Voice, `eleven_v4`. No new generation.
- **Speech untouched:** no time-stretch, no splices inside words.
- **Only silence changed:**
  - sentence gaps tightened to 0.28 s (they were 0.38–0.49 s);
  - the "MONTHS…" beat tightened to 0.30 s;
  - V1's extra 0.30 s after "nerves." removed;
  - 0.65 s removed in all.
- Comma pauses are as spoken.
- Speech runs 0.00–19.76 s, followed by a 0.55 s tail into the loop.
- **ASR on the delivered MP4's audio:**
  - Whisper base.en: 0 differences.
  - Zipformer: one spelling-only difference ("armskin" for "arm skin"); its V1 run had the same.

## What changed, by section (V2 times)

**0–3 s, hook.**
- Frame 0 is now the forearm *and* the open hand, with the ear raised under the skin. It reads as a forearm and as an
  ear at once.
- The relief is drawn stronger at that distance, and the arm hair is finer and sparser.
- 0–0.5 s: one push onto the ear (the ear swells slightly as it lands).
- 0.5–2.3 s: one continuous move back reveals the woman with the arm raised. She turns her forearm slightly.
- There is no hold.

**3.2–4.8 s, the missing ear.**
- The camera goes to the same woman's ear site, at a closer, direct framing (zoom 3.4).
- The healed site is redrawn to read at a glance: a flat, paler footprint with a firm scar line where the ear was
  attached, the ear canal kept, and a small tragus stub.
- The crash indication is unchanged in kind but brief (about 0.5 s): night tint, headlights, cracking glass behind her.

**4.9–8.0 s, rib cartilage.**
- The local rib view opens, and the cartilage parts of the ribs light up (the bone does not), identifying "rib
  cartilage".
- A scalpel traces the fused 6th–7th cartilage block. Forceps lift it out and carry it, followed by the camera, to an
  instrument tray on a sterile drape beside her.
- There the scalpel cuts it to the ear outline (the offcuts slide aside and stay on the drape), carves the hollows, and
  cuts the rim free.
- **Nothing is shaped inside the chest.** The rib view closes after the block is removed.

**8.1–9.5 s, under the skin.**
- Forceps carry the framework from the tray to the forearm and slide it in through the skin pocket.
- The part already under the skin is hidden, and its relief rises beneath the skin. Then the forceps release, the skin
  settles, and it is stitched.

**9.6–11.8 s, vessels.**
- The transparent local cutaway now grows in three distinct stages, each ending on a pulse:
  1. three trunks sprout from the forearm artery (≈10.0 s);
  2. branches reach the framework and wrap its margin (≈10.5 s);
  3. fine sprigs spread and the tissue around the framework flushes (≈11.0 s).
- The framework is drawn above the vessels, so no vessel appears inside the cartilage.

**11.8–16.6 s, transfer and attachment.**
- Unchanged in kind: the scalpel outlines the flap; forceps (now sliding in from above-right) lift the living ear;
  it is carried in one arc to the ear site and seated.
- The forearm then shows only the donor bed, so there is never an ear in both places.
- The microsurgery cutaway is re-placed **in front of the ear**, where the scalp's own vessels run. The flap's artery,
  vein and nerve leave from under the ear; the recipient ones come up from below. Each pair meets end to end on one
  straight seam, side by side. All ends run on out under the cutaway's soft edge, so there are no tangled or
  free-floating tubes.
- The needle holder slides in and out along its axis.

**16.6–20.3 s, reveal and loop.**
- She is shown with the ear in place, with a brief warm lift in the light.
- The camera moves to the forearm. The head is out of frame (from 18.8 s) before the ear relief rises under the skin
  again, so no two ears are ever on screen together.
- The film ends moving into the opening forearm-and-hand composition at the opening push's speed: the loop is mid-move.

**All sections.**
- Every instrument enters and leaves along its own axis; none fades in or out in place:
  - the chest and flap scalpels;
  - the forceps;
  - the tray scalpel;
  - the needle holder.
- **Captions:** the low ones moved up to y 1340, to keep the lower Shorts area clear. The vessel caption sits high,
  above the cutaway. Emphasis is unchanged: EAR, FOREARM, RIB CARTILAGE, MONTHS, HERE.
- **Sound:** re-cued to the V2 picture (forceps grip and tray tap added; offcuts slide instead of dropping). The bed is
  the same continuous one, with no gating.

## Measured QA (delivered MP4)

- **Frame steps** (`qa/v2/frame_steps.txt`):
  - mean 4.65; largest 24.7 (the forceps carry from the chest to the tray, 6.2–6.3 s), down from V1's 26.2;
  - no isolated jumps (the largest step-to-local-median ratio is 1.2);
  - loop seam 3.85, below the mean step.
- **Audio:** −13.85 LUFS integrated; −1.62 dBTP true peak; −1.95 dBFS sample peak. During speech, the effects sit about
  27 dB under the voice.
- **Sheets:**
  - `hook_first3s_phone390.jpg` (the first 3 s at phone width);
  - `film_every_second.jpg`;
  - `loop_last_vs_first.jpg`;
  - `armoff_and_return.jpg` (the arm-state switch at 3.55 s happens off screen; the return has no duplicate ear).

## Remaining material issues (honest list)

1. **The forearm-and-hand frame 0 shows a smaller ear.** About 200 px tall at full resolution; about 70 px at a 390 px
   phone width before the push lands at 0.5 s. It reads on the sheets, but the "ear" read leans on the push.
2. **The carving is still brisk.** The three tray stages share about 1 s ("from her own rib cartilage" is 1.4 s of
   speech), so it is legible rather than lingering.
3. **The tray is plain**: a drape on a single stand, with no hands. The forceps' and scalpel's handles leave the frame
   toward off-screen surgeons, which is the intended convention.
4. **Gender cues are carried by the face, hair and body seen from 1.3 s on.** The forearm and hand alone (frame 0) are
   slender but not strongly gendered.
5. **The microsurgery cutaway is a soft oval.** It has no hard ring or callout styling, but it is still a local window.
6. **V1's open items still apply**: no hearing claim; anonymous patient; real-time viewing not possible here.
