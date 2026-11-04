# Eel Escape V4: review cut report

**Deliverable:** `exports/FGW_Eel_Escape_V4_REVIEW_1080x1920.mp4`

- **Video:** H.264, 1080 × 1920, 30 fps, 744 frames, 24.80 s, CRF 16, yuv420p, BT.709.
- **Audio:** AAC 48 kHz stereo (320 kb/s target).
- **Narration:** the locked master, unchanged, sample-aligned. The words are identical to V3.

**What changed from V3:** a new shot sequence, with new settings and perspectives and new drawings throughout. V3
reframed one side-profile fish. V4 draws one 3D predator and one 3D water world through a camera per shot, and adds
new interior sets.

**Evidence:** `qa/v4/`.

## The shot sequence

| # | Time (s) | Words | Setting and perspective | What the viewer sees |
|---|---|---|---|---|
| S1 | 0–2.62 | "That tail sticking out of this fish / belongs to the eel" | Rear three-quarter, just behind the predator's cheek | The eye, the gill cover and some body. A substantial length (22 of 54 units) of slate-blue tail protrudes from under the cover in a loose S. On the first beat the cover breathes once (peak 0.20 s) while the tail flicks independently across it (0.24 s). On "belongs" the camera follows the tail to the gill edge; a breath lifts the cover (2.15 s) and the same body shows continuing inside. |
| S2 | 2.62–3.84 | "it just swallowed." | Side view of the earlier gulp (a slightly drained, warm flashback grade) | The cut matches the eel's curve: S1's body entering the gill gap becomes the same on-screen curve entering the open mouth. The tail is sucked in (tail last), the mouth shuts (3.18 s) and the eel is gone. |
| S3 | 3.84–5.78 | "Scientists filmed it on X-ray." | A research tank in a dark lab, with an X-ray field between an emitter and a detector | The fish swims into the field; at the field edge (3.96 s) it turns into a radiograph. Its full skeletal profile (4.94 s) shows the glowing eel coiled in the stomach, skull and eye ring deepest, fine tail toward the throat. The camera pushes in following the moving tail. |
| S4 | 5.78–8.90 | "Inside the fish's stomach, / the eel starts backing up." | A newly drawn stomach interior: close folded walls, a curved chamber | The carried tail dissolves into the chamber. The coil lies in the foreground with the head and eye in view. From 7.22 s the tail tip slides up the wall, bumps a fold (7.45 s), turns and searches, reaches the puckered opening and presses it; the opening yields (8.2 s). The camera dives after the tip (the closest push) into the dark. |
| S5 | 8.90–10.42 | "Its tail slides up the fish's throat," | Inside the narrow esophagus, alongside the tail | Out of the dark, the folded passage. The tail tip leads; the body follows. The moving body then fills the foreground. |
| S6 | 10.42–12.58 | "slips through a gap in the gills," | A new angle from inside the pharynx toward the gill arches | Arch bars with rakers and red filaments. The tail turns sideways and threads the gap between two arches (closest push at 11.47–11.67 s); the part already through shows beyond, behind the next bar. The tip crosses the chamber to the bright gill opening. No round window. |
| S7 | 12.58–13.86 | "and pokes out the side." | Outside, low at the gill edge | A match cut: the same tip, same screen point, direction and speed, now breaking out over the gill cover's edge into open water. |
| S8 | 13.86–15.96 | "Then the rest of its body follows." | Slightly elevated, over the predator's back | A growing length slides out and bows along the flank into the current. |
| S9 | 15.96–17.96 | "Its head comes out last." | Tight at the gill edge | The eel's eye just inside the propped-open cover, its neck through the gap, the rest of the body curling outside, in one composition. |
| S10 | 17.96–21.30 | "The eel curls up outside the fish, / gives one final pull," | Low beside the fish | The outside body is a loose loop in front of us; it tightens; on "pull" the head slips free, once (20.86 s), and the body straightens into its first stroke. The predator breathes, startles and watches. |
| S11 | 21.30–24.30 | "and swims away / from the animal that just ate it." | Tracking alongside and ahead of the eel through the reeds | The head and eye lead; the predator falls behind and recedes as real distance opens. |
| S12 | 24.30–24.80 | — | A reed close to the lens | It wipes right to left and reveals frame 0 (the gill edge and the tail). |

