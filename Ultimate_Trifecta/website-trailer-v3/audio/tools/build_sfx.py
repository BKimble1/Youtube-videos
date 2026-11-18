"""Sound design for the website trailer (V2), placed from the edit and the
engine's own event logs.

    python3 build_sfx.py EDL.json SHOT_EVENTS_DIR OUT_DIR

Every in-engine shot writes SHOT.events.json (footfalls from each character's
own gait phase, jumps, dives, splashes, tags, rustles, poofs, outfit swaps,
coins, pickups, confetti), with each event's time, distance to the camera and
screen position.  The events are mapped onto the timeline through the EDL:
level by distance, pan by screen position.  Subtle by design: the music
carries the energy, the effects give actions weight.

Sources: sfx_src/game/*.wav (the game's own sound effects: GO, jump, dive,
splash, pickup, portal, turbo, cloak, equip, boing, squeak, cheer, cart),
sfx_src/el/*.mp3 (generated sound effects: big splashes, cart passes, skid,
rustle, impact, whooshes, wind), and dsp.py (footsteps, room tone, drips).
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
    for sub, ext in (("game", ".wav"), ("el", ".mp3")):
        p = os.path.join(SRC, sub, name + ext)
        if os.path.exists(p):
            raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True).stdout
            x = np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
            _cache[name] = x
            return x
    raise FileNotFoundError(name)


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
    n = int(len(x) / rate)
    return signal.resample(x, n, axis=0).astype(np.float32)


class Timeline:
    def __init__(self, edl, evdir):
        self.clips = []
        for name, at, dur in edl["clips"]:
            p = os.path.join(evdir, f"{name}.events.json")
            ev = json.load(open(p)) if os.path.exists(p) else {"events": []}
            self.clips.append({"name": name, "at": at, "dur": dur, "ev": ev})

    def at(self, shot):
        return next(c["at"] for c in self.clips if c["name"] == shot)

    def events(self, shot, kind=None, who=None):
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


# what the feet land on
SURFACE = {"w04_bush": "grass", "w09_wall": "grass", "w12_wardrobe": "wood", "w13_party": "wood", "w17_safe": "wood"}
INDOOR = [(6.0, 6.7), (18.0, 22.0), (26.75, 28.0)]   # inside a dorm


def gain_for(dist, ref=3.0, floor=-30.0):
    return dsp.db(max(floor, -20 * np.log10(max(dist, 0.5) / ref)))


def p_of(e):
    sx = e["screen"][0]
    return (sx * 2 - 1) * 0.7 if 0 <= sx <= 1 else 0.0


def main(edl_path, evdir, out):
    os.makedirs(out, exist_ok=True)
    edl = json.load(open(edl_path))
    tl = Timeline(edl, evdir)
    n = secs(DUR)
    t = np.arange(n) / SR
    S = {k: np.zeros((n, 2), np.float32) for k in ("amb", "foley", "fx")}

    # ---------------------------------------------------------------- ambience: a quiet night campus, warm rooms
    wind = load("wind_1")
    w = np.concatenate([wind, wind[::-1], wind])[:n]
    env = np.ones(n, np.float32)
    for a, b in INDOOR:
        env *= np.where((t >= a) & (t < b), 0.15, 1.0)
    env *= np.where((t >= 0.45) & (t < 1.85), 0.5, 1.0)          # the slow-motion hook
    env *= np.where((t >= 27.5) & (t < 28.0), 0.1, 1.0)          # the stop
    S["amb"] += dsp.lp(dsp.fade(w, 0.2, 0.5), 2200) * env[:, None] * 0.28
    for a, b in INDOOR:
        room = dsp.lp(dsp.st(dsp.noise(secs(b - a), int(a * 10))), 260) * 0.04
        place(S["amb"], dsp.fade(room, 0.03, 0.05), a)

    # ---------------------------------------------------------------- footsteps from the gait, jumps, dives
    for shot, tt, e in tl.all_events("step"):
        if shot == "w02_reveal":
            continue
        surf = SURFACE.get(shot, "stone")
        if shot == "w03_go" and tt < 6.7:
            surf = "wood"
        g = gain_for(e["dist"], 3.0)
        k = 0.45 if shot == "w03_go" else 0.7
        place(S["foley"], pan(dsp.step(seed=int(tt * 997) % 5000, surface=surf, vel=1.0), p_of(e)), tt, g * k)
    for shot, tt, e in tl.all_events("jump"):
        g = gain_for(e["dist"], 4.0)
        place(S["foley"], load("jump"), tt, 0.5 * g)
        place(S["foley"], dsp.whoosh(0.4, 400, 2800, seed=int(tt * 31) % 999, peak=0.5, pan0=-0.4, pan1=0.4), tt, 0.4 * g)
    for shot, tt, e in tl.all_events("dive"):
        g = gain_for(e["dist"], 4.0)
        place(S["foley"], load("dive"), tt, 0.6 * g)
        place(S["foley"], dsp.whoosh(0.45, 300, 3200, seed=int(tt * 37) % 999, peak=0.5, pan0=-0.3, pan1=0.3), tt, 0.35 * g)

    # ---------------------------------------------------------------- the hook: the lunge, the dive, the splash on the bar
    for tt, e in tl.events("w01_hook", "tag"):
        place(S["fx"], speed(norm(load("whoosh_3"), -4), 0.6), tt + 0.05, 0.45)     # slowed with the picture
    sp = norm(load("splash_3"), -1)
    place(S["fx"], sp, 2.0 - onset(sp), 0.85)
    place(S["fx"], load("splash_big"), 2.0, 0.45)
    place(S["fx"], dsp.drips(1.6, seed=11), 2.3, 0.35)

    # ---------------------------------------------------------------- GO: the game's own round start, the door bursting
    place(S["fx"], norm(load("go"), -3), 6.0 - onset(load("go")), 0.5)
    place(S["fx"], dsp.door_thud(seed=12), 6.05, 0.35)

    # ---------------------------------------------------------------- the gags
    for tt, e in tl.events("w04_bush", "rustle"):
        ru = load("rustle_1")
        place(S["fx"], norm(ru, -4), tt - onset(ru), 0.55)
    for tt, e in tl.events("w04_bush", "poof"):
        place(S["fx"], load("pop"), tt, 0.5)
    for tt, e in tl.events("w04_bush", "emote_shush"):
        place(S["fx"], dsp.lp(dsp.bp(dsp.st(dsp.noise(secs(0.5), 70)), 2200, 6500) * 0.3, 7000), tt + 0.12, 0.35)
    for tt, e in tl.events("w05_cloak", "emote_cloak"):
        place(S["fx"], load("cloak"), tt + 0.15, 0.7)
    for tt, e in tl.events("w05_cloak", "poof"):
        place(S["fx"], load("pop"), tt, 0.35)
    coins = sorted(tt for tt, e in tl.events("w06_coins", "coin"))
    for i, tt in enumerate(coins):
        place(S["fx"], speed(load("pickup"), 2 ** (-(i % 5) * 2 / 12.0)), tt, 0.5)      # a rising run
    for tt, e in tl.events("w07_rift", "pickup"):
        place(S["fx"], load("turbo"), tt, 0.6)
    por = load("portal_2")
    place(S["fx"], norm(por, -3), 13.0 - peak_t(por), 0.55)      # the rift snaps shut on 13.0
    place(S["fx"], load("portal"), tl.at("w08_riftout"), 0.55)   # ...and spits her out across campus
    for tt, e in tl.events("w08_riftout", "seg_splash"):
        s1 = load("splash_1")
        place(S["fx"], norm(s1, -2), tt - onset(s1), 0.8)
    # the wall hop: the cart closing, its brakes as she clears the wall
    c4 = load("cart_4")
    place(S["fx"], norm(c4, -4), tl.at("w09_wall") + 0.55 - peak_t(c4), 0.6)
    sk = load("skid_2")
    place(S["fx"], dsp.fade(norm(sk, -5)[: secs(onset(sk) + 0.55)], 0.0, 0.15), tl.at("w09_wall") + 0.8 - onset(sk), 0.45)
    for tt, e in tl.events("w10_shield", "tag"):
        place(S["fx"], norm(load("whoosh_2"), -5), tt + 0.12 - onset(load("whoosh_2")), 0.4)
    for tt, e in tl.events("w10_shield", "bump"):
        place(S["fx"], load("boing"), tt, 0.7)
        place(S["fx"], dsp.door_thud(seed=21), tt, 0.2)
    for tt, e in tl.events("w11_pond", "seg_splash"):
        sp2 = load("pond_1")
        place(S["fx"], norm(sp2, -2), tt - onset(sp2), 0.8)
        place(S["fx"], load("squeak"), tt - 0.42, 0.35)            # a Duck Mascot cannonball
    # the wardrobe: the game's equip sound on every swap
    for tt, e in tl.events("w12_wardrobe", "swap"):
        place(S["fx"], load("equip"), tt, 0.55)
        place(S["fx"], load("pop"), tt, 0.25)
    for tt, e in tl.events("w13_party", "emote_point"):
        place(S["fx"], dsp.whoosh(0.25, 800, 4000, seed=31, peak=0.5, pan0=0, pan1=0), tt + 0.1, 0.25)

    # ---------------------------------------------------------------- the climax
    c1 = load("cart_1")
    place(S["fx"], norm(c1, -2), 23.37 - peak_t(c1), 0.75)       # the cart passes the hero's heels
    place(S["fx"], load("cart_start"), 22.1, 0.25)
    sk2 = load("skid_2")
    place(S["fx"], dsp.fade(norm(sk2, -3)[: secs(onset(sk2) + 0.75)], 0.0, 0.2), 23.45 - onset(sk2), 0.65)
    for tt, e in tl.events("w16_door", "tag"):
        place(S["fx"], speed(norm(load("whoosh_3"), -3), 0.55), tt + 0.1, 0.5)
    for tt, e in tl.events("w16_door", "confetti"):
        place(S["fx"], dsp.lp(load("cheer"), 3000), tt, 0.5)
    for tt, e in tl.events("w17_safe", "emote_shrug"):
        place(S["fx"], dsp.whoosh(0.3, 300, 1500, seed=41, peak=0.4, pan0=0, pan1=0), tt, 0.2)
    place(S["fx"], dsp.lp(load("cheer"), 4500), tl.at("w17_safe") + 0.05, 0.35)

    # ---------------------------------------------------------------- the logo
    imp = load("impact_2")
    place(S["fx"], norm(imp, -1), 28.0 - onset(imp, 0.5), 0.75)

    for k, x in S.items():
        dsp.write(os.path.join(out, f"sfx_{k}.wav"), x)
    mix = S["amb"] + S["foley"] + S["fx"]
    dsp.write(os.path.join(out, "sfx_mix.wav"), mix)
    print("sfx peak", float(np.max(np.abs(mix))))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
