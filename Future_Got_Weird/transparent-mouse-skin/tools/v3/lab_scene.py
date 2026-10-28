#!/usr/bin/env python3
"""V3 lab plates (Blender Cycles): preparing the food-dye solution.

A small glass vial of water on the bench, seen nearly side-on; a glass Pasteur pipette of concentrated yellow food dye
(tartrazine) with its rubber bulb at the top of frame (the hand holding it is kept out of frame: a modelled glove did not
look real); a defocused lab behind. Units: mm.
The falling drop, the dye plume (a 2D fluid simulation) and the cotton applicator are composited (lab_comp in comp_v3).

usage: lab_scene.py <cam> <layer> <width> <samples> <out.exr> [view] [margin]
  cam   LAB (the vial) | SWABCAM (the applicator alone, for the skin shots: see SWAB_VIEWS)
  layer BG     everything except the applicator
        MASK   emission masks (glass transparent): R = water inside the vial, B = dye in the pipette
        SWAB   the cotton applicator alone (transparent film), dry;  SWABWET  soaked in the yellow solution
        DROP   a drop of the dye (transparent film)"""
import math, sys
import bpy, numpy as np, mathutils
from mathutils import Vector

CAM, LAYER, WIDTH, SAMPLES, OUT = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
VIEW = sys.argv[6] if len(sys.argv) > 6 else 'HOOK'
MARGIN = float(sys.argv[7]) if len(sys.argv) > 7 else 1.0
rng = np.random.default_rng(11)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'; sc.unit_settings.scale_length = 0.001
sc.render.engine = 'CYCLES'; cy = sc.cycles
cy.device = 'CPU'; cy.samples = SAMPLES; cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.015
cy.use_denoising = True; cy.denoiser = 'OPENIMAGEDENOISE'
cy.max_bounces = 32; cy.transmission_bounces = 24; cy.transparent_max_bounces = 32; cy.glossy_bounces = 6; cy.diffuse_bounces = 3
cy.caustics_reflective = True; cy.caustics_refractive = True; cy.blur_glossy = 0.5
sc.render.resolution_x, sc.render.resolution_y = WIDTH, int(round(WIDTH * 16 / 9))
sc.render.image_settings.media_type = 'MULTI_LAYER_IMAGE'; sc.render.image_settings.file_format = 'OPEN_EXR_MULTILAYER'; sc.render.image_settings.color_depth = '16'
sc.render.film_transparent = LAYER in ('SWAB', 'SWABWET', 'DROP')
if LAYER == 'MASK': cy.samples = 16; cy.use_denoising = False

world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.55, 0.58, 0.62, 1); bg.inputs[1].default_value = 0.25

def mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    return m, nt, nt.nodes.new('ShaderNodeOutputMaterial')

def link(nt, a, b): nt.links.new(a, b)

def principled(name, **kw):
    m, nt, out = mat(name)
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    for k, v in kw.items(): p.inputs[k].default_value = v
    link(nt, p.outputs[0], out.inputs[0]); return m, nt, p

def emission(name, col):
    m, nt, out = mat(name); e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = (*col, 1); e.inputs[1].default_value = 1
    link(nt, e.outputs[0], out.inputs[0]); return m

def transparent(name):
    m, nt, out = mat(name); h = nt.nodes.new('ShaderNodeBsdfTransparent'); link(nt, h.outputs[0], out.inputs[0]); return m

def holdout(name):
    m, nt, out = mat(name); h = nt.nodes.new('ShaderNodeHoldout'); link(nt, h.outputs[0], out.inputs[0]); return m

def lathe(name, prof, seg=96, cap=False):
    """revolve a (r, z) profile about the z axis"""
    prof = np.asarray(prof, float); n = len(prof)
    a = np.linspace(0, 2 * np.pi, seg, endpoint=False)
    V = np.stack([prof[None, :, 0] * np.cos(a)[:, None], prof[None, :, 0] * np.sin(a)[:, None], np.broadcast_to(prof[:, 1], (seg, n))], -1).reshape(-1, 3)
    F = []
    for i in range(seg):
        for j in range(n - 1):
            p, q = i * n + j, ((i + 1) % seg) * n + j
            F.append([p, q, q + 1, p + 1])
    me = bpy.data.meshes.new(name); me.from_pydata(V.tolist(), [], F)
    me.polygons.foreach_set('use_smooth', np.ones(len(F), bool))
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob)
    return ob

def assign(ob, m):
    ob.data.materials.clear(); ob.data.materials.append(m)

MASKS = LAYER == 'MASK'
SPRITE = LAYER in ('SWAB', 'SWABWET', 'DROP')
black = emission('black', (0, 0, 0))

