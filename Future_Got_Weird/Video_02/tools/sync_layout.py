#!/usr/bin/env python3
"""Copy the verified room geometry (research/geometry/layout.json, written by geometry_check.py) into the schema the
Remotion kit reads (source/src/data/layout.json), so every drawn path, arc and band comes from the checked numbers.

The kit schema (lib/room.ts, lib/optics.ts) is kept; extra keys carry the second sensor/person frames, band widths
and the operator's standing spot. Re-run after any change to the research layout:  python3 tools/sync_layout.py
"""
import json
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = json.load(open(os.path.join(ROOT, "research/geometry/layout.json")))

room, occ, hp, sen = R["room"], R["occluder"], R["hidden_person"], R["sensor"]
SA, SB = sen["frame_A"]["S"], sen["frame_B1_moved"]["S"]
HA, HB = hp["H_A"], hp["H_B_moved"]
# The checker stands beside the sensor (to its left, same depth) and holds it out toward the wall.
OP = [round(SA[0] - 0.42, 3), round(SA[1] + 0.05, 3)]


def blocked(p, q):
    """Does the straight segment p-q cross the occluder slab?"""
    x0 = occ["from"][0] - occ["thickness"] / 2
    x1 = occ["from"][0] + occ["thickness"] / 2
    for xo in (x0, x1):
        if (p[0] - xo) * (q[0] - xo) < 0:
            t = (xo - p[0]) / (q[0] - p[0])
            z = p[1] + t * (q[1] - p[1])
            if occ["from"][1] <= z <= occ["to"][1]:
                return True
    return False


assert blocked(SA, HA) and blocked(OP, HA), "the operator and the sensor must not see the hidden person"
for w in R["wall_points"]["frame_A"]:
    assert not blocked(SA, w) and not blocked(w, HA), f"path via {w} touches the partition"

out = {
    "note": "Synced from research/geometry/layout.json by tools/sync_layout.py. ILLUSTRATIVE room (metres): physically "
            "sensible, built from the authors' demo guidance; not a paper experiment. x along the relay wall, z = distance "
            "from the wall toward the camera (wall z = 0), h = height.",
    "units": "m",
    "room": {"x0": room["x_min"], "x1": room["x_max"], "z0": room["z_min"], "z1": room["z_max"], "wallHeight": room["wall_height"]},
    "relayWall": {"x0": R["relay_wall"]["from"][0], "x1": R["relay_wall"]["to"][0], "z": 0.0},
    "occluder": {"x": occ["from"][0], "z0": occ["from"][1], "z1": occ["to"][1], "thickness": occ["thickness"], "height": occ["height"]},
    "sensor": {"x": SA[0], "z": SA[1], "h": R["heights"]["sensor_h"], "aimX": sen["frame_A"]["aim_x"]},
    "operator": {"x": OP[0], "z": OP[1]},
    "hidden": {"x": HA[0], "z": HA[1], "h": R["heights"]["torso_h"], "bodyRadius": hp["body_radius_m"]},
    "wallSamples": [{"id": f"W{i + 1}", "x": round(w[0], 4)} for i, w in enumerate(R["wall_points"]["frame_A"])],
    "c_m_per_ns": 0.29979,
    "frames": {
        "A": {"sensor": SA, "aimX": sen["frame_A"]["aim_x"], "zoneEdgesX": sen["frame_A"]["edge_x"], "wallX": sen["frame_A"]["centre_x"]},
        "B1": {"sensor": SB, "aimX": sen["frame_B1_moved"]["aim_x"], "zoneEdgesX": sen["frame_B1_moved"]["edge_x"], "wallX": sen["frame_B1_moved"]["centre_x"]},
    },
    "hiddenB": {"x": HB[0], "z": HB[1], "dt_s": hp["dt_A_to_B2_s"]},
    "bandHalfWidth": {"oneBin": R["band_half_width_m"]["default_1_bin"], "twoBins": R["band_half_width_m"]["alt_2_bins"]},
    "confocalA": R["confocal"]["frame_A_H_A"],
}
dst = os.path.join(ROOT, "source/src/data/layout.json")
json.dump(out, open(dst, "w"), indent=1)
print("wrote", dst)
for c in out["confocalA"]:
    print("  W x=%.3f |SW|=%.3f |WH|=%.3f delay=%.2f ns" % (c["W"][0], c["SW_m"], c["WH_m"], c.get("delay_after_first_bounce_ns", float("nan"))))
