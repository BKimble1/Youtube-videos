# V2 sound-effect choices (objective, not auditioned)

Source: ElevenLabs sound effects (`eleven_text_to_sound_v2`), flow `cTJC4ajZ74v2FqrAyWFs`, four takes per kind requested (two typing takes fetched). Chosen from measurements, since no listening is possible in this environment. V1 effects are reused for steps, pushes, stamps, paper, clapper, airbag, static, UI ticks and the sting.

| Kind | Take | Generation ID | Main peak (s) | Lead (s) | Used (s) | Why |
|---|---|---|---|---|---|---|
| molten_heavy | v3 | `PtV9eF5RsUZirnog5N6R` | 0.14 | 0.050 | 2.91 | 3 s take: hit at 0.14 s, then the densest crackle (29 transients), fully decayed by the end |
| sub_boom | v1 | `SLkcSwkMwTvTD2EnvbpG` | 0.09 | 0.050 | 1.96 | hit at 0.09 s with a 2 s tail; the 1 s takes stop before the tail decays |
| step_grate | v1 | `mVs9qbmBuvt3fpnBUpBD` | 0.03 | 0.030 | 0.60 | hit at 0.03 s, decays to -78 dB; strongest of the clean single steps |
| step_grate_b | v2 | `cpBh74JbIcowu7y7dPPi` | 0.08 | 0.030 | 0.60 | second clean step (hit at 0.08 s) used on alternate feet so steps do not repeat |
| padlock | v3 | `U421URYGDWFDZbdvabFY` | 0.01 | 0.010 | 0.60 | instant click (peak at 0.01 s), highest crest factor (29.8 dB) |
| shutter_slam | v4 | `3E2Ypq7idiIj8LGyCD3B` | 0.33 | 0.330 | 2.00 | 3 s take whose slam (peak 0.33 s) follows the rattle; the 6 s take peaks at 2.97 s |
| crane_chain | v4 | `yB4o9XLO6Rc3f8tYZ2Xt` | 0.74 | 0.000 | 2.00 | 2 s take with the most energy (-15.6 dB RMS) that decays by the end |
| elec_arc | v2 | `Ye1krlFBfxgaAgBoxK8q` | 0.28 | 0.100 | 0.82 | loudest early burst (peak 0.28 s), decays to -63 dB |
| rewind | v2 | `7F4hPKqt1wT7cZQoZBVM` | 0.47 | 0.000 | 1.00 | loudest take that decays to silence (-72 dB tail) |
| typing | v1 | `UKiESayAw9lmem77b7CQ` | 0.05 | 0.030 | 1.60 | most keystrokes (7 transients) of the two takes fetched |

The four 1 s `furnace_roar` takes are not used directly; tools/v2/synth_audio_v2.py layers them as grains inside the synthesised furnace bed.
