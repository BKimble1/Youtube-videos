extends Node3D
## Development-only (src/dev is never exported): the Season 1 · Winter Break
## launch trailer's in-engine shots.  Everything on screen is the game's own
## art and code: Moonbrook College (ClassicBuilder), the night environment
## (EnvFactory), the skinned characters and their animation graph
## (CharacterView), the Night Watch's flashlight, the carts (CartView), the
## splash effects (Fx), rifts, power-up holograms, hiding bushes, coins and
## the holiday dorm (DormStage + HolidayDecor).  Instead of a simulation,
## each actor follows a choreographed timeline (TrailerShots) through the
## same apply_state() path gameplay uses, and a keyframed camera films it.
##
## Trailer-only dressing (named so in the delivery notes): falling snow over
## the campus, the game's holiday string lights / tree / wreaths placed
## outdoors, and the green guide-arrow path of the final chase.
##
## Render one shot with Movie Maker at a fixed clock:
##   xvfb-run tools/gd.sh --path game --resolution 3840x2160 --write-movie OUT/frame.png --fixed-fps 60 \
##     res://src/dev/trailer/trailer.tscn -- --shot=ID --events=OUT/events.json
## The first PRE frames are a black warm-up (3D off) and are trimmed in the
## edit; frames PRE .. PRE + duration * 60 - 1 are the shot.
## Blocking stills (no movie): --stills=0,0.5,1.0 --stills-dir=DIR

var FPS := 60.0
const PRE := 30

var shot_id := ""
var shot: Dictionary = {}
var frame := 0
var dur_frames := 60
var cam: Camera3D
var env: Environment
var layout: CampusLayout
var water_nodes: Dictionary = {}
var fx: Fx
var actors: Dictionary = {}       # id -> state dict
var carts: Dictionary = {}        # id -> state dict
var props: Dictionary = {}        # id -> state dict
var snow_mat: ShaderMaterial
var arrow_mats: Array = []
var arrow_defs: Array = []
var bulbs_mats: Array = []
var stills: Array = []
var stills_dir := ""
var _grab := ""
var events: Array = []
var events_path := ""
var tau := 0.0
var t_out := 0.0
var _cam_keys: Array = []
var _dorm: DormStage
var _cam_attr: CameraAttributesPractical
var _lights: Array = []
var _focus_mat: ShaderMaterial
var _flash_node: MeshInstance3D
var cli_opts: Dictionary = {}
var _aims: Array = []
var _scout: Array = []
var _doors: Dictionary = {}
var _patches: Array = []
var _glass_mat: ShaderMaterial
var _glass_spill: SpotLight3D
var _ground: TrailerGround
var _auto_ground := false


## A footprint where the planted foot (the lower one) is, if it is on a drift.
func _print_step(v: CharacterView, yaw: float, sc: float) -> void:
	var sk := v.skeleton
	var best := Vector3.ZERO
	var by := INF
	for bn in ["foot.L", "foot.R"]:
		var bi := sk.find_bone(bn)
		if bi < 0:
			continue
		var gp: Vector3 = sk.global_transform * sk.get_bone_global_pose(bi).origin
		if gp.y < by:
			by = gp.y
			best = gp
	for pt in _patches:
		if TrailerSnowFx.inside(pt, best):
			TrailerSnowFx.add_print(pt, best + Vector3(0, 0, 0) - Basis(Vector3.UP, yaw) * Vector3(0, 0, -0.04), yaw, sc)
			_ev("print", String(v.name), best)


## Snow coat: shows from its time; the drop lump leaves its bone and falls
## so that it lands on the floor exactly at t_land (scene time).
func _update_coat(id: String, v: CharacterView, a: Dictionary) -> void:
	var sc: Dictionary = a["def"]["snowcoat"]
	var on := tau >= float(sc.get("t", 0.0))
	var parts: Array = v.get_meta(&"snowcoat")
	var drop: Dictionary = sc.get("drop", {})
	for i in parts.size():
		var pr: Dictionary = parts[i]
		var ba: Node3D = pr["att"]
		var mi: MeshInstance3D = pr["mesh"]
		ba.visible = on
		if i != int(drop.get("idx", -1)) or drop.is_empty():
			continue
		var t_land := float(drop["t_land"])
		var floor_y := float(drop.get("floor", 0.0))
		if _auto_ground and drop.has("land"):
			var la0: Array = drop["land"]
			floor_y = _ground.height(float(la0[0]), float(la0[1]), 0.5)
		var g := 9.0
		if not pr.has("fall"):
			var wp := mi.global_position
			var t_need := sqrt(2.0 * maxf(wp.y - floor_y - 0.02, 0.0) / g)
			if on and tau >= t_land - t_need:
				var holder := Node3D.new()
				add_child(holder)
				var gt := mi.global_transform
				mi.get_parent().remove_child(mi)
				holder.add_child(mi)
				mi.global_transform = gt
				pr["fall"] = {"t0": t_land - t_need, "p0": wp, "drift": Vector3(float(drop.get("dx", 0.04)), 0, float(drop.get("dz", 0.0)))}
				_ev("snow_drop", id, wp)
		if pr.has("fall"):
			var f: Dictionary = pr["fall"]
			var tt := maxf(tau - float(f["t0"]), 0.0)
			var p0: Vector3 = f["p0"]
			var y := p0.y - 0.5 * g * tt * tt
			var tl := t_land - float(f["t0"])
			var landed := y <= floor_y + 0.02 or tau >= t_land
			var pos := p0 + (f["drift"] as Vector3) * minf(tt, tl)
			if drop.has("land"):
				var la: Array = drop["land"]
				var uu := clampf(tt / maxf(tl, 0.001), 0.0, 1.0)
				pos.x = lerpf(p0.x, float(la[0]), uu)
				pos.z = lerpf(p0.z, float(la[1]), uu)
			pos.y = maxf(y, floor_y + 0.02)
			mi.global_position = pos
			mi.rotation.x = minf(tt, tl) * 5.0
			if landed:
				var ls: Array = drop.get("land_size", [0.13, 0.04, 0.11])
				mi.scale = Vector3(float(ls[0]), float(ls[1]), float(ls[2]))
				mi.rotation = Vector3(0, float(drop.get("land_yaw", 0.0)), 0)
				mi.global_position = Vector3(pos.x, floor_y + float(ls[1]) * 0.3, pos.z)
				if not pr.has("landed"):
					pr["landed"] = true
					_ev("snow_land", id, mi.global_position)
					if int(drop.get("crumbs", 0)) > 0:
						TrailerSnowFx.crumbs(self, Vector3(pos.x, floor_y, pos.z), int(drop["crumbs"]), 5)
					if float(drop.get("puff", 0.12)) > 0.0:
						TrailerSnowFx.puff(self, mi.global_position + Vector3(0, 0.02, 0), float(drop.get("puff", 0.12)))
var _room: Dictionary = {}


## A shot setting, overridable from the command line (--opt=key:value).
func _opt(key: String, def: Variant) -> Variant:
	if cli_opts.has(key):
		return cli_opts[key]
	return shot.get(key, def)


func _ready() -> void:
	process_priority = -100
	process_mode = Node.PROCESS_MODE_ALWAYS
	for a in OS.get_cmdline_user_args():
		var s := String(a)
		if s.begins_with("--shot="):
			shot_id = s.get_slice("=", 1)
		elif s.begins_with("--stills="):
			for v in s.get_slice("=", 1).split(","):
				stills.append(float(v))
		elif s.begins_with("--stills-dir="):
			stills_dir = s.get_slice("=", 1)
		elif s.begins_with("--events="):
			events_path = s.get_slice("=", 1)
		elif s.begins_with("--opt="):
			var kv := s.get_slice("=", 1).split(":")
			cli_opts[kv[0]] = str_to_var(kv[1]) if str_to_var(kv[1]) != null else kv[1]
	shot = TrailerShots.get_shot(shot_id)
	if shot_id == "scout":
		var vf := String(cli_opts.get("views", ""))
		_scout = JSON.parse_string(FileAccess.get_file_as_string(vf))
		shot["dur"] = float(_scout.size() * 4) / 60.0
	FPS = float(cli_opts.get("fps", 60.0))
	if shot.is_empty():
		printerr("TRAILER unknown shot ", shot_id)
		get_tree().quit(2)
		return
	dur_frames = int(round(float(shot.get("dur", 1.0)) * FPS))
	if stills_dir != "":
		DirAccess.make_dir_recursive_absolute(stills_dir)
	# no sound effects from the engine: the trailer's sound is designed in the mix
	for b in AudioServer.bus_count:
		AudioServer.set_bus_mute(b, true)
	QualityPreset.apply(QualityPreset.STANDARD)
	var ms := int(_opt("msaa", 2))
	get_viewport().msaa_3d = {0: Viewport.MSAA_DISABLED, 2: Viewport.MSAA_2X, 4: Viewport.MSAA_4X, 8: Viewport.MSAA_8X}.get(ms, Viewport.MSAA_2X)
	get_viewport().screen_space_aa = Viewport.SCREEN_SPACE_AA_FXAA if bool(_opt("fxaa", false)) else Viewport.SCREEN_SPACE_AA_DISABLED
	get_viewport().mesh_lod_threshold = float(_opt("lod", 1.0))
	var world := String(shot.get("world", "campus"))
	if world == "dorm":
		_build_dorm()
	else:
		_build_campus()
	if bool(shot.get("xmas_room", false)):
		_room = TrailerSet.build_room(self, shot.get("room_opts", {}))
	if shot.has("doors"):
		_doors = TrailerSet.build_doors(self)
	if shot.has("glass_sweep"):
		var gq := MeshInstance3D.new()
		var qm := QuadMesh.new()
		qm.size = Vector2(3.0, 1.12)
		gq.mesh = qm
		_glass_mat = ShaderMaterial.new()
		_glass_mat.shader = preload("res://src/dev/trailer/trailer_glass.gdshader")
		gq.material_override = _glass_mat
		gq.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(gq)
		gq.position = Vector3(0.0, 1.72, TrailerSet.DOOR_Z_OUT + 0.09 + 0.052)
		gq.rotation.y = PI
		_glass_spill = SpotLight3D.new()
		_glass_spill.light_color = Color(1.0, 0.93, 0.8)
		_glass_spill.spot_range = 9.0
		_glass_spill.spot_angle = 38.0
		_glass_spill.spot_attenuation = 0.9
		_glass_spill.shadow_enabled = true
		add_child(_glass_spill)
	fx = Fx.new()
	add_child(fx)
	fx.warm()
	cam = Camera3D.new()
	cam.near = float(shot.get("near", 0.08))
	cam.far = 1500.0
	cam.keep_aspect = Camera3D.KEEP_HEIGHT
	add_child(cam)
	cam.current = true
	if shot.has("dof"):
		_cam_attr = CameraAttributesPractical.new()
		cam.attributes = _cam_attr
	if bool(_opt("snow", world == "campus")):
		_build_snow()
	if bool(shot.get("festive", world == "campus")):
		_build_festive()
	for ad in shot.get("arrows", []):
		_build_arrows(ad)
	for ld in shot.get("lights", []):
		_add_light(ld)
	for pd in shot.get("props", []):
		_build_prop(pd)
	_auto_ground = bool(shot.get("auto_ground", false))
	if _auto_ground:
		_ground = TrailerGround.new()
		_ground.setup(self)
	for cd in shot.get("carts", []):
		_build_cart(cd)
	for ad2 in shot.get("actors", []):
		_build_actor(ad2)
	_cam_keys = shot.get("cam", [])
	if bool(shot.get("far", false)):
		_set_ranges(self)
	RenderingServer.frame_post_draw.connect(_on_post_draw)
	RenderingServer.frame_pre_draw.connect(_on_pre_draw)
	printerr("TRAILER shot=%s dur=%.2fs frames=%d (+%d warm-up)" % [shot_id, float(shot.get("dur", 1.0)), dur_frames, PRE])


