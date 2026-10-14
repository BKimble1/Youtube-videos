# Sound-effect choices (objective, not auditioned)

Source: ElevenLabs sound effects (`eleven_text_to_sound_v2`), flow `bMvBZzDdtEZz45PtXUpm`, two takes per kind.
Transient sounds: the take with the most dominant single hit, trimmed to start 50 ms before that hit (the mixer places it 50 ms early so the hit lands on the cue frame). Sweeps: the take whose energy peaks earliest, trimmed to its onset. All faded and peak-normalised to -3 dBFS. sizzle, ambiences, UI ticks and the music bed are synthesised in-house (tools/synth_audio.py).

| Kind | Take used | Onset (s) | Main peak (s) | Raw length (s) | Used length (s) |
|---|---|---|---|---|---|
| robot_step | v2 | 0.00 | 0.02 | 1.00 | 0.70 |
| servo_whir | v2 | 0.00 | 0.88 | 2.00 | 0.80 |
| robot_push | v2 | 0.00 | 0.09 | 2.00 | 0.90 |
| molten_entry | v2 | 0.00 | 0.04 | 1.00 | 1.00 |
| paper_slide | v2 | 0.00 | 0.50 | 1.00 | 0.90 |
| paper_swish | v1 | 0.00 | 0.55 | 1.00 | 0.70 |
| card_flick | v2 | 0.09 | 0.61 | 1.00 | 0.44 |
| tag_clink | v1 | 0.13 | 0.15 | 2.00 | 1.20 |
| stamp | v1 | 0.07 | 0.10 | 2.00 | 0.90 |
| clapper | v1 | 2.08 | 7.41 | 12.00 | 0.80 |
| map_pin | v1 | 0.41 | 0.44 | 1.00 | 0.50 |
| sim_fall | v1 | 0.01 | 0.03 | 0.48 | 0.48 |
| knee_tap | v2 | 0.00 | 0.54 | 1.00 | 0.51 |
| airbag | v2 | 0.00 | 0.05 | 2.00 | 1.60 |
| static | v2 | 0.00 | 2.29 | 3.00 | 0.76 |
| whoosh_soft | v2 | 0.06 | 0.77 | 2.00 | 1.00 |
