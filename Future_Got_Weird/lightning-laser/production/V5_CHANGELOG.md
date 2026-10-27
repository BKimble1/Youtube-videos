# Lightning Laser V5: change log (against V4)

V5 is the final-polish pass. It keeps the same narration, voice, captions, mix and 33.50 s / 30 fps timeline: the
delivered files carry the locked audio stream packet for packet (`qa/v5/audio_identity.json`). V5 rebuilds the hook,
adds distinct shots through the explanation, makes the rod comparison explicit, and loops through the control room.

- **Composition:** `LightningLaserV5`. `LightningLaserV4` and `LightningLaserV3` still render for comparison.
- **Brief:** `production/V5_BRIEF.md`.
- **Plan:** `production/V5_PLAN.md`.

## Timestamped changes

| Time (s) | Narration | V4 | V5 |
|---|---|---|---|
| 0.00–0.27 | "They fired a LASER" | The telescope beside the station, slow | **Hook, inside the control room.** A medium close-up, already pushing in. The machine is charging: the LED bar climbs and sparks fly. Her hand comes up and the index fingertip lands on the guarded FIRE cap at 0.2 s ("fired"). The cap goes in and lights. |
| 0.27–1.20 | (cont.) | | The relay fires. Outside the window the beam ignites and races up past the tower into the storm: a thin cyan line with packets. Cyan light falls on her face as she looks up at it. |
| 1.20–1.75 | "into a THUNDER-" | Crane up the beam | **The surge.** Arcs (white core, violet edges) crawl from the panel to her fingertip, sparks burst from the seams, and the room light stutters. |
| 1.75–1.90 | "-STORM—" (the loudest crack) | In-cloud flash | **The x-ray flash.** A split-second, stylised electric glitch: a white-violet flash, RGB split and tear bands. For 3 frames she flickers into a glowing cartoon skeleton inside her own outline, then she snaps her hand away. |
| 1.90–2.25 | | | She is startled and looks up as the thunder flash lights the window. Then a fast **whip upward** with motion blur. |
| 2.25–2.66 | | | A cut on the whip to outside. The camera **rockets up beside the tower and the beam** into a huge, dark, lit storm deck, with in-cloud lightning away from the beam. |
| 2.66–4.31 | "and the lightning FOLLOWED it." | V4's opening view | The upward leader incepts at the rod tip as the flashes end. It climbs the cyan path, leaves the line and branches, and connects at 3.52, with re-strokes at 3.64 and 3.83. From 4.2 the frame is exactly V3/V4's opening view, B's start. |
| 4.31–6.31 | "You see, air normally RESISTS" | V3's B | Unchanged. |
| 6.31–7.81 | "the flow of electricity." | One molecular view held 2.7 s | **New storm-scale shot.** A leader fights up from a summit through ordinary air in jerky, shrinking steps, with side probes dying back and forks fading, then stalls. There is no laser in this shot. |
| 7.81–8.95 | "But this MACHINE fired" | The operator's press (now in the hook) | **The machine.** The enclosure wall in the rain, with its pump unit, lamps and vents. It charges on the hum and fires on the click and relay: cyan light pours from the viewport and vents, and the first packets leave. One push goes through the viewport onto the optics bench, so the cut to the optics cutaway reads as "inside". |
| 8.95–13.33 | | V3's C2, C3, D1 and D2 | Unchanged. |
| 13.33–14.64 | "and HEATING a narrow channel" | One molecular scene | **New cross-section of the sky along the beam.** Pulse after pulse passes. Molecules glitter as each one ionizes them, then are pushed outward step by step. The air thins, and a restrained warm, lower-density channel forms round the cyan line. |
| 14.64–15.83 | "through the sky." | (same scene) | **New storm wide.** The camera hangs in the air beside the tower top and rises with the pulses. The warm channel runs from the rod tip up into the cloud base and lights it. A crawler flickers across the deck. |
| 15.83–16.92 | "That gave electricity" | (same scene) | **New view from near the rod tip.** Corona builds and the leader leaps from the tip up the channel. The camera rises with it, so the cut into the molecular leader (16.92) reads as "closer, into the channel". |
| 16.92–25.61 | E2, F | V4 | Unchanged: V3's molecular leader, then V4's three-beat demonstration. |
| 25.61–26.64 | "A normal lightning ROD" | A distant strike behind the hills | **The rod doing its job.** A downward stepped leader comes all the way down from the cloud to the house rod's tip. The return stroke lights the night, and current runs down the conductor to the earth clamp. |
| 26.64–28.94 | "only reaches as high / as its metal TIP." | One push to the tip | A cut-in, then a rise along the conductor to the rod tip, settled at (540, 820). |
| 28.94–30.78 | "But these scientists EXTENDED one" | Match cut to the tower tip | **Split comparison** under one shared sky and horizon. Left: the house rod, where lightning meets the metal only at its tip (a strike at 29.5). Right: the tower, its laser channel growing high into the sky, and a guided leader following it ("EXTENDED"). |
| 30.78–31.88 | "into the SKY—" | Whole-system wide | **Payoff wide.** The channel is large in frame, from the rod tip into the cloud deck. The guided leader reaches the cloud base and lightning crawls through it. There is a surge on "SKY" and packets on the payoff ticks. |
| 31.88–33.50 | "using the AIR ITSELF." | Whole-system wide held | **Loop shot in the control room.** She watches the glowing channel through the window. The machine starts charging again, the beam drops to standby, and her hand travels back toward FIRE. Frame 0 continues it: the press at 0.2 s. |

