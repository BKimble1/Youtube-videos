extends SceneTree
var _done := false
func _process(_d: float) -> bool:
	if _done:
		return true
	_done = true
	_dump()
	return true

func _dump() -> void:
	var L = CampusMaps.layout("classic")
	var out := {}
	var b := []
	for p in HideBushes.spots(L):
		b.append([p.x, p.y])
	out["bushes"] = b
	var paths := []
	for pth in L.paths:
		var pts := []
		for q in pth["pts"]:
			pts.append([q.x, q.y])
		paths.append({"w": pth["w"], "pts": pts})
	out["paths"] = paths
	var trees := []
	for tr in L.trees:
		trees.append([tr["pos"].x, tr["pos"].y, tr.get("r", 0.6)])
	out["trees"] = trees
	var lamps := []
	for l in L.lamps:
		lamps.append([l.x, l.y])
	out["lamps"] = lamps
	var cb := []
	for s in L.cart_blockers:
		cb.append([s["a"].x, s["a"].y, s["b"].x, s["b"].y, bool(s.get("hidden", false))])
	out["cart_blockers"] = cb
	var ww := []
	for w in L.walls:
		ww.append([w["a"].x, w["a"].y, w["b"].x, w["b"].y])
	out["walls_ab"] = ww
	var dd := []
	for d in L.dorm_doors:
		dd.append([d["pos"].x, d["pos"].y])
	out["dorm_doors"] = dd
	for k in ["bollards", "roads", "benches", "hedges", "walls", "shrubs", "buildings"]:
		if k in L:
			out[k] = var_to_str(L.get(k)).substr(0, 4000)
	var f := FileAccess.open("/home/user/ut/work/scout/map.json", FileAccess.WRITE)
	f.store_string(JSON.stringify(out))
	f.close()
	print("DUMPED")
