#!/usr/bin/env python3
"""V3 tissue plates (Blender Cycles): a dimensional block of mouse abdominal skin and what lies under it.

Units: 1 = 1 micrometre. The block is 1.6 mm wide (x), 0.8 mm deep (y) and runs from the skin surface (z = 0) down to
the wall of the intestine (z = -1400). Real geometry for each layer, built in numpy:
  stratum corneum (thin stacked flakes, a film of the dye solution on top), epidermis (two layers of flattened cells),
  dermis (wavy collagen bundles in a basket weave, fibroblasts, hair follicles with shafts and sebaceous glands,
  capillaries with red cells), dermal fat (packed adipocytes: lipid), panniculus carnosus (striated muscle), the
  abdominal wall muscle, the peritoneum, then the intestine (serosa, muscle coats, villi).
Everything sits in the interstitial fluid (water), modelled as a volume that scatters light. The optical states:
  M  milky   - ordinary tissue: water and lipid bend light differently, so it scatters strongly; deep layers lost
  C  cleared - dye in the water: scattering much lower, the water tinted orange; the boundaries of fibres and cells
               fade (index matched); deep layers resolved
and a narrow beam of red light entering at the top (B) or not (N). Layers: MN, MB, CN, CB. And masks:
  MASK  emission: R = lipid (adipocytes, sebaceous), G = water-rich matrix/fibres, B = intestine
usage: tissue_scene.py <cam> <layer> <width> <samples> <out.exr> [margin]"""
import math, sys
import bpy, numpy as np, mathutils
from mathutils import Vector

CAM, LAYER, WIDTH, SAMPLES, OUT = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
MARGIN = float(sys.argv[6]) if len(sys.argv) > 6 else 1.0
MASK = LAYER == 'MASK'
CLEARED = LAYER.startswith('C')
BEAM = LAYER.endswith('B')
rng = np.random.default_rng(21)
XW, YD = 800.0, 400.0  # half-width, half-depth
BEAM_X = -40.0

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'; sc.unit_settings.scale_length = 1e-6
sc.render.engine = 'CYCLES'; cy = sc.cycles
cy.device = 'CPU'; cy.samples = SAMPLES; cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.02
cy.use_denoising = not MASK; cy.denoiser = 'OPENIMAGEDENOISE'
cy.max_bounces = 16; cy.diffuse_bounces = 3; cy.glossy_bounces = 3; cy.transmission_bounces = 10; cy.volume_bounces = 4
cy.transparent_max_bounces = 16; cy.volume_step_rate = 2.0; cy.volume_max_steps = 512
sc.render.resolution_x, sc.render.resolution_y = WIDTH, int(round(WIDTH * 16 / 9))
sc.render.image_settings.media_type = 'MULTI_LAYER_IMAGE'; sc.render.image_settings.file_format = 'OPEN_EXR_MULTILAYER'
sc.render.image_settings.color_depth = '16'
if MASK: cy.samples = 8
sc.view_layers[0].use_pass_z = True

world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.012, 0.014, 0.02, 1); bg.inputs[1].default_value = 1.0

# ---------------- mesh builders (numpy, merged per tissue) ----------------
def _sphere_template(nu, nv):
    V = [(0, 0, 1)]
    for j in range(1, nv):
        th = math.pi * j / nv
        for i in range(nu):
            ph = 2 * math.pi * i / nu; V.append((math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th)))
    V.append((0, 0, -1)); F = []
    for i in range(nu): F.append((0, 1 + i, 1 + (i + 1) % nu))
    for j in range(nv - 2):
        for i in range(nu):
            a = 1 + j * nu + i; b = 1 + j * nu + (i + 1) % nu
            F.append((a, a + nu, b + nu, b))
    last = len(V) - 1; base = 1 + (nv - 2) * nu
    for i in range(nu): F.append((base + i, last, base + (i + 1) % nu))
    return np.array(V, float), F

