#!/usr/bin/env python3
"""Mix for the V1 film (34.5 s): Test Voice narration (full take A, untouched) + procedural Foley. numpy only, deterministic.
Usage: python3 tools/build_audio_v1.py
Reads  audio/v4/cues_v1.json (tools/build_cues_v1.mjs), audio/v3/cues_h1.json (the hook's own event table), audio/v4/voice/v1_takeA_48k.wav, tools/foley_lib.py
Writes audio/v4/v1/sfx/*.wav, audio/v4/v1/stems/{voice,foley_*}.wav, stems/mix_v1.wav (stereo, identical channels), voice_only_v1.wav, sfx_only_v1.wav, SFX_LOG.csv, MIX_LOG.json
Group levels are set RELATIVE to the voice (dB re the voice RMS over voiced frames); SFX groups that share the speech band are ducked under speech; the mix is scaled to -15 LUFS integrated with a -1.5 dBTP ceiling.
Nothing in the narration is moved, trimmed or stretched. Levels are design targets, NOT listening results."""
import csv, json, os, re, subprocess, sys, wave
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import foley_lib as L
from foley_lib import SR, write_wav, norm, tgrid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f'{ROOT}/audio/v4/v1'
cv = json.load(open(f'{ROOT}/audio/v4/cues_v1.json'))
ch = json.load(open(f'{ROOT}/audio/v3/cues_h1.json'))
FPS = cv['fps']; N = cv['total_frames']; DUR = N / FPS; NS = int(round(DUR * SR))
E = cv['events']; EF = cv['event_frames']; W = cv['words']
HE = {k: v['frame'] for k, v in ch['events'].items()}
HFR = ch['frames']; HFT = [f['t'] for f in HFR]
at = lambda f: f / FPS
LOG = []
GROUPS = ['globe', 'globe2', 'friction', 'impacts', 'liquid', 'air_cloth', 'air2', 'bike', 'graphics', 'bed', 'wind', 'water', 'objects', 'steps', 'whoosh']
G = {k: np.zeros(NS) for k in GROUPS}
REL = {'globe': -3.0, 'globe2': -3.0, 'friction': -11.0, 'impacts': -8.0, 'liquid': -15.0, 'air_cloth': -17.0, 'bike': -15.0, 'graphics': -17.0, 'bed': -23.0, 'rewind': -10.0, 'air2': -17.0,
       'wind': -13.0, 'water': -10.0, 'objects': -10.0, 'steps': -19.0, 'whoosh': -18.0}
# the hook keeps its H1 ducking (graphics 3 dB there); the film-level groups sit lower under speech because the narration is almost continuous after the hook
DUCK_DB = {'friction': 4.0, 'liquid': 4.0, 'air_cloth': 5.0, 'bike': 4.0, 'graphics': 6.0, 'impacts': 6.0, 'globe': 0.0, 'globe2': 4.0, 'bed': 5.0, 'rewind': 3.0, 'air2': 8.0, 'wind': 9.0, 'water': 6.0, 'objects': 5.0, 'steps': 4.0, 'whoosh': 7.0}


def hcurve(key, t0, n):  # the hook's own per-frame curves
    return np.interp(np.arange(n) / SR + t0, HFT, [f[key] for f in HFR])


def vcurve(name, t0, n):  # film-level per-frame curves
    c = cv['curves'][name]
    return np.interp((np.arange(n) / SR + t0) * FPS, np.arange(len(c)), c)


def place(group, name, x, t0, gain_db, note):
    k = int(round(t0 * SR)); g = 10 ** (gain_db / 20)
    m = max(0, min(len(x), NS - k))
    if m > 0: G[group][k:k + m] += g * x[:m]
    write_wav(f'{OUT}/sfx/{name}.wav', x)
    LOG.append({'file': f'audio/v4/v1/sfx/{name}.wav', 'frame': round(t0 * FPS, 2), 'time_s': round(t0, 4), 'gain_db_in_group': gain_db, 'group': group, 'note': note})


