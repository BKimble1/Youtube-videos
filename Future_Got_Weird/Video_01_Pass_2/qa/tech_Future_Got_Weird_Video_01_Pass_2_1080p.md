# Technical QA: Future_Got_Weird_Video_01_Pass_2_1080p

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
bit_rate=982914
index=1
codec_name=aac
profile=LC
codec_type=audio
sample_rate=48000
channels=2
r_frame_rate=0/0
avg_frame_rate=0/0
bit_rate=317375
duration=280.853000
size=45954957
bit_rate=1309010
```

## Fast start (moov before mdat)
```
top-level atoms: ['ftyp', 'moov', 'free', 'mdat']
faststart: True
```

## Loudness (EBU R128, ffmpeg ebur128 with true peak)
```
[Parsed_ebur128_0 @ 0x56057b2f6dc0] Summary:

  Integrated loudness:
    I:         -16.0 LUFS
    Threshold: -26.8 LUFS

  Loudness range:
    LRA:         3.5 LU
    Threshold: -36.7 LUFS
    LRA low:   -18.6 LUFS
    LRA high:  -15.1 LUFS

  True peak:
    Peak:       -1.3 dBFS
```

## Black frames (>=0.25 s) and frozen video (>=4 s)
```
none detected
```

## Decode check (full decode, errors only)
```
decode finished
```
