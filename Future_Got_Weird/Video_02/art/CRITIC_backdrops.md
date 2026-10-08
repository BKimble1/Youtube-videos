# Video 02 · Critique of the backdrop assessment (A05, A06, A06b, A07, A08, A12)

Critic pass, 8 October 2026, on `art/ASSESS_backdrops.md`. I re-checked every recommendation against the plates, the
docs (DIRECTION, STORYBOARD, SCENE_BRIEF, the art request) and the scene code as it stands now. I read the scenes and
rendered stills in a scratch copy only. Nothing under `source/` or `work/` was edited.

Scratch (session-scoped): `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/art_assess/critic_backdrops/`
(`$K` below). The S2 stills come from a copy of `work/S2/source` taken at about 07:15 (`$K/s2proj`).

## Bottom line

The assessor's main verdict holds: **no plate goes into the film**. I re-measured the A05 floor lines, the colours,
the A07 slopes and the A08 overlay, and they agree with the report. But half of the action items are out of date.
The report says S2, S5 and S9 are stubs. They are now built:

| Scene | State now | What already exists |
|---|---|---|
| work/S2 | ~50 KB scene file, updated 07:12 | the S2.2 wall mirror and the S2.3 wall section, both in code |
| work/S5 | ~25 KB scene file, updated 07:09, QA r3 and a clip | all four S5 exhibits in code, in the `PLINTH` style |
| work/S9 | ~37 KB scene file, updated 07:13 | the room, kept raised for s46-s47 |

Only work/S8 (the warehouse) is still a stub.

If the assessor's changes went out as written, they would ask builders to redo working, storyboard-correct code:
- a new `S2_Mirror.tsx` component (which would also share the scene file's name);
- a new `S2_WallSection.tsx`;
- a new `S5_HistoryShelf.tsx`.

So I changed the A06b, A07 and A12 decisions to **reference only, no change**. I kept A05, A06 and A08 with
corrections. I also added three findings the report missed:

1. **S2.2 shows the wrong side of him in the mirror (physics, medium).** The guesser faces the camera and the mirror is
   on the wall behind him. A mirror there, seen from the sensor or the camera, shows his **back**. The built
   `WallMirror` draws a flipped copy of his front: face, eyes and mouth. This comes right after S2.1's "in = out"
   lesson and claim C08 ("keeping an image intact").
   - Fix, in S2 only: draw the reflection from the back, using A01's back view (hair over the head, a zig-zag nape,
     ears, the back of the striped shirt).
   - Evidence: `$K/out/mirror_A06_vs_S2build.png`.
2. **The Runway route through A05 breaks continuity.** The assessor suggests keeping A05 "as a Runway start-frame
   reference with A10/A11". Both of those plates are A05's room.
   - **A10:** the checker holds the sensor in her hands in S1.1. That breaks the rule that the sensor stands on its
     tripod for acts 1-3.
   - **A11:** his lunge pushes the partition **sideways** (−x), not back to the wall (−z). It is also a tilt-0 view,
     while the S9 build plays S8.3 in the raised view (`CAM_W`, `RAISED_TILT`).
   - The storyboard already says R1 and R4 frames are rendered from Remotion.
   - Evidence: `$K/out/A10_A11_A05_vs_S9build.png`, `$K/out/A10_sensor_crop.png`, `$K/out/A11_push_crop.png`.
