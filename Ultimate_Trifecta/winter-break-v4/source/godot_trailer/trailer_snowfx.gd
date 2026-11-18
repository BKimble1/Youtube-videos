class_name TrailerSnowFx
extends RefCounted
## Trailer-only snow dressing for the V2 cut (named in the delivery notes):
## snow caps on the hide bush, a drift of fresh snow across the path that
## takes footprints and tyre tracks, a snow coat on a runner who has been
## inside the bush, and the clump that drops off an antler.

static var _snow_m: StandardMaterial3D
static var _print_m: StandardMaterial3D
static var _track_m: StandardMaterial3D
static var _print_mesh: QuadMesh


static func snow_mat() -> StandardMaterial3D:
	if _snow_m == null:
		_snow_m = StandardMaterial3D.new()
		_snow_m.albedo_color = Color(0.86, 0.9, 0.97)
		_snow_m.roughness = 0.85
		_snow_m.metallic_specular = 0.35
		_snow_m.rim_enabled = true
		_snow_m.rim = 0.25
	return _snow_m


static func _oval_tex(w: int, h: int, soft: float) -> ImageTexture:
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	for y in h:
		for x in w:
			var u := (float(x) + 0.5) / float(w) * 2.0 - 1.0
			var v := (float(y) + 0.5) / float(h) * 2.0 - 1.0
			# a footprint: a wider toe, a narrower heel
			var wid := lerpf(0.72, 1.0, clampf(0.5 - v * 0.5, 0.0, 1.0))
			var d := sqrt(pow(u / wid, 2.0) + v * v)
			var a := clampf((1.0 - d) / soft, 0.0, 1.0)
			img.set_pixel(x, y, Color(1, 1, 1, a))
	return ImageTexture.create_from_image(img)


static func _tread_tex() -> ImageTexture:
	var img := Image.create(32, 64, false, Image.FORMAT_RGBA8)
	for y in 64:
		for x in 32:
			var u := absf((float(x) + 0.5) / 32.0 * 2.0 - 1.0)
			var edge := clampf((1.0 - u) / 0.25, 0.0, 1.0)
			var tread := 0.75 + 0.25 * signf(sin(float(y) / 64.0 * TAU * 4.0 + float(x) * 0.15))
			img.set_pixel(x, y, Color(tread, tread, tread, edge * 0.92))
	var t := ImageTexture.create_from_image(img)
	return t


static func print_mat() -> StandardMaterial3D:
	if _print_m == null:
		_print_m = StandardMaterial3D.new()
		_print_m.albedo_color = Color(0.36, 0.42, 0.56)
		_print_m.albedo_texture = _oval_tex(32, 64, 0.35)
		_print_m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		_print_m.roughness = 0.6
		_print_m.cull_mode = BaseMaterial3D.CULL_DISABLED
	return _print_m


static func track_mat() -> StandardMaterial3D:
	if _track_m == null:
		_track_m = StandardMaterial3D.new()
		_track_m.albedo_color = Color(0.42, 0.47, 0.57)
		_track_m.albedo_texture = _tread_tex()
		_track_m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		_track_m.roughness = 0.5
		_track_m.cull_mode = BaseMaterial3D.CULL_DISABLED
		_track_m.uv1_scale = Vector3(1, 1, 1)
		_track_m.texture_repeat = true
	return _track_m


