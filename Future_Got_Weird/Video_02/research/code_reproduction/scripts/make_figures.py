"""Make authentic film reference figures + JSON from the authors' released data.

Run:  python3 -I make_figures.py   (any cwd; paths are absolute)

Provenance labels used in every JSON 'provenance' field:
  A = "authors' released data plotted by us"
  B = "authors' code run by us on authors' data"
  C = "authors' stored results" (arrays saved inside the released files)
"""
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)  # our own scripts dir only

import matplotlib  # noqa: E402
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from safe_load import load_pickled_npy  # noqa: E402

ROOT = os.path.dirname(HERE)
WORK = os.path.join(ROOT, "work", "consumer-nlos")
DATA = os.path.join(WORK, "paper", "captured_data")
OUT = os.path.join(ROOT, "out")
os.makedirs(OUT, exist_ok=True)

C_LIGHT = 299_792_458.0  # m/s, used for OUR unit conversions (authors' code uses 3e8)
PROV_A = "authors' released data plotted by us"
PROV_B = "authors' code run by us on authors' data"
PROV_C = "authors' stored results"
REPO = {"repo": "https://github.com/sidsoma/consumer-nlos",
        "commit": "15314de422a765a2d1b72ea7037dfafb2f908d7c", "licence": "MIT"}

# ---- reference palette (dataviz skill, light mode) ----
SURF, INK, INK2, MUTED, GRID, AXIS = "#fcfcfb", "#0b0b0b", "#52514e", "#898781", "#e1e0d9", "#c3c2b7"
BLUE, ORANGE, AQUA, YELLOW, MAGENTA, GREEN, VIOLET = ("#2a78d6", "#eb6834", "#1baf7a", "#eda100",
                                                      "#e87ba4", "#008300", "#4a3aa7")
plt.rcParams.update({
    "figure.facecolor": SURF, "axes.facecolor": SURF, "savefig.facecolor": SURF,
    "axes.edgecolor": AXIS, "axes.labelcolor": INK2, "text.color": INK, "xtick.color": MUTED,
    "ytick.color": MUTED, "grid.color": GRID, "grid.linewidth": 0.6, "axes.grid": True,
    "axes.spines.top": False, "axes.spines.right": False, "font.family": "DejaVu Sans",
    "font.size": 10, "axes.titlesize": 11, "axes.titleweight": "bold", "lines.linewidth": 2,
    "legend.frameon": False,
})


def r(a, nd=4):
    return np.round(np.asarray(a, dtype=float), nd).tolist()


def dump(name, obj):
    with open(os.path.join(OUT, name), "w") as fh:
        json.dump(obj, fh, indent=1)


# =====================================================================
# FIG 1  AMS raw histograms: strong wall (1-bounce) peak vs weak later return
# =====================================================================
AMS_BIN_S = 88.0e-12      # paper/configs/reconstruction.yaml: bin_width
AMS_T0_BIN = 13           # reconstruction.yaml: t0 ("bin corresponding to t=0")
AMS_GATES = (30, 90)      # reconstruction.yaml: gates (bins after the 1B peak)
AMS_FRAME = 22            # iter_22.npy: strongest late return among scan positions (see NOTES)

ams = {}
for i in range(37):
    ams[i] = load_pickled_npy(os.path.join(DATA, "ams_U_reconstruction", f"iter_{i}.npy"))
