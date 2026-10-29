#!/usr/bin/env python3
"""V3 skin macro plates (Blender Cycles, run with the bpy venv python).

The subject is a patch of a mouse's shaved abdominal skin seen through a macro lens: a curved belly surface (1 unit =
1 mm), a thin skin shell (0.35 mm), a thin abdominal-wall layer under it, and the abdominal organs below (a coiled
small intestine, the caecum, the edge of the liver, the dark cavity between them). White fur grows outside the
shaved area; short stubble and follicle pits inside it. No full animal is modelled.

Optical states of the skin (and the wall under it), inside the shaved area only:
  A  opaque  - ordinary skin: pale pink, diffusing (subsurface scattering), organs hidden
  B  stained - the tartrazine solution just applied: wet, yellow-orange, still opaque
  C  clear   - optically cleared: a red-orange, slightly hazy transmissive layer; organs seen through it
  K  clear, organs blacked out - the skin's own contribution in state C. C - K is the light that came through
     the skin from the organs, which the compositor can move (peristalsis) without moving the skin.
  W / WC / WK - states A / C / K with water beads on the surface (the rinse)

usage: skin_scene.py <cache> <cam> <state> <width> <samples> <out.exr> [margin]
Writes a multilayer EXR with Combined, UV and Depth passes."""
import math, os, sys
import bpy, numpy as np

CACHE, CAM, STATE, WIDTH, SAMPLES, OUT = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
MARGIN = float(sys.argv[7]) if len(sys.argv) > 7 else 1.0  # render this much more field (and pixels) for camera moves in compositing
TEX = os.path.join(CACHE, 'tex')
X0, X1, Y0, Y1 = -22.0, 22.0, -35.0, 35.0
R_ACROSS, R_ALONG = 14.0, 45.0
SKIN_T, WALL_GAP, WALL_T = 0.35, 0.08, 0.22
rng = np.random.default_rng(3)

def S(x, y):  # the belly surface
    return -x * x / (2 * R_ACROSS) - y * y / (2 * R_ALONG)

def normal(x, y):
    n = np.stack([x / R_ACROSS, y / R_ALONG, np.ones_like(x)], -1)
    return n / np.linalg.norm(n, axis=-1, keepdims=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'; sc.unit_settings.scale_length = 0.001
sc.render.engine = 'CYCLES'; cy = sc.cycles
cy.device = 'CPU'; cy.samples = SAMPLES; cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.015
cy.use_denoising = True; cy.denoiser = 'OPENIMAGEDENOISE'
cy.max_bounces = 24; cy.diffuse_bounces = 3; cy.glossy_bounces = 4; cy.transmission_bounces = 16; cy.transparent_max_bounces = 24
cy.caustics_reflective = False; cy.caustics_refractive = False; cy.blur_glossy = 1.0
sc.render.threads_mode = 'AUTO'
WH = (WIDTH, int(round(WIDTH * 16 / 9)))
sc.render.resolution_x, sc.render.resolution_y = WH; sc.render.resolution_percentage = 100
sc.render.film_transparent = False
vl = sc.view_layers[0]; vl.use_pass_uv = True; vl.use_pass_z = True
sc.render.image_settings.media_type = 'MULTI_LAYER_IMAGE'; sc.render.image_settings.file_format = 'OPEN_EXR_MULTILAYER'; sc.render.image_settings.color_depth = '16'
sc.render.image_settings.exr_codec = 'ZIP'

# ---------------- world: a dim, cool lab ----------------
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.26, 0.25, 0.24, 1); bg.inputs[1].default_value = 0.3

# ---------------- helpers ----------------
def mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    return m, nt, out

def img(nt, fn, noncolor=True):
    n = nt.nodes.new('ShaderNodeTexImage')
    n.image = bpy.data.images.load(os.path.join(TEX, fn))
    if noncolor: n.image.colorspace_settings.name = 'Non-Color'
    n.interpolation = 'Cubic'
    return n

def link(nt, a, b): nt.links.new(a, b)

def principled(nt, **kw):
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    for k, v in kw.items():
        if k == 'ssr': p.subsurface_method = v; continue
        p.inputs[k].default_value = v
    return p

def mix(nt, fac, a, b):
    m = nt.nodes.new('ShaderNodeMixShader')
    if isinstance(fac, float): m.inputs[0].default_value = fac
    else: link(nt, fac, m.inputs[0])
    link(nt, a, m.inputs[1]); link(nt, b, m.inputs[2])
    return m

