import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, F, OUTLINE} from '../theme';
import {Character, IDLE, reach} from '../components/Character';
import {CAST} from '../components/cast';
import {ring} from '../lib/motion';
import {LAYOUT, PTS, PlanPt, crossesOccluder, figureMix, isHiddenByOccluder, project, rigAt, rigStyle, tiltAt, tokenAt, viewAt, projectWith} from '../lib/room';
import {RoomItem, RoomSet} from '../components/v02/RoomSet';

/**
 * Dev composition for the room set and projection.
 *  0-60   room view: checker (operator) holding a placeholder sensor dot, guesser (hidden), partition nudge at 20
 *  60-150 tilt 0 -> 1
 *  150-240 plan view: placeholder tokens, wall samples, one straight path S -> W3 -> H (thin line; split where the
 *          partition hides it in the room view, to check layering)
 */

/** Visible runs of a 3D polyline (parts hidden by the partition removed). */
const visibleRuns = (pts: PlanPt[], tilt: number) => {
  const s = viewAt(tilt);
  const runs: string[] = [];
  let cur: string[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const N = 80;
    for (let k = 0; k <= N; k++) {
      if (i > 0 && k === 0) continue;
      const u = k / N;
      const p = {x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, h: (a.h ?? 0) + ((b.h ?? 0) - (a.h ?? 0)) * u};
      if (isHiddenByOccluder(p, tilt)) {
        if (cur.length > 1) runs.push(cur.join(' '));
        cur = [];
        continue;
      }
      const q = projectWith(s, p);
      cur.push(`${cur.length ? 'L' : 'M'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`);
    }
  }
  if (cur.length > 1) runs.push(cur.join(' '));
  return runs;
};

export const KitRoom: React.FC = () => {
  const f = useCurrentFrame();
  const tilt = tiltAt(f, 60, 90);
  const wobble = ring(f, 20, 0.7, 0.12) + ring(f, 195, 0.7, 0.14) * 0.8;

  const op = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt);
  const hid = rigAt(LAYOUT.hidden.x, LAYOUT.hidden.z, tilt);
  const sensor = project(PTS.S, tilt);
  const armR = reach({x: op.x, y: op.y, scale: op.scale}, 1, sensor.x, sensor.y + 6);
  const mix = figureMix(tilt);
  const tokOp = tokenAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt);
  const tokH = tokenAt(LAYOUT.hidden.x, LAYOUT.hidden.z, tilt);

  const items: RoomItem[] = [
    {
      key: 'operator',
      x: LAYOUT.operator.x,
      z: LAYOUT.operator.z,
      w: 0.3,
      node: (
        <>
          <Character look={CAST.checker} pose={{...IDLE, armR, lookX: 0.6, lookY: -0.3, mouth: 'flat'}} frame={f} seed={3} x={op.x} y={op.y} scale={op.scale} style={rigStyle(tilt, op.scale)} />
          {mix.rig > 0.001 && (
            <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: mix.rig}}>
              <circle cx={sensor.x} cy={sensor.y} r={13} fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE} />
            </svg>
          )}
        </>
      ),
    },
    {
      key: 'hidden',
      x: LAYOUT.hidden.x,
      z: LAYOUT.hidden.z,
      w: 0.3,
      node: <Character look={CAST.guesser} pose={{...IDLE, mouth: 'smirk', lookX: -0.4}} frame={f} seed={5} x={hid.x} y={hid.y} scale={hid.scale} style={rigStyle(tilt, hid.scale)} />,
    },
  ];

  const W3 = PTS.W.W3;
  const path: PlanPt[] = [PTS.S, W3, PTS.H];
  const blocked = crossesOccluder(PTS.S, W3) || crossesOccluder(W3, PTS.H);
  const runs = visibleRuns(path, tilt);
  const pathOp = blocked ? 0 : 1;

  // light path and wall samples live on the room shell (backdrop): the people and the partition, painted later in
  // depth order, cover them exactly where they stand in front (the path runs behind the operator's head and behind
  // the partition's far end in the room view).
  const backdrop = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g opacity={pathOp}>
        {runs.map((r, i) => (
          <path key={i} d={r} fill="none" stroke={C.saffronDeep} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </g>
      {LAYOUT.wallSamples.map((w) => {
        const q = project(PTS.W[w.id], tilt);
        return (
          <g key={w.id}>
            <circle cx={q.x} cy={q.y} r={9} fill={C.white} stroke={C.ink} strokeWidth={3.5} />
            <text x={q.x} y={q.y + 40} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={26} fill={C.inkSoft}>
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
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {/* tokens (placeholders; the cast agent designs the real ones) */}
          {mix.token > 0.001 && (
            <g opacity={mix.token}>
              <g transform={`translate(${tokOp.x} ${tokOp.y}) scale(${tokOp.scale})`}>
                <circle r={tokOp.r} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
                <circle r={tokOp.r * 0.55} fill="#8A8A93" stroke={C.ink} strokeWidth={3} />
              </g>
              <g transform={`translate(${tokH.x} ${tokH.y}) scale(${tokH.scale})`}>
                <circle r={tokH.r} fill={C.white} stroke={C.ink} strokeWidth={OUTLINE} />
                <circle r={tokH.r * 0.55} fill="#C0392B" stroke={C.ink} strokeWidth={3} />
              </g>
              {(() => {
                const q = project(PTS.S, tilt);
                return <circle cx={q.x} cy={q.y} r={10} fill={C.saffron} stroke={C.ink} strokeWidth={3.5} />;
              })()}
            </g>
          )}
        </svg>
      </RoomSet>
      <div style={{position: 'absolute', left: 24, bottom: 18, fontFamily: F.mono, fontSize: 24, color: C.inkMuted}}>
        KitRoom · frame {f} · tilt {tilt.toFixed(2)}
      </div>
    </AbsoluteFill>
  );
};
