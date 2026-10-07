# Technical QA: Video_01_AI_Confidence_Final_1080p

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
bit_rate=2458564
index=1
codec_name=aac
profile=LC
codec_type=audio
sample_rate=48000
channels=2
r_frame_rate=0/0
avg_frame_rate=0/0
bit_rate=278903
duration=318.500000
size=109333558
bit_rate=2746211
```

## Fast start (moov before mdat)
```
top-level atoms: ['ftyp', 'moov', 'free', 'mdat']
faststart: True
```

## Loudness (EBU R128, ffmpeg ebur128 with true peak)
```
[Parsed_ebur128_0 @ 0x55d42c3c2580] Summary:

  Integrated loudness:
    I:         -16.0 LUFS
    Threshold: -26.7 LUFS

  Loudness range:
    LRA:         2.9 LU
    Threshold: -36.7 LUFS
    LRA low:   -18.1 LUFS
    LRA high:  -15.2 LUFS

  True peak:
    Peak:       -1.2 dBFS
```

## Black frames (>=0.25 s) and frozen video (>=4 s)
```
[blackdetect @ 0x7fe450001e00] black_start:318.067 black_end:318.467 black_duration:0.4
```

## Decode check (full decode, errors only)
```
decode finished
```
