#!/usr/bin/env python3
"""Mix for the H1 hook: Test Voice narration (audition take, untouched) + procedural Foley chosen by tools/sfx_audition_h1.py. numpy only, deterministic.
Usage: python3 tools/build_audio_h1.py
Reads  audio/v3/cues_h1.json (tools/build_cues_h1.mjs), audio/v3/voice/narration_opening_48k.wav
Writes audio/v3/h1/sfx/*.wav, audio/v3/h1/stems/{voice,foley_*}.wav, audio/v3/h1/stems/mix_h1.wav (stereo, identical channels), audio/v3/h1/SFX_LOG.csv, audio/v3/h1/MIX_LOG.json
Levels are set RELATIVE to the voice (dB re the voice RMS over voiced frames), SFX groups are ducked under speech, then the whole mix is scaled toward -15 LUFS integrated with a true-peak ceiling of -1.5 dBTP.
No narration timing is changed; nothing is stretched or trimmed."""
import csv, json, os, re, subprocess, sys, wave
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import foley_lib as L
from foley_lib import SR, write_wav, norm, tgrid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f'{ROOT}/audio/v3/h1'
cues = json.load(open(f'{ROOT}/audio/v3/cues_h1.json'))
FPS = cues['fps']; N = cues['total_frames']; DUR = N / FPS; NS = int(round(DUR * SR))
EV = {k: v['frame'] for k, v in cues['events'].items()}
FR = cues['frames']; FT = [f['t'] for f in FR]
at = lambda f: f / FPS
LOG = []
GROUPS = ['globe', 'friction', 'impacts', 'liquid', 'air_cloth', 'bike', 'graphics', 'bed']  # 'bed' = the globe's return as the turning Earth after the rewind; the rewind itself is added after the stems exist
G = {k: np.zeros(NS) for k in GROUPS}
# level of each group in dB relative to the voice RMS (voiced frames)
REL = {'globe': -3.0, 'friction': -11.0, 'impacts': -8.0, 'liquid': -15.0, 'air_cloth': -17.0, 'bike': -15.0, 'graphics': -15.0, 'bed': -18.0, 'rewind': -10.0}


def curve(key, t0, n):
    return np.interp(np.arange(n) / SR + t0, FT, [f[key] for f in FR])


def place(group, name, x, t0, gain_db, note):
    k = int(round(t0 * SR)); g = 10 ** (gain_db / 20)
    m = max(0, min(len(x), NS - k))
    if m > 0: G[group][k:k + m] += g * x[:m]
    write_wav(f'{OUT}/sfx/{name}.wav', x)
    LOG.append({'file': f'audio/v3/h1/sfx/{name}.wav', 'frame': round(t0 * FPS, 2), 'time_s': round(t0, 4), 'gain_db_in_group': gain_db, 'group': group, 'note': note})


# ---------------------------------------------------------------- voice
with wave.open(f'{ROOT}/audio/v3/voice/narration_opening_48k.wav') as w:
    v = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
voice = np.zeros(NS); voice[:min(NS, len(v))] = v[:NS]
w20 = int(0.02 * SR)
venv = np.sqrt(np.convolve(voice ** 2, np.ones(w20) / w20, mode='same'))
voiced = venv > 0.02 * np.max(venv)
voice_rms = float(np.sqrt(np.mean(voice[voiced] ** 2)))

