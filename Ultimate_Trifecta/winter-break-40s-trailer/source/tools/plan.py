#!/usr/bin/env python3
"""Ultimate Trifecta - Season 1: Winter Break, 40 s cinematic trailer (V1).

Writes the shot list for the in-engine director (ut40_shots.json) and the
edit decision list (edl.json).  Everything is staged on Moonbrook College:
Puddlesworth Hall's common room and front door (0, 103), the central spine
path, and Founders' Fountain (0, 22), r 6.0 inner / 6.6 outer, rim top 0.6,
water 0.25.  World: x east, z south, y up.  Yaw: facing -Z at 0, PI faces
south (+Z).

Two story clocks:
  fountain tau: T = 4.10 + tau from 0:04 to 0:12 (real time), then the
                jump's slow motion, the water cut, the run home;
  dorm delta:   T = delta for the departure (0:00-0:04), and
                T = delta + 8.05 for the return (0:28.5-0:36).
"""
import json, math, sys, os, copy

PI = math.pi
FPS = 60
OUT_JSON = "/home/user/ut/game/game/src/dev/trailer/ut40_shots.json"
OUT_EDL = "/home/user/ut/work/edl.json"

# ----------------------------------------------------------------- the cast
LEAD = {"outfit": "pj", "pattern": "stripes", "color": "sky", "hat": "nightcap", "shoes": "slippers", "skin": "tone2",
        "hair": "tuft", "hair_color": "brown", "face": "classic"}
ELF = {"outfit": "elf_helper", "hair": "bob", "hair_color": "blonde", "skin": "tone1", "color": "lime", "hat": "none"}
DEER = {"outfit": "reindeer_onesie", "hair": "bob", "hair_color": "black", "skin": "tone6", "color": "coral", "hat": "none"}
WATCH = {"color": "sky", "skin": "tone6"}
TOWEL = ["e8434f", "f6efe2"]          # red and cream stripes

# --------------------------------------------------------- route utilities
def _cr(p0, p1, p2, p3, u):
    u2, u3 = u * u, u * u * u
    return [0.5 * ((2 * p1[i]) + (-p0[i] + p2[i]) * u + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * u2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * u3) for i in range(2)]


class Route:
    """Port of TrailerRoute (Catmull-Rom, arc-length parameterised), x/z only."""
    def __init__(self, pts, step=0.25):
        c = [list(map(float, p[:2])) for p in pts]
        dense = []
        for i in range(len(c) - 1):
            p0 = c[max(i - 1, 0)]; p1 = c[i]; p2 = c[i + 1]; p3 = c[min(i + 2, len(c) - 1)]
            if i == 0:
                p0 = [p1[0] - (p2[0] - p1[0]), p1[1] - (p2[1] - p1[1])]
            if i + 2 >= len(c):
                p3 = [p2[0] + (p2[0] - p1[0]), p2[1] + (p2[1] - p1[1])]
            n = max(2, int(math.ceil(math.dist(p1, p2) / step)))
            for k in range(n):
                dense.append(_cr(p0, p1, p2, p3, k / n))
        dense.append(c[-1])
        self.pts = dense
        self.cum = [0.0]
        for i in range(1, len(dense)):
            self.cum.append(self.cum[-1] + math.dist(dense[i], dense[i - 1]))
        self.length = self.cum[-1]

    def at(self, s):
        if s <= 0:
            return self.pts[0]
        if s >= self.length:
            return self.pts[-1]
        for i in range(1, len(self.cum)):
            if self.cum[i] >= s:
                u = (s - self.cum[i - 1]) / max(self.cum[i] - self.cum[i - 1], 1e-6)
                a, b = self.pts[i - 1], self.pts[i]
                return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]

    def s_at_z(self, z):
        """first arc length where the route reaches z (monotonic in z assumed)."""
        for i in range(1, len(self.pts)):
            a, b = self.pts[i - 1], self.pts[i]
            if (a[1] - z) * (b[1] - z) <= 0 and a[1] != b[1]:
                u = (z - a[1]) / (b[1] - a[1])
                return self.cum[i - 1] + u * (self.cum[i] - self.cum[i - 1])
        return self.length


def dist(keys, t):
    """TrailerRoute.dist: piecewise-linear speed keys [[t, v]], constant outside."""
    if t <= keys[0][0]:
        return keys[0][1] * t if keys[0][0] <= 0 else keys[0][1] * t
    s = keys[0][1] * keys[0][0] if keys[0][0] > 0 else 0.0
    if keys[0][0] > 0:
        s = keys[0][1] * keys[0][0]
    for i in range(len(keys) - 1):
        ta, va = keys[i]; tb, vb = keys[i + 1]
        if t <= tb:
            u = t - ta
            return s + va * u + 0.5 * (vb - va) / max(tb - ta, 1e-4) * u * u
        s += (va + vb) * 0.5 * (tb - ta)
    return s + keys[-1][1] * (t - keys[-1][0])


def time_at_dist(keys, d, t_max=60.0):
    lo, hi = 0.0, t_max
    for _ in range(60):
        mid = (lo + hi) / 2
        if dist(keys, mid) < d:
            lo = mid
        else:
            hi = mid
    return hi


def yaw_to(a, b):
    return math.atan2(-(b[0] - a[0]), -(b[1] - a[1]))


def tau_at(t, speed, tau0):
    """TrailerDirector._tau_at (output seconds within a shot -> scene time)."""
    if not speed:
        return tau0 + t
    keys = speed
    if t <= keys[0][0]:
        return tau0 + t * keys[0][1]
    s = tau0 + keys[0][0] * keys[0][1]
    for i in range(len(keys) - 1):
        ta, ra = keys[i]; tb, rb = keys[i + 1]
        if t <= tb:
            u = t - ta
            return s + ra * u + 0.5 * (rb - ra) / max(tb - ta, 1e-4) * u * u
        s += (ra + rb) * 0.5 * (tb - ta)
    return s + keys[-1][1] * (t - keys[-1][0])


def r3(v):
    if isinstance(v, float):
        return round(v, 4)
    if isinstance(v, list):
        return [r3(x) for x in v]
    if isinstance(v, dict):
        return {k: r3(x) for k, x in v.items()}
    return v


# ================================================================ FOUNTAIN
# fountain tau = T - 4.10 through 0:12
FT = 4.10
S8_T = 12.8
RIM_Y = 0.6
WATER_Y = 0.25
SWIM_Y = -0.95
LINE_Z = 9.6
X_LEAD, X_DEER, X_ELF = 1.45, 0.1, -1.3      # east to west along the line
TEST_X = 0.75                                  # where the lead tests the water (on the rim)
RIM_Z = 15.72                                  # rim centre line on the north side
T_RUN = 7.86                                   # the lead's first running step (tuned to the footfall at 0:12)
RUN_KEYS = [[0.0, 0.0], [0.25, 3.2], [0.9, 5.0]]
TAKEOFF_Z = 14.85


def leap(x, z_land, t_run, run_keys, takeoff_z=TAKEOFF_Z, h=1.3, line=None):
    """a run from the line into the water: returns (route seg, jump fx, t_takeoff, t_impact, end pos)"""
    pts = [[x, LINE_Z if line is None else line], [x, z_land + 2.0]]
    r = Route(pts)
    s_to = r.s_at_z(takeoff_z)
    s_land = r.s_at_z(z_land)
    t_to = t_run + time_at_dist(run_keys, s_to)
    t_im = t_run + time_at_dist(run_keys, s_land)
    seg = {"mode": "route", "t0": t_run, "pts": pts, "speed": run_keys}
    fx = {"type": "jump", "t": t_to, "dur": t_im - t_to, "h": h, "dy": WATER_Y}
    return seg, fx, t_to, t_im


