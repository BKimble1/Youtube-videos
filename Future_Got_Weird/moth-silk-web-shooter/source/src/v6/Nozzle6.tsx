// V6 coaxial nozzle, drawn as a small machined device in the lab's world frame (so every view of it, wide or close,
// is the same object): a steel outer needle with the inner needle inside it, a cone, a hex collar, a body with a
// knurled grip band, a side port (the acetone line) and a rear fitting (the silk line). Seen a little from the front
// (three-quarter): the faces that look toward the tip show as narrow ellipses.
// The cutaway opens the body along its axis, rear to front, like a sectioned part: the cut walls show as hatched
// metal, the inner tube carries the silk solution in the centre, the outer channel carries acetone round it from the
// side port, and both run through the cone into the needle. The liquids flow (moving streaks and pressure pulses).
// TipExtrusion6: at the outlet the two streams come out together: a small bead builds, then a narrow jet is drawn
// out; the acetone sheath thins and leaves as droplets while the silk core sets from gold liquid to a white fibre.
import React from 'react';
import {shade} from './dc/color';
import {Deco, INK, Inked} from './dc/ink';
import {add, fmt, lerp, mul, P as Pt, V} from './dc/math';
import {Lin} from './dc/shade';
import {ACETONE, NZ, SILK, STEEL, nozFrame} from './LabArt6';

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};

/** profile along the axis (x from the tip toward the rear, world px) */
const X = {needle: NZ.needleLen, cone: NZ.needleLen + NZ.coneLen, collar0: 72, collar1: 84, knurl0: 112, knurl1: 150, port: NZ.portX};
const COLLAR_R = 13.8;
const REAR_LEN = 16;
const outerR = (x: number, len: number) => {
  if (x <= X.needle) return NZ.outerR;
  if (x <= X.cone) return lerp(NZ.outerR, NZ.bodyR, (x - X.needle) / NZ.coneLen);
  if (x >= X.collar0 && x <= X.collar1) return COLLAR_R;
  if (x >= len - REAR_LEN) return 8.2;
  return NZ.bodyR;
};
/** inner surface of the outer wall (the outer channel's outside) */
const wallIn = (x: number) => {
  if (x <= X.needle) return NZ.outerIn;
  if (x <= X.cone) return lerp(NZ.outerIn, NZ.bodyR - 2.4, (x - X.needle) / NZ.coneLen);
  return NZ.bodyR - 2.4;
};
/** the inner tube: outside and bore */
const tubeOut = (x: number) => (x <= X.needle ? NZ.innerR : x <= X.cone ? lerp(NZ.innerR, 2.8, (x - X.needle) / NZ.coneLen) : 2.8);
const tubeIn = (x: number) => (x <= X.needle ? NZ.innerIn : x <= X.cone ? lerp(NZ.innerIn, 1.9, (x - X.needle) / NZ.coneLen) : 1.9);

const samples = (x0: number, x1: number, n = 36) => Array.from({length: n + 1}, (_, i) => x0 + ((x1 - x0) * i) / n);

