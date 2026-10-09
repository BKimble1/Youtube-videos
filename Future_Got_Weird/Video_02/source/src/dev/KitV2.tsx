import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, F, OUTLINE} from '../theme';
import {E, kf, tw} from '../lib/motion';
import {QuestionTitle} from '../components/v2k/QuestionTitle';
import {Chip, SubLabel, TeachLabel} from '../components/v2k/Labels';
import {EvidenceCard, EVIDENCE} from '../components/v2k/EvidenceCard';
import {ArrivalTimeline, TL_GEOM, fitTimeline, timelinePoint} from '../components/v2k/ArrivalTimeline';
import {RealTrackBoard, replayIndex} from '../components/v2k/RealTrackBoard';
import {ZoneBox} from '../components/v02/S3_ZoneBox';

/**
 * Dev composition for the v2 kit (420 frames, 14 s). Each component steps through its props in turn:
 *   0–60     labels: QuestionTitle (0–34 normal; 34–60 an over-long line, shrunk to fit), TeachLabel with a leader,
 *            SubLabel, the five chips and a wrapped chip, over a busy background (halo check)
 *   60–90    EvidenceCard: headline, 3×3 zone icon slot, source line, corner tag, placeholder child
 *   90–184   ArrivalTimeline (V2.2 then V8.2): axis, wall echo, hidden echo, labels, bracket, chip, ring, hiddenScale → 0.4
 *   184–232  ArrivalTimeline (V4.1): route strip, pulse thinning at each bounce, route labels, "far weaker" chip
 *   232–262  ArrivalTimeline (V3.4 then V2.2 → V2.3): one tick, then the chart shrinks into a display (fitTimeline)
 *   262–420  RealTrackBoard: replay from index 6 on frame 262 (every 2nd data frame), labels, brighten, 5 % push,
 *            then the V10.2 column (items, counter, chip)
 */

const SEG = {labels: 0, card: 60, tl: 90, route: 184, tick: 232, shrink: 246, board: 262, end: 420} as const;

export const KitV2: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {f < SEG.card && <LabelsDemo f={f} />}
      {f >= SEG.card && f < SEG.tl && <CardDemo f={f} />}
      {f >= SEG.tl && f < SEG.board && <TimelineDemo f={f} />}
      {f >= SEG.board && <BoardDemo f={f} />}
      <div style={{position: 'absolute', right: 24, bottom: 18, fontFamily: F.mono, fontSize: 22, color: C.inkMuted}}>{`KitV2 · f ${f}`}</div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ labels */

