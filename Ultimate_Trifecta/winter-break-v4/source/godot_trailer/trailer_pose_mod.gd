class_name TrailerPoseMod
extends SkeletonModifier3D
## Trailer-only acting layer, applied after every game modifier (it is the
## skeleton's last child): small keyed bone rotations on top of the game's
## own animation (a look over the shoulder, a nod, a beckoning arm, a toe
## test, a hand to the dash).  Keys are in the character's model space
## (-Z forward, +X right): [pitch about X (+ tips the top back / swings a
## hanging arm forward), yaw about Y (+ turns left), roll about Z (+ moves a
## hanging limb toward +X)] in degrees, interpolated with smoothstep between
## keyframes on scene time.  `keys` = [[tau, {bone: [p, y, r]}, ease?], ...].
## A bone missing from a key is at rest (0) in that key.

var keys: Array = []
var tau := 0.0
var _idx: Dictionary = {}


func _bone(sk: Skeleton3D, n: String) -> int:
	if not _idx.has(n):
		_idx[n] = sk.find_bone(n)
	return int(_idx[n])


static func _ease(u: float, ez: String) -> float:
	match ez:
		"linear":
			return u
		"out":
			return 1.0 - pow(1.0 - u, 3.0)
		"in":
			return u * u * u
		"snap":
			return 1.0 - pow(1.0 - u, 5.0)
	return u * u * (3.0 - 2.0 * u)


## Interpolated offsets at scene time t: {bone: Vector3(p, y, r) degrees}.
static func sample(ks: Array, t: float) -> Dictionary:
	var out := {}
	if ks.is_empty():
		return out
	if t <= float(ks[0][0]):
		return _vals(ks[0][1])
	for i in ks.size() - 1:
		var t0 := float(ks[i][0])
		var t1 := float(ks[i + 1][0])
		if t <= t1:
			var u := clampf((t - t0) / maxf(t1 - t0, 0.0001), 0.0, 1.0)
			u = _ease(u, String(ks[i + 1][2]) if (ks[i + 1] as Array).size() > 2 else "")
			var a := _vals(ks[i][1])
			var b := _vals(ks[i + 1][1])
			for n in a:
				if not b.has(n):
					b[n] = Vector3.ZERO
			for n in b:
				out[n] = (a.get(n, Vector3.ZERO) as Vector3).lerp(b[n], u)
			return out
	return _vals(ks[ks.size() - 1][1])


static func _vals(d: Dictionary) -> Dictionary:
	var o := {}
	for n in d:
		var v: Array = d[n]
		o[String(n)] = Vector3(float(v[0]), float(v[1]), float(v[2]))
	return o


func _process_modification_with_delta(_delta: float) -> void:
	var sk := get_skeleton()
	if sk == null or keys.is_empty():
		return
	var off := sample(keys, tau)
	# parents first (the skeleton's bone order is parent-first)
	var order: Array = []
	for n in off:
		var b := _bone(sk, String(n))
		if b >= 0:
			order.append([b, off[n]])
	order.sort_custom(func(x: Array, y: Array) -> bool: return int(x[0]) < int(y[0]))
	for e in order:
		var v: Vector3 = e[1]
		if v.length_squared() < 1e-6:
			continue
		var q := Quaternion(Vector3.UP, deg_to_rad(v.y)) * Quaternion(Vector3.RIGHT, deg_to_rad(v.x)) * Quaternion(Vector3.BACK, deg_to_rad(v.z))
		CharacterSecondary._rotate_model(sk, int(e[0]), q)
