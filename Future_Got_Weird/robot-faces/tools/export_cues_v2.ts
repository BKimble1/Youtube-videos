// V2: exports the picture's timeline (shot list with transition types, key times, the action times the sound follows)
// for the sound design and the transition document, so both follow the same measured anchors as the animation.
//   source/node_modules/.bin/esbuild tools/export_cues_v2.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --outfile=/tmp/ec2.cjs && node /tmp/ec2.cjs audio/cues_v2.json
import {writeFileSync} from 'fs';
import {SHOTS2} from '../source/src/v2/Film2';
import {BABBLE, CO24, K, TRIALS} from '../source/src/state';
import {T} from '../source/src/lib/core';
import {END, FIRST_BA, MONTAGE, PRED, COPY_DT, EXPR_COPY, MIRROR_TRIALS} from '../source/src/v2/state2';

const out = {
  end: END,
  shots: SHOTS2.map((s) => ({id: s.id, a: s.a, b: Math.min(s.b, END), tr: s.tr, what: s.what, cont: s.cont ?? ''})),
  K,
  trials: TRIALS.map((t) => t.t),
  babble: BABBLE.map((b) => b[0]),
  co24: CO24,
  act: {
    copyHuman: T('copy human'),
    lips: T('lips,'),
    predict: T('predict an'),
    flexible: T('flexible'),
    gives: T('That gives'),
    tryB: T('produce those') + 0.1,
    tryA: T('adjusting') + 0.1,
    tryE: T('motors underneath'),
    rigid: T('rigid metal'),
    somethingElse: T('something else'),
    drive: T('drive'),
    firstBa: FIRST_BA,
    look: T('A machine looks'),
    easier: T('easier to'),
    copy2: EXPR_COPY - 0.05,
    mirrorTrials: MIRROR_TRIALS.slice(0, 3).map(([t0]) => t0),
    predRobot: PRED.robot,
    copy: T('copy human') + COPY_DT,
    montage: MONTAGE.slice(0, 6).map(([d]) => T('building a relationship') + 0.15 + d),
    createThe: T('create the'),
    faceWays: T('face ways'),
    triesSmile: T('Then it tries'),
    humanoidSmile: T('a well-timed'),
    end: END,
    response: T('response.'),
    assistant: T('or a robotic'),
  },
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('wrote', process.argv[2], out.shots.length, 'shots');
