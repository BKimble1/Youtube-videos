// HOOK 05: "This beetle shoots boiling chemicals… from explosions inside its own body."
// One continuous shot in one world (mm): an ant lunges at a Brachinus bombardier beetle, the abdominal tip swings onto it
// and fires a pulsed hot spray; the camera follows the spray back to the tip and into the abdomen, which turns
// semi-transparent in place to show the paired glands pulsing; then it pulls back out as the beetle fires again and
// the ant backs off, cleaning its antennae. Timeline: scene.ts (EV); audio cues mirrored in tools/audio/h05.py.
import React from 'react';
import {HookFrame, HookProps} from '../shared/HookFrame';
import WORDS from '../data/h05_words.json';
import {ss, Words} from '../shared/lib';
import {basis} from '../shared/three';
import {Item, Items, resetIds, shadowItem} from './core/draw3';
import {beetleItems, resetBIds} from './beetle/draw';
import {antItems} from './ant/draw';
import {antRig, beetleRig, camAt, camOrbit, EV} from './scene';
import {SprayDefs, sprayItems} from './spray';
import {cutawayItem} from './glands';
import {Env} from './env';

export const cutAmount = (t: number) => ss(t, EV.cutIn[0], EV.cutIn[1]) * (1 - ss(t, EV.cutOut[0], EV.cutOut[1]));

export const Scene: React.FC<{t: number}> = ({t}) => {
  resetIds('h05');
  resetBIds();
  const ns = 'h05';
  const cam = camAt(t);
  const B = basis(cam);
  const R = beetleRig(t);
  const A = antRig(t);
  const items: Item[] = [];
  const bo = R.st.body.o;
  items.push(shadowItem(B, [bo[0] - 1.2, bo[1], 0], 5.6, 3.2, 0.5, 0.01));
  items.push(shadowItem(B, [A.body.o[0], A.body.o[1], 0], 5.2, 2.8, 0.42, 0.01, {yaw: (Math.atan2(A.body.f[1], A.body.f[0]) * 180) / Math.PI}));
  items.push(...beetleItems(B, R));
  const cut = cutawayItem(B, R, t, cutAmount(t), ns);
  if (cut) items.push(cut);
  items.push(...antItems(B, A));
  items.push(...sprayItems(B, t, ns));
  return (
    <>
      <Env B={B} focus={camOrbit(t).d} ns={ns} />
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <SprayDefs ns={ns} />
        <Items items={items} />
      </svg>
    </>
  );
};

export const Hook: React.FC<HookProps> = (props) => (
  <HookFrame hook="05" W={WORDS as Words} bg="#4A4A3C" capY={[1560, 1560]} props={props}>
    {(t) => <Scene t={t} />}
  </HookFrame>
);
