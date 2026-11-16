// "And people are already using this thing to control computers and phones without their hands."
// The Weird Crew's "person", in a power wheelchair at her table: small head movements move the cursor, a tongue
// press clicks (nothing visible: her mouth stays closed), and her hands rest on the armrests the whole time.
// Computer: the cursor crosses the desktop and opens a photo, then starts a song. Phone (on a mount): a swipe through
// photos and an answered video call — the guesser waving. Then wide: hands at rest. No text.
import React from 'react';
import {CrewChar, CAST, IDLE, Pose, reach, CREW_HEAD} from '../crew';
import {camAt, CamKey} from '../camera';
import {camT, inkFor, Cam} from '../art/room';
import {T} from '../story';
import {clamp, keys, ss, pulse, blip, lerp, eo} from '../lib';

export const ASSIST_START = T.and2;
export const ASSIST_END = T.but - 0.03;
const INK = '#162A32';
const P = {x: 760, ground: 1500, scale: 1.75};
const SCR = {x: 40, y: 470, w: 600, h: 375};
const DESK = 1240;
const PHONE = {x: 470, y: 1040, w: 120, h: 220}; // (V4) on a stand on her table, well clear of her resting hands

// five action-matched shots: desktop close-up, her (hands resting) with the cursor following her head, the desktop
// again (the cursor exits right), the phone (the touch point enters from the left), then her hands beside the phone
export const G_CUTS = [ASSIST_START, T.using, T.control - 0.36, T.and3 - 0.01, T.without + 0.28];
const SCRCAM = (z: number, dx = 0): Cam => ({x: SCR.x + SCR.w / 2 + dx, y: SCR.y + SCR.h / 2 + 20, z});
const CAMS: CamKey[] = [
  {t: G_CUTS[0], c: SCRCAM(1.72, -10)}, {t: G_CUTS[1], c: SCRCAM(1.82, 10)},
  {t: G_CUTS[1], c: {x: 640, y: 980, z: 1.3}, cut: true}, {t: G_CUTS[2], c: {x: 660, y: 990, z: 1.36}},
  {t: G_CUTS[2], c: SCRCAM(1.9, 20), cut: true}, {t: G_CUTS[3] - 0.22, c: SCRCAM(1.98, 60)},
  // computer → phone: one continuous glide, following the cursor off the screen's right edge down to the phone
  // (V4) framed so the phone on its stand and her hand resting on the armrest are both in shot
  {t: G_CUTS[3] + 0.18, c: {x: PHONE.x + 95, y: PHONE.y + 40, z: 2.9}, ease: (t, a1, b1) => ss(t, a1, b1)}, {t: G_CUTS[4], c: {x: PHONE.x + 100, y: PHONE.y + 40, z: 3.0}},
  {t: G_CUTS[4], c: {x: PHONE.x + 100, y: PHONE.y + 40, z: 3.0}}, {t: ASSIST_END, c: {x: 700, y: 1130, z: 2.0}, ease: (t, a1, b1) => eo(t, a1, b1)},
];

// cursor path on the desktop (screen-local px), driven by her head
const CUR: [number, [number, number]][] = [];
const cursor = (t: number) => ({
  x: keys(t, [[ASSIST_START, 110], [ASSIST_START + 0.1, 110], [T.already + 0.2, 470], [T.using, 470], [T.thing, 300], [T.control - 0.1, 70], [T.control + 0.12, 70], [T.computers + 0.25, 650]]),
  y: keys(t, [[ASSIST_START, 300], [ASSIST_START + 0.1, 300], [T.already + 0.2, 92], [T.using, 92], [T.thing, 140], [T.control - 0.1, 180], [T.control + 0.12, 180], [T.computers + 0.25, 210]]),
});
void CUR;
const CLICK1 = T.already + 0.25; // opens the photo
const CLICK2 = T.control + 0.05; // plays the song
const SWIPE = T.phones - 0.02;
const ANSWER = T.without - 0.02;

