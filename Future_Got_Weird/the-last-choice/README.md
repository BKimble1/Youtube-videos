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
| **Review film (1080p)** | `exports/FGW_TheLastChoice_R2_REVIEW_1080p.mp4`: 1920×1080, 30 fps, 7,740 frames, **4:18.00**, H.264 CRF 18 bt709 with AAC 320 kb/s stereo 48 kHz, −16.0 LUFS, −1.9 dBTP, 210,023,893 bytes, SHA-256 `4ba6fc88dc59a63e335ff6a50d1d3ad9520709383a4013981cb6275ecd92936c`. Git-ignored because it contains the music. |
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

- **Measured on the delivered file** (`qa/r2/render/qa_results.json`, `tools/r2/qa_r2.py`):
  - 1920×1080, 30/1, bt709, 7,740 frames, 258.000 s;
  - stereo AAC 48 kHz;
  - −16.0 LUFS integrated, LRA 12.3 LU, −1.9 dBTP.
- **Black and frozen spans:** only the intended ones.
  - 6.60–9.37 black: the title card (the title fades in on black).
  - 229.97–236.60 black or near-black: the pullback fades out, then the credit field and the first block, which starts below the frame at 230.4 and enters around 232.
  - Frozen 7.27–9.13: the held title.
  - Frozen 253.73–256.93: the credits' resting hold.
- **All 83 cuts:** the outgoing shot's last frame beside the incoming shot's first frame, at exact frame times (`qa/r2/render/cuts_*.png`). No blank or flash frames.
  - The planned invisible cuts match: E2→F1 at 198.30 (one camera) and D4-10→E1 at 186.90 (the tableau).
  - The section handovers were also checked numerically by the section builds:
    - Crew roots identical, joints within about 1–2 cm.
    - Machines identical, apart from one D4 foot already in its next step.
- **Contact sheets:** a frame every 3 s (`qa/r2/render/every3s_*.png`), plus per-section sheets around every contact (`qa/r2/shots/<SEC>/`).
- **Music and radio, measured from the mix stems:**
  - "Portals" sounds from 0.61 s to 193.1 s.
  - "It's Been a Long, Long Time" sounds from 200.42 s to 255.37 s, 55.0 s in all.
  - The effects bus rises at the radio click at 199.90 s. The radio take's louder sweep peaks 0.3 s later, at 200.20.
  - Radio → full range: the share of the song's energy below 250 Hz is 1.4% at 200.5–203 s (speaker), 11% at 210–213 and 39% at 218–222 (full range, with the vocal).
  - The music-priority rule was active for about 80 s, averaging 1.3 dB of effects reduction, never more than 5 dB.
  - The limiter's largest reduction is 3.1 dB.
- **4K:** `LastChoiceR2-4K` renders at 3840×2160; one frame was checked (200.0 s). The full 4K master has not been rendered.
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

**Audio, unverified by ear** (all measured, none heard):
- **Song edit:** "Long, Long Time" at 3:30.6 (rec 10.205 → 57.26; preview `audio/r2/music/preview_llt_join.wav`).
- **Transitions:** the radio-to-full change, and the Portals entry at 0:00.6.
- **Balance:** music against effects.
- **Effect takes:** chosen by objective rules, not auditioned. 17 kinds have only one take, because generation hit a rate limit.
- **Radio click:** the take's audible click starts at 199.90 with the dial light, but its loudest moment is a sweep peak 0.3 s later.
- **Two picture events miss their music hits:**
  - The heavy's crash (126.25) lands 0.6 s after the `HEAVY_DOWN` music hit (125.64), which falls mid-topple.
  - The four D1 contacts land 0.44–0.72 s after their music accents, because each wind-up starts on the cut.

**Picture: reads, but weak:**
- **Combat units:** blocky. In the widest shots they read as stick-figure robots, and side-on they merge with the ranks behind.
- **Busy or small wides:**
  - D1-3 (the end of the crane up);
  - D2-3 (strikes at the light, small);
  - D2-5 (the robots in the girder crash, small);
  - D3-10 (a pipe across the foreground);
  - D4-9b, D4-10 (the Crew small inside the ring);
  - the middle of the F1 pullback (205–212 s, a busy crowd; a brick building fills the right third at 217–222 s).
- **Flat inserts:** the clasp insert (E1_clasp, 191.4–193.1) and the opening hand close-up (B1) are flatter and more graphic than the rest.
- **Smoke and city:**
  - Smoke columns read as stacked puffs.
  - The far city is generic.
  - The avenue's streaming formations barely show under the smoke in F1.
  - The collapsed tower's stump arrives late in the pullback (about 221 s).
- **Rear view of the Director's curls:** now one mass, but in a dead-back view the lower shadow band reads slightly like a headband.
- **B6 (the lonely wide):** the dust bank's edge is lumpy, and the lens is tighter (16°) than planned so he stays readable (about 68 px tall).
- **B4 and B6:** the long lens flattens depth, so he sits near the van's roofline.
- **C4b:** the drone pilot's arm crosses her face for about 3 frames as she raises the drone.
- **C6:** her step off the slab's 0.55 m edge is one quick step.
- **D1:**
  - The flare carrier's flare draw reaches toward the wrong hip; the satchel is on his left.
  - In D1-8 the charged unit is partly hidden behind his head for 87.2–87.6 s.
- **D2-4b:** the pry insert crosses the line. It is held tight on the plate and hands so the geography does not register.
- **D2-7:** the allied drone that takes the blow is small; the sparks carry it.
- **D3:**
  - D3-5's first second is dust-heavy.
  - Small residual jumps: the Director's head turn at 140.42 s and his start to rise at 146.85 s; the decoy maker's foot at 146.39 s; the breaker's first step at 128.79 s.
- **D4:**
  - Heavy 2's rear-left foot hangs about 1 m above the ground in the first frames of D4 (149.9 s, far background).
  - Several ring units stand on rubble chunks.
- **F1:**
  - Her helmet sweeps close past the lens at 198.75–199.6 s.
  - The frame holds the lit radio with nobody in it at 201.4–203.2 s, until the first wide finds them both.
- **Credits:** the field is near-black for about 2 s (230.4–232.4) before the first block rises into frame.

**Deviations from the brief and the shot list:**
- **B3** ends on a long-lens over-the-shoulder rather than a true high wide: the slab he climbed out of blocks a wider view.
- **B5** has the van to the right of frame.
- **B6** is a high shot over the army looking back at his silhouette. The planned low west-slope view could not see the army past the crest.
- **Cut moved:** the E2/F1 cut is at 198.30 instead of 199.30. One camera spans it, so the move starts on his still face and the knob turn can land on the 199.9 click.
- **Shot count:** 84 shots against the shot list's planned set-ups. Several planned shots became two or three cuts. The as-built times are in each section's `index.tsx` and `qa/r2/render/timeline.json`.
- **4K:** the composition is ready and checked on one frame. The full 4K master has not been rendered.
