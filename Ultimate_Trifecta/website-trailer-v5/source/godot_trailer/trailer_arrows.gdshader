shader_type spatial;
// Trailer guide path: bright green chevrons on a ribbon laid on the ground
// (UV.x = metres along the route, UV.y = 0..1 across).  A pulse travels
// along the chevrons in the direction of travel; `reveal` (metres) lights
// the path progressively.
render_mode unshaded, cull_disabled, shadows_disabled, depth_draw_never, blend_add, fog_disabled;

uniform float t = 0.0;
uniform float spacing = 1.7;
uniform float reveal = 1000.0;
uniform float reveal_soft = 6.0;
uniform float energy = 1.0;
uniform vec3 color : source_color = vec3(0.25, 1.0, 0.42);
uniform float flow = 9.0;

void fragment() {
	float along = UV.x;
	float across = UV.y * 2.0 - 1.0;          // -1..1
	float cell = fract(along / spacing);
	// chevron pointing along +x: a V whose tip leads
	float tipx = 0.62;
	float v = cell - (tipx - abs(across) * 0.42);
	float stroke = 0.16;
	float chev = smoothstep(0.0, 0.03, v) * (1.0 - smoothstep(stroke, stroke + 0.03, v));
	chev *= 1.0 - smoothstep(0.86, 0.98, abs(across));
	// soft glow around each chevron
	float glow = exp(-pow((v - stroke * 0.5) / 0.22, 2.0)) * 0.22 * (1.0 - smoothstep(0.7, 1.0, abs(across)));
	// a pulse running forward
	float idx = floor(along / spacing);
	float pulse = 0.55 + 0.45 * pow(0.5 + 0.5 * sin(idx * 0.9 - t * flow), 3.0);
	float shown = 1.0 - smoothstep(reveal - reveal_soft, reveal, along);
	float a = (chev * 1.25 + glow) * pulse * shown * energy;
	ALBEDO = color * a * 2.6;
	ALPHA = 1.0;
}
