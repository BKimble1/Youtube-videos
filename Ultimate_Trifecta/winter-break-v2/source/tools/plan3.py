#!/usr/bin/env python3
"""Ultimate Trifecta - Season 1: Winter Break, V2 (33 s cinematic short).

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
OUT_EDL = "/home/user/ut/work/edl3.json"
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

RIM_Y, RIM_Z, TEST_X = PL.RIM_Y, PL.RIM_Z, PL.TEST_X
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
    start = {"elf": TAU_E1, "lead": TAU_E1 + 0.1, "deer": TAU_E1 + 0.27}
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
    tau_door = TAU(21.15)       # the elf's hand on the door (E1 opens on their arrival)
    A["tau_door"] = tau_door
    two = {}
    for who, door_pt in [("elf", [-0.95, 101.85]), ("lead", [-0.2, 101.5])]:
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
        # finish: cover the rest so the route ends at tau_door with a 0.45 s stop
        rem = r.length - dist(k, t_dv + 1.9)
        # cruise at 6.6 then decel to 0 over 0.55 s: 6.6*(tc) + 6.6*0.55/2 = rem
        tc = (rem - 6.6 * 0.275) / 6.6
        k += [[t_dv + 1.9 + tc, 6.6], [t_dv + 1.9 + tc + 0.55, 0.0]]
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
            {"mode": "hold", "t0": A["lead_arrive"], "pos": [-0.2, 0.0, 101.5], "yaw": yaw_to([-0.2, 101.5], BUSH)},
        ],
        "fx": [
            {"type": "jump", "t": -0.33, "dur": 0.33, "h": 0.1, "dy": RIM_Y},
            {"type": "ripple", "t": 1.02, "pos": [TEST_X + 0.05, PL.WATER_Y, RIM_Z + 0.5], "size": 0.32},
            {"type": "yoff", "t": 0.0, "dur": 9.0, "keys": [[0.45, 0.0], [0.95, -0.13], [1.12, -0.13], [1.25, 0.0]]},
            {"type": "jump", "t": 1.75, "dur": 0.3, "h": 0.12, "dy": -RIM_Y},
            # down off the rim: turns to the friends (the deer's mime), then to the light
            {"type": "turn", "t": 2.15, "dur": 0.4, "face": [1.2, 12.6], "until": TAU_L + 0.05},
            {"type": "turn", "t": TAU_L + 0.05, "dur": 0.16, "face": CART_P, "until": start["lead"]},
        ],
        "pose": [
            [-0.3, {}],
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
            [TAU_L + 0.12, {"head": [10, 0, 0], "spine": [6, 0, 0], "upper_arm.L": [60, 0, 8], "forearm.L": [110, 0, 0], "hand.L": [10, 0, 0]}, "snap"],
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
            [TAU_L + 0.06, {"squint": 1.0, "brow_angry": 0.5, "open": 0.35, "smile": 0.0}, "snap"],
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
            {"mode": "hold", "t0": A["elf_arrive"], "pos": [-0.95, 0.0, 101.85], "yaw": yaw_to([-0.95, 101.85], BUSH)},
        ],
        "fx": [
            {"type": "turn", "t": 1.95, "dur": 0.4, "face": [LEAD_P[0], LEAD_P[1] + 0.2], "until": 3.0},
            {"type": "emote", "name": "laugh", "t": 2.55, "dur": 1.4},
            {"type": "turn", "t": TAU_L + 0.04, "dur": 0.12, "face": CART_P, "until": TAU_L + 0.14},
        ],
        "pose": [
            [-9.0, {}],
            [2.0, {}],
            [TAU_L - 0.02, {}],
            [TAU_L + 0.1, {"head": [8, 0, 0], "upper_arm.L": [55, 0, 10], "forearm.L": [100, 0, 0], "spine": [5, 0, 0]}, "snap"],
            # grabs the lead's sleeve
            [TAU_L + 0.42, {"upper_arm.L": [70, 0, 0], "forearm.L": [10, 0, 0], "hand.L": [-20, 0, 0], "spine": [-10, 0, 0]}],
            [start["elf"], {"upper_arm.L": [-40, 0, 28], "forearm.L": [5, 0, 0], "spine": [-16, 0, 0], "head": [0, 20, 0]}],
            [start["elf"] + 0.55, {"upper_arm.L": [-35, 0, 22], "forearm.L": [10, 0, 0], "spine": [-14, 0, 0], "head": [0, 10, 0]}],
            [start["elf"] + 0.85, {"spine": [-10, 0, 0]}],
            [start["elf"] + 2.0, {"spine": [-9, 0, 0], "forearm.L": [20, 0, 0], "forearm.R": [20, 0, 0]}],
        ],
        "face": [[-9.0, {"smile": 0.6}], [2.5, {"smile": 1.0, "squint": 0.7, "open": 0.6}], [4.0, {"smile": 0.7, "squint": 0.4}],
                 [TAU_L - 0.02, {"smile": 0.6}], [TAU_L + 0.06, {"squint": 0.9, "brow_up": 0.6, "open": 0.5, "smile": 0.0}, "snap"],
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
            {"type": "turn", "t": TAU_L + 0.05, "dur": 0.18, "face": CART_P, "until": start["deer"]},
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
            [TAU_L + 0.1, {"head": [12, 0, 0], "spine": [8, 0, 0], "upper_arm.L": [50, 0, 20], "upper_arm.R": [50, 0, -20], "forearm.L": [80, 0, 0], "forearm.R": [80, 0, 0]}, "snap"],
            [start["deer"] - 0.1, {"head": [6, 20, 0], "spine": [4, 0, 0], "upper_arm.L": [40, 0, 10], "upper_arm.R": [40, 0, -10]}],
            # the scramble: arms flailing wide
            [start["deer"] + 0.3, {"spine": [-14, 0, 0], "upper_arm.L": [0, 0, -30], "upper_arm.R": [0, 0, 30]}],
            [start["deer"] + 1.5, {"spine": [-10, 0, 0], "upper_arm.L": [0, 0, -22], "upper_arm.R": [0, 0, 22]}],
        ],
        "face": [[-9.0, {"smile": 0.7}], [2.2, {"smile": 0.9, "brow_up": 0.8, "open": 0.4}], [2.45, {"open": 0.9, "brow_up": 1.0, "squint": 0.6}],
                 [3.05, {"smile": 1.0, "squint": 0.9, "open": 0.6}], [4.0, {"smile": 0.8, "squint": 0.5}],
                 [TAU_L - 0.02, {"smile": 0.7}], [TAU_L + 0.06, {"squint": 0.8, "brow_up": 1.0, "open": 0.8, "smile": 0.0}, "snap"],
                 [start["deer"] + 0.8, {"brow_up": 0.9, "open": 0.7}]],
    }
    A["start"] = start
    return [lead, elf, deer], A




# ================================================================ THE ENDING
# R leaf (outward): the elf pulls it open on arrival, holds it, walks in
# with it as the reindeer barrels through; it shuts on the latch.
TAU_LATCH = TAU(T_LATCH)
TAU_SHAKE = TAU(T_SHAKE)
TAU_BURST = TAU(T_BURST)
TAU_LAND = TAU(T_LAND)
PRESS = {"lead": [-0.62, 103.52], "deer": [0.22, 103.55], "elf": [1.0, 103.52]}
HIDE = [5.3, 75.5]


def PRESS_POSE(look):
    """backs flat to the door, arms spread on it, head back, eyes on `look` (head yaw)"""
    return {"spine": [8, 0, 0], "chest": [4, 0, 0], "head": [10, look, 0], "neck": [0, look * 0.2, 0],
            "upper_arm.L": [-30, 0, -50], "upper_arm.R": [-30, 0, 50], "forearm.L": [-10, 0, 0], "forearm.R": [-10, 0, 0]}


def door_ret(A, who="elf", deg=78.0, lag=0.0):
    t_open = A[who + "_arrive"] - 0.05
    return [[t_open, 0.0], [t_open + 0.55, deg, "out"], [TAU_LATCH - 0.4 - lag, deg], [TAU_LATCH, 0.0, "in"],
            [TAU_LATCH + 0.04, 2.5, "out"], [TAU_LATCH + 0.1, 0.0, "in"]]


def ending(actors, A):
    lead, elf, deer = actors
    td = A["tau_dive"]
    # ---- the deer: the dive, crouched in the bush, the burst, the run in
    land = td + 0.42
    t_rake = TAUD(18.62)
    deer["segs"] += [
        {"mode": "route", "t0": td, "pts": [[2.75, 73.55], HIDE], "speed": [[0.0, Route([[2.75, 73.55], HIDE]).length / 0.42]]},
        {"mode": "hold", "t0": land, "pos": [HIDE[0], 0.0, HIDE[1]], "yaw": yaw_to(HIDE, [0.0, 75.8])},
    ]
    run_in = [[HIDE[0] - 0.25, HIDE[1] + 0.35], [3.5, 76.6], [1.9, 80.2], [0.9, 86.8], [0.5, 92.0], [0.2, 98.0], [0.18, 101.6], [0.12, 103.3], [0.3, 104.75]]
    rr = Route(run_in)
    t_in_end = TAU_LATCH - 0.25
    rk = [[0.0, 0.0], [0.25, 4.5], [0.75, 7.2]]
    # cruise speed to the end, with a 0.45 s stop inside the door
    span = t_in_end - TAU_BURST
    lo, hi = 2.0, 12.0
    for _ in range(60):
        v = (lo + hi) / 2
        ks = [[0.0, 0.0], [0.25, 4.5], [0.75, v], [span - 0.45, v], [span, 0.0]]
        if dist(ks, span) < rr.length:
            lo = v
        else:
            hi = v
    rk = [[0.0, 0.0], [0.25, 4.5], [0.75, v], [span - 0.45, v], [span, 0.0]]
    A["deer_run_v"] = v
    deer["segs"] += [
        {"mode": "hold", "t0": TAU_BURST - 0.6, "pos": [HIDE[0], 0.0, HIDE[1]], "yaw": yaw_to(HIDE, [1.9, 80.2])},
        {"mode": "route", "t0": TAU_BURST, "pts": run_in, "speed": rk},
        arrive({"mode": "route", "t0": t_in_end + 0.03, "pts": [[0.3, 104.75], PRESS["deer"]], "speed": [[0.0, 0.0], [0.1, 3.0], [0.25, 2.6], [0.4, 0.0]], "yaw": PI}),
        {"mode": "hold", "t0": t_in_end + 0.43, "pos": [PRESS["deer"][0], 0.0, PRESS["deer"][1]], "yaw": PI},
    ]
    deer["fx"] += [
        {"type": "dive", "t": td, "dur": 0.42, "h": 0.5},
        {"type": "yoff", "t": land, "dur": 99.0, "keys": [[land, 0.0], [land + 0.25, -0.3], [t_rake - 0.02, -0.3], [t_rake + 0.16, -0.4], [TAU_SHAKE - 0.3, -0.4], [TAU_SHAKE, -0.32], [TAU_BURST - 0.12, -0.34], [TAU_BURST + 0.05, 0.0]]},
        {"type": "jump", "t": TAU_BURST + 0.02, "dur": 0.34, "h": 0.32},
    ]
    deer["props_rustle"] = [td + 0.36, TAU_SHAKE, TAU_SHAKE + 0.2, TAU_BURST]
    crouch = {"thigh.L": [75, 0, -6], "thigh.R": [75, 0, 6], "shin.L": [-115, 0, 0], "shin.R": [-115, 0, 0], "foot.L": [30, 0, 0], "foot.R": [30, 0, 0],
              "spine": [-18, 0, 0], "chest": [-6, 0, 0]}
    def C(extra):
        d = copy.deepcopy(crouch)
        for k, v2 in extra.items():
            d[k] = v2
        return d
    t_rake = TAUD(18.62)
    deer["pose"] = [k for k in deer["pose"] if k[0] < td - 0.3] + [
        [td - 0.25, {"spine": [-12, 0, 0], "head": [0, 28, 0]}],          # spots the bush
        [td, {"spine": [-30, 0, 0], "upper_arm.L": [70, 0, -60], "upper_arm.R": [70, 0, 60], "head": [10, 0, 0]}],
        [td + 0.3, {"spine": [-60, 0, 0], "upper_arm.L": [80, 0, -80], "upper_arm.R": [80, 0, 80], "thigh.L": [-10, 0, 0], "thigh.R": [-14, 0, 0]}],
        [land, C({"upper_arm.L": [40, 0, 20], "upper_arm.R": [40, 0, -20], "forearm.L": [60, 0, 0], "forearm.R": [60, 0, 0]})],
        [land + 0.35, C({"head": [-6, 0, 0], "upper_arm.L": [30, 0, 22], "upper_arm.R": [30, 0, -22], "forearm.L": [80, 0, 0], "forearm.R": [80, 0, 0]})],
        # light coming: eyes up at the antler, a hand up to it, pulls it down (head dips and tilts)
        [t_rake - 0.35, C({"head": [8, 0, 0], "upper_arm.L": [30, 0, 22], "upper_arm.R": [30, 0, -22], "forearm.L": [80, 0, 0], "forearm.R": [80, 0, 0]})],
        [t_rake - 0.05, C({"head": [10, 0, 0], "upper_arm.R": [30, 0, 105], "forearm.R": [20, 0, 70], "upper_arm.L": [30, 0, 22], "forearm.L": [80, 0, 0]})],
        [t_rake + 0.16, C({"head": [-16, 0, 30], "neck": [-6, 0, 10], "upper_arm.R": [30, 0, 112], "forearm.R": [20, 0, 80], "spine": [-26, 0, 0],
                           "upper_arm.L": [30, 0, 22], "forearm.L": [80, 0, 0]}), "out"],
        [t_rake + 1.4, C({"head": [-16, 0, 30], "neck": [-6, 0, 10], "upper_arm.R": [30, 0, 112], "forearm.R": [20, 0, 80], "spine": [-26, 0, 0],
                          "upper_arm.L": [30, 0, 22], "forearm.L": [80, 0, 0]})],
        [t_rake + 2.6, C({"head": [-12, 0, 22], "neck": [-4, 0, 8], "upper_arm.R": [30, 0, 100], "forearm.R": [20, 0, 70], "spine": [-24, 0, 0],
                          "upper_arm.L": [30, 0, 22], "forearm.L": [80, 0, 0]})],
        [TAU_SHAKE - 0.15, C({"upper_arm.L": [30, 0, 22], "upper_arm.R": [30, 0, -22], "forearm.L": [80, 0, 0], "forearm.R": [80, 0, 0]})],
        [TAU_SHAKE + 0.2, C({"spine": [-8, 0, 0], "upper_arm.L": [60, 0, -30], "upper_arm.R": [60, 0, 30]})],
        # out: arms up, then flailing at a sprint
        [TAU_BURST + 0.1, {"spine": [-10, 0, 0], "upper_arm.L": [20, 0, -115], "upper_arm.R": [20, 0, 115], "forearm.L": [0, 0, -30], "forearm.R": [0, 0, 30], "head": [6, 0, 0]}],
        [TAU_BURST + 0.6, {"spine": [-14, 0, 0], "upper_arm.L": [10, 0, -34], "upper_arm.R": [10, 0, 34]}],
        [t_in_end - 0.1, {"spine": [-10, 0, 0], "upper_arm.L": [10, 0, -30], "upper_arm.R": [10, 0, 30]}],
        [t_in_end + 0.3, {"spine": [8, 0, 0], "upper_arm.L": [40, 0, -20], "upper_arm.R": [40, 0, 20]}],
        # pressed against the door, listening
        [t_in_end + 0.43, PRESS_POSE(0)], [TAU_LATCH + 0.45, PRESS_POSE(14)], [TAU_LATCH + 0.75, PRESS_POSE(-10)],
        [TAU_LAND - 0.75, PRESS_POSE(-10)], [TAU_LAND - 0.55, dict(PRESS_POSE(-6), head=[-8, -6, -8])], [TAU_LAND + 1.0, dict(PRESS_POSE(-6), head=[-8, -6, -8])],
    ]
    deer["face"] = [k for k in deer["face"] if k[0] < td - 0.3] + [
        [td - 0.3, {"brow_up": 0.9, "open": 0.7}],
        [td - 0.1, {"brow_up": 1.0, "smile": 0.6, "squint": 0.3, "open": 0.2}, "snap"],     # the idea
        [land + 0.1, {"squint": 1.0, "open": 0.0, "brow_angry": 0.3}],
        [land + 0.6, {"brow_up": 0.7, "open": 0.0, "squint": 0.2}],
        [t_rake - 0.1, {"brow_up": 1.0, "squint": 0.0, "open": 0.15}],
        [t_rake + 0.15, {"squint": 0.9, "brow_up": 0.6, "open": 0.0, "blink": 0.0}, "snap"],
        [t_rake + 1.6, {"squint": 0.6, "brow_up": 0.8}],
        [t_rake + 2.4, {"squint": 0.2, "brow_up": 0.6}],
        [TAU_SHAKE, {"brow_angry": 0.6, "open": 0.3}],
        [TAU_BURST + 0.1, {"brow_up": 1.0, "open": 0.95, "squint": 0.3}],
        [t_in_end + 0.4, {"brow_up": 1.0, "open": 0.7}],
        [t_in_end + 0.9, {"brow_up": 0.8, "open": 0.0, "squint": 0.4}],
    ]
    deer["snowcoat"] = {"t": TAU_BURST - 0.05, "drop": {"idx": 0, "t_land": TAU_LAND, "floor": 0.0, "land": [PRESS["deer"][0] - 0.18, PRESS["deer"][1] + 0.42]},
                        "lumps": [
                            {"bone": "head", "pos": [0.215, 1.61, 0.0], "size": [0.13, 0.08, 0.11], "roll": -0.3},
                            {"bone": "head", "pos": [-0.2, 1.6, 0.01], "size": [0.11, 0.07, 0.1], "roll": 0.3},
                            {"bone": "head", "pos": [0.0, 1.5, 0.06], "size": [0.3, 0.11, 0.26]},
                            {"bone": "head", "pos": [0.1, 1.36, 0.22], "size": [0.2, 0.11, 0.13]},
                            {"bone": "head", "pos": [-0.27, 1.25, 0.06], "size": [0.12, 0.09, 0.14], "roll": 0.6},
                            {"bone": "chest", "pos": [-0.25, 0.88, 0.02], "size": [0.16, 0.07, 0.14]},
                            {"bone": "chest", "pos": [0.26, 0.87, -0.03], "size": [0.15, 0.07, 0.13]},
                            {"bone": "hips", "pos": [0.0, 0.64, 0.18], "size": [0.17, 0.08, 0.09]},
                        ]}
    A["t_rake"] = t_rake
    A["deer_land"] = land
    A["t_in_end"] = t_in_end

    # ---- the lead: waves frantically at the bush, then in, then pressed to the door
    t_wave = A["lead_arrive"] + 0.45
    t_lead_in = TAU_LATCH - 1.05
    lead["segs"] += [
        arrive({"mode": "route", "t0": t_lead_in, "pts": [[-0.2, 101.5], [-0.55, 103.2], [-0.75, 104.55]], "speed": [[0.0, 0.0], [0.15, 3.6], [0.45, 3.6], [0.65, 0.0]]}),
        {"mode": "route", "t0": t_lead_in + 0.7, "pts": [[-0.75, 104.55], PRESS["lead"]], "speed": [[0.0, 0.0], [0.15, 2.0], [0.4, 1.6], [0.6, 0.0]], "yaw": PI},
        {"mode": "hold", "t0": t_lead_in + 1.3, "pos": [PRESS["lead"][0], 0.0, PRESS["lead"][1]], "yaw": PI},
    ]
    wave_up = {"upper_arm.L": [15, 0, -110], "upper_arm.R": [15, 0, 110], "forearm.L": [0, 0, -30], "forearm.R": [0, 0, 30], "spine": [6, 0, 0]}
    wave_a = {"upper_arm.L": [20, 0, -128], "upper_arm.R": [10, 0, 92], "forearm.L": [0, 0, -45], "forearm.R": [0, 0, 15], "spine": [6, 0, -4], "head": [6, 0, -4]}
    wave_b = {"upper_arm.L": [10, 0, -92], "upper_arm.R": [20, 0, 128], "forearm.L": [0, 0, -15], "forearm.R": [0, 0, 45], "spine": [6, 0, 4], "head": [6, 0, 4]}
    lp = [k for k in lead["pose"] if k[0] < A["lead_arrive"] - 0.6]
    lp += [[A["lead_arrive"] - 0.3, {"spine": [-6, 0, 0]}], [A["lead_arrive"] + 0.1, {"spine": [4, 0, 0], "head": [4, 0, 0]}], [t_wave - 0.1, wave_up]]
    t = t_wave
    i = 0
    while t < TAU_SHAKE - 0.7:
        lp.append([t, wave_a if i % 2 == 0 else wave_b])
        t += 0.19
        i += 1
    lp += [
        # the beat: arms drop, staring at the empty path
        [TAU_SHAKE - 0.45, {"upper_arm.L": [20, 0, -8], "upper_arm.R": [20, 0, 8], "spine": [-4, 0, 0], "head": [-2, 0, 0]}],
        [TAU_SHAKE + 0.15, {"upper_arm.L": [20, 0, -8], "upper_arm.R": [20, 0, 8], "spine": [-6, 0, 0], "head": [4, 0, 0]}],
        # come on come on: one arm windmilling him in
        [TAU_BURST + 0.4, {"upper_arm.R": [20, 0, 120], "forearm.R": [0, 0, 40], "spine": [2, 0, 0]}],
        [TAU_BURST + 0.7, {"upper_arm.R": [60, 0, 70], "forearm.R": [80, 0, 0], "spine": [2, 0, 0]}],
        [TAU_BURST + 1.0, {"upper_arm.R": [20, 0, 120], "forearm.R": [0, 0, 40]}],
        [TAU_BURST + 1.3, {"upper_arm.R": [60, 0, 70], "forearm.R": [80, 0, 0]}],
        [TAU_BURST + 1.6, {"upper_arm.R": [20, 0, 120], "forearm.R": [0, 0, 40]}],
        [TAU_BURST + 1.9, {"upper_arm.R": [60, 0, 70], "forearm.R": [80, 0, 0]}],
        [t_lead_in, {"spine": [-8, 0, 0]}],
        [t_lead_in + 0.75, {"spine": [4, 0, 0]}],
        [t_lead_in + 1.3, PRESS_POSE(0)], [TAU_LATCH + 0.5, PRESS_POSE(-16)], [TAU_LATCH + 0.85, PRESS_POSE(12)], [TAU_LAND + 1.0, PRESS_POSE(12)],
    ]
    lead["pose"] = lp
    lead["face"] = [k for k in lead["face"] if k[0] < A["lead_arrive"] - 0.6] + [
        [A["lead_arrive"], {"brow_up": 1.0, "open": 0.9, "brow_angry": 0.3}],
        [TAU_SHAKE - 0.5, {"brow_up": 0.6, "open": 0.2}],
        [TAU_SHAKE + 0.1, {"brow_up": 1.0, "open": 0.5}],
        [TAU_BURST + 0.3, {"brow_up": 1.0, "open": 0.9, "smile": 0.3}],
        [t_lead_in + 1.5, {"brow_up": 0.9, "open": 0.1, "squint": 0.3}],
    ]
    # ---- the elf: holds the door, waves the deer on, walks in with the door
    t_elf_in = TAU_LATCH - 0.5
    elf["segs"] += [
        arrive({"mode": "route", "t0": t_elf_in, "pts": [[-0.95, 101.85], [-0.6, 103.3], [-0.1, 104.3]], "speed": [[0.0, 0.0], [0.12, 3.4], [0.3, 3.2], [0.48, 0.0]]}),
        arrive({"mode": "route", "t0": t_elf_in + 0.5, "pts": [[-0.1, 104.3], [0.7, 103.9], PRESS["elf"]], "speed": [[0.0, 0.0], [0.1, 3.2], [0.3, 2.8], [0.45, 0.0]], "rest_yaw": PI}),
        {"mode": "hold", "t0": t_elf_in + 0.95, "pos": [PRESS["elf"][0], 0.0, PRESS["elf"][1]], "yaw": PI},
    ]
    hold_door = {"upper_arm.R": [80, 0, -20], "forearm.R": [10, 0, 0], "spine": [-4, 0, 0]}
    ep = [k for k in elf["pose"] if k[0] < A["elf_arrive"] - 0.6]
    ep += [[A["elf_arrive"] - 0.3, {"spine": [-6, 0, 0]}],
           [A["elf_arrive"] + 0.1, {"upper_arm.R": [70, 0, -10], "forearm.R": [30, 0, 0], "spine": [-8, 0, 0]}],
           [A["elf_arrive"] + 0.5, hold_door],
           # leaning out to look, beckoning with the free hand
           [A["elf_arrive"] + 1.0, dict(hold_door, **{"upper_arm.L": [60, 0, 20], "forearm.L": [70, 0, 0], "head": [0, -15, 0]})],
           [A["elf_arrive"] + 1.2, dict(hold_door, **{"upper_arm.L": [60, 0, 20], "forearm.L": [120, 0, 0], "hand.L": [30, 0, 0], "head": [0, -15, 0]})],
           [A["elf_arrive"] + 1.4, dict(hold_door, **{"upper_arm.L": [60, 0, 20], "forearm.L": [70, 0, 0], "head": [0, -15, 0]})],
           [A["elf_arrive"] + 1.6, dict(hold_door, **{"upper_arm.L": [60, 0, 20], "forearm.L": [120, 0, 0], "hand.L": [30, 0, 0], "head": [0, -15, 0]})],
           [TAU_SHAKE - 0.5, dict(hold_door, **{"head": [4, -10, 0]})],
           [TAU_BURST + 0.3, dict(hold_door, **{"head": [8, -12, 0], "spine": [2, 0, 0]})],
           [t_elf_in, hold_door],
           [t_elf_in + 0.4, {"upper_arm.R": [-30, 0, -30], "forearm.R": [20, 0, 0], "spine": [8, 0, 0]}],
           [t_elf_in + 0.95, PRESS_POSE(0)], [TAU_LATCH + 0.55, PRESS_POSE(10)], [TAU_LATCH + 0.9, PRESS_POSE(-14)], [TAU_LAND + 1.0, PRESS_POSE(-14)]]
    elf["pose"] = ep
    elf["face"] = [k for k in elf["face"] if k[0] < A["elf_arrive"] - 0.6] + [
        [A["elf_arrive"], {"brow_angry": 0.6, "open": 0.6}],
        [TAU_SHAKE - 0.5, {"brow_up": 0.6, "open": 0.2}],
        [TAU_BURST + 0.2, {"brow_up": 1.0, "open": 0.8, "smile": 0.2}],
        [t_elf_in + 1.1, {"brow_up": 0.8, "open": 0.0, "squint": 0.4}],
    ]
    # the two take another stride, then look back for the missing friend
    for a, side in [(lead, 1), (elf, -1)]:
        pk = [k for k in a["pose"] if not (td - 0.05 < k[0] < td + 2.4)]
        pk += [[td + 0.32, {"spine": [-9, 0, 0]}], [td + 0.6, {"spine": [-4, 0, 0], "head": [0, 70 * side, 0], "neck": [0, 18 * side, 0]}],
               [td + 1.15, {"spine": [-4, 0, 0], "head": [0, 76 * side, 0], "neck": [0, 18 * side, 0]}], [td + 1.6, {"spine": [-9, 0, 0]}]]
        a["pose"] = sorted(pk, key=lambda k: k[0])
        fk = [k for k in a["face"] if not (td - 0.05 < k[0] < td + 2.4)]
        fk += [[td + 0.5, {"brow_up": 1.0, "open": 0.7}], [td + 1.0, {"brow_up": 1.0, "open": 0.9, "brow_angry": 0.2}], [td + 1.7, {"brow_up": 0.8, "open": 0.6}]]
        a["face"] = sorted(fk, key=lambda k: k[0])
    lead["pose"] = sorted(lead["pose"], key=lambda k: k[0])
    elf["pose"] = sorted(elf["pose"], key=lambda k: k[0])
    A["t_wave"] = t_wave
    return actors


# ================================================================== THE CART
CART_PTS = [CART_P, [4.4, 6.0], [1.6, 9.1], [-2.1, 11.6], [-5.0, 15.7], [-7.6, 19.4], [-7.95, 23.5], [-6.0, 27.5], [-2.7, 29.6],
            [-0.3, 31.7], [0.35, 36.0], [0.4, 50.0], [0.3, 66.0], [0.9, 69.0], [1.0, 75.0], [0.6, 81.0], [0.6, 85.2], [2.6, 86.6], [8.0, 86.7],
            [15.0, 86.6], [20.6, 86.7], [23.4, 88.2], [22.6, 90.3], [19.0, 90.7], [10.0, 90.5], [3.6, 90.4], [1.1, 91.9], [0.6, 93.8], [0.55, 95.6]]


def lead_pos(actors, tau):
    """the lead's (x, z) at tau from its route segment"""
    lead = actors[0]
    for sg in lead["segs"]:
        if sg["mode"] == "route" and sg["t0"] <= tau and len(sg["pts"]) > 8:
            r = Route(sg["pts"])
            return r.at(sg.get("s0", 0.0) + dist(sg["speed"], tau - sg["t0"]))
    return None


