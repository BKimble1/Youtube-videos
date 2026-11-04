# He Moved Another Man’s Finger With His Mind: episode brief

The creator selected this as the **next long-form Future Got Weird episode** on 4 November 2026. This file follows the
channel's reusable episode-brief template (`can-you-hurt-something-that-isnt-alive/production/brief/Future_Got_Weird_Project_Brief.md`).
The editorial and visual direction below is the creator's brief, reproduced verbatim. It is the build contract for the
first review render.

## Status and gate

| Step | State |
|---|---|
| Topic | Selected (4 Nov 2026) |
| Narration | **Proposed V1, awaiting Blake's sign-off** (`NARRATION_PROPOSED_V1.txt`, 544 words) |
| Review render | Not started. It begins only after the exact words are approved. The approved text is then copied unchanged to `NARRATION_LOCKED.txt` and kept verbatim. |
| Publication | Manual. Nothing is published or scheduled from this project. |

If Blake asks for changes, the narration is revised first and presented again. No picture or audio work starts on
unapproved words.

## Episode brief (channel template)

| Field | Episode entry |
|---|---|
| Episode ID and working title | FGW long-form, *He Moved Another Man’s Finger With His Mind* |
| Main viewer question | How did one person's imagined movement make another person's hand press a key, and what did it turn into? |
| One-sentence takeaway | A brain-to-brain interface first carried a single "fire" command into someone's motor cortex. Six years later it carried yes/no advice into the visual cortex, and the receiver could decide whom to trust. |
| Audience prerequisite | EEG reads changes in brain rhythm from the scalp. A TMS coil's magnetic pulse can briefly drive a small patch of cortex. Each idea is introduced beside the object that shows it. |
| Hook and evidence | A finger fires a cannon in a game its owner can't see (UW 2013 demonstration, UW News, 27 Aug 2013) |
| Scope and exclusions | Covers UW 2013 pilot, the 2014 PLOS ONE study with its flipped-coil control, and BrainNet in 2019. Excludes mind-reading claims, animal brain-to-brain work, and invasive BCIs. |
| Status | Evergreen; new episode |
| Baseline | Branch `claude/inspiring-clarke-meyznm`, parent commit `3171c1c` |
| Runtime constraint | Roughly 3:30–3:50 at a natural read. 16:9, 1920×1080, 30 fps. |
| Narration | ElevenLabs Test Voice `kk5XaSLo2XAw0sKM98zU` (to be re-verified in the account at production), `eleven_v4` directed with inline tags. Curious, slightly quick, with room left for the missing click. |
| Visual teaching devices | The two hands; the defend-the-city game (plane, rocket, cannon); the EEG cursor; the TMS coil; the keyboard (2013), touchpad (2014), falling block (2019); the receiver's flash |
| Humor | Delivery and timing: "the equipment you normally get by sitting down at a desk", "missing the entire game", "Bad connection.", "trust issues", "the other guy was wrong" |
| Deliverables | One 1920×1080 review MP4 with final narration, a sound mix, synced SRT, and editable Remotion source in this folder |
| Unresolved evidence or access | See `SCRIPT_REVIEW_V1.md` and `SOURCE_NOTES.md`. The journal hosts are blocked by this session's network policy, so claims were checked through web search. |

## Creator's direction (verbatim)

**EDITORIAL AND VISUAL DIRECTION**

- Open on the first frame with two LARGE hands side by side in separate labs. Frame left, Rao’s hand stays flat beside the game. Frame right, Stocco’s index finger is already striking the space bar. Fire the little on-screen cannon on that click, within the first second. Different sleeves, same screen geography throughout. On “across campus,” pull back through the two lab windows to reveal separate buildings. Skip the channel bumper.
- Give the viewer one playable decision. Let a friendly supply plane fly through unharmed, then send a pirate rocket toward the city along the same path. Use a cut on the click to connect Stocco’s keyboard to the cannon on Rao’s screen. For the explanation, show one continuous route from imagined movement to EEG cursor to computer command to the coil over the left motor cortex to the right hand. Keep the hand’s quick up-and-down motion anatomically clear.
- Give the 2014 control trial its own scene and cast. Switch to the touchpad. Flip the coil about the axis of its handle and repeat the same composition at the same sound level. Hold on the motionless hand just long enough for the viewer to expect the tap. Let the rocket hit. The missing click is the reveal.
- For BrainNet, match-cut the rectangular touchpad to the falling block. First let the audience play from the receiver’s seat, where the gap is hidden. Then switch to a sender’s view and reveal the gap. Distinguish the two senders with consistent colors. Show the perceived flash as one brief, soft arc from the receiver’s POV. Make the corrupted vote visibly flip inside the computer, after the sender gives it. The receiver chooses whether to act. End back at the original two hands, with the second game’s decision giving the image new meaning.
- Use the repository’s flat vector faces, line weights, silhouettes, and palette. Make each camera move land on new information. Let the plane, rocket, cursor, key, coil, pad and block motivate transitions. Prioritize clean hands and readable props at phone size. Put the humor in the delivery and timing. Use the established ElevenLabs Test Voice, curious and slightly quick, with room for the missing click. Build in Remotion against the aligned narration.
- Keep the 2013 keyboard, 2014 touchpad and 2019 visual signals distinct. Stage each scene as an original animated reconstruction. The equipment connects consenting participants and transmits simple prearranged commands. Check the source notes below when illustrating the hardware and results.

**AFTER SCRIPT APPROVAL**

Deliver one 1920×1080 landscape review MP4 with final narration, mixed sound, synced captions/SRT, and editable Remotion source in the normal episode folder. Inspect the first three seconds muted at phone size and play through the entire export with sound. Correct left/right reversals, malformed hands, stray limbs, cutoff captions, or delayed action before handoff. Include the actual runtime and review file path. Keep publication manual.

**Source notes (as supplied)**

- UW pilot with figures, trial log, and game rules
- UW account of the 2013 demonstrators and Stocco’s description of the sensation
- 2014 peer-reviewed study, especially the control condition and Table 2
- 2019 BrainNet study
- UW explanation of the two viewpoints, reversed votes, and results

## Standing rules that also apply

- `../../FGW_EDITING_RULES.md`: hook first with the event already underway, continuity through mechanisms, motivated
  transitions only, the transition list and technical checks before delivery.
- Captions: earlier long-form FGW episodes delivered an external SRT only (`robot-faces/README.md`). This brief asks
  for synced captions and an SRT, and for cutoff captions to be checked. The plan is to show captions in the review
  render and also deliver the SRT, unless Blake prefers SRT-only.
- Keep the owner's identity out of every public file and export metadata.
