# HOOK 07: BEATING_HEART (human heart beating outside the body)

Output: `exports/FGW_HOOK_07_BEATING_HEART.mp4`. Source: `source/src/h07/` (Hook.tsx, timeline.ts, heart.tsx, section.tsx,
machine.tsx, geom.ts). Audio: `tools/audio/h07.py`. Every event time is in `timeline.ts`, keyed to the word timings
(the beats to "beating", the window to "even", the window close to speech_end), and mirrored in `h07.py`.

## Shot plan
- **0–0.5 s.** Frame 0 is already close on a large, whole heart (zoom 1.8). It hangs from a clear aortic connector inside a
  clear dome chamber and rests in a mesh sling, with the arterial and return tubes running to the lid ports. Systole
  starts at 0.05 s: the apex lifts toward the fixed base, the walls squeeze and the apex wrings slightly.
- **0.5–2 s.** The rhythm continues at about 79 bpm (beats every 0.76 s; one lands at 1.57 s, on "beating" at 1.65 s). From
  1.0 to 2.3 s the camera eases back to the whole machine. The monitor shows ECG, pressure and flow traces in sync with
  the beats. The oxygenator, heater, pulsatile pump (it strokes each beat) and reservoir appear, and flow texture moves in
  every tube.
- **2–4 s.** On "even" (2.40 s) the camera pushes back in. A cut window opens on the heart itself, growing from the aortic
  root (2.48–3.18 s). Inside it: red cells come down the aortic connector, the three aortic cusps stay closed, and the
  blood turns into the left and right coronary ostia. It flows through the left main, LAD, LCx and RCA (cells also run
  on the surface vessels) and then the septal and RV intramural branches. A blush spreads into the wall in each
  diastole. The thick-walled, unloaded LV slit and the thin RV crescent squeeze and refill. Dark venous cells rise in the
  great cardiac vein and drift through the RV. The pulmonary connector carries dark blood out.
- **4–6 s.** After the narration ends (4.29 s), the window closes (4.33–4.91 s) and the camera pulls back to the machine.
  The closing beat at 5.37 s is the strongest (1.38×). With it come a bright pump surge up the arterial line, an ECG spike
  and the heaviest lub-dub. The camera keeps drifting out through the last frame, as the heart relaxes and refills.

## Transitions (outgoing → incoming → new information → kept)
1. Close heart → pull-back (1.0–2.3 s) → tubing, pump, oxygenator, reservoir, monitor → the same heart, beat and lighting.
2. Wide machine → push-in with the local cut window (2.3–3.5 s) → perfusion route inside the heart → the surface anatomy
   around the window, its coronaries and the beat.
3. Cutaway → the window closes as the camera pulls out (4.1–5.45 s) → the system running steadily, the closing beat → the
   whole scene. There are no hard cuts anywhere.

## Science
- Shown: ex vivo normothermic perfusion ("heart in a box", e.g. the OCS Heart, FDA-approved 2021), with no brand
  shown. The parts are a wheeled console, a clear dome chamber, a warm-temperature indicator, a sling, the oxygenator with
  its heater lines and gas line, a pulsatile pump, a reservoir of dark blood and clear PVC tubing. The perfusion is
  Langendorff-style: arterial blood enters the aorta through a cannula, the aortic valve stays closed, and the blood
  enters the coronary ostia, runs through the coronaries and myocardium, and returns as dark venous blood via the
  cardiac veins and right heart to the pulmonary-artery cannula. The heart beats on its own: an "empty" (unloaded) LV
  with a slit cavity, and the wall thickens in systole. Coronary flow and the blush peak in diastole. Two ECG/pacing
  leads are attached (on the RA and LV). The SVC is tied off.
- Anatomy: anterior view (patient's right on the viewer's left), apex down and to the patient's left (lower right on
  screen). It shows the RA and right auricle, the left auricle, the ascending aorta and the pulmonary trunk cut and
  cannulated with tie bands, the LAD, diagonals, LCx, RCA, acute marginal and great cardiac vein, and epicardial fat in
  the grooves.
- Deliberately not shown: gore and spatter, the left atrium and mitral valve (they are posterior and not part of the
  route), and the RV outflow tract inside the window (it crosses in front of the LV outflow, so a frontal cut can't
  show it). The coronary sinus/RA return is implied: venous cells rise in the GCV and drift up through the RV.
- Sources: TransMedics OCS Heart (FDA PMA approval 2021) public descriptions; the Langendorff isolated-heart method; and
  standard anterior-view cardiac anatomy (coronary distribution, aortic valve cusps and ostia).

## Assets
- All newly drawn in `source/src/h07/`: the heart rig (point-based deformation field), the cutaway, the machine,
  chamber, monitor and room. It uses the shared `lib.ts` (keyCR, ss, closedPath), `color.ts` (lit/shade/mix/rgba) and
  `INK` from `ink.tsx`. No characters (no person is needed). The gradient and rim-shading approach follows
  dead-spider `dc/shade.tsx`, and the cut window follows the Zombie Ant muscle cutaway.

## Audio cues (`tools/audio/h07.py`, fx_lufs −26.5)
- Bed: clinic room tone, console hum (100 Hz harmonics), a soft pump stroke 0.24 s after each beat.
- Each beat (0.05, 0.81, 1.57, 2.33, 3.09, 3.85, 4.61, 5.37 s): a wet low "lub" at systole and a "dub" 0.29 s later, plus a
  very soft monitor QRS tick.
- 2.48 s: a soft wet opening as the window opens. 2.63 s onward: coronary flow texture. 3.0 s onward: a low trickle.
  4.33 s: the window closes.
- 4.62 s: a low swell into the 5.37 s closing beat (+3 dB, heavier body with a sub tail; about −19 dB RMS against −22 dB
  for the 4.6 s beat).

## QA (rendered file)
`{"frames": 180, "audio_decoded_s": 6.016, "voice_onset_s": 0.022, "mix_lufs": -17.01, "sample_peak_dbfs": -1.01,
"motion_mean_per_second": [5.6, 18.0, 15.0, 15.3, 16.9, 11.4], "longest_static_run_frames": 0, "all_pass": true}`.
All 10 checks pass.

Fixes between passes:
- **Pass 1.** The first window covered the LAD and a ghosted LAD floated over the LV cavity, so I moved the window
  between the RCA and LAD. The surface coronaries now stay visible and carry cells, and the LAD's septal perforators
  feed the cut. I connected the LV outflow to the valve, drew three closed cusps, added rim shading for volume, and
  redrew the sling as mesh fabric.
- **Pass 2.** The camera was too fast: the peak frame difference was 29, now 24.3, about the Zombie Ant reference's 23.6. I
  slowed and stretched the moves, reframed both wide views so the console bay sits above the caption, and moved the RV ECG
  pad off the cut and onto the RA. I also thickened the intramural branches and cells and strengthened the blush so they
  read on a phone, and added pump surges up the arterial line (the strongest on the closing beat).

## Known limitations
- The camera does three large moves in 6 s (close → wide → section → wide), as the shot spec requires. 61 frames have a
  luma change over 18. They are smooth eased dolly moves, not cuts, but brisk.
- In the wide views the heart is about a third of the frame width, so the closing beat is smaller on screen than in the
  close-up. Its weight comes from the contraction, the tube surge, the ECG spike and the sound.
- The cutaway is a schematic frontal section: the RV outflow to the pulmonary trunk and the coronary sinus aren't drawn
  inside the window. The window's top edge also cuts across the base of the pulmonary trunk to show the left main.
- The sling and chamber are generic, not an exact copy of the commercial device.
