# Lightning Laser V3: QA report

Files checked:
- `exports/FGW_Lightning_Laser_V3_REVIEW_1080x1920.mp4`
- `exports/FGW_Lightning_Laser_V3_MASTER_2160x3840.mp4`

Every result below comes from the rendered files, not the source. **Not published.**

This environment has no display or speakers, so nobody has watched the video in real time with sound. Instead the
file was checked with:
- frame strips and stills read from the MP4 (`qa/v3/strips/`);
- a frame-difference motion scan;
- hashes of the audio stream.

Please watch the review, and `qa/v3/FGW_Lightning_Laser_V3_REVIEW_loop_x3.mp4` (regenerated, not committed), at
full speed with sound.

## Audio and timing: unchanged (`qa/v3/audio_identity.json`)

| Check | Review | Master |
|---|---|---|
| Audio packets (sha256) | `4c3f0b74…9dd6`, **identical to V2** | identical to V2 |
| Decoded PCM (sha256) | `6a353e72…ffd0`, **identical to V2** | identical to V2 |
| Lag against `mix_v2.wav` | 0 samples (correlation 0.99986: AAC against the WAV) | 0 samples |
| Audio length | 33.515 s container; 1,608,704 decoded samples against the mix's 1,608,000 (AAC priming and padding only) | same |
| `mix_v2.wav`, `timeline.json`, narration | unchanged (hashes in `production/V3_AUDIO_LOCK.md`, re-checked after the render) | — |

The V3 picture was rendered muted. V2's AAC stream was then copied in packet for packet (`ffmpeg -c copy`), with no
re-encode, trim or offset. The narration, soundtrack, caption wording and caption timing are the approved ones.

## Picture (`qa/v3/FGW_Lightning_Laser_V3_REVIEW_qa.json`, ffprobe)

| Check | Review | Master |
|---|---|---|
| Stream dimensions (measured) | **1080 × 1920** | **2160 × 3840** (native: vectors and text rendered at 2×, not upscaled; edges visibly crisper than the review pixel-doubled) |
| Codec | H.264 High, yuv420p, BT.709 | same |
| Frame rate / frames | **30/1, 1005 frames**, 33.500 s | 30/1, 1005 frames, 33.500 s |
| Size | 25.4 MB | 63.4 MB |
| Loudness (of the unchanged audio) | −14.0 LUFS integrated, LRA 2.8 LU, true peak −1.6 dBFS | — |
| Black segments / freezes ≥ 0.5 s | none / none | — |

The attached 512 × 910 review copy was a transcode. The source project renders at 1080 × 1920 and 2× above that.

## Motion scan (`qa/v3/motion_scan_v3.json`)

The mean frame change is 2.6, against 6.19 in V2: the camera is calmer and there are fewer cuts.

The spikes fall only at the planned events:
- hard cuts at frames 235, 269, 291, 769 and 923;
- the match cut at 869;
- the discharge flashes: connection at 53, restrike at 106, demonstration connection at 656.

There are no random shakes and no alternating zooms.

The low-change stretches are action in a small area under a still camera:
- F's leader climbing, 595–645;
- F's held result, 726–767;
- G's settled tip before the match cut, 852–867.

## Loop seam

| Frames | Change, whole frame | Change, outside the caption band |
|---|---|---|
| 1004 → 0 | 2.42 | 1.04 |
| neighbouring frames | 0.7–0.9 | 0.77–0.90 |

The whole-frame step at the seam is the first caption appearing at frame 0. That is locked caption timing; the same
happens when "using the AIR ITSELF" leaves at frame 1002. The camera, leader, rain and drift continue on one clock
(strips `seam_end`, `seam_start`).

## Final review of the rendered file

There were seven independent reviewers: one per beat range plus one for the whole film. They read only the final
MP4: labelled strips at every 1–3 frames around the press, the scale changes, the leader origin, the measurement
reveal and the seam, plus full-resolution stills. Each non-nit finding then went to a skeptic, who re-extracted the
frames at full resolution and tried to refute it.

**Result:**
- no blocker and no major finding survived;
- 11 findings were confirmed as minor, 4 were downgraded to nits, and 20 nits were reported without verification.

Full output: `qa/v3/final_review.json`.

### Acceptance questions

