# Season 1 · Winter Break launch trailer: V1 report

Review render: `exports/UT_SEASON1_CHRISTMAS_V1_REVIEW_4K.mp4` (restore from `backup/`, see the README).

| Property | Value |
|---|---|
| Runtime | 30.00 s (1,800 frames at 60 fps) |
| Video | 3840 × 2160, H.264 High, yuv420p, BT.709 |
| Audio | AAC 48 kHz stereo, 320 kb/s |
| Loudness | MEASURED_LUFS LUFS integrated, MEASURED_TP dBTP true peak (EBU R128, measured on the delivered file) |

## How it was made

Everything on screen is Ultimate Trifecta's own engine and art: Godot 4.7.2 rendering
Moonbrook College (the playable map), the skinned runner and Night Watch rig with its
animation graph, the Season 1 outfits (Elf Helper, Reindeer Onesie, Gingerbread Buddy,
Snow Day) and the icon's striped-pajama runner, the carts, rifts, power-up holograms,
hiding bushes, coins, water and splash effects, and the holiday dorm with its tree.

There is no gameplay recording in it. A dev-only scene (`source/godot_trailer/`, meant
for `game/src/dev/trailer/`, which is never exported) drives the real characters
through the same `apply_state()` path the match uses. Each actor follows a
choreography timeline (routes, speeds, jumps, dives, splashes, tags, emotes, carts),
and a keyframed camera films it: Hermite splines, actor-relative follow keys,
dolly zoom, roll, handheld shake and impact kicks. Slow motion is a time warp, so
particles and animation slow together. The chase is one choreography cut into
six shots, so geography and timing carry across every cut.

Each shot was rendered with Godot's Movie Maker at a fixed 60 fps clock,
natively at 3840 × 2160 with 2× MSAA, on the Mobile renderer under Mesa llvmpipe
(software Vulkan, about 10 s per frame). The compositor (`source/comp/`, Python and
OpenCV) cuts the shots to the music grid and adds:

- the transitions: whip pans, punch-ins and flashes;
- the grade: tone curve, night-blue blacks, warm highlights, two-scale bloom, vignette and grain;
- the flashlight lens flare;
- the logo reveal.

Every stage has a low-resolution preview path: blocking stills, a 30 fps
animatic and frame-stepped contact sheets. These were checked before the 4K
renders.

### Shot list (timeline)

| Time | Shot | What happens |
|---|---|---|
| 0.00–1.80 | `a1_push` | Low and fast down the snowy, lit quad toward Founders' Fountain and Bellweather Tower; a Christmas tree on the lawn |
| 1.80–2.75 | `a2_flash` | The Night Watch whips the flashlight round; the beam crosses the lens on the 2.0 s hit |
| 2.75–4.00 | `a3_caught` | Over his shoulder: the striped-pajama runner, caught in the beam, turns round (dolly zoom); stop-down |
| 4.00–5.50 | `b1_drop` | THE DROP: the runner bolts; Elf Helper and Reindeer burst out of hiding; crane up over the fountain |
| 5.50–7.00 | `b2_dorm` | Whip into the holiday dorm: the tree, then the season's outfits dancing (emotes) |
| 7.00–8.50 | `b3_rift` | A runner grabs a Speed Sneakers hologram and dives through a rift, which snaps shut on 8.0 |
| 8.50–10.00 | `b4_coins` | Snow Day sweeps a line of Coins |
| 10.00–11.00 | `c1_cart` | A Night Watch cart swings round the plaza at the lens |
| 11.00–12.00 | `c2_whiff` | A lunging tag misses a hopping reindeer (slow-motion whiff) |
| 12.00–13.00 | `c3_pond` | Cannonball into Froggy Pond, from the water line |
| 13.00–14.00 | `c4_bush` | The beam sweeps past a bush; an elf slips out behind the Night Watch |
| 14.00–15.00 | `c5_shield` | A Pillow Shield: the tag bounces off |
| 15.00–16.00 | `c6_cartchase` | Two carts chase runners across the lawn, right past the lens |
| 16.00–17.00 | `c7_dive` | A full-stretch dive into Splashdown Pool |
| 17.00–18.00 | `c8_hopout` | A cart skids up; the Night Watch hops out and sets off (whistle) |
| 18.00–20.00 | `d1_front` | The final chase: low, in front, tracking back along the green arrows; the officer's flashlight far behind |
| 20.00–21.00 | `d2_leap` | Side tracking; the leap over the fountain rim |
| 21.00–22.00 | `d3_splash` | The splash in slow motion, then the action speeds through the duck-under |
| 22.00–24.50 | `d4_home_reveal` | Key change: out of the water and away; the crane reveals the arrows running to Puddlesworth Hall |
| 24.50–26.50 | `d5_door` | Low at the hall: the runner races at the lens and through the glowing front door (climax) |
| 26.50–28.00 | `d6_shush` | The Night Watch stops on the quad, turns to us and shushes: he let him win |
| 28.00–30.00 | `e1_logo` | The official Ultimate Trifecta title slams in over the hall in the snow; SEASON 1 · WINTER BREAK; the bell sting |

