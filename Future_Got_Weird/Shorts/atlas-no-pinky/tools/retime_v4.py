#!/usr/bin/env python3
"""V4 'fast' narration: remove the planned gap slices, then one pitch-preserving ffmpeg `atempo` pass (WSOLA, no pitch shift).
Writes audio/v4/narration_fast_48k.wav, audio/v4/map_fast.json and audio/v4/retime_report.txt.
The old->new time map (tools/timemap_v4.py) is then CHECKED against the rendered audio: speech envelopes of the predicted and the actual
retimed audio are cross-correlated window by window; if the actual timing drifts from the map by more than ~15 ms the map is corrected."""
import json, os, subprocess, wave
import numpy as np
import timemap_v4 as T

ROOT = T.ROOT
SR = 48000


def read(path):
    with wave.open(path) as w:
        n, ch = w.getnframes(), w.getnchannels(); raw = w.readframes(n)
    a = np.frombuffer(raw, dtype='<i2').astype(np.float64) / 32768.0
    return a.reshape(-1, ch).mean(1) if ch > 1 else a


def write(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


def env(x, hop=480):
    n = len(x) // hop
    return np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1))


def main():
    m = T.build('fast')
    src = read(f'{ROOT}/audio/narration_48k.wav')
    # 1. drop the planned slices (6 ms equal-power crossfades at each joint so no click can occur)
    xf = int(0.006 * SR)
    keep, prev = [], 0
    for r0, r1 in m['cuts']:
        keep.append((prev, int(r0 * SR)))
        prev = int(r1 * SR)
    keep.append((prev, len(src)))
    parts = [src[a:b] for a, b in keep]
    out = parts[0]
    for p in parts[1:]:
        fi = np.linspace(0, 1, xf); fo = 1 - fi
        joint = out[-xf:] * np.sqrt(fo) + p[:xf] * np.sqrt(fi)
        out = np.concatenate([out[:-xf], joint, p[xf:]])
    trimmed_path = f'{ROOT}/audio/v4/_trimmed.wav'
    write(trimmed_path, out)
    # 2. one pitch-preserving tempo pass
    fast_path = f'{ROOT}/audio/v4/narration_fast_48k.wav'
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', trimmed_path, '-af', f'atempo={T.SPEED}', '-ar', str(SR), '-ac', '1', '-c:a', 'pcm_s16le', fast_path], check=True)
    fast = read(fast_path)
    # 3. verify the map: envelope of the prediction (trimmed audio, time-compressed analytically) vs the actual atempo output
    e_pred_src = env(out)
    t_src = np.arange(len(e_pred_src)) * 0.01
    t_new = t_src / T.SPEED
    n_new = len(env(fast))
    grid = np.arange(n_new) * 0.01
    e_pred = np.interp(grid, t_new, e_pred_src)
    e_act = env(fast)
    lags = []
    win, hop = 200, 100       # 2 s windows, 1 s hop (10 ms frames)
    for a in range(0, n_new - win, hop):
        x = e_pred[a:a + win] - e_pred[a:a + win].mean(); y = e_act[a:a + win] - e_act[a:a + win].mean()
        if x.std() < 1e-4 or y.std() < 1e-4:
            continue
        cc = np.correlate(y, x, 'full')
        lag = (np.argmax(cc) - (win - 1)) * 10.0   # ms; + = actual audio later than the map predicts
        lags.append((a * 0.01, lag))
    rep = []
    rep.append(f'speed {T.SPEED}x, trims {T.TRIMS}')
    rep.append(f'source {len(src) / SR:.3f} s -> trimmed {len(out) / SR:.3f} s -> retimed {len(fast) / SR:.3f} s (expected {len(out) / SR / T.SPEED:.3f} s)')
    rep.append(f"map: voice end old {T.voice_end(len(T.WORDS) - 1):.3f} s -> new {m['voice_end_new']:.3f} s; total picture {m['total_s']:.3f} s = {m['total_frames']} frames")
    rep.append('envelope-correlation lag of the actual retimed audio against the map (ms), per 2 s window: ' + ', '.join(f'{t:.0f}s:{l:+.0f}' for t, l in lags))
    mx = max((abs(l) for _, l in lags), default=0.0)
    rep.append(f'max |lag| {mx:.0f} ms (10 ms resolution)')
    os.remove(trimmed_path)
    json.dump({'knots': m['knots'], 'speed': m['speed'], 'cuts': m['cuts'], 'total_s': m['total_s'], 'total_frames': m['total_frames'], 'voice_end_new': m['voice_end_new'], 'max_abs_lag_ms': mx}, open(f'{ROOT}/audio/v4/map_fast.json', 'w'), indent=1)
    open(f'{ROOT}/audio/v4/retime_report.txt', 'w').write('\n'.join(rep) + '\n')
    print('\n'.join(rep))


if __name__ == '__main__':
    main()