# ---------------- materials ----------------
glass, _, _ = principled('glass', **{'Base Color': (0.97, 0.99, 1.0, 1), 'Transmission Weight': 1.0, 'Roughness': 0.0, 'IOR': 1.5})
water, _, _ = principled('water', **{'Base Color': (0.98, 0.995, 1.0, 1), 'Transmission Weight': 1.0, 'Roughness': 0.0, 'IOR': 1.333})
dye, nt, p = principled('dye', **{'Base Color': (1, 1, 1, 1), 'Transmission Weight': 1.0, 'Roughness': 0.0, 'IOR': 1.36})
# the concentrated dye: strong blue absorption (tartrazine) -> deep yellow-orange in depth
va = nt.nodes.new('ShaderNodeVolumeAbsorption'); va.inputs['Color'].default_value = (1.0, 0.62, 0.02, 1); va.inputs['Density'].default_value = 0.9
link(nt, va.outputs[0], nt.nodes['Material Output'].inputs['Volume'])

if LAYER in ('BG', 'MASK'):
    # ---------------- bench, pad, vial, water, pipette ----------------
    bench, _, _ = principled('bench', **{'Base Color': (0.80, 0.81, 0.80, 1), 'Roughness': 0.35})
    bpy.ops.mesh.primitive_plane_add(size=1200, location=(0, 0, 0)); assign(bpy.context.active_object, black if MASKS else bench)
    pad, _, pp = principled('pad', **{'Base Color': (0.36, 0.55, 0.70, 1), 'Roughness': 0.9})
    bpy.ops.mesh.primitive_plane_add(size=160, location=(10, 30, 0.3)); assign(bpy.context.active_object, black if MASKS else pad)
    RO, RI, HV, BOT = 11.0, 10.1, 46.0, 1.6
    vial = lathe('vial', [(0, 0), (RO - 1.2, 0), (RO, 1.2), (RO, HV - 1.0), (RO - 0.15, HV), (RI + 0.1, HV), (RI, HV - 1.0), (RI, BOT + 0.8), (RI - 0.8, BOT), (0.001, BOT)])
    assign(vial, transparent('mG') if MASKS else glass)
    WL = 27.0  # water level, with a meniscus climbing the glass
    prof = [(0.001, BOT + 0.02)] + [(RI - 0.02, BOT + 0.02)] + [(RI - 0.02, WL + 1.1)] + [(RI - 0.02 - 1.2 * (1 - math.exp(-k / 3)), WL + 1.1 * math.exp(-k / 2)) for k in range(1, 12)] + [(0.001, WL)]
    wat = lathe('water', prof)
    assign(wat, emission('mR', (1, 0, 0)) if MASKS else water)
    # Pasteur pipette: glass tube tapering to a fine tip, concentrated dye in the lower part
    TIP = (0.0, 0.0, WL + 9.0)
    tube = [(0.6, 0), (0.75, 2), (0.9, 8), (1.1, 16), (2.6, 28), (3.4, 34), (3.5, 46)]
    pip = lathe('pipette', [(r, TIP[2] + z) for r, z in tube] + [(r - 0.35, TIP[2] + z) for r, z in reversed(tube)])
    assign(pip, transparent('mG2') if MASKS else glass)
    liq = lathe('pipliq', [(0.001, TIP[2] + 0.3), (0.32, TIP[2] + 0.3), (0.45, TIP[2] + 2), (0.6, TIP[2] + 8), (0.78, TIP[2] + 16), (2.2, TIP[2] + 28), (2.9, TIP[2] + 34), (2.95, TIP[2] + 52), (0.001, TIP[2] + 52.5)])
    assign(liq, emission('mB', (0, 0, 1)) if MASKS else dye)
    if not MASKS:
        # the rubber bulb
        bulb, _, _ = principled('bulb', **{'Base Color': (0.55, 0.08, 0.06, 1), 'Roughness': 0.45, 'Subsurface Weight': 0.3})
        B0 = TIP[2] + 44
        bb = lathe('bulb', [(0.001, B0), (3.8, B0 + 2), (5.6, B0 + 12), (6.0, B0 + 26), (5.0, B0 + 40), (0.001, B0 + 44)])
        assign(bb, bulb)
        # a defocused lab behind: an amber reagent bottle, a tube rack, a wash bottle, a beaker
        amber, _, _ = principled('amber', **{'Base Color': (0.55, 0.25, 0.05, 1), 'Transmission Weight': 0.6, 'Roughness': 0.1})
        o = lathe('bottle', [(0.001, 0), (24, 0), (26, 4), (26, 90), (12, 104), (10, 120), (0.001, 120)]); o.location = (-70, 190, 0); assign(o, amber)
        rack, _, _ = principled('rack', **{'Base Color': (0.80, 0.82, 0.86, 1), 'Roughness': 0.5})
        bpy.ops.mesh.primitive_cube_add(size=1, location=(110, 330, 30)); r_ = bpy.context.active_object; r_.scale = (120, 40, 60); assign(r_, rack)
        wb, _, _ = principled('wb', **{'Base Color': (0.92, 0.92, 0.95, 1), 'Roughness': 0.3, 'Transmission Weight': 0.3})
        o = lathe('washbottle', [(0.001, 0), (28, 0), (30, 6), (30, 110), (14, 130), (6, 150), (0.001, 152)]); o.location = (95, 120, 0); assign(o, wb)
        o = lathe('beaker', [(0.001, 0), (30, 0), (30, 70), (31, 72), (29.2, 72), (29.2, 1.5), (0.001, 1.5)]); o.location = (-110, 90, 0); assign(o, glass)
        wall, _, _ = principled('wall', **{'Base Color': (0.72, 0.76, 0.80, 1), 'Roughness': 0.8})
        bpy.ops.mesh.primitive_plane_add(size=2000, location=(0, 420, 0), rotation=(math.radians(90), 0, 0)); assign(bpy.context.active_object, wall)
    else:
        for o in list(sc.objects):
            if o.type == 'MESH' and o.name not in ('vial', 'water', 'pipette', 'pipliq') and o.data.materials and o.data.materials[0].name not in ('mR', 'mG', 'mG2', 'mB'):
                assign(o, black)

