#!/usr/bin/env python3
"""Mix for the V2 film (25.3 s): Test Voice narration V2 (take B, untouched) + a small set of storytelling sound events (procedural numpy Foley + a few ElevenLabs-generated one-shots) + an optional restrained tension swell.
Usage: python3 tools/build_audio_v2.py
Reads  audio/v5/cues_v2.json (tools/build_cues_v2.mjs), audio/v3/cues_h1.json (the hook's event table, shifted by D frames), audio/v5/voice/v2_takeB_48k.wav, audio/v5/sfx_gen/*.mp3, tools/foley_lib.py
Writes audio/v5/v2/sfx/*.wav, stems/{voice,foley_*,music}.wav, stems/mix_v2.wav (with the tension swell), mix_v2_nomusic.wav, voice_only_v2.wav, sfx_only_v2.wav, music_only_v2.wav, SFX_LOG.csv, MIX_LOG.json
Every event carries a stated JOB (what it tells the viewer). Levels are set per event relative to the voice's RMS (dB re voiced RMS, measured on the loudest 100 ms of the event); groups that share the speech band are ducked under speech;
each mix is scaled to -15.5 LUFS / -1.5 dBTP. The narration is not moved, trimmed, stretched or processed. Levels are design targets from measurement, NOT listening results."""
import csv, json, os, re, subprocess, sys, wave
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import foley_lib as L
from foley_lib import SR, write_wav, norm, tgrid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f'{ROOT}/audio/v5/v2'
os.makedirs(f'{OUT}/sfx', exist_ok=True); os.makedirs(f'{OUT}/stems', exist_ok=True)
cv = json.load(open(f'{ROOT}/audio/v5/cues_v2.json'))
ch = json.load(open(f'{ROOT}/audio/v3/cues_h1.json'))
FPS = cv['fps']; N = cv['total_frames']; DUR = N / FPS; NS = int(round(DUR * SR))
EV = cv['events']; D = cv['d_hook']
at = lambda f: f / FPS
HE = {k: v['frame'] - D for k, v in ch['events'].items()}  # H1 hook events in V2 film frames
HFR = ch['frames']; HFT = [f['t'] - D / FPS for f in HFR]
LOG = []
GROUPS = ['impacts', 'friction', 'liquid', 'air_cloth', 'air2', 'bike', 'ui', 'steps', 'objects', 'wind', 'water', 'whirr', 'whoosh', 'rush', 'globe', 'sip']
G = {k: np.zeros(NS) for k in GROUPS}
# dB below the voice's voiced RMS for the LOUDEST 100 ms of each event is set per event (rel); these are the ducking depths under speech
# ducking under speech is split at 280 Hz: the low band (the tactile weight) is ducked lightly (DUCK_LF), the speech band (> 280 Hz) deeply (DUCK_DB)
DUCK_LF = 2.0
DUCK_DB = {'impacts': 7.0, 'friction': 9.0, 'liquid': 9.0, 'air_cloth': 10.0, 'air2': 14.0, 'bike': 10.0, 'ui': 8.0, 'steps': 9.0, 'objects': 14.0, 'wind': 16.0, 'water': 18.0, 'whirr': 10.0, 'whoosh': 10.0, 'rush': 8.0, 'globe': 6.0, 'sip': 3.0}
GEN_PICK = {'sea_wall': 'A', 'sea_surge': 'B', 'bike_roll': 'B', 'chair_tip': 'B', 'box_tumble': 'B', 'wind_palms': 'A', 'ground_stop': 'B', 'sip': 'A'}


def vcurve(name, t0, n):
    c = cv['curves'][name]
    return np.interp((np.arange(n) / SR + t0) * FPS, np.arange(len(c)), c)


def hcurve(key, t0, n):  # the hook's own per-frame curves (time axis shifted into film time)
    return np.interp(np.arange(n) / SR + t0, HFT, [f[key] for f in HFR])


def fade(x, a=0.0, b=0.0):
    x = x.copy()
    if a: n = min(len(x), int(a * SR)); x[:n] *= np.linspace(0, 1, n)
    if b: n = min(len(x), int(b * SR)); x[-n:] *= np.linspace(1, 0, n)
    return x


