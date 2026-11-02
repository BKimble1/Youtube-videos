# This Time Machine Actually Works: V3 review report

**File.** `exports/FGW_TimeMachine_V3_REVIEW_1080x1920.mp4`. Specs (encoded dimensions measured directly with ffprobe):
- Video: 1080×1920, H.264, CRF 16, yuv420p, BT.709, 30 fps, 706 frames, 23.55 s.
- Audio: AAC, 48 kHz, stereo, 317 kb/s.

**Status: V3 for review. It is not final and not publish-ready.**

Measured facts and evidence:
- `qa/v3/render_qa.json` and `qa/v3/final_asr.json`;
- `audio/mix/mix_measure_mix_v3.json`;
- contact sheets in `qa/v3/`.

> About the 512×910 files: both supplied review files measure 512×910 although their names say 1080x1920. That size
> comes from a preview transcode, not from the export. This export was measured at the encoder output with ffprobe
> (above), and it is delivered as a download attachment so that it arrives untouched.

## Source kept

- **Narration and voice.** The approved narration, word for word, with the existing voice recording
  (`audio/narration/FGW_TimeMachine_narration_V1.wav`, 23.53 s). Independent transcripts of the final mix:
  - Whisper base.en: WER 0.000.
  - zipformer: differs only in the spelling "travelled".
- **Captions.** The caption text and timing come from the word alignment. Captions are the only editorial text on
  screen.
- **Structure.** V1's structure is the foundation.
- **Reused V2 assets:** the house and garden, the family room, the capsule, the cockpit, the physical watch and the
  ray-traced Schwarzschild black hole.
- **Rebuilt:** the character actions and every transition. V3 lives in `source/src/v3/`.

## The journey (scenes aligned to the narration)

| Time (s) | Words | On screen |
|---|---|---|
| 0–2.2 | "If you flew close enough to a black hole," | The ship already flying beside the hole, holding one heading, with dust parallax; a controlled follow |
| 2.2–3.6 | "you could travel into the future." | One eased push to the ship's window, the camera banking to the ship's heading; through the glass into the cockpit, with no recoil |
| 3.6–4.95 | | He looks at the hole through the porthole (wonder), concern comes in, then he glances down to his wrist (a full blink) |
| 4.95–8.2 | "You'd watch your clock tick for just one hour." | One wrist raise about the elbow while the camera closes on the watch; one compressed hour, 10:00 → 11:00. The seconds hand is not drawn while it races, and it fades back in |
| 8.2 | "But back on Earth," | Match cut, dial to dial, to the wall clock at home (11:00, same position and size); the clock races clockwise; one eased move to the window |
| 9.4–11.5 | "years could be passing." | Match cut from the window seen inside to the same window seen outside; one pull-back to the garden. Seasons cycle twice, the tree grows, the friend ages in his place |
| 11.4–13.9 | "And when you finally returned," | The ship lands in the street, clear of the friend, who shields his face; the hatch opens. He steps up onto the threshold, down onto a fold-down step, then to the road, and walks to his friend, passing low so his helmet never covers his friend's face |
| 13.9–14.4 | "your friends would be old." | Their faces together, eyelines meeting, recognition shared; clear space between them, hands apart |
| 14.4–16.2 | "Your family might already be gone." | He turns (features first, a narrowing in-between, then the back view) and walks straight up the path through the rose arch to the front door; one continuous camera move |
| 16.2–17.4 | "…gone." | Cut inside: he steps in over the threshold and stops by one family photograph and a candle. On "gone" his face falls into grief: knitted brows, heavy lids, a trembling frown, tears welling |
| 17.4–19.6 | "Because you didn't just travel through space." | One eased push into the young faces in the photograph, a held look, then out to his still-young face. A tear runs down his cheek |
| 19.5–21.65 | "You traveled through time." | His old friend steps into the doorway, fully inside the opening; the two-shot holds. He raises the watch; the friend looks at it, softens, smiles and nods |
| 21.65–23.53 | | One eased push into the watch face; it matches the ship's upright window; one eased pull-back to the opening frame (the loop) |

## Character repair

- **Arms:**
  - No handshake or intertwined-arm pose anywhere.
  - Every arm is drawn shoulder → upper arm → elbow → forearm → cuff → glove, with fixed front/back layering.
  - The watch is always on the same (right) wrist, on the forearm, with the strap across the sleeve.
  - The close-ups are camera framing of that arm.
- **Feet** (`source/src/v3/gait.ts`):
  - Every walk plants its feet in world space along its route. A foot never slides, on straight or curved routes,
    and each swing lands before the body arrives.
  - The body lowers just enough for the short legs to reach a stride.
  - Walking sideways, one leg is always the near one.
  - In V3 the knees bend outward, so strides and crouches never read as crossed legs.
