class_name TrailerShotsV5
extends RefCounted
## Development-only (src/dev is never exported): the official Ultimate
## Trifecta website trailer, V5 (shot ids start with "z"): V4's edit with the
## opening rebuilt (a real chase, a planted push-off, one ballistic,
## head-first arc and an entry splash, all in real time), the bush gag
## re-staged (the frog leaps from behind it, never through it), a proper
## pool dive, a real-time doorway dive with the Watch on the far side, and
## the V5 correction pass (see the website-trailer-v5 report).
##
## Edit (120 BPM, one bar = 2.0 s):
##   z01 chase 0.00   z02 leap 1.00    z03 reveal 2.25  z04 go 6.00
##   z05 bush 7.50    z06 cloak 9.50   z07 coins 10.75  z08 rift 12.00
##   z09 pool 13.25   z10 wall 15.00   z11 shield 16.00 z12 pond 17.00
##   z13 wardrobe 18.00  z14 party 20.00  z15 road 22.00  z16 home 24.00
##   z17 door 25.25   z18 safe 26.25   z19 logo 28.00

const RUN := 6.2
const TURBO := 7.6
const WATCH_RUN := 6.6

const HERO := TrailerShots.HERO
const WATCH := TrailerShotsWeb.WATCH
const WATCH2 := TrailerShotsWeb.WATCH2
const DUCKY := TrailerShotsWeb.DUCKY
const FROGGY := TrailerShotsWeb.FROGGY
const VARSITY := TrailerShotsWeb.VARSITY
const RAINCOAT := TrailerShotsWeb.RAINCOAT
const STARRY := TrailerShotsWeb.STARRY
const SCOUT := TrailerShotsWeb.SCOUT
const MOONLIGHT := TrailerShotsWeb.MOONLIGHT
const COURIER := TrailerShotsWeb.COURIER
const CLOUD := TrailerShotsWeb.CLOUD
const SWAP_1 := TrailerShotsWeb.SWAP_1
const SWAP_2 := TrailerShotsWeb.SWAP_2
const SWAP_3 := TrailerShotsWeb.SWAP_3

# faces (blend-shape offsets on top of the game's own states)
const F_DETERMINED := {"brow_angry": 0.7, "smile": -0.2}
const F_GLANCE := {"brow_up": 0.8, "open": 0.4}
const F_GLEE := {"smile": 0.9, "squint": 0.5, "open": 0.4}
const F_SLY := {"squint": 0.5, "smile": 0.4}
const F_SUSPICIOUS := {"squint": 0.6, "brow_angry": 0.6}
const F_SHOCK := {"brow_up": 1.0, "open": 0.8}

const BASE := {"snow": false, "festive": false, "cine": true, "wheel_k": 0.42,
	# a slimmer, softer golden beam (it marks the fountain; it shouldn't wash the plaza)
	"beacon_style": {"r0": 1.1, "r1": 0.6, "h": 40.0, "intensity": 0.34}}


static func _shot(d: Dictionary) -> Dictionary:
	var out := BASE.duplicate()
	for k in d:
		out[k] = d[k]
	return out


static func s0_for(pts: Array, t_end: float, v: float) -> float:
	return TrailerShots.s0_for(pts, t_end, v)


# ======================================================================
# The hook (z01..z03), rebuilt for V5: a real chase (the Night Watch gains
# on him), a planted push-off at the rim's jump point, one ballistic arc
# (constant gravity, no slow motion) that rotates head-first along its path,
# and an entry splash exactly where he meets the water.  Real time from the
# first frame to the splash on the bar (2.0).
const T_JUMP := 1.333      # take-off from the jump point (hook time = edit time)
const T_SPLASH := 2.0      # in the water, on the bar
const Z_TAKE := 13.9       # the fountain's own jump point is 14.2; the rim's plinth starts at 15.2
const Z_IN := 18.3         # clear of the near jets (they land on the diagonals) and the lower bowl
const V_AIR := (Z_IN - Z_TAKE) / (T_SPLASH - T_JUMP)
const F_CHASE := {"brow_angry": 1.0, "smile": -0.7, "squint": 0.25, "open": 0.25}


