#!/usr/bin/env python3
"""
geometry_check.py -- the declared 2D room layout for "How Cameras See Around Corners"
(Future Got Weird, Video 02), and every number the film's diagrams draw from it.

Run:   python3 geometry_check.py            (writes layout.json and geometry_preview.png next to this file)
Needs: numpy (matplotlib optional, only for the preview PNG)

Coordinates (plan view, metres), matching DIRECTION.md section 2:
  x = to the right along the relay wall
  z = distance from the relay wall toward the viewer (the wall is the line z = 0)
  h = height above the floor (only declared, the plan is a horizontal slice)

What the script does
  1. Declares the room: relay wall, free-standing partition (occluder), sensor S, hidden point H.
  2. Derives the sampled wall points W as the centres of one row of 4 zones of a 45-degree,
     flood-illuminated multizone sensor (VL53L8-like 4x4 zones; one row shown in 2D).
  3. Confocal timing: L = 2|SW| + 2|WH|, t = L/c, circle radius r = (c t - 2|SW|)/2 = |WH|.
  4. Non-confocal timing: L = |SW1| + |W1H| + |HW2| + |W2S|, ellipse with foci W1, W2.
  5. Checks that no drawn light segment touches the partition, that the partition blocks S->H,
     and that the hidden person's body (a disc) is invisible from S.
  6. Noisy bands: intersection region on a 1 cm grid for 1, 2, 3, 4 wall points and for
     motion-induced sampling (sensor moved; object moved: naive vs motion-compensated fusion).
  7. Flood illumination: what one zone's histogram integrates over (diffuse vs retroreflective
     hidden point), as path-length spreads.
  8. Radiometric estimate of third-bounce vs first-bounce strength (labelled estimate).

Everything here is ILLUSTRATIVE geometry built to be physically sensible. It is not a
reconstruction of any experiment in the paper. Sensor constants taken from the authors'
released code are cited inline (repo sidsoma/consumer-nlos @ 15314de).
"""
from __future__ import annotations

import json
import math
import os
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent

# ----------------------------------------------------------------------------------------------
# Physical constants and sensor constants
# ----------------------------------------------------------------------------------------------
C_M_PER_NS = 0.299792458          # speed of light, m/ns (29.98 cm/ns)
BIN_NS = 0.25                      # VL53L8 CNH bin used by the code: t_res 250e-12 (paper/configs/*.yaml),
                                   # firmware VL53LMZ_CNH_BIN_WIDTH_MM = 37.5348 mm one-way = 250.4 ps
DEMO_NUM_BINS = 48                 # config.py num_bins
FOV_DEG = 45.0                     # spad_driver.py fovx = fovy = 45.0 (ST: 45 x 45 deg square, 65 deg diagonal)
ZONES_PER_ROW = 4                  # sensor.py builds a 4x4 sensor
AMS_BIN_NS = 0.088                 # paper/configs/reconstruction.yaml bin_width 88e-12 (ams sensor, 3x3 zones)
PF_STEP_STD_M = 0.07               # paper/configs/tracking.yaml particle.radius (RandomWalk std per axis per frame)
DEMO_CAPTURE_HZ = 30               # config.py ranging_frequency_hz (requested capture rate, not algorithm latency)

# ----------------------------------------------------------------------------------------------
# 1. Declared layout (metres). Change here, re-run, and every check re-validates.
# ----------------------------------------------------------------------------------------------
ROOM = {"x_min": 0.0, "x_max": 4.0, "z_min": 0.0, "z_max": 3.0, "wall_height": 2.5}
RELAY_WALL = ((0.0, 0.0), (4.0, 0.0))                 # the back wall, matte and light-coloured
OCCLUDER = ((2.0, 0.65), (2.0, 2.15))                 # free-standing partition, 1.5 m long, perpendicular
OCCLUDER_THICKNESS = 0.04                             # to the wall, leaving a 0.65 m gap at the wall
OCCLUDER_HEIGHT = 1.7
S_A = (1.65, 0.90)          # sensor, frame A (held at chest height)
AIM_A = 1.85                # x of the wall point the sensor's optical axis hits, frame A
S_B = (1.25, 0.90)          # sensor moved 0.40 m left, re-aimed (frame B1, "motion-induced sampling")
AIM_B = 1.45
H_A = (2.60, 0.85)          # hidden person's torso centre (plan), frame A
H_B = (2.70, 0.90)          # the person a moment later (frame B2): moved (0.10, 0.05) m
DT_B2_S = 0.10              # assumed time between frame A and frame B2 (3 frames at 30 Hz)
BODY_RADIUS = 0.22          # torso half-width for the "is the person visible from S?" check
SENSOR_HEIGHT = 1.20        # declared heights (the plan is a horizontal slice at ~1.2 m)
TORSO_HEIGHT = 1.20
HIDER_HEAD_TOP = 1.75       # top of the hider's head, for the 3D "can S see over the partition?" check

# Noise / timing band: half-width in one-way distance. One 250 ps bin = 3.75 cm one-way.
BAND_HALF_M = C_M_PER_NS * BIN_NS / 2.0               # 0.0375 m
BAND_HALF_ALT_M = 2 * BAND_HALF_M                      # 2 bins, sensitivity check

MIN_CLEARANCE_M = 0.10      # every drawn light segment must miss the partition by at least this


# ----------------------------------------------------------------------------------------------
# Geometry helpers
# ----------------------------------------------------------------------------------------------
def v(p):
    return np.asarray(p, dtype=float)


def dist(p, q):
    return float(np.linalg.norm(v(p) - v(q)))


def _orient(a, b, c):
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def segments_intersect(p1, p2, q1, q2):
    """True if closed segments p1p2 and q1q2 share a point."""
    p1, p2, q1, q2 = map(v, (p1, p2, q1, q2))
    d1 = _orient(q1, q2, p1)
    d2 = _orient(q1, q2, p2)
    d3 = _orient(p1, p2, q1)
    d4 = _orient(p1, p2, q2)
    if ((d1 > 0) != (d2 > 0)) and ((d3 > 0) != (d4 > 0)) and d1 != 0 and d2 != 0 and d3 != 0 and d4 != 0:
        return True

    def on_seg(a, b, c):
        return min(a[0], b[0]) - 1e-12 <= c[0] <= max(a[0], b[0]) + 1e-12 and \
            min(a[1], b[1]) - 1e-12 <= c[1] <= max(a[1], b[1]) + 1e-12

    if d1 == 0 and on_seg(q1, q2, p1):
        return True
    if d2 == 0 and on_seg(q1, q2, p2):
        return True
    if d3 == 0 and on_seg(p1, p2, q1):
        return True
    if d4 == 0 and on_seg(p1, p2, q2):
        return True
    return False