const Desktop: React.FC<{t: number}> = ({t}) => {
  const c = cursor(t);
  const photo = eo(t, CLICK1 + 0.03, CLICK1 + 0.3);
  const song = eo(t, CLICK2 + 0.03, CLICK2 + 0.28);
  const icon = (x: number, y: number, fill: string, glyph: React.ReactNode, hot: number) => (
    <g transform={`translate(${x} ${y}) scale(${1 + 0.12 * hot})`}>
      <rect x={-34} y={-34} width={68} height={68} rx={16} fill={fill} stroke={INK} strokeWidth={4} />
      {glyph}
    </g>
  );
  const near = (x: number, y: number) => clamp(1 - Math.hypot(c.x - x, c.y - y) / 60);
  return (
    <g>
      <defs><clipPath id="as-scr"><rect x={0} y={0} width={SCR.w} height={SCR.h} /></clipPath>
        <linearGradient id="as-dt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9AD8F5" /><stop offset="1" stopColor="#C9B8F2" /></linearGradient></defs>
      <g clipPath="url(#as-scr)">
        <rect x={0} y={0} width={SCR.w} height={SCR.h} fill="url(#as-dt)" />
        {icon(70, 80, '#FFC744', <path d="M -18 14 L -4 -6 L 6 6 L 12 -2 L 20 14 Z" fill="#4F9A6B" stroke={INK} strokeWidth={3} strokeLinejoin="round" />, near(470, 92) * (1 - photo))}
        {icon(470, 92, '#FF8A3D', <g><path d="M -16 14 L -4 -8 L 6 6 L 12 -2 L 20 14 Z" fill="#FFFBF0" stroke={INK} strokeWidth={3} strokeLinejoin="round" /><circle cx={10} cy={-12} r={5} fill="#FFFBF0" /></g>, near(470, 92))}
        {icon(70, 180, '#1CA7A0', <g><circle cx={-4} cy={10} r={7} fill="#FFFBF0" stroke={INK} strokeWidth={3} /><path d="M 3 10 L 3 -16 L 16 -12" fill="none" stroke={INK} strokeWidth={4} /></g>, 0)}
        {icon(70, 280, '#EF6B55', <path d="M -18 -10 L 18 -10 L 18 12 L -18 12 Z M -18 -10 L 0 4 L 18 -10" fill="#FFFBF0" stroke={INK} strokeWidth={3} strokeLinejoin="round" />, 0)}
        {/* the photo window */}
        {photo > 0.01 && (
          <g transform={`translate(${lerp(470, 300, photo)} ${lerp(92, 160, photo)}) scale(${photo})`}>
            <rect x={-200} y={-130} width={400} height={250} rx={14} fill="#FFFBF0" stroke={INK} strokeWidth={4} />
            <rect x={-200} y={-130} width={400} height={30} rx={14} fill="#4F7CC9" stroke={INK} strokeWidth={4} />
            <rect x={-186} y={-92} width={372} height={200} rx={8} fill="#FFB36B" />
            <circle cx={80} cy={-30} r={34} fill="#FFE08A" />
            <path d="M -186 108 L -90 -10 L -20 60 L 50 0 L 186 108 Z" fill="#6A5ACD" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          </g>
        )}
        {/* the music player, with a big play/pause and notes */}
        {song > 0.01 && (
          <g transform={`translate(330 230) scale(${song})`}>
            <rect x={-150} y={-70} width={300} height={140} rx={16} fill="#1B2B3A" stroke={INK} strokeWidth={4} />
            <circle cx={-80} cy={0} r={40} fill="#1CA7A0" stroke="#FFFBF0" strokeWidth={4} />
            <rect x={-92} y={-16} width={8} height={32} rx={3} fill="#FFFBF0" /><rect x={-76} y={-16} width={8} height={32} rx={3} fill="#FFFBF0" />
            {Array.from({length: 9}).map((_, i) => {
              const h = 14 + 34 * Math.abs(Math.sin(t * 8 + i * 1.3));
              return <rect key={i} x={-10 + i * 16} y={-h / 2} width={10} height={h} rx={4} fill="#FFC744" />;
            })}
          </g>
        )}
        {/* the cursor */}
        <g transform={`translate(${c.x} ${c.y})`}>
          {[CLICK1, CLICK2].map((k, i) => {
            const b = blip(t, k, 0.3);
            return b > 0.01 ? <circle key={i} r={10 + (t - k) * 120} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={b} /> : null;
          })}
          <path d="M 0 0 L 0 34 L 9 26 L 16 42 L 23 39 L 16 23 L 28 23 Z" fill="#FFFFFF" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        </g>
      </g>
    </g>
  );
};

