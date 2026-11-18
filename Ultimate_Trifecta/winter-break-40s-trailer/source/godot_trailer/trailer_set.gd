class_name TrailerSet
extends RefCounted
## Trailer set dressing, built from the game's own pieces:
##  * the Christmas corner of Puddlesworth Hall's common room, just inside
##    its front door: the season's tree, presents, rug, couch, armchair,
##    lamp, side table with cocoa and cookies, wreath, garland and twinkling
##    string lights (HolidayDecor and DormStage's furniture, the dorm shader),
##  * a pair of front doors in Puddlesworth's real front opening (the game
##    draws the openings without leaves): oak leaves with glazed upper
##    panels, push plates and a glazed transom, swinging out onto the porch,
##  * a towel over a runner's shoulder,
##  * real headlights for a Night Watch cart (two spot lights, soft beams
##    and lens covers that go dark with the switch).
## World coordinates are Moonbrook's (x east, z south).  The front door's
## opening is x -1.6..1.6 in the wall z 103.0..103.5 (outer..inner face).

const DOOR_Z_OUT := 103.0
const DOOR_Z_IN := 103.5
const DOOR_HALF := 1.6
const LEAF_H := 2.62
## DormStage-local coordinates map to the hall by this offset: the
## DormStage back wall (inner face z = -3.475) is Puddlesworth's front wall
## (inner face z = 103.5), both rooms looking north (-Z) at it.
const ROOM_OFF := Vector3(0.0, 0.0, 106.975)


static func _dorm_mat() -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = preload("res://assets/shaders/dorm.gdshader")
	return m


