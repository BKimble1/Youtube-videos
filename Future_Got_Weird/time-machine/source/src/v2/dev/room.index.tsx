// Dev entry for the V2 room module:
//   RoomPast / RoomPresent  the whole room (clock, window, sideboard) at era 0 / era 1
//   RoomSideboard           close on the three photos, era 1, dustWipe 0.6, photoTint 0.4, placeholder portals
//   RoomClock               the wall clock filling ~55% of the width, clockBlur 0.8
//   RoomTest                exported rects / points drawn over the room (registration check)
//   RoomWipe                the family photo at dustWipe 0, 0.3, 0.6, 1 (era 1) and at era 0.5
//   RoomFamily              close on the family photo with a reflection (refl / reflOp)
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {Room, RoomDoorFront, ROOM, WallClock, wipeAt} from '../room';
import {Astronaut, ASTRO_IDLE, astroReach, Friend, Bust, GUESSER} from '../../art/figures';
import {INK} from '../../art/crew';

const Cam: React.FC<{cx: number; cy: number; s: number; children: React.ReactNode}> = ({cx, cy, s, children}) => (
  <g transform={`translate(540 960) scale(${s}) translate(${-cx} ${-cy})`}>{children}</g>
);
const Svg: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = '#222'}) => (
  <AbsoluteFill style={{background: bg}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">{children}</svg>
  </AbsoluteFill>
);

/** a placeholder of the opening composition in 1080x1920 screen space (the young friend and the astronaut at the gate) */
const OpeningPlaceholder: React.FC = () => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill="#A9D8EF" />
    <circle cx={860} cy={300} r={110} fill="#FFF3C4" />
    <rect x={0} y={1250} width={1080} height={670} fill="#8DC08A" />
    {Array.from({length: 12}, (_, k) => (
      <path key={k} d={`M ${k * 96 + 10} 1300 L ${k * 96 + 10} 1120 L ${k * 96 + 40} 1090 L ${k * 96 + 70} 1120 L ${k * 96 + 70} 1300 Z`} fill="#FFFBF0" stroke={INK} strokeWidth={8} />
    ))}
    <g transform="translate(340 1560) scale(1.5)">
      <Friend age={0} pose={{armL: {a: 20, b: 20}, armR: {a: 20, b: 20}, e: {mouth: 'smile'}}} id="ph-f" facing={1} green />
    </g>
    <g transform="translate(760 1560) scale(1.5)">
      <Astronaut pose={ASTRO_IDLE} id="ph-a" frame={0} glove="#EEF2F5" />
    </g>
  </g>
);

/** a placeholder yard through the window (room coordinates): an evening sky so the portal is visible */
const YardPlaceholder: React.FC = () => (
  <g>
    <rect x={ROOM.win.x0} y={ROOM.win.y0} width={ROOM.win.w} height={ROOM.win.h} fill="#F2B98A" />
    <rect x={ROOM.win.x0} y={ROOM.win.y0 + 360} width={ROOM.win.w} height={ROOM.win.h - 360} fill="#7FA67A" />
    {Array.from({length: 6}, (_, k) => <rect key={k} x={ROOM.win.x0 + 20 + k * 64} y={ROOM.win.y0 + 200 - k * 18} width={44} height={180 + k * 18} fill="#8E9FB8" stroke={INK} strokeWidth={3} />)}
  </g>
);

/** his face as the integrator would pass it for the glass reflection (room coordinates, beside the family) */
const FaceRefl: React.FC = () => (
  <g transform={`translate(${ROOM.photoFamily.reflSpot.x} ${ROOM.photoFamily.reflSpot.y}) scale(${ROOM.photoFamily.reflSpot.r / 62})`}>
    <Bust skin={GUESSER.skin} hair="spiky" hairColor={GUESSER.hair} age={0} shirt="#F4F6F8" id="reflface" e={{mouth: 'flat', sad: 0.6, lookX: -0.6}} />
  </g>
);

