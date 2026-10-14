/**
 * Sound-design cue sheet. Each scene exports `SFX(): Sfx[]` built from the same cue constants that drive its
 * animation, so a sound lands on the exact frame of the contact it belongs to. tools/collect_sfx.mjs gathers them and
 * tools/mix_audio.py places one sample per cue. Sounds belong to physical events (contacts, mechanisms, reveals) and a
 * few comic beats, not to every movement. No wall-to-wall whooshes.
 *
 *   f     global frame of the contact / event onset
 *   kind  one of SFX_KINDS (each maps to a file in source/public/audio/sfx/<kind>.mp3)
 *   gain  dB offset from that kind's default
 *   pitch semitone offset
 *   dur   seconds, for sustained kinds
 */
export type Sfx = {f: number; kind: SfxKind; gain?: number; pitch?: number; dur?: number; note?: string};

export const SFX_KINDS = {
  amb_foundry: 'large steel-plant room tone: low furnace rumble, distant hum (sustained)',
  amb_sim: 'very soft digital room tone for the simulation world (sustained)',
  robot_step: 'one robot footstep on a metal walkway: a dull metallic clank',
  servo_whir: 'a short servo whir as the robot crouches',
  robot_push: 'push-off: a firm metallic thump and servo burst',
  molten_entry: 'a heavy object plunging into molten metal: deep whoomp with a hiss',
  sizzle: 'molten-metal sizzle and crackle, fading (sustained)',
  paper_slide: 'paper panel sliding in',
  paper_swish: 'paper whisked away',
  card_flick: 'a card set down with a flick',
  pop_tick: 'a tiny pop when a small element snaps into place',
  tag_clink: 'a metal tag on a string clinks against the robot',
  marker_x: 'a marker slashes a cross on a card',
  stamp: 'a rubber stamp hits paper (heavy)',
  clapper: 'a film clapperboard snap',
  map_pin: 'a pin pushed into a map board',
  buzz_no: 'a soft negative blip',
  ding_yes: 'a soft positive chime',
  sim_blip: 'a short soft digital blip (simulation)',
  sim_fall: 'a cartoon flop of a virtual robot falling over (soft, comic)',
  counter_tick: 'a rapid digital counter ticking (sustained)',
  slider_tick: 'a slider clicking along a notched track',
  knee_tap: 'a reflex hammer tap: small rubbery tock',
  airbag: 'a big body landing on an inflated air cushion: deep whump',
  static: 'brief electrical static crackle',
  whoosh_soft: 'a short, soft air movement (transitions only, rarely)',
  sting_end: 'a short warm closing chord sting',
} as const;

export type SfxKind = keyof typeof SFX_KINDS;