## The Christmas corner.  `parent` gets the meshes and lights; returns the
## bulbs' material (so the director can drive its clock) and the tree light.
static func build_room(parent: Node3D, opts: Dictionary) -> Dictionary:
	var holder := Node3D.new()
	holder.name = "XmasRoom"
	holder.position = ROOM_OFF
	parent.add_child(holder)
	var k := MeshKit.new()
	var wood := Color("8a5a3c", 0.9)
	var wood_d := Color("6e4630", 0.9)
	# the tree (local x is world x): right of the door from inside, by the
	# wall, a touch bigger than the menu room's (the hall is taller)
	var tree_at: Vector3 = opts.get("tree_at", Vector3(3.15, 0.0, -2.75))
	var tree_sc := float(opts.get("tree_scale", 1.18))
	var tk := MeshKit.new()
	HolidayDecor._tree(tk)
	HolidayDecor._presents(tk)
	var tree_node := Node3D.new()
	tree_node.position = tree_at
	tree_node.scale = Vector3.ONE * tree_sc
	holder.add_child(tree_node)
	var tmi := MeshInstance3D.new()
	tmi.mesh = tk.commit()
	tmi.material_override = _dorm_mat()
	tmi.position = -HolidayDecor.TREE
	tree_node.add_child(tmi)
	var bulbs := MeshKit.new()
	HolidayDecor._tree_bulbs(bulbs)
	HolidayDecor._star(bulbs, HolidayDecor.TREE + Vector3(0, HolidayDecor.TREE_TOP + 0.13, 0.0))
	var bmi := MeshInstance3D.new()
	bmi.mesh = bulbs.commit()
	var bulb_mat := ShaderMaterial.new()
	bulb_mat.shader = preload("res://assets/shaders/festive_lights.gdshader")
	bulb_mat.set_shader_parameter("twinkle", 1.0)
	bulb_mat.set_shader_parameter("energy", float(opts.get("bulb_energy", 3.2)))
	bmi.material_override = bulb_mat
	bmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	bmi.position = -HolidayDecor.TREE
	tree_node.add_child(bmi)
	var tl := OmniLight3D.new()
	tl.position = tree_at + Vector3(0.0, 1.3, 0.6)
	tl.light_color = Color(1.0, 0.72, 0.42)
	tl.light_energy = float(opts.get("tree_light", 2.4))
	tl.omni_range = 5.5
	tl.omni_attenuation = 1.3
	tl.shadow_enabled = false
	holder.add_child(tl)
	# the round rug (DormStage's), centred in front of the door
	var rug: Vector3 = opts.get("rug_at", Vector3(0.35, 0.0, 0.3))
	k.ellipse_disc(rug + Vector3(0, 0.024, 0), 3.1, 2.1, Color("2f8f88", 0.8), 40)
	k.ellipse_disc(rug + Vector3(0, 0.026, 0), 2.75, 1.8, Color("f1d9a6", 0.8), 40)
	k.ellipse_disc(rug + Vector3(0, 0.028, 0), 2.3, 1.45, Color("3aa39b", 0.8), 40)
	# couch along the wall, left of the door (DormStage's couch)
	var cx := float(opts.get("couch_x", -4.6))
	var cc := Color("5b6fb3", 0.8)
	var ao := Color("1a120c")
	k.ellipse_disc(Vector3(cx, 0.03, -2.72), 1.6, 0.6, ao, 28)
	k.chamfer_box(Vector3(cx, 0.29, -2.75), Vector3(3.0, 0.44, 1.05), cc.darkened(0.1), 0.06)
	for ci in 2:
		k.chamfer_box(Vector3(cx - 0.67 + 1.34 * float(ci), 0.6, -2.6), Vector3(1.3, 0.2, 0.85), cc, 0.08)
	k.chamfer_box(Vector3(cx, 0.97, -3.18), Vector3(3.0, 0.75, 0.32), cc.darkened(0.05), 0.12)
	for sx in [-1.0, 1.0]:
		k.chamfer_box(Vector3(cx + sx * 1.42, 0.68, -2.72), Vector3(0.28, 0.46, 1.05), cc.darkened(0.12), 0.1)
		k.soft_blob(Vector3(cx + sx * 1.42, 0.91, -2.72), Vector3(0.15, 0.07, 0.52), cc.darkened(0.08), 4, 12)
	k.soft_blob(Vector3(cx - 0.6, 0.86, -2.75), Vector3(0.3, 0.19, 0.11), Color("ffc668", 0.8), 5, 12)
	k.soft_blob(Vector3(cx + 0.6, 0.86, -2.75), Vector3(0.28, 0.18, 0.1), Color("6fd8cc", 0.8), 5, 12)
	# side table with cocoa and cookies between couch and door
	var st := Vector3(cx + 2.05, 0.0, -2.55)
	k.chamfer_box(st + Vector3(0, 0.3, 0), Vector3(0.7, 0.04, 0.5), wood, 0.012)
	for lx in [-1.0, 1.0]:
		for lz in [-1.0, 1.0]:
			k.cylinder(st + Vector3(lx * 0.28, 0.02, lz * 0.19), 0.025, 0.27, wood_d, 8)
	HolidayDecor.cocoa_and_cookies(k, st + Vector3(0.0, 0.32, 0.0))
	# armchair and a floor lamp beyond the tree
	var ac := Vector3(float(opts.get("chair_x", 5.6)), 0.0, -2.2)
	k.ellipse_disc(ac + Vector3(0, 0.03, 0), 0.7, 0.62, ao, 24)
	_armchair(k, ac, 0.5, Color("c46a52", 0.8), wood_d)
	var lamp := ac + Vector3(0.95, 0.0, -0.55)
	k.cylinder(lamp, 0.25, 0.04, Color("2a2d36"), 24, 0.0, true, 0.22)
	k.cylinder(lamp, 0.035, 1.55, Color("2a2d36"), 12)
	k.cylinder(lamp + Vector3(0, 1.5, 0), 0.36, 0.42, Color("ffd9a0"), 28, 1.4, true, 0.22)
	var ll := OmniLight3D.new()
	ll.position = lamp + Vector3(0, 1.75, 0)
	ll.light_color = Color(1.0, 0.74, 0.46)
	ll.light_energy = float(opts.get("lamp_light", 1.8))
	ll.omni_range = 6.0
	ll.omni_attenuation = 1.4
	holder.add_child(ll)
	# wreath over the door, garland along the door head
	HolidayDecor._wreath(k, Vector3(0.0, 3.62, -3.43))
	for i in 25:
		var u := float(i) / 24.0
		var gx := lerpf(-1.85, 1.85, u)
		var gy := 3.16 - 0.16 * sin(u * PI * 2.0) * (1.0 if u < 0.5 else 1.0)
		k.soft_blob(Vector3(gx, gy, -3.42), Vector3(0.1, 0.075, 0.07), Color(HolidayDecor.NEEDLE.lightened(0.05 * float(i % 3)), 0.8), 3, 7)
	var mi := MeshInstance3D.new()
	mi.mesh = k.commit()
	mi.material_override = _dorm_mat()
	holder.add_child(mi)
	# string lights: swags along the front wall either side of the door and
	# along the garland
	var b := MeshKit.new()
	var idx := 0
	for run in [[-9.0, -2.2, 3.55], [2.2, 9.0, 3.55], [-1.85, 1.85, 3.12]]:
		var x0: float = run[0]
		var x1: float = run[1]
		var y_top: float = run[2]
		var spans := maxi(1, int(round((x1 - x0) / 1.5)))
		var sw := (x1 - x0) / float(spans)
		for sp in spans:
			for i in 8:
				var u := (float(i) + 0.5) / 8.0
				HolidayDecor._bulb(b, Vector3(x0 + sw * (float(sp) + u), y_top - 0.24 * sin(u * PI), -3.36),
					HolidayDecor.BULB_COLS[idx % HolidayDecor.BULB_COLS.size()], fmod(float(idx) * 0.3819, 1.0), 0.034)
				idx += 1
	var smi := MeshInstance3D.new()
	smi.mesh = b.commit()
	smi.material_override = bulb_mat
	smi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	holder.add_child(smi)
	return {"bulbs": bulb_mat, "tree_light": tl, "holder": holder}


