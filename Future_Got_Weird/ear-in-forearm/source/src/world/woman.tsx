// The patient: an anonymous illustrative woman in a three-quarter view, turned toward screen left, so the LEFT side
// of her head (the ear site) faces us. Her left arm is raised in front of her (upper arm out to the side, elbow bent,
// forearm upright, palm forward), so the inner forearm faces the camera. One drawing in world units (head 330 tall;
// about 0.68 mm per unit). Outlines are thin ink edges that keep their screen width (non-scaling strokes).
import React from 'react';
import {SK, HAIR, GOWN, INK} from './pal';
import {lit, shade} from '../core/color';

export const FIG = {
  head: {x: 350, y: 520},
  earSite: {x: 446, y: 548}, // centre of the left ear site on the head
  shoulder: {x: 575, y: 870},
  elbow: {x: 852, y: 920},
  wrist: {x: 836, y: 520},
  armEar: {x: 838, y: 716}, // centre of the ear relief on the inner forearm
  ribs: {x: 352, y: 1150},
};

const ln = (w: number) => ({stroke: INK, strokeWidth: w, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});

export const FOREARM_D =
  'M 800 512 C 797 600 789 700 787 790 C 786 842 791 884 806 908 C 822 936 851 963 881 961 C 903 959 911 936 909 900 ' +
  'C 906 820 886 640 872 512 Z';
/** forearm half-width at height y (inner surface), and the centre line, for placing things on the skin */
export const armAt = (y: number) => {
  const u = Math.min(1, Math.max(0, (y - 512) / (900 - 512)));
  const left = 800 + (787 - 800) * Math.sin(u * Math.PI * 0.62);
  const right = 872 + (909 - 872) * u * u * 0.6 + (909 - 872) * 0.4 * u;
  return {left, right, c: (left + right) / 2, hw: (right - left) / 2};
};

/** Background body: gown, torso, neck. */
export const Torso: React.FC<{ow: number}> = ({ow}) => (
  <g>
    <defs>
      <linearGradient id="gownG" x1="0" y1="0" x2="1" y2="0.15">
        <stop offset="0" stopColor={GOWN.light} />
        <stop offset="0.45" stopColor={GOWN.base} />
        <stop offset="1" stopColor={GOWN.deep} />
      </linearGradient>
      <linearGradient id="neckG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={SK.base} />
        <stop offset="0.7" stopColor={SK.shade} />
        <stop offset="1" stopColor={SK.deep} />
      </linearGradient>
      <pattern id="gownDots" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
        <path d="M 13 9 L 17 13 L 13 17 L 9 13 Z" fill={GOWN.dot} opacity="0.55" />
      </pattern>
    </defs>
    {/* neck */}
    <path d="M 312 640 C 318 690 322 742 316 800 L 476 806 C 470 744 468 690 474 610 C 480 566 488 534 494 508 L 420 520 L 340 600 Z" fill="url(#neckG)" />
    <path d="M 312 640 C 318 690 322 742 316 800 M 476 806 C 470 744 468 690 474 610" fill="none" {...ln(ow)} />
    {/* shadow under the jaw on the neck */}
    <path d="M 322 668 C 360 690 420 668 462 612 L 462 660 C 420 700 360 712 322 700 Z" fill={SK.deep} opacity="0.35" />
    {/* gown */}
    <path
      d="M 316 778 C 290 792 230 800 182 818 C 150 832 138 880 134 960 C 128 1120 132 1400 140 1990 L 610 1990 C 606 1600 600 1260 596 1060 C 594 990 600 940 612 900 C 598 850 560 818 512 800 C 494 793 482 786 474 778 C 440 830 360 836 316 778 Z"
      fill="url(#gownG)"
      {...ln(ow)}
    />
    <path
      d="M 316 778 C 290 792 230 800 182 818 C 150 832 138 880 134 960 C 128 1120 132 1400 140 1990 L 610 1990 C 606 1600 600 1260 596 1060 C 594 990 600 940 612 900 C 598 850 560 818 512 800 C 494 793 482 786 474 778 C 440 830 360 836 316 778 Z"
      fill="url(#gownDots)"
    />
    {/* neckline band and a few soft folds */}
    <path d="M 316 778 C 360 836 440 830 474 778" fill="none" stroke={GOWN.light} strokeWidth="9" opacity="0.9" />
    <path d="M 316 778 C 360 836 440 830 474 778" fill="none" {...ln(ow)} />
    <path d="M 250 900 C 262 1000 258 1100 246 1220" fill="none" stroke={GOWN.shade} strokeWidth="10" opacity="0.45" strokeLinecap="round" />
    <path d="M 520 960 C 540 1060 548 1180 540 1320" fill="none" stroke={GOWN.deep} strokeWidth="14" opacity="0.35" strokeLinecap="round" />
    <path d="M 410 1420 C 430 1520 436 1640 430 1780" fill="none" stroke={GOWN.shade} strokeWidth="9" opacity="0.4" strokeLinecap="round" />
  </g>
);