def shadow_pass(nt, shader, tint=(0.98, 0.72, 0.5)):
    """let light through a cleared layer to the organs (glass-shadow trick: shadow rays see it as transparent)"""
    lp = nt.nodes.new('ShaderNodeLightPath'); tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    tr.inputs[0].default_value = (*tint, 1)
    return mix(nt, lp.outputs['Is Shadow Ray'], shader, tr.outputs[0])

def grid_mesh(name, nx, ny, zoff, uv=True):
    xs = np.linspace(X0, X1, nx); ys = np.linspace(Y0, Y1, ny)
    gx, gy = np.meshgrid(xs, ys)
    gz = S(gx, gy) + zoff
    verts = np.column_stack([gx.ravel(), gy.ravel(), gz.ravel()])
    idx = np.arange(nx * ny).reshape(ny, nx)
    faces = np.column_stack([idx[:-1, :-1].ravel(), idx[:-1, 1:].ravel(), idx[1:, 1:].ravel(), idx[1:, :-1].ravel()])
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(verts)); me.vertices.foreach_set('co', verts.astype(np.float32).ravel())
    me.loops.add(faces.size); me.loops.foreach_set('vertex_index', faces.ravel().astype(np.int32))
    me.polygons.add(len(faces)); me.polygons.foreach_set('loop_start', np.arange(0, faces.size, 4, dtype=np.int32))
    me.update(); me.validate()
    if uv:
        uvl = me.uv_layers.new(name='UVMap')
        lv = faces.ravel()
        u = (verts[lv, 0] - X0) / (X1 - X0); v = (verts[lv, 1] - Y0) / (Y1 - Y0)
        uvl.data.foreach_set('uv', np.column_stack([u, v]).astype(np.float32).ravel())
    me.polygons.foreach_set('use_smooth', np.ones(len(faces), bool))
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob)
    return ob

def tube_mesh(name, path, radius, nseg=20):
    """sweep a circle along a polyline (N x 3); UV: u = length along (mm), v = angle (0..1)"""
    P = np.asarray(path, float)
    T = np.gradient(P, axis=0); T /= np.linalg.norm(T, axis=1, keepdims=True)
    up = np.array([0, 0, 1.0])
    N = np.cross(T, up); N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-9
    B = np.cross(T, N)
    rad = np.broadcast_to(radius, (len(P),))
    ang = np.linspace(0, 2 * np.pi, nseg, endpoint=False)
    ring = (np.cos(ang)[None, :, None] * N[:, None, :] + np.sin(ang)[None, :, None] * B[:, None, :]) * rad[:, None, None]
    V = (P[:, None, :] + ring).reshape(-1, 3)
    L = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))])
    faces = []; uvs = []
    for i in range(len(P) - 1):
        for j in range(nseg):
            a, b = i * nseg + j, i * nseg + (j + 1) % nseg
            faces.append([a, b, b + nseg, a + nseg])
            uvs += [(L[i], j / nseg), (L[i], (j + 1) / nseg), (L[i + 1], (j + 1) / nseg), (L[i + 1], j / nseg)]
    me = bpy.data.meshes.new(name); me.from_pydata(V.tolist(), [], faces)
    uvl = me.uv_layers.new(name='UVMap'); uvl.data.foreach_set('uv', np.asarray(uvs, np.float32).ravel())
    me.polygons.foreach_set('use_smooth', np.ones(len(faces), bool))
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob)
    return ob

def ellipsoid(name, c, r, rot_z=0.0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, location=c)
    ob = bpy.context.active_object; ob.name = name; ob.scale = r; ob.rotation_euler[2] = rot_z
    bpy.ops.object.shade_smooth()
    return ob

# ---------------- skin ----------------
CLEAR = STATE in ('C', 'K', 'WC', 'WK')
STAIN = STATE == 'B'
BLACK_ORGANS = STATE in ('K', 'WK')
WET = STATE in ('W', 'WC', 'WK')