static func _armchair(k: MeshKit, at: Vector3, yaw: float, cc: Color, feet: Color) -> void:
	var b := Basis(Vector3.UP, yaw)
	var p := func(v: Vector3) -> Vector3: return at + b * v
	k.chamfer_box(p.call(Vector3(0, 0.27, 0)), Vector3(1.0, 0.44, 0.9), cc.darkened(0.1), 0.08)
	k.chamfer_box(p.call(Vector3(0, 0.55, 0.05)), Vector3(0.8, 0.16, 0.75), cc, 0.07)
	k.chamfer_box(p.call(Vector3(0, 0.88, -0.36)), Vector3(1.0, 0.7, 0.26), cc.darkened(0.06), 0.1)
	for sx in [-1.0, 1.0]:
		k.chamfer_box(p.call(Vector3(sx * 0.45, 0.66, 0.0)), Vector3(0.2, 0.36, 0.9), cc.darkened(0.12), 0.08)
		for fz in [-1.0, 1.0]:
			k.cylinder(p.call(Vector3(sx * 0.4, 0.0, fz * 0.36)), 0.045, 0.07, feet, 8)


# ---------------------------------------------------------------------- doors
## The front doors: two leaves hinged at the jambs on the outer face,
## swinging out.  Returns {"L": hinge node, "R": hinge node}.  Angle 0 is
## shut; positive opens outward (onto the porch).
static func build_doors(parent: Node3D) -> Dictionary:
	var mat := _dorm_mat()
	var out := {}
	var oak := Color("7a4a2c", 0.9)
	var oak_d := Color("5a341e", 0.9)
	# glazing: from the porch it glows with the warm room behind it, from
	# inside it shows the night (the dorm shader has no transparency)
	var glass_out := Color("f2c27e", 0.6)
	var glass_in := Color("223154", 0.6)
	var brass := Color("d9b056", 0.6)
	for side in ["L", "R"]:
		var sx := -1.0 if side == "L" else 1.0
		var hinge := Node3D.new()
		hinge.name = "Door" + side
		hinge.position = Vector3(sx * (DOOR_HALF - 0.02), 0.0, DOOR_Z_OUT + 0.09)
		parent.add_child(hinge)
		var k := MeshKit.new()
		var w := DOOR_HALF - 0.05
		var cxl := -sx * w * 0.5    # leaf centre from its hinge
		# stiles, rails and panels
		k.chamfer_box(Vector3(cxl, LEAF_H * 0.5, 0.0), Vector3(w, LEAF_H, 0.07), oak, 0.015)
		k.chamfer_box(Vector3(cxl, 0.55, -0.04), Vector3(w - 0.24, 0.62, 0.02), oak_d, 0.01)
		k.chamfer_box(Vector3(cxl, 0.55, 0.04), Vector3(w - 0.24, 0.62, 0.02), oak_d, 0.01)
		# glazed upper panel (warm light behind it reads from outside), in two lights
		for gi in 2:
			var gx := cxl + (float(gi) - 0.5) * (w - 0.3) * 0.5
			k.box(Vector3(gx, 1.72, -0.041), Vector3((w - 0.36) * 0.5, 1.12, 0.006), glass_out, 0.0, 0.42)
			k.box(Vector3(gx, 1.72, 0.041), Vector3((w - 0.36) * 0.5, 1.12, 0.006), glass_in, 0.0, 0.08)
		k.box(Vector3(cxl, 1.72, -0.042), Vector3(0.05, 1.14, 0.008), oak)
		k.box(Vector3(cxl, 1.72, 0.042), Vector3(0.05, 1.14, 0.008), oak)
		# push plate (inside) and pull handle (outside), by the meeting stile
		var mx := -sx * (w - 0.16)
		k.chamfer_box(Vector3(mx, 1.08, 0.045), Vector3(0.1, 0.32, 0.012), brass, 0.004)
		k.cylinder(Vector3(mx, 0.92, -0.08), 0.018, 0.34, brass, 8)
		var mi := MeshInstance3D.new()
		mi.mesh = k.commit()
		mi.material_override = mat
		hinge.add_child(mi)
		out[side] = hinge
	# transom over the leaves (fixed): frame and glass
	var tk := MeshKit.new()
	tk.box(Vector3(0, LEAF_H + 0.04, DOOR_Z_OUT + 0.09), Vector3(DOOR_HALF * 2.0, 0.08, 0.1), oak)
	tk.box(Vector3(0, (LEAF_H + 3.0) * 0.5 + 0.04, DOOR_Z_OUT + 0.08), Vector3(DOOR_HALF * 2.0 - 0.1, 3.0 - LEAF_H - 0.1, 0.006), Color("f2c27e", 0.6), 0.0, 0.42)
	tk.box(Vector3(0, (LEAF_H + 3.0) * 0.5 + 0.04, DOOR_Z_OUT + 0.1), Vector3(DOOR_HALF * 2.0 - 0.1, 3.0 - LEAF_H - 0.1, 0.006), Color("223154", 0.6), 0.0, 0.08)
	for gx in [-0.8, 0.0, 0.8]:
		tk.box(Vector3(gx, (LEAF_H + 3.0) * 0.5 + 0.04, DOOR_Z_OUT + 0.09), Vector3(0.05, 3.0 - LEAF_H - 0.08, 0.04), oak)
	var tmi := MeshInstance3D.new()
	tmi.mesh = tk.commit()
	tmi.material_override = mat
	parent.add_child(tmi)
	return out