def blobs(name, C, R, rotz=None, nu=16, nv=10, jitter=0.0):
    """merged ellipsoids: centres C (N,3), radii R (N,3)"""
    TV, TF = _sphere_template(nu, nv)
    N = len(C); verts = []; faces = []
    for k in range(N):
        v = TV * R[k]
        if jitter: v *= 1 + jitter * np.sin(TV[:, :1] * 3.1 + k) * np.cos(TV[:, 1:2] * 2.3 + k * 0.7)
        if rotz is not None:
            c, s = math.cos(rotz[k]), math.sin(rotz[k]); v = v @ np.array([[c, s, 0], [-s, c, 0], [0, 0, 1]])
        verts.append(v + C[k]); off = k * len(TV)
        faces += [tuple(i + off for i in f) for f in TF]
    return mesh(name, np.concatenate(verts), faces)

def tubes(name, paths, radii, nseg=10, caps=True):
    """merged tubes along polylines; capped ends read as cut fibre ends"""
    verts, faces, uvs = [], [], []; off = 0
    for P, r in zip(paths, radii):
        P = np.asarray(P, float); n = len(P)
        T = np.gradient(P, axis=0); T /= np.linalg.norm(T, axis=1, keepdims=True) + 1e-9
        ref = np.where(np.abs(T[:, 2:3]) < 0.9, np.array([[0, 0, 1.0]]), np.array([[1.0, 0, 0]]))
        Nn = np.cross(T, ref); Nn /= np.linalg.norm(Nn, axis=1, keepdims=True); Bn = np.cross(T, Nn)
        rr = np.broadcast_to(r, (n,))
        a = np.linspace(0, 2 * np.pi, nseg, endpoint=False)
        ring = (np.cos(a)[None, :, None] * Nn[:, None] + np.sin(a)[None, :, None] * Bn[:, None]) * rr[:, None, None]
        V = (P[:, None] + ring).reshape(-1, 3); verts.append(V)
        for i in range(n - 1):
            for j in range(nseg):
                p, q = off + i * nseg + j, off + i * nseg + (j + 1) % nseg
                faces.append((p, q, q + nseg, p + nseg))
        nv = n * nseg
        if caps:
            verts.append(np.array([P[0], P[-1]])); c0, c1 = off + nv, off + nv + 1
            for j in range(nseg):
                faces.append((c0, off + (j + 1) % nseg, off + j)); faces.append((c1, off + (n - 1) * nseg + j, off + (n - 1) * nseg + (j + 1) % nseg))
            nv += 2
        off += nv
    return mesh(name, np.concatenate(verts), faces)

def mesh(name, V, F):
    me = bpy.data.meshes.new(name); me.from_pydata(V.tolist(), [], F)
    me.polygons.foreach_set('use_smooth', np.ones(len(F), bool))
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob); return ob

def slab(name, z0, z1, x=XW, y=YD):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, (z0 + z1) / 2))
    ob = bpy.context.active_object; ob.name = name; ob.scale = (2 * x, 2 * y, abs(z1 - z0)); return ob

def wavy(p0, d, L, amp, wl, n, seed):
    r = np.random.default_rng(abs(int(seed))); s = np.linspace(0, L, n)
    d = np.asarray(d, float); d /= np.linalg.norm(d)
    side = np.cross(d, [0, 0, 1.0]); side = side / (np.linalg.norm(side) + 1e-9)
    ph1, ph2 = r.uniform(0, 6.28, 2)
    return np.asarray(p0) + s[:, None] * d + (amp * np.sin(2 * np.pi * s / wl + ph1))[:, None] * side + (0.6 * amp * np.sin(2 * np.pi * s / (wl * 1.7) + ph2))[:, None] * np.array([0, 0, 1.0])

# ---------------- materials ----------------
def mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    return m, nt, nt.nodes.new('ShaderNodeOutputMaterial')

def link(nt, a, b): nt.links.new(a, b)

