# Footage edit plan: shots still waiting for real footage (V2, 2026-10-30)

Nothing below is cleared. Every slot currently plays an illustrated stand-in with an orange **PREVIS** tag. When a
clip is cleared, store it **locally** (never in this public repository), record the grant in
`raw/LICENSES_AND_PROVENANCE.json`, put it under `source/public/footage/`, and fill its slot in
`source/src/data/footage.json` (`file`, `in`, `credit`, `cleared: true`). The film then plays it in place of the
illustration and drops that slot's PREVIS tag. Narration timing does not move. Re-time the slot boundaries only if
the real action needs it.

After V2 the production priority is this list (integration and final sync), not further animation.

| Slot | Film time | Narration over it | What the real clip must show | Likely source |
|---|---|---|---|---|
| **FS-1a** | 0:00.00–0:03.91 | "Japan built a robot with a CHAINSAW for an arm." | the chainsaw **already in contact with the wood** at frame 0: no wind-up, title or intro | JR-EAST-ANN (ANN, 17 Oct 2026) |
| **FS-1b** | 0:03.91–0:08.32 | "And this is real footage of it… Watch the other hand." | the gripper **visibly supporting** the branch (the narration claims real footage here, so this must be real before publishing) | JR-EAST-ANN |
| **FS-1c** | 0:08.32–0:12.22 | "It grabs the branch before the saw touches it. As the blade cuts through," | the saw **continuing through** the cut; **confirm in the clip that the grip came before the cut** (the claim at 0:08) | JR-EAST-ANN |
| **FS-1d** | 0:12.22–0:14.51 | "that claw is still holding the wood." | the branch **separating while the gripper still controls it** | JR-EAST-ANN |
| **FS-1e** | 0:14.51–0:19.70 | "That's important… a terrible combination." | **wider**: both attachments connected to the machine. The dashed hazard "ghost fall" stays an **illustration overlay** (it is not an incident) | JR-EAST-ANN / KAB |
| **FS-2** | 0:19.70–0:32.72 | "But now look at the rest of the robot… every movement." | one continuous reveal if possible: upper body → no legs → boom → rail vehicle → cabin. If the footage cuts, keep cuts in this order and in this direction | JR-EAST-ANN / KAB |
| **FS-3** | 0:38.64–1:07.00 | "It looks like a giant humanoid robot… under one person's control." | **one operation**: the claw closes on a branch; the saw cuts at a separate point; the cut section stays in the claw; the arm lifts it clear. Avoid repeated cuts to the same stationary saw | JR-EAST-ANN / FNN; JR West's official demo only if **labelled JR West** |
| **FS-4a** | 2:19.58–2:25.17 | "And there's STILL a human controlling that chainsaw. That might actually be the most interesting part." | the saw at rest or stopping; the machine with its cabin | JR-EAST-ANN |
| **FS-4b** | 2:29.33–2:34.83 | "…a pair of giant mechanical arms." | the claw closing, the saw arm coming into position and cutting; ideally ending wide on the vehicle and cabin. Hold the last action; no outro | JR-EAST-ANN |

Shots that stay **original illustration** (they are explanations or reconstructions, not footage stand-ins):

- the cabin interiors (0:32.72–0:38.64, 1:07.00–1:17.52 and 1:23.30–1:28.13, 2:25.17–2:29.33): labelled reconstructions. Replace them only with **official cabin footage**, labelled with its own machine and company;
- the bilateral-control loop (1:07–1:28), labelled as the principle documented for JR West's related machine;
- the fingertip/steel-arms metaphor (1:28–1:36), the electrified-line safety scene (1:36–1:53) and the depot line-up (1:53–2:19).

## Sound when footage arrives

The mix places the chainsaw from the picture's own cut times (`audio/cues_v2.json`). With real footage:

- re-export the cues and re-run `tools/make_audio.py` with the clip's actual contact and break-through times;
- or use the clip's own saw sound (if its licence covers the audio), kept under the voice. The mix already ducks
  the saw about 13 dB below the narration while words are spoken.