const Phone: React.FC<{t: number}> = ({t}) => {
  const sw = eo(t, SWIPE, SWIPE + 0.25);
  const ring = ss(t, SWIPE + 0.3, SWIPE + 0.4);
  const call = eo(t, ANSWER + 0.03, ANSWER + 0.25);
  // the touch point enters from the left (continuing the cursor's exit to the right), swipes, then taps "answer"
  const dot = {x: keys(t, [[T.and3, -40], [SWIPE - 0.04, 92], [SWIPE + 0.2, 30], [ANSWER - 0.22, 30], [ANSWER - 0.02, 82]]), y: keys(t, [[T.and3, 120], [SWIPE - 0.04, 110], [ANSWER - 0.22, 110], [ANSWER - 0.02, 178]])};
  const W = PHONE.w, Hh = PHONE.h;
  return (
    <g transform={`translate(${PHONE.x - W / 2} ${PHONE.y - Hh / 2})`}>
      <defs><clipPath id="as-ph"><rect x={6} y={6} width={W - 12} height={Hh - 12} rx={14} /></clipPath></defs>
      {/* (V4) a desk stand: weighted base on the table, a short post and a cradle gripping the phone's sides */}
      <path d={`M ${W / 2 - 58} ${Hh + 92} Q ${W / 2 - 58} ${Hh + 70} ${W / 2 - 30} ${Hh + 68} L ${W / 2 + 30} ${Hh + 68} Q ${W / 2 + 58} ${Hh + 70} ${W / 2 + 58} ${Hh + 92} Z`} fill="#55606E" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <rect x={W / 2 - 9} y={Hh - 30} width={18} height={100} rx={6} fill="#8D9AA8" stroke={INK} strokeWidth={4} />
      <rect x={-8} y={Hh / 2 - 26} width={W + 16} height={52} rx={10} fill="#55606E" stroke={INK} strokeWidth={4} />
      <rect x={0} y={0} width={W} height={Hh} rx={20} fill="#22243A" stroke={INK} strokeWidth={5} />
      <g clipPath="url(#as-ph)">
        {/* two photos, swiped */}
        <g transform={`translate(${-sw * (W - 12)} 0)`}>
          <rect x={6} y={6} width={W - 12} height={Hh - 12} fill="#9AD8F5" />
          <circle cx={W / 2} cy={Hh / 2} r={30} fill="#FFC744" stroke={INK} strokeWidth={3} />
          <rect x={W - 6} y={6} width={W - 12} height={Hh - 12} fill="#FFB36B" />
          <path d={`M ${W - 6} ${Hh - 30} L ${W + 40} ${Hh / 2} L ${W + 80} ${Hh - 50} L ${2 * W - 18} ${Hh - 30} Z`} fill="#6A5ACD" />
        </g>
        {/* incoming video call → answered: the guesser waves */}
        {ring > 0.01 && (
          <g opacity={ring}>
            <rect x={6} y={6} width={W - 12} height={Hh - 12} fill="#1B2B3A" />
            {call < 0.99 && (
              <g opacity={1 - call}>
                <circle cx={W / 2} cy={70} r={26} fill="#F2C9A8" stroke={INK} strokeWidth={3} />
                <path d={`M ${W / 2 - 24} 56 L ${W / 2 - 20} 36 L ${W / 2 - 8} 48 L ${W / 2} 30 L ${W / 2 + 8} 48 L ${W / 2 + 20} 36 L ${W / 2 + 24} 56 Z`} fill="#C0392B" stroke={INK} strokeWidth={3} />
                <circle cx={W / 2 - 34 + 0} cy={178} r={16} fill="#EF6B55" />
                <circle cx={W / 2 + 18} cy={178} r={16 * (1 + 0.15 * Math.sin(t * 20))} fill="#5BE37D" />
              </g>
            )}
            {call > 0.01 && (
              <g opacity={call}>
                <rect x={6} y={6} width={W - 12} height={Hh - 12} fill="#3E3A78" />
                <g transform={`translate(${W / 2} ${Hh + 30}) scale(0.34)`}>
                  <CrewChar look={CAST.guesser} pose={{...IDLE, armR: {a: 150 + 20 * Math.sin(t * 14), b: 30}, handR: {curl: 0, spread: 1}, mouth: 'grin', lookX: 0, lookY: 0}} frame={Math.round(t * 30)} seed={3} id="as-call" shadow={false} />
                </g>
              </g>
            )}
          </g>
        )}
      </g>
      <circle cx={dot.x} cy={dot.y} r={9} fill="#FFFFFF" stroke={INK} strokeWidth={3} opacity={0.9 * (1 - call)} />
    </g>
  );
};

