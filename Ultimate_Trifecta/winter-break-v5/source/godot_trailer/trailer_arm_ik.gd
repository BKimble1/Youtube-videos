class_name TrailerArmIK
extends SkeletonModifier3D
## Trailer-only hand contacts (V4): a two-bone IK on one arm that puts the
## wrist on a world target (another character's bone, a door's handle, a
## fixed point), blended in and out by a keyed weight on scene time.  The
## upper arm and forearm are re-solved keeping the animated elbow plane (the
## same solve as CharacterFootLock), nudged by a pole hint so elbows bend
## down and back like an arm reaching; the hand keeps its animated
## orientation.  Runs after TrailerPoseMod (added after it).

var side := "R"
var target := Vector3.ZERO      # world, set by the director every frame
var weight := 0.0               # 0..1, set by the director every frame
var pole_hint := Vector3(0, -1, 0.4)   # model space: where the elbow points
var _b := []


func _setup(sk: Skeleton3D) -> void:
	var ua := sk.find_bone("upper_arm." + side)
	_b = [sk.get_bone_parent(ua), ua, sk.find_bone("forearm." + side), sk.find_bone("hand." + side)]


func _process_modification() -> void:
	var sk := get_skeleton()
	if sk == null or weight <= 0.001:
		return
	if _b.is_empty():
		_setup(sk)
	if int(_b[1]) < 0:
		return
	var xf := sk.global_transform
	var inv := xf.affine_inverse()
	var gp := sk.get_bone_global_pose(int(_b[0]))
	var gt := sk.get_bone_global_pose(int(_b[1]))
	var gs := sk.get_bone_global_pose(int(_b[2]))
	var gh := sk.get_bone_global_pose(int(_b[3]))
	var h := gt.origin
	var k := gs.origin
	var a := gh.origin
	var tgt: Vector3 = inv * target
	tgt = a.lerp(tgt, clampf(weight, 0.0, 1.0))
	var la := h.distance_to(k)
	var lb := k.distance_to(a)
	var ht := tgt - h
	if ht.length() < 1e-5:
		return
	var d := clampf(ht.length(), absf(la - lb) + 1e-4, la + lb - 1e-4)
	var u := ht.normalized()
	var pole := (k - h) - (a - h).normalized() * (k - h).dot((a - h).normalized())
	pole = pole.normalized() * 0.5 + pole_hint.normalized() * 0.5
	pole = pole - u * pole.dot(u)
	if pole.length() < 1e-5:
		pole = Vector3(0, -1, 0) - u * u.y
	pole = pole.normalized()
	var cos_a := clampf((la * la + d * d - lb * lb) / (2.0 * la * d), -1.0, 1.0)
	var k2 := h + u * (la * cos_a) + pole * (la * sqrt(maxf(0.0, 1.0 - cos_a * cos_a)))
	var t2 := h + u * d
	var q1 := _arc((k - h).normalized(), (k2 - h).normalized())
	var bt := Basis(q1) * gt.basis
	var fdir := Basis(q1) * (a - k).normalized()
	var q2 := _arc(fdir.normalized(), (t2 - k2).normalized())
	var bs := Basis(q2) * Basis(q1) * gs.basis
	var bh := Basis(q2) * Basis(q1) * gh.basis
	sk.set_bone_pose_rotation(int(_b[1]), (gp.basis.inverse() * bt).get_rotation_quaternion())
	sk.set_bone_pose_rotation(int(_b[2]), (bt.inverse() * bs).get_rotation_quaternion())
	sk.set_bone_pose_rotation(int(_b[3]), (bs.inverse() * bh).get_rotation_quaternion())


static func _arc(from: Vector3, to: Vector3) -> Quaternion:
	var c := from.cross(to)
	var dt := from.dot(to)
	if c.length() < 1e-6:
		return Quaternion() if dt > 0.0 else Quaternion(Vector3.UP, PI)
	return Quaternion(c.normalized(), atan2(c.length(), dt))
