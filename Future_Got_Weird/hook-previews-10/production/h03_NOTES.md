# HOOK 03: Mantis / horsehair worm (notes)

Output: `exports/FGW_HOOK_03_MANTIS_WORM.mp4`. Source: `source/src/h03/` (Hook.tsx, scene.ts, mantis.tsx, worm.tsx,
env.tsx, timeline.ts, core/). Audio: `tools/audio/h03.py`.

## Shot plan (one continuous shot; word sync from `h03_words.json` via `timeline.ts`)
- **0–0.5 s.** Frame 0 is a large side view of a green mantis mid-plunge, pitched head-down. The front of the
  prothorax, the head and the folded raptorial legs are already under the surface, and the abdomen and wings are
  still in the air. A crown splash, droplets, surface rings and an entrained bubble cloud surround it. The camera starts
  following the plunge down at once, so the waterline rises.
- **0.5–2 s.** The camera is fully underwater and follows the sinking mantis while its legs flail. It pushes in on the
  abdomen. On "mantis" (+0.18 s, about 1.25 s) a soft clearing opens on the abdomen and shows the dark worm coiled
  inside. At about 1.52 s the last segments part and a pale membrane bulges. On "into" (about 1.62 s) the worm's
  pale tip pushes out. By "water" (2.03 s) about 12 mm of worm is out.
- **2–4 s.** The camera tracks along the worm as it comes out ("crawls" at 2.95 s speeds it up). The worm writhes in
  slow sinuous ripples with a searching head, sweeps down and back under the host, and the coil inside the window
  visibly shortens.
- **4–6 s.** The camera pulls back, framed on a soft bounding box of the mantis and the whole outside worm, to show
  the drifting mantis with about 23 cm of thread (roughly three host lengths) curling below it. The worm is still
  coming out, a little coil is still visible inside, and the head is turned toward the viewer. There is no hold.
- Captions: both phrases at capY 330 (top). This is clear of the plunge, the forelegs and the worm throughout.

## Transitions
- Surface split view → underwater follow. The same mantis continues down. New information: it is submerged and
  struggling. The splash, bubbles and waterline carry over.
- Underwater follow → abdomen push-in with the clearing. New information: the worm is coiled inside. The camera
  keeps moving, and the clearing opens on the body in place.
- Push-in → tracking along the emerging worm. New information: the worm exits at the abdomen tip. The abdomen
  stays in frame at the edge.
- Track → pull-back. New information: the true length relative to the host. The mantis and the coil window stay
  in view.

## Science
- **Shown.** A Hierodula-like green mantis, about 78 mm long:
  - a triangular, mobile head with large compound eyes at the upper outer corners (with pseudopupils), thread-like
    antennae, ocelli and palps;
  - a long, narrow prothorax;
  - raptorial forelegs attached under the front of the prothorax (long coxa, spined femur, spined tibia folded into
    it, small tarsus);
  - mid and hind legs attached to the meso- and metathorax, so 6 legs in total;
  - tegmina folded flat over a segmented abdomen that is wider than the thorax, with a stigma and cerci.

  The horsehair worm (Nematomorpha) is 1.0 mm thick and 300 mm long, thinner than the femora. It is smooth, dark
  brown, with no segments, legs or eyes, and has a rounded, slightly paler head end. It lies coiled in the abdomen
  and exits between the terminal segments at the abdomen tip through a membrane gap. It emerges in water, writhing
  in sinuous waves.
- **Deliberately not shown.**
  - The proposed cue (polarised light from water) and the possible horizontal gene transfer.
  - Mating and egg-laying.
  - Any oversized or monstrous worm: the worm is to scale, and only its length is shocking.
- **Simplified.** Emergence takes seconds to minutes in reality and is time-compressed here. The coil inside is a
  stylised double coil.
- **Sources.**
  - Thomas et al. 2002, J. Evol. Biol. (hairworms drive crickets to water).
  - Obayashi et al. 2021, Curr. Biol. (Chordodes and mantids: polarised light).
  - the same group's later report of mantis-derived genes in Chordodes (horizontal gene transfer; not shown, citation to be confirmed).
  - General Nematomorpha morphology (Hanelt et al. 2005, Adv. Parasitol.).

