/**
 * Sound-design cue sheet. Every V2 scene exports `SFX: Sfx[]` built from the same cue constants that drive its
 * animation, so a sound lands on the exact frame of the contact it belongs to. tools/collect_sfx.mjs gathers them and
 * the mixer (tools/make_sfx_v2.py) places one sample per cue. Keep it selective: sounds belong to physical events
 * (contacts, mechanisms, reveals), not to every movement. No wall-to-wall whooshes.
 *
 *   f     global frame of the contact / event onset
 *   kind  one of SFX_KINDS
 *   gain  dB offset from that kind's default (e.g. -6 for a lighter version, +3 for the heavy one)
 *   pitch semitone offset (e.g. rising squeaks for marks made in sequence)
 *   dur   seconds, for sustained kinds (ambiences, hums, motors, scanner sweeps)
 */
export type Sfx = {f: number; kind: SfxKind; gain?: number; pitch?: number; dur?: number; note?: string};

export const SFX_KINDS = {
  // paper and cards
  paper_flap: 'a sheet or ticket flaps / settles in the air',
  paper_slide: 'paper slid across a counter or desk',
  paper_slap: 'paper or a document set down firmly',
  paper_lift: 'paper picked up / lifted off a surface',
  paper_swish: 'a sheet whisked away quickly',
  card_flick: 'a small card flicked / set down with a flourish',
  card_slide: 'an index card sliding out of a drawer',
  page_turn: 'a page turning',
  tape_rip: 'a strip of tape torn and pressed on',
  // marks and writing
  marker_sweep: 'highlighter sweep over text',
  marker_circle: 'pen/marker drawing a loop round a word',
  pencil_tap: 'pencil tapped on a counter',
  typewriter_tick: 'one key of a typewriter (word-by-word typing)',
  // stamps and impacts
  stamp_light: 'rubber stamp, light',
  stamp_heavy: 'rubber stamp, heavy (the climax hit)',
  thud_soft: 'a soft, small object landing',
  gavel: 'a gavel strike',
  // small UI-ish physical clicks (use sparingly)
  pop_tick: 'a tiny pop / tick when a small element snaps into place',
  hanger_click: 'a hanging sign or ticket catches on its strings',
  bell_ding: 'service-counter bell',
  chip_pop: 'a label / tag pops on',
  glint: 'a short sparkle on something polished',
  whoosh_soft: 'a short, soft air movement (transitions only, rarely)',
  // machines and mechanisms
  conveyor_run: 'conveyor belt running (sustained; dur)',
  conveyor_clunk: 'conveyor stops / indexes one step',
  token_select: 'a candidate token is highlighted / chosen',
  token_lock: 'a token snaps into the sentence (locking click)',
  prob_tick: 'a probability bar / number ticks up or down',
  drawer_open: 'wooden catalogue drawer sliding open',
  drawer_close: 'wooden drawer closing',
  book_slide: 'a book slid along a shelf',
  machine_clunk: 'a mechanical stage engages (lever, gate, ram)',
  machine_hum: 'a machine hums (sustained; dur)',
  scanner_sweep: 'a scanner beam sweeps a document (dur)',
  indicator_yes: 'a positive indicator light / soft chime',
  indicator_no: 'a negative indicator light / low blip',
  claim_fails: 'the CLAIM FAILS verdict (mechanical thunk + low tone)',
  printer_feed: 'paper fed / ejected by a machine',
  // the game show
  buzzer_wrong: 'game-show wrong-answer buzzer',
  ding_right: 'game-show correct-answer ding',
  score_flip: 'a mechanical scoreboard digit flip (one per step)',
  crowd_cheer: 'a small studio audience cheer (dur)',
  crowd_aww: 'a small studio audience "aww"',
  fanfare_small: 'a short, deliberately excessive celebration fanfare',
  trophy_clink: 'a trophy set down / clinks',
  trophy_steps: 'little trophy footsteps (dur)',
  // branding
  logo_hit: 'the channel wordmark lands',
  // ambiences (sustained; dur; mixed very low)
  amb_counter: 'answer-counter room tone',
  amb_conveyor: 'token-factory room tone',
  amb_library: 'library room tone',
  amb_gameshow: 'game-show studio room tone',
  amb_machine: 'evidence-machine room tone',
} as const;

export type SfxKind = keyof typeof SFX_KINDS;