const Wheelchair: React.FC<{part: 'back' | 'front'}> = ({part}) => {
  const y0 = P.ground - 150 * P.scale; // hip level
  if (part === 'back') {
    return (
      <g>
        <path d={`M ${P.x - 130} ${y0 + 20} L ${P.x - 128} ${P.ground - 760} Q ${P.x - 120} ${P.ground - 820} ${P.x - 60} ${P.ground - 824} L ${P.x + 60} ${P.ground - 824} Q ${P.x + 120} ${P.ground - 820} ${P.x + 128} ${P.ground - 760} L ${P.x + 130} ${y0 + 20} Z`} fill="#2E3F5C" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <rect x={P.x - 70} y={P.ground - 900} width={140} height={90} rx={36} fill="#2E3F5C" stroke={INK} strokeWidth={5} />
      </g>
    );
  }
  return (
    <g>
      {/* big wheels beside her hips (seen nearly edge-on), armrests, the joystick box she is not using */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={P.x + s * 168 - 22} y={y0 - 120} width={44} height={330} rx={22} fill="#2B2B33" stroke={INK} strokeWidth={5} />
          <rect x={P.x + s * 168 - 9} y={y0 - 100} width={18} height={290} rx={9} fill="#8D9AA8" />
          <rect x={P.x + s * 112 - 46} y={y0 - 26} width={92} height={26} rx={12} fill="#55606E" stroke={INK} strokeWidth={5} />
        </g>
      ))}
      <rect x={P.x + 150} y={y0 - 64} width={36} height={40} rx={8} fill="#1B2B3A" stroke={INK} strokeWidth={4} />
      <line x1={P.x + 168} y1={y0 - 64} x2={P.x + 168} y2={y0 - 88} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <circle cx={P.x + 168} cy={y0 - 92} r={9} fill="#2B2B33" stroke={INK} strokeWidth={3} />
    </g>
  );
};

