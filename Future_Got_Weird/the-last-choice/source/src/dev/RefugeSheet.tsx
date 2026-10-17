// Refuge check sheet (pages via `page`).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {RefugeExterior} from '../sets/refuge';
import {RefugeInteriorBack, InteriorFloor, GlassWall, MedicalBed, BedSheet, bedTop, Gurney, ChairRow, chairSeats, Bench, Table, MealTray, Locker, EntryDoorsInside, RefugeTint} from '../sets/refugeInterior';
import {Plant} from '../sets/refugePlants';
import {WaterfrontFar, Esplanade, LandingStairs} from '../sets/refugeFar';
import {Actor} from '../rig/actor';
import {lying} from '../rig/poses';
import {CAST} from '../rig/looks';

const Label: React.FC<{x: number; y: number; s: string}> = ({x, y, s}) => <text x={x} y={y} fontFamily={F.body} fontWeight={800} fontSize={22} fill="#fff" stroke="#000" strokeWidth={4} paintOrder="stroke">{s}</text>;

export const RefugeSheet: React.FC<{page: number}> = ({page}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  if (page === 0) {
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: '#BFD9E6'}}>
        <rect x={0} y={760} width={1920} height={320} fill="#5D8FA6" />
        <RefugeExterior x={180} y={760} scale={0.5} t={t} doors={0.7} time={1} ink={3} />
        <Label x={20} y={40} s="exterior: day, doors 0.7 (scale 0.5)" />
        <RefugeExterior x={1320} y={430} scale={0.18} t={t} time={2} far ink={2} shutter={1} />
        <Label x={1300} y={470} s="far variant, evening, shutter down" />
        <RefugeExterior x={1320} y={700} scale={0.18} t={t} time={3} far ink={2} />
        <Label x={1300} y={740} s="far, night" />
      </svg>
    );
  }
  if (page === 1 || page === 3) {
    const time = page === 1 ? 1 : (f / 150) * 4;
    const Y = 760;
    const prog = page === 1 ? 0.55 : 1;
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: C.paper}}>
        <RefugeInteriorBack x0={0} x1={1920} yFloor={Y - 60} yTop={0} time={time} t={t} beds={0} people={2} ink={3} />
        <InteriorFloor x0={0} x1={1920} y={Y - 60} depth={380} time={time} ink={3} />
        <MedicalBed x={360} y={Y} s={0.8} headDir={-1} ink={3} />
        <Actor {...lying(CAST.clerkA, 400, bedTop(Y, 0.8), -1, {t, s: 0.8, face: {closed: true, mouth: 'soft'}, visor: false})} />
        <BedSheet x={360} y={Y} s={0.8} headDir={-1} progress={prog} bodyS={0.8} ink={3} t={t} />
        <Gurney x={900} y={Y} s={0.75} ink={3} />
        <ChairRow x={1200} y={Y} n={3} s={0.8} ink={3} part="back" />
        <ChairRow x={1200} y={Y} n={3} s={0.8} ink={3} part="front" />
        <g transform={`translate(${chairSeats(1200, Y, 3, 190, 0.8)[1].x} ${chairSeats(1200, Y, 3, 190, 0.8)[1].y - 6})`}><path d="M -40 0 Q 0 -30 40 0 L 60 6 Q 0 14 -60 6 Z" fill="#1CA7A0" stroke="#162A32" strokeWidth={3} /></g>
        <Bench x={1680} y={Y} s={0.8} ink={3} />
        <Table x={1720} y={Y + 200} s={0.8} ink={3} />
        <MealTray x={1720} y={Y + 200 - 190 * 0.8} s={0.8} ink={3} t={t} />
        <Locker x={1820} y={Y - 60} s={0.6} open={page === 1 ? 0.45 : 0} t={t} ink={3} />
        <Plant x={1040} y={Y} s={0.7} t={t} seed={4} ink={3} kind="tall" />
        <GlassWall x0={-20} x1={640} yTop={40} yFloor={Y - 60} t={t} ink={3} spacing={330} handprint={{x: 300, y: 300, amt: 1}} reflection={{x: 160, y: 260, amt: 1}} time={time} />
        <RefugeTint x0={0} y0={0} x1={1920} y1={1080} time={time} lamps={[{x: 700, y: 260, r: 380}, {x: 1500, y: 300, r: 420}]} />
        <Label x={20} y={40} s={page === 1 ? 'interior pieces: day, sheet 0.55, locker 0.45, handprint + reflection' : `time ${time.toFixed(2)} (0 morning, 1 day, 2 evening, 3 night)`} />
      </svg>
    );
  }
  if (page === 2) {
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: C.paper}}>
        <EntryDoorsInside x={480} y={900} s={1} open={0.3} shutter={0.6} t={t} ink={4} sensor="deny" />
        <Label x={20} y={40} s="entry from inside: doors 0.3, shutter 0.6, sensor deny" />
        <EntryDoorsInside x={1400} y={900} s={1} open={1} shutter={0} t={t} ink={4} time={0} sensor="idle" seed={2} />
        <Label x={980} y={40} s="morning, doors open, shutter up" />
      </svg>
    );
  }
  if (page === 4 || page === 5) {
    const time = page === 4 ? 1 : 3;
    const prog = (f / 150);
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: C.paper}}>
        <g transform="translate(0 760) scale(0.32) translate(0 0)">
          <WaterfrontFar x0={0} x1={6000} y={0} t={t} time={time} progress={prog} />
        </g>
        <Label x={20} y={40} s={`waterfront far: ${page === 4 ? 'day' : 'night'}, reconstruction progress ${prog.toFixed(2)}`} />
      </svg>
    );
  }
  if (page === 6) {
    return (
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: '#BFD9E6'}}>
        <g transform="translate(-4050 860) scale(0.3)">
          <rect x={12500} y={-1660} width={1000} height={80} fill="#9C9690" stroke="#162A32" strokeWidth={8} />
          <LandingStairs xTop={13500} yTop={-1600} xBottom={14500} yBottom={0} ink={8} />
          <Esplanade x0={14400} x1={16200} y={0} t={t} ink={8} />
          <RefugeExterior x={16000} y={0} t={t} doors={0.2} ink={8} />
        </g>
        <Label x={20} y={40} s="landing (deck stub), stairs 13500→14500, esplanade, refuge at x 16000 (scale 0.3)" />
      </svg>
    );
  }
  return <svg width="100%" height="100%" viewBox="0 0 1920 1080"><rect width={1920} height={1080} fill={C.paper} /></svg>;
};
