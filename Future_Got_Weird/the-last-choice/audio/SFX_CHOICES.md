# Sound-effect take choices (objective rules, not auditioned)

Source: ElevenLabs `eleven_text_to_sound_v2`, flow `z1if6RWnmC2gvHiGpM0u`, two takes per kind (prompts in `audio/sfx_raw/manifest.json`); reused channel effects and synthesised tones as noted. Rules in `tools/prep_sfx.py`.

| Kind | Take used | Lead (s) | Notes |
|---|---|---|---|
| blast | blast_L_v2.mp3 | 0.03 | duration_s=4.48, onset_dominance=63.3 |
| body_fall | body_fall_v2.mp3 | 0.03 | duration_s=1.0, onset_dominance=262.7 |
| breath_exert | breath_exert_v1.mp3 | 0.01 | duration_s=6.0 |
| breath_ragged | breath_ragged_L_v2.mp3 | 0.0 | duration_s=6.0, steadiness_std_db=3.26 |
| cable_strain | cable_strain_L_v2.mp3 | 0.0 | duration_s=5.0 |
| city_bed | city_bed_L_v2.mp3 | 0.0 | duration_s=15.0, steadiness_std_db=0.94 |
| crane_chain | reused: they-trained-robots-to-destroy-themselves/source/public/v2/audio/sfx/crane_chain.wav | 0.05 |  |
| crane_trolley | crane_trolley_L_v2.mp3 | 0.0 | duration_s=6.0 |
| debris_rain | debris_rain_v2.mp3 | 0.01 | duration_s=5.0 |
| drone_rotor | drone_rotor_L_v1.mp3 | 0.0 | duration_s=6.0, steadiness_std_db=1.32 |
| elec_arc | reused: they-trained-robots-to-destroy-themselves/source/public/v2/audio/sfx/elec_arc.wav | 0.05 |  |
| fire_bed | fire_bed_L_v2.mp3 | 0.0 | duration_s=10.0, steadiness_std_db=11.2 |
| gantry_collapse | gantry_collapse_L_v2.mp3 | 0.009 | duration_s=5.0 |
| gate_roll | gate_roll_L_v1.mp3 | 0.01 | duration_s=3.48 |
| glass_door | glass_door_v2.mp3 | 0.01 | duration_s=3.0 |
| glass_shatter | glass_shatter_v1.mp3 | 0.03 | duration_s=3.0, onset_dominance=15.8 |
| hand_glass | hand_glass_v2.mp3 | 0.03 | duration_s=4.0, onset_dominance=15.8 |
| hydraulic | hydraulic_L_v1.mp3 | 0.0 | duration_s=2.48 |
| launcher | launcher_v2.mp3 | 0.03 | duration_s=2.0, onset_dominance=73.7 |
| lever_clunk | lever_clunk_v1.mp3 | 0.03 | duration_s=2.0, onset_dominance=32.0 |
| metal_tear | metal_tear_v2.mp3 | 0.027 | duration_s=2.0, onset_dominance=28.1 |
| padlock | reused: they-trained-robots-to-destroy-themselves/source/public/v2/audio/sfx/padlock.wav | 0.05 |  |
| projector_beep | synthesised (rising chirp) | 0 |  |
| radio_on | radio_on_v2.mp3 | 0.304 | duration_s=16.0 |
| refuge_bed | refuge_bed_L_v1.mp3 | 0.0 | duration_s=15.0, steadiness_std_db=1.3 |
| robot_step | reused: they-trained-robots-to-destroy-themselves/source/public/audio/sfx/robot_step.wav | 0.05 |  |
| robot_step_heavy | robot_step_heavy_v1.mp3 | 0.03 | duration_s=2.0, onset_dominance=803638.1 |
| sensor_lock | sensor_lock_v1.mp3 | 0.03 | duration_s=2.0, onset_dominance=16.7 |
| servo_heavy | servo_heavy_v2.mp3 | 0.0 | duration_s=6.0 |
| servo_whir | reused: they-trained-robots-to-destroy-themselves/source/public/audio/sfx/servo_whir.wav | 0.05 |  |
| shutter_close | shutter_close_v2.mp3 | 0.01 | duration_s=5.0 |
| shutter_slam | reused: they-trained-robots-to-destroy-themselves/source/public/v2/audio/sfx/shutter_slam.wav | 0.05 |  |
| sparks | sparks_L_v2.mp3 | 0.01 | duration_s=2.48 |
| static | reused: they-trained-robots-to-destroy-themselves/source/public/audio/sfx/static.wav | 0.05 |  |
| steam_vent | steam_vent_L_v2.mp3 | 0.0 | duration_s=6.0, steadiness_std_db=1.07 |
| step_grate | reused: they-trained-robots-to-destroy-themselves/source/public/v2/audio/sfx/step_grate.wav | 0.05 |  |
| step_grate_b | reused: they-trained-robots-to-destroy-themselves/source/public/v2/audio/sfx/step_grate_b.wav | 0.05 |  |
| steps_gravel | steps_gravel_L_v1.mp3 | 0.01 | duration_s=4.0 |
| sub_boom | reused: they-trained-robots-to-destroy-themselves/source/public/v2/audio/sfx/sub_boom.wav | 0.05 |  |
| taxi_drop | taxi_drop_v2.mp3 | 0.03 | duration_s=2.0, onset_dominance=18.0 |
| tinnitus | synthesised (3.95 kHz ring, 1.4 s decay) | 0 |  |
| wreck_slam | wreck_slam_L_v2.mp3 | 0.027 | duration_s=3.0, onset_dominance=42.3 |