H = ams[AMS_FRAME]["histogram"].reshape(9, 128)
bins = np.arange(128)
zones = []
fig, axes = plt.subplots(3, 3, figsize=(11, 8.5), sharex=True, sharey=True)
for z in range(9):
    h = H[z]
    pk = int(np.argmax(h))
    t_after = (bins - pk) * AMS_BIN_S * 1e9          # ns after this zone's wall peak
    extra_cm = (bins - pk) * AMS_BIN_S * C_LIGHT * 100  # extra round-trip path, cm
    # descriptive late-return measure (ours): max in 35..60 bins after wall peak,
    # local floor = min between wall peak+20 and the bump start.
    w0, w1 = pk + 35, min(127, pk + 60)
    lb = int(w0 + np.argmax(h[w0:w1 + 1]))
    floor = float(np.min(h[pk + 20:lb + 1]))
    late_excess = float(h[lb] - floor)
    zones.append({
        "zone_index_row_major": z, "row": z // 3, "col": z % 3,
        "counts": r(h, 2), "wall_peak_bin": pk, "wall_peak_counts": float(h[pk]),
        "time_after_wall_peak_ns": r(t_after, 4), "extra_round_trip_path_cm": r(extra_cm, 2),
        "late_return_peak_bin": lb, "late_return_peak_counts": float(h[lb]),
        "late_return_time_after_wall_ns": float((lb - pk) * AMS_BIN_S * 1e9),
        "late_return_extra_path_cm": float((lb - pk) * AMS_BIN_S * C_LIGHT * 100),
        "late_return_local_floor_counts": floor, "late_return_excess_counts": late_excess,
        "wall_peak_to_late_excess_ratio": float(h[pk] / late_excess) if late_excess > 0 else None,
        "wall_distance_mm_reported_by_sensor": float(ams[AMS_FRAME]["distance"].reshape(9)[z]),
    })
    ax = axes[z // 3, z % 3]
    ax.semilogy(t_after, np.maximum(h, 1), color=BLUE, lw=1.6)
    ax.axvspan(AMS_GATES[0] * AMS_BIN_S * 1e9, AMS_GATES[1] * AMS_BIN_S * 1e9, color=GRID, alpha=0.6, lw=0)
    ax.plot([0], [h[pk]], "o", ms=6, color=BLUE, mec=SURF, mew=2)
    ax.plot([t_after[lb]], [h[lb]], "o", ms=8, color=ORANGE, mec=SURF, mew=2)
    ax.set_title(f"zone r{z // 3} c{z % 3}", fontsize=9, color=INK2, fontweight="normal")
    if z == 0:
        ax.annotate("wall (1st bounce)", (0, h[pk]), (0.8, h[pk] * 1.6), fontsize=8, color=INK2)
    if z == 4:
        ax.annotate(f"later return\n~{h[pk] / late_excess:,.0f}x weaker", (t_after[lb], h[lb]),
                    (t_after[lb] + 0.4, h[lb] * 8), fontsize=8, color=INK2,
                    arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.8))
for ax in axes[-1, :]:
    ax.set_xlabel("time after the wall return (ns)")
    sec = ax.secondary_xaxis("top" if False else -0.32, functions=(lambda t: t * C_LIGHT * 1e-7,
                                                                  lambda cm: cm / (C_LIGHT * 1e-7)))
    sec.set_xlabel("extra round-trip path (cm)", color=INK2)
for ax in axes[:, 0]:
    ax.set_ylabel("counts (log)")
axes[0, 0].set_xlim(-3, 8.5)
fig.suptitle(f"ams sensor, 3x3 zones, 128 bins x 88 ps, scan position iter_{AMS_FRAME} (raw histograms)\n"
             "grey band = gate used by authors' reconstruction.py (bins 30-90 after wall peak)",
             fontsize=10, color=INK2)