def skin_material():
    m, nt, out = mat('skin')
    uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
    alb = img(nt, 'albedo.png', noncolor=False); hgt = img(nt, 'height.png'); rgh = img(nt, 'rough.png'); shv = img(nt, 'shave.png')
    for n in (alb, hgt, rgh, shv): link(nt, uv.outputs[0], n.inputs[0])
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 1.0; bump.inputs['Distance'].default_value = 0.035
    link(nt, hgt.outputs[0], bump.inputs['Height'])
    # the wet film's own gentle unevenness (breaks up reflections of the lights)
    tcw = nt.nodes.new('ShaderNodeTexCoord'); wnz = nt.nodes.new('ShaderNodeTexNoise'); wnz.inputs['Scale'].default_value = 0.35; wnz.inputs['Detail'].default_value = 5
    link(nt, tcw.outputs['Object'], wnz.inputs['Vector'])
    wbump = nt.nodes.new('ShaderNodeBump'); wbump.inputs['Strength'].default_value = 0.6; wbump.inputs['Distance'].default_value = 0.25
    link(nt, wnz.outputs['Fac'], wbump.inputs['Height'])
    op = principled(nt, **{'Subsurface Weight': 1.0, 'Subsurface Radius': (1.0, 0.40, 0.26), 'Subsurface Scale': 0.16,
                           'Specular IOR Level': 0.55, 'IOR': 1.42})
    link(nt, alb.outputs[0], op.inputs['Base Color']); link(nt, rgh.outputs[0], op.inputs['Roughness']); link(nt, bump.outputs[0], op.inputs['Normal'])
    shader = op.outputs[0]
    if STAIN:
        tint = nt.nodes.new('ShaderNodeMix'); tint.data_type = 'RGBA'; tint.blend_type = 'MULTIPLY'; tint.inputs[0].default_value = 0.75
        link(nt, alb.outputs[0], tint.inputs[6]); tint.inputs[7].default_value = (1.0, 0.66, 0.16, 1)
        st = principled(nt, **{'Subsurface Weight': 1.0, 'Subsurface Radius': (1.0, 0.5, 0.25), 'Subsurface Scale': 0.28,
                               'Roughness': 0.35, 'Coat Weight': 1.0, 'Coat Roughness': 0.14, 'Coat IOR': 1.36})
        link(nt, tint.outputs[2], st.inputs['Base Color']); link(nt, bump.outputs[0], st.inputs['Normal']); link(nt, wbump.outputs[0], st.inputs['Coat Normal'])
        shader = mix(nt, shv.outputs[0], shader, st.outputs[0]).outputs[0]
    if CLEAR:
        # cleared: transmissive, red-orange (the dye absorbs blue; blood adds red), a little haze left in the skin
        cl = principled(nt, **{'Base Color': (1.0, 0.84, 0.68, 1), 'Transmission Weight': 1.0, 'Roughness': 0.16, 'IOR': 1.40,
                               'Coat Weight': 0.7, 'Coat Roughness': 0.14})
        link(nt, wbump.outputs[0], cl.inputs['Coat Normal'])
        bump2 = nt.nodes.new('ShaderNodeBump'); bump2.inputs['Strength'].default_value = 0.35; bump2.inputs['Distance'].default_value = 0.035
        link(nt, hgt.outputs[0], bump2.inputs['Height']); link(nt, bump2.outputs[0], cl.inputs['Normal'])
        hz = principled(nt, **{'Base Color': (0.95, 0.45, 0.22, 1), 'Subsurface Weight': 1.0, 'Subsurface Radius': (1.0, 0.4, 0.2),
                               'Subsurface Scale': 0.2, 'Roughness': 0.3, 'Coat Weight': 0.7, 'Coat Roughness': 0.14})
        link(nt, bump2.outputs[0], hz.inputs['Normal'])
        clear = shadow_pass(nt, mix(nt, 0.2, cl.outputs[0], hz.outputs[0]).outputs[0])
        shader = mix(nt, shv.outputs[0], shader, clear.outputs[0]).outputs[0]
    link(nt, shader, out.inputs[0])
    return m

skin = grid_mesh('skin', 241, 381, 0.0)
sol = skin.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = SKIN_T; sol.offset = -1.0; sol.use_even_offset = True
skin.data.materials.append(skin_material())

