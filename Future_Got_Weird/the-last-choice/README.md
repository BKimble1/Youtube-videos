# Future Got Weird: THE LAST CHOICE — first review film (R1, 17 Oct 2026)

A dialogue-free animated short. The battered Weird Crew carries an injured teammate and three civilians across a district
run by an autonomous coordination system. They reach a waterfront refuge. Lives are saved, the friend who held
the crossing dies after being brought in, and the refuge turns out to be an enclosure.

**Status:** a complete first review cut. It is **private and not published.** The music comes from recordings the
owner supplied. **Supplying them does not establish publication clearance, and nothing here represents that rights are
cleared.**

Neither the music, the mix nor the review MP4 is in this public repository; all are Git-ignored. Note that the
`film-audio-v1` release that carries the recordings is attached to this public repository, so anyone can download it.

| What | Where |
|---|---|
| **Review film (1080p)** | `exports/FGW_TheLastChoice_R1_REVIEW_1080p.mp4`. 1920×1080, 30 fps, 6,162 frames, **3:25.40**. H.264 CRF 18 with AAC 320 kb/s stereo. −16.5 LUFS, −1.6 dBTP, 0 clipped samples. 105 MiB. SHA-256 `0827c118a63becc100ff03f0d7bac60934d6300e2e96babca1c2dd5787c9f62e`. Git-ignored because it contains the music. |
| Editable source | `source/` (Remotion 4, React, TypeScript, pure SVG). Compositions `LastChoice` (1080p) and `LastChoice4K` (3840×2160, same component, renders natively at 2×). |
| Single timeline | `source/src/film/timing.ts` holds the music segments, music anchors and 40 shot boundaries. `source/src/film/sfx.ts` holds the beds, the perspective (muffle) and all sound cues. |
| Shots | `source/src/shots/{AB,C1,C2,DE}/`, one file per shot. Cast injuries over time come from `source/src/film/crew.ts`. |
| Story, geography, continuity | `production/BEAT_SHEET.md`, `production/GEOGRAPHY.png`, `production/CONTINUITY.md` |
| Music cue sheet (sources, offsets, edit, sync map) | `production/MUSIC_CUE_SHEET.md`; analysis plots are in `production/music/` |
| Sound effects | `audio/sfx_raw/` (generated takes) and `audio/SFX_CHOICES.md` (which take, and why) |
| Mix | `tools/mix.py` writes `audio/mix/mix.wav`, separate stems `audio/mix/stems/{music,sfx,beds}.wav` and `audio/mix/mix_measure.json`, all Git-ignored |
| QA | `qa/render/qa_results.json`, cut strips `qa/render/strips/`, contact sheets `qa/render/sheets/`, and per-shot stills and frame bursts in `qa/shots/` |

## Render it

```
cd Future_Got_Weird/the-last-choice
bash tools/render_review.sh        # 1080p review → exports/FGW_TheLastChoice_R1_REVIEW_1080p.mp4 (+ qa/render/qa_results.json)
bash tools/render_review.sh 4k     # 3840×2160 master from the same source (not rendered yet)
```

The script runs these steps in order:
1. Downloads and checks the music: `tools/fetch_music.sh` fetches the release assets, checks their SHA-256 and extracts the audio.
2. Writes `audio/timing.json` from the film's timeline.
3. Builds the music stem (edit, splice, radio speaker → full range).
4. Prepares the sound effects.
5. Mixes to −16 LUFS / −2.0 dBTP.
6. Renders and measures.

A full 1080p render takes about 25 minutes on 4 cores.

To inspect stills: `cd source && SCALE=0.5 node stills.mjs ../qa/<dir> t:<seconds> …`

## How the film is built