/** The upper arm (gown sleeve over its top half), running out to the elbow. Drawn behind the forearm. */
export const UpperArm: React.FC<{ow: number}> = ({ow}) => (
  <g>
    <defs>
      <linearGradient id="uaG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={SK.light} />
        <stop offset="0.55" stopColor={SK.base} />
        <stop offset="1" stopColor={SK.deep} />
      </linearGradient>
      <linearGradient id="sleeveG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={GOWN.light} />
        <stop offset="0.6" stopColor={GOWN.base} />
        <stop offset="1" stopColor={GOWN.deep} />
      </linearGradient>
    </defs>
    <path d="M 590 826 C 680 836 770 846 850 858 L 860 952 C 780 958 690 950 600 936 Z" fill="url(#uaG)" {...ln(ow)} />
    {/* sleeve */}
    <path d="M 512 800 C 560 806 620 812 706 826 C 714 862 716 912 710 950 C 660 950 620 944 600 940 C 600 900 606 860 590 840 Z" fill="url(#sleeveG)" {...ln(ow)} />
    <path d="M 706 826 C 714 862 716 912 710 950" fill="none" stroke={GOWN.deep} strokeWidth="5" opacity="0.5" />
  </g>
);

/** The forearm surface (inner side facing us). `turn` rotates it slightly about its long axis (radians); the shading
 *  band moves the other way, so the skin and everything on it read as one turning cylinder. */
export const ForearmSkin: React.FC<{ow: number; turn: number; hair: number; children?: React.ReactNode}> = ({ow, turn, hair, children}) => {
  const s = Math.sin(turn);
  return (
    <g>
      <defs>
        <linearGradient id="faG" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor={SK.shade} />
          <stop offset={0.08 + 0.05 * s} stopColor={SK.base} />
          <stop offset={0.3 + 0.08 * s} stopColor={lit(SK.volar, 0.18)} />
          <stop offset={0.62 + 0.06 * s} stopColor={SK.volar} />
          <stop offset={0.9} stopColor={SK.shade} />
          <stop offset="1" stopColor={SK.deep} />
        </linearGradient>
        <clipPath id="faClip">
          <path d={FOREARM_D} />
        </clipPath>
      </defs>
      <path d={FOREARM_D} fill="url(#faG)" />
      <g clipPath="url(#faClip)">
        {/* the inner elbow crease and the soft muscle bulge on the thumb side */}
        <path d="M 796 858 C 812 872 836 880 862 876" fill="none" stroke={SK.deep} strokeWidth="3" opacity="0.45" strokeLinecap="round" />
        <ellipse cx="800" cy="790" rx="16" ry="70" fill={lit(SK.volar, 0.25)} opacity="0.35" />
        {/* faint veins at the wrist */}
        <path d="M 826 530 C 828 560 824 590 822 620" fill="none" stroke="#9C7A86" strokeWidth="2.2" opacity="0.28" />
        <path d="M 846 528 C 848 556 852 580 850 606" fill="none" stroke="#9C7A86" strokeWidth="1.8" opacity="0.22" />
        <ArmHair a={hair} />
        {children}
      </g>
      <path d={FOREARM_D} fill="none" {...ln(ow)} />
    </g>
  );
};

const hsh = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
/** Fine forearm hairs, lying along the arm toward the wrist; only drawn when the camera is close (a). */
const HAIRS = Array.from({length: 260}, (_, i) => {
  const y = 540 + hsh(i * 3.1) * 400, c = armAt(y);
  const x = c.left + 3 + hsh(i * 7.7) * (c.right - c.left - 6);
  const L = 3.5 + hsh(i * 1.3) * 4, a = -90 + (hsh(i * 5.9) - 0.5) * 40 + (x - c.c) * 0.25;
  return {x, y, x2: x + L * Math.cos((a * Math.PI) / 180), y2: y + L * Math.sin((a * Math.PI) / 180), o: 0.25 + hsh(i * 2.3) * 0.35};
});
const ArmHair: React.FC<{a: number}> = ({a}) =>
  a <= 0.01 ? null : (
    <g opacity={a * 0.6} stroke={HAIR.base} strokeWidth={0.3} strokeLinecap="round" fill="none">
      {HAIRS.map((h, i) => (
        <path key={i} d={`M ${h.x.toFixed(2)} ${h.y.toFixed(2)} Q ${((h.x + h.x2) / 2 + 0.6).toFixed(2)} ${((h.y + h.y2) / 2).toFixed(2)} ${h.x2.toFixed(2)} ${h.y2.toFixed(2)}`} opacity={h.o} />
      ))}
    </g>
  );

