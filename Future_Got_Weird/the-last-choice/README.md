# Future Got Weird: THE LAST CHOICE — R2, "the Weird Crew's last battle"

A dialogue-free animated short, about 4:18.

New York falls and a black title card follows. The Director climbs out of the rubble and faces a machine army alone. The Crew join him one by one, and about two minutes of combat follow:
- **First breach:** the Crew break the line.
- **Human ingenuity:** a light decoy on smoke, a tether anchored round a girder, a catch, a drone shield.
- **The system adapts:** a better drone angle, a line re-formed into an arc, the decoy ignored, the flank cut off, the allied drone hunted down, a second heavy walker.
- **The last stand breaks:** the Director takes the blow meant for a teammate.

He dies by the van. A teammate turns on the radio, and one continuous rising camera move carries from his face, past the radio, out over the fallen city. Scrolling credits follow.

R2 replaces R1, the refuge and evacuation film. There is no hospital, refuge, glass, escort or staircase plot.

**Status:** a review cut. It is **private and not published.** The music comes from recordings the owner supplied. **Supplying them does not establish publication clearance, and nothing here represents that rights are cleared.** The music, the mixes and every render are Git-ignored. The `film-audio-v1` release that carries the recordings is attached to this public repository, so anyone can download it.

| What | Where |
|---|---|
| **Review film (1080p)** | `exports/FGW_TheLastChoice_R2_REVIEW_1080p.mp4` (see "What was checked" for its measured properties). Git-ignored because it contains the music. |
| Editable source | `source/` (Remotion 4, React, TypeScript, SVG). Compositions `LastChoiceR2` (1920×1080) and `LastChoiceR2-4K` (3840×2160, the same component; everything is vector). |
| Single timeline | `source/src/r2/timing.ts`: music segments, music anchors `M`, sections. |
| Sound sheet | `source/src/r2/sound.ts`: beds, perspective, radio automation, global cues. Section cues live in `source/src/r2/shots/<SEC>/cues.ts`. |
| Shots | `source/src/r2/shots/{A,B,C,D1,D2,D3,D4,EF,G}/`: 84 shots tiling 0–258 s. The registry is `source/src/r2/film/registry.ts`; the master is `source/src/r2/film/MainR2.tsx`. |
| Story, staging, brief | `production/R2_BEAT_SHEET.md`, `production/R2_SHOT_LIST.md` (the plan; the as-built cut times are in each section's `index.tsx`), `production/R2_SHOT_BRIEF.md` |
| Music cue sheet | `production/MUSIC_CUE_SHEET_R2.md`. The vocal onset comes from a Scribe transcript, `production/music/longtime_scribe_words.json`. Edit candidates are in `production/music/longtime_edit_candidates.json`. |
| Sound effects | `audio/r2/sfx_raw/` (generated takes, prompts and manifest) and `audio/R2_SFX_CHOICES.md`. R1's library is in `audio/sfx_raw/`. |
| QA | Per-section contact sheets are in `qa/r2/shots/<SEC>/`. Kit sheets (rig, machines, effects, set) are in `qa/r2/{rig,mech,fx,set}/`. |
| R1 (preserved) | Source at commit `2a8e9aa` (local tag `the-last-choice-R1`). The R1 compositions `LastChoice` / `LastChoice4K` remain in `source/src/Root.tsx`. R1's notes are in `production/R1_README.md`. |

## Render it

```
cd Future_Got_Weird/the-last-choice
bash tools/fetch_music.sh                       # recordings (release film-audio-v1), SHA-256 checked
python3 tools/r2/build_music_r2.py              # audio/r2/music/{portals,llt_full,llt_radio}.wav + edit.json
bash tools/r2/render_chunks.sh exports/FGW_TheLastChoice_R2_REVIEW_1080p.mp4                 # 1080p
bash tools/r2/render_chunks.sh exports/FGW_TheLastChoice_R2_MASTER_4K.mp4 LastChoiceR2-4K     # 4K (not rendered yet)
```

`render_chunks.sh` does four things:
1. Writes `audio/r2/timing.json` from the source and mixes it (`tools/r2/mix_r2.py`).
2. Bundles the source once, so the render uses a fixed snapshot.
3. Renders the film in 1,000-frame chunks. A failed chunk is re-rendered alone and finished chunks are kept. Each frame may take up to 5 minutes, because the widest frames are heavy under load.
4. Joins the chunks and adds the mix as AAC 320 kb/s.

A 1080p render takes about 1.5 hours on 4 cores.

To inspect stills: `cd source && COMP=LastChoiceR2 SCALE=0.5 node stills.mjs <dir> t:<seconds> …`

## How R2 is built

- **A real 3D set, drawn as illustration** (`source/src/r2/engine/`): a perspective camera; meshes with near-plane clipping and back-face culling; painter's sorting by view depth; cel lighting in three tones with banded fire spill; fog and ground haze; ink drawn only on silhouette, crease and boundary edges.
  - People are 2D rig sprites placed in the 3D world by their feet. Their scale, yaw and pitch come from the camera, and they are depth-sorted with the set.
- **One battlefield** (`source/src/r2/world/`):
  - From west to east: the collapsed building, the rubble ridge, the van with the radio, the avenue, the crater (a 3.7 m bowl) between the fallen girder and the burning south facade, the cross streets, and the skyline with the tower that fails in the opening.
  - Light comes from a low western sun with local fires. Smoke drifts north-east.
  - Every camera is a position and a target in this world (metres), so geography holds across cuts.
- **The Crew rig** (`source/src/r2/rig/`): rebuilt from the approved looks. Model and pose sheets are in `qa/r2/rig/`.
  - Views: front, three-quarter, profile, rear three-quarter and back.
  - Poses: crouch, kneel, braced, fall, injured.
  - Hand shapes: open, closed, grip, brace, reach, point, pinch.
  - Contact: hands and feet are solved to world points (palms planted on rubble, a hand on a shoulder, a catch that supports the faller's back, tools on machine parts). Walking and running plant the feet on the terrain.
  - Damage persists by film time (`dmgR2`, `toolsR2`, `limpR2`).
- **The machines** (`source/src/r2/mech/`):
  - Combat units: 2.2 m.
  - Drones.
  - Heavies: 6 m walkers with a ram and a launcher.
  - Formations: ranks, columns that halt as one, re-forming from a line to an arc with a ripple, and replacements. They are drawn at three levels of detail by distance.
  - Damage tears plates off, detaches limbs, snaps cables and leaks fluid. Wrecks persist.
- **Equipment and effects** (`source/src/r2/fx/`): the barrier plate (intact → dented → cracked → shattered), the magnetic tether (fire, bite, wrap round an anchor, reel, snap), the decoy projector (a beam and light figures carried on smoke), the allied drone, flares, smoke canisters, impacts and the launcher blast.
- **Continuity** (`source/src/r2/film/continuity.tsx`): every machine a section downs is registered and drawn in later shots, through to the final pullback. The handover frames between sections (D1→D2→D3→D4→E) were checked numerically: Crew positions within about 1–2 cm, machines identical.

## Asset provenance

| Asset | Source |
|---|---|
| **Cast** | The approved Weird Crew looks from `they-trained-robots-to-destroy-themselves/source/src/components/cast.ts`. The Director is `clerkC`, the director in the robots episode's V6 post. The R2 rig is new for this film. Nothing on screen names anyone. |
| **Set, machines, effects, props** | Drawn in code for this film. There are no external images and no real logos. |
| **Sound effects** | ElevenLabs `eleven_text_to_sound_v2` takes generated for this film on the channel's account (R2 flow `NZsNryXtOG1YNHRfL1ls`, prompts in `audio/r2/sfx_raw/manifest.json`), plus R1's library from flow `z1if6RWnmC2gvHiGpM0u`. Takes were chosen by objective rules (`tools/r2/prep_sfx_r2.py`), not by ear. |
| **Music** | Owner-supplied Spotify screen recordings (release `film-audio-v1`) of "Portals" (Alan Silvestri) and "It's Been a Long, Long Time" (Jule Styne, Sammy Cahn; Harry James and His Orchestra with Kitty Kallen). **Not cleared.** The credit crawl names only these and the tools used. |
| **Vocal onset** | Located by an ElevenLabs Scribe transcript of the extracted recording (word timestamps), not estimated. |
| **Fonts** | Fredoka and Nunito (`@fontsource`, OFL). |

## What was checked, and how

(The measured properties of the delivered file are added here after the final render.)

- **Not done: I cannot play video or listen in this environment.** Nobody has watched this film in real time or heard it here.
  - Motion was judged from consecutive-frame contact sheets around every contact, plus numerical checks of positions across cuts.
  - Audio was judged from waveforms, onsets, a transcript and level measurements.
- **The Avengers staging reference could not be studied.** The reference pages were blocked from this environment (DNS failure), and no reference clip was watched. Nothing from that film is used except the owner-supplied "Portals" recording.

## Changes from R1

- **Story:** rebuilt as the last battle (see the top of this file). The refuge, hospital, escort, glass and staircase plot is gone.
- **Music:**
  - Portals plays in full. R1's 61.4 s cut is restored, and the only material unused is the first 1.3 s of decaying tail.
  - "It's Been a Long, Long Time" starts only after his death: the opening trumpet phrase, one edit, then the real vocal entrance at 3:37.7.
  - It goes from radio speaker to full range as the camera rises. Each piece of music is on its own track. See the cue sheet.
- **Picture:**
  - A perspective 3D set with three depth scales and landmarks, replacing R1's flat stages.
  - A rebuilt rig with views, contact and hands, replacing R1's cut-out-like movement.
  - Machine formations at army scale, with damage and wrecks that persist.
- **Process:**
  - Three internal proofs were built and reviewed before scaling up: the Director rising on the rubble, a full Crew-vs-machine exchange, and the death → radio → pullback handoff.
  - The rig, camera and kit were fixed from those proofs before the other sections were built: rear hair as one mass, a terrain bug that had flattened the crater, mid-distance machine shading, sprite anchors for close contacts, the decoy's light look, and the knob pinch.

## Unresolved issues (known defects and limits)

The list is in the delivery note for this review and will be kept here once the final render is checked.
