// Test sheet for the surgeon / instruments / room module (src/art/surgeon.tsx, instruments.tsx, room.tsx).
// Each state is drawn through the camera Layer system: room z +600, table z +40, SurgeonBack z 0, a simple
// placeholder patient arm z 0 (test only), DrapeOverArm z 0, SurgeonFront (hands + instruments) z -6.
// Props: st = 'a'..'h' for one full-size frame, or 'sheet' for a 3 x 3 contact sheet.
import React from 'react';
import {Composition, registerRoot, AbsoluteFill} from 'remotion';
import {Cam, Layer} from '../camera';
import {C1, C2, C3, jag, skinBorders, INCISION, fingerChain, FINGERS, thumbChain, THUMB} from '../art/anatomy';
import {closed, open, pt, P} from '../core/geo';
import {C, INK} from '../art/palette';
import {SurgeonBack, SurgeonFront, SurgeonState, SURGEON_DEFAULT} from '../art/surgeon';
import {RoomBack, HandTable, DrapeOverArm} from '../art/room';

const PlaceholderBone: React.FC = () => (
  <g>
    <rect x={-13} y={-60} width={26} height={140} fill={C.bone} />
    <rect x={-13} y={-60} width={9} height={140} fill={C.boneLit} opacity={0.5} />
    {[C1, C2, C3].map((c, i) => (
      <path key={i} d={open(jag(c), 0)} fill="none" stroke="#3A1A12" strokeWidth={0.55} />
    ))}
  </g>
);

const PlaceholderArm: React.FC<{id: string; incision?: boolean}> = ({id, incision = true}) => {
  const L: P[] = [], R: P[] = [];
  for (let y = 600; y >= -70; y -= 10) {
    const [l, r] = skinBorders(y);
    L.push(pt(l, y));
    R.push(pt(r, y));
  }
  const outline = [...R, ...[...L].reverse()];
  return (
    <g>
      {FINGERS.map((d, i) => {
        const ch = fingerChain(d, 0.25);
        return <path key={i} d={open([d.base, ...ch], 0.8)} fill="none" stroke={INK} strokeWidth={d.w * 2.2 + 1.6} strokeLinecap="round" />;
      })}
      <path d={open([THUMB.base, ...thumbChain(0.2)], 0.8)} fill="none" stroke={INK} strokeWidth={17.6} strokeLinecap="round" />
      <path d={closed(outline, 0.6)} fill={C.skin} stroke={INK} strokeWidth={1.6} />
      {FINGERS.map((d, i) => {
        const ch = fingerChain(d, 0.25);
        return <path key={i} d={open([d.base, ...ch], 0.8)} fill="none" stroke={C.skin} strokeWidth={d.w * 2.2} strokeLinecap="round" />;
      })}
      <path d={open([THUMB.base, ...thumbChain(0.2)], 0.8)} fill="none" stroke={C.skin} strokeWidth={16} strokeLinecap="round" />
      {incision && (
        <g>
          <ellipse cx={INCISION.c.x} cy={INCISION.c.y} rx={INCISION.rx} ry={INCISION.ry} fill="#5A0A16" stroke={INK} strokeWidth={1} />
          <g transform="translate(0.5 0)">
            <clipPath id={`${id}-inc`}>
              <ellipse cx={INCISION.c.x} cy={INCISION.c.y} rx={INCISION.rx - 1.5} ry={INCISION.ry - 1.5} />
            </clipPath>
            <g clipPath={`url(#${id}-inc)`}>
              <PlaceholderBone />
            </g>
          </g>
        </g>
      )}
    </g>
  );
};