# ------------------------------------------------------------------ worlds
func _build_campus() -> void:
	var we := EnvFactory.make_environment(1)
	env = we.environment
	_tune_env()
	add_child(we)
	var moon := EnvFactory.make_moon(1)
	moon.directional_shadow_max_distance = float(_opt("shadow_dist", 70.0))
	moon.light_energy *= float(shot.get("moon", 1.0))
	moon.shadow_enabled = bool(_opt("shadows", true))
	add_child(moon)
	layout = CampusMaps.layout("classic")
	var root := Node3D.new()
	root.name = "Campus"
	add_child(root)
	var b := ClassicBuilder.new(ClassicLayout.shared())
	b.build_visuals(root, 1)
	water_nodes = b.water_nodes
	_focus_mat = b.foliage_material
	if _focus_mat:
		_focus_mat.set_shader_parameter("focus", Vector4.ZERO)
	# tonight's waters (the round's three targets glow "active")
	for wid in shot.get("active_waters", []):
		if water_nodes.has(wid):
			(water_nodes[wid]["mat"] as ShaderMaterial).set_shader_parameter("active", 1.0)
	for wid2 in shot.get("beacons", []):
		_water_beacon(String(wid2))
	if shot.has("home_doors"):
		var hd := HomeDoorsView.new()
		add_child(hd)
		hd.setup(String(shot["home_doors"]))
		hd.set_state(2, false)
		props["home_doors"] = {"node": hd, "def": {}}


func _build_dorm() -> void:
	_dorm = DormStage.new()
	add_child(_dorm)
	var we := get_tree().root.find_children("*", "WorldEnvironment", true, false)
	if not we.is_empty():
		env = (we[0] as WorldEnvironment).environment
	_tune_env()


func _tune_env() -> void:
	if env == null:
		return
	env.tonemap_exposure *= float(shot.get("exposure", 1.0))
	env.glow_enabled = bool(_opt("glow_on", true))
	env.glow_intensity = float(shot.get("glow", 0.7))
	env.glow_strength = 1.0
	env.glow_hdr_threshold = float(shot.get("glow_threshold", 1.0))
	env.glow_blend_mode = Environment.GLOW_BLEND_MODE_SOFTLIGHT if String(shot.get("glow_mode", "soft")) == "soft" else Environment.GLOW_BLEND_MODE_ADDITIVE
	if shot.has("fog_begin"):
		env.fog_depth_begin = float(shot["fog_begin"])
	if shot.has("fog_end"):
		env.fog_depth_end = float(shot["fog_end"])
	env.adjustment_saturation *= float(shot.get("saturation", 1.0))
	# cinematic extras (Forward+ only): ambient occlusion and volumetric fog
	if bool(_opt("ssao", false)):
		env.ssao_enabled = true
		env.ssao_radius = float(_opt("ssao_radius", 1.2))
		env.ssao_intensity = float(_opt("ssao_int", 1.6))
	if float(_opt("vfog", 0.0)) > 0.0:
		env.volumetric_fog_enabled = true
		env.volumetric_fog_density = float(_opt("vfog", 0.0))
		env.volumetric_fog_albedo = Color(0.75, 0.8, 1.0)
		env.volumetric_fog_length = float(_opt("vfog_len", 60.0))
		env.volumetric_fog_ambient_inject = float(_opt("vfog_amb", 0.0))


func _water_beacon(wid: String) -> void:
	for w in layout.waters:
		if String(w["id"]) != wid:
			continue
		var mi := MeshInstance3D.new()
		var cm := CylinderMesh.new()
		cm.top_radius = 1.6
		cm.bottom_radius = 2.4
		cm.height = 34.0
		cm.cap_top = false
		cm.cap_bottom = false
		cm.radial_segments = 24
		mi.mesh = cm
		var m := ShaderMaterial.new()
		m.shader = preload("res://assets/shaders/glow_add.gdshader")
		m.set_shader_parameter("color", w["color"])
		m.set_shader_parameter("intensity", 0.55)
		m.set_shader_parameter("mode", 1.0)
		m.set_shader_parameter("fade_near", 10.0)
		mi.material_override = m
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		var c: Vector2 = w["center"]
		mi.position = Vector3(c.x, 17.0 + float(w["surface_y"]), c.y)
		add_child(mi)


func _water_info(pos: Vector3) -> Dictionary:
	if layout == null:
		return {}
	var wi := CampusBuilder.water_at(layout, Vector2(pos.x, pos.z))
	if wi < 0:
		return {}
	var wd: Dictionary = layout.waters[wi]
	if not water_nodes.has(wd["id"]):
		return {"color": wd["color"]}
	return {"mat": water_nodes[wd["id"]]["mat"], "center": wd["center"], "color": wd["color"]}


func water_surface(wid: String) -> float:
	for w in layout.waters:
		if String(w["id"]) == wid:
			return float(w["surface_y"])
	return 0.0


func _set_ranges(n: Node) -> void:
	for c in n.get_children():
		var gi := c as GeometryInstance3D
		if gi != null:
			gi.visibility_range_end = 0.0
		_set_ranges(c)


# ------------------------------------------------------------------ dressing
## Snow: N flakes in a box around the camera, positions computed in the
## shader from scene time (trailer_snow.gdshader).
func _build_snow() -> void:
	var n := int(_opt("snow_n", 7000))
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_custom_data = true
	var q := QuadMesh.new()
	q.size = Vector2(2, 2)
	mm.mesh = q
	mm.instance_count = n
	var rng := RandomNumberGenerator.new()
	rng.seed = 1225
	for i in n:
		mm.set_instance_transform(i, Transform3D.IDENTITY)
		mm.set_instance_custom_data(i, Color(rng.randf(), rng.randf(), rng.randf(), rng.randf()))
	var mi := MultiMeshInstance3D.new()
	mi.multimesh = mm
	snow_mat = ShaderMaterial.new()
	snow_mat.shader = preload("res://src/dev/trailer/trailer_snow.gdshader")
	snow_mat.set_shader_parameter("size", float(_opt("snow_size", 0.032)))
	snow_mat.set_shader_parameter("opacity", float(_opt("snow_opacity", 0.8)))
	if shot.has("snow_clip"):
		var sc: Array = shot["snow_clip"]
		snow_mat.set_shader_parameter("clip_min", Vector3(float(sc[0]), float(sc[1]), float(sc[2])))
		snow_mat.set_shader_parameter("clip_max", Vector3(float(sc[3]), float(sc[4]), float(sc[5])))
	mi.material_override = snow_mat
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	mi.custom_aabb = AABB(Vector3(-5000, -5000, -5000), Vector3(10000, 10000, 10000))
	add_child(mi)


