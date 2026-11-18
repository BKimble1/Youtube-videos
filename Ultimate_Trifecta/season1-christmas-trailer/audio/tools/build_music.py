"""Builds the trailer's music: orchestral MIDI stems through fluidsynth
(FluidR3_GM), synthesized drums / bells / bass / risers / impacts (dsp.py),
per-stem processing and a music mix with stems.

    python3 build_music.py OUT_DIR

Writes OUT_DIR/stems/*.wav (48 kHz float) and OUT_DIR/music_mix.wav.
"""
import os
import subprocess
import sys

import numpy as np
from pedalboard import Compressor, Gain, HighShelfFilter, HighpassFilter, LowShelfFilter, Pedalboard, PeakFilter, Reverb, Convolution, Limiter, LowpassFilter

import dsp
import score
from dsp import SR, place, secs

SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
DUR = 31.0           # 30 s + the final reverb tail (trimmed in the mix)
B = score.SPB        # seconds per beat


def tb(beat):
    return beat * B


def fluid(mid, wav):
    subprocess.run(["fluidsynth", "-ni", "-q", "-R", "0", "-C", "0", "-g", "0.9", "-r", str(SR), "-F", wav, SF2, mid], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    x = dsp.read(wav)
    out = np.zeros((secs(DUR), 2), np.float32)
    m = min(len(out), len(x))
    out[:m] = x[:m]
    return out


def bus(x, chain):
    return Pedalboard(chain)(x.T.copy(), SR).T.astype(np.float32)


def conv(x, ir_path, wet):
    y = bus(x, [Convolution(ir_path, mix=1.0)])
    return x * (1 - wet) + y * wet


# ------------------------------------------------------------------ synth parts
def drums():
    """Kick, snare/clap, hats, taiko/toms, crashes, booms: returns dict of stems."""
    n = secs(DUR)
    k = np.zeros((n, 2), np.float32)
    sn = np.zeros((n, 2), np.float32)
    ht = np.zeros((n, 2), np.float32)
    tk = np.zeros((n, 2), np.float32)
    cy = np.zeros((n, 2), np.float32)
    hit = np.zeros((n, 2), np.float32)
    kick = dsp.kick()
    kick_big = dsp.kick(0.7, f0=170, f1=42, punch=1.3, seed=31)
    sn1 = dsp.snare()
    cl = dsp.clap()
    hc = dsp.hat()
    ho = dsp.hat(open_=True)
    taiko = dsp.taiko()
    taiko_hi = dsp.taiko(f=120, dur=0.9, seed=33, vel=0.8)
    crash = dsp.crash()
    boom = dsp.boom()

    def groove(b0, bars, four=True, hats16=False, taiko_ones=True, fill=False):
        for bar in range(bars):
            b = b0 + bar * 4
            for i in range(4):
                if four or i in (0, 2):
                    place(k, kick, tb(b + i), 0.9 if i else 1.0)
                if i in (1, 3):
                    place(sn, sn1, tb(b + i), 0.75)
                    place(sn, cl, tb(b + i), 0.55)
            for i in range(16 if hats16 else 8):
                step = 0.25 if hats16 else 0.5
                bb = b + i * step
                is_off = (i % 2 == 1) if not hats16 else (i % 4 == 2)
                place(ht, ho if is_off and not hats16 else hc, tb(bb), (0.55 if is_off else 0.35))
            if taiko_ones:
                place(tk, taiko, tb(b), 0.9)
                place(tk, taiko_hi, tb(b + 2.5), 0.55)
            if fill and bar == bars - 1:
                for j, f in enumerate([180, 160, 140, 120, 105, 92, 82, 72]):
                    place(tk, dsp.tom(f, seed=40 + j, vel=0.6 + j * 0.05), tb(b + 2 + j * 0.25), 0.8)

    # cold open: the flashlight hit at 2.0 s, a snare roll into the stop-down
    place(hit, boom, tb(4.0), 0.9)
    place(tk, taiko, tb(4.0), 1.0)
    place(cy, dsp.crash(2.0, seed=50), tb(4.0), 0.35)
    for i in range(22):
        bb = 5.0 + i * (2.5 / 22)
        if bb < 7.5:
            place(sn, dsp.snare(0.2, seed=60 + i, vel=0.25 + 0.75 * (i / 22) ** 1.6, bright=0.6), tb(bb), 0.6)
    place(cy, dsp.reverse_crash(1.5, seed=51), tb(7.5) - 1.5, 0.55)
    # THE DROP (4.0 s) + theme A
    place(hit, dsp.boom(3.5, f0=70, f1=30, seed=52), tb(8.0), 1.0)
    place(k, kick_big, tb(8.0), 1.0)
    place(cy, crash, tb(8.0), 0.8)
    groove(8.0, 3, four=True, hats16=False, taiko_ones=True, fill=True)
    # chaos (10-18 s): half-time trap feel with orchestral hits on the cuts
    place(cy, crash, tb(20.0), 0.6)
    place(hit, dsp.boom(2.0, f0=65, f1=34, seed=53), tb(20.0), 0.7)
    for bar in range(4):
        b = 20.0 + bar * 4
        for bb, v in ((0, 1.0), (0.75, 0.7), (1.5, 0.85), (2.5, 0.8), (3.25, 0.6)):
            place(k, kick, tb(b + bb), v)
        place(sn, sn1, tb(b + 1), 0.8)
        place(sn, cl, tb(b + 1), 0.5)
        place(sn, sn1, tb(b + 3), 0.85)
        place(sn, cl, tb(b + 3), 0.5)
        for i in range(16):
            v = 0.32 if i % 2 == 0 else 0.2
            place(ht, hc, tb(b + i * 0.25), v)
        if bar in (1, 2):
            for i in range(6):     # hi-hat triplet roll
                place(ht, hc, tb(b + 3.0 + i / 6.0), 0.3)
        place(tk, taiko, tb(b), 0.9)
        place(tk, taiko_hi, tb(b + 2), 0.6)
        if bar < 3:
            place(cy, dsp.crash(1.2, seed=54 + bar), tb(b), 0.28)
    # bar 8 build: snare roll + toms to the stop-down at 17.75
    for i in range(24):
        bb = 32.0 + i * (3.5 / 24)
        place(sn, dsp.snare(0.18, seed=80 + i, vel=0.3 + 0.7 * (i / 24) ** 1.5, bright=0.7), tb(bb), 0.7)
    place(cy, dsp.reverse_crash(1.75, seed=55), tb(35.5) - 1.75, 0.6)
    # the chase (18-21 s): four on the floor, 16th toms, then the splash at 21.0
    place(hit, dsp.boom(2.5, f0=68, f1=32, seed=56), tb(36.0), 0.9)
    place(cy, crash, tb(36.0), 0.7)
    for i in range(6):
        place(k, kick if i % 2 else kick_big, tb(36.0 + i), 0.95)
        place(sn, sn1, tb(36.0 + i + 0.5), 0.35)
    for i in range(24):
        f = [150, 150, 120, 120, 100, 100, 130, 110][i % 8]
        place(tk, dsp.tom(f, dur=0.35, seed=90 + i % 8, vel=0.55 + (0.25 if i % 4 == 0 else 0.0) + i * 0.01), tb(36.0 + i * 0.25), 0.7)
    for i in range(12):
        place(ht, ho if i % 2 else hc, tb(36.0 + i * 0.5), 0.35)
    # splash (21.0 s): impact, then heartbeats under the slow motion
    place(hit, dsp.boom(3.0, f0=60, f1=26, seed=57, dist=2.2), tb(42.0), 1.0)
    place(cy, dsp.crash(3.0, seed=58), tb(42.0), 0.5)
    hb = dsp.heartbeat()
    place(k, hb, tb(42.0) + 0.25, 0.9)
    place(k, hb, tb(42.0) + 0.95, 0.75)
    place(cy, dsp.reverse_crash(1.0, seed=59), tb(44.0) - 1.0, 0.75)
    # key change (22.0 s): the biggest groove
    place(hit, dsp.boom(3.0, f0=72, f1=30, seed=61), tb(44.0), 1.0)
    place(k, kick_big, tb(44.0), 1.0)
    place(cy, crash, tb(44.0), 0.85)
    groove(44.0, 2, four=True, hats16=True, taiko_ones=True, fill=True)
    place(cy, dsp.crash(2.0, seed=62), tb(48.0), 0.45)
    # climax (26.0 s): impact, crash; the arrival hit (26.5 s)
    place(hit, dsp.boom(2.2, f0=66, f1=30, seed=63), tb(52.0), 0.95)
    place(k, kick_big, tb(52.0), 1.0)
    place(cy, crash, tb(52.0), 0.9)
    place(tk, taiko, tb(52.0), 1.0)
    place(tk, taiko, tb(53.0), 0.8)
    place(k, kick_big, tb(53.0), 0.8)
    for i in range(8):
        place(sn, dsp.snare(0.2, seed=100 + i, vel=0.4 + i * 0.07), tb(53.0 + i * 0.125), 0.55)
    # 27.75-28.0: silence.  LOGO (28.0 s)
    place(hit, dsp.boom(3.2, f0=74, f1=28, seed=64, dist=2.4), tb(56.0), 1.15)
    place(k, kick_big, tb(56.0), 1.05)
    place(tk, taiko, tb(56.0), 1.1)
    place(cy, dsp.crash(4.0, seed=65), tb(56.0), 1.0)
    place(hit, dsp.sub_drop(1.8), tb(56.0), 0.8)
    return {"kick": k, "snare": sn, "hats": ht, "taiko": tk, "cymbals": cy, "hits": hit}


def sleigh():
    n = secs(DUR)
    x = np.zeros((n, 2), np.float32)
    # the pickup into the drop, and 16th-note bells wherever the band plays
    place(x, dsp.sleigh_shake(0.18, seed=200, vel=0.9), tb(7.84), 1.0)
    place(x, dsp.sleigh_shake(0.16, seed=201, vel=0.9), tb(35.84), 1.0)
    spans = [(8.0, 20.0, 1.0), (20.0, 36.0, 0.75), (36.0, 42.0, 0.9), (44.0, 54.0, 1.0)]
    k = 0
    for b0, b1, lvl in spans:
        i = 0
        while b0 + i * 0.25 < b1 - 0.01:
            bb = b0 + i * 0.25
            acc = 1.0 if i % 4 == 2 else (0.75 if i % 2 == 1 else 0.55)
            place(x, dsp.sleigh_shake(0.07, seed=300 + k % 64, vel=acc), tb(bb) + (0.006 if i % 2 else 0.0), lvl * acc)
            i += 1
            k += 1
    # the tiptoe: one soft shake; the logo: a long shake and the final flourish
    place(x, dsp.sleigh_shake(0.1, seed=400, vel=0.5), tb(54.25), 0.6)
    place(x, dsp.sleigh_shake(0.9, seed=401, vel=1.5), tb(56.0), 1.0)
    place(x, dsp.sleigh_shake(0.5, seed=402, vel=1.1), tb(59.5), 0.9)
    return x


def bass():
    n = secs(DUR)
    x = np.zeros((n, 2), np.float32)

    def run(b0, bars_roots, pattern="oct8"):
        for bi, root in enumerate(bars_roots):
            if root is None:
                continue
            f = 440.0 * 2 ** ((score.n(root) - 69) / 12.0)
            b = b0 + bi * 2
            for i in range(4):
                ff = f * (2 if (pattern == "oct8" and i % 2 == 1) else 1)
                place(x, dsp.bass_note(ff, B * 0.48, vel=1.0 if i % 2 == 0 else 0.8), tb(b + i * 0.5))

    # drop: D | D | Bm G | A A
    run(8.0, ["D2", "D2", "G1", "B1", "A1", "A1"])
    # chaos: Bm G Em F#
    run(20.0, ["B1", "B1", "G1", "G1", "E1", "E1", "F#1", None], pattern="oct8")
    for i in range(6):
        place(x, dsp.bass_note(46.25, B * 0.4, vel=0.9), tb(34.0 + i * 0.25))
    # chase: B pedal 8ths, G
    run(36.0, ["B1", "B1", "G1"], pattern="oct8")
    # home: E C#m A B
    run(44.0, ["E2", "C#2", "A1", "B1"], pattern="oct8")
    # climax + logo: held E
    place(x, dsp.bass_note(82.4, 1.0, vel=1.1), tb(52.0))
    place(x, dsp.bass_note(41.2, 3.0, vel=1.2, cutoff=400), tb(56.0))
    return x


def risers():
    n = secs(DUR)
    x = np.zeros((n, 2), np.float32)
    place(x, dsp.riser(1.7, 180, 5000, seed=500), tb(7.5) - 1.7, 0.9)       # into the stop-down before the drop
    place(x, dsp.riser(2.5, 150, 6000, seed=501), tb(35.5) - 2.5, 0.9)      # into the chase
    place(x, dsp.riser(1.0, 300, 7000, seed=502, tonal=False), tb(44.0) - 1.0, 0.8)   # out of the water
    place(x, dsp.riser(1.6, 200, 6500, seed=503), tb(55.5) - 1.6, 0.35)     # under the tiptoe, to the logo
    return x


# stem loudness targets (integrated LUFS), the music's balance
TARGETS = {
    "kick": -19.0, "snare": -22.0, "hats": -30.0, "taiko": -21.0, "cymbals": -27.0, "hits": -18.5, "sleigh": -25.5,
    "bass": -21.0, "risers": -26.0,
    "brass": -18.5, "horns": -21.5, "trumpet": -21.0, "strings": -19.5, "strings_lo": -23.0, "trem": -24.0,
    "lowbrass": -22.0, "tuba": -27.0, "choir": -23.0, "glock": -24.0, "celesta": -24.0, "tubular": -29.0,
    "timpani": -25.0, "pizz": -25.0,
}


# stop-downs (near silence before the big hits) and the tiptoe breakdown
STOPS = [(3.75, 4.0, {"sleigh"}), (17.75, 18.0, {"sleigh"}), (27.75, 28.0, set())]
BREAKDOWN = (27.0, 27.75, {"pizz", "celesta", "sleigh"})


def _window_env(n, t0, t1, depth_db, ramp=0.025):
    t = np.arange(n) / SR
    e = np.ones(n, np.float32)
    lo = dsp.db(depth_db)
    a = np.clip((t - (t0 - ramp)) / ramp, 0, 1)
    b = np.clip(((t1 - 0.004) - t) / 0.004, 0, 1)
    w = np.minimum(a, b)
    return (1 - w * (1 - lo)).astype(np.float32)


def automate(proc):
    n = secs(DUR)
    for t0, t1, keep in STOPS:
        env = _window_env(n, t0, t1, -60.0)
        for name in proc:
            if name not in keep:
                proc[name] = proc[name] * env[:, None]
    t0, t1, keep = BREAKDOWN
    env = _window_env(n, t0, t1, -22.0, ramp=0.06)
    for name in proc:
        if name not in keep:
            proc[name] = proc[name] * env[:, None]
    # the trailer ends at 30.0 s: a short tail fade
    t = np.arange(n) / SR
    tail = np.clip((30.0 - t) / 0.45, 0, 1) ** 1.5
    for name in proc:
        proc[name] = proc[name] * tail[:, None]


def main(out):
    os.makedirs(os.path.join(out, "stems"), exist_ok=True)
    mids = os.path.join(out, "midi")
    os.makedirs(mids, exist_ok=True)
    paths = score.write_midis(mids)
    ir_hall = os.path.join(out, "ir_hall.wav")
    ir_plate = os.path.join(out, "ir_plate.wav")
    dsp.write(ir_hall, dsp.make_ir(3.2, pre=0.025, damp=4800, seed=7))
    dsp.write(ir_plate, dsp.make_ir(1.6, pre=0.008, damp=8000, seed=11, bright=0.3))
    stems = {}
    for stem, p in paths.items():
        stems[stem] = fluid(p, os.path.join(mids, stem + ".wav"))
    # orchestral processing
    orch_chain = {
        "strings": [HighpassFilter(90), PeakFilter(3000, 2.0, 0.8), HighShelfFilter(9000, 1.5)],
        "strings_lo": [HighpassFilter(60), PeakFilter(250, -2.0, 1.0)],
        "trem": [HighpassFilter(40)],
        "brass": [HighpassFilter(80), PeakFilter(1800, 2.5, 0.9), Compressor(-18, 3, 5, 120)],
        "horns": [HighpassFilter(70), PeakFilter(900, 2.0, 1.0)],
        "trumpet": [HighpassFilter(150), PeakFilter(2500, 2.0, 1.0)],
        "lowbrass": [HighpassFilter(40), LowShelfFilter(120, 2.0)],
        "tuba": [HighpassFilter(30)],
        "choir": [HighpassFilter(150), HighShelfFilter(6000, 2.0)],
        "glock": [HighpassFilter(500)],
        "celesta": [HighpassFilter(300)],
        "tubular": [HighpassFilter(200)],
        "timpani": [HighpassFilter(35), Compressor(-16, 3, 2, 150)],
        "pizz": [HighpassFilter(120)],
    }
    levels = {"strings": -3, "strings_lo": -4, "trem": -4, "brass": -2, "horns": -4, "trumpet": -5, "lowbrass": -3, "tuba": -6,
              "choir": -6, "glock": -7, "celesta": -4, "tubular": -10, "timpani": -2, "pizz": -4}
    wets = {"strings": 0.35, "strings_lo": 0.25, "trem": 0.4, "brass": 0.28, "horns": 0.35, "trumpet": 0.25, "lowbrass": 0.2, "tuba": 0.12,
            "choir": 0.5, "glock": 0.45, "celesta": 0.55, "tubular": 0.5, "timpani": 0.3, "pizz": 0.35}
    proc = {}
    for stem, x in stems.items():
        y = bus(x, orch_chain.get(stem, []) + [Gain(levels.get(stem, -4))])
        y = conv(y, ir_hall, wets.get(stem, 0.3))
        proc[stem] = y
    # synth parts
    d = drums()
    proc["kick"] = bus(d["kick"], [Gain(-2)])
    proc["snare"] = conv(bus(d["snare"], [HighpassFilter(120), Gain(-4)]), ir_plate, 0.3)
    proc["hats"] = bus(d["hats"], [HighpassFilter(5000), Gain(-9)])
    proc["taiko"] = conv(bus(d["taiko"], [Gain(-3)]), ir_hall, 0.3)
    proc["cymbals"] = conv(bus(d["cymbals"], [HighpassFilter(2500), Gain(-6)]), ir_hall, 0.25)
    proc["hits"] = conv(bus(d["hits"], [Gain(-1)]), ir_hall, 0.2)
    proc["sleigh"] = conv(bus(sleigh(), [HighpassFilter(2500), Gain(-4)]), ir_plate, 0.25)
    proc["bass"] = bus(bass(), [LowpassFilter(2500), Compressor(-14, 4, 3, 80), Gain(-5)])
    proc["risers"] = conv(bus(risers(), [Gain(-8)]), ir_hall, 0.3)
    # sidechain-style pump: the bass and pads duck under each kick
    kenv = np.abs(dsp.mono(proc["kick"]))
    kenv = dsp.lp(kenv, 30) * 6
    duck = 1.0 - np.clip(kenv, 0, 0.55)
    for s in ("bass", "strings_lo", "choir"):
        proc[s] = proc[s] * duck[:, None]
    # the slow-motion splash (21.0-22.0 s): the band drops under water
    t = np.arange(secs(DUR)) / SR
    u0, u1 = tb(42.0), tb(44.0)
    for s in ("strings", "strings_lo", "brass", "horns", "trumpet", "lowbrass", "tuba", "bass", "kick", "snare", "hats", "taiko", "sleigh"):
        x = proc[s]
        m = (t >= u0 - 0.01) & (t < u1)
        if m.any():
            seg = x[m]
            proc[s][m] = dsp.lp(seg, 500, 2) * 0.6
    # balance: each stem to a target loudness (integrated, gated LUFS)
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    for s_name, x in proc.items():
        try:
            L = meter.integrated_loudness(x.astype(np.float64))
        except Exception:
            L = -70.0
        if np.isfinite(L) and L > -70 and s_name in TARGETS:
            proc[s_name] = (x * dsp.db(TARGETS[s_name] - L)).astype(np.float32)
    automate(proc)
    for s_name, x in proc.items():
        dsp.write(os.path.join(out, "stems", f"{s_name}.wav"), x)
    mix = sum(proc.values())
    mix = bus(mix, [HighpassFilter(25), Compressor(-20, 2.2, 12, 180), LowShelfFilter(90, 1.5), HighShelfFilter(9000, 1.0)])
    L = meter.integrated_loudness(mix.astype(np.float64))
    mix = mix * dsp.db(-16.0 - L)
    dsp.write(os.path.join(out, "music_mix.wav"), mix)
    print("music: peak", float(np.max(np.abs(mix))))


if __name__ == "__main__":
    main(sys.argv[1])
