# Tooth in Eye V4: anatomy correction pass on V3

**Status.** This is the V4 final-review render, built from source and checked from the files.
- It has **not been watched or heard in real time**: this environment has no display or speakers.
- "TEN YEARS blind" still needs a confirmed source.

**Deliverable.** `exports/FGW_Tooth_Eye_V4_FINAL_REVIEW.mp4`
- 1080×1920, 30 fps, 798 frames, 26.6 s;
- H.264 High yuv420p bt709, CRF 16, AAC 320 kb/s.

**Source.** `source/src/Scene4.tsx` (composition `ToothEyeV4`), `Captions4.tsx`, and the shared `face2.tsx` and `profile2.tsx`.
- V3's exact source is at commit `50ef7a50`.
- The shared drawing files changed in V4, so `Scene2` and `Scene3` no longer reproduce V2 or V3 from this tree. Use the earlier commits for that.

## Locked, and kept unchanged

- **Narration:** the same approved ElevenLabs take, word for word, with the same word times.
  - `audio/narration/FGW_Tooth_Eye_narration_V4.wav` is sample-identical to V2/V3 for its whole length.
  - The only difference is a shorter silent tail: 0.5 s instead of 0.9 s.
- **Character:** the same man throughout (hair, beard, face proportions).
- **8–14 s:** the extraction, drilling and cylinder assembly. Their code is copied from V3 unchanged.
- **Style:** the same 2D/2.5D look.
- **Duration:** 26.6 s (V3 was 27.0 s). The 0.4 s removed is the silent hold after the last word.

## The four requested fixes

| Fix | Corrected? | What V4 shows |
|---|---|---|
| **1. Opening, 0–3 s** | **Yes** | **0.0 s:** his right eye, front-on and close, with brow, lashes, lids and cheek, so you recognise a human eye at once. The eye is covered by the pink cheek-lining graft. The tooth plate is only a faint raised shape under it, and the one thing showing is the **small dark-centred clear cylinder at its centre**, like a pupil. This is what a real OOKP eye looks like. There is no exposed block. **0.62–1.2 s (on "TOOTH"):** a local cut-away opens the graft over the plate. It shows the root dentin with its canal and the jaw-bone strip, holding the cylinder, with the cut edge of the graft visible round it; the plate's ends stay under the graft. **1.5 s:** a quick 4-frame dissolve to the side cross-section. The light enters the cylinder from about 1.9 s and lights the retina at about 2.3 s, on "EYE". **2.6–3.3 s:** the cut-away closes on his profile, where the eye is again pink with only the cylinder's end showing, and he smiles on "SEE AGAIN". |
| **2. Pocket, 14–18 s** | **Yes** | The circular opening is gone. **13.9 s:** a short incision under the lashes of his other eye. **14.24–14.75 s:** the assembly slides **beneath the skin**. The part above the incision is solid; the part below is seen through the skin: faint, tinted by skin and crossed by muscle fibres, and only within the plate's own outline. **15.0–15.3 s:** the skin closes and is sutured, leaving only a soft rise of the plate under the skin; the bruise and the line fade over the months. **16.85–18.2 s:** the skin is seen through again and **tiny vessels grow in** from the surrounding tissue round and over the plate. **18.4–18.85 s:** the incision reopens and it is lifted out. |
| **3. Reconstruction, 19–22 s** | **Yes** | In the cross-section the plate now **lies flat on the front of the eye**. It is cut through to show the jaw-bone strip, the root dentin and the gold cementum line, inside its thin fibrous capsule. The graft is laid back **over** it, and only the end of the **small clear cylinder** (about 1.2 mm) stands out of the graft. The cylinder passes through the opening in the scarred cornea (the iris and lens are removed), and the camera follows the light through it to the retina. There is no exposed rectangular block; it reads as a modified human eye. |
| **4. Ending, 23–26.6 s** | **Yes** | **23.0–24.4 s:** the blurred-to-clear view stays, with a sharper focus snap, a brief warm bloom as it lands, and his hands rising. **24.45–25.1 s:** **he looks round**: the view turns slightly toward the window and the flowers. **25.15 s:** cut to him front-on, the same man: his brows rise, his smile opens, his head tips a little, and a tear runs from his other eye. **25.15–26.6 s:** a subtle, continuous push into his reconstructed eye that lands exactly on frame zero. The silent hold is gone: the film ends 0.5 s after the last word. |

## Global rules

- **Camera and cuts:** every camera move is one eased curve.
  - The loop push uses one smooth curve with no overshoot, from his reaction through frame zero onto the cylinder.
  - The only single-frame jumps are three cuts: 3.37 s (to his view), 4.37 s (to the damaged eye) and 25.17 s (to his face).
  - There are no whip moves.
- **No callouts:** no circular call-outs and no floating text diagrams.
  - The cut-aways are shaped by the anatomy: the graft opened over the plate, and the sagittal section of the eye.
- **Identity:** one patient, front and profile.

## Measured QC (`qa/v4/qc.json`)

- **Container:** 1080×1920, 30/1 fps, 798 frames, 26.6 s. No black frames.
- **Single-frame jumps:** frames 101, 131 and 755 only (the three deliberate cuts).
- **Loop seam:** the mean frame difference is **4.15** (V3: 9.35), against 2.6–2.8 for the opening's own steps.
  - The camera curve and the eye are continuous across the seam.
  - Most of the remaining difference is the caption change.
- **Audio:** −13.6 LUFS integrated, −1.6 dBTP.
- **Narration (ASR on the MP4's own audio):**
  - Zipformer: 0 differences.
  - Whisper: one difference, "ten" written as "10".
- **Evidence files:**
  - `qa/v4/hook/frame0.png`
  - `qa/v4/hook/hook_5fps.jpg`
  - `qa/v4/fix2_fix3_14-20s.jpg`
  - `qa/v4/fix3_19-23s.jpg`
  - `qa/v4/fix4_23-end.jpg`
  - `qa/v4/sheet_2fps.jpg`

## Remaining issues (honest list)

1. **Not watched or heard in real time.**
2. **"TEN YEARS blind" is unverified.**
3. **19.4–19.7 s:** before the seating, the forceps hold the whole plate face-on over his eye.
   - This is an object in transit, not seated.
   - For about 0.3 s it still shows the full plate over the eye before the cut to the section.
4. **19.62–19.9 s:** the plate turns from face-on to edge-on in screen space while the front view dissolves into the section. This object-led hand-off is kept from V2/V3.
5. **The pocket's see-through view** shows the plate faintly under the skin. It is an illustration convention: real skin is opaque.
6. **The plate is drawn at the size used in the bench sequence** (about 15 × 9 × 3.2 mm), so under the graft it spans much of the visible eye.
   - That matches the extruded model used from 8 s on.
   - Real laminae are often somewhat smaller.
7. **The graft over the plate is drawn about 1 mm thick, and the cylinder stands about 1.2 mm proud.** Both are within the real range, but simplified.
8. **Carried over from V2/V3:**
   - the teeth ghost briefly through the drape at about 10.1 s;
   - simplified hands and room;
   - a 0.25 s warm glow at the fovea (22.6–22.9 s);
   - the eyes are drawn 1.25× life size in the front view.