def fountain_plan():
    A = {}
    # ---- the lead -----------------------------------------------------
    step_pts = [[TEST_X - 0.2, 13.1], [TEST_X, RIM_Z]]
    step_r = Route(step_pts)
    back_pts = [[TEST_X, RIM_Z], [TEST_X + 0.08, 14.75]]
    walk_pts = [[TEST_X + 0.08, 14.75], [TEST_X + 0.5, 12.6], [X_LEAD, LINE_Z]]
    wr = Route(walk_pts)
    # walk back: constant speed then a short stop, arriving at 3.55
    t_w0, t_w1 = 2.05, 3.55
    v = wr.length / ((t_w1 - t_w0) - 0.15)
    walk_keys = [[0.0, v], [t_w1 - t_w0 - 0.3, v], [t_w1 - t_w0, 0.0]]
    seg_run, fx_jump, l_to, l_im = leap(X_LEAD, 19.45, T_RUN, RUN_KEYS)
    A["lead_to"], A["lead_im"] = l_to, l_im
    # under the water after the splash (the splash ducks under at +1.45)
    l_surf = 12.35
    swim_pts = [[1.5, 25.9], [1.3, 26.8], [1.05, 27.55]]
    swim_v = 2.3
    l_climb = l_surf + Route(swim_pts).length / swim_v
    l_rim = l_climb + 0.45
    l_down = l_rim + 0.28
    home_pts = [[1.0, 29.45], [1.05, 33.0], [0.8, 37.5], [0.75, 45.0], [0.2, 80.0], [-0.3, 99.5]]
    home_keys = [[0.0, 2.5], [0.45, 6.0], [1.0, 6.7]]
    A["l_surf"], A["l_climb"], A["l_down"] = l_surf, l_climb, l_down
    lead = {
        "id": "lead", "role": "runner", "look": LEAD,
        "segs": [
            {"mode": "route", "t0": -1.25, "pts": step_pts, "s0": step_r.length - 2.1 * 1.25, "speed": [[0.0, 2.1]]},
            {"mode": "hold", "t0": 0.0, "pos": [TEST_X, RIM_Y, RIM_Z], "yaw": PI},
            {"mode": "route", "t0": 1.75, "pts": back_pts, "speed": [[0.0, 3.2]], "y": RIM_Y},
            {"mode": "route", "t0": t_w0, "pts": walk_pts, "speed": walk_keys},
            {"mode": "hold", "t0": t_w1, "pos": [X_LEAD, 0.0, LINE_Z], "yaw": 0.0},
            seg_run,
            {"mode": "splash", "t0": l_im, "pos": [X_LEAD, WATER_Y, 19.45], "yaw": PI, "len": 1.5},
            {"mode": "route", "t0": l_surf, "pts": swim_pts, "speed": [[0.0, swim_v]], "y": SWIM_Y},
            {"mode": "route", "t0": l_climb, "pts": [[1.05, 27.55], [1.02, 28.3]], "speed": [[0.0, 1.6]], "y": SWIM_Y},
            {"mode": "route", "t0": l_rim, "pts": [[1.02, 28.3], [1.0, 29.45]], "speed": [[0.0, 4.0]], "y": RIM_Y},
            {"mode": "route", "t0": l_down, "pts": home_pts, "speed": home_keys},
        ],
        "fx": [
            {"type": "jump", "t": -0.33, "dur": 0.33, "h": 0.1, "dy": RIM_Y},
            {"type": "ripple", "t": 1.02, "pos": [TEST_X + 0.05, WATER_Y, RIM_Z + 0.5], "size": 0.32},
            {"type": "yoff", "t": 0.0, "dur": 9.0, "keys": [[0.45, 0.0], [0.95, -0.13], [1.12, -0.13], [1.25, 0.0]]},
            # turn away from the water, walk back, turn to face it again
            {"type": "turn", "t": 3.25, "dur": 0.35, "yaw": PI, "until": T_RUN},
            {"type": "jump", "t": 1.75, "dur": 0.3, "h": 0.12, "dy": -RIM_Y},
            {"type": "spotted", "t": 3.9, "dur": 2.9},
            fx_jump,
            {"type": "burst", "t": l_im, "pos": [X_LEAD, WATER_Y, 19.45], "size": 2.0},
            {"type": "resurface", "t": l_surf},
            {"type": "jump", "t": l_climb, "dur": 0.45, "h": 0.28, "dy": RIM_Y - SWIM_Y},
            {"type": "jump", "t": l_rim, "dur": 0.28, "h": 0.1, "dy": -RIM_Y},
        ],
        "hide": [[l_im + 1.47, l_surf]],
        "wet": [[l_im, 99.0]],
        "pose": [
            [-0.3, {}],
            # on the rim: looks down at the water, arms out a little for balance
            [0.35, {"head": [-22, 0, 0], "upper_arm.L": [0, 0, -18], "upper_arm.R": [0, 0, 18]}],
            [0.55, {"head": [-26, 0, 0], "upper_arm.L": [5, 0, -24], "upper_arm.R": [5, 0, 24], "spine": [6, 0, 0]}],
            # the toe goes out over the water (right leg), body leaning back
            [1.0, {"head": [-30, 0, 0], "upper_arm.L": [10, 0, -32], "upper_arm.R": [10, 0, 34], "spine": [12, 0, 0], "chest": [4, 0, 0],
                   "thigh.R": [38, 0, 4], "shin.R": [-4, 0, 0], "foot.R": [-50, 0, 0], "thigh.L": [28, 0, 0], "shin.L": [-46, 0, 0], "foot.L": [18, 0, 0]}],
            # recoil: the leg snaps back, shoulders up, lean away
            [1.16, {"head": [8, 0, 0], "upper_arm.L": [28, 0, -12], "upper_arm.R": [28, 0, 12], "forearm.L": [40, 0, 0], "forearm.R": [40, 0, 0],
                    "spine": [16, 0, 0], "chest": [8, 0, 0], "thigh.R": [-6, 0, 0], "shoulder.L": [0, 0, 12], "shoulder.R": [0, 0, -12]}, "snap"],
            [1.45, {"head": [4, 0, 0], "upper_arm.L": [24, 0, -10], "upper_arm.R": [24, 0, 10], "forearm.L": [36, 0, 0], "forearm.R": [36, 0, 0],
                    "spine": [10, 0, 0], "shoulder.L": [0, 0, 10], "shoulder.R": [0, 0, -10]}],
            [1.75, {}],
            # back at the line: hunched, then the friend catches the look
            [3.45, {"head": [-6, 0, 0], "spine": [-4, 0, 0]}],
            [3.62, {"head": [-4, 28, 0]}],
            [3.86, {"head": [-2, 30, 0]}],
            # the light: eyes and head track it (it comes from the west, their right)
            [4.2, {"head": [4, -42, 0], "neck": [0, -10, 0], "spine": [3, 0, 0]}],
            [5.5, {"head": [4, -58, 0], "neck": [0, -14, 0], "spine": [3, 0, 0]}],
            [6.75, {"head": [4, -58, 0], "neck": [0, -14, 0]}],
            # one look at the water
            [7.05, {"head": [-14, 4, 0], "neck": [0, 0, 0]}],
            [7.3, {"head": [-12, 0, 0]}],
            # a tiny nod
            [7.42, {"head": [-22, 0, 0]}],
            [7.56, {"head": [-4, 0, 0]}],
            [7.86, {"head": [2, 0, 0], "spine": [-6, 0, 0]}],
            [8.3, {}],
            # in the air: arms up and out, then tuck for the cannonball
            [l_to + 0.08, {}],
            [l_to + 0.25, {"upper_arm.L": [40, 0, -95], "upper_arm.R": [40, 0, 95], "forearm.L": [20, 0, 0], "forearm.R": [20, 0, 0], "head": [10, 0, 0]}],
            [l_to + 0.48, {"upper_arm.L": [50, 0, -80], "upper_arm.R": [50, 0, 80], "forearm.L": [40, 0, 0], "forearm.R": [40, 0, 0],
                           "thigh.L": [55, 0, 0], "thigh.R": [55, 0, 0], "shin.L": [-70, 0, 0], "shin.R": [-70, 0, 0]}],
            [l_im - 0.05, {"upper_arm.L": [70, 0, -20], "upper_arm.R": [70, 0, 20], "forearm.L": [80, 0, 0], "forearm.R": [80, 0, 0],
                           "thigh.L": [80, 0, 0], "thigh.R": [80, 0, 0], "shin.L": [-110, 0, 0], "shin.R": [-110, 0, 0], "head": [-10, 0, 0]}],
            [l_im + 0.12, {}],
        ],
        "face": [
            [-0.3, {}],
            [0.4, {"brow_up": 0.4, "open": 0.15}],
            [0.95, {"brow_up": 0.7, "open": 0.3, "squint": 0.2}],
            [1.12, {"brow_up": 1.0, "open": 0.9, "squint": 0.85, "smile": 0.0}, "snap"],
            [1.6, {"brow_up": 0.6, "open": 0.45, "squint": 0.5}],
            [3.3, {"brow_up": 0.3, "open": 0.1, "squint": 0.0}],
            [3.65, {"brow_up": 0.5, "smile": 0.0}],
            [3.95, {"brow_up": 1.0, "open": 0.7}],
            [6.7, {"brow_up": 0.9, "open": 0.5}],
            [7.05, {"brow_up": 0.4, "open": 0.0, "brow_angry": 0.2}],
            [7.5, {"brow_angry": 0.8, "smile": 0.25, "squint": 0.2}],
            [8.2, {"brow_angry": 0.9, "smile": 0.3}],
            [l_to + 0.1, {"smile": 1.0, "open": 0.7, "squint": 0.6}],
            [l_im - 0.15, {"smile": 0.4, "open": 0.2, "squint": 1.0}],
            [l_im + 0.2, {}],
        ],
    }
    # ---- the friends ----------------------------------------------------
    # the reindeer (the dare) and the elf (the towel: the one who beckoned)
    d_run = T_RUN + 0.1
    e_run = T_RUN + 0.17
    seg_d, fx_d, d_to, d_im = leap(X_DEER, 19.05, d_run, [[0.0, 0.0], [0.25, 3.3], [0.9, 5.1]], TAKEOFF_Z + 0.05, 1.15, line=LINE_Z - 0.3)
    seg_e, fx_e, e_to, e_im = leap(X_ELF, 19.25, e_run, [[0.0, 0.0], [0.25, 3.2], [0.9, 5.0]], TAKEOFF_Z + 0.1, 1.1, line=LINE_Z - 0.3)
    A["deer_im"], A["elf_im"] = d_im, e_im
    friends = []
    for fid, look, x, seg, fxj, t_im, swim_from, swim_to, t_up, extra in [
        ("deer", DEER, X_DEER, seg_d, fx_d, d_im, [0.3, 25.6], [0.35, 27.5], 11.7, {}),
        ("elf", ELF, X_ELF, seg_e, fx_e, e_im, [-1.3, 25.4], [-0.95, 27.55], 11.85, {"towel": TOWEL}),
    ]:
        sw = [swim_from, swim_to]
        t_cl = t_up + Route(sw).length / 2.5
        t_rm = t_cl + 0.45
        t_dn = t_rm + 0.28
        hx = 0.55 if fid == "elf" else 1.25
        hp = [[swim_to[0], 29.45], [hx * 0.7, 33.5], [hx, 38.0], [hx, 46.0], [hx - 0.6, 80.0], [0.0, 99.5]]
        A[fid + "_down"] = t_dn
        a = {
            "id": fid, "role": "runner", "look": look,
            "segs": [
                {"mode": "hold", "t0": -9.0, "pos": [x, 0.0, LINE_Z - 0.3], "yaw": PI + (0.12 if fid == "elf" else -0.05)},
                seg,
                {"mode": "splash", "t0": t_im, "pos": [x, WATER_Y, seg["pts"][1][1] - 2.0], "yaw": PI, "len": 1.5},
                {"mode": "route", "t0": t_up, "pts": sw, "speed": [[0.0, 2.5]], "y": SWIM_Y},
                {"mode": "route", "t0": t_cl, "pts": [swim_to, [swim_to[0], 28.3]], "speed": [[0.0, 1.6]], "y": SWIM_Y},
                {"mode": "route", "t0": t_rm, "pts": [[swim_to[0], 28.3], [swim_to[0], 29.45]], "speed": [[0.0, 4.0]], "y": RIM_Y},
                {"mode": "route", "t0": t_dn, "pts": hp, "speed": [[0.0, 2.6], [0.45, 6.2], [1.0, 6.9]]},
            ],
            "fx": [
                {"type": "spotted", "t": 3.92, "dur": 2.6},
                fxj,
                {"type": "burst", "t": t_im, "pos": [x, WATER_Y, seg["pts"][1][1] - 2.0], "size": 0.8},
                {"type": "resurface", "t": t_up},
                {"type": "jump", "t": t_cl, "dur": 0.45, "h": 0.28, "dy": RIM_Y - SWIM_Y},
                {"type": "jump", "t": t_rm, "dur": 0.28, "h": 0.1, "dy": -RIM_Y},
            ],
            "hide": [[t_im + 1.47, t_up]],
            "wet": [[t_im, 99.0]],
        }
        a.update(extra)
        if fid == "deer":
            # set to jump: weight forward, bouncing on the toes; catches the
            # lead's eye with a grin and a raised brow (the dare)
            a["pose"] = [
                [-1.0, {"spine": [-8, 0, 0], "head": [4, 0, 0]}],
                [3.35, {"spine": [-8, 0, 0], "head": [4, 0, 0]}],
                [3.55, {"spine": [-6, -14, 0], "head": [0, -34, 6]}],
                [3.86, {"spine": [-6, -14, 0], "head": [2, -30, 8]}],
                [4.2, {"head": [4, -40, 0], "neck": [0, -10, 0]}],
                [6.7, {"head": [4, -55, 0], "neck": [0, -12, 0]}],
                [7.4, {"head": [0, -20, 0]}],
                [7.9, {"spine": [-8, 0, 0]}],
                [8.4, {}],
            ]
            a["face"] = [[-1.0, {"smile": 0.5}], [3.4, {"smile": 0.6}], [3.6, {"smile": 1.0, "squint": 0.55, "brow_up": 0.9}],
                         [3.9, {"smile": 0.0, "brow_up": 1.0, "open": 0.65}], [6.6, {"brow_up": 0.9, "open": 0.4}], [7.6, {"brow_angry": 0.6}], [8.4, {}]]
        else:
            a["pose"] = [
                [-1.0, {"spine": [-6, 0, 0]}],
                [3.9, {"spine": [-6, 0, 0]}],
                [4.2, {"head": [4, -40, 0], "neck": [0, -10, 0]}],
                [6.7, {"head": [4, -52, 0], "neck": [0, -12, 0]}],
                [7.5, {"head": [0, 30, 0]}],
                [8.4, {}],
            ]
            a["face"] = [[-1.0, {"smile": 0.6}], [3.9, {"smile": 0.0, "brow_up": 1.0, "open": 0.7}], [6.6, {"brow_up": 0.8, "open": 0.4}], [8.4, {}]]
        friends.append(a)
    # ---- the cart and the officer -------------------------------------------
    cart_pts = [[-34.0, 22.3], [-16.0, 22.3], [-12.4, 21.0], [-10.6, 17.6], [-8.6, 14.3], [-5.4, 12.35],
                [-0.2, 10.75], [5.6, 11.85], [9.9, 15.5], [11.4, 21.6], [10.1, 27.7], [6.6, 32.3], [2.9, 35.3], [0.3, 37.6], [-1.15, 40.3], [-1.3, 43.0]]
    cr = Route(cart_pts)
    s_stop1 = cr.s_at_z(12.35) if False else None
    # arc length at the first stop: nearest dense point to (-5.4, 12.35)
    def s_near(p):
        best = min(range(len(cr.pts)), key=lambda i: math.dist(cr.pts[i], p))
        return cr.cum[best]
    s1 = s_near([-5.4, 12.35])
    s2 = s_near([-1.27, 41.2])
    s_bend = s_near([-10.6, 17.6])
    # stage 1: arrive at the bend at tau 3.55 (the beams find them at 3.9), stop at 6.05
    t_bend, t_stop1 = 3.55, 6.05
    v_fast, v_bend = 7.6, 3.4
    # keys relative to t0 = -6: cruise, slow into the bend, roll to a stop
    t0c = -6.0
    # distance cruise + decel to the bend
    k = [[0.0, v_fast]]
    tb = t_bend - t0c
    d_dec = 1.2   # seconds of slowing into the bend
    d_before = v_fast * (tb - d_dec) + (v_fast + v_bend) * 0.5 * d_dec
    s0 = s_bend - d_before
    k += [[tb - d_dec, v_fast], [tb, v_bend]]
    # bend to stop1: v_bend then decelerate to 0 at t_stop1
    rem = s1 - s_bend
    ts = t_stop1 - t0c
    # v_bend for a while, then linear to 0: v*(t1-tb) + v*(ts-t1)/2 = rem
    t1 = (rem - v_bend * (ts - tb) / 2) / (v_bend / 2) + tb
    t1 = max(tb, min(ts - 0.4, (2 * rem / v_bend) - (ts - tb) + tb))
    # solve exactly: v_bend*(t1-tb) + v_bend*(ts-t1)/2 = rem  ->  t1 = 2*rem/v_bend - ts + 2*tb ... (rearranged)
    t1 = (2 * rem / v_bend) - ts + 2 * tb
    t1 = max(tb, min(ts - 0.3, t1))
    k += [[t1, v_bend], [ts, 0.0]]
    # stage 2: away again at tau 8.75, round the far side, stop at s2 by t_stop2
    t_go = 7.6 - t0c
    t_stop2 = A["l_down"] + 0.2 - t0c
    rem2 = s2 - s_near_end if False else None
    # recompute where the cart actually is at ts (keys so far)
    s_at_ts = s0 + dist(k, ts)
    rem2 = s2 - s_at_ts
    acc = 1.6
    span = t_stop2 - t_go
    # trapezoid: accel acc s, cruise, decel 1.4 s: v*(span - (acc+1.4)/2) = rem2
    dec = 1.5
    vmax = rem2 / (span - (acc + dec) / 2)
    k += [[t_go, 0.0], [t_go + acc, vmax], [t_stop2 - dec, vmax], [t_stop2, 0.0]]
    A["cart_vmax"] = vmax
    A["cart_stop2"] = t_stop2 + t0c
    s_end = s0 + dist(k, t_stop2 + 1)
    A["cart_end"] = cr.at(s_end - s0 + s0) if False else cr.at(s_end)
    t_click = A["l_down"] - 0.1 + 2.6 + 2.3     # the officer shot starts at l_down+2.5 (0:24.6): the click at 0:26.9
    A["t_click"] = t_click
    cart = {"id": "cart", "index": 0, "pts": cart_pts, "t0": t0c, "s0": s0, "speed": k,
            "headlights": [[-20.0, 1.0], [t_click, 1.0], [t_click + 0.05, 0.0]],
            "beacon": [[-20.0, 1.0], [t_click, 1.0], [t_click + 0.04, 0.0]],
            "hl_opts": {"energy": 16.0, "range": 28.0, "angle": 26.0, "tilt": 6.0, "beam_len": 11.0, "beam_radius": 2.2, "beam_glow": 0.2, "glare": 0.7}}
    officer = {
        "id": "officer", "role": "watch", "look": WATCH,
        "segs": [{"mode": "cart", "t0": -20.0, "cart": "cart"}],
        "pose": [
            [-20.0, {}],
            # peering at them from the bend
            [5.9, {"head": [-4, 0, 0], "spine": [-6, 0, 0]}],
            [8.6, {"head": [-4, 0, 0], "spine": [-6, 0, 0]}],
            [9.2, {}],
            # at the exit: watches them go past and down the path
            [A["l_down"] + 1.2, {"head": [0, -6, 0]}],
            [A["l_down"] + 2.1, {"head": [-2, -38, 0], "neck": [0, -12, 0]}],
            [A["l_down"] + 2.9, {"head": [-4, -16, 0], "neck": [0, -6, 0]}],
            [t_click - 1.15, {"head": [-4, -10, 0], "neck": [0, -4, 0]}],
            # a breath: hand off the wheel, to the dash switch
            [t_click - 0.75, {"head": [-4, -10, 0], "neck": [0, -4, 0], "upper_arm.R": [-12, 0, 8], "forearm.R": [-25, 0, 0], "spine": [4, 0, 0]}],
            [t_click - 0.25, {"head": [-8, -6, 0], "upper_arm.R": [6, 0, -6], "forearm.R": [-10, 0, 0], "hand.R": [-20, 0, 0], "spine": [-3, 0, 0]}],
            [t_click + 0.05, {"head": [-8, -6, 0], "upper_arm.R": [4, 0, -6], "forearm.R": [-6, 0, 0], "hand.R": [-35, 0, 0], "spine": [-3, 0, 0]}, "snap"],
            [t_click + 0.6, {"head": [-2, -8, 0], "upper_arm.R": [-14, 0, 10], "forearm.R": [-30, 0, 0], "spine": [6, 0, 0]}],
            [t_click + 2.5, {"head": [2, -4, 0], "upper_arm.R": [-14, 0, 10], "forearm.R": [-30, 0, 0], "spine": [8, 0, 0]}],
        ],
        "face": [[-20.0, {"brow_flat": 0.0}], [5.9, {"brow_angry": 0.5, "squint": 0.3}], [9.5, {"brow_angry": 0.3}],
                 [A["l_down"] + 1.5, {"brow_angry": 0.0, "brow_up": 0.3}], [t_click - 1.0, {"smile": 0.35, "squint": 0.35}],
                 [t_click + 0.4, {"smile": 0.55, "squint": 0.55, "brow_up": 0.2}], [t_click + 2.5, {"smile": 0.5, "squint": 0.5}]],
    }
    A["cart_route"] = cr
    A["cart_s0"] = s0
    actors = [lead] + friends + [officer]
    return actors, [cart], A


