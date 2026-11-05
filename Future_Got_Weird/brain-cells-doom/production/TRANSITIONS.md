# V1 transition list

This list follows the FGW editing rules. It has one row per camera transition in the order they play, with the
verdict for each.

The film has **no cuts**. It is one camera path through one connected world:

- the game monitor;
- the control-software monitor below it;
- the CL1 on the bench, with the PC tower beside it;
- nested in the CL1's headstage, the chip and its culture.

Two hidden changes happen inside the game itself, at 9.0 s and 24.0 s. Both fall while the game monitor is entirely
out of frame; `tools/export_cues.ts` measures a game-screen area of 0 there.

| # | Time (s) | Outgoing → incoming | New information | Verdict |
|---|---|---|---|---|
| 1 | 0.25–0.78 | Gameplay (full frame) → the monitor, then the bench below | The game is on a screen in a lab, wired to unusual hardware | keep (hook) |
| 2 | 0.78–1.18 | Bench → CL1 lid → headstage → carrier → well → electrode array → neurons | Living cells on a chip, inside that device | keep (hook) |
| 3 | 1.18–1.85 | Electrode 26 being stimulated → response volley at the FIRE group (32–34) → the FIRE lead | Stimulation in, distinct spikes back, picked up by an electrode | keep (one drift, no cut) |
| 4 | 1.85–2.22 | Ride the amber signal: FIRE lead → pads → headstage → cable → PC → DECODE panel | The recording leaves the chip and reaches software | keep |
| 5 | 2.22–2.55 | DECODE: the FIRE lamp lights | Software interprets the activity as one command | keep |
| 6 | 2.55–2.95 | Command pulse rides up into the game; the gun fires | Cause → effect is complete | keep |
| 7 | 2.95–3.50 | Game → two-shot of game, software and CL1, with a lens on the living culture | The whole loop seen at once, joined by the hardware (not a split screen) | keep |
| 8 | 3.50–4.62 | Two-shot (the game turns) → encoder panel → ride the cyan stimulation down the cable into electrode 26 | Game state goes back into the cells | keep: completes the second loop and leads into the explanation |
| 9 | 4.62–5.00 | Stimulation at 26 → response at FIRE on "shoot" | The response that causes the next shot | keep |
| 10 | 5.00–6.70 | Neurons → array → well → carrier → headstage → CL1 → the whole lab | "Scientists actually did it": the real device in a real lab | keep |
| 11 | 7.62–9.35 | Lab → into the CL1's clear enclosure (labels: nutrient medium, pump, kept at 37 °C) → headstage | A machine, not a head, keeps the cells alive | keep |
| 12 | 9.35–9.95 | Headstage → microscope field (iris and focus pull, phase contrast) | What the culture on the electrodes actually looks like | keep |
| 13 | 10.02–10.70 | Local cross-section under the field, aligned to the electrodes on the cut line | The cells sit on the electrodes, on a glass chip | keep (local reveal, no cut) |
| 14 | 10.70–11.85 | Out of the chip, up past the software screen to the game; an enemy enters on the left | The game's state is the input | keep |
| 15 | 11.85–12.30 | Game → ENCODE panel: "enemy LEFT", the stimulation pattern | Software encodes the state; the neurons don't see the screen | keep |
| 16 | 12.30–12.78 | Ride cyan through the PC, the cable and the headstage into the INPUT electrodes | "...electrical signals into them" | keep |
| 17 | 12.78–13.75 | INPUT electrodes stimulated → out to the whole array with the INPUT, MOVE, TURN and FIRE groups outlined | Where inputs go in and where outputs are read | keep |
| 18 | 13.75–14.85 | Volleys at MOVE, TURN and FIRE ("fire back"), drift to the FIRE lead | The neurons' own activity, recorded | keep |
| 19 | 14.85–15.62 | Ride amber out to the software | "Software translates..." | keep |
| 20 | 15.62–17.10 | RECORD raster and DECODE panel → both screens | Spike counts become commands | keep |
| 21 | 17.10–19.29 | Hold on both screens: MOVE (17.36), TURN (17.84), FIRE (18.41) light and the game obeys | Each command's effect | keep |
| 22 | 19.29–21.00 | Push to the game: clumsy turns, two shots into the wall, an enemy from the right, a late reaction, hit | "Terrible at the game" (dramatized) | keep |
| 23 | 21.00–23.45 | Pull back to the hardware; labels on the PC (runs the game, encoder + decoder, learning algorithm) and the CL1 (living neurons) | A hybrid system: the computer does much of the work | keep |
| 24 | 23.45–25.87 | Dive from the bench to a close-up of the living culture; bursts on "real" | The real, living part | keep |
| 25 | 25.87–27.15 | Close-up → out to the bench with the lens on the culture | "This video game controller..." | keep |
| 26 | 27.15–28.05 | Ease toward the lens; it grows and a burst runs through the cells on "alive" | The emphasis is on the living cells, not the screen | keep |
| 27 | 28.05–29.00 | FIRE decoded, whip up into the game (a shot at 28.55) → the frame-0 framing | The loop closes into frame 0's shot | keep |

## Removed or merged in V1

- An early plan held the two-shot still at 0.72–0.80, between the pull-back and the push-in. It is merged: the
  pull-back decelerates straight into the push-in.
- The decoder close-up at 15.95 was framed on DECODE alone. It now includes the RECORD raster, so the screen shows
  the translation and not just its output.
- The ride to the decoder at 14.85 was shortened (1.10 s → 0.77 s). Its middle stretch (the headstage's inside and
  the PC's mesh) was dull at that length.

## Technical checks (for the review pass)

- Every ride starts at the camera state the previous segment ends on, and ends where the next one starts.
- Each segment's end keys equal the next segment's start keys in `story.ts`.
- The chip's squash (`chipK`) is a function of zoom alone, so a zoom in and back out retraces the same path.
- Captions are in screen space.