## The game's own holiday pieces (HolidayDecor: tree, presents, wreaths,
## bulbs and star, festive_lights.gdshader) placed on the campus, plus
## swagged strings of the same bulbs along the main quad's lamps and the
## front of Puddlesworth Hall.
func _build_festive() -> void:
	var dorm_mat := ShaderMaterial.new()
	dorm_mat.shader = preload("res://assets/shaders/dorm.gdshader")
	var bulb_mat := ShaderMaterial.new()
	bulb_mat.shader = preload("res://assets/shaders/festive_lights.gdshader")
	bulb_mat.set_shader_parameter("twinkle", 1.0)
	bulb_mat.set_shader_parameter("energy", float(_opt("bulb_energy", 4.5)))
	bulbs_mats.append(bulb_mat)
	# the quad's Christmas tree (the dorm tree, scaled up)
	for td in shot.get("trees", [[-13.0, 52.0, 3.4, 0.4]]):
		var tp := Vector3(float(td[0]), 0.0, float(td[1]))
		var sc := float(td[2])
		var k := MeshKit.new()
		HolidayDecor._tree(k)
		HolidayDecor._presents(k)
		var holder := Node3D.new()
		holder.position = tp
		holder.rotation.y = float(td[3])
		holder.scale = Vector3.ONE * sc
		add_child(holder)
		var mi := MeshInstance3D.new()
		mi.mesh = k.commit()
		mi.material_override = dorm_mat
		mi.position = -HolidayDecor.TREE
		holder.add_child(mi)
		var bk := MeshKit.new()
		HolidayDecor._tree_bulbs(bk)
		HolidayDecor._star(bk, HolidayDecor.TREE + Vector3(0, HolidayDecor.TREE_TOP + 0.13, 0.0))
		var bmi := MeshInstance3D.new()
		bmi.mesh = bk.commit()
		bmi.material_override = bulb_mat
		bmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		bmi.position = -HolidayDecor.TREE
		holder.add_child(bmi)
		var tl := OmniLight3D.new()
		tl.position = Vector3(0, 1.2 * sc, 0.0)
		tl.light_color = Color(1.0, 0.78, 0.5)
		tl.light_energy = 2.2
		tl.omni_range = 4.5 * sc
		tl.shadow_enabled = false
		holder.add_child(tl)
	# strings of bulbs: swags between lamp heads and across the quad path,
	# and along Puddlesworth Hall's front
	var b := MeshKit.new()
	var idx := 0
	var lamp_h := float(shot.get("lamp_h", 3.6))
	var west := [Vector2(-2.6, 95.0), Vector2(-2.6, 79.0), Vector2(-2.6, 63.0), Vector2(-2.6, 47.0)]
	var east := [Vector2(2.6, 95.0), Vector2(2.6, 79.0), Vector2(2.6, 63.0), Vector2(2.6, 47.0)]
	for side in [east]:
		for i in side.size() - 1:
			idx = _swag(b, Vector3(side[i].x, lamp_h, side[i].y), Vector3(side[i + 1].x, lamp_h, side[i + 1].y), 0.9, 26, idx)
	# zig-zag canopy over the path, lamp to lamp
	for i in east.size() - 1:
		idx = _swag(b, Vector3(east[i].x, lamp_h, east[i].y), Vector3(-6.5, lamp_h + 0.4, (east[i].y + east[i + 1].y) * 0.5), 0.7, 14, idx)
	# north quad lamps (fountain to tower)
	var north := [Vector2(2.6, 5.0), Vector2(2.6, -11.0)]
	idx = _swag(b, Vector3(north[0].x, lamp_h, north[0].y), Vector3(north[1].x, lamp_h, north[1].y), 0.9, 26, idx)
	# ring of swags around the fountain plaza lamps
	var ring := [Vector2(-12.362, 30.769), Vector2(9.562, 33.899), Vector2(17.0, 24.1), Vector2(12.682, 13.934), Vector2(-10.185, 10.556), Vector2(-17.0, 19.9)]
	for i in ring.size():
		var a2: Vector2 = ring[i]
		var c2: Vector2 = ring[(i + 1) % ring.size()]
		idx = _swag(b, Vector3(a2.x, lamp_h, a2.y), Vector3(c2.x, lamp_h, c2.y), 1.1, 22, idx)
	# Puddlesworth Hall's front: a run along the eaves line and around the door
	var front_z := float(shot.get("hall_front_z", 102.9))
	var eave_y := float(shot.get("hall_eave_y", 10.6))
	for i in 12:
		var x0 := -24.0 + float(i) * 4.0
		idx = _swag(b, Vector3(x0, eave_y, front_z), Vector3(x0 + 4.0, eave_y, front_z), 0.45, 10, idx)
	for i in 8:
		var x1 := -16.0 + float(i) * 4.0
		idx = _swag(b, Vector3(x1, 4.35, front_z - 0.05), Vector3(x1 + 4.0, 4.35, front_z - 0.05), 0.35, 10, idx)
	var mi2 := MeshInstance3D.new()
	mi2.mesh = b.commit()
	mi2.material_override = bulb_mat
	mi2.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi2)
	# wreaths on Puddlesworth Hall's front door (the dorm wreath)
	var wk := MeshKit.new()
	HolidayDecor._wreath(wk, Vector3(0.0, 0.0, 0.0))
	for wp in shot.get("wreaths", [[0.0, 3.9, front_z - 0.12, 1.6]]):
		var wmi := MeshInstance3D.new()
		wmi.mesh = wk.commit() if wmi.mesh == null else wmi.mesh
		wmi.material_override = dorm_mat
		wmi.position = Vector3(float(wp[0]), float(wp[1]), float(wp[2]))
		wmi.scale = Vector3.ONE * float(wp[3])
		wmi.rotation.y = PI
		add_child(wmi)


## A swag of bulbs on a dark wire between two points (catenary-ish sag).
func _swag(b: MeshKit, p0: Vector3, p1: Vector3, sag: float, n: int, idx: int) -> int:
	var cols := HolidayDecor.BULB_COLS
	for i in n:
		var u := (float(i) + 0.5) / float(n)
		var p := p0.lerp(p1, u) - Vector3(0, sag * sin(u * PI), 0)
		b.with(0.0, fmod(float(idx) * 0.3819, 1.0))
		var r := float(_opt("bulb_r", 0.05))
		b.soft_blob(p, Vector3(r, r * 1.3, r), cols[idx % cols.size()], 5, 12)
		idx += 1
	return idx


func _build_arrows(ad: Dictionary) -> void:
	var r := TrailerRoute.make(ad["pts"], 0.2)
	var w := float(ad.get("w", 1.5))
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var y := float(ad.get("y", 0.13))
	var step := 0.25
	var n := int(ceil(r.length / step))
	for i in n:
		var s0 := float(i) * step
		var s1 := minf(r.length, s0 + step)
		var a0 := r.at(s0)
		var a1 := r.at(s1)
		var t0 := r.tangent(s0)
		var t1 := r.tangent(s1)
		var n0 := Vector3(-t0.z, 0, t0.x) * w * 0.5
		var n1 := Vector3(-t1.z, 0, t1.x) * w * 0.5
		var v := [[a0 - n0, Vector2(s0, 0.0)], [a1 - n1, Vector2(s1, 0.0)], [a1 + n1, Vector2(s1, 1.0)],
			[a0 - n0, Vector2(s0, 0.0)], [a1 + n1, Vector2(s1, 1.0)], [a0 + n0, Vector2(s0, 1.0)]]
		for e in v:
			st.set_uv(e[1])
			st.set_normal(Vector3.UP)
			var p: Vector3 = e[0]
			st.add_vertex(Vector3(p.x, y + p.y, p.z))
	var mi := MeshInstance3D.new()
	mi.mesh = st.commit()
	var m := ShaderMaterial.new()
	m.shader = preload("res://src/dev/trailer/trailer_arrows.gdshader")
	m.set_shader_parameter("energy", float(ad.get("energy", 1.0)))
	mi.material_override = m
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)
	arrow_mats.append(m)
	arrow_defs.append(ad)


func _add_light(ld: Dictionary) -> void:
	var l: Light3D
	if String(ld.get("type", "omni")) == "spot":
		var sl := SpotLight3D.new()
		sl.spot_range = float(ld.get("range", 12.0))
		sl.spot_angle = float(ld.get("angle", 30.0))
		l = sl
	else:
		var ol := OmniLight3D.new()
		ol.omni_range = float(ld.get("range", 6.0))
		ol.omni_attenuation = float(ld.get("atten", 1.0))
		l = ol
	var c: Array = ld.get("color", [1.0, 0.85, 0.7])
	l.light_color = Color(float(c[0]), float(c[1]), float(c[2]))
	l.light_energy = float(ld.get("energy", 1.0))
	l.shadow_enabled = bool(ld.get("shadow", false))
	l.light_specular = float(ld.get("spec", 0.3))
	add_child(l)
	var p: Array = ld.get("pos", [0, 3, 0])
	l.position = Vector3(float(p[0]), float(p[1]), float(p[2]))
	if ld.has("at"):
		var at: Array = ld["at"]
		l.look_at(Vector3(float(at[0]), float(at[1]), float(at[2])))
	_lights.append({"node": l, "def": ld})


# ------------------------------------------------------------------ props
func _build_prop(pd: Dictionary) -> void:
	var kind := String(pd["kind"])
	var p2: Array = pd.get("pos", [0, 0])
	var pos := Vector3(float(p2[0]), 0.0, float(p2[1]))
	var node: Node3D
	match kind:
		"rift":
			var r := RiftView.new()
			add_child(r)
			r.position = pos
			r.rotation.y = float(pd.get("yaw", 0.0))
			node = r
		"holo":
			var g: int = {"turbo": TC.Gadget.TURBO, "decoy": TC.Gadget.DECOY, "shield": TC.Gadget.SHIELD, "cloak": TC.Gadget.CLOAK}.get(String(pd.get("item", "turbo")), TC.Gadget.TURBO)
			var h := PickupHologram.make(g, 0.0)
			add_child(h)
			h.position = pos
			node = h
		"bush":
			var hb := HideBush.make(Vector2(pos.x, pos.z), 0.0)
			add_child(hb)
			if pd.has("yaw"):
				hb.rotation.y = float(pd["yaw"])
			# staging overrides for a clump (body-local [x, y, z, radius]), before the snow goes on
			if pd.has("clump_xf"):
				var cl0: Array = []
				for chx in (hb.get("_body") as Node3D).get_children():
					if chx is MeshInstance3D and (chx as MeshInstance3D).mesh is SphereMesh and ((chx as MeshInstance3D).mesh as SphereMesh).radius > 0.2:
						cl0.append(chx)
				var cx: Dictionary = pd["clump_xf"]
				for ks in cx:
					var ci2 := int(ks)
					if ci2 < cl0.size():
						var v4: Array = cx[ks]
						var cnx := cl0[ci2] as Node3D
						cnx.position = Vector3(float(v4[0]), float(v4[1]), float(v4[2]))
						cnx.scale = Vector3(float(v4[3]), float(v4[3]) * 0.86, float(v4[3]))
			if bool(pd.get("snowy", false)):
				TrailerSnowFx.cap_bush(hb)
			# a cinematic cut-away for the shot inside the bush: listed clumps
			# (and their snow) not drawn; optionally no shadows from the bush
			var bodyn: Node3D = hb.get("_body")
			var ci := 0
			for ch in bodyn.get_children():
				var chm := ch as MeshInstance3D
				if chm == null:
					continue
				if bool(pd.get("no_shadow", false)):
					chm.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
				ci += 1
			var hide_l: Array = pd.get("hide_clumps", [])
			var clumps: Array = []
			for ch2 in bodyn.get_children():
				if ch2 is MeshInstance3D and (ch2 as MeshInstance3D).mesh is SphereMesh and ((ch2 as MeshInstance3D).mesh as SphereMesh).radius > 0.2 and (ch2 as MeshInstance3D).material_override != TrailerSnowFx.snow_mat():
					clumps.append(ch2)
			for hi in hide_l:
				if int(hi) < clumps.size():
					(clumps[int(hi)] as Node3D).visible = false
			hb.set_meta(&"clumps", clumps)
			for cj in clumps.size():
				var cn2 := clumps[cj] as Node3D
				printerr("BUSHCLUMP %d world %s scale %s" % [cj, str(cn2.global_position), str(cn2.scale)])
			if hb.has_meta(&"caps"):
				var caps: Array = hb.get_meta(&"caps")
				for hi2 in hide_l:
					if int(hi2) < caps.size():
						for cn in (caps[int(hi2)] as Array):
							(cn as Node3D).visible = false
			node = hb
		"snowpatch":
			var pt := TrailerSnowFx.make_patch(self, Vector3(pos.x, float(pd.get("y", 0.0)), pos.z), float(pd.get("rx", 1.6)), float(pd.get("rz", 1.2)),
				float(pd.get("yaw", 0.0)), int(pd.get("seed", 7)))
			_patches.append(pt)
			node = pt["node"]
			node.set_meta(&"ground", true)
		"coins":
			if pd.has("coin_glow"):
				# trailer close-ups: a rounder coin and less glow, so the gold
				# shading and the raised centre read at 4K (the game's coin is
				# built for a phone screen)
				CoinView._mesh = _smooth_coin_mesh()
				var cmat := ShaderMaterial.new()
				cmat.shader = preload("res://src/dev/trailer/trailer_coin.gdshader")
				cmat.set_shader_parameter("glow", float(pd["coin_glow"]))
				CoinView._mat = cmat
			var cv := CoinView.new()
			add_child(cv)
			var list: Array = []
			for i in (pd["pts"] as Array).size():
				var c: Array = pd["pts"][i]
				list.append({"id": i, "x": float(c[0]), "z": float(c[1])})
			cv.setup(list)
			if pd.has("coin_glow") and CoinView._spark_mat:
				CoinView._spark_mat.albedo_texture = Fx.soft_texture()
				CoinView._spark_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
			node = cv
		_:
			return
	props[String(pd.get("id", kind + str(props.size())))] = {"node": node, "def": pd, "done": {}}


