#!/usr/bin/env python3
"""Ultimate Trifecta - Season 1: Winter Break, V3 (33 s cinematic short).

Writes the shot list for the in-engine director (ut40_shots.json) and the
edit decision list (edl2.json).

World: x east, z south, y up; Founders' Fountain at (0, 22) (rim r 6.6,
top 0.6), the spine path (w 4) from the fountain to Puddlesworth Hall's
front door at (0, 103), the campus road crossing it at z 88 (w 7), low
walls at z 84.5 either side of the spine.  Yaw: facing -Z at 0, PI = +Z.

Clocks
  dorm delta  (A1, the departure): T = delta.
  story tau   (everything after): the lead's slipper lands on the rim at
              tau 0 = T 3.25; real time through the headlights and the
              cart's start (A2..B2: T = 3.25 + tau), two forward skips at
              cuts in the chase, then T = tau + 0.1 from the bush to the
              title (one continuous scene: dive, the cart passing, the door).
"""
import json, math, copy, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import plan as PL
from plan import Route, dist, time_at_dist, arrive, yaw_to, r3, PI

OUT_JSON = "/home/user/ut/game/game/src/dev/trailer/ut40_shots.json"
OUT_EDL = "/home/user/ut/work/edl4.json"
FPS_OUT = 30
F = lambda n: n / FPS_OUT          # frame -> seconds

LEAD, ELF, DEER, WATCH, TOWEL = PL.LEAD, PL.ELF, PL.DEER, PL.WATCH, PL.TOWEL

# ------------------------------------------------------------ the edit's sync points
T_CUT_OUT = F(87)        # 2.900: warm lobby -> cold courtyard, on the waltz's phrase
FT = F(108)              # 3.600: the slipper on the rim, on the bass entry (tau 0)
T_LIGHT = F(240)         # 8.000: the musical turn; the headlights hit their faces; the relay click
T_STEP = F(261)          # 8.700: the elf's first footfall on the pavement
T_HANDOFF = F(415)       # 13.833: the stronger chase rhythm: the cart's gain revealed
TAU_L = T_LIGHT - FT
TAU_E1 = T_STEP - FT
KD = -2.15              # tau = T + KD for the dive and the bush
KE = 0.15              # tau = T + KE from the lobby door on
T_DIVE = 17.45
T_SHAKE = F(655)         # 21.833: the musical return: the bush shakes
T_BURST = F(675)         # 22.5: on the beat: he bursts out
T_LATCH = F(855)         # 28.5: the latch (the score drops out)
T_LAND = F(892)          # 29.733: the snow lands
T_TITLE = F(894)         # 29.8: the title, on the score's last hit
TAUD = lambda T: T + KD
TAU = lambda T: T + KE

RIM_Z, TEST_X = PL.RIM_Z, PL.TEST_X
RIM_Y = 0.613            # the rim's drawn top at the test point (V2 stood at 0.6)
PLAZA_Y = 0.03           # the plaza paving by the rim
BUSH = (5.4, 75.5)
PATCH = (0.0, 0.0)       # set below (where the runners are in C3)


def s_near(route, p):
    best = min(range(len(route.pts)), key=lambda i: math.dist(route.pts[i], p))
    return route.cum[best]


def solve_v(keys_head, d_target, t_target):
    """constant tail speed v so dist(keys_head + [[t_last+.., v]]) hits d at t"""
    lo, hi = 1.0, 14.0
    for _ in range(60):
        v = (lo + hi) / 2
        ks = keys_head + [[keys_head[-1][0] + 0.6, v]]
        if dist(ks, t_target) < d_target:
            lo = v
        else:
            hi = v
    return keys_head + [[keys_head[-1][0] + 0.6, (lo + hi) / 2]]


# ======================================================================= DORM
DOOR_OUT = [[0.0, 0.0], [0.3, 0.0], [1.05, 72.0, "inout"], [3.3, 72.0], [3.95, 4.0, "inout"], [4.08, 0.0, "in"]]


def departure():
    """A1: inside the warm lobby; the elf at the glass door, impatient; the lead
    eases the door open, checks over a shoulder, grins and slips out."""
    lead = {
        "id": "lead", "role": "runner", "look": LEAD,
        "segs": [
            {"mode": "hold", "t0": -9.0, "pos": [1.05, 0.0, 103.95], "yaw": 0.0},
            {"mode": "route", "t0": 2.58, "pts": [[1.05, 103.95], [0.62, 103.15], [0.35, 101.6], [-0.1, 99.0]],
             "speed": [[0.0, 0.55], [0.22, 1.9], [1.0, 2.6]]},
        ],
        "fx": [
            # checks over the left shoulder at the quiet room
            {"type": "turn", "t": 1.5, "dur": 0.34, "yaw": -1.3, "until": 2.22},
            {"type": "turn", "t": 2.22, "dur": 0.24, "yaw": 0.0, "until": 2.6},
        ],
        "pose": [
            [-9.0, {}], [0.05, {}],
            [0.32, {"upper_arm.R": [72, 0, -22], "forearm.R": [12, 0, 0], "spine": [-4, 0, 0], "head": [-4, 0, 0]}],
            [0.95, {"upper_arm.R": [84, 0, -26], "forearm.R": [4, 0, 0], "spine": [-7, 0, 0]}],
            [1.2, {"upper_arm.R": [20, 0, -6], "forearm.R": [30, 0, 0]}],
            [1.6, {"head": [0, -50, 0], "neck": [0, -14, 0]}],
            [2.15, {"head": [0, -55, 0], "neck": [0, -15, 0]}],
            [2.45, {"spine": [-6, 0, 0], "head": [-2, 0, 0]}],
            [2.75, {"spine": [-9, 0, 0]}], [3.6, {"spine": [-9, 0, 0]}],
        ],
        "face": [[-9.0, {"smile": 0.2, "brow_up": 0.3}], [1.65, {"smile": 0.25, "brow_up": 0.5}],
                 [1.95, {"smile": 1.0, "squint": 0.45, "brow_up": 0.35}], [2.5, {"smile": 0.85, "squint": 0.3}]],
    }
    elf = {
        "id": "elf", "role": "runner", "look": ELF, "towel": TOWEL,
        "segs": [
            {"mode": "hold", "t0": -9.0, "pos": [-0.15, 0.0, 100.85], "yaw": -2.9},
            {"mode": "route", "t0": 2.45, "pts": [[-0.15, 100.85], [-0.6, 99.6], [-0.8, 96.0]], "speed": [[0.0, 0.0], [0.3, 1.9]]},
        ],
        "fx": [{"type": "jump", "t": 0.55, "dur": 0.22, "h": 0.05}, {"type": "jump", "t": 0.8, "dur": 0.22, "h": 0.05}],
        "pose": [
            [-9.0, {"spine": [-4, 0, 0]}],
            # bouncing on the toes, arms crossed against the cold
            [0.35, {"upper_arm.L": [40, 0, 30], "upper_arm.R": [40, 0, -30], "forearm.L": [90, 0, 0], "forearm.R": [90, 0, 0], "spine": [-4, 0, 0]}],
            # come ON: two quick beckons, the head tipped
            [0.95, {"upper_arm.R": [70, 0, 16], "forearm.R": [50, 0, 0], "head": [0, -6, 10], "upper_arm.L": [20, 0, 10], "forearm.L": [40, 0, 0]}],
            [1.08, {"upper_arm.R": [70, 0, 16], "forearm.R": [115, 0, 0], "hand.R": [35, 0, 0], "head": [0, -6, 12]}, "snap"],
            [1.22, {"upper_arm.R": [70, 0, 16], "forearm.R": [50, 0, 0], "head": [0, -6, 10]}],
            [1.35, {"upper_arm.R": [70, 0, 16], "forearm.R": [115, 0, 0], "hand.R": [35, 0, 0], "head": [0, -6, 12]}, "snap"],
            [1.52, {"upper_arm.R": [64, 0, 14], "forearm.R": [60, 0, 0], "head": [0, -4, 6]}],
            # arms out: what's the hold-up
            [1.75, {"upper_arm.L": [30, 0, -40], "upper_arm.R": [30, 0, 40], "forearm.L": [30, 0, 0], "forearm.R": [30, 0, 0], "head": [6, 0, -8]}],
            [2.1, {"upper_arm.L": [24, 0, -32], "upper_arm.R": [24, 0, 32], "forearm.L": [20, 0, 0], "forearm.R": [20, 0, 0], "head": [4, 0, -6]}],
            [2.45, {}],
        ],
        "face": [[-9.0, {"smile": 0.5, "brow_up": 0.3}], [0.9, {"smile": 0.6, "brow_angry": 0.45, "open": 0.35}],
                 [1.5, {"smile": 0.3, "brow_angry": 0.6, "open": 0.5}], [1.8, {"smile": 0.2, "brow_up": 0.9, "open": 0.4}],
                 [2.2, {"smile": 0.9, "squint": 0.45}]],
    }
    return [lead, elf]


# ============================================================ THE STORY (tau)
LEAD_P = [TEST_X + 0.08, 14.75]
LEAD_STOP = [-0.12, 102.3]  # Blue's stop at the door (E1a)
LEAD_BACK = [-0.1, 101.6]   # one step back toward the courtyard, looking
ELF_DOOR = [-0.75, 102.25]  # the elf, arriving at the L leaf's handle
ELF_P = [-0.5, 14.15]
ELF_GRAB = [0.1, 14.45]
DEER_P = [1.95, 13.95]
CART_P = [6.2, 2.4]


