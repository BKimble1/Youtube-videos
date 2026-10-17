// THE LAST CHOICE — R2 master timing. Single source of truth for music, anchors and shot boundaries (film seconds).
//
// Portals is used IN FULL from its first clean event: the recording (release asset 234600) starts ~3 s into the track
// inside a decaying chord, so we enter at rec 1.30 (just before the 1.42 s low hit) and play to the natural ring-out at
// rec 193.8. Film time = Portals rec time − 0.70. Nothing is removed in between (R1's 61.4 s cut is restored).
//
// "It's Been a Long, Long Time" (release asset 235008) starts at the radio click: rec 0 → 10.205 (opening trumpet
// phrase), one edit to rec 57.26 (the matching cadence at the end of the instrumental chorus; chosen by
// tools/llt_edit.py), then on through the lead-in to the first vocal ("Never", rec 64.36 — from per-word Scribe
// timestamps, not inferred) and the first sung chorus, ending after "It's been a long, long time" (rec 100.48) with a
// fade before the next phrase (rec 102.44).
export const FPS = 30;
export const P_OFF = 0.70; // film = portals rec − P_OFF
export const P = (rec: number) => rec - P_OFF;

export type MusicSeg = {src: 'portals' | 'longtime'; recIn: number; recOut: number; film: number; fadeIn?: number; fadeOut?: number; xfade?: number};

const RADIO_CLICK = 199.9;
const L_START = RADIO_CLICK + 0.5; // after the click and a moment of tuning crackle
const L_JOIN_SRC = 10.205, L_JOIN_DST = 57.26, L_END = 102.2;
const L_JOIN = L_START + L_JOIN_SRC;

export const MUSIC: MusicSeg[] = [
  {src: 'portals', recIn: 1.30, recOut: 193.8, film: P(1.30), fadeIn: 0.1},
  {src: 'longtime', recIn: 0.0, recOut: L_JOIN_SRC, film: L_START, fadeIn: 0.04},
  {src: 'longtime', recIn: L_JOIN_DST, recOut: L_END, film: L_JOIN, xfade: 0.06, fadeOut: 1.6},
];
const L = (rec: number) => L_JOIN + (rec - L_JOIN_DST); // film time of a Long, Long Time rec time after the join

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
  // E/F/G — death, radio, credits
  EYES_CLOSE: 196.6,
  RADIO_CLICK,
  L_START,
  L_JOIN,
  VOCAL: L(64.36),             // "Never thought that you would be…"
  CLOSE_TO_ME: L(70.1),
  WORDS_WAIT: L(76.86),        // "But words can wait until some other day"
  KISS_ME: L(89.46),
  LONG_TIME: L(95.4),          // "It's been a long, long time"
  LONG_TIME_END: L(100.48),
  MUSIC_END: L(L_END),
  CREDITS_IN: 230.4,
  END: 258.0,
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
  {id: 'E', start: M.FINAL_HIT, end: M.RADIO_CLICK - 0.6, note: 'The machines stop; his last breath; eyes close; stillness'},
  {id: 'F', start: M.RADIO_CLICK - 0.6, end: M.CREDITS_IN, note: 'A hand turns the radio on; trumpet; one rising pullback from his face to the fallen city; the vocal enters'},
  {id: 'G', start: M.CREDITS_IN, end: M.END, note: 'Credits crawl: the 2042 scenario text, title, accurate credits'},
];

export const FILM_END = M.END;
export const FRAMES = Math.round(FILM_END * FPS);
