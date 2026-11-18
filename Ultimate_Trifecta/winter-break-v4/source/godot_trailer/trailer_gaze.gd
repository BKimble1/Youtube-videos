class_name TrailerGaze
extends RefCounted
## Eye direction for the trailer's close-ups.  The game's heads have no gaze
## shapes (blink, squint, smile, open and brows only), so this adds four to
## the visible head mesh at run time: gaze_l / gaze_r / gaze_u / gaze_d slide
## each iris and its catch-light across its eye white.  The vertex data
## contract (tools/character/geo.py; character.gdshaderinc) marks material
## classes in UV2.y: irises are "gloss" (class .75), eye whites "lit gloss"
## (.875), catch-lights "emissive" (1.0).  Only vertices on the front of the
## head are touched.  Each iris moves in the plane fitted to its eye white,
## so it stays on the eye's surface; a full weight moves it 70 % of the room
## the white leaves it on that side.  Model space: the head faces -Z and +X
## is the character's own right (thigh.R sits at +x), so gaze_l moves the
## irises toward +x (the character's right) and gaze_r toward -x.

const SHAPES := ["gaze_l", "gaze_r", "gaze_u", "gaze_d"]


static func _cls(uv2: Vector2) -> float:
	return 1.0 - uv2.y


## Rebuilds `mi`'s mesh with the four gaze shapes appended (the existing
## shapes keep their indices).  Returns {name: index} or {} when the mesh has
## no eyes to move.
static func add(mi: MeshInstance3D) -> Dictionary:
	var src := mi.mesh as ArrayMesh
	if src == null:
		return {}
	var nbs := src.get_blend_shape_count()
	var out := ArrayMesh.new()
	out.blend_shape_mode = src.blend_shape_mode
	for i in nbs:
		out.add_blend_shape(src.get_blend_shape_name(i))
	for nm in SHAPES:
		out.add_blend_shape(nm)
	var found := false
	for si in src.get_surface_count():
		var arr := src.surface_get_arrays(si)
		var bsa := src.surface_get_blend_shape_arrays(si)
		var verts: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]
		var uv2: PackedVector2Array = arr[Mesh.ARRAY_TEX_UV2] if arr[Mesh.ARRAY_TEX_UV2] != null else PackedVector2Array()
		var shapes: Array = []
		for k in SHAPES.size():
			shapes.append(verts.duplicate())
		if uv2.size() == verts.size():
			# per eye (x sign): the eye white's vertices, and the iris + glint
			for side in [-1.0, 1.0]:
				var white: Array = []
				var iris: Array = []
				for vi in verts.size():
					var p := verts[vi]
					if p.y < 0.95 or p.z > -0.05 or signf(p.x) != side or absf(p.x) < 0.02:
						continue
					var c := _cls(uv2[vi])
					if c > 0.81 and c < 0.94:
						white.append(vi)
					elif (c > 0.72 and c < 0.81) or c >= 0.94:
						iris.append(vi)
				if white.size() < 4 or iris.size() < 3:
					continue
				found = true
				var wmin := Vector3(INF, INF, INF)
				var wmax := -wmin
				var sx := 0.0; var sy := 0.0; var sz := 0.0
				for vi in white:
					wmin = wmin.min(verts[vi]); wmax = wmax.max(verts[vi])
				# the iris and its glint: the glossy / emissive vertices inside the
				# white's outline (the lash line around it is glossy too)
				var inner: Array = []
				var omin := Vector3(INF, INF, INF)
				var omax := -omin
				for vi in iris:
					omin = omin.min(verts[vi]); omax = omax.max(verts[vi])
					var p2 := verts[vi]
					if p2.x > wmin.x + 0.002 and p2.x < wmax.x - 0.002 and p2.y > wmin.y + 0.002 and p2.y < wmax.y - 0.002:
						inner.append(vi)
				printerr("GAZE  white x %.3f..%.3f y %.3f..%.3f | gloss x %.3f..%.3f y %.3f..%.3f | inner %d" % [wmin.x, wmax.x, wmin.y, wmax.y, omin.x, omax.x, omin.y, omax.y, inner.size()])
				iris = inner
				if iris.size() < 3:
					continue
				var imin := Vector3(INF, INF, INF)
				var imax := -imin
				for vi in iris:
					imin = imin.min(verts[vi]); imax = imax.max(verts[vi])
				# least-squares plane z = a x + b y + c over the white
				var n := float(white.size())
				var mx := 0.0; var my := 0.0; var mz := 0.0
				for vi in white:
					mx += verts[vi].x; my += verts[vi].y; mz += verts[vi].z
				mx /= n; my /= n; mz /= n
				var sxx := 0.0; var sxy := 0.0; var syy := 0.0; var sxz := 0.0; var syz := 0.0
				for vi in white:
					var d: Vector3 = verts[vi] - Vector3(mx, my, mz)
					sxx += d.x * d.x; sxy += d.x * d.y; syy += d.y * d.y; sxz += d.x * d.z; syz += d.y * d.z
				var det := sxx * syy - sxy * sxy
				var a := 0.0
				var b := 0.0
				if absf(det) > 1e-12:
					a = (sxz * syy - syz * sxy) / det
					b = (syz * sxx - sxz * sxy) / det
				var room_x := maxf(0.0, ((wmax.x - wmin.x) - (imax.x - imin.x)) * 0.5) * 1.15
				var room_y := maxf(0.0, ((wmax.y - wmin.y) - (imax.y - imin.y)) * 0.5) * 0.9
				var offs := [Vector3(room_x, 0, room_x * a), Vector3(-room_x, 0, -room_x * a),
					Vector3(0, room_y, room_y * b), Vector3(0, -room_y, -room_y * b)]
				for k in SHAPES.size():
					var sh: PackedVector3Array = shapes[k]
					for vi in iris:
						# a hair proud of the white so the slide never sinks into it
						sh[vi] = verts[vi] + (offs[k] as Vector3) + Vector3(0, 0, -0.0015)
					shapes[k] = sh
				printerr("GAZE %s side %d: white %d iris %d room %.3f x %.3f plane a=%.2f b=%.2f" % [mi.name, int(side), white.size(), iris.size(), room_x, room_y, a, b])
		var blend: Array = []
		for bi in nbs:
			blend.append(bsa[bi])
		for k in SHAPES.size():
			var ba := []
			ba.resize(Mesh.ARRAY_MAX)
			ba[Mesh.ARRAY_VERTEX] = shapes[k]
			var base_b: Array = bsa[0] if nbs > 0 else []
			if nbs > 0:
				ba[Mesh.ARRAY_NORMAL] = arr[Mesh.ARRAY_NORMAL] if base_b[Mesh.ARRAY_NORMAL] != null else null
				ba[Mesh.ARRAY_TANGENT] = arr[Mesh.ARRAY_TANGENT] if base_b[Mesh.ARRAY_TANGENT] != null else null
			else:
				ba[Mesh.ARRAY_NORMAL] = arr[Mesh.ARRAY_NORMAL]
				ba[Mesh.ARRAY_TANGENT] = arr[Mesh.ARRAY_TANGENT]
			blend.append(ba)
		out.add_surface_from_arrays(src.surface_get_primitive_type(si), arr, blend)
		out.surface_set_material(si, src.surface_get_material(si))
	if not found:
		return {}
	mi.mesh = out
	var idx := {}
	for k in SHAPES.size():
		idx[SHAPES[k]] = nbs + k
	return idx


## Sets the gaze: gx > 0 toward the character's own right (+x), gy > 0 up (each -1..1).
static func set_gaze(mi: MeshInstance3D, idx: Dictionary, gx: float, gy: float) -> void:
	if idx.is_empty():
		return
	mi.set_blend_shape_value(int(idx["gaze_l"]), clampf(gx, 0.0, 1.0))
	mi.set_blend_shape_value(int(idx["gaze_r"]), clampf(-gx, 0.0, 1.0))
	mi.set_blend_shape_value(int(idx["gaze_u"]), clampf(gy, 0.0, 1.0))
	mi.set_blend_shape_value(int(idx["gaze_d"]), clampf(-gy, 0.0, 1.0))
