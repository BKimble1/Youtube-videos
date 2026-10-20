# QA notes — V3
Performed on the delivered review MP4 and on source stills, by measurement or by looking at decoded frames:
- layer audit of every frame against the single story-state timeline (`LAYER_AUDIT.json`, pass): cancel group only in 19.83–21.67 s and 26.95–27.37 s; warning card 15.47–16.57 s; red packet 14.93–25.93 s; blue packets only in their own windows; at most one packet on screen; frames 0 and 839 carry no stale layer; crown window open only in the shots that show the interior;
- contact sheets every 8th frame, phone-size sheet with an estimated overlay (`sheets/`);
- full-size stills of the opening, implant macro, decoder, red passage, insert, cancel close-up, delivery and loop return; bursts either side of the cuts;
- motion scan with the cut list (`MOTION_SCAN.json`): remaining spikes are intended camera moves and the silhouette in/out;
- caption/UI collisions (`LAYOUT_CHECK.json`): 835 captioned frames; 3 transient frames with the sender's eye region under the lane while the camera moves fast (6.00 s, 27.60–27.63 s); the cancel control no longer touches the lane;
- loop seam (`seam/SEAM_CHECK.json`, `seam/seam_frames.jpg`; the x3 clip is generated locally): picture step 0.42, last vs first frame 0.79; audio step 0.03 vs 0.30;
- audio (`AUDIO_QA.json`): −16.0 LUFS, −1.2 dBTP, no clipped samples; narration stem identical to V2's.
Not performed: any listening (film or loop), real-time viewing, headphone/phone playback, platform preview.
