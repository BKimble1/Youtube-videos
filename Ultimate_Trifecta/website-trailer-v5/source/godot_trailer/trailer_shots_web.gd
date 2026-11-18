class_name TrailerShotsWeb
extends RefCounted
## Development-only (src/dev is never exported): the shots of the official
## Ultimate Trifecta website trailer (V2), filmed by trailer_director.gd
## (shot ids start with "w").  A game trailer, not the Season 1 one: no
## falling snow and no outdoor holiday dressing; the target waters glow with
## the match's own beacons and the home dorm's doors with HomeDoorsView.
##
## Edit (120 BPM, one bar = 2.0 s):
##   w01 hook 0.00  w02 reveal 2.25  w03 go 6.00  w04 bush 8.00  w05 cloak 9.75
##   w06 coins 11.00  w07 rift 12.00  w08 rift out 13.25  w09 wall 14.75
##   w10 shield 16.25  w11 pond 17.25  w12 wardrobe 18.00  w13 party 20.00
##   w14 road 22.00  w15 home 24.00  w16 door 25.25  w17 safe 26.75  w18 logo 28.00

const RUN := 6.2       # a runner at full speed (6.0 in the rules) a touch quicker on film
const WATCH_RUN := 6.6
const TURBO := 7.6     # Speed Sneakers
const HOOK_TAU0 := 0.612

# the cast: the icon's runner, two Night Watch, and everyday Shop outfits
const HERO := TrailerShots.HERO
const WATCH := {"color": "sky", "skin": "tone6"}
const WATCH2 := {"color": "sky", "skin": "tone3"}
const DUCKY := {"outfit": "duck", "skin": "tone4", "hair": "curly", "hair_color": "black", "color": "sunny", "hat": "none"}
const FROGGY := {"outfit": "frog", "skin": "tone3", "color": "lime", "hair": "tuft", "hair_color": "dark_brown", "hat": "none"}
const VARSITY := {"outfit": "varsity_sprinter", "color": "coral", "skin": "tone5", "hair": "tuft", "hair_color": "black", "hat": "none", "shoes": "sneakers"}
const RAINCOAT := {"outfit": "raincoat_explorer", "skin": "tone1", "hair": "buns", "hair_color": "ginger", "hat": "none"}
const STARRY := {"outfit": "starry_sleeper", "skin": "tone7", "hair": "bob", "hair_color": "black", "color": "grape", "hat": "none"}
const SCOUT := {"outfit": "lantern_scout", "skin": "tone2", "hair": "curly", "hair_color": "auburn", "hat": "none"}
const MOONLIGHT := {"outfit": "moonlight_runner", "skin": "tone6", "hair": "tuft", "hair_color": "black", "hat": "headphones", "shoes": "glow_sneakers"}
const COURIER := {"outfit": "campus_courier", "skin": "tone4", "color": "teal", "hair": "bob", "hair_color": "brown"}
const CLOUD := {"outfit": "cloud_nine", "skin": "tone8", "hair": "buns", "hair_color": "black", "hat": "none"}

# the hero's wardrobe on the beat (w12): the same runner, four looks
const SWAP_1 := {"outfit": "moonlight_runner", "skin": "tone2", "hair": "tuft", "hair_color": "brown", "hat": "headphones", "shoes": "glow_sneakers"}
const SWAP_2 := {"outfit": "robe", "color": "bubblegum", "skin": "tone2", "hair": "tuft", "hair_color": "brown", "hat": "party", "shoes": "slippers"}
const SWAP_3 := {"outfit": "varsity_sprinter", "color": "grape", "skin": "tone2", "hair": "tuft", "hair_color": "brown", "hat": "crown", "shoes": "sneakers"}

const BASE := {"snow": false, "festive": false}


static func _shot(d: Dictionary) -> Dictionary:
	var out := BASE.duplicate()
	for k in d:
		out[k] = d[k]
	return out


static func s0_for(pts: Array, t_end: float, v: float) -> float:
	return TrailerShots.s0_for(pts, t_end, v)