## Snow resting on the top of a HideBush's clumps (it shares the bush's
## shaking body so the snow shakes with it).
static func cap_bush(hb: HideBush) -> void:
	var body: Node3D = hb.get("_body")
	if body == null:
		return
	var caps: Array = []
	for c in body.get_children():
		var mi := c as MeshInstance3D
		if mi == null:
			continue
		var msh := mi.mesh as SphereMesh
		if msh == null:
			continue
		if msh.radius < 0.2:
			mi.visible = false      # no blossoms in the snow
			continue
		var cap := MeshInstance3D.new()
		var sm := SphereMesh.new()
		sm.radius = 0.5
		sm.height = 1.0
		sm.radial_segments = 16
		sm.rings = 8
		cap.mesh = sm
		cap.material_override = snow_mat()
		var r := mi.scale.x
		cap.scale = Vector3(r * 0.74, r * 0.42, r * 0.7)
		cap.position = mi.position + Vector3(0.03 * r, mi.scale.y * 0.36, -0.02 * r)
		body.add_child(cap)
		var group: Array = [cap]
		for li in 2:
			var lump := MeshInstance3D.new()
			lump.mesh = sm
			lump.material_override = snow_mat()
			var la := float(li) * 2.4 + r * 3.0
			lump.scale = Vector3(r * 0.36, r * 0.2, r * 0.32)
			lump.position = mi.position + Vector3(cos(la) * r * 0.26, mi.scale.y * 0.3 + 0.02, sin(la) * r * 0.26)
			body.add_child(lump)
			group.append(lump)
		caps.append(group)
	hb.set_meta(&"caps", caps)


## A burst of loose snow (powder and a few lumps) at pos.
static func puff(parent: Node3D, pos: Vector3, size: float, dir: Vector3 = Vector3.UP) -> void:
	for st in [[int(140 * size), 70.0, 0.6, 2.2, 0.026, 1.1], [int(26 * size), 45.0, 1.2, 2.6, 0.07, 0.9]]:
		var p := CPUParticles3D.new()
		p.one_shot = true
		p.explosiveness = 0.85
		p.amount = maxi(4, int(st[0]))
		p.lifetime = float(st[5])
		p.direction = dir
		p.spread = float(st[1])
		p.initial_velocity_min = float(st[2])
		p.initial_velocity_max = float(st[3])
		p.gravity = Vector3(0, -6.5, 0)
		p.damping_min = 0.6
		p.damping_max = 1.6
		p.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
		p.emission_sphere_radius = 0.55 * size
		p.scale_amount_min = 0.6
		p.scale_amount_max = 1.4
		var sm := SphereMesh.new()
		sm.radius = float(st[4])
		sm.height = float(st[4]) * 2.0
		sm.radial_segments = 6
		sm.rings = 3
		p.mesh = sm
		p.material_override = snow_mat()
		p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		parent.add_child(p)
		p.global_position = pos
		p.emitting = true


## A drift of fresh snow lying across the path: an irregular, softly
## feathered patch a few centimetres thick.  Returns the patch record used
## for prints and tracks.
static func make_patch(parent: Node3D, centre: Vector3, rx: float, rz: float, yaw: float, seed_i: int) -> Dictionary:
	var noise := FastNoiseLite.new()
	noise.seed = seed_i
	noise.frequency = 0.9
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var nx := 64
	var nz := 40
	for j in nz + 1:
		for i in nx + 1:
			var u := float(i) / float(nx) * 2.0 - 1.0
			var v := float(j) / float(nz) * 2.0 - 1.0
			var x := u * rx * 1.15
			var z := v * rz * 1.15
			var d := sqrt(pow(x / rx, 2.0) + pow(z / rz, 2.0)) + noise.get_noise_2d(x * 1.3, z * 1.3) * 0.32
			var a := clampf((1.0 - d) / 0.28, 0.0, 1.0)
			var h := 0.012 + 0.03 * a + noise.get_noise_2d(x * 4.0 + 40.0, z * 4.0) * 0.006 * a
			st.set_color(Color(1, 1, 1, a))
			st.set_uv(Vector2(u, v))
			st.add_vertex(Vector3(x, h, z))
	for j in nz:
		for i in nx:
			var k := j * (nx + 1) + i
			st.add_index(k)
			st.add_index(k + 1)
			st.add_index(k + nx + 1)
			st.add_index(k + 1)
			st.add_index(k + nx + 2)
			st.add_index(k + nx + 1)
	st.generate_normals()
	var mi := MeshInstance3D.new()
	mi.mesh = st.commit()
	var m := StandardMaterial3D.new()
	m.vertex_color_use_as_albedo = true
	m.albedo_color = Color(0.8, 0.85, 0.94)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.roughness = 0.85
	m.cast_shadow = false
	mi.material_override = m
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mi)
	mi.global_position = centre
	mi.rotation.y = yaw
	return {"node": mi, "centre": centre, "rx": rx, "rz": rz, "yaw": yaw, "prints": 0, "wheel_prev": {}}


