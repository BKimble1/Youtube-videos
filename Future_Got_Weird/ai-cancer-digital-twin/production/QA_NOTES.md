# QA notes — Digital Twin / Molecular Attack (first complete cut, 22 Oct 2026)

Only checks that were actually performed are listed. **This environment has no audio or video output: nobody has
watched the film at normal playback speed or listened to the mix.** Every visual judgement below comes from frame
sheets (stills sampled from the rendered file); every audio judgement comes from measurements. A real-time watch and
listen by the owner is still required before publishing.

## 1. Technical measurements (rendered review file)

Results: `qa/review2/results.json` (1080p review) and `qa/master4k/results.json` (4K master), tool `tools/qa_review.py`; final numbers in section 6.

- Container/streams, duration, frame count: ffprobe.
- Delivered audio loudness and true peak: decoded from the MP4, ITU-R BS.1770 (pyloudnorm), 4× oversampled peaks.
- Black frames: ffmpeg `blackdetect` (d ≥ 0.1 s, pixel threshold 0.06).
- Frozen stretches: ffmpeg `freezedetect` (noise 0.0008, ≥ 1.2 s).
- Picture activity: mean absolute difference between frames sampled 1/6 s apart on a 192×108 grey copy, averaged per
  second; seconds below 0.35 are flagged as possible "held finished scene" moments.

## 2. First 15 seconds (sheet: `qa/review2/first15.png`, every 0.5 s)

Checked: frame 0 already shows the device mid-tumble in the protein crowd (no logo, greeting or title); the cutaway
reveals the hidden ligands at 1.8 s; the membrane and receptors are revealed by 3.5 s; the acidic shift and the locks
at 5.6–7.0 s; the flaps open at 7.0–7.7 s; receptors start to gather; the cell-death payoff is withheld; the match
cut to the wireframe model lands at 8.8 s and the clinician appears by 13.4 s. The scale changes at about 1.8, 3.5,
6.5, 8.8 and 13 s.

Fixed after the first review render: the test "attacks" entering the model at 10–12.5 s were too small to read
(now ~3× larger with a visible hit ring).

## 3. Transitions, geometry, continuity (strips: `qa/review2/strips/`, ±0.3 s and ±1 frame around all 35 cuts)

Found in the first review render and fixed before the second:
- near-empty frames just after four cuts (model-vs-measurement screen at 48.4 s, the "usually works" crowd at 53.8 s,
  the opportunity scene at 137 s, the workflow loop at 174.7 s) — content now present on the first frame;
- the device-silhouette wipe at 1:43 read as ~0.5 s of black — the silhouette is now dark gold (reads as the device)
  and passes faster;
- an oversized translucent flash on the immune-cell receptor close-up (≈1:38) — reduced;
- the mux used `-shortest` and dropped the last 4 frames — now the audio is padded, all 6,547 frames kept.

Found and fixed earlier, during per-section still reviews: the open device's flaps hung down like legs (now swing
out flat); the clinician rig rendered in the wrong place (nested-SVG positioning); the match-cut contour sat ~200 px
off; an MRI underlay made the model/measurement comparison unreadable; the free-drug molecules, the mice and the
hidden peptide pattern were too small; the researcher was hidden behind the bench; the infusion forearm was a flat
slab; the DNA-folding beat was framed too tight.

Checked and not changed: no duplicated or mirrored anatomy found in the sheets (the cutout rig is drawn once per
character; molecules are not mirrored copies with swapped sides). Off-screen action: the device is briefly cut by
the frame edge as it enters the callback at 3:28–3:29 (intentional entrance).

## 4. Mechanisms against sources (by reading the brief's research notes; source pages could not be opened here)

| Mechanism on screen | Source basis | Check |
|---|---|---|
| ADC: antibody + linker + payload; binds a surface target; internalised by endocytosis; compartment matures; enzymes cleave the linker; payload released into the cytoplasm; payload damages the cell (DNA-damage marks, blebbing, fragmentation) | FDA ADC recap [4]; ENHERTU PI §11–12.1 [5] (topoisomerase-I-inhibitor payload; cleavable linker cleaved by lysosomal enzymes) | Consistent with the brief. Enzymes drawn as protein blobs, not scissors. Linkage visible on the antibody. Not presented as a giant capsule. |
| ADC side effects: a healthy cell carrying a little of the same target takes the conjugate up | [4–5] (serious side effects; targeting is not perfect) | Consistent; shown as a possibility, not a documented case. |
| AI-designed binder as the recognition tip of an experimental CAR on a T cell | Chow et al. 2026 [6], preclinical | Separate scene and cell type; never morphs from the ADC. |
| DNA switch: folded-DNA structure hides a peptide pattern; pH-sensitive locks release under acidic conditions; exposed pattern clusters death receptors; intracellular adaptors gather; apoptosis | Wang et al. 2024 [7]; KI news [8] | Consistent with the brief. The hexagon of six peptides comes from general knowledge of the paper, not the brief (not re-checked here). No injection, no genome cutting, no ADC payload. |
| Mouse study: reduced tumour growth vs an inactive device | [7–8], as stated in the brief | Both tumours grow; the treated one more slowly; nothing vanishes; no percentages. |
| Digital twins: tumour models from scans, updated with new measurements, compare options; uncertain boundary; model vs later measurement mismatch | NCI 2025 [1]; Wu et al. 2025 [2] | No whole-body clone, no percentages or cure probability; simulated success sent to dashed lab/animal/human gates. |
| Resistance: subclones; selection by treatment; prediction from single-cell expression with clinician review | PERCEPTION / NCI 2024 [9] | Shown as decision support, not a controller of the DNA device; resistance not attributed to the DNA-switch study; no conscious cell. |
| Acidity | General: tumour surroundings can be more acidic; not unique to cancer | Shown as a regional warm haze, not as a cancer-only signal. Narration carries no claim of uniqueness. |