def point_segment_distance(p, a, b):
    p, a, b = map(v, (p, a, b))
    ab = b - a
    t = np.clip(np.dot(p - a, ab) / np.dot(ab, ab), 0.0, 1.0)
    return float(np.linalg.norm(p - (a + t * ab)))


def segment_segment_distance(p1, p2, q1, q2):
    if segments_intersect(p1, p2, q1, q2):
        return 0.0
    return min(point_segment_distance(p1, q1, q2), point_segment_distance(p2, q1, q2),
               point_segment_distance(q1, p1, p2), point_segment_distance(q2, p1, p2))


def wall_x_for_angle(S, theta_deg):
    """Wall (z=0) hit point of a ray from S at angle theta from the wall normal (+ toward +x)."""
    return S[0] + S[1] * math.tan(math.radians(theta_deg))


def zone_geometry(S, aim_x, fov_deg=FOV_DEG, n=ZONES_PER_ROW):
    """Zone edges and centres on the wall for one row of an n-zone, fov_deg flood sensor at S."""
    theta0 = math.degrees(math.atan2(aim_x - S[0], S[1]))
    edges_deg = [theta0 - fov_deg / 2 + k * fov_deg / n for k in range(n + 1)]
    centres_deg = [(edges_deg[k] + edges_deg[k + 1]) / 2 for k in range(n)]
    return {
        "axis_angle_deg": theta0,
        "edge_angles_deg": edges_deg,
        "centre_angles_deg": centres_deg,
        "edge_x": [wall_x_for_angle(S, a) for a in edges_deg],
        "centre_x": [wall_x_for_angle(S, a) for a in centres_deg],
    }


def circle_room_arc(W, r, room=ROOM, n=721):
    """Angular range (deg, from +x toward +z) of the circle part with z>0 that lies inside the room."""
    angs = np.linspace(0, 180, n)
    xs = W[0] + r * np.cos(np.radians(angs))
    zs = W[1] + r * np.sin(np.radians(angs))
    inside = (xs >= room["x_min"]) & (xs <= room["x_max"]) & (zs > 0) & (zs <= room["z_max"])
    if not inside.any():
        return None
    idx = np.where(inside)[0]
    return [float(angs[idx[0]]), float(angs[idx[-1]])]


# ----------------------------------------------------------------------------------------------
# Grid for candidate regions
# ----------------------------------------------------------------------------------------------
GRID_STEP = 0.01
gx = np.arange(ROOM["x_min"] + GRID_STEP / 2, ROOM["x_max"], GRID_STEP)
gz = np.arange(ROOM["z_min"] + GRID_STEP / 2, ROOM["z_max"], GRID_STEP)
GX, GZ = np.meshgrid(gx, gz)          # shape (nz, nx)
CELL_AREA = GRID_STEP ** 2


def band_mask(W, r, half):
    d = np.hypot(GX - W[0], GZ - W[1])
    return np.abs(d - r) <= half


def region_stats(mask, truth=None):
    n = int(mask.sum())
    out = {"area_m2": round(n * CELL_AREA, 5), "cells": n}
    if n == 0:
        out.update({"empty": True})
        return out
    xs, zs = GX[mask], GZ[mask]
    cx, cz = float(xs.mean()), float(zs.mean())
    pts = np.stack([xs - cx, zs - cz], 1)
    cov = pts.T @ pts / max(n - 1, 1)
    evals, evecs = np.linalg.eigh(cov)
    major = evecs[:, 1]
    proj_major = pts @ major
    proj_minor = pts @ evecs[:, 0]
    out.update({
        "empty": False,
        "centroid": [round(cx, 4), round(cz, 4)],
        "bbox_x": [round(float(xs.min()), 3), round(float(xs.max()), 3)],
        "bbox_z": [round(float(zs.min()), 3), round(float(zs.max()), 3)],
        "length_along_major_m": round(float(proj_major.max() - proj_major.min()), 3),
        "width_along_minor_m": round(float(proj_minor.max() - proj_minor.min()), 3),
        "major_axis_angle_deg_from_x": round(math.degrees(math.atan2(major[1], major[0])) % 180, 1),
    })
    if truth is not None:
        out["truth_inside"] = bool(np.hypot(xs - truth[0], zs - truth[1]).min() <= GRID_STEP)
        out["centroid_to_truth_m"] = round(math.hypot(cx - truth[0], cz - truth[1]), 4)
    # how many separate blobs, so the film knows whether to draw 1 or 2 regions. Thin band crossings
    # alias into specks on a 1 cm grid, so specks closer than 2 cm are merged before counting.
    out["blobs_after_2cm_merge"] = count_components(dilate(mask, 0.02))
    return out


def count_components(mask):
    m = mask.copy()
    nz, nx = m.shape
    seen = np.zeros_like(m, dtype=bool)
    comps = 0
    for (i, j) in zip(*np.where(m)):
        if seen[i, j]:
            continue
        comps += 1
        stack = [(i, j)]
        seen[i, j] = True
        while stack:
            a, b = stack.pop()
            for da, db in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                aa, bb = a + da, b + db
                if 0 <= aa < nz and 0 <= bb < nx and m[aa, bb] and not seen[aa, bb]:
                    seen[aa, bb] = True
                    stack.append((aa, bb))
    return comps


def dilate(mask, radius):
    """Binary dilation by a disc of given radius (m) on the grid (motion prior: 'could have moved this far')."""
    k = int(math.ceil(radius / GRID_STEP))
    out = np.zeros_like(mask)
    ii, jj = np.where(mask)
    nz, nx = mask.shape
    offs = [(a, b) for a in range(-k, k + 1) for b in range(-k, k + 1) if (a * a + b * b) * GRID_STEP ** 2 <= radius ** 2]
    for a, b in offs:
        i2 = np.clip(ii + a, 0, nz - 1)
        j2 = np.clip(jj + b, 0, nx - 1)
        out[i2, j2] = True
    return out