def tissue_mat(name, col, ss=0.6, rough=0.45, trans=0.0, coat=0.0, mask=(0, 1, 0), fade=0.5, fibres=None, lets_light=False):
    """a translucent tissue; in the cleared state it partly fades (its boundary to the water is index-matched)"""
    m, nt, out = mat(name)
    if MASK:
        e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = (*mask, 1); link(nt, e.outputs[0], out.inputs[0]); return m
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    p.inputs['Base Color'].default_value = (*col, 1); p.inputs['Subsurface Weight'].default_value = ss
    p.inputs['Subsurface Radius'].default_value = (1.0, 0.6, 0.45); p.inputs['Subsurface Scale'].default_value = 6.0
    p.inputs['Roughness'].default_value = rough; p.inputs['Transmission Weight'].default_value = trans; p.inputs['IOR'].default_value = 1.42
    p.inputs['Coat Weight'].default_value = coat; p.inputs['Coat Roughness'].default_value = 0.15
    if fibres:
        # fibrils along the fibre: fine stripes in the bump
        tc = nt.nodes.new('ShaderNodeTexCoord'); wv = nt.nodes.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = fibres
        wv.inputs['Scale'].default_value = 0.06; wv.inputs['Distortion'].default_value = 3; wv.inputs['Detail'].default_value = 2
        link(nt, tc.outputs['Object'], wv.inputs['Vector'])
        b = nt.nodes.new('ShaderNodeBump'); b.inputs['Strength'].default_value = 0.35; b.inputs['Distance'].default_value = 0.8
        link(nt, wv.outputs['Fac'], b.inputs['Height']); link(nt, b.outputs[0], p.inputs['Normal'])
    sh = p.outputs[0]
    if CLEARED and fade > 0:
        tr = nt.nodes.new('ShaderNodeBsdfTransparent'); tr.inputs[0].default_value = (1.0, 0.86, 0.62, 1)
        mx = nt.nodes.new('ShaderNodeMixShader'); mx.inputs[0].default_value = fade
        link(nt, sh, mx.inputs[1]); link(nt, tr.outputs[0], mx.inputs[2]); sh = mx.outputs[0]
    if lets_light:  # thin surface layers: direct light passes into the tissue below (shadow rays see them as clear)
        lp = nt.nodes.new('ShaderNodeLightPath'); tr2 = nt.nodes.new('ShaderNodeBsdfTransparent'); tr2.inputs[0].default_value = (1, 0.95, 0.85, 1)
        mx2 = nt.nodes.new('ShaderNodeMixShader'); link(nt, lp.outputs['Is Shadow Ray'], mx2.inputs[0])
        link(nt, sh, mx2.inputs[1]); link(nt, tr2.outputs[0], mx2.inputs[2]); sh = mx2.outputs[0]
    link(nt, sh, out.inputs[0]); return m

def assign(ob, m): ob.data.materials.clear(); ob.data.materials.append(m)

# ---------------- the block ----------------
# stratum corneum: thin overlapping flakes
fl_c = []; fl_r = []; fl_rot = []
for zz in (-3, -7, -11):
    gx, gy = np.meshgrid(np.arange(-XW + 20, XW, 34), np.arange(-YD + 20, YD, 34))
    n = gx.size
    fl_c.append(np.column_stack([gx.ravel() + rng.normal(0, 8, n), gy.ravel() + rng.normal(0, 8, n), zz + rng.normal(0, 0.8, n)]))
    fl_r.append(np.column_stack([rng.uniform(20, 28, n), rng.uniform(18, 26, n), np.full(n, 1.6)])); fl_rot.append(rng.uniform(0, 6.3, n))