fig.tight_layout()
fig.savefig(os.path.join(OUT, "fig1_ams_wall_peak_vs_late_return.png"), dpi=160)
plt.close(fig)
dump("fig1_ams_wall_peak_vs_late_return.json", {
    "provenance": PROV_A, "source": REPO | {"file": f"paper/captured_data/ams_U_reconstruction/iter_{AMS_FRAME}.npy"},
    "sensor": "ams (model not named in released code; config comment says 'Calibrated parameters for AMS sensor')",
    "zones": "3x3 (histogram array shape (3,3,128))", "num_bins": 128, "bin_width_s": AMS_BIN_S,
    "t0_bin_from_config": AMS_T0_BIN, "reconstruction_gates_bins_after_wall_peak": list(AMS_GATES),
    "units": {"counts": "raw histogram counts as stored (no background subtraction applied)",
              "time_after_wall_peak_ns": "ns, relative to each zone's argmax bin",
              "extra_round_trip_path_cm": "cm, c * time (c = 299792458 m/s)"},
    "experiment_context": "U-shaped hidden object reconstruction; sensor moved over a 6x6 serpentine raster of "
                          "positions hard-coded in reconstruction.py (x 0-128 cm, y 32-96 cm). Controlled motion, "
                          "known positions. NOT the ST VL53L8 tracking data and NOT the smartphone-grade device.",
    "late_return_measure_note": "OUR descriptive measure: max within 35-60 bins after wall peak minus local "
                                "minimum between wall peak+20 bins and that max. Not an authors' metric.",
    "zones_data": zones})

# =====================================================================
# ST person-tracking data (pre-processed by authors: bg-subtracted, 1B masked, shifted)
# =====================================================================
ST_BIN_S = 250e-12  # paper/configs/tracking.yaml t_res; firmware CNH bin 37.5348 mm
fs = sorted(glob.glob(os.path.join(DATA, "st_spad_person_tracking", "volume_*.npz")))
STH = np.stack([np.load(f)["hists"] for f in fs])        # (475,16,128)
STP = np.stack([np.load(f)["particles"] for f in fs])    # (475,1000,3) stored
PTC = np.load(fs[0])["pt_cloud"]                         # (16,3) constant across frames
nF = STH.shape[0]
t_ns = bins * ST_BIN_S * 1e9
path_cm = bins * ST_BIN_S * C_LIGHT * 100

