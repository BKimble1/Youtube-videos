class_name TrailerShots
extends RefCounted
## The trailer's shots as data for TrailerDirector (trailer_director.gd).
## Coordinates are Moonbrook College's (metres; x east, z south; Puddlesworth
## Hall's front door at (0, 103), Founders' Fountain centred at (0, 22),
## radius 6, Bellweather Tower at (0, -30)).
## Camera keys: t (output seconds from the shot's start), pos / at ([x, y, z]
## or {rel: actor, off: [x, y, z] in the actor's heading frame, -z ahead,
## +x to its right}), fov (vertical degrees), roll (degrees), ease (per
## segment).  Actors: segs (route / hold / splash / cart) on scene time,
## fx overlays (jump, dive, emote, tag, state, protect, spotted, celebrate,
## cloak, turn).  "tau0": the scene time at the shot's first frame, so shots
## cut from one continuous choreography keep their geography and timing.

## the icon's hero: blue striped pajamas, nightcap, bunny slippers
const HERO := {"outfit": "pj", "pattern": "stripes", "color": "sky", "hat": "nightcap", "shoes": "slippers", "skin": "tone2",
	"hair": "tuft", "hair_color": "brown", "face": "classic"}
const WATCH := {"color": "sky", "skin": "tone6"}
const WATCH2 := {"color": "sky", "skin": "tone3"}
const ELF := {"outfit": "elf_helper", "hair": "bob", "hair_color": "blonde", "skin": "tone1", "color": "lime", "hat": "none"}
const REINDEER := {"outfit": "reindeer_onesie", "hair": "bob", "hair_color": "black", "skin": "tone6", "color": "coral", "hat": "none"}
const GINGER := {"outfit": "gingerbread_buddy", "hair": "buns", "hair_color": "espresso", "skin": "tone7", "color": "mint", "hat": "none"}
const SNOWDAY := {"outfit": "snow_day", "hair": "tuft", "hair_color": "dark_brown", "skin": "tone4", "color": "sky", "hat": "none"}

# Founders' Fountain
const FC := Vector2(0.0, 22.0)
const SURF := 0.25
const SPRINT := 7.0
const TREE := [-12.0, 43.0, 3.4, 0.5]


static func yaw_to(from: Vector2, to: Vector2) -> float:
	var d := to - from
	return atan2(-d.x, -d.y)


## Distance along a route at which an actor must start (s0) to reach the
## route's end at time t_end at a constant speed v.
static func s0_for(pts: Array, t_end: float, v: float, end_trim: float = 0.0) -> float:
	return TrailerRoute.make(pts).length - end_trim - v * t_end


# ======================================================================
# The opening and the drop: one continuous choreography on the quad south
# of the fountain (tau = trailer time for shots A2, A3, B1).
#   The hero sneaks north toward the fountain; the Night Watch, on the quad
#   behind him, swings the flashlight round (2.0 s) and catches him; he
#   turns (3.2 s), freezes, and bolts on the drop (4.0 s) as runners in the
#   season's outfits burst out of hiding all round.
const H_STOP := Vector2(-0.8, 36.0)
const W_POS := Vector2(3.2, 46.5)