def story():
    A = {}
    # ---------------------------------------------------------------- runs
    # around the OUTSIDE of the fountain (west side, r ~9.3), then the spine
    lane = {"elf": -0.1, "lead": -1.15, "deer": 0.95}
    def ring(r, th0, th1, n=9):
        out = []
        for i in range(n + 1):
            th = math.radians(th0 + (th1 - th0) * i / n)
            out.append([round(r * math.sin(th), 3), round(22.0 - r * math.cos(th), 3)])
        return out
    arc = {
        "elf": [ELF_GRAB] + ring(9.5, -20, -158)[0:] + [[lane["elf"] - 0.6, 33.6], [lane["elf"], 37.5]],
        "lead": [LEAD_P, [-0.6, 13.4]] + ring(10.3, -24, -160)[0:] + [[lane["lead"] - 0.8, 33.9], [lane["lead"], 38.0]],
        "deer": [DEER_P, [0.9, 13.6]] + ring(8.8, -10, -156) + [[lane["deer"] - 0.4, 32.0], [lane["deer"], 37.0]],
    }
    start = {"elf": TAU_E1, "lead": TAU_E1 + 0.1, "deer": TAU_E1 + 0.45}
    accel = {"elf": [[0.0, 0.0], [0.28, 3.6], [0.95, 6.3], [1.7, 7.0]],
             "lead": [[0.0, 0.0], [0.3, 3.3], [1.0, 6.2], [1.75, 6.9]],
             "deer": [[0.0, 0.0], [0.3, 3.2], [1.0, 6.5], [1.8, 7.3]]}
    # deer: run to the takeoff point beside the bush, dive at tau(T_DIVE)
    tau_dive = TAUD(T_DIVE)
    A["tau_dive"] = tau_dive
    to_pt = [2.75, 73.55]
    deer_pts = arc["deer"] + [[lane["deer"], 45.0], [lane["deer"], 61.5], [1.25, 68.0], [1.9, 71.7], to_pt]
    dr = Route(deer_pts)
    deer_keys = solve_v(accel["deer"], dr.length, tau_dive - start["deer"])
    A["deer_v"] = deer_keys[-1][1]
    # the two others: lanes to the bush, a stride on, the look back, then on to the door
    tau_door = TAU(20.6)        # the elf's hand on the door (E1a opens on their arrival)
    A["tau_door"] = tau_door
    two = {}
    for who, door_pt in [("elf", ELF_DOOR), ("lead", LEAD_STOP)]:
        pts = arc[who] + [[lane[who], 45.0], [lane[who], 62.0], [lane[who], 78.0], [lane[who] * 0.6, 88.0], [door_pt[0] * 0.8, 97.5], door_pt]
        r = Route(pts)
        # the realisation: easing off a beat after the dive, then on again
        t_s = start[who]
        t_dv = tau_dive - t_s
        k_head = copy.deepcopy(accel[who])
        # cruise speed to be at the dive moment just past the bush (z ~ 79.5)
        s_bush = r.s_at_z(71.8 if who == "elf" else 71.2)
        k = solve_v(k_head, s_bush, t_dv)
        v = k[-1][1]
        t_dec = tau_door - t_s
        # after the dive: one more stride (0.3 s), ease to 4.6 m/s looking back, then on, slowing into the door
        k += [[t_dv + 0.3, v], [t_dv + 0.85, 4.6], [t_dv + 1.35, 4.8], [t_dv + 1.9, 6.6]]
        # finish: a cruise speed that lands the stop (0.55 s) on the arrival time
        rem = r.length - dist(k, t_dv + 1.9)
        t_arr = tau_door - t_s - (0.0 if who == "elf" else -0.12)
        span = t_arr - (t_dv + 1.9)
        # v at 6.6 -> vc linear over 0.4 s, cruise vc, then 0.55 s to rest
        lo, hi = 3.0, 12.0
        for _ in range(60):
            vc = (lo + hi) / 2
            dd = (6.6 + vc) / 2 * 0.4 + vc * (span - 0.95) + vc * 0.275
            if dd < rem:
                lo = vc
            else:
                hi = vc
        tc = span - 0.55
        k += [[t_dv + 2.3, vc], [t_dv + 1.9 + tc, vc], [t_dv + 1.9 + tc + 0.55, 0.0]]
        A[who + "_vc"] = vc
        A[who + "_arrive"] = t_s + t_dv + 1.9 + tc + 0.55
        A[who + "_v"] = v
        two[who] = {"pts": pts, "keys": k, "route": r}
    A["deer_route"] = dr
    A["lead_route"] = two["lead"]["route"]
    A["elf_route"] = two["elf"]["route"]

    # ---------------------------------------------------------------- the lead
    lead = {
        "id": "lead", "role": "runner", "look": LEAD, "fast_at": 5.0,
        "segs": [
            {"mode": "route", "t0": -1.25, "pts": [[TEST_X - 0.2, 13.1], [TEST_X, RIM_Z]],
             "s0": Route([[TEST_X - 0.2, 13.1], [TEST_X, RIM_Z]]).length - 2.1 * 1.25, "speed": [[0.0, 2.1]]},
            {"mode": "hold", "t0": 0.0, "pos": [TEST_X, RIM_Y, RIM_Z], "yaw": PI},
            {"mode": "route", "t0": 1.75, "pts": [[TEST_X, RIM_Z], LEAD_P], "speed": [[0.0, 3.2]], "y": RIM_Y},
            {"mode": "hold", "t0": 2.05, "pos": [LEAD_P[0], 0.0, LEAD_P[1]], "yaw": PI},
            {"mode": "route", "t0": start["lead"], "pts": two["lead"]["pts"], "speed": two["lead"]["keys"]},
            {"mode": "hold", "t0": A["lead_arrive"], "pos": [LEAD_STOP[0], 0.0, LEAD_STOP[1]], "yaw": PI},
        ],
        "fx": [
            {"type": "jump", "t": -0.33, "dur": 0.33, "h": 0.1, "dy": RIM_Y - PLAZA_Y},
            {"type": "ripple", "t": 1.02, "pos": [TEST_X + 0.05, PL.WATER_Y, RIM_Z + 0.5], "size": 0.32},
            # the landing: the knees take the weight (a 4 cm give, matched to the knee bend), then the toe-test dip
            {"type": "yoff", "t": 0.0, "dur": 9.0, "keys": [[0.0, 0.0], [0.08, -0.042], [0.15, -0.036], [0.3, 0.0], [0.45, 0.0], [0.95, -0.13], [1.12, -0.13], [1.25, 0.0]]},
            {"type": "jump", "t": 1.75, "dur": 0.3, "h": 0.12, "dy": -(RIM_Y - PLAZA_Y)},
            # down off the rim: turns to the friends (the deer's mime), then to the light
            {"type": "turn", "t": 2.15, "dur": 0.4, "face": [1.2, 12.6], "until": TAU_L + 0.05},
            {"type": "turn", "t": TAU_L + 0.17, "dur": 0.16, "face": CART_P, "until": start["lead"]},
        ],
        "pose": [
            [-0.3, {}],
            [-0.01, {"thigh.L": [8, 0, 0], "thigh.R": [8, 0, 0], "shin.L": [-10, 0, 0], "shin.R": [-10, 0, 0], "foot.L": [2, 0, 0], "foot.R": [2, 0, 0]}],
            # the slipper takes the weight: hips sink, knees forward, soles flat on the rim
            [0.08, {"thigh.L": [28, 0, -2], "thigh.R": [28, 0, 2], "shin.L": [-50, 0, 0], "shin.R": [-50, 0, 0], "foot.L": [22, 0, 0], "foot.R": [22, 0, 0],
                    "spine": [7, 0, 0], "upper_arm.L": [0, 0, -14], "upper_arm.R": [0, 0, 14]}],
            [0.15, {"thigh.L": [24, 0, -2], "thigh.R": [24, 0, 2], "shin.L": [-43, 0, 0], "shin.R": [-43, 0, 0], "foot.L": [19, 0, 0], "foot.R": [19, 0, 0],
                    "spine": [6, 0, 0], "upper_arm.L": [0, 0, -16], "upper_arm.R": [0, 0, 16]}],
            [0.32, {"head": [-10, 0, 0], "upper_arm.L": [0, 0, -12], "upper_arm.R": [0, 0, 12]}],
            [0.35, {"head": [-22, 0, 0], "upper_arm.L": [0, 0, -18], "upper_arm.R": [0, 0, 18]}],
            [0.55, {"head": [-26, 0, 0], "upper_arm.L": [5, 0, -24], "upper_arm.R": [5, 0, 24], "spine": [6, 0, 0]}],
            [1.0, {"head": [-30, 0, 0], "upper_arm.L": [10, 0, -32], "upper_arm.R": [10, 0, 34], "spine": [12, 0, 0], "chest": [4, 0, 0],
                   "thigh.R": [38, 0, 4], "shin.R": [-4, 0, 0], "foot.R": [-50, 0, 0], "thigh.L": [28, 0, 0], "shin.L": [-46, 0, 0], "foot.L": [18, 0, 0]}],
            [1.16, {"head": [8, 0, 0], "upper_arm.L": [28, 0, -12], "upper_arm.R": [28, 0, 12], "forearm.L": [40, 0, 0], "forearm.R": [40, 0, 0],
                    "spine": [16, 0, 0], "chest": [8, 0, 0], "thigh.R": [-6, 0, 0], "shoulder.L": [0, 0, 12], "shoulder.R": [0, 0, -12]}, "snap"],
            [1.45, {"head": [4, 0, 0], "upper_arm.L": [24, 0, -10], "upper_arm.R": [24, 0, 10], "forearm.L": [36, 0, 0], "forearm.R": [36, 0, 0],
                    "spine": [10, 0, 0], "shoulder.L": [0, 0, 10], "shoulder.R": [0, 0, -10]}],
            [1.75, {}],
            # sheepish: hands rubbing the arms (cold), a shrug at the deer's mime
            [2.4, {"upper_arm.L": [30, 0, 22], "upper_arm.R": [30, 0, -22], "forearm.L": [95, 0, 0], "forearm.R": [95, 0, 0], "spine": [-4, 0, 0], "head": [-6, 0, 0]}],
            [3.55, {"upper_arm.L": [30, 0, 22], "upper_arm.R": [30, 0, -22], "forearm.L": [95, 0, 0], "forearm.R": [95, 0, 0], "spine": [-4, 0, 0], "head": [-4, 8, 4]}],
            [3.9, {"upper_arm.L": [18, 0, -26], "upper_arm.R": [18, 0, 26], "forearm.L": [60, 0, 0], "forearm.R": [60, 0, 0], "shoulder.L": [0, 0, 16], "shoulder.R": [0, 0, -16], "head": [4, 0, 10]}],
            [4.35, {"upper_arm.L": [10, 0, -6], "upper_arm.R": [10, 0, 6], "forearm.L": [20, 0, 0], "forearm.R": [20, 0, 0], "head": [2, 0, 4]}],
            [TAU_L - 0.02, {"head": [0, 0, 0]}],
            # the glare: head back, a hand up against it, squinting
            [TAU_L + 0.14, {"head": [0, 0, 0]}],
            [TAU_L + 0.24, {"head": [10, 0, 0], "spine": [6, 0, 0], "upper_arm.L": [60, 0, 8], "forearm.L": [110, 0, 0], "hand.L": [10, 0, 0]}, "snap"],
            [TAU_L + 0.55, {"head": [6, 0, 0], "spine": [4, 0, 0], "upper_arm.L": [64, 0, 8], "forearm.L": [112, 0, 0]}],
            # yanked by the sleeve (right arm pulled out toward the elf)
            [start["lead"] - 0.08, {"upper_arm.R": [40, 0, 30], "forearm.R": [10, 0, 0], "spine": [-10, 0, 0], "head": [0, -10, 0]}],
            [start["lead"] + 0.45, {"upper_arm.R": [50, 0, 24], "forearm.R": [10, 0, 0], "spine": [-12, 0, 0]}],
            [start["lead"] + 0.85, {"spine": [-10, 0, 0]}],
            [start["lead"] + 2.0, {"spine": [-8, 0, 0]}],
            [10.2, {"spine": [-8, 0, 0]}],
            [10.5, {"spine": [-4, -14, 0], "head": [0, -62, 0], "neck": [0, -18, 0]}],
            [10.9, {"spine": [-4, -16, 0], "head": [0, -70, 0], "neck": [0, -20, 0]}],
            [11.1, {"spine": [-16, 0, 0], "head": [-4, 0, 0]}, "snap"],
            [13.6, {"spine": [-14, 0, 0]}],
            [14.6, {"spine": [-9, 0, 0]}],
        ],
        "face": [
            [-0.3, {}],
            [0.4, {"brow_up": 0.4, "open": 0.15}],
            [0.95, {"brow_up": 0.7, "open": 0.3, "squint": 0.2}],
            [1.12, {"brow_up": 1.0, "open": 0.9, "squint": 0.85}, "snap"],
            [1.6, {"brow_up": 0.6, "open": 0.45, "squint": 0.5}],
            [2.5, {"brow_up": 0.5, "smile": 0.4, "open": 0.1}],
            [3.6, {"smile": 0.75, "squint": 0.35, "brow_up": 0.4}],
            [TAU_L - 0.02, {"smile": 0.6, "squint": 0.3}],
            [TAU_L + 0.15, {"smile": 0.6, "squint": 0.3}],
            [TAU_L + 0.19, {"squint": 1.0, "brow_angry": 0.5, "open": 0.35, "smile": 0.0}, "snap"],
            [TAU_L + 0.55, {"squint": 0.9, "brow_up": 0.6, "open": 0.6}],
            [start["lead"], {"brow_up": 1.0, "open": 0.85, "squint": 0.4}],
            [start["lead"] + 1.5, {"brow_up": 0.8, "open": 0.6, "squint": 0.3}],
            [10.45, {"brow_up": 0.8, "open": 0.6}],
            [10.7, {"brow_up": 1.0, "open": 1.0, "squint": 0.1}],
            [11.1, {"brow_angry": 0.8, "squint": 0.6, "open": 0.5, "brow_up": 0.0}, "snap"],
            [13.8, {"brow_angry": 0.6, "squint": 0.4, "open": 0.5}],
        ],
    }
    # ---------------------------------------------------------------- the elf
    elf = {
        "id": "elf", "role": "runner", "look": ELF, "towel": TOWEL, "fast_at": 5.0,
        "segs": [
            {"mode": "hold", "t0": -9.0, "pos": [ELF_P[0], 0.0, ELF_P[1]], "yaw": PI - 0.45},
            arrive({"mode": "route", "t0": TAU_L + 0.14, "pts": [ELF_P, ELF_GRAB], "speed": [[0.0, 0.0], [0.12, 2.6], [0.26, 2.0], [0.4, 0.0]], "rest_yaw": yaw_to(ELF_GRAB, LEAD_P)}),
            {"mode": "hold", "t0": TAU_L + 0.54, "pos": [ELF_GRAB[0], 0.0, ELF_GRAB[1]], "yaw": yaw_to(ELF_GRAB, LEAD_P)},
            {"mode": "route", "t0": start["elf"], "pts": two["elf"]["pts"], "speed": two["elf"]["keys"]},
            {"mode": "hold", "t0": A["elf_arrive"], "pos": [ELF_DOOR[0], 0.0, ELF_DOOR[1]], "yaw": PI},
        ],
        "fx": [
            {"type": "turn", "t": 1.95, "dur": 0.4, "face": [LEAD_P[0], LEAD_P[1] + 0.2], "until": 3.0},
            {"type": "emote", "name": "laugh", "t": 2.55, "dur": 1.4},
            {"type": "turn", "t": TAU_L + 0.02, "dur": 0.12, "face": CART_P, "until": TAU_L + 0.14},
        ],
        "pose": [
            [-9.0, {}],
            [2.0, {}],
            [TAU_L - 0.02, {}],
            [TAU_L + 0.07, {"head": [8, 0, 0], "upper_arm.L": [55, 0, 10], "forearm.L": [100, 0, 0], "spine": [5, 0, 0]}, "snap"],
            # grabs the lead's sleeve
            [TAU_L + 0.42, {"upper_arm.L": [70, 0, 0], "forearm.L": [10, 0, 0], "hand.L": [-20, 0, 0], "spine": [-10, 0, 0]}],
            [start["elf"], {"upper_arm.L": [-40, 0, 28], "forearm.L": [5, 0, 0], "spine": [-16, 0, 0], "head": [0, 20, 0]}],
            [start["elf"] + 0.55, {"upper_arm.L": [-35, 0, 22], "forearm.L": [10, 0, 0], "spine": [-14, 0, 0], "head": [0, 10, 0]}],
            [start["elf"] + 0.85, {"spine": [-10, 0, 0]}],
            [start["elf"] + 2.0, {"spine": [-9, 0, 0], "forearm.L": [20, 0, 0], "forearm.R": [20, 0, 0]}],
        ],
        "face": [[-9.0, {"smile": 0.6}], [2.5, {"smile": 1.0, "squint": 0.7, "open": 0.6}], [4.0, {"smile": 0.7, "squint": 0.4}],
                 [TAU_L - 0.02, {"smile": 0.6}], [TAU_L + 0.035, {"squint": 0.9, "brow_up": 0.6, "open": 0.5, "smile": 0.0}, "snap"],
                 [TAU_L + 0.4, {"brow_angry": 0.7, "open": 0.4, "squint": 0.3}], [start["elf"] + 1.0, {"brow_angry": 0.6, "open": 0.5}]],
    }
    # ---------------------------------------------------------------- the deer
    deer = {
        "id": "deer", "role": "runner", "look": DEER, "fast_at": 5.0,
        "segs": [
            {"mode": "hold", "t0": -9.0, "pos": [DEER_P[0], 0.0, DEER_P[1]], "yaw": PI + 0.5},
            {"mode": "route", "t0": start["deer"], "pts": deer_pts, "speed": deer_keys},
        ],
        "fx": [
            {"type": "turn", "t": 1.85, "dur": 0.3, "face": [LEAD_P[0], LEAD_P[1]], "until": TAU_L + 0.05},
            {"type": "turn", "t": TAU_L + 0.3, "dur": 0.2, "face": CART_P, "until": start["deer"]},
        ],
        "pose": [
            [-9.0, {"spine": [-6, 0, 0]}],
            [2.05, {"spine": [-6, 0, 0]}],
            # the mime: the lead's toe test and recoil, bigger
            [2.25, {"thigh.R": [40, 0, 4], "foot.R": [-40, 0, 0], "upper_arm.L": [10, 0, -36], "upper_arm.R": [10, 0, 36], "spine": [10, 0, 0], "head": [-16, 0, 0]}],
            [2.45, {"thigh.R": [-8, 0, 0], "upper_arm.L": [80, 0, -30], "upper_arm.R": [80, 0, 30], "forearm.L": [60, 0, 0], "forearm.R": [60, 0, 0], "spine": [20, 0, 0], "head": [14, 0, 0]}, "snap"],
            [2.7, {"upper_arm.L": [70, 0, -24], "upper_arm.R": [70, 0, 24], "forearm.L": [50, 0, 0], "forearm.R": [50, 0, 0], "spine": [16, 0, 0], "head": [10, 0, 0]}],
            [3.05, {"spine": [-14, 0, 0], "head": [-10, 0, 0], "upper_arm.L": [20, 0, 10], "forearm.L": [70, 0, 0]}],
            [3.6, {"spine": [-10, 0, 0], "head": [-6, 0, 0]}],
            [TAU_L - 0.02, {"spine": [-6, 0, 0]}],
            [TAU_L + 0.26, {"spine": [-6, 0, 0]}],
            [TAU_L + 0.36, {"head": [12, 0, 0], "spine": [8, 0, 0], "upper_arm.L": [50, 0, 20], "upper_arm.R": [50, 0, -20], "forearm.L": [80, 0, 0], "forearm.R": [80, 0, 0]}, "snap"],
            [start["deer"] - 0.1, {"head": [6, 20, 0], "spine": [4, 0, 0], "upper_arm.L": [40, 0, 10], "upper_arm.R": [40, 0, -10]}],
            # the scramble: arms flailing wide
            [start["deer"] + 0.3, {"spine": [-14, 0, 0], "upper_arm.L": [0, 0, -30], "upper_arm.R": [0, 0, 30]}],
            [start["deer"] + 1.5, {"spine": [-10, 0, 0], "upper_arm.L": [0, 0, -22], "upper_arm.R": [0, 0, 22]}],
        ],
        "face": [[-9.0, {"smile": 0.7}], [2.2, {"smile": 0.9, "brow_up": 0.8, "open": 0.4}], [2.45, {"open": 0.9, "brow_up": 1.0, "squint": 0.6}],
                 [3.05, {"smile": 1.0, "squint": 0.9, "open": 0.6}], [4.0, {"smile": 0.8, "squint": 0.5}],
                 [TAU_L - 0.02, {"smile": 0.7}], [TAU_L + 0.27, {"smile": 0.7}], [TAU_L + 0.31, {"squint": 0.8, "brow_up": 1.0, "open": 0.8, "smile": 0.0}, "snap"],
                 [start["deer"] + 0.8, {"brow_up": 0.9, "open": 0.7}]],
    }
    A["start"] = start
    return [lead, elf, deer], A




