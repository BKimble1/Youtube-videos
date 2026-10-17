// THE LAST CHOICE — the one timing structure. Music edit, anchors and shot boundaries live here; shots, the sound
// cue sheet (sfx.ts) and the audio tools all read from it. Times are film seconds unless a name says `rec`.
//
// Music sources are the owner's two screen recordings (release film-audio-v1), audio extracted to WAV. `rec` times are
// positions in those recordings, measured in tools/analyze_music*.py (see production/MUSIC_CUE_SHEET.md):
//   Portals  rec ≈ track − 3.0 s (player clock ±0.5 s); the track ends in silence at rec 193.80 (next track at 194.2)
//   Long, Long Time  rec ≈ track − 2.2 s; the player switches to the next track at rec 195.3 (no clean final cadence)
export const FPS = 30;

export type MusicSeg = {src: string; recIn: number; recOut: number; film: number; fadeIn?: number; fadeOut?: number; xfade?: number};
// xfade: equal-power crossfade (s) that ENDS on this segment's first sample time, so a hit at recIn plays at full level.
export const MUSIC: MusicSeg[] = [
  {src: 'portals', recIn: 9.8, recOut: 81.688, film: 9.34, fadeIn: 0.2},                 // near-silence before the first solo note
  {src: 'portals', recIn: 143.081, recOut: 193.8, film: 81.228, xfade: 0.12, fadeOut: 0.3}, // splice: 61.393 s removed
  {src: 'longtime', recIn: 58.45, recOut: 115.3, film: 147.0, fadeIn: 0.25},             // radio lead-in → vocal; fades under the card
];
/** Film time of a recording time inside a music segment. */
export const filmOf = (src: string, rec: number) => {
  const s = MUSIC.find((m) => m.src === src && rec >= m.recIn - 1e-6 && rec <= m.recOut + 1e-6);
  if (!s) throw new Error(`rec ${rec} of ${src} is not used in the edit`);
  return s.film + (rec - s.recIn);
};

// ---------------------------------------------------------------- music anchors (film seconds)
export const M = {
  P_IN: 9.34,
  FIRST_NOTE: filmOf('portals', 10.0),        // first sparse solo note emerges from silence
  REVEAL: filmOf('portals', 17.46),           // full-orchestra entrance: the refuge appears
  HIT_A: filmOf('portals', 19.16), HIT_B: filmOf('portals', 19.58),
  HIT_SUBWAY: filmOf('portals', 24.24),       // the subway grille bursts open
  HIT_STRAP: filmOf('portals', 30.96),        // the strap is cinched
  HIT_GATE1: filmOf('portals', 32.62), HIT_GATE2: filmOf('portals', 33.04),
  BASS_OUT: filmOf('portals', 36.5), BASS_IN: filmOf('portals', 38.3), // held breath before the assembly
  ASSEMBLY: filmOf('portals', 39.16),         // hit: cut to the assembly composition
  HIT_AS2: filmOf('portals', 40.86), HIT_AS3: filmOf('portals', 41.28),
  MARCH: filmOf('portals', 46.0),             // driving pulse begins
  HIT_HAULER: filmOf('portals', 53.74),
  HIT_DRONE_SEES: filmOf('portals', 79.16),
  SPLICE: 81.228,                             // music join; the walker is smashed on it
  HIT_FALL: filmOf('portals', 145.88),
  HIT_RUN: filmOf('portals', 150.56),
  ARRIVAL: filmOf('portals', 163.0),          // B♭ statement: the operator chooses to hold
  SOFTEN: filmOf('portals', 180.0),
  FINAL_HIT: filmOf('portals', 187.6),        // the refuge doors open
  P_END: filmOf('portals', 193.8),
  RADIO_CLICK: 145.6,
  L_IN: 147.0,
  VOCAL: filmOf('longtime', 64.4),            // inferred vocal entrance (see cue sheet)
  OPEN_FULL: filmOf('longtime', 99.8),        // radio speaker → full range as the enclosure is revealed
  CARD: filmOf('longtime', 112.4),            // inferred end of a vocal phrase; trumpet fill follows
  L_FADE0: filmOf('longtime', 113.45),
  L_FADE1: filmOf('longtime', 115.3),
  END: 205.4,
};

// ---------------------------------------------------------------- shots
export type ShotId = string;
export type Shot = {id: ShotId; start: number; end: number; mv: 'A' | 'B' | 'C' | 'D' | 'E' | 'T'; note: string};
const S = (id: string, start: number, end: number, mv: Shot['mv'], note: string): Shot => ({id, start, end, mv, note});

