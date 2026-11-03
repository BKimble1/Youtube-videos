# Bone Glue V2: review cut report

**Status: review cut, not published.** This file has no narration (see "Narration" below).

## Deliverable

`exports/FGW_Bone_Glue_V2_REVIEW_NO_NARRATION_1080x1920.mp4`

@@MEASURED@@

## Narration

The approved narration is used word for word (`production/NARRATION_LOCKED.txt`). It was generated once in the channel
voice: ElevenLabs "Test Voice" `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, connector defaults, with inline delivery tags for
controlled excitement and brisk, conversational pacing. That produced two takes, 27.76 s and 27.36 s long.

**What is blocked.** The take files are served from `elevenlabsusercontent.com`. This environment's network policy
blocks that host (proxy `CONNECT 403`, last checked 2026-11-03), so the narration could not be restored for this
review. No workaround around the policy was attempted.

**What the cut uses instead.**
- The picture, captions and sound cues are timed to take 2's ElevenLabs Scribe word times
  (`source/src/data/timeline.json`, `provisional: true`).
- Every beat is keyed to a word, so when the real take is aligned the beats move with it.
- The film runs 28.93 s: the narration's end plus a 1.5 s tail, inside the 28–30 s target.

**To finish (about 15 minutes):**
1. Allow `elevenlabsusercontent.com` in the environment's network access settings.
2. Download the takes from flow `vPJoRVyy04Q4iSyAc8Cy` and run `python3 tools/make_narration.py`, which gap-edits,
   aligns, and writes the timeline, captions and SRT.
3. Export the cues and run `python3 tools/make_audio.py mix_v2`.
4. Render `exports/FGW_Bone_Glue_V2_REVIEW_1080x1920.mp4`.
5. Run `tools/qa_render.py` and the ASR check on it.

These steps are also in the README.

## Brief checklist

All times are in seconds, from `source/src/story.ts`.

| Requirement | Result |
|---|---|
| **P1.** Open inside the fractured wrist with the applicator already on bone | **Yes.** Frame 0 is a close-up of the distal radius in the incision. The cannula tip touches the transverse seam at the glue front, and glue already fills the seam behind it. A small wedge fragment sits out of place with its honeycomb bed exposed, and the probe tip is on it. |
| Surgeon positions a small fragment, adhesive bridges the interface, and the tool eases away while the fragment stays secured, all within 2 s | **Yes.** The probe pushes the wedge home (0.04–0.62). The glue runs along the transverse seam to the radial border (0.36–0.92). The probe holds until the glue has crossed the wedge's upper seam, then lifts and backs away (0.93–1.24). The applicator then lays glue up the wedge's diagonal seam (1.22–1.60). The wedge never moves after it is seated. |
| Fracture seams visible; no suggestion of instant healing | **Yes.** All the dark broken faces stay visible on both sides of the glue throughout the opening and fixation. |
| Controlled application along the interfaces, not a toothpaste bead | **Yes.** The adhesive fills the roughly 1 mm gap between the two broken faces and wets just past each one (`art/seams.ts`, `art/fracture.tsx`). |
| Glue must not pull bones into alignment | **Yes.** The probe seats the wedge before any glue reaches its seams. |
| Pull back to establish the wrist; fracture large and readable throughout | **Yes.** A no-slip pull-back (1.60–3.60) lands on the palm-up hand: palm, thumb, wrist crease, retractors and the surgeon's gloved hands. The fracture stays in the lower middle, above the captions. |
| **P2.** "Researchers actually did it": a precise action, not watching the surgeon | **Yes.** The applicator turns steep on its tip (3.80–4.60), and the probe sets down on the styloid fragment (4.22–4.74). One glue stroke then runs up the styloid seam from bottom to top (4.70–5.45). The camera push lands just after the stroke starts (5.05), so the stroke plays on a settled frame. The tip then lifts and the applicator leaves. The surgeon's face is never the subject. |
| Oyster: water and particles move past while the oyster stays attached; its attachment interface is exposed | **Yes.** The oyster is cemented to a boulder in a current. Particles, bubbles and weed stream left to right, and during the push they are drawn so the flow never reverses on screen. The oyster does not move. A section window opens on its base (9.47–10.13) to show shell layers, a thin cement band and rock. |
| That interface matches the bone-adhesive close-up | **Yes.** On the cut back at 10.33 s, the cement band lands on the glue band's screen position and shape within 0–2 px across the frame, moving in the same push direction (`production/v2_match_band.json`). |
| Wet wound: fluid crosses the bonded interface while the glue stays attached to both faces | **Yes.** A translucent blood-tinted sheet flows down across the seam. Its ripple crests bend over the raised gel, and one stronger, redder wash sweeps the frame on "wet, bloody" (11.95–12.92). The glue's edges are redrawn crisp on top, so they stay sealed to both faces. There are no strands and no droplets. The camera eases back so the T-junction and both fragments read. |
| **P3.** "secured … three minutes": the instrument releases, the fragments stay stable, the fracture is still present | **Yes.** On "secured" the probe lifts off the styloid fragment (15.88–16.48), its contact shadow separates, and it withdraws with the hand (16.38–17.31). Nothing moves. All three teal seams are still plainly there. On "three minutes" the glue settles from gloss to satin (17.42–18.72). |
| "months to heal": a clearly accelerated healing progression | **Yes.** The incision closes and is sutured, a cutaway opens out of the incision, and the camera pushes into the healing framing (18.77–19.93). The sequence then runs hematoma (19.17), soft callus at the margins (19.63), and pale woven bone growing in from both broken faces (20.21–24.63). |
| New bone bridges from the margins; the glue thins and disappears with visible structure, not an opacity fade | **Yes.** The bone fronts are toothed and porous. The teal band narrows, breaks into islands, and the islands close one after another (`seams.growth`). The glue is gone by about 24.5 s. The pale new-bone band then holds through "disappears" and remodels into mature bone (24.65–25.65) with a faint trace. |
| Same fracture orientation throughout | **Yes.** The opening, fixation and healing framings all show the radius in the same orientation, with the same three seams in the same places. |
| **Ending:** recovered wrist, small natural finger movement | **Yes.** The camera eases out (25.20–26.60) through opaque skin with a faint scar to the hand on the follow-up table. The fingers flex gently, spread a touch and relax (26.10–27.34). |
| No blue wipe; matching bone framing and direction back to the opening; the healed wrist never breaks | **Yes.** The wipe is gone. The camera pushes back into the bone (27.44–28.93) and lands on frame 0's framing with the opening's drift. The cutaway closes down to the incision's size and position, so the cut to frame 0 changes only the fracture state, never shown as an animation. |
| Weird Crew style; faces and proportions; hands, fingers, grips | The film uses the Weird Crew vector finish: navy ink, cel shading, upper-left key light and restrained depth layers. Every surgeon hand was checked frame by frame. The right glove holds the syringe applicator with its thumb on the plunger pad, index finger along the barrel and middle finger under the flange. The left glove holds the probe in a pencil grip. Both cuffs run toward the surgeon. |
| Captions synced, with no extra labels | **Yes.** The captions are the approved words only, in the channel style, with a few frames' hold where two captions would otherwise leave a blank frame. There are no labels or callouts. |
| 28–30 s, genuine 1080×1920 | **Yes:** 28.93 s at 1080×1920 (measured above). |
| Pre-delivery inspections | See "Inspections" below. |

## Inspections before delivery

@@INSPECT@@

## Departures from the brief, and why

- **No narration in the file.** The voice host is blocked, as explained above.
- **Probe shaft and captions.** While the probe waits beside the styloid fragment (about 3.3–6.3 s), its thin steel
  shaft passes behind the outlined caption text. A flatter probe would push the surgeon's hand out of frame beside the
  other glove.
- **Incision size.** The reported wrist case used a small incision. Here it is drawn larger, as in V1, so the bone fills
  frame 0 and the wider shots still read.
- **Glue colour.** The glue is a translucent teal gel. The real material's appearance has not been published, so the
  colour is chosen to separate the adhesive from bone, new bone and blood on a phone.

## Science notes (what the picture claims)

These are unchanged from V1. The adhesive shown is based on Bone-02, developed by Prof. Fan Shunwu and Lin Xianfeng's
team at Sir Run Run Shaw Hospital, Zhejiang University School of Medicine.

- **Oysters.** The idea came from oysters cemented to rock and to bridge piers.
- **Wet conditions.** The team reports strong adhesion in a wet, bloody field within 2–3 minutes.
- **The reported wrist case.** A comminuted distal radius fracture was fixed through one small incision in about three
  minutes, with no plate or screws.
- **Absorption.** The material is said to be absorbed over about six months as the bone heals.
- **Status.** It is in clinical trials. **It is not approved for sale anywhere, and there is no peer-reviewed
  publication of the clinical results.**

The narration's "experimental" and "in one reported wrist case" match this. The picture deliberately shows only what is
reported:
- The glue fixes the fragments in place.
- Healing still takes months.
- New bone replaces the glue.

Because the composition is undisclosed, the picture shows no chemistry. The sources are listed in
`production/V1_REPORT.md`.

## Remaining visible issues (none blocking review)

@@ISSUES@@

## Evidence (`qa/v2/`)

- `render_qa.json`: format, decode, frame-change and loop measurements.
- `mix_measure_mix_v2_novoice.json`
- `contact_every_0.5s.png`: the whole cut.
- `hook_0-2.5s_every_3rd_frame.png`
- `muted_phone_0-2s.png`: the first two seconds at phone size, muted.
- `strip_*.png`: every planned move and cut, including `strip_opening_fixation_*`, `strip_release_*`,
  `strip_pushin_*`, `strip_healing_*`, `strip_easeout_*` and `strip_loop_push_*`.
- `loop_seam_last3_first3.png` and `loop_seam_caption_free.json`
