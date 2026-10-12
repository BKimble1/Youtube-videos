import React from 'react';
import {C, H, W} from '../theme';
import {rand} from '../lib/anim';
import {CharacterSide, SidePose, sideFK} from '../v2/side';
import {MugSide} from '../v2/props';
import {SC} from '../v2/choreo2';
import {blendPose} from '../v2/choreoEC';
import {Chip, ScarfHang, WALKP, popScale, ramp, sm} from './ui';
import {T} from './timeline';

/**
 * B06, V2: the coffee payoff. She walks calmly with her mug (same cast member, same side view, big), the world streaks past behind her, a single restrained annotation
 * ("EQUATOR ~1,000 MPH"), then she takes a sip and nothing spills ("The motion is real."). The streaks are a frame-of-reference device, not a measurement.
 */
export const CLOSE_SC = 2.85;
export const CLOSE_HIP = {x: 300, y: 1483};
export const P2 = {chip: T.payA + 12, chipOff: T.sipA - 8, sk0: T.payA, sk1: T.payA + 26, sipA: T.sipA, sipUp: T.sipUp, sipDown: T.sipDown, sipEnd: T.sipEnd};
const SIP: SidePose = {lean: 1, head: -9, armN: {s: 50, e: 112}, armF: {s: 8, e: 14}, legN: {h: 4, k: 2, f: 0}, legF: {h: -4, k: 2, f: 0}, mouth: 'smile', brows: 0, lookY: 0.1};
const stars = Array.from({length: 40}).map((_, i) => ({x: rand(i) * W, y: rand(i + 90) * H, r: 2 + rand(i + 30) * 3}));
/** she keeps walking in place until the sip; during the sip her legs settle to a stand, afterwards she stands and smiles */
export const payPose = (f: number): SidePose => {
  const up = sm((f - P2.sipA) / (P2.sipUp - P2.sipA)), down = sm((f - P2.sipDown) / (P2.sipEnd - P2.sipDown));
  const k = Math.max(0, up - down);
  const still = {...WALKP(P2.sipA), armF: {s: 8, e: 10}};
  return blendPose(blendPose(WALKP(f), still, k), SIP, k);
};
export const payMug = (f: number) => { const up = sm((f - P2.sipA) / (P2.sipUp - P2.sipA)), down = sm((f - P2.sipDown) / (P2.sipEnd - P2.sipDown)); return -62 * Math.max(0, up - down); };
export const payHip = (f: number) => ({x: CLOSE_HIP.x, y: CLOSE_HIP.y - 7 * Math.abs(Math.sin(((f - 6) / 30) * Math.PI)) * (1 - Math.max(0, sm((f - P2.sipA) / (P2.sipUp - P2.sipA)) - sm((f - P2.sipDown) / (P2.sipEnd - P2.sipDown))))});
export const speedK = (f: number) => ramp(f, P2.sk0, P2.sk1, (x) => x);

export const Payoff2: React.FC<{f: number; graphics: boolean}> = ({f, graphics}) => {
  const hip = payHip(f), pose = payPose(f), fk = sideFK(pose, hip, CLOSE_SC);
  const sk = speedK(f);
  const streaks = Array.from({length: 26}).map((_, i) => {
    const y0 = 120 + rand(i + 5) * 1700, y = y0 > 395 && y0 < 610 ? y0 + 230 : y0, len = 220 + rand(i + 9) * 520, v = 70 + rand(i + 21) * 90, wd = 5 + rand(i + 44) * 9;
    const x = W + 400 - (((f - P2.sk0) * v * (0.4 + 0.6 * sk) + rand(i + 60) * (W + 1000)) % (W + 1000));
    return <line key={i} x1={x} y1={y} x2={x + len} y2={y} stroke={i % 3 === 0 ? C.saffronLight : C.cream} strokeWidth={wd} strokeLinecap="round" opacity={0.18 + 0.62 * sk} />;
  });
  const chip = popScale(f, P2.chip) * (1 - ramp(f, P2.chipOff, P2.chipOff + 6, (x) => x));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs><linearGradient id="spaceG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.ink} /><stop offset="1" stopColor={C.tealDeep} /></linearGradient></defs>
        <rect x={-3000} y={-3000} width={W + 6000} height={H + 6000} fill="url(#spaceG2)" />
        {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={C.cream} opacity={0.35 + 0.4 * sk} />)}
        {streaks}
        <ellipse cx={CLOSE_HIP.x + 40} cy={1900} rx={330} ry={40} fill={C.ink} opacity={0.35} />
      </svg>
      <CharacterSide pose={pose} hip={hip} sc={CLOSE_SC} scarfWrap scarf={<ScarfHang n={fk.N} z={CLOSE_SC / SC} sway={f * 0.1} />} holdN={<MugSide tilt={payMug(f)} sc={CLOSE_SC} />} />
      {graphics && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <Chip x={775} y={965} w={440} text="EQUATOR ~1,000 MPH" tone="move" arrow scale={chip} />
        </svg>
      )}
    </div>
  );
};
