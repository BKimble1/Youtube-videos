# Credits and asset provenance — Earth Stops E-A opening prototype

## Picture
- All artwork is original layered SVG drawn in code for this prototype (`source/src/opening/*`): street, facades, palms, lamp posts, mug, coffee, scarf, dust, effects.
- The character is the channel's approved cast rig (`source/src/components/Character.tsx`, `cast.ts`) as carried on the Atlas Short tip (`claude/pensive-mendel-3j0xsc`, from the Video 01 v2 source). She is `clerkB` (high bun, round glasses, earring, blue cardigan, same face/skin/proportions) in street clothes: **only the work nametag was dropped**. The coral scarf is a new prop specified by the E-A brief.
- **Rig extension (this episode's copy only; the Atlas copy is untouched):** optional `legL`, `legR` (leg swing about the hip) and `footFlat` (shoes stay level with the ground) on `Pose`. Defaults reproduce the original rig exactly. Needed for planted-feet off-balance poses; see `qa/lab/PoseLab_0000.png`.
- No third-party footage, photographs, screenshots or stock art. No image generation. ChatGPT artwork and Runway were not used.

## Sound
- Every sound is **original numpy synthesis** (`tools/build_audio_opening.py`): filtered noise and sine primitives, fixed seeds, no samples, no stock library, no generation model. Same method and precedent as the Atlas Short.
- The connected ElevenLabs workspace does expose a Sound Effects node (`eleven_text_to_sound_v2`, 0.5–30 s). **It was not run** (no paid generation was authorised). Procedural Foley was used instead.
- No narration (Test Voice `kk5XaSLo2XAw0sKM98zU` was confirmed present in the workspace but not used), no music, no ambience bed.

## Fonts (bundled from npm, SIL Open Font License)
- Barlow Condensed ExtraBold: the WHAT IF tag (`@fontsource/barlow-condensed` 5.3.0). Montserrat is bundled with the toolchain for the later caption lane and is not used in this opening.

## Software
- Remotion 4.0.533, React 19.1.0, TypeScript 5.8.3 (lockfile `source/package-lock.json`; check remotion.dev/license for the channel's use), FFmpeg, Python 3 + numpy, esbuild (via the Remotion bundler) for the probe/cue tools.

## Independent reads
- The "muted viewer" reads in `qa/read_test/` and `qa/dir_test/` were produced by AI subagents given only frames, with no background about the concept. They are a proxy, **not** an audience test and not human data.
