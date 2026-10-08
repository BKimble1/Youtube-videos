# Chapters: draft for the final film (V2 timing, which V3 keeps)

Source: `source/src/data/timeline.json` (engine `v2`, 30 fps, 8,647 frames = 4:48.23). This is the same timeline the
approved V2 review was rendered from. It rebuilds byte-identical from `audio/narration/v2/manifest.json` with
`tools/build_timeline.py --engine v2` (checked in a scratch copy).

Rule used for each timestamp: the chapter starts at the scene's first visual frame, rounded to a whole second. When
rounding up still lands at least 0.1 s before the scene's first spoken word, it rounds up (S3, S7, S8). Otherwise it
rounds down. That way a chapter link never cuts into a word, and it never opens on more than about 0.5 s of the
previous scene.

YouTube's requirements: the first timestamp is 0:00, there are at least 3 timestamps in ascending order, and every
chapter lasts at least 10 s. This list meets all three. The shortest chapter is S8, at 13 s.

## Primary list (10 chapters, one per scene)

```
0:00 Three AI models, one question
0:27 The short version
0:44 One token at a time
1:26 What the model learned from
2:03 The actual record
2:26 Why guessing wins (an example quiz)
3:15 Nine of ten benchmarks
3:34 What helps, and what it doesn't guarantee
3:47 Two questions to check
4:13 Sounding right vs. being right
```

| # | Scene | Scene start | First word | Chapter | Length | What the chapter covers (narration) |
|---|---|---|---|---|---|---|
| 1 | S1 counter | 0:00.00 | 0:00.60 | 0:00 | 27 s | s01–s05: the question, three slips, "None of them are right", "Very professional. Very fictional." |
| 2 | S2 short version | 0:27.23 | 0:27.63 | 0:27 | 17 s | s06–s07: the on-screen title "Why AI Is So Confidently Wrong" and the three-part promise |
| 3 | S3 token machine | 0:43.97 | 0:44.37 | 0:44 | 42 s | s08–s12: tokens, "Kal" + "ai", the next-chunk scores, the year digit |
| 4 | S4 library | 1:26.43 | 1:26.93 | 1:26 | 37 s | s13–s16: title-shaped patterns, the rare fact, "Is entitled." |
| 5 | S5 record | 2:03.20 | 2:03.67 | 2:03 | 23 s | s17–s19: the real thesis (CMU, May 2001), "A confident font is still just a font." |
| 6 | S6 game show | 2:26.50 | 2:26.90 | 2:26 | 49 s | s20–s25: the +1/0/0 quiz, 6 vs 7, the −1 rule, 6 + 1 − 3 = 4, the trophy walks back |
| 7 | S7 benchmarks | 3:14.77 | 3:15.27 | 3:15 | 19 s | s26–s27: Table 2, 9 of 10 with no credit for "I don't know", "one explanation, not the whole story" |
| 8 | S8 what helps | 3:33.77 | 3:34.20 | 3:34 | 13 s | s28: retrieval, reasoning, lower randomness (more consistent, not necessarily more correct) |
| 9 | S9 verify | 3:47.57 | 3:47.97 | 3:47 | 26 s | s29–s32: the two questions, applied to the ChatGPT slip; "Source exists. Claim fails." |
| 10 | S10 payoff | 4:13.20 | 4:13.63 | 4:13 | 35 s | s33–s36: sounding right vs being right, the callback, the end card (4:37–4:48) |

The titles reuse the film's own words where they can: "The short version", "the actual record", "Two questions",
and "sounding right … being right". The quiz is labelled as an example, as it is on screen. None of the titles
say "lying" or claim intent.

## Optional compact list (9 chapters)

If 10 chapters feel busy for a 4:48 film, merge S8 into S9. Every other line stays the same.

```
3:34 What helps, and how to check
```

(This replaces both the 3:34 and 3:47 lines. The merged chapter runs 39 s.)

## How the previous chapter list differed (pass 2, in `package/UPLOAD_PACKAGE.md`)

Pass 2 used 0:00, 0:27, 0:44, 1:25, 2:00, 2:23, 3:09, 3:27, 3:41 and 4:07. Seven of the ten are early by 1–7 s on
the V2 timeline, so most V2 chapter links would open in the previous scene. The pass-2 note that "every chapter
is at least 14 seconds" no longer holds either: S8 is now 13.8 s from its scene start.

## Recompute after any timing change

V3 is meant to keep the narration timing. If a selective narration repair changes `timeline.json`, recompute these
before upload. The one-liner below applies the rule above:

```bash
python3 -c "
import json,math
t=json.load(open('source/src/data/timeline.json'));f=t['fps'];fw={}
[fw.setdefault(s['scene'],s['words'][0]['from']/f) for s in t['segments']]
for sc in t['scenes']:
    a=sc['from']/f;c=0 if a==0 else (math.ceil(a) if math.ceil(a)<=fw[sc['id']]-0.1 else math.floor(a))
    print(sc['id'],'%d:%02d'%divmod(c,60))"
```