func _update_props() -> void:
	var i := 0
	for id in props:
		var pr: Dictionary = props[id]
		var pd: Dictionary = pr["def"]
		var node: Node3D = pr["node"]
		var done: Dictionary = pr["done"] if pr.has("done") else {}
		match String(pd.get("kind", "")):
			"rift":
				var r := node as RiftView
				var open_t := float(pd.get("open_t", -99.0))
				var close_t := float(pd.get("close_t", 99.0))
				r.set_open(tau >= open_t and tau < close_t)
			"holo":
				var h := node as PickupHologram
				h.animate(tau, i, false)
				if tau >= float(pd.get("take_t", 99.0)) and not done.has("take"):
					done["take"] = true
					h.visible = false
					fx.turbo(h.global_position + Vector3(0, 0.9, 0))
					_ev("pickup", String(id), h.global_position)
			"bush":
				for rt in pd.get("rustle", []):
					var key := "r%.2f" % float(rt)
					if tau >= float(rt) and not done.has(key):
						done[key] = true
						(node as HideBush).rustle(true)
						_ev("rustle", String(id), node.global_position)
				for pf in pd.get("puffs", []):
					# [tau, size, dir x, dir y, dir z]: loose snow shaken off the bush
					var key3 := "p%.2f" % float(pf[0])
					if tau >= float(pf[0]) and not done.has(key3):
						done[key3] = true
						var dv := Vector3(float(pf[2]), float(pf[3]), float(pf[4])) if (pf as Array).size() > 4 else Vector3.UP
						TrailerSnowFx.puff(self, node.global_position + Vector3(0, 1.0, 0), float(pf[1]), dv)
						_ev("snowpuff", String(id), node.global_position)
				if pd.has("branch"):
					_update_branch(node as HideBush, pd["branch"], pr)
				if pd.has("tremble"):
					# a keyed tremble on top of the game's rustle (amplitude over scene time)
					var amp := _curve(pd["tremble"], tau)
					var body: Node3D = (node as HideBush).get("_body")
					if body and amp > 0.0:
						body.rotation = Vector3(sin(tau * 31.0) * 0.05 * amp, 0, sin(tau * 23.0 + 1.0) * 0.04 * amp)
			"coins":
				for tk in pd.get("take", []):
					var key2 := "c%d" % int(tk[0])
					if tau >= float(tk[1]) and not done.has(key2):
						done[key2] = true
						(node as CoinView).take(int(tk[0]))
						_ev("coin", String(id), node.global_position)
		pr["done"] = done
		i += 1


# ------------------------------------------------------------------ carts
func _build_cart(cd: Dictionary) -> void:
	var cv := CartView.new()
	add_child(cv)
	cv.setup(int(cd.get("index", 0)))
	if cv.engine:
		cv.engine.queue_free()
		cv.engine = null
	var r := TrailerRoute.make(cd["pts"])
	carts[String(cd["id"])] = {"view": cv, "def": cd, "route": r, "yaw": 0.0}
	if cd.has("headlights"):
		carts[String(cd["id"])]["hl"] = TrailerSet.add_headlights(cv, cd.get("hl_opts", {}))
		carts[String(cd["id"])]["hl_prev"] = -1.0


func _cart_state(c: Dictionary, at_tau: float) -> Dictionary:
	var cd: Dictionary = c["def"]
	var r: TrailerRoute = c["route"]
	var t := at_tau - float(cd.get("t0", 0.0))
	var s := float(cd.get("s0", 0.0)) + TrailerRoute.dist(cd["speed"], t)
	var p := r.at(s)
	var tg := r.tangent(s)
	var tg2 := r.tangent(s + 3.0)
	var yaw := atan2(-tg.x, -tg.z)
	var yaw2 := atan2(-tg2.x, -tg2.z)
	var steer := clampf(-wrapf(yaw2 - yaw, -PI, PI) * 2.2, -1.0, 1.0)
	if cd.has("steer_k") and at_tau < float(cd.get("steer_until", 1e9)):
		steer = _curve(cd["steer_k"], at_tau)
	var cy := 0.0
	if _auto_ground:
		cy = _ground.body_height(p.x, p.z, 0.4)
	return {"pos": Vector3(p.x, cy, p.z), "yaw": yaw, "speed": TrailerRoute.speed(cd["speed"], t), "steer": steer,
		"occupied": bool(cd.get("occupied", true)), "slowed": false}


func _update_carts() -> void:
	for id in carts:
		var c: Dictionary = carts[id]
		var rs := _cart_state(c, tau)
		(c["view"] as CartView).apply_state(rs)
		c["rs"] = rs
		for pt in _patches:
			var cvw: CartView = c["view"]
			var fr: Array = []
			for wi in cvw.wheels.size():
				if cvw.wheels[wi].get_parent() in cvw.front_wheels:
					fr.append(wi)
			TrailerSnowFx.track_wheels(pt, self, String(id), cvw.wheels, fr, float(rs["speed"]))
		if c.has("hl"):
			var lv := clampf(_curve(c["def"]["headlights"], tau), 0.0, 1.0)
			TrailerSet.set_headlights(c["hl"], lv)
			var pv := float(c["hl_prev"])
			if pv >= 0.0 and pv > 0.5 and lv <= 0.5:
				_ev("lights_off", String(id), rs["pos"])
			if pv >= 0.0 and pv <= 0.5 and lv > 0.5:
				_ev("lights_on", String(id), rs["pos"])
			c["hl_prev"] = lv


# ------------------------------------------------------------------ actors
const ROLE := {"runner": TC.Role.RUNNER, "watch": TC.Role.PATROL}
const STATE := {"active": TC.PState.ACTIVE, "stumble": TC.PState.STUMBLE, "splash": TC.PState.SPLASHING,
	"captured": TC.PState.CAPTURED, "finished": TC.PState.FINISHED, "cart": TC.PState.IN_CART, "enter": TC.PState.ENTERING,
	"exit": TC.PState.EXITING, "hiding": TC.PState.HIDING}


func _build_actor(ad: Dictionary) -> void:
	var v := CharacterView.new()
	v.lighting = "indoor" if String(shot.get("world", "campus")) == "dorm" else "outdoor"
	v.fx = fx
	v.water_at = _water_info
	add_child(v)
	var look: Dictionary = Cosmetics.DEFAULT.duplicate()
	for k in (ad.get("look", {}) as Dictionary):
		look[k] = ad["look"][k]
	v.setup(int(ROLE.get(String(ad.get("role", "runner")), TC.Role.RUNNER)), look, int(ad.get("slot", actors.size())), "", false, false)
	if v.name_label:
		v.name_label.visible = false
	if ad.has("pose"):
		var pm := TrailerPoseMod.new()
		pm.keys = ad["pose"]
		v.skeleton.add_child(pm)
		v.set_meta(&"pose_mod", pm)
	if ad.has("towel"):
		var tw: Array = ad["towel"]
		TrailerSet.add_towel(v, Color(String(tw[0])), Color(String(tw[1])), ad.get("towel_opts", {}))
	v.ground_fn = func(_p: Vector3) -> float: return float(ad.get("ground_y", 0.0))
	v.terrain_contact = bool(ad.get("terrain", true))
	if _auto_ground:
		# each touch-down samples the drawn surface under that ankle
		v.ground_fn = func(p: Vector3) -> float: return _ground.height(p.x, p.z, p.y + 0.2)
		v.terrain_contact = true
	if bool(cli_opts.get("dumprig", false)):
		var skd := v.skeleton
		for bi2 in skd.get_bone_count():
			var o2 := skd.get_bone_global_rest(bi2).origin
			printerr("BONE %s %.3f %.3f %.3f" % [skd.get_bone_name(bi2), o2.x, o2.y, o2.z])
		for mi2 in v.find_children("*", "MeshInstance3D", true, false):
			var m2 := mi2 as MeshInstance3D
			if m2.visible and m2.mesh:
				printerr("MESH %s %s %s" % [m2.name, m2.get_aabb().position, m2.get_aabb().size])
	if ad.has("snowcoat"):
		v.set_meta(&"snowcoat", TrailerSnowFx.coat(v, ad["snowcoat"]["lumps"]))
	if ad.has("gaze"):
		v.set_meta(&"gaze_idx", TrailerGaze.add(v.face_mesh))
	if v.flashlight and bool(ad.get("beam_rig", false)):
		_beam_rig(v, ad)
	if ad.has("menu_idle"):
		v.set_menu_idle(bool(ad["menu_idle"]))
	if v.flashlight and ad.has("beam"):
		v.flashlight.light_energy = float(ad["beam"])
		v.flashlight.spot_range = 26.0
		if v.beam and v.beam.material_override is ShaderMaterial:
			(v.beam.material_override as ShaderMaterial).set_shader_parameter("intensity", float(ad.get("beam_glow", 0.28)))
	var segs: Array = []
	for sd in ad.get("segs", []):
		var s2: Dictionary = (sd as Dictionary).duplicate()
		if String(s2.get("mode", "route")) == "route":
			s2["route"] = TrailerRoute.make(s2["pts"])
		segs.append(s2)
	actors[String(ad["id"])] = {"view": v, "def": ad, "segs": segs, "snap": true, "seg_i": -1, "done": {}, "phase": -1.0,
		"yaw_s": INF, "pos": Vector3.ZERO, "yaw": 0.0}


