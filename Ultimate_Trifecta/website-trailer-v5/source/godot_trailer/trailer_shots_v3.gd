class_name TrailerShotsV3
extends RefCounted
## Development-only (src/dev is never exported): the official Ultimate
## Trifecta website trailer, V3 (shot ids start with "x").  Built on V2
## (trailer_shots_web.gd), filmed with the Forward+ renderer and the
## director's cinematic settings (SSAO/SSIL, SDFGI bounce light, SSR, a thin
## volumetric haze).  The blue-pajama runner (the app icon's) carries the
## story: a splash at Founders' Fountain, a Speed Sneakers run through a rift
## into Splashdown Pool, a cart chase he escapes over a wall, a cannonball
## into Froggy Pond, a change of clothes among friends, and the race home
## through Puddlesworth Hall's glowing door.  No snow, no outdoor holiday
## dressing; the dorm's own decorations stay.
##
## Edit (120 BPM, one bar = 2.0 s):
##   x01 chase 0.00   x02 leap 1.00    x03 reveal 2.25  x04 go 6.00
##   x05 bush 7.50    x06 cloak 9.50   x07 coins 10.75  x08 rift 12.00
##   x09 pool 13.25   x10 wall 14.75   x11 shield 16.00 x12 pond 17.00
##   x13 wardrobe 18.00  x14 party 20.00  x15 road 22.00  x16 home 24.00
##   x17 door 25.25   x18 safe 26.75   x19 logo 28.00

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

const BASE := {"snow": false, "festive": false, "cine": true}


static func _shot(d: Dictionary) -> Dictionary:
	var out := BASE.duplicate()
	for k in d:
		out[k] = d[k]
	return out


static func s0_for(pts: Array, t_end: float, v: float) -> float:
	return TrailerShots.s0_for(pts, t_end, v)


# ======================================================================
# The hook (x01..x03): the hero sprints for Founders' Fountain with a Night
# Watch on his heels; he jumps at the rim and dives (jump, then dive in the
# air: the game's own move) as the lunge closes on empty air; the splash on
# the bar.  tau = hook time; take-off at T_JUMP, the water at T_SPLASH.
const T_JUMP := 0.88
const T_SPLASH := 1.58


static func hook_actors() -> Array:
	var t_run := T_JUMP - 13.4 / RUN
	var hero := {
		"id": "hero", "role": "runner", "look": HERO,
		"segs": [
			{"mode": "route", "t0": t_run, "pts": [[0.0, 0.0], [0.0, 13.4], [0.0, 17.8]], "s0": 0.0,
				"speed": [[0.0, RUN], [13.4 / RUN, RUN], [13.4 / RUN + 0.02, 6.3]]},
			{"mode": "splash", "t0": T_SPLASH, "pos": [0.0, 0.25, 17.8], "yaw": PI, "impact": TC.Impact.DIVE, "len": 1.5},
			{"mode": "route", "t0": T_SPLASH + 1.5, "pts": [[0.0, 30.6], [0.0, 60.0]], "s0": 0.0, "speed": [[0.0, 2.0], [0.4, RUN]]},
		],
		# one arc over the rim (clears it by ~0.3 m); the jump pose, then the
		# dive pose from the top of the jump (the dive adds no height)
		"fx": [{"type": "jump", "t": T_JUMP, "dur": T_SPLASH - T_JUMP, "h": 0.85, "dy": 0.25},
			{"type": "dive", "t": T_JUMP + 0.24, "dur": T_SPLASH - T_JUMP - 0.24, "h": 0.0, "dy": 0.0},
			{"type": "burst", "t": T_SPLASH, "size": 1.25, "pos": [0.0, 0.25, 17.8]},
			{"type": "face", "t": -2.0, "dur": 2.45, "face": F_DETERMINED},
			{"type": "face", "t": 0.42, "dur": 0.42, "face": F_GLANCE, "ease": 0.08},
			{"type": "face", "t": T_JUMP, "dur": 0.7, "face": F_GLEE}],
	}
	var watch := {
		"id": "watch", "role": "watch", "look": WATCH, "beam_rig": true, "beam_fwd": 0.3, "beam_energy": 5.0,
		"glare": 0.0, "beam_glow": 0.1, "beam_radius": 1.1,
		"beam_aim": [[-9.0, {"rel": "hero", "off": [0.0, 0.6, 0.0]}], [T_SPLASH, [0.0, 0.3, 18.0]]],
		"segs": [{"mode": "route", "t0": t_run, "pts": [[-0.9, -1.9], [-0.5, 15.0]], "s0": 0.0,
			"speed": [[0.0, RUN], [(T_JUMP - 0.08 - t_run), RUN], [(T_JUMP - 0.08 - t_run) + 0.16, 8.6], [(T_JUMP - 0.08 - t_run) + 0.38, 1.4], [(T_JUMP - 0.08 - t_run) + 0.6, 0.0]],
			"rest_yaw": PI}],
		"fx": [{"type": "tag", "t": T_JUMP - 0.08, "miss": true},
			{"type": "face", "t": -2.0, "dur": 2.9, "face": F_DETERMINED},
			{"type": "emote", "t": T_SPLASH + 0.55, "name": "shrug", "dur": 1.6}],
	}
	return [hero, watch]