| # | Question | Answer (from the final file) |
|---|---|---|
| 1 | Laser-to-lightning relationship in the opening without pausing | **Yes.** From frame 0 the white-violet leader climbs the thin cyan line from the rod tip, with packets and the warm band ahead of it. It leaves the line above the guided section while the line runs straight on, and connects at frame 53. |
| 2 | Main event on screen during "the lightning FOLLOWED it" | **Yes.** The same bolt stays in the same place (frames 76–129), with the guided section brightest, continuing-current flicker, fronts climbing it, and restrikes at frames 106, 110 and 115. There is no cutaway and no character. |
| 3 | Each explanation prepares the next event | **Yes, mostly.** The stalled streamer leads to "resists"; the press starts the beam; the packets lead into the molecular process; the warm band is what E's leader runs; E leads into F's guided strike; G's tip match-cuts to H's extension. Weak spots are minor: the band reads narrow a little after "channel", and the E → F hand-off is briefly thin. |
| 4 | Laser, changed air and discharge distinguishable throughout | **Yes, with caveats.** Cyan, warm and white-violet stay separable in every 3D view. The warm sheath is mostly covered by the violet glow in A after the connection (A-2). G's copper conductor uses a similar orange (a real copper colour; nit). |
| 5 | Adjacent views preserve position and direction, or motivate the change | **Yes.** A → B is continuous. The zoom-dissolve lands on the same tip point. The beam angle holds across 290 \| 291. The packet is at centre on both sides of 342 \| 343. The E → F pull-out keeps the line's position and direction. Tip lands on tip at 868 \| 869. The 922 \| 923 reveal is motivated by "into the SKY". |
| 6 | Machine activation: hand contact and a visible consequence | **Yes.** The fingertip lands on the FIRE cap at frame 240 (the click is at 8.01 s) with wrist, elbow and shoulder connected, and the cap depresses. Then the LED bar sweeps, the lamp lights, the trace jumps (243) and the beam appears in the window (244). One clean release follows (257–262). |
| 7 | Distance on the guided section; rod comparison clear | **Yes.** The bracket runs from the rod tip to just below the branch point (guided section only, about 50 m), grows once from "one hundred", and the label arrives on "sixty" (frame 730). G shows only the metal run and its tip, lit together by the distant flash; there is no zone or bracket. |
| 8 | Every retained cut justified | **Yes.** Six hard cuts and one match cut, each bringing something new: shelter, inside the machine, pulses leaving the machine, the house, the extension, the whole system. There are no near-duplicate angles (V2 had 24 cuts). |
| 9 | Natural loop, no visual reset or audio edit | **Yes.** Frames 1000–1004 run into 0–4 on the same camera, leader and phase. The audio is the untouched locked stream. |
| 10 | Script, original audio assets, audio mapping and total timing unchanged | **Yes.** The hashes, durations and frame count above were re-computed independently by the whole-film reviewer. |

### Confirmed minor issues still in the delivered file

These are polish blemishes a careful viewer may notice. None breaks the story or a locked requirement.

| ID | Frames | Issue |
|---|---|---|
| B-1 | 175–225 | B's foreground molecule layer twitches outward by about 1 % every 4–11 frames, instead of drifting perfectly smoothly. The twitch is hardest to see near the leader tip. |
| C-R4-1 | 260–268 | After the release, her far shoulder and upper arm show stacked copies of the sleeve contour for about 0.2 s, as she settles back. |
| A-1 | 132–137 | At the start of B, the fizz on the channel is a small flat lavender disc with a hard edge (about 70 px) for 0.17 s, before the side streamer jabs out. |
| A-2 | 40–129 | After the connection, the violet glow mostly covers the warm sheath around the guided section in A. The warm band is clear in frames 0–37, and again in B, D, E, F and H. |
| D-F4 | 374–376 | The second, representative packet fades up mid-frame over 2 frames instead of visibly travelling in. |
| DE-F1, DE-F2 | 553–580 | At the E → F hand-off, the background lifts briefly to a lighter slate and sinks back. The molecules shrink before the band does, so the pull-out reads as two scale changes. This is the same window as the accepted ED-1 (thin hand-off). |
| F-1 | 712–768 | At the bottom edge below the caption band, the tower's concrete base, revealed by the widening, has a small draw-order and transparency error. |
| F-2 | 656–768 | Above the guided section, the unguided bolt stays close to the cyan line and a few branch stubs cross it, which slightly blurs where the guidance ends. The bracket still marks the guided part. |
| GH-1 | 877–884 | In H, the extending channel starts as a soft round warm blob for about 0.25 s before it reads as a band growing along the axis. |

Earlier accepted minors that are still present: C-5, DE-7, ED-1, DE-3, R2-N2 and R3-N1. They are listed in the review
script and earlier reports.

The known audio consequence also remains (`production/V3_AUDIO_LOCK.md`): the ARM click at 2.72 s and the muffled
interior storm bed at 2.52–4.31 s were mixed for V2's picture and now play under the exterior opening.

## Earlier rounds (source previews, before the final render)

- Early checks of the opening, the 8–12 s machine transition and the loop are in `qa/v3/early/`.
- Two review rounds (find → skeptic verify) ran over half-resolution previews:
  - round 1 found 1 major (the stalled-streamer "fishbone" in A) and about 40 minors;
  - the major and most minors were fixed (commits 40cc4cf and e3c0cfd), and in the re-check every reviewer passed
    questions 1–10.
