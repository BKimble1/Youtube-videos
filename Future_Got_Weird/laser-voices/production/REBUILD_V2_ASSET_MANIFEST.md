# Laser Voices: Rebuild V2 asset-source manifest

Every character, and the renderer that draws them, comes from the established Weird Crew system in this repository.
Nothing in Rebuild V1 (`source/src/rb/`) is used by V2: not its characters, its face rig, its backgrounds or its
emitter. The narration, its timing (`source/src/data/timeline.json`) and the caption treatment (`v3/Captions3`) are
unchanged.

## 1. Character renderer: the Weird Crew rig (copied, then extended)

Source: commit `2ed15b81` (`origin/claude/inspiring-clarke-meyznm`), `Future_Got_Weird/moth-silk-web-shooter/source/src/rig/`.
That rig is itself the Invisibility Shield V6 rig (`invisibility-shield/source/src/v6/Crew6.tsx`, `cast6.ts`).

| V2 file (`source/src/c2/rig/`) | Source blob | State in V2 |
|---|---|---|
| `geo.ts` (cards, projection, IK) | `94fe3a91a4` | verbatim (same blob) |
| `draw.tsx` (`lookAt`, `lerpCam`) | `8aa5765c96` | verbatim |
| `poses.ts` (stand, FACES, deep pose mixer, `keyed`) | `e140f37aad` | verbatim |
| `steps.ts` (foot plants, `footAt`) | `2743933a7f` | verbatim |
| `path.ts` | `b2980535fb` | verbatim |
| `cast.ts` (Look4, Body4, PERSON, BODY_P, CREW_C) | `d6fd58cfd5` | extended, see below |
| `Crew.tsx` (Crew4, Head4, hands) | `0183b283bf` | extended, see below |
| `../lib.ts` | `2611f598b6` | timeline import path only |

Each extension is marked `laser voices` in the code. They keep the Crew look: flat fills, dark ink outlines, an oval
head, white-sclera eyes with pupils, ink brows, one cel shade.

- **Continuous facing.** In the source, the bob's side widths, the nose hook and the pupils switched on the sign of
  the face's sideways component. That switch caused a one-frame jump as a head crossed the front view. V2 blends them
  continuously over ±0.22 of the face's sideways component.
- **Eyes never fade.**
  - An eye's width now foreshortens with the turn (`rx = 12 · wd · fsE`). Its height never changes.
  - An eye is on or off by geometry only (behind the head's silhouette or not). It never has partial opacity, so there
    are no ghost eyes.
- **Blinks are lids.** A skin-coloured lid slides down over the white and back up. Closed reads as skin plus an ink
  lash line. The eye does not squash.
- **Ears narrow smoothly** as they turn away, with no pop at a threshold.
- **`earCU` detail** for the ear close-up: the fold of the rim, the dark canal opening, the tragus line, and no earbud.
- **New costume pieces:**
  - `hair: 'bun'` (the operator's top bun, drawn in front of or behind the head by its geometry);
  - `visor`, `nametag` and `earring`.

## 2. Cast: three members of the channel's original Weird Crew (Video 01)

Source of the cast list: `can-you-hurt-something-that-isnt-alive/source/src/components/cast.ts` (blob `c8e49b7665`).
Values are in `source/src/c2/castLV.ts`.

| Role | Crew member | Look |
|---|---|---|
| Listener | **person**: the canonical PERSON (the lead of Invisibility Shield V6 and Real Web Fluid V6) | PERSON exactly as in `rig/cast.ts`, body BODY_P |
| Operator | **clerkB** | Video 01 colours (skin `#8D5A3C`, black hair, blue cardigan over a white shirt, navy trousers, glasses). New costume: hair in a bun, the rig's coat with a white inner placket (`coat.inner`), a name tag, a saffron earring. Body BODY_P. |
| Passerby | **clerkA** | Video 01 colours (skin `#F2C9A8`, dark crop, cream shirt, teal vest, slate trousers). New costume: teal visor, name tag. Body BODY_P, a little taller (hip 182, spine 116). |

Consistency sheets, rendered with the film's renderer: `qa/c2/sheets/`.
- `*_turnaround_expressions.png`: front, 3/4, profile and the mirrored views; neutral, surprised and eyes-closed busts;
  listening (the hand placed from the ear, as in the film); walking.
- `*_headturn.png`: one head turning from −90° to +90° in 15° steps.

## 3. Environments, props and science art (new for V2, Crew corridor method)

All of the room is drawn with the Invisibility Shield V4–V6 corridor method: flat, ink-outlined polygons placed in
metres in one world (`source/src/c2/world.ts`) and projected by each shot's pinhole camera. Distance haze is done by
colour mixing, and ink thins with distance. The helpers are `source/src/c2/art/d3.tsx` (polygon, segment, box,
cylinder, painter's sort).

- **`art/Lab.tsx`, the acoustics lab at golden hour.**
  - The back wall has a large window. The city outside is on far planes, so it parallaxes: sky, low sun, two layers of
    rooftops with lit windows, a water tower, a mast with a blinking light, and slow clouds.
  - Sun patches fall on the floor.
  - Cream walls carry a teal dado and saffron trim.
  - The sliding door has an exit light, and the clock above it keeps frame time.
  - Optical table: posts, lenses, mirrors and a power meter.
  - Instrument shelf: an oscilloscope with a live trace, spools and binders.
  - Wall dressing: a cork board, an ear poster, a glass equipment cabinet, shelving with cases, and a whiteboard.
  - Overhead: a pipe run, ceiling panels, a cable tray, and pendant lamps with warm floor pools.
  - Foreground props: a stool, a plant, a cable reel and a toolbox.
- **The demonstration lane, also in `art/Lab.tsx`.** Saffron tape runs from the emitter's lens to her mark, 2.44 m
  (8 ft). Foot ticks light one by one on "eight feet".
- **`art/Emitter.tsx`.**
  - The emitter sits on a tripod. Its housing has a teal stripe and cooling fins, a rear control block with a dial, and
    an exit lens.
  - The hood is hinged. Opening it shows the optical train: diode with heat sink, collimating lens, the modulator (fed
    by the voice wires), and a wedge prism in a toothed ring spun by a belt motor.
  - The cable runs to a cart carrying a waveform monitor and a signal box.
  - The beam is a pale coral path with travelling packets. While someone is in the way it ends at the near side of
    their head.
- **Props in hand** (`Scene.tsx`, `story.ts`): the passerby's phone and coffee cup, and the operator's microphone.
- **`Micro.tsx`, the molecular cutaway (flat Crew style).**
  - The air outside her left ear: water molecules (blue O, white H) among nitrogen and oxygen pairs.
  - A top-down cut through her head at canal height: skin, hair, outer-ear flap, tragus, the canal, eardrum, the
    little bones and the cochlea.
  - Molecule positions come from a fixed hash, so every render is identical.

## 4. Audio

`tools/make_audio_c2.py` (construction as Rebuild V1):
- the approved narration file, unedited, at the same gain from sample 0 (SHA-256 in `audio/mix/mix_measure_c2.json`);
- the V1 music stem;
- synthesised room tone and effects;
- the nonverbal whisper.

The cues are read from the picture's own geometry by `tools/export_cues_c2.ts`, written to `audio/cues_c2.json`:
- block and clear frames;
- every footfall;
- shot cuts.

## 5. Not used

- RB1 (`source/src/rb/*`), V1–V6 scene code and every older background.
- No stock art, no traced images, no generated images.
