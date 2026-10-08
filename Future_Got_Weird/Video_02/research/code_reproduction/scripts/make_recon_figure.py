"""Film reference figure + JSON for the authors' AMS 'U' backprojection (our run of their code).

Run: python3 -I make_recon_figure.py
Reads out/reconstruction_run/authors_code_volume.npz (written by run_authors_script.py from
the authors' unmodified reconstruction.py) and re-derives, for annotation only, the
sensor scan positions hard-coded in reconstruction.py lines 69-88.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import matplotlib  # noqa: E402
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from safe_load import load_pickled_npy  # noqa: E402

ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "out")
DATA = os.path.join(ROOT, "work", "consumer-nlos", "paper", "captured_data", "ams_U_reconstruction")
vol = np.load(os.path.join(OUT, "reconstruction_run", "authors_code_volume.npz"))["vol"]  # (40,40,20) x,y,z
xlim, ylim, zlim = [0.1, 1.1], [0.1, 1.1], [-0.5, -0.2]  # reconstruction.yaml
nx, ny, nz = vol.shape
xs, ys, zs = np.linspace(*xlim, nx), np.linspace(*ylim, ny), np.linspace(*zlim, nz)

# scan positions exactly as reconstruction.py builds them (lines 69-88)
num_x = num_y = 6
xp = np.linspace(0, 128, num_x) / 100
yp = np.linspace(32, 96, num_y) / 100
xp, yp = np.meshgrid(xp, yp)
cam = np.zeros((36, 3)); cam[:, 0] = xp.flatten(); cam[:, 1] = yp.flatten()
cam = np.flip(cam, axis=0).copy(); cam[:, 0] = 1.28 - cam[:, 0]
for i in range(num_y):
    if i % 2 == 1:
        cam[i * num_x:(i + 1) * num_x, :] = np.flip(cam[i * num_x:(i + 1) * num_x, :], axis=0)

# wall distance per position (sensor-reported, centre zone), from the released files iter_1..36
wall_mm = [float(load_pickled_npy(os.path.join(DATA, f"iter_{i}.npy"))["distance"].reshape(9)[4]) for i in range(1, 37)]

front = vol.max(axis=2)  # (x, y)
top = vol.max(axis=1)    # (x, z)
front_n = np.clip(front / front.max(), 0, 1)
top_n = np.clip(top / top.max(), 0, 1)
gamma = 3.0  # reconstruction.yaml 'gamma' (authors' display choice)

SURF, INK2, MUTED, ORANGE = "#fcfcfb", "#52514e", "#898781", "#eb6834"
plt.rcParams.update({"figure.facecolor": SURF, "savefig.facecolor": SURF, "font.family": "DejaVu Sans",
                     "axes.edgecolor": "#c3c2b7", "xtick.color": MUTED, "ytick.color": MUTED,
                     "axes.labelcolor": INK2, "text.color": "#0b0b0b"})
fig, axes = plt.subplots(1, 2, figsize=(12, 5.6), gridspec_kw={"width_ratios": [1.25, 1]})
ax = axes[0]
ax.imshow(front_n.T ** gamma, origin="lower", cmap="Blues", extent=[xlim[0], xlim[1], ylim[0], ylim[1]])
ax.plot(cam[:, 0], cam[:, 1], "-", color=MUTED, lw=0.8)
ax.plot(cam[:, 0], cam[:, 1], "o", color=ORANGE, ms=4.5, mec=SURF, mew=1)
ax.set_xlim(-0.05, 1.33); ax.set_ylim(0.05, 1.12); ax.invert_xaxis()
ax.set_xlabel("X (m)  [axis inverted as in authors' plot]"); ax.set_ylabel("Y (m)")
ax.set_title("Front view: max projection of backprojected volume\norange = 36 sensor positions hard-coded in reconstruction.py",
             fontsize=10, color=INK2)
ax = axes[1]
ax.imshow(top_n.T ** gamma, origin="lower", cmap="Blues", extent=[xlim[0], xlim[1], zlim[0], zlim[1]], aspect="auto")
ax.invert_xaxis(); ax.set_xlabel("X (m)"); ax.set_ylabel("Z (m)  (sensor frame; wall at z ~ +0.22 to +0.27 m)")
ax.set_title("Top view (x-z) of the same volume", fontsize=10, color=INK2)
fig.suptitle("ams 3x3-zone sensor, U-shaped hidden object: authors' reconstruction.py run by us "
             "(gamma 3 display, as in authors' config)", fontsize=10.5, color=INK2)
fig.tight_layout()
fig.savefig(os.path.join(OUT, "fig4_ams_U_backprojection.png"), dpi=160)
plt.close(fig)

with open(os.path.join(OUT, "fig4_ams_U_backprojection.json"), "w") as fh:
    json.dump({
        "provenance": "authors' code run by us on authors' data",
        "source": {"repo": "https://github.com/sidsoma/consumer-nlos", "commit": "15314de422a765a2d1b72ea7037dfafb2f908d7c",
                   "script": "paper/reconstruction.py + paper/configs/reconstruction.yaml (unmodified)",
                   "data": "paper/captured_data/ams_U_reconstruction/iter_1..iter_36.npy (iter_0 not used by the script)"},
        "algorithm": "confocal (sphere, not ellipsoid) backprojection: for each sensor position, zone and gated bin j "
                     "(30<=j<90 bins after that zone's wall peak), add hist value to voxels with "
                     "| |voxel - wall_point| - j*88ps*c/2 | < 88ps*c; then 2nd-difference (Laplacian) filter along z",
        "voxel_grid": {"x_m": [xlim[0], xlim[1], nx], "y_m": [ylim[0], ylim[1], ny], "z_m": [zlim[0], zlim[1], nz]},
        "units": "volume values are unitless backprojection scores; *_norm arrays scaled to max = 1 (gamma NOT applied)",
        "front_view_xy_max_projection_norm": np.round(front_n, 4).tolist(),
        "top_view_xz_max_projection_norm": np.round(top_n, 4).tolist(),
        "display_gamma_used_by_authors": gamma,
        "sensor_positions_xy_m_in_capture_order": np.round(cam[:, :2], 4).tolist(),
        "sensor_position_note": "Positions are NOT measured in the data; reconstruction.py assumes a 6x6 serpentine raster "
                                "x 0-1.28 m (25.6 cm pitch), y 0.32-0.96 m (12.8 cm pitch). Controlled/known motion.",
        "centre_zone_wall_distance_mm_per_position": np.round(wall_mm, 1).tolist(),
    }, fh, indent=1)
print("ok", vol.shape, float(vol.max()))
