# Bone Glue (FGW Short) — build brief for art modules

Project: `/home/user/Youtube-videos/Future_Got_Weird/bone-glue/` (Remotion 4 + React SVG, 1080×1920, 30 fps).
Source root: `source/src/`. Node modules are installed in `source/node_modules`.

## The film (≈28 s, narration-timed; times are provisional from the take's word timings)

| t (s) | Narration | Picture |
|---|---|---|
| 0.0–2.7 | "If you shattered your wrist, imagine gluing the bones back together." | Frame 0: extreme close-up straight down into a small incision at the patient's wrist. The fractured distal radius fills the frame (bone vertical, crack horizontal). A syringe-type applicator's steel cannula (entering from the upper right) is already laying a bead of teal adhesive along the crack; a pointed reduction clamp (entering from the lower right) holds the fragments aligned. The camera tracks right along the crack with the tip, then widens: the incision rim, then the palm-up hand and forearm appear. |
| 2.7–6.0 | "…together. Researchers actually did it." | Keep widening (the camera tilts from straight-down to a high three-quarter view) into a compact clinical scene: the patient's forearm on a draped hand table, the surgeon seated at the right side of the table (facing screen-left, Weird Crew style, cap + mask + gown + light-blue gloves) finishing the bead. Surgeon's controlled reaction: focus, then a small satisfied eye-smile. |
| 6.0–8.0 | "They developed an experimental glue" | Push back down into the incision onto the bead's lower contact edge (glue above, bone below). |
| 8.0–10.3 | "inspired by oysters sticking to rocks." | Shape match: the glue's contact edge → an oyster cemented to a rock underwater (shell above, rock below). Water moves; the attachment holds. Then the oyster's attachment boundary matches back to the glue's contact edge. Same camera direction both ways (push-in with a slight downward drift). |
| 10.3–13.6 | "It grips bone even inside a wet, bloody wound." | Macro on the glue across the aligned fragments, a thin film of blood-tinted fluid flowing over; the bond stays attached. |
| 13.7–18.7 | "In one reported wrist case, surgeons secured the broken pieces in just three minutes." | Pull back out to a wider wrist cutaway (a soft-edged anatomical window over the wrist showing radius, ulna, carpals, metacarpal bases in deep tissue) — the surgeon's gloved hands withdraw the applicator and release the clamp; the fragments stay put; the gel sets. |
| 18.8–21.0 | "The fracture still needed months to heal." | The incision closes (sutures); the camera moves back into the fracture: hematoma → soft callus → hard callus. |
| 21.1–24.7 | "But as new bone grows, the glue gradually disappears." | New bone fills in around the shrinking teal glue. |
| 24.8–28.0 | "Your body replaces the stuff holding you together." | Restored bone; the camera eases out to the healed wrist (faint scar) on a follow-up table; the hand makes one small natural movement (fingers curl gently and relax). Loop: a push back into the wrist through the skin layers into frame 0's composition. |

## Coordinates and shared contracts (read these files; do NOT edit them)

- `src/art/anatomy.ts` — **the** geometry. Millimetres, x right, y down. The patient's RIGHT forearm, palm up, hand
  pointing UP the frame; radius on screen right (thumb side), ulna on the left. Origin = the fracture centre on the
  radius. Fingers to y≈−240, forearm continues down past y=+250. `INCISION` (ellipse, centre (0.5,−2), rx 16, ry 18.5).
  `fingerChain(digit, curl)`, `thumbChain(curl)`, `skinBorders(y)`, `WRIST_CREASE_Y`, `BONE_DEPTH`=10.
  `ULNA` and `CARPALS` there are rough placeholders (the skeleton builder supersedes them in its own module).
