# Ultimate Trifecta · Season 1: Winter Break: 40 s cinematic trailer (V1)

**Review render:** `exports/Ultimate_Trifecta_Winter_Break_V1.mp4` (1920 × 1080, 30 fps, H.264 + AAC, 40.0 s).

The story: 3 a.m. at Moonbrook. Three friends in their holiday pajamas sneak out of
Puddlesworth Hall's Christmas common room for one last plunge in Founders' Fountain.
The one in blue stripes tests the water and backs off, until campus security's cart
rounds the bend. Then the nervous one jumps first. They race home sure they barely
escaped, and only we see the officer switch his headlights off and let them go.
A squeak, a look, and a hard cut to the title.

| Item | Where |
|---|---|
| Report (shot list, staging, music edit, sound, QA, open questions) | `production/V1_REPORT.md` |
| Creator's direction (verbatim) | `production/V1_DIRECTION.md` |
| Shot planner: choreography, cameras, timing (writes the shot JSON and the EDL) | `source/tools/plan.py` |
| In-engine director (Godot; drop into the game's `game/src/dev/trailer/`) | `source/godot_trailer/` |
| Render and still-preview scripts | `source/tools/` |
| Compositor (cut, 60→30 fps motion blur, grade, the underwater transition, end card) | `source/comp/` |
| Music edit, sound design and mix | `audio/tools/build_mix.py` |
| Generated sound effects (door latch soft and firm, wet slipper squeak) | `audio/sfx_src/generated/` |
| Final mix and stems | `audio/mix/` |
| QA (contact sheets, sync checks, audio analysis) | `qa/v1/` |

## Rebuild

The game is `BKimble1/ultimate-trifecta`, branch `claude/happy-edison-50dynd`
(commit `feee15e`), Godot 4.7.2, Mobile renderer on Mesa llvmpipe under Xvfb.
Copy `source/godot_trailer/*` into `game/src/dev/trailer/` (a dev-only folder, never
exported; run `tools/gd.sh --headless --path game --import` once so the new classes
register), then:

```bash
python3 source/tools/plan.py                                  # shot JSON + EDL
source/tools/render_all.sh 1920 1080 60 shots                 # every shot in the EDL (about 2.5 h on 4 cores)
python3 audio/tools/build_mix.py shots audio/mix/UT_WINTER_BREAK_V1_MIX.wav
python3 source/comp/comp.py --edl source/tools/edl.json --shots shots \
    --audio audio/mix/UT_WINTER_BREAK_V1_MIX.wav --out exports/Ultimate_Trifecta_Winter_Break_V1.mp4
```

`source/tools/stills.sh` renders blocking stills of any shot at any times in a minute or two.
Paths at the top of `plan.py`, `build_mix.py` and the shell scripts point at the
working checkout (`/home/user/ut/...`); adjust them for another machine.

Needs: ffmpeg, Xvfb, `mesa-vulkan-drivers`, Python 3 with numpy, scipy, soundfile,
librosa, pedalboard, pyloudnorm, opencv-python-headless, Pillow, fonttools, brotli.