# ============================================================ V3: THE ENDING
# Story clock from the bush on: tau = T + KE (continuous); the reindeer alone
# skips ahead along its run at the cut to the threshold (the middle stretch
# of pavement is never shown).
T_E1A = 20.6
T_D3 = F(655)            # 21.833: the musical pickup: back to the bush
T_SEE = 21.95            # the reindeer finds Blue at the lit doorway
T_PUSH = F(670)          # 22.333: a hand pushes the branch aside
T_PLANT = F(680)         # 22.667: one foot planted on the path
T_SPRING = F(689)        # 22.967: springs out (on the score's hit)
T_BSNOW = F(700)         # 23.333: the branch's snow drops, after the body clears it
T_E4 = F(770)            # 25.667: the next stride: the threshold
T_CATCH = F(805)         # 26.833: Blue catches the forearm
T_IN = F(825)            # 27.5: through; the door swinging shut behind them
T_LATCH = F(855)         # 28.5
T_E2 = F(860)            # 28.667
T_E3 = F(881)            # 29.367
T_LAND = F(888)          # 29.6: the snow lands, six frames before the title
T_TITLE = F(894)         # 29.8
TAU_LATCH = TAU(T_LATCH)
TAU_LAND = TAU(T_LAND)

HIDE = [5.3, 75.5]                 # crouched in the bush (D2: facing west, the path)
PEEK = [5.05, 75.62]               # leaning into the west opening (D3)
EXIT = [4.6, 75.85]                # first step clear of the foliage
PLANT = [3.95, 76.1]               # the planted foot, on the snow at the path's edge
SNOW_B = (3.75, 76.2)              # that patch of snow
CATCH_D = [-0.62, 100.62]          # the reindeer at the catch (Blue's left hand to its left hand)
# backs to the doors (the L leaf stays shut; the R leaf is the way in)
PRESS = {"lead": [1.02, 103.6], "deer": [0.28, 103.62], "elf": [-0.62, 103.6]}
DOOR_R_HANDLE = 1.4                # m from the R hinge to the push plate / handle


def PRESS_POSE(look):
    """backs flat to the door, arms spread on it, head back, eyes on `look` (head yaw)"""
    return {"spine": [8, 0, 0], "chest": [4, 0, 0], "head": [10, look, 0], "neck": [0, look * 0.2, 0],
            "upper_arm.L": [-30, 0, -50], "upper_arm.R": [-30, 0, 50], "forearm.L": [-10, 0, 0], "forearm.R": [-10, 0, 0]}


def door_l_keys(A):
    """the L leaf (out = toward the courtyard): yanked open by the elf and caught
    with one hand at the end of its swing, held, swung shut, latched"""
    ta = A["elf_arrive"]
    return [[-20.0, 0.0], [ta - 0.06, 0.0], [ta + 0.26, 94.0, "out"], [ta + 0.42, 80.0, "inout"], [ta + 0.55, 82.0, "inout"],
            [TAU(T_IN) - 0.25, 82.0], [TAU_LATCH - 0.12, 7.0, "in"], [TAU_LATCH, 0.0, "out"],
            [TAU_LATCH + 0.04, 1.6, "out"], [TAU_LATCH + 0.1, 0.0, "in"]]


