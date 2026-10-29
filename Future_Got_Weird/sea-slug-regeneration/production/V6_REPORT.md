# Sea Slug Regeneration V6: report (stopped at Gate A)

**Result: the V6 opening fails its creative gate, so the full V6 was not produced.** This follows the brief: "If this
opening is still less captivating than the spider and cockroach benchmarks, stop production and report that the
concept has failed its creative gate."

## Delivered

`exports/FGW_SeaSlug_Regeneration_V6_HOOK_REVIEW_1080x1920.mp4` is the first 5 s:
- 1080×1920, 30 fps, 150 frames (verified with ffprobe).
- Rendered natively from the editable source (`source/src/v6/`, composition `SeaSlugV6`, rig style `'v6'`).
- The narration is the unchanged approved recording.

Gate evidence:
- `qa/v6/gateA_0-4s_0.1.png`: 0–4 s in 0.1 s steps, at phone scale.
- `qa/v6/gateA_compare_0-4s.png`: V6, V5, Dead Spider V6 and Cyborg Cockroach V5, side by side at 0.25 s steps.

## Resolution of V5

The V5 review file in the repository decodes at **1080×1920** (ffprobe on the local file and on the copy on the
branch). The 512×910 copy that was reviewed did not come from this export; a preview or download path probably
transcoded it. V6 was rendered from source either way.

## What V6 changed

**Character (rig style `'v6'`):**
- The vein-like tubules on the parapodia are removed. They were the strongest leaf cue.
- The rhinophores are short, thick, rolled and flare out to the sides, replacing the two long spikes.
- The body is about 25 % taller, with irregular soft swellings along its length.
- The parapodia are narrower and hug the body, with more folding.
- The black rim and orange band along the margin are kept.

**Opening:**
- Both grey stones are removed. The surface features are now two patches of algae turf.
- The head is closer and larger in frame 0.
- The camera follows the brief's views and timings: close, slightly elevated; a low side view from 0.6 s; a pull-back to compare sizes at 1.0–1.6 s; past the turf at 1.6–2.3 s; then turning to the body.

## Why it fails the gate (observed on the MP4, muted, at phone size)

- **Subject size:** the head reaches about a third of the frame width only around 0.8–1.0 s and 2.0–2.3 s. In the pull-back and the turn to the body (1.3–1.8 s, 2.5–3.3 s), the frame is mostly pale floor with a small green shape.
- **Appearance:** the animal no longer reads as a leaf, but it still reads as a smooth green blob with stubs, not a striking living animal. The faceted shading shows at close range.
- **No mechanism:** the spider opens on an instantly readable cause and effect (needle → legs spring open). The cockroach opens on a mechanical device and quickly adds a person. The sea-slug opening has no comparable event; the extraordinary part (a head living without its body) is a state, not an action, and slow gliding does not make it visually surprising.
- **Compared with V5:** V6 is cleaner but not more captivating.

## Why another revision of this rig will not fix it

Six versions have now varied the timing, cameras, environments and character proportions. In each one the limit has been:
- the rendering finish of this procedural rig;
- the subject's slow soft-tissue action.

Neither improves enough through more revision.

## If the project continues

These are options for the producer, not attempts made here:

1. **New hand-illustrated master artwork for the slug.** Flat cel-shaded, drawn from the research photographs, with drawn deformation keys for gliding, separation and regrowth. Then reanimate the existing V5 structure, which already delivers the story and the second separation, with that artwork. This is a production-art task (an illustrator or a working image-generation pipeline), not a code revision.
2. **Runway:** its file host is still blocked in this environment, so nothing generated there can be brought into the edit. Allowing `dnznrvs05pmza.cloudfront.net` in the environment's network settings would make that route possible.
3. **Rethink the hook concept:** for example, open on a human-scale action, as the benchmarks do (a researcher's hand, a dish, a visible cut), before the macro biology.

## Not done

- No full V6 render: stopped by the gate.
- No V6 sound mix: the hook clip uses the V5 mix, which is the same narration with the same opening cues.
- Nothing was published.