with wave.open(f'{ROOT}/audio/v5/voice/v2_takeB_48k.wav') as w:
    v = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
voice = np.zeros(NS); voice[:min(NS, len(v))] = v[:NS]
w20 = int(0.02 * SR)
venv = np.sqrt(np.convolve(voice ** 2, np.ones(w20) / w20, mode='same'))
voiced = venv > 0.02 * np.max(venv)
voice_rms = float(np.sqrt(np.mean(voice[voiced] ** 2)))


def loud100(x):
    n = int(0.1 * SR)
    if len(x) <= n: return float(np.sqrt(np.mean(x ** 2)) + 1e-12)
    c = np.cumsum(np.concatenate([[0.0], x ** 2])); return float(np.sqrt(np.max((c[n:] - c[:-n]) / n)) + 1e-12)


def place(group, name, x, frame, rel_db, job, source='procedural', end_fade=0.0):
    """x: waveform; frame: film frame at which x starts (may be negative: the head of x is cropped); rel_db: loudest 100 ms of x at this many dB re the voice RMS (negative = quieter)"""
    t0 = frame / FPS
    k = int(round(t0 * SR))
    x = fade(x, 0.0, end_fade) if end_fade else x
    y = x * (voice_rms * 10 ** (rel_db / 20) / loud100(x))
    a = max(0, -k); k = max(0, k)
    m = max(0, min(len(y) - a, NS - k))
    if m > 0: G[group][k:k + m] += y[a:a + m]
    write_wav(f'{OUT}/sfx/{name}.wav', x / (np.max(np.abs(x)) + 1e-9) * 0.7)
    LOG.append({'file': f'audio/v5/v2/sfx/{name}.wav', 'frame': round(frame, 2), 'time_s': round(t0, 3), 'rel_db_to_voice': rel_db, 'group': group, 'source': source, 'job': job})


def gen(name, hp=None, lp=None, a=0.0, b=None):
    x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{ROOT}/audio/v5/sfx_gen/{name}_{GEN_PICK[name]}.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, dtype='<f4').astype(np.float64)
    if hp or lp: x = L.fft_filter(x, hp, lp)
    x = x[int(a * SR):int(b * SR) if b else None]
    return x / (np.max(np.abs(x)) + 1e-9) * 0.7


slap = L.fx_tag_slap('v2_plate')
GEN = 'elevenlabs-generated'

# ================================================================ B01 hook: the event is already underway at frame 0
globe_stop = EV['globe_stop']
spin = L.fx_spin_whirr('h1_spin', at(globe_stop), rev_hz=5.5); spin[-int(0.001 * SR):] *= np.linspace(1, 0, int(0.001 * SR))
place('globe', 'hook_globe_spin', spin, 0, -9.0, 'the planet is still turning when the film opens and is cut dead on its stop frame (the cause)')
place('impacts', 'hook_surface_stop_body', L.fx_thud('v2_stop', 190, 60, 0.12, 0.9, 0.5), globe_stop, -6.0, 'surface stop, mid body (200-400 Hz carries on a phone speaker): the ground slams to a halt')
place('impacts', 'hook_surface_stop_sub', gen('ground_stop', lp=140), 0, -12.0, 'surface stop, sub layer under the body', GEN)
LAUNCH, LAND, BOUNCE = HE['launch'], HE['land'], HE['bounce']
t_planted = max(0, globe_stop)
skid1 = L.fx_scrape('h1_scrape_planted', at(LAUNCH - t_planted), f0=205, f1=170, att=0.002, rel=0.022)
place('friction', 'hook_shoe_skid', skid1, t_planted, -15.0, 'shoe contact: her shoes grab the pavement and skid as the ground stops under her')
place('impacts', 'hook_shoe_release', L.fx_launch('h1_launch'), LAUNCH, -17.0, 'shoe release: her feet leave the pavement')
slide_dur = at(BOUNCE + 22 - LAND)
sl = L.fx_scrape('h1_scrape_slide', slide_dur, f0=175, f1=70, lo=900, hi=6200, att=0.004, rel=0.05)
tt = tgrid(slide_dur); vs = hcurve('v_hero', at(LAND), len(tt))
sl = sl * (0.25 + 0.75 * (vs / max(vs)) ** 1.6) * np.minimum(1, 0.55 + 4 * tt); sl *= np.clip(vs / 4.0, 0, 1)
place('friction', 'hook_body_slide', sl, LAND, -17.0, 'contact: she is dragged to rest on the pavement')
place('impacts', 'hook_landing', L.fx_thud('h1_land', 150, 62, 0.11, 0.9), LAND, -8.0, 'weighted landing after the lunge')
place('impacts', 'hook_landing_bounce', L.fx_thud('h1_bounce', 130, 60, 0.07, 0.6, 0.3), BOUNCE, -14.0, 'small second contact (the landing has weight)')
jd = at(HE['jet_last'] - HE['jet_first'] + 4)
place('liquid', 'hook_coffee_stream', L.fx_coffee_jet('h1_jet', jd), HE['jet_first'], -12.0, 'coffee thrown from the mug as a tapering stream (the loose thing keeps going)')
big = [l for l in ch['coffee']['landings'] if l['t'] - D / FPS > 0 and 0 < l['screen_x'] < 1080 and l['r'] > 9]
for i, l in enumerate(big):
    place('liquid', f'hook_coffee_splat_{i:02d}', L.fx_splat(f'h1_splat{i}', 1050 + 90 * (i % 5)), (l['t'] - D / FPS) * FPS, -12.0 - (i % 3), 'coffee droplets land on the pavement', end_fade=0.02)
