#!/usr/bin/env python3
"""Export the authentic evidence the film draws, as plain numbers, to source/src/data/evidence/.

Every file states its provenance. Nothing here is generated or smoothed for looks; the scenes draw these numbers.

  tracking_topdown.json   authors' released ST person-tracking measurements (475 frames, sensor fixed), tracked with
                          the authors' unmodified tracking.py (our run, seed 0) plus the means stored in the released
                          files; the authors' plot constants (wall points, sensor, occluder). x is mirrored for display
                          (flag + note) so the sensor sits left and the person right, as in our room.
  ams_wall_vs_echo.json   raw histogram of the ams 3x3-zone sensor, centre zone, capture iter_22 (no processing).
  ams_U.json              backprojection front view of the ams "U" capture after 1..36 known sensor positions, computed
                          by calling the authors' own utils.backprojection(return_indiv=True) and utils.filter_volume on
                          the authors' data with reconstruction.py's preprocessing reproduced line for line.

Run with:  python3 -I tools/export_evidence.py     (cwd anywhere; the authors' work copy is read, never modified)
The ams .npy files are pickled numpy objects; research/code_reproduction verified with pickletools that they only
reference numpy array/dtype reconstruction before any load.
"""
import json
import os
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "research/code_reproduction/out")
PAPER = os.path.join(ROOT, "research/code_reproduction/work/consumer-nlos/paper")
DST = os.path.join(ROOT, "source/src/data/evidence")
os.makedirs(DST, exist_ok=True)
SRC = {"repo": "https://github.com/sidsoma/consumer-nlos", "commit": "15314de422a765a2d1b72ea7037dfafb2f908d7c", "licence": "MIT (code)",
       "paper": "Somasundaram et al., Imaging hidden objects with consumer LiDAR via motion-induced sampling, Nature 653, 693-699 (2026)"}
r4 = lambda v: [round(float(x), 4) for x in v]

# ---------------------------------------------------------------- tracking
f3 = json.load(open(os.path.join(OUT, "fig3_tracking_trajectory_topdown.json")))
lay = f3["scene_layout_from_authors_code"]
ours = np.array(f3["ours_seed0_mean_xyz"])
stored = np.array(f3["stored_particles_mean_xyz"])
std = np.array(f3["ours_seed0_std_xyz"])
trk = {
    "provenance": "authors' released measurements (ST VL53L8-family evaluation kit, 4x4 zones, 250 ps bins, sensor fixed), "
                  "tracked with the authors' unmodified paper/tracking.py run by us (seed 0); 'stored' = particle means saved in the released files",
    "source": SRC,
    "conditions": ["sensor held still (wall points identical in all frames)", "data released already background-subtracted and wall-masked",
                   "processed with the retroreflective falloff setting (isDiffuse: False); the walker's clothing is not recorded",
                   "occluder and sensor positions are the authors' plot constants", "no ground truth released: accuracy cannot be computed",
                   "frame rate of this capture not recorded in the files: do not convert frames to seconds"],
    "units": "metres; authors' frame: x along the wall, z = distance from the wall; display_x = -x (mirrored so the sensor is left)",
    "mirror_x_for_display": True,
    "num_frames": int(len(ours)),
    "wall_points_xz": [r4([p[0], p[2]]) for p in lay["wall_points_xyz_m"]],
    "sensor_xz": r4(lay["camera_xz_m"]),
    "occluder_xz": [r4(p) for p in lay["occluder_segment_xz_m"]],
    "ours_xz": [r4([p[0], p[2]]) for p in ours],
    "ours_std_xz": [r4([s[0], s[2]]) for s in std],
    "stored_xz": [r4([p[0], p[2]]) for p in stored],
    "comparison": f3["comparison_ours_seed0_vs_stored"],
}
json.dump(trk, open(os.path.join(DST, "tracking_topdown.json"), "w"), separators=(",", ":"))

# ---------------------------------------------------------------- raw echo (ams, centre zone)
f1 = json.load(open(os.path.join(OUT, "fig1_ams_wall_peak_vs_late_return.json")))
z = next(d for d in f1["zones_data"] if d["row"] == 1 and d["col"] == 1)
counts = np.array(z["counts"], float)
peak = int(np.argmax(counts))
bw = f1["bin_width_s"]
t_ns = (np.arange(len(counts)) - peak) * bw * 1e9
keys = {k: z[k] for k in z if k not in ("counts", "time_after_wall_peak_ns", "extra_round_trip_path_cm")}
echo = {
    "provenance": "authors' released raw histogram, plotted numbers only (no processing)",
    "source": {**SRC, "file": f1["source"]["file"]},
    "sensor": "ams multizone time-of-flight sensor (model not named in the code), 3x3 zones, 88 ps bins; centre zone",
    "conditions": ["a different sensor and hidden object from the opening clip", "U-shaped hidden object; sensor stepped through known positions",
                   "ratio is our peak-height measure for this zone and capture"],
    "bin_width_ns": bw * 1e9,
    "counts": r4(counts),
    "time_ns_after_wall_peak": r4(t_ns),
    "wall_peak_bin": peak,
    "zone_measures": keys,
}
json.dump(echo, open(os.path.join(DST, "ams_wall_vs_echo.json"), "w"), separators=(",", ":"))