/** Left hand, palm toward us, fingers up and together (a slight natural splay), thumb toward her head (screen left). */
export const Hand: React.FC<{ow: number; turn: number}> = ({ow, turn}) => {
  const k = Math.cos(turn), dx = Math.sin(turn) * 14;
  const fingers: [number, number, number, number, number][] = [
    // base x, base y, length, base width, angle (deg, + = toward the little-finger side)
    [801, 424, 90, 24, -6],
    [825, 418, 102, 25, -1.5],
    [849, 421, 95, 24, 3],
    [871, 430, 74, 20.5, 8],
  ];
  const finger = (bx: number, by: number, L: number, w: number, a: number, i: number) => {
    const r = w / 2, rt = r * 0.84;
    const d = `M ${-r} 8 C ${-r} ${-L * 0.4} ${-rt} ${-L * 0.7} ${-rt} ${-L + rt} A ${rt} ${rt} 0 0 1 ${rt} ${-L + rt} C ${rt} ${-L * 0.7} ${r} ${-L * 0.4} ${r} 8 Z`;
    return (
      <g key={i} transform={`translate(${bx} ${by}) rotate(${a})`}>
        <path d={d} fill="url(#fingerG)" {...ln(ow)} />
        <path d={`M ${-r * 0.75} ${-L * 0.36} Q 0 ${-L * 0.36 + 3} ${r * 0.75} ${-L * 0.36}`} fill="none" stroke={SK.palmShade} strokeWidth="1.7" />
        <path d={`M ${-r * 0.7} ${-L * 0.64} Q 0 ${-L * 0.64 + 2.4} ${r * 0.7} ${-L * 0.64}`} fill="none" stroke={SK.palmShade} strokeWidth="1.5" />
        <ellipse cx={0} cy={-L + rt + 4} rx={rt * 0.6} ry={rt * 0.85} fill={lit(SK.palm, 0.3)} opacity="0.5" />
        <ellipse cx={0} cy={-L * 0.18} rx={r * 0.6} ry={L * 0.1} fill={lit(SK.palm, 0.22)} opacity="0.35" />
      </g>
    );
  };
  return (
    <g transform={`translate(${836 + dx} 518) scale(${k * 1.2} 1.2) translate(-836 -518)`}>
      <defs>
        <linearGradient id="fingerG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={lit(SK.palm, 0.18)} />
          <stop offset="0.55" stopColor={SK.palm} />
          <stop offset="1" stopColor={SK.palmShade} />
        </linearGradient>
        <radialGradient id="palmG" cx="0.4" cy="0.42" r="0.72">
          <stop offset="0" stopColor={lit(SK.palm, 0.22)} />
          <stop offset="0.7" stopColor={SK.palm} />
          <stop offset="1" stopColor={SK.palmShade} />
        </radialGradient>
      </defs>
      {fingers.map((f, i) => finger(...f, i)).reverse()}
      {/* thumb: from the thenar pad, up and out toward the head */}
      <g transform="translate(797 486) rotate(-40)">
        <path d="M -14 22 C -14 -10 -12 -40 -11.5 -58 A 11.5 11.5 0 0 1 11.5 -58 C 12 -40 14 -10 14 22 Z" fill="url(#fingerG)" {...ln(ow)} />
        <path d="M -9.5 -30 Q 0 -26.5 9.5 -30" fill="none" stroke={SK.palmShade} strokeWidth="1.7" />
        <ellipse cx={0} cy={-52} rx={7} ry={9.5} fill={lit(SK.palm, 0.3)} opacity="0.5" />
      </g>
      {/* palm */}
      <path d="M 789 432 C 806 414 866 414 884 432 C 889 456 886 492 876 512 C 870 522 806 524 798 514 C 788 498 781 474 783 456 C 784 446 786 438 789 432 Z" fill="url(#palmG)" {...ln(ow)} />
      {/* thenar pad, palm creases */}
      <path d="M 787 452 C 800 474 811 496 813 518" fill="none" stroke={SK.palmShade} strokeWidth="2.3" opacity="0.9" />
      <path d="M 796 444 C 822 451 850 451 881 442" fill="none" stroke={SK.palmShade} strokeWidth="1.9" opacity="0.8" />
      <path d="M 808 463 C 832 469 853 475 872 487" fill="none" stroke={SK.palmShade} strokeWidth="1.7" opacity="0.7" />
      <ellipse cx="803" cy="492" rx="11" ry="20" fill={lit(SK.palm, 0.2)} opacity="0.45" />
      <path d="M 802 514 C 820 518 850 518 871 512" fill="none" stroke={SK.palmShade} strokeWidth="1.9" />
    </g>
  );
};

