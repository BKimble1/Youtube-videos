// The gaming room: one continuous world (world px) that the camera moves through for every shot of the guesser.
// The monitor stands at the left, the guesser sits behind the desk at the right with his keyboard and gamepad
// untouched in front of him; Honest sits on a beanbag in front of the desk (frame-left) when he is in the scene.
import React from 'react';
import {CrewChar, CAST, Pose, reach, IDLE, VisShape} from '../crew';
import {GameScreen, GameState} from './game';
import {OpenMouth, MouthState} from './mouth';
import {clamp, lerp, hash, DUR} from '../lib';
/** decorative cycles complete a whole number of turns over the film, so the last frame flows into the first */
const cyc = (t: number, n: number) => (t / DUR) * n;

export type Cam = {x: number; y: number; z: number};
export const camT = (c: Cam) => `translate(540 960) scale(${c.z}) translate(${-c.x} ${-c.y})`;
const INK = '#162A32';

// ---- layout (world px)
export const SCREEN = {x: 28, y: 404, w: 640, h: 400};
export const DESK_Y = 1150;
export const G = {x: 790, ground: 1420, scale: 1.75};
export const H = {x: 262, ground: 1712, scale: 1.72};
export const HEAD_Y = -372;
export const gHead = {x: G.x, y: G.ground + HEAD_Y * G.scale};
export const gMouth = {x: G.x, y: G.ground + (HEAD_Y + 34) * G.scale};
export const hHead = (x: number) => ({x, y: H.ground + HEAD_Y * H.scale});

/** ink width for the rig: true to the figure at normal sizes, capped in close-ups so lines stay clean */
export const inkFor = (scale: number, z: number) => scale * (z <= 2.4 ? z : 2.4 + (z - 2.4) * 0.22);

const Wall: React.FC<{id: string; t: number}> = ({id, t}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3E3A78" />
        <stop offset="1" stopColor="#5A4E92" />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#7FE3FF" stopOpacity={0.42} />
        <stop offset="1" stopColor="#7FE3FF" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-1400} y={-600} width={3900} height={2000} fill={`url(#${id}-wall)`} />
    {/* soft vertical panels */}
    {Array.from({length: 16}).map((_, i) => (
      <rect key={i} x={-1400 + i * 240} y={-600} width={120} height={2000} fill="#FFFFFF" opacity={0.025} />
    ))}
    <ellipse cx={SCREEN.x + SCREEN.w / 2} cy={SCREEN.y + SCREEN.h / 2} rx={620} ry={470} fill={`url(#${id}-glow)`} />
    {/* LED strip along the wall behind the desk: slow colour drift */}
    <rect x={-1400} y={DESK_Y - 150} width={3900} height={10} rx={5} fill={`hsl(${(300 + 360 * cyc(t, 2)) % 360} 90% 72%)`} opacity={0.85} />
    <rect x={-1400} y={DESK_Y - 175} width={3900} height={60} fill={`hsl(${(300 + 360 * cyc(t, 2)) % 360} 90% 72%)`} opacity={0.12} />
    {/* shelf with a plant and a little robot figure (top right) */}
    <g transform="translate(860 250)">
      <rect x={-150} y={0} width={300} height={18} rx={6} fill="#C88B5A" stroke={INK} strokeWidth={4} />
      <path d="M -100 0 L -110 -60 L -50 -60 L -60 0 Z" fill="#EF6B55" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {[-1, 0, 1].map((k) => (
        <path key={k} d={`M -80 -60 Q ${-80 + k * 34} ${-120 - Math.abs(k) * -10} ${-80 + k * 50} ${-150 + Math.abs(k) * 30}`} fill="none" stroke="#4F9A6B" strokeWidth={12} strokeLinecap="round" />
      ))}
      <rect x={30} y={-70} width={56} height={52} rx={14} fill="#FF8A3D" stroke={INK} strokeWidth={4} />
      <rect x={40} y={-58} width={36} height={16} rx={7} fill="#2EC7D6" stroke={INK} strokeWidth={3} />
      <rect x={42} y={-18} width={14} height={18} rx={4} fill="#2B2B33" stroke={INK} strokeWidth={3} />
      <rect x={62} y={-18} width={14} height={18} rx={4} fill="#2B2B33" stroke={INK} strokeWidth={3} />
      <line x1={70} y1={-70} x2={78} y2={-90} stroke={INK} strokeWidth={4} />
      <circle cx={79} cy={-93} r={7} fill="#FFC744" stroke={INK} strokeWidth={3} />
    </g>
    {/* a poster above the monitor: a ringed planet, no text */}
    <g transform="translate(250 200)">
      <rect x={-120} y={-110} width={240} height={170} rx={10} fill="#2B2F5E" stroke={INK} strokeWidth={4} />
      <circle cx={0} cy={-25} r={46} fill="#FFC744" stroke={INK} strokeWidth={4} />
      <ellipse cx={0} cy={-25} rx={86} ry={18} fill="none" stroke="#EF6B55" strokeWidth={8} transform="rotate(-14 0 -25)" />
      {[[-90, -80], [80, -88], [-70, 30], [92, 20], [30, 40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3 + (i % 2) * 2} fill="#FFFBF0" opacity={0.6 + 0.4 * Math.sin(2 * Math.PI * cyc(t, 15) + i)} />)}
    </g>
  </g>
);

