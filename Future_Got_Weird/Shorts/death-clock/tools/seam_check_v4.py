#!/usr/bin/env python3
"""V4 loop seam check (measurement only; nothing here has been listened to).
Picture: exports/v4/FGW_DeathClock_V4_Final_1080x1920.mp4 if it exists (else the picture part is skipped and noted).
Sound:   audio/v4/mix/FGW_DeathClock_V4_mix_48k.wav and audio/v4/stems/*.wav (V3 files for comparison).
  1. the review clip, (last 1.5 s + first 1.5 s) x 3: qa/v4/seam/seam_check_x3.mp4 with picture, or
     qa/v4/seam/seam_check_x3.wav (sound only) while there is no V4 master;
  2. picture (master only): mean absolute frame difference for consecutive pairs in the last/first 2 s and the wrap pair,
     and a strip of the frames either side of the join (seam_frames.jpg);
  3. sound: per-frame level (mono mid RMS) of mix / effects / music / narration at 1338-1349 | 0-8, the 1349 -> 0 step,
     50 ms RMS across the join, the sample step at the join, the narration level across the join;
  4. alarm onsets across the wrap, detected in the effects stem (onset energy in the 1.2-1.3 kHz band of the alarm's
     first tone), with their spacing; expected: the picture's ring emissions (lib/beats4.ts: frames 1344 and 6, i.e. one
     alarm period of 12 frames across the join) and no new onset AT frame 0.
Writes qa/v4/seam/SEAM_CHECK.json. Usage: python3 -B tools/seam_check_v4.py"""
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
F = ROOT / 'exports' / 'v4' / 'FGW_DeathClock_V4_Final_1080x1920.mp4'
A4, A3 = ROOT / 'audio' / 'v4', ROOT / 'audio' / 'v3'
MIX = A4 / 'mix' / 'FGW_DeathClock_V4_mix_48k.wav'
OUT = ROOT / 'qa' / 'v4' / 'seam'
FPS, NF, SR = 30, 1350, 48000


def read24(p):
    with wave.open(str(p)) as w:
        ch = w.getnchannels()
        b = np.frombuffer(w.readframes(w.getnframes()), np.uint8).reshape(-1, 3).astype(np.int32)
    x = b[:, 0] | (b[:, 1] << 8) | (b[:, 2] << 16)
    x = np.where(x >= 1 << 23, x - (1 << 24), x)
    return x.reshape(-1, ch) / 8388607


