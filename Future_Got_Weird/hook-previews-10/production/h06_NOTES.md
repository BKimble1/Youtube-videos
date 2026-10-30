# HOOK 06: ZOMBIE_SNAIL notes

Line (locked): "This parasite turns a snail's eyestalk into a pulsing lure for birds." Captions are split with `breaks={[6]}`, `capY = 1530` for both phrases.
Output: `exports/FGW_HOOK_06_ZOMBIE_SNAIL.mp4`. Event times live in `source/src/h06/timeline.ts`; `tools/audio/h06.py` recomputes them from the same words file.

## Shot plan (one continuous shot)
- **0–0.5 s:** Medium close-up, z 1.45. An amber snail on a big leaf. Its near eyestalk is already a fat sausage banded green, cream and dark brown, with an orange-red tip and the eye at the tip. It pulses (a beat is already under way at frame 0). The thin normal far eyestalk next to it gives the scale. The snail crawls (slime trail, pedal waves), the stalk sways, and light dapples the leaf.
- **0.5–2 s:** Pulses at 0.89 s and 1.84 s. On "turns" (1.02) the camera starts a straight eased push onto the eyestalk, arriving on "eyestalk" (end 2.46, z ≈ 3.2). As it closes in, the skin film thins, and each beat sends a visible contraction wave from base to tip: the tube swells and narrows, and the bands squeeze and stretch.
- **2–4 s:** On "into" (2.47) a cut window opens locally in the tentacle wall (slit, then oval) and is fully open on "pulsing" (+0.12 s). Inside are the banded broodsac wall in section, the lumen, and packed encysted larvae (cream cysts, each with a curled larva). The pumping wave pushes them back and forth, with circular constriction rings travelling through. A beat lands on "pulsing" (2.79) and the next on 3.74. Meanwhile the camera keeps drifting up the stalk (z peaks at about 3.8).
- **4–6 s:** On "birds" (4.04) a robin hops onto the background twig at the top left (3.96–4.22, in view inside the close-up). The window closes (4.16–4.58) while the camera pulls back (4.12 to 6.0) to the whole snail on the leaf. At 4.84 the robin turns its head down to the eyestalk (with overshoot), then blinks and focuses at 5.14. It hops closer (5.40–5.66) and leans in. The eyestalk keeps pulsing to the last frame, and the camera, crawl and lean are still moving at frame 179.

## Transitions
| outgoing | incoming | new information | kept |
|---|---|---|---|
| wide snail on leaf | push-in on the eyestalk | the stalk is a pulsing tube with bands under translucent skin | same snail, the pulse rhythm, the leaf behind |
| close exterior | local cut window in the same tentacle | broodsac wall, lumen, cysts moved by the pump | the tentacle, its bands and outline around the window, camera still drifting |
| cutaway | window closes as the camera pulls back | a bird is right there and notices the lure | the pulsing stalk; the robin was already hopping in during the close-up |

No cuts, crossfades, whips or flashes. Zoom is keyed in log space with Catmull-Rom (velocity carries over). The position is a C2 blend from the wide framing, to a point on the stalk's spine, and out to the end framing.

## Science
- **Shown:** Amber snail (Succinea/Oxyloma type). Thin translucent amber shell, elongate with a short spire of about three whorls, a huge last whorl and a wide aperture; it is carried raised and oblique. The mottled mantle and the digestive gland show through the shell. The grey-tan body is too large to withdraw. Two tentacle pairs: long upper eyestalks with the eyes at the tips, and short lower tentacles.
- The infected eyestalk is about head-width thick and several times the length of the normal one. A Leucochloridium broodsac fills it: a long sausage banded crosswise (bright and dark green, cream/white, dark brown rings, dark flecks) with an orange-red tip that darkens. The thin skin is stretched translucent over it, so the bands show through.
- The pulsing is a contraction wave from base to tip at about 63 per minute (1.05 Hz, within the 40–75/min range).
- The cutaway shows the broodsac inside the tentacle and the lumen packed with encysted metacercariae.
- The robin notices the stalk (head turn, focusing eye, a hop closer) and does not attack.
- **Deliberately not shown:** brain control, any claim of it, or any change to the snail's behaviour; the bird eating the snail or the life cycle in the bird; gore. Only one broodsac is drawn (the parasite has a branched sporocyst in the body; that part isn't shown).
- **Sources:** Wesołowska & Wesołowski 2014, *J. Zool.* 292:151 (broodsac pulsation in tentacles, the light-exposure behaviour of infected snails); Casey et al. 2003 (Leucochloridium in Succinea); general references on Succinea putris shell form.

