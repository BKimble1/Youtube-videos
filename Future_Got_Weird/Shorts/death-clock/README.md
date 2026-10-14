# Future Got Weird Short: The Death Clock (V2)

A 45.47 s vertical Short (1080×1920, 30 fps, 1364 frames) about a **fictional** future wristband that counts down to the wearer's death and calls for help. A small, unboxed "FICTIONAL FUTURE DEVICE" cue sits in the upper-left corner for the first 1.3 s, and the packaging text is plainly hypothetical (`upload/PACKAGING_V2.md`).

Not uploaded, scheduled or published.

V2 revises V1 against the owner's review: a less theatrical narration with purposeful pauses, a coherent fall, an arm that stays attached, a new device, a literal journey into his arm and chest, a full-frame treatment, a sit-up with weight and contact, a green recovery screen, one brief genre cue instead of persistent badges, captions without plaques, thinner outlines, and a rebuilt sound design. **V1 is recoverable**: its deliverables are unchanged in `exports/v1/`, and its source is at commit `6772c36`.

## Deliverables (`exports/v2/`)

| File | What it is |
|---|---|
| `FGW_DeathClock_V2_Final_1080x1920.mp4` | Upload master: native 1080×1920 30 fps from the project source, burned-in captions, H.264 CRF 16, AAC 320k 48 kHz |
| `FGW_DeathClock_V2_Review.mp4` | 540×960 review copy, the same 1364 frames and timing (not for upload) |
| `FGW_DeathClock_V2_QA.md` | Timecoded QA notes: what was checked, how, and what is unresolved |
| `FGW_DeathClock_V2_Captions.srt` | Aligned subtitles (31 cues, the same chunks as the burn-in) |
| `FGW_DeathClock_V2_Cover_1080x1920.png` | Cover candidate (frame 790 of the caption-free composition) |
| `FGW_DeathClock_V2_Narration_Locked.txt` | The five locked narration blocks, verbatim |
| `audio/FGW_DeathClock_V2_Narration_48k.wav` | The selected V2 take after the pause-only edit (mono, 24-bit) |
| `audio/FGW_DeathClock_V2_Stem_{narration,music,effects}_48k.wav` | Stems after ducking and the shared limiter; they sum to the mix |
| `audio/FGW_DeathClock_V2_Mix_48k.wav` | Final mix |
| `EXPORT_METADATA.json` | ffprobe data and SHA-256 for every file above |

Supporting documents: `script/CUE_SHEET_V2.md` (units, device states, every lengthened pause and what fills it), `audio/narration_v2/NARRATION_PROVENANCE.md` (audition, take choice, edit), `PROVENANCE.md`, `qa/v2/` (contact sheets and phone-overlay check decoded from the final MP4, audio and device checks).

## How V2 is built

**One world, one rig, one band.** From the fall to the help alert, everything is a single camera path in the street world (`source/src/shots/Journey.tsx`). The camera follows the fall, travels down his attached left arm onto the band, and turns about the wrist to the band's side (the case really rotates about the arm's axis, `art/Device.tsx`). There a section opens in the same arm (`art/Interior.tsx`). The port presses to the skin, and a narrow sensor stream runs into a vessel with near and far walls. The camera rides with one hero sensor, then pulls back along the same vessel into a front-view x-ray of the same man (head, hair and clothes outline kept), visits one organ and the heart, and follows the heart's red pulse back down the arm onto the band. Two switches between drawings happen deep inside the vessel, where only the lumen fills the frame; both draw the vessel's contents from the same path and the same arc-length generator, so they match.

