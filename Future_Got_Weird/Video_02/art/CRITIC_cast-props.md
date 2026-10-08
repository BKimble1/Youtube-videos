# Critic review: cast and prop art assessment (A01–A04, A09, A14–A16)

Review date: 8 Oct 2026. Reviewed: `art/ASSESS_cast_props.md` and its structured result. I checked every cited sheet,
the assessor's side-by-sides, the current scene renders in `qa/scenes/*`, the work copies in `work/S*/source`, and the kit
code. I also prototyped the two contested rig changes on the real rig in a scratch copy. Nothing under `source/` or
`work/` was edited.

## Verdict in brief

The assessor's core calls hold up: no raster from this batch enters the frame, A14 and A15 are not used, the robot's
"cautious" eyes are a real defect, and A10 breaks the tripod rule. Most of the rig-change plan, though, rests on two
premises that are no longer true:

1. **"S9_Payoff is a stub, so this costs no rework."** It isn't. `work/S9/.../S9_Payoff.tsx` is 37 KB at QA round r3. The
   push (R4) and the checker's lean (J4) are already staged with the existing rig (`qa/scenes/S9/r2`, `r3`). The
   `PUSH` and `PEEK_ROUND` kit presets would duplicate work S9 has already done.
2. **"Three different stands."** Four scenes already share one design. `S2_SensorStand`, `S3_SensorStand` and S9's
   `S9SensorStand` are verbatim copies of `S1_SensorStand`. Only `S4_Stand`, `S6_Stand` and `S7_Props.SensorStand`
   differ, and at room scale only slightly. An A04-styled restyle would change the four that already match in order to
   fix three minor outliers.

A shared-kit change also ripples. Builders can't edit `Cast2.tsx` or other shared files, and any change there
re-renders S1, S3, S4, S6, S7 and S9. So I moved every surviving change into the one scene that needs it, plus a
promote-at-merge step for the lead.

**The biggest miss is S2.2.** In "Put a mirror here, and our friend is simply visible", the mirror on the back wall
must show the guesser's **back**. He faces the room, and a back-wall mirror shows the side of him that faces the wall
to any viewer in front of it: the camera, the checker, the sensor. A frontal (face-showing) reflection would be a
physics error, and this is the one beat of the film that is about how mirrors reflect. The A01 back view is exactly what
this needs. S2's mirror shot isn't built yet (`S2_Mirror.tsx` is still a 432-byte stub), so the fix costs nothing now.

**4K.** None of the surviving recommendations puts generated pixels in frame. Every change is SVG, so the 1672 → 3840
softness (2.3× upscale) and the palette drift (near-black ink, scarlet A02 hair) can't reach the master. I agree with
the assessor that no sheet may be used as a sprite or vectorised. Vectorising would carry the boxy torso, 6 stripes and
#E6261D hair into the frame.

## Per-asset decisions

