# Lightning Laser V3: audio lock

V3 is a visual pass only. The script, the voice recording and the complete V2 soundtrack are reused unchanged. That
includes the ambience, bed, effects, silences, levels and start/end positions. Nothing is regenerated, stretched,
trimmed, spliced or moved, and no sound is added.

## Authoritative assets (recorded before any V3 edit)

| Asset | Path | Identity |
|---|---|---|
| Final mix (the soundtrack) | `source/public/audio/mix_v2.wav` | sha256 `ed86c578929288f4e10f1bf609f5296d9c3d5f0b9bb68975ecf33fb8a99260d8`; 48 kHz, 2 ch, 1,608,000 samples = 33.500 s |
| Committed copy of the same mix | `audio/mix/FGW_Lightning_Laser_V2_mix.wav` | sha256 `ed86c578…60d8` (identical) |
| Narration (voice take, inside the mix at 0 s) | `audio/narration/FGW_Lightning_Laser_narration.wav` | sha256 `6add03600f5f2d8adc461166782126ec86599958691b6c99044ed805805e242f` |
| Word/caption timing map | `source/src/data/timeline.json` | sha256 `1eb007a411cdfd87cb1a263501e783f44ddc567f4061da576b8b79f0f46d3cac`; 1005 frames, 30 fps, 33.5 s |
| Effect cue list (where each effect sits in the mix) | `audio/sfx_cues_v2.json` | 64 cues; V3 picture events are timed to these (`source/src/v3/timeline3.ts` `EV`) |
| Final audio stream of the V2 review | `exports/FGW_Lightning_Laser_V2_REVIEW_1080x1920.mp4`, stream 1 | AAC-LC 48 kHz stereo, 1573 packets, 33.515 s incl. encoder padding; packet data sha256 `4c3f0b740d307da4d9c7729f64db802a100ad03a88d18fe9e9bb00d92fba9dd6`; decoded s16le sha256 `6a353e720ce8128c5dee4de4fcde72ef42ab3fe70988b705161e3833d41fffd0` (6,434,816 bytes) |

## How V3 keeps it

1. **Same timeline.** The V3 composition `LightningLaserV3` has 1005 frames at 30 fps (33.5 s), and the captions
   use the same `timeline.json`. Caption wording and timing are unchanged; only each caption's height may change.
2. **Remuxed audio.** The delivered V3 files carry the V2 review's AAC stream, copied packet for packet
   (`ffmpeg -c:a copy`), not a re-encode.
3. **Verified from the files.** The check compares:
   - the V3 audio packet hash and decoded PCM hash against the V2 values above;
   - the decoded audio against `mix_v2.wav` (lag and correlation);
   - the durations, allowing for the AAC padding (33.515 s container, 33.500 s content).

## Known consequence

The mix was built for the V2 picture, so a few effects now sit under different images:
- The ARM click (2.72 s) and the muffled "inside" storm (2.52–4.31 s) play under the exterior opening.
- The vignette's effects (4.33–4.85 s) play as the side streamer stalls in the air.

V3 times its visual events to these sounds (the streamer's snap and steps land on them), but the interior
muffling of 2.52–4.31 s stays as mixed.