## Faster hook (client note, 27 Oct)

The press, the shock and the lightning now all land inside the first two seconds; before, they took about 3.5 s.

| Time (s) | Event |
|---|---|
| 0.2 | The fingertip hits FIRE. |
| 0.27 | The beam ignites. |
| 0.55–0.7 | The surge arcs build. |
| 0.70–0.85 | The x-ray skeleton flash, at real speed. |
| 0.85–1.05 | The recoil, then the whip upward. |
| 1.05 | Outside: the camera rockets up the beam. |
| 1.5 | The leader leaves the rod tip. |
| 1.75 | The leader connects along the beam on the loud crack. |

From 1.75 the shot is V3's opening view. Its restrikes at 3.52, 3.64 and 3.83 fall on their sounds, and B still starts
at 4.31.

How it is done: the hook's own shots play on a smooth time warp (`v5/Hook5.tsx` `hookT`). Near frame 0 the warp runs
at real time, so the loop from the control-room shot into the press is unchanged.

The skeleton flash no longer lands on a sound; the loud crack now marks the connection. The narration and mix are
unchanged.

## Faster "FOLLOWED it" (client note, 27 Oct)

Before this change, the connected bolt held in one wide view for about 2.5 s (1.75–4.31). Now:

| Time (s) | Shot |
|---|---|
| 1.75–2.52 | The wide view of the connection. |
| 2.52 | Cut on the caption change. |
| 2.52–3.52 | A close shot rushes up the guided section with the bolt (`v5/Hook5_follow.tsx`). The bolt hugs the cyan line inside the warm channel, and the branching grows large at the top. |
| 3.52 | Cut back to the wide on the restrike crack. The re-strokes flash on their sounds, and B starts from the same view at 4.31. |

## Verification

- **Audio identity.** The audio packets and decoded PCM are identical to the locked track (V2's review stream),
  with zero lag against `mix_v2.wav`.
- **Stream metadata.**
  - Review: 1080×1920, 30/1, 1005 frames.
  - Master: 2160×3840, rendered natively at 2×.
- **Review rounds.** One round of independent review of the rendered file, with a skeptic re-check of every finding,
  then one fix round. The fixes were re-checked in the re-rendered file from labelled strips; no second independent
  review was run.
  - **Major finding:** one. The pressing arm did not read as a connected limb, and the x-ray bones repeated
    it. It is fixed: the press is re-solved with shoulder, elbow, wrist and fingertip on the cap, and the skeleton is
    re-posed with a real elbow and spine.
  - **Minor findings, also fixed:** the window beam (now a cyan line), standby before ignition, the in-cloud flashes
    competing with the leader, the machine's flat light, B2's conservative leader, D4's dim locked-off wide, and the
    payoff wide's size.
- **Contracts.**
  - A → B: frames 126–131 are pixel-identical to V3.
  - The loop H3 → frame 0 uses one continuous room camera and performance.
- **Not watched in real time.** Nobody has watched it in real time with sound: this environment has no display or
  speakers. The rendered MP4 was checked through labelled frame strips, full-resolution stills, a motion scan and
  audio hashes.

## Open issues (honest)

| Area | Issue |
|---|---|
| The skeleton flash | A stylised accent for the surge. A viewer may read it as the operator being shocked by the machine, which is a dramatisation, not something the real experiment did. |
| Photosensitivity | The hook has two full-frame flashes within 0.1 s at 1.77 s (frames 53 and 56; frame 56 is now on the dark room). Analysis puts this within the "3 flashes per second" guideline but without much margin. A formal flash check (for example Harding) is recommended before publishing. |
| B2 | The leader in the ordinary-air shot climbs from a summit rather than descending from the cloud, so its direction continues B's upward-right streamer. |
| The house strike | Its sound in the locked mix is quiet ("distant strike"), so it is staged at a distance, with only 3 frames of visible descent before the return stroke at 25.74. |
| Silent lightning | The split's left-panel strike and the in-cloud flashes in D4 and the payoff have no crack of their own in the mix. They are kept modest. |
| E2 and F | Unchanged from V4 (8.7 s). |
