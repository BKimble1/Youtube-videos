# Ultimate Trifecta: Season 1 – Winter Break (V2, 33 s)

Cut to the creator's **UT-Winter-Break-Score-Polished.wav**. The score is placed at 0:00 and plays through at its original speed. The picture was trimmed to land the musical beats.

## Deliverables

| File | What it is |
|---|---|
| `exports/Ultimate_Trifecta_Winter_Break_V2.mp4` | Delivery: 1920×1080, 30 fps, H.264 two-pass at about 17 Mb/s, AAC 48 kHz, 33.0 s |
| `backup/…master_crf16.mp4.part00/01` | CRF 16 master, split to stay under GitHub's 100 MB limit. Rejoin with `cat *.part* > master.mp4` (sha256 in `master_crf16.sha256`) |
| `audio/mix/UT_WINTER_BREAK_V2_MIX.flac` | Final stereo mix |
| `audio/mix/stem_music_score.flac` | Score stem, bit-identical to the source WAV |
| `audio/mix/stem_sfx.flac` | Effects stem (separate track) |
| `qa/v2/` | QA report, contact sheet, key-frame strips, waveform plot |
| `source/` | Planner, EDL, compositor, Godot trailer-director scripts, render and QA scripts |

## Sync points (measured on the exported MP4)

| Beat | Target | Measured |
|---|---|---|
| Headlights snap on, relay click | 0:08.0 (musical turn) | Lights on at frame 240, click peak 8.018 s |
| First foot hits the pavement | before the cut to the cart | 8.70 s, cut at 9.20 |
| Cart's gained ground revealed | about 0:13.8 transient | Cut at 13.833 s (frame 415) |
| Reindeer breaks away and dives (same shot) | about 0:17 pullback | Shot starts at 17.0, dive at 17.45 |
| Bush shakes, reindeer bursts out | return at 21.83 / 22.5 | 21.833 / 22.5 |
| Door latch | 0:28.5 | Latch peak at 28.500 s |
| Snow clump lands | before the title | 29.73 s |
| Title card | 0:29.8, hold to 0:33 | First title frame 894 = 29.800 s, held to 33.0 |

## Mix

- The score is untouched. The only change is one uniform gain applied to the whole mix to reach −14.0 LUFS integrated (−1.9 dBTP), with a transparent look-ahead peak limiter. There are no fades, edits or extra hits on the score.
- Effects sit on their own stem and play only where the cause is on screen:
  - relay click, shoes and snow steps, cart motor (pitched by speed, distance-attenuated, smoothed across cuts so the chase rhythm carries over each edit);
  - tyre crunch, branches and rustle, snow puff, door swing and latch, snow plop;
  - motor muffled behind the glass after the latch.
- No splash, bubbles, whooshes or title booms.
- Effects RMS either side of each chase cut stays within about 2 dB (`qa/v2/report.json`), so the motor and footsteps run continuously over the cuts.
- Under the title the effects bed is silent (−67.6 dB), so the finish is just the score.
- Audio was checked by measurement (peaks, loudness, stem diff, continuity), not by ear.

## Trailer-only staging (not game changes)

These were added in the dev-only trailer director:
- a snow-capped hide bush placed at (5.4, 75.5) on the chase path;
- a snow drift with footprints and tyre tracks;
- snow on the reindeer and the falling clump;
- per-shot headlight energy;
- door leaves plus glass light sweep;
- falling snow and festive lights.

The antler-tuck gesture is simplified (a hood duck and tilt) because the characters' arms can't reach the antlers.

ElevenLabs generation wasn't available in this session, so the foley comes from the game's SFX library plus synthesized snow and branch sounds.
