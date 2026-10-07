# ElevenLabs sound effects: generation, measurement, selection

All six sounds were generated for this video with **ElevenLabs Sound Effects** (`eleven_text_to_sound_v2`) through the
connected ElevenLabs connector (Flow `8EnMEV9kJgVSY02qo7Qk`). Each prompt produced 4 variations, so there were 24
candidates in total. The cost was about 93 credits: 4 × (4.0 + 5.3 + 2.0 + 2.0 + 8.3 + 1.7).

`tools/make_sfx.py` places them, together with the synthesized interface accents.

Like the narration takes, the MP3s are kept out of plain Git and are preserved as a split-part backup in
`backup/elevenlabs_sfx/`.

## Prompts

| Sound | Prompt | Length | Prompt influence |
|---|---|---|---|
| paper | A single sheet of printed paper slid quickly onto a wooden desk, close-up, soft paper swish ending in a gentle settle. Dry studio recording, no room echo, no music. | 1.2 s | 0.6 |
| whoosh | Soft, low, airy whoosh for a documentary scene transition, gentle swell and fade, warm and dark, no high hiss, no impact, no music. | 1.6 s | 0.6 |
| tap | One soft muted tap of a thick card placed on a felt table, single short sound, subtle, dry, close microphone. | 0.6 s | 0.7 |
| marker | A single quick felt-tip marker stroke across paper, one short decisive line, dry close-up recording, no other sounds. | 0.6 s | 0.7 |
| tock | A single soft wooden tock, like a small wooden block tapped once with a soft mallet, short, warm, dry. | 0.5 s | 0.7 |
| impact | Restrained deep cinematic low hit for a title reveal, warm sub-bass thump with a soft natural tail, clean, no distortion, no risers, no music. | 2.5 s | 0.6 |

## How each variation was judged (no listening)

Each variation was measured on the following, using 5 ms RMS frames at 48 kHz:

- **Envelope shape:** onset, peak position and decay to −30 dB.
- **Separate events:** a rise to within 12 dB of the peak after a dip below −24 dB.
- **Spectrum:** centroid, the energy share below 120 Hz and the energy share above 6 kHz.
- **Noise floor:** the 10th percentile frame.

A spectrogram and waveform contact sheet was also used to check each variation's envelope shape and whether it contained one sound or several.

The rule was simple: **one clean event, the shape the prompt asked for, the lowest noise floor.**

| Sound | Picked | Generation ID | Why | Rejected |
|---|---|---|---|---|
| paper | **v2** | `ersm5qHqXVn9tWFRuvAI` | Quiet swish followed by one settle transient at 0.575 s. It has the warmest spectrum (3.8 kHz centroid, 4.6 % above 6 kHz) and a −81 dB floor. | v1 is hissy (6.1 kHz centroid). v3 has two transients. v4 has two events. |
| whoosh | **v3** | `eIYML6Y1XfrrIDuI6MxW` | The only symmetric swell: it rises to a peak at 0.47 s and fades by 0.87 s, which suits a cross-fade. It has no high hiss. | v1 starts at full level and decays. v2 is short and abrupt. v4 has three bumps. |
| tap | **v1** | `uuHoNYe8BzRREaB53cYr` | One main tap at 0.34 s. The file is trimmed from 0.28 s, so the faint pre-noise is removed. | v2 and v4 are double and triple taps. v3 has a pre-tap 0.16 s before the main one. |
| marker | **v3** | `hTQNtn31DrlGNQCCHKGe` | One stroke with a clean −69 dB floor. | v1, v2 and v4 contain two or three separate events. |
| tock | **v4** | `liE6JXSgPEsR10imYWEm` | Single, short and warm (1.4 kHz centroid). Its peak is at 20 ms, so it syncs tightly. | v1 is very quiet and starts already at full level. v2 has a 155 ms lead. v3 is brighter (4.7 kHz) and less "soft mallet". |
| impact | **v3** | `Q9HRi9Zs8B1undjulYG2` | Immediate attack (peak at 5 ms), clean tail and the lowest floor (−75 dB). | v2 and v4 swell up to a peak at about 0.8 s, which is effectively a riser (the prompt said "no risers"). v1 is similar but has a noisier floor (−62 dB). |

## Where they are used (all synced to the motion they accompany)

Each sound is aligned by its own **sync point**, not by the start of its file:

- **peak** = the loudest 5 ms (settle, tap, tock or hit)
- **onset** = the start of the marker stroke
- **swell** = the middle of the whoosh

| Sound | Count | Cue |
|---|---|---|
| tap | 3 | Each of the three chatbot answer cards in the hook lands (9 frames into its slide-in). |
| marker | 5 | The coral marks drawn over every title, then every year (s04), and the strike-through of "Does it sound right?" at the end. |
| paper | 9 | Every real document as it settles. These are the paper header, the IMO solutions PDF, the birthday excerpt, p. 10, Figure 1, the thesis title block, Table 2, the p. 13 instruction and the thesis title page. They form one consistent "this is a real document" motif. |
| whoosh | 5 | Each scene change, peaking in the middle of the 10-frame cross-fade. The narration is silent there in every case. |
| tock | 3 | The quiz scores appear: Honest 6, Guesser 7, Guesser 4. |
| impact | 1 | The title card, on "wrong", with a short synthesized lead-in swell and air layer. |

Three of the five markers (+7 %, +7 %, −5 %), two of the three taps (+4 %, +8 %) and two of the three tocks (+6 %, −6 %) are pitch-varied, so repeats do not sound copy-pasted.

## Levels in the final mix

Each level is the 50 ms RMS maximum around a cue, measured from the mix stems. Per-cue values are in `qa/sfx_levels.json`.

- **Taps, marks, paper and tocks:** 17–28 dB below the narration whenever they fall under speech, and from about 2 dB above to 8 dB below the ducked music bed's broadband level. They are short transients in a different band from the bed, which is high-passed and has a dip at 2.2–2.5 kHz, so they read through it without competing with the voice.
- **Whooshes:** each one sits in a speech gap (narration silent) at about the level of the music. They are mostly below 120 Hz, so they add weight on headphones and TV speakers and are nearly inaudible on phone speakers.
- **Title hit:** the one deliberate exception, about 6 dB under the voice on the final word "wrong". Its energy is almost entirely sub-bass, below the band where speech is understood.

**Human check still needed:** whether the sounds feel natural and well judged in level can only be confirmed by listening.
