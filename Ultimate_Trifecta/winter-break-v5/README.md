# Ultimate Trifecta: Season 1 – Winter Break (V5, final, 33 s)

V5 is built from the V4 source project.

**Locked from V4:**
- the approved score, placed untouched at 0:00
- the headlights at 0:08.000
- the official title at 0:29.800, held to 0:33.000

**Kept:**
- the lobby invitation
- the fountain step
- the wide fountain turn
- the eye peeking through the snowy bush

Everything is rendered from the source scenes in Godot at native 1920×1080 and 30 fps, at natural playback speed (no retiming).

## Deliverables

| File | What it is |
|---|---|
| `exports/Ultimate_Trifecta_Winter_Break_V5.mp4` | Delivery copy: 1920×1080, 30 fps, H.264 two-pass at about 17 Mb/s, AAC 48 kHz |
| `backup/…V5_master_crf16.mp4.part00/01` | CRF 16 master, split to stay under GitHub's 100 MB limit. Rejoin with `cat *.part* > master.mp4`; the sha256 is in `master_crf16.sha256` |
| `audio/mix/` | Final mix plus stems: score (bit-identical to the source) and effects |
| `qa/v5/` | QA report, contact sheet, frame-by-frame strips, and a phone-size muted contact sheet of the pursuit |
| `source/` | Planner (`plan6.py`), EDL, trailer director, mix and compositor; `source/game_patch/` has the one game-side change (see below) |

## 1. The cart pursues them to the lobby

The cart route after the dive now reads as one continuous pursuit:

1. **To the bollards.** The cart chases Blue and the elf down the spine. It stops at the bollard row north of the road; those bollards block carts on the map. The two get through to the door.
2. **The search, 0:18–0:20.5.** The cart swings round and searches back north. Its beam rakes the bush where the reindeer hides (0:19.5–0:20.0), then clears.
3. **The launch, 0:21.4–0:23.5.** As soon as the beam clears, the eye finds the door and the reindeer launches. North of the bush the cart U-turns, and its beam sweeps once across the empty patch the reindeer just left. The cut comes on the running stride.
4. **The pursuit shot, 0:23.5–0:25.6.** Staged from just inside the open lobby door, looking back up the route on a longer lens, so the cart reads at phone size:
   - Blue's reaching hand is at the bottom-right edge, and the open leaf frames that side.
   - The reindeer runs down the west side of the path, through the gaps in the two bollard rows.
   - The cart comes after him down the east side of the same path, offset so he never covers its front. Its windshield and both headlights face camera.
   - The camera holds steady while the cart grows from about 40 m to about 23 m away against the bollards. Its beam advances along the paving toward the threshold.
5. **Inside, still approaching.** The cut inside comes while the cart is still moving toward them. It stops at the bollards at about 0:26.2, out of reach.
6. **After the latch.** Only after 0:28.500 does it turn away east along the bollard row. Its beam sweeps across the door glass and passes.

The exported MP4 was reviewed muted, as a phone-size contact sheet of 0:22–0:28.5 (`qa/v5/phone_muted_pursuit_22.0-28.5.jpg`, 480×270 tiles) and frame by frame (`qa/v5/frames_cart_pursuit_e4a_23.50-25.60.jpg`). Every visible move of the cart in 0:23.5–0:27.8 is toward the camera and the friends.

The first full render failed that check: on the original 34° lens the cart was only a few pixels wide at phone size. The shot was re-rendered on a 22° lens with the camera set back into the doorway, and with headlights about twice as bright.

## 2. Urgency and weight

- **Before the reveal:** laughing off the toe test, the three step in for a three-way fist bump. The light hits a hand's width before the fists meet.
- **0:08, caught in the light:**
  - The headlights hit on 0:08.000 and all three freeze in the beam. They turn into the light, faces lit and startled, and hold, as in the earlier versions.
  - The elf sees it first and bolts on the musical step at 0:08.7. The elf's hand catches Blue's sleeve, so Blue goes with the elf (0:08.83).
  - The reindeer reacts late and loses half a stride in the turn: a skid, a knee dip and slow first steps (0:09.07).
  - The shot holds to 0:09.4, so the reindeer's late start is seen.
  - Their run is solved to reach the same marks after the fountain turn, so every later beat is unchanged.
- **The cart insert (0:09.4):** a low shot beside the front wheel looking down the beam. The tyre starts rolling over the paving seams while all three are already running ahead.
- **The closer chase shot:** Blue takes one quick look over the shoulder (about 0.25 s), then drops into a lower lean. The next two strides are about 16% faster, with harder arm pumps.
- **The bush:** the eye follows the returning beam, and the moment it clears the eye goes to the lit door. A short eye-line shot of the doorway follows (Blue waving him on, the elf holding the leaf). Then the launch, timed on the musical pickup: branch at 0:21.6, plant at 0:22.2, spring at 0:22.5.

