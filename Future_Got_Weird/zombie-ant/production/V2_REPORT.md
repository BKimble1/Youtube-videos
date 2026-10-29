# Zombie Ant V2: change report

**Deliverable.** `exports/FGW_Zombie_Ant_V2_REVIEW_1080x1920.mp4`

- **Format:** rendered from the editable Remotion source at native **1080 × 1920, 30 fps**. ffprobe: h264, yuv420p,
  30/1 fps, 917 frames, 30.571 s; AAC 48 kHz stereo.
- **Not an upscale.**
- **Not published.**

**On the V1 resolution.** The repository's V1 file is 1080 × 1920 (ffprobe on
`exports/FGW_Zombie_Ant_V1_REVIEW_1080x1920.mp4`: 1080 × 1920, 30 fps, 917 frames). The 512 × 910 copy was most likely
the downscaled preview made when the file was sent through the chat.

**Unchanged:**
- the narration: the same ElevenLabs master, sample for sample;
- the word timings;
- the caption text and timing;
- the runtime.

V1's source is preserved at commit `f3494a23`; this source is V2 (composition `ZombieAntV2`).

## What changed

**First five seconds (rebuilt).**
- **0–0.25 s:** frame 0 is an extreme macro from below with the jaws wide open around the vein. They close over
  frames 1–5, meet the vein at 0.16 s, and bite in until 0.24 s; the vein pinches and the leaf flexes.
- **0.25–0.6 s:** the camera pulls back only to the head and upper body; the legs let go while the jaws stay locked.
- **0.5–0.82 s:** the ant hangs still while the back of its head swells, cracks and splits, and a pale primordium
  pushes out through a collar of mycelium.
- **0.72–1.62 s:** the stalk elongates.
- **1.12–1.9 s:** the reproductive cushion forms and its openings appear.
- **1.88–2.75 s:** the spore falls. Ant #1's leaf is now low, so the spore reaches a walking ant in one short fall,
  with both kept large in frame. No empty forest floor.
- **2.75–3.5 s:** the spore sticks and the camera goes straight in.
- **3.5–5.0 s:** inside the body.

**Infection and muscle control (new, organic).** The V1 x-ray diagram is replaced by a connected sequence:
- **Close in:** looking through the translucent shell into the thorax, there is a dark cavity of body fluid, crossing
  bundles of striated muscle fibres and pale fat body. Fungal cells bud and multiply out from the germ tube's tip,
  spreading between the fibres, and hyphae creep along and wrap them. All of it is clipped to the ant's own body
  outline.
- **Pull out:** the growth spreads through the whole body as uneven cream strands beaded with cells. The brain stays
  intact.
- **Muscle control:** close on a hind leg, its wrapped muscle contracts on each spasm and the leg kicks (strongest on
  "MUSCLES").
- **Return:** back to the intact ant, which now staggers and sways as it walks.
- No neon lines, labels or badges.

**Climb.** The ant is about twice V1's size in frame.
- **Camera:** low, three-quarter and behind, looking up the stem with the target leaf above.
- **Stem:** thicker, so the tripod gait reads as the legs grip and release around it.
- **Glitch fixed:** a camera height constraint removes a few frames where the lens dipped below the floor.
- **Transition:** the camera circles round as the ant turns under the leaf, spread over 0.9 s so it doesn't whip.

**Death grip.** A close ventral view, framed so the stem stays out of the line of sight:
- the ant approaches the vein with the jaws open;
- the jaws close on the vein at 10.97 s, over 0.16 s;
- the vein pinches and the leaf flexes;
- the camera pulls back as the legs let go on "GO", with the jaws still locked.

The front legs now brace the leaf behind the head, so they no longer cross in front of the jaws. This also cleans up
frame 0.

**Signature fungus.** The stalk is redrawn from field photographs of *Ophiocordyceps unilateralis* s.l.:
- **Emergence:** blister, cracks, then the primordium inside a mycelium collar.
- **Stalk:** a wiry, irregular stalk, near-black at the base and warm brown along its length. It has fibrous
  striations and faint growth bands, and a pale swollen tip while it grows that tapers to a sterile tip when mature.
- **Reproductive region:** a lateral cushion of about 30 perithecia whose openings darken and open at maturity.
- **Growth shot:** the time-lapse is now shot from below, the stalk silhouetted against the leaf (not another side
  view).

**Spores.** Shot from the cushion's openings, now drawn smaller with less glow so they aren't enormous. A small group
is followed down, with the camera kept closer (ants below about twice V1's size), and one spore lands on an ant on
"BELOW".

**Final reveal.**
- **26.3 s:** close on one dead ant with its stalk, live ants walking beneath.
- **27.3 s:** a small pull-back brings two or three more into view.
- **28.3 s on:** low among the plants and looking up, a cluster of ten more on surrounding leaves.

The cluster is laid out in the final frame's own screen space, so the nearest ants stay large (about 200–260 px) with
their stalks recognisable. Stages and poses vary. The loop is as in V1: a push up into a nearby leaf, a leaf crossing
the lens, and the opening composition.

**Art direction and movement.**
- Smaller, fainter specular highlights (less plastic).
- A step-by-step body rise and sway in the gait.
- Leg grips and relaxed poses reworked so legs don't cross the face.

**Sound.** Same narration; effects re-cued to the new picture.
- **Jaw contact:** a crunchier chitin snap, micro-cracks and a low thump.
- **New:** a wet tearing crackle when the head splits (both times), and a low organic swell under the stalk
  time-lapse.
- **Mix:** −14.1 LUFS integrated, −2.4 dBFS peak (decoded from the MP4).

## A render bug found and fixed

The first V2 render showed fragments of the previous caption in a few frames after each caption change. Headless
Chrome partly repainted the caption element during the video render; a fresh-page still of the same frame was clean.
Captions are now keyed per caption in their own composited layer.

The fix is verified on the final file against clean single-frame stills:
- **62 frames across the film:** mean difference 2.7 (compression noise), maximum 3.1.
- **57 frames immediately after every caption change:** mean difference 2.7, no residue.

## QA on the final file (`qa/v2/`)

- **ffprobe:** 1080 × 1920, 30 fps, 917 frames, 30.57 s.
- **First 0.5 s** (`first_half_second.jpg`): open jaws at frame 0, closing over frames 1–5, gripping the vein by 0.17 s.
- **Motion scan:** median frame step 4.4. The largest changes are the leaf crossing the lens at 30.37–30.47 s (an
  intended wipe), and the orbit into the bite at 10.63–10.67 s (fast but continuous). No single-frame jumps.
- **Loop seam** (last frame against the first): 7.5, smaller than the opening's own first frame steps (16, the jaws
  closing).
- **Narration (ASR on the MP4):** Zipformer differs only in spelling ("zomby", "spoors on to"). Whisper's whole-file
  pass drops "same way" at the very end; transcribed on its own, the phrase is present.
- **Anatomy:** checked at full resolution at key moments (`key_moments.jpg`) and on the 2 fps sheet. Six legs, two
  antennae, mandibles, petiole and gaster on every ant.

## Still open

- **Not watched or heard in real time.** Everything was checked from frames, measurements and ASR.
- **The close-up tissue reads as stylised.** The thorax is narrow from above, so the view into it is a band rather than
  a full-frame window.
- **The camera move into the death grip is still brisk** at 10.6 s.
- **The graveyard plants are thin twigs and seedlings.** The far understory stays soft.
- **Runway was not used.** All geometry and growth is deterministic Remotion, as the brief specifies for the stalk.
