// Export V2's staged event times (and the capsule's screen-side pan tracks) for tools/make_audio_v2.py, so every effect
// is placed from the picture's own timeline.
import * as fs from 'fs';
import {V2} from '../source/src/v2/timing';
import {capsulePanTrack, descentPanTrack, FRIEND_STEPS, ASTRO_STEPS, DOOR_STEPS, ROOM_STEPS} from '../source/src/v2/story';

const EV = {
  claspSqueeze: 0.5, headTurn: V2.headTurn, reflection: V2.reflection, spaceCut: V2.spaceCut,
  flightStart: V2.flightStart, flightEnd: V2.windowPass, windowPass: V2.windowPass,
  hourStart: V2.hourStart, hourEnd: V2.hourEnd, wristDown: V2.wristDown, wristUp: V2.wristUp2, matchCut: V2.matchCut,
  windowPush: V2.windowCover, wipes: [V2.wipe1, V2.wipe2], friendSteps: FRIEND_STEPS, lookUp: V2.lookUp,
  lightPass: V2.lightPass, descentStart: V2.descentStart, landing: V2.landing, hatch: V2.hatch, astroSteps: ASTRO_STEPS,
  clasp: V2.clasp, gesture: V2.gesture, doorSteps: DOOR_STEPS, doorPass: V2.doorPass, roomSteps: ROOM_STEPS,
  dustWipe: V2.dustWipe, watchBeside: V2.watchBeside, photoPush: V2.photoPush,
};
fs.writeFileSync(process.argv[2], JSON.stringify({EV, pan: {capsule: capsulePanTrack(), descent: descentPanTrack()}}, null, 1));
console.log('cues ->', process.argv[2]);