const Chair: React.FC = () => (
  <g>
    <path d={`M ${G.x - 130} ${DESK_Y + 10} L ${G.x - 140} ${G.ground - 640} Q ${G.x - 140} ${G.ground - 720} ${G.x - 60} ${G.ground - 730} L ${G.x + 60} ${G.ground - 730} Q ${G.x + 140} ${G.ground - 720} ${G.x + 140} ${G.ground - 640} L ${G.x + 130} ${DESK_Y + 10} Z`} fill="#2B2F4A" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d={`M ${G.x - 100} ${G.ground - 700} L ${G.x - 104} ${DESK_Y} L ${G.x - 80} ${DESK_Y} L ${G.x - 76} ${G.ground - 700} Z M ${G.x + 100} ${G.ground - 700} L ${G.x + 104} ${DESK_Y} L ${G.x + 80} ${DESK_Y} L ${G.x + 76} ${G.ground - 700} Z`} fill="#1CA7A0" />
  </g>
);

export const Monitor: React.FC<{g: GameState; id: string; glare?: number}> = ({g, id, glare = 1}) => (
  <g>
    {/* stand */}
    <rect x={SCREEN.x + SCREEN.w / 2 - 22} y={SCREEN.y + SCREEN.h + 10} width={44} height={DESK_Y - (SCREEN.y + SCREEN.h) - 8} fill="#2B2B33" stroke={INK} strokeWidth={5} />
    <ellipse cx={SCREEN.x + SCREEN.w / 2} cy={DESK_Y + 6} rx={130} ry={18} fill="#2B2B33" stroke={INK} strokeWidth={5} />
    {/* bezel */}
    <rect x={SCREEN.x - 20} y={SCREEN.y - 20} width={SCREEN.w + 40} height={SCREEN.h + 40} rx={18} fill="#22243A" stroke={INK} strokeWidth={6} />
    <g transform={`translate(${SCREEN.x} ${SCREEN.y})`}>
      <GameScreen g={g} id={`${id}-gm`} />
      {glare > 0 && <path d={`M 0 0 L 230 0 L 90 ${SCREEN.h} L 0 ${SCREEN.h} Z`} fill="#FFFFFF" opacity={0.05 * glare} />}
    </g>
    <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} fill="none" stroke={INK} strokeWidth={4} />
    <circle cx={SCREEN.x + SCREEN.w - 8} cy={SCREEN.y + SCREEN.h + 10} r={4} fill="#5BE37D" />
  </g>
);