def ending(actors, A):
    lead, elf, deer = actors
    td = A["tau_dive"]
    land = td + 0.42
    t_rake = A["t_rake"]
    # ---------------------------------------------------------------- the reindeer
    deer["segs"] += [
        {"mode": "route", "t0": td, "pts": [[2.75, 73.55], HIDE], "speed": [[0.0, Route([[2.75, 73.55], HIDE]).length / 0.42]]},
        {"mode": "hold", "t0": land, "pos": [HIDE[0], 0.0, HIDE[1]], "yaw": yaw_to(HIDE, [0.0, 75.5])},
        # D3: leaning into the opening, looking out at the door
        arrive({"mode": "route", "t0": TAU(T_D3) - 0.25, "pts": [HIDE, PEEK], "speed": [[0.0, 0.0], [0.15, 1.2], [0.3, 0.0]], "yaw": yaw_to(PEEK, [-6.0, 84.0])}),
        {"mode": "hold", "t0": TAU(T_D3) + 0.05, "pos": [PEEK[0], 0.0, PEEK[1]], "yaw": yaw_to(PEEK, [-6.0, 84.0])},
    ]
    # out: a step clear of the branch, the planted foot, the spring, the sprint down the west side
    run_pts = [PEEK, EXIT, PLANT, [2.2, 77.2], [0.9, 79.2], [-0.9, 81.4], [-2.2, 84.0], [-2.3, 86.5], [-1.4, 89.5], [-0.5, 92.5], [0.1, 95.5]]
    rr = Route(run_pts)
    t_out = TAU(T_PUSH) + 0.02
    deer["segs"] += [
        {"mode": "route", "t0": t_out, "pts": run_pts, "speed": [[0.0, 0.0], [0.15, 2.0], [TAU(T_PLANT) - t_out, 2.4], [TAU(T_SPRING) - t_out, 2.6],
                                                                  [TAU(T_SPRING) - t_out + 0.12, 5.2], [TAU(T_SPRING) - t_out + 0.32, 6.6], [TAU(T_SPRING) - t_out + 0.9, 7.4]]},
    ]
    # the threshold (E4): already close; slowing into Blue's hand, then pulled through
    e4_pts = [[-0.25, 95.0], [-0.45, 97.8], CATCH_D]
    e4 = Route(e4_pts)
    span = TAU(T_CATCH) - TAU(T_E4)
    # speed from v0 down to 2.6 at the catch, linear: (v0 + 2.6)/2 * span = length
    v0 = 2 * e4.length / span - 2.6
    A["deer_e4_v0"] = v0
    pull_pts = [CATCH_D, [-0.6, 101.9], [-0.55, 102.9], [-0.35, 103.9], [0.15, 104.4], [0.28, 104.05]]
    pr = Route(pull_pts)
    t_pull = TAU(T_CATCH)
    tp_end = TAU(T_IN) + 0.25
    pspan = tp_end - t_pull
    vp = (pr.length - 2.6 * 0.15 / 2) / (pspan - 0.15 - 0.2) if False else None
    # 2.6 -> 3.6 over 0.25 s, cruise, 0.35 s to rest
    lo, hi = 1.0, 8.0
    for _ in range(50):
        vc = (lo + hi) / 2
        dd = (2.6 + vc) / 2 * 0.25 + vc * (pspan - 0.6) + vc * 0.175
        if dd < pr.length:
            lo = vc
        else:
            hi = vc
    A["deer_pull_v"] = vc
    deer["segs"] += [
        {"mode": "route", "t0": TAU(T_E4), "pts": e4_pts, "speed": [[0.0, v0], [span, 2.6]]},
        {"mode": "route", "t0": t_pull, "pts": pull_pts, "speed": [[0.0, 2.6], [0.25, vc], [pspan - 0.35, vc], [pspan, 0.0]]},
        arrive({"mode": "route", "t0": tp_end + 0.02, "pts": [[0.28, 104.05], PRESS["deer"]], "speed": [[0.0, 0.0], [0.12, 1.6], [0.25, 1.2], [0.4, 0.0]], "yaw": PI}),
        {"mode": "hold", "t0": tp_end + 0.42, "pos": [PRESS["deer"][0], 0.0, PRESS["deer"][1]], "yaw": PI},
    ]
    deer["fx"] += [
        {"type": "dive", "t": td, "dur": 0.42, "h": 0.5},
        {"type": "yoff", "t": land, "dur": 99.0, "keys": [[land, 0.0], [land + 0.25, -0.3], [TAU(T_D3) - 0.3, -0.3], [TAU(T_D3), -0.2],
                                                          [TAU(T_PLANT) - 0.12, -0.16], [TAU(T_PLANT) + 0.04, 0.0]]},
        # the spring: a low, long bound off the planted foot
        {"type": "jump", "t": TAU(T_SPRING), "dur": 0.32, "h": 0.22},
        # pulled off balance through the door: a stumble-step
        {"type": "jump", "t": TAU(T_CATCH) + 0.12, "dur": 0.2, "h": 0.06},
        {"type": "turn", "t": tp_end + 0.02, "dur": 0.35, "yaw": PI, "until": 999.0},
    ]
    crouch = {"thigh.L": [75, 0, -6], "thigh.R": [75, 0, 6], "shin.L": [-115, 0, 0], "shin.R": [-115, 0, 0], "foot.L": [30, 0, 0], "foot.R": [30, 0, 0],
              "spine": [-18, 0, 0], "chest": [-6, 0, 0]}
    half = {"thigh.L": [45, 0, -4], "thigh.R": [45, 0, 4], "shin.L": [-75, 0, 0], "shin.R": [-75, 0, 0], "foot.L": [24, 0, 0], "foot.R": [24, 0, 0],
            "spine": [-16, 0, 0], "chest": [-4, 0, 0]}
    def C(extra, base=None):
        d = copy.deepcopy(crouch if base is None else base)
        d.update(copy.deepcopy(extra))
        return d
    tuck = {"upper_arm.L": [30, 0, 22], "upper_arm.R": [30, 0, -22], "forearm.L": [80, 0, 0], "forearm.R": [80, 0, 0]}
    deer["pose"] = [k for k in deer["pose"] if k[0] < td - 0.3] + [
        [td - 0.25, {"spine": [-12, 0, 0], "head": [0, 28, 0]}],          # spots the bush
        [td, {"spine": [-30, 0, 0], "upper_arm.L": [70, 0, -60], "upper_arm.R": [70, 0, 60], "head": [10, 0, 0]}],
        [td + 0.3, {"spine": [-60, 0, 0], "upper_arm.L": [80, 0, -80], "upper_arm.R": [80, 0, 80], "thigh.L": [-10, 0, 0], "thigh.R": [-14, 0, 0]}],
        [land, C({"upper_arm.L": [40, 0, 20], "upper_arm.R": [40, 0, -20], "forearm.L": [60, 0, 0], "forearm.R": [60, 0, 0]})],
        [land + 0.35, C(dict(tuck, head=[-6, 0, 0]))],
        # D2: holding still; the head follows the beam a little, then turns to the door
        [t_rake - 0.6, C(dict(tuck, head=[-4, 4, 0]))],
        [t_rake + 0.1, C(dict(tuck, head=[-5, -1, 0]))],
        [t_rake + 0.7, C(dict(tuck, head=[-5, -4, 0]))],
        [TAUD(19.75), C(dict(tuck, head=[-4, -4, 0]))],
        [TAUD(20.15), C(dict(tuck, head=[-2, -5, 2]))],
        [TAUD(20.6), C(dict(tuck, head=[-2, -5, 2]))],
        # D3: leaning in to the opening; sees Blue
        [TAU(T_D3) - 0.2, C(dict(tuck, head=[2, 0, 0]))],
        [TAU(T_SEE), C(dict(tuck, head=[6, 0, 0], spine=[-12, 0, 0]))],
        [TAU(T_SEE) + 0.2, C(dict(tuck, head=[8, 0, -6], spine=[-10, 0, 0]))],
        # the right hand comes up to the branch and pushes it aside
        [TAU(T_PUSH) - 0.15, C({"upper_arm.R": [70, 0, -10], "forearm.R": [30, 0, 0], "upper_arm.L": [30, 0, 22], "forearm.L": [80, 0, 0], "head": [6, 0, 0], "spine": [-10, 0, 0]}, half)],
        [TAU(T_PUSH) + 0.1, C({"upper_arm.R": [60, 0, -55], "forearm.R": [10, 0, 0], "upper_arm.L": [40, 0, 18], "forearm.L": [70, 0, 0], "head": [4, 0, 0], "spine": [-12, 0, 0]}, half)],
        # the step out: weight forward onto the planted foot
        [TAU(T_PLANT) - 0.1, {"spine": [-20, 0, 0], "upper_arm.R": [40, 0, -40], "upper_arm.L": [30, 0, 30], "forearm.L": [60, 0, 0], "head": [6, 0, 0],
                               "thigh.L": [20, 0, 0], "shin.L": [-30, 0, 0]}],
        [TAU(T_PLANT) + 0.05, {"spine": [-24, 0, 0], "upper_arm.R": [20, 0, -30], "upper_arm.L": [40, 0, 30], "forearm.L": [50, 0, 0], "head": [8, 0, 0],
                                "thigh.L": [42, 0, 0], "shin.L": [-58, 0, 0], "foot.L": [16, 0, 0], "thigh.R": [-8, 0, 0]}],
        # the spring: arms flung back, body long
        [TAU(T_SPRING) - 0.04, {"spine": [-30, 0, 0], "upper_arm.L": [-40, 0, -20], "upper_arm.R": [-40, 0, 20], "head": [10, 0, 0], "thigh.L": [50, 0, 0], "shin.L": [-70, 0, 0]}],
        [TAU(T_SPRING) + 0.12, {"spine": [-24, 0, 0], "upper_arm.L": [-50, 0, -28], "upper_arm.R": [-50, 0, 28], "head": [8, 0, 0]}],
        [TAU(T_SPRING) + 0.4, {"spine": [-16, 0, 0], "upper_arm.L": [10, 0, -30], "upper_arm.R": [10, 0, 30]}],
        [TAU(T_E4) - 0.1, {"spine": [-14, 0, 0], "upper_arm.L": [10, 0, -28], "upper_arm.R": [10, 0, 28]}],
        # E4: reaching for Blue's hand (right arm long, forward)
        [TAU(T_E4) + 0.05, {"spine": [-12, 0, 0], "upper_arm.R": [10, 0, 26], "upper_arm.L": [40, 0, -14], "forearm.L": [10, 0, 0], "head": [6, 0, 0]}],
        [TAU(T_CATCH) - 0.3, {"spine": [-10, 0, 0], "upper_arm.R": [0, 0, 30], "upper_arm.L": [78, 0, -8], "forearm.L": [4, 0, 0], "hand.L": [0, 0, 0], "head": [8, 0, 0]}],
        [TAU(T_CATCH), {"spine": [-8, 0, 0], "upper_arm.R": [-10, 0, 34], "upper_arm.L": [82, 0, -4], "forearm.L": [2, 0, 0], "head": [10, 0, 0]}],
        # yanked: the body pitches after the arm
        [TAU(T_CATCH) + 0.12, {"spine": [-22, 0, 0], "upper_arm.R": [-30, 0, 50], "upper_arm.L": [92, 0, 0], "forearm.L": [0, 0, 0], "head": [-8, 0, 0]}, "snap"],
        [TAU(T_IN) - 0.1, {"spine": [-16, 0, 0], "upper_arm.R": [-20, 0, 40], "upper_arm.L": [80, 0, -6], "head": [0, 0, 0]}],
        [tp_end, {"spine": [4, 0, 0], "upper_arm.L": [20, 0, -20], "upper_arm.R": [30, 0, 20]}],
        [tp_end + 0.42, PRESS_POSE(0)], [TAU_LATCH + 0.4, PRESS_POSE(14)], [TAU_LATCH + 0.7, PRESS_POSE(-10)],
        [TAU_LAND - 0.65, PRESS_POSE(-10)], [TAU_LAND - 0.45, dict(PRESS_POSE(-6), head=[-8, -6, -8])], [TAU_LAND + 1.0, dict(PRESS_POSE(-6), head=[-8, -6, -8])],
    ]
    deer["face"] = [k for k in deer["face"] if k[0] < td - 0.3] + [
        [td - 0.3, {"brow_up": 0.9, "open": 0.7}],
        [td - 0.1, {"brow_up": 1.0, "smile": 0.6, "squint": 0.3, "open": 0.2}, "snap"],     # the idea
        [land + 0.1, {"squint": 1.0, "open": 0.0, "brow_angry": 0.3}],
        [land + 0.6, {"brow_up": 0.7, "open": 0.0, "squint": 0.2, "blink": 0.0}],
        [t_rake - 0.2, {"brow_up": 1.0, "squint": 0.0, "open": 0.12, "blink": 0.0}],
        [t_rake + 0.3, {"brow_up": 0.9, "squint": 0.35, "open": 0.0, "blink": 0.0}],
        [TAUD(19.9), {"brow_up": 0.7, "squint": 0.1, "open": 0.0, "blink": 0.0}],
        [TAUD(20.3), {"brow_up": 1.0, "squint": 0.0, "open": 0.0, "smile": 0.2, "blink": 0.0}],
        [TAU(T_SEE), {"brow_up": 1.0, "open": 0.2, "smile": 0.0}],
        [TAU(T_SEE) + 0.25, {"brow_angry": 0.7, "open": 0.0, "squint": 0.2, "smile": 0.3}],     # decided
        [TAU(T_SPRING), {"brow_angry": 0.6, "open": 0.6, "brow_up": 0.3}],
        [TAU(T_E4), {"brow_up": 1.0, "open": 0.75, "squint": 0.15}],
        [TAU(T_CATCH) + 0.1, {"brow_up": 1.0, "open": 0.95, "squint": 0.4}, "snap"],
        [tp_end + 0.4, {"brow_up": 1.0, "open": 0.6}],
        [tp_end + 0.9, {"brow_up": 0.8, "open": 0.0, "squint": 0.4}],
    ]
    # eyes (the close-up): the beam going by, then the lit doorway
    cart_at = A["cart_xz"]
    gz = [[t_rake - 1.0, 0.0, -0.1]]
    for tt in [t_rake - 0.6, t_rake - 0.3, t_rake, t_rake + 0.3, t_rake + 0.6]:
        cx, cz = cart_at(tt)
        gz.append([tt, "at", cx, 0.7, cz])
    gz += [[t_rake + 0.95, 0.0, -0.15], [TAUD(19.9), 0.0, -0.1], [TAUD(20.15), "at", 0.0, 1.0, 103.0], [TAUD(20.6), "at", 0.0, 1.0, 103.0], [TAU(21.5), "at", 0.0, 1.0, 103.0],
           [TAU(T_SEE), "at", 0.0, 1.0, 103.0], [TAU(T_PUSH), "at", 0.0, 0.9, 103.0], [TAU(T_E4), 0.0, 0.0], [TAU(T_CATCH) - 0.3, 0.0, 0.25]]
    deer["gaze"] = gz
    deer["snowcoat"] = {"t": TAU(T_SPRING) - 0.05, "drop": {"idx": 0, "t_land": TAU_LAND, "land": [0.66, 103.86], "land_size": [0.13, 0.07, 0.11],
                                                           "land_yaw": 0.6, "crumbs": 2, "puff": 0.0},
                        "lumps": [
                            {"bone": "head", "pos": [0.215, 1.61, 0.0], "size": [0.12, 0.09, 0.1], "roll": -0.3, "irregular": 4},
                            {"bone": "head", "pos": [-0.2, 1.6, 0.01], "size": [0.11, 0.07, 0.1], "roll": 0.3},
                            {"bone": "head", "pos": [0.0, 1.5, 0.06], "size": [0.3, 0.11, 0.26]},
                            {"bone": "head", "pos": [0.1, 1.36, 0.22], "size": [0.2, 0.11, 0.13]},
                            {"bone": "head", "pos": [-0.27, 1.25, 0.06], "size": [0.12, 0.09, 0.14], "roll": 0.6},
                            {"bone": "chest", "pos": [-0.25, 0.88, 0.02], "size": [0.16, 0.07, 0.14]},
                            {"bone": "chest", "pos": [0.26, 0.87, -0.03], "size": [0.15, 0.07, 0.13]},
                            {"bone": "hips", "pos": [0.0, 0.64, 0.18], "size": [0.17, 0.08, 0.09]},
                        ]}
    A["deer_land"] = land
    A["tp_end"] = tp_end

    # ---------------------------------------------------------------- Blue
    t_turn = A["lead_arrive"] + 0.05
    t_step = TAU(21.2)
    t_pivot = TAU(T_CATCH) + 0.1
    lead["fx"] += [{"type": "turn", "t": t_turn, "dur": 0.28, "yaw": 0.0, "until": t_step}]
    lead["segs"] += [
        arrive({"mode": "route", "t0": t_step, "pts": [LEAD_STOP, LEAD_BACK], "speed": [[0.0, 0.0], [0.12, 2.0], [0.22, 2.0], [0.38, 0.0]], "yaw": 0.0}),
        {"mode": "hold", "t0": t_step + 0.38, "pos": [LEAD_BACK[0], 0.0, LEAD_BACK[1]], "yaw": 0.0},
    ]
    lpull = [LEAD_BACK, [-0.3, 102.4], [-0.35, 103.3], [0.2, 104.2], [1.02, 104.05]]
    lr = Route(lpull)
    lspan = TAU(T_IN) - t_pivot
    lo, hi = 1.0, 9.0
    for _ in range(50):
        vc2 = (lo + hi) / 2
        dd = vc2 / 2 * 0.2 + vc2 * (lspan - 0.55) + vc2 * 0.175
        if dd < lr.length:
            lo = vc2
        else:
            hi = vc2
    lead["segs"] += [
        {"mode": "route", "t0": t_pivot, "pts": lpull, "speed": [[0.0, 0.0], [0.2, vc2], [lspan - 0.35, vc2], [lspan, 0.0]], "yaw": 0.0},
        arrive({"mode": "route", "t0": TAU(T_IN) + 0.02, "pts": [[1.02, 104.05], PRESS["lead"]], "speed": [[0.0, 0.0], [0.12, 1.5], [0.2, 1.2], [0.32, 0.0]], "yaw": PI}),
        {"mode": "hold", "t0": TAU(T_IN) + 0.34, "pos": [PRESS["lead"][0], 0.0, PRESS["lead"][1]], "yaw": PI},
    ]
    lead["fx"] += [{"type": "turn", "t": t_pivot + 0.02, "dur": 0.3, "yaw": -PI + 0.02, "until": TAU(T_IN) + 0.02},
                   {"type": "turn", "t": TAU(T_IN) + 0.02, "dur": 0.01, "yaw": PI, "until": 999.0}]
    reach = {"upper_arm.L": [80, 0, 6], "forearm.L": [6, 0, 0], "hand.L": [-10, 0, 0], "spine": [-10, 0, 0]}
    lp = [k for k in lead["pose"] if k[0] < A["lead_arrive"] - 0.6]
    lp += [
        [A["lead_arrive"] - 0.3, {"spine": [-6, 0, 0]}],
        [A["lead_arrive"] + 0.08, {"spine": [6, 0, 0], "head": [4, 0, 0]}],
        # turns back to the courtyard; one step out, searching: a hand up against the glare, the head sweeping
        [t_step + 0.05, {"spine": [-6, 0, 0], "head": [0, 20, 0]}],
        [t_step + 0.4, {"spine": [-8, 0, 0], "upper_arm.R": [70, 0, -30], "forearm.R": [110, 0, 0], "hand.R": [20, 0, 0], "head": [2, 26, 0], "neck": [0, 8, 0]}],
        [TAU(21.75), {"spine": [-8, 0, 0], "upper_arm.R": [70, 0, -30], "forearm.R": [110, 0, 0], "hand.R": [20, 0, 0], "head": [2, -18, 0], "neck": [0, -6, 0]}],
        [TAU(22.15), {"spine": [-8, 0, 0], "upper_arm.R": [70, 0, -30], "forearm.R": [110, 0, 0], "hand.R": [20, 0, 0], "head": [2, -26, 0], "neck": [0, -8, 0]}],
        # the bush moves: the hand drops, up on the toes
        [TAU(T_PUSH) + 0.1, {"spine": [-2, 0, 0], "upper_arm.R": [30, 0, -10], "forearm.R": [40, 0, 0], "head": [6, -24, 0], "neck": [0, -6, 0]}],
        # it's out: both arms up, come on
        [TAU(T_SPRING) + 0.1, {"spine": [4, 0, 0], "upper_arm.L": [20, 0, -112], "upper_arm.R": [20, 0, 112], "forearm.L": [0, 0, -30], "forearm.R": [0, 0, 30], "head": [8, -10, 0]}],
        [TAU(T_SPRING) + 0.6, {"spine": [2, 0, 0], "upper_arm.L": [10, 0, -60], "upper_arm.R": [60, 0, 60], "forearm.R": [70, 0, 0], "head": [4, -4, 0]}],
        [TAU(T_SPRING) + 0.95, {"spine": [2, 0, 0], "upper_arm.L": [10, 0, -40], "upper_arm.R": [30, 0, 110], "forearm.R": [10, 0, 30], "head": [4, -4, 0]}],
        [TAU(24.3), {"spine": [-4, 0, 0], "upper_arm.L": [10, 0, -30], "upper_arm.R": [60, 0, 40], "forearm.R": [40, 0, 0]}],
        # the outstretched hand
        [TAU(T_E4) + 0.2, dict(reach, **{"upper_arm.R": [10, 0, 22], "head": [4, 0, 0]})],
        [TAU(T_CATCH) - 0.1, dict(reach, **{"upper_arm.L": [84, 0, 4], "upper_arm.R": [10, 0, 26], "spine": [-14, 0, 0], "head": [6, 0, 0]})],
        # the catch: the hand closes on the forearm, the weight goes back
        [TAU(T_CATCH) + 0.04, {"upper_arm.L": [78, 0, 4], "forearm.L": [14, 0, 0], "hand.L": [20, 0, 0], "spine": [6, 0, 0], "upper_arm.R": [-20, 0, 30], "head": [-4, 0, 0]}, "snap"],
        # the pull: turning for the door with the arm trailing back
        [t_pivot + 0.2, {"upper_arm.L": [-60, 0, -20], "forearm.L": [0, 0, 0], "spine": [-14, 0, 0], "upper_arm.R": [40, 0, 20], "head": [0, -30, 0]}],
        [TAU(T_IN) - 0.15, {"upper_arm.L": [-55, 0, -24], "spine": [-10, 0, 0], "upper_arm.R": [30, 0, 24], "head": [0, -20, 0]}],
        [TAU(T_IN) + 0.34, PRESS_POSE(0)], [TAU_LATCH + 0.45, PRESS_POSE(-16)], [TAU_LATCH + 0.8, PRESS_POSE(12)], [TAU_LAND + 1.0, PRESS_POSE(12)],
    ]
    lead["pose"] = lp
    lead["face"] = [k for k in lead["face"] if k[0] < A["lead_arrive"] - 0.6] + [
        [A["lead_arrive"], {"brow_up": 0.8, "open": 0.6}],
        [t_step + 0.3, {"brow_up": 0.6, "squint": 0.5, "open": 0.15, "brow_angry": 0.2}],          # searching
        [TAU(T_PUSH) + 0.05, {"brow_up": 1.0, "open": 0.4, "squint": 0.0}],
        [TAU(T_SPRING) + 0.1, {"brow_up": 1.0, "open": 0.9, "smile": 0.4}],
        [TAU(T_E4) + 0.2, {"brow_angry": 0.6, "open": 0.4, "brow_up": 0.3}],                      # reaching
        [TAU(T_CATCH) + 0.05, {"brow_angry": 0.9, "squint": 0.6, "open": 0.5}, "snap"],             # got you
        [TAU(T_IN) + 0.4, {"brow_up": 0.9, "open": 0.1, "squint": 0.3}],
    ]
    lead["gaze"] = [[TAU(T_E4) - 0.5, 0.0, 0.0], [TAU(T_E4), 0.0, -0.1], [TAU(T_CATCH), 0.0, -0.25], [TAU(T_IN), 0.0, 0.0],
                    [TAU_LATCH + 0.45, -0.6, 0.0], [TAU_LATCH + 0.8, 0.5, 0.0]]

    # ---------------------------------------------------------------- the elf
    ta = A["elf_arrive"]
    ehold = [-1.28, 102.0]
    elf["segs"] += [
        # the catch: a sidestep with the leaf as it swings wide
        arrive({"mode": "route", "t0": ta + 0.04, "pts": [ELF_DOOR, ehold], "speed": [[0.0, 0.0], [0.12, 2.2], [0.3, 0.0]], "yaw": PI * 0.5}),
        {"mode": "hold", "t0": ta + 0.34, "pos": [ehold[0], 0.0, ehold[1]], "yaw": yaw_to(ehold, [-1.42, 101.62])},
    ]
    t_ein = TAU(T_IN) - 0.25
    ein = [ehold, [-1.05, 102.8], [-0.85, 103.75]]
    elf["segs"] += [
        arrive({"mode": "route", "t0": t_ein, "pts": ein, "speed": [[0.0, 0.0], [0.15, 3.2], [0.35, 3.0], [0.55, 0.0]], "yaw": PI}),
        {"mode": "hold", "t0": t_ein + 0.55, "pos": [ein[-1][0], 0.0, ein[-1][1]], "yaw": PI},
        # turns, a step back into the doorway for the last pull, then flat to the door
        arrive({"mode": "route", "t0": TAU_LATCH - 0.55, "pts": [ein[-1], [-0.3, 103.42]], "speed": [[0.0, 0.0], [0.12, 2.2], [0.24, 1.8], [0.36, 0.0]], "yaw": 0.0}),
        {"mode": "hold", "t0": TAU_LATCH - 0.19, "pos": [-0.3, 0.0, 103.42], "yaw": 0.0},
        arrive({"mode": "route", "t0": TAU_LATCH + 0.06, "pts": [[-0.3, 103.42], [-0.5, 103.8], PRESS["elf"]], "speed": [[0.0, 0.0], [0.1, 1.4], [0.25, 1.2], [0.4, 0.0]], "yaw": PI}),
        {"mode": "hold", "t0": TAU_LATCH + 0.46, "pos": [PRESS["elf"][0], 0.0, PRESS["elf"][1]], "yaw": PI},
    ]
    elf["fx"] += [
        {"type": "turn", "t": t_ein + 0.55, "dur": 0.3, "yaw": 0.0, "until": TAU_LATCH - 0.55},
        {"type": "turn", "t": TAU_LATCH + 0.06, "dur": 0.32, "yaw": PI, "until": 999.0},
    ]
    # one hand on the leaf's edge (the right: the leaf is on the elf's right as it faces west)
    hold_r = {"upper_arm.R": [62, 0, 8], "forearm.R": [12, 0, 0], "hand.R": [10, 0, 0], "spine": [-2, 0, 0]}
    ep = [k for k in elf["pose"] if k[0] < ta - 0.6]
    ep += [
        [ta - 0.3, {"spine": [-6, 0, 0]}],
        [ta - 0.06, {"upper_arm.R": [70, 0, 20], "forearm.R": [10, 0, 0], "hand.R": [0, 0, 0], "spine": [-4, 0, 0], "head": [0, 20, 0]}],
        # caught: the hand slaps the leaf and swings it wide
        [ta + 0.04, {"upper_arm.R": [66, 0, 12], "forearm.R": [8, 0, 0], "hand.R": [20, 0, 0], "spine": [-6, 0, 0], "head": [0, 16, 0]}, "snap"],
        [ta + 0.3, dict(hold_r, head=[0, 40, 0], neck=[0, 10, 0])],
        [ta + 0.6, dict(hold_r, head=[0, 60, 0], neck=[0, 16, 0], spine=[2, 0, 0])],
        # watching the courtyard over the shoulder, free arm waving the reindeer on
        [TAU(T_SPRING) + 0.15, dict(hold_r, head=[4, 70, 0], neck=[0, 18, 0], **{"upper_arm.L": [20, 0, -110], "forearm.L": [0, 0, -30]})],
        [TAU(T_SPRING) + 0.45, dict(hold_r, head=[4, 70, 0], neck=[0, 18, 0], **{"upper_arm.L": [60, 0, -70], "forearm.L": [80, 0, 0]})],
        [TAU(T_SPRING) + 0.75, dict(hold_r, head=[4, 70, 0], neck=[0, 18, 0], **{"upper_arm.L": [20, 0, -110], "forearm.L": [0, 0, -30]})],
        [TAU(T_SPRING) + 1.05, dict(hold_r, head=[4, 70, 0], neck=[0, 18, 0], **{"upper_arm.L": [60, 0, -70], "forearm.L": [80, 0, 0]})],
        [TAU(T_E4), dict(hold_r, head=[4, 72, 0], neck=[0, 18, 0])],
        [t_ein - 0.05, dict(hold_r, head=[0, 40, 0], neck=[0, 10, 0])],
        # the shove that starts the leaf swinging, then in
        [t_ein + 0.08, {"upper_arm.R": [70, 0, 40], "forearm.R": [0, 0, 0], "hand.R": [-30, 0, 0], "spine": [-8, 0, 0]}, "snap"],
        [t_ein + 0.4, {"spine": [-10, 0, 0]}],
        [t_ein + 0.75, {"spine": [-4, 0, 0], "head": [6, 0, 0]}],
        # the last pull: both hands on the edge as it comes home
        [TAU_LATCH - 0.3, {"upper_arm.R": [80, 0, -10], "upper_arm.L": [80, 0, 10], "forearm.R": [10, 0, 0], "forearm.L": [10, 0, 0], "spine": [-10, 0, 0], "head": [6, 0, 0]}],
        [TAU_LATCH - 0.02, {"upper_arm.R": [70, 0, -12], "upper_arm.L": [70, 0, 12], "forearm.R": [30, 0, 0], "forearm.L": [30, 0, 0], "spine": [6, 0, 0], "head": [-2, 0, 0]}, "out"],
        [TAU_LATCH + 0.46, PRESS_POSE(0)], [TAU_LATCH + 0.75, PRESS_POSE(10)], [TAU_LATCH + 1.05, PRESS_POSE(-14)], [TAU_LAND + 1.0, PRESS_POSE(-14)],
    ]
    elf["pose"] = ep
    elf["face"] = [k for k in elf["face"] if k[0] < ta - 0.6] + [
        [ta, {"brow_angry": 0.5, "open": 0.5}],
        [ta + 0.5, {"brow_up": 0.8, "open": 0.3}],
        [TAU(T_SPRING) + 0.1, {"brow_up": 1.0, "open": 0.8, "smile": 0.3}],
        [t_ein, {"brow_angry": 0.6, "open": 0.4}],
        [TAU_LATCH - 0.3, {"brow_angry": 0.8, "squint": 0.6, "open": 0.2}],
        [TAU_LATCH + 0.5, {"brow_up": 0.8, "open": 0.0, "squint": 0.4}],
    ]
    # the two take another stride past the bush, then look back for the missing friend (as V2)
    for a, side in [(lead, 1), (elf, -1)]:
        pk = [k for k in a["pose"] if not (td - 0.05 < k[0] < td + 2.4)]
        pk += [[td + 0.32, {"spine": [-9, 0, 0]}], [td + 0.6, {"spine": [-4, 0, 0], "head": [0, 70 * side, 0], "neck": [0, 18 * side, 0]}],
               [td + 1.15, {"spine": [-4, 0, 0], "head": [0, 76 * side, 0], "neck": [0, 18 * side, 0]}], [td + 1.6, {"spine": [-9, 0, 0]}]]
        a["pose"] = sorted(pk, key=lambda k: k[0])
        fk = [k for k in a["face"] if not (td - 0.05 < k[0] < td + 2.4)]
        fk += [[td + 0.5, {"brow_up": 1.0, "open": 0.7}], [td + 1.0, {"brow_up": 1.0, "open": 0.9, "brow_angry": 0.2}], [td + 1.7, {"brow_up": 0.8, "open": 0.6}]]
        a["face"] = sorted(fk, key=lambda k: k[0])
    return actors