def wall_material():
    m, nt, out = mat('wall')
    uv = nt.nodes.new('ShaderNodeUVMap'); shv = img(nt, 'shave.png'); link(nt, uv.outputs[0], shv.inputs[0])
    op = principled(nt, **{'Base Color': (0.82, 0.44, 0.40, 1), 'Subsurface Weight': 1.0, 'Subsurface Radius': (1.0, 0.35, 0.25),
                           'Subsurface Scale': 0.4, 'Roughness': 0.4})
    shader = op.outputs[0]
    if CLEAR:
        # the thin muscle wall, cleared too: faint red striations of its fibres
        tc = nt.nodes.new('ShaderNodeTexCoord'); wv = nt.nodes.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'X'
        wv.inputs['Scale'].default_value = 0.045; wv.inputs['Distortion'].default_value = 6.0; wv.inputs['Detail'].default_value = 3
        link(nt, tc.outputs['Object'], wv.inputs['Vector'])
        ramp = nt.nodes.new('ShaderNodeValToRGB'); link(nt, wv.outputs['Fac'], ramp.inputs[0])
        ramp.color_ramp.elements[0].color = (1.0, 0.80, 0.70, 1); ramp.color_ramp.elements[1].color = (0.97, 0.66, 0.56, 1)
        cl = principled(nt, **{'Transmission Weight': 1.0, 'Roughness': 0.12, 'IOR': 1.38})
        link(nt, ramp.outputs[0], cl.inputs['Base Color'])
        shader = mix(nt, shv.outputs[0], shader, shadow_pass(nt, cl.outputs[0]).outputs[0]).outputs[0]
    link(nt, shader, out.inputs[0])
    return m

wall = grid_mesh('wall', 121, 191, -(SKIN_T + WALL_GAP))
sol2 = wall.modifiers.new('sol', 'SOLIDIFY'); sol2.thickness = WALL_T; sol2.offset = -1.0
wall.data.materials.append(wall_material())