const Desk: React.FC<{id: string}> = ({id}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-desk`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#D9A066" />
        <stop offset="1" stopColor="#B97F4C" />
      </linearGradient>
    </defs>
    <path d={`M -1400 ${DESK_Y} L 2500 ${DESK_Y} L 2500 ${DESK_Y + 62} L -1400 ${DESK_Y + 62} Z`} fill={`url(#${id}-desk)`} stroke={INK} strokeWidth={5} />
    <rect x={-1400} y={DESK_Y + 62} width={3900} height={1200} fill="#7E5A3C" stroke={INK} strokeWidth={5} />
    <rect x={-1400} y={DESK_Y + 62} width={3900} height={22} fill="#000000" opacity={0.18} />
  </g>
);

/** the gaming PC under the desk (fills the wide shot's lower half; its fans spin) */
const PCTower: React.FC<{t: number}> = ({t}) => (
  <g transform={`translate(150 ${DESK_Y + 150})`}>
    <rect x={0} y={0} width={230} height={420} rx={18} fill="#22243A" stroke={INK} strokeWidth={6} />
    <rect x={18} y={18} width={194} height={384} rx={10} fill="#2E3150" stroke={INK} strokeWidth={4} />
    {[0, 1, 2].map((k) => (
      <g key={k} transform={`translate(115 ${92 + k * 118})`}>
        <circle r={46} fill="#1B1D33" stroke={`hsl(${(k * 90 + 360 * cyc(t, 8)) % 360} 90% 65%)`} strokeWidth={7} />
        <g transform={`rotate(${(360 * cyc(t, 64) + k * 40) % 360})`}>
          {[0, 1, 2, 3, 4].map((b) => <path key={b} transform={`rotate(${b * 72})`} d="M 0 -6 Q 22 -30 6 -40 Q -6 -22 0 -6 Z" fill="#55606E" />)}
        </g>
        <circle r={9} fill="#8D9AA8" stroke={INK} strokeWidth={3} />
      </g>
    ))}
  </g>
);

/** keyboard and gamepad: on the desk in front of the guesser, untouched (they never move) */
const Gear: React.FC<{t: number; pad?: boolean}> = ({t, pad = true}) => (
  <g>
    <path d={`M ${G.x - 250} ${DESK_Y + 40} L ${G.x - 230} ${DESK_Y + 8} L ${G.x - 20} ${DESK_Y + 8} L ${G.x - 4} ${DESK_Y + 40} Z`} fill="#2B2B33" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    {Array.from({length: 3}).map((_, r) => Array.from({length: 11}).map((_, c) => (
      <rect key={`${r}-${c}`} x={G.x - 236 + c * 19 + r * 3} y={DESK_Y + 12 + r * 9} width={14} height={6} rx={2} fill={`hsl(${(c * 30 + 360 * cyc(t, 5)) % 360} 85% 65%)`} opacity={0.75} />
    )))}
    {pad && <g transform={`translate(${G.x + 120} ${DESK_Y + 26})`}>
      <path d="M -62 -10 Q -60 -24 -30 -24 L 30 -24 Q 60 -24 62 -10 L 70 16 Q 72 30 56 30 Q 44 30 36 16 L -36 16 Q -44 30 -56 30 Q -72 30 -70 16 Z" fill="#E9EEF2" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <circle cx={-34} cy={-6} r={7} fill="#2B2B33" />
      <circle cx={30} cy={-10} r={4} fill="#EF6B55" /><circle cx={40} cy={-2} r={4} fill="#1CA7A0" /><circle cx={22} cy={-2} r={4} fill="#FFC744" />
    </g>}
  </g>
);

const BeanBag: React.FC<{x: number}> = ({x}) => (
  <path d={`M ${x - 230} ${H.ground + 20} Q ${x - 260} ${H.ground - 260} ${x - 120} ${H.ground - 300} Q ${x} ${H.ground - 330} ${x + 120} ${H.ground - 300} Q ${x + 260} ${H.ground - 260} ${x + 230} ${H.ground + 20} Z`} fill="#7A5AC9" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
);

/** Honest's controller (held in both hands) */
export const Pad: React.FC<{x: number; y: number; r?: number; shake?: number}> = ({x, y, r = 0, shake = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <path d="M -62 -10 Q -60 -24 -30 -24 L 30 -24 Q 60 -24 62 -10 L 70 16 Q 72 30 56 30 Q 44 30 36 16 L -36 16 Q -44 30 -56 30 Q -72 30 -70 16 Z" fill="#2B2B33" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <circle cx={-34} cy={-6} r={8} fill="#55606E" />
    <circle cx={30} cy={-10} r={5} fill="#EF6B55" opacity={0.6 + 0.4 * shake} /><circle cx={40} cy={-2} r={5} fill="#1CA7A0" /><circle cx={22} cy={-2} r={5} fill="#FFC744" />
  </g>
);

export type GState = {pose: Pose; m: MouthState; life?: number; hands?: 'up' | 'behind' | 'rest'; front?: 'L' | 'R' | 'none'};
export type HState = {x: number; pose: Pose; mouth?: Pose['mouth']; pad?: {dx: number; dy: number; r: number; shake: number} | null; sweat?: number; lean?: number; rise?: number; holdR?: React.ReactNode; paint?: number; vis?: VisShape} | null;

export const RoomScene: React.FC<{t: number; frame: number; cam: Cam; g: GState; h: HState; game: GameState; id: string; alwaysMouth?: boolean; front?: React.ReactNode; noPad?: boolean}> = ({t, frame, cam, g, h, game, id, alwaysMouth, front, noPad}) => {
  const ink = inkFor(G.scale, cam.z);
  const pxMouth = G.scale * cam.z; // screen px per rig unit at the guesser
  const mouthNode = alwaysMouth || g.m.open > 0.02 ? <OpenMouth m={g.m} id={`${id}-mo`} px={pxMouth / 4} /> : undefined;
  const hy = H.ground - (h?.rise ?? 0);
  return (
    <g transform={camT(cam)}>
      <Wall id={id} t={t} />
      <Monitor g={game} id={id} />
      <Chair />
      <CrewChar look={CAST.guesser} pose={g.pose} frame={frame} seed={3} x={G.x} y={G.ground} scale={G.scale} id={`${id}-g`} ink={ink} mouthNode={mouthNode} life={g.life ?? 1} shadow={false} front={g.front ?? 'none'} />
      <Desk id={id} />
      <PCTower t={t} />
      <Gear t={t} pad={!noPad} />
      {h && (
        <g>
          <BeanBag x={h.x} />
          <CrewChar look={CAST.honest} pose={h.pose} frame={frame} seed={7} x={h.x} y={hy} scale={H.scale} id={`${id}-h`} ink={inkFor(H.scale, cam.z)} shadow={false} vis={h.vis} front="L"
            headGear={(h.paint ?? 0) > 0.01 ? <g opacity={h.paint}><path d="M 18 -362 q 10 -14 24 -4 q 12 -10 16 6 q 10 4 2 14 q 4 14 -12 10 q -6 12 -18 2 q -14 6 -14 -10 q -10 -8 2 -18 Z" fill="#FF8A3D" stroke="#162A32" strokeWidth={3} /><circle cx={34} cy={-354} r={6} fill="#FFC744" /></g> : undefined} />
          {h.pad && <Pad x={h.x + h.pad.dx} y={hy - 330 + h.pad.dy} r={h.pad.r} shake={h.pad.shake} />}
          <CrewChar look={CAST.honest} pose={h.pose} frame={frame} seed={7} x={h.x} y={hy} scale={H.scale} id={`${id}-h2`} ink={inkFor(H.scale, cam.z)} shadow={false} front="R" pass="frontArm" holdR={h.holdR} />
          {(h.sweat ?? 0) > 0.01 && (
            <path d={`M ${h.x + 70} ${hHead(h.x).y - 60 + (h.sweat ?? 0) * 30} q 10 18 0 26 q -10 -8 0 -26 Z`} fill="#9EE7FF" stroke={INK} strokeWidth={4} opacity={clamp((h.sweat ?? 0) * 3) * (1 - clamp(((h.sweat ?? 0) - 0.8) * 5))} />
          )}
        </g>
      )}
      {front}
    </g>
  );
};

// ---- poses
export const handsUp = (open = 1): Pose => ({
  ...IDLE,
  armL: reach({x: G.x, y: G.ground, scale: G.scale}, -1, G.x - 168, G.ground - 690),
  armR: reach({x: G.x, y: G.ground, scale: G.scale}, 1, G.x + 170, G.ground - 695),
  handL: {curl: lerp(0.4, 0, open), spread: lerp(0.3, 1, open)},
  handR: {curl: lerp(0.4, 0, open), spread: lerp(0.3, 1, open)},
  lookX: -0.85, lookY: -0.25, brows: 0.1, mouth: 'smile',
});
/** hands laced behind the head: elbows out, hands hidden behind the head */
export const handsBehind = (): Pose => ({
  ...IDLE,
  armL: reach({x: G.x, y: G.ground, scale: G.scale}, -1, G.x - 44, G.ground - 650, 1),
  armR: reach({x: G.x, y: G.ground, scale: G.scale}, 1, G.x + 44, G.ground - 650, 1),
  handL: {curl: 0.7}, handR: {curl: 0.7},
  lookX: -0.85, lookY: -0.2, brows: 0, mouth: 'smile',
});
/** Honest holding the controller in front of his chest */
export const honestHold = (x: number, dx = 0, dy = 0): Pose => {
  const ch = {x, y: H.ground, scale: H.scale};
  const cy = H.ground - 330 + dy;
  return {...IDLE, armL: reach(ch, -1, x - 52 + dx, cy + 8, -1), armR: reach(ch, 1, x + 52 + dx, cy + 8, -1), handL: {curl: 0.75}, handR: {curl: 0.75}, lookX: 0.9, lookY: -0.4, brows: 0, mouth: 'flat'};
};
export const mixPoseNum = (a: number, b: number, t: number) => lerp(a, b, t);
export const jitter = (t: number, amp: number, seed = 0) => (hash(Math.floor(t * 24) + seed) - 0.5) * 2 * amp;
export {handWorld as handWorldG} from '../crew';
