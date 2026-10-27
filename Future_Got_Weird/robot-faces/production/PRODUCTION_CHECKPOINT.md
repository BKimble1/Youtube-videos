# Production checkpoint: Robots Are Learning to Copy Our Faces

## V5 (27 Oct 2026): current

- Composition `RobotFacesV5` (90 shots). V4 is at commit `13a31de`.
- New scenes: `source/src/v2/shotsG.tsx` (hook face-off, stage pair, crowd, workshop, test bay, materials, controller,
  wider lab, studio engineer, stage distinction beats, 2024 study face to face, video call, finale).
- New settings in `new.tsx`: `DemoBack` / `StageLip`, `WorkshopBack` / `Workbench`, `TestBayBack` (`Back` bg `demo`,
  `workshop`, `testbay`).
- `mech.tsx`: `CheekSection` is a soft masked clearing (no rim). `state2.ts`: `HOOK_T`, `HOOK_LAG`, `HOOK_H`, `HOOK_R`.
- `shotsD.tsx` `CrewTalk`: speech-driven gestures. Report: `production/V5_CHANGE_QA.md`.

## V4 (27 Oct 2026)

- Composition `RobotFacesV4` (renamed from `RobotFacesV3`; same `Film2` table, now 95 shots). V3 is at commit `f03600d`.
- New V4 shots: `source/src/v2/shotsF.tsx` (muscle match, split section, screen room, comparison, lobby, evolution
  split). New settings in `new.tsx`: `LobbyBack`, `LobbyCounter`, `StudioBack`, `StudioMic` (`Back` bg `lobby`,
  `studio`). The opening shots stay in `shotsE.tsx` (V1Face … V6React).
- `art/Robot.tsx`: `xrayFocus` shows only the hot motor groups; on by default in `RobotCU` when `xrayHot` is given,
  in `LabTwo`, and in the mirror reflection.
- `state2.ts`: V4 opening (`EXPR_HIS`, `EXPR_COPY`, `TEASE`, `UNEASY`), `MIRROR_TRIALS`, and a living-head layer
  (`rob2` wraps `rob2core` with a small pitch / roll motion).
- Tools: `tools/contact_v4.sh` (per-second and quarter-second sheets from a finished video).
- Report: `production/V4_CHANGE_QA.md`.


## V2 (26 Oct 2026)

**State.**
- V2 is rendered: the review (1080p), a native 4K master and a 540p draft.
- V2 is a full visual rebuild on the same narration: 80 shots, three new settings and physical mechanism sections.
- Report: `production/V2_CHANGE_QA.md`. Map: `production/V2_TRANSITIONS.md`. Not published; not watched or heard in
  real time.

**Where V2 is.**
- **Source.** `source/src/v2/`:
  - `env.tsx`: settings A/B/C and the help desk, as layered vector planes;
  - `sets.tsx`: the lab two-shot, close-ups, profile, over-shoulder and mirror;
  - `mech.tsx`: the cheek section with solved servo horns, and the skin section;
  - `props.tsx`;
  - `state2.ts`: the V2 states, which wrap V1's `robotAt` / `visitorAt` and replace the opening, callback and new
    beats;
  - the shots: `shots2.tsx` (opening and callback), `shotsA.tsx`, `shotsB.tsx`, `shotsC.tsx`;
  - `Film2.tsx`: the shot table with transition types.
- **Compositions.** `RobotFacesV2` (6,400 frames), `Still2`, `Sheet2` and `ShotSheet` (the mid-frame of every shot,
  16 per page); `Dev2` is a pose test.
- **Narration.** `audio/narration/FGW_Robot_Faces_narration_V2.wav` is V1 trimmed to 6,400 frames, with the same
  word timings, so `T('phrase')` is unchanged.
- **Sound.** `tools/export_cues_v2.ts` → `audio/cues_v2.json` → `tools/make_audio_v2.py`.
- **QA.**
  - `tools/qa.py <file> <prefix> V2`;
  - `tools/strips_v2.py` (edit pages);
  - `tools/state_continuity_v2.ts`;
  - `tools/nan_scan_v2.tsx` (bundle with `NODE_PATH=source/node_modules`);
  - `tools/v2_transitions.py` (regenerates the map).