export const SHOTS: Shot[] = [
  // A — someone to save
  S('A1', 0, 3.2, 'A', 'Puddle reflects the burning avenue; the checker’s hand slips; trapped under the overturned taxi'),
  S('A2', 3.2, 6.4, 'A', 'Recovery arm clamps and shifts the wreck; a drone turns its eye toward the movement'),
  S('A3', 6.4, 10.4, 'A', 'The Director’s hand reaches in; the pull; the taxi slams down where they were'),
  S('A4', 10.4, 14.2, 'A', 'Checkpoint funnel and separation; a warden gestures; the Director keeps the teammate'),
  S('A5', 14.2, 20.5, 'A', 'Crane up: the avenue, the elevated highway with its broken span, the refuge (on the entrance)'),
  // B — the Crew assembles
  S('B1', 20.5, M.HIT_SUBWAY, 'B', 'Behind a wreck: the impossible route'),
  S('B2', M.HIT_SUBWAY, 27.4, 'B', 'The subway grille bursts up; the builder climbs out and beckons'),
  S('B3', 27.4, 32.0, 'B', 'The visor through smoke; strap cinched (radio); nod and brim tap'),
  S('B4', 32.0, M.BASS_OUT, 'B', 'In the stalled subway: a manual gate heaved up; civilians duck under and join'),
  S('B5', M.BASS_OUT, M.ASSEMBLY, 'B', 'Up the exit stairs into smoky light; hands helping the last step'),
  S('B6', M.ASSEMBLY, 47.0, 'B', 'The assembly: battered Crew on the raised approach, machines below, the refuge beyond'),
  // C — set piece 1: the closing avenue
  S('C1', 47.0, 51.0, 'C', 'Down the ramp toward a gap under the highway; a pole camera turns'),
  S('C2', 51.0, 54.6, 'C', 'Calm wide: vehicles ahead switch on in sequence and reposition before the Crew arrives'),
  S('C3', 54.6, 58.6, 'C', 'The hauler slams the gap; debris; a Crew member knocked down and hurt; helped up'),
  S('C4', 58.6, 64.6, 'C', 'Behind the highway pier and up a maintenance stair; drones sweep the empty gap, then tilt up'),
  // C — set piece 2: the decoy
  S('C5', 64.6, 69.0, 'C', 'Steam under the deck: a sketch on a battered tablet becomes walking figures'),
  S('C6', 69.0, 74.0, 'C', 'Projected giants in the steam; the machines turn; the Crew runs for the next cover'),
  S('C7', 74.0, 78.6, 'C', 'A small drone circles the steam, sees the flat projection edge-on and follows the beam'),
  S('C8', 78.6, 88.0, 'C', 'A warden drops onto the catwalk; smashed into a column (on the splice); falls; replaced'),
  // C — set piece 3: the maintenance crossing
  S('C9', 88.0, 92.0, 'C', 'Signature wide: the broken span, the gantry and basket, the landing, the refuge beyond'),
  S('C10', 92.0, 95.6, 'C', 'The operator takes the dead-man lever; a look sends the Director onto the basket'),
  S('C11', 95.6, M.ARRIVAL, 'C', 'The transfer across the gap; landing barrier jammed; the handoff; back to the operator'),
  S('C12', M.ARRIVAL, 104.6, 'C', 'Sensor lock; the breaker turns; a glance and a nod; the hand tightens'),
  S('C13', 104.6, 107.6, 'C', 'Basket docks; the operator runs onto the catwalk; the decisive blast'),
  S('C14', 107.6, 113.6, 'C', 'Muffled: the Director goes back along the failing catwalk; catches the hand; pulls them in'),
  S('C15', 113.6, 118.0, 'C', 'The gantry falls on the breaker; the crossing is gone'),
  S('C16', 118.0, M.FINAL_HIT, 'C', 'Down to the waterfront carrying the wounded friend; the refuge entrance'),
  // D — lives saved, one friend lost
  S('D1', M.FINAL_HIT, 131.0, 'D', 'The doors open on warmth; attendants; the teammate on a gurney; civilians cared for'),
  S('D2', 131.0, 135.5, 'D', 'The friend on a bed; urgent care; eyes open toward the teammate they saved'),
  S('D3', 135.5, 139.0, 'D', 'Hands: the grip weakens and releases'),
  S('D4', 139.0, 145.0, 'D', 'The attendant stops and covers the still figure; silence; the Director keeps holding on'),
  S('D5', 145.0, 153.6, 'D', 'The radio set on the bench and switched on; the old song; the visor picked up'),
  // E — safety without freedom
  S('E1', 153.6, 158.4, 'E', 'The entry doors close; the outer shutter lowers; a patrol passes'),
  S('E2', 158.4, 165.0, 'E', 'An able-bodied survivor calmly tries to leave; gently redirected'),
  S('E3', 165.0, 174.0, 'E', 'The visor on the empty chair; removed by a service machine; retrieved by the Director'),
  S('E4', 174.0, 181.4, 'E', 'Days: a meal, tools collected, reconstruction beyond the glass (night to dawn)'),
  S('E5', 181.4, M.OPEN_FULL, 'E', 'The open view is glass: a hand meets it'),
  S('E6', M.OPEN_FULL, 194.0, 'E', 'Pull back: a sealed dome among other enclosures'),
  S('E7', 194.0, M.CARD, 'E', 'A hand on the shoulder; the assembly composition again, with one empty place'),
  S('T1', M.CARD, M.END, 'T', 'Title and end credit'),
];
export const FILM_END = M.END;
export const FRAMES = Math.round(FILM_END * FPS);
export const shot = (id: ShotId) => {
  const s = SHOTS.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s;
};
