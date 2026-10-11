# Credits and asset provenance

## Picture
- All artwork is original layered SVG drawn in code for this Short: the robot hand rig (`source/src/hand`), props, shot-local stages (`source/src/v2`, `v3`, `v4`), labels. V1's source remains in `source/src/film`.
- The checker is the channel's approved cast rig (`source/src/components/Character.tsx`, `cast.ts`, from the established Video 01 v2 source), pencil behind the right ear. Identity (gray bob, round glasses, coral cardigan) is unchanged.
- No third-party footage, photographs or company screenshots. Boston Dynamics material was used only as research reference; the company is named once on screen, in the opener kicker.

## Voice
- ElevenLabs **Test Voice** (voice_id `kk5XaSLo2XAw0sKM98zU`, owner's generated voice), model `eleven_v4`, via the connected account. Alignment: ElevenLabs Scribe (`eleven_scribe_v1`). Details: `audio/NARRATION_PROVENANCE.md`. **V4 reuses the same recording; the default cut is a 1.05× pitch-preserving time compression of it (`tools/retime_v4.py`), the original-pace cut uses it unchanged. No new generation.**

## Sound
- Sound effects and the music bed are **original synthesis** from `tools/build_audio.py` (V1), `build_audio_v2.py`, `build_audio_v3.py` and `build_audio_v4.py` (numpy; noise and sine primitives). No samples, stock music, or music-generation model were used. Runway was not used.

## Fonts (bundled locally from npm, SIL Open Font License)
- V4 picture: **Montserrat** 800 (captions), **Barlow Condensed** 800 (headlines and numbers), **JetBrains Mono** (receipt rows). `@fontsource/*` 5.3.0. Fredoka, Nunito and Source Serif 4 remain bundled for the older versions (V1–V3).

## Software
- Remotion 4.0.533 (https://remotion.dev/license — check that the channel's use fits its licence terms), React 19.1.0, TypeScript 5.8.3, FFmpeg for retiming and measurement, Python 3 + numpy (+ fontTools for planning caption widths) for sound and cue tables.

## Version notes
- V2/V3: no new third-party assets and no new generations (V3 added the hand/object contact solver, front-view opener and circular music bed).
- V4: type system (Montserrat / Barlow Condensed), removal of the persistent source/tag bars, enlarged shot compositions, short edge-wipe transitions, retimed narration option, rebuilt caption timing and music bed. The owner's reassessment prompts are saved in `handoff/` (`V3_Reassessment_and_Prompt.md`, `V4_Final_Presentation_and_Pacing_Prompt.md`).
