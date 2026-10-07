# Backup: Video 01, final v6 (ElevenLabs narration), full-quality files

The finished video and its narration, stored as numbered parts smaller than 25 MiB with SHA-256 checksums.
GitHub's large-file hosts (Git LFS storage and release-asset uploads) are not reachable from the production
session. The file table and checksums are in `manifest.json` and `SHA256SUMS`. The 4K master and the
project zip are added in a follow-up commit.

## Rebuild the files

macOS or Linux:

```sh
sh reconstruct.sh ~/Desktop/video01_final      # or leave out the folder to rebuild here
```

Windows, or anywhere with Python 3:

```
python reconstruct.py C:\Users\you\Desktop\video01_final
```

Both scripts check every part and every rebuilt file against `SHA256SUMS`. They print `OK` per file, then
"All files rebuilt and verified."