# ---------------- the cotton-tipped applicator ----------------
def applicator(tip, direction, wet):
    """a fine-tip cotton applicator: a white shaft, a 2.4 mm wide cotton bud of tangled fibres. tip = bud end point"""
    d = np.asarray(direction, float); d /= np.linalg.norm(d); tip = np.asarray(tip, float)
    BUD_L, BUD_R, SHAFT_R = 6.5, 1.25, 0.6
    centre = tip + d * BUD_L * 0.45
    shaft, _, _ = principled('shaft', **{'Base Color': (0.93, 0.92, 0.88, 1), 'Roughness': 0.45, 'Subsurface Weight': 0.2, 'Subsurface Scale': 0.5})
    bpy.ops.mesh.primitive_cylinder_add(radius=SHAFT_R, depth=150, location=tuple(tip + d * (BUD_L * 0.6 + 75)), vertices=32)
    sh = bpy.context.active_object; sh.rotation_euler = Vector(d).to_track_quat('Z', 'Y').to_euler(); bpy.ops.object.shade_smooth(); assign(sh, shaft)
    # core: an elongated ellipsoid, then thousands of short curly fibres over it
    col = (1.0, 0.70, 0.10) if wet else (0.97, 0.96, 0.93)
    core, _, _ = principled('core', **{'Base Color': (*col, 1), 'Roughness': 0.9, 'Subsurface Weight': 0.6, 'Subsurface Scale': 0.3,
                                      'Coat Weight': 0.6 if wet else 0.0, 'Coat Roughness': 0.15})
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=tuple(centre), segments=48, ring_count=24)
    co = bpy.context.active_object; co.scale = (BUD_R * 0.86, BUD_R * 0.86, BUD_L * 0.5); co.rotation_euler = Vector(d).to_track_quat('Z', 'Y').to_euler()
    bpy.ops.object.shade_smooth(); assign(co, core)
    q = Vector(d).to_track_quat('Z', 'Y').to_matrix()
    Mq = np.array(q)
    N = 9000; npts = 6
    u = rng.uniform(-1, 1, N); th = rng.uniform(0, 2 * np.pi, N)
    prof = np.sqrt(np.clip(1 - u ** 2, 0, 1))
    loc = np.stack([BUD_R * 0.8 * prof * np.cos(th), BUD_R * 0.8 * prof * np.sin(th), BUD_L * 0.5 * u], -1)
    nrm = np.stack([prof * np.cos(th), prof * np.sin(th), u * 0.6], -1); nrm /= np.linalg.norm(nrm, axis=1, keepdims=True)
    pts = []
    p = loc.copy(); v = nrm * 0.25 + rng.normal(0, 0.6, (N, 3)); v /= np.linalg.norm(v, axis=1, keepdims=True)
    for i in range(npts):
        pts.append(p.copy())
        v = v + rng.normal(0, 0.55, (N, 3)) - (p / np.array([BUD_R, BUD_R, BUD_L * 0.5])) * 0.12
        v /= np.linalg.norm(v, axis=1, keepdims=True); p = p + v * rng.uniform(0.15, 0.35, (N, 1))
    P = np.stack(pts, 1).reshape(-1, 3) @ Mq.T + centre
    crv = bpy.data.hair_curves.new('cotton'); crv.add_curves([npts] * N)
    crv.attributes['position'].data.foreach_set('vector', P.astype(np.float32).ravel())
    ra = crv.attributes.new('radius', 'FLOAT', 'POINT'); ra.data.foreach_set('value', np.full(N * npts, 0.006, np.float32))
    ob = bpy.data.objects.new('cotton', crv); sc.collection.objects.link(ob)
    hm, hnt, hout = mat('fibre'); h = hnt.nodes.new('ShaderNodeBsdfHairPrincipled'); h.parametrization = 'COLOR'
    h.inputs['Color'].default_value = (*((1.0, 0.72, 0.12) if wet else (0.92, 0.92, 0.9)), 1); h.inputs['Roughness'].default_value = 0.5
    h.inputs['Radial Roughness'].default_value = 0.7
    link(hnt, h.outputs[0], hout.inputs[0]); ob.data.materials.append(hm)

