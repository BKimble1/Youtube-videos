# Asset and provenance manifest: The Death Clock

## V3 (current)

What changed for V3, and where every V3 element comes from. The V2 and V1 manifests follow unchanged below.

| Element | Source | New / reused |
|---|---|---|
| The man (rig construction) | `source/src/lib/limb.tsx` (one continuous contour per arm and leg, blended segment shading, a crease only on a bent joint), `lib/ink.tsx` (joint fades; one outer silhouette group per figure), `art/Man.tsx` (sleeve that grows out of the shoulder and ends in a hem, far forearm in front of the chest only where it crosses it, near thigh under the tee's hem, planted-foot IK, arms about 13% longer so a hand can reach the grass), `art/Hand.tsx` (palm and fingers join the forearm's contour), `art/Head.tsx` (ear shape inside the head's contour, smaller sweat, pain expressions without a grin) | Rebuilt from V2 |
| The band | `art/Device.tsx` (V2 design); the elbow sphere is gone (the arm is one limb from the shoulder), and the screen layout turns upright in portrait when the arm is vertical | Reused, changed |
| Inside the arm | `art/Interior.tsx` (V2 section, port, stream, vessel, heart) with a moving cut edge added | Reused, changed |
| Torso cutaway | `art/Cutaway.tsx`: an oval window on the chest with a rim, a far wall showing the cut layers, parallax for the deep layers, one organ and the V2 heart | New |
| Hospital launch bay, map, flyover, trunk wipe | `shots/Dispatch.tsx`: the building, EMERGENCY parapet sign, glass stairwell with a staff member, equipment cabinet, oxygen cylinders, drone dock with beacon ring and cradle latch, ambulance bay; a top-down map; a flyover with parallax; a foreground tree-trunk wipe. Drawn in code. The drone is V1/V2's drone art | New (drone reused) |
| Animation, camera, timing | `shots/Opening.tsx`, `Journey3.tsx`, `Dispatch.tsx`, `Aftermath3.tsx`, `Film.tsx`, keyed to the V3 word times through `lib/timeline3.ts`; device states in `lib/device3.ts` | New |
| Captions, opening cue | `shots/Overlay.tsx` (V2 design), V3 phrase chunks in `lib/captions.ts` | Reused design, new chunks |
| Narration | ElevenLabs Test Voice (`kk5XaSLo2XAw0sKM98zU`), `eleven_v4`, flow `m2Pyn9dxqMB3w9eeZby3`; selected take C4, generation `pWhwT8eZU9ybLzm60jKR`; blind Scribe of three takes; silence-only gap edit. Full detail in `audio/narration_v3/NARRATION_PROVENANCE.md` | New take |
| Generated sound effects | No new generations; the same V1 `eleven_text_to_sound_v2` clips as V2 (`audio/sfx/gen/`) | Reused |
| Procedural sound and music | `tools/build_audio_v3.py`: V2's generators plus garden air, the band's vibration motor and a single warning transient; a cyclic music bed (oscillators on the 1/45 Hz grid, 75 beats at 100 bpm), effects that wrap through the loop point | New |
| Runway | Not used | n/a |

V3 credits spent (tool-reported, ElevenLabs): auditions 12 takes about 3,896; full takes 8 about 6,939; blind Scribe of three takes about 779. Total about 11,614. No other paid services.

---

## V2

What changed for V2, and where every V2 element comes from. The V1 manifest follows unchanged below.

| Element | Source | New / reused |
|---|---|---|
| The man, dog, street | The same rig and art as V1 (the Weird Crew's guesser, re-drawn as SVG), with outlines reduced to thin selective edges (`lib/ink.tsx` `OUTLINE_K = 0.36`) | Reused, refinished |
| The band | `source/src/art/Device.tsx`: a new parametric 3D wrist (strap ring, slim cobalt case, dark glass, bevel, side control) drawn in code; screen UI drawn in the compositor | New |
| Inside the arm and chest | `source/src/art/Interior.tsx`: section layers, port module, sensor stream, vessel with near/far walls and flow, wall cells, x-ray of the arm and chest, one organ, a new heart (`Heart2`). Red cells reuse V1's `RBC` drawing. Drawn in code from gradient primitives; no image files | New |
| Map, drone, rooftop pad | V1's map grid, drone and rooftop art, re-staged in `shots/Rescue.tsx` (his figure added to the map, a ring-wipe transition, a data card docking) | Reused, re-staged |
| Animation, camera, timing | `source/src/shots/Journey.tsx`, `Rescue.tsx`, `Aftermath.tsx`, `Scene.tsx`, keyed to the V2 word times through `lib/timeline.ts` | New |
| Captions, opening cue | `source/src/shots/Overlay.tsx`; Fredoka (variable, now at weight 700) and Barlow Condensed, both SIL OFL via @fontsource | New layout, same fonts |
| Narration | ElevenLabs Test Voice (`kk5XaSLo2XAw0sKM98zU`), `eleven_v4`, flow `m2Pyn9dxqMB3w9eeZby3`; selected take V4, generation `R4IDiVOYhLW115iOIYDT`; blind Scribe check of all 98 words; pause-only edit. Full detail in `audio/narration_v2/NARRATION_PROVENANCE.md` | New take |
| Generated sound effects | No new generations. Reused from V1's ElevenLabs `eleven_text_to_sound_v2` set in `audio/sfx/gen/`: `breath_1_i0TXGqFeHqkEpFKKUdQf`, `breath_2_C4k8MIkY48irqu90gUzx` (newly used, eyes opening), `breath_4_y9jk69O2KtRNTZPOiz8T`, `dog_3_JB8U4frHpRyLaM7eJciP`, `fall_4_9ukhH99iVXpBejeIoCqn`, `drone_1_f7S5LI3HdTlvGoa1G6Fp`, `recover_breath_1_tFCDclpcmymiy0MdhNUi`, `recover_breath_3_u0kMmd94TJjSZjKOuzAH` | Reused |
| Procedural sound and music | `tools/build_audio_v2.py` (numpy, seeded per cue): V1's generators plus new scuff, hand pat, swish, servo, close pass, signal ring, receive, treatment wave, a drone pass with Doppler and moving pan, and a new low, curious music bed with a forward pulse | New |
| Runway | Not used | n/a |

V2 credits spent (tool-reported, ElevenLabs): narration audition about 2,616, full take about 2,688, blind Scribe 197. Total about 5,500. No other paid services.

---

## V1


Every element of the picture and the sound, where it came from, and whether it is new for this Short or reused.

## Picture

| Element | Source | New / reused |
|---|---|---|
| The man | The Weird Crew's **guesser** from the channel's existing cast. His identity (colours, spiky hair, face construction, cheeks, ink outline) follows Video 01 V2's `components/cast.ts` and `Character.tsx` (branch `claude/new-session-96c7w8`) and the approved cast sheet `cast_rig_check.png` (Video 02 packet, branch `claude/new-session-h21vtg`). He is re-drawn as SVG in this project's posable 3/4 rig (`source/src/art/Man.tsx`, `Head.tsx`, `Hand.tsx`), with dimensional gradients, glossy highlights and extra expressions added. No raster art from those branches is in the film. | Reused identity, new drawing |
| Dog, street, houses, trees, band/watch, drone, map, arm cross-section, vessel, body map, heart, organs | Drawn in code as SVG in `source/src/art/*.tsx`: gradient shading from one fixed upper-left key light, white highlights and contact shadows. Crew ink contours (`lib/ink.tsx`) go on the dog, props and set pieces. No image files, no photos, and no AI image or video generation. | New for this Short |
| Animation, camera, shot timing | `source/src/shots/*.tsx`, `source/src/lib/*.ts`, keyed to the narration's measured word times | New |
| Device UI (VITAL SCAN, CALCULATING, countdown, HELP ALERT SENT, STABILIZING, "Life Expectancy: 42 Years", glitch) | `source/src/art/Watch.tsx` with states from `source/src/lib/device.ts`. The countdown is computed from a single origin (00:02:14 at the `calculates` word) and never reaches zero. | New |
| Captions, FUTURE CONCEPT label, TIME COMPRESSED tag | `source/src/shots/Overlay.tsx` | New |
| Caption and label font | Fredoka (variable, set at 600), the channel's display face; SIL Open Font License, bundled via `@fontsource-variable/fredoka` 5.3.0 | Open-licensed, channel font |
| UI font | Barlow Condensed 600/700/800, SIL Open Font License, bundled via `@fontsource/barlow-condensed` 5.3.0 | Open-licensed |
| Render pipeline | Remotion 4.0.533, React 19.1.0, TypeScript 5.8.3. The `package.json` and lockfile are taken from the earlier Future Got Weird Short so the versions are known to work. Some packages listed there (Montserrat, Nunito, Source Serif 4, JetBrains Mono, js-tiktoken, zod) are unused here. | Reused toolchain |
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
