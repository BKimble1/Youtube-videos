import React from 'react';
import {Character, IDLE, Pose, reach, Arm} from '../components/Character';
import {CAST} from '../components/cast';
import {EV} from '../cues';
import {CHK, E, kf, lerp, tw, clamp01} from './common';
import {Stamp} from './props';
import {b03} from './beats1';
import {refCardX} from './beats3';

export type CheckerState = {pose: Pose; dy: number; front: 'none' | 'L' | 'R' | 'both'; holdR?: React.ReactNode};

const REST: Arm = {a: 8, b: 10};
const mixArm = (a: Arm, b: Arm, t: number): Arm => ({a: lerp(a.a, b.a, t), b: lerp(a.b, b.b, t)});

export const checkerState = (g: number): CheckerState => {
  const P: Pose = {...IDLE, mouth: 'flat'};
  let dy = 0;
  let front: CheckerState['front'] = 'none';
  let holdR: React.ReactNode = undefined;

  // B01: peeks up from behind the bench with one sceptical eyebrow
  dy = 330 * (1 - E.back(tw(g, 8, 16)));
  P.brows = 0.4;
  P.browAsym = g < 100 ? 1 : 0;
  P.lookX = kf(g, [[0, 0.6], [38, 0.95]]);
  P.lookY = -0.25;
  P.tilt = -3;

  // B02: calm, follows the hand; startled at the tape, nods at the set-down, glances at the dial
  if (g >= 100) {
    P.browAsym = 0;
    P.brows = 0.15;
    P.mouth = 'hmm';
    P.lookX = 0.85;
    P.lookY = kf(g, [[100, -0.3], [182, -0.3], [190, -0.6], [208, -0.1], [222, -0.2], [231, -0.8], [243, -0.8]]);
    const t0 = EV['B02.tape.contact'];
    if (g >= t0 && g < t0 + 8) { P.brows = 1; P.mouth = 'o'; }
    P.tilt = g >= EV['B02.cup.contact'] && g < EV['B02.cup.contact'] + 8 ? 4 : 0;
  }

  // B03: she slides the card, stamps, then lifts it to face the viewer
  if (g >= 240 && g < 312) {
    const b = b03(g);
    const ch = {x: CHK.x, y: CHK.y + dy, scale: CHK.scale, bob: 0};
    const w = E.inOut(tw(g, 240, 8)) * (1 - E.inOut(tw(g, 299, 9)));
    const rArm = reach(ch, 1, b.hx, b.hy, 1);
    const pushY = g < 284 ? 1086 : b.topY + 16;
    const lArm = reach(ch, -1, b.cardX - 262 + (g < 284 ? 18 : 6), pushY, 1);
    P.armR = mixArm(REST, rArm, w);
    P.armL = mixArm(REST, lArm, w);
    front = 'both';
    holdR = b.hasStamp ? <Stamp /> : undefined;
    P.brows = g >= b.hit && g < b.hit + 5 ? 0.9 : 0.25;
    P.mouth = g >= 292 ? 'smirk' : 'flat';
    P.lookX = 0.7;
    P.lookY = 0.35;
    P.tilt = g >= b.hit && g < b.hit + 5 ? -3 : 0;
  }
  // B04: eyes follow the moving fingertips
  if (g >= 312 && g < 489) {
    P.mouth = 'hmm';
    P.brows = g >= EV['B04.count.thirteen'] && g < EV['B04.count.thirteen'] + 8 ? 0.8 : 0.3;
    P.lookX = 0.92;
    P.lookY = kf(g, [[312, -0.2], [350, -0.5], [437, -0.55], [470, -0.25], [489, -0.15]]);
    P.tilt = 0;
  }
  // B05: attentive to each contact
  if (g >= 489 && g < 609) {
    P.mouth = 'flat';
    P.brows = [EV['B05.washer.pinch'], EV['B05.trigger.contact']].some((t) => g >= t && g < t + 6) ? 0.7 : 0.2;
    P.lookX = 0.85;
    P.lookY = -0.1;
  }
  // B06: studies the tray
  if (g >= 609 && g < 792) {
    P.mouth = 'hmm';
    P.brows = [EV['B06.tray.cost'], EV['B06.tray.space'], EV['B06.tray.service']].some((t) => g >= t && g < t + 6) ? 0.7 : 0.1;
    P.lookX = 0.88;
    P.lookY = 0.3;
  }
  // B07: calm alignment check, then a small approving nod
  if (g >= 792 && g < 890) {
    const nod = EV['B07.checker.nod'];
    P.mouth = g >= nod ? 'smile' : 'flat';
    P.brows = 0.15;
    P.lookX = 0.8;
    P.lookY = kf(g, [[792, 0.2], [848, 0.15], [nod, 0.55], [nod + 8, 0.0]]);
    P.tilt = g >= nod && g < nod + 12 ? 5 * Math.sin(((g - nod) / 12) * Math.PI) : 0;
  }
  // B08: glances at the cosmetic card as it passes, then back to the work
  if (g >= 890 && g < 939) {
    const cx = refCardX(g);
    P.mouth = 'flat';
    P.brows = 0.1;
    P.lookX = g < 934 ? Math.max(-0.7, Math.min(1, (cx - 300) / 420)) : 0.8;
    P.lookY = -0.15;
  }
  // B09: deadpan
  if (g >= 939) {
    P.mouth = 'flat';
    P.brows = -0.35;
    P.browAsym = 0;
    P.lookX = 0.78;
    P.lookY = -0.1;
    P.tilt = 2;
  }
  return {pose: P, dy, front, holdR};
};

const Placed: React.FC<{g: number; st: CheckerState; pass: 'body' | 'frontArm'}> = ({g, st, pass}) => {
  const sc = CHK.scale;
  return (
    <g transform={`translate(${CHK.x - 200 * sc} ${CHK.y + st.dy - 500 * sc})`}>
      <Character look={CAST.checker} pose={st.pose} frame={g} seed={5} x={200 * sc} y={500 * sc} scale={sc} pass={pass} front={st.front} holdR={st.holdR} shadow={false} />
    </g>
  );
};
export const CheckerBody: React.FC<{g: number; st: CheckerState}> = ({g, st}) => <Placed g={g} st={st} pass="body" />;
export const CheckerFront: React.FC<{g: number; st: CheckerState}> = ({g, st}) => (st.front === 'none' ? null : <Placed g={g} st={st} pass="frontArm" />);
void clamp01;
