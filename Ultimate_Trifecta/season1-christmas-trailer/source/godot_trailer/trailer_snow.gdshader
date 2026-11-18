shader_type spatial;
// Trailer snowfall: every flake's position is a pure function of scene time
// (no simulation), wrapped in a box that travels with the camera, so a shot
// renders the same flakes at any resolution and slows down with the scene in
// slow motion.  Flakes near the lens grow and soften (a cheap bokeh), distant
// ones fade into the night.
render_mode unshaded, cull_disabled, shadows_disabled, depth_draw_never, skip_vertex_transform, blend_mix, fog_disabled;

uniform float t = 0.0;
uniform vec3 cam_pos = vec3(0.0);
uniform vec3 box = vec3(56.0, 26.0, 56.0);
uniform vec3 wind = vec3(0.55, -1.05, 0.22);
uniform float size = 0.032;
uniform float near_soft = 3.2;
uniform float far_fade = 34.0;
uniform float opacity = 0.8;
uniform vec3 tint : source_color = vec3(0.90, 0.94, 1.0);

varying float v_alpha;
varying float v_soft;

void vertex() {
	vec4 r = INSTANCE_CUSTOM;
	float spd = mix(0.65, 1.35, r.w);
	vec3 p = r.xyz * box + wind * spd * t;
	p.x += sin(t * (0.6 + r.w * 0.8) + r.y * 37.0) * 0.45;
	p.z += cos(t * (0.5 + r.x * 0.7) + r.z * 29.0) * 0.45;
	vec3 rel = mod(p - cam_pos + box * 0.5, box) - box * 0.5;
	vec3 world = cam_pos + rel;
	vec3 vpos = (VIEW_MATRIX * vec4(world, 1.0)).xyz;
	float d = max(-vpos.z, 0.01);
	float s = size * mix(0.6, 1.5, fract(r.w * 13.7));
	// near the lens: bigger and softer (out of focus)
	float near_k = 1.0 - smoothstep(0.4, near_soft, d);
	s *= 1.0 + near_k * 1.4;
	v_soft = near_k;
	v_alpha = opacity * (1.0 - smoothstep(far_fade * 0.6, far_fade, d)) * mix(1.0, 0.18, near_k) * smoothstep(0.15, 0.6, d);
	VERTEX = vpos + vec3(VERTEX.xy * s, 0.0);
	NORMAL = vec3(0.0, 0.0, 1.0);
}

void fragment() {
	float rr = length(UV * 2.0 - 1.0);
	float edge = mix(0.35, 0.05, v_soft);
	float a = 1.0 - smoothstep(1.0 - edge - 0.5 * v_soft, 1.0, rr);
	ALBEDO = tint;
	ALPHA = clamp(a * v_alpha, 0.0, 1.0);
}
