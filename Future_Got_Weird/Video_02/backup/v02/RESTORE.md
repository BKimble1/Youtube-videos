# Restoring Video 02 media from the split-part backup

Git does not carry the episode's media (WAV/MP3/MP4 are Git LFS types in this repository, and the LFS host was not
reachable from the production environment). Everything that cannot be regenerated, plus the delivered films, is stored
here as git-friendly parts of at most 24 MiB, each with a SHA-256 checksum.

| Folder | Archive / file | What it holds | Regenerable? |
|---|---|---|---|
| `sources/` | `v02_audio_sources.tar` | ElevenLabs Test Voice narration takes (all sections, MP3) and their Scribe forced alignments; the performance-check takes; the ElevenLabs sound-effect takes with their registry and cost note | **No** (byte-exact originals) |
| `rendered/` | `v02_audio_rendered.tar` | Every project WAV as lossless FLAC (sample-exact; per-file SHA-256 of the decoded samples in `wav_index.json`): assembled narration lines and track, effect library, effect and ambience tracks, music bed, final mix and its three stems | Yes, by the tools, but stored so the delivered mix is exact |
| `films/` | the delivered MP4s | 4K master, 1080p upload, 720p review preview | Yes (`tools/make_deliverables.sh`), stored for convenience |
| `runway/` | `v02_runway_clips.tar` | accepted Runway clips and raw downloads (only if any were accepted) | No |

## Restore

1. Rebuild each archive from its parts and verify every checksum (Linux/macOS, from the folder):
   `sh reconstruct.sh` (or `python3 reconstruct.py` on any OS). Both refuse to finish if a part or the whole file does
   not match `SHA256SUMS`.
2. Unpack at the episode root (`Future_Got_Weird/Video_02/`):
   - `tar -xf backup/v02/sources/v02_audio_sources.tar` restores `audio/narration/v2/takes/`,
     `audio/narration/perfcheck/` and `audio/sfx/v2/raw/` in place.
   - `rendered`: `mkdir -p /tmp/v02flac && tar -xf backup/v02/rendered/v02_audio_rendered.tar -C /tmp/v02flac`, then
     convert each FLAC back to its WAV with the subtype recorded in `wav_index.json` (entries with `stored: raw` are the
     original WAV bytes). For example, in Python with `soundfile`:
     `data, sr = sf.read(flac, dtype='int32'); sf.write(wav, data, sr, subtype=entry['subtype'])`, then compare
     `samples_sha256`.
   - `films`: the reconstructed MP4s go in `exports/`.
3. Or verify everything at once from the episode root: `python3 tools/backup_v02.py --verify` (rebuilds every archive
   in a temporary folder and checks every SHA-256).

The backup is (re)written with `python3 tools/backup_v02.py --group sources|rendered|films|runway|all`.