- `src/art/palette.ts` — `C` (all colours) and `INK` (#172B3A navy, the Weird Crew contour colour).
- `src/camera.tsx` — `Cam {x,y,w,k?,focus?}` (w = world mm across 1080 px at depth 0; k = vertical squash of the
  table plane, 1 straight down → ≈0.86 high three-quarter view), `Layer` (one depth layer per SVG: z>0 farther,
  z<0 nearer; scaled by d/(d+z), d=2.2·w; blur from |z−focus|), `layerScale`, `toScreen`, `toWorld`, `viewRect`.
- `src/core/geo.ts` (`pt, add, sub, mul, nrm, perp, rot, lerpP, closed(ps,tension), open(ps,tension), tube(...)`),
  `src/core/color.ts` (`mix, lit, shade, rgba`), `src/core/ids.ts` (`uid(tag)` unique SVG ids per frame), `src/lib.ts`
  (`clamp, ss, ss5, lerp, keyS, noise1, hash, ring`).
- `src/dc/` — the Weird Crew "dc" rig (Death Clock → Real Web Fluid → Glass Climbing lineage): `Head.tsx` (face,
  `Expr`, hat/glasses; 3/4 turn toward screen LEFT only), `Hand.tsx` (`Hand` with `pose`, `L`, `view`, `color`,
  `sheen`, `hold` sandwich), `limb.tsx` (`Limb`), `shade.tsx` (`Capsule`, `Blob`, `LIGHT` from upper left),
  `ink.tsx` (`Inked` two-pass contour, `Deco`, `InkLine`, `InkPath`), `rig.ts` (`placeHand`, `handUV`, grip poses),
  `Man.tsx` (full figure, for reference). Copy/adapt into your own file if you need changes; don't edit dc/.

## Style (match the channel's Weird Crew vector finish)

- Navy ink (`INK`) contours via the dc two-pass `Inked` system on characters and props; cel gradients lit from the
  upper left (`LIGHT`); small white glosses; flat, clean shapes; no noisy textures; no text, labels, numbers, glyphs,
  badges, callouts or diagrams anywhere (captions are the only text and are added by the film).
- Reference look: `../moth-silk-web-shooter/exports/FGW_Real_Web_Fluid_V6_REVIEW_1080x1920.mp4` (gloved hands, lab
  props, wrist close-up) and `../glass-climbing/exports/FGW_Glass_Climbing_V4_REVIEW_1080x1920.mp4` (the guesser,
  hand close-ups). Extract frames with ffmpeg to look at them.
- Hands must hold their props convincingly (fingers wrap, thumb opposes, nothing floats); arms run off-frame or to a
  visible shoulder, never end in the air.

## How to test your module (each builder has its own entry; never import another builder's unfinished file)

    cd /home/user/Youtube-videos/Future_Got_Weird/bone-glue/source
    npx remotion still src/test/<name>.entry.tsx <CompId> <scratch>/<name>/out.png --props='{...}' --log=error

Write your entry as `src/test/<name>.entry.tsx` (`registerRoot` + one `Composition`, 1080×1920, a grid/sheet of
several states is fine). Look at every render (Read the PNG). Iterate until it is genuinely good at full size AND
at phone size (downscale to 360×640 to check readability). One still takes ~25 s to bundle+render; the machine has
4 cores shared with other builders — render one still at a time, no `remotion render` of videos. Scratch dir:
`/tmp/claude-0/-home-user-Youtube-videos/1408cabe-3c65-5cfb-9ca8-ec089a633118/scratchpad/<name>/`.
Run `npx tsc --noEmit -p .` before finishing (your files must type-check).

## NOTE for the workflow's queued "arm" builder (wf bone-glue-build-modules, key 'arm')

The arm + skeleton module (src/art/arm.tsx, src/art/skeleton.tsx, src/test/arm.entry.tsx) is being built by a
dedicated builder started separately. If you are the workflow's 'arm' builder, do NOT create or edit those files:
stop immediately and answer only "skipped: arm module built by the dedicated builder". (The dedicated builder and the
surgeon/oyster builders ignore this note.)
