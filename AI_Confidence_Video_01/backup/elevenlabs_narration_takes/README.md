# ElevenLabs narration takes (backup)

`ElevenLabs_narration_takes.zip` holds all 48 Eleven v4 takes (12 blocks × 4, voice Marcus K) exactly as
downloaded from the ElevenLabs connector, their forced-alignment word timings (`*.align.json`), the take
registry (flow session and generation IDs), the per-take evaluation (`eval_blocks.json`), the selection,
the segment manifest and word timings, and the blind Scribe verification of the selected takes.

Rebuild with `sh reconstruct.sh` (Linux/macOS) or `python3 reconstruct.py` (any OS); both verify SHA-256.
The segment WAVs and the narration stem are regenerated from these files with
`python3 tools/el_assemble.py && python3 tools/build_timeline.py --engine elevenlabs`.
