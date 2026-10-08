# Video 02 artwork handoff

Episode: Future Got Weird · Video 02 · How Cameras See Around Corners.

All 17 requested PNGs, including the extra A06b mirror panel, are under `Future_Got_Weird/Video_02/art/incoming/` with the requested filenames. This archive contains artwork only; it does not modify the episode repository or render animation.

## Import and use

1. Extract this archive into the production workspace, preserving the `Future_Got_Weird/Video_02/art/incoming/` path. Read `handoff/manifest.md` before replacing assets.
2. Preserve the existing approved SVG cast as the identity authority. A01–A04, A09 and A14–A16 are raster references for rebuilding layered SVG poses and props, not finished vector rigs. Use the original proportions, smooth contours, exact flat palette and mitten hands. Correct any small turn/contact differences during rig construction; do not add gradients from the generated reference fills.
3. A05–A08 and A12 are opaque backdrop candidates. Their positions should be aligned with the episode’s existing world coordinates and occlusion masks. A05 already contains the partition: shots requiring independent screen motion or changing character occlusion need the existing SVG screen and a suitable backdrop mask/rebuild, rather than a duplicate screen laid over the baked partition. Keep the wall gap open until the payoff.
4. For the mirror slide, use A05 with registered A06b, masking its right edge behind the partition. A06 is a complete mirror-room variant. The mirror files are visually matched, not guaranteed pixel-identical across generation.
5. A10 and A11 are Runway starting-frame candidates. A10: locked camera, guesser takes two tiptoe steps into hiding and settles smug; checker stays still except a blink. A11: locked camera, guesser pushes the partition away toward the back wall until the far gap closes, then dusts hands. Inspect both-hand contact, the correct depth motion, feet, cast continuity and background drift in the actual generated clips. This archive contains no Runway clips.
6. A13 is text-free thumbnail artwork. Add title text in the upper-left reserved space and the light route as precise overlays. The route must travel via the visible relay wall around the corner; never imply transmission straight through the coral wall.

## Resolution and inspection

The requested preferred 3840×2160 native output was not available from this generation tool. It returned 1672×941 originals. All delivered files are the packet’s permitted 1920×1080 fallback, using a small Lanczos resize with alpha preserved. These are not native 4K. For a 4K timeline, rebuild the reference-only props and characters as SVG and evaluate backdrop detail at the actual output scale.

All 17 files were visually inspected during generation, corrected where noted, and checked for filenames, dimensions, PNG readability and transparency. A14’s front has 100 optical-window centers; A15’s front has nine dot components. Generated art retains subtle tonal variation and small differences from mathematical SVG construction. Existing rigs, exact device-window counts, world geometry and palette remain authoritative for final animation. Camera paths, occlusion and Runway motion need render-level inspection after import.

No art includes labels, numbers, rays, arrows, equations, branding or plotted measurements. Mirror shine strokes and physical device window arrays are intentional. Every apparatus or setting is illustrative. Keep all researchers’ released measurements, paper figures, screenshots and evidence outside these generated assets.

The archive includes a preview contact sheet, a manifest with hashes and notes, the original request specification, and the full generation/revision prompts.