## Assets
- All newly drawn in `source/src/h06/`:
  - `snail.tsx`: body, foot, shell, normal tentacles.
  - `eyestalk.tsx`: tube rig, bands, pulse, cutaway, cysts.
  - `bird.tsx`: robin with IK legs, hops, head turn, blink.
  - `env.tsx`: background, midground blades, twig, leaf, slime, motes.
  - `geo.ts`, `timeline.ts`, `Hook.tsx`: camera and plane parallax.
- Shared helpers used read-only: `shared/lib.ts` (keyCR, ss5, keyS, closedPath, hash, noise1, ring), `shared/color.ts` (lit, shade, mix), and `shared/ink.tsx` (INK, Inked, InkPath, used for the robin's merged silhouette).
- No external images.

## Audio cues (`tools/audio/h06.py`, fx_lufs −27)
- Bed: forest air, plus a very quiet low detuned pad.
- Broodsac throb (a low wet squelch plus a soft thump) on every pulse beat: 0.89, 1.84, 2.79, 3.74, 4.69 and 5.65 s. It is louder while the camera is close.
- Slow crawl squelch at 0.0.
- Window opens (wet parting) at 2.47, then an eerie low swell.
- Pumping push and cyst jostle at 2.79 and 3.74.
- Window closes at 4.16.
- Robin:
  - push-offs at 3.96 and 5.40;
  - twig ticks with leaf rustle on landing at 4.22 and 5.66;
  - two quiet "tic" calls at 4.90 and 5.04.
- No music and no whooshes.

## QA (`qa/h06/qa.json`, final render)
```
{"frames": 180, "audio_decoded_s": 6.016, "voice_onset_s": 0.023, "mix_lufs": -16.19, "sample_peak_dbfs": -0.97,
 "motion_mean_per_second": [0.93, 4.183, 3.782, 4.049, 5.25, 4.525], "longest_static_run_frames": 0,
 "frame_jumps_over_18": [], "all_pass": true}
```
All ten checks pass.

**Fixed between passes:**
1. The tentacle was drawn as a cell grid, which read as a mosaic. It now uses per-segment cross-gradient quads that overlap opaquely, so no seams show; ring count was then doubled (180 + 20 cap) to remove stepped band transitions at full zoom.
2. Catmull-Rom position keys overshot and pushed the stalk off-centre in the close-up. Replaced with a C2 blend toward the spine.
3. Reshaped the stalk into a curved sausage with a round tip.
4. The shell was cone-like. It is now ovate with a short spire, raised at 38°.
5. The body read as a flat slab. It now has a separate foot band and a rounded head.
6. A blur filter on the contact shadow was clipped and showed a dark block. Replaced with radial gradients.
7. Redrew the robin in an upright, plump perching posture with a big orange breast. The forward lean had the wrong sign; the wing was too long and outlined as a flap.
8. The pulse was too subtle. Raised the amplitude (radius ±10.5 %, band squeeze ×2).
9. Retimed the robin so it enters on "birds"; adjusted the start and end framing.

## Known limitations
- The robin sits at about five times the snail's distance, so it shows almost no parallax. It reads as "behind", and at the end it is about the same screen size as the snail. Depth relies on haze, blur and overlap.
- Snail body skin is simplified (soft furrows and mottling, no real tubercle texture). The lower tentacles are small stubs.
- The broodsac bands are idealised and evenly spaced. Real broodsacs vary in pattern and in which band colours dominate.
- The cut window is a schematic soft cut, and the cysts are packed as a jittered 2D layer rather than a true 3D volume.
- The pull-back starts at 4.12 s (on "birds") rather than 4.5 s as in the shot spec, so the shot doesn't linger after the narration.
- The captions sit over the snail's head/body (not the eyestalk) during part of the close-up and the pull-back.
