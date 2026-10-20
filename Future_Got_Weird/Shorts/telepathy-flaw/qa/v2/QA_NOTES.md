# QA notes — V2
Performed on the delivered review MP4 and on source stills, by measurement or by looking at decoded frames:
- contact sheets every 8th frame and a phone-size sheet with an estimated Shorts overlay (`sheets/`);
- full-size stills: opening, macro/decoder, cortex, neck lens, two-shot, face close-ups, cancel close-up, receiver recoil, loop return;
- bursts either side of each hard cut (10.30, 13.10, 13.95, 14.50, 16.70, 18.00, 19.85, 21.84, 23.00, 24.55, 27.40);
- motion scan with the cut list (`MOTION_SCAN.json`);
- caption/UI collisions (`LAYOUT_CHECK.json`): 835 captioned frames, transient overlaps only (sender eyes 6.0 s and 27.63 s during zooms; cancel chip 27.07–27.10 s);
- loop seam (`seam/SEAM_CHECK.json`): picture step 0.41 at the seam against 0.6–2.6 in the neighbouring steps; frame 839 vs frame 0 mean abs difference 0.79 (0–255) at full size; audio seam step 0.03 vs 99.9th percentile 0.29;
- audio (`AUDIO_QA.json`): −16.0 LUFS, −1.2 dBTP, no clipped samples, stems sum exactly to the mix, narration stem = take × constant gain.

Not performed: any real-time watching or listening; headphone/phone-speaker playback; three-repeat playback (a x3 file is generated locally into `seam/` and is git-ignored); platform preview. The 4K file was verified by ffprobe and by a sample of decoded frames only.
