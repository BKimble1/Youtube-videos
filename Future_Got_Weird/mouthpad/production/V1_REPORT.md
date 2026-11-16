# MouthPad V1: report

**Review file:** `exports/FGW_MOUTHPAD_V1_REVIEW_1080x1920.mp4` (Git-ignored). Checksummed parts are in `backup/`;
restore with `cat backup/FGW_MOUTHPAD_V1_REVIEW_1080x1920.mp4.part_* > exports/FGW_MOUTHPAD_V1_REVIEW_1080x1920.mp4`
and check it with `(cd exports && sha256sum -c ../backup/JOINED_SHA256SUMS)`.

It is not published. Nobody has watched or heard it in real time: this environment has no playback. Every check below
is a measurement, a still frame or a contact sheet.

| Property | Value |
|---|---|
| Runtime | **32.00 s** (960 frames at 30 fps); speech 0.02–31.03 s |
| Video | 1080×1920, H.264 High, CRF 16, yuv420p, BT.709 |
| Audio | AAC 48 kHz stereo, 320 kb/s target |
| Loudness | −14.2 LUFS integrated, −1.6 dBTP true peak (4× oversampled) |
| Layer levels | voice −17.3 LUFS; effects −25.9 LUFS; music −32.3 LUFS (sidechained under the voice) |
| Black frames / frozen ≥ 1 s | none / none |
| Longest near-static stretch | 0.5 s |
| One-frame pops outside planned cuts | none |
| Loop seam (last frame → frame 0) | mean difference 2.4, below the film's median frame-to-frame step of 2.9 |

## Narration

- **Script:** unchanged. The 101 words of the timeline equal `production/NARRATION_LOCKED.txt`, which is the brief's
  locked text, character for character.
- **Voice:** the channel narrator, ElevenLabs "Test Voice" `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`. Delivery was
  directed with inline tags only (excited and a little incredulous, quick, punchy, dry on the ending).
- **Take:** one run of two takes. Take 2 is used sample for sample: no cut, stretch, pitch or gain edit, only
  padded to 32 s. Details are in `audio/narration/voice_provenance.json`.
- **Pace:** 195 wpm over the speech span, about 225 wpm while voiced. The longest pause is 0.43 s, so there is no
  dead air.
- **Delivered audio, transcribed back by two local models:**
  - whisper base.en is word-perfect. Its only differences are the spellings "mouth pad" and "touch pad".
  - zipformer has the same differences, plus "video" heard as "vitio". It hears "video" that way in the raw take
    too, so this comes from the voice, not the mix.
- **Masking:**
  - Every splat, shot and click lands in a pause or after the word it answers.
  - Effects duck 14 dB and the music 9 dB while the voice speaks.
  - Over the speech, the mix transcribes exactly like the dry take on both models.

## Scene structure (actual times)

| # | Time (s) | Line | Picture |
|---|---|---|---|
| 1 | 0.00–5.80 | "If you put THIS… TONGUE. Seriously. Watch this. It's called the" | **Frame 0:** the guesser at his gaming desk. Both hands are up and wiggling, well away from the keyboard and gamepad. His mouth is closed, and on screen his robot Zip dodges an orb.<br>**"THIS" (0.56):** he opens wide and the camera pushes straight into his mouth. A clear retainer sits over his upper teeth, a gold square glints behind the front teeth, and his tongue rises to it.<br>**Pull back (2.0):** his tongue swipes left and Zip strafes left on the same frames.<br>**"TONGUE":** the crosshair locks, the tongue presses up, and the goo-bot is splatted.<br>**"Seriously" (3.5):** Honest slides in on his beanbag, skeptical, and checks the raised hands.<br>**"Watch this":** a flick dodges an orb, a press splats the next goo-bot, and Honest's jaw drops.<br>**End:** the guesser turns to camera, opens wide, and the camera pushes into the mouth. |
| 2 | 5.80–8.19 | "MouthPad. And that tiny gold square?" | **Match cut:** the device keeps its exact screen position, size and angle while the face becomes a clean studio backdrop.<br>**Turn:** the teeth fade and the retainer turns. It shows the cups over the teeth, the palatal plate and the battery modules at the rear molars. It separates briefly into its layers, then turns to the tongue side.<br>**"Gold square":** the camera goes in on the gold pad, which glints on "gold". |
| 3 | 8.19–10.28 | "It's a touchpad sitting on the roof of your mouth." | **Side cut-away of the guesser's head:** lips closed, palate plate, gold pad and molar battery visible. The camera pushes in on the roof of the mouth.<br>**"Roof":** the tongue rises and touches the pad, which flashes.<br>**After:** the tongue slides along the pad. |
| 4 | 10.28–12.41 | "Move your tongue, your character moves." | **Split screen:** the game on top, the roof of the mouth seen from below underneath.<br>**Tongue left:** the A key lights and Zip strafes left.<br>**Tongue toward the front teeth:** W, and Zip runs forward.<br>**Tongue right:** D. |
| 5 | 12.41–14.30 | "Tilt your head, you AIM." | Back in the room: hands laced behind his head.<br>**Tilt left:** the crosshair moves left.<br>**Tilt right:** it moves onto the goo-bot and locks on "AIM". |
| 6 | 14.30–15.58 | "Press your tongue up, you CLICK." | The cut-away, tighter. The tongue rises to the pad. On "CLICK" it presses, the pad dents slightly and a ring flashes. |
| 7 | 15.58–16.27 | (CLICK) | The game fills the frame. The blaster fires and the goo-bot splats. Honest gasps at the bottom of frame. |
| 8 | 16.27–20.47 | "And people are already using this thing… without their hands." | **Another cast member, "person", in a power wheelchair.** Small head moves steer the cursor, which opens a photo, then starts a song.<br>**Pan to her phone on a mount:** she swipes, then answers a video call (the guesser waves).<br>**Wide:** her hands rest on the armrests throughout. |
| 9 | 20.47–25.60 | "But here's the craziest part. Close your mouth, and nobody can even SEE the controller." | **Push in:** the camera moves in on the guesser's working mouth (one more splat).<br>**"Close your mouth":** the lips close over the device.<br>**Pull back:** a completely ordinary face, and the game keeps firing.<br>**Honest:** leans in, peers at his mouth, checks the untouched gamepad, and is baffled. |
| 10 | 25.60–32.00 | "So imagine losing a video game… With their mouth SHUT." | **Versus round:** Honest mashes his controller, sweating. The guesser sits perfectly still, hands behind his head, mouth shut, a slight smirk. Zip slips every one of Rex's shots.<br>**Right after "SHUT":** the winning splat lands, the music stops dead under the impact, and a trophy appears.<br>**Honest:** freezes, the controller slips, and he slumps out of frame.<br>**Loop:** the guesser raises his hands, the round wipes, and the frame is frame 0. |