static func inside(pt: Dictionary, p: Vector3, margin: float = 0.85) -> bool:
	var c: Vector3 = pt["centre"]
	var l := (p - c).rotated(Vector3.UP, -float(pt["yaw"]))
	return pow(l.x / (float(pt["rx"]) * margin), 2.0) + pow(l.z / (float(pt["rz"]) * margin), 2.0) < 1.0


## A footprint pressed into the patch at foot position p, heading yaw.
static func add_print(pt: Dictionary, p: Vector3, yaw: float, scale: float = 1.0) -> void:
	if _print_mesh == null:
		_print_mesh = QuadMesh.new()
		_print_mesh.size = Vector2(0.12, 0.21)
	var mi := MeshInstance3D.new()
	mi.mesh = _print_mesh
	mi.material_override = print_mat()
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	(pt["node"] as Node3D).get_parent().add_child(mi)
	mi.global_position = Vector3(p.x, float((pt["centre"] as Vector3).y) + 0.058, p.z)
	mi.rotation = Vector3(-PI * 0.5, yaw, 0)
	mi.scale = Vector3.ONE * scale
	pt["prints"] = int(pt["prints"]) + 1


## The cart's tyres crossing the patch: a tread ribbon behind each wheel
## that is on it, and a spray of snow off the front tyres.
static func track_wheels(pt: Dictionary, parent: Node3D, key: String, wheels: Array, front: Array, speed: float) -> void:
	var prev: Dictionary = pt["wheel_prev"]
	for i in wheels.size():
		var w: Node3D = wheels[i]
		var gp := w.global_position
		var g := Vector3(gp.x, float((pt["centre"] as Vector3).y) + 0.06, gp.z)
		var k := "%s_%d" % [key, i]
		if prev.has(k) and inside(pt, g, 0.95) and (prev[k] as Vector3).distance_to(g) > 0.02:
			var a: Vector3 = prev[k]
			var seg := MeshInstance3D.new()
			var q := QuadMesh.new()
			var ln := a.distance_to(g) + 0.04
			q.size = Vector2(0.21, ln)
			seg.mesh = q
			seg.material_override = track_mat()
			seg.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			parent.add_child(seg)
			seg.global_position = (a + g) * 0.5
			var hd := atan2(-(g.x - a.x), -(g.z - a.z))
			seg.rotation = Vector3(-PI * 0.5, hd, 0)
			if i in front and speed > 2.0 and randf() < 0.55:
				# thrown up at the contact patch and trailing behind the tyre
				puff_trail(parent, g + Vector3(0, 0.015, 0), 0.16, -(g - a).normalized())
		prev[k] = g
	pt["wheel_prev"] = prev


## Snow packed on a runner who has been inside the bush: lumps on the head,
## the antlers and the shoulders, attached to the bones (rest-pose model
## space offsets).  Returns the attachments; the first listed "clump" is
## the one that can drop.
static func coat(v: CharacterView, lumps: Array) -> Array:
	var sk := v.skeleton
	var out: Array = []
	for l in lumps:
		var bone := String(l.get("bone", "head"))
		var bi := sk.find_bone(bone)
		if bi < 0:
			continue
		var ba := BoneAttachment3D.new()
		ba.bone_name = bone
		sk.add_child(ba)
		var holder := Node3D.new()
		holder.transform = sk.get_bone_global_rest(bi).affine_inverse()
		ba.add_child(holder)
		var mi := MeshInstance3D.new()
		var sm := SphereMesh.new()
		sm.radius = 0.5
		sm.height = 1.0
		sm.radial_segments = 12
		sm.rings = 6
		mi.mesh = sm
		if l.has("irregular"):
			mi.mesh = lumpy_mesh(int(l["irregular"]))
		mi.material_override = snow_mat()
		var p: Array = l["pos"]
		var s: Array = l.get("size", [0.08, 0.05, 0.08])
		mi.position = Vector3(float(p[0]), float(p[1]), float(p[2]))
		mi.scale = Vector3(float(s[0]), float(s[1]), float(s[2]))
		mi.rotation.z = float(l.get("roll", 0.0))
		holder.add_child(mi)
		ba.visible = false
		out.append({"att": ba, "mesh": mi, "def": l})
	return out


