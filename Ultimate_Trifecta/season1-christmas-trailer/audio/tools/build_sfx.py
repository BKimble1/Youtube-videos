"""Sound design for the Season 1 trailer, placed from the edit and the
engine's own event logs.

    python3 build_sfx.py EDL.json SHOT_EVENTS_DIR OUT_DIR

Every in-engine shot writes SHOT.events.json (footfalls from the character's
own gait phase, jumps, dives, splashes, tags, emotes, pickups, rustles, coins,
the flashlight beam), with each event's frame, distance to the camera and
screen position.  This script maps them onto the trailer's timeline through
the EDL and places the sounds: level by distance, pan by screen position.

Sources: sfx_src/el/*.mp3 (ElevenLabs sound effects generated for this
trailer: siren, radio chatter, splashes, impact, whooshes, cart, click, wind,
clock bell, rustle, portal, skid), sfx_src/game/*.wav (the game's own
sound effects), and dsp.py (synthesized footsteps, drips, shush, etc.).
Writes OUT_DIR/sfx_*.wav stems and OUT_DIR/sfx_mix.wav.
"""
import json
import os
import subprocess
import sys

import numpy as np
from scipy import signal

import dsp
from dsp import SR, place, secs

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "sfx_src")
DUR = 30.5
_cache = {}


def load(name):
    if name in _cache:
        return _cache[name]
    for sub, ext in (("el", ".mp3"), ("game", ".wav")):
        p = os.path.join(SRC, sub, name + ext)
        if os.path.exists(p):
            raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True).stdout
            x = np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
            _cache[name] = x
            return x
    raise FileNotFoundError(name)


def seg(x, t0, t1, fin=0.01, fout=0.05):
    return dsp.fade(x[secs(t0):secs(t1)].copy(), fin, fout)


def norm(x, peak_db=-1.0):
    return x * (dsp.db(peak_db) / (np.max(np.abs(x)) + 1e-9))


def onset(x, k=0.3):
    m = np.abs(x).max(axis=1)
    return np.argmax(m > k * m.max()) / SR


def peak_t(x):
    e = dsp.lp(np.abs(x).max(axis=1), 20)
    return np.argmax(e) / SR


def pan(x, p):
    p = float(np.clip(p, -1, 1))
    a = (p + 1) * np.pi / 4
    y = x.copy()
    y[:, 0] *= np.cos(a) * np.sqrt(2)
    y[:, 1] *= np.sin(a) * np.sqrt(2)
    return y


def speed(x, rate):
    """Varispeed (tape-style): rate < 1 is slower and lower."""
    n = int(len(x) / rate)
    return signal.resample(x, n, axis=0).astype(np.float32)


def shush(dur=0.6, seed=70):
    n = secs(dur)
    t = np.arange(n) / SR
    w = dsp.noise(n, seed)
    x = dsp.bp(w, 2200, 6500) * np.minimum(1, t / 0.06) * np.clip((dur - t) / 0.25, 0, 1)
    x += dsp.bp(w, 1400, 2400) * 0.25 * np.minimum(1, t / 0.06) * np.clip((dur - t) / 0.25, 0, 1)
    return dsp.st(x * 0.5)


def shimmer(dur=1.2, seed=71):
    x = dsp.sleigh_shake(0.3, seed=seed, vel=0.8, bright=1.25)
    out = dsp.silence(dur)
    place(out, x, 0.0)
    for i, f in enumerate([2637.0, 3136.0, 3951.0]):
        place(out, dsp.bell_tone(f, 1.0, vel=0.5), i * 0.04)
    return out


