"""Camera-localization export: authors' cam_localization.py run by us vs particles stored in files."""
import glob, json, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); OUT = os.path.join(ROOT, "out")
fs = sorted(glob.glob(os.path.join(ROOT, "work/consumer-nlos/paper/captured_data/st_spad_cam_localization/volume_*.npz")))
P = np.stack([np.load(f)["particles"] for f in fs]); cz = np.array([float(np.load(f)["cam_z"]) for f in fs])
C = np.stack([np.load(f)["pt_cloud"] for f in fs])
S = np.load(os.path.join(OUT, "cam_localization_run", "authors_code_states.npz"))["states"]
ms, mp = S.mean(1), P.mean(1)
SURF, INK2, MUTED, BLUE, ORANGE = "#fcfcfb", "#52514e", "#898781", "#2a78d6", "#eb6834"
plt.rcParams.update({"figure.facecolor": SURF, "axes.facecolor": SURF, "savefig.facecolor": SURF, "axes.grid": True,
                     "grid.color": "#e1e0d9", "axes.spines.top": False, "axes.spines.right": False,
                     "axes.edgecolor": "#c3c2b7", "xtick.color": MUTED, "ytick.color": MUTED, "axes.labelcolor": INK2})
fig, axes = plt.subplots(1, 2, figsize=(12, 5.5))
ax = axes[0]
ax.add_patch(plt.Rectangle((-0.125, -0.125), 0.25, 0.25, color=MUTED, alpha=0.5, lw=0))
ax.plot(ms[:, 0], ms[:, 1], color=BLUE, lw=1.4, label="mean of particles, authors' code run by us (seed 0)")
ax.plot(mp[:, 0], mp[:, 1], color=ORANGE, lw=1.1, ls=(0, (4, 2)), label="mean of particles stored in released files")
ax.set_xlabel("X (m)"); ax.set_ylabel("Y (m)"); ax.set_title("Front view: estimated sensor position\n(grey square = hidden object at origin, as plotted by authors)", fontsize=10, color=INK2)
ax.set_aspect("equal"); ax.legend(fontsize=8, frameon=False, loc="lower right")
ax = axes[1]
ax.plot(np.arange(len(fs)), cz, color=INK2, lw=1.2)
ax.set_xlabel("frame index"); ax.set_ylabel("cam_z stored per frame (m)"); ax.set_title("Sensor-to-wall distance stored in each file", fontsize=10, color=INK2)
fig.tight_layout(); fig.savefig(os.path.join(OUT, "fig5_st_camera_localization.png"), dpi=150); plt.close(fig)
json.dump({
  "provenance": {"ours": "authors' code run by us on authors' data", "stored": "authors' stored results",
                 "cam_z_and_pt_cloud": "authors' released data"},
  "source": {"repo": "https://github.com/sidsoma/consumer-nlos", "commit": "15314de422a765a2d1b72ea7037dfafb2f908d7c",
             "script": "paper/cam_localization.py + configs/cam_localization.yaml (unmodified)",
             "data": "paper/captured_data/st_spad_cam_localization/volume_000000..000357.npz"},
  "units": "metres", "num_frames": len(fs),
  "meaning": "particles are hypotheses of the SENSOR position relative to a hidden object assumed at obj_pos=[0,0,0.6] "
             "(cam_localization.py line 'obj_pos = [0, 0, 0.6]'); z is fixed in the filter and replaced by stored cam_z when saved",
  "ours_seed0_mean_xyz": np.round(ms, 4).tolist(), "stored_particles_mean_xyz": np.round(mp, 4).tolist(),
  "cam_z_m": np.round(cz, 4).tolist(),
  "pt_cloud_centroid_xy_m": np.round(C[:, :, :2].mean(1), 4).tolist(),
  "comparison": {"corr_x_frames20plus": float(np.corrcoef(ms[20:, 0], mp[20:, 0])[0, 1]),
                 "corr_y_frames20plus": float(np.corrcoef(ms[20:, 1], mp[20:, 1])[0, 1]),
                 "median_xy_distance_m": float(np.median(np.linalg.norm(ms[:, :2] - mp[:, :2], axis=1))),
                 "stored_z_note": "stored particles have z std 0.07-0.18 m and mean 0.5-0.7 m, i.e. NOT the fixed obj_z/cam_z that "
                                  "cam_localization.py produces, so the stored arrays were not written by this script as released"}},
  open(os.path.join(OUT, "fig5_st_camera_localization.json"), "w"), indent=1)
print("ok")
