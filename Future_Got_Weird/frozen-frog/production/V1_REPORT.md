# Frozen Frog V1: review report

**File.** `exports/FGW_Frozen_Frog_V1_REVIEW_1080x1920.mp4`. **It is not published.**

**Runtime.** 24.5 s (735 frames at 30 fps). This is inside the brief's 23–26 s. The locked narration ends at 22.88 s;
the rest carries the hop, the landing and the return to the opening's framing.

## Measured (from the rendered file)

| Check | Result | Evidence |
|---|---|---|
| Format | 1080×1920, 30 fps, H.264 yuv420p (BT.709, CRF 16), 735 frames, 24.5 s; AAC 48 kHz stereo, 317 kb/s; 45.1 MB | `qa/v1/render_qa.json` |
| Full decode | no errors | `qa/v1/render_qa.json` |
| Narration in the final file | Whisper base.en: word-perfect against the locked text. Zipformer: one homophone ("its cells" → "itselves"). | `qa/v1/final_asr.json` |
| Loudness (final file) | −14.5 LUFS integrated, −1.6 dBTP true peak (4× oversampled). The voice sits at about −17.5 LUFS in the mix. | `qa/v1/mix_measure_mix_v1.json`, re-measured on the delivered file |
| Heartbeat | Low band (<110 Hz) at the opening beats is about 18 dB above the gaps between them. After the final beat (0.89 s) it falls to the floor (−38 to −44 dB). The two revival twitches read as small pulses (+4 dB and +15 dB over their gaps). The restart beat (20.05 s) is the loudest beat in the film. | measured on the delivered file, this report |
| Single-frame jumps | None unplanned. Every large frame-to-frame change falls inside a listed camera move (the dives and pull-outs). | `qa/v1/render_qa.json` |
| Static holds | No near-static run; the longest is 0 frames. | `qa/v1/render_qa.json` |
| Loop seam | The last frame and frame 0 show the same picture (mean absolute difference 3.1/255; the only visible difference is that the first caption appears at frame 0). The music beds are circular and the heartbeat schedule is anchored to the loop point. | `qa/v1/loop_seam_last3_first3.png` |

Sheets: `qa/v1/contact_every_0.5s.png` (the whole film) and `qa/v1/hook_0-2.5s_every_3rd_frame.png`.

## The brief's quality-control list

- **Distorted limbs or misplaced eyes.** None found on the sheets. One rig is used throughout, with fixed body
  geometry. The eye is a fixed part of the head and only its lens clouds and clears. The limbs are solved from fixed
  segment lengths.
- **Inconsistent skin pattern or proportions.** The markings are fixed in the body frame. Freezing only adds frost,
  pallor and a clouded lens; thawing removes them.
- **Ice inside protected cells.** None. The ice is drawn only in the extracellular field, under the cells. The needles
  stop 6 µm-equivalent units short of the protected membrane. Inside the cells, the glucose rings keep drifting.
- **Glucose without a clear origin.** It comes from the liver (amber release at organ scale, 9.2 s), runs along the
  belly vein, and the camera follows the rings down that vein into the tissue. In the tissue they arrive along the
  capillary.
- **Confusing liver-to-cell transition.** It is one continuous move along the vein. It was checked frame by frame.
- **Heart movement during the frozen state.** None. The beat schedule has no beat between 0.89 s and the first
  twitch at 19.20 s. The heart is also visibly frozen (pale, glazed, held in pericardial ice) from about 1 s.
- **Slow or repetitive shots.** There are no static holds. The two tissue visits differ in place (the open field, then
  the capillary edge), scale (frame width 720 → 600 u, then 540 → 430 u, where 1 u = 2 µm) and event (freezing damage, then
  protection).
- **Pauses between narration lines.** These are the take's own gaps, 0.21–0.51 s. Nothing was added.
- **Jerky camera movement.** Every move follows a log-zoom path with velocity-continuous keys. Segment boundaries
  (heart close → trunk → dive) ease in and out.
- **A final jump that fails to connect.** The landing settles onto the opening's framing, one jump-length over, on a
  background that repeats with that length. The cutaway reopens on the same heartbeat.

## How the brief's timings were met

