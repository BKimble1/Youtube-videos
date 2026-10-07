# Backup: Video 01, final v6 (ElevenLabs narration), full-quality files

The finished video, "Why AI Sounds Right When It's Wrong" (5:18.5), stored as numbered parts smaller than
25 MiB with SHA-256 checksums. GitHub's large-file hosts (Git LFS storage and release-asset uploads) are not
reachable from the production session.

| File | What it is | Bytes | Parts | SHA-256 |
|---|---|---|---|---|
| Video_01_AI_Confidence_Final_1080p.mp4 | final video, 1080p30 (upload this) | 109,333,558 | 5 | cd183347b7aef8b55093ba18ea51c43c82fc5955211986f3763af3051dccde56 |
| Video_01_AI_Confidence_Master_4K.mp4 | 4K master, 3840×2160 | 278,123,626 | 12 | 45f2affa2bf16093de61960a46b84c9ee0c2c193aaac0780536e7d6ab376125d |
| Video_01_narration_stem.wav | final narration stem, mono 48 kHz/24-bit | 45,863,382 | 2 | 09cdf18556f0ea3f9f9931643dcca5c68ba8e1f711f2feffccf459bfe4f4f872 |
| AI_Confidence_Video_01_project.zip | editable project (Remotion source, tools, research, script, ElevenLabs takes and SFX) | 126,255,164 | 6 | 5ebcbd12a8b89f7f6ec28fe65eaadb9dee716a04138ace51240665fc867079dd |
| Video_01_PREVIEW_720p.mp4 | 720p review copy (not for upload) | 19,211,398 | 1 | 1f5539af8d80f3ae4116225e22e49e8b4c12b0d1358148d11d28d825be0f2b26 |

## Rebuild the files

macOS or Linux:

```sh
sh reconstruct.sh ~/Desktop/video01_final      # or leave out the folder to rebuild here
```

Windows, or anywhere with Python 3:

```
python reconstruct.py C:\Users\you\Desktop\video01_final
```

Both scripts check every part and every rebuilt file against its SHA-256 checksum: `reconstruct.sh` reads
`SHA256SUMS`, and `reconstruct.py` reads the same values (and byte counts) from `manifest.json`. They print `OK` per
file, then "All files rebuilt and verified." To check by hand instead, join the parts in numeric order (on macOS
or Linux, `cat name.part* > name`) and compare the result with `SHA256SUMS`.

The draft version (Kokoro voice) is kept for comparison in `../draft_v5/`.
