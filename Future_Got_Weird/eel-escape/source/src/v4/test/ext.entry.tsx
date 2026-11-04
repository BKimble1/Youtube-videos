// Exterior shots sheet: npx remotion still src/v4/test/ext.entry.tsx Ext out.png --props='{"cols":4,"cells":[["open",0],["open",1]]}'
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {resetIds} from '../../core/ids';
import {EXT_DBG, ExtFrame, ExtShot, LoopShot, pokeStateWith} from '../shots/Exterior';

const Cell: React.FC<{id: string; t: number; band: boolean; o?: any}> = ({id, t, band, o: o0}) => {
  let o = o0;
  resetIds(`${id}${Math.round(t * 1000)}_`);
  EXT_DBG.layer = o && o.dbg ? o.dbg : '';
  if (o && o.dbg) o = undefined;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#000'}}>
      {o ? <ExtFrame s={pokeStateWith(o, t)} /> : id === 'loop' ? <LoopShot t={t} dur={24.8} /> : <ExtShot id={id} t={t} />}
      {band && <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 500, background: 'rgba(255,255,255,0.10)', borderBottom: '3px dashed rgba(255,255,0,0.6)'}} />}
      <div style={{position: 'absolute', left: 24, bottom: 24, fontSize: 64, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${id} ${t.toFixed(2)}`}</div>
    </div>
  );
};
const Sheet: React.FC<{cells: [string, number, any?][]; cols: number; band?: boolean}> = ({cells, cols, band = true}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {cells.map(([c, t, o], i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Cell id={c} t={t} band={band} o={o} />
        </div>
      ))}
    </AbsoluteFill>
  );
};
const Root: React.FC = () => (
  <Composition id="Ext" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{cells: [['open', 0]] as [string, number][], cols: 4, band: true}} />
);
registerRoot(Root);
