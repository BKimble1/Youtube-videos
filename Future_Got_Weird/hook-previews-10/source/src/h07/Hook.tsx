// HOOK 07: a human heart beating outside the body, in an ex vivo normothermic perfusion system ("heart in a box").
// 0-1 s close on the beating heart in its clear chamber; 1-2.4 s pull back to the tubing, pump, oxygenator and
// monitor; 2.4-4.3 s push in while a cut window opens on the heart (aorta -> closed valve -> coronaries -> muscle);
// 4.3-6 s the window closes as the camera pulls wide, and a strong closing beat lands after the narration.
import React from 'react';
import {HookFrame, HookProps} from '../shared/HookFrame';
import {INK} from '../shared/ink';
import {atr, cam, FLOW_COR, press, surges, vent, W, WIN_CLOSE, winR} from './timeline';
import {ss} from '../shared/lib';
import {AO_PORT, deform, ECG_PADS, HeartExterior, HS} from './heart';
import {Section, SurfaceFlow} from './section';
import {AO_LINE, Console, DomeBack, DomeFront, Env, Floor, Monitor, Ports, RET_LINE, Sling, Tube} from './machine';
import {C} from './heart';

const HX = 540, HY = 745, HSC = 0.92;
const toW = (p: {x: number; y: number}) => ({x: HX + p.x * HSC, y: HY + p.y * HSC});

const Scene: React.FC<{t: number}> = ({t}) => {
  const s = vent(t);
  const st: HS = {t, s, a: atr(t), pr: press(t), sway: 0.012 * vent(t - 0.07) - 0.004 * Math.sin(t * 2.2)};
  const D = deform(st);
  const c = cam(t);
  const camT = (k: number) => {
    const z = 1 + (c.z - 1) * k;
    const cx = 540 + (c.x - 540) * k, cy = 960 + (c.y - 960) * k;
    return `translate(540,960) scale(${z.toFixed(5)}) translate(${(-cx).toFixed(3)},${(-cy).toFixed(3)})`;
  };
  const apexW = toW(D({x: 100, y: 236}));
  const pads = ECG_PADS.map((p) => toW(D(p)));
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <g transform={camT(0.45)}>
        <Env t={t} />
      </g>
      <g transform={camT(1)}>
        <Floor />
        <Monitor t={t} />
        <Console t={t} />
        <DomeBack />
        <Sling apex={apexW} front={false} />
        <g transform={`translate(${HX},${HY}) scale(${HSC})`}>
          <HeartExterior st={st} D={D} />
          <Section st={st} D={D} r={winR(t)} />
          <SurfaceFlow st={st} D={D} a={ss(t, FLOW_COR - 0.1, FLOW_COR + 0.25) * (1 - ss(t, WIN_CLOSE[0], WIN_CLOSE[1]))} />
        </g>
        {/* ECG / pacing leads */}
        {pads.map((p, i) => {
          const end = i === 0 ? {x: 330, y: 1018} : {x: 690, y: 1018};
          const mid = {x: (p.x + end.x) / 2 + (i ? 40 : -40), y: Math.max(p.y, end.y) + 30};
          const d = `M${p.x.toFixed(1)},${p.y.toFixed(1)} Q${mid.x.toFixed(1)},${mid.y.toFixed(1)} ${end.x},${end.y}`;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={INK} strokeWidth={4.4} />
              <path d={d} fill="none" stroke="#E7ECEE" strokeWidth={2.4} />
              <circle cx={p.x} cy={p.y} r={8} fill="#F1F4F5" stroke={INK} strokeWidth={2} />
              <circle cx={p.x} cy={p.y} r={3.2} fill="#8A9CA2" />
            </g>
          );
        })}
        <Sling apex={apexW} front />
        <DomeFront t={t} />
        <Tube d={AO_LINE} r={13} blood={C.art} t={t} speed={110} surge={surges(t)} />
        <Tube d={RET_LINE} r={13} blood={C.ven} t={t} speed={110} />
        <Ports />
      </g>
    </svg>
  );
};

export const Hook: React.FC<HookProps> = (props) => (
  <HookFrame hook="07" W={W} bg="#18333B" capY={1560} props={props}>
    {(t) => <Scene t={t} />}
  </HookFrame>
);
