class_name TrailerRoute
extends RefCounted
## A smooth ground route for a trailer actor: Catmull-Rom through the given
## points (x, z, optional y), resampled densely and parameterised by arc
## length, so an actor can be placed by distance travelled.

var pts := PackedVector3Array()
var cum := PackedFloat32Array()
var length := 0.0


static func make(points: Array, step: float = 0.25) -> TrailerRoute:
	var r := TrailerRoute.new()
	var ctrl: Array[Vector3] = []
	for p in points:
		var a: Array = p
		if a.size() >= 3:
			ctrl.append(Vector3(float(a[0]), float(a[2]), float(a[1])))
		else:
			ctrl.append(Vector3(float(a[0]), 0.0, float(a[1])))
	if ctrl.size() == 1:
		ctrl.append(ctrl[0] + Vector3(0, 0, -0.01))
	# centripetal-ish Catmull-Rom (uniform with clamped ends)
	var dense: Array[Vector3] = []
	for i in ctrl.size() - 1:
		var p0: Vector3 = ctrl[maxi(i - 1, 0)]
		var p1: Vector3 = ctrl[i]
		var p2: Vector3 = ctrl[i + 1]
		var p3: Vector3 = ctrl[mini(i + 2, ctrl.size() - 1)]
		if i == 0:
			p0 = p1 - (p2 - p1)
		if i + 2 >= ctrl.size():
			p3 = p2 + (p2 - p1)
		var seg_len := p1.distance_to(p2)
		var n := maxi(2, int(ceil(seg_len / step)))
		for k in n:
			var u := float(k) / float(n)
			dense.append(_cr(p0, p1, p2, p3, u))
	dense.append(ctrl[ctrl.size() - 1])
	r.pts = PackedVector3Array(dense)
	r.cum.resize(dense.size())
	var acc := 0.0
	r.cum[0] = 0.0
	for i in range(1, dense.size()):
		acc += dense[i].distance_to(dense[i - 1])
		r.cum[i] = acc
	r.length = acc
	return r


static func _cr(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, u: float) -> Vector3:
	var u2 := u * u
	var u3 := u2 * u
	return 0.5 * ((2.0 * p1) + (-p0 + p2) * u + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * u2 + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * u3)


## Position at distance s (extrapolates along the end tangents).
func at(s: float) -> Vector3:
	if s <= 0.0:
		return pts[0] + tangent(0.0) * s
	if s >= length:
		return pts[pts.size() - 1] + tangent(length) * (s - length)
	var lo := 0
	var hi := cum.size() - 1
	while hi - lo > 1:
		var mid := (lo + hi) >> 1
		if cum[mid] <= s:
			lo = mid
		else:
			hi = mid
	var seg := cum[hi] - cum[lo]
	var u := (s - cum[lo]) / maxf(seg, 0.0001)
	return pts[lo].lerp(pts[hi], u)


func tangent(s: float) -> Vector3:
	var a := clampf(s - 0.4, 0.0, length)
	var b := clampf(s + 0.4, 0.0, length)
	if b - a < 0.01:
		a = maxf(0.0, length - 0.8)
		b = length
	var d := _at_clamped(b) - _at_clamped(a)
	d.y = 0.0
	return d.normalized() if d.length() > 0.0001 else Vector3(0, 0, -1)


func _at_clamped(s: float) -> Vector3:
	var lo := 0
	var hi := cum.size() - 1
	s = clampf(s, 0.0, length)
	while hi - lo > 1:
		var mid := (lo + hi) >> 1
		if cum[mid] <= s:
			lo = mid
		else:
			hi = mid
	var seg := cum[hi] - cum[lo]
	return pts[lo].lerp(pts[hi], (s - cum[lo]) / maxf(seg, 0.0001))


## Distance travelled by time t for piecewise-linear speed keys [[t, v], ...]
## (constant before the first key and after the last).
static func dist(keys: Array, t: float) -> float:
	if keys.is_empty():
		return 0.0
	var t0 := float(keys[0][0])
	var v0 := float(keys[0][1])
	if t <= t0:
		return v0 * (t - t0)
	var s := 0.0
	for i in keys.size() - 1:
		var ta := float(keys[i][0])
		var va := float(keys[i][1])
		var tb := float(keys[i + 1][0])
		var vb := float(keys[i + 1][1])
		if t <= tb:
			var u := t - ta
			var dv := (vb - va) / maxf(tb - ta, 0.0001)
			return s + va * u + 0.5 * dv * u * u
		s += (va + vb) * 0.5 * (tb - ta)
	var last: Array = keys[keys.size() - 1]
	return s + float(last[1]) * (t - float(last[0]))


static func speed(keys: Array, t: float) -> float:
	if keys.is_empty():
		return 0.0
	if t <= float(keys[0][0]):
		return float(keys[0][1])
	for i in keys.size() - 1:
		var tb := float(keys[i + 1][0])
		if t <= tb:
			var ta := float(keys[i][0])
			return lerpf(float(keys[i][1]), float(keys[i + 1][1]), (t - ta) / maxf(tb - ta, 0.0001))
	return float(keys[keys.size() - 1][1])
