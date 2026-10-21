// One original fictional scientist (no real likeness), drawn in the FGW flat 2D style. Three views of the same
// design: a 3/4 front close view facing right (reaction inserts and the foreground of bench shots), a 3/4 rear view
// (over the shoulder at the monitor), and a small full figure standing at the workstation for wide shots.
// Acting comes only from gaze, brows, eye openness, a small backward lean and the hand tightening on the desk edge.
// V6 adds a startle channel: shoulders rise, the head snaps a little back and up, eyes widen, brows lift.
import React from 'react';

export const SCI = {
  skin: '#B97A56', skinDark: '#94603F', skinLight: '#D49A74',
  hair: '#2A1E17', hair2: '#3B2A20',
  coat: '#EEF2F5', coatShade: '#C7D0D8', coatLine: '#9AA6B0',
  shirt: '#2D7F86', trousers: '#2B3440', shoe: '#1A1F25',
  eyeWhite: '#F7F7F2', iris: '#3A2618', brow: '#2A1E17', lip: '#8C4B3A',
};

export type Acting = {
  gx: number; // gaze x (-1 left .. 1 right)
  gy: number; // gaze y (-1 up .. 1 down)
  brow: number; // 0 neutral .. 1 raised and knitted (worry)
  open: number; // eye openness 0 closed .. 1 normal .. 1.35 wide
  lean: number; // 0 .. 1 small backward lean
  grip: number; // 0 relaxed .. 1 fingers tight on the desk edge
  mouth: number; // 0 closed tense line .. 1 small open
  startle?: number; // 0 .. 1: shoulders up, head back and up (a quick flinch)
};
export const NEUTRAL: Acting = {gx: 0.6, gy: 0.2, brow: 0.2, open: 1, lean: 0, grip: 0.2, mouth: 0};

const Eye: React.FC<{x: number; y: number; w: number; a: Acting; near: boolean}> = ({x, y, w, a, near}) => {
  const h = w * 0.62 * Math.max(0.08, a.open);
  const px = Math.max(-1, Math.min(1, a.gx)) * w * 0.32, py = Math.max(-1, Math.min(1, a.gy)) * h * 0.3;
  const id = `sci-eye-${near ? 'n' : 'f'}-${Math.round(x)}`;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <ellipse cx={x} cy={y} rx={w} ry={h} />
        </clipPath>
      </defs>
      <ellipse cx={x} cy={y} rx={w} ry={h} fill={SCI.eyeWhite} />
      <g clipPath={`url(#${id})`}>
        <circle cx={x + px} cy={y + py} r={w * 0.5} fill={SCI.iris} />
        <circle cx={x + px} cy={y + py} r={w * 0.26} fill="#0E0906" />
        <circle cx={x + px + w * 0.18} cy={y + py - w * 0.18} r={w * 0.12} fill="#FFFFFF" />
      </g>
      {/* upper lid line */}
      <path d={`M ${x - w * 1.05} ${y} Q ${x} ${y - h * 1.35} ${x + w * 1.05} ${y}`} stroke={SCI.hair} strokeWidth={w * 0.16} fill="none" strokeLinecap="round" />
    </g>
  );
};

