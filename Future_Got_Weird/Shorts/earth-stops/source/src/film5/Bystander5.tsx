import React from 'react';
import {C, H, W} from '../theme';
import {CAST} from '../components/cast';
import {CharacterSide, SidePose} from '../v2/side';
import {GSY, SC} from '../v2/choreo2';
import {crom} from './Opening5';

/**
 * V5: one more adult in the wind shot (f197-233). The approved "regular person" of the cast (CAST.person: bob hair, light-blue shirt, brown trousers; no glasses or bun, so she/he cannot be mistaken
 * for the opening woman) is caught by the same wind: he enters from the left in the middle ground already off the pavement, is carried east faster than the camera is tracking, flails (arms and legs
 * lag the torso, the shirt tail whips behind him), is a clear human silhouette for ~0.9 s and leaves the frame on the right before the awning tears (f236) and takes over the shot.
 * The rig is the same side rig as the opening woman; no new artwork other than the shirt tail. His fate is not shown. Pure functions + one layer; drawn inside P3, behind the foreground post.
 */
export const BYS = {a: 197, b: 234, x0: -90, vx: 52, sc: SC * 1.08 * 0.96, hh: 206};
export const BYS_LOOK = {...CAST.person, overlayColor: CAST.person.shirt};
type K = {u: number; lean: number; head: number; an: [number, number]; af: [number, number]; ln: [number, number, number]; lf: [number, number, number]; ms: number; brows: number; lookY: number};
const KEYS: K[] = [
  {u: -1, lean: 50, head: 2, an: [98, 30], af: [128, 14], ln: [-52, 36, -20], lf: [-34, 66, -26], ms: 1.1, brows: 0.9, lookY: 0.2},
  {u: 6, lean: 58, head: 14, an: [116, 20], af: [146, 8], ln: [-64, 46, -26], lf: [-48, 74, -30], ms: 1.3, brows: 1, lookY: 0.1},
  {u: 14, lean: 62, head: 10, an: [104, 46], af: [154, 18], ln: [-74, 30, -28], lf: [-58, 62, -26], ms: 1.4, brows: 1, lookY: 0},
  {u: 22, lean: 60, head: 16, an: [122, 26], af: [140, 34], ln: [-66, 52, -24], lf: [-78, 40, -30], ms: 1.4, brows: 1, lookY: 0.05},
  {u: 30, lean: 56, head: 12, an: [110, 40], af: [150, 14], ln: [-70, 36, -26], lf: [-52, 70, -28], ms: 1.35, brows: 1, lookY: 0},
  {u: 38, lean: 58, head: 12, an: [114, 30], af: [146, 16], ln: [-66, 44, -26], lf: [-60, 56, -28], ms: 1.35, brows: 1, lookY: 0},
];
const US = KEYS.map((k) => k.u);
const chn = (g: (k: K) => number) => KEYS.map(g);
const CH = {lean: chn((k) => k.lean), head: chn((k) => k.head), ans: chn((k) => k.an[0]), ane: chn((k) => k.an[1]), afs: chn((k) => k.af[0]), afe: chn((k) => k.af[1]),
  lnh: chn((k) => k.ln[0]), lnk: chn((k) => k.ln[1]), lnf: chn((k) => k.ln[2]), lfh: chn((k) => k.lf[0]), lfk: chn((k) => k.lf[1]), lff: chn((k) => k.lf[2]), ms: chn((k) => k.ms), brows: chn((k) => k.brows), lookY: chn((k) => k.lookY)};
const at = (a: number[], u: number) => crom(US, a, u);
/** the acting at frame f: the key poses plus an involuntary flail (the limbs oscillate out of phase and lag the torso) */
export const bysPose = (f: number): SidePose => {
  const u = f - 198, fl = Math.sin(u * 0.55), fl2 = Math.sin(u * 0.55 + 1.3), lag = (g: number[], d: number) => at(g, u - d);
  return {
    lean: at(CH.lean, u) + 2.5 * Math.sin(u * 0.5), head: at(CH.head, u) - 3 * fl,
    armN: {s: lag(CH.ans, 2) + 8 * fl, e: lag(CH.ane, 2) + 6 * fl2}, armF: {s: lag(CH.afs, 3) - 7 * fl2, e: lag(CH.afe, 3)},
    legN: {h: lag(CH.lnh, 3) + 6 * fl2, k: lag(CH.lnk, 3), f: at(CH.lnf, u)}, legF: {h: lag(CH.lfh, 4) - 6 * fl, k: lag(CH.lfk, 4), f: at(CH.lff, u)},
    mouth: 'o', mouthScale: at(CH.ms, u), brows: at(CH.brows, u), lookX: 1, lookY: at(CH.lookY, u), squint: Math.max(0, Math.min(0.5, (u - 12) / 30)),
  };
};
export const bysX = (f: number) => BYS.x0 + BYS.vx * (f - 198);
/** height of the body above the pavement (px at this scale): already off it at entry, a gentle arc */
export const bysLift = (f: number) => { const t = f - 198; return 26 + 5.5 * t - 0.17 * t * t; };
export const bysHip = (f: number) => ({x: bysX(f), y: GSY - 26 - BYS.hh - bysLift(f)});
export const bysVisible = (f: number) => f >= BYS.a && f <= BYS.b;

export const Bystander: React.FC<{f: number}> = ({f}) => {
  if (!bysVisible(f)) return null;
  const hip = bysHip(f), pose = bysPose(f), sc = BYS.sc, lift = bysLift(f);
  const u = f - 198;
  // the shirt tail: a short flap of the same fabric whipping out behind the waist, a few frames behind the body
  const tail = Array.from({length: 6}).map((_, i) => ({x: hip.x - (14 + 20 * i) * sc * 0.9, y: hip.y - 40 * sc + (4 * i + 9 * Math.sin(u * 0.9 - i * 0.8) * (1 + i * 0.25)) * sc}));
  const shirtTail = (
    <g>
      <path d={`M ${hip.x - 10 * sc} ${hip.y - 70 * sc} L ${tail.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${tail[tail.length - 1].x + 4 * sc} ${tail[tail.length - 1].y + 50 * sc} L ${hip.x - 6 * sc} ${hip.y - 8 * sc} Z`} fill={BYS_LOOK.shirt} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <ellipse cx={hip.x + 20} cy={GSY - 20} rx={Math.max(48, 108 - lift * 0.45)} ry={10} fill={C.shadow} opacity={Math.max(0.25, 0.9 - lift / 170)} />
      </svg>
      <CharacterSide pose={pose} hip={hip} sc={sc} look={BYS_LOOK} scarf={shirtTail} />
    </div>
  );
};
