# R2 sound-effect take choices (objective rules, not auditioned)

Source: ElevenLabs `eleven_text_to_sound_v2`, flow `NZsNryXtOG1YNHRfL1ls` (raw takes and prompts in `audio/r2/sfx_raw/`, `manifest.json`). Prepared files: `audio/r2/sfx/<kind>.wav`, 48 kHz float, -3 dBFS peak. Rules in `tools/r2/prep_sfx_r2.py`. Lead = seconds from file start to the sync point (hit / first sound).

| Kind | Category | Take | Duration (s) | Lead (s) |
|---|---|---|---|---|
| ally_drone | bed | ally_drone_v1.mp3 | 6.0 | 0.0 |
| ally_drone_crash | transient | ally_drone_crash_v1.mp3 | 2.48 | 0.454 |
| armor_hit | transient | armor_hit_v1.mp3 | 1.0 | 0.011 |
| army_halt | transient | army_halt_v1.mp3 | 3.938 | 1.993 |
| army_march | bed | army_march_v2.mp3 | 12.0 | 0.0 |
| battle_far | bed | battle_far_v1.mp3 | 20.0 | 0.0 |
| breaker_charge | sweep | breaker_charge_v1.mp3 | 1.48 | 0.0 |
| breaker_empty | transient | breaker_empty_v1.mp3 | 1.2 | 0.774 |
| breaker_hit | transient | breaker_hit_v2.mp3 | 1.471 | 0.03 |
| cable_snap | transient | cable_snap_v2.mp3 | 1.2 | 0.0 |
| cloth_move | sweep | cloth_move_v1.mp3 | 2.0 | 0.0 |
| drone_pass | sweep | drone_pass_v1.mp3 | 2.422 | 0.01 |
| drone_swarm | bed | drone_swarm_v1.mp3 | 10.0 | 0.0 |
| eyes_on | sweep | eyes_on_v2.mp3 | 3.0 | 0.0 |
| final_breath | sweep | final_breath_v1.mp3 | 2.477 | 0.01 |
| flare_ignite | sweep | flare_ignite_v1.mp3 | 3.0 | 0.007 |
| halligan_pry | transient | halligan_pry_v1.mp3 | 1.76 | 1.107 |
| heavy_launcher | transient | heavy_launcher_v1.mp3 | 2.0 | 0.199 |
| heavy_servo | sweep | heavy_servo_v2.mp3 | 3.0 | 0.002 |
| heavy_stomp | transient | heavy_stomp_v2.mp3 | 2.48 | 0.0 |
| machine_hum | bed | machine_hum_v1.mp3 | 15.0 | 0.0 |
| plate_block | transient | plate_block_v1.mp3 | 1.48 | 0.002 |
| plate_crack | transient | plate_crack_v1.mp3 | 1.48 | 0.0 |
| plate_shatter | transient | plate_shatter_v1.mp3 | 2.0 | 0.0 |
| projector_on | sweep | projector_on_v1.mp3 | 2.0 | 0.0 |
| ram_strike | transient | ram_strike_v1.mp3 | 3.0 | 0.0 |
| robot_fall | transient | robot_fall_v1.mp3 | 2.0 | 0.001 |
| robot_swing | transient | robot_swing_v1.mp3 | 0.8 | 0.0 |
| rubble_shift | sweep | rubble_shift_v1.mp3 | 3.956 | 0.01 |
| run_rubble | bed | run_rubble_v1.mp3 | 6.0 | 0.0 |
| shield_bash | transient | shield_bash_v1.mp3 | 1.2 | 0.0 |
| smoke_canister | sweep | smoke_canister_v1.mp3 | 4.0 | 0.008 |
| tether_clamp | transient | tether_clamp_v1.mp3 | 1.48 | 0.0 |
| tether_fire | transient | tether_fire_v1.mp3 | 1.48 | 0.003 |
| tether_reel | sweep | tether_reel_v2.mp3 | 2.48 | 0.0 |
| tower_collapse | sweep | tower_collapse_v2.mp3 | 9.636 | 0.01 |
| wind_ruins | bed | wind_ruins_v2.mp3 | 20.0 | 0.0 |

Transients whose loud build-up was kept rather than cut at hit - 30 ms (place them by their lead): `ally_drone_crash`, `army_halt`, `breaker_empty`, `halligan_pry`, `heavy_launcher`.
