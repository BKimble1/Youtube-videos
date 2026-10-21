#!/usr/bin/env python3
"""Final mix for FGW Hidden Trigger V6 (publish master): the approved V5 mix, preserved.

Same narration (byte-identical source, same 0 s offset), same bed, same effect sounds, same levels, same gain staging.
Only two effect cues move, because the V6 picture moved the events they belong to:
  - the drops-landing ticks follow the new landings (in front of the palm, earlier),
  - the reaction-C tension accent follows the moved reaction insert.
Method: the V5 generator (tools/make_audio_v5.py, deterministic) is re-run up to its mix stage to recover the exact V5
effect signals; those two events are shifted (same samples), and the V5 mix chain is applied with V5's own two gain
values, so every sample outside the moved cues is identical to the V5 mix. The script checks that.

Inputs : tools/make_audio_v5.py (+ its inputs), audio/cues_v5.json, audio/cues_v6.json, source/public/audio/mix_v5.wav
Outputs: source/public/audio/mix_v6.wav, audio/mix/mix_v6_measure.json, audio/sfx_cues_v6.json
"""
import json, os, re, subprocess
import numpy as np, soundfile as sf, pyloudnorm as pyln

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(EP, 'tools/make_audio_v5.py')).read()
gen, mixsrc = src.split('# ---------------- mix ----------------', 1)
# re-run the V5 generator up to the mix stage, recording each placed event's exact samples
ns = {'__file__': os.path.join(EP, 'tools/make_audio_v5.py'), '__name__': 'v5gen'}
gen = gen.replace("    place(fx, sig, at)\n", "    place(fx, sig, at)\n    _EV.append((name, at, sig))\n")
exec('_EV = []\n' + gen, ns)
SR, N, fx = ns['SR'], ns['N'], ns['fx']
ev = {name: (at, sig) for name, at, sig in ns['_EV']}
c6 = json.load(open(os.path.join(EP, 'audio/cues_v6.json')))
moves = {
    'drops land on the bench (payoff)': c6['CONTACT']['main'] + min(L['t'] for L in c6['LANDINGS']),
    'tension accent (reaction C)': c6['SH']['sciC'] - 0.02,
}


def place(buf, sig, at, sign=1.0):
    i = int(round(at * SR))
    j = min(len(buf), i + len(sig))
    if j > i >= 0:
        buf[i:j] += sign * sig[:j - i]


fx6 = fx.copy()
changed = []
for name, new_at in moves.items():
    old_at, sig = ev[name]
    place(fx6, sig, old_at, -1.0)
    place(fx6, sig, new_at, +1.0)
    changed.append((min(old_at, new_at), max(old_at, new_at) + len(sig) / SR))

# the V5 mix chain, run twice: once as V5 (to recover V5's two gain values) and once with the moved cues
mix_body = mixsrc.split("os.makedirs(os.path.join(EP, 'source/public/audio')", 1)[0]


def run_mix(fx_signal, gains=None):
    m = dict(ns)
    m['fx'] = fx_signal
    body = mix_body
    if gains is not None:  # replace the two loudness normalisations with V5's own gains
        body = body.replace("gain_db = -15.0 - meter.integrated_loudness(st)", f"gain_db = {gains[0]!r}")
        body = body.replace("st *= 10 ** ((-15.0 - meter.integrated_loudness(st)) / 20)", f"st *= 10 ** ({gains[1]!r} / 20)")
    else:
        body = body.replace("st = limit(st)\nst *= 10 ** ((-15.0 - meter.integrated_loudness(st)) / 20)",
                            "st = limit(st)\n_g2 = -15.0 - meter.integrated_loudness(st)\nst *= 10 ** (_g2 / 20)")
    exec(body, m)
    return m


m5 = run_mix(fx)
g = (m5['gain_db'], m5['_g2'])
st5 = m5['st']
ref, _ = sf.read(os.path.join(EP, 'source/public/audio/mix_v5.wav'))
assert np.abs(st5 - ref).max() < 1e-6 * 50, 'could not reproduce the delivered V5 mix'
m6 = run_mix(fx6, g)
st6 = m6['st']

# outside the moved cues (plus the limiter's release), V6 must equal V5 sample for sample
mask = np.ones(N, bool)
for a, b in changed:
    mask[max(0, int((a - 0.05) * SR)):min(N, int((b + 0.5) * SR))] = False
outside = float(np.abs(st6[mask] - ref[mask]).max())
assert outside < 1e-6 * 50, f'V6 mix differs from V5 outside the moved cues ({outside})'

out = os.path.join(EP, 'source/public/audio/mix_v6.wav')
sf.write(out, st6.astype(np.float32), SR, subtype='PCM_24')
r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
summ = r[r.rfind('Summary:'):]
meas = {'integrated_LUFS': float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1)),
        'true_peak_dBTP': float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1)),
        'LRA_LU': float(re.search(r'LRA:\s+(-?[\d.]+) LU', summ).group(1)),
        'duration_s': round(N / SR, 3),
        'v5_gains_reused_dB': [round(x, 4) for x in g],
        'changed_windows_s': [[round(a, 3), round(b, 3)] for a, b in changed],
        'max_abs_diff_vs_v5_outside_changed_windows': outside,
        'max_abs_diff_vs_v5_inside_changed_windows': float(np.abs(st6[~mask] - ref[~mask]).max())}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_v6_measure.json'), 'w'), indent=1)
log = json.load(open(os.path.join(EP, 'audio/sfx_cues_v5.json')))
for e in log:
    if e.get('name') in moves:
        e['v5_time'] = e['time']
        e['time'] = round(moves[e['name']], 3)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues_v6.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