# ---------------- organs ----------------
def organ_mat(name, base, rad_scale=0.6, coat=0.6, veins=False, contents=None):
    m, nt, out = mat(name)
    if BLACK_ORGANS:
        p = principled(nt, **{'Base Color': (0, 0, 0, 1), 'Roughness': 1.0, 'Specular IOR Level': 0.0})
        link(nt, p.outputs[0], out.inputs[0]); return m
    uv = nt.nodes.new('ShaderNodeUVMap')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); link(nt, uv.outputs[0], sep.inputs[0])
    col = nt.nodes.new('ShaderNodeRGB'); col.outputs[0].default_value = (*base, 1)
    cur = col.outputs[0]
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.35; nz.inputs['Detail'].default_value = 4
    link(nt, tc.outputs['Object'], nz.inputs['Vector'])
    blot = nt.nodes.new('ShaderNodeMix'); blot.data_type = 'RGBA'; blot.blend_type = 'MULTIPLY'
    link(nt, nz.outputs['Fac'], blot.inputs[0]); link(nt, cur, blot.inputs[6]); blot.inputs[7].default_value = (0.92, 0.85, 0.85, 1)
    cur = blot.outputs[2]
    if contents is not None:
        # chyme in the lumen: darker yellow-brown stretches along the length
        cm = nt.nodes.new('ShaderNodeMath'); cm.operation = 'MULTIPLY'; link(nt, sep.outputs[0], cm.inputs[0]); cm.inputs[1].default_value = 1.0
        cv = nt.nodes.new('ShaderNodeCombineXYZ'); link(nt, cm.outputs[0], cv.inputs[0])
        n2 = nt.nodes.new('ShaderNodeTexNoise'); n2.inputs['Scale'].default_value = 0.16; n2.inputs['Detail'].default_value = 3
        n2.noise_dimensions = '1D'; link(nt, sep.outputs[0], n2.inputs['W'])
        r2 = nt.nodes.new('ShaderNodeMapRange'); r2.inputs[1].default_value = 0.42; r2.inputs[2].default_value = 0.6
        link(nt, n2.outputs['Fac'], r2.inputs[0])
        cmix = nt.nodes.new('ShaderNodeMix'); cmix.data_type = 'RGBA'
        link(nt, r2.outputs[0], cmix.inputs[0]); link(nt, cur, cmix.inputs[6]); cmix.inputs[7].default_value = (*contents, 1)
        cur = cmix.outputs[2]
    if veins:
        # arcade vessels across the gut wall from the mesenteric side (v ~ 0.75), thin dark red, branching
        # a branching vascular network on the serosa: the borders of stretched Voronoi cells, thin and dark red
        sc_uv = nt.nodes.new('ShaderNodeVectorMath'); sc_uv.operation = 'MULTIPLY'; sc_uv.inputs[1].default_value = (0.9, 6.0, 1.0)
        link(nt, uv.outputs[0], sc_uv.inputs[0])
        wn = nt.nodes.new('ShaderNodeTexNoise'); wn.inputs['Scale'].default_value = 1.5; link(nt, sc_uv.outputs[0], wn.inputs['Vector'])
        wd = nt.nodes.new('ShaderNodeVectorMath'); wd.operation = 'MULTIPLY_ADD'; wd.inputs[1].default_value = (0.35, 0.35, 0.0)
        link(nt, wn.outputs['Color'], wd.inputs[0]); link(nt, sc_uv.outputs[0], wd.inputs[2])
        vo = nt.nodes.new('ShaderNodeTexVoronoi'); vo.feature = 'DISTANCE_TO_EDGE'; vo.inputs['Scale'].default_value = 1.0
        link(nt, wd.outputs[0], vo.inputs['Vector'])
        vr = nt.nodes.new('ShaderNodeMapRange'); vr.inputs[1].default_value = 0.035; vr.inputs[2].default_value = 0.0
        link(nt, vo.outputs['Distance'], vr.inputs[0])
        side = nt.nodes.new('ShaderNodeMapRange'); side.inputs[1].default_value = 0.15; side.inputs[2].default_value = 0.6
        dv = nt.nodes.new('ShaderNodeMath'); dv.operation = 'PINGPONG'; dv.inputs[1].default_value = 0.5
        sub = nt.nodes.new('ShaderNodeMath'); sub.operation = 'SUBTRACT'; link(nt, sep.outputs[1], sub.inputs[0]); sub.inputs[1].default_value = 0.25
        link(nt, sub.outputs[0], dv.inputs[0]); link(nt, dv.outputs[0], side.inputs[0])
        inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0; link(nt, side.outputs[0], inv.inputs[1])
        vm = nt.nodes.new('ShaderNodeMath'); vm.operation = 'MULTIPLY'; link(nt, vr.outputs[0], vm.inputs[0]); link(nt, inv.outputs[0], vm.inputs[1])
        vmix = nt.nodes.new('ShaderNodeMix'); vmix.data_type = 'RGBA'
        link(nt, vm.outputs[0], vmix.inputs[0]); link(nt, cur, vmix.inputs[6]); vmix.inputs[7].default_value = (0.42, 0.05, 0.05, 1)
        cur = vmix.outputs[2]
    p = principled(nt, **{'Subsurface Weight': 1.0, 'Subsurface Radius': (1.0, 0.45, 0.32), 'Subsurface Scale': rad_scale,
                          'Roughness': 0.5, 'Coat Weight': coat, 'Coat Roughness': 0.3, 'Coat IOR': 1.36})
    link(nt, cur, p.inputs['Base Color'])
    bn = nt.nodes.new('ShaderNodeTexNoise'); bn.inputs['Scale'].default_value = 3.0; link(nt, tc.outputs['Object'], bn.inputs['Vector'])
    bmp = nt.nodes.new('ShaderNodeBump'); bmp.inputs['Strength'].default_value = 0.15; bmp.inputs['Distance'].default_value = 0.05
    link(nt, bn.outputs['Fac'], bmp.inputs['Height']); link(nt, bmp.outputs[0], p.inputs['Normal'])
    link(nt, p.outputs[0], out.inputs[0])
    return m

TOP = SKIN_T + WALL_GAP + WALL_T + 0.12  # organs start just under the wall

def maze_path(x0, x1, y0, y1, step, seed):
    """a long meandering path over a grid (randomised depth-first walk), smoothed: the packed small-intestine coil"""
    r = np.random.default_rng(seed)
    nx, ny = int((x1 - x0) / step), int((y1 - y0) / step)
    seen = np.zeros((ny, nx), bool)
    cx, cy = nx // 2, ny // 2; path = [(cx, cy)]; seen[cy, cx] = True; stack = [(cx, cy)]
    dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)]; last = (1, 0)
    while stack:
        cx, cy = stack[-1]
        opts = [d for d in dirs if 0 <= cx + d[0] < nx and 0 <= cy + d[1] < ny and not seen[cy + d[1], cx + d[0]]]
        if not opts:
            stack.pop()
            if stack: path.append(stack[-1])
            continue
        w = np.array([3.0 if d == last else 1.0 for d in opts]); d = opts[r.choice(len(opts), p=w / w.sum())]
        last = d; cx, cy = cx + d[0], cy + d[1]; seen[cy, cx] = True; stack.append((cx, cy)); path.append((cx, cy))
    # keep the walk's first visit order only (a single tube does not retrace itself): split where it backtracks
    segs, cur, vis = [], [], set()
    for p in path:
        if p in vis:
            if len(cur) > 3: segs.append(cur)
            cur = [p] if False else []
            continue
        vis.add(p); cur.append(p)
    if len(cur) > 3: segs.append(cur)
    out = []
    for sg in segs:
        jit = r.normal(0, step * 0.26, (nx + 1, ny + 1, 2))
        P = np.array([[x0 + (i + 0.5) * step + jit[i, j, 0], y0 + (j + 0.5) * step + jit[i, j, 1]] for i, j in sg], float)
        for _ in range(5):  # Chaikin smoothing
            Q = np.empty((2 * len(P) - 2, 2)); Q[0::2] = 0.75 * P[:-1] + 0.25 * P[1:]; Q[1::2] = 0.25 * P[:-1] + 0.75 * P[1:]; P = Q
        out.append(P)
    return out