def hidden_from(S, mask_points_x, mask_points_z):
    """For grid cells, True if the straight segment S->cell crosses the occluder (cell hidden from S)."""
    (ox, oz0), (_, oz1) = OCCLUDER
    # vertical occluder at x = ox: param t where segment reaches x = ox
    with np.errstate(divide="ignore", invalid="ignore"):
        t = (ox - S[0]) / (mask_points_x - S[0])
    zc = S[1] + t * (mask_points_z - S[1])
    return (t >= 0) & (t <= 1) & (zc >= oz0) & (zc <= oz1)


# ----------------------------------------------------------------------------------------------
# Main computation
# ----------------------------------------------------------------------------------------------
def crossing_estimate(Wa, Wb, H, half):
    """Two straight strips of half-width `half` crossing at the angle between H->Wa and H->Wb.
    The overlap is a rhombus; its long diagonal (the stretch of the candidate region) is
    2*half / sin(alpha), short diagonal 2*half / cos(alpha), with 2*alpha = crossing angle."""
    a1 = math.atan2(Wa[1] - H[1], Wa[0] - H[0])
    a2 = math.atan2(Wb[1] - H[1], Wb[0] - H[0])
    two_alpha = abs((a1 - a2 + math.pi) % (2 * math.pi) - math.pi)
    alpha = two_alpha / 2
    return {"crossing_angle_deg": round(math.degrees(two_alpha), 2),
            "rhombus_long_diagonal_m": round(2 * half / math.sin(alpha), 3),
            "rhombus_short_diagonal_m": round(2 * half / math.cos(alpha), 3),
            "formula": "long = 2*delta/sin(alpha); on the bisector sin(alpha) = w/sqrt(w^2+z^2), "
                       "w = half the wall-point spread, z = distance from the wall"}


def confocal_entry(S, W, H):
    sw, wh = dist(S, W), dist(W, H)
    L = 2 * sw + 2 * wh
    t = L / C_M_PER_NS
    t1 = 2 * sw / C_M_PER_NS
    r = (C_M_PER_NS * t - 2 * sw) / 2.0
    return {
        "W": [round(W[0], 4), round(W[1], 4)],
        "SW_m": round(sw, 4),
        "WH_m": round(wh, 4),
        "path_L_m": round(L, 4),
        "arrival_t_ns": round(t, 3),
        "first_bounce_t_ns": round(t1, 3),
        "delay_after_first_bounce_ns": round(t - t1, 3),
        "delay_after_first_bounce_bins_250ps": round((t - t1) / BIN_NS, 2),
        "arrival_abs_bin_250ps": round(t / BIN_NS, 2),
        "circle_radius_m": round(r, 4),
        "circle_radius_check_equals_WH": abs(r - wh) < 1e-9,
        "arc_angles_deg_in_room": circle_room_arc(W, r),
    }