/** Head: face, hair and the left ear site. `site` draws what is at the ear site (scar, new ear...). */
export const Head: React.FC<{ow: number; site?: React.ReactNode; blink?: number}> = ({ow, site, blink = 0}) => {
  const FACE =
    'M 300 395 C 272 410 257 440 255 470 C 254 482 251 490 253 498 C 257 506 259 512 256 522 C 252 534 249 548 253 560 ' +
    'C 257 580 259 596 263 612 C 263 626 263 640 267 652 C 269 668 273 682 289 690 C 311 698 351 688 386 668 ' +
    'C 411 652 426 630 433 600 C 441 570 479 560 491 520 C 501 470 491 410 456 378 C 421 350 341 360 300 395 Z';
  const lid = Math.max(0, Math.min(1, blink));
  return (
    <g>
      <defs>
        <radialGradient id="faceG" cx="0.3" cy="0.4" r="0.85">
          <stop offset="0" stopColor={SK.light} />
          <stop offset="0.5" stopColor={SK.base} />
          <stop offset="0.85" stopColor={SK.shade} />
          <stop offset="1" stopColor={SK.deep} />
        </radialGradient>
        <linearGradient id="hairG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={HAIR.light} />
          <stop offset="0.45" stopColor={HAIR.base} />
          <stop offset="1" stopColor={HAIR.deep} />
        </linearGradient>
        <clipPath id="faceClip">
          <path d={FACE} />
        </clipPath>
      </defs>
      {/* bun, behind the head */}
      <circle cx="503" cy="452" r="47" fill="url(#hairG)" {...ln(ow)} />
      <path d="M 470 430 C 490 418 520 420 536 440 M 468 462 C 490 450 522 452 540 470 M 476 490 C 496 484 520 488 532 498" fill="none" stroke={HAIR.light} strokeWidth="2.4" opacity="0.6" />
      <path d={FACE} fill="url(#faceG)" />
      <path d="M 491 520 C 501 470 491 410 456 378 C 421 350 341 360 300 395 C 272 410 257 440 255 470 C 254 482 251 490 253 498 C 257 506 259 512 256 522 C 252 534 249 548 253 560 C 257 580 259 596 263 612 C 263 626 263 640 267 652 C 269 668 273 682 289 690 C 311 698 351 688 386 668 C 411 652 426 630 433 600" fill="none" {...ln(ow)} />
      <g clipPath="url(#faceClip)">
        {/* side plane of the head: a little darker behind the cheekbone */}
        <path d="M 372 470 C 400 520 410 600 386 668 L 500 668 L 500 470 Z" fill={SK.shade} opacity="0.3" filter="url(#soft10)" />
        <ellipse cx="300" cy="580" rx="30" ry="20" fill={SK.blush} opacity="0.22" />
        {/* jaw shadow */}
        <path d="M 270 680 C 320 700 380 680 432 610 L 440 700 L 270 700 Z" fill={SK.deep} opacity="0.25" />
        {site}
      </g>
      {/* nose (far contour over the cheek) */}
      <path d="M 280 500 C 272 528 256 550 243 566 C 237 576 243 585 254 585 C 260 591 270 590 276 584 C 282 578 286 566 284 552" fill={SK.base} />
      <path d="M 280 500 C 272 528 256 550 243 566 C 237 576 243 585 254 585 C 260 591 270 590 276 584" fill="none" {...ln(ow)} />
      <path d="M 284 520 C 288 540 290 560 282 578" fill="none" stroke={SK.deep} strokeWidth="5" opacity="0.28" strokeLinecap="round" />
      <path d="M 256 581 C 260 584 266 584 270 580" fill="none" stroke={SK.deep} strokeWidth="2.4" opacity="0.8" strokeLinecap="round" />
      {/* eyes */}
      <g>
        <path d="M 306 512 C 316 500 340 499 354 509 C 342 519 318 521 306 512 Z" fill="#F4EEE8" />
        <circle cx="326" cy="510" r="8" fill="#3A2418" />
        <circle cx="326" cy="510" r="3.6" fill="#120A07" />
        <circle cx="323" cy="507" r="2" fill="#FFF" opacity="0.85" />
        <path d={`M 304 512 C 316 ${499 + lid * 14} 340 ${498 + lid * 14} 356 509`} fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
        {lid > 0.05 && <path d={`M 304 512 C 316 499 340 498 356 509 C 340 ${498 + lid * 14} 316 ${499 + lid * 14} 304 512 Z`} fill={SK.base} />}
        <path d="M 312 518 C 324 523 340 521 350 514" fill="none" stroke={SK.deep} strokeWidth="1.6" opacity="0.6" />
        <path d="M 260 513 C 264 505 277 504 285 509 C 279 516 266 518 260 513 Z" fill="#F0E8E2" />
        <circle cx="271" cy="510.5" r="5.6" fill="#3A2418" />
        <circle cx="271" cy="510.5" r="2.6" fill="#120A07" />
        <path d={`M 258 513 C 264 ${504 + lid * 10} 277 ${503 + lid * 10} 287 509`} fill="none" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
        {lid > 0.05 && <path d={`M 258 513 C 264 504 277 503 287 509 C 277 ${503 + lid * 10} 264 ${504 + lid * 10} 258 513 Z`} fill={SK.base} />}
        {/* brows */}
        <path d="M 300 486 C 316 477 340 477 360 487" fill="none" stroke={HAIR.base} strokeWidth="5.5" strokeLinecap="round" />
        <path d="M 257 489 C 266 482 279 481 290 485" fill="none" stroke={HAIR.base} strokeWidth="4.5" strokeLinecap="round" />
      </g>
      {/* mouth */}
      <path d="M 268 627 C 280 619 300 618 322 625 C 306 628 284 630 268 627 Z" fill={SK.lip} />
      <path d="M 270 629 C 286 645 306 643 320 628 C 304 632 286 633 270 629 Z" fill={lit(SK.lip, 0.12)} />
      <path d="M 268 627 C 286 632 306 631 322 625" fill="none" stroke={SK.lipDeep} strokeWidth="2.4" strokeLinecap="round" />
      {/* hair: pulled back, the temple hairline sweeping back above the ear site */}
      <path
        d="M 256 452 C 262 404 300 364 360 352 C 422 342 472 366 494 410 C 507 440 506 482 495 514 C 489 530 481 546 470 553 C 470 532 466 512 458 498 C 444 482 424 474 404 472 C 382 470 362 460 346 444 C 320 424 288 428 256 452 Z"
        fill="url(#hairG)"
        {...ln(ow)}
      />
      <path d="M 284 420 C 330 392 400 384 460 410 M 300 408 C 350 380 420 380 470 420 M 356 448 C 392 440 432 448 470 470 M 380 462 C 420 458 450 470 476 494" fill="none" stroke={HAIR.light} strokeWidth="2.4" opacity="0.55" />
    </g>
  );
};