sc_ob = blobs('corneum', np.concatenate(fl_c), np.concatenate(fl_r), np.concatenate(fl_rot), nu=10, nv=4)
assign(sc_ob, tissue_mat('corneum', (0.93, 0.86, 0.76), 0.4, 0.55, 0.3, 0.0, (0, 1, 0), 0.6, lets_light=True))
# the dye solution film on the surface (thin, wet)
film = slab('film', 1.5, 0); assign(film, tissue_mat('film', (1.0, 0.78, 0.25), 0.0, 0.05, 1.0, 1.0, (0, 1, 0), 0.0, lets_light=True) if not MASK else tissue_mat('filmm', (0, 0, 0), mask=(0, 0, 0)))
# epidermis: two layers of flattened keratinocytes
ke_c, ke_r, ke_rot = [], [], []
for zz, rz in ((-18, 5.0), (-28, 6.0)):
    gx, gy = np.meshgrid(np.arange(-XW + 8, XW, 15), np.arange(-YD + 8, YD, 15)); n = gx.size
    ke_c.append(np.column_stack([gx.ravel() + rng.normal(0, 3, n), gy.ravel() + rng.normal(0, 3, n), zz + rng.normal(0, 1, n)]))
    ke_r.append(np.column_stack([rng.uniform(7, 9.5, n), rng.uniform(6.5, 9, n), np.full(n, rz)])); ke_rot.append(rng.uniform(0, 6.3, n))
ke = blobs('epidermis', np.concatenate(ke_c), np.concatenate(ke_r), np.concatenate(ke_rot), nu=10, nv=6)
assign(ke, tissue_mat('kerat', (0.90, 0.70, 0.66), 0.7, 0.5, 0.0, 0, (0, 1, 0), 0.5, lets_light=True))
# dermis: collagen bundles, a basket weave (along x and along y), wavy
paths, radii = [], []
for k in range(520):
    z = rng.uniform(-255, -42); r = rng.uniform(3.5, 8.5)
    if k % 2:
        y = rng.uniform(-YD + r, YD - r); P = wavy((-XW, y, z), (1, 0, 0), 2 * XW, rng.uniform(3, 9), rng.uniform(40, 90), 90, k)
    else:
        x = rng.uniform(-XW + r, XW - r); P = wavy((x, -YD, z), (0, 1, 0), 2 * YD, rng.uniform(3, 9), rng.uniform(40, 90), 50, k)
    P[:, 2] = np.clip(P[:, 2], -258, -40); paths.append(P); radii.append(r)
col = tubes('collagen', paths, radii, nseg=8)
assign(col, tissue_mat('collagen', (0.94, 0.80, 0.74), 0.5, 0.5, 0.15, 0, (0, 1, 0), 0.62, fibres='X'))
# fibroblasts: small spindle cells between bundles
fb = blobs('fibro', np.column_stack([rng.uniform(-XW + 20, XW - 20, 160), rng.uniform(-YD + 20, YD - 20, 160), rng.uniform(-250, -45, 160)]),
           np.column_stack([rng.uniform(9, 14, 160), np.full(160, 2.5), np.full(160, 2.5)]), rng.uniform(0, 6.3, 160), nu=10, nv=6)
assign(fb, tissue_mat('fibro', (0.70, 0.48, 0.62), 0.6, 0.5, 0, 0, (0, 1, 0), 0.5))
# hair follicles: oblique tubes with a shaft, a bulb, and sebaceous lobules
fol_paths, fol_r, sh_paths, sh_r, bulbs_c, bulbs_r, seb_c, seb_r = [], [], [], [], [], [], [], []
for k, (x0, y0) in enumerate([(-560, -150), (-300, 180), (-80, -220), (150, 60), (380, -180), (600, 200), (-640, 250), (520, -40)]):
    d = np.array([0.42, 0.08 * (-1) ** k, -1.0]); d /= np.linalg.norm(d)
    L = 330; s = np.linspace(0, L, 30)
    P = np.array([x0, y0, 0.0]) + s[:, None] * d + np.sin(s / 60 + k)[:, None] * np.array([4, 3, 0])
    fol_paths.append(P); fol_r.append(np.linspace(13, 10, 30))
    sh_paths.append(np.vstack([P[0] - d * 60, P])); sh_r.append(np.linspace(5.2, 4.2, 31))
    bulbs_c.append(P[-1] + d * 6); bulbs_r.append((19, 19, 22))
    for j in range(5):
        seb_c.append(P[9] + np.array([rng.normal(-16, 6), rng.normal(0, 14), rng.normal(0, 14)])); seb_r.append(rng.uniform(10, 16, 3))