R_GUT = 1.15
gut_m = organ_mat('gut', (0.90, 0.70, 0.64), 0.9, 0.15, veins=True, contents=(0.38, 0.27, 0.16))
LOOPS = [(P, 0.0) for P in maze_path(-12, 12, -24, 11, 2 * R_GUT + 0.12, 5)] + [(P, 1.9) for P in maze_path(-12.6, 12, -24.6, 11, 2 * R_GUT + 0.3, 9)]
for k, (P, deep) in enumerate(LOOPS):
    if len(P) < 8: continue
    x, y = P[:, 0], P[:, 1]
    zc = S(x, y) - TOP - R_GUT - deep - 0.18 * (1 + np.sin(np.arange(len(P)) * 0.13 + k))
    rad = R_GUT * (0.92 + 0.12 * np.sin(np.arange(len(P)) * 0.21 + k * 1.7))
    ob = tube_mesh(f'gut{k}', np.column_stack([x, y, zc]), rad)
    ob.data.materials.append(gut_m)
# caecum: a large curved sac low on the left, darker contents
th = np.linspace(-0.4, 2.6, 80)
cx, cyy = -6.5 + 4.2 * np.cos(th), -17.0 + 3.5 * np.sin(th)
cec = tube_mesh('caecum', np.column_stack([cx, cyy, S(cx, cyy) - TOP - 2.3]), 2.2 * (0.7 + 0.3 * np.sin(np.linspace(0, np.pi, 80))))
cec.data.materials.append(organ_mat('caecum', (0.55, 0.40, 0.26), 0.8, 0.5, veins=True))
# liver: the edge of two lobes at the head end
liv_m = organ_mat('liver', (0.30, 0.07, 0.06), 0.25, 0.9)
for c, r, rz in [((-3.5, 15.5), (7.0, 4.2, 1.6), 0.25), ((4.0, 16.5), (6.5, 4.0, 1.5), -0.3)]:
    ob = ellipsoid('liver', (c[0], c[1], S(c[0], c[1]) - TOP - 1.4), r, rz); ob.data.materials.append(liv_m)
# the dark cavity between and behind the loops
floor = grid_mesh('cavity', 60, 90, -(TOP + 4.6), uv=False)
floor.data.materials.append(organ_mat('cavity', (0.20, 0.06, 0.05), 1.0, 0.2))

# the absorbent pad the animal lies on, far below the curve of the belly
pad_m, nt, out = mat('pad')
pp = principled(nt, **{'Base Color': (0.30, 0.48, 0.62, 1), 'Roughness': 0.85})
pn = nt.nodes.new('ShaderNodeTexNoise'); pn.inputs['Scale'].default_value = 0.6; pb = nt.nodes.new('ShaderNodeBump'); pb.inputs['Strength'].default_value = 0.4
link(nt, pn.outputs['Fac'], pb.inputs['Height']); link(nt, pb.outputs[0], pp.inputs['Normal']); link(nt, pp.outputs[0], out.inputs[0])
bpy.ops.mesh.primitive_plane_add(size=600, location=(0, 0, -16)); bpy.context.active_object.data.materials.append(pad_m)