/** The healed ear site, before reconstruction: smooth scarred skin, the ear canal opening kept, a small tragus remnant. */
export const EarSiteScar: React.FC<{a?: number}> = ({a = 1}) => (
  <g opacity={a}>
    {/* the healed footprint where the ear was: smoother, paler, slightly shiny skin with a soft scar border */}
    <path d="M 427 508 C 444 498 466 504 474 522 C 482 544 476 576 462 592 C 448 604 432 598 426 584 C 418 562 416 526 427 508 Z" fill={SK.scar} opacity="0.75" filter="url(#soft2)" />
    <path d="M 427 508 C 444 498 466 504 474 522 C 482 544 476 576 462 592 C 448 604 432 598 426 584 C 418 562 416 526 427 508 Z" fill="none" stroke={shade(SK.scar, 0.3)} strokeWidth="1.6" opacity="0.55" />
    <path d="M 440 514 C 452 512 462 520 466 532 M 432 576 C 442 586 454 586 462 578 M 458 530 C 464 544 466 558 462 570" fill="none" stroke={shade(SK.scar, 0.3)} strokeWidth="1.3" opacity="0.5" />
    <ellipse cx="452" cy="530" rx="9" ry="5" fill="#F6D2BC" opacity="0.4" filter="url(#soft2)" />
    {/* a small tragus remnant, and the ear canal opening behind it */}
    <ellipse cx="431" cy="557" rx="5" ry="9" fill={SK.light} />
    <ellipse cx="431" cy="557" rx="5" ry="9" fill="none" stroke={SK.deep} strokeWidth="1" opacity="0.6" />
    <ellipse cx="442" cy="558" rx="4.6" ry="6.5" fill="#3B2019" />
    <ellipse cx="441" cy="556.5" rx="2" ry="2.8" fill="#1E0E0A" />
  </g>
);
