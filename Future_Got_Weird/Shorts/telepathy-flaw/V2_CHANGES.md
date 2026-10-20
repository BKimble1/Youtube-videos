# The Telepathy Flaw — V2 (substantive animation pass)

R1 is untouched (its exports, source, narration and QA are all still in this folder). V2 lives beside it:
`source/src/v2/` (art, choreography, world, film), compositions `TelepathyFlawV2` (captioned) and `TelepathyFlawV2Clean`.

**28.000 s, 840 frames, 30 fps. 1080×1920 review render and a native 2160×3840 render. Same 81 locked words, same take C1.**

## What was wrong in R1 and what V2 does instead
| R1 | V2 |
|---|---|
| repeated frontal portraits; brain patch crossing the upper face, dark bars like extra eyebrows | a dedicated three-quarter **profile drawing** of the sender (same proportions, hair, skin, tee). The brain lives only in a window cut through the crown (hair, scalp, skull) above and behind the eyes; the face is outside every section |
| chip "perched on the hairline" | the implant sits in a shaved skin pad at the crown, in a skull recess with case thickness, flange (contact edge), local shadow and a lens |
| labels and signals animating on top of the same face | one continuous **column** drawing seen at three scales: a small window in the head, the implant macro (seat, decoder), and a full-frame cortical interior with depth planes. The journey is head → implant → threads → cortex → decoder → packet → receiver |
| abrupt neck window while the camera scaled; ghost of the message card | a throat lens driven from the same clock as the camera; it opens after the camera arrives, the folds stay inactive, and it is closed before the crown window opens. The message card is gone before the camera moves |
| purple balloon cloud, big warning card | no cloud. A red impulse enters the **same thread** as the blue ones, the threads wobble, a 0.27 s (8 frame) dark bust interrupts the picture, the faulty chip has already made one red packet. UNFILTERED THOUGHT DETECTED shows once for 1.15 s, to one side, after the packet is out |
| large loading card above the receiver | compact AR card at the receiver's eye line; she tracks the packet, recognises after arrival, draws back (body, head, brows, mouth, scale) |
| repeated "Hey" screen | one "Hey" (the hook). The second packet is a quick glint at her glasses |
| cancel control invisible until needed, five-frame overlap with captions | an "undo send" chip established after the first message; for the dark message its ring is already spent and a small track shows the red packet beyond the gate. 0 caption collisions except 2 transient frames (see qa) |
| 30 s with a 2.6 s reset | 28.0 s: speech ends 27.39 s, the return starts under the last clause (pull-back with the late tap on a dead control, 26.8 s), cuts to the implant lens at 27.4 s and pulls out into frame 0. Window aperture, camera, pulses and pose all land on the frame-0 state (picture seam step 0.41 vs 0.6–2.6 around it) |

## Shot table (seconds)
| time | narration | picture |
|---|---|---|
| 0.00–0.70 | This brain chip | tight profile head, implant at the crown, crown window opening, a blue pulse already in flight along a thread |
| 0.70–1.45 | lets you talk | push into the implant: seat, contact edge, threads; pulse → decoder → bubble at the lens |
| 1.45–2.34 | to someone | follow the packet out of the lens and across the room (camera tracks it) |
| 2.34–3.10 | just by thinking | two-shot, sender's lips closed; the receiver reads the small "Hey" at her eye line, smiles; undo chip established |
| 3.10–5.00 | Instead of using vocal cords, | tilt to the throat; lens opens (3.55–4.0); folds still, then cool; |
| 5.00–5.65 | | tilt up, lens closes (4.95–5.4), crown window opens |
| 5.65–6.45 | the chip reads | dive through the window |
| 6.45–7.00 | neural impulses | cortical interior, hero pulses with trails on several threads |
| 7.00–8.00 | in your motor cortex, | one localized strip glows (tag "Motor cortex"), the rest dims |
| 8.00–10.00 | translating your thoughts into direct messages | the pulse climbs a thread into the decoder: waveform smoothed at three gates → one bubble |
| 10.00–11.60 | instantly. | packet leaves the lens, cut on its motion to the receiver (tracks, chime, smile), pull back |
| 11.60–13.10 | It works seamlessly— | calm two-shot, live-link orbs on the route |
| 13.10–13.95 | until | threads view: a red impulse on the same thread; wobble; music bed already gone |
| 13.95–14.50 | your brain generates | sender close-up: eyes lock, mouth tightens, shoulders tighten |
| 14.50–14.97 | an intrusive | decoder; the dark bust for 0.27 s; red wave → red bubble |
| 14.97–15.45 | thought. | red packet leaves the lens; pull-out; the sender winces |
| 15.45–16.60 | | warning card, once, 1.15 s |
| 16.70–18.00 | Humans have thousands of dark, | close-up: sweat, stare |
| 18.00–19.85 | unwanted thoughts every single day | the red packet crawls along the trace |
| 19.85–21.45 | that we never intend to act on. | cancel close-up: denied tap, ring spent, red packet already beyond the gate |
| 21.84–23.00 | The chip can't tell the difference | decoder: a blue and a red message through the same three gates, identical flashes |
| 23.00–24.55 | between what you wanted to say… | the intended "Hey" waits at the sender; the red packet drifts on |
| 24.55–26.80 | and the dark thought you were desperately | receiver close-up: tracks it, arrival 25.95, card (silhouette, Message Delivered), recognition, recoil |
| 26.80–27.40 | trying to bury. | pull back: the sender's late tap on a dead control |
| 27.40–28.00 | | red implant lens, pull-out, the window settles on frame 0 |

## Checks that were performed (all by measurement or by looking at decoded stills)
- contact sheets of the review MP4 every 8th frame (`qa/v2/sheets/`), phone-size sheet with an *approximate* Shorts overlay;
- stills at full size for the opening, decoder, cancel close-up, receiver recoil, two-shot, and bursts either side of every hard cut;
- motion scan with the cut list (`qa/v2/MOTION_SCAN.json`): remaining spikes are the intended camera whips and the silhouette's in/out;
- caption/UI collision scan (`qa/v2/LAYOUT_CHECK.json`): 835 captioned frames; transient overlaps: sender eyes at 6.0 s and 27.63 s (during zooms), cancel chip 27.07–27.10 s;
- loop seam (`qa/v2/seam/`): last frame vs frame 0 mean absolute difference 0.79 (full size), picture step at the seam 0.41, audio step at the seam 0.03 vs 0.29 elsewhere;
- loudness −16.0 LUFS, true peak −1.2 dBTP, no clipped samples (`qa/v2/AUDIO_QA.json`);
- narration: the V2 stem equals the C1 take times a constant gain (residual −58 dB), speech 0.08–27.39 s.

## Not done / cannot be claimed
Nothing was watched in real time or listened to. No headphone or phone-speaker check, no three-repeat playback (a `seam_check_x3.mp4` is produced for the creator), no platform preview. The Shorts interface overlay is an estimate.