r0, r1 = max(0, HE['scene0'] + 1), HE['brake_end'] + 3
rush = L.fx_rush('h1_rush', at(r1 - r0)); tr = tgrid(at(r1 - r0)); cr = hcurve('cam_rel', at(r0), len(tr))
rush = norm(rush * (cr / max(cr)) ** 1.2, 0.7); rush[-int(0.12 * SR):] *= np.linspace(1, 0, int(0.12 * SR))
place('air_cloth', 'hook_air_rush', rush, r0, -24.0, 'air past her while the camera rides with her, falling away at the brake')
place('air_cloth', 'hook_scarf_flutter', L.fx_flap('h1_flap', at(LAND - HE['flap_in']) + 0.2), HE['flap_in'], -24.0, 'scarf and cardigan flutter in the lunge')
b0, b1 = HE['bike_enter'], HE['bike_exit']
bd = at(b1 - b0); fw = L.fx_freewheel('h1_freewheel', bd, 21.0, 16.0); tb = tgrid(bd)
vis = np.interp(tb + at(b0), HFT, [f['bike_vis'] for f in HFR]); sx = np.interp(tb + at(b0), HFT, [f['bike_x'] for f in HFR])
lvl = np.clip(vis, 0, 1) ** 0.8 * (0.55 + 0.45 * (1 - np.clip(np.abs(sx - 540) / 700, 0, 1)))
fw = fw * lvl; fw[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
place('bike', 'hook_bike_freewheel', fw, b0, -16.0, 'bicycle mechanics: the riderless bicycle keeps rolling past the stopped street')
place('ui', 'hook_plate_land', slap, EV['hook_plate'], -18.0, 'the one information card that lands: the stable speed plate')
# one rewind: the hook effects, reversed (done after the mix below)
# calm footsteps after the rewind: she walks on (contrast with the lunge); contact frames f = 2.5 + 15 k
foot = L.fx_footstep('v2_step', 0.6, 1.4)
for i, fr in enumerate([2.5 + 15 * k for k in range(0, 40) if 80 <= 2.5 + 15 * k <= 197]):
    place('steps', f'hook_step_{i:02d}', foot, fr, -25.0 - 2.0 * (i % 2), 'a calm footstep: she is walking normally on the moving Earth')

# ================================================================ B02
bird = L.fx_flap('v2_pigeon_in', 1.0, 8.0, 9.5) * np.minimum(1, tgrid(1.0) / 0.08) * np.linspace(1, 0.5, int(1.0 * SR))
place('air2', 'b02_pigeon_flies_in', bird, EV['b02_pigeon_in'], -17.0, 'air: a pigeon flaps in and hovers in the still air beside her')
hov = L.fx_flap('v2_pigeon_hover', 3.4, 5.5, 6.5) * (0.35 + 0.65 * np.abs(np.sin(2 * np.pi * 1.4 * tgrid(3.4))))
place('air2', 'b02_pigeon_hover', hov, EV['b02_pigeon_in'] + 22, -25.0, 'air: the pigeon hovers (the air is carried along with her)', end_fade=0.3)

# ================================================================ B03: the ground stops
STOP = EV['stop']
place('impacts', 'b03_surface_stop_body', L.fx_thud('v2_stop2', 190, 60, 0.12, 0.9, 0.5), STOP, -6.0, 'surface stop, mid body: the ground stops (same sound as the hook, so the viewer recognises the cause)')
place('impacts', 'b03_surface_stop_sub', gen('ground_stop', lp=140), STOP - 3, -12.0, 'surface stop, sub layer', GEN)
chair = gen('chair_tip', hp=120)
place('objects', 'b03_chair_scrape', chair[:int(1.35 * SR)], STOP + 3, -17.0, 'loose-object impact: the chair is dragged across stone by the stopped ground', GEN, end_fade=0.05)
place('objects', 'b03_chair_tip', chair[int(1.30 * SR):], EV['chair_tip'][0] + 4, -14.0, 'loose-object impact: the chair tips over and clatters', GEN)
place('objects', 'b03_box_tumble', gen('box_tumble', hp=100), STOP + 2, -17.0, 'loose-object impact: the box scuffs and tumbles end over end', GEN)
bk0, bk1 = EV['bike_on_screen']
bkd = at(bk1 - bk0); tbk = tgrid(bkd)
fwb = L.fx_freewheel('v2_b03_freewheel', bkd, 24.0, 14.0) * np.sin(np.pi * np.clip(tbk / bkd, 0, 1)) ** 0.7
place('bike', 'b03_bike_freewheel', fwb, bk0, -21.0, 'bicycle mechanics: the loose bicycle freewheels across the plaza (swell as it crosses)', end_fade=0.05)
bike_pass = gen('bike_roll', hp=200)
place('bike', 'b03_bike_pass', bike_pass, EV['bike_centre'] - 1.15 * FPS, -19.0, 'bicycle pass-by: the loose bicycle crosses the middle of the frame', GEN)

# ================================================================ B04: the air, then the ocean
AIR, SEA, WALL = EV['air'], EV['sea'], EV['sea_wall']
w1, w2 = EV['wipe1']
amb = L.fx_surge('v2_sea_amb', at(AIR + 6 - w2) + 0.5, 0.6, 0.35, 0)
place('water', 'b04_calm_sea', fade(amb, 0.3, 0.5), w2 - 8, -25.0, 'the sea laps calmly before anything happens (the calm before the air and the ocean)')
g1 = L.fx_gust('v2_gust1', 2.6, 90, 1100, 0.0, 0.14, 0.9) * vcurve('wind', at(AIR) - 0.1, int(2.6 * SR)) ** 0.5
place('wind', 'b04_gust_1', g1, AIR - 3, -18.0, 'air/foliage: the air keeps going (wind builds with the wind curve of the picture)')
place('wind', 'b04_wind_palms', gen('wind_palms', hp=140), AIR + 6, -20.0, 'air/foliage: wind through the palms (generated; high-passed at 140 Hz, no sub rumble)', GEN)
g2 = L.fx_gust('v2_gust2', 2.4, 90, 1100, 0.0, 0.14, 0.7) * vcurve('wind', at(AIR + 40), int(2.4 * SR)) ** 0.5
place('wind', 'b04_gust_2', g2, AIR + 40, -18.0, 'air: the wind keeps blowing under the ocean line')
place('air2', 'b04_palm_fronds', L.fx_fronds('v2_fronds', 2.4) * vcurve('wind', at(AIR), int(2.4 * SR)), AIR, -21.0, 'air/foliage: palm fronds thrash')
place('air2', 'b04_flag', L.fx_flap('v2_flag', 3.0, 14.0, 18.0) * vcurve('wind', at(AIR + 2), int(3.0 * SR)), AIR + 2, -25.0, 'air: the flag snaps out')
for i, j in enumerate([q for q in cv['junk'] if q['kind'] in ('paper', 'cap')][:3]):
    place('air2', f'b04_litter_{i}', L.fx_paper_swish(f'v2_sw{i}', 0.3), j['f0'], -19.0, 'air: loose litter is swept off by the wind')
bird2 = L.fx_flap('v2_pigeon_blown', 1.2, 8.0, 9.5) * np.minimum(1, tgrid(1.2) / 0.1) * np.linspace(1, 0.4, int(1.2 * SR))
place('air2', 'b04_pigeon_blown', bird2, AIR + 2, -19.0, 'air: a pigeon is swept past')
place('water', 'b04_swell', L.fx_surge('v2_swell', 1.8, 1.0, 0.25, 0), SEA - 18, -18.0, 'sea mass: the sea heaves up the pier posts before the front arrives')
place('water', 'b04_front_gen', gen('sea_surge', hp=60), SEA, -16.0, 'sea mass: the front of the surge enters from the left', GEN)
place('water', 'b04_front_rush', L.fx_surge('v2_surge', 1.7, 1.0, 0.7, 6), SEA, -16.0, 'sea mass: the surge keeps moving east across the frame (sustained layer under the generated onset)')
place('water', 'b04_wall_gen', gen('sea_wall', hp=40), WALL, -8.0, 'sea contact: the surge hits the seawall (generated onset: thump + broadband crash)', GEN)
place('water', 'b04_wall_body', L.fx_wave_slap('v2_wall', 0.9, 1.3, 0.7), WALL, -12.0, 'sea contact: body of the impact (procedural, 120-1500 Hz)')
place('water', 'b04_flood', L.fx_surge('v2_over', 1.1, 0.3, 1.0, 10), WALL + 2, -15.0, 'sea mass: water pours over the promenade')
f_a, f_b, f_c = EV['foam']
place('water', 'b04_spray_burst', L.fx_surge('v2_spray', 0.9, 0.1, 1.5, 12), f_a - 4, -13.0, 'sea contact: the front bursts into spray, which carries the cut into the next scene')

# ================================================================ B05: the latitude move (the pitch of the two markers falls with their speed)
lA, lM0, lM1 = EV['lat']
wh1 = L.fx_spin_whirr('v2_lat_eq', at(lM0 + 24 - lA), rev_hz=7.0)
place('whirr', 'b05_marker_equator', fade(wh1, 0.15, 0.4), lA + 4, -27.0, 'speed: the equator marker whirrs fast (fast ground)')
wh2 = L.fx_spin_whirr('v2_lat_pole', at(EV['pay'] - lM0 - 10), rev_hz=2.0)
place('whirr', 'b05_marker_pole', fade(wh2, 0.35, 0.3), lM0 + 10, -28.0, 'speed: near the pole the same whirr is slower (lower ground speed)')
s0, s1 = EV['streak']
place('whoosh', 'b05_streak_wipe', L.fx_swoosh('v2_streak', at(s1 - s0) + 0.15, (300, 1400), (1800, 6500), up=True), s0, -18.0, 'speed lines sweep the frame into the payoff (the only transition whoosh)')

# ================================================================ B06: the payoff
pay = EV['pay']
rsh = L.fx_gust('v2_rush', at(N - pay - 4), 200, 3600, 0.0, 0.4, 0.5)
place('rush', 'b06_world_rush', fade(rsh, 0.5, 0.2), pay + 4, -24.0, 'speed: the world streaks past her, steadily (the motion is real); the level is constant, she is calm')
sa, su, sd, se = EV['sip']
for i, fr in enumerate([5.5 + 15 * k for k in range(0, 80) if pay + 4 <= 5.5 + 15 * k < sa - 2 or 5.5 + 15 * k > se]):
    place('steps', f'b06_step_{i:02d}', foot, fr, -26.0 - 2.0 * (i % 2), 'a calm footstep: she walks on at the equator')
place('liquid', 'b06_lips_tick', L.fx_ceramic_tick('v2_lips'), su - 4, -22.0, 'ceramic tick: the mug touches her lips')
place('sip', 'b06_sip', gen('sip'), su + 6 - 0.55 * FPS, -9.0, 'the sip: she drinks, nothing spills (generated; its gulp centre lands on "real")', GEN)
place('liquid', 'b06_cup_down', L.fx_ceramic_tick('v2_down'), sd + 4, -22.0, 'ceramic tick: the mug comes down')


# ================================================================ tension swell (optional): original synthesis, restrained, cut at the spray; no melody
def tension(dur):
    t = tgrid(dur); n = len(t); r = L.rng_for('v2_tension')
    u = np.clip(t / dur, 0, 1)
    env = u ** 1.8
    drone = (np.sin(2 * np.pi * 55.0 * t + 0.3 * np.sin(2 * np.pi * 0.21 * t)) + 0.55 * np.sin(2 * np.pi * 82.4 * t) + 0.35 * np.sin(2 * np.pi * 110.3 * t) + 0.18 * np.sin(2 * np.pi * 165 * t)) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * t + 1.0))
    nz = L.fft_filter(r.standard_normal(n), 250, 1400)
    sweep = nz * (0.3 + 0.7 * u) * (0.5 + 0.5 * np.sin(2 * np.pi * (0.8 + 2.0 * u) * t))
    x = (0.8 * drone + 0.5 * sweep) * env
    x = L.fft_filter(x, 40, 1600)
    return x