export const NozzleDetail: React.FC<{id: string; k: number; rear: V; tip: V; cut: number; silk: number; ace: number; t: number}> = ({id, k, rear, tip, cut, silk, ace, t}) => {
  const F = nozFrame(rear, tip);
  const {len} = F;
  const P = (x: number, y: number) => Pt(F.at(x, y));
  // silhouette (both sides), with the steps at the cone, collar and rear fitting
  const xs = [0, X.needle, X.cone, X.collar0 - 0.01, X.collar0, X.collar1, X.collar1 + 0.01, len - REAR_LEN - 0.01, len - REAR_LEN, len];
  const top = xs.map((x) => P(x, -outerR(x, len)));
  const bot = xs.map((x) => P(x, outerR(x, len))).reverse();
  const outline = `M${top.join(' L')} L${bot.join(' L')} Z`;
  const portBoss = `M${P(X.port - 7, NZ.bodyR - 1)} L${P(X.port - 7, NZ.bodyR + 6)} L${P(X.port - 5, NZ.bodyR + 8)} L${P(X.port + 5, NZ.bodyR + 8)} L${P(X.port + 7, NZ.bodyR + 6)} L${P(X.port + 7, NZ.bodyR - 1)} Z`;
  // the cutaway: the revealed part runs from the cut edge back to just short of the hand's grip at the rear
  const xRear = len - REAR_LEN - 6;
  const cx = lerp(xRear, -0.5, cut);
  const showCut = cut > 0.002;
  const xa = Math.max(0, cx);
  const fl = t * 30; // frames, for the flow animation
  // liquid fronts: the silk solution comes from the rear fitting along the inner tube; acetone enters at the side port
  // and fills the outer channel forward to the tip (and back to its closed rear end)
  const silkFront = lerp(len, -0.5, silk);
  const aceFront = lerp(X.port, -0.5, ace);
  const aceBack = lerp(X.port, xRear, Math.min(1, ace * 3));
  const band = (rOut: (x: number) => number, rIn: (x: number) => number, x0: number, x1: number, side: 1 | -1) => {
    const s = samples(x0, x1, 30);
    return `M${s.map((x) => P(x, side * rOut(x))).join(' L')} L${s
      .slice()
      .reverse()
      .map((x) => P(x, side * rIn(x)))
      .join(' L')} Z`;
  };
  const line = (x0: number, x1: number, y: (x: number) => number) => `M${samples(x1, x0, 40).map((x) => P(x, y(x))).join(' L')}`;
  const sectionClip = `M${P(xa, -COLLAR_R - 2)} L${P(xRear, -COLLAR_R - 2)} L${P(xRear, COLLAR_R + 2)} L${P(xa, COLLAR_R + 2)} Z`;
  const hatchId = `${id}-hatch`;
  const midAce = (x: number) => (wallIn(x) + tubeOut(x)) / 2;
  // the ink line thins as the camera closes in, so the outline never dominates the cutaway
  const inkW = k * Math.min(1, 2.5 * k);
  return (
    <g>
      <Inked w={2.4 * inkW}>
        <path d={portBoss} fill="#C9D4DC" />
      </Inked>
      <Inked w={2.6 * inkW}>
        <Lin id={`${id}-b`} d={outline} from={F.at(len / 2, -NZ.bodyR)} to={F.at(len / 2, NZ.bodyR)} stops={[[0, '#FFFFFF'], [0.35, '#E6ECF0'], [0.7, '#B9C7D2'], [1, '#8C9DAA']]} />
      </Inked>
      <Deco>
        {/* hex collar facets and its front face (seen three-quarter), knurled grip band, rear fitting ring */}
        <path d={`M${P(X.collar0 + 1, -COLLAR_R * 0.5)} L${P(X.collar1 - 1, -COLLAR_R * 0.5)} M${P(X.collar0 + 1, COLLAR_R * 0.45)} L${P(X.collar1 - 1, COLLAR_R * 0.45)}`} stroke={shade(STEEL, 0.6)} strokeWidth={fmt(0.9 * k)} />
        <ellipse cx={fmt(F.at(X.collar0, 0).x)} cy={fmt(F.at(X.collar0, 0).y)} rx={fmt(2.2)} ry={fmt(COLLAR_R)} transform={`rotate(${fmt(F.ang)} ${fmt(F.at(X.collar0, 0).x)} ${fmt(F.at(X.collar0, 0).y)})`} fill="#DDE5EA" stroke={INK} strokeWidth={fmt(1.2 * k)} />
        {Array.from({length: 13}).map((_, i) => {
          const x = X.knurl0 + ((X.knurl1 - X.knurl0) * i) / 12;
          return <path key={`kn${i}`} d={`M${P(x, -NZ.bodyR + 0.6)} L${P(x + 4, NZ.bodyR - 0.6)} M${P(x + 4, -NZ.bodyR + 0.6)} L${P(x, NZ.bodyR - 0.6)}`} stroke={shade(STEEL, 0.55)} strokeWidth={fmt(0.5 * k)} opacity={0.75} />;
        })}
        <path d={`M${P(X.knurl0, -NZ.bodyR)} L${P(X.knurl0, NZ.bodyR)} M${P(X.knurl1 + 4, -NZ.bodyR)} L${P(X.knurl1 + 4, NZ.bodyR)}`} stroke={INK} strokeWidth={fmt(0.9 * k)} />
        <path d={`M${P(len - REAR_LEN + 5, -8.2)} L${P(len - REAR_LEN + 5, 8.2)}`} stroke={shade(STEEL, 0.55)} strokeWidth={fmt(0.9 * k)} />
        {/* a long highlight along the body, a short one on the needle */}
        <path d={`M${P(X.cone + 2, -NZ.bodyR * 0.55)} L${P(len - REAR_LEN - 4, -NZ.bodyR * 0.55)}`} stroke="#FFFFFF" strokeWidth={fmt(1.6 * k)} strokeLinecap="round" opacity={0.85} />
        <path d={`M${P(2, -NZ.outerR * 0.5)} L${P(X.needle - 1, -NZ.outerR * 0.5)}`} stroke="#FFFFFF" strokeWidth={fmt(0.9 * k)} strokeLinecap="round" opacity={0.85} />
      </Deco>
      {/* the outlet's face: the needle rim, the acetone gap, the inner needle's rim, the silk bore */}
      <Deco>
        {(() => {
          const c = F.at(0, 0);
          const rot = `rotate(${fmt(F.ang)} ${fmt(c.x)} ${fmt(c.y)})`;
          const e = (r: number, fill: string, sw = 0.5) => <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(r * 0.36)} ry={fmt(r)} transform={rot} fill={fill} stroke={INK} strokeWidth={fmt(sw * k)} />;
          return (
            <g>
              {e(NZ.outerR, '#DCE4EA', 1.1)}
              {e(NZ.outerIn, ace > 0.95 ? ACETONE : '#5B6B76')}
              {e(NZ.innerR, '#C4D0D8')}
              {e(NZ.innerIn, silk > 0.97 ? SILK : '#4A5862')}
            </g>
          );
        })()}
      </Deco>
      {showCut && (
        <Deco>
          <defs>
            <clipPath id={`${id}-sc`}>
              <path d={sectionClip} />
            </clipPath>
            <pattern id={hatchId} patternUnits="userSpaceOnUse" width={2.2} height={2.2} patternTransform={`rotate(${fmt(F.ang + 45)})`}>
              <rect width={2.2} height={2.2} fill="#9AA9B4" />
              <path d="M0,0 L0,2.2" stroke="#6E7E8A" strokeWidth={0.6} />
            </pattern>
          </defs>
          <g clipPath={`url(#${id}-sc)`}>
            {/* the far half's inner surface behind the channels */}
            <path d={band((x) => wallIn(x), () => 0, 0, xRear, -1)} fill="#8C9EAB" />
            <path d={band((x) => wallIn(x), () => 0, 0, xRear, 1)} fill="#7D909D" />
            {/* outer channel: acetone, filling from the side port */}
            {ace > 0.001 &&
              ([-1, 1] as const).map((sd) => <path key={`ac${sd}`} d={band(wallIn, tubeOut, Math.max(0, aceFront), aceBack, sd)} fill={ACETONE} opacity={0.92} />)}
            {/* the side port's passage through the wall */}
            <path d={`M${P(X.port - 2.6, wallIn(X.port))} L${P(X.port - 2.6, NZ.bodyR + 7)} L${P(X.port + 2.6, NZ.bodyR + 7)} L${P(X.port + 2.6, wallIn(X.port))} Z`} fill={ace > 0.001 ? ACETONE : '#7D909D'} />
            {/* inner tube walls (cut) and its bore */}
            {([-1, 1] as const).map((sd) => <path key={`tw${sd}`} d={band(tubeOut, tubeIn, NZ.innerRecess, xRear, sd)} fill={`url(#${hatchId})`} stroke={INK} strokeWidth={fmt(0.35 * k)} />)}
            <path d={band(tubeIn, () => 0, NZ.innerRecess, xRear, -1)} fill="#66798A" />
            <path d={band(tubeIn, () => 0, NZ.innerRecess, xRear, 1)} fill="#66798A" />
            {silk > 0.001 && <path d={`${band(tubeIn, () => 0, Math.max(NZ.innerRecess, silkFront), xRear, -1)} ${band(tubeIn, () => 0, Math.max(NZ.innerRecess, silkFront), xRear, 1)}`} fill={SILK} />}
            {/* the flow: streaks carried toward the tip, faster in the narrow needle; long soft pressure pulses */}
            {silk > 0.001 &&
              [0, -0.55, 0.55].map((yy, i) => (
                <g key={`sf${i}`}>
                  <path d={line(Math.max(NZ.innerRecess, silkFront), xRear, (x) => yy * tubeIn(x))} fill="none" stroke={i === 0 ? '#FFF2C4' : '#C8962E'} strokeWidth={fmt(i === 0 ? 0.42 : 0.3)} strokeLinecap="round" strokeDasharray={i === 0 ? '6 9 2 7' : '3 11 5 6'} strokeDashoffset={fmt(-fl * 1.5 - i * 4)} opacity={0.9} />
                </g>
              ))}
            {silk > 0.001 && <path d={line(Math.max(NZ.innerRecess, silkFront), xRear, () => 0)} fill="none" stroke="#FFF8DA" strokeWidth={fmt(1.6)} strokeDasharray="5 55" strokeDashoffset={fmt(-fl * 2.2)} opacity={0.35} strokeLinecap="round" />}
            {ace > 0.001 &&
              ([-1, 1] as const).map((sd) =>
                [0.5, 0.25, 0.75].map((q, i) => (
                  <path
                    key={`af${sd}${i}`}
                    d={line(Math.max(0.5, aceFront), aceBack, (x) => sd * lerp(tubeOut(x), wallIn(x), q))}
                    fill="none"
                    stroke={i === 0 ? '#D2FBF6' : shade(ACETONE, 0.62)}
                    strokeWidth={fmt(i === 0 ? 0.55 : 0.35)}
                    strokeLinecap="round"
                    strokeDasharray={i === 0 ? '7 10 3 8' : '4 12 6 7'}
                    strokeDashoffset={fmt(-fl * 1.8 - i * 5 - (sd > 0 ? 3 : 0))}
                    opacity={0.9}
                  />
                )),
              )}
            {ace > 0.001 && ([-1, 1] as const).map((sd) => <path key={`ap${sd}`} d={line(Math.max(0.5, aceFront), aceBack, (x) => sd * midAce(x))} fill="none" stroke="#EFFFFC" strokeWidth={fmt(2.2)} strokeDasharray="6 48" strokeDashoffset={fmt(-fl * 2.6 + (sd > 0 ? 20 : 0))} opacity={0.3} strokeLinecap="round" />)}
            {/* the cut outer wall, both sides (hatched section faces) */}
            {([-1, 1] as const).map((sd) => <path key={`ow${sd}`} d={band((x) => outerR(x, len), wallIn, 0, xRear, sd)} fill={`url(#${hatchId})`} stroke={INK} strokeWidth={fmt(0.45 * k)} />)}
          </g>
          {/* the cut edge across the part */}
          {cx > 0.5 && <path d={`M${P(xa, -outerR(xa, len))} L${P(xa, outerR(xa, len))}`} stroke={INK} strokeWidth={fmt(1.1 * k)} />}
        </Deco>
      )}
    </g>
  );
};

