# Bone Glue V1: review cut report

**Status: review cut, not published. The narration is missing from this file** (see "Narration" below).

## Deliverable

`exports/FGW_Bone_Glue_V1_REVIEW_NO_NARRATION_1080x1920.mp4`

| Measured (`qa/v1/render_qa.json`) | Value |
|---|---|
| Picture | 1080×1920, 30 fps, 840 frames, 28.0 s, H.264 yuv420p, BT.709, CRF 16, slow preset |
| Audio | AAC 48 kHz stereo, 317 kb/s; effects and music only (no voice) |
| Size | 23.54 MB |
| Decode errors | none |
| Median frame-to-frame change (MAD) | 4.52 |
| Longest near-static run | 2 frames (at 16.53 s) |
| Large frame changes | 2, both planned: the match cut out to the oyster (8.00 s) and the match cut back (10.33 s) |
| Unplanned large changes | none |
| Loop seam, last frame → first frame | 9.8 MAD with captions; 7.12 caption-free, against 8.41 for the step 838 → 839 just before it (`qa/v1/loop_seam_caption_free.json`) |
| Mix (no voice) | −27.68 LUFS integrated, −13.97 dBTP; effects −30.75 LUFS, music −37.86 LUFS; audio loop-seam jump 0.0008 (`qa/v1/mix_measure_mix_v1_novoice.json`) |

The mix is quiet because the voice is absent. The effects and music sit at the level they will have under the voice; the
full mix is built to about −14 LUFS and below −1.5 dBTP once the narration is in.

## Narration

The narration was generated once in the channel voice: ElevenLabs "Test Voice" `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`,
connector defaults, with brisk and excited delivery tags. This produced two takes. The words are exactly those in
`production/NARRATION_LOCKED.txt`.

The take files could not be downloaded because ElevenLabs serves them from `elevenlabsusercontent.com`, which this
environment's network policy blocks (proxy 403).

**What the cut uses instead**
- The picture and captions are timed to take 2's ElevenLabs Scribe word timings, so `timeline.json` is marked
  `provisional: true`.
- The pace and every beat match that take.
- The final alignment may still move individual words by tens of milliseconds.

**To finish (about 15 minutes)**
1. Allow `elevenlabsusercontent.com` in the environment's network settings.
2. Download the takes from flow `vPJoRVyy04Q4iSyAc8Cy`.
3. Run `python3 tools/make_narration.py`. This gap-edits the chosen take, aligns it with Zipformer, and writes the
   timeline, captions and SRT.
4. Export the cues and run `python3 tools/make_audio.py mix_v1`.
5. Render `exports/FGW_Bone_Glue_V1_REVIEW_1080x1920.mp4` and run `tools/qa_render.py` and the ASR check on it.

These steps are listed in the README.

## Brief checklist

| Requirement | Result |
|---|---|
| Frame 0: anatomical wrist cutaway; the fractured radius fills most of the frame; the applicator is already laying a visible bead between aligned fragments | Yes. The radius is shown vertical with a transverse crack and a wedge. The cannula tip is laying the bead, and a reduction clamp holds the fragments. |
| Adhesive bridges and stabilises within about 1 s | Yes. By 1.0 s the bead spans the transverse crack. The slight reduction settles between 0.04 and 0.55 s. |
| Reads with sound off in 2 s | Mostly (`qa/v1/muted_phone_0-2s.png`). Bone, cracks, teal gel and steel instruments separate clearly. That this is bone reads from the cortical rim, the cracks and the incision lips; the caption "If you SHATTERED your wrist" helps. |
| Widen to the wrist, then the clinical scene with the same patient, wrist orientation and applicator | Yes. One continuous no-slip widen from 1.2 to 5.4 s through the incision, the hand and forearm, the hand table and then the surgeon finishing the bead. |
| Contact edge matches the oyster and back (about 2 s) | Yes. It hard-cuts on the glue's contact edge at 7.98 s to the oyster's cement seam and back at 10.33 s, with the same push-in direction; the two edges are registered on screen (an earlier 70 px offset was measured and corrected). The current, particles and weed move while the oyster holds. The oyster segment is 2.35 s. |
| Wet interface | Yes. A thin blood-tinted film and rivulets come from above and pool at the bead edge. A wavy surge passes at 11.55 s and the edges stay sealed. No molecular chemistry is shown. |
| Wider cutaway; the surgeon finishes; instruments withdraw; fragments stay put; fracture lines stay visible | Yes, from 13.6 to 18.7 s. A soft anatomical window opens over the radius, ulna and carpals. The applicator lifts out, the clamp ratchet releases and the clamp lifts away, and the gel sets from gloss to satin. |
| Healing in stages; new bone bridges the gap | Yes, from 18.8 to 25.6 s: hematoma, soft callus, hard callus (cuff), the glue breaking into islands and vanishing, then remodelling. |
| New bone and glue stay distinct on a phone | Yes. The new bone is white woven bone and the glue is teal throughout. |
| Restored bone, ease out, one small hand movement | Yes, from 25.3 to 27.4 s. The cutaway heals over to the wrist with a faint scar on the follow-up table, and the fingers curl gently and relax. |
| Loop without a visible rebreak | Yes. The surgeon's gowned sleeve and glove sweep across the lens from 27.45 to 27.97 s, and the reset happens at 27.74 s while the frame is fully covered. The healed wrist is never shown opening. |
| Hands and arms | The patient's hand, fingers and thumb are drawn as a right hand, palm up. The surgeon's gloved hands hold the applicator and clamp with real grips (see remaining issues). |
| Accuracy of "three minutes" and "months" | The bead is laid and set during the "secured … three minutes" lines. Healing is a separate sequence on "months to heal", and the incision is closed with sutures before it starts. |
| Captions | Narration words only, in the channel style (Nunito Black, white with a dark stroke, yellow emphasis). They sit at y 1500–1510, below the fracture and the bead in every shot. Caption changes land on cuts, and the last caption ends at the reset so the seam is caption-free. No labels, titles or callouts. |
| Sound | Synthesised and cued from the picture: soft applicator hiss and squeeze, a clamp click, a muffled underwater bed with bubbles for the oyster, a wet film shimmer, warm healing swells, a soft sleeve whoosh at the loop. The music is a light 98.6 BPM loop that wraps at 28 s. Nothing is played for horror. |
| Watched in full | Every frame was checked through contact sheets at 0.5 s steps and through transition strips at every 2nd or 3rd frame for the hook, widen, dive, both match cuts, pull-out, push-in, ease-out and loop. Playback in real time is not possible in this environment. |