# ---- FIG 1b: one processed frame, 16 zones ----
FR = 100
fig, axes = plt.subplots(4, 4, figsize=(11, 8.5), sharex=True, sharey=True)
zl = []
for z in range(16):
    ax = axes[z // 4, z % 4]
    h = STH[FR, z]
    ax.bar(t_ns, h, width=0.25 * 0.85, color=BLUE, lw=0)
    ax.axvspan(0, 15 * 0.25, color=GRID, alpha=0.7, lw=0)
    ax.set_title(f"zone r{z // 4} c{z % 4}  wall pt x={PTC[z, 0]:+.2f} y={PTC[z, 1]:+.2f} m", fontsize=7.5,
                 color=INK2, fontweight="normal")
    zl.append({"zone_index_row_major": z, "wall_point_m": r(PTC[z], 4), "values": r(h, 2)})
for ax in axes[-1, :]:
    ax.set_xlabel("time after wall return (ns)")
for ax in axes[:, 0]:
    ax.set_ylabel("bg-subtracted value")
axes[0, 0].set_xlim(0, 15)
fig.suptitle(f"ST VL53L8 (4x4 zones, 250 ps bins) person-tracking file volume_{FR:06d}.npz, as released "
             "(already background-subtracted, wall peak masked & shifted to t=0)\ngrey = first 15 bins zeroed "
             "by preprocessing (wall return region)", fontsize=9.5, color=INK2)
fig.tight_layout()
fig.savefig(os.path.join(OUT, "fig1b_st_processed_frame_histograms.png"), dpi=160)
plt.close(fig)
dump("fig1b_st_processed_frame_histograms.json", {
    "provenance": PROV_A, "source": REPO | {"file": f"paper/captured_data/st_spad_person_tracking/volume_{FR:06d}.npz"},
    "sensor": "ST VL53L8 family (README: 'ST VL853L8 device' [sic]; driver class VL53L8CHSensor, 4x4 zones)",
    "bin_width_s": ST_BIN_S, "num_bins_stored": 128, "zeroed_first_bins": 15,
    "time_after_wall_return_ns": r(t_ns, 3), "extra_round_trip_path_cm": r(path_cm, 2),
    "units": {"values": "background-subtracted histogram value (firmware prints bin_value*1000; arbitrary units)"},
    "note": "The raw wall (1-bounce) peak is NOT present in the released ST files; it was removed before release. "
            "Zones r1 c0 and r2 c0 (row-major 4 and 8) carry ~100x less later-return energy than the others in every frame (max per-frame sum 276 and 368 a.u. vs median 2145 a.u. for the other 14 zones).",
    "zones": zl})

# ---- FIG 2: later-return energy over frames ----
E_tot = STH.sum(axis=(1, 2))
E_zone = STH.sum(axis=2)  # (475,16)
w = STH.sum(axis=1)  # (475,128) summed over zones
with np.errstate(invalid="ignore", divide="ignore"):
    t_mean_ns = (w * t_ns).sum(1) / w.sum(1)
path_mean_cm = t_mean_ns * 1e-9 * C_LIGHT * 100
fig, axes = plt.subplots(3, 1, figsize=(11, 8.5), sharex=True, gridspec_kw={"height_ratios": [1, 1, 1.3]})
axes[0].plot(np.arange(nF), E_tot, color=BLUE, lw=1.4)
axes[0].set_ylabel("total later-return\nenergy (a.u.)")
axes[0].set_title("Background-subtracted later-return energy per frame (all 16 zones, bins 15-127)")
axes[1].plot(np.arange(nF), path_mean_cm, color=BLUE, lw=1.4)
axes[1].set_ylabel("energy-weighted mean\nextra path (cm)")
axes[1].set_title("Energy-weighted mean delay of the later return, as extra round-trip path")
im = axes[2].imshow(E_zone.T, aspect="auto", cmap="Blues", interpolation="nearest",
                    extent=[-0.5, nF - 0.5, 15.5, -0.5])
axes[2].set_ylabel("zone (row-major)")
axes[2].set_xlabel("frame index (no timestamps in released files)")
axes[2].set_title("Per-zone later-return energy")
axes[2].grid(False)
cax = axes[2].inset_axes([1.005, 0.0, 0.012, 1.0])
fig.colorbar(im, cax=cax, label="a.u.")
fig.tight_layout()
fig.savefig(os.path.join(OUT, "fig2_st_later_return_energy_over_frames.png"), dpi=160)
plt.close(fig)
dump("fig2_st_later_return_energy_over_frames.json", {
    "provenance": PROV_A, "source": REPO | {"files": "paper/captured_data/st_spad_person_tracking/volume_000000..000474.npz"},
    "num_frames": int(nF), "frame_rate": "unresolved: no timestamps in files (see NOTES.md)",
    "units": {"total_energy": "sum of background-subtracted histogram values over 16 zones x 128 bins (a.u.)",
              "mean_extra_path_cm": "cm; energy-weighted mean bin * 250 ps * c",
              "zone_energy": "a.u. per zone"},
    "frame_index": list(range(nF)), "total_energy": r(E_tot, 2),
    "energy_weighted_mean_time_after_wall_ns": r(t_mean_ns, 4), "energy_weighted_mean_extra_path_cm": r(path_mean_cm, 2),
    "zone_energy_frames_by_16": r(E_zone, 2)})

# =====================================================================
# FIG 3  tracking trajectories (ours, B) vs stored particles (C)
# =====================================================================
runs = {}
for s in range(10):
    p = os.path.join(OUT, f"tracking_run_seed{s}", "authors_code_states.npz")
    if os.path.exists(p):
        runs[s] = np.load(p)["states"]
stored_mean = STP.mean(1)
scene = {
    "coordinate_frame": "wall plane z=0; x along wall (m); z = distance from wall into room (m); y vertical",
    "wall_points_xyz_m": r(PTC, 4),
    "camera_xz_m": [0.0, 0.82],
    "camera_note": "tracking.py: cam_pos=[0,0,0.82] 'depth of camera from wall pre-calibrated (used only for visualization)'",
    "occluder_segment_xz_m": [[-0.30, 0.65], [-0.30, 1.6]],
    "occluder_note": "utils.convert_particles_to_image hard-codes occluder_x=-0.30, z 0.65-1.6 (plot element)",
    "authors_plot_markers_labelled_GT_patches_xz_m": [[-0.80, 0.66], [-1.4, 0.66], [-0.80, 1.25], [-1.4, 1.25]],
    "GT_patch_note": "Hard-coded in utils.convert_particles_to_image as 'GT patches' (0.1 m squares, y=0.3). "
                     "What they physically are (floor marks? waypoints?) is NOT documented in the code.",
}
fig, ax = plt.subplots(figsize=(8.5, 8.5))
ax.add_patch(plt.Rectangle((-2, -0.1), 2.5, 0.1, color=INK2, lw=0))
ax.plot([-0.30, -0.30], [0.65, 1.6], color=INK, lw=5, solid_capstyle="butt")
for gx, gz in scene["authors_plot_markers_labelled_GT_patches_xz_m"]:
    ax.add_patch(plt.Rectangle((gx - 0.05, gz - 0.05), 0.1, 0.1, color=GREEN, alpha=0.35, lw=0))
ax.plot([0], [0.82], "s", color=INK2, ms=9)
ax.plot([0, PTC[:, 0].min()], [0.82, 0], "--", color=MUTED, lw=1)
ax.plot([0, PTC[:, 0].max()], [0.82, 0], "--", color=MUTED, lw=1)
ax.plot(PTC[:, 0], np.zeros(16), "o", color=INK2, ms=4)
for s, S in runs.items():
    m = S.mean(1)
    ax.plot(m[:, 0], m[:, 2], color=BLUE if s == 0 else "#86b6ef", lw=1.6 if s == 0 else 1.0,
            label="mean of particles, authors' code run by us (seed 0)" if s == 0 else
            ("same, other seeds (1, 2)" if s == 1 else None), zorder=3 if s == 0 else 2)
ax.plot(stored_mean[:, 0], stored_mean[:, 2], color=ORANGE, lw=1.2, ls=(0, (4, 2)),
        label="mean of particles stored in released files", zorder=4)
if 0 in runs:
    m0 = runs[0].mean(1)
    ax.plot(m0[0, 0], m0[0, 2], "o", color=BLUE, ms=9, mec=SURF, mew=2)
    ax.annotate("frame 1", (m0[0, 0], m0[0, 2]), (m0[0, 0] + 0.05, m0[0, 2] - 0.08), color=INK2, fontsize=9)
    ax.plot(m0[-1, 0], m0[-1, 2], "o", color=BLUE, ms=9, mec=SURF, mew=2)
    ax.annotate(f"frame {nF}", (m0[-1, 0], m0[-1, 2]), (m0[-1, 0] - 0.25, m0[-1, 2] - 0.12), color=INK2, fontsize=9)
ax.text(-0.27, 1.62, "occluder", color=INK2, fontsize=9)
ax.text(0.02, 0.86, "sensor", color=INK2, fontsize=9)
ax.text(-1.95, -0.16, "relay wall (z = 0)", color=INK2, fontsize=9)
ax.set_xlim(-1.8, 0.15)
ax.set_ylim(1.9, -0.25)
ax.set_aspect("equal")
ax.set_xlabel("x along wall (m)")
ax.set_ylabel("z, distance from wall (m)")
ax.set_title("Top-down: estimated hidden-person position per frame (ST VL53L8 person-tracking data)")
ax.legend(loc="lower right", fontsize=8.5)
fig.tight_layout()
fig.savefig(os.path.join(OUT, "fig3_tracking_trajectory_topdown.png"), dpi=160)
plt.close(fig)

traj = {"provenance": {"ours": PROV_B, "stored": PROV_C},
        "source": REPO | {"script": "paper/tracking.py with paper/configs/tracking.yaml (unmodified)"},
        "units": "metres; x along wall, y vertical, z distance from wall", "num_frames": int(nF),
        "estimator": "per-frame arithmetic mean of the 1000 particles after resampling "
                     "(tracking.py saves the particle states; the mean is our summary, matching the root "
                     "dashboard's 'mean dot')",
        "scene_layout_from_authors_code": scene,
        "stored_particles_mean_xyz": r(stored_mean, 4)}
for s, S in runs.items():
    traj[f"ours_seed{s}_mean_xyz"] = r(S.mean(1), 4)
    traj[f"ours_seed{s}_std_xyz"] = r(S.std(1), 4)
if 0 in runs:
    d = np.linalg.norm((runs[0].mean(1) - stored_mean)[:, [0, 2]], axis=1)
    traj["comparison_ours_seed0_vs_stored"] = {
        "xz_distance_m_median": float(np.median(d)), "xz_distance_m_mean": float(d.mean()),
        "xz_distance_m_p90": float(np.percentile(d, 90)),
        "corr_x": float(np.corrcoef(runs[0].mean(1)[20:, 0], stored_mean[20:, 0])[0, 1]),
        "corr_z": float(np.corrcoef(runs[0].mean(1)[20:, 2], stored_mean[20:, 2])[0, 1]),
        "mean_offset_ours_minus_stored_xyz": r((runs[0].mean(1) - stored_mean)[20:].mean(0), 4),
        "note": "corr computed on frames 21-475 (index >= 20) to skip filter convergence"}
    if len(runs) > 1:
        ms = np.stack([runs[s].mean(1) for s in runs])
        spread = np.linalg.norm((ms - ms.mean(0))[:, :, [0, 2]], axis=2)
        traj["seed_to_seed_xz_spread_m_median"] = float(np.median(spread))
dump("fig3_tracking_trajectory_topdown.json", traj)

# ---- FIG 3b particle clouds for a few frames ----
pick = [0, 4, 19, 99, 249, nF - 1]
fig, axes = plt.subplots(2, 3, figsize=(12, 8.2), sharex=True, sharey=True)
clouds = {"provenance": {"ours_seed0": PROV_B, "stored": PROV_C}, "units": "metres (x, y, z)", "frames": []}
for k, f in enumerate(pick):
    ax = axes[k // 3, k % 3]
    ax.add_patch(plt.Rectangle((-2, -0.1), 2.5, 0.1, color=INK2, lw=0))
    ax.plot([-0.30, -0.30], [0.65, 1.6], color=INK, lw=4, solid_capstyle="butt")
    ent = {"frame_index": f, "frame_number_1based": f + 1, "stored_particles_xyz": r(STP[f], 3)}
    if 0 in runs:
        P0 = runs[0][f]
        ax.scatter(P0[:, 0], P0[:, 2], s=4, color=BLUE, alpha=0.35, lw=0, label="particles (ours, seed 0)")
        ax.plot(P0[:, 0].mean(), P0[:, 2].mean(), "o", color=BLUE, ms=8, mec=SURF, mew=2)
        ent["ours_seed0_particles_xyz"] = r(P0, 3)
    ax.plot(STP[f, :, 0].mean(), STP[f, :, 2].mean(), "D", color=ORANGE, ms=7, mec=SURF, mew=1.5,
            label="mean of stored particles")
    ax.set_title(f"frame {f + 1}", fontsize=10)
    ax.set_xlim(-1.9, 0.3)
    ax.set_ylim(2.05, -0.2)
    ax.set_aspect("equal")
    clouds["frames"].append(ent)
    if k == 0:
        ax.legend(loc="lower left", fontsize=8, markerscale=2)
for ax in axes[-1, :]:
    ax.set_xlabel("x along wall (m)")
for ax in axes[:, 0]:
    ax.set_ylabel("z from wall (m)")
fig.suptitle("Particle clouds (1000 particles each) after resampling: authors' tracking.py run by us", color=INK2)
fig.tight_layout()
fig.savefig(os.path.join(OUT, "fig3b_particle_clouds.png"), dpi=150)
plt.close(fig)
dump("fig3b_particle_clouds.json", clouds)
print("figures done", sorted(os.listdir(OUT)))