**Open items.**
1. Watch and listen at normal speed.
2. Runway plates are blocked: the output host returns a proxy 403. Allowing it in the network policy would let the
   `Back` planes be swapped for generated plates.
3. The robot's profile mouth compression.

## V1 (archived below)


Checkpoint: 26 Oct 2026, end of V1. This is for a V2 session to resume without rereading the history. Do not publish;
publishing is the owner's step.

## State

**V1 is complete.**
- The review (1920×1080) and the native 4K master are rendered from source.
- The mix is −14.2 LUFS, −1.5 dBTP.
- The SRT and the production notes exist.

The QA report lists what was checked; there has been no real-time viewing and no listening.

## Locked inputs (do not change without the creator)

- **Script.** `script.md`: 617 words, verbatim.
- **Narration (the timing master).** `audio/narration/FGW_Robot_Faces_narration_V1.wav`, SHA-256 `5df1c9d0…070c`.
  - 214.667 s, 6,440 frames at 30 fps.
  - Built by `tools/make_narration.py` from five selected Test Voice takes (`voice_provenance.json`).
  - If the narration changes, rerun `make_narration.py`, then `make_srt.py`, then `envelope.py`; every picture time
    follows automatically through `T('phrase')`.
- **Voice.** ElevenLabs Test Voice `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, flow `T4qx0MK8nkNL5gpbce92`.

## Where things are

- **Shots.** `source/src/shots/*.tsx`, one file per scene; `Film.tsx` holds the shot list.
- **Shared state.** `source/src/state.ts`: `robotAt`, `visitorAt`, `screenFaceAt`, the key times `K`, the trials,
  `CO24`.
- **Robot rig.** `source/src/art/Robot.tsx`:
  - `RobotState`, `mouthCurves`, `lipAnchors`;
  - the options `cut`, `xray`, `grid` / `gridAt`, `anchors`.
- **Visitor.** The guesser's rig is `dc/`; its placement and expressions are `art/Visitor.tsx` (`VX`).
- **Mirror.** `shots/MirrorSet.tsx` (`reflectYaw`).
- **Sound.** `tools/make_audio.py`, driven by `audio/cues.json`, which `tools/export_cues.ts` exports from the picture.
- **QA tools.**
  - `tools/qa.py`: metadata, loudness, black/freeze detection, audio offset, ASR, SRT, phone sheet;
  - `tools/strips.py`: cut strips;
  - `tools/state_continuity.ts`.

## Candidates for V2

1. **Watch and listen** at normal speed. Check:
   - the hook energy;
   - the joins between blocks;
   - pronunciation ("B", "W", "2026");
   - the sock-puppet timing;
   - whether 175 wpm feels rushed for a four-minute explainer.

   If it does, regenerate with a slower direction (the node has no speed setting) or ask the creator about
   time-stretching.
2. **Robot design check against the paper's figure** (it could not be opened here). Adjust the colour, shell, eyes
   and neck mount to match.
3. **Legibility.** Raise the corner tags to about 30–34 px for small-screen viewing.
4. **Mouth close-ups.** Consider drawing teeth or an inner lip for the robot. Reduce the far-side compression of the
   3/4 mouth.
5. **Real footage.** If the lab's demo videos become reachable and are cleared, insert one short excerpt into a clean
   audio gap (labelled as footage). V1 uses illustrations only.
6. **Thumbnail campaign.** Not started. A clean source frame is `cover/FGW_Robot_Faces_V1_interaction_still_4.6s_1920x1080.png`.

## Delivery and storage

- **Media.** The exports are Git-ignored (each master exceeds what plain Git should carry; Git LFS is unavailable in
  this environment).
- **The review** is in `backup/` as 20 MB parts with SHA-256 sums.
- **The master** is reproducible with the README command.
- **The narration WAV, the mix WAV and the takes** are committed as plain blobs, which `.gitattributes` permits.