type Spec = {c: Cam; s?: SurgeonState; table: 'drape' | 'followup'; boneOnly?: boolean; drapeOver?: boolean};
const S0 = SURGEON_DEFAULT;
const B: Cam = {x: 110, y: -80, w: 470, k: 0.86, focus: 0};
const STATES: Record<string, Spec> = {
  a: {c: {x: -1, y: -1, w: 30, k: 1, focus: 0}, s: {...S0, k: 1}, table: 'drape', boneOnly: true},
  b: {c: {x: 20, y: -30, w: 120, k: 0.95}, s: {...S0, k: 0.95}, table: 'drape'},
  c: {c: B, s: {...S0, face: {...S0.face, focus: 0.6}}, table: 'drape', drapeOver: true},
  d: {c: B, s: {...S0, face: {focus: 0.1, smile: 1, gx: -0.45, gy: 0.7, blink: 0}}, table: 'drape', drapeOver: true},
  e: {
    c: {x: -8, y: -60, w: 250, k: 0.9},
    s: {...S0, k: 0.9, app: {...S0.app, tip: pt(40, -60), press: 0.6, gel: 0.2}, clamp: {...S0.clamp, open: 1, lift: 0.7}, appHeld: 1, clampHeld: 1},
    table: 'drape',
    drapeOver: true,
  },
  f: {c: {x: -8, y: -70, w: 180, k: 1}, table: 'followup'},
  // extra QA states: both hands released (back toward the body), and a lean
  g: {c: B, s: {...S0, appHeld: 0, clampHeld: 0, app: {...S0.app, tip: pt(70, -120)}, clamp: {...S0.clamp, lift: 1}}, table: 'drape', drapeOver: true},
  h: {c: B, s: {...S0, lean: 6, face: {...S0.face, blink: 1}}, table: 'drape', drapeOver: true},
  i: {c: {x: 60, y: -20, w: 260, k: 0.88}, s: {...S0, k: 0.88}, table: 'drape', drapeOver: true},
  // the ECU with the focus on the instruments' layer (crisp detail check)
  j: {c: {x: -1, y: -1, w: 30, k: 1, focus: -6}, s: {...S0, k: 1}, table: 'drape', boneOnly: true},
  // the clinical camera with half the eye-smile
  k: {c: B, s: {...S0, face: {focus: 0.2, smile: 0.55, gx: -0.45, gy: 0.7, blink: 0}}, table: 'drape', drapeOver: true},
  // QA: a very wide camera that sees past the drape's edges into the room backdrop
  r: {c: {x: 0, y: 0, w: 2600, k: 0.86}, table: 'drape', drapeOver: true},
};

const Frame: React.FC<{sp: Spec; id: string}> = ({sp, id}) => {
  const c = sp.c;
  return (
    <AbsoluteFill style={{background: C.room, overflow: 'hidden'}}>
      <Layer c={c} z={600}>
        <RoomBack id={`${id}-rm`} t={0} />
      </Layer>
      <Layer c={c} z={40}>
        <HandTable id={`${id}-tb`} variant={sp.table} />
      </Layer>
      {sp.s && !sp.boneOnly && (
        <Layer c={c} z={0}>
          <SurgeonBack id={`${id}-sb`} s={sp.s} />
        </Layer>
      )}
      <Layer c={c} z={0}>
        {sp.boneOnly ? (
          <g>
            <rect x={-40} y={-80} width={80} height={160} fill="#5A0A16" />
            <PlaceholderBone />
          </g>
        ) : (
          <PlaceholderArm id={`${id}-pa`} incision={sp.table === 'drape'} />
        )}
      </Layer>
      {sp.drapeOver && (
        <Layer c={c} z={0}>
          <DrapeOverArm id={`${id}-do`} />
        </Layer>
      )}
      {sp.s && (
        <Layer c={c} z={-6}>
          <SurgeonFront id={`${id}-sf`} s={sp.s} />
        </Layer>
      )}
    </AbsoluteFill>
  );
};

const Test: React.FC<{st: string}> = ({st}) => {
  if (st === 'sheet') {
    const ks = Object.keys(STATES).slice(0, 9);
    return (
      <AbsoluteFill style={{background: '#111'}}>
        {ks.map((k, i) => (
          <div key={k} style={{position: 'absolute', left: (i % 3) * 360, top: Math.floor(i / 3) * 640, width: 1080, height: 1920, transform: 'scale(0.3333)', transformOrigin: '0 0', overflow: 'hidden'}}>
            <Frame sp={STATES[k]} id={`f${k}`} />
          </div>
        ))}
      </AbsoluteFill>
    );
  }
  return <Frame sp={STATES[st]} id={`f${st}`} />;
};

registerRoot(() => <Composition id="Surgeon" component={Test} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{st: 'sheet'}} />);