## The trailer's flashlight on the Night Watch's own flashlight mount (the
## hand bone's lens holder): a shadow-casting spot, a soft cone and a lens
## glare that flares when the beam points at the camera.
func _beam_rig(v: CharacterView, ad: Dictionary) -> void:
	var holder := v.flashlight.get_parent() as Node3D
	if v.beam and v.beam.material_override is ShaderMaterial:
		(v.beam.material_override as ShaderMaterial).set_shader_parameter("intensity", 0.0)
	v.flashlight.light_energy = 0.0
	var sp := SpotLight3D.new()
	sp.light_color = Color(1.0, 0.93, 0.8)
	sp.light_energy = float(ad.get("beam_energy", 9.0))
	sp.spot_range = 32.0
	sp.spot_angle = float(ad.get("beam_angle", 17.0))
	sp.spot_attenuation = 0.7
	sp.spot_angle_attenuation = 1.6
	sp.shadow_enabled = true
	sp.light_specular = 0.6
	var mount: Node3D = holder
	if ad.has("beam_aim"):
		mount = Node3D.new()
		add_child(mount)
		_aims.append({"node": mount, "holder": holder, "keys": ad["beam_aim"]})
	# a little past the lens, so the flashlight's own model can't shadow its beam
	sp.position = Vector3(0, 0, -float(ad.get("beam_fwd", 0.0)))
	mount.add_child(sp)
	var cone := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = 0.035
	cm.bottom_radius = float(ad.get("beam_radius", 2.4))
	cm.height = 12.0
	cm.radial_segments = 32
	cm.rings = 8
	cm.cap_top = false
	cm.cap_bottom = false
	cone.mesh = cm
	cone.position = Vector3(0, 0, -6.0)
	cone.rotation = Vector3(PI * 0.5, 0, 0)
	var bm := ShaderMaterial.new()
	bm.shader = preload("res://src/dev/trailer/trailer_beam.gdshader")
	bm.set_shader_parameter("intensity", float(ad.get("beam_glow", 0.22)))
	cone.material_override = bm
	cone.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	mount.add_child(cone)
	var gl := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(1.0, 1.0) * float(ad.get("glare_size", 1.6))
	gl.mesh = q
	var gm := ShaderMaterial.new()
	gm.shader = preload("res://src/dev/trailer/trailer_glare.gdshader")
	gm.set_shader_parameter("intensity", float(ad.get("glare", 1.0)))
	gl.material_override = gm
	gl.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	gl.position = Vector3(0, 0, -0.04)
	gl.extra_cull_margin = 4.0
	mount.add_child(gl)
	v.set_meta(&"glare", gl)


## A bigger splash for the hero moments: a crown of drops, a tall spout and
## a mist puff (CPUParticles, so slow motion slows them too).
func _burst(pos: Vector3, size: float) -> void:
	var sets := [
		# amount, spread, vmin, vmax, scale, lifetime, dir
		[int(520 * size), 62.0, 3.0, 6.5, 1.0, 1.3, Vector3.UP],
		[int(220 * size), 16.0, 6.0, 9.5, 1.3, 1.5, Vector3.UP],
		[int(180 * size), 88.0, 1.5, 3.2, 0.8, 0.9, Vector3.UP],
	]
	for st in sets:
		var p := CPUParticles3D.new()
		p.one_shot = true
		p.explosiveness = 0.92
		p.amount = int(st[0])
		p.lifetime = float(st[5])
		p.direction = st[6]
		p.spread = float(st[1])
		p.initial_velocity_min = float(st[2]) * sqrt(size)
		p.initial_velocity_max = float(st[3]) * sqrt(size)
		p.gravity = Vector3(0, -11.0, 0)
		p.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
		p.emission_sphere_radius = 0.35 * size
		p.scale_amount_min = 0.5 * float(st[4])
		p.scale_amount_max = 1.3 * float(st[4])
		var sm := SphereMesh.new()
		sm.radius = 0.022
		sm.height = 0.11
		sm.radial_segments = 12
		sm.rings = 6
		p.mesh = sm
		p.particle_flag_align_y = true
		p.material_override = _drop_mat()
		p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(p)
		p.global_position = pos
		p.emitting = true


var _drop_m: StandardMaterial3D


func _drop_mat() -> StandardMaterial3D:
	if _drop_m == null:
		_drop_m = StandardMaterial3D.new()
		_drop_m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		_drop_m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		_drop_m.albedo_color = Color(0.82, 0.92, 1.0, 0.72)
	return _drop_m


func _seg_at(a: Dictionary, at_tau: float) -> int:
	var segs: Array = a["segs"]
	var k := 0
	for i in segs.size():
		if at_tau >= float((segs[i] as Dictionary).get("t0", 0.0)):
			k = i
	return k


## The actor's render state at scene time `at_tau` (the same dictionary
## the match feeds CharacterView.apply_state).
func actor_state(id: String, at_tau: float) -> Dictionary:
	var a: Dictionary = actors[id]
	var segs: Array = a["segs"]
	var ad: Dictionary = a["def"]
	var rs := {"state": TC.PState.ACTIVE, "on_floor": true, "vel": Vector3.ZERO}
	if segs.is_empty():
		return rs
	var si := _seg_at(a, at_tau)
	var sd: Dictionary = segs[si]
	var t := at_tau - float(sd.get("t0", 0.0))
	var mode := String(sd.get("mode", "route"))
	var pos := Vector3.ZERO
	var vel := Vector3.ZERO
	var yaw := 0.0
	match mode:
		"route":
			var r: TrailerRoute = sd["route"]
			var s := float(sd.get("s0", 0.0)) + TrailerRoute.dist(sd["speed"], t)
			pos = r.at(s)
			pos.y += float(sd.get("y", 0.0))
			var tg := r.tangent(s)
			var spd := TrailerRoute.speed(sd["speed"], t)
			vel = tg * spd
			yaw = atan2(-tg.x, -tg.z)
			if sd.has("yaw"):
				yaw = float(sd["yaw"])
			if spd < 0.05 and sd.has("rest_yaw"):
				yaw = float(sd["rest_yaw"])
		"hold":
			var hp: Array = sd["pos"]
			pos = Vector3(float(hp[0]), float(hp[1]) if hp.size() > 2 else 0.0, float(hp[2]) if hp.size() > 2 else float(hp[1]))
			yaw = float(sd.get("yaw", 0.0))
		"splash":
			var sp: Array = sd["pos"]
			pos = Vector3(float(sp[0]), float(sp[1]), float(sp[2]))
			yaw = float(sd.get("yaw", 0.0))
			rs["state"] = TC.PState.SPLASHING
			rs["state_t"] = t * 1.5 / float(sd.get("len", 1.5))
			rs["impact"] = int(sd.get("impact", TC.Impact.JUMP))
			rs["stamped"] = true
		"cart":
			var c: Dictionary = carts[String(sd["cart"])]
			var crs := _cart_state(c, at_tau)
			var cy := float(crs["yaw"])
			pos = (crs["pos"] as Vector3) + Basis(Vector3.UP, cy) * CartView.SEAT
			yaw = cy
			vel = Basis(Vector3.UP, cy) * Vector3(0, 0, -float(crs["speed"]))
			rs["state"] = TC.PState.IN_CART
			rs["steer"] = crs["steer"]
			rs["cart_id"] = 0
	# the drawn ground under the body (V3): segments with an explicit height
	# (the fountain rim) keep it; everything else stands on the surface
	if _auto_ground and mode in ["route", "hold"]:
		var fixed := (mode == "route" and sd.has("y")) or (mode == "hold" and (sd["pos"] as Array).size() > 2 and absf(float(sd["pos"][1])) > 0.001)
		if not fixed:
			pos.y += _ground.body_height(pos.x, pos.z, pos.y + 0.3) + float(ad.get("ground_add", 0.0))
	# overlays
	for fx_d in ad.get("fx", []):
		var e: Dictionary = fx_d
		var et := float(e.get("t", 0.0))
		var ty := String(e.get("type", ""))
		var edur := float(e.get("dur", 0.5))
		var u := (at_tau - et) / maxf(edur, 0.001)
		match ty:
			"jump", "dive":
				if u >= 0.0 and u < 1.0:
					var h := float(e.get("h", 1.0))
					var dy := float(e.get("dy", 0.0))
					pos.y += dy * u + 4.0 * h * u * (1.0 - u)
					vel.y = (dy + 4.0 * h * (1.0 - 2.0 * u)) / edur
					rs["on_floor"] = false
					if ty == "dive":
						rs["diving"] = true
			"emote":
				if u >= 0.0 and u < 1.0:
					rs["emote"] = TC.EMOTES.find(String(e["name"]))
					rs["emote_t"] = (1.0 - u) * edur
			"tag":
				var tt := at_tau - et
				if tt >= 0.0 and tt < 0.16:
					rs["tag_phase"] = 1
				elif tt >= 0.16 and tt < 0.38:
					rs["tag_phase"] = 2
				elif tt >= 0.38 and tt < 0.9:
					rs["tag_phase"] = 3
			"state":
				if u >= 0.0 and u < 1.0:
					rs["state"] = STATE.get(String(e["state"]), TC.PState.ACTIVE)
					rs["state_t"] = at_tau - et
			"protect":
				if u >= 0.0 and u < 1.0:
					rs["protect"] = (1.0 - u) * edur
			"spotted":
				if u >= 0.0 and u < 1.0:
					rs["spotted"] = true
			"celebrate":
				if u >= 0.0 and u < 1.0:
					rs["celebrate"] = true
			"cloak":
				if u >= 0.0 and u < 1.0:
					rs["cloak"] = true
			"yoff":
				# a vertical offset over scene time (a crouch, a dip)
				pos.y += _curve(e["keys"], at_tau)
			"turn":
				# turn to face a yaw (or a point) over `dur`, eased, then hold
				if u >= 0.0:
					var to := float(e.get("yaw", yaw))
					if e.has("face"):
						var fp: Array = e["face"]
						to = atan2(-(float(fp[0]) - pos.x), -(float(fp[1]) - pos.z))
					var k := clampf(u, 0.0, 1.0)
					k = k * k * (3.0 - 2.0 * k)
					var hold_until := float(e.get("until", 1e9))
					if at_tau < hold_until:
						yaw = yaw + wrapf(to - yaw, -PI, PI) * k
	rs["pos"] = pos
	rs["vel"] = vel
	rs["yaw"] = yaw
	rs["fast"] = Vector2(vel.x, vel.z).length() > float(ad.get("fast_at", 5.2))
	return rs


