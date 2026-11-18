shader_type spatial;
// Light from outside sweeping across the inside of the door glazing: a soft
// band (centre u, width w) masked to the four glazed lights of the doors.
render_mode unshaded, blend_add, depth_draw_never, cull_disabled, shadows_disabled;
uniform float u_c = 0.5;
uniform float width = 0.25;
uniform float intensity = 0.0;
uniform vec3 tint : source_color = vec3(1.0, 0.94, 0.8);
float box(vec2 p, vec2 c, vec2 h) {
	vec2 d = abs(p - c) - h;
	return 1.0 - smoothstep(-0.01, 0.01, max(d.x, d.y));
}
void fragment() {
	vec2 uv = UV;
	// four lights across the pair of leaves (x in uv 0..1 over 3.0 m)
	float m = 0.0;
	m += box(uv, vec2(0.164, 0.5), vec2(0.099, 0.48));
	m += box(uv, vec2(0.372, 0.5), vec2(0.099, 0.48));
	m += box(uv, vec2(0.628, 0.5), vec2(0.099, 0.48));
	m += box(uv, vec2(0.836, 0.5), vec2(0.099, 0.48));
	float band = exp(-pow((uv.x - u_c) / max(width, 0.001), 2.0));
	float grad = 0.75 + 0.25 * uv.y;
	ALBEDO = tint * m * band * grad * intensity;
}
