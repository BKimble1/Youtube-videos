# Zombie Ant V3: change report

**Deliverable.** `exports/FGW_Zombie_Ant_V3_REVIEW_1080x1920.mp4`

- **Format:** rendered from the editable Remotion source (composition `ZombieAntV3`).
- **ffprobe:** h264, **1080 × 1920**, **30/1 fps**, 917 frames, **30.571 s**; AAC 48 kHz stereo, 30.571 s.
- **Not published.**

**Unchanged:**
- the narration (the same ElevenLabs master, sample for sample);
- the word timings;
- the caption text and timing;
- the runtime.

V2's source is at commit `d2eaadc4`.

## The resolution question (512 × 910)

The repository files are not 512 × 910.

- **Checks.** ffprobe on V2 in the working copy and on the blob pushed to GitHub (identical SHA-256) both report
  1080 × 1920, 30 fps.
- **Scale.** 512 × 910 is exactly 1080 × 1920 scaled to 512 px wide.
- **Most likely cause.** That is the preview copy produced when a video is sent through the chat/app viewer, not
  the render pipeline.
- **Native detail.** The V3 frames carry detail that a 512 × 910 version cannot hold. Downscaling a V3 frame to
  512 × 910 and back changes it by a mean of 1.0 and a 99th percentile of 20 grey levels: fine ink lines and leg
  edges are lost.
- **Recommendation.** Take the file from the repository (or the download card, not the inline player) for
  publishing.

## V2 defects corrected

1. **Opening jaws didn't convincingly bite.**
   - The mandibles are re-proportioned to *Camponotus*: shorter triangular blades with a hooked tip and small teeth
     along the inner edge.
   - Frame 0 is a tight macro with the vein running straight between the open jaw tips.
   - The jaws rotate shut about their attachments over 0.17–0.32 s (frames 5–10) and lock on the vein.
   - The vein is visibly squeezed at the bite, the leaf flexes, and a single crunch-snap sound plays.
   - **0.36–0.72 s:** a last struggle. The body tugs and twists about the neck and the legs kick, while the head
     stays anchored.
   - **0.72–1.06 s:** the camera pulls back to the whole ant hanging still.
   - **1.0–1.5 s:** a time-lapse glimpse as the back of the head blisters, cracks, and a knot of pale fungal tissue
     pushes out; the stalk follows.
2. **Stalk grew like a rigid tube, apparently from the mouth.**
   - The origin moved from the top/front of the head to the nape, the dorsal joint between head and thorax.
   - It now leans back over the body, clear of the eyes, jaws and antennae.
   - **Growth stages:** blister → cracks → irregular lobed primordium in a mycelium collar → elongation →
     reproductive cushion.
   - **Stalk shape:** uneven thickness (slow swellings, two small nodes), wandering curvature, fibrous striations
     and a pale growing tip.
3. **Repeated death-grip compositions.**
   - Approach, open jaws, clamp, legs relax and drop, still: now one close ventral view, followed by one
     continuous move out and round (11.3–13.7 s) straight into the motionless ant.
   - The two near-identical hanging-ant holds are gone.
   - The camera eases into the bite over 1.3 s instead of 0.85 s.
4. **Crowded infection cutaway.**
   - The whole-body network shows only its trunk strands, wrapping the muscles. The side twigs and most beads are
     removed.
   - The shell is drawn as dark translucent chitin, so the cream fungus and red muscle read with high contrast.
   - The close-in colonisation (cells budding between the fibres) and the leg-kick consequence are kept.
5. **Climb.**
   - The stem is thicker, so the ant clasps it with all six legs in the alternating tripod. No feet hang in the air
     beside a thin stem.
   - The camera views it more from the back, centred on the stem, and eases round as it turns under the leaf.
6. **Spore cushion looked like decorative dots.**
   - The perithecia now vary in size, are a muted brown, have soft edges instead of ink outlines, and have small
     pores.
   - Spores stay small with little glow.
7. **Graveyard ants too small.**
   - **Stage 1:** the dead ant on its own.
   - **Stage 2 (new):** a dead neighbour on the next leaf, side by side with it.
   - **Stages 3–4:** one steady pull back, low among the plants, to a small group and then the cluster.
   - The four nearest ants are now about 210–310 px tall in the final wide (V2: about 140–240 px), each with a
     different pose and fungal stage.
   - The extra intermediate pull-back that passed under a leaf is removed.
8. **Loop.** The last frame matches the first: their mean difference is 3.2, smaller than the opening's own
   frame-to-frame steps (about 4). The final push still passes one out-of-focus leaf in front of the lens (a
   physical wipe, no black frame).

**Sound.** The narration is untouched. Effects are re-cued to the new picture, with two additions:
- a struggle rustle against the locked jaws;
- a low swell under the final reveal.

The jaw contact, splitting, growth and spore-release accents are kept. Mix: −14.1 LUFS, −2.3 dBFS peak (decoded
from the MP4).

## QC gates (run on the MP4)

- **Gate 1, hook** (`qa/v3/gate1_frames_0_23.jpg`, `gate1_0.8_to_3s.jpg`):
  - open jaws round the vein at frame 0, closed and locked by frame 10;
  - the body struggles while the head is fixed;
  - hanging by 1.0 s;
  - the fungus breaking out at 1.3–1.5 s;
  - the spore lands on the walking ant by 2.85 s.
- **Gate 2, middle** (`gate2_3_key.jpg`, `gate2_bite_move.jpg`): a clean cutaway, the climb on the stem, a single
  death-grip move, the ant still on "DIES", and the stalk rising from the nape on "STARTED" through "HEAD".
- **Gate 3, ending:** the cushion opens, spores fall onto an ant below, and the four-stage reveal.
- **Gate 4, technicals:**
  - native 1080 × 1920 at 30 fps; video and audio both 30.571 s; no black frames.
  - **Glitch check:** 67 frames (every second, plus every caption change) against clean single-frame renders; mean
    difference 2.7 (compression only).
  - **Speech recognition:** Zipformer hears every word (spelling-only differences). Whisper drops the final "same
    way" in its whole-file pass, as on V1 and V2; on its own, the phrase transcribes correctly.
  - **Motion:** median frame step 4.7. The only large steps are the lens leaf at 30.1–30.45 s, and the ant's own
    body swinging past the lens as it turns into the bite at 10.63–10.7 s (continuous, no camera jump).

## Still open

- **Not watched or heard in real time here.** Please do one phone-size pass with sound before publishing.
- **Runway was not used.** All geometry and growth is deterministic Remotion, as the brief requires for the stalk.
- **The graveyard plants are simplified** (thin stems and twigs).
