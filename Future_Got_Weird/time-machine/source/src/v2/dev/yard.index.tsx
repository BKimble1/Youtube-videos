// Dev entry for the V2 yard module: YardD0 / YardMid / YardD1 / YardWinter (wide framing of x 600..1950),
// YardWipe (the foreground trunk covering the centre band), YardWipeSheet (the wipe pieces across camX),
// YardClose (CAM_CLOSE-like two-shot at the gate with the figures at scale 0.62, D 0 and D 1), YardDoorGate
// (door and gate open), YardSeasons (the tree across the season cycle and growth).
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {Astronaut, ASTRO_IDLE, Friend, GLOVE} from '../../art/figures';
import {FG, foregroundCover, foregroundCoverRange, seasonLook, Yard, YARD, YardForeground, yardPath, YardTree} from '../yard';

const Svg: React.FC<{bg?: string; children: React.ReactNode}> = ({bg = '#E9F1F4', children}) => (
  <AbsoluteFill style={{background: bg}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">{children}</svg>
  </AbsoluteFill>
);
const Cam: React.FC<{x: number; y: number; z: number; children: React.ReactNode}> = ({x, y, z, children}) => (
  <g transform={`translate(540 960) scale(${z}) translate(${-x} ${-y})`}>{children}</g>
);
const WIDE = {x: 1275, y: 900, z: 1080 / 1350};

const Wide: React.FC<{D: number; season: number; t?: number; light?: number}> = ({D, season, t = 0, light = 0}) => (
  <Svg>
    <Cam {...WIDE}>
      <Yard D={D} season={season} t={t} id="yw" light={light} />
    </Cam>
  </Svg>
);

const Figures: React.FC<{age: number; k: string}> = ({age, k}) => {
  const R = YARD.reunion, s = YARD.figScale;
  return (
    <g>
      <g transform={`translate(${R.astroX} ${R.y}) scale(${s})`}>
        <Astronaut pose={ASTRO_IDLE} id={`${k}a`} frame={0} glove={GLOVE} />
      </g>
      <g transform={`translate(${R.friendX} ${R.y}) scale(${s})`}>
        <Friend age={age} pose={{armL: {a: 8, b: 10}, armR: {a: 8, b: 10}, e: {mouth: 'soft'}}} id={`${k}f`} facing={-1} green />
      </g>
    </g>
  );
};

/** two stacked half-height views of the close two-shot (D 0 young friend, D 1 old friend) */
const Close: React.FC = () => {
  const z = 2.0;
  const cx = 1215, cy = 1395;
  return (
    <Svg>
      {[0, 1].map((i) => (
        <g key={i}>
          <clipPath id={`cl${i}`}><rect x={0} y={i * 960} width={1080} height={958} /></clipPath>
          <g clipPath={`url(#cl${i})`}>
            <g transform={`translate(0 ${i * 960 - 480})`}>
              <Cam x={cx} y={cy} z={z}>
                <Yard D={i} season={i ? 0.15 : 0.1} t={0} id={`yc${i}`} />
                <Figures age={i} k={`c${i}`} />
              </Cam>
            </g>
          </g>
        </g>
      ))}
      <rect x={0} y={957} width={1080} height={6} fill="#162A32" />
    </Svg>
  );
};

const DoorGate: React.FC = () => (
  <Svg>
    {[0, 1].map((i) => (
      <g key={i}>
        <clipPath id={`dg${i}`}><rect x={0} y={i * 960} width={1080} height={958} /></clipPath>
        <g clipPath={`url(#dg${i})`}>
          <g transform={`translate(0 ${i * 960 - 480})`}>
            <Cam x={1360} y={1330} z={1.45}>
              <Yard D={0.3 + 0.5 * i} season={0.3 + 0.25 * i} t={1} id={`yd${i}`} gateOpen={i ? 1 : 0.5} doorOpen={i ? 1 : 0.45} light={i ? 0.8 : 0} />
              {/* feet markers along the garden path */}
              {[0, 0.25, 0.5, 0.75, 1].map((u) => {
                const p = yardPath(u);
                return <circle key={u} cx={p.x} cy={p.y} r={6} fill="#E00" stroke="#000" strokeWidth={1.5} />;
              })}
            </Cam>
          </g>
        </g>
      </g>
    ))}
    <rect x={0} y={957} width={1080} height={6} fill="#162A32" />
  </Svg>
);

const WIPE_Y = 1300;
const Wipe: React.FC<{camX: number; D?: number; season?: number}> = ({camX, D = 0.5, season = 0.55}) => (
  <Svg>
    <Cam x={camX} y={WIPE_Y} z={FG.zoom}>
      <Yard D={D} season={season} t={0} id="yw" />
    </Cam>
    <YardForeground camX={camX} t={0} D={D} season={season} id="fg" />
    {/* the centre band (dev overlay) */}
    <rect x={FG.band.x0} y={4} width={FG.band.x1 - FG.band.x0} height={1912} fill="none" stroke="#E00" strokeWidth={3} strokeDasharray="12 10" />
  </Svg>
);

/** 3 x 3 mini frames across camX: the trunk passing, then the leaves */
const WipeSheet: React.FC = () => {
  const tr = foregroundCoverRange('trunk'), lr = foregroundCoverRange('leaves');
  const xs = [FG.trunkX - 180, FG.trunkX - 70, (tr[0] + tr[1]) / 2, FG.trunkX + 70, FG.trunkX + 180, FG.leavesX - 90, (lr[0] + lr[1]) / 2, FG.leavesX + 90, FG.leavesX + 200];
  const seasons = [0.55, 0.55, 0.55, 0.55, 0.15, 0.8, 0.8, 0.8, 0.3];
  return (
    <Svg bg="#162A32">
      {xs.map((cx, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const cov = foregroundCover(cx);
        return (
          <g key={i} transform={`translate(${col * 360 + 4} ${row * 640 + 4}) scale(${352 / 1080})`}>
            <clipPath id={`ws${i}`}><rect x={0} y={0} width={1080} height={1920} /></clipPath>
            <g clipPath={`url(#ws${i})`}>
              <rect x={0} y={0} width={1080} height={1920} fill="#E9F1F4" />
              <Cam x={cx} y={WIPE_Y} z={FG.zoom}>
                <Yard D={0.5} season={seasons[i]} t={i * 0.3} id={`wsy${i}`} />
              </Cam>
              <YardForeground camX={cx} t={i * 0.3} D={0.5} season={seasons[i]} id={`wsf${i}`} />
              <rect x={FG.band.x0} y={4} width={FG.band.x1 - FG.band.x0} height={1912} fill="none" stroke="#E00" strokeWidth={6} strokeDasharray="20 16" />
              {/* coverage bar (dev only) */}
              <rect x={40} y={1820} width={1000} height={50} fill="#162A32" />
              <rect x={40} y={1820} width={1000 * cov} height={50} fill={cov > 0.999 ? '#2ECC71' : '#E67E22'} />
            </g>
          </g>
        );
      })}
    </Svg>
  );
};

/** the tree alone across the season cycle (top rows) and growth (bottom row) */
const Seasons: React.FC = () => {
  const ss = [0.05, 0.3, 0.55, 0.65, 0.8, 0.93];
  const ds = [0, 0.33, 0.66, 1];
  return (
    <Svg bg="#DDEBF0">
      {ss.map((s, i) => {
        const sl = seasonLook(s);
        const col = i % 3, row = Math.floor(i / 3);
        return (
          <g key={i} transform={`translate(${col * 360 + 180} ${row * 560 + 540}) scale(0.36) translate(${-YARD.tree.x} ${-YARD.tree.y})`}>
            <rect x={YARD.tree.x - 500} y={YARD.tree.y} width={1000} height={60} fill={sl.lawn} />
            <YardTree D={1} sl={sl} t={0} id={`st${i}`} />
          </g>
        );
      })}
      {ds.map((d, i) => (
        <g key={`d${i}`} transform={`translate(${i * 270 + 135} ${1860}) scale(0.24) translate(${-YARD.tree.x} ${-YARD.tree.y})`}>
          <rect x={YARD.tree.x - 560} y={YARD.tree.y} width={1120} height={60} fill="#8DC765" />
          <YardTree D={d} sl={seasonLook(0.3)} t={0} id={`sd${i}`} />
        </g>
      ))}
    </Svg>
  );
};

const Root: React.FC = () => (
  <>
    <Composition id="YardD0" component={Wide} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{D: 0, season: 0.1}} />
    <Composition id="YardMid" component={Wide} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{D: 0.5, season: 0.55}} />
    <Composition id="YardD1" component={Wide} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{D: 1, season: 0.15}} />
    <Composition id="YardWinter" component={Wide} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{D: 0.8, season: 0.8, t: 2}} />
    <Composition id="YardDusk" component={Wide} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{D: 1, season: 0.3, light: 1}} />
    <Composition id="YardWipe" component={Wipe} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{camX: FG.trunkX}} />
    <Composition id="YardWipeSheet" component={WipeSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="YardClose" component={Close} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="YardDoorGate" component={DoorGate} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="YardSeasons" component={Seasons} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
registerRoot(Root);