# ======================================================================
# The climax (x15..x18): a cart on the loop road chases the hero to
# Puddlesworth Hall; the bollards stop it; the second Night Watch, on foot,
# lunges at the glowing door and misses (nobody can be tagged inside).  The
# payoff: he joins the party.
const DOOR_TAU := 5.0
const HOME_PTS := [[0.0, 74.0], [0.0, 101.4], [2.0, 106.0]]


static func climax_actors() -> Array:
	var t_dive := DOOR_TAU - 0.35
	var hero := {
		"id": "hero", "role": "runner", "look": HERO,
		"segs": [{"mode": "route", "t0": t_dive - 27.4 / RUN, "pts": HOME_PTS, "s0": 0.0,
			"speed": [[0.0, RUN], [27.4 / RUN, RUN], [27.4 / RUN + 0.05, 7.6], [27.4 / RUN + 0.6, 2.0], [27.4 / RUN + 0.9, 0.0]], "rest_yaw": PI * 0.8}],
		"fx": [{"type": "dive", "t": t_dive, "dur": 0.55, "h": 0.55, "dy": 0.0},
			{"type": "face", "t": 0.0, "dur": t_dive, "face": F_DETERMINED},
			{"type": "face", "t": t_dive - 1.0, "dur": 0.5, "face": F_GLANCE, "ease": 0.08},
			{"type": "confetti", "t": DOOR_TAU}, {"type": "celebrate", "t": DOOR_TAU + 0.3, "dur": 3.0},
			{"type": "emote", "t": DOOR_TAU + 0.6, "name": "cheer", "dur": 2.4}],
	}
	var cart_pts := [[60.0, 87.6], [0.0, 87.6], [-20.0, 87.6]]
	var hero_cross_t := t_dive - (101.4 - 88.0) / RUN
	var cart := {"id": "cart", "index": 0, "pts": cart_pts, "t0": hero_cross_t + 0.3 - 60.0 / 11.0, "s0": 0.0,
		"speed": [[0.0, 11.0], [60.0 / 11.0, 11.0], [60.0 / 11.0 + 0.7, 0.0]]}
	var stop_t := float(cart["t0"]) + 60.0 / 11.0 + 0.7
	var driver := {"id": "driver", "role": "watch", "look": WATCH2, "segs": [{"mode": "cart", "t0": -9.0, "cart": "cart"}],
		"fx": [{"type": "face", "t": -9.0, "dur": 20.0, "face": F_DETERMINED},
			{"type": "emote", "t": stop_t + 0.2, "name": "point", "dur": 1.4}]}
	var w_pts := [[14.0, 93.0], [6.0, 98.4], [0.6, 101.0], [0.2, 102.6]]
	var w_len := TrailerRoute.make(w_pts).length
	var t_w := DOOR_TAU - 0.3 - (w_len - 1.6) / 7.0
	var watch := {
		"id": "watch", "role": "watch", "look": WATCH, "beam_rig": true, "beam_fwd": 0.3, "beam_energy": 5.0,
		"glare": 0.0, "beam_glow": 0.1, "beam_radius": 1.1,
		"beam_aim": [[-9.0, {"rel": "hero", "off": [0.0, 0.4, 0.0]}], [DOOR_TAU + 0.6, [0.0, 0.6, 107.0]]],
		"segs": [{"mode": "route", "t0": t_w, "pts": w_pts, "s0": 0.0,
			"speed": [[0.0, 7.0], [(w_len - 1.6) / 7.0, 7.0], [(w_len - 1.6) / 7.0 + 0.3, 3.0], [(w_len - 1.6) / 7.0 + 0.55, 0.0]], "rest_yaw": PI}],
		"fx": [{"type": "tag", "t": DOOR_TAU - 0.3, "miss": true},
			{"type": "face", "t": -9.0, "dur": DOOR_TAU + 9.2, "face": F_DETERMINED},
			{"type": "emote", "t": DOOR_TAU + 0.25, "name": "shrug", "dur": 0.6},
			# the payoff, on the music's stop (27.5): he can't tag anyone in
			# here... so he joins the party
			{"type": "emote", "t": DOOR_TAU + 0.7, "name": "moon_shuffle", "dur": 3.0},
			{"type": "face", "t": DOOR_TAU + 0.7, "dur": 3.0, "face": {"brow_angry": -0.7, "smile": 0.5}}],
	}
	return [{"cart": cart}, hero, watch, driver]