## Door angle at scene time from keys [[tau, deg, ease?], ...].
static func door_angle(ks: Array, t: float) -> float:
	if ks.is_empty():
		return 0.0
	if t <= float(ks[0][0]):
		return float(ks[0][1])
	for i in ks.size() - 1:
		var t0 := float(ks[i][0])
		var t1 := float(ks[i + 1][0])
		if t <= t1:
			var u := clampf((t - t0) / maxf(t1 - t0, 0.0001), 0.0, 1.0)
			var ez := String(ks[i + 1][2]) if (ks[i + 1] as Array).size() > 2 else ""
			u = TrailerPoseMod._ease(u, ez)
			return lerpf(float(ks[i][1]), float(ks[i + 1][1]), u)
	return float(ks[ks.size() - 1][1])


# ---------------------------------------------------------------------- towel
## A beach towel thrown over the left shoulder: draped over the chest bone,
## hanging down the front and the back.  Built in model space at rest and
## parented to the chest with a BoneAttachment3D, so it moves with the body.
static func add_towel(v: CharacterView, col_a: Color, col_b: Color, opts: Dictionary = {}) -> void:
	var sk := v.skeleton
	var bi := sk.find_bone("chest")
	if bi < 0:
		return
	var att := BoneAttachment3D.new()
	att.bone_name = "chest"
	sk.add_child(att)
	var k := MeshKit.new()
	var sx := float(opts.get("x", -0.2))     # left shoulder (model -X)
	var top := float(opts.get("top", 0.86))
	var front_z := float(opts.get("front_z", -0.17))
	var back_z := float(opts.get("back_z", 0.16))
	var wdt := 0.17
	var stripes := 6
	# front panel, back panel (striped), and the fold over the shoulder
	for panel in [[front_z, -1.0], [back_z, 1.0]]:
		var z: float = panel[0]
		var len := 0.42 if z < 0.0 else 0.36
		for s in stripes:
			var y0 := top - len * float(s) / float(stripes)
			var y1 := top - len * float(s + 1) / float(stripes)
			var tilt := 0.06 * float(panel[1])
			k.chamfer_box(Vector3(sx, (y0 + y1) * 0.5, z + tilt * float(s) / float(stripes)), Vector3(wdt, y0 - y1 + 0.004, 0.035),
				col_a if s % 2 == 0 else col_b, 0.01)
	k.chamfer_box(Vector3(sx, top + 0.02, (front_z + back_z) * 0.5), Vector3(wdt + 0.01, 0.05, back_z - front_z + 0.03), col_a, 0.02)
	var mi := MeshInstance3D.new()
	mi.mesh = k.commit()
	var m := StandardMaterial3D.new()
	m.vertex_color_use_as_albedo = true
	m.roughness = 0.95
	mi.material_override = m
	att.add_child(mi)
	# the attachment carries the bone's global pose: undo its rest so the
	# model-space mesh sits on the body at rest
	mi.transform = sk.get_bone_global_rest(bi).affine_inverse()


