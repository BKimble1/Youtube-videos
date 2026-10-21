# QA report — FGW Starship Dual Catch, V1 review cut

Date: 21 Oct 2026. Not published. 4K master not rendered.

## Summary

| Item | Result |
|---|---|
| File | `exports/FGW_Starship_Dual_Catch_V1_REVIEW_1080p.mp4` (backed up as parts in `backup/v1/`) |
| Duration | **6:54.4** (414.4 s; narration 6:52.8 + 1.6 s end card) |
| Video | H.264 High, 1920×1080, 16:9, 30 fps, yuv420p, bt709, 12,433 frames |
| Audio | AAC stereo 48 kHz, 320 kb/s; integrated **−15.0 LUFS**, true peak **−1.4 dBFS** |
| Narration | **1,099** spoken words (script), 56 lines |
| Voice | **TEMPORARY: espeak-ng `en-us+m3`, 158 wpm, local, free** (PyPI `espeakng-loader`). Robotic. **Not** the FGW ElevenLabs Test Voice |
| Captions | `captions/FGW_Starship_Dual_Catch_V1.srt`, 128 cues, ≤ 42 chars/line, timed from espeak word events in the rendered narration |
| Third-party footage | **None.** All historical events are original vector reconstructions, labelled |
| Music / SFX | Original, synthesised in `tools/audio_mix.py` (no third-party audio, no paid services) |
| Credits spent | None (ElevenLabs, Runway not used) |

## Why the voice is temporary

The brief forbids spending paid credits without authorization; generating the FGW ElevenLabs narrator spends credits,
so it was not used. A better free neural voice (Kokoro-82M) was attempted, but its weights are only reachable here
through unofficial npm repackagings and the download was blocked by this session's permission policy. espeak-ng was
the remaining free, local option. **The whole film re-times itself from the narration files**, so swapping in the
approved voice is: generate `script/narration.json` lines with the Test Voice → write the three narration files →
rerun mix, SRT and render (see README). Expect the real voice to be slightly faster/slower; shot timing follows it.

## Visual inspection performed (by me, from rendered frames — not real-time playback)

- Contact sheets from the rendered MP4: first 30 s at 0.5–3 s spacing (`qa/sheets/first30.png`), every 6 s over the whole film (`qa/sheets/all_00…03.png`), last 30 s (`qa/sheets/last30.png`).
- Still renders at every narration line midpoint (56 frames) and targeted re-checks after fixes (hook, booster flip, grid-fin close-up, V3 comparison, orbit, flaps, tower reveal, thumbnail).
- Model sheet (`AssetSheet` composition) for cross-view consistency of booster V3 / V1, ship profile / belly / three-quarter, tower with booster and ship caught, plan views.
- I did **not** watch the video at normal speed or listen to it; audio was checked by measurement only.

### Defects found and fixed during QA

| Found | Fix |
|---|---|
| Hook frame 0 was a tight nose close-up with no flame and no arms — not legible | Reframed: frame 0 tracks the whole ship, plume and open arms, then pushes into the catch-point gap |
| Decorative foreground struts read as random black lines | Removed |
| Split screen at 0:24 showed a black half | Clip widths corrected |
| Reentry streak ship too small; ship flew tail-first | Scaled ×2; orientation corrected (nose leading, tiles down) |
| Boostback burn plume pointed straight up (wrong thrust direction) | Booster now rotates engines-downrange before the burn |
| Grid-fin close-up landed on a twisted, foreshortened fin | Camera moved to the side-on fin; lattice moved to the fin's top face (flow passes through it) |
| V3 comparison cropped the fins off-frame | Reframed; slow rotation added to show three vs four fins |
| Orbit ship pointed backwards | Heading corrected |
| Flap highlight circles not on the flaps | Positions taken from the ship geometry |
| Tower low-angle reveal showed only the mount | Perspective and zoom reduced so the full tower reads |
| Many diagram holds were measured as frozen for 2–6 s (ffmpeg freezedetect) | Global 3 % camera creep on every shot; reuse loop animated; V3 fins rotate |
| Effects masked words at onsets (speech-band voice/bed down to −0.4 dB) | Look-ahead, speech-band ducking; loud cues lowered; min now ≈ +1 dB at isolated onsets, median +16 dB (`audio/mix/speech_mask.txt`) |

## Retention audit (honest)

- **First 5 s:** a stainless spacecraft on engines dropping beside a tower with open arms, disclosure chip visible. Legible. The hook's 2D art is clean but not spectacular; the freeze at 0:08 is the strongest beat.
- **First 30 s:** premise is explicit by 0:24 (booster caught, ship never caught) with a title lock-up.
- **First minute:** new information arrives (scale, 33 engines, every ship so far ends in the sea, Musk's claim).
- **Middle:** the booster mechanics and V3 changes are the richest section. Orbit (2:26–3:04) is diagram-heavy and the weakest visually.
- **Final two minutes:** the "what could go wrong" uses one real event (Flight 6 wave-off), which helps. The payoff reuse loop and checklist are functional but plain.
- **Ending:** final line lands on the restacked rocket (labelled hypothetical) and the wordmark.
- **The temporary voice is the single largest retention problem**; nothing else matters as much before upload.

## Unresolved concerns

1. Temporary robotic voice (above).
2. Art quality is a solid explainer level, not yet "top-tier": tower lattice is simple, there is no lighting/rim-light pass on vehicles, clouds are generic, plumes are stylised.
3. Grid fins read well side-on but the front-facing fin is a little geometric in close-ups.
4. Ship flaps in profile view are drawn end-on (narrow dark plates) — geometrically consistent but less recognisable than the edge-on flaps people know; the belly and ¾ views carry recognisability.
5. Ship catch-point geometry is conceptual by necessity (labelled).
6. Starred facts in the Sources file could not be confirmed on primary pages from this environment (spacex.com blocked).
7. A few short effect onsets still sit close to the voice (staging boom 1:11, boostback 1:19, plasma 3:06, beep 5:30).
8. Fixed 3 % creep is uniform; a real edit would vary it per shot.

## Recommended before the master

1. Re-voice with the approved FGW narrator (authorize the ElevenLabs spend, ≈ 6,000 characters).
2. Verify starred claims on spacex.com and the Flight 15 status (date/profile may change before launch).
3. Art pass: vehicle rim lighting, richer tower lattice and carriage detail, better clouds/atmosphere, a stronger reentry plasma.
4. Re-time the orbit section (2:26–3:04) with one more physical action shot.
5. Consider licensed SpaceX catch footage for 0:13–0:19 if rights are obtained.

## Exact 4K export procedure (after approval)

    cd Future_Got_Weird/spacex-wants-to-catch-its-entire-rocket/source
    npx remotion render src/index.ts Main /tmp/fgw_dualcatch_4k_video.mp4 --props='{"audio":false}' --scale=2 --crf=17 --x264-preset=medium --color-space=bt709 --concurrency=2
    ffmpeg -i /tmp/fgw_dualcatch_4k_video.mp4 -i public/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart ../exports/FGW_Starship_Dual_Catch_FINAL_4K.mp4
    ffprobe -v error -show_entries stream=width,height,r_frame_rate -of csv=p=0 ../exports/FGW_Starship_Dual_Catch_FINAL_4K.mp4   # expect 3840,2160,30/1

`--scale=2` renders the SVG vector graphics natively at 3840×2160 (non-scaling strokes scale with the page), so it is
not an upscale of the 1080p file.
