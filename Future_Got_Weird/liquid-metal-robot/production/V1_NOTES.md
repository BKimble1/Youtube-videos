# Liquid Metal Robot V1: production notes

Output: `exports/FGW_Liquid_Metal_Robot_V1_REVIEW_1080x1920.mp4` (26.0 s, 780 frames). Source: `source/src/v1/`
(`Film.tsx` renderer and camera; `timeline.ts` beats and paths; `opening.tsx` + `motion.ts` the preview's opening;
`macro.tsx` cross-section; `props.tsx` / `props2.tsx` set pieces; `liquid.tsx` metal; `figure.tsx` figure).
Every beat is read from `source/src/data/words.json` (`timeline.ts` `T`); audio cues mirror it in `tools/audio/mix_v1.py`.

It is one continuous camera on one bench, following one piece of metal: figure → puddle → recast figure → section →
puddle → slug → grip.

## Scene plan and word sync

| Scene | Time | Words | What happens |
|---|---|---|---|
| 1 | 0–2.4 | "melts" 1.16, "cage" 1.88 | This is the winning preview, kept frame for frame. The film's time is mapped onto the preview's by a smooth warp that lands its beats on this narration's words (`warpPrev`). On frame 0 the figure is in the cage on the coil, feet already liquid. It melts from the soles up, the magnet arrives, and the liquid necks out between the front-right bars and re-merges outside. |
| 2 | 2.4–5.0 | "then" 2.55, "remolded" 2.98, "shape" 3.90 | The magnet drags the pool onto the open mould and down the figure-shaped cavity. A freeze front turns it matte. The magnet clacks onto the head, tilts the figure out and sets it down standing outside the cage (shape + 1.05 s ≈ 4.95). The lift is compressed from the preview's 1.1 s to 0.8 s. |
| 3 | 5.0–8.5 | "gallium" 5.07, "magnetic particles" 6.42–7.48 | The camera pushes continuously (exponential zoom, pitching to face-on) into the standing figure's chest. A cut window opens in its surface ("gallium" + 0.2) and the camera travels into a polished section: a gallium grain mosaic with angular NdFeB microparticles (faceted, a lit edge and a shadowed edge, standing slightly proud of the softer matrix), polishing marks and a moving sheen. The deepest point is particles − 0.28 s. Then the camera pulls back as the window closes. |
| 4 | 7.9–13.6 | "magnetic field" 7.91, "heats" 8.63, "liquid" 9.36, "steers" 10.78, "cools" 12.22, "hardens" 12.91 | The coil LED and current sheen come on ("magnetic"). The figure softens from the soles up, matte to mirror, and slumps into a puddle by "liquid" + 0.25. The magnet returns and steers the puddle along an S-curve around the cage. The coil switches off (cools − 0.3), and a freeze front sweeps the puddle mirror → matte (cools → hardens + 0.45). The magnet then slides it as a rigid slug that keeps its shape, which shows it is solid. |
| 5 | 13.6–17.3 | "But researchers" 14.17, "stranger" 16.16–16.80 | Pulling back reveals the clear acrylic stage beside the pad and the transparent stomach model on it: a J-shaped clear shell with an esophagus tube and a duodenum stub, and a blue ball inside over a second flat coil. The magnet draws the slug across the stage into the open tube. |
| 6 | 17.3–22.4 | "Inside a model stomach" 17.29, "melted" 18.77, "around" 19.20, "hardened" 20.65, "carried … out" 21.36–22.42 | The camera pushes in through the shell as the slug slides to the ball. The stage coil switches on (melted − 0.25), and the slug melts from the coil side. The metal flows round both sides of the ball, the two flows meet behind it (≈19.97), and it climbs into a three-claw cup above the equator. The coil switches off and a freeze front turns the grip matte (hardened − 0.1 → + 0.62). The magnet, outside the model above the shell, pulls the solid grip with the ball back toward the cardia and into the tube. |
| 7 | 22.4–26.0 | "Would you let one inside you?" 22.93–24.22 | The grip and ball slide out of the tube onto the stage and pad. The camera pulls back (the grip is tiny next to the model), then drifts back to the empty cage, with the gripped ball still moving on the pad beside it. The last frame shows the cage, coil and mould again, leading back into frame 0's cage. |

## Transitions (outgoing → incoming → new information → kept)

