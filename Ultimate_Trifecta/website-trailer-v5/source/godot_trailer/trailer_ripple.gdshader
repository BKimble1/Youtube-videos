shader_type spatial;
// An expanding ring on the water where a body went in (alpha from the director).
render_mode unshaded, blend_mix, depth_draw_never, cull_disabled, shadows_disabled;
uniform float alpha = 0.6;
uniform float width = 0.12;
void fragment() {
	vec2 p = UV * 2.0 - 1.0;
	float r = length(p);
	float ring = smoothstep(1.0 - width, 1.0 - width * 0.5, r) * (1.0 - smoothstep(1.0 - width * 0.5, 1.0, r));
	ALBEDO = vec3(0.86, 0.94, 1.0);
	ALPHA = ring * alpha;
}