# ================================================================== THE CART
# The chase down the spine, past the bush (D2), west along the road, a
# U-turn, back east, and a slow turn north into the spine, searching: its
# beam rakes the bush and the snow the reindeer has just left (D3), then it
# crawls north up the path, away from the door.
CART_PTS = [CART_P, [4.4, 6.0], [1.6, 9.1], [-2.1, 11.6], [-5.0, 15.7], [-7.6, 19.4], [-7.95, 23.5], [-6.0, 27.5], [-2.7, 29.6],
            [-0.3, 31.7], [0.35, 36.0], [0.4, 50.0], [0.3, 66.0], [0.9, 69.0], [1.0, 75.0], [0.6, 81.0], [0.3, 85.2],
            [-1.6, 87.7], [-5.5, 88.3], [-10.5, 88.1], [-13.6, 88.7], [-14.7, 90.2], [-13.6, 91.2], [-10.0, 90.9],
            [-5.5, 90.4], [-2.3, 89.7], [-0.4, 88.4], [0.5, 86.4], [0.75, 84.0], [0.7, 80.0], [0.55, 72.0], [0.45, 60.0], [0.35, 45.0]]


def lead_pos(actors, tau):
    """the lead's (x, z) at tau from its route segment"""
    lead = actors[0]
    for sg in lead["segs"]:
        if sg["mode"] == "route" and sg["t0"] <= tau and len(sg["pts"]) > 8:
            r = Route(sg["pts"])
            return r.at(sg.get("s0", 0.0) + dist(sg["speed"], tau - sg["t0"]))
    return None