static func plaza_actors() -> Array:
	var sneak := [[-0.8, 44.0], [H_STOP.x, H_STOP.y]]
	var hero := {
		"id": "hero", "role": "runner", "look": HERO,
		"segs": [
			{"mode": "route", "t0": 0.0, "pts": sneak, "s0": TrailerRoute.make(sneak).length - 3.3, "speed": [[0.0, 1.15], [2.9, 1.0], [3.25, 0.0]]},
			{"mode": "route", "t0": 4.0, "pts": [[H_STOP.x, H_STOP.y], [-1.4, 30.8], [-5.6, 27.2], [-9.2, 22.0], [-12.5, 14.0], [-21.0, 5.2], [-30.0, -1.5]],
				"speed": [[0.0, 0.0], [0.35, 6.4], [0.9, SPRINT]]},
		],
		"fx": [
			{"type": "turn", "t": 3.15, "dur": 0.32, "face": [W_POS.x, W_POS.y], "until": 4.0},
			{"type": "spotted", "t": 3.2, "dur": 0.95},
		],
	}
	var watch := {
		"id": "watch", "role": "watch", "look": WATCH, "beam_rig": true, "beam_fwd": 0.3, "beam_energy": 12.0,
		# the beam sweeps the lawn, whips across the lens (A2's camera, 2.0 s)
		# and lands on the hero
		"beam_aim": [[-1.0, [13.0, 0.0, 41.0]], [1.68, [11.0, 0.0, 51.0]], [1.85, [1.0, 0.6, 38.0]], [1.95, [-1.4, 0.85, 43.4]],
			[2.15, [-1.6, 0.9, 38.0]], [2.4, [-0.8, 0.85, 36.3]], [4.3, [-0.8, 0.85, 36.3]], [4.8, {"rel": "hero", "off": [0.0, 0.9, 0.0]}]],
		"segs": [
			{"mode": "hold", "t0": -5.0, "pos": [W_POS.x, 0.0, W_POS.y], "yaw": -1.35},
			{"mode": "route", "t0": 4.35, "pts": [[W_POS.x, W_POS.y], [1.0, 40.0], [-1.5, 31.0], [-5.6, 27.2], [-9.2, 22.0]],
				"speed": [[0.0, 0.0], [0.45, 5.6], [1.0, 6.4]]},
		],
		"fx": [
			# patrolling: the beam sweeps slowly across the lawn, then whips
			# round to the sound behind him
			{"type": "turn", "t": -2.0, "dur": 2.0, "yaw": -0.85, "until": 1.78},
			{"type": "turn", "t": 1.8, "dur": 0.26, "face": [-1.0, 40.0], "until": 4.35},
			{"type": "emote", "t": 1.84, "name": "point", "dur": 2.4},
		],
	}
	# the season's outfits, hidden round the plaza, bursting out on the drop
	var elf := {
		"id": "elf", "role": "runner", "look": ELF, "appear": 3.995,
		"segs": [{"mode": "route", "t0": 4.0, "pts": [[-6.6, 27.6], [-4.2, 33.5], [-2.6, 40.0], [-2.4, 48.0], [-2.4, 60.0]],
			"speed": [[0.0, 2.5], [0.3, 6.8]]}],
		"fx": [{"type": "jump", "t": 4.02, "dur": 0.42, "h": 0.6}],
	}
	var reindeer := {
		"id": "reindeer", "role": "runner", "look": REINDEER, "appear": 3.995,
		"segs": [{"mode": "route", "t0": 4.0, "pts": [[6.0, 28.4], [4.2, 34.5], [3.0, 41.0], [2.8, 48.0], [2.8, 60.0]],
			"speed": [[0.0, 2.5], [0.35, 6.6]]}],
		"fx": [{"type": "jump", "t": 4.1, "dur": 0.5, "h": 0.8}],
	}
	var ginger := {
		"id": "ginger", "role": "runner", "look": GINGER, "appear": 3.995,
		"segs": [{"mode": "route", "t0": 4.0, "pts": [[9.5, 33.5], [3.0, 35.0], [-6.0, 36.5], [-14.0, 38.0], [-24.0, 40.0]],
			"speed": [[0.0, 3.0], [0.3, 6.9]]}],
	}
	var snowday := {
		"id": "snowday", "role": "runner", "look": SNOWDAY, "appear": 3.995,
		"segs": [{"mode": "route", "t0": 4.0, "pts": [[-9.5, 33.0], [-3.0, 33.6], [5.0, 34.6], [13.0, 36.0], [24.0, 38.0]],
			"speed": [[0.0, 3.5], [0.25, 7.0]]}],
	}
	return [hero, watch, elf, reindeer, ginger, snowday]


# ======================================================================
# The final chase, on its own clock (tau 0 = 18.0 s in the trailer).
#   tau 0-2.26 sprint along the arrows to Founders' Fountain, jump, land in
#   the water at tau 3.0 (21.0 s), the splash sequence, resurface at the
#   south shore at tau 4.5, then down the quad to Puddlesworth Hall's front
#   door (tau ~15).  The Night Watch follows ~15 m back and quietly lets the
#   gap grow; he stops on the quad and shushes the camera.
const DIRV := Vector2(0.72, 0.694)
const PATH_A := [[-34.0, -14.0], [-28.0, 0.0], [-21.0, 5.17], [-14.0, 10.34], [-9.4, 13.6]]


static func chase_route_a() -> Array:
	var dv := DIRV.normalized()
	var take_off := FC - dv * 8.6
	var land := FC - dv * 3.4
	var pts: Array = PATH_A.duplicate()
	pts.append([take_off.x, take_off.y])
	pts.append([land.x, land.y])
	return pts


const CHASE_LAND := 3.0
const DOOR_TAU := 15.02