# ===================================================================== DORM
# Puddlesworth front door: opening x -1.6..1.6, wall z 103.0 (out) .. 103.5 (in)
DOOR_OUT = [
    # the lead eases the right leaf open, slips out; it drifts shut (soft latch)
    [0.0, 0.0], [0.42, 0.0], [1.35, 72.0, "inout"], [3.75, 72.0], [4.45, 4.0, "inout"], [4.58, 0.0, "in"],
]
D_RET = 8.05     # T = delta + D_RET for the return
LATCH = 21.95    # delta of the firm latch (T 30.0)
DOOR_RET = [
    [18.0, 0.0], [19.85, 0.0], [20.35, 74.0, "out"], [21.5, 74.0], [LATCH - 0.03, 0.0, "in"], [LATCH + 0.03, 2.0, "out"], [LATCH + 0.09, 0.0, "in"],
]


def dorm_plan():
    # departure: the lead inside at the right leaf, the friends on the porch
    lead = {
        "id": "lead", "role": "runner", "look": LEAD,
        "segs": [
            {"mode": "hold", "t0": -9.0, "pos": [1.05, 0.0, 103.95], "yaw": 0.0},
            {"mode": "route", "t0": 2.72, "pts": [[1.05, 103.95], [0.55, 103.1], [0.3, 101.6], [-0.2, 99.0]], "speed": [[0.0, 0.6], [0.25, 1.9], [1.2, 2.6]]},
            # the return: through the door, then to the rug
            {"mode": "route", "t0": 20.55, "pts": [[0.5, 96.5], [0.55, 101.5], [0.5, 103.4], [0.45, 104.9]], "s0": 0.0,
             "speed": [[0.0, 6.2], [0.55, 6.2], [0.75, 2.2], [0.95, 0.0]]},
            {"mode": "route", "t0": 23.9, "pts": [[0.45, 104.85], [0.4, 105.9], [0.35, 106.95]], "speed": [[0.0, 0.0], [0.3, 1.3], [1.1, 1.3], [1.45, 0.0]]},
            {"mode": "hold", "t0": 25.35, "pos": [0.35, 0.0, 106.95], "yaw": PI},
        ],
        "fx": [
            # glances back at the quiet room over the left shoulder
            {"type": "turn", "t": 1.72, "dur": 0.38, "yaw": -1.35, "until": 2.55},
            {"type": "turn", "t": 2.55, "dur": 0.25, "yaw": 0.0, "until": 2.8},
            # back home: face the room
            {"type": "turn", "t": 24.95, "dur": 0.45, "yaw": PI, "until": 99.0},
        ],
        "pose": [
            [-9.0, {}],
            [0.12, {}],
            # right hand to the push plate, easing it open
            [0.45, {"upper_arm.R": [72, 0, -22], "forearm.R": [12, 0, 0], "spine": [-4, 0, 0], "head": [-4, 0, 0]}],
            [1.15, {"upper_arm.R": [84, 0, -26], "forearm.R": [4, 0, 0], "spine": [-7, 0, 0], "head": [0, 0, 0]}],
            [1.45, {"upper_arm.R": [20, 0, -6], "forearm.R": [30, 0, 0]}],
            [1.7, {}],
            [1.95, {"head": [0, -55, 0], "neck": [0, -15, 0]}],
            [2.5, {"head": [0, -55, 0], "neck": [0, -15, 0]}],
            [2.75, {"spine": [-8, 0, 0]}],
            [3.4, {"spine": [-8, 0, 0]}],
            [4.0, {}],
            # the return: catches the door edge on the way in, then breathes
            [20.6, {}],
            [20.95, {"upper_arm.L": [70, 0, 30], "forearm.L": [10, 0, 0]}],
            [21.25, {"upper_arm.L": [30, 0, 10]}],
            [21.6, {"spine": [-14, 0, 0], "head": [-8, 0, 0]}],
            [22.0, {"spine": [-18, 0, 0], "head": [-10, 0, 0], "upper_arm.L": [10, 0, -10], "upper_arm.R": [10, 0, 10]}],
            [22.45, {"spine": [-12, 0, 0], "head": [-4, 25, 0]}],          # listens toward the door
            [23.35, {"spine": [-10, 0, 0], "head": [-4, 30, 0]}],
            [23.8, {"spine": [-2, 0, 0], "head": [0, 0, 0]}],
            # innocent: straight up, hands behind the back
            [25.4, {"upper_arm.L": [-24, 0, 8], "upper_arm.R": [-24, 0, -8], "forearm.L": [-20, 0, 0], "forearm.R": [-20, 0, 0], "spine": [4, 0, 0], "head": [4, 0, 0]}],
            [26.9, {"upper_arm.L": [-24, 0, 8], "upper_arm.R": [-24, 0, -8], "forearm.L": [-20, 0, 0], "forearm.R": [-20, 0, 0], "spine": [4, 0, 0], "head": [6, 4, 0]}],
            # the weight shift (the squeak)
            [27.08, {"upper_arm.L": [-24, 0, 8], "upper_arm.R": [-24, 0, -8], "forearm.L": [-20, 0, 0], "forearm.R": [-20, 0, 0], "spine": [4, 0, 0],
                     "hips": [0, 0, 5], "thigh.R": [6, 0, 0], "head": [6, 4, 0]}],
            [27.3, {"upper_arm.L": [-24, 0, 8], "upper_arm.R": [-24, 0, -8], "forearm.L": [-20, 0, 0], "forearm.R": [-20, 0, 0], "spine": [4, 0, 0],
                    "hips": [0, 0, 3], "head": [8, 6, 0]}],
            [28.5, {"upper_arm.L": [-24, 0, 8], "upper_arm.R": [-24, 0, -8], "forearm.L": [-20, 0, 0], "forearm.R": [-20, 0, 0], "spine": [4, 0, 0],
                    "hips": [0, 0, 3], "head": [8, 6, 0]}],
        ],
        "face": [
            [-9.0, {"smile": 0.2}],
            [1.9, {"smile": 0.2}],
            [2.15, {"smile": 1.0, "squint": 0.45, "brow_up": 0.35}],
            [2.75, {"smile": 0.8, "squint": 0.3}],
            [20.6, {"smile": 0.6, "open": 0.6, "squint": 0.6}],
            [22.0, {"open": 0.75, "squint": 0.5, "smile": 0.4}],
            [23.4, {"open": 0.3, "brow_up": 0.5}],
            [25.4, {"smile": 0.55, "brow_up": 0.75, "squint": 0.0}],
            [26.95, {"smile": 0.55, "brow_up": 0.75}],
            [27.1, {"smile": 0.45, "brow_up": 1.0, "open": 0.1}],
            [28.5, {"smile": 0.45, "brow_up": 1.0, "open": 0.1}],
        ],
        "wet": [[19.0, 99.0]],
    }
    elf = {
        "id": "elf", "role": "runner", "look": ELF, "towel": TOWEL,
        "segs": [
            {"mode": "hold", "t0": -9.0, "pos": [-0.1, 0.0, 100.75], "yaw": -2.85},
            {"mode": "route", "t0": 3.25, "pts": [[-0.05, 100.95], [-0.6, 99.6], [-0.8, 96.0]], "speed": [[0.0, 0.0], [0.3, 1.8]]},
            # the return: first at the door, pulls the right leaf open and holds it
            {"mode": "route", "t0": 19.0, "pts": [[0.6, 90.0], [1.3, 98.5], [1.75, 101.05]], "speed": [[0.0, 6.4], [0.62, 6.4], [0.95, 0.0]]},
            {"mode": "hold", "t0": 19.95, "pos": [1.75, 0.0, 101.05], "yaw": 2.6},
            {"mode": "route", "t0": 21.22, "pts": [[1.75, 101.05], [0.95, 102.2], [0.35, 103.6], [-0.85, 104.4]], "speed": [[0.0, 1.0], [0.2, 4.0], [0.6, 2.5], [0.85, 0.0]]},
            {"mode": "route", "t0": 23.9, "pts": [[-0.85, 104.4], [-0.9, 105.6], [-0.85, 106.75]], "speed": [[0.0, 0.0], [0.3, 1.25], [1.2, 1.25], [1.55, 0.0]]},
            {"mode": "hold", "t0": 25.45, "pos": [-0.85, 0.0, 106.75], "yaw": PI + 0.15},
        ],
        "fx": [
            {"type": "turn", "t": 25.0, "dur": 0.45, "yaw": PI + 0.15, "until": 99.0},
        ],
        "pose": [
            [-9.0, {}],
            [0.75, {}],
            # beckons: arm up, crooking the hand, twice
            [1.0, {"upper_arm.R": [66, 0, 18], "forearm.R": [55, 0, 0], "head": [0, -8, 6]}],
            [1.2, {"upper_arm.R": [66, 0, 18], "forearm.R": [105, 0, 0], "hand.R": [30, 0, 0], "head": [0, -8, 6]}],
            [1.4, {"upper_arm.R": [66, 0, 18], "forearm.R": [55, 0, 0], "head": [0, -8, 6]}],
            [1.6, {"upper_arm.R": [66, 0, 18], "forearm.R": [105, 0, 0], "hand.R": [30, 0, 0], "head": [0, -8, 6]}],
            [1.85, {"upper_arm.R": [60, 0, 16], "forearm.R": [60, 0, 0]}],
            [2.2, {}],
            # the return: holding the door, waving them in
            [19.9, {}],
            [20.3, {"upper_arm.L": [70, 0, 20], "forearm.L": [10, 0, 0], "head": [0, 20, 0]}],
            [20.6, {"upper_arm.L": [70, 0, 20], "forearm.L": [10, 0, 0], "upper_arm.R": [50, 0, -30], "forearm.R": [60, 0, 0], "head": [0, 35, 0]}],
            [21.0, {"upper_arm.L": [70, 0, 20], "forearm.L": [10, 0, 0], "upper_arm.R": [40, 0, -20], "forearm.R": [90, 0, 0], "head": [0, -25, 0]}],
            [21.3, {}],
            [22.0, {"spine": [-14, 0, 0], "head": [-6, 0, 0]}],
            [22.45, {"spine": [-10, 0, 0], "head": [-4, -30, 0]}],
            [23.35, {"spine": [-8, 0, 0], "head": [-4, -34, 0]}],
            [23.8, {}],
            [25.5, {"upper_arm.L": [-20, 0, 8], "upper_arm.R": [-20, 0, -8], "forearm.L": [-15, 0, 0], "forearm.R": [-15, 0, 0], "spine": [3, 0, 0]}],
            [27.12, {"upper_arm.L": [-20, 0, 8], "upper_arm.R": [-20, 0, -8], "forearm.L": [-15, 0, 0], "forearm.R": [-15, 0, 0], "spine": [3, 0, 0]}],
            # slowly looks down at the lead's slipper
            [27.65, {"upper_arm.L": [-20, 0, 8], "upper_arm.R": [-20, 0, -8], "forearm.L": [-15, 0, 0], "forearm.R": [-15, 0, 0], "spine": [-4, 0, 0],
                    "head": [-38, 40, 0], "neck": [-12, 12, 0]}],
            [28.5, {"upper_arm.L": [-20, 0, 8], "upper_arm.R": [-20, 0, -8], "forearm.L": [-15, 0, 0], "forearm.R": [-15, 0, 0], "spine": [-5, 0, 0],
                    "head": [-40, 42, 0], "neck": [-12, 12, 0]}],
        ],
        "face": [
            [-9.0, {"smile": 0.85, "squint": 0.4}],
            [2.3, {"smile": 0.9, "squint": 0.5}],
            [19.5, {"smile": 0.7, "open": 0.5}],
            [22.0, {"open": 0.7, "squint": 0.5, "smile": 0.3}],
            [23.4, {"open": 0.2, "brow_up": 0.4}],
            [25.5, {"smile": 0.6, "brow_up": 0.6, "open": 0.0}],
            [27.1, {"smile": 0.6, "brow_up": 0.6}],
            [27.5, {"smile": 0.0, "brow_up": 0.2, "squint": 0.6, "brow_flat": 0.6}],
            [28.5, {"smile": 0.0, "brow_up": 0.2, "squint": 0.65, "brow_flat": 0.7}],
        ],
        "wet": [[19.0, 99.0]],
    }
    deer = {
        "id": "deer", "role": "runner", "look": DEER,
        "segs": [
            {"mode": "hold", "t0": -9.0, "pos": [-0.5, 0.0, 99.25], "yaw": -2.75},
            {"mode": "route", "t0": 3.1, "pts": [[-0.75, 99.65], [-0.9, 98.4], [-0.6, 96.0]], "speed": [[0.0, 0.0], [0.3, 1.9]]},
            {"mode": "route", "t0": 19.7, "pts": [[-0.6, 92.0], [0.2, 99.0], [0.35, 103.3], [1.2, 105.2]], "speed": [[0.0, 6.3], [1.25, 6.3], [1.55, 2.0], [1.8, 0.0]]},
            {"mode": "route", "t0": 23.95, "pts": [[1.2, 105.2], [1.5, 106.0], [1.55, 106.8]], "speed": [[0.0, 0.0], [0.3, 1.1], [1.0, 1.1], [1.3, 0.0]]},
            {"mode": "hold", "t0": 25.3, "pos": [1.55, 0.0, 106.8], "yaw": PI - 0.15},
        ],
        "fx": [{"type": "turn", "t": 24.9, "dur": 0.45, "yaw": PI - 0.15, "until": 99.0}],
        "pose": [
            [-9.0, {}],
            [0.5, {"spine": [-6, 0, 0], "shoulder.L": [0, 0, 8], "shoulder.R": [0, 0, -8]}],
            [0.9, {"spine": [-6, 0, 0], "shoulder.L": [0, 0, 2], "shoulder.R": [0, 0, -2]}],
            [1.3, {"spine": [-6, 0, 0], "shoulder.L": [0, 0, 8], "shoulder.R": [0, 0, -8]}],
            [1.7, {"spine": [-6, 0, 0], "shoulder.L": [0, 0, 2], "shoulder.R": [0, 0, -2]}],
            [2.1, {"spine": [-6, 0, 0], "shoulder.L": [0, 0, 8], "shoulder.R": [0, 0, -8]}],
            [2.6, {}],
            [21.6, {}],
            [22.0, {"spine": [-16, 0, 0], "head": [-6, 0, 0]}],
            [22.45, {"spine": [-10, 0, 0], "head": [-4, 30, 0]}],
            [23.35, {"spine": [-8, 0, 0], "head": [-4, 34, 0]}],
            [23.8, {}],
            [25.4, {"upper_arm.L": [-22, 0, 8], "upper_arm.R": [-22, 0, -8], "forearm.L": [-18, 0, 0], "forearm.R": [-18, 0, 0], "spine": [4, 0, 0], "head": [4, 0, 0]}],
            [28.5, {"upper_arm.L": [-22, 0, 8], "upper_arm.R": [-22, 0, -8], "forearm.L": [-18, 0, 0], "forearm.R": [-18, 0, 0], "spine": [4, 0, 0], "head": [6, -6, 0]}],
        ],
        "face": [
            [-9.0, {"smile": 0.8, "squint": 0.3}],
            [19.5, {"smile": 0.8, "open": 0.6}],
            [22.0, {"open": 0.75, "squint": 0.5, "smile": 0.5}],
            [23.4, {"open": 0.2, "brow_up": 0.4}],
            [25.4, {"smile": 0.7, "brow_up": 0.8, "squint": 0.2}],
            [28.5, {"smile": 0.7, "brow_up": 0.8, "squint": 0.2}],
        ],
        "wet": [[19.0, 99.0]],
    }
    return [lead, elf, deer]