def cart_plan(actors, A):
    cr = Route(CART_PTS)
    A["cart_route"] = cr
    t0c = TAU_L + 0.95
    # desired cart-centre arc length at knots: (tau, s).  Chasing: the cart's
    # nose `gap` seconds of the lead's travel behind the lead
    def s_behind(tau, gap_s, nose=1.55):
        p = lead_pos(actors, tau - gap_s)
        return s_near(cr, p) - nose
    s_bush = s_near(cr, [1.0, 75.5])
    s_junc = s_near(cr, [8.0, 86.7])
    s_uturn_a = s_near(cr, [20.6, 86.7])
    s_uturn_b = s_near(cr, [19.0, 90.7])
    s_back = s_near(cr, [3.6, 90.4])
    knots = [(t0c + 0.25, 0.0), (t0c + 0.45, 0.06)]
    knots += [(11.6, s_behind(11.6, 0.55)), (12.4, s_behind(12.4, 0.32)), (13.0, s_behind(13.0, 0.33)),
              (13.9, s_behind(13.9, 0.48)), (14.5, s_behind(14.5, 0.58)), (A["tau_dive"], s_behind(A["tau_dive"], 0.72)), (A["tau_dive"] + 0.8, s_behind(A["tau_dive"] + 0.8, 0.85))]
    # after the bush: the junction, east along the road, the U-turn, back
    tb = TAUD(19.05)
    L_ = TAU(T_LATCH)
    knots += [(tb + 1.6, s_near(cr, [2.6, 86.6])), (tb + 3.0, s_junc + 3.0), (L_ - 5.1, s_uturn_a),
              (L_ - 3.5, s_uturn_b), (L_ - 2.7, s_near(cr, [12.0, 90.5])), (L_ - 1.45, s_back),
              (L_ - 0.3, s_near(cr, [0.6, 93.8])), (L_ + 0.6, cr.length - 0.02)]
    # around the fountain: from rest at 6.45, accelerate (3.4 m/s^2) - the value at 9.35 is wherever that puts it
    s = []
    # build a dense s(t) by monotone piecewise-cubic interpolation of the knots
    k2 = [k for k in knots if k[1] is not None]
    # insert the accelerating stretch: s = 0.5*a*(t-6.45)^2 up to 9.5 m/s
    a = 3.6
    def s_acc(t):
        u = max(0.0, t - (t0c + 0.25))
        tv = 9.8 / a
        return 0.5 * a * u * u if u < tv else 0.5 * a * tv * tv + 9.8 * (u - tv)
    pts = [(t0c + 0.25 + i * 0.25, s_acc(t0c + 0.25 + i * 0.25)) for i in range(0, 22)]
    pts = [p for p in pts if p[0] < 10.4]
    pts += [k for k in k2 if k[0] > 10.4]
    pts.sort()
    ts = [p[0] for p in pts]
    ss = [p[1] for p in pts]
    # monotone cubic (Fritsch-Carlson)
    n = len(ts)
    d = [(ss[i + 1] - ss[i]) / (ts[i + 1] - ts[i]) for i in range(n - 1)]
    m = [d[0]] + [(d[i - 1] + d[i]) / 2 if d[i - 1] * d[i] > 0 else 0.0 for i in range(1, n - 1)] + [0.0]
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
            return ss[-1]
        for i in range(n - 1):
            if t <= ts[i + 1]:
                h = ts[i + 1] - ts[i]
                u = (t - ts[i]) / h
                h00 = 2 * u ** 3 - 3 * u ** 2 + 1; h10 = u ** 3 - 2 * u ** 2 + u; h01 = -2 * u ** 3 + 3 * u ** 2; h11 = u ** 3 - u ** 2
                return h00 * ss[i] + h10 * h * m[i] + h01 * ss[i + 1] + h11 * h * m[i + 1]
    # speed keys (piecewise-linear v) every 0.1 s that integrate to s(t)
    keys = [[0.0, 0.0]]
    step = 0.1
    t = t0c
    acc_s = 0.0
    v_prev = 0.0
    while t < TAU(T_LATCH + 1.6):
        target = s_of(t + step) - s_of(t0c)
        # v at the end of the step so that the trapezoid hits the target
        v_new = max(0.0, 2 * (target - acc_s) / step - v_prev)
        keys.append([round(t + step - t0c, 4), round(v_new, 4)])
        acc_s += (v_prev + v_new) * 0.5 * step
        v_prev = v_new
        t += step
    keys.append([round(t - t0c + 0.1, 4), 0.0])
    # smooth the alternating trapezoid artefacts (keep the integral)
    A["cart_vmax"] = max(k[1] for k in keys)
    A["cart_s_of"] = s_of
    cart = {"id": "cart", "index": 0, "pts": CART_PTS, "t0": t0c, "s0": s_of(t0c), "speed": keys,
            "headlights": [[-20.0, 0.0], [TAU_L - 0.001, 0.0], [TAU_L, 1.0]],
            "beacon": [[-20.0, 0.0], [TAU_L + 0.12, 0.0], [TAU_L + 0.13, 1.0]],
            "steer_k": [[t0c, 0.0], [t0c + 0.08, 0.0], [t0c + 0.26, -1.0]], "steer_until": t0c + 0.55,
            "hl_opts": {"energy": 6.0, "range": 30.0, "angle": 27.0, "tilt": 5.0, "beam_len": 11.0, "beam_radius": 2.2, "beam_glow": 0.1, "glare": 0.5}}
    officer = {
        "id": "officer", "role": "watch", "look": WATCH,
        "segs": [{"mode": "cart", "t0": -20.0, "cart": "cart"}],
        "pose": [[-20.0, {"head": [-4, 0, 0]}], [TAU_L - 0.3, {"head": [-4, 0, 0]}], [TAU_L + 0.4, {"head": [-2, 0, 0], "spine": [-6, 0, 0]}]],
        "face": [[-20.0, {"brow_angry": 0.4, "squint": 0.3}]],
    }
    return cart, officer


