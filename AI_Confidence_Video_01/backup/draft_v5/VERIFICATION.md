# Backup verification: draft v5

- Repository: https://github.com/BKimble1/Youtube-videos
- Branch: `claude/youtube-ai-confidence-video-2f39dg`
- Commit holding all parts: `0854327966adcc1c10a53fde5e33e418cefe8108`. `git ls-remote` confirmed this as the remote branch head.
- Verified on 2026-10-07T12:34Z.

## Steps performed

1. Made a fresh clone from GitHub into an empty folder (`git clone --depth 1 --filter=blob:none --sparse`), then a sparse checkout of `AI_Confidence_Video_01/backup/draft_v5`. That downloaded all 24 parts, 514 MB in total.
2. Ran `sh reconstruct.sh` in the clone. Every part and every rebuilt file matched `SHA256SUMS`.
3. Compared each rebuilt file byte for byte (`cmp`) with the original in the production workspace. All 5 were identical.
4. Decoded the rebuilt 1080p fully with ffmpeg: no errors. ffprobe on the rebuilt 4K reads 3840×2160, 299.52 s. `unzip -t` on the rebuilt project zip: no errors.
5. A GitHub API directory listing of the branch shows all 24 parts with the expected sizes (25,165,824 bytes per full part).

| Rebuilt file | SHA-256 (matches original) |
|---|---|
| AI_Confidence_Video_01_project.zip | bfd0021a7bd01bc8a611d209bbae565d1b2d17f510de1c959ce1f3d44a383810 |
| Video_01_AI_Confidence_Final_1080p_DRAFT-NARRATION.mp4 | 3747fd1d4d45ec9a389b4f1ace7de828f2cec605a4580847fae9f0a11307c5f6 |
| Video_01_AI_Confidence_Master_4K_DRAFT-NARRATION.mp4 | 31913e2f7a946b16d16bc0edc676e0148c36a20c9dcce526a28c3f708432c0ab |
| Video_01_PREVIEW_720p_DRAFT-NARRATION.mp4 | d12984d34b98f88b8be334b1166a31a4c9b37243b6f6890f691b0a1c7f657fb7 |
| Video_01_narration_stem_DRAFT.wav | 2c4989c262d6fe9616f651e8ee67369d5139321c4514f69ac053f1a1f4afb72a |

Git LFS was not used: its storage host (lfs.github.com) is blocked by this session's network policy. Release assets were not used either: no authenticated upload route was available.