// 3/4 front, facing right. Origin at the centre of the head; units ~ head radius 110.
export const SciFront: React.FC<{a: Acting; showHand?: boolean}> = ({a, showHand = true}) => {
  const st = a.startle ?? 0;
  const leanRot = -6 * a.lean, leanX = -18 * a.lean;
  const liftY = -18 * st; // shoulders rise with the flinch
  const head = `translate(${-13 * st} ${-3 * st}) rotate(${-6 * st} 20 150)`; // head snaps a little back and up, about the neck
  const browLift = 18 * a.brow;
  const curl = a.grip;
  return (
    <g>
      <g transform={`translate(${leanX} ${liftY}) rotate(${leanRot} 0 520)`}>
        {/* coat and shoulders */}
        <path d="M -230 620 C -230 380 -170 240 -40 220 L 70 220 C 190 240 250 380 250 620 Z" fill={SCI.coat} stroke={SCI.coatLine} strokeWidth={3} />
        <path d="M -40 222 L 18 330 L 70 222 Z" fill={SCI.shirt} />
        <path d="M -40 222 L 0 380 L -70 620" stroke={SCI.coatLine} strokeWidth={4} fill="none" />
        <path d="M 70 222 L 36 380 L 110 620" stroke={SCI.coatLine} strokeWidth={4} fill="none" />
        <path d="M -200 600 C -190 450 -150 330 -90 260" stroke={SCI.coatShade} strokeWidth={26} fill="none" opacity={0.6} />
        {/* neck */}
        <path d="M -30 110 L -30 230 L 60 230 L 64 110 Z" fill={SCI.skinDark} />
        <g transform={head}>
        {/* hair behind */}
        <path d="M -120 -10 C -140 -120 -60 -170 20 -160 C 100 -150 130 -80 118 -20 L 100 40 L -110 60 Z" fill={SCI.hair} />
        {/* head (turned 3/4 to the right) */}
        <path d="M -98 -40 C -100 -120 -30 -150 30 -146 C 100 -140 126 -80 122 -10 C 120 50 104 110 60 140 C 30 160 -20 158 -60 130 C -96 100 -100 40 -98 -40 Z" fill={SCI.skin} stroke={SCI.skinDark} strokeWidth={3} />
        {/* ear (far side of the turn, at left) */}
        <path d="M -98 -6 C -122 -12 -126 34 -100 42" fill={SCI.skin} stroke={SCI.skinDark} strokeWidth={3} />
        {/* hair cap with a side part */}
        <path d="M -104 -30 C -110 -120 -40 -162 34 -156 C 104 -150 132 -96 124 -40 C 96 -84 40 -100 -6 -96 C -40 -94 -70 -70 -104 -30 Z" fill={SCI.hair2} />
        <path d="M -6 -96 C 30 -120 80 -120 110 -86" stroke={SCI.hair} strokeWidth={6} fill="none" />
        {/* brows: inner ends (toward the nose, right) rise with worry */}
        <path d={`M -42 ${-50 - browLift * 0.4} Q -18 ${-60 - browLift * 0.7} 8 ${-52 - browLift * 1.4}`} stroke={SCI.brow} strokeWidth={9} strokeLinecap="round" fill="none" />
        <path d={`M 42 ${-54 - browLift * 1.4} Q 70 ${-64 - browLift * 0.8} 96 ${-56 - browLift * 0.3}`} stroke={SCI.brow} strokeWidth={10} strokeLinecap="round" fill="none" />
        {/* eyes: far (smaller) and near */}
        <Eye x={-16} y={-22} w={17} a={a} near={false} />
        <Eye x={70} y={-24} w={21} a={a} near />
        {/* nose */}
        <path d="M 48 -14 L 66 42 Q 56 50 42 46" stroke={SCI.skinDark} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* mouth: tense line, a little open in surprise */}
        {a.mouth > 0.05 ? (
          <ellipse cx={46} cy={86} rx={18} ry={4 + 8 * a.mouth} fill={SCI.lip} />
        ) : (
          <path d="M 26 86 Q 46 82 66 87" stroke={SCI.lip} strokeWidth={6} strokeLinecap="round" fill="none" />
        )}
        <path d="M -60 130 C -20 150 30 150 60 140" stroke={SCI.skinDark} strokeWidth={3} fill="none" opacity={0.4} />
        </g>
      </g>
      {/* desk-edge hand (drawn over the coat; stays on the desk while the body leans) */}
      {showHand && (
        <g transform="translate(150 560)">
          <path d={`M ${25 + leanX} ${-240 + liftY} C 66 -168 38 -84 0 -20`} stroke={SCI.coatLine} strokeWidth={76} strokeLinecap="round" fill="none" />
          <path d={`M ${25 + leanX} ${-240 + liftY} C 66 -168 38 -84 0 -20`} stroke={SCI.coat} strokeWidth={70} strokeLinecap="round" fill="none" />
          <path d="M 6 -206 C 40 -150 20 -86 -14 -40" stroke={SCI.coatShade} strokeWidth={10} fill="none" opacity={0.7} />
          <rect x={-34} y={-30} width={64} height={30} rx={10} fill={SCI.coat} stroke={SCI.coatLine} strokeWidth={2} />
          {/* hand over the edge: knuckles whiten and fingers curl as the grip tightens */}
          <path d="M -30 -4 C -30 -36 34 -40 44 -6 L 44 6 L -30 6 Z" fill={SCI.skin} stroke={SCI.skinDark} strokeWidth={3} />
          {[-18, 0, 18, 34].map((fx, i) => (
            <g key={i}>
              <path d={`M ${fx - 7} 4 q 2 ${18 + 10 * curl} ${7} ${22 + 12 * curl} q 6 ${-4 - 4 * curl} 6 ${-22 - 10 * curl}`} fill={SCI.skin} stroke={SCI.skinDark} strokeWidth={2.5} />
              <circle cx={fx} cy={-8} r={4} fill={curl > 0.6 ? SCI.skinLight : SCI.skin} opacity={0.9} />
            </g>
          ))}
        </g>
      )}
      {/* desk edge in front of the fingers */}
      {showHand && <rect x={60} y={566} width={500} height={34} rx={6} fill="#B98756" />}
    </g>
  );
};