# ---------------- light ----------------
def area(name, loc, size, power, color=(1, 1, 1), target=(0, 0, 20)):
    ld = bpy.data.lights.new(name, 'AREA'); ld.shape = 'RECTANGLE'; ld.size = size; ld.size_y = size * 0.6; ld.energy = power; ld.color = color
    ob = bpy.data.objects.new(name, ld); sc.collection.objects.link(ob); ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

# ---------------- cameras ----------------
def place_cam(target, vdir, fh, fs, roll=0.0):
    LENS = 100.0; dist = fh * LENS / 36.0
    camd = bpy.data.cameras.new('cam'); camd.lens = LENS; camd.sensor_fit = 'VERTICAL'; camd.sensor_height = 36; camd.clip_start = 1; camd.clip_end = 1e5
    camd.dof.use_dof = True; camd.dof.focus_distance = dist; camd.dof.aperture_fstop = fs
    cam = bpy.data.objects.new('cam', camd); sc.collection.objects.link(cam)
    v = np.asarray(vdir, float); v /= np.linalg.norm(v)
    loc = Vector(target) + Vector(v) * dist
    q = Vector(-v).to_track_quat('-Z', 'Y')
    cam.matrix_world = mathutils.Matrix.Translation(loc) @ (q.to_matrix().to_4x4() @ mathutils.Matrix.Rotation(math.radians(roll), 4, 'Z'))
    sc.camera = cam

if CAM == 'LAB':
    area('top', (-120, -60, 420), 300, 3.0e6, (1.0, 0.98, 0.95))
    area('win', (-300, 200, 200), 400, 2.0e6, (0.9, 0.95, 1.0))
    area('back', (60, 260, 120), 160, 6.0e5, (1.0, 1.0, 1.0))
    if LAYER in ('SWAB', 'SWABWET'):
        applicator((6.0, -2.0, 34.0), (0.55, -0.35, 1.0), LAYER == 'SWABWET')
    if LAYER == 'DROP':
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(0, 0, 30)); dr = bpy.context.active_object
        dr.scale = (0.95, 0.95, 1.15); bpy.ops.object.shade_smooth(); assign(dr, dye)
    place_cam((0, 0, 52), (0, -1.0, 0.10), 100.0 * MARGIN, 2.8 / MARGIN)
else:
    # the applicator alone, lit and seen as in one of the skin shots (VIEW), for compositing over those plates
    pass

if CAM == 'SWABCAM':
    # matched to skin_scene's key/fill/rim and each view's camera (direction only; the compositor scales and places it)
    area('key', (-90, 120, 170), 120, 9.0e5, (1.0, 0.95, 0.88), (0, 0, 0))
    area('fill', (140, -60, 120), 160, 1.2e5, (0.97, 0.98, 1.0), (0, 0, 0))
    area('rim', (20, -200, 40), 80, 1.5e5, (1.0, 1.0, 1.0), (0, 0, 0))
    VIEWS = {  # view direction (from target toward camera), held-tool direction (from the bud toward the hand)
        'HOOK': ((0.0, -0.28, 0.96), (0.55, -0.45, 0.70)),
        'APPLY': ((0.17, 0.47, 0.86), (0.60, -0.35, 0.72)),
        'WASH': ((-0.33, -0.57, 0.75), (0.55, -0.20, 0.81)),
    }
    vd, td = VIEWS[VIEW]
    applicator((0, 0, 0), td, LAYER == 'SWABWET')
    if LAYER in ('SWAB', 'SWABWET'):
        # a shadow catcher under the bud: the shadow comes with the sprite
        bpy.ops.mesh.primitive_plane_add(size=120, location=(0, 0, -0.05)); pl = bpy.context.active_object; pl.is_shadow_catcher = True
    fh, fs = {'HOOK': (20.0, 13), 'APPLY': (11.0, 16), 'WASH': (12.0, 16)}[VIEW]  # the skin plates' framing (skin_scene CAMS)
    place_cam((0, 0, 0.0), vd, fh * MARGIN, fs / MARGIN)

sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('wrote', OUT)