static func chase_actors() -> Array:
	var dv := DIRV.normalized()
	var take_off := FC - dv * 8.6
	var land := FC - dv * 3.4
	var pts_a := chase_route_a()
	var air := land.distance_to(take_off) / SPRINT
	var hero := {
		"id": "hero", "role": "runner", "look": HERO,
		"segs": [
			{"mode": "route", "t0": -10.0, "pts": pts_a, "s0": s0_for(pts_a, CHASE_LAND + 10.0, SPRINT), "speed": [[0.0, SPRINT]]},
			{"mode": "splash", "t0": CHASE_LAND, "pos": [land.x, SURF, land.y], "yaw": yaw_to(take_off, land), "impact": TC.Impact.JUMP, "len": 1.5},
			{"mode": "route", "t0": CHASE_LAND + 1.5, "pts": [[0.0, 30.6], [0.0, 60.0], [0.0, 103.0], [0.0, 112.0]],
				"speed": [[0.0, 2.6], [0.55, SPRINT]]},
		],
		"fx": [
			{"type": "jump", "t": CHASE_LAND - air, "dur": air, "h": 1.05, "dy": SURF},
			{"type": "burst", "t": CHASE_LAND, "size": 1.5, "pos": [land.x, SURF, land.y]},
			{"type": "jump", "t": CHASE_LAND + 1.5, "dur": 0.42, "h": 0.42},
		],
		"vanish": DOOR_TAU + 0.9,
	}
	var w_pts := [[-40.0, -28.0], [-34.0, -14.0], [-28.0, 0.0], [-21.0, 5.17], [-14.0, 10.34], [-9.6, 14.2], [take_off.x - 1.2, take_off.y + 1.0],
		[-8.9, 21.0], [-8.2, 26.6], [-4.4, 31.4], [0.0, 34.6], [0.0, 60.0], [0.0, 101.0]]
	# behind by ~15 m at tau 0
	var hero_s0: float = s0_for(pts_a, CHASE_LAND + 10.0, SPRINT) + SPRINT * 10.0
	var wr := TrailerRoute.make(w_pts)
	# where on the watch's route the hero's start point is
	var start_p := TrailerRoute.make(pts_a).at(hero_s0)
	var best_s := 0.0
	var best_d := 1e9
	var s := 0.0
	while s < wr.length:
		var d := wr.at(s).distance_to(start_p)
		if d < best_d:
			best_d = d
			best_s = s
		s += 0.1
	var watch := {
		"id": "watch", "role": "watch", "look": WATCH, "beam_rig": true, "glare": 0.28, "beam_glow": 0.12, "beam_radius": 1.1, "glare_size": 1.0,
		"beam_aim": [[0.0, {"rel": "hero", "off": [0.0, 0.0, 1.2]}]],
		"segs": [
			{"mode": "route", "t0": 0.0, "pts": w_pts, "s0": best_s - 15.0,
				"speed": [[0.0, 6.4], [5.4, 6.4], [7.0, 5.2], [11.5, 4.8], [13.2, 4.6], [14.9, 0.0]]},
		],
		"fx": [
			{"type": "turn", "t": 15.0, "dur": 0.45, "yaw": 0.0, "until": 99.0},
			{"type": "emote", "t": 15.55, "name": "shush", "dur": 2.4},
		],
	}
	return [hero, watch]


static func chase_arrows() -> Array:
	var a: Array = chase_route_a()
	a.pop_back()
	return [
		{"pts": a, "w": 1.7},
		{"pts": [[0.0, 31.6], [0.0, 60.0], [0.0, 102.6]], "w": 1.8},
	]