def fr_db(x, f):
    a = int(round(f * SR / FPS)) % len(x)
    seg = np.take(x, np.arange(a, a + SR // FPS) % len(x))
    return round(float(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)), 1)


def frames(idx, w=270, h=480):
    sel = '+'.join(f'eq(n\\,{i})' for i in idx)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(F), '-vf', f"select='{sel}',scale={w}:{h}", '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3).astype(np.float32)


def alarm_onsets(x, f_lo=1200, f_hi=1300):
    """Onsets (in frames relative to the join; negative = tail) in a ring buffer x = [last 1 s | first 1 s] (mono)."""
    win, hop = 1024, 120
    hw = np.hanning(win)
    fr = np.fft.rfftfreq(win, 1 / SR)
    band = (fr >= f_lo) & (fr <= f_hi)
    e = np.array([np.sqrt(np.sum(np.abs(np.fft.rfft(x[i:i + win] * hw)[band]) ** 2)) for i in range(0, len(x) - win, hop)])
    t = (np.arange(len(e)) * hop + win / 2) / SR - 1.0  # seconds relative to the join
    flux = np.maximum(0, np.diff(e, prepend=e[0]))
    thr = max(flux.max() * 0.2, 1e-9)
    out = []
    for i in range(1, len(flux) - 1):
        if flux[i] > thr and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]:
            if not out or t[i] - out[-1][0] > 4 / FPS:
                out.append((float(t[i]), float(flux[i] / flux.max())))
    # the onset itself sits about half a window before the flux peak
    return [{'frame_rel_join': round((tt - win / 2 / SR) * FPS, 2), 'strength': round(s, 2)} for tt, s in out]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    res = {'listened': False, 'note': 'Measurements only. The exact listening check: play seam_check_x3 and judge the 1349 -> 0 join three times.'}
    have_pic = F.exists()
    # ---- 1. the review clip
    seg = [(NF / FPS - 1.5, NF / FPS), (0.0, 1.5)] * 3
    if have_pic:
        parts = [f'[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{k}];[1:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS[a{k}]' for k, (a, b) in enumerate(seg)]
        fc = ';'.join(parts) + ';' + ''.join(f'[v{k}][a{k}]' for k in range(len(seg))) + f'concat=n={len(seg)}:v=1:a=1[v][a]'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(F), '-i', str(MIX), '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '18', '-c:a', 'aac', '-b:a', '256k', str(OUT / 'seam_check_x3.mp4')], check=True)
        res['clip'] = str((OUT / 'seam_check_x3.mp4').relative_to(ROOT))
    else:
        parts = [f'[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS[a{k}]' for k, (a, b) in enumerate(seg)]
        fc = ';'.join(parts) + ';' + ''.join(f'[a{k}]' for k in range(len(seg))) + f'concat=n={len(seg)}:v=0:a=1[a]'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(MIX), '-filter_complex', fc, '-map', '[a]', '-c:a', 'pcm_s24le', str(OUT / 'seam_check_x3.wav')], check=True)
        res['clip'] = str((OUT / 'seam_check_x3.wav').relative_to(ROOT)) + ' (sound only: no V4 master yet)'
    # ---- 2. picture
    if have_pic:
        T, H = frames(list(range(NF - 60, NF))), frames(list(range(0, 60)))
        d = np.abs(np.diff(np.concatenate([T, H]), axis=0)).mean(axis=(1, 2, 3))
        res['picture'] = {'wrap_pair_mean_abs_diff': round(float(d[len(T) - 1]), 2), 'tail_median': round(float(np.median(d[:len(T) - 1])), 2),
                          'tail_max_last_30': round(float(d[len(T) - 31:len(T) - 1].max()), 2), 'head_frames_0_7_max': round(float(d[len(T):len(T) + 7].max()), 2)}
        row = np.concatenate(list(np.concatenate([T[-4:], H[:4]], axis=0)), axis=1).astype(np.uint8)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{row.shape[1]}x{row.shape[0]}', '-i', '-', str(OUT / 'seam_frames.jpg')], input=row.tobytes(), check=True)
    else:
        res['picture'] = f'skipped: {F.relative_to(ROOT)} does not exist yet'
    # ---- 3. sound levels across the join
    mix, fx, mus, nar = (read24(p).mean(1) for p in (MIX, A4 / 'stems' / 'effects.wav', A4 / 'stems' / 'music.wav', A4 / 'stems' / 'narration.wav'))
    mix3, fx3 = read24(A3 / 'mix' / 'FGW_DeathClock_mix_48k.wav').mean(1), read24(A3 / 'stems' / 'effects.wav').mean(1)
    frs = list(range(1338, 1350)) + list(range(0, 9))
    lab = [str(f) for f in frs]
    res['per_frame_db'] = {'frames': lab, **{k: [fr_db(v, f) for f in frs] for k, v in (('mix_v4', mix), ('effects_v4', fx), ('music', mus), ('narration', nar), ('mix_v3', mix3), ('effects_v3', fx3))}}
    res['step_1349_to_0_db'] = {'mix_v4': round(fr_db(mix, 0) - fr_db(mix, 1349), 1), 'mix_v3': round(fr_db(mix3, 0) - fr_db(mix3, 1349), 1),
                                'effects_v4': round(fr_db(fx, 0) - fr_db(fx, 1349), 1), 'effects_v3': round(fr_db(fx3, 0) - fr_db(fx3, 1349), 1), 'music': round(fr_db(mus, 0) - fr_db(mus, 1349), 1), 'target_mix': '< 3 dB'}
    w = int(0.05 * SR)
    ring = np.concatenate([mix[-SR:], mix[:SR]])
    rms = [round(float(20 * np.log10(np.sqrt(np.mean(ring[i:i + w] ** 2)) + 1e-9)), 1) for i in range(0, len(ring) - w + 1, w)]
    res['sound'] = {'samples': len(mix), 'duration_s': len(mix) / SR, 'rms_db_50ms_last1s_first1s': rms, 'rms_last_100ms_db': rms[19], 'rms_first_100ms_db': rms[20],
                    'join_sample_step': round(float(abs(mix[0] - mix[-1])), 5), 'typical_sample_step_last_1s': round(float(np.median(np.abs(np.diff(mix[-SR:])))), 5),
                    'narration_level_across_join_db': round(float(20 * np.log10(np.sqrt(np.mean(np.concatenate([nar[-int(0.1 * SR):], nar[:int(0.03 * SR)]]) ** 2)) + 1e-12)), 1)}
    # ---- 4. alarm onsets across the wrap
    on4 = alarm_onsets(np.concatenate([fx[-SR:], fx[:SR]]))
    on3 = alarm_onsets(np.concatenate([fx3[-SR:], fx3[:SR]]))
    near = lambda ons: [o for o in ons if -14 <= o['frame_rel_join'] <= 20]
    sp = [round(b['frame_rel_join'] - a['frame_rel_join'], 2) for a, b in zip(near(on4), near(on4)[1:])]
    try:
        import importlib.util, sys
        sys.dont_write_bytecode = True
        cues = json.load(open(A4 / 'cues.json'))
        b4 = cues.get('beats4', {})
        exp = [f - NF for f in range(b4.get('alarmOn0', 1337), NF) if (f - NF - b4.get('alarmPhase0', 6)) % b4.get('alarmPeriod', 12) == 0] + \
              [f for f in range(0, b4.get('alarmOff1', 30)) if (f - b4.get('alarmPhase0', 6)) % b4.get('alarmPeriod', 12) == 0]
    except Exception:  # noqa: BLE001
        exp = []
    res['alarm_onsets'] = {'expected_picture_emissions_rel_join': exp, 'sound_beats_expected': '1344 (-6) and 6 (+6); 18 is picture only',
                           'v4_detected': near(on4), 'v4_spacing_frames': sp, 'v3_detected': near(on3),
                           'v4_onset_within_1_frame_of_join': any(abs(o['frame_rel_join']) < 1 for o in near(on4))}
    json.dump(res, open(OUT / 'SEAM_CHECK.json', 'w'), indent=1)
    print('picture:', res['picture'] if isinstance(res['picture'], str) else json.dumps(res['picture']))
    print('step 1349->0:', res['step_1349_to_0_db'])
    print('mix_v4 per frame:', dict(zip(lab, res['per_frame_db']['mix_v4'])))
    print('alarm onsets v4:', near(on4), 'spacing', sp, '| v3:', near(on3))
    print('clip:', res['clip'])


if __name__ == '__main__':
    main()
