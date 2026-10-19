# Node-side frame sheets (no Remotion render per frame)

When the machine is saturated a Remotion `renderStill` costs minutes per frame. The film's shots are pure React + SVG
(`engine/scene.tsx` `Scene`), so a frame can be produced in Node and rasterised by Chrome once for a whole sheet:

1. `nframes.tsx` is bundled with `esbuild` (the `remotion` module aliased to `remotion-shim.tsx`, which gives
   `useCurrentFrame()` from `globalThis.__FRAME`), and renders an EF shot component (E1, E1Clasp, E2, F1) to a static SVG
   per film frame.
2. `fastsheet.py` tiles any list of those SVGs into one HTML page (crop, scale, label) and takes ONE headless-Chrome
   screenshot.

```
cd source
OUT=/some/scratch/dir; TOOLS=../qa/r4/EF/tools
NODE_PATH=$PWD/node_modules npx esbuild $TOOLS/nframes.tsx --bundle --platform=node --format=cjs \
  --outfile=$OUT/nframes.cjs --alias:remotion=$PWD/$TOOLS/remotion-shim.tsx --jsx=automatic \
  --loader:.png=empty --loader:.woff=empty --loader:.woff2=empty
python3 $TOOLS/fastsheet.py $OUT <out.png> F1 <f0> <f1> <step> <cols> <tile-width> [x0,y0,x1,y1]   # film frame numbers
#   env: FRAMES=5976,5988,6030 (explicit list), TAG=_x (separate SVG cache), --regen (ignore the cache)
```
Any other shot component can be added to `nframes.tsx` the same way (its `useShotTime(start)` start time goes in `starts`).
Numbers behind the sheets (rig parts, ankle speeds, camera rates, LOD flips) were probed with small esbuild + node scripts as
in `production/R4_BRIEF.md`.
