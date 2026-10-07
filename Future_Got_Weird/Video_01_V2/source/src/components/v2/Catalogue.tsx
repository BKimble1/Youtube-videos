import React from 'react';
import {C, F, OUTLINE} from '../../theme';

/**
 * Card-catalogue cabinet, front view, with one drawer that pulls out towards the viewer.
 *
 * As `open` goes 0 → 1 the drawer front comes forward (moves down and grows a little) and the drawer box appears
 * between the slot and the front: two side walls, a floor, and the tops of the index cards standing inside. The slot
 * is never visible as an empty hole. `cardRise` (0..1) lifts one card out of the drawer; it is clipped by the drawer
 * front so it really comes out of the box. Origin: bottom centre of the cabinet. Size about 360 x 360 at scale 1.
 */
export const CatalogueV2: React.FC<{
  open?: number;
  cardRise?: number;
  card?: React.ReactNode; // card face, rendered 220 x 140 (only the top part shows while rising)
  row?: number;
  col?: number;
  scale?: number;
  labels?: string[]; // 12 drawer labels, row-major
  litLabel?: number; // 0..1 highlight of the chosen drawer's label
  style?: React.CSSProperties;
}> = ({open = 0, cardRise = 0, card, row = 2, col = 0, scale = 1, labels, litLabel = 0, style}) => {
  const W0 = 360;
  const H0 = 360;
  const dw = 104;
  const dh = 74;
  const gx = (c: number) => -W0 / 2 + 22 + c * (dw + 8);
  const gy = (r: number) => -H0 + 22 + r * (dh + 8);
  const ox = gx(col);
  const oy = gy(row);
  // drawer front when open: comes forward = moves down by up to 70 and grows by up to 16 %
  const k = open;
  const grow = 1 + 0.16 * k;
  const fw = dw * grow;
  const fh = dh * grow;
  const fx = ox + dw / 2 - fw / 2;
  const fy = oy + 70 * k;
  const lab = labels ?? ['A–Ba', 'Be–Bo', 'Br–Cz', 'D–Fa', 'Fe–Ha', 'He–Ka', 'Ka–Ky', 'L–Me', 'Mi–Ny', 'O–Ri', 'Ro–Sz', 'T–Z'];
  const DrawerFace: React.FC<{x: number; y: number; w: number; h: number; i: number; lit?: number}> = ({x, y, w, h, i, lit = 0}) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={C.woodLight} stroke={C.ink} strokeWidth={3} />
      <rect x={x + w * 0.2} y={y + h * 0.13} width={w * 0.6} height={h * 0.24} rx={2} fill={lit > 0 ? C.saffronLight : C.cream} stroke={C.ink} strokeWidth={2} />
      <text x={x + w / 2} y={y + h * 0.13 + h * 0.19} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={h * 0.17} fill={C.inkSoft}>{lab[i]}</text>
      <rect x={x + w * 0.3} y={y + h * 0.52} width={w * 0.4} height={h * 0.17} rx={4} fill={C.saffronDeep} stroke={C.ink} strokeWidth={2} />
      {lit > 0 && <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={9} fill="none" stroke={C.saffron} strokeWidth={5} opacity={lit} />}
    </g>
  );
  const cardW = 150;
  const cardH = 96;
  const cardX = fx + fw / 2 - cardW / 2;
  const cardTopInBox = oy + 10 + 30 * k; // resting position of the card top inside the drawer
  const cardY = cardTopInBox - cardRise * 150;
  return (
    <div style={{position: 'absolute', left: (-W0 / 2 - 40) * scale, top: (-H0 - 200) * scale, width: (W0 + 80) * scale, height: (H0 + 330) * scale, ...style}}>
      <svg viewBox={`${-W0 / 2 - 40} ${-H0 - 200} ${W0 + 80} ${H0 + 330}`} width={(W0 + 80) * scale} height={(H0 + 330) * scale} style={{overflow: 'visible'}}>
        <defs>
          <clipPath id={`drawerClip-${row}-${col}`}>
            {/* everything above the drawer front's top edge (the card is hidden by the front panel) */}
            <rect x={-1000} y={-2000} width={2000} height={2000 + fy + 2} />
          </clipPath>
        </defs>
        {/* cabinet body */}
        <rect x={-W0 / 2} y={-H0} width={W0} height={H0} rx={12} fill={C.wood} stroke={C.ink} strokeWidth={OUTLINE} />
        <rect x={-W0 / 2 - 10} y={-H0 - 14} width={W0 + 20} height={20} rx={6} fill={C.woodDeep} stroke={C.ink} strokeWidth={OUTLINE} />
        {Array.from({length: 4}).map((_, r) =>
          Array.from({length: 3}).map((_, c) => {
            const i = r * 3 + c;
            if (r === row && c === col) return null;
            return <DrawerFace key={i} x={gx(c)} y={gy(r)} w={dw} h={dh} i={i} />;
          }),
        )}
        {/* the open drawer: slot shadow, box walls, floor, cards, then the front */}
        <rect x={ox} y={oy} width={dw} height={dh} rx={6} fill={C.ink} opacity={0.85} />
        {k > 0.01 && (
          <g>
            {/* floor / inside of the box seen from above */}
            <path d={`M ${ox + 4} ${oy + 6} L ${ox + dw - 4} ${oy + 6} L ${fx + fw - 6} ${fy + 4} L ${fx + 6} ${fy + 4} Z`} fill={C.woodDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
            {/* index cards standing in the drawer (tops visible), most of them */}
            {Array.from({length: 7}).map((_, j) => {
              const u = (j + 1) / 8;
              const yy = oy + 6 + (fy - oy) * u - 4;
              const xl = ox + 8 + (fx + 8 - (ox + 8)) * u;
              const xr = ox + dw - 8 + (fx + fw - 8 - (ox + dw - 8)) * u;
              return <rect key={j} x={xl} y={yy - 8 * grow} width={xr - xl} height={9 * grow} rx={2} fill={C.cream} stroke={C.inkMuted} strokeWidth={1.5} opacity={Math.min(1, k * 2)} />;
            })}
            {/* side walls */}
            <path d={`M ${ox} ${oy + 4} L ${fx} ${fy + 2} L ${fx} ${fy + fh * 0.5} L ${ox} ${oy + dh * 0.5} Z`} fill={C.wood} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
            <path d={`M ${ox + dw} ${oy + 4} L ${fx + fw} ${fy + 2} L ${fx + fw} ${fy + fh * 0.5} L ${ox + dw} ${oy + dh * 0.5} Z`} fill={C.wood} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
          </g>
        )}
        {/* the chosen card, rising out of the box: clipped by the front's top edge */}
        {card && cardRise > 0 && (
          <g clipPath={`url(#drawerClip-${row}-${col})`}>
            <foreignObject x={cardX} y={cardY} width={cardW} height={cardH}>
              <div style={{width: 220, height: 140, transform: `scale(${cardW / 220})`, transformOrigin: '0 0'}}>{card}</div>
            </foreignObject>
          </g>
        )}
        <DrawerFace x={fx} y={fy} w={fw} h={fh} i={row * 3 + col} lit={litLabel} />
        {/* soft shadow under the pulled drawer */}
        {k > 0.05 && <ellipse cx={fx + fw / 2} cy={fy + fh + 6} rx={fw * 0.45} ry={6} fill={C.shadow} opacity={k} />}
      </svg>
    </div>
  );
};

/** An index card face (220 x 140): the catalogue entry with a blank title line. */
export const IndexCard: React.FC<{name?: string; year?: string; titleBlank?: number; style?: React.CSSProperties}> = ({name = 'KALAI, A.', year = '2001', titleBlank = 1, style}) => (
  <div style={{width: 220, height: 140, background: C.cream, border: `3px solid ${C.ink}`, borderRadius: 6, padding: '10px 12px', boxSizing: 'border-box', position: 'relative', boxShadow: `3px 4px 0 ${C.shadow}`, ...style}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 30, height: 2, background: C.coral, opacity: 0.6}} />
    <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 17, color: C.ink}}>{name} · {year}</div>
    <div style={{marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 8}}>
      <div style={{fontFamily: F.serif, fontSize: 19, color: C.inkSoft}}>title:</div>
      <div style={{flex: 1, borderBottom: `2px dashed ${C.inkMuted}`, height: 18, opacity: titleBlank}} />
    </div>
    <div style={{marginTop: 14, height: 2, background: C.paperLine}} />
    <div style={{marginTop: 14, height: 2, background: C.paperLine}} />
  </div>
);