fo = tubes('follicle', fol_paths, fol_r, nseg=16); assign(fo, tissue_mat('follicle', (0.90, 0.66, 0.60), 0.8, 0.45, 0.1, 0, (0, 1, 0), 0.5))
hs = tubes('shaft', sh_paths, sh_r, nseg=12); assign(hs, tissue_mat('shaft', (0.97, 0.95, 0.90), 0.3, 0.25, 0.5, 0.5, (0, 1, 0), 0.3))
bu = blobs('bulb', np.array(bulbs_c), np.array(bulbs_r), nu=20, nv=12); assign(bu, tissue_mat('bulbm', (0.86, 0.58, 0.58), 0.8, 0.45, 0, 0, (0, 1, 0), 0.5))
sb = blobs('sebaceous', np.array(seb_c), np.array(seb_r), nu=16, nv=10, jitter=0.08)
assign(sb, tissue_mat('seb', (0.98, 0.90, 0.62), 0.6, 0.25, 0.35, 0.4, (1, 0, 0), 0.0))
# capillaries with red cells
cap_paths, cap_r, rbc_c, rbc_r, rbc_rot = [], [], [], [], []
for k in range(14):
    z = rng.uniform(-240, -60); y = rng.uniform(-YD + 30, YD - 30)
    P = wavy((-XW, y, z), (1, rng.normal(0, 0.15), rng.normal(0, 0.05)), 2 * XW, 12, 160, 80, 100 + k)
    P[:, 1] = np.clip(P[:, 1], -YD + 8, YD - 8); cap_paths.append(P); cap_r.append(4.5)
    for t in rng.choice(len(P), 18, replace=False):
        rbc_c.append(P[t]); rbc_r.append((3.6, 3.6, 1.1)); rbc_rot.append(rng.uniform(0, 6.3))
cp = tubes('capillary', cap_paths, cap_r, nseg=12); assign(cp, tissue_mat('capw', (0.92, 0.66, 0.66), 0.4, 0.3, 0.5, 0.2, (0, 1, 0), 0.4))
rb = blobs('rbc', np.array(rbc_c), np.array(rbc_r), np.array(rbc_rot), nu=12, nv=6); assign(rb, tissue_mat('rbcm', (0.75, 0.05, 0.04), 0.6, 0.35, 0, 0.2, (0, 1, 0), 0.15))
# dermal fat: packed adipocytes (lipid droplets) - relaxed random packing
pts = []
for _ in range(9000):
    p = np.array([rng.uniform(-XW + 30, XW - 30), rng.uniform(-YD + 30, YD - 30), rng.uniform(-400, -295)]); r = rng.uniform(27, 42)
    if all(np.linalg.norm(p - q[:3]) > (r + q[3]) * 0.86 for q in pts):
        pts.append(np.array([*p, r]))
    if len(pts) >= 520: break
pts = np.array(pts)
ad = blobs('adipocytes', pts[:, :3], np.column_stack([pts[:, 3], pts[:, 3] * 0.96, pts[:, 3] * 0.9]), rng.uniform(0, 6.3, len(pts)), nu=24, nv=14, jitter=0.04)
assign(ad, tissue_mat('lipid', (0.99, 0.93, 0.66), 0.35, 0.12, 0.55, 0.6, (1, 0, 0), 0.0))
# panniculus carnosus: striated muscle fibres along x; then the abdominal wall muscle along y
mpaths, mr = [], []
for y in np.arange(-YD + 10, YD, 19):
    for z in (-445, -462):
        if rng.random() < 0.12: continue
        mpaths.append(wavy((-XW, y + rng.normal(0, 4), z + rng.normal(0, 4)), (1, rng.normal(0, 0.03), rng.normal(0, 0.02)), 2 * XW, rng.uniform(2, 6), rng.uniform(200, 400), 40, int(y + z))); mr.append(rng.uniform(6, 10.5))
