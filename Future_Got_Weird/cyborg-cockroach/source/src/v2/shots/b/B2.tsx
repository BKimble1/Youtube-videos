// B2 (187-208, "launcher onto a"): the tight mechanical profile of the module just fitted in B1 (az 0, el 8, 25 px/mm),
// reached by B1's push, which is still settling over the cut (the same camera: b/B1.tsx `bbView`), so the module keeps
// its screen position and size across the cut. The saddle and the green board seated on the shell, the two tube
// clamps, the stimulation wires down the shield to the antenna base and back to the cercus, the clear launch tube with
// its compressed spring. The insect breathes, its antennae search, its legs are planted; then it takes its first step
// (B_GO) and the push turns into a lateral track forward with it along the tube: the spring, the loaded auto-injector
// (amber dose, grey plunger), the collar, the latch line through the mouth with its nichrome coil, the needle just
// behind the mouth, over the head. Still travelling at the cut.
import React from 'react';
import {ShotProps} from '../index2';
import {BenchScene} from './B1';

export const B2: React.FC<ShotProps> = ({f}) => <BenchScene f={f} id={`b2f${f}`} />;