static func _climax(dur: float, tau0: float, cam: Array, extra: Dictionary = {}) -> Dictionary:
	var ca := climax_actors()
	var d := {"dur": dur, "tau0": tau0, "carts": [ca[0]["cart"]], "actors": [ca[1], ca[2], ca[3]],
		"home_doors": "puddlesworth", "beacons": ["fountain"], "far": true, "cam": cam}
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
		"x01_chase":
			# 0.00-1.00: low and just ahead of the hero as he sprints at us,
			# the Night Watch's flashlight on his back; a glance over his
			# shoulder; cut as he takes off
			return _shot({
				"dur": 1.0, "tau0": 0.0, "active_waters": ["fountain"], "beacons": ["fountain"],
				"actors": hook_actors(),
				"cam": [
					{"t": 0.0, "pos": {"rel": "hero", "off": [0.75, 0.55, -3.0]}, "at": {"rel": "hero", "off": [-0.15, 0.95, 0.9]}, "fov": 38.0, "roll": -1.5},
					{"t": 1.0, "pos": {"rel": "hero", "off": [0.7, 0.62, -2.5]}, "at": {"rel": "hero", "off": [-0.1, 0.95, 0.6]}, "fov": 40.0, "roll": 1.0},
				],
				"dof": {"focus_on": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "far_off": 1.5, "amount": 0.016},
			})
		"x02_leap":
			# 1.00-2.25: beside the rim, close: slow motion through the jump
			# and dive over the rim as the lunge falls short; real time again
			# for the splash on the bar (2.0)
			return _shot({
				"dur": 1.25, "tau0": 1.0, "active_waters": ["fountain"], "beacons": ["fountain"],
				"speed": [[0.0, 1.0], [0.12, 0.45], [0.75, 0.45], [0.9, 1.0], [1.25, 1.0]],
				"actors": hook_actors(),
				"cam": [
					{"t": 0.0, "pos": [-3.5, 0.75, 13.4], "at": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "fov": 38.0},
					{"t": 0.8, "pos": [-3.4, 0.75, 13.9], "at": {"rel": "hero", "off": [0.0, 0.6, 0.0]}, "fov": 38.0},
					{"t": 1.25, "pos": [-3.3, 0.75, 14.2], "at": [0.0, 0.5, 18.0], "fov": 40.0},
				],
				"kicks": [[1.0, 0.45]],
				"dof": {"focus_on": {"rel": "hero", "off": [0.0, 0.8, 0.0]}, "far_off": 3.0, "amount": 0.014},
			})
		"x03_reveal":
			# 2.25-6.00: in the basin with him as he surfaces, then up beside
			# the golden beam and out over Moonbrook College: the tower, the
			# halls' lit windows, carts on the roads, other runners on the paths
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
					{"t": 0.0, "pos": [0.9, 0.7, 19.6], "at": [0.0, 0.7, 17.8], "fov": 42.0},
					{"t": 0.65, "pos": [4.2, 1.7, 11.0], "at": [0.0, 6.5, 22.0], "fov": 46.0},
					{"t": 2.2, "pos": [15.0, 16.0, -12.0], "at": [-2.0, 6.0, 30.0], "fov": 48.0, "ease": "inout"},
					{"t": 3.75, "pos": [26.0, 24.0, -36.0], "at": [-6.0, 2.0, 44.0], "fov": 50.0, "ease": "out"},
				],
			})
		"x04_go":
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
				go_runners.append({"id": "r%d" % i, "role": "runner", "look": c[0],
					"segs": [{"mode": "hold", "t0": -5.0, "pos": [x0, 0.0, z0], "yaw": 0.0},
						{"mode": "route", "t0": go, "pts": pts, "s0": 0.0, "speed": [[0.0, 0.0], [0.22, RUN]]}], "fx": fxs})
			return _shot({
				"dur": 1.5, "tau0": 0.0, "home_doors": "puddlesworth", "door_glow": 0.4, "beacons": ["fountain"], "active_waters": ["fountain"], "far": true,
				"actors": go_runners,
				"cam": [
					{"t": 0.0, "pos": [0.7, 0.42, 97.6], "at": [0.0, 1.35, 103.0], "fov": 46.0},
					{"t": 1.5, "pos": [0.6, 0.45, 96.6], "at": [0.0, 1.25, 101.0], "fov": 50.0},
				],
				"kicks": [[0.0, 0.35]],
			})
		"x05_bush":
			# 7.50-9.50: a Night Watch on the path stops dead beside a bush.
			# Slowly turns.  Flashlight on it.  Leans in, squinting... the bush
			# twitches... nothing.  He walks on, and a Frog Onesie pops out
			# behind him with a sly shush.
			return _shot({
				"dur": 2.0, "tau0": 0.0, "home_doors": "puddlesworth",
				"props": [{"id": "bush", "kind": "bush", "pos": [-2.9, 66.0], "rustle": [0.85, 1.42]}],
				"actors": [
					{"id": "watch", "role": "watch", "look": WATCH2, "beam_rig": true, "beam_fwd": 0.3, "beam_energy": 4.0,
						"glare": 0.0, "beam_glow": 0.1, "beam_radius": 1.1,
						"beam_aim": [[-9.0, [0.3, 0.0, 72.0]], [0.1, [0.3, 0.0, 72.0]], [0.55, [-2.9, 0.6, 66.0]], [1.05, [-2.6, 0.5, 66.2]], [1.3, [0.4, 0.0, 77.0]]],
						"segs": [{"mode": "route", "t0": -2.0, "pts": [[0.4, 57.0], [0.4, 66.0], [-1.1, 66.2]], "s0": 0.0, "speed": [[0.0, 4.2], [2.05, 4.2], [2.25, 0.0], [2.55, 0.0], [2.7, 1.8], [3.05, 0.0]], "rest_yaw": -1.4},
							{"mode": "route", "t0": 1.2, "pts": [[-1.1, 66.2], [0.4, 67.5], [0.4, 78.0]], "s0": 0.0, "speed": [[0.0, 0.0], [0.35, 3.6]]}],
						"fx": [{"type": "turn", "t": 0.18, "dur": 0.42, "face": [-2.9, 66.0], "until": 1.2},
							{"type": "face", "t": 0.5, "dur": 0.75, "face": F_SUSPICIOUS},
							{"type": "emote", "t": 1.12, "name": "shrug", "dur": 0.7}]},
					{"id": "frog", "role": "runner", "look": FROGGY, "appear": 1.5,
						"segs": [{"mode": "hold", "t0": -5.0, "pos": [-3.6, 0.0, 64.6], "yaw": 0.42}],
						"fx": [{"type": "poof", "t": 1.5}, {"type": "emote", "t": 1.55, "name": "shush", "dur": 1.4}, {"type": "face", "t": 1.5, "dur": 1.0, "face": F_SLY}]},
				],
				"cam": [
					{"t": 0.0, "pos": [-5.0, 0.95, 61.6], "at": [-0.6, 1.25, 66.4], "fov": 34.0},
					{"t": 1.0, "pos": [-4.9, 0.95, 61.8], "at": [-1.4, 1.15, 66.0], "fov": 28.0, "ease": "inout"},
					{"t": 2.0, "pos": [-4.85, 0.95, 62.0], "at": [-2.2, 1.1, 65.6], "fov": 32.0},
				],
				"dof": {"focus_on": {"rel": "watch", "off": [0.0, 1.0, 0.0]}, "far_off": 3.0, "amount": 0.014},
			})
		"x06_cloak":
			# 9.50-10.75: the same Night Watch walks on and his beam swings onto
			# a Starry Sleeper; she throws on the Invisibility Cloak and, to
			# him, is simply gone
			return _shot({
				"dur": 1.25, "tau0": 0.0,
				"actors": [
					{"id": "watch", "role": "watch", "look": WATCH2, "beam_rig": true, "beam_fwd": 0.3, "beam_energy": 5.0,
						"glare": 0.0, "beam_glow": 0.14, "beam_radius": 1.2,
						"beam_aim": [[-9.0, [3.5, 0.3, 0.5]], [0.0, [2.4, 0.4, -0.6]], [0.2, [0.2, 0.8, -1.6]], [1.25, [0.2, 0.6, -1.8]]],
						"segs": [{"mode": "hold", "t0": -5.0, "pos": [1.6, 0.0, 1.2], "yaw": 0.45}],
						"fx": [{"type": "turn", "t": -0.2, "dur": 0.35, "face": [0.2, -1.6], "until": 9.0},
							{"type": "emote", "t": 0.66, "name": "shrug", "dur": 1.4}, {"type": "face", "t": 0.42, "dur": 1.0, "face": F_SHOCK}]},
					{"id": "starry", "role": "runner", "look": STARRY, "vanish": 0.42,
						"segs": [{"mode": "hold", "t0": -5.0, "pos": [0.2, 0.0, -1.6], "yaw": 2.7}],
						"fx": [{"type": "spotted", "t": 0.18, "dur": 0.3}, {"type": "emote", "t": 0.22, "name": "cloak", "dur": 0.6},
							{"type": "face", "t": 0.24, "dur": 0.3, "face": F_SLY}, {"type": "poof", "t": 0.42}]},
				],
				"cam": [
					{"t": 0.0, "pos": [4.7, 1.15, -2.0], "at": [1.1, 1.0, -0.1], "fov": 36.0},
					{"t": 1.25, "pos": [4.55, 1.13, -1.9], "at": [0.9, 0.95, -0.2], "fov": 34.0},
				],
			})
		"x07_coins":
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
				"dof": {"focus_on": {"rel": "varsity", "off": [0.0, 0.9, 0.0]}, "far_off": 2.0, "amount": 0.014},
			})
		"x08_rift":
			# 12.00-13.25: tracking low beside the hero: he grabs Speed
			# Sneakers on the run, kicks into turbo and dives through a rift,
			# which snaps shut (13.0)
			return _shot({
				"dur": 1.25, "tau0": 0.0,
				"props": [{"id": "rift", "kind": "rift", "pos": [-36.0, 25.0], "yaw": PI * 0.5, "open_t": -3.0, "close_t": 0.98},
					{"id": "holo", "kind": "holo", "item": "turbo", "pos": [-28.6, 25.05], "take_t": 0.22}],
				"actors": [
					{"id": "hero", "role": "runner", "look": HERO, "vanish": 0.98,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[-18.0, 25.3], [-27.0, 25.0], [-36.6, 25.0]], "s0": 9.0 - 0.2 - 1.4, "speed": [[0.0, RUN], [0.22, TURBO + 0.4]]}],
						"fx": [{"type": "dive", "t": 0.58, "dur": 0.42, "h": 0.6}, {"type": "face", "t": -1.0, "dur": 1.8, "face": F_GLEE}]},
				],
				"cam": [
					{"t": 0.0, "pos": [-24.4, 0.75, 28.0], "at": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "fov": 40.0},
					{"t": 0.5, "pos": [-26.2, 0.75, 28.4], "at": {"rel": "hero", "off": [-0.5, 0.9, 0.0]}, "fov": 40.0},
					{"t": 1.25, "pos": [-28.4, 0.8, 28.8], "at": [-36.0, 1.4, 25.0], "fov": 38.0, "ease": "out"},
				],
			})
		"x09_pool":
			# 13.25-14.75: across campus a rift spits him out by the pool's gate;
			# still on Speed Sneakers he runs in and dives (14.5)
			return _shot({
				"dur": 1.5, "tau0": 0.3, "active_waters": ["pool"], "beacons": ["pool"],
				"props": [{"id": "rift2", "kind": "rift", "pos": [95.0, 32.0], "yaw": PI * 0.5, "open_t": -3.0, "close_t": 0.4}],
				"actors": [
					{"id": "hero", "role": "runner", "look": HERO, "appear": 0.0,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[95.6, 32.0], [105.4, 32.0], [109.4, 32.0]], "s0": 0.0, "speed": [[0.0, TURBO]]},
							{"mode": "splash", "t0": 9.8 / TURBO + 0.42, "pos": [109.0, -0.4, 32.0], "yaw": -PI * 0.5, "impact": TC.Impact.DIVE, "len": 1.5}],
						"fx": [{"type": "dive", "t": 9.8 / TURBO, "dur": 0.42, "h": 0.6, "dy": -0.4},
							{"type": "burst", "t": 9.8 / TURBO + 0.42, "size": 0.95, "pos": [109.0, -0.4, 32.0]},
							{"type": "face", "t": -1.0, "dur": 3.0, "face": F_GLEE}]},
				],
				"cam": [
					{"t": 0.0, "pos": [103.4, 0.55, 34.9], "at": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "fov": 40.0},
					{"t": 0.75, "pos": [103.6, 0.58, 35.1], "at": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "fov": 40.0},
					{"t": 1.5, "pos": [104.0, 0.55, 35.2], "at": [109.0, 0.3, 32.0], "fov": 38.0},
				],
				"kicks": [[1.25, 0.4]],
			})
		"x10_wall":
			# 14.75-16.00: a cart roars up the loop road behind the hero; he
			# hops the low stone wall right over the lens; the cart can't follow
			var c_pts := [[77.4, -2.0], [77.2, 8.0], [75.8, 12.0], [72.0, 15.0], [66.0, 19.0]]
			var wall_s := 10.0 + 4.24 + 1.62
			return _shot({
				"dur": 1.25, "tau0": 0.0,
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
		"x11_shield":
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
		"x12_pond":
			# 17.00-18.00: the hero cannonballs into Froggy Pond (17.5), grinning
			return _shot({
				"dur": 1.0, "tau0": -0.25, "active_waters": ["pond"], "beacons": ["pond"],
				"actors": [
					{"id": "hero", "role": "runner", "look": HERO,
						"segs": [{"mode": "route", "t0": -3.0, "pts": [[-88.0, 46.0], [-107.6, 46.0], [-112.4, 46.0]], "s0": s0_for([[-88.0, 46.0], [-107.6, 46.0], [-112.4, 46.0]], 3.5, RUN), "speed": [[0.0, RUN]]},
							{"mode": "splash", "t0": 0.5, "pos": [-112.4, -0.35, 46.0], "yaw": PI * 0.5, "impact": TC.Impact.JUMP, "len": 1.5}],
						"fx": [{"type": "jump", "t": -0.19, "dur": 0.69, "h": 1.2, "dy": -0.35}, {"type": "burst", "t": 0.5, "size": 1.0, "pos": [-112.4, -0.35, 46.0]},
							{"type": "face", "t": -0.3, "dur": 0.8, "face": F_GLEE}]},
				],
				"cam": [
					{"t": 0.0, "pos": [-116.8, 0.02, 48.4], "at": [-109.6, 1.2, 46.0], "fov": 34.0},
					{"t": 1.0, "pos": [-116.5, 0.06, 48.2], "at": [-112.0, 0.6, 46.1], "fov": 32.0},
				],
			})
		"x13_wardrobe":
			# 18.00-20.00: the party room.  The hero tries on looks, one per
			# beat, and his friends react to each (they face him, not us)
			return _shot({
				"dur": 2.0, "tau0": 0.0, "world": "dorm",
				"actors": [
					{"id": "hero", "role": "runner", "look": HERO, "segs": [{"mode": "hold", "t0": -5.0, "pos": [0.0, 0.0, 1.75], "yaw": PI + 0.25}],
						"fx": [{"type": "emote", "t": -0.3, "name": "dance", "dur": 3.0},
							{"type": "swap", "t": 0.5, "look": SWAP_1}, {"type": "swap", "t": 1.0, "look": SWAP_2}, {"type": "swap", "t": 1.5, "look": SWAP_3}]},
					_friend("f1", DUCKY, [-1.3, 1.1], [0.0, 1.75], [{"type": "emote", "t": 0.05, "name": "point", "dur": 0.9}, {"type": "emote", "t": 1.0, "name": "laugh", "dur": 1.2}]),
					_friend("f2", STARRY, [1.35, 0.9], [0.0, 1.75], [{"type": "emote", "t": 0.55, "name": "cheer", "dur": 1.0}, {"type": "emote", "t": 1.55, "name": "wave", "dur": 1.0}]),
					_friend("f3", FROGGY, [0.7, -0.5], [0.0, 1.75], [{"type": "emote", "t": 1.05, "name": "laugh", "dur": 1.4}]),
				],
				"cam": [
					{"t": 0.0, "pos": [0.9, 1.2, 4.9], "at": [0.0, 0.95, 1.6], "fov": 32.0},
					{"t": 2.0, "pos": [0.35, 1.15, 4.4], "at": [0.0, 0.92, 1.6], "fov": 30.0},
				],
				"near": 0.05,
				"dof": {"focus_on": {"rel": "hero", "off": [0.0, 1.0, 0.0]}, "far_off": 1.6, "amount": 0.016},
			})
		"x14_party":
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
		"x15_road":
			# 22.00-24.00: on the asphalt of the loop road: the cart's
			# headlights bear down, the hero dashes across in front of it and
			# it slews to a stop at the bollards right beside us
			return _climax(2.0, DOOR_TAU - 3.5, [
				{"t": 0.0, "pos": [-7.4, 0.38, 85.2], "at": [6.0, 0.9, 87.2], "fov": 42.0},
				{"t": 1.2, "pos": [-7.5, 0.4, 85.1], "at": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "fov": 44.0},
				{"t": 2.0, "pos": [-7.7, 0.42, 85.0], "at": [-2.0, 1.0, 89.4], "fov": 46.0},
			], {"kicks": [[1.9, 0.4]]})
		"x16_home":
			# 24.00-25.25: from beside the door: the hero races at us with the
			# door's glow on his face; the driver points; the second Night
			# Watch cuts in from the lawn
			return _climax(1.25, DOOR_TAU - 1.5, [
				{"t": 0.0, "pos": [2.8, 1.0, 101.6], "at": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "fov": 36.0},
				{"t": 1.25, "pos": [2.9, 0.95, 101.8], "at": {"rel": "hero", "off": [0.0, 0.85, -1.5]}, "fov": 46.0},
			], {"dof": {"focus_on": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "far_off": 4.0, "amount": 0.014}})
		"x17_door":
			# 25.25-26.75: slow motion beside the door: he dives in, the lunge
			# falls just short at the threshold (the hook, full circle)
			return _climax(1.5, DOOR_TAU - 0.5, [
				{"t": 0.0, "pos": [-3.6, 0.7, 100.6], "at": [0.0, 0.9, 102.4], "fov": 40.0},
				{"t": 1.5, "pos": [-3.4, 0.7, 100.9], "at": [0.0, 0.9, 103.4], "fov": 38.0},
			], {"speed": [[0.0, 1.0], [0.3, 0.3], [1.1, 0.3], [1.5, 0.8]], "kicks": [[0.9, 0.3]]})
		"x18_safe":
			# 26.75-28.00: inside, among friends already home: confetti.  In the
			# doorway the Night Watch, who can't tag anyone in here, shrugs...
			# and, in the music's silence (27.5), breaks into a moon shuffle
			var d := _climax(1.25, DOOR_TAU + 0.05, [
				{"t": 0.0, "pos": [-2.8, 1.0, 110.4], "at": [0.6, 1.1, 103.6], "fov": 44.0},
				{"t": 1.25, "pos": [-2.3, 0.98, 109.4], "at": [0.3, 1.25, 103.2], "fov": 38.0, "ease": "inout"},
			])
			d["door_glow"] = 0.12
			var acts: Array = d["actors"]
			for f in [[DUCKY, -3.0, 105.6, [2.0, 106.0], "cheer"], [VARSITY, 3.2, 105.4, [2.0, 106.0], "laugh"], [STARRY, 3.8, 107.8, [0.2, 103.0], "laugh"]]:
				acts.append(_friend("home_" + str(acts.size()), f[0], [f[1], f[2]], f[3], [{"type": "emote", "t": DOOR_TAU + 0.15, "name": f[4], "dur": 2.6}]))
			return d
		"x19_logo":
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