**Device** (`art/Device.tsx`): a forearm cylinder with the strap as a ring around it (far side visible past the wrist's outline, contact shadows on the skin), a slim cobalt case built as a 3D box on the cylinder (bevel, dark glass, side control) and the screen UI drawn into the glass plane. The same component draws the band in the wide shots, the macros, the side section and the ending. States come from `lib/device.ts`: green scan → crimson CALCULATING → 00:02:14 counting at film speed → diagnostic → HELP ALERT SENT → held (blue, STABILIZING) → green "Life Expectancy: 42 Years" → one "?" glitch.

**Rescue and after** (`shots/Rescue.tsx`, `shots/Aftermath.tsx`): the alert ring opens a circular window onto a map of the same neighbourhood (his lawn and the dog are on it). The cut into the hub leads to the drone lifting off a rooftop pad; his medical data docks; it crosses the street and settles over him. Its light leads into the band, the same underside section, one blue treatment pulse and a wave along the vessel. The camera returns to the band face (timer held) for his deep breath, then the sit-up: the support hand meets the grass, the elbow loads, and the band turns green as he rises. The ending is the green readout toward his gaze, then his worried face, the "?" near "know?", his uneasy look and a short dip to black.

**Finish:** outlines are thin selective edges (`lib/ink.tsx` `OUTLINE_K`), and the interiors use the same gradient-and-gloss primitives as the exterior. Captions (`shots/Overlay.tsx`): Fredoka Bold 70 px, a thin dark stroke and a small shadow, no plaque, 2–5 words, at most two lines, one lane (centre y 1450), and six emphasised words in the whole film.

## One cue system

`audio/narration_v2/narration_words_final.json` holds the measured word times. `source/src/lib/timeline.ts` turns them into the beat table `B` and the unit list `UNITS`; every camera mark, device state, caption window and sound cue reads from them. `source/scripts/export_cues.ts` writes `audio/v2/cues.json`, from which the mix, the SRT and the cue sheet are built.

## Rebuild

Requirements: Node 20+, Python 3.11+ with numpy, ffmpeg/ffprobe, and Chromium (`/opt/pw-browsers/...` here; the path is set in `source/remotion.config.ts`).

```bash
cd source
npm ci
npx tsc --noEmit
npx tsx scripts/export_cues.ts            # -> ../audio/v2/cues.json
npx tsx scripts/check_device.ts           # countdown and state logic, every frame -> ../qa/v2/DEVICE_CHECK.json
cd ..
python3 tools/build_voice_v2.py           # V4 take -> audio/narration_v2/narration_final_48k.wav (pause-only edit; committed)
python3 tools/build_audio_v2.py           # cues + narration + SFX -> audio/v2/stems, audio/v2/mix, audio/v2/MIX_LOG.json
python3 tools/qa_audio_v2.py qa/v2/AUDIO_QA.json
python3 tools/make_srt_v2.py captions/FGW_DeathClock_V2.srt
python3 tools/make_cue_sheet_v2.py        # -> script/CUE_SHEET_V2.md
cd source
npx remotion render src/index.ts DeathClock ../exports/_wip/v2_captioned_silent.mp4 --crf=16 --x264-preset=slow --color-space=bt709 --muted --concurrency=4
node scripts/frames.mjs ../exports/_wip/cover DeathClockClean 790 1 && mv ../exports/_wip/cover/DeathClockClean_0790.png ../exports/_wip/v2_cover.png
cd ..
python3 tools/export_v2.py                # mux, review copy, audio/text deliverables, metadata -> exports/v2
F=exports/v2/FGW_DeathClock_V2_Final_1080x1920.mp4
python3 tools/qa_sheets.py $F qa/v2 6 20,70,180,320,420,470,540,650,730,800,860,940,1030,1100,1160,1250,1316,1340
python3 tools/motion_scan.py $F
```

The full render takes about 8–9 minutes on this container. Renders are deterministic: no random calls at render time, no network fetches, and springs are re-simulated from a fixed window of past frames. `npx remotion studio src/index.ts` opens the compositions. `DeathClock` (captioned) and `DeathClockClean` (no narration captions) are the film; `JourneyTest`, `DeviceTest` and `Lab*` are development rigs.

## Layout

```
script/      narration_locked.json (source of truth), CUE_SHEET_V2.md (V1: CUE_SHEET.md)
source/src/  lib/ (timeline beats, device states, captions, sound cues, camera, ink, shading, motion)
             art/ (Man, Head, Hand, Dog, Device, Interior, Street, Drone, Map, Vessel, Body)
             shots/ (Journey, Rescue, Aftermath, Scene, StreetShots, Overlay)
audio/       narration_v2/ (audition, takes, edit, word times), v2/ (cues, stems, mix), sfx/gen, V1 audio
tools/       *_v2.py builders and checks; V1 tools kept
exports/     v2/ deliverables; v1/ unchanged
qa/v2/       decoded-frame sheets, phone overlay, AUDIO_QA.json, DEVICE_CHECK.json
upload/      PACKAGING_V2.md (V1: PACKAGING.md)
```
