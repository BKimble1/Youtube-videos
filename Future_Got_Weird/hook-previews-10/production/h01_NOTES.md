# HOOK 01: Tongue-eating isopod (Cymothoa exigua): notes

Output: `exports/FGW_HOOK_01_TONGUE_PARASITE.mp4` (6.000 s, 180 frames). `qa_clip.py 01`: all checks pass.

## Shot plan (one continuous shot, one 3D model, one perspective camera)
Word sync comes from `h01_words.json` via `wordAt` (see `TL` in `source/src/h01/Hook.tsx`).

- **0–0.5 s.** Extreme 3/4 front close-up of a spotted rose snapper's head (az −60°, el 12°). At frame 0 the lips are already parted (jaw 19°). Inside, the cream segmented isopod lies belly-down on the floor of the mouth with its head toward the lips and its eyes looking out. A pink tongue pad sits in front of its head, and the fish's eye is at the upper right. The mouth keeps opening (to 29° by 0.85 s).
- **0.5–2.0 s.** The camera pushes into the mouth (d 205 → 128 mm). The jaw works (23° → 30.5° → 21°). The parasite flexes: rear curl, sway, head nod and a re-grip wave through its legs that is strongest between 1.0 and 2.5 s. Its front claws stay clamped on the base of the tongue.
- **2.0–4.0 s.** A continuous low orbit to the side (az −46° → −20°, el 16° → 4.5°). On "tongue" (2.19 s) a cut window opens on the near side of the lower jaw, growing out from the bite. Inside the window: the jaw tissue, the tongue in section and the tongue's artery coming up into its base. The parasite's buccal cone pierces the artery there, and blood drops run along the vessel and up into the cone. The pulse speeds up. From "then" (2.87–4.08 s) the vessels beyond the bite empty and pale, and the tongue pales, wrinkles and withers to a grey stub. On "its new" (3.75–4.35 s) the parasite moves forward and its front claws re-grip onto the stub.
- **4.0–6.0 s.** On "tongue." (4.30–4.85 s) the window closes while the camera rises back to the 3/4 front mouth view. The mouth snaps shut (4.86–5.14 s), with the parasite's eyes still showing between the teeth, then reopens (5.30–5.74 s). The parasite now fills the tongue's place: its head lifts slightly and stares out over the lower lip while the camera keeps pushing in to the last frame.

## Transitions (outgoing → incoming → new information → kept)
1. Mouth view → push-in: the opening mouth gives way to a close-up of the parasite. New information: the segments, legs and claws on the tongue base. Kept: the same model and lighting.
2. Push-in → low side orbit with the cut window: the high view gives way to a side section of the lower jaw. New information: the artery, the bite and blood flowing into the mouthparts. Kept: the parasite, the jaw and the teeth (the window is local, cut into the jaw).
3. Cutaway → rise back to the mouth view: the section gives way to the outside view again. New information: the tongue is gone and the parasite sits in its place. Kept: the stub position and the parasite.
4. Close → reopen: the parasite is hidden and then revealed again, still in place.

## Science
- **What is shown.** An adult female cymothoid isopod, about 31 mm long and 16 mm wide, oval, dorsally convex, glossy and cream to tan. It has a small cephalon with two dark compound eyes at its sides and two pairs of short segmented antennae. It has seven pereonites: the first wraps forward round the head and 2–7 carry coxal plates. Behind them are five short pleonites, then a broad, rounded pleotelson with a uropod on each side. It has seven pairs of short prehensile pereopods with strongly curved, darker dactyli; pairs 1–3 point forward and 4–7 point back. The front pair clamp the tongue base and then the stub. It lies belly-down on the floor of the mouth with its head toward the lips. The host is a pink-red snapper. The mechanism: blood is drawn from the tongue's artery through a buccal cone, the tongue loses its blood supply and atrophies to a stub, and the parasite attaches to the stub and occupies the tongue's position.
- **Deliberately not shown.** Entry through the gills (no time for it in 6 s). The male on the gill arches. Any claim that the parasite eats the fish's food or kills the fish. Gore: the section is clean, with no loose tissue.
- **Simplifications.** The tongue is enlarged so it reads at phone size. The cut window shows a midline section, but the parasite and its near legs are drawn whole in front of it. The parasite moves forward about 6 mm onto the stub to show it taking the tongue's place.
- **Sources.** Brusca & Gilligan (1983), *Copeia* 1983(3):813–816 ("Tongue replacement in a marine fish (*Lutjanus guttatus*) by a parasitic isopod"). Brusca (1981), *Zool. J. Linn. Soc.* 73:117–199 (eastern Pacific Cymothoidae morphology). General accounts (e.g. NHM London, Smithsonian Ocean) of tongue atrophy and attachment to the stub.