for x in np.arange(-XW + 12, XW, 22):
    for z in np.arange(-540, -700, -21):
        if rng.random() < 0.1: continue
        mpaths.append(wavy((x + rng.normal(0, 5), -YD, z + rng.normal(0, 5)), (rng.normal(0, 0.04), 1, rng.normal(0, 0.03)), 2 * YD, rng.uniform(2, 6), rng.uniform(200, 400), 24, int(x * 3 + z))); mr.append(rng.uniform(7.5, 12))
mu = tubes('muscle', mpaths, mr, nseg=10)
assign(mu, tissue_mat('musclem', (0.72, 0.26, 0.24), 0.75, 0.4, 0.05, 0, (0, 1, 0), 0.45, fibres='Z'))
# peritoneum: a thin glossy sheet
pe = slab('peritoneum', -722, -728); assign(pe, tissue_mat('perit', (0.95, 0.88, 0.86), 0.3, 0.1, 0.6, 0.6, (0, 1, 0), 0.3))
# intestine: serosa, longitudinal and circular muscle coats (curved top: the gut is a 2.5 mm tube), villi
def gut_layer(name, z_top, th, colr, fade):
    nx, ny = 160, 80
    xs = np.linspace(-XW, XW, nx); ys = np.linspace(-YD, YD, ny); gx, gy = np.meshgrid(xs, ys)
    zt = z_top - gx ** 2 / (2 * 1250.0)
    V = np.concatenate([np.column_stack([gx.ravel(), gy.ravel(), zt.ravel()]), np.column_stack([gx.ravel(), gy.ravel(), (zt - th).ravel()])])
    idx = np.arange(nx * ny).reshape(ny, nx); F = []
    for (a, b, c, d) in zip(idx[:-1, :-1].ravel(), idx[:-1, 1:].ravel(), idx[1:, 1:].ravel(), idx[1:, :-1].ravel()):
        F.append((a, b, c, d)); o = nx * ny; F.append((d + o, c + o, b + o, a + o))
    ob = mesh(name, V, F); assign(ob, tissue_mat(name + 'm', colr, 0.8, 0.35, 0.05, 0.3, (0, 0, 1), fade)); return ob
gut_layer('serosa', -800, 8, (0.96, 0.80, 0.76), 0.2)
gut_layer('longmus', -810, 40, (0.80, 0.42, 0.40), 0.2)
gut_layer('circmus', -852, 70, (0.74, 0.36, 0.34), 0.2)
gut_layer('submucosa', -924, 40, (0.92, 0.74, 0.70), 0.2)
vp, vr = [], []
for x in np.arange(-XW + 40, XW - 30, 78):
    for y in np.arange(-YD + 40, YD - 30, 78):
        x1, y1 = x + rng.normal(0, 16), y + rng.normal(0, 16); zt = -966 - x1 ** 2 / 2500.0
        lean = rng.normal(0, 0.18, 2); Lv = rng.uniform(200, 340); s_ = np.linspace(0, 1, 14)
        vp.append(np.column_stack([x1 + lean[0] * Lv * s_ ** 1.5 + np.sin(s_ * 3 + x) * 8, y1 + lean[1] * Lv * s_ ** 1.5, zt - Lv * s_]))
        r0 = rng.uniform(22, 34); vr.append(r0 * np.sqrt(np.clip(1 - s_ ** 6, 0.05, 1)) * (1 + 0.08 * np.sin(s_ * 9 + y)))
vi = tubes('villi', vp, vr, nseg=14); assign(vi, tissue_mat('villim', (0.86, 0.40, 0.40), 0.85, 0.35, 0, 0.4, (0, 0, 1), 0.15))

