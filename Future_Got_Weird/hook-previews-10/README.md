# Future Got Weird: 10-Hook Preview Round

This round is ten competing 6-second hook previews. They are not full Shorts, and no winner is chosen here.

The deliverables are in `exports/`:
- the ten `FGW_HOOK_NN_*.mp4` files;
- `FGW_ALL_10_HOOKS_COMPARISON.mp4`;
- `FGW_HOOKS_FIRST_FRAMES_CONTACT_SHEET.png`;
- `FGW_10_HOOKS_MANIFEST.md`, which has the narration, runtime and limitations for each hook, plus the common
  specification.

## Rebuild

```sh
python3 tools/asr_takes.py && python3 tools/make_narration.py      # narration masters + word timelines (takes in audio/narration/takes)
(cd source && npm ci)
python3 tools/audio/hNN.py                                          # effects + mix for hook NN
tools/render.sh NN                                                  # exports/FGW_HOOK_NN_<SLUG>.mp4 (fixed settings)
python3 tools/qa_clip.py NN                                         # QA of the rendered file -> qa/hNN/
(cd source && node reel.mjs) && python3 tools/contact_sheet.py      # comparison reel + first-frame contact sheet
```

Each hook bundles from its own entry point (`source/src/hNN/index.ts`), so the ten render independently.
- Shared code is in `source/src/shared/`: captions, frame wrapper, timing and ink/colour helpers.
- The production brief all ten followed is `production/AGENT_BRIEF.md`.
- Per-hook notes are in `production/hNN_NOTES.md`.
