#!/usr/bin/env python3
"""Every number the Earth Stops film shows or says, computed from sourced constants (nothing typed from memory except the constants below, each with its source id in script/SOURCES.md).
Usage: python3 tools/calc_speeds.py  -> script/speed_table.json (+ printed table)"""
import json, math, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# constants (source ids refer to script/SOURCES.md)
A = 6378137.0                 # m, WGS 84 semi-major axis                       [S1]
F = 1 / 298.257223563         # WGS 84 flattening                                [S1]
W = 7292115e-11               # rad/s, WGS 84 / IERS nominal mean angular velocity [S1, S4]
T_SIDEREAL_H = 23.9345        # h, NASA Earth fact sheet sidereal rotation period [S2] (cross-check only: 2 pi / T)
V_ESC = 11186.0               # m/s, NASA Earth fact sheet escape velocity        [S2]
CAT5_MPH = 157.0              # mph, NHC Saffir-Simpson Category 5 threshold (>= 137 kt, 252 km/h) [S7]
G0 = 9.80665                  # m/s^2 standard gravity
MS_TO_KMH, MS_TO_MPH = 3.6, 2.2369362921
E2 = F * (2 - F)


def speed(lat_deg):
    """eastward speed of the ground at sea level, geodetic latitude, rotating with the Earth about its axis (inertial frame)"""
    p = math.radians(lat_deg)
    N = A / math.sqrt(1 - E2 * math.sin(p) ** 2)
    return W * N * math.cos(p)


rows = {}
for lat in (0, 30, 34, 40, 45, 60, 80, 90):
    v = speed(lat)
    rows[str(lat)] = {'m_s': round(v, 2), 'km_h': round(v * MS_TO_KMH, 1), 'mph': round(v * MS_TO_MPH, 1)}
v0 = speed(0)
out = {
    'inputs': {'a_m': A, 'flattening': F, 'omega_rad_s': W, 'sidereal_period_h_NASA': T_SIDEREAL_H, 'v_escape_m_s_NASA': V_ESC, 'cat5_threshold_mph_NHC': CAT5_MPH},
    'ground_speed_east_by_latitude': rows,
    'checks': {
        'equator_from_sidereal_period_m_s': round(2 * math.pi * A / (T_SIDEREAL_H * 3600), 2),
        'equator_if_24h_day_used_m_s_(wrong, shown for the record)': round(2 * math.pi * A / 86400, 2),
        'rounded_for_narration': 'about a thousand miles an hour (exact 1,040 mph; the rounding is 4 % low)',
        '80deg_vs_cat5_threshold_mph': {'ground_mph': rows['80']['mph'], 'cat5_mph': CAT5_MPH, 'ratio': round(rows['80']['mph'] / CAT5_MPH, 2)},
        'equator_vs_cat5': round(rows['0']['mph'] / CAT5_MPH, 2),
        'circular_orbit_speed_m_s_from_NASA_v_esc': round(V_ESC / math.sqrt(2), 0),
        'equator_speed_as_fraction_of_orbital_speed': round(v0 / (V_ESC / math.sqrt(2)), 3),
        'centripetal_acceleration_equator_m_s2': round(W * W * A, 4),
        'centripetal_as_fraction_of_g': round(W * W * A / G0, 4),
    },
}
os.makedirs(f'{ROOT}/script', exist_ok=True)
json.dump(out, open(f'{ROOT}/script/speed_table.json', 'w'), indent=1)
print(json.dumps(out['ground_speed_east_by_latitude'], indent=0)); print(json.dumps(out['checks'], indent=1))
