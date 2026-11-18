# Ultimate Trifecta: Season 1 · Winter Break launch trailer (V1)

The 30-second cinematic launch trailer for the Season 1 Christmas update, made in
the game's own engine with the game's own assets. Not yet integrated into the app
(that comes after approval: an optimized mobile version, a skip option and a
persistent "seen" flag).

**Review render:** `exports/UT_SEASON1_CHRISTMAS_V1_REVIEW_4K.mp4`. It is kept as
checksummed 20 MB parts in `backup/` because GitHub refuses single files over 100 MB.
Restore it with:

```bash
cd backup && sha256sum -c UT_SEASON1_CHRISTMAS_V1_REVIEW_4K.mp4.SHA256SUMS && cat UT_SEASON1_CHRISTMAS_V1_REVIEW_4K.mp4.part_* > ../exports/UT_SEASON1_CHRISTMAS_V1_REVIEW_4K.mp4
```

A 1080p proxy for quick viewing is committed as `exports/UT_SEASON1_CHRISTMAS_V1_PROXY_1080p.mp4`.

| Item | Where |
|---|---|
| Report (what's in it, how it was made, QA, open questions) | `production/V1_REPORT.md` |
| Creator's direction (verbatim) | `production/V1_DIRECTION.md` |
| Edit decision list (shots on the music grid) | `source/edl.json` |
| In-engine trailer director (Godot, drop into the game's `game/src/dev/trailer/`) | `source/godot_trailer/` |
| Shot render and preview scripts | `source/tools/` |
| Compositor (cuts, transitions, grade, flare, logo reveal) | `source/comp/` |
| Original score (MIDI stems + synthesis) | `audio/tools/score.py`, `audio/tools/build_music.py`, `audio/midi/` |
| Sound design (placed from the engine's event logs) | `audio/tools/build_sfx.py`, `audio/sfx_src/` |
| Final mix and stems | `audio/mix/` |
| QA (contact sheets, transition frames, audio analysis) | `qa/v1/` |

## Rebuild

The game is `BKimble1/ultimate-trifecta`, branch `claude/happy-edison-50dynd`
(commit `68f24e8`), Godot 4.7.2, rendered with the Mobile renderer on Mesa
llvmpipe (software Vulkan) under Xvfb. Copy `source/godot_trailer/*` into
`game/src/dev/trailer/` (a dev-only folder, never exported), then:

```bash
source/tools/render.sh d1_front 3840 2160
```

renders one shot with Movie Maker at a fixed 60 fps clock (about 10 s per 4K
frame on 4 CPU cores) to `shots/d1_front.mp4` plus `shots/d1_front.events.json`.
Render every shot in `source/edl.json`, then:

```bash
python3 audio/tools/build_music.py audio/build/music
python3 audio/tools/build_sfx.py source/edl.json shots audio/build/sfx
python3 audio/tools/mix.py audio/build/music audio/build/sfx audio/mix/UT_S1_TRAILER_V1_MIX.wav
python3 source/comp/comp.py --edl source/edl.json --shots shots --audio audio/mix/UT_S1_TRAILER_V1_MIX.wav --out exports/UT_SEASON1_CHRISTMAS_V1_REVIEW_4K.mp4
```

Needs: ffmpeg, fluidsynth with `FluidR3_GM.sf2` (Debian/Ubuntu `fluid-soundfont-gm`),
Python 3 with numpy, scipy, soundfile, pedalboard, pyloudnorm, mido, opencv-python-headless, Pillow.