| Brief | Film |
|---|---|
| 0.00–0.30 living frog, a visible heartbeat | Yes. The heart beats at 0.00 s in the cutaway and the throat pumps. |
| 0.30–0.85 frost spreads, movement stops, the push-in, the final beat | Frost covers the frog between 0.30 and 1.35 s (most of it by 0.9 s). Breathing stops by 0.6 s. The final beat is at **0.89 s**; the heartbeat period (0.445 s) is anchored to the loop, so the third beat falls there rather than at 0.85. |
| 0.85–1.50 the heart stops, the sound cuts, ice around the tissues | Yes. No beats after 0.89 s; pericardial ice grows from 0.95 s. |
| 1.50–2.00 into the frozen body | Yes. The window has widened and the camera is close on the heart. |
| Scene B, about 4–8 s | 3.15–8.5 s: the trunk, then the cells. |
| Scene C, about 8–14 s | 8.5–13.85 s. |
| Scene D, about 14–18 s | 13.85–16.45 s, then spring begins (the narration's "spring" is at 16.59 s). |
| Scene E, about 18–23 s | 16.45–20.75 s: the melt from 16.6 s, the heart from 18.35 s, the first beat at 20.05 s ("again" is at 20.02 s). |
| Scene F, about 23–26 s | 20.8–24.5 s: "HOPS" is at 21.08 s, so the hop starts earlier than the brief's estimate. |

## Unresolved production issues

1. **No one has listened to it in real time.** This environment has no audio playback. The voice was chosen by two
   ASR models and measurement; the mix was checked by loudness, true peak, the heartbeat's band level and the final
   file's ASR.
2. **Runway was not used.** Earlier episodes in this repository record that Runway outputs cannot be downloaded into
   this environment (output host refused). The brief allows Runway only where it improves the result, so the film is
   100% native vector. No credits were spent.
3. **The benchmarks are not in the repository.** Neither Cyborg Cockroach V5 nor Dead Spider V6 is in this repository.
   The work was matched against the most recent Shorts here (Myostatin V6, Zombie Snail, Zombie Ant): the same pipeline,
   caption treatment and finish.
4. **The 2.0–3.15 s frozen-heart beat** is a slow push with ice still growing. It is not static, but it is the
   quietest picture in the film. If it feels long on a phone, the trunk reveal can start at 2.6 s.
5. **The winter scene** is a cross-section (a frog in an air pocket under leaves and a snowpack). It reads clearly but
   is the most diagrammatic shot. A night passes as a smooth dimming, not a flicker, per the "no flashes" rule.
6. **The heart rate** (135 bpm) is faster than a cold wood frog's, so the opening beats read on screen within 0.9 s.

## Science (kept to what the narration says)

- **The freeze.** Wood frogs (*Lithobates sylvaticus*) survive about two-thirds of their body water turning to ice.
  The ice forms outside the cells (body cavity, under the skin, between cells). Heartbeat, breathing and blood flow
  stop. The frozen eye's lens turns white, as shown.
- **The cells.** As ice forms outside them, water leaves the cells and they shrink: shown as blue beads leaving the
  cells and the cells shrinking and one buckling. Ice is never drawn inside a cell.
- **The liver's sugar.** Ice touching the skin triggers rapid breakdown of liver glycogen. Blood glucose climbs by
  about two orders of magnitude, and cells take it up through glucose transporters (the teal gates). Glucose limits
  how far the cells shrink and protects them from damage. This is shown as the buckled cell rounding out and holding
  its size while the ice outside stops at its membrane.
- **A compression to note.** In a real frog the glucose release begins as freezing starts, and the heart keeps
  beating long enough to distribute it before it stops. The narration (heart stops → liver releases sugar) compresses
  that order. The film follows the narration but never shows the heart beating while frozen; the sugar is shown
  travelling along a vessel.
- **Weeks.** Frozen wood frogs survive for weeks (longer in northern populations). On thawing the heart restarts
  first, then breathing. The real recovery takes hours; the film compresses it to seconds.
- **Anatomy.** The heart has three chambers (two atria, one ventricle) with a truncus arteriosus. The liver is large
  and lobed, with a gall bladder. Frog red blood cells are oval and nucleated. The tissue is a muscle cross-section
  (polygonal fibres, nuclei at the edge).
