# ElevenLabs sound effects (backup)

`ElevenLabs_sound_effects.zip` holds all 24 sound-effect variations generated for this video with
ElevenLabs Sound Effects (`eleven_text_to_sound_v2`, 6 prompts × 4), exactly as downloaded from the
connector, plus `SELECTION.md` (prompts, generation IDs, measurements, and which variation was used where).

Rebuild with `sh reconstruct.sh` (Linux/macOS) or `python3 reconstruct.py` (any OS); both verify SHA-256.
Unzip into `audio/sfx/elevenlabs/`, then regenerate the effects track and mix with
`python3 tools/make_sfx.py && python3 tools/mix.py`.