## Assets
- **Reused.**
  - `core/draw3.tsx`, `core/tube.tsx` and `core/frame.ts`, copied from `Future_Got_Weird/zombie-ant/source/src/core/`
    (imports pointed at `shared/`).
  - `shared/three.ts`, `color.ts`, `ink.tsx` and `lib.ts` (keyCR, ss5).
- **New.**
  - The mantis rig (`mantis.tsx`): the hull-built triangular head, raptorial legs, folded wing surface and abdomen
    rims.
  - The worm (`worm.tsx`): an arc-length track, ripple, coil path, and seamless chunked strokes for depth sorting.
  - The pond (`env.tsx`): waterline, crown splash, droplets, rings, bubbles, weed stems, shafts and motes.

## Audio cues (`tools/audio/h03.py`, fx_lufs −27)
| Time (s) | Effect |
|---|---|
| 0.0 | Splash already under way, body thump, entrained bubbles (to 1.3) |
| 0–0.4 | Pond-side air fades out; underwater bed fades in |
| 0.55 / 0.95 / 1.35 | Muffled leg strokes |
| 0.9 + 0.42·i | Single bubbles (the same schedule as the drawn bubbles) |
| about 1.05 | Tension swell under the clearing; low eerie pad from about 0.85 onward |
| 1.52 | Soft membrane pop (segments part) |
| 1.62 | Squelch (tip out) |
| 1.9–2.9 | Slow slither |
| 2.9–4.7 | Faster wet slither under "crawls out" |
| 4.5–6.0 | Easing slither, low swell under the pull-back |

There are no whooshes and no music bed.

## QA (rendered file)
`{"frames": 180, "audio_decoded_s": 6.016, "voice_onset_s": 0.003, "mix_lufs": -16.58, "sample_peak_dbfs": -0.97,
"motion_mean_per_second": [3.577, 2.131, 1.976, 1.201, 1.527, 0.753], "longest_static_run_frames": 0,
"frame_jumps_over_18": [], "all_pass": true}`. All checks pass.

**Fixes between passes:**
- **Pass 1.** The mantis was small and steep in frame 0; it is larger now, with the head entering. Fixed:
  - stray ellipsoid highlights floating outside the abdomen;
  - a zig-zag crown, now smooth lobes;
  - bank shapes leaking below the waterline, now clipped;
  - the worm path dropping out of frame, now an S-track kept under the host;
  - the end framing (the surface strip came back and the mantis was cut off): the mantis now sinks, with soft-box
    fit framing;
  - a far mid leg that read as attached to the prothorax (the mid legs are more lateral now).
- **Pass 2.**
  - The head was a cluster of balls; it is now one triangular hull with the eyes at the upper corners.
  - The worm showed seam ticks every 5 mm: it is now cut from one subdivided curve, with butt-capped opaque passes and
    a uniform width.
  - The tip looked like a cigarette filter: it now has a graded pale tip.
  - The phrase-1 caption overlapped the forelegs at 0.27 s, so both captions moved to the top.
  - The worm left frame at 2.5 s: the camera now follows earlier.

## Known limitations
- From about 2.9 to 4.2 s the camera favours the worm, so only the abdomen (and briefly the legs) of the mantis is
  in frame. The head is off the right edge during that stretch.
- Emergence is time-compressed: the worm comes out at up to about 90 mm/s. The writhing is a procedural ripple, not
  simulated physics.
- The clearing makes the abdomen read partly translucent for the rest of the clip. The coil inside is stylised and
  denser than a real tangle.
- The crown splash is simple, translucent and cup-like. It is visible only in about the first 0.4 s.
- Leg flailing is procedural (sinusoidal); the tarsal claws are not drawn.
- The audio's 0.003 s onset is the splash, not the voice. The voice starts at 0.06 s as recorded.