## Departures from the brief, and why

- **No narration in the file.** The voice host is blocked, as explained above.
- **Reference episodes.** Cyborg Cockroach V5, Dead Spider V6 and Ear on Forearm are not in any repository this session
  can reach. The style was matched to the Weird Crew `dc` rig and the most recent Shorts in this repository, mainly
  Myostatin V6, Moth Silk and Robot Faces.
- **Glue colour.** The glue is drawn as a translucent teal gel. The real material's appearance has not been published,
  so the colour is chosen to separate the adhesive from bone, callus and blood on a phone.
- **Incision size.** The reported wrist case used a single 2–3 cm incision. Here the opening is drawn somewhat larger,
  and held open by retractors, so the bone fills the frame at frame 0 and the wider shots still read.
- **Loop.** The loop is a foreground wipe (the surgeon's sleeve) instead of a push through the skin. An earlier push
  read as the healed wrist reopening, which the brief rules out.

## Science notes (what the picture claims)

The adhesive shown is based on Bone-02 ("骨02碎骨黏"), developed by Prof. Fan Shunwu and Lin Xianfeng's team at Sir Run
Run Shaw Hospital, Zhejiang University School of Medicine, and announced in September 2025.

- **Oysters.** The idea came from oysters cemented to coastal bridge piers.
- **Wet conditions.** The team claims strong adhesion in a bloody, wet field within 2–3 minutes.
- **The wrist case.** A comminuted distal radius fracture was fixed through one small incision, "in just three
  minutes", with no plate or screws. It had healed at 3 months.
- **Absorption.** The material is said to be absorbed over about six months as the bone heals.
- **Status.** About 150 patients were enrolled in a multicentre randomised trial. The device entered China's Innovative
  Medical Device review in January 2026 and received an FDA Breakthrough Device designation in April 2026. **It is not
  approved for sale anywhere, and there is no peer-reviewed publication of the clinical results.**

The narration's "experimental" and "in one reported wrist case" match this. The composition is undisclosed, so the
picture shows no chemistry.

**Sources**
- zju.edu.cn: https://www.zju.edu.cn/english/2025/1015/c19573a3092089/page.htm
- stdaily.com: https://www.stdaily.com/web/gdxw/2025-09/09/content_397788.html
- sixthtone.com: https://www.sixthtone.com/news/1017606
- european-coatings.com: https://www.european-coatings.com/news/production-lab/new-biodegradable-bone-glue-stabilises-fractures-within-minutes/
- ecns.cn: https://www.ecns.cn/m/news/sci-tech/2026-05-22/detail-ihfesqqe9521477.shtml

## Remaining visible issues (none blocking review)

1. **Oyster.** The cement fillet reads a little like a thick cushion under the shell, and the seabed is flat.
2. **Wet film.** The blood-tinted rivulets read slightly like tubes.
3. **Loop wipe.** At this speed the sleeve reads mainly as a soft blue shape and the glove is only briefly visible.
   The wipe does its job; whether it reads as a sleeve is a judgement call.
4. **Overlaps.** Briefly, from about 6.8 to 7.1 s and 14.2 to 14.6 s, an instrument shaft passes behind the caption.
5. **Incision shape.** The incision changes shape: it is a wide lens while the retractors hold it open, and a narrower
   vertical slit when they relax before closure.
6. **Clamp grip.** The surgeon's grip on the clamp is acceptable at speed but not a precise ring-handle grip.

## Evidence (`qa/v1/`)

- `contact_every_0.5s.png`: the whole cut.
- `hook_0-2.5s_every_3rd_frame.png`
- `muted_phone_0-2s.png`
- `strip_*.png`: every transition.
- `loop_seam_last3_first3.png` and `loop_seam_caption_free.json`
- `render_qa.json` and `mix_measure_mix_v1_novoice.json`