# ---------------------------------------------------------------- the globe: the spin bed under the first word, then a hard cut and a 100 ms void
stop_t = at(EV['globe_stop'])
spin = L.fx_spin_whirr('h1_spin', stop_t, rev_hz=5.5)
spin[-int(0.001 * SR):] *= np.linspace(1, 0, int(0.001 * SR))  # cut, not fade
place('globe', 'globe_spin_bed', spin, 0.0, 0.0, f'frames 0-{EV["globe_stop"]}: the planet turning fast (picked: rumble + air chopped); cut dead at the stop frame')
void = 0.100  # nothing but the voice for 100 ms after the cut
t_hero = stop_t + void  # first physical sound after the stop
# ---------------------------------------------------------------- friction
LAUNCH, LAND = EV['launch'], EV['land']
skid1 = L.fx_scrape('h1_scrape_planted', at(LAUNCH) - t_hero, f0=205, f1=170, att=0.002, rel=0.022)
place('friction', 'shoe_scrape_planted', skid1, t_hero, 0.0, f'frame {t_hero * FPS:.0f}: shoes grab and skid after the 100 ms void; stops when they leave the ground at frame {LAUNCH}')
slide_dur = at(EV['bounce'] + 22) - at(LAND)
sl = L.fx_scrape('h1_scrape_slide', slide_dur, f0=175, f1=70, lo=900, hi=6200, att=0.004, rel=0.05)
tt = tgrid(slide_dur); vs = curve('v_hero', at(LAND), len(tt))
sl = sl * (0.25 + 0.75 * (vs / max(vs)) ** 1.6) * np.minimum(1, 0.55 + 4 * tt)
sl *= np.clip((0.0 + vs / 4.0), 0, 1)  # she is dragged to rest: the scrape dies with her speed
place('friction', 'shoe_scrape_slide', sl, at(LAND), -4.0, f'frames {LAND}-{LAND + 30}: dragged to rest after the landing; level follows her speed')
# ---------------------------------------------------------------- impacts
place('impacts', 'landing_thump', L.fx_thud('h1_land', 150, 62, 0.11, 0.9), at(LAND), -2.0, f'frame {LAND}: body lands')
place('impacts', 'landing_bounce_thump', L.fx_thud('h1_bounce', 130, 60, 0.07, 0.6, 0.3), at(EV['bounce']), -9.0, f'frame {EV["bounce"]}: small second contact')
place('impacts', 'launch_scuff_snap', L.fx_launch('h1_launch'), at(LAUNCH), -8.0, f'frame {LAUNCH}: shoes leave the pavement')
# ---------------------------------------------------------------- liquid
place('liquid', 'ceramic_rim_tick', L.fx_ceramic_tick('h1_tick'), at(EV['cup_tick']), 0.0, f'frame {EV["cup_tick"]}: ceramic rim tick as the coffee lurches out')
jd = at(EV['jet_last'] - EV['jet_first'] + 4)
place('liquid', 'coffee_stream', L.fx_coffee_jet('h1_jet', jd), at(EV['jet_first']), -2.0, f'frames {EV["jet_first"]}-{EV["jet_first"] + jd * FPS:.0f}: coffee thrown out as a tapering stream')
big = [l for l in cues['coffee']['landings'] if 0 < l['screen_x'] < 1080 and l['r'] > 9]
small = [l for l in cues['coffee']['landings'] if 0 < l['screen_x'] < 1080 and l['r'] <= 9]
for i, l in enumerate(big):
    place('liquid', f'coffee_splat_big_{i:02d}', L.fx_splat(f'h1_splat{i}', 1050 + 90 * (i % 5)), l['t'], -8.0 - (i % 3) - (2 if l['r'] < 10 else 0), f"drop k={l['k']} r={l['r']} lands")
for i, l in enumerate(small[::2]):
    place('liquid', f'coffee_patter_{i:02d}', L.fx_splat(f'h1_patter{i}', 1500 + 70 * (i % 4)), l['t'], -16.0, f"patter, drop k={l['k']}")