// 3/4 rear view (looking right at the monitor). Origin at the head centre.
export const SciRear: React.FC<{turn?: number}> = ({turn = 0}) => (
  <g>
    <path d="M -260 640 C -250 380 -170 250 -40 228 L 80 228 C 210 250 270 380 280 640 Z" fill={SCI.coat} stroke={SCI.coatLine} strokeWidth={3} />
    <path d="M -230 620 C -220 450 -160 330 -90 270" stroke={SCI.coatShade} strokeWidth={30} fill="none" opacity={0.6} />
    <path d="M -24 120 L -24 236 L 66 236 L 70 120 Z" fill={SCI.skinDark} />
    <g transform={`rotate(${turn * 6} 0 100)`}>
      <ellipse cx={10} cy={0} rx={118} ry={138} fill={SCI.hair2} />
      <path d="M -100 40 C -60 120 60 130 120 60" stroke={SCI.hair} strokeWidth={14} fill="none" />
      {/* near ear and a sliver of cheek on the right */}
      <path d="M 112 -10 C 140 -14 144 34 116 44" fill={SCI.skin} stroke={SCI.skinDark} strokeWidth={3} />
      <path d="M 120 50 C 128 90 110 120 86 132" stroke={SCI.skin} strokeWidth={14} fill="none" strokeLinecap="round" />
    </g>
  </g>
);

// Small full figure for wide shots: standing at the desk's right end, facing right, one hand on the desk edge.
// Drawn in local units of world height (feet at 0, head top ~ -700 in y-down side coordinates).
export const SciFigure: React.FC<{lean?: number}> = ({lean = 0}) => (
  <g>
    <ellipse cx={0} cy={0} rx={70} ry={10} fill="#000" opacity={0.25} />
    <rect x={-34} y={-330} width={30} height={330} rx={10} fill={SCI.trousers} />
    <rect x={4} y={-330} width={30} height={330} rx={10} fill={SCI.trousers} />
    <rect x={-40} y={-14} width={42} height={16} rx={6} fill={SCI.shoe} />
    <rect x={0} y={-14} width={48} height={16} rx={6} fill={SCI.shoe} />
    <g transform={`rotate(${-5 * lean} 0 -330)`}>
      <path d="M -62 -300 C -66 -460 -50 -560 0 -580 L 30 -580 C 76 -560 92 -460 88 -300 Z" fill={SCI.coat} stroke={SCI.coatLine} strokeWidth={3} />
      <path d="M -6 -580 L 14 -520 L 34 -580 Z" fill={SCI.shirt} />
      {/* arm down to the desk edge (desk to the left of the figure) */}
      <path d="M -40 -560 C -80 -500 -110 -430 -120 -380" stroke={SCI.coat} strokeWidth={30} strokeLinecap="round" fill="none" />
      <circle cx={-124} cy={-372} r={14} fill={SCI.skin} />
      <rect x={-4} y={-624} width={30} height={50} fill={SCI.skinDark} />
      <ellipse cx={14} cy={-668} rx={42} ry={50} fill={SCI.skin} stroke={SCI.skinDark} strokeWidth={3} />
      <path d="M -28 -680 C -30 -724 10 -736 40 -726 C 60 -718 62 -696 56 -684 C 30 -700 0 -700 -28 -680 Z" fill={SCI.hair2} />
      <circle cx={38} cy={-674} r={5} fill={SCI.iris} />
    </g>
  </g>
);