t0m, t1m = 405, f_a - 2
place('whoosh', 'music_tension_swell', tension(at(t1m - t0m)), t0m, -27.0, 'optional tension: a restrained, melody-free swell under the end of S4, the air and the ocean; cut at the spray (separate stem)', 'procedural (original synthesis)', end_fade=0.04)
MUSIC_IDX = len(LOG) - 1
mus_x = G['whoosh'].copy()  # the tension swell is the only whoosh-group event before the streak wipe; separate it below
# the streak wipe whoosh is placed later in time: split the group at the streak frame
k_s = int(round(at(s0 - 2) * SR))
MUSIC = np.zeros(NS); MUSIC[:k_s] = G['whoosh'][:k_s]
G['whoosh'][:k_s] = 0.0

# ================================================================ mix
att, rel = 0.005, 0.120
ve = np.sqrt(np.convolve(voice ** 2, np.ones(int(0.025 * SR)) / int(0.025 * SR), mode='same'))
act = np.clip((ve / (np.max(ve) + 1e-9) - 0.01) / 0.03, 0, 1)  # sensitive: weak function words ("And so does the") duck the effects fully
sm = np.zeros(NS); a_c, r_c = 1 - np.exp(-1 / (att * SR)), 1 - np.exp(-1 / (rel * SR)); cur = 0.0
for i in range(NS):
    cur += ((a_c if act[i] > cur else r_c)) * (act[i] - cur); sm[i] = cur