# ---------------------------------------------------------------- air + cloth (the street scroll: rush follows how fast the street streams past, so it falls away at the brake)
r0, r1 = EV['scene0'] + 1, EV['brake_end'] + 3
rush = L.fx_rush('h1_rush', at(r1 - r0)); tr = tgrid(at(r1 - r0)); cr = curve('cam_rel', at(r0), len(tr))
rush = norm(rush * (cr / max(cr)) ** 1.2, 0.7); rush[-int(0.12 * SR):] *= np.linspace(1, 0, int(0.12 * SR))
place('air_cloth', 'air_rush', rush, at(r0), 0.0, f'frames {r0}-{r1}: air past her; level follows the street scroll speed and falls away at the brake')
place('air_cloth', 'jacket_scarf_flutter', L.fx_flap('h1_flap', at(LAND - EV['flap_in']) + 0.2), at(EV['flap_in']), -3.0, f'frames {EV["flap_in"]}-{LAND + 6}: cardigan and scarf flutter')
# ---------------------------------------------------------------- the riderless bicycle: its level follows how much of it is on screen
b0, b1 = EV['bike_enter'], EV['bike_exit']
bd = at(b1 - b0); fw = L.fx_freewheel('h1_freewheel', bd, 21.0, 16.0); tb = tgrid(bd)
vis = np.interp(tb + at(b0), FT, [f['bike_vis'] for f in FR]); sx = np.interp(tb + at(b0), FT, [f['bike_x'] for f in FR])
lvl = np.clip(vis, 0, 1) ** 0.8 * (0.55 + 0.45 * (1 - np.clip(np.abs(sx - 540) / 700, 0, 1)))
fw = fw * lvl; fw[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))  # it is cut by the rewind
place('bike', 'bike_freewheel', fw, at(b0), 0.0, f'frames {b0}-{b1}: riderless bicycle freewheeling; level follows how much of it is on screen and how near the middle')
# ---------------------------------------------------------------- graphics: cards stuck on, a mechanical counter, a card sliding away
slap = L.fx_tag_slap('h1_tag')
for k, (fr, g, n) in enumerate([(EV['chip_bike'], 0.0, 'speed tag on the bicycle'), (EV['chip_lamp'], -2.0, '0 MPH tag on the lamp post'), (EV['east'], 3.0, 'EAST plate'), (EV['num_a'], 3.0, 'speed plate'), (EV['num_a'] + 2, -5.0, 'EQUATOR tag'), (EV['mph'], -5.0, 'MPH')]):
    place('graphics', f'tag_slap_{k}', slap, at(fr), g, f'frame {fr}: {n} lands (cardboard slap)')
ra, times = L.ratchet_train('h1_counter', 18, at(EV['num_b'] - EV['num_a']), ease=3.0)
place('graphics', 'counter_ratchet', ra, at(EV['num_a']), 0.0, f'frames {EV["num_a"]}-{EV["num_b"]}: odometer-style ticks while the number rolls up to 1,000')
place('graphics', 'counter_clunk', L.fx_clunk('h1_clunk'), at(EV['num_b']), -2.0, f'frame {EV["num_b"]}: the counter reaches its stop')
# the Earth turns again as the street is shown as it was (continuous bed under the explanation, ducked under speech); it stops with the picture
rw1 = EV['rewind_end']
bed_dur = at(N - 4 - rw1)
bed = L.fx_spin_whirr('h1_was_bed', bed_dur, rev_hz=5.5)
bed[:int(0.15 * SR)] *= np.linspace(0, 1, int(0.15 * SR)); bed[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
place('bed', 'earth_turning_bed', bed, at(rw1), 0.0, f'frames {rw1}-{N - 4}: the Earth turning again under "this street was moving east" (the before-the-stop state)')

# ---------------------------------------------------------------- mix
# duck the groups that share the speech band under the voice (not the globe bed/cut, not the landing)
att, rel = 0.005, 0.120
ve = np.sqrt(np.convolve(voice ** 2, np.ones(int(0.025 * SR)) / int(0.025 * SR), mode='same'))
act = np.clip((ve / (np.max(ve) + 1e-9) - 0.05) / 0.15, 0, 1)
sm = np.zeros(NS); a_c, r_c = 1 - np.exp(-1 / (att * SR)), 1 - np.exp(-1 / (rel * SR)); cur = 0.0
for i in range(NS):
    cur += ((a_c if act[i] > cur else r_c)) * (act[i] - cur); sm[i] = cur
DUCK_DB = {'friction': 4.0, 'liquid': 3.0, 'air_cloth': 5.0, 'bike': 4.0, 'graphics': 3.0, 'impacts': 6.0, 'globe': 0.0, 'bed': 5.0, 'rewind': 3.0}
stems = {}
for g, x in G.items():
    pk = np.max(np.abs(x)) or 1.0
    y = x / pk * (voice_rms * 10 ** (REL[g] / 20)) * 3.0  # peak-ish scaling: group RMS is set relative to the voice below
    rms = np.sqrt(np.mean(y[np.abs(y) > 1e-4] ** 2)) if np.any(np.abs(y) > 1e-4) else 1.0
    y = y * (voice_rms * 10 ** (REL[g] / 20)) / rms if rms > 0 else y
    y = y * (1 - (1 - 10 ** (-DUCK_DB[g] / 20)) * sm)
    stems[g] = y
    write_wav(f'{OUT}/stems/foley_{g}.wav', y)
# the rewind: the hook's own effects played backward at the picture's rewind speed (a literal rewind, not a whoosh), band-limited so it does not fight the voice
rwk = cues['rewind_speed']; t_rw0 = at(EV['rewind_start']); t_rw1 = at(EV['rewind_end'])
seg = (sum(stems.values()))[:int(t_rw0 * SR)][::-1]
n_out = int(len(seg) / rwk); idx = np.arange(n_out) * rwk
rew = np.interp(idx, np.arange(len(seg)), seg)
rew = L.fft_filter(rew, 250, 7000)
rew[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR)); rew[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
rew = rew / (np.sqrt(np.mean(rew ** 2)) + 1e-12) * (voice_rms * 10 ** (REL['rewind'] / 20))
rew = rew * (1 - (1 - 10 ** (-DUCK_DB['rewind'] / 20)) * sm[int(t_rw0 * SR):int(t_rw0 * SR) + len(rew)] if len(rew) else 1)
k0 = int(round(t_rw0 * SR)); m = max(0, min(len(rew), NS - k0)); rwv = np.zeros(NS); rwv[k0:k0 + m] = rew[:m]
stems['rewind'] = rwv; write_wav(f'{OUT}/stems/foley_rewind.wav', rwv)
LOG.append({'file': 'audio/v3/h1/stems/foley_rewind.wav', 'frame': round(t_rw0 * FPS, 2), 'time_s': round(t_rw0, 4), 'gain_db_in_group': 0.0, 'group': 'rewind', 'note': f'frames {EV["rewind_start"]}-{EV["rewind_end"]}: the hook effects reversed and played {rwk:.2f}x (rewind), 250-7000 Hz'})
write_wav(f'{OUT}/stems/voice.wav', voice)
mix = voice + sum(stems.values())
mix[:int(0.0005 * SR)] *= np.linspace(0, 1, int(0.0005 * SR)); mix[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))