# ======================================================================
# The hook (w01, w02): a dive past a lunging Night Watch into Founders'
# Fountain, then up its golden beam over the campus.  tau = hook time.
static func hook_actors() -> Array:
	var hero_pts := [[0.0, 0.0], [0.0, 13.4], [0.0, 17.8]]
	var hero := {
		"id": "hero", "role": "runner", "look": HERO,
		"segs": [
			{"mode": "route", "t0": 1.0 - 13.4 / RUN, "pts": hero_pts, "s0": 0.0, "speed": [[0.0, RUN], [13.4 / RUN, RUN], [13.4 / RUN + 0.05, 7.8]]},
			{"mode": "splash", "t0": 1.564, "pos": [0.0, 0.25, 17.8], "yaw": PI, "impact": TC.Impact.DIVE, "len": 1.5},
			{"mode": "route", "t0": 3.07, "pts": [[0.0, 30.6], [0.0, 60.0]], "s0": 0.0, "speed": [[0.0, 2.0], [0.4, RUN]]},
		],
		"fx": [{"type": "dive", "t": 1.0, "dur": 0.564, "h": 0.75, "dy": 0.25},
			{"type": "burst", "t": 1.564, "size": 1.15, "pos": [0.0, 0.25, 17.8]}],
	}
	var watch := {
		"id": "watch", "role": "watch", "look": WATCH, "beam_rig": true, "beam_fwd": 0.3, "beam_energy": 5.0,
		"glare": 0.0, "beam_glow": 0.12, "beam_radius": 1.2,
		"beam_aim": [[-9.0, {"rel": "hero", "off": [0.0, 0.6, 0.0]}]],
		"segs": [{"mode": "route", "t0": 1.0 - 13.4 / RUN, "pts": [[0.5, -2.2], [0.5, 13.0]], "s0": 0.0,
			"speed": [[0.0, 6.2], [2.08, 6.2], [2.2, 8.0], [2.46, 1.0], [2.7, 0.0]]}],
		"fx": [{"type": "tag", "t": 0.92, "miss": true}, {"type": "emote", "t": 2.15, "name": "shrug", "dur": 1.6}],
	}
	return [hero, watch]


# ======================================================================
# The climax (w14..w17): a cart on the loop road chases the hero to
# Puddlesworth Hall; the bollards stop it, the Night Watch hops out and runs,
# and his lunge just misses as the hero dives in through the glowing front
# door (nobody can be tagged inside).  tau = climax time; the door line
# (z 103.5) is crossed at DOOR_TAU.
const DOOR_TAU := 5.0
const HOME_PTS := [[0.0, 74.0], [0.0, 101.4], [2.0, 106.0]]


static func climax_actors() -> Array:
	# the hero reaches z 101.4 (the dive) at DOOR_TAU - 0.35
	var t_dive := DOOR_TAU - 0.35
	var hero := {
		"id": "hero", "role": "runner", "look": HERO,
		"segs": [
			{"mode": "route", "t0": t_dive - 27.4 / RUN, "pts": HOME_PTS, "s0": 0.0,
				"speed": [[0.0, RUN], [27.4 / RUN, RUN], [27.4 / RUN + 0.05, 7.6], [27.4 / RUN + 0.6, 2.0], [27.4 / RUN + 0.9, 0.0]]},
		],
		"fx": [{"type": "dive", "t": t_dive, "dur": 0.55, "h": 0.55, "dy": 0.0},
			{"type": "confetti", "t": DOOR_TAU}, {"type": "celebrate", "t": DOOR_TAU + 0.3, "dur": 3.0},
			{"type": "emote", "t": DOOR_TAU + 0.7, "name": "victory_lap", "dur": 2.4}],
	}
	# the cart: east along the road (z 88), just behind the hero at x 0,
	# then hard on the brakes along the bollards
	var cart_pts := [[60.0, 87.6], [0.0, 87.6], [-20.0, 87.6]]
	var hero_cross_t := t_dive - (101.4 - 88.0) / RUN   # hero at z 88
	var cart := {"id": "cart", "index": 0, "pts": cart_pts, "t0": hero_cross_t + 0.38 - 60.0 / 11.0, "s0": 0.0,
		"speed": [[0.0, 11.0], [60.0 / 11.0, 11.0], [60.0 / 11.0 + 0.7, 0.0]]}
	var stop_t := float(cart["t0"]) + 60.0 / 11.0 + 0.7
	# the driver is stuck behind the bollards; the second Night Watch, on
	# foot, cuts in from the east lawn and lunges at the door
	var driver := {"id": "driver", "role": "watch", "look": WATCH2, "segs": [{"mode": "cart", "t0": -9.0, "cart": "cart"}],
		"fx": [{"type": "emote", "t": stop_t + 0.2, "name": "point", "dur": 1.4}]}
	var w_pts := [[14.0, 93.0], [6.0, 98.4], [0.6, 101.0], [0.2, 102.6]]
	var w_len := TrailerRoute.make(w_pts).length
	var watch := {
		"id": "watch", "role": "watch", "look": WATCH, "beam_rig": true, "beam_fwd": 0.3, "beam_energy": 5.0,
		"glare": 0.0, "beam_glow": 0.1, "beam_radius": 1.1,
		"beam_aim": [[-9.0, {"rel": "hero", "off": [0.0, 0.4, 0.0]}], [DOOR_TAU + 0.6, [0.0, 0.6, 107.0]]],
		"segs": [{"mode": "route", "t0": DOOR_TAU - 0.3 - (w_len - 1.6) / 7.0, "pts": w_pts, "s0": 0.0,
			"speed": [[0.0, 7.0], [(w_len - 1.6) / 7.0, 7.0], [(w_len - 1.6) / 7.0 + 0.3, 3.0], [(w_len - 1.6) / 7.0 + 0.55, 0.0]], "rest_yaw": PI}],
		"fx": [{"type": "tag", "t": DOOR_TAU - 0.3, "miss": true},
			{"type": "emote", "t": DOOR_TAU + 0.8, "name": "shrug", "dur": 1.8}],
	}
	return [{"cart": cart}, hero, watch, driver]


