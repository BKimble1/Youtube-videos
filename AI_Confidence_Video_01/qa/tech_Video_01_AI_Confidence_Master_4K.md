# Technical QA: Video_01_AI_Confidence_Master_4K

## ffprobe
```
index=0
codec_name=h264
profile=High
codec_type=video
width=3840
height=2160
pix_fmt=yuv420p
r_frame_rate=30/1
avg_frame_rate=30/1
bit_rate=6698178
index=1
codec_name=aac
profile=LC
codec_type=audio
sample_rate=48000
channels=2
r_frame_rate=0/0
avg_frame_rate=0/0
bit_rate=317374
duration=318.507000
size=279656640
bit_rate=7024188
```

## Fast start (moov before mdat)
```
top-level atoms: ['ftyp', 'moov', 'free', 'mdat']
faststart: True
```

## Loudness (EBU R128, ffmpeg ebur128 with true peak)
```
[Parsed_ebur128_0 @ 0x55ddaf068a40] Summary:

  Integrated loudness:
    I:         -16.0 LUFS
    Threshold: -26.6 LUFS

  Loudness range:
    LRA:         2.9 LU
    Threshold: -36.6 LUFS
    LRA low:   -18.0 LUFS
    LRA high:  -15.1 LUFS

  True peak:
    Peak:       -1.3 dBFS
```

## Black frames (>=0.25 s) and frozen video (>=4 s)
```
[blackdetect @ 0x7f2df800c6c0] black_start:318.033 black_end:318.467 black_duration:0.433333
```

## Decode check (full decode, errors only)
```