def s_near(route, p, lo=0.0, hi=1e9):
    idx = [i for i in range(len(route.pts)) if lo <= route.cum[i] <= hi]
    best = min(idx, key=lambda i: math.dist(route.pts[i], p))
    return route.cum[best]


def monotone(knots):
    ts = [k[0] for k in knots]
    ss = [k[1] for k in knots]
    n = len(ts)
    d = [(ss[i + 1] - ss[i]) / (ts[i + 1] - ts[i]) for i in range(n - 1)]
    m = [d[0]] + [(d[i - 1] + d[i]) / 2 if d[i - 1] * d[i] > 0 else 0.0 for i in range(1, n - 1)] + [d[-1]]
    for i in range(n - 1):
        if d[i] == 0:
            m[i] = m[i + 1] = 0
        else:
            al, be = m[i] / d[i], m[i + 1] / d[i]
            h = al * al + be * be
            if h > 9:
                tt = 3 / math.sqrt(h)
                m[i], m[i + 1] = tt * al * d[i], tt * be * d[i]
    def s_of(t):
        if t <= ts[0]:
            return ss[0]
        if t >= ts[-1]:
            return ss[-1] + m[-1] * (t - ts[-1])
        for i in range(n - 1):
            if t <= ts[i + 1]:
                h = ts[i + 1] - ts[i]
                u = (t - ts[i]) / h
                h00 = 2 * u ** 3 - 3 * u ** 2 + 1; h10 = u ** 3 - 2 * u ** 2 + u; h01 = -2 * u ** 3 + 3 * u ** 2; h11 = u ** 3 - u ** 2
                return h00 * ss[i] + h10 * h * m[i] + h01 * ss[i + 1] + h11 * h * m[i + 1]
    return s_of