- **Shot count:** 40 numbered shots (A1–A5, B1–B6, C1–C16, D1–D5, E1–E7, T1). A few contain planned internal set-ups: C12 has four (close / reverse / nod / hand on the lever), C16 has two, and A3 pushes in within the shot.
- **Determinism:** every frame is a pure function of film time. There is no playback state.
- **Spine:** hands.
  - A3: the Director's grip pulls the teammate from under the taxi.
  - B5: the hand up the exit stair.
  - C12: the friend's hand tightens on the dead-man lever.
  - C14: the catch.
  - D3: the grip that releases.
  - E5: the hand stopped flat on glass.
  - E7: the teammate's hand on the Director's shoulder.
- **The system's behaviour on screen:**
  - It senses through a pole camera, sensor bars, drones and the checkpoint arch.
  - It acts on a forecast: vehicles seal the gap *before* the Crew arrives (C2) — and nobody is in it (C4).
  - It fails and corrects visibly: drones sweep the street, then tilt up (C4), and the decoy's flatness is seen edge-on (C7).
  - Its assets are finite: a replacement walker and drones slot in (C8, C11).
  - It spends a person for order (C12–C13), then cares efficiently for the compliant (D, E).
- **Music** (details in the cue sheet):
  - **Portals:** rec 9.80–81.69 and rec 143.08–193.80, with one splice of 61.39 s removed. The splice lands on the warden smash at 1:21.23.
  - Synced picture events:
    - the refuge reveal on the orchestra's entrance (0:17.00);
    - the assembly cut on the re-entry hit (0:38.70);
    - the operator's choice on the B♭ arrival (1:41.15);
    - the blast (1:45.25);
    - the doors on the final hit (2:05.75).
  - **It's Been a Long, Long Time:** rec 58.45–115.30. It enters through the radio's small speaker at 2:27.00, the vocal enters around 2:32.95 (inferred), and it opens to full range at 3:08.05 as the domes are revealed. It fades under the end card by 3:23.85.
- **Mix:**
  - Music, effects and beds are kept as separate stems.
  - Distance is rendered as quieter, darker and more reverberant.
  - The blast hits at full weight, then the whole mix goes muffled with an ear ring from 1:45.57 to 1:49.60 and clears as the Director catches the friend's hand.
  - D4 is room tone only.

## Asset provenance

| Asset | Source |
|---|---|
| **Cast** | The approved Weird Crew looks: colours, hair, outfits and accessories copied from `they-trained-robots-to-destroy-themselves/source/src/components/cast.ts`. The rig that articulates them was written for this film (`source/src/rig/`). Roles are functional; nothing on screen names anyone. |
| **Sets, machines, FX, props, close-up hands** | Drawn in code for this film. There are no external images and no real logos. The system's mark is a fictional three-arc symbol. |
| **Sound effects** | ElevenLabs `eleven_text_to_sound_v2` takes generated for this film on the channel's account (flow `z1if6RWnmC2gvHiGpM0u`; prompts in `audio/sfx_raw/manifest.json`). Ten channel effects are reused from the robots episode. The tinnitus ring and the projector chirp are synthesised. |
| **Music** | Owner-supplied Spotify screen recordings (release `film-audio-v1`) of "Portals" (Alan Silvestri, *Avengers: Endgame* OST) and "It's Been a Long, Long Time" (Kitty Kallen with Harry James & His Orchestra). **Not cleared.** |
| **Fonts** | Fredoka and Nunito (`@fontsource`, OFL), the series fonts. |

## What was checked, and how

- **Measured on the delivered file** (`qa/render/qa_results.json`):
  - duration 205.40 s = timeline end;
  - 6,162 frames, 1920×1080, 30/1, bt709;
  - stereo 48 kHz;
  - −16.5 LUFS integrated, LRA 15.3 LU, −1.6 dBTP, 0 clipped samples.