def flood_zone_spread(S, aim_x, H, zone_index, n_samp=400, retro_divergence_deg=None):
    """What zone `zone_index` integrates over for a POINT hidden target at H (2D slice).

    Diffuse target: light leaves every lit wall point W1 (whole FOV), hits H, scatters everywhere,
    and returns via every wall point W2 inside this zone's patch. Weight ~ product of cos/r^2 terms.
    Retroreflective target (ideal): light returns along its incoming direction, so only W2 = W1
    paths exist, and this zone sees only W1 inside its own patch.
    Delays are measured from this zone's own first-bounce (wall) arrival, as the code does
    (track.py shifts each zone so its wall peak is bin 0).
    """
    zg = zone_geometry(S, aim_x)
    e = zg["edge_angles_deg"]
    th_lit = np.linspace(e[0], e[-1], n_samp)
    th_zone = np.linspace(e[zone_index], e[zone_index + 1], max(n_samp // ZONES_PER_ROW, 50))
    S_ = v(S)
    H_ = v(H)
    W1 = np.stack([S_[0] + S_[1] * np.tan(np.radians(th_lit)), np.zeros_like(th_lit)], 1)
    W2 = np.stack([S_[0] + S_[1] * np.tan(np.radians(th_zone)), np.zeros_like(th_zone)], 1)
    SW1 = np.linalg.norm(W1 - S_, axis=1)
    SW2 = np.linalg.norm(W2 - S_, axis=1)
    W1H = np.linalg.norm(W1 - H_, axis=1)
    HW2 = np.linalg.norm(W2 - H_, axis=1)
    # cosines at the wall (normal +z): incidence from S, exit toward H
    cos_in1 = S_[1] / SW1
    cos_out1 = H_[1] / W1H
    cos_in2 = H_[1] / HW2
    cos_out2 = S_[1] / SW2
    # first-bounce reference for this zone: intensity-weighted mean of 2|SW2| over the zone patch
    w1b = cos_out2 * cos_out2 / SW2 ** 2   # (irradiance ~ cos/r^2 per unit angle, collection ~ cos)
    L1 = float(np.sum(w1b * 2 * SW2) / np.sum(w1b))
    # emitter samples are uniform in angle; per unit angle the irradiance on the wall goes as cos/r (2D) --
    # we use a 3D-like cos/r^2 product along the slice so the weighting mimics 3D falloff.
    a = (cos_in1 / SW1 ** 2) * (cos_out1 / W1H ** 2)        # (n1,)
    b = (cos_in2 / HW2 ** 2) * (cos_out2 / SW2 ** 2)        # (n2,)
    Lmat = (SW1 + W1H)[:, None] + (HW2 + SW2)[None, :]
    Wmat = a[:, None] * b[None, :]
    delays_path = (Lmat - L1).ravel()
    weights = Wmat.ravel()
    order = np.argsort(delays_path)
    cw = np.cumsum(weights[order]) / weights.sum()

    def q(p):
        return float(delays_path[order][np.searchsorted(cw, p)])

    centre_x = zg["centre_x"][zone_index]
    Wc = (centre_x, 0.0)
    conf_delay_path = 2 * dist(Wc, H) + 2 * dist(S, Wc) - L1
    diffuse = {
        "median_minus_confocal_model_m": round(q(0.50) - conf_delay_path, 4),
        "earliest_minus_confocal_model_m": round(float(delays_path.min()) - conf_delay_path, 4),
        "extra_path_min_m": round(float(delays_path.min()), 4),
        "extra_path_max_m": round(float(delays_path.max()), 4),
        "extra_path_p10_m": round(q(0.10), 4),
        "extra_path_p50_m": round(q(0.50), 4),
        "extra_path_p90_m": round(q(0.90), 4),
        "p10_p90_spread_m": round(q(0.90) - q(0.10), 4),
        "p10_p90_spread_ns": round((q(0.90) - q(0.10)) / C_M_PER_NS, 3),
        "p10_p90_spread_bins_250ps": round((q(0.90) - q(0.10)) / C_M_PER_NS / BIN_NS, 2),
    }
    # ideal retroreflector: W2 = W1, both inside this zone's patch
    Wr = W2
    Lr = 2 * np.linalg.norm(Wr - S_, axis=1) + 2 * np.linalg.norm(Wr - H_, axis=1) - L1
    # weight: irradiance at W (cos/r^2 from S), cos toward H, 1/|WH|^2 on the way out only (the ideal
    # retroreflector sends the light straight back, no second spreading), cos/r^2 collection back at S
    # (for wall points W in this zone: cos_out2 = cosine between the wall normal and W->S, cos_in2 = W->H)
    wr = (cos_out2 / SW2 ** 2) * (cos_in2 / HW2 ** 2) * (cos_out2 / SW2 ** 2)
    o2 = np.argsort(Lr)
    cw2 = np.cumsum(wr[o2]) / wr.sum()

    def q2(p):
        return float(Lr[o2][np.searchsorted(cw2, p)])

    retro = {
        "extra_path_p10_m": round(q2(0.10), 4),
        "extra_path_p50_m": round(q2(0.50), 4),
        "extra_path_p90_m": round(q2(0.90), 4),
        "p10_p90_spread_m": round(q2(0.90) - q2(0.10), 4),
        "median_minus_confocal_model_m": round(q2(0.50) - conf_delay_path, 4),
        "extra_path_min_m": round(float(Lr.min()), 4),
        "extra_path_max_m": round(float(Lr.max()), 4),
        "spread_m": round(float(Lr.max() - Lr.min()), 4),
        "spread_bins_250ps": round(float(Lr.max() - Lr.min()) / C_M_PER_NS / BIN_NS, 2),
    }
    return {
        "zone_index": zone_index,
        "zone_patch_x": [round(zg["edge_x"][zone_index], 4), round(zg["edge_x"][zone_index + 1], 4)],
        "lit_patch_x": [round(zg["edge_x"][0], 4), round(zg["edge_x"][-1], 4)],
        "zone_centre_x": round(centre_x, 4),
        "confocal_model_extra_path_m": round(conf_delay_path, 4),
        "confocal_model_note": "2|SWc| + 2|WcH| minus the zone's first-bounce path; ~= 2|WcH| (what the code models)",
        "diffuse_point_target": diffuse,
        "ideal_retroreflector_point_target": retro,
    }


def radiometry_estimate():
    """Order-of-magnitude third-bounce / first-bounce ratio for one zone. ESTIMATE, assumptions listed."""
    rho_wall = 0.8        # matte light wall (assumption; README recommends 'matte, light-coloured')
    rho_person = 0.5      # clothing at 940 nm (assumption)
    torso_area = 0.4 * 0.6
    d_sw = 0.9            # README: SPAD-wall < 1 m
    d_wh = 1.2            # README: wall-hidden ~1-1.5 m
    patch_side = 2 * d_sw * math.tan(math.radians(FOV_DEG / 2))
    lit_area = patch_side ** 2
    zone_area = (patch_side / ZONES_PER_ROW) ** 2
    f_wall_to_torso = torso_area / (math.pi * d_wh ** 2)       # Lambertian: fraction reaching a facing area A at d
    f_torso_to_zone_patch = zone_area / (math.pi * d_wh ** 2)
    flood_ratio = rho_person * rho_wall * f_wall_to_torso * f_torso_to_zone_patch * (lit_area / zone_area)
    single_spot_ratio = rho_person * rho_wall * f_wall_to_torso * f_torso_to_zone_patch
    res = {
        "label": "ESTIMATE (illustrative radiometry, best-case cosines = 1, point-like patches)",
        "assumptions": {
            "wall_albedo": rho_wall, "person_albedo_940nm": rho_person, "torso_area_m2": torso_area,
            "sensor_to_wall_m": d_sw, "wall_to_person_m": d_wh, "fov_deg": FOV_DEG,
            "lit_patch_side_m": round(patch_side, 3), "lit_area_m2": round(lit_area, 4),
            "zone_patch_area_m2": round(zone_area, 4),
        },
        "fraction_wall_to_torso": round(f_wall_to_torso, 4),
        "fraction_torso_to_one_zone_patch": round(f_torso_to_zone_patch, 5),
        "ratio_3B_to_1B_flood_zone": float(f"{flood_ratio:.3g}"),
        "ratio_3B_to_1B_flood_zone_one_in": round(1 / flood_ratio),
        "ratio_3B_to_1B_single_spot_own_path": float(f"{single_spot_ratio:.3g}"),
        "ratio_3B_to_1B_single_spot_one_in": round(1 / single_spot_ratio),
        "distance_scaling": {
            "diffuse_3B_scales_as": "1/d_WH^4",
            "retroreflective_3B_scales_as": "1/d_WH^2 (ideal)",
            "diffuse_1.0m_vs_1.5m_factor": round((1.5 / 1.0) ** 4, 2),
            "retro_1.0m_vs_1.5m_factor": round((1.5 / 1.0) ** 2, 2),
        },
    }
    return res


def main():
    checks = []

    def check(name, ok, detail):
        checks.append({"check": name, "pass": bool(ok), "detail": detail})

    zA = zone_geometry(S_A, AIM_A)
    zB = zone_geometry(S_B, AIM_B)
    WA = [(x, 0.0) for x in zA["centre_x"]]
    WB = [(x, 0.0) for x in zB["centre_x"]]

    # ---- segment checks against the occluder -----------------------------------------------
    occ = OCCLUDER
    drawn = []
    for tag, S, Ws, Hs in (("A", S_A, WA, [H_A, H_B]), ("B1", S_B, WB, [H_A])):
        for i, W in enumerate(Ws):
            drawn.append((f"S_{tag}->W_{tag}{i+1}", S, W))
            for hn, H in zip(["H_A", "H_B"], Hs):
                drawn.append((f"W_{tag}{i+1}->{hn}", W, H))
    for tag, S, zg in (("A", S_A, zA), ("B1", S_B, zB)):
        drawn.append((f"FOV_left_edge_{tag}", S, (zg["edge_x"][0], 0.0)))
        drawn.append((f"FOV_right_edge_{tag}", S, (zg["edge_x"][-1], 0.0)))
    seg_report = []
    for name, p, q in drawn:
        inter = segments_intersect(p, q, *occ)
        clr = segment_segment_distance(p, q, *occ) - OCCLUDER_THICKNESS / 2
        seg_report.append({"segment": name, "from": [round(p[0], 4), round(p[1], 4)],
                           "to": [round(q[0], 4), round(q[1], 4)],
                           "crosses_occluder": inter, "clearance_m": round(clr, 3)})
        check(f"segment {name} clears occluder by >= {MIN_CLEARANCE_M} m",
              (not inter) and clr >= MIN_CLEARANCE_M, f"clearance {clr:.3f} m")

    for Sn, S in (("S_A", S_A), ("S_B", S_B)):
        for Hn, H in (("H_A", H_A), ("H_B", H_B)):
            blocked = segments_intersect(S, H, *occ)
            check(f"occluder blocks straight {Sn}->{Hn}", blocked, "must be True")
            # body disc invisible: sample its outline
            vis = []
            for a in np.linspace(0, 2 * math.pi, 181):
                pnt = (H[0] + BODY_RADIUS * math.cos(a), H[1] + BODY_RADIUS * math.sin(a))
                if not segments_intersect(S, pnt, *occ):
                    vis.append(pnt)
            check(f"no part of the person's body disc (r={BODY_RADIUS} m) at {Hn} is visible from {Sn}",
                  len(vis) == 0, f"{len(vis)} visible outline samples")
    # 3D: the partition is OCCLUDER_HEIGHT tall; the sight line from the sensor (h=SENSOR_HEIGHT) to the
    # top of the hider's head must pass the partition below its top edge.
    for Sn, S in (("S_A", S_A), ("S_B", S_B)):
        for Hn, H in (("H_A", H_A), ("H_B", H_B)):
            t = (OCCLUDER[0][0] - S[0]) / (H[0] - S[0])
            h_at = SENSOR_HEIGHT + t * (HIDER_HEAD_TOP - SENSOR_HEIGHT)
            check(f"3D: sight line {Sn}->top of head at {Hn} meets the partition below its {OCCLUDER_HEIGHT} m top",
                  h_at < OCCLUDER_HEIGHT - 0.1, f"height at partition {h_at:.2f} m")
    # how far into the hidden side can S see through the gap? (visibility wedge)
    wedge = {}
    for Sn, S in (("S_A", S_A), ("S_B", S_B)):
        gx0, gz0 = OCCLUDER[0]
        slope = (S[1] - gz0) / (gx0 - S[0])
        wedge[Sn] = {
            "line_through_gap_edge": [list(S), [gx0, gz0]],
            "z_limit_at_x_2.4": round(gz0 - slope * (2.4 - gx0), 3),
            "z_limit_at_H_A_x": round(gz0 - slope * (H_A[0] - gx0), 3),
            "meaning": "on the hidden side, S can see only points with z below this value (close to the wall)",
        }

    for nm, H in (("H_A", H_A), ("H_B", H_B)):
        check(f"{nm} is at least body radius + 0.05 m from the occluder",
              point_segment_distance(H, *occ) >= BODY_RADIUS + 0.05,
              f"{point_segment_distance(H, *occ):.3f} m")
        check(f"{nm} inside room", ROOM["x_min"] < H[0] < ROOM["x_max"] and 0 < H[1] < ROOM["z_max"], str(H))

    # ---- confocal numbers ------------------------------------------------------------------
    conf_A = [confocal_entry(S_A, W, H_A) for W in WA]
    conf_A_HB = [confocal_entry(S_A, W, H_B) for W in WA]
    conf_B1 = [confocal_entry(S_B, W, H_A) for W in WB]
    for e in conf_A + conf_B1:
        check(f"README guidance: |SW| < ~1.1 m for W at x={e['W'][0]}", e["SW_m"] <= 1.1, f"{e['SW_m']} m")
    for e in conf_A:
        check(f"README guidance: |WH| in ~0.9-1.5 m for W at x={e['W'][0]}", 0.9 <= e["WH_m"] <= 1.5, f"{e['WH_m']} m")
    # Released ST person-tracking data have signal only in bins 15..53 after the wall peak
    for e in conf_A + conf_B1:
        b = e["delay_after_first_bounce_bins_250ps"]
        check(f"third-bounce delay {b} bins lies inside bins 15-53 (where released ST data has signal)",
              15 <= b <= 53, "")

    # ---- non-confocal ellipse example ----------------------------------------------------------
    W1, W2 = WA[0], WA[-1]
    sum_f = dist(W1, H_A) + dist(H_A, W2)
    L_nc = dist(S_A, W1) + sum_f + dist(W2, S_A)
    a_ax = sum_f / 2
    c_f = dist(W1, W2) / 2
    b_ax = math.sqrt(a_ax ** 2 - c_f ** 2)
    centre = ((W1[0] + W2[0]) / 2, 0.0)
    # verify H on ellipse
    on_ell = ((H_A[0] - centre[0]) / a_ax) ** 2 + ((H_A[1] - centre[1]) / b_ax) ** 2
    nonconf = {
        "illumination_point_W1": list(W1), "detection_point_W2": list(W2),
        "path_L_m": round(L_nc, 4), "arrival_t_ns": round(L_nc / C_M_PER_NS, 3),
        "focal_sum_m (= c t - |SW1| - |W2S|)": round(sum_f, 4),
        "ellipse_centre": [round(centre[0], 4), 0.0],
        "semi_major_a_m (along the wall)": round(a_ax, 4),
        "semi_minor_b_m (perpendicular to the wall)": round(b_ax, 4),
        "half_focal_distance_m": round(c_f, 4),
        "eccentricity": round(c_f / a_ax, 4),
        "H_on_ellipse_check (should be 1)": round(on_ell, 6),
        "note": "Only the half with z > 0 is physical. With foci only 0.59 m apart the ellipse is nearly a circle.",
    }
    check("H_A lies on the non-confocal ellipse", abs(on_ell - 1) < 1e-9, f"{on_ell:.9f}")
    # non-confocal path segments clear?
    for name, p, q in (("S_A->W1", S_A, W1), ("W1->H_A", W1, H_A), ("H_A->W2", H_A, W2), ("W2->S_A", W2, S_A)):
        clr = segment_segment_distance(p, q, *occ) - OCCLUDER_THICKNESS / 2
        check(f"non-confocal path segment {name} clears occluder", clr >= MIN_CLEARANCE_M, f"{clr:.3f} m")

    # ---- noisy bands and intersection regions ------------------------------------------------
    infront = GZ > 0
    hidden_A = hidden_from(S_A, GX, GZ)

    def region(Ws, radii, half):
        m = infront.copy()
        for W, r in zip(Ws, radii):
            m &= band_mask(W, r, half)
        return m

    rA = [dist(W, H_A) for W in WA]
    rB1 = [dist(W, H_A) for W in WB]
    rA_HB = [dist(W, H_B) for W in WA]

    regions = {}
    half_pulse = 10 * BIN_NS * C_M_PER_NS / 2 / 2   # half of the firmware's 10-bin pulse, one-way: 0.1874 m
    for half, tag in ((BAND_HALF_M, "1bin_3.75cm"), (BAND_HALF_ALT_M, "2bins_7.5cm"),
                      (half_pulse, "half_pulse_18.7cm")):
        rr = {}
        for k in (1, 2, 3, 4):
            idx = list(range(k))  # adjacent-first: the sampled patch (aperture) widens with each point
            m = region([WA[i] for i in idx], [rA[i] for i in idx], half)
            st = region_stats(m, H_A)
            st["wall_points_used"] = [f"W_A{i+1}" for i in idx]
            st["aperture_span_m"] = round(WA[idx[-1]][0] - WA[idx[0]][0], 4)
            st["fraction_of_region_hidden_from_S"] = round(float((m & hidden_A).sum() / max(m.sum(), 1)), 3)
            rr[f"frameA_{k}_wall_points"] = st
        m = region([WA[0], WA[3]], [rA[0], rA[3]], half)
        st = region_stats(m, H_A)
        st["wall_points_used"] = ["W_A1", "W_A4"]
        st["meaning"] = ("outer pair only: in a pure band-intersection picture the inner points add almost nothing; "
                         "the spread of the wall points (aperture span), not their count, sets the crossing angle")
        st["crossing_estimate"] = crossing_estimate(WA[0], WA[3], H_A, half)
        rr["frameA_outer_pair_only"] = st
        mA = region(WA, rA, half)
        mB1 = region(WB, rB1, half)
        st = region_stats(mB1, H_A)
        st["wall_points_used"] = [f"W_B{i+1}" for i in range(4)]
        rr["frameB1_sensor_moved_alone"] = st
        st = region_stats(mA & mB1, H_A)
        st["wall_points_used"] = "W_A1..4 + W_B1..4 (object static, plain intersection is valid)"
        rr["frameA_plus_B1_sensor_moved_fused"] = st
        # object moved, sensor fixed
        mB2 = region(WA, rA_HB, half)
        rr["frameB2_object_moved_alone"] = region_stats(mB2, H_B)
        naive = mA & mB2
        st = region_stats(naive, H_B)
        st["meaning"] = "plain intersection of frame A and frame B2 bands, wrongly assuming the person stood still"
        rr["frameA_and_B2_naive_intersection"] = st
        # 'plain averaging': count satisfied bands out of 8
        cnt = np.zeros_like(GX, dtype=int)
        for W, r in zip(WA, rA):
            cnt += (band_mask(W, r, half) & infront)
        for W, r in zip(WA, rA_HB):
            cnt += (band_mask(W, r, half) & infront)
        best = int(cnt.max())
        avg_mask = cnt == best
        st = region_stats(avg_mask)
        st["max_bands_satisfied_of_8"] = best
        st["meaning"] = "plain averaging/stacking: best-agreeing cells; spans both positions (smear) when the person moved"
        rr["frameA_and_B2_plain_stacking_best_cells"] = st
        rmax = 1.5 * DT_B2_S  # walking at up to 1.5 m/s
        comp = dilate(mA, rmax) & mB2
        st = region_stats(comp, H_B)
        st["motion_prior_radius_m"] = rmax
        st["meaning"] = ("motion-compensated: move frame-A candidates by any step up to the motion-prior radius, "
                         "then keep those consistent with frame-B2 bands (what a particle filter's predict+update does)")
        rr["frameA_then_B2_motion_compensated"] = st
        regions[tag] = rr
    # ---- aperture sweep: the handheld sensor drifts left over several frames, object static ----------
    # (a 4th frame at S=(1.05, 0.90) was tried: its wall-to-person paths graze the partition (8 cm), so it is excluded)
    sweep_frames = [((1.65, 0.90), 1.85), ((1.45, 0.90), 1.65), ((1.25, 0.90), 1.45)]
    sweep = []
    cum = infront.copy()
    all_w = []
    for fi, (S, aim) in enumerate(sweep_frames):
        zg = zone_geometry(S, aim)
        Ws = [(x, 0.0) for x in zg["centre_x"]]
        clr_min = 9.9
        for W in Ws:
            for p, q in ((S, W), (W, H_A)):
                clr_min = min(clr_min, segment_segment_distance(p, q, *occ) - OCCLUDER_THICKNESS / 2)
        for x in (zg["edge_x"][0], zg["edge_x"][-1]):
            clr_min = min(clr_min, segment_segment_distance(S, (x, 0.0), *occ) - OCCLUDER_THICKNESS / 2)
        blocked = segments_intersect(S, H_A, *occ)
        check(f"sweep frame {fi}: all light segments clear the occluder by >= {MIN_CLEARANCE_M} m and S->H blocked",
              clr_min >= MIN_CLEARANCE_M and blocked, f"min clearance {clr_min:.3f} m")
        for W in Ws:
            cum &= band_mask(W, dist(W, H_A), BAND_HALF_M)
        all_w += [W[0] for W in Ws]
        st = region_stats(cum, H_A)
        sweep.append({
            "frame": fi, "S": list(S), "aim_x": aim,
            "wall_points_x": [round(W[0], 4) for W in Ws],
            "SW_m": [round(dist(S, W), 3) for W in Ws],
            "WH_m": [round(dist(W, H_A), 3) for W in Ws],
            "min_clearance_m": round(clr_min, 3),
            "cumulative_aperture_span_m": round(max(all_w) - min(all_w), 3),
            "cumulative_region": st,
            "crossing_estimate_outermost_pair": crossing_estimate((min(all_w), 0.0), (max(all_w), 0.0), H_A, BAND_HALF_M),
        })

    check("frame A (4 wall points, 1-bin bands) region contains H_A",
          regions["1bin_3.75cm"]["frameA_4_wall_points"].get("truth_inside", False), "")
    check("sensor-moved fusion region contains H_A and is smaller than frame A alone",
          regions["1bin_3.75cm"]["frameA_plus_B1_sensor_moved_fused"].get("truth_inside", False)
          and regions["1bin_3.75cm"]["frameA_plus_B1_sensor_moved_fused"]["area_m2"]
          < regions["1bin_3.75cm"]["frameA_4_wall_points"]["area_m2"], "")
    check("motion-compensated region contains H_B",
          regions["1bin_3.75cm"]["frameA_then_B2_motion_compensated"].get("truth_inside", False), "")

    # mirror ambiguity for collinear wall points
    mirror = {"H_A_mirror_behind_wall": [H_A[0], -H_A[1]],
              "note": "circles centred on the wall line cross at H and at its mirror image behind the wall; "
                      "the wall itself rules the mirror out (in 3D: mirror across the wall plane)"}

    # ---- flood illumination model -----------------------------------------------------------
    flood = [flood_zone_spread(S_A, AIM_A, H_A, k) for k in range(ZONES_PER_ROW)]

    # ---- unit conversions -------------------------------------------------------------------
    units = {
        "c_cm_per_ns": round(C_M_PER_NS * 100, 3),
        "1ns_path_cm": round(C_M_PER_NS * 100, 2),
        "1ns_one_way_confocal_cm": round(C_M_PER_NS * 100 / 2, 2),
        "250ps_bin_path_cm": round(C_M_PER_NS * 100 * BIN_NS, 3),
        "250ps_bin_one_way_cm": round(C_M_PER_NS * 100 * BIN_NS / 2, 3),
        "firmware_CNH_bin_one_way_mm": 37.5348,
        "firmware_CNH_bin_ps": round(2 * 37.5348e-3 / (C_M_PER_NS * 1e9) * 1e12, 2),
        "demo_window_48_bins_ns": DEMO_NUM_BINS * BIN_NS,
        "demo_window_48_bins_path_m": round(DEMO_NUM_BINS * BIN_NS * C_M_PER_NS, 3),
        "demo_window_48_bins_one_way_m": round(DEMO_NUM_BINS * BIN_NS * C_M_PER_NS / 2, 3),
        "lct_128_bins_ns": 128 * BIN_NS,
        "lct_128_bins_path_m": round(128 * BIN_NS * C_M_PER_NS, 3),
        "ams_88ps_bin_path_cm": round(C_M_PER_NS * 100 * AMS_BIN_NS, 3),
        "ams_88ps_bin_one_way_cm": round(C_M_PER_NS * 100 * AMS_BIN_NS / 2, 3),
        "ams_128_bins_ns": round(128 * AMS_BIN_NS, 3),
        "firmware_pulse_width_bins (VL53LMZ_CNH_PULSE_WIDTH_BIN)": 10,
        "firmware_pulse_width_ns": 10 * BIN_NS,
        "pf_random_walk_std_per_frame_m": PF_STEP_STD_M,
        "pf_step_equivalent_speed_at_30Hz_m_per_s": round(PF_STEP_STD_M * DEMO_CAPTURE_HZ, 2),
        "frame_period_at_30Hz_ms": round(1000 / DEMO_CAPTURE_HZ, 2),
    }

    layout = {
        "_title": "Video 02 declared room layout (plan view, metres) and derived timing geometry",
        "_status": "ILLUSTRATIVE: physically sensible, built from the authors' demo guidance; not a paper experiment",
        "_generated_by": "research/geometry/geometry_check.py",
        "coordinates": "x right along relay wall; z = distance from relay wall toward viewer (wall z=0); h = height",
        "room": ROOM,
        "relay_wall": {"from": list(RELAY_WALL[0]), "to": list(RELAY_WALL[1]),
                       "surface": "matte, light-coloured (README: ideal relay wall)"},
        "occluder": {"from": list(OCCLUDER[0]), "to": list(OCCLUDER[1]), "thickness": OCCLUDER_THICKNESS,
                     "height": OCCLUDER_HEIGHT, "gap_to_wall_m": OCCLUDER[0][1],
                     "description": "free-standing folding screen perpendicular to the wall; light passes through the gap"},
        "heights": {"sensor_h": SENSOR_HEIGHT, "torso_h": TORSO_HEIGHT, "hider_head_top_h": HIDER_HEAD_TOP,
                    "note": "plan is a horizontal slice at ~1.2 m; in 3D, circles become hemispheres in front of the wall"},
        "sensor": {
            "frame_A": {"S": list(S_A), "aim_x": AIM_A, **{k: [round(x, 4) for x in val] if isinstance(val, list) else round(val, 3)
                                                          for k, val in zA.items()}},
            "frame_B1_moved": {"S": list(S_B), "aim_x": AIM_B, **{k: [round(x, 4) for x in val] if isinstance(val, list) else round(val, 3)
                                                                 for k, val in zB.items()}},
            "model": "one row of a 4x4-zone, 45-degree flood sensor (VL53L8-like); zone centres = sampled wall points",
        },
        "hidden_person": {"H_A": list(H_A), "H_B_moved": list(H_B), "dt_A_to_B2_s": DT_B2_S,
                          "speed_m_per_s": round(dist(H_A, H_B) / DT_B2_S, 2), "body_radius_m": BODY_RADIUS},
        "wall_points": {"frame_A": [[round(w[0], 4), 0.0] for w in WA], "frame_B1": [[round(w[0], 4), 0.0] for w in WB]},
        "band_half_width_m": {"default_1_bin": round(BAND_HALF_M, 4), "alt_2_bins": round(BAND_HALF_ALT_M, 4),
                              "label": "illustrative: one 250 ps bin of one-way distance; not a measured precision"},
        "confocal": {"frame_A_H_A": conf_A, "frame_A_H_B": conf_A_HB, "frame_B1_H_A": conf_B1},
        "non_confocal_example": nonconf,
        "mirror_ambiguity": mirror,
        "visibility_wedge_through_gap": wedge,
        "regions": regions,
        "aperture_sweep_1bin_bands": sweep,
        "flood_illumination_zone_spreads_frame_A": flood,
        "radiometry": radiometry_estimate(),
        "units": units,
        "segments": seg_report,
        "checks": checks,
        "all_checks_pass": all(c["pass"] for c in checks),
    }
    out = HERE / "layout.json"
    with open(out, "w") as f:
        json.dump(layout, f, indent=1)
    n_fail = sum(not c["pass"] for c in checks)
    print(f"wrote {out}  ({len(checks)} checks, {n_fail} failed)")
    for c in checks:
        if not c["pass"]:
            print("  FAIL:", c["check"], c["detail"])

    # ---- optional preview ---------------------------------------------------------------------
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except Exception:
        print("matplotlib not available; skipping preview")
        return layout

    def base(ax, title):
        ax.set_xlim(ROOM["x_min"] - 0.05, ROOM["x_max"] + 0.05)
        ax.set_ylim(ROOM["z_max"] + 0.05, -0.15)   # wall at top, viewer at bottom
        ax.set_aspect("equal")
        ax.plot([0, 4], [0, 0], color="k", lw=3)
        ax.plot([OCCLUDER[0][0]] * 2, [OCCLUDER[0][1], OCCLUDER[1][1]], color="#e8705a", lw=5, solid_capstyle="butt")
        ax.set_title(title, fontsize=9)
        ax.set_xlabel("x (m)")
        ax.set_ylabel("z (m) from wall")

    def bands(ax, Ws, radii, color, half=BAND_HALF_M):
        th = np.linspace(0, np.pi, 400)
        for W, r in zip(Ws, radii):
            for rr_, ls in ((r, "-"),):
                ax.plot(W[0] + rr_ * np.cos(th), rr_ * np.sin(th), color=color, lw=0.8, ls=ls)
            ax.fill_between([], [], [])
            xs_o = W[0] + (r + half) * np.cos(th); zs_o = (r + half) * np.sin(th)
            xs_i = W[0] + (r - half) * np.cos(th); zs_i = (r - half) * np.sin(th)
            ax.fill(np.r_[xs_o, xs_i[::-1]], np.r_[zs_o, zs_i[::-1]], color=color, alpha=0.12, lw=0)

    def region_draw(ax, m, color):
        ax.contourf(GX, GZ, m.astype(float), levels=[0.5, 1.5], colors=[color], alpha=0.9)

    fig, axs = plt.subplots(2, 3, figsize=(19, 10))
    ax = axs[0, 0]
    base(ax, "Frame A: sensor S_A, 4 zone centres, confocal paths (slowed, simplified)")
    ax.plot(*S_A, "s", color="#3366aa"); ax.plot(*H_A, "o", color="#cc3333")
    ax.add_patch(plt.Circle(H_A, BODY_RADIUS, fill=False, color="#cc3333", ls=":"))
    for x in (zA["edge_x"][0], zA["edge_x"][-1]):
        ax.plot([S_A[0], x], [S_A[1], 0], color="#3366aa", lw=0.6, ls="--")
    for W in WA:
        ax.plot([S_A[0], W[0]], [S_A[1], 0], color="#3366aa", lw=1)
        ax.plot([W[0], H_A[0]], [0, H_A[1]], color="#cc8833", lw=1)
        ax.plot(W[0], 0, "^", color="k")
    ax.plot([S_A[0], H_A[0]], [S_A[1], H_A[1]], color="grey", lw=1, ls=":")
    w = wedge["S_A"]["line_through_gap_edge"]
    ax.plot([w[0][0], 2.9], [w[0][1], w[0][1] + (2.9 - w[0][0]) * (w[1][1] - w[0][1]) / (w[1][0] - w[0][0])], color="grey", lw=0.6)

    ax = axs[0, 1]
    base(ax, "Frame A bands (+/-3.75 cm) and their intersection")
    bands(ax, WA, rA, "#cc8833")
    region_draw(ax, region(WA, rA, BAND_HALF_M), "#7a1f1f")
    ax.plot(*H_A, "x", color="k")
    for W in WA:
        ax.plot(W[0], 0, "^", color="k")

    ax = axs[1, 0]
    base(ax, "Sensor moved (B1): new wall points; fused region (object static)")
    bands(ax, WA, rA, "#cc8833")
    bands(ax, WB, rB1, "#3366aa")
    region_draw(ax, region(WA, rA, BAND_HALF_M) & region(WB, rB1, BAND_HALF_M), "#7a1f1f")
    ax.plot(*S_A, "s", color="#cc8833"); ax.plot(*S_B, "s", color="#3366aa"); ax.plot(*H_A, "x", color="k")
    for W in WB:
        ax.plot(W[0], 0, "^", color="#3366aa")

    ax = axs[1, 1]
    base(ax, "Person moved (B2): naive stacking vs motion-compensated")
    bands(ax, WA, rA, "#cc8833")
    bands(ax, WA, rA_HB, "#3366aa")
    mA = region(WA, rA, BAND_HALF_M)
    mB2 = region(WA, rA_HB, BAND_HALF_M)
    region_draw(ax, mA, "#cc8833")
    region_draw(ax, dilate(mA, 1.5 * DT_B2_S) & mB2, "#7a1f1f")
    ax.plot(*H_A, "x", color="#cc8833"); ax.plot(*H_B, "x", color="#3366aa")
    def zoom(ax, title):
        ax.set_xlim(2.2, 3.05); ax.set_ylim(1.25, 0.45); ax.set_aspect("equal")
        ax.set_title(title, fontsize=9); ax.set_xlabel("x (m)"); ax.set_ylabel("z (m) from wall")
        ax.grid(alpha=0.3)

    ax = axs[0, 2]
    zoom(ax, "ZOOM frame A: region for 1,2,3,4 adjacent wall points (+/-3.75 cm)")
    cols = ["#f2d7c2", "#e6a97e", "#c8703f", "#7a1f1f"]
    for k in range(1, 5):
        m = region(WA[:k], rA[:k], BAND_HALF_M)
        ax.contourf(GX, GZ, m.astype(float), levels=[0.5, 1.5], colors=[cols[k - 1]], alpha=0.9)
    ax.plot(*H_A, "x", color="k")
    ax = axs[1, 2]
    zoom(ax, "ZOOM: A only (orange), A+B1 fused (dark red), B2 alone (blue); naive A&B2 = empty")
    region_draw(ax, region(WA, rA, BAND_HALF_M), "#e6a97e")
    region_draw(ax, region(WA, rA, BAND_HALF_M) & region(WB, rB1, BAND_HALF_M), "#7a1f1f")
    region_draw(ax, region(WA, rA_HB, BAND_HALF_M), "#3366aa")
    ax.plot(*H_A, "x", color="k"); ax.plot(*H_B, "+", color="k")
    for a in axs.ravel():
        a.text(0.02, 0.02, "diagnostic preview, illustrative geometry", transform=a.transAxes, fontsize=7, color="grey")
    fig.tight_layout()
    png = HERE / "geometry_preview.png"
    fig.savefig(png, dpi=110)
    print(f"wrote {png}")
    return layout


if __name__ == "__main__":
    main()