def fade(x, a=0.0, b=0.0):
    x = x.copy()
    if a: n = min(len(x), int(a * SR)); x[:n] *= np.linspace(0, 1, n)
    if b: n = min(len(x), int(b * SR)); x[-n:] *= np.linspace(1, 0, n)
    return x


# ---------------------------------------------------------------- voice
with wave.open(f'{ROOT}/audio/v4/voice/v1_takeA_48k.wav') as w:
    v = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
voice = np.zeros(NS); voice[:min(NS, len(v))] = v[:NS]
w20 = int(0.02 * SR)
venv = np.sqrt(np.convolve(voice ** 2, np.ones(w20) / w20, mode='same'))
voiced = venv > 0.02 * np.max(venv)
voice_rms = float(np.sqrt(np.mean(voice[voiced] ** 2)))

# ================================================================ B01 hook (the H1 sound design, same events)
stop_t = at(HE['globe_stop'])
spin = L.fx_spin_whirr('h1_spin', stop_t, rev_hz=5.5)
spin[-int(0.001 * SR):] *= np.linspace(1, 0, int(0.001 * SR))
place('globe', 'hook_globe_spin_bed', spin, 0.0, 0.0, f'frames 0-{HE["globe_stop"]}: the planet turning fast; cut dead at the stop frame')
t_hero = stop_t + 0.100
LAUNCH, LAND = HE['launch'], HE['land']
skid1 = L.fx_scrape('h1_scrape_planted', at(LAUNCH) - t_hero, f0=205, f1=170, att=0.002, rel=0.022)
place('friction', 'hook_shoe_scrape_planted', skid1, t_hero, 0.0, 'hook: shoes grab and skid after the 100 ms void')
slide_dur = at(HE['bounce'] + 22) - at(LAND)
sl = L.fx_scrape('h1_scrape_slide', slide_dur, f0=175, f1=70, lo=900, hi=6200, att=0.004, rel=0.05)
tt = tgrid(slide_dur); vs = hcurve('v_hero', at(LAND), len(tt))
sl = sl * (0.25 + 0.75 * (vs / max(vs)) ** 1.6) * np.minimum(1, 0.55 + 4 * tt); sl *= np.clip(vs / 4.0, 0, 1)
place('friction', 'hook_shoe_scrape_slide', sl, at(LAND), -4.0, 'hook: dragged to rest after the landing')
place('impacts', 'hook_landing_thump', L.fx_thud('h1_land', 150, 62, 0.11, 0.9), at(LAND), -2.0, 'hook: body lands')
place('impacts', 'hook_landing_bounce', L.fx_thud('h1_bounce', 130, 60, 0.07, 0.6, 0.3), at(HE['bounce']), -9.0, 'hook: small second contact')
place('impacts', 'hook_launch_scuff_snap', L.fx_launch('h1_launch'), at(LAUNCH), -12.0, 'hook: shoes leave the pavement (4 dB lower than H1: its snap landed on the quiet end of "Earth")')
place('liquid', 'hook_ceramic_rim_tick', L.fx_ceramic_tick('h1_tick'), at(HE['cup_tick']), 0.0, 'hook: ceramic rim tick')
jd = at(HE['jet_last'] - HE['jet_first'] + 4)
place('liquid', 'hook_coffee_stream', L.fx_coffee_jet('h1_jet', jd), at(HE['jet_first']), -2.0, 'hook: coffee thrown out as a tapering stream')
big = [l for l in ch['coffee']['landings'] if 0 < l['screen_x'] < 1080 and l['r'] > 9]
small = [l for l in ch['coffee']['landings'] if 0 < l['screen_x'] < 1080 and l['r'] <= 9]
for i, l in enumerate(big):
    place('liquid', f'hook_coffee_splat_big_{i:02d}', L.fx_splat(f'h1_splat{i}', 1050 + 90 * (i % 5)), l['t'], -8.0 - (i % 3) - (2 if l['r'] < 10 else 0), f"hook: drop k={l['k']} lands")
for i, l in enumerate(small[::2]):
    place('liquid', f'hook_coffee_patter_{i:02d}', L.fx_splat(f'h1_patter{i}', 1500 + 70 * (i % 4)), l['t'], -16.0, 'hook: patter')
