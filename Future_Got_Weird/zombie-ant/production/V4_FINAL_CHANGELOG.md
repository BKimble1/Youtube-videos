# Zombie Ant V4 FINAL: change log (surgical pass on V2)

**Deliverable.** `exports/FGW_Zombie_Ant_V4_FINAL_1080x1920.mp4`

- **ffprobe:** h264, 1080 × 1920, 30 fps, 917 frames, 30.571 s; AAC 48 kHz stereo, 30.571 s.
- **Baseline:** V2 (commit `d2eaadc4`). V3's changes are discarded except where listed below.
- **Unchanged:** the narration, word timings and captions.
- **Not published.**

| Time | Change | V2 kept? |
|---|---|---|
| 0:00–0:03 | None. The macro jaw grip and the quick pull-back are V2's, frame for frame. | Kept |
| 0:03–0:09 | None. The entry, the fungal cells between the muscle fibres, the network and the leg kick are V2's. | Kept |
| 0:10.4–0:11.0 | The bite close-up turns to a frontal view from below once the body swings down. The vein runs between the jaws, and the legs stay clear to either side; V2's leg in the foreground is gone. A gaster passes the lens for about 2 frames during the turn. | Reframed |
| 0:13.9–0:14.5 | The moment of death: one last small gaster spasm, then it sags and everything goes still, while the colour dulls as in V2. | Added |
| 0:14.1–0:21.1 | The fungus now emerges from the nape (the dorsal joint between head and thorax), not the top or front of the head: blister, cracks, then a lobed pale bud. The camera makes one continuous macro move from the nape, following the growing tip and widening as it lengthens. Growth is continuous from 16.2 s to 21.1 s, with no stall. The stalk has uneven thickness, small nodes and a darker base. Ant #1's stalk in the hook is unchanged. | Improved |
| 0:22–0:29.3 | V2's spores-to-ants-below sequence and V2's expanding graveyard, unchanged. None of V3's foreground leaves or regrouped cluster. | Kept |
| 0:29.35–0:30.57 | **Loop.** V2 swept the camera blind through empty green (about 30.0–30.2 s), then a leaf covered the lens. Now a living infected ant is visible on a leaf in the upper part of the final wide, and the camera dollies straight in and tilts up to its jaws. The last frame is the opening composition. There is no leaf wipe and no empty green frame. | Refined |
| Throughout | The vein is visibly squeezed where jaws clamp it. The perithecia on the cushion are muted, varied and have small pores. | Minor |

**Sound.** The narration is unchanged. Effects are re-cued to the picture:
- the mandible snap, the splitting cuticle, the growth swell and the spore puffs as in V2;
- a low swell under the reveal;
- the leaf-past-lens rustle is removed with the wipe.

Mix: −14.1 LUFS, −2.3 dBFS peak.

## Comparative check against V2 (`qa/v4/compare_v2_top_final_bottom.png`, matching frames)

1. **First second:** identical to V2.
2. **Mechanism:** identical to V2.
3. **Fungal emergence:** more dramatic, from the correct place, continuous, with the head, eyes and jaws clear.
4. **Ending:** V2's reveal is kept. The loop now stays on a subject the whole way (V2's frame at 30.13 s was an empty
   green blur).
5. **New problems:** no new animation problems found.
   - **Glitch check:** 67 frames compared against clean single-frame renders, mean difference 2.7 (compression
     only).
   - **Black frames:** none.
   - **Loop seam:** last frame against first, 11.0 — smaller than the opening's own first frame step (16).
   - **Largest motion:** the turn into the bite at 10.6–10.7 s.
   - **Speech recognition:** every word heard (spelling-only differences).
