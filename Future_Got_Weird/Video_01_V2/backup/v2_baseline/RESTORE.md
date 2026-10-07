# V2 baseline media backup

Git does not carry this project's media (`*.wav`, `*.mp3`, `*.mp4`, `*.flac` are ignored or Git LFS types in this
repository, and the LFS host is not reachable from the production session). Everything the V2 baseline needs beyond
the tracked code and data is here, as four archives split into parts under 24 MiB, with SHA-256 checksums.

| archive | what | how stored |
|---|---|---|
| `v2_audio_sources.tar` | the 68 ElevenLabs narration takes (`audio/narration/v2/takes/*.mp3`), the 144 new ElevenLabs sound-effect takes with their registry and cost note (`audio/sfx/v2/raw/`), the 10 reused pass-2 effects (`audio/sfx/elevenlabs/*.mp3`) | byte-exact |
| `v2_audio_rendered.tar` | every PCM WAV of the project: the narration track used by the render (`source/public/audio/narration.wav`, also `audio/narration/narration_v2.wav`), the 36 assembled narration segments, the effect library, the effect and ambience tracks, the V2 music bed and its instrument stems, the first-pass V2 mix and its stems | lossless FLAC, sample-exact (`wav_index.json` records each original path, subtype and a SHA-256 of the decoded samples) |
| `v2_wip_scenes.tar` | the scene rebuilds that were still in progress when the baseline was taken (`work/<scene>/source/src/...` scene and component files, their final contact sheets and motion reports) | byte-exact; restored to `work_snapshot/`, not into the project |
| `v2_qa_v1_review.tar` | the dense review sheets and motion strips of the V1 film (`qa/v1_review/*.jpg|png`) | byte-exact |

## Restore

```sh
cd Future_Got_Weird/Video_01_V2/backup/v2_baseline
sh reconstruct.sh          # or: python3 reconstruct.py   — joins the parts, verifies every checksum
python3 restore_v2.py      # unpacks into Video_01_V2/ and rebuilds every WAV, checking each one sample by sample
```

Without Python's `soundfile`, unpack `v2_audio_rendered.tar` and convert each FLAC listed in `wav_index.json` back
with ffmpeg, keeping the recorded subtype: `ffmpeg -i X.wav.flac -c:a pcm_s24le X.wav` (PCM_24) or `pcm_s16le` (PCM_16).

Not backed up because it is reproducible: `source/node_modules` (`npm ci` from `source/package-lock.json`), and the
renders and stills under `qa/` and `work/` that the scripts regenerate. The music is rendered with FluidSynth and the
MuseScore General SoundFont (`/usr/share/sounds/sf3/MuseScore_General.sf3`); the rendered bed and stems are in the
backup, so the SoundFont is only needed to re-compose.
