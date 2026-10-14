# Asset and provenance manifest: The Death Clock

Every element of the picture and the sound, where it came from, and whether it is new for this Short or reused.

## Picture

| Element | Source | New / reused |
|---|---|---|
| Characters (man, dog), street, houses, trees, band/watch, drone, map, arm cross-section, vessel, body map, heart, organs | Drawn in code as SVG in `source/src/art/*.tsx`: lineless shapes with gradient shading, one fixed upper-left key light, white specular shapes and contact shadows. No image files, no photos, no AI image or video generation. | New for this Short |
| Animation, camera, shot timing | `source/src/shots/*.tsx`, `source/src/lib/*.ts`, keyed to the narration's measured word times | New |
| Device UI (VITAL SCAN, CALCULATING, countdown, HELP ALERT SENT, STABILIZING, "Life Expectancy: 42 Years", glitch) | `source/src/art/Watch.tsx` with states from `source/src/lib/device.ts`. The countdown is computed from a single origin (00:02:14 at the `calculates` word) and never reaches zero. | New |
| Captions, FUTURE CONCEPT label, TIME COMPRESSED tag | `source/src/shots/Overlay.tsx` | New |
| Caption font | Montserrat ExtraBold (800), SIL Open Font License, bundled via `@fontsource/montserrat` 5.3.0 | Open-licensed |
| UI font | Barlow Condensed 600/700/800, SIL Open Font License, bundled via `@fontsource/barlow-condensed` 5.3.0 | Open-licensed |
| Render pipeline | Remotion 4.0.533, React 19.1.0, TypeScript 5.8.3. The `package.json` and lockfile are taken from the earlier Future Got Weird Short so the versions are known to work. Some packages listed there (Fredoka, Nunito, Source Serif 4, JetBrains Mono, js-tiktoken, zod) are unused here. | Reused toolchain |
| Runway | **Not used.** The deterministic Remotion build covered every shot, so no generated footage was needed and none is in the film. | n/a |

Remotion is source-available under its own licence. Using it commercially may require a company licence depending on the owner's organisation size, and that has not been checked here.

## Narration

| Item | Detail |
|---|---|
| Text | `script/narration_locked.json`: the five locked blocks, verbatim. The TTS input added three inline direction tags; a script check stripped them and confirmed 5/5 blocks identical. |
| Voice | ElevenLabs **Test Voice**, `voice_id kk5XaSLo2XAw0sKM98zU`, model `eleven_v4`, resolved from the account's voice list (not from memory). |
| ElevenLabs flow | `m2Pyn9dxqMB3w9eeZby3` |
| Selected take | T2, generation `K4mDnwmDmX1uUihT1Bt6` (34.88 s raw) |
| Edit | Pause lengthening only, using digital silence inserted at the quietest 20 ms of existing gaps. No cutting, stretching, pitch change or EQ of words. The mix applies a mild compressor (2.5:1, threshold −20 dB, about 1.6 dB mean gain reduction during speech) and the shared limiter. The delivered `Narration_Selected_48k.wav` is the edit before compression. |
| Verification | Blind `eleven_scribe_v1` transcription of T2 returned all 98 words in order. |
| Full detail | `audio/narration/NARRATION_PROVENANCE.md`, `VOICE_EDIT_LOG.json` |

## Sound effects

**Generated with ElevenLabs** `eleven_text_to_sound_v2` on flow `m2Pyn9dxqMB3w9eeZby3` (20 files in `audio/sfx/gen/`; the generation ID is in each filename). The ones that reach the mix are:

| Cue | File (generation ID) | Prompt (abridged) |
|---|---|---|
| breath catch at 0.0 s | `breath_1_i0TXGqFeHqkEpFKKUdQf` | A man's sharp pained breath catch and strained exhale, close, dry outdoors |
| strained exhale | `breath_4_y9jk69O2KtRNTZPOiz8T` | (same prompt, variation 4) |
| dog whine | `dog_3_JB8U4frHpRyLaM7eJciP` | One short soft worried whine from a medium-sized dog, no barking |
| body fall | `fall_4_9ukhH99iVXpBejeIoCqn` | An adult collapsing onto a grass lawn: knees, soft heavy thud, clothing rustle |
| rotor texture | `drone_1_f7S5LI3HdTlvGoa1G6Fp` | A small quadcopter drone approaching and slowing to hover, no sirens |
| recovery breathing | `recover_breath_1_tFCDclpcmymiy0MdhNUi`, `recover_breath_3_u0kMmd94TJjSZjKOuzAH` | A man breathing heavily and unevenly as he recovers, slowly calming |

The other 14 variations were generated and measured (`audio/sfx/gen/SFX_ANALYSIS.json`) but are not in the mix. The `recover_breath_*` files were first saved under a wrong name and were renamed by generation ID. Spend was about 333 credits (20 × 16.665).

**Procedural (synthesised in `tools/build_audio.py` with numpy, seeded per cue, no samples):** heartbeats, rustle, knee thud, wrist whoosh, UI blips, edge warble, glass dive, needle clicks, bead ticks, blood flow, scans, decay/organ flags, fibrillation, signal zip, alarm, clock ticks, transmit, sparkle, pin drop, data, dispatch, rotor lift/approach/hover, injection click, confirm, green chime, glitch, and the whole music bed (pads plus pulse, following `musicPlan()` in `source/src/lib/sound.ts`).

No library music, no third-party samples, and no material taken from other videos.

## Licence notes that were not verified here
- Whether the owner's ElevenLabs plan covers commercial use of the Test Voice output and the generated sound effects.
- Remotion licence tier for the owner's organisation.

## Credits spent (tool-reported)
ElevenLabs: audition about 504, full take about 2,696, blind Scribe 191.84, SFX about 333. Total about 3,725. Runway: 0.
