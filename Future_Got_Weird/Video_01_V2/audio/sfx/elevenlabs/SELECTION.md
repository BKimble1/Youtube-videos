# ElevenLabs sound effects for pass 2: generation, measurement, selection

Pass 2 uses twelve ElevenLabs sound effects. Six are new for this pass (the cutout props that did not exist in
pass 1), and six are reused from pass 1 (`SELECTION_pass1.md` has their prompts, measurements and reasons).
All were generated with **ElevenLabs Sound Effects** (`eleven_text_to_sound_v2`) through the connected
ElevenLabs connector, four variations per prompt. `registry_pass2.tsv` records the Flows session and
generation id of every new candidate that was downloaded.

The MP3s are kept out of plain Git and preserved as a split-part backup in `backup/` with checksums.

## New prompts for pass 2

| Sound | Prompt | Length | Prompt influence |
|---|---|---|---|
| stamp | A single firm rubber stamp thud onto a paper slip on a wooden counter, short, dry, slight wooden knock, no reverb, 0.6 seconds | 1–2 s | 0.6 |
| tile (token) | A small wooden tile clicking snugly into a wooden slot, single crisp click with a tiny settle, close-miked, dry, 0.4 seconds | 1–2 s | 0.7 |
| drawer | A small wooden library card catalogue drawer sliding open with a gentle wooden rumble and a soft stop, quiet room, 1 second | 1 s | 0.6 |
| fanfare | A short cheerful game show win sting: a quick three-note brass fanfare with a small cymbal, bright and playful, 1.5 seconds | 2–3 s | 0.6 |
| cart | A small wooden library cart with squeaky little wheels rolling across a wooden floor and stopping, light and cartoonish, 1.8 seconds | 2 s | 0.6 |
| slide (paper2) | A single sheet of paper slid quickly across a wooden counter and set down with a light pat, close, dry, 0.7 seconds | 2 s | 0.6 |

## How the variations were judged (no listening)

Each downloaded candidate was decoded to 48 kHz mono and measured with 10 ms peak-envelope frames:

- **Envelope shape:** onset, position of the main transient, decay, and the number of separate events
  (a rise to within 12 dB of the peak after a dip).
- **Spectrum:** centroid, and a rough tonality figure (share of energy in the 40 strongest FFT bins).
- **Fit to the motion:** a stamp needs one thud; a tile needs one click; a drawer and a cart need a roll that
  ends in a stop; a fanfare should be short enough to end before the next line.

| Sound | Picked | Generation ID | Why | Rejected |
|---|---|---|---|---|
| stamp | **v2** | `W7oW93S1qqZim1AydU7Z` | One real thud at 0.75 s with a low wooden knock (0.9 kHz centroid), −0.9 dBFS peak, then a quiet second settle. Trimmed to 0.60–1.30 s so the thud is the sync point. | v1 is a faint, almost pure-tone click (4.3 kHz centroid, tonality 0.84, −27.6 dBFS peak): not a stamp. |
| tile | **v4** | `BkQ10YpYXWt4sBlcPbZm` | One crisp click at 0.21 s with a tiny settle, bright (7.6 kHz centroid). Trimmed to 0.12–0.70 s and high-passed at 400 Hz. | v1 has two faint hits at 0.74 s and 0.95 s inside 2 s of near-silence. |
| drawer | **v1** | `7Zk9BG2uANCkVGdFjALM` | A real slide: a wooden rumble from 0.1 s that ends in a soft stop at about 0.5 s (1.6 kHz centroid). Synced by its stop. | v4 is a single knock at 0.55 s with no slide before it. |
| fanfare | **v2** | `xgFct0CfaNl8KkxM9Pgg` | Two seconds, the most tonal of the pair (0.41), full level for 0.8 s and done by 1.5 s, so it clears the next line. | v1 runs 3 s with a busier, less tonal envelope. |
| cart | **v1** | `j8FA4LjeXcPG7xGigCRX` | Rolling rattle from 0.1 s to 1.7 s, lower and woodier (2.2 kHz centroid, −0.4 dBFS peak). Played 25 % faster so the 1.3 s roll fits the cart's 36-frame entrance and its last rattle lands on the stop. | v2 is brighter (3.5 kHz) and squeakier at the same length. |
| slide | **v2** | `Lnn7RkUrG0gby4cBhphH` | A clean 0.2–1.05 s swish then one settle at about 1.3 s, six events in all. Synced by its stop. | v1 is a continuous 1.7 s rustle with ten separate events: too busy for a single slip. |

Reused from pass 1 (same files, same sync points): **paper** v2 (one sheet settles), **whoosh** v3 (low air),
**tap** v1 (a card placed on felt), **marker** v3 (one felt-tip stroke), **tock** v4 (one soft wooden tock),
**impact** v3 (restrained low title hit).

## Where they are used

`tools/make_sfx.py` places every sound at the frame the scene code lands the matching prop, using the same word
cues the scenes use. Each sound is aligned by its own sync point: the loudest 5 ms for thuds, taps and tocks; the
first frame within 20 dB of the peak for strokes and the fanfare; the last such frame for rolls and slides (the
stop); the envelope maximum for the air whoosh.

| Sound | Count | Cue |
|---|---|---|
| slide | 9 | A slip slides out of a window, unfolds on the track, settles on the counter, comes alongside the record, is pinned, or (quiet, faster) stands in for confetti. |
| stamp | 11 | The three WRONG stamps in the hook, GUESSING PAYS, IS ENTITLED, the three WRONG stamps on the identical slips, NO GUARANTEE, CLAIM FAILS, SOURCE?. Each one is pitched a little differently. |
| tile | 25 | “Kal” and “ai” tiles, the six roll-out tokens, “piece by piece”, the honest contestant's ten tiles and the guesser's four resolving tiles. |
| drawer | 2 | The catalogue drawer opens; the evidence booth's shutter (played 10 % faster). |
| cart | 1 | The retrieval cart rolls in and stops. |
| fanfare | 1 | The guesser gets the trophy. |
| paper | 4 | The paper header, the thesis title block, Table 2 and the thesis title page land. |
| tap | 22 | Cards, panels, modules, the cake, the magnifier, the leaderboard and the end-card chip land. |
| marker | 18 | Marks and strikes drawn on slips, records and the old question. |
| tock | 17 | Books light up, rule cards, quiz scores, “pays”, and the trophy's seven footsteps. |
| whoosh | 12 | The nine paper wipes, the panel change, the channel sting and the end card. |
| impact | 1 | The title moment, on “sure?”. |

Synthesized accents (numpy, in the same script): scorer sweep and reload ticks, pick settles, token-split shimmer,
dial clicks, tally marks, the rule-card flip, the three “minus one” tones, the check/cross tones for the
verification beat, and the two reveal thunks.

## Levels in the final mix

From `qa/sfx_levels.json` (50 ms RMS maximum within 0.4 s of each cue, measured on the mix stems):

- Stamps sit about 17 dB under the narration and at the level of the ducked music; they are the loudest props by
  design and the running joke.
- Taps, slides, markers and the paper settle sit 24–29 dB under the narration and 5–10 dB under the music.
- Tiles and tocks sit about 30 dB under the narration and 14–17 dB under the music: audible as texture, not as
  events.
- Wipe whooshes fall in narration gaps at about −44 dBFS, roughly the level of the music.
- The title hit is the one deliberate exception, about 9 dB under the voice on “sure?” and almost entirely
  sub-bass.

**Human check still needed:** whether the sounds feel natural, whether any is too frequent, and whether the levels
are right can only be confirmed by listening.