export const AssistShot: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const cam = camAt(t, CAMS);
  const c = cursor(t);
  const cv = {x: (cursor(t + 0.05).x - cursor(t - 0.05).x) / 0.1, y: (cursor(t + 0.05).y - cursor(t - 0.05).y) / 0.1};
  const atPhone = ss(t, T.phones - 0.1, T.phones + 0.1) * (1 - ss(t, T.hands, T.hands + 0.2));
  const y0 = P.ground - 150 * P.scale;
  // hands at rest on the armrests
  const ch = {x: P.x, y: P.ground, scale: P.scale};
  const pose: Pose = {
    ...IDLE,
    armL: reach(ch, -1, P.x - 118, y0 - 34, -1),
    armR: reach(ch, 1, P.x + 118, y0 - 34, -1),
    handL: {curl: 0.35, spread: 0.2}, handR: {curl: 0.35, spread: 0.2},
    // the head leads the cursor; she looks at the screen (left), the phone (down-left), then at us and smiles
    tilt: clamp(cv.x / 60, -1, 1) * 8 + keys(t, [[T.phones, 0], [T.phones + 0.15, -6], [T.hands, -6], [T.hands + 0.2, 0]]),
    lookX: lerp(lerp(-0.85 + (c.x - 300) / 600, -0.7, atPhone), 0.1, ss(t, T.hands, T.hands + 0.2)),
    lookY: lerp(lerp(-0.45 + (c.y - 180) / 500, 0.55, atPhone), 0, ss(t, T.hands, T.hands + 0.2)),
    brows: 0.15 + 0.4 * pulse(t, T.hands, T.hands + 0.2, ASSIST_END, ASSIST_END + 1),
    mouth: t > T.hands ? 'grin' : 'smile',
  };
  return (
    <g>
      <g transform={camT(cam)}>
        <defs>
          <linearGradient id="as-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FCE9D2" /><stop offset="1" stopColor="#F6D7B6" /></linearGradient>
        </defs>
        <rect x={-1000} y={-600} width={3200} height={2400} fill="url(#as-wall)" />
        {/* window with daylight */}
        <g transform="translate(830 330)">
          <rect x={-150} y={-170} width={300} height={300} rx={10} fill="#9AD8F5" stroke={INK} strokeWidth={6} />
          <circle cx={60} cy={-80} r={34} fill="#FFF6D6" />
          <path d="M -150 60 Q -60 0 30 50 Q 100 20 150 50 L 150 130 L -150 130 Z" fill="#7CC48A" />
          <line x1={0} y1={-170} x2={0} y2={130} stroke={INK} strokeWidth={6} /><line x1={-150} y1={-20} x2={150} y2={-20} stroke={INK} strokeWidth={6} />
        </g>
        <path d="M 60 300 L 60 240 Q 80 180 110 230 Q 120 160 150 220 Q 180 170 170 250 L 170 300 Z" fill="#4F9A6B" stroke={INK} strokeWidth={4} />
        <rect x={50} y={296} width={130} height={20} rx={6} fill="#C88B5A" stroke={INK} strokeWidth={4} />
        {/* the monitor on her table */}
        <rect x={SCR.x + SCR.w / 2 - 20} y={SCR.y + SCR.h} width={40} height={DESK - SCR.y - SCR.h} fill="#2B2B33" stroke={INK} strokeWidth={5} />
        <rect x={SCR.x - 18} y={SCR.y - 18} width={SCR.w + 36} height={SCR.h + 36} rx={16} fill="#22243A" stroke={INK} strokeWidth={6} />
        <g transform={`translate(${SCR.x} ${SCR.y})`}><Desktop t={t} /></g>
        <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} fill="none" stroke={INK} strokeWidth={4} />
        <Wheelchair part="back" />
        <CrewChar look={CAST.person} pose={pose} frame={frame} seed={11} x={P.x} y={P.ground} scale={P.scale} id="as-p" ink={inkFor(P.scale, cam.z)} shadow={false} front="none" />
        {/* table (in front of the monitor stand only; she sits beside it, so the chair stays visible) */}
        <path d={`M -900 ${DESK} L 560 ${DESK} L 560 ${DESK + 50} L -900 ${DESK + 50} Z`} fill="#D9A066" stroke={INK} strokeWidth={5} />
        <rect x={-900} y={DESK + 50} width={1460} height={900} fill="#B97F4C" stroke={INK} strokeWidth={5} />
        <Wheelchair part="front" />
        {/* her lap: a soft blanket over the legs */}
        <path d={`M ${P.x - 120} ${y0 - 10} Q ${P.x} ${y0 - 40} ${P.x + 120} ${y0 - 10} L ${P.x + 130} ${P.ground + 40} L ${P.x - 130} ${P.ground + 40} Z`} fill="#EF6B55" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {[0, 1, 2, 3].map((i) => <line key={i} x1={P.x - 110} y1={y0 + 40 + i * 60} x2={P.x + 115} y2={y0 + 40 + i * 60} stroke="#C94A36" strokeWidth={10} opacity={0.6} />)}
        {/* her hands again over the armrests (drawn on top of the chair front) */}
        <CrewChar look={CAST.person} pose={pose} frame={frame} seed={11} x={P.x} y={P.ground} scale={P.scale} id="as-p2" ink={inkFor(P.scale, cam.z)} shadow={false} front="L" pass="frontArm" />
        <CrewChar look={CAST.person} pose={pose} frame={frame} seed={11} x={P.x} y={P.ground} scale={P.scale} id="as-p3" ink={inkFor(P.scale, cam.z)} shadow={false} front="R" pass="frontArm" />
        <Phone t={t} />
      </g>
    </g>
  );
};
void CREW_HEAD;
