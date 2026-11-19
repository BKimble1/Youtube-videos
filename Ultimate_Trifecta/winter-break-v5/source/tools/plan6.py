#!/usr/bin/env python3
"""Ultimate Trifecta - Season 1: Winter Break, V4 (33 s cinematic short).

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
OUT_EDL = "/home/user/ut/work/edl6.json"
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
KE = 0.1               # tau = T + KE from the bush close-up on (V5)
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
LEAD_STOP = [0.35, 101.2]   # Blue's stop at the door, clear of the leaf's swing
LEAD_BACK = [0.1, 101.6]    # one step back toward the courtyard, looking
ELF_DOOR = [0.6, 102.4]     # the elf, arriving at the R leaf's handle
ELF_P = [-0.5, 14.15]
EFB = [0.2, 14.42]          # V5: the elf steps in for the three-way fist bump
DFB = [1.45, 14.37]         # ... and the reindeer
FB_C = [0.83, 0.98, 14.5]   # where the three fists would meet
ELF_GRAB = [0.1, 14.45]
DEER_P = [1.95, 13.95]
CART_P = [0.9, 3.2]          # V4: parked on the paved north path, facing south at the friends


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
        "elf": [EFB] + ring(9.5, -20, -158)[0:] + [[lane["elf"] - 0.6, 33.6], [lane["elf"], 37.5]],
        "lead": [LEAD_P, [-0.6, 13.4]] + ring(10.3, -24, -160)[0:] + [[lane["lead"] - 0.8, 33.9], [lane["lead"], 38.0]],
        "deer": [DFB, [1.05, 13.85]] + ring(8.8, -10, -156) + [[lane["deer"] - 0.4, 32.0], [lane["deer"], 37.0]],
    }
    start = {"elf": TAU_L + 0.25, "lead": TAU_L + 0.38, "deer": TAU_L + 0.62}
    accel = {"elf": [[0.0, 0.0], [0.22, 3.8], [0.9, 6.4], [1.6, 7.0]],
             "lead": [[0.0, 0.0], [0.25, 3.4], [1.0, 6.2], [1.75, 6.9]],
             # the reindeer: half a stride lost in the turn, then hard after them
             "deer": [[0.0, 0.0], [0.3, 1.6], [0.5, 1.8], [0.9, 5.2], [1.6, 7.3]]}
    # deer: run to the takeoff point beside the bush, dive at tau(T_DIVE)
    tau_dive = TAUD(T_DIVE)
    A["tau_dive"] = tau_dive
    to_pt = [2.75, 73.55]
    deer_pts = arc["deer"] + [[lane["deer"], 45.0], [lane["deer"], 61.5], [1.25, 68.0], [1.9, 71.7], to_pt]
    dr = Route(deer_pts)
    deer_keys = solve_v(accel["deer"], dr.length, tau_dive - start["deer"])
    A["deer_v"] = deer_keys[-1][1]
    # the two others: lanes to the bush, a stride on, the look back, then on to the door
    tau_door = 19.5             # V5: the elf at the door (the cart is stopped at the bollards behind them)
    A["tau_door"] = tau_door
    two = {}
    for who, door_pt in [("elf", ELF_DOOR), ("lead", LEAD_STOP)]:
        # V5: through the gaps in the two bollard rows (z 84.5 and 91.8)
        gaps = {"lead": [[-0.75, 84.5], [-0.3, 88.0], [0.0, 91.8], [0.25, 97.0]], "elf": [[0.75, 84.5], [1.1, 88.0], [1.5, 91.8], [1.0, 97.5]]}[who]
        pts = arc[who] + [[lane[who], 45.0], [lane[who], 62.0], [lane[who], 78.0]] + gaps + [door_pt]
        r = Route(pts)
        # the realisation: easing off a beat after the dive, then on again
        t_s = start[who]
        t_dv = tau_dive - t_s
        k_head = copy.deepcopy(accel[who])
        # cruise speed to be at the dive moment just past the bush (z ~ 79.5)
        s_bush = r.s_at_z(71.8 if who == "elf" else 71.2)
        if who == "lead":
            # V5: after the glance back in C2b (tau ~12.1): two harder strides
            tb = 12.1 - t_s
            lo2, hi2 = 3.0, 12.0
            for _ in range(60):
                vv = (lo2 + hi2) / 2
                kk = k_head + [[k_head[-1][0] + 0.6, vv], [tb, vv], [tb + 0.15, vv * 1.16], [tb + 0.6, vv * 1.16], [tb + 0.9, vv]]
                if dist(kk, t_dv) < s_bush:
                    lo2 = vv
                else:
                    hi2 = vv
            k = kk
        else:
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
            # laughing it off: the fist bump coming together (right fist, IK below)
            [3.85, {"upper_arm.L": [20, 0, 10], "forearm.L": [60, 0, 0], "upper_arm.R": [60, 0, -10], "forearm.R": [60, 0, 0], "head": [-4, 0, 0], "spine": [-4, 0, 0]}],
            [4.3, {"upper_arm.L": [20, 0, 10], "forearm.L": [50, 0, 0], "upper_arm.R": [70, 0, -10], "forearm.R": [40, 0, 0], "head": [-4, 0, 0], "spine": [-6, 0, 0]}],
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
            # V5: one quick look over the shoulder in C2b (the cart right there), then lower and harder: two strong strides
            [11.78, {"spine": [-9, 0, 0]}],
            [11.9, {"spine": [-4, -16, 0], "head": [0, -70, 0], "neck": [0, -20, 0]}],
            [12.04, {"spine": [-4, -16, 0], "head": [2, -72, 0], "neck": [0, -20, 0]}],
            [12.14, {"spine": [-28, 0, 0], "chest": [-6, 0, 0], "head": [-8, 0, 0], "upper_arm.L": [40, 0, -10], "upper_arm.R": [-40, 0, 10], "forearm.L": [70, 0, 0], "forearm.R": [70, 0, 0]}, "snap"],
            [12.34, {"spine": [-30, 0, 0], "chest": [-6, 0, 0], "head": [-8, 0, 0], "upper_arm.L": [-44, 0, -10], "upper_arm.R": [44, 0, 10], "forearm.L": [70, 0, 0], "forearm.R": [70, 0, 0]}],
            [12.54, {"spine": [-30, 0, 0], "chest": [-6, 0, 0], "head": [-8, 0, 0], "upper_arm.L": [44, 0, -10], "upper_arm.R": [-44, 0, 10], "forearm.L": [70, 0, 0], "forearm.R": [70, 0, 0]}],
            [12.74, {"spine": [-28, 0, 0], "chest": [-5, 0, 0], "head": [-6, 0, 0], "upper_arm.L": [-36, 0, -10], "upper_arm.R": [36, 0, 10]}],
            [13.4, {"spine": [-16, 0, 0]}],
            [14.6, {"spine": [-9, 0, 0]}],
        ],
        "face": [
            [-0.3, {}],
            [0.4, {"brow_up": 0.4, "open": 0.15}],
            [0.95, {"brow_up": 0.7, "open": 0.3, "squint": 0.2}],
            [1.12, {"brow_up": 1.0, "open": 0.9, "squint": 0.85}, "snap"],
            [1.6, {"brow_up": 0.6, "open": 0.45, "squint": 0.5}],
            [2.5, {"brow_up": 0.5, "smile": 0.4, "open": 0.1}],
            [3.6, {"smile": 1.0, "squint": 0.55, "brow_up": 0.4, "open": 0.4}],
            [TAU_L - 0.02, {"smile": 0.6, "squint": 0.3}],
            [TAU_L + 0.15, {"smile": 0.6, "squint": 0.3}],
            [TAU_L + 0.19, {"squint": 1.0, "brow_angry": 0.5, "open": 0.35, "smile": 0.0}, "snap"],
            [TAU_L + 0.55, {"squint": 0.9, "brow_up": 0.6, "open": 0.6}],
            [start["lead"], {"brow_up": 1.0, "open": 0.85, "squint": 0.4}],
            [start["lead"] + 1.5, {"brow_up": 0.8, "open": 0.6, "squint": 0.3}],
            [11.82, {"brow_up": 0.8, "open": 0.6}],
            [11.96, {"brow_up": 1.0, "open": 1.0, "squint": 0.1}],
            [12.14, {"brow_angry": 0.9, "squint": 0.6, "open": 0.55, "brow_up": 0.0}, "snap"],
            [13.8, {"brow_angry": 0.6, "squint": 0.4, "open": 0.5}],
        ],
    }
    # ---------------------------------------------------------------- the elf
    elf = {
        "id": "elf", "role": "runner", "look": ELF, "towel": TOWEL, "fast_at": 5.0,
        "segs": [
            {"mode": "hold", "t0": -9.0, "pos": [ELF_P[0], 0.0, ELF_P[1]], "yaw": PI - 0.45},
            arrive({"mode": "route", "t0": 3.45, "pts": [ELF_P, EFB], "speed": [[0.0, 0.0], [0.15, 2.4], [0.38, 2.0], [0.55, 0.0]], "rest_yaw": yaw_to(EFB, FB_C[::2])}),
            {"mode": "hold", "t0": 4.0, "pos": [EFB[0], 0.0, EFB[1]], "yaw": yaw_to(EFB, [FB_C[0], FB_C[2]])},
            {"mode": "route", "t0": start["elf"], "pts": two["elf"]["pts"], "speed": two["elf"]["keys"]},
            {"mode": "hold", "t0": A["elf_arrive"], "pos": [ELF_DOOR[0], 0.0, ELF_DOOR[1]], "yaw": PI},
        ],
        "fx": [
            {"type": "turn", "t": 1.95, "dur": 0.4, "face": [LEAD_P[0], LEAD_P[1] + 0.2], "until": 3.0},
            {"type": "emote", "name": "laugh", "t": 2.55, "dur": 1.4},
            {"type": "turn", "t": TAU_L + 0.03, "dur": 0.12, "face": CART_P, "until": TAU_L + 0.25},
        ],
        "pose": [
            [-9.0, {}],
            [2.0, {}],
            # the fist bump coming together (the right fist, IK below), laughing
            [3.75, {"upper_arm.R": [60, 0, 10], "forearm.R": [60, 0, 0], "spine": [-4, 0, 0], "head": [-4, 0, 0]}],
            [TAU_L - 0.02, {"upper_arm.R": [70, 0, 10], "forearm.R": [40, 0, 0], "spine": [-8, 0, 0], "head": [-4, 0, 0]}],
            # the light: first to see it - the head snaps round, the body drops to go
            [TAU_L + 0.07, {"head": [8, 0, 0], "spine": [5, 0, 0], "upper_arm.L": [40, 0, 10], "forearm.L": [60, 0, 0]}, "snap"],
            [TAU_L + 0.2, {"spine": [-14, 0, 0], "head": [2, 0, 0], "thigh.L": [30, 0, 0], "shin.L": [-30, 0, 0], "upper_arm.L": [-30, 0, 20]}],
            [start["elf"] + 0.05, {"upper_arm.L": [-40, 0, 28], "forearm.L": [5, 0, 0], "spine": [-18, 0, 0], "head": [0, 20, 0]}],
            [start["elf"] + 0.55, {"upper_arm.L": [-35, 0, 22], "forearm.L": [10, 0, 0], "spine": [-14, 0, 0], "head": [0, 10, 0]}],
            [start["elf"] + 0.85, {"spine": [-10, 0, 0]}],
            [start["elf"] + 2.0, {"spine": [-9, 0, 0], "forearm.L": [20, 0, 0], "forearm.R": [20, 0, 0]}],
        ],
        "face": [[-9.0, {"smile": 0.6}], [2.5, {"smile": 1.0, "squint": 0.7, "open": 0.6}], [4.0, {"smile": 0.7, "squint": 0.4}],
                 [3.6, {"smile": 1.0, "squint": 0.5, "open": 0.5}], [TAU_L - 0.02, {"smile": 0.9, "squint": 0.4, "open": 0.4}],
                 [TAU_L + 0.035, {"squint": 0.9, "brow_up": 0.6, "open": 0.5, "smile": 0.0}, "snap"],
                 [TAU_L + 0.4, {"brow_angry": 0.7, "open": 0.4, "squint": 0.3}], [start["elf"] + 1.0, {"brow_angry": 0.6, "open": 0.5}]],
    }
    # the elf's hand on Blue's sleeve: from the grab until the lanes part
    # V5: the three fists coming together; the light stops them a hand's width short
    elf["reach"] = [{"arm": "R", "pole": [0.6, -1.0, 0.2], "to": {"pos": [FB_C[0] - 0.07, FB_C[1], FB_C[2] - 0.01]},
                     "w": [[3.85, 0.0], [4.25, 1.0], [TAU_L + 0.04, 1.0], [TAU_L + 0.14, 0.0]]},
                    # ... and the elf's hand finds Blue's sleeve on the way out: Blue goes with the elf
                    {"arm": "R", "pole": [0.6, -1.0, 0.2], "to": {"actor": "lead", "bone": "forearm.L", "to_bone": "hand.L", "u": 0.35},
                     "w": [[TAU_L + 0.12, 0.0], [TAU_L + 0.22, 1.0], [start["elf"] + 0.32, 1.0], [start["elf"] + 0.55, 0.0]]}]
    # ---------------------------------------------------------------- the deer
    deer = {
        "id": "deer", "role": "runner", "look": DEER, "fast_at": 5.0,
        "segs": [
            {"mode": "hold", "t0": -9.0, "pos": [DEER_P[0], 0.0, DEER_P[1]], "yaw": PI + 0.5},
            arrive({"mode": "route", "t0": 3.5, "pts": [DEER_P, DFB], "speed": [[0.0, 0.0], [0.15, 2.2], [0.38, 1.8], [0.55, 0.0]], "rest_yaw": yaw_to(DFB, [FB_C[0], FB_C[2]])}),
            {"mode": "hold", "t0": 4.05, "pos": [DFB[0], 0.0, DFB[1]], "yaw": yaw_to(DFB, [FB_C[0], FB_C[2]])},
            {"mode": "route", "t0": start["deer"], "pts": deer_pts, "speed": deer_keys},
        ],
        "fx": [
            {"type": "turn", "t": 1.85, "dur": 0.3, "face": [LEAD_P[0], LEAD_P[1]], "until": 3.5},
            # late, and half a stride lost in the turn
            {"type": "turn", "t": TAU_L + 0.32, "dur": 0.28, "face": CART_P, "until": start["deer"]},
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
            # the fist bump (right fist, IK below)
            [3.8, {"upper_arm.R": [60, 0, 10], "forearm.R": [60, 0, 0], "spine": [-6, 0, 0], "head": [-4, 0, 0]}],
            [TAU_L - 0.02, {"upper_arm.R": [70, 0, 10], "forearm.R": [40, 0, 0], "spine": [-8, 0, 0], "head": [-2, 0, 0]}],
            [TAU_L + 0.26, {"upper_arm.R": [70, 0, 10], "forearm.R": [40, 0, 0], "spine": [-6, 0, 0], "head": [-2, 0, 0]}],
            [TAU_L + 0.36, {"head": [12, 0, 0], "spine": [8, 0, 0], "upper_arm.L": [50, 0, 20], "upper_arm.R": [50, 0, -20], "forearm.L": [80, 0, 0], "forearm.R": [80, 0, 0]}, "snap"],
            [start["deer"] - 0.1, {"head": [6, 20, 0], "spine": [4, 0, 0], "upper_arm.L": [40, 0, 10], "upper_arm.R": [40, 0, -10]}],
            # the half stride lost: a skid on the turn, the knee buckling, arms out for balance
            [start["deer"] + 0.18, {"spine": [-24, 10, 0], "thigh.L": [46, 0, 0], "shin.L": [-62, 0, 0], "foot.L": [20, 0, 0], "thigh.R": [-10, 0, 0],
                                     "upper_arm.L": [10, 0, -70], "upper_arm.R": [10, 0, 70], "head": [-6, 0, 0]}],
            # the scramble: arms flailing wide
            [start["deer"] + 0.5, {"spine": [-16, 0, 0], "upper_arm.L": [0, 0, -30], "upper_arm.R": [0, 0, 30]}],
            [start["deer"] + 1.5, {"spine": [-10, 0, 0], "upper_arm.L": [0, 0, -22], "upper_arm.R": [0, 0, 22]}],
        ],
        "face": [[-9.0, {"smile": 0.7}], [2.2, {"smile": 0.9, "brow_up": 0.8, "open": 0.4}], [2.45, {"open": 0.9, "brow_up": 1.0, "squint": 0.6}],
                 [3.05, {"smile": 1.0, "squint": 0.9, "open": 0.6}], [4.0, {"smile": 0.8, "squint": 0.5}],
                 [TAU_L - 0.02, {"smile": 0.7}], [TAU_L + 0.27, {"smile": 0.7}], [TAU_L + 0.31, {"squint": 0.8, "brow_up": 1.0, "open": 0.8, "smile": 0.0}, "snap"],
                 [start["deer"] + 0.8, {"brow_up": 0.9, "open": 0.7}]],
    }
    deer["reach"] = [{"arm": "R", "pole": [0.6, -1.0, 0.2], "to": {"pos": [FB_C[0] + 0.07, FB_C[1], FB_C[2] - 0.03]},
                      "w": [[3.9, 0.0], [4.28, 1.0], [TAU_L + 0.28, 1.0], [TAU_L + 0.4, 0.0]]}]
    deer["fx"].append({"type": "yoff", "t": start["deer"], "dur": 0.6, "keys": [[start["deer"], 0.0], [start["deer"] + 0.18, -0.05], [start["deer"] + 0.42, 0.0]]})
    lead["reach"] = [{"arm": "R", "pole": [0.6, -1.0, 0.2], "to": {"pos": [FB_C[0] + 0.0, FB_C[1], FB_C[2] + 0.07]},
                      "w": [[3.95, 0.0], [4.3, 1.0], [TAU_L + 0.08, 1.0], [TAU_L + 0.2, 0.0]]}]
    A["start"] = start
    return [lead, elf, deer], A




# ============================================================ V5: THE ENDING
# One story clock from the bush close-up on (tau = T + KE).  The cut from
# the dive (bush clock KD) to the eye skips KE - KD: in it the cart chases
# the two to the bollards, stops, and swings round to search back north.
T_D2 = 18.0
T_E1A = 20.5             # the eye-line: the lit doorway, Blue beckoning, the elf on the leaf
T_D3 = 21.4              # back to the bush
T_SEE = 21.45
T_PUSH = 21.6            # the branch pushed aside
T_PLANT = 22.2           # one foot planted on the path
T_SPRING = F(675)        # 22.5: on the beat: the launch
T_BSNOW = 22.85          # the branch's snow drops after him
T_E4 = 23.5              # cut on the running stride: from the open door, back up the route
T_E4B = 25.6             # inside, through the doorway; the headlights behind them
T_CATCH = F(800)         # 26.667: the hands meet
T_BACK = T_CATCH + 0.45  # Blue's step back with the pull
T_CLEAR = T_CATCH + 0.8  # the trailing foot clears the threshold
T_E5 = F(834)            # 27.8
T_LATCH = F(855)         # 28.5
T_SWEEP = 28.62          # after the latch: the beam crosses the glass and passes
T_LAND = F(880)          # 29.333: the clump on the floor
T_NOTICE = T_LAND - 0.04 # Blue sees it first
T_EYES = T_LAND + 0.14   # the other two glance down
T_TITLE = F(894)         # 29.8
TAU_LATCH = TAU(T_LATCH)
TAU_LAND = TAU(T_LAND)

HIDE = [5.3, 75.5]                 # crouched in the bush (D2: facing west, the path)
PEEK = [5.05, 75.62]               # leaning into the west opening (D3)
EXIT = [4.6, 75.85]                # first step clear of the foliage
PLANT = [3.95, 76.1]               # the planted foot, on the snow at the path's edge
SNOW_B = (3.75, 76.2)              # that patch of snow (the vacated patch)
B_IN = [0.75, 102.9]               # Blue on the threshold of the open R leaf, facing out
B_PL = [0.68, 102.62]              # the outside slipper planted forward onto the slab
B_BK = [0.85, 103.85]              # the step back into the lobby with the pull (clear of his way in)
D_C = [0.1, 102.55]                # the reindeer passing Blue's left: his left forearm in Blue's left hand, side by side
E_DOOR = [1.22, 103.18]            # the elf in the doorway at the hinge, a hand on the open leaf's inner face
INSIDE = {"lead": [0.55, 103.95], "deer": [-0.75, 104.25], "elf": [1.0, 103.55]}   # just inside the shut door, facing it
R_PLATE = [-1.39, 1.08, 0.06]
R_EDGE = [-1.47, 0.8, 0.07]        # the R leaf's free edge, inner face (the brace grip)
R_HINGE = [-0.4, 1.0, 0.07]        # the inner face near the hinge (the elf's hold, open to shut)
CART_STOP = [1.7, 81.4]            # the bollards stop the cart (one row north of the road)
CART_STOP_A = [1.6, 81.6]          # ... the first time, behind the two
# the deer's run: out of the bush, west across the spine, through the bollard gaps, to the door
RUN = [[2.6, 77.0], [1.2, 78.2], [0.0, 79.8], [-0.75, 82.0], [-0.75, 84.5], [-0.45, 88.0], [0.0, 91.8], [0.1, 97.0], D_C]


def LISTEN(head_p, head_y, head_r):
    """tipped toward the door, an ear to it: the top of the body leaning in,
    hands loose, the head turned to the side"""
    return {"spine": [-12, 0, 0], "chest": [-4, 0, 0], "head": [head_p, head_y, head_r], "neck": [0, head_y * 0.25, 0],
            "upper_arm.L": [20, 0, -14], "upper_arm.R": [20, 0, 14], "forearm.L": [40, 0, 0], "forearm.R": [40, 0, 0]}


def PRESS(head_p, head_y):
    """back flat to the door, palms on it behind, head free (pitch, yaw)"""
    return {"spine": [6, 0, 0], "chest": [4, 0, 0], "head": [head_p, head_y, 0], "neck": [0, head_y * 0.25, 0],
            "upper_arm.L": [-30, 0, -40], "upper_arm.R": [-30, 0, 40], "forearm.L": [-10, 0, 0], "forearm.R": [-10, 0, 0]}


def door_r_keys(A):
    """the R leaf (out = toward the courtyard): yanked open by the elf on arrival,
    braced, pulled after the reindeer as his trailing foot clears, pulled
    home from inside on the latch"""
    ta = A["elf_arrive"]
    tc = TAU(T_CLEAR)
    return [[-20.0, 0.0], [ta - 0.06, 0.0], [ta + 0.26, 86.0, "out"], [ta + 0.42, 66.0, "inout"], [ta + 0.6, 70.0, "inout"],
            [tc + 0.02, 70.0], [tc + 0.4, 50.0, "inout"], [TAU(T_E5) + 0.3, 24.0, "inout"],
            [TAU_LATCH - 0.2, 7.0, "inout"], [TAU_LATCH, 0.0, "in"],
            [TAU_LATCH + 0.04, 1.6, "out"], [TAU_LATCH + 0.1, 0.0, "in"]]


def ending(actors, A):
    lead, elf, deer = actors
    td = A["tau_dive"]
    land = td + 0.42
    t_rake = A["t_rake"]          # the returning beam rakes the bush (D2)
    t_clear_b = A["t_beam_clear"] # ... and leaves it
    # ---------------------------------------------------------------- the reindeer
    deer["segs"] += [
        {"mode": "route", "t0": td, "pts": [[2.75, 73.55], HIDE], "speed": [[0.0, Route([[2.75, 73.55], HIDE]).length / 0.42]]},
        {"mode": "hold", "t0": land, "pos": [HIDE[0], 0.0, HIDE[1]], "yaw": yaw_to(HIDE, [0.0, 75.5])},
        # the eye finds the door: leaning into the opening
        arrive({"mode": "route", "t0": TAU(T_D3) - 0.3, "pts": [HIDE, PEEK], "speed": [[0.0, 0.0], [0.15, 1.2], [0.3, 0.0]], "yaw": yaw_to(PEEK, [0.5, 102.0])}),
        {"mode": "hold", "t0": TAU(T_D3), "pos": [PEEK[0], 0.0, PEEK[1]], "yaw": yaw_to(PEEK, [0.5, 102.0])},
    ]
    run_pts = [PEEK, EXIT, PLANT] + RUN
    rr = Route(run_pts)
    t_out = TAU(T_PUSH) + 0.02
    ts = TAU(T_SPRING) - t_out
    span = TAU(T_CATCH) - t_out
    head = [[0.0, 0.0], [0.15, 1.6], [TAU(T_PLANT) - t_out, 2.2], [ts, 2.4], [ts + 0.12, 5.0], [ts + 0.32, 6.4]]
    lo, hi = 3.0, 12.0
    for _ in range(60):
        vc = (lo + hi) / 2
        ks = head + [[ts + 0.9, vc], [span - 0.55, vc], [span, 2.2]]
        if dist(ks, span) < rr.length:
            lo = vc
        else:
            hi = vc
    A["deer_vc"] = vc
    deer_run = head + [[ts + 0.9, vc], [span - 0.55, vc], [span, 2.2]]
    A["deer_run"] = {"t0": t_out, "pts": run_pts, "speed": deer_run}
    # through: the grip swings him round into the opening (a recovery step), and on in
    mom = [D_C, [0.33, 103.15], [0.3, 103.6], [-0.2, 103.95], INSIDE["deer"]]
    mr = Route(mom)
    t_in1 = TAU(T_CLEAR) + 0.55
    mspan = t_in1 - TAU(T_CATCH)
    lo, hi = 0.2, 6.0
    for _ in range(50):
        vm = (lo + hi) / 2
        ks = [[0.0, 2.2], [0.3, 1.7], [0.6, vm], [mspan - 0.4, vm], [mspan, 0.0]]
        if dist(ks, mspan) < mr.length:
            lo = vm
        else:
            hi = vm
    deer["segs"] += [
        {"mode": "route", "t0": t_out, "pts": run_pts, "speed": deer_run},
        {"mode": "route", "t0": TAU(T_CATCH), "pts": mom, "speed": [[0.0, 2.2], [0.3, 1.7], [0.6, vm], [mspan - 0.4, vm], [mspan, 0.0]]},
        {"mode": "hold", "t0": t_in1, "pos": [INSIDE["deer"][0], 0.0, INSIDE["deer"][1]], "yaw": 0.0},
    ]
    deer["fx"] += [
        {"type": "dive", "t": td, "dur": 0.42, "h": 0.5},
        {"type": "yoff", "t": land, "dur": 99.0, "keys": [[land, 0.0], [land + 0.25, -0.3], [TAU(T_D3) - 0.3, -0.3], [TAU(T_D3), -0.2],
                                                          [TAU(T_PLANT) - 0.12, -0.16], [TAU(T_PLANT) + 0.04, 0.0]]},
        {"type": "jump", "t": TAU(T_SPRING), "dur": 0.32, "h": 0.22},
        {"type": "jump", "t": TAU(T_CATCH) + 0.08, "dur": 0.2, "h": 0.05},
        {"type": "turn", "t": t_in1 - 0.35, "dur": 0.35, "yaw": 0.0, "until": t_in1 + 0.01},
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
        # D2: holding still; the head follows the beam, then snaps to the door
        [t_rake - 0.6, C(dict(tuck, head=[-4, 4, 0]))],
        [t_rake + 0.1, C(dict(tuck, head=[-5, -1, 0]))],
        [t_clear_b, C(dict(tuck, head=[-5, -3, 0]))],
        [t_clear_b + 0.12, C(dict(tuck, head=[-1, -8, 2], spine=[-20, 0, 0]))],
        [TAU(T_D3) - 0.3, C(dict(tuck, head=[0, -8, 2], spine=[-20, 0, 0]))],
        # D3: leaning in to the opening, set
        [TAU(T_SEE), C(dict(tuck, head=[6, 0, 0], spine=[-14, 0, 0]))],
        # the right hand comes up to the branch and pushes it aside
        [TAU(T_PUSH) - 0.12, C({"upper_arm.R": [70, 0, -10], "forearm.R": [30, 0, 0], "upper_arm.L": [30, 0, 22], "forearm.L": [80, 0, 0], "head": [6, 0, 0], "spine": [-10, 0, 0]}, half)],
        [TAU(T_PUSH) + 0.1, C({"upper_arm.R": [60, 0, -55], "forearm.R": [10, 0, 0], "upper_arm.L": [40, 0, 18], "forearm.L": [70, 0, 0], "head": [4, 0, 0], "spine": [-12, 0, 0]}, half)],
        # the step out: weight forward onto the planted foot
        [TAU(T_PLANT) - 0.1, {"spine": [-20, 0, 0], "upper_arm.R": [40, 0, -40], "upper_arm.L": [30, 0, 30], "forearm.L": [60, 0, 0], "head": [6, 0, 0],
                               "thigh.L": [20, 0, 0], "shin.L": [-30, 0, 0]}],
        [TAU(T_PLANT) + 0.05, {"spine": [-24, 0, 0], "upper_arm.R": [20, 0, -30], "upper_arm.L": [40, 0, 30], "forearm.L": [50, 0, 0], "head": [8, 0, 0],
                                "thigh.L": [42, 0, 0], "shin.L": [-58, 0, 0], "foot.L": [16, 0, 0], "thigh.R": [-8, 0, 0]}],
        # the launch: arms flung back, body long
        [TAU(T_SPRING) - 0.04, {"spine": [-30, 0, 0], "upper_arm.L": [-40, 0, -20], "upper_arm.R": [-40, 0, 20], "head": [10, 0, 0], "thigh.L": [50, 0, 0], "shin.L": [-70, 0, 0]}],
        [TAU(T_SPRING) + 0.12, {"spine": [-26, 0, 0], "upper_arm.L": [-50, 0, -28], "upper_arm.R": [-50, 0, 28], "head": [8, 0, 0]}],
        [TAU(T_SPRING) + 0.4, {"spine": [-20, 0, 0], "upper_arm.L": [10, 0, -30], "upper_arm.R": [10, 0, 30]}],
        # flat out down the route, a look back over the shoulder at the light behind
        [TAU(T_E4) + 0.2, {"spine": [-20, 0, 0], "upper_arm.L": [10, 0, -28], "upper_arm.R": [10, 0, 28]}],
        [TAU(T_E4) + 0.55, {"spine": [-14, 8, 0], "head": [0, 34, 0], "neck": [0, 10, 0], "upper_arm.L": [10, 0, -28], "upper_arm.R": [10, 0, 28]}],
        [TAU(T_E4) + 0.85, {"spine": [-22, 0, 0], "head": [-4, 0, 0], "upper_arm.L": [10, 0, -30], "upper_arm.R": [10, 0, 30]}],
        # the last strides: the left arm comes up long for Blue's hand
        [TAU(T_CATCH) - 0.7, {"spine": [-16, 0, 0], "upper_arm.L": [30, 0, -20], "forearm.L": [10, 0, 0], "upper_arm.R": [10, 0, 30], "head": [6, 0, 0]}],
        [TAU(T_CATCH) - 0.25, {"spine": [-8, 0, 0], "upper_arm.L": [76, 0, -4], "forearm.L": [4, 0, 0], "upper_arm.R": [-10, 0, 34], "head": [10, 0, 0]}],
        # the catch: the arm is stopped, the body keeps coming and swings round it
        [TAU(T_CATCH) + 0.08, {"spine": [-20, 0, 0], "upper_arm.L": [88, 0, -2], "forearm.L": [0, 0, 0], "upper_arm.R": [-30, 0, 50], "head": [-6, 0, 0]}, "snap"],
        [TAU(T_BACK), {"spine": [-12, 0, 0], "upper_arm.L": [84, 0, -4], "upper_arm.R": [-20, 0, 40], "head": [0, 0, 0]}],
        [TAU(T_CLEAR) - 0.1, {"spine": [-10, 0, 0], "upper_arm.L": [60, 0, -10], "upper_arm.R": [0, 0, 30]}],
        [t_in1 - 0.1, {"spine": [-4, 0, 0], "upper_arm.L": [10, 0, -14], "upper_arm.R": [10, 0, 14]}],
        # inside: tipped toward the door, listening; the eyes go with the light
        [TAU_LATCH + 0.12, LISTEN(-4, -40, -6)], [TAU(T_SWEEP), LISTEN(4, -20, -2)],
        [TAU(T_SWEEP) + 0.45, LISTEN(4, -55, -4)], [TAU(T_EYES) - 0.02, LISTEN(-2, -50, -4)],
        [TAU(T_EYES) + 0.2, LISTEN(-22, -40, -2)], [TAU_LAND + 1.0, LISTEN(-22, -40, -2)],
    ]
    deer["face"] = [k for k in deer["face"] if k[0] < td - 0.3] + [
        [td - 0.3, {"brow_up": 0.9, "open": 0.7}],
        [td - 0.1, {"brow_up": 1.0, "smile": 0.6, "squint": 0.3, "open": 0.2}, "snap"],     # the idea
        [land + 0.1, {"squint": 1.0, "open": 0.0, "brow_angry": 0.3}],
        [land + 0.6, {"brow_up": 0.7, "open": 0.0, "squint": 0.2, "blink": 0.0}],
        [t_rake - 0.2, {"brow_up": 1.0, "squint": 0.0, "open": 0.12, "blink": 0.0}],
        [t_rake + 0.3, {"brow_up": 0.9, "squint": 0.35, "open": 0.0, "blink": 0.0}],
        [t_clear_b + 0.1, {"brow_up": 1.0, "squint": 0.0, "open": 0.0, "smile": 0.0, "blink": 0.0}],
        [TAU(T_SEE), {"brow_angry": 0.7, "open": 0.0, "squint": 0.2, "smile": 0.3}],     # decided
        [TAU(T_SPRING), {"brow_angry": 0.6, "open": 0.6, "brow_up": 0.3}],
        [TAU(T_E4) + 0.55, {"brow_up": 1.0, "open": 0.8, "squint": 0.1}],
        [TAU(T_CATCH) + 0.06, {"brow_up": 1.0, "open": 0.95, "squint": 0.4}, "snap"],
        [t_in1, {"brow_up": 1.0, "open": 0.5}],
        [TAU_LATCH + 0.1, {"brow_up": 0.7, "open": 0.0, "squint": 0.25, "blink": 0.0}],
        [TAU(T_SWEEP) + 0.1, {"brow_up": 1.0, "open": 0.15, "squint": 0.0, "blink": 0.0}],
        [TAU(T_EYES) + 0.15, {"brow_up": 1.0, "open": 0.3, "squint": 0.0, "blink": 0.0}],
    ]
    # eyes (the close-up): the beam going by, then straight to the lit doorway
    cart_at = A["cart_xz"]
    gz = [[t_rake - 1.0, 0.0, -0.1]]
    for tt in [t_rake - 0.5, t_rake - 0.25, t_rake, t_rake + 0.25, t_clear_b]:
        cx, cz = cart_at(tt)
        gz.append([tt, "at", cx, 0.7, cz])
    gz += [[t_clear_b + 0.12, "at", 0.5, 1.0, 103.0], [TAU(T_SPRING), "at", 0.5, 1.0, 103.0], [TAU(T_E4), 0.0, 0.0], [TAU(T_CATCH) - 0.3, 0.0, 0.0],
           [TAU_LATCH + 0.2, 0.0, 0.1], [TAU(T_SWEEP), 0.0, 0.25], [TAU(T_SWEEP) + 0.45, 0.6, 0.2], [TAU(T_EYES) - 0.02, 0.4, 0.0],
           [TAU(T_EYES) + 0.16, 0.15, -1.0], [TAU_LAND + 1.0, 0.15, -1.0]]
    deer["gaze"] = gz
    deer["snowcoat"] = {"t": TAU(T_SPRING) - 0.05, "drop": {"idx": 0, "t_land": TAU_LAND, "land": [-0.45, 104.6], "land_size": [0.13, 0.07, 0.11],
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
    # the reindeer's left hand reaches back for Blue's (just in front of Blue's left shoulder)
    deer["reach"] += [{"arm": "L", "pole": [-0.6, -1.0, 0.3], "to": {"actor": "lead", "bone": "upper_arm.L", "off": [-0.17, 0.0, -0.03]},
                      "w": [[TAU(T_CATCH) - 0.32, 0.0], [TAU(T_CATCH) - 0.04, 1.0], [TAU(T_BACK) + 0.12, 1.0], [TAU(T_BACK) + 0.4, 0.0]]}]
    A["deer_land"] = land
    A["tp_end"] = t_in1

    # ---------------------------------------------------------------- Blue
    ta = A["elf_arrive"]
    t_lead = A["lead_arrive"]
    lead["fx"] += [{"type": "turn", "t": t_lead + 0.02, "dur": 0.3, "yaw": 0.0, "until": TAU(T_CATCH) - 0.32},
                   # the hips turn toward the lobby before the hand closes
                   {"type": "turn", "t": TAU(T_CATCH) - 0.32, "dur": 0.2, "yaw": -0.87, "until": TAU(T_BACK) + 0.03},
                   {"type": "turn", "t": TAU(T_BACK) + 0.03, "dur": 0.3, "yaw": 0.0, "until": 999.0}]
    lead["segs"] += [
        # backs into the doorway, out of the leaf's way, to look for him
        arrive({"mode": "route", "t0": ta + 0.6, "pts": [LEAD_STOP, B_IN], "speed": [[0.0, 0.0], [0.15, 2.2], [0.5, 2.2], [0.75, 0.0]], "yaw": 0.0, "keep_yaw": True}),
        {"mode": "hold", "t0": ta + 1.35, "pos": [B_IN[0], 0.0, B_IN[1]], "yaw": 0.0},
        # the outside slipper planted forward onto the slab
        arrive({"mode": "route", "t0": TAU(T_CATCH) - 0.62, "pts": [B_IN, B_PL], "speed": [[0.0, 0.0], [0.1, 1.2], [0.22, 0.0]], "yaw": 0.0}),
        {"mode": "hold", "t0": TAU(T_CATCH) - 0.4, "pos": [B_PL[0], 0.0, B_PL[1]], "yaw": 0.0},
        # the catch: one step back into the lobby under the pull
        arrive({"mode": "route", "t0": TAU(T_CATCH) + 0.02, "pts": [B_PL, B_BK], "speed": [[0.0, 0.0], [0.1, 2.8], [0.3, 2.6], [T_BACK - T_CATCH, 0.0]], "yaw": -0.87, "keep_yaw": True}),
        {"mode": "hold", "t0": TAU(T_BACK), "pos": [B_BK[0], 0.0, B_BK[1]], "yaw": -0.87},
        # out of his way: a side-step along to the left, still facing the door
        arrive({"mode": "route", "t0": TAU(T_BACK) + 0.03, "pts": [B_BK, INSIDE["lead"]], "speed": [[0.0, 0.0], [0.12, 2.4], [0.36, 2.2], [0.55, 0.0]], "yaw": 0.0, "keep_yaw": True}),
        {"mode": "hold", "t0": TAU(T_BACK) + 0.58, "pos": [INSIDE["lead"][0], 0.0, INSIDE["lead"][1]], "yaw": 0.0},
    ]
    # the hand: Blue's left on the reindeer's left forearm
    lead["reach"] += [{"arm": "L", "pole": [-0.6, -1.0, 0.3], "to": {"actor": "deer", "bone": "forearm.L", "to_bone": "hand.L", "u": 0.7},
                      "w": [[TAU(T_CATCH) - 0.22, 0.0], [TAU(T_CATCH) - 0.01, 1.0], [TAU(T_BACK) + 0.02, 1.0], [TAU(T_BACK) + 0.22, 0.0]]}]
    reach = {"upper_arm.L": [78, 0, 8], "forearm.L": [8, 0, 0], "hand.L": [-10, 0, 0], "spine": [-10, 0, 0]}
    wave_up = {"upper_arm.R": [20, 0, 112], "forearm.R": [0, 0, 20], "spine": [-4, 0, 0], "head": [6, 0, 0]}
    wave_dn = {"upper_arm.R": [60, 0, 70], "forearm.R": [80, 0, 0], "spine": [-6, 0, 0], "head": [6, 0, 0]}
    lp = [k for k in lead["pose"] if k[0] < t_lead - 0.6]
    lp += [
        [t_lead - 0.3, {"spine": [-6, 0, 0]}],
        [t_lead + 0.08, {"spine": [6, 0, 0], "head": [4, 0, 0]}],
        # in the doorway: come ON - big waves at the bush
    ] + [[ta + 1.4 + 0.22 * i, dict(wave_dn if i % 2 == 0 else wave_up)] for i in range(int((TAU(T_SPRING) - 0.1 - ta - 1.4) / 0.22))] + [
        [TAU(T_SPRING), {"upper_arm.R": [40, 0, 30], "forearm.R": [40, 0, 0], "spine": [-6, 0, 0], "head": [8, 0, 0]}],
        # leaning out of the door, the left hand out for him, the right hand on the frame
        [TAU(T_E4) - 0.3, dict(reach, **{"upper_arm.R": [-10, 0, 30], "forearm.R": [20, 0, 0], "head": [4, 0, 0]})],
        [TAU(T_CATCH) - 0.65, dict(reach, **{"upper_arm.R": [-10, 0, 30], "forearm.R": [20, 0, 0], "head": [6, 0, 0], "spine": [-14, 0, 0]})],
        # the planted slipper: weight onto the front foot; then the hips open toward the lobby, the shoulders stay on him
        [TAU(T_CATCH) - 0.38, {"upper_arm.L": [84, 0, 6], "forearm.L": [4, 0, 0], "upper_arm.R": [-30, 0, 26], "spine": [-16, 0, 0], "head": [8, 0, 0],
                                "thigh.L": [30, 0, 0], "shin.L": [-24, 0, 0], "foot.L": [-6, 0, 0], "thigh.R": [-16, 0, 0], "shin.R": [-6, 0, 0], "foot.R": [20, 0, 0]}],
        [TAU(T_CATCH) - 0.06, {"upper_arm.L": [84, 0, 6], "forearm.L": [4, 0, 0], "upper_arm.R": [-30, 0, 30], "spine": [-12, 26, 0], "chest": [0, 14, 0],
                                "head": [8, 18, 0], "thigh.L": [30, 0, 0], "shin.L": [-24, 0, 0], "foot.L": [-6, 0, 0], "thigh.R": [-12, 0, 0], "foot.R": [16, 0, 0]}],
        # the catch: the hand closes, the body rocks back with the momentum
        [TAU(T_CATCH) + 0.1, {"hand.L": [20, 0, 0], "upper_arm.R": [-10, 0, 46], "forearm.R": [20, 0, 0], "spine": [10, 22, 0], "chest": [0, 10, 0], "head": [2, 14, 0]}, "snap"],
        [TAU(T_BACK), {"hand.L": [20, 0, 0], "upper_arm.R": [0, 0, 30], "spine": [6, 16, 0], "head": [0, 10, 0]}],
        [TAU(T_CLEAR), {"upper_arm.R": [10, 0, 20], "spine": [-4, 0, 0], "head": [0, 0, 0]}],
        # inside: tipped toward the door, listening; then the light, then the snow
        [TAU_LATCH + 0.1, LISTEN(-6, -36, -8)], [TAU(T_SWEEP), LISTEN(6, -14, -2)], [TAU(T_SWEEP) + 0.45, LISTEN(6, -48, -4)],
        [TAU(T_NOTICE) - 0.02, LISTEN(2, -44, -4)], [TAU(T_NOTICE) + 0.2, LISTEN(-24, -30, -2)], [TAU_LAND + 1.0, LISTEN(-24, -30, -2)],
    ]
    lead["pose"] = lp
    lead["face"] = [k for k in lead["face"] if k[0] < t_lead - 0.6] + [
        [t_lead, {"brow_up": 0.8, "open": 0.6}],
        [ta + 1.4, {"brow_up": 0.9, "open": 0.8, "brow_angry": 0.3}],
        [TAU(T_SPRING) + 0.1, {"brow_up": 1.0, "open": 0.9, "smile": 0.4}],
        [TAU(T_E4), {"brow_angry": 0.5, "open": 0.5, "brow_up": 0.5}],
        [TAU(T_CATCH) + 0.04, {"brow_angry": 0.9, "squint": 0.6, "open": 0.5}, "snap"],
        [TAU(T_CLEAR) + 0.3, {"brow_up": 0.9, "open": 0.1, "squint": 0.2}],
        [TAU_LATCH + 0.1, {"brow_up": 0.6, "open": 0.0, "squint": 0.3, "blink": 0.0}],
        [TAU(T_SWEEP) + 0.1, {"brow_up": 1.0, "open": 0.1, "squint": 0.1, "blink": 0.0}],
        [TAU(T_NOTICE) + 0.12, {"brow_up": 1.0, "open": 0.25, "squint": 0.0, "blink": 0.0}],
    ]
    lead["gaze"] = [[TAU(T_E4) - 0.5, 0.0, 0.0], [TAU(T_CATCH) - 0.3, -0.3, -0.15], [TAU(T_CATCH) + 0.1, -0.3, -0.35], [TAU(T_BACK), 0.0, -0.2],
                    [TAU_LATCH + 0.2, 0.0, 0.1], [TAU(T_SWEEP), -0.1, 0.25], [TAU(T_SWEEP) + 0.45, 0.6, 0.2], [TAU(T_NOTICE) - 0.04, 0.4, 0.0],
                    [TAU(T_NOTICE) + 0.1, 0.0, -1.0], [TAU_LAND + 1.0, 0.0, -1.0]]

    # ---------------------------------------------------------------- the elf
    elf["segs"] += [
        # the yank; then into the doorway at the hinge, a hand on the leaf's inner face
        arrive({"mode": "route", "t0": ta + 0.35, "pts": [ELF_DOOR, E_DOOR], "speed": [[0.0, 0.0], [0.12, 2.0], [0.32, 2.0], [0.48, 0.0]], "yaw": yaw_to(E_DOOR, [0.0, 95.0])}),
        {"mode": "hold", "t0": ta + 0.83, "pos": [E_DOOR[0], 0.0, E_DOOR[1]], "yaw": yaw_to(E_DOOR, [0.0, 95.0])},
    ]
    t_ein = TAU(T_CLEAR) + 0.02
    # pulling it shut after him: back out of the leaf's way as it comes round
    elf["segs"] += [
        arrive({"mode": "route", "t0": t_ein, "pts": [E_DOOR, INSIDE["elf"]], "speed": [[0.0, 0.0], [0.15, 1.2], [0.3, 1.0], [0.45, 0.0]], "yaw": 0.0, "keep_yaw": True}),
        {"mode": "hold", "t0": t_ein + 0.45, "pos": [INSIDE["elf"][0], 0.0, INSIDE["elf"][1]], "yaw": 0.0},
    ]
    EY5 = PI - 0.45     # back to the shut door, facing into the room
    elf["fx"] += [{"type": "turn", "t": t_ein, "dur": 0.3, "yaw": 0.0, "until": TAU_LATCH + 0.12},
                  {"type": "turn", "t": TAU_LATCH + 0.12, "dur": 0.35, "yaw": EY5, "until": 999.0}]
    elf["reach"] += [
        {"arm": "R", "pole": [0.6, -1.0, 0.3], "to": {"door": "R", "local": [-1.39, 0.92, -0.12]},
         "w": [[ta - 0.18, 0.0], [ta - 0.05, 1.0], [ta + 0.16, 1.0], [ta + 0.24, 0.0]]},
        # the hold near the hinge: open, then hauled shut as the trailing foot clears, held on the latch
        {"arm": "R", "pole": [0.6, -1.0, 0.3], "to": {"door": "R", "local": R_HINGE},
         "w": [[ta + 0.6, 0.0], [ta + 0.85, 1.0], [TAU_LATCH + 0.15, 1.0], [TAU_LATCH + 0.4, 0.0]]},
    ]
    brace = {"spine": [-8, 0, 0], "upper_arm.R": [50, 0, 40], "forearm.R": [30, 0, 0], "hand.R": [20, 0, 0]}
    ep = [k for k in elf["pose"] if k[0] < ta - 0.6]
    ep += [
        [ta - 0.3, {"spine": [-6, 0, 0]}],
        [ta - 0.06, {"upper_arm.R": [70, 0, 20], "forearm.R": [10, 0, 0], "spine": [-4, 0, 0], "head": [0, 20, 0]}],
        [ta + 0.12, {"upper_arm.R": [40, 0, 40], "forearm.R": [20, 0, 0], "spine": [6, 0, 0], "head": [0, 10, 0]}, "snap"],
        [ta + 0.4, dict(brace, head=[0, 12, 0], neck=[0, 4, 0])],
        # braced, the free arm waving him on
        [TAU(T_E1A), dict(brace, head=[4, 8, 0], neck=[0, 2, 0], **{"upper_arm.L": [20, 0, -110], "forearm.L": [0, 0, -30]})],
        [TAU(T_E1A) + 0.25, dict(brace, head=[4, 8, 0], neck=[0, 2, 0], **{"upper_arm.L": [60, 0, -70], "forearm.L": [80, 0, 0]})],
        [TAU(T_E1A) + 0.5, dict(brace, head=[4, 8, 0], neck=[0, 2, 0], **{"upper_arm.L": [20, 0, -110], "forearm.L": [0, 0, -30]})],
        [TAU(T_E1A) + 0.75, dict(brace, head=[4, 6, 0], neck=[0, 2, 0], **{"upper_arm.L": [60, 0, -70], "forearm.L": [80, 0, 0]})],
        [TAU(T_E4) + 0.3, dict(brace, head=[4, 4, 0], **{"upper_arm.L": [20, 0, -110], "forearm.L": [0, 0, -30]})],
        [TAU(T_E4) + 0.6, dict(brace, head=[4, 4, 0], **{"upper_arm.L": [60, 0, -70], "forearm.L": [80, 0, 0]})],
        [TAU(T_CATCH) - 0.3, dict(brace, head=[2, 2, 0])],
        [TAU(T_CLEAR) - 0.05, dict(brace, head=[0, -10, 0], spine=[-8, 0, 0])],
        # hauling it shut after him: leaning back on it
        [t_ein + 0.2, {"spine": [10, 0, 0], "upper_arm.R": [50, 0, 30], "forearm.R": [20, 0, 0], "head": [2, -10, 0]}],
        [TAU_LATCH - 0.25, {"spine": [-6, 0, 0], "upper_arm.R": [60, 0, 20], "forearm.R": [20, 0, 0], "head": [6, 0, 0]}],
        [TAU_LATCH, {"spine": [6, 0, 0], "upper_arm.R": [50, 0, 20], "forearm.R": [30, 0, 0], "head": [-2, 0, 0]}, "out"],
        # back flat to the shut door, holding it; the light goes by over the shoulder; then the snow
        [TAU_LATCH + 0.45, PRESS(12, 0)], [TAU(T_SWEEP) + 0.05, PRESS(14, 40)], [TAU(T_SWEEP) + 0.5, PRESS(12, 60)],
        [TAU(T_EYES) + 0.02, PRESS(6, 20)], [TAU(T_EYES) + 0.24, PRESS(-26, 12)], [TAU_LAND + 1.0, PRESS(-26, 12)],
    ]
    elf["pose"] = ep
    elf["face"] = [k for k in elf["face"] if k[0] < ta - 0.6] + [
        [ta, {"brow_angry": 0.5, "open": 0.5}],
        [ta + 0.5, {"brow_up": 0.8, "open": 0.6}],
        [TAU(T_SPRING) + 0.1, {"brow_up": 1.0, "open": 0.8, "smile": 0.3}],
        [t_ein, {"brow_angry": 0.6, "open": 0.4}],
        [TAU_LATCH - 0.3, {"brow_angry": 0.8, "squint": 0.6, "open": 0.2}],
        [TAU_LATCH + 0.3, {"brow_up": 0.6, "open": 0.0, "squint": 0.3, "blink": 0.0}],
        [TAU(T_SWEEP) + 0.12, {"brow_up": 1.0, "open": 0.1, "squint": 0.1, "blink": 0.0}],
        [TAU(T_EYES) + 0.18, {"brow_up": 1.0, "open": 0.2, "squint": 0.0, "blink": 0.0}],
    ]
    elf["gaze"] = [[TAU_LATCH, 0.0, 0.1], [TAU(T_SWEEP), -0.4, 0.4], [TAU(T_SWEEP) + 0.45, -0.7, 0.3], [TAU(T_EYES) + 0.04, -0.3, 0.0],
                   [TAU(T_EYES) + 0.22, 0.0, -1.0], [TAU_LAND + 1.0, 0.0, -1.0]]
    # the two take another stride past the bush, then look back for the missing friend (as V2)
    for a, side in [(lead, 1), (elf, -1)]:
        pk = [k for k in a["pose"] if not (td - 0.05 < k[0] < td + 2.4)]
        pk += [[td + 0.32, {"spine": [-9, 0, 0]}], [td + 0.6, {"spine": [-4, 0, 0], "head": [0, 70 * side, 0], "neck": [0, 18 * side, 0]}],
               [td + 1.0, {"spine": [-4, 0, 0], "head": [0, 76 * side, 0], "neck": [0, 18 * side, 0]}], [td + 1.35, {"spine": [-12, 0, 0]}]]
        a["pose"] = sorted(pk, key=lambda k: k[0])
        fk = [k for k in a["face"] if not (td - 0.05 < k[0] < td + 2.4)]
        fk += [[td + 0.5, {"brow_up": 1.0, "open": 0.7}], [td + 0.9, {"brow_up": 1.0, "open": 0.9, "brow_angry": 0.2}], [td + 1.5, {"brow_angry": 0.6, "open": 0.6}]]
        a["face"] = sorted(fk, key=lambda k: k[0])
    return actors


# ================================================================== THE CART
# V5: the chase down the spine (offset at the drift so a front tyre runs over
# Blue's print), past the bush, to the bollards behind the two; a loop round,
# back north raking the bush (D2); past it; a U-turn north of the bush that
# swings the beam over the patch the reindeer has just left (D3); then down
# the east side of the spine after him, toward the door, to the bollards.
# After the latch it turns away east along the row.
CART_PTS = [CART_P, [0.75, 6.5], [-0.5, 9.6], [-2.6, 11.9], [-5.0, 15.7], [-7.6, 19.4], [-7.95, 23.5], [-6.0, 27.5], [-2.7, 29.6],
            [-0.3, 31.7], [0.35, 36.0], [-0.2, 46.0], [-0.45, 54.0], [-0.45, 63.0], [0.2, 67.5], [0.9, 71.0], [1.0, 75.0],
            [1.4, 78.8], [1.6, 81.6],
            [2.3, 83.1], [3.5, 83.4], [4.7, 83.0], [5.2, 81.6], [5.05, 80.0], [4.4, 78.8], [3.3, 77.8],
            [2.3, 76.6], [1.5, 74.0], [1.0, 70.0], [0.7, 64.5],
            [0.6, 61.5], [1.3, 59.6], [2.6, 59.0], [3.8, 59.7], [4.1, 61.6], [3.9, 63.6], [3.2, 66.0], [2.2, 69.4], [1.7, 73.0],
            [1.7, 77.0], [1.7, 79.6], CART_STOP,
            [2.0, 82.4], [3.0, 83.0], [5.0, 83.2], [9.0, 83.1], [14.0, 82.6], [22.0, 82.3], [32.0, 82.3]]


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
    knots = [k for k in knots if k[1] < s_near(cr, [1.0, 75.0]) - 0.6]
    L = s_bush_end
    def S(p, lo=None):
        return s_near(cr, p, L - 3.0 if lo is None else lo)
    # story tau (the bush clock and the lobby clock are one story: KD before the D2/E1a cut, KE after)
    # story tau (one story: the bush clock KD before the D2 -> E1a cut skips ahead to the lobby clock KE)
    # V5 (story tau): to the bollards behind the two, stop; loop; north past the bush (the rake);
    # a U-turn north of it (the sweep over the vacated patch); back down after him; stop; after the latch, away
    seq = [(17.25, [1.4, 78.8]), (17.75, CART_STOP_A), (18.15, CART_STOP_A),
           (18.6, [2.3, 83.1]), (18.95, [3.5, 83.4]), (19.25, [4.7, 83.0]), (19.5, [5.2, 81.6]), (19.75, [5.05, 80.0]),
           (20.0, [4.4, 78.8]), (20.25, [3.3, 77.8]), (20.5, [2.3, 76.6]), (20.85, [1.5, 74.0]), (21.35, [1.0, 70.0]), (22.0, [0.7, 64.5]),
           (22.4, [0.6, 61.5]), (22.65, [1.3, 59.6]), (22.85, [2.6, 59.0]), (23.05, [3.8, 59.7]), (23.3, [4.1, 61.6]), (23.55, [3.9, 63.6]),
           (23.85, [3.2, 66.0]), (24.25, [2.2, 69.4]), (24.7, [1.7, 73.0]), (25.2, [1.7, 77.0]), (25.62, [1.7, 79.6]), (26.3, CART_STOP),
           (TAU(T_LATCH) + 0.08, CART_STOP),
           (TAU(T_LATCH) + 0.6, [2.0, 82.4]), (TAU(T_LATCH) + 0.95, [3.0, 83.0]), (TAU(T_LATCH) + 1.35, [5.0, 83.2]), (TAU(T_LATCH) + 1.9, [9.0, 83.1]),
           (TAU(T_LATCH) + 2.55, [14.0, 82.6]), (TAU(T_LATCH) + 3.6, [22.0, 82.3]), (TAU(T_LATCH) + 4.8, [32.0, 82.3])]
    lo_s = s_near(cr, [1.0, 75.0], 0.0, 1e9) - 0.5
    for tk, pk in seq:
        sk_ = s_near(cr, pk, lo_s, lo_s + 14.0)
        knots.append((tk, sk_))
        lo_s = sk_ - 0.01
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
    # V5: the returning beam rakes the bush (heading north at x 4.1, D2), then swings off it
    A["t_rake"] = 19.65
    A["t_beam_clear"] = 20.15
    cart = {"id": "cart", "index": 0, "pts": CART_PTS, "t0": t0c, "s0": s_of(t0c), "speed": keys,
            "headlights": [[-20.0, 0.0], [TAU_L - 0.001, 0.0], [TAU_L, 1.0]],
            "beacon": [[-20.0, 0.0], [TAU_L + 0.12, 0.0], [TAU_L + 0.13, 1.0]],
            "steer_k": [[t0c, 0.0], [t0c + 0.08, 0.0], [t0c + 0.26, 0.8]], "steer_until": t0c + 0.55,
            "hl_opts": {"energy": 6.0, "range": 30.0, "angle": 27.0, "tilt": 5.0, "beam_len": 11.0, "beam_radius": 2.2, "beam_glow": 0.1, "glare": 0.5}}
    officer = {
        "id": "officer", "role": "watch", "look": WATCH,
        "segs": [{"mode": "cart", "t0": -20.0, "cart": "cart"}],
        "pose": [[-20.0, {"head": [-4, 0, 0]}], [TAU_L - 0.3, {"head": [-4, 0, 0]}], [TAU_L + 0.4, {"head": [-2, 0, 0], "spine": [-6, 0, 0]}],
                 # searching on the way back: the head turning toward the bush
                 [19.3, {"head": [-2, 0, 0]}], [19.6, {"head": [-4, -20, 0], "neck": [0, -6, 0]}], [20.3, {"head": [-2, 0, 0]}],
                 [23.1, {"head": [-2, 0, 0]}], [23.4, {"head": [-4, -26, 0], "neck": [0, -8, 0]}], [23.9, {"head": [-4, 0, 0], "spine": [-10, 0, 0]}]],
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
    # V5 C3: a thin dusting on Blue's lane where the slipper pushes off; the cart's tyre is routed over the mark
    global MARK
    # centred on Blue's two footfalls there (render: steps at z 59.90 and 61.06, x -1.15)
    MARK = [-1.15, 60.45]
    A["mark"] = MARK
    drift = {"kind": "snowpatch", "id": "dust", "pos": [MARK[0], MARK[1]], "y": 0.055, "rx": 0.6, "rz": 1.15, "yaw": 0.0, "seed": 11}
    bsnow = {"kind": "snowpatch", "id": "bsnow", "pos": [SNOW_B[0], SNOW_B[1]], "y": 0.0, "rx": 1.1, "rz": 0.85, "yaw": 0.3, "seed": 5}
    story_set = dict(campus)
    story_set.update({"actors": actors + [officer], "carts": [cart], "props": [bush_prop(A), drift, bsnow]})
    end_set = dict(story_set)
    end_set.update(room)
    end_set["doors"] = {"R": door_r_keys(A)}
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
    add("v5_a1_lobby", 0.0, T_CUT_OUT, a1)
    # ---- A2 the rim, the slipper coming in, the landing
    a2 = dict(story_set)
    a2["tau0"] = T_CUT_OUT - FT
    a2["cam"] = [{"t": 0.0, "pos": [3.15, 0.8, 14.75], "at": [0.8, 0.74, 15.4], "fov": 40.0},
                 {"t": 1.0, "pos": [3.1, 0.8, 14.85], "at": [0.8, 0.76, 15.45], "fov": 39.0}]
    add("v5_a2_rim", T_CUT_OUT, 3.9, a2)
    # ---- A3 from the water: the toe test, the recoil, the friends
    a3 = dict(story_set)
    a3["tau0"] = 3.9 - FT
    a3["cam"] = [{"t": 0.0, "pos": [3.35, 0.8, 18.35], "at": [0.55, 0.75, 14.6], "fov": 40.0},
                 {"t": 1.3, "pos": [3.3, 0.85, 18.3], "at": [0.6, 0.8, 14.0], "fov": 41.0},
                 {"t": 2.5, "pos": [3.2, 0.95, 18.25], "at": [0.6, 0.9, 13.6], "fov": 43.0}]
    add("v5_a3_toe_test", 3.9, 6.0, a3)
    # ---- B1 the three by the fountain; laughing it off; the fist bump coming together - CLICK
    a4 = dict(story_set)
    a4["tau0"] = 6.0 - FT
    a4["cam"] = [{"t": 0.0, "pos": [0.7, 1.5, 10.6], "at": [0.85, 0.95, 14.45], "fov": 38.0},
                 {"t": 1.2, "pos": [0.64, 1.47, 11.0], "at": [0.84, 0.95, 14.5], "fov": 35.0},
                 {"t": 2.0, "pos": [0.6, 1.45, 11.2], "at": [0.83, 0.95, 14.5], "fov": 34.0}]
    add("v5_b1_three", 6.0, T_LIGHT, a4)
    # ---- B1b cut on the light: into the beam: the elf first and away, Blue with the elf, the reindeer half a stride behind
    b1b = dict(story_set)
    b1b["tau0"] = T_LIGHT - FT
    b1b["cam"] = [{"t": 0.0, "pos": [3.7, 0.95, 10.9], "at": [0.75, 0.85, 14.5], "fov": 42.0},
                  {"t": 1.2, "pos": [3.5, 0.95, 11.0], "at": [-0.2, 0.85, 14.4], "fov": 44.0}]
    hl(b1b, 8.0, 0.35, 0.05)
    b1b["exposure"] = 0.86
    add("v5_b1b_beam", T_LIGHT, 9.2, b1b)
    # ---- B2 low beside the front wheel, along the beam: the tyre starts to roll over the paving; they are already running
    b2 = dict(story_set)
    b2["tau0"] = 9.2 - FT
    b2["cam"] = [{"t": 0.0, "pos": [-0.3, 0.3, 2.7], "at": [-0.4, 0.55, 13.0], "fov": 40.0},
                 {"t": 0.7, "pos": [-0.3, 0.3, 2.85], "at": [-0.8, 0.55, 13.0], "fov": 40.0}]
    hl(b2, 6.0, 0.5, 0.06)
    add("v5_b2_wheels", 9.2, 9.9, b2)
    # ---- C1 wide around the fountain
    c1 = dict(story_set)
    c1["tau0"] = 9.9 - FT
    c1["cam"] = [{"t": 0.0, "pos": [-17.5, 3.8, 26.0], "at": [-5.5, 0.6, 19.0], "fov": 44.0},
                 {"t": 2.35, "pos": [-16.8, 3.3, 31.0], "at": [-6.0, 0.7, 26.0], "fov": 42.0}]
    hl(c1, 10.0, 0.6, 0.12)
    add("v5_c1_round", 9.9, 12.0, c1)
    # ---- C2 alongside
    c2 = dict(story_set)
    c2["tau0"] = 9.6
    c2["cam"] = [{"t": 0.0, "pos": {"rel": "lead", "off": [3.5, 0.72, 0.4], "yaw_fixed": 180.0, "base_y": 0.0}, "at": {"rel": "lead", "off": [0.0, 0.75, 0.35], "yaw_fixed": 180.0, "base_y": 0.0}, "fov": 52.0},
                 {"t": 2.1, "pos": {"rel": "lead", "off": [3.2, 0.7, 0.5], "yaw_fixed": 180.0, "base_y": 0.0}, "at": {"rel": "lead", "off": [0.0, 0.72, 0.5], "yaw_fixed": 180.0, "base_y": 0.0}, "fov": 52.0}]
    hl(c2, 4.5, 0.4, 0.04)
    add("v5_c2_alongside", 12.0, T_HANDOFF, c2)
    # ---- C2b the cart on Blue's heels: one look back, then lower and harder
    c2b = dict(story_set)
    c2b["tau0"] = 11.45
    c2b["cam"] = [{"t": 0.0, "pos": {"rel": "lead", "off": [2.4, 0.6, -3.6], "yaw_fixed": 180.0, "base_y": 0.0}, "at": {"rel": "lead", "off": [0.2, 0.95, 2.2], "yaw_fixed": 180.0, "base_y": 0.0}, "fov": 46.0},
                  {"t": 15.4 - T_HANDOFF, "pos": {"rel": "lead", "off": [2.2, 0.55, -3.2], "yaw_fixed": 180.0, "base_y": 0.0}, "at": {"rel": "lead", "off": [0.2, 0.95, 2.4], "yaw_fixed": 180.0, "base_y": 0.0}, "fov": 46.0}]
    hl(c2b, 8.0, 0.55, 0.11)
    add("v5_c2b_gain", T_HANDOFF, 15.4, c2b)
    # ---- C3 three-quarter insert: Blue's slipper pushes off a print in the dusting, clears frame; the front tyre rolls across that mark
    c3 = dict(story_set)
    c3["tau0"] = C3_TAU0
    c3["cam"] = [{"t": 0.0, "pos": [MARK[0] - 1.3, 0.34, MARK[1] + 1.55], "at": [MARK[0] + 0.05, 0.08, MARK[1] - 0.15], "fov": 38.0},
                 {"t": 1.6, "pos": [MARK[0] - 1.3, 0.34, MARK[1] + 1.62], "at": [MARK[0] + 0.1, 0.08, MARK[1] - 0.05], "fov": 38.0}]
    hl(c3, 6.0, 0.5, 0.06)
    add("v5_c3_mark", 15.4, 17.0, c3)
    # ---- D1 side-on past the bush: the idea, the dive
    d1 = dict(story_set)
    d1["tau0"] = TAUD(17.0)
    d1["cam"] = [{"t": 0.0, "pos": [-6.0, 1.0, 71.9], "at": [2.4, 0.85, 73.2], "fov": 40.0},
                 {"t": 1.0, "pos": [-5.9, 0.98, 72.5], "at": [2.8, 0.85, 74.4], "fov": 40.0}]
    add("v5_d1_dive", 17.0, 18.0, d1)
    # ---- D2 into the foliage: one eye through a gap; the returning beam rakes the bush and clears; the eye goes straight to the door
    d2 = dict(story_set)
    d2["tau0"] = TAU(18.0)
    d2["cam"] = [{"t": 0.0, "pos": D2_CAM, "at": D2_AT, "fov": 38.0},
                 {"t": T_E1A - 18.0, "pos": [D2_CAM[0] + 0.07, D2_CAM[1], D2_CAM[2]], "at": D2_AT, "fov": 35.5}]
    hl(d2, 10.0, 0.4, 0.06)
    add("v5_d2_eye", 18.0, T_E1A, d2)
    # ---- E1a the eye-line: down the route to the lit doorway: Blue waving him on, the elf holding the leaf
    e1 = dict(end_set)
    e1["tau0"] = TAU(T_E1A)
    e1["lights"] = dorm_lights
    e1["cam"] = [{"t": 0.0, "pos": [-0.7, 1.05, 96.6], "at": [0.75, 1.0, 102.7], "fov": 30.0},
                 {"t": T_D3 - T_E1A, "pos": [-0.68, 1.05, 96.85], "at": [0.75, 1.0, 102.7], "fov": 29.0}]
    add("v5_e1a_door", T_E1A, T_D3, e1)
    # ---- D3 the bush: the branch, the foot, the launch; the strides; the beam sweeps the empty snow
    d3 = dict(story_set)
    d3["tau0"] = TAU(T_D3)
    d3["cam"] = D3_CAM
    hl(d3, 34.0, 0.3, 0.05, range=45.0, angle=22.0, tilt=2.5)
    add("v5_d3_out", T_D3, T_E4, d3)
    # ---- E4a from just inside the open door, back up the route: Blue's hand, the reindeer coming, the cart after him
    e4 = dict(end_set)
    e4["tau0"] = TAU(T_E4)
    e4["lights"] = dorm_lights
    e4["cam"] = E4_CAM
    hl(e4, 9.0, 0.6, 0.08, range=40.0)
    add("v5_e4_route", T_E4, T_E4B, e4)
    # ---- E4b inside, through the doorway: the hands meet against the headlights; the step back; through; the elf on the leaf
    e4b = dict(end_set)
    e4b["tau0"] = TAU(T_E4B)
    e4b["lights"] = [dict(l, energy=l["energy"] * (0.25 if l["pos"][2] < 103.0 else 1.0)) for l in dorm_lights]
    e4b["exposure"] = 0.82
    e4b["cam"] = E4B_CAM
    hl(e4b, 9.0, 0.9, 0.1, range=40.0)
    add("v5_e4b_catch", T_E4B, T_E5, e4b)
    # ---- E5 inside: the three at the closing door; the latch; the light across the glass; the snow; one sees it, then all
    e5 = dict(end_set)
    e5["tau0"] = TAU(T_E5)
    e5["lights"] = dorm_lights
    e5["exposure"] = 0.95
    e5["cam"] = [{"t": 0.0, "pos": [2.5, 1.2, 105.35], "at": [-0.25, 1.12, 103.6], "fov": 47.0},
                 {"t": T_TITLE - T_E5, "pos": [2.43, 1.18, 105.28], "at": [-0.27, 1.08, 103.62], "fov": 46.0}]
    e5["glass_sweep"] = [[TAU(T_E5), 0.2, 0.42, 0.34, 0.5], [TAU_LATCH + 0.08, 0.2, 0.42, 0.34, 0.5],
                         [TAU(T_SWEEP) + 0.06, 0.55, 0.52, 0.24, 2.2], [TAU(T_SWEEP) + 0.24, 0.55, 0.72, 0.22, 2.2],
                         [TAU(T_SWEEP) + 0.42, 0.3, 0.9, 0.2, 1.0], [TAU(T_SWEEP) + 0.58, 0.0, 1.0, 0.16, 0.0]]
    hl(e5, 4.5, 0.2, 0.05)
    add("v5_e5_inside", T_E5, T_TITLE, e5)

    json.dump(r3(shots), open(OUT_JSON, "w"), indent=1)
    info = {k: (r3(v) if not isinstance(v, Route) and not callable(v) else None) for k, v in A.items()}
    info.update({"T_CUT_OUT": T_CUT_OUT, "T_LIGHT": T_LIGHT, "T_STEP": T_STEP, "T_DIVE": T_DIVE, "T_LATCH": T_LATCH, "T_LAND": T_LAND,
                 "T_TITLE": T_TITLE, "T_HANDOFF": T_HANDOFF, "FT": FT, "KD": KD, "KE": KE, "T_D3": T_D3, "T_PUSH": T_PUSH, "T_PLANT": T_PLANT,
                 "T_SPRING": T_SPRING, "T_BSNOW": T_BSNOW, "T_E4": T_E4, "T_CATCH": T_CATCH, "T_BACK": T_BACK, "T_CLEAR": T_CLEAR, "T_E5": T_E5,
                 "T_SWEEP": T_SWEEP, "T_EYES": T_EYES, "T_NOTICE": T_NOTICE, "T_E1A": T_E1A, "T_D2": T_D2, "T_E4B": T_E4B, "C3_TAU0": C3_TAU0})
    json.dump({"fps": 30, "dur": 33.0, "clips": edl, "logo": T_TITLE, "info": info}, open(OUT_EDL, "w"), indent=1)
    return shots, edl, A


# camera blocking (tuned on stills)
C3_TAU0 = 13.4
MARK_TAU = 13.72          # Blue on the dusting (the push-off mark)
MARK = [-1.15, 60.0]      # set in build()
D2_CAM = [3.45, 0.8, 75.95]
D2_AT = [5.0, 0.8, 75.55]
D3_CAM = [{"t": 0.0, "pos": [-1.0, 0.95, 76.7], "at": [4.6, 0.8, 75.95], "fov": 34.0},
          {"t": T_SPRING - T_D3, "pos": [-1.0, 0.95, 76.7], "at": [4.3, 0.76, 76.1], "fov": 34.0},
          {"t": T_SPRING + 0.35 - T_D3, "pos": [-1.05, 0.95, 76.72], "at": [2.6, 0.7, 77.5], "fov": 37.0},
          {"t": T_SPRING + 0.7 - T_D3, "pos": [-1.06, 0.95, 76.73], "at": [2.9, 0.62, 77.3], "fov": 36.5},
          {"t": T_E4 - T_D3, "pos": [-1.08, 0.95, 76.74], "at": [3.25, 0.55, 76.95], "fov": 36.0}]
E4_CAM = [{"t": 0.0, "pos": [0.25, 1.05, 103.05], "at": [1.3, 0.92, 90.0], "fov": 34.0},
          {"t": T_E4B - T_E4, "pos": [0.25, 1.05, 103.04], "at": [1.25, 0.9, 90.0], "fov": 34.0}]
E4B_CAM = [{"t": 0.0, "pos": [0.6, 1.0, 106.2], "at": [0.3, 0.92, 102.5], "fov": 42.0},
           {"t": T_E5 - T_E4B, "pos": [0.58, 1.0, 106.15], "at": [0.3, 0.92, 103.1], "fov": 43.0}]


if __name__ == "__main__":
    shots, edl, A = build()
    for k, v in A.items():
        if isinstance(v, (int, float)):
            print(k, round(v, 3))
    for c in edl:
        print(c)