## How it was built

**Shared core** (`source/src/v4/`):

- `three.ts`: the 3D camera in the predator's own frame.
- `eelV4.tsx`: the V4 eel. It has a broader head with a neck behind it, an eye 1.45× the V3 size, and a long, narrow tapered tail. It is drawn the same way in 2D sets and through 3D cameras.
- `escape.ts`: the one outside eel.
  - Rooted at the gill exit, with its length outside never decreasing (the tail leads).
  - Then a bow into the current, the curl, and the tightening.
  - A single release, after which it straightens about mid-body and follows its own head's path.
- `timing.ts`: the shot windows and the three screen-space hand-off contracts. They are the carried tail (S3 → S4), the tip crossing the edge (S6 → S7) and the dark lumen (S4 → S5).

**Modules:**

| Module | What it draws |
|---|---|
| `art/pred3d.tsx` | The predator as one 3D model: lofted body, smooth cel bands, markings fixed to the skin, a gill cover that lifts, an opening mouth, rayed fins. Its side view matches V3's art. |
| `art/world3d.tsx` | The water, the riverbed, rocks and swaying reeds in 3D; motes; the predator's shadow; the reed wipe. |
| `shots/S3Xray.tsx` | The X-ray tank. |
| `shots/S4Stomach.tsx` | The stomach. |
| `shots/S5Throat.tsx` | The throat and the gills. |
| `shots/Exterior.tsx` | S1, S2, S7–S12. |

**The film:** `FilmV4.tsx`, composition `EelEscapeV4`.

**Sound:** `tools/v4/make_audio_v4.py`, from `audio/cues_v4.json`, exported from the shots.

- Each setting has its own air: open water, the tank, and inside the fish.
- Three accents: the gulp, the change into the X-ray view, and the release.
- Small cues: the flick, the probe and yield, the slips, the poke and the strokes.

## Measurements

All measured on the exported file or on the shot code, every frame. The files are in `qa/v4/`.

| Check | Result | File |
|---|---|---|
| Decode | 744 frames, 24.80 s, 1080 × 1920, 30 fps, no decode errors | `render_qa.json` |
| Motion | Median frame-to-frame change 4.38. The longest near-static run is 11 frames (0.37 s, at 12.63 s: the held match cut, by design). Every large change is a planned cut, dissolve or wipe, except the two closest pushes (8.73–8.80 s, the dive into the stomach opening; 10.87–11.13 s, the push into the gill gap). | `render_qa.json` |
| Loop seam | Last frame against frame 0: mean change 3.77, below the film's own median frame step. | `render_qa.json`, `loop_seam_last3_first3.png` |
| Narration | Two independent recognisers (Zipformer, Whisper) on the exported audio: WER 0.0 on both, word for word. | `final_asr.json` |
| Mix | −14.0 LUFS integrated, −1.6 dBTP, LRA 2.6 LU. The narration sits at sample offset 0. Effects average 17.5 dB under the voice. | `audio/sfx_log_mix_v4.json` |
| Tail leads | The length outside never decreases (0 drops). The body stays connected (largest sample gap 0.45 u; the spacing is 0.45 u). | `kinematics.json` |
| Head clears once | One crossing, at 20.867 s ("gives one final pull" runs 20.82–21.10 s). | `kinematics.json` |
| Real distance | After the release the eel is inside the predator on 0 frames. Mid-body distance from the gill exit: 18.3 u at release, 39.4 u at 22 s, 120.9 u at the end (the eel is 54 u long). | `kinematics.json` |
| Captions | Captions sit in the top band. With a caption up, the eel and the gill gap stay below the keep-out line on every frame. The tightest margin is 45 px (S6, the gap, 11.70 s). | `caption_keepout.txt` |

## Muted phone-size review

(filled in from the review rounds)

## Known limits

(filled in)
