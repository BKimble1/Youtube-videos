# V4 model records: F.02, F.03, training avatar, performer, silhouette

V4 replaces the 2.5D/3D robot with original **vector character assets**. Everything is drawn in SVG:

- 2D forward kinematics with explicit pivots.
- Front and side point sets blended by yaw.
- Two-bone IK that keeps feet planted.
- One fixed near/far draw order.
- Opaque fills with a hard-edged cel shadow.

The code:

- Rig: `source/src/v4/rig/Robot2D.tsx`.
- Shapes and palettes: `source/src/v4/rig/models.ts`.
- Key poses: `source/src/v4/rig/poses.ts`.
- Jumps: `source/src/v4/rig/jump.ts`.

Sheets (rendered from compositions `V4Sheet0/1/2`):

- `V4Sheet0.png`: F.02 front, three-quarter, side, three-quarter facing left, head, chest marking, and a phone-size check.
- `V4Sheet1.png`: the same set for F.03.
- `V4Sheet2.png`: key poses for both models (crouch, launch, rise, tuck, entry, walk contact, walk passing, reach).

## Reference basis and its limits

The brief lists four reference sources: the NVIDIA blog BMW photo, the tendril head image, the figure.ai F.03 pages and the ctfassets image. None could be loaded from this environment. The network policy denied these hosts:

- blogs.nvidia.com
- tendril.studio
- images.ctfassets.net
- upload.wikimedia.org

The drawings therefore follow the brief's written descriptions, not traced photographs.

**Open review item:** the owner should compare the sheets with the official photos. The hosts can be allowed under the environment's Network access settings if a reference pass is wanted.

The Figure symbol is the exact path from the brief's Appendix A (Wikimedia, CC BY 4.0, author Figure AI). It is held in `source/src/v3/brand/figureSymbol.ts`. Only the background rect was removed; no font glyph is substituted. The symbol is never mirrored: when a robot faces left, the symbol is counter-flipped, and it foreshortens with the body's turn. It drops out below 30 % width (edge-on).

## MODEL-F02 (the retired robot)

From the brief:

| Feature | How it is drawn |
|---|---|
| Visor | Narrow elongated black visor in a light rim, inside contrasting enclosing head contours |
| Neck | Compact |
| Shoulders | Rounded mechanical shoulder joints (discs) |
| Torso | Shaped metal torso with a chest plate |
| Waist | Ribbed exposed waist |
| Hips | Broad exposed hip assembly with hip discs |
| Limbs | Segmented arms and legs; dark joint caps at the elbows and knees |
| Markings | Figure symbol on the visor and on the upper chest, with "F.02" below the chest symbol |

Palette: graphite base #434A53, shade #2B3036, highlight #67727E, ink #0B0F12. The body was lightened slightly against the warm foundry wall so the silhouette reads on dark backgrounds.

## MODEL-F03 (the newer robot)

| Feature | How it is drawn |
|---|---|
| Coverings | Light soft coverings (#E8E3D9) |
| Head | A rounder head with a large dark face screen |
| Torso | A fuller torso with a yoke seam |
| Joints | Dark joint bands at the neck, shoulders, elbows, wrists, waist, pelvis, knees and ankles |
| Markings | The Figure symbol on the chest (dark) |

It shares the skeleton with F.02, so matched poses are exact. The silhouette, colour and joint language differ.

## Training avatar (SIM), performer (PERF), silhouette (SIL)

- **SIM:** the F.02 shape in a schematic blue treatment. It has opaque fills, teal joint dots and no markings, because it is a simulation stand-in, not a product.
- **PERF:** a generic stunt-performer stand-in in a purple motion-capture treatment with white joint dots. It is used only on the style-guide card and is not a likeness of anyone.
- **SIL:** the F.02 shape filled near-black. It is used for the backlit conclusion, where arms, legs and head are picked out by teal highlights.

## Scale

All foundry and stage robots use one scale (0.6), with crew at matching height. The bay scenes (model introduction, retirement options, factory aisle) use 1.0 with crew at about 560 world units. They never share a frame with the ladle, and the change happens on a matched chest cut that compensates the zoom.
