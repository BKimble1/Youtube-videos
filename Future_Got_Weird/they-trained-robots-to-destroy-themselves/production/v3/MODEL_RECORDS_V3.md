# V3 model records: F.02, F.03, training avatar, performer

The models are original cartoon adaptations. Both robots use one shared rig, `source/src/v3/robot/rig.ts`; its
joint dimensions are unchanged from V2. Each model is a separate record in `source/src/v3/robot/model.ts`
(`F02_SPEC`, `F03_SPEC`), not a recolour of one mesh.

## Reference basis and its limits

The brief's reference pages could not be loaded from this environment. The image and page hosts were blocked by the
network proxy (HTTP 403 / DNS failure):

- figure.ai
- tendril.studio
- the ctfassets images
- YouTube

The shapes therefore follow text sources and general knowledge of the two robots, not traced photographs. This is the
main open review item: **the owner should compare the sheets below against the official photos and the film.**

Text cues used (from press coverage):

| | F.02 | F.03 |
|---|---|---|
| Surface | Matte black "skin" (a change from F.01's chrome) | Soft, washable, removable textiles over multi-density foam |
| Styling | Described as sleek, "sports-car" curves and fit | Light grey/beige knit (impressions differ by photo) |
| Construction | Cables routed inside the limbs; battery in the torso | Mask-like dark face; fabric-covered hands |
| Hands | Five fingers | Fabric-covered |

## MODEL-F02 (retired robot)

- **Head:** a boxy hood with a rear cowl. The shield-shaped visor (`F02_VISOR`) is enclosed by the hood's side
  contours. The visor reflection is a half-vector highlight computed from the light and the foundry glow, so it moves
  with the lighting. There is no permanent painted slash.
- **Torso:** tapers from broad shoulders (shoulder caps up to 9.6 cm) over a pinched, exposed mechanical waist. It has
  a chest plate outline, seams on the abdomen cable runs, side pods, and a battery housing with vents on the back.
- **Limbs:** protruding actuator housings at the shoulder, hip, knee, elbow and wrist; dark articulated hands;
  chunkier feet.
- **Material:** graphite shell (#2A3036 / #4C5660 / #13171B) with darker recesses.
- **Markings:** none. No reference-supported placement of a symbol or model number on the F.02 could be verified, so
  none is drawn on the robot. Wherever F.02 needs identifying, it comes from:
  - the illustrative company sign in the product bay;
  - the lower third "F.02 / Figure's second-generation humanoid".

## MODEL-F03 (newer model)

- **Head:** rounder (rx about 7.9 cm, superellipse n 2.2), with an oval face screen.
- **Torso:** narrower shoulders over a fuller, cylindrical torso with no waist pinch.
- **Limbs:** slimmer, with thin dark joint bands at the knee, ankle, elbow and wrist; glove hands; knit seam lines.
- **Material:** light knit (#D7D2C9 / #F1EEE8 / #ACA496), dark bands.
- **Symbol:** the Figure symbol on the chest, 8.4 cm tall, centred at y 30.5 on the torso rings. This placement follows
  the commission brief's description; it could not be independently checked against photos.

## Distinguishing the two models

The two models must read differently at phone size and in silhouette. Checks on `V3SheetID.png`:

- **Head:** boxy hood with a shield visor (F.02) vs. round head with an oval screen (F.03).
- **Torso:** tapered with a waist pinch (F.02) vs. cylindrical (F.03).
- **Limbs:** actuator bumps (F.02) vs. thin bands (F.03).
- **Colour:** dark (F.02) vs. light (F.03).

## MODEL-SIM (training avatar) and MODEL-PERF

- **SIM:** exactly the F.02 geometry in a schematic treatment: translucent blue fills with contour lines. Because the
  geometry is identical, the simulation visor at 0:19.3 resolves into the finished F.02 visor in the same screen
  position, with a scan line rather than a cross-dissolve.
- **PERF:** a generic human stunt performer (purple), deliberately not a robot.

## The Figure symbol

- **Source:** Wikimedia Commons, "Figure-ai-logo.svg"
  (https://commons.wikimedia.org/wiki/File:Figure-ai-logo.svg), author Figure AI, licence CC BY 4.0.
- **Files:**
  - `brand/Figure-ai-logo.svg` is the file saved verbatim.
  - `brand/Figure-symbol_transparent.svg` is the transparent adaptation. The only change is that the black background
    rectangle was removed; the path is unchanged.
  - `brand/path_d.txt` holds the path data.
- **In code:** `source/src/v3/brand/figureSymbol.ts` holds the same path (`PATH_D`). `SYMBOL_POLY` samples it into a
  146-point outline for projection. It is not a font glyph.
- **Projection:**
  - On the F.03 chest, the symbol is mapped by arc length around the torso rings (`symbol` decal). Its +x maps to the
    robot's left, which is the viewer's right, so it reads exactly like the file.
  - It is clipped to the visible side and faded in near the silhouette, so it never floats off the body.
  - On walls (`symbolOnWall`), world +x is kept, so the symbol is never mirrored. Height is set directly and width
    follows the path's own 0.5 aspect, so it is never stretched.
- **Use:**
  - The symbol, the wordmark and the model number are kept separate. No combined lock-up is drawn; there is no
    invented wordmark.
  - The symbol appears in two places: on the illustrative sign in the product bay, and on the F.03 chest.
- **Credit:** given in `CREDITS_V3.md`. It is a trademark of Figure AI; its use does not imply endorsement.

## Comparison sheets

| File | Content |
|---|---|
| `V3SheetF02.png` | F.02: front, three-quarter, side, back, head, head front, chest; text cues |
| `V3SheetF03.png` | F.03: the same views plus the chest emblem |
| `V3SheetID.png` | Silhouettes side by side; phone-size thumbnails; avatar; performer; the symbol flat (black on white and white on black) and projected on the F.03 chest, front and at 40° |

The reference column the brief asked for (photos beside the design) could not be filled because the images were not
reachable. The sheets list the text cues in its place.
