# V2 sound-effect library: what was picked and why (measured, see tools/sfx_lib.py)

| kind | class | choice |
|---|---|---|
| amb_conveyor | loop | new ElevenLabs take amb_conveyor_v3.mp3 (of 4): events 2, crest 8.6 dB, decay 3.01 s, steady 2.0 dB |
| amb_counter | loop | new ElevenLabs take amb_counter_v2.mp3 (of 4): events 3, crest 11.6 dB, decay 5.00 s, steady 1.9 dB |
| amb_gameshow | loop | new ElevenLabs take amb_gameshow_v2.mp3 (of 4): events 2, crest 11.3 dB, decay 4.97 s, steady 2.6 dB |
| amb_library | loop | new ElevenLabs take amb_library_v2.mp3 (of 4): events 1, crest 10.1 dB, decay 2.34 s, steady 1.2 dB |
| amb_machine | loop | new ElevenLabs take amb_machine_v3.mp3 (of 4): events 1, crest 12.2 dB, decay 2.51 s, steady 1.2 dB |
| bell_ding | hit | new ElevenLabs take bell_ding_v1.mp3 (of 3): events 1, crest 23.7 dB, decay 0.50 s, steady 11.3 dB |
| book_slide | stop | new ElevenLabs take book_slide_v1.mp3 (of 3): events 1, crest 23.7 dB, decay 0.22 s, steady 15.4 dB |
| buzzer_wrong | stroke | new ElevenLabs take buzzer_wrong_v2.mp3 (of 4): events 1, crest 15.2 dB, decay 0.25 s, steady 31.4 dB |
| card_flick | hit | new ElevenLabs take card_flick_v1.mp3 (of 3): events 1, crest 31.7 dB, decay 0.04 s, steady 1.5 dB |
| card_slide | stroke | new ElevenLabs take card_slide_v3.mp3 (of 3): events 1, crest 26.1 dB, decay 0.11 s, steady 17.7 dB |
| chip_pop | hit | new ElevenLabs take chip_pop_v3.mp3 (of 3): events 1, crest 23.2 dB, decay 0.08 s, steady 99.0 dB |
| claim_fails | stroke | new ElevenLabs take claim_fails_v1.mp3 (of 4): events 1, crest 4.9 dB, decay 0.23 s, steady 17.3 dB |
| conveyor_clunk | hit | new ElevenLabs take conveyor_clunk_v1.mp3 (of 3): events 1, crest 14.3 dB, decay 0.33 s, steady 0.2 dB |
| conveyor_run | loop | new ElevenLabs take conveyor_run_v2.mp3 (of 3): events 1, crest 15.4 dB, decay 0.52 s, steady 0.8 dB |
| crowd_aww | stroke | new ElevenLabs take crowd_aww_v2.mp3 (of 4): events 1, crest 13.1 dB, decay 1.13 s, steady 11.7 dB |
| crowd_cheer | loop | new ElevenLabs take crowd_cheer_v2.mp3 (of 4): events 7, crest 14.9 dB, decay 1.16 s, steady 8.5 dB |
| ding_right | hit | new ElevenLabs take ding_right_v1.mp3 (of 4): events 1, crest 20.9 dB, decay 0.56 s, steady 15.5 dB |
| drawer_close | stop | new ElevenLabs take drawer_close_v1.mp3 (of 3): events 1, crest 22.3 dB, decay 0.14 s, steady 15.6 dB |
| drawer_open | stop | reused drawer_v1.mp3: pass-2 catalogue drawer: wooden rumble ending in a soft stop |
| fanfare_small | stroke | reused fanfare_v2.mp3: pass-2 game-show win sting, done by 1.5 s |
| gavel | hit | new ElevenLabs take gavel_v1.mp3 (of 4): events 1, crest 25.3 dB, decay 0.34 s, steady 9.0 dB |
| glint | stroke | new ElevenLabs take glint_v3.mp3 (of 3): events 1, crest 19.0 dB, decay 0.75 s, steady 13.1 dB |
| hanger_click | hit | new ElevenLabs take hanger_click_v3.mp3 (of 3): events 2, crest 27.9 dB, decay 0.10 s, steady 14.4 dB |
| indicator_no | stroke | new ElevenLabs take indicator_no_v2.mp3 (of 4): events 1, crest 16.9 dB, decay 0.55 s, steady 17.8 dB |
| indicator_yes | stroke | new ElevenLabs take indicator_yes_v2.mp3 (of 4): events 1, crest 17.9 dB, decay 0.58 s, steady 17.8 dB |
| logo_hit | hit | reused impact_v3.mp3: pass-1 restrained low title hit |
| machine_clunk | hit | new ElevenLabs take machine_clunk_v4.mp3 (of 4): events 1, crest 20.7 dB, decay 0.50 s, steady 15.3 dB |
| machine_hum | loop | new ElevenLabs take machine_hum_v1.mp3 (of 4): events 1, crest 4.8 dB, decay 3.34 s, steady 0.2 dB |
| marker_circle | stroke | new ElevenLabs take marker_circle_v1.mp3 (of 3): events 1, crest 16.5 dB, decay 0.13 s, steady 3.0 dB |
| marker_sweep | stroke | reused marker_v3.mp3: pass-1 felt-tip stroke |
| page_turn | stroke | new ElevenLabs take page_turn_v2.mp3 (of 3): events 3, crest 29.1 dB, decay 0.69 s, steady 14.4 dB |
| paper_flap | stroke | new ElevenLabs take paper_flap_v1.mp3 (of 3): events 3, crest 24.0 dB, decay 0.06 s, steady 18.8 dB |
| paper_lift | stroke | new ElevenLabs take paper_lift_v3.mp3 (of 3): events 1, crest 25.7 dB, decay 0.23 s, steady 10.2 dB |
| paper_slap | hit | new ElevenLabs take paper_slap_v2.mp3 (of 3): events 2, crest 31.6 dB, decay 0.07 s, steady 20.8 dB |
| paper_slide | stroke | reused paper2_v2.mp3: pass-2 slip slide: clean swish then one settle |
| paper_swish | stroke | new ElevenLabs take paper_swish_v3.mp3 (of 3): events 1, crest 26.8 dB, decay 0.26 s, steady 9.5 dB |
| pencil_tap | hit | new ElevenLabs take pencil_tap_v1.mp3 (of 3): events 1, crest 26.9 dB, decay 0.05 s, steady 99.0 dB |
| pop_tick | hit | reused tock_v4.mp3: pass-1 soft wooden tock |
| printer_feed | stroke | new ElevenLabs take printer_feed_v1.mp3 (of 4): events 3, crest 27.5 dB, decay 0.19 s, steady 12.1 dB |
| prob_tick | stroke | numpy synth: 2.4 kHz tick, 50 ms |
| scanner_sweep | stroke | new ElevenLabs take scanner_sweep_v4.mp3 (of 4): events 1, crest 17.2 dB, decay 0.23 s, steady 17.4 dB |
| score_flip | hit | new ElevenLabs take score_flip_v4.mp3 (of 4): events 6, crest 25.2 dB, decay 0.02 s, steady 99.0 dB |
| stamp_heavy | hit | new ElevenLabs take stamp_heavy_v1.mp3 (of 4): events 1, crest 22.7 dB, decay 0.25 s, steady 6.2 dB |
| stamp_light | hit | reused stamp_v2.mp3: pass-2 counter stamp: one real thud with a wooden knock |
| tape_rip | stroke | new ElevenLabs take tape_rip_v2.mp3 (of 3): events 1, crest 27.1 dB, decay 0.05 s, steady 6.8 dB |
| thud_soft | hit | reused tap_v1.mp3: pass-1 card placed on felt |
| token_lock | hit | reused token_v4.mp3: pass-2 tile click: one crisp click with a tiny settle |
| token_select | hit | new ElevenLabs take token_select_v3.mp3 (of 3): events 1, crest 25.7 dB, decay 0.06 s, steady 99.0 dB |
| trophy_clink | hit | new ElevenLabs take trophy_clink_v4.mp3 (of 4): events 1, crest 25.2 dB, decay 0.26 s, steady 16.9 dB |
| trophy_steps | loop | new ElevenLabs take trophy_steps_v1.mp3 (of 4): events 10, crest 27.6 dB, decay 0.05 s, steady 4.9 dB |
| typewriter_tick | hit | new ElevenLabs take typewriter_tick_v3.mp3 (of 3): events 1, crest 29.7 dB, decay 0.05 s, steady 99.0 dB |
| whoosh_soft | stroke | reused whoosh_v3.mp3: pass-1 low air |
