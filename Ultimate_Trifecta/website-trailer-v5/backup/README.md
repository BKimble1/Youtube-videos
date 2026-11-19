# V5 native 4K master: split backup

`UT_WEBSITE_TRAILER_V5_MASTER_4K.mp4` (3840x2160, 60 fps, 30.0 s, H.264 CRF 13, AAC 48 kHz stereo, -14 LUFS) is over GitHub's 100 MB file limit, so it is stored here as 20 MB parts.

Rejoin and verify:

```bash
cat UT_WEBSITE_TRAILER_V5_MASTER_4K.mp4.part_* > UT_WEBSITE_TRAILER_V5_MASTER_4K.mp4
sha256sum -c UT_WEBSITE_TRAILER_V5_MASTER_4K.mp4.sha256
```

On Windows (PowerShell): `cmd /c copy /b UT_WEBSITE_TRAILER_V5_MASTER_4K.mp4.part_* UT_WEBSITE_TRAILER_V5_MASTER_4K.mp4`
