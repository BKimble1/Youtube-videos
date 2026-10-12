# Credits and asset provenance — Earth Stops opening prototypes (v1 checkpoint, E-A v2, E-C)

## Picture
- All artwork is original layered SVG drawn in code for this prototype (`source/src/opening/*`): street, facades, palms, lamp posts, mug, coffee, scarf, dust, effects.
- The character is the channel's approved cast rig (`source/src/components/Character.tsx`, `cast.ts`) as carried on the Atlas Short tip (`claude/pensive-mendel-3j0xsc`, from the Video 01 v2 source). She is `clerkB` (high bun, round glasses, earring, blue cardigan, same face/skin/proportions) in street clothes: **only the work nametag was dropped**. The coral scarf is a new prop specified by the E-A brief.
- **Rig extension (this episode's copy only; the Atlas copy is untouched):** optional `legL`, `legR` (leg swing about the hip) and `footFlat` (shoes stay level with the ground) on `Pose`. Defaults reproduce the original rig exactly. Needed for planted-feet off-balance poses; see `qa/lab/PoseLab_0000.png`.
- No third-party footage, photographs, screenshots or stock art. No image generation. ChatGPT artwork and Runway were not used.

## v2 additions (E-A v2 and E-C)
- **Side/three-quarter hero** (`source/src/v2/side.tsx`): new original artwork, drawn in code, of the **same cast member** (`clerkB` from `cast.ts`, as on the Atlas tip). Carried over unchanged from the approved cast: the `Look` colours (skin `#8D5A3C`, hair `#1E1A1A`, white shirt, blue cardigan, trousers `#2E3F5C`, shoes `#3B2A22`), glasses, earring, high bun, the front rig's segment lengths (thigh+shin 158, upper arm 84, forearm 78) and the 4 px outline. Changed: **only the view** (face turned toward travel with the nose on the silhouette, near ear and glasses temple, bun at the back, foreshortened torso); the work nametag stays dropped. The approved sheets have no side view, so this view is an extrapolation awaiting the owner's identity check.
- **Props and set**: coral mug (`props.tsx`), riderless bicycle (`Bike2.tsx`), tall facades, awnings, curb, lamp posts and palms (`Street2.tsx`), dust/skid/stain/coffee effects (`Fx2.tsx`), globe with abstract landmasses (`Globe.tsx`; not a map), all original code-drawn SVG. No third-party footage, photographs, screenshots, stock art or image generation; Runway and ChatGPT artwork not used.
- The `public/refs/cast_rig_check.png` crop is used only inside the internal pose-test sheet (`PoseLab2`), as the approved reference; it does not appear in either preview.

## Sound
- v2 Foley: original numpy synthesis (`tools/foley_lib.py`, `tools/build_audio_v2.py`), fixed sha1 seeds, no samples, no stock library, no generation model. New effects over v1: spinning-planet whirr, planet-stop thump, ring bloom, riderless-bike freewheel, coffee patter.
- Every sound is **original numpy synthesis** (`tools/build_audio_opening.py`): filtered noise and sine primitives, fixed seeds, no samples, no stock library, no generation model. Same method and precedent as the Atlas Short.
- The connected ElevenLabs workspace does expose a Sound Effects node (`eleven_text_to_sound_v2`, 0.5–30 s). **It was not run** (no paid generation was authorised). Procedural Foley was used instead.
- No narration (Test Voice `kk5XaSLo2XAw0sKM98zU` was confirmed present in the workspace but not used), no music, no ambience bed.

## Fonts (bundled from npm, SIL Open Font License)
- Barlow Condensed ExtraBold: the WHAT IF tag (`@fontsource/barlow-condensed` 5.3.0). Montserrat is bundled with the toolchain for the later caption lane and is not used in this opening.

## Software
- Remotion 4.0.533, React 19.1.0, TypeScript 5.8.3 (lockfile `source/package-lock.json`; check remotion.dev/license for the channel's use), FFmpeg, Python 3 + numpy, esbuild (via the Remotion bundler) for the probe/cue tools.

## Independent reads
- The "muted viewer" reads in `qa/read_test/` and `qa/dir_test/` were produced by AI subagents given only frames, with no background about the concept. They are a proxy, **not** an audience test and not human data.