# the interstitial fluid: a volume filling the block, from the surface down to the peritoneum
vol = slab('matrix', -0.5, -1400, XW + 45, YD + 45)  # extends 45 um past the structures: the cut face is seen through the fluid
m, nt, out = mat('matrix')
if MASK:
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); link(nt, tr.outputs[0], out.inputs[0])
else:
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); link(nt, tr.outputs[0], out.inputs[0])
    vs = nt.nodes.new('ShaderNodeVolumeScatter'); va = nt.nodes.new('ShaderNodeVolumeAbsorption')
    vs.inputs['Anisotropy'].default_value = 0.0 if CLEARED else 0.6
    if CLEARED:
        vs.inputs['Density'].default_value = 0.0012; vs.inputs['Color'].default_value = (1.0, 0.95, 0.85, 1)
        va.inputs['Density'].default_value = 0.0011; va.inputs['Color'].default_value = (1.0, 0.70, 0.25, 1)
    else:
        vs.inputs['Density'].default_value = 0.026; vs.inputs['Color'].default_value = (1.0, 0.97, 0.95, 1)
        va.inputs['Density'].default_value = 0.0002; va.inputs['Color'].default_value = (1.0, 0.8, 0.75, 1)
    add = nt.nodes.new('ShaderNodeAddShader'); link(nt, vs.outputs[0], add.inputs[0]); link(nt, va.outputs[0], add.inputs[1])
    link(nt, add.outputs[0], out.inputs['Volume'])
assign(vol, m)

# ---------------- light ----------------
def area(name, loc, size, power, color=(1, 1, 1), target=(0, 0, -500)):
    ld = bpy.data.lights.new(name, 'AREA'); ld.size = size; ld.energy = power; ld.color = color
    ob = bpy.data.objects.new(name, ld); sc.collection.objects.link(ob); ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
amb = 0.10 if BEAM else 1.0
area('key', (-2500, -3500, 3000), 2500, 6.0e9 * amb, (1.0, 0.96, 0.92))
area('fill', (3000, -2500, -800), 2500, 2.0e9 * amb, (0.85, 0.9, 1.0))
area('top', (0, 0, 4000), 3000, 2.5e9 * amb, (1.0, 1.0, 1.0), (0, 0, 0))
if BEAM:
    # a narrow beam of red light entering the skin from above
    ld = bpy.data.lights.new('beam', 'SPOT'); ld.energy = 1.2e12; ld.color = (1.0, 0.35, 0.22); ld.spot_size = math.radians(1.6)
    ld.spot_blend = 0.3; ld.shadow_soft_size = 20
    ob = bpy.data.objects.new('beam', ld); sc.collection.objects.link(ob); ob.location = (BEAM_X, -YD - 5, 6000)  # just behind the cut face

# ---------------- cameras ----------------
CAMS = {
    'MAIN': dict(t=(0, -150, -640), v=(0.22, -1.0, 0.30), fh=1450, fs=8),
    'DYE':  dict(t=(-120, -380, -300), v=(-0.55, -1.0, 0.18), fh=520, fs=5),
    'TOP':  dict(t=(80, -200, 0), v=(0.15, -0.5, 1.0), fh=700, fs=6),
}
c = CAMS[CAM]
LENS = 100.0
v = np.asarray(c['v'], float); v /= np.linalg.norm(v)
dist = c['fh'] * MARGIN * LENS / 36.0
camd = bpy.data.cameras.new('cam'); camd.lens = LENS; camd.sensor_fit = 'VERTICAL'; camd.sensor_height = 36
camd.clip_start = 10; camd.clip_end = 1e6
camd.dof.use_dof = not MASK; camd.dof.focus_distance = dist; camd.dof.aperture_fstop = c['fs'] / MARGIN
cam = bpy.data.objects.new('cam', camd); sc.collection.objects.link(cam)
cam.location = Vector(c['t']) + Vector(v) * dist
cam.rotation_euler = Vector(-v).to_track_quat('-Z', 'Y').to_euler()
sc.camera = cam
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('wrote', OUT)