def cart_plan(actors, A):
    cr = Route(CART_PTS)
    A["cart_route"] = cr
    t0c = TAU_L + 0.95
    s_bush_end = s_near(cr, [0.3, 85.2])
    def s_behind(tau, gap_s, nose=1.55):
        p = lead_pos(actors, tau - gap_s)
        return s_near(cr, p, 0.0, s_bush_end) - nose
    td = A["tau_dive"]
    knots = [(11.6, s_behind(11.6, 0.55)), (12.4, s_behind(12.4, 0.32)), (13.0, s_behind(13.0, 0.33)),
             (13.9, s_behind(13.9, 0.48)), (14.5, s_behind(14.5, 0.58)), (td, s_behind(td, 0.72)), (td + 0.8, s_behind(td + 0.8, 0.85))]
    L = s_bush_end
    def S(p, lo=None):
        return s_near(cr, p, L - 3.0 if lo is None else lo)
    # story tau (the bush clock and the lobby clock are one story: KD before the D2/E1a cut, KE after)
    # story tau (one story: the bush clock KD before the D2 -> E1a cut skips ahead to the lobby clock KE)
    su = S([-14.7, 90.2])
    R_ = lambda p: s_near(cr, p, su)
    knots += [(18.3, S([-1.6, 87.7])), (19.5, S([-10.5, 88.1])), (20.55, su), (21.4, R_([-10.0, 90.9])),
              (22.7, R_([-5.5, 90.4])), (23.45, R_([-2.3, 89.7])), (23.9, R_([-0.4, 88.4])), (24.45, R_([0.5, 86.4])),
              (25.1, R_([0.75, 84.0])), (26.35, R_([0.7, 80.0])), (28.75, R_([0.55, 72.0])), (32.55, R_([0.45, 60.0]))]
    a = 3.6
    def s_acc(t):
        u = max(0.0, t - (t0c + 0.25))
        tv = 9.8 / a
        return 0.5 * a * u * u if u < tv else 0.5 * a * tv * tv + 9.8 * (u - tv)
    pts = [(t0c + 0.25 + i * 0.25, s_acc(t0c + 0.25 + i * 0.25)) for i in range(0, 22)]
    pts = [p for p in pts if p[0] < 10.4]
    pts += [k for k in knots if k[0] > 10.4]
    pts.sort()
    s_of = monotone(pts)
    keys = [[0.0, 0.0]]
    step = 0.1
    t = t0c
    acc_s = 0.0
    v_prev = 0.0
    while t < TAU(33.4):
        target = s_of(t + step) - s_of(t0c)
        v_new = max(0.0, 2 * (target - acc_s) / step - v_prev)
        keys.append([round(t + step - t0c, 4), round(v_new, 4)])
        acc_s += (v_prev + v_new) * 0.5 * step
        v_prev = v_new
        t += step
    # smooth the trapezoid ping-pong (keeps the integral to within mm)
    for _ in range(2):
        keys = [keys[0]] + [[keys[i][0], round((keys[i - 1][1] + 2 * keys[i][1] + keys[i + 1][1]) / 4, 4)] for i in range(1, len(keys) - 1)] + [keys[-1]]
    A["cart_vmax"] = max(k[1] for k in keys)
    def cart_xz(tau):
        return cr.at(s_of(t0c) + dist(keys, tau - t0c))
    A["cart_xz"] = cart_xz
    # when the cart passes the bush (the rake, D2)
    tt = td
    while cart_xz(tt)[1] < 75.5 and tt < td + 4:
        tt += 0.01
    A["t_rake"] = tt
    cart = {"id": "cart", "index": 0, "pts": CART_PTS, "t0": t0c, "s0": s_of(t0c), "speed": keys,
            "headlights": [[-20.0, 0.0], [TAU_L - 0.001, 0.0], [TAU_L, 1.0]],
            "beacon": [[-20.0, 0.0], [TAU_L + 0.12, 0.0], [TAU_L + 0.13, 1.0]],
            "steer_k": [[t0c, 0.0], [t0c + 0.08, 0.0], [t0c + 0.26, -1.0]], "steer_until": t0c + 0.55,
            "hl_opts": {"energy": 6.0, "range": 30.0, "angle": 27.0, "tilt": 5.0, "beam_len": 11.0, "beam_radius": 2.2, "beam_glow": 0.1, "glare": 0.5}}
    officer = {
        "id": "officer", "role": "watch", "look": WATCH,
        "segs": [{"mode": "cart", "t0": -20.0, "cart": "cart"}],
        "pose": [[-20.0, {"head": [-4, 0, 0]}], [TAU_L - 0.3, {"head": [-4, 0, 0]}], [TAU_L + 0.4, {"head": [-2, 0, 0], "spine": [-6, 0, 0]}],
                 # searching on the way back: the head turning toward the bush
                 [TAU(23.4), {"head": [-2, 0, 0]}], [TAU(23.9), {"head": [-4, -30, 0], "neck": [0, -8, 0]}], [TAU(24.8), {"head": [-4, 10, 0]}]],
        "face": [[-20.0, {"brow_angry": 0.4, "squint": 0.3}]],
    }
    return cart, officer


# body-local [x, y, z, scale] (radius = scale / 2): the reindeer's face sits in a gap on the west side
CLUMPS = {"0": [0.4, 0.62, 0.0, 1.45], "2": [-0.86, 0.36, -0.2, 0.86], "6": [-0.62, 1.0, -0.32, 0.86], "4": [-0.72, 0.5, 0.48, 0.74]}


def bush_prop(A, **extra):
    d = {"kind": "bush", "id": "bush", "pos": [BUSH[0], BUSH[1]], "snowy": True, "yaw": 0.0, "clump_xf": CLUMPS,
         "rustle": [A["tau_dive"] + 0.36, TAU(T_PUSH), TAU(T_SPRING)],
         "puffs": [[A["tau_dive"] + 0.38, 1.2, 0.3, 1.0, 0.0], [TAU(T_SPRING) + 0.02, 0.7, -0.6, 0.6, 0.2]],
         "tremble": [[TAU(T_PUSH) - 0.1, 0.0], [TAU(T_PUSH) + 0.05, 0.5], [TAU(T_SPRING) + 0.25, 0.7], [TAU(T_SPRING) + 0.8, 0.0]],
         # the branch on the reindeer's way out (the west clump): pushed aside, it springs back; its snow slides off after
         "branch": {"clump": 2, "pivot": [0.25, 0.1, 0.0],
                    "yaw": [[TAU(T_PUSH) - 0.05, 0.0], [TAU(T_PUSH) + 0.2, 38.0], [TAU(T_SPRING) + 0.08, 44.0], [TAU(T_SPRING) + 0.26, -9.0], [TAU(T_SPRING) + 0.42, 5.0], [TAU(T_SPRING) + 0.6, 0.0]],
                    "tilt": [[TAU(T_PUSH) - 0.05, 0.0], [TAU(T_PUSH) + 0.2, -10.0], [TAU(T_SPRING) + 0.26, 4.0], [TAU(T_SPRING) + 0.6, 0.0]],
                    "drop": TAU(T_BSNOW), "drop_dir": [-0.5, 0.0, 0.25], "puff": 0.4}}
    d.update(extra)
    return d