const Past: React.FC = () => (
  <Svg>
    <Cam cx={980} cy={1010} s={1080 / 1640}>
      <Room t={1.2} id="rp" era={0} clockMinutes={600 + 8} />
    </Cam>
  </Svg>
);
const Present: React.FC = () => (
  <Svg>
    <Cam cx={980} cy={1010} s={1080 / 1640}>
      <Room t={1.2} id="rn" era={1} clockMinutes={600 + 8} />
    </Cam>
  </Svg>
);
const Sideboard: React.FC = () => (
  <Svg>
    <Cam cx={(ROOM.sideboard.x0 + ROOM.sideboard.x1) / 2} cy={1110} s={1080 / 700}>
      <Room t={2} id="rs" era={1} clockMinutes={600} dustWipe={0.6} photoTint={0.4} photoView={<OpeningPlaceholder />} windowView={<YardPlaceholder />} />
    </Cam>
  </Svg>
);
const ClockC: React.FC = () => (
  <Svg>
    <Cam cx={ROOM.clock.x} cy={ROOM.clock.y} s={(1080 * 0.55) / (2 * ROOM.clock.r)}>
      <Room t={0} id="rc" era={0} clockMinutes={10 * 60 + 8} clockBlur={0.8} />
    </Cam>
  </Svg>
);

const Box: React.FC<{r: {x: number; y: number; w: number; h: number}; c: string}> = ({r, c}) => <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={c} strokeWidth={3} strokeDasharray="10 6" />;
const Pt: React.FC<{x: number; y: number; c: string}> = ({x, y, c}) => (
  <g>
    <circle cx={x} cy={y} r={7} fill={c} stroke="#000" strokeWidth={2} />
    <line x1={x - 18} y1={y} x2={x + 18} y2={y} stroke={c} strokeWidth={2} />
    <line x1={x} y1={y - 18} x2={x} y2={y + 18} stroke={c} strokeWidth={2} />
  </g>
);
const Test: React.FC = () => (
  <Svg>
    <Cam cx={1000} cy={1100} s={1080 / 2700}>
      <Room t={0} id="rt" era={0.5} clockMinutes={130} />
      <circle cx={ROOM.clock.x} cy={ROOM.clock.y} r={ROOM.clock.r} fill="none" stroke="#E0F" strokeWidth={4} />
      <Box r={{x: ROOM.win.x0, y: ROOM.win.y0, w: ROOM.win.w, h: ROOM.win.h}} c="#0AF" />
      <Box r={{x: ROOM.sideboard.x0, y: ROOM.sideboard.topBack, w: ROOM.sideboard.w, h: ROOM.floor - ROOM.sideboard.topBack}} c="#F80" />
      <Box r={ROOM.photoFamily} c="#F00" />
      <Box r={ROOM.photoFamily.glass} c="#FF0" />
      <Box r={ROOM.photoParent} c="#F00" />
      <Box r={ROOM.photoParent.print} c="#FF0" />
      <Box r={ROOM.photoFriend} c="#F00" />
      <Box r={ROOM.photoFriend.print} c="#0F0" />
      <Box r={{x: ROOM.doorway.x0, y: ROOM.doorway.y0, w: ROOM.doorway.x1 - ROOM.doorway.x0, h: ROOM.doorway.y1 - ROOM.doorway.y0}} c="#0FF" />
      {ROOM.chairs.map((c, k) => <Box key={k} r={{x: c.x0, y: c.y0, w: c.x1 - c.x0, h: c.y1 - c.y0}} c="#F0F" />)}
      <Box r={{x: ROOM.bounds.x0, y: ROOM.bounds.y0, w: ROOM.bounds.x1 - ROOM.bounds.x0, h: ROOM.bounds.y1 - ROOM.bounds.y0}} c="#FFF" />
      <line x1={-900} y1={ROOM.floor} x2={2900} y2={ROOM.floor} stroke="#0F0" strokeWidth={3} />
      <Pt x={ROOM.wipePoint.x} y={ROOM.wipePoint.y} c="#0F0" />
      {ROOM.photoFamily.faces.map((f, k) => <circle key={k} cx={f.x} cy={f.y} r={f.r} fill="none" stroke="#0FF" strokeWidth={2} />)}
      {/* a figure at the suggested scale, at the sideboard, for proportion */}
      <g transform={`translate(1020 ${ROOM.floor}) scale(${ROOM.figScale})`}>
        <Astronaut pose={ASTRO_IDLE} id="tfig" frame={0} glove="#EEF2F5" />
      </g>
      <g transform={`translate(-60 ${ROOM.floor}) scale(${ROOM.figScale})`}>
        <Astronaut pose={ASTRO_IDLE} id="tfig2" frame={0} glove="#EEF2F5" />
      </g>
    </Cam>
  </Svg>
);
const Wipe: React.FC = () => {
  const ws = [0, 0.3, 0.6, 1];
  const fr = ROOM.photoFamily;
  const s = 1.55;
  return (
    <Svg>
      {ws.map((w, k) => (
        <g key={k}>
          <clipPath id={`wc${k}`}><rect x={(k % 2) * 540} y={Math.floor(k / 2) * 480} width={540} height={480} /></clipPath>
          <g clipPath={`url(#wc${k})`}>
            <g transform={`translate(${(k % 2) * 540 + 270} ${Math.floor(k / 2) * 480 + 240}) scale(${s}) translate(${-(fr.x + fr.w / 2)} ${-(fr.y + fr.h / 2)})`}>
              <Room t={2 + w} id={`rw${k}`} era={1} clockMinutes={0} dustWipe={w} />
              <circle cx={wipeAt(w).x} cy={wipeAt(w).y} r={5} fill="#0F0" />
            </g>
          </g>
        </g>
      ))}
      {[0, 0.5].map((era, k) => (
        <g key={`e${k}`}>
          <clipPath id={`we${k}`}><rect x={k * 540} y={960} width={540} height={960} /></clipPath>
          <g clipPath={`url(#we${k})`}>
            <g transform={`translate(${k * 540 + 270} 1440) scale(1.1) translate(${-1440} ${-1120})`}>
              <Room t={1} id={`rwe${k}`} era={era} clockMinutes={0} />
            </g>
          </g>
        </g>
      ))}
    </Svg>
  );
};
const Family: React.FC = () => {
  const fr = ROOM.photoFamily;
  return (
    <Svg>
      <Cam cx={fr.x + fr.w / 2 + 20} cy={fr.y + fr.h / 2} s={1080 / 320}>
        <Room t={3} id="rf" era={1} clockMinutes={0} dustWipe={1} refl={<FaceRefl />} reflOp={0.8} />
      </Cam>
    </Svg>
  );
};
const ClockAlone: React.FC = () => (
  <Svg bg="#E4EDF1">
    {[0, 0.4, 0.8, 1].map((b, k) => (
      <WallClock key={k} x={270 + (k % 2) * 540} y={480 + Math.floor(k / 2) * 960} r={220} minutes={10 * 60 + 8 + k * 7} blur={b} era={k === 3 ? 1 : 0} id={`ca${k}`} />
    ))}
  </Svg>
);

