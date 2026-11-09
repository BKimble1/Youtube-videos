# Future Got Weird: "This robot escaped JAIL… by MELTING" (V1 review)

A 9:16 Short (1080×1920, 30 fps, 32.4 s) about the 2023 *Matter* paper on a gallium-based, magnetically steered, phase-changing figure that passes through cage bars.

## Deliverables

- **Review file:** `exports/FGW_Robot_Escapes_Jail_V1_REVIEW_1080x1920.mp4`. Not published.
- **Key-frame contact sheet:** `production/FGW_Robot_Escapes_Jail_V1_keyframes.png`.
- **QA report:** `production/QA_REPORT.md`, with the measured checks, the fixes made and the remaining limitations.
- **Science corrections:** `production/SCIENCE_NOTES.md` holds the claim ledger and sources; `production/DIRECTION.md` holds the narration corrections applied. There are two:
  - "tiny metal cage" → "tiny cage";
  - "And scientists turned it solid again" → "Then scientists collected the metal and molded it back into shape."
- **Narration:**
  - `audio/narration/FGW_Robot_Escapes_Jail_narration_V1.wav`;
  - `audio/narration/voice_provenance.json` (ElevenLabs, the channel's approved voice);
  - captions in `captions/`.
- **Mix:** `audio/mix/FGW_Robot_Escapes_Jail_V1.wav` (−14 LUFS, −1.6 dBTP).

## Source

`source/` is Remotion 4 with React SVG. Everything is a pure function of time.

- **Timing:**
  - `src/story.ts`: word times (`T`) and the shot table.
  - `src/data/timeline.json`: the measured narration timeline.
- **Reusable art:**
  - `src/art/robot.tsx`: the robot rig and melt.
  - `src/art/liquid.tsx`: liquid metal.
  - `src/art/jail.tsx`: the 2.5D jail set, on `src/world.ts`.
  - `src/art/guard.tsx` and `guardRig.tsx`: the Weird Crew guard.
  - `src/art/cup.tsx`: the coffee cup and splash.
  - `src/art/lab.tsx`, `science.tsx` and `medical.tsx`: the lab, science and medical art.
- **Shots:** `src/shots/S1Hook.tsx`, `S2to4.tsx`, `S5Lab.tsx`, `S6Science.tsx`, `S7Medical.tsx`, `S8Loop.tsx`. `src/shots/index.tsx` holds the shot table and caption boxes.
- **Boundary contracts** between shots: `production/CONTRACTS.md`.

## Rebuild

```
cd source && npm ci
cd .. && tools/export_cues.sh                       # every shot's sound cues -> audio/cues.json
python3 tools/make_audio.py v1 audio/cues.json      # mix -> source/public/audio/v1.wav (+ audio/mix/)
tools/render_resilient.sh v1 exports/FGW_Robot_Escapes_Jail_V1_REVIEW_1080x1920.mp4
python3 tools/qa_render.py exports/FGW_Robot_Escapes_Jail_V1_REVIEW_1080x1920.mp4 <qa_dir>
```

Per-module test sheets are in `source/src/test/*.entry.tsx`. Render one with `npx remotion still <entry> <Comp> out.png`.
