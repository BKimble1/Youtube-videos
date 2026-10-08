# Future Got Weird · Video 02 · Art request for ChatGPT

**Episode:** How Cameras See Around Corners. **Prepared:** 8 October 2026.

This is the one consolidated artwork request for Video 02. Attach this whole packet (the zip) to the Future Got Weird
ChatGPT project and paste the message below. Bring the returned files back to the Claude episode session.

## What to paste into ChatGPT

> Create the complete Video 02 artwork batch from this packet (`art_requests.json`, this README and `references/`).
> Preserve the approved Future Got Weird cast and style exactly as drawn in the references: the guesser (red spiky
> hair, white and yellow striped shirt), the checker (grey bob, round glasses, coral cardigan, pencil) and the person
> (blue top, auburn bob). Make every asset in the list, in priority order, with the exact file names, sizes and
> backgrounds given. Keep all art text-free: no labels, numbers, light rays, arrows, equations, logos or data; those
> are added in animation. Provide clean 16:9 plates for the Runway starting frames (A10, A11) and the backdrops (A05,
> A06, A07, A08, A12), transparent sheets for characters and props, and the text-free thumbnail art (A13). Then package
> everything with a short manifest listing asset ID, file name, size, transparency and any notes.

## How the art is used

- The film is already built from Video 01's accepted cast as code-drawn SVG rigs, so continuity is exact. This batch
  is the **upgrade layer**: richer environment backdrops (A05–A08, A12), the thumbnail (A13), and drawn references
  for new poses and props (A01–A04, A09, A14–A16, all `reference_only`), which Claude rebuilds as layered SVG. Raster
  drawings are never called vector assets.
- **Runway plates (A10, A11):** starting frames for the two acted inserts (the opening sneak and the closing push). The
  film's current inserts are generated from Remotion frames of the same shots. Matched ChatGPT plates can replace them in
  a later pass if they look better.
- Nothing here is evidence. The real measurements in the film are drawn from the researchers' released data; generated
  art never stands in for an experiment.

## Style in one paragraph

Flat cutout illustration as in `references/style_frame_*.png` and `references/cast_rig_check.png`: rounded contours, one
consistent dark-ink outline (#162A32, about 4 px at 1920×1080), clean flat fills, simple mitten hands with a thumb,
round heads with oval eyes, dot pupils and one-stroke brows. Palette: cream #FAF3DF, teal #1CA7A0, coral #EF6B55,
yellow #FFC744, ink #162A32, secondary blue #4F7CC9, wood #C9924F, and a light matte relay wall #F4ECD8. No texture, no
painterly shading, no gradients beyond soft floor shadows, no striations or noise, no glow, no dark backgrounds, no
grids, no photorealism, no synthetic presenter, no glowing brains. Keep subjects inside the central 80 % (crop-safe),
and leave the top 12 % and bottom 15 % free of important detail.

## The batch (priority 1 first)

| ID | File | What | Use |
|---|---|---|---|
| A01 | V02_A01_guesser_turnaround.png | guesser turnaround: front, 3/4 L, 3/4 R, side, back | rig reference |
| A02 | V02_A02_guesser_expressions_actions.png | 8 poses: tiptoe, smug hands-on-hips, busted, ducking, relieved lean, smile drops, pushing a panel, arms crossed | rig reference |
| A03 | V02_A03_checker_with_sensor.png | 5 poses with the sensor: holding, glancing, jiggling, pinning a card, leaning round a panel | rig reference |
| A04 | V02_A04_handheld_sensor_prop.png | the time-of-flight sensor module (views), bare board, tripod stand | rig reference |
| A05 | V02_A05_room_plate.png | the room, oblique front-above view, folding screen perpendicular to the wall, gap visible, no people | backdrop + Runway |
| A08 | V02_A08_warehouse_corner_plate.png | two aisles meeting at a blind L corner, light wall at the junction | backdrop + Runway |
| A10 | V02_A10_opening_action_plate.png | room with the checker at left and the guesser mid-tiptoe at right | Runway start plate |
| A11 | V02_A11_closing_action_plate.png | guesser with both hands on the screen, ready to push it to the wall | Runway start plate |
| A13 | V02_A13_thumbnail_art.png | thumbnail scene, text-free, space for two words top-left | thumbnail |
| A06 | V02_A06_mirror_room_plate.png (+ A06b panel) | A05 with a mirror panel at x 1.9–2.6 m on the back wall | backdrop |
| A07 | V02_A07_wall_surface_closeup.png | magnified painted-wall cross-section | backdrop |
| A09 | V02_A09_delivery_robot_sheet.png | the delivery robot (not the mascot): views and expressions | rig reference |
| A12 | V02_A12_history_shelf.png | museum shelf: 2012 lab table, 2018 laser+detector, 2021 strip detector, empty 4th plinth | backdrop |
| A14 | V02_A14_research_module.png | phone-sized research device with a 10×10 window grid (not a consumer phone) | rig reference |
| A15 | V02_A15_3x3_sensor_box.png | small teal box with one window and a 3×3 dot grid | rig reference |
| A16 | V02_A16_warehouse_walker.png | the existing "person" character walking (front, side, top) | rig reference |

The full specification of each asset (composition, size, pose, contacts, crop-safe area, continuity reference, intended
motion for the Runway plates) is in `art_requests.json`.

## References (all in `references/`)

| File | What it shows |
|---|---|
| style_frame_counter.png, style_frame_gameshow.png, style_frame_verify.png | three frames of the approved Video 01 (V2 build, source commit 5bd35c1), rendered from the source |
| cast_rig_check.png | every accepted cast member side by side |
| kit_room_view.png, kit_room_plan.png | the Video 02 room as built in code, front view and from above |
| kit_cast_and_sensor.png, kit_tokens_and_sensor.png | the checker with the sensor, the guesser crouching, overhead tokens, sensor views |
| kit_warehouse_view.png, warehouse_layout_guide.png | warehouse front and plan views, robot expressions |
| room_layout_guide.png | plan of the room in metres: wall, screen, gap, sensor, both characters, mirror position |

## Import

Return files to `Future_Got_Weird/Video_02/art/incoming/`. `reference_only` drawings are rebuilt as SVG rigs; plates are
imported as backdrops behind code-drawn characters and light paths; nothing from this batch is used as evidence.
