# Backup verification: final v6

- Repository: https://github.com/BKimble1/Youtube-videos
- Branch: `claude/youtube-ai-confidence-video-2f39dg`
- Commit holding all parts: `35154d4a3ba031e836afa194ad0628a90da8bba0`. `git ls-remote` confirmed it as the remote branch head.
- Verified on 2026-10-07 at about 16:20Z.

## Steps performed

1. Made a fresh clone from GitHub into an empty folder (`git clone --depth 1 --filter=blob:none --sparse`), then a sparse checkout of `backup/final_v6`, `backup/elevenlabs_sfx`, `backup/elevenlabs_narration_takes` and `backup/elevenlabs_auditions`. That downloaded 26 parts (553 MB) for final_v6.
2. Ran **both** `sh reconstruct.sh` and `python3 reconstruct.py` into separate folders. Every part and every rebuilt file matched its checksum ("All files rebuilt and verified." from each).
3. Compared every rebuilt file byte for byte (`cmp`) with the original in the production workspace. All 5 were identical, from both scripts.
4. Ran a full ffmpeg decode of the rebuilt 1080p: no errors. ffprobe on the rebuilt 4K reads 3840×2160, 318.50 s. `unzip -t` on the rebuilt project zip: no errors.
5. **Project zip self-sufficiency:** unzipped the rebuilt project zip into an empty folder and ran `tools/el_assemble.py`, `tools/build_timeline.py --engine elevenlabs` and `tools/make_sfx.py` inside it. `timeline.json`, `subtitles_elevenlabs.srt` and `sfx_cues.json` came out **byte-identical** to the delivered ones, and `tools/check_cues.py` passed. Rendering itself also needs `npm ci`, which was not repeated here.
6. The ElevenLabs backups (`elevenlabs_sfx`, `elevenlabs_narration_takes`, `elevenlabs_auditions`) were also rebuilt from the clone. All verified.

| Rebuilt file | SHA-256 (matches original) |
|---|---|
| Video_01_AI_Confidence_Final_1080p.mp4 | cd183347b7aef8b55093ba18ea51c43c82fc5955211986f3763af3051dccde56 |
| Video_01_AI_Confidence_Master_4K.mp4 | 45f2affa2bf16093de61960a46b84c9ee0c2c193aaac0780536e7d6ab376125d |
| Video_01_narration_stem.wav | 09cdf18556f0ea3f9f9931643dcca5c68ba8e1f711f2feffccf459bfe4f4f872 |
| AI_Confidence_Video_01_project.zip | 5ebcbd12a8b89f7f6ec28fe65eaadb9dee716a04138ace51240665fc867079dd |
| Video_01_PREVIEW_720p.mp4 | 1f5539af8d80f3ae4116225e22e49e8b4c12b0d1358148d11d28d825be0f2b26 |

Git LFS was not used: its storage host is blocked by this session's network policy. Release assets were not used either: no authenticated upload route was available.