func _update_actors() -> void:
	for id in actors:
		var a: Dictionary = actors[id]
		var v: CharacterView = a["view"]
		var rs := actor_state(String(id), tau)
		var si := _seg_at(a, tau)
		var snap: bool = a["snap"]
		a["snap"] = false
		v.visible = tau >= float(a["def"].get("appear", -1e9)) and tau < float(a["def"].get("vanish", 1e9))
		for hr in a["def"].get("hide", []):
			if tau >= float(hr[0]) and tau < float(hr[1]):
				v.visible = false
		if v.has_meta(&"pose_mod"):
			(v.get_meta(&"pose_mod") as TrailerPoseMod).tau = tau
		for wr in a["def"].get("wet", []):
			if tau >= float(wr[0]) and tau < float(wr[1]):
				v._set_wet(1.0)
				if bool(a["def"].get("drips", true)):
					v._ensure_drips()
					v._drip_t = maxf(v._drip_t, 0.3)
		v.apply_state(rs, 0.0, snap)
		a["pos"] = rs["pos"]
		if v.has_meta(&"gaze_idx"):
			var gz := _gaze_at(v, a["def"]["gaze"], tau)
			TrailerGaze.set_gaze(v.face_mesh, v.get_meta(&"gaze_idx"), gz.x, gz.y)
		if v.has_meta(&"snowcoat"):
			_update_coat(String(id), v, a)
		a["yaw"] = rs["yaw"]
		# sound-sync events: segment starts and footfalls from the gait phase
		if si != int(a["seg_i"]):
			if int(a["seg_i"]) >= 0:
				_ev("seg_" + String((a["segs"][si] as Dictionary).get("mode", "route")), String(id), rs["pos"])
			a["seg_i"] = si
		var done: Dictionary = a["done"]
		for i in (a["def"].get("fx", []) as Array).size():
			var e: Dictionary = a["def"]["fx"][i]
			if tau >= float(e.get("t", 0.0)) and not done.has(i):
				done[i] = true
				_ev(String(e.get("type", "")) + ("_" + String(e["name"]) if e.has("name") else ""), String(id), rs["pos"])
				if String(e.get("type", "")) == "resurface":
					v._on_resurface()
					fx.ripple(_water_info(rs["pos"]), rs["pos"], 0.7)
				if String(e.get("type", "")) == "ripple":
					var rpp: Array = e.get("pos", [rs["pos"].x, rs["pos"].y, rs["pos"].z])
					var rp := Vector3(float(rpp[0]), float(rpp[1]), float(rpp[2]))
					fx.ripple(_water_info(rp), rp, float(e.get("size", 0.3)))
				if String(e.get("type", "")) == "burst":
					var bp: Array = e.get("pos", [rs["pos"].x, rs["pos"].y, rs["pos"].z])
					_burst(Vector3(float(bp[0]), float(bp[1]), float(bp[2])), float(e.get("size", 1.0)))
				if String(e.get("type", "")) == "tag" and bool(e.get("miss", false)):
					get_tree().create_timer(0.38 / maxf(Engine.time_scale, 0.05), true, false, true).timeout.connect(v.tag_missed)
		var ph: float = v._phase
		var prev: float = a["phase"]
		var sp := Vector2((rs["vel"] as Vector3).x, (rs["vel"] as Vector3).z).length()
		if prev >= 0.0 and sp > 1.0 and bool(rs.get("on_floor", true)) and int(rs["state"]) == TC.PState.ACTIVE:
			for c in [0.0, 0.5]:
				var a0 := fposmod(prev - c, 1.0)
				var a1 := fposmod(ph - c, 1.0)
				if a1 < a0 and a0 - a1 > 0.5:
					_ev("step", String(id), rs["pos"])
					if not _patches.is_empty():
						_print_step(v, float(rs["yaw"]), float(a["def"].get("print_scale", 1.0)))
		a["phase"] = ph



# ------------------------------------------------------------------ camera
func _resolve(p: Variant, at_tau: float) -> Vector3:
	if p is Array:
		var a: Array = p
		return Vector3(float(a[0]), float(a[1]), float(a[2]))
	var d: Dictionary = p
	var base := Vector3.ZERO
	var yaw := 0.0
	var ref_tau := float(d.get("tau", at_tau)) + float(d.get("lead", 0.0))
	if d.has("rel"):
		var rel := String(d["rel"])
		if actors.has(rel):
			var rs := actor_state(rel, ref_tau)
			base = rs["pos"]
			yaw = float(rs["yaw"])
		elif carts.has(rel):
			var crs := _cart_state(carts[rel], ref_tau)
			base = crs["pos"]
			yaw = float(crs["yaw"])
		if bool(d.get("flat", true)):
			base.y = float(d.get("base_y", 0.0)) if d.has("base_y") else base.y
	var off: Array = d.get("off", [0, 0, 0])
	var o := Vector3(float(off[0]), float(off[1]), float(off[2]))
	if String(d.get("frame", "heading")) == "heading":
		var hy := yaw + deg_to_rad(float(d.get("yaw_add", 0.0)))
		if d.has("yaw_fixed"):
			hy = deg_to_rad(float(d["yaw_fixed"]))
		o = Basis(Vector3.UP, hy) * o
	return base + o


func _hermite(keys: Array, field: String, t: float, ref_tau: Callable) -> Variant:
	var n := keys.size()
	if n == 1:
		return _val(keys[0], field, ref_tau)
	var i := 0
	while i < n - 2 and t > float(keys[i + 1]["t"]):
		i += 1
	var k0: Dictionary = keys[i]
	var k1: Dictionary = keys[i + 1]
	var t0 := float(k0["t"])
	var t1 := float(k1["t"])
	var h := maxf(t1 - t0, 0.0001)
	var u := clampf((t - t0) / h, 0.0, 1.0)
	if t < t0:
		u = 0.0
	# segment easing (k1 "ease": in/out/inout/none; default smooth Hermite)
	var p0: Variant = _val(k0, field, ref_tau)
	var p1: Variant = _val(k1, field, ref_tau)
	var m0: Variant = _tangent(keys, i, field, ref_tau)
	var m1: Variant = _tangent(keys, i + 1, field, ref_tau)
	var ez := String(k1.get("ease", ""))
	if ez == "linear":
		return lerp(p0, p1, u) if not (p0 is float) else lerpf(p0, p1, u)
	if ez != "":
		u = _ease(u, ez)
		return lerp(p0, p1, u) if not (p0 is float) else lerpf(p0, p1, u)
	var u2 := u * u
	var u3 := u2 * u
	var h00 := 2.0 * u3 - 3.0 * u2 + 1.0
	var h10 := u3 - 2.0 * u2 + u
	var h01 := -2.0 * u3 + 3.0 * u2
	var h11 := u3 - u2
	return p0 * h00 + m0 * (h10 * h) + p1 * h01 + m1 * (h11 * h)


func _ease(u: float, ez: String) -> float:
	match ez:
		"in":
			return u * u * u
		"out":
			return 1.0 - pow(1.0 - u, 3.0)
		"inout":
			return u * u * (3.0 - 2.0 * u)
		"expo_out":
			return 1.0 - pow(2.0, -10.0 * u)
		"expo_in":
			return pow(2.0, 10.0 * (u - 1.0)) if u > 0.0 else 0.0
	return u


func _val(k: Dictionary, field: String, ref_tau: Callable) -> Variant:
	if field == "pos" or field == "at":
		return _resolve(k[field], ref_tau.call(float(k["t"])))
	return float(k.get(field, 0.0))


func _tangent(keys: Array, i: int, field: String, ref_tau: Callable) -> Variant:
	var n := keys.size()
	var k: Dictionary = keys[i]
	var hold := bool(k.get("hold", false))
	var a := maxi(i - 1, 0)
	var b := mini(i + 1, n - 1)
	var pa: Variant = _val(keys[a], field, ref_tau)
	var pb: Variant = _val(keys[b], field, ref_tau)
	var dt := float(keys[b]["t"]) - float(keys[a]["t"])
	var zero: Variant = 0.0 if pa is float else Vector3.ZERO
	if hold or dt <= 0.0:
		return zero
	if (i == 0 or i == n - 1) and String(shot.get("cam_ends", "linear")) == "ease":
		return zero
	return (pb - pa) / dt


func _update_camera() -> void:
	if _cam_keys.is_empty():
		return
	# rel keys resolve at the current scene time (following), absolute keys
	# are where they are
	var now_tau := tau
	var rt := func(_kt: float) -> float: return now_tau
	var p: Vector3 = _hermite(_cam_keys, "pos", t_out, rt)
	var at: Vector3 = _hermite(_cam_keys, "at", t_out, rt)
	var fov: float = _hermite(_cam_keys, "fov", t_out, rt)
	var roll: float = _hermite(_cam_keys, "roll", t_out, rt)
	# handheld / impact shake (deterministic)
	var amp := _curve(shot.get("shake", []), t_out)
	if amp > 0.0:
		var tt := t_out
		var n1 := Vector3(sin(tt * 7.3) + 0.6 * sin(tt * 13.1 + 1.3), sin(tt * 6.1 + 2.1) + 0.5 * sin(tt * 15.7), sin(tt * 5.3 + 0.7) + 0.4 * sin(tt * 11.9 + 2.9))
		p += n1 * amp * 0.03
		at += Vector3(sin(tt * 4.7 + 0.3), sin(tt * 5.9 + 1.1), sin(tt * 4.1 + 2.2)) * amp * 0.06
		roll += sin(tt * 3.7 + 0.9) * amp * 0.6
	for kick in shot.get("kicks", []):
		var kt := t_out - float(kick[0])
		if kt >= 0.0 and kt < 0.6:
			var ka := float(kick[1]) * exp(-kt * 9.0)
			p += Vector3(sin(kt * 61.0), cos(kt * 53.0), 0.0) * ka * 0.05
			roll += sin(kt * 47.0) * ka * 0.8
	cam.fov = fov
	if shot.has("near_k"):
		cam.near = _curve(shot["near_k"], t_out)
	if p.distance_to(at) > 0.001:
		var fwd := (at - p).normalized()
		var up := Vector3.UP
		if absf(fwd.dot(up)) > 0.995:
			up = Vector3(0, 0, -1)
		var b := Basis.looking_at(fwd, up)
		b = b * Basis(Vector3(0, 0, 1), deg_to_rad(roll))
		cam.global_transform = Transform3D(b, p)
	if _cam_attr != null:
		var dd: Dictionary = shot["dof"]
		var fd := float(dd.get("focus", 6.0))
		if dd.has("focus_on"):
			var tgt := _resolve(dd["focus_on"], tau)
			fd = p.distance_to(tgt)
		_cam_attr.dof_blur_far_enabled = bool(dd.get("far", true))
		_cam_attr.dof_blur_far_distance = fd + float(dd.get("far_off", 2.0))
		_cam_attr.dof_blur_far_transition = float(dd.get("far_t", fd * 1.2))
		_cam_attr.dof_blur_near_enabled = bool(dd.get("near", false))
		_cam_attr.dof_blur_near_distance = maxf(0.05, fd - float(dd.get("near_off", 1.5)))
		_cam_attr.dof_blur_near_transition = float(dd.get("near_t", 1.0))
		_cam_attr.dof_blur_amount = float(dd.get("amount", 0.08))