r0, r1 = HE['scene0'] + 1, HE['brake_end'] + 3
rush = L.fx_rush('h1_rush', at(r1 - r0)); tr = tgrid(at(r1 - r0)); cr = hcurve('cam_rel', at(r0), len(tr))
rush = norm(rush * (cr / max(cr)) ** 1.2, 0.7); rush[-int(0.12 * SR):] *= np.linspace(1, 0, int(0.12 * SR))
place('air_cloth', 'hook_air_rush', rush, at(r0), 0.0, 'hook: air past her; follows the street scroll')
place('air_cloth', 'hook_jacket_scarf_flutter', L.fx_flap('h1_flap', at(LAND - HE['flap_in']) + 0.2), at(HE['flap_in']), -3.0, 'hook: cardigan and scarf flutter')
b0, b1 = HE['bike_enter'], HE['bike_exit']
bd = at(b1 - b0); fw = L.fx_freewheel('h1_freewheel', bd, 21.0, 16.0); tb = tgrid(bd)
vis = np.interp(tb + at(b0), HFT, [f['bike_vis'] for f in HFR]); sx = np.interp(tb + at(b0), HFT, [f['bike_x'] for f in HFR])
lvl = np.clip(vis, 0, 1) ** 0.8 * (0.55 + 0.45 * (1 - np.clip(np.abs(sx - 540) / 700, 0, 1)))
fw = fw * lvl; fw[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
place('bike', 'hook_bike_freewheel', fw, at(b0), 0.0, 'hook: riderless bicycle freewheeling')
slap = L.fx_tag_slap('h1_tag')
for k, (fr, g, n) in enumerate([(HE['chip_bike'], 0.0, 'speed tag on the bicycle'), (HE['chip_lamp'], -2.0, '0 MPH tag on the lamp post'), (HE['east'], 3.0, 'EAST plate'), (HE['num_a'], 3.0, 'speed plate'), (HE['num_a'] + 2, -5.0, 'EQUATOR tag'), (HE['mph'], -5.0, 'MPH')]):
    place('graphics', f'hook_tag_slap_{k}', slap, at(fr), g, f'hook frame {fr}: {n} lands (cardboard slap)')
ra, times = L.ratchet_train('h1_counter', 18, at(HE['num_b'] - HE['num_a']), ease=3.0)
place('graphics', 'hook_counter_ratchet', ra, at(HE['num_a']), 0.0, 'hook: odometer ticks while the number rolls up')
place('graphics', 'hook_counter_clunk', L.fx_clunk('h1_clunk'), at(HE['num_b']), -2.0, 'hook: the counter reaches its stop')

# ================================================================ the turning Earth: a quiet bed from the rewind's end (f90) until it STOPS at "Stop" (f312): hard cut + 100 ms void, as in the hook
STOP = E['stop']
bed = L.fx_spin_whirr('h1_was_bed', at(STOP) - at(HE['rewind_end']), rev_hz=5.5)
bed[:int(0.15 * SR)] *= np.linspace(0, 1, int(0.15 * SR)); bed[-int(0.001 * SR):] *= np.linspace(1, 0, int(0.001 * SR))
place('bed', 'earth_turning_bed', bed, at(HE['rewind_end']), 0.0, f'frames {HE["rewind_end"]}-{STOP}: the Earth turning under "this street was moving east" and B02; cut dead on "Stop" (f{STOP}) like the hook')
sw = L.fx_swoosh

# ================================================================ B02
place('whoosh', 'b02_iris_swoosh', sw('v1_iris', 0.28, up=True), at(E['iris_a']) - 0.07, -2.0, f'frame {E["iris_a"]}: the inset globe grows into the diagram (iris)')
for i, fr in enumerate(EF['icon_pops']):
    place('graphics', f'b02_icon_slap_{i}', slap, at(fr), -10.0, f'frame {fr}: an icon lands on the globe (cardboard slap, quiet)')
place('whoosh', 'b02_dive_swoosh', sw('v1_dive', 0.6, up=True), at(E['zoom_a']), -3.0, f'frames {E["zoom_a"]}-{E["zoom_b"]}: dive from the globe into the street')
place('graphics', 'b02_lens_slap', slap, at(E['lens']), -2.0, f'frame {E["lens"]}: the cup lens lands')
for i, fr in enumerate(EF['b02_arrows']):
    place('graphics', f'b02_arrow_slap_{i}', slap, at(fr), -6.0, f'frame {fr}: an east arrow lands')
place('graphics', 'b02_chip_slap', slap, at(E['b02_chip']), 0.0, f'frame {E["b02_chip"]}: ALL MOVING EAST - TOGETHER lands')
place('whoosh', 'b02_pan_swoosh', sw('v1_pan', at(E['pan_b'] - E['pan_a']) + 0.1, (200, 900), (1200, 5500), up=True), at(E['pan_a']), 1.0, f'frames {E["pan_a"]}-{E["pan_b"]}: whip pan east to the plaza')

# ================================================================ B03: the ground stops; everything loose keeps going (the same 100 ms void after the cut, then the sounds)
tv = at(STOP) + 0.100
fscr = lambda nm, dur, f0, f1: L.fx_scrape_furniture(nm, dur, f0, f1, 1800, 9000)  # the audited pick: metal legs on stone
for oid, kind, tau in [(o['id'], o['kind'], o['tau']) for o in EF['plaza']]:
    sec = lambda frames: frames / FPS
    if oid == 'chairA':
        x = fscr('v1_chairA', sec(3 * tau + 6), 330, 170); x = x * np.exp(-tgrid(sec(3 * tau + 6)) / sec(tau * 1.3)); place('objects', 'b03_chairA_scrape', fade(x, 0.003, 0.05), tv, 0.0, 'a chair dragged by the stopped ground')
    if oid == 'chairB':
        x = fscr('v1_chairB', sec(3 * tau + 6), 360, 180); x = x * np.exp(-tgrid(sec(3 * tau + 6)) / sec(tau * 1.3)); place('objects', 'b03_chairB_scrape', fade(x, 0.003, 0.05), tv + 0.03, -1.5, 'the second chair')
    if oid == 'table':
        x = fscr('v1_table', sec(3 * tau + 6), 250, 130); x = x * np.exp(-tgrid(sec(3 * tau + 6)) / sec(tau * 1.4)); place('objects', 'b03_table_scrape', fade(x, 0.003, 0.06), tv, 1.0, 'the table, heavier')
    if oid == 'plant':
        place('objects', 'b03_plant_slide', fade(fscr('v1_plant_slide', sec(14), 220, 120) * np.exp(-tgrid(sec(14)) / sec(7)), 0.003, 0.04), tv, -3.0, 'the pot slides')
        place('objects', 'b03_plant_tip', L.fx_pot_tip('v1_pot'), at(STOP + 9), 0.0, f'frame {STOP + 9}: the pot tips over and spills')
    if oid == 'box':
        place('objects', 'b03_box_tumble', L.fx_cardboard_scrape('v1_box', 1.2), tv, -1.0, 'the cardboard box drags and tumbles')
    if oid == 'cone':
        place('objects', 'b03_cone_slide', fade(fscr('v1_cone_slide', sec(22), 420, 220) * np.exp(-tgrid(sec(22)) / sec(10)), 0.003, 0.04), tv, -4.0, 'the cone slides')
        place('objects', 'b03_cone_clack', L.fx_cone_clack('v1_cone'), at(STOP + 15), -1.0, f'frame {STOP + 15}: the cone tips (hollow clack)')
ball_dur = at(E['ball_exit'] - STOP) + 0.12
roll = L.fx_roll('v1_ball', ball_dur, 8.0, 7.0); roll = roll * np.linspace(1, 0.6, len(roll)); roll[-int(0.1 * SR):] *= np.linspace(1, 0, int(0.1 * SR))
place('objects', 'b03_ball_roll', roll, tv, -3.0, f'frames {STOP}-{E["ball_exit"]}: the ball rolls off screen')
for i, (fr, g) in enumerate([(E['fixed_chip'], -2.0), (E['fixed_chip2'], -5.0), (E['loose_chip'], 0.0)]):
    place('graphics', f'b03_chip_slap_{i}', slap, at(fr), g, f'frame {fr}: {"FIXED" if i < 2 else "LOOSE"} chip lands')
place('whoosh', 'b03_wipe_swoosh', sw('v1_wipe1', at(E['wipe1_b'] - E['wipe1_a']) + 0.08, up=True), at(E['wipe1_a']), 0.0, f'frames {E["wipe1_a"]}-{E["wipe1_b"]}: push wipe east to the coast')

# ================================================================ B04: air, then the sea
AIR, SEA = E['air'], E['sea']
place('graphics', 'b04_at_first_slap', slap, at(E['at_first_chip']), -1.0, f'frame {E["at_first_chip"]}: AT FIRST lands')
# a calm sea under the opening (before either arrives)
amb = L.fx_surge('v1_sea_amb', at(SEA - E['wipe1_b']) + 0.3, 0.6, 0.35, 0)
place('water', 'b04_calm_sea', fade(amb, 0.4, 0.001), at(E['wipe1_b']) - 0.2, -8.0, f'frames {E["wipe1_b"]}-{SEA}: the calm sea lapping (cut as the surge begins)')
g1 = L.fx_gust('v1_gust1', 2.6, 70, 900, 0.0, 0.10, 0.9) * vcurve('wind', at(AIR) - 0.25, int(2.6 * SR)) ** 0.5
place('wind', 'b04_gust_1', g1, at(AIR) - 0.25, 0.0, f'frames {AIR - 8}-{AIR + 70}: the air keeps going (the audited low gust, level follows the wind curve)')
g2 = L.fx_gust('v1_gust2', 2.4, 70, 900, 0.0, 0.10, 0.7) * vcurve('wind', at(AIR + 40), int(2.4 * SR)) ** 0.5
place('wind', 'b04_gust_2', g2, at(AIR + 40), -2.0, f'frames {AIR + 40}-{AIR + 112}: the wind keeps blowing')
fr1 = L.fx_fronds('v1_fronds', 2.4) * vcurve('wind', at(AIR), int(2.4 * SR))
place('air2', 'b04_palm_fronds', fr1, at(AIR), 0.0, f'frames {AIR}-{AIR + 72}: palm fronds thrash')
fl = L.fx_flap('v1_flag', 3.0, 14.0, 18.0) * vcurve('wind', at(AIR + 2), int(3.0 * SR))
place('air2', 'b04_flag_flutter', fl, at(AIR + 2), -4.0, f'frames {AIR + 2}-{AIR + 92}: the flag snaps out')
for i, j in enumerate(EF['junk']):
    if j['kind'] == 'cup': place('air2', f'b04_cup_skitter_{i}', L.fx_cone_clack(f'v1_cup{i}'), at(j['f0']), -14.0, f'frame {j["f0"]}: a paper cup tumbles')
    elif j['kind'] in ('paper', 'cap'): place('air2', f'b04_swish_{i}', L.fx_paper_swish(f'v1_sw{i}', 0.3), at(j['f0']), -9.0, f'frame {j["f0"]}: a {j["kind"]} is swept off')
bird = L.fx_flap('v1_pigeon', 1.4, 8.0, 9.5) * np.minimum(1, tgrid(1.4) / 0.1) * np.linspace(1, 0.4, int(1.4 * SR))
place('air2', 'b04_pigeon_wings', bird, at(AIR + 2), -6.0, f'frames {AIR + 2}-{AIR + 44}: a pigeon is swept past')
for i, fr in enumerate(EF['b04_arrows']):
    place('graphics', f'b04_arrow_slap_{i}', slap, at(fr), -6.0, f'frame {fr}: a wind/water arrow lands')
place('graphics', 'b04_fixed_slap', slap, at(SEA + 6), -3.0, f'frame {SEA + 6}: FIXED lands on the jetty post')
srg = L.fx_surge('v1_surge', 1.6, 1.0, 0.5, 0)
place('water', 'b04_surge', srg, at(SEA) - 0.1, 0.0, f'frames {SEA - 3}-{SEA + 45}: the ocean keeps going (audited pick: rumble + foam)')
place('water', 'b04_wall_slap', L.fx_wave_slap('v1_wall', 0.9, 1.4, 0.6), at(E['sea_wall']), 0.0, f'frame {E["sea_wall"]}: the bore hits the sea wall (audited pick: heavy thud)')
place('water', 'b04_over_prom', L.fx_surge('v1_over', 0.9, 0.3, 1.0, 10), at(E['sea_prom']), -3.0, f'frame {E["sea_prom"]}: water pours over the promenade')
place('water', 'b04_tide_fill', L.fx_surge('v1_tide', at(E['wipe2_b'] - E['wipe2_a']) + 0.3, 1.0, 0.8, 8), at(E['wipe2_a']), -1.0, f'frames {E["wipe2_a"]}-{E["wipe2_b"]}: the sea rises to fill the frame')

# ================================================================ B05
dsc = E['disc']
place('graphics', 'b05_disc_slap', slap, at(dsc), -2.0, f'frame {dsc}: the polar view lands')
for i, fr in enumerate(EF['b05_lat']):
    place('graphics', f'b05_arrow_slap_{i}', slap, at(fr), -8.0, f'frame {fr}: latitude {["0", "40", "80"][i]} arrow lands')
    rb, _ = L.ratchet_train(f'v1_bar{i}', 9 if i < 2 else 5, at(20), ease=3.0)
    place('graphics', f'b05_bar_ratchet_{i}', rb, at(fr + 6), -16.0, f'frames {fr + 6}-{fr + 26}: the speed bar rolls up')
place('graphics', 'b05_bar_clunk_80', L.fx_clunk('v1_clunk80'), at(EF['b05_lat'][2] + 26), -8.0, 'the 80 degree bar reaches its value')
place('graphics', 'b05_starting_slap', slap, at(E['starting_chip']), -1.0, f'frame {E["starting_chip"]}: STARTING SPEED ONLY lands')
place('whoosh', 'b05_axis_swoosh', sw('v1_axis', 0.9, (300, 1500), (1500, 6000), up=True), at(E['bar_zoom_a']), -3.0, f'frames {E["bar_zoom_a"]}-{E["bar_zoom_b"]}: the speed axis is magnified')
place('graphics', 'b05_cat5_slap', slap, at(E['cat5']), 1.0, f'frame {E["cat5"]}: 157 = CATEGORY 5 lands')

# ================================================================ B06
place('whoosh', 'b06_cross_swoosh', sw('v1_cross', 0.5, (300, 1200), (1500, 5000), up=False), at(E['b06_a0']) - 0.45, -4.0, 'crossfade from the polar view to the globe')
place('graphics', 'b06_tag_peel', L.fx_peel('v1_peel'), at(E['b06_tagOff0']), -2.0, f'frame {E["b06_tagOff0"]}: the WHAT IF tag peels away')
bed2 = L.fx_spin_whirr('v1_b06_bed', at(E['b06_zoomA'] + 6 - E['b06_spin0']), rev_hz=3.0) * 0.8
place('bed', 'b06_earth_turns_again', fade(bed2, 0.5, 0.35), at(E['b06_spin0']), 0.0, f'frames {E["b06_spin0"]}-{E["b06_zoomA"] + 6}: the Earth turns again (the thought experiment is over)')
place('graphics', 'b06_hero_slap', slap, at(E['b06_heroPop']), -8.0, f'frame {E["b06_heroPop"]}: she lands on the globe')
place('graphics', 'b06_speed_slap', slap, at(E['b06_speedChip']), -1.0, f'frame {E["b06_speedChip"]}: ~1,000 MPH lands')
place('graphics', 'b06_equator_slap', slap, at(E['b06_eqChip']), -2.0, f'frame {E["b06_eqChip"]}: EQUATOR lands')
place('whoosh', 'b06_dive_swoosh', sw('v1_dive2', 0.85, up=True), at(E['b06_zoomA']), 0.0, f'frames {E["b06_zoomA"]}-{E["b06_zoomB"]}: dive from the globe into her')
# the close-up: the world streaks past (level follows the streak curve); she walks on, calm
cu0, cu1 = E['b06_streak0'] - 8, E['b06_streakOff'] + 6
cd = at(cu1 - cu0)
rsh = L.fx_gust('v1_rush', cd, 200, 3600, 0.0, 0.4, 0.5) * vcurve('speedK', at(cu0), int(cd * SR)) ** 0.8
place('wind', 'b06_world_rush', fade(rsh, 0.05, 0.12), at(cu0), 1.0, f'frames {cu0}-{cu1}: the world streaks past her; the level follows the streak curve')
foot = L.fx_footstep('v1_step', 0.6, 1.4)
# contact frames follow the walk cycle (stride period 30 frames, feet land every 15): f = 5.5 mod 15
step_frames = [5.5 + 15 * k for k in range(0, 80) if E['b06_zoomB'] <= 5.5 + 15 * k < E['b06_sipUp']]
for i, fr in enumerate(step_frames):
    place('steps', f'b06_step_{i:02d}', foot, at(fr), -2.0 * (i % 2), f'frame {fr:.0f}: a footstep (walking in place)')
place('graphics', 'b06_thousand_slap', slap, at(E['b06_chipThousand']), 0.0, f'frame {E["b06_chipThousand"]}: ~1,000 MPH lands on "thousand"')
place('liquid', 'b06_cup_to_lips_tick', L.fx_ceramic_tick('v1_lips'), at(E['b06_sipUp'] - 2), -12.0, f'frame {E["b06_sipUp"] - 2}: the mug touches her lips')
place('liquid', 'b06_sip', L.fx_sip('v1_sip'), at(E['b06_sipUp'] + 2), -10.0, f'frame {E["b06_sipUp"] + 2}: a sip (audited pick: pitched gulp)')
place('liquid', 'b06_cup_down_tick', L.fx_ceramic_tick('v1_down'), at(E['b06_sipDown'] + 4), -14.0, f'frame {E["b06_sipDown"] + 4}: the mug comes down')
place('whoosh', 'b06_pullback_swoosh', sw('v1_pull', 0.55, up=False), at(E['b06_outA']), -2.0, f'frames {E["b06_outA"]}-{E["b06_outB"]}: she pulls back to the street')
# the loop: the globe whirr returns under the last frames and arrives at the level it has on the hook's frame 0
lp = E['b06_loopA']
lw = L.fx_spin_whirr('h1_spin', at(N - lp), rev_hz=5.5)
lw = lw * np.linspace(0, 1, len(lw)) ** 1.5
place('globe2', 'loop_globe_whirr', lw, at(lp), 0.0, f'frames {lp}-{N}: the globe spins up again as the street shrinks: the film loops into the hook')
place('graphics', 'loop_tag_slap', slap, at(1020), -4.0, 'frame 1020: the WHAT IF tag returns')

# ================================================================ mix
att, rel = 0.005, 0.120
ve = np.sqrt(np.convolve(voice ** 2, np.ones(int(0.025 * SR)) / int(0.025 * SR), mode='same'))
act = np.clip((ve / (np.max(ve) + 1e-9) - 0.05) / 0.15, 0, 1)
sm = np.zeros(NS); a_c, r_c = 1 - np.exp(-1 / (att * SR)), 1 - np.exp(-1 / (rel * SR)); cur = 0.0
for i in range(NS):
    cur += ((a_c if act[i] > cur else r_c)) * (act[i] - cur); sm[i] = cur
stems = {}
for g, x in G.items():
    if not np.any(np.abs(x) > 1e-9): continue
    pk = np.max(np.abs(x)) or 1.0
    y = x / pk * (voice_rms * 10 ** (REL[g] / 20)) * 3.0
    rms = np.sqrt(np.mean(y[np.abs(y) > 1e-4] ** 2)) if np.any(np.abs(y) > 1e-4) else 1.0
    y = y * (voice_rms * 10 ** (REL[g] / 20)) / rms if rms > 0 else y
    y = y * (1 - (1 - 10 ** (-DUCK_DB[g] / 20)) * sm)
    stems[g] = y
    write_wav(f'{OUT}/stems/foley_{g}.wav', y)
# the hook's rewind: the hook effects reversed at the picture's rewind speed (band-limited)
rwk = ch['rewind_speed']; t_rw0 = at(HE['rewind_start'])
seg = (sum(stems.values()))[:int(t_rw0 * SR)][::-1]
n_out = int(len(seg) / rwk); idx = np.arange(n_out) * rwk
rew = np.interp(idx, np.arange(len(seg)), seg); rew = L.fft_filter(rew, 250, 7000)
rew[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR)); rew[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
rew = rew / (np.sqrt(np.mean(rew ** 2)) + 1e-12) * (voice_rms * 10 ** (REL['rewind'] / 20))
rew = rew * (1 - (1 - 10 ** (-DUCK_DB['rewind'] / 20)) * sm[int(t_rw0 * SR):int(t_rw0 * SR) + len(rew)])
k0 = int(round(t_rw0 * SR)); m = max(0, min(len(rew), NS - k0)); rwv = np.zeros(NS); rwv[k0:k0 + m] = rew[:m]
stems['rewind'] = rwv; write_wav(f'{OUT}/stems/foley_rewind.wav', rwv)
LOG.append({'file': 'audio/v4/v1/stems/foley_rewind.wav', 'frame': round(t_rw0 * FPS, 2), 'time_s': round(t_rw0, 4), 'gain_db_in_group': 0.0, 'group': 'rewind', 'note': f'hook frames {HE["rewind_start"]}-{HE["rewind_end"]}: the effects reversed at {rwk:.2f}x'})
write_wav(f'{OUT}/stems/voice.wav', voice)
mix = voice + sum(stems.values())
mix[:int(0.0005 * SR)] *= np.linspace(0, 1, int(0.0005 * SR)); mix[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))


