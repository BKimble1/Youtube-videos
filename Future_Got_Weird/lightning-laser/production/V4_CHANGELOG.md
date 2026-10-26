# Lightning Laser V4: change log (against V3)

V4 is a focused finishing pass: a hook that develops, and an evidence sequence that no longer replays the opening.
Everything else is V3's.

**Unchanged:**
- the narration, voice recording, caption wording and timing;
- the whole mix;
- the 33.50 s / 30 fps / 1005-frame timeline.

The delivered files carry the locked audio stream packet for packet (`qa/v4/audio_identity.json`).

**V3 for comparison:**
- the files: `exports/FGW_Lightning_Laser_V3_REVIEW_1080x1920.mp4` and `exports/FGW_Lightning_Laser_V3_MASTER_2160x3840.mp4`;
- the composition: `LightningLaserV3`, which still renders from the same source.

## Timestamped changes

| Time (s) | Narration | V3 | V4 |
|---|---|---|---|
| 0.00–0.30 | "They fired a LASER" | One distant tower view with a bolt already climbing and connecting at 1.75. | **A1:** a closer view of the launch. The telescope fires low-left, with pulses leaving its exit window. The thin cyan beam rises up and to the right past a new summit station (lit windows, door, railing; human scale) to the tower. The laser is active at frame 0. |
| 0.30–2.40 | "…into a THUNDERSTORM—" | (same view) | **A2:** one crane up the same beam into the storm. It is slow while the station and telescope leave the frame, then rises over the summit, with the tower passing on the right. It lands on V3's opening framing. On the loud crack (1.75), lightning flashes inside the cloud deck: a local flash with a thin white core, away from the beam and the tower. |
| 2.40–4.31 | "and the lightning FOLLOWED it." | (same view; the completed bolt flickers) | **A3:** the field builds at the rod tip, and the upward leader incepts at 2.47. It climbs the cyan path through the guided section (to 3.26, on "FOLLOWED"), then leaves the line and branches to the cloud. It connects at 3.52, with re-strokes at 3.64 and 3.83 down the guided channel. A warm band shows round the guided section. From 4.2 the frame is V3's opening exactly (B's start). |
| 4.31–9.67 | B, C1, C2 | — | Unchanged. The station is consistent in every view that can see it; it is out of frame in B and in C1's window. The fizz at B's start is now a feathered corona, not a flat disc (V3's A-1). |
| 9.67–11.42 | "…every second," | C3 opens on a giant telescope (about 38 m) | C3 opens close on the telescope at its physical size (about 2.3 m), then cranes up the beam past the station and the tower and pushes into one packet. The hand-off to D is unchanged. |
| 11.42–18.79 | D, E | — | Unchanged. |
| 18.79–20.45 | "So when lightning erupted UPWARD" | E's pull-out returns to the wide demonstration view (the opening's composition). | **F1:** E's pull-out carries on and settles on a **closer view of the tower's rod tip**, with the cyan line and warm band leaving it. The field builds, and the leader incepts at the tip (19.55) and emerges upward along the line. |
| 20.45–22.20 | "from a nearby TOWER, / part of the bolt" | (same wide view) | **F2:** one crane that rises with the advancing leader up the channel, through the guided section. The tower drops out of frame below. Where the guidance ends, the bolt turns decisively off the line, branches to the cloud and connects (21.85) with local light. The camera settles closer and higher than the opening, on where the route ends. |
| 22.20–23.00 | "followed that CHANNEL" | (same wide view) | The guided section is the brightest part, white with cyan edges along the line, with surges on "followed" and "channel". The branching above is dimmer. |
| 23.00–25.61 | "…CHANNEL / for over 160 FEET." | A 10 % widening of the same view, with the bracket | **F3:** one pull-back, down and back, to a scaled wide that is not the opening's composition. It shows the whole tower from its base, the station's lit windows and the telescope's glow on the terrace, the bracket on the guided section only (grown on "one hundred", label on "sixty"), and the bolt to the cloud. The afterglow stays alive until the cut. |
| 25.61–28.94 | G | — | Unchanged (the house rod). |
| 28.94–30.74 | "But these scientists EXTENDED one" | The channel appears as a soft blob. | The channel grows from the rod tip as a narrow warm band along the axis (V3's GH-1). |
| 30.74–33.50 | "into the SKY— / using the AIR ITSELF." | A low whole-system view, then a crane back onto the opening camera for an exact loop. | **H2:** one cut to the whole system: the telescope firing beside the station, the tower on its own base, and the extended warm channel above the rod tip. Packets leave on the payoff ticks. The view holds, with a slow creep, so the channel stays readable through "using the AIR ITSELF" to the last frame. |
| 33.50 → 0 | (loop) | Exact continuation | **One cut** on the same beam, which runs up and to the right on both sides, into A1's closer view of the launch. The brief puts the final explanation first. With a 2.3 m telescope and a 124 m tower, no single framing shows both a readable telescope and the channel above the tip. |

## Other fixes

| Fix | Where |
|---|---|
| Tower: the lowest lattice bay no longer pokes through ring 2's deck (V3's F-1) | `v3/Scene3.tsx` `Tower3D` |
| Tower: the mast is no longer drawn through the pod drum from below | `v3/Scene3.tsx` `Tower3D` |
| Summit rock: facets reaching behind the camera are clipped, not dropped (no one-frame hole) | `v3/Scene3_ground.tsx` |
| B's fizz: a feathered falloff with corona strokes instead of a hard lavender disc | `v3/Air3_leader.tsx` |

These shared fixes also change V3's own renders slightly, where those views show them. The delivered V3 files are
unchanged.

## Not changed, by design

- The narration and the audio.
- The machine interior and the operator.
- The molecular explanation (B, D, E) and the house rod (G).
