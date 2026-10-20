# The Telepathy Flaw — V5 (final animation and clarity pass)

V4 is kept untouched (`source/src/v4/`, `exports/..._V4_...`, `qa/v4/`, `V4_NOTES.md`). V5 is a full copy of the V4 implementation in `source/src/v5/` (compositions `TelepathyFlawV5`, `TelepathyFlawV5Clean`, review lab `V5Lab`) with a focused set of animation, construction and clarity fixes. It is not a rebuild: the shot list, the cut times, the scenery, the compositions, the captions, the story order and the whole approved audio mix are the V4 ones. 28.000 s, 30 fps, 840 frames.

## Locked, and how that is enforced
- **Audio.** No ElevenLabs call, no regeneration, no remix, no retiming, no new sound. Every V5 export is muxed with `audio/v4/mix/FGW_TelepathyFlaw_V4_mix_48k.wav` (sha256 `3948cadd8a79835a7592db38828c954eb9df8aa28c8fddad40d2d65fa891d192`, −16.0 LUFS, −1.1 dBTP). `tools/export_v5.py` refuses to run if that hash changes and checks that the delivered AAC stream is bit-identical to the one in the V4 export (`exports/EXPORT_METADATA_V5.json`).
- **Timing.** The cut list (`plan5.ts` = `plan4.ts`; `qa/v4/cuts.json` is used for both) is unchanged. Visual events keep their V4 cue times (arrival chime 2.02 s and 10.52 s, form 22.45/22.85, pops 23.05/23.45, alert pop 25.38, delivery chime 25.78, thump 14.52, tick 20.82). Narration ends at 27.39 s.
- **Captions.** Same words, font, rhythm and timing. `v5/shots/Overlay5.tsx` replaces the shared overlay only for V5 (V4's file is untouched); the only change is contrast: a 10 px outline (was 9 px) and a stronger drop shadow (blur 6, opacity 0.62; was 5 and 0.55). Caption placement is unchanged; the café cameras were re-framed instead (below) so hands and cups stay out of the lane.

## What changed

### 1. Arm construction (both café characters)
The V4 defect was real: the far upper arm was drawn completely behind the torso and the far forearm was redrawn in front through one mask, so at about 13 s the near (cup) forearm and the far (lap) forearm seemed to grow from one near-side elbow.
- Each arm now has its own shoulder, upper arm, elbow, forearm and hand. The far shoulder is shifted toward the character's front (`rSv`, the far-shoulder offset across the torso), so the far upper arm leaves the body at its own shoulder crown and runs down beside the torso front before it is covered. The far forearm and hand are redrawn **outside the torso silhouette only** (new mask `rfx`: everything except the torso path; `rFront: 0`), so the forearm appears from below and behind the torso edge and never from under the near elbow. The far hand rests on its own thigh/knee, clearly separate from the near arm in silhouette and in position. The woman's rig (a mirror of the sender's) gets the same construction (`rig/Woman.tsx`: far forearm drawn outside the cardigan before the held cup).
- The far-hand rests are further forward than in V4 (`W_LAP`, `M_LAP`, `M_NEAR_LAP` in `world/interior.tsx`), so the far elbow reads as a corner of its own, not as a branch of the near arm.
- **Lap clench (20.45–21.3 s).** In V4 both hand targets converged on one point (the doubled palm). V5 separates them: the near hand sits closer to the body on the near thigh, the far hand ahead of it on the far thigh, with different wrist directions (`nHa 158…154`, `fHa 180…184`) and the fist hand pose, so two readable fists rest on two knees. The tremble is the same small offset on both, nothing else moves.
- **Ending.** The recipient's recoil hands rise on two arcs (near hand outward then up, far hand lower and nearer her body). The far-hand recoil targets stay inside the arm's reach (earlier far-hand key at 25.66 s so the lagged hand does not stretch while the shoulder moves back) and every arm stays at 1.000 of its rig length in every frame. The sender's reaching hand and the recipient's hands are each visibly connected to the correct shoulder.
- **Exterior.** The far arms now hang forward and are visible (they were hidden in V4), so both standing figures have two arms.

### 2. Cup handling and contacts
- The cup is a rigid object in its own frame; the hand and the cup are one object. Taller cup (`CUP_TALL`), handle-less, the hand wraps the body. Far fingers are drawn behind the cup, near fingers and thumb in front; thumb sides were swapped for the woman (V4 had them on the wrong sides).
- **Sip.** V4 tilted the cup *away* from the drinker and centred the cup on the mouth, so the palm covered nose and glasses. V5 tips the cup toward the drinker (restrained arc, `SIP_TILT = 21°`, wrist and cup together), puts the near rim edge on the lips (`mouthPoint` in `rig/Head4.tsx`) and keeps the cup body and rim visible between hand and mouth. The cup never slides in the grip.
- **Return.** The saucer is always a separate static prop; the cup settles onto the saucer before the fingers release.
- The sender's grip-tightening beat keeps its subtle tremor, attached to the cup (the cup and the hand shake together).
- **Contact audit.** The seat/pelvis, feet on the floor or chair rung, thigh-to-hand, sleeve and upper-arm and cup/saucer/table contacts were audited in the per-frame rig check (hand and foot targets, chair-relative free hands) and by frame review in each burst; free-hand targets are expressed relative to the chair so a sliding chair carries the hands with it.

### 3. Acting and motion (the cuts and durations did not move)
- Channels are lagged against each other (`sampleRec`): eyes/head lead the body by 0.08 s, the near hand follows by 0.07 s, the far hand by 0.12 s and the cup by 0.05 s, so reactions read eyes → head → torso → hands instead of every part starting and stopping together. Anticipation and short settle keys were added to the sip, the rejection, the grip and the recoil.
- Exterior greeting: a weight shift for each person, a purposeful glance, no synchronised rocking; feet follow the weight shift.
- Rejection: the existing short head shake stays; the beat reads as discomfort and effort to dismiss, with no facial feature swimming and no hair-spike reordering.
- Lap beat reads as restraint: the hands are placed and then stay (tremor only).
- Recoil: sharp, with the torso overshoot and the chair sliding back with her; her feet support the chair motion.
- Blinks are gated (`blinkAt` with a smooth gate) for the recognition and withdrawal beat; both characters' eyes stay open around 26.35–26.4 s.

### 4. Story clarity
- **Imagined image (14.1–14.75 s).** Her chair and her body now tip as one rigid object about the chair's back feet; the cup is released first and falls toward the viewer along its own flight path; fragments appear only after landing; the camera move and the tip angle are smaller so the chair legs do not cross the body; no impact, no injury. The thought framing and the return to the unharmed recipient are as before. The sender's reaction (the rejection shot) is unchanged in what it shows: he does not cause the event.
- **Decoder comparison (21.3–24.05 s).** The tall rectangular casing is gone. The insert is a schematic inside a round implant (same bezel ring, rivets and circuitry language as the head implant): intended blue pattern and unwanted red pattern enter the same decoding stage and leave as the same message. Timings of the form and pop events are unchanged (22.45/22.85/23.05/23.45). No small-text equation, no extra bubbles.
- **Receipt (25.35–27.4 s).** The delivered pictogram recalls the imagined image: a simplified, higher-contrast chair-and-cup in a red alert bubble (`AlertChip` in `ui5.tsx`), recognisable at phone size without becoming an interface card. "Message Delivered" is a smaller secondary tag stacked under the alert, at a readable minimum size. The emotional order is: she notices → recognises → looks toward him → draws away; the sender's realisation shot is unchanged.

### 5. Cleanup
- Shoulder seams, double contours and sleeve shading mismatches were reviewed in each burst; the far-arm redraw is clipped to the outside of the torso so no sliver remains at the shoulder; glasses move with the head (`Head4`), and the head turns match gaze and seated orientation.
- The throat→implant and neuron→brain transitions keep the V4 matches; the café inserts return to the same screen directions and positions.
- Camera: no abrupt acceleration at the café close-ups; the final implant dive is eased and the opening/closing macro match is intact (`qa/v5/seam.json`).

## What was reviewed, and how
See `DEFECT_LOG_V5.md` (what each fix is and how it was checked). Nothing was watched or listened to in real time; all judgement is from frames, source and measurements.

## Deliverables
- `exports/FGW_TelepathyFlaw_V5_Review_1080x1920.mp4` (captioned), `exports/FGW_TelepathyFlaw_V5_Clean_NoCaptions_1080x1920.mp4` (same picture and mix, no captions) and `exports/FGW_TelepathyFlaw_V5_Master_2160x3840.mp4` (native 4K render of the captioned composition at `--scale=2`). Sizes and SHA-256 in `exports/EXPORT_METADATA_V5.json`.
- Source: `source/src/v5/`; QA: `qa/v5/`; tools: `tools/export_v5.py`, `tools/views.py`, `tools/film_frames.py`, `tools/sheet_from.py`, `tools/caption_contrast.py`, `source/scripts/check_rig5.ts`, `source/scripts/check_layout5.ts`.

## Known limits
- The line "Humans have thousands of dark, unwanted thoughts every single day" is unchanged (the script and sound were not to be reopened) and is still unsupported. This render is not fact-approved.
- Arms stay long and tube-like (Death Clock construction); the standing pair outside is the least refined staging. The brain and throat are cartoon diagrams.
- Caption lane: the rig-box layout check is a screening estimate; a hand or cup can still sit near the lane in close-ups (see `qa/v5/LAYOUT_CHECK.json`).