# ---------------------------------------------------------------------- cart
## Real headlights for a cart: two shadowless spots at the lenses, soft
## beams and lens covers.  Returns a dict the director switches.
static func add_headlights(cv: CartView, opts: Dictionary) -> Dictionary:
	var parts := {"spots": [], "cones": [], "lens": [], "glare": []}
	var energy := float(opts.get("energy", 7.0))
	for hx in [-0.48, 0.48]:
		var sp := SpotLight3D.new()
		sp.light_color = Color(1.0, 0.93, 0.78)
		sp.light_energy = energy
		sp.spot_range = float(opts.get("range", 24.0))
		sp.spot_angle = float(opts.get("angle", 24.0))
		sp.spot_attenuation = 0.8
		sp.spot_angle_attenuation = 1.4
		sp.shadow_enabled = bool(opts.get("shadow", true))
		sp.light_specular = 0.5
		sp.position = Vector3(hx, 0.66, -1.5)
		sp.rotation = Vector3(deg_to_rad(-float(opts.get("tilt", 6.0))), 0.0, 0.0)
		cv.chassis.add_child(sp)
		parts["spots"].append(sp)
		var gl := MeshInstance3D.new()
		var q := QuadMesh.new()
		q.size = Vector2(1.0, 1.0) * float(opts.get("glare_size", 1.3))
		gl.mesh = q
		var gm := ShaderMaterial.new()
		gm.shader = preload("res://src/dev/trailer/trailer_glare.gdshader")
		gm.set_shader_parameter("intensity", float(opts.get("glare", 0.8)))
		gl.material_override = gm
		gl.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		gl.extra_cull_margin = 4.0
		gl.position = Vector3(0, 0, 0.04)
		sp.add_child(gl)
		parts["glare"].append(gm)
		var cone := MeshInstance3D.new()
		var cm := CylinderMesh.new()
		var L := float(opts.get("beam_len", 9.0))
		cm.top_radius = 0.09
		cm.bottom_radius = float(opts.get("beam_radius", 1.9))
		cm.height = L
		cm.radial_segments = 28
		cm.rings = 6
		cm.cap_top = false
		cm.cap_bottom = false
		cone.mesh = cm
		cone.rotation = Vector3(PI * 0.5 - deg_to_rad(float(opts.get("tilt", 6.0))), 0, 0)
		cone.position = Vector3(hx, 0.66, -1.5) + Basis(Vector3.RIGHT, -deg_to_rad(float(opts.get("tilt", 6.0)))) * Vector3(0, 0, -L * 0.5)
		var bm := ShaderMaterial.new()
		bm.shader = preload("res://src/dev/trailer/trailer_beam.gdshader")
		bm.set_shader_parameter("intensity", float(opts.get("beam_glow", 0.16)))
		cone.material_override = bm
		cone.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		cv.chassis.add_child(cone)
		parts["cones"].append(cone)
		var lens := MeshInstance3D.new()
		var sm := SphereMesh.new()
		sm.radius = 0.5
		sm.height = 1.0
		lens.mesh = sm
		lens.scale = Vector3(0.15, 0.13, 0.07)
		lens.position = Vector3(hx, 0.66, -1.445)
		var lm := StandardMaterial3D.new()
		lm.albedo_color = Color(0.85, 0.85, 0.82)
		lm.emission_enabled = true
		lm.emission = Color(1.0, 0.95, 0.8)
		lm.emission_energy_multiplier = 3.0
		lm.roughness = 0.2
		lens.material_override = lm
		cv.chassis.add_child(lens)
		parts["lens"].append(lm)
	parts["energy"] = energy
	parts["glare_i"] = float(opts.get("glare", 0.8))
	parts["glow"] = float(opts.get("beam_glow", 0.16))
	return parts


## level 0..1 (the switch: on 1, off 0; the filaments fade over ~2 frames)
static func set_headlights(parts: Dictionary, level: float) -> void:
	for sp in parts["spots"]:
		(sp as SpotLight3D).light_energy = float(parts["energy"]) * level
		(sp as SpotLight3D).visible = level > 0.001
	for c in parts["cones"]:
		((c as MeshInstance3D).material_override as ShaderMaterial).set_shader_parameter("intensity", float(parts["glow"]) * level)
		(c as MeshInstance3D).visible = level > 0.001
	for gm in parts["glare"]:
		(gm as ShaderMaterial).set_shader_parameter("intensity", float(parts["glare_i"]) * level)
	for lm in parts["lens"]:
		(lm as StandardMaterial3D).emission_energy_multiplier = 3.0 * level
		(lm as StandardMaterial3D).albedo_color = Color(0.85, 0.85, 0.82).lerp(Color(0.32, 0.33, 0.35), 1.0 - level)
