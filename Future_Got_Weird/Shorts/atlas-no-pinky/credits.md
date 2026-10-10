# Credits and asset provenance

## Picture
- All artwork is original layered SVG drawn in code for this Short: the robot hand rig (`source/src/hand`), props, shot-local stages (`source/src/v2`), labels. V2 (this version) replaced V1's single permanent workshop with five shot-local stages; V1 source remains in `source/src/film`.
- The checker is the channel's approved cast rig (`source/src/components/Character.tsx`, `cast.ts`, from the established Video 01 v2 source). One change: the pencil is now drawn behind the right ear (it previously sat on top of the hair). Identity (gray bob, round glasses, coral cardigan) is unchanged.
- No third-party footage, photographs or company screenshots. Boston Dynamics material was used only as research reference; attribution appears on screen.

## Voice
- ElevenLabs **Test Voice** (voice_id `kk5XaSLo2XAw0sKM98zU`, owner's generated voice), model `eleven_v4`, via the connected account. Alignment: ElevenLabs Scribe (`eleven_scribe_v1`). Details: `audio/NARRATION_PROVENANCE.md`.

## Sound
- Sound effects and the 126 BPM music bed are **original synthesis** from `tools/build_audio.py` (V1) and `tools/build_audio_v2.py` (V2) (numpy; noise and sine primitives). No samples, stock music, or music-generation model were used. Runway was not used.

## Fonts (bundled locally from npm, SIL Open Font License)
- Fredoka (display), Nunito (body/captions), Source Serif 4 (loaded, unused in this Short), JetBrains Mono (the `13 DOF` tag): `@fontsource*` 5.3.0.

## Software
- Remotion 4.0.533 (https://remotion.dev/license — check that the channel's use fits its licence terms), React 19.1.0, TypeScript 5.8.3, FFmpeg 6.1 for audio measurement, Python 3 + numpy for sound.

## V2 additions
- No new third-party assets, no new generations. V2 reuses the V1 ElevenLabs narration and Scribe alignment unchanged. Runway was not used.
- Evidence statements follow the owner's V2 audit; see `claim_ledger.md`.
