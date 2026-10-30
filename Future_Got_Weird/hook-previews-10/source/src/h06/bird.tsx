// A European robin in profile, facing right (bird-local units: feet on the twig at (0, 0), y down, about 300 units
// from bill tip to tail tip). House vector style: one ink contour around the silhouette (tail, body and head merged),
// gradient shading, folded wing over the side, two legs (feathered tibia, bare tarsus, three forward toes and a hind
// toe gripping the twig). It hops (wings stay folded), turns its head and blinks; it never attacks.
import React from 'react';
import {closedPath, clamp, openPath, ring, ss} from '../shared/lib';
import {lit, mix, shade} from '../shared/color';
import {INK, Inked, InkPath} from '../shared/ink';
import {add, P, V} from './geo';

const BROWN = '#7E6B4B';
const ORANGE = '#E2753A';
const GREY = '#A4ADB2';
const BELLY = '#F1ECE1';
const LEG = '#8E6D5C';
const f2 = (n: number) => n.toFixed(2);

// upright perched posture: plump body tilted head-up, tail angled down and back
const BODY: P[] = [V(14, -156), V(40, -146), V(58, -128), V(66, -104), V(64, -80), V(54, -58), V(36, -42), V(12, -34), V(-14, -36), V(-36, -48), V(-52, -66), V(-60, -90), V(-58, -114), V(-46, -136), V(-24, -152)];
const TAIL: P[] = [V(-42, -62), V(-70, -42), V(-100, -16), V(-109, -8), V(-101, -1), V(-66, -27), V(-32, -46)];
const WING: P[] = [V(26, -136), V(4, -146), V(-26, -140), V(-50, -120), V(-66, -94), V(-82, -64), V(-92, -44), V(-85, -40), V(-62, -57), V(-38, -74), V(-12, -92), V(10, -108), V(24, -122)];
const NECK = V(24, -140);

export type RobinPose = {crouch: number; air: number; feet: 'ground' | 'tucked'; head: number; pitch: number; blink: number; tail: number};

/** two-bone leg: hip -> ankle (bends backward) -> foot */
const leg = (hip: P, foot: P, l1: number, l2: number): P => {
  const dx = foot.x - hip.x, dy = foot.y - hip.y;
  const d = Math.min(l1 + l2 - 0.01, Math.hypot(dx, dy));
  const a = Math.atan2(dy, dx);
  const b = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const ang = a + b; // bend to the back (ankle points backward, toward -x)
  return V(hip.x + l1 * Math.cos(ang), hip.y + l1 * Math.sin(ang));
};