## Music

"Night Watch Jingle" is an original score written for this trailer (`audio/tools/score.py`).

- **Tempo:** 120 BPM, so one bar is exactly 2.0 s and every section lands on a bar line.
- **Shape:**
  - a B-minor music-box version of the hook for the cold open;
  - the flashlight hit, a riser, and silence at 3.75 s;
  - the drop into the hook in D major with sleigh bells, brass, strings, choir, trailer drums and bass;
  - a B-minor action riff for the chaos, with a stop-down at 17.75 s;
  - a driving chase ostinato, which goes under water for the slow-motion splash;
  - a key change up to E major as the runner comes out of the water;
  - the climax at the dorm door, a pizzicato tiptoe for the shush, and silence at 27.75 s;
  - the E-major logo hit, then the hook replayed as a bell sting.
- **Orchestral parts:** MIDI rendered with FluidR3_GM (MIT licence) through fluidsynth.
- **Synthesized in numpy (`audio/tools/dsp.py`):** drums, taiko, booms, sleigh bells, bass and risers.
- **Melody:** original. No existing carol or song is quoted.

## Sound design

`audio/tools/build_sfx.py` places sound from the edit and the engine's own event
logs. Footfalls come from each character's gait phase, alongside its jumps, dives,
splashes, tags, rustles, coin pickups and the beam. Level follows camera distance
and pan follows screen position.

| Layer | Content |
|---|---|
| Atmosphere | Winter wind, a tower bell and clock ticks in the cold open, distant sirens under the chaos and the chase |
| Diegetic sounds | Police-radio chatter (garbled, no words to follow) at the opening and as the chase starts |
| Action | The flashlight click and swing, splashes (a varispeed slow-motion splash for the hero), the portal, the cart pass and skid, the whistle, the shield bounce, the door whoosh with a muffled cheer inside, a synthesized "shh" |
| Transitions | Whooshes on the whip pans and the logo impact |

Sources:

- **ElevenLabs sound effects generated for this trailer:** `audio/sfx_src/el/`, 13 prompts with 2 to 4 takes each.
- **The game's own sound effects:** `audio/sfx_src/game/`, synthesized for the game by its `tools/gen_audio.py`.
- **numpy synthesis:** footsteps, drips, squelch, the shush, and shimmers.

### Mix

`audio/tools/mix.py` sums music and sound design:

- the music ducks under the radio, the slow-motion splash and the shush;
- a section-gain shape gives the trailer its dynamics: a hushed open, a drop that jumps by about 6 dB, a chaos bed, a climb to the climax, and the logo as the loudest hit;
- sound effects dip inside the three stop-downs;
- a gentle bus compressor and a look-ahead true-peak limiter set the master to -14 LUFS integrated with a true peak of -1.2 dBTP or below.

## Trailer-only staging (please confirm)

These were asked for in the direction but are not in the 2.2 build's campus, so they are
staging for the trailer, not features of the game:

1. **Falling snow on the campus.** The game shows snow only through the holiday dorm's
   window, on roofs, trees and lawn.
2. **Christmas lights and trees outdoors.** The bulbs, tree, presents and wreath are the
   game's own HolidayDecor pieces (the dorm's), placed along the quad, on Puddlesworth
   Hall and on the lawn.
3. **The green arrow path.** The game guides runners with HUD compass arrows to the
   waters and home, not with arrows on the ground.
4. **The flashlight's visible beam and lens glare.** These are a stronger, aimed version of
   the Night Watch's real flashlight, so the beam reads on camera.

If any of these should be added to the game, or toned down in the trailer, that is an easy change.

## QA

QA_SECTION

## Known limits and open questions

LIMITS_SECTION