# ============================================================== THE SHOTS
def build():
    f_actors, f_carts, A = fountain_plan()
    d_actors = dorm_plan()
    lead_im = A["lead_im"]
    common_campus = {"world": "campus", "trees": [[-13.0, 52.0, 3.4, 0.4]], "active_waters": []}
    room_opts = {}
    dorm_common = dict(common_campus)
    dorm_common.update({"xmas_room": True, "room_opts": room_opts, "doors": {"R": None}, "actors": d_actors,
                        "snow_clip": [-22.0, -2.0, 103.05, 22.0, 6.0, 113.0]})
    dorm_lights = [
        {"type": "omni", "pos": [-1.5, 2.9, 108.6], "color": [1.0, 0.78, 0.55], "energy": 1.1, "range": 9.0, "atten": 1.2},
        {"type": "omni", "pos": [-3.2, 1.0, 104.4], "color": [1.0, 0.7, 0.45], "energy": 0.9, "range": 4.0},
        # porch lantern spill on the friends outside
        {"type": "omni", "pos": [0.0, 2.9, 102.2], "color": [1.0, 0.82, 0.6], "energy": 1.6, "range": 5.0},
    ]
    shots = {}
    edl = []

    def add(sid, T0, T1, shot):
        shot = copy.deepcopy(shot)
        shot["dur"] = round(T1 - T0, 4)
        shots[sid] = shot
        edl.append([sid, round(T0, 4), round(T1 - T0, 4)])

    # ---- 0:00-0:04 the dorm: the door eases open, a beckon, a glance back, out
    s1 = dict(dorm_common)
    s1["doors"] = {"R": DOOR_OUT}
    s1["tau0"] = 0.0
    s1["lights"] = dorm_lights
    s1["exposure"] = 0.92
    s1["cam"] = [
        {"t": 0.0, "pos": [1.55, 1.42, 110.7], "at": [0.2, 1.28, 103.2], "fov": 44.0},
        {"t": 2.4, "pos": [1.45, 1.3, 109.5], "at": [0.25, 1.15, 103.2], "fov": 42.0},
        {"t": 4.0, "pos": [1.25, 0.95, 107.6], "at": [0.35, 0.55, 102.6], "fov": 38.0, "ease": "in"},
    ]
    add("s01_dorm_out", 0.0, 4.0, s1)

    fountain = dict(common_campus)
    fountain.update({"actors": f_actors, "carts": f_carts})
    # ---- 0:04-0:04.6 the slipper lands on the rim (match cut)
    s2 = dict(fountain)
    s2["tau0"] = 4.0 - FT
    s2["cam"] = [
        {"t": 0.0, "pos": [TEST_X + 0.12, 0.92, 14.35], "at": [TEST_X, 0.58, 16.1], "fov": 36.0},
        {"t": 0.6, "pos": [TEST_X + 0.1, 0.9, 14.5], "at": [TEST_X, 0.6, 16.2], "fov": 35.0},
    ]
    add("s02_rim_foot", 4.0, 4.6, s2)
    # ---- 0:04.6-0:08 from the water: the toe test, the recoil, the dare, the light
    s3 = dict(fountain)
    s3["tau0"] = 4.6 - FT
    s3["cam"] = [
        {"t": 0.0, "pos": [3.35, 0.8, 18.35], "at": [0.55, 0.75, 14.6], "fov": 40.0},
        {"t": 1.3, "pos": [3.3, 0.85, 18.3], "at": [0.6, 0.8, 13.9], "fov": 41.0},
        {"t": 3.4, "pos": [3.0, 1.0, 18.1], "at": [0.4, 1.0, 10.6], "fov": 44.0},
    ]
    add("s03_rim_test", 4.6, 8.0, s3)
    # ---- 0:08-0:09.6 frozen in the light
    s4 = dict(fountain)
    s4["tau0"] = 8.0 - FT
    s4["cam"] = [
        {"t": 0.0, "pos": [2.9, 1.25, 14.0], "at": [0.1, 1.1, 10.0], "fov": 36.0},
        {"t": 1.6, "pos": [2.7, 1.22, 13.6], "at": [0.1, 1.1, 10.0], "fov": 34.0},
    ]
    add("s04_freeze", 8.0, 9.6, s4)
    # ---- 0:09.6-0:10.9 the eyeline: the cart rounds the bend
    s5 = dict(fountain)
    s5["tau0"] = 9.6 - FT
    s5["cam"] = [
        {"t": 0.0, "pos": [-2.35, 1.4, 8.55], "at": {"rel": "cart", "off": [0, 1.0, 0]}, "fov": 32.0},
        {"t": 1.3, "pos": [-2.4, 1.4, 8.65], "at": {"rel": "cart", "off": [0, 1.0, 0]}, "fov": 30.0},
    ]
    add("s05_cart", 9.6, 10.9, s5)
    # ---- 0:10.9-0:12 back on the lead: officer, water, a tiny nod, the first step
    s6 = dict(fountain)
    s6["tau0"] = 10.9 - FT
    s6["cam"] = [
        {"t": 0.0, "pos": [3.0, 1.15, 12.1], "at": [X_LEAD, 1.15, LINE_Z], "fov": 30.0},
        {"t": 1.1, "pos": [2.95, 1.12, 12.0], "at": [X_LEAD, 1.1, LINE_Z + 0.2], "fov": 30.0},
    ]
    add("s06_nod", 10.9, 12.0, s6)
    # ---- 0:12-0:13 wide: three runners, the water ahead, the cart behind them
    s7 = dict(fountain)
    s7["tau0"] = 12.0 - FT
    s7["cam"] = [
        {"t": 0.0, "pos": [11.0, 2.2, 9.4], "at": [-0.6, 0.7, 13.0], "fov": 42.0},
        {"t": 1.0, "pos": [10.9, 2.15, 9.7], "at": [-0.4, 0.7, 13.8], "fov": 41.0},
    ]
    add("s07_wide", 12.0, S8_T, s7)
    # ---- 0:13-0:20.6 track alongside, takeoff, the flight in slow motion, impact at 0:20
    s8 = dict(fountain)
    tau0_8 = S8_T - FT
    # speed keys (output seconds in the shot): real time for the last strides,
    # into slow motion before the takeoff, through the flight, back up a
    # little for the impact; the last segment's rate is solved so the lead's
    # impact lands at exactly 0:20.
    base = [[0.0, 1.0], [0.3, 0.8], [0.62, 0.55]]
    t_imp = 20.0 - S8_T
    def mk(x):
        return base + [[1.05, x], [t_imp - 0.12, x], [t_imp + 0.06, 0.5], [t_imp + 0.6, 0.7]]
    def solve():
        lo, hi = 0.03, 0.6
        for _ in range(60):
            mid = (lo + hi) / 2
            if tau_at(t_imp, mk(mid), tau0_8) < lead_im:
                lo = mid
            else:
                hi = mid
        return mk(hi)
    sp8 = solve()
    A["s8_speed"] = sp8
    A["s8_takeoff_T"] = None
    for i in range(0, 760):
        t = i / 100
        if tau_at(t, sp8, tau0_8) >= A["lead_to"]:
            A["s8_takeoff_T"] = S8_T + t
            break
    s8["tau0"] = tau0_8
    s8["speed"] = sp8
    lt = A["s8_takeoff_T"] - S8_T
    s8["cam"] = [
        {"t": 0.0, "pos": {"rel": "lead", "off": [-2.7, 0.8, 0.9], "yaw_fixed": 180.0}, "at": {"rel": "lead", "off": [0.0, 0.85, -1.3], "yaw_fixed": 180.0}, "fov": 46.0},
        {"t": lt - 0.15, "pos": {"rel": "lead", "off": [-2.3, 0.75, -0.2], "yaw_fixed": 180.0}, "at": {"rel": "lead", "off": [0.0, 0.95, -1.0], "yaw_fixed": 180.0}, "fov": 44.0},
        {"t": lt + 1.6, "pos": {"rel": "lead", "off": [-2.2, 0.9, -1.9], "yaw_fixed": 180.0}, "at": {"rel": "lead", "off": [0.0, 0.85, 0.0], "yaw_fixed": 180.0}, "fov": 42.0, "roll": 3.0},
        {"t": t_imp - 1.4, "pos": {"rel": "lead", "off": [-2.0, 0.3, -2.0], "yaw_fixed": 180.0, "base_y": 0.0}, "at": {"rel": "lead", "off": [0.0, 0.9, 0.0], "yaw_fixed": 180.0}, "fov": 46.0, "roll": 1.0},
        {"t": t_imp, "pos": [X_LEAD + 2.05, 0.55, 20.75], "at": [X_LEAD, 0.65, 19.45], "fov": 50.0},
        {"t": t_imp + 0.6, "pos": [X_LEAD + 1.75, 0.4, 20.45], "at": [X_LEAD, 0.7, 19.45], "fov": 54.0, "ease": "out"},
    ]
    s8["kicks"] = [[t_imp, 1.4]]
    add("s08_leap", S8_T, 20.6, s8)
    # ---- 0:20.6-0:22 surfacing: the blue cap, the friends scrambling out ahead
    s11 = dict(fountain)
    s11["tau0"] = A["l_surf"] - 0.28
    s11["cam"] = [
        {"t": 0.0, "pos": [0.05, 0.45, 24.45], "at": [1.15, 0.8, 30.0], "fov": 50.0, "roll": -2.0},
        {"t": 1.4, "pos": [0.1, 0.5, 24.7], "at": [1.0, 0.9, 30.5], "fov": 50.0, "roll": 0.0},
    ]
    s11["shake"] = 0.25
    add("s11_surface", 20.6, 22.0, s11)
    # ---- 0:22-0:24.6 the game's own camera: behind the lead, along the arrows
    s12 = dict(fountain)
    s12["tau0"] = A["l_down"] - 0.1
    s12["arrows"] = [{"pts": [[0.95, 30.0], [1.0, 33.5], [0.8, 38.0], [0.65, 50.0], [0.1, 80.0], [-0.3, 101.0]], "w": 1.3, "energy": 1.0}]
    gp = {"rel": "lead", "off": [0.0, 3.5, 5.9], "yaw_fixed": 180.0, "base_y": 0.0}
    ga = {"rel": "lead", "off": [0.0, 1.55, -1.5], "yaw_fixed": 180.0, "base_y": 0.0}
    s12["cam"] = [{"t": 0.0, "pos": gp, "at": ga, "fov": 62.0}, {"t": 2.6, "pos": gp, "at": ga, "fov": 62.0}]
    add("s12_follow", 22.0, 24.6, s12)
    # ---- 0:24.6-0:28.5 the officer: watches them go, hand off the wheel, lights off
    s13 = dict(fountain)
    s13["tau0"] = A["l_down"] - 0.1 + 2.6
    s13["arrows"] = s12["arrows"]
    s13["cam"] = [
        {"t": 0.0, "pos": [4.4, 1.28, 39.0], "at": [-1.3, 1.2, 42.2], "fov": 28.0},
        {"t": 3.9, "pos": [4.35, 1.28, 39.05], "at": [-1.3, 1.2, 42.2], "fov": 27.5},
    ]
    s13["lights"] = [{"type": "omni", "follow": {"rel": "officer", "off": [-0.2, 1.75, -1.1]}, "color": [0.8, 0.88, 1.0], "energy": 2.6, "range": 2.4},
                     {"type": "omni", "follow": {"rel": "officer", "off": [-1.2, 1.4, 0.4]}, "color": [1.0, 0.8, 0.6], "energy": 1.2, "range": 2.4}]
    add("s13_officer", 24.6, 28.5, s13)
    # ---- 0:28.5-0:29.65 the door held open: the lead catches it
    s14 = dict(dorm_common)
    s14["doors"] = {"R": DOOR_RET}
    s14["tau0"] = 28.5 - D_RET
    s14["lights"] = dorm_lights
    s14["arrows"] = [{"pts": [[-0.5, 80.0], [-0.4, 95.0], [0.3, 101.6]], "w": 1.3, "energy": 1.0}]
    s14["cam"] = [
        {"t": 0.0, "pos": [-2.4, 1.2, 99.4], "at": [0.95, 1.15, 102.7], "fov": 46.0},
        {"t": 1.15, "pos": [-2.2, 1.15, 99.7], "at": [0.95, 1.15, 102.9], "fov": 44.0},
    ]
    add("s14_door_catch", 28.5, 29.65, s14)
    # ---- 0:29.65-0:36 home: the latch, the innocent line-up, the squeak
    s15 = dict(dorm_common)
    s15["doors"] = {"R": DOOR_RET}
    s15["tau0"] = 29.65 - D_RET
    s15["lights"] = dorm_lights
    s15["exposure"] = 0.92
    c0 = s1["cam"][0]
    s15["cam"] = [
        {"t": 0.0, "pos": c0["pos"], "at": c0["at"], "fov": c0["fov"]},
        {"t": 1.6, "pos": c0["pos"], "at": c0["at"], "fov": c0["fov"]},
        {"t": 4.4, "pos": [-0.15, 1.35, 112.2], "at": [0.4, 1.0, 106.3], "fov": 36.0},
        {"t": 6.35, "pos": [-0.08, 1.33, 111.95], "at": [0.4, 0.95, 106.4], "fov": 35.0},
    ]
    add("s15_dorm_home", 29.65, 36.0, s15)

    for sid, sh in shots.items():
        if "doors" in sh and isinstance(sh["doors"], dict):
            sh["doors"] = {k: v for k, v in sh["doors"].items() if v}
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    json.dump(r3(shots), open(OUT_JSON, "w"), indent=1)
    json.dump({"fps": FPS, "dur": 40.0, "clips": edl, "logo": 36.0,
               "info": {k: (r3(v) if not isinstance(v, Route) else None) for k, v in A.items() if k != "cart_route"}},
              open(OUT_EDL, "w"), indent=1)
    return shots, edl, A


if __name__ == "__main__":
    shots, edl, A = build()
    for k, v in A.items():
        if not isinstance(v, Route):
            print(k, r3(v) if not isinstance(v, list) or len(str(v)) < 200 else str(v)[:200])
    for c in edl:
        print(c)
