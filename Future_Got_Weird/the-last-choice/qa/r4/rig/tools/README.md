# History test for React patching (the black-disc / black-shard regression)

Remotion renders frame after frame in ONE page, and React patches the DOM from frame to frame. A fresh render of a single
frame (renderToStaticMarkup, `remotion still`, a one-frame `remotion render`) never shows what patching leaves behind, so a
bug that lives only in patching passed every static check. `page2.tsx` renders a shot's frames in sequence into one React
root; `dom.py <shot> <start_s> <end_s> <fractions>` dumps the final DOM of "frame f alone" and of "frames f-N..f in
sequence" and compares them (env HIST = N). Any DIFF is a part whose DOM depends on the previous frames.
`page3.tsx` renders the whole film in sequence (a=first frame, b=last, step, off) into one root, picking the active shot per frame, and the DOM after frame b is compared with a fresh render of b (the long-history repro: a=0&b=492 showed the disc until parts were remounted per pose).
Build: esbuild page2.tsx --bundle --format=iife with `--alias:remotion=qa/r4/EF/tools/remotion-shim.tsx`, then open
index.html (script src page2.js) in headless Chrome with `?shot=<id>&f=<frames>`.