stems = {}
for g, x in G.items():
    if not np.any(np.abs(x) > 1e-9): continue
    lf = L.fft_filter(x, None, 280); hf = x - lf
    stems[g] = lf * (1 - (1 - 10 ** (-DUCK_LF / 20)) * sm) + hf * (1 - (1 - 10 ** (-DUCK_DB[g] / 20)) * sm)
    write_wav(f'{OUT}/stems/foley_{g}.wav', stems[g])
_ml = L.fft_filter(MUSIC, None, 280); MUS = _ml * (1 - (1 - 10 ** (-3.0 / 20)) * sm) + (MUSIC - _ml) * (1 - (1 - 10 ** (-16.0 / 20)) * sm)  # the swell yields 3 dB (low band) / 16 dB (speech band) under speech
write_wav(f'{OUT}/stems/music.wav', MUS)
# the hook's rewind: the hook effects reversed at the picture's rewind speed (band-limited), under the BEFORE badge
rwk = ch['rewind_speed']; t_rw0 = at(HE['rewind_start'])
seg = (sum(stems.values()))[:int(t_rw0 * SR)][::-1]
n_out = int(len(seg) / rwk); idx = np.arange(n_out) * rwk
rew = np.interp(idx, np.arange(len(seg)), seg); rew = L.fft_filter(rew, 250, 7000)
rew[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR)); rew[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
rew = rew / (np.sqrt(np.mean(rew ** 2)) + 1e-12) * (voice_rms * 10 ** (-12.0 / 20))
rew = rew * (1 - (1 - 10 ** (-3.0 / 20)) * sm[int(t_rw0 * SR):int(t_rw0 * SR) + len(rew)])
k0 = int(round(t_rw0 * SR)); m = max(0, min(len(rew), NS - k0)); rwv = np.zeros(NS); rwv[k0:k0 + m] = rew[:m]
stems['rewind'] = rwv; write_wav(f'{OUT}/stems/foley_rewind.wav', rwv)
LOG.append({'file': 'audio/v5/v2/stems/foley_rewind.wav', 'frame': round(t_rw0 * FPS, 2), 'time_s': round(t_rw0, 3), 'rel_db_to_voice': -12.0, 'group': 'rewind', 'source': 'procedural (the hook effects reversed)', 'job': f'one clear BEFORE transition: the hook effects reversed at {rwk:.2f}x'})
write_wav(f'{OUT}/stems/voice.wav', voice)
sfx_sum = sum(stems.values())
lim = lambda x, c: c * np.tanh(x / c)  # soft limiter on the effects sum: the stop thump and the wall crash would otherwise set the true-peak ceiling and hold the whole mix down
sfx_sum = lim(sfx_sum, 0.30)
mix_music = voice + sfx_sum + MUS
mix_nomusic = voice + sfx_sum
for a in (mix_music, mix_nomusic):
    a[:int(0.0005 * SR)] *= np.linspace(0, 1, int(0.0005 * SR)); a[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))


