// THE LAST CHOICE — R2 master timing. Single source of truth for music, anchors and shot boundaries (film seconds).
//
// Portals is used IN FULL from its first clean event: the recording (release asset 234600) starts ~3 s into the track
// inside a decaying chord, so we enter at rec 1.30 (just before the 1.42 s low hit) and play to the natural ring-out at
// rec 193.8. Film time = Portals rec time − 0.70. Nothing is removed in between (R1's 61.4 s cut is restored).
//
// "It's Been a Long, Long Time" (release asset 235008) — R3: ONE continuous excerpt, no edit. Nobody touches the radio:
// after his stillness the camera finds the radio in the van, its indicator flutters through static (interrupted
// reception recovering), and the recording plays from its first musical sample (rec 0.00; the capture starts inside
// the music, ~2.2 s into the track, so there is no non-musical lead-in to drop) straight on in chronological order to
// the cadence arrival at rec 34.66 (chosen by chroma similarity to the song's own phrase ends, 0.97; onset-refined),
// then a 3.0 s fade (rec 34.66 → 37.66) over the end card. The vocal (rec 64.36) is not reached; the R2 splice toward
// it is cancelled.
export const FPS = 30;
export const P_OFF = 0.70; // film = portals rec − P_OFF
export const P = (rec: number) => rec - P_OFF;

export type MusicSeg = {src: 'portals' | 'longtime'; recIn: number; recOut: number; film: number; fadeIn?: number; fadeOut?: number; xfade?: number};

/** the radio's indicator flutters and static crackles (no one touches it) */
const RADIO_FLUTTER = 199.0;
/** the song catches through the static */
const L_START = 199.6;
const L_CADENCE_REC = 34.66, L_FADE = 3.0;
const L = (rec: number) => L_START + rec; // film time of a Long, Long Time rec time (continuous)

export const MUSIC: MusicSeg[] = [
  {src: 'portals', recIn: 1.30, recOut: 193.8, film: P(1.30), fadeIn: 0.1},
  {src: 'longtime', recIn: 0.0, recOut: L_CADENCE_REC + L_FADE, film: L_START, fadeIn: 0.35, fadeOut: L_FADE},
];

export const M = {
  // A — New York falls
  P_IN: P(1.30),
  LOW_HIT: P(1.42),            // first event: the distant tower starts to fail
  TITLE_IN: 6.6,               // cut to black: THE LAST CHOICE / NEW YORK · 2042
  TITLE_OUT: P(10.0),          // 9.30 — first solo note: cut to the hand on the rubble
  // B — the Director stands
  SOLO: P(10.0),
  ORCH: P(17.46),              // full orchestra: the army revealed
  H1: P(19.16), H2: P(19.58),  // the army's synchronized step / eyes
  H3: P(24.24),                // the heavy's head turns to him
  H4: P(30.96), H5a: P(32.62), H5b: P(33.04), // the army halts as one
  // C — the Crew joins him
  BASS_OUT: P(36.5),           // held breath: movement behind him
  BASS_IN: P(38.3),
  ALLY1: P(39.16),             // first ally out of the smoke
  ALLY2a: P(40.86), ALLY2b: P(41.28),
  MARCH: P(46.0),              // the rest arrive
  ASSEMBLE: P(53.74),          // the shared turn toward the enemy
  CHARGE: P(60.65),            // committed
  // D1 — first breach
  CLASH: P(69.0),
  BR1: P(79.16), BR2: P(82.04), BR3: P(83.5), BR4: P(86.34),
  GAIN1: P(90.48), GAIN2: P(91.88),
  BREATH: P(91.8), BREATH_END: P(94.7),
  // D2 — ingenuity
  P2: P(95.0),
  DECOY: P(96.08),
  DECOY_HITa: P(100.2), DECOY_HITb: P(100.66), DECOY_HITc: P(101.1),
  FLANK: P(102.9),
  TETHER: P(106.54),
  KNOCKBACK: P(111.16), CATCH: P(112.08),
  SHIELD: P(113.9), COUNTER: P(114.82),
  BRIGHT: P(116.2),
  // D3 — strongest attack, then the system adapts
  P3: P(117.62),
  HEAVY_DOWN: P(126.34),       // the Crew's best moment: a heavy machine falls
  ADAPT: P(128.72),            // a drone finds a better angle
  FORMATION: P(131.72),        // the arc re-forms together
  DECOY_FAIL: P(134.52),
  FLANK_DENIED: P(138.36),
  ALLY_DRONE_LOST: P(141.18),
  HEAVY2: P(143.06),           // a second heavy continues the task
  HEAVY2_FIRE: P(145.88),
  // D4 — the last stand breaks
  P4: P(150.56),
  ARRIVAL: P(163.12),          // B♭: the last coordinated counterattack
  LOCAL_WIN: P(167.11),
  REALIZE: P(171.1),
  STRIKE: P(178.46),           // the Director takes the blow meant for a teammate
  SOFTEN: P(180.0),            // he falls
  B184: P(184.0),
  FINAL_HIT: P(187.6),         // the machines stop as one
  RING_END: P(193.8),          // Portals rings out
  // E/F/G — death, the radio, the end card
  EYES_CLOSE: 196.6,
  RADIO_FLUTTER,
  /** @deprecated R2 name for the moment the radio comes alive (now RADIO_FLUTTER: nobody touches it) */
  RADIO_CLICK: RADIO_FLUTTER,
  L_START,
  SONG_CADENCE: L(L_CADENCE_REC),   // 234.26: the phrase arrives home
  MUSIC_END: L(L_CADENCE_REC + L_FADE), // 237.26: silent
  CARD_IN: 231.6,              // the final card: A FUTURE GOT WEIRD FILM
  /** @deprecated R2 name (the credit crawl is gone); the pullback ends here */
  CREDITS_IN: 231.6,
  END: 237.8,
};

