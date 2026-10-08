# S7: builder and director-review reports

## Builder

(see workflow journal)

## Director review

I reviewed S7 and found eight defects plus two small ones. All are fixed and checked over two fix-and-render rounds. `npx tsc --noEmit -p .` passes and the final clip renders cleanly (still share 5.3%, longest still 1.2 s).

**Defects found and fixed** (in `src/scenes/S7_Results.tsx` unless noted)

1. **Light path crossing the partition (S7.3):** the pulse trail had a gap cut into it right above the partition's far top corner, so the light read as passing behind or through the partition. The hiding test used a 1.7 m box, but the drawn panels are arched and 9 cm lower at the corner. The path is now tested against the partition as drawn, the same way S1 and S3 do it. The scene also now stops with an error if the path ever comes within 18 px of the partition. Clearance is currently 21.3 px and the trail is unbroken.
2. **Checker hiding the sensor (empty-room scan):** in the zoomed-in scan shot, her right side and hanging arm covered the sensor and its readout. The coral highlight was drawn on her sleeve and the dotted callout lines led to a hidden screen. She now stands 0.2 m further left in this scene. Her depth and all light paths are unchanged, and the sensor and readout are fully visible.
3. **Front view overflowing its card (S7.2):** the 560 px U image ran about 10 px past the card's right edge. It now sits 24 px inside. I also narrowed the "one position: an arc" callout so it no longer touches the image.
4. **"16 listening spots" next to only 4 dots (S7.1):** each dot seen from above is 4 spots stacked up the wall. A "×4" tag now pops under each column on "sixteen". This is accurate to the data, which only has x and z (`S7_Plots.tsx`, new `stackTag` prop).
5. **Shoo read as a raised fist and partly covered the sensor:** it is now a sweep. Her hand comes up beside her head, then swings out toward him three times, staying above the sensor. Sound cues moved 2 frames to match the outward swing.
6. **Too much at once during the push-in:** the "our clip" card was still sliding out while the camera pushed in and the shoo began. The card now leaves 1 s after the stamp lands. The push starts just before "And" and settles as the first shoo swing lands.
7. **Scan panel early:** the "empty-room scan" panel appeared 2 frames before her finger reached the button. It now appears on contact.
8. **Film strip dropping mid-move (S7.4):** it fell in while the camera was still pulling back. It now drops once the move has nearly settled.
9. **Minor:**
   - The tick on the sensor's own screen popped off during the S7.4 pull-back; it now stays on.
   - The "independent reproduction" plaque text ran edge to edge; it now has padding and stays inside the plinth.
   - The 2000 px camera move between the two evidence boards (S7.1 to S7.2) took 18 frames and read as a whip; it now takes 24.

**Checked and fine:** every cue still comes from the narration words, nothing is hard-coded, and nothing is random. All on-screen text meets the size rules and stays out of the caption band. Labels match the storyboard and claims C02, C12 and C32–C38. The hand touches the strip on "reflective". The guesser is correctly half-hidden by the partition's near panel in S7.4. The sound sheet has 69 entries, all inside the scene; it lost one film tick because the strip now drops later.

**Remaining limitations**
- The wall-to-board light leg passes about 21 px above the partition's far top corner on screen instead of visibly through the gap. That is the same path and framing S1 and S3 use. A path that really runs through the gap would need a lower path height or a new framing across all three scenes; that's your call.
- S7.4 shows our kit sensor and room while the chip reports the authors' 30 frames/s result in ordinary clothes. The chip line "a different capture from our clip" is the only thing keeping those apart.
- The museum set is plain and its push-in is about 10%.
- The front-view U panel is scaled per view and the colour ramp favours low values, as the builder disclosed; the data values are unchanged.

**Files**
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S7/source/src/scenes/S7_Results.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S7/source/src/components/v02/S7_Plots.tsx`

**Final contact sheets** (in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S7/dir2/`)
- `clip/dense/S7_sheet01.jpg`
- `clip/dense/S7_sheet02.jpg`
- `clip/dense/S7_sheet03.jpg`
- `clip/dense/S7_sheet04.jpg`
- `clip/dense/motion_S7.png`
- `clip/S7_clip.mp4`
- `stills/` (full-scale check stills)

The baseline before my fixes is in `qa/scenes/S7/dir0/`, and round 1 is in `qa/scenes/S7/dir1/`.