- **Hands:** clear of faces and of the chest unit. In the street and in the doorway the two men's hands never touch.
- **Faces:**
  - Stable faces with blended mouth changes, so no single-frame mouth pops.
  - Blinks close fully.
  - The brows sit on the skin below a raised fringe.
  - Concern and grief are drawn as a symmetric knit, with heavy lids and tears for the grief.

## Review process

Three rounds of independent multi-lens review were run on the rendered files. In each, every finding was re-checked
at full resolution by an adversarial verifier before it was acted on:
- **First contact-sheet pass:** all seven key sections.
- **Pass 2:** six lenses (opening and loop; wrist, hour and clock; return and faces; path and door; room and
  ending; anatomy and captions), 12 agents.
- **Pass 3:** five lenses covering the whole film, including the garden, 10 agents.

What changed after each review round:
- **Pass 2.** Fixed: the corner flash at the cockpit hand-off; the red flicker on the dial; walking across the
  friend's face; no real step out of the hatch; the gate overlap and layer flip; the camera hitches; and hands
  touching in both two-shots.
- **Pass 3.** Fixed:
  - Hatch: the hatch pop and the gap in the far leg.
  - Gate: the arch post through his body. The V3 gate and rose arch now stand straight in front of the front door,
    and the path runs straight.
  - Doorway: the friend clipped by the jamb.
  - Cameras: the room camera rush and the jolt at the start of the clock→window move.
  - Watch and loop: the seconds hand popping in, and the loop dial landing 40 px below the window.
  - Garden art: the blossom burst and the black open gate.
- **Your notes on pass 3:** the opening is quicker (the push starts at 2.2 s instead of 2.72 s), and the reaction on
  "gone" is sadder.

## Measured QA (this export)

- **Video:** 1080×1920, 30 fps, 706 frames, 23.552 s. Measured with ffprobe and `tools/qa_render.py`.
- **Cuts and glitches:**
  - No decode errors.
  - Only the two planned match cuts register as large changes: watch → wall clock at frame 246, and watch face → ship
    window at frame 681.
  - No unplanned changes and no one-frame glitches.
- **Motion:** the longest near-static run is 19 frames, the cockpit beat at 3.63 s.
- **Loop seam:** the mean absolute difference between the last and first frames is 3.22, below the film's typical
  frame-to-frame change.
- **Sound:**
  - −14.03 LUFS integrated, −1.32 dBTP (4× oversampled).
  - The loop-seam sample jump is 0.002.
  - Measured in `audio/mix/mix_measure_mix_v3.json`.
- **Narration:** both transcripts match the locked text. Whisper WER 0.000; zipformer WER 0.017, the "travelled"
  spelling only.

## Known limitations (remaining defects)

- **Brisk walks.** He walks at roughly 3.5–4 steps a second. The narration fixes how long each walk can last.
- **Low cockpit captions.** Two captions, "you could travel into the future" and "You'd watch your clock…", sit low
  (bottom edge about y 1820) so that they don't cover his resting watch. They may partly overlap a phone's Shorts
  interface. Every other caption ends at about y 1640.
- **The black hole leaving.** The ray-traced backdrop crossfades to vector stars over about 8 frames during the fast
  push and pull-back. The disk turns briefly translucent before it leaves frame.
- **Seasons montage polish.** These are 1–3 frame states on small elements:
  - the porch lantern swaps with a blink;
  - a few leftover leaf clumps shrink to dots;
  - the friend's costume and hairline changes show a halfway frame;
  - a few autumn leaves remain on the snow.
- **Window match line weight.** Outlines are slightly heavier outside the window than inside at the 9.4 s match.
- **Armchair.** In the photo close-up, the armchair's scroll arm shows as a faint ring.
- **Not yet re-reviewed.** This export's last batch of changes was checked by the render QA and contact sheets, but
  not yet by another full independent review round: the gate move, the hatch climb-down, the room camera holds, the
  loop offset, the opening timing and the grief.

## Rebuild

Render:
```bash
cd source && npx remotion render src/index.ts TimeMachineV3 ../exports/FGW_TimeMachine_V3_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v3","captions":true}' --crf=16 --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4
```

Sound: export the cues, then build the mix.
```bash
npx --prefix source esbuild tools/export_cues_v3.ts --bundle --platform=node --outfile=/tmp/cues3.js && node /tmp/cues3.js source/src/v3/cues.json
```
```bash
python3 tools/make_audio_v3.py
```

QA:
```bash
python3 tools/qa_render.py exports/FGW_TimeMachine_V3_REVIEW_1080x1920.mp4 qa/v3
```
```bash
python3 tools/asr_sherpa.py exports/FGW_TimeMachine_V3_REVIEW_1080x1920.mp4 <model_root> qa/v3/final_asr.json
```