There are about 28 distinct beats. Most shots last 0.5–1.5 s, and no picture is static for more than 0.5 s.

## Transitions (outgoing → incoming → new information → kept)

| t (s) | Transition | New information | Kind |
|---|---|---|---|
| 0.56–1.16 | wide → inside the mouth (one continuous push) | the device in his mouth | camera move through one drawing |
| 1.47–2.06 | mouth → face and screen (pull back) | the tongue moves the game | camera move |
| 5.80 | mouth → product view (match cut; device unchanged on screen) | the device's real shape | deliberate match cut |
| 8.19 | product → side cut-away | where it sits (the roof of the mouth) | deliberate cut, new representation |
| 10.28 | cut-away → split screen | tongue direction = movement | deliberate cut |
| 12.41 | split → room | head = aim | deliberate cut |
| 14.30 | room (push toward mouth) → cut-away | the tongue press | deliberate cut |
| 15.58 | cut-away → screen | the press fires | deliberate cut |
| 16.27 | screen → montage | real users, computers, phones | deliberate cut, new place |
| 20.47 | montage → room | the twist | deliberate cut, back to the room |
| 22.6–24.0 | ECU mouth closes → pull back | the controller becomes invisible | camera move |
| 31.95 → 0 | end → frame 0 | the loop | identical composition |

Bursts of frames on both sides of every cut, and the loop seam, are in `qa/v1/cut_*.png` and
`qa/v1/loop_seam.png`. The match cut was checked numerically: the device origin is at (541, 1017) px and the scale
is 14.2 px/mm on both sides.

## Device accuracy

The device is drawn as a thin, clear, custom-fit upper retainer. It has:
- cups over the upper teeth and a palatal plate;
- a gold flexible-circuit pad on the palate, facing the tongue;
- gold serpentine traces running to sealed battery modules at the rear molars.

**Mechanics shown:**
- the tongue sliding on the pad moves the character (W/A/D);
- head tilt aims;
- pressing the tongue up clicks;
- hands-free computer and phone use.

**Not shown:** sip-to-right-click, scroll and swipe gestures, the app, specifications and price.

Sources and what still needs checking are in `production/SOURCE_NOTES.md`.

## Claims needing verification before publishing

The official augmental.tech pages could not be opened from this environment (blocked by its network policy). The
facts come from search-result summaries.

1. **The FPS profile mapping:** tongue → WASD, head → aim, tongue press → click. Check it in Augmental's
   "MouthPad performance and capabilities" post. The search confirmed a WASD remap and head-tracked cursor control,
   but not head-as-FPS-aim in those words.
2. **The gold pad's real size and position, and the layout of the traces and batteries.** These are drawn from a
   text description, not a product photo.
3. **"nobody can even SEE the controller":** this is inferred from the form factor (inside the mouth, about 1 mm
   thick). No source says it outright.
4. The direction convention (screen-left on the pad = strafe left) is a simplification. The real mapping is set
   per user.

## My V1 quality score: 6.5 / 10

**Strengths:**
- Strong, fast hook: hands-free play, then into the mouth on "THIS", then the tongue moves the game, all inside
  2 s.
- One device model used in every view.
- Clean cause and effect on every mechanic.
- A real punchline and a seamless loop.
- The Weird Crew rig is used unchanged, so the faces are stable from frame to frame.

**What holds it back:** see below.

## Genuine remaining issues for V2

1. **Not watched or heard in real time.** Pacing, comic timing and the mix balance need a human pass, especially
   the music level and the punchline stop.
2. **The cut-away profile is a new drawing.** The rig has no profile view. The side view of the guesser reads as
   him (hair, blush, eye style, tee) but is not rig-identical.
3. **The game is small in the wide room shots.** Goo-bots and Rex are small at phone size during the versus round.
   A tighter versus framing, or a big screen insert, would sell the win better.
4. **The mouth passes through a bared-teeth shape** for about 0.2 s while it closes (23.0 s).
5. **The match cut** loses the lips and face in one frame by design. The palate's back edge shows an odd notch
   during its 0.3 s fade.
6. **Head aim is subtle** in the medium shot. The tilt is about 15° on a head about 250 px wide.
7. **Two pushes into the mouth are fast** (0.56–1.16 s and 5.19–5.80 s). They are ramped, not pops, but energetic.
8. **The wheelchair is a simple front view.** It is respectful and clear that her hands rest, but it could be
   drawn with more character.
9. **No burned-in captions.** The brief prioritises visual storytelling. Decide for V2 whether the channel's Shorts
   should carry them.
10. **The music is a simple synthesized bed.** A stronger original track could lift the energy.