/** registration of the photo rects (frames red, prints yellow/green), wipe path, faces, reflection spot */
const TestPhotos: React.FC = () => (
  <Svg>
    <Cam cx={1445} cy={1100} s={1080 / 640}>
      <Room t={0} id="rtp" era={1} clockMinutes={0} photoTint={0} photoGlass={0} photoView={<OpeningPlaceholder />} />
      <Box r={ROOM.photoFamily} c="#F00" />
      <Box r={ROOM.photoFamily.glass} c="#FF0" />
      <Box r={ROOM.photoParent} c="#F00" />
      <Box r={ROOM.photoParent.print} c="#FF0" />
      <Box r={ROOM.photoFriend} c="#F00" />
      <Box r={ROOM.photoFriend.print} c="#0F0" />
      <line x1={ROOM.sideboard.x0} y1={ROOM.sideboard.topBack} x2={ROOM.sideboard.x1} y2={ROOM.sideboard.topBack} stroke="#F80" strokeWidth={2} />
      <line x1={ROOM.sideboard.x0} y1={ROOM.sideboard.topFront} x2={ROOM.sideboard.x1} y2={ROOM.sideboard.topFront} stroke="#F80" strokeWidth={2} />
      <path d={Array.from({length: 21}, (_, k) => wipeAt(k / 20)).map((p, k) => `${k ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ')} fill="none" stroke="#0F0" strokeWidth={1.5} />
      <Pt x={ROOM.wipePoint.x} y={ROOM.wipePoint.y} c="#0F0" />
      {ROOM.photoFamily.faces.map((f, k) => <circle key={k} cx={f.x} cy={f.y} r={f.r} fill="none" stroke="#0FF" strokeWidth={1.5} />)}
      <circle cx={ROOM.photoParent.face.x} cy={ROOM.photoParent.face.y} r={ROOM.photoParent.face.r} fill="none" stroke="#0FF" strokeWidth={1.5} />
      <circle cx={ROOM.photoFamily.reflSpot.x} cy={ROOM.photoFamily.reflSpot.y} r={ROOM.photoFamily.reflSpot.r} fill="none" stroke="#F0F" strokeWidth={2} strokeDasharray="5 3" />
    </Cam>
  </Svg>
);

/** the window and clock as the 8.2 s pan sees them (era 0, placeholder yard through the glass) */
const WindowC: React.FC = () => (
  <Svg>
    <Cam cx={(ROOM.clock.x + ROOM.win.cx) / 2 + 60} cy={ROOM.win.cy + 40} s={1080 / 1000}>
      <Room t={0} id="rwin" era={0} clockMinutes={10 * 60 + 8} windowView={<YardPlaceholder />} />
    </Cam>
  </Svg>
);

/** the left of the room in the present with him walking in at the suggested scale (doorway, chair, clock) */
const Entry: React.FC = () => (
  <Svg>
    <Cam cx={330} cy={1180} s={1080 / 1000}>
      <Room t={4} id="re" era={1} clockMinutes={130} />
      {/* he steps out of the hall: drawn behind the doorway front */}
      <g transform={`translate(${-110} ${ROOM.floor}) scale(${ROOM.figScale})`}>
        <Astronaut pose={{...ASTRO_IDLE, stride: 0.6, legs: 0.8, e: {mouth: 'flat', lookX: 0.6}}} id="efig" frame={0} glove="#EEF2F5" />
      </g>
      <RoomDoorFront t={4} id="redf" era={1} />
    </Cam>
  </Svg>
);

/** him at ROOM.standAtPhoto reaching the wipe (glove at wipeAt(0.5)), era 1, dustWipe 0.5 */
const Reach: React.FC = () => {
  const s = ROOM.figScale, P = ROOM.standAtPhoto;
  const g = wipeAt(0.5);
  const armR = astroReach((g.x - P.x) / s, (g.y - P.y) / s, 1, 1);
  const g1 = wipeAt(1);
  const armR1 = astroReach((g1.x - P.x) / s, (g1.y - P.y) / s, 1, 1);
  return (
    <Svg>
      <Cam cx={1230} cy={1180} s={1080 / 820}>
        <Room t={5} id="rr" era={1} clockMinutes={0} dustWipe={0.5} />
        <g transform={`translate(${P.x} ${P.y}) scale(${s})`} opacity={0.35}>
          <Astronaut pose={{...ASTRO_IDLE, armR: armR1, e: {mouth: 'flat', lookX: 1}}} id="rfig1" frame={0} glove="#EEF2F5" />
        </g>
        <g transform={`translate(${P.x} ${P.y}) scale(${s})`}>
          <Astronaut pose={{...ASTRO_IDLE, armR, e: {mouth: 'flat', lookX: 1, lookY: 0.3}}} id="rfig" frame={0} glove="#EEF2F5" />
        </g>
      </Cam>
    </Svg>
  );
};

const comp = (id: string, c: React.FC) => <Composition key={id} id={id} component={c} durationInFrames={1} fps={30} width={1080} height={1920} />;
const Root: React.FC = () => (
  <>
    {comp('RoomPast', Past)}
    {comp('RoomPresent', Present)}
    {comp('RoomSideboard', Sideboard)}
    {comp('RoomClock', ClockC)}
    {comp('RoomTest', Test)}
    {comp('RoomWipe', Wipe)}
    {comp('RoomFamily', Family)}
    {comp('RoomClockSheet', ClockAlone)}
    {comp('RoomEntry', Entry)}
    {comp('RoomTestPhotos', TestPhotos)}
    {comp('RoomWindow', WindowC)}
    {comp('RoomReach', Reach)}
  </>
);
registerRoot(Root);
