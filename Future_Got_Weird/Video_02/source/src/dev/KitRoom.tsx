import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {CAST} from '../components/cast';
import {ring} from '../lib/motion';
import {LAYOUT, PTS, PlanPt, crossesOccluder, figureMix, pathOf, ppmAt, project, rigAt, rigStyle, tiltAt, tokenAt} from '../lib/room';
import {RoomItem, RoomSet} from '../components/v02/RoomSet';
import {Character2, EXPR, IDLE2, reach2, withPose, type Pose2} from '../components/v02/Cast2';
import {HandheldSensor, SensorTop, facingOf, sensorPoint} from '../components/v02/HandheldSensor';
import {CheckerToken, GuesserToken} from '../components/v02/Tokens';

/**
 * Dev composition for the room set and projection (240 f).
 *  0-60   room view: the checker (operator) holds the HandheldSensor with its far face exactly on the projected sensor
 *         point S; the guesser stands hidden at H; partition nudge at 20.
 *  60-150 tilt 0 -> 1 (tiltAt, eased)
 *  150-240 plan view: overhead tokens, SensorTop at S, wall samples, the straight path S -> W3 -> H; second nudge at 195.
 *
 * The light path and the wall samples are painted in RoomSet's `backdrop`: the operator, the partition and the guesser
 * (painted later, in depth order) cover exactly the stretches they stand in front of, also while the partition wobbles.
 * No path splitting is needed for that (visibleRuns is for overlays painted above the set).
 */

// Sensor hold in the room view. With layout.json's S (0.95 m up, the light-path plane, 0.25 m in front of the operator
// toward the wall) and a 1.7 m chibi rig on the set's height scale (rigScale), S projects at the operator's chest (her
// chest is at ~0.95 m, her chin at ~1.21 m) at every tilt, so the box is held at chest height. At 0.6 of the prop's
// model size (~0.2 m wide, a realistic handheld) and upright, it sits below her face. The far face (emitter + detector)
// is placed exactly on S, so the light path starts on the prop.
const SENSOR_K = 0.6;
const SENSOR_ROT = 0; // deg

const rotate = (p: {x: number; y: number}, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return {x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a)};
};

export const KitRoom: React.FC = () => {
  const f = useCurrentFrame();
  const tilt = tiltAt(f, 60, 90);
  const wobble = ring(f, 20, 0.7, 0.12) + ring(f, 195, 0.7, 0.14) * 0.8;
  const mix = figureMix(tilt);

  // the one path of this dev comp; a path through the partition is a layout error: fail loudly in dev
  const W3 = PTS.W.W3;
  const path: PlanPt[] = [PTS.S, W3, PTS.H];
  if (crossesOccluder(PTS.S, W3) || crossesOccluder(W3, PTS.H)) throw new Error('KitRoom: S -> W3 -> H crosses the partition (check layout.json)');

  // operator: right hand on the grip, placed so that the sensor's far face lands on the projected S
  const op = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt);
  const S = project(PTS.S, tilt);
  const far = rotate(sensorPoint('farFace', SENSOR_K * op.scale), SENSOR_ROT);
  const pose0: Pose2 = withPose({...IDLE2, armsFront: 'R'}, {...EXPR.deadpan, lookX: 0.5, lookY: 0.45});
  // elbow -1: the elbow swings out and down to her right (the other branch folds it up across her face)
  const armR = reach2(op, pose0, 1, S.x - far.x, S.y - far.y, -1);
  const opPose: Pose2 = {...pose0, armR};
  const firing = f < 60 ? Math.max(0, Math.sin(((f - 4) / 18) * Math.PI * 2)) ** 3 : 0;
  const sensor = <HandheldSensor scale={SENSOR_K} rotate={SENSOR_ROT} skin={CAST.checker.skin} led={1} firing={firing} />;

  const hid = rigAt(LAYOUT.hidden.x, LAYOUT.hidden.z, tilt);
  const tokOp = tokenAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt);
  const tokH = tokenAt(LAYOUT.hidden.x, LAYOUT.hidden.z, tilt);
  const w3 = project(W3, tilt);

  const items: RoomItem[] = [
    {
      key: 'operator',
      x: LAYOUT.operator.x,
      z: LAYOUT.operator.z,
      w: 0.3,
      node: <Character2 look={CAST.checker} pose={opPose} frame={f} seed={3} x={op.x} y={op.y} scale={op.scale} life={0.35} holdR={sensor} style={rigStyle(tilt, op.scale)} />,
    },
    {
      key: 'hidden',
      x: LAYOUT.hidden.x,
      z: LAYOUT.hidden.z,
      w: 0.3,
      node: <Character2 look={CAST.guesser} pose={withPose(IDLE2, {...EXPR.smug, lookX: -0.4})} frame={f} seed={5} x={hid.x} y={hid.y} scale={hid.scale} style={rigStyle(tilt, hid.scale)} />,
    },
  ];

  const backdrop = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <path d={pathOf(path, tilt, undefined, false)} fill="none" stroke={C.saffronDeep} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      {LAYOUT.wallSamples.map((w) => {
        const q = project(PTS.W[w.id], tilt);
        return (
          <g key={w.id}>
            <circle cx={q.x} cy={q.y} r={9} fill={C.white} stroke={C.ink} strokeWidth={3.5} />
            {/* cream halo: the label stays clean where it crosses the wall's base line during the tilt */}
            <text x={q.x} y={q.y + 46} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={34} fill={C.inkSoft} stroke={C.cream} strokeWidth={7} strokeLinejoin="round" paintOrder="stroke">
              {w.id}
            </text>
          </g>
        );
      })}
    </svg>
  );

  return (
    <AbsoluteFill style={{background: C.paper}}>
      <RoomSet tilt={tilt} wobble={wobble} items={items} backdrop={backdrop}>
        {mix.token > 0.001 && (
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <CheckerToken asGroup x={tokOp.x} y={tokOp.y} size={2 * tokOp.r} scale={tokOp.scale} opacity={tokOp.opacity} facing={facingOf(w3.x - tokOp.x, w3.y - tokOp.y)} />
            <GuesserToken asGroup x={tokH.x} y={tokH.y} size={2 * tokH.r} scale={tokH.scale} opacity={tokH.opacity} facing={-90} />
            {/* the sensor glyph sits on S itself (the start of the path) at every tilt */}
            <SensorTop asGroup x={S.x} y={S.y} size={0.22 * ppmAt(tilt)} facing={facingOf(w3.x - S.x, w3.y - S.y)} opacity={mix.token} scale={tokOp.scale} />
          </svg>
        )}
      </RoomSet>
      <div style={{position: 'absolute', left: 24, bottom: 18, fontFamily: F.mono, fontSize: 30, color: C.inkMuted}}>
        KitRoom · frame {f} · tilt {tilt.toFixed(2)}
      </div>
    </AbsoluteFill>
  );
};