class Timeline:
    def __init__(self, edl, evdir):
        self.clips = []
        for name, at, dur in edl["clips"]:
            p = os.path.join(evdir, f"{name}.events.json")
            ev = json.load(open(p)) if os.path.exists(p) else {"events": [], "fps": 60}
            self.clips.append({"name": name, "at": at, "dur": dur, "ev": ev})

    def events(self, shot, kind=None, who=None):
        """(timeline time, event) for a shot's events inside its edit window."""
        for c in self.clips:
            if c["name"] != shot:
                continue
            for e in c["ev"].get("events", []):
                if kind and not e["kind"].startswith(kind):
                    continue
                if who and e["who"] != who:
                    continue
                if 0 <= e["t"] < c["dur"]:
                    yield c["at"] + e["t"], e

    def all_events(self, kind):
        for c in self.clips:
            for t, e in self.events(c["name"], kind):
                yield c["name"], t, e


SURFACE = {"b2_dorm": "wood", "c2_whiff": "snow", "c4_bush": "snow", "c6_cartchase": "snow", "b3_rift": "snow"}


def gain_for(dist, ref=3.0, floor=-30.0):
    return dsp.db(max(floor, -20 * np.log10(max(dist, 0.5) / ref)))


def main(edl_path, evdir, out):
    os.makedirs(out, exist_ok=True)
    edl = json.load(open(edl_path))
    tl = Timeline(edl, evdir)
    n = secs(DUR)
    S = {k: np.zeros((n, 2), np.float32) for k in ("amb", "foley", "fx", "trans", "radio")}

    # ---------------------------------------------------------------- ambience
    wind = load("wind_1")
    w = np.concatenate([wind, wind[::-1]])[:n]
    w = dsp.fade(w, 0.3, 0.6)
    env = np.ones(n, np.float32)
    t = np.arange(n) / SR
    env *= np.where((t >= 5.5) & (t < 7.0), 0.25, 1.0)                 # inside the dorm: muffled
    env *= np.where((t >= 21.0) & (t < 22.0), 0.3, 1.0)                # slow motion
    env *= np.where((t >= 27.75) & (t < 28.0), 0.15, 1.0)              # the stop-down
    S["amb"] += dsp.lp(w, 2600) * env[:, None] * 0.55
    # the dorm's warm room: soft low tone
    room = dsp.lp(dsp.noise(secs(1.5), 90)[:, None].repeat(2, 1), 300) * 0.05
    place(S["amb"], dsp.fade(room, 0.08, 0.08), 5.5)
    # the tower clock: a deep bell at the top, ticking until the flashlight
    bell = load("bell_1")
    place(S["amb"], norm(bell, -6), -onset(bell) + 0.04, 0.9)
    for i in range(4):
        place(S["amb"], dsp.clock_tick(seed=120 + i, vel=0.7), 0.25 + i * 0.5, 0.35)
    # distant sirens over the chaos and the chase
    sir = load("siren_2")
    s1 = seg(sir, 0.0, 12.0, 0.8, 1.2)
    senv = np.interp(np.arange(len(s1)) / SR, [0, 2, 7.5, 9.0, 11.0, 12.0], [0.15, 0.3, 0.3, 0.55, 0.55, 0.0])
    place(S["amb"], dsp.lp(s1 * senv[:, None], 3500), 9.5, 0.55)

    # ---------------------------------------------------------------- radio chatter
    rad = load("radio_3")
    r1 = dsp.radio_voice(seg(rad, 0.85, 2.15, 0.01, 0.08))
    place(S["radio"], dsp.radio_squelch(seed=130), 0.3, 0.8)
    place(S["radio"], r1, 0.36, 0.55)
    place(S["radio"], dsp.radio_squelch(seed=131, dur=0.12), 1.68, 0.7)
    r2 = dsp.radio_voice(seg(rad, 4.1, 5.3, 0.01, 0.1))
    place(S["radio"], dsp.radio_squelch(seed=132), 18.15, 0.7)
    place(S["radio"], r2, 18.2, 0.5)
    place(S["radio"], dsp.radio_squelch(seed=133, dur=0.12), 19.4, 0.6)

    # ---------------------------------------------------------------- footsteps from the gait
    for shot, tt, e in tl.all_events("step"):
        if shot in ("d3_splash",):
            continue
        g = gain_for(e["dist"], 3.0)
        sx = e["screen"][0]
        p = (sx * 2 - 1) * 0.7 if sx >= 0 else 0.0
        surf = SURFACE.get(shot, "stone")
        k = 0.9 if shot.startswith("d") else 0.6
        place(S["foley"], pan(dsp.step(seed=int(tt * 997) % 5000, surface=surf, vel=1.0), p), tt, g * k)
    # jumps, dives, landings
    for shot, tt, e in tl.all_events("jump"):
        g = gain_for(e["dist"], 4.0)
        place(S["foley"], dsp.whoosh(0.35, 400, 2500, seed=int(tt * 31) % 999, peak=0.4), tt, 0.35 * g)
        place(S["foley"], load("jump") * 0.6, tt, 0.4 * g)
    for shot, tt, e in tl.all_events("dive"):
        g = gain_for(e["dist"], 4.0)
        place(S["foley"], load("dive"), tt, 0.7 * g)

    # ---------------------------------------------------------------- the opening
    place(S["fx"], load("click_2"), 1.8 - onset(load("click_2")) + 0.0, 0.8)
    place(S["fx"], dsp.whoosh(0.32, 600, 5000, seed=140, peak=0.75, pan0=0.6, pan1=-0.6), 1.76, 0.8)
    place(S["fx"], shimmer(), 2.0, 0.35)
    # the hero turns: a cloth rustle; caught: a tiny slipper squeak
    place(S["foley"], dsp.whoosh(0.3, 300, 1800, seed=141, peak=0.5, pan0=0, pan1=0), 3.25, 0.25)
    # the drop: runners burst past the lens
    for shot, tt, e in tl.all_events("step"):
        if shot == "b1_drop" and e["dist"] < 2.2 and e["who"] != "hero":
            place(S["fx"], dsp.whoosh(0.5, 500, 4500, seed=int(tt * 77) % 999, peak=0.5,
                                      pan0=-0.8 if e["screen"][0] < 0.5 else 0.8, pan1=0.8 if e["screen"][0] < 0.5 else -0.8), tt - 0.25, 0.35)

    # ---------------------------------------------------------------- Christmas has arrived
    for tt, e in tl.events("b3_rift", "pickup"):
        place(S["fx"], load("turbo"), tt, 0.7)
        place(S["fx"], shimmer(0.8, 142), tt, 0.25)
    por = load("portal_2")
    place(S["fx"], norm(por, -3), 8.02 - peak_t(por), 0.7)
    place(S["fx"], load("portal"), 7.6, 0.4)
    coins = sorted(tt for tt, e in tl.events("b4_coins", "coin"))
    for i, tt in enumerate(coins):
        c = speed(load("pickup"), 2 ** (-(i % 5) / 12.0))     # rising arpeggio
        place(S["fx"], c, tt, 0.55)

    # ---------------------------------------------------------------- chaos
    cart = load("cart_4")
    place(S["fx"], norm(cart, -2), 10.82 - peak_t(cart), 0.8)
    for tt, e in tl.events("c2_whiff", "tag"):
        place(S["fx"], norm(load("whoosh_3"), -3), tt + 0.12 - onset(load("whoosh_3")), 0.6)
    for tt, e in tl.events("c2_whiff", "jump"):
        place(S["fx"], load("hop"), tt, 0.5)
        place(S["fx"], load("boing"), tt + 0.05, 0.35)
    for tt, e in tl.events("c3_pond", "seg_splash"):
        sp = load("pond_1")
        place(S["fx"], norm(sp, -2), tt - onset(sp), 0.9)
        place(S["fx"], load("splash_big"), tt, 0.4)
    for tt, e in tl.events("c4_bush", "rustle"):
        ru = load("rustle_1")
        place(S["fx"], norm(ru, -4), tt - onset(ru), 0.75)
    for tt, e in tl.events("c5_shield", "tag"):
        place(S["fx"], norm(load("whoosh_2"), -4), tt + 0.12 - onset(load("whoosh_2")), 0.5)
        place(S["fx"], load("boing"), tt + 0.36, 0.8)
        place(S["fx"], dsp.door_thud(seed=150), tt + 0.36, 0.25)
    c2 = load("cart_1")
    place(S["fx"], norm(c2, -6), 15.55 - peak_t(c2), 0.5)
    for tt, e in tl.events("c7_dive", "seg_splash"):
        sp = load("splash_1")
        place(S["fx"], norm(sp, -2), tt - onset(sp), 0.85)
    sk = load("skid_2")
    place(S["fx"], dsp.fade(norm(sk, -4)[: secs(onset(sk) + 0.6)], 0.0, 0.15), 17.0 - onset(sk), 0.7)
    place(S["fx"], load("whistle"), 17.25, 0.55)

    # ---------------------------------------------------------------- the chase
    # the hero's splash (21.0): slow motion - heavy, low and long, then the
    # pop-out at the far shore (22.0)
    sp = load("splash_3")
    big = norm(sp, -1)
    place(S["fx"], big[: secs(0.25)], 21.0 - onset(sp) * 0.0 - 0.02, 0.5)
    slow = speed(big, 0.42)
    place(S["fx"], dsp.lp(slow, 5000), 21.0, 0.7)
    place(S["fx"], dsp.splash(1.4, seed=160, size=1.2), 21.0, 0.6)
    bub = dsp.lp(dsp.splash(1.2, seed=161, size=0.7), 900)
    place(S["fx"], bub, 21.35, 0.6)
    place(S["fx"], dsp.riser(0.45, 400, 6000, seed=162, tonal=False), 21.55, 0.5)
    sp1 = load("splash_1")
    place(S["fx"], norm(sp1, -3)[: secs(1.2)], 22.02 - onset(sp1), 0.75)
    place(S["fx"], dsp.drips(1.4, seed=163), 22.2, 0.6)
    # the door (~26.4): a warm whoosh through the doorway and a muffled cheer inside
    door_t = None
    for tt, e in tl.events("d5_door", "step", "hero"):
        door_t = tt
    door_t = door_t or 26.4
    place(S["fx"], dsp.whoosh(0.6, 300, 3000, seed=170, peak=0.7, pan0=-0.3, pan1=0.4), door_t - 0.35, 0.5)
    place(S["fx"], dsp.lp(load("cheer"), 2400), door_t + 0.05, 0.45)
    # the shush
    place(S["fx"], shush(0.62), 26.98, 0.65)

    # ---------------------------------------------------------------- transitions
    cuts = (5.5, 7.0, 8.5, 12.0, 15.0, 24.5)
    for tcut in cuts:
        wh = load(["whoosh_1", "whoosh_4", "whoosh_3", "whoosh_2", "whoosh_1", "whoosh_4"][cuts.index(tcut)])
        place(S["trans"], norm(wh, -4), tcut - peak_t(wh), 0.55)
    # the logo (28.0): impact and a soft rising whoosh for the season line
    imp = load("impact_2")
    place(S["trans"], norm(imp, -1), 28.0 - onset(imp, 0.5), 0.9)
    place(S["trans"], dsp.whoosh(0.5, 800, 6000, seed=180, peak=0.8, pan0=0, pan1=0), 28.1, 0.18)

    # ---------------------------------------------------------------- write
    for k, x in S.items():
        dsp.write(os.path.join(out, f"sfx_{k}.wav"), x)
    mix = S["amb"] * 0.9 + S["foley"] * 1.0 + S["fx"] * 1.0 + S["trans"] * 1.0 + S["radio"] * 1.0
    dsp.write(os.path.join(out, "sfx_mix.wav"), mix)
    print("sfx peak", float(np.max(np.abs(mix))))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
