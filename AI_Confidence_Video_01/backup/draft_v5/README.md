# Backup: Video 01, draft v5 (Kokoro draft narration), full-quality files

These are the full-quality draft deliverables as they existed before the ElevenLabs version. They are
kept so the improved final cut can be compared with this one.

GitHub's large-file hosts (Git LFS storage and release-asset uploads) are not reachable from the production
session. So each file is stored as numbered parts smaller than 25 MiB, with SHA-256 checksums.

| File | Bytes | Parts | SHA-256 |
|---|---|---|---|
| Video_01_AI_Confidence_Final_1080p_DRAFT-NARRATION.mp4 | 104,123,810 | 5 | 3747fd1d4d45ec9a389b4f1ace7de828f2cec605a4580847fae9f0a11307c5f6 |
| Video_01_AI_Confidence_Master_4K_DRAFT-NARRATION.mp4 | 262,253,043 | 11 | 31913e2f7a946b16d16bc0edc676e0148c36a20c9dcce526a28c3f708432c0ab |
| Video_01_narration_stem_DRAFT.wav | 43,128,102 | 2 | 2c4989c262d6fe9616f651e8ee67369d5139321c4514f69ac053f1a1f4afb72a |
| AI_Confidence_Video_01_project.zip | 100,176,058 | 4 | bfd0021a7bd01bc8a611d209bbae565d1b2d17f510de1c959ce1f3d44a383810 |
| Video_01_PREVIEW_720p_DRAFT-NARRATION.mp4 | 28,752,447 | 2 | d12984d34b98f88b8be334b1166a31a4c9b37243b6f6890f691b0a1c7f657fb7 |

## Rebuild the files

macOS or Linux:

```sh
sh reconstruct.sh ~/Desktop/video01_draft      # or leave out the folder to rebuild here
```

Windows, or anywhere with Python 3:

```
python reconstruct.py C:\Users\you\Desktop\video01_draft
```

Both scripts check every part and every rebuilt file against `SHA256SUMS`. They print `OK` per file, then
"All files rebuilt and verified." To check by hand instead, join the parts in numeric order (on macOS or Linux,
`cat name.part* > name`) and compare the result with `SHA256SUMS`.

The project zip holds the editable Remotion project, tools, research, script, the raw draft narration segments and
the original archival scans. See `README.md` inside the zip for the rebuild pipeline.