# ================================================================= THE SHOTS
def build():
    actors, A = story()
    cart, officer = cart_plan(actors, A)
    ending(actors, A)
    dep = departure()
    campus = {"world": "campus", "trees": [[-13.0, 52.0, 3.4, 0.4]], "active_waters": [], "auto_ground": True}
    room = {"xmas_room": True, "room_opts": {}, "snow_clip": [-22.0, -2.0, 103.05, 22.0, 6.0, 113.0]}
    dorm_lights = [
        {"type": "omni", "pos": [-1.5, 2.9, 108.6], "color": [1.0, 0.78, 0.55], "energy": 1.1, "range": 9.0, "atten": 1.2},
        {"type": "omni", "pos": [-3.2, 1.0, 104.4], "color": [1.0, 0.7, 0.45], "energy": 0.9, "range": 4.0},
        {"type": "omni", "pos": [0.0, 2.9, 102.2], "color": [1.0, 0.82, 0.6], "energy": 1.6, "range": 5.0},
    ]
    # the drift on the spine (C3): smaller than V2's, on Blue's lane, pavement showing round it
    zp = lead_pos(actors, 13.55)[1] + 1.2
    A["patch_z"] = zp
    drift = {"kind": "snowpatch", "id": "drift", "pos": [-0.9, 59.95], "y": 0.07, "rx": 0.95, "rz": 0.85, "yaw": 0.06, "seed": 11}
    bsnow = {"kind": "snowpatch", "id": "bsnow", "pos": [SNOW_B[0], SNOW_B[1]], "y": 0.0, "rx": 1.1, "rz": 0.85, "yaw": 0.3, "seed": 5}
    story_set = dict(campus)
    story_set.update({"actors": actors + [officer], "carts": [cart], "props": [bush_prop(A), drift, bsnow]})
    end_set = dict(story_set)
    end_set.update(room)
    end_set["doors"] = {"L": door_l_keys(A)}
    shots = {}
    edl = []

    def hl(shot, energy, glare=0.5, glow=0.1, **kw):
        c = copy.deepcopy(shot["carts"][0])
        c["hl_opts"].update({"energy": energy, "glare": glare, "beam_glow": glow})
        c["hl_opts"].update(kw)
        shot["carts"] = [c]

    def add(sid, T0, T1, shot, fps=30):
        shot = copy.deepcopy(shot)
        shot["dur"] = round(T1 - T0, 4)
        shots[sid] = shot
        edl.append([sid, round(T0, 4), round(T1 - T0, 4), fps])

    # ---- A1 0:00-0:02.9 the warm lobby; the elf at the glass door; out (as V2)
    a1 = dict(campus)
    a1.update(room)
    a1.update({"actors": dep, "doors": {"R": DOOR_OUT}, "tau0": 0.0, "lights": dorm_lights, "exposure": 0.92})
    a1["cam"] = [
        {"t": 0.0, "pos": [1.55, 1.42, 110.7], "at": [0.2, 1.28, 103.2], "fov": 44.0},
        {"t": 1.4, "pos": [1.4, 1.34, 109.6], "at": [0.2, 1.2, 103.0], "fov": 42.0},
        {"t": T_CUT_OUT, "pos": [0.95, 1.12, 106.9], "at": [0.25, 0.85, 100.8], "fov": 40.0, "ease": "in"},
    ]
    add("v3_a1_lobby", 0.0, T_CUT_OUT, a1)
    # ---- A2 the rim, the slipper coming in, the landing: side-on along the rim, low
    a2 = dict(story_set)
    a2["tau0"] = T_CUT_OUT - FT
    a2["cam"] = [{"t": 0.0, "pos": [3.15, 0.8, 14.75], "at": [0.8, 0.74, 15.4], "fov": 40.0},
                 {"t": 1.0, "pos": [3.1, 0.8, 14.85], "at": [0.8, 0.76, 15.45], "fov": 39.0}]
    add("v3_a2_rim", T_CUT_OUT, 3.9, a2)
    # ---- A3 from the water: the toe test, the recoil, the friends (as V2)
    a3 = dict(story_set)
    a3["tau0"] = 3.9 - FT
    a3["cam"] = [{"t": 0.0, "pos": [3.35, 0.8, 18.35], "at": [0.55, 0.75, 14.6], "fov": 40.0},
                 {"t": 1.3, "pos": [3.3, 0.85, 18.3], "at": [0.6, 0.8, 14.0], "fov": 41.0},
                 {"t": 2.5, "pos": [3.2, 0.95, 18.25], "at": [0.6, 0.9, 13.6], "fov": 43.0}]
    add("v3_a3_toe_test", 3.9, 6.0, a3)
    # ---- B1 the three by the fountain; CLICK; the beam: shadows, eyes, the reactions in order
    a4 = dict(story_set)
    a4["tau0"] = 6.0 - FT
    a4["cam"] = [{"t": 0.0, "pos": [-1.75, 0.95, 10.2], "at": [1.2, 1.0, 15.9], "fov": 46.0},
                 {"t": 2.0, "pos": [-1.6, 0.93, 10.45], "at": [1.2, 1.0, 15.9], "fov": 45.0},
                 {"t": 3.3, "pos": [-1.55, 0.93, 10.5], "at": [0.0, 1.0, 16.2], "fov": 45.0}]
    add("v3_b1_three", 6.0, T_LIGHT, a4)
    # ---- B1b cut on the light: the reverse, into the beam: lit faces, the eyes catching it, shadows thrown behind
    b1b = dict(story_set)
    b1b["tau0"] = T_LIGHT - FT
    b1b["cam"] = [{"t": 0.0, "pos": [3.7, 0.95, 10.9], "at": [0.75, 0.85, 14.5], "fov": 42.0},
                  {"t": 1.2, "pos": [3.6, 0.95, 11.0], "at": [0.3, 0.85, 14.6], "fov": 43.0}]
    hl(b1b, 8.0, 0.35, 0.05)
    b1b["exposure"] = 0.86
    add("v3_b1b_beam", T_LIGHT, 9.2, b1b)
    # ---- B2 low on the front wheel (as V2)
    b2 = dict(story_set)
    b2["tau0"] = 9.2 - FT
    b2["cam"] = [{"t": 0.0, "pos": {"rel": "cart", "tau": 9.2 - FT, "off": [-3.1, 0.4, -1.3]}, "at": {"rel": "cart", "tau": 9.2 - FT, "off": [-0.6, 0.38, -0.95]}, "fov": 42.0},
                 {"t": 0.75, "pos": {"rel": "cart", "tau": 9.2 - FT, "off": [-3.15, 0.4, -1.4]}, "at": {"rel": "cart", "tau": 9.2 - FT, "off": [-0.4, 0.45, -2.6]}, "fov": 43.0}]
    add("v3_b2_wheels", 9.2, 9.9, b2)
    # ---- C1 wide around the fountain (as V2)
    c1 = dict(story_set)
    c1["tau0"] = 9.9 - FT
    c1["cam"] = [{"t": 0.0, "pos": [-17.5, 3.8, 26.0], "at": [-5.5, 0.6, 19.0], "fov": 44.0},
                 {"t": 2.35, "pos": [-16.8, 3.3, 31.0], "at": [-6.0, 0.7, 26.0], "fov": 42.0}]
    hl(c1, 10.0, 0.6, 0.12)
    add("v3_c1_round", 9.9, 12.0, c1)
    # ---- C2 alongside (as V2; rendered natively at 30)
    c2 = dict(story_set)
    c2["tau0"] = 9.6
    c2["cam"] = [{"t": 0.0, "pos": {"rel": "lead", "off": [3.5, 0.72, 0.4], "yaw_fixed": 180.0, "base_y": 0.0}, "at": {"rel": "lead", "off": [0.0, 0.75, 0.35], "yaw_fixed": 180.0, "base_y": 0.0}, "fov": 52.0},
                 {"t": 2.1, "pos": {"rel": "lead", "off": [3.2, 0.7, 0.5], "yaw_fixed": 180.0, "base_y": 0.0}, "at": {"rel": "lead", "off": [0.0, 0.72, 0.5], "yaw_fixed": 180.0, "base_y": 0.0}, "fov": 52.0}]
    hl(c2, 4.5, 0.4, 0.04)
    add("v3_c2_alongside", 12.0, T_HANDOFF, c2)
    # ---- C2b the cart on Blue's heels (as V2; native 30)
    c2b = dict(story_set)
    c2b["tau0"] = 11.45
    c2b["cam"] = [{"t": 0.0, "pos": {"rel": "lead", "off": [2.4, 0.6, -3.6], "yaw_fixed": 180.0, "base_y": 0.0}, "at": {"rel": "lead", "off": [0.2, 0.95, 2.2], "yaw_fixed": 180.0, "base_y": 0.0}, "fov": 46.0},
                  {"t": 15.4 - T_HANDOFF, "pos": {"rel": "lead", "off": [2.2, 0.55, -3.2], "yaw_fixed": 180.0, "base_y": 0.0}, "at": {"rel": "lead", "off": [0.2, 0.95, 2.4], "yaw_fixed": 180.0, "base_y": 0.0}, "fov": 46.0}]
    hl(c2b, 8.0, 0.55, 0.11)
    add("v3_c2b_gain", T_HANDOFF, 15.4, c2b)
    # ---- C3 low beside the path: one slipper strikes the drift, the weight rolls over it, the tyre follows
    c3 = dict(story_set)
    c3["tau0"] = C3_TAU0
    c3["cam"] = [{"t": 0.0, "pos": [C3_CAM[0], C3_CAM[1], C3_CAM[2]], "at": [C3_AT[0], C3_AT[1], C3_AT[2]], "fov": 32.0},
                 {"t": 1.6, "pos": [C3_CAM[0], C3_CAM[1], C3_CAM[2] + 0.1], "at": [C3_AT[0], C3_AT[1], C3_AT[2] + 0.15], "fov": 32.0}]
    hl(c3, 6.0, 0.5, 0.06)
    add("v3_c3_prints", 15.4, 17.0, c3)
    # ---- D1 side-on past the bush: the idea, the dive (as V2)
    d1 = dict(story_set)
    d1["tau0"] = TAUD(17.0)
    d1["cam"] = [{"t": 0.0, "pos": [-6.0, 1.0, 71.9], "at": [2.4, 0.85, 73.2], "fov": 40.0},
                 {"t": 1.0, "pos": [-5.9, 0.98, 72.5], "at": [2.8, 0.85, 74.4], "fov": 40.0}]
    add("v3_d1_dive", 17.0, 18.0, d1)
    # ---- D2 into the foliage: one eye and one antler through a gap; the beam goes by; the eye finds the door
    d2 = dict(story_set)
    d2["tau0"] = TAUD(18.0)
    d2["cam"] = [{"t": 0.0, "pos": D2_CAM, "at": D2_AT, "fov": 38.0},
                 {"t": 2.6, "pos": [D2_CAM[0] + 0.08, D2_CAM[1], D2_CAM[2]], "at": D2_AT, "fov": 35.0}]
    add("v3_d2_eye", 18.0, 20.6, d2)
    # ---- E1a inside the door: two arrive; the elf catches the leaf; Blue steps back out, searching
    e1 = dict(end_set)
    e1["tau0"] = TAU(T_E1A)
    e1["lights"] = dorm_lights
    e1["exposure"] = 0.95
    e1["cam"] = [{"t": 0.0, "pos": [-0.35, 1.18, 107.2], "at": [-0.45, 0.95, 98.5], "fov": 36.0},
                 {"t": T_D3 - T_E1A, "pos": [-0.35, 1.18, 107.05], "at": [-0.45, 0.95, 98.0], "fov": 35.0}]
    hl(e1, 4.5, 0.22, 0.08)
    add("v3_e1a_door", T_E1A, T_D3, e1)
    # ---- D3 the bush, three-quarter: sees Blue, the branch, the foot, the spring; two strides; the beam on the empty snow
    d3 = dict(story_set)
    d3["tau0"] = TAU(T_D3)
    d3["cam"] = D3_CAM
    hl(d3, 20.0, 0.3, 0.035, range=42.0, angle=20.0)
    add("v3_d3_out", T_D3, T_E4, d3)
    # ---- E4 the threshold: the face, the hand, the catch, the pull, the door swung shut, the latch
    e4 = dict(end_set)
    e4["tau0"] = TAU(T_E4)
    e4["lights"] = dorm_lights
    e4["cam"] = E4_CAM
    hl(e4, 4.5, 0.3, 0.08)
    add("v3_e4_catch", T_E4, T_E2, e4)
    # ---- E2 backs to the door, listening
    e2 = dict(end_set)
    e2["tau0"] = TAU(T_E2)
    e2["lights"] = dorm_lights
    e2["cam"] = [{"t": 0.0, "pos": [1.25, 1.12, 106.5], "at": [0.2, 1.0, 103.6], "fov": 40.0},
                 {"t": 0.7, "pos": [1.2, 1.12, 106.42], "at": [0.2, 1.0, 103.6], "fov": 39.0}]
    add("v3_e2_listen", T_E2, T_E3, e2)
    # ---- E3 the slippers and the hooves on the mat; the clump lands between them
    e3 = dict(end_set)
    e3["tau0"] = TAU(T_E3)
    e3["lights"] = dorm_lights
    e3["cam"] = [{"t": 0.0, "pos": E3_CAM, "at": E3_AT, "fov": 36.0},
                 {"t": 0.45, "pos": E3_CAM, "at": E3_AT, "fov": 36.0}]
    add("v3_e3_snow", T_E3, T_TITLE, e3)

    json.dump(r3(shots), open(OUT_JSON, "w"), indent=1)
    info = {k: (r3(v) if not isinstance(v, Route) and not callable(v) else None) for k, v in A.items()}
    info.update({"T_CUT_OUT": T_CUT_OUT, "T_LIGHT": T_LIGHT, "T_STEP": T_STEP, "T_DIVE": T_DIVE, "T_LATCH": T_LATCH, "T_LAND": T_LAND,
                 "T_TITLE": T_TITLE, "T_HANDOFF": T_HANDOFF, "FT": FT, "KD": KD, "KE": KE, "T_D3": T_D3, "T_PUSH": T_PUSH, "T_PLANT": T_PLANT,
                 "T_SPRING": T_SPRING, "T_BSNOW": T_BSNOW, "T_E4": T_E4, "T_CATCH": T_CATCH, "T_IN": T_IN, "T_E2": T_E2, "T_E3": T_E3, "T_E1A": T_E1A})
    json.dump({"fps": 30, "dur": 33.0, "clips": edl, "logo": T_TITLE, "info": info}, open(OUT_EDL, "w"), indent=1)
    return shots, edl, A


# camera blocking (tuned on stills)
C3_TAU0 = 13.25
C3_CAM = [-3.0, 0.45, 59.3]
C3_AT = [-0.95, 0.1, 60.0]
D2_CAM = [3.45, 0.8, 75.95]
D2_AT = [5.0, 0.8, 75.55]
D3_CAM = [{"t": 0.0, "pos": [-1.0, 0.95, 76.7], "at": [4.6, 0.8, 75.95], "fov": 34.0},
          {"t": T_SPRING - T_D3, "pos": [-1.0, 0.95, 76.7], "at": [4.3, 0.76, 76.1], "fov": 34.0},
          {"t": T_SPRING + 0.5 - T_D3, "pos": [-1.05, 0.95, 76.72], "at": [3.0, 0.68, 77.9], "fov": 37.0},
          {"t": T_E4 - T_D3, "pos": [-1.1, 0.95, 76.75], "at": [3.0, 0.66, 78.1], "fov": 37.0}]
E4_CAM = [{"t": 0.0, "pos": [-1.2, 1.06, 105.5], "at": [-0.2, 0.95, 97.5], "fov": 30.0},
          {"t": T_CATCH - 0.45 - T_E4, "pos": [-1.15, 1.04, 105.3], "at": [-0.35, 0.9, 100.2], "fov": 26.0},
          {"t": T_CATCH + 0.05 - T_E4, "pos": [-1.12, 1.02, 105.2], "at": [-0.38, 0.86, 101.05], "fov": 21.0},
          {"t": T_IN - 0.15 - T_E4, "pos": [-1.25, 1.05, 105.45], "at": [-0.1, 0.95, 102.2], "fov": 42.0},
          {"t": T_LATCH - 0.5 - T_E4, "pos": [-1.35, 1.06, 105.55], "at": [-0.85, 1.05, 102.8], "fov": 44.0},
          {"t": T_E2 - T_E4, "pos": [-1.35, 1.06, 105.55], "at": [-0.85, 1.05, 102.85], "fov": 44.0}]
E3_CAM = [0.3, 0.2, 104.85]
E3_AT = [0.66, 0.13, 103.8]


if __name__ == "__main__":
    shots, edl, A = build()
    for k, v in A.items():
        if isinstance(v, (int, float)):
            print(k, round(v, 3))
    for c in edl:
        print(c)