def bush_prop(A):
    return {"kind": "bush", "id": "bush", "pos": [BUSH[0], BUSH[1]], "snowy": True, "yaw": 0.0,
            "rustle": [A["tau_dive"] + 0.36, TAU_SHAKE, TAU_BURST],
            "puffs": [[A["tau_dive"] + 0.38, 1.2, 0.3, 1.0, 0.0], [A["t_rake"] + 0.6, 0.35, 0.0, 0.3, 0.0],
                      [TAU_SHAKE + 0.02, 0.9, 0.0, 1.0, 0.0], [TAU_BURST + 0.02, 1.4, 0.5, 1.0, 0.4]],
            "tremble": [[TAU_SHAKE - 0.3, 0.0], [TAU_SHAKE - 0.05, 0.6], [TAU_SHAKE + 0.3, 0.9], [TAU_BURST + 0.3, 0.0]]}


# ================================================================= THE SHOTS
def build():
    actors, A = story()
    ending(actors, A)
    cart, officer = cart_plan(actors, A)
    s_of = A.pop("cart_s_of")
    dep = departure()
    campus = {"world": "campus", "trees": [[-13.0, 52.0, 3.4, 0.4]], "active_waters": []}
    room = {"xmas_room": True, "room_opts": {}, "snow_clip": [-22.0, -2.0, 103.05, 22.0, 6.0, 113.0]}
    dorm_lights = [
        {"type": "omni", "pos": [-1.5, 2.9, 108.6], "color": [1.0, 0.78, 0.55], "energy": 1.1, "range": 9.0, "atten": 1.2},
        {"type": "omni", "pos": [-3.2, 1.0, 104.4], "color": [1.0, 0.7, 0.45], "energy": 0.9, "range": 4.0},
        {"type": "omni", "pos": [0.0, 2.9, 102.2], "color": [1.0, 0.82, 0.6], "energy": 1.6, "range": 5.0},
    ]
    # where the runners cross the drift (C3): the lead at tau 15.0
    zp = lead_pos(actors, 13.55)[1] + 1.2
    A["patch_z"] = zp
    story_set = dict(campus)
    story_set.update({"actors": actors + [officer], "carts": [cart],
                      "props": [bush_prop(A), {"kind": "snowpatch", "id": "drift", "pos": [-0.2, zp], "y": 0.07, "rx": 1.9, "rz": 2.3, "yaw": 0.06, "seed": 11}]})
    end_set = dict(story_set)
    end_set.update(room)
    end_set["doors"] = {"L": door_ret(A), "R": door_ret(A, "lead", 86.0, 0.05)}
    shots = {}
    edl = []

    def hl(shot, energy, glare=0.5, glow=0.1):
        c = copy.deepcopy(shot["carts"][0])
        c["hl_opts"].update({"energy": energy, "glare": glare, "beam_glow": glow})
        shot["carts"] = [c]

    def add(sid, T0, T1, shot, fps=30):
        shot = copy.deepcopy(shot)
        shot["dur"] = round(T1 - T0, 4)
        shots[sid] = shot
        edl.append([sid, round(T0, 4), round(T1 - T0, 4), fps])

    # ---- A1 0:00-0:03.1 the warm lobby; the elf at the glass door; out
    a1 = dict(campus)
    a1.update(room)
    a1.update({"actors": dep, "doors": {"R": DOOR_OUT}, "tau0": 0.0, "lights": dorm_lights, "exposure": 0.92})
    a1["cam"] = [
        {"t": 0.0, "pos": [1.55, 1.42, 110.7], "at": [0.2, 1.28, 103.2], "fov": 44.0},
        {"t": 1.4, "pos": [1.4, 1.34, 109.6], "at": [0.2, 1.2, 103.0], "fov": 42.0},
        {"t": T_CUT_OUT, "pos": [0.95, 1.12, 106.9], "at": [0.25, 0.85, 100.8], "fov": 40.0, "ease": "in"},
    ]
    add("v2_a1_lobby", 0.0, T_CUT_OUT, a1)
    # ---- A2 the slipper lands on the rim (match cut)
    a2 = dict(story_set)
    a2["tau0"] = T_CUT_OUT - FT
    a2["cam"] = [{"t": 0.0, "pos": [TEST_X + 0.12, 0.92, 14.35], "at": [TEST_X, 0.58, 16.1], "fov": 36.0},
                 {"t": 0.6, "pos": [TEST_X + 0.1, 0.9, 14.5], "at": [TEST_X, 0.6, 16.2], "fov": 35.0}]
    add("v2_a2_rim_foot", T_CUT_OUT, 3.9, a2)
    # ---- A3a from the water: the toe test, the recoil, the friends
    a3 = dict(story_set)
    a3["tau0"] = 3.9 - FT
    a3["cam"] = [{"t": 0.0, "pos": [3.35, 0.8, 18.35], "at": [0.55, 0.75, 14.6], "fov": 40.0},
                 {"t": 1.3, "pos": [3.3, 0.85, 18.3], "at": [0.6, 0.8, 14.0], "fov": 41.0},
                 {"t": 2.5, "pos": [3.2, 0.95, 18.25], "at": [0.6, 0.9, 13.6], "fov": 43.0}]
    add("v2_a3_toe_test", 3.9, 6.0, a3)
    # ---- A3b the three by the fountain, the lit lobby beyond; CLICK; the bolt
    a4 = dict(story_set)
    a4["tau0"] = 6.0 - FT
    a4["cam"] = [{"t": 0.0, "pos": [-1.75, 0.95, 10.2], "at": [1.2, 1.0, 15.9], "fov": 46.0},
                 {"t": 2.0, "pos": [-1.6, 0.93, 10.45], "at": [1.2, 1.0, 15.9], "fov": 45.0},
                 {"t": 3.3, "pos": [-1.55, 0.93, 10.5], "at": [0.0, 1.0, 16.2], "fov": 45.0}]
    hl(a4, 10.0)
    add("v2_b1_lights", 6.0, 9.2, a4)
    # ---- B2 low on the front wheel: it cuts hard, the cart surges
    b2 = dict(story_set)
    b2["tau0"] = 9.2 - FT
    b2["cam"] = [{"t": 0.0, "pos": {"rel": "cart", "tau": 9.2 - FT, "off": [-3.1, 0.4, -1.3]}, "at": {"rel": "cart", "tau": 9.2 - FT, "off": [-0.6, 0.38, -0.95]}, "fov": 42.0},
                 {"t": 0.75, "pos": {"rel": "cart", "tau": 9.2 - FT, "off": [-3.15, 0.4, -1.4]}, "at": {"rel": "cart", "tau": 9.2 - FT, "off": [-0.4, 0.45, -2.6]}, "fov": 43.0}]
    add("v2_b2_wheels", 9.2, 9.9, b2)
    # ---- C1 moving wide: around the outside of the fountain, the cart cutting the corner
    c1 = dict(story_set)
    c1["tau0"] = 9.9 - FT
    c1["cam"] = [{"t": 0.0, "pos": [-17.5, 3.8, 26.0], "at": [-5.5, 0.6, 19.0], "fov": 44.0},
                 {"t": 2.35, "pos": [-16.8, 3.3, 31.0], "at": [-6.0, 0.7, 26.0], "fov": 42.0}]
    hl(c1, 10.0, 0.6, 0.12)
    add("v2_c1_round", 9.9, 12.0, c1)
    # ---- C2 alongside at waist height: the beam on their backs, the look back, the tyre
    c2 = dict(story_set)
    c2["tau0"] = 9.6
    c2["cam"] = [{"t": 0.0, "pos": {"rel": "lead", "off": [3.5, 0.72, 0.4], "yaw_fixed": 180.0, "base_y": 0.0}, "at": {"rel": "lead", "off": [0.0, 0.75, 0.35], "yaw_fixed": 180.0, "base_y": 0.0}, "fov": 52.0},
                 {"t": 2.1, "pos": {"rel": "lead", "off": [3.2, 0.7, 0.5], "yaw_fixed": 180.0, "base_y": 0.0}, "at": {"rel": "lead", "off": [0.0, 0.72, 0.5], "yaw_fixed": 180.0, "base_y": 0.0}, "fov": 52.0}]
    hl(c2, 4.5, 0.4, 0.04)
    add("v2_c2_alongside", 12.0, T_HANDOFF, c2, 60)
    # ---- C2b on the handoff: from ahead of them, the cart right on their heels
    c2b = dict(story_set)
    c2b["tau0"] = 11.45
    c2b["cam"] = [{"t": 0.0, "pos": {"rel": "lead", "off": [2.4, 0.6, -3.6], "yaw_fixed": 180.0, "base_y": 0.0}, "at": {"rel": "lead", "off": [0.2, 0.95, 2.2], "yaw_fixed": 180.0, "base_y": 0.0}, "fov": 46.0},
                  {"t": 15.4 - T_HANDOFF, "pos": {"rel": "lead", "off": [2.2, 0.55, -3.2], "yaw_fixed": 180.0, "base_y": 0.0}, "at": {"rel": "lead", "off": [0.2, 0.95, 2.4], "yaw_fixed": 180.0, "base_y": 0.0}, "fov": 46.0}]
    hl(c2b, 8.0, 0.55, 0.11)
    add("v2_c2b_gain", T_HANDOFF, 15.4, c2b, 60)
    # ---- C3 low beside the path: three pairs of feet, then the tyre through the prints
    c3 = dict(story_set)
    c3["tau0"] = 13.05
    c3["cam"] = [{"t": 0.0, "pos": [-3.1, 0.62, zp - 1.25], "at": [-0.1, 0.05, zp + 0.25], "fov": 40.0},
                 {"t": 1.6, "pos": [-3.05, 0.6, zp - 1.15], "at": [-0.1, 0.05, zp + 0.35], "fov": 40.0}]
    add("v2_c3_prints", 15.4, 17.0, c3, 60)
    # ---- D1 side-on past the bush: the idea, the dive; the other two run on, then look back
    d1 = dict(story_set)
    d1["tau0"] = TAUD(17.0)
    d1["cam"] = [{"t": 0.0, "pos": [-6.0, 1.0, 71.9], "at": [2.4, 0.85, 73.2], "fov": 40.0},
                 {"t": 1.0, "pos": [-5.9, 0.98, 72.5], "at": [2.8, 0.85, 74.4], "fov": 40.0}]
    add("v2_d1_dive", 17.0, 18.0, d1)
    # ---- D2 low inside the bush: the light, the antler, the cart rushes past
    d2 = dict(story_set)
    d2["tau0"] = TAUD(18.0)
    d2["cam"] = [{"t": 0.0, "pos": [3.5, 0.62, 75.64], "at": [5.3, 0.72, 75.48], "fov": 44.0},
                 {"t": 2.6, "pos": [3.56, 0.62, 75.62], "at": [5.3, 0.72, 75.48], "fov": 42.5}]
    d2["props"] = [dict(bush_prop(A), hide_clumps=[0, 2], no_shadow=True)] + d2["props"][1:]
    add("v2_d2_bush", 18.0, 20.6, d2)
    # ---- E1 inside the lobby: the door held, the empty path, the bush shakes, in, shut
    e1 = dict(end_set)
    e1["tau0"] = TAU(20.6)
    e1["lights"] = dorm_lights
    e1["exposure"] = 0.95
    e1["cam"] = [{"t": 0.0, "pos": [0.6, 1.22, 107.4], "at": [3.0, 1.0, 90.0], "fov": 30.0},
                 {"t": T_BURST + 0.3 - 20.6, "pos": [0.6, 1.22, 107.4], "at": [2.9, 1.0, 90.0], "fov": 30.0},
                 {"t": T_LATCH - 0.4 - 20.6, "pos": [0.45, 1.18, 107.2], "at": [1.4, 1.02, 92.0], "fov": 40.0},
                 {"t": T_LATCH + 0.2 - 20.6, "pos": [0.42, 1.18, 107.15], "at": [1.3, 1.02, 92.0], "fov": 40.0}]
    e1["glass_sweep"] = [[TAU(T_LATCH - 0.15), 0.0, 0.1, 0.16, 0.0], [TAU(T_LATCH + 0.02), 0.42, 0.25, 0.18, 1.6], [TAU(T_LATCH + 0.3), 0.5, 0.55, 0.3, 2.4],
                         [TAU(T_LATCH + 0.8), 0.4, 0.55, 0.45, 2.2], [TAU(T_LATCH + 2.3), 0.4, 0.55, 0.45, 2.2]]
    hl(e1, 4.5, 0.22, 0.08)
    add("v2_e1_door", 20.6, 28.65, e1)
    # ---- E2 pressed against the door, listening, in the light through the glass
    e2 = dict(end_set)
    e2["tau0"] = TAU(28.65)
    e2["lights"] = dorm_lights
    e2["glass_sweep"] = e1["glass_sweep"]
    e2["cam"] = [{"t": 0.0, "pos": [-1.9, 1.12, 106.4], "at": [0.25, 1.0, 103.55], "fov": 38.0},
                 {"t": 0.7, "pos": [-1.84, 1.12, 106.32], "at": [0.25, 1.0, 103.55], "fov": 37.0}]
    hl(e2, 4.5, 0.22, 0.08)
    add("v2_e2_listen", 28.65, 29.35, e2)
    # ---- E3 the clump of snow lands on the lobby floor (cut on the landing)
    e3 = dict(end_set)
    e3["tau0"] = TAU(29.35)
    e3["lights"] = dorm_lights
    e3["glass_sweep"] = e1["glass_sweep"]
    lx, lz = PRESS["deer"][0] - 0.18, PRESS["deer"][1] + 0.42
    e3["cam"] = [{"t": 0.0, "pos": [lx + 0.55, 0.2, lz + 0.95], "at": [lx - 0.05, 0.12, lz - 0.1], "fov": 34.0},
                 {"t": 0.4, "pos": [lx + 0.55, 0.2, lz + 0.95], "at": [lx - 0.05, 0.12, lz - 0.1], "fov": 34.0}]
    hl(e3, 4.5, 0.22, 0.08)
    add("v2_e3_snow", 29.35, T_TITLE, e3)

    for sid, sh in shots.items():
        if "doors" in sh and isinstance(sh["doors"], dict):
            sh["doors"] = {k: v for k, v in sh["doors"].items() if v}
    json.dump(r3(shots), open(OUT_JSON, "w"), indent=1)
    info = {k: (r3(v) if not isinstance(v, Route) and not callable(v) else None) for k, v in A.items()}
    info.update({"T_CUT_OUT": T_CUT_OUT, "T_LIGHT": T_LIGHT, "T_STEP": T_STEP, "T_DIVE": T_DIVE, "T_SHAKE": T_SHAKE, "T_LATCH": T_LATCH, "T_LAND": T_LAND, "T_TITLE": T_TITLE, "T_BURST": T_BURST, "T_HANDOFF": T_HANDOFF, "FT": FT, "KD": KD, "KE": KE})
    json.dump({"fps": 30, "dur": 33.0, "clips": edl, "logo": T_TITLE, "info": info}, open(OUT_EDL, "w"), indent=1)
    return shots, edl, A


if __name__ == "__main__":
    shots, edl, A = build()
    for k, v in A.items():
        if isinstance(v, (int, float)):
            print(k, round(v, 3))
    for c in edl:
        print(c)