export type Mv = 'A' | 'B' | 'C' | 'D1' | 'D2' | 'D3' | 'D4' | 'E' | 'F' | 'G';
export type Shot = {id: string; start: number; end: number; mv: Mv; note: string};

/** Section boundaries. Shot-level boundaries live in each section's module (src/r2/shots/<section>/). */
export const SECTIONS: {id: Mv; start: number; end: number; note: string}[] = [
  {id: 'A', start: 0, end: M.TITLE_OUT, note: 'New York falls: aerial over the burning district; a tower fails; black title card'},
  {id: 'B', start: M.TITLE_OUT, end: M.BASS_OUT, note: 'The Director pulls himself out of the rubble, stands on the ridge; the army below; the radio in the van'},
  {id: 'C', start: M.BASS_OUT, end: M.CHARGE, note: 'The Crew joins him one by one; equipment readied; the shared turn; the charge'},
  {id: 'D1', start: M.CHARGE, end: M.P2, note: 'First breach: clash at the crater rim; four decisive contacts break a gap; position gained'},
  {id: 'D2', start: M.P2, end: M.P3, note: 'Ingenuity: smoke + light decoy; flank attack; tether crash at the girder; catch; drone shields; counter'},
  {id: 'D3', start: M.P3, end: M.P4, note: 'Strongest attack fells a heavy; the system adapts: high drone, formation change, decoy ignored, flank denied, drone lost, second heavy'},
  {id: 'D4', start: M.P4, end: M.FINAL_HIT, note: 'Losing ground; last counterattack on the B♭; the ring closes; the Director takes the blow and falls by the van'},
  {id: 'E', start: M.FINAL_HIT, end: 198.3, note: 'The machines stop; his last breath; eyes close; stillness'},
  {id: 'F', start: 198.3, end: M.CARD_IN, note: 'From his still face to the unattended radio: indicator flutter, static, the song from its opening; one rising pullback to the fallen city'},
  {id: 'G', start: M.CARD_IN, end: M.END, note: 'End card: A FUTURE GOT WEIRD FILM (the song resolves and fades)'},
];

export const FILM_END = M.END;
export const FRAMES = Math.round(FILM_END * FPS);