# ---------------- hair: fur outside the shave, stubble inside ----------------
F = np.load(os.path.join(TEX, 'follicles.npy'))  # x, y, shaved, lie_x, lie_y
def hair_curves(name, roots, dirs, lengths, radii, npts, droop):
    crv = bpy.data.hair_curves.new(name)
    crv.add_curves([npts] * len(roots))
    n = normal(roots[:, 0], roots[:, 1])
    rz = S(roots[:, 0], roots[:, 1])
    P0 = np.column_stack([roots, rz]) - n * 0.03
    t = np.column_stack([dirs, np.zeros(len(dirs))]); t -= n * np.sum(t * n, 1, keepdims=True)
    t /= np.linalg.norm(t, axis=1, keepdims=True) + 1e-9
    droop = np.broadcast_to(droop, (len(roots),)); seg = lengths / (npts - 1)
    pos = [P0]
    for i in range(1, npts):
        s = (i - 0.5) / (npts - 1)  # rises from the follicle, then lies over toward the tail
        d = n * np.cos(droop * s)[:, None] + t * np.sin(droop * s)[:, None]
        pos.append(pos[-1] + d * seg[:, None])
    P = np.stack(pos, 1).reshape(-1, 3)
    crv.attributes['position'].data.foreach_set('vector', P.astype(np.float32).ravel())
    ra = crv.attributes.new('radius', 'FLOAT', 'POINT')
    taper = np.linspace(1.0, 0.25, npts)
    ra.data.foreach_set('value', (radii[:, None] * taper[None, :]).astype(np.float32).ravel())
    ob = bpy.data.objects.new(name, crv); sc.collection.objects.link(ob)
    return ob

def hair_mat(name, tint=(1, 1, 1)):
    m, nt, out = mat(name)
    h = nt.nodes.new('ShaderNodeBsdfHairPrincipled'); h.parametrization = 'MELANIN'
    h.inputs['Melanin'].default_value = 0.03; h.inputs['Roughness'].default_value = 0.28
    h.inputs['Radial Roughness'].default_value = 0.4; h.inputs['Coat'].default_value = 0.0
    h.inputs['Tint'].default_value = (*tint, 1)
    link(nt, h.outputs[0], out.inputs[0])
    return m

stain_tint = (1.0, 0.78, 0.35) if (STAIN or CLEAR) else (1, 1, 1)
sh = F[F[:, 2] > 0.6]
sh = sh[rng.random(len(sh)) < 0.6]
L = rng.uniform(0.03, 0.14, len(sh))
stub = hair_curves('stubble', sh[:, :2], sh[:, 3:5], L, np.full(len(sh), 0.0055), 4, np.full(len(sh), 1.25))
stub.data.materials.append(hair_mat('stubm', stain_tint))
fu = F[F[:, 2] < 0.4]
fu = fu[(np.abs(fu[:, 0]) < 17) & (fu[:, 1] > -32) & (fu[:, 1] < 26)]
reps = 4
roots = np.repeat(fu[:, :2], reps, 0) + rng.normal(0, 0.12, (len(fu) * reps, 2))
lie = np.repeat(fu[:, 3:5], reps, 0) + rng.normal(0, 0.15, (len(fu) * reps, 2))
# the clipped edge: fur near the shave border is cut short, raggedly
shv = F[:, 2]
from scipy.spatial import cKDTree
tree = cKDTree(F[F[:, 2] > 0.5][:, :2]); dist, _ = tree.query(roots)
fl = np.where(dist < 0.6, rng.uniform(0.6, 2.5, len(roots)), rng.uniform(4.0, 7.0, len(roots)))
fur = hair_curves('fur', roots, lie, fl, np.full(len(roots), 0.009), 7, rng.uniform(1.15, 1.45, len(roots)))
fur.data.materials.append(hair_mat('furm'))

# ---------------- water beads (rinse states) ----------------
if WET:
    from mathutils import Vector
    wm, nt, out = mat('water')
    p = principled(nt, **{'Base Color': (1, 1, 1, 1), 'Transmission Weight': 1.0, 'Roughness': 0.0, 'IOR': 1.333})
    link(nt, shadow_pass(nt, p.outputs[0], (1, 1, 1)).outputs[0], out.inputs[0])  # light reaches the skin under the bead
    # beads sitting on the skin (a flattened cap whose base just meets the surface): the skin is seen through them
    bx = rng.uniform(-9, 9, 420); byy = rng.uniform(-20, 12, 420)
    keep = (bx / 9.0) ** 2 + ((byy + 1) / 18) ** 2 < 1
    for x, y in zip(bx[keep], byy[keep]):
        r = rng.uniform(0.06, 0.26) if rng.random() < 0.85 else rng.uniform(0.3, 0.45)
        n = normal(np.array([x]), np.array([y]))[0]
        hz = r * 0.55
        c = np.array([x, y, S(x, y)]) + n * (0.02)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=c)
        ob = bpy.context.active_object; ob.scale = (r, r * rng.uniform(0.85, 1.15), hz); bpy.ops.object.shade_smooth()
        ob.rotation_euler = Vector(n).to_track_quat('Z', 'Y').to_euler()
        # keep only the upper half: a cap on the surface
        bm_me = ob.data
        for v in bm_me.vertices:
            if v.co.z < 0: v.co.z = 0.0
        ob.data.materials.append(wm)