def ebur(x):
    write_wav('/tmp/_h1_probe.wav', np.stack([x, x], axis=1))
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', '/tmp/_h1_probe.wav', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    g = lambda k: float(re.findall(rf'^\s+{k}:\s+(-?[\d.]+)', out, re.M)[-1])
    return g('I'), g('Peak')


I0, P0 = ebur(mix)
gain_db = -15.0 - I0
mix2 = mix * 10 ** (gain_db / 20)
I1, P1 = ebur(mix2)
if P1 > -1.5:
    gain_db -= (P1 + 1.5); mix2 = mix * 10 ** (gain_db / 20); I1, P1 = ebur(mix2)
final = np.stack([mix2, mix2], axis=1)  # identical channels: mono-compatible by construction
write_wav(f'{OUT}/stems/mix_h1.wav', final)
sc = 10 ** (gain_db / 20)  # the same scale on the layers, so voice-only and SFX-only previews sit at the levels they have in the mix
vo, so = voice * sc, sum(stems.values()) * sc
write_wav(f'{OUT}/stems/voice_only_h1.wav', np.stack([vo, vo], axis=1)); write_wav(f'{OUT}/stems/sfx_only_h1.wav', np.stack([so, so], axis=1))
with open(f'{OUT}/SFX_LOG.csv', 'w', newline='') as fh:
    wr = csv.DictWriter(fh, fieldnames=['file', 'frame', 'time_s', 'gain_db_in_group', 'group', 'note']); wr.writeheader()
    for row in sorted(LOG, key=lambda r: r['time_s']): wr.writerow(row)
json.dump({'voice_rms_dBFS_voiced': round(20 * np.log10(voice_rms), 1), 'group_rel_to_voice_dB': REL, 'duck_dB_under_speech': DUCK_DB, 'mix_before_scale': {'LUFS': I0, 'true_peak_dBFS': P0}, 'scale_applied_dB': round(gain_db, 2), 'final': {'LUFS': I1, 'true_peak_dBFS': P1},
           'placed_events': len(LOG), 'note': 'levels are design targets, not listening results'}, open(f'{OUT}/MIX_LOG.json', 'w'), indent=1)
print(f'events {len(LOG)}; mix {len(mix2) / SR:.4f} s (video {DUR:.4f} s); before scale {I0:.1f} LUFS / {P0:.1f} dBTP; scale {gain_db:+.2f} dB -> {I1:.1f} LUFS / {P1:.1f} dBTP')
