shader_type spatial;
// Trailer flashlight cone (CylinderMesh, UV.y 0 at the lens -> 1 at the far
// end): a soft additive shaft, brightest near the lens and along its axis.
render_mode blend_add, unshaded, cull_disabled, depth_draw_never, shadows_disabled, fog_disabled;

uniform vec3 color : source_color = vec3(1.0, 0.93, 0.78);
uniform float intensity = 0.35;

void fragment() {
	float along = clamp(UV.y, 0.0, 1.0);
	float facing = abs(dot(NORMAL, VIEW));
	float core = pow(facing, 2.2);
	float a = pow(1.0 - along, 1.6) * core;
	// dust motes drifting in the beam
	float n = fract(sin(dot(floor(vec2(UV.x * 80.0, UV.y * 40.0 - TIME * 3.0)), vec2(12.9898, 78.233))) * 43758.5453);
	a *= 0.85 + 0.3 * step(0.97, n);
	ALBEDO = color * intensity * a;
}
