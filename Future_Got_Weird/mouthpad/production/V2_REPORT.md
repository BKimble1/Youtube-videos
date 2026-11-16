# MouthPad V2: report

**Review file:** `exports/FGW_MOUTHPAD_V2_REVIEW_1080x1920.mp4` (Git-ignored). Checksummed parts are in `backup/`.
Restore with `cat backup/FGW_MOUTHPAD_V2_REVIEW_1080x1920.mp4.part_* > exports/FGW_MOUTHPAD_V2_REVIEW_1080x1920.mp4`.

It is not published. Nobody has watched it in real time or listened to it; this environment has no playback. Every
check below is a measurement, a rendered still or a frame-step sheet that was actually inspected.

## Verified export (ffprobe on the delivered file)

| Property | Value |
|---|---|
| Runtime | **31.90 s** (957 frames) |
| Video | H.264 High, **1080 × 1920**, SAR 1:1, DAR 9:16, **30 fps**, yuv420p, BT.709 |
| Audio | AAC, 48 kHz, stereo |
| Loudness | −14.0 LUFS integrated, −2.2 dBTP true peak |
| Black frames / frozen ≥ 1 s | none / none |
| Longest near-static stretch | 0.33 s |
| One-frame pops | none. Every large frame step outside a planned cut is a multi-frame camera ramp. |

**About "512 × 910":** the V1 file is 1080 × 1920 too. ffprobe gives 1080 × 1920, 960 frames, SAR 1:1 for the local
export, for the file rebuilt from its backup parts, and for its source frames. The smaller size was most likely the
review player's preview of the attachment. All V2 artwork is vector, rendered natively at 1080 × 1920; there are no
raster assets to upscale.

## Narration

