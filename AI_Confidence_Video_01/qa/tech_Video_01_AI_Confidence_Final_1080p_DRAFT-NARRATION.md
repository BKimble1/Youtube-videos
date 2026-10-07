# Technical QA: Video_01_AI_Confidence_Final_1080p_DRAFT-NARRATION

## ffprobe
```
index=0
codec_name=h264
profile=High
codec_type=video
width=1920
height=1080
pix_fmt=yuv420p
r_frame_rate=30/1
avg_frame_rate=30/1
bit_rate=2150145
index=1
codec_name=aac
profile=LC
codec_type=audio
sample_rate=48000
channels=2
r_frame_rate=0/0
avg_frame_rate=0/0
bit_rate=317375
duration=299.520000
size=92710155
bit_rate=2476232
```

## Fast start (moov before mdat)
```
top-level atoms: ['ftyp', 'moov', 'free', 'mdat']
faststart: True
```

## Loudness (EBU R128, ffmpeg ebur128 with true peak)
```
[Parsed_ebur128_0 @ 0x5652f6776cc0] Summary:

  Integrated loudness:
    I:         -16.0 LUFS
    Threshold: -26.4 LUFS

  Loudness range:
    LRA:         1.8 LU
    Threshold: -36.4 LUFS
    LRA low:   -17.2 LUFS
    LRA high:  -15.5 LUFS

  True peak:
    Peak:       -1.3 dBFS
```

## Black frames (>=0.25 s) and frozen video (>=4 s)
```
[blackdetect @ 0x7f36940065c0] black_start:299.133 black_end:299.467 black_duration:0.333333
```

## Decode check (full decode, errors only)
```
decode finished
```