# ---------------------------------------------------------------- U reconstruction, cumulative over positions
sys.path.insert(0, PAPER)
os.chdir(PAPER)
import yaml  # noqa: E402
from utils import backprojection, filter_volume  # noqa: E402  (authors' functions)

cfg = yaml.safe_load(open("configs/reconstruction.yaml"))
d = os.path.join(cfg["data_dir"], cfg["capture_name"])
n = len([f for f in os.listdir(d) if f.endswith(".npy")]) - 1
hists, clouds = [], []
for i in range(n):  # reconstruction.py lines 22-47, reproduced
    data = np.load(os.path.join(d, f"iter_{i + 1}.npy"), allow_pickle=True).item()
    hist = data["histogram"].reshape(-1, cfg["num_bins"])
    pc = data["point_cloud"]
    rays = pc / np.linalg.norm(pc, axis=-1, keepdims=True)
    tof = (np.argmax(hist, axis=-1) - cfg["t0"]) * cfg["bin_width"]
    pc = rays * (3e8 * tof / 2).reshape(-1, 1)
    x, y = pc[:, 0].copy(), pc[:, 1].copy()
    pc[:, 0], pc[:, 1] = y, -x
    hists.append(hist)
    clouds.append(pc)
g0, g1 = cfg["gates"]
hb = []
for h in hists:  # reconstruction.py lines 51-63
    c = np.zeros_like(h)
    for j in range(h.shape[0]):
        p = np.argmax(h[j])
        c[j, : h.shape[1] - p] = h[j, p:]
    c[:, :g0] = 0
    c[:, g1:] = 0
    hb.append(c)
nx = ny = 6  # reconstruction.py lines 66-84
xp, yp = np.meshgrid(np.linspace(0, 128, nx) / 100, np.linspace(32, 96, ny) / 100)
cam = np.zeros((nx * ny, 3))
cam[:, 0], cam[:, 1] = xp.flatten(), yp.flatten()
cam = np.flip(cam, axis=0).copy()
cam[:, 0] = 1.28 - cam[:, 0]
for i in range(ny):
    if i % 2 == 1:
        cam[i * nx:(i + 1) * nx] = np.flip(cam[i * nx:(i + 1) * nx], axis=0)
cam = cam[: len(hists)]
clouds_bp = [clouds[i] + cam[i].reshape(1, 3) for i in range(len(clouds))]
X, Y, Z = np.meshgrid(np.linspace(*cfg["xlim"], cfg["num_x"]), np.linspace(*cfg["ylim"], cfg["num_y"]), np.linspace(*cfg["zlim"], cfg["num_z"]), indexing="ij")
grid = np.vstack([X.reshape(-1), Y.reshape(-1), Z.reshape(-1)]).T
vp = [cfg["num_x"], cfg["num_y"], cfg["num_z"]]
vol, indiv = backprojection(pt_clouds=clouds_bp, hists=hb, voxel_grid=grid, gates=cfg["gates"], bin_width=cfg["bin_width"],
                            voxel_params=vp, return_indiv=True, show_progress=False)
acc = np.zeros_like(indiv[0])
fronts = []
for k in range(len(indiv)):
    acc = acc + indiv[k]
    v = filter_volume(acc.copy(), cfg["num_x"], cfg["num_y"])
    fronts.append(np.max(v, axis=2).T)  # (y, x), as the authors' front view (before their flip for imshow)
fmax = max(float(f.max()) for f in fronts[-1:])
final_check = float(np.abs(filter_volume(acc.copy(), cfg["num_x"], cfg["num_y"]) - vol).max())
U = {
    "provenance": "authors' backprojection and filter functions (utils.py) called by us on the authors' data, preprocessing as reconstruction.py; "
                  "cumulative over the first k sensor positions",
    "source": {**SRC, "data": "paper/captured_data/ams_U_reconstruction/iter_1..iter_36"},
    "conditions": ["same ams 3x3-zone sensor as the raw-echo plot", "36 sensor positions on a programmed 6x6 serpentine raster (known positions)",
                   "static hidden U-shaped object", "rough outline only: 40x40 front view of a 40x40x20 voxel grid"],
    "grid": {"x_m": cfg["xlim"], "y_m": cfg["ylim"], "nx": cfg["num_x"], "ny": cfg["num_y"]},
    "orientation": "fronts[k][row][col]: row = y index (0 = lowest y), col = x index; the authors' plot shows x inverted (1.1 m at left)",
    "display_gamma_authors": cfg["gamma"],
    "sensor_positions_xy_m": [r4(c[:2]) for c in cam],
    "normalised_by": "max of the final (36-position) front view",
    "fronts": [[r4(np.clip(row / fmax, 0, None)) for row in f] for f in fronts],
    "check_final_equals_authors_volume_maxabs": final_check,
}
json.dump(U, open(os.path.join(DST, "ams_U.json"), "w"), separators=(",", ":"))
print("tracking frames", trk["num_frames"], "| echo wall peak bin", peak, "| U positions", len(fronts), "final-vs-authors max|diff|", final_check)
for f in sorted(os.listdir(DST)):
    print("  ", f, os.path.getsize(os.path.join(DST, f)), "bytes")