static func _climax(dur: float, tau0: float, cam: Array, extra: Dictionary = {}) -> Dictionary:
	var ca := climax_actors()
	var d := {"dur": dur, "tau0": tau0, "carts": [ca[0]["cart"]], "actors": [ca[1], ca[2], ca[3]],
		"home_doors": "puddlesworth", "beacons": ["fountain"], "far": true, "cam": cam}
	for k in extra:
		d[k] = extra[k]
	return _shot(d)


# ======================================================================
static func get_shot(id: String) -> Dictionary:
	match id:
		"w01_hook":
			# 0.00-2.25: low at the fountain rim; the hero sprints at the lens,
			# the Night Watch lunges, slow motion as he dives over the rim;
			# real time again for the splash on the bar (2.0)
			return _shot({
				"dur": 2.25, "tau0": HOOK_TAU0, "active_waters": ["fountain"], "beacons": ["fountain"],
				"speed": [[0.0, 1.0], [0.45, 0.28], [1.55, 0.28], [1.85, 1.0], [2.25, 1.0]],
				"actors": hook_actors(),
				"cam": [
					{"t": 0.0, "pos": [-4.4, 0.8, 16.6], "at": {"rel": "hero", "off": [0.0, 0.95, 0.0]}, "fov": 34.0},
					{"t": 1.2, "pos": [-4.3, 0.78, 16.8], "at": {"rel": "hero", "off": [0.0, 0.8, 0.0]}, "fov": 36.0},
					{"t": 2.25, "pos": [-4.2, 0.78, 17.0], "at": [0.0, 0.5, 18.4], "fov": 40.0},
				],
				"kicks": [[2.0, 0.6]],
			})
		"w02_reveal":
			# 2.25-6.00: from the splash, up the fountain's golden beam to the
			# campus at night: the other beams, the tower, the dorms, carts
			return _shot({
				"dur": 3.75, "tau0": 1.8, "active_waters": ["fountain", "pond", "pool"], "beacons": ["fountain", "pond", "pool"], "far": true,
				"actors": hook_actors(),
				"carts": [{"id": "c1", "index": 0, "pts": [[78.0, -40.0], [78.0, 88.0], [-78.0, 88.0]], "s0": 20.0, "speed": [[0.0, 10.0]]},
					{"id": "c2", "index": 1, "pts": [[-78.0, 60.0], [-78.0, -14.0], [78.0, -14.0]], "s0": 30.0, "speed": [[0.0, 10.0]]}],
				"cam": [
					{"t": 0.0, "pos": [-3.4, 0.62, 20.6], "at": [0.0, 0.8, 17.8], "fov": 40.0},
					{"t": 1.0, "pos": [-6.0, 4.5, 15.0], "at": [0.0, 7.0, 22.0], "fov": 46.0},
					{"t": 3.75, "pos": [-30.0, 34.0, 62.0], "at": [20.0, 4.0, -10.0], "fov": 50.0, "ease": "inout"},
				],
			})
		"w03_go":
			# 6.00-8.00: THE DROP.  Inside Puddlesworth Hall's common room,
			# tonight's runners on their pads; GO, and they burst out through
			# the glowing front door into the night (the fountain's beam out
			# there).  The camera follows them to the doorway.
			var go_runners := []
			var cast := [[HERO, 0.0, 107.2, 0.05], [DUCKY, -2.4, 108.6, 0.22], [VARSITY, 2.2, 108.2, 0.14],
				[RAINCOAT, -1.2, 110.0, 0.36], [STARRY, 2.6, 109.0, 0.42], [SCOUT, -3.4, 109.8, 0.55]]
			for i in cast.size():
				var c: Array = cast[i]
				var x0 := float(c[1])
				var z0 := float(c[2])
				var go := float(c[3])
				var xo: float = [-0.6, 0.6, -0.3, 0.3, 0.0, 0.5][i]
				var spread: Array = [[-2.0, 92.0], [-7.0, 94.0], [5.0, 93.0], [-4.5, 90.0], [8.0, 95.0], [2.5, 89.0]][i]
				var pts := [[x0, z0], [xo, 104.6], [xo, 102.4], spread]
				go_runners.append({"id": "r%d" % i, "role": "runner", "look": c[0], "lighting": "indoor",
					"segs": [{"mode": "hold", "t0": -5.0, "pos": [x0, 0.0, z0], "yaw": 0.0},
						{"mode": "route", "t0": go, "pts": pts, "s0": 0.0, "speed": [[0.0, 0.0], [0.25, RUN]]}]})
			return _shot({
				"dur": 2.0, "tau0": -0.2, "home_doors": "puddlesworth", "beacons": ["fountain"], "active_waters": ["fountain"], "far": true,
				"actors": go_runners,
				"cam": [
					{"t": 0.0, "pos": [0.9, 0.75, 111.6], "at": [0.0, 1.3, 103.0], "fov": 48.0},
					{"t": 0.6, "pos": [0.7, 0.8, 110.4], "at": [0.0, 1.2, 103.0], "fov": 48.0},
					{"t": 2.0, "pos": [0.2, 0.95, 105.2], "at": [0.0, 1.1, 96.0], "fov": 52.0, "ease": "in"},
				],
				"kicks": [[0.2, 0.5]],
			})
		"w04_bush":
			# 8.00-9.75: a Night Watch on the path stops at a bush and peers
			# into it, flashlight on it... nothing.  He moves on, and a Frog
			# Onesie pops out on our side with a shush
			return _shot({
				"dur": 1.75, "tau0": 0.0, "home_doors": "puddlesworth",
				"props": [{"id": "bush", "kind": "bush", "pos": [-2.9, 66.0], "rustle": [1.0]}],
				"actors": [
					{"id": "watch", "role": "watch", "look": WATCH2, "beam_rig": true, "beam_fwd": 0.3, "beam_energy": 4.0,
						"glare": 0.0, "beam_glow": 0.1, "beam_radius": 1.1,
						"beam_aim": [[-9.0, [0.3, 0.0, 72.0]], [0.05, [0.3, 0.0, 72.0]], [0.3, [-2.9, 0.6, 66.0]], [0.85, [-2.6, 0.6, 66.2]], [1.1, [0.3, 0.0, 76.0]]],
						"segs": [{"mode": "route", "t0": -2.0, "pts": [[0.4, 57.0], [0.4, 66.4]], "s0": 0.0, "speed": [[0.0, 4.2], [2.1, 4.2], [2.35, 0.0]], "rest_yaw": PI},
							{"mode": "route", "t0": 0.95, "pts": [[0.4, 66.4], [0.4, 77.0]], "s0": 0.0, "speed": [[0.0, 0.0], [0.35, 3.6]]}],
						"fx": [{"type": "turn", "t": 0.18, "dur": 0.22, "face": [-2.9, 66.0], "until": 0.95}]},
					{"id": "frog", "role": "runner", "look": FROGGY, "appear": 1.1,
						"segs": [{"mode": "hold", "t0": -5.0, "pos": [-3.6, 0.0, 64.6], "yaw": 0.42}],
						"fx": [{"type": "poof", "t": 1.1}, {"type": "emote", "t": 1.15, "name": "shush", "dur": 1.4}]},
				],
				"cam": [
					{"t": 0.0, "pos": [-5.0, 0.95, 61.6], "at": [-1.2, 1.25, 66.4], "fov": 36.0},
					{"t": 1.75, "pos": [-4.9, 0.95, 61.9], "at": [-2.0, 1.15, 65.8], "fov": 34.0},
				],
			})
		"w05_cloak":
			# 9.75-11.00: over a Night Watch's shoulder: his beam has a Starry
			# Sleeper... she throws on the Invisibility Cloak and, to him, is
			# simply gone.  He shrugs.
			return _shot({
				"dur": 1.25, "tau0": 0.0,
				"actors": [
					{"id": "watch", "role": "watch", "look": WATCH, "beam_rig": true, "beam_fwd": 0.3, "beam_energy": 5.0,
						"glare": 0.0, "beam_glow": 0.14, "beam_radius": 1.3,
						"beam_aim": [[-9.0, [-0.6, 0.8, -3.6]], [1.25, [-0.5, 0.6, -3.8]]],
						"segs": [{"mode": "hold", "t0": -5.0, "pos": [1.6, 0.0, 1.2], "yaw": 0.45}],
						"fx": [{"type": "emote", "t": 0.62, "name": "shrug", "dur": 1.4}]},
					{"id": "starry", "role": "runner", "look": STARRY, "vanish": 0.4,
						"segs": [{"mode": "hold", "t0": -5.0, "pos": [-0.6, 0.0, -3.6], "yaw": 2.75}],
						"fx": [{"type": "spotted", "t": -1.0, "dur": 1.4}, {"type": "emote", "t": 0.02, "name": "cloak", "dur": 0.6}, {"type": "poof", "t": 0.4}]},
				],
				"cam": [
					{"t": 0.0, "pos": [5.6, 1.15, -3.9], "at": [0.1, 1.0, -1.7], "fov": 38.0},
					{"t": 1.25, "pos": [5.4, 1.12, -3.7], "at": [0.1, 0.95, -1.8], "fov": 36.0},
				],
			})
		"w06_coins":
			# 11.00-12.00: low and alongside: a Varsity Sprinter sweeps a line of coins
			return _shot({
				"dur": 1.0, "tau0": 0.0,
				"props": [{"id": "coins", "kind": "coins", "coin_glow": 0.3, "pts": [[15.0, 22.0], [17.5, 22.0], [20.0, 22.0], [22.5, 22.0], [25.0, 22.0]],
					"take": [[0, 0.05], [1, 0.45], [2, 0.86], [3, 1.26], [4, 1.66]]}],
				"actors": [
					{"id": "varsity", "role": "runner", "look": VARSITY,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[10.0, 22.0], [40.0, 22.0]], "s0": 4.7, "speed": [[0.0, RUN]]}]},
				],
				"cam": [
					{"t": 0.0, "pos": {"rel": "varsity", "off": [-4.0, 0.55, -1.4]}, "at": {"rel": "varsity", "off": [0.0, 0.85, -0.5]}, "fov": 34.0, "roll": -2.0},
					{"t": 1.0, "pos": {"rel": "varsity", "off": [-3.8, 0.5, -2.2]}, "at": {"rel": "varsity", "off": [0.2, 0.85, 0.3]}, "fov": 34.0, "roll": 1.0},
				],
			})
		"w07_rift":
			# 12.00-13.25: a Raincoat Explorer grabs Speed Sneakers and dives
			# through a rift, which snaps shut (13.0)
			return _shot({
				"dur": 1.25, "tau0": 0.0,
				"props": [{"id": "rift", "kind": "rift", "pos": [-36.0, 25.0], "yaw": PI * 0.5, "open_t": -3.0, "close_t": 0.98},
					{"id": "holo", "kind": "holo", "item": "turbo", "pos": [-31.0, 25.05], "take_t": 0.28}],
				"actors": [
					{"id": "rain", "role": "runner", "look": RAINCOAT, "vanish": 0.98,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[-21.0, 25.4], [-27.0, 25.0], [-36.6, 25.0]], "s0": 8.0 - 0.6, "speed": [[0.0, RUN], [0.3, TURBO]]}],
						"fx": [{"type": "dive", "t": 0.58, "dur": 0.42, "h": 0.6}]},
				],
				"cam": [
					{"t": 0.0, "pos": [-23.6, 1.0, 27.3], "at": [-31.0, 1.1, 25.0], "fov": 40.0},
					{"t": 1.25, "pos": [-26.0, 0.95, 28.4], "at": [-36.0, 1.5, 25.0], "fov": 34.0, "ease": "out"},
				],
			})
		"w08_riftout":
			# 13.25-15.00: across campus a rift spits her out by the pool's
			# gate; still on Speed Sneakers she runs in and dives (14.75)
			return _shot({
				"dur": 1.75, "tau0": 0.2, "active_waters": ["pool"], "beacons": ["pool"],
				"props": [{"id": "rift2", "kind": "rift", "pos": [95.0, 32.0], "yaw": PI * 0.5, "open_t": -3.0, "close_t": 0.3}],
				"actors": [
					{"id": "rain", "role": "runner", "look": RAINCOAT, "appear": 0.0,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[95.6, 32.0], [105.4, 32.0], [109.4, 32.0]], "s0": 0.0, "speed": [[0.0, TURBO]]},
							{"mode": "splash", "t0": 9.8 / TURBO + 0.42, "pos": [109.0, -0.4, 32.0], "yaw": -PI * 0.5, "impact": TC.Impact.DIVE, "len": 1.5}],
						"fx": [{"type": "dive", "t": 9.8 / TURBO, "dur": 0.42, "h": 0.6, "dy": -0.4},
							{"type": "burst", "t": 9.8 / TURBO + 0.42, "size": 0.9, "pos": [109.0, -0.4, 32.0]}]},
				],
				"cam": [
					{"t": 0.0, "pos": [102.6, 0.6, 35.6], "at": [96.0, 1.2, 32.0], "fov": 42.0},
					{"t": 0.9, "pos": [102.8, 0.62, 35.8], "at": {"rel": "rain", "off": [0.0, 0.9, 0.0]}, "fov": 42.0},
					{"t": 1.75, "pos": [103.2, 0.6, 35.9], "at": [109.0, 0.3, 32.0], "fov": 40.0},
				],
				"kicks": [[1.5, 0.5]],
			})
		"w09_wall":
			# 15.00-16.25: a cart on the loop road closes on a Campus Courier;
			# she hops the low stone wall right past the lens, where carts can't follow
			var c_pts := [[77.4, -2.0], [77.2, 8.0], [75.8, 12.0], [72.0, 15.0], [66.0, 19.0]]
			var wall_s := 10.0 + 4.24 + 1.62
			return _shot({
				"dur": 1.25, "tau0": 0.0,
				"carts": [{"id": "cart", "index": 1, "pts": [[78.6, -40.0], [78.6, 40.0]], "s0": 48.0 - 10.5 * 0.7, "speed": [[0.0, 10.5], [0.8, 10.5], [1.3, 0.0]]}],
				"actors": [
					{"id": "drv", "role": "watch", "look": WATCH2, "segs": [{"mode": "cart", "t0": -5.0, "cart": "cart"}]},
					{"id": "courier", "role": "runner", "look": COURIER,
						"segs": [{"mode": "route", "t0": 0.0, "pts": c_pts, "s0": wall_s - RUN * 0.7, "speed": [[0.0, RUN]]}],
						"fx": [{"type": "jump", "t": 0.45, "dur": 0.5, "h": 0.85}]},
				],
				"cam": [
					{"t": 0.0, "pos": [73.0, 0.45, 13.6], "at": [77.6, 1.0, 5.0], "fov": 50.0},
					{"t": 0.7, "pos": [73.0, 0.45, 13.7], "at": {"rel": "courier", "off": [0.0, 1.0, 0.0]}, "fov": 52.0},
					{"t": 1.25, "pos": [72.9, 0.48, 13.8], "at": [68.0, 1.0, 18.0], "fov": 52.0},
				],
			})
		"w10_shield":
			# 16.25-17.25: a Pillow Shield: the Night Watch's tag bounces off
			return _shot({
				"dur": 1.0, "tau0": 0.0,
				"actors": [
					{"id": "scout", "role": "runner", "look": SCOUT,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[24.0, 40.0], [24.0, 60.0]], "s0": 2.6, "speed": [[0.0, 6.4]]}],
						"fx": [{"type": "protect", "t": -2.0, "dur": 5.0}]},
					{"id": "watch", "role": "watch", "look": WATCH,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[24.0, 40.0], [24.0, 60.0]], "s0": 0.6, "speed": [[0.0, 6.6], [0.34, 8.0], [0.5, 1.6], [0.8, 0.6]]}],
						"fx": [{"type": "tag", "t": 0.14, "miss": true}, {"type": "bump", "t": 0.36}]},
				],
				"cam": [
					{"t": 0.0, "pos": [27.4, 0.6, 46.0], "at": [24.0, 1.0, 43.0], "fov": 42.0},
					{"t": 1.0, "pos": [27.6, 0.7, 49.0], "at": [24.0, 1.0, 48.0], "fov": 42.0},
				],
			})
		"w11_pond":
			# 17.25-18.00: a Duck Mascot cannonballs into Froggy Pond (17.75)
			return _shot({
				"dur": 0.75, "tau0": 0.0, "active_waters": ["pond"], "beacons": ["pond"],
				"actors": [
					{"id": "duck", "role": "runner", "look": DUCKY,
						"segs": [{"mode": "route", "t0": -3.0, "pts": [[-88.0, 46.0], [-107.6, 46.0], [-112.4, 46.0]], "s0": s0_for([[-88.0, 46.0], [-107.6, 46.0], [-112.4, 46.0]], 3.5, RUN), "speed": [[0.0, RUN]]},
							{"mode": "splash", "t0": 0.5, "pos": [-112.4, -0.35, 46.0], "yaw": PI * 0.5, "impact": TC.Impact.JUMP, "len": 1.5}],
						"fx": [{"type": "jump", "t": -0.19, "dur": 0.69, "h": 1.2, "dy": -0.35}, {"type": "burst", "t": 0.5, "size": 0.9, "pos": [-112.4, -0.35, 46.0]}]},
				],
				"cam": [
					{"t": 0.0, "pos": [-117.2, 0.0, 48.6], "at": [-109.6, 1.1, 46.0], "fov": 36.0},
					{"t": 0.75, "pos": [-116.8, 0.05, 48.3], "at": [-112.0, 0.6, 46.1], "fov": 34.0},
				],
			})
		"w12_wardrobe":
			# 18.00-20.00: the party room (the dorm lounge): the hero tries on
			# looks, one per beat, with the game's poof
			return _shot({
				"dur": 2.0, "tau0": 0.0, "world": "dorm",
				"actors": [
					{"id": "hero", "role": "runner", "look": HERO, "segs": [{"mode": "hold", "t0": -5.0, "pos": [0.0, 0.0, 1.75], "yaw": PI}],
						"fx": [{"type": "emote", "t": -0.3, "name": "dance", "dur": 3.0},
							{"type": "swap", "t": 0.5, "look": SWAP_1}, {"type": "swap", "t": 1.0, "look": SWAP_2}, {"type": "swap", "t": 1.5, "look": SWAP_3}]},
					{"id": "f1", "role": "runner", "look": DUCKY, "segs": [{"mode": "hold", "t0": -5.0, "pos": [-1.25, 0.0, 1.0], "yaw": PI + 0.35}],
						"fx": [{"type": "emote", "t": 0.2, "name": "laugh", "dur": 2.0}]},
					{"id": "f2", "role": "runner", "look": STARRY, "segs": [{"mode": "hold", "t0": -5.0, "pos": [1.3, 0.0, 1.1], "yaw": PI - 0.4}],
						"fx": [{"type": "emote", "t": 0.6, "name": "cheer", "dur": 1.8}]},
				],
				"cam": [
					{"t": 0.0, "pos": [0.25, 1.15, 4.7], "at": [0.0, 0.95, 1.75], "fov": 30.0},
					{"t": 2.0, "pos": [0.15, 1.1, 4.2], "at": [0.0, 0.92, 1.75], "fov": 30.0},
				],
				"near": 0.05,
			})
		"w13_party":
			# 20.00-22.00: wider: the whole party on the rug, everyone's own
			# moves; on the stop (21.5) the hero points at us
			return _shot({
				"dur": 2.0, "tau0": 0.0, "world": "dorm",
				"actors": [
					{"id": "hero", "role": "runner", "look": SWAP_3, "segs": [{"mode": "hold", "t0": -5.0, "pos": [0.0, 0.0, 1.75], "yaw": PI}],
						"fx": [{"type": "emote", "t": -0.4, "name": "moon_shuffle", "dur": 1.9}, {"type": "emote", "t": 1.5, "name": "point", "dur": 1.2}]},
					{"id": "f1", "role": "runner", "look": DUCKY, "segs": [{"mode": "hold", "t0": -5.0, "pos": [-1.25, 0.0, 1.0], "yaw": PI + 0.35}],
						"fx": [{"type": "emote", "t": -0.3, "name": "dance", "dur": 3.0}]},
					{"id": "f2", "role": "runner", "look": STARRY, "segs": [{"mode": "hold", "t0": -5.0, "pos": [1.3, 0.0, 1.1], "yaw": PI - 0.4}],
						"fx": [{"type": "emote", "t": -0.5, "name": "victory_lap", "dur": 3.0}]},
					{"id": "f3", "role": "runner", "look": FROGGY, "segs": [{"mode": "hold", "t0": -5.0, "pos": [-0.7, 0.0, -0.2], "yaw": PI + 0.15}],
						"fx": [{"type": "emote", "t": -0.2, "name": "cheer", "dur": 2.6}]},
					{"id": "f4", "role": "runner", "look": MOONLIGHT, "segs": [{"mode": "hold", "t0": -5.0, "pos": [0.8, 0.0, -0.1], "yaw": PI - 0.15}],
						"fx": [{"type": "emote", "t": -0.6, "name": "dance", "dur": 3.0}]},
					{"id": "f5", "role": "runner", "look": CLOUD, "segs": [{"mode": "hold", "t0": -5.0, "pos": [2.3, 0.0, 0.2], "yaw": PI - 0.6}],
						"fx": [{"type": "emote", "t": 0.1, "name": "laugh", "dur": 2.0}]},
				],
				"cam": [
					{"t": 0.0, "pos": [1.6, 1.5, 6.8], "at": [0.2, 1.0, 0.6], "fov": 36.0},
					{"t": 1.5, "pos": [0.8, 1.35, 6.0], "at": [0.0, 0.95, 0.9], "fov": 34.0, "ease": "out"},
					{"t": 2.0, "pos": [0.7, 1.33, 5.9], "at": [0.0, 0.95, 1.0], "fov": 34.0},
				],
				"near": 0.05,
			})
		"w14_road":
			# 22.00-24.00: low on the loop road outside Puddlesworth Hall: the
			# cart's headlights bear down, the hero dashes across in front of
			# it, and it brakes hard at the bollards
			return _climax(2.0, DOOR_TAU - 3.5, [
				{"t": 0.0, "pos": [-5.4, 0.42, 85.4], "at": [8.0, 1.0, 87.4], "fov": 46.0},
				{"t": 2.0, "pos": [-5.6, 0.45, 85.3], "at": [0.0, 1.0, 90.0], "fov": 48.0},
			], {"kicks": [[1.9, 0.5]]})
		"w15_home":
			# 24.00-25.25: from the doorway: the hero races at us with the
			# door's glow on him; behind, the Night Watch hops out and runs
			return _climax(1.25, DOOR_TAU - 1.5, [
				{"t": 0.0, "pos": [2.8, 1.0, 101.6], "at": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "fov": 36.0},
				{"t": 1.25, "pos": [2.9, 0.95, 101.8], "at": {"rel": "hero", "off": [0.0, 0.85, -1.5]}, "fov": 46.0},
			])
		"w16_door":
			# 25.25-26.75: slow motion beside the door: the hero dives in, the
			# lunge falls just short at the threshold
			return _climax(1.5, DOOR_TAU - 0.5, [
				{"t": 0.0, "pos": [-3.6, 0.7, 100.6], "at": [0.0, 0.9, 102.4], "fov": 40.0},
				{"t": 1.5, "pos": [-3.4, 0.7, 100.9], "at": [0.0, 0.9, 103.4], "fov": 38.0},
			], {"speed": [[0.0, 1.0], [0.3, 0.3], [1.1, 0.3], [1.5, 0.8]], "kicks": [[0.9, 0.4]]})
		"w17_safe":
			# 26.75-28.00: inside the common room: the hero lands among
			# friends already home, confetti; in the doorway the Night Watch,
			# who can't tag in here, shrugs (27.5)
			var d := _climax(1.25, DOOR_TAU + 0.05, [
				{"t": 0.0, "pos": [-2.8, 1.0, 110.4], "at": [0.6, 1.1, 103.6], "fov": 44.0},
				{"t": 1.25, "pos": [-2.6, 1.0, 110.0], "at": [0.4, 1.3, 103.4], "fov": 40.0},
			])
			d["door_glow"] = 0.12
			var acts: Array = d["actors"]
			for f in [[DUCKY, -3.0, 105.6, -2.2, "cheer"], [VARSITY, 3.2, 105.4, 2.3, "laugh"], [STARRY, 3.8, 107.8, 2.6, "dance"]]:
				acts.append({"id": "home_" + str(acts.size()), "role": "runner", "look": f[0], "lighting": "indoor",
					"segs": [{"mode": "hold", "t0": -9.0, "pos": [f[1], 0.0, f[2]], "yaw": f[3]}],
					"fx": [{"type": "emote", "t": DOOR_TAU + 0.2, "name": f[4], "dur": 2.4}]})
			return d
		"w18_logo":
			# 28.00-30.00: the campus at night under the beams; the official
			# title is composited over the sky
			return _shot({
				"dur": 2.0, "tau0": 20.0, "far": true, "home_doors": "puddlesworth", "home_beacon": false,
				"cam": [
					{"t": 0.0, "pos": [0.0, 1.6, 66.0], "at": [0.0, 13.0, 103.0], "fov": 50.0},
					{"t": 2.0, "pos": [0.0, 2.0, 67.6], "at": [0.0, 13.6, 103.0], "fov": 49.0},
				],
			})
		"wt_map":
			# blocking: a high view over a point (--opt=mx:..,mz:..)
			return _shot({"dur": 1.0, "far": true, "beacons": ["fountain", "pond", "pool"], "active_waters": ["fountain", "pond", "pool"],
				"cam": [{"t": 0.0, "pos": [-30.0, 34.0, 62.0], "at": [20.0, 4.0, -10.0], "fov": 50.0}]})
	return {}