func _curve(keys: Variant, t: float) -> float:
	if keys is float or keys is int:
		return float(keys)
	var k: Array = keys
	if k.is_empty():
		return 0.0
	if t <= float(k[0][0]):
		return float(k[0][1])
	for i in k.size() - 1:
		if t <= float(k[i + 1][0]):
			return lerpf(float(k[i][1]), float(k[i + 1][1]), (t - float(k[i][0])) / maxf(float(k[i + 1][0]) - float(k[i][0]), 0.0001))
	return float(k[k.size() - 1][1])


## Scene time at output time t (slow motion: "speed" keys [[t_out, rate]]).
func _tau_at(t: float) -> float:
	var keys: Array = shot.get("speed", [])
	var t0 := float(shot.get("tau0", 0.0))
	if keys.is_empty():
		return t0 + t
	if t <= float(keys[0][0]):
		return t0 + float(keys[0][1]) * t if float(keys[0][0]) <= 0.0 else t0 + t * float(keys[0][1])
	var s := t0 + float(keys[0][0]) * float(keys[0][1])
	for i in keys.size() - 1:
		var ta := float(keys[i][0])
		var tb := float(keys[i + 1][0])
		var ra := float(keys[i][1])
		var rb := float(keys[i + 1][1])
		if t <= tb:
			var u := t - ta
			return s + ra * u + 0.5 * (rb - ra) / maxf(tb - ta, 0.0001) * u * u
		s += (ra + rb) * 0.5 * (tb - ta)
	var last: Array = keys[keys.size() - 1]
	return s + float(last[1]) * (t - float(last[0]))


# ------------------------------------------------------------------ loop
func _process(_delta: float) -> void:
	var f := frame - PRE
	t_out = float(f) / FPS
	tau = _tau_at(t_out)
	var rate := _curve(shot.get("speed", 1.0), t_out) if shot.has("speed") else 1.0
	Engine.time_scale = clampf(rate, 0.02, 4.0)
	var draw := f >= 0
	if not _scout.is_empty() and f >= 0:
		var vi := f / 4
		if vi < _scout.size():
			var vd: Dictionary = _scout[vi]
			_cam_keys = [{"t": 0.0, "pos": vd["pos"], "at": vd["at"], "fov": float(vd.get("fov", 50.0))}]
			if f % 4 == 3:
				_grab = String(vd["name"])
	if not stills.is_empty():
		draw = false
		for st in stills:
			if absi(int(round(float(st) * FPS)) - f) == 0:
				draw = true
				_grab = "%s_%06.3f" % [shot_id, float(st)]
	get_viewport().disable_3d = not draw
	_update_carts()
	_update_actors()
	_update_props()
	_update_falls()
	_update_camera()
	if snow_mat:
		snow_mat.set_shader_parameter("t", tau)
		snow_mat.set_shader_parameter("cam_pos", cam.global_position)
	for i in arrow_mats.size():
		var m: ShaderMaterial = arrow_mats[i]
		m.set_shader_parameter("t", tau)
		var ad: Dictionary = arrow_defs[i]
		if ad.has("reveal"):
			m.set_shader_parameter("reveal", _curve(ad["reveal"], tau))
	for l in _lights:
		var ld: Dictionary = l["def"]
		if ld.has("energy_k"):
			(l["node"] as Light3D).light_energy = _curve(ld["energy_k"], t_out)
		if ld.has("follow"):
			var lp := _resolve(ld["follow"], tau)
			(l["node"] as Node3D).global_position = lp
	if f >= 0 and stills.is_empty() and (f % 30 == 0 or f == dur_frames - 1):
		printerr("TRAILER frame %d/%d ms=%d" % [f, dur_frames, Time.get_ticks_msec()])
	var last_still := -1
	for st2 in stills:
		last_still = maxi(last_still, int(round(float(st2) * FPS)))
	if f == 1 and cli_opts.has("probe"):
		_probe_surfaces(String(cli_opts["probe"]))
	if (stills.is_empty() and f >= dur_frames) or (not stills.is_empty() and f > last_still + 1):
		_finish()
	frame += 1


## Beam aims, after every pose is final for this frame: the rig sits at
## the flashlight's lens and points at the keyed target.
func _on_pre_draw() -> void:
	for id in actors:
		var a: Dictionary = actors[id]
		if a["def"].has("face"):
			var v: CharacterView = a["view"]
			var fk := TrailerPoseMod.sample(_face_keys(a["def"]["face"]), tau)
			for key in fk:
				if v._face_idx.has(key) and v.face_mesh:
					v.face_mesh.set_blend_shape_value(v._face_idx[key], clampf((fk[key] as Vector3).x, 0.0, 1.0))
	if _glass_mat:
		# [[tau, intensity, u centre, width, spill energy], ...]
		var gk: Array = shot["glass_sweep"]
		var gi: Array = [[], [], [], []]
		for k in gk:
			for j in 4:
				gi[j].append([k[0], k[j + 1]])
		var inten := _curve(gi[0], tau)
		var uc := _curve(gi[1], tau)
		_glass_mat.set_shader_parameter("intensity", inten)
		_glass_mat.set_shader_parameter("u_c", uc)
		_glass_mat.set_shader_parameter("width", _curve(gi[2], tau))
		_glass_spill.light_energy = _curve(gi[3], tau)
		_glass_spill.visible = _glass_spill.light_energy > 0.001
		var sx := -1.5 + uc * 3.0
		_glass_spill.global_position = Vector3(-sx, 2.2, TrailerSet.DOOR_Z_OUT + 0.25)
		_glass_spill.look_at(Vector3(-sx * 0.6, 0.4, TrailerSet.DOOR_Z_OUT + 4.5))
	if not _doors.is_empty():
		var dk: Dictionary = shot["doors"]
		(_doors["L"] as Node3D).rotation.y = deg_to_rad(TrailerSet.door_angle(dk.get("L", []), tau))
		(_doors["R"] as Node3D).rotation.y = -deg_to_rad(TrailerSet.door_angle(dk.get("R", []), tau))
	for cid in carts:
		var c: Dictionary = carts[cid]
		var cv: CartView = c["view"]
		if cv.head_beam and c.has("hl"):
			cv.head_beam.visible = false
		if c["def"].has("beacon"):
			var bon := _curve(c["def"]["beacon"], tau) > 0.5
			cv.beacon.visible = bon
			cv.beacon_light.visible = bon
	for a in _aims:
		var node: Node3D = a["node"]
		var holder: Node3D = a["holder"]
		var from := holder.global_position
		var tgt := _aim_target(a["keys"], tau)
		if from.distance_to(tgt) > 0.05:
			var up := Vector3.UP if absf((tgt - from).normalized().y) < 0.98 else Vector3(0, 0, -1)
			node.global_transform = Transform3D(Basis.looking_at(tgt - from, up), from)
	if not _aims.is_empty() and frame - PRE >= 0:
		for a2 in _aims:
			var gl: Node3D = a2["node"]
			var bd := -gl.global_transform.basis.z.normalized()
			var tc := (cam.global_position - gl.global_position).normalized()
			var sp := cam.unproject_position(gl.global_position) / get_viewport().get_visible_rect().size
			_aim_log.append({"f": frame - PRE, "align": snappedf(maxf(bd.dot(tc), 0.0), 0.0001), "screen": [snappedf(sp.x, 0.001), snappedf(sp.y, 0.001)],
				"behind": cam.is_position_behind(gl.global_position)})


var _aim_log: Array = []


## face keys [[tau, {shape: w}], ...] in the pose sampler's format
func _face_keys(fk: Array) -> Array:
	var out: Array = []
	for k in fk:
		var d := {}
		for n in (k[1] as Dictionary):
			d[n] = [float(k[1][n]), 0.0, 0.0]
		out.append([k[0], d] + ([k[2]] if (k as Array).size() > 2 else []))
	return out


func _aim_target(keys: Array, at_tau: float) -> Vector3:
	if keys.size() == 1:
		return _resolve(keys[0][1], at_tau)
	if at_tau <= float(keys[0][0]):
		return _resolve(keys[0][1], at_tau)
	for i in keys.size() - 1:
		var ta := float(keys[i][0])
		var tb2 := float(keys[i + 1][0])
		if at_tau <= tb2:
			var u := clampf((at_tau - ta) / maxf(tb2 - ta, 0.0001), 0.0, 1.0)
			u = u * u * (3.0 - 2.0 * u)
			return _resolve(keys[i][1], at_tau).lerp(_resolve(keys[i + 1][1], at_tau), u)
	return _resolve(keys[keys.size() - 1][1], at_tau)


func _on_post_draw() -> void:
	if _grab == "":
		return
	var img := get_viewport().get_texture().get_image()
	img.save_png(stills_dir.path_join(_grab + ".png"))
	_grab = ""


func _ev(kind: String, who: String, pos: Vector3) -> void:
	var f := frame - PRE
	if f < 0:
		return
	var d := cam.global_position.distance_to(pos) if cam else 0.0
	var scr := Vector2(-1, -1)
	if cam and not cam.is_position_behind(pos):
		var sp := cam.unproject_position(pos)
		var vs := get_viewport().get_visible_rect().size
		scr = Vector2(sp.x / vs.x, sp.y / vs.y)
	events.append({"f": f, "t": snappedf(t_out, 0.0001), "tau": snappedf(tau, 0.0001), "kind": kind, "who": who,
		"pos": [snappedf(pos.x, 0.01), snappedf(pos.y, 0.01), snappedf(pos.z, 0.01)], "dist": snappedf(d, 0.01),
		"screen": [snappedf(scr.x, 0.001), snappedf(scr.y, 0.001)]})


var _finished := false