def ebur(x):
    write_wav('/tmp/_v2_probe.wav', np.stack([x, x], axis=1))
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', '/tmp/_v2_probe.wav', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    g = lambda k: float(re.findall(rf'^\s+{k}:\s+(-?[\d.]+)', out, re.M)[-1])
    return g('I'), g('Peak')


res = {}
for tag, mx in (('mix_v2', mix_music), ('mix_v2_nomusic', mix_nomusic)):
    I0, P0 = ebur(mx); g_db = -15.5 - I0; m2 = mx * 10 ** (g_db / 20); I1, P1 = ebur(m2)
    if P1 > -1.5: g_db -= (P1 + 1.5); m2 = mx * 10 ** (g_db / 20); I1, P1 = ebur(m2)
    write_wav(f'{OUT}/stems/{tag}.wav', np.stack([m2, m2], axis=1)); res[tag] = {'before': [I0, P0], 'scale_db': round(g_db, 2), 'final': [I1, P1]}
sc = 10 ** (res['mix_v2']['scale_db'] / 20)
vo, so, mo = voice * sc, sfx_sum * sc, MUS * sc
write_wav(f'{OUT}/stems/voice_only_v2.wav', np.stack([vo, vo], axis=1)); write_wav(f'{OUT}/stems/sfx_only_v2.wav', np.stack([so, so], axis=1)); write_wav(f'{OUT}/stems/music_only_v2.wav', np.stack([mo, mo], axis=1))
with open(f'{OUT}/SFX_LOG.csv', 'w', newline='') as fh:
    wr = csv.DictWriter(fh, fieldnames=['file', 'frame', 'time_s', 'rel_db_to_voice', 'group', 'source', 'job']); wr.writeheader()
    for row in sorted(LOG, key=lambda r: r['time_s']): wr.writerow(row)
json.dump({'voice_rms_dBFS_voiced': round(20 * np.log10(voice_rms), 1), 'duck_dB_under_speech': DUCK_DB, 'tension_swell_duck_dB': {'low_band': 3.0, 'speech_band': 16.0}, 'duck_lf_dB': DUCK_LF, 'generated_picks': GEN_PICK, 'mixes': res, 'placed_events': len(LOG),
           'note': 'levels are design targets from measurement, not listening results; the tension swell is original synthesis and is a separate stem; mix_v2_nomusic is the same mix without it'}, open(f'{OUT}/MIX_LOG.json', 'w'), indent=1)
print(f"events {len(LOG)}; mix {len(mix_music) / SR:.3f} s (film {DUR:.3f} s); with swell {res['mix_v2']['final'][0]:.1f} LUFS / {res['mix_v2']['final'][1]:.1f} dBTP; no swell {res['mix_v2_nomusic']['final'][0]:.1f} LUFS / {res['mix_v2_nomusic']['final'][1]:.1f} dBTP")