1. Solid figure → melting figure → the phase change → figure, cage, camera (preview).
2. Puddle → necks between bars → escape through gaps → puddle, bars (preview).
3. Pool → mould fill → freeze → recast figure → magnet, mould, figure silhouette (preview).
4. Figure standing outside the cage → push into its chest → cut window → particles in a gallium matrix → the same figure and camera axis (a continuous zoom; the window is drawn in the figure's own plane).
5. Section → pull back out (window closes) → coil switches on → heating → the same figure, now melting where it stands.
6. Melted puddle → magnet steering → controlled direction → puddle and magnet.
7. Liquid puddle → freeze front → rigid slug → solidification → same object, still being pulled.
8. Slug on the pad → pull-back → stage and stomach model on the same bench → the second experiment → slug and magnet (the same slug is tracked into the tube).
9. Slug at the ball → stage coil on → melt and wrap → capture → ball and metal in one shot.
10. Liquid cup → freeze front → solid grip, magnetically pulled → retrieval → grip and ball.
11. Grip leaving the model → pull-back → scale → drift back to the cage → loop to the opening's cage.

## Science notes

- Shown: gallium with embedded NdFeB microparticles (MPTM; Q. Wang et al., *Matter* 2023, DOI 10.1016/j.matt.2022.12.003).
  Heating is only ever an induction coil's alternating field (flat pancake coils under glass or acrylic, with a status LED and a faint
  current sheen). It is shown as a matte → mirror change and slumping, with no rings, flames or glow.
  All motion is a separate hand-held magnet on a rod (out of frame). Cooling is coil off plus a freeze front, giving a matte solid that
  then moves rigidly. The recast uses an open mould. The retrieval uses a transparent stomach model. The metal softens and wraps a small
  ball, solidifies into a grip, and the external magnet pulls it out.
- Not shown: no patient, clinic or body, no autonomy (the metal only moves when the magnet does), no self-reconstruction, and no other materials.
- Simplifications: the scale and timing are compressed. Melting around the ball is shown more fully than "slightly" (a cup to just above the
  equator) so the grip reads. The model is a stylised J-shaped clear shell with an open esophagus tube. The section is illustrative: grain
  and particle sizes are plausible (particles ~10–60 µm), not measured from the paper. Magnetisation directions are not shown.

## Audio cue list (`tools/audio/mix_v1.py`, fx bus −27 LUFS, ducked under the voice)

- Ambience: room tone; coil hum only while a field is on (0–3.18, 7.91–11.92, 18.52–20.55 s); a faint hollow air for the stomach model (14.3–24.8 s).
- Scene 1: melt crackle, sag and slump squelches, 4 drips, flow, a squeeze per gap, 3 pinch-off pops, a merge blip.
- Scene 2: drag flow, a relay click (coil off), the fill, freeze crackle, a magnet clack (4.37), a tilt creak, a set-down click and thump (4.95), a release click (5.03).
- Scene 3: a low tonal swell on the push-in, a glassy shimmer as the window opens, small crystalline ticks on "magnetic".
- Scene 4: a relay (coil on 7.91), softening crackle, a slump squelch, a steered flow with two turn squelches, a relay (off), a solidification crackle, a quiet rigid slide.
- Scenes 5–7: a tick as the slug enters the tube, a slide, a relay (stage coil on), softening, the wrap flow, a squelch on "around",
  a capture blip and thump as the flows meet (≈19.97), the grip-hardening crackle and a set click, the slide out, and a tick at the tube exit (23.75).
- No music, no whooshes. The mix is −16.2 LUFS integrated (voice −15.9), peak −0.94 dBFS.

## QA passes and fixes (all on rendered frames)

- **Stills pass 0** (before any MP4):
  - The particles read as pits, so I made them fewer, larger and faceted, with a lit facet and edge.
  - The wrap read as a fried egg (a flat puddle around a yellow yolk), so I redesigned it: the main mass drains into a film that climbs the sphere, and the ball is now blue.
  - The stage coil read as big rings in close-ups, so I dimmed it under a darker tint.
  - The model shell outlines were jagged, so I upsampled them with smooth curves.
- **Render 1 review:**
  - The large flat liquid showed contour terracing, so I gave the flat height gradient an exactly flat plateau and blurred the lighting more.
  - The grip read like an "eyeball in a socket", so I gave it a scalloped three-claw rim, with a matching mask so the claws pass in front of the ball.
  - The stomach model read as a pink "C", so I made it a shallower J shape and added a duodenum stub.
  - The shell tint muddied close-ups, so its opacity now falls with zoom.
  - The acrylic stage's side faces read as glass walls, so I made them fainter.
  - The ending sat on a static wide shot, so the camera now drifts back to the cage.
- **Render 2 review:** compared side by side with the preview. The V1 melt lagged the preview by about 0.15 s in the first half-second, because the time warp eased in from frame 0. I added lead-in and lead-out keys so the warp runs at speed 1, and V1 now matches the preview frame for frame at 0.25/0.5/0.75/1.0/1.5 s.
- **Render 3 (final):** `qa_clip.py` all pass. I checked the brief's sample times, the scene-3 and scene-5 to 7 transitions as frame strips, and full-resolution frames at 7.0, 20.3 and 21.4 s. See `V1_QA_REPORT.md`.