const LabelsDemo: React.FC<{f: number}> = ({f}) => {
  const target = {x: 1180, y: 330};
  return (
    <AbsoluteFill>
      {/* a busy background to check the halo: a teal block, a coral bar and an ink line behind the labels */}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <rect x={60} y={40} width={900} height={120} fill={C.tealLight} />
        <rect x={250} y={360} width={1000} height={70} fill={C.teal} />
        <path d="M 80 470 L 1800 520" stroke={C.ink} strokeWidth={OUTLINE} />
        <rect x={1140} y={290} width={80} height={80} rx={14} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
      </svg>
      <QuestionTitle text="What survives the bounce?" from={0} to={34} frame={f} />
      <QuestionTitle text="How does a delay become a location, and why does a plain wall work at all?" from={34} to={60} frame={f} />
      <TeachLabel x={300} y={420} opacity={tw(f, 4, 6, E.linear)} leader={{...target, t: tw(f, 8, 8), dot: true}}>
        time-of-flight sensor
      </TeachLabel>
      <SubLabel x={300} y={520} opacity={tw(f, 10, 6, E.linear)}>
        times its own light's round trip
      </SubLabel>
      <TeachLabel x={1780} y={640} anchor="end" valign="middle" opacity={tw(f, 12, 6, E.linear)} highlight={Math.sin(Math.PI * tw(f, 20, 20, E.linear))}>
        brighten once
      </TeachLabel>
      {['illustration', 'simplified picture', 'illustrative', 'our analogy', 'sped up'].map((s, i) => (
        <Chip key={s} x={140 + [0, 270, 620, 870, 1150][i]} y={740} size={i === 4 ? 34 : 30} opacity={tw(f, 14 + i * 2, 4, E.linear)}>
          {s}
        </Chip>
      ))}
      <Chip x={140} y={820} size={30} maxWidth={620} opacity={tw(f, 24, 6, E.linear)}>
        our check: their code + their data → matched their saved results · a software check, not a new experiment
      </Chip>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ evidence card */

const CardDemo: React.FC<{f: number}> = ({f}) => {
  const g = f - SEG.card;
  return (
    <EvidenceCard
      icon={<ZoneBox x={0} y={0} size={96} listening={0.15} centre={1} />}
      iconT={tw(g, 4, 6, E.linear)}
      source="authors' released raw counts · different sensor: 3×3 zones · centre zone"
      sourceT={tw(g, 8, 6, E.linear)}
      tag="example tag"
      tagT={tw(g, 12, 6, E.linear)}
    >
      <div style={{position: 'absolute', left: EVIDENCE.content.x0, top: EVIDENCE.content.y0, width: EVIDENCE.content.x1 - EVIDENCE.content.x0, height: EVIDENCE.content.y1 - EVIDENCE.content.y0, border: `3px dashed ${C.inkMuted}`, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 48, color: C.inkMuted}}>
        children: the plot (EVIDENCE.content)
      </div>
    </EvidenceCard>
  );
};

/* ------------------------------------------------------------------ arrival timeline */

const TimelineDemo: React.FC<{f: number}> = ({f}) => {
  const T0 = SEG.tl;
  if (f < SEG.route) {
    // V2.2 (and V8.2's weak-laser shrink at the end)
    return (
      <ArrivalTimeline
        axis={tw(f, T0, 12)}
        wall={tw(f, T0 + 10, 12, E.linear)}
        hidden={tw(f, T0 + 22, 12, E.linear)}
        labels={[tw(f, T0 + 16, 6, E.linear), tw(f, T0 + 30, 6, E.linear)]}
        bracket={tw(f, T0 + 38, 14, E.linear)}
        notToScale={tw(f, T0 + 44, 6, E.linear)}
        ring={tw(f, T0 + 58, 14, E.inOut)}
        hiddenScale={kf(f, [
          [T0 + 76, 1],
          [T0 + 90, 0.4],
        ])}
      />
    );
  }
  if (f < SEG.tick) {
    // V4.1: route strip, pulse, route labels
    const R0 = SEG.route;
    return (
      <ArrivalTimeline
        axis={1}
        routeStrip={tw(f, R0, 16, E.linear)}
        routePulse={tw(f, R0 + 12, 26, E.linear)}
        wall={tw(f, R0 + 18, 10, E.linear)}
        hidden={tw(f, R0 + 36, 10, E.linear)}
        routeLabels={['1 bounce', '3 bounces']}
        routeLabelsT={[tw(f, R0 + 24, 6, E.linear), tw(f, R0 + 42, 6, E.linear)]}
        ring={tw(f, R0 + 40, 8, E.inOut)}
        notToScale={tw(f, R0 + 44, 4, E.linear)}
        notToScaleText="not to scale · far weaker"
      />
    );
  }
  // V3.4 tick, then the V2.2 → V2.3 shrink into a display
  const k = tw(f, SEG.shrink, 14, E.inOut);
  const target = fitTimeline({x: 1180, y: 520, w: 420});
  const place = {x: target.x * k, y: target.y * k, layoutScale: 1 + (target.layoutScale - 1) * k};
  const disp = {x: 1160, y: 500, w: 460, h: 270};
  const bump = timelinePoint({x: TL_GEOM.bump.x, y: TL_GEOM.axis.y}, place);
  return (
    <AbsoluteFill>
      {k > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
          <rect x={disp.x - 30} y={disp.y - 30} width={disp.w + 60} height={disp.h + 90} rx={34} fill={C.teal} stroke={C.ink} strokeWidth={OUTLINE} />
          <rect x={disp.x} y={disp.y} width={disp.w} height={disp.h} rx={14} fill={C.ink} />
        </svg>
      )}
      <ArrivalTimeline axis={1} wall={1} tick={tw(f, SEG.tick, 10, E.linear)} bg={k > 0 ? 'card' : true} {...place} />
      {k >= 1 && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
          <circle cx={bump.x} cy={bump.y} r={6} fill={C.coral} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ real track board */

const BoardDemo: React.FC<{f: number}> = ({f}) => {
  const B0 = SEG.board;
  const idx = replayIndex(f, B0);
  return (
    <RealTrackBoard
      idx={idx}
      sensorLabel={tw(f, B0 + 4, 6, E.linear)}
      blocked={tw(f, B0 + 8, 14, E.linear)}
      blockedLabel={tw(f, B0 + 18, 6, E.linear)}
      dotLabel={tw(f, B0 + 28, 6, E.linear)}
      labelBrighten={tw(f, B0 + 42, 20, E.linear)}
      push={f < B0 + 100 ? tw(f, B0 + 38, 60, E.linear) : 0}
      pushFocusIdx={replayIndex(B0 + 38, B0)}
      column={tw(f, B0 + 102, 20, E.linear)}
      columnItems={[
        {text: 'ST sensor kit · 16 zones · held still · not the phone-grade device', t: tw(f, B0 + 122, 4, E.linear)},
        {text: "under US$100 (authors' figure)", t: tw(f, B0 + 130, 4, E.linear)},
        {text: 'setup: flat wall + empty-room scan first', t: tw(f, B0 + 138, 4, E.linear)},
      ]}
      counter={tw(f, B0 + 126, 4, E.linear)}
      chip={{text: 'our check: their code + their data → matched their saved results · a software check, not a new experiment', t: tw(f, B0 + 146, 4, E.linear)}}
    />
  );
};