3. **The museum floor doesn't match across scenes (low).** S5 and S6.1 use `C.paperDeep` (#F1E6C9) for the floor.
   The work/S7 museum slot (storyboard S6.10, `S7_Results.tsx` line 867) uses `C.woodLight` (#E3B77A). The assessor's
   description of the house museum style ("woodLight floor") is wrong for S5 and S6.1. The fix is one line in S7.

## Per-asset verdicts

### A05 room plate: MODIFIED (decision kept: reference_only_no_change)

**Checked and true.**
- **Not a parallel projection.** My own trace of the plank lines (rows 690-990) gives dx/dy 0.557, 0.573, 0.597, 0.697
  and 0.710, against our constant 0.743. No single warp registers it, and the overlays confirm it.
- **The partition is baked in, in the wrong place.** It sits right of ours, and the plant and door are re-drawn.
- **Soft at 4K.** At 4x the A05 partition is soft and mottled next to the code partition (`A05_vs_code_4x_partition.png`).

**Out of date.** The tilt-0 windows are now:
- **S1:** f0 to about f298, plus f601 to f632 (about 11 s).
- **S9:** f11173 to f11255 only (s45, 2.7 s). The S9 build rises on "Being" (`RISE0 = K.being − 2`) and stays
  raised through s47 and the hold. So "S8.3 is a tilt-0 room view" no longer applies.

**4K.** Moot, since the code room stays.

**Changes.**
- No import into `public/`. No `staticFile` or `.png` use exists in any work scene; I grepped all nine.
- Remove "keep A05 as a Runway start-frame reference". R1 and R4 start and end frames must be Remotion renders of
  the shot, so the cut to the code room doesn't jump.

### A06 mirror room plate: KEPT (not_used)

All of A05's problems apply.

**Also verified.**
- Its cream frame (#F4F3EC) almost vanishes on the cream wall (ΔE 5).
- The mirror is static.
- S2.2 is already built in the raised view with a code mirror that drops in on "here".

No change.

### A06b mirror panel: REJECTED → reference_only_no_change

The S2 builder already has the code mirror: `WallMirror` in `work/S2/source/src/scenes/S2_Mirror.tsx`, about
lines 645-685. Rendered at f2120 and f2160, it does what the assessor proposed and reads better in context.

**What the built mirror has.**
- A wood frame (`C.wood`, ΔE 44 against the wall). A06b's cream frame is ΔE 5 against it.
- `C.blueLight` glass.
- Sheen strokes drawn above the clipped reflection.
- Placement at h 0.85-1.95 m under the S2 builder's raised `CAM_A` framing. It stays fully in frame through the
  push to `CAM_B`.
- A specular point computed in code (x = 2.139 m) and checked against the layout with `assertPath`.

**Why the assessor's version doesn't fit.**
- Its placement (h 0.4-1.36 m) and its slide along x conflict with the built drop-in.
- The bitmap fallback is still not acceptable: half-weight outlines and off-palette #AFD9FC glass (ΔE 11 to
  `C.blueLight`).

**Change.** None to the mirror. The reflection's content is a separate finding (see A01 below).

### A07 wall cross-section: REJECTED → reference_only_no_change

S2.3 is built in code: `S2_Section.tsx` plus `SectionContent` in the scene. Evidence: `$K/out/section_A07_vs_S2build.png`.

**What the built section has.**
- **Plan orientation.** The wall is on top and the room below, the same convention as S2.1's bench and the S4 plan.
  A07 has the air on top, so it is flipped against the film.
- **The right physics.** One ray goes in, and a **cosine-weighted `ScatterFan`** comes out of each lit spot. That is
  exactly C09 (near-Lambertian). A dashed mirror ghost covers "less like a mirror", and the "rough up close" label is
  there.

**Why A07 adds nothing.**
- A07's air and paint differ by ΔE 2.4, so its paint layer exists only as two ink lines. The built section's layers
  are 8 apart.
- A07's long, gentle waves read as "wavy" rather than "rough". The built profile is busier and reads rougher.
- Swapping in `A07_surface_profile.json` changes nothing visible and costs the S2 builder a re-check.

**Don't do this.** Don't add specular reflections off the profile. They would spread a beam only ±59° (the profile's
own max slope is 29.7°, which I re-computed). That would make generated bumps look like the mechanism.

**Also dropped.** The plate fallback at zoom ≤ 1.

**The profile JSON.** It is accurate (481 points; max slope 29.7°, RMS 11.1°) and can stay as an archive. Its
"verification" field points at a scratch path that dies with this session.

### A08 warehouse corner: KEPT (not_used)

The overlay confirms A08 is a redraw of `kit_warehouse_view` at the kit's (890, 590, 1.34) push. It has:
- the same uprights and beams;
- re-arranged boxes;
- one L-shaped lane line instead of the code's lanes, arrows and stop bar;
- no top deck on the near rack.

**Why it can't serve.**
- It cannot follow the S7.2 tilt or a wider camera, and it would need a corner matte for the walker.
- It isn't a usable R3 start frame either: it is empty, and R3 frames come from Remotion.

**Change.** work/S8 is the one stub left, so this note should reach the S8 builder: build S7.1, S7.3 and S7.5 on
`WarehouseSet`.

### A12 history shelf: REJECTED → reference_only_no_change (plus one low continuity fix in S7)

S5 is built: `S5_Exhibits.tsx` and `S5_Museum.tsx`. I checked QA r3 at f6072, f6340, f6650 and f7080. It is in the
`PLINTH` style (blue wall, wood slabs, yellow plaques, `paperDeep` floor) and has the storyboard's content:

- **2012:** laser → two mirrors → wall, the mannequin behind a coral screen, and the rising 3D outline.
- **2018:** an open laptop, a raster board with the S4 spot glyph, an exit-sign pictogram and a wall clock.
- **2021:** a laser box, a strip detector, a monitor with blobs, ordinary objects and a small wall.
- **End of the shelf:** the side card and the stool, with code labels and the "illustration" chips.

Nothing in A12 improves on it. The assessor's diagnosis of the plate itself is right: a closed laptop, no clock and an
off-palette #D9BE9C floor.

**Change.**
- No S5 work.
- Optional (low): set the work/S7 museum-slot floor to `C.paperDeep` to match S5 and S6.1.

### A01 back view → S2.2 reflection: ADDED (upgrade_code_rig_from_reference)

See bottom-line finding 1.

**The fix, local to S2.** Draw the reflection inside `WallMirror` from behind:
- no face;
- the red spiky hair covering the head, with a zig-zag nape;
- the ears;
- the back of the striped shirt;
- the same squash on the duck.

Use the shared Cast2 back view if the cast critic's change lands first. Otherwise copy one into an S2-prefixed
component.

**Why it's worth it.** The gag still reads, because the unmistakable hair drops out of the glass on "visible". And
the picture stops contradicting the mirror lesson it illustrates. If the lead prefers the cartoon cheat, make that an
explicit decision.

### A10 / A11 (Runway plates; outside the report, but its A05 note points at them): ADDED (not_used as start frames)

See bottom-line finding 2. A10 breaks the sensor-on-stand rule for acts 1-3, and both plates use A05's room. A11's
push direction is wrong (sideways, not toward the wall), and its view is tilt 0 while S8.3 is raised. Pass this to
whoever owns the Runway assessment.

## 4K honesty, in one paragraph

Every surviving decision lands on code-drawn vector sets, so the 3840×2160 master and the 1080p upload are both
exact. The plates were 1672 px originals, so any of them would sit 2.4-2.7x magnified in the master at the film's
cameras, and 3.4-4x on the S2.2 push (zoom 1.7) or an S5 truck. They would read soft and haloed next to the cast.
The vectorized versions (from the assessor's trace) trade softness for wobble and blotches. None of that matters
now, because nothing from the batch goes on screen.

## Evidence

- **Mine:**
  - `$K/out/s2_sheet.png` (S2 f2120-f2430 as built)
  - `$K/out/mirror_A06_vs_S2build.png`
  - `$K/out/section_A07_vs_S2build.png`
  - `$K/out/A10_A11_A05_vs_S9build.png`
  - `$K/out/A10_sensor_crop.png`
  - `$K/out/A11_push_crop.png`
- **The assessor's (re-viewed):**
  - `backdrops/out/A05_vs_RoomSet_t0_overlay50.png`
  - `backdrops/out/A05_vs_code_4x_partition.png`
  - `backdrops/out/A07_4K_compare_x2.png`
  - `backdrops/out/A08_vs_kitWarehouseView_cam134_overlay50.png`
  - `backdrops/out/A12_vs_built_museum_continuity.png`
- **QA stills:**
  - `qa/scenes/S5/r3/06072_6072.png`, `06340_6340.png`, `06650_6650.png`, `07080_7080.png`
  - `qa/scenes/S6/r5/07412_word_s30_gadgets+12.png`
  - `qa/scenes/S7/r3/10126_word_s39_yet.png`