| Asset | Assessor | Critic | Why |
|---|---|---|---|
| A01 | upgrade (back view + `turn`) | **MODIFIED** | Keep the back view as an *additive overlay*, used in S9 (push) and S2 (mirror reflection). Drop `turn` and the `gaitPose` change, which would alter every built walk. |
| A02 | upgrade (PUSH, tiptoe, duck, worried) | **MODIFIED** | Keep only the duck (#4), as an S2-local pose. PUSH: S9 has its own, and the side-on lunge is the wrong axis. Tiptoe: S1 is built and its sneak reads. EXPR.worried: not art-driven. |
| A03 | upgrade (PEEK_ROUND, grip) | **REJECTED → reference_only_no_change** | S9's lean already reads and suits a "calm, deadpan" checker. My prototype of A03 #5 reads as a stumble. Nothing needs the two-fist grip. Keep the A10 continuity flag. |
| A04 | upgrade (A04-styled shared stand, occlusion, board, S1.6) | **MODIFIED → reference_only_no_change** | The art confirms S1's stand. Make S1's stand canonical and align S4/S6/S7 at merge. Fix the occlusion by posing her arm per scene; the layout stays. Board: S5 is built and the board is only 48 px. S1.6: built, and the coral/dark lens rims already read as "two windows". |
| A09 | upgrade (eye fix) | **KEPT, MODIFIED** | Defect confirmed. Also flip the lid tilt sign (inner ends are currently *lower*, which reads as angry) and clip rather than paint over the dot. One component, used only by the unbuilt S8. |
| A14 | not used (+ optional S6 tweak) | **KEPT; tweak dropped** | The storyboard asks for "phone-shaped". S6's saffron slab and its label already separate it from S6.2's blue phone. |
| A15 | not used (+ ZoneBox merge) | **KEPT** | Merge the two ZoneBox copies at merge. Not art-driven. |
| A16 | reference only (+ PersonToken in Tokens.tsx) | **KEPT, re-routed** | S8 isn't started. The S8 builder copies `PersonTokenG` to `S8_PersonToken.tsx` now, and the lead promotes it at merge. Don't use A16's "top" view. |
| A01 + A02 #4 (new) | (missed) | **ADDED** | S2.2: his reflection must be the back view, and it ducks in sync with him. |

## Evidence I checked

### A01 back view: an overlay is enough (prototype)

`out/sbs_critic_backview.png`, from left to right: the A01 back view, the rig front, the rig with a back-of-head overlay,
a push from behind with both hands on an edge, and S9's current frontal grab. All of these are under
`/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/art_assess/critic_cast_props/`.

How the overlay is built (`BackHead` in `rig/src/dev/Critic.tsx`, about 40 lines):

- Placement: it is positioned from the exported `eyesWorld` and `mouthWorld`, so it follows tilt, peek, lean and scale.
- Drawing: the ears, then a skin head that hides the face, then back hair clipped to the head with a zig-zag nape, then
  the rig's own four crown spikes.
- No `Character2` change: the front rig stays pixel-identical.
- The shirt needs no change. The rig's stripes and collar notch are what A01 shows from behind too.

It reads as the same boy from behind. From behind, the push reads as a push. The current frontal grab does not.

### S9 push and lean as built

`qa/scenes/S9/r2/sheetB.png`, `sheetC.png`, `sheetD.png` and `r3/sheetB.png`.

- **Push.** He stands to the right of the near end, faces us, and his arms cross his body to the panel edge. The forearm
  covers his face and the pose reads as hugging or dragging, not pushing toward the wall. The motion itself is correct:
  along −z, and the gap closes.
- **Lean.** At 11690–11715 the lean (peek 0.85, lean 3, arms crossed, deadpan) reads clearly and suits the character.
- **Prototype of A03 #5.** `out/Critic_2_0.png`: the hand on the edge and the trailing leg read as a stumble against the
  panel. That is louder than the "she simply leans round" beat.

### Stands

```
grep -n "copy of S1_SensorStand" work/S2/.../S2_SensorStand.tsx work/S3/.../S3_SensorStand.tsx
S9_Room.tsx: "the S1 stand, copied so S9 matches"
```

The outliers are `S4_Stand` (round grey hub), `S6_Stand` (grey plate with a coral tab, in a close-up card) and
`S7_Props.SensorStand` (inkMuted collar). At room scale (S7 09758, S4 room view) they all read as the same dark tripod.

### Occlusion

- **S1** (`qa/scenes/S1/r4full/01523…`): the box is half behind her right upper arm.
- **S3** (`r4full/02962`): the box is behind her forearm, under a "sensor" callout.
- **S7 and S9**: her arms are crossed and the readout is fully clear. Those scenes show the fix that works.
- **Layout:** `operator.z` = 0.95 and `sensor.z` = 0.90, so she is drawn in front of the sensor. The layout is shared and
  every light path was verified against it, so don't move `operator.x`.

### Robot eyes

`eyes_cmp.png` (rig vs A09 at 6×) and `out/Critic_3_0.png` (current vs prototype fix).

- **The bar.** In `DeliveryBot.tsx` `Eye()`, each lid spans ±(rx+2.5k) = ±10.6k on eyes 19.5 apart, so the two lids
  meet and form one bar.
- **The tilt.** `tiltL = side*1.4k*squint` gives *x1* (left end) = lidY+tiltL. For the screen-left eye (side −1) that
  puts the inner end lower, and the same holds for the right eye. That is an angry V, the opposite of the code comment's
  intent ("inner ends a touch higher").
- **Scale.** In the kit warehouse frame the face panel is about 75 px wide at 1080p and 150 px at 4K, so the scowl is
  readable.
- **Prototype fix.** Separate lids, half-disc dots, inner ends up. It reads as wary. Painting cream over the dot left a
  faint anti-aliased arc, so the real fix should clip the dot below the lid.

### Tiptoe

`s1_tiptoe_strip.png` (from the S1 QA clip): a frontal cartoon sneak with paws up and a knee lifting while he travels.
It reads as sneaking in motion. A02 #1's 3/4 body would need a turned rig, which is out of scope. R1 (Runway) is
also planned for this shot.

### S6 module vs phone

`s6_grid.png`, `s6_phone.png`: S6.2's generic phone is blue with a full screen. The S6.3 module is saffron with a
window, a lens and the label "smartphone-grade device (team's own) · ≈ 100 pixels". They don't get confused.

### A10 and A11 plates

A10 has the checker holding the sensor in S1.1, which breaks the tripod rule for acts 1–3. In A11 he pushes the screen's
face from the side, which would slide it along x, not toward the wall. Neither plate should seed R1 or R4 as drawn. That
call belongs to the plate assessor and is noted here only for continuity.

## Recommended changes, routed

1. **S9 builder (high): push from behind, after A01.**
   - Add `S9_BackHead.tsx`, copying the prototype `BackHead`.
   - Stand him on the camera side of the partition's near end. Plan x ≈ 2.05–2.15, so his hands show beside his left
     side. Plan z ≈ z1 + 0.25–0.3.
   - Use `armsFront: 'none'`, both mitts on the end edge via `reach2`, and a little hunch and sink.
   - Turn him to the back view during the walk to the near end (swap on a step, in the weight-down frame).
   - Turn him back to the front for the dust-off and the smug eyes-shut beat. J4 needs his face.
   - Framing: by my reading of r2, his feet start near the bottom edge of CAM_ROOM. Either widen about 8% on "hide",
     before the locked R4 segment, or accept a crop in the first step. Re-render R4's start and end frames.
2. **S2 builder (high, accuracy): his reflection in the mirror is his back.**
   - Add `S2_BackHead.tsx` with the same code. Draw his reflection mirrored and clipped to the mirror, from the virtual
     image at z = −H.z.
   - The reflection ducks with him. Draw `Character2 pass='body'`, then `BackHead`, then `pass='frontArm'`, so that
     the hands on the crown sit over the hair.
   - The duck after A02 #4: `CROUCH`, both mitts on the crown via `reach2` from `eyesWorld`, `armsFront 'both'`,
     hunch ≈ 0.15, brows 1, mouth 'o' then 'frown', down in ≤ 6 frames with a squash.
   - No generated reflection ever, including on the A06b panel. The reflection is code-drawn from the same rig.
3. **S2 builder (medium), S1 and S3 optional (low): keep the readout clear.**
   - Stage the checker with arms crossed or her right hand resting on the stand column (as S7 and S9 do), never with
     the forearm over the box.
   - S3 can then drop its "sensor" callout.
4. **Lead, before S8 starts (medium): DeliveryBot `Eye()`.**
   - Separate lids: half-length rx + 0.6k.
   - Half-disc dots, clipped below the lid line with a clipPath.
   - Inner ends higher: `tilt = -side*0.9k*squint`.
   - Pleased arcs: ±6k, lifted 1.5k.
   - Sync `work/S8`'s copy (S8 is a stub), or let S8 copy it as `S8_Bot`.
5. **Lead at merge (low).**
   - Promote `S1_SensorStand` to the kit, and align the S4, S6 and S7 stand hubs and plates to it (tealDeep hub and
     plate, inkSoft legs).
   - Promote `BackHead` and `S8_PersonToken`.
   - Merge the ZoneBox copies.

**Rejected:** the `turn` parameter and the gaitPose `turn = dir*0.6`; GAITS.tiptoe and ARMS.sneak changes; the `PUSH`
and `PEEK_ROUND` presets; EXPR.worried; holdSensor `'grip'`; the A04-styled stand restyle; the `operator.x` move;
SensorBoard; the S1.6 side view; the S6 module tweak.

## Scratch files

All under `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/art_assess/critic_cast_props/`:

| File | Contents |
|---|---|
| `rig/src/dev/Critic.tsx` | `BackHead` prototype; lean test |
| `rig/src/components/v02/CriticBot.tsx` | Eye-fix prototype |
| `out/Critic_1_0.png`, `out/sbs_critic_backview.png` | back view and push |
| `out/Critic_2_0.png` | lean |
| `out/Critic_3_0.png`, `eyes_cmp.png` | robot eyes |
| `s1_tiptoe_strip.png`, `s6_grid.png`, `s6_phone.png` | frames from the scene clips |