## An irregular lump of snow (unit size, like a radius-0.5 sphere): a low-poly
## sphere pushed in and out by noise, so a clump reads as packed snow rather
## than a ball.
static func lumpy_mesh(seed_i: int, rough: float = 0.28) -> ArrayMesh:
	var noise := FastNoiseLite.new()
	noise.seed = seed_i
	noise.frequency = 2.2
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var nu := 14
	var nv := 9
	var pts: Array = []
	for j in nv + 1:
		var th := PI * float(j) / float(nv)
		for i in nu + 1:
			var ph := TAU * float(i % nu) / float(nu)
			var d := Vector3(sin(th) * cos(ph), cos(th), sin(th) * sin(ph))
			var r := 0.5 * (1.0 + rough * noise.get_noise_3d(d.x * 1.7, d.y * 1.7, d.z * 1.7) + 0.08 * noise.get_noise_3d(d.x * 6.0 + 9.0, d.y * 6.0, d.z * 6.0))
			# a flatter underside
			if d.y < -0.3:
				r *= lerpf(1.0, 0.7, clampf((-d.y - 0.3) / 0.7, 0.0, 1.0))
			pts.append(d * r)
	for j in nv:
		for i in nu:
			var k := j * (nu + 1) + i
			for idx in [k, k + nu + 1, k + 1, k + 1, k + nu + 1, k + nu + 2]:
				st.add_vertex(pts[idx])
	st.generate_normals()
	return st.commit()


## Loose crumbs around a landed clump (static, scene-time placement).
static func crumbs(parent: Node3D, centre: Vector3, n: int, seed_i: int, size: float = 0.018) -> Array:
	var out: Array = []
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_i
	for i in n:
		var mi := MeshInstance3D.new()
		mi.mesh = lumpy_mesh(seed_i * 7 + i, 0.4)
		mi.material_override = snow_mat()
		var a := rng.randf() * TAU
		var r := rng.randf_range(0.06, 0.1)
		var sz := size * rng.randf_range(0.6, 1.3)
		mi.scale = Vector3(sz, sz * 0.6, sz * rng.randf_range(0.8, 1.2))
		parent.add_child(mi)
		mi.global_position = centre + Vector3(cos(a) * r, sz * 0.25, sin(a) * r)
		mi.rotation.y = rng.randf() * TAU
		out.append(mi)
	return out


## Snow kicked up by a tyre: a low, tight spray from the contact patch,
## thrown back along `back` (opposite the travel) with little rise.
static func puff_trail(parent: Node3D, pos: Vector3, size: float, back: Vector3) -> void:
	var p := CPUParticles3D.new()
	p.one_shot = true
	p.explosiveness = 0.9
	p.amount = maxi(6, int(90 * size))
	p.lifetime = 0.7
	p.direction = (back + Vector3(0, 0.45, 0)).normalized()
	p.spread = 18.0
	p.initial_velocity_min = 1.0
	p.initial_velocity_max = 2.4
	p.gravity = Vector3(0, -7.0, 0)
	p.damping_min = 1.0
	p.damping_max = 2.0
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	p.emission_sphere_radius = 0.05
	p.scale_amount_min = 0.5
	p.scale_amount_max = 1.2
	var sm := SphereMesh.new()
	sm.radius = 0.022
	sm.height = 0.044
	sm.radial_segments = 6
	sm.rings = 3
	p.mesh = sm
	p.material_override = snow_mat()
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(p)
	p.global_position = pos
	p.emitting = true