const Leg: React.FC<{hip: P; foot: P; tucked: number; far?: boolean}> = ({hip, foot, tucked, far}) => {
  const k = leg(hip, foot, 24, 34);
  const col = far ? shade(LEG, 0.35) : LEG;
  const curl = tucked;
  const toe = (dx: number, dy: number) => V(foot.x + dx * (1 - curl * 0.5), foot.y + dy + curl * Math.abs(dx) * 0.45);
  const toes = [toe(17, 1.5), toe(12, 3.5), toe(-10, 1.5)];
  return (
    <g>
      <path d={`M${f2(hip.x)},${f2(hip.y)} L${f2(k.x)},${f2(k.y)}`} stroke={far ? shade(BROWN, 0.3) : BROWN} strokeWidth={9} strokeLinecap="round" />
      <path d={`M${f2(k.x)},${f2(k.y)} L${f2(foot.x)},${f2(foot.y)}`} stroke={INK} strokeWidth={5.6} strokeLinecap="round" />
      <path d={`M${f2(k.x)},${f2(k.y)} L${f2(foot.x)},${f2(foot.y)}`} stroke={col} strokeWidth={3.4} strokeLinecap="round" />
      {toes.map((p, i) => (
        <g key={i}>
          <path d={`M${f2(foot.x)},${f2(foot.y)} L${f2(p.x)},${f2(p.y)}`} stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
          <path d={`M${f2(foot.x)},${f2(foot.y)} L${f2(p.x)},${f2(p.y)}`} stroke={col} strokeWidth={2.4} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};

export const Robin: React.FC<{pose: RobinPose; id: string}> = ({pose, id}) => {
  const lift = -12 + pose.crouch * 9; // body above the feet
  const bodyTf = `translate(0 ${f2(lift + pose.air)}) rotate(${f2(pose.pitch)} 0 -80)`;
  const headTf = `rotate(${f2(pose.head)} ${NECK.x} ${NECK.y})`;
  const tailTf = `rotate(${f2(pose.tail)} -40 -58)`;
  const tucked = pose.feet === 'tucked' ? 1 : 0;
  // hips in body frame -> bird frame
  const pr = (pose.pitch * Math.PI) / 180;
  const toBird = (p: P) => {
    const x = p.x, y = p.y + 80;
    return V(x * Math.cos(pr) - y * Math.sin(pr), -80 + x * Math.sin(pr) + y * Math.cos(pr) + lift + pose.air);
  };
  const hipN = toBird(V(8, -44)), hipF = toBird(V(-8, -46));
  const footN = tucked ? add(hipN, V(-14, 34)) : V(8, 0);
  const footF = tucked ? add(hipF, V(-18, 32)) : V(-9, -1);
  const bodyD = closedPath(BODY, 1);
  const headD = `M10,-161 a30,28 0 1,0 60,0 a30,28 0 1,0 -60,0Z`;
  const tailD = closedPath(TAIL, 0.6);
  const wingD = closedPath(WING, 0.85);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-b`} gradientUnits="userSpaceOnUse" x1="-50" y1="-160" x2="40" y2="-30">
          <stop offset="0" stopColor={lit(BROWN, 0.22)} />
          <stop offset="0.55" stopColor={BROWN} />
          <stop offset="1" stopColor={shade(BROWN, 0.4)} />
        </linearGradient>
        <linearGradient id={`${id}-o`} gradientUnits="userSpaceOnUse" x1="20" y1="-180" x2="70" y2="-50">
          <stop offset="0" stopColor={lit(ORANGE, 0.22)} />
          <stop offset="0.6" stopColor={ORANGE} />
          <stop offset="1" stopColor={shade(ORANGE, 0.3)} />
        </linearGradient>
        <linearGradient id={`${id}-w`} gradientUnits="userSpaceOnUse" x1="0" y1="-140" x2="-70" y2="-50">
          <stop offset="0" stopColor={lit(BROWN, 0.12)} />
          <stop offset="1" stopColor={shade(BROWN, 0.32)} />
        </linearGradient>
        <clipPath id={`${id}-cb`}><path d={bodyD} /></clipPath>
        <clipPath id={`${id}-ch`}><path d={headD} /></clipPath>
      </defs>
      {/* far leg behind the body */}
      <Leg hip={hipF} foot={footF} tucked={tucked} far />
      <g transform={bodyTf}>
        <Inked w={3}>
          <g transform={tailTf}><InkPath d={tailD} fill={`url(#${id}-b)`} /></g>
          <InkPath d={bodyD} fill={`url(#${id}-b)`} />
          <g transform={headTf}><InkPath d={headD} fill={`url(#${id}-b)`} /></g>
        </Inked>
        {/* tail feather lines */}
        <g transform={tailTf}>
          <path d="M-44,-56 L-104,-8 M-40,-50 L-100,-3" stroke={shade(BROWN, 0.45)} strokeWidth={1.2} opacity={0.6} />
        </g>
        {/* white belly, orange breast with its blue-grey border */}
        <g clipPath={`url(#${id}-cb)`}>
          <path d="M-46,-30 C-14,-26 30,-34 52,-58 L80,-20 L-46,10Z" fill={BELLY} />
          <path d="M-40,-38 C-8,-30 26,-40 46,-60" fill="none" stroke={mix(BELLY, BROWN, 0.25)} strokeWidth={3} opacity={0.45} />
          <path d="M20,-160 C52,-152 72,-126 70,-92 C68,-70 58,-54 44,-44 C32,-62 18,-90 10,-120 C8,-136 12,-152 20,-160Z" fill={`url(#${id}-o)`} />
          <path d="M12,-156 C4,-132 12,-98 34,-52" fill="none" stroke={GREY} strokeWidth={6} opacity={0.85} />
          <ellipse cx={46} cy={-112} rx={12} ry={26} fill="#FFE2C4" opacity={0.18} transform="rotate(-20 46 -112)" />
        </g>
        {/* folded wing: coverts, faint wing bar, tertials and primaries over the tail base */}
        <path d={wingD} fill={`url(#${id}-w)`} />
        {/* the wing's top edge tucks under the scapulars: only the primaries' tips and the lower edge are inked */}
        <path d={openPath([WING[3], WING[4], WING[5], WING[6], WING[7], WING[8], WING[9], WING[10], WING[11], WING[12]], 0.85)} fill="none" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M20,-130 C0,-134 -28,-122 -44,-104" fill="none" stroke={lit(BROWN, 0.3)} strokeWidth={2} opacity={0.7} />
        <path d="M14,-114 C-6,-112 -30,-98 -48,-80" fill="none" stroke="#D9C79E" strokeWidth={1.8} opacity={0.6} />
        {[0, 1, 2, 3, 4].map((k) => (
          <path key={k} d={`M${-30 - k * 6},${-84 + k * 2} L${-78 - k * 3},${-50 + k * 1.2}`} stroke={shade(BROWN, 0.5)} strokeWidth={1.2} opacity={0.55} />
        ))}
        <path d="M-20,-80 C-40,-70 -62,-58 -84,-46" fill="none" stroke="#C9B48C" strokeWidth={1.4} opacity={0.5} />
        {/* head details (they turn with the head) */}
        <g transform={headTf}>
          <g clipPath={`url(#${id}-ch)`}>
            <path d="M70,-166 C68,-180 56,-191 41,-190 C28,-189 18,-178 14,-164 C12,-152 16,-142 22,-136 L54,-138 C66,-144 72,-154 70,-166Z" fill={`url(#${id}-o)`} />
            <path d="M41,-191 C27,-189 17,-177 13,-163 C11,-150 16,-140 22,-134" fill="none" stroke={GREY} strokeWidth={5} opacity={0.8} />
            <ellipse cx={30} cy={-180} rx={24} ry={7} fill="#FFF6EA" opacity={0.16} />
          </g>
          {/* bill: thin, dark, pointed */}
          <path d="M65,-169 Q80,-167 95,-158 L65,-157Z" fill="#2B2724" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
          <path d="M65,-157 L93,-157 Q79,-151 65,-151Z" fill="#4A3E36" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
          <path d="M67,-165 Q78,-164 88,-160" fill="none" stroke="#6A5E56" strokeWidth={1} opacity={0.8} />
          {/* eye: large and dark, a faint pale eye-ring, catchlight; the blink closes it */}
          <circle cx={50} cy={-166} r={8.4} fill="#D9C9AE" opacity={0.75} />
          <circle cx={50} cy={-166} r={7.2} fill="#0E0D0C" />
          <circle cx={47.8} cy={-168.6} r={2.2} fill="#FFFFFF" opacity={0.9} />
          <circle cx={52.6} cy={-163} r={0.9} fill="#FFFFFF" opacity={0.5} />
          {pose.blink > 0.02 && <path d={`M41,-167 A9,9 0 0,1 59,-167 L59,${f2(-175 + 17 * pose.blink)} L41,${f2(-175 + 17 * pose.blink)}Z`} fill={ORANGE} stroke={INK} strokeWidth={0.8} />}
        </g>
      </g>
      {/* near leg in front */}
      <Leg hip={hipN} foot={footN} tucked={tucked} />
    </g>
  );
};

/** robin pose and position along the twig over time (design px for x) */
export const robinState = (t: number, hops: {t0: number; x0: number; x1: number}[], dur: number, notice: number, blinkT: number) => {
  let x = hops[0].x0, air = 0, tucked = false;
  let crouch = 0;
  for (const h of hops) {
    if (t >= h.t0 + dur) x = h.x1;
    else if (t >= h.t0) {
      const u = (t - h.t0) / dur;
      x = h.x0 + (h.x1 - h.x0) * (u * u * (3 - 2 * u));
      air = -40 * 4 * u * (1 - u);
      tucked = u > 0.12 && u < 0.88;
    }
    // pre-hop crouch and landing compression
    crouch += ss(t, h.t0 - 0.12, h.t0 - 0.02) * (1 - ss(t, h.t0, h.t0 + 0.06));
    crouch += Math.max(0, ring(t, h.t0 + dur, 3.2, 0.12)) * 1.2;
  }
  // head: level and alert, quick small saccades; at "notice" it turns down toward the eyestalk (overshoot, settle)
  const idle = 4 * Math.sin(t * 2.6) * (1 - ss(t, notice, notice + 0.2)) - 6;
  const look = ss(t, notice, notice + 0.22) * 30 + ring(t, notice + 0.22, 2.2, 0.18) * 5;
  const after = ss(t, notice + 0.6, notice + 0.9) * 3 * Math.sin((t - notice) * 7);
  const head = idle + look + after;
  const pitch = ss(t, notice + 0.1, notice + 0.4) * 8 + ss(t, 5.72, 6.1) * 7 - air * 0.08;
  const bl = clamp(1 - Math.abs(t - blinkT) / 0.07);
  const tail = 10 * ring(t, hops[hops.length - 1].t0 + dur, 2.6, 0.15) + 6 * ring(t, hops[1].t0 + dur, 2.6, 0.15) - air * 0.12;
  return {x, pose: {crouch: Math.min(1.1, crouch), air, feet: tucked ? 'tucked' : 'ground', head, pitch, blink: bl, tail} as RobinPose};
};