static func hook_actors(beam_glow := 0.1) -> Array:
	var t_run := T_JUMP - Z_TAKE / RUN
	var fl := T_SPLASH - T_JUMP
	var hero := {
		"id": "hero", "role": "runner", "look": HERO,
		"segs": [
			{"mode": "route", "t0": t_run, "pts": [[0.0, 0.0], [0.0, Z_TAKE], [0.0, Z_IN + 0.6]], "s0": 0.0,
				"speed": [[0.0, RUN], [Z_TAKE / RUN - 0.25, RUN], [Z_TAKE / RUN, V_AIR], [Z_TAKE / RUN + fl, V_AIR]]},
			{"mode": "splash", "t0": T_SPLASH, "pos": [0.0, 0.25, Z_IN], "yaw": PI, "impact": TC.Impact.DIVE, "len": 1.5},
			{"mode": "route", "t0": T_SPLASH + 1.5, "pts": [[0.0, 30.6], [0.0, 60.0]], "s0": 0.0, "speed": [[0.0, 2.0], [0.4, RUN]]},
		],
		"fx": [
			# the plant: the last stride sinks into the push-off
			{"type": "squash", "t": T_JUMP - 0.11, "v": 2.6},
			# one arc (gravity ~16 m/s^2): feet clear the rim's lip by ~0.2 m
			{"type": "jump", "t": T_JUMP, "dur": fl, "h": 0.9, "dy": 0.25},
			# the dive from the push-off (the game's jump-then-dive), rotating
			# from a slight lift to head-first at the water
			{"type": "dive", "t": T_JUMP + 0.18, "dur": fl - 0.18, "h": 0.0, "dy": 0.0},
			{"type": "pitch", "keys": [[T_JUMP, 0.0], [T_JUMP + 0.2, -12.0], [T_JUMP + 0.4, 2.0], [T_SPLASH, 36.0], [T_SPLASH + 0.02, 0.0]]},
			{"type": "burst", "t": T_SPLASH, "size": 0.85, "pos": [0.0, 0.25, Z_IN + 0.4]},
			{"type": "face", "t": -2.0, "dur": 2.3, "face": F_DETERMINED},
			{"type": "face", "t": 0.3, "dur": 0.45, "face": F_GLANCE, "ease": 0.08},
			{"type": "face", "t": T_JUMP - 0.3, "dur": 0.9, "face": F_GLEE}],
	}
	# the Night Watch: 1.7 m back at the first frame and gaining (6.6 against
	# 6.2); the lunge as he takes off closes on empty air, and he pulls up
	# short of the rim
	var t_tag := T_JUMP - 0.06
	var watch := {
		"id": "watch", "role": "watch", "look": WATCH, "beam_rig": true, "beam_fwd": 0.3, "beam_energy": 5.0,
		"glare": 0.0, "beam_glow": beam_glow, "beam_radius": 1.1,
		"beam_aim": [[-9.0, {"rel": "hero", "off": [0.0, 0.6, 0.0]}], [T_SPLASH, [0.0, 0.3, Z_IN]]],
		"segs": [{"mode": "route", "t0": -1.0, "pts": [[-0.7, -10.0], [-0.5, 14.6]], "s0": 7.38,
			"speed": [[0.0, 6.6], [t_tag + 1.0, 6.6], [t_tag + 1.13, 7.6], [t_tag + 1.28, 2.0], [t_tag + 1.48, 0.0]], "rest_yaw": PI}],
		"fx": [{"type": "tag", "t": t_tag, "miss": true},
			{"type": "face", "t": -2.0, "dur": t_tag + 2.3, "face": F_CHASE},
			{"type": "face", "t": t_tag + 0.3, "dur": 0.7, "face": F_SHOCK, "ease": 0.06},
			{"type": "emote", "t": T_SPLASH + 0.45, "name": "shrug", "dur": 1.6}],
	}
	return [hero, watch]


# ======================================================================
# The climax (z15..z18): a cart on the loop road chases the hero to
# Puddlesworth Hall; it brakes and slews to a stop at the bollards; the
# second Night Watch, on foot, closes from the lawn on his far side and
# lunges as he dives over the threshold (real time: one short dive, a
# landing and the game's dive recovery inside).  The payoff: the Watch,
# who can't tag anyone in here, joins the party.
const DOOR_TAU := 5.0
const HOME_PTS := [[0.0, 74.0], [0.0, 101.4], [1.0, 106.6]]


static func climax_actors() -> Array:
	var t_dive := DOOR_TAU - 0.35
	var hero := {
		"id": "hero", "role": "runner", "look": HERO,
		"segs": [{"mode": "route", "t0": t_dive - 27.4 / RUN, "pts": HOME_PTS, "s0": 0.0,
			"speed": [[0.0, RUN], [27.4 / RUN - 0.2, RUN], [27.4 / RUN, 7.0], [27.4 / RUN + 0.45, 6.6], [27.4 / RUN + 0.75, 1.2], [27.4 / RUN + 1.0, 0.0]],
			"rest_yaw": PI * 0.8}],
		"fx": [{"type": "squash", "t": t_dive - 0.1, "v": 2.2},
			{"type": "dive", "t": t_dive, "dur": 0.45, "h": 0.5, "dy": 0.0},
			{"type": "pitch", "keys": [[t_dive, 0.0], [t_dive + 0.12, -8.0], [t_dive + 0.42, 10.0], [t_dive + 0.47, 0.0]]},
			{"type": "face", "t": 0.0, "dur": t_dive, "face": F_DETERMINED},
			{"type": "face", "t": t_dive - 1.0, "dur": 0.5, "face": F_GLANCE, "ease": 0.08},
			{"type": "confetti", "t": t_dive + 0.5}, {"type": "celebrate", "t": DOOR_TAU + 0.6, "dur": 3.0},
			{"type": "emote", "t": DOOR_TAU + 0.85, "name": "cheer", "dur": 2.4}],
	}
	# east to west along the loop road; braking over 1.1 s (not a wall), it
	# slews toward the bollards
	var cart_pts := [[60.0, 87.6], [6.0, 87.6], [-1.0, 88.4], [-6.0, 90.0]]
	var hero_cross_t := t_dive - (101.4 - 88.0) / RUN
	var cart := {"id": "cart", "index": 0, "pts": cart_pts, "t0": hero_cross_t + 0.1 - 57.8 / 11.0, "s0": 0.0,
		"speed": [[0.0, 11.0], [57.8 / 11.0, 11.0], [57.8 / 11.0 + 1.1, 0.0]]}
	var stop_t := float(cart["t0"]) + 57.8 / 11.0 + 1.1
	var driver := {"id": "driver", "role": "watch", "look": WATCH2, "segs": [{"mode": "cart", "t0": -9.0, "cart": "cart"}],
		"fx": [{"type": "face", "t": -9.0, "dur": 20.0, "face": F_DETERMINED},
			{"type": "emote", "t": stop_t + 0.2, "name": "point", "dur": 1.4}]}
	# the Watch on foot comes in on the hero's far side (+x) and stops 1.5 m
	# short of the door: never in front of him, never through him
	var w_pts := [[14.0, 93.0], [6.0, 97.6], [2.4, 100.2], [1.2, 101.1]]
	var w_len := TrailerRoute.make(w_pts).length
	var t_tag := DOOR_TAU - 0.38
	var t_w := t_tag - (w_len - 1.9) / 7.0
	var watch := {
		"id": "watch", "role": "watch", "look": WATCH, "beam_rig": true, "beam_fwd": 0.3, "beam_energy": 5.0,
		"glare": 0.0, "beam_glow": 0.05, "beam_radius": 1.1,
		"beam_aim": [[-9.0, {"rel": "hero", "off": [0.0, 0.4, 0.0]}], [DOOR_TAU + 0.6, [0.0, 0.6, 107.0]]],
		"segs": [{"mode": "route", "t0": t_w, "pts": w_pts, "s0": 0.0,
				"speed": [[0.0, 7.0], [(w_len - 1.9) / 7.0, 7.0], [(w_len - 1.9) / 7.0 + 0.3, 3.0], [(w_len - 1.9) / 7.0 + 0.55, 0.0]], "rest_yaw": PI},
			# then, deflated, he steps into the doorway (he can't come in)
			{"mode": "route", "t0": DOOR_TAU + 0.35, "pts": [[1.2, 101.1], [0.5, 102.4]], "s0": 0.0,
				"speed": [[0.0, 0.0], [0.3, 1.6], [1.0, 1.6], [1.2, 0.0]], "rest_yaw": PI}],
		"fx": [{"type": "tag", "t": t_tag, "miss": true},
			{"type": "face", "t": -9.0, "dur": DOOR_TAU + 9.0, "face": F_DETERMINED},
			{"type": "face", "t": t_tag + 0.3, "dur": 0.7, "face": F_SHOCK, "ease": 0.06},
			{"type": "emote", "t": DOOR_TAU + 0.45, "name": "shrug", "dur": 0.7},
			# the payoff, on the music's stop (27.5): he can't tag anyone in
			# here... so he joins the party
			{"type": "emote", "t": DOOR_TAU + 1.3, "name": "moon_shuffle", "dur": 3.0},
			{"type": "face", "t": DOOR_TAU + 1.3, "dur": 3.0, "face": {"brow_angry": -0.7, "smile": 0.5}}],
	}
	return [{"cart": cart}, hero, watch, driver]


