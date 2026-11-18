class_name TrailerGround
extends RefCounted
## The visible ground for the trailer's characters: the highest drawn
## surface under a point, from the triangles of the campus chunks, the
## Christmas room and the trailer's snow drifts (no physics in the trailer
## scene, and the walkable surfaces sit above y = 0: the plaza 0.03, the
## spine path and the porch slab 0.075-0.077, a drift 0.11, the fountain
## rim 0.613).  Triangles are bucketed per 1 m cell on first use; heights
## are memoised on a 2 cm grid.

const CELL := 1.0
const MEMO := 0.02

var _meshes: Array = []        # [{mi, aabb, done}]
var _cells: Dictionary = {}    # Vector2i -> PackedVector3Array (tri soup, world)
var _memo: Dictionary = {}


func setup(root: Node) -> void:
	for n in root.find_children("*", "MeshInstance3D", true, false):
		var mi := n as MeshInstance3D
		if mi.mesh == null or not mi.is_visible_in_tree() or mi.skin != null:
			continue
		if String(mi.name).contains("Pool") or String(mi.name).begins_with("Water"):
			continue
		var ok := false
		var pn: Node = mi.get_parent()
		while pn != null and pn != root:
			if String(pn.name) in ["CampusVisuals", "XmasRoom"]:
				ok = true
				break
			pn = pn.get_parent()
		if mi.has_meta(&"ground"):
			ok = true
		if not ok:
			continue
		var ab := mi.global_transform * mi.get_aabb()
		if ab.position.y > 1.0:
			continue
		_meshes.append({"mi": mi, "aabb": ab, "done": false})


func _bucket(m: Dictionary) -> void:
	m["done"] = true
	var mi: MeshInstance3D = m["mi"]
	var xf := mi.global_transform
	var faces := mi.mesh.get_faces()
	for i in range(0, faces.size(), 3):
		var a := xf * faces[i]
		var b := xf * faces[i + 1]
		var c := xf * faces[i + 2]
		if minf(a.y, minf(b.y, c.y)) > 1.0:
			continue
		# skip near-vertical faces (walls, kerb sides): not something to stand on
		var nrm := (b - a).cross(c - a)
		if nrm.length() < 1e-9 or absf(nrm.normalized().y) < 0.35:
			continue
		var x0 := int(floor(minf(a.x, minf(b.x, c.x)) / CELL))
		var x1 := int(floor(maxf(a.x, maxf(b.x, c.x)) / CELL))
		var z0 := int(floor(minf(a.z, minf(b.z, c.z)) / CELL))
		var z1 := int(floor(maxf(a.z, maxf(b.z, c.z)) / CELL))
		for cx in range(x0, x1 + 1):
			for cz in range(z0, z1 + 1):
				var k := Vector2i(cx, cz)
				if not _cells.has(k):
					_cells[k] = PackedVector3Array()
				var arr: PackedVector3Array = _cells[k]
				arr.append(a)
				arr.append(b)
				arr.append(c)
				_cells[k] = arr


## Highest drawn surface at (x, z) at or below `ymax` (0.0 when none).
func height(x: float, z: float, ymax: float = 0.9) -> float:
	var mk := Vector3i(int(round(x / MEMO)), int(round(z / MEMO)), int(round(ymax * 10.0)))
	if _memo.has(mk):
		return _memo[mk]
	for m in _meshes:
		if bool(m["done"]):
			continue
		var ab: AABB = m["aabb"]
		if x >= ab.position.x - 0.5 and x <= ab.end.x + 0.5 and z >= ab.position.z - 0.5 and z <= ab.end.z + 0.5:
			_bucket(m)
	var best := -INF
	var k := Vector2i(int(floor(x / CELL)), int(floor(z / CELL)))
	if _cells.has(k):
		var arr: PackedVector3Array = _cells[k]
		var o := Vector3(x, ymax + 0.001, z)
		for i in range(0, arr.size(), 3):
			var hit: Variant = Geometry3D.ray_intersects_triangle(o, Vector3.DOWN, arr[i], arr[i + 1], arr[i + 2])
			if hit != null:
				best = maxf(best, (hit as Vector3).y)
	var h := best if best > -INF else 0.0
	_memo[mk] = h
	return h


## The body's ground: the surface under a small footprint (centre and four
## points 0.13 m out, averaged), so the body rides up a 7 cm path edge over
## a quarter metre of travel instead of popping.
func body_height(x: float, z: float, ymax: float) -> float:
	var s := height(x, z, ymax) * 2.0
	for d in [Vector2(0.13, 0), Vector2(-0.13, 0), Vector2(0, 0.13), Vector2(0, -0.13)]:
		s += height(x + d.x, z + d.y, ymax)
	return s / 6.0