## Assets
Everything is newly drawn in `source/src/h01/`:
- `geo.ts`: fish frame and jaw hinge.
- `fish.tsx`: lofted head, jaw, throat, lips, teeth, cheek, maxilla and eye.
- `iso.tsx`: isopod rig.
- `tongue.tsx`: tongue and cutaway.
- `env.tsx`: water backdrop and 3D marine snow.
- `paint.tsx`: gradients.

Reused, imported read-only: the `shared/three.ts` perspective camera, hull and capsule helpers; `shared/ink.tsx` Inked/Deco; `shared/color.ts`; `shared/lib.ts`. The gradient and capsule shading approach follows Dead Spider `dc/shade.tsx`.

## Audio cues (`tools/audio/h01.py`, fx_lufs −27)
| Time (s) | Cues |
|---|---|
| 0–6 | Underwater bed and a quiet detuned low pad (continuous) |
| 0.00 | Wet lip-part squelch and bubbles |
| 0.55, 1.30, 1.75, 2.15 | Chitin claw ticks |
| 1.0, 1.9 | Carapace creak and tissue shift |
| 2.21 | Wet squelch as the cut window opens |
| 2.55–4.05 | Suction flow, with artery thumps at 2.62, 3.00, 3.33, 3.62 and 3.87 (accelerating) |
| 3.22, 3.57 | Shrivel creaks, plus rustle texture |
| 3.75 | Slide squelch, with claw clamps at 3.86 and 4.12 |
| 4.8 | Low swell |
| 5.10 | Jaw-shut thump and teeth click |
| 5.30 | Reopen squelch and bubbles |

Measured: voice −15.98 LUFS, fx bus −29.98 LUFS, mix −16.99 LUFS, peak −1.0 dBFS.

## QA (rendered file)
```
{"hook": "01", "all_pass": true, "failed": [], "onset": 0.027, "lufs": -17.01,
 "motion/s": [2.296, 4.793, 6.967, 3.526, 7.209, 5.359], "static_run": 0, "jumps": []}
```

Fixes between passes:
- **Pass 1.** The snout was too long and pointed, so I rebuilt the head proportions and colour. A hard vertical edge at the mouth corner became an organic cheek margin. The maxilla was being drawn under the snout. The cutaway was unreadable, so I moved the tongue in front of the parasite's head, made the window local to the tongue and tightened the framing. The throat showed open water in the side view, so I added half-polygons. The camera target now follows the dropped jaw.
- **Pass 2.**
  - The isopod's eyes were cartoonish: I made them smaller and duller, and the far eye now fades when it faces away.
  - The window rim crossed the parasite's head: it is now drawn under the parasite.
  - The lips read as tubes: I made them thinner.
  - The specular streaks floated outside the body: I moved them inside.
  - The ending showed the parasite's back: the jaw is now less open, the camera lower, and the head lifts to stare out.
  - Captions covered the cutaway and the ending: I moved them to y=320 for both phrases, over the snout.

## Known limitations
- The fish head is simpler than the reference episodes. It has large smooth gradient areas, the snout has no scale texture, and in near-frontal views the head's ventral keel shows as a narrow fin-like shape at the right edge.
- In the cutaway, the near half of the lower lip band crosses the parasite's flank. That is geometrically right, but it reads a little like a strap. The blood drops are small at phone size, so the pulse and colour change carry most of that beat.
- The cut window is a schematic midline section with the whole parasite drawn in front of it.
- The parasite's face is somewhat rounded and "cute" rather than truly menacing. In the 3/4 views the far eye reads as a dash.
- The bottom third of the frame is open water in the first second, and again in the cutaway.