## 5. Narration, captions, sound

- Narration: the locked script verbatim. All 12 takes were transcribed (ElevenLabs Scribe); every take read the full
  text with no missing or extra words. Delivery rate of the chosen takes: 152–175 words/min per block (≈160 overall,
  slightly below the brief's 165–175; the voice was not sped up). Pauses: 1.02 s after "it opens.", 1.02 s after
  "It survives."
- Captions: generated from the locked script text, timed to the measured words; the caption text is identical to the
  script (557 words, em dashes kept), 70 cues, ≤ 2 lines × 42 characters, never before the words start.
- Mix (`audio/mix/mix_measure.json`): narration at -16 LUFS before the final gain; score ducked by the voice envelope
  (≈ -8 dB under speech; music ≈ 16 dB below the voice RMS during speech); effects ducked ≈ 3 dB. Score drops to a low
  drone and a slow pulse after "It survives"; no fanfare on the mouse result; fades with the picture.
- Not done: listening. Masking, balance and sound choices are untested by ear.

## 6. Final numbers

| | 1080p review | 4K master |
|---|---|---|
| File | `exports/FGW_AI_Cancer_DigitalTwin_REVIEW_1080p.mp4` | `exports/FGW_AI_Cancer_DigitalTwin_MASTER_4K.mp4` |
| Video | H.264 High, 1920×1080, 30 fps, yuv420p, BT.709, CRF 16, 6,547 frames | H.264 High, 3840×2160 (rendered natively at scale 2, not upscaled), 30 fps, yuv420p, BT.709, CRF 16, 6,547 frames |
| Audio | AAC 48 kHz stereo 320 kb/s (same mix) | same |
| Duration | 3:38.23 | 3:38.23 |
| Size / SHA-256 | 197,183,079 B / `6a1fb6b3…c8ab` | 437,292,718 B / `fea2bcf1…589f` |
| Integrated loudness / true peak (decoded from the file) | -14.18 LUFS / -1.12 dBTP | -14.18 LUFS / -1.12 dBTP |
| Black frames | only the intended closing fade (3:37.43–3:38.20) | same |
| Frozen stretches ≥ 1.2 s | none | none |
| Seconds with low picture activity (< 0.35) | none (lowest 0.48 at 0:25 — the slice stack settling; median 5.9) | none |

The 4K master was rendered in three frame ranges (0–3299, 3300–4899, 4900–6546) and joined without re-encoding;
both joins were checked against the 1080p render (PSNR ≈ 42 dB on the frames either side of each join, i.e. the same
pictures, no offset). Full-resolution crops were inspected for edge quality.

Both files are Git-ignored (too large for plain Git; Git LFS is unavailable) and are kept as 20 MB parts with SHA-256
sums in `backup/` — restore with `cat backup/<file>.part_* > exports/<file>` then `cd exports && sha256sum -c
../backup/JOINED_SHA256SUMS`.

Exact render commands used:

    (cd source && npx remotion render src/index.ts Main ../exports/_video_1080p.mp4 --props='{"audio":false}' --muted --crf=16 --x264-preset=medium --color-space=bt709 --concurrency=4)
    (cd source && npx remotion render src/index.ts Main ../exports/_video_4k_a.mp4 --props='{"audio":false}' --muted --scale=2 --frames=0-3299 --crf=16 --x264-preset=medium --color-space=bt709 --concurrency=4)   # likewise 3300-4899 → _b, 4900-6546 → _c
    ffmpeg -f concat -safe 0 -i list.txt -c copy exports/_video_4k.mp4
    ffmpeg -i exports/_video_<1080p|4k>.mp4 -i audio/mix/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -af apad -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart exports/<final>.mp4

## 7. Open items for the owner

1. Watch and listen at normal speed (not possible here): pacing, effect levels, music balance, voice quality.
2. Decide the title (see `upload/UPLOAD_TEXT.md`); the working title states something the film says is false.
3. Re-open the nine source links before publishing (none could be reached from this environment).
4. Narration pace is ≈160 words/min, a little under the brief's 165–175; the voice was not time-compressed.
5. The hexagonal peptide layout and the inactive-device control are drawn from general knowledge of the 2024 paper
   (the brief confirms the control comparison, not the hexagon) — confirm against the paper.
6. No thumbnail was requested or made.