# ---------------- light: a large soft key from the head end/left, a cool fill, a rim ----------------
def area(name, loc, size, power, color=(1, 1, 1), sx=None):
    ld = bpy.data.lights.new(name, 'AREA'); ld.shape = 'RECTANGLE'; ld.size = size; ld.size_y = sx or size * 0.6
    ld.energy = power; ld.color = color
    ob = bpy.data.objects.new(name, ld); sc.collection.objects.link(ob); ob.location = loc
    d = -np.asarray(loc, float); d /= np.linalg.norm(d)
    ob.rotation_euler = _look(d)
    return ob

def _look(d):
    from mathutils import Vector
    return Vector(d).to_track_quat('-Z', 'Y').to_euler()

area('key', (-90, 120, 170), 120, 9.0e5, (1.0, 0.95, 0.88))
area('fill', (140, -60, 120), 160, 1.2e5, (0.97, 0.98, 1.0))
area('rim', (20, -200, 40), 80, 1.5e5, (1.0, 1.0, 1.0))

# ---------------- cameras ----------------
CAMS = {
    # name: target (x, y), view direction tilt from the surface normal (deg) toward azimuth (deg), roll, field height (mm), f-stop
    'HOOK':  dict(t=(4.4, -3.0), tilt=16, az=-90, roll=-4, fh=20.0, fs=13),
    'SIDE':  dict(t=(-2.5, -4.0), tilt=58, az=180, roll=0, fh=13.0, fs=16),
    'GRAZE': dict(t=(1.0, -6.0), tilt=68, az=-30, roll=0, fh=8.0, fs=10),
    'APPLY': dict(t=(3.5, 1.0), tilt=30, az=20, roll=8, fh=11.0, fs=16),
    'WIDE':  dict(t=(0.5, -5.0), tilt=38, az=-100, roll=0, fh=24.0, fs=22),
    'WASH':  dict(t=(-1.0, -6.0), tilt=42, az=-120, roll=-6, fh=12.0, fs=16),
}
cfg = CAMS[CAM]
tx, ty = cfg['t']; tz = S(tx, ty)
n = normal(np.array([tx]), np.array([ty]))[0]
a = math.radians(cfg['az']); tl = math.radians(cfg['tilt'])
# tangent direction toward the azimuth, then tilt the view axis away from the normal toward it
tdir = np.array([math.cos(a), math.sin(a), 0.0]); tdir -= n * tdir.dot(n); tdir /= np.linalg.norm(tdir)
vdir = n * math.cos(tl) + tdir * math.sin(tl)
LENS = 300.0
dist = cfg['fh'] * MARGIN * LENS / 36.0
camd = bpy.data.cameras.new('cam'); camd.lens = LENS; camd.sensor_width = 36; camd.sensor_fit = 'VERTICAL'; camd.sensor_height = 36
camd.clip_start = 1; camd.clip_end = 5000
camd.dof.use_dof = True; camd.dof.focus_distance = dist; camd.dof.aperture_fstop = cfg['fs'] / MARGIN  # same blur in pixels as the unmargined framing
cam = bpy.data.objects.new('cam', camd); sc.collection.objects.link(cam)
cam.location = (tx + vdir[0] * dist, ty + vdir[1] * dist, tz + vdir[2] * dist)
from mathutils import Vector
q = Vector(-vdir).to_track_quat('-Z', 'Y')
cam.rotation_euler = q.to_euler()
cam.rotation_mode = 'XYZ'
# roll about the view axis
import mathutils
cam.matrix_world = mathutils.Matrix.Translation(cam.location) @ (q.to_matrix().to_4x4() @ mathutils.Matrix.Rotation(math.radians(cfg['roll']), 4, 'Z'))
sc.camera = cam

sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('wrote', OUT)