static func _climax(dur: float, tau0: float, cam: Array, extra: Dictionary = {}) -> Dictionary:
	var ca := climax_actors()
	var d := {"dur": dur, "tau0": tau0, "carts": [ca[0]["cart"]], "actors": [ca[1], ca[2], ca[3]],
		"home_doors": "puddlesworth", "door_glow": 0.1, "beacons": ["fountain"], "far": true, "cam": cam}
	for k in extra:
		d[k] = extra[k]
	return _shot(d)


static func _friend(id: String, look: Dictionary, pos: Array, face_to: Variant, fx: Array, lighting := "indoor") -> Dictionary:
	var yaw := 0.0
	if face_to is Array:
		var ft: Array = face_to
		yaw = atan2(-(float(ft[0]) - float(pos[0])), -(float(ft[1]) - float(pos[1])))
	else:
		yaw = float(face_to)
	return {"id": id, "role": "runner", "look": look, "lighting": lighting,
		"segs": [{"mode": "hold", "t0": -9.0, "pos": [pos[0], 0.0, pos[1]], "yaw": yaw}], "fx": fx}


# ======================================================================
static func get_shot(id: String) -> Dictionary:
	match id:
		"z01_chase":
			# 0.00-1.00: low and just ahead of the hero as he sprints at us,
			# the Night Watch gaining on him, flashlight on his back; a glance
			# over his shoulder.  The camera eases off as he nears the rim and
			# stays outside it (0.8 m clear of the plinth at the cut)
			return _shot({
				"dur": 1.0, "tau0": 0.0, "active_waters": ["fountain"], "beacons": ["fountain"],
				"actors": hook_actors(),
				"cam": [
					{"t": 0.0, "pos": {"rel": "hero", "off": [0.95, 0.6, -3.4]}, "at": {"rel": "hero", "off": [-0.25, 0.95, 0.9]}, "fov": 40.0, "roll": -1.5},
					{"t": 1.0, "pos": {"rel": "hero", "off": [0.75, 0.6, -2.55]}, "at": {"rel": "hero", "off": [-0.1, 0.95, 0.6]}, "fov": 40.0, "roll": 1.0},
				],
				"dof": {"focus_on": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "far_off": 3.0, "amount": 0.01},
			})
		"z02_leap":
			# 1.00-2.25: in profile from the Night Watch's side, outside the
			# basin: the last strides, the plant, the push-off, one arc over the
			# rim as his lunge falls short, head-first into the water on the bar
			# (2.0).  Real time throughout; the near jets stay off the line
			return _shot({
				"dur": 1.25, "tau0": 1.0, "active_waters": ["fountain"], "beacons": ["fountain"],
				"actors": hook_actors(0.025),
				"cam": [
					{"t": 0.0, "pos": [-4.0, 0.8, 12.2], "at": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "fov": 42.0},
					{"t": 0.55, "pos": [-4.3, 0.95, 13.9], "at": {"rel": "hero", "off": [0.0, 0.6, 0.0]}, "fov": 42.0},
					{"t": 1.25, "pos": [-4.6, 1.35, 15.3], "at": [0.0, 0.45, 18.5], "fov": 42.0},
				],
				"dof": {"focus_on": {"rel": "hero", "off": [0.0, 0.8, 0.0]}, "far_off": 4.0, "amount": 0.008},
			})
		"z03_reveal":
			# 2.25-6.00: low in the basin on the settling splash, then up the
			# golden beam and out over Moonbrook College: the tower, the halls'
			# lit windows, carts on the roads, other runners on the paths.  It
			# reaches the aerial view sooner and keeps drifting (no dead hold)
			return _shot({
				"dur": 3.75, "tau0": T_SPLASH + 0.25, "active_waters": ["fountain", "pond", "pool"], "beacons": ["fountain", "pond", "pool"], "far": true,
				"actors": hook_actors() + [
					{"id": "far1", "role": "runner", "look": DUCKY, "segs": [{"mode": "route", "t0": 0.0, "pts": [[-30.0, 3.0], [-21.0, 5.2], [-9.4, 13.6]], "s0": 0.0, "speed": [[0.0, RUN]]}]},
					{"id": "far2", "role": "runner", "look": VARSITY, "segs": [{"mode": "route", "t0": 0.0, "pts": [[24.0, 40.0], [24.0, 70.0]], "s0": 0.0, "speed": [[0.0, RUN]]}]},
					{"id": "far3", "role": "runner", "look": STARRY, "segs": [{"mode": "route", "t0": 0.0, "pts": [[36.0, 30.0], [64.0, 20.0]], "s0": 0.0, "speed": [[0.0, RUN]]}]},
				],
				"carts": [{"id": "c1", "index": 0, "pts": [[78.0, -40.0], [78.0, 88.0], [-78.0, 88.0]], "s0": 20.0, "speed": [[0.0, 10.0]]},
					{"id": "c2", "index": 1, "pts": [[-78.0, 60.0], [-78.0, -14.0], [78.0, -14.0]], "s0": 52.0, "speed": [[0.0, 10.0]]}],
				"cam": [
					{"t": 0.0, "pos": [2.6, 0.9, 20.9], "at": [0.0, 0.55, 18.4], "fov": 42.0},
					{"t": 0.75, "pos": [5.0, 2.5, 12.6], "at": [0.0, 6.0, 22.0], "fov": 46.0},
					{"t": 2.0, "pos": [14.0, 15.0, -10.0], "at": [-2.0, 5.5, 30.0], "fov": 48.0, "ease": "inout"},
					{"t": 3.75, "pos": [24.0, 22.5, -32.0], "at": [-6.0, 2.5, 44.0], "fov": 49.0},
				],
			})
		"z04_go":
			# 6.00-7.50: THE DROP.  Low on the path at Puddlesworth Hall: GO,
			# and tonight's runners burst out of the glowing door at us,
			# each their own way, and scatter past the lens
			var go_runners := []
			var cast := [[HERO, 0.0, 105.6, 0.0, [-1.2, 92.0], F_DETERMINED], [DUCKY, -1.4, 107.0, 0.12, [-6.5, 93.5], F_GLEE],
				[VARSITY, 1.3, 106.6, 0.08, [4.8, 92.5], F_SLY], [RAINCOAT, -0.6, 108.6, 0.3, [-3.5, 90.0], F_GLEE],
				[STARRY, 1.0, 109.0, 0.38, [7.0, 94.0], F_GLANCE], [SCOUT, 0.2, 110.2, 0.52, [2.4, 89.5], F_DETERMINED]]
			for i in cast.size():
				var c: Array = cast[i]
				var x0 := float(c[1])
				var z0 := float(c[2])
				var go := float(c[3])
				var xo: float = [-0.4, -0.7, 0.6, -0.2, 0.5, 0.1][i]
				var pts := [[x0, z0], [xo, 104.4], [xo, 102.2], c[4]]
				var fxs := [{"type": "face", "t": -2.0, "dur": 6.0, "face": c[5]}]
				if i == 1:
					fxs.append({"type": "jump", "t": go + 0.75, "dur": 0.45, "h": 0.6})
				# hero: off like a shot; Ducky: bouncy (a hop on the step); Varsity:
				# the fastest, cocky; Raincoat: a fumbled start; Starry: looks back
				# at the door; Scout: steady and determined
				var spd: Array = [[[0.0, 0.0], [0.16, 6.6]], [[0.0, 0.0], [0.25, 5.8]], [[0.0, 0.0], [0.2, 7.2]],
					[[0.0, 0.0], [0.15, 2.0], [0.35, 1.2], [0.55, 6.0]], [[0.0, 0.0], [0.3, 5.6]], [[0.0, 0.0], [0.22, 6.2]]][i]
				if i == 4:
					fxs.append({"type": "face", "t": go + 0.5, "dur": 0.5, "face": F_GLANCE})
				go_runners.append({"id": "r%d" % i, "role": "runner", "look": c[0],
					"segs": [{"mode": "hold", "t0": -5.0, "pos": [x0, 0.0, z0], "yaw": 0.0},
						{"mode": "route", "t0": go, "pts": pts, "s0": 0.0, "speed": spd}], "fx": fxs})
			return _shot({
				"dur": 1.5, "tau0": 0.0, "home_doors": "puddlesworth", "door_glow": 0.3, "beacons": ["fountain"], "active_waters": ["fountain"], "far": true,
				"actors": go_runners,
				"cam": [
					{"t": 0.0, "pos": [0.7, 0.42, 97.6], "at": [0.0, 1.35, 103.0], "fov": 46.0},
					{"t": 1.5, "pos": [0.6, 0.45, 96.6], "at": [0.0, 1.25, 101.0], "fov": 50.0},
				],
			})
		"z05_bush":
			# 7.50-9.50: a Night Watch strolls up the path and stops by a bush;
			# he turns to it, squinting, and steps in, flashlight on it.  It
			# twitches.  He freezes... and decides it's nothing: a shrug, and
			# he turns his back and walks on.  As he turns, a Frog Onesie (hiding
			# behind it, out of sight) springs up and over the top, lands in
			# front of us and gives a cheeky shush
			return _shot({
				"dur": 2.0, "tau0": 0.0, "home_doors": "puddlesworth", "door_glow": 0.3,
				"props": [{"id": "bush", "kind": "bush", "pos": [-2.4, 65.6], "rustle": [0.58, 0.84], "puff": false}],
				"actors": [
					{"id": "watch", "role": "watch", "look": WATCH2, "beam_rig": true, "beam_fwd": 0.3, "beam_energy": 3.5,
						"glare": 0.0, "beam_glow": 0.08, "beam_radius": 1.0,
						"beam_aim": [[-9.0, [0.4, 0.0, 70.0]], [0.05, [0.4, 0.0, 70.0]], [0.4, [-2.4, 0.7, 65.6]], [0.85, [-2.3, 0.6, 65.7]], [1.15, [0.4, 0.0, 74.0]]],
						"segs": [
							# in at a stroll, easing to a stop beside the bush
							{"mode": "route", "t0": -2.0, "pts": [[0.4, 57.6], [0.4, 64.9]], "s0": 0.0, "speed": [[0.0, 3.6], [1.85, 3.6], [2.2, 0.0]], "rest_yaw": PI},
							# a half step toward the bush to peer at it
							{"mode": "route", "t0": 0.38, "pts": [[0.4, 64.9], [0.05, 65.0]], "s0": 0.0, "speed": [[0.0, 0.0], [0.1, 1.4], [0.25, 0.0]], "yaw": PI},
							# and away up the path
							{"mode": "route", "t0": 0.98, "pts": [[0.05, 65.0], [0.35, 66.2], [0.4, 78.0]], "s0": 0.0, "speed": [[0.0, 0.0], [0.35, 3.4]], "rest_yaw": PI},
						],
						"fx": [
							# the turn to the bush as he stops, and the eased turn away
							{"type": "turn", "t": 0.08, "dur": 0.36, "yaw": PI * 0.5, "until": 0.9, "back": 0.32},
							{"type": "face", "t": 0.25, "dur": 0.45, "face": F_SUSPICIOUS, "ease": 0.15},
							{"type": "face", "t": 0.6, "dur": 0.2, "face": F_GLANCE, "ease": 0.05},
							{"type": "emote", "t": 0.72, "name": "shrug", "dur": 0.5},
							{"type": "face", "t": 0.72, "dur": 0.5, "face": {"brow_up": 0.5, "smile": 0.2}}]},
					# behind the bush (fully hidden from the lens), she crouches
					# (the second rustle), springs up and over its crown (feet clear
					# it by 0.2 m) and lands facing us
					{"id": "frog", "role": "runner", "look": FROGGY, "appear": 0.5,
						"segs": [
							{"mode": "hold", "t0": -5.0, "pos": [-1.66, 0.0, 67.02], "yaw": 0.56},
							{"mode": "route", "t0": 0.9, "pts": [[-1.66, 67.02], [-3.44, 64.18]], "s0": 0.0, "speed": [[0.0, 5.24], [0.64, 5.24], [0.68, 0.0]], "rest_yaw": 0.4},
						],
						"fx": [{"type": "squash", "t": 0.82, "v": 3.0},
							{"type": "jump", "t": 0.9, "dur": 0.64, "h": 1.48},
							{"type": "pitch", "keys": [[0.9, 0.0], [1.05, -8.0], [1.4, 6.0], [1.54, 0.0]]},
							{"type": "emote", "t": 1.56, "name": "shush", "dur": 1.4},
							{"type": "face", "t": 0.9, "dur": 1.2, "face": {"squint": 0.55, "smile": 0.7, "brow_angry": 0.3}}]},
				],
				"cam": [
					{"t": 0.0, "pos": [-4.6, 0.95, 61.4], "at": [-0.6, 1.2, 66.2], "fov": 34.0},
					{"t": 0.85, "pos": [-4.55, 0.95, 61.55], "at": [-1.4, 1.2, 65.9], "fov": 32.0, "ease": "inout"},
					{"t": 2.0, "pos": [-4.5, 0.95, 61.7], "at": [-2.9, 0.95, 64.6], "fov": 30.0},
				],
				"dof": {"focus_on": [-1.6, 1.0, 65.0], "far_off": 4.0, "amount": 0.006},
			})
		"z06_cloak":
			# 9.50-10.75: the same Night Watch walks on and his beam swings onto
			# a Starry Sleeper; she throws on the Invisibility Cloak and, to
			# him, fades to nothing (a clean fade, no puff)
			return _shot({
				"dur": 1.25, "tau0": 0.0,
				"actors": [
					{"id": "watch", "role": "watch", "look": WATCH2, "beam_rig": true, "beam_fwd": 0.3, "beam_energy": 5.0,
						"glare": 0.0, "beam_glow": 0.14, "beam_radius": 1.2,
						"beam_aim": [[-9.0, [3.5, 0.3, 0.5]], [0.0, [2.4, 0.4, -0.6]], [0.2, [0.2, 0.8, -1.6]], [1.25, [0.2, 0.6, -1.8]]],
						"segs": [{"mode": "hold", "t0": -5.0, "pos": [1.6, 0.0, 1.2], "yaw": 0.45}],
						"fx": [{"type": "turn", "t": -0.2, "dur": 0.35, "face": [0.2, -1.6], "until": 9.0},
							{"type": "emote", "t": 0.7, "name": "shrug", "dur": 1.4}, {"type": "face", "t": 0.5, "dur": 1.0, "face": F_SHOCK}]},
					{"id": "starry", "role": "runner", "look": STARRY, "vanish": 0.66,
						"segs": [{"mode": "hold", "t0": -5.0, "pos": [0.2, 0.0, -1.6], "yaw": 2.7}],
						"fx": [{"type": "spotted", "t": 0.18, "dur": 0.3},
							{"type": "face", "t": 0.24, "dur": 0.4, "face": F_SLY}, {"type": "fade", "t": 0.38, "dur": 0.26}]},
				],
				"cam": [
					{"t": 0.0, "pos": [4.7, 1.15, -2.0], "at": [1.1, 1.0, -0.1], "fov": 36.0},
					{"t": 1.25, "pos": [4.55, 1.13, -1.9], "at": [0.9, 0.95, -0.2], "fov": 34.0},
				],
			})
		"z07_coins":
			# 10.75-12.00: low alongside a Varsity Sprinter sweeping a line of
			# coins, very pleased with himself
			return _shot({
				"dur": 1.25, "tau0": 0.0,
				"props": [{"id": "coins", "kind": "coins", "coin_glow": 0.3, "pts": [[15.0, 22.0], [17.5, 22.0], [20.0, 22.0], [22.5, 22.0], [25.0, 22.0], [27.5, 22.0]],
					"take": [[0, 0.05], [1, 0.45], [2, 0.86], [3, 1.26], [4, 1.66], [5, 2.06]]}],
				"actors": [
					{"id": "varsity", "role": "runner", "look": VARSITY,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[10.0, 22.0], [40.0, 22.0]], "s0": 4.7, "speed": [[0.0, RUN]]}],
						"fx": [{"type": "face", "t": -1.0, "dur": 4.0, "face": F_GLEE}]},
				],
				"cam": [
					{"t": 0.0, "pos": {"rel": "varsity", "off": [-3.4, 0.5, -1.6]}, "at": {"rel": "varsity", "off": [0.0, 0.85, -0.5]}, "fov": 34.0, "roll": -2.0},
					{"t": 1.25, "pos": {"rel": "varsity", "off": [-3.2, 0.48, -2.4]}, "at": {"rel": "varsity", "off": [0.2, 0.85, 0.3]}, "fov": 34.0, "roll": 1.0},
				],
				"dof": {"focus_on": {"rel": "varsity", "off": [0.0, 0.9, 0.0]}, "far_off": 2.0, "amount": 0.01},
			})
		"z08_rift":
			# 12.00-13.25: tracking low beside the hero: he grabs Speed
			# Sneakers on the run, kicks into turbo and dives through a rift,
			# which snaps shut (13.0)
			return _shot({
				"dur": 1.25, "tau0": 0.0,
				"props": [{"id": "rift", "kind": "rift", "pos": [-36.0, 25.0], "yaw": PI * 0.5, "open_t": -3.0, "close_t": 1.0},
					{"id": "holo", "kind": "holo", "item": "turbo", "pos": [-30.3, 25.05], "take_t": 0.22}],
				"actors": [
					{"id": "hero", "role": "runner", "look": HERO, "vanish": 0.95,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[-18.0, 25.3], [-27.0, 25.0], [-36.6, 25.0]], "s0": 10.7, "speed": [[0.0, RUN], [0.22, TURBO + 0.4]]}],
						"fx": [{"type": "dive", "t": 0.58, "dur": 0.42, "h": 0.6}, {"type": "pitch", "keys": [[0.58, 0.0], [0.72, -8.0], [1.0, 8.0]]},
							{"type": "face", "t": -1.0, "dur": 1.8, "face": F_GLEE}]},
				],
				"cam": [
					{"t": 0.0, "pos": [-25.6, 0.75, 28.2], "at": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "fov": 40.0},
					{"t": 0.5, "pos": [-26.2, 0.75, 28.4], "at": {"rel": "hero", "off": [-0.5, 0.9, 0.0]}, "fov": 40.0},
					{"t": 1.25, "pos": [-28.4, 0.8, 28.8], "at": [-36.0, 1.4, 25.0], "fov": 38.0, "ease": "out"},
				],
			})
		"z09_pool":
			# 13.25-15.00: across campus a rift spits him out by the pool's gate;
			# still on Speed Sneakers he sprints in, plants at the deck's edge
			# and dives in an arc (0.5 m over the coping), head-first, into a
			# splash at the point of entry
			var t_to := (105.4 - 95.6) / 8.6
			var t_in := t_to + 0.49
			return _shot({
				"dur": 1.75, "tau0": 0.12, "active_waters": ["pool"], "beacons": ["pool"],
				"props": [{"id": "rift2", "kind": "rift", "pos": [95.0, 32.0], "yaw": PI * 0.5, "open_t": -3.0, "close_t": 0.4}],
				"actors": [
					{"id": "hero", "role": "runner", "look": HERO, "appear": 0.0,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[95.6, 32.0], [105.4, 32.0], [110.4, 32.0]], "s0": 0.0, "speed": [[0.0, 8.6]]},
							{"mode": "splash", "t0": t_in, "pos": [109.6, -0.4, 32.0], "yaw": -PI * 0.5, "impact": TC.Impact.DIVE, "len": 1.5}],
						"fx": [{"type": "squash", "t": t_to - 0.1, "v": 2.4},
							{"type": "jump", "t": t_to, "dur": 0.49, "h": 0.72, "dy": -0.4},
							{"type": "dive", "t": t_to + 0.12, "dur": 0.37, "h": 0.0, "dy": 0.0},
							{"type": "pitch", "keys": [[t_to, 0.0], [t_to + 0.12, -10.0], [t_to + 0.3, 6.0], [t_in, 40.0], [t_in + 0.02, 0.0]]},
							{"type": "burst", "t": t_in, "size": 0.8, "pos": [110.0, -0.4, 32.0]},
							{"type": "face", "t": -1.0, "dur": 3.0, "face": F_GLEE}]},
				],
				"cam": [
					{"t": 0.0, "pos": [103.4, 0.55, 34.9], "at": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "fov": 40.0},
					{"t": 0.9, "pos": [103.6, 0.58, 35.1], "at": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "fov": 40.0},
					{"t": 1.75, "pos": [104.0, 0.6, 35.2], "at": [109.8, 0.2, 32.0], "fov": 38.0},
				],
			})
		"z10_wall":
			# 15.00-16.00: a cart roars up the loop road behind the hero; he
			# hops the low stone wall right over the lens; the cart can't follow
			var c_pts := [[77.4, -2.0], [77.2, 8.0], [75.8, 12.0], [72.0, 15.0], [66.0, 19.0]]
			var wall_s := 10.0 + 4.24 + 1.62
			return _shot({
				"dur": 1.0, "tau0": 0.25,
				"carts": [{"id": "cart", "index": 1, "pts": [[78.6, -40.0], [78.6, 40.0]], "s0": 48.0 - 10.5 * 0.7 + 1.5, "speed": [[0.0, 10.5], [0.8, 10.5], [1.25, 0.0]]}],
				"actors": [
					{"id": "drv", "role": "watch", "look": WATCH2, "segs": [{"mode": "cart", "t0": -5.0, "cart": "cart"}], "fx": [{"type": "face", "t": -5.0, "dur": 9.0, "face": F_DETERMINED}]},
					{"id": "hero", "role": "runner", "look": HERO,
						"segs": [{"mode": "route", "t0": 0.0, "pts": c_pts, "s0": wall_s - RUN * 0.7, "speed": [[0.0, RUN]]}],
						"fx": [{"type": "jump", "t": 0.45, "dur": 0.5, "h": 0.85}, {"type": "face", "t": -1.0, "dur": 1.4, "face": F_DETERMINED},
							{"type": "face", "t": 0.45, "dur": 0.6, "face": F_GLEE}]},
				],
				"cam": [
					{"t": 0.0, "pos": [71.2, 0.5, 15.8], "at": [77.4, 1.0, 5.0], "fov": 46.0},
					{"t": 0.7, "pos": [71.0, 0.52, 16.0], "at": {"rel": "hero", "off": [0.0, 1.0, 0.0]}, "fov": 48.0},
					{"t": 1.25, "pos": [70.6, 0.55, 16.4], "at": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "fov": 46.0},
				],
			})
		"z11_shield":
			# 16.00-17.00: a Pillow Shield: the tag bounces right off a
			# grinning Lantern Scout
			return _shot({
				"dur": 1.0, "tau0": 0.0,
				"actors": [
					{"id": "scout", "role": "runner", "look": SCOUT,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[24.0, 40.0], [24.0, 60.0]], "s0": 2.6, "speed": [[0.0, 6.4]]}],
						"fx": [{"type": "protect", "t": -2.0, "dur": 5.0}, {"type": "face", "t": 0.3, "dur": 1.0, "face": F_SLY}]},
					{"id": "watch", "role": "watch", "look": WATCH,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[24.0, 40.0], [24.0, 60.0]], "s0": 0.6, "speed": [[0.0, 6.6], [0.34, 8.0], [0.5, 1.6], [0.8, 0.6]]}],
						"fx": [{"type": "tag", "t": 0.14, "miss": true}, {"type": "bump", "t": 0.36}, {"type": "face", "t": 0.0, "dur": 0.36, "face": F_DETERMINED},
							{"type": "face", "t": 0.36, "dur": 0.64, "face": F_SHOCK}]},
				],
				"cam": [
					{"t": 0.0, "pos": [27.0, 0.6, 46.0], "at": [24.0, 1.0, 43.2], "fov": 40.0},
					{"t": 1.0, "pos": [27.2, 0.7, 48.8], "at": [24.0, 1.0, 47.8], "fov": 40.0},
				],
			})
		"z12_pond":
			# 17.00-18.00: the hero cannonballs into Froggy Pond (17.5), grinning
			return _shot({
				"dur": 1.0, "tau0": -0.25, "active_waters": ["pond"], "beacons": ["pond"],
				"actors": [
					{"id": "hero", "role": "runner", "look": HERO,
						"segs": [{"mode": "route", "t0": -3.0, "pts": [[-88.0, 46.0], [-107.6, 46.0], [-112.4, 46.0]], "s0": s0_for([[-88.0, 46.0], [-107.6, 46.0], [-112.4, 46.0]], 3.5, RUN), "speed": [[0.0, RUN]]},
							{"mode": "splash", "t0": 0.5, "pos": [-112.4, -0.35, 46.0], "yaw": PI * 0.5, "impact": TC.Impact.JUMP, "len": 1.5}],
						"fx": [{"type": "jump", "t": -0.16, "dur": 0.66, "h": 1.0, "dy": -0.35}, {"type": "burst", "t": 0.5, "size": 0.55, "pos": [-112.4, -0.35, 46.0]},
							{"type": "face", "t": -0.3, "dur": 0.8, "face": F_GLEE}]},
				],
				"cam": [
					{"t": 0.0, "pos": [-116.8, 0.02, 48.4], "at": [-109.6, 1.2, 46.0], "fov": 34.0},
					{"t": 1.0, "pos": [-116.5, 0.06, 48.2], "at": [-112.0, 0.6, 46.1], "fov": 32.0},
				],
			})
		"z13_wardrobe":
			# 18.00-20.00: the party room.  The hero tries on looks, one per
			# beat, and his friends react to each (they face him, not us)
			return _shot({
				"dur": 2.0, "tau0": 0.0, "world": "dorm",
				"actors": [
					{"id": "hero", "role": "runner", "look": HERO, "segs": [{"mode": "hold", "t0": -5.0, "pos": [0.0, 0.0, 1.75], "yaw": PI + 0.25}],
						"fx": [{"type": "emote", "t": -0.3, "name": "dance", "dur": 3.0},
							{"type": "spin", "t": 0.36, "dur": 0.28}, {"type": "swap", "t": 0.5, "look": SWAP_1, "poof": false},
							{"type": "spin", "t": 0.86, "dur": 0.28, "dir": -1.0}, {"type": "swap", "t": 1.0, "look": SWAP_2, "poof": false},
							{"type": "spin", "t": 1.36, "dur": 0.28}, {"type": "swap", "t": 1.5, "look": SWAP_3, "poof": false},
							{"type": "squash", "t": 0.62, "v": 1.4}, {"type": "squash", "t": 1.12, "v": 1.4}, {"type": "squash", "t": 1.62, "v": 1.6}]},
					_friend("f1", DUCKY, [-1.3, 1.1], [0.0, 1.75], [{"type": "emote", "t": 0.05, "name": "point", "dur": 0.9}, {"type": "emote", "t": 1.0, "name": "laugh", "dur": 1.2}]),
					_friend("f2", STARRY, [1.35, 0.9], [0.0, 1.75], [{"type": "emote", "t": 0.55, "name": "cheer", "dur": 1.0}, {"type": "emote", "t": 1.55, "name": "wave", "dur": 1.0}]),
					_friend("f3", FROGGY, [0.7, -0.5], [0.0, 1.75], [{"type": "emote", "t": 0.55, "name": "shrug", "dur": 0.45}, {"type": "emote", "t": 1.05, "name": "laugh", "dur": 1.4}]),
				],
				"cam": [
					{"t": 0.0, "pos": [0.9, 1.2, 4.9], "at": [0.0, 0.95, 1.6], "fov": 32.0},
					{"t": 2.0, "pos": [0.35, 1.15, 4.4], "at": [0.0, 0.92, 1.6], "fov": 30.0},
				],
				"near": 0.05,
				"dof": {"focus_on": {"rel": "hero", "off": [0.0, 1.0, 0.0]}, "far_off": 1.6, "amount": 0.01},
			})
		"z14_party":
			# 20.00-22.00: wider: the room in full swing, friends in twos
			# (a dance-off, a joke, a show-off); on the stop (21.5) the hero
			# turns to us and points: you're next
			return _shot({
				"dur": 2.0, "tau0": 0.0, "world": "dorm",
				"actors": [
					{"id": "hero", "role": "runner", "look": SWAP_3, "segs": [{"mode": "hold", "t0": -5.0, "pos": [0.0, 0.0, 1.9], "yaw": PI + 1.1}],
						"fx": [{"type": "emote", "t": -0.4, "name": "moon_shuffle", "dur": 1.9}, {"type": "turn", "t": 1.3, "dur": 0.25, "yaw": PI, "until": 9.0},
							{"type": "emote", "t": 1.5, "name": "point", "dur": 1.2}]},
					_friend("f1", DUCKY, [-1.9, 1.0], [-0.9, 0.2], [{"type": "emote", "t": -0.3, "name": "dance", "dur": 3.0}]),
					_friend("f3", FROGGY, [-0.9, 0.2], [-1.9, 1.0], [{"type": "emote", "t": -0.2, "name": "dance", "dur": 3.0}]),
					_friend("f2", STARRY, [1.6, 0.9], [2.6, 0.0], [{"type": "emote", "t": 0.2, "name": "laugh", "dur": 2.0}]),
					_friend("f5", CLOUD, [2.6, 0.0], [1.6, 0.9], [{"type": "emote", "t": -0.1, "name": "point", "dur": 1.0}, {"type": "emote", "t": 0.9, "name": "laugh", "dur": 1.5}]),
					_friend("f4", MOONLIGHT, [0.9, -0.6], [0.0, 1.9], [{"type": "emote", "t": -0.5, "name": "victory_lap", "dur": 3.0}]),
				],
				"cam": [
					{"t": 0.0, "pos": [2.4, 1.55, 6.9], "at": [0.3, 1.0, 0.6], "fov": 36.0},
					{"t": 1.5, "pos": [1.1, 1.38, 6.1], "at": [0.0, 0.95, 0.9], "fov": 34.0, "ease": "out"},
					{"t": 2.0, "pos": [1.0, 1.36, 6.0], "at": [0.0, 0.95, 1.0], "fov": 34.0},
				],
				"near": 0.05,
			})
		"z15_road":
			# 22.00-24.00: on the asphalt of the loop road: the cart's
			# headlights bear down, the hero dashes across in front of it and
			# it brakes and slews to a stop at the bollards right beside us
			return _climax(2.0, 1.3, [
				{"t": 0.0, "pos": {"rel": "cart", "off": [2.3, 0.55, -4.2]}, "at": {"rel": "cart", "off": [0.0, 0.9, 0.0]}, "fov": 42.0},
				{"t": 0.85, "pos": {"rel": "cart", "off": [2.4, 0.55, -4.6]}, "at": {"rel": "cart", "off": [-0.6, 0.9, -1.5]}, "fov": 44.0},
				{"t": 2.0, "pos": [-8.6, 0.6, 85.2], "at": [-2.4, 1.0, 89.6], "fov": 46.0, "ease": "out"},
			])
		"z16_home":
			# 24.00-25.25: from beside the door: the hero races at us with the
			# door's glow on his face; the second Night Watch cuts in from the
			# lawn behind him
			return _climax(1.25, 2.97, [
				{"t": 0.0, "pos": [2.8, 1.0, 101.6], "at": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "fov": 30.0},
				{"t": 1.25, "pos": [2.9, 0.95, 101.8], "at": {"rel": "hero", "off": [0.0, 0.85, -1.5]}, "fov": 40.0},
			], {"dof": {"focus_on": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "far_off": 4.0, "amount": 0.01}})
		"z17_door":
			# 25.25-26.25: beside the door, nearly real time: the plant, one
			# short dive over the threshold as the lunge falls short behind him
			# (the Watch on his far side); cut as he lands
			return _climax(1.0, 4.22, [
				{"t": 0.0, "pos": [-3.4, 0.75, 99.6], "at": [0.0, 0.9, 100.2], "fov": 40.0},
				{"t": 1.0, "pos": [-3.2, 0.75, 100.4], "at": [-0.1, 0.85, 102.9], "fov": 42.0},
			], {"speed": [[0.0, 1.0], [0.4, 0.75], [0.8, 0.75], [1.0, 1.0]]})
		"z18_safe":
			# 26.25-28.00: inside, among friends already home: he lands, the
			# game's dive recovery brings him up, confetti.  In the doorway the
			# Night Watch, who can't tag anyone in here, shrugs... and, in the
			# music's silence (27.5), breaks into a moon shuffle
			var d := _climax(1.75, 5.05, [
				{"t": 0.0, "pos": [-2.8, 1.0, 110.4], "at": [0.6, 1.1, 103.6], "fov": 44.0},
				{"t": 1.75, "pos": [-2.2, 0.98, 109.2], "at": [0.3, 1.25, 103.2], "fov": 38.0, "ease": "inout"},
			])
			var acts: Array = d["actors"]
			for f in [[DUCKY, -3.0, 105.6, [2.0, 106.0], "cheer"], [VARSITY, 3.2, 105.4, [2.0, 106.0], "laugh"], [STARRY, 3.8, 107.8, [0.2, 103.0], "laugh"]]:
				acts.append(_friend("home_" + str(acts.size()), f[0], [f[1], f[2]], f[3], [{"type": "emote", "t": DOOR_TAU + 0.2, "name": f[4], "dur": 2.6}]))
			return d
		"z19_logo":
			# 28.00-30.00: Puddlesworth Hall at night, the camera rising
			# slowly; the title is composited over the sky
			return _shot({
				"dur": 2.0, "tau0": 20.0, "far": true, "home_doors": "puddlesworth", "home_beacon": false,
				"cam": [
					{"t": 0.0, "pos": [0.0, 1.5, 64.0], "at": [0.0, 12.6, 103.0], "fov": 52.0},
					{"t": 2.0, "pos": [0.0, 2.1, 66.4], "at": [0.0, 13.4, 103.0], "fov": 50.0},
				],
			})
	return {}
