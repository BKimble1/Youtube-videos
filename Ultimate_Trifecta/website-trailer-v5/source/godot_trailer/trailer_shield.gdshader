shader_type spatial;
// The trailer's Pillow Shield: light only at the bubble's rim (fresnel), so
// the runner inside reads clearly instead of looking tinted and see-through.
render_mode unshaded, blend_add, depth_draw_never, cull_back, shadows_disabled;
uniform vec4 color : source_color = vec4(0.62, 0.88, 1.0, 1.0);
uniform float intensity = 0.85;
void fragment() {
	float f = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 2.6);
	ALBEDO = color.rgb * f * intensity;
}