## 3. The two contacts

**The tyre, 0:15.4–0:17.**

The V4 gap had two causes:
- Near the drift, the tyre's contact shadow and tread marks were placed at the drift's top height, even where the tyre was on the paving beside it. They hovered several centimetres up and read as daylight under the tread.
- The cart body was positioned from the ground under its centre, not under its wheels.

The engine now does the following:
- It rides the cart on its four tyre contact points.
- It puts each contact shadow on the drawn surface directly under the tread.
- It lays tread marks and footprints on the drawn snow surface.
- It throws the snow spray from the point where the wheel meets the patch.

The low side angle was also replaced with a three-quarter insert on a thin dusting:
1. Blue's slipper pushes off, leaving a clear print, and clears frame.
2. About 0.6 s later the cart's front tyre rolls across that exact mark, with spray at the contact and a tread mark behind.

The cart route is offset so that tyre's track runs over Blue's footfalls. Travel is left to right, matching the dive shot that follows.

**The doorway catch, 0:25.6–0:27.8, from inside the lobby, through the open door.** The camera looks straight down the gap between Blue and the reindeer.
1. Blue plants the outside slipper forward onto the slab.
2. Blue's hips turn toward the lobby while the shoulders stay on the reindeer.
3. The hands meet in that gap, clear of both bodies, against the lit paving outside (frames 800–803).
4. Blue steps backward into the lobby with the pull, still facing out.
5. The reindeer's recovery step brings him through the opening.
6. The elf, holding the leaf by the hinge from inside, hauls it shut as the trailing foot clears. The latch catches at 0:28.500.

The reindeer keeps his free arm tucked in and takes a wider line through the doorway. A side view along the closed leaf confirmed that no hand, sleeve or antler passes through its edge. In the first render, Blue's body hid the hands and that arm reached through the door edge for a few frames. Both were fixed before the final render.

**Game-side change.** The character view used to turn the body toward its travel above 0.8 m/s, so a backward step became a turn-and-walk. A trailer-only `keep_yaw` flag (off by default) lets a scripted step back keep its facing. The game's own behaviour is unchanged. See `source/game_patch/character_view.gd`.

## 4. The ending

The camera holds the same interior shot after the latch:
- The elf leans back against the shut door. The other two listen.
- The cart's beam sweeps across the glass and passes, and their eyes and heads follow it.
- A clump of snow drops from the reindeer's antler and lands at about 0:29.33.
- Blue notices first. The other two glance down about 0.15 s later.
- That reaction holds until the hard cut to the title at 0:29.800.

The title artwork is unchanged and the music is exactly as approved.

## Measured sync and QA (on the exported MP4)

Full numbers are in `qa/v5/report.json`.

**Format:** 990 frames, 1920×1080, 30 fps, 33.0 s.

**Picture timing**, identical in the CRF 16 master and the delivery copy:
- Title first frame: 894 (29.800 s).
- All 16 cuts land on their EDL frames.
- Relay click and headlights: 8.018.
- Latch: 28.500.
- Snow landing: 29.331.

**Audio:**
- Loudness: −14.01 LUFS integrated, −1.81 dBTP.
- The delivery copy measures −14.02 LUFS and −1.82 dBTP.
- Score stem vs source: max difference 0.0, lag 0 samples.
- Effects under the title: −67.8 dB, so the last musical hit plays clean.

**Muted review**, with strips in `qa/v5/`:

| Check | Frames | What the frames show |
|---|---|---|
| Cart direction | 705–768, plus the phone-size sheet | The cart's windshield and both headlights face camera. It grows against the bollards behind the reindeer, never hidden by him. The cut inside comes while it still approaches. |
| Caught in the light | 240–282 | Lit and frozen in the beam from 8.0, the elf away at 8.7, then Blue, then the reindeer. |
| Tyre contact | 462–510 | Blue's slipper prints the dusting and clears frame. The front tyre then rolls across that mark with its shadow under the tread and spray at the contact. |
| Hand catch | 792–813 | The hands meet in the gap between the bodies (800–803). Blue steps back with the pull and the reindeer recovers through the opening. |
| Door clearance | 813–834 | The trailing foot clears before the leaf swings. Nothing passes through the door edge. |
| Ending | 834–894 | The latch, then eyes following the sweep across the glass. The clump lands, Blue looks down first, then the others, then the title. |

**Sound pass:** this pipeline cannot play audio. Pace and the last musical hit were checked by measurement, not by ear: sync peaks, loudness, score integrity, and the waveform around every beat (`qa/v5/audio.png`).
