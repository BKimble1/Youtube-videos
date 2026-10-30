// What the viewer is looking at. Every shot that stands in for real footage carries a conspicuous source-footage
// slot tag (and viewfinder corners); every explanatory shot carries an illustration tag. Not burned-in captions.
import React from 'react';
import {H, pr, W} from '../lib/core';
import {BT, TT} from '../lib/timeline';

const tt = TT;
type Seg = {a: number; b: number; kind: 'slot' | 'illus'; id?: string; text: string};
export const SEGMENTS: Seg[] = [
  // FS-1 is cut into the five beats the real demonstration clip has to cover (production/FOOTAGE_EDIT_PLAN.md)
  {a: 0, b: tt.realFootage, kind: 'slot', id: 'FS-1a', text: 'chainsaw already in the wood'},
  {a: tt.realFootage, b: tt.grabs, kind: 'slot', id: 'FS-1b', text: 'the claw holding the branch'},
  {a: tt.grabs, b: tt.through1 + 0.42, kind: 'slot', id: 'FS-1c', text: 'the saw continuing through the cut'},
  {a: tt.through1 + 0.42, b: tt.important, kind: 'slot', id: 'FS-1d', text: 'the piece separating, still held by the claw'},
  {a: tt.important, b: tt.rest, kind: 'slot', id: 'FS-1e', text: 'wider: both tools on the machine (+ illustrated hazard overlay)'},
  {a: tt.rest, b: tt.cabin, kind: 'slot', id: 'FS-2', text: 'same machine: torso, boom, vehicle, cabin'},
  {a: tt.cabin, b: tt.looks, kind: 'illus', text: 'Illustrative reconstruction of the cabin'},
  {a: tt.looks, b: tt.another, kind: 'slot', id: 'FS-3', text: 'grip, cut, weight into the claw, lift clear'},
  {a: tt.another, b: tt.imagine, kind: 'illus', text: "Illustration · principle as documented for JR West's related machine (2024), not this machine's parts"},
  {a: tt.imagine, b: tt.stunt, kind: 'illus', text: 'Illustration'},
  {a: tt.stunt, b: tt.reason, kind: 'illus', text: 'Illustration · a generic electrified line'},
  {a: tt.reason, b: tt.still, kind: 'illus', text: 'Illustration · not to scale'},
  {a: tt.still, b: tt.japan2, kind: 'slot', id: 'FS-4', text: 'the saw switched off, down the boom to the cabin'},
  {a: tt.japan2, b: BT.endCut, kind: 'illus', text: 'Illustrative reconstruction of the cabin'},
  {a: BT.endCut, b: tt.dur + 1, kind: 'slot', id: 'FS-4', text: 'claw closes, saw swings in and cuts, pull back to the operator'},
];
export const segAt = (t: number) => SEGMENTS.find((s) => t >= s.a && t < s.b) ?? SEGMENTS[SEGMENTS.length - 1];

export const Overlay: React.FC<{t: number}> = ({t}) => {
  const s = segAt(t);
  if (s.kind === 'slot') {
    const c = 56;
    const m = 30;
    return (
      <g>
        <g stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.85}>
          <path d={`M${m} ${m + c} L${m} ${m} L${m + c} ${m}`} />
          <path d={`M${W - m - c} ${m} L${W - m} ${m} L${W - m} ${m + c}`} />
          <path d={`M${m} ${H - m - c} L${m} ${H - m} L${m + c} ${H - m}`} />
          <path d={`M${W - m - c} ${H - m} L${W - m} ${H - m} L${W - m} ${H - m - c}`} />
        </g>
        <g transform="translate(58 52)">
          <rect x={0} y={0} width={Math.max(860, 170 + (s.text.length + 22) * 10.6)} height={78} rx={14} fill="#101820" opacity={0.82} />
          <rect x={12} y={12} width={128} height={54} rx={9} fill="#EE7A26" />
          <text x={76} y={50} textAnchor="middle" fill="#FFFFFF" style={{font: '900 28px "Nunito Variable"'}}>PREVIS</text>
          <text x={156} y={34} fill="#FFFFFF" style={{font: '800 22px "Nunito Variable"'}}>{`Slot ${s.id} for licensed source footage · rights not cleared`}</text>
          <text x={156} y={62} fill="#C9D6E0" style={{font: '700 21px "Nunito Variable"'}}>{`Illustrated stand-in: ${s.text}`}</text>
        </g>
      </g>
    );
  }
  const o = 0.9;
  return (
    <g transform="translate(40 40)" opacity={o}>
      <rect x={0} y={0} width={s.text.length * 11.5 + 36} height={44} rx={22} fill="#101820" opacity={0.6} />
      <text x={18} y={30} fill="#FFFFFF" style={{font: '800 21px "Nunito Variable"'}}>{s.text}</text>
    </g>
  );
};
export {pr};