func _finish() -> void:
	if _finished:
		return
	_finished = true
	if events_path != "":
		var fa := FileAccess.open(events_path, FileAccess.WRITE)
		fa.store_string(JSON.stringify({"shot": shot_id, "fps": FPS, "pre": PRE, "frames": dur_frames, "events": events, "beam": _aim_log}, "  "))
		fa.close()
	printerr("TRAILER done %s" % shot_id)
	get_tree().quit()


## The game's coin (a rim disc with a raised centre) with more segments, for
## the trailer's close passes.
static func _smooth_coin_mesh() -> ArrayMesh:
	var out := ArrayMesh.new()
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	var v := PackedVector3Array()
	var n := PackedVector3Array()
	for part in [[0.34, 0.075], [0.24, 0.1]]:
		var cm := CylinderMesh.new()
		cm.top_radius = part[0]
		cm.bottom_radius = part[0]
		cm.height = part[1]
		cm.radial_segments = 64
		cm.rings = 1
		var a: Array = cm.get_mesh_arrays()
		var idx: PackedInt32Array = a[Mesh.ARRAY_INDEX]
		var pv: PackedVector3Array = a[Mesh.ARRAY_VERTEX]
		var pn: PackedVector3Array = a[Mesh.ARRAY_NORMAL]
		for i in idx:
			var p: Vector3 = pv[i]
			var q: Vector3 = pn[i]
			v.append(Vector3(p.x, -p.z, p.y))
			n.append(Vector3(q.x, -q.z, q.y))
	arrays[Mesh.ARRAY_VERTEX] = v
	arrays[Mesh.ARRAY_NORMAL] = n
	out.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	return out


## Surface probe (dev): the highest visible static geometry under each
## [x, z, label] in a JSON file, from the meshes' own triangles (not the
## physics shapes), plus the physics ground for comparison.
func _probe_surfaces(path: String) -> void:
	var pts: Array = JSON.parse_string(FileAccess.get_file_as_string(path))
	var meshes: Array = []
	for n in find_children("*", "MeshInstance3D", true, false):
		var mi := n as MeshInstance3D
		if mi.mesh == null or not mi.is_visible_in_tree() or mi.skin != null or String(mi.name).contains("Pool"):
			continue
		var skip := false
		var pn: Node = mi
		while pn != null:
			if pn is CharacterView or pn is CartView:
				skip = true
				break
			pn = pn.get_parent()
		if not skip:
			meshes.append(mi)
	var space := get_world_3d().direct_space_state
	for pt in pts:
		var x := float(pt[0])
		var z := float(pt[1])
		var best := -INF
		var who := ""
		var hits: Array = []
		for mi in meshes:
			var m := mi as MeshInstance3D
			var ab := m.global_transform * m.get_aabb()
			if x < ab.position.x or x > ab.end.x or z < ab.position.z or z > ab.end.z or ab.position.y > 1.2:
				continue
			var inv := m.global_transform.affine_inverse()
			var o := inv * Vector3(x, 1.2, z)
			var d := (inv.basis * Vector3.DOWN).normalized()
			var faces := m.mesh.get_faces()
			for i in range(0, faces.size(), 3):
				var hit: Variant = Geometry3D.ray_intersects_triangle(o, d, faces[i], faces[i + 1], faces[i + 2])
				if hit != null:
					var wy := (m.global_transform * (hit as Vector3)).y
					hits.append("%.3f:%s" % [wy, String(m.name)])
					if wy > best and wy < 1.2:
						best = wy
						who = String(m.name) + "<" + String(m.get_parent().name)
		var q := PhysicsRayQueryParameters3D.create(Vector3(x, 1.2, z), Vector3(x, -1.0, z))
		var r := space.intersect_ray(q)
		var py: float = (r["position"] as Vector3).y if r.has("position") else NAN
		printerr("PROBE %s x=%.2f z=%.2f visible=%.4f (%s) physics=%.4f all=%s" % [String(pt[2]), x, z, best, who, py, str(hits.slice(0, 6))])


## Gaze keys: [tau, gx, gy] (fixed) or [tau, "at", x, y, z] (a world point,
## measured from the head bone in the head's own frame); linear between keys.
func _gaze_key(v: CharacterView, k: Array) -> Vector2:
	if k.size() > 2 and k[1] is String:
		var sk := v.skeleton
		var hb := sk.find_bone("head")
		var hg := sk.global_transform * sk.get_bone_global_pose(hb)
		var hp := hg.origin + hg.basis * Vector3(0, 0.25, 0)
		var tgt := Vector3(float(k[2]), float(k[3]), float(k[4]))
		var vb := hg.basis.orthonormalized().inverse() * (tgt - hp)
		var vm := sk.get_bone_global_rest(hb).basis.orthonormalized() * vb
		var fwd := maxf(-vm.z, 0.05)
		return Vector2(clampf(atan2(vm.x, fwd) / 0.55, -1.0, 1.0), clampf(atan2(vm.y, fwd) / 0.4, -1.0, 1.0))
	return Vector2(float(k[1]), float(k[2]))


func _gaze_at(v: CharacterView, keys: Array, at_tau: float) -> Vector2:
	if keys.is_empty():
		return Vector2.ZERO
	if at_tau <= float(keys[0][0]):
		return _gaze_key(v, keys[0])
	for i in range(keys.size() - 1):
		var k0: Array = keys[i]
		var k1: Array = keys[i + 1]
		if at_tau <= float(k1[0]):
			var u := (at_tau - float(k0[0])) / maxf(float(k1[0]) - float(k0[0]), 0.001)
			u = u * u * (3.0 - 2.0 * u)
			return _gaze_key(v, k0).lerp(_gaze_key(v, k1), u)
	return _gaze_key(v, keys[keys.size() - 1])


## A branch of the hide bush pushed aside: one clump (and its snow) swings
## about a pivot at the bush's heart, keyed [tau, yaw deg, tilt deg]; its
## snow slides off at `drop` and falls to the ground in chunks.
func _update_branch(hb: HideBush, b: Dictionary, pr: Dictionary) -> void:
	var clumps: Array = hb.get_meta(&"clumps", [])
	var ci := int(b.get("clump", 0))
	if ci >= clumps.size():
		return
	var cn := clumps[ci] as Node3D
	var caps: Array = hb.get_meta(&"caps", [])
	var group: Array = caps[ci] if ci < caps.size() else []
	if not pr.has("branch0"):
		var rec := {"c": cn.transform}
		var cl: Array = []
		for g in group:
			cl.append((g as Node3D).transform)
		rec["caps"] = cl
		pr["branch0"] = rec
	var r0: Dictionary = pr["branch0"]
	var pv: Array = b.get("pivot", [0.0, 0.15, 0.0])
	var pivot := Vector3(float(pv[0]), float(pv[1]), float(pv[2]))
	var yaw := deg_to_rad(_curve(b["yaw"], tau)) if b.has("yaw") else 0.0
	var tilt := deg_to_rad(_curve(b["tilt"], tau)) if b.has("tilt") else 0.0
	var rb := Basis(Vector3.UP, yaw) * Basis(Vector3.RIGHT, tilt)
	var xf := Transform3D(rb, pivot - rb * pivot)
	cn.transform = xf * (r0["c"] as Transform3D)
	var dropped := tau >= float(b.get("drop", 1e9))
	for gi in group.size():
		var gn := group[gi] as Node3D
		gn.transform = xf * (r0["caps"][gi] as Transform3D)
		gn.visible = not dropped
	if dropped and not pr.has("branch_dropped"):
		pr["branch_dropped"] = true
		var t0 := float(b["drop"])
		var k := 0
		for g2 in group:
			var gp := (g2 as Node3D).global_position
			var gsc := (g2 as Node3D).global_transform.basis.get_scale()
			# the cap breaks into two or three chunks that slide off and fall
			for j in (2 if k == 0 else 1):
				var mi := MeshInstance3D.new()
				mi.mesh = TrailerSnowFx.lumpy_mesh(31 + k * 5 + j)
				mi.material_override = TrailerSnowFx.snow_mat()
				mi.scale = gsc * Vector3(0.55, 0.8, 0.55) * (0.8 if j == 1 else 1.0)
				add_child(mi)
				var dv: Array = b.get("drop_dir", [-0.6, 0.0, 0.0])
				var v0 := Vector3(float(dv[0]), 0.3, float(dv[2])) * (1.0 + 0.3 * float(j))
				var off := Vector3(0.05 * float(j), 0, -0.04 * float(j))
				_falls.append({"mi": mi, "p0": gp + off, "v0": v0, "t0": t0 + 0.03 * float(k + j),
					"floor": _ground.height(gp.x, gp.z, 0.5) if _auto_ground else 0.0, "spin": 3.0 + float(j)})
			k += 1
		TrailerSnowFx.puff(self, (group[0] as Node3D).global_position if not group.is_empty() else cn.global_position, float(b.get("puff", 0.45)), Vector3(-0.3, 0.4, 0))
		_ev("branch_snow", "bush", cn.global_position)


var _falls: Array = []


## Falling snow chunks on scene time: ballistic, then flattened where they land.
func _update_falls() -> void:
	for f in _falls:
		var mi: MeshInstance3D = f["mi"]
		var tt := tau - float(f["t0"])
		if tt < 0.0:
			mi.visible = false
			continue
		mi.visible = true
		var p0: Vector3 = f["p0"]
		var v0: Vector3 = f["v0"]
		var p := p0 + v0 * tt + Vector3(0, -4.9 * tt * tt, 0)
		var fl := float(f["floor"])
		if not f.has("sc"):
			f["sc"] = mi.scale
		var sc: Vector3 = f["sc"]
		if p.y <= fl + sc.y * 0.3:
			if not f.has("land_t"):
				var dy := p0.y - fl
				var t_hit := (v0.y + sqrt(v0.y * v0.y + 19.6 * maxf(dy - sc.y * 0.3, 0.0))) / 9.8
				f["land_t"] = t_hit
				f["land_p"] = p0 + v0 * t_hit
				_ev("chunk_land", "bush", f["land_p"])
			var lp: Vector3 = f["land_p"]
			mi.global_position = Vector3(lp.x, fl + sc.y * 0.22, lp.z)
			mi.scale = Vector3(sc.x * 1.2, sc.y * 0.45, sc.z * 1.2)
			mi.rotation = Vector3(0, float(f["spin"]), 0)
		else:
			mi.global_position = p
			mi.scale = sc
			mi.rotation = Vector3(tt * float(f["spin"]), tt * 2.0, 0)