- **Black and frozen frames:** the only black or frozen span is the end card (3:20.97–3:25.40).
- **Cuts:** frames −6…+6 around all 39 cuts show no flash frames or blank frames and no position jumps between matched set-ups.
- **Stills:** contact sheets every 2 s over the whole film, plus full-resolution stills and frame bursts at every key beat. The bursts checked the hand contact in A3, C12, C14 and D3, the catwalk faces, the visor's hand-offs in E3, and the radio in D5.
- **Sync:** the main impacts land within ±0.02 s of their picture frames in the effects stem (taxi drop, hauler slam, warden smash, warden fall, gantry slam, lever, grille). The radio click is aligned to the dial lighting. The radio-to-full-range perspective change is measured in the music stem: energy above 4 kHz rises from 8 % to 51 %.
- **Not done: I cannot play video or listen in this environment.** Nobody has watched this film in real time or heard it here. Motion was judged from consecutive-frame bursts. Audio was judged from waveforms, spectra and onset measurements.
- **Three-way evaluation (judged from stills, not viewing):**
  - **Without notes:** the injured person (A1), the destination (the refuge with its aid symbol in A5, B6, C9 and C16), the obstacles (machines, the closing gap, the broken span), the genuine rescue (D1) and the loss of freedom (E1–E6) each have a dedicated image.
  - **With the music muted:** cause and effect stay physical: grip and pull, a vehicle seals the gap, a decoy is seen through, a lever is held, the blast, the catch, the doors, the glass.
  - **With music:** the phrase-level sync points are listed in the cue sheet. Their pacing is unverified by ear.

## Unresolved issues (known defects and limits)

**Audio, unverified by ear:**
- The singer's entrance in "Long, Long Time" (≈2:32.95) is inferred from spectral evidence, not transcribed.
- The Portals splice at 1:21.23 was chosen objectively and needs an ear check.
- Effect takes were chosen by rules, not auditioned.
- The limiter takes 4–6 dB on the four biggest hits for about 0.5–1 s each (0:55.2, 1:21.2, 1:45.2, 1:55.9).
- The recordings miss the first ≈3.0 s of Portals and ≈2.2 s of Long, Long Time; neither opening is used. The true final cadence of Long, Long Time is not in the recording, so the song fades under the card.

**Staging that reads but is weak:**
- A4: the separation at the checkpoint is small in frame.
- A5: the reveal geography is compressed; the facades dominate the first second.
- C2: a wide where the Director's halt gesture barely reads.
- C9: the hand-off of the teammate at the ladder is small and crowded.
- C14: the haul over the lip (1:50.4–1:52.0) has overlapping bodies, and the friend's legs briefly extend along the slope.
- C11: heads overlap in the full basket, and the smash of the diving drone reads only modestly.

**Rig approximations:**
- A1: the clawing hand is a mitt.
- A1: the teammate's brow-cut trickle crosses the left lens in the close shot.
- From behind, the teammate's grey bob reads somewhat like a helmet (A4, B6).
- C5: the friend's visor reads like a headband in the front view.
- D2–D5: the reclined friend on the bed is approximate, and the teammate's legs dangle off the gurney.
- E7: the teammate's sling is hidden in the back view.
- Background people inside the refuge are simple faceless figures.

**Continuity cheats (deliberate, local):**
- C9–C16 draw the refuge at x 14,900 (elsewhere 16,000) so the gap and the entrance share the wide.
- The maintenance ladder sits at x 9,930.
- The builder's tool bag changes from hand-held to slung off screen.
- B5 never shows feet on the steps.

**Gentle actions without contact:**
- E2: the attendant redirects the builder with a palm-up gesture, not physical contact.
- E4: the tool bag goes into the locker hidden behind the attendant.
- E6: for about 1 s of the pull-back, a window pane shows as a brighter rectangle.

**Deviations from the brief:**
- 40 numbered shots, against the brief's approximate 28–36. Several are short music-cut beats in the subway and crossing sequences; merging some is the obvious trim for R2.
- The 4K master has not been rendered. The source supports it (`tools/render_review.sh 4k`).
