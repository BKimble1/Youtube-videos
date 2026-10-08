# Approved V2 (the reviewed 4:48 film)

The V2 film the owner reviewed and approved is the review render
`Future_Got_Weird_Video_01_V2_1080p_REVIEW_chat.mp4` (1920×1080, 30 fps, 4:48.235, "Made with Remotion 4.0.533",
SHA-256 `426e6906ae6e1a789d6b61bdada9c3ab6ae14271ddef8566749bdd4b04e91655`), and its higher-bitrate twin
`Future_Got_Weird_Video_01_V2_1080p_REVIEW.mp4` (SHA-256 `0f0e5a47858e2b4d2ea1841a777439595ec0f84fc6433bb7516af34e1a4ff292`).

- **Source:** commit `5bd35c1` on branch `claude/new-session-96c7w8` (all ten scenes rebuilt; `Future_Got_Weird/Video_01_V2/source`).
- **Audio:** the mix it was rendered with (`tools/mix_v2.py --sfx-db -2 --sfx-duck-db 4` over the V2 narration, music
  bed and all 768 effect cues) and both review files are backed up in `backup/v2_review_build/` (commit `f33a835`
  and the commit that adds this file).
- **Earlier states:** the frozen production baseline is named in `BASELINE.md` (commit `29aa09f`, before S3–S10 were
  merged); the V1 / pass-2 film is in `../Video_01_Pass_2/`.

The final polish and 4K delivery (V3) are commits after this one; see `V3_CHANGELOG.md` and `DELIVERABLES.md`.