static func get_shot(id: String) -> Dictionary:
	match id:
		# ---------------------------------------------------------------- A: the opening
		"a1_push":
			# 0.00-1.80: low and fast down the snowy, lit quad toward the
			# fountain and the tower; the Night Watch's beam sweeping ahead
			return {
				"dur": 1.8, "tau0": 0.0, "trees": [TREE], "actors": plaza_actors(),
				"cam": [
					{"t": 0.0, "pos": [-0.6, 0.55, 89.0], "at": [0.4, 2.2, 58.0], "fov": 46.0, "roll": -3.0},
					{"t": 1.0, "pos": [0.9, 1.0, 72.0], "at": [0.4, 2.6, 30.0], "fov": 44.0, "roll": 1.0},
					{"t": 1.8, "pos": [0.6, 1.5, 61.0], "at": [0.6, 2.4, 30.0], "fov": 40.0, "roll": 0.0, "ease": "out"},
				],
				"shake": 0.15,
			}
		"a2_flash":
			# 1.80-2.75: the Night Watch, low angle; the beam whips round into the lens (2.0)
			return {
				"dur": 0.95, "tau0": 1.8, "trees": [TREE], "actors": plaza_actors(),
				"cam": [
					{"t": 0.0, "pos": [-1.4, 0.85, 43.4], "at": [3.1, 1.4, 46.5], "fov": 30.0},
					{"t": 0.95, "pos": [-1.15, 0.82, 43.6], "at": [3.1, 1.45, 46.5], "fov": 27.0},
				],
				"kicks": [[0.2, 1.0]],
				"lights": [{"type": "omni", "pos": [4.6, 2.2, 44.2], "color": [0.55, 0.65, 1.0], "energy": 0.8, "range": 5.0}],
			}
		"a3_caught":
			# 2.75-4.00: over the Night Watch's shoulder: the hero, caught in
			# the beam, turns round (dolly zoom); frozen; the stop-down
			return {
				"dur": 1.25, "tau0": 2.75, "trees": [TREE], "actors": plaza_actors(),
				"cam": [
					{"t": 0.0, "pos": [5.5, 1.3, 48.9], "at": [-0.6, 1.0, 36.0], "fov": 16.0},
					{"t": 0.45, "pos": [5.3, 1.28, 48.2], "at": [-0.7, 0.95, 36.0], "fov": 16.5},
					{"t": 1.0, "pos": [2.6, 1.25, 42.0], "at": [-0.75, 0.92, 36.0], "fov": 32.0, "ease": "inout"},
					{"t": 1.25, "pos": [2.55, 1.22, 41.8], "at": [-0.75, 0.92, 36.0], "fov": 33.0},
				],
			}
		# ---------------------------------------------------------------- B: Christmas has arrived
		"b1_drop":
			# 4.00-5.50: THE DROP: the hero bolts; the season's outfits burst
			# out of hiding past the lens; the camera surges after them and
			# cranes up over the fountain plaza
			return {
				"dur": 1.5, "tau0": 4.0, "trees": [TREE], "actors": plaza_actors(),
				"cam": [
					{"t": 0.0, "pos": [0.9, 0.5, 40.8], "at": [-0.9, 1.25, 30.0], "fov": 52.0, "roll": -2.0},
					{"t": 0.75, "pos": [0.2, 1.4, 35.5], "at": [-3.0, 1.2, 24.0], "fov": 54.0, "roll": 1.5},
					{"t": 1.5, "pos": [-1.2, 5.2, 32.0], "at": [-4.0, 0.6, 18.0], "fov": 56.0, "roll": 0.0},
				],
				"shake": 0.25, "kicks": [[0.0, 1.0]],
			}
		"b2_dorm":
			# 5.50-7.00: the holiday dorm: past the tree's lights to the
			# season's outfits dancing on the rug
			return {
				"dur": 1.5, "tau0": 0.0, "world": "dorm",
				"actors": [
					{"id": "hero", "role": "runner", "look": HERO, "segs": [{"mode": "hold", "t0": -5.0, "pos": [0.0, 0.0, 1.75], "yaw": PI}],
						"fx": [{"type": "emote", "t": -0.6, "name": "dance", "dur": 3.75}]},
					{"id": "elf", "role": "runner", "look": ELF, "segs": [{"mode": "hold", "t0": -5.0, "pos": [-1.12, 0.0, 1.4], "yaw": PI + 0.2}],
						"fx": [{"type": "emote", "t": -0.5, "name": "moon_shuffle", "dur": 3.2}]},
					{"id": "snowday", "role": "runner", "look": SNOWDAY, "segs": [{"mode": "hold", "t0": -5.0, "pos": [1.12, 0.0, 1.4], "yaw": PI - 0.2}],
						"fx": [{"type": "emote", "t": -0.2, "name": "cheer", "dur": 2.4}]},
					{"id": "reindeer", "role": "runner", "look": REINDEER, "segs": [{"mode": "hold", "t0": -5.0, "pos": [-0.62, 0.0, 0.3], "yaw": PI + 0.12}],
						"fx": [{"type": "emote", "t": -0.7, "name": "dance", "dur": 3.75}]},
					{"id": "ginger", "role": "runner", "look": GINGER, "segs": [{"mode": "hold", "t0": -5.0, "pos": [0.62, 0.0, 0.3], "yaw": PI - 0.12}],
						"fx": [{"type": "emote", "t": -0.4, "name": "victory_lap", "dur": 3.2}]},
				],
				"cam": [
					{"t": 0.0, "pos": [2.2, 1.8, 6.4], "at": [1.55, 2.2, -2.85], "fov": 14.0},
					{"t": 0.7, "pos": [1.2, 1.45, 6.1], "at": [0.7, 1.35, -0.6], "fov": 24.0},
					{"t": 1.5, "pos": [0.5, 1.15, 5.9], "at": [0.0, 0.85, 0.9], "fov": 32.0, "ease": "out"},
				],
				"near": 0.05,
			}
		"b3_rift":
			# 7.00-8.50: a rift on the lawn; past a Speed Sneakers hologram,
			# a runner dives through and it snaps shut (8.0)
			return {
				"dur": 1.5, "tau0": 0.0, "trees": [TREE],
				"props": [{"id": "rift", "kind": "rift", "pos": [-24.0, 31.0], "yaw": PI * 0.5, "open_t": -3.0, "close_t": 1.02},
					{"id": "holo", "kind": "holo", "item": "turbo", "pos": [-19.2, 31.05], "take_t": 0.3}],
				"actors": [
					{"id": "elf", "role": "runner", "look": ELF, "vanish": 1.02,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[-9.0, 31.4], [-15.0, 31.0], [-24.6, 31.0]], "s0": 8.0, "speed": [[0.0, SPRINT]]}],
						"fx": [{"type": "dive", "t": 0.6, "dur": 0.42, "h": 0.6}]},
				],
				"cam": [
					{"t": 0.0, "pos": [-11.6, 1.0, 33.3], "at": [-19.0, 1.1, 31.0], "fov": 40.0},
					{"t": 1.5, "pos": [-14.2, 0.95, 34.6], "at": [-24.0, 1.5, 31.0], "fov": 34.0, "ease": "out"},
				],
				"kicks": [[1.0, 0.8]],
			}
		"b4_coins":
			# 8.50-10.00: low and alongside: Snow Day sweeps a line of coins
			return {
				"dur": 1.5, "tau0": 0.0, "trees": [TREE],
				"props": [{"id": "coins", "kind": "coins", "coin_glow": 0.3, "pts": [[15.0, 22.0], [17.5, 22.0], [20.0, 22.0], [22.5, 22.0], [25.0, 22.0], [27.5, 22.0], [30.0, 22.0], [32.5, 22.0]],
					"take": [[0, 0.07], [1, 0.43], [2, 0.79], [3, 1.14], [4, 1.5], [5, 1.86], [6, 2.21], [7, 2.57]]}],
				"actors": [
					{"id": "snowday", "role": "runner", "look": SNOWDAY,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[10.0, 22.0], [40.0, 22.0]], "s0": 4.5, "speed": [[0.0, SPRINT]]}]},
				],
				"cam": [
					{"t": 0.0, "pos": {"rel": "snowday", "off": [-4.2, 0.55, -1.2]}, "at": {"rel": "snowday", "off": [0.0, 0.85, -0.6]}, "fov": 32.0, "roll": -2.0},
					{"t": 1.5, "pos": {"rel": "snowday", "off": [-3.8, 0.5, -2.4]}, "at": {"rel": "snowday", "off": [0.2, 0.85, 0.4]}, "fov": 32.0, "roll": 1.0},
				],
				"shake": 0.3,
			}
		# ---------------------------------------------------------------- C: chaos
		"c1_cart":
			# 10.0-11.0: a Night Watch cart swings round the plaza at the lens
			return {
				"dur": 1.0, "tau0": 0.0, "trees": [TREE],
				"carts": [{"id": "cart", "index": 0, "pts": [[26.0, 1.0], [14.5, 13.0], [10.3, 19.5], [11.0, 27.0], [14.0, 34.0]], "s0": 9.6, "speed": [[0.0, 10.5]]}],
				"actors": [{"id": "drv", "role": "watch", "look": WATCH2, "segs": [{"mode": "cart", "t0": -5.0, "cart": "cart"}]}],
				"cam": [
					{"t": 0.0, "pos": [12.4, 0.4, 18.0], "at": [18.5, 1.0, 8.6], "fov": 40.0},
					{"t": 0.5, "pos": [12.5, 0.42, 18.2], "at": {"rel": "cart", "off": [0.0, 0.9, 0.0]}, "fov": 44.0},
					{"t": 1.0, "pos": [12.6, 0.45, 18.4], "at": {"rel": "cart", "off": [0.0, 0.9, 0.0]}, "fov": 48.0},
				],
				"shake": 0.3, "kicks": [[0.7, 0.8]],
			}
		"c2_whiff":
			# 11.0-12.0: a lunging tag misses a hopping reindeer (slow-mo whiff)
			return {
				"dur": 1.0, "tau0": 0.0, "trees": [TREE],
				"speed": [[0.0, 1.0], [0.25, 0.35], [0.7, 0.35], [1.0, 1.0]],
				"actors": [
					{"id": "reindeer", "role": "runner", "look": REINDEER,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[-30.0, 52.0], [-18.0, 58.0]], "s0": 2.0, "speed": [[0.0, 6.6]]}],
						"fx": [{"type": "jump", "t": 0.22, "dur": 0.5, "h": 0.75}]},
					{"id": "watch", "role": "watch", "look": WATCH,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[-30.0, 52.0], [-18.0, 58.0]], "s0": 0.2, "speed": [[0.0, 6.4], [0.25, 8.0], [0.5, 4.0], [0.9, 2.0]]}],
						"fx": [{"type": "tag", "t": 0.08, "miss": true}]},
				],
				"cam": [
					{"t": 0.0, "pos": [-28.8, 0.55, 57.6], "at": [-27.6, 0.95, 53.4], "fov": 34.0},
					{"t": 1.0, "pos": [-26.6, 0.6, 58.6], "at": [-25.0, 1.05, 54.4], "fov": 34.0},
				],
			}
		"c3_pond":
			# 12.0-13.0: a cannonball into Froggy Pond, from the water line
			return {
				"dur": 1.0, "tau0": 0.0, "trees": [TREE], "active_waters": ["pond"],
				"actors": [
					{"id": "ginger", "role": "runner", "look": GINGER,
						"segs": [{"mode": "route", "t0": -3.0, "pts": [[-88.0, 46.0], [-107.6, 46.0], [-112.4, 46.0]], "s0": s0_for([[-88.0, 46.0], [-107.6, 46.0], [-112.4, 46.0]], 3.5, SPRINT), "speed": [[0.0, SPRINT]]},
							{"mode": "splash", "t0": 0.5, "pos": [-112.4, -0.35, 46.0], "yaw": PI * 0.5, "impact": TC.Impact.JUMP, "len": 1.5}],
						"fx": [{"type": "jump", "t": -0.19, "dur": 0.69, "h": 1.2, "dy": -0.35}, {"type": "burst", "t": 0.5, "size": 0.9, "pos": [-112.4, -0.35, 46.0]}]},
				],
				"cam": [
					{"t": 0.0, "pos": [-117.2, 0.0, 48.6], "at": [-109.0, 0.9, 46.0], "fov": 36.0},
					{"t": 1.0, "pos": [-116.6, 0.05, 48.2], "at": [-112.0, 0.5, 46.1], "fov": 34.0},
				],
			}
		"c4_bush":
			# 13.0-14.0: the beam sweeps past a bush ... which rustles; a runner
			# slips out behind the Night Watch's back
			return {
				"dur": 1.0, "tau0": 0.0, "trees": [TREE],
				"props": [{"id": "bush", "kind": "bush", "pos": [11.0, 70.0], "rustle": [0.5]}],
				"actors": [
					{"id": "watch", "role": "watch", "look": WATCH, "beam_rig": true,
						"beam_aim": [[-1.0, [9.0, 0.0, 79.0]], [0.3, [10.6, 0.5, 70.6]], [0.5, [7.0, 0.0, 76.0]], [1.0, [4.0, 0.0, 78.0]]],
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[15.0, 73.4], [8.0, 73.8]], "s0": 0.6, "speed": [[0.0, 1.4]]}]},
					{"id": "elf", "role": "runner", "look": ELF, "appear": 0.5,
						"segs": [{"mode": "route", "t0": 0.5, "pts": [[11.0, 70.0], [12.2, 67.6], [14.5, 62.0]], "speed": [[0.0, 1.0], [0.3, 4.5]]}]},
				],
				"cam": [
					{"t": 0.0, "pos": [14.6, 0.85, 65.4], "at": [11.2, 1.0, 71.2], "fov": 40.0},
					{"t": 1.0, "pos": [14.8, 0.85, 65.6], "at": [12.2, 1.0, 69.4], "fov": 40.0},
				],
			}
		"c5_shield":
			# 14.0-15.0: a Pillow Shield: the tag bounces off
			return {
				"dur": 1.0, "tau0": 0.0, "trees": [TREE],
				"actors": [
					{"id": "snowday", "role": "runner", "look": SNOWDAY,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[24.0, 40.0], [24.0, 60.0]], "s0": 2.6, "speed": [[0.0, 6.6]]}],
						"fx": [{"type": "protect", "t": -2.0, "dur": 5.0}]},
					{"id": "watch", "role": "watch", "look": WATCH,
						"segs": [{"mode": "route", "t0": 0.0, "pts": [[24.0, 40.0], [24.0, 60.0]], "s0": 0.6, "speed": [[0.0, 6.6], [0.34, 8.0], [0.5, 0.0]]}],
						"fx": [{"type": "tag", "t": 0.14, "miss": true}, {"type": "state", "t": 0.52, "dur": 0.5, "state": "stumble"}]},
				],
				"cam": [
					{"t": 0.0, "pos": [27.4, 0.6, 46.0], "at": [24.0, 1.0, 43.0], "fov": 42.0},
					{"t": 1.0, "pos": [27.6, 0.7, 49.0], "at": [24.0, 1.0, 48.0], "fov": 42.0},
				],
			}
		"c6_cartchase":
			# 15.0-16.0: two carts, beacons spinning, chase runners across the lawn
			return {
				"dur": 1.0, "tau0": 0.0, "trees": [TREE], "far": true,
				"carts": [{"id": "c1", "index": 0, "pts": [[13.0, 83.0], [11.4, 72.0], [9.4, 60.0], [7.6, 46.0], [6.0, 34.0]], "s0": 17.0, "speed": [[0.0, 9.5]]},
					{"id": "c2", "index": 1, "pts": [[20.0, 83.0], [18.2, 72.0], [16.2, 60.0], [14.4, 46.0], [12.6, 34.0]], "s0": 14.0, "speed": [[0.0, 9.5]]}],
				"actors": [
					{"id": "d1", "role": "watch", "look": WATCH, "segs": [{"mode": "cart", "t0": -5.0, "cart": "c1"}]},
					{"id": "d2", "role": "watch", "look": WATCH2, "segs": [{"mode": "cart", "t0": -5.0, "cart": "c2"}]},
					{"id": "r1", "role": "runner", "look": ELF, "segs": [{"mode": "route", "t0": 0.0, "pts": [[13.0, 83.0], [11.4, 72.0], [9.4, 60.0], [7.6, 46.0], [6.0, 34.0]], "s0": 24.4, "speed": [[0.0, 6.9]]}]},
					{"id": "r2", "role": "runner", "look": GINGER, "segs": [{"mode": "route", "t0": 0.0, "pts": [[20.0, 83.0], [18.2, 72.0], [16.2, 60.0], [14.4, 46.0], [12.6, 34.0]], "s0": 22.0, "speed": [[0.0, 6.9]]}]},
				],
				"cam": [
					{"t": 0.0, "pos": [6.4, 0.45, 55.0], "at": [10.8, 1.0, 66.0], "fov": 40.0},
					{"t": 0.55, "pos": [6.3, 0.48, 54.8], "at": {"rel": "r1", "off": [0.0, 0.9, 0.0]}, "fov": 42.0},
					{"t": 1.0, "pos": [6.2, 0.5, 54.6], "at": {"rel": "c1", "off": [0.0, 1.0, 0.0]}, "fov": 46.0},
				],
				"shake": 0.3,
			}
		"c7_dive":
			# 16.0-17.0: a full-stretch dive into Splashdown Pool
			return {
				"dur": 1.0, "tau0": 0.0, "trees": [TREE], "active_waters": ["pool"],
				"speed": [[0.0, 1.0], [0.3, 0.4], [0.7, 0.4], [1.0, 1.0]],
				"actors": [
					{"id": "frog", "role": "runner", "look": {"outfit": "frog", "skin": "tone3", "color": "lime"},
						"segs": [{"mode": "route", "t0": -3.0, "pts": [[96.0, 32.0], [106.2, 32.0], [110.4, 32.0]], "s0": s0_for([[96.0, 32.0], [106.2, 32.0], [110.4, 32.0]], 3.47, SPRINT), "speed": [[0.0, SPRINT]]},
							{"mode": "splash", "t0": 0.47, "pos": [110.4, -0.4, 32.0], "yaw": -PI * 0.5, "impact": TC.Impact.DIVE, "len": 1.5}],
						"fx": [{"type": "dive", "t": -0.13, "dur": 0.6, "h": 0.7, "dy": -0.4}, {"type": "burst", "t": 0.47, "size": 1.0, "pos": [110.4, -0.4, 32.0]}]},
				],
				"cam": [
					{"t": 0.0, "pos": [114.8, 0.5, 35.2], "at": [108.0, 1.1, 32.0], "fov": 30.0},
					{"t": 1.0, "pos": [114.4, 0.45, 34.9], "at": [110.4, 0.1, 32.0], "fov": 27.0},
				],
				"kicks": [[0.47, 0.5]],
			}
		"c8_hopout":
			# 17.0-18.0: a cart skids to a stop; the Night Watch hops out and
			# sets off after someone (the chase begins)
			return {
				"dur": 1.0, "tau0": 0.0, "trees": [TREE],
				"carts": [{"id": "cart", "index": 1, "pts": [[-46.0, -30.0], [-38.0, -20.0], [-35.0, -15.5]], "s0": TrailerRoute.make([[-46.0, -30.0], [-38.0, -20.0], [-35.0, -15.5]]).length - 2.03, "speed": [[0.0, 9.0], [0.45, 0.0]]}],
				"actors": [
					{"id": "watch", "role": "watch", "look": WATCH, "beam_rig": true, "glare": 0.3, "beam_glow": 0.14, "beam_radius": 1.3,
						"beam_aim": [[-1.0, {"rel": "cart", "off": [2.5, 0.0, -7.0]}], [0.5, {"rel": "cart", "off": [2.5, 0.0, -7.0]}], [0.8, [-26.0, 0.0, -4.0]]],
						"segs": [{"mode": "cart", "t0": -5.0, "cart": "cart"},
							{"mode": "route", "t0": 0.55, "pts": [[-36.0, -15.0], [-33.0, -10.0], [-28.0, 0.0]], "speed": [[0.0, 0.0], [0.3, 5.5]]}],
						"fx": [{"type": "state", "t": 0.45, "dur": 0.2, "state": "exit"}]},
				],
				"cam": [
					{"t": 0.0, "pos": [-32.2, 0.5, -12.4], "at": [-38.6, 1.0, -20.0], "fov": 40.0},
					{"t": 0.5, "pos": [-32.0, 0.5, -12.2], "at": [-35.4, 1.0, -15.8], "fov": 40.0},
					{"t": 1.0, "pos": [-31.6, 0.6, -11.6], "at": [-33.6, 1.2, -11.6], "fov": 42.0},
				],
				"kicks": [[0.42, 0.7]],
			}
		# ---------------------------------------------------------------- E: the logo
		"e1_logo":
			# 28.0-30.0: Puddlesworth Hall in the snow, lights glowing; the
			# camera rises slowly (the logo is composited over the sky)
			return {
				"dur": 2.0, "tau0": 20.0, "trees": [TREE], "far": true, "home_doors": "puddlesworth",
				"cam": [
					{"t": 0.0, "pos": [0.0, 1.6, 66.0], "at": [0.0, 13.0, 103.0], "fov": 50.0},
					{"t": 2.0, "pos": [0.0, 2.0, 67.6], "at": [0.0, 13.6, 103.0], "fov": 49.0},
				],
			}
		# ---------------------------------------------------------------- D: the final chase
		"d1_front":
			# 18.0-20.0: low, in front, tracking back along the arrows; the
			# Night Watch's beam behind him
			return {
				"dur": 2.0, "tau0": 0.0, "trees": [TREE], "actors": chase_actors(), "arrows": chase_arrows(),
				"cam": [
					{"t": 0.0, "pos": {"rel": "hero", "off": [1.25, 0.36, -3.4]}, "at": {"rel": "hero", "off": [-0.35, 1.0, 1.5]}, "fov": 44.0, "roll": -2.0},
					{"t": 1.0, "pos": {"rel": "hero", "off": [1.1, 0.32, -3.0]}, "at": {"rel": "hero", "off": [-0.3, 1.0, 1.5]}, "fov": 44.0, "roll": 1.0},
					{"t": 2.0, "pos": {"rel": "hero", "off": [0.9, 0.42, -3.3]}, "at": {"rel": "hero", "off": [-0.25, 1.0, 1.0]}, "fov": 46.0, "roll": 0.0},
				],
				"shake": 0.35,
			}
		"d2_leap":
			# 20.0-21.0: side tracking, the leap over the rim into the fountain
			return {
				"dur": 1.0, "tau0": 2.0, "trees": [TREE], "actors": chase_actors(), "arrows": chase_arrows(),
				"cam": [
					{"t": 0.0, "pos": {"rel": "hero", "off": [3.2, 0.7, 0.4]}, "at": {"rel": "hero", "off": [0.0, 1.0, -0.6]}, "fov": 46.0},
					{"t": 0.55, "pos": {"rel": "hero", "off": [3.0, 1.2, 1.0]}, "at": {"rel": "hero", "off": [0.0, 1.3, -1.0]}, "fov": 44.0},
					{"t": 1.0, "pos": [-6.4, 2.2, 21.4], "at": [-2.2, 0.6, 19.6], "fov": 42.0},
				],
				"shake": 0.2,
			}
		"d3_splash":
			# 21.0-22.0: slow motion at the water, then the action speeds
			# through the duck-under to the far shore
			return {
				"dur": 1.0, "tau0": 3.0, "trees": [TREE], "actors": chase_actors(), "arrows": chase_arrows(),
				"speed": [[0.0, 0.2], [0.5, 0.2], [0.72, 3.2], [1.0, 4.0]],
				"cam": [
					{"t": 0.0, "pos": [-7.7, 0.8, 23.2], "at": [-2.4, 0.9, 19.6], "fov": 34.0},
					{"t": 0.6, "pos": [-7.4, 0.95, 24.4], "at": [-2.3, 0.9, 20.0], "fov": 32.0},
					{"t": 1.0, "pos": [-5.0, 1.0, 33.6], "at": [0.0, 0.9, 30.6], "fov": 40.0, "ease": "in"},
				],
			}
		"d4_home_reveal":
			# 22.0-24.5: out of the water and away; the camera cranes up to
			# reveal the arrows running straight to the festive dorm
			return {
				"dur": 2.5, "tau0": 4.48, "trees": [TREE], "actors": chase_actors(), "arrows": chase_arrows(), "far": true,
				"cam": [
					{"t": 0.0, "pos": [-2.4, 0.55, 30.4], "at": {"rel": "hero", "off": [0.0, 0.9, 0.0], "tau": 4.53}, "fov": 48.0},
					{"t": 0.35, "pos": [-2.1, 0.9, 30.9], "at": {"rel": "hero", "off": [0.0, 0.95, 0.0]}, "fov": 47.0},
					{"t": 0.8, "pos": [-1.6, 1.5, 31.2], "at": {"rel": "hero", "off": [0.0, 1.0, 0.0]}, "fov": 46.0},
					{"t": 2.5, "pos": [-0.8, 6.8, 31.5], "at": [0.0, 1.6, 76.0], "fov": 44.0, "ease": "inout"},
				],
			}
		"d5_door":
			# 24.5-26.5: low in front of Puddlesworth Hall: the hero races at
			# the camera and through the glowing front door; the Night Watch
			# far behind
			return {
				"dur": 2.0, "tau0": DOOR_TAU - 2.0 - 0.1, "trees": [TREE], "actors": chase_actors(), "arrows": chase_arrows(), "far": true,
				"home_doors": "puddlesworth",
				"cam": [
					{"t": 0.0, "pos": [-1.6, 0.45, 98.6], "at": [0.0, 1.4, 84.0], "fov": 40.0},
					{"t": 1.4, "pos": [-1.8, 0.6, 100.2], "at": [0.0, 1.2, 96.0], "fov": 44.0},
					{"t": 2.0, "pos": [-2.4, 0.9, 99.4], "at": [-0.2, 1.6, 103.5], "fov": 50.0, "ease": "out"},
				],
				"shake": 0.2,
			}
		"d6_shush":
			# 26.5-27.75: the Night Watch stops on the quad, turns to us and
			# shushes: he let him win
			return {
				"dur": 1.5, "tau0": DOOR_TAU + 0.6, "trees": [TREE], "actors": chase_actors(), "arrows": chase_arrows(), "far": true,
				"cam": [
					{"t": 0.0, "pos": {"rel": "watch", "off": [0.45, 0.78, -3.5], "yaw_fixed": 0.0}, "at": {"rel": "watch", "off": [0.0, 1.12, 0.0], "yaw_fixed": 0.0}, "fov": 30.0},
					{"t": 1.5, "pos": {"rel": "watch", "off": [0.32, 0.8, -2.9], "yaw_fixed": 0.0}, "at": {"rel": "watch", "off": [0.0, 1.15, 0.0], "yaw_fixed": 0.0}, "fov": 30.0},
				],
			}
		# ---------------------------------------------------------------- tests
		"t_front":
			return {
				"dur": 2.0, "tau0": 0.0,
				"actors": chase_actors(), "arrows": chase_arrows(),
				"cam": [
					{"t": 0.0, "pos": {"rel": "hero", "off": [0.7, 0.45, -3.6]}, "at": {"rel": "hero", "off": [0.0, 0.85, 0.0]}, "fov": 46.0},
					{"t": 2.0, "pos": {"rel": "hero", "off": [-0.5, 0.35, -2.9]}, "at": {"rel": "hero", "off": [0.0, 0.9, 0.0]}, "fov": 44.0},
				],
			}
		"t_bench":
			var b := get_shot("t_front")
			b["dur"] = 0.25
			return b
		"t_map":
			# overview stills for blocking (camera high over a point)
			return {
				"dur": 1.0, "tau0": 0.0, "trees": [TREE], "actors": chase_actors(), "arrows": chase_arrows(), "far": true,
				"cam": [{"t": 0.0, "pos": [-30.0, 40.0, 75.0], "at": [0.0, 0.0, 45.0], "fov": 50.0}],
			}
	return {}