/** the liquids leaving the outlet: bead, narrow jet, acetone sheath dispersing, the silk setting into a fibre */
export const TipExtrusion6: React.FC<{id: string; tip: V; ang: number; t: number; bead: number; ext: number; hard: number; len: number; k: number}> = ({id, tip, ang, t, bead, ext, hard, len: L0, k}) => {
  const a = (ang * Math.PI) / 180;
  const d = {x: Math.cos(a), y: Math.sin(a)};
  const n = {x: -d.y, y: d.x};
  const P = (x: number, y: number) => add(tip, add(mul(d, x), mul(n, y)));
  const fl = t * 30;
  const L = L0 * ext;
  // the bead: the two streams meet at the opening and bulge out before they are drawn away
  const b = bead * (1 - 0.65 * sm(ext * 4));
  const bR = lerp(NZ.innerIn, NZ.outerIn * 1.02, b);
  const bL = 3.6 * b;
  // thickness along the jet: swollen just past the outlet, narrowing quickly to a thin, nearly even strand; a slight
  // irregular wobble while it is still liquid that settles as it sets
  const setAt = (x: number) => sm((x - lerp(18, 4, hard)) / 22) * (0.25 + 0.75 * hard);
  const coreR = (x: number) => (NZ.innerIn * 1.3 * Math.exp(-x / 4) + 0.62 * (1 - Math.exp(-x / 4))) * (1 + 0.12 * (1 - setAt(x)) * Math.sin(x * 0.9 - fl * 0.8));
  const wob = (x: number) => 0.22 * (1 - setAt(x)) * Math.sin(x * 0.33 - fl * 0.5);
  const sheathR = (x: number) => (NZ.outerIn * 0.95) * Math.exp(-x / 7) + coreR(x) * 1.05;
  const N = 40;
  const xs = Array.from({length: N + 1}, (_, i) => (L * i) / N);
  const edge = (r: (x: number) => number, side: 1 | -1) => xs.map((x) => P(x, side * r(x) + wob(x)));
  const shape = (r: (x: number) => number) => `M${edge(r, -1).map(Pt).join(' L')} L${edge(r, 1).reverse().map(Pt).join(' L')} Z`;
  const gid = `${id}-g`;
  const g0 = P(0, 0);
  const g1 = P(Math.max(6, L), 0);
  const setOff = clamp01((lerp(20, 5, hard)) / Math.max(6, L));
  return (
    <g>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={fmt(g0.x)} y1={fmt(g0.y)} x2={fmt(g1.x)} y2={fmt(g1.y)}>
          <stop offset="0" stopColor={SILK} />
          <stop offset={fmt(clamp01(setOff * 0.6))} stopColor="#F5DC95" />
          <stop offset={fmt(clamp01(setOff * 1.4))} stopColor="#FBF6E8" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      {/* the bead at the opening: gold core under a teal skin */}
      {b > 0.02 && (
        <g>
          <ellipse cx={fmt(P(bL * 0.4, 0).x)} cy={fmt(P(bL * 0.4, 0).y)} rx={fmt(bL * 0.95 + 0.6)} ry={fmt(bR * 0.85 + 0.3)} transform={`rotate(${fmt(ang)} ${fmt(P(bL * 0.4, 0).x)} ${fmt(P(bL * 0.4, 0).y)})`} fill={ACETONE} opacity={0.55} />
          <ellipse cx={fmt(P(bL * 0.35, 0).x)} cy={fmt(P(bL * 0.35, 0).y)} rx={fmt(bL * 0.85 + 0.4)} ry={fmt(bR * 0.5)} transform={`rotate(${fmt(ang)} ${fmt(P(bL * 0.35, 0).x)} ${fmt(P(bL * 0.35, 0).y)})`} fill={SILK} stroke={INK} strokeWidth={fmt(0.25)} />
          <circle cx={fmt(P(bL * 0.25, -bR * 0.4).x)} cy={fmt(P(bL * 0.25, -bR * 0.4).y)} r={fmt(0.35 + 0.25 * b)} fill="#FFFFFF" opacity={0.8} />
        </g>
      )}
      {L > 0.6 && (
        <g>
          {/* the acetone sheath round the young jet, thinning away from the outlet */}
          <path d={shape(sheathR)} fill={ACETONE} opacity={0.4 * (1 - 0.5 * hard)} />
          <path d={shape(coreR)} fill={`url(#${gid})`} stroke={INK} strokeWidth={fmt(0.3)} strokeLinejoin="round" />
          {/* a moving highlight on the liquid part; fine surface marks where it has set */}
          <path d={`M${xs.slice(1).map((x) => Pt(P(x, -coreR(x) * 0.45 + wob(x)))).join(' L')}`} fill="none" stroke="#FFFFFF" strokeWidth={fmt(0.22)} strokeDasharray="3 5" strokeDashoffset={fmt(fl * 1.2)} opacity={0.85} strokeLinecap="round" />
          {xs.map((x, i) => {
            const s = setAt(x);
            if (i % 3 !== 1 || s < 0.4 || x > L - 1) return null;
            const c = P(x, wob(x));
            const e = P(x + 0.5, wob(x) + coreR(x) * 0.8);
            return <path key={`sk${i}`} d={`M${Pt(c)} L${Pt(e)}`} stroke="#D9D1BE" strokeWidth={fmt(0.14)} opacity={0.8 * s} />;
          })}
        </g>
      )}
      {/* solvent droplets leaving the sheath and drifting off */}
      {(L > 1 || b > 0.3) &&
        Array.from({length: 12}).map((_, i) => {
          const ph = (fl / 26 + i / 12) % 1;
          const x = 1.5 + ph * Math.min(26, 6 + L * 0.6);
          const side = i % 2 ? -1 : 1;
          const y = side * (NZ.outerIn * 0.9 + ph * (5 + (i % 3) * 1.5));
          const p = P(x, y);
          return <circle key={`dr${i}`} cx={fmt(p.x)} cy={fmt(p.y)} r={fmt((0.28 + 0.36 * (1 - ph)) * (0.7 + 0.3 * ((i * 5) % 3)))} fill={ACETONE} stroke={INK} strokeWidth={fmt(0.08)} opacity={0.8 * (1 - ph)} />;
        })}
      {void k}
    </g>
  );
};