- **Script:** unchanged. The 101 words equal `production/NARRATION_LOCKED.txt`.
- **Why it was re-voiced:** the V1 take was weak on three of the words the brief singles out (measured against the
  take's average word, `tools/emphasis.py`):
  - AIM: −3.2 dB, falling pitch;
  - SEE: −2.6 dB;
  - SHUT: −5.2 dB, falling pitch.
- **New take:** same narrator (Test Voice, `eleven_v4`), with `[emphatic]` tags only. Two takes; take 2 was chosen.
- **Emphasis, V1 → V2 (dB against the take's average word):**

  | Word | V1 | V2 |
  |---|---|---|
  | AIM | −3.2 | +1.6, rising pitch |
  | CLICK | +0.4 | +2.2 |
  | SHUT | −5.2 | +2.0 |
  | TONGUE | +5.1 | +4.0 |
  | SEE | −2.6 | −2.4 (still the weakest) |

- **Pace:** 15 silent gaps were cut to 0.20 s. The beat before "With their mouth SHUT" keeps 0.32 s for the comic
  timing. No word was cut, stretched or re-pitched.
  - Result: 199.9 wpm (V1: 195), longest gap 0.32 s (V1: 0.47 s), speech 0.00–30.32 s.
- **Delivered audio, transcribed back:**
  - whisper is word-perfect. Its only differences are the spellings "mouth pad" and "touch pad".
  - zipformer also drops one 70 ms "and" before "nobody". It drops it on the processed voice alone as well, so this
    is a recogniser borderline, not masking.
- **Masking:** every effect ducks 20 dB under speech, starting 60 ms before each word. The bed is at least 10 dB
  under the voice in 95% of speech windows.
- Provenance: `audio/narration/voice_provenance_v2.json`.

## What changed from V1, sequence by sequence

| Time (s) | V1 weakness | V2 |
|---|---|---|
| 0–2.7 | A static room, then a push into the mouth | **Frame 0:** the monitor fills the frame. An orb flies at Zip, he side-steps and lands a perfect shot (big splat, hit marker, screen shake).<br>**Reveal:** the camera pulls straight out to the player, hands up and untouched. On "THIS" the game's crosshair leaves the screen, flies across the room, the mouth opens and it locks onto the gold pad.<br>**Match:** the tongue taps the pad, the contact ring grows to fill the frame, and it becomes the in-game hit ring as the next shot fires. |
| 2.7–5.4 | The same room composition again | **Low angle:** past the untouched gamepad (dust, cobweb, a bobbing spider) to the hands-free player.<br>**"Seriously":** Honest leans into the foreground, skeptical.<br>**"Watch this":** in the game's own camera, a weave through three orbs, then a double.<br>**Reaction:** Honest's jaw drops (0.3 s). |
| 5.4–10 | A simple device; awkward cross-section | **Lift:** the retainer lifts off his teeth and out of his mouth while his face recedes into a studio backdrop.<br>**Turn:** one elegant turn shows the cups, the palatal plate and the batteries.<br>**Sensor:** the camera dives onto the gold sensor (a capacitive diamond lattice), with a glint on "gold" and a sensing ripple on "square".<br>**Fly-in:** the device turns side-on and flies back as the cut-away head assembles around it, its near half cut away like a real section. The tongue rises to the roof on "roof". |
| 10–11.9 | Move demo | **Tight split:** cause on top (the roof of the mouth from below; the tongue's touch point leaves a glowing trail on the pad), effect below. Zip strafes and runs as W/A/D light. |
| 11.9–13.8 | A tilt shown only in the room | **Head-aim demo, a different layout:** a full-frame face shrinks into a streamer-style facecam over the full-screen game. As his head tilts, the crosshair and the game camera follow, and lock on "AIM". |
| 13.8–15.8 | A press, then a cut | **Press:** a tight cut-away. The tongue rises in anticipation, makes contact on "CLICK", the pad dents and flashes.<br>**Shot:** the flash ring becomes the muzzle flash, and the goo-bot splats with a hit marker. |
| 15.8–20 | One held composition | **Five action-matched shots:**<br>• desktop close-up: the cursor selects a photo;<br>• her medium shot: hands resting on the armrests as her head steers;<br>• the desktop again: the cursor starts a song and exits right;<br>• the phone: the touch point enters from the left, swipes, and answers a call (the guesser waves);<br>• pull back: her hands still on the armrests beside the phone. |
| 20–24.7 | Lips closed through a bared-teeth shape | **Close-up:** the device in the working mouth.<br>**"Close your mouth":** the lips close smoothly; the teeth and device slide out of sight behind the upper lip, with no bared-teeth or "fang" frames.<br>**Match cut:** on the mouth line, to him sitting calmly, eyes half-closed.<br>**Still responding:** the camera pans to the screen as the game splats another goo-bot.<br>**Magnifier:** Honest rolls in with a magnifying glass. The lens really magnifies the closed mouth, and there is nothing to see. |
| 24.7–31.9 | Near-identical room shots, a yellow wipe | **Escalation in rapid cuts:**<br>• wide two-shot;<br>• Honest's thumbs mashing (close-up);<br>• Rex's barrage, with Zip's tiny calm side-steps;<br>• the winner checks his nails;<br>• Honest stands up, straining and sweating;<br>• the winner blinks;<br>• the lock on Rex;<br>• the shut, smiling mouth.<br>**"SHUT":** the K.O. lands on the word. The paint bursts out of the screen, fills the frame at the word's end, and slides away to reveal Honest frozen, mouth open, paint on his face, the controller slipping.<br>**Winner:** smiling, mouth completely shut.<br>**Loop:** the camera pushes back into the screen, and the last frame is frame 0. There is no wipe. |

There are about 30 shots and beats. No composition is repeated back to back in 21–32 s (checked on the phone
sheet `qa/v2/phone_1fps.png`).

## Animation continuity: what was inspected, frame by frame

The sheets are in `qa/v2/`; the frame-step sheets were rendered from the composition.

- **Every planned cut,** 3 frames either side (`qa/v2/cut_*.png`):
  - tap ring → game ring: same centre and growth;
  - press flash → muzzle ring;
  - the lips match cut;
  - paint full → paint sliding off;
  - the montage cuts.
- **Mouth and head movements:** the mouth opening under the reticle (0.70–1.03 s, every 2 frames), the lift
  (5.40–5.93 s, every frame) and the lips closing (21.73–22.20 s, every 3 frames).
- **The match cut into the lift:** the device's screen position and scale are computed from the mouth's own
  geometry, and it stays clipped by the lips until it clears them.
- **Loop seam** (954, 955, 956 → 0, 1): continuous. The LED strip, keyboard lights, PC fans and poster stars now
  complete whole cycles over 31.9 s, so they don't jump at the loop. The game's next round is already running when
  the camera returns to the screen.

**Found and fixed during inspection:**
- an empty dark frame at the split-screen entry;
- the device vanishing one frame early before the lift;
- the device not clipped by the lips on the first lift frame;
- battery pods showing as "fangs" while the lips close;
- the LED colour jumping at the loop;
- Honest's jaw-drop shot being only 6 frames long.

## Mechanism accuracy

- **Tongue sliding on the pad:** movement (W/A/D).
- **Head tilt:** aim (crosshair and game camera).
- **Tongue press on the palate:** click.
- **Hands-free use:** computers and phones.

The tongue is never shown driving the head tracking. The real direction mapping is set per user; the split screen
uses a screen-direction convention, noted in `production/SOURCE_NOTES.md`. The device is still drawn from text
descriptions; reference photos could not be fetched here.

## My V2 quality score: 7.5 / 10

V1 was 6.5. V2 is much stronger in its hook, transitions, demonstrations, comedy and ending.

## Remaining weaknesses for V3

1. **Not watched or heard in real time.** The comic timing of the ending and the music level (about −35 LUFS; it
   ducks deeply) need a human pass.
2. **The side cut-away is still the plainest drawing.** The far-half teeth and cups look blocky from the side, and
   the tongue is a simple shape.
3. **The fly-in turn (7.8–8.5 s) is busy.** The device's near half fades as the head assembles, a short cross-fade of
   one part.
4. **The device brightens slightly on the lift's first frame,** because the teeth behind it are no longer under the
   translucent shell. Its position and size match exactly.
5. **Head aim is shown as a tilt (roll).** The rig has no yaw. It matches "Tilt your head", but a turning head would
   be closer to how the device aims.
6. **The K.O. paint fills the frame for about 3 frames** before sliding away. It is motivated, but it is a full-frame
   colour.
7. **The mashing close-up and the profile head are new drawings,** not the rig. They are styled to match, not
   rig-identical.
8. **The device geometry** (pad size and position, traces, batteries) still needs checking against a real MouthPad
   photo.
9. **No burned-in captions** (a decision for the channel).