def ebur(x):
    write_wav('/tmp/_v1_probe.wav', np.stack([x, x], axis=1))
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', '/tmp/_v1_probe.wav', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    g = lambda k: float(re.findall(rf'^\s+{k}:\s+(-?[\d.]+)', out, re.M)[-1])
    return g('I'), g('Peak')


I0, P0 = ebur(mix)
gain_db = -15.0 - I0
mix2 = mix * 10 ** (gain_db / 20)
I1, P1 = ebur(mix2)
if P1 > -1.5:
    gain_db -= (P1 + 1.5); mix2 = mix * 10 ** (gain_db / 20); I1, P1 = ebur(mix2)
write_wav(f'{OUT}/stems/mix_v1.wav', np.stack([mix2, mix2], axis=1))
sc = 10 ** (gain_db / 20)
vo, so = voice * sc, sum(stems.values()) * sc
write_wav(f'{OUT}/stems/voice_only_v1.wav', np.stack([vo, vo], axis=1)); write_wav(f'{OUT}/stems/sfx_only_v1.wav', np.stack([so, so], axis=1))
with open(f'{OUT}/SFX_LOG.csv', 'w', newline='') as fh:
    wr = csv.DictWriter(fh, fieldnames=['file', 'frame', 'time_s', 'gain_db_in_group', 'group', 'note']); wr.writeheader()
    for row in sorted(LOG, key=lambda r: r['time_s']): wr.writerow(row)
json.dump({'voice_rms_dBFS_voiced': round(20 * np.log10(voice_rms), 1), 'group_rel_to_voice_dB': REL, 'duck_dB_under_speech': DUCK_DB, 'mix_before_scale': {'LUFS': I0, 'true_peak_dBFS': P0}, 'scale_applied_dB': round(gain_db, 2),
           'final': {'LUFS': I1, 'true_peak_dBFS': P1}, 'placed_events': len(LOG), 'note': 'levels are design targets, not listening results'}, open(f'{OUT}/MIX_LOG.json', 'w'), indent=1)
print(f'events {len(LOG)}; mix {len(mix2) / SR:.4f} s (film {DUR:.4f} s); before scale {I0:.1f} LUFS / {P0:.1f} dBTP; scale {gain_db:+.2f} dB -> {I1:.1f} LUFS / {P1:.1f} dBTP')
